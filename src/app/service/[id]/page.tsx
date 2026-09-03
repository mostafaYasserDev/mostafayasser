import React from 'react';
import type { Metadata } from 'next';
import { db, collection, getDocs } from '@/lib/firebase';
import { fetchDocBySlugOrId, PublicService, robustDecode } from '@/lib/public-fetch';
import ServiceDetailClient from './ServiceDetailClient';

const SITE_URL = 'https://mostafayasser.online';

export async function generateStaticParams() {
  try {
    const snap = await getDocs(collection(db, 'services'));
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
    console.error('Error generating static params for services:', err);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const service = await fetchDocBySlugOrId<PublicService>('services', params.id);

  if (!service) {
    return {
      title: 'الخدمة | جذع - مصطفى ياسر',
      description: 'خدمات برمجية وحلول ويب متقدمة يقدمها المطور مصطفى ياسر.',
    };
  }

  const title = `خدمة ${service.title} - مصطفى ياسر | جذع`;
  const description =
    service.description.replace(/<[^>]*>/g, '').slice(0, 160) ||
    `تعرف على تفاصيل ومميزات خدمة ${service.title} المقدمة من المطور مصطفى ياسر (جذع). حلول برمجية احترافية واستشارات تقنية.`;
  const image = service.mainImage || `${SITE_URL}/assets/logo.png`;
  const canonicalUrl = `${SITE_URL}/service/${encodeURIComponent(service.slug || service.id)}`;

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

export default async function ServiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const service = await fetchDocBySlugOrId<PublicService>('services', params.id);
  const serviceUrl = service
    ? `${SITE_URL}/service/${encodeURIComponent(service.slug || service.id)}`
    : SITE_URL;

  const serviceJsonLd = service
    ? {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: service.title,
        description: service.description.replace(/<[^>]*>/g, '').slice(0, 250),
        provider: {
          '@type': 'Person',
          name: 'مصطفى ياسر',
          url: SITE_URL,
        },
        url: serviceUrl,
        image: service.mainImage || `${SITE_URL}/assets/logo.png`,
      }
    : null;

  return (
    <>
      {serviceJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
        />
      )}
      <ServiceDetailClient initialService={service} paramId={params.id} />
    </>
  );
}
