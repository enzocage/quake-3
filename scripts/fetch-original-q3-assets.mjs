// ============================================================================
// scripts/fetch-original-q3-assets.mjs
// Downloads the official 1999 id Software Quake III Arena Demo installer
// (linuxq3ademo-1.11-6.x86.gz.sh) from the GWDG idstuff mirror, extracts the
// embedded .tar.gz payload, and writes the 100% original `demoq3/pak0.pk3`
// (containing original 1999 maps q3dm1, q3dm7, q3dm17, q3tourney2, original
// .tga/.jpg graphics, .md3 models, .shader scripts, .wav sounds & .qvm files)
// to `public/assets/baseq3/pak0.pk3`!
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const DEMO_URL =
  'https://ftp.gwdg.de/pub/misc/ftp.idsoftware.com/idstuff/quake3/linux/linuxq3ademo-1.11-6.x86.gz.sh';
const OUT_DIR = path.resolve('public/assets/baseq3');
const OUT_PK3 = path.join(OUT_DIR, 'pak0.pk3');

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`[Q3 Original Assets] Downloading ${DEMO_URL} (~47 MB)...`);
  const res = await fetch(DEMO_URL);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} downloading ${DEMO_URL}`);
  }

  const rawBytes = new Uint8Array(await res.arrayBuffer());
  console.log(`[Q3 Original Assets] Downloaded ${(rawBytes.byteLength / (1024 * 1024)).toFixed(2)} MB.`);

  // Find the start of the embedded .tar.gz stream after the shell script header (164 lines)
  let lineCount = 0;
  let gzOffset = -1;
  for (let i = 0; i < rawBytes.byteLength; i++) {
    if (rawBytes[i] === 0x0a) {
      lineCount++;
      if (lineCount === 164) {
        gzOffset = i + 1;
        break;
      }
    }
  }

  if (gzOffset < 0 || rawBytes[gzOffset] !== 0x1f || rawBytes[gzOffset + 1] !== 0x8b) {
    // Fallback: scan for gzip magic 1F 8B 08
    for (let i = 2000; i < 20000; i++) {
      if (rawBytes[i] === 0x1f && rawBytes[i + 1] === 0x8b && rawBytes[i + 2] === 0x08) {
        gzOffset = i;
        break;
      }
    }
  }

  console.log(`[Q3 Original Assets] Found embedded .tar.gz at byte offset ${gzOffset}. Decompressing...`);
  const tarBuffer = zlib.gunzipSync(rawBytes.subarray(gzOffset));
  console.log(`[Q3 Original Assets] Decompressed TAR archive (${(tarBuffer.byteLength / (1024 * 1024)).toFixed(2)} MB).`);

  // Parse TAR blocks (512-byte header per entry) to extract demoq3/pak0.pk3
  let offset = 0;
  let extracted = false;
  while (offset + 512 <= tarBuffer.byteLength) {
    const nameBytes = tarBuffer.subarray(offset, offset + 100);
    let name = '';
    for (let i = 0; i < 100 && nameBytes[i] !== 0; i++) {
      name += String.fromCharCode(nameBytes[i]);
    }
    if (!name) break;

    const sizeOctal = new TextDecoder()
      .decode(tarBuffer.subarray(offset + 124, offset + 136))
      .replace(/\0/g, '')
      .trim();
    const fileSize = Number.parseInt(sizeOctal, 8) || 0;
    const dataStart = offset + 512;

    if (name.endsWith('pak0.pk3') && fileSize > 1_000_000) {
      const pk3Data = tarBuffer.subarray(dataStart, dataStart + fileSize);
      fs.writeFileSync(OUT_PK3, pk3Data);
      console.log(
        `[Q3 Original Assets] Extracted ORIGINAL 1999 "${name}" -> ${OUT_PK3} (${(pk3Data.byteLength / (1024 * 1024)).toFixed(2)} MB)`
      );
      extracted = true;
      break;
    }

    offset = dataStart + Math.ceil(fileSize / 512) * 512;
  }

  if (!extracted) {
    throw new Error('Could not find demoq3/pak0.pk3 inside the tar archive.');
  }
}

main();
