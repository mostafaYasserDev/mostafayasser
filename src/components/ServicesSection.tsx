'use strict';
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { db, collection, getDocs, query, where, limit } from '@/lib/firebase';
import { getCachedData, setCachedData } from '@/lib/public-cache';
import SkeletonCards from './SkeletonCards';
import EmptyState from './EmptyState';

export interface ServiceData {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  mainImage?: string;
  featured?: boolean;
  createdAt?: number;
}

export default function ServicesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // 1. Try cache
    const cached = getCachedData<ServiceData[]>('featured_services');
    if (cached) {
      setServices(cached);
      setLoading(false);
      hasLoadedRef.current = true;
    }

    const loadServices = async () => {
      if (hasLoadedRef.current) return;
      hasLoadedRef.current = true;

      try {
        setLoading(true);
        setError(false);
        const q = query(
          collection(db, 'services'),
          where('featured', '==', true),
          limit(3)
        );
        const snap = await getDocs(q);

        const items: ServiceData[] = [];
        snap.forEach((doc) => {
          items.push({ id: doc.id, ...(doc.data() as Omit<ServiceData, 'id'>) });
        });

        setServices(items);
        setCachedData('featured_services', items);
      } catch (err) {
        console.error('Error fetching featured services:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (hasLoadedRef.current) return;

    if (typeof window !== 'undefined' && 'IntersectionObserver' in window && sectionRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            observer.disconnect();
            loadServices();
          }
        },
        { rootMargin: '300px' }
      );

      observer.observe(sectionRef.current);
      return () => observer.disconnect();
    } else {
      loadServices();
    }
  }, []);

  return (
    <section ref={sectionRef} id="services" data-aos="fade-up">
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
            <p>تعذر تحميل الخدمات. يرجى المحاولة لاحقاً.</p>
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
                      decoding="async"
                    />
                  </div>
                )}
                <div className="card-content">
                  <h3 className="card-title">{s.title}</h3>
                  <p className="card-desc">{s.description}</p>
                  <Link href={`/service/${routeId}`} className="btn">
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
