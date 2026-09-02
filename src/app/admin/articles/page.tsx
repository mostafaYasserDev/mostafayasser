'use strict';
'use client';

import React, { useEffect, useState, useRef } from 'react';
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

export interface AdminArticle {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  coverImage?: string;
  publishDate?: string;
  createdAt?: number;
}

const MAX_ENCODED_IMAGE_SIZE = 550 * 1024;

// Image compression matching original
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas error'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        const encoded = canvas.toDataURL('image/webp', 0.72);
        if (encoded.length > MAX_ENCODED_IMAGE_SIZE) {
          reject(new Error('الصورة كبيرة بعد الضغط. استخدم صورة أصغر.'));
          return;
        }
        resolve(encoded);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

export default function AdminArticlesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Form State
  const [articleId, setArticleId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [progressMsg, setProgressMsg] = useState('');

  // Modals state
  const [showCtaModal, setShowCtaModal] = useState(false);
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [ctaColor, setCtaColor] = useState('primary');

  const [showHtmlModal, setShowHtmlModal] = useState(false);
  const [customHtmlCode, setCustomHtmlCode] = useState('');
  const htmlIframeRef = useRef<HTMLIFrameElement>(null);

  // Quill Editor instance ref
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInstance = useRef<any>(null);

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

  // Load Quill Editor dynamically on mount
  useEffect(() => {
    let isMounted = true;

    async function initQuill() {
      if (typeof window === 'undefined' || !editorRef.current || quillInstance.current) return;

      try {
        const QuillModule = await import('quill');
        const Quill = QuillModule.default || QuillModule;

        if (!isMounted || !editorRef.current) return;

        // Register custom blots
        try {
          const Inline = Quill.import('blots/inline') as any;
          if (Inline) {
            class CTAButtonBlot extends Inline {
              static create(value: any) {
                const node = super.create();
                node.setAttribute('href', value.href || '#');
                node.setAttribute('target', '_blank');
                node.setAttribute('rel', 'noopener noreferrer');
                node.className = value.classes || 'inline-btn inline-btn-primary';
                return node;
              }
              static formats(node: HTMLElement) {
                return {
                  href: node.getAttribute('href'),
                  classes: node.className,
                };
              }
            }
            (CTAButtonBlot as any).blotName = 'cta-button';
            (CTAButtonBlot as any).tagName = 'A';
            (CTAButtonBlot as any).className = 'inline-btn';
            Quill.register(CTAButtonBlot, true);
          }
        } catch (e) {
          // blot might already be registered
        }

        quillInstance.current = new Quill(editorRef.current, {
          theme: 'snow',
          placeholder: 'اكتب مقالك الرائع هنا...',
          modules: {
            toolbar: '#art-toolbar',
          },
        });

        if (quillInstance.current?.root) {
          quillInstance.current.root.setAttribute('dir', 'rtl');
          quillInstance.current.root.style.direction = 'rtl';
          quillInstance.current.root.style.textAlign = 'right';
        }
      } catch (err) {
        console.error('Failed to init Quill:', err);
      }
    }

    if (!checkingAuth && currentUser) {
      initQuill();
    }

    return () => {
      isMounted = false;
    };
  }, [checkingAuth, currentUser]);

  // Realtime articles listener
  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, 'articles'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: AdminArticle[] = [];
        snapshot.forEach((docSnap) => {
          items.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<AdminArticle, 'id'>),
          });
        });

        // Sort by publishDate or createdAt desc
        items.sort((a, b) => {
          const timeA = new Date(a.publishDate || a.createdAt || 0).getTime();
          const timeB = new Date(b.publishDate || b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        setArticles(items);
        setLoadingArticles(false);
      },
      (error) => {
        console.error('Error fetching articles:', error);
        setLoadingArticles(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Auto-update HTML iframe preview
  useEffect(() => {
    if (htmlIframeRef.current) {
      htmlIframeRef.current.srcdoc = customHtmlCode;
    }
  }, [customHtmlCode]);

  // CTA Insert Handler
  const handleInsertCta = () => {
    if (!ctaText.trim() || !ctaUrl.trim()) return;
    let url = ctaUrl.trim();
    if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) {
      url = 'https://' + url;
    }

    if (quillInstance.current) {
      const selection = quillInstance.current.getSelection(true);
      const idx = selection ? selection.index : quillInstance.current.getLength();
      quillInstance.current.insertText(idx, ctaText.trim(), {
        'cta-button': { href: url, classes: `inline-btn inline-btn-${ctaColor}` },
      });
      quillInstance.current.setSelection(idx + ctaText.trim().length + 1);
    }

    setShowCtaModal(false);
    setCtaText('');
    setCtaUrl('');
  };

  // HTML Insert Handler
  const handleInsertHtml = () => {
    if (!customHtmlCode.trim()) {
      setShowHtmlModal(false);
      return;
    }

    if (quillInstance.current) {
      const idx = quillInstance.current.getLength();
      quillInstance.current.clipboard.dangerouslyPasteHTML(idx, customHtmlCode.trim());
    }

    setShowHtmlModal(false);
    setCustomHtmlCode('');
  };

  // HTML File Import Handler
  const handleHtmlFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomHtmlCode(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  // Edit Article Handler
  const handleEdit = (art: AdminArticle) => {
    setArticleId(art.id);
    setTitle(art.title);
    setSlug(art.slug || art.id);
    setShortDesc(art.shortDescription || '');
    setCoverImage(art.coverImage || '');
    setSelectedFile(null);

    if (quillInstance.current) {
      quillInstance.current.root.innerHTML = art.content || '';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel Edit
  const handleCancelEdit = () => {
    setArticleId(null);
    setTitle('');
    setSlug('');
    setShortDesc('');
    setCoverImage('');
    setSelectedFile(null);
    if (quillInstance.current) {
      quillInstance.current.root.innerHTML = '';
    }
    setStatusMsg(null);
  };

  // Delete Article Handler
  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المقال نهائياً؟')) {
      try {
        await deleteDoc(doc(db, 'articles', id));
        if (articleId === id) {
          handleCancelEdit();
        }
      } catch (err: any) {
        alert(translateFirebaseError(err));
      }
    }
  };

  // Save Article (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      setStatusMsg({ text: 'يرجى إدخال العنوان والرابط.', type: 'error' });
      return;
    }

    const htmlContent = quillInstance.current ? quillInstance.current.root.innerHTML : '';
    if (!htmlContent || htmlContent === '<p><br></p>') {
      setStatusMsg({ text: 'المحتوى لا يمكن أن يكون فارغاً.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg({ text: 'جاري الحفظ...', type: 'info' });

    try {
      let finalCoverImage = coverImage;

      // Handle image compression if selected
      if (selectedFile) {
        setProgressMsg('جاري ضغط ومعالجة الصورة...');
        finalCoverImage = await compressImage(selectedFile);
        setProgressMsg('');
      }

      let targetSlug = slug.trim().replace(/-+$/, '');

      // Check slug uniqueness
      const slugQuery = query(collection(db, 'articles'), where('slug', '==', targetSlug));
      const slugSnap = await getDocs(slugQuery);
      let isDuplicate = false;
      slugSnap.forEach((docSnap) => {
        if (docSnap.id !== articleId) isDuplicate = true;
      });

      if (isDuplicate) {
        targetSlug = `${targetSlug}-${Date.now().toString().slice(-4)}`;
      }

      const articlePayload: any = {
        title: title.trim(),
        slug: targetSlug,
        shortDescription: shortDesc.trim(),
        content: htmlContent,
        coverImage: finalCoverImage || null,
        updatedAt: Date.now(),
      };

      if (!articleId) {
        articlePayload.publishDate = new Date().toISOString().split('T')[0];
        articlePayload.createdAt = Date.now();
        await addDoc(collection(db, 'articles'), articlePayload);
        setStatusMsg({ text: 'تمت إضافة المقال بنجاح!', type: 'success' });
      } else {
        await updateDoc(doc(db, 'articles', articleId), articlePayload);
        setStatusMsg({ text: 'تم تحديث المقال بنجاح!', type: 'success' });
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
      {/* Quill stylesheet link */}
      <link rel="stylesheet" href="/vendor/quill/quill.snow.css" />

      <AdminSidebar />

      <main className="main-content">
        <h1 style={{ marginBottom: '24px', color: 'var(--admin-primary-dark)' }}>
          إدارة المقالات
        </h1>

        {/* Article Form Card */}
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
            {articleId ? 'تعديل المقال' : 'إضافة مقال جديد'}
          </h3>

          <form onSubmit={handleSubmit} id="article-form">
            <div className="form-group">
              <label htmlFor="art-title">عنوان المقال</label>
              <input
                type="text"
                id="art-title"
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="art-slug">الرابط الإنجليزي (Slug) - يجب أن يكون فريداً</label>
              <input
                type="text"
                id="art-slug"
                className="form-control"
                placeholder="مثال: my-new-article"
                dir="ltr"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
              <small style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem' }}>
                يُستخدم في الرابط (SEO). الحروف الإنجليزية والأرقام وعلامة (-) فقط.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="art-desc">وصف قصير</label>
              <input
                type="text"
                id="art-desc"
                className="form-control"
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>المحتوى</label>

              {/* Custom Quill Toolbar */}
              <div id="art-toolbar" dir="rtl" style={{ background: '#fafafa', borderRadius: '8px 8px 0 0', border: '1px solid var(--admin-border)' }}>
                <span className="ql-formats">
                  <select className="ql-header" defaultValue="">
                    <option value="1" />
                    <option value="2" />
                    <option value="3" />
                    <option value="" />
                  </select>
                </span>
                <span className="ql-formats">
                  <button className="ql-bold" />
                  <button className="ql-italic" />
                  <button className="ql-underline" />
                  <button className="ql-strike" />
                </span>
                <span className="ql-formats">
                  <button className="ql-list" value="ordered" />
                  <button className="ql-list" value="bullet" />
                </span>
                <span className="ql-formats">
                  <button className="ql-link" />
                  <button className="ql-image" />
                  <button className="ql-video" />
                </span>
                <span className="ql-formats">
                  <button className="ql-clean" />
                </span>
                <span className="ql-formats">
                  <button
                    type="button"
                    title="إدراج زر برابط"
                    onClick={() => setShowCtaModal(true)}
                    style={{ width: 'auto', padding: '0 8px', fontSize: '11px', fontWeight: 'bold' }}
                  >
                    🔗 زر
                  </button>
                  <button
                    type="button"
                    title="إدراج HTML مخصص"
                    onClick={() => setShowHtmlModal(true)}
                    style={{ width: 'auto', padding: '0 8px', fontSize: '11px', fontWeight: 'bold' }}
                  >
                    &lt;/&gt; HTML
                  </button>
                </span>
              </div>

              {/* Quill Editor Container */}
              <div
                ref={editorRef}
                id="editor-container"
                style={{
                  minHeight: '260px',
                  background: 'var(--admin-surface)',
                  borderRadius: '0 0 8px 8px',
                  border: '1px solid var(--admin-border)',
                  borderTop: 'none',
                }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="art-image">صورة الغلاف (اختياري)</label>
              <input
                type="file"
                id="art-image"
                className="form-control"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              {progressMsg && (
                <div style={{ fontSize: '0.9rem', color: 'var(--admin-primary)', marginTop: '5px' }}>
                  {progressMsg}
                </div>
              )}
              {coverImage && !selectedFile && (
                <div style={{ marginTop: '10px' }}>
                  <img
                    src={coverImage}
                    alt="معاينة الغلاف"
                    style={{ height: '70px', borderRadius: '8px', objectFit: 'cover' }}
                  />
                </div>
              )}
            </div>

            <div className="form-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="submit"
                className="btn"
                id="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'جاري الحفظ...' : articleId ? 'تحديث المقال' : 'حفظ المقال'}
              </button>

              {articleId && (
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

        {/* Articles Table Card */}
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
            قائمة المقالات ({articles.length})
          </h3>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>صورة</th>
                  <th>العنوان</th>
                  <th>التاريخ</th>
                  <th style={{ width: '150px' }}>إجراءات</th>
                </tr>
              </thead>
              <tbody id="articles-list">
                {loadingArticles && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
                      جاري التحميل...
                    </td>
                  </tr>
                )}

                {!loadingArticles && articles.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
                      لا توجد مقالات بعد.
                    </td>
                  </tr>
                )}

                {!loadingArticles &&
                  articles.map((art) => (
                    <tr key={art.id}>
                      <td>
                        {art.coverImage ? (
                          <img
                            src={art.coverImage}
                            className="table-img"
                            alt={art.title}
                            style={{ width: '50px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                          />
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <strong>{art.title}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                          /{art.slug || art.id}
                        </div>
                      </td>
                      <td>{art.publishDate || '—'}</td>
                      <td>
                        <div className="table-actions" style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => handleEdit(art)}
                          >
                            تعديل
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(art.id)}
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

      {/* ===== CTA BUTTON MODAL ===== */}
      {showCtaModal && (
        <div
          className="cta-modal-overlay active"
          onClick={() => setShowCtaModal(false)}
          style={{ display: 'flex' }}
        >
          <div
            className="cta-modal"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4>⚡ إدراج زر برابط</h4>
            <div className="form-group">
              <label>نص الزر</label>
              <input
                type="text"
                placeholder="مثال: اشترك الآن"
                maxLength={80}
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>الرابط (URL)</label>
              <input
                type="url"
                placeholder="https://"
                dir="ltr"
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>لون الزر</label>
              <div className="color-picker" id="cta-color-picker">
                {[
                  { color: 'primary', bg: '#8C5A35', title: 'أساسي (بني)' },
                  { color: 'secondary', bg: '#A3B18A', title: 'ثانوي (أخضر مائل)' },
                  { color: 'gold', bg: '#D4A373', title: 'ذهبي' },
                  { color: 'dark', bg: '#3E2723', title: 'داكن' },
                  { color: 'green', bg: '#4CAF50', title: 'أخضر' },
                ].map((item) => (
                  <div
                    key={item.color}
                    className={`color-swatch ${ctaColor === item.color ? 'selected' : ''}`}
                    style={{ background: item.bg }}
                    title={item.title}
                    onClick={() => setCtaColor(item.color)}
                  />
                ))}
              </div>
            </div>
            <div className="cta-modal-footer">
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setShowCtaModal(false)}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="btn"
                onClick={handleInsertCta}
              >
                إدراج الزر
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CUSTOM HTML MODAL ===== */}
      {showHtmlModal && (
        <div
          className="cta-modal-overlay active"
          onClick={() => setShowHtmlModal(false)}
          style={{ display: 'flex' }}
        >
          <div
            className="cta-modal"
            dir="rtl"
            style={{ width: 'min(900px, 95vw)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ margin: 0 }}>📄 محرر كود HTML المخصص</h4>
              <div>
                <label className="btn btn-outline" style={{ padding: '5px 10px', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <i className="fas fa-file-upload" /> استيراد ملف
                  <input
                    type="file"
                    accept=".html"
                    style={{ display: 'none' }}
                    onChange={handleHtmlFileUpload}
                  />
                </label>
              </div>
            </div>

            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>كود HTML</label>
                <textarea
                  style={{
                    height: '300px',
                    fontFamily: 'monospace',
                    direction: 'ltr',
                    textAlign: 'left',
                    padding: '15px',
                    background: '#2d2d2d',
                    color: '#f8f8f2',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    width: '100%',
                  }}
                  placeholder="<!-- اكتب كود HTML هنا -->"
                  value={customHtmlCode}
                  onChange={(e) => setCustomHtmlCode(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>المعاينة الحية</label>
                <iframe
                  ref={htmlIframeRef}
                  title="معاينة ملف HTML"
                  style={{
                    width: '100%',
                    height: '300px',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    background: '#fff',
                  }}
                  sandbox="allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox"
                />
              </div>
            </div>

            <div className="cta-modal-footer" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setShowHtmlModal(false)}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="btn"
                onClick={handleInsertHtml}
              >
                إدراج في المقال
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
