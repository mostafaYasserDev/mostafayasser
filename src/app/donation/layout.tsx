import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الدعم والمساهمة 🌱 | مشروع جذع - مصطفى ياسر',
  description:
    'طرق مساندة ودعم مشروع جذع للاستمرار في تقديم المحتوى البرمجي والإثرائي والحلول التقنية المفتوحة ومساعدة مجتمع المطورين.',
  keywords: [
    'دعم مشروع جذع',
    'مساهمة',
    'تبرع للمحتوى التقني',
    'Support Jidhe Project',
  ],
  alternates: {
    canonical: '/donation',
  },
  openGraph: {
    title: 'الدعم والمساهمة 🌱 | مشروع جذع - مصطفى ياسر',
    description:
      'دعمكم يروي جذورنا لنستمر في إثمار المحتوى البرمجي المميز.',
    url: 'https://mostafayasser.online/donation',
  },
};

export default function DonationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
