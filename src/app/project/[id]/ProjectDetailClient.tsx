'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PublicProject, fetchDocBySlugOrId, robustDecode } from '@/lib/public-fetch';
import HtmlContentRenderer from '@/components/HtmlContentRenderer';

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

  const [relatedProjects, setRelatedProjects] = useState<PublicProject[]>([]);

  useEffect(() => {
    async function loadRelated() {
      try {
        const { collection, getDocs, limit, query } = await import('@/lib/firebase');
        const snap = await getDocs(query(collection((await import('@/lib/firebase')).db, 'projects'), limit(4)));
        const items: PublicProject[] = [];
        snap.forEach((d) => {
          if (d.id !== project?.id && d.data().slug !== project?.slug) {
            items.push({
              id: d.id,
              title: d.data().title || '',
              slug: d.data().slug || '',
              mainImage: d.data().mainImage || d.data().coverImage || '',
              shortDescription: d.data().shortDescription || '',
              fullDescription: '',
            });
          }
        });
        setRelatedProjects(items.slice(0, 3));
      } catch {}
    }
    if (project) {
      loadRelated();
    }
  }, [project]);

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
          <Link href="/projects" style={{ color: 'var(--text-muted)' }}>
            المشاريع
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{project.title}</span>
        </nav>

        <div className="detail-header">
          <span className="trunk-badge">مشروع جذع</span>
          <h1 id="project-title" style={{ marginTop: '14px', marginBottom: '12px', lineHeight: 1.4 }}>
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
              alt={`صورة مشروع ${project.title} - أعمال مصطفى ياسر (جذع)`}
              className="detail-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        )}

        <div className="detail-content">
          <HtmlContentRenderer
            content={project.fullDescription}
            className="ql-editor-view"
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

        {/* Related Projects Section for Enhanced Internal Linking */}
        {relatedProjects.length > 0 && (
          <div style={{ marginTop: '60px', paddingTop: '30px', borderTop: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.4rem', color: 'var(--text-main)' }}>
              مشاريع أخرى قد تهمك
            </h3>
            <div className="grid" style={{ marginBottom: '30px' }}>
              {relatedProjects.map((rel) => (
                <div key={rel.id} className="card content-in" style={{ padding: '20px' }}>
                  {rel.mainImage && (
                    <div className="card-img-wrapper" style={{ height: '140px', marginBottom: '15px' }}>
                      <img
                        src={rel.mainImage}
                        alt={`غلاف مشروع ${rel.title}`}
                        className="card-img"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '10px', lineHeight: 1.4 }}>{rel.title}</h4>
                  <p className="card-desc" style={{ fontSize: '0.9rem', marginBottom: '15px' }}>
                    {rel.shortDescription}
                  </p>
                  <Link href={`/project/${rel.slug || rel.id}`} className="btn" style={{ fontSize: '0.9rem', padding: '8px 16px' }}>
                    عرض المشروع
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px' }}>
          <Link href="/projects" className="btn" style={{ background: 'var(--text-muted)' }}>
            ← العودة لكافة المشاريع
          </Link>
        </div>
      </section>
    </div>
  );
}
