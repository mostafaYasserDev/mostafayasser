import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, doc, getDoc, collection, query, where, getDocs } from '@/lib/firebase';

interface ArticleData {
  id: string;
  title: string;
  slug?: string;
  publishDate?: string;
  coverImage?: string;
  contentHtml?: string;
  shortDescription?: string;
}

const SITE_URL = 'https://mostafayasser.online';

export async function generateStaticParams() {
  try {
    const snap = await getDocs(collection(db, 'articles'));
    const paramsList: { id: string }[] = [];
    snap.forEach((d) => {
      const data = d.data();
      if (data.slug) {
        paramsList.push({ id: data.slug });
      }
      paramsList.push({ id: d.id });
    });
    return paramsList;
  } catch (err) {
    console.error('Error generating static params for articles:', err);
    return [];
  }
}

async function fetchArticle(rawId: string): Promise<ArticleData | null> {
  const decodedId = decodeURIComponent(rawId);
  try {
    // 1. Try slug
    const q = query(collection(db, 'articles'), where('slug', '==', decodedId));
    const slugSnap = await getDocs(q);

    if (!slugSnap.empty) {
      const d = slugSnap.docs[0];
      return { id: d.id, ...(d.data() as Omit<ArticleData, 'id'>) };
    }

    // 2. Try doc ID
    const docSnap = await getDoc(doc(db, 'articles', decodedId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as Omit<ArticleData, 'id'>) };
    }

    return null;
  } catch (err) {
    console.error('Error fetching article server-side:', err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const article = await fetchArticle(params.id);

  if (!article) {
    return {
      title: 'المقال غير موجود | جذع',
      description: 'عذراً، لم نتمكن من العثور على المقال المطلوب.',
    };
  }

  const title = article.title;
  const description =
    article.shortDescription ||
    `اقرأ مقال "${article.title}" بقلم مصطفى ياسر على موقع جذع. مقالات وحكايات في تطوير الويب والبرمجة.`;
  const image = article.coverImage || `${SITE_URL}/assets/logo.png`;
  const canonicalUrl = `${SITE_URL}/article/${encodeURIComponent(article.slug || article.id)}`;

  return {
    title,
    description,
    authors: [{ name: 'مصطفى ياسر' }],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'جذع - حكاية تنمو | مصطفى ياسر',
      locale: 'ar_AR',
      type: 'article',
      publishedTime: article.publishDate,
      authors: ['مصطفى ياسر'],
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@mostafayasser',
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const article = await fetchArticle(params.id);

  if (!article) {
    notFound();
  }

  const articleUrl = `${SITE_URL}/article/${encodeURIComponent(article.slug || article.id)}`;

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.shortDescription || article.title,
    image: article.coverImage || `${SITE_URL}/assets/logo.png`,
    datePublished: article.publishDate || new Date().toISOString(),
    dateModified: article.publishDate || new Date().toISOString(),
    url: articleUrl,
    author: {
      '@type': 'Person',
      name: 'مصطفى ياسر',
      url: SITE_URL,
      sameAs: 'https://github.com/mostafaYasserDev',
    },
    publisher: {
      '@type': 'Organization',
      name: 'جذع',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/assets/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    inLanguage: 'ar',
  };

  return (
    <div className="view active" style={{ paddingTop: '20px', minHeight: '60vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <section className="article-detail content-in">
        <Link href="/articles" className="back-link">
          ← العودة للمقالات
        </Link>

        <h1 id="article-title" style={{ marginTop: '16px', marginBottom: '12px' }}>
          {article.title}
        </h1>

        {article.publishDate && (
          <div className="article-meta" style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            <span>{article.publishDate}</span>
          </div>
        )}

        {article.coverImage && (
          <div id="article-cover-container" style={{ marginBottom: '30px' }}>
            <img
              src={article.coverImage}
              alt={article.title}
              className="content-in"
              style={{ width: '100%', maxHeight: '480px', objectFit: 'cover', borderRadius: '16px' }}
            />
          </div>
        )}

        <div
          className="article-body ql-editor-view"
          dangerouslySetInnerHTML={{ __html: article.contentHtml || article.shortDescription || '' }}
        />
      </section>
    </div>
  );
}
