import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

// Library build of the curated DS primitives → .design-sync/.cache/lib-dist/
// (index.js + a single CSS file). React is externalized; the converter bundles
// the rest. Run: vite build --config .design-sync/lib-build/vite.config.ts
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': resolve(here, '../../src') } },
  build: {
    lib: { entry: resolve(here, 'entry.ts'), formats: ['es'], fileName: () => 'index.js' },
    rollupOptions: { external: ['react', 'react-dom', 'react/jsx-runtime'] },
    outDir: resolve(here, '../.cache/lib-dist'),
    cssCodeSplit: false,
    emptyOutDir: true,
    minify: false,
    sourcemap: false,
  },
});
