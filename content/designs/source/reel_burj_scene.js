// Browser-side shots for reel_burj.js. The facts half draws the tower photo (burj_tower.jpg: Pexels 3463043 at 0.62 of
// its 4692 x 7038 px; every position below is in those original px) under a slow camera, with the floor highlight,
// the altitude line and The Lounge's photo card; its type is drawn by overlay(), so it stays crisp while the camera
// moves. The switch half runs on the phone engine in reel_phone_kit.js (loaded first).

// ---------- the tower photo ----------
const TW = 4692, TH = 7038, YEL = '#FFC93C';
// floors 152 to 154 (about 575 to 590 m): height -> photo row from a perspective fit through the antenna tip (829.8 m)
// and the copper mechanical bands (levels 40-42, 73-75, 109-111, 136-138); good to a couple of floors
const zToY = (z) => (-8.421335807438819 * z + 8286.986147736838) / (0.001940965861986966 * z + 1);
const BAR = [2140, 1545, 2430, 1640];                // the highlight: x0, y0, x1, y1
const CAMK = [[0, 2350, 3650, 0.285], [K.push, 2330, 3330, 0.335], [K.push + 1.05, 2290, 2272, 0.5],
  [K.tense, 2290, 2236, 0.53], [T0.phone, 2290, 2150, 0.6]];   // [time, centre x, centre y, frame px per photo px]
const view = (t) => kf(t, CAMK);
const toF = (v, X, Y) => [540 + (X - v[0]) * v[2], 960 + (Y - v[1]) * v[2]];

// ---------- the reference look: heavy type, white or yellow, a thick dark outline ----------
function otext(x, str, X, Y, size, fill, align = 'center') {
  x.save(); setF(x, '900 ' + size + 'px Mont', -size * 0.01); x.textAlign = align; x.lineJoin = 'round';
  x.shadowColor = 'rgba(0,0,0,.4)'; x.shadowBlur = size * 0.22; x.shadowOffsetY = size * 0.05;
  x.lineWidth = size * 0.17; x.strokeStyle = '#141414'; x.strokeText(str, X, Y);
  x.shadowColor = 'transparent'; x.fillStyle = fill; x.fillText(str, X, Y); x.restore();
}
// a line of words [{w, s, y}] centred on X; each word appears as it is spoken (s), the yellow ones (y) are the key ones
function ophrase(x, ws, X, Y, size, maxW, t, all = false) {
  const measure = () => { setF(x, '900 ' + size + 'px Mont', -size * 0.01); const sp = x.measureText(' ').width, wid = ws.map((w) => x.measureText(w.w).width); return [sp, wid, wid.reduce((p, q) => p + q, 0) + sp * (ws.length - 1)]; };
  let [sp, wid, tot] = measure();
  if (tot > maxW) { size *= maxW / tot; [sp, wid, tot] = measure(); }
  let cx = X - tot / 2;
  ws.forEach((w, i) => {
    const k = all ? 1 : (t - w.s) / 0.1;
    if (k > 0) {
      const sc = 1 + 0.1 * (1 - ease(k));
      x.save(); x.translate(cx + wid[i] / 2, Y - size * 0.35); x.scale(sc, sc); otext(x, w.w, 0, size * 0.35, size, w.y ? YEL : WHT); x.restore();
    }
    cx += wid[i] + sp;
  });
}

// ---------- the facts half, one continuous camera ----------
function floorBar(x, t, v) {                         // floors 152-154 light up, left to right
  const k = (t - K.bar) / 0.35; if (k <= 0) return;
  const [ax, ay] = toF(v, BAR[0], BAR[1]), [bx, by] = toF(v, BAR[2], BAR[3]), h = by - ay, pulse = 0.5 + 0.5 * Math.sin((t - K.bar) * 5);
  x.save(); x.shadowColor = YEL; x.shadowBlur = 26 + 16 * pulse;
  rrx(x, ax, ay, Math.max(h, (bx - ax) * expo(k)), h, h / 2); x.fillStyle = 'rgba(255,201,60,.5)'; x.fill();
  x.lineWidth = 4; x.strokeStyle = YEL; x.stroke(); x.restore();
  const kl = (t - K.l152) / 0.3; if (kl <= 0) return;   // the label, to the right
  x.save(); x.translate(bx + 22, (ay + by) / 2); x.scale(back(kl), back(kl)); otext(x, '152–154', 0, 22, 64, YEL, 'left'); x.restore();
}
function altitude(x, t, v) {                         // 585 m, measured from the ground up to those floors
  if (t < K.alt) return;
  const z = 585 * ease((t - K.alt) / (K.altEnd - K.alt)), [ax, ay] = toF(v, BAR[0], BAR[1]), by = toF(v, 0, BAR[3])[1];
  const X = ax - 26, head = toF(v, 0, zToY(z))[1], fade = 1 - clamp((t - LN.high.e - 0.2) / 0.35);
  if (fade > 0 && head < H) {
    x.save(); x.globalAlpha = fade; x.setLineDash([14, 10]); x.lineWidth = 5; x.strokeStyle = YEL; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 8;
    x.beginPath(); x.moveTo(X, H); x.lineTo(X, head); x.stroke(); x.setLineDash([]);
    [100, 200, 300, 400, 500].forEach((m) => { const y = toF(v, 0, zToY(m))[1]; if (m <= z && y < H) { x.beginPath(); x.moveTo(X - 14, y); x.lineTo(X + 14, y); x.stroke(); } });
    x.restore();
  }
  const ly = Math.min(Math.max(head, (ay + by) / 2), 1440);   // waits at the bottom of the frame until the line gets there
  otext(x, Math.round(z) + ' M', X - 22, ly + 22, 64, YEL, 'right');
}
const CARD = { cx: 540, cy: 1000, w: 780, h: 521 };
function loungeCard(x, t, v) {                       // the photo of The Lounge comes out of those floors
  const k = (t - K.card) / 0.5; if (k <= 0) return;
  const [fx, fy] = toF(v, (BAR[0] + BAR[2]) / 2, (BAR[1] + BAR[3]) / 2), m = expo(k), sc = 0.12 + 0.88 * back(k);
  const cx = lerp(fx, CARD.cx, m), cy = lerp(fy, CARD.cy, m) + jolt(t, K.book, 10), w = CARD.w * sc, h = CARD.h * sc;
  x.save(); x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 50; x.shadowOffsetY = 18; rrx(x, cx - w / 2, cy - h / 2, w, h, 30 * sc); x.fillStyle = '#000'; x.fill(); x.restore();
  x.save(); rrx(x, cx - w / 2, cy - h / 2, w, h, 30 * sc); x.clip();
  const z = 1 + 0.05 * clamp((t - K.card) / 8), iw = w * z, ih = h * z;   // a slow push into the room
  x.drawImage(IMG.burj_lounge, cx - iw / 2, cy - ih / 2, iw, ih); x.restore();
  rrx(x, cx - w / 2, cy - h / 2, w, h, 30 * sc); x.lineWidth = 4; x.strokeStyle = 'rgba(255,255,255,.75)'; x.stroke();
  const kr = (t - K.rec) / 0.3;                        // Guinness: the highest lounge in a building
  if (kr > 0) { x.save(); x.translate(cx + w / 2 - 150, cy - h / 2 + 4); x.rotate(0.07); x.scale(back(kr), back(kr)); tag(x, 'WORLD RECORD', 34, YEL, INK); x.restore(); }
  const kb = (t - K.book) / 0.22;                      // stamped: you need a booking
  if (kb > 0) {
    const ss = 1 + 0.7 * (1 - ein(Math.min(1, kb)));
    x.save(); x.translate(cx + w / 2 - 190, cy + h / 2 - 66); x.rotate(-0.1); x.scale(ss, ss); x.globalAlpha = clamp(kb * 2);
    setF(x, '900 46px Mont', 0); const tw = x.measureText('BOOKING ONLY').width;
    rrx(x, -tw / 2 - 26, -42, tw + 52, 84, 16); x.fillStyle = 'rgba(0,0,0,.6)'; x.fill(); x.lineWidth = 7; x.strokeStyle = YEL; x.stroke();
    x.fillStyle = YEL; x.textAlign = 'center'; x.fillText('BOOKING ONLY', 0, 16); x.restore();
  }
}
function tag(x, str, size, bg, fg) {                 // a small label, centred on 0, 0
  setF(x, '900 ' + size + 'px Mont', 0); const tw = x.measureText(str).width, h = size * 1.6;
  rrx(x, -tw / 2 - size * 0.6, -h / 2, tw + size * 1.2, h, h / 2); x.fillStyle = bg; x.fill(); x.lineWidth = 5; x.strokeStyle = '#141414'; x.stroke();
  x.fillStyle = fg; x.textAlign = 'center'; x.fillText(str, 0, size * 0.36);
}
function bait(x, t) {
  const v = view(t), tk = clamp((t - K.tense) / (T0.phone - K.tense)), hb = Math.max(...BEATS.map((q) => bump(t, q, 0.22)));
  x.fillStyle = '#5A8ED6'; x.fillRect(0, 0, W, H);
  x.save();
  if (tk > 0) { zoomAt(x, 540, 960, 1 + 0.018 * hb); x.translate(jolt(t, T0.phone - 0.28, 12), 0); x.filter = 'saturate(' + (1 - 0.85 * tk) + ') brightness(' + (1 - 0.3 * tk) + ') contrast(' + (1 + 0.12 * tk) + ')'; }
  x.drawImage(IMG.burj_tower, 540 - v[0] * v[2], 960 - v[1] * v[2], TW * v[2], TH * v[2]);
  const q = x.createLinearGradient(0, 1150, 0, H); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,.35)'); x.fillStyle = q; x.fillRect(0, 1150, W, H - 1150);
  x.fillStyle = 'rgba(0,0,0,' + 0.14 * ease((t - K.card) / 0.5) + ')'; x.fillRect(0, 0, W, H);   // a little darker behind the card and its type
  floorBar(x, t, v); altitude(x, t, v); loungeCard(x, t, v);
  x.restore();
  if (tk > 0) vignette(x, 0.75 * tk);
}

// ---------- overlay: the written hook, the phrases, the title, the clock (crisp, over the motion blur) ----------
const HOOK = [[['LET', 'ME', 'EXPLAIN'], 86, WHT], [['WHAT’S', 'ON', 'THE'], 86, WHT], [['TOP', 'FLOORS'], 132, YEL], [['OF', 'THE', 'BURJ', 'KHALIFA'], 80, WHT]];
function hookBlock(x, t) {
  const out_ = clamp((t - K.hookOut + 0.2) / 0.25); if (out_ >= 1) return;
  const sc = (1.035 - 0.035 * ease(t / 0.6)) * (1 - 0.08 * out_);
  x.save(); x.globalAlpha = 1 - out_; zoomAt(x, 540, 1250, sc);
  let y = 1128;
  HOOK.forEach(([ws, size, col], i) => {
    ophrase(x, ws.map((w) => ({ w, s: 0, y: col === YEL })), 540, y, size, 940, t, true);
    y += (HOOK[i + 1] ? HOOK[i + 1][1] : 0) * 1.06;
  });
  x.restore();
}
function overlay(t) {
  if (t >= T0.phone) return;
  hookBlock(g, t);
  const p = PHR.find((q) => t >= q.s && t < q.e);
  if (p) {
    const a = PHR.some((q) => q.s === p.e) ? 1 : clamp((p.e - t) / 0.08);
    g.save(); g.globalAlpha = a;
    if (p.title) { const k = (t - p.s) / 0.3; g.translate(540, 1410); g.scale(back(k), back(k)); otext(g, 'THE LOUNGE', 0, 50, 136, YEL); }
    else ophrase(g, p.words, 540, 1440, 88, 920, t);
    g.restore();
  }
  const kc = (t - K.tense - 0.15) / 0.25;              // a clock: how long you have been watching
  if (kc > 0) {
    g.save(); g.globalAlpha = clamp(kc); setF(g, '600 44px Body', 0); const str = '0:' + String(Math.floor(t)).padStart(2, '0'), tw = g.measureText(str).width;
    rrx(g, 540 - tw / 2 - 64, 262, tw + 104, 76, 38); g.fillStyle = 'rgba(0,0,0,.6)'; g.fill();
    g.fillStyle = (t * 2) % 1 < 0.6 ? '#FF3B30' : 'rgba(255,59,48,.35)'; g.beginPath(); g.arc(540 - tw / 2 - 30, 300, 11, 0, TAU); g.fill();
    g.fillStyle = WHT; g.textAlign = 'left'; g.fillText(str, 540 - tw / 2 - 6, 316); g.restore();
  }
}

const S = {};
S.hook = bait; S.floors = bait; S.lounge = bait; S.tense = bait;

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
  setF(c, '500 26px Body', 0); c.fillStyle = 'rgba(255,255,255,.9)'; c.textAlign = 'left'; c.fillText('Let me explain what’s on the top…', 30, 1090);
  if (ad > 0) {                                      // the call to action every ad gets
    c.save(); c.globalAlpha = ad; c.translate(0, 50 * (1 - ad)); rrx(c, 24, 1118, 552, 90, 18); c.fillStyle = 'rgba(255,255,255,.96)'; c.fill();
    setF(c, '700 34px Body', 0); c.fillStyle = INK; c.fillText('Book now', 54, 1176); c.textAlign = 'right'; c.fillText('›', 548, 1177); c.restore();
  }
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(0, 1254, 600, 7); c.fillStyle = WHT; c.fillRect(0, 1254, 600 * 0.7, 7);
  const kt = (t - T0.phone - 0.3) / 0.3;               // the clock, counting the time you watched
  if (kt > 0) {
    const n = Math.round(19 * clamp((t - K.watched) / (K.n19 - K.watched))), str = '0:' + String(n).padStart(2, '0');
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

// ---------- the line to remember: each line rises on its word (no captions under it) ----------
const LAST = [['Run ads people', 'l1'], ['actually watch.', 'l2'], ['Then sell.', 'l3']];
S.last = (x, t) => {
  stage(x, true);
  x.save(); zoomAt(x, 540, 900, 1 + 0.03 * clamp((t - T0.last) / 3));
  setF(x, '600 130px Logo', -4); const fs = 130 * Math.min(1, 900 / Math.max(...LAST.map(([str]) => x.measureText(str).width)));
  LAST.forEach(([str, k], i) => {
    const Y = 760 + i * fs * 1.16 + (i === 2 ? fs * 0.14 : 0), kk = (t - K[k] + 0.04) / 0.38, f = '600 ' + fs + 'px Logo';
    if (i === 2 && kk > 0) {                           // the payoff, in a box
      setF(x, f, -fs * 0.03); const w = x.measureText(str).width + fs * 0.5;
      x.fillStyle = WHT; x.fillRect(540 - w / 2, Y - fs * 0.84, w * expo(kk / 0.6), fs * 1.08);
    }
    rise(x, str, 540, Y, f, i === 2 ? INK : WHT, kk, -fs * 0.03);
  });
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

// captions are white type on every stage here (the facts half draws its own)
const LIGHT = {};
