import { db, doc, getDoc, collection, query, where, getDocs } from '@/lib/firebase';

export interface PublicArticle {
  id: string;
  title: string;
  slug?: string;
  publishDate?: string;
  coverImage?: string;
  content: string;
  shortDescription?: string;
  author?: string;
}

export interface PublicProject {
  id: string;
  title: string;
  slug?: string;
  technologies?: string;
  shortDescription?: string;
  fullDescription: string;
  demoLink?: string;
  githubLink?: string;
  mainImage?: string;
  featured?: boolean;
}

export interface PublicService {
  id: string;
  title: string;
  slug?: string;
  description: string;
  mainImage?: string;
  featured?: boolean;
}

const SITE_URL = 'https://mostafayasser.online';

/**
 * Returns a valid, absolute public HTTP/HTTPS URL for Open Graph and social media previews.
 * Converts base64 data URIs into standard dynamic image endpoints so platforms like WhatsApp and Telegram can render them.
 */
export function getPublicImageUrl(
  image?: string,
  collectionName: 'articles' | 'projects' | 'services' = 'articles',
  docId?: string
): string {
  if (!image) return `${SITE_URL}/assets/logo.png`;
  const clean = image.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }
  if (clean.startsWith('data:image') && docId) {
    return `${SITE_URL}/img/${collectionName}/${encodeURIComponent(docId)}.jpg`;
  }
  if (clean.startsWith('/')) {
    return `${SITE_URL}${clean}`;
  }
  return `${SITE_URL}/assets/logo.png`;
}

// Helper to thoroughly decode URI component safely (handles double/triple encoding)
export function robustDecode(raw: string): string {
  if (!raw) return '';
  let result = String(raw).trim();
  for (let i = 0; i < 3; i++) {
    if (result.includes('%')) {
      try {
        const next = decodeURIComponent(result);
        if (next === result) break;
        result = next;
      } catch {
        break;
      }
    } else {
      break;
    }
  }
  return result;
}

/**
 * Robustly fetch a single document from Firestore by slug or document ID.
 * Works seamlessly across both Server and Client environments with Arabic URI support.
 */
export async function fetchDocBySlugOrId<T = any>(
  collectionName: 'articles' | 'projects' | 'services',
  rawId: string
): Promise<T | null> {
  if (!rawId) return null;

  const decoded = robustDecode(rawId);
  const rawClean = String(rawId).trim();

  try {
    // 1. Query by slug (decoded)
    if (decoded) {
      const q1 = query(collection(db, collectionName), where('slug', '==', decoded));
      const snap1 = await getDocs(q1);
      if (!snap1.empty) {
        const d = snap1.docs[0];
        return normalizeDocData<T>(collectionName, d.id, d.data());
      }
    }

    // 2. Query by slug (raw string if different)
    if (rawClean && rawClean !== decoded) {
      const q2 = query(collection(db, collectionName), where('slug', '==', rawClean));
      const snap2 = await getDocs(q2);
      if (!snap2.empty) {
        const d = snap2.docs[0];
        return normalizeDocData<T>(collectionName, d.id, d.data());
      }
    }

    // 3. Query directly by Firestore Document ID (decoded)
    if (decoded) {
      try {
        const docSnap1 = await getDoc(doc(db, collectionName, decoded));
        if (docSnap1.exists()) {
          return normalizeDocData<T>(collectionName, docSnap1.id, docSnap1.data());
        }
      } catch {
        // Document path may contain characters invalid for doc ID; continue to fallback
      }
    }

    // 4. Query directly by Firestore Document ID (raw)
    if (rawClean && rawClean !== decoded) {
      try {
        const docSnap2 = await getDoc(doc(db, collectionName, rawClean));
        if (docSnap2.exists()) {
          return normalizeDocData<T>(collectionName, docSnap2.id, docSnap2.data());
        }
      } catch {
        // Ignore
      }
    }

    // 5. Fallback Collection Scan (Guarantees matching regardless of encoding or special chars)
    const allSnap = await getDocs(collection(db, collectionName));
    for (const d of allSnap.docs) {
      const data = d.data();
      const docSlug = data.slug ? String(data.slug).trim() : '';
      const docSlugDecoded = robustDecode(docSlug);

      if (
        d.id === decoded ||
        d.id === rawClean ||
        (docSlug && (docSlug === decoded || docSlug === rawClean)) ||
        (docSlugDecoded && (docSlugDecoded === decoded || docSlugDecoded === rawClean))
      ) {
        return normalizeDocData<T>(collectionName, d.id, data);
      }
    }

    return null;
  } catch (err) {
    console.error(`[fetchDocBySlugOrId] Error fetching ${collectionName} with id "${rawId}":`, err);
    return null;
  }
}

function normalizeDocData<T>(collectionName: string, id: string, data: any): T {
  if (collectionName === 'articles') {
    const article: PublicArticle = {
      id,
      title: data.title || 'مقال بدون عنوان',
      slug: data.slug || '',
      publishDate: data.publishDate || '',
      coverImage: data.coverImage || '',
      content: data.content || data.contentHtml || data.shortDescription || data.fullDescription || '',
      shortDescription: data.shortDescription || '',
      author: data.author || 'مصطفى ياسر',
    };
    return article as unknown as T;
  }

  if (collectionName === 'projects') {
    const project: PublicProject = {
      id,
      title: data.title || 'مشروع بدون عنوان',
      slug: data.slug || '',
      technologies: data.technologies || '',
      shortDescription: data.shortDescription || '',
      fullDescription: data.fullDescription || data.content || data.contentHtml || data.shortDescription || '',
      demoLink: data.demoLink || data.demoUrl || '',
      githubLink: data.githubLink || data.codeUrl || '',
      mainImage: data.mainImage || data.coverImage || '',
      featured: Boolean(data.featured),
    };
    return project as unknown as T;
  }

  if (collectionName === 'services') {
    const service: PublicService = {
      id,
      title: data.title || 'خدمة بدون عنوان',
      slug: data.slug || '',
      description: data.description || data.fullDescription || data.content || data.shortDescription || '',
      mainImage: data.mainImage || data.coverImage || '',
      featured: Boolean(data.featured),
    };
    return service as unknown as T;
  }

  return { id, ...data } as T;
}
