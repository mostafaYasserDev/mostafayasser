export async function onRequest(context) {
  const { path } = context.params;
  const url = new URL(context.request.url);
  const siteUrl = `${url.protocol}//${url.hostname}`;
  const defaultBanner = `${siteUrl}/assets/og-banner.jpg`;

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

  // path format: ['articles' | 'projects' | 'services', 'documentId.jpg']
  if (!path || path.length < 2) {
    return Response.redirect(defaultBanner, 302);
  }

  const collection = path[0];
  const fullFileName = path.slice(1).join('/');
  const rawIdWithExt = fullFileName.replace(/\.[^/.]+$/, '');
  const decodedId = robustDecode(rawIdWithExt);

  const FIRESTORE_BASE =
    'https://firestore.googleapis.com/v1/projects/jidhe-trunk/databases/(default)/documents';

  try {
    let docFields = null;

    // 1. Try slug query with decoded and raw slug
    const slugsToTry = Array.from(new Set([decodedId, rawIdWithExt])).filter(Boolean);
    for (const s of slugsToTry) {
      try {
        const queryResponse = await fetch(`${FIRESTORE_BASE}:runQuery`, {
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

        if (queryResponse.ok) {
          const queryData = await queryResponse.json();
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
          const response = await fetch(`${FIRESTORE_BASE}/${collection}/${encodeURIComponent(id)}`);
          if (response.ok) {
            const docData = await response.json();
            if (docData.fields) {
              docFields = docData.fields;
              break;
            }
          }
        } catch {}
      }
    }

    if (!docFields) {
      return Response.redirect(defaultBanner, 302);
    }

    // Extract image data
    const rawImageStr =
      docFields.coverImage?.stringValue ||
      docFields.mainImage?.stringValue ||
      docFields.image?.stringValue ||
      docFields.thumbnail?.stringValue;

    if (!rawImageStr) {
      return Response.redirect(defaultBanner, 302);
    }

    const cleanStr = rawImageStr.trim();

    // If it is already an external HTTP URL, redirect
    if (cleanStr.startsWith('http://') || cleanStr.startsWith('https://')) {
      return Response.redirect(cleanStr, 302);
    }

    // Parse base64 data
    let mimeType = 'image/jpeg';
    let base64Body = cleanStr;

    if (cleanStr.startsWith('data:')) {
      const commaIndex = cleanStr.indexOf(',');
      if (commaIndex !== -1) {
        const header = cleanStr.slice(0, commaIndex);
        const mimeMatch = header.match(/data:([^;]+)/);
        if (mimeMatch) {
          mimeType = mimeMatch[1];
        }
        base64Body = cleanStr.slice(commaIndex + 1);
      }
    }

    // Strip whitespace, line breaks, and newlines that can break atob
    base64Body = base64Body.replace(/\s+/g, '');

    // Decode binary data
    const binaryString = atob(base64Body);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new Response(bytes.buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': bytes.length.toString(),
        'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return Response.redirect(defaultBanner, 302);
  }
}
