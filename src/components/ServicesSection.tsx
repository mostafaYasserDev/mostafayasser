'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db, collection, getDocs, query, where, limit } from '@/lib/firebase';
import SkeletonCards from './SkeletonCards';
import EmptyState from './EmptyState';

export interface ServiceData {
  id: string;
  title: string;
  description: string;
  mainImage?: string;
  slug?: string;
  featured?: boolean;
  createdAt?: number;
}

export default function ServicesSection() {
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchFeaturedServices() {
      try {
        setLoading(true);
        setError(false);

        // Try featured first, fallback to all recent
        let q = query(collection(db, 'services'), where('featured', '==', true), limit(3));
        let snap = await getDocs(q);

        if (snap.empty) {
          q = query(collection(db, 'services'), limit(3));
          snap = await getDocs(q);
        }

        const items: ServiceData[] = [];
        snap.forEach((doc) => {
          items.push({ id: doc.id, ...(doc.data() as Omit<ServiceData, 'id'>) });
        });

        // Sort by createdAt descending if exists
        items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        setServices(items.slice(0, 3));
      } catch (err) {
        console.error('Error fetching services from Firestore:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedServices();
  }, []);

  return (
    <section id="services" className="services-section" style={{ marginBottom: '60px' }}>
      <div className="section-header">
        <h2 className="section-title">أبرز الخدمات</h2>
        <Link href="/services" className="view-all-link">
          عرض الكل <i className="fas fa-arrow-left" />
        </Link>
      </div>

      <div className="grid" id="services-grid">
        {loading && <SkeletonCards count={3} />}

        {error && (
          <div className="error-state" style={{ gridColumn: '1 / -1' }}>
            <p>تعذر تحميل الخدمات.</p>
          </div>
        )}

        {!loading && !error && services.length === 0 && (
          <EmptyState type="services" />
        )}

        {!loading &&
          !error &&
          services.map((s) => {
            const routeId = encodeURIComponent(String(s.slug || s.id));
            return (
              <div key={s.id} className="card content-in">
                {s.mainImage && (
                  <div className="card-img-wrapper">
                    <img
                      src={s.mainImage}
                      alt={s.title}
                      className="card-img"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="card-content">
                  <h3 className="card-title">{s.title}</h3>
                  <p className="card-desc">{s.description}</p>
                  <Link href={`/service/${routeId}`} className="btn btn-sm-card">
                    تفاصيل الخدمة
                  </Link>
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
