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

// Max Shorts to post per day (keeps under 10,000 API quota units)
// 5 posts × 1,600 units = 8,000 units used, 2,000 left for reads
export const MAX_POSTS_PER_DAY = 5;

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
