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
