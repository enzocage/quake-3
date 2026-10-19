import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    open: false,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  assetsInclude: ['**/*.pk3', '**/*.bsp', '**/*.md3', '**/*.shader', '**/*.roq'],
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
});
