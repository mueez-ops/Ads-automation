// Browser-side shots for reel_alex.js, on the phone engine in reel_phone_kit.js (loaded first).
// Photos of Alex and Sara (IMG.alex_*, IMG.sara_*) fill the frame with a slow push; the phones sit on the light stage.
// RECT gives the screen positions (px) of the parts the edit points at (from reel_alex_screens.js).

// ---------- photos and type over them ----------
function pic(x, name, fx, fy, z, py = 960) {         // a photo covering the frame, zoomed by z, its point (fx, fy) held at height py
  const im = IMG[name], sc = Math.max(W / im.width, H / im.height) * z;
  const dx = clamp(540 - fx * im.width * sc, W - im.width * sc, 0), dy = clamp(py - fy * im.height * sc, H - im.height * sc, 0);
  x.drawImage(im, dx, dy, im.width * sc, im.height * sc);
}
function veil(x, y0, y1, a) {                          // darker towards the bottom, so white type reads over the photo
  const q = x.createLinearGradient(0, y0, 0, y1); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,' + a + ')');
  x.fillStyle = q; x.fillRect(0, y0, W, H - y0);
}
const HOOK = [['$2,000 on ads.', 'rgba(255,255,255,.82)'], ['0 customers.', WHT]];
function hookText(x, t) {                              // on screen from frame 0
  setF(x, '800 120px Logo', -4.8); const fs = 120 * Math.min(1, 920 / Math.max(...HOOK.map(([str]) => x.measureText(str).width)));
  setF(x, '800 ' + fs + 'px Logo', -fs * 0.04); x.textAlign = 'center';
  x.save(); x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 30; x.fillStyle = HOOK[0][1]; x.fillText(HOOK[0][0], 540, 905);
  const b = 1 + 0.08 * bump(t, K.zero, 0.35); x.translate(540, 1025 - fs * 0.35); x.scale(b, b); x.fillStyle = HOOK[1][1]; x.fillText(HOOK[1][0], 0, fs * 0.35);
  x.restore();
}
function nameCard(x, name, role, y, k) {               // who he is, and that this is an example
  if (k <= 0) return; const a = ease(k);
  x.save(); x.globalAlpha = a; x.translate(0, 18 * (1 - a)); x.textAlign = 'left'; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 18;
  setF(x, '600 50px Logo', -1); const nw = x.measureText(name).width; setF(x, '500 36px Body'); const rw = x.measureText('  ·  ' + role).width, X0 = 540 - (nw + rw) / 2;
  setF(x, '600 50px Logo', -1); x.fillStyle = WHT; x.fillText(name, X0, y);
  setF(x, '500 36px Body'); x.fillStyle = 'rgba(255,255,255,.82)'; x.fillText('  ·  ' + role, X0 + nw, y);
  x.shadowBlur = 0; setF(x, '600 22px Body', 3); const tw = x.measureText('EXAMPLE STORY').width;
  rrx(x, 540 - tw / 2 - 18, y + 28, tw + 36, 40, 20); x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 2; x.stroke();
  x.fillStyle = 'rgba(255,255,255,.88)'; x.textAlign = 'center'; x.fillText('EXAMPLE STORY', 540, y + 56);
  x.restore();
}

// ---------- the people (for "every click") ----------
function person(x, X, Y, s, col) {
  if (s <= 0) return; x.save(); x.translate(X, Y); x.scale(s, s); x.fillStyle = col;
  x.beginPath(); x.arc(0, -18, 14, 0, TAU); x.fill(); x.beginPath(); x.ellipse(0, 22, 26, 24, 0, Math.PI, 2 * Math.PI); x.fill(); x.restore();
}
function switchAt(c, r, on_) {
  const [X, Y, w, h] = r; c.save(); rrx(c, X, Y, w, h, h / 2); c.fillStyle = mixc('#E5E5EA', INK, on_); c.fill();
  c.shadowColor = 'rgba(0,0,0,.18)'; c.shadowBlur = 8; c.shadowOffsetY = 3; c.beginPath(); c.arc(lerp(X + 29, X + w - 29, on_), Y + h / 2, 25, 0, TAU); c.fillStyle = WHT; c.fill(); c.restore();
}

// ---------- Alex ----------
const S = {};
S.alex = (x, t) => {
  pic(x, 'alex_hook', 0.5, 0.33, 1 + 0.1 * eio(t / 3.8), 640);
  veil(x, 720, 1500, 0.75);
  hookText(x, t);
  nameCard(x, 'Alex', 'runs a cleaning company', 1118, (t - K.card) / 0.4);
};

// ---------- his daughter, and ten seconds ----------
function stopwatch(x, t) {
  const k = clamp((t - K.ten + 0.08) / 0.25); if (k <= 0) return;
  const run = clamp((t - K.ten) / 0.65), cx = 850, cy = 470, r = 78;
  x.save(); x.globalAlpha = k; x.translate(cx, cy); const s0 = back(k); x.scale(s0, s0);
  x.beginPath(); x.arc(0, 0, r, 0, TAU); x.fillStyle = 'rgba(20,20,22,.72)'; x.fill();
  x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 7; x.beginPath(); x.arc(0, 0, r - 12, 0, TAU); x.stroke();
  x.strokeStyle = WHT; x.lineCap = 'round'; x.beginPath(); x.arc(0, 0, r - 12, -Math.PI / 2, -Math.PI / 2 + TAU * run); x.stroke();
  setF(x, '600 40px Logo', -1); x.fillStyle = WHT; x.textAlign = 'center'; x.fillText('0:' + String(Math.floor(10 * run)).padStart(2, '0'), 0, 14);
  x.restore();
}
S.sara = (x, t) => {
  const u = t - T0.sara;
  pic(x, 'sara_smile', 0.47, 0.3, 1.02 + 0.08 * eio(u / 2.3), 660);
  veil(x, 900, 1600, 0.55);
  pill(x, 'Sara  ·  his daughter, 12', 540, 300, 34, false, (u - 0.25) / 0.35, { w: 600, f: 'Body', bg: 'rgba(20,20,22,.62)', fg: WHT });
  stopwatch(x, t);
};

// ---------- everything he tried: a new photo, $20 off, a new audience ----------
const EDP = P(540, 700, 0.84), AMP = P(540, 690, 0.84), SITEP = P(540, 700, 0.86), BTNP = P(540, 405, 1.3), DEADP = P(540, 560, 0.52);
function edLayer(c, t) {
  const ph = RECT.ed0.ph, pr = RECT.ed2.pr, kp = eio((t - K.photo) / 0.34), kr = eio((t - K.price) / 0.3);
  if (kp > 0) { c.save(); c.beginPath(); c.rect(...ph); c.clip(); part(c, 'ed0', ph, -600 * kp); part(c, 'ed1', ph, 600 * (1 - kp)); c.restore(); }
  if (kr > 0) { const r = [0, pr[1] - 8, 600, pr[3] + 16]; c.save(); c.beginPath(); c.rect(...r); c.clip(); part(c, 'ed1', r, 0, -r[3] * kr); part(c, 'ed2', r, 0, r[3] * (1 - kr)); c.restore(); }
  const ks = clamp((t - K.sheet) / 0.32);
  if (ks > 0) {
    const y = 720 + 560 * (1 - expo(ks)), r = RECT.aud0.chips, kc = clamp((t - K.chips) / 0.25);
    c.drawImage(IMG.aud0, 0, y, 600, 560);
    if (kc > 0) { c.save(); c.globalAlpha = kc; const s0 = lerp(0.94, 1, back(kc)), cx = r[0] + r[2] / 2, cy = y + r[1] + r[3] / 2;
      c.translate(cx, cy); c.scale(s0, s0); c.translate(-cx, -cy); part(c, 'aud1', r, 0, y); c.restore(); }
  }
}
const riseP = (base, t0, t) => { const u = t - t0, ki = clamp((u - 0.05) / 0.6); return [P(base.cx, lerp(1900, base.cy, back(ki)), base.s * (1 + 0.03 * clamp((u - 0.6) / 3))), (1 - ease(ki)) * 0.75]; };
S.edits = (x, t) => {
  stage(x, false);
  const [p, tilt] = riseP(EDP, T0.edits, t);
  phone3d(x, p, 'ed0', { over: (c) => edLayer(c, t) }, tilt);
  const ts = (t - (K.photo - 0.12)) / 0.55;          // a swipe across the photo
  if (ts > 0 && ts < 1) { const [fx, fy] = toSlide(p, lerp(500, 110, eio(ts * 1.25)), 500); touch(x, fx, fy, Math.sin(ts * Math.PI) * 1.4, 0); }
};

// ---------- still nothing; he goes to switch it all off ----------
S.still = (x, t) => {
  const u = t - T0.still; x.save(); x.translate(jolt(t, T0.still, 12), 0);
  pic(x, 'alex_grimace', 0.45, 0.26, 1.06 + 0.06 * eio(u / 1.0), 600); veil(x, 900, 1600, 0.6); x.restore();
};
S.switch = (x, t) => {
  stage(x, false);
  const [p, tilt] = riseP(AMP, T0.switch, t);
  phone3d(x, p, 'am', { over: (c) => switchAt(c, RECT.am.tg, 1) }, tilt);
  const [X, Y, a0] = kf(t, [[K.sw - 0.55, 760, 1500, 0], [K.sw, 520, 930, 1], [K.hover, 486, 862, 1], [T0.grab, 486, 862, 1]]);   // his thumb stops just over the switch
  const tremble = Math.sin(t * 38) * 2.5 * clamp((t - K.hover) / 0.2);
  if (a0 > 0) { const [fx, fy] = toSlide(p, X + tremble, Y); touch(x, fx, fy, a0 * 1.3, 0); }
};

// ---------- Sara takes the phone; into the screen ----------
S.grab = (x, t) => {
  const u = t - T0.grab, kz = ein(clamp((t - K.zoom) / 0.45));
  pic(x, 'sara_phone', lerp(0.42, 0.41, kz), lerp(0.36, 0.57, kz), (1.02 + 0.06 * clamp(u / 1.2)) * Math.pow(3.2, kz), lerp(800, 960, kz));
  veil(x, 900, 1600, 0.55 * (1 - kz));
  if (kz > 0.65) { x.fillStyle = 'rgba(245,245,247,' + (kz - 0.65) / 0.35 + ')'; x.fillRect(0, 0, W, H); }
};

// ---------- his booking page: "Book now" does nothing on a phone ----------
const CRACK = [[0.06, 0.32], [0.24, 0.6], [0.38, 0.38], [0.52, 0.72], [0.66, 0.44], [0.82, 0.66], [0.95, 0.4]];
function siteLayer(c, t, healed = 0) {
  const b = RECT.site.book, pr = Math.max(bump(t, K.tap1, 0.22), bump(t, K.tap2, 0.22));
  if (pr > 0) { rrx(c, b[0], b[1], b[2], b[3], b[3] / 2); c.fillStyle = 'rgba(255,255,255,' + 0.2 * pr + ')'; c.fill(); }   // pressed, and nothing
  const kc = clamp((t - K.crack) / 0.3) * (1 - healed);
  if (kc > 0) {
    rrx(c, b[0], b[1], b[2], b[3], b[3] / 2); c.fillStyle = 'rgba(29,29,31,' + 0.45 * kc + ')'; c.fill();
    c.save(); c.strokeStyle = 'rgba(255,255,255,' + 0.95 * (1 - healed) + ')'; c.lineWidth = 4; c.lineJoin = 'round'; c.lineCap = 'round';
    const pts = CRACK.map(([u, v]) => [b[0] + u * b[2], b[1] + v * b[3]]); let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    c.setLineDash([len * expo(kc), len + 10]); c.beginPath(); pts.forEach(([X, Y], i) => (i ? c.lineTo(X, Y) : c.moveTo(X, Y))); c.stroke(); c.restore();
  }
  if (healed > 0 && healed < 1) { rrx(c, b[0] - 6, b[1] - 6, b[2] + 12, b[3] + 12, (b[3] + 12) / 2); c.strokeStyle = 'rgba(29,29,31,' + 0.5 * Math.sin(Math.PI * healed) + ')'; c.lineWidth = 4; c.stroke(); }
}
const siteP = (t) => {
  let p = lerpP(P(540, 1080, 2.4), SITEP, expo((t - T0.site) / 0.45)); p = lerpP(p, BTNP, eio((t - LN.broken.s) / 0.6));
  return P(p.cx + jolt(t, K.tap2 + 0.05, 10), p.cy, p.s);
};
S.site = (x, t) => {
  stage(x, false);
  const p = siteP(t); phone(x, p, 'site', { over: (c) => siteLayer(c, t) });
  const [X, Y, a0] = kf(t, [[K.tap1 - 0.55, 700, 1450, 0], [K.tap1, 300, 867, 1], [K.tap1 + 0.3, 340, 930, 1], [K.tap2 - 0.06, 300, 867, 1], [K.tap2 + 0.35, 310, 880, 1], [K.tap2 + 0.75, 720, 1450, 0]]);
  if (a0 > 0) { const [fx, fy] = toSlide(p, X, Y); const tap = [K.tap1, K.tap2].find((q) => t >= q && t < q + 0.3); touch(x, fx, fy, a0 * 1.3, tap ? (t - tap) / 0.3 : 0); }
};

// ---------- two months ----------
S.months = (x, t) => {
  stage(x, true);
  const M = ['March', 'April', 'May'], flips = [K.m1 + 0.12, K.m2 + 0.08], n = flips.filter((q) => t >= q).length;
  const sq = flips.reduce((v, q) => v + bump(t, q - 0.09, 0.18), 0), a0 = ease((t - T0.months) / 0.15);
  x.save(); x.globalAlpha = a0; x.translate(540, 640); x.scale(1, 1 - 0.9 * sq);
  rrx(x, -210, -230, 420, 460, 46); x.fillStyle = WHT; x.fill(); rrx(x, -210, -230, 420, 96, [46, 46, 0, 0]); x.fillStyle = INK; x.fill();
  setF(x, '600 34px Body', 2); x.fillStyle = WHT; x.textAlign = 'center'; x.fillText('2026', 0, -168);
  setF(x, '600 84px Logo', -2); x.fillStyle = INK; x.fillText(M[n], 0, -30);
  for (let i = 0; i < 28; i++) { x.beginPath(); x.arc(-150 + (i % 7) * 50, 40 + Math.floor(i / 7) * 46, 7, 0, TAU); x.fillStyle = '#C7C7CC'; x.fill(); }
  x.restore();
};

// ---------- every click, a dead end ----------
S.dead = (x, t) => {
  stage(x, true);
  const a0 = ease((t - T0.dead) / 0.25), [bx, by] = toSlide(DEADP, 300, 867);
  x.save(); x.globalAlpha = a0; phone(x, DEADP, 'site', { over: (c) => siteLayer(c, t) }); x.restore();
  for (let i = 0; i < 18; i++) {                       // people run at the button and bounce off it
    const v = t - (T0.dead + 0.1 + i * 0.075); if (v < 0) continue;
    const side = i % 2 ? 1 : -1, sx = 540 + side * (580 + 60 * R(i + 7)), sy = 430 + 520 * R(i + 40);
    let X, Y, al = 1, col = WHT;
    if (v < 0.32) { const k = ein(v / 0.32); X = lerp(sx, bx + side * 28, k); Y = lerp(sy, by, k); }
    else { const k = (v - 0.32) / 0.5; if (k > 1) continue; X = bx + side * (28 + 260 * ease(k)); Y = by - 120 * Math.sin(Math.PI * k * 0.8) + 280 * k * k; al = 1 - k; col = mixc(WHT, GREY, k); }
    x.save(); x.globalAlpha = al * a0; person(x, X, Y, 0.8, col); x.restore();
    if (v >= 0.3 && v < 0.5) { x.save(); x.globalAlpha = (1 - (v - 0.3) / 0.2) * 0.8; x.strokeStyle = WHT; x.lineWidth = 3; x.beginPath(); x.arc(bx + side * 20, by, 20 + 60 * (v - 0.3) / 0.2, 0, TAU); x.stroke(); x.restore(); }
  }
};

// ---------- fixed: booked, then Friday ----------
function bookedSheet(c, t) {
  const k = clamp((t - K.booked - 0.05) / 0.35); if (k <= 0) return;
  const y = lerp(1280, 880, expo(k));
  c.save(); c.shadowColor = 'rgba(0,0,0,.18)'; c.shadowBlur = 30; rrx(c, 0, y, 600, 1280 - y + 40, [44, 44, 0, 0]); c.fillStyle = WHT; c.fill(); c.restore();
  CHECK(c, 300, y + 90, 44, (t - K.booked - 0.15) / 0.3);
  setF(c, '700 44px Body'); c.fillStyle = INK; c.textAlign = 'center'; c.fillText('Booked', 300, y + 192);
  setF(c, '500 28px Body'); c.fillStyle = GREY; c.fillText('Deep clean · Fri 2:00 pm', 300, y + 236);
}
function bookings(c, t) {                              // Friday: the lock screen fills up
  c.drawImage(IMG.lock, 0, 0, 600, 1280);
  const arr = [0, 1, 2, 3].map((k) => K.friday + 0.05 + k * 0.13);
  arr.forEach((q, k) => {
    const a0 = (t - q) / 0.24; if (a0 <= 0) return;
    let slot = 0; for (let m = k + 1; m < 4; m++) slot += eio((t - arr[m]) / 0.24);
    const y = 376 + slot * 147 - 46 * (1 - expo(a0));
    c.save(); c.globalAlpha = clamp(a0 * 2.2); const s0 = lerp(0.9, 1, back(a0)); c.translate(300, y + 85); c.scale(s0, s0); c.drawImage(IMG['nb' + (3 - k)], -300, -85, 600, 163); c.restore();
  });
}
S.fixed = (x, t) => {
  stage(x, false);
  const p = P(SITEP.cx, SITEP.cy, SITEP.s * (1 + 0.03 * clamp((t - T0.fixed) / 3))), kl = clamp((t - K.friday) / 0.3);
  phone(x, p, 'site', { over: (c) => {
    siteLayer(c, t, ease((t - K.fix) / 0.35)); bookedSheet(c, t);
    if (kl > 0) { c.save(); c.globalAlpha = kl; bookings(c, t); c.restore(); }
  } });
  const tk = (t - (K.booked - 0.5)) / 0.8;            // the tap that works
  if (tk > 0 && tk < 1) { const [fx, fy] = toSlide(p, 300, 867); touch(x, lerp(980, fx, ease(tk * 1.8)), lerp(1500, fy, ease(tk * 1.8)), Math.sin(tk * Math.PI) * 1.4, clamp((t - K.booked + 0.05) / 0.3)); }
};

// ---------- Alex, on the phone to a new customer ----------
function callBanner(x, t) {
  const k = (t - T0.ring - 0.12) / 0.35; if (k <= 0) return;
  const y = lerp(170, 310, expo(k)), ring_ = 1 + 0.06 * Math.max(0, Math.sin((t - T0.ring) * 18));
  x.save(); x.globalAlpha = clamp(k * 2); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 30;
  rrx(x, 72, y - 72, 936, 144, 44); x.fillStyle = 'rgba(28,28,30,.94)'; x.fill(); x.shadowBlur = 0;
  x.beginPath(); x.arc(152, y, 44, 0, TAU); x.fillStyle = '#48484A'; x.fill();
  setF(x, '600 34px Body'); x.fillStyle = WHT; x.textAlign = 'center'; x.fillText('NC', 152, y + 12);
  x.textAlign = 'left'; setF(x, '600 38px Body'); x.fillText('New customer', 220, y - 6); setF(x, '500 28px Body'); x.fillStyle = 'rgba(255,255,255,.62)'; x.fillText('Incoming call', 220, y + 34);
  x.translate(924, y); x.scale(ring_, ring_); x.beginPath(); x.arc(0, 0, 42, 0, TAU); x.fillStyle = WHT; x.fill();
  x.rotate(-0.35); x.fillStyle = INK; rrx(x, -19, -6, 38, 12, 6); x.fill(); rrx(x, -21, -12, 11, 18, 5); x.fill(); rrx(x, 10, -12, 11, 18, 5); x.fill();
  x.restore();
}
S.ring = (x, t) => {
  pic(x, 'alex_call', 0.38, 0.5, 1.04 + 0.06 * eio((t - T0.ring) / 1.2), 820);
  veil(x, 900, 1600, 0.55);
  callBanner(x, t);
};

// ---------- the lesson: the set-up fills the screen, then shrinks to one grey line over the advice (no captions) ----------
const SETUP = [['Before you blame', 'l1'], ['your ads,', 'l1b']], ADVICE = [['try booking', 'l2'], ['yourself,', 'l2b'], ['on your phone.', 'l3']];
S.lesson = (x, t) => {
  stage(x, true);
  x.save(); zoomAt(x, 540, 860, 1 + 0.03 * clamp((t - T0.lesson) / 3));
  const fitTo = (lines, w, max) => { setF(x, '600 100px Logo', -3); return Math.min(max, 100 * w / Math.max(...lines.map(([str]) => x.measureText(str).width))); };
  const fA = fitTo(SETUP, 920, 130), fB = fitTo(ADVICE, 860, 124), fS = 62, km = eio((t - K.l2 + 0.3) / 0.4);   // it shrinks in the pause before "try"
  setF(x, '600 ' + fS + 'px Logo', -fS * 0.03);
  const wa = x.measureText(SETUP[0][0]).width, wsp = x.measureText(SETUP[0][0] + ' ').width, wb = x.measureText(SETUP[1][0]).width, L0 = 540 - (wsp + wb) / 2;
  const to = [[L0 + wa / 2, 640], [L0 + wsp + wb / 2, 640]], f = lerp(fA, fS, km);
  SETUP.forEach(([str, k], i) => rise(x, str, lerp(540, to[i][0], km), lerp(860 + i * fA * 1.1, to[i][1], km), '600 ' + f + 'px Logo', mixc(WHT, GREY, km), (t - K[k] + 0.04) / 0.38, -f * 0.03));
  ADVICE.forEach(([str, k], i) => rise(x, str, 540, 800 + i * fB * 1.1, '600 ' + fB + 'px Logo', WHT, (t - K[k] + 0.04) / 0.38, -fB * 0.03));
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
const LIGHT = { edits: 1, switch: 1, site: 1, fixed: 1 };
