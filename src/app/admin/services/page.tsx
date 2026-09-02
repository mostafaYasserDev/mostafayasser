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
  query,
  where,
  getDocs,
  User,
} from '@/lib/firebase';
import { translateFirebaseError } from '@/lib/admin-utils';
import AdminSidebar from '@/components/admin/AdminSidebar';

export interface AdminService {
  id: string;
  title: string;
  slug: string;
  description: string;
  featured?: boolean;
  createdAt?: number;
}

export default function AdminServicesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [featured, setFeatured] = useState(false);

  const [services, setServices] = useState<AdminService[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

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

  // Realtime services listener
  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, 'services'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: AdminService[] = [];
        snapshot.forEach((docSnap) => {
          items.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<AdminService, 'id'>),
          });
        });

        // Sort by createdAt or title
        items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        setServices(items);
        setLoadingServices(false);
      },
      (error) => {
        console.error('Error fetching services:', error);
        setLoadingServices(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Slug auto-formatting
  const handleSlugChange = (val: string) => {
    const sanitized = val
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+/, '');
    setSlug(sanitized);
  };

  // Edit Service Handler
  const handleEdit = (srv: AdminService) => {
    setEditId(srv.id);
    setTitle(srv.title);
    setSlug(srv.slug || srv.id);
    setDescription(srv.description || '');
    setFeatured(srv.featured || false);
    setStatusMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel Edit
  const handleCancelEdit = () => {
    setEditId(null);
    setTitle('');
    setSlug('');
    setDescription('');
    setFeatured(false);
    setStatusMsg(null);
  };

  // Delete Service Handler
  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الخدمة؟')) {
      try {
        await deleteDoc(doc(db, 'services', id));
        if (editId === id) {
          handleCancelEdit();
        }
      } catch (err: any) {
        alert(translateFirebaseError(err));
      }
    }
  };

  // Save Service (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !description.trim()) {
      setStatusMsg({ text: 'يرجى ملء جميع الحقول المطلوبة.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg({ text: 'جاري الحفظ...', type: 'info' });

    try {
      let targetSlug = slug.trim().replace(/-+$/, '');

      // Check slug uniqueness
      const slugQuery = query(collection(db, 'services'), where('slug', '==', targetSlug));
      const slugSnap = await getDocs(slugQuery);
      let isDuplicate = false;
      slugSnap.forEach((docSnap) => {
        if (docSnap.id !== editId) isDuplicate = true;
      });

      if (isDuplicate) {
        targetSlug = `${targetSlug}-${Date.now().toString().slice(-4)}`;
      }

      const servicePayload: any = {
        title: title.trim(),
        slug: targetSlug,
        description: description.trim(),
        featured: featured,
        updatedAt: Date.now(),
      };

      if (!editId) {
        servicePayload.createdAt = Date.now();
        await addDoc(collection(db, 'services'), servicePayload);
        setStatusMsg({ text: 'تمت إضافة الخدمة بنجاح!', type: 'success' });
      } else {
        await updateDoc(doc(db, 'services', editId), servicePayload);
        setStatusMsg({ text: 'تم تحديث الخدمة بنجاح!', type: 'success' });
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
          إدارة الخدمات
        </h1>

        {/* Service Form Card */}
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
            {editId ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}
          </h3>

          <form onSubmit={handleSubmit} id="add-service-form">
            <div className="form-group">
              <label htmlFor="service-title">عنوان الخدمة</label>
              <input
                type="text"
                id="service-title"
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="service-slug">الرابط الإنجليزي (Slug) - يجب أن يكون فريداً</label>
              <input
                type="text"
                id="service-slug"
                className="form-control"
                placeholder="مثال: custom-development"
                dir="ltr"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="service-desc">الوصف</label>
              <textarea
                id="service-desc"
                className="form-control"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  id="service-featured"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                />
                <span>خدمة مميزة (تظهر في الرئيسية)</span>
              </label>
            </div>

            <div className="form-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="submit"
                className="btn"
                id="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'جاري الحفظ...' : editId ? 'حفظ التعديل' : 'إضافة'}
              </button>

              {editId && (
                <button
                  type="button"
                  className="btn btn-danger"
                  id="cancel-edit-btn"
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

        {/* Services Table Card */}
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
            قائمة الخدمات ({services.length})
          </h3>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>العنوان</th>
                  <th>مميزة</th>
                  <th style={{ width: '150px' }}>إجراءات</th>
                </tr>
              </thead>
              <tbody id="services-list">
                {loadingServices && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '20px' }}>
                      جاري التحميل...
                    </td>
                  </tr>
                )}

                {!loadingServices && services.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '20px' }}>
                      لا توجد خدمات بعد.
                    </td>
                  </tr>
                )}

                {!loadingServices &&
                  services.map((srv) => (
                    <tr key={srv.id}>
                      <td>
                        <strong>{srv.title}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                          /{srv.slug || srv.id}
                        </div>
                      </td>
                      <td>{srv.featured ? '✅ نعم' : '❌ لا'}</td>
                      <td>
                        <div className="table-actions" style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => handleEdit(srv)}
                          >
                            تعديل
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(srv.id)}
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
