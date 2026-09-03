'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db, collection, getDocs, query, where } from '@/lib/firebase';
import SkeletonCards from '@/components/SkeletonCards';

export interface DonationMethod {
  id: string;
  title: string;
  icon: string;
  url: string;
  description?: string;
  active?: boolean;
}

export default function DonationPage() {
  const [donations, setDonations] = useState<DonationMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDonations() {
      try {
        const q = query(collection(db, 'donations'), where('active', '==', true));
        const snap = await getDocs(q);
        if (!isMounted) return;

        const items: DonationMethod[] = [];
        snap.forEach((doc) => {
          items.push({ id: doc.id, ...(doc.data() as Omit<DonationMethod, 'id'>) });
        });
        setDonations(items);
        setLoading(false);
      } catch (err) {
        console.error('Error loading donations:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    }

    loadDonations();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="view active" style={{ paddingTop: '20px', minHeight: '70vh' }}>
      {/* Hero */}
      <section
        className="donation-hero glass-panel"
        data-aos="fade-down"
        style={{
          textAlign: 'center',
          padding: '60px 20px 40px',
          borderRadius: '24px',
          marginBottom: '40px',
        }}
      >
        <h1 style={{ fontSize: '2.4rem', color: 'var(--primary)', marginBottom: '16px' }}>
          ادعم نمو جذع 🌱
        </h1>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '1.15rem',
            maxWidth: '640px',
            margin: '0 auto',
            lineHeight: '1.8',
          }}
        >
          دعمكم هو الماء الذي يروي جذورنا لتستمر في النمو وطرح المزيد من الثمار البرمجية والفنية التي تفيد المجتمع التقني.
        </p>
      </section>

      {/* Donations List */}
      <section data-aos="fade-up">
        {loading && <SkeletonCards count={3} />}

        {error && (
          <div
            className="empty-state glass-panel"
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              borderRadius: '20px',
              marginBottom: '40px',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🌱</div>
            <h3 style={{ color: 'var(--primary)', marginBottom: '10px' }}>
              تعذر تحميل وسائل الدعم الآن
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '18px' }}>
              تحقق من اتصالك بالإنترنت ثم حاول مجدداً.
            </p>
          </div>
        )}

        {!loading && !error && donations.length === 0 && (
          <div
            className="empty-state glass-panel"
            style={{
              textAlign: 'center',
              padding: '50px 20px',
              borderRadius: '20px',
              marginBottom: '40px',
            }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '15px' }}>🌱</div>
            <h3 style={{ color: 'var(--primary)', marginBottom: '10px', fontSize: '1.5rem' }}>
              بانتظار دعمكم لتنمو الجذور وتزدهر
            </h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto', lineHeight: '1.8' }}>
              لم أقم بإضافة وسائل دعم بعد، لكن يسعدني دائماً تواصلكم واقتراحاتكم. يمكنك استخدام الرابط بالأسفل لاقتراح وسيلة مناسبة لك.
            </p>
          </div>
        )}

        {!loading && !error && donations.length > 0 && (
          <div
            className="donations-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px',
              marginBottom: '40px',
            }}
          >
            {donations.map((item) => {
              const isImg = item.icon && item.icon.startsWith('data:image');

              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="donation-card glass-panel"
                  style={{
                    padding: '32px 24px',
                    textAlign: 'center',
                    borderRadius: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textDecoration: 'none',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
                  }}
                >
                  {/* Icon */}
                  <div style={{ marginBottom: '18px', display: 'flex', justifyContent: 'center' }}>
                    {isImg ? (
                      <img
                        src={item.icon}
                        alt={item.title}
                        style={{
                          width: '56px',
                          height: '56px',
                          objectFit: 'contain',
                        }}
                      />
                    ) : (
                      <i
                        className={item.icon || 'fas fa-heart'}
                        style={{ fontSize: '3rem', color: 'var(--primary)' }}
                      />
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.35rem', marginBottom: '10px', color: 'var(--text-main)' }}>
                    {item.title}
                  </h3>

                  {item.description && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '20px', flexGrow: 1, lineHeight: '1.7' }}>
                      {item.description}
                    </p>
                  )}

                  <span className="btn btn-outline" style={{ width: '100%', marginTop: 'auto' }}>
                    دعم عبر {item.title}
                  </span>
                </a>
              );
            })}
          </div>
        )}

        {/* Suggestion Link */}
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            هل تفضل وسيلة دعم أخرى غير متوفرة؟{' '}
            <Link
              href="/client/suggest-donation"
              style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}
            >
              اقترحها من هنا
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
