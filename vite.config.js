import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  // 相對路徑：dist 放在任何子目錄都能開
  base: './',
  plugins: [vue()]
});
