/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

// PACK=1 时（npm run pack）把所有素材内联进 JS，最后由 tools/pack.mjs 合成一个 index.html。
const pack = process.env.PACK === '1';

export default defineConfig({
  base: './',
  server: { port: 5173, host: true },
  build: {
    target: 'es2022',
    outDir: pack ? 'release' : 'dist',
    emptyOutDir: true,
    assetsInlineLimit: pack ? () => true : undefined,
    chunkSizeWarningLimit: pack ? 100_000 : 2_000,
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
