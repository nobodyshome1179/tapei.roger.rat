<!-- 彈窗外框；開關與內容由 app.js 控制（hidden 屬性） -->
<template>
  <!-- 市民通報老鼠 -->
  <div id="repModal" role="dialog" aria-modal="true" aria-labelledby="repTitle" hidden>
    <div class="mbox"><div class="mhd"><h2 id="repTitle">通報老鼠</h2><button type="button" class="x" id="repClose" aria-label="關閉通報視窗">×</button></div>
    <div class="mpane" id="c-report"></div></div>
  </div>
  <!-- 通報處理結果 -->
  <div id="doneModal" role="dialog" aria-modal="true" aria-labelledby="doneTitle" hidden>
    <div class="mbox"><div class="mhd"><h2 id="doneTitle">通報處理結果</h2><button type="button" class="x" id="doneClose" aria-label="關閉">×</button></div>
    <div class="mpane" id="doneBody"></div></div>
  </div>
  <!-- 點地圖上的區塊、點位後的資訊 -->
  <div id="popModal" role="dialog" aria-modal="true" aria-label="地圖資訊" hidden>
    <div class="mbox"><div class="mhd"><button type="button" class="x" id="popClose" aria-label="關閉">×</button></div>
    <div class="mpane" id="popBody"></div></div>
  </div>
  <!-- 點數兌換 -->
  <div id="rdModal" role="dialog" aria-modal="true" aria-labelledby="rdTitle" hidden>
    <div class="mbox"><div class="mhd"><button type="button" class="rdback" id="rdBack" aria-label="上一步">‹</button><h2 id="rdTitle">點數兌換</h2><span class="rdbal" id="rdBal"></span><button type="button" id="rdClose" aria-label="關閉兌換視窗">×</button></div>
    <ol class="rdsteps" id="rdSteps" aria-label="兌換步驟"></ol>
    <div id="rdBody"></div><div id="rdFoot"></div></div>
  </div>
  <!-- 換位置 -->
  <div id="locModal" role="dialog" aria-modal="true" aria-labelledby="locTitle" hidden>
    <div class="mbox"><div class="mhd"><button type="button" id="locBack" aria-label="回到行政區列表" hidden>‹</button><h2 id="locTitle">你在哪裡？</h2><button type="button" id="locClose" aria-label="關閉">×</button></div>
    <div id="locBody"></div></div>
  </div>
</template>
