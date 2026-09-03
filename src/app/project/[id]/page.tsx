import React from 'react';
import type { Metadata } from 'next';
import { db, collection, getDocs } from '@/lib/firebase';
import { fetchDocBySlugOrId, PublicProject, robustDecode, getPublicImageUrl } from '@/lib/public-fetch';
import ProjectDetailClient from './ProjectDetailClient';

const SITE_URL = 'https://mostafayasser.online';

export async function generateStaticParams() {
  try {
    const snap = await getDocs(collection(db, 'projects'));
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
    console.error('Error generating static params for projects:', err);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const project = await fetchDocBySlugOrId<PublicProject>('projects', params.id);

  if (!project) {
    return {
      title: 'المشروع | جذع - مصطفى ياسر',
      description: 'أعمال ومشاريع وتطبيقات برمجية نفذها المطور مصطفى ياسر.',
    };
  }

  const title = `مشروع ${project.title} - أعمال وتطبيقات مصطفى ياسر`;
  const description =
    project.shortDescription ||
    `استكشف تفاصيل وتقنيات مشروع ${project.title} المنفذ بواسطة المطور مصطفى ياسر (جذع). حلول برمجية وتصميم واجهات حديثة.`;
  const image = getPublicImageUrl(project.mainImage, 'projects', project.id);
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
  const project = await fetchDocBySlugOrId<PublicProject>('projects', params.id);
  const projectUrl = project
    ? `${SITE_URL}/project/${encodeURIComponent(project.slug || project.id)}`
    : SITE_URL;

  const projectJsonLd = project
    ? {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'SoftwareApplication',
            name: project.title,
            description: project.shortDescription || project.title,
            applicationCategory: 'WebApplication',
            operatingSystem: 'All',
            url: projectUrl,
            image: getPublicImageUrl(project.mainImage, 'projects', project.id),
            author: {
              '@type': 'Person',
              name: 'مصطفى ياسر',
              url: SITE_URL,
            },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'الرئيسية',
                item: SITE_URL,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'المشاريع',
                item: `${SITE_URL}/projects`,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: project.title,
                item: projectUrl,
              },
            ],
          },
        ],
      }
    : null;

  return (
    <>
      {projectJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(projectJsonLd) }}
        />
      )}
      <ProjectDetailClient initialProject={project} paramId={params.id} />
    </>
  );
}
