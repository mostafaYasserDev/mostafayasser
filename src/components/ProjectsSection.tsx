'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db, collection, getDocs, query, where, limit } from '@/lib/firebase';
import SkeletonCards from './SkeletonCards';
import EmptyState from './EmptyState';

export interface ProjectData {
  id: string;
  title: string;
  shortDescription: string;
  mainImage?: string;
  slug?: string;
  createdAt?: number;
  featured?: boolean;
}

export default function ProjectsSection() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchFeaturedProjects() {
      try {
        setLoading(true);
        setError(false);
        // Try featured first, fallback to all recent
        let q = query(collection(db, 'projects'), where('featured', '==', true), limit(6));
        let snap = await getDocs(q);

        if (snap.empty) {
          q = query(collection(db, 'projects'), limit(6));
          snap = await getDocs(q);
        }

        const items: ProjectData[] = [];
        snap.forEach((doc) => {
          items.push({ id: doc.id, ...(doc.data() as Omit<ProjectData, 'id'>) });
        });

        // Sort by createdAt descending
        items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        // Take top 3 for the home page showcase
        setProjects(items.slice(0, 3));
      } catch (err) {
        console.error('Error loading projects from Firestore:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedProjects();
  }, []);

  return (
    <section id="projects" className="projects-section" style={{ marginBottom: '60px' }}>
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
            const routeId = encodeURIComponent(String(p.slug || p.id));
            return (
              <div key={p.id} className="card content-in">
                {p.mainImage && (
                  <div className="card-img-wrapper">
                    <img
                      src={p.mainImage}
                      alt={p.title}
                      className="card-img"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="card-content">
                  <h3 className="card-title">{p.title}</h3>
                  <p className="card-desc">{p.shortDescription}</p>
                  <Link href={`/project/${routeId}`} className="btn">
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
