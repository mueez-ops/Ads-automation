// Phone pictures for reel_cheap.js, rendered from HTML in the apple_kit look at 2x as PNG data URLs:
// the iPhone frame with a see-through screen (so the reel can scroll and light what is on it), and the
// screens: business A's ad (a low price), business B's ad (who it is for, the problem it solves), and a
// feed with A's ad between two posts.
const { chromium } = require('playwright');
const path = require('path');
const { data, CSS, INK, GREY, SIG, WIFI, BAT } = require('./apple_kit');

const PH = (f) => data(path.join(__dirname, 'photos', f), 'image/jpeg');
const PAGE = (body, w, h) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}
html,body{width:${w}px;height:${h}px;overflow:hidden;background:transparent}
.ring{position:absolute;inset:20px;border-radius:112px;padding:7px;background:linear-gradient(140deg,#e6e6eb 0%,#a2a2a8 16%,#f3f3f6 38%,#8e8e94 60%,#d9d9de 80%,#9c9ca2 100%);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
.bz{position:absolute;inset:27px;border-radius:105px;border:13px solid #080808}
.top{position:absolute;inset:40px;border-radius:92px;overflow:hidden}
.btn{position:absolute;width:7px;border-radius:4px;background:linear-gradient(90deg,#8e8e94,#dcdce1)}
.scr{position:relative;width:600px;height:${h}px;background:#fff;color:${INK};font-family:Text;overflow:hidden}
.hd{display:flex;align-items:center;gap:18px;padding:0 28px;height:96px}
.hd .av{width:64px;height:64px;font-size:30px;background:#E5E5EA}
.nm{font-weight:600;font-size:30px}.sp{font-size:24px;color:${GREY}}
.dots{margin-left:auto;display:flex;gap:7px}.dots i{width:8px;height:8px;border-radius:50%;background:${INK}}
.photo{width:600px;height:460px;background-size:cover}
.copy{padding:30px 34px 0}
.cta{margin:26px 34px 0;height:96px;border-radius:48px;background:${INK};color:#fff;font-weight:600;font-size:32px;display:flex;align-items:center;justify-content:center}
.acts{display:flex;gap:30px;padding:30px 34px 0}.acts i{width:40px;height:40px;border-radius:11px;border:3.5px solid ${INK}}
.likes{padding:16px 34px 0;font-size:26px;color:${GREY}}
</style></head><body>${body}</body></html>`;

// the frame: titanium ring, bezel, island, status bar and a little glass, around a transparent screen
const frame = (dark) => { const c = dark ? '#fff' : INK; return PAGE(`
  <i class="btn" style="left:15px;top:256px;height:64px"></i><i class="btn" style="left:15px;top:360px;height:112px"></i><i class="btn" style="left:15px;top:494px;height:112px"></i><i class="btn" style="right:15px;top:392px;height:176px"></i>
  <div class="ring"></div><div class="bz"></div>
  <div class="top"><div class="island"></div><div class="status" style="color:${c}"><span>9:41</span><span>${SIG(c)}${WIFI(c)}${BAT(c)}</span></div><div class="glass"></div></div>`, 680, 1360); };

// a sponsored post in the feed; the copy block is what differs between the two businesses
const ad = (name, initial, photo, fy, copy, cta, ink) => `
  <div class="hd"><div class="av" style="${ink ? `background:${INK};color:#fff` : ''}">${initial}</div><div><div class="nm">${name}</div><div class="sp">Sponsored</div></div><div class="dots"><i></i><i></i><i></i></div></div>
  <div class="photo" style="background-image:url(${PH(photo)});background-position:center ${fy}"></div>
  <div class="copy">${copy}</div><div class="cta" id="cta">${cta}</div>
  <div class="acts"><i style="border-radius:50%"></i><i></i><i style="border-radius:4px 12px 12px 12px"></i></div><div class="likes">Liked by 214 others</div>`;
const A_COPY = `<div style="font-weight:700;font-size:44px;letter-spacing:-.01em">Dog grooming</div>
  <div style="display:flex;align-items:baseline;gap:14px;margin-top:4px"><div id="price" style="font-family:Disp;font-weight:600;font-size:150px;letter-spacing:-.04em;line-height:1">$25</div><div style="font-size:30px;color:${GREY}">per groom</div></div>`;
const B_COPY = `<div style="font-weight:700;font-size:48px;letter-spacing:-.015em"><span id="who">For nervous dogs.</span></div>
  <div style="font-weight:500;font-size:33px;line-height:1.32;margin-top:12px;color:#3A3A3C">Calm, one-to-one grooming at home. <span id="prob">No cages. No stress.</span></div>
  <div style="font-size:28px;color:${GREY};margin-top:14px">$60 · at your home</div>`;
const A_AD = ad('Groom &amp; Go', 'G', 'c_studio.jpg', '36%', A_COPY, 'Book now');
const B_AD = ad('Calm Paws', 'C', 'c_home.jpg', '50%', B_COPY, 'Book a calm groom', true);
// a friend's post above and below A's ad, for the scroll-past
const post = (name, initial, photo, fy, text) => `<div class="hd"><div class="av">${initial}</div><div><div class="nm">${name}</div><div class="sp">2h</div></div><div class="dots"><i></i><i></i><i></i></div></div>
  <div class="photo" style="height:600px;background-image:url(${PH(photo)});background-position:center ${fy}"></div>
  <div class="acts"><i style="border-radius:50%"></i><i></i><i style="border-radius:4px 12px 12px 12px"></i></div><div class="likes" style="color:${INK};padding-bottom:40px">${text}</div>`;

const SHOTS = {
  frameLight: [frame(false), 680, 1360], frameDark: [frame(true), 680, 1360],
  a: [PAGE(`<div class="scr" style="padding-top:104px">${A_AD}</div>`, 600, 1280), 600, 1280],
  b: [PAGE(`<div class="scr" style="padding-top:104px">${B_AD}</div>`, 600, 1280), 600, 1280],
  feed: [PAGE(`<div class="scr" style="padding-top:104px">${post('jess.travels', 'J', 'o_living.jpg', '55%', 'Sunday reset')}<div id="ad">${A_AD}</div>${post('sam_runs', 'S', 'o_kitchen.jpg', '50%', 'Finally fixed the kitchen')}</div>`, 600, 3400), 600, 3400],
};

// render every picture once; returns { img: {name: dataURL}, rects: {name: {id: [x, y, w, h]}} } (rects in screen px)
async function screens() {
  const browser = await chromium.launch();
  const out = {}, rects = {};
  for (const [name, [html, w, h]] of Object.entries(SHOTS)) {
    const pg = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    await pg.setContent(html, { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    out[name] = 'data:image/png;base64,' + (await pg.screenshot({ omitBackground: true, type: 'png' })).toString('base64');
    rects[name] = await pg.evaluate(() => Object.fromEntries([...document.querySelectorAll('[id]')].map((e) => { const r = e.getBoundingClientRect(); return [e.id, [r.x, r.y, r.width, r.height].map(Math.round)]; })));
    await pg.close();
  }
  await browser.close();
  return { img: out, rects };
}

module.exports = { screens };

if (require.main === module) {               // node reel_cheap_screens.js <dir>: write the pictures out to look at
  const fs = require('fs');
  screens().then(({ img, rects }) => { for (const [k, v] of Object.entries(img)) fs.writeFileSync(path.join(process.argv[2], k + '.png'), Buffer.from(v.split(',')[1], 'base64')); console.log(JSON.stringify(rects)); });
}
