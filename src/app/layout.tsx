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

const SITE_URL = 'https://mostafayasser.online';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'مصطفى ياسر (جذع) | مطور برمجيات ومواقع محترف ومعلم برمجة للأطفال واليافعين',
    template: '%s | مصطفى ياسر (جذع) - Mostafa Yasser',
  },
  description:
    'الموقع الرسمي للمطور والمدرب مصطفى ياسر (جذع). متخصص في تطوير مواقع وتطبيقات الويب الحديثة (Next.js, React, TypeScript, Full Stack)، ومتاح للعمل الحر (Freelance) والتوظيف عن بعد، بالإضافة لتقديم دورات تدريبية ممتعة لتعليم البرمجة وتطوير التفكير المنطقي للأطفال والشباب في الوطن العربي وعالمياً.',
  applicationName: 'جذع - Mostafa Yasser Portfolio',
  authors: [{ name: 'مصطفى ياسر - Mostafa Yasser', url: SITE_URL }],
  generator: 'Next.js',
  keywords: [
    // توظيف وعمل حر - عربي
    'مبرمج مواقع',
    'مطور واجهات ويب',
    'مطور Next.js',
    'مطور React محترف',
    'مبرمج فول ستاك',
    'توظيف مبرمج محترف',
    'مبرمج فري لانسر',
    'مطور برمجيات للعمل الحر',
    'مبرمج تطبيقات ويب',
    'تصميم وتطوير مواقع شركات',
    'برمجة متاجر إلكترونية',
    'مطور ويب مصري',
    'مبرمج في السعودية والإمارات والخليج',
    'استشارات برمجية وتطوير واجهات',
    
    // تعليم وتدريب الأطفال والشباب - عربي
    'معلم برمجة للأطفال',
    'مدرب برمجة لليافعين والشباب',
    'كورس برمجة للأطفال أونلاين',
    'تعليم البرمجة للمبتدئين من الصفر',
    'دروس برمجة خاصة للأطفال',
    'تعليم التفكير المنطقي والبرمجة للصغار',
    'مدرس برمجة خصوصي',
    'تدريب البرمجة والذكاء الاصطناعي للأطفال',
    
    // الهوية والاسم
    'مصطفى ياسر',
    'Mostafa Yasser',
    'جذع',
    'Jidhe',
    'حكاية جذع',
    'Mostafa Yasser Dev',
    
    // English Keywords - Global Targeting & Hiring
    'Freelance Web Developer',
    'Full Stack Developer for Hire',
    'Next.js Developer Portfolio',
    'React Frontend Engineer',
    'TypeScript Software Engineer',
    'Remote Developer for Hire',
    'Hire Dedicated Software Engineer',
    'Coding Tutor for Kids',
    'Programming Mentor for Youth',
    'Online Coding Classes for Children',
    'Learn to Code for Beginners',
    'Web Development Specialist',
    'UI UX Web Engineer'
  ],
  creator: 'مصطفى ياسر (Mostafa Yasser)',
  publisher: 'جذع (Jidhe)',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
    languages: {
      'ar': SITE_URL,
      'en': `${SITE_URL}/?lang=en`,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/assets/logo.png', type: 'image/png' },
    ],
    apple: '/assets/logo.png',
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'مصطفى ياسر (جذع) | مطور برمجيات ومواقع محترف ومعلم برمجة للأطفال واليافعين',
    description:
      'مطور ويب وتطبيقات فول ستاك ومعلم برمجة للأطفال والشباب. متاح للعمل الحر والتوظيف والاستشارات البرمجية في الوطن العربي والعالم.',
    url: SITE_URL,
    siteName: 'جذع - حكاية تنمو | مصطفى ياسر',
    locale: 'ar_AR',
    alternateLocale: ['en_US', 'ar_EG', 'ar_SA', 'ar_AE'],
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/assets/og-banner.jpg`,
        width: 1200,
        height: 630,
        alt: 'مصطفى ياسر - مطور برمجيات ومعلم برمجة | جذع',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@mostafayasser',
    creator: '@mostafayasser',
    title: 'مصطفى ياسر (جذع) | مطور برمجيات ومعلم برمجة للأطفال واليافعين',
    description:
      'مطور ويب Full Stack خبير في Next.js & React ومتاح للتوظيف والعمل الحر، ومدرب برمجة لليافعين والأطفال.',
    images: [`${SITE_URL}/assets/og-banner.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLdData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${SITE_URL}/#person`,
        name: 'مصطفى ياسر',
        alternateName: ['Mostafa Yasser', 'Mostafa Yasser Dev', 'جذع'],
        jobTitle: ['Full Stack Developer', 'Frontend Engineer', 'Coding Tutor for Kids & Youth', 'مطور برمجيات', 'معلم برمجة'],
        description: 'مطور برمجيات محترف متخصص في بناء مواقع وتطبيقات الويب الحديثة، ومدرب برمجة وتبسيط علوم الحاسوب للأطفال واليافعين.',
        url: SITE_URL,
        image: `${SITE_URL}/assets/logo.png`,
        sameAs: [
          'https://github.com/mostafaYasserDev',
          'https://linkedin.com/in/mostafa-yasser',
          'https://t.me/mostafayasserdev',
        ],
        knowsAbout: [
          'Web Development',
          'Next.js',
          'React.js',
          'TypeScript',
          'JavaScript',
          'Node.js',
          'Firebase & Firestore',
          'UI/UX Design',
          'Computer Science Mentorship',
          'Coding for Kids and Beginners',
          'برمجة وتطوير المواقع',
          'تعليم البرمجة للأطفال',
        ],
        offers: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'تطوير وتصميم مواقع وتطبيقات الويب (Web Development & Engineering)',
              description: 'بناء مواقع وتطبيقات ويب فائقة السرعة والتجاوب تناسب الشركات الناشئة والأنشطة التجارية.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'تدريب وتعليم البرمجة للأطفال واليافعين (Coding Classes for Kids & Youth)',
              description: 'جلسات تدريبية تفاعلية ممتعة لتأسيس الأطفال والشباب في البرمجة والتفكير المنطقي.',
            },
          },
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'جذع - مصطفى ياسر',
        description: 'بورتفوليو ومدونة المطور والمدرب مصطفى ياسر (جذع).',
        inLanguage: ['ar', 'en'],
        publisher: {
          '@id': `${SITE_URL}/#person`,
        },
      },
      {
        '@type': 'ProfessionalService',
        '@id': `${SITE_URL}/#service`,
        name: 'جذع للحلول البرمجية والتدريب - مصطفى ياسر',
        url: SITE_URL,
        logo: `${SITE_URL}/assets/logo.png`,
        image: `${SITE_URL}/assets/logo.png`,
        description: 'خدمات تطوير الويب، استشارات برمجية، وتدريب النشء على علوم الحاسوب والبرمجة.',
        provider: {
          '@id': `${SITE_URL}/#person`,
        },
        areaServed: [
          { '@type': 'Country', name: 'Egypt' },
          { '@type': 'Country', name: 'Saudi Arabia' },
          { '@type': 'Country', name: 'United Arab Emirates' },
          { '@type': 'Country', name: 'Kuwait' },
          { '@type': 'Country', name: 'Qatar' },
          { '@type': 'Country', name: 'Worldwide' },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${SITE_URL}/#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name: 'ما هي الخدمات البرمجية التي يقدمها مصطفى ياسر (جذع)؟',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'تطوير مواقع وتطبيقات ويب متكاملة (Full Stack) باستخدام Next.js و React و TypeScript، تصميم وتطوير واجهات المستخدم UI/UX فائقة السرعة، بناء لوحات تحكم ديناميكية، وربط قواعد البيانات السحابية.',
            },
          },
          {
            '@type': 'Question',
            name: 'هل مصطفى ياسر متاح للعمل الحر (Freelance) والتوظيف عن بعد (Remote Work)؟',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'نعم، متاح لتنفيذ المشاريع البرمجية الحرة، والتوظيف بنظام العمل عن بعد (Full-time / Part-time) للشركات في مصر والسعودية والإمارات والخليج ومختلف دول العالم.',
            },
          },
          {
            '@type': 'Question',
            name: 'كيف يتم تقديم دورات وتعليم البرمجة للأطفال واليافعين؟',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'جلسات تدريبية تفاعلية ممتعة عبر الإنترنت تركز على تبسيط مفاهيم البرمجة، تنمية التفكير المنطقي، وبناء ألعاب ومشاريع عملية ممتعة تناسب الأعمار من 7 إلى 17 سنة.',
            },
          },
          {
            '@type': 'Question',
            name: 'كيف يمكن التواصل لبدء مشروع أو طلب استشارة برمجية؟',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'يمكن التواصل مباشرة عبر نموذج صفحة التواصل، أو من خلال تليجرام الرسمي @mostafayasserdev أو البريد الإلكتروني.',
            },
          },
        ],
      },
    ],
  };

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/otf/thmanyahseriftext-Regular.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/otf/thmanyahseriftext-Bold.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark') {
                  document.documentElement.classList.add('dark-mode');
                }
              } catch (e) {}
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark') {
                  document.body.classList.add('dark-mode');
                }
              } catch (e) {}
            `,
          }}
        />
        <PortfolioLayout>{children}</PortfolioLayout>
      </body>
    </html>
  );
}
