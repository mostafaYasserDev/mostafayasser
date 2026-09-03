'use strict';
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { db, collection, getDocs, query, limit } from '@/lib/firebase';
import { getCachedData, setCachedData } from '@/lib/public-cache';
import SkeletonCards from './SkeletonCards';
import EmptyState from './EmptyState';

export interface ArticleData {
  id: string;
  title: string;
  slug?: string;
  shortDescription?: string;
  coverImage?: string;
  publishDate?: string;
  featured?: boolean;
}

export default function ArticlesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // 1. Try cache
    const cached = getCachedData<ArticleData[]>('latest_articles');
    if (cached) {
      setArticles(cached);
      setLoading(false);
      hasLoadedRef.current = true;
    }

    const loadArticles = async () => {
      if (hasLoadedRef.current) return;
      hasLoadedRef.current = true;

      try {
        setLoading(true);
        setError(false);
        const q = query(collection(db, 'articles'), limit(3));
        const snap = await getDocs(q);

        const items: ArticleData[] = [];
        snap.forEach((doc) => {
          items.push({ id: doc.id, ...(doc.data() as Omit<ArticleData, 'id'>) });
        });

        // Sort by date descending
        items.sort((a, b) => {
          const dateA = new Date(a.publishDate || 0).getTime();
          const dateB = new Date(b.publishDate || 0).getTime();
          return dateB - dateA;
        });

        setArticles(items);
        setCachedData('latest_articles', items);
      } catch (err) {
        console.error('Error fetching latest articles:', err);
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
            loadArticles();
          }
        },
        { rootMargin: '300px' }
      );

      observer.observe(sectionRef.current);
      return () => observer.disconnect();
    } else {
      loadArticles();
    }
  }, []);

  return (
    <section ref={sectionRef} id="articles" data-aos="fade-up">
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
            const targetSlug = a.slug || a.id;
            return (
              <div key={a.id} className="card content-in">
                {a.coverImage && (
                  <div className="card-img-wrapper">
                    <img
                      src={a.coverImage}
                      alt={`غلاف مقال ${a.title} - مدونة مصطفى ياسر (جذع)`}
                      className="card-img"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                )}
                <div className="card-content">
                  <h3 className="card-title">{a.title}</h3>
                  <p className="card-desc">{a.shortDescription}</p>
                  <Link href={`/article/${targetSlug}`} className="btn">
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
