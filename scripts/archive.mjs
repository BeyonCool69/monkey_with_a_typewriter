// Archives finished drand rounds as 30-minute chunks (600 rounds = 6,000 letters).
// Only letters that have already been typed are stored, so nothing is spoiled.
import { createHash } from 'node:crypto';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';

const CHAIN = '52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971';
const HOSTS = ['https://api.drand.sh', 'https://api2.drand.sh', 'https://api3.drand.sh', 'https://drand.cloudflare.com'];
const ALPHA = 'abcdefghijklmnopqrstuvwxyz      ';
const PER_ROUND = 10, CHUNK_ROUNDS = 600, CHUNKS_PER_PAGE = 48;

async function get(path) {
  for (let a = 0; a < 3; a++) for (const h of HOSTS) {
    try { const r = await fetch(`${h}/${CHAIN}/${path}`, { signal: AbortSignal.timeout(8000) }); if (r.ok) return await r.json(); } catch {}
  }
  return null;
}
function letters(hex) {                 // identical to the page's letters()
  let bytes = Buffer.from(hex, 'hex'), out = '';
  while (out.length < PER_ROUND) {
    for (const b of bytes) if (b < 248 && out.length < PER_ROUND) out += ALPHA[b % 31];
    if (out.length < PER_ROUND) bytes = createHash('sha256').update(bytes).digest();
  }
  return out;
}

const info = await get('info');
if (!info) throw new Error('drand unreachable');
const genesis = info.genesis_time * 1000, period = info.period * 1000;
if (period !== 3000) throw new Error('expected a 3 s chain');

mkdirSync('archive', { recursive: true });
const metaPath = 'archive/meta.json';
if (!existsSync(metaPath)) {            // the monkey starts typing at the round current when this first runs
  writeFileSync(metaPath, JSON.stringify({ startRound: Math.floor((Date.now() - genesis) / period) }, null, 2));
}
const R0 = JSON.parse(readFileSync(metaPath, 'utf8')).startRound;
const lastFull = Math.floor((Date.now() - genesis) / period) - 1;   // last round that has been fully typed

outer:
for (let g = 0; R0 + (g + 1) * CHUNK_ROUNDS - 1 <= lastFull; g++) {
  const dir = `archive/${String(Math.floor(g / CHUNKS_PER_PAGE)).padStart(5, '0')}`;
  const file = `${dir}/${g % CHUNKS_PER_PAGE}.txt`;
  if (existsSync(file)) continue;
  let text = '';
  for (let i = 0; i < CHUNK_ROUNDS; i += 20) {
    const batch = await Promise.all(Array.from({ length: 20 }, (_, k) => get(`public/${R0 + g * CHUNK_ROUNDS + i + k}`)));
    for (const j of batch) { if (!j || !j.randomness) { console.log('stopping at chunk', g); break outer; } text += letters(j.randomness); }
  }
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, text);
  console.log('wrote', file);
}
