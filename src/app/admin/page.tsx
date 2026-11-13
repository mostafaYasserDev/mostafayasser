'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/components/admin/AdminAuthProvider';

export default function AdminIndexPage() {
  const router = useRouter();
  const { currentUser, checkingAuth } = useAdminAuth();

  useEffect(() => {
    if (!checkingAuth) {
      if (currentUser) {
        router.replace('/admin/dashboard');
      }
      // If not logged in, AdminAuthProvider already redirects to /admin/login
    }
  }, [currentUser, checkingAuth, router]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        fontSize: '1.2rem',
        color: 'var(--admin-primary)',
        fontWeight: 'bold',
      }}
    >
      جاري التحويل إلى لوحة التحكم...
    </div>
  );
}
