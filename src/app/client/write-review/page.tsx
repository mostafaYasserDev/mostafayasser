'use strict';
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { db, collection, addDoc } from '@/lib/firebase';

export default function WriteReviewPage() {
  const [clientName, setClientName] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedName = clientName.trim();
    const trimmedReview = reviewText.trim();

    if (!trimmedName || !trimmedReview) {
      setErrorMsg('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    if (trimmedName.length < 2 || trimmedReview.length < 5) {
      setErrorMsg('الاسم أو الرأي قصير جداً.');
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'reviews'), {
        clientName: trimmedName,
        serviceName: serviceName.trim(),
        reviewText: trimmedReview,
        date: new Date().toISOString().split('T')[0],
        createdAt: Date.now(),
        visible: false, // Pending admin approval
      });

      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting review:', err);
      setErrorMsg('حدث خطأ أثناء إرسال الرأي. يرجى المحاولة لاحقاً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        padding: '40px 20px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          background: 'var(--card-bg)',
          padding: '40px',
          borderRadius: '24px',
          boxShadow: '0 15px 40px rgba(0,0,0,0.08)',
          width: '100%',
          maxWidth: '580px',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary)' }}>
            جذع <span style={{ color: 'var(--accent-dark)' }}>.</span>
          </span>
        </div>

        {!isSubmitted ? (
          <div>
            <h2
              className="section-title"
              style={{ fontSize: '1.8rem', textAlign: 'center', display: 'block', marginBottom: '12px' }}
            >
              شاركنا رأيك
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '30px', lineHeight: '1.8' }}>
              يسعدني سماع تجربتك. شاركني رأيك بحرية — سيُراجع قبل النشر في الموقع.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label htmlFor="client-name" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  اسمك أو اسم شركتك
                </label>
                <input
                  type="text"
                  id="client-name"
                  placeholder="مثال: أحمد محمد / شركة النور"
                  required
                  maxLength={100}
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--card-bg)',
                    color: 'var(--text-main)',
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label htmlFor="service-name" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  الخدمة التي قدمتها لك (اختياري)
                </label>
                <input
                  type="text"
                  id="service-name"
                  placeholder="مثال: تصميم موقع، تطوير تطبيق..."
                  maxLength={120}
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--card-bg)',
                    color: 'var(--text-main)',
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '22px' }}>
                <label htmlFor="review-text" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  رأيك وتجربتك
                </label>
                <textarea
                  id="review-text"
                  rows={5}
                  placeholder="اكتب رأيك هنا..."
                  required
                  maxLength={2000}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--card-bg)',
                    color: 'var(--text-main)',
                    resize: 'vertical',
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn"
                disabled={isSubmitting}
                style={{ width: '100%', padding: '14px', fontSize: '1.05rem' }}
              >
                {isSubmitting ? 'جاري الإرسال...' : 'إرسال الرأي'}
              </button>

              {errorMsg && (
                <div
                  style={{
                    marginTop: '15px',
                    color: 'var(--danger)',
                    textAlign: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  {errorMsg}
                </div>
              )}
            </form>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '15px' }}>🌿</div>
            <h2 className="section-title" style={{ display: 'block', textAlign: 'center', marginBottom: '10px' }}>
              شكراً لمشاركتك!
            </h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.9', marginBottom: '25px' }}>
              يسعدني جداً أنك شاركت تجربتك معي. سأراجع رأيك وأعرضه في الموقع قريباً بإذن الله.
            </p>
            <Link href="/" className="btn">
              العودة للرئيسية
            </Link>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '25px' }}>
          <Link
            href="/"
            style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}
          >
            ← العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
