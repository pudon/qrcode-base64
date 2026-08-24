import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

// 将 qrcode-base64 指向本地构建产物，模拟 npm 安装后的真实用法
export default defineConfig({
  // 相对路径：GitHub Pages 部署在 /qrcode-base64/ 子路径下，绝对路径会 404。
  // 用 './' 而非写死仓库名，本地 preview 与 Pages 都能直接用。
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      'qrcode-base64': fileURLToPath(
        new URL('../../dist/qrcode-base64.esm.mjs', import.meta.url)
      )
    }
  },
  server: {
    open: true
  }
});
