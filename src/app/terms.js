/* 介面用語、任務與分級名稱、徽章插圖、防鼠標章（沿用北市鼠情週報、鼠患檢傷站與防鼠調度台） */
export const ADVICE = {
  breeding: '春秋繁殖高峰前：優先做源頭清理與下水道巡查，效果比高峰後投藥好。',
  postRain: '豪雨後 72 小時內：巡查下水道周邊與低窪地區，並提醒民眾清理時做好防護，預防鉤端螺旋體。',
  collectionGap: '連續停收：延長限時收受點的開放時間，加強市場與夜市收運。',
  attention: '搜尋關注度偏高：通報量可能被新聞放大，分級改看占全市的比例，不看筆數。',
  baitSnake: '投藥區附近有蛇類目擊：留意蛇類與猛禽二次中毒，考慮改用防鼠或誘捕。',
  midAutumn: '中秋烤肉週：戶外食物殘渣增加，加強公園與河濱的清運。'
};
export const RESIDENT = {
  breeding: '春秋繁殖高峰前，廚餘記得加蓋、清掉堆積的雜物。',
  postRain: '豪雨後清理積水與淤泥要戴手套、穿雨鞋，預防鉤端螺旋體。',
  collectionGap: '這週停收天數比較多，垃圾別提前拿出門。',
  attention: '最近新聞多，看到老鼠照常通報就好，不必恐慌。',
  baitSnake: '投藥區附近看到蛇不要靠近，也別讓寵物接觸毒餌。',
  midAutumn: '中秋烤肉後，食物殘渣記得帶走或密封。'
};
export const EVENTS = { hantaDeath: '1 月漢他病毒死亡案', lunarNewYear: '春節停收（依往年規則推估）', ratRadar: '見鼠地圖上線', cruise: '國際郵輪漢他病毒群聚', typhoon: '7/10 颱風停班、停收垃圾', midAutumn: '中秋節' };
export const STOP_WHY = { weekly: '週三、週日', lunarNewYear: '春節', typhoon: '颱風' };
export const TREND = { new: '新興熱點', persist: '持續熱點', inter: '間歇熱點', fade: '消退熱點' };
export const SNAKE = { cross: '蛇鼠共現：兩個管道互相佐證', poison: '二次中毒留意：位在投藥區', hidden: '疑似鼠低報：建議實地布籠確認', habitat: '山邊、河濱棲地：不代表鼠患' };
export const TAG_ACT = {
  sewer: '通報多提到水溝或下水道：檢查人孔蓋與排水溝縫隙、溝內是否有鼠道，必要時封堵。',
  alley: '通報多在防火巷或後巷：清除堆積雜物與棧板，檢查牆角鼠洞與擦痕。',
  indoor: '通報多在室內：協助住戶與店家封堵管線孔與冷氣孔等縫隙，室內以誘捕為主。',
  garbage: '通報多與垃圾或廚餘有關：檢查暫存點與廚餘桶是否加蓋，調整收運時間。',
  foodbiz: '通報多在餐飲或攤商周邊：會同衛生稽查，檢查收攤後的清潔與食材存放。',
  green: '通報多在公園綠地：檢查花圃與樹叢下的鼠洞，避免民眾餵食，慎用毒餌。',
  construction: '通報多在工地或空屋：要求工地做好防鼠圍籬與清潔，清查閒置空屋。'
};
export const TASK = { clean: '環境清潔', garbage: '垃圾代收', signs: '鼠跡確認', trap: '捕鼠籠巡查', shop: '店家三不輔導' };
export const TIER = { A: 'A 防鼠志工可做', B: 'B 社區防鼠巡查員（受訓）', C: 'C 社區環境衛生師或合格病媒防治人員' };
export const TSTAT = { open: '招募中', active: '進行中', verify: '待驗證', done: '已完成' };
export const DISP = { 1: '優先專業覆核', 2: '優先安排查核', 3: '安排例行改善', 4: '持續監測', 5: '列入紀錄' };
export const VIEWS = { triage: '檢傷', hot: '熱點', trend: '趨勢', snake: '蛇鼠', bait: '餌站', risk: '風險', points: '點位', squad: '特攻' };
export const SRC_ZH = { radar: '見鼠地圖', r1999: '1999 每週總量', manholes: '雨水人孔', food: '食品業者登錄數', sewer: '污水管線', pois: '食物點與棲所', population: '人口' };
export const ROLES = {
  citizen: [['c-tasks', '任務'], ['c-me', '我的']],
  merchant: [['m-shop', '我的店'], ['m-rank', '排行'], ['m-alert', '提醒']],
  gov: [['p-queue', '派案'], ['p-over', '總覽'], ['p-bait', '餌站'], ['p-try', '試判']]
};
export const LEVELS = [{ min: 0, name: '見習隊員' }, { min: 50, name: '正式隊員' }, { min: 150, name: '小隊長' }, { min: 400, name: '特攻隊長' }];
export const BADGES = [['第一次清潔', c => c.done.clean >= 1], ['鼠跡偵探', c => c.done.signs >= 3], ['捕鼠籠守望者', c => c.done.trap >= 3],
  ['垃圾代收達人', c => c.done.garbage >= 5], ['三不推手', c => c.done.shop >= 1], ['連續出勤 7 天', c => c.streak >= 7], ['餌站觀察員', c => (c.done.obs || 0) >= 3]];

export const BADGE_ART = (() => {
  const G = 'url(#bgGold)', ln = (d, w = 2.2, c = G) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const sh = (d, f, w = 2, c = G) => `<path d="${d}" fill="${f}" stroke="${c}" stroke-width="${w}" stroke-linejoin="round"/>`;
  const spark = (x, y, r = 3, c = '#fff') => `<path d="M${x} ${y - r}L${x + r * .32} ${y - r * .32}L${x + r} ${y}L${x + r * .32} ${y + r * .32}L${x} ${y + r}L${x - r * .32} ${y + r * .32}L${x - r} ${y}L${x - r * .32} ${y - r * .32}Z" fill="${c}"/>`;
  const rays = c => Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6, b = a + Math.PI / 18; return `<path d="M32 32L${(32 + 40 * Math.cos(a)).toFixed(1)} ${(32 + 40 * Math.sin(a)).toFixed(1)}L${(32 + 40 * Math.cos(b)).toFixed(1)} ${(32 + 40 * Math.sin(b)).toFixed(1)}Z" fill="${c}"/>`; }).join('');
  const field = {
    arc: (a, b) => `<rect width="64" height="64" fill="${a}"/><ellipse cx="32" cy="60" rx="36" ry="20" fill="${b}"/>${ln('M-2 42Q32 32 66 42', 1.6)}`,
    diag: (a, b) => `<rect width="64" height="64" fill="${a}"/><path d="M0 44L64 24V64H0Z" fill="${b}"/>${ln('M0 44L64 24', 1.6)}`,
    split: (a, b) => `<rect width="64" height="64" fill="${a}"/><path d="M40 0Q30 32 46 64H64V0Z" fill="${b}"/>${ln('M40 0Q30 32 46 64', 1.6)}`,
    rays: (a, b) => `<rect width="64" height="64" fill="${a}"/>${rays(b)}`
  };
  const wrap = (rim, f, icon) => `<svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true"><circle cx="32" cy="32" r="30.5" fill="${rim}"/><circle cx="32" cy="32" r="30.5" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1"/><g clip-path="url(#bgClip)">${f}</g><circle cx="32" cy="32" r="25.5" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="1.2"/>${icon}</svg>`;
  return [
    // 第一次清潔：掃把
    wrap(G, field.arc('#8fd6c0', '#fff4dc'), ln('M43 12L32 33', 3.2) + sh('M25 33H39L42 47H22Z', '#f6c56b') + ln('M27 37L26 46M32 37V46M37 37L38 46', 1.4) + spark(47, 38, 4) + spark(18, 22, 2.6)),
    // 鼠跡偵探：放大鏡＋腳印
    wrap(G, field.diag('#b9a7f0', '#7a68d6'), sh('M28 18a10 10 0 1 1 0 20a10 10 0 1 1 0-20Z', '#eef6ff') + ln('M35.5 35.5L45 45', 4.2) + '<g fill="#7a68d6"><circle cx="25" cy="29" r="2.2"/><circle cx="31" cy="26" r="1.8"/><circle cx="22.5" cy="24.5" r="1.3"/><circle cx="26.5" cy="22.5" r="1.3"/><circle cx="33.5" cy="22.3" r="1.1"/><circle cx="29.7" cy="21" r="1.1"/></g>' + spark(46, 18, 3.4)),
    // 捕鼠籠守望者：籠子
    wrap(G, field.rays('#3f6fc4', 'rgba(255,255,255,.12)'), ln('M24 18Q32 10 40 18', 2.2) + sh('M18 22H46V44H18Z', 'rgba(255,255,255,.88)') + ln('M23 22V44M28 22V44M33 22V44M38 22V44M43 22V44', 1.5) + ln('M18 33H46', 1.3) + spark(50, 16, 3.2) + spark(14, 46, 2.4)),
    // 垃圾代收達人：垃圾桶
    wrap(G, field.split('#f4a261', '#e76f51'), sh('M20 20H44V25H20Z', '#ffe2c4') + ln('M28 20V16H36V20', 1.8) + sh('M22 25H42L39.5 47H24.5Z', '#fff8ef') + ln('M28 29L28.8 43M32 29V43M36 29L35.2 43', 1.5) + spark(48, 40, 3.4) + spark(15, 18, 2.4)),
    // 三不推手：店面＋勾
    wrap(G, field.arc('#9ccc6b', '#36773f'), sh('M16 22H48L50 29H14Z', '#fff') + '<path d="M22 22L20 29M28.5 22L27.5 29M35.5 22L36.5 29M42 22L44 29" stroke="#d9502f" stroke-width="3.4"/>' + ln('M16 22H48L50 29H14Z', 1.8) + sh('M18 29H46V46H18Z', '#fffaf1') + '<path d="M25 37.5L30 42L39.5 33" fill="none" stroke="#36773f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' + spark(50, 15, 3.4)),
    // 連續出勤 7 天：銀框＋7 DAY
    wrap('url(#bgSilver)', field.rays('#1f2a44', 'rgba(255,255,255,.08)'), '<text x="32" y="36" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="24" fill="url(#bgSilver)" stroke="#1f2a44" stroke-width=".6">7</text><text x="32" y="46" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="7.5" letter-spacing="1.5" fill="#dfe6f1">DAY</text>' + spark(18, 22, 3.6, '#ffe08a') + spark(47, 20, 2.6, '#ffe08a') + spark(46, 44, 2, '#fff')),
    // 餌站觀察員：眼睛＋餌盒
    wrap(G, field.diag('#5fb7b0', '#2f7f86'), sh('M18 22Q32 10 46 22Q32 34 18 22Z', '#fff') + '<circle cx="32" cy="22" r="4.6" fill="#2f7f86"/><circle cx="33.4" cy="20.6" r="1.4" fill="#fff"/>' + sh('M19 34H45V46H19Z', '#fff4dc') + '<circle cx="32" cy="40" r="2.6" fill="#2f7f86"/>' + spark(49, 33, 3) + spark(14, 33, 2.2))
  ];
})();
export const BADGE_SVG = ['<svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true"><path d="M24.0 3.0 L28.7 6.6 L34.5 5.8 L36.7 11.3 L42.2 13.5 L41.4 19.3 L45.0 24.0 L41.4 28.7 L42.2 34.5 L36.7 36.7 L34.5 42.2 L28.7 41.4 L24.0 45.0 L19.3 41.4 L13.5 42.2 L11.3 36.7 L5.8 34.5 L6.6 28.7 L3.0 24.0 L6.6 19.3 L5.8 13.5 L11.3 11.3 L13.5 5.8 L19.3 6.6Z" fill="#bfe0a6" stroke="#2a2a2a" stroke-width="2" stroke-linejoin="round"/><circle cx="24" cy="24" r="12.5" fill="#fffdf8" stroke="#2a2a2a" stroke-width="2" stroke-linejoin="round"/><path d="M18 24.5l4.2 4.2L30.5 20" fill="none" stroke="#36773f" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>','<svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true"><path d="M15 30 L10 46 L16 42.5 L19.5 47 L23 33Z" fill="#36773f" stroke="#2a2a2a" stroke-width="2" stroke-linejoin="round"/><path d="M33 30 L38 46 L32 42.5 L28.5 47 L25 33Z" fill="#36773f" stroke="#2a2a2a" stroke-width="2" stroke-linejoin="round"/><path d="M24.0 2.0 L27.4 4.9 L31.8 3.8 L33.7 7.9 L38.1 8.8 L38.0 13.3 L41.5 16.0 L39.5 20.0 L41.5 24.0 L38.0 26.7 L38.1 31.2 L33.7 32.1 L31.8 36.2 L27.4 35.1 L24.0 38.0 L20.6 35.1 L16.2 36.2 L14.3 32.1 L9.9 31.2 L10.0 26.7 L6.5 24.0 L8.5 20.0 L6.5 16.0 L10.0 13.3 L9.9 8.8 L14.3 7.9 L16.2 3.8 L20.6 4.9Z" fill="#4f9a5a" stroke="#2a2a2a" stroke-width="2" stroke-linejoin="round"/><circle cx="24" cy="20" r="11" fill="#fffdf8" stroke="#2a2a2a" stroke-width="2" stroke-linejoin="round"/><path d="M24.0 13.0 L25.9 17.8 L31.1 18.2 L27.1 21.5 L28.4 26.6 L24.0 23.8 L19.6 26.6 L20.9 21.5 L16.9 18.2 L22.1 17.8Z" fill="#4f9a5a" stroke="#2a2a2a" stroke-width="1.4" stroke-linejoin="round"/></svg>','<svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true"><path d="M14 2 L22 18 L28 18 L20 2Z" fill="#d9502f" stroke="#2a2a2a" stroke-width="2" stroke-linejoin="round"/><path d="M34 2 L26 18 L20 18 L28 2Z" fill="#4f8fd6" stroke="#2a2a2a" stroke-width="2" stroke-linejoin="round"/><circle cx="24" cy="30" r="15" fill="#f2c230" stroke="#2a2a2a" stroke-width="2" stroke-linejoin="round"/><circle cx="24" cy="30" r="10.5" fill="#ffe08a" stroke="#c9961a" stroke-width="1.5"/><g fill="none" stroke="#2a2a2a" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><path d="M16.5 32.5 L28 25.5 L31.5 28.5 L31.5 35 L16.5 35 Z"/><path d="M16.5 32.5 L31.5 28.5"/><circle cx="21.5" cy="33.5" r="0.9"/><circle cx="27" cy="32.3" r="1.2"/></g><path d="M36 9 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2Z" fill="#fff" stroke="#2a2a2a" stroke-width="1"/></svg>'];
export const STIERS = [
  { k: 't1', mark: '✓', name: '三不防鼠認證', desc: '不留食物、不留孔洞、不堆雜物；現場評核通過即取得，疊在衛福部餐飲衛生分級上。' },
  { k: 't2', mark: '★', name: '防鼠守護店', desc: '已認證，且連續 90 天巡查良好、主動通報零隱匿。未來可研議差異化輔導及稽查措施，須經主管機關評估。' },
  { k: 't3', mark: '1', name: '米奇零推薦', desc: '年度推薦榜：連續一年良好，未來可研議結合政府專刊與優良店家案例曝光，須經局處協商。' }
];
/* 店家廢棄物自評：鮮食報廢與垃圾暫存，第三個值 true 表示要改善；之後可取代超商的模擬設施，成為檢傷模型的店家觀察資料 */
export const WASTE_Q = [
  ['scrap', '報廢品與剩食怎麼處理？', [['day', '當天密封交清運'], ['hold', '店內密閉桶隔夜'], ['out', '放店外等收', true]]],
  ['where', '垃圾與廚餘暫存在哪裡？', [['in', '店內加蓋桶'], ['lid', '店外加蓋桶'], ['open', '店外沒加蓋', true]]],
  ['stay', '垃圾在店外放多久才收走？', [['none', '不放店外'], ['short', '2 小時內'], ['night', '會過夜', true]]],
  ['who', '誰來收？', [['city', '市府垃圾車'], ['firm', '民間清運'], ['none', '不固定', true]]]
];
