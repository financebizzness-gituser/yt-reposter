/**
 * auth.js — YouTube OAuth2 flow
 * Run once: node auth.js → opens browser → saves token.json
 * All subsequent runs use token.json automatically (no browser needed)
 */

import { google } from 'googleapis';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import readline from 'readline';

const SCOPES      = ['https://www.googleapis.com/auth/youtube.upload'];
const SECRET_PATH = 'client_secret.json';
const TOKEN_PATH  = 'token.json';

// ── Build OAuth2 client from client_secret.json ───────────────────────────
function buildClient() {
  const creds = JSON.parse(readFileSync(SECRET_PATH));
  const { client_id, client_secret, redirect_uris } = creds.installed || creds.web;
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

// ── Get authenticated client (auto-refreshes token) ──────────────────────
export async function getAuthClient() {
  const client = buildClient();

  if (existsSync(TOKEN_PATH)) {
    const token = JSON.parse(readFileSync(TOKEN_PATH));
    client.setCredentials(token);

    // Auto-save refreshed token if it changes
    client.on('tokens', (newTokens) => {
      if (newTokens.refresh_token) {
        const merged = { ...token, ...newTokens };
        writeFileSync(TOKEN_PATH, JSON.stringify(merged, null, 2));
      }
    });

    return client;
  }

  // ── First-time auth flow ──────────────────────────────────────────────
  const authUrl = client.generateAuthUrl({ access_type: 'offline', scope: SCOPES });

  console.log('\n──────────────────────────────────────────');
  console.log('Open this URL in your browser to authorise:');
  console.log(authUrl);
  console.log('──────────────────────────────────────────\n');

  const rl   = readline.createInterface({ input: process.stdin, output: process.stdout });
  const code = await new Promise(resolve => rl.question('Paste the code here: ', resolve));
  rl.close();

  const { tokens } = await client.getToken(code.trim());
  client.setCredentials(tokens);
  writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log('✅  token.json saved — you will not need to do this again.\n');

  return client;
}

// ── Run directly: node auth.js ────────────────────────────────────────────
if (process.argv[1].endsWith('auth.js')) {
  await getAuthClient();
  process.exit(0);
}
