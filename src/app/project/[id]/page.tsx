import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, doc, getDoc, collection, query, where, getDocs } from '@/lib/firebase';

interface ProjectData {
  id: string;
  title: string;
  slug?: string;
  shortDescription?: string;
  mainImage?: string;
  contentHtml?: string;
  demoUrl?: string;
  codeUrl?: string;
}

const SITE_URL = 'https://mostafayasser.online';

async function fetchProject(rawId: string): Promise<ProjectData | null> {
  const decodedId = decodeURIComponent(rawId);
  try {
    // 1. Try slug
    const q = query(collection(db, 'projects'), where('slug', '==', decodedId));
    const slugSnap = await getDocs(q);

    if (!slugSnap.empty) {
      const d = slugSnap.docs[0];
      return { id: d.id, ...(d.data() as Omit<ProjectData, 'id'>) };
    }

    // 2. Try doc ID
    const docSnap = await getDoc(doc(db, 'projects', decodedId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as Omit<ProjectData, 'id'>) };
    }

    return null;
  } catch (err) {
    console.error('Error fetching project server-side:', err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const project = await fetchProject(params.id);

  if (!project) {
    return {
      title: 'المشروع غير موجود | جذع',
      description: 'عذراً، لم نتمكن من العثور على المشروع المطلوب.',
    };
  }

  const title = `مشروع ${project.title} - أعمال وتطبيقات مصطفى ياسر`;
  const description =
    project.shortDescription ||
    `استكشف تفاصيل وتقنيات مشروع ${project.title} المنفذ بواسطة المطور مصطفى ياسر (جذع). حلول برمجية وتصميم واجهات حديثة.`;
  const image = project.mainImage || `${SITE_URL}/assets/logo.png`;
  const canonicalUrl = `${SITE_URL}/project/${encodeURIComponent(project.slug || project.id)}`;

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
      type: 'website',
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

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const project = await fetchProject(params.id);

  if (!project) {
    notFound();
  }

  const projectUrl = `${SITE_URL}/project/${encodeURIComponent(project.slug || project.id)}`;

  const projectJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: project.title,
    description: project.shortDescription || project.title,
    image: project.mainImage || `${SITE_URL}/assets/logo.png`,
    url: projectUrl,
    applicationCategory: 'WebApplication',
    operatingSystem: 'Any modern web browser',
    author: {
      '@type': 'Person',
      name: 'مصطفى ياسر',
      url: SITE_URL,
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    inLanguage: 'ar',
  };

  return (
    <div className="view active" style={{ paddingTop: '20px', minHeight: '60vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(projectJsonLd) }}
      />

      <section className="project-detail content-in">
        <Link href="/projects" className="back-link">
          ← العودة للمشاريع
        </Link>

        <h1 id="project-title" style={{ marginTop: '16px', marginBottom: '12px' }}>
          {project.title}
        </h1>

        {project.mainImage && (
          <div id="project-image-container" style={{ marginBottom: '30px' }}>
            <img
              src={project.mainImage}
              alt={project.title}
              className="content-in"
              style={{ width: '100%', maxHeight: '480px', objectFit: 'cover', borderRadius: '16px' }}
            />
          </div>
        )}

        {(project.demoUrl || project.codeUrl) && (
          <div className="project-links" style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {project.demoUrl && (
              <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="btn">
                <i className="fas fa-external-link-alt" /> معاينة المشروع
              </a>
            )}
            {project.codeUrl && (
              <a href={project.codeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                <i className="fab fa-github" /> كود المشروع
              </a>
            )}
          </div>
        )}

        <div
          className="project-body ql-editor-view"
          dangerouslySetInnerHTML={{ __html: project.contentHtml || project.shortDescription || '' }}
        />
      </section>
    </div>
  );
}
