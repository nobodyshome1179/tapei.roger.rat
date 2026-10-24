/* ============================================================
   開放資料匯入：在瀏覽器裡把 CSV 轉成北市鼠情週報的資料包格式（version 1），
   和 scripts/prepare-data.mjs 的輸出相同，交給週報的 hl() 計算。
   檔案只在這台裝置上處理，不會上傳。
   ============================================================ */
export function makeDataKit(OD) {
  const { Ws, pc } = OD;
  const BOX = { lat0: 24.955, lat1: 25.215, lon0: 121.452, lon1: 121.67 };
  const inBox = (lat, lon) => lat >= BOX.lat0 && lat <= BOX.lat1 && lon >= BOX.lon0 && lon <= BOX.lon1;
  const KIND_ZH = {
    radar: '見鼠地圖通報', 1999: '1999 陳情類別', manholes: '雨水下水道人孔', sewer: '污水下水道管線',
    food: '食品業者登錄數', pois: '食物點與棲所', bundle: '資料包（prepare-data.mjs）'
  };

  /* 線索標籤：和週報相同的 7 類，關鍵字與鼠患檢傷站的 AI 判讀一致 */
  const TAG_RE = [
    /水溝|下水道|排水|溝蓋|溝|人孔|管線|管道/,
    /巷|騎樓|停車場/,
    /屋內|家裡|家中|室內|天花板|廚房|冷氣孔|陽台|樓梯間|房間|夾層|地下室/,
    /垃圾|廚餘|回收|子母車/,
    /超商|超市|小七|7-?11|萊爾富|便利商店|餐廳|小吃|店|攤|美食街|餐飲|飲料|麵|飯|火鍋|夜市|市場|菜市/i,
    /公園|綠地|草地|花圃|樹|河濱/,
    /工地|空屋|空地|施工|廢棄/
  ];
  const tagsOf = t => TAG_RE.reduce((m, re, i) => (re.test(t || '') ? m | (1 << i) : m), 0);

  function decode(buf) {
    const u8 = new Uint8Array(buf);
    let t = new TextDecoder('utf-8').decode(u8);
    if (t.slice(0, 4000).includes('\uFFFD')) {
      try { t = new TextDecoder('big5').decode(u8); } catch (e) { /* 保留 UTF-8 結果 */ }
    }
    return t.replace(/^\uFEFF/, '');
  }

  function parseCSV(text) {
    const first = text.slice(0, text.search(/\r?\n/) >>> 0);
    const delim = [',', '\t', ';'].reduce((b, d) => (first.split(d).length > first.split(b).length ? d : b), ',');
    const rows = [];
    let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === delim) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    const good = rows.filter(r => r.some(c => c.trim() !== ''));
    const fields = (good[0] || []).map(f => f.replace(/^\uFEFF/, '').trim());
    return { fields, rows: good.slice(1).map(r => { const o = {}; fields.forEach((f, k) => (o[f] = (r[k] ?? '').trim())); return o; }) };
  }

  const norm = s => String(s).toLowerCase().replace(/[\s_（）()]/g, '');
  const col = (fields, ...res) => { for (const re of res) { const f = fields.find(x => re.test(norm(x))); if (f) return f; } return null; };
  const num = s => { const v = parseFloat(String(s ?? '').replace(/,/g, '')); return Number.isFinite(v) ? v : NaN; };

  /* 日期：20260105T101500、2026-06-14 21:30、2026/6/14、民國 115/06/14 都可以；取臺灣當地日期 */
  function parseDate(s) {
    s = String(s ?? '').trim();
    if (!s) return null;
    let m = s.match(/^(\d{4})(\d{2})(\d{2})(?:T|\s|$)/) || s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
    if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
    m = s.match(/^(\d{2,3})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
    if (m) return Date.UTC(+m[1] + 1911, +m[2] - 1, +m[3]);
    const t = Date.parse(s);
    return Number.isNaN(t) ? null : t;
  }
  const yearOf = s => {
    s = String(s ?? '').trim();
    if (/^\d{8}$/.test(s)) return +s.slice(0, 4);
    if (/^\d{6,7}$/.test(s)) return +s.slice(0, s.length - 4) + 1911;
    const m = s.match(/^(\d{4})/);
    return m ? +m[1] : null;
  };

  /* TWD97 二度分帶（中央經線 121°E）轉經緯度 */
  function twd97(x, y) {
    const a = 6378137, f = 1 / 298.257222101, b = a * (1 - f), e2 = 1 - (b * b) / (a * a);
    const k0 = 0.9999, lon0 = (121 * Math.PI) / 180;
    x -= 250000;
    const mu = y / k0 / (a * (1 - e2 / 4 - (3 * e2 * e2) / 64 - (5 * e2 ** 3) / 256));
    const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
    const fp = mu + ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) + ((21 * e1 * e1) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
      ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) + ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);
    const ep2 = e2 / (1 - e2), sf = Math.sin(fp), cf = Math.cos(fp), tf = Math.tan(fp);
    const C1 = ep2 * cf * cf, T1 = tf * tf, N1 = a / Math.sqrt(1 - e2 * sf * sf), R1 = (a * (1 - e2)) / Math.pow(1 - e2 * sf * sf, 1.5);
    const D = x / (N1 * k0);
    const lat = fp - ((N1 * tf) / R1) * ((D * D) / 2 - ((5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D ** 4) / 24 +
      ((61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D ** 6) / 720);
    const lon = lon0 + (D - ((1 + 2 * T1 + C1) * D ** 3) / 6 + ((5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D ** 5) / 120) / cf;
    return [(lat * 180) / Math.PI, (lon * 180) / Math.PI];
  }
  const latLonOf = (r, fields) => {
    const la = col(fields, /^(lat|latitude|緯度|wgs84緯度)/), lo = col(fields, /^(lng|lon|long|longitude|經度|wgs84經度)/);
    if (la && lo) return [num(r[la]), num(r[lo])];
    const xc = col(fields, /^(x坐標|x座標|twd97x|座標x|坐標x|x)$/), yc = col(fields, /^(y坐標|y座標|twd97y|座標y|坐標y|y)$/);
    if (xc && yc) { const x = num(r[xc]), y = num(r[yc]); if (Number.isFinite(x) && Number.isFinite(y) && x > 1e5 && y > 2e6) return twd97(x, y); }
    return [NaN, NaN];
  };

  function detect(fields) {
    const has = re => fields.some(f => re.test(norm(f)));
    if (has(/案件次類別|案件主類別/) && has(/受理日期|日期/)) return '1999';
    if (has(/管線編號/) && has(/竣工/)) return 'sewer';
    if (has(/人孔編號/) && (has(/^(x坐標|x座標|twd97x)$/) || has(/地盤標高|地盤高程/))) return 'manholes';
    if (has(/食品業者登錄數|登錄數/) && has(/行政區/)) return 'food';
    const ll = has(/^(lat|latitude|緯度)/) && has(/^(lng|lon|long|longitude|經度)/);
    if (ll && has(/(created|date|time|日期|時間)/)) return 'radar';
    if (ll && has(/^(名稱|name|分公司名稱|店名)/)) return 'pois';
    if (has(/分公司名稱/) && has(/分公司地址/)) return 'cvsRaw';
    return null;
  }

  const CONV = {
    radar(rows, fields) {
      const dt = col(fields, /^(createdat|created|通報時間|通報日期)/, /(date|time|日期|時間)/);
      const ds = col(fields, /(description|desc|內容|描述|說明|備註)/), ty = col(fields, /^(type|類型|類別|通報類型)$/), st = col(fields, /(status|狀態)/);
      const s = { total: rows.length, kept: 0, bait: 0, outDate: 0, outLoc: 0, bad: 0, rejected: 0, statuses: {}, withText: 0 };
      const points = [];
      for (const r of rows) {
        const status = st ? r[st] : '';
        if (status) s.statuses[status] = (s.statuses[status] || 0) + 1;
        if (/退回|駁回|刪除|無效|不實|重複/.test(status)) { s.rejected++; continue; }
        const [lat, lon] = latLonOf(r, fields), d = parseDate(r[dt]);
        if (!Number.isFinite(lat) || !Number.isFinite(lon) || d == null) { s.bad++; continue; }
        if (!inBox(lat, lon)) { s.outLoc++; continue; }
        const w = Ws(d);
        if (w == null) { s.outDate++; continue; }
        const desc = ds ? r[ds] : '', bait = ty && /毒餌|餌站|投藥/.test(r[ty]) ? 1 : 0;
        if (bait) s.bait++;
        if (desc) s.withText++;
        points.push([+lat.toFixed(6), +lon.toFixed(6), w, bait, bait ? 0 : tagsOf(desc), desc]);
        s.kept++;
      }
      return { part: { radar: { points } }, stats: s };
    },
    1999(rows, fields) {
      const cats = [col(fields, /案件主類別/), col(fields, /案件次類別/)].filter(Boolean), dt = col(fields, /受理日期/, /日期/);
      const weekly = new Array(42).fill(0), s = { total: rows.length, rat: 0, kept: 0, outDate: 0, bad: 0 };
      for (const r of rows) {
        const c = cats.map(k => r[k]).join(' ');
        if (!/鼠/.test(c) || (/錢鼠|鼩鼱/.test(c) && !/老鼠|鼠類/.test(c))) continue;
        s.rat++;
        const d = parseDate(r[dt]);
        if (d == null) { s.bad++; continue; }
        const w = Ws(d);
        if (w == null) { s.outDate++; continue; }
        weekly[w]++;
        s.kept++;
      }
      return { part: { r1999: { weekly } }, stats: s };
    },
    manholes(rows, fields) {
      const el = col(fields, /地盤標高|地盤高程|地面高程/), sh = col(fields, /圖幅/);
      const points = [], sheets = {}, s = { total: rows.length, kept: 0, outLoc: 0, bad: 0, sheets: 0 };
      for (const r of rows) {
        const [lat, lon] = latLonOf(r, fields);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) { s.bad++; continue; }
        if (!inBox(lat, lon)) { s.outLoc++; continue; }
        const e = el ? num(r[el]) : NaN;
        points.push([+lat.toFixed(6), +lon.toFixed(6), Number.isFinite(e) ? e : null]);
        if (sh && r[sh]) { const k = String(r[sh]).slice(0, 4), g = sheets[k] || (sheets[k] = [0, 0, 0]); g[0] += lat; g[1] += lon; g[2]++; }
        s.kept++;
      }
      s.sheets = Object.keys(sheets).length;
      return { part: { manholes: { points } }, sheetXY: sheets, stats: s };
    },
    sewer(rows, fields) {
      const up = col(fields, /上游人孔編號/), id = col(fields, /管線編號/), len = col(fields, /管線長度/), dt = col(fields, /竣工/);
      const sheets = {}, s = { total: rows.length, kept: 0, bad: 0, dated: 0, sheets: 0 };
      for (const r of rows) {
        const m = String((up && r[up]) || (id && r[id]) || '').match(/^(\d{4})/);
        if (!m) { s.bad++; continue; }
        const g = sheets[m[1]] || (sheets[m[1]] = { n: 0, len: 0, known: 0, old: 0 });
        const L = num(r[len]), wgt = Number.isFinite(L) && L > 0 ? L : 1, y = yearOf(r[dt]);
        g.n++;
        g.len += Number.isFinite(L) ? L : 0;
        if (y && y > 1900 && y < 2100) { g.known += wgt; if (y < 1990) g.old += wgt; s.dated++; }
        s.kept++;
      }
      s.sheets = Object.keys(sheets).length;
      return { sewerSheets: sheets, stats: s };
    },
    food(rows, fields) {
      const dc = col(fields, /^行政區/, /行政區/), nc = col(fields, /食品業者登錄數/, /登錄數|家數|數量/);
      const byDistrict = {}, s = { total: rows.length, kept: 0, skipped: 0, sum: 0 };
      for (const r of rows) {
        let d = String(r[dc] || '').replace(/^(臺北市|台北市)/, '').replace(/^台/, '臺').trim();
        if (d && !d.endsWith('區')) d += '區';
        const n = num(r[nc]);
        if (!pc.includes(d) || !Number.isFinite(n)) { s.skipped++; continue; }
        byDistrict[d] = (byDistrict[d] || 0) + n;
        s.kept++;
        s.sum += n;
      }
      return { part: { food: { byDistrict } }, stats: s };
    },
    pois(rows, fields) {
      const nm = col(fields, /^(名稱|name|分公司名稱|店名)/), ty = col(fields, /^(類別|類型|type|kind)/);
      const pois = [], s = { total: rows.length, kept: 0, food: 0, harbor: 0, cvs: 0, outLoc: 0, bad: 0 };
      const FC = { seat: col(fields, /內用|座位/), hot: col(fields, /熱食|炸物/), oden: col(fields, /關東煮/), soft: col(fields, /霜淇淋|冰淇淋/), tea: col(fields, /手搖|茶飲|現調/) };
      const hasFac = Object.values(FC).some(c => c != null), yes = v => /^(1|y|yes|是|有|true|v|✓|○)$/i.test(String(v == null ? '' : v).trim());
      for (const r of rows) {
        const [lat, lon] = latLonOf(r, fields);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) { s.bad++; continue; }
        if (!inBox(lat, lon)) { s.outLoc++; continue; }
        const cat = ty ? r[ty] : '', name = r[nm] || '未命名地點';
        const cvs = /便利商店|超商|超市/.test(cat) || /統一超商|7-?ELEVEN|7-?11|全家便利|萊爾富|OK超商|來來超商|全聯/i.test(name);
        const kind = !cvs && /公園|河濱|綠地|山|堤|工地|空屋|空地|棲/.test(cat) ? 1 : 0;
        pois.push([name, +lat.toFixed(6), +lon.toFixed(6), kind, cvs ? 'cvs' : '', cvs && hasFac ? Object.keys(FC).filter(k => FC[k] != null && yes(r[FC[k]])).join(',') : null]);
        s.kept++;
        cvs ? s.cvs++ : kind ? s.harbor++ : s.food++;
      }
      return { part: { pois }, stats: s };
    }
  };

  async function readFile(file) {
    const name = file.name || '未命名檔案';
    let text;
    try { text = decode(await file.arrayBuffer()); } catch (e) { return { name, kind: null, error: '無法讀取這個檔案。' }; }
    if (/\.json$/i.test(name) || /^\s*\{/.test(text)) {
      let j;
      try { j = JSON.parse(text); } catch (e) { return { name, kind: null, error: '檔案不是 JSON。' }; }
      if (!j || j.version !== 1) return { name, kind: null, error: '不是有效的資料包，需要 scripts/prepare-data.mjs 產生的 taipei-rat-data.json。' };
      return { name, kind: 'bundle', part: j, stats: { generated: j.generated || '', parts: ['radar', 'r1999', 'manholes', 'food', 'sewer', 'pois', 'population'].filter(k => j[k]) } };
    }
    const { fields, rows } = parseCSV(text);
    const kind = detect(fields);
    if (kind === 'cvsRaw') return { name, kind: null, error: '這是「全國5大超商資料集」，只有地址沒有座標。請先用門牌定位（例如 TGOS）轉成經緯度，加上「緯度」「經度」欄位後再匯入，超商會成為食物點。', fields };
    if (!kind) return { name, kind: null, error: '認不出是哪一種資料。請確認第一列是欄位名稱。', fields };
    const res = CONV[kind](rows, fields);
    res.name = name;
    res.kind = kind;
    res.sample = /範例|sample|example/i.test(name) || rows.slice(0, 60).some(r => Object.values(r).some(v => /示意/.test(v)));
    return res;
  }

  /* 合併成資料包：CSV 覆蓋資料包裡的同類資料；污水管線要靠雨水人孔的圖幅定位 */
  function build(results) {
    const ok = results.filter(r => r.kind);
    if (!ok.length) return null;
    const b = { version: 1, generated: new Date().toISOString().slice(0, 10), sources: [] };
    for (const r of ok.filter(r => r.kind === 'bundle')) Object.assign(b, r.part);
    const csv = ok.filter(r => r.kind !== 'bundle');
    const radar = csv.filter(r => r.kind === 'radar'), r1999 = csv.filter(r => r.kind === '1999'), mh = csv.filter(r => r.kind === 'manholes');
    if (radar.length) b.radar = { points: radar.flatMap(r => r.part.radar.points) };
    if (r1999.length) b.r1999 = { weekly: r1999.reduce((acc, r) => acc.map((v, i) => v + r.part.r1999.weekly[i]), new Array(42).fill(0)) };
    if (mh.length) b.manholes = { points: mh.flatMap(r => r.part.manholes.points) };
    const food = csv.filter(r => r.kind === 'food');
    if (food.length) {
      const by = {};
      food.forEach(r => Object.entries(r.part.food.byDistrict).forEach(([k, v]) => (by[k] = (by[k] || 0) + v)));
      b.food = { byDistrict: by };
    }
    const pois = csv.filter(r => r.kind === 'pois');
    if (pois.length) b.pois = pois.flatMap(r => r.part.pois);
    const sewer = csv.filter(r => r.kind === 'sewer');
    if (sewer.length) {
      const xy = {};
      mh.forEach(r => Object.entries(r.sheetXY).forEach(([k, g]) => { const t = xy[k] || (xy[k] = [0, 0, 0]); t[0] += g[0]; t[1] += g[1]; t[2] += g[2]; }));
      const sheets = [];
      let unmatched = 0;
      sewer.forEach(r => Object.entries(r.sewerSheets).forEach(([k, g]) => {
        const c = xy[k];
        if (!c || !c[2]) { unmatched++; return; }
        sheets.push([+(c[0] / c[2]).toFixed(6), +(c[1] / c[2]).toFixed(6), k, g.n, +g.len.toFixed(1), g.known ? +(g.old / g.known).toFixed(3) : null]);
      }));
      b.sewer = { sheets };
      sewer.forEach(r => { r.stats.matched = sheets.length; r.stats.unmatched = unmatched; r.stats.noManholes = !mh.length; });
    }
    b.sources = ['radar', 'r1999', 'manholes', 'food', 'sewer', 'pois', 'population'].filter(k => b[k]);
    return b;
  }

  function summary(r) {
    const s = r.stats || {};
    switch (r.kind) {
      case 'radar': {
        const st = Object.entries(s.statuses || {}).map(([k, v]) => `${k} ${v}`).join('、');
        return `讀到 ${s.total} 筆，地圖上 ${s.kept} 筆（其中毒餌 ${s.bait} 筆，有文字描述 ${s.withText} 筆）。日期超出第 1–41 週 ${s.outDate} 筆、位置超出臺北 ${s.outLoc} 筆、無法解析 ${s.bad} 筆${s.rejected ? `、退件 ${s.rejected} 筆` : ''}。${st ? `狀態：${st}。` : ''}`;
      }
      case '1999': return `讀到 ${s.total} 筆，鼠類相關 ${s.rat} 筆，落在第 1–41 週的 ${s.kept} 筆列入每週總量。開放資料沒有位置，不列入地圖與分級。`;
      case 'manholes': return `讀到 ${s.total} 座，臺北範圍內 ${s.kept} 座（TWD97 已轉經緯度），涵蓋 ${s.sheets} 個圖幅。用在下水道密度與低窪程度。`;
      case 'sewer': return s.noManholes
        ? `讀到 ${s.total} 段管線，分屬 ${s.sheets} 個圖幅。污水管線沒有座標，要一起載入雨水人孔才能定位。`
        : `讀到 ${s.total} 段管線，分屬 ${s.sheets} 個圖幅，能對應到雨水人孔圖幅的 ${s.matched ?? 0} 個放上地圖${s.unmatched ? `，${s.unmatched} 個對不到` : ''}。`;
      case 'food': return `讀到 ${s.kept} 個行政區，共 ${Math.round(s.sum).toLocaleString('zh-TW')} 家${s.skipped ? `，${s.skipped} 列對不到行政區` : ''}。只有行政區總數，平均分給該區的格子。`;
      case 'pois': return `讀到 ${s.total} 處：食物點 ${s.food}${s.cvs ? `、超商 ${s.cvs}` : ''}、可能棲所 ${s.harbor}${s.outLoc ? `，${s.outLoc} 處在臺北範圍外` : ''}。`;
      case 'bundle': return `資料包${s.generated ? `產生於 ${s.generated}，` : ''}含：${(s.parts || []).join('、') || '沒有可用資料'}。`;
      default: return r.error || '';
    }
  }

  return { KIND_ZH, decode, parseCSV, detect, readFile, build, summary, twd97, tagsOf, parseDate };
}
