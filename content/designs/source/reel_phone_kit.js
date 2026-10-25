// Shared browser-side engine for the Apple-style phone reels (classic script, loaded after reel_kit_browser.js, whose
// W, H, clamp, lerp, IMG, NOISE, g... it uses). The builder defines SHOTS, CH, K, BLUR, FPS and RECT; each reel's scene
// adds its shots S and LIGHT (the shots whose captions are dark type on a light stage).
// Every frame is drawn by world(t); inside the BLUR windows several sub-frames are averaged (true motion blur).
// Phones are the PNGs from phone_screens.js: the screen picture is drawn under the frame, so it can scroll,
// dim and carry highlights.
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
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixc = (a, b, k) => { const A = hex(a), B = hex(b); return 'rgb(' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(k)))).join(',') + ')'; };
const jolt = (t, t0, amp = 14, d = 0.3) => { const u = t - t0; return u > 0 && u < d ? Math.sin(u * 80) * Math.exp(-u * 16) * amp : 0; };
function kf(t, keys) {                               // keyframes [[time, ...values]], eased between neighbours
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, ...a0] = keys[i], [t1, ...b0] = keys[i + 1];
    if (t <= t1) { const k = eio((t - t0) / (t1 - t0)); return a0.map((v, j) => lerp(v, b0[j], k)); }
  }
  return keys[keys.length - 1].slice(1);
}
// part r = [x, y, w, h] of a (2x) screen picture, drawn in screen px, moved by dx, dy
const part = (x, im, r, dx = 0, dy = 0) => x.drawImage(IMG[im], r[0] * 2, r[1] * 2, r[2] * 2, r[3] * 2, r[0] + dx, r[1] + dy, r[2], r[3]);
const zoomAt = (x, px, py, z) => { x.translate(px, py); x.scale(z, z); x.translate(-px, -py); };
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
  const im = IMG[scr]; x.drawImage(im, -(o.sx || 0), -(o.sy || 0), 600, im.height / 2);
  if (o.over) o.over(x);
  if (o.dim > 0) { x.fillStyle = 'rgba(245,245,247,' + o.dim + ')'; x.fillRect(0, 0, 600, 1280); }
  x.restore();
  x.drawImage(IMG[o.frame || 'frameLight'], x0 - 20 * s, y0 - 20 * s, 680 * s, 1360 * s);   // frameDark: white status bar
  x.restore();
}
function phone3d(x, p, scr, o = {}, rx = 0, ry = 0) {   // the same phone tilted back (rx) or turned (ry)
  if (Math.abs(rx) < 0.004 && Math.abs(ry) < 0.004) return phone(x, p, scr, o);
  const s = p.s, lw = Math.ceil(680 * s), lh = Math.ceil(1360 * s);
  x.save(); x.globalAlpha *= 0.32 * (o.alpha ?? 1) * (1 - Math.abs(rx)) * Math.abs(Math.cos(ry)); x.drawImage(SHADOW, p.cx - 450 * s, p.cy - 760 * s, 900 * s, 1700 * s); x.restore();
  lay.setTransform(1, 0, 0, 1, 0, 0); lay.clearRect(0, 0, LAY.width, LAY.height);
  phone(lay, P(lw / 2, lh / 2, s), scr, { ...o, alpha: 1, shadow: 0 });
  x.save(); x.globalAlpha *= o.alpha ?? 1; persp(x, LAY, lw, lh, p.cx, p.cy, lw, lh, ry, rx); x.restore();
}

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
    } else if (sh.tin === 'pushL') { x.drawImage(PA, Math.round(-W * k), 0); x.drawImage(PB, Math.round(W * (1 - k)), 0); }   // a whip to the side
    else { x.drawImage(PA, 0, Math.round(-H * k)); x.drawImage(PB, 0, Math.round(H * (1 - k))); }
  } else drawShot(x, sh, t);
}

// ---------- captions: one word at a time, just below the centre ----------
function captions(t) {
  const i = shotAt(t), sh = SHOTS[i], u = t - sh.s;
  const c = CH.find((q) => t >= q.s && t < q.e); if (!c) return;
  const text = c.text.replace(/'/g, '’');
  const seen = i > 0 && u < TD / 2 && !['none', 'cut'].includes(sh.tin) ? SHOTS[i - 1].key : sh.key, dk = !!LIGHT[seen];
  const tc = t - c.s + 1 / FPS;                      // a word is on screen from its first frame
  const k = clamp(tc / 0.06), out_ = clamp((c.e - t) / 0.07), last = !CH.find((q) => q.s === c.e), a = k * (last ? out_ : 1);
  if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.textAlign = 'center';
  setF(g, '800 172px Logo'); let size = 172; const w0 = g.measureText(text).width; if (w0 > 880) { size *= 880 / w0; setF(g, '800 ' + size + 'px Logo'); }
  g.letterSpacing = (-size * 0.045) + 'px';
  const tw = g.measureText(text).width, sc = 1.1 - 0.1 * back(clamp(tc / 0.14)), Y = 1170;
  g.translate(540, Y - size * 0.32); g.scale(sc, sc); g.translate(0, size * 0.32);
  if (c.hl) {                                        // the key words sit in a solid box
    g.fillStyle = dk ? INK : WHT; const bw = tw + size * 0.36; g.fillRect(-bw / 2, -size * 0.84, bw * expo(tc / 0.12), size * 1.08);
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
  if (typeof overlay === 'function') overlay(t);   // a reel's own crisp type over the frame (not motion-blurred)
  g.save(); g.globalAlpha = 0.025; g.globalCompositeOperation = 'overlay'; g.drawImage(NOISE[Math.floor(t * 30) % 6], 0, 0, W, H); g.restore();
  vignette(g, 0.06);
};
