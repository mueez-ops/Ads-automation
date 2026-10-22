// Mez Media carousel: "5 signs your Meta Ads might be wasting money" (7 slides, 1080x1350), Apple-style.
// One centred headline per slide and one picture under it: an iPhone, cropped by the bottom edge, whose
// screen shows the point. Light grey slides, black for the first and last; no numbers, labels or handles.
// Usage: node build_signs.js <out-dir>   (writes <out-dir>/post4_signs/post4_signs_01.png ...)
const path = require('path');
const { data, INK, GREY, CHART, PERSON, CHECK, phone, slide, note, lock, chart, toggle, render } = require('./apple_kit');

const PHOTO = data(path.join(__dirname, 'photos', 'o_handshake.jpg'), 'image/jpeg');
const post = (name, you) => `<div class="post"><div class="ph"><div class="av" style="width:60px;height:60px;${you ? `background:${INK}` : ''}"></div>
  <div><div style="font-weight:600;font-size:29px">${name}</div><div style="font-size:24px;color:${GREY}">Sponsored</div></div></div>
  <div class="adimg"></div><div style="font-weight:600;font-size:30px;line-height:1.25;padding:18px 30px 24px;text-wrap:balance">High-quality service at affordable prices.</div></div>`;

const slides = [
  slide('5 signs your Meta Ads<br>might be wasting money.', phone(`${lock('Tuesday 20 October')}
    ${note('Payment processed', 'now', '$1,240 charged for ads.', CHART(INK), true)}
    ${note('Weekly report', '1m ago', '2,138 clicks. 0 customers.', CHART(INK), true)}`,
  { dark: true, bg: 'background:radial-gradient(130% 75% at 50% 0%,#4a4a4e 0%,#1c1c1e 45%,#000 100%);color:#fff' }), { dark: true, size: 80, wide: 1000 }),

  slide('You’re celebrating clicks, <em>not customers.</em>', phone(`<div class="lt">Overview</div><div class="st">Last 7 days</div>
    <div class="card"><div class="lab">Clicks</div><div class="big">2,138</div>${chart('M0 92 C60 88 90 80 140 76 S230 54 280 50 S380 30 430 22 S500 9 532 5', INK, true)}</div>
    <div class="card"><div class="lab">Customers</div><div class="big">0</div>${chart('M0 70 C100 70 160 71 260 70 S420 69 532 70', '#C7C7CC')}</div>`)),

  slide('You’re attracting <em>the wrong leads.</em>', phone(`<div class="lt">Enquiries</div><div class="st">6 new</div><div class="list">
    ${[['A', 'Alex', 'Do you do it for free?', '9:38'], ['S', 'Sam', 'Just comparing prices, thanks.', '9:21'], ['J', 'Jordan', 'Sorry, wrong number.', '8:57'],
      ['P', 'Priya', 'Are you hiring?', '8:40'], ['C', 'Chris', 'Can you call me next year?', 'Mon'], ['D', 'Dan', 'What was this ad for?', 'Mon']].map(([i, n, m, w]) => `
      <div class="row"><div class="av">${i}</div><div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;align-items:baseline">
      <b style="font-weight:600;font-size:32px">${n}</b><span style="font-size:26px;color:${GREY}">${w}</span></div>
      <div style="font-size:30px;color:#6E6E73;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m}</div></div></div>`).join('')}</div>`)),

  slide('Your offer sounds <em>like everyone else’s.</em>', phone(`<div style="height:104px;background:#fff"></div>${post('Prime Services')}${post('Your business', true)}${post('Brightway Co.')}`, { bg: 'background:#fff' }),
    { extra: `.adimg{height:180px;background:url(${PHOTO}) center 38%/cover}` }),

  slide('Nobody knows what happens <em>after a lead comes in.</em>', phone(`${lock('Tuesday 20 October')}
    ${note('New lead', '3d ago', 'Sarah wants a quote.', PERSON('#fff'))}
    ${note('New lead', '2d ago', 'Mike asked about prices.', PERSON('#fff'))}
    ${note('New lead', '1d ago', 'Aisha wants to book.', PERSON('#fff'))}`, { bg: 'background:linear-gradient(180deg,#DEDEE3 0%,#BCBCC3 100%)' }), { size: 76 }),

  slide('You keep changing campaigns <em>without a clear hypothesis.</em>', phone(`<div class="lt">Campaigns</div><div class="st">5 campaigns</div><div class="list">
    ${[['Campaign_v3_FINAL', 0], ['Campaign_v4_new', 0], ['Campaign_v5_test', 0], ['Campaign_v6_FINAL_real', 1], ['Campaign_v7_try_this', 1]].map(([n, on]) => `
      <div class="row" style="padding:26px 32px"><div style="flex:1;font-size:31px;font-weight:500">${n}</div>${toggle(on)}</div>`).join('')}</div>`), { size: 76 }),

  slide('Before spending more, audit:', phone(`<div class="lt">Campaign review</div><div class="st">5 items</div><div class="list">
    ${['Your offer', 'Your creative', 'Your lead quality', 'Your follow-up process', 'Your conversion tracking'].map((t) => `
      <div class="row" style="padding:28px 32px"><div style="flex:none;width:52px;height:52px;border-radius:50%;background:${INK};display:flex;align-items:center;justify-content:center">${CHECK}</div>
      <div style="font-size:33px;font-weight:500">${t}</div></div>`).join('')}</div>`), { dark: true }),
];

render(slides, process.argv[2], 'post4_signs');
