'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  auth,
  onAuthStateChanged,
  db,
  collection,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  User,
} from '@/lib/firebase';
import { translateFirebaseError } from '@/lib/admin-utils';
import AdminSidebar from '@/components/admin/AdminSidebar';

export interface AdminReview {
  id: string;
  clientName: string;
  serviceName?: string;
  reviewText: string;
  visible?: boolean;
  createdAt?: number;
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Modal State for viewing full review
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);

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

    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/client/write-review`);
    }

    return () => unsubscribe();
  }, [router]);

  // Realtime reviews listener
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      collection(db, 'reviews'),
      (snapshot) => {
        const items: AdminReview[] = [];
        snapshot.forEach((docSnap) => {
          items.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<AdminReview, 'id'>),
          });
        });

        // Sort by createdAt desc
        items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        setReviews(items);
        setLoadingReviews(false);
      },
      (error) => {
        console.error('Error fetching reviews:', error);
        setLoadingReviews(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Copy review link handler
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Toggle review visibility handler
  const handleToggleVisible = async (id: string, currentVisible: boolean) => {
    try {
      await updateDoc(doc(db, 'reviews', id), {
        visible: !currentVisible,
      });
    } catch (err: any) {
      alert(translateFirebaseError(err));
    }
  };

  // Delete review handler
  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الرأي؟')) {
      try {
        await deleteDoc(doc(db, 'reviews', id));
        if (selectedReview?.id === id) {
          setSelectedReview(null);
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
          إدارة آراء العملاء
        </h1>

        {/* Share Link Card */}
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
            مشاركة رابط كتابة الرأي
          </h3>
          <p style={{ color: 'var(--admin-text-muted)', marginBottom: '15px' }}>
            أرسل هذا الرابط لعملائك — لا يحتاجون حساباً أو كلمة مرور:
          </p>

          <div
            className="share-link"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'var(--admin-bg)',
              padding: '12px 16px',
              borderRadius: '10px',
              flexWrap: 'wrap',
            }}
          >
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--admin-primary)',
                textDecoration: 'none',
                fontWeight: 'bold',
                wordBreak: 'break-all',
              }}
            >
              {shareUrl}
            </a>
            <button
              type="button"
              onClick={handleCopyLink}
              className="btn btn-sm"
              style={{ padding: '6px 14px', fontSize: '0.85rem' }}
            >
              {copied ? 'تم النسخ! ✅' : 'نسخ الرابط'}
            </button>
          </div>
        </div>

        {/* Reviews List Table Card */}
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
          <h3 style={{ color: 'var(--admin-primary)', marginBottom: '20px' }}>
            الآراء المكتوبة ({reviews.length})
          </h3>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>العميل</th>
                  <th>الخدمة</th>
                  <th>الرأي</th>
                  <th>إظهار؟</th>
                  <th style={{ width: '100px' }}>إجراءات</th>
                </tr>
              </thead>
              <tbody id="reviews-list">
                {loadingReviews && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                      جاري التحميل...
                    </td>
                  </tr>
                )}

                {!loadingReviews && reviews.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                      لا توجد آراء بعد.
                    </td>
                  </tr>
                )}

                {!loadingReviews &&
                  reviews.map((r) => {
                    const isLong = r.reviewText.length > 75;
                    const previewText = isLong
                      ? r.reviewText.slice(0, 75).trim() + '…'
                      : r.reviewText;

                    return (
                      <tr key={r.id}>
                        <td>
                          <strong>{r.clientName}</strong>
                        </td>
                        <td>
                          {r.serviceName ? (
                            <span className="service-tag">{r.serviceName}</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="table-text-cell">
                          <p className="table-text-preview" style={{ margin: 0 }}>
                            "{previewText}"
                          </p>
                          {isLong && (
                            <button
                              type="button"
                              className="btn btn-sm btn-view-text"
                              style={{ marginTop: '5px', padding: '2px 8px', fontSize: '0.8rem' }}
                              onClick={() => setSelectedReview(r)}
                            >
                              عرض كاملاً
                            </button>
                          )}
                        </td>
                        <td>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={!!r.visible}
                              onChange={() => handleToggleVisible(r.id, !!r.visible)}
                            />
                            <span className="slider-toggle" />
                          </label>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(r.id)}
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

      {/* ===== FULL REVIEW TEXT MODAL ===== */}
      {selectedReview && (
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
          onClick={() => setSelectedReview(null)}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            style={{
              background: 'var(--admin-surface)',
              borderRadius: '16px',
              padding: '30px',
              maxWidth: '520px',
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
                تفاصيل الرأي
              </h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSelectedReview(null)}
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
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '15px',
                fontSize: '0.95rem',
              }}
            >
              <p style={{ margin: '0 0 5px' }}>
                <strong>العميل:</strong> {selectedReview.clientName}
              </p>
              {selectedReview.serviceName && (
                <p style={{ margin: 0 }}>
                  <strong>الخدمة:</strong> {selectedReview.serviceName}
                </p>
              )}
            </div>

            <div
              className="admin-modal-body"
              style={{
                fontSize: '1.05rem',
                lineHeight: '1.8',
                color: 'var(--admin-text)',
                whiteSpace: 'pre-wrap',
                margin: '15px 0 25px',
              }}
            >
              "{selectedReview.reviewText}"
            </div>

            <div
              className="admin-modal-footer"
              style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}
            >
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  handleToggleVisible(selectedReview.id, !!selectedReview.visible);
                  setSelectedReview({
                    ...selectedReview,
                    visible: !selectedReview.visible,
                  });
                }}
              >
                {selectedReview.visible ? 'إخفاء من الموقع' : 'إظهار في الموقع'}
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => setSelectedReview(null)}
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
