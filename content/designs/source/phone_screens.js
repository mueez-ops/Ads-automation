// Shared Node side for the Apple-style phone reels: the iPhone frame with a see-through screen and the page
// template for screens, rendered from HTML in the apple_kit look at 2x as PNG data URLs. Each reel's
// *_screens.js builds its own screens with PAGE and the feed-post classes below, then calls renderScreens.
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
const FRAMES = { frameLight: [frame(false), 680, 1360], frameDark: [frame(true), 680, 1360] };

// render every picture once; shots: {name: [html, w, h]}. Returns { img: {name: dataURL}, rects: {name: {id: [x, y, w, h]}} }
// (rects in screen px, for every element with an id)
async function renderScreens(shots) {
  const browser = await chromium.launch();
  const out = {}, rects = {};
  for (const [name, [html, w, h]] of Object.entries(shots)) {
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

// node <reel>_screens.js <dir>: write the pictures out to look at
function dump(screens, dir) {
  const fs = require('fs');
  screens().then(({ img, rects }) => { for (const [k, v] of Object.entries(img)) fs.writeFileSync(path.join(dir, k + '.png'), Buffer.from(v.split(',')[1], 'base64')); console.log(JSON.stringify(rects)); });
}

module.exports = { PH, PAGE, FRAMES, renderScreens, dump };
