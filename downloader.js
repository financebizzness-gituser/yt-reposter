/**
 * downloader.js — Downloads a YouTube Short to downloads/ folder via yt-dlp
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { ensureDownloadsDir } from './state.js';

// ── Download a Short, return local file path ──────────────────────────────
export function downloadShort(videoId) {
  ensureDownloadsDir();

  const outTemplate = `downloads/${videoId}.%(ext)s`;

  console.log(`⬇️   Downloading ${videoId}...`);
  execSync(
    `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]" ` +
    `--merge-output-format mp4 -o "${outTemplate}" ` +
    `"https://youtube.com/shorts/${videoId}"`,
    { stdio: ['pipe', 'pipe', 'pipe'] }
  );

  // Find the downloaded file (extension may vary)
  const file = readdirSync('downloads').find(f => f.startsWith(videoId));
  if (!file) throw new Error(`Download failed: file not found for ${videoId}`);

  const path = join('downloads', file);
  console.log(`   ✅  Saved to ${path}`);
  return path;
}

// ── Delete local file after upload ───────────────────────────────────────
export function deleteLocal(filePath) {
  if (existsSync(filePath)) {
    unlinkSync(filePath);
    console.log(`🗑️   Deleted local file: ${filePath}`);
  }
}
