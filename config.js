// ── Channel Monitor + Posting Config ─────────────────────────────────────

export const CHANNELS = [
  '@ssworlds01',
  '@Pkwmff',
  '@stellerfeed2.0',
  '@auradrivenn',
  '@shortseries-0',
];

// How many recent Shorts to check per channel on each scan
export const SHORTS_PER_CHANNEL = 5;

// Max queue size — scan all channels, sort by views, take only top N
// Keeps queue fresh — always recent high-performing content, never stale
export const MAX_QUEUE_SIZE = 3;

// No artificial daily cap — let YouTube API return an error if quota is hit

// Hours between each post
export const POST_INTERVAL_HOURS = 2;

// Cron: every 2 hours  → "0 */2 * * *"
export const POST_CRON = '0 */2 * * *';

// Cron: midnight reset of daily counter
export const RESET_CRON = '0 0 * * *';

// YouTube video category ID — 24 = Entertainment (change if needed)
// Full list: https://developers.google.com/youtube/v3/docs/videoCategories
export const YT_CATEGORY_ID = '24';

// Privacy status of uploaded videos
export const YT_PRIVACY = 'public'; // 'public' | 'private' | 'unlisted'
