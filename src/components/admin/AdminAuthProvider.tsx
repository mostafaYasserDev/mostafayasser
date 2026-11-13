'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, onAuthStateChanged, signOut, User } from '@/lib/firebase';

interface AdminAuthContextValue {
  currentUser: User | null;
  checkingAuth: boolean;
  handleLogout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue>({
  currentUser: null,
  checkingAuth: true,
  handleLogout: async () => {},
});

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

export default function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user && !pathname.endsWith('/login')) {
        router.replace('/admin/login');
      }
      setCurrentUser(user);
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, [router, pathname]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      router.push('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, [router]);

  if (checkingAuth) {
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
        جاري التحقق من الصلاحيات...
      </div>
    );
  }

  if (!currentUser && !pathname.endsWith('/login')) {
    return null;
  }

  return (
    <AdminAuthContext.Provider value={{ currentUser, checkingAuth, handleLogout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

