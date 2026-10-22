// Browser-side shots for reel_cheap.js, on the phone engine in reel_phone_kit.js (loaded first).
// RECT gives the screen positions (px) of the parts the edit points at (from reel_cheap_screens.js).
// ---------- layouts ----------
const DUO = { A: P(290, 652, 0.55), B: P(790, 652, 0.55) };
const HERO_A = P(540, 700, 0.82), HERO_B = P(650, 700, 0.82);
const A_PRICES = ['$25', '$22', '$19', '$17', '$15'];
const PRICE = [RECT.a.price[0], RECT.a.price[1] + 16, RECT.a.price[2] - 4, RECT.a.price[3] - 30];   // the "$25" glyphs, not its line box
const WAR = [[150, 400, '$24'], [440, 450, '$20'], [118, 870, '$18'], [462, 905, '$16']];
const toast = (x, k) => { if (k <= 0) return; x.save(); x.translate(300, 1146); const s = back(k); x.scale(s, s);   // "Booked" on B's screen
  rrx(x, -150, -42, 300, 84, 42); x.fillStyle = INK; x.fill(); setF(x, '600 36px Body'); x.fillStyle = WHT; x.textAlign = 'center'; x.fillText('✓  Booked', 0, 13); x.restore(); };
function labels(x, a) {
  if (a <= 0) return; x.save(); x.globalAlpha = a; setF(x, '600 60px Logo', -1); x.textAlign = 'center'; x.fillStyle = GREY;
  x.fillText('A', DUO.A.cx, 272); x.fillText('B', DUO.B.cx, 272); x.restore();
}

// ---------- shots ----------
const S = {};
S.open = (x, t) => {
  stage(x, false);
  // the written hook: on screen from the very first frame, then up and away as the ads arrive
  const go = clamp((t - K.titleOut) / 0.42);
  if (go < 1) { x.save(); x.globalAlpha = 1 - ease(go); x.translate(0, -320 * ein(go));
    const z = 1 + 0.03 * clamp(t / 0.9); x.translate(540, 780); x.scale(z, z); x.translate(-540, -780);
    const LINES = [[['The cheaper', GREY]], [['business ', GREY], ['lost', INK]], [['the customer.', INK]]];
    setF(x, '600 100px Logo', -3.3); const wid = (ln) => ln.reduce((m, [str]) => m + x.measureText(str).width, 0);
    const fs = 100 * Math.min(1.45, 900 / Math.max(...LINES.map(wid))); setF(x, '600 ' + fs + 'px Logo', -fs * 0.033); x.textAlign = 'left';
    LINES.forEach((ln, i) => { let X = 540 - wid(ln) / 2; ln.forEach(([str, col]) => { x.fillStyle = col; x.fillText(str, X, 780 + (i - 1) * fs * 1.06 + fs * 0.36); X += x.measureText(str).width; }); }); x.restore(); }
  // the two ads spring up from below, tilted back
  const kin = (d) => clamp((t - K.phonesIn - d) / 0.62);
  const ka = kin(0), kb = kin(0.08);
  const dimA = 0.55 * ease((t - K.tap - 0.1) / 0.4), sA = DUO.A.s * lerp(1, 0.94, ease((t - K.tap - 0.1) / 0.5)), bounceB = 1 + 0.05 * bump(t, K.tap, 0.32);
  const pA = P(DUO.A.cx, lerp(1750, DUO.A.cy, back(ka)), sA), pB = P(DUO.B.cx, lerp(1750, DUO.B.cy, back(kb)), DUO.B.s * bounceB);
  if (ka > 0) phone3d(x, pA, 'a', { dim: dimA }, (1 - ease(ka)) * 0.75);
  if (kb > 0) phone3d(x, pB, 'b', { over: (c) => toast(c, (t - K.tap - 0.08) / 0.3) }, (1 - ease(kb)) * 0.75);
  labels(x, ease((t - K.phonesIn - 0.35) / 0.3));
  const ap = clamp((t - K.same) / 0.3); if (ap > 0) { x.save(); x.globalAlpha = ease(ap); setF(x, '600 96px Logo'); x.textAlign = 'center'; x.fillStyle = GREY; x.fillText('≈', 540, 672); x.restore(); }
  pill(x, '$25', DUO.A.cx, 560, 62, true, (t - K.price) / 0.3, { alpha: 1 - 0.5 * dimA / 0.55 });
  pill(x, '$60', DUO.B.cx, 560, 62, false, (t - K.price2) / 0.3, { sc: 1 + 0.12 * bump(t, K.expensive, 0.4) });
  // the customer taps "Book" on B
  const [bx, by] = toSlide(pB, 300, 970), tk = (t - (K.tap - 0.45)) / 0.8;
  if (tk > 0 && tk < 1) touch(x, lerp(980, bx, ease(tk * 1.8)), lerp(1300, by, ease(tk * 1.8)), Math.sin(tk * Math.PI) * 1.4, clamp((t - K.tap) / 0.3));
};

S.a_ad = (x, t) => {
  stage(x, false);
  const u = t - T0.a_ad, k = eio(u / 0.55), push = 1 + 0.02 * ease((u - 0.55) / 1.3);
  const from = P(DUO.A.cx, DUO.A.cy, DUO.A.s * 0.94), pA = lerpP(from, HERO_A, k); pA.s *= push;
  const pB = lerpP(DUO.B, P(1450, 700, DUO.B.s), ein(clamp(u / 0.45)));
  phone(x, pB, 'b', { alpha: 1 - ease(u / 0.45), over: (c) => toast(c, 1) });
  phone(x, pA, 'a', { dim: 0.55 * (1 - ease(u / 0.35)), over: (c) => ring(c, PRICE, (t - K.low) / 0.38, 12) });
  const fade = 1 - ease(u / 0.3);
  labels(x, fade); x.save(); x.globalAlpha = fade; setF(x, '600 96px Logo'); x.textAlign = 'center'; x.fillStyle = GREY; x.fillText('≈', 540, 672); x.restore();
  pill(x, '$25', lerp(DUO.A.cx, 540, k), lerp(560, 420, k), 62, true, 1, { alpha: fade });
  pill(x, '$60', lerp(DUO.B.cx, 1400, k), 560, 62, false, 1, { alpha: fade });
};

// B's callouts: a label on the left, a thin line to the outline on the screen
function callout(x, p, r, str, k) {
  if (k <= 0) return; const [sx, sy] = toSlide(p, r[0] - 18, r[1] + r[3] / 2), edge = toSlide(p, 0, 0)[0] - 34, a = ease(k);
  x.save(); x.globalAlpha = a; x.strokeStyle = INK; x.lineWidth = 3; x.beginPath(); x.moveTo(sx - 4, sy); x.lineTo(lerp(sx - 4, edge, a), sy); x.stroke(); x.restore();
  x.save(); x.globalAlpha = a; setF(x, '600 36px Body'); const tw = x.measureText(str).width, pw = tw + 38, cx = edge - pw / 2;
  pill(x, str, cx + (1 - a) * 30, sy, 36, false, k, { w: 600, f: 'Body', line: true }); x.restore();
}
S.b_ad = (x, t) => {
  stage(x, false);
  const u = t - T0.b_ad, k = eio(u / 0.5), push = 1 + 0.02 * ease((u - 0.5) / 3.4);
  const aEnd = P(HERO_A.cx, HERO_A.cy, HERO_A.s * 1.02), pA = lerpP(aEnd, P(-460, HERO_A.cy, HERO_A.s), k);
  const pB = lerpP(P(1560, HERO_B.cy, HERO_B.s), HERO_B, k); pB.s *= push;
  phone(x, pA, 'a', { over: (c) => ring(c, PRICE, 1, 12) });
  phone(x, pB, 'b', { over: (c) => { ring(c, RECT.b.who, (t - K.who) / 0.38); ring(c, RECT.b.prob, (t - K.what) / 0.38, 12); } });
  callout(x, pB, RECT.b.who, 'Who it’s for', (t - K.who - 0.15) / 0.3);
  callout(x, pB, RECT.b.prob, 'Problem it solves', (t - K.what - 0.15) / 0.3);
};

S.compare = (x, t) => {
  stage(x, false);
  const u = t - T0.compare, k = eio(u / 0.55);
  const bEnd = P(HERO_B.cx, HERO_B.cy, HERO_B.s * 1.02), bv = eio((t - K.value) / 0.45);
  const pB = lerpP(bEnd, DUO.B, k); pB.s *= 1 + 0.12 * bv; pB.cy -= 10 * bv;
  const war = K.war.filter((q) => t >= q).length, shake = K.war.reduce((m, q) => m + bump(t, q, 0.18), 0);
  const dimA = 0.5 * bv, pA = lerpP(P(-420, DUO.A.cy, DUO.A.s), DUO.A, k); pA.cx += Math.sin(t * 90) * 5 * shake;
  phone(x, pA, 'a', { dim: dimA });
  phone(x, pB, 'b', { over: (c) => { ring(c, RECT.b.who, 1); ring(c, RECT.b.prob, 1, 12); } });
  labels(x, k * (1 - bv));
  // A drops its price again and again; other cheap offers crowd round it
  WAR.forEach(([X, Y, str], i) => pill(x, str, X, Y, 40, false, (t - K.war[i] - 0.04) / 0.28, { alpha: 1 - 0.6 * bv, fg: GREY, bg: '#E8E8ED' }));
  pill(x, A_PRICES[war], DUO.A.cx + (pA.cx - DUO.A.cx), 560, 62, true, k, { alpha: 1 - 0.5 * bv, sc: 1 + 0.1 * shake });
  pill(x, '$60', pB.cx, lerp(560, 520, bv), 62, false, k);
  const [cx, cy] = toSlide(pB, 600, 0); CHECK(x, cx - 14, cy + 6, 44, (t - K.understand) / 0.3);
};

S.lesson = (x, t) => {
  stage(x, true);
  const u = t - T0.lesson, z = 1 + 0.035 * clamp(u / 3.7);
  x.save(); cam(x, 540, 960, z);
  const mv = eio((t - K.lessonQ - 0.62) / 0.38);       // "The lesson?" moves up into a small label
  x.save(); x.translate(lerp(540, 540, mv), lerp(790, 360, mv)); const s = lerp(1, 0.46, mv); x.scale(s, s);
  rise(x, 'The lesson?', 0, 0, '600 132px Logo', mv > 0.5 ? GREY : WHT, (t - K.lessonQ + 0.05) / 0.35, -3); x.restore();
  rise(x, 'Low price', 540, 620, '600 150px Logo', WHT, (t - K.lowPrice) / 0.3, -4);
  const slam = (q) => (t < q ? 0 : 1 + 0.45 * Math.exp(-(t - q) * 14) * (t - q < 0.4 ? 1 : 0));
  const sh = (q) => { const d = t - q; return d > 0 && d < 0.3 ? Math.sin(d * 80) * Math.exp(-d * 16) * 14 : 0; };
  if (t >= K.neq) { x.save(); x.translate(540 + sh(K.neq), 790); const s2 = slam(K.neq); x.scale(s2, s2); setF(x, '600 170px Logo'); x.textAlign = 'center'; x.fillStyle = GREY; x.fillText('≠', 0, 56); x.restore(); }
  if (t >= K.attractive) { x.save(); x.translate(540 + sh(K.attractive), 905); const s3 = slam(K.attractive); x.scale(s3, s3); setF(x, '600 116px Logo', -3); x.textAlign = 'center'; x.fillStyle = WHT; x.fillText('attractive offer', 0, 40); x.restore(); }
  x.restore();
};

S.rescue = (x, t) => {
  stage(x, false);
  const u = t - T0.rescue, p = P(540, 700, 0.82 * (1 + 0.02 * clamp(u / 3)));
  const sy0 = RECT.feed.ad[1] - 104, sy = sy0 + 1150 * expo((t - K.flick) / 0.75) + 55 * Math.max(0, t - K.flick - 0.75);   // then keeps drifting, like a thumb still scrolling
  const tk = (t - (K.flick - 0.3)) / 0.75;
  phone(x, p, 'feed', { sy, over: (c) => { const q = c.createLinearGradient(0, 0, 0, 120); q.addColorStop(0, 'rgba(255,255,255,1)'); q.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = q; c.fillRect(0, 0, 600, 120); } });
  if (tk > 0 && tk < 1) { const [fx, fy] = toSlide(p, 330, lerp(1020, 330, ease((tk - 0.3) / 0.5))); touch(x, fx, fy, Math.sin(tk * Math.PI) * 1.4, clamp((tk - 0.25) / 0.2)); }
};

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
const LIGHT = { open: 1, a_ad: 1, b_ad: 1, compare: 1, rescue: 1 };
