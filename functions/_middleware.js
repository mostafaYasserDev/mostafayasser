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

const DETAIL_ROUTES = {
  '/article/': 'articles',
  '/project/': 'projects',
  '/service/': 'services',
};

const FIRESTORE_BASE =
  'https://firestore.googleapis.com/v1/projects/jidhe-trunk/databases/(default)/documents';

const TEMPLATE_ROUTES = {
  articles: '/article/from-idea-to-scalable-product/',
  projects: '/project/angham-adaptive-portfolio/',
  services: '/service/KdCoJji5fShhaW1Wlxai/',
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

const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

function withSecurityHeaders(response) {
  if (!response) return response;
  if (response.status >= 300 && response.status < 400) return response;
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    newHeaders.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

function transformSeo(response, tagsToInject) {
  const transformed = new HTMLRewriter()
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
  return withSecurityHeaders(transformed);
}

async function serve404(context) {
  try {
    const url = new URL(context.request.url);
    const req404 = new Request(`${url.origin}/404.html`, {
      headers: context.request.headers,
    });
    const res404 = await context.env.ASSETS.fetch(req404);
    if (res404 && res404.status === 200) {
      const h = new Headers(res404.headers);
      h.set('Content-Type', 'text/html; charset=utf-8');
      return withSecurityHeaders(new Response(res404.body, {
        status: 404,
        statusText: 'Not Found',
        headers: h,
      }));
    }
  } catch {}
  return withSecurityHeaders(new Response('404 Not Found', { status: 404 }));
}

async function fetchFirestoreDoc(collectionName, idOrSlug) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  let docFields = null;
  let actualDocId = idOrSlug;

  try {
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
  } finally {
    clearTimeout(timeout);
  }

  return docFields ? { fields: docFields, docId: actualDocId } : null;
}

function buildDetailSeoTags(docFields, docId, collectionName, schemaType, siteUrl, path) {
  const getVal = (key) => {
    if (!docFields[key]) return '';
    return docFields[key].stringValue || docFields[key].integerValue?.toString() || '';
  };

  const title = getVal('title') || getVal('name');
  const description =
    getVal('description') || getVal('shortDescription') || getVal('summary') || title;
  const image =
    getVal('coverImage') || getVal('mainImage') || getVal('image') || getVal('thumbnail');

  const canonicalUrl = `${siteUrl}${path}`;
  const siteName = 'جذع - حكاية تنمو | مصطفى ياسر';

  let finalImage = `${siteUrl}/assets/og-banner.jpg`;
  if (image && (image.startsWith('http://') || image.startsWith('https://'))) {
    finalImage = image;
  } else if (image && image.startsWith('data:image')) {
    finalImage = `${siteUrl}/img/${collectionName}/${encodeURIComponent(docId)}.jpg`;
  }

  const shortDescription =
    description.length > 160 ? description.substring(0, 157) + '...' : description;

  const pageTitle = `${escapeHtml(title)} | جذع`;
  const ogType = schemaType === 'Article' ? 'article' : 'website';

  return `
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
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // Static assets: pass through directly
  if (
    path.startsWith('/_next') ||
    path.startsWith('/assets') ||
    path.startsWith('/otf') ||
    path.startsWith('/img') ||
    path.includes('.')
  ) {
    return context.next();
  }

  // Trailing slash normalization
  if (!path.endsWith('/')) {
    return Response.redirect(`${url.origin}${path}/${url.search}`, 308);
  }

  // Listing pages SEO injection
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

  // Detect detail routes: /article/*, /project/*, /service/*
  let collectionName = '';
  let schemaType = '';
  for (const [prefix, col] of Object.entries(DETAIL_ROUTES)) {
    if (path.startsWith(prefix)) {
      collectionName = col;
      schemaType = col === 'articles' ? 'Article' : col === 'projects' ? 'CreativeWork' : 'Service';
      break;
    }
  }

  if (!collectionName) {
    // Unknown route — let Next.js handle it; if 404, serve custom branded page
    const response = await context.next();
    if (response.status === 404) {
      return serve404(context);
    }
    return withSecurityHeaders(response);
  }

  const pathParts = path.split('/').filter(Boolean);
  if (pathParts.length < 2) return context.next();
  const idOrSlug = robustDecode(pathParts[1]);
  const siteUrl = `${url.protocol}//${url.hostname}`;

  // Fetch from Firestore first to validate document existence
  const [doc, staticResponse] = await Promise.all([
    fetchFirestoreDoc(collectionName, idOrSlug),
    context.next(),
  ]);

  if (!doc) {
    // Document truly doesn't exist in Firestore → show branded 404
    return serve404(context);
  }

  const seoTags = buildDetailSeoTags(doc.fields, doc.docId, collectionName, schemaType, siteUrl, path);

  // Static pre-built page exists → inject SEO and return it
  if (staticResponse.status === 200) {
    try {
      return transformSeo(staticResponse, seoTags);
    } catch {
      return withSecurityHeaders(staticResponse);
    }
  }

  // Static file not found (new/edited slug not yet built) → serve template shell
  // React client-side code will fetch and render the actual content
  const templatePath = TEMPLATE_ROUTES[collectionName];
  if (!templatePath) return serve404(context);

  try {
    const templateReq = new Request(`${siteUrl}${templatePath}`, {
      headers: context.request.headers,
    });
    const templateRes = await context.env.ASSETS.fetch(templateReq);
    if (!templateRes || templateRes.status !== 200) return serve404(context);
    return transformSeo(templateRes, seoTags);
  } catch {
    return serve404(context);
  }
}
