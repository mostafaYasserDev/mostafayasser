export async function onRequest(context) {
  const { path } = context.params;

  // path format: ['articles' | 'projects' | 'services', 'documentId.jpg']
  if (!path || path.length < 2) {
    return new Response('Not found', { status: 404 });
  }

  const collection = path[0];
  const idWithExt = path[1];
  const id = idWithExt.replace(/\.[^/.]+$/, ''); // Remove extension like .jpg or .webp

  const FIRESTORE_BASE =
    'https://firestore.googleapis.com/v1/projects/jidhe-trunk/databases/(default)/documents';

  try {
    let docFields = null;

    // 1. Try slug query first
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
                value: { stringValue: id },
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
        }
      }
    } catch {}

    // 2. Try direct doc ID
    if (!docFields) {
      const response = await fetch(`${FIRESTORE_BASE}/${collection}/${encodeURIComponent(id)}`);
      if (response.ok) {
        const docData = await response.json();
        docFields = docData.fields;
      }
    }

    if (!docFields) {
      return new Response('Image not found', { status: 404 });
    }

    // Extract base64 image data
    const base64Str =
      docFields.coverImage?.stringValue ||
      docFields.mainImage?.stringValue ||
      docFields.image?.stringValue ||
      docFields.thumbnail?.stringValue;

    if (!base64Str) {
      return new Response('No image associated with document', { status: 404 });
    }

    // If it is already an external HTTP URL, redirect
    if (base64Str.startsWith('http://') || base64Str.startsWith('https://')) {
      return Response.redirect(base64Str, 302);
    }

    // Parse base64 data URL (e.g. data:image/webp;base64,...)
    const matches = base64Str.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return new Response('Invalid image format', { status: 400 });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // Decode binary data
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new Response(bytes.buffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=86400, s-maxage=31536000',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response('Internal Server Error: ' + (error?.message || error), { status: 500 });
  }
}
