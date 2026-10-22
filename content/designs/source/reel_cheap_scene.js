// Browser-side shots for reel_cheap.js (classic script; kit helpers W, H, clamp, lerp, IMG, NOISE, g... are globals).
// Every frame is drawn by world(t); inside the BLUR windows several sub-frames are averaged (true motion blur).
// Phones are the PNGs from reel_cheap_screens.js: the screen picture is drawn under the frame, so it can scroll,
// dim and carry highlights; RECT gives the screen positions (px) of the parts the edit points at.
const INK = '#1D1D1F', WHT = '#FFFFFF', LIGHTBG = '#F5F5F7', GREY = '#86868B', MID = '#3A3A3C';
const ease = (k) => 1 - Math.pow(1 - clamp(k), 3);
const expo = (k) => outExpo(clamp(k));
const eio = (k) => { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const ein = (k) => { k = clamp(k); return k * k * k; };
const back = (k) => outBack(clamp(k));
const bump = (t, t0, d = 0.35) => (t > t0 && t < t0 + d ? Math.sin(((t - t0) / d) * Math.PI) : 0);
const mkc = (w = W, h = H, rf = false) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d', rf ? { willReadFrequently: true } : undefined)]; };
const [SCN, sx_] = mkc(W, H, true), [PA, pa] = mkc(), [PB, pb] = mkc(), [LAY, lay] = mkc(760, 1460);
const BIG = [-3 * W, -3 * H, 7 * W, 7 * H];

// ---------- primitives ----------
function rrx(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }
function setF(x, f, ls = 0) { x.font = f; x.letterSpacing = ls + 'px'; }
function stage(x, dark) {                          // Apple stage: flat, with a soft light from above
  x.fillStyle = dark ? '#000' : LIGHTBG; x.fillRect(...BIG);
  const q = x.createRadialGradient(W / 2, H * 0.3, 80, W / 2, H * 0.38, 1300);
  q.addColorStop(0, dark ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.75)'); q.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = q; x.fillRect(...BIG);
}
function cam(x, cx, cy, z) { x.translate(W / 2, H / 2); x.scale(z, z); x.translate(-cx, -cy); }
// a line of type rising out of its own baseline mask
function rise(x, str, X, Y, f, color, k, ls = 0) {
  if (k <= 0) return; x.save(); setF(x, f, ls); x.textAlign = 'center';
  const m = x.measureText(str), a = m.actualBoundingBoxAscent, d = m.actualBoundingBoxDescent, w = m.width;
  x.beginPath(); x.rect(X - w / 2 - 60, Y - a - 12, w + 120, a + d + 24); x.clip();
  x.fillStyle = color; x.fillText(str, X, Y + (1 - expo(k)) * (a + d + 26)); x.restore();
}
// draw a layer (canvas region sw x sh at 0,0) as a plane tilted about its horizontal (rx) or vertical (ry) axis
function persp(x, src, sw, sh, cx, cy, w, h, ry = 0, rx = 0, P = 1800) {
  const step = 2;
  if (Math.abs(ry) >= Math.abs(rx)) {
    const c = Math.cos(ry), s = Math.sin(ry);
    for (let i = 0; i < sw; i += step) {
      const X0 = (i / sw - 0.5) * w, X1 = ((i + step) / sw - 0.5) * w;
      const k0 = P / (P + X0 * s), k1 = P / (P + X1 * s), x0 = cx + X0 * c * k0, x1 = cx + X1 * c * k1;
      const hh = h * (k0 + k1) / 2; x.drawImage(src, i, 0, step, sh, x0, cy - hh / 2, x1 - x0 + 0.8, hh);
    }
  } else {
    const c = Math.cos(rx), s = Math.sin(rx);
    for (let j = 0; j < sh; j += step) {
      const Y0 = (j / sh - 0.5) * h, Y1 = ((j + step) / sh - 0.5) * h;
      const k0 = P / (P + Y0 * s), k1 = P / (P + Y1 * s), y0 = cy + Y0 * c * k0, y1 = cy + Y1 * c * k1;
      const ww = w * (k0 + k1) / 2; x.drawImage(src, 0, j, sw, step, cx - ww / 2, y0, ww, y1 - y0 + 0.8);
    }
  }
}
function touch(x, X, Y, a, press = 0) {
  if (a <= 0) return; x.save(); x.globalAlpha = clamp(a);
  x.shadowColor = 'rgba(0,0,0,.3)'; x.shadowBlur = 24; x.beginPath(); x.arc(X, Y, 42 - 6 * press, 0, TAU); x.fillStyle = 'rgba(255,255,255,.6)'; x.fill();
  x.shadowBlur = 0; x.lineWidth = 4; x.strokeStyle = 'rgba(29,29,31,.55)'; x.stroke();
  if (press > 0 && press < 1) { x.globalAlpha = clamp(a) * (1 - press); x.beginPath(); x.arc(X, Y, 42 + 70 * press, 0, TAU); x.lineWidth = 3; x.stroke(); }
  x.restore();
}
// a rounded label centred at (cx, cy); dark = black pill with white type
function pill(x, str, cx, cy, size, dark, k = 1, o = {}) {
  if (k <= 0) return; x.save(); x.globalAlpha *= o.alpha ?? 1; x.translate(cx, cy); const sc = back(k) * (o.sc || 1); x.scale(sc, sc);
  setF(x, (o.w || 600) + ' ' + size + 'px ' + (o.f || 'Logo'), -size * 0.02);
  const tw = x.measureText(str).width, ph = size * 1.46, pw = tw + size * 1.05;
  x.save(); x.shadowColor = 'rgba(0,0,0,.16)'; x.shadowBlur = 28; x.shadowOffsetY = 10; rrx(x, -pw / 2, -ph / 2, pw, ph, ph / 2); x.fillStyle = o.bg || (dark ? INK : WHT); x.fill(); x.restore();
  if (o.line) { rrx(x, -pw / 2, -ph / 2, pw, ph, ph / 2); x.strokeStyle = '#D2D2D7'; x.lineWidth = 2; x.stroke(); }
  x.fillStyle = o.fg || (dark ? WHT : INK); x.textAlign = 'center'; x.fillText(str, 0, size * 0.35); x.restore();
}
// an outline drawing itself round rect r = [x, y, w, h] (screen px)
function ring(x, r, k, pad = 14) {
  if (k <= 0) return; const [X, Y, w, h] = r, ww = w + 2 * pad, hh = h + 2 * pad, per = 2 * (ww + hh);
  x.save(); x.strokeStyle = INK; x.lineWidth = 5; x.lineCap = 'round'; x.setLineDash([per * clamp(k), per + 10]); rrx(x, X - pad, Y - pad, ww, hh, Math.min(22, hh / 2)); x.stroke(); x.restore();
}
const CHECK = (x, cx, cy, r, k, inv) => {            // round success badge with a tick
  if (k <= 0) return; x.save(); x.translate(cx, cy); const s = back(k); x.scale(s, s);
  x.beginPath(); x.arc(0, 0, r, 0, TAU); x.fillStyle = inv ? WHT : INK; x.fill();
  x.strokeStyle = inv ? INK : WHT; x.lineWidth = r * 0.17; x.lineCap = 'round'; x.lineJoin = 'round';
  x.beginPath(); x.moveTo(-r * 0.42, r * 0.02); x.lineTo(-r * 0.12, r * 0.32); x.lineTo(r * 0.45, -r * 0.3); x.stroke(); x.restore();
};

// ---------- the phone ----------
let SHADOW = null;
const P = (cx, cy, s) => ({ cx, cy, s });
const lerpP = (a, b, k) => ({ cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), s: a.s * Math.pow(b.s / a.s, k) });
const toSlide = (p, X, Y) => [p.cx - 300 * p.s + X * p.s, p.cy - 640 * p.s + Y * p.s];   // screen px on phone p -> slide px
function phone(x, p, scr, o = {}) {
  const { cx, cy, s } = p, x0 = cx - 320 * s, y0 = cy - 660 * s;
  x.save(); x.globalAlpha *= o.alpha ?? 1;
  const sh = o.shadow ?? 1;
  if (sh > 0) { x.save(); x.globalAlpha *= 0.32 * sh; x.drawImage(SHADOW, x0 - 130 * s, y0 - 100 * s, 900 * s, 1700 * s); x.restore(); }
  x.save(); rrx(x, x0 + 20 * s, y0 + 20 * s, 600 * s, 1280 * s, 92 * s); x.clip(); x.translate(x0 + 20 * s, y0 + 20 * s); x.scale(s, s);
  x.fillStyle = WHT; x.fillRect(0, 0, 600, 1280);
  const im = IMG[scr]; x.drawImage(im, 0, -(o.sy || 0), 600, im.height / 2);
  if (o.over) o.over(x);
  if (o.dim > 0) { x.fillStyle = 'rgba(245,245,247,' + o.dim + ')'; x.fillRect(0, 0, 600, 1280); }
  x.restore();
  x.drawImage(IMG.frameLight, x0 - 20 * s, y0 - 20 * s, 680 * s, 1360 * s);
  x.restore();
}
function phone3d(x, p, scr, o = {}, rx = 0) {        // the same phone tilted back about its horizontal axis
  if (Math.abs(rx) < 0.004) return phone(x, p, scr, o);
  const s = p.s, lw = Math.ceil(680 * s), lh = Math.ceil(1360 * s);
  x.save(); x.globalAlpha *= 0.32 * (o.alpha ?? 1) * (1 - Math.abs(rx)); x.drawImage(SHADOW, p.cx - 450 * s, p.cy - 760 * s, 900 * s, 1700 * s); x.restore();
  lay.setTransform(1, 0, 0, 1, 0, 0); lay.clearRect(0, 0, LAY.width, LAY.height);
  phone(lay, P(lw / 2, lh / 2, s), scr, { ...o, alpha: 1, shadow: 0 });
  x.save(); x.globalAlpha *= o.alpha ?? 1; persp(x, LAY, lw, lh, p.cx, p.cy, lw, lh, 0, rx); x.restore();
}

// ---------- layouts ----------
const DUO = { A: P(290, 652, 0.55), B: P(790, 652, 0.55) };
const HERO_A = P(540, 700, 0.82), HERO_B = P(650, 700, 0.82);
const A_PRICES = ['$25', '$22', '$19', '$17', '$15'];
const PRICE = [RECT.a.price[0], RECT.a.price[1] + 16, RECT.a.price[2] - 4, RECT.a.price[3] - 30];   // the "$25" glyphs, not its line box
const WAR = [[150, 400, '$24'], [440, 450, '$20'], [118, 870, '$18'], [462, 905, '$16']];
const toast = (x, k) => { if (k <= 0) return; x.save(); x.translate(300, 1146); const s = back(k); x.scale(s, s);   // "Booked" on B's screen
  rrx(x, -150, -42, 300, 84, 42); x.fillStyle = INK; x.fill(); setF(x, '600 36px Body'); x.fillStyle = WHT; x.textAlign = 'center'; x.fillText('✓  Booked', 0, 13); x.restore(); };
function labels(x, a) {
  if (a <= 0) return; x.save(); x.globalAlpha = a; setF(x, '600 60px Logo', -1); x.textAlign = 'center'; x.fillStyle = GREY;
  x.fillText('A', DUO.A.cx, 272); x.fillText('B', DUO.B.cx, 272); x.restore();
}

// ---------- shots ----------
const S = {};
S.open = (x, t) => {
  stage(x, false);
  // the written hook: on screen from the very first frame, then up and away as the ads arrive
  const go = clamp((t - K.titleOut) / 0.42);
  if (go < 1) { x.save(); x.globalAlpha = 1 - ease(go); x.translate(0, -320 * ein(go));
    const z = 1 + 0.03 * clamp(t / 0.9); x.translate(540, 780); x.scale(z, z); x.translate(-540, -780);
    const LINES = [[['The cheaper', GREY]], [['business ', GREY], ['lost', INK]], [['the customer.', INK]]];
    setF(x, '600 100px Logo', -3.3); const wid = (ln) => ln.reduce((m, [str]) => m + x.measureText(str).width, 0);
    const fs = 100 * Math.min(1.45, 900 / Math.max(...LINES.map(wid))); setF(x, '600 ' + fs + 'px Logo', -fs * 0.033); x.textAlign = 'left';
    LINES.forEach((ln, i) => { let X = 540 - wid(ln) / 2; ln.forEach(([str, col]) => { x.fillStyle = col; x.fillText(str, X, 780 + (i - 1) * fs * 1.06 + fs * 0.36); X += x.measureText(str).width; }); }); x.restore(); }
  // the two ads spring up from below, tilted back
  const kin = (d) => clamp((t - K.phonesIn - d) / 0.62);
  const ka = kin(0), kb = kin(0.08);
  const dimA = 0.55 * ease((t - K.tap - 0.1) / 0.4), sA = DUO.A.s * lerp(1, 0.94, ease((t - K.tap - 0.1) / 0.5)), bounceB = 1 + 0.05 * bump(t, K.tap, 0.32);
  const pA = P(DUO.A.cx, lerp(1750, DUO.A.cy, back(ka)), sA), pB = P(DUO.B.cx, lerp(1750, DUO.B.cy, back(kb)), DUO.B.s * bounceB);
  if (ka > 0) phone3d(x, pA, 'a', { dim: dimA }, (1 - ease(ka)) * 0.75);
  if (kb > 0) phone3d(x, pB, 'b', { over: (c) => toast(c, (t - K.tap - 0.08) / 0.3) }, (1 - ease(kb)) * 0.75);
  labels(x, ease((t - K.phonesIn - 0.35) / 0.3));
  const ap = clamp((t - K.same) / 0.3); if (ap > 0) { x.save(); x.globalAlpha = ease(ap); setF(x, '600 96px Logo'); x.textAlign = 'center'; x.fillStyle = GREY; x.fillText('≈', 540, 672); x.restore(); }
  pill(x, '$25', DUO.A.cx, 560, 62, true, (t - K.price) / 0.3, { alpha: 1 - 0.5 * dimA / 0.55 });
  pill(x, '$60', DUO.B.cx, 560, 62, false, (t - K.price2) / 0.3, { sc: 1 + 0.12 * bump(t, K.expensive, 0.4) });
  // the customer taps "Book" on B
  const [bx, by] = toSlide(pB, 300, 970), tk = (t - (K.tap - 0.45)) / 0.8;
  if (tk > 0 && tk < 1) touch(x, lerp(980, bx, ease(tk * 1.8)), lerp(1300, by, ease(tk * 1.8)), Math.sin(tk * Math.PI) * 1.4, clamp((t - K.tap) / 0.3));
};

S.a_ad = (x, t) => {
  stage(x, false);
  const u = t - T0.a_ad, k = eio(u / 0.55), push = 1 + 0.02 * ease((u - 0.55) / 1.3);
  const from = P(DUO.A.cx, DUO.A.cy, DUO.A.s * 0.94), pA = lerpP(from, HERO_A, k); pA.s *= push;
  const pB = lerpP(DUO.B, P(1450, 700, DUO.B.s), ein(clamp(u / 0.45)));
  phone(x, pB, 'b', { alpha: 1 - ease(u / 0.45), over: (c) => toast(c, 1) });
  phone(x, pA, 'a', { dim: 0.55 * (1 - ease(u / 0.35)), over: (c) => ring(c, PRICE, (t - K.low) / 0.38, 12) });
  const fade = 1 - ease(u / 0.3);
  labels(x, fade); x.save(); x.globalAlpha = fade; setF(x, '600 96px Logo'); x.textAlign = 'center'; x.fillStyle = GREY; x.fillText('≈', 540, 672); x.restore();
  pill(x, '$25', lerp(DUO.A.cx, 540, k), lerp(560, 420, k), 62, true, 1, { alpha: fade });
  pill(x, '$60', lerp(DUO.B.cx, 1400, k), 560, 62, false, 1, { alpha: fade });
};

// B's callouts: a label on the left, a thin line to the outline on the screen
function callout(x, p, r, str, k) {
  if (k <= 0) return; const [sx, sy] = toSlide(p, r[0] - 18, r[1] + r[3] / 2), edge = toSlide(p, 0, 0)[0] - 34, a = ease(k);
  x.save(); x.globalAlpha = a; x.strokeStyle = INK; x.lineWidth = 3; x.beginPath(); x.moveTo(sx - 4, sy); x.lineTo(lerp(sx - 4, edge, a), sy); x.stroke(); x.restore();
  x.save(); x.globalAlpha = a; setF(x, '600 36px Body'); const tw = x.measureText(str).width, pw = tw + 38, cx = edge - pw / 2;
  pill(x, str, cx + (1 - a) * 30, sy, 36, false, k, { w: 600, f: 'Body', line: true }); x.restore();
}
S.b_ad = (x, t) => {
  stage(x, false);
  const u = t - T0.b_ad, k = eio(u / 0.5), push = 1 + 0.02 * ease((u - 0.5) / 3.4);
  const aEnd = P(HERO_A.cx, HERO_A.cy, HERO_A.s * 1.02), pA = lerpP(aEnd, P(-460, HERO_A.cy, HERO_A.s), k);
  const pB = lerpP(P(1560, HERO_B.cy, HERO_B.s), HERO_B, k); pB.s *= push;
  phone(x, pA, 'a', { over: (c) => ring(c, PRICE, 1, 12) });
  phone(x, pB, 'b', { over: (c) => { ring(c, RECT.b.who, (t - K.who) / 0.38); ring(c, RECT.b.prob, (t - K.what) / 0.38, 12); } });
  callout(x, pB, RECT.b.who, 'Who it’s for', (t - K.who - 0.15) / 0.3);
  callout(x, pB, RECT.b.prob, 'Problem it solves', (t - K.what - 0.15) / 0.3);
};

S.compare = (x, t) => {
  stage(x, false);
  const u = t - T0.compare, k = eio(u / 0.55);
  const bEnd = P(HERO_B.cx, HERO_B.cy, HERO_B.s * 1.02), bv = eio((t - K.value) / 0.45);
  const pB = lerpP(bEnd, DUO.B, k); pB.s *= 1 + 0.12 * bv; pB.cy -= 10 * bv;
  const war = K.war.filter((q) => t >= q).length, shake = K.war.reduce((m, q) => m + bump(t, q, 0.18), 0);
  const dimA = 0.5 * bv, pA = lerpP(P(-420, DUO.A.cy, DUO.A.s), DUO.A, k); pA.cx += Math.sin(t * 90) * 5 * shake;
  phone(x, pA, 'a', { dim: dimA });
  phone(x, pB, 'b', { over: (c) => { ring(c, RECT.b.who, 1); ring(c, RECT.b.prob, 1, 12); } });
  labels(x, k * (1 - bv));
  // A drops its price again and again; other cheap offers crowd round it
  WAR.forEach(([X, Y, str], i) => pill(x, str, X, Y, 40, false, (t - K.war[i] - 0.04) / 0.28, { alpha: 1 - 0.6 * bv, fg: GREY, bg: '#E8E8ED' }));
  pill(x, A_PRICES[war], DUO.A.cx + (pA.cx - DUO.A.cx), 560, 62, true, k, { alpha: 1 - 0.5 * bv, sc: 1 + 0.1 * shake });
  pill(x, '$60', pB.cx, lerp(560, 520, bv), 62, false, k);
  const [cx, cy] = toSlide(pB, 600, 0); CHECK(x, cx - 14, cy + 6, 44, (t - K.understand) / 0.3);
};

S.lesson = (x, t) => {
  stage(x, true);
  const u = t - T0.lesson, z = 1 + 0.035 * clamp(u / 3.7);
  x.save(); cam(x, 540, 960, z);
  const mv = eio((t - K.lessonQ - 0.62) / 0.38);       // "The lesson?" moves up into a small label
  x.save(); x.translate(lerp(540, 540, mv), lerp(790, 360, mv)); const s = lerp(1, 0.46, mv); x.scale(s, s);
  rise(x, 'The lesson?', 0, 0, '600 132px Logo', mv > 0.5 ? GREY : WHT, (t - K.lessonQ + 0.05) / 0.35, -3); x.restore();
  rise(x, 'Low price', 540, 620, '600 150px Logo', WHT, (t - K.lowPrice) / 0.3, -4);
  const slam = (q) => (t < q ? 0 : 1 + 0.45 * Math.exp(-(t - q) * 14) * (t - q < 0.4 ? 1 : 0));
  const sh = (q) => { const d = t - q; return d > 0 && d < 0.3 ? Math.sin(d * 80) * Math.exp(-d * 16) * 14 : 0; };
  if (t >= K.neq) { x.save(); x.translate(540 + sh(K.neq), 790); const s2 = slam(K.neq); x.scale(s2, s2); setF(x, '600 170px Logo'); x.textAlign = 'center'; x.fillStyle = GREY; x.fillText('≠', 0, 56); x.restore(); }
  if (t >= K.attractive) { x.save(); x.translate(540 + sh(K.attractive), 905); const s3 = slam(K.attractive); x.scale(s3, s3); setF(x, '600 116px Logo', -3); x.textAlign = 'center'; x.fillStyle = WHT; x.fillText('attractive offer', 0, 40); x.restore(); }
  x.restore();
};

S.rescue = (x, t) => {
  stage(x, false);
  const u = t - T0.rescue, p = P(540, 700, 0.82 * (1 + 0.02 * clamp(u / 3)));
  const sy0 = RECT.feed.ad[1] - 104, sy = sy0 + 1150 * expo((t - K.flick) / 0.75) + 55 * Math.max(0, t - K.flick - 0.75);   // then keeps drifting, like a thumb still scrolling
  const tk = (t - (K.flick - 0.3)) / 0.75;
  phone(x, p, 'feed', { sy, over: (c) => { const q = c.createLinearGradient(0, 0, 0, 120); q.addColorStop(0, 'rgba(255,255,255,1)'); q.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = q; c.fillRect(0, 0, 600, 120); } });
  if (tk > 0 && tk < 1) { const [fx, fy] = toSlide(p, 330, lerp(1020, 330, ease((tk - 0.3) / 0.5))); touch(x, fx, fy, Math.sin(tk * Math.PI) * 1.4, clamp((tk - 0.25) / 0.2)); }
};

S.cta = (x, t) => {
  stage(x, true);
  const u = t - T0.cta;
  x.save(); cam(x, 540, 960, 1 + 0.025 * clamp(u / 3.4));
  rise(x, 'mez.', 540, 640, '800 210px Logo', WHT, (u - 0.12) / 0.45, -10);
  rise(x, 'MEDIA', 552, 722, '600 42px Logo', GREY, (u - 0.25) / 0.4, 18);
  const done = t >= K.followTap + 0.06;
  pill(x, done ? 'Following' : 'Follow', 540, 840, 46, false, (t - K.follow - 0.2) / 0.3, { w: 600, f: 'Body', bg: done ? MID : WHT, fg: done ? WHT : INK, sc: 1 - 0.06 * bump(t, K.followTap, 0.25) });
  x.globalAlpha = ease((u - 0.5) / 0.4); setF(x, '500 36px Body'); x.textAlign = 'center'; x.fillStyle = GREY; x.fillText('@mezmedia_0', 540, 950); x.globalAlpha = 1;
  const tk = (t - (K.followTap - 0.45)) / 0.85;
  if (tk > 0 && tk < 1) touch(x, lerp(900, 560, ease(tk * 1.8)), lerp(1250, 850, ease(tk * 1.8)), Math.sin(tk * Math.PI) * 1.4, clamp((t - K.followTap) / 0.3));
  x.restore();
};

// ---------- the world: shots and the transitions between them ----------
const TD = 0.3;
function drawShot(x, sh, t) { x.setTransform(1, 0, 0, 1, 0, 0); x.save(); S[sh.key](x, t); x.restore(); }
const shotAt = (t) => { let i = 0; while (i < SHOTS.length - 1 && t >= SHOTS[i + 1].s) i++; return i; };
function world(t, x) {
  const i = shotAt(t), sh = SHOTS[i], u = t - sh.s;
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1;
  if (i > 0 && u < TD && !['none', 'cut'].includes(sh.tin)) {
    const pv = SHOTS[i - 1], k = eio(u / TD);
    drawShot(pa, pv, t); drawShot(pb, sh, t);
    x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
    if (sh.tin === 'circle') {
      x.drawImage(PA, 0, 0); x.save(); x.beginPath(); x.arc(540, 960, 1150 * ein(u / TD) + 1, 0, TAU); x.clip(); x.drawImage(PB, 0, 0); x.restore();
    } else { x.drawImage(PA, 0, Math.round(-H * k)); x.drawImage(PB, 0, Math.round(H * (1 - k))); }
  } else drawShot(x, sh, t);
}

// ---------- captions: one word at a time, just below the centre ----------
const LIGHT = { open: 1, a_ad: 1, b_ad: 1, compare: 1, rescue: 1 };
function captions(t) {
  const i = shotAt(t), sh = SHOTS[i], u = t - sh.s;
  const c = CH.find((q) => t >= q.s && t < q.e); if (!c) return;
  const text = c.text.replace(/'/g, '’');
  const seen = i > 0 && u < TD / 2 && !['none', 'cut'].includes(sh.tin) ? SHOTS[i - 1].key : sh.key, dk = !!LIGHT[seen];
  const k = clamp((t - c.s) / 0.06), out_ = clamp((c.e - t) / 0.07), last = !CH.find((q) => q.s === c.e), a = k * (last ? out_ : 1);
  if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.textAlign = 'center';
  setF(g, '800 172px Logo'); let size = 172; const w0 = g.measureText(text).width; if (w0 > 880) { size *= 880 / w0; setF(g, '800 ' + size + 'px Logo'); }
  g.letterSpacing = (-size * 0.045) + 'px';
  const tw = g.measureText(text).width, sc = 1.1 - 0.1 * back(clamp((t - c.s) / 0.14)), Y = 1170;
  g.translate(540, Y - size * 0.32); g.scale(sc, sc); g.translate(0, size * 0.32);
  if (c.hl) {                                        // the key words sit in a solid box
    g.fillStyle = dk ? INK : WHT; const bw = tw + size * 0.36; g.fillRect(-bw / 2, -size * 0.84, bw * expo((t - c.s) / 0.12), size * 1.08);
    g.fillStyle = dk ? WHT : INK;
  } else { g.shadowColor = dk ? 'rgba(255,255,255,.95)' : 'rgba(0,0,0,.5)'; g.shadowBlur = 34; g.fillStyle = dk ? INK : WHT; }
  g.fillText(text, 0, 0); g.restore();
}

// ---------- frame: motion blur by sub-frame accumulation, then captions, a little grain ----------
let ACC = null;
function prepare() {
  ACC = new Uint32Array(W * H * 4);
  const [c, x] = mkc(900, 1700); x.filter = 'blur(46px)'; x.fillStyle = '#000'; rrx(x, 130, 160, 640, 1320, 110); x.fill(); SHADOW = c;
}
window.setTime = (t) => {
  let n = 1; BLUR.forEach(([a, b, m]) => { if (t >= a && t <= b) n = Math.max(n, m); });
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
  if (n <= 1) { world(t, sx_); g.drawImage(SCN, 0, 0); }
  else {
    ACC.fill(0); const shutter = 0.5 / FPS;
    for (let s = 0; s < n; s++) { world(t + ((s + 0.5) / n - 0.5) * shutter, sx_); const d = sx_.getImageData(0, 0, W, H).data; for (let j = 0; j < d.length; j++) ACC[j] += d[j]; }
    const img = g.createImageData(W, H), o = img.data; for (let j = 0; j < o.length; j++) o[j] = ACC[j] / n; g.putImageData(img, 0, 0);
  }
  captions(t);
  g.save(); g.globalAlpha = 0.025; g.globalCompositeOperation = 'overlay'; g.drawImage(NOISE[Math.floor(t * 30) % 6], 0, 0, W, H); g.restore();
  vignette(g, 0.06);
};
