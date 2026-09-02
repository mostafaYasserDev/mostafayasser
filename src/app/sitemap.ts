import { MetadataRoute } from 'next';
import { db, collection, getDocs } from '@/lib/firebase';

const SITE_URL = 'https://mostafayasser.online';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/services`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/projects`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/articles`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/donation`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  try {
    // 1. Fetch Articles
    const articlesSnap = await getDocs(collection(db, 'articles'));
    const articleRoutes: MetadataRoute.Sitemap = articlesSnap.docs.map((doc) => {
      const data = doc.data();
      const slug = data.slug || doc.id;
      return {
        url: `${SITE_URL}/article/${encodeURIComponent(slug)}`,
        lastModified: data.publishDate ? new Date(data.publishDate) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.85,
      };
    });

    // 2. Fetch Projects
    const projectsSnap = await getDocs(collection(db, 'projects'));
    const projectRoutes: MetadataRoute.Sitemap = projectsSnap.docs.map((doc) => {
      const data = doc.data();
      const slug = data.slug || doc.id;
      return {
        url: `${SITE_URL}/project/${encodeURIComponent(slug)}`,
        lastModified: data.createdAt ? new Date(data.createdAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.85,
      };
    });

    // 3. Fetch Services
    const servicesSnap = await getDocs(collection(db, 'services'));
    const serviceRoutes: MetadataRoute.Sitemap = servicesSnap.docs.map((doc) => {
      const data = doc.data();
      const slug = data.slug || doc.id;
      return {
        url: `${SITE_URL}/service/${encodeURIComponent(slug)}`,
        lastModified: data.createdAt ? new Date(data.createdAt) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      };
    });

    return [...staticRoutes, ...articleRoutes, ...projectRoutes, ...serviceRoutes];
  } catch (err) {
    console.error('Error generating dynamic sitemap:', err);
    return staticRoutes;
  }
}
