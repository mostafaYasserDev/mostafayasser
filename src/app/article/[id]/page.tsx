'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { db, doc, getDoc, collection, query, where, getDocs } from '@/lib/firebase';

interface ArticleData {
  id: string;
  title: string;
  slug?: string;
  publishDate?: string;
  coverImage?: string;
  contentHtml?: string;
  shortDescription?: string;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const rawId = params?.id ? decodeURIComponent(String(params.id)) : '';
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!rawId) return;

    async function loadArticle() {
      try {
        setLoading(true);
        // 1. Try slug
        const q = query(collection(db, 'articles'), where('slug', '==', rawId));
        const slugSnap = await getDocs(q);

        if (!slugSnap.empty) {
          const d = slugSnap.docs[0];
          setArticle({ id: d.id, ...(d.data() as Omit<ArticleData, 'id'>) });
          setLoading(false);
          return;
        }

        // 2. Try doc ID
        const docSnap = await getDoc(doc(db, 'articles', rawId));
        if (docSnap.exists()) {
          setArticle({ id: docSnap.id, ...(docSnap.data() as Omit<ArticleData, 'id'>) });
          setLoading(false);
          return;
        }

        setNotFound(true);
      } catch (err) {
        console.error('Error fetching article:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadArticle();
  }, [rawId]);

  if (loading) {
    return (
      <div className="view active" style={{ paddingTop: '40px', minHeight: '60vh' }}>
        <div className="skeleton-line" style={{ height: '32px', width: '40%', marginBottom: '20px' }} />
        <div className="skeleton-line" style={{ height: '200px', width: '100%', marginBottom: '20px' }} />
        <div className="skeleton-line" style={{ height: '16px', width: '80%', marginBottom: '10px' }} />
        <div className="skeleton-line" style={{ height: '16px', width: '70%' }} />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="view active" style={{ paddingTop: '40px', minHeight: '60vh', textAlign: 'center' }}>
        <h2>المقال غير موجود</h2>
        <p style={{ color: 'var(--text-muted)', margin: '15px 0 25px' }}>
          عذراً، لم نتمكن من العثور على المقال المطلوب.
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
        <Link href="/articles" className="back-link">
          ← العودة للمقالات
        </Link>

        <h1 id="article-title" style={{ marginTop: '16px', marginBottom: '12px' }}>
          {article.title}
        </h1>

        {article.publishDate && (
          <div className="article-meta" style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            <span>{article.publishDate}</span>
          </div>
        )}

        {article.coverImage && (
          <div id="article-cover-container" style={{ marginBottom: '30px' }}>
            <img
              src={article.coverImage}
              alt={article.title}
              className="content-in"
              style={{ width: '100%', maxHeight: '480px', objectFit: 'cover', borderRadius: '16px' }}
            />
          </div>
        )}

        <div
          className="article-body ql-editor-view"
          dangerouslySetInnerHTML={{ __html: article.contentHtml || article.shortDescription || '' }}
        />
      </section>
    </div>
  );
}
