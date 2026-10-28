// Browser-side shots for reel_brez.js (classic script after reel_kit_browser.js and reel_phone_kit.js, whose
// helpers it uses). Two looks mixed: the addxstudio explainer (kinetic type that builds word by word with the key
// words in red, an invoice card on paper, coral-to-purple gradients, a number ticker, inline icons, a gradient
// figure beside a cutout) and the Rushmore/Eiffel switch reels (a photo under the written hook on the first frame,
// photo cards with white pills and stamps, the tension, the switch, the pitch). Sources are in small print.

const RED = '#E5463B', PAPER = '#F2F0EB', CHAR = '#1C1C20', INKD = '#18181B', SOFT = '#8E8E93';
const kk = (t, t0, d = 0.3) => clamp((t - t0) / d);

// ---------- drawing helpers ----------
function pic(x, im, x0, y0, w, h, z = 1, fx = 0.5, fy = 0.5) {   // cover-fit an image into a box
  const sc = Math.max(w / im.width, h / im.height) * z, iw = im.width * sc, ih = im.height * sc;
  let dx = x0 + w / 2 - fx * iw, dy = y0 + h / 2 - fy * ih;
  dx = Math.min(x0, Math.max(x0 + w - iw, dx)); dy = Math.min(y0, Math.max(y0 + h - ih, dy));
  x.drawImage(im, dx, dy, iw, ih);
}
const clean = (w) => w.toLowerCase().replace(/[^\w$,'-]/g, '');
// a narrated line as kinetic type: each word rises in as it is said; o.red lists the words in red
function kin(x, line, t, o = {}) {
  const ws = LW[line].slice(o.from || 0, o.to);
  const size = o.size || 84; setF(x, (o.w || 600) + ' ' + size + 'px Logo', -size * 0.025);
  const max = o.max || 900, sp = x.measureText(' ').width, rows = [[]];
  let rw = 0;
  ws.forEach((w) => {
    const ww = x.measureText(w.w.replace(/'/g, '’')).width, row = rows[rows.length - 1];
    if (row.length && rw + sp + ww > max) { rows.push([]); rw = 0; }
    rows[rows.length - 1].push({ ...w, ww }); rw += (rows[rows.length - 1].length > 1 ? sp : 0) + ww;
  });
  const lh = size * (o.lh || 1.16), y0 = o.y - ((rows.length - 1) * lh) / 2;
  x.save(); x.textAlign = 'left'; x.textBaseline = 'alphabetic';
  if (o.shadow) { x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = 24; }
  rows.forEach((row, ri) => {
    const tw = row.reduce((a2, q) => a2 + q.ww, 0) + sp * (row.length - 1);
    let X = (o.x ?? 540) - tw / 2;
    row.forEach((w) => {
      const k = o.all ? 1 : clamp((t - w.s + 0.06) / 0.16);
      if (k > 0) {
        x.globalAlpha = k * (o.alpha ?? 1);
        x.fillStyle = (o.red || []).includes(clean(w.w)) ? (o.redc || RED) : (o.color || INKD);
        x.fillText(w.w.replace(/'/g, '’'), X, y0 + ri * lh + (1 - ease(k)) * size * 0.3);
      }
      X += w.ww + sp;
    });
  });
  x.restore();
}
function fine(x, str, a, dark) {                     // the source, in small print
  if (a <= 0) return; x.save(); x.globalAlpha = a * 0.8; setF(x, '500 26px Body', 0); x.fillStyle = dark ? '#6E6E73' : 'rgba(255,255,255,.75)';
  x.textAlign = 'center'; x.fillText(str, 540, 1832); x.restore();
}
function grid(x, col) {                              // the reference's faint layout grid and corner ticks
  x.save(); x.strokeStyle = col; x.lineWidth = 1.5;
  [90, 990].forEach((X) => { x.beginPath(); x.moveTo(X, 0); x.lineTo(X, H); x.stroke(); });
  [[90, 260], [990, 260], [90, 1660], [990, 1660]].forEach(([X, Y]) => { x.fillStyle = RED; x.fillRect(X - 4, Y - 4, 8, 8); });
  x.restore();
}
function gradientBg(x, t, light = 0) {               // coral into purple, slowly moving
  x.fillStyle = mixc('#FF7550', '#FFE4D6', light); x.fillRect(0, 0, W, H);
  [['#A855F7', 0.95, 0.15, 900], ['#FF4D6D', 0.1, 0.85, 800], ['#FFB38A', 0.2, 0.2, 700], ['#7C3AED', 0.9, 0.9, 760]].forEach(([c, fx, fy, r], i) => {
    const X = W * fx + Math.sin(t * 0.7 + i * 1.7) * 120, Y = H * fy + Math.cos(t * 0.5 + i) * 140;
    const q = x.createRadialGradient(X, Y, 0, X, Y, r); q.addColorStop(0, c + (light ? '55' : 'CC')); q.addColorStop(1, c + '00');
    x.fillStyle = q; x.fillRect(0, 0, W, H);
  });
}
let PAPERTEX = null;
function paperTex() {                                // warm paper with grain and a few fibres
  if (PAPERTEX) return PAPERTEX;
  const [c, x] = mkc(820, 1000); x.fillStyle = '#EEE7D8'; x.fillRect(0, 0, 820, 1000);
  x.globalAlpha = 0.18; x.globalCompositeOperation = 'multiply'; x.drawImage(NOISE[2], 0, 0, 820, 1000); x.drawImage(NOISE[4], 0, 0, 820, 1000);
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 0.08; x.strokeStyle = '#8A7A5A';
  for (let i = 0; i < 40; i++) { x.beginPath(); const X = R(i) * 820, Y = R(i + 50) * 1000; x.moveTo(X, Y); x.lineTo(X + (R(i + 9) - 0.5) * 60, Y + (R(i + 19) - 0.5) * 30); x.stroke(); }
  const q = x.createLinearGradient(0, 0, 820, 1000); q.addColorStop(0, 'rgba(255,255,255,.18)'); q.addColorStop(1, 'rgba(120,100,70,.12)');
  x.globalAlpha = 1; x.fillStyle = q; x.fillRect(0, 0, 820, 1000);
  PAPERTEX = c; return c;
}
function paperCard(x, cx, cy, w, h, rot, k) {        // the invoice card, dropping in
  if (k <= 0) return null; const e = back(k);
  x.save(); x.translate(cx, cy + (1 - ease(k)) * 140); x.rotate(rot * e); x.scale(0.9 + 0.1 * e, 0.9 + 0.1 * e); x.globalAlpha *= clamp(k * 3);
  x.shadowColor = 'rgba(60,40,20,.28)'; x.shadowBlur = 50; x.shadowOffsetY = 24;
  x.drawImage(paperTex(), -w / 2, -h / 2, w, h); x.shadowBlur = 0; x.shadowOffsetY = 0;
  return () => x.restore();
}
function stamp(x, str, X, Y, k, o = {}) {           // a rubber stamp landing
  if (k <= 0) return; const sc = slam(k * 0.2) * (o.sc || 1);
  x.save(); x.translate(X, Y); x.rotate(o.rot ?? -0.12); x.scale(sc, sc); x.globalAlpha *= clamp(k * 5) * (o.alpha ?? 1);
  setF(x, '800 ' + (o.size || 70) + 'px Logo', 3); const w = x.measureText(str).width + 70, h = (o.size || 70) * 1.35;
  x.strokeStyle = o.col || RED; x.lineWidth = 8; rrx(x, -w / 2, -h / 2, w, h, 14); x.stroke();
  if (o.fill) { x.fillStyle = o.fill; x.fill(); }
  x.fillStyle = o.col || RED; x.textAlign = 'center'; x.fillText(str, 0, (o.size || 70) * 0.36); x.restore();
}
const O = { f: 'Body', w: 600 };

// ---------- the hook: the Lambo at night, the line written on the first frame ----------
function hook(x, t) {
  x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
  const z = 1.0 + 0.22 * (1 - expo(t / 0.7)) + 0.03 * clamp(t / 2.4);   // a fast push on frame 0, then a drift
  x.save(); zoomAt(x, 540, 900, z); x.filter = 'brightness(1.35) contrast(1.05)'; pic(x, IMG.brez_lambo, -40, 0, 1160, 1920, 1, 0.66, 0.55); x.filter = 'none'; x.restore();
  const q = x.createLinearGradient(0, 900, 0, 1920); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(0.55, 'rgba(0,0,0,.85)'); q.addColorStop(1, 'rgba(0,0,0,.95)');
  x.fillStyle = q; x.fillRect(0, 900, W, 1020);
  x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(0, 0, W, H);
  // the written hook: "This is the reality of / Brez Scales." ("reality" turns red as it is said)
  x.save(); x.textAlign = 'center'; x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 30;
  setF(x, '600 74px Logo', -2); const l1 = ['This is the ', 'reality', ' of'], w1 = l1.map((s0) => x.measureText(s0).width);
  let X = 540 - w1.reduce((a2, b) => a2 + b, 0) / 2; x.textAlign = 'left';
  l1.forEach((s0, i) => { x.fillStyle = i === 1 ? mixc('#FFFFFF', RED, kk(t, K.reality, 0.2)) : WHT; x.fillText(s0, X, 1350); X += w1[i]; });
  setF(x, '800 150px Logo', -6); x.textAlign = 'center'; x.fillStyle = WHT; x.fillText('Brez Scales.', 540, 1500);
  x.restore();
  const u = ease(kk(t, K.reality + 0.1, 0.3));          // the underline under "reality"
  if (u > 0) { setF(x, '600 74px Logo', -2); const a0 = x.measureText('This is the ').width, aw = x.measureText('reality').width, tot = w1.reduce((a2, b) => a2 + b, 0);
    x.fillStyle = RED; x.fillRect(540 - tot / 2 + a0, 1368, aw * u, 7); }
}

// ---------- the claim: the invoice card ----------
function claim(x, t) {
  x.fillStyle = '#E9E7E2'; x.fillRect(0, 0, W, H); grid(x, 'rgba(0,0,0,.06)');
  kin(x, 'claim', t, { y: 400, size: 76, red: ['$400,000', '21'], max: 880 });
  const k = kk(t, T0.claim - 0.05, 0.45), done = paperCard(x, 540, 1080, 760, 640, -0.045, k);
  if (done) {
    setF(x, '700 70px Logo', -2); x.fillStyle = INKD; x.textAlign = 'left'; x.fillText('Revenue', -320, -200);
    setF(x, '500 30px Body', 0); x.fillStyle = '#6B6455';
    ['Claimed by: Brez Scales', 'Age: 20', 'Independently verified: no'].forEach((s0, i) => { x.fillText('•  ' + s0, -320, -130 + i * 46); });
    x.strokeStyle = 'rgba(80,60,40,.35)'; x.setLineDash([6, 8]); x.lineWidth = 2; x.beginPath(); x.moveTo(-320, 90); x.lineTo(320, 90); x.stroke(); x.setLineDash([]);
    setF(x, '500 28px Body', 0); x.textAlign = 'right'; x.fillText('Monthly amount (claimed)', 320, 140);
    // the number rolls like the reference's $650 -> $710 -> $680, then lands
    const r = kk(t, K.money400 - 0.05, 0.9), vals = [12000, 96000, 230000, 410000, 380000, 400000];
    const v = r >= 1 ? 400000 : vals[Math.min(vals.length - 1, Math.floor(r * vals.length))];
    setF(x, '800 132px Logo', -5); x.fillStyle = RED; x.fillText('$' + v.toLocaleString('en-US'), 330, 270);
    done();
  }
  stamp(x, 'UNVERIFIED', 540, 1530, kk(t, K.turned21 + 0.25, 1), { rot: -0.08, size: 66 });   // under the card, clear of the number
  fine(x, 'His own figure. Not independently verified.', kk(t, K.turned21, 0.4), true);
}

// ---------- the open loop ----------
function loop(x, t) {
  x.fillStyle = PAPER; x.fillRect(0, 0, W, H); grid(x, 'rgba(0,0,0,.05)');
  kin(x, 'loop', t, { y: 900, size: 104, red: ['where', 'you', 'think'], max: 860, w: 600 });
}

// ---------- the lecture hall ----------
function school(x, t) {
  const u = t - T0.school;
  x.save(); zoomAt(x, 540, 900, 1.04 + 0.05 * clamp(u / 4)); pic(x, IMG.brez_lecture, 0, 0, W, H, 1, 0.35, 0.5); x.restore();
  x.fillStyle = 'rgba(10,10,14,' + (0.35 + 0.3 * ease(kk(t, K.drops, 0.3))) + ')'; x.fillRect(0, 0, W, H);
  const q = x.createLinearGradient(0, 1100, 0, 1920); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,.8)'); x.fillStyle = q; x.fillRect(0, 1100, W, 820);
  pill(x, 'Late 2022', 540, 470, 44, false, kk(t, K.y2022 - 0.05), O);
  pill(x, 'College: digital marketing', 540, 600, 40, true, kk(t, K.marketing - 0.1), { ...O, bg: 'rgba(20,20,24,.9)', fg: WHT });
  x.save(); x.translate(jolt(t, K.drops, 10), 0);
  stamp(x, 'DROPPED OUT', 540, 960, kk(t, K.drops - 0.02, 1), { col: WHT, size: 84, rot: -0.09 });
  x.restore();
  kin(x, 'school', t, { y: 1450, size: 64, color: WHT, red: ['drops', 'out'], redc: '#FF6B5E', shadow: true, from: 2, max: 900 });
  fine(x, 'Source: Whop blog (2025)', kk(t, T0.school + 0.3, 0.4));
}

// ---------- the start: icons in the line, then clothing for a cut ----------
function phoneIcon(x, X, Y, s, k) {                 // a cracked phone
  if (k <= 0) return; x.save(); x.translate(X, Y); x.scale(s * back(k), s * back(k)); x.rotate(-0.08);
  rrx(x, -55, -100, 110, 200, 22); x.fillStyle = '#111'; x.fill(); rrx(x, -48, -90, 96, 180, 16); x.fillStyle = '#2A2F3A'; x.fill();
  x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(-30, -60); x.lineTo(5, -10); x.lineTo(-10, 30); x.lineTo(25, 80);
  x.moveTo(5, -10); x.lineTo(40, -40); x.moveTo(-10, 30); x.lineTo(-44, 50); x.stroke(); x.restore();
}
function appTile(x, X, Y, s, k, kind) {             // generic app tiles: a design app, a short-video app
  if (k <= 0) return; x.save(); x.translate(X, Y); x.scale(s * back(k), s * back(k));
  rrx(x, -90, -90, 180, 180, 42);
  if (kind === 'design') { const q = x.createLinearGradient(-90, -90, 90, 90); q.addColorStop(0, '#22D3EE'); q.addColorStop(1, '#7C3AED'); x.fillStyle = q; }
  else x.fillStyle = '#0B0B0F';
  x.fill();
  x.fillStyle = WHT; x.strokeStyle = WHT; x.lineWidth = 12; x.lineCap = 'round';
  if (kind === 'design') { x.beginPath(); x.moveTo(-40, 45); x.lineTo(35, -40); x.stroke(); x.beginPath(); x.arc(-44, 50, 14, 0, TAU); x.fill(); }
  else { x.beginPath(); x.moveTo(-26, -40); x.lineTo(44, 0); x.lineTo(-26, 40); x.closePath(); x.fill(); }
  x.restore();
}
function shirt(x, X, Y, s, k) {                      // a T-shirt cutout
  if (k <= 0) return; x.save(); x.translate(X, Y + (1 - ease(k)) * 80); x.scale(s, s); x.globalAlpha *= clamp(k * 3);
  x.shadowColor = 'rgba(0,0,0,.18)'; x.shadowBlur = 40; x.shadowOffsetY = 18;
  x.beginPath(); x.moveTo(-70, -150); x.quadraticCurveTo(0, -105, 70, -150); x.lineTo(190, -95); x.lineTo(150, 0); x.lineTo(110, -20); x.lineTo(110, 170);
  x.lineTo(-110, 170); x.lineTo(-110, -20); x.lineTo(-150, 0); x.lineTo(-190, -95); x.closePath();
  const q = x.createLinearGradient(0, -150, 0, 170); q.addColorStop(0, '#2B2B31'); q.addColorStop(1, '#141418'); x.fillStyle = q; x.fill(); x.shadowBlur = 0;
  setF(x, '800 44px Logo', 2); x.fillStyle = 'rgba(255,255,255,.9)'; x.textAlign = 'center'; x.fillText('BRAND', 0, 30); x.restore();
}
function start(x, t) {
  const second = t >= K.clothing - 0.15;
  if (!second) {
    gradientBg(x, t);
    kin(x, 'start', t, { y: 560, size: 80, color: WHT, to: 7, red: [], max: 860 });
    phoneIcon(x, 250, 1120, 1.25, kk(t, K.phone - 0.08));
    appTile(x, 540, 1120, 1.0, kk(t, K.canva - 0.08), 'design');
    appTile(x, 830, 1120, 1.0, kk(t, K.tiktok - 0.08), 'video');
    [[250, 'cracked phone', K.phone], [540, 'Canva', K.canva], [830, 'TikTok', K.tiktok]].forEach(([X, s0, t0]) => pill(x, s0, X, 1330, 34, true, kk(t, t0 + 0.1), { ...O, bg: 'rgba(20,20,24,.85)', fg: WHT }));
    fine(x, 'Source: Whop blog (2025)', kk(t, T0.start + 0.3, 0.4));
  } else {
    x.fillStyle = PAPER; x.fillRect(0, 0, W, H); grid(x, 'rgba(0,0,0,.05)');
    kin(x, 'start', t, { y: 430, size: 76, from: 7, red: ['cut', 'profits'], max: 860 });
    shirt(x, 400, 1150, 1.25, kk(t, K.clothing - 0.1, 0.4));
    const kc = kk(t, K.cut - 0.05, 0.35);                // a gradient figure beside the cutout, as in the reference
    if (kc > 0) { x.save(); x.globalAlpha = clamp(kc * 2); x.translate(0, (1 - ease(kc)) * 50); setF(x, '800 250px Logo', -8);
      const q = x.createLinearGradient(560, 0, 960, 0); q.addColorStop(0, '#7C3AED'); q.addColorStop(1, '#FF6B4A'); x.fillStyle = q; x.textAlign = 'left'; x.fillText('%', 640, 1180);
      setF(x, '600 36px Body', 0); x.fillStyle = '#6E6E73'; x.fillText('of their profits', 650, 1250); x.restore(); }
    fine(x, 'Source: course review (2026)', kk(t, K.clothing, 0.4), true);
  }
}

// ---------- the cars: three photo cards, three stamps ----------
function carCard(x, im, Y, k, fx, fy, label, st, kst, tilt, sp = [210, 70]) {
  if (k <= 0) return; const e = expo(k), X = 540 + (1 - e) * 1100;
  x.save(); x.translate(X, Y); x.rotate(tilt * e);
  x.shadowColor = 'rgba(0,0,0,.25)'; x.shadowBlur = 40; x.shadowOffsetY = 16; rrx(x, -430, -200, 860, 400, 30); x.fillStyle = '#000'; x.fill(); x.shadowBlur = 0; x.shadowOffsetY = 0;
  x.save(); rrx(x, -430, -200, 860, 400, 30); x.clip(); pic(x, im, -430, -200, 860, 400, 1, fx, fy); x.restore();
  x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 4; rrx(x, -430, -200, 860, 400, 30); x.stroke();
  pill(x, label, -300, 140, 36, false, kk(k, 0.4, 0.5), O);
  x.restore();
  x.save(); x.translate(X, Y); stamp(x, st, sp[0], sp[1], kst, { size: 60, rot: -0.1, fill: 'rgba(255,255,255,.92)' }); x.restore();
}
function cars(x, t) {
  x.fillStyle = PAPER; x.fillRect(0, 0, W, H); grid(x, 'rgba(0,0,0,.05)');
  kin(x, 'cars', t, { y: 330, size: 84, to: 4, red: ['lifestyle'] });
  x.save(); x.translate(jolt(t, K.lambo + 0.12, 8) + jolt(t, K.gwagon + 0.12, 8) + jolt(t, K.hours, 8), 0);
  carCard(x, IMG.brez_lambo_road, 700, kk(t, K.lambo - 0.12, 0.4), 0.55, 0.6, 'Lambo', 'CRASHED', kk(t, K.lambo + 0.12, 1), -0.02);
  carCard(x, IMG.brez_gwagon, 1150, kk(t, K.gwagon - 0.12, 0.4), 0.5, 0.42, 'G-Wagon', 'TOWED', kk(t, K.gwagon + 0.12, 1), 0.015, [10, 112]);   // over the dealer's plate
  carCard(x, IMG.brez_bmw, 1600, kk(t, K.bmw - 0.12, 0.4), 0.5, 0.55, 'BMW', '3 HOURS IN', kk(t, K.hours, 1), -0.015);
  x.restore();
  fine(x, 'Source: Whop blog (2025)', kk(t, K.lambo, 0.4), true);
}

// ---------- rentals ----------
function keyTag(x, X, Y, k, t) {                     // a rental key tag on its ring, swinging
  if (k <= 0) return; const sw = Math.sin((t - K.rentals) * 6) * Math.exp(-(t - K.rentals) * 1.6) * 0.5;
  x.save(); x.translate(X, Y - (1 - ease(k)) * 300); x.rotate(sw); x.globalAlpha *= clamp(k * 3);
  x.strokeStyle = '#D9D9DE'; x.lineWidth = 9; x.beginPath(); x.arc(0, 0, 34, 0, TAU); x.stroke();
  x.save(); x.translate(0, 34); x.rotate(-0.08);
  x.shadowColor = 'rgba(0,0,0,.3)'; x.shadowBlur = 30; x.shadowOffsetY = 12;
  x.beginPath(); x.moveTo(-60, 20); x.lineTo(60, 20); x.lineTo(110, 70); x.lineTo(110, 300); x.lineTo(-110, 300); x.lineTo(-110, 70); x.closePath();
  x.fillStyle = '#FFF4D6'; x.fill(); x.shadowBlur = 0; x.shadowOffsetY = 0;
  x.beginPath(); x.arc(0, 60, 14, 0, TAU); x.fillStyle = '#C9BFA6'; x.fill();
  setF(x, '800 52px Logo', 4); x.fillStyle = RED; x.textAlign = 'center'; x.fillText('RENTAL', 0, 175);
  setF(x, '500 26px Mono', 0); x.fillStyle = '#7A705C'; x.fillText('RETURN BY 10AM', 0, 232); x.restore();
  x.restore();
}
function rented(x, t) {
  gradientBg(x, t);
  kin(x, 'rented', t, { y: 640, size: 78, color: WHT, to: 11, red: ['marketing'], redc: '#1B1B1F', max: 880 });
  kin(x, 'rented', t, { y: 1020, size: 124, color: WHT, from: 11, red: ['rentals'], redc: '#1B1B1F', w: 800 });
  keyTag(x, 540, 1260, kk(t, K.rentals - 0.1, 0.45), t);
  pill(x, '“A rented Lambo… that’s ROI, not a flex.” Whop blog', 540, 1690, 28, true, kk(t, K.rentals + 0.4, 0.3), { ...O, w: 500, bg: 'rgba(20,20,24,.82)', fg: WHT });
  fine(x, 'Source: Whop blog (2025), the platform that sells his mentorship', kk(t, K.site, 0.4));
}

// ---------- where the money comes from: the ticker ----------
const TICK = ['$47', '$97', '$997', '$4,800', '$47', '$97', '$997', '$4,800', '$47', '$97'];
function money(x, t) {
  x.fillStyle = PAPER; x.fillRect(0, 0, W, H); grid(x, 'rgba(0,0,0,.05)');
  kin(x, 'money', t, { y: 360, size: 80, to: 7 });
  const kt = kk(t, K.reviewers - 0.15, 0.3);
  if (kt > 0) {
    const pos = Math.min(7, (t - K.reviewers + 0.15) * 3.6), i0 = Math.floor(pos), fr = pos - i0;
    x.save(); x.globalAlpha = kt; x.beginPath(); x.rect(0, 640, W, 620); x.clip();
    for (let j = -2; j <= 2; j++) {
      const i = i0 + j; if (i < 0 || i >= TICK.length) continue;
      const Y = 980 + (j - fr) * 230, d = Math.abs(j - fr);
      setF(x, '700 ' + Math.round(220 - 40 * Math.min(1, d)) + 'px Logo', -8); x.textAlign = 'left';
      x.fillStyle = d < 0.5 ? INKD : 'rgba(0,0,0,' + (0.22 - 0.08 * Math.min(2, d)) + ')'; x.fillText(TICK[i], 110, Y);
    }
    x.restore();
    setF(x, '600 30px Body', 3); x.fillStyle = '#6E6E73'; x.textAlign = 'left'; x.globalAlpha = kt; x.fillText('COURSES', 760, 960); x.globalAlpha = 1;
    x.strokeStyle = RED; x.lineWidth = 4; x.beginPath(); x.moveTo(920, 950); x.lineTo(970, 950); x.moveTo(952, 934); x.lineTo(970, 950); x.lineTo(952, 966); x.stroke();
  }
  kin(x, 'money', t, { y: 1480, size: 84, from: 7, red: ['courses', 'selling'] });
  fine(x, 'Reviewers’ estimate, not his accounts. Source: course reviews (2026)', kk(t, K.reviewers, 0.4), true);
}

// ---------- the receipt ----------
function prices(x, t) {
  x.fillStyle = '#E9E7E2'; x.fillRect(0, 0, W, H); grid(x, 'rgba(0,0,0,.06)');
  kin(x, 'prices', t, { y: 360, size: 76, red: ['$47', '$4,800'], max: 900 });
  const done = paperCard(x, 540, 1080, 780, 760, 0.03, kk(t, T0.prices - 0.05, 0.45));
  if (done) {
    setF(x, '700 66px Logo', -2); x.fillStyle = INKD; x.textAlign = 'left'; x.fillText('Receipt', -330, -260);
    setF(x, '500 28px Mono', 0); x.fillStyle = '#7A705C'; x.fillText('Sold to: his audience', -330, -205);
    x.strokeStyle = 'rgba(80,60,40,.35)'; x.setLineDash([6, 8]); x.lineWidth = 2;
    [[-120, 'Brand scaling bootcamp', '$47', K.p47], [40, 'Mentorship (invite only)', '~$4,800', K.p4800]].forEach(([Y, item, price, t0]) => {
      const k = kk(t, t0 - 0.1, 0.3); if (k <= 0) return;
      x.globalAlpha = clamp(k * 2); setF(x, '600 36px Body', 0); x.fillStyle = INKD; x.textAlign = 'left'; x.fillText(item, -330, Y);
      setF(x, '800 64px Logo', -2); x.fillStyle = RED; x.textAlign = 'right'; x.fillText(price, 330, Y + 70);
      x.beginPath(); x.moveTo(-330, Y + 105); x.lineTo(330, Y + 105); x.stroke(); x.globalAlpha = 1;
    });
    x.setLineDash([]);
    setF(x, '500 26px Mono', 0); x.fillStyle = '#7A705C'; x.textAlign = 'left'; x.globalAlpha = clamp(kk(t, K.p4800 + 0.3, 0.3));
    x.fillText('Prices as reported in reviews.', -330, 280); x.globalAlpha = 1;
    done();
  }
  fine(x, 'Source: course reviews (2026)', kk(t, K.p47, 0.4), true);
}

// ---------- the line that lands ----------
function sells(x, t) {
  x.fillStyle = CHAR; x.fillRect(0, 0, W, H);
  x.save(); x.globalAlpha = 0.22; x.filter = 'blur(6px) saturate(.6)'; zoomAt(x, 540, 960, 1.05 + 0.03 * kk(t, T0.sells, 3)); pic(x, IMG.brez_lambo, 0, 0, W, H, 1, 0.6, 0.55); x.restore();
  x.fillStyle = 'rgba(28,28,32,.55)'; x.fillRect(0, 0, W, H);
  kin(x, 'sells', t, { y: 900, size: 112, color: WHT, red: ['sells', 'them'], redc: '#FF5A4E', max: 880, w: 700 });
}

const S = {};
S.hook = hook; S.claim = claim; S.loop = loop; S.school = school; S.start = start; S.cars = cars;
S.rented = rented; S.money = money; S.prices = prices; S.sells = sells;

// ---------- the tension: the colour drains, a heartbeat, a clock ----------
let FRZ = null;
function frozen() { if (!FRZ) { const [c, x] = mkc(1080, 1920); sells(x, K.freeze); FRZ = c; } return FRZ; }
S.tense = (x, t) => {
  const tk = clamp((t - K.tense) / (T0.phone - K.tense)), hb = Math.max(...BEATS.map((q) => bump(t, q, 0.22)));
  x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
  x.save(); zoomAt(x, 540, 960, 1 + 0.02 * hb + 0.03 * tk); x.translate(jolt(t, T0.phone - 0.28, 12), 0);
  x.filter = 'saturate(' + (1 - 0.85 * tk) + ') brightness(' + (1 - 0.3 * tk) + ') contrast(' + (1 + 0.12 * tk) + ')';
  x.drawImage(frozen(), 0, 0); x.filter = 'none'; x.restore();
  vignette(x, 0.75 * tk);
};
function overlay(t) {                                // the clock under the tension
  if (t < T0.tense || t >= T0.phone) return;
  const kc = (t - K.tense - 0.1) / 0.25;
  if (kc > 0) {
    g.save(); g.globalAlpha = clamp(kc); setF(g, '600 64px Body', 0); const str = '0:' + String(Math.floor(t)).padStart(2, '0'), tw = g.measureText(str).width;
    rrx(g, 540 - tw / 2 - 86, 1262, tw + 140, 108, 54); g.fillStyle = 'rgba(0,0,0,.62)'; g.fill();
    g.fillStyle = (t * 2) % 1 < 0.6 ? '#FF3B30' : 'rgba(255,59,48,.35)'; g.beginPath(); g.arc(540 - tw / 2 - 40, 1316, 15, 0, TAU); g.fill();
    g.fillStyle = WHT; g.textAlign = 'left'; g.fillText(str, 540 - tw / 2 - 8, 1338); g.restore();
  }
}

// ---------- the switch: the reel you were watching, in a phone; then it is your ad ----------
const PHN = { cy: 610, s: 0.62 };
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
  setF(c, '500 26px Body', 0); c.fillStyle = 'rgba(255,255,255,.9)'; c.textAlign = 'left'; c.fillText('This is the reality of Brez Scales…', 30, 1090);
  if (ad > 0) {                                      // the call to action every ad gets
    c.save(); c.globalAlpha = ad; c.translate(0, 50 * (1 - ad)); rrx(c, 24, 1118, 552, 90, 18); c.fillStyle = 'rgba(255,255,255,.96)'; c.fill();
    setF(c, '700 34px Body', 0); c.fillStyle = INK; c.fillText('Shop now', 54, 1176); c.textAlign = 'right'; c.fillText('›', 548, 1177); c.restore();
  }
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(0, 1254, 600, 7); c.fillStyle = WHT; c.fillRect(0, 1254, 600 * 0.8, 7);
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
  setF(x, '600 130px Logo', -4); const fs = 130 * Math.min(1, 830 / Math.max(...lines.map(([str]) => x.measureText(str).width)));
  lines.forEach(([str, col, k], i) => {
    const Y = Y0 + i * fs * 1.2, kk2 = (t - K[k] + 0.04) / 0.38, f = '600 ' + fs + 'px Logo';
    if (!col && kk2 > 0) { setF(x, f, -fs * 0.03); const w = x.measureText(str).width + fs * 0.5; x.fillStyle = WHT; x.fillRect(540 - w / 2, Y - fs * 0.84, w * expo(kk2 / 0.6), fs * 1.1); }
    rise(x, str, 540, Y, f, col || INK, kk2, -fs * 0.03);
  });
}
S.pitch = (x, t) => {
  stage(x, true);
  x.save(); zoomAt(x, 540, 900, 1 + 0.03 * clamp((t - T0.pitch) / 4));
  const ka = ease((t - K.d1 + 0.18) / 0.2);
  if (ka < 1) { x.save(); x.globalAlpha = 1 - ka; x.translate(0, -120 * ka); pitchLines(x, t, PITCH[0], 860); x.restore(); }
  pitchLines(x, t, PITCH[1], 780);
  x.restore();
  pill(x, '@mezmedia_0', 540, 1300, 40, false, (t - K.handle) / 0.3, { f: 'Body', w: 600 });
};

// captions (only under the phone on the switch) are white type
const LIGHT = {};
