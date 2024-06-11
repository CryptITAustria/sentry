import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.tsx'],
    globals: true,
    environment: 'jsdom',
  },
});