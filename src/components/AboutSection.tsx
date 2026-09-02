'use strict';
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { db, doc, getDoc } from '@/lib/firebase';
import { getCachedData, setCachedData } from '@/lib/public-cache';

const DEFAULT_ABOUT_TEXT = `مرحباً! أنا مطور واجهات ومصمم تجربة مستخدم شغوف ببناء مواقع وتطبيقات ويب سريعة ومميزة. أؤمن بأن البرمجة كالشجرة؛ تبدأ ببذرة (الفكرة)، وتمتد جذورها (الكود الأساسي)، ثم تتفرع أغصانها (الواجهة) لتثمر في النهاية تجربة مستخدم رائعة.

أسعى دائماً لتقديم حلول تقنية تجمع بين الأداء العالي والتصميم الجذاب، مع التركيز على كتابة كود نظيف وقابل للتطوير.`;

interface GeneralSettings {
  aboutText?: string;
  aboutImage?: string;
}

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [aboutText, setAboutText] = useState(DEFAULT_ABOUT_TEXT);
  const [aboutImage, setAboutImage] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // 1. Try cache first
    const cached = getCachedData<GeneralSettings>('general_settings');
    if (cached) {
      if (cached.aboutText?.trim()) setAboutText(cached.aboutText.trim());
      if (cached.aboutImage) setAboutImage(cached.aboutImage);
      hasLoadedRef.current = true;
    }

    const loadData = async () => {
      if (hasLoadedRef.current) return;
      hasLoadedRef.current = true;

      try {
        const snap = await getDoc(doc(db, 'settings', 'general'));
        if (snap.exists()) {
          const data = snap.data() as GeneralSettings;
          if (data.aboutText?.trim()) {
            setAboutText(data.aboutText.trim());
          }
          if (data.aboutImage) {
            setAboutImage(data.aboutImage);
          } else {
            setAboutImage(null);
          }
          setCachedData('general_settings', data);
        }
      } catch (err) {
        console.error('Error fetching general about settings:', err);
      }
    };

    if (hasLoadedRef.current) return;

    // 2. IntersectionObserver for deferred loading
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window && sectionRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            observer.disconnect();
            loadData();
          }
        },
        { rootMargin: '300px' }
      );

      observer.observe(sectionRef.current);
      return () => observer.disconnect();
    } else {
      loadData();
    }
  }, []);

  // Split paragraphs by empty lines
  const paragraphs = aboutText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section ref={sectionRef} className="about-section" data-aos="fade-up">
      <h2 className="section-title">من أنا؟ (نبذة عني)</h2>
      <div className="glass-panel about-grid" style={{ padding: '40px', borderRadius: '20px' }}>
        <div id="about-image-container">
          {aboutImage ? (
            <img
              src={aboutImage}
              alt="صورة شخصية"
              className="about-image content-in"
              loading="lazy"
              decoding="async"
              width={280}
              height={280}
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
