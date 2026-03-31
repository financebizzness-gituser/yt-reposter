/**
 * monitor.js — Scans all 5 channels for new Shorts not yet seen
 * Returns array of { id, title, url, channel }
 */

import { execSync } from 'child_process';
import { CHANNELS, SHORTS_PER_CHANNEL, MAX_QUEUE_SIZE } from './config.js';
import { hasSeen } from './state.js';

// ── Fetch latest Shorts from one channel via yt-dlp ──────────────────────
function fetchChannelShorts(handle) {
  const url = `https://www.youtube.com/@${handle.replace('@', '')}/shorts`;
  try {
    const raw = execSync(
      `yt-dlp --flat-playlist --playlist-end ${SHORTS_PER_CHANNEL} -j "${url}"`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );

    return raw
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(line => {
        const d = JSON.parse(line);
        return {
          id:         d.id,
          title:      d.title,
          url:        `https://youtube.com/shorts/${d.id}`,
          channel:    handle,
          viewCount:  d.view_count || 0,   // already in yt-dlp flat metadata
        };
      });
  } catch (err) {
    console.warn(`⚠️  Could not fetch ${handle}: ${err.message.split('\n')[0]}`);
    return [];
  }
}

// ── Scan all channels → filter seen → sort by views → return top MAX_QUEUE_SIZE
export async function scanChannels() {
  console.log(`\n🔍  Scanning ${CHANNELS.length} channels for new Shorts...`);
  const candidates = [];

  for (const handle of CHANNELS) {
    const shorts = fetchChannelShorts(handle);
    const fresh  = shorts.filter(s => !hasSeen(s.id));
    console.log(`   ${handle}: ${shorts.length} checked, ${fresh.length} new`);
    candidates.push(...fresh);
  }

  // Sort all unseen shorts by view count descending, take top MAX_QUEUE_SIZE
  const top = candidates
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, MAX_QUEUE_SIZE);

  console.log(`   ✅  ${candidates.length} unseen found → top ${top.length} by views queued.\n`);
  top.forEach((s, i) =>
    console.log(`   ${i + 1}. [${s.channel}] ${s.title.slice(0, 60)} — ${s.viewCount.toLocaleString()} views`)
  );

  return top;
}

// ── Run directly: node monitor.js ────────────────────────────────────────
if (process.argv[1].endsWith('monitor.js')) {
  const results = await scanChannels();
  results.forEach((s, i) => console.log(`${i + 1}. [${s.channel}] ${s.title}`));
}
