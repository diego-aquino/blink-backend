import { defineConfig } from 'tsup';

export default defineConfig({
  bundle: true,
  splitting: true,
  sourcemap: true,
  treeshake: true,
  minify: process.env.NODE_ENV === 'production',
  clean: true,
  platform: 'node',
  format: ['cjs'],
  dts: false,
  entry: {
    index: 'src/index.ts',
  },
});
