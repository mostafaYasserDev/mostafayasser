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

async function serveNotFound(env, request) {
  if (env.ASSETS) {
    try {
      const url = new URL(request.url);
      const notFoundReq = new Request(`${url.origin}/404.html`, {
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
      console.error('Error serving custom 404:', e);
    }
  }
  return withSecurityHeaders(new Response('404 Not Found', { status: 404 }));
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
