// Browser-side shots for reel_burj.js. The facts half draws the tower photo (burj_tower.jpg: Pexels 3463043 at 0.62 of
// its 4692 x 7038 px; every position below is in those original px) under a camera that crash-zooms up the tower from
// the first frame, with the observation deck marked, the lounge's floors outlined above it, the altitude line and The
// Lounge's photo card, in the Mez Media look (white outlines, white pills, Inter type). The
// written hook and the clock are drawn by overlay(), so they stay crisp while the camera moves. The switch runs on the
// phone engine in reel_phone_kit.js (loaded first).

// ---------- the tower photo ----------
const TW = 4692, TH = 7038;
// floors 152 to 154 (about 575 to 590 m): height -> photo row from a perspective fit through the antenna tip (829.8 m)
// and the copper mechanical bands (levels 40-42, 73-75, 109-111, 136-138); good to a couple of floors
const zToY = (z) => (-8.421335807438819 * z + 8286.986147736838) / (0.001940965861986966 * z + 1);
const BAR = [2140, 1545, 2430, 1640];                // the floors: x0, y0, x1, y1
const DECK = zToY(555.7);                            // At the Top SKY, level 148: the highest observation deck
const ZOOM0 = [2330, 4880, 0.45];                    // where the crash zoom starts, on frame 0: low on the tower, so it whips up to the top
const CAMK = [[K.zoom, 2290, 2272, 0.5], [K.card - 0.05, 2290, 2236, 0.535], [K.card + 0.6, 2290, 3000, 0.5],
  [K.tense, 2290, 2975, 0.52], [T0.phone, 2290, 2900, 0.58]];   // [time, centre x, centre y, frame px per photo px]
const view = (t) => {                                // fast off the first frame, settling on the top floors
  if (t >= K.zoom) return kf(t, CAMK);
  const k = expo(t / K.zoom), to = CAMK[0];
  return [lerp(ZOOM0[0], to[1], k), lerp(ZOOM0[1], to[2], k), ZOOM0[2] * Math.pow(to[3] / ZOOM0[2], k)];
};
const toF = (v, X, Y) => [540 + (X - v[0]) * v[2], 960 + (Y - v[1]) * v[2]];
const pillW = (x, str, size) => { setF(x, '600 ' + size + 'px Body', -size * 0.02); return x.measureText(str).width + size * 1.05; };

// ---------- the facts half, one continuous camera ----------
function floorRing(x, t, v) {                        // floors 152-154 outlined, with their label
  const k = (t - K.ring) / 0.45; if (k <= 0) return;
  const [ax, ay] = toF(v, BAR[0], BAR[1]), [bx, by] = toF(v, BAR[2], BAR[3]), w = bx - ax, h = by - ay, r = Math.min(18, h / 2), per = 2 * (w + h);
  x.save(); x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 16;
  rrx(x, ax, ay, w, h, r); x.fillStyle = 'rgba(255,255,255,' + 0.22 * ease(k) + ')'; x.fill();
  x.setLineDash([per * clamp(k), per + 10]); x.lineWidth = 5; x.lineCap = 'round'; x.strokeStyle = WHT; rrx(x, ax, ay, w, h, r); x.stroke(); x.restore();
  pill(x, 'Floors 152–154', bx + 22 + pillW(x, 'Floors 152–154', 34) / 2, (ay + by) / 2, 34, false, (t - K.l152) / 0.3, { f: 'Body', w: 600 });
}
function deckMark(x, t, v) {                         // the observation deck, just below the lounge
  const k = (t - K.deck) / 0.35, out_ = clamp((t - K.alt + 0.2) / 0.3); if (k <= 0 || out_ >= 1) return;
  const [ax, y] = toF(v, 2085, DECK), [bx] = toF(v, 2420, DECK);
  x.save(); x.globalAlpha = 1 - out_; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 10; x.lineWidth = 4; x.lineCap = 'round'; x.strokeStyle = WHT;
  x.beginPath(); x.moveTo(ax, y); x.lineTo(lerp(ax, bx, expo(k)), y); x.stroke(); x.restore();
  pill(x, 'Observation deck', ax - 18 - pillW(x, 'Observation deck', 32) / 2, y, 32, true, k * 1.2, { f: 'Body', w: 600, alpha: 1 - out_ });
}
function altitude(x, t, v) {                         // 585 m, measured from the ground up to those floors
  if (t < K.alt) return;
  const z = 585 * ease((t - K.alt) / (K.altEnd - K.alt)), [ax, ay] = toF(v, BAR[0], BAR[1]), by = toF(v, 0, BAR[3])[1];
  const X = ax - 30, head = toF(v, 0, zToY(z))[1], fade = 1 - clamp((t - LN.high.e - 0.2) / 0.35);
  if (fade > 0 && head < H) {
    x.save(); x.globalAlpha = fade; x.setLineDash([14, 10]); x.lineWidth = 5; x.strokeStyle = WHT; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 8;
    x.beginPath(); x.moveTo(X, H); x.lineTo(X, head); x.stroke(); x.setLineDash([]);
    [100, 200, 300, 400, 500].forEach((m) => { const y = toF(v, 0, zToY(m))[1]; if (m <= z && y < H) { x.beginPath(); x.moveTo(X - 14, y); x.lineTo(X + 14, y); x.stroke(); } });
    x.restore();
  }
  const str = Math.round(z) + ' m', ly = Math.min(Math.max(head, (ay + by) / 2), 960);   // waits above the captions until the line gets there
  pill(x, str, X - 18 - pillW(x, str, 34) / 2, ly, 34, false, 1, { f: 'Body', w: 600 });
}
const CARD = { cx: 540, cy: 640, w: 760, h: 507 };
function loungeCard(x, t, v) {                       // the photo of The Lounge comes out of those floors
  const k = (t - K.card) / 0.55; if (k <= 0) return;
  const [fx, fy] = toF(v, (BAR[0] + BAR[2]) / 2, (BAR[1] + BAR[3]) / 2), m = expo(k), sc = 0.1 + 0.9 * back(k);
  const cx = lerp(fx, CARD.cx, m), cy = lerp(fy, CARD.cy, m), w = CARD.w * sc, h = CARD.h * sc, R = 34 * sc;
  x.save(); x.shadowColor = 'rgba(0,0,0,.4)'; x.shadowBlur = 60; x.shadowOffsetY = 20; rrx(x, cx - w / 2, cy - h / 2, w, h, R); x.fillStyle = '#000'; x.fill(); x.restore();
  x.save(); rrx(x, cx - w / 2, cy - h / 2, w, h, R); x.clip();
  const z = 1 + 0.05 * clamp((t - K.card) / 8), iw = w * z, ih = h * z;   // a slow push into the room
  x.drawImage(IMG.burj_lounge, cx - iw / 2, cy - ih / 2, iw, ih); x.restore();
  const L0 = cx - w / 2 + 26, R0 = cx + w / 2 - 26, T = cy - h / 2, B = cy + h / 2, o = { f: 'Body', w: 600 };
  pill(x, 'The Lounge', L0 + pillW(x, 'The Lounge', 36) / 2, B, 36, false, (t - K.title) / 0.3, o);
  pill(x, 'World record', R0 - pillW(x, 'World record', 32) / 2, T, 32, true, (t - K.rec) / 0.3, o);       // Guinness: the highest lounge in a building
  pill(x, 'Booking only', R0 - pillW(x, 'Booking only', 32) / 2, B, 32, true, (t - K.book) / 0.3, o);
}
function bait(x, t) {
  const v = view(t), tk = clamp((t - K.tense) / (T0.phone - K.tense)), hb = Math.max(...BEATS.map((q) => bump(t, q, 0.22)));
  x.fillStyle = '#5A8ED6'; x.fillRect(0, 0, W, H);
  x.save();
  if (tk > 0) { zoomAt(x, 540, 960, 1 + 0.018 * hb); x.translate(jolt(t, T0.phone - 0.28, 12), 0); x.filter = 'saturate(' + (1 - 0.85 * tk) + ') brightness(' + (1 - 0.3 * tk) + ') contrast(' + (1 + 0.12 * tk) + ')'; }
  x.drawImage(IMG.burj_tower, 540 - v[0] * v[2], 960 - v[1] * v[2], TW * v[2], TH * v[2]);
  const q = x.createLinearGradient(0, 700, 0, 1500); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,.55)');   // darker low down, so white type reads
  x.fillStyle = q; x.fillRect(0, 700, W, H - 700);
  x.fillStyle = 'rgba(0,0,0,' + 0.12 * ease((t - K.card) / 0.5) + ')'; x.fillRect(0, 0, W, H);   // and a little darker behind the card
  floorRing(x, t, v); deckMark(x, t, v); altitude(x, t, v); loungeCard(x, t, v);
  x.restore();
  if (tk > 0) vignette(x, 0.75 * tk);
}

// ---------- overlay: the written hook and the clock (crisp, over the motion blur) ----------
const HOOK = [['A lounge above', 1, 140], ['the observation deck.', 0.82, 96]];
function hookText(x, t) {                            // on screen from frame 0
  const out_ = clamp((t - K.hookOut + 0.2) / 0.25); if (out_ >= 1) return;
  x.save(); x.globalAlpha = 1 - out_; x.translate(0, -30 * ease(out_)); x.textAlign = 'center'; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 30;
  [1030, 1132].forEach((Y, i) => {
    const [str, a, max] = HOOK[i]; setF(x, '800 ' + max + 'px Logo', -max * 0.04); const fs = max * Math.min(1, 860 / x.measureText(str).width);
    setF(x, '800 ' + fs + 'px Logo', -fs * 0.04); x.fillStyle = 'rgba(255,255,255,' + a + ')'; x.fillText(str, 540, Y);
  });
  x.restore();
}
function overlay(t) {
  if (t >= T0.phone) return;
  hookText(g, t);
  const kc = (t - K.tense - 0.15) / 0.25;              // a clock where the captions were: how long you have been watching
  if (kc > 0) {
    g.save(); g.globalAlpha = clamp(kc); setF(g, '600 64px Body', 0); const str = '0:' + String(Math.floor(t)).padStart(2, '0'), tw = g.measureText(str).width;
    rrx(g, 540 - tw / 2 - 86, 1062, tw + 140, 108, 54); g.fillStyle = 'rgba(0,0,0,.62)'; g.fill();
    g.fillStyle = (t * 2) % 1 < 0.6 ? '#FF3B30' : 'rgba(255,59,48,.35)'; g.beginPath(); g.arc(540 - tw / 2 - 40, 1116, 15, 0, TAU); g.fill();
    g.fillStyle = WHT; g.textAlign = 'left'; g.fillText(str, 540 - tw / 2 - 8, 1138); g.restore();
  }
}

const S = {};
S.hook = bait; S.high = bait; S.lounge = bait; S.tense = bait;

// ---------- the switch: the reel you were watching, in a phone; then it is your ad ----------
const PHN = { cy: 610, s: 0.62 };
let FRZ = null;
function frozen() { if (!FRZ) { const [c, x] = mkc(1080, 1920); bait(x, K.freeze); FRZ = c; } return FRZ; }
function heart(c, X, Y, r) { c.beginPath(); c.moveTo(X, Y + r * 0.9); c.bezierCurveTo(X - r * 1.6, Y - r * 0.1, X - r * 0.8, Y - r * 1.3, X, Y - r * 0.45); c.bezierCurveTo(X + r * 0.8, Y - r * 1.3, X + r * 1.6, Y - r * 0.1, X, Y + r * 0.9); c.fill(); }
function rail(c) {                                   // like, comment, share
  c.save(); c.fillStyle = WHT; c.strokeStyle = WHT; c.lineWidth = 6; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 10;
  heart(c, 544, 690, 32);
  c.beginPath(); c.arc(544, 806, 28, 0.35 * Math.PI, 2.25 * Math.PI); c.lineTo(522, 840); c.closePath(); c.stroke();
  c.beginPath(); c.moveTo(514, 902); c.lineTo(576, 880); c.lineTo(554, 942); c.lineTo(543, 914); c.closePath(); c.stroke();
  c.restore();
}
function acct(c, name, sub, a) {                     // who posted it
  if (a <= 0) return; c.save(); c.globalAlpha = a; c.textAlign = 'left';
  c.beginPath(); c.arc(60, 1010, 31, 0, TAU); c.fillStyle = sub ? '#8E8E93' : '#111'; c.fill(); c.lineWidth = 3; c.strokeStyle = WHT; c.stroke();
  setF(c, '700 28px Logo', 0); c.fillStyle = WHT; c.textAlign = 'center'; c.fillText(sub ? 'Y' : 'm.', 60, 1020); c.textAlign = 'left';
  setF(c, '600 33px Body', 0); c.fillText(name, 106, sub ? 1004 : 1022);
  if (sub) { setF(c, '500 27px Body', 0); c.fillStyle = 'rgba(255,255,255,.85)'; c.fillText(sub, 106, 1040); }
  else { const w = c.measureText(name).width; rrx(c, 122 + w, 988, 112, 46, 12); c.lineWidth = 2.5; c.strokeStyle = 'rgba(255,255,255,.85)'; c.stroke(); setF(c, '600 26px Body', 0); c.fillText('Follow', 138 + w, 1020); }
  c.restore();
}
function reelUI(c, t) {
  c.drawImage(frozen(), -60, 0, 720, 1280);
  const q = c.createLinearGradient(0, 760, 0, 1280); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,.75)'); c.fillStyle = q; c.fillRect(0, 760, 600, 520);
  rail(c);
  const ad = ease((t - K.ad) / 0.35);
  acct(c, 'mezmedia_0', null, 1 - ad); acct(c, 'yourbrand', 'Sponsored', ad);
  setF(c, '500 26px Body', 0); c.fillStyle = 'rgba(255,255,255,.9)'; c.textAlign = 'left'; c.fillText('Nobody tells you the Burj Khalifa…', 30, 1090);
  if (ad > 0) {                                      // the call to action every ad gets
    c.save(); c.globalAlpha = ad; c.translate(0, 50 * (1 - ad)); rrx(c, 24, 1118, 552, 90, 18); c.fillStyle = 'rgba(255,255,255,.96)'; c.fill();
    setF(c, '700 34px Body', 0); c.fillStyle = INK; c.fillText('Book now', 54, 1176); c.textAlign = 'right'; c.fillText('›', 548, 1177); c.restore();
  }
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(0, 1254, 600, 7); c.fillStyle = WHT; c.fillRect(0, 1254, 600 * 0.7, 7);
  const kt = (t - T0.phone - 0.3) / 0.3;               // the clock, counting the time you watched
  if (kt > 0) {
    const n = Math.round(NUM * clamp((t - K.watched) / (K.num - K.watched))), str = '0:' + String(n).padStart(2, '0');
    c.save(); c.globalAlpha = clamp(kt); setF(c, '600 46px Body', 0); const tw = c.measureText(str).width;
    rrx(c, 300 - tw / 2 - 62, 112, tw + 104, 80, 40); c.fillStyle = 'rgba(0,0,0,.62)'; c.fill();
    c.fillStyle = '#FF3B30'; c.beginPath(); c.arc(300 - tw / 2 - 28, 152, 12, 0, TAU); c.fill();
    c.fillStyle = WHT; c.textAlign = 'left'; c.fillText(str, 300 - tw / 2 - 2, 168); c.restore();
  }
}
S.phone = (x, t) => {
  stage(x, true);
  if (!IMG.reelscr) IMG.reelscr = mkc(1200, 2560)[0];
  const k = eio((t - T0.phone) / 0.6);
  phone(x, P(540, lerp(960, PHN.cy, k), PHN.s * Math.pow(1.8 / PHN.s, 1 - k)), 'reelscr', { frame: 'frameDark', shadow: k, over: (c) => reelUI(c, t) });
};

// ---------- the pitch: each line rises on its word (no captions under it) ----------
const PITCH = [[['We scale businesses', WHT, 's1'], ['with ads like this.', GREY, 's2']],
  [['DM us the word', WHT, 'd1'], ['teardown', null, 'd2'], ['for a free ad review.', GREY, 'd3']]];
function pitchLines(x, t, lines, Y0) {
  setF(x, '600 130px Logo', -4); const fs = 130 * Math.min(1, 830 / Math.max(...lines.map(([str]) => x.measureText(str).width)));   // 855 px at the end of the push
  lines.forEach(([str, col, k], i) => {
    const Y = Y0 + i * fs * 1.2, kk = (t - K[k] + 0.04) / 0.38, f = '600 ' + fs + 'px Logo';
    if (!col && kk > 0) {                               // the keyword, in a box
      setF(x, f, -fs * 0.03); const w = x.measureText(str).width + fs * 0.5;
      x.fillStyle = WHT; x.fillRect(540 - w / 2, Y - fs * 0.84, w * expo(kk / 0.6), fs * 1.1);
    }
    rise(x, str, 540, Y, f, col || INK, kk, -fs * 0.03);
  });
}
S.pitch = (x, t) => {
  stage(x, true);
  x.save(); zoomAt(x, 540, 900, 1 + 0.03 * clamp((t - T0.pitch) / 4));
  const ka = ease((t - K.d1 + 0.18) / 0.2);            // the first two lines make way for the ask
  if (ka < 1) { x.save(); x.globalAlpha = 1 - ka; x.translate(0, -120 * ka); pitchLines(x, t, PITCH[0], 860); x.restore(); }
  pitchLines(x, t, PITCH[1], 780);
  x.restore();
  pill(x, '@mezmedia_0', 540, 1300, 40, false, (t - K.handle) / 0.3, { f: 'Body', w: 600 });   // who to DM; then it loops to the hook
};

// captions are white type on every stage here
const LIGHT = {};
