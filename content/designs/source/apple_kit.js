// Shared pieces for the Apple-style carousels (1080x1350): one centred headline per slide over an iPhone,
// cropped by the bottom edge, whose screen shows the point. Inter Display + Inter, light grey or black slides.
// Used by build_signs.js and build_leads.js.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const data = (f, mime) => `data:${mime};base64,${fs.readFileSync(f).toString('base64')}`;
const font = (f, type) => `url(${data(path.join(__dirname, 'fonts', f), 'font/' + type)})`;
const W = 1080, H = 1350;
const INK = '#1D1D1F', GREY = '#8E8E93';

const CSS = `
@font-face{font-family:Disp;font-weight:600;src:${font('InterDisplay-SemiBold.otf', 'otf')}}
@font-face{font-family:Text;font-weight:400;src:${font('Inter-400.ttf', 'ttf')}}
@font-face{font-family:Text;font-weight:500;src:${font('Inter-500.ttf', 'ttf')}}
@font-face{font-family:Text;font-weight:600;src:${font('Inter-600.ttf', 'ttf')}}
@font-face{font-family:Text;font-weight:700;src:${font('Inter-700.ttf', 'ttf')}}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden}
.s{width:${W}px;height:${H}px;overflow:hidden;display:flex;flex-direction:column;align-items:center;padding-top:136px;background:#F5F5F7;color:${INK};font-family:Text}
.s.dark{background:#000;color:#F5F5F7}
h1{font-family:Disp;font-weight:600;line-height:1.07;letter-spacing:-.024em;text-align:center;max-width:880px;text-wrap:balance}
h1 em{font-style:normal;color:#86868B}
/* the phone */
.stage{position:relative;flex:none;width:640px;height:1320px;margin-top:82px}
.phone{position:absolute;inset:0;border-radius:112px;padding:7px;background:linear-gradient(140deg,#e6e6eb 0%,#a2a2a8 16%,#f3f3f6 38%,#8e8e94 60%,#d9d9de 80%,#9c9ca2 100%);box-shadow:0 70px 120px -46px rgba(0,0,0,.42),0 3px 8px rgba(0,0,0,.1)}
.dark .phone{box-shadow:0 -20px 180px -50px rgba(255,255,255,.16)}
.bezel{width:100%;height:100%;border-radius:105px;background:#080808;padding:13px}
.screen{position:relative;width:100%;height:100%;border-radius:92px;overflow:hidden;background:#F2F2F7;color:${INK}}
.island{position:absolute;top:24px;left:50%;width:188px;height:56px;margin-left:-94px;border-radius:28px;background:#000;z-index:5}
.status{position:absolute;top:28px;left:0;right:0;height:52px;display:flex;justify-content:space-between;align-items:center;padding:0 48px 0 72px;font-weight:600;font-size:31px;z-index:4}
.status span:last-child{display:flex;gap:9px;align-items:center}
.glass{position:absolute;inset:0;background:linear-gradient(125deg,rgba(255,255,255,.15) 0%,rgba(255,255,255,0) 30%);pointer-events:none;z-index:6}
.btn{position:absolute;width:7px;border-radius:4px;background:linear-gradient(90deg,#8e8e94,#dcdce1)}
.l1{left:-5px;top:236px;height:64px}.l2{left:-5px;top:340px;height:112px}.l3{left:-5px;top:474px;height:112px}.r1{right:-5px;top:372px;height:176px}
/* iOS pieces, drawn larger than life so they read on a phone-sized post */
.lt{font-weight:700;font-size:60px;letter-spacing:-.02em;padding:0 46px;margin-top:122px}
.st{font-size:29px;color:${GREY};padding:0 46px;margin-top:4px}
.card{background:#fff;border-radius:36px;margin:24px 26px 0;padding:28px 34px 24px}
.lab{font-size:30px;font-weight:600;color:${GREY}}
.big{font-family:Disp;font-weight:600;font-size:118px;letter-spacing:-.035em;line-height:1.02}
.list{background:#fff;border-radius:36px;margin:28px 26px 0;overflow:hidden}
.row{display:flex;align-items:center;gap:24px;padding:22px 32px;border-top:2px solid #EDEDF0}
.row:first-child{border-top:0}
.av{flex:none;width:72px;height:72px;border-radius:50%;background:#E5E5EA;color:${GREY};font-weight:600;font-size:32px;display:flex;align-items:center;justify-content:center}
.clock{text-align:center}
.clock .d{font-weight:600;font-size:32px;margin-top:132px;opacity:.82}
.clock .h{font-family:Disp;font-weight:600;font-size:186px;line-height:1;letter-spacing:-.02em;margin-top:2px}
.note{display:flex;gap:22px;align-items:flex-start;margin:16px 22px 0;padding:26px 28px;border-radius:42px;background:rgba(255,255,255,.68);backdrop-filter:blur(24px)}
.note.dk{background:rgba(64,64,68,.62);color:#fff}
.ic{flex:none;width:78px;height:78px;border-radius:19px;background:${INK};display:flex;align-items:center;justify-content:center}
.dk .ic{background:#fff}
.nt{flex:1;min-width:0}
.nt .t{display:flex;justify-content:space-between;align-items:baseline;font-weight:600;font-size:31px}
.nt .t i{font-style:normal;font-weight:400;font-size:26px;color:${GREY}}
.dk .nt .t i{color:rgba(255,255,255,.55)}
.nt .b{font-size:30px;line-height:1.3;margin-top:4px}
.post{background:#fff;border-bottom:12px solid #F2F2F7}
.ph{display:flex;align-items:center;gap:18px;padding:18px 28px}
`;

// status bar icons
const SIG = (c) => `<svg width="34" height="22" viewBox="0 0 34 22"><g fill="${c}"><rect y="14" width="6" height="8" rx="1.5"/><rect x="9" y="10" width="6" height="12" rx="1.5"/><rect x="18" y="5" width="6" height="17" rx="1.5"/><rect x="27" width="6" height="22" rx="1.5"/></g></svg>`;
const WIFI = (c) => `<svg width="30" height="22" viewBox="0 0 30 22"><g fill="none" stroke="${c}" stroke-width="3.6" stroke-linecap="round"><path d="M2.5 8.5a18 18 0 0 1 25 0"/><path d="M7.5 13.3a11 11 0 0 1 15 0"/></g><circle cx="15" cy="18.6" r="3" fill="${c}"/></svg>`;
const BAT = (c) => `<svg width="50" height="24" viewBox="0 0 50 24"><rect x="1.5" y="1.5" width="41" height="21" rx="6" fill="none" stroke="${c}" stroke-opacity=".4" stroke-width="2.4"/><rect x="5" y="5" width="34" height="14" rx="3.4" fill="${c}"/><rect x="45" y="8" width="3.5" height="8" rx="1.6" fill="${c}" fill-opacity=".45"/></svg>`;
// app icons for notifications, and the tick used in lists
const CHART = (c) => `<svg width="44" height="40" viewBox="0 0 44 40"><g fill="${c}"><rect x="2" y="22" width="9" height="16" rx="2.5"/><rect x="17" y="12" width="9" height="26" rx="2.5"/><rect x="32" y="2" width="9" height="36" rx="2.5"/></g></svg>`;
const PERSON = (c) => `<svg width="40" height="42" viewBox="0 0 40 42"><g fill="${c}"><circle cx="20" cy="12" r="10"/><path d="M2 41c0-10 8-17 18-17s18 7 18 17z"/></g></svg>`;
const CHECK = `<svg width="26" height="20" viewBox="0 0 26 20"><path d="M3 10.5l7 6.5L23 3" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const phone = (screen, { dark = false, bg = '' } = {}) => `<div class="stage"><div class="phone">
  <i class="btn l1"></i><i class="btn l2"></i><i class="btn l3"></i><i class="btn r1"></i>
  <div class="bezel"><div class="screen" style="${bg}"><div class="island"></div>
    <div class="status" style="color:${dark ? '#fff' : INK}"><span>9:41</span><span>${SIG(dark ? '#fff' : INK)}${WIFI(dark ? '#fff' : INK)}${BAT(dark ? '#fff' : INK)}</span></div>
    ${screen}<div class="glass"></div></div></div></div></div>`;
// extra: CSS only this deck needs (photos, one-off screens)
const slide = (head, img, { dark = false, size = 80, wide = 880, extra = '' } = {}) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}${extra}</style></head>
<body><div class="s${dark ? ' dark' : ''}"><h1 style="font-size:${size}px;max-width:${wide}px">${head}</h1>${img}</div></body></html>`;

const note = (title, when, body, icon, dk) => `<div class="note${dk ? ' dk' : ''}"><div class="ic">${icon}</div>
  <div class="nt"><div class="t"><span>${title}</span><i>${when}</i></div><div class="b">${body}</div></div></div>`;
const lock = (date) => `<div class="clock"><div class="d">${date}</div><div class="h">9:41</div></div><div style="height:46px"></div>`;
const chart = (d, stroke, fill) => `<svg viewBox="0 0 532 100" width="100%" height="100" style="display:block;margin-top:10px">
  ${fill ? `<defs><linearGradient id="fa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${INK}" stop-opacity=".16"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></linearGradient></defs><path d="${d} L532 100 L0 100Z" fill="url(#fa)"/>` : ''}
  <path d="${d}" fill="none" stroke="${stroke}" stroke-width="5" stroke-linecap="round"/></svg>`;
const toggle = (on) => `<div style="flex:none;position:relative;width:96px;height:58px;border-radius:29px;background:${on ? INK : '#E5E5EA'}">
  <div style="position:absolute;top:4px;${on ? 'right' : 'left'}:4px;width:50px;height:50px;border-radius:50%;background:#fff;box-shadow:0 3px 8px rgba(0,0,0,.15)"></div></div>`;

// write <out>/<name>/<name>_01.png ..., logging the headline's line count and where each screen starts
async function render(slides, out, name) {
  const dir = path.join(out, name);
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  const pg = await browser.newPage({ viewport: { width: W, height: H } });
  for (let i = 0; i < slides.length; i++) {
    await pg.setContent(slides[i], { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    const m = await pg.evaluate(() => {
      const h = document.querySelector('h1'), sc = document.querySelector('.screen');
      return { lines: Math.round(h.getBoundingClientRect().height / parseFloat(getComputedStyle(h).lineHeight)), screenTop: Math.round(sc.getBoundingClientRect().top) };
    });
    console.log('slide', i + 1, JSON.stringify(m));
    await pg.screenshot({ path: path.join(dir, `${name}_${String(i + 1).padStart(2, '0')}.png`) });
  }
  await browser.close();
  console.log('rendered', slides.length, 'slides to', dir);
}

module.exports = { data, font, CSS, INK, GREY, SIG, WIFI, BAT, CHART, PERSON, CHECK, phone, slide, note, lock, chart, toggle, render };
