'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { db, doc, getDoc, collection, query, where, getDocs } from '@/lib/firebase';

interface ServiceData {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  mainImage?: string;
  contentHtml?: string;
}

export default function ServiceDetailPage() {
  const params = useParams();
  const rawId = params?.id ? decodeURIComponent(String(params.id)) : '';
  const [service, setService] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!rawId) return;

    async function loadService() {
      try {
        setLoading(true);
        // 1. Try slug
        const q = query(collection(db, 'services'), where('slug', '==', rawId));
        const slugSnap = await getDocs(q);

        if (!slugSnap.empty) {
          const d = slugSnap.docs[0];
          setService({ id: d.id, ...(d.data() as Omit<ServiceData, 'id'>) });
          setLoading(false);
          return;
        }

        // 2. Try doc ID
        const docSnap = await getDoc(doc(db, 'services', rawId));
        if (docSnap.exists()) {
          setService({ id: docSnap.id, ...(docSnap.data() as Omit<ServiceData, 'id'>) });
          setLoading(false);
          return;
        }

        setNotFound(true);
      } catch (err) {
        console.error('Error fetching service:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadService();
  }, [rawId]);

  if (loading) {
    return (
      <div className="view active" style={{ paddingTop: '40px', minHeight: '60vh' }}>
        <div className="skeleton-line" style={{ height: '32px', width: '40%', marginBottom: '20px' }} />
        <div className="skeleton-line" style={{ height: '200px', width: '100%', marginBottom: '20px' }} />
        <div className="skeleton-line" style={{ height: '16px', width: '80%', marginBottom: '10px' }} />
        <div className="skeleton-line" style={{ height: '16px', width: '70%' }} />
      </div>
    );
  }

  if (notFound || !service) {
    return (
      <div className="view active" style={{ paddingTop: '40px', minHeight: '60vh', textAlign: 'center' }}>
        <h2>الخدمة غير موجودة</h2>
        <p style={{ color: 'var(--text-muted)', margin: '15px 0 25px' }}>
          عذراً، لم نتمكن من العثور على الخدمة المطلوبة.
        </p>
        <Link href="/services" className="btn">
          العودة للخدمات
        </Link>
      </div>
    );
  }

  return (
    <div className="view active" style={{ paddingTop: '20px', minHeight: '60vh' }}>
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
