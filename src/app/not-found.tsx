import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="error-404-container fade-in" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 className="error-404-title" style={{
        fontSize: 'clamp(5rem, 10vw, 8rem)',
        color: 'var(--primary)',
        margin: 0,
        lineHeight: 1,
        fontWeight: 900
      }}>
        404
      </h1>
      <p className="error-404-text" style={{
        fontSize: '1.4rem',
        color: 'var(--text-main)',
        margin: '1.2rem 0 2rem'
      }}>
        عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
      </p>
      <Link href="/" className="btn" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 30px',
        fontSize: '1.1rem'
      }}>
        <i className="fas fa-home" /> العودة للرئيسية
      </Link>
    </div>
  );
}
