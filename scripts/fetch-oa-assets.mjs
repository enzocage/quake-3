// ============================================================================
// scripts/fetch-oa-assets.mjs
// Downloads original OpenArena / NeonKnightOA/nk-oa-assets files from GitHub
// and packs them into public/assets/baseoa/pak0_nkoa.pk3
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { zipSync } from 'fflate';

const OUT_DIR = path.resolve('public/assets/baseoa');
const OUT_PK3 = path.join(OUT_DIR, 'pak0_nkoa.pk3');
const BASE_URL = 'https://raw.githubusercontent.com/NeonKnightOA/nk-oa-assets/master';

const FILES_TO_FETCH = [
  'scripts/common.shader',
  'scripts/gfx.shader',
  'scripts/models.shader',
  'scripts/sfx.shader',
  'scripts/sky.shader',
  'scripts/liquid.shader',
  'scripts/oa_fogs.shader',
  'scripts/weapons.shader',
  'scripts/bots.txt',
  'scripts/arenas.txt',
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const pk3Entries = {};
  let count = 0;

  for (const rel of FILES_TO_FETCH) {
    try {
      const res = await fetch(`${BASE_URL}/${rel}`);
      if (res.ok) {
        pk3Entries[rel] = new Uint8Array(await res.arrayBuffer());
        count++;
        console.log(`[NK-OA Fetcher] Downloaded ${rel}`);
      }
    } catch (err) {
      console.warn(`[NK-OA Fetcher] Skipped ${rel}: ${err.message}`);
    }
  }

  if (count > 0) {
    const zipped = zipSync(pk3Entries, { level: 6 });
    fs.writeFileSync(OUT_PK3, zipped);
    console.log(`[NK-OA Fetcher] Packed ${count} files into ${OUT_PK3} (${(zipped.byteLength / 1024).toFixed(1)} KB)`);
  } else {
    console.log('[NK-OA Fetcher] No remote files fetched (offline or rate-limited).');
  }
}

main();
