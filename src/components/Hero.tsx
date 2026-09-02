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
        <h1>أروي حكايات برمجية</h1>
        <p>
          تتأصل الأفكار وتنمو كالأشجار. أقدم حلولاً برمجية بروح فنية ولمسة
          إبداعية تجمع بين أصالة الجذور وجمال الأغصان.
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
