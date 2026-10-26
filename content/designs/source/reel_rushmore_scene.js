// Browser-side shots for reel_rushmore.js. The facts half draws the mountain (rushmore.jpg: Pexels 136154, 5184 x 3456
// px; every position below is in its px) under a camera that whips along the faces from Washington to Lincoln on the
// first frame, with his head ringed and the room marked behind it, then photo cards in the Mez Media look (white
// outlines, white pills, Inter type): where the hall is (rushmore_location.jpg, NPS), Gutzon Borglum in 1923
// (rushmore_borglum.jpg, Library of Congress, no known restrictions), the workers in the tunnel in 1938-39
// (rushmore_workers.jpg, NPS) and the entrance today with the capstone over the vault (rushmore_entrance.jpg, NPS).
// The written hook and the clock are drawn by overlay(), so they stay crisp while the camera moves. The switch runs
// on the phone engine in reel_phone_kit.js (loaded first).

// ---------- the mountain photo ----------
const TW = 5184, TH = 3456;
const HEAD = [3470, 1340, 4000, 2200];              // Lincoln's head (to the top of his beard, clear of the hook): x0, y0, x1, y1
const BEHIND = [4180, 1520];                         // the rock behind his head: the canyon with the hall is back there
const ZOOM0 = [1885, 1850, 0.6];                    // where the whip starts, on frame 0: Washington
const CAMK = [[K.zoom, 3700, 2250, 0.8], [K.loc - 0.05, 3760, 2200, 0.84], [K.loc + 0.6, 3900, 2100, 0.9],
  [K.tense, 3900, 2080, 0.93], [T0.phone, 3900, 2060, 0.97]];   // [time, centre x, centre y, frame px per photo px]
const view = (t) => {                                // fast off the first frame, along the faces to Lincoln
  if (t >= K.zoom) return kf(t, CAMK);
  const k = expo(t / K.zoom), to = CAMK[0];
  return [lerp(ZOOM0[0], to[1], k), lerp(ZOOM0[1], to[2], k), ZOOM0[2] * Math.pow(to[3] / ZOOM0[2], k)];
};
const toF = (v, X, Y) => [540 + (X - v[0]) * v[2], 960 + (Y - v[1]) * v[2]];
const pillW = (x, str, size) => { setF(x, '600 ' + size + 'px Body', -size * 0.02); return x.measureText(str).width + size * 1.05; };
const O = { f: 'Body', w: 600 };
const away = (t) => ease((t - K.loc) / 0.3);         // the marks on the mountain give way to the cards

// ---------- the facts half, one continuous camera ----------
function outline(x, ax, ay, w, h, r, k, a = 1) {     // a white outline drawn on, with a faint fill
  const per = 2 * (w + h);
  x.save(); x.globalAlpha *= a; x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 16;
  rrx(x, ax, ay, w, h, r); x.fillStyle = 'rgba(255,255,255,' + 0.18 * ease(k) + ')'; x.fill();
  x.setLineDash([per * clamp(k), per + 10]); x.lineWidth = 5; x.lineCap = 'round'; x.strokeStyle = WHT; rrx(x, ax, ay, w, h, r); x.stroke(); x.restore();
}
function headRing(x, t, v) {                         // Lincoln's head outlined
  const k = (t - K.ring) / 0.45, out_ = away(t); if (k <= 0 || out_ >= 1) return;
  const [ax, ay] = toF(v, HEAD[0], HEAD[1]), [bx, by] = toF(v, HEAD[2], HEAD[3]);
  outline(x, ax, ay, bx - ax, by - ay, 40, k, 1 - out_);
}
function behindMark(x, t, v) {                       // "Behind here": a dot on the rock behind his head and a pill above it
  const k = (t - K.behind) / 0.35, out_ = away(t); if (k <= 0 || out_ >= 1) return;
  const [bx, by] = toF(v, BEHIND[0], BEHIND[1]), px = bx - 30, py = by - 120;
  x.save(); x.globalAlpha *= 1 - out_; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 10; x.strokeStyle = WHT; x.lineWidth = 4; x.setLineDash([10, 9]);
  x.beginPath(); x.moveTo(px, py + 26); x.lineTo(lerp(px, bx, expo(k)), lerp(py + 26, by, expo(k))); x.stroke(); x.setLineDash([]);
  x.beginPath(); x.arc(bx, by, 11 * back(k), 0, TAU); x.fillStyle = WHT; x.fill(); x.restore();
  pill(x, 'Behind here', px, py, 34, false, k * 1.2, { ...O, alpha: 1 - out_ });
}
// a photo card: rounded, a soft shadow, the picture filling it; deco(L, R, T, B) draws its pills in the card's frame
function photoCard(x, img, cx, cy, w, h, o, deco) {
  x.save(); x.globalAlpha *= o.alpha ?? 1; x.translate(cx, cy); x.rotate(o.rot || 0); x.scale(o.sc ?? 1, o.sc ?? 1);
  x.save(); x.shadowColor = 'rgba(0,0,0,.4)'; x.shadowBlur = 60; x.shadowOffsetY = 20; rrx(x, -w / 2, -h / 2, w, h, 30); x.fillStyle = '#000'; x.fill(); x.restore();
  x.save(); rrx(x, -w / 2, -h / 2, w, h, 30); x.clip();
  const s = Math.max(w / img.width, h / img.height) * (o.z || 1);
  x.drawImage(img, -img.width * s / 2, -img.height * s / 2, img.width * s, img.height * s); x.restore();
  if (deco) deco(-w / 2 + 24, w / 2 - 24, -h / 2, h / 2, s);
  x.restore();
}
const LOCC = { cx: 540, cy: 650, w: 640, h: 538 };   // where the hall is (rushmore_location.jpg, 1600 x 1345 px)
const HALL = [1465, 470];                            // the hall's doorway in that photo
function locCard(x, t, v) {                          // the hall's location comes out of the rock behind his head
  const k = (t - K.loc) / 0.55, out_ = eio((t - K.card + 0.1) / 0.4); if (k <= 0 || out_ >= 1) return;
  const [fx, fy] = toF(v, BEHIND[0], BEHIND[1]), m = expo(k), img = IMG.rushmore_location;
  photoCard(x, img, lerp(fx, LOCC.cx, m) - 650 * out_, lerp(fy, LOCC.cy, m) - 100 * out_, LOCC.w, LOCC.h,
    { sc: 0.1 + 0.9 * back(k), rot: -0.25 * out_, alpha: 1 - out_, z: 1 + 0.04 * clamp((t - K.loc) / 3) }, (L0, R0, T, B, s) => {
      const hx = (HALL[0] - img.width / 2) * s, hy = (HALL[1] - img.height / 2) * s;
      outline(x, hx - 40, hy - 62, 80, 124, 14, (t - K.loc - 0.25) / 0.4);
      pill(x, 'Hall of Records', L0 + pillW(x, 'Hall of Records', 32) / 2, B, 32, false, (t - K.loc - 0.3) / 0.3, O);
      pill(x, 'Sealed', R0 - pillW(x, 'Sealed', 36) / 2, T, 36, true, (t - K.sealed) / 0.3, O);
    });
}
const DUO = [[335, 690, -0.06, 340, 432], [735, 700, 0.05, 380, 443]];   // Borglum, then the workers: cx, cy, turn, w, h
function blastCards(x, t) {                          // the sculptor, the tunnel, and the stamp: never finished
  const out_ = eio((t - K.vault + 0.05) / 0.45); if (out_ >= 1) return;
  const k1 = (t - K.card) / 0.5, k2 = (t - K.blasted) / 0.45;
  if (k1 > 0) {
    const [X, Y, R, w, h] = DUO[0], m = back(k1);
    photoCard(x, IMG.rushmore_borglum, lerp(-300, X, m) - 700 * out_, Y - 100 * out_, w, h, { rot: lerp(-0.3, R, m) - 0.3 * out_, alpha: 1 - out_, z: 1 + 0.04 * clamp((t - K.card) / 4) }, (L0, R0, T, B) => {
      pill(x, 'Gutzon Borglum', L0 + pillW(x, 'Gutzon Borglum', 30) / 2, B, 30, false, (t - K.card - 0.25) / 0.3, O);
    });
  }
  if (k2 > 0) {
    const [X, Y, R, w, h] = DUO[1], m = back(k2);
    photoCard(x, IMG.rushmore_workers, lerp(1400, X, m) + 700 * out_, Y - 100 * out_, w, h, { rot: lerp(0.3, R, m) + 0.3 * out_, alpha: 1 - out_, z: 1 + 0.04 * clamp((t - K.blasted) / 4) }, (L0, R0, T, B) => {
      pill(x, '1938', R0 - pillW(x, '1938', 32) / 2, T, 32, true, (t - K.y1938) / 0.3, O);
      pill(x, 'For the Constitution', 0, B, 28, false, (t - K.y1938 - 0.2) / 0.3, O);
    });
  }
  const ks = (t - K.never + 0.03) / 0.22;              // the answer, stamped across both
  if (ks > 0) { x.save(); x.globalAlpha *= 1 - out_; x.translate(540, 690); x.rotate(-0.1); pill(x, 'Never finished', 0, 0, 46, true, 1, { f: 'Body', w: 700, sc: lerp(1.9, 1, ease(ks)), alpha: clamp(ks * 3) }); x.restore(); }
}
const ENT = { cx: 540, cy: 700, w: 400, h: 601 };    // the entrance today (rushmore_entrance.jpg, 960 x 1443 px)
const CAP = [472, 1302];                             // the capstone over the vault, in that photo
function vaultCard(x, t) {                           // 1998: the vault under the capstone, sixteen panels inside
  const k = (t - K.vault) / 0.55; if (k <= 0) return;
  const img = IMG.rushmore_entrance, z = 1 + 0.05 * clamp((t - K.vault) / 6);
  photoCard(x, img, ENT.cx, ENT.cy, ENT.w, ENT.h, { sc: 0.15 + 0.85 * back(k), z }, (L0, R0, T, B, s) => {
    pill(x, '1998', R0 - pillW(x, '1998', 32) / 2, T, 32, true, (t - K.y1998) / 0.3, O);
    const cx = (CAP[0] - img.width / 2) * s, cy = (CAP[1] - img.height / 2) * s, gone = 1 - ease((t - K.panels) / 0.25);
    if (gone > 0) {
      outline(x, cx - 70, cy - 30, 140, 60, 14, (t - K.ti) / 0.4, gone);
      pill(x, 'Titanium vault', cx, cy - 74, 30, false, (t - K.ti) / 0.3, { ...O, alpha: gone });
    }
    for (let i = 0; i < 16; i++) {                     // the panels, one by one, in the dark of the doorway
      const kp = (t - K.panels - 0.04 * i) / 0.25; if (kp <= 0) continue;
      const X = -20 + ((i % 4) - 1.5) * 38, Y = 92 + (Math.floor(i / 4) - 1.5) * 48, sc = back(kp), glow = bump(t, K.thousands + 0.03 * i, 0.5);
      x.save(); x.translate(X, Y); x.scale(sc, sc); x.shadowColor = 'rgba(255,255,255,' + (0.35 + 0.6 * glow) + ')'; x.shadowBlur = 12 + 20 * glow;
      rrx(x, -15, -20, 30, 40, 5); x.fillStyle = WHT; x.fill(); x.restore();
    }
    pill(x, '16 panels', -20, -26, 30, false, (t - K.panels - 0.1) / 0.3, O);
    pill(x, 'America’s story', -20, 214, 30, false, (t - K.story) / 0.3, O);
    pill(x, 'Not open to visitors', 0, T + 64, 32, true, (t - K.left) / 0.3, O);
  });
}
function bait(x, t) {
  const v = view(t), tk = clamp((t - K.tense) / (T0.phone - K.tense)), hb = Math.max(...BEATS.map((q) => bump(t, q, 0.22)));
  x.fillStyle = '#5B6470'; x.fillRect(0, 0, W, H);
  x.save();
  x.translate(jolt(t, K.blasted, 7) + jolt(t, K.never, 9), 0);   // the blast, and the stamp landing
  if (tk > 0) { zoomAt(x, 540, 960, 1 + 0.018 * hb); x.translate(jolt(t, T0.phone - 0.28, 12), 0); x.filter = 'saturate(' + (1 - 0.85 * tk) + ') brightness(' + (1 - 0.3 * tk) + ') contrast(' + (1 + 0.12 * tk) + ')'; }
  x.drawImage(IMG.rushmore, 540 - v[0] * v[2], 960 - v[1] * v[2], TW * v[2], TH * v[2]);
  const q = x.createLinearGradient(0, 700, 0, 1500); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,.55)');   // darker low down, so white type reads
  x.fillStyle = q; x.fillRect(0, 700, W, H - 700);
  x.fillStyle = 'rgba(0,0,0,' + 0.32 * ease((t - K.loc) / 0.5) + ')'; x.fillRect(0, 0, W, H);   // and darker behind the cards
  headRing(x, t, v); behindMark(x, t, v); locCard(x, t, v); blastCards(x, t); vaultCard(x, t);
  x.restore();
  if (tk > 0) vignette(x, 0.75 * tk);
}

// ---------- overlay: the written hook and the clock (crisp, over the motion blur) ----------
const HOOK = [['A secret room', 1, 140, 1030], ['behind Lincoln’s head.', 0.82, 104, 1142]];
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
S.hook = bait; S.sealed = bait; S.blast = bait; S.vault = bait; S.panels = bait; S.reveal = bait; S.tense = bait;

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
  setF(c, '500 26px Body', 0); c.fillStyle = 'rgba(255,255,255,.9)'; c.textAlign = 'left'; c.fillText('Nobody tells you Mount Rushmore…', 30, 1090);
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
