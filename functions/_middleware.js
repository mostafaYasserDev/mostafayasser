const LISTING_SEO = {
  '/articles': {
    title: 'المقالات - جذع',
    description: 'اقرأ أحدث مقالات جذع التقنية والإبداعية وحكايات تطوير الويب.',
    imageAlt: 'مقالات جذع',
    schemaType: 'CollectionPage',
  },
  '/projects': {
    title: 'المشاريع - جذع',
    description: 'تصفح مشاريع جذع البرمجية والإبداعية وحلول الويب المتميزة.',
    imageAlt: 'مشاريع جذع',
    schemaType: 'CollectionPage',
  },
  '/services': {
    title: 'الخدمات - جذع',
    description: 'استكشف خدمات جذع في تطوير الويب وتصميم الواجهات وتجربة المستخدم.',
    imageAlt: 'خدمات جذع',
    schemaType: 'CollectionPage',
  },
  '/contact': {
    title: 'تواصل معي - جذع',
    description: 'تواصل مع جذع لبدء مشروعك القادم.',
    imageAlt: 'تواصل مع جذع',
    schemaType: 'ContactPage',
  },
  '/donation/': {
    title: 'الدعم والمساهمة - جذع',
    description: 'طرق دعم ومساندة مشروع جذع للاستمرار في تقديم المحتوى والخدمات المتميزة.',
    imageAlt: 'جذع - الدعم والمساهمة',
    schemaType: 'WebPage',
  },
};

function robustDecode(str) {
  let cur = str || '';
  for (let i = 0; i < 3; i++) {
    try {
      const dec = decodeURIComponent(cur);
      if (dec === cur) break;
      cur = dec;
    } catch {
      break;
    }
  }
  return cur;
}

function escapeHtml(unsafe) {
  return (unsafe || '')
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function transformSeo(response, tagsToInject) {
  return new HTMLRewriter()
    .on('title', { element(el) { el.remove(); } })
    .on('link[rel="canonical"]', { element(el) { el.remove(); } })
    .on('#meta-description', { element(el) { el.remove(); } })
    .on('#og-title', { element(el) { el.remove(); } })
    .on('#og-description', { element(el) { el.remove(); } })
    .on('#og-image', { element(el) { el.remove(); } })
    .on('#og-url', { element(el) { el.remove(); } })
    .on('#og-type', { element(el) { el.remove(); } })
    .on('#twitter-title', { element(el) { el.remove(); } })
    .on('#twitter-description', { element(el) { el.remove(); } })
    .on('#twitter-image', { element(el) { el.remove(); } })
    .on('[property^="og:image"]', { element(el) { el.remove(); } })
    .on('[property^="og:title"]', { element(el) { el.remove(); } })
    .on('[property^="og:description"]', { element(el) { el.remove(); } })
    .on('[name^="twitter:image"]', { element(el) { el.remove(); } })
    .on('[name^="twitter:card"]', { element(el) { el.remove(); } })
    .on('head', { element(el) { el.prepend(tagsToInject, { html: true }); } })
    .transform(response);
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // Static assets or images: skip middleware
  if (
    path.startsWith('/_next') ||
    path.startsWith('/assets') ||
    path.startsWith('/otf') ||
    path.startsWith('/img') ||
    path.includes('.')
  ) {
    return context.next();
  }

  const listingKey =
    path === '/donation' || path === '/donation/'
      ? '/donation/'
      : path.replace(/\/+$/, '') || '/';
  const listingMeta = LISTING_SEO[listingKey];

  if (listingMeta) {
    const response = await context.next();
    const siteUrl = `${url.protocol}//${url.hostname}`;
    const canonicalUrl = `${siteUrl}${listingKey}`;
    const finalImage = `${siteUrl}/assets/og-banner.jpg`;
    const pageTitle = `${escapeHtml(listingMeta.title)} | جذع`;
    const tagsToInject = `
    <title>${pageTitle}</title>
    <meta name="description" content="${escapeHtml(listingMeta.description)}">
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
    <meta property="og:title" content="${pageTitle}">
    <meta property="og:description" content="${escapeHtml(listingMeta.description)}">
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
    <meta property="og:type" content="website">
    <meta property="og:image" content="${finalImage}">
    <meta property="og:image:secure_url" content="${finalImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:site_name" content="جذع">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${pageTitle}">
    <meta name="twitter:description" content="${escapeHtml(listingMeta.description)}">
    <meta name="twitter:image" content="${finalImage}">
    `;
    try {
      return transformSeo(response, tagsToInject);
    } catch {
      return response;
    }
  }

  let collectionName = '';
  let schemaType = '';

  if (path.startsWith('/article/')) {
    collectionName = 'articles';
    schemaType = 'Article';
  } else if (path.startsWith('/project/')) {
    collectionName = 'projects';
    schemaType = 'CreativeWork';
  } else if (path.startsWith('/service/')) {
    collectionName = 'services';
    schemaType = 'Service';
  }

  if (!collectionName) {
    return context.next();
  }

  const pathParts = path.split('/').filter(Boolean);
  if (pathParts.length < 2) return context.next();
  const idOrSlug = robustDecode(pathParts[1]);

  const FIRESTORE_BASE =
    'https://firestore.googleapis.com/v1/projects/jidhe-trunk/databases/(default)/documents';

  let docFields = null;
  let actualDocId = idOrSlug;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    // 1. Try slug query
    try {
      const queryResponse = await fetch(`${FIRESTORE_BASE}:runQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: collectionName }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'slug' },
                op: 'EQUAL',
                value: { stringValue: idOrSlug },
              },
            },
            limit: 1,
          },
        }),
        signal: controller.signal,
      });

      if (queryResponse.ok) {
        const queryData = await queryResponse.json();
        if (Array.isArray(queryData) && queryData[0] && queryData[0].document) {
          docFields = queryData[0].document.fields;
          if (queryData[0].document.name) {
            actualDocId = queryData[0].document.name.split('/').pop();
          }
        }
      }
    } catch {}

    // 2. Try direct doc ID
    if (!docFields) {
      try {
        const getResponse = await fetch(
          `${FIRESTORE_BASE}/${collectionName}/${encodeURIComponent(idOrSlug)}`,
          { signal: controller.signal }
        );
        if (getResponse.ok) {
          const getData = await getResponse.json();
          if (getData.fields) {
            docFields = getData.fields;
            actualDocId = idOrSlug;
          }
        }
      } catch {}
    }

    clearTimeout(timeout);
  } catch {}

  const response = await context.next();

  if (!docFields) {
    return response;
  }

  const getVal = (key) => {
    if (!docFields[key]) return '';
    return docFields[key].stringValue || docFields[key].integerValue?.toString() || '';
  };

  const title = getVal('title') || getVal('name');
  const description =
    getVal('description') || getVal('shortDescription') || getVal('summary') || title;
  const image =
    getVal('coverImage') || getVal('mainImage') || getVal('image') || getVal('thumbnail');

  const siteUrl = `${url.protocol}//${url.hostname}`;
  const canonicalUrl = `${siteUrl}${path}`;
  const siteName = 'جذع - حكاية تنمو | مصطفى ياسر';

  let finalImage = `${siteUrl}/assets/og-banner.jpg`;
  if (image && (image.startsWith('http://') || image.startsWith('https://'))) {
    finalImage = image;
  } else if (image && image.startsWith('data:image')) {
    finalImage = `${siteUrl}/img/${collectionName}/${encodeURIComponent(actualDocId)}.jpg`;
  }

  const shortDescription =
    description.length > 160 ? description.substring(0, 157) + '...' : description;

  const pageTitle = `${escapeHtml(title)} | جذع`;
  const ogType = schemaType === 'Article' ? 'article' : 'website';

  const tagsToInject = `
  <title>${pageTitle}</title>
  <meta name="description" content="${escapeHtml(shortDescription)}">
  <meta name="author" content="مصطفى ياسر">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${escapeHtml(shortDescription)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:image" content="${escapeHtml(finalImage)}">
  <meta property="og:image:secure_url" content="${escapeHtml(finalImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:alt" content="${escapeHtml(title)}">
  <meta property="og:site_name" content="${siteName}">
  <meta property="og:locale" content="ar_AR">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${pageTitle}">
  <meta name="twitter:description" content="${escapeHtml(shortDescription)}">
  <meta name="twitter:image" content="${escapeHtml(finalImage)}">
  <meta name="twitter:image:alt" content="${escapeHtml(title)}">
  `;

  try {
    return transformSeo(response, tagsToInject);
  } catch {
    return response;
  }
}
