// Browser-side shots for reel_notice.js (classic script; kit helpers W, H, clamp, lerp, IMG, NOISE, mk, out, g... are globals).
// Black, white and neutral greys only; photos keep their natural colour. Captions: one big word at a time, screen space.
const BLK = '#0B0B0B', WHT = '#FFFFFF', OFF = '#F2F2F0', G1 = '#E6E6E3', G2 = '#CFCFCB', G3 = '#9A9A95', G4 = '#5C5C58';
const ease = (k) => 1 - Math.pow(1 - clamp(k), 3);
const expo = (k) => outExpo(clamp(k));
const eio = (k) => { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const CUR = mk(), cx_ = CUR.getContext('2d'), PRV = mk(), px_ = PRV.getContext('2d'), FB = mk(), fb = FB.getContext('2d');

// ---------- primitives (all take a context) ----------
function rrx(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }
function pic(x, img, x0, y0, w, h, z = 1, fx = 0.5, fy = 0.5) {
  const sc = Math.max(w / img.width, h / img.height) * z, iw = img.width * sc, ih = img.height * sc;
  let dx = x0 + w / 2 - fx * iw, dy = y0 + h / 2 - fy * ih;
  dx = Math.min(x0, Math.max(x0 + w - iw, dx)); dy = Math.min(y0, Math.max(y0 + h - ih, dy));
  x.save(); x.beginPath(); x.rect(x0, y0, w, h); x.clip(); x.drawImage(img, dx, dy, iw, ih); x.restore();
}
const BIG = [-2 * W, -2 * H, 5 * W, 5 * H];        // backgrounds overshoot so a pulled-back camera never shows an edge
function lightBG(x) {
  x.fillStyle = OFF; x.fillRect(...BIG);
  const q = x.createRadialGradient(W / 2, H * 0.45, 200, W / 2, H * 0.5, 1600); q.addColorStop(0, 'rgba(255,255,255,.6)'); q.addColorStop(1, 'rgba(0,0,0,.07)');
  x.fillStyle = q; x.fillRect(...BIG);
}
function darkBG(x, glow = 0.07) {
  x.fillStyle = BLK; x.fillRect(...BIG);
  const q = x.createRadialGradient(W / 2, H * 0.55, 0, W / 2, H * 0.55, 1000); q.addColorStop(0, 'rgba(255,255,255,' + glow + ')'); q.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = q; x.fillRect(...BIG);
}
function topShade(x, a = 0.5, h = 760) { const q = x.createLinearGradient(0, 0, 0, h); q.addColorStop(0, 'rgba(0,0,0,' + a + ')'); q.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = q; x.fillRect(0, 0, W, h); }
function fitFont(x, str, weight, size, family, max) { x.font = weight + ' ' + size + 'px ' + family; const w = x.measureText(str).width; if (w > max) { size *= max / w; x.font = weight + ' ' + size + 'px ' + family; } return size; }
function touch(x, X, Y, a, press = 0) {          // fingertip marker: soft white disc, a ring on press
  if (a <= 0) return; x.save(); x.globalAlpha = a;
  x.shadowColor = 'rgba(0,0,0,.25)'; x.shadowBlur = 24; x.beginPath(); x.arc(X, Y, 40 - 6 * press, 0, TAU); x.fillStyle = 'rgba(255,255,255,.55)'; x.fill();
  x.shadowBlur = 0; x.lineWidth = 4; x.strokeStyle = 'rgba(255,255,255,.95)'; x.stroke();
  if (press > 0) { x.globalAlpha = a * (1 - press); x.beginPath(); x.arc(X, Y, 40 + 60 * press, 0, TAU); x.lineWidth = 3; x.stroke(); }
  x.restore();
}

// ---------- the dull, generic ad (one template for every product) ----------
const PROD = {
  perfume: { img: 'n_perfume', z: 2.0, fx: 0.575, fy: 0.53, head: 'NEW PERFUME', sub: 'Best quality. Shop now!' },
  cup: { img: 'p_cup', z: 1.1, fx: 0.5, fy: 0.5, head: 'NEW ARRIVAL!', sub: 'Order today. Shop now!' },
  shirt: { img: 'p_shirt', z: 1.1, fx: 0.5, fy: 0.45, head: 'BIG SALE!', sub: 'Limited time. Shop now!' },
  lamp: { img: 'p_lamp', z: 1.1, fx: 0.5, fy: 0.5, head: 'SHOP NOW', sub: 'Best price. Order now!' },
  gymbag: { img: 'p_gymbag', z: 1.1, fx: 0.5, fy: 0.5, head: 'LIMITED OFFER', sub: 'Don’t miss out. Shop now!' },
  laptop: { img: 'p_laptop', z: 1.1, fx: 0.5, fy: 0.5, head: 'BEST PRICE', sub: 'Free delivery. Shop now!' },
  backpack: { img: 'p_backpack', z: 1.1, fx: 0.5, fy: 0.5, head: 'NEW COLLECTION', sub: 'Best quality. Shop now!' },
};
const ADH = 1.54;                                  // card height / width
// o: {ui: template alpha, head: text, sel: selection 0..1, typed: hook text, n: typed chars, caret}
function dullAd(x, X, Y, w, p, o = {}) {
  const u = w / 300, h = w * ADH, ui = o.ui ?? 1;
  x.save(); x.shadowColor = 'rgba(0,0,0,.10)'; x.shadowBlur = 24 * u; x.shadowOffsetY = 6 * u; rrx(x, X, Y, w, h, 18 * u); x.fillStyle = WHT; x.fill(); x.restore();
  x.save(); rrx(x, X, Y, w, h, 18 * u); x.clip();
  x.globalAlpha = ui;
  x.fillStyle = G1; x.beginPath(); x.arc(X + 24 * u, Y + 26 * u, 12 * u, 0, TAU); x.fill();
  x.fillStyle = G2; rrx(x, X + 44 * u, Y + 16 * u, 84 * u, 8 * u, 4 * u); x.fill();
  x.font = '500 ' + 11 * u + 'px Body'; x.fillStyle = G3; x.textAlign = 'left'; x.fillText('Sponsored', X + 44 * u, Y + 40 * u);
  x.globalAlpha = 1;
  const iy = Y + 52 * u;
  x.fillStyle = '#D6D6D2'; x.fillRect(X, iy, w, 300 * u);
  x.save(); x.filter = 'grayscale(.75) contrast(.78) brightness(1.12)'; pic(x, IMG[p.img], X, iy, w, 300 * u, p.z, p.fx, p.fy); x.restore();
  x.globalAlpha = ui;
  x.save(); x.beginPath(); x.arc(X + 256 * u, iy + 44 * u, 27 * u, 0, TAU); x.fillStyle = '#8F8F8A'; x.fill();
  x.fillStyle = WHT; x.textAlign = 'center'; x.font = '900 ' + 16 * u + 'px Hook'; x.fillText('20%', X + 256 * u, iy + 44 * u);
  x.font = '900 ' + 10 * u + 'px Hook'; x.fillText('OFF', X + 256 * u, iy + 57 * u); x.restore();
  const hy = iy + 300 * u + 40 * u;
  if (o.typed !== undefined) {                      // a real hook being typed into the headline
    const str = o.typed.slice(0, o.n ?? o.typed.length);
    x.fillStyle = BLK; x.textAlign = 'center'; fitFont(x, o.typed, 800, 22 * u, 'Logo', 268 * u); x.letterSpacing = (-0.4 * u) + 'px';
    const full = x.measureText(o.typed).width, left = X + w / 2 - full / 2;
    x.textAlign = 'left'; x.fillText(str, left, hy);
    if (o.caret) { const cw = x.measureText(str).width; x.fillRect(left + cw + 3 * u, hy - 20 * u, 2 * u, 24 * u); }
    x.letterSpacing = '0px';
  } else {
    const head = o.head ?? p.head;
    fitFont(x, head, 900, 28 * u, 'Hook', 260 * u);
    const tw = x.measureText(head).width;
    if (o.sel > 0) { x.fillStyle = 'rgba(11,11,11,' + o.sel + ')'; x.fillRect(X + w / 2 - tw / 2 - 6 * u, hy - 26 * u, (tw + 12 * u) * clamp(o.sel * 1.5), 34 * u); }
    x.fillStyle = o.sel > 0.5 ? WHT : '#55554F'; x.textAlign = 'center'; x.fillText(head, X + w / 2, hy);
  }
  x.font = '500 ' + 13 * u + 'px Body'; x.fillStyle = G3; x.textAlign = 'center'; x.fillText(p.sub, X + w / 2, hy + 22 * u);
  x.fillStyle = '#B5B5B0'; rrx(x, X + 70 * u, hy + 33 * u, 160 * u, 28 * u, 6 * u); x.fill();
  x.font = '700 ' + 11 * u + 'px Body'; x.fillStyle = WHT; x.fillText('SHOP NOW', X + w / 2, hy + 51 * u);
  x.restore();
  return { X, Y, w, h, img: [X, iy, w, 300 * u] };
}

// ---------- the cinematic ad (the same perfume, shot and graded properly) ----------
function cineImage(x, X, Y, w, h, z = 1, fx = 0.56, fy = 0.5) {
  pic(x, IMG.n_perfume, X, Y, w, h, z, fx, fy);
  const q = x.createLinearGradient(0, Y + h * 0.55, 0, Y + h); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,.7)');
  x.fillStyle = q; x.fillRect(X, Y + h * 0.55, w, h * 0.45);
}
function cineType(x, X, Y, w, h, a = 1) {
  if (a <= 0) return; const s = w / 1080;
  x.save(); x.globalAlpha = a; x.fillStyle = WHT; x.textAlign = 'left'; x.letterSpacing = (-1.5 * s) + 'px';
  x.font = 104 * s + 'px Display'; x.fillText('One spray.', X + 80 * s, Y + h * 0.705); x.fillText('Everyone asks.', X + 80 * s, Y + h * 0.705 + 104 * s);
  x.font = '500 ' + 26 * s + 'px Plex'; x.letterSpacing = (6 * s) + 'px'; x.globalAlpha = a * 0.7; x.fillText('EAU DE PARFUM  ·  50 ML', X + 84 * s, Y + h * 0.705 + 170 * s);
  x.restore();
}
function sweep(x, X, Y, w, h, p, a = 0.32) {      // a soft band of light crossing the frame once
  if (p <= 0 || p >= 1) return;
  x.save(); x.beginPath(); x.rect(X, Y, w, h); x.clip(); x.globalCompositeOperation = 'screen';
  x.translate(X - 0.5 * w + 2 * w * eio(p), Y + h / 2); x.rotate(0.38);
  const q = x.createLinearGradient(-w * 0.16, 0, w * 0.16, 0); q.addColorStop(0, 'rgba(255,255,255,0)'); q.addColorStop(0.5, 'rgba(255,255,255,' + a * Math.sin(p * Math.PI) + ')'); q.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = q; x.fillRect(-w * 0.16, -h * 1.2, w * 0.32, h * 2.4); x.restore();
}
function cineCard(x, X, Y, w, h, o = {}) {        // the cinematic ad as a post: rounded, full-bleed, with its line
  x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 0.08 * w; x.shadowOffsetY = 0.02 * w; rrx(x, X, Y, w, h, 0.06 * w); x.fillStyle = BLK; x.fill(); x.restore();
  x.save(); rrx(x, X, Y, w, h, 0.06 * w); x.clip(); cineImage(x, X, Y, w, h, o.z ?? 1.25, 0.58, 0.55);
  const s = w / 1080;
  x.fillStyle = WHT; x.textAlign = 'left'; x.font = 104 * 1.6 * s + 'px Display'; x.letterSpacing = (-2 * s) + 'px';
  x.fillText('One spray.', X + 80 * s, Y + h * 0.80); x.fillText('Everyone asks.', X + 80 * s, Y + h * 0.80 + 160 * s);
  sweep(x, X, Y, w, h, o.sweep ?? 0, 0.28);
  x.restore();
}

// ---------- tiles: every ad pre-rendered once at 960 px wide, with room around it for its shadow ----------
const TILE = {}, TM = 90;
function prepare() {
  const make = (fn) => { const c = document.createElement('canvas'); c.width = 960 + 2 * TM; c.height = Math.ceil(960 * ADH) + 2 * TM; fn(c.getContext('2d')); return c; };
  Object.keys(PROD).forEach((k) => { TILE[k] = make((c) => dullAd(c, TM, TM, 960, PROD[k])); });
  TILE.cine = make((c) => cineCard(c, TM, TM, 960, 960 * ADH));
}
const tile = (x, k, X, Y, w, a = 1) => { if (a <= 0) return; const s2 = w / 960; x.save(); x.globalAlpha = a; x.drawImage(TILE[k], X - TM * s2, Y - TM * s2, TILE[k].width * s2, TILE[k].height * s2); x.restore(); };

// ---------- phone ----------
function phone(x, cx, cy, w, h, drawScreen) {
  const X = cx - w / 2, Y = cy - h / 2, r = w * 0.14, b = w * 0.032;
  x.save(); x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = w * 0.14; x.shadowOffsetY = w * 0.04; rrx(x, X, Y, w, h, r); x.fillStyle = '#050505'; x.fill(); x.restore();
  x.save(); rrx(x, X + 1, Y + 1, w - 2, h - 2, r); x.strokeStyle = 'rgba(255,255,255,.22)'; x.lineWidth = Math.max(1.5, w * 0.004); x.stroke(); x.restore();
  const sx = X + b, sy = Y + b, sw = w - 2 * b, sh = h - 2 * b;
  x.save(); rrx(x, sx, sy, sw, sh, r - b); x.clip(); drawScreen(x, sx, sy, sw, sh); x.restore();
  x.save(); rrx(x, cx - sw * 0.15, sy + sw * 0.03, sw * 0.3, sw * 0.08, sw * 0.04); x.fillStyle = '#000'; x.fill(); x.restore();
  return { sx, sy, sw, sh };
}
// a feed of posts; pos = px scrolled. vel adds motion blur (each sample its own layer, whole-pixel steps)
function feed(x, sx, sy, sw, sh, posts, pos, vel = 0) {
  const pad = sw * 0.045, pw = sw - 2 * pad, ph = pw * ADH, pitch = ph + pad;
  const draw = (c, p) => {
    c.fillStyle = '#F1F1EF'; c.fillRect(sx, sy, sw, sh);
    const first = Math.floor((p - sh) / pitch) - 1;
    for (let i = Math.max(0, first); i < first + Math.ceil(sh / pitch) + 4; i++) {
      const y = sy + sh * 0.09 + i * pitch - p; if (y > sy + sh || y + ph < sy) continue;
      const k = posts[i % posts.length]; tile(c, k, sx + pad, y, pw);
    }
  };
  const smear = Math.abs(vel) / FPS * 0.5, n = Math.min(48, 1 + Math.ceil(smear / 2));
  if (n <= 1) draw(x, Math.round(pos));
  else {
    for (let i = 0; i < n; i++) { fb.setTransform(1, 0, 0, 1, 0, 0); fb.clearRect(0, 0, W, H); draw(fb, Math.round(pos - smear * (i / n))); x.globalAlpha = 1 / (i + 1); x.drawImage(FB, 0, 0); }
    x.globalAlpha = 1;
  }
  const bh = sh * 0.075;
  x.fillStyle = WHT; x.fillRect(sx, sy, sw, bh); x.fillStyle = G1; x.fillRect(sx, sy + bh - 2, sw, 2);
  x.fillStyle = G2; rrx(x, sx + sw * 0.06, sy + bh * 0.62, sw * 0.24, sw * 0.035, sw * 0.017); x.fill();
  [0.78, 0.89].forEach((f) => { x.beginPath(); x.arc(sx + sw * f, sy + bh * 0.68, sw * 0.022, 0, TAU); x.fill(); });
  return { pad, pw, ph, pitch };
}
const postY = (sy, sh, pitch, i, pos) => sy + sh * 0.09 + i * pitch - pos;   // top of post i in the feed

// ---------- shots ----------
const S = {};
S.crowd = (x, t) => { pic(x, IMG.n_crowd, 0, 0, W, H, 1.0, 0.5, 0.42); topShade(x, 0.5, 760); };
S.owner = (x, t) => {
  x.save(); x.filter = 'blur(28px) brightness(.5)'; pic(x, IMG.n_owner, -60, -60, W + 120, H + 120, 1.0, 0.6, 0.4); x.restore();
  const X = 100, Y = 560, w = 880, h = 960;
  x.save(); x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 80; x.shadowOffsetY = 24; rrx(x, X, Y, w, h, 40); x.fillStyle = BLK; x.fill(); x.restore();
  x.save(); rrx(x, X, Y, w, h, 40); x.clip(); pic(x, IMG.n_owner, X, Y, w, h, 1.0, 0.6, 0.28); x.restore();
  topShade(x, 0.35, 600);
};
// the wall of identical ads: 5 x 7, ours (the perfume) in the middle
const WALL = ['cup', 'shirt', 'lamp', 'gymbag', 'laptop', 'backpack'];
const WALL_C = [540, 1039], TW = 300, TP = [336, 498];
function wall(x, t, o = {}) {
  for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) {
    const cx = WALL_C[0] + (c - 2) * TP[0], cy = WALL_C[1] + (r - 3) * TP[1] + (c % 2 ? 1 : -1) * (o.drift || 0);
    const ours = r === 3 && c === 2;
    if (ours) continue;
    tile(x, WALL[(r * 5 + c * 3) % WALL.length], cx - TW / 2, cy - TW * ADH / 2, TW, o.others ?? 1);
  }
  const k = o.ours || 'perfume';
  if (o.glow > 0) { x.save(); x.shadowColor = 'rgba(255,255,255,' + o.glow + ')'; x.shadowBlur = 90; rrx(x, WALL_C[0] - TW / 2, WALL_C[1] - TW * ADH / 2, TW, TW * ADH, 18); x.fillStyle = BLK; x.fill(); x.restore(); }
  tile(x, k, WALL_C[0] - TW / 2, WALL_C[1] - TW * ADH / 2, TW);
}
S.grid = (x, t) => { lightBG(x); wall(x, t, { drift: 14 * clamp((t - PULL) / 2.5) }); };
S.city = (x, t) => { pic(x, IMG.n_city, 0, 0, W, H, 1.0, 0.5, 0.5); topShade(x, 0.45, 760); };
const CLONES = [['laptop', -510, -36, -0.07], ['cup', 510, -36, 0.07], ['shirt', -265, -16, -0.035], ['lamp', 265, -16, 0.035]];
S.clones = (x, t) => {
  lightBG(x);
  const w = 470, h = w * ADH, cx = 540, cy = 1030;
  CLONES.forEach(([k, dx, dy, rot], i) => {
    const kk = expo((t - SAME_EVERY - 0.06 - i * 0.09) / 0.35); if (kk <= 0) return;
    x.save(); x.translate(cx + dx * kk, cy + dy * kk); x.rotate(rot * kk); x.scale(0.9, 0.9); tile(x, k, -w / 2, -h / 2, w); x.restore();
  });
  tile(x, 'perfume', cx - w / 2, cy - h / 2, w);
  const ok = clamp((t - SAME_ELSE - 0.05) / 0.12);
  if (ok > 0) {                                     // the same outline drops onto every card: they are all one template
    x.save(); x.globalAlpha = ok; x.strokeStyle = BLK; x.lineWidth = 4;
    CLONES.forEach(([k, dx, dy, rot]) => { x.save(); x.translate(cx + dx, cy + dy); x.rotate(rot); x.scale(0.9, 0.9); rrx(x, -w / 2 - 10, -h / 2 - 10, w + 20, h + 20, 34); x.stroke(); x.restore(); });
    rrx(x, cx - w / 2 - 10, cy - h / 2 - 10, w + 20, h + 20, 34); x.stroke(); x.restore();
  }
};
const SCROLL_POSTS = ['cup', 'shirt', 'lamp', 'gymbag', 'perfume', 'laptop', 'backpack', 'shirt', 'cup', 'lamp', 'laptop', 'gymbag', 'backpack', 'cup', 'shirt'];
const PH_G = { cx: 540, cy: 1110, w: 560, h: 1150 };
function scrollPos(u) { return 900 * u + 1500 * u * u; }
S.scroll = (x, t) => {
  darkBG(x, 0.08);
  const u = t - T0.scroll;
  phone(x, PH_G.cx, PH_G.cy, PH_G.w, PH_G.h, (c, sx, sy, sw, sh) => {
    const pad = sw * 0.045, pitch = (sw - 2 * pad) * ADH + pad, ph = (sw - 2 * pad) * ADH;
    const uPass = SCROLL_W + 0.45 - T0.scroll;      // our ad crosses the middle of the screen on "past you"
    const off = 4 * pitch + sh * 0.09 + ph / 2 - sh / 2 - scrollPos(uPass);
    feed(c, sx, sy, sw, sh, SCROLL_POSTS, scrollPos(u) + off, 900 + 3000 * u);
  });
  [0.12, 0.62, 1.02, 1.36, 1.66, 1.92].forEach((f) => { const k = (u - f) / 0.2; if (k > 0 && k < 1) touch(x, 720, lerp(1480, 880, eio(k)), Math.sin(k * Math.PI)); });
};
const CARD = { X: 220, Y: 520, w: 640 };
const HOOK = 'One spray. Everyone asks.';
S.card = (x, t) => {
  const m = expo((t - TR) / 0.5);                   // 0: the dull ad, 1: the cinematic ad filling the frame
  if (m < 1) lightBG(x);
  if (t < TR) {
    const sel = clamp((t - SELECT) / 0.08) * (t < TYPE0 ? 1 : 0);
    const n = t < TYPE0 ? undefined : Math.min(HOOK.length, Math.floor((t - TYPE0) / 0.022) + 1);
    dullAd(x, CARD.X, CARD.Y, CARD.w, PROD.perfume, n === undefined ? { sel } : { typed: HOOK, n, caret: n < HOOK.length || Math.floor(t * 2.5) % 2 === 0 });
    return;
  }
  const h0 = CARD.w * ADH, X = lerp(CARD.X, 0, m), Y = lerp(CARD.Y, 0, m), w = lerp(CARD.w, W, m), h = lerp(h0, H, m), r = lerp(18 * CARD.w / 300, 0, m);
  const u0 = CARD.w / 300, iy = lerp(CARD.Y + 52 * u0, 0, m), ih = lerp(300 * u0, H, m);
  x.save(); rrx(x, X, Y, w, h, r); x.fillStyle = BLK; x.fill(); x.clip();
  const z = lerp(2.0, 1.0, m) * (1 + 0.035 * clamp((t - TR - 0.5) / 1.0));
  pic(x, IMG.n_perfume, X, iy, w, ih, z, lerp(0.575, 0.56, m), lerp(0.53, 0.5, m));
  const q = x.createLinearGradient(0, H * 0.55, 0, H); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,' + 0.7 * m + ')'); x.fillStyle = q; x.fillRect(0, H * 0.55, W, H * 0.45);
  topShade(x, 0.4 * m, 700);
  sweep(x, 0, 0, W, H, (t - TR - 0.45) / 0.8);
  x.restore();
  cineType(x, 0, 0, W, H, ease((t - TR - 0.35) / 0.4));
};
// three placements of the same ad: feed, reels, stories
const PL = [{ k: 'feed', cx: 140, cy: 1050, w: 350, label: 'FEED' }, { k: 'reel', cx: 540, cy: 990, w: 440, label: 'REELS' }, { k: 'story', cx: 940, cy: 1050, w: 350, label: 'STORIES' }];
function placeScreen(k) {
  return (c, sx, sy, sw, sh) => {
    if (k === 'feed') {
      c.fillStyle = WHT; c.fillRect(sx, sy, sw, sh);
      const hy = sy + sh * 0.1; c.fillStyle = G1; c.beginPath(); c.arc(sx + sw * 0.09, hy, sw * 0.045, 0, TAU); c.fill();
      c.fillStyle = G2; rrx(c, sx + sw * 0.17, hy - sw * 0.02, sw * 0.32, sw * 0.03, sw * 0.015); c.fill();
      const iy = hy + sw * 0.08, ih = sw * 1.25; cineImage(c, sx, iy, sw, ih, 1.05, 0.58, 0.55);
      c.strokeStyle = BLK; c.lineWidth = sw * 0.012; [0.07, 0.17, 0.27].forEach((f) => { c.beginPath(); c.arc(sx + sw * f, iy + ih + sw * 0.07, sw * 0.03, 0, TAU); c.stroke(); });
      c.fillStyle = G2; [0, 1].forEach((i) => { rrx(c, sx + sw * 0.04, iy + ih + sw * (0.15 + i * 0.06), sw * (0.8 - i * 0.3), sw * 0.03, sw * 0.015); c.fill(); });
      return;
    }
    cineImage(c, sx, sy, sw, sh, 1.0, 0.56, 0.5);
    c.fillStyle = WHT;
    if (k === 'reel') {
      [0.56, 0.66, 0.76].forEach((f) => { c.beginPath(); c.arc(sx + sw * 0.9, sy + sh * f, sw * 0.035, 0, TAU); c.lineWidth = sw * 0.01; c.strokeStyle = WHT; c.stroke(); });
      c.globalAlpha = 0.85; rrx(c, sx + sw * 0.06, sy + sh * 0.86, sw * 0.42, sw * 0.03, sw * 0.015); c.fill(); rrx(c, sx + sw * 0.06, sy + sh * 0.89, sw * 0.6, sw * 0.025, sw * 0.012); c.fill(); c.globalAlpha = 1;
    } else {
      [0, 1, 2].forEach((i) => { c.globalAlpha = i === 0 ? 0.95 : 0.4; rrx(c, sx + sw * (0.05 + i * 0.31), sy + sh * 0.04, sw * 0.28, sw * 0.008, sw * 0.004); c.fill(); });
      c.globalAlpha = 1; c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = sw * 0.008; rrx(c, sx + sw * 0.06, sy + sh * 0.9, sw * 0.7, sw * 0.11, sw * 0.055); c.stroke();
    }
    const s2 = sw / 1080; c.font = 104 * 1.3 * s2 + 'px Display'; c.textAlign = 'left'; c.fillText('One spray.', sx + 80 * s2, sy + sh * 0.7); c.fillText('Everyone asks.', sx + 80 * s2, sy + sh * 0.7 + 136 * s2);
  };
}
const phoneH = (w) => w * 2.05;
S.places = (x, t) => {
  darkBG(x, 0.09);
  const u = t - T0.places;
  PL.forEach((p, i) => {
    let cx = p.cx;
    if (i !== 1) { const k = expo((u - 0.2 - (i === 2 ? 0.12 : 0)) / 0.45); if (k <= 0) return; cx = lerp(p.cx + (i === 0 ? -420 : 420), p.cx, k); }
    phone(x, cx, p.cy, p.w, phoneH(p.w), placeScreen(p.k));
    const la = ease((u - 0.45 - i * 0.06) / 0.3);
    if (la > 0) { x.save(); x.globalAlpha = la; x.font = '500 30px Plex'; x.letterSpacing = '6px'; x.fillStyle = G3; x.textAlign = 'center'; x.fillText(p.label, cx, p.cy + phoneH(p.w) / 2 + 64); x.restore(); }
  });
};
const ATT_POSTS = ['lamp', 'shirt', 'gymbag', 'cine', 'laptop', 'backpack'];
const PH_K = { cx: 540, cy: 1110, w: 560, h: 1150 };
function attPos(t) {                                // scroll fast, land the cinematic ad dead centre on "earn"
  const sw = PH_K.w * (1 - 0.064), pad = sw * 0.045, ph = (sw - 2 * pad) * ADH, pitch = ph + pad, sh = PH_K.h - PH_K.w * 0.064;
  const land = 3 * pitch + sh * 0.09 + ph / 2 - sh / 2;
  const k = clamp((t - T0.attention) / (STOP - T0.attention));
  return { pos: lerp(land - 2600, land, 1 - Math.pow(1 - k, 3)), vel: k < 1 ? 3 * 2600 * Math.pow(1 - k, 2) / (STOP - T0.attention) : 0 };
}
S.attention = (x, t) => {
  darkBG(x, 0.08);
  const { pos, vel } = attPos(t);
  phone(x, PH_K.cx, PH_K.cy, PH_K.w, PH_K.h, (c, sx, sy, sw, sh) => {
    const f = feed(c, sx, sy, sw, sh, ATT_POSTS, pos, vel);
    const y = postY(sy, sh, f.pitch, 3, pos);
    if (t > STOP) sweep(c, sx + f.pad, y, f.pw, f.ph, (t - STOP - 0.05) / 0.7, 0.25);
    const dim = 0.82 * ease((t - ATTN + 0.12) / 0.3);
    if (dim > 0) { c.save(); c.beginPath(); c.rect(sx, sy, sw, sh); c.roundRect(sx + f.pad, y, f.pw, f.ph, f.pw * 0.06); c.fillStyle = 'rgba(0,0,0,' + dim + ')'; c.fill('evenodd'); c.restore(); }
  });
};
S.profile = (x, t) => {
  lightBG(x);
  const X = 80, Y = 560, w = 920, h = 760;
  x.save(); x.shadowColor = 'rgba(0,0,0,.10)'; x.shadowBlur = 60; x.shadowOffsetY = 14; rrx(x, X, Y, w, h, 44); x.fillStyle = WHT; x.fill(); x.restore();
  x.save(); x.beginPath(); x.arc(540, Y + 170, 104, 0, TAU); x.fillStyle = BLK; x.fill();
  x.fillStyle = WHT; x.textAlign = 'center'; x.font = '800 64px Logo'; x.letterSpacing = '-3px'; x.fillText('mez.', 540, Y + 182); x.font = '600 15px Logo'; x.letterSpacing = '6px'; x.fillText('MEDIA', 543, Y + 212); x.restore();
  x.save(); x.textAlign = 'center'; x.fillStyle = BLK; x.font = '700 58px Body'; x.fillText('Mez Media', 540, Y + 360);
  x.font = '500 36px Body'; x.fillStyle = G3; x.fillText('@mezmedia_0', 540, Y + 412);
  x.font = '500 38px Body'; x.fillStyle = G4; x.fillText('Paid ads for brands', 540, Y + 480); x.restore();
  const done = t > TAP + 0.06, press = clamp(1 - Math.abs(t - TAP) / 0.08);
  const bx = 150, by = Y + 560, bw = 380, bh = 104;
  x.save(); x.translate(bx + bw / 2, by + bh / 2); x.scale(1 - 0.04 * press, 1 - 0.04 * press);
  rrx(x, -bw / 2, -bh / 2, bw, bh, 24); x.fillStyle = done ? G1 : BLK; x.fill();
  x.fillStyle = done ? BLK : WHT; x.font = '700 40px Body'; x.textAlign = 'center'; x.fillText(done ? 'Following' : 'Follow', 0, 14); x.restore();
  x.save(); rrx(x, 550, by, 380, bh, 24); x.fillStyle = G1; x.fill(); x.fillStyle = BLK; x.font = '700 40px Body'; x.textAlign = 'center'; x.fillText('Message', 740, by + 66); x.restore();
  const tk = (t - (TAP - 0.3)) / 0.5;
  if (tk > 0 && tk < 1) touch(x, lerp(420, bx + bw / 2, ease(tk * 1.6)), lerp(by + 330, by + bh / 2, ease(tk * 1.6)), Math.sin(clamp(tk) * Math.PI) * 1.2, clamp((t - TAP) / 0.3));
};
S.standout = (x, t) => {
  lightBG(x); wall(x, t, { ours: 'cine', others: 0.4 });
  const s2 = 1.14, w = TW * s2, h = w * ADH;
  x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 70; x.shadowOffsetY = 18; rrx(x, WALL_C[0] - w / 2, WALL_C[1] - h / 2, w, h, 18 * s2 * TW / 300); x.fillStyle = BLK; x.fill(); x.restore();
  tile(x, 'cine', WALL_C[0] - w / 2, WALL_C[1] - h / 2, w);
};
S.end = (x, t) => {
  const u = t - T0.end; darkBG(x, 0.05);
  const k = expo(u / 0.6);
  x.save(); x.globalAlpha = k; x.translate(540, 900); x.scale(0.94 + 0.06 * k, 0.94 + 0.06 * k);
  x.font = '800 220px Logo'; x.letterSpacing = '-11px'; x.textAlign = 'center'; x.fillStyle = WHT; x.fillText('mez.', 0, 0);
  x.font = '600 46px Logo'; x.letterSpacing = '20px'; x.fillText('MEDIA', 10, 84); x.restore();
  x.save(); x.textAlign = 'center'; x.fillStyle = G3;
  x.fillStyle = '#BDBDB8'; x.globalAlpha = ease((u - 0.25) / 0.4); x.font = '500 34px Plex'; x.letterSpacing = '6px'; x.fillText('PAID ADS FOR BRANDS', 540, 1095);
  x.globalAlpha = ease((u - 0.4) / 0.4); x.font = '500 40px Body'; x.letterSpacing = '0px'; x.fillText('@mezmedia_0', 540, 1170); x.restore();
};

// ---------- camera: one move per shot (never in and back out) ----------
const lin = (a, b) => (u, d) => lerp(a, b, clamp(u / d));
const CAM = {
  crowd: { z: lin(1, 1.06), p: [540, 900] },
  owner: { z: lin(1, 1.04), p: [540, 1040] },
  grid: { z: (u) => { const t = T0.grid + u; return t < PULL ? lerp(3.2, 3.28, clamp(u / (PULL - T0.grid))) : lerp(3.28, 0.62, eio((t - PULL) / 1.55)) - 0.03 * clamp((t - PULL - 1.55) / 1.2); }, p: WALL_C },
  city: { z: lin(1, 1.07), p: [540, 1150] },
  clones: { z: lin(1, 1.05), p: [540, 1030] },
  scroll: { z: lin(1, 1.03), p: [540, 1110] },
  card: { z: (u) => 1 + 0.02 * clamp(u / (TR - T0.card)) * (T0.card + u < TR ? 1 : 0) + (T0.card + u >= TR ? 0.02 : 0), p: [540, 1000] },
  places: { z: (u) => lerp(1080 / (PL[1].w * 0.936), 1, expo(u / 0.6)), p: [PL[1].cx, PL[1].cy] },
  attention: { z: (u) => 1 + 1.08 * eio((T0.attention + u - ATTN) / 0.62), p: [540, 1110] },
  profile: { z: lin(1, 1.04), p: [540, 940] },
  standout: { z: lin(0.74, 0.92), p: WALL_C },
  end: { z: lin(1, 1.04), p: [540, 960] },
};
function drawShot(i, t, x) {
  const sh = SHOTS[i], cam = CAM[sh.key], u = t - sh.s, d = sh.e - sh.s;
  const z = cam.z(u, d), [pxp, pyp] = cam.p;
  x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = BLK; x.fillRect(0, 0, W, H);
  x.save(); x.translate(pxp, pyp); x.scale(z, z); x.translate(-pxp, -pyp);
  S[sh.key](x, t); x.restore();
}

// ---------- captions: one big word at a time, lowercase, like the reference ----------
const LIGHT = { grid: 1, clones: 1, profile: 1, standout: 1 };
const capDark = (t, key) => LIGHT[key] || (key === 'card' && t < TR + 0.12);
const VEIL = { grid: 1, standout: 1 };
function captions(t, key) {
  if (key === 'end') return;
  const c = CH.find((q) => t >= q.s && t < q.e); if (!c) return;
  const k = c.s <= 0 ? 1 : clamp((t - c.s) / 0.07), out_ = clamp((c.e - t) / 0.08), isEnd = !CH.find((q) => q.s === c.e);
  const a = k * (isEnd ? out_ : 1); if (a <= 0) return;
  const dark = capDark(t, key);
  g.save(); g.globalAlpha = a; g.textAlign = 'center';
  const size = fitFont(g, c.text, 800, 210, 'Logo', 920); g.letterSpacing = (-size * 0.045) + 'px';
  g.translate(540, 470); const sc = 1.05 - 0.05 * ease(k); g.scale(sc, sc);
  if (!dark) { g.shadowColor = 'rgba(0,0,0,.38)'; g.shadowBlur = 40; g.shadowOffsetY = 6; }
  g.fillStyle = dark ? BLK : WHT; g.fillText(c.text, 0, 0);
  if (c.text === 'bad' && t > STRIKE) {             // "isn't failing because your product is bad": strike it out
    g.shadowColor = 'transparent'; const tw = g.measureText(c.text).width, sk = ease((t - STRIKE) / 0.16);
    g.fillRect(-tw / 2 - 14, -size * 0.36, (tw + 28) * sk, size * 0.085);
  }
  g.restore();
}

// ---------- transitions + post ----------
const FLASHES = [[SNAP, 0.55], [T0.card, 0.7], [TR, 0.9], [T0.standout + 0.12, 0.35]];
function iris(c, r, rot) {                        // six-blade aperture closing to radius r
  c.save(); c.beginPath(); c.rect(0, 0, W, H);
  for (let i = 0; i <= 6; i++) { const a = rot + i * TAU / 6, px = W / 2 + Math.cos(a) * r, py = H / 2 + Math.sin(a) * r; i ? c.lineTo(px, py) : c.moveTo(px, py); }
  c.fillStyle = '#080808'; c.fill('evenodd');
  c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 2;
  for (let i = 0; i < 6; i++) { const a = rot + i * TAU / 6, b = a + TAU / 6, px = W / 2 + Math.cos(a) * r, py = H / 2 + Math.sin(a) * r;
    c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(b + Math.PI / 2) * 2400, py + Math.sin(b + Math.PI / 2) * 2400); c.stroke(); }
  c.restore();
}
window.setTime = (t) => {
  let i = 0; while (i < SHOTS.length - 1 && t >= SHOTS[i + 1].s) i++;
  const sh = SHOTS[i], u = t - sh.s, nx = SHOTS[i + 1];
  drawShot(i, t, cx_);
  g.setTransform(1, 0, 0, 1, 0, 0);
  const TD = 0.22;
  if (i > 0 && u < TD && ['whipL', 'whipU', 'slideU', 'zoom'].includes(sh.tin)) {
    const prev = SHOTS[i - 1]; drawShot(i - 1, prev.e - 0.001 + u, px_);
    const k = eio(u / TD);
    if (sh.tin === 'zoom') {                        // the old shot rushes forward and dissolves into the new one
      g.drawImage(CUR, 0, 0);
      const n = 10, zs = 1 + 0.45 * k;
      for (let j = 0; j < n; j++) { const zz = zs * (1 + 0.06 * k * j / n); g.globalAlpha = (1 - k) / (j + 1) * 1.6; g.drawImage(PRV, W / 2 - W * zz / 2, H / 2 - H * zz / 2, W * zz, H * zz); }
      g.globalAlpha = 1;
    } else {
      const dir = sh.tin === 'whipL' ? [-1, 0] : [0, -1];
      const span = dir[0] ? W : H, blur = Math.sin(k * Math.PI) * span * 0.25;
      const drawMoved = (cv, off) => { const n = Math.min(64, Math.max(6, Math.ceil(blur / 5))); for (let j = 0; j < n; j++) { g.globalAlpha = j === 0 ? 1 : 1 / (j + 1); const o2 = off + (j / n - 0.5) * blur;
          g.drawImage(cv, Math.round(dir[0] * o2), Math.round(dir[1] * o2)); } g.globalAlpha = 1; };
      g.fillStyle = BLK; g.fillRect(0, 0, W, H);
      drawMoved(PRV, k * span); drawMoved(CUR, -(1 - k) * span);
    }
  } else g.drawImage(CUR, 0, 0);
  // white veil behind black captions on the busy light shots, faded with the transition so it never sits on a dark frame
  const moving = i > 0 && u < TD && ['whipL', 'whipU', 'slideU', 'zoom'].includes(sh.tin), kT = moving ? eio(u / TD) : 1;
  const veil = (VEIL[sh.key] ? kT : 0) + (moving && VEIL[SHOTS[i - 1].key] ? 1 - kT : 0);
  if (veil > 0) { const q = g.createLinearGradient(0, 120, 0, 680); q.addColorStop(0, 'rgba(242,242,240,.92)'); q.addColorStop(0.55, 'rgba(242,242,240,.75)'); q.addColorStop(1, 'rgba(242,242,240,0)'); g.save(); g.globalAlpha = veil; g.fillStyle = q; g.fillRect(0, 0, W, 680); g.restore(); }
  const seen = moving && u < TD / 2 ? SHOTS[i - 1].key : sh.key;   // the shot that fills most of the frame picks the caption colour
  // camera shutter iris: closes on the old shot, opens on the new one
  if (nx && nx.tin === 'iris' && t > nx.s - 0.16) iris(g, 1300 * Math.pow(clamp((nx.s - t) / 0.16), 1.6), 0.4 + (nx.s - t) * 3);
  if (sh.tin === 'iris' && u < 0.2) iris(g, 1300 * Math.pow(clamp(u / 0.2), 1.6), 0.4 - u * 3);
  FLASHES.forEach(([f, a]) => { const v = t >= f - 0.02 ? 1 - (t - f) / 0.14 : 0; if (v > 0 && v <= 1.2) { g.fillStyle = 'rgba(255,255,255,' + a * clamp(v) + ')'; g.fillRect(0, 0, W, H); } });
  captions(t, seen);
  g.save(); g.globalAlpha = 0.035; g.globalCompositeOperation = 'overlay'; g.drawImage(NOISE[Math.floor(t * 30) % 6], 0, 0, W, H); g.restore();
  vignette(g, 0.14);
};
