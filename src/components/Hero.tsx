'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db, doc, getDoc } from '@/lib/firebase';

export default function Hero() {
  const [cvUrl, setCvUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGeneralSettings() {
      try {
        const ref = doc(db, 'settings', 'general');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data?.cvData) {
            setCvUrl(data.cvData);
          }
        }
      } catch (err) {
        console.error('Error fetching CV from settings:', err);
      }
    }
    fetchGeneralSettings();
  }, []);

  return (
    <section id="home" className="hero glass-panel">
      <div className="hero-content">
        <span className="trunk-badge">مرحباً بك في جذع</span>
        <h1 className="hero-heading" style={{ height: 'auto', minHeight: '1.4em', margin: '15px 0 20px' }}>
          <span style={{ display: 'block', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', lineHeight: 1.3 }}>
            مصطفى ياسر — مطور برمجيات ومعلم برمجة
          </span>
          <span style={{ display: 'block', fontSize: '1.35rem', color: 'var(--primary)', fontWeight: 500, lineHeight: 1.4 }}>
            أروي حكايات برمجية تنمو وتزهر كالأشجار
          </span>
        </h1>
        <p>
          تتأصل الأفكار وتنمو كالأشجار. أقدم حلولاً برمجية وتطوير مواقع وتطبيقات ويب حديثة، واستشارات تقنية، مع تقديم تدريب تفاعلي ممتع لتعليم البرمجة والتفكير المنطقي للأطفال واليافعين.
        </p>
        <div
          className="hero-btns"
          style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <a href="#projects" className="btn">
            استكشف أعمالي
          </a>
          {cvUrl && (
            <a
              id="cv-download-btn"
              href={cvUrl}
              className="btn btn-outline"
              target="_blank"
              rel="noopener noreferrer"
              download="سيرة-ذاتية.pdf"
            >
              <i className="fas fa-file-download" /> تحميل السيرة الذاتية
            </a>
          )}
          {!cvUrl && (
            <Link href="/contact" className="btn btn-outline">
              <i className="fas fa-paper-plane" /> تواصل معي
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
