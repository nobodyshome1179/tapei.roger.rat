/* 市民、店家地圖的槌子游標與打地鼠彩蛋 */
export function initWhack() {
  // 按住時槌子揮下（CSS 看 body.whack）
  addEventListener('pointerdown', () => document.body.classList.add('whack'));
  addEventListener('pointerup', () => document.body.classList.remove('whack'));
  addEventListener('pointercancel', () => document.body.classList.remove('whack'));
  /* 每隔一陣子跑出一隻老鼠，用槌子敲暈 */
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const STARS = '<svg class="mrat-stars" viewBox="0 0 44 44" aria-hidden="true"><g><polygon points="36.0,17.0 37.3,20.2 40.8,20.5 38.1,22.7 38.9,26.0 36.0,24.2 33.1,26.0 33.9,22.7 31.2,20.5 34.7,20.2" fill="#f6c84c" stroke="#2a2a2a" stroke-width="1.2" stroke-linejoin="round"/><polygon points="15.0,29.1 16.3,32.3 19.8,32.6 17.1,34.8 17.9,38.2 15.0,36.4 12.1,38.2 12.9,34.8 10.2,32.6 13.7,32.3" fill="#f6c84c" stroke="#2a2a2a" stroke-width="1.2" stroke-linejoin="round"/><polygon points="15.0,4.9 16.3,8.1 19.8,8.3 17.1,10.6 17.9,13.9 15.0,12.1 12.1,13.9 12.9,10.6 10.2,8.3 13.7,8.1" fill="#f6c84c" stroke="#2a2a2a" stroke-width="1.2" stroke-linejoin="round"/></g></svg>';
  // 偷拿的食物：大約六成的老鼠手上有一樣，敲到就「撿到」，次數給「我的」頁顯示
  const FOOD = {"leg": {"name": "雞腿", "svg": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M15.2 3.2c3.7.4 6 3.9 4.8 7.4-1 3-4.3 4.6-7.2 3.7l-3.3 3.3c.5.9.3 2-.5 2.6-.9.7-2.2.5-2.8-.4-.4-.5-.5-1.1-.3-1.7-.6.2-1.2.1-1.7-.3-.9-.7-1-2-.3-2.8.6-.8 1.7-1 2.6-.5l3.3-3.3c-1-3.1 1.1-8.3 5.4-8z\" fill=\"#c87a35\" stroke=\"#2a2a2a\" stroke-width=\"1.3\" stroke-linejoin=\"round\"/><path d=\"M14.2 6.2c1.6-.3 3.2.6 3.6 2.1\" fill=\"none\" stroke=\"#f3c48a\" stroke-width=\"1.4\" stroke-linecap=\"round\"/><\/svg>"}, "cheese": {"name": "起司", "svg": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M3 15.5L18.5 6.5 21 15.5z\" fill=\"#f6c84c\" stroke=\"#2a2a2a\" stroke-width=\"1.3\" stroke-linejoin=\"round\"/><path d=\"M3 15.5h18v4H3z\" fill=\"#f2b632\" stroke=\"#2a2a2a\" stroke-width=\"1.3\" stroke-linejoin=\"round\"/><circle cx=\"12\" cy=\"13\" r=\"1.3\" fill=\"#d99a1e\"/><circle cx=\"16.5\" cy=\"17.4\" r=\"1\" fill=\"#d99a1e\"/><circle cx=\"7.5\" cy=\"17.6\" r=\".9\" fill=\"#d99a1e\"/><\/svg>"}, "cake": {"name": "蛋糕", "svg": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 12.5L19.5 8v11.5H4z\" fill=\"#fff4dc\" stroke=\"#2a2a2a\" stroke-width=\"1.3\" stroke-linejoin=\"round\"/><path d=\"M4 12.5L19.5 8v3.2L4 15.6z\" fill=\"#f29bb0\" stroke=\"#2a2a2a\" stroke-width=\"1.3\" stroke-linejoin=\"round\"/><path d=\"M4 16.5h15.5\" stroke=\"#f29bb0\" stroke-width=\"1.4\"/><circle cx=\"14\" cy=\"6.3\" r=\"2\" fill=\"#e8392f\" stroke=\"#2a2a2a\" stroke-width=\"1.1\"/><\/svg>"}, "donut": {"name": "甜甜圈", "svg": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"8.5\" fill=\"#d9a35f\" stroke=\"#2a2a2a\" stroke-width=\"1.3\"/><path d=\"M4.3 10.5a7.8 7.8 0 0 1 15.4 0c.4 2-1 2.2-2 1.4-1-.8-1.8.6-3 .2-1-.4-1.6.8-2.7.4-1.1-.4-1.7.7-2.9.2-1.1-.5-1.6.6-2.8.1-1-.5-2.2.2-2-2.3z\" fill=\"#f29bb0\" stroke=\"#2a2a2a\" stroke-width=\"1.1\" stroke-linejoin=\"round\"/><circle cx=\"12\" cy=\"12\" r=\"2.6\" fill=\"#1f2a22\" stroke=\"#2a2a2a\" stroke-width=\"1.2\"/><path d=\"M8 8.5l1 .6M15 7.6l.9-.7M17 10.4l.9.4M10.5 6.6l.2-1\" stroke=\"#fff\" stroke-width=\"1.1\" stroke-linecap=\"round\"/><\/svg>"}};
  window.RAT_FOOD = FOOD;
  window.RAT_LOOT = window.RAT_LOOT || { leg: 2, cheese: 1, cake: 0, donut: 0 };
  window.RAT_HITS = window.RAT_HITS || 5; // 敲暈老鼠的總次數，要比撿到的食物多
  document.dispatchEvent(new CustomEvent('ratloot'));
  const layer = document.createElement('div');
  layer.id = 'ratLayer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const busy = () => !['citizen', 'merchant'].includes(document.body.dataset.role) || document.hidden
    || !document.getElementById('hero').classList.contains('gone') || document.querySelector('#map.picking,#tourMask.on')
    || [...document.querySelectorAll('#repModal,#doneModal,#popModal,#locModal,#rdModal')].some(m => !m.hidden);
  // 地圖上沒被面板蓋住的區域
  const zone = () => {
    const W = innerWidth, H = innerHeight;
    if (W > 860) {
      const side = document.querySelector('#side'), r = side && !side.classList.contains('min') && side.offsetParent ? side.getBoundingClientRect().left : W;
      return { x0: 400, x1: Math.min(W - 60, r - 40), y0: 140, y1: H - 140 };
    }
    return { x0: 40, x1: W - 40, y0: 170, y1: H * 0.5 };
  };
  async function spawn() {
    const z = zone();
    if (z.x1 - z.x0 < 160 || z.y1 - z.y0 < 120) return;
    const el = document.createElement('div');
    el.className = 'mrat';
    const fk = Math.random() < .6 ? Object.keys(FOOD)[Math.floor(Math.random() * 4)] : null, fd = fk && FOOD[fk];
    el.innerHTML = `<div class="mrat-b"><svg viewBox="-15 -29.3 30 29.3"><use href="#wrat2"/></svg></div>${fd ? `<span class="food">${fd.svg}</span><span class="loot">${fd.svg}撿到${fd.name}！</span>` : ''}${STARS}<span class="bonk">咚！</span>`;
    layer.appendChild(el);
    const body = el.firstElementChild;
    let hit = false, anim = null;
    el.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation();
      if (hit) return;
      hit = true;
      if (anim) anim.pause();
      el.classList.add('hit');
      window.RAT_HITS++;
      if (fk) window.RAT_LOOT[fk] = (window.RAT_LOOT[fk] || 0) + 1;
      document.dispatchEvent(new CustomEvent('ratloot'));
      setTimeout(() => el.classList.add('bye'), fk ? 1900 : 1700);
      setTimeout(() => el.remove(), fk ? 2400 : 2200);
    });
    // 亂竄：在可用區域裡隨機跑 3–4 段，每段換方向
    let x = rnd(z.x0, z.x1), y = rnd(z.y0, z.y1);
    const n = 3 + (Math.random() < .5 ? 1 : 0);
    for (let i = 0; i < n && !hit; i++) {
      const nx = Math.max(z.x0, Math.min(z.x1, x + rnd(-260, 260))), ny = Math.max(z.y0, Math.min(z.y1, y + rnd(-140, 140)));
      body.classList.toggle('flip', nx > x); // 原圖面朝左
      const d = Math.hypot(nx - x, ny - y) / 0.32 + 120, first = i === 0, last = i === n - 1;
      anim = el.animate([
        { transform: `translate(${x}px,${y}px)`, opacity: first ? 0 : 1 },
        { transform: `translate(${x + (nx - x) * .15}px,${y + (ny - y) * .15}px)`, opacity: 1, offset: .15 },
        { transform: `translate(${x + (nx - x) * .85}px,${y + (ny - y) * .85}px)`, opacity: 1, offset: .85 },
        { transform: `translate(${nx}px,${ny}px)`, opacity: last ? 0 : 1 }
      ], { duration: d, fill: 'forwards' });
      try { await anim.finished; } catch (e) { return; }
      if (hit) return;
      await new Promise(r => setTimeout(r, rnd(80, 380)));
      x = nx; y = ny;
    }
    if (!hit) el.remove();
  }
  let next = 0;
  setInterval(() => {
    // 切到市府或打開彈窗時，還在跑的老鼠直接收掉
    if (busy()) { next = 0; layer.querySelectorAll('.mrat:not(.hit)').forEach(m => m.remove()); return; }
    const now = Date.now();
    if (!next) next = now + 2500;
    if (now < next || layer.querySelectorAll('.mrat:not(.hit)').length >= 2) return;
    next = now + rnd(6000, 11000);
    spawn();
  }, 500);
}
