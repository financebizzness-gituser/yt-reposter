/**
 * gemini.js — Generate SEO-optimised title, description, and hashtags
 */

import fetch from 'node-fetch';
if (!globalThis.fetch) globalThis.fetch = fetch;

import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// ── Generate metadata for a Short ────────────────────────────────────────
export async function generateMetadata(originalTitle, channelHandle) {
  const prompt = `
You are a YouTube SEO expert. A Short from ${channelHandle} has the original title: "${originalTitle}"

Generate SEO-optimised metadata for reposting this Short. Return ONLY valid JSON, no markdown.

{
  "title": "compelling title under 80 characters, includes main keyword, no clickbait",
  "description": "2-3 sentences describing the video with natural keywords woven in. Include a call to action at the end. Under 400 characters.",
  "hashtags": ["tag1", "tag2", "tag3"]
}

Rules:
- hashtags: 12-15 relevant tags, no # symbol, mix of broad and niche tags
- title: must be different from original, more searchable
- description: natural language, not keyword-stuffed
- Keep the language and topic consistent with the original
`.trim();

  try {
    const result = await model.generateContent(prompt);
    const text   = result.response.text().trim();

    // Strip markdown code blocks if Gemini wraps in them
    const clean  = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const data   = JSON.parse(clean);

    // Add hashtags to description so they're visible on YouTube
    const hashtagLine = data.hashtags.map(t => `#${t.replace(/^#/, '')}`).join(' ');
    return {
      title:       data.title,
      description: `${data.description}\n\n${hashtagLine}`,
      tags:        data.hashtags.map(t => t.replace(/^#/, '')),
    };
  } catch (err) {
    console.warn(`⚠️  Gemini metadata failed, using original title. ${err.message}`);
    return {
      title:       originalTitle,
      description: `${originalTitle} #shorts #viral #trending`,
      tags:        ['shorts', 'viral', 'trending', 'reels'],
    };
  }
}
