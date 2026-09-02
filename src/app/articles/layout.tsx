import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'المقالات والتدوينات التقنية | مصطفى ياسر - جذع',
  description:
    'تصفح أحدث مقالات وتدوينات مصطفى ياسر في تطوير الويب، هندسة البرمجيات، حلول Next.js و React، وتجارب كتابة الكود النظيف.',
  keywords: [
    'مقالات برمجة',
    'شروحات تطوير ويب',
    'مدونة مصطفى ياسر',
    'مقالات Next.js',
    'تطوير الواجهات React',
    'تعلم البرمجة',
    'نصائح برمجية',
    'Software Engineering Blog',
  ],
  alternates: {
    canonical: '/articles',
  },
  openGraph: {
    title: 'المقالات والتدوينات التقنية | مصطفى ياسر - جذع',
    description:
      'مقالات وحكايات تقنية متجددة في هندسة وتطوير الويب بقلم مصطفى ياسر.',
    url: 'https://mostafayasser.online/articles',
  },
};

export default function ArticlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
