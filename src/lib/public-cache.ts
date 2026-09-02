/**
 * Lightweight in-memory & session cache for public visitor queries
 * Minimizes Firestore read operations, memory usage, and background polling.
 */

const memoryCache = new Map<string, { data: any; expiry: number }>();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes cache for visitor data

export function getCachedData<T>(key: string): T | null {
  // 1. Check memory cache first
  const memItem = memoryCache.get(key);
  if (memItem && memItem.expiry > Date.now()) {
    return memItem.data as T;
  }

  // 2. Check sessionStorage if available in browser
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(`jidhe_cache_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.expiry > Date.now()) {
          // Re-populate memory cache
          memoryCache.set(key, { data: parsed.data, expiry: parsed.expiry });
          return parsed.data as T;
        } else {
          sessionStorage.removeItem(`jidhe_cache_${key}`);
        }
      }
    } catch (_) {}
  }

  return null;
}

export function setCachedData<T>(key: string, data: T, ttl = DEFAULT_TTL): void {
  const expiry = Date.now() + ttl;
  memoryCache.set(key, { data, expiry });

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`jidhe_cache_${key}`, JSON.stringify({ data, expiry }));
    } catch (_) {}
  }
}

export function clearPublicCache(): void {
  memoryCache.clear();
  if (typeof window !== 'undefined') {
    try {
      Object.keys(sessionStorage).forEach((k) => {
        if (k.startsWith('jidhe_cache_')) {
          sessionStorage.removeItem(k);
        }
      });
    } catch (_) {}
  }
}
