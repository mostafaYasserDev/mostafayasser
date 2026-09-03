'use strict';
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { db, collection, getDocs, query, where, limit } from '@/lib/firebase';
import { getCachedData, setCachedData } from '@/lib/public-cache';
import SkeletonCards from './SkeletonCards';
import EmptyState from './EmptyState';

export interface ProjectData {
  id: string;
  title: string;
  slug?: string;
  shortDescription?: string;
  mainImage?: string;
  featured?: boolean;
  createdAt?: number;
}

export default function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // 1. Try cache
    const cached = getCachedData<ProjectData[]>('featured_projects');
    if (cached) {
      setProjects(cached);
      setLoading(false);
      hasLoadedRef.current = true;
    }

    const loadProjects = async () => {
      if (hasLoadedRef.current) return;
      hasLoadedRef.current = true;

      try {
        setLoading(true);
        setError(false);
        const q = query(
          collection(db, 'projects'),
          where('featured', '==', true),
          limit(3)
        );
        const snap = await getDocs(q);

        const items: ProjectData[] = [];
        snap.forEach((doc) => {
          items.push({ id: doc.id, ...(doc.data() as Omit<ProjectData, 'id'>) });
        });

        setProjects(items);
        setCachedData('featured_projects', items);
      } catch (err) {
        console.error('Error fetching featured projects:', err);
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
            loadProjects();
          }
        },
        { rootMargin: '300px' }
      );

      observer.observe(sectionRef.current);
      return () => observer.disconnect();
    } else {
      loadProjects();
    }
  }, []);

  return (
    <section ref={sectionRef} id="projects" data-aos="fade-up">
      <div className="section-header">
        <h2 className="section-title">أبرز المشاريع</h2>
        <Link href="/projects" className="view-all-link">
          عرض الكل <i className="fas fa-arrow-left" />
        </Link>
      </div>

      <div className="grid" id="projects-grid">
        {loading && <SkeletonCards count={3} />}

        {error && (
          <div className="error-state" style={{ gridColumn: '1 / -1' }}>
            <p>تعذر تحميل المشاريع. يرجى المحاولة لاحقاً.</p>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <EmptyState type="projects" />
        )}

        {!loading &&
          !error &&
          projects.map((p) => {
            const targetSlug = p.slug || p.id;
            return (
              <div key={p.id} className="card content-in">
                {p.mainImage && (
                  <div className="card-img-wrapper">
                    <img
                      src={p.mainImage}
                      alt={`صورة مشروع ${p.title} - أعمال مصطفى ياسر (جذع)`}
                      className="card-img"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                )}
                <div className="card-content">
                  <h3 className="card-title">{p.title}</h3>
                  <p className="card-desc">{p.shortDescription}</p>
                  <Link href={`/project/${targetSlug}`} className="btn">
                    عرض المشروع
                  </Link>
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
