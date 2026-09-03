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

function build404Html(requestUrl) {
  const url = new URL(requestUrl);
  const homeUrl = `${url.origin}/`;
  const articlesUrl = `${url.origin}/articles/`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 — الصفحة غير موجودة | جذع</title>
  <meta name="description" content="الصفحة التي تبحث عنها غير موجودة.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" crossorigin="anonymous">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:       #FAEDCD;
      --card:     #FEFAE0;
      --primary:  #8C5A35;
      --primary2: #C58A5C;
      --text:     #3E2723;
      --text2:    #6D4C41;
      --border:   rgba(140,90,53,0.18);
      --glow:     rgba(140,90,53,0.25);
      --particle: rgba(140,90,53,0.12);
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg:       #1A120E;
        --card:     #2A1F1A;
        --primary:  #C58A5C;
        --primary2: #D4A373;
        --text:     #FAEDCD;
        --text2:    #C8A882;
        --border:   rgba(74,53,37,0.5);
        --glow:     rgba(197,138,92,0.2);
        --particle: rgba(197,138,92,0.08);
      }
    }

    body {
      font-family: 'Tajawal', 'Thmanyah', serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      padding: 2rem;
    }

    /* Animated background particles */
    .particles {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
    }
    .particle {
      position: absolute;
      border-radius: 50%;
      background: var(--particle);
      animation: float linear infinite;
    }

    @keyframes float {
      0%   { transform: translateY(100vh) scale(0); opacity: 0; }
      10%  { opacity: 1; }
      90%  { opacity: 1; }
      100% { transform: translateY(-20px) scale(1); opacity: 0; }
    }

    /* Decorative ring */
    .ring-outer {
      position: relative;
      z-index: 1;
      width: 260px;
      height: 260px;
      margin-bottom: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ring-outer::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2px solid var(--border);
      animation: spin 12s linear infinite;
    }
    .ring-outer::after {
      content: '';
      position: absolute;
      inset: 20px;
      border-radius: 50%;
      border: 1px dashed var(--border);
      animation: spin 8s linear infinite reverse;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .number-404 {
      font-size: clamp(5.5rem, 15vw, 9rem);
      font-weight: 900;
      line-height: 1;
      color: var(--primary);
      text-shadow: 0 0 60px var(--glow), 0 4px 30px var(--glow);
      animation: pulse404 3s ease-in-out infinite;
      letter-spacing: -4px;
    }
    @keyframes pulse404 {
      0%, 100% { text-shadow: 0 0 40px var(--glow), 0 4px 20px var(--glow); }
      50%       { text-shadow: 0 0 80px var(--glow), 0 8px 50px var(--glow); }
    }

    /* Glass card */
    .card {
      position: relative;
      z-index: 1;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 3rem 2.5rem;
      max-width: 520px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
      backdrop-filter: blur(12px);
      animation: slideUp 0.7s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(40px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .icon-tree {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, var(--primary), var(--primary2));
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      font-size: 1.8rem;
      color: #fff;
      box-shadow: 0 8px 24px var(--glow);
    }

    h1 {
      font-size: clamp(1.4rem, 4vw, 1.8rem);
      font-weight: 700;
      color: var(--text);
      margin-bottom: 0.75rem;
      line-height: 1.4;
    }

    p {
      font-size: 1.05rem;
      color: var(--text2);
      line-height: 1.7;
      margin-bottom: 2rem;
    }

    .actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 13px 28px;
      background: var(--primary);
      color: #fff;
      border-radius: 12px;
      text-decoration: none;
      font-family: inherit;
      font-size: 1rem;
      font-weight: 600;
      transition: background 0.25s, transform 0.2s, box-shadow 0.25s;
      box-shadow: 0 4px 16px var(--glow);
    }
    .btn-primary:hover {
      background: var(--primary2);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px var(--glow);
    }
    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 13px 24px;
      background: transparent;
      color: var(--primary);
      border: 1.5px solid var(--border);
      border-radius: 12px;
      text-decoration: none;
      font-family: inherit;
      font-size: 1rem;
      font-weight: 600;
      transition: background 0.25s, transform 0.2s, border-color 0.25s;
    }
    .btn-secondary:hover {
      background: var(--border);
      transform: translateY(-2px);
      border-color: var(--primary);
    }

    .divider {
      height: 1px;
      background: var(--border);
      margin: 2rem 0 1.5rem;
    }

    .footer-hint {
      font-size: 0.85rem;
      color: var(--text2);
      opacity: 0.75;
    }
    .footer-hint a {
      color: var(--primary);
      text-decoration: none;
    }
    .footer-hint a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <!-- Animated particles -->
  <div class="particles" id="particles"></div>

  <!-- Giant 404 ring -->
  <div class="ring-outer">
    <span class="number-404">404</span>
  </div>

  <!-- Glass card -->
  <div class="card">
    <div class="icon-tree">
      <i class="fas fa-tree"></i>
    </div>
    <h1>هذه الصفحة لم تنبت بعد!</h1>
    <p>الصفحة التي تبحث عنها غير موجودة، ربما تم نقلها أو حذفها أو أن الرابط غير صحيح.</p>

    <div class="actions">
      <a href="${homeUrl}" class="btn-primary">
        <i class="fas fa-home"></i>
        العودة للرئيسية
      </a>
      <a href="${articlesUrl}" class="btn-secondary">
        <i class="fas fa-newspaper"></i>
        تصفح المقالات
      </a>
    </div>

    <div class="divider"></div>
    <p class="footer-hint">
      إذا كنت تعتقد أن هذا خطأ،
      <a href="mailto:contact@mostafayasser.online">تواصل معنا</a>
    </p>
  </div>

  <script>
    // Dark mode sync: check localStorage for existing theme preference
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark') {
        document.documentElement.style.cssText = '--bg:#1A120E;--card:#2A1F1A;--primary:#C58A5C;--primary2:#D4A373;--text:#FAEDCD;--text2:#C8A882;--border:rgba(74,53,37,0.5);--glow:rgba(197,138,92,0.2);--particle:rgba(197,138,92,0.08);';
      } else if (stored === 'light') {
        document.documentElement.style.cssText = '--bg:#FAEDCD;--card:#FEFAE0;--primary:#8C5A35;--primary2:#C58A5C;--text:#3E2723;--text2:#6D4C41;--border:rgba(140,90,53,0.18);--glow:rgba(140,90,53,0.25);--particle:rgba(140,90,53,0.12);';
      }
    } catch {}

    // Spawn floating particles
    const container = document.getElementById('particles');
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random() * 60 + 20;
      p.style.cssText = [
        'width:' + size + 'px',
        'height:' + size + 'px',
        'left:' + Math.random() * 100 + '%',
        'animation-duration:' + (Math.random() * 15 + 8) + 's',
        'animation-delay:' + (Math.random() * 10) + 's',
      ].join(';');
      container.appendChild(p);
    }
  </script>
</body>
</html>`;
}

function serve404(context) {
  const html = build404Html(context.request.url);
  return withSecurityHeaders(new Response(html, {
    status: 404,
    statusText: 'Not Found',
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  }));
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
    // Unknown route: serve the embedded branded 404 page directly.
    // This is the most reliable approach — no dependency on ASSETS binding or wrangler settings.
    const response = await context.next();
    if (response.status !== 200) {
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
