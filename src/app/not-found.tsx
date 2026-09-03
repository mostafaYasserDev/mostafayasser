'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    }
  };

  return (
    <main
      className="not-found-page fade-in"
      style={{
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative ambient background glows */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(600px, 90vw)',
          height: 'min(600px, 90vw)',
          background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
          opacity: 0.12,
          filter: 'blur(70px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        className="not-found-card"
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '680px',
          width: '100%',
          background: 'var(--glass-bg, var(--card-bg))',
          border: '1px solid var(--glass-border, rgba(140, 90, 53, 0.2))',
          borderRadius: '28px',
          padding: 'clamp(2rem, 5vw, 3.5rem) clamp(1.5rem, 5vw, 3rem)',
          textAlign: 'center',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Animated Sprout / Trunk Illustration */}
        <div
          style={{
            position: 'relative',
            width: '120px',
            height: '120px',
            margin: '0 auto 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Subtle spinning dashed orbit */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px dashed var(--primary)',
              opacity: 0.25,
              animation: 'spinOrbit 20s linear infinite',
            }}
          />
          {/* Inner badge */}
          <div
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover, #6c4222) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '2.5rem',
              boxShadow: '0 12px 30px rgba(140, 90, 53, 0.35)',
            }}
          >
            <i className="fas fa-seedling" aria-hidden="true" />
          </div>
        </div>

        {/* 404 Headline */}
        <div
          style={{
            display: 'inline-block',
            fontSize: 'clamp(4.5rem, 12vw, 7rem)',
            fontWeight: 900,
            lineHeight: 1,
            color: 'var(--primary)',
            letterSpacing: '-2px',
            textShadow: '0 8px 32px rgba(140, 90, 53, 0.25)',
            marginBottom: '0.5rem',
            fontFamily: "'Thmanyah', serif",
          }}
        >
          404
        </div>

        <h1
          style={{
            fontSize: 'clamp(1.5rem, 4vw, 2.1rem)',
            fontWeight: 800,
            color: 'var(--text-main)',
            margin: '0.5rem 0 1rem',
            lineHeight: 1.3,
          }}
        >
          يبدو أن هذا الغصن لم ينمُ بعد!
        </h1>

        <p
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
            color: 'var(--text-secondary, var(--text-main))',
            lineHeight: 1.8,
            maxWidth: '520px',
            margin: '0 auto 2rem',
            opacity: 0.88,
          }}
        >
          الصفحة التي تبحث عنها غير موجودة، أو ربما تم تغيير مسارها، أو سقطت ورقتها في بستان آخر من حكاية جذع.
        </p>

        {/* Primary Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '2.2rem',
          }}
        >
          <Link
            href="/"
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 28px',
              fontSize: '1.05rem',
              fontWeight: 700,
              borderRadius: '14px',
              boxShadow: '0 8px 24px rgba(140, 90, 53, 0.3)',
              textDecoration: 'none',
            }}
          >
            <i className="fas fa-home" aria-hidden="true" />
            العودة للرئيسية
          </Link>

          <button
            type="button"
            onClick={handleBack}
            className="btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 24px',
              fontSize: '1.05rem',
              fontWeight: 600,
              borderRadius: '14px',
              background: 'transparent',
              border: '1.5px solid var(--glass-border, rgba(140, 90, 53, 0.3))',
              color: 'var(--text-main)',
              cursor: 'pointer',
            }}
          >
            <i className="fas fa-arrow-right" aria-hidden="true" />
            الصفحة السابقة
          </button>
        </div>

        {/* Quick Exploratory Links */}
        <div
          style={{
            borderTop: '1px solid var(--glass-border, rgba(140, 90, 53, 0.15))',
            paddingTop: '1.8rem',
          }}
        >
          <p
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--text-secondary, var(--text-main))',
              marginBottom: '1rem',
              opacity: 0.75,
            }}
          >
            أو يمكنك استكشاف أحد أقسام الموقع الرئيسية:
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '10px',
            }}
          >
            <Link
              href="/articles"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'var(--card-bg)',
                border: '1px solid var(--glass-border, rgba(140, 90, 53, 0.15))',
                color: 'var(--text-main)',
                fontSize: '0.92rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <i className="fas fa-newspaper" style={{ color: 'var(--primary)' }} aria-hidden="true" />
              المقالات
            </Link>

            <Link
              href="/projects"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'var(--card-bg)',
                border: '1px solid var(--glass-border, rgba(140, 90, 53, 0.15))',
                color: 'var(--text-main)',
                fontSize: '0.92rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <i className="fas fa-laptop-code" style={{ color: 'var(--primary)' }} aria-hidden="true" />
              المشاريع
            </Link>

            <Link
              href="/services"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'var(--card-bg)',
                border: '1px solid var(--glass-border, rgba(140, 90, 53, 0.15))',
                color: 'var(--text-main)',
                fontSize: '0.92rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <i className="fas fa-layer-group" style={{ color: 'var(--primary)' }} aria-hidden="true" />
              الخدمات
            </Link>

            <Link
              href="/contact"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'var(--card-bg)',
                border: '1px solid var(--glass-border, rgba(140, 90, 53, 0.15))',
                color: 'var(--text-main)',
                fontSize: '0.92rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <i className="fas fa-paper-plane" style={{ color: 'var(--primary)' }} aria-hidden="true" />
              تواصل معي
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spinOrbit {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}

