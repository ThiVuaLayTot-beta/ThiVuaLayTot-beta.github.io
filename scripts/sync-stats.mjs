import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const STATS_PATH = resolve(process.cwd(), '_data/stats.json');
const YOUTUBE_CHANNEL_ID = 'UCvNW1NAWWjblgrP6JQI4MbQ';
const YOUTUBE_HANDLE_URL = 'https://www.youtube' + '.com/@TungJohnPlayingChess';
const CHESSCOM_CLUB_API = 'https://api.chess' + '.com/pub/club/thi-vua-lay-tot-tungjohn-playing-chess';
const GIST_API_URL = 'https://api.github' + '.com/gists/9c53a11fca709a656076bf6de7c118b0';
const GIST_RAW_URL = 'https://gist.githubusercontent' + '.com/M-DinhHoangViet/9c53a11fca709a656076bf6de7c118b0/raw';

function formatThousandsK(num) { return `${Math.floor(num / 1000)}K+`; }
function formatPrizeEvents(num) { return `${Math.max(100, Math.floor(num / 10) * 10)}+`; }

function parseSubscriberCount(text) {
const clean = String(text || '').replace(/,/g, '.').trim();
const match = clean.match(/([\d.]+)\s*([KMN]|Tr|nghìn|triệu)?/i);
if (!match) return null;
let val = parseFloat(match[1]);
const unit = (match[2] || '').toLowerCase();
if (unit === 'k' || unit === 'n' || unit === 'nghìn') val *= 1000;
else if (unit === 'm' || unit === 'tr' || unit === 'triệu') val *= 1000000;
return Number.isFinite(val) && val > 0 ? Math.round(val) : null;
}

async function fetchYouTubeSubs() {
const apiKey = process.env.YOUTUBE_API_KEY;
if (apiKey) {
try {
const url = `https://www.googleapis` + `.com/youtube/v3/channels?part=statistics&id=${YOUTUBE_CHANNEL_ID}&key=${encodeURIComponent(apiKey)}`;
const res = await fetch(url);
if (res.ok) {
const data = await res.json();
const raw = Number(data?.items?.[0]?.statistics?.subscriberCount);
if (Number.isFinite(raw) && raw > 0) return raw;
}
} catch (e) { console.warn('YouTube API failed:', e.message); }
}
try {
const res = await fetch(YOUTUBE_HANDLE_URL, { headers: { 'Accept-Language': 'en-US,en;q=0.9', 'User-Agent': 'Mozilla/5.0' } });
if (!res.ok) return null;
const html = await res.text();
const match = html.match(/"subscriberCountText":\s*\{[^}]*"simpleText":\s*"([^"]+)"/) || html.match(/"subscriberCountText":\s*"([^"]+)"/);
if (match) return parseSubscriberCount(match[1]);
} catch (e) { console.warn('YouTube page fetch failed:', e.message); }
return null;
}

async function fetchChessComMembers() {
try {
const res = await fetch(CHESSCOM_CLUB_API, { headers: { 'User-Agent': 'ThiVuaLayTot-StatsSync/1.0' } });
if (!res.ok) return null;
const data = await res.json();
const count = Number(data?.members_count);
return Number.isFinite(count) && count > 0 ? count : null;
} catch (e) { console.warn('Chess.com API failed:', e.message); return null; }
}

async function fetchPrizeEvents() {
try {
const res = await fetch(GIST_API_URL, { headers: { 'User-Agent': 'ThiVuaLayTot-StatsSync/1.0' } });
if (res.ok) {
const gist = await res.json();
const files = Object.values(gist?.files || {});
let total = 0;
for (const f of files) {
if (f?.content) total += f.content.split('\n').filter((l) => l.trim()).length;
}
if (total > 0) return total;
}
} catch (e) { console.warn('Gist API failed:', e.message); }
try {
const res = await fetch(GIST_RAW_URL);
if (!res.ok) return null;
const txt = await res.text();
const count = txt.split('\n').filter((l) => l.trim()).length;
return count > 0 ? count : null;
} catch (e) { console.warn('Gist raw failed:', e.message); return null; }
}
async function fetchAppsScriptStats() { const url = process.env.APPS_SCRIPT_STATS_URL; if (!url) return null; try { const res = await fetch(url, { headers: { 'User-Agent': 'ThiVuaLayTot-StatSync/1.0' } }); if (!res.ok) return null; const data = await res.json(); if (data && (data.youtube_subs || data.chesscom_members || data.prize_events)) return data; } catch (e) { console.warn('Apps Script stats fetch failed:', e.message); } return null; }
async function main() {
let prev = {};
try { prev = JSON.parse(await readFile(STATS_PATH, 'utf8')); } catch {}
const appsData = await fetchAppsScriptStats(); if (appsData) { const next = { youtube_subs: appsData.youtube_subs || prev.youtube_subs || '174K+', youtube_subs_raw: appsData.youtube_subs_raw || prev.youtube_subs_raw || 174000, chesscom_members: appsData.chesscom_members || prev.chesscom_members || '21K+', chesscom_members_raw: appsData.chesscom_members_raw || prev.chesscom_members_raw || 21000, prize_events: appsData.prize_events || prev.prize_events || '100+', prize_events_raw: appsData.prize_events_raw || prev.prize_events_raw || 100, updated_at: appsData.updated_at || new Date().toISOString(), source: appsData.source || 'google-apps-script' }; await writeFile(STATS_PATH, JSON.stringify(next, null, 2) + '\n', 'utf8'); console.info('Stats synced from Apps Script:', next); return; }


const [ytRaw, chessRaw, eventsRaw] = await Promise.all([fetchYouTubeSubs(), fetchChessComMembers(), fetchPrizeEvents()]);
const next = {
youtube_subs: ytRaw ? formatThousandsK(ytRaw) : (prev.youtube_subs || '174K+'),
youtube_subs_raw: ytRaw || prev.youtube_subs_raw || 174000,
chesscom_members: chessRaw ? formatThousandsK(chessRaw) : (prev.chesscom_members || '21K+'),
chesscom_members_raw: chessRaw || prev.chesscom_members_raw || 21000,
prize_events: eventsRaw ? formatPrizeEvents(eventsRaw) : (prev.prize_events || '100+'),
prize_events_raw: eventsRaw || prev.prize_events_raw || 100,
updated_at: new Date().toISOString()
};
await writeFile(STATS_PATH, JSON.stringify(next, null, 2) + '\n', 'utf8');
console.info('Synced stats:', next);
}

main();