// Browser-side shots for reel_goal.js, on the phone engine in reel_phone_kit.js (loaded first).
// RECT gives the screen positions (px) of the parts the edit points at (from reel_goal_screens.js).
// Each shot picks its phone up where the last one left it (the *P functions), so the cuts between them don't show.

// ---------- layouts ----------
const HOOKP = P(540, 720, 0.82), HOOK_PUSH = P(540, 514, 1.0), HERO = P(540, 700, 0.82), NOTHINGP = P(540, 430, 0.95);
const BECAUSEP = P(540, 370, 1.0), REVEALP = P(540, 300, 1.12), PICKP = P(540, 430, 0.95);
const VAL = 128, TY = 780;                           // the big numbers on the results screen (screen px); the title's centre line
const fmt = (n) => Math.round(n).toLocaleString('en-US');

// ---------- the hook: "2,000 clicks. / 0 enquiries." on frame 0, folding into the numbers on his results screen ----------
const TITLE = [['2,000', ' clicks.', GREY, 'v1'], ['0', ' enquiries.', INK, 'v2']];
function titleSize(x) { setF(x, '600 100px Logo', -3.3); return 100 * Math.min(1.9, 900 / Math.max(...TITLE.map(([a, b]) => x.measureText(a + b).width))); }
function hookTitle(x, t, p) {
  const m = eio((t - K.titleOut) / 0.5); if (m >= 1) return;
  const fs = titleSize(x), z = 1 + 0.03 * clamp(t / 0.9);
  TITLE.forEach(([num, rest, col, id], i) => {
    setF(x, '600 ' + fs + 'px Logo', -fs * 0.033); const wid = x.measureText(num + rest).width;
    const r = RECT.dash[id], [tx, ty] = toSlide(p, r[0], r[1] + 104);
    const size = fs * z * Math.pow(VAL * p.s / (fs * z), m), X = lerp(540 - wid * z / 2, tx, m), Y = lerp(TY + ((i - 0.5) * 1.06 + 0.36) * fs * z, ty, m);
    setF(x, '600 ' + size + 'px Logo', -size * lerp(0.033, 0.04, m)); x.textAlign = 'left';
    x.fillStyle = mixc(col, INK, m); x.fillText(num, X, Y);
    const a = 1 - clamp(m * 2.2); if (a > 0) { x.save(); x.globalAlpha = a; x.fillStyle = col; x.fillText(rest, X + x.measureText(num).width, Y); x.restore(); }
  });
}

// ---------- the results screen: the numbers, and the campaign goal hidden until the reveal ----------
function dashLayer(c, t, ringAt) {
  const Q = RECT.dash;
  if (t >= K.titleOut + 0.5) {
    setF(c, '600 ' + VAL + 'px Logo', -VAL * 0.04); c.fillStyle = INK; c.textAlign = 'left';
    c.fillText(fmt(2000 + 1120 * ease((t - K.count - 0.05) / 0.6)), Q.v1[0], Q.v1[1] + 104);       // clicks keep coming
    const ox = Q.v2[0] + 36, oy = Q.v2[1] + 60, sc = 1 + 0.14 * bump(t, K.zero, 0.3);                   // the zero: bumps, then shakes
    c.save(); c.translate(ox + jolt(t, K.enq, 9) + jolt(t, K.nothing, 12), oy); c.scale(sc, sc); c.fillText('0', Q.v2[0] - ox, Q.v2[1] + 104 - oy); c.restore();
  }
  const g = Q.goal, kr = clamp((t - K.reveal) / 0.28);
  c.save(); setF(c, '600 31px Body'); c.textAlign = 'right';
  if (kr < 1) { c.globalAlpha = 1 - kr; rrx(c, g[0] + 4, g[1], g[2] - 4, g[3], g[3] / 2); c.fillStyle = '#E5E5EA'; c.fill(); c.globalAlpha = 1; }
  c.filter = 'blur(' + (7 * (1 - ease(kr))).toFixed(2) + 'px)'; c.fillStyle = mixc('#8E8E93', INK, kr); c.fillText('Traffic', g[0] + g[2] - 18 * (1 - kr), g[1] + 33);
  c.restore();
  if (ringAt !== undefined) ring(c, [g[0] + 4, g[1], g[2] - 4, g[3]], (t - ringAt) / 0.35, 10);
}

const hookP = (t) => {
  const p = lerpP(P(HOOKP.cx, lerp(1900, HOOKP.cy, eio((t - K.titleOut) / 0.55)), HOOKP.s), HOOK_PUSH, eio((t - K.push) / 1.0));
  p.s *= 1 + 0.04 * clamp((t - 1.4) / 1.3); return p;
};
const S = {};
S.hook = (x, t) => {
  stage(x, false);
  const p = hookP(t);
  if (t > K.titleOut) phone(x, p, 'dash', { over: (c) => dashLayer(c, t, K.wrong) });
  hookTitle(x, t, p);                                // alone on frame 0, then folding into the numbers
};

// ---------- he edits the ad: new photo, new headline, new audience ----------
function editLayer(c, t) {                           // over 'ed0', in screen px
  const ph = RECT.ed0.ph, hl = RECT.ed0.hl, kp = eio((t - K.photo) / 0.34), kh = eio((t - K.headline) / 0.3);
  if (kp > 0) { c.save(); c.beginPath(); c.rect(...ph); c.clip(); part(c, 'ed0', ph, -600 * kp); part(c, 'ed1', ph, 600 * (1 - kp)); c.restore(); }
  if (kh > 0) { c.save(); c.beginPath(); c.rect(...hl); c.clip(); part(c, 'ed1', hl, 0, -hl[3] * kh); part(c, 'ed2', hl, 0, hl[3] * (1 - kh)); c.restore(); }
  const ks = clamp((t - K.sheet) / 0.32);
  if (ks > 0) {
    const y = 720 + 560 * (1 - expo(ks)), r = RECT.aud0.chips, kc = clamp((t - K.chips) / 0.25);
    c.drawImage(IMG.aud0, 0, y, 600, 560);
    if (kc > 0) { c.save(); c.globalAlpha = kc; const s0 = lerp(0.94, 1, back(kc)), cx = r[0] + r[2] / 2, cy = y + r[1] + r[3] / 2;
      c.translate(cx, cy); c.scale(s0, s0); c.translate(-cx, -cy); part(c, 'aud1', r, 0, y); c.restore(); }
  }
}
const tweakP = (t) => lerpP(lerpP(hookP(K.nav), HERO, eio((t - K.nav) / 0.45)), NOTHINGP, eio((t - K.back) / 0.5));
S.tweak = (x, t) => {
  stage(x, false);
  const p = tweakP(t), out_ = t < K.back, k = out_ ? eio((t - K.nav) / 0.45) : 1 - eio((t - K.back) / 0.5);   // the edit screen slides over the results and back
  phone(x, p, 'dash', { sx: 600 * k, over: (c) => {
    c.save(); c.translate(-600 * k, 0); dashLayer(c, t); c.restore();
    c.save(); c.translate(600 * (1 - k), 0); c.drawImage(IMG.ed0, 0, 0, 600, 1280); editLayer(c, t); c.restore();
  } });
  const ts = (t - (K.photo - 0.12)) / 0.55;          // a swipe across the photo, then a tap on the headline
  if (ts > 0 && ts < 1) { const [fx, fy] = toSlide(p, lerp(500, 110, eio(ts * 1.25)), 500); touch(x, fx, fy, Math.sin(ts * Math.PI) * 1.4, 0); }
  const th = (t - (K.headline - 0.35)) / 0.6;
  if (th > 0 && th < 1) { const [fx, fy] = toSlide(p, lerp(470, 230, ease(th * 1.6)), lerp(1000, 778, ease(th * 1.6))); touch(x, fx, fy, Math.sin(th * Math.PI) * 1.4, clamp((t - K.headline + 0.05) / 0.3)); }
};

// ---------- inside the campaign (black): the goal it was given ----------
const becauseP = (t) => lerpP(tweakP(T0.because), BECAUSEP, eio((t - T0.because - 0.3) / 1.0));
S.because = (x, t) => {
  stage(x, true);
  phone(x, becauseP(t), 'dash', { over: (c) => dashLayer(c, t, K.exactly) });
};

// ---------- the people Meta can show the ad to ----------
const GX = (i) => 204 + (i % 7) * 112, GY = (i) => 330 + Math.floor(i / 7) * 100;
const ENQ = [9, 17, 22, 30, 38];                     // the ones who would enquire
const CLK = [...Array(42).keys()].filter((i) => !ENQ.includes(i) && R(i * 7 + 3) < 0.42);   // the ones who click
const ORDER = [...Array(42).keys()].sort((a, b) => Math.hypot(GX(a) - 540, GY(a) - 580) - Math.hypot(GX(b) - 540, GY(b) - 580));
const PILL_Y = 935, CLK_X = 320, ENQ_X = 760, DIM = '#48484A';
function person(x, X, Y, s, col) {
  if (s <= 0) return; x.save(); x.translate(X, Y); x.scale(s, s); x.fillStyle = col;
  x.beginPath(); x.arc(0, -18, 14, 0, TAU); x.fill(); x.beginPath(); x.ellipse(0, 22, 26, 24, 0, Math.PI, 2 * Math.PI); x.fill(); x.restore();
}
const fly = (x, i, k, tx, col) => {                  // one person flying into a counter, shrinking as they go
  const X = lerp(GX(i), tx, eio(k)), Y = lerp(GY(i), PILL_Y, ein(k)) - 60 * Math.sin(Math.PI * k); person(x, X, Y, lerp(1, 0.35, k), col);
};
function crowd(x, t, t0, skip, colOf) {              // everyone else, popping in from the middle
  ORDER.forEach((i, r) => { if (!skip(i)) person(x, GX(i), GY(i), back((t - t0 - 0.012 * r) / 0.25), colOf(i)); });
}
function trafficGrid(x, t) {                         // Traffic: the clickers light up and pour into "Clicks"; "Enquiries" stays at 0
  const launch = (j) => K.clickers + 0.25 + 0.045 * j, isC = (i) => CLK.indexOf(i);
  crowd(x, t, K.gridIn + 0.05, (i) => isC(i) >= 0 && t >= launch(isC(i)), (i) => (isC(i) >= 0 ? mixc(DIM, WHT, ease((t - K.clickers - 0.02 * isC(i)) / 0.15)) : DIM));
  CLK.forEach((i, j) => { const k = (t - launch(j)) / 0.42; if (k >= 0 && k < 1) fly(x, i, k, CLK_X, WHT); });
  const kr = clamp((t - K.enquire) / 0.4);           // the ones he wanted, still sitting there
  if (kr > 0) ENQ.forEach((i) => { x.save(); x.strokeStyle = GREY; x.lineWidth = 3; x.setLineDash([7, 9]); x.beginPath(); x.arc(GX(i), GY(i), 44, -Math.PI / 2, -Math.PI / 2 + TAU * expo(kr)); x.stroke(); x.restore(); });
  const first = launch(0) + 0.42, n = 2000 * ease((t - first) / (0.045 * (CLK.length - 1) + 0.05)), kp = (t - K.gridIn - 0.25) / 0.3;
  pill(x, 'Clicks ' + fmt(n), CLK_X, PILL_Y, 40, false, kp, { w: 600, f: 'Body', sc: 1 + 0.06 * bump(t, first, 0.045 * CLK.length + 0.3) });
  pill(x, 'Enquiries 0', ENQ_X, PILL_Y, 40, false, kp, { w: 600, f: 'Body', bg: '#2C2C2E', fg: GREY, sc: 1 + 0.1 * bump(t, K.notE, 0.3) });
}
function leadsGrid(x, t) {                           // Leads: a search across everyone, then the enquirers pour into "Enquiries"
  const a0 = ease((t - K.gridBack - 0.05) / 0.3); if (a0 <= 0) return;
  const launch = (j) => K.fill + 0.09 * j, isE = (i) => ENQ.indexOf(i), sx = lerp(130, 950, eio((t - K.scan) / (K.ones - K.scan)));
  x.save(); x.globalAlpha = a0;
  crowd(x, t, K.gridBack, (i) => isE(i) >= 0 && t >= launch(isE(i)), (i) => {
    const lit = isE(i) >= 0 ? ease((t - K.ones - 0.05 * isE(i)) / 0.15) : 0, near = t > K.scan && t < K.ones + 0.2 ? Math.max(0, 1 - Math.abs(GX(i) - sx) / 90) * 0.5 : 0;
    return mixc(DIM, WHT, Math.max(lit, near));
  });
  ENQ.forEach((i, j) => { const k = (t - launch(j)) / 0.4; if (k >= 0 && k < 1) fly(x, i, k, ENQ_X, WHT); });
  const got = ENQ.filter((i, j) => t >= launch(j) + 0.4).length, bumps = ENQ.reduce((v, i, j) => v + bump(t, launch(j) + 0.4, 0.22), 0);
  pill(x, 'Clicks', CLK_X, PILL_Y, 40, false, 1, { w: 600, f: 'Body', bg: '#2C2C2E', fg: GREY });
  pill(x, 'Enquiries ' + got, ENQ_X, PILL_Y, 40, false, 1, { w: 600, f: 'Body', bg: got ? WHT : '#2C2C2E', fg: got ? INK : GREY, sc: 1 + 0.08 * bumps + 0.08 * bump(t, K.fill + 0.88, 0.35) });
  x.restore();
}

// ---------- the goal was Traffic: Meta finds the people who click ----------
const trafficP = (t) => { const p = lerpP(becauseP(T0.traffic), REVEALP, eio((t - K.reveal) / 0.5)); p.cy -= 1400 * ein((t - K.gridIn) / 0.4); return p; };
S.traffic = (x, t) => {
  stage(x, true);
  trafficGrid(x, t);                                 // the crowd underneath, as the phone lifts away
  if (t < K.gridIn + 0.4) phone(x, trafficP(t), 'dash', { over: (c) => dashLayer(c, t, K.exactly) });
};

// ---------- switch the goal to Leads: Meta goes after the people who enquire ----------
function radio(c, r, on) {
  const cx = r[0] + 22, cy = r[1] + 22; c.save(); c.beginPath(); c.arc(cx, cy, 20, 0, TAU); c.lineWidth = 3; c.strokeStyle = mixc('#C7C7CC', INK, on); c.stroke();
  if (on > 0) { c.beginPath(); c.arc(cx, cy, 20 * on, 0, TAU); c.fillStyle = INK; c.fill(); c.beginPath(); c.arc(cx, cy, 8 * on, 0, TAU); c.fillStyle = WHT; c.fill(); }
  c.restore();
}
function pickLayer(c, t) { const k = ease((t - K.tap - 0.03) / 0.18); [0, 1, 2, 3, 4].forEach((i) => radio(c, RECT.pick['d' + i], i === 1 ? 1 - k : i === 3 ? k : 0)); }
const pickP = (t) => P(PICKP.cx, lerp(1900, PICKP.cy, back((t - T0.leads) / 0.5)) + 1500 * ein((t - K.gridBack) / 0.4), PICKP.s);
S.leads = (x, t) => {
  stage(x, true);
  const fo = 1 - ease((t - T0.leads) / 0.22); if (fo > 0) { x.save(); x.globalAlpha = fo; trafficGrid(x, t); x.restore(); }
  leadsGrid(x, t);                                   // back underneath as the phone drops away
  if (t < K.gridBack + 0.4) {
    const p = pickP(t); phone(x, p, 'pick', { over: (c) => pickLayer(c, t) });
    const g = RECT.pick.g3, [fx, fy] = toSlide(p, 300, g[1] + g[3] / 2), tk = (t - (K.tap - 0.4)) / 0.75;   // a tap on "Leads"
    if (tk > 0 && tk < 1) touch(x, lerp(900, fx, ease(tk * 1.8)), lerp(1300, fy, ease(tk * 1.8)), Math.sin(tk * Math.PI) * 1.4, clamp((t - K.tap) / 0.3));
  }
};

// ---------- the line to remember: each line rises on its word (no captions under it) ----------
const ASK = [['Ask for', WHT, 'ask'], ['enquiries,', WHT, 'enqW'], ['not clicks.', GREY, 'notC']];
S.ask = (x, t) => {
  stage(x, true);
  x.save(); zoomAt(x, 540, 780, 1 + 0.035 * clamp((t - T0.ask) / 2));
  setF(x, '600 150px Logo', -4.5); const fs = 150 * Math.min(1, 900 / Math.max(...ASK.map(([str]) => x.measureText(str).width)));
  ASK.forEach(([str, col, k], i) => rise(x, str, 540, 660 + i * fs * 1.08, '600 ' + fs + 'px Logo', col, (t - K[k] + 0.04) / 0.38, -fs * 0.03));
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
const LIGHT = { hook: 1, tweak: 1 };
