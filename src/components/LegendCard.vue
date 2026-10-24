<!-- 圖例與篩選：內容依身份與檢視由 app.js 的 legend() 填入 -->
<template>
  <section class="card" id="legend" aria-label="圖例與篩選"><button type="button" id="lgToggle" aria-expanded="false" aria-controls="lgPanel"><span class="lgic" aria-hidden="true">≡</span><span>圖例・篩選</span><span class="lgn" id="lgCount"></span><span class="chev" aria-hidden="true">▲</span></button><div id="lgPanel"><h5 id="lgTitle">圖例</h5><div id="lgBody"></div></div></section>
</template>
