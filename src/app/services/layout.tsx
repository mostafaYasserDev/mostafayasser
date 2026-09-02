import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الخدمات البرمجية والتدريبية | مصطفى ياسر - جذع',
  description:
    'خدمات تطوير الويب وتصميم واجهات المستخدم الحديثة، استشارات تقنية، وتدريب ممتع وشامل على البرمجة للأطفال والشباب.',
  keywords: [
    'خدمات برمجة مواقع',
    'تطوير واجهات المستخدم',
    'تعليم برمجة للأطفال',
    'تدريب برمجة لليافعين',
    'استشارات برمجية',
    'Web Development Services',
    'Coding Tutoring Services',
  ],
  alternates: {
    canonical: '/services',
  },
  openGraph: {
    title: 'الخدمات البرمجية والتدريبية | مصطفى ياسر - جذع',
    description:
      'حلول برمجية متكاملة وتدريب احترافي في علوم الحاسوب والبرمجة.',
    url: 'https://mostafayasser.online/services',
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
