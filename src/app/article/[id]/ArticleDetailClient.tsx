'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PublicArticle, fetchDocBySlugOrId, robustDecode } from '@/lib/public-fetch';
import HtmlContentRenderer from '@/components/HtmlContentRenderer';

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

  const [relatedArticles, setRelatedArticles] = useState<PublicArticle[]>([]);

  useEffect(() => {
    async function loadRelated() {
      try {
        const { collection, getDocs, limit, query } = await import('@/lib/firebase');
        const snap = await getDocs(query(collection((await import('@/lib/firebase')).db, 'articles'), limit(4)));
        const items: PublicArticle[] = [];
        snap.forEach((d) => {
          if (d.id !== article?.id && d.data().slug !== article?.slug) {
            items.push({
              id: d.id,
              title: d.data().title || '',
              slug: d.data().slug || '',
              coverImage: d.data().coverImage || '',
              shortDescription: d.data().shortDescription || '',
              content: '',
            });
          }
        });
        setRelatedArticles(items.slice(0, 3));
      } catch {}
    }
    if (article) {
      loadRelated();
    }
  }, [article]);

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

  // Calculate approximate reading time
  const plainText = (article.content || '').replace(/<[^>]*>/g, ' ').trim();
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 180));

  return (
    <div className="view active" style={{ paddingTop: '20px', minHeight: '60vh' }}>
      <section className="article-detail content-in">
        {/* Semantic Breadcrumbs Navigation */}
        <nav
          aria-label="Breadcrumb"
          style={{
            marginBottom: '20px',
            fontSize: '0.95rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <Link href="/" style={{ color: 'var(--text-muted)' }}>
            الرئيسية
          </Link>
          <span>/</span>
          <Link href="/articles" style={{ color: 'var(--text-muted)' }}>
            المقالات
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{article.title}</span>
        </nav>

        <div className="detail-header">
          <span className="trunk-badge">مقال</span>
          <h1 id="article-title" style={{ marginTop: '14px', marginBottom: '12px', lineHeight: 1.4 }}>
            {article.title}
          </h1>

          <div
            className="detail-meta"
            style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              alignItems: 'center',
              fontSize: '0.95rem',
            }}
          >
            {article.publishDate && <span>📅 نُشر في: {article.publishDate}</span>}
            <span>⏱️ قراءة: {readTimeMinutes} {readTimeMinutes === 1 ? 'دقيقة' : 'دقائق'}</span>
            <span>✍️ بقلم: {article.author || 'مصطفى ياسر'}</span>
          </div>
        </div>

        {article.coverImage && (
          <div id="article-cover-container" style={{ marginBottom: '30px' }}>
            <img
              src={article.coverImage}
              alt={`صورة غلاف مقال ${article.title} - مدونة جذع`}
              className="detail-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        )}

        <HtmlContentRenderer
          content={article.content}
          className="detail-content ql-editor-view"
        />

        {/* Related Articles Section for Enhanced Internal Linking & Retention */}
        {relatedArticles.length > 0 && (
          <div style={{ marginTop: '60px', paddingTop: '30px', borderTop: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.4rem', color: 'var(--text-main)' }}>
              مقالات أخرى قد تهمك
            </h3>
            <div className="grid" style={{ marginBottom: '30px' }}>
              {relatedArticles.map((rel) => (
                <div key={rel.id} className="card content-in" style={{ padding: '20px' }}>
                  {rel.coverImage && (
                    <div className="card-img-wrapper" style={{ height: '140px', marginBottom: '15px' }}>
                      <img
                        src={rel.coverImage}
                        alt={`غلاف مقال ${rel.title}`}
                        className="card-img"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '10px', lineHeight: 1.4 }}>{rel.title}</h4>
                  <p className="card-desc" style={{ fontSize: '0.9rem', marginBottom: '15px' }}>
                    {rel.shortDescription}
                  </p>
                  <Link href={`/article/${rel.slug || rel.id}`} className="btn" style={{ fontSize: '0.9rem', padding: '8px 16px' }}>
                    اقرأ المقال
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px' }}>
          <Link href="/articles" className="btn" style={{ background: 'var(--text-muted)' }}>
            ← العودة لكافة المقالات
          </Link>
        </div>
      </section>
    </div>
  );
}
