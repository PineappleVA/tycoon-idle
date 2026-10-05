import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Config independiente de vite.config.ts: el plugin singlefile no tiene
// sentido en Node y sólo estorbaría a los tests.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // La lógica de juego es pura: no necesita DOM ni jsdom.
    globals: false,
    reporters: ['default'],
  },
});
