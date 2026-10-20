// Browser-side shots for reel_offer.js (classic script; kit helpers W, H, clamp, lerp, IMG, NOISE, out, g... are globals).
// Every frame is drawn by world(t); inside the BLUR windows several sub-frames are averaged (true motion blur).
const INK = '#0A0A0A', WHT = '#FFFFFF', PAPER = '#F3F3F1', G1 = '#E7E7E4', G2 = '#CDCDC8', G3 = '#9A9A95', G4 = '#5C5C58', RED = '#E5484D';
const ease = (k) => 1 - Math.pow(1 - clamp(k), 3);
const expo = (k) => outExpo(clamp(k));
const eio = (k) => { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const ein = (k) => { k = clamp(k); return k * k * k; };
const back = (k) => outBack(clamp(k));
const mkc = (w = W, h = H, rf = false) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d', rf ? { willReadFrequently: true } : undefined)]; };
const [SCN, sx_] = mkc(W, H, true), [PA, pa] = mkc(), [PB, pb] = mkc(), [LAY, lay] = mkc(1200, 1500);
const BIG = [-3 * W, -3 * H, 7 * W, 7 * H];
let SHS = 1;                                       // shadow scale (0.25 while drawing the quarter-size depth-of-field pass)

// ---------- primitives ----------
function rrx(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }
function pic(x, img, x0, y0, w, h, z = 1, fx = 0.5, fy = 0.5) {
  const sc = Math.max(w / img.width, h / img.height) * z, iw = img.width * sc, ih = img.height * sc;
  let dx = x0 + w / 2 - fx * iw, dy = y0 + h / 2 - fy * ih;
  dx = Math.min(x0, Math.max(x0 + w - iw, dx)); dy = Math.min(y0, Math.max(y0 + h - ih, dy));
  x.save(); x.beginPath(); x.rect(x0, y0, w, h); x.clip(); x.drawImage(img, dx, dy, iw, ih); x.restore();
}
function cam(x, cx, cy, z, rot = 0) { x.translate(W / 2, H / 2); x.rotate(rot); x.scale(z, z); x.translate(-cx, -cy); }
function zoomAt(x, px, py, z) { x.translate(px, py); x.scale(z, z); x.translate(-px, -py); }   // push in about a fixed screen point
function paper(x, z = 1) {                         // graph paper: fine grid, a stronger line every 4 cells
  x.fillStyle = PAPER; x.fillRect(...BIG);
  x.lineWidth = 1.3 / z;
  for (let pass = 0; pass < 2; pass++) {
    x.strokeStyle = pass ? 'rgba(0,0,0,.075)' : 'rgba(0,0,0,.045)'; x.beginPath();
    for (let gx = -1440; gx <= W + 1440; gx += 48) { if ((Math.round(gx / 48) % 4 === 0) !== !!pass) continue; x.moveTo(gx, -2400); x.lineTo(gx, H + 2400); }
    for (let gy = -2400; gy <= H + 2400; gy += 48) { if ((Math.round(gy / 48) % 4 === 0) !== !!pass) continue; x.moveTo(-1440, gy); x.lineTo(W + 1440, gy); }
    x.stroke();
  }
  const q = x.createRadialGradient(W / 2, H * 0.42, 100, W / 2, H * 0.5, 1500); q.addColorStop(0, 'rgba(255,255,255,.55)'); q.addColorStop(1, 'rgba(0,0,0,.06)');
  x.fillStyle = q; x.fillRect(...BIG);
}
function dark(x, glow = 0.08) {
  x.fillStyle = '#0B0B0B'; x.fillRect(...BIG);
  const q = x.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, 1100); q.addColorStop(0, 'rgba(255,255,255,' + glow + ')'); q.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = q; x.fillRect(...BIG);
}
function card(x, X, Y, w, h, r = 36, fill = WHT, sh = 0.12) {
  x.save(); x.shadowColor = 'rgba(0,0,0,' + sh + ')'; x.shadowBlur = 60 * SHS; x.shadowOffsetY = 18 * SHS; rrx(x, X, Y, w, h, r); x.fillStyle = fill; x.fill(); x.restore();
}
function setF(x, f, ls = 0) { x.font = f; x.letterSpacing = ls + 'px'; }
// a line of type rising out of its own baseline mask
function rise(x, str, X, Y, f, color, k, align = 'center', ls = 0) {
  if (k <= 0) return; x.save(); setF(x, f, ls); x.textAlign = align;
  const m = x.measureText(str), a = m.actualBoundingBoxAscent, d = m.actualBoundingBoxDescent, w = m.width, left = align === 'left' ? X : X - w / 2;
  x.beginPath(); x.rect(left - 60, Y - a - 10, w + 120, a + d + 20); x.clip();
  x.fillStyle = color; x.fillText(str, X, Y + (1 - expo(k)) * (a + d + 24)); x.restore();
}
// hand-drawn stroke along a polyline, drawn up to fraction k, slightly uneven width
function hand(x, pts, k, w, color) {
  if (k <= 0 || pts.length < 2) return; const n = Math.max(2, Math.floor(pts.length * clamp(k)));
  x.save(); x.strokeStyle = color; x.lineCap = 'round'; x.lineJoin = 'round';
  for (let i = 1; i < n; i++) { x.lineWidth = w * (0.78 + 0.22 * Math.sin(i * 0.37)); x.beginPath(); x.moveTo(pts[i - 1][0], pts[i - 1][1]); x.lineTo(pts[i][0], pts[i][1]); x.stroke(); }
  x.restore(); return pts[n - 1];
}
// a marker loop that overshoots its start: an ellipse (n = 2) or a squarer loop (n = 4)
function ellipsePts(cx, cy, rx, ry, turns = 1.12, a0 = -2.5, wob = 0.035, n = 2) {
  const pts = [], N = 120, e = 2 / n; for (let i = 0; i <= N; i++) { const a = a0 + (i / N) * turns * TAU, r = 1 + wob * Math.sin(a * 3 + 1) + 0.02 * (i / N), c = Math.cos(a), s = Math.sin(a);
    pts.push([cx + Math.sign(c) * Math.abs(c) ** e * rx * r, cy + Math.sign(s) * Math.abs(s) ** e * ry * r]); } return pts;
}
function bezPts(p0, p1, p2, N = 50) { const pts = []; for (let i = 0; i <= N; i++) { const s = i / N; pts.push([(1 - s) ** 2 * p0[0] + 2 * (1 - s) * s * p1[0] + s * s * p2[0], (1 - s) ** 2 * p0[1] + 2 * (1 - s) * s * p1[1] + s * s * p2[1]]); } return pts; }
function arrow(x, pts, k, w, color) {             // hand-drawn arrow: the stroke, then its head at the tip
  const tip = hand(x, pts, k, w, color); if (!tip || k < 0.98) return;
  const a = pts[pts.length - 1], b = pts[pts.length - 6], ang = Math.atan2(a[1] - b[1], a[0] - b[0]);
  x.save(); x.strokeStyle = color; x.lineWidth = w; x.lineCap = 'round';
  [0.55, -0.55].forEach((o) => { x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(a[0] - Math.cos(ang + o) * w * 6, a[1] - Math.sin(ang + o) * w * 6); x.stroke(); }); x.restore();
}
function touch(x, X, Y, a, press = 0) {
  if (a <= 0) return; x.save(); x.globalAlpha = clamp(a);
  x.shadowColor = 'rgba(0,0,0,.3)'; x.shadowBlur = 24; x.beginPath(); x.arc(X, Y, 42 - 6 * press, 0, TAU); x.fillStyle = 'rgba(255,255,255,.55)'; x.fill();
  x.shadowBlur = 0; x.lineWidth = 4; x.strokeStyle = 'rgba(255,255,255,.95)'; x.stroke();
  if (press > 0 && press < 1) { x.globalAlpha = clamp(a) * (1 - press); x.beginPath(); x.arc(X, Y, 42 + 70 * press, 0, TAU); x.lineWidth = 3; x.stroke(); }
  x.restore();
}
function sweep(x, X, Y, w, h, p, a = 0.3) {
  if (p <= 0 || p >= 1) return; x.save(); x.beginPath(); x.rect(X, Y, w, h); x.clip(); x.globalCompositeOperation = 'screen';
  x.translate(X - 0.5 * w + 2 * w * eio(p), Y + h / 2); x.rotate(0.38);
  const q = x.createLinearGradient(-w * 0.15, 0, w * 0.15, 0); q.addColorStop(0, 'rgba(255,255,255,0)'); q.addColorStop(0.5, 'rgba(255,255,255,' + a * Math.sin(p * Math.PI) + ')'); q.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = q; x.fillRect(-w * 0.15, -h * 1.3, w * 0.3, h * 2.6); x.restore();
}
// draw a layer (canvas region sw x sh at 0,0) as a plane rotated about its vertical (ry) or horizontal (rx) axis
function persp(x, src, sw, sh, cx, cy, w, h, ry = 0, rx = 0, P = 1800) {
  if (Math.abs(ry) < 0.002 && Math.abs(rx) < 0.002) { x.drawImage(src, 0, 0, sw, sh, cx - w / 2, cy - h / 2, w, h); return; }
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

// ---------- the landing page (full frame 1080 x 1920; the dashboard shows it as a thumbnail) ----------
function wrap(x, str, max) { const out = []; str.split('\n').forEach((para) => { let line = ''; para.split(' ').forEach((w) => { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > max && line) { out.push(line); line = w; } else line = t; }); out.push(line); }); return out; }
const GENERIC = { h1: 'We provide\nquality services.', sub: 'Professional. Reliable. Affordable.', btn: 'Contact us', btnW: 340, logo: 0, hero: 0 };
// browser bar, a photo hero carrying the offer, then the white page below it (the captions sit on that white)
const HERO = { y: 330, h: 650 }, X0 = 110, H1Y = 590;
function page(x, st, t) {
  x.fillStyle = WHT; x.fillRect(0, 0, W, H);
  x.fillStyle = G1; rrx(x, 60, 226, 960, 78, 39); x.fill();
  setF(x, '500 30px Body'); x.fillStyle = G4; x.textAlign = 'center'; x.fillText(st.logo > 0.5 ? 'spotless.co' : 'yourbusiness.com', 540, 276);
  // hero: the stock photo, an empty slot while it is rewritten, or the spotless room wiping up over it
  x.save(); x.beginPath(); x.rect(0, HERO.y, W, HERO.h); x.clip(); x.fillStyle = '#2A2A28'; x.fillRect(0, HERO.y, W, HERO.h);
  const oa = st.heroA ?? 1;
  if (oa > 0) { x.globalAlpha = oa; pic(x, IMG.o_handshake, 0, HERO.y + (st.heroDy || 0), W, HERO.h, 1.1, 0.5, 0.38); x.globalAlpha = 1; }
  if (st.hero > 0) { x.save(); x.beginPath(); x.rect(0, HERO.y + HERO.h * (1 - st.hero), W, HERO.h); x.clip(); pic(x, IMG.o_living, 0, HERO.y, W, HERO.h, 1.06, 0.5, 0.6); x.restore(); }
  const q = x.createLinearGradient(0, HERO.y, 0, HERO.y + HERO.h); q.addColorStop(0, 'rgba(0,0,0,.46)'); q.addColorStop(0.5, 'rgba(0,0,0,.3)'); q.addColorStop(1, 'rgba(0,0,0,.6)');
  x.fillStyle = q; x.fillRect(0, HERO.y, W, HERO.h); x.restore();
  // nav
  x.save(); x.globalAlpha = 1 - st.logo; x.fillStyle = 'rgba(255,255,255,.2)'; rrx(x, X0, 362, 170, 62, 14); x.fill(); setF(x, '700 26px Body', 2); x.fillStyle = 'rgba(255,255,255,.85)'; x.textAlign = 'center'; x.fillText('LOGO', X0 + 85, 403); x.restore();
  if (st.logo > 0) { x.save(); x.globalAlpha = st.logo; setF(x, '800 54px Logo', -2); x.fillStyle = WHT; x.textAlign = 'left'; x.fillText('spotless.', X0, 412); x.restore(); }
  x.fillStyle = WHT; [374, 391, 408].forEach((y) => { rrx(x, 912, y, 62, 7, 4); x.fill(); });
  // headline: white on the photo; selected = white box, dark type
  setF(x, '800 96px Logo', -2.5); x.textAlign = 'left';
  const lines = wrap(x, st.h1, 880);
  x.fillStyle = WHT; lines.forEach((ln, i) => x.fillText(ln, X0, H1Y + i * 102));
  if (st.sel > 0) {
    x.save(); x.beginPath(); wrap(x, GENERIC.h1, 880).forEach((ln, i) => x.rect(X0 - 6, H1Y + i * 102 - 80, (x.measureText(ln).width + 12) * clamp(st.sel * 2 - i * 0.6), 102));
    x.fillStyle = WHT; x.fill(); x.clip(); x.fillStyle = INK; lines.forEach((ln, i) => x.fillText(ln, X0, H1Y + i * 102)); x.restore();
  }
  if (st.caret) { const ln = lines[lines.length - 1] || '', cw = x.measureText(ln).width; if (Math.floor(t * 2.6) % 2 === 0 || st.typing) { x.fillStyle = WHT; x.fillRect(X0 + 6 + cw, H1Y + (lines.length - 1) * 102 - 74, 6, 90); } }
  // sub line + button
  x.save(); x.globalAlpha = st.subA ?? 1; setF(x, '500 36px Body'); x.fillStyle = 'rgba(255,255,255,.82)'; x.fillText(st.sub, X0, 786); x.restore();
  if (st.btnW > 0) { x.save(); x.globalAlpha = st.btnA ?? 1; const s = st.btnS ?? 1; x.translate(X0 + st.btnW / 2, 880); x.scale(s, s);
    rrx(x, -st.btnW / 2, -50, st.btnW, 100, 50); x.fillStyle = WHT; x.fill(); x.save(); x.clip(); setF(x, '700 36px Body'); x.fillStyle = INK; x.textAlign = 'center'; x.fillText(st.btn, 0, 13); x.restore(); x.restore(); }
  // below the fold: the rest of a template page
  setF(x, '500 26px Plex', 5); x.fillStyle = G3; x.textAlign = 'left'; x.fillText('OUR SERVICES', X0, 1300);
  [X0, X0 + 293, X0 + 586].forEach((X) => { x.fillStyle = '#F4F4F2'; rrx(x, X, 1336, 274, 250, 24); x.fill(); x.fillStyle = G1; x.beginPath(); x.arc(X + 58, 1396, 28, 0, TAU); x.fill(); rrx(x, X + 30, 1456, 196, 18, 9); x.fill(); rrx(x, X + 30, 1490, 136, 18, 9); x.fill(); });
  if (st.sweep) sweep(x, 0, 0, W, H, st.sweep, 0.35);
}

// ---------- shot: dashboard + the written hook ----------
const TILES = [
  ['Amount spent', '$1,240', 0, 0, 1240, 0], ['Cost per click', '$0.58', 1, 0, 0.58, 0],
  ['Clicks', '2,138', 0, 1, 2138, 0], ['Conversion rate', '0.14%', 1, 1, 0.14, -1],
  ['Leads', '3', 0, 2, 3, -1], ['Cost per lead', '$413', 1, 2, 413, 1],
];
const TX = (c) => 110 + c * 280, TY = (r) => 1066 + r * 146, TWd = 260, THt = 132;
const THUMB = { X: 695, Y: 1096, w: 230, h: 409 };
const fmt = (v, f) => f.startsWith('$') ? (f.includes('.') ? '$' + v.toFixed(2) : '$' + Math.round(v).toLocaleString('en-US')) : f.includes('%') ? v.toFixed(2) + '%' : Math.round(v).toLocaleString('en-US');
// depth of field: the number being talked about stays sharp, the rest go soft (the caption reads over them); rack focus as the camera moves
function focusOf(t) {
  const on = Math.max(1 - clamp((t - 0.12) / 0.4), clamp((t - LN.cost.s + 0.05) / 0.3));
  const toConv = clamp((t - (K.conv - 0.2)) / 0.25), toThumb = clamp((t - (K.dive - 0.12)) / 0.15);
  return { on, 'Cost per lead': t < 1 ? 1 : 0, 'Cost per click': t < 1 ? 0 : 1 - toConv, 'Conversion rate': toConv * (1 - toThumb), thumb: toThumb };
}
function dashboard(x, t) {
  card(x, 80, 950, 920, 580, 40);
  setF(x, '700 36px Body'); x.fillStyle = INK; x.textAlign = 'left'; x.fillText('Campaign overview', 110, 1014); x.fillStyle = G1; x.fillRect(110, 1034, 860, 2);
  const cnt = 0.72 + 0.28 * ease((t - 0.1) / 0.9);
  TILES.forEach(([lab, val, c, r, num, bad]) => {
    const X = TX(c), Y = TY(r);
    x.fillStyle = '#F7F7F5'; rrx(x, X, Y, TWd, THt, 18); x.fill();
    setF(x, '500 24px Body'); x.fillStyle = G4; x.textAlign = 'left'; x.fillText(lab, X + 20, Y + 40);
    const v = lab === 'Cost per lead' ? num : num * cnt;
    setF(x, '800 54px Logo', -1); x.fillStyle = bad ? RED : INK; x.fillText(fmt(v, val), X + 20, Y + 104);
    if (bad) { const w = x.measureText(fmt(v, val)).width; x.fillStyle = RED; x.beginPath(); const ax = X + 34 + w, ay = Y + 88;
      if (bad > 0) { x.moveTo(ax, ay); x.lineTo(ax + 22, ay); x.lineTo(ax + 11, ay - 18); } else { x.moveTo(ax, ay - 18); x.lineTo(ax + 22, ay - 18); x.lineTo(ax + 11, ay); } x.fill(); }
  });
  setF(x, '500 22px Plex', 3); x.fillStyle = G3; x.textAlign = 'left'; x.fillText('AD PREVIEW', THUMB.X, THUMB.Y - 14);
  x.save(); rrx(x, THUMB.X, THUMB.Y, THUMB.w, THUMB.h, 18); x.clip(); x.translate(THUMB.X, THUMB.Y); x.scale(THUMB.w / W, THUMB.w / W); page(x, GENERIC, t); x.restore();
  x.save(); rrx(x, THUMB.X, THUMB.Y, THUMB.w, THUMB.h, 18); x.strokeStyle = G2; x.lineWidth = 2; x.stroke(); x.restore();
  // "fine": cheap clicks are not the problem; the conversion rate is
  const ck = back((t - K.cpc) / 0.3);
  if (ck > 0) { x.save(); x.translate(TX(1) + 196, TY(0) + 44); x.scale(ck, ck); rrx(x, -50, -22, 100, 44, 22); x.fillStyle = INK; x.fill();
    setF(x, '700 22px Body'); x.fillStyle = WHT; x.textAlign = 'center'; x.fillText('✓ fine', 0, 8); x.restore(); }
  hand(x, bezPts([TX(1) + 16, TY(1) + 118], [TX(1) + 120, TY(1) + 126], [TX(1) + 236, TY(1) + 114], 30), ease((t - K.conv) / 0.25), 6, RED);
}
const HEAD_Y = { l1: 400, box: [440, 700], l3: 792, l4: 884 };
function heading(x, t) {
  rise(x, 'I’d fix', 540, HEAD_Y.l1, '800 132px Logo', INK, (t - 0.1) / 0.3, 'center', -4);
  const bk = expo((t - K.thisSlam + 0.06) / 0.18), sk = t < K.thisSlam ? 0 : 1 + 0.5 * Math.exp(-(t - K.thisSlam) * 18) * (t - K.thisSlam < 0.25 ? 1 : 0);
  if (bk > 0) { setF(x, '800 300px Logo', -10); const w = x.measureText('THIS').width + 80; x.fillStyle = INK; x.fillRect(540 - w / 2, HEAD_Y.box[0], w * bk, HEAD_Y.box[1] - HEAD_Y.box[0]); }
  if (t >= K.thisSlam) { x.save(); x.translate(540, 576); const s = Math.max(1, sk); x.scale(s, s); setF(x, '800 300px Logo', -10); x.textAlign = 'center'; x.fillStyle = WHT; x.fillText('THIS', 0, 104); x.restore(); }
  rise(x, 'before spending another', 540, HEAD_Y.l3, '800 74px Logo', INK, (t - K.thisSlam - 0.12) / 0.3, 'center', -2);
  rise(x, 'dollar on ads.', 540, HEAD_Y.l4, '800 74px Logo', INK, (t - K.thisSlam - 0.22) / 0.3, 'center', -2);
}
// THIS points at the offer in the ad preview (drawn over the dashboard)
function marks(x, t) {
  arrow(x, bezPts([852, 866], [1004, 940], [905, 1062], 50), ease((t - K.arrow) / 0.3), 7, INK);
  hand(x, ellipsePts(THUMB.X + THUMB.w / 2, THUMB.Y + THUMB.h / 2, 150, 246, 1.1, -2.2, 0.025, 4), ease((t - K.circle) / 0.35), 7, INK);
}
// camera for the dashboard shot: zoomed on the red number -> out to the heading -> the metrics -> into the ad preview
function dashCam(t) {
  const tile = (c, r) => [TX(c) + TWd / 2, TY(r) + THt / 2];
  const up = (p, z) => [p[0], p[1] + 200 / z];      // frame a tile at y ~760, above the caption band
  const keys = [[0, ...tile(1, 2), 3.2], [0.12, ...tile(1, 2), 3.15], [0.62, 540, 960, 1], [LN.cost.s, 540, 985, 1.05], [LN.cost.s + 0.42, ...up(tile(1, 0), 1.85), 1.85],
    [K.conv - 0.25, ...up([TX(1) + TWd / 2 - 10, TY(0) + THt / 2 + 6], 1.88), 1.88], [K.conv + 0.05, ...up(tile(1, 1), 1.9), 1.9], [K.dive, ...up([TX(1) + TWd / 2 + 8, TY(1) + THt / 2], 1.92), 1.92]];
  if (t >= K.dive) {                                 // fly into the ad preview: it fills the frame exactly at the cut
    const k = ein((t - K.dive) / (LN.offer.s - K.dive)), [, ax, ay, az] = keys[keys.length - 1], bz = W / THUMB.w;
    const z = az * Math.pow(bz / az, k); const f = (z - az) / (bz - az);
    return [lerp(ax, THUMB.X + THUMB.w / 2, f), lerp(ay, THUMB.Y + THUMB.h / 2, f), z];
  }
  let i = 0; while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
  if (i >= keys.length - 1) return keys[keys.length - 1].slice(1);
  const [t0, x0, y0, z0] = keys[i], [t1, x1, y1, z1] = keys[i + 1], k = i === 1 ? 1 - Math.pow(1 - eio((t - t0) / (t1 - t0)), 2) : eio((t - t0) / (t1 - t0));
  return [lerp(x0, x1, k), lerp(y0, y1, k), z0 * Math.pow(z1 / z0, k)];
}
const S = {};
const [SM, sm] = mkc(W / 4, H / 4), [SM2, sm2] = mkc(W / 4, H / 4);
function dashScene(x, t, cx, cy, z, shx, shy) {
  x.save(); x.translate(shx, shy); cam(x, cx, cy, z); paper(x, z); heading(x, t); dashboard(x, t); marks(x, t); const m = x.getTransform(); x.restore(); return m;
}
S.dash = (x, t) => {
  const [cx, cy, z] = dashCam(t), f = focusOf(t);
  let shx = 0, shy = 0; const d = t - K.thisSlam; if (d > 0 && d < 0.3) { const m = Math.exp(-d * 16) * 14; shx = Math.sin(d * 90) * m; shy = Math.cos(d * 70) * m; }
  const m = dashScene(x, t, cx, cy, z, shx, shy);
  if (f.on < 0.02) return;
  // depth of field: a quarter-size render, blurred, laid over everything but the element in focus (cheap next to a full-frame blur)
  SHS = 0.25; sm.setTransform(0.25, 0, 0, 0.25, 0, 0); dashScene(sm, t, cx, cy, z, shx, shy); SHS = 1;
  sm.setTransform(1, 0, 0, 1, 0, 0); sm2.setTransform(1, 0, 0, 1, 0, 0); sm2.filter = 'blur(2.5px)'; sm2.drawImage(SM, 0, 0); sm2.filter = 'none';
  const reg = [], add = (X, Y, w, h, wt) => { if (wt <= 0) return; const p = [[X, Y], [X + w, Y + h]].map(([a, b]) => m.transformPoint(new DOMPoint(a, b))); reg.push([p[0].x, p[0].y, p[1].x, p[1].y, wt]); };
  TILES.forEach(([lab, , c, r]) => add(TX(c), TY(r), TWd, THt, f[lab] || 0));
  add(THUMB.X - 40, THUMB.Y - 40, THUMB.w + 80, THUMB.h + 80, f.thumb);
  const veil = (a) => { if (a <= 0.01) return; x.globalAlpha = a; x.drawImage(SM2, 0, 0, W, H); x.globalAlpha = a * 0.3; x.fillStyle = PAPER; x.fillRect(0, 0, W, H); };
  x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.imageSmoothingQuality = 'high';
  x.save(); x.beginPath(); x.rect(0, 0, W, H); reg.forEach(([a, b, c2, d2]) => x.rect(a, b, c2 - a, d2 - b)); x.clip('evenodd'); veil(f.on); x.restore();
  reg.forEach(([a, b, c2, d2, wt]) => { x.save(); x.beginPath(); x.rect(a, b, c2 - a, d2 - b); x.clip(); veil(f.on * (1 - wt)); x.restore(); });
  x.restore();
};

// ---------- shot: the landing page, THIS circled ----------
S.page = (x, t) => {                               // drifts up a touch while pushing in about the caption, so the white band stays clean
  const u = t - T0.page, k = eio(u / 1.9);
  x.save(); x.translate(0, -34 * k); zoomAt(x, 540, 1115, 1 + 0.035 * k); page(x, GENERIC, t);
  hand(x, ellipsePts(464, 614, 405, 131, 1.08, -2.6, 0.025, 4), ease((t - K.offerCircle) / 0.36), 8, WHT);
  const lk = clamp((t - K.offerCircle - 0.3) / 0.25);
  if (lk > 0) { x.save(); x.globalAlpha = lk; setF(x, 'italic 110px Hand'); x.fillStyle = WHT; x.textAlign = 'left'; x.translate(722, 912); x.rotate(-0.08); x.fillText('this.', 0, 0); x.restore(); }
  arrow(x, bezPts([790, 826], [770, 790], [742, 754], 24), ease((t - K.offerCircle - 0.42) / 0.18), 7, WHT);
  x.restore();
};

// ---------- shot: nobody wakes up wanting it ----------
const PHN = { w: 640, h: 1320 };
// shrink a line to fit, down to a floor, then cut it with an ellipsis the way iOS does
function fit(c, str, font, size, floor, max) {
  let s = size; setF(c, font.replace('#', s)); while (s > floor && c.measureText(str).width > max) setF(c, font.replace('#', --s));
  if (c.measureText(str).width <= max) return str;
  while (str.length > 1 && c.measureText(str + '…').width > max) str = str.slice(0, -1); return str.trimEnd() + '…';
}
function lockScreen(c, sx, sy, sw, sh, t) {
  c.save(); c.filter = 'blur(26px) brightness(.45)'; pic(c, IMG.o_sleep, sx - 40, sy - 40, sw + 80, sh + 80, 1.0, 0.55, 0.5); c.restore();
  c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(sx, sy, sw, sh);
  c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,.9)'; setF(c, '600 32px Body'); c.fillText('Tuesday 21 October', sx + sw / 2, sy + 128);
  setF(c, '600 210px Logo', -6); c.fillStyle = WHT; c.fillText('7:00', sx + sw / 2, sy + 316);
  const dk = t - K.notif;
  if (dk > 0) {
    const drop = back(dk / 0.38), sw2 = t > K.swipe ? ein((t - K.swipe) / 0.3) : 0;
    const nx = sx + 22 + sw2 * sw * 1.1, ny = sy + 360 - (1 - drop) * 220, nw = sw - 44, nh = 196;
    c.save(); c.globalAlpha = clamp(dk / 0.12) * (1 - sw2 * 0.6); c.translate(nx + nw / 2, ny + nh / 2); c.rotate(sw2 * 0.12); c.translate(-nx - nw / 2, -ny - nh / 2);
    c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 40; rrx(c, nx, ny, nw, nh, 36); c.fillStyle = 'rgba(244,244,242,.92)'; c.fill(); c.shadowBlur = 0;
    c.fillStyle = INK; rrx(c, nx + 24, ny + 26, 74, 74, 18); c.fill(); setF(c, '800 44px Logo'); c.fillStyle = WHT; c.textAlign = 'center'; c.fillText('Q', nx + 61, ny + 79);
    c.textAlign = 'left'; setF(c, '600 23px Body', 0.5); c.fillStyle = G4; c.fillText('QUALITY SERVICES CO.', nx + 118, ny + 52);
    setF(c, '500 23px Body'); c.fillStyle = G3; c.textAlign = 'right'; c.fillText('now', nx + nw - 26, ny + 52);
    const tw = nw - 118 - 28; c.textAlign = 'left';
    c.fillStyle = INK; c.fillText(fit(c, 'We provide quality services.', '700 #px Body', 31, 26, tw), nx + 118, ny + 100);
    c.fillStyle = G4; c.fillText(fit(c, 'Contact us today for a free quote!', '500 #px Body', 27, 24, tw), nx + 118, ny + 142);
    c.restore();
    const tk = (t - (K.swipe - 0.22)) / 0.55;
    if (tk > 0 && tk < 1) touch(c, lerp(sx + sw * 0.3, sx + sw * 1.05, ein(clamp((tk - 0.35) / 0.65))), sy + 360 + nh / 2, Math.sin(tk * Math.PI) * 1.3, clamp((tk - 0.25) / 0.3));
  }
  c.save(); rrx(c, sx + sw / 2 - 66, sy + sh - 34, 132, 9, 5); c.fillStyle = 'rgba(255,255,255,.8)'; c.fill(); c.restore();
  const off = clamp((t - K.lock) / 0.12); if (off > 0) { c.fillStyle = 'rgba(0,0,0,' + 0.92 * off + ')'; c.fillRect(sx, sy, sw, sh); }
}
function phoneLayer(c, ox, oy, w, h, screen) {      // the phone drawn into a layer at (ox, oy)
  const r = w * 0.14, b = w * 0.032;
  c.save(); rrx(c, ox, oy, w, h, r); c.fillStyle = '#050505'; c.fill(); rrx(c, ox + 1, oy + 1, w - 2, h - 2, r); c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 2; c.stroke(); c.restore();
  const sx = ox + b, sy = oy + b, sw = w - 2 * b, sh = h - 2 * b;
  c.save(); rrx(c, sx, sy, sw, sh, r - b); c.clip(); screen(c, sx, sy, sw, sh); c.restore();
  c.save(); rrx(c, ox + w / 2 - sw * 0.15, sy + sw * 0.03, sw * 0.3, sw * 0.085, sw * 0.045); c.fillStyle = '#000'; c.fill(); c.restore();
}
S.wake = (x, t) => {
  const u = t - T0.wake;
  x.save(); cam(x, 540, 960, 1 + 0.04 * clamp(u / 2.3)); pic(x, IMG.o_sleep, 0, 0, W, H, 1.05, 0.56, 0.5); x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(0, 0, W, H); x.restore();
  const k = expo(u / 0.5), M = 30;
  lay.setTransform(1, 0, 0, 1, 0, 0); lay.clearRect(0, 0, LAY.width, LAY.height);
  phoneLayer(lay, M, M, PHN.w, PHN.h, (c, sx, sy, sw, sh) => lockScreen(c, sx, sy, sw, sh, t));
  const py = 1060 + (1 - k) * 900;
  x.save(); x.globalAlpha = 0.55 * k; x.filter = 'blur(40px)'; x.fillStyle = '#000'; rrx(x, 540 - PHN.w / 2 + 20, py - PHN.h / 2 + 50, PHN.w - 40, PHN.h, 90); x.fill(); x.restore();
  persp(x, LAY, PHN.w + 2 * M, PHN.h + 2 * M, 540, py, PHN.w + 2 * M, PHN.h + 2 * M, 0, -(1 - k) * 0.9);
};

// ---------- shot: problem -> solved slider ----------
function chip(x, str, X, Y, k, inv) {
  if (k <= 0) return; x.save(); x.translate(X, Y); x.scale(back(k), back(k)); setF(x, '500 46px Plex', 6); const w = x.measureText(str).width + 76;
  rrx(x, 0, -46, w, 92, 46); x.fillStyle = inv ? WHT : INK; x.fill(); x.fillStyle = inv ? INK : WHT; x.textAlign = 'left'; x.fillText(str, 38, 16); x.restore();
}
S.problem = (x, t) => {
  const u = t - T0.problem, sl = eio((t - K.solved) / 0.45) * 1.06;
  x.save(); cam(x, 540, 960, 1.04 + 0.05 * clamp(u / 1.7));
  pic(x, IMG.o_mess, -40, -40, W + 80, H + 80, 1.0, 0.5, 0.5);
  if (sl > 0) { x.save(); x.beginPath(); x.rect(-40, -40, (W + 80) * sl, H + 80); x.clip(); pic(x, IMG.o_kitchen, -40, -40, W + 80, H + 80, 1.0, 0.45, 0.5); x.restore(); }
  x.restore();
  const lx = W * sl;
  if (sl > 0 && sl < 1.05) { x.save(); x.fillStyle = WHT; x.shadowColor = 'rgba(0,0,0,.4)'; x.shadowBlur = 20; x.fillRect(lx - 3, 0, 6, H);
    x.beginPath(); x.arc(lx, 960, 46, 0, TAU); x.fill(); x.shadowBlur = 0; x.fillStyle = INK;
    [[-1, -14], [1, 14]].forEach(([d, o]) => { x.beginPath(); x.moveTo(lx + o + d * 12, 960); x.lineTo(lx + o - d * 4, 948); x.lineTo(lx + o - d * 4, 972); x.fill(); }); x.restore(); }
  x.save(); const q = x.createLinearGradient(0, 0, 0, 640); q.addColorStop(0, 'rgba(0,0,0,.45)'); q.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = q; x.fillRect(0, 0, W, 640); x.restore();
  if (sl < 0.55) chip(x, 'PROBLEM', 90, 420, (t - K.problemTag) / 0.25, false);
  else chip(x, 'SOLVED ✓', 90, 420, (t - K.solved - 0.25) / 0.25, true);
};

// ---------- shot: stop advertising what you do -> start communicating why it matters ----------
const NEW = { h1: 'Come home to a\nspotless house.', sub: 'Booked in 60 seconds. Done in 3 hours.', btn: 'See tomorrow’s slots →' };
function rewriteState(t) {
  const st = { ...GENERIC, sel: 0, caret: false, subA: 1, btnA: 1, heroA: 1, hero: 0, logo: 0 };
  if (t >= K.select && t < K.erase) st.sel = clamp((t - K.select) / 0.18);
  if (t >= K.erase) {
    const n = GENERIC.h1.length, gone = Math.min(n, Math.floor((t - K.erase) / 0.26 * n));
    st.h1 = GENERIC.h1.slice(0, n - gone); st.caret = true; st.typing = gone < n;
    st.subA = 1 - clamp((t - K.erase) / 0.2); st.btnA = st.subA; st.heroDy = 260 * ein(clamp((t - K.erase - 0.05) / 0.3)); st.heroA = 1 - clamp((t - K.erase - 0.1) / 0.25);
  }
  if (t >= K.type) {
    const n = Math.min(NEW.h1.length, Math.floor((t - K.type) / 0.68 * NEW.h1.length) + 1); st.h1 = NEW.h1.slice(0, n); st.caret = true; st.typing = n < NEW.h1.length;
    st.sub = NEW.sub; st.subA = clamp((t - (K.hero - 0.1)) / 0.25);
  }
  if (t >= K.hero - 0.05) { st.heroA = 0; st.hero = expo((t - K.hero) / 0.4); }
  if (t >= K.hero - 0.25) st.logo = clamp((t - (K.hero - 0.25)) / 0.25);
  if (t >= K.button) { const k = expo((t - K.button) / 0.35); st.btn = NEW.btn; st.btnW = lerp(120, 560, k); st.btnA = clamp(k * 3); st.btnS = 0.9 + 0.1 * back((t - K.button) / 0.3); st.caret = false; }
  else if (t >= K.erase) st.btnW = GENERIC.btnW;
  st.sweep = (t - K.button - 0.25) / 0.6;
  return st;
}
S.rewrite = (x, t) => {
  const u = t - T0.rewrite;
  x.save(); zoomAt(x, 540, 1115, 1.02 + 0.03 * eio(u / 3.7)); page(x, rewriteState(t), t); x.restore();
};

// ---------- shot: targeting can't fix it ----------
function person(x, X, Y, s, fill) {
  x.save(); x.translate(X, Y); x.scale(s, s); x.lineWidth = 4 / s; x.strokeStyle = fill ? WHT : 'rgba(255,255,255,.55)'; x.fillStyle = WHT;
  x.beginPath(); x.arc(0, -22, 16, 0, TAU); fill ? x.fill() : x.stroke();
  x.beginPath(); x.moveTo(-30, 34); x.quadraticCurveTo(-30, 2, 0, 2); x.quadraticCurveTo(30, 2, 30, 34); x.closePath(); fill ? x.fill() : x.stroke(); x.restore();
}
const CROWD = []; for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) CROWD.push([160 + c * 190 + (r % 2) * 36 - 18, 540 + r * 185]);
const LOCKED = [6, 12, 3], ROWA = [1, 1, 1, 0.4, 0.22, 0.1];        // the audience fades out under the caption
S.target = (x, t) => {
  dark(x, 0.07);
  const u = t - T0.target, fail = clamp((t - K.fail) / 0.15);
  x.save(); cam(x, 540, 960, 1 + 0.05 * clamp(u / 1.9), -0.012 * clamp(u / 1.9));
  setF(x, '500 32px Plex', 5); x.fillStyle = 'rgba(255,255,255,.65)'; x.textAlign = 'left'; x.fillText('AUDIENCE  2.4M', 110, 390);
  x.textAlign = 'right'; x.fillStyle = fail > 0 ? RED : 'rgba(255,255,255,.65)'; x.fillText(fail > 0 ? 'LEADS  0' : 'TARGETING  ✓', 970, 390);
  CROWD.forEach(([X, Y], i) => { const li = LOCKED.indexOf(i), on = li >= 0 && t >= K.locks[li] && fail < 1; x.globalAlpha = ROWA[Math.floor(i / 5)]; person(x, X, Y, 1.7, on); }); x.globalAlpha = 1;
  // reticle glides between the locked faces, then onto the offer
  const keys = [[T0.target, 540, 720]].concat(LOCKED.map((i, j) => [K.locks[j], ...CROWD[i]]), [[K.fail - 0.2, 540, 722]]);
  let j = 0; while (j < keys.length - 1 && t >= keys[j + 1][0]) j++;
  const ka = keys[j], kb = keys[Math.min(j + 1, keys.length - 1)], kk = kb === ka ? 1 : eio((t - ka[0]) / (kb[0] - ka[0]));
  const rx = lerp(ka[1], kb[1], kk), ry = lerp(ka[2], kb[2], kk);
  let pulse = 0; K.locks.concat([K.fail]).forEach((q) => { if (t >= q) pulse = Math.max(pulse, Math.exp(-(t - q) * 12)); });
  const rs = 124 + 40 * pulse;
  x.save(); x.strokeStyle = fail > 0 ? RED : WHT; x.lineWidth = 5;
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => { x.beginPath(); x.moveTo(rx + a * rs, ry + b * (rs - 34)); x.lineTo(rx + a * rs, ry + b * rs); x.lineTo(rx + a * (rs - 34), ry + b * rs); x.stroke(); });
  x.beginPath(); x.moveTo(rx - 18, ry); x.lineTo(rx + 18, ry); x.moveTo(rx, ry - 18); x.lineTo(rx, ry + 18); x.stroke(); x.restore();
  // the vague offer drops into the crosshair and breaks
  const ok = expo((t - (K.fail - 0.3)) / 0.25);
  if (ok > 0) {
    const g2 = fail > 0 && fail < 1 ? 1 : 0;
    for (let s = 0; s < (g2 ? 5 : 1); s++) {
      x.save(); if (g2) { x.beginPath(); x.rect(0, 640 + s * 36, W, 36); x.clip(); x.translate(Math.sin(s * 7 + t * 90) * 26, 0); }
      x.globalAlpha = ok * (1 - 0.55 * fail); card(x, 270, 650, 540, 150, 26, WHT, 0.4);
      setF(x, '700 38px Body'); x.fillStyle = INK; x.textAlign = 'center'; x.fillText('We provide quality services.', 540, 738); x.restore();
    }
    if (fail > 0) { x.save(); x.strokeStyle = RED; x.lineWidth = 10; x.lineCap = 'round'; const k2 = ease((t - K.fail) / 0.2);
      x.beginPath(); x.moveTo(330, 660); x.lineTo(lerp(330, 750, k2), lerp(660, 790, k2)); x.stroke();
      if (k2 > 0.5) { const k3 = (k2 - 0.5) * 2; x.beginPath(); x.moveTo(750, 660); x.lineTo(lerp(750, 330, k3), lerp(660, 790, k3)); x.stroke(); } x.restore(); }
  }
  x.restore();
};

// ---------- shot: BAD OFFER != MORE AD SPEND ----------
S.formula = (x, t) => {
  dark(x, 0.06);
  const d = (q) => t - q; let shx = 0;
  [K.bad, K.neq + 0.12, K.spend].forEach((q) => { const e = d(q); if (e > 0 && e < 0.3) shx += Math.sin(e * 80) * Math.exp(-e * 16) * 16; });
  x.save(); x.translate(shx, 0); cam(x, 540, 960, 1 + 0.05 * clamp(d(K.bad) / 1.6));
  const a = expo(d(K.bad) / 0.24); if (a > 0) { x.save(); setF(x, '800 168px Logo', -6); x.textAlign = 'center'; x.fillStyle = WHT; x.fillText('BAD OFFER', lerp(-700, 540, a), 500); x.restore(); }
  const n = d(K.neq); if (n > 0) { x.save(); x.translate(540, 660); const s = back(n / 0.3); x.scale(s, s); x.fillStyle = WHT;
    x.fillRect(-120, -52, 240 * ease(n / 0.15), 30); x.fillRect(-120, 22, 240 * ease((n - 0.05) / 0.15), 30);
    x.strokeStyle = WHT; x.lineWidth = 26; x.lineCap = 'butt'; const k = ease((n - 0.1) / 0.15); x.beginPath(); x.moveTo(60, -120); x.lineTo(lerp(60, -60, k), lerp(-120, 120, k)); x.stroke(); x.restore(); }
  const b = expo(d(K.spend) / 0.24); if (b > 0) { x.save(); setF(x, '800 118px Logo', -4); x.textAlign = 'center'; const tw = x.measureText('MORE AD SPEND').width;
    const cx = lerp(1700, 540, b); x.fillStyle = WHT; x.fillRect(cx - tw / 2 - 30, 770, tw + 60, 150); x.fillStyle = INK; x.fillText('MORE AD SPEND', cx, 886); x.restore(); }
  x.restore();
};

// ---------- shot: the improved ad concept + agree / disagree ----------
const AD = { w: 520 };
const adH = (w) => (92 + 172) * (w / 540) + w * 0.8;
function adCard(c, X, Y, w) {                      // the rewritten offer, as an ad
  const u = w / 540, h = adH(w), ty = Y + 92 * u + w * 0.8;
  rrx(c, X, Y, w, h, 34 * u); c.fillStyle = WHT; c.fill();
  c.save(); rrx(c, X, Y, w, h, 34 * u); c.clip();
  c.fillStyle = INK; c.beginPath(); c.arc(X + 50 * u, Y + 46 * u, 26 * u, 0, TAU); c.fill(); setF(c, '800 ' + 24 * u + 'px Logo'); c.fillStyle = WHT; c.textAlign = 'center'; c.fillText('s.', X + 50 * u, Y + 54 * u);
  c.textAlign = 'left'; setF(c, '700 ' + 27 * u + 'px Body'); c.fillStyle = INK; c.fillText('spotless.', X + 92 * u, Y + 42 * u); setF(c, '500 ' + 21 * u + 'px Body'); c.fillStyle = G3; c.fillText('Sponsored', X + 92 * u, Y + 70 * u);
  pic(c, IMG.o_living, X, Y + 92 * u, w, w * 0.8, 1.1, 0.5, 0.58);
  setF(c, '800 ' + 40 * u + 'px Logo', -1); c.fillStyle = INK; c.fillText('Come home to a', X + 30 * u, ty + 60 * u); c.fillText('spotless house.', X + 30 * u, ty + 106 * u);
  setF(c, '500 ' + 24 * u + 'px Body'); c.fillStyle = G4; c.fillText('Booked in 60 seconds. Done in 3 hours.', X + 30 * u, ty + 146 * u);
  c.restore(); return h;
}
function pill(x, str, X, Y, w, k, inv, press = 0) {
  if (k <= 0) return; x.save(); x.translate(X, Y); const s = back(k) * (1 - 0.05 * press); x.scale(s, s);
  rrx(x, -w / 2, -54, w, 108, 54); x.fillStyle = inv ? INK : WHT; x.fill(); if (!inv) { x.strokeStyle = G2; x.lineWidth = 3; x.stroke(); }
  setF(x, '700 40px Body'); x.fillStyle = inv ? WHT : INK; x.textAlign = 'center'; x.fillText(str, 0, 14); x.restore();
}
S.concept = (x, t) => {
  const u = t - T0.concept;
  x.save(); cam(x, 540, 960, 1 + 0.03 * clamp(u / 2.2)); paper(x);
  setF(x, '500 28px Plex', 6); x.fillStyle = G4; x.textAlign = 'center'; x.globalAlpha = ease((u - 0.25) / 0.3); x.fillText('AD CONCEPT · MEZ MEDIA', 540, 282); x.globalAlpha = 1;
  const k = expo(u / 0.55), h = adH(AD.w), M = 40;
  lay.setTransform(1, 0, 0, 1, 0, 0); lay.clearRect(0, 0, LAY.width, LAY.height); adCard(lay, M, M, AD.w); sweep(lay, M, M, AD.w, h, (u - 0.45) / 0.7, 0.35);
  const acx = lerp(860, 540, k), acy = 318 + h / 2;
  x.save(); x.globalAlpha = 0.22 * k; x.filter = 'blur(36px)'; x.fillStyle = '#000'; rrx(x, acx - AD.w / 2 + 16, acy - h / 2 + 30, AD.w - 32, h, 40); x.fill(); x.restore();
  persp(x, LAY, AD.w + 2 * M, h + 2 * M, acx, acy, AD.w + 2 * M, h + 2 * M, (1 - k) * 1.25, 0);
  pill(x, t >= K.tap + 0.04 ? 'Agree ✓' : 'Agree', 340, 1330, 320, (t - K.agree) / 0.28, true, clamp(1 - Math.abs(t - K.tap) / 0.1));
  pill(x, 'Disagree', 740, 1330, 360, (t - K.disagree) / 0.28, false);
  const tk = (t - (K.tap - 0.35)) / 0.6; if (tk > 0 && tk < 1) touch(x, lerp(520, 340, ease(tk * 1.7)), lerp(1560, 1330, ease(tk * 1.7)), Math.sin(tk * Math.PI) * 1.3, clamp((t - K.tap) / 0.3));
  const bob = 10 * Math.sin((t - K.below) * 9);
  arrow(x, bezPts([540, 1418 + bob], [552, 1460 + bob], [540, 1510 + bob], 20), ease((t - K.below) / 0.2), 7, INK);
  x.restore();
};

// ---------- shot: logo ----------
S.logo = (x, t) => {
  const u = t - T0.logo; dark(x, 0.05);
  x.save(); cam(x, 540, 960, 1 + 0.03 * clamp(u / 1.6));
  rise(x, 'mez.', 540, 930, '800 230px Logo', WHT, u / 0.45, 'center', -11);
  rise(x, 'MEDIA', 550, 1012, '600 46px Logo', WHT, (u - 0.12) / 0.4, 'center', 20);
  x.globalAlpha = ease((u - 0.3) / 0.4); setF(x, '500 34px Plex', 6); x.fillStyle = '#BDBDB8'; x.textAlign = 'center'; x.fillText('PAID ADS FOR BRANDS', 540, 1110);
  x.globalAlpha = ease((u - 0.42) / 0.4); setF(x, '500 40px Body'); x.fillText('@mezmedia_0', 540, 1180); x.restore();
};

// ---------- the world: shots and the transitions between them ----------
const TD = 0.3;
function drawShot(x, sh, t) { x.setTransform(1, 0, 0, 1, 0, 0); x.save(); S[sh.key](x, t); x.restore(); }
function world(t, x) {
  let i = 0; while (i < SHOTS.length - 1 && t >= SHOTS[i + 1].s) i++;
  const sh = SHOTS[i], u = t - sh.s;
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1;
  if (i > 0 && u < TD && !['none', 'cut'].includes(sh.tin)) {
    const pv = SHOTS[i - 1], k = eio(u / TD);
    drawShot(pa, pv, t); drawShot(pb, sh, t);
    x.fillStyle = '#0B0B0B'; x.fillRect(0, 0, W, H);
    if (sh.tin === 'circle') {
      x.drawImage(PA, 0, 0); x.save(); x.beginPath(); x.arc(540, 960, 1150 * ein(u / TD) + 1, 0, TAU); x.clip(); x.drawImage(PB, 0, 0); x.restore();
    } else {
      const dx = sh.tin === 'whipL' ? -1 : sh.tin === 'whipR' ? 1 : 0, dy = dx ? 0 : -1;
      x.drawImage(PA, Math.round(dx * W * k), Math.round(dy * H * k));
      x.drawImage(PB, Math.round(-dx * W * (1 - k)), Math.round(-dy * H * (1 - k)));
    }
  } else drawShot(x, sh, t);
}
const shotAt = (t) => { let i = 0; while (i < SHOTS.length - 1 && t >= SHOTS[i + 1].s) i++; return i; };

// ---------- captions: one word at a time, just below the centre ----------
const LIGHT = { dash: 1, page: 1, rewrite: 1, concept: 1 };
function captions(t) {
  const i = shotAt(t), sh = SHOTS[i], u = t - sh.s;
  if (sh.key === 'logo' || t < LN.cost.s) return;
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
  if (c.hl) {                                        // the key words sit in a solid box, like the reference
    g.fillStyle = dk ? INK : WHT; const bw = tw + size * 0.36; g.fillRect(-bw / 2, -size * 0.84, bw * expo((t - c.s) / 0.12), size * 1.08);
    g.fillStyle = dk ? WHT : INK;
  } else { g.shadowColor = dk ? 'rgba(255,255,255,.9)' : 'rgba(0,0,0,.5)'; g.shadowBlur = 34; g.fillStyle = dk ? INK : WHT; }
  g.fillText(text, 0, 0); g.restore();
}

// ---------- frame: motion blur by sub-frame accumulation, then captions, grain, vignette ----------
let ACC = null;
function prepare() { ACC = new Uint32Array(W * H * 4); }
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
  g.save(); g.globalAlpha = 0.035; g.globalCompositeOperation = 'overlay'; g.drawImage(NOISE[Math.floor(t * 30) % 6], 0, 0, W, H); g.restore();
  vignette(g, 0.12);
};
