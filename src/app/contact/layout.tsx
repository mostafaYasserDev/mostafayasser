import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'تواصل معي وبدء مشروعك القادم | مصطفى ياسر - جذع',
  description:
    'تواصل مع المطور مصطفى ياسر لبدء تنفيذ مشروعك البرمجي، طلب استشارة تقنية، أو حجز تدريب برمجة للأطفال والشباب.',
  keywords: [
    'تواصل مع مبرمج',
    'طلب مشروع برمجة',
    'توظيف مصطفى ياسر',
    'استشارة تقنية',
    'حجز تدريب برمجة',
    'Hire Mostafa Yasser',
    'Contact Software Engineer',
  ],
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'تواصل معي وبدء مشروعك القادم | مصطفى ياسر - جذع',
    description:
      'لنصنع حكاية جديدة ونبدأ مشروعك القادم معاً.',
    url: 'https://mostafayasser.online/contact',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
