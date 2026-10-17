// Mez Media post system v3: bold hook typography on flat light backgrounds.
// Usage: node build_v3.js <out-dir>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2];
const FONTS = path.join(__dirname, 'fonts');
const font = (f) => `url(data:font/ttf;base64,${fs.readFileSync(path.join(FONTS, f)).toString('base64')})`;

const W = 1080;
const CSS = (h) => `
@font-face{font-family:Hook;font-weight:700;src:${font('Archivo-700.ttf')}}
@font-face{font-family:Hook;font-weight:800;src:${font('Archivo-800.ttf')}}
@font-face{font-family:Hook;font-weight:900;src:${font('Archivo-900.ttf')}}
@font-face{font-family:Body;font-weight:400;src:${font('Inter-400.ttf')}}
@font-face{font-family:Body;font-weight:500;src:${font('Inter-500.ttf')}}
@font-face{font-family:Body;font-weight:600;src:${font('Inter-600.ttf')}}
@font-face{font-family:Body;font-weight:700;src:${font('Inter-700.ttf')}}
:root{--bg:#F7F9F8;--ink:#0F2A3A;--green:#14B07F;--tint:#E3F5ED;--muted:#71818B;--line:#DDE6E2;--loss:#F6D9D2}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${h}px;overflow:hidden;background:var(--bg)}
.s{width:${W}px;height:${h}px;padding:76px 84px 72px;display:flex;flex-direction:column;background:var(--bg);color:var(--ink);font-family:Body}
.top{display:flex;justify-content:space-between;align-items:center}
.logo{font-family:Hook;font-weight:900;font-size:40px;letter-spacing:-.04em}
.logo i{font-style:normal;color:var(--green)}
.logo span{font-family:Body;font-weight:700;font-size:14px;letter-spacing:.32em;color:var(--muted);margin-left:10px;vertical-align:4px}
.handle{font-weight:600;font-size:20px;color:var(--muted)}
.main{flex:1;display:flex;flex-direction:column;justify-content:center}
.label{display:flex;align-items:center;gap:16px;font-weight:700;font-size:22px;letter-spacing:.16em;text-transform:uppercase;color:var(--green)}
.label:before{content:"";width:36px;height:4px;background:var(--green)}
.hook{font-family:Hook;font-weight:900;text-transform:uppercase;line-height:.92;letter-spacing:-.025em;color:var(--ink)}
.mark{background:var(--green);color:#fff;padding:0 .1em;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.g{color:var(--green)}
.sub{font-weight:500;font-size:32px;line-height:1.4;color:var(--muted)}
.foot{display:flex;justify-content:space-between;align-items:center}
.dots{display:flex;gap:10px}.dots b{width:12px;height:12px;border-radius:50%;background:var(--line)}.dots b.on{background:var(--ink);width:36px;border-radius:6px}
.swipe{font-weight:700;font-size:20px;letter-spacing:.16em;color:var(--ink)}
.row{display:flex;align-items:baseline;border-top:2px solid var(--line);padding:30px 0}
.num{font-family:Hook;font-weight:900;color:var(--green)}
`;

const top = `<div class="top"><div class="logo">mez<i>.</i><span>MEDIA</span></div><div class="handle">@mezmedia_0</div></div>`;
const foot = (n, total) => `<div class="foot"><div class="dots">${Array.from({ length: total }, (_, i) => `<b class="${i === n - 1 ? 'on' : ''}"></b>`).join('')}</div>
  <div class="swipe">${n === total ? 'SAVE THIS ✓' : 'SWIPE →'}</div></div>`;
const page = (h, inner) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS(h)}</style></head><body><div class="s">${inner}</div></body></html>`;
const slide = (n, total, body) => page(1350, `${top}<div class="main">${body}</div>${foot(n, total)}`);

const posts = {};

// ---------------- POST 1: Introducing Mez Media ----------------
posts.post1_intro = [
  slide(1, 4, `
    <div class="label">New here</div>
    <div class="hook" style="font-size:128px;margin-top:40px">Ads that win the first <span class="mark">half second.</span></div>
    <div class="sub" style="margin-top:44px;width:760px">Meta &amp; TikTok ads for UK skincare brands.</div>
    <div style="display:flex;align-items:flex-end;gap:24px;margin-top:70px">
      <div class="num" style="font-size:210px;line-height:.8;letter-spacing:-.04em">0.5s</div>
      <div style="font-weight:600;font-size:24px;color:var(--muted);line-height:1.35;padding-bottom:8px">is all the time an ad<br>gets before the scroll.</div>
    </div>`),
  slide(2, 4, `
    <div class="label">What I do</div>
    <div class="hook" style="font-size:112px;margin-top:36px">4 things.<br><span class="g">Done properly.</span></div>
    <div style="margin-top:56px">
      ${[['01', 'Meta Ads', 'Setup, testing &amp; scaling'], ['02', 'TikTok Ads', 'Native, creator-style ads'], ['03', 'Creative', 'Hooks, scripts &amp; briefs'], ['04', 'Tracking', 'Pixel &amp; Conversions API']]
        .map(([n, t, d]) => `<div class="row" style="padding:26px 0"><div class="num" style="font-size:34px;width:86px">${n}</div>
          <div class="hook" style="font-size:54px;flex:1">${t}</div><div style="font-weight:500;font-size:25px;color:var(--muted)">${d}</div></div>`).join('')}
    </div>`),
  slide(3, 4, `
    <div class="label">Who it's for</div>
    <div class="hook" style="font-size:118px;margin-top:36px">Built for UK <span class="mark">skincare</span> brands.</div>
    <div style="margin-top:56px">
      ${['You sell online (Shopify or similar)', 'People already love your product', 'You want more customers, not guesses', "You're ready to test ads properly"]
        .map((t) => `<div class="row" style="align-items:center;padding:26px 0"><div style="width:44px;height:44px;background:var(--green);display:flex;align-items:center;justify-content:center;margin-right:30px">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="square"><path d="M4.5 12.5l4.5 4.5L19.5 7"/></svg></div>
          <div style="font-weight:600;font-size:34px;color:var(--ink)">${t}</div></div>`).join('')}
    </div>`),
  slide(4, 4, `
    <div class="label">How it starts</div>
    <div class="hook" style="font-size:112px;margin-top:36px">3 simple steps.</div>
    <div style="display:flex;gap:30px;margin-top:60px">
      ${[['1', 'Free ad teardown', '2-min video on your current ads'], ['2', '30-day pilot', 'Creative, setup, weekly reports'], ['3', 'Scale', 'Keep the winners, cut the rest']]
        .map(([n, t, d]) => `<div style="flex:1;border-top:6px solid ${n === '1' ? 'var(--green)' : 'var(--ink)'};padding-top:26px">
          <div class="num" style="font-size:120px;line-height:.9;color:${n === '1' ? 'var(--green)' : 'var(--ink)'}">${n}</div>
          <div class="hook" style="font-size:38px;margin-top:20px;line-height:1">${t}</div>
          <div style="font-weight:500;font-size:23px;color:var(--muted);margin-top:14px;line-height:1.4">${d}</div></div>`).join('')}
    </div>
    <div style="margin-top:80px;display:flex;align-items:center;gap:30px">
      <div class="hook mark" style="font-size:76px;padding:14px 28px">DM “TEARDOWN”</div>
      <div style="font-weight:600;font-size:26px;color:var(--muted);line-height:1.35">to get<br>yours free</div>
    </div>`),
];

// ---------------- POST 2: Break-even ROAS ----------------
posts.post2_roas = [
  slide(1, 6, `
    <div class="label">Ads maths</div>
    <div class="hook" style="font-size:134px;margin-top:40px">Your ROAS target is probably <span class="mark">wrong.</span></div>
    <div class="sub" style="margin-top:50px;width:820px">The 10-second maths every skincare brand should know before spending another £1.</div>`),
  slide(2, 6, `
    <div class="label">The formula</div>
    <div class="hook" style="font-size:64px;margin-top:36px;color:var(--muted)">Break-even ROAS =</div>
    <div class="hook" style="font-size:196px;margin-top:20px;letter-spacing:-.04em;line-height:.88">1 <span class="g">÷</span><br>margin</div>
    <div class="sub" style="margin-top:56px;width:820px">Margin = what's left of each sale after product, shipping &amp; fees.</div>`),
  slide(3, 6, `
    <div class="label">Example</div>
    <div class="hook" style="font-size:112px;margin-top:36px">A £30 facial oil.</div>
    <div style="margin-top:50px">
      ${[['Sale price', '£30'], ['Product cost', '−£5'], ['Shipping', '−£3'], ['Fees', '−£1']]
        .map(([l, r]) => `<div class="row" style="justify-content:space-between;padding:22px 0"><div style="font-weight:500;font-size:32px;color:var(--muted)">${l}</div><div class="hook" style="font-size:44px;color:var(--muted)">${r}</div></div>`).join('')}
      <div class="row" style="justify-content:space-between;align-items:center;border-top:4px solid var(--ink);padding:30px 0 0">
        <div class="hook" style="font-size:52px">Margin</div><div class="hook mark" style="font-size:120px;padding:4px 22px">70%</div></div>
    </div>`),
  slide(4, 6, `
    <div class="label">Your break-even</div>
    <div class="hook" style="font-size:66px;margin-top:36px;color:var(--muted)">1 ÷ 0.70 =</div>
    <div class="num" style="font-size:330px;line-height:.86;letter-spacing:-.05em;margin-top:10px">1.43</div>
    <div style="margin-top:60px">
      <div style="display:flex;height:84px">
        <div style="width:36%;background:var(--loss);display:flex;align-items:center;padding-left:26px;font-weight:700;font-size:24px;letter-spacing:.14em;color:#B5523F">LOSS</div>
        <div style="width:6px;background:var(--ink)"></div>
        <div style="flex:1;background:var(--tint);display:flex;align-items:center;justify-content:flex-end;padding-right:26px;font-weight:700;font-size:24px;letter-spacing:.14em;color:#0E8F67">PROFIT</div>
      </div>
    </div>
    <div class="sub" style="margin-top:40px">Below 1.43, every first order <b style="color:var(--ink)">loses money.</b></div>`),
  slide(5, 6, `
    <div class="label">The fix</div>
    <div class="hook" style="font-size:132px;margin-top:36px">Sell the <span class="mark">set.</span><br><span style="color:var(--muted)">Not the single.</span></div>
    <div style="display:flex;gap:30px;margin-top:64px;align-items:flex-end">
      <div style="flex:1;border-top:6px solid var(--line);padding-top:22px"><div style="font-weight:700;font-size:22px;letter-spacing:.14em;color:var(--muted)">SINGLE ITEM</div><div class="hook" style="font-size:130px;color:#B9C6CC;margin-top:10px">£30</div></div>
      <div style="flex:1;border-top:6px solid var(--green);padding-top:22px"><div style="font-weight:700;font-size:22px;letter-spacing:.14em;color:var(--green)">ROUTINE SET</div><div class="hook" style="font-size:130px;margin-top:10px">£55</div></div>
    </div>
    <div class="sub" style="margin-top:40px">Same cost to win the customer. <b style="color:var(--ink)">Bigger basket, more profit.</b></div>`),
  slide(6, 6, `
    <div class="label">Your turn</div>
    <div class="hook" style="font-size:140px;margin-top:36px">Want your number?</div>
    <div class="sub" style="margin-top:44px;width:800px">Comment the word below and I'll work out your break-even ROAS.</div>
    <div style="margin-top:70px"><span class="hook mark" style="font-size:190px;padding:10px 40px;display:inline-block">ROAS</span></div>`),
];

// ---------------- POST 3: 3 things I check ----------------
const check = (n, t, q, look, visual) => `
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div class="label">Check ${n} of 3</div>
      <div class="num" style="font-size:150px;line-height:.75;letter-spacing:-.04em">0${n}</div>
    </div>
    <div class="hook" style="font-size:118px;margin-top:30px">${t}</div>
    <div style="margin-top:50px">${visual}</div>
    <div style="font-family:Body;font-weight:700;font-size:44px;line-height:1.2;color:var(--ink);margin-top:56px">${q}</div>
    <div class="sub" style="margin-top:18px">${look}</div>`;
posts.post3_checks = [
  slide(1, 5, `
    <div class="label">Skincare ad teardown</div>
    <div class="hook" style="font-size:132px;margin-top:40px">3 things I check in <span class="mark" style="white-space:nowrap">every ad.</span></div>
    <div style="margin-top:60px">${['The first 2 seconds', 'The offer', 'The click'].map((t, i) => `<div class="row" style="padding:20px 0;align-items:center"><div class="num" style="font-size:32px;width:80px">0${i + 1}</div><div style="font-weight:600;font-size:32px">${t}</div></div>`).join('')}</div>`),
  slide(2, 5, check(1, 'The first <span class="mark">2 seconds.</span>', 'Is there a reason to stop scrolling?', 'Movement, texture, a face, or one bold line of text.',
    `<div style="display:flex;align-items:center;gap:18px">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `<div style="flex:1;height:22px;background:${i < 2 ? 'var(--green)' : 'var(--line)'}"></div>`).join('')}</div>
     <div style="display:flex;justify-content:space-between;margin-top:14px;font-weight:700;font-size:20px;letter-spacing:.12em;color:var(--muted)"><span class="g">0–2s: DECIDED</span><span>10s</span></div>`)),
  slide(3, 5, check(2, 'The <span class="mark">offer.</span>', 'Is one £25 product carrying the whole ad cost?', 'A set or bundle often works harder for the same click.',
    `<div style="display:flex;align-items:center;gap:36px"><div class="hook" style="font-size:120px;color:#B9C6CC;text-decoration:line-through;text-decoration-thickness:8px;text-decoration-color:var(--ink)">£25</div>
      <div class="hook g" style="font-size:90px">→</div><div class="hook" style="font-size:120px">£48 <span style="font-size:48px;color:var(--muted)">SET</span></div></div>`)),
  slide(4, 5, check(3, 'The <span class="mark">click.</span>', 'Does the page match the ad?', 'Same product, same promise, same look.',
    `<div style="display:flex;align-items:center;gap:30px"><div style="flex:1;border:4px solid var(--ink);padding:26px 30px"><div style="font-weight:700;font-size:20px;letter-spacing:.14em;color:var(--muted)">THE AD</div><div class="hook" style="font-size:44px;margin-top:8px;white-space:nowrap">Glow serum</div></div>
      <div class="hook g" style="font-size:90px">=</div>
      <div style="flex:1;border:4px solid var(--green);padding:26px 30px"><div style="font-weight:700;font-size:20px;letter-spacing:.14em;color:var(--green)">THE PAGE</div><div class="hook" style="font-size:44px;margin-top:8px;white-space:nowrap">Glow serum</div></div></div>`)),
  slide(5, 5, `
    <div class="label">Free</div>
    <div class="hook" style="font-size:140px;margin-top:36px">Want me to check yours?</div>
    <div class="sub" style="margin-top:44px;width:820px">A free 2-minute video teardown of your ads, with 3 tests I'd run next.</div>
    <div style="margin-top:70px"><span class="hook mark" style="font-size:92px;padding:14px 30px;display:inline-block;white-space:nowrap">DM “TEARDOWN”</span></div>`),
];

// ---------------- Launch reel cover ----------------
const reel = page(1920, `${top}<div class="main" style="justify-content:center">
  <div class="label">Launch</div>
  <div class="hook" style="font-size:176px;margin-top:44px">You have <span class="mark">half a second.</span></div>
  <div class="sub" style="margin-top:56px;width:820px">Mez Media makes ads that win it. Meta &amp; TikTok ads for UK skincare brands.</div>
  </div><div class="foot"><div class="num" style="font-size:44px">0.5s</div><div class="swipe">WATCH ▶</div></div>`);

(async () => {
  const browser = await chromium.launch();
  const pg = await browser.newPage();
  const shot = async (html, file, h) => {
    await pg.setViewportSize({ width: W, height: h });
    await pg.setContent(html, { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    // Fail loudly if anything spills past the canvas
    const over = await pg.evaluate(() => [...document.querySelectorAll('.s *')].filter((e) => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || e.scrollWidth > e.clientWidth + 1; }).length);
    if (over) console.warn('OVERFLOW', file, over);
    await pg.screenshot({ path: file });
  };
  for (const [name, list] of Object.entries(posts)) {
    fs.mkdirSync(path.join(OUT, name), { recursive: true });
    for (let i = 0; i < list.length; i++) await shot(list[i], path.join(OUT, name, `${name}_${String(i + 1).padStart(2, '0')}.png`), 1350);
  }
  await shot(reel, path.join(OUT, 'launch_reel_cover.png'), 1920);
  await browser.close();
  console.log('rendered');
})();
