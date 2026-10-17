const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2];
const CSS = fs.readFileSync(path.join(__dirname, 'base.css'), 'utf8');
const HANDLE = '@mezmedia_0';

const top = `<div class="top"><div class="logo"><b>mez<i>.</i></b><span>MEDIA</span></div><div class="handle">${HANDLE}</div></div>`;
const bottom = (n, total, last) => `<div class="bottom"><div class="count">${String(n).padStart(2, '0')} / ${String(total).padStart(2, '0')}</div>${
  last ? `<div class="swipe" style="background:var(--accent)">Save this ✓</div>` : `<div class="swipe">Swipe <span style="font-size:30px">→</span></div>`}</div>`;
const page = (inner, cls = '') => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="s ${cls}"><div class="glow g1"></div><div class="glow g2"></div>${inner}</div></body></html>`;
const slide = (n, total, body, last = false) => page(`${top}<div class="main">${body}</div>${bottom(n, total, last)}`);

// Generic phone + ad mockup (no real brand)
const phone = (badge = '0.5s', w = 400) => `
<div style="width:${w}px;height:${w * 1.9}px;border-radius:${w * 0.13}px;background:#fff;border:3px solid var(--line);box-shadow:0 40px 80px rgba(18,48,71,.14);padding:${w * 0.05}px;position:relative">
  <div style="display:flex;align-items:center;gap:14px;padding:10px 6px 16px">
    <div style="width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,var(--mint),var(--sky))"></div>
    <div><div style="width:150px;height:13px;border-radius:7px;background:#DDE7E5"></div><div style="font-size:17px;color:var(--muted);margin-top:7px;font-weight:600">Sponsored</div></div>
  </div>
  <div style="height:${w * 1.12}px;border-radius:26px;background:linear-gradient(160deg,#E9F8F3,#DCEBFF);position:relative;overflow:hidden;display:flex;align-items:flex-end;justify-content:center;gap:22px;padding-bottom:50px">
    <div style="width:${w * 0.2}px;height:${w * 0.48}px;border-radius:22px 22px 18px 18px;background:linear-gradient(180deg,#fff,#EAF4F2);box-shadow:0 18px 30px rgba(18,48,71,.12);position:relative"><div style="position:absolute;top:-34px;left:25%;width:50%;height:40px;border-radius:10px 10px 4px 4px;background:var(--ink)"></div><div style="position:absolute;top:42%;left:18%;width:64%;height:30px;border-radius:6px;background:var(--mint)"></div></div>
    <div style="width:${w * 0.28}px;height:${w * 0.2}px;border-radius:20px;background:linear-gradient(180deg,#fff,#EAF4F2);box-shadow:0 18px 30px rgba(18,48,71,.12);position:relative"><div style="position:absolute;top:-22px;left:8%;width:84%;height:28px;border-radius:12px;background:var(--accent)"></div></div>
  </div>
  <div style="padding:22px 6px 0"><div style="width:85%;height:13px;border-radius:7px;background:#DDE7E5"></div><div style="width:60%;height:13px;border-radius:7px;background:#DDE7E5;margin-top:12px"></div></div>
  <div style="position:absolute;left:${w * 0.05}px;right:${w * 0.05}px;bottom:${w * 0.06}px;height:66px;border-radius:18px;background:var(--ink);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:24px">Shop now</div>
  ${badge ? `<div style="position:absolute;right:-46px;top:${w * 0.42}px;background:var(--accent);color:#fff;font-weight:800;font-size:40px;border-radius:24px;padding:20px 26px;box-shadow:0 20px 40px rgba(31,191,143,.35)">${badge}</div>` : ''}
</div>`;

const icon = {
  meta: '<path d="M4 16c0-5 2.5-9 5.5-9 3.6 0 5 9 8.2 9 1.7 0 2.3-1.6 2.3-3.5C20 9 18.4 7 16.5 7c-3 0-4.7 9-8.2 9C6 16 4 15 4 13" />',
  tiktok: '<path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5" /><path d="M14 4c.5 2.6 2.4 4.3 5 4.5" />',
  pen: '<path d="M4 20l4-1 11-11-3-3L5 16z" /><path d="M14 6l3 3" />',
  target: '<circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r=".8" />',
};
const ico = (k) => `<div style="width:78px;height:78px;border-radius:22px;background:var(--mint);display:flex;align-items:center;justify-content:center"><svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#0E8F69" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon[k]}</svg></div>`;
const check = `<div style="flex:none;width:56px;height:56px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>`;

const slides = {};

// ---------- POST 1: Introducing Mez Media (4) ----------
slides['post1_intro'] = [
  page(`${top}
  <div class="main" style="flex-direction:row;align-items:center;gap:40px">
    <div style="flex:1">
      <div class="kicker">NEW HERE</div>
      <h1 style="font-size:104px">Ads that win the <span class="hl">first half second.</span></h1>
      <p class="lead">Meta &amp; TikTok ads for UK skincare brands.</p>
    </div>
    <div style="flex:none;margin-right:40px">${phone('0.5s', 330)}</div>
  </div>${bottom(1, 4)}`),
  slide(2, 4, `
    <div class="kicker">WHAT MEZ MEDIA DOES</div>
    <h2>Four things, done properly.</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:40px">
      ${[['meta', 'Meta Ads', 'Campaign setup, testing and scaling on Facebook &amp; Instagram.'],
         ['tiktok', 'TikTok Ads', 'Native, creator-style ads that fit the feed.'],
         ['pen', 'Creative strategy', 'Hooks, scripts and briefs built to stop the scroll.'],
         ['target', 'Tracking', 'Pixel &amp; Conversions API checks, so every sale is counted.']]
        .map(([k, t, d]) => `<div class="card" style="padding:32px 34px">${ico(k)}<div style="font-weight:800;font-size:38px;letter-spacing:-1px;margin-top:22px">${t}</div><div style="font-size:25px;line-height:1.4;color:var(--muted);margin-top:12px;font-weight:500">${d}</div></div>`).join('')}
    </div>`),
  slide(3, 4, `
    <div class="kicker">WHO IT'S FOR</div>
    <h2>Built for UK <span class="hl">skincare</span> &amp; beauty brands.</h2>
    <div class="card" style="margin-top:56px;padding:20px 48px">
      ${['You sell online, on Shopify or similar', 'You have a product people already love', 'You want more customers, without guessing', 'You are ready to test ads properly']
        .map((t, i) => `<div style="display:flex;align-items:center;gap:30px;padding:30px 0;${i ? 'border-top:2px solid var(--line)' : ''}">${check}<div style="font-size:36px;font-weight:600;letter-spacing:-.5px">${t}</div></div>`).join('')}
    </div>`),
  slide(4, 4, `
    <div class="kicker">HOW IT STARTS</div>
    <h2>Three simple steps.</h2>
    <div style="display:flex;flex-direction:column;gap:20px;margin-top:40px">
      ${[['01', 'Free ad teardown', 'A 2-minute video on your current ads: what works and what to test.'],
         ['02', '30-day pilot', 'Creative, campaign setup, weekly reports. Clear numbers, no guesswork.'],
         ['03', 'Scale what works', 'Double down on the winners. Cut the rest.']]
        .map(([n, t, d]) => `<div class="card" style="padding:28px 40px;display:flex;gap:32px;align-items:center"><div style="font-weight:800;font-size:64px;color:var(--accent);letter-spacing:-2px;width:100px">${n}</div><div><div style="font-weight:800;font-size:40px;letter-spacing:-1px">${t}</div><div style="font-size:27px;color:var(--muted);margin-top:8px;font-weight:500;line-height:1.4">${d}</div></div></div>`).join('')}
    </div>
    <div style="margin-top:36px;display:flex;align-items:center;gap:24px"><div class="pill" style="font-size:34px;padding:22px 38px">DM "TEARDOWN"</div><div style="font-size:30px;color:var(--muted);font-weight:600">to get yours free</div></div>`, true),
];

// ---------- POST 2: Break-even ROAS (6) ----------
const row = (l, r, strong) => `<div style="display:flex;justify-content:space-between;padding:26px 0;border-top:2px dashed var(--line);font-size:38px;${strong ? 'font-weight:800' : 'font-weight:600;color:var(--muted)'}"><span>${l}</span><span>${r}</span></div>`;
slides['post2_roas'] = [
  page(`${top}<div class="main">
    <div class="kicker">ADS MATHS</div>
    <h1>Your ROAS target is probably <span class="hl">wrong.</span></h1>
    <p class="lead">The 10-second maths every skincare brand should know before spending another £1 on ads.</p>
    <div style="display:flex;gap:24px;margin-top:60px">
      ${['ROAS 2.0?', 'ROAS 3.0?', 'ROAS 4.0?'].map((t, i) => `<div class="card" style="padding:28px 36px;font-weight:800;font-size:40px;${i === 1 ? 'transform:rotate(-3deg)' : i === 2 ? 'transform:rotate(2deg)' : ''};color:${i === 2 ? 'var(--accent-dk)' : 'var(--ink)'}">${t}</div>`).join('')}
    </div></div>${bottom(1, 6)}`),
  slide(2, 6, `
    <div class="kicker">THE FORMULA</div>
    <h2>First, find your break&#8209;even.</h2>
    <div class="card" style="margin-top:60px;padding:70px 60px;text-align:center">
      <div style="font-size:34px;font-weight:700;color:var(--muted);letter-spacing:2px">BREAK-EVEN ROAS</div>
      <div style="font-size:150px;font-weight:800;letter-spacing:-6px;margin-top:20px">1 <span class="acc">÷</span> margin</div>
      <div style="font-size:30px;color:var(--muted);margin-top:24px;font-weight:500">margin = what's left after product, shipping &amp; fees</div>
    </div>`),
  slide(3, 6, `
    <div class="kicker">EXAMPLE</div>
    <h2>A £30 facial oil.</h2>
    <div class="card" style="margin-top:56px;padding:30px 56px 20px">
      ${row('Sale price', '£30.00')}${row('Product cost', '−£5.00')}${row('Shipping &amp; packaging', '−£3.00')}${row('Payment fees', '−£1.00')}${row('What\'s left', '£21.00', true)}
      <div style="display:flex;justify-content:space-between;align-items:center;padding:26px 0 18px;border-top:3px solid var(--ink)"><span style="font-size:38px;font-weight:800">Margin</span><span class="pill" style="font-size:44px;padding:12px 32px">70%</span></div>
    </div>`),
  slide(4, 6, `
    <div class="kicker">THE ANSWER</div>
    <h2>1 ÷ 0.70 = <span class="acc">1.43</span></h2>
    <p class="lead">Below a ROAS of 1.43, every first order loses money. Above it, you're profitable.</p>
    <div style="margin-top:170px">
      <div style="position:relative;height:56px;border-radius:999px;background:linear-gradient(90deg,#FFD8D2 0%,#FFE9C7 40%,#C9F1E2 60%,#9FE6CF 100%)">
        <div style="position:absolute;left:36%;top:-26px;width:6px;height:108px;border-radius:3px;background:var(--ink)"></div>
        <div style="position:absolute;left:36%;top:-96px;transform:translateX(-50%);background:var(--ink);color:#fff;font-weight:800;font-size:30px;border-radius:16px;padding:12px 22px">1.43</div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:38px;font-size:30px;font-weight:700"><span style="color:#C2523F">Losing money</span><span style="color:var(--accent-dk)">Profitable</span></div>
    </div>`),
  slide(5, 6, `
    <div class="kicker">THE FIX</div>
    <h2>Sell the <span class="hl">set,</span> not the single.</h2>
    <div style="display:flex;gap:28px;margin-top:56px">
      <div class="card" style="flex:1;padding:44px 40px"><div style="font-size:26px;font-weight:700;color:var(--muted);letter-spacing:2px">SINGLE ITEM</div><div style="font-size:96px;font-weight:800;letter-spacing:-4px;margin-top:14px">£30</div><div style="font-size:28px;color:var(--muted);margin-top:10px;font-weight:500;line-height:1.4">One facial oil</div></div>
      <div class="card" style="flex:1;padding:44px 40px;border:3px solid var(--accent);background:#F0FCF8"><div style="font-size:26px;font-weight:700;color:var(--accent-dk);letter-spacing:2px">ROUTINE SET</div><div style="font-size:96px;font-weight:800;letter-spacing:-4px;margin-top:14px">£55</div><div style="font-size:28px;color:var(--muted);margin-top:10px;font-weight:500;line-height:1.4">Cleanser + oil + mist</div></div>
    </div>
    <p class="lead" style="margin-top:44px">Winning a customer costs about the same either way. A bigger basket means more profit from every ad sale.</p>`),
  slide(6, 6, `
    <div style="text-align:center">
      <div class="kicker" style="align-self:center;margin:0 auto">YOUR TURN</div>
      <h2 style="font-size:96px;margin-top:44px">Want your number?</h2>
      <p class="lead" style="margin-top:30px">Comment the word below and I'll work out your break&#8209;even ROAS.</p>
      <div class="pill" style="font-size:80px;padding:34px 80px;margin-top:64px;letter-spacing:4px;box-shadow:0 30px 60px rgba(31,191,143,.35)">ROAS</div>
    </div>`, true),
];

// ---------- POST 3: 3 things I check (5) ----------
const numCard = (n, t, d, extra) => `
  <div class="kicker">CHECK ${n} OF 3</div>
  <div style="display:flex;gap:56px;align-items:center;margin-top:20px">
    <div style="flex:1">
      <div style="font-size:200px;font-weight:800;color:var(--accent);letter-spacing:-10px;line-height:1">0${n}</div>
      <h2 style="margin-top:10px">${t}</h2>
      <p class="lead">${d}</p>
    </div>
    <div style="flex:none">${extra}</div>
  </div>`;
const miniCard = (inner) => `<div class="card" style="width:330px;padding:40px 34px">${inner}</div>`;
slides['post3_checks'] = [
  page(`${top}<div class="main">
    <div class="kicker">AD TEARDOWN</div>
    <h1>3 things I check in <span class="hl">every</span> skincare ad.</h1>
    <p class="lead">It takes 60 seconds. Most fixes cost less than more ad spend.</p>
    <div style="display:flex;gap:20px;margin-top:56px">${['The first 2 seconds', 'The offer', 'The click'].map((t, i) => `<div class="card" style="padding:22px 30px;font-size:28px;font-weight:700"><span class="acc">0${i + 1}</span>&nbsp; ${t}</div>`).join('')}</div>
    </div>${bottom(1, 5)}`),
  slide(2, 5, numCard(1, 'The first 2 seconds.', 'Is there a reason to stop scrolling? Movement, texture, a face, or a bold line of text.', phone('0:02', 300))),
  slide(3, 5, numCard(2, 'The offer.', 'Is one £25 product carrying the whole ad cost? A set or bundle often works harder.',
    miniCard(`<div style="font-size:24px;font-weight:700;color:var(--muted);letter-spacing:2px">INSTEAD OF</div><div style="font-size:64px;font-weight:800;margin-top:6px;text-decoration:line-through;text-decoration-color:#E0705C;text-decoration-thickness:6px">£25</div><div style="height:2px;background:var(--line);margin:26px 0"></div><div style="font-size:24px;font-weight:700;color:var(--accent-dk);letter-spacing:2px">TRY</div><div style="font-size:64px;font-weight:800;margin-top:6px">£48 <span style="font-size:30px;color:var(--muted)">set</span></div>`))),
  slide(4, 5, numCard(3, 'The click.', 'Does the page match the ad? Same product, same promise, same look.',
    miniCard(`<div style="display:flex;flex-direction:column;gap:18px">${[['Ad', 'Hydrating oil'], ['Page', 'Hydrating oil']].map(([a, b]) => `<div style="border:2px solid var(--line);border-radius:22px;padding:22px"><div style="font-size:22px;font-weight:700;color:var(--muted);letter-spacing:2px">${a.toUpperCase()}</div><div style="font-size:32px;font-weight:800;margin-top:6px">${b}</div></div>`).join('<div style="text-align:center;font-size:44px;color:var(--accent);font-weight:800;line-height:.6">=</div>')}</div>`))),
  slide(5, 5, `
    <div style="text-align:center">
      <div class="kicker" style="margin:0 auto">FREE</div>
      <h2 style="font-size:96px;margin-top:44px">Want me to check yours?</h2>
      <p class="lead" style="margin-top:30px">A free 2-minute video teardown of your ads, with 3 tests I'd run next.</p>
      <div class="pill" style="font-size:64px;padding:34px 70px;margin-top:64px;letter-spacing:2px;box-shadow:0 30px 60px rgba(31,191,143,.35)">DM "TEARDOWN"</div>
    </div>`, true),
];

// ---------- Reel cover (1080x1920) ----------
const reelCover = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS} html,body{height:1920px}</style></head><body><div class="s tall" style="padding:120px 96px;justify-content:space-between"><div class="glow g1"></div><div class="glow g2" style="bottom:200px"></div>
  ${top}
  <div style="text-align:center">
    <div class="kicker" style="margin:0 auto">LAUNCH</div>
    <h1 style="font-size:150px;margin-top:50px;letter-spacing:-7px">You have <span class="hl">half a second.</span></h1>
    <div style="margin:80px auto 0;width:max-content">${phone('0.5s', 380)}</div>
  </div>
  <div style="text-align:center;font-size:34px;font-weight:600;color:var(--muted)">Meta &amp; TikTok ads for UK skincare brands</div>
</div></body></html>`;

(async () => {
  const browser = await chromium.launch();
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  const written = [];
  for (const [name, list] of Object.entries(slides)) {
    fs.mkdirSync(path.join(OUT, name), { recursive: true });
    for (let i = 0; i < list.length; i++) {
      await pg.setContent(list[i], { waitUntil: 'load' });
      await pg.evaluate(() => document.fonts.ready);
      const f = path.join(OUT, name, `${name}_${String(i + 1).padStart(2, '0')}.png`);
      await pg.screenshot({ path: f });
      written.push(f);
    }
  }
  await pg.setViewportSize({ width: 1080, height: 1920 });
  await pg.setContent(reelCover, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  const rc = path.join(OUT, 'launch_reel_cover.png');
  await pg.screenshot({ path: rc });
  written.push(rc);
  await browser.close();
  console.log(written.join('\n'));
})();
