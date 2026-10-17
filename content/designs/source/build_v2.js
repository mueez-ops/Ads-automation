// Mez Media — "Measured Stillness" post system. Renders every slide to PNG with Playwright.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2];
const FONTS = process.argv[3];

const C = { paper: '#F3F6F2', mint: '#CFE9DB', ink: '#0F2A3A', green: '#159E72', soft: '#5B6F7B', rule: 'rgba(15,42,58,.28)' };
const W = 1080, M = 64;

// Fonts are embedded as data URLs: pages loaded with setContent cannot read file:// URLs.
const font = (f) => `url(data:font/ttf;base64,${fs.readFileSync(path.join(FONTS, f)).toString('base64')})`;
const FONT_CSS = `
@font-face{font-family:Serif;src:${font('InstrumentSerif-Regular.ttf')}}
@font-face{font-family:Serif;font-style:italic;src:${font('InstrumentSerif-Italic.ttf')}}
@font-face{font-family:Sans;src:${font('InstrumentSans-Regular.ttf')}}
@font-face{font-family:Sans;font-weight:700;src:${font('InstrumentSans-Bold.ttf')}}
@font-face{font-family:Mono;src:${font('DMMono-Regular.ttf')}}`;
const css = (h) => `${FONT_CSS}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${h}px;overflow:hidden;background:${C.paper}}
.pg{position:relative;width:${W}px;height:${h}px;background:${C.paper};color:${C.ink};overflow:hidden}
.a{position:absolute}
.mono{font-family:Mono;font-size:17px;letter-spacing:.16em;text-transform:uppercase;color:${C.ink}}
.serif{font-family:Serif;font-weight:400;letter-spacing:-.012em;line-height:.98}
.serif em{font-style:italic;color:${C.green}}
.sans{font-family:Sans;font-size:29px;line-height:1.42;color:${C.soft};letter-spacing:-.003em}
.rule{position:absolute;height:1px;background:${C.rule}}
svg{position:absolute;left:0;top:0;overflow:visible}
`;

// ---------- chrome ----------
function chrome(h, issue, n, total, foot) {
  return `
  <div class="a mono" style="left:${M}px;top:58px">Mez Media</div>
  <div class="a mono" style="left:0;width:${W}px;top:58px;text-align:center">Field notes · Nº ${issue}</div>
  <div class="a mono" style="right:${M}px;top:58px">${String(n).padStart(2, '0')} / ${String(total).padStart(2, '0')}</div>
  <div class="rule" style="left:${M}px;width:${W - 2 * M}px;top:98px"></div>
  <div class="rule" style="left:${M}px;width:${W - 2 * M}px;top:${h - 98}px"></div>
  <div class="a mono" style="left:${M}px;top:${h - 76}px">@mezmedia_0</div>
  <div class="a mono" style="right:${M}px;top:${h - 76}px">${foot}</div>`;
}
const page = (h, inner) => `<!doctype html><html><head><meta charset="utf-8"><style>${css(h)}</style></head><body><div class="pg">${inner}</div></body></html>`;
const field = (top, h, color = C.mint) => `<div class="a" style="left:0;top:${top}px;width:${W}px;height:${h}px;background:${color}"></div>`;

// ---------- drawing primitives (SVG) ----------
const S = (h, body) => `<svg width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" xmlns="http://www.w3.org/2000/svg">
<defs><pattern id="hatch" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="11" stroke="${C.ink}" stroke-width="1.1" stroke-opacity=".55"/></pattern></defs>${body}</svg>`;
const t = (x, y, s, { size = 16, anchor = 'start', fill = C.ink, fam = 'Mono', ls = '0.14em', style = '' } = {}) =>
  `<text x="${x}" y="${y}" font-family="${fam}" font-size="${size}" letter-spacing="${ls}" text-anchor="${anchor}" fill="${fill}" ${style}>${s}</text>`;
const line = (x1, y1, x2, y2, w = 1.4, c = C.ink, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" ${extra}/>`;

// Calibrated scale: value range [a,b], ticks every `minor`, majors every `major`.
function ruler(x, y, len, a, b, minor, major, fmt, opts = {}) {
  const k = len / (b - a); let o = line(x, y, x + len, y, 1.4);
  const steps = Math.round((b - a) / minor);
  for (let i = 0; i <= steps; i++) {
    const v = a + i * minor, px = x + (v - a) * k;
    const isMaj = Math.abs(v / major - Math.round(v / major)) < 1e-6;
    const isMid = !isMaj && Math.abs((v / (major / 2)) - Math.round(v / (major / 2))) < 1e-6;
    o += line(px, y, px, y - (isMaj ? 30 : isMid ? 19 : 11), isMaj ? 1.4 : 1);
    if (isMaj && !opts.nolabels) o += t(px, y + 32, fmt(v), { size: 15, anchor: 'middle', ls: '0.06em' });
  }
  return o;
}
const px = (x, len, a, b, v) => x + (v - a) * len / (b - a);

// Technical line drawings of products (stroke-only, with a single green accent)
function dropper(x, y, s = 1) {
  const w = 118 * s, bh = 200 * s, nw = 48 * s, nh = 26 * s, tw = 40 * s, th = 64 * s;
  const bx = x - w / 2, by = y - bh;
  return `<g fill="none" stroke="${C.ink}" stroke-width="2">
    <rect x="${bx}" y="${by}" width="${w}" height="${bh}" rx="${16 * s}"/>
    <rect x="${x - nw / 2}" y="${by - nh}" width="${nw}" height="${nh}" rx="${3 * s}"/>
    <path d="M${x - tw / 2} ${by - nh} v${-th + tw / 2} a${tw / 2} ${tw / 2} 0 0 1 ${tw} 0 v${th - tw / 2}"/>
    <rect x="${bx + 18 * s}" y="${by + 58 * s}" width="${w - 36 * s}" height="${70 * s}" stroke-width="1.2"/>
    ${line(bx + 30 * s, by + 82 * s, bx + w - 30 * s, by + 82 * s, 1)}${line(bx + 30 * s, by + 100 * s, bx + w - 52 * s, by + 100 * s, 1)}
  </g>${line(bx + 2, by + bh - 34 * s, bx + w - 2, by + bh - 34 * s, 2.4, C.green)}`;
}
function jar(x, y, s = 1) {
  const w = 168 * s, bh = 96 * s, lw = 156 * s, lh = 40 * s;
  return `<g fill="none" stroke="${C.ink}" stroke-width="2">
    <rect x="${x - w / 2}" y="${y - bh}" width="${w}" height="${bh}" rx="${18 * s}"/>
    <rect x="${x - lw / 2}" y="${y - bh - lh}" width="${lw}" height="${lh}" rx="${6 * s}"/>
    ${line(x - lw / 2 + 14 * s, y - bh - lh / 2, x + lw / 2 - 14 * s, y - bh - lh / 2, 1)}
    <rect x="${x - w / 2 + 26 * s}" y="${y - bh + 28 * s}" width="${w - 52 * s}" height="${38 * s}" stroke-width="1.2"/>
  </g>${line(x - w / 2 + 4, y - bh * 0.18, x + w / 2 - 4, y - bh * 0.18, 2.4, C.green)}`;
}
function mist(x, y, s = 1) {
  const w = 84 * s, bh = 236 * s;
  return `<g fill="none" stroke="${C.ink}" stroke-width="2">
    <rect x="${x - w / 2}" y="${y - bh}" width="${w}" height="${bh}" rx="${12 * s}"/>
    <rect x="${x - 24 * s}" y="${y - bh - 22 * s}" width="${48 * s}" height="${22 * s}" rx="${2 * s}"/>
    <rect x="${x - 16 * s}" y="${y - bh - 52 * s}" width="${32 * s}" height="${30 * s}" rx="${4 * s}"/>
    ${line(x + 16 * s, y - bh - 40 * s, x + 30 * s, y - bh - 40 * s, 2)}
    <rect x="${x - w / 2 + 14 * s}" y="${y - bh + 70 * s}" width="${w - 28 * s}" height="${86 * s}" stroke-width="1.2"/>
  </g>${line(x - w / 2 + 2, y - 30 * s, x + w / 2 - 2, y - 30 * s, 2.4, C.green)}`;
}
// Dimension line with end ticks and centred label
function dimH(x1, x2, y, label) {
  return line(x1, y, x2, y, 1) + line(x1, y - 9, x1, y + 9, 1) + line(x2, y - 9, x2, y + 9, 1) +
    `<rect x="${(x1 + x2) / 2 - label.length * 6.2 - 12}" y="${y - 13}" width="${label.length * 12.4 + 24}" height="26" fill="${C.paper}"/>` +
    t((x1 + x2) / 2, y + 6, label, { size: 17, anchor: 'middle', ls: '0.06em' });
}
function dimV(x, y1, y2, label, bg = C.paper) {
  return line(x, y1, x, y2, 1) + line(x - 9, y1, x + 9, y1, 1) + line(x - 9, y2, x + 9, y2, 1) +
    `<rect x="${x - 50}" y="${(y1 + y2) / 2 - 15}" width="100" height="30" fill="${bg}"/>` + t(x, (y1 + y2) / 2 + 6, label, { size: 17, anchor: 'middle', ls: '0.06em' });
}
const leaderRow = (x, y, w, l, r, { bold = false, color = C.ink } = {}) =>
  t(x, y, l, { size: bold ? 22 : 21, fam: 'Mono', ls: '0.04em', fill: color }) +
  line(x + l.length * 13.4 + 14, y - 5, x + w - r.length * 13.4 - 14, y - 5, 1.2, C.ink, 'stroke-dasharray="1.5 7" stroke-linecap="round"') +
  t(x + w, y, r, { size: bold ? 22 : 21, anchor: 'end', ls: '0.04em', fill: color });

// ---------- slides ----------
const H = 1350;
const posts = {};

// POST 1 — Introduction
posts.post1_intro = [
  page(H, `${field(842, H - 842)}${chrome(H, '01', 1, 4, 'Continue →')}
    <div class="a mono" style="left:${M}px;top:176px;color:${C.green}">Fig. 1 — The scroll, measured</div>
    <div class="a serif" style="left:${M - 4}px;top:226px;width:900px;font-size:136px">Ads that win the first <em>half second.</em></div>
    ${S(H, ruler(M + 20, 1020, W - 2 * M - 40, 0, 1, 0.02, 0.1, (v) => v.toFixed(1)) +
      `<path d="M${px(M + 20, W - 2 * M - 40, 0, 1, 0.5)} 958 l-9 -16 h18 z" fill="${C.green}"/>` +
      line(px(M + 20, W - 2 * M - 40, 0, 1, 0.5), 958, px(M + 20, W - 2 * M - 40, 0, 1, 0.5), 1020, 2.4, C.green) +
      t(px(M + 20, W - 2 * M - 40, 0, 1, 0.5) + 18, 934, '0.50 s', { size: 17 }) +
      t(M + 20, 1086, 'seconds', { size: 14, fill: C.soft, ls: '0.2em' }))}
    <div class="a sans" style="left:${M}px;top:1126px;width:640px;color:${C.ink}">Meta &amp; TikTok advertising for UK skincare brands.</div>`),

  page(H, `${chrome(H, '01', 2, 4, 'Continue →')}
    <div class="a mono" style="left:${M}px;top:176px;color:${C.green}">Fig. 2 — Practice</div>
    <div class="a serif" style="left:${M - 3}px;top:220px;font-size:112px">Four <em>disciplines.</em></div>
    ${S(H, line(M, 470, W - M, 470, 1, C.rule) + line(W / 2, 470, W / 2, 1180, 1, C.rule) + line(M, 825, W - M, 825, 1, C.rule) +
      // glyphs
      `<g fill="none" stroke="${C.ink}" stroke-width="1.6">
        <circle cx="${M + 40}" cy="548" r="22"/><circle cx="${M + 72}" cy="548" r="22"/>
        <path d="M${W / 2 + 48} 528 v40 a10 10 0 1 1 -10 -10"/><path d="M${W / 2 + 48} 528 q4 14 20 16"/>
        <path d="M${M + 26} 924 l36 -36 l12 12 l-36 36 z"/>${line(M + 22, 940, M + 34, 928, 1.6)}
        <circle cx="${W / 2 + 56}" cy="904" r="22"/><circle cx="${W / 2 + 56}" cy="904" r="9"/>${line(W / 2 + 56, 872, W / 2 + 56, 880, 1.6)}${line(W / 2 + 56, 928, W / 2 + 56, 936, 1.6)}
      </g>` +
      `<circle cx="${M + 56}" cy="548" r="3" fill="${C.green}"/><circle cx="${W / 2 + 56}" cy="904" r="3" fill="${C.green}"/>`)}
    ${[[M + 6, 510, '01', 'Meta Ads', 'Campaign setup, testing and scaling across Facebook &amp; Instagram.'],
       [W / 2 + 34, 510, '02', 'TikTok Ads', 'Native, creator-style ads built for the feed they live in.'],
       [M + 6, 866, '03', 'Creative', 'Hooks, scripts and briefs designed to stop the scroll.'],
       [W / 2 + 34, 866, '04', 'Tracking', 'Pixel &amp; Conversions API checks, so every sale is counted.']]
      .map(([x, y, n, h, d]) => `
      <div class="a mono" style="left:${x + 120}px;top:${y + 26}px;color:${C.soft}">${n}</div>
      <div class="a serif" style="left:${x - 4}px;top:${y + 112}px;font-size:64px">${h}</div>
      <div class="a sans" style="left:${x}px;top:${y + 190}px;width:400px;font-size:25px">${d}</div>`).join('')}`),

  page(H, `${chrome(H, '01', 3, 4, 'Continue →')}
    <div class="a mono" style="left:${M}px;top:176px;color:${C.green}">Fig. 3 — Fit</div>
    <div class="a serif" style="left:${M - 3}px;top:220px;width:640px;font-size:112px">Made for UK <em>skincare</em> brands.</div>
    ${S(H, dropper(880, 560, 1.05) +
      [0, 1, 2, 3].map((i) => line(M, 680 + i * 128, W - M, 680 + i * 128, 1, C.rule)).join('') + line(M, 1192, W - M, 1192, 1, C.rule) +
      [0, 1, 2, 3].map((i) => `<rect x="${W - M - 18}" y="${732 + i * 128}" width="18" height="18" fill="${C.green}"/>`).join(''))}
    ${['You sell online, on Shopify or similar.', 'Your product already has people who love it.', 'You want more customers, without guessing.', "You're ready to test ads properly."]
      .map((s, i) => `<div class="a mono" style="left:${M}px;top:${728 + i * 128}px;color:${C.soft}">${['i', 'ii', 'iii', 'iv'][i]}.</div>
        <div class="a serif" style="left:${M + 96}px;top:${714 + i * 128}px;font-size:43px;line-height:1.1">${s}</div>`).join('')}`),

  page(H, `${field(0, H)}${chrome(H, '01', 4, 4, 'Save for later')}
    <div class="a mono" style="left:${M}px;top:176px;color:${C.green}">Fig. 4 — Method</div>
    <div class="a serif" style="left:${M - 3}px;top:220px;font-size:112px">How it <em>starts.</em></div>
    ${S(H, line(M + 40, 560, W - M - 40, 560, 1.4) +
      [0, 1, 2].map((i) => { const x = M + 40 + i * ((W - 2 * M - 80) / 2); return `<circle cx="${x}" cy="560" r="${i === 0 ? 14 : 10}" fill="${i === 0 ? C.green : C.mint}" stroke="${C.ink}" stroke-width="1.6"/>`; }).join(''))}
    ${[['01', 'Free teardown', 'A 2-minute video on<br>your current ads.'], ['02', '30-day pilot', 'Creative, setup and<br>weekly reports.'], ['03', 'Scale', 'Keep the winners.<br>Cut the rest.']]
      .map(([n, h, d], i) => { const cx = M + 40 + i * ((W - 2 * M - 80) / 2); const left = i === 0 ? M : i === 2 ? W - M - 300 : cx - 150; const al = i === 0 ? 'left' : i === 2 ? 'right' : 'center';
        return `<div class="a mono" style="left:${left}px;width:300px;text-align:${al};top:610px;color:${C.soft}">${n}</div>
        <div class="a serif" style="left:${left}px;width:300px;text-align:${al};top:650px;font-size:52px">${h}</div>
        <div class="a sans" style="left:${left}px;width:300px;text-align:${al};top:720px;font-size:24px;color:${C.ink};opacity:.75">${d}</div>`; }).join('')}
    <div class="rule" style="left:${M}px;width:${W - 2 * M}px;top:900px"></div>
    <div class="a mono" style="left:${M}px;top:950px">To begin, send a DM with the word</div>
    <div class="a serif" style="left:${M - 6}px;top:990px;font-size:150px"><em style="color:${C.ink}">“Teardown”</em></div>`),
];

// POST 2 — Break-even ROAS
const scaleX = M + 30, scaleL = W - 2 * M - 60;
posts.post2_roas = [
  page(H, `${field(880, H - 880)}${chrome(H, '02', 1, 6, 'Continue →')}
    <div class="a mono" style="left:${M}px;top:176px;color:${C.green}">Fig. 1 — A common assumption</div>
    <div class="a serif" style="left:${M - 4}px;top:226px;width:940px;font-size:132px">Your ROAS target is probably <em>wrong.</em></div>
    <div class="a sans" style="left:${M}px;top:690px;width:720px">The ten-second maths every skincare brand should do before spending another pound on ads.</div>
    ${S(H, ruler(scaleX, 1080, scaleL, 0, 5, 0.1, 1, (v) => v.toFixed(1)) +
      [2, 3, 4].map((v) => { const x = px(scaleX, scaleL, 0, 5, v); return line(x, 1046, x, 990, 1, C.ink, 'stroke-dasharray="3 5"') + t(x, 976, v.toFixed(1) + ' ?', { size: 18, anchor: 'middle', ls: '0.04em' }); }).join('') +
      t(scaleX, 1150, 'ROAS', { size: 14, fill: C.soft, ls: '0.2em' }))}`),

  page(H, `${chrome(H, '02', 2, 6, 'Continue →')}
    <div class="a mono" style="left:${M}px;top:176px;color:${C.green}">Fig. 2 — The formula</div>
    <div class="a mono" style="left:0;width:${W}px;text-align:center;top:400px">Break-even ROAS</div>
    <div class="a serif" style="left:0;width:${W}px;text-align:center;top:470px;font-size:210px;line-height:1">1</div>
    ${S(H, line(300, 712, 780, 712, 2.4) + `<circle cx="540" cy="712" r="7" fill="${C.green}"/>`)}
    <div class="a serif" style="left:0;width:${W}px;text-align:center;top:740px;font-size:210px;line-height:1"><em>margin</em></div>
    <div class="rule" style="left:${M}px;width:${W - 2 * M}px;top:1080px"></div>
    <div class="a mono" style="left:${M}px;top:1112px;color:${C.soft}">Margin</div>
    <div class="a sans" style="left:${M + 190}px;top:1102px;width:700px;font-size:27px;color:${C.ink}">What remains of each sale after product, shipping and fees.</div>`),

  page(H, `${chrome(H, '02', 3, 6, 'Continue →')}
    <div class="a mono" style="left:${M}px;top:176px;color:${C.green}">Fig. 3 — Worked example</div>
    <div class="a serif" style="left:${M - 3}px;top:220px;font-size:112px">A £30 <em>facial oil.</em></div>
    ${S(H, dropper(200, 1040, 1.45) + dimV(350, 1040 - 290, 1040, '30 ml') +
      leaderRow(460, 640, 556, 'Sale price', '£30.00') +
      leaderRow(460, 712, 556, 'Product', '−£5.00') +
      leaderRow(460, 784, 556, 'Shipping', '−£3.00') +
      leaderRow(460, 856, 556, 'Fees', '−£1.00') +
      line(460, 900, 1016, 900, 1.4) +
      leaderRow(460, 950, 556, 'Remaining', '£21.00', { bold: true }) +
      line(460, 1000, 1016, 1000, 1, C.rule))}
    <div class="a mono" style="left:460px;top:1046px;color:${C.soft}">Margin</div>
    <div class="a serif" style="right:${M}px;top:1010px;font-size:120px;line-height:1"><em>70%</em></div>`),

  page(H, `${field(760, 440)}${chrome(H, '02', 4, 6, 'Continue →')}
    <div class="a mono" style="left:${M}px;top:176px;color:${C.green}">Fig. 4 — The threshold</div>
    <div class="a serif" style="left:${M - 4}px;top:226px;font-size:150px">1 ÷ 0.70 = <em>1.43</em></div>
    <div class="a sans" style="left:${M}px;top:430px;width:780px;color:${C.ink}">Below a ROAS of 1.43, every first order loses money. Above it, each sale pays for itself.</div>
    ${(() => { const x0 = px(scaleX, scaleL, 0, 4, 0), xb = px(scaleX, scaleL, 0, 4, 1.43); return S(H,
      `<rect x="${x0}" y="900" width="${xb - x0}" height="110" fill="url(#hatch)"/>` +
      line(x0, 900, xb, 900, 1, C.ink) +
      ruler(scaleX, 1010, scaleL, 0, 4, 0.1, 1, (v) => v.toFixed(1)) +
      line(xb, 860, xb, 1010, 2.4, C.green) + `<path d="M${xb} 858 l-8 -14 h16 z" fill="${C.green}"/>` +
      t(xb + 18, 846, 'Break-even  1.43', { size: 17 }) +
      t((x0 + xb) / 2, 1110, 'Loss', { size: 16, anchor: 'middle', ls: '0.2em' }) +
      t((xb + scaleX + scaleL) / 2, 1110, 'Profit', { size: 16, anchor: 'middle', ls: '0.2em', fill: C.green })); })()}`),

  page(H, `${chrome(H, '02', 5, 6, 'Continue →')}
    <div class="a mono" style="left:${M}px;top:176px;color:${C.green}">Fig. 5 — The lever</div>
    <div class="a serif" style="left:${M - 3}px;top:220px;width:900px;font-size:112px">Sell the <em>set,</em> not the single.</div>
    ${S(H, line(W / 2, 520, W / 2, 1080, 1, C.rule) +
      dropper(W / 4, 960, 1.05) + dimH(W / 4 - 110, W / 4 + 110, 1020, '£30') +
      mist(W * 0.62, 960, 0.8) + dropper(W * 0.75, 960, 0.85) + jar(W * 0.88, 960, 0.62) + dimH(W * 0.58, W * 0.94, 1020, '£55'))}
    <div class="a mono" style="left:${M}px;top:560px;color:${C.soft}">Single item</div>
    <div class="a mono" style="left:${W / 2 + 34}px;top:560px;color:${C.soft}">Routine set</div>
    <div class="rule" style="left:${M}px;width:${W - 2 * M}px;top:1100px"></div>
    <div class="a sans" style="left:${M}px;top:1124px;width:900px;font-size:27px;color:${C.ink}">A customer costs about the same to win either way. A larger basket means more profit from every ad sale.</div>`),

  page(H, `${field(0, H)}${chrome(H, '02', 6, 6, 'Save for later')}
    <div class="a mono" style="left:${M}px;top:176px;color:${C.green}">Fig. 6 — Your turn</div>
    <div class="a serif" style="left:${M - 4}px;top:226px;width:900px;font-size:132px">Want <em>your</em> number?</div>
    <div class="a sans" style="left:${M}px;top:540px;width:700px;color:${C.ink}">Comment the word below and I’ll work out your break-even ROAS.</div>
    ${S(H, `<rect x="${M}" y="720" width="${W - 2 * M}" height="360" fill="none" stroke="${C.ink}" stroke-width="1.4"/>` +
      line(M, 772, W - M, 772, 1) + t(M + 24, 756, 'Comment', { size: 16 }) + t(W - M - 24, 756, 'Nº 02 / ROAS', { size: 16, anchor: 'end' }))}
    <div class="a serif" style="left:0;width:${W}px;text-align:center;top:800px;font-size:240px;line-height:1">ROAS</div>`),
];

// POST 3 — Three checks
const stopwatch = (cx, cy, r) => {
  let o = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.ink}" stroke-width="2"/>` +
    `<rect x="${cx - 18}" y="${cy - r - 34}" width="36" height="22" fill="none" stroke="${C.ink}" stroke-width="2"/>` + line(cx, cy - r - 12, cx, cy - r, 2);
  for (let i = 0; i < 60; i++) { const a = (i * 6 - 90) * Math.PI / 180, l = i % 5 === 0 ? 26 : 12;
    o += line(cx + Math.cos(a) * (r - 14), cy + Math.sin(a) * (r - 14), cx + Math.cos(a) * (r - 14 - l), cy + Math.sin(a) * (r - 14 - l), i % 5 === 0 ? 1.6 : 1); }
  const ar = r - 52, a2 = (12 - 90) * Math.PI / 180;
  o = `<path d="M${cx} ${cy} L${cx} ${cy - ar} A${ar} ${ar} 0 0 1 ${cx + Math.cos(a2) * ar} ${cy + Math.sin(a2) * ar} Z" fill="${C.mint}"/>` + o;
  o += line(cx, cy, cx + Math.cos(a2) * (r - 52), cy + Math.sin(a2) * (r - 52), 2.4, C.green) + `<circle cx="${cx}" cy="${cy}" r="6" fill="${C.ink}"/>`;
  return o + t(cx, cy + r * 0.45, '00:02', { size: 22, anchor: 'middle', ls: '0.1em' });
};
const tag = (x, y, w, h, price, sub, struck) => {
  const n = 46;
  let o = `<path d="M${x} ${y} h${w - n} l${n} ${h / 2} l-${n} ${h / 2} h-${w - n} z" fill="${C.paper}" stroke="${C.ink}" stroke-width="2"/>` +
    `<circle cx="${x + w - n + 6}" cy="${y + h / 2}" r="8" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`;
  o += t(x + 34, y + 46, sub, { size: 15, fill: C.soft, ls: '0.18em' }) + t(x + 30, y + h - 36, price, { size: 84, fam: 'Serif', ls: '0', fill: struck ? C.soft : C.ink });
  if (struck) o += line(x + 22, y + h - 64, x + 200, y + h - 64, 2.4, C.ink);
  return o;
};
const screen = (x, y, w, h, label) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${label === 'Ad' ? 34 : 6}" fill="${C.paper}" stroke="${C.ink}" stroke-width="2"/>` +
  (label === 'Ad' ? line(x + w / 2 - 34, y + 22, x + w / 2 + 34, y + 22, 3, C.ink, 'stroke-linecap="round"') : line(x, y + 40, x + w, y + 40, 1.2) + `<circle cx="${x + 22}" cy="${y + 20}" r="5" fill="none" stroke="${C.ink}"/><circle cx="${x + 40}" cy="${y + 20}" r="5" fill="none" stroke="${C.ink}"/>`) +
  `<rect x="${x + 24}" y="${y + 64}" width="${w - 48}" height="${h * 0.48}" fill="${C.mint}"/>` +
  dropper(x + w / 2, y + 64 + h * 0.48 - 26, 0.62) +
  line(x + 24, y + h * 0.72, x + w - 60, y + h * 0.72, 1.2) + line(x + 24, y + h * 0.72 + 22, x + w - 110, y + h * 0.72 + 22, 1.2) +
  `<rect x="${x + 24}" y="${y + h - 84}" width="${w - 48}" height="52" fill="${C.ink}"/>` +
  t(x + w / 2, y + h - 52, label === 'Ad' ? 'Shop now' : 'Add to bag', { size: 15, anchor: 'middle', fill: C.paper });

posts.post3_checks = [
  page(H, `${field(760, H - 760)}${chrome(H, '03', 1, 5, 'Continue →')}
    <div class="a mono" style="left:${M}px;top:176px;color:${C.green}">Fig. 1 — Teardown method</div>
    <div class="a serif" style="left:${M - 4}px;top:226px;width:940px;font-size:126px">Three things I check in <em>every</em> skincare ad.</div>
    <div class="a mono" style="left:${M}px;top:828px;color:${C.soft}">Contents</div>
    ${S(H, [['01', 'The first two seconds', 'p. 2'], ['02', 'The offer', 'p. 3'], ['03', 'The click', 'p. 4']].map(([n, l, p], i) => {
      const y = 940 + i * 82; return t(M, y, n, { size: 20, fill: C.green, ls: '0.08em' }) + t(M + 70, y + 2, l, { size: 40, fam: 'Serif', ls: '0' }) +
        line(M + 90 + l.length * 17, y - 6, W - M - 70, y - 6, 1.2, C.ink, 'stroke-dasharray="1.5 7" stroke-linecap="round"') + t(W - M, y, p, { size: 18, anchor: 'end', ls: '0.08em' }) +
        (i < 2 ? line(M, y + 32, W - M, y + 32, 1, C.rule) : ''); }).join(''))}`),

  page(H, `${chrome(H, '03', 2, 5, 'Continue →')}
    <div class="a mono" style="left:${M}px;top:176px;color:${C.green}">Check 01 / 03</div>
    <div class="a serif" style="left:${M - 3}px;top:220px;width:520px;font-size:112px">The first two <em>seconds.</em></div>
    ${S(H, stopwatch(790, 560, 200))}
    <div class="rule" style="left:${M}px;width:${W - 2 * M}px;top:920px"></div>
    <div class="a mono" style="left:${M}px;top:960px;color:${C.soft}">Question</div>
    <div class="a serif" style="left:${M + 250}px;top:944px;width:700px;font-size:52px;line-height:1.08">Is there a reason to stop scrolling?</div>
    <div class="a mono" style="left:${M}px;top:1104px;color:${C.soft}">Look for</div>
    <div class="a sans" style="left:${M + 250}px;top:1094px;width:700px;color:${C.ink}">Movement, texture, a face, or one bold line of text.</div>`),

  page(H, `${chrome(H, '03', 3, 5, 'Continue →')}
    <div class="a mono" style="left:${M}px;top:176px;color:${C.green}">Check 02 / 03</div>
    <div class="a serif" style="left:${M - 3}px;top:220px;font-size:112px">The <em>offer.</em></div>
    ${S(H, tag(M, 450, 400, 230, '£25', 'Single', true) + tag(W - M - 440, 560, 440, 230, '£48', 'Routine set', false) +
      `<path d="M${M + 420} 600 C ${M + 520} 600, ${W - M - 560} 690, ${W - M - 460} 690" fill="none" stroke="${C.green}" stroke-width="1.6" stroke-dasharray="4 6"/>` +
      `<path d="M${W - M - 460} 690 l-14 -8 v16 z" fill="${C.green}"/>`)}
    <div class="rule" style="left:${M}px;width:${W - 2 * M}px;top:920px"></div>
    <div class="a mono" style="left:${M}px;top:960px;color:${C.soft}">Question</div>
    <div class="a serif" style="left:${M + 250}px;top:944px;width:700px;font-size:52px;line-height:1.08">Is one £25 product carrying the whole ad cost?</div>
    <div class="a mono" style="left:${M}px;top:1104px;color:${C.soft}">Try</div>
    <div class="a sans" style="left:${M + 250}px;top:1094px;width:700px;color:${C.ink}">A set or bundle often works harder for the same click.</div>`),

  page(H, `${chrome(H, '03', 4, 5, 'Continue →')}
    <div class="a mono" style="left:${M}px;top:176px;color:${C.green}">Check 03 / 03</div>
    <div class="a serif" style="left:${M - 3}px;top:220px;font-size:112px">The <em>click.</em></div>
    ${S(H, screen(M + 40, 380, 300, 500, 'Ad') + screen(W - M - 440, 400, 400, 460, 'Page') +
      line(M + 360, 600, W - M - 460, 600, 1.4) + line(M + 360, 618, W - M - 460, 618, 1.4) +
      t(M + 40, 914, 'The ad', { size: 15, fill: C.soft, ls: '0.2em' }) + t(W - M - 440, 914, 'The page', { size: 15, fill: C.soft, ls: '0.2em' }))}
    <div class="rule" style="left:${M}px;width:${W - 2 * M}px;top:960px"></div>
    <div class="a mono" style="left:${M}px;top:1000px;color:${C.soft}">Question</div>
    <div class="a serif" style="left:${M + 250}px;top:984px;width:700px;font-size:52px;line-height:1.08">Does the page match the ad?</div>
    <div class="a mono" style="left:${M}px;top:1104px;color:${C.soft}">Look for</div>
    <div class="a sans" style="left:${M + 250}px;top:1094px;width:700px;color:${C.ink}">Same product, same promise, same look.</div>`),

  page(H, `${field(0, H)}${chrome(H, '03', 5, 5, 'Save for later')}
    <div class="a mono" style="left:${M}px;top:176px;color:${C.green}">Fig. 5 — Free</div>
    <div class="a serif" style="left:${M - 4}px;top:226px;width:900px;font-size:132px">Want me to check <em>yours?</em></div>
    <div class="a sans" style="left:${M}px;top:540px;width:720px;color:${C.ink}">A free two-minute video teardown of your ads, with three tests I’d run next.</div>
    ${S(H, `<rect x="${M}" y="720" width="${W - 2 * M}" height="360" fill="none" stroke="${C.ink}" stroke-width="1.4"/>` +
      line(M, 772, W - M, 772, 1) + t(M + 24, 756, 'Send a DM', { size: 16 }) + t(W - M - 24, 756, 'Nº 03 / Teardown', { size: 16, anchor: 'end' }))}
    <div class="a serif" style="left:0;width:${W}px;text-align:center;top:820px;font-size:200px;line-height:1"><em style="color:${C.ink}">Teardown</em></div>`),
];

// Launch reel cover (1080x1920). Key content kept inside the central 1080x1440 grid crop.
const RH = 1920;
const reel = page(RH, `${field(1330, RH - 1330)}${chrome(RH, '00', 1, 1, 'Launch')}
  <div class="a mono" style="left:${M}px;top:330px;color:${C.green}">Fig. 0 — The scroll, measured</div>
  <div class="a serif" style="left:${M - 6}px;top:380px;width:960px;font-size:184px">You have <em>half a second.</em></div>
  ${S(RH, dropper(W / 2 - 120, 1290, 0.88) + jar(W / 2 + 100, 1290, 0.8) +
    ruler(M + 20, 1510, W - 2 * M - 40, 0, 1, 0.02, 0.1, (v) => v.toFixed(1)) +
    `<path d="M${px(M + 20, W - 2 * M - 40, 0, 1, 0.5)} 1448 l-9 -16 h18 z" fill="${C.green}"/>` +
    line(px(M + 20, W - 2 * M - 40, 0, 1, 0.5), 1448, px(M + 20, W - 2 * M - 40, 0, 1, 0.5), 1510, 2.4, C.green) +
    t(px(M + 20, W - 2 * M - 40, 0, 1, 0.5) + 18, 1424, '0.50 s', { size: 17 }))}
  <div class="a sans" style="left:${M}px;top:1610px;width:700px;color:${C.ink}">Meta &amp; TikTok advertising for UK skincare brands.</div>`);

(async () => {
  const browser = await chromium.launch();
  const pg = await browser.newPage({ viewport: { width: W, height: H } });
  const shot = async (html, file, h) => {
    await pg.setViewportSize({ width: W, height: h });
    await pg.setContent(html, { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.screenshot({ path: file });
  };
  for (const [name, list] of Object.entries(posts)) {
    fs.mkdirSync(path.join(OUT, name), { recursive: true });
    for (let i = 0; i < list.length; i++) await shot(list[i], path.join(OUT, name, `${name}_${String(i + 1).padStart(2, '0')}.png`), H);
  }
  await shot(reel, path.join(OUT, 'launch_reel_cover.png'), RH);
  await browser.close();
  console.log('rendered');
})();
