/**
 * uploader.js — Uploads a local video to YouTube via Data API v3
 */

import { google }            from 'googleapis';
import { createReadStream, statSync } from 'fs';
import { getAuthClient }     from './auth.js';
import { generateMetadata }  from './gemini.js';
import { YT_CATEGORY_ID, YT_PRIVACY } from './config.js';

// ── Upload a Short to YouTube ─────────────────────────────────────────────
export async function uploadToYouTube(filePath, originalTitle, channelHandle) {
  console.log(`\n🤖  Generating SEO metadata via Gemini...`);
  const { title, description, tags } = await generateMetadata(originalTitle, channelHandle);

  console.log(`📤  Uploading: "${title}"`);

  const auth    = await getAuthClient();
  const youtube = google.youtube({ version: 'v3', auth });

  const fileSize = statSync(filePath).size;

  const res = await youtube.videos.insert(
    {
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description,
          tags,
          categoryId: YT_CATEGORY_ID,
          defaultLanguage: 'en',
        },
        status: {
          privacyStatus:           YT_PRIVACY,
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: createReadStream(filePath),
      },
    },
    {
      onUploadProgress: (evt) => {
        const pct = Math.round((evt.bytesRead / fileSize) * 100);
        process.stdout.write(`\r   Uploading... ${pct}%`);
      },
    }
  );

  console.log(`\n   ✅  Uploaded! https://youtube.com/shorts/${res.data.id}`);
  return res.data.id;
}
