'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  auth,
  onAuthStateChanged,
  db,
  doc,
  getDoc,
  setDoc,
  User,
} from '@/lib/firebase';
import { updateEmail, updatePassword } from 'firebase/auth';
import { translateFirebaseError } from '@/lib/admin-utils';
import AdminSidebar from '@/components/admin/AdminSidebar';

export interface ExtraSocialLink {
  id: string;
  name: string;
  url: string;
  icon?: string;
  visible?: boolean;
}

const MAX_CV_SIZE = 450 * 1024;
const MAX_IMAGE_SIZE = 550 * 1024;

// Image compression to WebP matching original
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

        const encoded = canvas.toDataURL('image/webp', 0.75);
        if (encoded.length > MAX_IMAGE_SIZE) {
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

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_CV_SIZE) {
      reject(new Error('حجم ملف PDF أكبر من 450 كيلوبايت.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Account Settings State
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [emailMsg, setEmailMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Contact Settings State
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [telegramUrl, setTelegramUrl] = useState('');
  const [telegramVisible, setTelegramVisible] = useState(true);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [linkedinVisible, setLinkedinVisible] = useState(true);
  const [githubUrl, setGithubUrl] = useState('');
  const [githubVisible, setGithubVisible] = useState(true);
  const [extraSocials, setExtraSocials] = useState<ExtraSocialLink[]>([]);
  const [contactMsg, setContactMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [savingContact, setSavingContact] = useState(false);

  // General Settings State (About, CV, Image)
  const [aboutText, setAboutText] = useState('');
  const [cvData, setCvData] = useState<string | null>(null);
  const [aboutImage, setAboutImage] = useState<string | null>(null);
  const [generalMsg, setGeneralMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [savingGeneral, setSavingGeneral] = useState(false);

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/admin/login');
      } else {
        setCurrentUser(user);
        setNewEmail(user.email || '');
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Load Initial Settings from Firestore
  useEffect(() => {
    if (!currentUser) return;

    async function loadSettings() {
      try {
        // 1. Load Contact Settings
        const contactSnap = await getDoc(doc(db, 'settings', 'contact'));
        if (contactSnap.exists()) {
          const data = contactSnap.data();
          setContactEmail(data.email || '');
          setContactPhone(data.phone || '');
          setTelegramUrl(data.telegram || '');
          setLinkedinUrl(data.linkedin || '');
          setGithubUrl(data.github || '');
          setTelegramVisible(data.telegramVisible !== false);
          setLinkedinVisible(data.linkedinVisible !== false);
          setGithubVisible(data.githubVisible !== false);
          setExtraSocials(Array.isArray(data.extraSocialLinks) ? data.extraSocialLinks : []);
        }

        // 2. Load General Settings
        const generalSnap = await getDoc(doc(db, 'settings', 'general'));
        if (generalSnap.exists()) {
          const data = generalSnap.data();
          setAboutText(data.aboutText || '');
          setCvData(data.cvData || null);
          setAboutImage(data.aboutImage || null);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    }

    loadSettings();
  }, [currentUser]);

  // Handle Update Email
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newEmail.trim()) return;

    try {
      setEmailMsg(null);
      await updateEmail(auth.currentUser, newEmail.trim());
      setEmailMsg({ text: 'تم تحديث البريد الإلكتروني بنجاح.', type: 'success' });
    } catch (err: any) {
      console.error(err);
      setEmailMsg({ text: translateFirebaseError(err), type: 'error' });
    }
  };

  // Handle Update Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newPassword.trim()) return;

    try {
      setPasswordMsg(null);
      await updatePassword(auth.currentUser, newPassword.trim());
      setPasswordMsg({ text: 'تم تحديث كلمة المرور بنجاح.', type: 'success' });
      setNewPassword('');
    } catch (err: any) {
      console.error(err);
      setPasswordMsg({ text: translateFirebaseError(err), type: 'error' });
    }
  };

  // Extra Social Links Handlers
  const handleAddExtraSocial = () => {
    setExtraSocials([
      ...extraSocials,
      {
        id: `extra-${Date.now()}`,
        name: '',
        url: '',
        icon: 'fas fa-link',
        visible: true,
      },
    ]);
  };

  const handleUpdateExtraSocial = (id: string, field: string, val: any) => {
    setExtraSocials(
      extraSocials.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleRemoveExtraSocial = (id: string) => {
    setExtraSocials(extraSocials.filter((item) => item.id !== id));
  };

  // Handle Save Contact Settings
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContact(true);
    setContactMsg(null);

    try {
      let formattedTelegram = telegramUrl.trim();
      if (formattedTelegram && !/^https?:\/\//i.test(formattedTelegram)) {
        formattedTelegram = `https://t.me/${formattedTelegram.replace(/^@/, '')}`;
      }

      const payload = {
        email: contactEmail.trim(),
        phone: contactPhone.trim(),
        telegram: formattedTelegram,
        linkedin: linkedinUrl.trim(),
        github: githubUrl.trim(),
        telegramVisible,
        linkedinVisible,
        githubVisible,
        extraSocialLinks: extraSocials.filter((s) => s.name.trim() && s.url.trim()),
        updatedAt: Date.now(),
      };

      await setDoc(doc(db, 'settings', 'contact'), payload, { merge: true });
      setContactMsg({ text: 'تم حفظ معلومات التواصل بنجاح!', type: 'success' });
      setTimeout(() => setContactMsg(null), 3500);
    } catch (err: any) {
      console.error(err);
      setContactMsg({ text: translateFirebaseError(err), type: 'error' });
    } finally {
      setSavingContact(false);
    }
  };

  // CV File Upload Handler
  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await readFileAsBase64(file);
      setCvData(base64);
    } catch (err: any) {
      alert(err.message || 'تعذر قراءة ملف PDF.');
    }
  };

  // About Image Upload Handler
  const handleAboutImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await compressImage(file);
      setAboutImage(base64);
    } catch (err: any) {
      alert(err.message || 'تعذر معالجة الصورة.');
    }
  };

  // Handle Save General Settings (About / CV / Image)
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGeneral(true);
    setGeneralMsg(null);

    try {
      const payload = {
        aboutText: aboutText.trim(),
        cvData: cvData || null,
        aboutImage: aboutImage || null,
        updatedAt: Date.now(),
      };

      await setDoc(doc(db, 'settings', 'general'), payload, { merge: true });
      setGeneralMsg({ text: 'تم حفظ إعدادات الصفحة الرئيسية بنجاح!', type: 'success' });
      setTimeout(() => setGeneralMsg(null), 3500);
    } catch (err: any) {
      console.error(err);
      setGeneralMsg({ text: translateFirebaseError(err), type: 'error' });
    } finally {
      setSavingGeneral(false);
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
        <h1>إعدادات الموقع والحساب</h1>

        <div className="settings-grid">
          {/* Card 1: Account Credentials */}
          <div className="card">
            <h3>تغيير البريد الإلكتروني أو كلمة المرور</h3>

            {/* Email Form */}
            <form id="email-form" onSubmit={handleUpdateEmail} style={{ marginBottom: '20px', borderBottom: '1px solid var(--admin-border)', paddingBottom: '20px' }}>
              <div className="form-group">
                <label htmlFor="new-email">البريد الإلكتروني الجديد</label>
                <input
                  type="email"
                  id="new-email"
                  className="form-control"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn">
                تحديث البريد
              </button>
              {emailMsg && (
                <div id="email-msg" className={`msg ${emailMsg.type}`}>
                  {emailMsg.text}
                </div>
              )}
            </form>

            {/* Password Form */}
            <form id="password-form" onSubmit={handleUpdatePassword}>
              <div className="form-group">
                <label htmlFor="new-password">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  id="new-password"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <button type="submit" className="btn">
                تحديث كلمة المرور
              </button>
              {passwordMsg && (
                <div id="password-msg" className={`msg ${passwordMsg.type}`}>
                  {passwordMsg.text}
                </div>
              )}
            </form>
          </div>

          {/* Card 2: Contact Information */}
          <div className="card">
            <h3>معلومات التواصل (تظهر في الفوتر وقسم التواصل)</h3>

            <form id="contact-form" onSubmit={handleSaveContact}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="contact-email">البريد الإلكتروني للتواصل</label>
                  <input
                    type="email"
                    id="contact-email"
                    className="form-control"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contact-phone">رقم الهاتف</label>
                  <input
                    type="text"
                    id="contact-phone"
                    className="form-control"
                    dir="ltr"
                    style={{ textAlign: 'left' }}
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
              </div>

              <h4 style={{ margin: '20px 0 10px', color: 'var(--admin-primary)' }}>
                الروابط الأساسية
              </h4>
              <p className="hint">
                تليجرام، لينكدإن، وجيتهب — تظهر دائماً بأيقوناتها الرسمية في الموقع.
              </p>

              <div className="primary-social-grid">
                {/* Telegram */}
                <div className="primary-social-item">
                  <label htmlFor="contact-telegram">
                    <i className="fab fa-telegram" /> تليجرام
                  </label>
                  <input
                    type="text"
                    id="contact-telegram"
                    className="form-control"
                    dir="ltr"
                    style={{ textAlign: 'left' }}
                    placeholder="@username أو https://t.me/..."
                    value={telegramUrl}
                    onChange={(e) => setTelegramUrl(e.target.value)}
                  />
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      id="telegram-visible"
                      checked={telegramVisible}
                      onChange={(e) => setTelegramVisible(e.target.checked)}
                    />{' '}
                    إظهار في الموقع
                  </label>
                </div>

                {/* LinkedIn */}
                <div className="primary-social-item">
                  <label htmlFor="contact-linkedin">
                    <i className="fab fa-linkedin-in" /> لينكدإن
                  </label>
                  <input
                    type="url"
                    id="contact-linkedin"
                    className="form-control"
                    dir="ltr"
                    style={{ textAlign: 'left' }}
                    placeholder="https://linkedin.com/in/..."
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                  />
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      id="linkedin-visible"
                      checked={linkedinVisible}
                      onChange={(e) => setLinkedinVisible(e.target.checked)}
                    />{' '}
                    إظهار في الموقع
                  </label>
                </div>

                {/* GitHub */}
                <div className="primary-social-item">
                  <label htmlFor="contact-github">
                    <i className="fab fa-github" /> جيتهب
                  </label>
                  <input
                    type="url"
                    id="contact-github"
                    className="form-control"
                    dir="ltr"
                    style={{ textAlign: 'left' }}
                    placeholder="https://github.com/..."
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                  />
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      id="github-visible"
                      checked={githubVisible}
                      onChange={(e) => setGithubVisible(e.target.checked)}
                    />{' '}
                    إظهار في الموقع
                  </label>
                </div>
              </div>

              {/* Extra Social Links */}
              <h4 style={{ margin: '24px 0 10px', color: 'var(--admin-primary)' }}>
                روابط تواصل أخرى
              </h4>
              <p className="hint">
                أضف منصات إضافية (إنستغرام، فيسبوك، قبيلة، مرتكز…).
              </p>

              <div id="extra-social-list">
                {extraSocials.map((social) => (
                  <div key={social.id} className="social-link-row">
                    <div className="social-link-row-head">
                      <div className="form-group" style={{ flex: 1, minWidth: '140px', marginBottom: 0 }}>
                        <label>اسم المنصة</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="الاسم"
                          value={social.name}
                          onChange={(e) => handleUpdateExtraSocial(social.id, 'name', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ flex: 2, minWidth: '200px', marginBottom: 0 }}>
                        <label>الرابط</label>
                        <input
                          type="url"
                          className="form-control"
                          placeholder="https://"
                          dir="ltr"
                          value={social.url}
                          onChange={(e) => handleUpdateExtraSocial(social.id, 'url', e.target.value)}
                        />
                      </div>
                      <div className="social-link-row-actions" style={{ alignSelf: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveExtraSocial(social.id)}
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                id="add-extra-social"
                onClick={handleAddExtraSocial}
                style={{ marginTop: '10px' }}
              >
                + إضافة رابط تواصل آخر
              </button>

              <div style={{ marginTop: '20px' }}>
                <button type="submit" className="btn" disabled={savingContact}>
                  {savingContact ? 'جاري الحفظ...' : 'حفظ معلومات التواصل'}
                </button>
              </div>

              {contactMsg && (
                <div id="contact-msg" className={`msg ${contactMsg.type}`}>
                  {contactMsg.text}
                </div>
              )}
            </form>
          </div>

          {/* Card 3: Home Page Settings (About / CV / Image) */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h3>إعدادات الصفحة الرئيسية</h3>

            <form id="general-form" onSubmit={handleSaveGeneral}>
              <div className="form-group">
                <label htmlFor="about-text">نبذة «من أنا؟»</label>
                <textarea
                  id="about-text"
                  className="form-control"
                  rows={8}
                  placeholder="اكتب نبذتك هنا..."
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                />
                <p className="hint">
                  افصل بين الفقرات بسطر فارغ.
                </p>
              </div>

              <div className="general-grid">
                {/* CV PDF Upload */}
                <div>
                  <div className="form-group">
                    <label>السيرة الذاتية (PDF)</label>
                    <input
                      type="file"
                      id="cv-file"
                      className="form-control"
                      accept=".pdf,application/pdf"
                      onChange={handleCvUpload}
                    />
                    <p className="hint">
                      الحد الأقصى: 450 كيلوبايت للحفاظ على حد مستند Firestore.
                    </p>
                    <div id="cv-status" className="cv-status">
                      {cvData ? '✅ تم رفع ملف السيرة الذاتية.' : 'لم يتم رفع ملف بعد.'}
                    </div>
                  </div>
                  {cvData && (
                    <button
                      type="button"
                      id="remove-cv-btn"
                      className="btn btn-danger btn-sm"
                      onClick={() => setCvData(null)}
                      style={{ marginTop: '5px' }}
                    >
                      حذف السيرة الذاتية
                    </button>
                  )}
                </div>

                {/* About Image Upload */}
                <div>
                  <div className="form-group">
                    <label>صورة «من أنا؟»</label>
                    <input
                      type="file"
                      id="about-image"
                      className="form-control"
                      accept="image/*"
                      onChange={handleAboutImageUpload}
                    />
                    {aboutImage && (
                      <img
                        id="about-preview"
                        src={aboutImage}
                        className="preview-img"
                        alt="معاينة"
                      />
                    )}
                  </div>
                  {aboutImage && (
                    <button
                      type="button"
                      id="remove-about-btn"
                      className="btn btn-danger btn-sm"
                      onClick={() => setAboutImage(null)}
                      style={{ marginTop: '5px' }}
                    >
                      حذف الصورة
                    </button>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '15px' }}>
                <button type="submit" className="btn" disabled={savingGeneral}>
                  {savingGeneral ? 'جاري الحفظ...' : 'حفظ إعدادات الصفحة الرئيسية'}
                </button>
              </div>

              {generalMsg && (
                <div id="general-msg" className={`msg ${generalMsg.type}`}>
                  {generalMsg.text}
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
