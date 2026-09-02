'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db, collection, getDocs, query, where, limit } from '@/lib/firebase';
import EmptyState from './EmptyState';

export interface ReviewData {
  id: string;
  clientName: string;
  reviewText: string;
  serviceName?: string;
  visible?: boolean;
  createdAt?: number;
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchReviews() {
      try {
        setLoading(true);
        setError(false);

        // Try visible reviews first
        let q = query(
          collection(db, 'reviews'),
          where('visible', '==', true),
          limit(8)
        );
        let snap = await getDocs(q);

        if (snap.empty) {
          q = query(collection(db, 'reviews'), limit(8));
          snap = await getDocs(q);
        }

        const items: ReviewData[] = [];
        snap.forEach((doc) => {
          items.push({ id: doc.id, ...(doc.data() as Omit<ReviewData, 'id'>) });
        });

        // Sort by createdAt descending if exists
        items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        setReviews(items);
      } catch (err) {
        console.error('Error fetching reviews from Firestore:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, []);

  return (
    <section className="reviews-section" style={{ marginBottom: '70px' }}>
      <h2 className="section-title" style={{ color: 'var(--text-main)' }}>
        ماذا قالوا عن جذع؟
      </h2>
      <p className="reviews-scroll-hint">
        <i className="fas fa-hand-pointer" /> اسحب للمزيد من الآراء
      </p>

      <div className="reviews-grid" id="reviews-grid">
        {loading && (
          <>
            <div className="skeleton-card review-skeleton-card">
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
            </div>
            <div className="skeleton-card review-skeleton-card">
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
            </div>
          </>
        )}

        {error && (
          <div className="error-state" style={{ width: '100%' }}>
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
