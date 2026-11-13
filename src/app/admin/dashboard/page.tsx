'use client';

import React from 'react';
import Link from 'next/link';
import { useAdminAuth } from '@/components/admin/AdminAuthProvider';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminDashboardPage() {
  const { currentUser } = useAdminAuth();

  if (!currentUser) return null;

  const dashboardLinks = [
    { href: '/admin/articles', icon: '📜', label: 'المقالات' },
    { href: '/admin/projects', icon: '🌳', label: 'المشاريع' },
    { href: '/admin/services', icon: '🌿', label: 'الخدمات' },
    { href: '/admin/donations', icon: '💖', label: 'طرق الدعم' },
    { href: '/admin/reviews', icon: '💬', label: 'آراء العملاء' },
    { href: '/admin/messages', icon: '📬', label: 'صندوق الوارد' },
    { href: '/admin/settings', icon: '⚙️', label: 'الإعدادات' },
  ];

  return (
    <div className="admin-app-layout">
      <AdminSidebar />

      <main className="main-content">
        <h1 style={{ marginBottom: '24px', color: 'var(--admin-primary-dark)' }}>
          مرحباً بك في لوحة التحكم
        </h1>

        <div
          className="card"
          style={{
            background: 'var(--admin-surface)',
            padding: '24px 28px',
            borderRadius: 'var(--admin-radius)',
            border: '1px solid var(--admin-border)',
            boxShadow: 'var(--admin-shadow)',
            marginBottom: '30px',
          }}
        >
          <h3 style={{ color: 'var(--admin-primary)', marginBottom: '10px' }}>
            إدارة المحتوى بسهولة
          </h3>
          <p style={{ color: 'var(--admin-text-muted)', margin: 0 }}>
            اختر القسم الذي تريد إدارته. جميع التغييرات تظهر مباشرة على الموقع.
          </p>
        </div>

        <div className="dashboard-grid">
          {dashboardLinks.map((link) => (
            <Link key={link.href} href={link.href} className="dash-link">
              <span className="dash-link-icon">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
