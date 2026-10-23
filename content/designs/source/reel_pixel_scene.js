// Browser-side shots for reel_pixel.js, on the phone engine in reel_phone_kit.js (loaded first).
// RECT gives the screen positions (px) of the parts the edit points at (from reel_pixel_screens.js).
// Each shot picks its phone up where the last one left it (the *P functions), so the cuts between them don't show.

// ---------- layouts ----------
const LP = P(268, 860, 0.7), RP = P(812, 860, 0.7), HERO = P(540, 700, 0.82);   // the two numbers sit above the captions
const SLOTP = P(540, 586, 1.25), FIXP = P(540, 760, 1.0);   // close on the missing code; the fix, big enough to read
const VAL = 128, TY = 560;                           // the big numbers on the screens (screen px); the title's first line
const DIM = '#48484A';

// ---------- the hook: "12 sales. / Meta saw 0." on frame 0; the numbers fly into the two phones ----------
function titleSize(x) { setF(x, '600 100px Logo', -3.3); return 100 * Math.min(1.7, 900 / Math.max(x.measureText('12 sales.').width, x.measureText('Meta saw 0.').width)); }
function flyNum(x, str, X0, Y0, size0, r, p, m, col) {   // a number from the title to its slot on phone p
  const [tx, ty] = toSlide(p, r[0], r[1] + 104), size = size0 * Math.pow(VAL * p.s / size0, m);
  setF(x, '600 ' + size + 'px Logo', -size * lerp(0.033, 0.04, m)); x.textAlign = 'left'; x.fillStyle = mixc(col, INK, m);
  x.fillText(str, lerp(X0, tx, m), lerp(Y0, ty, m));
}
function hookTitle(x, t, pl, pr) {
  const m = eio((t - K.titleOut) / 0.5); if (m >= 1) return;
  const fs = titleSize(x) * (1 + 0.03 * clamp(t / 0.9)), a = 1 - clamp(m * 2.2), Y1 = TY, Y2 = TY + 1.06 * fs;
  setF(x, '600 ' + fs + 'px Logo', -fs * 0.033); x.textAlign = 'left';
  const w1 = x.measureText('12 sales.').width, n1 = x.measureText('12').width, w2 = x.measureText('Meta saw 0.').width, p2 = x.measureText('Meta saw ').width, n2 = x.measureText('0').width;
  const X1 = 540 - w1 / 2, X2 = 540 - w2 / 2;
  if (a > 0) { x.save(); x.globalAlpha = a; x.fillStyle = GREY; x.fillText(' sales.', X1 + n1, Y1); x.fillStyle = INK; x.fillText('Meta saw ', X2, Y2); x.fillText('.', X2 + p2 + n2, Y2); x.restore(); }
  flyNum(x, '12', X1, Y1, fs, RECT.orders.v1, pl, m, GREY);
  flyNum(x, '0', X2 + p2, Y2, fs, RECT.ads.v2, pr, m, INK);
}

// ---------- the store's orders and the campaign's purchases ----------
function ordersLayer(c, t) {
  const Q = RECT.orders;
  if (t >= K.titleOut + 0.5) { setF(c, '600 ' + VAL + 'px Logo', -VAL * 0.04); c.fillStyle = INK; c.textAlign = 'left'; c.fillText('12', Q.v1[0], Q.v1[1] + 104); }
  for (let i = 0; i < 12; i++) {                     // twelve orders, one after another
    const k = clamp((t - (K.rows + i * 0.1)) / 0.22); if (k <= 0) break;
    c.save(); c.globalAlpha = k; part(c, 'orows', RECT.orows['r' + i], 46 * (1 - expo(k)), 0); c.restore();
  }
  ring(c, Q.oc, (t - K.ring12) / 0.35, 10);
  CHECK(c, Q.oc[0] + Q.oc[2] - 62, Q.oc[1] + 62, 30, (t - K.tick12) / 0.3);
}
function adsLayer(c, t) {
  const Q = RECT.ads;
  if (t >= K.titleOut + 0.5) {                       // the zero: bumps, then shakes
    const ox = Q.v2[0] + 36, oy = Q.v2[1] + 60, sc = 1 + 0.14 * bump(t, K.zero, 0.3);
    setF(c, '600 ' + VAL + 'px Logo', -VAL * 0.04); c.fillStyle = INK; c.textAlign = 'left';
    c.save(); c.translate(ox + jolt(t, K.zero, 10), oy); c.scale(sc, sc); c.fillText('0', Q.v2[0] - ox, Q.v2[1] + 104 - oy); c.restore();
  }
  ring(c, Q.pc, (t - K.zero - 0.06) / 0.35, 10);
}

const hookL = (t) => P(LP.cx, lerp(1950, LP.cy, eio((t - K.titleOut) / 0.55)), LP.s);
const hookR = (t) => P(RP.cx, lerp(1950, RP.cy, eio((t - K.titleOut - 0.06) / 0.55)), RP.s);
function labels(x, t, a) {                           // which phone is which
  if (a <= 0) return; x.save(); x.globalAlpha = a;
  pill(x, 'Shopify', LP.cx, LP.cy - 660 * LP.s - 54, 40, false, (t - 1.45) / 0.3, { f: 'Body', w: 600 });
  pill(x, 'Ads Manager', RP.cx, RP.cy - 660 * RP.s - 54, 40, false, (t - 1.55) / 0.3, { f: 'Body', w: 600 });
  x.restore();
}
const S = {};
S.hook = (x, t) => {
  stage(x, false);
  const pl = hookL(t), pr = hookR(t);
  if (t > K.titleOut) { phone(x, pl, 'orders', { over: (c) => ordersLayer(c, t) }); phone(x, pr, 'ads', { over: (c) => adsLayer(c, t) }); }
  labels(x, t, 1);
  hookTitle(x, t, pl, pr);                           // alone on frame 0, then folding into the numbers
};

// ---------- the store's phone comes forward: twelve orders, all there ----------
const storeP = (t) => { const p = lerpP(hookL(T0.store), HERO, eio((t - T0.store) / 0.55)); p.s *= 1 + 0.03 * clamp((t - T0.store - 0.6) / 3.2); return p; };
S.store = (x, t) => {
  stage(x, false);
  const kr = ein((t - T0.store) / 0.4);
  if (kr < 1) phone(x, P(lerp(RP.cx, 1560, kr), RP.cy, RP.s), 'ads', { over: (c) => adsLayer(c, t) });   // Ads Manager steps out to the right
  labels(x, t, 1 - clamp((t - T0.store) / 0.2));
  phone(x, storeP(t), 'orders', { over: (c) => ordersLayer(c, t) });
};
S.shopify = (x, t) => { stage(x, false); phone(x, storeP(t), 'orders', { over: (c) => ordersLayer(c, t) }); };

// ---------- Ads Manager: 0 ----------
const zeroP = (t) => { const p = P(HERO.cx, HERO.cy, HERO.s); p.s *= 1 + 0.035 * clamp((t - T0.zero) / 2); return p; };
S.zero = (x, t) => { stage(x, false); phone(x, zeroP(t), 'ads', { over: (c) => adsLayer(c, t) }); };

// ---------- black: Meta guesses who buys, and every guess misses ----------
const GX = (i) => 204 + (i % 7) * 112, GY = (i) => 330 + Math.floor(i / 7) * 100;
const ORDER = [...Array(42).keys()].sort((a, b) => Math.hypot(GX(a) - 540, GY(a) - 580) - Math.hypot(GX(b) - 540, GY(b) - 580));
function person(x, X, Y, s, col) {
  if (s <= 0) return; x.save(); x.translate(X, Y); x.scale(s, s); x.fillStyle = col;
  x.beginPath(); x.arc(0, -18, 14, 0, TAU); x.fill(); x.beginPath(); x.ellipse(0, 22, 26, 24, 0, Math.PI, 2 * Math.PI); x.fill(); x.restore();
}
function adCard(x, X, Y, s, a) {                     // the ad, as a little card
  if (a <= 0) return; x.save(); x.globalAlpha = a; x.translate(X, Y); x.scale(s, s);
  rrx(x, -24, -30, 48, 60, 9); x.fillStyle = WHT; x.fill(); rrx(x, -18, -24, 36, 26, 5); x.fillStyle = '#C7C7CC'; x.fill();
  x.fillStyle = '#8E8E93'; x.fillRect(-18, 8, 36, 5); x.fillRect(-18, 17, 24, 5); x.restore();
}
function crowdGuess(x, t) {
  const t0 = K.lift + 0.12;
  ORDER.forEach((i, r) => {
    const g = GUESS.find(([, j]) => j === i), u = g ? t - g[0] : -1;
    const col = !g || u < 0.22 ? DIM : mixc(WHT, '#2C2C2E', clamp((u - 0.3) / 0.35));
    person(x, GX(i), GY(i), back((t - t0 - 0.012 * r) / 0.25), col);
  });
  GUESS.forEach(([g, i]) => {
    const u = t - g; if (u < 0) return;
    const X = GX(i), Y = GY(i), kf_ = clamp(u / 0.22);
    if (u < 0.6) { x.save(); x.globalAlpha = clamp(u / 0.08) * (1 - clamp((u - 0.4) / 0.2)); x.strokeStyle = WHT; x.lineWidth = 3; x.beginPath(); x.arc(X, Y, lerp(70, 46, expo(u / 0.18)), 0, TAU); x.stroke(); x.restore(); }   // the guess
    if (kf_ < 1) adCard(x, lerp(540, X, ein(kf_)), lerp(250, Y - 6, ein(kf_)) - 60 * Math.sin(Math.PI * kf_), lerp(1.3, 0.8, kf_), 1);
    const kx = clamp((u - 0.3) / 0.2);                // a miss: they scroll straight past
    if (kx > 0) { x.save(); x.globalAlpha = kx; x.strokeStyle = GREY; x.lineWidth = 4; x.lineCap = 'round'; const d = 9 * back(kx);
      x.beginPath(); x.moveTo(X + 22 - d, Y - 36 - d); x.lineTo(X + 22 + d, Y - 36 + d); x.moveTo(X + 22 + d, Y - 36 - d); x.lineTo(X + 22 - d, Y - 36 + d); x.stroke(); x.restore(); }
  });
  pill(x, 'Purchases 0', 540, 935, 40, false, (t - t0 - 0.2) / 0.3, { w: 600, f: 'Body', bg: '#2C2C2E', fg: GREY, sc: 1 + 0.1 * bump(t, K.wrong, 0.3) });
}
S.guess = (x, t) => {
  stage(x, true);
  if (t > K.lift + 0.1) crowdGuess(x, t);           // the crowd underneath, as the phone lifts away
  const p = zeroP(T0.guess); p.cy -= 1500 * ein((t - K.lift) / 0.4);
  if (t < K.lift + 0.4) phone(x, p, 'ads', { over: (c) => adsLayer(c, t) });
};

// ---------- why: the thank-you page, and the tracking code that isn't firing ----------
function tagSlot(c, t) {
  const r = RECT.thanks.tag, k = expo((t - K.slot) / 0.45); if (k <= 0) return;
  c.save(); c.translate(jolt(t, K.firing, 9), 0); c.globalAlpha = clamp(k * 2);
  const s0 = lerp(0.92, 1, k), cx = r[0] + r[2] / 2, cy = r[1] + r[3] / 2; c.translate(cx, cy); c.scale(s0, s0); c.translate(-cx, -cy);
  rrx(c, r[0], r[1], r[2], r[3], 30); c.fillStyle = 'rgba(242,242,247,.7)'; c.fill();
  c.setLineDash([14, 11]); c.lineWidth = 3; c.strokeStyle = '#AEAEB2'; c.stroke(); c.setLineDash([]);
  setF(c, '500 36px Mono'); c.fillStyle = GREY; c.textAlign = 'center'; c.fillText('</>', r[0] + 64, r[1] + r[3] / 2 + 12);
  setF(c, '600 32px Body'); c.fillStyle = INK; c.textAlign = 'left'; c.fillText('Tracking code', r[0] + 118, r[1] + 64);
  setF(c, '500 25px Body'); c.fillStyle = GREY; c.fillText('Purchase event', r[0] + 118, r[1] + 102);
  const kc = clamp((t - K.notF) / 0.25);              // its status: not firing
  if (kc > 0) { const s1 = back(kc), bx = r[0] + r[2] - 104, by = r[1] + r[3] / 2; c.save(); c.translate(bx, by); c.scale(s1, s1);
    rrx(c, -86, -28, 172, 56, 28); c.fillStyle = INK; c.fill(); setF(c, '600 25px Body'); c.fillStyle = WHT; c.textAlign = 'center'; c.fillText('Not firing', 0, 9); c.restore(); }
  c.restore();
}
const codeP = (t) => lerpP(P(HERO.cx, lerp(1900, HERO.cy, back((t - T0.code - 0.05) / 0.55)), HERO.s), SLOTP, eio((t - K.slot + 0.1) / 0.6));   // up, then close on the slot
S.code = (x, t) => {
  stage(x, false);
  phone(x, codeP(t), 'thanks', { over: (c) => { tagSlot(c, t); ring(c, RECT.thanks.ty, (t - K.thank) / 0.35, 14); } });
};

// ---------- the 2-minute fix: Events Manager, Test events, a test purchase ----------
function testLayer(c, t, got) {
  const w = RECT.test.wait, e = RECT.test.evs, cx = w[0] + 68, cy = w[1] + w[3] / 2;
  c.save(); c.translate(jolt(t, K.nothing, 10), 0);
  if (got <= 0) {                                    // waiting...
    const a0 = t * 7; c.lineWidth = 6; c.lineCap = 'round'; c.strokeStyle = '#C7C7CC'; c.beginPath(); c.arc(cx, cy, 22, 0, TAU); c.stroke();
    c.strokeStyle = INK; c.beginPath(); c.arc(cx, cy, 22, a0, a0 + 1.7); c.stroke();
    setF(c, '600 29px Body'); c.fillStyle = INK; c.textAlign = 'left'; c.fillText('Waiting for activity…', cx + 50, cy + 10);
    rrx(c, e[0], e[1], e[2], e[3], 30); c.setLineDash([12, 10]); c.lineWidth = 3; c.strokeStyle = '#C7C7CC'; c.stroke(); c.setLineDash([]);
    setF(c, '500 26px Body'); c.fillStyle = GREY; c.textAlign = 'center'; c.fillText('No events yet', e[0] + e[2] / 2, e[1] + e[3] / 2 + 9);
  } else {                                           // ...and there it is
    CHECK(c, cx, cy, 24, got * 3);
    setF(c, '600 29px Body'); c.fillStyle = INK; c.textAlign = 'left'; c.fillText('1 event received', cx + 50, cy + 10);
    const y = e[1] + 60 * (1 - expo(got)); c.save(); c.globalAlpha = clamp(got * 2.5);
    c.shadowColor = 'rgba(0,0,0,.1)'; c.shadowBlur = 24; c.shadowOffsetY = 6; rrx(c, e[0], y, e[2], e[3], 30); c.fillStyle = WHT; c.fill(); c.shadowColor = 'transparent';
    c.beginPath(); c.arc(e[0] + 66, y + e[3] / 2, 36, 0, TAU); c.fillStyle = INK; c.fill();
    c.strokeStyle = WHT; c.lineWidth = 3.5; c.lineJoin = 'round'; c.beginPath(); c.moveTo(e[0] + 50, y + 66); c.lineTo(e[0] + 82, y + 66); c.lineTo(e[0] + 79, y + 94); c.lineTo(e[0] + 53, y + 94); c.closePath(); c.stroke();
    c.beginPath(); c.arc(e[0] + 66, y + 66, 9, Math.PI, 0); c.stroke();
    setF(c, '600 32px Body'); c.fillStyle = INK; c.textAlign = 'left'; c.fillText('Purchase', e[0] + 124, y + 66);
    setF(c, '500 25px Body'); c.fillStyle = GREY; c.fillText('Received · just now', e[0] + 124, y + 104);
    setF(c, '600 30px Body'); c.fillStyle = INK; c.textAlign = 'right'; c.fillText('$24.00', e[0] + e[2] - 34, y + 86); c.restore();
  }
  c.restore();
}
function productLayer(c, t) {
  const b = RECT.product.buy, pr = bump(t, K.buyTap, 0.25);
  if (pr > 0) { rrx(c, b[0], b[1], b[2], b[3], b[3] / 2); c.fillStyle = 'rgba(255,255,255,' + 0.25 * pr + ')'; c.fill(); }
  const kt = clamp((t - K.toast) / 0.3), ko = 1 - clamp((t - K.back + 0.1) / 0.2);
  if (kt > 0 && ko > 0) {                            // the order goes through
    const y = lerp(40, 128, expo(kt)); c.save(); c.globalAlpha = Math.min(kt * 2, 1) * ko;
    rrx(c, 140, y, 320, 70, 35); c.fillStyle = INK; c.fill(); CHECK(c, 182, y + 35, 17, 1, true);
    setF(c, '600 27px Body'); c.fillStyle = WHT; c.textAlign = 'left'; c.fillText('Order placed', 212, y + 45); c.restore();
  }
}
function toastFixed(c, t) {                          // the tracking code is fixed
  const k = clamp((t - K.fixed) / 0.3); if (k <= 0) return;
  const y = lerp(40, 128, expo(k)); c.save(); c.globalAlpha = Math.min(k * 2, 1);
  rrx(c, 96, y, 408, 70, 35); c.fillStyle = INK; c.fill(); CHECK(c, 138, y + 35, 17, 1, true);
  setF(c, '600 27px Body'); c.fillStyle = WHT; c.textAlign = 'left'; c.fillText('Tracking code: firing', 168, y + 45); c.restore();
}
// which screen the phone shows: Events Manager, then Test events, the store, and back to Test events
function slide(c, a, la, b, lb, k) {                 // screen a slides out to the left as b comes in from the right
  c.save(); c.translate(-600 * k, 0); c.drawImage(IMG[a], 0, 0, 600, 1280); if (la) la(c); c.restore();
  c.save(); c.translate(600 * (1 - k), 0); c.drawImage(IMG[b], 0, 0, 600, 1280); if (lb) lb(c); c.restore();
}
function fixScreens(c, t) {
  const got = clamp((t - K.received) / 0.35), test = (cc) => testLayer(cc, t, got), prod = (cc) => productLayer(cc, t);
  const k1 = eio((t - K.toTest) / 0.35), k2 = eio((t - K.toShop) / 0.35), k3 = eio((t - K.back) / 0.35);
  if (k1 < 1) slide(c, 'em', null, 'test', test, k1);
  else if (k2 < 1) slide(c, 'test', test, 'product', prod, k2);
  else if (k3 < 1) slide(c, 'test', test, 'product', prod, 1 - k3);   // and back
  else { c.drawImage(IMG.test, 0, 0, 600, 1280); test(c); toastFixed(c, t); }
}
const fixP = (t) => { const p = P(FIXP.cx, FIXP.cy, FIXP.s); p.s *= 1 + 0.03 * clamp((t - T0.fix) / 6); return p; };
function fixShot(x, t) {
  stage(x, false);
  const p = fixP(t);
  phone(x, p, 'em', { over: (c) => fixScreens(c, t) });
  pill(x, '2 minutes', 540, 1318, 40, true, (t - K.clock) / 0.3, { f: 'Body', w: 600, alpha: 1 - clamp((t - K.tabTap) / 0.3) });
  const tab = RECT.em.tab, [ax, ay] = toSlide(p, tab[0] + tab[2] / 2, tab[1] + tab[3] / 2), tk = (t - (K.tabTap - 0.45)) / 0.8;   // a tap on "Test events"
  if (tk > 0 && tk < 1) touch(x, lerp(900, ax, ease(tk * 1.8)), lerp(1500, ay, ease(tk * 1.8)), Math.sin(tk * Math.PI) * 1.4, clamp((t - K.tabTap) / 0.3));
  const b = RECT.product.buy, [bx, by] = toSlide(p, b[0] + b[2] / 2, b[1] + b[3] / 2), tb = (t - (K.buyTap - 0.5)) / 0.85;   // a tap on "Buy now"
  if (tb > 0 && tb < 1) touch(x, lerp(940, bx, ease(tb * 1.8)), lerp(1560, by, ease(tb * 1.8)), Math.sin(tb * Math.PI) * 1.4, clamp((t - K.buyTap) / 0.3));
}
S.fix = fixShot; S.open = fixShot; S.nothing = fixShot; S.first = fixShot;

// ---------- the line to remember: each line rises on its word (no captions under it) ----------
const LAST = [['Meta finds buyers', WHT, 'l1'], ['by watching the ones', WHT, 'l2'], ['you already have.', GREY, 'l3']];
S.finds = (x, t) => {
  stage(x, true);
  x.save(); zoomAt(x, 540, 780, 1 + 0.035 * clamp((t - T0.finds) / 3));
  setF(x, '600 130px Logo', -4); const fs = 130 * Math.min(1, 900 / Math.max(...LAST.map(([str]) => x.measureText(str).width)));
  LAST.forEach(([str, col, k], i) => rise(x, str, 540, 680 + i * fs * 1.12, '600 ' + fs + 'px Logo', col, (t - K[k] + 0.04) / 0.38, -fs * 0.03));
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
const LIGHT = { hook: 1, store: 1, shopify: 1, zero: 1, code: 1, fix: 1, open: 1, nothing: 1, first: 1 };
