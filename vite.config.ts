import { defineConfig } from 'vite';
import { resolve } from 'path';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/main/chrome/content.ts'),
        background: resolve(__dirname, 'src/main/chrome/background.ts')
      },
      output: {
        entryFileNames: '[name].js',
        format: 'es'
      }
    }
  }
});
