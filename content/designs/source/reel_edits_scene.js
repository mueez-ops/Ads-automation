// Browser-side shots for reel_edits.js, on the phone engine in reel_phone_kit.js (loaded first).
// RECT gives the screen positions (px) of the parts the edit points at (from reel_edits_screens.js).
// The ad set's status, learning meter, settings and edit count are worked out from the time (countAt, meterAt, learningAt),
// so every shot that shows it agrees with the others.

// ---------- layouts ----------
const AP = P(540, 636, 0.9), GO = P(540, 760, 0.95);    // the ad set (its rows sit above the captions); the editor
const VAL = 128, TY = 560;                           // the big number on the ad set (screen px); the title's first line
const RC = [540, 600], RR = 230;                     // the learning meter on black: centre and radius
const DIM = '#2C2C2E';

// ---------- the ad set, as it changes over the week ----------
const settle = (t, t0, d = 0.3) => eio((t - t0) / d);
function countAt(t) {
  if (t >= K.rewind + 0.35) return RESET.filter((r) => t >= r).length;
  if (t >= K.rewind) return Math.round(7 * (1 - settle(t, K.rewind, 0.35)));   // rewinding the week
  return 7;
}
function meterAt(t) {                                // results toward the 50 that learning needs
  if (t < K.rewind) return 4;
  if (t < RESET[0]) return 31 * settle(t, K.rewind, 0.35);
  const last = RESET.filter((r) => t >= r).pop(), next = RESET.find((r) => r > t);
  if (next === undefined) return 0;
  return 9 * clamp((t - last - 0.1) / (next - last - 0.4));   // creeping up again, before the next edit
}
const learningAt = (t) => !(t >= K.rewind && t < RESET[0]);
const VALS = [['Spring sale: 20% off', 'Last days: 20% off', K.e1], ['$20', '$35', K.e2], ['Age 25–44 · Home', 'Age 18–54 · Gifts', K.e3]];
function chip(c, r, learning, t) {                   // the status: Active, or Learning with a little spinner
  const [X, Y, w, h] = r, cx = X + w / 2, cy = Y + h / 2, sc = 1 + 0.1 * Math.max(...RESET.map((q) => bump(t, q, 0.3)), bump(t, K.done, 0.3));
  c.save(); c.translate(cx + jolt(t, K.isnt, 9), cy); c.scale(sc, sc);
  setF(c, '600 26px Body'); const label = learning ? 'Learning' : 'Active', tw = c.measureText(label).width, pw = tw + (learning ? 76 : 40);
  rrx(c, -pw / 2, -h / 2, pw, h, h / 2); c.fillStyle = learning ? '#E5E5EA' : INK; c.fill();
  c.fillStyle = learning ? INK : WHT; c.textAlign = 'left'; c.fillText(label, -pw / 2 + (learning ? 54 : 20), 9);
  if (learning) { const a0 = t * 6; c.lineWidth = 4; c.lineCap = 'round'; c.strokeStyle = '#AEAEB2'; c.beginPath(); c.arc(-pw / 2 + 30, 0, 11, 0, TAU); c.stroke();
    c.strokeStyle = INK; c.beginPath(); c.arc(-pw / 2 + 30, 0, 11, a0, a0 + 1.8); c.stroke(); }
  c.restore();
}
function meterBar(c, r, n, t) {
  const [X, Y, w] = r, k = clamp(n / 50), j = jolt(t, K.isnt, 8) + RESET.reduce((v, q) => v + jolt(t, q, 7), 0);
  c.save(); c.translate(j, 0);
  rrx(c, X, Y + 6, w, 16, 8); c.fillStyle = '#E5E5EA'; c.fill();
  if (k > 0.004) { rrx(c, X, Y + 6, Math.max(16, w * k), 16, 8); c.fillStyle = INK; c.fill(); }
  setF(c, '500 27px Body'); c.fillStyle = GREY; c.textAlign = 'left'; c.fillText(Math.round(n) + ' of 50 results', X, Y + 60);
  c.restore();
}
function valueSwap(c, r, a, b, t0, t) {              // a setting's value, rolling over to the new one
  const k = eio((t - t0) / 0.3), [X, Y, w, h] = r;
  c.save(); c.beginPath(); c.rect(X - 10, Y - 4, w + 14, h + 8); c.clip(); setF(c, '500 28px Body'); c.textAlign = 'right';
  if (k < 1) { c.globalAlpha = 1 - k; c.fillStyle = GREY; c.fillText(a, X + w, Y + 31 - 30 * k); }
  if (k > 0) { c.globalAlpha = k; c.fillStyle = INK; c.fillText(b, X + w, Y + 31 + 30 * (1 - k)); }
  c.restore();
}
function toast(c, y, text, a) {
  if (a <= 0) return; c.save(); c.globalAlpha = clamp(a); setF(c, '600 26px Body'); const tw = c.measureText(text).width, w = tw + 90;
  rrx(c, 300 - w / 2, y, w, 66, 33); c.fillStyle = INK; c.fill(); CHECK(c, 300 - w / 2 + 38, y + 33, 16, 1, true);
  c.fillStyle = WHT; c.textAlign = 'left'; c.fillText(text, 300 - w / 2 + 66, y + 42); c.restore();
}
const PUB = ['Headline published', 'Budget published', 'Audience published'];
function adsetLayer(c, t, hookFold) {
  const Q = RECT.adset;
  if (!hookFold || t >= K.titleOut + 0.5) {
    chip(c, Q.status, learningAt(t), t);
    setF(c, '600 ' + VAL + 'px Logo', -VAL * 0.04); c.fillStyle = INK; c.textAlign = 'left';
    const n = countAt(t), sc = 1 + 0.12 * Math.max(...RESET.map((q) => bump(t, q, 0.3)));
    c.save(); c.translate(Q.v1[0] + 36, Q.v1[1] + 60); c.scale(sc, sc); c.fillText(String(n), -36, 44); c.restore();
  }
  meterBar(c, Q.meter, meterAt(t), t);
  VALS.forEach(([a, b, t0], i) => valueSwap(c, Q[['hv', 'bv', 'av'][i]], a, b, t0, t));
  [K.e1, K.e2, K.e3].forEach((e, i) => {             // the row being edited
    const kr = (t - e + 0.4) / 0.3, fade = 1 - clamp((t - e - 0.45) / 0.25);
    if (kr > 0 && fade > 0 && t < K.feels) { c.save(); c.globalAlpha = fade; ring(c, Q['r' + i], kr, 6); c.restore(); }
  });
  if (t < K.feels) [K.e1, K.e2, K.e3].forEach((e, i) => toast(c, lerp(40, 120, expo((t - e - 0.12) / 0.3)), PUB[i], ((t - e - 0.12) / 0.2) * (1 - clamp((t - e - 0.75) / 0.2))));
  else if (t < K.isnt + 0.5) {                       // "Feels like progress": all three, stacked
    const drop = ein((t - K.isnt) / 0.45);
    PUB.forEach((p, i) => toast(c, 120 + i * 80 + 900 * drop, p, (t - K.feels - 0.12 * i) / 0.2));
  }
  if (t > K.isnt - 0.05 && t < T0.every) ring(c, Q.sc, (t - K.isnt) / 0.35, 10);
}

// ---------- the hook: "7 edits. / Still learning." on frame 0, folding into the ad set ----------
function titleSize(x) { setF(x, '600 100px Logo', -3.3); return 100 * Math.min(1.7, 900 / Math.max(x.measureText('7 edits.').width, x.measureText('Still learning.').width)); }
function hookTitle(x, t, p) {
  const m = eio((t - K.titleOut) / 0.5); if (m >= 1) return;
  const fs = titleSize(x) * (1 + 0.03 * clamp(t / 0.9)), a = 1 - clamp(m * 2.2), Y1 = TY, Y2 = TY + 1.06 * fs;
  setF(x, '600 ' + fs + 'px Logo', -fs * 0.033); x.textAlign = 'left';
  const w1 = x.measureText('7 edits.').width, n1 = x.measureText('7').width, w2 = x.measureText('Still learning.').width, s2 = x.measureText('Still ').width, l2 = x.measureText('learning').width;
  const X1 = 540 - w1 / 2, X2 = 540 - w2 / 2;
  if (a > 0) { x.save(); x.globalAlpha = a; x.fillStyle = GREY; x.fillText(' edits.', X1 + n1, Y1); x.fillStyle = INK; x.fillText('Still ', X2, Y2); x.fillText('.', X2 + s2 + l2, Y2); x.restore(); }
  const r = RECT.adset.v1, [tx, ty] = toSlide(p, r[0], r[1] + 104), size = fs * Math.pow(VAL * p.s / fs, m);   // "7" into the edit count
  setF(x, '600 ' + size + 'px Logo', -size * 0.04); x.fillStyle = mixc(GREY, INK, m); x.fillText('7', lerp(X1, tx, m), lerp(Y1, ty, m));
  const q = RECT.adset.status, [sx, sy] = toSlide(p, q[0] + q[2] / 2 + 12, q[1] + q[3] / 2 + 9), sz = fs * Math.pow(26 * p.s / fs, m);   // "learning" into the status
  setF(x, '600 ' + sz + 'px Logo', -sz * 0.03); x.textAlign = 'center'; x.fillStyle = INK; x.globalAlpha = 1 - clamp((m - 0.85) / 0.15);
  x.fillText('learning', lerp(X2 + s2 + l2 / 2, sx, m), lerp(Y2, sy, m)); x.globalAlpha = 1;
}
const hookP = (t) => { const p = P(AP.cx, lerp(1950, AP.cy, eio((t - K.titleOut) / 0.55)), AP.s); p.s *= 1 + 0.03 * clamp((t - 1.4) / 2); return p; };
const S = {};
S.hook = (x, t) => {
  stage(x, false);
  const p = hookP(t);
  if (t > K.titleOut) phone(x, p, 'adset', { over: (c) => adsetLayer(c, t, true) });
  hookTitle(x, t, p);
};

// ---------- Monday, Tuesday, Wednesday: three edits, three resets ----------
const weekP = (t) => { const p = hookP(T0.week); p.s *= 1 + 0.02 * clamp((t - T0.week) / 6); return p; };
function adsetShot(x, t) {
  stage(x, false);
  const p = weekP(t);
  phone(x, p, 'adset', { over: (c) => adsetLayer(c, t, false) });
  [K.e1, K.e2, K.e3].forEach((e, i) => {             // a tap on the row being edited
    const r = RECT.adset['r' + i], [fx, fy] = toSlide(p, r[0] + r[2] - 120, r[1] + r[3] / 2), tk = (t - (e - 0.55)) / 0.85;
    if (tk > 0 && tk < 1) touch(x, lerp(940, fx, ease(tk * 1.8)), lerp(1500, fy, ease(tk * 1.8)), Math.sin(tk * Math.PI) * 1.4, clamp((t - e + 0.15) / 0.3));
  });
}
S.week = adsetShot; S.feels = adsetShot; S.isnt = adsetShot;

// ---------- black: the learning meter ----------
const ringVal = (t) => {                             // where the meter is on black
  if (t < K.back) return 18 * ease((t - T0.every - 0.3) / (K.back - T0.every - 0.5));
  if (t < T0.daily) return 6 * clamp((t - K.back - 0.4) / (T0.daily - K.back - 0.6));
  const last = [T0.daily, ...DAILY].filter((q) => t >= q).pop(), next = DAILY.find((q) => q > t);
  if (next === undefined) return 0;                  // after the last reset it stays at 0
  const from = last === T0.daily ? 6 : 0;
  return from + (8 - from) * clamp((t - last - 0.1) / (next - last - 0.3));
};
function editTag(x, t, t0) {                         // an edit flying in from the side and knocking the meter back
  const k = (t - (t0 - 0.24)) / 0.24; if (k <= 0 || k > 1.6) return;
  const X = lerp(-120, RC[0] - RR + 20, ein(Math.min(k, 1))), Y = RC[1] - 40, a = k < 1 ? 1 : 1 - (k - 1) / 0.6;
  pill(x, 'Edit', X, Y, 40, false, 1, { f: 'Body', w: 600, alpha: a, sc: k < 1 ? 1 : 1 + 0.3 * (k - 1) });
}
function meterRing(x, t, a, scale, n = ringVal(t), fg = WHT, track = DIM) {
  if (a <= 0) return;
  const k = n / 50, hits = [K.back, ...DAILY], flash = Math.max(...hits.map((q) => bump(t, q, 0.25))), j = Math.max(...hits.map((q) => Math.abs(jolt(t, q, 14))));
  x.save(); x.globalAlpha *= a; x.translate(RC[0] + j * Math.sign(Math.sin(t * 80)), RC[1]); x.scale(scale, scale);
  x.lineCap = 'round'; x.lineWidth = 26; x.strokeStyle = track; x.beginPath(); x.arc(0, 0, RR, 0, TAU); x.stroke();
  const kg = clamp((t - K.finish) / 0.5);              // the finish line: a full ring, dashed
  if (kg > 0) { x.save(); x.setLineDash([3, 22]); x.lineWidth = 8; x.strokeStyle = GREY; x.beginPath(); x.arc(0, 0, RR, -Math.PI / 2, -Math.PI / 2 + TAU * expo(kg)); x.stroke(); x.restore(); }
  if (k > 0.004) { x.strokeStyle = fg; x.beginPath(); x.arc(0, 0, RR, -Math.PI / 2, -Math.PI / 2 + TAU * k); x.stroke(); }
  setF(x, '600 170px Logo', -6); x.fillStyle = mixc(fg, GREY, flash); x.textAlign = 'center'; x.fillText(String(Math.round(n)), 0, 40);
  const big = bump(t, K.fifty, 0.4); setF(x, '600 ' + (34 + 10 * big) + 'px Body'); x.fillStyle = big > 0 ? fg : GREY; x.fillText('of 50 results', 0, 108);
  if (flash > 0) { x.globalAlpha *= flash; setF(x, '600 30px Body'); x.fillStyle = fg; x.fillText('Back into learning', 0, -RR - 50); }
  x.restore();
}
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
function dayPill(x, d, i, ki, bg, fg, dot = 0) {    // one day of the week row; dot: an edit landed on it
  if (ki <= 0) return;
  x.save(); x.translate(540 + (i - 3) * 116, 965); x.scale(ki, ki); rrx(x, -50, -34, 100, 68, 34); x.fillStyle = bg; x.fill();
  setF(x, '600 27px Body'); x.fillStyle = fg; x.textAlign = 'center'; x.fillText(d, 0, 10);
  if (dot > 0) { x.beginPath(); x.arc(0, -50, 9 * dot, 0, TAU); x.fillStyle = WHT; x.fill(); }
  x.restore();
}
function week7(x, t, a, edits) {                     // the 7 days learning has to finish in; dots where an edit landed
  const k = clamp((t - K.seven) / 0.4) * a; if (k <= 0) return;
  x.save(); x.globalAlpha = k;
  DAYS.forEach((d, i) => {
    const hit = edits.find((q) => q[0] === i);
    dayPill(x, d, i, back((t - K.seven - 0.04 * i) / 0.3), '#1C1C1E', GREY, hit && t >= hit[1] ? back((t - hit[1]) / 0.25) : 0);
  });
  x.restore();
}
const WEEK_EDITS = [[0, T0.every], [1, T0.every], [2, T0.every], [3, DAILY[0]], [4, DAILY[1]], [5, DAILY[2]]];   // Mon-Wed already, then Thu-Sat
S.every = (x, t) => { stage(x, true); meterRing(x, t, ease((t - T0.every - 0.1) / 0.3), lerp(0.85, 1, back((t - T0.every - 0.1) / 0.45))); editTag(x, t, K.back); week7(x, t, 1, WEEK_EDITS); };
S.daily = (x, t) => { stage(x, true); meterRing(x, t, 1, 1); DAILY.forEach((q) => editTag(x, t, q)); week7(x, t, 1, WEEK_EDITS); };

// ---------- the budget pays for learning, not selling ----------
const LEARN_X = 320, SELL_X = 760, NUM_Y = 860;
function coin(x, X, Y, s) { x.save(); x.translate(X, Y); x.scale(s, s); x.beginPath(); x.arc(0, 0, 34, 0, TAU); x.fillStyle = WHT; x.fill(); setF(x, '700 40px Body'); x.fillStyle = INK; x.textAlign = 'center'; x.fillText('$', 0, 14); x.restore(); }
function counter(x, X, label, val, col, k, sc) {     // a big number with its label under it
  if (k <= 0) return; x.save(); x.globalAlpha = clamp(k); x.translate(X, 40 * (1 - ease(k)));
  setF(x, '600 38px Body'); x.fillStyle = GREY; x.textAlign = 'center'; x.fillText(label, 0, NUM_Y + 70);
  x.translate(0, NUM_Y - 55); x.scale(sc, sc); setF(x, '600 160px Logo', -5); x.fillStyle = col; x.fillText(val, 0, 55); x.restore();
}
S.pays = (x, t) => {
  stage(x, true);
  const u = t - T0.pays, out_ = ease(u / 0.35);
  if (out_ < 1) { x.save(); x.globalAlpha = 1 - out_; x.translate(0, -120 * out_); meterRing(x, t, 1, 1 - 0.2 * out_); x.restore(); }
  let got = 0;
  COINS.forEach((c0) => {                            // a day's budget at a time, all of it into learning
    const k = (t - c0) / 0.42; if (k < 0) return; if (k >= 1) { got++; return; }
    coin(x, lerp(540, LEARN_X, k), lerp(410, NUM_Y - 110, k * k), lerp(1, 0.75, k));
  });
  pill(x, 'Daily budget  $35', 540, 400, 46, false, (u - 0.05) / 0.3, { f: 'Body', w: 600 });   // over the coins, so they pour out from under it
  const landed = got ? bump(t, COINS[got - 1] + 0.42, 0.15) : 0;
  counter(x, LEARN_X, 'Learning', '$' + 35 * got, WHT, (u - 0.15) / 0.3, 1 + 0.08 * bump(t, K.learnP, 0.4) + 0.05 * landed);
  x.save(); x.translate(jolt(t, K.notS, 10), 0); counter(x, SELL_X, 'Selling', '$0', '#636366', (u - 0.2) / 0.3, 1 + 0.06 * bump(t, K.notS, 0.35)); x.restore();
};

// ---------- the fix: all three changes in one go, then leave it alone for 7 days ----------
function goLayer(c, t) {
  ['c0', 'c1', 'c2'].forEach((id, i) => { const r = RECT.onego[id], k = (t - K[id]) / 0.3; if (k > 0) ring(c, [r[0] + 8, r[1] + 8, r[2] - 16, r[3] - 16], k, 6); });
  const b = RECT.onego.pub, pr = bump(t, K.go, 0.25);
  if (pr > 0) { rrx(c, b[0], b[1], b[2], b[3], b[3] / 2); c.fillStyle = 'rgba(255,255,255,' + 0.25 * pr + ')'; c.fill(); }
}
const goP = (t) => P(GO.cx, lerp(1900, GO.cy, back((t - T0.make - 0.05) / 0.45)), GO.s);
function hands(x, t) {                               // hands off for 7 days: the meter fills, a day at a time, then Active
  const n = 50 * eio((t - K.toAd - 0.3) / (K.done - K.toAd - 0.35));
  meterRing(x, t, 1, 1 + 0.05 * bump(t, K.done, 0.35), n, INK, '#E5E5EA');
  x.save(); x.translate(540, 300); x.scale(1.6, 1.6); chip(x, [-100, -26, 200, 52], t < K.done, t); x.restore();
  DAYS.forEach((d, i) => { const lit = t >= DAYS7[i]; dayPill(x, d, i, lit ? 1 + 0.12 * bump(t, DAYS7[i], 0.25) : 1, lit ? INK : '#E5E5EA', lit ? WHT : GREY); });
}
S.make = (x, t) => {
  stage(x, false);
  const p = goP(t), k = eio((t - K.toAd) / 0.4);
  x.save(); x.translate(-W * k, 0);                  // "then leave the ad alone": the editor slides away
  phone(x, p, 'onego', { over: (c) => { goLayer(c, t); toast(c, lerp(40, 120, expo((t - K.go - 0.1) / 0.3)), 'Published · 1 edit', (t - K.go - 0.1) / 0.2); } });
  const b = RECT.onego.pub, [bx, by] = toSlide(p, b[0] + b[2] / 2, b[1] + b[3] / 2), tk = (t - (K.go - 0.5)) / 0.85;   // a tap on "Publish all"
  if (tk > 0 && tk < 1) touch(x, lerp(940, bx, ease(tk * 1.8)), lerp(1560, by, ease(tk * 1.8)), Math.sin(tk * Math.PI) * 1.4, clamp((t - K.go) / 0.3));
  x.restore();
  if (k > 0) { x.save(); x.translate(W * (1 - k), 0); hands(x, t); x.restore(); }
};

// ---------- the line to remember: each line rises on its word (no captions under it) ----------
const LAST = [['Boring ads', WHT, 'l1'], ['that keep running', WHT, 'l2'], ['beat clever ads', GREY, 'l3'], ['that keep restarting.', GREY, 'l4']];
S.boring = (x, t) => {
  stage(x, true);
  x.save(); zoomAt(x, 540, 800, 1 + 0.035 * clamp((t - T0.boring) / 3));
  setF(x, '600 130px Logo', -4); const fs = 130 * Math.min(1, 900 / Math.max(...LAST.map(([str]) => x.measureText(str).width)));
  LAST.forEach(([str, col, k], i) => rise(x, str, 540, 600 + i * fs * 1.12, '600 ' + fs + 'px Logo', col, (t - K[k] + 0.04) / 0.38, -fs * 0.03));
  x.restore();
};

// ---------- end card ----------
S.end = (x, t) => {
  stage(x, true);
  const u = t - T0.end;
  x.save(); cam(x, 540, 960, 1 + 0.02 * clamp(u / 1.2));
  rise(x, 'mez.', 540, 640, '800 210px Logo', WHT, (u - 0.05) / 0.4, -10);
  rise(x, 'MEDIA', 552, 722, '600 42px Logo', GREY, (u - 0.12) / 0.35, 18);
  const done = t >= K.followTap + 0.06;
  pill(x, done ? 'Following' : 'Follow', 540, 840, 46, false, (t - K.follow) / 0.3, { w: 600, f: 'Body', bg: done ? MID : WHT, fg: done ? WHT : INK, sc: 1 - 0.06 * bump(t, K.followTap, 0.25) });
  x.globalAlpha = ease((u - 0.25) / 0.3); setF(x, '500 36px Body'); x.textAlign = 'center'; x.fillStyle = GREY; x.fillText('@mezmedia_0', 540, 950); x.globalAlpha = 1;
  const tk = (t - (K.followTap - 0.4)) / 0.75;
  if (tk > 0 && tk < 1) touch(x, lerp(900, 560, ease(tk * 1.8)), lerp(1250, 850, ease(tk * 1.8)), Math.sin(tk * Math.PI) * 1.4, clamp((t - K.followTap) / 0.3));
  x.restore();
};

// captions are dark type on these light stages
const LIGHT = { hook: 1, week: 1, feels: 1, isnt: 1, make: 1 };
