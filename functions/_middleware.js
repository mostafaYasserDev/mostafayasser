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
  const projectsUrl = `${url.origin}/projects/`;
  const servicesUrl = `${url.origin}/services/`;
  const contactUrl = `${url.origin}/contact/`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 — الصفحة غير موجودة | جذع</title>
  <meta name="description" content="الصفحة التي تبحث عنها غير موجودة أو تم نقلها.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" crossorigin="anonymous">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #FAEDCD;
      --card-bg: #FEFAE0;
      --glass-bg: rgba(254, 250, 224, 0.85);
      --glass-border: rgba(212, 163, 115, 0.35);
      --primary: #8C5A35;
      --primary-hover: #6c4222;
      --text-main: #3E2723;
      --text-secondary: #6D4C41;
      --glow: rgba(140, 90, 53, 0.22);
      --particle: rgba(140, 90, 53, 0.12);
    }

    html.dark-mode, body.dark-mode {
      --bg: #1A120E;
      --card-bg: #2A1F1A;
      --glass-bg: rgba(42, 31, 26, 0.85);
      --glass-border: rgba(74, 53, 37, 0.6);
      --primary: #C58A5C;
      --primary-hover: #D4A373;
      --text-main: #FAEDCD;
      --text-secondary: #D4C3A3;
      --glow: rgba(197, 138, 92, 0.25);
      --particle: rgba(197, 138, 92, 0.1);
    }

    @media (prefers-color-scheme: dark) {
      :root:not(.light-mode) {
        --bg: #1A120E;
        --card-bg: #2A1F1A;
        --glass-bg: rgba(42, 31, 26, 0.85);
        --glass-border: rgba(74, 53, 37, 0.6);
        --primary: #C58A5C;
        --primary-hover: #D4A373;
        --text-main: #FAEDCD;
        --text-secondary: #D4C3A3;
        --glow: rgba(197, 138, 92, 0.25);
        --particle: rgba(197, 138, 92, 0.1);
      }
    }

    body {
      font-family: 'Tajawal', 'Thmanyah', system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow-x: hidden;
      padding: 2rem 1rem;
      transition: background-color 0.3s ease, color 0.3s ease;
    }

    /* Ambient background glow */
    .ambient-glow {
      position: fixed;
      top: 20%;
      left: 50%;
      transform: translateX(-50%);
      width: min(650px, 90vw);
      height: min(650px, 90vw);
      background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
      opacity: 0.12;
      filter: blur(80px);
      pointer-events: none;
      z-index: 0;
    }

    /* Floating particles */
    .particles-layer {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }
    .leaf-particle {
      position: absolute;
      border-radius: 50% 0 50% 0;
      background: var(--particle);
      animation: floatUp linear infinite;
    }
    @keyframes floatUp {
      0% { transform: translateY(105vh) rotate(0deg) scale(0.6); opacity: 0; }
      15% { opacity: 0.8; }
      85% { opacity: 0.8; }
      100% { transform: translateY(-30px) rotate(360deg) scale(1); opacity: 0; }
    }

    /* Glass card container */
    .error-card {
      position: relative;
      z-index: 1;
      max-width: 680px;
      width: 100%;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 28px;
      padding: clamp(2rem, 5vw, 3.5rem) clamp(1.5rem, 5vw, 3rem);
      text-align: center;
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.04);
      animation: slideUpFade 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes slideUpFade {
      from { opacity: 0; transform: translateY(30px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* Animated Seedling Icon */
    .icon-wrapper {
      position: relative;
      width: 110px;
      height: 110px;
      margin: 0 auto 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .orbit-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2px dashed var(--primary);
      opacity: 0.3;
      animation: spinOrbit 22s linear infinite;
    }
    @keyframes spinOrbit { to { transform: rotate(360deg); } }

    .icon-badge {
      width: 84px;
      height: 84px;
      border-radius: 22px;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 2.2rem;
      box-shadow: 0 10px 28px var(--glow);
    }

    .error-number {
      font-size: clamp(4.5rem, 12vw, 6.5rem);
      font-weight: 900;
      line-height: 1;
      color: var(--primary);
      letter-spacing: -2px;
      margin-bottom: 0.25rem;
      text-shadow: 0 8px 30px var(--glow);
    }

    h1 {
      font-size: clamp(1.4rem, 4vw, 1.95rem);
      font-weight: 800;
      color: var(--text-main);
      margin: 0.5rem 0 1rem;
      line-height: 1.35;
    }

    p.subtitle {
      font-size: clamp(1rem, 2.5vw, 1.12rem);
      color: var(--text-secondary);
      line-height: 1.75;
      max-width: 520px;
      margin: 0 auto 2rem;
    }

    /* Buttons */
    .buttons-group {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 2.2rem;
    }
    .btn-main {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 13px 28px;
      font-size: 1.05rem;
      font-weight: 700;
      border-radius: 14px;
      background: var(--primary);
      color: #fff;
      text-decoration: none;
      box-shadow: 0 8px 24px var(--glow);
      transition: all 0.25s ease;
      border: none;
      cursor: pointer;
    }
    .btn-main:hover {
      background: var(--primary-hover);
      transform: translateY(-2px);
      box-shadow: 0 12px 28px var(--glow);
    }
    .btn-outline {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 13px 24px;
      font-size: 1.05rem;
      font-weight: 600;
      border-radius: 14px;
      background: transparent;
      border: 1.5px solid var(--glass-border);
      color: var(--text-main);
      text-decoration: none;
      transition: all 0.25s ease;
      cursor: pointer;
    }
    .btn-outline:hover {
      background: var(--card-bg);
      transform: translateY(-2px);
      border-color: var(--primary);
    }

    /* Section links */
    .sections-box {
      border-top: 1px solid var(--glass-border);
      padding-top: 1.8rem;
    }
    .sections-title {
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--text-secondary);
      margin-bottom: 1rem;
      opacity: 0.85;
    }
    .sections-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 10px;
    }
    .section-pill {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 14px;
      border-radius: 12px;
      background: var(--card-bg);
      border: 1px solid var(--glass-border);
      color: var(--text-main);
      font-size: 0.92rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .section-pill i {
      color: var(--primary);
    }
    .section-pill:hover {
      transform: translateY(-2px);
      border-color: var(--primary);
      box-shadow: 0 6px 16px var(--glow);
    }
  </style>
</head>
<body>
  <div class="ambient-glow"></div>
  <div class="particles-layer" id="particlesLayer"></div>

  <main class="error-card">
    <div class="icon-wrapper">
      <div class="orbit-ring"></div>
      <div class="icon-badge">
        <i class="fas fa-seedling"></i>
      </div>
    </div>

    <div class="error-number">404</div>
    <h1>يبدو أن هذا الغصن لم ينمُ بعد!</h1>
    <p class="subtitle">
      الصفحة التي تبحث عنها غير موجودة، أو ربما تم تغيير مسارها، أو سقطت ورقتها في بستان آخر من حكاية جذع.
    </p>

    <div class="buttons-group">
      <a href="${homeUrl}" class="btn-main">
        <i class="fas fa-home"></i>
        العودة للرئيسية
      </a>
      <button type="button" onclick="if (window.history.length > 1) { window.history.back(); } else { window.location.href = '${homeUrl}'; }" class="btn-outline">
        <i class="fas fa-arrow-right"></i>
        الصفحة السابقة
      </button>
    </div>

    <div class="sections-box">
      <div class="sections-title">أو يمكنك استكشاف أحد أقسام الموقع:</div>
      <div class="sections-grid">
        <a href="${articlesUrl}" class="section-pill">
          <i class="fas fa-newspaper"></i>
          المقالات
        </a>
        <a href="${projectsUrl}" class="section-pill">
          <i class="fas fa-laptop-code"></i>
          المشاريع
        </a>
        <a href="${servicesUrl}" class="section-pill">
          <i class="fas fa-layer-group"></i>
          الخدمات
        </a>
        <a href="${contactUrl}" class="section-pill">
          <i class="fas fa-paper-plane"></i>
          تواصل معي
        </a>
      </div>
    </div>
  </main>

  <script>
    // Theme synchronization
    try {
      var savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
      } else if (savedTheme === 'light') {
        document.documentElement.classList.add('light-mode');
        document.body.classList.add('light-mode');
      }
    } catch (e) {}

    // Generate gentle leaf particles
    try {
      var layer = document.getElementById('particlesLayer');
      for (var i = 0; i < 15; i++) {
        var p = document.createElement('div');
        p.className = 'leaf-particle';
        var w = Math.floor(Math.random() * 26) + 14;
        var h = Math.floor(w * 1.3);
        p.style.width = w + 'px';
        p.style.height = h + 'px';
        p.style.left = (Math.random() * 96 + 2) + '%';
        p.style.animationDuration = (Math.random() * 14 + 10) + 's';
        p.style.animationDelay = (Math.random() * 10) + 's';
        layer.appendChild(p);
      }
    } catch (e) {}
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
