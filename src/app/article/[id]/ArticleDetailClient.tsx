'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PublicArticle, fetchDocBySlugOrId, robustDecode } from '@/lib/public-fetch';

interface Props {
  initialArticle?: PublicArticle | null;
  paramId: string;
}

export default function ArticleDetailClient({ initialArticle, paramId }: Props) {
  const params = useParams();
  const activeId = String(params?.id || paramId || '');
  const [article, setArticle] = useState<PublicArticle | null>(initialArticle || null);
  const [loading, setLoading] = useState(!initialArticle);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!activeId) return;

    // If we already have matching initial data, no need to refetch
    if (
      initialArticle &&
      (initialArticle.id === activeId ||
        initialArticle.slug === activeId ||
        initialArticle.slug === robustDecode(activeId))
    ) {
      setArticle(initialArticle);
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(false);
        const data = await fetchDocBySlugOrId<PublicArticle>('articles', activeId);
        if (!isMounted) return;

        if (data) {
          setArticle(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error in ArticleDetailClient:', err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [activeId, initialArticle]);

  if (loading) {
    return (
      <div className="view active" style={{ paddingTop: '40px', minHeight: '60vh' }}>
        <div className="skeleton-line" style={{ height: '32px', width: '40%', margin: '0 auto 20px' }} />
        <div className="skeleton-line" style={{ height: '240px', width: '100%', marginBottom: '20px', borderRadius: '16px' }} />
        <div className="skeleton-line" style={{ height: '18px', width: '90%', marginBottom: '10px' }} />
        <div className="skeleton-line" style={{ height: '18px', width: '75%', marginBottom: '10px' }} />
        <div className="skeleton-line" style={{ height: '18px', width: '85%' }} />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="view active" style={{ paddingTop: '40px', minHeight: '60vh', textAlign: 'center' }}>
        <div className="detail-header">
          <span className="trunk-badge" style={{ background: 'var(--danger)', color: '#fff' }}>عذراً</span>
          <h2 style={{ marginTop: '16px' }}>المقال غير موجود</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', margin: '15px 0 25px', fontSize: '1.1rem' }}>
          لم نتمكن من العثور على المقال المطلوب. ربما تم تعديل الرابط أو حذفه.
        </p>
        <Link href="/articles" className="btn">
          العودة للمقالات
        </Link>
      </div>
    );
  }

  return (
    <div className="view active" style={{ paddingTop: '20px', minHeight: '60vh' }}>
      <section className="article-detail content-in">
        <Link href="/articles" className="back-link" style={{ marginBottom: '20px', display: 'inline-block' }}>
          ← العودة للمقالات
        </Link>

        <div className="detail-header">
          <span className="trunk-badge">مقال</span>
          <h1 id="article-title" style={{ marginTop: '14px', marginBottom: '12px' }}>
            {article.title}
          </h1>

          {article.publishDate && (
            <div className="detail-meta">
              <span>نُشر في: {article.publishDate}</span>
            </div>
          )}
        </div>

        {article.coverImage && (
          <div id="article-cover-container" style={{ marginBottom: '30px' }}>
            <img
              src={article.coverImage}
              alt={article.title}
              className="detail-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        )}

        <div
          className="detail-content ql-editor-view"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px dashed var(--border-color)' }}>
          <Link href="/articles" className="btn" style={{ background: 'var(--text-muted)' }}>
            العودة للمقالات
          </Link>
        </div>
      </section>
    </div>
  );
}
