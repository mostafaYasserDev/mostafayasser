import React from 'react';
import type { Metadata } from 'next';
import '@/styles/admin.css';
import AdminAuthProvider from '@/components/admin/AdminAuthProvider';

export const metadata: Metadata = {
  title: 'لوحة التحكم - جذع',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
