/**
 * state.js — Persists queue, seen videos, and daily post count
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

const QUEUE_PATH = 'queue.json';
const SEEN_PATH  = 'seen.json';
const STATE_PATH = 'state.json';

// ── Helpers ───────────────────────────────────────────────────────────────
function readJSON(path, fallback) {
  return existsSync(path) ? JSON.parse(readFileSync(path)) : fallback;
}
function saveJSON(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2));
}
function todayStr() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// ── Queue ─────────────────────────────────────────────────────────────────
export function getQueue()          { return readJSON(QUEUE_PATH, []); }
export function saveQueue(q)        { saveJSON(QUEUE_PATH, q); }
export function enqueue(item)       { const q = getQueue(); q.push(item); saveQueue(q); }
export function dequeue()           { const q = getQueue(); const item = q.shift(); saveQueue(q); return item; }
export function queueSize()         { return getQueue().length; }

// ── Seen video IDs ────────────────────────────────────────────────────────
export function getSeen()           { return new Set(readJSON(SEEN_PATH, [])); }
export function markSeen(videoId)   {
  const seen = getSeen();
  seen.add(videoId);
  saveJSON(SEEN_PATH, [...seen]);
}
export function hasSeen(videoId)    { return getSeen().has(videoId); }

// ── Daily post counter ────────────────────────────────────────────────────
export function getDailyCount() {
  const state = readJSON(STATE_PATH, { date: todayStr(), count: 0 });
  if (state.date !== todayStr()) return 0; // new day — auto-reset
  return state.count;
}
export function incrementDailyCount() {
  const count = getDailyCount() + 1;
  saveJSON(STATE_PATH, { date: todayStr(), count });
  return count;
}
export function resetDailyCount() {
  saveJSON(STATE_PATH, { date: todayStr(), count: 0 });
  console.log('🔄  Daily post counter reset.');
}

// ── Downloads folder ──────────────────────────────────────────────────────
export function ensureDownloadsDir() {
  mkdirSync('downloads', { recursive: true });
}
