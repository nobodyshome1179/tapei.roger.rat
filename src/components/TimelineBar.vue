<!-- 週次時間軸（市府）：直方圖、事件與刻度由 app.js 的 initTimeline()／renderTimeline() 畫 -->
<template>
  <section class="card" id="timeline" aria-label="週次">
    <button type="button" id="play" aria-label="播放每週變化"></button>
    <div class="track">
      <div id="hist" aria-hidden="true"></div>
      <div id="evts" aria-hidden="true"></div>
      <input type="range" id="range" min="1" max="41" step="1" value="19" aria-label="選擇週次">
      <div class="ticks" id="ticks" aria-hidden="true"></div>
    </div>
  </section>
</template>
