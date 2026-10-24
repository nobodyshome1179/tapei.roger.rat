<script setup>
import { onMounted } from 'vue';
import HeroSection from './components/HeroSection.vue';
import SvgDefs from './components/SvgDefs.vue';
import TopBar from './components/TopBar.vue';
import LegendCard from './components/LegendCard.vue';
import SidePanel from './components/SidePanel.vue';
import TimelineBar from './components/TimelineBar.vue';
import AppDialogs from './components/AppDialogs.vue';
import { initApp } from './app/app.js';
import { initWhack } from './app/whack.js';
import { initSlides } from './app/slides.js';

// 元件只負責畫面骨架；內容、地圖與互動由 app.js 依 id 找到元素後產生，所以掛載完才啟動。
// 啟動順序和原本 demo_rat.html 的 <script> 相同。
onMounted(() => {
  initApp();
  initWhack();
  initSlides();
});
</script>

<template>
  <HeroSection />
  <SvgDefs />
  <div id="map" role="application" aria-label="北市鼠情檢傷地圖"></div>
  <TopBar />
  <nav id="navmenu" aria-label="面板選單" hidden></nav>
  <section class="card" id="status" aria-label="摘要"></section>
  <LegendCard />
  <SidePanel />
  <TimelineBar />
  <div id="clock" aria-hidden="true"></div>
  <AppDialogs />
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
</template>
