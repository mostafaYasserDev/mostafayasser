import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, doc, getDoc, collection, query, where, getDocs } from '@/lib/firebase';

interface ServiceData {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  mainImage?: string;
  contentHtml?: string;
}

const SITE_URL = 'https://mostafayasser.online';

async function fetchService(rawId: string): Promise<ServiceData | null> {
  const decodedId = decodeURIComponent(rawId);
  try {
    // 1. Try slug
    const q = query(collection(db, 'services'), where('slug', '==', decodedId));
    const slugSnap = await getDocs(q);

    if (!slugSnap.empty) {
      const d = slugSnap.docs[0];
      return { id: d.id, ...(d.data() as Omit<ServiceData, 'id'>) };
    }

    // 2. Try doc ID
    const docSnap = await getDoc(doc(db, 'services', decodedId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as Omit<ServiceData, 'id'>) };
    }

    return null;
  } catch (err) {
    console.error('Error fetching service server-side:', err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const service = await fetchService(params.id);

  if (!service) {
    return {
      title: 'الخدمة غير موجودة | جذع',
      description: 'عذراً، لم نتمكن من العثور على الخدمة المطلوبة.',
    };
  }

  const title = `خدمة ${service.title} - مصطفى ياسر | جذع`;
  const description =
    service.description ||
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
  const service = await fetchService(params.id);

  if (!service) {
    notFound();
  }

  const serviceUrl = `${SITE_URL}/service/${encodeURIComponent(service.slug || service.id)}`;

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.description || service.title,
    image: service.mainImage || `${SITE_URL}/assets/logo.png`,
    url: serviceUrl,
    provider: {
      '@type': 'Person',
      name: 'مصطفى ياسر',
      url: SITE_URL,
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Worldwide',
    },
    inLanguage: 'ar',
  };

  return (
    <div className="view active" style={{ paddingTop: '20px', minHeight: '60vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />

      <section className="service-detail content-in">
        <Link href="/services" className="back-link">
          ← العودة للخدمات
        </Link>

        <h1 id="service-title" style={{ marginTop: '16px', marginBottom: '12px' }}>
          {service.title}
        </h1>

        {service.mainImage && (
          <div id="service-image-container" style={{ marginBottom: '30px' }}>
            <img
              src={service.mainImage}
              alt={service.title}
              className="content-in"
              style={{ width: '100%', maxHeight: '480px', objectFit: 'cover', borderRadius: '16px' }}
            />
          </div>
        )}

        <div
          className="service-body ql-editor-view"
          style={{ lineHeight: '1.9', fontSize: '1.1rem', marginBottom: '36px' }}
          dangerouslySetInnerHTML={{ __html: service.contentHtml || service.description || '' }}
        />

        <div className="service-cta" style={{ textAlign: 'center', marginTop: '30px' }}>
          <Link href="/contact" className="btn" style={{ padding: '14px 36px', fontSize: '1.1rem' }}>
            اطلب الخدمة الآن
          </Link>
        </div>
      </section>
    </div>
  );
}
