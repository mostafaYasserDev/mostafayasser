'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { db, doc, getDoc, collection, query, where, getDocs } from '@/lib/firebase';

interface ProjectData {
  id: string;
  title: string;
  slug?: string;
  shortDescription?: string;
  mainImage?: string;
  contentHtml?: string;
  demoUrl?: string;
  codeUrl?: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const rawId = params?.id ? decodeURIComponent(String(params.id)) : '';
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!rawId) return;

    async function loadProject() {
      try {
        setLoading(true);
        // 1. Try slug
        const q = query(collection(db, 'projects'), where('slug', '==', rawId));
        const slugSnap = await getDocs(q);

        if (!slugSnap.empty) {
          const d = slugSnap.docs[0];
          setProject({ id: d.id, ...(d.data() as Omit<ProjectData, 'id'>) });
          setLoading(false);
          return;
        }

        // 2. Try doc ID
        const docSnap = await getDoc(doc(db, 'projects', rawId));
        if (docSnap.exists()) {
          setProject({ id: docSnap.id, ...(docSnap.data() as Omit<ProjectData, 'id'>) });
          setLoading(false);
          return;
        }

        setNotFound(true);
      } catch (err) {
        console.error('Error fetching project:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadProject();
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

  if (notFound || !project) {
    return (
      <div className="view active" style={{ paddingTop: '40px', minHeight: '60vh', textAlign: 'center' }}>
        <h2>المشروع غير موجود</h2>
        <p style={{ color: 'var(--text-muted)', margin: '15px 0 25px' }}>
          عذراً، لم نتمكن من العثور على المشروع المطلوب.
        </p>
        <Link href="/projects" className="btn">
          العودة للمشاريع
        </Link>
      </div>
    );
  }

  return (
    <div className="view active" style={{ paddingTop: '20px', minHeight: '60vh' }}>
      <section className="project-detail content-in">
        <Link href="/projects" className="back-link">
          ← العودة للمشاريع
        </Link>

        <h1 id="project-title" style={{ marginTop: '16px', marginBottom: '12px' }}>
          {project.title}
        </h1>

        {project.mainImage && (
          <div id="project-image-container" style={{ marginBottom: '30px' }}>
            <img
              src={project.mainImage}
              alt={project.title}
              className="content-in"
              style={{ width: '100%', maxHeight: '480px', objectFit: 'cover', borderRadius: '16px' }}
            />
          </div>
        )}

        {(project.demoUrl || project.codeUrl) && (
          <div className="project-links" style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {project.demoUrl && (
              <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="btn">
                <i className="fas fa-external-link-alt" /> معاينة المشروع
              </a>
            )}
            {project.codeUrl && (
              <a href={project.codeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                <i className="fab fa-github" /> كود المشروع
              </a>
            )}
          </div>
        )}

        <div
          className="project-body ql-editor-view"
          dangerouslySetInnerHTML={{ __html: project.contentHtml || project.shortDescription || '' }}
        />
      </section>
    </div>
  );
}
