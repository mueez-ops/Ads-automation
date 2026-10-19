// Browser-side scene for reel_sarah3d.js. Runs as a module after three.js (imported as X) and the shared 2D kit.
// Globals from the kit: W, H, s (scene 2D layer), g (output), SC, T, boxT, rr, clamp, lerp, sstep, outExpo, outBack, slam, ...
const PAL = { yellow: '#FFD23F', pink: '#FF4D8D', cyan: '#3BCEAC', purple: '#7B5CFF', orange: '#FF8A3D', blue: '#3A7BFF', red: '#FF4B4B', green: '#2ED573' };

// ---------- renderer ----------
const glc = document.getElementById('gl');
const R = new X.WebGLRenderer({ canvas: glc, antialias: true, preserveDrawingBuffer: true });
R.setSize(W, H, false);
R.shadowMap.enabled = true; R.shadowMap.type = X.PCFSoftShadowMap;
R.toneMapping = X.ACESFilmicToneMapping; R.toneMappingExposure = 1.15; R.outputColorSpace = X.SRGBColorSpace;
const scene = new X.Scene();
const cam = new X.PerspectiveCamera(35, W / H, 0.02, 200);

const MAT = (c, o = {}) => new X.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.55, metalness: o.m ?? 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1 });
function add(parent, geo, mat, p = [0, 0, 0], r = [0, 0, 0], sc = [1, 1, 1]) {
  const m = new X.Mesh(geo, mat); m.position.set(...p); m.rotation.set(...r); m.scale.set(...sc);
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
// capsule between two points
function limb(parent, a, b, r, mat) {
  const A = new X.Vector3(...a), B = new X.Vector3(...b), d = B.clone().sub(A), len = d.length();
  const m = add(parent, new X.CapsuleGeometry(r, Math.max(0.001, len - 2 * r * 0.2), 6, 12), mat);
  m.position.copy(A.clone().add(B).multiplyScalar(0.5));
  m.quaternion.setFromUnitVectors(new X.Vector3(0, 1, 0), d.normalize()); return m;
}
function canvasTex(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new X.CanvasTexture(c); t.colorSpace = X.SRGBColorSpace; t.anisotropy = 8; return { c, x: c.getContext('2d'), t }; }

// ---------- people ----------
function person(o) {
  const grp = new X.Group(), ref = {};
  const skin = MAT(o.skin, { r: 0.6 }), top = MAT(o.top, { r: 0.7 }), bottom = MAT(o.bottom, { r: 0.8 }), shoe = MAT(o.shoe || '#f4f4f4', { r: 0.5 });
  for (const sd of [-1, 1]) {   // sitting legs
    limb(grp, [sd * 0.1, 0.5, -0.05], [sd * 0.11, 0.5, 0.3], 0.085, bottom);
    limb(grp, [sd * 0.11, 0.48, 0.3], [sd * 0.11, 0.1, 0.33], 0.075, bottom);
    add(grp, new X.BoxGeometry(0.13, 0.09, 0.26, 2, 2, 2), shoe, [sd * 0.11, 0.05, 0.38]);
  }
  add(grp, new X.CapsuleGeometry(0.2, 0.3, 8, 16), top, [0, 0.86, -0.04], [0.08, 0, 0], [1.12, 1, 0.78]);
  add(grp, new X.CylinderGeometry(0.06, 0.07, 0.12, 12), skin, [0, 1.13, -0.01]);
  const head = new X.Group(); head.position.set(0, 1.33, 0.02); grp.add(head); ref.head = head;
  add(head, new X.SphereGeometry(0.2, 32, 24), skin, [0, 0, 0], [0, 0, 0], [1, 1.08, 1]);
  const white = MAT('#ffffff', { r: 0.3 }), dark = MAT('#1b1b2f', { r: 0.2 });
  ref.pupils = [];
  for (const sd of [-1, 1]) {
    add(head, new X.SphereGeometry(0.048, 16, 12), white, [sd * 0.072, 0.03, 0.165]);
    ref.pupils.push(add(head, new X.SphereGeometry(0.028, 12, 10), dark, [sd * 0.072, 0.02, 0.205]));
    add(head, new X.BoxGeometry(0.075, 0.016, 0.02), MAT(o.hair), [sd * 0.075, 0.105, 0.18], [0, 0, -sd * 0.12]);
    add(head, new X.SphereGeometry(0.03, 10, 8), MAT('#ff8fa3', { r: 0.9 }), [sd * 0.12, -0.05, 0.15], [0, 0, 0], [1, 0.6, 0.4]);
  }
  add(head, new X.SphereGeometry(0.026, 12, 10), skin, [0, -0.02, 0.205]);
  ref.mouth = add(head, new X.TorusGeometry(0.042, 0.011, 8, 20, Math.PI), MAT('#7a2e2e'), [0, -0.085, 0.178], [0, 0, Math.PI]);
  const hair = MAT(o.hair, { r: 0.85 });
  if (o.curly) {
    for (let i = 0; i < 70; i++) {
      const th = R1(i * 3) * Math.PI * 2, ph = 0.15 + R1(i * 3 + 1) * 1.45;
      const v = new X.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th));
      if (v.z > 0.55 && v.y < 0.75) continue;          // keep the face clear
      add(head, new X.SphereGeometry(0.075 + R1(i * 3 + 2) * 0.03, 12, 10), hair, [v.x * 0.21, v.y * 0.22 + 0.02, v.z * 0.2 - 0.02]);
    }
    for (let i = 0; i < 18; i++) add(head, new X.SphereGeometry(0.08, 12, 10), hair, [(R1(i + 400) - 0.5) * 0.42, -0.12 - R1(i + 500) * 0.2, -0.12 - R1(i + 600) * 0.06]);
  } else add(head, new X.SphereGeometry(0.215, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), hair, [0, 0.02, -0.01], [-0.25, 0, 0]);
  // arms reaching to the phone
  const phoneAt = [0, 0.98, 0.33];
  for (const sd of [-1, 1]) {
    limb(grp, [sd * 0.24, 1.0, -0.03], [sd * 0.2, 0.84, 0.18], 0.06, top);
    limb(grp, [sd * 0.2, 0.84, 0.18], [sd * 0.088, 0.89, 0.39], 0.05, top);
  }
  const phone = new X.Group(); phone.position.set(...phoneAt); phone.rotation.x = -0.95; grp.add(phone); ref.phone = phone;
  // hands hold the bottom corners from behind, the thumb rests on the screen
  ref.hands = [-1, 1].map((sd) => add(phone, new X.SphereGeometry(0.048, 14, 10), skin, [sd * 0.088, -0.125, -0.03], [0, 0, 0], [1, 1.2, 0.8]));
  add(phone, new X.BoxGeometry(0.165, 0.33, 0.018), MAT('#15151c', { r: 0.3, m: 0.4 }));
  if (o.screen) {
    const scr = new X.Mesh(new X.PlaneGeometry(0.15, 0.31), new X.MeshBasicMaterial({ map: o.screen, toneMapped: false }));
    scr.position.z = 0.0101; phone.add(scr); ref.screen = scr;
  } else add(phone, new X.PlaneGeometry(0.15, 0.31), new X.MeshBasicMaterial({ color: o.glow || '#7fd3ff', toneMapped: false }), [0, 0, 0.0101]);
  ref.thumb = add(phone, new X.SphereGeometry(0.015, 10, 8), skin, [0.05, -0.12, 0.02], [0, 0, 0.5], [1, 1.6, 0.7]);
  head.rotation.x = 0.38;
  grp.userData = ref; return grp;
}
function R1(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

// ---------- phone screen (drawn in 2D, used as a texture) ----------
const SCR = canvasTex(540, 1116);
const FEEDCOL = [['#FFE3A3', '#FF8A3D'], ['#C9F2E7', '#2A9D8F'], ['#E3D9FF', '#7B5CFF'], ['#FFD6E0', '#FF4D8D'], ['#D7ECFF', '#3A7BFF'], ['#FFF1C1', '#E9B200']];
function prodShape(x, cx, cy, k, col) {
  x.save(); x.translate(cx, cy); x.fillStyle = col; x.strokeStyle = '#1b1b2f'; x.lineWidth = 6;
  if (k === 0) { x.beginPath(); x.roundRect(-120, -20, 240, 80, 40); x.fill(); x.stroke(); x.beginPath(); x.roundRect(-120, -70, 130, 90, 40); x.fill(); x.stroke(); x.fillStyle = '#fff'; x.fillRect(-120, 45, 240, 16); }   // trainer
  if (k === 1) { x.beginPath(); x.roundRect(-55, -120, 110, 230, 26); x.fill(); x.stroke(); x.fillStyle = '#1b1b2f'; x.fillRect(-30, -160, 60, 44); x.fillStyle = '#fff'; x.fillRect(-35, -40, 70, 60); } // bottle
  if (k === 2) { x.lineWidth = 22; x.strokeStyle = col; x.beginPath(); x.arc(0, 20, 85, 0, Math.PI * 2); x.stroke(); x.fillStyle = '#9ff3ff'; x.beginPath(); x.moveTo(0, -120); x.lineTo(40, -75); x.lineTo(0, -40); x.lineTo(-40, -75); x.closePath(); x.fill(); } // ring
  if (k === 3) { x.beginPath(); x.moveTo(-110, -110); x.lineTo(-40, -130); x.quadraticCurveTo(0, -95, 40, -130); x.lineTo(110, -110); x.lineTo(140, -20); x.lineTo(95, -5); x.lineTo(95, 120); x.lineTo(-95, 120); x.lineTo(-95, -5); x.lineTo(-140, -20); x.closePath(); x.fill(); x.stroke(); } // hoodie
  if (k === 4) { x.beginPath(); x.arc(0, 0, 110, 0, Math.PI * 2); x.fill(); x.stroke(); x.fillStyle = '#fff'; x.beginPath(); x.arc(0, 0, 30, 0, Math.PI * 2); x.fill(); } // headphones-ish
  if (k === 5) { x.beginPath(); x.roundRect(-80, -100, 160, 200, 30); x.fill(); x.stroke(); x.fillStyle = '#1b1b2f'; x.beginPath(); x.arc(0, -10, 40, 0, Math.PI * 2); x.fill(); } // candle jar
  x.restore();
}
function feedCard(x, y, i) {
  const [bgc, fg] = FEEDCOL[i % FEEDCOL.length], h = 900;
  x.save(); x.fillStyle = bgc; x.beginPath(); x.roundRect(24, y, 492, h, 28); x.fill(); x.clip();
  x.fillStyle = 'rgba(0,0,0,.12)'; x.beginPath(); x.arc(270, y + 430, 210, 0, 7); x.fill();
  prodShape(x, 270, y + 430, i % 6, fg);
  x.fillStyle = fg; x.beginPath(); x.arc(70, y + 50, 24, 0, 7); x.fill(); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(108, y + 36, 150, 14); x.fillRect(108, y + 58, 90, 10);
  x.fillStyle = '#1b1b2f'; x.beginPath(); x.roundRect(50, y + h - 110, 440, 76, 18); x.fill(); x.fillStyle = '#fff'; x.font = '700 32px Body'; x.textAlign = 'center'; x.fillText('Shop now', 270, y + h - 60);
  x.restore();
}
function logoCardS(x, y) {
  const h = 900; x.save(); x.fillStyle = '#2b2d42'; x.beginPath(); x.roundRect(24, y, 492, h, 28); x.fill();
  x.strokeStyle = '#fff'; x.lineWidth = 10; x.beginPath(); x.arc(270, y + 380, 90, 0, 7); x.stroke();
  x.fillStyle = '#fff'; x.font = '900 120px Hook'; x.textAlign = 'center'; x.fillText('B', 270, y + 422);
  x.font = '800 48px Hook'; x.letterSpacing = '10px'; x.fillText('BRAND', 276, y + 560); x.letterSpacing = '0px';
  x.fillStyle = 'rgba(255,255,255,.6)'; x.font = '500 22px Body'; x.textAlign = 'left'; x.fillText('Sponsored', 52, y + 52); x.restore();
}
function problemCardS(x, y, t) {
  const h = 900; x.save(); x.fillStyle = '#FFE1EA'; x.beginPath(); x.roundRect(24, y, 492, h, 28); x.fill(); x.clip();
  // cartoon heel with cracks
  x.translate(270, y + 520); x.fillStyle = '#e0a37f'; x.strokeStyle = '#1b1b2f'; x.lineWidth = 7;
  x.beginPath(); x.moveTo(-200, -60); x.quadraticCurveTo(-60, -110, 120, -70); x.quadraticCurveTo(210, -40, 200, 40); x.quadraticCurveTo(190, 120, 80, 120); x.lineTo(-200, 110); x.closePath(); x.fill(); x.stroke();
  x.strokeStyle = '#a0462c'; x.lineWidth = 5; [[140, -20, 110, 20, 130, 50], [170, 10, 150, 50, 165, 85], [110, 40, 90, 75, 100, 100]].forEach(([a, b, c, d, e, f]) => { x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); x.lineTo(e, f); x.stroke(); });
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.fillStyle = '#FF4D8D'; x.font = '900 70px Hook'; x.textAlign = 'center'; x.fillText('CRACKED', 270, y + 150); x.fillText('HEELS?', 270, y + 225);
  x.fillStyle = '#1b1b2f'; x.beginPath(); x.roundRect(50, y + h - 110, 440, 76, 18); x.fill(); x.fillStyle = '#fff'; x.font = '700 32px Body'; x.fillText('Fix them in 7 days', 270, y + h - 60);
  x.restore();
}
// mode: {pos (px scrolled), last: 'logo'|'problem'|null, tap}
function drawScreen(pos, last, tap, t) {
  const x = SCR.x; x.fillStyle = '#0f0f17'; x.fillRect(0, 0, 540, 1116);
  const pitch = 950, n = 8;
  for (let i = 0; i < n + 1; i++) {
    const y = 110 + i * pitch - pos; if (y < -pitch || y > 1116) continue;
    if (i === n && last === 'logo') logoCardS(x, y); else if (i === n && last === 'problem') problemCardS(x, y, t); else feedCard(x, y, i);
  }
  x.fillStyle = '#0f0f17'; x.fillRect(0, 0, 540, 90); x.fillStyle = '#fff'; x.font = '700 34px Body'; x.textAlign = 'left'; x.fillText('Instagram', 30, 62);
  if (tap > 0 && tap < 1) { x.strokeStyle = 'rgba(255,255,255,' + (1 - tap) + ')'; x.lineWidth = 10; x.beginPath(); x.arc(270, 975, 30 + tap * 220, 0, 7); x.stroke(); }
  SCR.t.needsUpdate = true;
}
const FEED_END = 110 + 8 * 950 - 110;   // scroll position where the last card is centred

// ---------- sets ----------
const sets = {};
// TRAIN
{
  const grp = new X.Group(); sets.train = grp; scene.add(grp);
  const WIN = canvasTex(1024, 512); sets.win = WIN;
  add(grp, new X.PlaneGeometry(16, 5), MAT('#8f9bb3', { r: 0.9 }), [0, 0, 1], [-Math.PI / 2, 0, 0]);
  add(grp, new X.PlaneGeometry(16, 0.12), MAT('#FFD23F', { r: 0.6 }), [0, 0.002, 0.75], [-Math.PI / 2, 0, 0]);
  add(grp, new X.PlaneGeometry(16, 2.6), MAT('#f1e7d0', { r: 0.9 }), [0, 1.3, -0.62]);
  add(grp, new X.PlaneGeometry(16, 5), MAT('#e8dcc4', { r: 0.9 }), [0, 2.45, 1], [Math.PI / 2, 0, 0]);
  const winMat = new X.MeshBasicMaterial({ map: WIN.t, toneMapped: false });
  for (let i = -3; i <= 3; i++) {
    const wx = i * 2.2;
    add(grp, new X.PlaneGeometry(1.7, 0.85), winMat, [wx, 1.62, -0.6]);
    add(grp, new X.BoxGeometry(1.84, 0.98, 0.04), MAT('#9aa3b5', { m: 0.6, r: 0.3 }), [wx, 1.62, -0.63]);
  }
  const teal = MAT('#1f9e8f', { r: 0.7 }), teal2 = MAT('#17867a', { r: 0.7 });
  add(grp, new X.BoxGeometry(16, 0.14, 0.62), teal, [0, 0.42, -0.25]);
  add(grp, new X.BoxGeometry(16, 0.62, 0.12), teal2, [0, 0.78, -0.53]);
  const yel = MAT('#F4C430', { r: 0.35, m: 0.3 });
  for (const px of [-1.15, 1.15, -3.3, 3.3]) add(grp, new X.CylinderGeometry(0.028, 0.028, 2.45, 16), yel, [px, 1.22, 0.45]);
  add(grp, new X.CylinderGeometry(0.022, 0.022, 16, 12), yel, [0, 2.1, 0.45], [0, 0, Math.PI / 2]);
  for (let i = -3; i <= 3; i++) add(grp, new X.BoxGeometry(1.4, 0.04, 0.18), new X.MeshBasicMaterial({ color: '#fff6d8' }), [i * 2.2, 2.42, 0.3]);
  for (let i = -6; i <= 6; i++) add(grp, new X.CylinderGeometry(0.01, 0.01, 0.35, 6), MAT('#888'), [i * 1.1, 2.27, 0.45]);
  // Sarah and two other commuters
  sets.sarah = person({ skin: '#c98a62', hair: '#3b2416', top: '#E8A33D', bottom: '#2f3e5c', curly: true, screen: SCR.t });
  sets.sarah.position.set(0, 0, -0.22); grp.add(sets.sarah);
  const p2 = person({ skin: '#f0c8a0', hair: '#c4622d', top: '#3A7BFF', bottom: '#333', glow: '#ffb3d1' }); p2.position.set(-1.9, 0, -0.22); p2.rotation.y = 0.15; grp.add(p2);
  const p3 = person({ skin: '#8d5a3b', hair: '#111', top: '#FF4D8D', bottom: '#4b3b2b', glow: '#b3ffe4' }); p3.position.set(1.85, 0, -0.22); p3.rotation.y = -0.12; grp.add(p3);
  sets.extras = [p2, p3];
}
// CONTROL ROOM with the eye
{
  const grp = new X.Group(); sets.room = grp; scene.add(grp); grp.position.set(0, 0, -40);
  add(grp, new X.PlaneGeometry(30, 30), MAT('#12163a', { r: 0.9 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  const grid = new X.GridHelper(30, 40, '#3BCEAC', '#2a3a7a'); grid.position.y = 0.005; grp.add(grid);
  add(grp, new X.PlaneGeometry(30, 12), MAT('#0d1030', { r: 0.9 }), [0, 6, -6]);
  const eye = new X.Group(); eye.position.set(0, 1.8, -2.5); grp.add(eye); sets.eye = eye;
  add(eye, new X.SphereGeometry(0.95, 48, 32), MAT('#ffffff', { r: 0.25, e: '#ffffff', ei: 0.08 }));
  const irisMat = MAT('#3A7BFF', { r: 0.3, e: '#3A7BFF', ei: 0.35 }); sets.irisMat = irisMat;
  const iris = new X.Group(); eye.add(iris); sets.iris = iris;
  add(iris, new X.CircleGeometry(0.42, 48), irisMat, [0, 0, 0.951]);
  add(iris, new X.CircleGeometry(0.2, 40), MAT('#05050a', { r: 0.2 }), [0, 0, 0.955]);
  add(iris, new X.CircleGeometry(0.07, 20), new X.MeshBasicMaterial({ color: '#ffffff' }), [0.12, 0.12, 0.96]);
  const lidMat = MAT('#7B5CFF', { r: 0.5 });
  sets.lidTop = add(eye, new X.SphereGeometry(0.99, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), lidMat);
  sets.lidBot = add(eye, new X.SphereGeometry(0.99, 48, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), lidMat);
  add(eye, new X.TorusGeometry(1.25, 0.04, 12, 80), new X.MeshBasicMaterial({ color: '#FF4D8D', toneMapped: false }), [0, 0, -0.2]);
  sets.monitors = [];
  for (let i = 0; i < 10; i++) {
    const ang = -1.2 + (i % 5) * 0.6, row = Math.floor(i / 5);
    const m = add(grp, new X.PlaneGeometry(1.2, 0.75), new X.MeshBasicMaterial({ color: i % 2 ? '#3BCEAC' : '#7B5CFF', toneMapped: false }),
      [Math.sin(ang) * 4.2, 1.1 + row * 1.7, -2.5 - Math.cos(ang) * 1.5 + 0.8], [0, -ang * 0.8, 0]);
    sets.monitors.push(m);
  }
}
// CROWD
{
  const grp = new X.Group(); sets.crowd = grp; scene.add(grp); grp.position.set(40, 0, 0);
  add(grp, new X.PlaneGeometry(30, 30), MAT('#ece6ff', { r: 0.95 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  const cols = ['#FF4D8D', '#3A7BFF', '#FFD23F', '#3BCEAC', '#FF8A3D', '#7B5CFF'];
  const skins = ['#f0c8a0', '#c98a62', '#8d5a3b', '#e0a37f', '#5c3a24'];
  sets.people = [];
  for (let i = 0; i < 30; i++) {
    const p = new X.Group(); const x = (i % 6 - 2.5) * 0.62, z = Math.floor(i / 6) * 0.62 - 1.2; p.position.set(x, 0, z);
    const bodyMat = MAT(cols[i % 6], { r: 0.6 }), headMat = MAT(skins[i % 5], { r: 0.6 });
    add(p, new X.CapsuleGeometry(0.15, 0.25, 6, 14), bodyMat, [0, 0.3, 0]);
    add(p, new X.SphereGeometry(0.14, 20, 14), headMat, [0, 0.72, 0]);
    for (const sd of [-1, 1]) add(p, new X.SphereGeometry(0.025, 8, 6), MAT('#1b1b2f'), [sd * 0.05, 0.74, 0.125]);
    p.userData = { bodyMat, headMat, base: new X.Color(cols[i % 6]) }; grp.add(p); sets.people.push(p);
  }
}
// FILING CABINET inside her head
{
  const grp = new X.Group(); sets.cab = grp; scene.add(grp); grp.position.set(-40, 0, 0);
  add(grp, new X.PlaneGeometry(30, 30), MAT('#ffb3c7', { r: 0.9 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  add(grp, new X.PlaneGeometry(30, 14), MAT('#ff8fb1', { r: 0.9 }), [0, 7, -3]);
  const metal = MAT('#FF8A3D', { r: 0.35, m: 0.35 });
  add(grp, new X.BoxGeometry(1.3, 2.1, 0.9), metal, [0, 1.05, -0.4]);
  sets.drawers = [];
  const lab = canvasTex(256, 96); lab.x.fillStyle = '#fff'; lab.x.fillRect(0, 0, 256, 96); lab.x.fillStyle = '#1b1b2f'; lab.x.font = '900 46px Hook'; lab.x.textAlign = 'center'; lab.x.fillText('IGNORED', 128, 64); lab.t.needsUpdate = true;
  for (let i = 0; i < 3; i++) {
    const d = new X.Group(); d.position.set(0, 1.7 - i * 0.62, 0.06); grp.add(d);
    add(d, new X.BoxGeometry(1.18, 0.54, 0.86), MAT('#ff9d5c', { r: 0.4, m: 0.3 }), [0, 0, -0.38]);
    add(d, new X.BoxGeometry(0.4, 0.06, 0.06), MAT('#eee', { m: 0.8, r: 0.2 }), [0, -0.08, 0.08]);
    if (i === 0) add(d, new X.PlaneGeometry(0.42, 0.16), new X.MeshBasicMaterial({ map: lab.t }), [0, 0.12, 0.052]);
    sets.drawers.push(d);
  }
  const AD = canvasTex(256, 384); logoCardMini(AD.x); AD.t.needsUpdate = true;
  sets.adCard = add(grp, new X.BoxGeometry(0.5, 0.75, 0.02), [MAT('#2b2d42'), MAT('#2b2d42'), MAT('#2b2d42'), MAT('#2b2d42'), new X.MeshBasicMaterial({ map: AD.t }), MAT('#2b2d42')]);
}
function logoCardMini(x) { x.fillStyle = '#2b2d42'; x.fillRect(0, 0, 256, 384); x.strokeStyle = '#fff'; x.lineWidth = 6; x.beginPath(); x.arc(128, 160, 52, 0, 7); x.stroke(); x.fillStyle = '#fff'; x.font = '900 70px Hook'; x.textAlign = 'center'; x.fillText('B', 128, 185); x.font = '800 30px Hook'; x.fillText('BRAND', 128, 270); }

// lights
scene.add(new X.HemisphereLight('#cfe3ff', '#6b4b3a', 1.15));
const sun = new X.DirectionalLight('#ffd2a1', 2.6); sun.position.set(-3, 5, 4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.5, far: 30 }); scene.add(sun); scene.add(sun.target);
const fill = new X.PointLight('#ff9ad1', 6, 8); scene.add(fill);

function drawWindow(t) {
  const x = sets.win.x, w = 1024, h = 512; const gr = x.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#ff9e6b'); gr.addColorStop(0.55, '#ff7eb3'); gr.addColorStop(1, '#7a5cff'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
  x.fillStyle = 'rgba(255,240,200,.9)'; x.beginPath(); x.arc(760, 170, 60, 0, 7); x.fill();
  for (let layer = 0; layer < 2; layer++) {
    const sp = layer ? 900 : 380, off = (t * sp) % 2048;
    for (let i = 0; i < 26; i++) {
      const bw = 70 + R1(i + layer * 50) * 90, bh = 120 + R1(i * 7 + layer) * (layer ? 300 : 200), bx = ((i * 85 - off) % 2210 + 2210) % 2210 - 120;
      x.fillStyle = layer ? '#3d2b6b' : '#6a4fa0'; x.fillRect(bx, h - bh, bw, bh);
      if (layer) { x.fillStyle = '#ffd86b'; for (let wy = h - bh + 20; wy < h - 10; wy += 34) for (let wx = bx + 12; wx < bx + bw - 14; wx += 26) if (R1(wx * 3 + wy) > 0.45) x.fillRect(wx, wy, 12, 16); }
    }
  }
  x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(0, 0, w, h * 0.3);
  sets.win.t.needsUpdate = true;
}

// ---------- shots: which set, camera, and the state of everything at time t ----------
const V = (a, b, c) => new X.Vector3(a, b, c);
function phoneCam(dist, offx = 0, offy = 0) {      // camera on the phone screen's normal, looking at it
  const ph = sets.sarah.userData.phone; ph.updateWorldMatrix(true, false);
  const c = V(0, 0, 0).applyMatrix4(ph.matrixWorld), n = V(0, 0, 1).transformDirection(ph.matrixWorld);
  const up = V(0, 1, 0).transformDirection(ph.matrixWorld);
  return { pos: c.clone().add(n.multiplyScalar(dist)).add(V(offx, offy, 0)), look: c, up };
}
function setVisible(name) { ['train', 'room', 'crowd', 'cab'].forEach((k) => sets[k].visible = k === name); }
function sarahFace(smile, browUp, look) {
  const u = sets.sarah.userData; u.mouth.scale.set(1 + smile * 0.6, 1 + smile * 0.8, 1);
  u.pupils.forEach((p) => { p.position.y = 0.02 - look * 0.02; });
  u.head.rotation.x = 0.38 - browUp * 0.15;
}
function feedPos(t) {
  // scroll position of the screen feed over the whole reel
  if (t < L.thumb1.s) return 150 + t * 40;
  if (t < L.appears.s) return 290 + (t - L.thumb1.s) * 2600;
  if (t < L.brain.s) { const u = t - L.appears.s; return FEED_END - 900 * Math.exp(-u * 6); }
  return FEED_END;
}
function feedPos2(t) {   // after the rewind, the feed lands on the problem ad
  const u = t - L.problem.s; return FEED_END - 2200 * Math.exp(-u * 5.5);
}
function lerpV(a, b, k) { return a.clone().lerp(b, k); }

function update3D(t) {
  drawWindow(t);
  const S = sets.sarah.userData; let up = V(0, 1, 0), pos, look, fov = 35;
  // thumb flicks while scrolling
  const scrolling = (t > L.thumb1.s && t < L.brain.s) || (t > L.slow.s && t < L.nobody.s) || (t > L.problem.s && t < Hh.stops);
  S.thumb.position.y = -0.125 + (scrolling ? Math.abs(Math.sin(t * 22)) * 0.06 : 0);
  sets.extras.forEach((p, i) => { p.userData.head.rotation.x = 0.38 + Math.sin(t * 1.3 + i) * 0.04; });
  sarahFace(0, 0, 1);
  const sec = (a, b) => t >= a && t < b;
  if (sec(0, L.thumb1.s) || sec(L.same.s, L.problem.s) || sec(L.final.s, 99)) {
    setVisible('train'); drawScreen(t < L.same.s ? feedPos(t) : 300, null, 0, t);
    const t0 = t < L.same.s ? 0 : t < L.final.s ? L.same.s : L.final.s, u = t - t0;
    if (t0 === 0) { pos = lerpV(V(-1.2, 1.25, 4.6), V(-0.2, 1.3, 2.3), sstep(u / 3.6)); look = V(0, 1.05, -0.2); }
    else if (t0 === L.same.s) { pos = lerpV(V(1.4, 1.4, 3.6), V(0.4, 1.3, 2.4), sstep(u / 1.6)); look = V(0, 1.05, -0.2); }
    else { const a = 0.5 + u * 0.12; pos = V(Math.sin(a) * 3.2, 1.5, Math.cos(a) * 3.2 - 0.2); look = V(0, 1.0, -0.2); }
  } else if (sec(L.thumb1.s, L.brain.s) || sec(L.logo.s, L.files.s) || sec(L.slow.s, L.nobody.s) || sec(L.problem.s, L.taps.s)) {
    setVisible('train');
    let last = null, sp = feedPos(t);
    if (t >= L.logo.s && t < L.files.s) { last = 'logo'; sp = FEED_END; }
    if (t >= L.appears.s && t < L.brain.s) last = 'logo';
    if (t >= L.slow.s && t < L.nobody.s) { last = null; sp = FEED_END + (t - L.slow.s) * 3400; }
    if (t >= L.problem.s) { last = 'problem'; sp = t < L.stops.s ? feedPos2(t) : FEED_END; }
    drawScreen(sp % (950 * 8 + 1) , last, 0, t);
    const close = t >= L.logo.s && t < L.files.s ? 0.36 : t >= L.heels.s ? 0.4 : 0.5;
    const pc = phoneCam(close - (t >= L.stops.s ? 0.04 * outExpo((t - Hh.stops) / 0.3) : 0), 0.02, 0.0);
    pos = pc.pos; look = pc.look; up = pc.up;
  } else if (sec(L.brain.s, L.logo.s) || sec(L.taps.s, L.notices.s)) {
    setVisible('train'); const happy = t >= L.taps.s;
    drawScreen(happy ? FEED_END : FEED_END, happy ? 'problem' : 'logo', happy ? clamp((t - Hh.taps) / 0.5) : 0, t);
    if (happy) sarahFace(outBack((t - L.taps.s) / 0.4), 1, 1);
    const u = t - (happy ? L.taps.s : L.brain.s);
    pos = V(0.35 - u * 0.04, 1.36, 1.15 - u * 0.08); look = V(0, 1.27, 0); fov = 30;
  } else if (sec(L.files.s, L.slow.s)) {
    setVisible('cab'); const u = t - L.files.s, D = L.slow.s - L.files.s;
    const open = sstep(u / 0.5) * (1 - sstep((u - (D - 0.35)) / 0.3));
    sets.drawers[0].position.z = 0.06 + open * 0.7;
    const fly = sstep((u - 0.6) / (D - 1.0));
    const a = sets.adCard; a.position.set(lerp(1.0, 0, fly), lerp(2.2, 1.85, fly) + Math.sin(fly * Math.PI) * 0.5, lerp(1.4, 0.45, fly));
    a.rotation.set(-fly * 1.4, (1 - fly) * 0.6 + u * 0.4, (1 - fly) * 0.3); a.scale.setScalar(1 - fly * 0.35);
    a.visible = fly < 0.98;
    pos = V(-40 + 1.5 - u * 0.15, 1.9, 4.6 - u * 0.3); look = V(-40, 1.3, 0);
  } else if (sec(L.nobody.s, L.skip.s) || sec(L.dislike.s, L.rewind.s) || sec(L.notices.s, L.more.s)) {
    setVisible('room'); const u = t - (t < L.skip.s ? L.nobody.s : t < L.rewind.s ? L.dislike.s : L.notices.s);
    let open = 1, tint = '#3A7BFF';
    if (t < L.skip.s) open = outExpo((t - L.watching.s + 0.15) / 0.5);
    if (t >= L.dislike.s && t < L.rewind.s) { open = lerp(1, 0.45, sstep(u / 0.8)); tint = '#FF4B4B'; }
    if (t >= L.notices.s) tint = '#2ED573';
    sets.lidTop.rotation.x = lerp(0.12, -0.95, open); sets.lidBot.rotation.x = lerp(-0.12, 0.95, open);
    sets.irisMat.color.set(tint); sets.irisMat.emissive.set(tint);
    sets.iris.rotation.y = Math.sin(t * 1.7) * 0.25; sets.iris.rotation.x = Math.sin(t * 1.1) * 0.12;
    sets.monitors.forEach((m, i) => m.material.color.set(R1(i + Math.floor(t * 4)) > 0.5 ? '#3BCEAC' : '#7B5CFF'));
    const far = t < L.skip.s ? lerp(7, 3.6, sstep(u / 2.5)) : 3.4 - u * 0.1;
    pos = V(Math.sin(u * 0.3) * 0.5, 1.9, -40 + far); look = V(0, 1.75, -42.5);
  } else if (sec(L.skip.s, L.dislike.s) || sec(L.more.s, L.final.s)) {
    setVisible('crowd'); const more = t >= L.more.s, u = t - (more ? L.more.s : L.skip.s);
    const marks = [Hh.skip1, Hh.next1, Hh.next2]; let n = marks.filter((m) => t >= m).length;
    if (!more && t > Hh.next2) n = 3 + Math.floor(27 * clamp((t - Hh.next2) / (L.dislike.s - Hh.next2)) ** 2);
    const lit = more ? Math.floor(30 * clamp(u / 1.6)) : 0;
    sets.people.forEach((p, i) => {
      const order = (i * 7) % 30, sk = !more && order < n, on = more && order < lit;
      const grey = new X.Color('#8a8a99');
      p.userData.bodyMat.color.copy(sk ? grey : p.userData.base); p.userData.bodyMat.emissive.set(on ? p.userData.base : '#000000'); p.userData.bodyMat.emissiveIntensity = on ? 0.6 : 1;
      p.rotation.y = sk ? Math.PI * outExpo(clamp((t - (marks[order] ?? (Hh.next2 + 0.05 * order))) / 0.3)) : 0;
      p.position.y = on ? Math.abs(Math.sin((t - order * 0.05) * 9)) * 0.12 : 0;
    });
    pos = V(40 + Math.sin(u * 0.4) * 0.5, 6.2 - u * 0.15, 5.6 - u * 0.15); look = V(40, 0.1, -0.4); fov = 36;
  } else {  // rewind handled by the caller
    setVisible('train'); pos = V(0, 1.3, 2.4); look = V(0, 1.05, -0.2);
  }
  fill.position.set(pos.x * 0.5, 2.2, pos.z * 0.5);
  sun.position.set(pos.x - 3, 5, pos.z + 4); sun.target.position.copy(look);
  cam.position.copy(pos); cam.up.copy(up); cam.fov = fov; cam.updateProjectionMatrix(); cam.lookAt(look);
  R.render(scene, cam);
}

// ---------- 2D overlays ----------
const SKIP_MARKS = () => [Hh.skip1, Hh.next1, Hh.next2];
function sticker(str, x, y, size, bgc, fg, rot, k) {
  if (k <= 0) return; s.save(); s.translate(x, y); s.rotate(rot); const sc = 1.5 - 0.5 * outBack(k / 0.22); s.scale(sc, sc); s.globalAlpha = clamp(k * 6);
  s.font = '900 ' + size + 'px Hook'; s.letterSpacing = (-size * 0.02) + 'px'; const w = s.measureText(str).width + size * 0.5, h = size * 1.15;
  s.fillStyle = '#1b1b2f'; rr(-w / 2 + 8, -h / 2 + 10, w, h, 18); s.fill();
  s.fillStyle = bgc; rr(-w / 2, -h / 2, w, h, 18); s.fill(); s.fillStyle = fg; s.textAlign = 'center'; s.fillText(str, 0, size * 0.36); s.restore();
}
function outlineText(str, x, y, size, col, k) {
  if (k <= 0) return; s.save(); s.translate(x, y); const sc = 1.4 - 0.4 * outBack(k / 0.22); s.scale(sc, sc);
  s.font = '900 ' + size + 'px Hook'; s.letterSpacing = (-size * 0.03) + 'px'; s.textAlign = 'center'; s.lineJoin = 'round';
  s.lineWidth = size * 0.16; s.strokeStyle = '#1b1b2f'; s.strokeText(str, 0, 0); s.fillStyle = col; s.fillText(str, 0, 0); s.restore();
}
function bubble(str, t0, t) {
  const u = t - t0; if (u < 0) return; const k = outBack(u / 0.3), n = Math.ceil(clamp(u / 0.45) * str.length);
  s.save(); s.translate(W / 2 + 60, 470); s.scale(k, k); s.fillStyle = '#fff'; s.strokeStyle = '#1b1b2f'; s.lineWidth = 8;
  rr(-380, -120, 760, 230, 115); s.fill(); s.stroke(); s.beginPath(); s.arc(-210, 170, 28, 0, 7); s.fill(); s.stroke(); s.beginPath(); s.arc(-250, 230, 15, 0, 7); s.fill(); s.stroke();
  s.fillStyle = '#1b1b2f'; s.font = 'italic 104px Serif'; s.textAlign = 'center'; s.fillText(str.slice(0, n), 0, 30); s.restore();
}
function watch(x, y, r, v, label, col) {
  s.save(); s.translate(x, y); s.fillStyle = '#1b1b2f'; s.beginPath(); s.arc(6, 8, r + 10, 0, 7); s.fill();
  s.fillStyle = '#fff'; s.beginPath(); s.arc(0, 0, r + 10, 0, 7); s.fill(); s.fillStyle = col; s.beginPath(); s.moveTo(0, 0); s.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + v * Math.PI * 2); s.fill();
  s.strokeStyle = '#1b1b2f'; s.lineWidth = 6; s.beginPath(); s.arc(0, 0, r, 0, 7); s.stroke(); s.fillStyle = '#1b1b2f'; s.fillRect(-12, -r - 34, 24, 20);
  if (label) { s.font = '900 ' + Math.round(r * 0.5) + 'px Hook'; s.textAlign = 'center'; s.lineWidth = 8; s.strokeStyle = '#1b1b2f'; s.strokeText(label, 0, r + r * 0.75); s.fillStyle = '#fff'; s.fillText(label, 0, r + r * 0.75); }
  s.restore();
}
function meter(x, y, w, label, v, col, arrow) {
  s.save(); s.fillStyle = '#1b1b2f'; rr(x + 6, y + 8, w, 64, 32); s.fill(); s.fillStyle = '#fff'; rr(x, y, w, 64, 32); s.fill();
  s.fillStyle = col; rr(x + 6, y + 6, Math.max(52, (w - 12) * clamp(v)), 52, 26); s.fill();
  s.fillStyle = '#1b1b2f'; s.font = '900 34px Hook'; s.fillText(label, x + 24, y + 44);
  s.font = '900 70px Hook'; s.lineWidth = 10; s.strokeStyle = '#1b1b2f'; s.strokeText(arrow, x + w + 20, y + 56); s.fillStyle = col; s.fillText(arrow, x + w + 20, y + 56); s.restore();
}
const PARTS = Array.from({ length: 90 }, (_, i) => ({ x: R1(i + 900) * W, y: R1(i + 950) * H, v: 200 + R1(i + 990) * 500, c: Object.values(PAL)[i % 8], r: 6 + R1(i + 1100) * 10, rot: R1(i + 1200) * 6 }));
function confetti(t, t0, alpha = 1) {
  const u = t - t0; if (u < 0) return; s.save(); s.globalAlpha = alpha;
  PARTS.forEach((p) => { const y = (p.y + u * p.v) % (H + 100) - 50, x = p.x + Math.sin(u * 3 + p.rot) * 40; s.save(); s.translate(x, y); s.rotate(p.rot + u * 4); s.fillStyle = p.c; s.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r); s.restore(); });
  s.restore();
}
function sparkle(x, y, u, n = 14, col = '#fff') {
  if (u < 0 || u > 0.7) return; s.save(); s.globalAlpha = 1 - u / 0.7; s.strokeStyle = col; s.lineWidth = 6; s.lineCap = 'round';
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, d = 60 + u * 420; s.beginPath(); s.moveTo(x + Math.cos(a) * d, y + Math.sin(a) * d); s.lineTo(x + Math.cos(a) * (d + 40), y + Math.sin(a) * (d + 40)); s.stroke(); }
  s.restore();
}
function speedLines(alpha) {
  s.save(); s.globalAlpha = alpha; s.strokeStyle = '#fff'; s.lineWidth = 4;
  for (let i = 0; i < 40; i++) { const a = R1(i + 3000) * Math.PI * 2, r0 = 420 + R1(i + 3100) * 300; s.beginPath(); s.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0); s.lineTo(W / 2 + Math.cos(a) * (r0 + 500), H / 2 + Math.sin(a) * (r0 + 500)); s.stroke(); }
  s.restore();
}

function overlays(t) {
  const sec = (a, b) => t >= a && t < b;
  if (t < 2.1) {   // the hook, on screen from frame 1
    const k = clamp(1 - (t - 1.75) / 0.35); s.save(); s.globalAlpha = k;
    outlineText("THIS IS YOUR AD'S", W / 2, 470, 92, '#fff', t + 0.2); sticker('FIRST SECOND', W / 2, 610, 120, PAL.yellow, '#1b1b2f', -0.04, t);
    watch(W / 2, 280, 52, t % 1, null, PAL.pink); s.restore();
  }
  if (sec(0.5, L.thumb1.s)) sticker('SARAH · 7:42 AM', W / 2, 1180, 46, PAL.cyan, '#1b1b2f', 0.03, t - 0.5);
  if (sec(L.thumb1.s, L.appears.s)) speedLines(0.35);
  if (sec(L.appears.s, L.brain.s)) sticker('YOUR AD', W / 2, 300, 90, PAL.pink, '#fff', -0.05, t - L.appears.s - 0.35);
  if (sec(L.brain.s, L.logo.s)) { bubble('Is this for me?', L.forme.s, t); const v = clamp((t - L.brain.s) / (L.logo.s - L.brain.s)); watch(W - 170, 1080, 74, v * 0.4, (v * 0.4).toFixed(2) + 's', PAL.yellow); }
  if (sec(L.logo.s, L.files.s)) { sticker('OPENS ON YOUR LOGO', W / 2, 280, 72, PAL.orange, '#1b1b2f', -0.03, t - L.logo.s); sparkle(W / 2, 900, t - Hh.logo, 16, PAL.yellow); }
  if (sec(L.files.s, L.slow.s)) { outlineText('INSIDE HER HEAD', W / 2, 330, 64, '#fff', t - L.files.s); sticker('ADVERT', W / 2 - 40, 700, 150, PAL.red, '#fff', -0.18, t - Hh.files); }
  if (sec(L.slow.s, L.nobody.s)) { speedLines(0.4); if (t >= Hh.gone) { s.save(); s.fillStyle = 'rgba(27,27,47,' + 0.55 * clamp((t - Hh.gone) / 0.1) + ')'; s.fillRect(0, 0, W, H); s.restore(); outlineText('GONE.', W / 2, 1040, 300, PAL.yellow, t - Hh.gone); } }
  if (sec(L.nobody.s, L.skip.s)) {
    const str = 'THE PART NOBODY TELLS YOU', n = Math.ceil(clamp((t - L.nobody.s) / 0.9) * str.length);
    s.save(); s.font = '500 40px Mono'; s.letterSpacing = '5px'; s.fillStyle = '#fff'; s.textAlign = 'center'; s.fillText(str.slice(0, n), W / 2, 330); s.restore();
    sticker('META WAS WATCHING', W / 2, 1200, 76, PAL.purple, '#fff', 0.03, t - L.watching.s);
  }
  if (sec(L.skip.s, L.dislike.s)) {
    let n = SKIP_MARKS().filter((m) => t >= m).length; if (t > Hh.next2) n = 3 + Math.floor(27 * clamp((t - Hh.next2) / (L.dislike.s - Hh.next2)) ** 2);
    sticker('SKIPPED: ' + n, W / 2, 330, 80, PAL.red, '#fff', -0.03, t - L.skip.s + 0.3);
    SKIP_MARKS().forEach((m, i) => { if (t >= m && t < m + 0.6) outlineText('SKIP!', 300 + i * 240, 560, 70, PAL.yellow, t - m); });
  }
  if (sec(L.dislike.s, L.rewind.s)) {
    const u = clamp((t - L.dislike.s - 0.2) / 1.2);
    sticker("PEOPLE DON'T LIKE THIS AD", W / 2, 300, 62, PAL.red, '#fff', -0.02, t - L.dislike.s);
    meter(170, 1000, 640, 'COST', lerp(0.3, 0.95, sstep(u)), PAL.red, '↑'); meter(170, 1110, 640, 'REACH', lerp(0.85, 0.15, sstep(u)), PAL.blue, '↓');
  }
  if (sec(L.same.s, L.problem.s)) { const half = L.same.s + (L.same.e - L.same.s) * 0.48; sticker('SAME TRAIN.', W / 2, 420, 110, PAL.yellow, '#1b1b2f', -0.04, t - L.same.s); sticker('SAME SARAH.', W / 2, 580, 110, PAL.cyan, '#1b1b2f', 0.04, t - half); }
  if (sec(L.heels.s, L.stops.s)) watch(W - 170, 330, 74, clamp(t - Hh.second1), 'SECOND 1', PAL.green);
  if (sec(L.stops.s, L.taps.s)) { sticker('STOPPED!', W / 2, 1150, 130, PAL.green, '#1b1b2f', -0.08, t - Hh.stops); sparkle(W / 2, 900, t - Hh.stops, 18, PAL.yellow); }
  if (sec(L.taps.s, L.notices.s)) { sticker('TAP!', W / 2 + 230, 1100, 100, PAL.pink, '#fff', 0.1, t - Hh.taps); sparkle(W / 2 + 230, 1100, t - Hh.taps, 12, PAL.pink); }
  if (sec(L.notices.s, L.more.s)) { sticker('META NOTICES', W / 2, 1200, 80, PAL.green, '#1b1b2f', -0.03, t - L.notices.s); sparkle(W / 2, 760, t - L.notices.s, 16, PAL.green); }
  if (sec(L.more.s, L.final.s)) {
    confetti(t, L.more.s + 0.4, 0.9); const u = clamp((t - L.more.s) / 1.6);
    meter(170, 1000 - 140, 640, 'REACH', lerp(0.2, 0.95, sstep(u)), PAL.green, '↑'); sticker('FOR LESS', W / 2, 1120, 100, PAL.yellow, '#1b1b2f', -0.06, t - Hh.less);
  }
  if (sec(L.final.s, C.voice_end + 0.1)) {
    s.save(); s.fillStyle = 'rgba(27,27,47,.55)'; s.fillRect(0, 0, W, H); s.restore();
    sticker('SAME PRODUCT.', W / 2, 560, 100, PAL.cyan, '#1b1b2f', -0.03, t - Hh.product);
    sticker('SAME BUDGET.', W / 2, 720, 100, PAL.purple, '#fff', 0.03, t - Hh.budget);
    sticker('DIFFERENT', W / 2, 920, 140, PAL.yellow, '#1b1b2f', -0.04, t - Hh.different);
    sticker('FIRST SECOND.', W / 2, 1100, 140, PAL.pink, '#fff', 0.03, t - Hh.different - 0.25);
  }
}
function endCard(t) {
  const u = t - C.voice_end - 0.1; s.fillStyle = '#0d0d16'; s.fillRect(0, 0, W, H); confetti(t, C.voice_end, 0.5);
  s.save(); s.globalAlpha = outExpo(u / 0.4); s.font = '800 230px Logo'; s.letterSpacing = '-12px'; s.textAlign = 'center'; s.fillStyle = '#fff'; s.fillText('mez.', W / 2, 640);
  s.font = '600 52px Logo'; s.letterSpacing = '22px'; s.fillText('MEDIA', W / 2 + 11, 730); s.restore();
  sticker('DM “TEARDOWN”', W / 2, 980, 110, PAL.yellow, '#1b1b2f', -0.03, u - 0.3);
  s.save(); s.globalAlpha = outExpo((u - 0.7) / 0.4); s.font = '700 48px Body'; s.textAlign = 'center'; s.fillStyle = '#fff'; s.fillText('for a free review of your ads', W / 2, 1120);
  s.font = '500 40px Mono'; s.fillStyle = PAL.cyan; s.fillText('@mezmedia_0', W / 2, 1210); s.restore();
}

// ---------- frame ----------
const CUTS = [L.thumb1.s, L.brain.s, L.logo.s, L.files.s, L.slow.s, L.nobody.s, L.skip.s, L.dislike.s, L.same.s, L.problem.s, L.stops.s, L.taps.s, L.notices.s, L.more.s, L.final.s, C.voice_end + 0.1];
const HITS = EV.filter((e) => ['slam', 'hit', 'stop', 'stamp', 'boom'].includes(e.k)).map((e) => e.t);
function decay(list, t, len) { let v = 0; list.forEach((e) => { const u = t - e; if (u >= 0 && u < len) v = Math.max(v, 1 - u / len); }); return v; }
const BLOOM = document.createElement('canvas'); BLOOM.width = 270; BLOOM.height = 480; const bctx = BLOOM.getContext('2d');

window.setTime = (t) => {
  s.setTransform(1, 0, 0, 1, 0, 0);
  if (t >= C.voice_end + 0.1) endCard(t);
  else {
    let tt = t;
    if (t >= L.rewind.s && t < L.same.s) tt = Math.max(0.05, L.rewind.s - (t - L.rewind.s) * 16);   // rewind: replay backwards
    update3D(tt);
    s.drawImage(glc, 0, 0);
    if (t >= L.rewind.s && t < L.same.s) {
      s.save(); s.globalAlpha = 0.3; for (let y = 0; y < H; y += 6) { s.fillStyle = 'rgba(0,0,0,.6)'; s.fillRect(0, y, W, 2); } s.restore();
      s.save(); s.fillStyle = 'rgba(255,255,255,.7)'; s.fillRect(0, (t * 3000) % H, W, 26); s.restore();
      sticker('◀◀ REWIND', W / 2, 330, 90, PAL.blue, '#fff', -0.03, t - L.rewind.s);
    } else overlays(t);
  }
  // camera punch + shake on hits, whip smear on cuts
  let z = 1; HITS.forEach((e) => { const u = t - e; if (u >= 0 && u < 0.5) z += 0.045 * Math.exp(-u / 0.08); });
  let sx = 0, sy = 0; HITS.forEach((e) => { const u = t - e; if (u >= 0 && u < 0.45) { const m = Math.exp(-u * 9) * 16; sx += Math.sin(u * 93 + e) * m; sy += Math.cos(u * 71 + e) * m; } });
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.translate(W / 2 + sx, H / 2 + sy); g.scale(z, z); g.translate(-W / 2, -H / 2); g.drawImage(SC, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0);
  const whip = decay(CUTS, t, 0.14);
  if (whip > 0) { g.save(); g.globalAlpha = 0.22 * whip; for (let i = 1; i <= 4; i++) g.drawImage(out, 0, -i * 40 * whip); g.restore(); }
  // bloom: blurred bright copy screened on top
  bctx.filter = 'brightness(1.4) contrast(1.6) blur(6px)'; bctx.drawImage(out, 0, 0, 270, 480); bctx.filter = 'none';
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.22; g.drawImage(BLOOM, 0, 0, W, H); g.restore();
  // drifting light leaks
  g.save(); g.globalCompositeOperation = 'screen';
  [[PAL.orange, 0.7, 0.2], [PAL.pink, 0.2, 0.8]].forEach(([c, fx, fy], i) => { const x = W * fx + Math.sin(t * 0.6 + i) * 200, y = H * fy + Math.cos(t * 0.5 + i) * 200; const q = g.createRadialGradient(x, y, 0, x, y, 700); q.addColorStop(0, c + '30'); q.addColorStop(1, c + '00'); g.fillStyle = q; g.fillRect(0, 0, W, H); });
  g.restore();
  const fl = decay(CUTS.concat(HITS), t, 0.1); if (fl > 0) { g.fillStyle = 'rgba(255,255,255,' + (0.45 * fl * fl) + ')'; g.fillRect(0, 0, W, H); }
  captions(t);
  g.save(); g.globalAlpha = 0.05; g.globalCompositeOperation = 'overlay'; g.drawImage(NOISE[Math.floor(t * 30) % 6], 0, 0, W, H); g.restore();
  vignette(g, 0.28);
};

// captions: the script line, word by word, the newest word in yellow
function captions(t) {
  const k = Object.keys(L).find((key) => t >= L[key].s && t < L[key].e + 0.15); if (!k || t > C.voice_end + 0.1) return;
  const ln = L[k], words = ln.t.split(' '), n = Math.max(1, Math.ceil(clamp((t - ln.s) / Math.max(0.3, (ln.e - ln.s) * 0.85)) * words.length));
  g.save(); g.font = '900 50px Hook'; g.letterSpacing = '0px'; g.lineJoin = 'round';
  const lines = [[]]; words.forEach((w) => { const cur = lines[lines.length - 1]; if (g.measureText([...cur, w].join(' ')).width > 860 && cur.length) lines.push([w]); else cur.push(w); });
  let idx = 0; const y0 = 1400 - (lines.length - 1) * 62;
  lines.forEach((lw, i) => {
    const full = lw.join(' '), fw = g.measureText(full).width; let x = W / 2 - fw / 2; const y = y0 + i * 62;
    lw.forEach((w) => { const shown = idx < n, newest = idx === n - 1; g.lineWidth = 12; g.strokeStyle = '#1b1b2f'; g.globalAlpha = shown ? 1 : 0.0;
      g.strokeText(w, x, y); g.fillStyle = newest ? PAL.yellow : '#fff'; g.fillText(w, x, y); x += g.measureText(w + ' ').width; idx++; });
  });
  g.restore();
}
