import { defineConfig } from 'vite';

// 微信小程序环境：无 process/window 依赖，CommonJS require 兼容
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'QRCode',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        switch (format) {
          case 'es':
            return 'qrcode-base64.esm.mjs';
          case 'cjs':
            return 'qrcode-base64.cjs';
          default:
            return 'qrcode-base64.umd.js';
        }
      }
    },
    // 小程序基础库保守目标
    target: 'es2015',
    minify: 'oxc',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // 具名与默认导出同时保留：import { drawImg } / import qrcode / require()
        exports: 'named',
        minify: { compress: true, mangle: true, codegen: true }
      }
    }
  }
});
