<script setup>
// 市府（p-）、市民（c-）、店家（m-）各自的分頁；分頁按鈕與內容由 app.js 依身份產生
const PANES = ['p-queue', 'p-over', 'p-bait', 'p-try', 'p-rules', 'p-data', 'c-tasks', 'c-me', 'm-shop', 'm-alert', 'm-rank'];
</script>

<template>
  <section class="card" id="side" aria-label="面板">
    <div class="tabs" role="tablist" id="tabs" aria-label="面板分頁"></div>
    <div v-for="id in PANES" :key="id" class="pane" :id="id" role="tabpanel" :aria-labelledby="'t-' + id"></div>
  </section>
</template>
