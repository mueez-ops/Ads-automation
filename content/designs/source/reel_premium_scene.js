// Browser-side shots for reel_premium.js (classic script; kit helpers W, H, clamp, lerp, IMG, NOISE, mk, out, g... are globals).
const CREAM = '#F6F1E7', INK = '#1E1A16', WB = '#120E0B', PEACH = '#FF7A59', WARM = '#FFF4EC', GREY = '#B9B2A6';
const ease = (k) => 1 - Math.pow(1 - clamp(k), 3);
const expo = (k) => outExpo(clamp(k));
const eio = (k) => { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const CUR = mk(), cx_ = CUR.getContext('2d'), PRV = mk(), px_ = PRV.getContext('2d'), PNL = mk(), pn = PNL.getContext('2d'), FB = mk(), fb = FB.getContext('2d');

// ---------- primitives (all take a context) ----------
function rrx(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }
function pic(x, img, x0, y0, w, h, z = 1, fx = 0.5, fy = 0.5) {
  const sc = Math.max(w / img.width, h / img.height) * z, iw = img.width * sc, ih = img.height * sc;
  let dx = x0 + w / 2 - fx * iw, dy = y0 + h / 2 - fy * ih;
  dx = Math.min(x0, Math.max(x0 + w - iw, dx)); dy = Math.min(y0, Math.max(y0 + h - ih, dy));
  x.save(); x.beginPath(); x.rect(x0, y0, w, h); x.clip(); x.drawImage(img, dx, dy, iw, ih); x.restore();
}
function darkBG(x, glow = 0.2, cy = 0.5) {
  x.fillStyle = WB; x.fillRect(0, 0, W, H);
  const q = x.createRadialGradient(W / 2, H * cy, 0, W / 2, H * cy, 950);
  q.addColorStop(0, 'rgba(255,122,89,' + glow + ')'); q.addColorStop(0.45, 'rgba(255,122,89,' + glow * 0.3 + ')'); q.addColorStop(1, 'rgba(255,122,89,0)');
  x.fillStyle = q; x.fillRect(0, 0, W, H);
}
function creamBG(x) {
  x.fillStyle = CREAM; x.fillRect(0, 0, W, H);
  const q = x.createRadialGradient(W / 2, H * 0.45, 250, W / 2, H * 0.5, 1250); q.addColorStop(0, 'rgba(255,255,255,.35)'); q.addColorStop(1, 'rgba(120,90,50,.10)');
  x.fillStyle = q; x.fillRect(0, 0, W, H);
}
// serif line built word by word: fade + rise + de-blur. o: {per, accent:[i], acol, f, align, a, ls}
function build(x, str, X, Y, size, color, t0, t, o = {}) {
  x.save(); x.font = (o.w ? o.w + ' ' : '') + size + 'px ' + (o.f || 'Display'); x.letterSpacing = (o.ls ?? -size * 0.012) + 'px'; x.textAlign = 'left';
  const words = str.split(' '), sp = x.measureText(' ').width, ws = words.map((w) => x.measureText(w).width);
  const total = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
  let px = o.align === 'left' ? X : X - total / 2;
  words.forEach((w, i) => {
    const k = ease((t - t0 - i * (o.per ?? 0.07)) / 0.3);
    if (k > 0) {
      x.globalAlpha = k * (o.a ?? 1); x.fillStyle = (o.accent || []).includes(i) ? (o.acol || PEACH) : color;
      x.filter = k < 0.98 ? 'blur(' + ((1 - k) * 9).toFixed(1) + 'px)' : 'none';
      x.fillText(w, px, Y + (1 - k) * 26);
    }
    px += ws[i] + sp;
  });
  x.restore();
}
function label(x, str, X, Y, size, color, a = 1, align = 'center', ls = 3) {
  x.save(); x.font = '500 ' + size + 'px Plex'; x.letterSpacing = ls + 'px'; x.textAlign = align; x.fillStyle = color; x.globalAlpha = a; x.fillText(str, X, Y); x.restore();
}
function checkMark(x, bx, by, bs, k, col) {
  if (k <= 0) return; x.save(); x.strokeStyle = col; x.lineWidth = bs * 0.16; x.lineCap = 'round'; x.lineJoin = 'round';
  const p = [[bx + bs * 0.24, by + bs * 0.52], [bx + bs * 0.43, by + bs * 0.7], [bx + bs * 0.78, by + bs * 0.3]];
  x.beginPath(); x.moveTo(...p[0]);
  const k1 = clamp(k / 0.4), k2 = clamp((k - 0.4) / 0.6);
  x.lineTo(lerp(p[0][0], p[1][0], k1), lerp(p[0][1], p[1][1], k1)); if (k2 > 0) x.lineTo(lerp(p[1][0], p[2][0], k2), lerp(p[1][1], p[2][1], k2));
  x.stroke(); x.restore();
}
// targeting chip (cream world): o {size, blur, tick, a, grey}
function chip(x, str, X, Y, o = {}) {
  const size = o.size || 44; x.save(); x.font = '500 ' + size + 'px Plex'; x.letterSpacing = '1px';
  const h = size * 1.75, bs = size * 0.7, w = x.measureText(str).width + bs + size * 1.4;
  x.globalAlpha = o.a ?? 1; if ((o.blur || 0) > 0.3) x.filter = 'blur(' + o.blur.toFixed(1) + 'px)';
  const col = o.grey ? GREY : INK;
  rrx(x, X - w / 2, Y - h / 2, w, h, h / 2); x.fillStyle = o.grey ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.7)'; x.fill();
  x.lineWidth = 2; x.strokeStyle = col; x.stroke();
  const bx = X - w / 2 + size * 0.55, by = Y - bs / 2;
  rrx(x, bx, by, bs, bs, 7); const tk = o.grey ? 0 : (o.tick ?? 1);
  if (tk > 0) { x.fillStyle = PEACH; x.globalAlpha *= clamp(tk * 3); x.fill(); x.globalAlpha = o.a ?? 1; } else { x.strokeStyle = col; x.stroke(); }
  checkMark(x, bx, by, bs, tk, '#fff');
  x.fillStyle = col; x.textAlign = 'left'; x.fillText(str, bx + bs + size * 0.4, Y + size * 0.36);
  x.restore(); return w;
}
// small dark mono tag with peach leader (the reasons a card works)
function tag(x, str, X, Y, a = 1, size = 40) {
  x.save(); x.globalAlpha = a; x.font = '500 ' + size + 'px Plex'; x.letterSpacing = '3px'; const w = x.measureText(str).width + size * 1.2, h = size * 1.6;
  rrx(x, X - w / 2, Y - h / 2, w, h, 10); x.fillStyle = INK; x.fill(); x.fillStyle = CREAM; x.textAlign = 'center'; x.fillText(str, X, Y + size * 0.36); x.restore();
}

// ---------- the audience panel (dark UI) ----------
const AUD = ['Age 25–34', 'Interests: 9 selected', 'Location: 25 km', 'Lookalike 1%', 'Exclude past buyers', 'Device: mobile', 'Gender: all', 'Placements: feeds'];
function drawPanel(x, X, Y) {
  const w = 800, h = 820;
  x.save(); x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 60; x.shadowOffsetY = 20; rrx(x, X, Y, w, h, 34); x.fillStyle = '#1C1612'; x.fill(); x.restore();
  x.save(); rrx(x, X, Y, w, h, 34); x.strokeStyle = 'rgba(255,240,228,.10)'; x.lineWidth = 2; x.stroke();
  x.font = '600 44px Body'; x.fillStyle = CREAM; x.textAlign = 'left'; x.fillText('Audience', X + 56, Y + 96);
  x.font = '500 26px Plex'; x.letterSpacing = '2px'; x.fillStyle = 'rgba(246,241,231,.45)'; x.fillText('DEFINE WHO SEES YOUR AD', X + 56, Y + 140); x.letterSpacing = '0px';
  AUD.forEach((s, i) => {
    const y = Y + 200 + i * 66, bs = 34;
    x.fillStyle = 'rgba(255,240,228,.05)'; rrx(x, X + 40, y - 27, w - 80, 54, 14); x.fill();
    rrx(x, X + 60, y - bs / 2, bs, bs, 8); x.fillStyle = PEACH; x.fill(); checkMark(x, X + 60, y - bs / 2, bs, 1, '#fff');
    x.font = '500 32px Body'; x.fillStyle = 'rgba(246,241,231,.88)'; x.fillText(s, X + 120, y + 11);
  });
  x.font = '500 26px Plex'; x.letterSpacing = '3px'; const pw = 420;
  rrx(x, X + w / 2 - pw / 2, Y + h - 104, pw, 58, 29); x.strokeStyle = PEACH; x.lineWidth = 2; x.stroke();
  x.fillStyle = PEACH; x.textAlign = 'center'; x.fillText('AUDIENCE: PERFECT', X + w / 2, Y + h - 66); x.restore();
}

// ---------- the feed card (hero = the coffee cup ad) ----------
// state: 'normal' | 'vague' | 'sharp'. Returns layout rects.
function heroCard(x, X, Y, w, state, o = {}) {
  const head = 72, strip = 118, img = w * 1.05, foot = 112, h = head + strip + img + foot;
  x.save(); if (o.blur > 0.3) x.filter = 'blur(' + o.blur.toFixed(1) + 'px)';
  x.save(); x.shadowColor = 'rgba(60,40,20,.18)'; x.shadowBlur = 50; x.shadowOffsetY = 18; rrx(x, X, Y, w, h, 30); x.fillStyle = '#FFFDF9'; x.fill(); x.restore();
  x.save(); rrx(x, X, Y, w, h, 30); x.clip();
  x.fillStyle = '#E9E2D6'; x.beginPath(); x.arc(X + 44, Y + 36, 18, 0, TAU); x.fill(); x.fillRect(X + 76, Y + 26, 150, 12); x.fillRect(X + 76, Y + 44, 90, 9);
  x.font = '500 20px Body'; x.fillStyle = '#A59D90'; x.textAlign = 'right'; x.fillText('Sponsored', X + w - 26, Y + 44);
  const sy = Y + head;
  if (state === 'normal') { x.fillStyle = '#E9E2D6'; x.fillRect(X + 28, sy + 30, w * 0.7, 18); x.fillRect(X + 28, sy + 64, w * 0.45, 18); }
  if (state === 'vague') { x.font = '500 ' + Math.round(w * 0.058) + 'px Body'; x.fillStyle = '#6F665B'; x.textAlign = 'left'; x.fillText('Discover our new collection.', X + 28, sy + 70); }
  if (state === 'sharp') { x.font = '800 ' + Math.round(w * 0.09) + 'px Body'; x.letterSpacing = '-1px'; x.fillStyle = INK; x.textAlign = 'left'; x.fillText('Your 7am, upgraded.', X + 28, sy + 80); x.letterSpacing = '0px'; }
  const iy = sy + strip;
  if (state === 'vague') {
    x.fillStyle = '#EDE6DA'; x.fillRect(X, iy, w, img);
    pic(x, IMG.p_cup, X + w * 0.22, iy + img * 0.2, w * 0.56, img * 0.6, 1.0, 0.5, 0.55);
  } else pic(x, IMG.p_cup, X, iy, w, img, state === 'sharp' ? 1.7 : 1.15, 0.5, state === 'sharp' ? 0.55 : 0.5);
  const fy = iy + img;
  if (o.metric) {
    x.font = '500 40px Plex'; x.letterSpacing = '2px'; x.textAlign = 'left'; x.fillStyle = INK; x.globalAlpha = o.metricA ?? 1; x.fillText('PURCHASES  0', X + 28, fy + 70); x.globalAlpha = 1;
  } else {
    x.fillStyle = state === 'vague' ? '#CFC8BC' : INK; rrx(x, X + 24, fy + 24, w - 48, foot - 48, 14); x.fill();
    x.font = '600 ' + Math.round(w * 0.045) + 'px Body'; x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText('Shop now', X + w / 2, fy + foot / 2 + 10);
  }
  x.restore(); x.restore();
  return { X, Y, w, h, head: [X, sy, w, strip], img: [X, iy, w, img], foot: [X, fy, w, foot] };
}
function cardH(w) { return 72 + 118 + w * 1.05 + 112; }
function genericCard(x, X, Y, w, k) {   // other ads in the feed: shirt, lamp, laptop
  const imgs = [IMG.p_shirt, IMG.p_cup, IMG.p_lamp, IMG.p_laptop], head = 72, strip = 118, img = w * 1.05, foot = 112, h = head + strip + img + foot;
  if (k === 1) return heroCard(x, X, Y, w, 'normal');
  x.save(); rrx(x, X, Y, w, h, 30); x.fillStyle = '#FFFDF9'; x.fill(); x.clip();
  x.fillStyle = '#E9E2D6'; x.beginPath(); x.arc(X + 44, Y + 36, 18, 0, TAU); x.fill(); x.fillRect(X + 76, Y + 26, 150, 12);
  x.fillRect(X + 28, Y + head + 30, w * 0.6, 18); x.fillRect(X + 28, Y + head + 64, w * 0.38, 18);
  pic(x, imgs[((k % 4) + 4) % 4], X, Y + head + strip, w, img, 1.1);
  x.fillStyle = INK; rrx(x, X + 24, Y + head + strip + img + 24, w - 48, foot - 48, 14); x.fill(); x.restore();
}
// phone with a scrolling feed. pos = px scrolled; hero lands with its top at the screen top + 40 when pos = FEED_HERO
const PH = { x: 200, y: 370, w: 680, h: 1300 };
const CW = PH.w - 60, PITCH = cardH(CW) + 36, FEED_HERO = PITCH;
function phone(x, pos, vel, state, o = {}) {
  x.save(); x.shadowColor = 'rgba(60,40,20,.22)'; x.shadowBlur = 70; x.shadowOffsetY = 26; rrx(x, PH.x, PH.y, PH.w, PH.h, 72); x.fillStyle = '#FBF8F2'; x.fill(); x.restore();
  x.save(); rrx(x, PH.x, PH.y, PH.w, PH.h, 72); x.lineWidth = 5; x.strokeStyle = INK; x.stroke(); x.clip();
  const draw = (c, p) => {
    for (let k = -2; k < 4; k++) {
      const y = PH.y + 40 + k * PITCH - p;
      if (y > PH.y + PH.h || y + PITCH < PH.y) continue;
      if (k === 1) heroCard(c, PH.x + 30, y, CW, state, o); else genericCard(c, PH.x + 30, y, CW, k);
    }
  };
  // motion blur: each sample is rendered to its own layer, then averaged (no white build-up, no ghost stacking)
  const smear = Math.abs(vel) * 0.022, n = Math.min(64, 1 + Math.ceil(smear / 1.5));
  if (n <= 1) draw(x, pos); else for (let i = 0; i < n; i++) { fb.setTransform(1, 0, 0, 1, 0, 0); fb.clearRect(0, 0, W, H); draw(fb, Math.round(pos - vel * (i / n) * 0.022)); x.globalAlpha = 1 / (i + 1); x.drawImage(FB, 0, 0); }
  x.globalAlpha = 1; x.restore();
  x.save(); rrx(x, PH.x + PH.w / 2 - 70, PH.y + 18, 140, 30, 15); x.fillStyle = INK; x.fill(); x.restore();
}

// ---------- shots ----------
const S = {};
S.hook = (x, t) => {
  darkBG(x, 0.2);
  const k = ease(t / 0.35); x.save(); x.globalAlpha = 1; drawPanelInto(t); x.drawImage(PNL, 0, (1 - k) * 60); x.restore();
  build(x, 'Perfect targeting is', W / 2, 420, 112, CREAM, 0.03, t, { per: 0.055 });
  build(x, 'killing your ads.', W / 2, 540, 112, CREAM, 0.25, t, { per: 0.055, accent: [2] });
};
function drawPanelInto() { pn.clearRect(0, 0, W, H); drawPanel(pn, 140, 640); }
S.slice = (x, t) => {
  darkBG(x, 0.24); drawPanelInto();
  const u = t - T0.slice, p = clamp(u / 0.2), d = 46 * expo((u - 0.1) / 0.4);
  // cut line through the panel centre, lower-left to upper-right
  const cxp = 540, cyp = 1120, ang = -0.62, dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
  const half = (side) => { x.save(); x.translate(side * nx * d, side * ny * d); x.beginPath(); const L2 = 2000; x.moveTo(cxp - dx * L2, cyp - dy * L2); x.lineTo(cxp + dx * L2, cyp + dy * L2);
    x.lineTo(cxp + dx * L2 + side * nx * L2, cyp + dy * L2 + side * ny * L2); x.lineTo(cxp - dx * L2 + side * nx * L2, cyp - dy * L2 + side * ny * L2); x.closePath(); x.clip();
    x.drawImage(PNL, 0, 0); x.restore(); };
  // glow through the gap
  const gq = x.createRadialGradient(cxp, cyp, 0, cxp, cyp, 500); gq.addColorStop(0, 'rgba(255,122,89,' + 0.35 * clamp(d / 46) + ')'); gq.addColorStop(1, 'rgba(255,122,89,0)'); x.fillStyle = gq; x.fillRect(0, 0, W, H);
  half(1); half(-1);
  if (p < 1 || u < 0.35) { x.save(); x.strokeStyle = WARM; x.shadowColor = PEACH; x.shadowBlur = 30; x.lineWidth = 4; x.globalAlpha = clamp(1.4 - u * 3);
    x.beginPath(); x.moveTo(cxp - dx * 700, cyp - dy * 700); x.lineTo(cxp - dx * 700 + dx * 1400 * p, cyp - dy * 700 + dy * 1400 * p); x.stroke(); x.restore(); }
  build(x, 'Perfect targeting is', W / 2, 420, 112, CREAM, -9, t); build(x, 'killing your ads.', W / 2, 540, 112, CREAM, -9, t, { accent: [2] });
};
const CHIPS3 = [['AGE 25–34', 'list:age', 380], ['INTERESTS: 9 SELECTED', 'list:interests', 540], ['LOCATION: 25 KM', 'list:location', 700]];
S.chips = (x, t) => {
  creamBG(x);
  let i = 0; CHIPS3.forEach((c, j) => { if (t >= A[c[1]] - 0.02) i = j; });
  const u = t - Math.max(T0.chips, A[CHIPS3[i][1]]);
  // soft chips drifting behind
  [['LOOKALIKE 1%', 230, 640], ['DEVICE: MOBILE', 820, 760], ['GENDER: ALL', 260, 1260], ['PLACEMENTS: FEEDS', 790, 1380]].forEach(([s2, X, Y], j) =>
    chip(x, s2, X + Math.sin(t + j) * 10, Y - t * 16, { size: 34, blur: 9, a: 0.4 }));
  const slide = -22 * (1 - expo(u / 0.45));
  x.save(); x.translate(slide, 0); chip(x, CHIPS3[i][0], 540, 960, { size: 58, blur: 14 * (1 - ease(u / 0.22)), tick: clamp((u - 0.12) / 0.2) }); x.restore();
};
const CHIPS8 = [['AGE 25–34', 300, 420, 0.9], ['INTERESTS: 9 SELECTED', 600, 560, 1], ['LOCATION: 25 KM', 330, 700, 0.7], ['LOOKALIKE 1%', 730, 800, 0.5],
  ['EXCLUDE PAST BUYERS', 330, 1180, 1], ['DEVICE: MOBILE', 700, 1290, 0.8], ['GENDER: ALL', 270, 1420, 0.6], ['PLACEMENTS: FEEDS', 690, 1490, 0.9]];
function chipField(x, t, o = {}) {
  CHIPS8.forEach(([s2, X, Y, depth], j) => {
    const drift = (t - (o.t0 ?? 0)) * (12 + depth * 18);
    const g2 = o.grey ? clamp((t - o.greyAt - j * 0.07) / 0.15) : 0;
    chip(x, s2, X, Y - drift, { size: Math.round(26 + depth * 14), blur: o.sharp ? 0 : Math.abs(depth - 0.85) * 9, a: o.a ?? 1, grey: g2 > 0.5, tick: 1 });
  });
}
S.everybox = (x, t) => { creamBG(x); chipField(x, t, { t0: T0.everybox }); build(x, 'Every box ticked.', W / 2, 1000, 104, INK, T0.everybox + 0.05, t, { per: 0.18 }); };
S.feed = (x, t) => {
  creamBG(x); const u = t - T0.feed, d = T0.nobody - T0.feed, k = u / d;
  const pos = lerp(-260, FEED_HERO - 150, k * k), vel = (FEED_HERO + 110) * 2 * k / d;
  phone(x, pos, vel, 'normal'); build(x, 'And still,', W / 2, 305, 84, INK, T0.feed, t, { per: 0.1 });
};
S.nobody = (x, t) => {
  creamBG(x); const u = t - T0.nobody;
  const pos = FEED_HERO - 150 * Math.exp(-u * 26), vel = 3900 * Math.exp(-u * 26);
  const blink = u > 0.35 && u < 0.6 ? 0.3 : 1;
  phone(x, pos, vel, 'normal', { metric: true, metricA: clamp(u / 0.12) * blink });
  build(x, 'Nobody buys.', W / 2, 305, 96, INK, T0.nobody, t, { per: 0.12 });
};
S.prompt = (x, t) => {
  const u = t - T0.prompt; darkBG(x, 0.2 * ease(u / 0.6));
  const bx = 110, by = 860, bw = 860, bh = 220;
  x.save(); x.shadowColor = 'rgba(255,122,89,.25)'; x.shadowBlur = 80; rrx(x, bx, by, bw, bh, 44); x.fillStyle = '#1A1512'; x.fill(); x.restore();
  rrx(x, bx, by, bw, bh, 44); x.strokeStyle = 'rgba(214,200,186,.35)'; x.lineWidth = 2; x.stroke();
  const str = 'who should see this ad?', t0 = T0.prompt + 0.2, n = t < t0 ? 0 : Math.min(str.length, 1 + Math.floor((t - t0) / 0.035));
  x.save(); x.font = '58px Display'; x.fillStyle = CREAM; x.textAlign = 'left'; x.fillText(str.slice(0, n), bx + 52, by + 96);
  const cw = x.measureText(str.slice(0, n)).width; if (Math.floor(t * 2.5) % 2 === 0 || n < str.length) x.fillRect(bx + 56 + cw, by + 52, 3, 58); x.restore();
  const press = t > SEND && t < SEND + 0.12 ? 0.88 : 1, sbx = bx + bw - 76, sby = by + bh - 70;
  x.save(); x.translate(sbx, sby); x.scale(press, press); x.fillStyle = CREAM; x.beginPath(); x.arc(0, 0, 34, 0, TAU); x.fill();
  x.strokeStyle = WB; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(0, 13); x.lineTo(0, -13); x.moveTo(-11, -2); x.lineTo(0, -13); x.lineTo(11, -2); x.stroke(); x.restore();
  const gk = eio((t - (SEND - 0.4)) / 0.38), mx = lerp(900, sbx + 10, gk), my = lerp(1460, sby + 12, gk);
  if (t > SEND - 0.45) { x.save(); x.translate(mx, my); x.scale(1.5, 1.5); x.fillStyle = '#fff'; x.strokeStyle = WB; x.lineWidth = 2; x.beginPath();
    x.moveTo(0, 0); x.lineTo(0, 30); x.lineTo(8, 23); x.lineTo(14, 36); x.lineTo(19, 33); x.lineTo(13, 21); x.lineTo(24, 21); x.closePath(); x.fill(); x.stroke(); x.restore(); }
  build(x, "Here's why.", W / 2, 640, 96, CREAM, T0.prompt, t, { per: 0.12 });
};
function cardAt(w) { return { X: (W - w) / 2, Y: 920 - cardH(w) / 2 }; }
S.scan = (x, t) => {
  creamBG(x); const u = t - T0.scan, w = 600, p = cardAt(w);
  const r = heroCard(x, p.X, p.Y, w, 'normal');
  const sy = r.Y + r.h * clamp(u / 1.0);
  if (u < 1.05) { x.save(); const q = x.createLinearGradient(0, sy - 60, 0, sy); q.addColorStop(0, 'rgba(255,122,89,0)'); q.addColorStop(1, 'rgba(255,122,89,.35)'); x.fillStyle = q; x.fillRect(r.X - 20, sy - 60, r.w + 40, 60);
    x.fillStyle = INK; x.fillRect(r.X - 30, sy - 1.5, r.w + 60, 3); x.restore(); }
  label(x, 'META + TIKTOK', W / 2, 330, 40, INK, ease(u / 0.25), 'center', 6);
};
const TAGS = [['HOOK', 'head', -1, 0.0], ['FIRST SECOND', 'img', 1, 0.35], ['OFFER', 'foot', -1, 0.7]];
function tagPositions(r, k) {
  return TAGS.map(([s2, part, side], i) => {
    const rc = r[part], ox = part === 'foot' ? rc[0] + rc[2] * 0.25 : rc[0] + rc[2] / 2, oy = rc[1] + rc[3] / 2;
    return { s: s2, ox, oy, tx: lerp(ox, W / 2 + side * (i === 1 ? 130 : 215), k[i]), ty: oy + (i === 1 ? -120 : i === 2 ? 80 : 0) * k[i] };
  });
}
S.tags = (x, t) => {
  creamBG(x); const u = t - T0.tags, w = 600, p = cardAt(w);
  const r = heroCard(x, p.X, p.Y, w, 'normal', { blur: 5 * ease(u / 0.5) });
  const ks = TAGS.map((tg) => expo((u - 0.1 - tg[3]) / 0.5));
  tagPositions(r, ks).forEach((tp, i) => { if (ks[i] <= 0) return;
    x.save(); x.strokeStyle = PEACH; x.lineWidth = 3; x.beginPath(); x.moveTo(tp.ox, tp.oy); x.lineTo(tp.tx, tp.ty); x.stroke(); x.fillStyle = PEACH; x.beginPath(); x.arc(tp.ox, tp.oy, 8, 0, TAU); x.fill(); x.restore();
    tag(x, tp.s, tp.tx, tp.ty, clamp(ks[i] * 3), 40); });
  build(x, 'It learns from your ad,', W / 2, 390, 72, INK, A['learns:algorithm'] + 0.13, t, { per: 0.24, accent: [4] });
};
// organic branches growing from three roots
const BR = (() => { const out2 = []; let sd = 11; const rr2 = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; };
  const roots = [[250, 760], [250, 980], [250, 1200]];
  roots.forEach(([X, Y], ri) => { let segs = [[X, Y, 0, 0]];
    for (let depth = 0; depth < 3; depth++) { const next = []; segs.forEach(([x0, y0, a0]) => { const nb = depth === 0 ? 2 : 1 + (rr2() > 0.5 ? 1 : 0);
      for (let b = 0; b < nb; b++) { const a = a0 + (rr2() - 0.5) * 0.9 + (b - (nb - 1) / 2) * 0.55; const len = 170 - depth * 25 + rr2() * 40;
        const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len * 0.9; out2.push({ x0, y0, x1, y1, cx: (x0 + x1) / 2 + (rr2() - 0.5) * 50, cy: (y0 + y1) / 2 + (rr2() - 0.5) * 50, depth, ri }); next.push([x1, y1, a]); } });
      segs = next; } });
  return out2; })();
const TIPS = [[830, 640], [870, 1000], [820, 1360]];
function branches(x, k, col = INK) {
  BR.forEach((b) => { const kk = clamp(k * 3 - b.depth); if (kk <= 0) return;
    x.save(); x.strokeStyle = col; x.lineWidth = 3.2 - b.depth * 0.7; x.lineCap = 'round'; x.beginPath(); x.moveTo(b.x0, b.y0);
    const steps = 18; for (let i = 1; i <= Math.ceil(steps * kk); i++) { const q = i / steps; const xx = (1 - q) * (1 - q) * b.x0 + 2 * (1 - q) * q * b.cx + q * q * b.x1, yy = (1 - q) * (1 - q) * b.y0 + 2 * (1 - q) * q * b.cy + q * q * b.y1; x.lineTo(xx, yy); }
    x.stroke(); if (kk >= 1) { x.fillStyle = PEACH; x.beginPath(); x.arc(b.x1, b.y1, 6, 0, TAU); x.fill(); } x.restore(); });
}
S.branch = (x, t) => {
  creamBG(x); const u = t - T0.branch;
  branches(x, ease(u / (T0.vignettes - T0.branch + 0.2)));
  [['HOOK', 250, 760], ['FIRST SECOND', 250, 980], ['OFFER', 250, 1200]].forEach(([s2, X, Y]) => tag(x, s2, X, Y, 1, 34));
  build(x, 'then finds the people', W / 2, 330, 80, INK, T0.branch, t, { per: 0.07 });
};
S.vignettes = (x, t) => {
  creamBG(x); const u = t - T0.vignettes; branches(x, 1);
  [IMG.p_gymbag, IMG.p_laptop, IMG.p_backpack].forEach((img, i) => { const k = outBack(clamp((u - 0.1 - i * 0.3) / 0.35)); if (k <= 0) return;
    const [X, Y] = TIPS[i], r = 150 * k;
    x.save(); x.strokeStyle = PEACH; x.lineWidth = 3; x.globalAlpha = clamp(k); x.beginPath(); x.moveTo(412, 980); x.quadraticCurveTo(600, Y, X - r, Y); x.stroke(); x.restore();
    x.save(); x.shadowColor = 'rgba(60,40,20,.25)'; x.shadowBlur = 40; x.beginPath(); x.arc(X, Y, r, 0, TAU); x.fillStyle = '#fff'; x.fill(); x.restore();
    x.save(); x.beginPath(); x.arc(X, Y, r - 6, 0, TAU); x.clip(); pic(x, img, X - r, Y - r, r * 2, r * 2, 1.05); x.restore(); });
  [['HOOK', 250, 760], ['FIRST SECOND', 250, 980], ['OFFER', 250, 1200]].forEach(([s2, X, Y]) => tag(x, s2, X, Y, 1, 34));
  build(x, 'it speaks to.', W / 2, 330, 80, INK, T0.vignettes, t, { per: 0.1, accent: [1] });
};
let ROOM = null;
function room() {
  if (ROOM) return ROOM; ROOM = mk(); const r = ROOM.getContext('2d');
  const q = r.createLinearGradient(0, 0, 0, 700); q.addColorStop(0, 'rgb(226,231,226)'); q.addColorStop(1, 'rgb(219,225,219)'); r.fillStyle = q; r.fillRect(0, 0, W, H);
  const ph = mk(), p2 = ph.getContext('2d'), ih = IMG.p_room.height * W / IMG.p_room.width, top = 560;
  p2.drawImage(IMG.p_room, 0, top, W, ih);
  p2.globalCompositeOperation = 'destination-in'; const m = p2.createLinearGradient(0, top, 0, top + 230); m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(1, 'rgba(0,0,0,1)');
  p2.fillStyle = m; p2.fillRect(0, 0, W, H);
  r.drawImage(ph, 0, 0); return ROOM;
}
S.wall = (x, t) => {
  x.drawImage(room(), 0, 0);
  build(x, 'Your creative', W / 2, 380, 108, INK, T0.wall + 0.02, t, { per: 0.22 });
  build(x, 'is the', W / 2, 505, 108, INK, T0.wall + 0.55, t, { per: 0.2 });
};
S.flip = (x, t) => {
  const u = t - T0.flip; x.drawImage(room(), 0, 0);
  build(x, 'Your creative is the', W / 2, 380, 70, INK, -9, t);
  x.save(); x.font = '170px Display'; x.letterSpacing = '-2px'; const str = 'targeting.', tw = x.measureText(str).width; let px = W / 2 - tw / 2;
  for (let i = 0; i < str.length; i++) { const ch = str[i], cw = x.measureText(ch).width, k = clamp((u - i * 0.02) / 0.18), sy = Math.abs(Math.cos(k * Math.PI));
    x.save(); x.translate(px + cw / 2, 560); x.scale(1, Math.max(0.02, sy)); x.fillStyle = k > 0.5 ? PEACH : INK; x.textAlign = 'center'; x.fillText(ch, 0, 0); x.restore(); px += cw; }
  x.restore();
};
function vagueLayout(x, t, state, o = {}) {
  creamBG(x);
  const top = [['AGE 25–34', 300, 410], ['INTERESTS: 9 SELECTED', 700, 410], ['LOCATION: 25 KM', 300, 490], ['LOOKALIKE 1%', 760, 490]];
  const bot = [['EXCLUDE PAST BUYERS', 330, 1418], ['DEVICE: MOBILE', 780, 1418], ['GENDER: ALL', 300, 1490], ['PLACEMENTS: FEEDS', 740, 1490]];
  top.concat(bot).forEach(([s2, X, Y], j) => { const gk = o.greyAt ? clamp((t - o.greyAt - j * 0.07) / 0.12) : 0; chip(x, s2, X, Y, { size: 28, grey: gk > 0.5, tick: 1, a: 1 - gk * 0.4 }); });
  const w = 480, h = cardH(w), X = (W - w) / 2, Y = 960 - h / 2;
  const drop = o.drop ?? 1;
  return heroCard(x, X, Y - (1 - drop) * 140, w, state, { blur: o.blur || 0 });
}
S.vague = (x, t) => { const u = t - T0.vague; vagueLayout(x, t, 'vague', { drop: ease(u / 0.25) }); build(x, 'Vague ad?', W / 2, 335, 96, INK, T0.vague, t, { per: 0.12 }); };
S.greyout = (x, t) => { vagueLayout(x, t, 'vague', { greyAt: T0.greyout + 0.08 }); build(x, 'No audience can save it.', W / 2, 335, 80, INK, T0.greyout, t, { per: 0.08 }); };
S.sharp = (x, t) => {
  const u = t - T0.sharp; const r = vagueLayout(x, t, 'sharp', { blur: 12 * (1 - ease(u / 0.27)) });
  const k = ease((u - 0.2) / 0.45);
  if (k > 0) { x.save(); x.strokeStyle = PEACH; x.lineWidth = 6; x.shadowColor = PEACH; x.shadowBlur = 20; const per = 2 * (r.w + r.h);
    x.setLineDash([per * k, per]); rrx(x, r.X - 10, r.Y - 10, r.w + 20, r.h + 20, 36); x.stroke(); x.restore(); }
  [['HOOK', r.X - 60, r.head[1] + 50], ['FIRST SECOND', r.X + r.w - 40, r.img[1] + r.img[3] / 2], ['OFFER', r.X - 60, r.foot[1] + 56]].forEach(([s2, X, Y], i) => {
    const kk = expo((u - 0.3 - i * 0.08) / 0.2); if (kk > 0) tag(x, s2, lerp(i === 1 ? X + 120 : X - 120, X, kk), Y, clamp(kk * 2), 30); });
  build(x, 'Sharp hook?', W / 2, 335, 96, INK, T0.sharp, t, { per: 0.12, accent: [0] });
};
S.feedstop = (x, t) => {
  creamBG(x); const u = t - T0.feedstop, land = 0.6;
  const pos = u < land ? lerp(-900, FEED_HERO, ease(u / land)) : FEED_HERO, vel = u < land ? (FEED_HERO + 900) * 3 * Math.pow(1 - u / land, 2) / land : 0;
  phone(x, pos, vel, 'sharp');
  if (u > land) { const pk = clamp((u - land) / 0.5); x.save(); x.strokeStyle = PEACH; x.globalAlpha = 1 - pk; x.lineWidth = 6 + pk * 10; x.shadowColor = PEACH; x.shadowBlur = 30;
    rrx(x, PH.x + 30 - pk * 12, PH.y + 40 - pk * 12, CW + pk * 24, cardH(CW) + pk * 24, 34); x.stroke(); x.restore();
    x.save(); rrx(x, PH.x + PH.w / 2 - 70, PH.y + 18, 140, 30, 15); x.fillStyle = INK; x.fill(); x.restore(); }
  build(x, 'Now it knows who to find.', W / 2, 305, 80, INK, T0.feedstop, t, { per: 0.07, accent: [5] });
};
const FLY = ['HOOK', 'FIRST SECOND', 'ANGLE', 'OFFER', 'CALL TO ACTION'], LANE = [[-160, 100], [160, -160], [-160, -160], [240, 100], [0, 0]];
S.flyby = (x, t) => {
  const u = t - T0.flyby; darkBG(x, 0.22);
  FLY.map((w2, i) => [w2, i]).reverse().forEach(([w2, i]) => { const p = (u - i * 0.11) / 0.45; if (p <= 0 || p >= 1) return;   // far words first
    const z = 3.2 * Math.pow(1 - p, 1.5) + 0.25, sc = 1 / z;   // far -> readable (~p .6) -> past camera
    x.save(); x.font = '500 90px Plex'; x.letterSpacing = '8px';
    const room = W / 2 - (Math.abs(LANE[i][0]) + x.measureText(w2).width / 2) * sc * 1.1, ex = clamp((120 - room) / 120);   // 1.1 = flyby camera zoom; ex 0 -> 1 over the last 120 px to the edge
    x.translate(W / 2 + LANE[i][0] * sc, 760 + LANE[i][1] * sc); x.scale(sc, sc); x.globalAlpha = clamp((p - 0.12) * 5) * clamp((1 - p) * 3.5) * 0.9 * (1 - 0.6 * ex);
    x.filter = 'blur(' + Math.max(Math.min(8, Math.max(0, sc - 1.3) * 4), 8 * ex).toFixed(1) + 'px)'; x.fillStyle = CREAM; x.textAlign = 'center'; x.fillText(w2, 0, 0); x.restore(); });
  build(x, 'At Mez Media,', W / 2, 1200, 110, CREAM, T0.flyby + 0.08, t, { per: 0.12, accent: [1, 2] });
};
S.redline = (x, t) => {
  const u = t - T0.redline; darkBG(x, 0.2);
  const w = 520, h = cardH(w), X = (W - w) / 2 + 300 * (1 - expo(u / 0.35)), Y = 1000 - h / 2;
  const r = heroCard(x, X, Y, w, 'vague');
  const k1 = clamp((u - 0.25) / 0.3), k2 = clamp((u - 0.75) / 0.25), k3 = clamp((u - 0.55) / 0.25);
  x.save(); x.strokeStyle = PEACH; x.lineWidth = 6; x.lineCap = 'round';
  if (k1 > 0) { x.beginPath(); const cx2 = r.X + r.w * 0.46, cy2 = r.head[1] + 62; for (let i = 0; i <= 60 * k1; i++) { const a = -2.6 + i / 60 * 6.6; const xx = cx2 + Math.cos(a) * 250 * (1 + 0.04 * Math.sin(a * 3)), yy = cy2 + Math.sin(a) * 52; i ? x.lineTo(xx, yy) : x.moveTo(xx, yy); } x.stroke(); }
  if (k2 > 0) { const ax = r.X + r.w - 170, ay = r.Y - 30, bx = r.X + r.w * 0.66, by = r.head[1] + 14; x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo(ax + 30, (ay + by) / 2, lerp(ax, bx, k2), lerp(ay, by, k2)); x.stroke();
    if (k2 >= 1) { x.beginPath(); x.moveTo(bx - 16, by - 20); x.lineTo(bx, by); x.lineTo(bx + 18, by - 16); x.stroke(); } }
  x.restore();
  if (k3 > 0) { x.save(); x.globalAlpha = k3; x.font = 'italic 64px Hand'; x.fillStyle = PEACH; x.textAlign = 'center'; x.translate(r.X + r.w - 110, r.Y - 44); x.rotate(-0.06); x.fillText('clearer hook', 0, 0); x.restore(); }
  build(x, 'We fix the ad first.', W / 2, 300, 96, CREAM, T0.redline, t, { per: 0.08, accent: [3] });
};
S.dm = (x, t) => {
  const u = t - T0.dm; darkBG(x, 0.2);
  const k = expo(u / 0.4), py = lerp(1900, 760, k);
  x.save(); rrx(x, 90, py, 900, 620, 44); x.fillStyle = '#1A1512'; x.fill(); x.strokeStyle = 'rgba(214,200,186,.22)'; x.lineWidth = 2; x.stroke();
  x.font = '500 30px Plex'; x.letterSpacing = '3px'; x.fillStyle = 'rgba(246,241,231,.5)'; x.textAlign = 'left'; x.fillText('NEW MESSAGE  ·  @mezmedia_0', 140, py + 80); x.letterSpacing = '0px';
  const sent = t > DMSEND;
  if (sent) { const sk = outBack(clamp((t - DMSEND) / 0.3)); x.save(); x.translate(900, py + 250); x.scale(sk, sk); rrx(x, -420, -60, 420, 120, 60); x.fillStyle = PEACH; x.fill();
    x.font = '600 56px Body'; x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText('TEARDOWN', -210, 20); x.restore();
    x.font = '500 26px Plex'; x.fillStyle = 'rgba(246,241,231,.5)'; x.textAlign = 'right'; x.globalAlpha = clamp((t - DMSEND - 0.2) / 0.2); x.fillText('Sent ✓', 900, py + 360); x.globalAlpha = 1; }
  rrx(x, 130, py + 440, 820, 120, 60); x.strokeStyle = 'rgba(214,200,186,.35)'; x.stroke();
  const str = 'TEARDOWN', n = sent || t < T0.dm + 0.35 ? 0 : Math.min(8, 1 + Math.floor((t - T0.dm - 0.35) / 0.07));
  x.font = '600 60px Body'; x.fillStyle = CREAM; x.textAlign = 'left'; x.fillText(str.slice(0, n), 180, py + 522);
  if (!sent && Math.floor(t * 2.5) % 2 === 0) x.fillRect(184 + x.measureText(str.slice(0, n)).width, py + 470, 3, 64);
  x.fillStyle = sent ? 'rgba(246,241,231,.3)' : CREAM; x.beginPath(); x.arc(890, py + 500, 40, 0, TAU); x.fill();
  x.strokeStyle = WB; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(890, py + 515); x.lineTo(890, py + 485); x.moveTo(877, py + 498); x.lineTo(890, py + 485); x.lineTo(903, py + 498); x.stroke();
  x.restore();
  build(x, 'DM us the word', W / 2, 420, 92, CREAM, T0.dm, t, { per: 0.08 });
};
S.cta = (x, t) => {
  darkBG(x, 0.24);
  x.save(); const u = t - T0.cta, k = ease(u / 0.35); x.globalAlpha = k; x.font = '120px Display'; x.textAlign = 'left';
  const a1 = 'DM “', a2 = 'TEARDOWN', a3 = '”', w1 = x.measureText(a1).width, w2 = x.measureText(a2).width, w3 = x.measureText(a3).width, X0 = W / 2 - (w1 + w2 + w3) / 2, Y = 900 + (1 - k) * 30;
  x.filter = k < 0.98 ? 'blur(' + ((1 - k) * 8).toFixed(1) + 'px)' : 'none';
  x.fillStyle = CREAM; x.fillText(a1, X0, Y); x.fillStyle = PEACH; x.fillText(a2, X0 + w1, Y); x.fillStyle = CREAM; x.fillText(a3, X0 + w1 + w2, Y); x.restore();
  build(x, 'for a free review of your ads', W / 2, 1020, 64, CREAM, T0.cta + 0.3, t, { per: 0.06 });
};
S.end = (x, t) => {
  const u = t - T0.end; darkBG(x, 0.16 + 0.06 * Math.sin(Math.min(u, 2.4) / 2.4 * Math.PI));
  const k = expo(u / 0.5); x.save(); x.globalAlpha = k; x.font = '800 210px Logo'; x.letterSpacing = '-11px'; x.textAlign = 'left';
  const mw = x.measureText('mez').width, dw = x.measureText('.').width, X0 = W / 2 - (mw + dw) / 2;
  x.fillStyle = CREAM; x.fillText('mez', X0, 860); x.fillStyle = PEACH; x.fillText('.', X0 + mw, 860);
  x.font = '600 46px Logo'; x.letterSpacing = '20px'; x.fillStyle = CREAM; x.textAlign = 'center'; x.fillText('MEDIA', W / 2 + 10, 940); x.restore();
  label(x, 'META + TIKTOK ADS FOR BRANDS', W / 2, 1040, 30, 'rgba(246,241,231,.6)', ease((u - 0.25) / 0.4), 'center', 4);
  x.save(); x.globalAlpha = ease((u - 0.4) / 0.4); x.font = '600 46px Body'; x.textAlign = 'left'; const p1 = 'DM “', p2 = 'TEARDOWN', p3 = '”';
  const a1 = x.measureText(p1).width, a2 = x.measureText(p2).width, a3 = x.measureText(p3).width, X1 = W / 2 - (a1 + a2 + a3) / 2;
  x.fillStyle = CREAM; x.fillText(p1, X1, 1160); x.fillStyle = PEACH; x.fillText(p2, X1 + a1, 1160); x.fillStyle = CREAM; x.fillText(p3, X1 + a1 + a2, 1160); x.restore();
  label(x, '@mezmedia_0', W / 2, 1230, 32, 'rgba(246,241,231,.6)', ease((u - 0.55) / 0.4), 'center', 2);
};

// ---------- camera: one eased move per shot ----------
const CAM = {
  hook: { z: [1, 1.03] }, slice: { z: [1.10, 1.13], p: [540, 1050] }, chips: { z: [1, 1] }, everybox: { z: [1.06, 1], e: 'expo' },
  feed: { z: [1, 1.03], p: [540, 305] }, nobody: { z: [1.03, 1.06], p: [540, 305] }, prompt: { z: [1, 1.04] }, scan: { z: [1, 1.05], p: [540, 900] },
  tags: { z: [1.12, 1.15], p: [540, 900], dx: [-30, 30], e: 'expo' }, branch: { z: [1, 1.03] }, vignettes: { z: [1.03, 1.05] },
  wall: { z: [1, 1.05], p: [540, 700] }, flip: { z: [1.35, 1.38], p: [540, 470] }, vague: { z: [1, 1.015] }, greyout: { z: [1.015, 1.03] }, sharp: { z: [1.03, 1.045] },
  feedstop: { z: [1, 1.04], p: [540, 305] }, flyby: { z: [1, 1.1] }, redline: { z: [1.03, 1.05], p: [540, 300] }, dm: { z: [1, 1.04] }, cta: { z: [1, 1.03] }, end: { z: [1.04, 1], e: 'lin' },
};
function drawShot(i, t, x) {
  const sh = SHOTS[i], cam = CAM[sh.key] || { z: [1, 1] }, d = sh.e - sh.s, k = (cam.e === 'expo' ? expo : cam.e === 'lin' ? clamp : ease)((t - sh.s) / d);
  const z = lerp(cam.z[0], cam.z[1], k), [pxp, pyp] = cam.p || [540, 960], dx = cam.dx ? lerp(cam.dx[0], cam.dx[1], k) : 0;
  x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
  x.save(); x.translate(pxp + dx, pyp); x.scale(z, z); x.translate(-pxp, -pyp);
  S[sh.key](x, t); x.restore();
}

// ---------- transitions + post ----------
const FLASHES = [FLASH, T0.cta];
window.setTime = (t) => {
  let i = 0; while (i < SHOTS.length - 1 && t >= SHOTS[i + 1].s) i++;
  const sh = SHOTS[i], u = t - sh.s;
  drawShot(i, t, cx_);
  g.setTransform(1, 0, 0, 1, 0, 0);
  const TD = 0.2;
  if (i > 0 && u < TD && ['whipL', 'whipR', 'whipU', 'slideU', 'swish', 'sweep'].includes(sh.tin)) {
    const prev = SHOTS[i - 1]; drawShot(i - 1, prev.e - 0.001 + u, px_);
    const k = eio(u / TD);
    if (sh.tin === 'sweep') {
      // diagonal warm light band reveals the new shot
      const bx = lerp(-600, W + 600, k);
      g.drawImage(PRV, 0, 0);
      g.save(); g.beginPath(); g.moveTo(bx - 400, 0); g.lineTo(bx + 200, 0); g.lineTo(bx - 400, H); g.lineTo(bx - 1000, H); g.lineTo(-2000, H); g.lineTo(-2000, 0); g.closePath(); g.clip(); g.drawImage(CUR, 0, 0); g.restore();
      g.save(); g.translate(bx - 100, H / 2); g.rotate(0.3); const q = g.createLinearGradient(-160, 0, 160, 0); q.addColorStop(0, 'rgba(255,244,236,0)'); q.addColorStop(0.5, 'rgba(255,244,236,.95)'); q.addColorStop(1, 'rgba(255,244,236,0)');
      g.fillStyle = q; g.fillRect(-160, -1400, 320, 2800); g.restore();
    } else {
      const dir = sh.tin === 'whipL' || sh.tin === 'swish' ? [-1, 0] : sh.tin === 'whipR' ? [1, 0] : [0, -1];
      const span = (dir[0] ? W : H), blur = Math.sin(k * Math.PI) * span * 0.25;
      const drawMoved = (cv, off) => { const n = Math.min(64, Math.max(6, Math.ceil(blur / 5))); for (let j = 0; j < n; j++) { g.globalAlpha = j === 0 ? 1 : 1 / (j + 1); const o2 = off + (j / n - 0.5) * blur;
          g.drawImage(cv, Math.round(dir[0] * o2), Math.round(dir[1] * o2)); } g.globalAlpha = 1; };
      g.fillStyle = WB; g.fillRect(0, 0, W, H);
      drawMoved(PRV, k * span); drawMoved(CUR, -(1 - k) * span);   // previous shot whips out, the new one follows it in
    }
  } else g.drawImage(CUR, 0, 0);
  // warm flash: 4 frames, warm-white core, peach edges, never a flat colour fill
  FLASHES.forEach((f) => { const v = 1 - Math.abs(t - f) / 0.07; if (v > 0) { const q = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 1300);
      q.addColorStop(0, 'rgba(255,248,242,' + v + ')'); q.addColorStop(0.55, 'rgba(255,232,220,' + 0.92 * v + ')'); q.addColorStop(1, 'rgba(255,150,120,' + 0.6 * v + ')'); g.fillStyle = q; g.fillRect(0, 0, W, H); } });
  g.save(); g.globalAlpha = 0.035; g.globalCompositeOperation = 'overlay'; g.drawImage(NOISE[Math.floor(t * 30) % 6], 0, 0, W, H); g.restore();
  vignette(g, 0.16);
};
