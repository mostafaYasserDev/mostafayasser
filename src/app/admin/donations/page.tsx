'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  auth,
  onAuthStateChanged,
  db,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  User,
} from '@/lib/firebase';
import { translateFirebaseError } from '@/lib/admin-utils';
import AdminSidebar from '@/components/admin/AdminSidebar';

export interface AdminDonation {
  id: string;
  title: string;
  icon: string;
  url: string;
  description?: string;
  active?: boolean;
  createdAt?: number;
}

const MAX_ENCODED_ICON_SIZE = 180 * 1024;

// Icon image compression matching original
function compressIconFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('الملف المختار ليس صورة.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const image = new Image();
      image.onload = () => {
        const maxSide = 160;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas error'));
          return;
        }
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const encoded = canvas.toDataURL('image/webp', 0.8);
        if (encoded.length > MAX_ENCODED_ICON_SIZE) {
          reject(new Error('الأيقونة كبيرة بعد الضغط. استخدم صورة أصغر.'));
          return;
        }
        resolve(encoded);
      };
      image.onerror = () => reject(new Error('تعذر قراءة الصورة.'));
      image.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdminDonationsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [iconClass, setIconClass] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);

  const [donations, setDonations] = useState<AdminDonation[]>([]);
  const [loadingDonations, setLoadingDonations] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

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

  // Realtime donations listener
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      collection(db, 'donations'),
      (snapshot) => {
        const items: AdminDonation[] = [];
        snapshot.forEach((docSnap) => {
          items.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<AdminDonation, 'id'>),
          });
        });

        // Sort by createdAt or title
        items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        setDonations(items);
        setLoadingDonations(false);
      },
      (error) => {
        console.error('Error fetching donations:', error);
        setLoadingDonations(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Handle icon file upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await compressIconFile(file);
      setImageBase64(base64);
      setIconClass(''); // Clear class if image uploaded
    } catch (err: any) {
      alert(err.message || 'تعذر معالجة الصورة.');
      setImageBase64('');
    }
  };

  // Toggle active status in Firestore
  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await updateDoc(doc(db, 'donations', id), {
        active: !currentActive,
      });
    } catch (err: any) {
      alert(translateFirebaseError(err));
    }
  };

  // Edit Donation Handler
  const handleEdit = (item: AdminDonation) => {
    setEditId(item.id);
    setTitle(item.title);
    setUrl(item.url);
    setDescription(item.description || '');
    setActive(item.active !== false);

    if (item.icon && item.icon.startsWith('data:image')) {
      setImageBase64(item.icon);
      setIconClass('');
    } else {
      setImageBase64('');
      setIconClass(item.icon || '');
    }

    setStatusMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel Edit
  const handleCancelEdit = () => {
    setEditId(null);
    setTitle('');
    setIconClass('');
    setImageBase64('');
    setUrl('');
    setDescription('');
    setActive(true);
    setStatusMsg(null);
  };

  // Delete Donation Handler
  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف طريقة الدعم هذه؟')) {
      try {
        await deleteDoc(doc(db, 'donations', id));
        if (editId === id) {
          handleCancelEdit();
        }
      } catch (err: any) {
        alert(translateFirebaseError(err));
      }
    }
  };

  // Save Donation (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      setStatusMsg({ text: 'يرجى إدخال عنوان ورابط صالحين.', type: 'error' });
      return;
    }

    const finalIcon = imageBase64 || iconClass.trim() || 'fas fa-heart';

    setIsSubmitting(true);
    setStatusMsg({ text: 'جاري الحفظ...', type: 'info' });

    try {
      const payload: any = {
        title: title.trim(),
        icon: finalIcon,
        url: url.trim(),
        description: description.trim(),
        active: active,
        updatedAt: Date.now(),
      };

      if (!editId) {
        payload.createdAt = Date.now();
        await addDoc(collection(db, 'donations'), payload);
        setStatusMsg({ text: 'تمت إضافة طريقة الدعم بنجاح!', type: 'success' });
      } else {
        await updateDoc(doc(db, 'donations', editId), payload);
        setStatusMsg({ text: 'تم تحديث طريقة الدعم بنجاح!', type: 'success' });
      }

      handleCancelEdit();
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ text: translateFirebaseError(err), type: 'error' });
    } finally {
      setIsSubmitting(false);
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
          إدارة طرق الدعم
        </h1>

        {/* Donation Form Card */}
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
          <h3 style={{ color: 'var(--admin-primary)', marginBottom: '20px' }}>
            {editId ? 'تعديل طريقة الدعم' : 'إضافة طريقة دعم جديدة'}
          </h3>

          <form onSubmit={handleSubmit} id="add-donation-form">
            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div className="form-group">
                <label htmlFor="don-title">عنوان الطريقة (مثال: Patreon / فودافون كاش)</label>
                <input
                  type="text"
                  id="don-title"
                  className="form-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="don-icon">الأيقونة (كود FontAwesome أو رفع صورة/SVG)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    id="don-icon"
                    className="form-control"
                    placeholder="fa-brands fa-paypal"
                    dir="ltr"
                    value={iconClass}
                    onChange={(e) => {
                      setIconClass(e.target.value);
                      setImageBase64('');
                    }}
                    style={{ flex: 1 }}
                  />
                  <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem' }}>أو</span>
                  <input
                    type="file"
                    id="don-image"
                    accept="image/*,.svg"
                    onChange={handleImageUpload}
                    style={{ maxWidth: '170px', fontSize: '0.8rem' }}
                  />
                  <div
                    id="don-preview"
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '1px solid var(--admin-border)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      background: 'var(--admin-card-bg)',
                      flexShrink: 0,
                    }}
                  >
                    {imageBase64 ? (
                      <img
                        src={imageBase64}
                        alt="معاينة"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : iconClass ? (
                      <i className={iconClass} style={{ fontSize: '1.2rem', color: 'var(--admin-primary)' }} />
                    ) : (
                      <i className="fas fa-image" style={{ color: '#ccc' }} />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="don-url">الرابط (URL أو رابط التحويل)</label>
              <input
                type="url"
                id="don-url"
                className="form-control"
                placeholder="https://"
                dir="ltr"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="don-desc">وصف قصير</label>
              <textarea
                id="don-desc"
                className="form-control"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  id="don-active"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                <span>تفعيل هذه الطريقة (تظهر للزوار)</span>
              </label>
            </div>

            <div className="form-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="submit"
                className="btn"
                id="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'جاري الحفظ...' : editId ? 'تحديث الطريقة' : 'حفظ طريقة الدعم'}
              </button>

              {editId && (
                <button
                  type="button"
                  className="btn btn-danger"
                  id="cancel-btn"
                  onClick={handleCancelEdit}
                >
                  إلغاء التعديل
                </button>
              )}
            </div>

            {statusMsg && (
              <div
                className={`msg ${statusMsg.type}`}
                style={{
                  marginTop: '15px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  color: statusMsg.type === 'error' ? 'var(--danger)' : 'var(--success)',
                  fontWeight: 'bold',
                }}
              >
                {statusMsg.text}
              </div>
            )}
          </form>
        </div>

        {/* Donations Table Card */}
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
            طرق الدعم المتاحة ({donations.length})
          </h3>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '60px', textAlign: 'center' }}>الأيقونة</th>
                  <th>العنوان</th>
                  <th>الحالة</th>
                  <th style={{ width: '220px' }}>إجراءات</th>
                </tr>
              </thead>
              <tbody id="donations-list">
                {loadingDonations && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
                      جاري التحميل...
                    </td>
                  </tr>
                )}

                {!loadingDonations && donations.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
                      لا توجد طرق دعم حالياً.
                    </td>
                  </tr>
                )}

                {!loadingDonations &&
                  donations.map((don) => {
                    const isImg = don.icon && don.icon.startsWith('data:image');
                    const isActive = don.active !== false;

                    return (
                      <tr key={don.id}>
                        <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                          {isImg ? (
                            <img
                              src={don.icon}
                              alt={don.title}
                              style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                            />
                          ) : (
                            <i
                              className={don.icon || 'fas fa-heart'}
                              style={{ fontSize: '1.4rem', color: 'var(--admin-primary)' }}
                            />
                          )}
                        </td>
                        <td>
                          <strong>{don.title}</strong>
                          {don.description && (
                            <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                              {don.description}
                            </div>
                          )}
                        </td>
                        <td>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={() => handleToggleActive(don.id, isActive)}
                            />
                            <span className="slider-toggle" />
                          </label>
                        </td>
                        <td>
                          <div className="table-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <a
                              href={don.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm"
                              style={{ padding: '4px 10px', fontSize: '0.8rem', textDecoration: 'none' }}
                            >
                              تجربة
                            </a>
                            <button
                              type="button"
                              className="btn btn-sm"
                              onClick={() => handleEdit(don)}
                            >
                              تعديل
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(don.id)}
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
    </div>
  );
}
