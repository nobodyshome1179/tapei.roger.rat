<!-- 頂列：身份切換、地圖檢視（app.js 產生按鈕）、頁首連結。「手機」「LINE 通知」按鈕由 app.js 插到 .toplinks 最前面 -->
<template>
  <header class="topbar">
    <div class="brand"><img class="logo" src="../assets/logo.png" alt="" width="40" height="33">有鼠請回答<span class="simtag" id="simtag">模擬資料</span></div>
    <div class="roles" id="roles" role="group" aria-label="切換身份"><button type="button" data-role="citizen" aria-pressed="false">市民</button><button type="button" data-role="merchant" aria-pressed="false">店家</button><button type="button" data-role="gov" aria-pressed="true">市府</button></div>
    <nav class="views" id="views" aria-label="地圖檢視"></nav>
    <div class="toplinks"><button type="button" id="btnRules">分級規則</button><button type="button" id="btnHero">回首頁</button><button type="button" id="btnHome" aria-label="回首頁"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 10.5 12 3.5l8.5 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 9v10.5h4.5v-6h3v6H18V9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button type="button" id="burger" aria-label="開啟選單" aria-expanded="false" aria-controls="navmenu"><svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true"><path d="M1 1h16M1 7h16M1 13h16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button></div>
  </header>
</template>
