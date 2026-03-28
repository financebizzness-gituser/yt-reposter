/**
 * monitor.js — Scans all 5 channels for new Shorts not yet seen
 * Returns array of { id, title, url, channel }
 */

import { execSync } from 'child_process';
import { CHANNELS, SHORTS_PER_CHANNEL } from './config.js';
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
        return { id: d.id, title: d.title, url: `https://youtube.com/shorts/${d.id}`, channel: handle };
      });
  } catch (err) {
    console.warn(`⚠️  Could not fetch ${handle}: ${err.message.split('\n')[0]}`);
    return [];
  }
}

// ── Scan all channels, return only unseen Shorts ──────────────────────────
export async function scanChannels() {
  console.log(`\n🔍  Scanning ${CHANNELS.length} channels for new Shorts...`);
  const newShorts = [];

  for (const handle of CHANNELS) {
    const shorts = fetchChannelShorts(handle);
    const fresh  = shorts.filter(s => !hasSeen(s.id));
    console.log(`   ${handle}: ${shorts.length} checked, ${fresh.length} new`);
    newShorts.push(...fresh);
  }

  console.log(`   ✅  ${newShorts.length} new Shorts found total.\n`);
  return newShorts;
}

// ── Run directly: node monitor.js ────────────────────────────────────────
if (process.argv[1].endsWith('monitor.js')) {
  const results = await scanChannels();
  results.forEach((s, i) => console.log(`${i + 1}. [${s.channel}] ${s.title}`));
}
