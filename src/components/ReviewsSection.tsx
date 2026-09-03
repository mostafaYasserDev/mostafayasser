'use strict';
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { db, collection, getDocs, query, where, limit } from '@/lib/firebase';
import { getCachedData, setCachedData } from '@/lib/public-cache';
import SkeletonCards from './SkeletonCards';
import EmptyState from './EmptyState';

export interface ReviewData {
  id: string;
  clientName: string;
  serviceName?: string;
  reviewText: string;
  date?: string;
  visible?: boolean;
}

export default function ReviewsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // 1. Try cache
    const cached = getCachedData<ReviewData[]>('public_reviews');
    if (cached) {
      setReviews(cached);
      setLoading(false);
      hasLoadedRef.current = true;
    }

    const loadReviews = async () => {
      if (hasLoadedRef.current) return;
      hasLoadedRef.current = true;

      try {
        setLoading(true);
        setError(false);
        const q = query(
          collection(db, 'reviews'),
          where('visible', '==', true),
          limit(6)
        );
        const snap = await getDocs(q);

        const items: ReviewData[] = [];
        snap.forEach((doc) => {
          items.push({ id: doc.id, ...(doc.data() as Omit<ReviewData, 'id'>) });
        });

        setReviews(items);
        setCachedData('public_reviews', items);
      } catch (err) {
        console.error('Error fetching reviews:', err);
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
            loadReviews();
          }
        },
        { rootMargin: '300px' }
      );

      observer.observe(sectionRef.current);
      return () => observer.disconnect();
    } else {
      loadReviews();
    }
  }, []);

  return (
    <section ref={sectionRef} id="reviews" className="reviews-section" data-aos="fade-up" style={{ marginBottom: '80px' }}>
      <h2 className="section-title" style={{ color: 'var(--text-main)', textAlign: 'center' }}>
        ماذا قالوا عن جذع؟
      </h2>
      <p className="reviews-scroll-hint">
        <i className="fas fa-hand-pointer" /> اسحب للمزيد من الآراء
      </p>

      <div className="reviews-grid" id="reviews-grid">
        {loading && <SkeletonCards count={3} />}

        {error && (
          <div className="error-state" style={{ gridColumn: '1 / -1' }}>
            <p>تعذر تحميل الآراء. يرجى المحاولة لاحقاً.</p>
          </div>
        )}

        {!loading && !error && reviews.length === 0 && (
          <EmptyState type="reviews" />
        )}

        {!loading &&
          !error &&
          reviews.map((r) => (
            <div key={r.id} className="review-card content-in">
              {r.serviceName && (
                <span className="review-service">{r.serviceName}</span>
              )}
              <h4 style={{ fontSize: '1.2rem', marginBottom: '15px', color: 'var(--primary)' }}>
                {r.clientName}
              </h4>
              <p style={{ fontSize: '1.1rem', lineHeight: '1.6', fontStyle: 'italic' }}>
                "{r.reviewText}"
              </p>
            </div>
          ))}
      </div>

      <p className="reviews-cta">
        هل عملنا معاً؟{' '}
        <Link href="/client/write-review">شاركنا رأيك</Link>
      </p>
    </section>
  );
}
