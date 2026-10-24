/* 點數兌換的品項、地點與庫存（皆為模擬），以及換位置用的行政區地標 */
export const AVATAR_SVG = '<svg viewBox="0 0 52 52"><rect width="52" height="52" fill="#d6eacf"/><circle cx="26" cy="21" r="10" fill="#f3d2b3" stroke="#2a2a2a" stroke-width="1.6"/><path d="M16 19c1-7 6-10 10-10s9 3 10 10c-3-2-6-4-10-4s-7 2-10 4z" fill="#3b3a36"/><path d="M8 52c1-10 8-16 18-16s17 6 18 16z" fill="#4f9a5a" stroke="#2a2a2a" stroke-width="1.6"/><circle cx="22.5" cy="22" r="1.3" fill="#2a2a2a"/><circle cx="29.5" cy="22" r="1.3" fill="#2a2a2a"/><path d="M23 26.5c1.8 1.3 4.2 1.3 6 0" fill="none" stroke="#2a2a2a" stroke-width="1.4" stroke-linecap="round"/></svg>';
export const STORE_SVG = '<svg viewBox="0 0 52 52"><rect width="52" height="52" fill="#fffaf1"/><path d="M9 20h34v22H9z" fill="#fffdf8" stroke="#2a2a2a" stroke-width="1.8"/><path d="M7 12h38l-2 9c-1 3-5 3-6 0-1 3-5 3-6 0-1 3-5 3-6 0-1 3-5 3-6 0-1 3-5 3-6 0z" fill="#d9502f" stroke="#2a2a2a" stroke-width="1.8" stroke-linejoin="round"/><rect x="21" y="29" width="10" height="13" fill="#c8ee6a" stroke="#2a2a2a" stroke-width="1.6"/><rect x="12" y="27" width="6" height="6" fill="#d7ecf4" stroke="#2a2a2a" stroke-width="1.4"/><rect x="34" y="27" width="6" height="6" fill="#d7ecf4" stroke="#2a2a2a" stroke-width="1.4"/></svg>';
export const GIFT_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h16v10H4zM2.5 6.5h19V10h-19zM12 6.5V20" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 6.5C10 3 6.5 3.5 7 5.5S12 6.5 12 6.5zm0 0c2-3.5 5.5-3 5-1S12 6.5 12 6.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
export const RD_IC = {
  bag: '<path d="M6 8h12l-1 12H7z M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  soap: '<path d="M9 3h5v3H9zM8 6h7l2 4v10H6V10z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 13h5" stroke="currentColor" stroke-width="1.8"/>',
  egg: '<path d="M12 3c4 0 7 6 7 10a7 7 0 0 1-14 0c0-4 3-10 7-10z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 13l2 2 2-2 2 2 2-2" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  glove: '<path d="M7 21v-8L5 9.5a1.4 1.4 0 0 1 2.4-1.4L9 10V4.5a1.3 1.3 0 0 1 2.6 0V9V3.5a1.3 1.3 0 0 1 2.6 0V9V4.5a1.3 1.3 0 0 1 2.6 0V15l-1 6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  bin: '<path d="M5 8h14l-1.5 12h-11zM3.5 8h17M9 5h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 12v5M14 12v5" stroke="currentColor" stroke-width="1.6"/>',
  seal: '<path d="M3 17h18M5 17V7h14v10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M5 14h14" stroke="currentColor" stroke-width="3"/>',
  badge: '<circle cx="12" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 15 7 21l5-2.5 5 2.5-1.5-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  ticket: '<path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 7v10" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2"/>',
  clock: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  li: '<path d="M4 20V10l8-6 8 6v10zM10 20v-5h4v5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  shopi: '<path d="M4 9h16v11H4zM3 5h18l-1 4H4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 20v-6h4v6" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  gov: '<path d="M3 20h18M5 20V10M9.5 20V10M14.5 20V10M19 20V10M2.5 10h19L12 4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  truck: '<path d="M2.5 6h11v10h-11zM13.5 9.5h4l3 3.5V16h-7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="6.5" cy="17.5" r="1.8" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="17" cy="17.5" r="1.8" fill="none" stroke="currentColor" stroke-width="1.6"/>'
};
export const rdIcon = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${RD_IC[k]}</svg>`;
/* 品項：p＝點數；q＝資格型（不扣點，達到門檻才能登記） */
export const RD_ITEMS = {
  bag14: { n: '專用垃圾袋 14 公升（20 入）', d: '臺北市隨袋徵收專用袋', p: 50, ic: 'bag' },
  bag5: { n: '專用垃圾袋 5 公升（20 入）', d: '小家庭、套房適用', p: 30, ic: 'bag' },
  soap: { n: '洗碗精 500 毫升', d: '合作廠商提供', p: 70, ic: 'soap' },
  refill: { n: '洗碗精補充包', d: '補給站店家提供', p: 60, ic: 'soap' },
  egg: { n: '茶葉蛋', d: '補給站店家提供，當天兌換', p: 20, ic: 'egg' },
  glove: { n: '清潔用橡膠手套', d: '居家清潔用', p: 40, ic: 'glove' },
  kit: { n: '志工手套口罩組', d: '出任務用，A 級任務必備', p: 30, ic: 'glove' },
  seal: { n: '防鼠門縫條', d: '封住門下縫隙，不讓鼠來', p: 100, ic: 'seal' },
  bin: { n: '密封廚餘桶（小）', d: '不讓鼠吃，加蓋可上鎖', p: 150, ic: 'bin' },
  patch: { n: '打鼠特攻隊布章', d: '可縫在背包或外套', p: 80, ic: 'badge' },
  pin: { n: '實體隊員徽章', d: '集滿 12 區行政區寶石兌換', q: { k: 'gems', n: 12, u: '區寶石' }, ic: 'badge' },
  trip: { n: '里民旅遊優先登記資格', d: '依簽到紀錄排序，名單公開透明', q: { k: 'checkins', n: 10, u: '次簽到' }, ic: 'ticket' },
  hours: { n: '志願服務時數證明', d: '由區公所開立，可用於志工紀錄冊', q: { k: 'hours', n: 6, u: '小時服務' }, ic: 'clock' }
};
export const RD_LOCS = [
  { id: 'li', type: 'li', tn: '里辦公處', name: '雙連周邊里辦公處', d: 350, hours: '週一至週五 09:00–12:00、14:00–17:00', ic: 'li', c: 'color-mix(in srgb, var(--green) 28%, var(--paper))', items: ['bag14', 'soap', 'trip'] },
  { id: 'mkt', type: 'shop', tn: '特攻隊補給站', name: '補給站・雙連超市', d: 420, hours: '每日 08:00–22:00', ic: 'shopi', c: 'color-mix(in srgb, var(--orange) 28%, var(--paper))', items: ['egg', 'bag5', 'refill'] },
  { id: 'drug', type: 'shop', tn: '特攻隊補給站', name: '補給站・民生藥妝', d: 610, hours: '每日 10:00–22:00', ic: 'shopi', c: 'color-mix(in srgb, var(--orange) 28%, var(--paper))', items: ['glove', 'refill', 'kit'] },
  { id: 'team', type: 'gov', tn: '清潔隊', name: '大同區清潔隊', d: 1200, hours: '週一至週五 08:00–17:00', ic: 'truck', c: 'color-mix(in srgb, var(--blue) 28%, var(--paper))', items: ['kit', 'seal', 'bin'] },
  { id: 'dist', type: 'gov', tn: '區公所', name: '大同區公所 1 樓服務台', d: 1500, hours: '週一至週五 08:30–17:30', ic: 'gov', c: 'color-mix(in srgb, var(--blue) 28%, var(--paper))', items: ['bag14', 'soap', 'hours'] },
  { id: 'city', type: 'gov', tn: '市政府', name: '臺北市政府 1 樓聯合服務中心', d: 6800, hours: '週一至週五 08:30–17:30', ic: 'gov', c: 'color-mix(in srgb, var(--blue) 28%, var(--paper))', items: ['bag14', 'patch', 'pin'] }
];
export const RD_STOCK = { egg: 18, bag5: 25, refill: 9, glove: 14, kit: 30, seal: 12, bin: 4, patch: 40, bag14: 60, soap: 20 };
export const RD_FILTERS = [['all', '全部'], ['li', '里辦公處'], ['shop', '補給站'], ['gov', '市府機關']];
/* 換位置：各行政區的地標 */
export const LOC_DATA = [
  ['中正區', [['台北車站', 25.0478, 121.5170], ['西門町', 25.0421, 121.5081], ['東門市場', 25.0335, 121.5285], ['南機場夜市', 25.0296, 121.5070]]],
  ['大同區', [['雙連捷運站', 25.0577, 121.5206], ['寧夏夜市', 25.0566, 121.5153], ['迪化街', 25.0559, 121.5100], ['大龍街夜市', 25.0732, 121.5160]]],
  ['中山區', [['中山捷運站', 25.0526, 121.5203], ['行天宮', 25.0630, 121.5336], ['晴光市場', 25.0657, 121.5226]]],
  ['萬華區', [['龍山寺', 25.0372, 121.4999], ['華西街', 25.0386, 121.4982], ['環南市場', 25.0300, 121.5020]]],
  ['大安區', [['大安森林公園', 25.0300, 121.5355], ['師大夜市', 25.0254, 121.5290], ['公館', 25.0146, 121.5340]]],
  ['信義區', [['市政府捷運站', 25.0410, 121.5652], ['臨江街夜市', 25.0300, 121.5540], ['象山', 25.0277, 121.5703]]],
  ['松山區', [['饒河夜市', 25.0510, 121.5776], ['松山車站', 25.0493, 121.5779], ['民生社區', 25.0590, 121.5580]]],
  ['士林區', [['士林夜市', 25.0881, 121.5240], ['天母', 25.1170, 121.5300]]],
  ['北投區', [['北投捷運站', 25.1320, 121.4986], ['石牌', 25.1146, 121.5155]]],
  ['內湖區', [['內湖捷運站', 25.0837, 121.5944], ['內湖科學園區', 25.0790, 121.5760]]],
  ['南港區', [['南港車站', 25.0520, 121.6068], ['南港展覽館', 25.0553, 121.6175]]],
  ['文山區', [['景美夜市', 25.0035, 121.5410], ['木柵動物園', 24.9983, 121.5794]]]
];
