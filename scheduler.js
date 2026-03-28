/**
 * scheduler.js — Main orchestrator
 *
 * Flow every 2 hours:
 *   1. Check daily post count → stop if limit hit
 *   2. If queue empty → scan channels → fill queue
 *   3. Dequeue next Short → download → upload → mark seen → delete local
 *   4. Repeat at next cron tick
 *
 * Usage:
 *   node scheduler.js          → runs on cron (every 2 hours)
 *   node scheduler.js --once   → runs once immediately then exits
 */

import cron                from 'node-cron';
import { scanChannels }    from './monitor.js';
import { downloadShort, deleteLocal } from './downloader.js';
import { uploadToYouTube } from './uploader.js';
import {
  enqueue, dequeue, queueSize,
  markSeen, getDailyCount, incrementDailyCount, resetDailyCount,
} from './state.js';
import { MAX_POSTS_PER_DAY, POST_CRON, RESET_CRON } from './config.js';

// ── Core: process one post cycle ─────────────────────────────────────────
async function runCycle() {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`🕐  ${new Date().toLocaleString()}  |  Cycle start`);

  // 1. Daily limit check
  const posted = getDailyCount();
  if (posted >= MAX_POSTS_PER_DAY) {
    console.log(`🚫  Daily limit reached (${posted}/${MAX_POSTS_PER_DAY}). Skipping until midnight.`);
    return;
  }

  // 2. Fill queue if empty
  if (queueSize() === 0) {
    console.log('📭  Queue is empty — scanning channels...');
    const newShorts = await scanChannels();

    if (newShorts.length === 0) {
      console.log('😴  No new Shorts found on any channel. Will try again next cycle.');
      return;
    }

    newShorts.forEach(s => enqueue(s));
    console.log(`📬  ${newShorts.length} Shorts added to queue.`);
  }

  // 3. Take next item from queue
  const item = dequeue();
  console.log(`\n▶️   Next up: [${item.channel}] ${item.title}`);

  let localPath = null;
  try {
    // Download
    localPath = downloadShort(item.id);

    // Upload with Gemini-generated metadata
    await uploadToYouTube(localPath, item.title, item.channel);

    // Mark as seen so we never re-download
    markSeen(item.id);

    // Update daily counter
    const newCount = incrementDailyCount();
    console.log(`📊  Posts today: ${newCount}/${MAX_POSTS_PER_DAY} | Queue remaining: ${queueSize()}`);

  } catch (err) {
    console.error(`❌  Error processing ${item.id}: ${err.message}`);
    // Don't mark as seen — it can be retried next cycle if re-discovered
  } finally {
    // Always clean up local file
    if (localPath) deleteLocal(localPath);
  }
}

// ── Entry point ───────────────────────────────────────────────────────────
const runOnce = process.argv.includes('--once');

if (runOnce) {
  // Run immediately and exit
  await runCycle();
  process.exit(0);
} else {
  // Run immediately on start, then on schedule
  console.log(`🚀  YT Reposter started`);
  console.log(`   Schedule  : every 2 hours`);
  console.log(`   Daily cap : ${MAX_POSTS_PER_DAY} posts/day`);
  console.log(`   Channels  : 5 monitored\n`);

  await runCycle(); // run once on startup

  // Post every 2 hours
  cron.schedule(POST_CRON, runCycle);

  // Reset daily counter at midnight
  cron.schedule(RESET_CRON, resetDailyCount);
}
