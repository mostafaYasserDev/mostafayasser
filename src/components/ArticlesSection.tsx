'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db, collection, getDocs, query, limit } from '@/lib/firebase';
import SkeletonCards from './SkeletonCards';
import EmptyState from './EmptyState';

export interface ArticleData {
  id: string;
  title: string;
  shortDescription: string;
  coverImage?: string;
  slug?: string;
  publishDate?: string | number;
  createdAt?: number;
}

export default function ArticlesSection() {
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchRecentArticles() {
      try {
        setLoading(true);
        setError(false);

        const q = query(collection(db, 'articles'), limit(6));
        const snap = await getDocs(q);

        const items: ArticleData[] = [];
        snap.forEach((doc) => {
          items.push({ id: doc.id, ...(doc.data() as Omit<ArticleData, 'id'>) });
        });

        // Sort by publishDate or createdAt descending
        items.sort((a, b) => {
          const timeA = new Date(a.publishDate || a.createdAt || 0).getTime();
          const timeB = new Date(b.publishDate || b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        // Take top 3 for the home page preview
        setArticles(items.slice(0, 3));
      } catch (err) {
        console.error('Error fetching articles from Firestore:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchRecentArticles();
  }, []);

  return (
    <section id="articles" className="articles-section" style={{ marginBottom: '60px' }}>
      <div className="section-header">
        <h2 className="section-title">أحدث المقالات</h2>
        <Link href="/articles" className="view-all-link">
          عرض الكل <i className="fas fa-arrow-left" />
        </Link>
      </div>

      <div className="grid" id="articles-grid">
        {loading && <SkeletonCards count={3} />}

        {error && (
          <div className="error-state" style={{ gridColumn: '1 / -1' }}>
            <p>تعذر تحميل المقالات. يرجى المحاولة لاحقاً.</p>
          </div>
        )}

        {!loading && !error && articles.length === 0 && (
          <EmptyState type="articles" />
        )}

        {!loading &&
          !error &&
          articles.map((a) => {
            const routeId = encodeURIComponent(String(a.slug || a.id));
            return (
              <div key={a.id} className="card content-in">
                {a.coverImage && (
                  <div className="card-img-wrapper">
                    <img
                      src={a.coverImage}
                      alt={a.title}
                      className="card-img"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="card-content">
                  <h3 className="card-title">{a.title}</h3>
                  <p className="card-desc">{a.shortDescription}</p>
                  <Link href={`/article/${routeId}`} className="btn">
                    اقرأ المزيد
                  </Link>
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
