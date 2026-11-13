export function translateFirebaseError(error: any): string {
  if (!error) return 'حدث خطأ غير متوقع.';
  const msg = error.code || error.message || String(error);

  if (
    msg.includes('user-not-found') ||
    msg.includes('wrong-password') ||
    msg.includes('invalid-credential') ||
    msg.includes('invalid-email')
  ) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  }
  if (msg.includes('too-many-requests')) {
    return 'تم حظر المحاولات مؤقتاً لكثرة المحاولات الخاطئة. حاول لاحقاً.';
  }
  if (
    msg.includes('permission-denied') ||
    msg.includes('Missing or insufficient permissions')
  ) {
    return 'عذراً، لا تملك الصلاحية للقيام بهذه العملية (تأكد من تسجيل الدخول أو صلاحيات حسابك).';
  }
  if (msg.includes('quota-exceeded')) {
    return 'لقد تجاوزت الحد الأقصى للاستخدام اليومي للبيانات. يرجى المحاولة لاحقاً.';
  }
  if (msg.includes('network-request-failed') || msg.includes('Failed to fetch')) {
    return 'انقطع الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.';
  }
  if (msg.includes('unauthenticated')) {
    return 'انتهت جلستك، يرجى تسجيل الدخول مجدداً.';
  }
  if (msg.includes('not-found')) {
    return 'العنصر المطلوب غير موجود.';
  }
  if (msg.includes('already-exists')) {
    return 'هذا العنصر موجود بالفعل.';
  }

  return 'حدث خطأ: ' + (error.message || 'يرجى المحاولة مجدداً.');
}

/**
 * Ultra-compact WebP image compression designed for 100% free hosting.
 * Standardizes to modern WebP with smart dimension scaling and file size constraints (< 50KB).
 */
export function compressImageWebp(
  file: File,
  maxWidth = 850,
  quality = 0.72,
  maxSizeBytes = 70 * 1024
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('الملف المختار ليس صورة صالحة.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('تعذر معالجة محرك الرسم للصور.'));
          return;
        }

        // Draw with high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Compress iteratively if size exceeds target
        let currentQuality = quality;
        let encoded = canvas.toDataURL('image/webp', currentQuality);

        if (encoded.length > maxSizeBytes && currentQuality > 0.4) {
          currentQuality = 0.55;
          encoded = canvas.toDataURL('image/webp', currentQuality);
        }

        if (encoded.length > maxSizeBytes * 1.5) {
          reject(new Error('الصورة كبيرة جداً، يرجى اختيار صورة أصغر حجماً.'));
          return;
        }

        resolve(encoded);
      };
      img.onerror = () => reject(new Error('تعذر قراءة بيانات الصورة.'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('حدث خطأ أثناء قراءة الملف.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Generate a tiny micro-thumbnail (< 5KB) for tables and listing grids.
 * Drastically reduces Firestore read bandwidth and keeps pages instant.
 */
export function generateMicroThumbnail(
  source: string,
  maxWidth = 160,
  quality = 0.5
): Promise<string> {
  return new Promise((resolve) => {
    if (!source || !source.startsWith('data:image')) {
      resolve('');
      return;
    }

    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round(height * (maxWidth / width));
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(source);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const thumb = canvas.toDataURL('image/webp', quality);
      resolve(thumb);
    };
    img.onerror = () => resolve(source);
    img.src = source;
  });
}

/**
 * Safe Arabic and English slug generation.
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\u0621-\u064A\w\s-]/g, '') // Keep Arabic and alphanumeric
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
