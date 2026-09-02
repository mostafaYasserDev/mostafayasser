'use strict';
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth, signOut } from '@/lib/firebase';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItems = [
    { href: '/admin/dashboard', label: 'لوحة التحكم' },
    { href: '/admin/articles', label: 'المقالات' },
    { href: '/admin/projects', label: 'المشاريع' },
    { href: '/admin/services', label: 'الخدمات' },
    { href: '/admin/reviews', label: 'آراء العملاء' },
    { href: '/admin/messages', label: 'صندوق الوارد' },
    { href: '/admin/donations', label: 'طرق الدعم' },
    { href: '/admin/settings', label: 'الإعدادات' },
  ];

  return (
    <aside className="sidebar">
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <img
          src="/assets/logo.png"
          alt="جذع"
          style={{ width: '50px' }}
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
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <button
          id="logout-btn"
          type="button"
          onClick={handleLogout}
          style={{ width: '100%' }}
        >
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
