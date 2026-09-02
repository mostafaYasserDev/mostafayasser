'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { db, doc, onSnapshot, collection, addDoc } from '@/lib/firebase';

interface ContactInfoData {
  email?: string;
  phone?: string;
  telegram?: string;
  linkedin?: string;
  github?: string;
  telegramVisible?: boolean;
  linkedinVisible?: boolean;
  githubVisible?: boolean;
  extraSocialLinks?: Array<{
    id: string;
    name?: string;
    label?: string;
    url: string;
    icon?: string;
    preset?: string;
    customIcon?: string;
    visible?: boolean;
    order?: number;
  }>;
  socialLinks?: Array<{
    preset: string;
    url: string;
    label?: string;
    customIcon?: string;
    visible?: boolean;
    order?: number;
  }>;
}

const SOCIAL_PRESETS: Record<string, { label: string; fa: string }> = {
  telegram: { label: 'تليجرام', fa: 'fab fa-telegram' },
  linkedin: { label: 'لينكدإن', fa: 'fab fa-linkedin-in' },
  github: { label: 'جيتهب', fa: 'fab fa-github' },
  facebook: { label: 'فيسبوك', fa: 'fab fa-facebook-f' },
  instagram: { label: 'إنستغرام', fa: 'fab fa-instagram' },
  tiktok: { label: 'تيك توك', fa: 'fab fa-tiktok' },
  youtube: { label: 'يوتيوب', fa: 'fab fa-youtube' },
  twitter: { label: 'X (تويتر)', fa: 'fab fa-x-twitter' },
  whatsapp: { label: 'واتساب', fa: 'fab fa-whatsapp' },
  qabilah: { label: 'قبيلة', fa: 'fas fa-users' },
  mrtakz: { label: 'مرتكز', fa: 'fas fa-briefcase' },
  snapchat: { label: 'سناب شات', fa: 'fab fa-snapchat' },
  discord: { label: 'ديسكورد', fa: 'fab fa-discord' },
  behance: { label: 'بيهانس', fa: 'fab fa-behance' },
  dribbble: { label: 'Dribbble', fa: 'fab fa-dribbble' },
  custom: { label: 'مخصص / أخرى', fa: 'fas fa-link' },
};

export default function ContactSection() {
  const [mounted, setMounted] = useState(false);
  const [contactData, setContactData] = useState<ContactInfoData | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Realtime load contact settings from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'contact'),
      (snap) => {
        if (snap.exists()) {
          setContactData(snap.data() as ContactInfoData);
        }
        setLoadingInfo(false);
      },
      (err) => {
        console.error('Error fetching contact settings:', err);
        setLoadingInfo(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Lock body scroll and listen for ESC key when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsModalOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setStatus({ type: 'error', text: 'يرجى ملء جميع الحقول المطلوبة.' });
      return;
    }

    if (trimmedName.length < 2 || trimmedMessage.length < 10) {
      setStatus({ type: 'error', text: 'الاسم أو الرسالة قصيرة جداً.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);

    try {
      await addDoc(collection(db, 'messages'), {
        name: trimmedName,
        email: trimmedEmail,
        message: trimmedMessage,
        date: new Date().toISOString(),
        createdAt: Date.now(),
        read: false,
        source: 'contact-form',
      });

      setName('');
      setEmail('');
      setMessage('');
      setStatus({
        type: 'success',
        text: 'تم إرسال رسالتك بنجاح! سأتواصل معك قريباً.',
      });
    } catch (err) {
      console.error(err);
      setStatus({
        type: 'error',
        text: 'حدث خطأ أثناء الإرسال. حاول مجدداً.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const emailVal = contactData?.email || 'moustafa0yasser123@gmail.com';
  const phoneVal = contactData?.phone || '+20 109 299 1028';

  // Primary links (Telegram, LinkedIn, GitHub)
  const primaryLinks = [
    {
      key: 'telegram',
      label: 'تليجرام',
      icon: 'fab fa-telegram',
      url: contactData?.telegram || 'https://t.me/mostafayasserdev',
      visible: contactData?.telegramVisible !== false,
    },
    {
      key: 'linkedin',
      label: 'لينكدإن',
      icon: 'fab fa-linkedin-in',
      url: contactData?.linkedin || 'https://linkedin.com/in/mostafa-yasser',
      visible: contactData?.linkedinVisible !== false,
    },
    {
      key: 'github',
      label: 'جيتهب',
      icon: 'fab fa-github',
      url: contactData?.github || 'https://github.com/mostafaYasserDev',
      visible: contactData?.githubVisible !== false,
    },
  ].filter((l) => l.visible && l.url);

  // Extra links
  const extraLinks = (contactData?.extraSocialLinks || []).filter(
    (l) => l.visible !== false && l.url
  );

  // Combine for Modal
  const allModalLinks = [
    ...primaryLinks.map((p) => ({
      label: p.label,
      url: p.url,
      icon: p.icon,
      customIcon: '',
    })),
    ...extraLinks.map((ex) => {
      const presetKey = ex.preset || (ex.name ? ex.name.toLowerCase() : 'custom');
      const preset = SOCIAL_PRESETS[presetKey] || SOCIAL_PRESETS.custom;
      return {
        label: ex.name || ex.label || preset.label,
        url: ex.url,
        icon: ex.icon || preset.fa,
        customIcon: ex.customIcon || '',
      };
    }),
  ];

  return (
    <>
      <section id="contact" className="contact-section" data-aos="fade-up">
        {/* Contact Info */}
        <div className="contact-info">
          <h2 className="section-title">لنصنع حكاية جديدة</h2>
          <p>تواصل معي لنبدأ مشروعك القادم ونروي معاً قصة نجاح.</p>

          <div id="dynamic-contact-info">
            {loadingInfo ? (
              <div className="skeleton-line" style={{ height: '20px', width: '60%' }} />
            ) : (
              <>
                {emailVal && (
                  <p>
                    <i className="fas fa-envelope" />{' '}
                    <a href={`mailto:${emailVal}`} dir="ltr">
                      {emailVal}
                    </a>
                  </p>
                )}
                {phoneVal && (
                  <p>
                    <i className="fas fa-phone" />{' '}
                    <span dir="ltr">{phoneVal}</span>
                  </p>
                )}

                <div className="social-bar">
                  <div className="social-links social-links--primary">
                    {/* Primary Links */}
                    {primaryLinks.map((link) => (
                      <a
                        key={link.key}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={link.label}
                        aria-label={`رابط إلى ${link.label}`}
                      >
                        <i className={link.icon} aria-hidden="true" />
                        <span>{link.label}</span>
                      </a>
                    ))}

                    {/* Plus Button for extra channels */}
                    {extraLinks.length > 0 && (
                      <button
                        type="button"
                        className="social-more-btn"
                        aria-label="عرض جميع روابط التواصل"
                        title="المزيد من قنوات التواصل"
                        onClick={() => setIsModalOpen(true)}
                      >
                        <i className="fas fa-plus" aria-hidden="true" />
                        <span>المزيد</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Contact Form */}
        <div className="contact-form">
          <div
            id="form-status"
            className={`form-status ${status ? status.type : ''}`}
            role="alert"
            style={{ display: status ? 'block' : 'none' }}
          >
            {status?.text}
          </div>

          <form id="public-contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="contact-name">الاسم</label>
              <input
                type="text"
                id="contact-name"
                placeholder="اسمك الكريم"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact-email-input">البريد الإلكتروني</label>
              <input
                type="email"
                id="contact-email-input"
                placeholder="example@email.com"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact-message">رسالتك</label>
              <textarea
                id="contact-message"
                rows={4}
                placeholder="اكتب رسالتك هنا..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn"
              style={{ width: '100%' }}
              disabled={submitting}
            >
              {submitting ? 'جاري الإرسال...' : 'إرسال الرسالة'}
            </button>
          </form>
        </div>
      </section>

      {/* ===== POPUP SOCIAL MODAL (Mounted directly to document.body via Portal) ===== */}
      {mounted &&
        isModalOpen &&
        createPortal(
          <div
            className="social-modal-overlay is-open"
            id="social-links-modal"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="social-modal glass-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="social-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="social-modal-close"
                aria-label="إغلاق"
                onClick={() => setIsModalOpen(false)}
              >
                ×
              </button>
              <span className="trunk-badge">جذور التواصل</span>
              <h3 id="social-modal-title" className="social-modal-title">
                جميع قنوات التواصل
              </h3>
              <p className="social-modal-sub">
                اختر المنصة التي تفضّلها للتواصل معي
              </p>
              <div className="social-modal-grid" id="social-modal-grid">
                {allModalLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-modal-link"
                    style={{ animationDelay: `${i * 0.06}s` }}
                    aria-label={`رابط إلى ${link.label}`}
                  >
                    <span className="social-modal-link-icon">
                      {link.customIcon ? (
                        <img
                          src={link.customIcon}
                          alt=""
                          className="social-modal-custom-icon"
                          loading="lazy"
                        />
                      ) : (
                        <i className={link.icon} aria-hidden="true" />
                      )}
                    </span>
                    <span className="social-modal-link-label">
                      {link.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
