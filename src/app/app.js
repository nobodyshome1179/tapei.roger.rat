/* ============================================================
   主程式：地圖、三種身份的面板、彈窗與互動。
   原本是 demo_rat.html 裡的 (() => { ... })()，內容原樣搬來；
   畫面骨架由 Vue 元件提供，這裡依 id 找到元素後直接填內容、掛事件，
   所以要等 App.vue 掛載完才呼叫 initApp()。
   ============================================================ */
import L from 'leaflet';
import OD from '../lib/od.js';
import { makeDataKit } from '../lib/dataKit.js';
import { makeModel } from '../lib/model.js';
import RAT_ICON from '../assets/rat-icon.png';
import {
  ADVICE, RESIDENT, EVENTS, STOP_WHY, TREND, SNAKE, TAG_ACT, TASK, TIER, TSTAT, DISP, VIEWS, SRC_ZH, ROLES,
  LEVELS, BADGES, BADGE_ART, STIERS
} from './terms.js';
import {
  AVATAR_SVG, STORE_SVG, GIFT_SVG, rdIcon, RD_ITEMS, RD_LOCS, RD_STOCK, RD_FILTERS, LOC_DATA
} from './catalog.js';

/* LINE 官方帳號示意頁：?demo＝首頁的市民導覽，?phone＝手機面板裡的 LINE 分頁 */
const LINE_OA = import.meta.env.BASE_URL + 'line-oa.html';

export function initApp() {
const DK = makeDataKit(OD);
const CVS_OPT = { cvs: true };
let CUR_BUNDLE = null, CVL = null;
let M = makeModel(OD, null, CVS_OPT);
const { nl, il, al, ol, Us, qs, ec, nc, Js, Xs, Cl, Tl, uc, fc, mc, vc, Is, Td, Ed, Dd, Od, xd, Cd } = OD;
const NW = M.NW, LV = M.LV, TAG_ZH = M.TAG_ZH;

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const DARK = matchMedia('(prefers-color-scheme: dark)');
const wide = () => innerWidth > 860;
const dist = (a, b) => Math.hypot((a[1] - b[1]) * 100900, (a[0] - b[0]) * 110900);
const word = s => (s >= 85 ? '很高' : s >= 65 ? '偏高' : s >= 40 ? '普通' : '低');

const SQUADS = Ed();
/* 鼠患檢傷站的寧夏・雙連示範店家（模擬），補足週報店家在店家視角的周邊 */
const LEVEL_SHOPS = [['老李肉圓', 25.0569, 121.5152, 1], ['寧夏豆花', 25.0559, 121.5153, 2], ['雙連麵線', 25.0583, 121.5214, 1], ['民生甜湯', 25.0575, 121.5205, 2],
  ['阿娥粥品', 25.0551, 121.5154, 1], ['圓環烤物', 25.0537, 121.515, 3], ['建成飲料', 25.0546, 121.5179, 1]];
let SHOPS = [];
function deriveShops() {
  const base = Dd(M.POIS).concat(LEVEL_SHOPS.map(([name, lat, lon, tier]) => ({ id: 'lv-' + name, name, ll: [lat, lon], district: -1, tier })));
  SHOPS = base.map(s => {
    const h = Cd(s.name), pass = Math.round(80 + Cd(s.name + '合格') * 20), act = Math.floor(Cd(s.name + '通報') * 7), days = Math.round(40 + Cd(s.name + '天數') * 400);
    return Object.assign({}, s, { tier: s.tier || (h < 0.45 ? 1 : h < 0.8 ? 2 : 3), pass, act, days, score: Math.round(pass * 0.7 + (Math.min(act, 8) / 8) * 10 + (Math.min(days, 365) / 365) * 20) });
  });
  SHOPS.filter(s => s.tier === 3).sort((a, b) => b.score - a.score).forEach((s, i) => (s.rank = i + 1));
}

const S = {
  role: 'gov', week: 19, view: 'triage', tab: { gov: 'p-queue', citizen: 'c-tasks', merchant: 'm-shop' }, filter: 0, sel: null, done: new Set(),
  draft: '南機場夜市旁的水溝蓋縫，晚上一直有老鼠鑽進鑽出', loc: [25.0322, 121.5068], picking: null, timer: null,
  me: { ll: [25.0572, 121.5195], label: '雙連捷運站周邊' },
  report: { text: '', ll: null }, mine: [],
  card: { no: '108432', nick: '雙連小幫手', points: 120, spent: 158, streak: 8, checkins: 26, gems: 7, hours: 31, tickets: [], done: { clean: 6, garbage: 9, signs: 3, trap: 3, shop: 1, obs: 2 }, joined: new Set(), finished: new Set(),
    log: ['10/20・垃圾代收・雙連市場周邊一帶', '10/19・觀察餌盒 雙連-03・餌塊完整', '10/19・環境清潔・寧夏夜市一帶', '10/18・捕鼠籠巡查・雙連市場周邊一帶', '10/17・鼠跡確認・雙連市場周邊一帶', '10/16・店家三不輔導・寧夏夜市一帶', '10/15・觀察捕鼠籠 雙連-01・誘餌被吃', '10/14・垃圾代收・台北車站館前路一帶'] },
  shop: { name: '阿月滷肉飯', area: '寧夏夜市', no: 'TPE-DT-0418', ll: [25.0563, 121.5154], tier: 0, days: 62, fixed: false, recheck: false, subsidy: false, alerts: [] },
  data: { files: [] },
  ov: { scope: 'all', f: null, band: null, sort: 'recent' },
  obsOpen: null, taskReviews: {}, taskReviewsSeeded: false
};
const wk = () => (S.role === 'gov' ? S.week : NW);

/* ---------- 色票：讀 CSS 變數，跟著深淺色切換 ---------- */
const P = {};
const PK = ['l1', 'l2', 'l3', 'l4', 'l5', 'l0', 'edge', 'paper', 'ink', 'mask', 'grey', 'blue', 'hot99', 'hot95', 'hot90', 'tr-new', 'tr-persist', 'tr-inter', 'tr-fade',
  'sn-cross', 'sn-poison', 'sn-hidden', 'sn-habitat', 'snake', 'p1999', 'pradar', 'risk-src', 'risk-spread', 'gap', 'over', 'squad', 'shop',
  't-clean', 't-garbage', 't-signs', 't-trap', 't-shop', 'bait-hi', 'bait-mid', 'bait-lo'];
function readPal() {
  const st = getComputedStyle(document.documentElement);
  PK.forEach(k => (P[k] = st.getPropertyValue('--' + k).trim()));
  P.maskO = parseFloat(st.getPropertyValue('--mask-o')) || 0.6;
}

/* ---------- 插畫圖示 ---------- */
const ICON_FOOD = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3.5 11.5h17a8.5 7.5 0 0 1-17 0z" style="fill:var(--orange);stroke:var(--edge)" stroke-width="1.5" stroke-linejoin="round"/><path d="M8.6 8.6c0-1.6 1.3-1.6 1.3-3.2M13.2 8.6c0-1.6 1.3-1.6 1.3-3.2" style="stroke:var(--edge)" fill="none" stroke-width="1.4" stroke-linecap="round"/></svg>';
const ICON_TREE = '<svg viewBox="-11 -12 22 28" width="17" height="22" aria-hidden="true"><rect x="-1.2" y="8" width="2.4" height="7" style="fill:#b8865a;stroke:var(--edge)" stroke-width="1.2"/><path d="M0-10C7-10 9 4 0 9-9 4-7-10 0-10z" style="fill:var(--leaf);stroke:var(--edge)" stroke-width="1.3"/></svg>';
const ICON_CVS = '<svg viewBox="0 0 22 20" width="20" height="18" aria-hidden="true"><path d="M3.5 8.5h15v9.5h-15z" style="fill:var(--paper);stroke:var(--edge)" stroke-width="1.4"/><path d="M2 4h18l-1.2 4.5H3.2z" style="fill:var(--blue-l);stroke:var(--edge)" stroke-width="1.4" stroke-linejoin="round"/><path d="M8.5 18v-5h5v5" fill="none" style="stroke:var(--edge)" stroke-width="1.2"/></svg>';
const PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>';
/* 餌站圖示：上鎖餌盒（有鎖孔）與捕鼠籠（有欄杆），顏色是最近一次觀察的狀態 */
const KIND = { bait: '上鎖毒餌盒', monitor: '無毒監測餌盒', trap: '捕鼠籠' };
const stnColor = st => ({ ok: P.paper, none: P.paper, part: P.l2, eaten: P.l2, gnaw: P.l2, all: P.hot95, caught: P['sn-poison'], dead: P.ink, exposed: P.l1, nontarget: P.l1, moved: P.grey }[st] || P.paper);
const stnSvg = (kind, c, w = 22) => (kind === 'monitor'
  ? `<svg viewBox="0 0 22 18" width="${w}" height="${(w * 18) / 22}" aria-hidden="true"><rect x="1.5" y="3.5" width="19" height="12" rx="6" style="fill:${c};stroke:var(--edge)" stroke-width="1.5"/><rect x="8" y="7.2" width="6" height="4.6" rx="1.2" style="fill:var(--paper);stroke:var(--edge)" stroke-width="1.2"/></svg>`
  : kind === 'bait'
  ? `<svg viewBox="0 0 22 18" width="${w}" height="${(w * 18) / 22}" aria-hidden="true"><rect x="1.5" y="3.5" width="19" height="12" rx="3.5" style="fill:${c};stroke:var(--edge)" stroke-width="1.5"/><circle cx="11" cy="9.5" r="1.8" style="fill:var(--edge)"/></svg>`
  : `<svg viewBox="0 0 22 18" width="${w}" height="${(w * 18) / 22}" aria-hidden="true"><rect x="1.5" y="2.5" width="19" height="13" rx="1.5" style="fill:${c};stroke:var(--edge)" stroke-width="1.5"/><path d="M7 3v12M11 3v12M15 3v12" style="stroke:var(--edge)" stroke-width="1.1"/></svg>`);
const stnIcon = x => L.divIcon({ className: '', iconSize: [22, 18], iconAnchor: [11, 9], html: `<div class="stn${x.overdue ? ' late' : ''}${x.cur && x.cur.mine ? ' mine' : ''}">${stnSvg(x.s.kind, x.last ? stnColor(x.last.st) : P.paper)}</div>` });
const PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';

/* ---------- 地圖 ---------- */
const map = L.map('map', { zoomControl: false, preferCanvas: true, minZoom: 10, maxZoom: 19 });
L.control.zoom({ position: 'bottomright' }).addTo(map);
map.attributionControl.setPosition('bottomright');
L.tileLayer('https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}', {
  maxNativeZoom: 18, maxZoom: 19,
  attribution: '&copy; <a href="https://maps.nlsc.gov.tw/" target="_blank" rel="noopener">內政部國土測繪中心</a>（底圖、行政區界）'
}).addTo(map);
for (const [n, z] of [['boundary', 450], ['labels', 460]]) { const p = map.createPane(n); p.style.zIndex = z; p.style.pointerEvents = 'none'; }
const CV = L.canvas({ padding: 0.4 }), SVGR = L.svg({ padding: 0.4 });
const HX = L.layerGroup().addTo(map), PT = L.layerGroup().addTo(map), MK = L.layerGroup().addTo(map), LB = L.layerGroup().addTo(map), SEL = L.layerGroup().addTo(map), ME = L.layerGroup().addTo(map);
const flip = ring => ring.map(([x, y]) => [y, x]);
const CORE = L.latLngBounds([[24.995, 121.497], [25.1, 121.598]]);
const poly = (i, o) => L.polygon(M.GRID.hexes[i].verts, Object.assign({ renderer: CV }, o));

let BND = null;
function drawBoundary() {
  if (BND) map.removeLayer(BND);
  const r = L.svg({ pane: 'boundary', padding: 0.5 }), g = L.layerGroup();
  L.polygon([[[24.5, 120.9], [24.5, 122.3], [25.7, 122.3], [25.7, 120.9]], ...mc.map(p => flip(p[0]))],
    { renderer: r, pane: 'boundary', stroke: false, fillColor: P.mask, fillOpacity: P.maskO, interactive: false }).addTo(g);
  for (const d of fc) {
    for (const p of d.polygons) L.polygon(p.map(flip), { renderer: r, pane: 'boundary', color: P.edge, weight: 1, opacity: 0.38, dashArray: '4 5', fill: false, interactive: false }).addTo(g);
    L.marker(vc(d), { pane: 'labels', interactive: false, keyboard: false, icon: L.divIcon({ className: 'dlab', html: `<span>${esc(d.name)}</span>`, iconSize: [0, 0] }) }).addTo(g);
  }
  for (const p of mc) L.polygon(p.map(flip), { renderer: r, pane: 'boundary', color: P.edge, weight: 2.2, opacity: 0.85, fill: false, interactive: false }).addTo(g);
  BND = g.addTo(map);
}

const POPOPT = () => (wide() ? { maxWidth: 340, maxHeight: 440, autoPanPaddingTopLeft: [372, 70], autoPanPaddingBottomRight: [412, 100] } : { maxWidth: 300, maxHeight: 360, autoPanPadding: [12, 90] });
function pop(e, html, at) {
  if (S.picking) { pickAt(e.latlng); return; }
  S.popFn = html;
  showPop(html());
}
const openPop = (ll, html) => { S.popFn = null; showPop(html); };
const refreshPop = () => { if (S.popFn && !$('#popModal').hidden) $('#popBody').innerHTML = S.popFn(); };
function showPop(html) {
  $('#popBody').innerHTML = html;
  S.popFrom = S.popFrom || document.activeElement;
  $('#popModal').hidden = false;
  $('#popClose').focus({ preventScroll: true });
}
function hidePop() {
  const m = $('#popModal');
  if (!m || m.hidden) return;
  m.hidden = true;
  if (S.popFrom && S.popFrom.isConnected && S.popFrom !== document.body) S.popFrom.focus({ preventScroll: true });
  S.popFrom = null;
}
const row = (k, v) => `<tr><td>${k}</td><td>${v}</td></tr>`;
const head = (i, sub) => `<div class="pop"><h4>${esc(M.placeOf(i))}一帶</h4><div class="sub">${esc(M.districtOf(i))}${sub ? '・' + esc(sub) : ''}</div>`;
const distTxt = d => (d < 1000 ? `約 ${Math.round(d / 10) * 10} 公尺` : `約 ${(d / 1000).toFixed(1)} 公里`);
const wkTxt = w => `第 ${w} 週（${Us(w)}）`;
const band = lv => `<span class="band" aria-hidden="true"><b>${lv || '—'}</b><span>${LV[lv].name}</span></span><span class="sr">${lv ? lv + ' 級' : ''}${LV[lv].name}：</span>`;
const stopTxt = q => (q.reasons.length ? `（${q.reasons.map(k => STOP_WHY[k] || k).join('、')}）` : '');
/* 嚴重度指數：膠囊、明細表（危險因子、事件屬性、加成，下一行是原因） */
const sevPill = sv => (sv && !sv.na
  ? `<span class="sev b${sv.band.k}" title="嚴重度指數 ${sv.score}（${sv.band.name}）"><span class="mt" aria-hidden="true"><i></i><i></i><i></i><i></i></span><b>${sv.score}</b>${sv.band.name}<span class="sr">嚴重度指數</span></span>`
  : '<span class="sev na">不計分</span>');
const sevTop = sv => sv.factors.filter(f => f.key !== 'base').slice(0, 3).map(f => `${f.name} +${f.pts}`).join('、');
function sevTable(sv, note) {
  if (!sv || sv.na) return '<p class="muted">轉介或看不出和老鼠有關的通報，不計嚴重度。</p>';
  return `<table class="sevt"><thead><tr><th>危險因子</th><th>事件屬性</th><th class="p">加成</th></tr></thead><tbody>` +
    sv.factors.map(f => `<tr><th>${esc(f.name)}</th><td>${esc(f.attr)}</td><td class="p">+${f.pts}</td></tr><tr class="why"><td colspan="3">原因：${esc(f.reason)}</td></tr>`).join('') +
    `</tbody><tfoot><tr><th colspan="2">嚴重度指數・${sv.band.name}${sv.raw > 100 ? `<small>加總 ${sv.raw}，上限 100</small>` : ''}${note ? `<small>${esc(note)}</small>` : ''}</th><td class="p">${sv.score}</td></tr></tfoot></table>`;
}
const cleanWhy = w => (w || []).map(s => s.replace(/（問題類型，不直接決定級別）/g, '')).join('；');
const sevDetails = (sv, note) => (sv && !sv.na ? `<details class="sevd"><summary>嚴重度明細：${esc(sevTop(sv))}</summary>${sevTable(sv, note)}</details>` : '');

/* ---- 彈出視窗 ---- */
function popArea(a, W) {
  return head(a.h, wkTxt(W.w)) +
    `<div class="tri mini l${a.lv}">${band(a.lv)}<div class="body"><span class="to">派給 ${esc(govTo(a.lv))}</span><span class="act">${esc(govAct(a))}</span></div></div>
    <div class="sevrow">${sevPill(a.sev)}<span class="muted">${M.realReports ? `見鼠地圖 ${a.nRadar} 筆` : `1999 陳情 ${a.n1999} 筆、見鼠地圖 ${a.nRadar} 筆`}</span></div>
    ${govActs(a, W)}${govMore(a, W)}
    ${popDispatch(a.h)}<div class="rep"><button type="button" class="btn" data-tryh="${a.h}">用這個位置試判</button></div></div>`;
}
function popRep(r, W) {
  const what = r.desc ? `「${r.desc}」` : r.src === 'radar' ? r.j.places.join('、') || '一般目擊' : '1999 開放資料沒有描述，只能依位置分級';
  return `<div class="pop"><h4>${r.src === 'radar' ? '見鼠地圖通報' : '1999 陳情'}</h4><div class="sub">${wkTxt(r.w)}・${esc(M.placeOf(r.hex))}一帶</div>
    <div class="tri mini l${r.lv}">${band(r.lv)}<div class="body"><span class="to">${r.lv ? '派給 ' + esc(LV[r.lv].to) : esc(r.t.to)}</span></div></div>
    <table>${row('判讀', esc(what))}${row('依據', esc(cleanWhy(r.t.why)))}</table><div class="sevrow">${sevPill(r.sev)}</div><details class="gview"><summary class="btn"><span>查看詳情</span><span>收起詳情</span></summary>${sevTable(r.sev)}</details></div>`;
}
function popMine(r) {
  return `<div class="pop"><h4>市民通報</h4><div class="sub">${wkTxt(NW)}・${r.hex >= 0 ? esc(M.placeOf(r.hex)) + '一帶' : '臺北市界外'}</div>
    <div class="tri mini l${r.lv}">${band(r.lv)}<div class="body"><span class="to">${r.lv ? '派給 ' + esc(LV[r.lv].to) : esc(r.t.to)}</span></div></div>
    <table>${row('內容', esc(r.text))}${row('依據', esc(cleanWhy(r.t.why)))}${row('狀態', r.dispatched ? '已派案：' + esc(r.dispatched) : '等待派案')}</table><div class="sevrow">${sevPill(r.sev)}</div><details class="gview"><summary class="btn"><span>查看詳情</span><span>收起詳情</span></summary>${sevTable(r.sev)}</details></div>`;
}
function popHex(i, w) {
  const z = M.AN.z[w][i], hot = M.AN.hot[w][i];
  const sig = hot ? (z >= 2.58 ? '99% 顯著' : '95% 顯著') : z >= 1.65 ? '90%，僅供參考' : '不顯著';
  const tr = nl(M.AN, i, w);
  let rows = row('近 4 週', `1999 陳情約 ${Math.round(ol(M.CNT, 'r1999', i, w))} 筆、見鼠地圖約 ${Math.round(ol(M.CNT, 'radar', i, w))} 筆`) +
    row('Gi* z 值', `${z.toFixed(2)}（${sig}）`) + row('趨勢', tr ? TREND[tr] : '沒有熱點紀錄');
  const sn = (M.SNK.byHex.get(i) || []).filter(p => p.w > w - 8 && p.w <= w);
  if (sn.length) {
    const m = new Map();
    sn.forEach(p => m.set(p.sp, (m.get(p.sp) || 0) + 1));
    rows += row('近 8 週蛇類', esc([...m].map(([k, v]) => `${k} ${v}`).join('、'))) + row('判讀', SNAKE[il(M.AN, M.GRID, i, w, M.BAIT)]);
  }
  return head(i, `最近參考點${distTxt(M.GRID.nearDist[i])}・${wkTxt(w)}`) + `<table>${rows}</table></div>`;
}
function cvsRow(i, R) {
  const Lh = M.CVS_BY_HEX.get(i) || [], c = k => Lh.filter(o => o.f[k]).length;
  return `+${R.bump[i]} 百分位（這一格 ${Lh.length} 家${Lh.length ? `：${Object.keys(M.CVSF).map(k => `${M.CVSF[k]} ${c(k)}`).join('、')}` : ''}）`;
}
function popCvs(o) {
  const chips = Object.keys(M.CVSF).map(k => `<span class="chip${o.f[k] ? ' on' : ' off'}">${o.f[k] ? '' : '無'}${M.CVSF[k]}</span>`).join('');
  return `<div class="pop"><h4>${esc(o.name)}</h4><div class="sub">${o.hex >= 0 ? esc(M.placeOf(o.hex)) + '一帶・' : ''}${o.sim ? '位置與設施都是模擬' : o.facSim ? '位置為匯入資料，設施為模擬' : '匯入資料'}</div>
    <div class="chips" style="margin-top:6px">${chips}</div>
    <table>${row('食物源權重', `${o.w.toFixed(1)}（基本 1）`)}${row('區塊風險', o.hex >= 0 ? `所在格 +${Math.round(M.CVS_MAX * M.cvsNorm[o.hex])} 百分位，上限 +${M.CVS_MAX}` : '—')}${row('嚴重度', `80 公尺內的通報 +${M.cvsPts(o)}，上限 +5`)}</table></div>`;
}
function cvsPoints(W) {
  if (!CVL) CVL = L.layerGroup().addTo(map);
  CVL.clearLayers();
  if (S.role !== 'gov' || S.view !== 'risk' || !M.CVS.length || map.getZoom() < 14) return;
  const z = map.getZoom(), rad = z >= 16 ? 4.6 : z >= 15 ? 3.4 : 2.4;
  for (const o of M.CVS) L.circleMarker(o.ll, { renderer: CV, radius: rad, color: P.edge, weight: z >= 16 ? 1.2 : 0.8, fillColor: o.w >= 2.2 ? P.hot90 : o.w >= 1.6 ? P.l2 : P.paper, fillOpacity: 1 })
    .on('click', e => pop(e, () => popCvs(o), o.ll)).addTo(CVL);
}
function popRisk(i, W) {
  const R = W.risk, f = v => Math.round(v * 100), near = Cl(M.GRID, M.POIS, i), tg = Tl(M.GRID, W.clue, i);
  const names = l => (l.length ? l.slice(0, 3).map(p => p.name).join('、') : '無');
  return head(i, R.cls[i] === 'source' ? '高風險源頭' : '可能擴散範圍') + `<table>
    ${row('風險分數', `${f(R.score[i])} → 擴散後 ${f(Math.min(1, R.spread[i]))}，全市百分位 ${W.live(i)}${R.bump && R.bump[i] ? `（含超商 +${R.bump[i]}）` : ''}`)}
    ${row('食物源', f(R.parts.food[i]))}${row('近期通報', f(R.parts.reports[i]))}${R.available.cvs ? row('超商', cvsRow(i, R)) : ''}
    ${row('下水道', R.available.sewer ? f(R.parts.sewer[i]) : '沒有資料')}${row('低窪程度', R.available.low ? f(R.parts.low[i]) + (R.lowActive ? '' : '（只在豪雨週列入）') : '沒有資料')}
    ${row('附近食物點', esc(names(near.food)))}${row('可能棲所', esc(names(near.harbor)))}
    ${row('通報線索', esc(tg.length ? tg.slice(0, 3).map(t => `${TAG_ZH[t.key]} ${t.n}`).join('、') : '無'))}</table></div>`;
}
function popHeat(i, W) {
  const s = W.live(i), r = publicRisk(s);
  return head(i, '') + `<p class="big"><b style="color:${r.color}">${r.name}</b></p><p class="sub">${r.tip}。區域級別來自模擬監測資料，不代表單筆事件檢傷等級。</p><p class="sub">只顯示區域風險，不顯示個別通報位置。</p>${S.role === 'citizen' ? `<div class="rep"><button type="button" class="btn" data-rephere="${i}">在這一帶通報</button></div>` : ''}</div>`;
}
/* 近 6 週方格：沒人看＝虛線空格；有看但沒鼠跡＝綠色，和「沒人看」分得出來 */
const histColor = st => (st === 'ok' || st === 'none' ? 'var(--green)' : stnColor(st));
const histLegend = kind => `<div class="hlegend"><span><i class="hs blank"></i>沒人觀察</span>${Object.entries(M.ST[kind]).map(([k, n]) => `<span><i class="hs" style="background:${histColor(k)}"></i>${esc(n)}</span>`).join('')}</div>`;
S.stPush = {};
function popStation(x, w) {
  const s = x.s, K = KIND[s.kind], hist = [];
  for (let k = Math.max(s.start, w - 5); k <= w; k++) hist.push(`<span class="hs${s.obs[k] ? '' : ' blank'}" title="第 ${k} 週：${s.obs[k] ? M.ST[s.kind][s.obs[k].st] : '沒有觀察'}" style="background:${s.obs[k] ? histColor(s.obs[k].st) : 'transparent'}"></span>`);
  const last = x.last ? `第 ${x.last.w} 週：${M.ST[s.kind][x.last.st]}（${x.last.by}）` : '還沒有觀察紀錄', al = x.last && M.ALERT[x.last.st];
  return `<div class="pop"><h4>${K} ${esc(s.code)}</h4><div class="sub">${esc(M.placeOf(s.hex))}一帶・第 ${s.start} 週起・${s.kind === 'bait' ? '社區環境衛生師投放' : '社區防鼠巡查員放置'}・模擬</div>
    <table>${row('最近觀察', esc(last))}${row('近 6 週', `<span class="hist">${hist.join('')}</span>${histLegend(s.kind)}`)}${x.overdue ? row('提醒', '超過 2 週沒有人觀察') : ''}${al ? row('處置', esc(al)) : ''}${s.why ? row('說明', esc(s.why)) : ''}</table>
    ${S.role === 'gov' && x.overdue ? `<div class="rep">${S.stPush[s.id] ? '<span class="chip">已推播，等待附近志工觀察</span>' : `<button type="button" class="btn solid" data-stpush="${s.id}">推播給附近志工觀察</button>`}</div>` : ''}
    ${s.kind === 'bait' ? '<div class="notice hot" style="margin-top:8px">投藥中：寵物請牽繩，兒童不要觸碰。看到死鳥、死蛇請通報，可能是二次中毒。</div>' : ''}
    ${S.role === 'citizen' ? `<div class="rep"><button type="button" class="btn solid" data-obs="${s.id}">我要觀察這個${s.kind === 'trap' ? '捕鼠籠' : '餌盒'}</button></div>` : ''}
    <p class="sub" style="margin-top:8px">只看不碰：不開盒、不碰餌、不碰籠。看到死鼠或毒餌外露請回報，由專業人員處理。</p></div>`;
}
const popPoint = (t, w, x) => `<div class="pop"><h4>${esc(t)}</h4><div class="sub">${wkTxt(w)}${x ? '，' + esc(x) : ''}</div></div>`;
function popShop(s) {
  return `<div class="pop"><h4>${esc(s.name)}</h4><div class="sub">${STIERS[s.tier - 1].name}・自願公開・模擬店家</div><table>${row('巡查合格率', s.pass + '%')}${row('主動通報', s.act + ' 次（不扣分）')}${row('連續良好', s.days + ' 天')}${s.rank ? row('米奇零', `第 ${s.rank} 名`) : ''}</table></div>`;
}

/* ---------- 市民任務（週報的特攻隊任務，只列防鼠志工能做的） ---------- */
const tState = t => (S.card.finished.has(t.id) ? 'finished' : S.card.joined.has(t.id) ? 'mine' : t.status);
function proposedCitizenTasks(W) {
  return Td(M.GRID, M.AN, W.risk, W.clue, W.w).filter(t => xd[t.type].roles.includes('citizen'))
    .map(t => Object.assign({}, t, { d: dist(t.ll, S.me.ll) })).filter(t => t.d <= 2500).sort((a, b) => a.d - b.d);
}
function seedTaskReviews(W) {
  if (S.taskReviewsSeeded) return;
  const proposed = proposedCitizenTasks(W);
  // 兩項已核准示範任務，其餘任務仍需市府審核。
  proposed.slice(0, 2).forEach(t => S.taskReviews[t.id] = 'approved');
  S.taskReviewsSeeded = true;
}
function citizenTasks(W) {
  if (W.w === NW) seedTaskReviews(W);
  return proposedCitizenTasks(W).filter(t => S.taskReviews[t.id] === 'approved');
}
/* V5：已發布任務的接案追蹤（人數、狀態、名單皆為模擬；市民端加入或回報會同步反映） */
S.tk = { verified: {}, redo: {}, pushed: {}, fresh: {} };
// 這次瀏覽中才派發的任務，從 0 人開始招募；推播後模擬有人加入
function tkSet(id, v) { S.taskReviews[id] = v; if (v === 'approved') S.tk.fresh[id] = true; else { delete S.tk.fresh[id]; delete S.tk.pushed[id]; } }
S.trvF = 'approved';
const govTasks = W => Td(M.GRID, M.AN, W.risk, W.clue, W.w).filter(t => xd[t.type].roles.includes('citizen'));
const TK_STAGE = {
  open: ['招募中', '還沒招滿，可以再推播給附近的防鼠志工。'],
  active: ['進行中', '人數到齊，志工正在執行。'],
  verify: ['待驗收', '志工已拍照回報，請確認照片後驗收。'],
  ok: ['已驗收', '任務完成，志工已計點。']
};
const TK_WHO = ['防鼠志工・長者', '防鼠志工・居民', '社區防鼠巡查員', '防鼠志工・青年', '防鼠志工・店家'];
function tkInfo(t) {
  const me = S.card.joined.has(t.id) || S.card.finished.has(t.id);
  const fresh = S.tk.fresh[t.id], st0 = fresh ? 'open' : t.status;
  const n = Math.min(t.need, (fresh ? (S.tk.pushed[t.id] ? Math.ceil(t.need / 2) : 0) : st0 === 'open' ? t.joined : t.need) + (me && st0 === 'open' ? 1 : 0));
  const stage = S.tk.verified[t.id] ? 'ok' : S.card.finished.has(t.id) ? 'verify' : S.tk.redo[t.id] ? 'active'
    : st0 === 'done' ? 'ok' : st0 === 'verify' ? 'verify' : n >= t.need ? 'active' : 'open';
  const who = [];
  if (me) who.push(`${S.card.nick}（市民端示範帳號）`);
  for (let k = who.length; k < n; k++) who.push(`${TK_WHO[(t.hex + k * 3) % TK_WHO.length]}・${['10/20', '10/21', '10/22', '10/23'][(t.hex + k) % 4]} 加入`);
  return { n, stage, who, me };
}
function tkTrack(t, compact) {
  const x = tkInfo(t), [lab, tip] = TK_STAGE[x.stage], steps = ['發布', '招募', '執行', '驗收'];
  const at = { open: 1, active: 2, verify: 3, ok: 4 }[x.stage];
  const acts = [];
  if (x.stage === 'open') acts.push(S.tk.pushed[t.id] ? '<span class="chip">已推播給附近志工</span>' : `<button type="button" class="btn solid" data-tk-push="${esc(t.id)}">再推播給附近志工</button>`);
  if (x.stage === 'verify') acts.push(`<button type="button" class="btn solid" data-tk-ok="${esc(t.id)}">驗收通過</button><button type="button" class="btn" data-tk-redo="${esc(t.id)}">退回補拍</button>`);
  if (x.stage === 'open' || x.stage === 'active') acts.push(`<button type="button" class="btn" data-taskreview="returned" data-taskid="${esc(t.id)}">${x.n ? `撤回（通知已加入的 ${x.n} 人）` : '撤回發布'}</button>`);
  return `<div class="tk"><ol class="tksteps" aria-label="任務進度">${steps.map((s, i) => `<li class="${i < at || x.stage === 'ok' ? 'done' : ''}${i === at && x.stage !== 'ok' ? ' on' : ''}">${s}</li>`).join('')}</ol>
    <div class="between"><b>已接案 ${x.n}／${t.need} 人</b><span class="chip tk-${x.stage}">${lab}</span></div>
    <div class="prog"><i style="width:${(x.n / t.need) * 100}%"></i></div><div class="muted">${tip}</div>
    ${!compact && x.who.length ? `<div class="tkwho">${x.who.map(w => `<span>${esc(w)}</span>`).join('')}</div>` : ''}
    ${acts.length ? `<div class="acts">${acts.join('')}</div>` : ''}</div>`;
}
function renderTaskApprovals() {
  const W = M.week(NW);
  seedTaskReviews(W);
  const all = govTasks(W), st = x => S.taskReviews[x.id] || 'pending';
  const G = { pending: all.filter(x => st(x) === 'pending'), approved: all.filter(x => st(x) === 'approved'), returned: all.filter(x => st(x) === 'returned') };
  const F = [['pending', '待核准'], ['approved', '已發布・接案追蹤'], ['returned', '退回']];
  const f = S.trvF, ord = { verify: 0, open: 1, active: 2, ok: 3 };
  const list = f === 'approved' ? G.approved.slice().sort((a, b) => ord[tkInfo(a).stage] - ord[tkInfo(b).stage]) : G[f];
  const cnt = k => G.approved.filter(x => tkInfo(x).stage === k).length;
  const cards = list.slice(0, 8).map(x => `<article class="task"><div class="between"><b>${esc(TASK[x.type])}</b><button type="button" class="btn" data-gtask="${esc(x.id)}">在地圖上看</button></div>
      <span class="meta">${esc(x.place)}一帶・${esc(M.districtOf(x.hex))}・安全分級 ${esc(TIER[xd[x.type].tier])}・需要 ${x.need} 人</span>
      ${f === 'approved' ? tkTrack(x) : f === 'pending'
        ? `<p class="muted">AI 依區域風險及通報線索提出任務建議；市府應確認必要性、執行安全與責任歸屬。</p><div class="acts"><button type="button" class="btn solid" data-taskreview="approved" data-taskid="${esc(x.id)}">核准發布</button><button type="button" class="btn" data-taskreview="returned" data-taskid="${esc(x.id)}">退回調整</button></div>`
        : `<div class="acts"><button type="button" class="btn" data-taskreview="approved" data-taskid="${esc(x.id)}">重新核准發布</button></div>`}</article>`).join('');
  return `<section class="sec" aria-label="市府協作任務審核"><div class="between"><h3>志工任務</h3><span class="chip">示範流程</span></div>
    <div class="rdfilter" role="group" aria-label="任務狀態">${F.map(([k, n]) => `<button type="button" data-trv-f="${k}" aria-pressed="${f === k}">${n} ${G[k].length}</button>`).join('')}</div>
    ${f === 'approved' && G.approved.length ? `<p class="tksum">招募中 <b>${cnt('open')}</b>・進行中 <b>${cnt('active')}</b>・待驗收 <b>${cnt('verify')}</b>・已驗收 <b>${cnt('ok')}</b></p>` : ''}
    ${cards || `<p class="muted">目前沒有${F.find(([k]) => k === f)[1]}的任務。</p>`}
    ${list.length > 8 ? `<p class="muted">另有 ${list.length - 8} 項，可以在地圖上點區塊查看。</p>` : ''}</section>`;
}
/* 地圖彈窗裡的派發區塊：同一個區塊本週可派發的協作任務 */
function popDispatch(h) {
  const ts = govTasks(M.week(NW)).filter(x => x.hex === h);
  if (!ts.length) return '';
  return `<div class="poptk"><h5>這一帶的協作任務・第 ${NW} 週</h5>${ts.map(x => {
    const s = S.taskReviews[x.id];
    return `<div class="poptkrow"><div class="between"><span><b>${esc(TASK[x.type])}</b> <span class="muted">安全分級 ${esc(TIER[xd[x.type].tier])}・需要 ${x.need} 人</span></span>${s === 'approved' ? '' : `<span class="chip">${s === 'returned' ? '已退回' : '待核准'}</span>`}</div>
      ${s === 'approved' ? tkTrack(x, true) : `<div class="acts"><button type="button" class="btn solid" data-taskreview="approved" data-taskid="${esc(x.id)}">${s === 'returned' ? '重新派發' : '派發任務'}</button>${s === 'returned' ? '' : `<button type="button" class="btn" data-taskreview="returned" data-taskid="${esc(x.id)}">退回</button>`}</div>`}</div>`;
  }).join('')}</div>`;
}
function govTaskGo(id) {
  const t = govTasks(M.week(NW)).find(x => x.id === id);
  if (!t) return;
  if (S.week !== NW) setWeek(NW);
  if (S.view !== 'squad') setView('squad');
  map.flyTo(t.ll, 16, { duration: RM.matches ? 0 : 0.7 });
  setTimeout(() => { S.popFn = () => popGovTask(t); showPop(S.popFn()); }, RM.matches ? 50 : 760);
  if (!wide()) $('#side').classList.add('min');
}
function popGovTask(t) {
  const cur = t.id.startsWith(NW + '-'), s = S.taskReviews[t.id];
  const body = !cur ? `<table>${row('安全等級', TIER[xd[t.type].tier])}${row('狀態', TSTAT[t.status])}${row('人力', `需要 ${t.need} 人，已加入 ${t.joined} 人`)}</table><p class="muted">這是第 ${t.id.split('-')[0]} 週的紀錄；只有最新一週（第 ${NW} 週）的任務可以派發。</p>`
    : s === 'approved' ? tkTrack(t)
    : `<table>${row('安全等級', TIER[xd[t.type].tier])}${row('人力', `需要 ${t.need} 人`)}${row('狀態', s === 'returned' ? '已退回' : '待核准')}</table><div class="acts"><button type="button" class="btn solid" data-taskreview="approved" data-taskid="${esc(t.id)}">${s === 'returned' ? '重新派發' : '派發任務'}</button></div>`;
  return `<div class="pop"><h4>${TASK[t.type]}</h4><div class="sub">${esc(t.place)}一帶・模擬任務</div>${body}</div>`;
}
function popTask(t) {
  const st = tState(t), mine = st === 'mine' || st === 'finished';
  const btn = st === 'finished' ? `<span class="chip ok">已完成 +${xd[t.type].points} 點</span>` : st === 'mine' ? `<button type="button" class="btn solid" data-finish="${t.id}">拍照回報完成</button>`
    : t.status === 'open' ? `<button type="button" class="btn solid" data-join="${t.id}">我順路，加入</button>` : `<span class="chip">${TSTAT[t.status]}</span>`;
  return `<div class="pop"><h4>${TASK[t.type]}</h4><div class="sub">${esc(t.place)}一帶・離你${distTxt(t.d)}</div><table>${row('安全等級', TIER[xd[t.type].tier])}${row('人力', `需要 ${t.need} 人，已加入 ${t.joined + (mine ? 1 : 0)} 人`)}${row('點數', '+' + xd[t.type].points)}</table><div class="rep">${btn}</div></div>`;
}

/* ---------- 市府的各種檢視（北市鼠情週報的圖資） ---------- */
const DRAW = {
  triage(W) {
    for (const a of W.list) {
      const lv = a.lv;
      if (!cfOn('lv' + lv)) continue;
      const o = lv === 1 ? { color: P.edge, weight: 2.4, opacity: 1, fillColor: P.l1, fillOpacity: 0.8 }
        : lv === 5 ? { color: P.edge, weight: 0.8, opacity: 0.5, fillColor: P.l5, fillOpacity: 0.85 }
        : { color: P.paper, weight: 1.2, opacity: 1, fillColor: P['l' + lv], fillOpacity: 0.74 };
      poly(a.h, o).on('click', e => pop(e, () => popArea(a, W), M.hexLL(a.h))).addTo(HX);
    }
    if (W.w === NW) for (const r of S.mine) if (cfOn('lv' + r.lv))
      L.circleMarker(r.ll, { renderer: CV, radius: 7, color: P.edge, weight: 2, dashArray: r.dispatched ? null : '3 2', fillColor: P['l' + r.lv], fillOpacity: 1 })
        .on('click', e => pop(e, () => popMine(r))).addTo(MK);
    l1Labels(W);
    triagePoints(W);
  },
  hot(W) {
    const w = W.w;
    for (const i of M.MASKED) {
      const z = M.AN.z[w][i];
      if (z < 1.65) continue;
      const hot = M.AN.hot[w][i];
      if (!cfOn(hot ? (z >= 2.58 ? 'h99' : 'h95') : 'h90')) continue;
      poly(i, { color: P.paper, weight: 1, fillColor: hot ? (z >= 2.58 ? P.hot99 : P.hot95) : P.hot90, fillOpacity: hot ? 0.78 : 0.5 }).on('click', e => pop(e, () => popHex(i, w))).addTo(HX);
    }
  },
  trend(W) {
    for (const i of M.MASKED) {
      const t = nl(M.AN, i, W.w);
      if (t && cfOn(t)) poly(i, { color: P.paper, weight: 1, fillColor: P['tr-' + t], fillOpacity: t === 'fade' ? 0.45 : 0.78 }).on('click', e => pop(e, () => popHex(i, W.w))).addTo(HX);
    }
  },
  snake(W) {
    const w = W.w;
    if (cfOn('rathot')) for (const i of M.MASKED) if (M.AN.hot[w][i]) poly(i, { stroke: false, fillColor: P.hot95, fillOpacity: 0.2, interactive: false }).addTo(HX);
    if (cfOn('zone')) for (const i of M.MASKED) if (M.BAIT[i] && w >= M.BAIT[i]) poly(i, { fill: false, color: P['sn-poison'], weight: 1, opacity: 0.7, dashArray: '2 3', interactive: false }).addTo(HX);
    const rec = al(M.SNK, M.GRID.H, w);
    for (const i of M.MASKED) {
      if (!rec[i]) continue;
      const k = il(M.AN, M.GRID, i, w, M.BAIT), hid = k === 'hidden';
      if (!cfOn(k)) continue;
      poly(i, { color: hid ? P['sn-hidden'] : P.paper, weight: hid ? 2 : 1.2, dashArray: hid ? '5 4' : null, fillColor: P['sn-' + k], fillOpacity: hid ? 0.3 : 0.66 })
        .on('click', e => pop(e, () => popHex(i, w))).addTo(HX);
    }
    for (let k = Math.max(1, w - 7); k <= w; k++)
      for (const p of M.SNK.points[k]) L.circleMarker(p.ll, { renderer: CV, radius: 2.8, color: P.edge, weight: 0.8, fillColor: P.snake, fillOpacity: 1, interactive: false }).addTo(PT);
  },
  bait(W) {
    const w = W.w, SW = M.stationWeek(w), by = new Map();
    for (const x of SW.list) { const o = by.get(x.s.hex) || { n: 0, seen: 0, act: 0 }; o.n++; if (x.seen) { o.seen++; if (x.active) o.act++; } by.set(x.s.hex, o); }
    for (const i of M.MASKED) {
      if (!M.BAIT[i] || w < M.BAIT[i]) continue;
      const o = by.get(i), r = o && o.seen ? o.act / o.seen : null;
      if (!cfOn(r == null ? 'bnone' : r >= 0.5 ? 'bhi' : r >= 0.2 ? 'bmid' : 'blo')) continue;
      poly(i, { color: P['sn-poison'], weight: 1.2, opacity: 0.8, dashArray: '4 3', fillColor: r == null ? P.paper : r >= 0.5 ? P['bait-hi'] : r >= 0.2 ? P['bait-mid'] : P['bait-lo'], fillOpacity: r == null ? 0.3 : 0.6 })
        .on('click', e => pop(e, () => head(i, wkTxt(w)) + `<table>${row('投藥區', `第 ${M.BAIT[i]} 週起`)}${row('這一格的站', `${o ? o.n : 0} 個`)}${row('近 2 週', o && o.seen ? `有觀察 ${o.seen} 個，出現鼠跡 ${o.act} 個（${Math.round((o.act / o.seen) * 100)}%）` : '沒有觀察紀錄')}</table></div>`)).addTo(HX);
    }
    for (const x of SW.list) if (cfOn(x.s.kind)) L.marker(x.s.ll, { keyboard: false, zIndexOffset: 500, icon: stnIcon(x) }).on('click', e => pop(e, () => popStation(x, w), x.s.ll)).addTo(MK);
    if (cfOn('bpt')) for (const b of M.baitPtsAll) if (b.w <= w && b.w > w - 8)
      L.circleMarker(Is(b.x, b.y), { renderer: CV, radius: 4, color: P['sn-poison'], weight: 2, fillColor: P.paper, fillOpacity: 1 }).on('click', e => pop(e, () => popPoint('見鼠地圖毒餌通報', b.w))).addTo(PT);
  },
  risk(W) {
    const R = W.risk;
    for (const i of M.MASKED) {
      const c = R.cls[i];
      if (!c || !cfOn(c === 'source' ? 'src' : 'spread')) continue;
      const s = c === 'source';
      poly(i, { color: s ? P.paper : P['risk-spread'], weight: s ? 1 : 1.6, dashArray: s ? null : '4 3', fillColor: s ? P['risk-src'] : P['risk-spread'], fillOpacity: s ? 0.7 : 0.3 })
        .on('click', e => pop(e, () => popRisk(i, W))).addTo(HX);
    }
    for (const p of M.POIS) {
      if (p.cvs) continue;
      const f = p.kind === 0, c = false;
      if (!cfOn(f ? 'food' : 'harbor')) continue;
      L.marker(p.ll, { keyboard: false, icon: L.divIcon({ className: 'poi', html: c ? ICON_CVS : f ? ICON_FOOD : ICON_TREE, iconSize: c ? [20, 18] : f ? [22, 22] : [17, 22], iconAnchor: c ? [10, 14] : f ? [11, 13] : [8, 21] }) })
        .on('click', e => pop(e, () => popPoint(`${c ? '超商' : f ? '食物點' : '可能棲所'}：${p.name}`, W.w))).addTo(MK);
    }
  },
  points(W) {
    const w = W.w;
    for (let k = Math.max(1, w - 3); k <= w; k++)
      for (const p of M.RBW[k]) {
        const r = p.src === 'r1999';
        if (!cfOn(r ? 'p1999' : 'pradar')) continue;
        L.circleMarker(p.ll, { renderer: CV, radius: 3.4, color: r ? P.edge : P.pradar, weight: r ? 0.8 : 1.8, fillColor: r ? P.p1999 : P.paper, fillOpacity: r ? 0.9 : 0.85 })
          .on('click', e => pop(e, () => popPoint(r ? '1999 陳情' : '見鼠地圖', p.w, p.desc ? `「${p.desc}」` : ''))).addTo(PT);
      }
    if (cfOn('pbait')) for (const b of M.baitPts) if (b.w <= w && b.w > w - 8)
      L.circleMarker(Is(b.x, b.y), { renderer: CV, radius: 4, color: P['sn-poison'], weight: 2, fillColor: P.paper, fillOpacity: 1 }).on('click', e => pop(e, () => popPoint('毒餌通報', b.w))).addTo(PT);
    for (let k = Math.max(1, w - 7); k <= w; k++)
      for (const p of M.SNK.points[k]) {
        const v = uc.has(p.sp);
        if (!cfOn(v ? 'venom' : 'nonvenom')) continue;
        L.circleMarker(p.ll, { renderer: CV, radius: 4, color: v ? P.edge : P.snake, weight: v ? 1 : 2, fillColor: v ? P.snake : P.paper, fillOpacity: 1 })
          .on('click', e => pop(e, () => popPoint(p.sp, p.w, v ? '毒蛇' : '蛇類目擊（模擬）'))).addTo(PT);
      }
  },
  squad(W) {
    const tasks = Td(M.GRID, M.AN, W.risk, W.clue, W.w), gap = Od(M.GRID, W.risk, tasks, SQUADS);
    for (const i of M.MASKED) {
      const c = gap.cls[i];
      if (c === 'short' && !cfOn('gap') || c === 'over' && !cfOn('over')) continue;
      if (c === 'short') poly(i, { color: P.gap, weight: 1.6, dashArray: '5 4', fillColor: P.gap, fillOpacity: 0.3, interactive: false }).addTo(HX);
      else if (c === 'over') poly(i, { stroke: false, fillColor: P.over, fillOpacity: 0.16, interactive: false }).addTo(HX);
    }
    for (const t of tasks) if (cfOn('tk-' + t.type))
      L.circleMarker(t.ll, { renderer: CV, radius: t.status === 'open' ? 7 : 5, color: P.edge, weight: t.status === 'open' ? 1.5 : 0.8, fillColor: P['t-' + t.type], fillOpacity: t.status === 'done' ? 0.35 : 0.95 })
        .on('click', e => pop(e, () => popGovTask(t))).addTo(PT);
    if (cfOn('shop')) for (const s of SHOPS) L.circleMarker(s.ll, { renderer: CV, radius: 4, color: P.edge, weight: 1.2, fillColor: P.shop, fillOpacity: 1 }).on('click', e => pop(e, () => popShop(s))).addTo(PT);
    if (cfOn('squad')) for (const q of SQUADS)
      L.circleMarker(q.ll, { renderer: CV, radius: 6 + Math.sqrt(q.members), color: P.paper, weight: 2.5, fillColor: P.squad, fillOpacity: 0.95 })
        .on('click', e => pop(e, () => `<div class="pop"><h4>${esc(q.name)}</h4><div class="sub">${q.members} 人${q.recruiting ? '，招募中' : ''}・模擬隊伍</div><table>${row('組成', `長者 ${q.mix.elder}、居民 ${q.mix.resident}、店家 ${q.mix.shop}、青年 ${q.mix.youth}、方案學員 ${q.mix.program}`)}${row('每週可投入', `約 ${q.capacity} 人次`)}</table></div>`)).addTo(PT);
  }
};
const cfOn = k => !S.cf || S.cf.has(k);
const CF_GOV = {
  triage: ['lv1', 'lv2', 'lv3', 'lv4', 'lv5'],
  hot: ['h99', 'h95', 'h90'],
  trend: ['new', 'persist', 'inter', 'fade'],
  snake: ['cross', 'poison', 'hidden', 'habitat', 'rathot', 'zone'],
  bait: ['bhi', 'bmid', 'blo', 'bnone', 'monitor', 'bait', 'trap', 'bpt'],
  risk: ['src', 'spread', 'food', 'harbor'],
  points: ['p1999', 'pradar', 'pbait', 'venom', 'nonvenom'],
  squad: ['gap', 'over', 'squad', 'shop', 'tk-clean', 'tk-garbage', 'tk-signs', 'tk-trap', 'tk-shop']
};
const cfKeys = () => (S.role === 'gov' ? CF_GOV[S.view] || [] : CFK[S.role]);
/* 市民與店家：只看區塊熱度（鼠患檢傷站的隱私設計），不畫個別通報 */
function publicRisk(s){
  return s >= 70 ? {name:'高風險',tip:'政府將優先確認風險來源並安排改善',color:'#D9502F',band:'h92'}
       : s >= 40 ? {name:'中風險',tip:'持續觀察環境及鼠跡變化',color:'#E9B13A',band:'h80'}
       : {name:'低風險',tip:'維持日常預防，仍可主動通報',color:'#4F9A5A',band:'h60'};
}
function drawPublic(W) {
  for (const i of M.MASKED) {
    const s = W.live(i), r = publicRisk(s);
    if (!cfOn(r.band)) continue;
    poly(i, { color: P.paper, weight: 0.55, fillColor: r.color, fillOpacity: s >= 70 ? 0.39 : s >= 40 ? 0.25 : 0.12 })
      .on('click', e => pop(e, () => popHeat(i, W))).addTo(HX);
  }
  if (S.role === 'citizen') {
    for (const t of citizenTasks(W)) {
      if ((t.type === 'clean' || t.type === 'garbage') && !cfOn(t.type)) continue;
      const st = tState(t);
      L.marker(t.ll, { keyboard: false, icon: L.divIcon({ className: '', iconSize: null, iconAnchor: [10, 11],
        html: `<div class="tpin${st === 'mine' ? ' mine' : ''}${st === 'finished' || st === 'done' ? ' done' : ''}" style="--c:${P['t-' + t.type]}"><i></i>${TASK[t.type]}</div>` }) })
        .on('click', e => pop(e, () => popTask(t))).addTo(MK);
    }
    for (const x of nearStations()) if (cfOn(x.s.kind)) L.marker(x.s.ll, { keyboard: false, zIndexOffset: 400, icon: stnIcon(x) }).on('click', e => pop(e, () => popStation(x, NW), x.s.ll)).addTo(MK);
  } else {
    for (const s of SHOPS) {
      if (dist(s.ll, S.shop.ll) > 3000 || !cfOn('s' + s.tier)) continue;
      L.marker(s.ll, { keyboard: false, icon: L.divIcon({ className: '', iconSize: [22, 22], iconAnchor: [11, 11], html: `<div class="shop t${s.tier}">${s.tier === 3 ? s.rank : STIERS[s.tier - 1].mark}</div>` }) })
        .on('click', e => pop(e, () => popShop(s))).addTo(MK);
    }
  }
}
function triagePoints(W) {
  PT.clearLayers();
  if (map.getZoom() < 14) return;
  for (const r of W.reps) if (cfOn('lv' + r.lv))
    L.circleMarker(r.ll, { renderer: CV, radius: 3 + (r.sev.score || 0) / 22, color: P.edge, weight: 1.2, fillColor: P['l' + r.lv], fillOpacity: 1 })
      .on('click', e => pop(e, () => popRep(r, W))).addTo(PT);
}
function l1Labels(W) {
  LB.clearLayers();
  if (S.role !== 'gov' || S.view !== 'triage' || !cfOn('lv1')) return;
  const seen = new Set(), places = [];
  for (const a of W.list) {
    if (a.lv !== 1) break;
    const nm = M.placeOf(a.h);
    if (seen.has(nm)) continue;
    seen.add(nm);
    places.push({ nm, ll: M.hexLL(a.h) });
  }
  const groups = [];
  for (const p of places) {
    const pt = map.latLngToLayerPoint(p.ll);
    const g = groups.find(g => Math.abs(g.pt.x - pt.x) < 160 && Math.abs(g.pt.y - pt.y) < 26 * g.items.length + 20);
    if (g) g.items.push(p); else groups.push({ pt, ll: p.ll, items: [p] });
  }
  for (const g of groups) {
    for (const p of g.items) L.marker(p.ll, { interactive: false, keyboard: false, zIndexOffset: 900, icon: L.divIcon({ className: '', iconSize: [16, 16], iconAnchor: [8, 8], html: '<i class="pulse"></i>' }) }).addTo(LB);
    L.marker(g.ll, { interactive: false, keyboard: false, zIndexOffset: 1000, icon: L.divIcon({ className: '', iconSize: null, iconAnchor: [-12, 11],
      html: `<div class="lvlab"><span class="lvdot l1">1</span><span class="nm">${g.items.map(p => esc(p.nm)).join('<br>')}</span></div>` }) }).addTo(LB);
  }
}
function drawSel() {
  SEL.clearLayers();
  if (S.sel != null && S.role === 'gov' && S.view === 'triage') L.polygon(M.GRID.hexes[S.sel].verts, { renderer: SVGR, fill: false, color: P.edge, weight: 3.4, interactive: false }).addTo(SEL);
}
function drawPins() {
  ME.clearLayers();
  const pin = (ll, html, anchor) => L.marker(ll, { interactive: false, keyboard: false, zIndexOffset: 2000, icon: L.divIcon({ className: '', iconSize: null, iconAnchor: anchor, html }) }).addTo(ME);
  if (S.role === 'citizen') {
    pin(S.me.ll, '<div class="me"><i></i><span>你在這裡</span></div>', [12, 12]);
    if (S.report.ll) pin(S.report.ll, '<div class="trypin">通報位置</div>', [30, 30]);
  } else if (S.role === 'merchant') pin(S.shop.ll, '<div class="shoppin">我的店</div>', [26, 30]);
  else if (S.tab.gov === 'p-try' && S.loc) pin(S.loc, '<div class="trypin">試判位置</div>', [30, 30]);
}

/* ---------- 圖例 ---------- */
function legend(W) {
  const lg = (sw, t, s) => `<div class="lg">${sw}<span>${t}</span>${s != null ? `<small>${s}</small>` : ''}</div>`;
  const box = (c, o = 0.8) => `<i class="sw" style="background:${c};opacity:${o}"></i>`;
  const dash = c => `<i class="sw dash" style="border-color:${c}"></i>`;
  const dot = c => `<i class="sw dot" style="background:${c}"></i>`;
  const ring = c => `<i class="sw dot ring" style="border-color:${c}"></i>`;
  const note = t => `<p class="lgnote">${t}</p>`;
  const ramp = lg(box(P.hot90, 0.6), '鼠患指數 60–79') + lg(box(P.hot95, 0.65), '80–91') + lg(box(P.hot99, 0.7), '92 以上');
  const stn = (k, c) => `<span class="sw stnsw">${stnSvg(k, c, 18)}</span>`;
  const fb = (k, sw, t, sm) => `<button type="button" class="lg" data-cf="${k}" aria-pressed="${cfOn(k)}" title="${!S.cf ? '只看這一項' : cfOn(k) ? '隱藏這一項' : '加入顯示'}">${sw}<span>${t}</span>${sm != null ? `<small>${sm}</small>` : ''}</button>`;
  const fhd = `<div class="lghd"><span class="lghint">${S.cf ? `已篩選 ${S.cf.size} 項` : '點項目只看該分類'}</span>${S.cf ? '<button type="button" class="lgall" data-cfall>全部顯示</button>' : ''}</div>`;
  const framp = fb('h92', box(P.hot99, 0.7), '鼠患指數 92 以上') + fb('h80', box(P.hot95, 0.65), '鼠患指數 80–91') + fb('h60', box(P.hot90, 0.6), '鼠患指數 60–79');
  if (S.role === 'citizen') return ['我家附近', fhd + framp + fb('clean', dot(P['t-clean']), '環境清潔任務') + fb('garbage', dot(P['t-garbage']), '垃圾代收任務') + fb('monitor', stn('monitor', P.paper), '無毒監測餌盒') + fb('bait', stn('bait', P.paper), '上鎖毒餌盒（投藥中）') + fb('trap', stn('trap', P.paper), '捕鼠籠') + lg(`<i class="sw dot" style="background:${P.blue};border:2px solid #fff;box-shadow:0 0 0 1.2px ${P.edge}"></i>`, '你在這裡') +
    note('只顯示區塊熱度，不顯示個別通報位置。市民不投放鼠餌或藥物，觀察餌站也只看不碰。')];
  if (S.role === 'merchant') return ['店家周邊', fhd + framp + STIERS.map((t, i) => fb('s' + (i + 1), `<span class="shop ${t.k} sm">${i === 2 ? '1' : t.mark}</span>`, t.name)).join('') +
    note('只顯示自願公開的標章店家；店家為模擬資料。')];
  switch (S.view) {
    case 'triage': return ['檢傷分級', fhd + [1, 2, 3, 4, 5].map(l => fb('lv' + l, `<span class="lvdot l${l}">${l}</span>`, LV[l].name, LV[l].short)).join('') +
      note('格子顏色是格內最急的一筆通報；放大到街區可以看到每一筆，點越大代表嚴重度指數越高。')];
    case 'hot': return ['Gi* 熱點', fhd + fb('h99', box(P.hot99), '99% 顯著熱點') + fb('h95', box(P.hot95), '95% 顯著熱點') + fb('h90', box(P.hot90, 0.55), '90%，僅供參考') +
      note(`近 4 週顯著熱點 ${W.summary.hot} 格，新興 ${W.summary.newHot}、持續 ${W.summary.persist}。格子邊長 350 公尺。`)];
    case 'trend': {
      const c = { new: 0, persist: 0, inter: 0, fade: 0 };
      M.MASKED.forEach(i => { const t = nl(M.AN, i, W.w); if (t) c[t]++; });
      return ['熱點趨勢', fhd + ['new', 'persist', 'inter', 'fade'].map(k => fb(k, box(P['tr-' + k], k === 'fade' ? 0.5 : 0.8), TREND[k], c[k] + ' 格')).join('') +
        note('新興：最近 4 週第一次成為熱點。持續：此後六成以上週次是熱點。間歇：時有時無。消退：最近 4 週都不是。')];
    }
    case 'snake': {
      const s = W.summary.snake;
      return ['蛇鼠判讀', fhd + fb('cross', box(P['sn-cross']), '蛇鼠共現', s.cross + ' 格') + fb('poison', box(P['sn-poison']), '二次中毒留意', s.poison + ' 格') + fb('hidden', dash(P['sn-hidden']), '疑似鼠低報', s.hidden + ' 格') +
        fb('habitat', box(P['sn-habitat']), '山邊、河濱棲地', s.habitat + ' 格') + fb('rathot', box(P.hot95, 0.3), '鼠類熱點') + fb('zone', dash(P['sn-poison']), M.realReports ? '投藥區（毒餌通報 300 公尺內）' : '投藥區（第 18 週起）') +
        note('統計近 8 週的蛇類目擊（模擬）。5 月是眼鏡蛇繁殖季，目擊增加多半和老鼠無關。')];
    }
    case 'bait': {
      const SW = M.stationWeek(W.w);
      return ['餌站觀察', fhd + '<h6 class="lgsub">投藥區（依近 2 週鼠跡比例）</h6>' + fb('bhi', box(P['bait-hi'], 0.7), '50% 以上') + fb('bmid', box(P['bait-mid'], 0.7), '20–49%') + fb('blo', box(P['bait-lo'], 0.7), '20% 以下') + fb('bnone', box(P.paper, 0.3), '近 2 週沒有觀察') +
        '<h6 class="lgsub">站點與通報</h6>' + fb('monitor', stn('monitor', P.paper), '無毒監測餌盒') + fb('bait', stn('bait', P.paper), '上鎖毒餌盒') + fb('trap', stn('trap', P.paper), '捕鼠籠') + fb('bpt', ring(P['sn-poison']), '見鼠地圖毒餌通報') +
        '<h6 class="lgsub">站點顏色＝最近一次觀察</h6>' + lg(stn('bait', P.l2), '有咬痕／部分被吃') + lg(stn('bait', P.hot95), '全被吃') + lg(stn('trap', P['sn-poison']), '籠內有鼠') + lg(stn('bait', P.l1), '毒餌外露、其他動物接觸') +
        note(SW.list.length ? `第 ${W.w} 週 ${SW.list.length} 個站，本週觀察 ${SW.seenN} 個、${SW.actN} 個出現鼠跡。虛線框是超過 2 週沒人觀察的站。餌站為模擬資料。` : '這一週還沒有設置餌站；模擬情境的投藥區從第 18 週開始。')];
    }
    case 'risk': {
      let a = 0, b = 0;
      M.MASKED.forEach(i => { const c = W.risk.cls[i]; if (c === 'source') a++; else if (c === 'spread') b++; });
      return ['風險地圖', fhd + fb('src', box(P['risk-src']), '高風險源頭（前 10%）', a + ' 格') + fb('spread', dash(P['risk-spread']), '可能擴散範圍', b + ' 格') +
        fb('food', `<span class="sw icon">${ICON_FOOD}</span>`, '食物點（市場、夜市）') + fb('harbor', `<span class="sw icon">${ICON_TREE}</span>`, '可能棲所（公園、河濱、工地）') + (M.CVS.length ? lg(`<i class="sw" style="background:${P.l2};border-radius:50%"></i>`, `超商 ${M.CVS.length.toLocaleString('zh-TW')} 家${M.CVS[0].sim ? '（模擬）' : ''}；越暖色設施越多，放大到街區顯示`) + `<div class="cvsrow"><button type="button" class="btn" data-cvstoggle aria-pressed="${M.CVS_ON}">超商因子：${M.CVS_ON ? '開' : '關'}</button></div>` : '') +
        note(`食物點與棲所是優先查看的地方，不是已確認的鼠窩。${W.risk.available.sewer ? '' : '目前沒有下水道資料，權重已重新分配。'}`)];
    }
    case 'points': return ['通報點位', fhd + (M.realReports ? '' : fb('p1999', dot(P.p1999), '1999 陳情')) + fb('pradar', ring(P.pradar), '見鼠地圖') + (M.realReports ? fb('pbait', ring(P['sn-poison']), '毒餌通報') : '') +
      fb('venom', dot(P.snake), '毒蛇目擊') + fb('nonvenom', ring(P.snake), '無毒蛇目擊') + note(`鼠類通報顯示近 4 週，蛇類顯示近 8 週。${M.realReports ? '1999 開放資料沒有位置，不畫點。' : ''}`)];
    default: return ['打鼠特攻隊', fhd + fb('gap', dash(P.gap), '人力缺口') + fb('over', box(P.over, 0.4), '人力集中，可支援他區') + fb('squad', dot(P.squad), '特攻隊據點') + fb('shop', dot(P.shop), '三不店家（自願公開）') +
      Object.keys(TASK).map(k => fb('tk-' + k, dot(P['t-' + k]), TASK[k] + '任務')).join('') + note('任務、隊伍與店家為模擬資料。')];
  }
}

/* ---------- 左上摘要卡 ---------- */
const cond = (k, v, u, warn) => `<div${warn ? ' class="warn"' : ''}><b>${v}<small>${u}</small></b><span>${k}</span></div>`;
function nearReports(ll, r, weeks) {
  let n = 0;
  for (let w = Math.max(1, NW - weeks + 1); w <= NW; w++) for (const x of M.REPORTS[w]) if (dist(x.ll, ll) <= r) n++;
  return n;
}
function statusGov(W) {
  const q = qs[W.w], e = ec[W.w], ev = Js.filter(x => x.week === W.w).map(x => EVENTS[x.key]);
  let b = '';
  if (W.tf > 1.001) b += `<p><b>停收與雨量讓區塊風險為平常的 ${W.tf.toFixed(2)} 倍</b>同一筆通報更容易升級。</p>`;
  if (ev.length) b += `<p><b>本週事件</b>${esc(ev.join('、'))}</p>`;
  b += `<p><b>本週建議</b>${W.advice.length ? W.advice.map(k => esc(ADVICE[k])).join('<br>') : '本週沒有特別的時間條件提醒。'}</p>`;
  return `<div class="hd"><span>第 ${W.w} 週檢傷</span><span class="date">${Us(W.w)}</span><button type="button" class="live${W.w === NW ? ' on' : ''}" id="latest" aria-pressed="${W.w === NW}">最新一週</button></div>
    <div class="lvstats" role="group" aria-label="各級區塊數">${[1, 2, 3, 4, 5].map(l => `<button type="button" data-lvf="${l}" aria-label="${l} 級${LV[l].name} ${W.lvN[l]} 處，在派案清單篩選"><span class="lvdot l${l}">${l}</span><span class="n">${W.lvN[l]}<small>處</small></span><span class="k">${LV[l].name}</span></button>`).join('')}</div>
    <div class="cond">${cond('雨量', e.rain, '毫米', e.rain >= 150)}${cond('均溫', e.temp, '°C')}${cond('停收', q.stopDays, '天', q.stopDays > 2)}${cond('搜尋關注', nc[W.w], '', nc[W.w] >= 50)}</div>
    <div class="banner">${b}</div>
    ${M.real ? '<p class="note">雨量、氣溫與搜尋關注度仍為模擬。</p>' : ''}`;
}
function statusCitizen(W) {
  const h = M.hexOfLL(S.me.ll[0], S.me.ll[1]), s = h >= 0 ? W.live(h) : 0, q = qs[W.w];
  const tip = W.advice.map(k => RESIDENT[k]).filter(Boolean)[0] || '垃圾不落地、廚餘加蓋，老鼠就沒東西吃。';
  return `<div class="hd"><span>${esc(S.me.label)}</span><span class="date">${Us(W.w)}</span><button type="button" class="live" data-pick="me">換位置</button></div>
    <div class="v3-public-tag" style="--risk:${publicRisk(s).color}"><b>${publicRisk(s).name}</b>｜${publicRisk(s).tip}</div><div class="dialrow"><div class="dial" style="--c:${s >= 85 ? P.hot99 : s >= 65 ? P.hot95 : P.grey}"><b>${s}</b><span>鼠患指數</span></div><div><b class="dword">這一帶${word(s)}</b><p class="muted">${esc(tip)}</p></div></div>
    <div class="banner"><p><b>本週停收 ${q.stopDays} 天${stopTxt(q)}</b>垃圾請在收運當天再拿出門，廚餘記得加蓋。</p></div>
    <button type="button" class="bigbtn repbtn" data-openrep><img class="ratico" src="${RAT_ICON}" alt="" width="34" height="30">我要通報老鼠</button>`;
}
function statusMerchant(W) {
  const sh = S.shop, h = M.hexOfLL(sh.ll[0], sh.ll[1]), s = h >= 0 ? W.live(h) : 0, q = qs[W.w], T = STIERS[sh.tier], nx = STIERS[sh.tier + 1];
  return `<div class="hd"><span>${esc(sh.name)}</span><span class="date">${esc(sh.area)}・模擬店家</span></div>
    <div class="v3-public-tag" style="--risk:${publicRisk(s).color}"><b>周邊${publicRisk(s).name}</b>｜${publicRisk(s).tip}</div><div class="tierrow"><span class="shop ${T.k} big">${T.mark}</span><div><b>${T.name}</b><div class="muted">${nx ? `升級到${nx.name}：連續良好 ${sh.days}／90 天` : '已是最高級'}</div><div class="prog"><i style="width:${Math.min(100, (sh.days / 90) * 100)}%"></i></div></div></div>
    <div class="cond c3">${cond('周邊鼠患指數', s, '', s >= 85)}${cond('300 公尺內近 4 週通報', nearReports(sh.ll, 300, 4), '筆')}${cond('本週停收', q.stopDays, '天', q.stopDays > 2)}</div>
    ${sh.alerts.length ? `<div class="banner"><p><b>${sh.alerts.length} 則新提醒</b>周邊有新通報已派案，到「提醒」看要檢查什麼。</p></div>` : ''}
    <p class="note">系統不會顯示通報者是誰。主動通報、主動改善都不扣分。</p>`;
}
function renderStatus(W) {
  $('#status').innerHTML = S.role === 'gov' ? statusGov(W) : S.role === 'citizen' ? statusCitizen(W) : statusMerchant(W);
}

/* ---------- 市府：派案 ---------- */
function areaCard(a, W) {
  return `<article class="tri l${a.lv}${S.sel === a.h ? ' sel' : ''}">${band(a.lv)}<div class="body">
    <div class="between"><button type="button" class="go" data-go="${a.h}">${esc(M.placeOf(a.h))}一帶</button>${sevPill(a.sev)}</div>
    <span class="meta">${esc(M.districtOf(a.h))}・${M.realReports ? `見鼠地圖 ${a.nRadar} 筆` : `1999 陳情 ${a.n1999} 筆、見鼠地圖 ${a.nRadar} 筆`}</span>
    <span class="to">派給 ${esc(govTo(a.lv))}</span>
    <span class="act">${esc(govAct(a))}</span>
    ${govActs(a, W)}${govMore(a, W)}
  </div></article>`;
}
function mineCard(r) {
  const chips = [...r.j.signs, ...r.j.places].map(x => `<span class="chip">${esc(x)}</span>`).join('');
  return `<article class="tri l${r.lv}${r.dispatched ? '' : ' new'}">${band(r.lv)}<div class="body">
    <span class="meta">市民通報・${wkTxt(NW)}・${r.hex >= 0 ? esc(M.placeOf(r.hex)) + '一帶' : '臺北市界外'}</span>
    <span class="txt">「${esc(r.text)}」</span>${chips ? `<span class="chips">${chips}</span>` : ''}
    <span class="why">${esc(cleanWhy(r.t.why))}</span>
    <span class="to">${r.lv ? '派給 ' + esc(LV[r.lv].to) : esc(r.t.to)}</span>
    <span class="sevrow">${sevPill(r.sev)}</span>${sevDetails(r.sev)}
    <span class="acts">${r.dispatched ? `<span class="chip ok">已派案：${esc(r.dispatched)}</span>` : `<button type="button" class="btn solid" data-dispc="${r.id}">${r.lv ? DISP[r.lv] : '轉介'}</button>`}<button type="button" class="btn" data-minego="${r.id}">在地圖上看</button></span>
  </div></article>`;
}

/* ===== V2｜城市處方箋：政府審核與執行狀態（僅前端模擬） ===== */
const RX_STAGES = ['待審核','已核准派案','單位執行中','改善完成・待覆核','覆核通過・持續監測'];
const RX_RANK = {1:'L1 緊急處置',2:'L2 優先處理',3:'L3 一般處理',4:'L4 追蹤觀察',5:'L5 記錄與衛教'};
const RX_SOURCE = {cross:'跨域熱點',poison:'鼠跡異常',hidden:'疑似結構問題',habitat:'環境源頭'};
const RX_KEYS = ['排水與設施檢查','垃圾與廚餘管理','食品衛生與店家輔導','社區安全觀察'];
const RX_STEPS = {
  1:[0,1,2,3,4], 2:[0,1,2,3,4], 3:[0,1,2,3,4], 4:[0,1,2,3,4], 5:[0,1,2,3,4]
};
const RX_CASES = Object.create(null);
function rxStage(id){return RX_CASES[id] || 0}
function rxOrders(a){
 const tags=a.tagN||{}, txt=(a.why||[]).join(' ');
 const out=[];
 if(tags.sewer || tags.construction || /排水|水溝|管線|孔洞|人孔/.test(txt)) out.push('排水及設施管理權責單位：查核管線、孔洞與設施修繕需求');
 if(tags.garbage || /垃圾|廚餘|清運/.test(txt)) out.push('環境清潔權責單位：查核垃圾暫存、清運量能與現場清潔');
 if(tags.foodbiz || /餐飲|食安|商家|市場|夜市/.test(txt)) out.push('衛生相關權責單位：查核食品衛生並輔導店家源頭改善');
 if(!out.length) out.push('市府治理窗口：先安排現場確認鼠跡、辨識問題源頭');
 out.push('里長與自願市民：僅在任務核准後參與安全的非接觸式觀察與回報');
 return out;
}
function rxPrescription(a,W){
 if(!a)return '';
 const key=W.w+':'+a.h, stage=rxStage(key);
 return `<div class="v2-process"><div class="between"><h4>城市處方箋｜${esc(M.placeOf(a.h))}一帶</h4><span class="chip">${RX_RANK[a.lv]||'待檢傷'}</span></div>
 <p class="v2-kicker">AI 輔助建議・權責須經政府確認・示範資料</p>
 <p class="v2-source">風險線索：${esc((a.why||[]).slice(0,2).join('；')||'依現有監測資料判讀')}</p>
 <div class="v2-steps">${RX_STAGES.map((x,i)=>`<span class="v2-step ${stage===i?'current':''}">${i+1}. ${x}</span>`).join('')}</div>
 ${rxOrders(a).map(x=>`<p class="v2-source">・${esc(x)}</p>`).join('')}
 <div class="v2-action"><button type="button" data-rx="prev" data-rxkey="${key}" ${stage===0?'disabled':''}>上一步</button><button type="button" data-rx="next" data-rxkey="${key}" ${stage===4?'disabled':''}>${stage===0?'市府核准派案':stage===3?'確認覆核':'更新執行進度'}</button></div>
 <p class="v2-source">示範工作流程，不會實際通知局處或民眾；覆核應依後續監測資料，不以完成任務直接視為鼠患消失。</p></div>`;
}
function rxGovIntro(){return `<section class="sec"><h3>城市處方箋｜市府治理中心</h3><p class="lead">有鼠請回答：政府主責源頭改善、AI 協助判讀與建議、市民及店家自願協作。以案件五級檢傷決定急迫程度；依問題來源建議一個或多個執行單位，經市府核准後追蹤成果。</p><div class="v2-trio"><span class="v2-risk v2-r1"><i></i>政府：五級案件檢傷</span><span class="v2-risk v2-r2"><i></i>民眾與店家：三級區域風險</span></div><p class="v2-source">風險評分、主管機關與派工流程為產品示意，不是臺北市政府正式派工結果。</p></section>`}
S.qv = 'area';
// 志工任務只在最新一週產生；依區塊整理，區塊卡用來顯示「這一帶有幾項志工任務」
const tasksByHex = () => { const m = new Map(); for (const x of govTasks(M.week(NW))) { if (!m.has(x.hex)) m.set(x.hex, []); m.get(x.hex).push(x); } return m; };
function mineRow(r) {
  const short = r.text.length > 30 ? r.text.slice(0, 30) + '…' : r.text;
  return `<article class="mrow${r.dispatched ? '' : ' new'}"><span class="lvdot l${r.lv}">${r.lv || '轉'}</span>
    <div class="mb"><b>「${esc(short)}」</b><span class="meta">${r.hex >= 0 ? esc(M.placeOf(r.hex)) + '一帶' : '臺北市界外'}・${wkTxt(NW)}</span>
      <span class="mto">${r.dispatched ? `<span class="chip ok">已派案：${esc(r.dispatched)}</span>` : `建議派給 ${esc(r.lv ? LV[r.lv].to : r.t.to)}`}</span>
      <details><summary>判讀依據與嚴重度</summary><span class="why">${esc(cleanWhy(r.t.why))}</span><span class="sevrow">${sevPill(r.sev)}</span></details></div>
    <div class="macts">${r.dispatched ? '' : `<button type="button" class="btn solid" data-dispc="${r.id}">${r.lv ? DISP[r.lv] : '轉介'}</button>`}<button type="button" class="btn" data-minego="${r.id}">地圖</button></div></article>`;
}
/* ---------- 市府端：派案卡與地圖彈窗共用（主要資訊外露，判讀依據與進度收進展開） ---------- */
const govTo = lv => LV[lv].to.replace('（待審核）', '');
const govAct = a => (a.clue && a.lv < 5 ? TAG_ACT[a.clue].split('：').pop() : LV[a.lv].act);
function govActs(a, W) {
  const key = W.w + ':' + a.h, st = rxStage(key);
  if (!S.done.has(key)) return `<div class="gacts"><button type="button" class="btn${a.lv < 5 ? ' solid' : ''}" data-disp="${a.h}">${DISP[a.lv]}</button></div>`;
  if (a.lv === 5) return '<div class="gacts"><span class="chip ok">已列入紀錄</span></div>';
  return `<div class="gacts"><span class="gstage"><b>${st + 1}／5</b>${RX_STAGES[st]}</span>${st < 4 ? `<button type="button" class="btn" data-rx="next" data-rxkey="${key}">下一步：${RX_STAGES[st + 1]}</button>` : ''}</div>`;
}
/* 市府和店家：這一帶的店家、通知自主檢查（店家端「提醒」會收到） */
S.shopNotified = new Set();
function govShops(a) {
  const c = M.hexLL(a.h), sh = S.shop, out = [];
  if (dist(sh.ll, c) < 400) out.push({ name: sh.name, tier: STIERS[sh.tier].name, mine: true,
    st: sh.recheck ? '已申請複檢' : sh.fixed ? '已回報改善' : '待改善：不留孔洞' });
  SHOPS.filter(s => dist(s.ll, c) < 400).sort((x, y) => dist(x.ll, c) - dist(y.ll, c)).slice(0, 4)
    .forEach(s => out.push({ name: s.name, tier: STIERS[s.tier - 1].name, st: `巡查合格率 ${s.pass}%` }));
  return out;
}
const SHOP_ACT = { foodbiz: '收攤後清空廚餘、食材加蓋密封', sewer: '檢查店內排水孔與後門縫隙', garbage: '廚餘桶加蓋，依收運時間拿出', indoor: '封住管線孔與冷氣孔', alley: '清掉後巷堆放的雜物與棧板' };
const shopAct = a => Object.keys(a.tagN).filter(k => SHOP_ACT[k]).sort((x, y) => a.tagN[y] - a.tagN[x]).slice(0, 2).map(k => SHOP_ACT[k]).join('；') || '檢查店內孔洞、食材存放與廚餘';
function govShopSec(a, W) {
  const ss = govShops(a), key = W.w + ':' + a.h;
  if (!ss.length || a.lv === 5) return '';
  return `<h5>這一帶的店家</h5><ul class="gshops">${ss.map(s => `<li><b>${esc(s.name)}</b>${s.mine ? '<span class="chip">示範店家</span>' : ''}<span class="muted">${esc(s.tier)}・${esc(s.st)}</span></li>`).join('')}</ul>
    <div class="gacts">${S.shopNotified.has(key) ? `<span class="chip ok">已通知 ${ss.length} 家自主檢查</span>` : `<button type="button" class="btn" data-gshop="${a.h}">通知 ${ss.length} 家店自主檢查</button>`}</div>`;
}
function govNotifyShops(h) {
  const W = M.week(S.week), a = W.areas.get(h);
  if (!a) return;
  const ss = govShops(a);
  S.shopNotified.add(W.w + ':' + h);
  if (ss.some(s => s.mine)) (S.shop.govNotes = S.shop.govNotes || []).unshift({ place: M.placeOf(h), lv: a.lv, act: shopAct(a) });
  toast(`已通知 ${ss.length} 家店家自主檢查`);
  render();
  refreshPop();
}
const govMore = (a, W) => `<button type="button" class="glink" data-gdet="${a.h}">${S.done.has(W.w + ':' + a.h) && a.lv < 5 ? '判讀依據、分工與進度' : '判讀依據與分工'}${govShops(a).length && a.lv < 5 ? '・店家' : ''} ›</button>`;
/* 細節另開彈窗：卡片和地圖彈窗都只放摘要 */
function popGovDetail(a, W) {
  const key = W.w + ':' + a.h, st = rxStage(key), done = S.done.has(key) && a.lv < 5;
  const tags = Object.entries(a.tagN).sort((x, y) => y[1] - x[1]).map(([k, n]) => `<span class="chip">${TAG_ZH[k]} ${n}</span>`).join('');
  const ord = a.lv < 5 ? rxOrders(a).filter(x => !x.startsWith('里長')) : [];
  return head(a.h, wkTxt(W.w)) + `<div class="gdet">
    <button type="button" class="glink" data-gback="${a.h}">‹ 回到摘要</button>
    <div class="tri mini l${a.lv}">${band(a.lv)}<div class="body"><span class="to">派給 ${esc(govTo(a.lv))}</span><span class="act">${esc(govAct(a))}</span></div></div>
    ${govActs(a, W)}
    ${done ? `<h5>處理進度</h5><ol class="gsteps">${RX_STAGES.map((x, i) => `<li class="${i < st ? 'ok' : i === st ? 'cur' : ''}">${x}</li>`).join('')}</ol>${st > 1 ? `<div class="gacts"><button type="button" class="btn" data-rx="prev" data-rxkey="${key}">退回上一步</button></div>` : ''}` : ''}
    ${ord.length ? `<h5>建議分工</h5><ul class="gord">${ord.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    ${govShopSec(a, W)}
    <h5>判讀依據</h5>${tags ? `<span class="chips">${tags}</span>` : ''}<p class="gwhy">${esc(cleanWhy(a.why))}</p>
    ${sevTable(a.sev, a.reps.length > 1 ? `以本格 ${a.reps.length} 筆中最嚴重的一筆計` : '')}
  </div></div>`;
}
function govPop(h, detail) {
  const W = M.week(S.week), a = W.areas.get(h);
  if (!a) return;
  S.popFn = () => (detail ? popGovDetail : popArea)(M.week(S.week).areas.get(h), M.week(S.week));
  showPop(S.popFn());
}
function rxMove(k, dir) {
  RX_CASES[k] = Math.min(4, Math.max(1, rxStage(k) + (dir === 'next' ? 1 : -1)));
  toast(`進度更新：${RX_STAGES[RX_CASES[k]]}`);
  renderQueue(M.week(S.week));
  refreshPop();
}
function renderQueue(W) {
  const el = $('#p-queue'), qv = S.qv;
  const key = [W.w, S.filter, S.mine.length, S.mine.filter(r => r.dispatched).length, qv].join('/'), keep = el.dataset.k === key, st = el.scrollTop;
  el.dataset.k = key;
  const list = S.filter ? W.list.filter(a => a.lv === S.filter) : W.list;
  const doneN = W.list.filter(a => S.done.has(W.w + ':' + a.h)).length;
  const pendMine = S.mine.filter(r => !r.dispatched), pendTask = govTasks(M.week(NW)).filter(x => !S.taskReviews[x.id]).length;
  const tabs = [['area', '區塊派案', W.list.length - doneN], ['mine', '市民通報', pendMine.length], ['task', '志工任務', pendTask]];
  let head = `<div class="qtabs" role="tablist" aria-label="派案類別">${tabs.map(([k, n, c]) => `<button type="button" role="tab" data-qv="${k}" aria-selected="${qv === k}">${n}${c ? `<span class="qn${k === 'mine' ? ' hot' : ''}">${c}</span>` : ''}</button>`).join('')}</div>`;
  let h = '';
  if (qv === 'area') {
    head += `<div class="lvbar" role="group" aria-label="依級別篩選">` + [0, 1, 2, 3, 4, 5].map(l => `<button type="button" data-f="${l}" aria-pressed="${S.filter === l}">${l ? `<span class="lvdot l${l}">${l}</span>` : '<span class="all">全部</span>'}<b>${l ? W.lvN[l] : W.list.length}</b></button>`).join('') + '</div>';
    if (pendMine.length) h += `<button type="button" class="qnotice" data-qv="mine"><b>${pendMine.length} 筆新的市民通報待派</b><span>前往處理 ›</span></button>`;
    h += `<p class="lead">第 ${W.w} 週・${W.reps.length} 筆通報・${W.list.length} 個區塊${doneN ? `・已派 ${doneN}` : ''}</p>`;
    if (!W.list.length) h += '<div class="empty">這一週沒有通報。拖曳下方時間軸換一週。</div>';
    else if (!list.length) h += `<div class="empty">這一週沒有 ${S.filter} 級區塊。<br><button type="button" class="btn" data-f="0">看全部區塊</button></div>`;
    const tm = W.w === NW ? tasksByHex() : null;
    h += list.slice(0, 40).map(a => {
      const ts = tm && tm.get(a.h), pend = ts ? ts.filter(x => !S.taskReviews[x.id]).length : 0;
      const link = ts ? `<button type="button" class="qlink" data-go="${a.h}">這一帶有 ${ts.length} 項志工任務${pend ? `・${pend} 項待核准` : ''} ›</button>` : '';
      return areaCard(a, W).replace('</div></article>', link + '</div></article>');
    }).join('');
    if (list.length > 40) h += `<p class="muted">另有 ${list.length - 40} 個區塊，可以用上方的級別篩選。</p>`;
  } else if (qv === 'mine') {
    const done = S.mine.filter(r => r.dispatched);
    if (!S.mine.length) h += '<div class="empty">目前沒有新的市民通報。可以切到市民身份送一筆試試看。</div>';
    if (pendMine.length) {
      h += `<div class="between qgrp"><b>待派 ${pendMine.length} 筆</b>${pendMine.length > 1 ? `<button type="button" class="btn solid" data-dispall>全部依建議派案</button>` : ''}</div>`;
      h += pendMine.slice().sort((a, b) => (a.lv || 9) - (b.lv || 9) || b.sev.score - a.sev.score).map(mineRow).join('');
    }
    if (done.length) h += `<details class="qdone"${pendMine.length ? '' : ' open'}><summary>已派案 ${done.length} 筆</summary>${done.map(mineRow).join('')}</details>`;
  } else {
    h += renderTaskApprovals();
  }
  el.innerHTML = `<div class="qhead">${head}</div>` + h;
  el.scrollTop = keep ? st : 0;
}
function dispatch(h) {
  const W = M.week(S.week), a = W.areas.get(h);
  if (!a) return;
  S.done.add(W.w + ':' + h);
  if (a.lv < 5) RX_CASES[W.w + ':' + h] = 1;
  toast(a.lv < 5 ? `已派給 ${govTo(a.lv)}` : '已列入紀錄');
  renderQueue(W);
  refreshPop();
}
function dispatchMine(id) {
  const r = S.mine.find(x => x.id === id);
  if (!r) return;
  r.dispatched = r.lv ? LV[r.lv].to : r.t.to;
  const near = dist(r.ll, S.shop.ll) < 500;
  if (near) S.shop.alerts.unshift({ text: r.text.length > 24 ? r.text.slice(0, 24) + '…' : r.text, to: r.dispatched, sev: r.sev });
  toast(`已派案：${r.dispatched}${near ? '，並提醒周邊店家' : ''}`);
  render();
}
function goMine(id) {
  const r = S.mine.find(x => x.id === id);
  if (!r) return;
  if (S.week !== NW) setWeek(NW);
  if (S.view !== 'triage') setView('triage');
  map.flyTo(r.ll, 16, { duration: RM.matches ? 0 : 0.7 });
  setTimeout(() => openPop(r.ll, popMine(r)), RM.matches ? 50 : 760);
  if (!wide()) $('#side').classList.add('min');
}
function focusArea(h) {
  if (S.view !== 'triage') setView('triage');
  const W = M.week(S.week), a = W.areas.get(h), ll = M.hexLL(h);
  S.sel = h;
  drawSel();
  $$('#p-queue .tri').forEach(el => el.classList.toggle('sel', el.querySelector(`[data-go="${h}"]`) != null));
  map.flyTo(ll, Math.max(map.getZoom(), 15), { duration: RM.matches ? 0 : 0.7 });
  if (a) setTimeout(() => { S.popFn = () => popArea(a, W); showPop(S.popFn()); }, RM.matches ? 50 : 780);
  if (!wide()) $('#side').classList.add('min');
}

/* ---------- 市府：總覽（鼠患檢傷站的分級分布：逐筆計數、每週通報量、全部通報） ---------- */
function stackChart(W) {
  const BW = 10, H = 96, weeks = [];
  let mx = 1;
  for (let w = 1; w <= NW; w++) {
    const c = M.week(w).repN.slice();
    if (w === NW) S.mine.forEach(r => c[r.lv]++);
    const t = c.reduce((a, b) => a + b, 0);
    weeks.push({ w, c, t });
    mx = Math.max(mx, t);
  }
  let g = `<rect x="0" y="0" width="${NW * BW}" height="${H}" rx="4" style="fill:var(--mint)"/>`;
  for (const x of weeks) {
    const X = (x.w - 1) * BW + 1.2, bw = BW - 2.4, th = x.t ? Math.max(2, Math.sqrt(x.t / mx) * (H - 6)) : 0;
    let y = H;
    for (const k of [1, 2, 3, 4, 5, 0]) {
      if (!x.c[k]) continue;
      const hh = (th * x.c[k]) / x.t;
      y -= hh;
      g += `<rect x="${X}" y="${y.toFixed(2)}" width="${bw}" height="${hh.toFixed(2)}" style="fill:var(--l${k})"/>`;
    }
    if (th) g += `<rect x="${X}" y="${(H - th).toFixed(2)}" width="${bw}" height="${th.toFixed(2)}" fill="none" style="stroke:var(--edge)" stroke-width="${x.w === W.w ? 1.6 : 0.5}"/>`;
    g += `<rect x="${(x.w - 1) * BW}" y="0" width="${BW}" height="${H + 10}" fill="transparent" data-ovweek="${x.w}"><title>第 ${x.w} 週（${Us(x.w)}）：${x.t} 筆</title></rect>`;
  }
  g += `<path d="M${(W.w - 1) * BW + BW / 2 - 4.5},${H + 9} l4.5,-6 l4.5,6z" style="fill:var(--ink)"/>`;
  g += Xs.map(m => `<text x="${(m.week - 1) * BW + 1}" y="${H + 22}" style="fill:var(--muted);font-size:11px;font-family:var(--round)">${m.month} 月</text>`).join('');
  return `<svg class="stack" viewBox="0 0 ${NW * BW} ${H + 26}" role="img" aria-label="第 1 到 41 週每週通報量，依級別堆疊，最多一週 ${mx} 筆">${g}</svg>
    <p class="muted">最多一週 ${mx} 筆（平方根刻度）。${M.realReports ? '' : '見鼠地圖第 17 週上線後通報暴增，判斷熱點前要先扣掉這種「上線效應」。'}</p>`;
}
function repCard(x) {
  const r = x.r;
  if (x.mine) return `<article class="tri l${r.lv}">${band(r.lv)}<div class="body"><span class="meta">${wkTxt(NW)}・市民通報・${r.hex >= 0 ? esc(M.districtOf(r.hex)) : '臺北市界外'}</span><span class="txt">${esc(r.text)}</span>
    <span class="to">${r.dispatched ? '已派案：' + esc(r.dispatched) : r.lv ? '派給 ' + esc(LV[r.lv].to) : esc(r.t.to)}</span><span class="sevrow">${sevPill(r.sev)}</span><span class="acts"><button type="button" class="btn" data-minego="${r.id}">在地圖上看</button></span></div></article>`;
  const done = S.done.has(r.w + ':' + r.hex);
  const what = r.desc ? `<span class="txt">${esc(r.desc)}</span>` : r.src === 'radar'
    ? `<span class="chips">${r.j.tags.length ? r.j.tags.map(k => `<span class="chip">${TAG_ZH[k]}</span>`).join('') : '<span class="chip">一般目擊</span>'}</span>`
    : '<span class="why">1999 陳情沒有描述，依位置分級</span>';
  return `<article class="tri l${r.lv}">${band(r.lv)}<div class="body"><span class="meta">${wkTxt(r.w)}・${esc(M.districtOf(r.hex))}・${r.src === 'radar' ? '見鼠地圖' : '1999 陳情'}</span>${what}
    <span class="to">${r.lv ? '派給 ' + esc(LV[r.lv].to) : esc(r.t.to)}${done ? '・已隨區塊派案' : ''}</span><span class="sevrow">${sevPill(r.sev)}</span><span class="acts"><button type="button" class="btn" data-rep="${r.id}">在地圖上看</button></span></div></article>`;
}
function renderOverview(W) {
  const el = $('#p-over');
  if (!el) return;
  const wkScope = S.ov.scope === 'week', reps = wkScope ? W.reps : M.all(), mine = wkScope && W.w !== NW ? [] : S.mine;
  const pool = mine.map(r => ({ mine: true, w: NW, lv: r.lv, sev: r.sev, r })).concat(reps.map(r => ({ mine: false, w: r.w, lv: r.lv, sev: r.sev, r })));
  const n = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, bc = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let na = 0;
  pool.forEach(x => { n[x.lv]++; if (x.sev && !x.sev.na) bc[x.sev.band.k]++; else na++; });
  const total = pool.length, f = S.ov.f, bf = S.ov.band, pct = k => (total ? Math.round((n[k] / total) * 100) : 0);
  const bandName = k => M.BANDS.find(b => b.k === k).name;
  const items = pool.filter(x => (f == null || x.lv === f) && (bf == null || (x.sev && !x.sev.na && x.sev.band.k === bf)))
    .sort(S.ov.sort === 'sev' ? (a, b) => b.sev.score - a.sev.score || b.w - a.w : (a, b) => b.w - a.w || a.lv - b.lv || b.sev.score - a.sev.score);
  const key = [S.ov.scope, f, bf, S.ov.sort, W.w].join('/'), keep = el.dataset.k === key, st = el.scrollTop;
  el.dataset.k = key;
  let h = `<div class="seg" role="group" aria-label="統計範圍"><button type="button" data-ovscope="all" aria-pressed="${!wkScope}">全期</button><button type="button" data-ovscope="week" aria-pressed="${wkScope}">第 ${W.w} 週</button></div>`;
  h += `<div class="between"><h3>分級分布</h3><button type="button" class="btn" data-gotab="p-rules">通報資料的限制</button></div>`;
  h += `<p class="lead">${wkScope ? `第 ${W.w} 週（${Us(W.w)}）` : '第 1–41 週'}共 ${total.toLocaleString('zh-TW')} 筆通報（${M.realReports ? '見鼠地圖' : '1999 陳情與見鼠地圖，模擬'}${mine.length ? '，含市民通報' : ''}）</p>`;
  h += '<div class="lvbar l7 stick" role="group" aria-label="依級別篩選通報">' +
    [null, 1, 2, 3, 4, 5, 0].map(k => `<button type="button" data-ovf="${k == null ? 'all' : k}" aria-pressed="${f === k}" aria-label="${k == null ? '全部' : k ? k + ' 級' + LV[k].name : '轉介'} ${k == null ? total : n[k]} 筆">${k == null ? '<span class="all">全部</span>' : `<span class="lvdot l${k}">${k || '轉'}</span>`}<b>${(k == null ? total : n[k]).toLocaleString('zh-TW')}</b><span class="k">${k == null ? '筆' : pct(k) + '%'}</span></button>`).join('') + '</div>';
  h += '<h3>嚴重度分布</h3>';
  h += `<div class="sevbar" aria-hidden="true">${[4, 3, 2, 1].map(k => (bc[k] ? `<i class="b${k}" style="flex:${bc[k]}"></i>` : '')).join('')}</div>`;
  h += `<div class="sevlg" role="group" aria-label="依嚴重度篩選">${[4, 3, 2, 1].map(k => `<button type="button" data-ovband="${k}" aria-pressed="${bf === k}"><i class="b${k}"></i>${bandName(k)} ${bc[k].toLocaleString('zh-TW')}</button>`).join('')}${na ? `<span class="muted">不計分 ${na}</span>` : ''}</div>`;
  h += '<h3>每週通報量</h3>' + stackChart(W);
  const title = [f == null ? '' : f ? `${f} 級・${LV[f].name}` : '轉介', bf == null ? '' : bandName(bf)].filter(Boolean).join('・') || (wkScope ? '本週全部通報' : '全部通報');
  h += `<h3>${title}（${items.length.toLocaleString('zh-TW')} 筆）</h3>`;
  h += `<div class="seg" role="group" aria-label="排序"><button type="button" data-ovsort="recent" aria-pressed="${S.ov.sort !== 'sev'}">近的在前</button><button type="button" data-ovsort="sev" aria-pressed="${S.ov.sort === 'sev'}">指數高的在前</button></div>`;
  h += items.length ? items.slice(0, 40).map(repCard).join('') : '<div class="empty">沒有符合的通報。換個級別或嚴重度看看。</div>';
  if (items.length > 40) h += `<p class="muted">另有 ${(items.length - 40).toLocaleString('zh-TW')} 筆。可以再用級別或嚴重度篩選，或切到「第 ${W.w} 週」只看這一週。</p>`;
  el.innerHTML = h;
  el.scrollTop = keep ? st : 0;
}
function focusRep(id) {
  const w = +String(id).split('-')[0], r = M.week(w).reps.find(x => x.id === id);
  if (!r) return;
  if (S.week !== w) setWeek(w);
  if (S.view !== 'triage') setView('triage');
  map.flyTo(r.ll, 17, { duration: RM.matches ? 0 : 0.7 });
  setTimeout(() => openPop(r.ll, popRep(r, M.week(w))), RM.matches ? 50 : 780);
  if (!wide()) $('#side').classList.add('min');
}

/* ---------- 市府：餌站觀察（主動監測） ---------- */
function baitChart(W) {
  const BW = 10, H = 80, T = M.stationTrend();
  let g = `<rect x="0" y="0" width="${NW * BW}" height="${H}" rx="4" style="fill:var(--mint)"/>`;
  for (const t of T) {
    if (t.rate == null) continue;
    const h = Math.max(1.5, t.rate * (H - 4));
    g += `<rect x="${(t.w - 1) * BW + 1.2}" y="${(H - h).toFixed(2)}" width="${BW - 2.4}" height="${h.toFixed(2)}" style="fill:var(--bait-hi);stroke:var(--edge)" stroke-width="${t.w === W.w ? 1.6 : 0.5}"/>`;
  }
  for (const t of T) g += `<rect x="${(t.w - 1) * BW}" y="0" width="${BW}" height="${H + 10}" fill="transparent" data-ovweek="${t.w}"><title>第 ${t.w} 週：${t.rate == null ? '沒有觀察' : `${t.act}／${t.seen} 站出現鼠跡（${Math.round(t.rate * 100)}%）`}</title></rect>`;
  const y20 = H - 0.2 * (H - 4);
  g += `<line x1="0" y1="${y20}" x2="${NW * BW}" y2="${y20}" style="stroke:var(--ink)" stroke-width=".8" stroke-dasharray="3 3"/><text x="${NW * BW - 2}" y="${y20 - 3}" text-anchor="end" style="fill:var(--ink);font-size:10px">20%</text>`;
  g += `<path d="M${(W.w - 1) * BW + BW / 2 - 4.5},${H + 9} l4.5,-6 l4.5,6z" style="fill:var(--ink)"/>`;
  g += Xs.map(mm => `<text x="${(mm.week - 1) * BW + 1}" y="${H + 22}" style="fill:var(--muted);font-size:11px;font-family:var(--round)">${mm.month} 月</text>`).join('');
  return `<svg class="stack" viewBox="0 0 ${NW * BW} ${H + 26}" role="img" aria-label="每週鼠跡比例">${g}</svg>`;
}
function renderBaitPane(W) {
  const el = $('#p-bait');
  if (!el) return;
  const w = W.w, SW = M.stationWeek(w);
  if (!SW.list.length) {
    const first = Math.min(...M.STATIONS.map(s => s.start));
    el.innerHTML = `<p class="lead">第 ${w} 週還沒有設置餌站。${M.realReports ? '投藥區依見鼠地圖的毒餌通報而定。' : '模擬情境的投藥區從第 18 週開始。'}</p>${Number.isFinite(first) ? `<button type="button" class="btn" data-ovweek="${first}">切到第 ${first} 週</button>` : ''}`;
    return;
  }
  const kn = k => SW.list.filter(x => x.s.kind === k).length, cnt = st => SW.list.filter(x => x.cur && x.cur.st === st).length;
  const need = ['dead', 'exposed', 'nontarget', 'moved', 'all', 'caught'].reduce((t, k) => t + cnt(k), 0), late = SW.list.filter(x => x.overdue).length;
  const pri = { dead: 0, exposed: 1, nontarget: 2, moved: 3, caught: 4, all: 5 }, pr = x => (x.cur && pri[x.cur.st] != null ? pri[x.cur.st] : 9);
  const att = SW.list.filter(x => pr(x) < 9 || x.overdue).sort((a, b) => pr(a) - pr(b) || (b.cur && b.cur.mine ? 1 : 0) - (a.cur && a.cur.mine ? 1 : 0));
  let h = `<p class="lead">第 ${w} 週共 ${SW.list.length} 個站（無毒監測 ${kn('monitor')}、上鎖毒餌 ${kn('bait')}、捕鼠籠 ${kn('trap')}），本週有觀察 ${SW.seenN} 個，其中 ${SW.actN} 個出現鼠跡。</p>`;
  h += `<div class="cond">${cond('鼠跡比例', SW.rate == null ? '—' : Math.round(SW.rate * 100), SW.rate == null ? '' : '%', SW.rate >= 0.2)}${cond('籠內有鼠', cnt('caught'), '站')}${cond('需要處理', need, '站', need > 0)}${cond('逾期未觀察', late, '站', late > 0)}</div>`;
  h += '<h3>每週鼠跡比例</h3>' + baitChart(W) + '<p class="muted">虛線 20%：香港食環署成立跨部門工作小組的門檻。</p>';
  h += `<h3>需要處理（${att.length}）</h3>`;
  h += att.length ? att.map(x => {
    const s = x.s, K = KIND[s.kind], st = x.cur ? M.ST[s.kind][x.cur.st] : '本週沒有觀察';
    return `<article class="task"><div class="between"><b>${K} ${esc(s.code)}</b><span class="chip${x.cur && x.cur.mine ? ' ok' : ''}">${esc(st)}</span></div><span class="meta">${esc(M.placeOf(s.hex))}一帶・${x.last ? `最近觀察第 ${x.last.w} 週（${esc(x.last.by)}）` : '還沒有觀察紀錄'}</span>
      <span class="act">${esc(x.cur && M.ALERT[x.cur.st] ? M.ALERT[x.cur.st] : '超過 2 週沒有觀察：請巡查員或志工補看。')}</span><div class="acts"><button type="button" class="btn" data-stn="${s.id}">在地圖上看</button></div></article>`;
  }).join('') : '<div class="empty">本週沒有需要處理的站。</div>';
  h += `<details class="gmore"><summary>分工與限制</summary><p class="muted">監測用無毒餌塊，鼠跡比例主要靠它；毒餌只由社區環境衛生師或合格病媒防治業者投放，公園綠地 1 公里內不放，附近有蛇類目擊改用捕鼠籠；回報有其他動物接觸，毒餌盒就先暫停。市民只觀察、拍照回報，不投放、不碰觸。鼠跡比例＝本週有觀察的站中，餌被吃、籠內有鼠或附近有死鼠的比例；這裡的站都設在投藥區，比例會比全面抽樣高，適合看同一區的趨勢。餌站位置與觀察紀錄為模擬資料。</p></details>`;
  el.innerHTML = h;
}
function focusStation(id) {
  let x = M.stationWeek(wk()).list.find(o => o.s.id === id);
  if (!x && S.role === 'gov') { setWeek(NW); x = M.stationWeek(NW).list.find(o => o.s.id === id); }
  if (!x) return;
  if (S.role === 'gov' && S.view !== 'bait') { S.view = 'bait'; render(); }
  map.flyTo(x.s.ll, 17, { duration: RM.matches ? 0 : 0.7 });
  setTimeout(() => openPop(x.s.ll, popStation(x, wk())), RM.matches ? 50 : 760);
  if (!wide()) $('#side').classList.add('min');
}

/* ---------- 共用：AI 判讀預覽 ---------- */
function preview(text, ll, w, lead) {
  text = (text || '').trim();
  if (!text) return '<div class="empty">輸入看到的情況，這裡會即時顯示分級和負責單位。</div>';
  const W = M.week(w), h = ll ? M.hexOfLL(ll[0], ll[1]) : -1;
  const j = M.judge(text, 'form'), t = M.triage(j, W.ctx(h)), sv = M.severity(j, W.ctx(h), { text, src: 'form', tags: [], w });
  const chips = [...j.signs, ...j.places].map(x => `<span class="chip">${esc(x)}</span>`).join('') || '<span class="chip">一般目擊</span>';
  return `<div class="tri l${t.lv}">${band(t.lv)}<div class="body"><span class="between"><span class="ai">AI 判讀・信心 ${Math.round(j.conf * 100)}%</span>${sevPill(sv)}</span><span class="chips">${chips}</span>
    <span class="to">${t.lv ? (lead || '會送到') + ' ' + esc(LV[t.lv].to) : esc(t.to)}</span><span class="why">${esc(cleanWhy(t.why))}</span>${t.lv ? `<span class="act">${esc(LV[t.lv].act)}</span>` : ''}</div></div>${sevTable(sv)}`;
}

/* ---------- 市府：試判 ---------- */
function renderTryPane() {
  $('#p-try').innerHTML = `<div class="sec"><span id="tryWk" hidden></span>
    <label class="lab" for="draft">看到什麼？</label>
    <textarea id="draft" rows="3" placeholder="例如：寧夏夜市旁的水溝蓋縫，晚上一直有老鼠鑽進鑽出">${esc(S.draft)}</textarea>
    <div class="row"><button type="button" class="btn" id="pick" data-pick="try" aria-pressed="false">在地圖上選位置</button><span class="muted" id="locLab"></span></div></div>
    <div class="sec" id="pv" aria-live="polite"></div>
    <div class="sec"><h3>同一句話，不同處置</h3><p class="muted">「看到一隻老鼠跑過去」放在本週風險最高的源頭區塊，和一般住宅區：</p><div class="cmp" id="cmp"></div></div>`;
}
function compare() {
  const W = M.week(S.week), src = M.MASKED.filter(i => W.risk.cls[i] === 'source');
  if (!src.length) return '';
  const hi = src.reduce((b, i) => (W.live(i) > W.live(b) ? i : b), src[0]);
  const lo = W.ord[Math.round(W.ord.length * 0.3)];
  const j = M.judge('看到一隻老鼠跑過去', 'form');
  return [hi, lo].map(h => {
    const t = M.triage(j, W.ctx(h));
    return `<div><span class="lvdot l${t.lv}">${t.lv}</span><b>${t.lv} 級・${LV[t.lv].name}</b><span>${esc(M.placeOf(h))}一帶（${esc(M.districtOf(h))}），區塊風險 ${W.live(h)}</span><span class="muted">${esc(LV[t.lv].to)}</span><button type="button" class="btn" data-fly="${h}">在地圖上看</button></div>`;
  }).join('');
}
function updateTry() {
  if (!$('#pv')) return;
  const h = S.loc ? M.hexOfLL(S.loc[0], S.loc[1]) : -1;
  $('#tryWk').textContent = S.week;
  $('#locLab').textContent = h >= 0 ? `位置：${M.placeOf(h)}一帶（${M.districtOf(h)}）` : '位置不在臺北市界內';
  $('#pv').innerHTML = preview(S.draft, S.loc, S.week);
  $('#cmp').innerHTML = compare();
}

/* ---------- 市府：依據 ---------- */
function renderRules() {
  const T = M.T;
  $('#p-rules').innerHTML = `<div class="lgm" id="lgMobile"></div><div class="rules">
  <h3>有鼠請回答｜城市急診檢傷</h3><div class="v2-note"><b>內部五級，對外三級</b>市府五級判斷單一案件的處理急迫性；民眾與店家三級呈現區域整體風險。問題類型（管線、垃圾、食安）和責任單位應獨立分類，不應直接等同嚴重度。原始 V1 規則如下，供 MVP 比對與後續校準。</div>
  <p>政府內部依證據強度、集中程度、區域背景及近期異常，判斷單筆事件的處理急迫性；問題類型與權責單位另外判斷。本頁規則均為 MVP 示意，正式標準應由主管機關與專家校準。</p>
  <ol>
    <li><span class="lvdot l1">1</span><span><b>緊急處置</b>：高風險熱點符合集中異常條件，或大量鼠跡與高風險環境重疊；優先專業覆核及必要的跨局處協調。</span></li>
    <li><span class="lvdot l2">2</span><span><b>優先處理</b>：多重異常證據與高風險環境交疊，建議優先安排現場查核。</span></li>
    <li><span class="lvdot l3">3</span><span><b>一般處理</b>：存在具體環境源頭線索，依權責單位安排例行改善。</span></li>
    <li><span class="lvdot l4">4</span><span><b>追蹤觀察</b>：風險訊號有限，保留資料並安排必要觀察。</span></li>
    <li><span class="lvdot l5">5</span><span><b>紀錄與衛教</b>：低風險單次目擊或證據不足，保留紀錄、衛教或請求補充資訊。</span></li>
  </ol>
  <h3>對外三級區域風險</h3>
  <p>民眾與店家不顯示個案五級檢傷，僅顯示區域風險：高風險（區域分數 70 以上）、中風險（40–69）、低風險（40 以下）。三級反映整體區域風險，不是把內部五級直接合併。區域模型沿用 V1 的模擬分數，門檻僅為示範。</p>
  <p class="muted">水溝、餐飲、垃圾等為問題來源標籤，供 AI 提出跨局處城市處方箋；不再以「提到水溝即二級」或「餐飲即三級」決定急迫性。轉介或資訊不足的案件不強制歸類為鼠患。</p>
  <h3>嚴重度指數怎麼算</h3>
  <p>每一筆通報把符合的危險因子加總成 0–100 的指數，超過 100 以 100 計，再分成四段：危急 70 以上、嚴重 55–69、中等 35–54、輕微 35 以下。每個事件都會列出每個因子的原因、觸發它的事件屬性，以及加了幾分。</p>
  <p>級別和指數用的是同一批事件屬性，但回答不同的問題：級別表示建議處理急迫性；問題類型另決定建議處理單位；指數衡量這個事件有多嚴重，同一級裡指數高的先處理。區塊的指數取格內最嚴重的一筆。</p>
  <table class="sevt rub"><thead><tr><th>危險因子</th><th>加成</th></tr></thead><tbody>${Object.values(M.SEV).map(f => `<tr><th>${f.name}</th><td>${f.rule}</td></tr><tr class="why"><td colspan="2">${typeof f.reason === 'string' ? f.reason : Object.values(f.reason).join('')}</td></tr>`).join('')}</tbody></table>
  <p class="muted">加成與分段門檻是原型假設，正式使用前要用試辦期間的實地查證校準。</p>
  <h3>餌站觀察</h3>
  <p>餌站與捕鼠籠是和通報互相獨立的主動監測。香港食環署自 2000 年起在選定地點放置鼠餌，統計被老鼠咬囓的比例作為鼠患參考指數，指數到 20% 以上會成立跨部門工作小組。檢傷台的餌站設在投藥區，用每週鼠跡比例看趨勢，並佐證通報（嚴重度的「餌站鼠跡」）。毒餌由社區環境衛生師投放，市民只觀察、不投放。</p>
  <h3>非目標物種</h3>
  <p>上鎖餌盒擋得住兒童、貓狗和大型鳥類，擋不住體型和老鼠相近的小動物，也擋不住二次中毒。加州研究拍到原生鼠類與負鼠進出餌盒、松鼠咬穿盒蓋；德國農場研究發現，非目標小型哺乳類的鼠藥殘留集中在餌站 15 公尺內；台灣死亡猛禽六成以上驗出鼠藥，北市與基隆的死亡鳳頭蒼鷹高達 92%。所以檢傷台的監測用無毒餌；公園綠地 1 公里內不放毒餌；附近有蛇改用捕鼠籠；回報其他動物接觸就暫停毒餌；死鳥、死蛇轉介送驗。</p>
  <h3>超商（概念發想）</h3>
  <p>超商視為比餐飲低一級的食物源。區塊風險：每家超商基本權重 1，內用區 +0.6、熱食炸物櫃 +0.4、手搖飲 +0.4、關東煮 +0.3、霜淇淋 +0.3，以 150 公尺範圍累計成超商密度；密度最高的 5% 區塊在區塊風險上加 5 個百分位，其他依比例遞減。只加不減，不改變高風險源頭的分類，也不會讓沒有超商的區塊下降；因為還是假設，派案級別的門檻用未含超商的分數，超商只影響風險顯示與嚴重度排序。對照之下，食物源（市場、夜市）占風險模型的 35%。嚴重度：通報 80 公尺內有超商 +2，有內用區 +1、熱食炸物櫃 +1、關東煮／霜淇淋／手搖任一 +1，最多 +5；描述提到餐飲市場是 +10。</p>
  <p>理由：內用區會在現場留下吃剩的食物；熱食、炸物與關東煮會產生油脂和湯汁廚餘；霜淇淋與手搖飲會留下含糖的杯子與殘渣。國外研究發現餐飲業者密度和鼠類通報位置正相關，但目前沒有超商本身的研究，香港政府也表示沒有明確證據顯示 24 小時營業的食肆會加重鼠患，所以權重刻意壓低。</p>
  <p class="muted">資料：位置可以匯入；沒有匯入時，依公平會 2019 年調查的臺北市 1,631 家，按各區人口規模與商業程度的概略權重分配，區內再沿捷運站與一般街廓模擬位置，不參考鼠患資料，避免自我印證。內用區等設施沒有開放資料，一律模擬：內用區 55%、熱食炸物櫃 50%、關東煮 60%、霜淇淋約 30%、手搖飲約 20%。在「風險」圖例可以關閉超商因子比較差異。</p>
  <h3>三種身份看到的不一樣</h3>
  <p>市民只看到區塊熱度和自己附近的任務，不會看到別人通報的位置；店家收到周邊派案提醒，但看不到通報者；市府看得到每一筆通報與分級依據，負責派案。</p>
  <h3>區塊風險</h3>
  <p>沿用北市鼠情週報的風險模型（食物源 35%、近 8 週通報 25%、下水道 25%、低窪 15%），沿相鄰格子擴散後換算成全市百分位 0–99。缺資料的項目權重重新分配；停收或豪雨週再乘上時間係數，同一筆通報更容易升級。</p>
  <h3>通報的判讀線索</h3>
  <p>有文字描述的見鼠地圖通報直接交給 AI 判讀；沒有原文時，用週報的 7 種線索標籤：水溝、餐飲與垃圾等先視為來源線索，再與區域風險及近期異常共同判定急迫程度；缺少文字的陳情應標記證據限制。</p>
  <h3>為什麼 1 級門檻和鼠患檢傷站不同</h3>
  <p>週報的模擬通報集中在約 20 個公共場所，照原本「周邊占全市 8%、風險 85」，第 19 週會出現 10 個 1 級區塊，幾乎每週都有。這裡改成至少 ${T.n} 筆、占 ${Math.round(T.share * 100)}%、風險 ${T.s1}，並要求 Gi* 99% 顯著，讓 1 級留給真正的群聚。看占全市的比例而不是筆數，新聞或新平台造成的全市暴增也比較不會讓分級失準。</p>
  <h3>使用時要注意</h3>
  <ul>
    <li>門檻都是原型假設，需要用試辦期間的實地查證校準。</li>
    <li>通報記錄的是「誰看見並願意通報」，不是老鼠在哪裡；第 17 週見鼠地圖上線後通報暴增。</li>
    <li>模擬模式的通報、雨量、氣溫、搜尋關注度、蛇類目擊、特攻隊與店家都不代表實際鼠情。名稱開頭為「情境」的地點是虛構的示範情境。</li>
  </ul>
  <h3>圖資來源</h3>
  <p>行政區界與市界：內政部國土測繪中心「鄉鎮市區界線（TWD97 經緯度）」，依政府資料開放授權條款使用。底圖：內政部國土測繪中心臺灣通用電子地圖。熱點、趨勢、蛇鼠、風險、點位與特攻圖層沿用北市鼠情週報的計算。</p></div>`;
}

/* ---------- 市府：資料 ---------- */
function renderData() {
  const el = $('#p-data');
  const files = S.data.files.map(r => `<div class="file${r.kind ? '' : ' bad'}"><div class="between"><b>${esc(r.name)}</b><span class="chip">${r.kind ? DK.KIND_ZH[r.kind] : '無法辨識'}</span></div><p>${esc(r.kind ? DK.summary(r) : r.error)}</p>${r.sample ? '<p class="warn">這看起來是格式範例（數值虛構），只適合測試匯入，不要拿來判讀。</p>' : ''}</div>`).join('');
  el.innerHTML = `<p class="lead">目前地圖用的是<b>${M.real ? '部分真實資料' : '模擬資料'}</b>。${M.real ? `已套用：${esc(M.sources.map(k => SRC_ZH[k] || k).join('、'))}。${M.realReports ? '' : '沒有見鼠地圖檔，通報仍為模擬。'}` : '載入開放資料後，分級、熱點、風險與三種身份的畫面都會改用真實資料重新計算。'}</p>
    <div class="drop" id="drop"><b>把開放資料 CSV 拖到這裡</b><button type="button" class="btn solid" data-pickfiles>選擇檔案</button><input type="file" id="files" hidden accept=".csv,.json,text/csv,application/json" multiple><span class="muted">可以一次選多個；也可以載入 scripts/prepare-data.mjs 產生的 taipei-rat-data.json。</span></div>
    ${files ? `<h3>這次讀到的檔案</h3>${files}` : ''}
    ${M.real ? '<p><button type="button" class="btn" data-resetdata>還原模擬資料</button></p>' : ''}
    <h3>認得的資料</h3>
    <ul class="kinds">
      <li><b>見鼠地圖匯出 CSV</b>：經緯度、時間、類型、描述。描述直接交給 AI 判讀分級，毒餌通報改成投藥區。</li>
      <li><b>1999 陳情類別</b>：只取類別含「鼠」的案件算每週總量；沒有位置，不列入分級。</li>
      <li><b>雨水下水道人孔</b>：TWD97 座標轉經緯度，算每格人孔數與平均地盤標高。</li>
      <li><b>污水下水道管線</b>：人孔編號前 4 碼對應雨水人孔的圖幅，算 1990 年前完工的比例。</li>
      <li><b>食品業者登錄數</b>：行政區總數，平均分給該區的格子。</li>
      <li><b>食物點與棲所</b>：名稱、類別、經緯度；公園、河濱、工地歸為可能棲所；類別寫「便利商店」或名稱是超商的，標成超商；可以加「內用、熱食、關東煮、霜淇淋、手搖」欄位，填有／無，沒有欄位就模擬設施。</li>
      <li><b>超商位置</b>：經濟部商業發展署「全國5大超商資料集」只有地址，要先用門牌定位轉成經緯度，再用上一列的格式匯入。</li>
    </ul>
    <p class="muted">仍為模擬：蛇類目擊、雨量、氣溫、搜尋關注度、特攻隊與店家。</p>
    <p class="muted">檔案只在這台裝置上處理，不會上傳。</p>`;
}
async function handleFiles(list) {
  const files = [...(list || [])];
  if (!files.length) return;
  toast('讀取中…');
  const res = await Promise.all(files.map(f => DK.readFile(f)));
  S.data.files = res;
  const b = DK.build(res);
  if (!b) { renderData(); toast('沒有認得的資料，地圖維持原樣'); return; }
  CUR_BUNDLE = b;
  M = makeModel(OD, b, CVS_OPT);
  afterModelChange();
  toast(`已套用：${b.sources.map(k => SRC_ZH[k] || k).join('、')}`);
}
function resetData() {
  CUR_BUNDLE = null;
  M = makeModel(OD, null, CVS_OPT);
  S.data.files = [];
  afterModelChange();
  toast('已還原模擬資料');
}
function toggleCvs() {
  const old = M.week(S.week), was = M.MASKED.map(i => old.live(i)), src = new Set(M.MASKED.filter(i => old.risk.cls[i] === 'source'));
  CVS_OPT.cvs = !CVS_OPT.cvs;
  M = makeModel(OD, CUR_BUNDLE, CVS_OPT);
  afterModelChange();
  const W = M.week(S.week);
  let up = 0, dn = 0, ch = 0;
  M.MASKED.forEach((i, k) => { const d = W.live(i) - was[k]; if (d >= 3) up++; else if (d <= -3) dn++; if ((W.risk.cls[i] === 'source') !== src.has(i)) ch++; });
  toast(`超商因子已${CVS_OPT.cvs ? '開啟' : '關閉'}：第 ${S.week} 週有 ${CVS_OPT.cvs ? up : dn} 格的區塊風險${CVS_OPT.cvs ? '上升' : '下降'} 3 個百分位以上`);
}
function afterModelChange() {
  deriveShops();
  S.sel = null;
  S.filter = 0;
  map.closePopup();
  initTimeline();
  render();
  drawRadar(M.week(S.week));
  heroStats(M.week(S.week));
}

/* ---------- 市民 ---------- */
function renderReportPane() {
  $('#c-report').innerHTML = `<div class="sec"><label class="lab" for="c-draft">看到什麼？</label>
    <textarea id="c-draft" rows="3" placeholder="例如：巷口垃圾桶旁邊，晚上常有老鼠鑽來鑽去"></textarea>
    <div class="row"><button type="button" class="btn" id="c-pick" data-pick="report" aria-pressed="false">在地圖上選位置</button><span class="muted" id="c-loc"></span></div></div>
    <div class="sec" id="c-pv" aria-live="polite"></div>
    <div class="sec"><button type="button" class="bigbtn" id="c-send" disabled>送出通報</button><p class="muted">請不要觸碰老鼠或毒餌。審核通過後 +5 點。</p></div>
`;
}
function updateReport() {
  if (!$('#c-pv')) return;
  const ll = S.report.ll || S.me.ll, h = M.hexOfLL(ll[0], ll[1]);
  $('#c-loc').textContent = S.report.ll ? (h >= 0 ? `位置：${M.placeOf(h)}一帶` : '位置不在臺北市界內') : `位置：${S.me.label}（你目前的位置）`;
  $('#c-pv').innerHTML = preview(S.report.text, ll, NW, '這筆通報會送到');
  $('#c-send').disabled = !S.report.text.trim();
}
function mineHTML() {
  if (!S.mine.length) return '';
  const card = r => `<div class="tri l${r.lv}">${band(r.lv)}<div class="body"><span class="between"><span class="txt">${esc(r.text)}</span>${r.done ? '<span class="chip donechip">已結案</span>' : sevPill(r.sev)}</span><span class="to">${r.done ? '鼠鼠沒！點我看處理結果 ›' : r.dispatched ? '已派案：' + esc(r.dispatched) : '等待市府派案'}</span></div></div>`;
  return '<div class="sec"><h3>我送出的通報</h3>' + S.mine.map(r => r.done ? `<button type="button" class="minebtn" data-done="${r.id}" aria-haspopup="dialog">${card(r)}</button>` : card(r)).join('') + '</div>';
}
function openDone(id) {
  const r = S.mine.find(x => x.id === id);
  if (!r || !r.done) return;
  const d = r.done;
  $('#doneBody').innerHTML = `<div class="donehero"><svg class="cheese" viewBox="0 0 120 100" width="80" height="67" aria-hidden="true">
<g stroke="#2a2a2a" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
<path d="M14 52 L84 26 L106 46 L106 82 L14 82 Z" fill="#f7c948"/>
<path d="M14 52 L84 26 L106 46 L36 64 Z" fill="#ffe08a"/>
<path d="M36 64 L106 46" fill="none"/>
<path d="M36 64 L36 82" fill="none" stroke-width="3"/>
<ellipse cx="58" cy="72" rx="6" ry="4.5" fill="#e0a92a" stroke-width="3"/>
<circle cx="84" cy="64" r="4" fill="#e0a92a" stroke-width="3"/>
<circle cx="24" cy="70" r="3" fill="#e0a92a" stroke-width="2.5"/>
<ellipse cx="66" cy="45" rx="5" ry="2.6" fill="#f2c13d" stroke-width="2.5"/>
</g>
<g fill="#ffd23f" stroke="#2a2a2a" stroke-width="2" stroke-linejoin="round" class="spk">
<path class="s1" d="M98 6 L101 15 L110 18 L101 21 L98 30 L95 21 L86 18 L95 15 Z"/>
<path class="s2" d="M22 18 L24 24 L30 26 L24 28 L22 34 L20 28 L14 26 L20 24 Z"/>
<path class="s3" d="M112 34 L113.6 38.4 L118 40 L113.6 41.6 L112 46 L110.4 41.6 L106 40 L110.4 38.4 Z"/>
</g></svg><div><b>鼠鼠沒！</b><span>${esc(d.place)}一帶的通報已處理完成，${esc(d.closed)} 結案</span></div></div>
    <p class="donequote">「${esc(r.text)}」</p>
    <h3>處理經過</h3>
    <ol class="donesteps">${d.steps.map(([t, x]) => `<li><time>${esc(t)}</time>${esc(x)}</li>`).join('')}</ol>
    <div class="donepts"><span>謝謝你的通報，審核通過</span><b>+5 點</b></div>
    <p class="muted" style="margin-top:10px">處理經過為模擬資料，示範結案後市民會收到的回覆。</p>`;
  S.doneFrom = document.activeElement;
  $('#doneModal').hidden = false;
  $('#doneClose').focus();
}
function closeDone() {
  if ($('#doneModal').hidden) return;
  $('#doneModal').hidden = true;
  if (S.doneFrom && S.doneFrom.isConnected) S.doneFrom.focus({ preventScroll: true });
}
function seedDone() {
  const ll = [S.me.ll[0] + 0.0012, S.me.ll[1] - 0.0009], h = M.hexOfLL(ll[0], ll[1]), text = '公園旁的資源回收點，傍晚常看到老鼠在紙箱堆裡跑來跑去';
  const j = M.judge(text, 'form'), t = M.triage(j, M.week(NW).ctx(h));
  const place = h >= 0 ? M.placeOf(h) : '雙連';
  const to = t.lv ? LV[t.lv].to : t.to;
  S.mine.push({ id: 'U-demo', ll, hex: h, text, j, t, lv: t.lv, dispatched: to, sev: M.severity(j, M.week(NW).ctx(h), { text, src: 'form', tags: [], w: NW }),
    done: { place, closed: '10/18', steps: [
      ['10/12 19:40', `收到你的通報，AI 判讀為 ${t.lv ? t.lv + ' 級・' + LV[t.lv].name : '待補充'}`],
      ['10/13 09:15', `市府派案給${to}`],
      ['10/14 14:00', '清潔隊清走回收點堆積的紙箱與廚餘，地面沖洗消毒'],
      ['10/15 10:30', '里辦公室在回收點加裝有蓋回收桶，張貼「垃圾不落地」告示'],
      ['10/18 16:20', '社區防鼠巡查員複查，連續 3 天沒有新鼠跡，結案']] } });
}
function sendReport() {
  const text = S.report.text.trim();
  if (!text) return;
  const ll = S.report.ll || S.me.ll, h = M.hexOfLL(ll[0], ll[1]);
  const j = M.judge(text, 'form'), t = M.triage(j, M.week(NW).ctx(h));
  S.mine.unshift({ id: 'U' + Date.now(), ll, hex: h, text, j, t, lv: t.lv, dispatched: null, sev: M.severity(j, M.week(NW).ctx(h), { text, src: 'form', tags: [], w: NW }) });
  S.report = { text: '', ll: null };
  if (PH_EMB) phSay('report', { text, ll });
  $('#c-draft').value = '';
  closeReport();
  toast(t.lv ? `已送出，AI 判讀為 ${t.lv} 級・${LV[t.lv].name}，等待市府派案` : `已送出：${t.to}`);
  render();
}
function taskCard(t) {
  const st = tState(t), pts = xd[t.type].points, mine = st === 'mine' || st === 'finished';
  const act = st === 'finished' ? `<span class="chip ok">已完成 +${pts} 點</span>` : st === 'mine' ? `<button type="button" class="btn solid" data-finish="${t.id}">拍照回報完成</button>`
    : t.status === 'open' ? `<button type="button" class="btn solid" data-join="${t.id}">我順路，加入</button>` : `<span class="chip">${TSTAT[t.status]}</span>`;
  return `<article class="task ti"><span class="tico" style="--c:${P['t-' + t.type]}">${TICON[t.type] || ''}</span><div class="tb"><div class="between"><b>${TASK[t.type]}</b><span class="chip">+${pts} 點</span></div>
    <span class="meta">${esc(t.place)}一帶・離你${distTxt(t.d)}・需要 ${t.need} 人，已加入 ${t.joined + (mine ? 1 : 0)} 人</span>
    <div class="acts"><button type="button" class="btn" data-taskgo="${t.id}">在地圖上看</button>${act}</div></div></article>`;
}
function nearStations() {
  return M.stationWeek(NW).list.map(x => Object.assign({}, x, { d: dist(x.s.ll, S.me.ll) })).filter(x => x.d <= 2500)
    .sort((a, b) => (a.cur && a.cur.mine ? 1 : 0) - (b.cur && b.cur.mine ? 1 : 0) || stAsk(b) - stAsk(a) || b.overdue - a.overdue || a.d - b.d);
}
function stAsk(x) { return S.stPush[x.s.id] && x.overdue && !(x.cur && x.cur.mine) ? 1 : 0;
}
function stationCard(x) {
  const s = x.s, K = KIND[s.kind], mine = x.cur && x.cur.mine;
  const last = x.last ? `最近觀察：第 ${x.last.w} 週，${M.ST[s.kind][x.last.st]}` : '還沒有觀察紀錄';
  const act = mine ? `<span class="chip ok">你本週看到：${M.ST[s.kind][x.cur.st]}</span>`
    : S.obsOpen === s.id ? `<div class="obsf"><p class="muted">從外面看就好，不開盒、不碰餌、不碰籠。你看到：</p><div class="chips">${Object.entries(M.ST[s.kind]).map(([k, n]) => `<button type="button" class="btn" data-obsst="${k}" data-obsid="${s.id}">${n}</button>`).join('')}</div></div>`
    : `<button type="button" class="btn solid" data-obs="${s.id}">我要觀察</button>`;
  return `<article class="task ti${stAsk(x) ? ' ask' : ''}" id="stc-${s.id}"><span class="tico stn">${stnSvg(s.kind, x.last ? stnColor(x.last.st) : P.paper, 28)}</span><div class="tb">${stAsk(x) ? '<span class="askchip">市府請求協助：這個站超過 2 週沒人看</span>' : ''}<div class="between"><b>觀察${K} ${esc(s.code)}</b><span class="chip">+8 點</span></div>
    <span class="meta">${esc(M.placeOf(s.hex))}一帶・離你${distTxt(x.d)}・${esc(last)}${x.overdue ? '・超過 2 週沒人看' : ''}</span>
    <div class="acts"><button type="button" class="btn" data-stn="${s.id}">在地圖上看</button>${act}</div></div></article>`;
}
function submitObs(id, st) {
  const s = M.observe(id, NW, st);
  if (!s) return;
  S.obsOpen = null;
  S.card.points += 8;
  S.card.done.obs = (S.card.done.obs || 0) + 1;
  S.card.log.unshift(`10/21・觀察${s.kind === 'trap' ? '捕鼠籠' : '餌盒'} ${s.code}・${M.ST[s.kind][st]}`);
  const T = { nontarget: s.kind === 'trap' ? '已回報，巡查員會處理籠內的動物，請不要開籠' : '已回報，這個站會先暫停毒餌，巡查員會檢查', dead: '已回報死鼠，請不要觸碰，社區環境衛生師會處理', exposed: '已回報毒餌外露，請提醒路人與寵物遠離，衛生師會儘快回收', moved: '已回報，餌站暫停使用並安排補設', all: '已回報，會安排補餌', caught: '已回報，巡查員會處理，請不要開籠' };
  map.closePopup();
  toast(`${T[st] || '感謝觀察'}，+8 點`);
  render();
}

/* 市民任務的分類圖示（線條，跟著文字顏色） */
const TICON = (() => {
  const s = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  return {
    clean: s('<path d="M16.5 3.5L10 12"/><path d="M6.5 12h7l2.5 8.5H4z"/><path d="M8.5 16.5l-.8 4M11.5 16.5v4"/>'),
    garbage: s('<path d="M4.5 7h15"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/><path d="M10 11v5.5M14 11v5.5"/>'),
    signs: s('<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/><circle cx="8.8" cy="9.4" r="1" fill="currentColor"/><circle cx="12.2" cy="9.4" r="1" fill="currentColor"/><circle cx="10.5" cy="12.6" r="1.2" fill="currentColor"/>'),
    trap: s('<rect x="3.5" y="6.5" width="17" height="12" rx="1.5"/><path d="M8 6.5v12M12 6.5v12M16 6.5v12"/><path d="M3.5 4.5h17"/>'),
    shop: s('<path d="M4 9.5l1.8-5h12.4l1.8 5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5.5 11.5V20h13v-8.5"/><path d="M10 20v-5h4v5"/>'),
    all: s('<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>')
  };
})();
/* 小彩蛋：市民「我的」和店家「我的店」共用，次數也共用（add_whack.py） */
const lootHTML = () => (window.RAT_FOOD ? `<div class="sec"><h3>小彩蛋</h3><div class="loots"><span class="lt rat"><svg viewBox="-15 -29.3 30 29.3" aria-hidden="true"><use href="#wrat2"/></svg>敲暈老鼠<b>${window.RAT_HITS || 0} 次</b></span>${Object.entries(window.RAT_FOOD).map(([k, f]) => { const n = (window.RAT_LOOT || {})[k] || 0; return `<span class="lt${n ? '' : ' off'}">${f.svg}撿到${f.name}<b>${n} 次</b></span>`; }).join('')}</div></div>` : '');
document.addEventListener('ratloot', () => { if (S.role === 'citizen') renderMe(); else if (S.role === 'merchant') renderShop(); });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-tkf]');
  if (b) { S.tkF = b.dataset.tkf; render(); }
});
/* 還沒拿到的徽章顯示進度 */
const BADGE_PROG = { '第一次清潔': c => `${c.done.clean}／1`, '鼠跡偵探': c => `${c.done.signs}／3`, '捕鼠籠守望者': c => `${c.done.trap}／3`, '垃圾代收達人': c => `${c.done.garbage}／5`, '三不推手': c => `${c.done.shop}／1`, '連續出勤 7 天': c => `${c.streak}／7`, '餌站觀察員': c => `${c.done.obs || 0}／3` };
function renderTasks(W) {
  const all = citizenTasks(W), allSts = nearStations(), f = S.tkF || 'all';
  const kf = f.startsWith('k-') ? f.slice(2) : null;
  const list = f === 'all' ? all : all.filter(t => t.type === f), sts = f === 'all' ? allSts : kf ? allSts.filter(x => x.s.kind === kf) : [];
  const cats = [['all', '全部', all.length + allSts.length, TICON.all]]
    .concat(['monitor', 'bait', 'trap'].filter(k => allSts.some(x => x.s.kind === k)).map(k => ['k-' + k, KIND[k], allSts.filter(x => x.s.kind === k).length, stnSvg(k, P.paper, 18)]))
    .concat(Object.keys(TASK).filter(k => all.some(t => t.type === k)).map(k => [k, TASK[k], all.filter(t => t.type === k).length, TICON[k]]));
  const bar = `<div class="tkf" role="group" aria-label="任務分類">${cats.map(([k, n, c, ic]) => `<button type="button" data-tkf="${k}" aria-pressed="${f === k}">${ic || ''}<span>${n}</span><b>${c}</b></button>`).join('')}</div>`;
  const showSts = f === 'all' || !!kf, showTasks = !kf;
  $('#c-tasks').innerHTML = `<p class="lead">示範任務以「觀察、回報、確認」為主。清運、清淤、鼠跡或餌劑處理由政府與專業人員負責；里長與志工協助在地觀察、通知及安全協作，不取代清潔隊。列表沿用 V1 模擬任務，正式任務需市府核准後才能發布。</p>` +
    bar +
    (showSts ? `<h3 class="warnh"><span class="hico">${stnSvg('monitor', P.paper, 20)}</span>餌站觀察（只看不碰）</h3>` + (sts.length ? sts.map(stationCard).join('') : '<div class="empty">附近沒有設置餌站。</div>') +
    `<p class="muted">回報「餌被吃、籠內有鼠、死鼠」會成為主動監測的鼠跡紀錄；「毒餌外露、盒子損壞」會直接通知社區環境衛生師。</p>` : '') +
    (showTasks ? `<h3><span class="hico">${TICON.clean}</span>清潔與代收</h3>` +
    (list.length ? list.map(taskCard).join('') : '<div class="empty">附近沒有招募中的任務。看到老鼠可以按左上的「我要通報老鼠」。</div>') : '') +
    '<p class="muted">任務由規則依熱點、風險源頭與通報線索提出建議，經市府示範核准後發布；人數與狀態為模擬。</p>';
}
function joinTask(id) { S.card.joined.add(id); map.closePopup(); toast('已加入。記得戴手套，不碰老鼠與毒餌'); render(); }
function finishTask(id) {
  const t = citizenTasks(M.week(NW)).find(x => x.id === id);
  if (!t) return;
  S.card.joined.delete(id);
  S.card.finished.add(id);
  S.card.points += xd[t.type].points;
  S.card.done[t.type]++;
  S.card.log.unshift(`10/21・${TASK[t.type]}・${t.place}一帶`);
  map.closePopup();
  toast(`完成，+${xd[t.type].points} 點`);
  render();
}
function taskGo(id) {
  const t = citizenTasks(M.week(NW)).find(x => x.id === id);
  if (!t) return;
  map.flyTo(t.ll, 16, { duration: RM.matches ? 0 : 0.7 });
  setTimeout(() => openPop(t.ll, popTask(t)), RM.matches ? 50 : 760);
  if (!wide()) $('#side').classList.add('min');
}
function renderMe() {
  const c = S.card, earned = c.points + (c.spent || 0), lvl = [...LEVELS].reverse().find(l => earned >= l.min), nx = LEVELS.find(l => l.min > earned);
  const ring = ['var(--grey)', 'var(--green)', 'var(--orange)', 'var(--red)'][LEVELS.indexOf(lvl)];
  $('#c-me').innerHTML = `<div class="crew"><div class="crewtop"><span class="ava" style="--ring:${ring}" aria-hidden="true">${AVATAR_SVG}</span><div class="who"><b>打鼠特攻隊員證</b><span class="muted">${esc(c.nick)}・受訓巡查員・隊員編號 ${c.no}</span></div></div>
    <div class="ptsrow"><div><div class="muted">可用點數</div><div class="pts">${c.points}<small> 點</small></div></div><button type="button" class="rdbtn" data-rd-open>${GIFT_SVG}點數兌換</button></div>
    <div><b>${lvl.name}</b><span class="muted">・累積 ${earned} 點${nx ? `，再 ${nx.min - earned} 點升級為${nx.name}` : '，最高等級'}</span></div>
    <div class="prog"><i style="width:${nx ? ((earned - lvl.min) / (nx.min - lvl.min)) * 100 : 100}%"></i></div><div class="muted">連續出勤 ${c.streak} 天・累積簽到 ${c.checkins} 次・行政區寶石 ${c.gems}／12</div></div>
    ${c.tickets.length ? `<div class="sec"><h3>我的兌換券</h3><div class="tickets">${c.tickets.map((k, i) => `<div class="ticket"><div><b>${esc(k.loc.name)}</b><span class="muted">${esc(k.lines.map(l => l.n + (l.q > 1 ? ' ×' + l.q : '')).join('、'))}・${k.until} 前領取</span></div><button type="button" class="qbtn" data-rd-ticket="${i}">出示</button></div>`).join('')}</div></div>` : ''}
    ${mineHTML()}
    <div class="sec"><h3>徽章</h3><div class="badges bgrid">${BADGES.map(([n, f], i) => `<span class="badge${f(c) ? '' : ' off'}" title="${f(c) ? '已取得' : '尚未取得'}">${BADGE_ART[i] || ''}<span class="bn">${n}</span>${!f(c) && BADGE_PROG[n] ? `<span class="bp">${BADGE_PROG[n](c)}</span>` : ''}</span>`).join('')}</div></div>
    ${lootHTML()}<div class="sec"><h3>完成紀錄</h3><ol class="done" reversed>${c.log.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>
    <div class="sec"><h3>安全分級</h3><ul class="rules-s"><li>A 防鼠志工：清潔公共空間、垃圾代收、店家輔導，以及從外面觀察餌盒與捕鼠籠（只看不碰）。不碰老鼠、鼠屍與鼠糞。</li><li>B 社區防鼠巡查員（受訓）：鼠跡確認、捕鼠籠的檢查與記錄、籠內有鼠時到場處理。戴手套與口罩。</li><li>C 社區環境衛生師或合格病媒防治人員：投藥、處理鼠屍與清理鼠糞。</li></ul></div>
    <p class="muted">點數有三種用法：到兌換點換垃圾袋、洗碗精等小物；累積簽到取得里民活動優先登記資格；集滿 12 區寶石換實體徽章。兌換點、品項與點數皆為模擬，正式規則需由市府訂定。</p>`;
}

/* ---------- 店家 ---------- */

/* 店家徽章：和市民徽章同一種金框圓章畫法（共用頁面裡的 #bgGold、#bgSilver、#bgClip） */
const SHOP_ART = (() => {
  const G = 'url(#bgGold)', ln = (d, w = 2.2, c = G) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const sh = (d, f, w = 2, c = G) => `<path d="${d}" fill="${f}" stroke="${c}" stroke-width="${w}" stroke-linejoin="round"/>`;
  const spark = (x, y, r = 3, c = '#fff') => `<path d="M${x} ${y - r}L${x + r * .32} ${y - r * .32}L${x + r} ${y}L${x + r * .32} ${y + r * .32}L${x} ${y + r}L${x - r * .32} ${y + r * .32}L${x - r} ${y}L${x - r * .32} ${y - r * .32}Z" fill="${c}"/>`;
  const arc = (a, b) => `<rect width="64" height="64" fill="${a}"/><ellipse cx="32" cy="60" rx="36" ry="20" fill="${b}"/>${ln('M-2 42Q32 32 66 42', 1.6)}`;
  const diag = (a, b) => `<rect width="64" height="64" fill="${a}"/><path d="M0 44L64 24V64H0Z" fill="${b}"/>${ln('M0 44L64 24', 1.6)}`;
  const rays = (a, b) => `<rect width="64" height="64" fill="${a}"/>${Array.from({ length: 12 }, (_, i) => { const p = i * Math.PI / 6, q = p + Math.PI / 18; return `<path d="M32 32L${(32 + 40 * Math.cos(p)).toFixed(1)} ${(32 + 40 * Math.sin(p)).toFixed(1)}L${(32 + 40 * Math.cos(q)).toFixed(1)} ${(32 + 40 * Math.sin(q)).toFixed(1)}Z" fill="${b}"/>`; }).join('')}`;
  const wrap = (rim, f, icon) => `<svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true"><circle cx="32" cy="32" r="30.5" fill="${rim}"/><circle cx="32" cy="32" r="30.5" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1"/><g clip-path="url(#bgClip)">${f}</g><circle cx="32" cy="32" r="25.5" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="1.2"/>${icon}</svg>`;
  const shield = 'M32 13L46 18.5V30C46 39.5 40 45.5 32 50C24 45.5 18 39.5 18 30V18.5Z';
  return {
    // 三不防鼠認證：盾牌＋勾
    cert: wrap(G, arc('#9ccc6b', '#36773f'), sh(shield, '#fff') + '<path d="M25 31L30.5 36.5L40 26" fill="none" stroke="#36773f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' + spark(48, 40, 3.4) + spark(16, 20, 2.4)),
    // 防鼠守護店：銀框盾牌＋星
    guard: wrap('url(#bgSilver)', diag('#6aa7d8', '#2f5f8f'), sh(shield, '#fff', 2, 'url(#bgSilver)') + '<path d="M32 21.5L35 28L42 28.6L36.7 33.2L38.3 40L32 36.4L25.7 40L27.3 33.2L22 28.6L29 28Z" fill="#f6c84c" stroke="#2f5f8f" stroke-width="1.4" stroke-linejoin="round"/>' + spark(47, 18, 2.6)),
    // 米奇零推薦：獎盃
    star: wrap(G, rays('#7a3f8f', 'rgba(255,255,255,.1)'), sh('M23 16H41V26C41 32 37 36 32 36C27 36 23 32 23 26Z', '#ffe9a8') + ln('M23 19H17V22C17 26 20 28 23 28M41 19H47V22C47 26 44 28 41 28', 1.8) + sh('M29 36H35V42H29Z', '#ffe9a8', 1.6) + sh('M24 42H40V47H24Z', '#fff4dc', 1.6) + spark(46, 40, 3) + spark(18, 40, 2.2)),
    // 連續良好 60 天：月曆
    days: wrap(G, rays('#1f5f5b', 'rgba(255,255,255,.08)'), sh('M18 20H46V46H18Z', '#fff') + '<path d="M18 20H46V27H18Z" fill="#d9502f" stroke="url(#bgGold)" stroke-width="2"/>' + ln('M25 16V22M39 16V22', 2.2) + '<text x="32" y="42" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="14" fill="#1f5f5b">60</text>' + spark(49, 41, 3)),
    // 零隱匿紀錄：眼睛＋勾
    honest: wrap(G, diag('#f4c56b', '#d9893a'), sh('M15 30Q32 14 49 30Q32 46 15 30Z', '#fff') + '<circle cx="32" cy="30" r="6.2" fill="#b86a1f"/><circle cx="34" cy="28" r="1.8" fill="#fff"/>' + spark(48, 16, 3) + spark(17, 45, 2.4)),
    // 主動改善：孔洞貼上補丁
    fix: wrap(G, arc('#f4a261', '#e76f51'), sh('M17 18H47V46H17Z', '#fff8ef') + '<circle cx="32" cy="32" r="7.5" fill="#3a2a22"/>' + sh('M22 27L41 22.5L43 31L24 35.5Z', '#f6c84c', 1.6) + ln('M27 28.5L28.5 33.6M36.5 26.3L38 31.4', 1.3, '#b9843f') + spark(48, 42, 3.4) + spark(15, 17, 2.4))
  };
})();
const SHOP_TIER_ART = ['cert', 'guard', 'star'];
function shopBadges(sh) {
  const B = [
    ['三不防鼠認證', 'cert', true],
    ['連續良好 60 天', 'days', sh.days >= 60],
    ['零隱匿紀錄', 'honest', true],
    ['主動改善', 'fix', sh.fixed],
    ['防鼠守護店', 'guard', sh.tier >= 1, `<span class="bp">連續良好 ${sh.days}／90 天</span>`]
  ];
  return `<div class="sec"><h3>徽章</h3><div class="badges bgrid">${B.map(([n, k, on, hint]) => `<span class="badge${on ? '' : ' off'}" title="${on ? '已取得' : '尚未取得'}">${SHOP_ART[k]}<span class="bn">${n}</span>${on ? '' : hint || ''}</span>`).join('')}</div></div>`;
}
document.addEventListener('click', e => { const b = e.target.closest('[data-shoptab]'); if (b) { S.shopTab = b.dataset.shoptab; renderShop(); } });
function renderShop() {
  const sh = S.shop, nx = STIERS[sh.tier + 1], rk = shopRank(), pct = [50, 70, 90][sh.tier], ok = sh.fixed, tab = S.shopTab || 'todo';
  const cost = 4000, grant = Math.min(cost * pct / 100, 3000);
  const item = (on, name, desc, extra) => `<div class="check"><span class="m ${on ? 'ok' : 'bad'}">${on ? '✓' : '!'}</span><div>${name}<div class="muted">${desc}</div>${extra || ''}</div></div>`;
  const act = ok
    ? `<button type="button" class="bigbtn" data-recheck ${sh.recheck ? 'disabled' : ''}>${sh.recheck ? '已申請複檢，衛生局排程中' : '申請複檢'}</button>`
    : '<button type="button" class="bigbtn" data-fix>拍照回報改善</button>';
  const todo = `<div class="sec"><div class="between"><h3>${ok ? '三不檢查都完成了' : '待改善 1 項'}</h3><span class="muted">${ok ? (sh.recheck ? '等衛生局複檢' : '下一步：申請複檢') : '完成後就能申請補助'}</span></div>
      ${item(ok, '不留孔洞', '後門下方縫隙約 2 公分，需加裝擋鼠板' + (ok ? (sh.recheck ? '・已申請複檢' : '・已回報改善') : ''), act)}
      ${item(true, '不留食物', '廚餘桶加蓋，打烊清空')}${item(true, '不堆雜物', '後巷與倉庫淨空')}
      <p class="muted">主動通報、主動改善都不扣分。</p></div>`;
  const sub = `<div class="subsidy ${ok ? 'ok' : 'no'}"><div class="between"><b>防鼠設施補助</b><span class="pill">${ok ? '符合資格' : '尚未符合'}</span></div>
      <p>買密封廚餘桶、擋鼠板、門縫條等防鼠設施，市府依標章等級<b>補助部分費用</b>，每家每年最多 NT$3,000。</p>
      <div class="sbtiers">${STIERS.map((x, i) => `<div class="${i === sh.tier ? 'on' : ''}"><span>${x.name}</span><b>補助 ${[50, 70, 90][i]}%</b>${i === sh.tier ? '<em>目前</em>' : ''}</div>`).join('')}</div>
      <p class="sbex">例：買一組 NT$${cost.toLocaleString()} 的擋鼠板，補助 ${pct}% 是 NT$${grant.toLocaleString()}${cost * pct / 100 > 3000 ? '（已達上限）' : ''}，自付 NT$${(cost - grant).toLocaleString()}。</p>
      <div class="muted" style="margin-top:6px">申請條件</div>
      <ul class="req"><li>已取得${STIERS[sh.tier].name}</li><li class="${ok ? '' : 'no'}">待改善項目全部完成${ok ? '' : '（還差：不留孔洞）'}</li><li>近 90 天沒有隱匿紀錄</li></ul>
      ${ok ? `<button type="button" class="bigbtn" data-sb-apply ${sh.subsidy ? 'disabled' : ''}>${sh.subsidy ? '已送出申請，衛生局審核中' : '申請補助'}</button>` : '<p class="muted" style="margin:8px 0 0">完成上面的待改善，就能申請。</p>'}
      <p class="muted" style="margin:6px 0 0">補助比例與上限為模擬，正式規則需由主管機關訂定。</p></div>`;
  const badge = `<div class="sec"><h3>標章等級</h3><div class="ladder">${STIERS.map((t, i) => `<div class="${i === sh.tier ? 'on' : ''} ${i <= sh.tier ? 'got' : 'lock'}"><span class="lbadge">${SHOP_ART[SHOP_TIER_ART[i]]}</span><span class="ltxt"><b>${t.name}<span class="lstate">${i <= sh.tier ? '已取得' : '未取得'}</span></b>${t.desc}</span></div>`).join('')}</div>
      ${nx ? `<p class="muted" style="margin-top:8px">升級到${nx.name}：連續良好 ${sh.days}／90 天</p><div class="prog"><i style="width:${(sh.days / 90) * 100}%"></i></div>` : ''}</div>
    ${shopBadges(sh)}${lootHTML()}
    <div class="sec"><h3>降級與暫停</h3><ul class="rules-s"><li>巡查連續兩次有鼠跡：降一級，輔導改善。</li><li>被爆料且事前未通報：暫停認證。</li><li>標章承諾的是主動、透明、持續改善，不是零老鼠。</li></ul></div>`;
  $('#m-shop').innerHTML = `<div class="crew"><div class="crewtop"><span class="ava store" aria-hidden="true">${STORE_SVG}</span><div class="who"><b>${esc(sh.name)}</b><span class="muted">${esc(sh.area)}・店家編號 ${sh.no}・模擬店家</span></div><span class="tierchip" title="${STIERS[sh.tier].name}">${SHOP_ART[SHOP_TIER_ART[sh.tier]]}</span></div>
    <div class="shopstats"><div><b>#${rk.rank}</b><span>周邊 1.5 公里・共 ${rk.total} 家</span></div><div><b>${rk.score}</b><span>綜合分</span></div><div><b>${sh.days}</b><span>連續良好天數</span></div></div>
    <button type="button" class="linkbtn" data-sb-rank>看完整排行 ›</button></div>
    <div class="qtabs shoptabs" role="tablist" aria-label="我的店"><button type="button" role="tab" data-shoptab="todo" aria-selected="${tab === 'todo'}">改善與補助${ok ? '' : '<span class="qn hot">1</span>'}</button><button type="button" role="tab" data-shoptab="badge" aria-selected="${tab === 'badge'}">標章與徽章</button></div>
    ${tab === 'todo' ? todo + sub : badge}`;
}
function renderAlerts(W) {
  const sh = S.shop, h = M.hexOfLL(sh.ll[0], sh.ll[1]), a = h >= 0 ? W.areas.get(h) : null, q = qs[W.w];
  let x = (sh.govNotes || []).map(n => `<div class="notice hot"><b>市府通知：${esc(n.place)}一帶鼠患通報集中</b><br>請自主檢查：${esc(n.act)}。${sh.fixed ? '' : '<br>本店待改善：不留孔洞，完成後到「我的店」回報。'}</div>`).join('') + sh.alerts.map(al => `<div class="notice hot"><b>周邊新通報：${esc(al.text)}</b>${al.sev ? ' ' + sevPill(al.sev) : ''}<br>已派給${esc(al.to)}。請一併檢查店內排水孔與後門縫隙。</div>`).join('');
  x += `<div class="notice"><b>本週停收 ${q.stopDays} 天${stopTxt(q)}</b><br>收攤後廚餘請倒入密閉桶，等候專車。</div>`;
  x += `<div class="notice">本店周邊 300 公尺內，近 4 週有 ${nearReports(sh.ll, 300, 4)} 筆鼠患通報。系統不會顯示通報者是誰。</div>`;
  x += a ? `<div class="notice"><b>本店所在區塊本週列為 ${a.lv} 級・${LV[a.lv].name}</b><br>已排入${esc(LV[a.lv].to)}的派案清單。${a.lv === 3 ? '衛生局可能到店檢查收攤清潔與食材存放。' : ''}</div>` : '<div class="notice">本店所在區塊本週沒有通報。</div>';
  if (W.advice.includes('breeding')) x += '<div class="notice">繁殖高峰前：收攤後清空廚餘、封住後門縫隙，效果最好。</div>';
  if (W.advice.includes('postRain')) x += '<div class="notice">豪雨後：檢查店內排水孔與地下室，清理時戴手套。</div>';
  $('#m-alert').innerHTML = x;
}
const RANK_SCOPES = [['near', '周邊 1.5 公里'], ['dist', '本區'], ['city', '全市']];
const shopDist = s => (s._d != null ? s._d : (s._d = M.districtOf(M.hexOfLL(s.ll[0], s.ll[1])) || ''));
function shopRank(scope = 'near') {
  const sh = S.shop, me = { name: sh.name, pass: 93, act: 3, days: sh.days, tier: sh.tier + 1, ll: sh.ll, mine: true };
  me.score = Math.round(me.pass * 0.7 + (Math.min(me.act, 8) / 8) * 10 + (Math.min(me.days, 365) / 365) * 20);
  const d = shopDist(me);
  const pool = scope === 'city' ? SHOPS : scope === 'dist' ? SHOPS.filter(s => shopDist(s) === d) : SHOPS.filter(s => dist(s.ll, sh.ll) <= 1500);
  const rows = pool.concat([me]).sort((a, b) => b.score - a.score);
  return { rows, me, rank: rows.indexOf(me) + 1, total: rows.length, score: me.score, district: d };
}
function renderRank() {
  const sc = S.rankScope || 'near', rk = shopRank(sc), me = rk.me, rows = rk.rows;
  const label = k => (k === 'dist' ? rk.district || '本區' : RANK_SCOPES.find(([x]) => x === k)[1]);
  const ahead = rows[rk.rank - 2], top = Math.max(1, Math.round((rk.rank / rk.total) * 100));
  const parts = [
    ['巡查合格率', `${me.pass}%`, Math.round(me.pass * 0.7), 70, '社區防鼠巡查員每次巡查的合格比例'],
    ['主動通報', `${me.act} 次`, Math.round((Math.min(me.act, 8) / 8) * 10), 10, '發現鼠跡主動通報，8 次拿滿分'],
    ['持續表現', `連續良好 ${me.days} 天`, Math.round((Math.min(me.days, 365) / 365) * 20), 20, '連續良好滿 365 天拿滿分']
  ];
  // 名單太長時只列前 5 名，以及我的前後各一名
  const show = rows.length <= 10 ? rows.map((s, i) => i) : [...new Set([0, 1, 2, 3, 4, rk.rank - 2, rk.rank - 1, rk.rank])].filter(i => i >= 0 && i < rows.length).sort((a, b) => a - b);
  let body = '', prev = -1;
  for (const i of show) {
    if (i - prev > 1) body += `<tr class="gap"><td colspan="5">⋯</td></tr>`;
    const s = rows[i], mk = STIERS[(s.tier || 1) - 1];
    body += `<tr${s.mine ? ' class="mine" aria-current="true"' : ''}><td class="num rk">${i + 1}</td><td><span class="shop t${s.tier || 1} sm" title="${mk.name}">${s.tier === 3 && s.rank ? s.rank : mk.mark}</span>${esc(s.name)}${s.mine ? '<span class="youtag">我的店</span>' : ''}</td><td class="num">${s.pass}%</td><td class="num">${s.act}</td><td class="num"><b>${s.score}</b></td></tr>`;
    prev = i;
  }
  $('#m-rank').innerHTML = `<div class="rkhero">
      <div class="rdfilter" role="group" aria-label="排行範圍">${RANK_SCOPES.map(([k]) => `<button type="button" data-rk-scope="${k}" aria-pressed="${sc === k}">${label(k)}</button>`).join('')}</div>
      <div class="rkbig"><div><span class="muted">${label(sc)}排名</span><b>#${rk.rank}</b><span class="muted">共 ${rk.total} 家${top <= 50 ? `・前 ${top}%` : ''}</span></div>
        <div class="rkscore"><span class="muted">綜合分</span><b>${me.score}</b><span class="muted">滿分 100</span></div></div>
      <p class="rknext">${ahead ? `再 <b>${ahead.score - me.score + 1} 分</b>就能超越第 ${rk.rank - 1} 名「${esc(ahead.name)}」` : '目前是這個範圍的第一名'}</p>
    </div>
    <div class="sec"><h3>我的分數怎麼來</h3><div class="rkparts">${parts.map(([n, v, p, mx, tip]) => `<div><div class="between"><span><b>${n}</b> <span class="muted">${v}</span></span><span class="rkp">${p}<small>／${mx}</small></span></div><div class="prog"><i style="width:${(p / mx) * 100}%"></i></div><div class="muted">${tip}</div></div>`).join('')}</div></div>
    <div class="sec"><h3>${label(sc)}排行</h3><table class="rank"><thead><tr><th class="num">#</th><th>店家</th><th class="num">合格率</th><th class="num">通報</th><th class="num">綜合</th></tr></thead>
    <tbody>${body}</tbody></table>
    <p class="muted">綜合分＝巡查合格率 70%＋主動通報 10%＋持續表現 20%（沿用防鼠調度台）。只列已取得標章的店家，店家為模擬資料。</p></div>`;
}
$('#m-rank').addEventListener('click', e => { const b = e.target.closest('[data-rk-scope]'); if (b) { S.rankScope = b.dataset.rkScope; renderRank(); } });

/* ---------- 時間軸（市府） ---------- */
function initTimeline() {
  const mx = Math.max(1, ...M.TOTALS.slice(1));
  $('#hist').innerHTML = M.TOTALS.slice(1).map(v => `<i style="height:${Math.max(5, Math.sqrt(v / mx) * 100)}%"></i>`).join('');
  $('#evts').innerHTML = Js.map(e => `<i style="left:${((e.week - 1) / (NW - 1)) * 100}%" title="第 ${e.week} 週：${EVENTS[e.key]}"></i>`).join('');
  $('#ticks').innerHTML = Xs.map(m => `<span style="left:${((m.week - 1) / (NW - 1)) * 100}%">${m.month} 月</span>`).join('');
  $('#range').max = NW;
}
function renderTimeline() {
  if (S.role !== 'gov') return;
  $('#range').value = S.week;
  $('#range').setAttribute('aria-valuetext', `第 ${S.week} 週，${Us(S.week)}`);
  $$('#hist i').forEach((b, k) => { b.classList.toggle('past', k + 1 <= S.week); b.classList.toggle('cur', k + 1 === S.week); });
  const r = $('#range').getBoundingClientRect(), c = $('#clock');
  c.textContent = `第 ${S.week} 週・${Us(S.week)}`;
  const x = r.left + ((S.week - 1) / (NW - 1)) * r.width, hw = c.offsetWidth / 2 + 8;
  c.style.left = Math.min(innerWidth - hw, Math.max(hw, x)) + 'px';
}
function play(on) {
  clearInterval(S.timer);
  S.timer = null;
  if (on) {
    if (S.week >= NW) setWeek(1);
    S.timer = setInterval(() => (S.week >= NW ? play(false) : setWeek(S.week + 1)), 800);
  }
  $('#play').innerHTML = on ? PAUSE : PLAY;
  $('#play').setAttribute('aria-label', on ? '暫停' : '播放每週變化');
}

/* ---------- 開場雷達 ---------- */
function drawRadar(W) {
  const C = 200, R = 180, c0 = [25.087, 121.563], sc = R / 15200;
  const pt = (lat, lon) => [C + (lon - c0[1]) * 100900 * sc, C - (lat - c0[0]) * 110900 * sc];
  const path = ring => 'M' + ring.map(([lon, lat]) => pt(lat, lon).map(v => v.toFixed(1)).join(',')).join('L') + 'Z';
  let h = `<defs><radialGradient id="rg"><stop offset="0" style="stop-color:var(--paper);stop-opacity:.75"/><stop offset="1" style="stop-color:var(--mint);stop-opacity:.75"/></radialGradient>
    <linearGradient id="swg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:var(--blue);stop-opacity:0"/><stop offset="1" style="stop-color:var(--blue);stop-opacity:.3"/></linearGradient>
    <clipPath id="cp"><circle cx="${C}" cy="${C}" r="${R}"/></clipPath></defs>
    <circle cx="${C}" cy="${C}" r="${R}" fill="url(#rg)" style="stroke:var(--blue);stroke-opacity:.5"/>`;
  [0.25, 0.5, 0.75].forEach(f => (h += `<circle cx="${C}" cy="${C}" r="${R * f}" fill="none" style="stroke:var(--blue);stroke-opacity:.2"/>`));
  h += `<line x1="${C - R - 14}" y1="${C}" x2="${C + R + 14}" y2="${C}" style="stroke:var(--blue);stroke-opacity:.3"/><line x1="${C}" y1="${C - R - 14}" x2="${C}" y2="${C + R + 14}" style="stroke:var(--blue);stroke-opacity:.3"/><g clip-path="url(#cp)">`;
  for (const p of mc) h += `<path d="${path(p[0])}" style="fill:var(--paper);fill-opacity:.6;stroke:var(--edge);stroke-opacity:.8" stroke-width="1.3"/>`;
  for (const d of fc) for (const p of d.polygons) h += `<path d="${path(p[0])}" fill="none" style="stroke:var(--edge);stroke-opacity:.28" stroke-width=".7" stroke-dasharray="3 3"/>`;
  for (const a of W.list.slice().reverse()) {
    const [x, y] = pt(...M.hexLL(a.h));
    h += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${a.lv === 1 ? 4.2 : 2.6}" style="fill:var(--l${a.lv});stroke:var(--edge)" stroke-width=".7">${a.lv === 1 && !RM.matches ? '<animate attributeName="r" values="3.2;7.5;3.2" dur="2s" repeatCount="indefinite"/>' : ''}</circle>`;
  }
  h += `<g class="sweep"><path d="M${C},${C} L${C + R},${C} A${R},${R} 0 0,0 ${(C + R * Math.cos(-Math.PI / 5)).toFixed(1)},${(C + R * Math.sin(-Math.PI / 5)).toFixed(1)} Z" fill="url(#swg)"/><line x1="${C}" y1="${C}" x2="${C + R}" y2="${C}" style="stroke:var(--blue)" stroke-width="1.5"/></g></g>`;
  [[-40, 10], [60, 95], [150, 175], [230, 265], [300, 320]].forEach(([a, b]) => {
    const r2 = R + 10, ra = (a * Math.PI) / 180, rb = (b * Math.PI) / 180;
    h += `<path d="M${(C + r2 * Math.cos(ra)).toFixed(1)},${(C + r2 * Math.sin(ra)).toFixed(1)} A${r2},${r2} 0 0,1 ${(C + r2 * Math.cos(rb)).toFixed(1)},${(C + r2 * Math.sin(rb)).toFixed(1)}" fill="none" style="stroke:var(--blue)" stroke-width="4"/>`;
  });
  $('#radar').innerHTML = h;
  RADAR_PTS = W.list.map(a => pt(...M.hexLL(a.h))).filter(([x, y]) => Math.hypot(x - C, y - C) < R - 22);
  radarRatLoop();
}
let RADAR_PTS = [], RADAR_RAF = 0;
const RADAR_RAT = RAT_ICON;
function radarRatLoop() {
  cancelAnimationFrame(RADAR_RAF);
  const svg = $('#radar'), sw = svg && svg.querySelector('.sweep');
  if (!sw || RM.matches || !RADAR_PTS.length || svg.closest('[hidden]')) return;
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'rrat');
  svg.appendChild(g);
  let lap = -1, tgt = null, shown = false;
  const pick = () => { const [x, y] = RADAR_PTS[Math.floor(Math.random() * RADAR_PTS.length)]; let a = Math.atan2(y - 200, x - 200) * 180 / Math.PI; if (a < 0) a += 360; return { x, y, a }; };
  const tick = () => {
    if (!svg.isConnected) return;
    if (!$('#hero').classList.contains('gone')) {
      const an = sw.getAnimations()[0];
      if (an && an.currentTime != null) {
        const t = an.currentTime % 5000, ang = t / 5000 * 360, l = Math.floor(an.currentTime / 5000);
        if (l !== lap) { lap = l; tgt = pick(); shown = false; }
        if (!shown && ang >= tgt.a) {
          shown = true;
          g.innerHTML = `<g transform="translate(${tgt.x.toFixed(1)} ${tgt.y.toFixed(1)})"><circle class="rping" r="10"/><g class="rpop"><image href="${RADAR_RAT}" x="-23" y="-34" width="46" height="40"/></g></g>`;
        }
      }
    }
    RADAR_RAF = requestAnimationFrame(tick);
  };
  RADAR_RAF = requestAnimationFrame(tick);
}
function heroStats(W) {
  $('#heroWeek').textContent = `第 ${W.w} 週・${Us(W.w)}${M.real ? '・部分真實資料' : ''}`;
  const set = (id, v) => {
    const el = $(id);
    clearInterval(el._t);
    if (RM.matches) { el.textContent = v; return; }
    let n = 0;
    const st = Math.max(1, Math.ceil(v / 36));
    el._t = setInterval(() => { n = Math.min(v, n + st); el.textContent = n; if (n >= v) clearInterval(el._t); }, 25);
  };
  set('#h-rep', W.reps.length);
  set('#h-area', W.list.length);
  set('#h-l1', W.lvN[1]);
}
function enter(role) {
  $('#hero').classList.add('gone');
  setRole(role || S.role);
  setTimeout(() => { map.invalidateSize(); renderTimeline(); }, 320);
  const f = $('#roles [aria-pressed="true"]');
  if (f) f.focus({ preventScroll: true });
}
function showHero() {
  closeReport();
  play(false);
  const W = M.week(S.week);
  drawRadar(W);
  heroStats(W);
  $('#hero').classList.remove('gone');
  $('[data-enter="' + S.role + '"]').focus({ preventScroll: true });
}

/* ---------- 主流程 ---------- */
function renderTabs() {
  const fresh = S.mine.filter(r => !r.dispatched).length, obsAl = M.stationWeek(NW).list.filter(x => x.cur && x.cur.mine && M.ALERT[x.cur.st]).length;
  const badge = { 'p-queue': fresh, 'p-bait': obsAl, 'm-alert': S.shop.alerts.length + (S.shop.govNotes || []).length, 'c-tasks': nearStations().filter(stAsk).length };
  const cur = S.tab[S.role], open = !$('#side').classList.contains('min');
  $('#side').classList.toggle('full', S.role === 'gov');
  $('#tabs').innerHTML = ROLES[S.role].map(([id, n]) => `<button type="button" role="tab" id="t-${id}" aria-selected="${cur === id}" aria-controls="${id}" data-pane="${id}">${n}${badge[id] ? `<span class="dot">${badge[id]}</span>` : ''}</button>`).join('') +
    `<span class="tabttl">${(ROLES[S.role].find(([id]) => id === cur) || [, ''])[1]}</span><button type="button" class="x chev" id="sidemin" aria-label="${open ? '收合面板' : '展開面板'}" aria-expanded="${open}"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
  $$('.pane').forEach(p => p.classList.toggle('on', p.id === cur));
  $('#navmenu').innerHTML = ROLES[S.role].map(([id, n]) => `<button type="button" data-menu="${id}" aria-current="${open && cur === id}">${n}${badge[id] ? `<span class="dot">${badge[id]}</span>` : ''}</button>`).join('') + '<button type="button" data-menu="hero">回首頁</button><button type="button" class="navx" data-menu="close" aria-label="關閉選單">×</button>';
}
function render() {
  const W = M.week(wk());
  HX.clearLayers(); PT.clearLayers(); MK.clearLayers(); LB.clearLayers();
  if (S.role === 'gov') DRAW[S.view](W); else drawPublic(W);
  cvsPoints(W);
  drawSel();
  drawPins();
  const [t, b] = legend(W);
  $('#lgTitle').textContent = t;
  $('#lgCount').textContent = S.cf ? `已篩選 ${S.cf.size} 項` : '';
  $('#lgBody').innerHTML = b;
  const lm = $('#lgMobile');
  if (lm) lm.innerHTML = `<h3>圖例：${t}</h3>${b}`;
  renderStatus(W);
  renderTabs();
  if (S.role === 'gov') { renderQueue(W); if (S.tab.gov === 'p-over') renderOverview(W); if (S.tab.gov === 'p-bait') renderBaitPane(W); updateTry(); renderData(); renderTimeline(); }
  else if (S.role === 'citizen') { updateReport(); renderTasks(W); renderMe(); }
  else { renderShop(); renderAlerts(W); renderRank(); }
  $$('#views button').forEach(x => x.setAttribute('aria-pressed', x.dataset.view === S.view));
  $('#simtag').textContent = M.real ? '部分真實資料' : '模擬資料';
}
function setWeek(w) {
  S.week = Math.max(1, Math.min(NW, w));
  S.sel = null;
  map.closePopup();
  render();
}
function setView(v) { S.view = v; S.cf = null; if (v === 'bait' && S.role === 'gov') { S.tab.gov = 'p-bait'; $('#side').classList.remove('min'); } map.closePopup(); render(); }
function setTab(id) {
  S.tab[S.role] = id;
  $$('#tabs [role=tab]').forEach(x => x.setAttribute('aria-selected', x.dataset.pane === id));
  $$('.pane').forEach(p => p.classList.toggle('on', p.id === id));
  $('#side').classList.remove('min');
  const x = $('#sidemin');
  if (x) { x.setAttribute('aria-expanded', 'true'); x.setAttribute('aria-label', '收合面板'); }
  if (S.picking && !((S.picking === 'try' && id === 'p-try') || S.picking === 'report')) setPicking(null);
  if (id === 'p-over') renderOverview(M.week(S.week));
  if (id === 'p-bait') renderBaitPane(M.week(S.week));
  drawPins();
}
function setRole(r) {
  closeReport();
  if ($('#navmenu')) $('#navmenu').hidden = true;
  closeDone();
  S.cf = null;
  S.role = r;
  document.body.dataset.role = r;
  $$('#roles button').forEach(b => b.setAttribute('aria-pressed', b.dataset.role === r));
  if (S.picking) setPicking(null);
  play(false);
  map.closePopup();
  S.sel = null;
  render();
  if (r === 'citizen') map.setView(S.me.ll, 15, { animate: false });
  else if (r === 'merchant') map.setView(S.shop.ll, 16, { animate: false });
  else fitCity();
}
function setPicking(mode) {
  S.picking = mode;
  syncReport();
  $('#map').classList.toggle('picking', !!mode);
  $('#map').classList.toggle('ratcur', mode === 'report');
  const b1 = $('#pick'), b2 = $('#c-pick');
  if (b1) { b1.textContent = mode === 'try' ? '請點地圖…' : '在地圖上選位置'; b1.setAttribute('aria-pressed', mode === 'try'); }
  if (b2) { b2.textContent = mode === 'report' ? '請點地圖…' : '在地圖上選位置'; b2.setAttribute('aria-pressed', mode === 'report'); }
  if (mode) { map.closePopup(); toast(mode === 'me' ? '請在地圖上點你的位置' : '請在地圖上點通報位置'); if (!wide()) $('#side').classList.add('min'); }
}
function syncReport() {
  const m = $('#repModal');
  if (!m) return;
  m.hidden = !S.repOpen;
  m.classList.toggle('away', !!S.repOpen && S.picking === 'report');
}
function openReport() {
  if (S.picking && S.picking !== 'report') setPicking(null);
  S.repOpen = true;
  S.repFrom = document.activeElement;
  syncReport();
  updateReport();
  const d = $('#c-draft');
  if (d && wide()) d.focus();
  else { const x = $('#repClose'); if (x) x.focus({ preventScroll: true }); }
}
function closeReport() {
  if (!S.repOpen) return;
  S.repOpen = false;
  if (S.picking === 'report') setPicking(null);
  syncReport();
  if (S.repFrom && S.repFrom.isConnected) S.repFrom.focus({ preventScroll: true });
  S.repFrom = null;
}
function pickAt(ll) {
  const p = [ll.lat, ll.lng], mode = S.picking;
  setPicking(null);
  if (mode === 'try') { S.loc = p; updateTry(); }
  else if (mode === 'report') { S.report.ll = p; updateReport(); const d = $('#c-draft'); if (d) d.focus(); }
  else if (mode === 'me') { const h = M.hexOfLL(p[0], p[1]); S.me = { ll: p, label: h >= 0 ? `${M.placeOf(h)}一帶` : '自選位置' }; render(); }
  drawPins();
  if (!wide()) $('#side').classList.remove('min');
}
function fitCity() {
  map.fitBounds(CORE, wide() ? { paddingTopLeft: [356, 60], paddingBottomRight: [404, 86] } : { paddingTopLeft: [4, 190], paddingBottomRight: [4, 140] });
}
function toast(m) {
  const t = $('#toast');
  t.textContent = m;
  t.classList.add('on');
  clearTimeout(toast.h);
  toast.h = setTimeout(() => t.classList.remove('on'), 2600);
}

/* ---------- 事件 ---------- */
$('#views').innerHTML = Object.entries(VIEWS).map(([k, n]) => `<button type="button" data-view="${k}" aria-pressed="${S.view === k}">${n}</button>`).join('');
$('#views').addEventListener('click', e => { const b = e.target.closest('[data-view]'); if (b) setView(b.dataset.view); });
$('#roles').addEventListener('click', e => { const b = e.target.closest('[data-role]'); if (b) setRole(b.dataset.role); });
$('#tabs').addEventListener('click', e => {
  const b = e.target.closest('[data-pane]');
  if (b) { setTab(b.dataset.pane); return; }
  const x = e.target.closest('#sidemin');
  if (x) { const m = $('#side').classList.toggle('min'); x.setAttribute('aria-expanded', String(!m)); x.setAttribute('aria-label', m ? '展開面板' : '收合面板'); }
});
$('#status').addEventListener('click', e => {
  const lf = e.target.closest('[data-lvf]'), go = e.target.closest('[data-gotab]'), pk = e.target.closest('[data-pick]');
  if (lf) { S.filter = +lf.dataset.lvf; setTab('p-queue'); if (S.view !== 'triage') setView('triage'); else renderQueue(M.week(S.week)); }
  else if (e.target.closest('#latest')) { play(false); setWeek(NW); }
  else if (go) setTab(go.dataset.gotab);
  else if (pk && pk.dataset.pick === 'me') locOpen();
  else if (pk) setPicking(S.picking === pk.dataset.pick ? null : pk.dataset.pick);
});
$('#side').addEventListener('click', e => {
  const q = s => e.target.closest(s);
  let b;
  if ((b = q('[data-ovsort]'))) { S.ov.sort = b.dataset.ovsort; renderOverview(M.week(S.week)); }
  else if ((b = q('[data-ovband]'))) { const k = +b.dataset.ovband; S.ov.band = S.ov.band === k ? null : k; renderOverview(M.week(S.week)); }
  else if ((b = q('[data-ovf]'))) { S.ov.f = b.dataset.ovf === 'all' ? null : +b.dataset.ovf; renderOverview(M.week(S.week)); }
  else if ((b = q('[data-ovscope]'))) { S.ov.scope = b.dataset.ovscope; renderOverview(M.week(S.week)); }
  else if ((b = q('[data-ovweek]'))) { play(false); setWeek(+b.dataset.ovweek); }
  else if ((b = q('[data-rep]'))) focusRep(b.dataset.rep);
  else if ((b = q('[data-gotab]'))) setTab(b.dataset.gotab);
  else if ((b = q('[data-f]'))) { S.filter = +b.dataset.f; renderQueue(M.week(S.week)); }
  else if ((b = q('[data-go]'))) focusArea(+b.dataset.go);
  else if ((b = q('[data-rx]'))) rxMove(b.dataset.rxkey, b.dataset.rx);
  else if ((b = q('[data-taskreview]'))) { tkSet(b.dataset.taskid, b.dataset.taskreview); toast(b.dataset.taskreview === 'approved' ? '示範：任務已派發，附近志工會收到通知' : '示範：任務已退回或撤回'); render(); refreshPop(); }
  else if ((b = q('[data-trv-f]'))) { S.trvF = b.dataset.trvF; renderQueue(M.week(S.week)); }
  else if ((b = q('[data-tk-push]'))) { S.tk.pushed[b.dataset.tkPush] = true; toast('示範：已推播給 1 公里內的防鼠志工，陸續有人加入'); render(); refreshPop(); }
  else if ((b = q('[data-tk-ok]'))) { S.tk.verified[b.dataset.tkOk] = true; delete S.tk.redo[b.dataset.tkOk]; toast('示範：驗收通過，志工已計點'); render(); refreshPop(); }
  else if ((b = q('[data-tk-redo]'))) { const k = b.dataset.tkRedo; S.tk.redo[k] = true; S.card.finished.delete(k); toast('示範：已退回，請志工補拍照片'); render(); refreshPop(); }
  else if ((b = q('[data-disp]'))) dispatch(+b.dataset.disp);
  else if ((b = q('[data-dispc]'))) dispatchMine(b.dataset.dispc);
  else if ((b = q('[data-minego]'))) goMine(b.dataset.minego);
  else if ((b = q('[data-pick]'))) setPicking(S.picking === b.dataset.pick ? null : b.dataset.pick);
  else if (q('#c-send')) sendReport();
  else if ((b = q('[data-join]'))) joinTask(b.dataset.join);
  else if ((b = q('[data-finish]'))) finishTask(b.dataset.finish);
  else if ((b = q('[data-taskgo]'))) taskGo(b.dataset.taskgo);
  else if ((b = q('[data-obsst]'))) submitObs(b.dataset.obsid, b.dataset.obsst);
  else if ((b = q('[data-obs]'))) { S.obsOpen = b.dataset.obs; renderTasks(M.week(NW)); }
  else if ((b = q('[data-stn]'))) focusStation(b.dataset.stn);
  else if (q('[data-fix]')) { S.shop.fixed = true; toast('已回報改善，可以申請複檢了'); render(); }
  else if (q('[data-recheck]')) { S.shop.recheck = true; toast('已申請複檢，衛生局排程中'); render(); }
  else if (q('[data-pickfiles]')) $('#files').click();
  else if (q('[data-resetdata]')) resetData();
});
$('#side').addEventListener('input', e => {
  if (e.target.id === 'draft') { S.draft = e.target.value; $('#pv').innerHTML = preview(S.draft, S.loc, S.week); }
  else if (e.target.id === 'c-draft') {
    S.report.text = e.target.value;
    $('#c-pv').innerHTML = preview(S.report.text, S.report.ll || S.me.ll, NW, '這筆通報會送到');
    $('#c-send').disabled = !S.report.text.trim();
  }
});
$('#side').addEventListener('change', e => { if (e.target.id === 'files') handleFiles(e.target.files); });
$('#side').addEventListener('dragover', e => { const d = e.target.closest('#drop'); if (d) { e.preventDefault(); d.classList.add('over'); } });
$('#side').addEventListener('dragleave', e => { const d = e.target.closest('#drop'); if (d) d.classList.remove('over'); });
$('#side').addEventListener('drop', e => { const d = e.target.closest('#drop'); if (d) { e.preventDefault(); d.classList.remove('over'); handleFiles(e.dataTransfer.files); } });
document.addEventListener('click', e => {
  const q = s => e.target.closest(s);
  let b;
  if ((b = q('[data-tryh]'))) { S.loc = M.hexLL(+b.dataset.tryh); map.closePopup(); setTab('p-try'); updateTry(); }
  else if ((b = q('[data-gtask]'))) govTaskGo(b.dataset.gtask);
  else if ((b = q('[data-gdet]'))) govPop(+b.dataset.gdet, true);
  else if ((b = q('[data-gback]'))) govPop(+b.dataset.gback, false);
  else if ((b = q('#popModal [data-gshop]'))) govNotifyShops(+b.dataset.gshop);
  else if ((b = q('#popModal [data-disp]'))) dispatch(+b.dataset.disp);
  else if ((b = q('#popModal [data-rx]'))) rxMove(b.dataset.rxkey, b.dataset.rx);
  else if ((b = q('[data-fly]'))) {
    const h = +b.dataset.fly;
    if (S.role === 'gov' && M.week(S.week).areas.get(h)) focusArea(h);
    else { map.flyTo(M.hexLL(h), 15, { duration: RM.matches ? 0 : 0.7 }); setTimeout(() => { S.popFn = () => popHex(h, wk()); showPop(S.popFn()); }, RM.matches ? 50 : 760); if (!wide()) $('#side').classList.add('min'); }
  }
  else if ((b = q('#popModal [data-stpush]'))) {
    const id = b.dataset.stpush, x = M.stationWeek(wk()).list.find(o => o.s.id === id);
    S.stPush[id] = true; toast('示範：已推播給 1 公里內的防鼠志工，請他們幫忙觀察'); render(); renderTabs();
    if (x) $('#popBody').innerHTML = popStation(x, wk());
  }
  else if ((b = q(':is(.leaflet-popup,#popModal) [data-join]'))) joinTask(b.dataset.join);
  else if ((b = q(':is(.leaflet-popup,#popModal) [data-finish]'))) finishTask(b.dataset.finish);
  else if ((b = q(':is(.leaflet-popup,#popModal) [data-obs]'))) { S.obsOpen = b.dataset.obs; map.closePopup(); setTab('c-tasks'); renderTasks(M.week(NW)); const c = $('#stc-' + S.obsOpen); if (c) c.scrollIntoView({ block: 'center' }); }
  else if ((b = q('#popModal [data-taskreview]'))) { tkSet(b.dataset.taskid, b.dataset.taskreview); toast(b.dataset.taskreview === 'approved' ? '示範：任務已派發，附近志工會收到通知' : '示範：任務已退回或撤回'); render(); refreshPop(); }
  else if ((b = q('#popModal [data-tk-push]'))) { S.tk.pushed[b.dataset.tkPush] = true; toast('示範：已推播給 1 公里內的防鼠志工，陸續有人加入'); render(); refreshPop(); }
  else if ((b = q('#popModal [data-tk-ok]'))) { S.tk.verified[b.dataset.tkOk] = true; delete S.tk.redo[b.dataset.tkOk]; toast('示範：驗收通過，志工已計點'); render(); refreshPop(); }
  else if ((b = q('#popModal [data-tk-redo]'))) { const k = b.dataset.tkRedo; S.tk.redo[k] = true; S.card.finished.delete(k); toast('示範：已退回，請志工補拍照片'); render(); refreshPop(); }
  else if ((b = q('[data-rephere]'))) { S.report.ll = M.hexLL(+b.dataset.rephere); map.closePopup(); openReport(); drawPins(); }
  else if (q('[data-openrep]')) openReport();
  else if ((b = q('[data-enter]'))) enter(b.dataset.enter);
}, true);

/* ---------- V5：點數兌換（地點、品項、點數皆為模擬） ---------- */
const RD = { step: 1, loc: null, cart: {}, filter: 'all', ticket: null, from: null };
const rdLoc = () => RD_LOCS.find(l => l.id === RD.loc);
const rdTotal = () => Object.entries(RD.cart).reduce((s, [k, q]) => s + (RD_ITEMS[k].p || 0) * q, 0);
const rdQOK = it => S.card[it.q.k] >= it.q.n;
const rdDist = d => (d < 1000 ? `${Math.round(d / 10) * 10} 公尺` : `${(d / 1000).toFixed(1)} 公里`);
function rdOpen() {
  RD.step = 1; RD.loc = null; RD.cart = {}; RD.ticket = null; RD.from = document.activeElement;
  $('#rdModal').hidden = false;
  rdRender();
  $('#rdClose').focus();
}
function rdClose() {
  $('#rdModal').hidden = true;
  if (RD.from && RD.from.isConnected) RD.from.focus({ preventScroll: true });
}
function rdRender() {
  const c = S.card, steps = ['選地點', '選品項', '確認', '兌換券'];
  $('#rdTitle').textContent = RD.step === 4 ? '兌換券' : '點數兌換';
  $('#rdBal').textContent = `可用 ${c.points} 點`;
  $('#rdBack').hidden = RD.step === 1 || RD.step === 4;
  $('#rdSteps').innerHTML = steps.map((s, i) => `<li class="${i + 1 === RD.step ? 'on' : i + 1 < RD.step ? 'done' : ''}"${i + 1 === RD.step ? ' aria-current="step"' : ''}>${i + 1} ${s}</li>`).join('');
  const body = $('#rdBody'), foot = $('#rdFoot');
  if (RD.step === 1) {
    const list = RD_LOCS.filter(l => RD.filter === 'all' || l.type === RD.filter);
    body.innerHTML = `<p class="muted" style="margin:0 0 8px">選一個離你近、時間方便的地方。每個地點能換的東西不一樣。</p>
      <div class="rdfilter" role="group" aria-label="篩選兌換地點">${RD_FILTERS.map(([k, n]) => `<button type="button" data-rd-filter="${k}" aria-pressed="${RD.filter === k}">${n}</button>`).join('')}</div>
      <div class="rdlocs">${list.map(l => {
        const ps = l.items.map(k => RD_ITEMS[k]).filter(i => i.p), min = Math.min(...ps.map(i => i.p));
        return `<button type="button" class="rdloc" data-rd-loc="${l.id}"><span class="lic" style="--c:${l.c}">${rdIcon(l.ic)}</span><span><b>${esc(l.name)}</b>
          <span class="meta"><span class="tag">${l.tn}</span>離你 ${rdDist(l.d)}・${l.hours}</span>
          <span class="chips">${l.items.map(k => `<span>${esc(RD_ITEMS[k].n.replace(/（.*）/, ''))}</span>`).join('')}</span>
          <span class="meta">可換 ${l.items.length} 項・最低 ${min} 點起</span></span><span class="go" aria-hidden="true">›</span></button>`;
      }).join('')}</div>`;
    foot.innerHTML = '';
  } else if (RD.step === 2) {
    const l = rdLoc(), tot = rdTotal(), left = c.points - tot;
    body.innerHTML = `<div class="rdhead"><span class="lic" style="--c:${l.c}">${rdIcon(l.ic)}</span><div><b>${esc(l.name)}</b><div class="muted">${l.tn}・${l.hours}</div></div></div>
      <div class="rditems">${l.items.map(k => {
        const it = RD_ITEMS[k], q = RD.cart[k] || 0;
        if (it.q) {
          const ok = rdQOK(it), have = c[it.q.k];
          return `<div class="rditem ${q ? 'sel' : ''} ${ok ? '' : 'na'}"><span class="iic">${rdIcon(it.ic)}</span><div><b>${esc(it.n)}</b><div class="meta">${esc(it.d)}<br>資格：${it.q.n} ${it.q.u}（目前 ${have}）・不扣點數</div></div>
            <button type="button" class="qbtn" data-rd-q="${k}" aria-pressed="${!!q}" ${ok ? '' : 'disabled'}>${ok ? (q ? '已選取' : '登記') : `還差 ${it.q.n - have}`}</button></div>`;
        }
        const stock = RD_STOCK[k], canAdd = it.p <= left && q < stock;
        return `<div class="rditem ${q ? 'sel' : ''} ${!q && it.p > left ? 'na' : ''}"><span class="iic">${rdIcon(it.ic)}</span><div><b>${esc(it.n)}</b><div class="meta">${esc(it.d)}・剩 ${stock} 份</div><div class="cost">${it.p} 點${!q && it.p > left ? `<span class="muted">・還差 ${it.p - left} 點</span>` : ''}</div></div>
          <div class="stepper"><button type="button" data-rd-dec="${k}" aria-label="減少${esc(it.n)}" ${q ? '' : 'disabled'}>−</button><output aria-live="polite">${q}</output><button type="button" data-rd-inc="${k}" aria-label="增加${esc(it.n)}" ${canAdd ? '' : 'disabled'}>＋</button></div></div>`;
      }).join('')}</div>`;
    const n = Object.values(RD.cart).reduce((s, q) => s + q, 0);
    foot.innerHTML = `<div class="sum">合計 <b>${tot}</b> 點<br><span class="muted">兌換後剩 ${left} 點</span></div><button type="button" class="bigbtn" data-rd-next ${n ? '' : 'disabled'}>下一步</button>`;
  } else if (RD.step === 3) {
    const l = rdLoc(), tot = rdTotal(), lines = Object.entries(RD.cart);
    body.innerHTML = `<div class="rdhead"><span class="lic" style="--c:${l.c}">${rdIcon(l.ic)}</span><div><b>${esc(l.name)}</b><div class="muted">離你 ${rdDist(l.d)}・${l.hours}</div></div></div>
      <div class="rdsec">兌換內容</div><ul class="rdsum">${lines.map(([k, q]) => { const it = RD_ITEMS[k]; return `<li><span>${esc(it.n)}${q > 1 ? ` ×${q}` : ''}</span><b>${it.q ? '資格登記' : `${it.p * q} 點`}</b></li>`; }).join('')}
      <li><span>合計扣點</span><b>${tot} 點</b></li><li><span>兌換後剩餘</span><b>${c.points - tot} 點</b></li></ul>
      <div class="rdnote"><b>領取方式</b><ul><li>確認後會產生兌換券，7 天內到「${esc(l.name)}」出示即可領取。</li><li>逾期未領，點數自動退回。</li>${lines.some(([k]) => RD_ITEMS[k].q) ? '<li>資格型項目會送到承辦單位登記，名單依簽到紀錄排序並公開。</li>' : ''}</ul></div>`;
    foot.innerHTML = `<div class="sum">扣 <b>${tot}</b> 點</div><button type="button" class="bigbtn" data-rd-confirm>確認兌換</button>`;
  } else {
    const k = RD.ticket;
    body.innerHTML = `<div class="voucher"><div><div class="muted">兌換碼</div><div class="code">${k.code}</div><div style="margin-top:6px"><b>${esc(k.loc.name)}</b><div class="muted">${k.loc.hours}</div><div class="muted">${k.until} 前領取</div></div></div><div class="qr" aria-label="兌換條碼（示意）">${rdQR(k.code)}</div></div>
      <div class="rdsec">兌換內容</div><ul class="rdsum">${k.lines.map(x => `<li><span>${esc(x.n)}${x.q > 1 ? ` ×${x.q}` : ''}</span><b>${x.p ? `${x.p * x.q} 點` : '資格登記'}</b></li>`).join('')}</ul>
      <div class="rdnote">${k.spent ? `已扣 ${k.spent} 點，目前剩 ${S.card.points} 點。` : '這次沒有扣點。'}兌換券也存在「我的」裡，到現場再打開出示即可。</div>`;
    foot.innerHTML = `<div class="sum muted">示範流程，不會實際扣點或通知承辦單位。</div><button type="button" class="bigbtn" data-rd-done>完成</button>`;
  }
}
function rdQR(code) {
  let h = 0; for (const ch of code) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const r = () => ((h = (h * 1103515245 + 12345) >>> 0) >>> 16) & 1, N = 15;
  let s = '';
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const fin = (x < 4 && y < 4) || (x > N - 5 && y < 4) || (x < 4 && y > N - 5);
    const on = fin ? (x % (N - 4) === 0 || y % (N - 4) === 0 || x === 3 || y === 3 || x === N - 4 || y === N - 4 || ((x % (N - 4)) === 1 && (y % (N - 4)) === 1) || ((x === 1 || x === N - 3) && (y === 1 || y === N - 3))) : r();
    if (on) s += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }
  return `<svg viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges" fill="#2a2a2a">${s}</svg>`;
}
$('#rdModal').addEventListener('click', e => {
  const c = S.card, q = s => e.target.closest(s);
  let b;
  if (e.target.id === 'rdModal' || q('#rdClose')) { rdClose(); return; }
  if (q('#rdBack')) { RD.step = Math.max(1, RD.step - 1); rdRender(); return; }
  if ((b = q('[data-rd-filter]'))) { RD.filter = b.dataset.rdFilter; rdRender(); }
  else if ((b = q('[data-rd-loc]'))) { RD.loc = b.dataset.rdLoc; RD.cart = {}; RD.step = 2; rdRender(); }
  else if ((b = q('[data-rd-inc]'))) { const k = b.dataset.rdInc; RD.cart[k] = (RD.cart[k] || 0) + 1; rdRender(); }
  else if ((b = q('[data-rd-dec]'))) { const k = b.dataset.rdDec; RD.cart[k] = Math.max(0, (RD.cart[k] || 0) - 1); if (!RD.cart[k]) delete RD.cart[k]; rdRender(); }
  else if ((b = q('[data-rd-q]'))) { const k = b.dataset.rdQ; if (RD.cart[k]) delete RD.cart[k]; else RD.cart[k] = 1; rdRender(); }
  else if (q('[data-rd-next]')) { RD.step = 3; rdRender(); }
  else if (q('[data-rd-confirm]')) {
    const tot = rdTotal(), l = rdLoc(), d = new Date(2026, 9, 23 + 7);
    c.points -= tot; c.spent = (c.spent || 0) + tot;
    RD.ticket = { code: `RX-${1023}-${String(4800 + c.tickets.length * 37 + tot).padStart(4, '0')}`, loc: l, until: `${d.getMonth() + 1}/${d.getDate()}`, spent: tot,
      lines: Object.entries(RD.cart).map(([k, n]) => ({ n: RD_ITEMS[k].n, q: n, p: RD_ITEMS[k].p || 0 })) };
    c.tickets.unshift(RD.ticket);
    Object.entries(RD.cart).forEach(([k, n]) => { if (RD_STOCK[k] != null) RD_STOCK[k] -= n; });
    RD.step = 4; rdRender(); renderMe();
    toast(tot ? `兌換成功，扣 ${tot} 點` : '已送出資格登記');
  } else if (q('[data-rd-done]')) rdClose();
});
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#rdModal').hidden) rdClose(); });
$('#side').addEventListener('click', e => {
  const q = s => e.target.closest(s);
  let b;
  if ((b = q('[data-qv]'))) { S.qv = b.dataset.qv; renderQueue(M.week(S.week)); $('#p-queue').scrollTop = 0; return; }
  if (q('[data-dispall]')) {
    const ps = S.mine.filter(r => !r.dispatched);
    ps.forEach(r => { r.dispatched = r.lv ? LV[r.lv].to : r.t.to; if (dist(r.ll, S.shop.ll) < 500) S.shop.alerts.unshift({ text: r.text.length > 24 ? r.text.slice(0, 24) + '…' : r.text, to: r.dispatched, sev: r.sev }); });
    toast(`已依建議派案 ${ps.length} 筆`); render(); return;
  }
  if (q('[data-rd-open]')) rdOpen();
  else if ((b = q('[data-rd-ticket]'))) { rdOpen(); RD.ticket = S.card.tickets[+b.dataset.rdTicket]; RD.step = 4; rdRender(); }
  else if (q('[data-sb-rank]')) { setTab('m-rank'); renderTabs(); }
  else if (q('[data-sb-apply]')) { S.shop.subsidy = true; renderShop(); toast('已送出補助申請，衛生局審核中（模擬）'); }
  else if (q('[data-sb-fix]')) { const f = $('#m-shop [data-fix]'); if (f) { f.scrollIntoView({ block: 'center', behavior: RM.matches ? 'auto' : 'smooth' }); f.focus({ preventScroll: true }); } }
});

/* ---------- V5：換位置（選行政區與地標，不必滑地圖） ---------- */
const LOC = { dist: null, q: '', from: null };
const PIN_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="9.5" r="2.5" fill="currentColor"/></svg>';
function locOpen() {
  LOC.dist = null; LOC.q = ''; LOC.from = document.activeElement;
  if (S.picking) setPicking(null);
  $('#locModal').hidden = false;
  locRender();
  const i = $('#locQ'); if (i && wide()) i.focus();
}
function locClose() {
  $('#locModal').hidden = true;
  if (LOC.from && LOC.from.isConnected) LOC.from.focus({ preventScroll: true });
}
function locSet(ll, label) {
  S.me = { ll, label };
  locClose();
  render();
  map.setView(ll, 15, { animate: !RM.matches });
  toast(`已切換到「${label}」`);
}
function locRender() {
  const cur = S.me.label, q = LOC.q.trim();
  $('#locBack').hidden = !LOC.dist || !!q;
  $('#locTitle').textContent = LOC.dist && !q ? LOC.dist : '你在哪裡？';
  const item = (d, [n, lat, lon]) => `<button type="button" class="${cur === n + '周邊' ? 'cur' : ''}" data-loc-pt="${lat},${lon}" data-loc-n="${esc(n)}"><span class="pinic">${PIN_SVG}</span><span>${esc(n)}<small>${d}</small></span><span class="go" aria-hidden="true">›</span></button>`;
  let list = '';
  if (q) {
    const hits = LOC_DATA.flatMap(([d, pts]) => (d.includes(q) ? pts : pts.filter(([n]) => n.includes(q))).map(p => item(d, p)));
    list = `<div class="locsec">搜尋結果</div><div class="loclist">${hits.join('') || '<div class="locempty">找不到這個地點，試試行政區名稱或捷運站。</div>'}</div>`;
  } else if (LOC.dist) {
    const [d, pts] = LOC_DATA.find(([x]) => x === LOC.dist);
    list = `<div class="locsec">選一個離你最近的地方</div><div class="loclist">${pts.map(p => item(d, p)).join('')}</div>`;
  } else {
    list = `<div class="locsec">選行政區</div><div class="locdist">${LOC_DATA.map(([d]) => `<button type="button" data-loc-dist="${d}">${d.replace('區', '')}</button>`).join('')}</div>`;
  }
  $('#locBody').innerHTML = `<label class="locsearch"><span class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">搜尋地點</span><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="m20 20-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><input id="locQ" type="search" placeholder="輸入行政區、捷運站或地標" value="${esc(LOC.q)}" autocomplete="off"></label>
    ${q || LOC.dist ? '' : `<div class="locquick"><button type="button" data-loc-gps>${PIN_SVG}使用目前定位</button><button type="button" data-loc-map>在地圖上點選</button></div>`}
    <div class="muted" style="margin:0 0 12px">目前：${esc(cur)}</div>
    ${list}`;
}
$('#locModal').addEventListener('click', e => {
  const q = s => e.target.closest(s);
  let b;
  if (e.target.id === 'locModal' || q('#locClose')) locClose();
  else if (q('#locBack')) { LOC.dist = null; locRender(); }
  else if ((b = q('[data-loc-dist]'))) { LOC.dist = b.dataset.locDist; locRender(); }
  else if ((b = q('[data-loc-pt]'))) { const [lat, lon] = b.dataset.locPt.split(',').map(Number); locSet([lat, lon], b.dataset.locN + '周邊'); }
  else if (q('[data-loc-map]')) { locClose(); setPicking('me'); }
  else if (q('[data-loc-gps]')) {
    if (!navigator.geolocation) { toast('這個瀏覽器不支援定位，請改選行政區'); return; }
    navigator.geolocation.getCurrentPosition(p => {
      const ll = [p.coords.latitude, p.coords.longitude], h = M.hexOfLL(ll[0], ll[1]);
      if (h < 0) { toast('你目前不在臺北市內，請改選行政區'); return; }
      locSet(ll, `${M.placeOf(h)}一帶`);
    }, () => toast('無法取得定位，請改選行政區'), { timeout: 8000 });
  }
});
// 中文輸入法組字時不要重繪，等組字完成再搜尋
const locSearch = e => {
  if (e.target.id !== 'locQ' || e.isComposing) return;
  LOC.q = e.target.value;
  const pos = e.target.selectionStart;
  locRender();
  const i = $('#locQ'); i.focus(); i.setSelectionRange(pos, pos);
};
$('#locModal').addEventListener('input', locSearch);
$('#locModal').addEventListener('compositionend', locSearch);
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#locModal').hidden) locClose(); });
$('#btnRules').addEventListener('click', () => setTab('p-rules'));
$('#btnHero').addEventListener('click', showHero);
$('#btnHome').addEventListener('click', showHero);
const CFK = { citizen: ['h60', 'h80', 'h92', 'clean', 'garbage', 'monitor', 'bait', 'trap'], merchant: ['h60', 'h80', 'h92', 's1', 's2', 's3'], gov: ['lv1', 'lv2', 'lv3', 'lv4', 'lv5'] };
function setMenu(o) { $('#navmenu').hidden = !o; $('#burger').setAttribute('aria-expanded', String(o)); $('#burger').setAttribute('aria-label', o ? '關閉選單' : '開啟選單'); }
$('#burger').addEventListener('click', e => { e.stopPropagation(); setMenu($('#navmenu').hidden); if (!$('#navmenu').hidden) { const f = $('#navmenu button'); if (f) f.focus(); } });
$('#navmenu').addEventListener('click', e => {
  const b = e.target.closest('[data-menu]');
  if (!b) return;
  setMenu(false);
  if (b.dataset.menu === 'close') $('#burger').focus();
  else if (b.dataset.menu === 'hero') showHero(); else { setTab(b.dataset.menu); renderTabs(); }
});
document.addEventListener('click', e => { if (!$('#navmenu').hidden && !e.target.closest('#navmenu,#burger')) setMenu(false); });
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#navmenu').hidden) { setMenu(false); $('#burger').focus(); } });
{ const cp = map.closePopup.bind(map); map.closePopup = (...a) => { hidePop(); return cp(...a); }; }
$('#popModal').addEventListener('click', e => { if (e.target.id === 'popModal' || e.target.closest('#popClose')) hidePop(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#popModal').hidden) hidePop(); });
$('#lgToggle').addEventListener('click', () => { const o = $('#legend').classList.toggle('open'); $('#lgToggle').setAttribute('aria-expanded', String(o)); });
$('#legend').addEventListener('click', e => {
  const b = e.target.closest('[data-cf]'), all = e.target.closest('[data-cfall]');
  if (!b && !all) return;
  let focusK = null;
  if (all) S.cf = null;
  else {
    const k = b.dataset.cf;
    focusK = k;
    if (!S.cf) S.cf = new Set([k]);
    else if (S.cf.has(k)) S.cf.delete(k);
    else S.cf.add(k);
    if (S.cf && (!S.cf.size || S.cf.size === cfKeys().length)) S.cf = null;
  }
  map.closePopup();
  render();
  const f = focusK ? $(`#legend [data-cf="${focusK}"]`) : $('#legend [data-cf]');
  if (f) f.focus({ preventScroll: true });
});
addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!$('#doneModal').hidden) { closeDone(); return; }
  if (!$('#hero').classList.contains('gone')) enter(S.role);
  else if (S.repOpen && S.picking === 'report') setPicking(null);
  else if (S.repOpen) closeReport();
});
$('#repModal').addEventListener('click', e => {
  if (e.target.id === 'repModal' || e.target.closest('#repClose')) { closeReport(); return; }
  const b = e.target.closest('[data-pick]');
  if (b) setPicking(S.picking === b.dataset.pick ? null : b.dataset.pick);
  else if (e.target.closest('#c-send')) sendReport();
});
document.addEventListener('click', e => { const b = e.target.closest('[data-done]'); if (b) openDone(b.dataset.done); });
$('#doneModal').addEventListener('click', e => { if (e.target.id === 'doneModal' || e.target.closest('#doneClose')) closeDone(); });
$('#doneModal').addEventListener('keydown', e => { if (e.key === 'Tab') { e.preventDefault(); $('#doneClose').focus(); } });
$('#repModal').addEventListener('input', e => {
  if (e.target.id !== 'c-draft') return;
  S.report.text = e.target.value;
  $('#c-pv').innerHTML = preview(S.report.text, S.report.ll || S.me.ll, NW, '這筆通報會送到');
  $('#c-send').disabled = !S.report.text.trim();
});
$('#repModal').addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const f = [...$('#repModal').querySelectorAll('button:not([disabled]),textarea,[href],input,select')].filter(x => x.offsetParent);
  if (!f.length) return;
  const a = f[0], z = f[f.length - 1];
  if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
  else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
});
$('#range').addEventListener('input', e => { play(false); setWeek(+e.target.value); });
$('#play').addEventListener('click', () => play(!S.timer));
map.on('click', e => { if (S.picking) pickAt(e.latlng); });
map.on('zoomend', () => {
  $('#map').classList.toggle('far', map.getZoom() < 11);
  if (S.role === 'gov' && S.view === 'triage') { const W = M.week(S.week); triagePoints(W); l1Labels(W); }
  if (S.role === 'gov' && S.view === 'risk') cvsPoints(M.week(S.week));
});
addEventListener('resize', renderTimeline);
document.addEventListener('click', e => { if (e.target.closest('[data-cvstoggle]')) toggleCvs(); }, true);
DARK.addEventListener('change', () => { readPal(); drawBoundary(); render(); drawRadar(M.week(S.week)); });

/* ---------- 啟動 ---------- */
readPal();
deriveShops();
drawBoundary();
initTimeline();
$('#play').innerHTML = PLAY;
renderRules();
renderTryPane();
renderReportPane();
seedDone();
document.body.dataset.role = S.role;
$$('#roles button').forEach(b => b.setAttribute('aria-pressed', b.dataset.role === S.role));
fitCity();
if (!wide()) $('#side').classList.add('min');
render();
drawRadar(M.week(S.week));
heroStats(M.week(S.week));

/* ---------- LINE 市民端導覽視窗：遮罩＋手機流程，結束後接到市府那件任務 ---------- */
// 和手機面板並用：電腦上只留首頁入口（頂列與 L 鍵交給手機面板），手機寬度時頂列才出現導覽按鈕
const TOUR_HERO_ONLY = true;
const PHONE_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 18.5h3" stroke-linecap="round"/></svg>';
let tourBack = null;
function tourBuild() {
  if ($('#tourMask')) return $('#tourMask');
  const m = document.createElement('div');
  m.id = 'tourMask';
  m.setAttribute('role', 'dialog');
  m.setAttribute('aria-modal', 'true');
  m.setAttribute('aria-label', '市民端：臺北市政府 LINE 官方帳號');
  m.innerHTML = `<div class="tourhd"><b>市民端・臺北市政府 LINE 官方帳號（示意）</b><button type="button" id="tourClose" aria-label="關閉導覽，回到網站"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div><iframe title="LINE 官方帳號流程示意"></iframe>`;
  m.querySelector('iframe').src = LINE_OA + '?demo';
  document.body.appendChild(m);
  $('#tourClose').addEventListener('click', () => tourClose(false));
  return m;
}
function tourOpen() {
  tourBack = document.activeElement;
  const m = tourBuild(), f = m.querySelector('iframe');
  // 第二次打開時從第一個畫面重來
  if (m.dataset.loaded) f.contentWindow.postMessage({ type: 'oa-tour', action: 'restart' }, '*');
  f.addEventListener('load', () => { m.dataset.loaded = 1; f.focus(); }, { once: true });
  m.classList.add('on');
  setTimeout(() => f.focus(), 60);
}
function tourClose(land) {
  const m = $('#tourMask');
  if (!m || !m.classList.contains('on')) return;
  m.classList.remove('on');
  if (land) tourLand();
  else if (tourBack && tourBack.focus) tourBack.focus({ preventScroll: true });
}
/* 手機流程最後送出的那件「環境清潔」：最新一週、離雙連最近的一件，市府端停在「待驗收」 */
function tourTask() {
  const all = govTasks(M.week(NW)), d = t => (t.ll[0] - S.me.ll[0]) ** 2 + (t.ll[1] - S.me.ll[1]) ** 2;
  const pool = all.filter(t => t.type === 'clean');
  return (pool.length ? pool : all).slice().sort((a, b) => d(a) - d(b))[0];
}
function tourLand() {
  // 真的手機上看：結尾回到市民地圖
  if (innerWidth <= 860) {
    if (!$('#hero').classList.contains('gone')) enter('citizen');
    else if (S.role !== 'citizen') setRole('citizen');
    return;
  }
  const t = tourTask();
  if (!$('#hero').classList.contains('gone')) enter('gov');
  else if (S.role !== 'gov') setRole('gov');
  if (!t) return;
  tkSet(t.id, 'approved');
  S.tk.pushed[t.id] = true; // 手機那段的確認卡寫 3／4 人，這裡對上
  S.card.joined.add(t.id);
  S.card.finished.add(t.id);
  render();
  setTimeout(() => { govTaskGo(t.id); toast(`${S.card.nick} 剛送出整理前後照片，等你驗收`); }, 380);
}
addEventListener('message', e => {
  if (!e.data || e.data.type !== 'oa-tour') return;
  if (e.data.action === 'done') tourClose(true);
  if (e.data.action === 'close') tourClose(false);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#tourMask.on')) { tourClose(false); return; }
  // L：簡報時不用找滑鼠就能叫出導覽
  if (!TOUR_HERO_ONLY && (e.key === 'l' || e.key === 'L') && !e.metaKey && !e.ctrlKey && !e.altKey && !(e.target.closest && e.target.closest('input,textarea,select,[contenteditable]')) && !$('#tourMask.on')) tourOpen();
});
{
  const b = document.createElement('button');
  b.type = 'button'; b.id = 'btnTour'; b.title = '市民怎麼從 LINE 收到通知、完成任務（快捷鍵 L）';
  b.innerHTML = PHONE_SVG + '<span>LINE 市民端</span>';
  b.addEventListener('click', tourOpen);
  if (TOUR_HERO_ONLY) { b.classList.add('mobonly'); b.title = '市民怎麼從 LINE 收到通知、完成任務'; b.querySelector('span').textContent = 'LINE 通知'; }
  $('.toplinks').prepend(b);
  const e = $('[data-enter]');
  if (e) {
    const h = document.createElement('button');
    h.type = 'button'; h.id = 'heroTour';
    h.innerHTML = '<i></i>先看市民怎麼從 LINE 收到通知';
    h.addEventListener('click', tourOpen);
    e.parentElement.after(h);
  }
}

/* ---------- 手機面板：LINE 通知／市民／店家，可以直接操作，和市府端連動 ---------- */
const PH_EMB = new URLSearchParams(location.search).get('phone');
const PH_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 18.5h3" stroke-linecap="round"/></svg>';
const phSay = (action, x) => { try { parent.postMessage(Object.assign({ type: 'phone', action }, x), '*'); } catch (e) {} };
if (PH_EMB) {
  // 這份是手機面板裡的市民或店家：直接進入該身份，狀態回報給外層網站
  document.body.classList.add('phemb');
  enter(PH_EMB);
  addEventListener('keydown', e => { if (e.key === 'Escape') phSay('close'); });
  addEventListener('message', e => {
    const d = e.data;
    if (!d || d.type !== 'phone' || d.action !== 'state') return;
    S.shop.govNotes = d.govNotes || [];
    render();
  });
  let shopKey = '';
  setInterval(() => {
    const k = S.shop.fixed + '/' + S.shop.recheck;
    if (k !== shopKey) { shopKey = k; phSay('shop', { fixed: S.shop.fixed, recheck: S.shop.recheck }); }
  }, 600);
} else {
  let phBack = null, phTab = 'line', phSub = false, phLanded = false, phTask = null;
  const phFrame = k => $(`#phMask iframe[data-ph="${k}"]`);
  function phBuild() {
    if ($('#phMask')) return $('#phMask');
    const m = document.createElement('div');
    m.id = 'phMask';
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.setAttribute('aria-label', '手機畫面：LINE 通知、市民、店家');
    m.innerHTML = `<div id="phPanel"><div class="phtabs"><div class="seg" role="tablist" aria-label="手機畫面">${[['line', 'LINE 通知'], ['citizen', '市民'], ['merchant', '店家']].map(([k, n]) => `<button type="button" role="tab" data-ph="${k}" aria-selected="false">${n}</button>`).join('')}</div><button type="button" class="ghost" id="phRestart">重來</button><button type="button" id="phClose" aria-label="關閉手機畫面，回到網站"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
      <div class="phbox"><div class="phframe"><div class="phscr">${['line', 'citizen', 'merchant'].map(k => `<iframe data-ph="${k}" title="${k === 'line' ? 'LINE 官方帳號' : k === 'citizen' ? '市民手機版' : '店家手機版'}"></iframe>`).join('')}</div></div></div></div>`;
    document.body.appendChild(m);
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-ph]');
      if (b && b.tagName === 'BUTTON') return phShow(b.dataset.ph);
      if (e.target.closest('#phClose') || e.target === m) return phClose();
      if (e.target.closest('#phRestart')) phRestart();
    });
    phFit();
    return m;
  }
  function phFit() {
    const m = $('#phMask');
    if (m) m.style.setProperty('--ps', Math.max(0.5, Math.min(1, (innerHeight - 90) / 800)).toFixed(3));
  }
  addEventListener('resize', phFit);
  function phShow(k) {
    phTab = k;
    $$('#phMask .seg [data-ph]').forEach(b => b.setAttribute('aria-selected', b.dataset.ph === k));
    $('#phRestart').hidden = k !== 'line';
    const f = phFrame(k);
    if (!f.dataset.loaded) {
      f.dataset.loaded = 1;
      if (k === 'line') f.src = LINE_OA + '?phone';
      else { f.addEventListener('load', phSync); f.src = location.href.split(/[?#]/)[0] + '?phone=' + k; }
    }
    $$('#phMask .phscr iframe').forEach(x => x.classList.toggle('on', x === f));
    setTimeout(() => f.focus(), 60);
  }
  // 店家分頁收到市府通知
  function phSync() {
    const f = phFrame('merchant');
    if (f && f.dataset.loaded && f.contentWindow) f.contentWindow.postMessage({ type: 'phone', action: 'state', govNotes: S.shop.govNotes || [] }, '*');
  }
  function phOpen(k) {
    phBack = document.activeElement;
    phBuild().classList.add('on');
    phSync();
    phShow(k || phTab);
  }
  function phClose() {
    const m = $('#phMask');
    if (!m || !m.classList.contains('on')) return;
    m.classList.remove('on');
    if (phSub && !phLanded) { phLanded = true; phLand(); }
    else if (phBack && phBack.focus) phBack.focus({ preventScroll: true });
  }
  function phRestart() {
    const f = phFrame('line');
    phSub = false; phLanded = false;
    if (f && f.contentWindow) f.contentWindow.postMessage({ type: 'oa-tour', action: 'restart' }, '*');
  }
  /* LINE 裡送出的那件「環境清潔」：最新一週、離雙連最近的一件，市府端停在「待驗收」 */
  function phTaskPick() {
    const all = govTasks(M.week(NW)), d = t => (t.ll[0] - S.me.ll[0]) ** 2 + (t.ll[1] - S.me.ll[1]) ** 2;
    const pool = all.filter(t => t.type === 'clean');
    return (pool.length ? pool : all).slice().sort((a, b) => d(a) - d(b))[0];
  }
  function phLand() {
    const t = phTaskPick();
    if (!$('#hero').classList.contains('gone')) enter('gov');
    else if (S.role !== 'gov') setRole('gov');
    if (!t) return;
    phTask = t.id;
    tkSet(t.id, 'approved');
    S.tk.pushed[t.id] = true; // LINE 的確認卡寫 3／4 人，這裡對上
    S.card.joined.add(t.id);
    S.card.finished.add(t.id);
    render();
    setTimeout(() => { govTaskGo(t.id); toast(`${S.card.nick} 剛送出整理前後照片，等你驗收`); }, 380);
  }
  // 市府驗收通過 → LINE 收到推播
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-tk-ok]');
    if (!b || b.dataset.tkOk !== phTask) return;
    const f = phFrame('line');
    if (f && f.contentWindow) f.contentWindow.postMessage({ type: 'oa-tour', action: 'verified' }, '*');
    setTimeout(() => toast('LINE 已推播「驗收通過 +10 點」給志工'), 900);
  }, true);
  addEventListener('message', e => {
    const d = e.data;
    if (!d) return;
    if (d.type === 'oa-tour') {
      if (d.action === 'submitted') phSub = true;
      if (d.action === 'close') phClose();
    }
    if (d.type !== 'phone') return;
    if (d.action === 'close') phClose();
    if (d.action === 'report') phReport(d.text, d.ll);
    if (d.action === 'shop') { S.shop.fixed = d.fixed; S.shop.recheck = d.recheck; render(); refreshPop(); }
  });
  // 市民分頁送出的通報，用同一套判讀放進市府的「市民通報」
  function phReport(text, ll) {
    const h = M.hexOfLL(ll[0], ll[1]), j = M.judge(text, 'form'), t = M.triage(j, M.week(NW).ctx(h));
    S.mine.unshift({ id: 'U' + Date.now(), ll, hex: h, text, j, t, lv: t.lv, dispatched: null, sev: M.severity(j, M.week(NW).ctx(h), { text, src: 'form', tags: [], w: NW }) });
    render();
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && $('#phMask.on')) { phClose(); return; }
    if (innerWidth > 860 && (e.key === 'l' || e.key === 'L') && !e.metaKey && !e.ctrlKey && !e.altKey && !(e.target.closest && e.target.closest('input,textarea,select,[contenteditable]')) && !$('#phMask.on')) phOpen();
  });
  const b = document.createElement('button');
  b.type = 'button'; b.id = 'btnPhone'; b.title = '打開手機畫面：LINE 通知、市民、店家（快捷鍵 L）';
  b.innerHTML = PH_SVG + '<span>手機</span>';
  b.addEventListener('click', () => phOpen());
  $('.toplinks').prepend(b);
  // 市府通知店家後，店家分頁同步
  setInterval(() => { const n = (S.shop.govNotes || []).length; if (n !== window.__phN) { window.__phN = n; phSync(); } }, 800);
}
window.ratTriage = { map, get model() { return M; }, setWeek, setView, setTab, setRole, handleFiles };
}
