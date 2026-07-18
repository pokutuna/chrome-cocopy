import {defineConfig} from 'vitest/config';

// Separate from vite.config.ts because that config's `root` is `src/`
// (the build's MPA root), while tests also live under `gallery/`.
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'gallery/**/*.test.{ts,tsx}'],
    clearMocks: true,
  },
});
