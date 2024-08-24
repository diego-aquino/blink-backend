/// <reference types="vitest" />

import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['./{src,tests}/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    minWorkers: 1,
    maxWorkers: '50%',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});
