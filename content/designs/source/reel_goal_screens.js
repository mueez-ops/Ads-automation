// Phone pictures for reel_goal.js (frame and page template from phone_screens.js): the campaign results (the
// numbers and the hidden campaign goal are drawn by the reel), the ad being edited (two photos, two headlines),
// the audience sheet before and after, and the campaign goal picker (the reel draws the selected dot).
// The business is made up.
const { INK, GREY } = require('./apple_kit');
const { PH, PAGE, FRAMES, renderScreens, dump } = require('./phone_screens');

const CSS = `<style>
.slot{height:120px;margin-top:6px}
.chip{display:inline-block;margin:0 10px 12px 0;padding:14px 22px;border-radius:30px;background:#F2F2F7;font-size:27px;font-weight:500}
.sheet{position:absolute;left:0;right:0;bottom:0;height:520px;background:#fff;border-radius:44px 44px 0 0;box-shadow:0 -10px 40px rgba(0,0,0,.14);padding:20px 34px 0}
.grab{width:70px;height:9px;border-radius:5px;background:#D1D1D6;margin:0 auto 26px}
.opt{display:flex;align-items:center;gap:24px;padding:24px 30px}
.dot{flex:none;width:44px;height:44px}
.on{font-size:32px;font-weight:600}.od{font-size:25px;color:${GREY};margin-top:3px}
</style>`;
const scr = (bg, body) => `${CSS}<div class="scr" style="background:${bg};padding-top:104px">${body}</div>`;

// the results: two big numbers and the campaign goal, still hidden
const DASH = scr('#F2F2F7', `<div class="lt">Results</div><div class="st">Home Refit Co. · last 14 days</div>
  <div class="card"><div class="lab">Link clicks</div><div class="slot" id="v1"></div></div>
  <div class="card"><div class="lab">Enquiries</div><div class="slot" id="v2"></div></div>
  <div class="list"><div class="row"><div style="flex:1;font-size:31px;font-weight:500">Campaign goal</div><div id="goal" style="width:170px;height:46px"></div></div>
  <div class="row"><div style="flex:1;font-size:31px;font-weight:500">Status</div><div style="font-size:29px;color:${GREY}">Active</div></div></div>`);

// the ad as he edits it: photo, headline, button
const ED = (photo, fy, head) => scr('#fff', `<div style="display:flex;align-items:center;justify-content:space-between;padding:22px 34px 18px"><span style="font-size:30px;color:${GREY}">Cancel</span><b style="font-size:31px;font-weight:600">Edit ad</b><span style="font-size:30px;font-weight:600">Publish</span></div>
  <div class="hd"><div class="av" style="background:${INK};color:#fff">H</div><div><div class="nm">Home Refit Co.</div><div class="sp">Sponsored</div></div><div class="dots"><i></i><i></i><i></i></div></div>
  <div class="photo" id="ph" style="height:440px;background-image:url(${PH(photo)});background-position:center ${fy}"></div>
  <div id="hl" style="display:flex;align-items:center;justify-content:space-between;gap:20px;padding:22px 34px;background:#F2F2F7"><b style="font-size:33px;font-weight:600;line-height:1.2">${head}</b>
    <div style="flex:none;padding:16px 26px;border-radius:14px;background:#E5E5EA;font-size:27px;font-weight:600">Learn more</div></div>`);
const H1 = 'Kitchens fitted in 10 days', H2 = 'Get a free quote today';

// the audience sheet that slides up over the ad
const SHEET = (chips) => `${CSS}<div class="scr" style="background:transparent;height:560px"><div class="sheet" id="sheet"><div class="grab"></div>
  <div style="font-size:36px;font-weight:700;margin-bottom:20px">Audience</div><div id="chips">${chips.map((c) => `<span class="chip">${c}</span>`).join('')}</div>
  <div style="font-size:26px;color:${GREY};margin-top:10px">Estimated reach: large</div></div></div>`;

// the goal picker: what the campaign is asking Meta for
const GOALS = [['Awareness', 'Show your ad to as many people as possible'], ['Traffic', 'Send people to your website'],
  ['Engagement', 'Get more likes, comments and messages'], ['Leads', 'Collect enquiries for your business'], ['Sales', 'Find people likely to buy']];
const PICK = scr('#F2F2F7', `<div class="lt" style="margin-top:300px">Campaign goal</div><div class="st">What do you want people to do?</div><div class="list">
  ${GOALS.map(([n, d], i) => `<div class="opt row" id="g${i}"><div class="dot" id="d${i}"></div><div><div class="on">${n}</div><div class="od">${d}</div></div></div>`).join('')}</div>`);

const S = (html, h = 1280) => [PAGE(html, 600, h), 600, h];
const SHOTS = {
  ...FRAMES,
  dash: S(DASH), ed0: S(ED('o_kitchen.jpg', '58%', H1)), ed1: S(ED('o_living.jpg', '62%', H1)), ed2: S(ED('o_living.jpg', '62%', H2)),
  aud0: S(SHEET(['Age 25–54', 'Homeowners', 'Within 10 miles']), 560), aud1: S(SHEET(['Age 30–65', 'Interior design', 'Within 25 miles']), 560),
  pick: S(PICK),
};
const screens = () => renderScreens(SHOTS);

module.exports = { screens };
if (require.main === module) dump(screens, process.argv[2]);
