'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import { db, doc, onSnapshot } from '@/lib/firebase';

const DEFAULT_ABOUT_TEXT = `مرحباً! أنا مطور واجهات ومصمم تجربة مستخدم شغوف ببناء مواقع وتطبيقات ويب سريعة ومميزة. أؤمن بأن البرمجة كالشجرة؛ تبدأ ببذرة (الفكرة)، وتمتد جذورها (الكود الأساسي)، ثم تتفرع أغصانها (الواجهة) لتثمر في النهاية تجربة مستخدم رائعة.

أسعى دائماً لتقديم حلول تقنية تجمع بين الأداء العالي والتصميم الجذاب، مع التركيز على كتابة كود نظيف وقابل للتطوير.`;

interface GeneralSettings {
  aboutText?: string;
  aboutImage?: string;
}

export default function AboutSection() {
  const [aboutText, setAboutText] = useState(DEFAULT_ABOUT_TEXT);
  const [aboutImage, setAboutImage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'general'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as GeneralSettings;
          if (data.aboutText && data.aboutText.trim()) {
            setAboutText(data.aboutText.trim());
          }
          if (data.aboutImage) {
            setAboutImage(data.aboutImage);
          } else {
            setAboutImage(null);
          }
        }
      },
      (err) => {
        console.error('Error fetching general about settings:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Split paragraphs by empty lines
  const paragraphs = aboutText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="about-section" data-aos="fade-up">
      <h2 className="section-title">من أنا؟ (نبذة عني)</h2>
      <div className="glass-panel about-grid" style={{ padding: '40px', borderRadius: '20px' }}>
        <div id="about-image-container">
          {aboutImage ? (
            <img
              src={aboutImage}
              alt="صورة شخصية"
              className="about-image content-in"
              loading="lazy"
            />
          ) : (
            <div className="about-image-placeholder">🌳</div>
          )}
        </div>
        <div className="about-text" id="about-text-content">
          {paragraphs.map((p, index) => (
            <p key={index}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
