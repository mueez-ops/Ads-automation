// Browser-side shots for reel_leads.js, on the phone engine in reel_phone_kit.js (loaded first).
// RECT gives the screen positions (px) of the parts the edit points at (from reel_leads_screens.js).
// Each shot picks its phone up where the last one left it (the *P functions), so the cuts between them don't show.
// ---------- helpers ----------
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

// ---------- layouts ----------
const LOCKP = P(540, 822, 0.72), HERO = P(540, 700, 0.82), REPLYP = P(540, 742, 0.92), CAMPSP = P(478, 690, 0.9), INBOXP = P(540, 676, 0.84);
const PILL_Y = 272, NOTE_Y = 376, PITCH = 147, SALES_H = 290, TY = 790;

// ---------- the hook: "47 leads. / Zero sales." on frame 0; the first line folds into a "47 leads" tag ----------
function titleSize(x) { setF(x, '600 100px Logo', -3.3); return 100 * Math.min(1.9, 900 / Math.max(x.measureText('47 leads.').width, x.measureText('Zero sales.').width)); }
function hookLine2(x, t) {                           // "Zero sales." drops away behind the rising phone
  const go = clamp((t - K.titleOut) / 0.5); if (go >= 1) return;
  const fs = titleSize(x), z = 1 + 0.03 * clamp(t / 0.9);
  x.save(); x.globalAlpha = 1 - ease(go * 1.4); x.translate(540, TY); x.scale(z, z); x.translate(0, 0.89 * fs + 420 * ein(go));
  setF(x, '600 ' + fs + 'px Logo', -fs * 0.033); x.textAlign = 'center'; x.fillStyle = INK; x.fillText('Zero sales.', 0, 0); x.restore();
}
function tag(x, t) {                                 // "47 leads.": the title's first line, then a black tag over the phone
  const fs = titleSize(x), z = 1 + 0.03 * clamp(t / 0.9), m = eio((t - K.titleOut) / 0.5);
  const sz = fs * z * Math.pow(58 / (fs * z), m), cy = lerp(TY - 0.52 * fs * z, PILL_Y, m);
  const fade = 1 - ease((t - K.zero - 0.05) / 0.35); if (fade <= 0) return;   // gone as the camera pushes in on the $0
  x.save(); x.globalAlpha = fade; x.translate(540, cy); const sc = 1 + 0.06 * K.notes.reduce((v, q) => v + bump(t, q, 0.22), 0); x.scale(sc, sc);
  setF(x, '600 ' + sz + 'px Logo', -sz * lerp(0.033, 0.02, m));
  const tw = x.measureText('47 leads').width, dw = x.measureText('.').width, bg = ease((m - 0.2) / 0.55), dot = 1 - clamp(m * 2.5);
  if (bg > 0) {
    x.save(); x.globalAlpha = bg; x.shadowColor = 'rgba(0,0,0,.16)'; x.shadowBlur = 28; x.shadowOffsetY = 10;
    const pw = tw + sz * 1.05, ph = sz * 1.46; rrx(x, -pw / 2, -ph / 2, pw, ph, ph / 2); x.fillStyle = INK; x.fill(); x.restore();
  }
  const X0 = -(tw + dw * dot) / 2; x.fillStyle = mixc(GREY, WHT, bg); x.textAlign = 'left'; x.fillText('47 leads', X0, sz * 0.35);
  if (dot > 0) { x.globalAlpha = dot; x.fillText('.', X0 + tw, sz * 0.35); }
  x.restore();
}

// ---------- the lock screen: the leads stack in, then the sales widget lands on top ----------
function lockCam(t) { const k = eio((t - K.zero - 0.05) / 0.6); return { cy: 960, z: lerp(1, 1.4, k) * (1 + 0.03 * eio((t - 1.55) / 1.1)) * (1 + 0.02 * clamp((t - K.zero - 0.65) / 0.8)) }; }
const viewP = (p, c) => P(540 + (p.cx - 540) * c.z, 960 + (p.cy - c.cy) * c.z, p.s * c.z);   // where phone p sits on screen under camera c
function lockLayer(c, t) {
  c.drawImage(IMG.lock, 0, 0, 600, 1280);
  const kz = clamp((t - K.zero) / 0.42), push = SALES_H * eio(kz);
  for (let k = 0; k < 8; k++) {                      // arrival k is lead #40 + k; the newest goes on top
    const a0 = (t - K.notes[k]) / 0.24; if (a0 <= 0) continue;
    let slot = 0; for (let m = k + 1; m < 8; m++) slot += eio((t - K.notes[m]) / 0.24);
    const y = NOTE_Y + slot * PITCH + push - 46 * (1 - expo(a0)); if (y > 1290) continue;
    c.save(); c.globalAlpha = clamp(a0 * 2.2); const s0 = lerp(0.9, 1, back(a0)); c.translate(300, y + 85); c.scale(s0, s0);
    c.drawImage(IMG['note' + (7 - k)], -300, -85, 600, 163); c.restore();
  }
  if (kz > 0) { c.save(); c.globalAlpha = clamp(kz * 2.5); const s0 = lerp(0.8, 1, back(kz)); c.translate(300, NOTE_Y + 150); c.scale(s0, s0); c.drawImage(IMG.sales, -300, -160, 600, 330); c.restore(); }
}
const lockP = (t) => P(LOCKP.cx + jolt(t, K.zero + 0.16, 7), lerp(1900, LOCKP.cy, back((t - K.phonesIn) / 0.62)), LOCKP.s);

const S = {};
S.lock = (x, t) => {
  stage(x, false);
  hookLine2(x, t);
  const c = lockCam(t), ki = clamp((t - K.phonesIn) / 0.62);
  x.save(); cam(x, 540, c.cy, c.z);
  if (ki > 0) phone3d(x, lockP(t), 'lock', { over: (cc) => lockLayer(cc, t) }, (1 - ease(ki)) * 0.75);
  tag(x, t);
  x.restore();
};

// ---------- he unlocks and texts a friend ----------
const TYPED = 'Meta ads just don’t work.';
const CHATP = P(540, 736, 0.94);
const chatP = (t) => { const p = lerpP(lerpP(viewP(LOCKP, lockCam(K.unlock)), HERO, eio((t - K.unlock) / 0.45)), CHATP, eio((t - K.unlock - 0.35) / 0.9)); p.s *= (1 + 0.02 * clamp((t - K.unlock - 1.25) / 0.5)) * (1 + 0.012 * bump(t, K.send, 0.3)); return p; };
function chatLayer(c, t) {
  if (t < K.send) {                                  // typing into the field
    const f = RECT.chat0.field, str = TYPED.slice(0, Math.floor(TYPED.length * clamp((t - K.type0) / (K.send - 0.08 - K.type0))));
    setF(c, '500 29px Body'); c.textAlign = 'left'; c.fillStyle = INK; c.fillText(str, f[0] + 28, f[1] + 47);
    c.fillRect(f[0] + 30 + c.measureText(str).width, f[1] + 18, 3, 38);
  } else {                                           // sent: the bubble rises out of the field into the thread
    const r = RECT.chat1.new, k = clamp((t - K.send) / 0.32);
    if (k < 1) {
      c.fillStyle = WHT; c.fillRect(0, r[1] - 4, 600, r[3] + 48);
      c.save(); const s0 = lerp(0.85, 1, back(k)), ax = r[0] + r[2], ay = r[1] + r[3];
      c.translate(ax, ay + (RECT.chat1.field[1] - r[1]) * (1 - expo(k))); c.scale(s0, s0); c.translate(-ax, -ay); part(c, 'chat1', r); c.restore();
    }
  }
  const ku = clamp((t - K.unlock - 0.04) / 0.42);    // the lock screen sliding up and away
  if (ku < 1) { c.fillStyle = 'rgba(0,0,0,' + 0.3 * (1 - ku) + ')'; c.fillRect(0, 0, 600, 1280); c.save(); c.translate(0, -1320 * eio(ku)); lockLayer(c, K.unlock); c.restore(); }
}
S.chat = (x, t) => {
  stage(x, false);
  const p = chatP(t);
  phone(x, p, t < K.send ? 'chat0' : 'chat1', { over: (c) => chatLayer(c, t) });
  const tk = (t - K.unlock + 0.02) / 0.5;            // the swipe up that unlocks it
  if (tk > 0 && tk < 1) { const [fx, fy] = toSlide(p, 300, lerp(1235, 640, ease(tk * 1.3))); touch(x, fx, fy, Math.sin(tk * Math.PI) * 1.4, 0); }
};

// ---------- his campaigns, switched off one by one ----------
function switchAt(c, r, on_) {
  const [X, Y, w, h] = r; c.save(); rrx(c, X, Y, w, h, h / 2); c.fillStyle = mixc('#E5E5EA', INK, on_); c.fill();
  c.shadowColor = 'rgba(0,0,0,.18)'; c.shadowBlur = 8; c.shadowOffsetY = 3; c.beginPath(); c.arc(lerp(X + 29, X + w - 29, on_), Y + h / 2, 25, 0, TAU); c.fillStyle = WHT; c.fill(); c.restore();
}
function campsLayer(c, t) {
  for (let i = 0; i < 4; i++) {
    const r = RECT.camps['tg' + i], off = i < 3 ? ease((t - K.taps[i] - 0.03) / 0.16) : 0;
    switchAt(c, r, 1 - off);
    if (off > 0) { c.fillStyle = 'rgba(255,255,255,' + 0.55 * off + ')'; c.fillRect(30, r[1] - 28, 404, r[3] + 56); }
  }
}
const campsP = (t) => { const p = lerpP(chatP(K.sw), CAMPSP, eio((t - K.sw - 0.25) / 1.15)); p.s *= 1 - 0.04 * Math.sin(Math.PI * clamp((t - K.sw) / 0.36)); return p; };
const FINGER = [[K.taps[0] - 0.5, 760, 1500, 0], [K.taps[0] - 0.04, 494, 425, 1], [K.taps[0] + 0.1, 494, 425, 1], [K.taps[1] - 0.04, 494, 547, 1], [K.taps[1] + 0.1, 494, 547, 1],
  [K.taps[2] - 0.04, 494, 669, 1], [K.taps[2] + 0.1, 494, 669, 1], [K.hover, 500, 772, 1], [K.flip - 0.14, 500, 772, 1], [K.flip, 560, 900, 0]];
S.camps = (x, t) => {
  stage(x, false);
  const p = campsP(t), k = eio((t - K.sw) / 0.36);    // swiped across from the chat
  phone(x, p, 'chat1', { sx: 600 * k, over: (c) => { c.save(); c.translate(600 * (1 - k), 0); c.drawImage(IMG.camps, 0, 0, 600, 1280); campsLayer(c, t); c.restore(); } });
  const [X, Y, a0] = kf(t, FINGER), tap = K.taps.find((q) => t >= q && t < q + 0.3);
  if (a0 > 0) { const [fx, fy] = toSlide(p, X, Y); touch(x, fx, fy, a0 * 1.3, tap ? (t - tap) / 0.3 : 0); }
};

// ---------- the phone turns round to his leads: every other one was never a buyer ----------
const DROP = [0, 2, 4, 6];
const flipK = (t) => eio((t - K.flip) / 0.44);
const inboxP = (t) => { const k = flipK(t), p = lerpP(lerpP(campsP(K.flip), INBOXP, k), P(540, 700, 0.9), eio((t - K.flip - 0.44) / 1.5)); p.s *= 1 - 0.06 * Math.sin(Math.PI * k); return p; };
function inboxLayer(c, t) {
  const Q = RECT.inbox, ls = Q.list, close = eio((t - K.serious - 0.3) / 0.45), gone = DROP.reduce((m, i) => m + Q['r' + i][3], 0);
  c.fillStyle = '#F2F2F7'; c.fillRect(0, ls[1] - 4, 600, 1290 - ls[1]);      // the list is redrawn row by row
  c.save(); rrx(c, ls[0], ls[1], ls[2], ls[3] - gone * close, 36); c.fillStyle = WHT; c.fill(); c.clip();
  let above = 0;
  for (let i = 0; i < 8; i++) {
    const r = Q['r' + i], d = DROP.indexOf(i), dy = -above * close;
    if (d < 0) { part(c, 'inbox', r, 0, dy); continue; }
    const dx = -640 * ein((t - K.serious - 0.07 * d) / 0.34), kh = clamp((t - K.half - 0.08 * d) / 0.26), m = Q['m' + i];
    part(c, 'inbox', r, dx, dy);
    if (kh > 0) {                                    // greyed and struck through, then swiped out of the list
      c.fillStyle = 'rgba(255,255,255,' + 0.5 * ease(kh) + ')'; c.fillRect(r[0] + dx, r[1] + dy + 2, r[2], r[3] - 2);
      const yy = m[1] + m[3] * 0.55 + dy; c.strokeStyle = INK; c.lineWidth = 3.5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(m[0] + dx - 6, yy); c.lineTo(m[0] + dx - 6 + (m[2] + 12) * expo(kh), yy); c.stroke();
    }
    above += r[3];
  }
  c.restore();
}
S.inbox = (x, t) => {
  stage(x, false);
  const k = flipK(t), p = inboxP(t);
  if (k < 0.5) phone3d(x, p, 'camps', { over: (c) => campsLayer(c, t) }, 0, Math.PI * k);
  else phone3d(x, p, 'inbox', { over: (c) => inboxLayer(c, t) }, 0, Math.PI * (k - 1));
};

// ---------- "47 leads" again, crossed out ----------
function struck(x, t, dy, alpha) {
  const ks = clamp((t - K.slam) / 0.3); if (ks <= 0 || alpha <= 0) return;
  const kg = ease((t - K.grey) / 0.3), size = 118, fg = mixc(WHT, GREY, kg), d = t - K.slam;
  const sc = (1 + 0.45 * Math.exp(-d * 14) * (d < 0.4 ? 1 : 0)) * (1 + 0.06 * clamp(d / 1.6));
  x.save(); x.globalAlpha = alpha * clamp(ks * 3); x.translate(540 + jolt(t, K.slam, 12), 760 + dy); x.scale(sc, sc);
  setF(x, '600 ' + size + 'px Logo', -size * 0.02);
  const tw = x.measureText('47 leads').width, pw = tw + size * 1.05, ph = size * 1.46;
  x.save(); x.shadowColor = 'rgba(0,0,0,.16)'; x.shadowBlur = 34; x.shadowOffsetY = 12; rrx(x, -pw / 2, -ph / 2, pw, ph, ph / 2); x.fillStyle = mixc(INK, '#E3E3E8', kg); x.fill(); x.restore();
  x.fillStyle = fg; x.textAlign = 'center'; x.fillText('47 leads', 0, size * 0.35);
  const kk = clamp((t - K.strike) / 0.28);
  if (kk > 0) { x.strokeStyle = fg; x.lineWidth = 10; x.lineCap = 'round'; x.beginPath(); x.moveTo(-tw / 2 - 14, 6); x.lineTo(-tw / 2 - 14 + (tw + 28) * expo(kk), 6); x.stroke(); }
  x.restore();
}
const wasntP = (t) => { const p = inboxP(T0.wasnt), ko = ein(clamp((t - T0.wasnt) / 0.42)); return P(p.cx, p.cy + 1500 * ko, p.s * (1 - 0.08 * ko)); };
S.wasnt = (x, t) => {
  stage(x, false);
  if (t < T0.wasnt + 0.42) phone(x, wasntP(t), 'inbox', { over: (c) => inboxLayer(c, t) });
  struck(x, t, 0, 1);
};

// ---------- the right person ----------
const rightP = (t) => P(HERO.cx, lerp(1900, HERO.cy, back((t - T0.right - 0.08) / 0.62)), HERO.s * (1 + 0.03 * clamp((t - T0.right - 0.7) / 1.2)));
function leadLayer(c, t) { K.ticks.forEach((q, i) => { const r = RECT.lead['q' + i]; CHECK(c, r[0] + 26, r[1] + 26, 26, (t - q) / 0.3); }); }
S.right = (x, t) => {
  stage(x, false);
  const go = ein(clamp((t - T0.right) / 0.34)); if (go < 1) struck(x, t, -900 * go, 1 - go);
  const ki = clamp((t - T0.right - 0.08) / 0.62);
  if (ki > 0) phone3d(x, rightP(t), 'lead', { over: (c) => leadLayer(c, t) }, (1 - ease(ki)) * 0.75);
};

// ---------- the follow-up: a reply in 3 minutes, a call booked ----------
function replyLayer(c, t) {
  const Q = RECT.reply;
  [['m1', K.m1, 0.5], ['m2', K.m2, 1], ['m3', K.m3, 0], ['m4', K.m4, 0.5]].forEach(([id, q, side]) => {    // the thread builds up message by message
    const r = Q[id], k = clamp((t - q) / 0.3); if (k >= 1) return;
    c.fillStyle = WHT; c.fillRect(0, r[1] - 6, 600, r[3] + 12); if (k <= 0) return;
    c.save(); c.globalAlpha = clamp(k * 3); const s0 = lerp(0.6, 1, back(k)), ax = r[0] + r[2] * side, ay = r[1] + r[3];
    c.translate(ax, ay); c.scale(s0, s0); c.translate(-ax, -ay); part(c, 'reply', r); c.restore();
  });
  ring(c, Q.m1, (t - K.m1 - 0.1) / 0.35, 10);
}
S.follow = (x, t) => {
  stage(x, false);
  const k = eio((t - T0.follow) / 0.42), pL = lerpP(rightP(T0.follow), P(-460, HERO.cy, HERO.s), k);
  const pR = lerpP(lerpP(P(1560, HERO.cy, HERO.s), HERO, k), REPLYP, eio((t - T0.follow - 0.35) / 1.0));
  phone(x, pL, 'lead', { over: (c) => leadLayer(c, t) });
  phone(x, pR, 'reply', { over: (c) => replyLayer(c, t) });
};

// ---------- the lesson: more leads pour into a cracked funnel; none of them come out as sales ----------
const FT = 360, FB = 760, FS = 840, HW0 = 340, HW1 = 62;       // funnel top, neck, spout end; half widths at top and neck
const hw = (y) => lerp(HW0, HW1, clamp((y - FT) / (FB - FT)));
const YC = 569, C0 = [540 + hw(524), 524], C1 = [540 + hw(614), 614], XC = 540 + hw(YC);   // the crack in the right wall
function poly(x, pts, k) {                           // a polyline drawing itself (k = 0..1)
  if (k <= 0) return; let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  x.save(); x.setLineDash([len * k, len + 20]); x.beginPath(); pts.forEach(([X, Y], i) => (i ? x.lineTo(X, Y) : x.moveTo(X, Y))); x.stroke(); x.restore();
}
function funnel(x, t) {
  const kd = (t - T0.fix - 0.02) / 0.4, j = jolt(t, K.broken, 9);
  x.save(); x.strokeStyle = WHT; x.lineWidth = 7; x.lineCap = 'round'; x.lineJoin = 'round';
  poly(x, [[540 - HW0, FT], [540 - HW1, FB], [540 - HW1, FS]], kd);
  poly(x, [[540 + HW0, FT], C0, [C0[0] - 14 + j, C0[1] + 12], [C0[0] - 4 + j, C0[1] + 24]], kd * 1.2);
  poly(x, [[C1[0] + 5 - j, C1[1] - 24], [C1[0] + 15 - j, C1[1] - 11], C1, [540 + HW1, FB], [540 + HW1, FS]], kd * 1.1);
  x.restore();
  const kb = clamp((t - K.broken) / 0.35);            // "broken": a ring round the crack
  if (kb > 0) {
    x.save(); const q = x.createRadialGradient(XC, YC, 0, XC, YC, 130); q.addColorStop(0, 'rgba(255,255,255,' + 0.22 * bump(t, K.broken, 0.6) + ')'); q.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = q; x.fillRect(XC - 130, YC - 130, 260, 260);
    x.strokeStyle = WHT; x.lineWidth = 5; x.setLineDash([2 * Math.PI * 86 * expo(kb), 1000]); x.beginPath(); x.arc(XC, YC, 86, -Math.PI / 2, 1.5 * Math.PI); x.stroke(); x.restore();
  }
  x.save(); setF(x, '600 40px Body'); x.textAlign = 'right';
  x.globalAlpha = ease((t - T0.fix - 0.25) / 0.3); x.fillStyle = GREY; x.fillText('Leads', 540 - HW0 - 26, FT + 14);
  x.globalAlpha = ease((t - T0.fix - 0.35) / 0.3); x.fillStyle = mixc(GREY, WHT, ease((t - K.broken) / 0.2)); x.fillText('Follow-up', 540 - hw(YC) - 28, YC + 14);
  x.restore();
}
const NDOT = 180;
function dots(x, t) {                                // each lead falls in, is pulled to the crack and spills out
  for (let i = 0; i < NDOT; i++) {
    const u = t - (K.more - 0.05 + 2.3 * Math.pow(i / NDOT, 0.85)); if (u < 0) continue;
    const ux = (R(i) * 2 - 1) * 0.82, v0 = 160 + 200 * R(i + 500), rad = 7 + 5 * R(i + 900), y0 = 120 + 90 * R(i + 1300), gr = 1500;
    const tc = (-v0 + Math.sqrt(v0 * v0 + 2 * gr * (YC - y0))) / gr;
    let X, Y, grey = 0;
    if (u < tc) {
      Y = y0 + v0 * u + 0.5 * gr * u * u;
      const xf = 540 + ux * (Y < FT ? HW0 - 34 : hw(Y) - 24);
      X = lerp(xf, XC, Math.pow(sstep((Y - 410) / (YC - 410)), 1.4));
    } else {
      const v = u - tc, vy = (v0 + gr * tc) * 0.45;
      X = XC + (240 + 200 * R(i + 1700)) * v; Y = YC + vy * v + 0.5 * gr * v * v; grey = clamp(v / 0.45);
    }
    const al = 1 - clamp((Y - 860) / 130); if (al <= 0) continue;
    x.globalAlpha = al * clamp(u / 0.08); x.fillStyle = mixc(WHT, '#5A5A5E', grey); x.beginPath(); x.arc(X, Y, rad, 0, TAU); x.fill();
  }
  x.globalAlpha = 1;
}
S.fix = (x, t) => {
  stage(x, true);
  const u = t - T0.fix;
  x.save(); zoomAt(x, 540, 640, 1 + 0.04 * clamp(u / 2.7)); x.translate(jolt(t, K.broken, 10), 0);
  dots(x, t); funnel(x, t);
  pill(x, '0 sales', 540, 908, 46, false, (t - K.sales) / 0.3, { w: 600, f: 'Body', sc: 1 + 0.08 * bump(t, K.process, 0.3) });
  x.restore();
};

// ---------- end card ----------
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

// captions are dark type on these light stages
const LIGHT = { lock: 1, chat: 1, camps: 1, inbox: 1, wasnt: 1, right: 1, follow: 1 };
