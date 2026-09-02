'use strict';
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { db, collection, addDoc } from '@/lib/firebase';

export default function SuggestDonationPage() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedMsg = message.trim();
    if (!trimmedMsg) {
      setErrorMsg('يرجى كتابة وسيلة الدعم المقترحة أو رسالتك.');
      return;
    }

    if (trimmedMsg.length < 5) {
      setErrorMsg('الرسالة قصيرة جداً.');
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'donation_suggestions'), {
        name: name.trim() || 'فاعل خير',
        message: trimmedMsg,
        date: new Date().toISOString(),
        createdAt: Date.now(),
        read: false,
      });

      setIsSubmitted(true);
    } catch (err) {
      console.error('Error sending suggestion:', err);
      setErrorMsg('حدث خطأ أثناء إرسال الاقتراح. يرجى المحاولة لاحقاً.');
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
              اقتراح وسيلة دعم
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '30px', lineHeight: '1.8' }}>
              نسعى دائماً لتوفير وسائل مناسبة للجميع. إذا كان لديك اقتراح لوسيلة دعم غير متوفرة، يسعدنا أن تخبرنا بها!
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label htmlFor="sugg-name" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  الاسم (اختياري)
                </label>
                <input
                  type="text"
                  id="sugg-name"
                  placeholder="اسمك الكريم"
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                <label htmlFor="sugg-message" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  وسيلة الدعم المقترحة / رسالتك
                </label>
                <textarea
                  id="sugg-message"
                  rows={5}
                  placeholder="اكتب اقتراحك أو تفاصيل وسيلة الدعم هنا..."
                  required
                  maxLength={2000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
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
                {isSubmitting ? 'جاري الإرسال...' : 'إرسال الاقتراح'}
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
            <div style={{ fontSize: '4rem', marginBottom: '15px' }}>💖</div>
            <h2 className="section-title" style={{ display: 'block', textAlign: 'center', marginBottom: '10px' }}>
              شكراً لاقتراحك!
            </h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.9', marginBottom: '25px' }}>
              تم إرسال الاقتراح بنجاح. سنقوم بمراجعته ومحاولة إضافة وسيلة الدعم المقترحة في أقرب وقت.
            </p>
            <Link href="/donation" className="btn">
              العودة لصفحة الدعم
            </Link>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '25px' }}>
          <Link
            href="/donation"
            style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}
          >
            ← العودة لصفحة الدعم
          </Link>
        </div>
      </div>
    </div>
  );
}
