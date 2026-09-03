'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db, collection, getDocs, query } from '@/lib/firebase';
import SkeletonCards from '@/components/SkeletonCards';
import EmptyState from '@/components/EmptyState';
import { ServiceData } from '@/components/ServicesSection';

const PAGE_SIZE = 6;

export default function AllServicesPage() {
  const [allServices, setAllServices] = useState<ServiceData[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchAllServices() {
      try {
        setLoading(true);
        setError(false);
        const q = query(collection(db, 'services'));
        const snap = await getDocs(q);

        const items: ServiceData[] = [];
        snap.forEach((doc) => {
          items.push({ id: doc.id, ...(doc.data() as Omit<ServiceData, 'id'>) });
        });

        // Sort by createdAt descending if exists
        items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setAllServices(items);
      } catch (err) {
        console.error('Error fetching all services:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchAllServices();
  }, []);

  const displayedServices = allServices.slice(0, visibleCount);
  const hasMore = visibleCount < allServices.length;

  return (
    <div className="view active" style={{ paddingTop: '20px', minHeight: '60vh' }}>
      <section>
        <div className="section-header">
          <h1 className="section-title">جميع الخدمات</h1>
        </div>

        <div className="grid" id="all-services-grid">
          {loading && <SkeletonCards count={6} />}

          {error && (
            <div className="error-state" style={{ gridColumn: '1 / -1' }}>
              <p>تعذر تحميل الخدمات. يرجى المحاولة لاحقاً.</p>
            </div>
          )}

          {!loading && !error && allServices.length === 0 && (
            <EmptyState type="services" />
          )}

          {!loading &&
            !error &&
            displayedServices.map((s) => {
              const targetSlug = s.slug || s.id;
              return (
                <div key={s.id} className="card content-in">
                  {s.mainImage && (
                    <div className="card-img-wrapper">
                      <img
                        src={s.mainImage}
                        alt={`صورة خدمة ${s.title} - خدمات مصطفى ياسر (جذع)`}
                        className="card-img"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="card-content">
                    <h3 className="card-title">{s.title}</h3>
                    <p className="card-desc">{s.description}</p>
                    <Link href={`/service/${targetSlug}`} className="btn">
                      تفاصيل الخدمة
                    </Link>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Load more button when more items exist */}
        {!loading && !error && hasMore && (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <button
              id="load-more-btn"
              className="btn"
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              type="button"
            >
              عرض المزيد
            </button>
          </div>
        )}

        {/* Poetic ending note when all items have been loaded */}
        {!loading && !error && !hasMore && allServices.length > PAGE_SIZE && (
          <div
            style={{
              textAlign: 'center',
              marginTop: '40px',
              padding: '16px 20px',
              color: 'var(--text-muted)',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>🌿</span>
            <span>خدمات وحلول تقنية تتطور وتنمو باستمرار</span>
          </div>
        )}
      </section>
    </div>
  );
}
