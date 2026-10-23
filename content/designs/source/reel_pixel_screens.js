// Phone pictures for reel_pixel.js (frame and page template from phone_screens.js): the store's orders (the big number
// and the rows are drawn by the reel, one by one), the campaign results with 0 purchases, the store's thank-you page
// (the reel draws the missing tracking code in its slot), Events Manager and its Test events tab, and the product page
// for the test purchase. Plain mock-ups, no real logos. The store is made up.
const { INK, GREY } = require('./apple_kit');
const { PH, PAGE, FRAMES, renderScreens, dump } = require('./phone_screens');

const CSS = `<style>
.slot{height:120px;margin-top:6px}
.orow{display:flex;align-items:center;gap:16px;padding:0 26px;height:56px;border-top:2px solid #EDEDF0}
.orow:first-child{border-top:0}
.thumb{flex:none;width:40px;height:40px;border-radius:10px;background-size:cover;background-position:center 60%}
.on2{flex:1;font-size:25px;font-weight:600}.amt{font-size:25px;font-weight:600}
.paid{font-size:20px;font-weight:600;padding:5px 12px;border-radius:10px;background:#E5E5EA}
.bar{display:flex;align-items:center;justify-content:space-between;padding:18px 34px 20px;border-bottom:2px solid #EDEDF0}
.tabs{display:flex;gap:10px;padding:26px 26px 0}.tabs span{padding:14px 22px;border-radius:24px;background:#fff;font-size:25px;font-weight:600;color:${GREY}}
.tabs span.on{background:${INK};color:#fff}
.btnk{height:100px;border-radius:50px;background:${INK};color:#fff;font-size:34px;font-weight:600;display:flex;align-items:center;justify-content:center}
</style>`;
const scr = (bg, body) => `${CSS}<div class="scr" style="background:${bg};padding-top:104px">${body}</div>`;
const STORE = 'Glow Candle Co.';
const BAG = `<svg width="34" height="34" viewBox="0 0 24 24"><path fill="none" stroke="${INK}" stroke-width="2" stroke-linejoin="round" d="M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0"/></svg>`;

// the store's orders: the count and twelve rows, drawn by the reel as they come in
const ITEMS = ['Soy candle', 'Amber jar', 'Soy candle', 'Cedar candle', 'Soy candle', 'Fig candle', 'Amber jar', 'Soy candle', 'Cedar candle', 'Soy candle', 'Fig candle', 'Soy candle'];
const ROWS = ITEMS.map((it, i) => `<div class="orow" id="r${i}"><div class="thumb" style="background-image:url(${PH('candle.jpg')})"></div><div class="on2">#${1042 - i} · ${it}</div><div class="amt">$24</div><div class="paid">Paid</div></div>`).join('');
const ORDERS = scr('#F2F2F7', `<div class="lt">Orders</div><div class="st">${STORE} · last 7 days</div>
  <div class="card" id="oc"><div class="lab">Orders</div><div class="slot" id="v1"></div></div>
  <div class="list" id="ol" style="height:672px"></div>`);
const OROWS = `${CSS}<div class="scr" style="background:transparent;padding-top:104px"><div class="lt" style="visibility:hidden">Orders</div><div class="st" style="visibility:hidden">x</div>
  <div class="card" style="visibility:hidden"><div class="lab">Orders</div><div class="slot"></div></div><div class="list" style="background:transparent">${ROWS}</div></div>`;

// the campaign: money spent, purchases 0 (the zero is drawn by the reel)
const ADS = scr('#F2F2F7', `<div class="lt">Results</div><div class="st">${STORE} · last 7 days</div>
  <div class="card"><div class="lab">Amount spent</div><div class="big">$310</div></div>
  <div class="card" id="pc"><div class="lab">Purchases</div><div class="slot" id="v2"></div></div>
  <div class="list"><div class="row"><div style="flex:1;font-size:31px;font-weight:500">Holiday candles</div><div style="font-size:29px;color:${GREY}">Active</div></div></div>`);

// the thank-you page: everything a buyer sees, and a slot where the tracking code should be
const THANKS = scr('#fff', `<div class="bar"><b style="font-size:30px;font-weight:700">${STORE}</b>${BAG}</div>
  <div style="text-align:center;padding:70px 40px 0"><div style="width:120px;height:120px;border-radius:50%;background:${INK};margin:0 auto;display:flex;align-items:center;justify-content:center">
    <svg width="60" height="46" viewBox="0 0 26 20"><path d="M3 10.5l7 6.5L23 3" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
    <div id="ty" style="font-family:Disp;font-weight:600;font-size:64px;letter-spacing:-.02em;margin-top:34px">Thank you!</div>
    <div style="font-size:29px;color:${GREY};margin-top:8px">Your order is confirmed.</div></div>
  <div style="margin:44px 34px 0;padding:24px;border-radius:30px;background:#F2F2F7;display:flex;align-items:center;gap:22px">
    <div class="thumb" style="width:96px;height:96px;border-radius:20px;background-image:url(${PH('candle.jpg')})"></div>
    <div style="flex:1"><div style="font-size:29px;font-weight:600">Soy candle × 1</div><div style="font-size:25px;color:${GREY};margin-top:4px">Order #1042</div></div><div style="font-size:29px;font-weight:600">$24</div></div>
  <div id="tag" style="margin:40px 34px 0;height:150px"></div>`);

// Events Manager: the store's data, nothing arriving, and the Test events tab
const EM = scr('#F2F2F7', `<div class="lt">Events Manager</div><div class="st">${STORE} · website events</div>
  <div class="tabs"><span class="on">Overview</span><span id="tab">Test events</span><span>Settings</span></div>
  <div class="card"><div class="lab">Purchases received</div><div class="big">0</div><div style="font-size:26px;color:${GREY};margin-top:6px">Last 7 days</div></div>`);
const TEST = scr('#F2F2F7', `<div class="lt">Test events</div><div class="st" style="line-height:1.35">Buy something from your store.<br>It should show up here.</div>
  <div class="tabs"><span>Overview</span><span class="on">Test events</span><span>Settings</span></div>
  <div class="card" id="wait" style="height:130px"></div>
  <div id="evs" style="margin:24px 26px 0;height:150px"></div>`);

// the product page, for the test purchase
const PRODUCT = scr('#fff', `<div class="bar"><b style="font-size:30px;font-weight:700">${STORE}</b>${BAG}</div>
  <div class="photo" style="height:380px;background-image:url(${PH('candle.jpg')});background-position:center 66%"></div>
  <div style="padding:30px 34px 0"><div style="font-family:Disp;font-weight:600;font-size:52px;letter-spacing:-.02em">Soy candle</div>
    <div style="font-size:30px;color:${GREY};margin-top:4px">Cotton and fig · 40 hours</div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:28px"><b style="font-size:40px;font-weight:600">$24</b></div>
    <div class="btnk" id="buy" style="margin-top:26px">Buy now</div></div>`);

const S = (html, h = 1280) => [PAGE(html, 600, h), 600, h];
const SHOTS = {
  ...FRAMES,
  orders: S(ORDERS), orows: S(OROWS), ads: S(ADS), thanks: S(THANKS), em: S(EM), test: S(TEST), product: S(PRODUCT),
};
const screens = () => renderScreens(SHOTS);

module.exports = { screens };
if (require.main === module) dump(screens, process.argv[2]);
