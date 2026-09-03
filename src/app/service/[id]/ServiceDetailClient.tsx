'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PublicService, fetchDocBySlugOrId, robustDecode } from '@/lib/public-fetch';

interface Props {
  initialService?: PublicService | null;
  paramId: string;
}

export default function ServiceDetailClient({ initialService, paramId }: Props) {
  const params = useParams();
  const activeId = String(params?.id || paramId || '');
  const [service, setService] = useState<PublicService | null>(initialService || null);
  const [loading, setLoading] = useState(!initialService);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!activeId) return;

    if (
      initialService &&
      (initialService.id === activeId ||
        initialService.slug === activeId ||
        initialService.slug === robustDecode(activeId))
    ) {
      setService(initialService);
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(false);
        const data = await fetchDocBySlugOrId<PublicService>('services', activeId);
        if (!isMounted) return;

        if (data) {
          setService(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error in ServiceDetailClient:', err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [activeId, initialService]);

  if (loading) {
    return (
      <div className="view active" style={{ paddingTop: '40px', minHeight: '60vh' }}>
        <div className="skeleton-line" style={{ height: '32px', width: '40%', margin: '0 auto 20px' }} />
        <div className="skeleton-line" style={{ height: '200px', width: '100%', marginBottom: '20px', borderRadius: '16px' }} />
        <div className="skeleton-line" style={{ height: '18px', width: '90%', marginBottom: '10px' }} />
        <div className="skeleton-line" style={{ height: '18px', width: '75%' }} />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="view active" style={{ paddingTop: '40px', minHeight: '60vh', textAlign: 'center' }}>
        <div className="detail-header">
          <span className="trunk-badge" style={{ background: 'var(--danger)', color: '#fff' }}>عذراً</span>
          <h2 style={{ marginTop: '16px' }}>الخدمة غير موجودة</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', margin: '15px 0 25px', fontSize: '1.1rem' }}>
          لم نتمكن من العثور على الخدمة المطلوبة. ربما تم تعديل الرابط أو حذفه.
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
        <Link href="/services" className="back-link" style={{ marginBottom: '20px', display: 'inline-block' }}>
          ← العودة للخدمات
        </Link>

        <div className="detail-header">
          <span className="trunk-badge">خدمة</span>
          <h1 id="service-title" style={{ marginTop: '14px', marginBottom: '12px' }}>
            {service.title}
          </h1>
        </div>

        {service.mainImage && (
          <div id="service-cover-container" style={{ marginBottom: '30px' }}>
            <img
              src={service.mainImage}
              alt={service.title}
              className="detail-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        )}

        <div
          className="detail-content glass-panel"
          style={{
            padding: '40px 24px',
            borderRadius: '20px',
            textAlign: 'center',
            marginTop: '30px',
          }}
        >
          <h2 style={{ color: 'var(--primary)', marginBottom: '20px' }}>تفاصيل الخدمة</h2>
          <div
            className="ql-editor-view"
            style={{ fontSize: '1.15rem', lineHeight: 2, margin: '20px 0' }}
            dangerouslySetInnerHTML={{ __html: service.description }}
          />
          <div style={{ marginTop: '35px' }}>
            <Link href="/contact" className="btn" style={{ padding: '12px 30px', fontSize: '1.1rem' }}>
              اطلب الخدمة الآن
            </Link>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px dashed var(--border-color)' }}>
          <Link href="/services" className="btn" style={{ background: 'var(--text-muted)' }}>
            العودة للخدمات
          </Link>
        </div>
      </section>
    </div>
  );
}
