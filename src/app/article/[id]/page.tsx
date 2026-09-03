import React from 'react';
import type { Metadata } from 'next';
import { db, collection, getDocs } from '@/lib/firebase';
import { fetchDocBySlugOrId, PublicArticle, robustDecode, getPublicImageUrl } from '@/lib/public-fetch';
import ArticleDetailClient from './ArticleDetailClient';

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

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const article = await fetchDocBySlugOrId<PublicArticle>('articles', params.id);

  if (!article) {
    return {
      title: 'المقال | جذع - مصطفى ياسر',
      description: 'مقالات وحكايات في تطوير الويب والبرمجة مع مصطفى ياسر.',
    };
  }

  const title = `${article.title} | جذع`;
  const description =
    article.shortDescription ||
    `اقرأ مقال "${article.title}" بقلم مصطفى ياسر على موقع جذع. مقالات وحكايات في تطوير الويب والبرمجة.`;
  const image = getPublicImageUrl(article.coverImage, 'articles', article.id);
  const canonicalUrl = `${SITE_URL}/article/${encodeURIComponent(article.slug || article.id)}`;

  return {
    title,
    description,
    authors: [{ name: article.author || 'مصطفى ياسر' }],
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
      authors: [article.author || 'مصطفى ياسر'],
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
  const article = await fetchDocBySlugOrId<PublicArticle>('articles', params.id);
  const articleUrl = article
    ? `${SITE_URL}/article/${encodeURIComponent(article.slug || article.id)}`
    : SITE_URL;

  const articleJsonLd = article
    ? {
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
          name: article.author || 'مصطفى ياسر',
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
      }
    : null;

  return (
    <>
      {articleJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
      )}
      <ArticleDetailClient initialArticle={article} paramId={params.id} />
    </>
  );
}
