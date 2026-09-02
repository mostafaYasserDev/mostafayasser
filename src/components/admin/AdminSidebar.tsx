'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth, signOut } from '@/lib/firebase';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItems = [
    { href: '/admin/dashboard', label: 'لوحة التحكم', icon: 'fas fa-chart-pie' },
    { href: '/admin/articles', label: 'المقالات', icon: 'fas fa-newspaper' },
    { href: '/admin/projects', label: 'المشاريع', icon: 'fas fa-briefcase' },
    { href: '/admin/services', label: 'الخدمات', icon: 'fas fa-cogs' },
    { href: '/admin/reviews', label: 'آراء العملاء', icon: 'fas fa-comments' },
    { href: '/admin/messages', label: 'صندوق الوارد', icon: 'fas fa-envelope' },
    { href: '/admin/donations', label: 'طرق الدعم', icon: 'fas fa-hand-holding-heart' },
    { href: '/admin/settings', label: 'الإعدادات', icon: 'fas fa-sliders-h' },
  ];

  return (
    <>
      {/* Mobile Topbar */}
      <header className="admin-mobile-header">
        <button
          type="button"
          className="admin-menu-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="تبديل القائمة"
        >
          <i className="fas fa-bars" />
        </button>

        <div className="admin-mobile-brand">
          <img src="/assets/logo.png" alt="جذع" style={{ width: '28px', height: '28px' }} />
          <span>إدارة جذع</span>
        </div>

        <Link href="/" target="_blank" className="admin-mobile-site-link" title="معاينة الموقع">
          <i className="fas fa-external-link-alt" />
        </Link>
      </header>

      {/* Backdrop Overlay for Mobile */}
      <div
        className={`admin-sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar Drawer */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header-row">
          <button
            type="button"
            className="admin-sidebar-close"
            onClick={() => setIsOpen(false)}
            aria-label="إغلاق القائمة"
          >
            ×
          </button>
        </div>

        <div className="sidebar-brand">
          <img
            src="/assets/logo.png"
            alt="جذع"
            style={{ width: '52px', height: '52px' }}
          />
        </div>
        <h2>إدارة جذع</h2>

        <div className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? 'active' : ''}
                onClick={() => setIsOpen(false)}
              >
                <i className={item.icon} style={{ width: '20px', marginLeft: '6px' }} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="sidebar-footer">
          <Link
            href="/"
            target="_blank"
            className="btn btn-outline"
            style={{ width: '100%', marginBottom: '10px', textAlign: 'center', display: 'block' }}
          >
            <i className="fas fa-globe" /> زيارة الموقع
          </Link>

          <button
            id="logout-btn"
            type="button"
            className="btn btn-danger"
            onClick={handleLogout}
            style={{ width: '100%' }}
          >
            <i className="fas fa-sign-out-alt" /> تسجيل الخروج
          </button>
        </div>
      </aside>
    </>
  );
}
