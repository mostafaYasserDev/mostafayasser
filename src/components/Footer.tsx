import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-grid">
        {/* Brand Column */}
        <div className="footer-brand">
          <Link href="/" className="footer-logo">
            <img
              src="/assets/logo.png"
              alt="جذع"
              loading="lazy"
              width={40}
              height={40}
            />
            <span>
              جذع <span style={{ color: 'var(--accent-dark)' }}>.</span>
            </span>
          </Link>
          <p>أروي حكايات برمجية بروح فنية. تتأصل الأفكار وتنمو كالأشجار.</p>
        </div>

        {/* Quick Links Column */}
        <div className="footer-links">
          <h3>روابط سريعة</h3>
          <Link href="/">الرئيسية</Link>
          <Link href="/services">الخدمات</Link>
          <Link href="/projects">المشاريع</Link>
          <Link href="/articles">المقالات</Link>
          <Link href="/contact">تواصل معي</Link>
          <Link href="/donation">الدعم والمساهمة 🌱</Link>
        </div>

        {/* Contact Info Column */}
        <div className="footer-contact">
          <h3>تواصل معي</h3>
          <div id="footer-contact-info">
            <p>
              📧{' '}
              <a
                href="mailto:moustafa0yasser123@gmail.com"
                style={{ color: 'inherit' }}
              >
                moustafa0yasser123@gmail.com
              </a>
            </p>
            <p>
              📱{' '}
              <a
                href="tel:+201092991028"
                style={{ color: 'inherit', direction: 'ltr', display: 'inline-block' }}
              >
                +20 109 299 1028
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Copyright Bottom */}
      <div className="footer-bottom">
        <p>حكاية جذع &copy; {currentYear}. جميع الحقوق محفوظة.</p>
      </div>
    </footer>
  );
}
