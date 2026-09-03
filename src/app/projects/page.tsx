'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db, collection, getDocs, query } from '@/lib/firebase';
import SkeletonCards from '@/components/SkeletonCards';
import EmptyState from '@/components/EmptyState';
import { ProjectData } from '@/components/ProjectsSection';

const PAGE_SIZE = 6;

export default function AllProjectsPage() {
  const [allProjects, setAllProjects] = useState<ProjectData[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchAllProjects() {
      try {
        setLoading(true);
        setError(false);
        const q = query(collection(db, 'projects'));
        const snap = await getDocs(q);

        const items: ProjectData[] = [];
        snap.forEach((doc) => {
          items.push({ id: doc.id, ...(doc.data() as Omit<ProjectData, 'id'>) });
        });

        // Sort by createdAt descending
        items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setAllProjects(items);
      } catch (err) {
        console.error('Error fetching all projects:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchAllProjects();
  }, []);

  const displayedProjects = allProjects.slice(0, visibleCount);
  const hasMore = visibleCount < allProjects.length;

  return (
    <div className="view active" style={{ paddingTop: '20px', minHeight: '60vh' }}>
      <section>
        <div className="section-header">
          <h1 className="section-title">جميع المشاريع</h1>
        </div>

        <div className="grid" id="all-projects-grid">
          {loading && <SkeletonCards count={6} />}

          {error && (
            <div className="error-state" style={{ gridColumn: '1 / -1' }}>
              <p>تعذر تحميل المشاريع. يرجى المحاولة لاحقاً.</p>
            </div>
          )}

          {!loading && !error && allProjects.length === 0 && (
            <EmptyState type="projects" />
          )}

          {!loading &&
            !error &&
            displayedProjects.map((p) => {
              const targetSlug = p.slug || p.id;
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
                    <Link href={`/project/${targetSlug}`} className="btn">
                      عرض المشروع
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
        {!loading && !error && !hasMore && allProjects.length > PAGE_SIZE && (
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
            <span>🌱</span>
            <span>أغصان وأفكار جديدة تثمر في الجذع قريباً...</span>
          </div>
        )}
      </section>
    </div>
  );
}
