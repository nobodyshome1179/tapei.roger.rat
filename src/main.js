import { createApp } from 'vue';
import './styles/index.css';
import App from './App.vue';

createApp(App).mount('#app');

// app.js 直接操作 DOM、掛全域事件，熱更新會重複初始化；JS 有改動就整頁重新載入（CSS 照常熱更新）
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', ({ updates }) => {
    if (updates.some(u => u.type === 'js-update')) location.reload();
  });
}
