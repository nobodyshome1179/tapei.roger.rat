import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  // 相對路徑：dist 放在任何子目錄都能開
  base: './',
  plugins: [vue()],
  build: {
    // 壓縮會拿掉套件的版權聲明，另外輸出授權清單（Leaflet 的 BSD-2 與 Vue 的 MIT 都要求保留）
    license: { fileName: 'third-party-licenses.md' }
  }
});
