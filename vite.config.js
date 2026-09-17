import { defineConfig } from 'vite';

export default defineConfig({
  // Relatieve paden: de site werkt zowel lokaal als op GitHub Pages (/gitaarbouw/).
  base: './',
  server: { host: '127.0.0.1', port: 5173, open: false },
  preview: { host: '127.0.0.1', port: 4173 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['src/geometry/**', 'src/state/**', 'src/textures/**', 'src/guitar/layout.js', 'src/ui/specs.js', 'src/data/**'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
