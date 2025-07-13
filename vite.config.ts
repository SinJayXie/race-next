import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    minify: true,
    lib: {
      entry: './lib/race.ts',
      name: 'Race',
      fileName: 'race'
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'lib')
    }
  }
});

