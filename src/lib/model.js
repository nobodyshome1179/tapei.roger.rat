/* ============================================================
   檢傷模型
   圖資與分析：北市鼠情週報（openData）的模擬資料、350 公尺六角格、
   Gi* 熱點與風險模型，原樣沿用。
   分級概念：鼠患檢傷站（level）的五級檢傷與派案對象。
   ============================================================ */
export function makeModel(OD, bundle, opt = {}) {
  const { Lc, Hc, Kc, qc, Jc, tl, sl, cl, Nl, kl, Uc, rc, pc, ml, wl, Tl, Fs, Is, hl, gl, Sl, nl, il, al, qs, ec } = OD;

  /* ---- 週報預設狀態：格子 350 公尺、老鼠活動範圍「依文獻」、不校正、不做穩健度與人口校正 ---- */
  const GRID = makeModel.grid || (makeModel.grid = Hc(350));
  const SIM = makeModel.sim || (makeModel.sim = Lc());
  /* 真實資料包：同週報的 hl()；缺的項目沿用模擬 */
  const real = bundle ? hl(bundle, GRID) : null;
  if (real) {
    let k = 0;
    for (const p of (bundle.radar && bundle.radar.points) || []) {
      if (p[2] < 1 || p[2] > 41 || p[3] === 1) continue;
      if (real.radarPoints[k]) real.radarPoints[k].desc = p[5] || '';
      k++;
    }
  }
  const realReports = !!(real && real.radarPoints.length);
  const rats = realReports ? real.radarPoints : SIM.rats;
  const RBW = qc(rats);
  const SNK = Jc(SIM.snakes, GRID);
  const FEAT = real ? real.features : ml(GRID);
  const CNT = Kc(rats, GRID, Uc.lit.sigma);
  const W1999 = real && real.weekly1999 ? real.weekly1999 : null;
  if (W1999) for (let w = 1; w <= 41; w++) CNT.totals.r1999[w] = W1999[w];
  const AN = tl(CNT, GRID, { r1999: true, radar: true, imported: false }, 'none', null);
  const BAIT = realReports ? gl(real.baitPoints, GRID) : Int16Array.from(GRID.bait, e => (e ? 18 : 0));
  const POIS = real && real.pois ? real.pois : Sl();
  if (real && real.pois && bundle.pois) real.pois.forEach((p, i) => { const q = bundle.pois[i] || []; p.cvs = q[4] === 'cvs'; p.fac = q[5] == null ? null : String(q[5]); });
  const NW = 41;

  const MASKED = [];
  for (let i = 0; i < GRID.H; i++) if (GRID.mask[i]) MASKED.push(i);
  const hexAt = (x, y) => {
    const h = GRID.hexOf(x, y);
    return h === undefined || !GRID.mask[h] ? -1 : h;
  };
  const hexOfLL = (lat, lon) => hexAt(...Fs(lat, lon));
  const hexLL = i => Is(GRID.hexes[i].cx, GRID.hexes[i].cy);
  const placeOf = i => rc[GRID.nearSite[i]].n;
  const districtOf = i => (GRID.district[i] >= 0 ? pc[GRID.district[i]] : '');

  const REPORTS = [[]];
  for (let w = 1; w <= NW; w++) {
    REPORTS[w] = RBW[w]
      .map((p, k) => ({ id: w + '-' + k, w, src: p.src, ll: p.ll, tags: p.tags || 0, desc: p.desc || '', hex: hexAt(p.x, p.y) }))
      .filter(r => r.hex >= 0);
  }
  const TOTALS = REPORTS.map(a => a.length);

  /* ---- 五級檢傷（鼠患檢傷站） ---- */
  const LV = {
    1: { name: '緊急處置', to: '市府跨局處統籌（待審核）', short: '聯合處置', act: '優先查核，依風險源頭啟動必要的跨局處處置' },
    2: { name: '優先處理', to: '市府權責單位（待審核）', short: '優先查核', act: '優先查核現場、確認主要風險來源與處置方式' },
    3: { name: '一般處理', to: '市府權責單位（待審核）', short: '安排勤務', act: '依環境問題類型安排例行改善與追蹤' },
    4: { name: '追蹤觀察', to: '市府監測窗口', short: '追蹤觀察', act: '持續彙整監測資料，必要時補充查核' },
    5: { name: '紀錄衛教', to: '市府監測窗口', short: '紀錄衛教', act: '保留通報與衛教提醒，必要時請求補充資料' },
    0: { name: '待補充／轉介', to: '', short: '待補充', act: '' }
  };
  /* 1 級門檻：週報的模擬通報集中在約 20 個公共場所，原本的 8%／85 太容易達到，
     這裡加嚴並要求 Gi* 99% 顯著，見「依據」分頁。 */
  const T = { n: 6, share: 0.12, s1: 90, src4: 97 };

  /* 週報把見鼠地圖的說明轉成 7 種標籤（位元順序同週報） */
  const TAGS = ['sewer', 'alley', 'indoor', 'garbage', 'foodbiz', 'green', 'construction'];
  const TAG_ZH = { sewer: '水溝下水道', alley: '防火巷後巷', indoor: '室內', garbage: '垃圾廚餘', foodbiz: '餐飲攤商', green: '公園綠地', construction: '工地空屋' };

  /* AI 判讀（規則模擬，沿用鼠患檢傷站；正式版改由語言模型產生相同欄位） */
  function judge(text, channel) {
    const t = (text || '').toLowerCase();
    const j = { signs: [], places: [], many: false, rel: 'rat', conf: 0.7 };
    if (channel === 'bait') { j.rel = 'bait'; return j; }
    const rat = /鼠|jerry|米奇|mickey/i.test(t);
    j.wild = /(死|倒在|奄奄|流血|不動|抽搐).{0,8}(老鷹|鷹|貓頭鷹|鴞|鳶|猛禽|鳥|蛇)|(老鷹|鷹|貓頭鷹|鴞|鳶|猛禽|鳥|蛇).{0,8}(死|倒在|奄奄|流血|不動|抽搐)/.test(t);
    if (j.wild && !/老鼠|死鼠|鼠糞|鼠洞/.test(t)) { j.rel = 'wild'; j.conf = 0.85; return j; }
    if (/錢鼠|鼩鼱/.test(t) && !/老鼠/.test(t)) { j.rel = 'shrew'; j.conf = 0.85; return j; }
    if (!rat && /蟑螂|小強/.test(t)) { j.rel = 'roach'; j.conf = 0.9; return j; }
    if (channel === 'form' && !rat) { j.rel = t.trim().length < 6 ? 'unknown' : 'other'; j.conf = 0.6; return j; }
    if (rat) j.conf = 0.95;
    const a = (arr, k, re) => { if (re.test(t) && !arr.includes(k)) arr.push(k); };
    a(j.signs, '鼠糞', /糞|屎|大便/);
    a(j.signs, '咬痕', /咬|啃/);
    a(j.signs, '死鼠', /死老鼠|死鼠|屍/);
    a(j.signs, '鼠洞', /洞/);
    a(j.signs, '入侵室內', /屋內|家裡|家中|室內|天花板|廚房|冷氣孔|陽台|樓梯間|房間|夾層/);
    const m = t.match(/(\d+)\s*隻/);
    j.many = /很多|一群|成群|群聚|大量|好幾|多隻|整群|到處|一堆|超多|開會/.test(t) || !!(m && +m[1] >= 3);
    if (j.many) j.signs.push('數量多');
    a(j.places, '餐飲', /餐廳|小吃|店|攤|美食街|餐飲|飲料|麵|飯|火鍋|超商|超市|小七|7-?11|萊爾富/i);
    a(j.places, '市場夜市', /夜市|市場|菜市/);
    a(j.places, '水溝下水道', /水溝|下水道|排水|溝蓋|溝|人孔|管線|管道/);
    a(j.places, '垃圾廚餘', /垃圾|廚餘|回收|子母車/);
    a(j.places, '公園綠地', /公園|綠地|草地|花圃|樹/);
    a(j.places, '巷弄', /巷|騎樓|停車場/);
    j.food = j.places.includes('餐飲') || j.places.includes('市場夜市');
    j.sewer = j.places.includes('水溝下水道');
    j.trash = j.places.includes('垃圾廚餘');
    return j;
  }

  /* 模擬通報沒有原文：見鼠地圖用週報的線索標籤，1999 陳情沒有描述 */
  function judgeTags(r) {
    if (r.desc) return Object.assign(judge(r.desc, 'radar'), { tags: TAGS.filter((k, i) => r.tags & (1 << i)) });
    if (r.src !== 'radar') return { rel: 'rat', signs: [], places: [], tags: [], many: false, food: false, sewer: false, trash: false, conf: 0.7, noText: true };
    const tags = TAGS.filter((k, i) => r.tags & (1 << i));
    return {
      rel: 'rat', signs: [], places: tags.map(k => TAG_ZH[k]), tags, many: false, conf: 0.9,
      sewer: tags.includes('sewer'), food: tags.includes('foodbiz'), trash: tags.includes('garbage')
    };
  }

  /* 檢傷：依序判斷，符合就停（鼠患檢傷站的規則順序） */
  function triage(j, x) {
    const why = [];
    if (j.rel === 'roach') return { lv: 0, to: '轉介：其他病媒防治', why: ['辨識為蟑螂，非一般鼠患'] };
    if (j.rel === 'shrew') return { lv: 0, to: '轉介：錢鼠衛教', why: ['疑似錢鼠，待確認物種'] };
    if (j.rel === 'wild') return { lv: 0, to: '轉介：野生動物相關單位', why: ['通報為死亡或受傷野生動物，需專業確認'] };
    if (j.rel !== 'rat') return { lv: 0, to: '請補充通報內容', why: ['尚無法判斷是否與鼠患有關'] };
    const s = x ? x.s : 0, src = !!(x && x.src), c = x ? x.cl : { n: 0, share: 0 };
    const signals = [j.sewer, j.food, j.trash, j.many].filter(Boolean).length;
    const hot = !!(x && x.hot99 && c.n >= T.n && c.share >= T.share && s >= T.s1);
    why.push(x ? `區塊風險 ${s}／99；近期周邊通報 ${c.n} 筆` : '地點缺少區域監測資訊，建議補充位置');
    if (j.sewer) why.push('疑似排水或管線問題（問題類型，不直接決定級別）');
    if (j.food) why.push('餐飲或市場環境線索（問題類型，不直接決定級別）');
    if (j.trash) why.push('垃圾或廚餘線索（問題類型，不直接決定級別）');
    if (hot || (j.many && s >= 90 && (j.food || signals >= 2))) {
      why.push('高風險且出現集中／持續異常，建議緊急專業覆核');return {lv:1,why};
    }
    if ((j.many && s >= 65) || (s >= 90 && signals >= 1) || (s >= 80 && c.n >= 4 && signals >= 2)) {
      why.push('多重證據或高風險情境，應優先實地查核');return {lv:2,why};
    }
    if ((s >= 60 && signals >= 1) || signals >= 2 || (src && s >= 85) || (j.many && s >= 40)) {
      why.push('已有具體環境線索，建議例行處置');return {lv:3,why};
    }
    if (s >= 40 || signals >= 1 || c.n >= 2) {
      why.push('目前優先累積觀察，後續通報可升級');return {lv:4,why};
    }
    why.push(j.noText ? '缺少文字證據，先保留紀錄' : '單次低風險目擊，先列入監測與衛教');
    return {lv:5,why};
  }

  /* ---- 餌站與捕鼠籠（模擬）：設在投藥區，記錄每週觀察；市民只觀察，不投放 ---- */
  const ST = {
    monitor: { ok: '餌塊完整', gnaw: '有咬痕', eaten: '被吃掉大半', nontarget: '其他動物在吃或進出', moved: '盒子損壞或移位' },
    bait: { ok: '在原位、完整', part: '部分被吃', all: '全被吃', exposed: '毒餌外露', nontarget: '其他動物進出或啃咬', moved: '盒子損壞或移位', dead: '附近有死鼠' },
    trap: { none: '沒有變化', eaten: '誘餌被吃', caught: '籠內有鼠', nontarget: '籠內是其他動物', moved: '籠子損壞或移位' }
  };
  const ACTIVE = new Set(['part', 'all', 'dead', 'eaten', 'caught', 'gnaw']);
  const ALERT = { nontarget: '非目標動物接觸：毒餌盒先暫停，改用無毒監測餌或捕鼠籠；籠內的其他動物由巡查員處理。', dead: '附近有死鼠：由社區環境衛生師處理，旁人不要觸碰。', exposed: '毒餌外露：立即回收，提醒路人與寵物遠離。', moved: '餌站損壞或移位：暫停使用並補設。', all: '餌已吃完：安排補餌，並檢查周邊鼠洞。', caught: '籠內有鼠：由社區防鼠巡查員處理，不要開籠。' };
  const rnd = seed => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const nbOf = h => [h, ...[0, 1, 2, 3, 4, 5].map(e => GRID.nb[h * 6 + e]).filter(b => b >= 0 && GRID.mask[b])];
  const localAct = (h, w) => { let v = 0; for (const b of nbOf(h)) for (let k = Math.max(1, w - 3); k <= w; k++) v += CNT.bySrc.r1999[k][b] + CNT.bySrc.radar[k][b]; return v; };
  const STATIONS = (() => {
    const out = [], rr = rnd(20261021), tag = {};
    for (const h of MASKED.filter(i => BAIT[i] > 0 && BAIT[i] <= NW)) {
      const k = rr() < 0.5 ? 3 : 2, c = GRID.hexes[h];
      for (let i = 0; i < k; i++) {
        const ang = rr() * Math.PI * 2, d = 40 + rr() * 110, x = c.cx + Math.cos(ang) * d, y = c.cy + Math.sin(ang) * d;
        const pre = placeOf(h).replace(/[、，（].*$/, '').slice(0, 2);
        tag[pre] = (tag[pre] || 0) + 1;
        out.push({ id: 'S' + out.length, code: `${pre}-${String(tag[pre]).padStart(2, '0')}`, kind: (q => (q < 0.45 ? 'monitor' : q < 0.55 ? 'trap' : 'bait'))(rr()), ll: Is(x, y), hex: h, start: BAIT[h], obs: new Array(NW + 1).fill(null) });
      }
    }
    const parks = POIS.filter(p => p.kind === 1);
    for (const st of out) {
      const d = Math.min(Infinity, ...parks.map(p => Math.hypot((p.ll[1] - st.ll[1]) * 100900, (p.ll[0] - st.ll[0]) * 110900)));
      if (d <= 1000 && st.kind !== 'monitor') { st.kind = 'monitor'; st.why = `距離公園綠地約 ${Math.round(d / 10) * 10} 公尺，猛禽與其他動物較多，只放無毒監測餌。`; }
    }
    for (let w = 18; w <= NW; w++) {
      const rec = al(SNK, GRID.H, w);
      for (const st of out) if (st.kind === 'bait' && w >= st.start && w <= st.start + 8 && nbOf(st.hex).some(b => rec[b]) && il(AN, GRID, st.hex, w, BAIT) === 'poison') { st.kind = 'trap'; st.why = '附近有蛇類目擊，改用捕鼠籠，避免蛇與猛禽二次中毒。'; }
    }
    let mx = 1e-9;
    const act = out.map(st => { const a = new Float32Array(NW + 1); for (let w = st.start; w <= NW; w++) { a[w] = localAct(st.hex, w); mx = Math.max(mx, a[w]); } return a; });
    out.forEach((st, i) => {
      const r = rnd(7919 * (i + 1));
      for (let w = st.start; w <= NW; w++) {
        const pro = r() < 0.7, cit = r() < 0.22, u = r(), v = r(), z = r(), p = Math.min(0.9, 0.06 + 0.8 * Math.sqrt(act[i][w] / mx));
        const sv = st.kind === 'bait' ? (z < 0.015 ? 'exposed' : z < 0.035 ? 'nontarget' : z < 0.055 ? 'moved' : u < p ? (v < 0.06 ? 'dead' : v < 0.4 ? 'all' : 'part') : 'ok')
          : st.kind === 'monitor' ? (z < 0.03 ? 'nontarget' : z < 0.05 ? 'moved' : u < p ? (v < 0.35 ? 'eaten' : 'gnaw') : 'ok')
          : z < 0.04 ? 'nontarget' : z < 0.07 ? 'moved' : u < p ? (v < 0.4 ? 'caught' : 'eaten') : 'none';
        if (pro || cit) st.obs[w] = { st: sv, by: pro ? '社區環境衛生師' : '防鼠志工', w };
      }
    });
    return out;
  })();
  const stCache = {};
  function stationWeek(w) {
    if (stCache[w]) return stCache[w];
    const list = [];
    for (const st of STATIONS) {
      if (st.start > w) continue;
      let last = null;
      for (let k = w; k >= st.start; k--) if (st.obs[k]) { last = st.obs[k]; break; }
      const recent = [w - 1, w].filter(k => k >= st.start).map(k => st.obs[k]).filter(Boolean);
      list.push({ s: st, last, cur: st.obs[w], overdue: !last || w - last.w >= 2, seen: recent.length > 0, active: recent.some(o => ACTIVE.has(o.st)) });
    }
    const cur = list.filter(x => x.cur), act = cur.filter(x => ACTIVE.has(x.cur.st));
    return (stCache[w] = { w, list, seenN: cur.length, actN: act.length, rate: cur.length ? act.length / cur.length : null });
  }
  function hexStation(h, w) {
    const set = new Set(nbOf(h));
    let k = 0, n = 0, a = 0;
    for (const x of stationWeek(w).list) if (set.has(x.s.hex)) { k++; if (x.seen) { n++; if (x.active) a++; } }
    return { stations: k, seen: n, active: a };
  }
  const stationTrend = () => Array.from({ length: NW }, (_, i) => { const sw = stationWeek(i + 1); return { w: i + 1, seen: sw.seenN, act: sw.actN, rate: sw.rate }; });
  function observe(id, w, st) {
    const x = STATIONS.find(o => o.id === id);
    if (!x) return null;
    x.obs[w] = { st, by: '防鼠志工（你）', w, mine: true };
    for (const k of Object.keys(stCache)) if (+k >= w) delete stCache[k];
    return x;
  }

  /* ---- 超商（概念發想）：比餐飲低一級的食物源；位置可匯入，設施沒有開放資料就模擬 ---- */
  const CVS_ON = opt.cvs !== false, CVS_MAX = 5;
  const CVSF = { seat: '內用區', hot: '熱食炸物櫃', oden: '關東煮', soft: '霜淇淋', tea: '手搖飲' };
  const CVS_W = { seat: 0.6, hot: 0.4, tea: 0.4, oden: 0.3, soft: 0.3 };
  const MRT = [[25.0461,121.5174,3],[25.0528,121.5204,2],[25.0577,121.5206,1.5],[25.0627,121.5193,1.5],[25.0713,121.5201,1],[25.0849,121.5250,1.2],[25.0936,121.5262,1.5],[25.1030,121.5225,1],[25.1098,121.5190,1],[25.1146,121.5156,1.2],[25.1207,121.5062,0.8],[25.1255,121.5011,0.8],[25.1320,121.4986,1.2],[25.1370,121.5030,0.8],[25.1375,121.4854,0.6],[25.1309,121.4733,0.5],[25.1256,121.4671,0.6],
    [25.0326,121.5703,1],[25.0331,121.5628,1.5],[25.0333,121.5527,1],[25.0331,121.5436,1.5],[25.0336,121.5354,1],[25.0339,121.5287,1.5],[25.0330,121.5180,1.5],[25.0417,121.5162,1],
    [25.0553,121.6172,1],[25.0521,121.6070,1],[25.0505,121.5933,1],[25.0450,121.5824,1],[25.0409,121.5763,1],[25.0412,121.5651,2],[25.0413,121.5578,1.5],[25.0415,121.5509,1.5],[25.0416,121.5437,2],[25.0424,121.5330,1.5],[25.0447,121.5232,1],[25.0421,121.5082,2],[25.0352,121.5000,1.5],
    [25.0500,121.5778,1.2],[25.0516,121.5640,1],[25.0517,121.5518,1.2],[25.0521,121.5441,1.5],[25.0520,121.5332,1.5],[25.0494,121.5103,1],[25.0360,121.5112,0.8],[25.0265,121.5228,1.5],[25.0207,121.5283,1.2],[25.0148,121.5343,1.5],[25.0019,121.5390,1],[24.9930,121.5410,1],
    [25.0633,121.5130,1],[25.0626,121.5265,1],[25.0597,121.5331,1.2],[24.9982,121.5795,0.6],[24.9983,121.5732,0.8],[24.9986,121.5681,0.8],[24.9993,121.5582,0.8],[25.0055,121.5571,0.6],[25.0185,121.5588,0.8],[25.0237,121.5530,1],[25.0262,121.5435,1],
    [25.0609,121.5443,1],[25.0630,121.5519,1],[25.0794,121.5469,1],[25.0848,121.5556,1],[25.0821,121.5672,1],[25.0802,121.5751,1],[25.0785,121.5848,1],[25.0836,121.5944,1.2],[25.0838,121.6023,0.8],[25.0727,121.6073,0.8],[25.0671,121.6115,1],[25.0599,121.6159,0.8]];
  const facOf = str => Object.fromEntries(Object.keys(CVSF).map(k => [k, str.split(',').includes(k)]));
  const simFac = r => { const seat = r() < 0.55; return { seat, hot: r() < 0.5, oden: r() < 0.6, soft: r() < (seat ? 0.38 : 0.22), tea: r() < (seat ? 0.26 : 0.14) }; };
  const CVS = (() => {
    const imp = POIS.filter(p => p.cvs), r = rnd(1631);
    if (imp.length) return imp.map((p, i) => { const [x, y] = Fs(p.ll[0], p.ll[1]), h = GRID.hexOf(x, y); return { id: 'C' + i, name: p.name, ll: p.ll, x, y, hex: h == null || !GRID.mask[h] ? -1 : h, f: p.fac == null ? simFac(r) : facOf(p.fac), sim: false, facSim: p.fac == null }; });
    /* 各區配額：人口規模 × 商業程度的概略權重（概念用，不是統計值）；區內再依捷運站與一般街廓分布，不參考鼠患資料 */
    const DW = { 中正區: 210, 大同區: 132, 中山區: 300, 松山區: 228, 大安區: 354, 萬華區: 192, 信義區: 246, 士林區: 238, 北投區: 208, 內湖區: 247, 南港區: 103, 文山區: 217 };
    const tot = Object.values(DW).reduce((a, b) => a + b, 0);
    const st = MRT.map(([la, lo, w]) => { const [x, y] = Fs(la, lo), h = GRID.hexOf(x, y); return { x, y, w, d: h == null ? -1 : GRID.district[h] }; });
    const gauss = () => { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
    const out = [];
    for (const [name, wt] of Object.entries(DW)) {
      const di = pc.indexOf(name);
      if (di < 0) continue;
      const quota = Math.round((1631 * wt) / tot), hexes = MASKED.filter(h => GRID.district[h] === di);
      const near = hexes.map(h => { const c = GRID.hexes[h]; let d = Infinity; for (const o of st) d = Math.min(d, Math.hypot(c.cx - o.x, c.cy - o.y)); return Math.exp(-d / 700) + 0.08; });
      const nsum = near.reduce((a, b) => a + b, 0), sts = st.filter(o => o.d === di), ssum = sts.reduce((a, o) => a + o.w, 0);
      const pickHex = () => { let u = r() * nsum; for (let q = 0; q < hexes.length; q++) if ((u -= near[q]) <= 0) return hexes[q]; return hexes[0]; };
      const pickSt = () => { let u = r() * ssum; for (const o of sts) if ((u -= o.w) <= 0) return o; return sts[0]; };
      for (let made = 0, guard = 0; made < quota && guard < quota * 40; guard++) {
        let x, y;
        if (sts.length && r() < 0.35) { const o = pickSt(); x = o.x + gauss() * 550; y = o.y + gauss() * 550; }
        else { const c = GRID.hexes[pickHex()]; x = c.cx + (r() - 0.5) * 350; y = c.cy + (r() - 0.5) * 350; }
        const h = GRID.hexOf(x, y);
        if (h == null || !GRID.mask[h] || GRID.district[h] !== di) continue;
        made++;
        out.push({ id: 'C' + out.length, name: `超商 #${String(out.length + 1).padStart(4, '0')}`, ll: Is(x, y), x, y, hex: h, f: simFac(r), sim: true, facSim: true });
      }
    }
    return out;
  })();
  const cvsPts = o => 2 + (o.f.seat ? 1 : 0) + (o.f.hot ? 1 : 0) + (o.f.oden || o.f.soft || o.f.tea ? 1 : 0);
  const facTxt = f => { const on = Object.keys(CVSF).filter(k => f[k]).map(k => CVSF[k]); return on.length ? on.join('、') : '無內用、無熱食'; };
  const cvsRaw = new Float32Array(GRID.H), CVS_BY_HEX = new Map();
  for (const o of CVS) {
    o.w = 1 + Object.keys(CVS_W).reduce((t, k) => t + (o.f[k] ? CVS_W[k] : 0), 0);
    if (o.hex < 0) continue;
    if (!CVS_BY_HEX.has(o.hex)) CVS_BY_HEX.set(o.hex, []);
    CVS_BY_HEX.get(o.hex).push(o);
    for (const b of nbOf(o.hex)) { const c = GRID.hexes[b]; cvsRaw[b] += o.w * Math.exp(-((c.cx - o.x) ** 2 + (c.cy - o.y) ** 2) / (2 * 150 * 150)); }
  }
  const q95 = (() => { const v = MASKED.map(i => cvsRaw[i]).sort((a, b) => a - b); return v[Math.floor(v.length * 0.95)] || 1; })();
  const cvsNorm = Float32Array.from(cvsRaw, v => Math.min(1, v / q95));

  /* ---- 嚴重度指數：每個危險因子列出原因、事件屬性與分數加成，加總上限 100 ---- */
  const SEV = {
    base: { name: '鼠患通報', rule: '+5', reason: '確認是老鼠相關的通報，列入檢傷。' },
    risk: { name: '區塊風險', rule: '全市百分位 × 0.2，最多 +20', reason: '食物源、近 8 週通報、下水道與低窪程度加權後的全市百分位（北市鼠情週報的風險模型）。' },
    source: { name: '高風險源頭', rule: '+5', reason: '全市前 10% 的源頭格子；源頭清理比事後投藥更能壓低鼠群上限。' },
    gi: { name: '顯著群聚', rule: 'Gi* 95% +8；99% +12', reason: '近 4 週通報顯著集中（Getis-Ord Gi*），不是零星通報。' },
    cluster: { name: '周邊通報占比', rule: '周邊 14 天占全市 5% +5；12% 且至少 6 筆 +10', reason: '周邊 14 天的通報占全市比例高，群聚可能正在擴大；看比例不看筆數，可以抵銷新聞造成的全市暴增。' },
    trend: { name: '熱點趨勢', rule: '新興 +6；持續 +4', reason: { new: '最近 4 週第一次成為熱點，及早處理可以避免擴散。', persist: '六成以上週次都是熱點，既有措施需要檢討。' } },
    sewer: { name: '下水道', rule: '+12', reason: '下水道是老鼠的棲所與移動通道，人孔與溝蓋縫隙要由工務單位封堵。' },
    food: { name: '餐飲市場', rule: '+10', reason: '餐飲、市場與夜市周邊涉及食品衛生，老鼠也最容易在這裡取得食物。' },
    many: { name: '數量多', rule: '+10', reason: '一次看到多隻，代表附近可能已有穩定族群。' },
    trash: { name: '垃圾廚餘', rule: '+6', reason: '垃圾與廚餘是都市老鼠的主要食物來源。' },
    indoor: { name: '入侵室內', rule: '+6', reason: '進入住家或店內，接觸、咬傷與污染食物的風險較高。' },
    signs: { name: '活躍鼠跡', rule: '每項 +3，最多 +9', reason: '鼠糞、死鼠、咬痕、鼠洞代表有鼠群棲息；鼠糞乾掃可能吸入漢他病毒，要用稀釋漂白水處理。' },
    harbor: { name: '可能棲所', rule: '+3', reason: '防火巷、公園綠地、工地空屋常是鼠群築巢的地方。' },
    stop: { name: '垃圾停收', rule: '超過 2 天，每多 1 天 +3', reason: '停收讓垃圾暫存時間變長，老鼠更容易被看見，食物來源也增加。' },
    rain: { name: '豪雨', rule: '本週或上週 150 毫米以上 +6', reason: '豪雨會把下水道的老鼠逼到地面；1 到 2 週內要留意鉤端螺旋體。' },
    breeding: { name: '繁殖季', rule: '第 8–10、34–36 週 +4', reason: '春秋兩季是繁殖高峰，高峰前處理效果最好。' },
    snake: { name: '蛇鼠佐證', rule: '蛇鼠共現 +4；投藥區有蛇 +3', reason: { cross: '附近也有蛇類目擊，兩個獨立的觀測管道互相佐證鼠密度偏高。', poison: '投藥區附近有蛇，要留意二次中毒，改用防鼠或誘捕。' } },
    wild: { name: '疑似二次中毒', rule: '描述提到死鳥、死蛇 +6', reason: '猛禽與蛇吃了中毒的老鼠會二次中毒；台灣死亡猛禽六成以上驗出鼠藥。看到時要送驗，並檢討附近投藥。' },
    station: { name: '餌站鼠跡', rule: '周邊餌站近 2 週有一半以上出現鼠跡 +5', reason: '固定餌站與捕鼠籠是和通報互相獨立的主動監測；餌被吃、籠內有鼠，代表這一帶確實有鼠群活動，不只是被看見。' },
    cvs: { name: '鄰近超商', rule: '80 公尺內有超商 +2；內用區 +1、熱食炸物櫃 +1、關東煮／霜淇淋／手搖任一 +1，最多 +5', reason: '超商是比餐飲低一級的食物源；內用區留下吃剩的食物，熱食、炸物與關東煮產生油脂和湯汁廚餘，霜淇淋與手搖飲留下含糖杯子。超商本身沒有直接研究，屬原型假設。' }
  };
  const BANDS = [{ k: 4, min: 70, name: '危急' }, { k: 3, min: 55, name: '嚴重' }, { k: 2, min: 35, name: '中等' }, { k: 1, min: 0, name: '輕微' }];
  const KW = {
    sewer: /水溝|下水道|排水|溝蓋|溝|人孔|管線|管道/, food: /超商|超市|小七|7-?11|萊爾富|便利商店|餐廳|小吃|店|攤|美食街|餐飲|飲料|麵|飯|火鍋|夜市|市場|菜市/i,
    many: /很多|一群|成群|群聚|大量|好幾|多隻|整群|到處|一堆|超多|開會|\d+\s*隻/, trash: /垃圾|廚餘|回收|子母車/,
    indoor: /屋內|家裡|家中|室內|天花板|廚房|冷氣孔|陽台|樓梯間|房間|夾層/, harbor: /巷|騎樓|停車場|公園|綠地|草地|花圃|樹|河濱|工地|空屋|空地|施工|廢棄/
  };
  const SIGN_KW = [['鼠糞', /糞|屎|大便/], ['死鼠', /死老鼠|死鼠|屍/], ['咬痕', /咬|啃/], ['鼠洞', /洞/]];
  const STOP_WHY = { weekly: '週三、週日', lunarNewYear: '春節', typhoon: '颱風' };
  const bandOf = sc => BANDS.find(b => sc >= b.min);
  function severity(j, x, meta) {
    if (!j || j.rel !== 'rat') return { na: true, score: 0, band: null, factors: [] };
    const F = [], text = meta.text || '', tg = meta.tags || [], w = meta.w;
    const kw = re => { const m = text.match(re); return m ? m[0] : null; };
    const add = (key, attr, pts, sub) => { const r = SEV[key].reason; F.push({ key, name: SEV[key].name, reason: typeof r === 'string' ? r : r[sub], attr, pts }); };
    const said = (re, tagLabel) => (text && kw(re) ? `描述提到「${kw(re)}」` : `線索標籤：${tagLabel}`);
    if (j.sewer || tg.includes('sewer')) add('sewer', said(KW.sewer, '水溝下水道'), 12);
    if (j.food || tg.includes('foodbiz')) add('food', said(KW.food, '餐飲攤商'), 10);
    if (j.many) add('many', `描述提到「${kw(KW.many) || '數量多'}」`, 10);
    if (j.trash || tg.includes('garbage')) add('trash', said(KW.trash, '垃圾廚餘'), 6);
    if ((j.signs || []).includes('入侵室內') || tg.includes('indoor')) add('indoor', said(KW.indoor, '室內'), 6);
    const signs = text ? SIGN_KW.filter(([, re]) => re.test(text)).map(([n]) => n) : [];
    if (j.wild) add('wild', `描述提到「${kw(/(死|倒在|奄奄|流血|不動|抽搐).{0,8}(老鷹|鷹|貓頭鷹|鴞|鳶|猛禽|鳥|蛇)|(老鷹|鷹|貓頭鷹|鴞|鳶|猛禽|鳥|蛇).{0,8}(死|倒在|奄奄|流血|不動|抽搐)/) || '死鳥或死蛇'}」`, 6);
    if (signs.length) add('signs', `描述提到：${signs.join('、')}`, Math.min(9, signs.length * 3));
    const hb = tg.filter(t => t === 'alley' || t === 'green' || t === 'construction');
    if ((text && kw(KW.harbor)) || hb.length) add('harbor', text && kw(KW.harbor) ? `描述提到「${kw(KW.harbor)}」` : `線索標籤：${hb.map(t => TAG_ZH[t]).join('、')}`, 3);
    if (x) {
      add('risk', `全市百分位 ${x.base}`, Math.round(x.base * 0.2));
      if (x.src) add('source', '本格屬全市前 10%', 5);
      if (x.hot) add('gi', `z = ${x.z.toFixed(2)}（${x.z >= 2.58 ? '99%' : '95%'} 顯著）`, x.z >= 2.58 ? 12 : 8);
      const cs = `周邊 14 天 ${x.cl.n} 筆、占全市 ${Math.round(x.cl.share * 100)}%`;
      if (x.cl.n >= T.n && x.cl.share >= T.share) add('cluster', cs, 10);
      else if (x.cl.n >= 3 && x.cl.share >= 0.05) add('cluster', cs, 5);
      if (x.trend === 'new' || x.trend === 'persist') add('trend', x.trend === 'new' ? '新興熱點' : '持續熱點', x.trend === 'new' ? 6 : 4, x.trend);
      if (x.snake === 'cross' || x.snake === 'poison') add('snake', `近 8 週有蛇類目擊，${x.snake === 'cross' ? '附近也是鼠類熱點' : '位在投藥區'}`, x.snake === 'cross' ? 4 : 3, x.snake);
      if (w) { const hs = hexStation(x.h, w); if (hs.seen && hs.active / hs.seen >= 0.5) add('station', `周邊 ${hs.stations} 個站，近 2 週有觀察的 ${hs.seen} 個中 ${hs.active} 個出現鼠跡`, 5); }
    }
    if (CVS_ON && CVS.length && meta.ll) {
      const [x0, y0] = Fs(meta.ll[0], meta.ll[1]), h0 = x ? x.h : GRID.hexOf(x0, y0);
      let best = null;
      if (h0 != null && h0 >= 0) for (const b of nbOf(h0)) for (const o of CVS_BY_HEX.get(b) || []) { const d = Math.hypot(o.x - x0, o.y - y0), p = cvsPts(o); if (d <= 80 && (!best || p > best.p || (p === best.p && d < best.d))) best = { o, d, p }; }
      if (best) add('cvs', `${Math.max(10, Math.round(best.d / 10) * 10)} 公尺內有超商（${facTxt(best.o.f)}）${best.o.facSim ? '・設施模擬' : ''}`, best.p);
    }
    if (w) {
      const q = qs[w];
      if (q.stopDays > 2) add('stop', `第 ${w} 週停收 ${q.stopDays} 天（${q.reasons.map(k => STOP_WHY[k] || k).join('、')}）`, 3 * (q.stopDays - 2));
      const r0 = ec[w].rain, r1 = w > 1 ? ec[w - 1].rain : 0;
      if (r0 >= 150 || r1 >= 150) add('rain', r0 >= 150 ? `第 ${w} 週雨量 ${r0} 毫米` : `上週雨量 ${r1} 毫米`, 6);
      if ((w >= 8 && w <= 10) || (w >= 34 && w <= 36)) add('breeding', `第 ${w} 週，${w <= 20 ? '春季' : '秋季'}繁殖高峰前`, 4);
    }
    F.sort((a, b) => b.pts - a.pts);
    add('base', meta.src === 'form' ? '市民通報' : meta.src === 'radar' ? '見鼠地圖通報' : '1999 陳情（沒有描述）', 5);
    const raw = F.reduce((t, f) => t + f.pts, 0), score = Math.min(100, raw);
    return { score, raw, band: bandOf(score), factors: F };
  }

  function areaWhy(a) {
    const x = a.x, t = a.tagN, out = [`區塊風險 ${x.s}${x.src ? '（高風險源頭）' : ''}`];
    if (a.lv === 1) out.push(...a.top.t.why.slice(1));
    else if (a.lv === 2) out.push(`${t.sewer || 1} 筆提到水溝或下水道`);
    else if (a.lv === 3) out.push(`${t.foodbiz || 1} 筆在餐飲攤商周邊`);
    else if (a.lv === 4) out.push(t.garbage ? `${t.garbage} 筆和垃圾或廚餘有關` : '單次目擊但位於源頭區塊，安排周邊巡查');
    else out.push(a.reps.length > 1 ? `${a.reps.length} 筆單次目擊，沒有升級條件` : a.n1999 ? '1999 陳情沒有描述，列為單次目擊' : '單次目擊');
    return out;
  }

  /* ---- 每週：風險、群聚、逐筆分級、區塊彙整 ---- */
  const cache = {};
  function week(w) {
    if (cache[w]) return cache[w];
    const r8 = new Float32Array(GRID.H);
    for (const s of ['r1999', 'radar'])
      for (let k = Math.max(1, w - 7); k <= w; k++) {
        const a = CNT.bySrc[s][k];
        for (let i = 0; i < GRID.H; i++) if (a[i]) r8[i] += a[i];
      }
    const risk = Nl(GRID, FEAT, r8, w, kl(350, Uc.lit.dispersal8w));
    /* 超商只加不減：在區塊風險百分位上加 0–5 點，不改變源頭分類，也不會讓其他區塊下降 */
    const bump = new Uint8Array(GRID.H);
    if (CVS_ON && CVS.length) {
      for (const i of MASKED) bump[i] = Math.round(CVS_MAX * cvsNorm[i]);
      risk.parts.cvs = cvsNorm;
      risk.bump = bump;
      risk.available.cvs = true;
    }
    const ord = MASKED.slice().sort((a, b) => risk.spread[a] - risk.spread[b]);
    const pct = new Float32Array(GRID.H);
    ord.forEach((i, k) => (pct[i] = k / (ord.length - 1)));
    const tf = risk.timeFactor;
    const liveBase = i => Math.min(99, Math.round(pct[i] * 99 * tf));
    const live = i => Math.min(99, liveBase(i) + bump[i]);

    const win = new Uint16Array(GRID.H);
    let all = 0;
    for (let k = Math.max(1, w - 1); k <= w; k++) for (const r of REPORTS[k]) { win[r.hex]++; all++; }
    const snakeRec = al(SNK, GRID.H, w);
    const ctx = h => {
      if (h == null || h < 0) return null;
      let n = win[h];
      for (let e = 0; e < 6; e++) {
        const b = GRID.nb[h * 6 + e];
        if (b >= 0 && GRID.mask[b]) n += win[b];
      }
      return { h, w, s: liveBase(h), cvsBump: bump[h], base: Math.min(99, Math.round(pct[h] * 99) + bump[h]), src: risk.cls[h] === 'source', hot: !!AN.hot[w][h], z: AN.z[w][h], hot99: !!AN.hot[w][h] && AN.z[w][h] >= 2.58,
        trend: nl(AN, h, w), snake: snakeRec[h] ? il(AN, GRID, h, w, BAIT) : null, cl: { n, share: n / Math.max(1, all) } };
    };

    const areas = new Map();
    const reps = REPORTS[w].map(r => {
      const j = judgeTags(r), x = ctx(r.hex), t = triage(j, x);
      const o = Object.assign({}, r, { j, t, lv: t.lv, sev: severity(j, x, { text: r.desc, src: r.src, tags: j.tags, w, ll: r.ll }) });
      let a = areas.get(r.hex);
      if (!a) areas.set(r.hex, (a = { h: r.hex, reps: [], lv: 9, x, tagN: {}, n1999: 0, nRadar: 0 }));
      a.reps.push(o);
      if (o.src === 'r1999') a.n1999++; else a.nRadar++;
      j.tags.forEach(k => (a.tagN[k] = (a.tagN[k] || 0) + 1));
      if (o.lv < a.lv) { a.lv = o.lv; a.top = o; }
      if (!a.sevTop || o.sev.score > a.sevTop.sev.score) { a.sevTop = o; a.sev = o.sev; }
      return o;
    });
    const list = [...areas.values()].sort((a, b) => a.lv - b.lv || b.sev.score - a.sev.score || b.x.s - a.x.s || b.reps.length - a.reps.length);
    const clue = wl(GRID, RBW, w);
    for (const a of list) {
      a.why = areaWhy(a);
      const tg = Tl(GRID, clue, a.h);
      a.clue = tg.length ? tg[0].key : null;
    }
    const summary = sl(AN, GRID, SNK, w, BAIT);
    const advice = cl(w, 'none', summary);
    const lvN = [0, 0, 0, 0, 0, 0], repN = [0, 0, 0, 0, 0, 0];
    list.forEach(a => lvN[a.lv]++);
    reps.forEach(r => repN[r.lv]++);
    return (cache[w] = { w, risk, ord, pct, tf, live, ctx, reps, list, areas, clue, summary, advice, lvN, repN, all });
  }

  /* 全期（第 1–41 週）逐筆分級，給「總覽」的分級分布 */
  let ALL = null;
  function all() {
    if (!ALL) { ALL = []; for (let w = 1; w <= NW; w++) for (const r of week(w).reps) ALL.push(r); }
    return ALL;
  }
  return { all, severity, SEV, BANDS, ST, ACTIVE, ALERT, STATIONS, baitPtsAll: real ? real.baitPoints : [], CVSF, CVS_ON, CVS_MAX, cvsNorm, cvsPts, facTxt, CVS_BY_HEX, stationWeek, hexStation, stationTrend, observe, CVS, real: !!real, realReports, W1999, POIS, baitPts: realReports ? real.baitPoints : [], sources: real ? real.sourcesLoaded : [], bundle: bundle || null,
    GRID, SIM, RBW, SNK, CNT, AN, BAIT, NW, MASKED, REPORTS, TOTALS, LV, T, TAGS, TAG_ZH, judge, judgeTags, triage, week, hexAt, hexOfLL, hexLL, placeOf, districtOf };
}
