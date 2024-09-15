/// <reference types="vitest" />

import path from 'path';
import { defineConfig } from 'vitest/config';

const hasPostgresDatabase = process.env.DATABASE_URL?.startsWith('postgres:');

export default defineConfig({
  test: {
    environment: 'node',
    include: ['./{src,tests}/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    globalSetup: './tests/globalSetup.ts',
    minWorkers: 1,
    maxWorkers: hasPostgresDatabase ? '50%' : 1,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});
