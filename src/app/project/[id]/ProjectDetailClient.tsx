'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PublicProject, fetchDocBySlugOrId, robustDecode } from '@/lib/public-fetch';

interface Props {
  initialProject?: PublicProject | null;
  paramId: string;
}

export default function ProjectDetailClient({ initialProject, paramId }: Props) {
  const params = useParams();
  const activeId = String(params?.id || paramId || '');
  const [project, setProject] = useState<PublicProject | null>(initialProject || null);
  const [loading, setLoading] = useState(!initialProject);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!activeId) return;

    if (
      initialProject &&
      (initialProject.id === activeId ||
        initialProject.slug === activeId ||
        initialProject.slug === robustDecode(activeId))
    ) {
      setProject(initialProject);
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(false);
        const data = await fetchDocBySlugOrId<PublicProject>('projects', activeId);
        if (!isMounted) return;

        if (data) {
          setProject(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error in ProjectDetailClient:', err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [activeId, initialProject]);

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

  if (error || !project) {
    return (
      <div className="view active" style={{ paddingTop: '40px', minHeight: '60vh', textAlign: 'center' }}>
        <div className="detail-header">
          <span className="trunk-badge" style={{ background: 'var(--danger)', color: '#fff' }}>عذراً</span>
          <h2 style={{ marginTop: '16px' }}>المشروع غير موجود</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', margin: '15px 0 25px', fontSize: '1.1rem' }}>
          لم نتمكن من العثور على المشروع المطلوب. ربما تم نقل الرابط أو حذفه.
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
        <Link href="/projects" className="back-link" style={{ marginBottom: '20px', display: 'inline-block' }}>
          ← العودة للمشاريع
        </Link>

        <div className="detail-header">
          <span className="trunk-badge">مشروع جذع</span>
          <h1 id="project-title" style={{ marginTop: '14px', marginBottom: '12px' }}>
            {project.title}
          </h1>

          {project.technologies && (
            <div className="detail-meta">
              <span>التقنيات: {project.technologies}</span>
            </div>
          )}
        </div>

        {project.mainImage && (
          <div id="project-cover-container" style={{ marginBottom: '30px' }}>
            <img
              src={project.mainImage}
              alt={project.title}
              className="detail-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        )}

        <div className="detail-content">
          <div
            className="ql-editor-view"
            dangerouslySetInnerHTML={{ __html: project.fullDescription }}
          />

          {(project.demoLink || project.githubLink) && (
            <div
              style={{
                marginTop: '35px',
                display: 'flex',
                gap: '15px',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {project.demoLink && (
                <a
                  href={project.demoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <i className="fas fa-external-link-alt" />
                  <span>معاينة حية</span>
                </a>
              )}
              {project.githubLink && (
                <a
                  href={project.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{
                    background: 'var(--text-main)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <i className="fab fa-github" />
                  <span>الكود المصدري</span>
                </a>
              )}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px dashed var(--border-color)' }}>
          <Link href="/projects" className="btn" style={{ background: 'var(--text-muted)' }}>
            العودة للمشاريع
          </Link>
        </div>
      </section>
    </div>
  );
}
