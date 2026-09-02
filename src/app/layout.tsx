import React from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import PortfolioLayout from '@/components/PortfolioLayout';

export const viewport: Viewport = {
  themeColor: '#8C5A35',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'جذع - حكاية تنمو | مصطفى ياسر',
  description:
    'جذع - بورتفوليو مصطفى ياسر. مطور برمجيات ومصمم تجربة مستخدم. أروي حكايات برمجية بروح فنية ولمسة إبداعية.',
  authors: [{ name: 'مصطفى ياسر' }],
  keywords: [
    'مطور ويب',
    'تصميم مواقع',
    'برمجة',
    'تطوير تطبيقات',
    'واجهات مستخدم',
    'مصطفى ياسر',
    'جذع',
    'Full-Stack Developer',
    'portfolio',
  ],
  icons: {
    icon: '/assets/logo.png',
    apple: '/assets/logo.png',
  },
  openGraph: {
    title: 'جذع - حكاية تنمو',
    description:
      'جذع - بورتفوليو مصطفى ياسر. مطور برمجيات ومصمم تجربة مستخدم. أروي حكايات برمجية بروح فنية ولمسة إبداعية.',
    url: 'https://mostafayasser.online/',
    siteName: 'جذع',
    locale: 'ar_AR',
    type: 'website',
    images: [
      {
        url: 'https://mostafayasser.online/assets/logo.png',
        width: 512,
        height: 512,
        alt: 'شعار جذع - بورتفوليو مصطفى ياسر',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@mostafayasser',
    title: 'جذع - حكاية تنمو',
    description: 'جذع - بورتفوليو مصطفى ياسر. مطور برمجيات ومصمم تجربة مستخدم.',
    images: ['https://mostafayasser.online/assets/logo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <PortfolioLayout>{children}</PortfolioLayout>
      </body>
    </html>
  );
}
