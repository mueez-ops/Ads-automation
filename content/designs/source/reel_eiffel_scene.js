// Browser-side shots for reel_eiffel.js. The facts half draws the tower photo (eiffel_tower.jpg: Pexels 3922718 at
// 0.8 of its 3804 x 5721 px, the sky graded from teal to azure; every position below is in those original px) under a
// camera that whips up the tower from the first frame, with the top floor ringed and three photo cards in the Mez
// Media look (white outlines, white pills, Inter type): Gustave Eiffel (portrait by Eugène Pirou, Library of
// Congress), Thomas Edison with his phonograph (Brady-Handy collection, Library of Congress) and the reconstructed
// office today with the two of them in wax ("Gustave Eiffel and Thomas Edison" by greger.ravik, CC BY 2.0). The
// written hook and the clock are drawn by overlay(), so they stay crisp while the camera moves. The switch runs on
// the phone engine in reel_phone_kit.js (loaded first).

// ---------- the tower photo ----------
const TW = 3804, TH = 5721;
const TOP = [1665, 1130, 2020, 1410];                // the top floor (the summit, both its levels): x0, y0, x1, y1
const ZOOM0 = [1840, 3960, 0.55];                    // where the whip starts, on frame 0: low on the tower, so it rushes up to the top
const CAMK = [[K.zoom, 1840, 2000, 0.6], [K.card - 0.05, 1840, 1960, 0.63], [K.card + 0.6, 1840, 2330, 0.62],
  [K.tense, 1840, 2300, 0.645], [T0.phone, 1840, 2280, 0.7]];   // [time, centre x, centre y, frame px per photo px]
const view = (t) => {                                // fast off the first frame, settling on the top
  if (t >= K.zoom) return kf(t, CAMK);
  const k = expo(t / K.zoom), to = CAMK[0];
  return [lerp(ZOOM0[0], to[1], k), lerp(ZOOM0[1], to[2], k), ZOOM0[2] * Math.pow(to[3] / ZOOM0[2], k)];
};
const toF = (v, X, Y) => [540 + (X - v[0]) * v[2], 960 + (Y - v[1]) * v[2]];
const pillW = (x, str, size) => { setF(x, '600 ' + size + 'px Body', -size * 0.02); return x.measureText(str).width + size * 1.05; };
const O = { f: 'Body', w: 600 };

// ---------- the facts half, one continuous camera ----------
function topRing(x, t, v) {                          // the top floor outlined
  const k = (t - K.ring) / 0.45; if (k <= 0) return;
  const [ax, ay] = toF(v, TOP[0], TOP[1]), [bx, by] = toF(v, TOP[2], TOP[3]), w = bx - ax, h = by - ay, r = Math.min(22, h / 2), per = 2 * (w + h);
  x.save(); x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 16;
  rrx(x, ax, ay, w, h, r); x.fillStyle = 'rgba(255,255,255,' + 0.22 * ease(k) + ')'; x.fill();
  x.setLineDash([per * clamp(k), per + 10]); x.lineWidth = 5; x.lineCap = 'round'; x.strokeStyle = WHT; rrx(x, ax, ay, w, h, r); x.stroke(); x.restore();
}
function topLabel(x, t, v) {                         // its label, over the cards as they come out of it
  const [bx, by] = toF(v, TOP[2], TOP[3]), ay = toF(v, 0, TOP[1])[1];
  pill(x, 'Top floor', bx + 22 + pillW(x, 'Top floor', 34) / 2, (ay + by) / 2, 34, false, (t - K.top) / 0.3, O);
}
// a photo card: rounded, a soft shadow, the picture filling it; deco(L, R, T, B) draws its pills in the card's frame
function photoCard(x, img, cx, cy, w, h, o, deco) {
  x.save(); x.globalAlpha *= o.alpha ?? 1; x.translate(cx, cy); x.rotate(o.rot || 0); x.scale(o.sc ?? 1, o.sc ?? 1);
  x.save(); x.shadowColor = 'rgba(0,0,0,.4)'; x.shadowBlur = 60; x.shadowOffsetY = 20; rrx(x, -w / 2, -h / 2, w, h, 30); x.fillStyle = '#000'; x.fill(); x.restore();
  x.save(); rrx(x, -w / 2, -h / 2, w, h, 30); x.clip();
  const s = Math.max(w / img.width, h / img.height) * (o.z || 1);
  x.drawImage(img, -img.width * s / 2, -img.height * s / 2, img.width * s, img.height * s); x.restore();
  if (deco) deco(-w / 2 + 24, w / 2 - 24, -h / 2, h / 2);
  x.restore();
}
const CARD = { cx: 540, cy: 680, w: 370, h: 520 };   // a portrait card, under the ring
const DUO = [[392, 690, -0.07], [690, 702, 0.06]];   // Eiffel's and Edison's cards side by side: cx, cy, turn
const OFFICE = { cx: 540, cy: 690, w: 740, h: 555 };
const gone = (t) => eio((t - K.both + 0.05) / 0.45); // the portraits fly off as the office comes in
function eiffelCard(x, t, v) {                       // his portrait comes out of the top floor, then makes room for Edison
  const k = (t - K.card) / 0.55, out_ = gone(t); if (k <= 0 || out_ >= 1) return;
  const [fx, fy] = toF(v, (TOP[0] + TOP[2]) / 2, (TOP[1] + TOP[3]) / 2), m = expo(k), d = eio((t - K.guest + 0.1) / 0.5);
  const cx = lerp(lerp(fx, CARD.cx, m), DUO[0][0], d) - 700 * out_, cy = lerp(lerp(fy, CARD.cy, m), DUO[0][1], d) - 120 * out_;
  photoCard(x, IMG.eiffel_portrait, cx, cy, CARD.w, CARD.h, { sc: 0.1 + 0.9 * back(k), rot: DUO[0][2] * d - 0.3 * out_, alpha: 1 - out_, z: 1 + 0.04 * clamp((t - K.card) / 8) }, (L0, R0, T, B) => {
    pill(x, 'Gustave Eiffel', L0 + pillW(x, 'Gustave Eiffel', 32) / 2, B, 32, false, (t - K.title) / 0.3, O);
    const q = 1 - clamp((t - K.no) / 0.12);          // the question, until the answer lands on it
    if (q > 0) pill(x, 'Rent it for a night?', 0, T, 30, false, (t - K.rent) / 0.3, { ...O, alpha: q });
    const ks = (t - K.no + 0.03) / 0.22;              // the answer, stamped across him
    if (ks > 0) { x.save(); x.translate(0, 50); x.rotate(-0.12); pill(x, 'Not for rent', 0, 0, 42, true, 1, { f: 'Body', w: 700, sc: lerp(1.9, 1, ease(ks)), alpha: clamp(ks * 3) }); x.restore(); }
  });
}
function edisonCard(x, t) {                          // his most famous guest swings in beside him
  const k = (t - K.guest) / 0.5, out_ = gone(t); if (k <= 0 || out_ >= 1) return;
  const m = back(k), [X, Y, R] = DUO[1];
  photoCard(x, IMG.eiffel_edison, lerp(1400, X, m) + 700 * out_, Y - 120 * out_, CARD.w, CARD.h, { rot: lerp(0.3, R, m) + 0.3 * out_, alpha: 1 - out_, z: 1 + 0.04 * clamp((t - K.guest) / 6) }, (L0, R0, T, B) => {
    pill(x, 'Thomas Edison', L0 + pillW(x, 'Thomas Edison', 32) / 2, B, 32, false, (t - K.edi) / 0.3, O);
    pill(x, '1889', R0 - pillW(x, '1889', 30) / 2, T, 30, true, (t - K.yr) / 0.3, O);
  });
}
const HEADS = [['Edison', 140, 178], ['Eiffel', 709, 226]];   // the wax figures' heads in eiffel_office.jpg (1024 x 768 px)
function officeCard(x, t) {                          // the office today: the two of them, in wax
  const k = (t - K.both) / 0.55; if (k <= 0) return;
  const img = IMG.eiffel_office, z = 1 + 0.05 * clamp((t - K.both) / 3), s = Math.max(OFFICE.w / img.width, OFFICE.h / img.height) * z;
  photoCard(x, img, OFFICE.cx, OFFICE.cy, OFFICE.w, OFFICE.h, { sc: 0.15 + 0.85 * back(k), z }, (L0, R0, T, B) => {
    HEADS.forEach(([str, hx, hy], i) => pill(x, str, (hx - img.width / 2) * s, (hy - img.height / 2) * s - 80, 30, false, (t - K.names - 0.18 * i) / 0.3, O));
    pill(x, 'Today, in wax', R0 - pillW(x, 'Today, in wax', 34) / 2, T, 34, true, (t - K.wax) / 0.3, O);
  });
}
function bait(x, t) {
  const v = view(t), tk = clamp((t - K.tense) / (T0.phone - K.tense)), hb = Math.max(...BEATS.map((q) => bump(t, q, 0.22)));
  x.fillStyle = '#1D5FAF'; x.fillRect(0, 0, W, H);
  x.save();
  x.translate(jolt(t, K.no, 9), 0);                  // the stamp lands
  if (tk > 0) { zoomAt(x, 540, 960, 1 + 0.018 * hb); x.translate(jolt(t, T0.phone - 0.28, 12), 0); x.filter = 'saturate(' + (1 - 0.85 * tk) + ') brightness(' + (1 - 0.3 * tk) + ') contrast(' + (1 + 0.12 * tk) + ')'; }
  x.drawImage(IMG.eiffel_tower, 540 - v[0] * v[2], 960 - v[1] * v[2], TW * v[2], TH * v[2]);
  const q = x.createLinearGradient(0, 700, 0, 1500); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,.55)');   // darker low down, so white type reads
  x.fillStyle = q; x.fillRect(0, 700, W, H - 700);
  x.fillStyle = 'rgba(0,0,0,' + 0.14 * ease((t - K.card) / 0.5) + ')'; x.fillRect(0, 0, W, H);   // and a little darker behind the cards
  topRing(x, t, v); eiffelCard(x, t, v); edisonCard(x, t); officeCard(x, t); topLabel(x, t, v);
  x.restore();
  if (tk > 0) vignette(x, 0.75 * tk);
}

// ---------- overlay: the written hook and the clock (crisp, over the motion blur) ----------
const HOOK = [['A secret apartment', 1, 140, 1030], ['at the top.', 0.82, 110, 1146]];
function hookText(x, t) {                            // on screen from frame 0
  const out_ = clamp((t - K.hookOut + 0.2) / 0.25); if (out_ >= 1) return;
  x.save(); x.globalAlpha = 1 - out_; x.translate(0, -30 * ease(out_)); x.textAlign = 'center'; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 30;
  HOOK.forEach(([str, a, max, Y]) => {
    setF(x, '800 ' + max + 'px Logo', -max * 0.04); const fs = max * Math.min(1, 860 / x.measureText(str).width);
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
S.hook = bait; S.built = bait; S.offers = bait; S.guest = bait; S.wax = bait; S.tense = bait;

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
  setF(c, '500 26px Body', 0); c.fillStyle = 'rgba(255,255,255,.9)'; c.textAlign = 'left'; c.fillText('Nobody tells you the Eiffel Tower…', 30, 1090);
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
