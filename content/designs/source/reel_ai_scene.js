// Browser-side scene for reel_ai.js. Runs as a module after three.js (imported as X), the 2D kit and the phone engine
// (reel_phone_kit.js), whose globals it uses: W, H, g, IMG, NOISE, clamp, lerp, kf, ease, expo, eio, back, bump, jolt,
// mkc, rrx, setF, pill, phone, P, stage, rise, zoomAt, vignette, mixc, INK, WHT, GREY... It fills S and replaces the
// kit's captions with the Face ID reel's: at the top, building word by word.
// One world, one camera. Outside: the phone at the origin (screen to +z) on a dark map, a fiber line from the phone
// to a data center 100 units away, a pulse of light along it. Inside (the hall, 400 units further on): rows of
// racks with blinking lights around a GPU server; above it the model drawn as a stack, bottom to top: the tokens
// (3 to a row, like text), each token's list of numbers running back from it, ten layer plates with the attention
// arcs, and the panel of next-token scores at the top; picked tokens drop back into the rows below.

const BLUE = '#2F80FF', RED = '#FF3B30', GREEN = '#34C759';
const TOKC = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#7C3AED', '#F97316', '#0EA5E9', '#22C55E', '#E11D48', '#6366F1', '#14B8A6', '#EAB308', '#A855F7'];
const v3 = (a) => new X.Vector3(...a);
const win = (t, a, b, fi = 0.25, fo = 0.25) => clamp((t - a) / Math.max(fi, 1e-4)) * (1 - clamp((t - b) / Math.max(fo, 1e-4)));
const kk = (t, t0, d = 0.3) => clamp((t - t0) / d);
const tex = (c) => { const t = new X.CanvasTexture(c); t.colorSpace = X.SRGBColorSpace; t.anisotropy = 8; return t; };

// ---------- renderer ----------
const glc = document.getElementById('gl');
const R3 = new X.WebGLRenderer({ canvas: glc, antialias: true, alpha: true, preserveDrawingBuffer: true });
R3.setSize(W, H, false); R3.setClearColor(0x000000, 0);
R3.toneMapping = X.ACESFilmicToneMapping; R3.toneMappingExposure = 1.05; R3.outputColorSpace = X.SRGBColorSpace;
const scene = new X.Scene();
scene.fog = new X.Fog(0x05070c, 45, 170);
const cam = new X.PerspectiveCamera(40, W / H, 0.05, 700);
const hemi = new X.HemisphereLight('#D6E2FF', '#15171D', 0.8); scene.add(hemi);
const key = new X.DirectionalLight('#FFFFFF', 1.7); key.position.set(5, 9, 7); scene.add(key);
const rim = new X.DirectionalLight('#8FB4FF', 1.5); rim.position.set(-6, 5, -8); scene.add(rim);
const MAT = (c, o = {}) => new X.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.5, metalness: o.m ?? 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1 });
const glowTex = (() => { const [c, x] = mkc(128, 128); const q = x.createRadialGradient(64, 64, 0, 64, 64, 64); q.addColorStop(0, 'rgba(255,255,255,1)'); q.addColorStop(0.25, 'rgba(160,200,255,.8)'); q.addColorStop(1, 'rgba(60,120,255,0)'); x.fillStyle = q; x.fillRect(0, 0, 128, 128); return tex(c); })();
const glowMat = (c, op = 1) => new X.SpriteMaterial({ map: glowTex, color: c, transparent: true, opacity: op, blending: X.AdditiveBlending, depthWrite: false });
function textCanvas(str, o = {}) {                   // a word as a texture: white type on transparent
  const size = o.size || 120; const [c0, x0] = mkc(10, 10); setF(x0, (o.w || 700) + ' ' + size + 'px ' + (o.f || 'Logo'), 0);
  const w = Math.ceil(x0.measureText(str).width + size * 0.4), h = Math.ceil(size * 1.4); const [c, x] = mkc(w, h);
  setF(x, (o.w || 700) + ' ' + size + 'px ' + (o.f || 'Logo'), 0); x.fillStyle = o.col || '#FFFFFF'; x.textBaseline = 'middle'; x.textAlign = 'center';
  if (o.glow) { x.shadowColor = o.glow; x.shadowBlur = size * 0.3; }
  x.fillText(str, w / 2, h / 2); return c;
}

// ---------- the phone ----------
function rrShape(w, h, r) { const s0 = new X.Shape(); s0.moveTo(-w / 2 + r, -h / 2); s0.lineTo(w / 2 - r, -h / 2); s0.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s0.lineTo(w / 2, h / 2 - r); s0.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s0.lineTo(-w / 2 + r, h / 2); s0.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s0.lineTo(-w / 2, -h / 2 + r); s0.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); return s0; }
const PH = { w: 1.55, h: 3.15, d: 0.17 }, phoneG = new X.Group(); scene.add(phoneG);
{
  const body = new X.ExtrudeGeometry(rrShape(PH.w, PH.h, 0.24), { depth: PH.d, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3, curveSegments: 16 });
  body.translate(0, 0, -PH.d / 2); phoneG.add(new X.Mesh(body, MAT('#3A3A3F', { m: 0.75, r: 0.3 })));
}
const SCR = (() => { const [c, x] = mkc(512, 1040); return { c, x, t: tex(c), key: '' }; })();
const scrMesh = new X.Mesh(new X.PlaneGeometry(PH.w - 0.1, PH.h - 0.1), new X.MeshBasicMaterial({ map: SCR.t, toneMapped: false }));
scrMesh.position.z = PH.d / 2 + 0.021; phoneG.add(scrMesh);
const QTEXT = 'Why is the sky blue?', ATEXT = ANSWER.map(([s0]) => s0).join('');
function bubble(x, str, right, y, col, font) {      // a chat bubble, wrapped to 330 px
  setF(x, font || '500 30px Body', 0); const words = str.split(' '), lines = [''];
  words.forEach((w) => { const tl = lines[lines.length - 1] ? lines[lines.length - 1] + ' ' + w : w; if (x.measureText(tl).width > 330 && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = tl; });
  const tw = Math.max(...lines.map((l) => x.measureText(l).width)), bw = tw + 44, bh = lines.length * 40 + 30, bx = right ? 512 - 28 - bw : 28;
  rrx(x, bx, y, bw, bh, 26); x.fillStyle = col; x.fill();
  x.fillStyle = '#FFFFFF'; x.textAlign = 'left'; lines.forEach((l, i) => x.fillText(l, bx + 22, y + 46 + i * 40));
  return y + bh;
}
function screenDraw(t) {                             // the chat, redrawn only when it changes
  const nq = Math.round(QTEXT.length * clamp((t + 0.25) / 1.25)), sent = t >= K.send, ans = t >= K.types ? Math.min(ANSWER.length, Math.floor((t - K.types - 0.2) / 0.12) + 1) : 0;
  const idsQ = t >= K.words, idsA = t >= K.mathW, caret = !sent && Math.floor(t * 3) % 2 === 0;
  const keyS = [nq, sent, ans, idsQ, idsA, caret].join(':'); if (SCR.key === keyS) return; SCR.key = keyS;
  const x = SCR.x; x.fillStyle = '#0D0E12'; x.fillRect(0, 0, 512, 1040);
  rrx(x, 512 / 2 - 78, 22, 156, 44, 22); x.fillStyle = '#000'; x.fill();
  setF(x, '600 26px Body', 0); x.fillStyle = '#FFFFFF'; x.textAlign = 'left'; x.fillText('9:41', 38, 54);
  setF(x, '700 34px Logo', 0); x.textAlign = 'center'; x.fillText('AI', 256, 130);
  x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(0, 160, 512, 2);
  let y = 200;
  if (sent) y = bubble(x, idsQ ? PROMPT.map(([, id]) => id).join(' ') : QTEXT, true, y, BLUE, idsQ ? '500 28px Mono' : null) + 26;
  if (sent && ans === 0 && t > K.send + 0.3) { [0, 1, 2].forEach((i) => { x.beginPath(); x.arc(52 + i * 26, y + 24, 8, 0, TAU); x.fillStyle = 'rgba(255,255,255,' + (0.35 + 0.4 * (Math.floor(t * 4 + i) % 3 === 0)) + ')'; x.fill(); }); }
  if (ans > 0) bubble(x, idsA ? ANSWER.map(([, id]) => id).join(' ') : ANSWER.slice(0, ans).map(([s0]) => s0).join(''), false, y, '#26282F', idsA ? '500 28px Mono' : null);
  rrx(x, 24, 940, 464, 70, 35); x.fillStyle = '#1C1E24'; x.fill();
  setF(x, '500 28px Body', 0); x.textAlign = 'left';
  if (!sent) { x.fillStyle = nq ? '#FFFFFF' : 'rgba(255,255,255,.4)'; x.fillText(nq ? QTEXT.slice(0, nq) : 'Ask anything', 50, 985); if (caret && nq) { const w = x.measureText(QTEXT.slice(0, nq)).width; x.fillRect(52 + w, 960, 3, 34); } }
  else { x.fillStyle = 'rgba(255,255,255,.4)'; x.fillText('Ask anything', 50, 985); }
  x.beginPath(); x.arc(450, 975, 24, 0, TAU); x.fillStyle = nq ? BLUE : '#3A3D46'; x.fill();
  x.strokeStyle = '#FFFFFF'; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(450, 988); x.lineTo(450, 962); x.moveTo(440, 972); x.lineTo(450, 962); x.lineTo(460, 972); x.stroke();
  SCR.t.needsUpdate = true;
}
// the question's words, lifting off the screen as copies (then breaking into digits, drawn in 2D)
const QWORDS = ['Why', 'is', 'the', 'sky', 'blue?'].map((w, i) => {
  const c = textCanvas(w, { size: 110, glow: 'rgba(120,170,255,.9)' }), m = new X.Mesh(new X.PlaneGeometry(c.width / 620, c.height / 620), new X.MeshBasicMaterial({ map: tex(c), transparent: true, depthWrite: false, toneMapped: false }));
  m.userData = { i, from: [-0.5 + i * 0.22, -1.3, 0.12], to: [-0.85 + (i < 3 ? i : i - 2.5) * 0.85, i < 3 ? 1.05 : 0.35, 1.2] }; scene.add(m); return m;
});
const SHATTER = QWORDS.map((m, wi) => Array.from({ length: 16 }, (_, j) => {
  const a = R(wi * 40 + j) * TAU, sp = 0.6 + R(wi * 40 + j + 7) * 1.4;
  return { p: m.userData.to, v: [Math.cos(a) * sp, Math.sin(a) * sp * 0.8 + 0.3, (R(wi * 40 + j + 3) - 0.3) * 1.2], d: String(Math.floor(R(wi * 40 + j + 11) * 10)) };
}));

// ---------- outside: the map, the fiber, the data center ----------
const OUT = new X.Group(); scene.add(OUT);
{
  const [c, x] = mkc(512, 512); x.fillStyle = '#06080D'; x.fillRect(0, 0, 512, 512); x.strokeStyle = 'rgba(70,110,200,.35)'; x.lineWidth = 2;
  for (let i = 0; i <= 512; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 512); x.moveTo(0, i); x.lineTo(512, i); x.stroke(); }
  const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; t0.repeat.set(70, 70);
  const ground = new X.Mesh(new X.PlaneGeometry(700, 700), new X.MeshBasicMaterial({ map: t0 })); ground.rotation.x = -Math.PI / 2; ground.position.set(0, -2.2, -100); OUT.add(ground);
  const n = 4000, pos = new Float32Array(3 * n), col = new Float32Array(3 * n);
  for (let i = 0; i < n; i++) {
    const cx = (R(i + 1) - 0.5) * 260, cz = 40 - R(i + 2) * 260, cl = R(i + 3) < 0.5;   // clustered like towns
    pos.set([cx + (cl ? (R(i + 4) - 0.5) * 6 : 0), -2.12, cz + (cl ? (R(i + 5) - 0.5) * 6 : 0)], 3 * i);
    const warm = R(i + 6) < 0.7; col.set(warm ? [1, 0.75, 0.45] : [0.6, 0.75, 1], 3 * i);
  }
  const gl = new X.BufferGeometry(); gl.setAttribute('position', new X.BufferAttribute(pos, 3)); gl.setAttribute('color', new X.BufferAttribute(col, 3));
  OUT.add(new X.Points(gl, new X.PointsMaterial({ size: 0.25, vertexColors: true, transparent: true, opacity: 0.8, blending: X.AdditiveBlending, depthWrite: false })));
}
const CURVE = new X.CatmullRomCurve3([[0, 1.62, 0.05], [0, 3.4, -1.8], [3.5, 2.2, -16], [-4.5, 1.2, -34], [3.5, 1.5, -54], [-1.5, 1.9, -74], [0.3, 1.8, -91], [0, 1.0, -97.8]].map(v3));
const fiber = new X.Mesh(new X.TubeGeometry(CURVE, 500, 0.045, 8), new X.MeshBasicMaterial({ color: '#3D7BFF', transparent: true, opacity: 0.55, blending: X.AdditiveBlending, depthWrite: false }));
OUT.add(fiber);
const PULSE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => { const s0 = new X.Sprite(glowMat('#CFE1FF', 1 - i * 0.09)); s0.scale.setScalar(0.9 - i * 0.07); scene.add(s0); return s0; });
const BLD = new X.Group(); OUT.add(BLD);
const DOORGLOW = new X.Sprite(glowMat('#BFD8FF', 0)); DOORGLOW.position.set(0, 0.2, -97.6); scene.add(DOORGLOW);
{
  const clad = (w, h, door) => {                     // 42.7 px per unit
    const [c, x] = mkc(w, h); x.fillStyle = '#161B26'; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < w; i += 43) x.fillRect(i, 22, 3, h - 22);
    x.fillStyle = '#0A0D14'; for (let r = 0; r < 3; r++) for (let i = 30; i < w - 60; i += 86) if (!door || Math.abs(i + 26 - w / 2) > 150) x.fillRect(i, 64 + r * 30, 52, 14);
    x.fillStyle = 'rgba(110,175,255,1)'; x.fillRect(0, 6, w, 8);
    for (let i = 60; i < w; i += 170) { x.fillStyle = R(i) < 0.6 ? 'rgba(90,230,150,1)' : 'rgba(90,170,255,1)'; x.fillRect(i, 172, 7, 7); }
    if (door) {
      x.fillStyle = 'rgba(110,175,255,.95)'; x.fillRect(w / 2 - 110, 176, 220, 10);    // the canopy over the entrance
      x.fillStyle = '#05070B'; x.fillRect(w / 2 - 74, 192, 148, h - 192);
    }
    return tex(c);
  };
  const cm = (tx) => new X.MeshStandardMaterial({ map: tx, emissive: '#FFFFFF', emissiveMap: tx, emissiveIntensity: 0.9, roughness: 0.55, metalness: 0.3 });
  const front = cm(clad(1024, 384, true)), side = cm(clad(854, 384, false)), roof = MAT('#141821', { r: 0.7, m: 0.2 });
  const b = new X.Mesh(new X.BoxGeometry(24, 9, 20), [side, side, roof, roof, front, side]); b.position.set(0, 2.3, -108); BLD.add(b);
  // the entrance: a glowing doorway set into the front
  const [dc, dx] = mkc(128, 176), dq = dx.createLinearGradient(0, 0, 0, 176); dq.addColorStop(0, '#DCEBFF'); dq.addColorStop(0.5, '#7FB0FF'); dq.addColorStop(1, '#2F6BFF');
  dx.fillStyle = dq; dx.fillRect(0, 0, 128, 176);
  const door = new X.Mesh(new X.PlaneGeometry(3.2, 4.4), new X.MeshBasicMaterial({ map: tex(dc), toneMapped: false })); door.position.set(0, 0.0, -97.95); BLD.add(door);
  // chillers on the roof: two rows of fan units
  const [fc, fx] = mkc(128, 128); fx.fillStyle = '#0D1016'; fx.fillRect(0, 0, 128, 128);
  fx.strokeStyle = 'rgba(110,175,255,.9)'; fx.lineWidth = 6; fx.beginPath(); fx.arc(64, 64, 52, 0, TAU); fx.stroke();
  fx.fillStyle = '#2A303C'; for (let i = 0; i < 5; i++) { fx.beginPath(); fx.ellipse(64 + 26 * Math.cos(i * TAU / 5), 64 + 26 * Math.sin(i * TAU / 5), 22, 8, i * TAU / 5, 0, TAU); fx.fill(); }
  const fan = cm(tex(fc)), unit = MAT('#232935', { r: 0.6, m: 0.3 });
  for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
    const u = new X.Mesh(new X.BoxGeometry(3.6, 1.0, 3.6), unit); u.position.set(-8.1 + i * 5.4, 7.3, -102.5 - r * 8); BLD.add(u);
    const f = new X.Mesh(new X.PlaneGeometry(3.1, 3.1), fan); f.rotation.x = -Math.PI / 2; f.position.set(-8.1 + i * 5.4, 7.82, -102.5 - r * 8); BLD.add(f);
  }
  // light spilling onto the ground in front of the entrance
  const [gc, gx] = mkc(256, 128), gq = gx.createRadialGradient(128, 128, 0, 128, 128, 128); gq.addColorStop(0, 'rgba(110,170,255,.7)'); gq.addColorStop(1, 'rgba(60,120,255,0)');
  gx.fillStyle = gq; gx.fillRect(0, 0, 256, 128);
  const pool = new X.Mesh(new X.PlaneGeometry(14, 7), new X.MeshBasicMaterial({ map: tex(gc), transparent: true, blending: X.AdditiveBlending, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(0, -2.17, -94.6); BLD.add(pool);
}

// ---------- inside: the hall ----------
const H0 = [0, 0, -400], hall = (p) => [p[0] + H0[0], p[1] + H0[1], p[2] + H0[2]];
const HALL = new X.Group(); HALL.position.set(...H0); scene.add(HALL);
{
  const [c, x] = mkc(512, 512); x.fillStyle = '#0A0C11'; x.fillRect(0, 0, 512, 512); x.strokeStyle = 'rgba(70,120,220,.28)'; x.lineWidth = 3;
  for (let i = 0; i <= 512; i += 128) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 512); x.moveTo(0, i); x.lineTo(512, i); x.stroke(); }
  const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; t0.repeat.set(20, 30);
  const floor = new X.Mesh(new X.PlaneGeometry(80, 120), new X.MeshStandardMaterial({ map: t0, roughness: 0.35, metalness: 0.4 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -2.2; HALL.add(floor);
  // racks: four rows facing two aisles, a front texture of server units
  const [rc, rx] = mkc(128, 512); rx.fillStyle = '#14171E'; rx.fillRect(0, 0, 128, 512);
  for (let i = 0; i < 16; i++) { rx.fillStyle = '#1D2129'; rx.fillRect(8, 10 + i * 31, 112, 25); rx.fillStyle = '#0B0D11'; for (let j = 0; j < 9; j++) rx.fillRect(14 + j * 11, 16 + i * 31, 6, 13); }
  const rmat = new X.MeshStandardMaterial({ map: tex(rc), roughness: 0.5, metalness: 0.5 }), side = MAT('#1A1D24', { m: 0.6, r: 0.4 });
  const rows = [-6.5, -12, 6.5, 12], per = 34, racks = new X.InstancedMesh(new X.BoxGeometry(1.2, 4.6, 1.2), [rmat, rmat, side, side, side, side], rows.length * per);
  const mtx = new X.Matrix4(); let n = 0; const LED = [];
  rows.forEach((rxp) => { for (let i = 0; i < per; i++) { const z = -32 + i * 1.6; mtx.makeTranslation(rxp, 0.1, z); racks.setMatrixAt(n++, mtx);
    const fx = rxp - Math.sign(rxp) * 0.61; for (let k = 0; k < 7; k++) LED.push([fx, -1.8 + R(n * 9 + k) * 3.8, z - 0.45 + R(n * 9 + k + 3) * 0.9]); } });
  HALL.add(racks);
  const lp = new Float32Array(3 * LED.length), seed = new Float32Array(LED.length), lc = new Float32Array(3 * LED.length);
  LED.forEach((p, i) => { lp.set(p, 3 * i); seed[i] = R(i + 900) * 10; lc.set(R(i + 950) < 0.75 ? [0.3, 1, 0.55] : [0.35, 0.65, 1], 3 * i); });
  const lg = new X.BufferGeometry(); lg.setAttribute('position', new X.BufferAttribute(lp, 3)); lg.setAttribute('aSeed', new X.BufferAttribute(seed, 1)); lg.setAttribute('aCol', new X.BufferAttribute(lc, 3));
  var LEDMAT = new X.ShaderMaterial({ transparent: true, depthWrite: false, blending: X.AdditiveBlending, uniforms: { uTime: { value: 0 }, uScale: { value: 1 } },
    vertexShader: `attribute float aSeed; attribute vec3 aCol; uniform float uTime, uScale; varying vec3 vC; varying float vB;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
        float f = fract(sin(aSeed * 91.7 + floor(uTime * 7.0 + aSeed * 3.0) * 13.1) * 43758.5); vB = 0.25 + 0.75 * step(0.4, f); vC = aCol;
        gl_PointSize = 0.09 * uScale / -mv.z; }`,
    fragmentShader: `varying vec3 vC; varying float vB; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.05, d) * vB; if (a < 0.01) discard; gl_FragColor = vec4(vC * a, a); }` });
  const leds = new X.Points(lg, LEDMAT); leds.frustumCulled = false; HALL.add(leds);
  for (const zx of [-9.25, 9.25]) for (let i = 0; i < 4; i++) { const l = new X.Mesh(new X.BoxGeometry(0.25, 0.08, 12), new X.MeshBasicMaterial({ color: '#BFD6FF' })); l.position.set(zx * 0.3, 17, -24 + i * 14); HALL.add(l); }
  // the GPU server under the model
  const [gc, gx] = mkc(512, 512); gx.fillStyle = '#0F1218'; gx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const X0 = 30 + i * 120, Y0 = 30 + j * 120; gx.fillStyle = '#1B1F28'; gx.fillRect(X0, Y0, 92, 92); gx.strokeStyle = 'rgba(80,160,255,.8)'; gx.lineWidth = 3; gx.strokeRect(X0 + 4, Y0 + 4, 84, 84);
    gx.fillStyle = '#C9A55C'; gx.fillRect(X0 + 30, Y0 + 30, 32, 32); setF(gx, '700 16px Body', 1); gx.fillStyle = 'rgba(255,255,255,.7)'; gx.textAlign = 'center'; gx.fillText('GPU', X0 + 46, Y0 + 84); }
  const gtop = new X.MeshStandardMaterial({ map: tex(gc), emissive: '#FFFFFF', emissiveMap: tex(gc), emissiveIntensity: 0.55, roughness: 0.5 }), gside = MAT('#151820', { m: 0.6 });
  var GPU = new X.Mesh(new X.BoxGeometry(6.4, 1.1, 6.4), [gside, gside, gtop, gside, gside, gside]); GPU.position.set(0, -1.65, -2.6); HALL.add(GPU);
}

// ---------- the model, drawn as a stack ----------
const TOK = [...PROMPT, ...ANSWER].map(([s0, id], i) => {
  const g0 = new X.Group(), col = TOKC[i % TOKC.length], txt = s0.trim() || s0;
  const box = new X.Mesh(new X.BoxGeometry(1.0, 0.56, 0.2), MAT(col, { r: 0.35, e: col, ei: 0.25 })); g0.add(box);
  const face = (str, f, z, ry) => { const [c, x] = mkc(400, 224); rrx(x, 6, 6, 388, 212, 40); x.fillStyle = col; x.fill(); x.fillStyle = '#FFFFFF'; x.textAlign = 'center'; x.textBaseline = 'middle';
    let size = 104; setF(x, f.replace('S', size), 0); while (x.measureText(str).width > 340) { size -= 6; setF(x, f.replace('S', size), 0); } x.fillText(str, 200, 116);
    const m = new X.Mesh(new X.PlaneGeometry(0.98, 0.55), new X.MeshBasicMaterial({ map: tex(c), toneMapped: false })); m.position.z = z; m.rotation.x = ry; g0.add(m); };
  face(txt, '700 Spx Logo', 0.101, 0); face(String(id), '600 Spx Mono', -0.101, Math.PI);
  g0.visible = false; HALL.add(g0); return { g: g0, i, id, txt };
});
const slot = (i) => { const r = Math.floor(i / 3), c = i % 3; return [(c - 1) * 1.12, 3.0 - r * 0.72, 0]; };
const QSTART = (() => { let x0 = 0; const ws = PROMPT.map(([s0]) => s0.length); const tot = ws.reduce((a, b) => a + b, 0); return PROMPT.map(([s0], i) => { const xx = -2.2 + 4.4 * (x0 + ws[i] / 2) / tot; x0 += ws[i]; return [xx, 2.7, 0]; }); })();
const QPLANE = (() => { const c = textCanvas(QTEXT, { size: 120, glow: 'rgba(120,170,255,.8)' }); const m = new X.Mesh(new X.PlaneGeometry(3.3, 3.3 * c.height / c.width), new X.MeshBasicMaterial({ map: tex(c), transparent: true, depthWrite: false, toneMapped: false })); m.position.set(0, 2.7, 0); HALL.add(m); return m; })();
// each prompt token's list of numbers: 40 cells running back from it
const NCELL = 40, EMB = new X.InstancedMesh(new X.BoxGeometry(0.62, 0.3, 0.075), new X.MeshStandardMaterial({ roughness: 0.4, emissive: '#FFFFFF', emissiveIntensity: 0.25 }), PROMPT.length * NCELL);
{ const c = new X.Color(); for (let i = 0; i < PROMPT.length * NCELL; i++) { const v = Math.sin(i * 12.9898) * 43758.5453; const u = v - Math.floor(v); c.set(mixc('#2563EB', '#F43F5E', u)); EMB.setColorAt(i, c); } }
EMB.frustumCulled = false; HALL.add(EMB);
// ten layer plates
const PL = Array.from({ length: 10 }, (_, i) => {
  const g0 = new X.Group(); g0.position.set(0, 4.3 + i * 0.85, -2.6);
  const m = new X.Mesh(new X.PlaneGeometry(4.0, 7.6), new X.MeshBasicMaterial({ color: '#3B82F6', transparent: true, opacity: 0.08, side: X.DoubleSide, depthWrite: false, blending: X.AdditiveBlending })); m.rotation.x = -Math.PI / 2; g0.add(m);
  const e = new X.LineSegments(new X.EdgesGeometry(new X.PlaneGeometry(4.0, 7.6)), new X.LineBasicMaterial({ color: '#7FB0FF', transparent: true, opacity: 0.6 })); e.rotation.x = -Math.PI / 2; g0.add(e);
  g0.visible = false; HALL.add(g0); return { g: g0, m, e };
});
// attention: an arc from each prompt token back to each one before it, drawn on the active plate
const ARC = (() => {
  const pos = [], seg = 18, owner = [];
  for (let i = 1; i < PROMPT.length; i++) for (let j = 0; j < i; j++) {
    const a = slot(i), b = slot(j), A = [a[0], 0, (a[1] - 3) * 1.4 + 0.8], B = [b[0], 0, (b[1] - 3) * 1.4 + 0.8], hgt = 0.35 + 0.22 * Math.hypot(A[0] - B[0], A[2] - B[2]);
    for (let k = 0; k < seg; k++) { const p = (u) => [lerp(A[0], B[0], u), Math.sin(u * Math.PI) * hgt, lerp(A[2], B[2], u)]; pos.push(...p(k / seg), ...p((k + 1) / seg)); owner.push(i, i); }
  }
  const geo = new X.BufferGeometry(); geo.setAttribute('position', new X.Float32BufferAttribute(pos, 3));
  const col = new Float32Array(pos.length); geo.setAttribute('color', new X.BufferAttribute(col, 3));
  const m = new X.LineSegments(geo, new X.LineBasicMaterial({ vertexColors: true, transparent: true, blending: X.AdditiveBlending, depthWrite: false }));
  m.visible = false; HALL.add(m); return { m, col, owner };
})();
// rising activity: sparks climbing the stack
const SPK = (() => { const n = 420, p = new Float32Array(3 * n); const g0 = new X.BufferGeometry(); g0.setAttribute('position', new X.BufferAttribute(p, 3));
  const m = new X.Points(g0, new X.PointsMaterial({ size: 0.09, color: '#9CC2FF', transparent: true, opacity: 0.9, blending: X.AdditiveBlending, depthWrite: false })); m.frustumCulled = false; HALL.add(m); return { m, p, n }; })();
// the scores panel at the top
const CANDS = [
  [['Air', 41], ['The', 22], ['Sun', 9], ['Because', 7], ['Blue', 4], ['It', 3]],
  [[' sc', 38], [' is', 21], [' molecules', 9], [' bends', 6], [' looks', 4]],
  [['atters', 97], ['att', 1], ['ats', 1]],
  [[' blue', 52], [' sunlight', 21], [' light', 13], [' short', 6]],
  [[' light', 71], [' and', 9], [' wavelengths', 8]],
  [[' more', 64], [' far', 12], [' most', 9]],
  [[' than', 88], [' strongly', 6]],
  [[' red', 79], [' other', 9], [' longer', 5]],
  [['.', 66], [' light', 21], [',', 8]],
];
const PAN = (() => { const [c, x] = mkc(800, 620); const m = new X.Mesh(new X.PlaneGeometry(4.0, 3.1), new X.MeshBasicMaterial({ map: tex(c), transparent: true, toneMapped: false })); m.position.set(0, 13.5, -2.2); m.visible = false; HALL.add(m); return { c, x, m, key: '' }; })();
function panelDraw(step, picked) {
  const keyS = step + ':' + picked; if (PAN.key === keyS) return; PAN.key = keyS;
  const x = PAN.x; x.clearRect(0, 0, 800, 620); rrx(x, 6, 6, 788, 608, 44); x.fillStyle = 'rgba(14,17,24,.92)'; x.fill(); x.strokeStyle = 'rgba(120,170,255,.6)'; x.lineWidth = 4; x.stroke();
  setF(x, '700 46px Logo', -1); x.fillStyle = '#FFFFFF'; x.textAlign = 'left'; x.fillText('Next token', 46, 82);
  setF(x, '500 28px Body', 0); x.fillStyle = 'rgba(255,255,255,.55)'; x.textAlign = 'right'; x.fillText('scored out of 100,277', 754, 80);
  CANDS[step].forEach(([s0, p], i) => {
    const Y = 130 + i * 78, win_ = picked && i === 0;
    if (win_) { rrx(x, 30, Y - 6, 740, 66, 18); x.fillStyle = 'rgba(47,128,255,.35)'; x.fill(); }
    setF(x, '600 34px Mono', 0); x.fillStyle = '#FFFFFF'; x.textAlign = 'left'; x.fillText(s0.replace(/^ /, '·'), 50, Y + 40);
    rrx(x, 300, Y + 14, 340 * p / 100 + 6, 30, 15); x.fillStyle = win_ ? BLUE : i === 0 ? '#5B8CFF' : 'rgba(255,255,255,.35)'; x.fill();
    setF(x, '600 30px Body', 0); x.fillStyle = 'rgba(255,255,255,.85)'; x.textAlign = 'right'; x.fillText(p + '%', 760, Y + 40);
  });
  PAN.m.material.map.needsUpdate = true;
}

// ---------- camera ----------
const VIEW = {
  ph0: [[0.6, 1.0, 6.2], [0, 0.45, 0], 40], phIn0: [[0.45, -0.75, 4.3], [0, -1.22, 0.1], 40], phIn1: [[0.3, -0.85, 3.7], [0, -1.24, 0.1], 40], ph1: [[1.5, 1.6, 7.6], [0, 0.6, 0.5], 40], ph2: [[1.0, 1.3, 7.0], [0, 0.5, 0], 40],
  tokIn: [hall([0, 3.0, 5.0]), hall([0, 2.6, 0]), 40], tok: [hall([0, 3.3, 9.0]), hall([0, 2.55, 0]), 40], tok2: [hall([0.6, 3.6, 8.2]), hall([0, 2.5, 0]), 40],
  emb: [hall([5.0, 7.0, 9.6]), hall([-0.6, 2.2, -2.4]), 42], lay: [hall([8.0, 10.5, 11.5]), hall([0, 7.4, -2.6]), 46], lay2: [hall([6.0, 12.5, 9.5]), hall([0, 8.6, -2.6]), 46],
  hall: [hall([15, 10, 23]), hall([0, 6, -3]), 50], top: [hall([0, 15.3, 8.0]), hall([0, 13.4, -2.2]), 38], wide: [hall([9, 10.5, 15.5]), hall([0, 6.4, -2.4]), 52],
  phA: [[0.55, 1.3, 4.9], [0, 0.75, 0], 40], phB: [[0.3, 1.2, 4.6], [0, 0.72, 0], 40],
};
const v = (name, t) => [t, ...VIEW[name][0], ...VIEW[name][1], VIEW[name][2]];
const CAMH = [v('phIn0', 0), v('phIn1', K.ai + 0.1), v('ph1', K.word + 0.15), v('ph1', K.notone), v('ph2', K.send)];
const CAMI = [v('tokIn', K.tokens - 0.12), v('tok', K.tokens + 0.35), v('tok', K.becomes), v('tok2', K.num + 0.2), v('tok2', K.list - 0.1), v('emb', K.thou + 0.35), v('emb', K.model),
  v('lay', K.lay + 0.2), v('lay2', K.back + 0.2), v('lay2', K.calc), v('hall', K.calc + 1.1), v('hall', K.scores), v('top', K.scores + 0.65), v('top', K.pickOne + 0.15), v('wide', K.again + 0.35), v('wide', K.types)];
const CAMP = [v('phA', K.types - 0.1), v('phA', K.math), v('phB', K.mathW + 0.6), v('phB', K.tense + 2)];
const FT0 = K.send, FT1 = K.tokens - 0.32;          // the pulse's run along the fiber: it speeds up, then flies straight in
const fp = (t) => { const u = clamp((t - FT0) / (FT1 - FT0)), a = 0.18; return u < a ? u * u / (2 * a) / (1 - a / 2) : (u - a / 2) / (1 - a / 2); };
const REVEAL = [2.5, 15, -47, 0, 1.6, -104, 50], DOOR = [0, 0.1, -96.6, 0, 0.0, -112, 50];
function camAt(t) {
  if (DEBUGCAM) return [...DEBUGCAM[0], ...DEBUGCAM[1], DEBUGCAM[2]];
  if (t < FT0) return kf(t, CAMH);
  if (t < K.tokens - 0.12) {                         // follow the pulse, eased in from the hook's last view
    const p = fp(t), a = CURVE.getPointAt(clamp(p - 0.045)), b = CURVE.getPointAt(clamp(p + 0.01)), k0 = eio((t - FT0) / 0.7), last = kf(FT0, CAMH);
    const f = [a.x + 2.4, a.y + 1.7, a.z + 4.2], tg = [b.x, b.y + 0.2, b.z];
    const q = [lerp(last[0], f[0], k0), lerp(last[1], f[1], k0), lerp(last[2], f[2], k0), lerp(last[3], tg[0], k0), lerp(last[4], tg[1], k0), lerp(last[5], tg[2], k0), lerp(last[6], 50, k0)];
    const rv = eio((t - K.lightw + 0.15) / 0.75), dv = Math.pow(clamp((t - K.tokens + 0.42) / 0.3), 2.2);
    return q.map((v0, i) => lerp(lerp(v0, REVEAL[i], rv), DOOR[i], dv));
  }
  if (t < K.types - 0.1) {
    const base = kf(t, CAMI), wv = win(t, K.every - 0.35, K.calc - 0.15, 0.5, 0.45);
    if (wv <= 0) return base;
    const ya = 4.3 + actFrac(t) * 9 * 0.85, tr = [...hall([4.0, ya + 3.0, 6.6]), ...hall([0, ya + 0.2, -0.6]), 44];
    return base.map((q, i) => lerp(q, tr[i], eio(wv)));
  }
  return kf(t, CAMP);
}
const actFrac = (t) => clamp((t - K.lay) / (K.calc - 0.3 - K.lay));
const tmpV = new X.Vector3();
function project(p) { tmpV.set(...p).project(cam); return [(tmpV.x + 1) / 2 * W, (1 - tmpV.y) / 2 * H, tmpV.z < 1]; }
const inHall = (t) => t >= K.tokens - 0.12 && t < K.types - 0.1;

// ---------- the state of the world at time t ----------
function setWorld(t) {
  const c = camAt(t); cam.position.set(c[0], c[1], c[2]); cam.fov = c[6]; cam.updateProjectionMatrix(); cam.lookAt(c[3], c[4], c[5]);
  const hallOn = inHall(t); HALL.visible = hallOn; OUT.visible = !hallOn; phoneG.visible = !hallOn;
  BLD.visible = fiber.visible = t > K.send - 0.3 && t < K.tokens;    // only on the journey
  LEDMAT.uniforms.uTime.value = t; LEDMAT.uniforms.uScale.value = H / (2 * Math.tan((cam.fov * Math.PI) / 360));
  screenDraw(t);
  // the question's words lift off the screen, then break into digits
  QWORDS.forEach((m) => {
    const u = m.userData, k = eio((t - K.never - 0.05 * u.i) / 0.7), on = t >= K.never && t < K.word && !hallOn;
    m.visible = on; if (!on) return; m.position.set(lerp(u.from[0], u.to[0], k), lerp(u.from[1], u.to[1], k), lerp(u.from[2], u.to[2], k)); m.quaternion.copy(cam.quaternion);
    m.material.opacity = clamp(k * 3);
  });
  // the pulse along the fiber (and the trail behind it)
  const p = fp(t), pulseOn = t >= K.send - 0.05 && !hallOn && t < FT1 + 0.04;
  PULSE.forEach((s0, i) => { s0.visible = pulseOn; if (!pulseOn) return; const q = CURVE.getPointAt(clamp(p - i * 0.004)); s0.position.copy(q); });
  fiber.material.opacity = 0.55 * clamp((t - K.send + 0.2) / 0.4);
  const fl = clamp(1 - Math.abs(t - FT1 - 0.04) / 0.22); DOORGLOW.visible = !hallOn && fl > 0; DOORGLOW.material.opacity = fl; DOORGLOW.scale.setScalar(4 + 10 * fl);
  // the prompt: one line of text, chopped into tokens, flipped to their numbers
  const chop = (i) => eio((t - K.chopped - 0.06 * i) / 0.45);
  QPLANE.visible = hallOn && t < K.chopped + 0.05;
  TOK.forEach((o) => {
    const i = o.i;
    if (i < PROMPT.length) {
      o.g.visible = hallOn && t >= K.chopped;
      const a = QSTART[i], b = slot(i), k = chop(i); o.g.position.set(lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)); o.g.scale.setScalar(lerp(0.7, 1, k));
      const fl = eio((t - K.becomes - 0.07 * i) / 0.35) * (1 - eio((t - K.scores) / 0.4)); o.g.rotation.x = Math.PI * fl;
    } else {                                         // answer tokens drop from the panel into the rows
      const j = i - PROMPT.length, t0 = dropTime(j), k = eio((t - t0) / 0.32);
      o.g.visible = hallOn && t >= t0; if (!o.g.visible) return;
      const a = [-0.9, 12.6, -2.0], b = slot(i); o.g.position.set(lerp(a[0], b[0], k), lerp(a[1], b[1], k) + Math.sin(k * Math.PI) * 0.6, lerp(a[2], b[2], k)); o.g.rotation.x = 0; o.g.scale.setScalar(1);
    }
  });
  // each token's list of numbers
  const m4 = new X.Matrix4(), embOut = 1 - eio((t - K.scores) / 0.5);
  for (let i = 0; i < PROMPT.length; i++) {
    const b = slot(i), grow = eio((t - K.list - 0.06 * i) / 0.75) * embOut;
    for (let j = 0; j < NCELL; j++) { const on = j < grow * NCELL; m4.makeScale(on ? 1 : 0.0001, on ? 1 : 0.0001, on ? 1 : 0.0001); m4.setPosition(b[0], b[1], -0.32 - j * 0.16); EMB.setMatrixAt(i * NCELL + j, m4); }
  }
  EMB.instanceMatrix.needsUpdate = true; EMB.visible = hallOn && t >= K.list - 0.1;
  // the layers rise into place; the active one glows and carries the attention arcs
  const act = t < K.lay ? -1 : t < K.calc ? clamp((t - K.lay) / (K.calc - 0.3 - K.lay)) * 9 : loopLayer(t);
  PL.forEach((o, i) => {
    const k = eio((t - K.dozens - 0.05 * i) / 0.35); o.g.visible = hallOn && k > 0; if (!o.g.visible) return;
    o.g.position.y = 4.3 + i * 0.85 - (1 - k) * 1.5; const hot = act >= 0 ? Math.max(0, 1 - Math.abs(act - i)) : 0;
    o.m.material.opacity = (0.06 + 0.22 * hot) * k; o.e.material.opacity = (0.35 + 0.65 * hot) * k;
  });
  const arcOn = false;                               // the arcs are drawn in 2D (attention(), below), thick and glowing
  ARC.m.visible = arcOn;
  if (arcOn) {
    ARC.m.position.y = 4.3 + clamp(act, 0, 9) * 0.85 + 0.03;
    const focus = 1 + Math.min(4.999, (t - K.every) / ((K.calc - K.every) / 5));    // which token is looking back
    for (let s0 = 0; s0 < ARC.owner.length; s0++) { const o = ARC.owner[s0], b = o === Math.floor(focus) ? 1 : o < focus ? 0.22 : 0; ARC.col.set([0.45 * b, 0.75 * b, 1.0 * b], s0 * 3); }
    ARC.m.geometry.attributes.color.needsUpdate = true;
  }
  // sparks climbing the stack while it runs
  const spOn = hallOn && t >= K.model && t < K.types; SPK.m.visible = spOn;
  if (spOn) { for (let i = 0; i < SPK.n; i++) { const s = slot(i % PROMPT.length), u = ((t * 1.6 + R(i + 300) * 9) % 9) / 9; SPK.p.set([s[0] + (R(i + 310) - 0.5) * 0.9, 3.4 + u * 9.6, -0.4 - R(i + 320) * 6], 3 * i); } SPK.m.geometry.attributes.position.needsUpdate = true; }
  // the scores panel
  PAN.m.visible = hallOn && t >= K.scores - 0.1;
  if (PAN.m.visible) { const st = panelStep(t); panelDraw(st, t >= (st === 0 ? K.pickOne - 0.05 : dropTime(st) - 0.08)); const k = back(kk(t, K.scores - 0.1, 0.4)); PAN.m.scale.setScalar(k); PAN.m.quaternion.copy(cam.quaternion); }
}
// the loop: answer token j leaves the panel at dropTime(j)
const LOOP0 = K.again + 0.05, LOOPDT = (K.types - 0.25 - LOOP0) / (ANSWER.length - 1);
const dropTime = (j) => (j === 0 ? K.pickOne + 0.15 : LOOP0 + (j - 1) * LOOPDT + LOOPDT * 0.6);
const panelStep = (t) => (t < LOOP0 ? 0 : Math.min(ANSWER.length - 1, 1 + Math.floor((t - LOOP0) / LOOPDT)));
const loopLayer = (t) => (t < LOOP0 ? 9 : (((t - LOOP0) % LOOPDT) / (LOOPDT * 0.6)) * 9);

function backdrop(x, t) {
  x.fillStyle = '#04050A'; x.fillRect(0, 0, W, H);
  const q = x.createRadialGradient(540, 760, 60, 540, 900, 1300); q.addColorStop(0, inHall(t) ? 'rgba(40,60,110,.55)' : 'rgba(55,65,95,.5)'); q.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = q; x.fillRect(0, 0, W, H);
}

// ---------- labels: a dot on the thing, a thin line, a label ----------
const pillHalf = (str, size) => { setF(g, '600 ' + size + 'px Body', -size * 0.02); return (g.measureText(str).width + size * 1.05) / 2; };
function label(x, p3, dx, dy, str, k, o = {}) {
  if (k <= 0) return; const [ax, ay, vis] = project(p3); if (!vis) return;
  const hw = pillHalf(str, o.size || 40), ex = clamp(ax + dx, 30 + (dx < 0 ? 2 * hw : dx ? 0 : hw), W - 30 - (dx > 0 ? 2 * hw : dx ? 0 : hw)), ey = ay + dy, kk2 = clamp(k);
  x.save(); x.strokeStyle = o.col || WHT; x.lineWidth = 3.5; x.lineCap = 'round'; x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 10;
  x.beginPath(); x.arc(ax, ay, 9 * back(kk2 / 0.4), 0, TAU); x.stroke();
  const lk = ease((kk2 - 0.15) / 0.45); x.beginPath(); x.moveTo(ax + (dx ? Math.sign(dx) * 9 : 0), ay + (dx ? 0 : Math.sign(dy) * 9)); x.lineTo(lerp(ax, ex, lk), lerp(ay, ey, lk)); x.stroke();
  x.restore();
  pill(x, str, ex + (dx > 0 ? 1 : dx < 0 ? -1 : 0) * hw, ey + (dx === 0 ? Math.sign(dy) * 36 : 0), o.size || 40, !!o.dark, (kk2 - 0.35) / 0.4, { f: 'Body', w: 600, ...(o.bg ? { bg: o.bg, fg: o.fg } : {}) });
}
function smallPrint(x, str, a) {
  if (a <= 0 || !str) return; x.save();
  const bq = x.createLinearGradient(0, 1700, 0, 1920); bq.addColorStop(0, 'rgba(0,0,0,0)'); bq.addColorStop(1, 'rgba(0,0,0,.7)'); x.globalAlpha = a; x.fillStyle = bq; x.fillRect(0, 1700, W, 220);
  x.globalAlpha = a * 0.8; setF(x, '500 25px Body', 0); x.fillStyle = '#A1A1A6'; x.textAlign = 'center';
  const words = str.split(' '), lines = ['']; words.forEach((w) => { const tl = lines[lines.length - 1] ? lines[lines.length - 1] + ' ' + w : w; if (x.measureText(tl).width > 960 && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = tl; });
  lines.forEach((l, i) => x.fillText(l, 540, 1832 - (lines.length - 1 - i) * 32)); x.restore();
}
function counter(x, t) {                             // the operations for one token, counted up
  const k = win(t, K.billions - 0.15, K.scores, 0.2, 0.3); if (k <= 0) return;
  const n = Math.round(350e9 * ease((t - K.billions + 0.15) / 1.1));
  x.save(); x.globalAlpha = k; x.textAlign = 'center'; x.shadowColor = 'rgba(0,0,0,.75)'; x.shadowBlur = 30;
  setF(x, '800 92px Logo', -3); x.fillStyle = WHT; x.fillText(n.toLocaleString('en-US'), 540, 1470);
  setF(x, '600 38px Body', 0); x.shadowBlur = 12; x.fillStyle = 'rgba(255,255,255,.85)'; x.fillText('operations for one token, GPT-3 scale', 540, 1530); x.restore();
}
function digits(x, t) {                              // the words breaking into digits
  if (t < K.word || t > K.word + 1.3) return; const u = t - K.word;
  x.save(); setF(x, '700 46px Mono', 0); x.textAlign = 'center';
  SHATTER.forEach((ps) => ps.forEach((q) => {
    const p3 = [q.p[0] + q.v[0] * u, q.p[1] + q.v[1] * u - 0.6 * u * u, q.p[2] + q.v[2] * u], [X0, Y0, vis] = project(p3); if (!vis) return;
    x.globalAlpha = clamp(1 - u / 1.2) * 0.95; x.fillStyle = mixc('#FFFFFF', '#8AB4FF', u); x.fillText(q.d, X0, Y0);
  }));
  x.restore();
}
function attention(x, t) {                          // each token's arcs back to the ones before it, on the active plate
  const k = win(t, K.every - 0.15, K.calc + 0.1, 0.3, 0.3); if (k <= 0) return;
  const ya = 4.3 + actFrac(t) * 9 * 0.85 + 0.04, focus = 1 + Math.min(4.999, (t - K.every) / ((K.calc - K.every) / 5));
  const pt = (i) => { const s0 = slot(i); return [s0[0], ya, s0[1] > 2.6 ? 0.4 : -0.9]; };
  x.save(); x.lineCap = 'round';
  for (let i = 1; i < PROMPT.length; i++) for (let j = 0; j < i; j++) {
    const b = i === Math.floor(focus) ? 1 : i < focus ? 0.25 : 0; if (b <= 0) continue;
    const A = pt(i), B = pt(j), hgt = 0.45 + 0.3 * Math.hypot(A[0] - B[0], A[2] - B[2]), grow = i === Math.floor(focus) ? ease((focus % 1) / 0.35) : 1;
    x.beginPath(); for (let s0 = 0; s0 <= 28 * grow; s0++) { const u = s0 / 28, P0 = project(hall([lerp(A[0], B[0], u), A[1] + Math.sin(u * Math.PI) * hgt, lerp(A[2], B[2], u)])); s0 ? x.lineTo(P0[0], P0[1]) : x.moveTo(P0[0], P0[1]); }
    x.globalAlpha = k * b; x.strokeStyle = b === 1 ? '#9CC4FF' : '#5B8CFF'; x.lineWidth = b === 1 ? 6 : 3; x.shadowColor = '#4D8BFF'; x.shadowBlur = b === 1 ? 24 : 8; x.stroke();
  }
  x.shadowBlur = 16; x.shadowColor = '#4D8BFF';
  for (let i = 0; i < PROMPT.length; i++) { const P0 = project(hall(pt(i))); x.globalAlpha = k; x.fillStyle = i === Math.floor(focus) ? '#FFFFFF' : '#9CC4FF'; x.beginPath(); x.arc(P0[0], P0[1], i === Math.floor(focus) ? 11 : 7, 0, TAU); x.fill(); }
  x.restore();
}
function flash(x, t, t0) { const u = t - t0; if (u < -0.08 || u > 0.18) return; x.fillStyle = 'rgba(255,255,255,' + (u < 0 ? (u + 0.08) / 0.08 : 1 - u / 0.18) * 0.85 + ')'; x.fillRect(0, 0, W, H); }

// ---------- the 3D shot ----------
function three(x, t) {
  setWorld(t); backdrop(x, t);
  x.save(); x.translate(jolt(t, K.one, 9) + jolt(t, K.mathW, 8), 0);
  R3.render(scene, cam); x.drawImage(glc, 0, 0);
  digits(x, t); if (inHall(t)) attention(x, t);
  const S0 = PROMPT.length;
  // the hook
  if (t < K.send + 0.2) pill(x, 'words read: 0', 540, 1430, 46, false, kk(t, K.one - 0.05, 0.3) * (1 - kk(t, K.how + 0.3, 0.2)), { f: 'Body', w: 700, bg: RED, fg: WHT });
  // outside
  if (!inHall(t) && t < K.tokens) {
    label(x, CURVE.getPointAt(clamp(fp(t) - 0.018)).toArray(), 40, 300, 'fiber-optic cable', win(t, K.cable - 0.1, K.pulses, 0.35, 0.2));
    label(x, PULSE[0].position.toArray(), 60, -320, 'pulses of light', win(t, K.pulses - 0.05, K.dc - 0.1, 0.35, 0.2));
    label(x, [0, 7.9, -103], 0, -230, 'data center', win(t, K.dc - 0.05, K.tokens - 0.45, 0.3, 0.12));
  }
  // inside
  if (inHall(t)) {
    label(x, hall([slot(3)[0], slot(3)[1] - 0.3, 0.1]), 0, 330, 'about 4 letters each', win(t, K.four - 0.1, K.number + 0.1, 0.35, 0.2));
    label(x, hall([slot(0)[0], slot(0)[1] + 0.3, 0.1]), 0, -330, 'token ID', win(t, K.num - 0.1, K.thousands + 0.1, 0.35, 0.2), { bg: BLUE, fg: WHT });
    label(x, hall([slot(2)[0] + 0.45, slot(2)[1], -6.6]), -60, -300, 'GPT-3: 12,288 numbers each', win(t, K.thou - 0.05, K.layers + 0.2, 0.35, 0.2));
    label(x, hall([2.0, 4.3 + 9 * 0.85, -2.6]), 30, -220, 'layers (GPT-3 has 96)', win(t, K.lay - 0.05, K.every + 0.2, 0.35, 0.2));
    label(x, hall([-1.12, 4.3 + actFrac(t) * 9 * 0.85 + 0.6, 0.4]), -60, 330, 'attention: looking back', win(t, K.back - 0.2, K.calc, 0.35, 0.2), { bg: BLUE, fg: WHT });
    label(x, hall([2.6, -1.1, 0.6]), 0, 300, 'GPUs', win(t, K.calcs - 0.1, K.scores, 0.35, 0.2));
    counter(x, t);
    label(x, hall([-1.5, 14.2, -2.1]), 0, -260, 'a score for every token', win(t, K.knows - 0.1, K.pickOne, 0.35, 0.1));
    label(x, hall([-1.6, 14.2, -2.1]), 0, -260, 'picked', win(t, K.pickOne - 0.05, K.again + 0.2, 0.3, 0.2), { bg: BLUE, fg: WHT });
    if (t >= K.again) pill(x, 'tokens written: ' + TOK.filter((o) => o.i >= S0 && t >= dropTime(o.i - S0) + 0.3).length, 540, 1500, 40, false, kk(t, K.again, 0.3), { f: 'Body', w: 700 });
  }
  // back on the phone
  if (t >= K.types - 0.1 && t < T0.tense) {
    label(x, [-0.25, 0.27, 0.12], 0, 300, 'streamed to you as it’s written', win(t, K.typeW - 0.1, K.math, 0.35, 0.2));
    label(x, [-0.45, 0.45, 0.12], -40, 420, 'token IDs', win(t, K.words - 0.05, 99, 0.35, 0.2), { bg: BLUE, fg: WHT });
  }
  x.restore();
  flash(x, t, K.tokens - 0.1); flash(x, t, K.types - 0.1);
  const FP = [[K.fiber, K.tokens, 'After the first hop over Wi-Fi or mobile data, most long-distance internet traffic travels through fiber-optic cable.'],
    [K.tokens + 0.2, K.thousands, 'Real tokens and IDs from GPT-4’s tokenizer. OpenAI: 1 token is about 4 characters of English.'],
    [K.thousands, K.calc, 'GPT-3: 12,288 numbers per token, 96 layers (Brown et al. 2020). Values shown are an illustration.'],
    [K.calc, K.scores, 'About 2 operations per parameter per token: GPT-3 has 175 billion parameters.'],
    [K.scores, K.types - 0.1, 'Scores are an illustration. GPT-4’s tokenizer has 100,277 tokens; real answer tokens shown.']];
  FP.forEach(([a, b, str]) => smallPrint(x, str, win(t, a + 0.15, b - 0.05, 0.3, 0.15)));
}
S.ai = three;

// ---------- the tension: the colour drains, a heartbeat, a clock ----------
let FRZ = null;
function frozen() { if (!FRZ) { const [c, x] = mkc(1080, 1920); three(x, K.freeze); FRZ = c; } return FRZ; }
S.tense = (x, t) => {
  const tk = clamp((t - K.tense) / (T0.phone - K.tense)), hb = Math.max(...BEATS.map((q) => bump(t, q, 0.22)));
  x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
  x.save(); zoomAt(x, 540, 960, 1 + 0.02 * hb + 0.03 * tk); x.translate(jolt(t, T0.phone - 0.28, 12), 0);
  x.filter = 'saturate(' + (1 - 0.85 * tk) + ') brightness(' + (1 - 0.3 * tk) + ') contrast(' + (1 + 0.12 * tk) + ')';
  x.drawImage(frozen(), 0, 0); x.filter = 'none'; x.restore();
  vignette(x, 0.75 * tk);
};

// ---------- the switch: the reel you were watching, in a phone; then it is your ad ----------
const PHN = { cy: 610, s: 0.62 };
function heart(c, X0, Y, r) { c.beginPath(); c.moveTo(X0, Y + r * 0.9); c.bezierCurveTo(X0 - r * 1.6, Y - r * 0.1, X0 - r * 0.8, Y - r * 1.3, X0, Y - r * 0.45); c.bezierCurveTo(X0 + r * 0.8, Y - r * 1.3, X0 + r * 1.6, Y - r * 0.1, X0, Y + r * 0.9); c.fill(); }
function rail(c) {
  c.save(); c.fillStyle = WHT; c.strokeStyle = WHT; c.lineWidth = 6; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 10;
  heart(c, 544, 690, 32);
  c.beginPath(); c.arc(544, 806, 28, 0.35 * Math.PI, 2.25 * Math.PI); c.lineTo(522, 840); c.closePath(); c.stroke();
  c.beginPath(); c.moveTo(514, 902); c.lineTo(576, 880); c.lineTo(554, 942); c.lineTo(543, 914); c.closePath(); c.stroke();
  c.restore();
}
function acct(c, name, sub, a) {
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
  setF(c, '500 26px Body', 0); c.fillStyle = 'rgba(255,255,255,.9)'; c.textAlign = 'left'; c.fillText('How AI really answers you…', 30, 1090);
  if (ad > 0) {
    c.save(); c.globalAlpha = ad; c.translate(0, 50 * (1 - ad)); rrx(c, 24, 1118, 552, 90, 18); c.fillStyle = 'rgba(255,255,255,.96)'; c.fill();
    setF(c, '700 34px Body', 0); c.fillStyle = INK; c.fillText('Shop now', 54, 1176); c.textAlign = 'right'; c.fillText('›', 548, 1177); c.restore();
  }
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(0, 1254, 600, 7); c.fillStyle = WHT; c.fillRect(0, 1254, 600 * 0.8, 7);
  const kt = (t - T0.phone - 0.3) / 0.3;
  if (kt > 0) {
    const n = Math.round(NUM * clamp((t - K.watched) / (K.num34 - K.watched))), str = '0:' + String(n).padStart(2, '0');
    c.save(); c.globalAlpha = clamp(kt); setF(c, '600 46px Body', 0); const tw = c.measureText(str).width;
    rrx(c, 300 - tw / 2 - 62, 112, tw + 104, 80, 40); c.fillStyle = 'rgba(0,0,0,.62)'; c.fill();
    c.fillStyle = RED; c.beginPath(); c.arc(300 - tw / 2 - 28, 152, 12, 0, TAU); c.fill();
    c.fillStyle = WHT; c.textAlign = 'left'; c.fillText(str, 300 - tw / 2 - 2, 168); c.restore();
  }
}
S.phone = (x, t) => {
  stage(x, true);
  if (!IMG.reelscr) IMG.reelscr = mkc(1200, 2560)[0];
  const k = eio((t - T0.phone) / 0.6);
  phone(x, P(540, lerp(960, PHN.cy, k), PHN.s * Math.pow(1.8 / PHN.s, 1 - k)), 'reelscr', { frame: 'frameDark', shadow: k, over: (c) => reelUI(c, t) });
};

// ---------- the pitch ----------
const PITCH = [[['We scale businesses', WHT, 's1'], ['with ads like this.', GREY, 's2']],
  [['DM us the word', WHT, 'd1'], ['teardown', null, 'd2'], ['for a free ad review.', GREY, 'd3']]];
function pitchLines(x, t, lines, Y0) {
  setF(x, '600 130px Logo', -4); const fs = 130 * Math.min(1, 830 / Math.max(...lines.map(([str]) => x.measureText(str).width)));
  lines.forEach(([str, col, k], i) => {
    const Y = Y0 + i * fs * 1.2, k2 = (t - K[k] + 0.04) / 0.38, f = '600 ' + fs + 'px Logo';
    if (!col && k2 > 0) { setF(x, f, -fs * 0.03); const w = x.measureText(str).width + fs * 0.5; x.fillStyle = WHT; x.fillRect(540 - w / 2, Y - fs * 0.84, w * expo(k2 / 0.6), fs * 1.1); }
    rise(x, str, 540, Y, f, col || INK, k2, -fs * 0.03);
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

// ---------- captions at the top: the phrase builds word by word (the Face ID reel's) ----------
function selBox(x, X0, Y0, w, h, k) {
  if (k <= 0) return; x.save(); x.globalAlpha *= k; x.strokeStyle = BLUE; x.lineWidth = 4; x.strokeRect(X0, Y0, w, h);
  [[X0, Y0], [X0 + w, Y0 + h]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 10, 0, TAU); x.fillStyle = WHT; x.fill(); x.lineWidth = 4; x.stroke(); });
  x.restore();
}
const CAPY = 250, CAPS = 76;
window.captions = (t) => {
  const c = CH.find((q) => t >= q.s && t < q.e); if (!c) return;
  const top = t >= T0.phone ? 1215 : CAPY;
  const fade = clamp((c.e - t) / 0.12) * clamp((t - c.s + 1 / FPS) / 0.06) * (t >= T0.phone && t < T0.pitch ? clamp((t - T0.phone - 0.32) / 0.15) : 1);
  g.save(); g.globalAlpha = fade * 0.55; const wq = g.createLinearGradient(0, top - 190, 0, top + 230); wq.addColorStop(0, 'rgba(0,0,0,0)'); wq.addColorStop(0.45, 'rgba(0,0,0,1)'); wq.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = wq; g.fillRect(0, top - 190, W, 420); g.restore();
  g.save(); g.textBaseline = 'alphabetic'; setF(g, '800 ' + CAPS + 'px Logo', -CAPS * 0.03);
  const sp = g.measureText(' ').width + 6;
  const said = c.rows.flat().filter((w) => w.s <= t + 1 / FPS), cur = said[said.length - 1];
  c.rows.forEach((row, ri) => {
    const ws = row.map((w) => g.measureText(w.w.replace(/'/g, '’')).width), tw = ws.reduce((a, b) => a + b, 0) + sp * (row.length - 1);
    let X0 = 540 - tw / 2; const Y = top + ri * CAPS * 1.18;
    row.forEach((w, i) => {
      const str = w.w.replace(/'/g, '’'), k = clamp((t + 1 / FPS - w.s) / 0.08);
      if (k > 0) {
        g.globalAlpha = fade * k;
        if (w.hl) { const bx = X0 - 12, by = Y - CAPS * 0.86, bw = ws[i] + 24, bh = CAPS * 1.12;
          g.save(); g.fillStyle = 'rgba(47,128,255,.18)'; g.fillRect(bx, by, bw * expo(k), bh); g.restore(); selBox(g, bx, by, bw, bh, clamp(k * 2) * fade); }
        g.shadowColor = 'rgba(0,0,0,.65)'; g.shadowBlur = 18; g.fillStyle = w === cur || w.hl ? WHT : 'rgba(255,255,255,.5)';
        g.save(); const sc = 1.12 - 0.12 * back(k); g.translate(X0 + ws[i] / 2, Y - CAPS * 0.3); g.scale(sc, sc); g.translate(-(X0 + ws[i] / 2), -(Y - CAPS * 0.3));
        g.textAlign = 'left'; g.fillText(str, X0, Y); g.restore(); g.shadowBlur = 0;
      }
      X0 += ws[i] + sp;
    });
  });
  g.restore();
};

// ---------- overlay: the clock under the tension ----------
window.overlay = (t) => {
  if (t < T0.tense || t >= T0.phone) return;
  const kc = (t - K.tense - 0.1) / 0.25;
  if (kc > 0) {
    g.save(); g.globalAlpha = clamp(kc); setF(g, '600 64px Body', 0); const str = '0:' + String(Math.floor(t)).padStart(2, '0'), tw = g.measureText(str).width;
    rrx(g, 540 - tw / 2 - 86, 1506, tw + 140, 108, 54); g.fillStyle = 'rgba(0,0,0,.72)'; g.fill();
    g.fillStyle = (t * 2) % 1 < 0.6 ? RED : 'rgba(255,59,48,.35)'; g.beginPath(); g.arc(540 - tw / 2 - 40, 1560, 15, 0, TAU); g.fill();
    g.fillStyle = WHT; g.textAlign = 'left'; g.fillText(str, 540 - tw / 2 - 8, 1582); g.restore();
  }
};
