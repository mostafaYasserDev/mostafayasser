import fs from 'fs';
import path from 'path';
import https from 'https';

const FIRESTORE_BASE =
  'https://firestore.googleapis.com/v1/projects/jidhe-trunk/databases/(default)/documents';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });
}

function saveBase64Image(base64Str, targetPath) {
  try {
    let clean = base64Str.trim();
    if (!clean) return false;
    const commaIdx = clean.indexOf(',');
    if (clean.startsWith('data:') && commaIdx !== -1) {
      clean = clean.slice(commaIdx + 1);
    }
    clean = clean.replace(/\s+/g, '');
    const buffer = Buffer.from(clean, 'base64');
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, buffer);
    return true;
  } catch (err) {
    console.error(`Failed to save image to ${targetPath}:`, err);
    return false;
  }
}

async function processCollection(collectionName) {
  console.log(`Fetching documents for ${collectionName}...`);
  try {
    const data = await fetchJson(`${FIRESTORE_BASE}/${collectionName}`);
    if (!data.documents) {
      console.log(`No documents found in ${collectionName}`);
      return;
    }

    let savedCount = 0;
    for (const doc of data.documents) {
      const docId = doc.name.split('/').pop();
      const fields = doc.fields || {};
      const slug = fields.slug?.stringValue;
      const image =
        fields.coverImage?.stringValue ||
        fields.mainImage?.stringValue ||
        fields.image?.stringValue ||
        fields.thumbnail?.stringValue;

      if (image && image.startsWith('data:image')) {
        const idPath = path.join(process.cwd(), 'public', 'img', collectionName, `${docId}.jpg`);
        if (saveBase64Image(image, idPath)) {
          savedCount++;
        }

        if (slug) {
          const slugPath = path.join(process.cwd(), 'public', 'img', collectionName, `${slug}.jpg`);
          saveBase64Image(image, slugPath);
        }
      }
    }
    console.log(`Saved ${savedCount} images for ${collectionName}`);
  } catch (err) {
    console.error(`Error processing ${collectionName}:`, err);
  }
}

async function main() {
  console.log('--- Generating Static Binary Images for Social Sharing ---');
  await processCollection('articles');
  await processCollection('projects');
  await processCollection('services');
  console.log('--- Done Generating Static Images ---');
}

main();
