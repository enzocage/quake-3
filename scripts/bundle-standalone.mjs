// ============================================================================
// scripts/bundle-standalone.mjs
// Bundles the entire TypeScript engine + embedded base64 pak0.pk3 into a
// file:// compatible IIFE bundle (dist/q3-standalone.js) so double-clicking
// index.html in Windows Explorer works without any local web server!
// ============================================================================

import fs from 'node:fs';
import { build } from 'vite';

async function main() {
  const pk3Bytes = fs.readFileSync('public/assets/baseq3/pak0.pk3');
  const pk3Base64 = pk3Bytes.toString('base64');

  fs.writeFileSync(
    'src/qcommon/embedded_pak0.ts',
    `// Auto-generated embedded pak0.pk3 for file:// protocol compatibility\nexport const EMBEDDED_PAK0_BASE64 = "${pk3Base64}";\n`
  );

  await build({
    configFile: false,
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: 'src/main.ts',
        name: 'Quake3ArenaEngine',
        formats: ['iife'],
        fileName: () => 'q3-standalone.js',
      },
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  });

  console.log('[Standalone Builder] Built dist/q3-standalone.js for direct file:// execution.');
}

main();
