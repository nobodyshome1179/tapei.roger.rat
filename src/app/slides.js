import slideHome from '../assets/slides/home.webp';
import slideGov from '../assets/slides/gov.webp';

/* 講者用說明圖：首頁與市府地圖角落的起司 */
export function initSlides() {
  const CHEESE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15.5L18.5 6.5 21 15.5z" fill="#f6c84c" stroke="#2a2a2a" stroke-width="1.3" stroke-linejoin="round"/><path d="M3 15.5h18v4H3z" fill="#f2b632" stroke="#2a2a2a" stroke-width="1.3" stroke-linejoin="round"/><circle cx="12" cy="13" r="1.3" fill="#d99a1e"/><circle cx="16.5" cy="17.4" r="1" fill="#d99a1e"/><circle cx="7.5" cy="17.6" r=".9" fill="#d99a1e"/></svg>';
  const BUILTIN = {
    home: { src: slideHome, alt: '有鼠？有解！政府環境資料、民眾通報與店家資訊匯入檢傷分流，依五級風險分派給市府派案、店家改善與民眾協作，改善後回到現場驗證，再回饋下一輪檢傷。' },
    gov: { src: slideGov, alt: '通報不是終點，改善才是答案。資料與通報、檢傷分級、處方箋與任務、執行與回報、現場監測驗證、回饋下一輪分析，治理一輪比一輪更準。' }
  };
  const logo = () => (document.querySelector('.brand .logo') || {}).src || '';
  const lv = ['#d9502f', '#e8b33a', '#2f66b3', '#4a9a4a', '#fff'];
  const ico = {
    gov: '<svg viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" stroke-width="1.8" stroke-linejoin="round"><path d="M3 9.5L12 4l9 5.5z" fill="#2f66b3"/><path d="M5.5 10.5v7M9.8 10.5v7M14.2 10.5v7M18.5 10.5v7" stroke="#2f66b3" stroke-width="2.2"/><path d="M3.5 19.5h17"/></svg>',
    ppl: '<svg viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" stroke-width="1.8" stroke-linejoin="round"><rect x="6.5" y="2.5" width="11" height="19" rx="2.5" fill="#4a9a4a"/><rect x="8.5" y="5.5" width="7" height="11" rx="1" fill="#fff" stroke="none"/><path d="M12 7.5v4.5" stroke="#d9502f" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="14.3" r="1.1" fill="#d9502f" stroke="none"/></svg>',
    shop: '<svg viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" stroke-width="1.8" stroke-linejoin="round"><path d="M3.5 9.5L5.5 4h13l2 5.5z" fill="#f0a03a"/><path d="M5 9.5V20h14V9.5" fill="#fff"/><path d="M10 20v-5.5h4V20" fill="#f0a03a"/></svg>'
  };
  // 縮圖 3：檢傷分流（資料 → 檢傷 → 三種處置）
  const triage = () => {
    const ins = [[118, '#dbeaf6', 'gov', '政府環境資料', ['下水道', '垃圾清運', '餐飲密集度']], [290, '#e4f1dc', 'ppl', '民眾通報', ['目擊老鼠', '現場狀況']], [462, '#fbe9dc', 'shop', '店家資訊', ['垃圾管理', '環境與改善狀況']]];
    const outs = [[145, '#2f7fb8', '市府派案', '專業查核・跨局處處理'], [298, '#f0a03a', '店家改善', '城市處方箋・改善任務'], [451, '#4a9a4a', '民眾協作', '安全觀察・協作任務']];
    const arrow = y => `<path d="M796 360 C 860 360, 852 ${y}, 912 ${y}" fill="none" stroke="#2a2a2a" stroke-width="3.2"/><path d="M900 ${y - 11} L914 ${y} L900 ${y + 11}" fill="none" stroke="#2a2a2a" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`;
    return `<div class="sl"><svg class="lines" viewBox="0 0 1280 720">${ins.map(([y]) => `<path d="M384 ${y + 70} C 440 ${y + 70}, 436 360, 484 360" fill="none" stroke="#2a2a2a" stroke-width="2.8" stroke-dasharray="5 7" stroke-linecap="round"/>`).join('')}${outs.map(([y]) => arrow(y + 48)).join('')}</svg>
      ${ins.map(([y, bg, k, h, cs]) => `<div class="bx in" style="left:70px;top:${y}px;width:312px;height:140px;background:${bg}"><span class="ico">${ico[k]}</span><div><h3>${h}</h3><div class="chips">${cs.map(c => `<span>${c}</span>`).join('')}</div></div></div>`).join('')}
      <div class="bx core" style="left:486px;top:250px;width:308px;height:220px"><h2>檢傷分流</h2><p>判斷風險・問題類型</p><div class="lvs">${lv.map((c, i) => `<b style="background:${c};color:${i === 4 ? '#2a2a2a' : '#fff'}">${i + 1}</b>`).join('')}</div></div>
      <img class="mascot" src="${logo()}" alt="" style="left:592px;top:196px">
      ${outs.map(([y, c, h, p]) => `<div class="bx out" style="left:926px;top:${y}px;width:268px;height:98px;--c:${c}"><h3>${h}</h3><p>${p}</p></div>`).join('')}</div>`;
  };
  // 縮圖 5：治理循環（任務完成，不等於問題解決）
  const loop = () => {
    const cx = 642, cy = 324, rx = 268, ry = 134;
    const N = [['資料與通報', '環境資料、民眾通報、店家狀況'], ['檢傷分級', '判斷風險、問題類型與級別'], ['處方箋與任務', '派給局處、店家與社區'], ['執行與回報', '改善完成，拍照回報'], ['現場監測驗證', '鼠跡、足跡板、捕獲率'], ['回饋下一輪分析', '確認有效的做法，調整策略']];
    const pos = [[cx, cy - ry], [cx + 236, cy - 64], [cx + 236, cy + 64], [cx, cy + ry], [cx - 236, cy + 64], [cx - 236, cy - 64]];
    return `<div class="sl"><div class="frame"></div><div class="kick">治理循環</div><h2 class="ttl">任務完成，不等於問題解決</h2>
      <svg class="lines" viewBox="0 0 1280 720"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#3d7a35" stroke-width="2.6" stroke-dasharray="9 8"/></svg>
      ${N.map(([b, s], i) => `<div class="node" style="left:${pos[i][0]}px;top:${pos[i][1]}px"><i>${i + 1}</i><b>${b}</b><small>${s}</small></div>`).join('')}
      <div class="hub"><img src="${logo()}" alt=""><b>有鼠請回答</b><small>每一輪都更準一點</small></div>
      <div class="tag">通報不是終點，<em>改善才是答案</em>。</div></div>`;
  };
  let back = null;
  function build() {
    let m = document.getElementById('slMask');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'slMask';
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.innerHTML = '<div id="slBox"><button type="button" id="slClose" aria-label="關閉說明圖"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button><div id="slBody"></div></div>';
    document.body.appendChild(m);
    m.addEventListener('click', e => { const t = e.target.closest('[data-sl]'); if (t) return turn(+t.dataset.sl); if (e.target === m || e.target.closest('#slClose')) close(); });
    return m;
  }
  function fit() {
    const m = document.getElementById('slMask');
    if (m) m.style.setProperty('--ss', Math.min((innerWidth - 48) / 1280, (innerHeight - 120) / 720).toFixed(3));
  }
  /* 內建說明圖，沒有時用重畫版 */
  const urls = [];
  let pics = [], page = 0, cur = null;
  function show() {
    const box = document.getElementById('slBox'), body = document.getElementById('slBody');
    box.classList.toggle('img', pics.length > 0);
    if (!pics.length) { body.innerHTML = cur.which === 'loop' ? loop() : triage(); fit(); return; }
    body.innerHTML = `<img class="slimg" src="${pics[page]}" alt="${pics.alt || '說明圖 ' + (page + 1)}">` + (pics.length > 1
      ? `<div class="slnav"><button type="button" data-sl="-1" ${page ? '' : 'disabled'} aria-label="上一張">‹</button>${page + 1}／${pics.length}<button type="button" data-sl="1" ${page < pics.length - 1 ? '' : 'disabled'} aria-label="下一張">›</button></div>` : '');
  }
  const turn = d => { if (pics.length > 1) { page = Math.max(0, Math.min(pics.length - 1, page + d)); show(); } };
  async function load() {
    urls.splice(0).forEach(u => URL.revokeObjectURL(u));
    const bi = BUILTIN[cur.key];
    // 內建動態圖每次打開都換一個新網址，動畫才會從第一格開始播
    if (bi) { let u = bi.src; try { u = URL.createObjectURL(await (await fetch(bi.src)).blob()); urls.push(u); } catch (e) {} pics = [u]; pics.alt = bi.alt; }
    else pics = [];
    page = 0;
    show();
  }
  async function open(which, label) {
    back = document.activeElement;
    const m = build();
    m.setAttribute('aria-label', label);
    cur = { which, key: which === 'loop' ? 'gov' : 'home' };
    await load();
    fit();
    m.classList.add('on');
    document.getElementById('slClose').focus({ preventScroll: true });
  }
  function close() {
    const m = document.getElementById('slMask');
    if (!m || !m.classList.contains('on')) return;
    m.classList.remove('on');
    if (back && back.focus) back.focus({ preventScroll: true });
  }
  addEventListener('resize', fit);
  addEventListener('keydown', e => {
    if (!document.querySelector('#slMask.on')) return;
    if (e.key === 'Escape') { e.stopImmediatePropagation(); close(); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.stopImmediatePropagation(); e.preventDefault(); turn(e.key === 'ArrowRight' ? 1 : -1); }
  }, true);
  const btn = (id, which, label) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'cheesebtn'; if (id) b.id = id;
    b.title = label; b.setAttribute('aria-label', '說明圖：' + label);
    b.innerHTML = CHEESE;
    b.addEventListener('click', e => { e.stopPropagation(); open(which, label); });
    return b;
  };
  const hero = document.getElementById('hero');
  if (hero) hero.appendChild(btn('', 'triage', '檢傷分流'));
  document.body.appendChild(btn('cheeseGov', 'loop', '通報不是終點'));
}
