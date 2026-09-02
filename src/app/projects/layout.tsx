import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'معرض الأعمال والمشاريع البرمجية | مصطفى ياسر - جذع',
  description:
    'استكشف معرض أعمال ومشاريع مصطفى ياسر البرمجية؛ تطبيقات ويب متكاملة، مواقع تفاعلية سريعة، وأنظمة مبنية بأحدث التقنيات.',
  keywords: [
    'معرض أعمال مبرمج',
    'مشاريع برمجة مواقع',
    'مشاريع Next.js',
    'تطبيقات React',
    'أعمال مصطفى ياسر',
    'Web Developer Portfolio Projects',
  ],
  alternates: {
    canonical: '/projects',
  },
  openGraph: {
    title: 'معرض الأعمال والمشاريع البرمجية | مصطفى ياسر - جذع',
    description:
      'مشاريع وتطبيقات ويب مبتكرة صُممت ونُفذت باحترافية عالية.',
    url: 'https://mostafayasser.online/projects',
  },
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
