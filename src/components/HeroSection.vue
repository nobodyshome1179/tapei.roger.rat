<script setup>
import HeroIllustration from './HeroIllustration.vue';
</script>

<!-- 開場：選身份進入地圖。週次與三個數字由 app.js 的 heroStats() 填入 -->
<template>
  <section id="hero" aria-label="開場">
    <div class="heroisl"><HeroIllustration /></div>
    <div class="radar" hidden><svg id="radar" viewBox="0 0 400 400" aria-hidden="true"></svg></div>
    <div class="hero-txt">
      <div class="kicker" id="heroWeek">第 19 週</div>
      <h1>有鼠請回答</h1>
      <div class="hstats">
        <div><b id="h-rep">0</b><span>本週分級的通報</span><em>模擬</em></div>
        <div><b id="h-area">0</b><span>要派案的區塊</span><em>模擬</em></div>
        <div><b id="h-l1">0</b><span>其中 1 級爆發</span><em>模擬</em></div>
      </div>
      <p>城市有鼠患，先<strong>檢傷</strong>，再<strong>開處方。</strong><br><strong>市府、店家、市民</strong>，各自做對的事。</p>
      <div class="pick" role="group" aria-label="選擇身份">
        <button type="button" data-enter="citizen"><b>我是市民</b><span>查看附近風險、接協助任務，也能直接通報</span></button>
        <button type="button" data-enter="merchant"><b>我是店家</b><span>照著城市處方箋改善，複核後取得防鼠標章</span></button>
        <button type="button" data-enter="gov" class="main"><b>我是市府</b><span>整合全市資料檢傷排序，調度各局處處理源頭</span></button>
      </div>
    </div>
    <div class="hero-foot">行政區界：內政部國土測繪中心（真實）｜通報、雨量與蛇類目擊：北市鼠情週報的模擬資料，不代表實際鼠情</div>
  </section>
</template>
