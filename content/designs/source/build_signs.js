// Mez Media carousel: "5 signs your Meta Ads might be wasting money" (7 slides, 1080x1350).
// Classic look: warm ivory paper, near-black type, warm greys, one deep red used sparingly.
// Inter Display for headlines, Instrument Serif italic for numerals and the key word, DM Mono for labels.
// Usage: node build_signs.js <out-dir>   (writes <out-dir>/post4_signs/post4_signs_01.png ...)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2];
const FONTS = path.join(__dirname, 'fonts');
const font = (f, type) => `url(data:font/${type};base64,${fs.readFileSync(path.join(FONTS, f)).toString('base64')})`;
const W = 1080, H = 1350, TOTAL = 7;

// faint paper grain
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .2  0 0 0 0 .15  0 0 0 0 .1  0 0 0 .6 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`)}")`;

const CSS = `
@font-face{font-family:Logo;font-weight:800;src:${font('InterDisplay-ExtraBold.otf', 'otf')}}
@font-face{font-family:Logo;font-weight:600;src:${font('InterDisplay-SemiBold.otf', 'otf')}}
@font-face{font-family:Body;font-weight:500;src:${font('Inter-500.ttf', 'ttf')}}
@font-face{font-family:Body;font-weight:600;src:${font('Inter-600.ttf', 'ttf')}}
@font-face{font-family:Body;font-weight:700;src:${font('Inter-700.ttf', 'ttf')}}
@font-face{font-family:Serif;font-style:italic;src:${font('InstrumentSerif-Italic.woff2', 'woff2')}}
@font-face{font-family:Mono;src:${font('DMMono-Regular.ttf', 'ttf')}}
:root{--paper:#F2EDE4;--card:#FBF8F2;--back:#E8E1D5;--ink:#161514;--soft:#5E5850;--mute:#8F887C;--rule:#D7CFC1;--red:#8B2D23}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:var(--paper)}
.s{position:relative;width:${W}px;height:${H}px;padding:70px 96px 66px;display:flex;flex-direction:column;background:var(--paper);color:var(--ink);font-family:Body}
.s:after{content:"";position:absolute;inset:0;background:${GRAIN};opacity:.09;mix-blend-mode:multiply;pointer-events:none}
.top,.foot{display:flex;justify-content:space-between;align-items:center;font-family:Mono;font-size:30px;letter-spacing:.1em;color:var(--mute)}
.top{padding-bottom:24px;border-bottom:2px solid var(--rule)}
.foot{padding-top:22px;border-top:2px solid var(--rule)}
.brand{font-family:Logo;font-weight:800;font-size:44px;letter-spacing:-.045em;color:var(--ink)}
.brand i{font-style:normal;color:var(--red)}
.brand span{font-family:Logo;font-weight:600;font-size:17px;letter-spacing:.34em;color:var(--mute);margin-left:12px;vertical-align:7px}
.main{flex:1;display:flex;flex-direction:column;justify-content:center}
.h{font-family:Logo;font-weight:800;letter-spacing:-.034em;line-height:1.02;color:var(--ink)}
.it{font-family:Serif;font-style:italic;font-weight:400;font-size:1.13em;letter-spacing:-.005em;line-height:.9}
.num{font-family:Serif;font-style:italic;color:var(--red);line-height:.74;letter-spacing:-.02em}
.kick{font-family:Mono;font-size:32px;letter-spacing:.16em;text-transform:uppercase;color:var(--red)}
.body{font-weight:500;font-size:38px;line-height:1.42;color:var(--soft);margin-top:30px;max-width:870px}
.card{background:var(--card);border:2px solid var(--rule);border-radius:26px;box-shadow:0 26px 50px -28px rgba(70,45,25,.28)}
.lab{font-family:Mono;font-size:30px;letter-spacing:.1em;text-transform:uppercase;color:var(--mute)}
.bad{color:var(--red)}
/* sign slides */
.nrow{display:flex;align-items:flex-end;gap:30px}
.nrow .num{font-size:236px;margin-left:-6px}
.nrow .meta{padding-bottom:22px;display:flex;flex-direction:column;gap:14px}
.pill{display:inline-block;font-family:Mono;font-size:30px;letter-spacing:.1em;text-transform:uppercase;color:var(--red);border:2px solid var(--red);border-radius:40px;padding:8px 22px 6px}
.vig{margin-top:44px}
/* checklist */
.li{display:flex;align-items:center;gap:30px;font-family:Logo;font-weight:600;font-size:52px;letter-spacing:-.02em;padding:22px 0;border-bottom:2px solid var(--rule)}
.li:first-child{border-top:2px solid var(--rule)}
.cb{width:60px;height:60px;border-radius:12px;background:var(--ink);color:var(--paper);display:flex;align-items:center;justify-content:center;font-family:Body;font-weight:700;font-size:36px;flex:none}
`;

const top = (n) => `<div class="top"><div class="brand">mez<i>.</i><span>MEDIA</span></div><div>${String(n).padStart(2, '0')} / ${String(TOTAL).padStart(2, '0')}</div></div>`;
const foot = (n) => `<div class="foot"><div>@mezmedia_0</div><div style="color:var(--ink)">${n === TOTAL ? 'SAVE THIS ↓' : 'SWIPE →'}</div></div>`;
const slide = (n, inner) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="s">${top(n)}<div class="main">${inner}</div>${foot(n)}</div></body></html>`;

// a sign slide: big numeral, the claim, one line of why, and a small illustrative card
const sign = (n, head, body, vig, extra = '') => slide(n + 1, `
  <div class="nrow"><div class="num">${n}</div><div class="meta"><div class="kick">Sign #${n}</div>${extra}</div></div>
  <div class="h" style="font-size:80px;margin-top:30px">${head}</div>
  <div class="body">${body}</div>
  <div class="vig">${vig}</div>`);

const line = (pts, color) => `<svg width="430" height="84" viewBox="0 0 430 84"><polyline points="${pts}" fill="none" style="stroke:${color}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const V1 = `<div class="card" style="padding:34px 40px">
  ${[['Clicks', '6,74 66,66 126,68 186,50 246,44 306,30 366,22 424,8', 'var(--ink)', '▲'], ['Customers', '6,46 66,47 126,45 186,47 246,46 306,47 366,45 424,46', 'var(--red)', '—']].map(([lab, pts, c, mark], i) => `
  <div style="display:flex;align-items:center;gap:26px;${i ? 'margin-top:26px;padding-top:26px;border-top:2px solid var(--rule)' : ''}">
    <div class="lab" style="width:236px">${lab}</div>${line(pts, c)}<div style="font-family:Body;font-weight:700;font-size:38px;color:${c};margin-left:auto">${mark}</div></div>`).join('')}
</div>`;

const V2 = `<div class="card" style="padding:28px 40px 18px">
  <div class="lab" style="margin-bottom:8px">New enquiries</div>
  ${[['Outside your area', 0], ['Just price-checking', 0], ['Wrong budget', 0], ['Ideal customer', 1]].map(([t, ok]) => `
  <div style="display:flex;align-items:center;gap:22px;padding:13px 0;border-top:2px solid var(--rule)">
    <div style="width:46px;height:46px;border-radius:50%;background:${ok ? 'var(--ink)' : 'var(--back)'}"></div>
    <div style="font-weight:${ok ? 700 : 500};font-size:34px;color:${ok ? 'var(--ink)' : 'var(--soft)'}">${t}</div>
    <div style="margin-left:auto;font-weight:700;font-size:36px;color:${ok ? 'var(--ink)' : 'var(--red)'}">${ok ? '✓' : '✕'}</div></div>`).join('')}
</div>`;

const offerCard = (who, style, strong) => `<div class="card" style="position:absolute;left:0;right:0;height:104px;padding:0 34px;display:flex;align-items:center;gap:24px;${style}">
  <div class="lab" style="width:92px;flex:none;color:${strong ? 'var(--ink)' : 'var(--mute)'}">${who}</div>
  <div style="white-space:nowrap;font-weight:${strong ? 600 : 500};font-size:31px;color:${strong ? 'var(--ink)' : 'var(--mute)'}">“High-quality service at affordable prices.”</div></div>`;
const V3 = `<div style="position:relative;height:272px">
  ${offerCard('Them', 'top:0;transform:scale(.93) rotate(-1.4deg);background:var(--back);box-shadow:none')}
  ${offerCard('Them', 'top:84px;transform:scale(.965) rotate(.9deg);background:#EFE9DF')}
  ${offerCard('You', 'top:168px', true)}
</div>`;

const V4 = `<div class="card" style="padding:28px 40px 16px">
  <div style="display:flex;align-items:center;gap:18px;margin-bottom:10px">
    <div style="width:18px;height:18px;border-radius:50%;background:var(--red)"></div>
    <div style="font-family:Logo;font-weight:800;font-size:40px;letter-spacing:-.02em">New lead</div>
    <div class="lab" style="margin-left:auto">Mon 09:02</div></div>
  ${[['First reply', '2 days later'], ['Follow-up', 'None'], ['Sale tracked', 'No']].map(([k, v]) => `
  <div style="display:flex;align-items:center;padding:11px 0;border-top:2px solid var(--rule);font-size:34px">
    <div style="font-weight:500;color:var(--soft)">${k}</div><div style="margin-left:auto;font-weight:700;color:var(--red)">${v}</div></div>`).join('')}
</div>`;

const V5 = `<div class="card" style="padding:26px 40px 14px">
  <div style="display:flex;justify-content:space-between;margin-bottom:6px"><div class="lab">Campaign</div><div class="lab">Testing</div></div>
  ${[['Campaign_v3_FINAL', 0], ['Campaign_v4_new', 0], ['Campaign_v5_test', 0], ['Campaign_v6_FINAL_real', 1]].map(([t, on]) => `
  <div style="display:flex;align-items:center;gap:20px;padding:9px 0;border-top:2px solid var(--rule)">
    <div style="width:16px;height:16px;border-radius:50%;background:${on ? 'var(--ink)' : 'var(--rule)'}"></div>
    <div style="font-family:Mono;font-size:31px;color:${on ? 'var(--ink)' : 'var(--mute)'}">${t}</div>
    <div style="margin-left:auto;font-family:Serif;font-style:italic;font-size:48px;line-height:1;color:var(--red)">?</div></div>`).join('')}
</div>`;

const slides = [
  slide(1, `
    <div style="padding:0 24px">
    <div class="num" style="font-size:560px;line-height:.82;margin:0 0 34px -4px">5</div>
    <div class="h" style="font-size:108px">signs your Meta Ads might be <span style="background:linear-gradient(var(--red),var(--red)) 0 94%/100% 12px no-repeat;padding-bottom:4px">wasting money.</span></div>
    <div style="display:flex;align-items:center;gap:22px;margin-top:52px">
      <div style="font-family:Serif;font-style:italic;font-size:60px;line-height:1;color:var(--ink)">Number 4 gets overlooked.</div>
      <div style="font-family:Body;font-weight:500;font-size:46px;color:var(--red)">→</div></div></div>`),
  sign(1, 'You’re celebrating clicks, not <span class="it">customers.</span>',
    'Traffic is only useful when it helps move the right people toward your business goal.', V1),
  sign(2, 'You’re attracting the <span class="it">wrong leads.</span>',
    'Lots of enquiries mean little if they don’t fit your ideal customer profile.', V2),
  sign(3, 'Your offer sounds like <span class="it">everyone else’s.</span>',
    '“High-quality service at affordable prices” isn’t a compelling reason to choose you.', V3),
  sign(4, 'Nobody knows what happens <span class="it">after</span> a lead comes in.',
    'Slow responses, poor follow-up, and missing sales tracking can waste opportunities.', V4, '<div><span class="pill">Most overlooked</span></div>'),
  sign(5, 'You keep changing campaigns without a clear <span class="it">hypothesis.</span>',
    'If you don’t know what you’re testing, you’ll struggle to learn from the results.', V5),
  slide(7, `
    <div class="kick">Your next move</div>
    <div class="h" style="font-size:94px;margin-top:24px">Before spending more, <span class="it">audit:</span></div>
    <div style="margin-top:46px">${['Your offer', 'Your creative', 'Your lead quality', 'Your follow-up process', 'Your conversion tracking'].map((t) => `<div class="li"><div class="cb">✓</div>${t}</div>`).join('')}</div>
    <div style="display:flex;align-items:center;gap:24px;margin-top:50px">
      <svg width="42" height="56" viewBox="0 0 42 56" style="flex:none"><path d="M3 3h36v50L21 40 3 53z" style="fill:var(--red)"/></svg>
      <div style="font-family:Serif;font-style:italic;font-size:52px;line-height:1.08">Save this checklist for your next campaign review.</div></div>`),
];

(async () => {
  const dir = path.join(OUT, 'post4_signs');
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  const pg = await browser.newPage({ viewport: { width: W, height: H } });
  for (let i = 0; i < slides.length; i++) {
    await pg.setContent(slides[i], { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    // fail loudly if anything spills past the canvas or the main area overflows into the footer
    const bad = await pg.evaluate(() => {
      const m = document.querySelector('.main'), f = document.querySelector('.foot'), mr = m.scrollHeight > m.clientHeight + 1;
      const out = [...document.querySelectorAll('.s *')].filter((e) => { const r = e.getBoundingClientRect(); return r.right > innerWidth - 40 || r.left < 40; }).length;
      return { mainOverflow: mr, nearEdge: out, footTop: Math.round(f.getBoundingClientRect().top) };
    });
    if (bad.mainOverflow || bad.nearEdge) console.warn('CHECK', i + 1, JSON.stringify(bad));
    await pg.screenshot({ path: path.join(dir, `post4_signs_${String(i + 1).padStart(2, '0')}.png`) });
  }
  await browser.close();
  console.log('rendered', slides.length, 'slides to', dir);
})();
