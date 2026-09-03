'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PublicService, fetchDocBySlugOrId, robustDecode } from '@/lib/public-fetch';
import HtmlContentRenderer from '@/components/HtmlContentRenderer';

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

  const [relatedServices, setRelatedServices] = useState<PublicService[]>([]);

  useEffect(() => {
    async function loadRelated() {
      try {
        const { collection, getDocs, limit, query } = await import('@/lib/firebase');
        const snap = await getDocs(query(collection((await import('@/lib/firebase')).db, 'services'), limit(20)));
        const items: PublicService[] = [];
        snap.forEach((d) => {
          const data = d.data();
          const docId = d.id;
          const docSlug = data.slug || '';
          if (docId !== service?.id && docSlug !== service?.slug && docSlug !== service?.id && docId !== service?.slug) {
            items.push({
              id: docId,
              title: data.title || '',
              slug: docSlug || docId,
              mainImage: data.mainImage || data.coverImage || '',
              description: data.description || '',
            });
          }
        });

        // Smart dynamic shuffle to display varied recommendations
        const shuffled = items.sort(() => 0.5 - Math.random());
        setRelatedServices(shuffled.slice(0, 3));
      } catch {}
    }
    if (service) {
      loadRelated();
    }
  }, [service]);

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
        {/* Semantic Breadcrumbs Navigation */}
        <nav
          aria-label="Breadcrumb"
          style={{
            marginBottom: '20px',
            fontSize: '0.95rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <Link href="/" style={{ color: 'var(--text-muted)' }}>
            الرئيسية
          </Link>
          <span>/</span>
          <Link href="/services" style={{ color: 'var(--text-muted)' }}>
            الخدمات
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{service.title}</span>
        </nav>

        <div className="detail-header">
          <span className="trunk-badge">خدمة</span>
          <h1 id="service-title" style={{ marginTop: '14px', marginBottom: '12px', lineHeight: 1.4 }}>
            {service.title}
          </h1>
        </div>

        {service.mainImage && (
          <div id="service-cover-container" style={{ marginBottom: '30px' }}>
            <img
              src={service.mainImage}
              alt={`صورة خدمة ${service.title} - خدمات مصطفى ياسر (جذع)`}
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
          <h2 style={{ color: 'var(--primary)', marginBottom: '20px' }}>تفاصيل ومميزات الخدمة</h2>
          <HtmlContentRenderer
            content={service.description}
            className="ql-editor-view"
          />
          <div style={{ marginTop: '35px' }}>
            <Link href="/contact" className="btn" style={{ padding: '12px 30px', fontSize: '1.1rem' }}>
              اطلب الخدمة الآن
            </Link>
          </div>
        </div>

        {/* Related Services Section for Enhanced Internal Linking */}
        {relatedServices.length > 0 && (
          <div style={{ marginTop: '60px', paddingTop: '30px', borderTop: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.4rem', color: 'var(--text-main)' }}>
              خدمات أخرى مقدمة
            </h3>
            <div className="grid" style={{ marginBottom: '30px' }}>
              {relatedServices.map((rel) => (
                <div key={rel.id} className="card content-in" style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '1.15rem', marginBottom: '10px', color: 'var(--primary)' }}>{rel.title}</h4>
                  <p className="card-desc" style={{ fontSize: '0.9rem', marginBottom: '15px' }}>
                    {rel.description.replace(/<[^>]*>/g, '').slice(0, 100)}...
                  </p>
                  <Link href={`/service/${rel.slug || rel.id}`} className="btn" style={{ fontSize: '0.9rem', padding: '8px 16px' }}>
                    تفاصيل الخدمة
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px' }}>
          <Link href="/services" className="btn" style={{ background: 'var(--text-muted)' }}>
            ← العودة لكافة الخدمات
          </Link>
        </div>
      </section>
    </div>
  );
}
