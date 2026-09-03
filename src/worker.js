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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Dynamic image conversion route
    if (url.pathname.startsWith('/img/')) {
      // First check if the static asset exists in env.ASSETS
      if (env.ASSETS) {
        const assetRes = await env.ASSETS.fetch(request);
        if (assetRes.status === 200) {
          return assetRes;
        }
      }
      return handleImageRequest(request);
    }

    // Default static assets handler
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};
