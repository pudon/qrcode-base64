import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

// 将 qrcode-base64 指向本地构建产物，模拟 npm 安装后的真实用法
export default defineConfig({
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
