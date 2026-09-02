'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db, collection, getDocs, query } from '@/lib/firebase';
import SkeletonCards from '@/components/SkeletonCards';
import EmptyState from '@/components/EmptyState';
import { ArticleData } from '@/components/ArticlesSection';

const PAGE_SIZE = 6;

export default function AllArticlesPage() {
  const [allArticles, setAllArticles] = useState<ArticleData[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchAllArticles() {
      try {
        setLoading(true);
        setError(false);
        const q = query(collection(db, 'articles'));
        const snap = await getDocs(q);

        const items: ArticleData[] = [];
        snap.forEach((doc) => {
          items.push({ id: doc.id, ...(doc.data() as Omit<ArticleData, 'id'>) });
        });

        // Sort by publishDate descending if exists
        items.sort((a, b) => {
          const dateA = new Date(a.publishDate || 0).getTime();
          const dateB = new Date(b.publishDate || 0).getTime();
          return dateB - dateA;
        });

        setAllArticles(items);
      } catch (err) {
        console.error('Error fetching all articles:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchAllArticles();
  }, []);

  const displayedArticles = allArticles.slice(0, visibleCount);
  const hasMore = visibleCount < allArticles.length;

  return (
    <div className="view active" style={{ paddingTop: '20px', minHeight: '60vh' }}>
      <section>
        <div className="section-header">
          <h1 className="section-title">المقالات</h1>
        </div>

        <div className="grid" id="all-articles-grid">
          {loading && <SkeletonCards count={6} />}

          {error && (
            <div className="error-state" style={{ gridColumn: '1 / -1' }}>
              <p>تعذر تحميل المقالات. يرجى المحاولة لاحقاً.</p>
            </div>
          )}

          {!loading && !error && allArticles.length === 0 && (
            <EmptyState type="articles" />
          )}

          {!loading &&
            !error &&
            displayedArticles.map((a) => {
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
        {!loading && !error && !hasMore && allArticles.length > PAGE_SIZE && (
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
            <span>📜</span>
            <span>أفكار وتدوينات جديدة قيد التجهيز والكتابة... قريباً</span>
          </div>
        )}
      </section>
    </div>
  );
}
