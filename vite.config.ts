import { defineConfig } from 'vite';
import { resolve } from 'path';
import preact from '@preact/preset-vite';

import packageJson from './package.json';

export default defineConfig(({ mode }) => {
  const isContent = process.env.BUILD_TARGET === 'content';

  return {
    plugins: [preact()],
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
      // 如果是 content script 构建，不要清空目录（因为是第二步）
      // 注意：在 dev 模式下并发构建时，可能会有竞态条件，建议依赖外部 script (npm run clean) 来清空
      emptyOutDir: !isContent && mode !== 'development',
      rollupOptions: {
        input: (isContent ? {
          content: resolve(__dirname, 'src/main/chrome/content.ts'),
        } : {
          background: resolve(__dirname, 'src/main/chrome/background.ts'),
          popup: resolve(__dirname, 'src/main/chrome/popup.html')
        }) as Record<string, string>,
        output: {
          entryFileNames: '[name].js',
          // Content Script 用 IIFE，其他用 ES
          format: isContent ? 'iife' : 'es',
          inlineDynamicImports: isContent,
          // IIFE 需要 name，但 content script 主要是副作用
          name: isContent ? 'LinkTransContent' : undefined
        }
      }
    }
  };
});
