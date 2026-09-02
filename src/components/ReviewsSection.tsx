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
    <section ref={sectionRef} id="reviews" data-aos="fade-up">
      <div className="section-header">
        <h2 className="section-title">آراء العملاء</h2>
        <Link href="/client/write-review" className="view-all-link">
          أضف رأيك <i className="fas fa-plus" />
        </Link>
      </div>

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
              <div className="review-header">
                <div className="review-avatar">
                  {r.clientName.charAt(0).toUpperCase()}
                </div>
                <div className="review-author-info">
                  <h4>{r.clientName}</h4>
                  {r.serviceName && <span className="service-tag">{r.serviceName}</span>}
                </div>
              </div>
              <p className="review-text">"{r.reviewText}"</p>
              {r.date && <div className="review-date">{r.date}</div>}
            </div>
          ))}
      </div>
    </section>
  );
}
