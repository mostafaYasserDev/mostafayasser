/**
 * Cloudflare Worker for Mostafa Yasser (Jidhe) Portfolio
 * Handles dynamic image rendering from Firestore Base64 data and social crawler Open Graph fallbacks
 */

const FIRESTORE_BASE =
  'https://firestore.googleapis.com/v1/projects/jidhe-trunk/databases/(default)/documents';

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

async function handleImageRequest(request) {
  const url = new URL(request.url);
  const siteUrl = `${url.protocol}//${url.hostname}`;
  const defaultBanner = `${siteUrl}/assets/og-banner.jpg`;

  // Path format: /img/articles/docId.jpg or /img/projects/slug.jpg
  const segments = url.pathname.replace(/^\/img\//, '').split('/').filter(Boolean);
  if (segments.length < 2) {
    return Response.redirect(defaultBanner, 302);
  }

  const collection = segments[0];
  const fileWithExt = segments.slice(1).join('/');
  const rawId = fileWithExt.replace(/\.[^/.]+$/, '');
  const decodedId = robustDecode(rawId);

  const slugsToTry = Array.from(new Set([decodedId, rawId])).filter(Boolean);

  try {
    let docFields = null;

    // 1. Try slug query
    for (const s of slugsToTry) {
      try {
        const queryRes = await fetch(`${FIRESTORE_BASE}:runQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            structuredQuery: {
              from: [{ collectionId: collection }],
              where: {
                fieldFilter: {
                  field: { fieldPath: 'slug' },
                  op: 'EQUAL',
                  value: { stringValue: s },
                },
              },
              limit: 1,
            },
          }),
        });

        if (queryRes.ok) {
          const queryData = await queryRes.json();
          if (Array.isArray(queryData) && queryData[0] && queryData[0].document) {
            docFields = queryData[0].document.fields;
            break;
          }
        }
      } catch {}
    }

    // 2. Try direct doc ID
    if (!docFields) {
      for (const id of slugsToTry) {
        try {
          const directRes = await fetch(`${FIRESTORE_BASE}/${collection}/${encodeURIComponent(id)}`);
          if (directRes.ok) {
            const data = await directRes.json();
            if (data.fields) {
              docFields = data.fields;
              break;
            }
          }
        } catch {}
      }
    }

    if (!docFields) {
      return Response.redirect(defaultBanner, 302);
    }

    const rawImage =
      docFields.coverImage?.stringValue ||
      docFields.mainImage?.stringValue ||
      docFields.image?.stringValue ||
      docFields.thumbnail?.stringValue;

    if (!rawImage) {
      return Response.redirect(defaultBanner, 302);
    }

    const cleanStr = rawImage.trim();
    if (cleanStr.startsWith('http://') || cleanStr.startsWith('https://')) {
      return Response.redirect(cleanStr, 302);
    }

    let mimeType = 'image/jpeg';
    let base64Body = cleanStr;

    if (cleanStr.startsWith('data:')) {
      const commaIdx = cleanStr.indexOf(',');
      if (commaIdx !== -1) {
        const header = cleanStr.slice(0, commaIdx);
        const match = header.match(/data:([^;]+)/);
        if (match) mimeType = match[1];
        base64Body = cleanStr.slice(commaIdx + 1);
      }
    }

    base64Body = base64Body.replace(/\s+/g, '');
    const binaryStr = atob(base64Body);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    return new Response(bytes.buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': bytes.length.toString(),
        'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('Worker image error:', err);
    return Response.redirect(defaultBanner, 302);
  }
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
  // If it's a redirect, return as is
  if (response.status >= 300 && response.status < 400) {
    return response;
  }
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

async function handleDynamicDetailPage(request, env, url) {
  const pathParts = url.pathname.split('/').filter(Boolean);
  if (pathParts.length < 2) return null;
  const route = pathParts[0]; // 'article' | 'project' | 'service'
  const collectionName =
    route === 'article' ? 'articles' : route === 'project' ? 'projects' : 'services';
  const idOrSlug = robustDecode(pathParts[1]);

  let docFields = null;
  try {
    const queryRes = await fetch(`${FIRESTORE_BASE}:runQuery`, {
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
    });
    if (queryRes.ok) {
      const data = await queryRes.json();
      if (Array.isArray(data) && data[0]?.document?.fields) {
        docFields = data[0].document.fields;
      }
    }
    if (!docFields) {
      const getRes = await fetch(
        `${FIRESTORE_BASE}/${collectionName}/${encodeURIComponent(idOrSlug)}`
      );
      if (getRes.ok) {
        const data = await getRes.json();
        if (data.fields) docFields = data.fields;
      }
    }
  } catch (e) {
    console.error('Dynamic route error:', e);
  }

  if (!docFields) {
    return null;
  }

  // Document exists in Firestore!
  // Fetch an existing pre-rendered HTML shell for this route type from env.ASSETS
  const templateRoute =
    route === 'article'
      ? '/article/from-idea-to-scalable-product/'
      : route === 'project'
      ? '/project/angham-adaptive-portfolio/'
      : '/service/KdCoJji5fShhaW1Wlxai/';

  const templateReq = new Request(`${url.origin}${templateRoute}`, {
    headers: request.headers,
  });
  const templateRes = await env.ASSETS.fetch(templateReq);
  if (!templateRes || templateRes.status !== 200) {
    return null;
  }

  const title = docFields.title?.stringValue || docFields.name?.stringValue || 'جذع';
  const description =
    docFields.shortDescription?.stringValue ||
    docFields.description?.stringValue ||
    title;
  const pageTitle = `${title} | جذع`;
  const canonicalUrl = `${url.origin}/${route}/${encodeURIComponent(idOrSlug)}/`;
  const image =
    docFields.coverImage?.stringValue || docFields.mainImage?.stringValue || '';
  let finalImage = `${url.origin}/assets/og-banner.jpg`;
  if (image && image.startsWith('http')) finalImage = image;

  const rewriter = new HTMLRewriter()
    .on('title', {
      element(el) {
        el.setInnerContent(pageTitle);
      },
    })
    .on('meta[name="description"]', {
      element(el) {
        el.setAttribute('content', description.slice(0, 160));
      },
    })
    .on('meta[property="og:title"]', {
      element(el) {
        el.setAttribute('content', pageTitle);
      },
    })
    .on('meta[property="og:description"]', {
      element(el) {
        el.setAttribute('content', description.slice(0, 160));
      },
    })
    .on('meta[property="og:url"]', {
      element(el) {
        el.setAttribute('content', canonicalUrl);
      },
    })
    .on('meta[property="og:image"]', {
      element(el) {
        el.setAttribute('content', finalImage);
      },
    })
    .on('link[rel="canonical"]', {
      element(el) {
        el.setAttribute('href', canonicalUrl);
      },
    });

  return rewriter.transform(templateRes);
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

async function serveNotFound(env, request) {
  // 1. First attempt: fetch /404/ with trailing slash from env.ASSETS
  if (env && env.ASSETS) {
    try {
      const url = new URL(request.url);
      const notFoundReq = new Request(`${url.origin}/404/`, {
        headers: request.headers,
      });
      const notFoundRes = await env.ASSETS.fetch(notFoundReq);
      if (notFoundRes && notFoundRes.status === 200) {
        const notFoundHeaders = new Headers(notFoundRes.headers);
        notFoundHeaders.set('Content-Type', 'text/html; charset=utf-8');
        return withSecurityHeaders(
          new Response(notFoundRes.body, {
            status: 404,
            statusText: 'Not Found',
            headers: notFoundHeaders,
          })
        );
      }
    } catch (e) {
      console.error('Error fetching /404/ from ASSETS:', e);
    }
  }

  // 2. Standalone bulletproof fallback: serve the embedded branded HTML
  return withSecurityHeaders(
    new Response(build404Html(request.url), {
      status: 404,
      statusText: 'Not Found',
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  );
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Auto-redirect missing trailing slash for directory routes
    if (!url.pathname.includes('.') && !url.pathname.endsWith('/')) {
      return Response.redirect(`${url.origin}${url.pathname}/${url.search}`, 308);
    }

    // Dynamic image conversion route
    if (url.pathname.startsWith('/img/')) {
      // First check if the static asset exists in env.ASSETS
      if (env.ASSETS) {
        const assetRes = await env.ASSETS.fetch(request);
        if (assetRes.status === 200) {
          return withSecurityHeaders(assetRes);
        }
      }
      const imgRes = await handleImageRequest(request);
      return withSecurityHeaders(imgRes);
    }

    // Default static assets handler with dynamic fallback
    if (env.ASSETS) {
      const res = await env.ASSETS.fetch(request);
      if (res.status === 200) {
        return withSecurityHeaders(res);
      }

      // If asset returned 404 and it's a detail route (/article/*, /project/*, /service/*)
      if (
        res.status === 404 &&
        (url.pathname.startsWith('/article/') ||
          url.pathname.startsWith('/project/') ||
          url.pathname.startsWith('/service/'))
      ) {
        const dynamicRes = await handleDynamicDetailPage(request, env, url);
        if (dynamicRes) {
          return withSecurityHeaders(dynamicRes);
        }
        // Article/project/service really doesn't exist in Firestore -> serve custom 404 page
        return serveNotFound(env, request);
      }

      // If HTML page route was not found, serve the custom branded 404 page
      if (res.status === 404 && !url.pathname.includes('.')) {
        return serveNotFound(env, request);
      }

      return withSecurityHeaders(res);
    }

    return serveNotFound(env, request);
  },
};
