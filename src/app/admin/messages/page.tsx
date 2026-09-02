'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  auth,
  onAuthStateChanged,
  db,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  User,
} from '@/lib/firebase';
import { translateFirebaseError } from '@/lib/admin-utils';
import AdminSidebar from '@/components/admin/AdminSidebar';

export interface AdminMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  date?: string;
  createdAt?: number;
  read?: boolean;
}

export default function AdminMessagesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  // Selected message for modal
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/admin/login');
      } else {
        setCurrentUser(user);
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Realtime messages listener
  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, 'messages'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: AdminMessage[] = [];
        snapshot.forEach((docSnap) => {
          items.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<AdminMessage, 'id'>),
          });
        });

        // Sort by date / createdAt descending
        items.sort((a, b) => {
          const timeA = new Date(a.date || a.createdAt || 0).getTime();
          const timeB = new Date(b.date || b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        setMessages(items);
        setLoadingMessages(false);
      },
      (error) => {
        console.error('Error fetching messages:', error);
        setLoadingMessages(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Format Date Helper
  const formatDate = (dateVal?: string | number) => {
    if (!dateVal) return '—';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return (
        d.toLocaleDateString('ar-EG', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }) +
        ' ' +
        d.toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    } catch {
      return String(dateVal);
    }
  };

  // Delete message handler
  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الرسالة نهائياً؟')) {
      try {
        await deleteDoc(doc(db, 'messages', id));
        if (selectedMessage?.id === id) {
          setSelectedMessage(null);
        }
      } catch (err: any) {
        alert(translateFirebaseError(err));
      }
    }
  };

  if (checkingAuth) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '1.2rem',
          color: 'var(--admin-primary)',
          fontWeight: 'bold',
        }}
      >
        جاري التحقق من الصلاحيات...
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="admin-app-layout">
      <AdminSidebar />

      <main className="main-content">
        <h1 style={{ marginBottom: '24px', color: 'var(--admin-primary-dark)' }}>
          صندوق الوارد (رسائل الزوار)
        </h1>

        {/* Messages Table Card */}
        <div
          className="card"
          style={{
            background: 'var(--admin-surface)',
            padding: '24px 28px',
            borderRadius: 'var(--admin-radius)',
            border: '1px solid var(--admin-border)',
            boxShadow: 'var(--admin-shadow)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--admin-primary)', margin: 0 }}>
              الرسائل المستلمة ({messages.length})
            </h3>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>المرسل</th>
                  <th>البريد الإلكتروني</th>
                  <th>التاريخ</th>
                  <th>الرسالة</th>
                  <th style={{ width: '100px' }}>إجراءات</th>
                </tr>
              </thead>
              <tbody id="messages-list">
                {loadingMessages && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                      جاري تحميل الرسائل...
                    </td>
                  </tr>
                )}

                {!loadingMessages && messages.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                      لا توجد رسائل جديدة.
                    </td>
                  </tr>
                )}

                {!loadingMessages &&
                  messages.map((msg) => {
                    const isLong = msg.message.length > 75;
                    const previewText = isLong
                      ? msg.message.slice(0, 75).trim() + '…'
                      : msg.message;

                    return (
                      <tr key={msg.id}>
                        <td>
                          <strong>{msg.name || '—'}</strong>
                        </td>
                        <td>
                          <a
                            href={`mailto:${msg.email}`}
                            dir="ltr"
                            style={{ color: 'var(--admin-primary)', textDecoration: 'none', fontWeight: 'bold' }}
                          >
                            {msg.email}
                          </a>
                        </td>
                        <td>
                          <span dir="ltr" style={{ fontSize: '0.88rem' }}>
                            {formatDate(msg.date || msg.createdAt)}
                          </span>
                        </td>
                        <td className="table-text-cell">
                          <p className="table-text-preview" style={{ margin: 0 }}>
                            {previewText}
                          </p>
                          {isLong && (
                            <button
                              type="button"
                              className="btn btn-sm btn-view-text"
                              style={{ marginTop: '5px', padding: '2px 8px', fontSize: '0.8rem' }}
                              onClick={() => setSelectedMessage(msg)}
                            >
                              عرض كاملة
                            </button>
                          )}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(msg.id)}
                            >
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ===== FULL MESSAGE MODAL ===== */}
      {selectedMessage && (
        <div
          className="admin-modal-overlay"
          style={{
            display: 'flex',
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setSelectedMessage(null)}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            style={{
              background: 'var(--admin-surface)',
              borderRadius: '16px',
              padding: '30px',
              maxWidth: '560px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div
              className="admin-modal-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
                borderBottom: '1px solid var(--admin-border)',
                paddingBottom: '10px',
              }}
            >
              <h3 style={{ margin: 0, color: 'var(--admin-primary)' }}>
                تفاصيل الرسالة
              </h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSelectedMessage(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--admin-text-muted)',
                }}
              >
                ×
              </button>
            </div>

            <div
              className="admin-modal-meta"
              style={{
                background: 'var(--admin-bg)',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '15px',
                fontSize: '0.95rem',
              }}
            >
              <p style={{ margin: '0 0 6px' }}>
                <strong>المرسل:</strong> {selectedMessage.name}
              </p>
              <p style={{ margin: '0 0 6px' }}>
                <strong>البريد:</strong>{' '}
                <a
                  href={`mailto:${selectedMessage.email}`}
                  dir="ltr"
                  style={{ color: 'var(--admin-primary)', fontWeight: 'bold' }}
                >
                  {selectedMessage.email}
                </a>
              </p>
              <p style={{ margin: 0 }}>
                <strong>التاريخ:</strong>{' '}
                <span dir="ltr">
                  {formatDate(selectedMessage.date || selectedMessage.createdAt)}
                </span>
              </p>
            </div>

            <div
              className="admin-modal-body"
              style={{
                fontSize: '1.05rem',
                lineHeight: '1.8',
                color: 'var(--admin-text)',
                whiteSpace: 'pre-wrap',
                margin: '15px 0 25px',
                background: 'var(--admin-surface)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--admin-border)',
              }}
            >
              {selectedMessage.message}
            </div>

            <div
              className="admin-modal-footer"
              style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}
            >
              <a
                href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(
                  'رد بخصوص استفسارك - جذع'
                )}`}
                className="btn btn-sm"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fas fa-reply" /> الرد عبر البريد
              </a>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => setSelectedMessage(null)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
