// Phone pictures for reel_edits.js (frame and page template from phone_screens.js): the ad set (its status chip,
// learning meter, settings values and edit count are drawn by the reel, so they can change in place), and the editor
// with all three changes made in one go. Plain mock-ups, no real logos.
const { INK, GREY } = require('./apple_kit');
const { PAGE, FRAMES, renderScreens, dump } = require('./phone_screens');

const CSS = `<style>
.slot{height:120px;margin-top:6px}
.set{display:flex;align-items:center;justify-content:space-between;height:78px;padding:0 30px;border-top:2px solid #EDEDF0}
.set:first-child{border-top:0}
.sk{font-size:31px;font-weight:500}.sv{width:310px;height:44px}
.tbar{display:flex;align-items:center;justify-content:space-between;padding:22px 34px 18px}
.ok{flex:none;width:44px;height:44px;border-radius:50%;background:${INK};display:flex;align-items:center;justify-content:center}
.btnk{height:100px;border-radius:50px;background:${INK};color:#fff;font-size:33px;font-weight:600;display:flex;align-items:center;justify-content:center}
</style>`;
const scr = (bg, body) => `${CSS}<div class="scr" style="background:${bg};padding-top:104px">${body}</div>`;
const TICK = `<svg width="22" height="17" viewBox="0 0 26 20"><path d="M3 10.5l7 6.5L23 3" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// the ad set: status and learning, how many times it was edited this week, and its three settings
const ADSET = scr('#F2F2F7', `<div class="lt">Ad set</div><div class="st">Spring offer · Sales</div>
  <div class="card" id="sc" style="padding-bottom:22px"><div style="display:flex;align-items:center;justify-content:space-between">
    <div class="lab" style="color:${INK};font-size:31px;font-weight:600">Status</div><div id="status" style="width:200px;height:52px"></div></div>
    <div id="meter" style="height:70px;margin-top:18px"></div></div>
  <div class="card" id="ec"><div class="lab">Edits this week</div><div class="slot" id="v1"></div></div>
  <div class="list" id="set">
    <div class="set" id="r0"><div class="sk">Headline</div><div class="sv" id="hv"></div></div>
    <div class="set" id="r1"><div class="sk">Daily budget</div><div class="sv" id="bv"></div></div>
    <div class="set" id="r2"><div class="sk">Audience</div><div class="sv" id="av"></div></div></div>`);

// all three changes, published together
const ONEGO = scr('#fff', `<div class="tbar"><span style="font-size:30px;color:${GREY}">Cancel</span><b style="font-size:31px;font-weight:600">Edit ad set</b><span style="width:80px"></span></div>
  <div style="padding:20px 34px 0;font-size:27px;color:${GREY}">3 changes</div>
  <div class="list" style="background:#F2F2F7;margin-top:14px">
    ${[['Headline', 'Last days: 20% off'], ['Daily budget', '$35'], ['Audience', 'Age 18–54 · Gifts']].map(([k, v], i) => `<div class="set" id="c${i}" style="height:96px"><div><div class="sk">${k}</div><div style="font-size:24px;color:${GREY};margin-top:2px">${v}</div></div><div class="ok">${TICK}</div></div>`).join('')}</div>
  <div class="btnk" id="pub" style="margin:40px 34px 0">Publish all</div>`);

const S = (html, h = 1280) => [PAGE(html, 600, h), 600, h];
const SHOTS = { ...FRAMES, adset: S(ADSET), onego: S(ONEGO) };
const screens = () => renderScreens(SHOTS);

module.exports = { screens };
if (require.main === module) dump(screens, process.argv[2]);
