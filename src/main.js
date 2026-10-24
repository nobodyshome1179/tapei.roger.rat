import { createApp } from 'vue';
import { inject } from '@vercel/analytics';
import './styles/index.css';
import App from './App.vue';

createApp(App).mount('#app');

// Vercel Web Analytics：只在正式建置啟用；手機面板的 iframe（?phone=）是同一頁，不重複計算瀏覽
if (import.meta.env.PROD && !new URLSearchParams(location.search).has('phone')) inject({ mode: 'production' });

// app.js 直接操作 DOM、掛全域事件，熱更新會重複初始化；JS 有改動就整頁重新載入（CSS 照常熱更新）
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', ({ updates }) => {
    if (updates.some(u => u.type === 'js-update')) location.reload();
  });
}
