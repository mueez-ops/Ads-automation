// Browser-side scene for reel_mosq.js. Runs as a module after three.js (imported as X), the 2D kit and the phone engine
// (reel_phone_kit.js), whose globals it uses: W, H, g, IMG, clamp, lerp, sstep, ease, expo, eio, back, bump, jolt, mkc,
// rrx, setF, pill, phone, P, stage, rise, zoomAt, vignette, INK, WHT, GREY... It fills S and replaces the kit's
// captions with the Face ID reel's: at the top, building word by word (the hook card is all on screen from frame 1).
// 1 unit = 1 cm. A corner shop at night (y = 0): the box above the door pulsing, three teenagers flinching, the
// shopkeeper sweeping on; the box alone in a dark studio (y = 1000); the cochlea, magnified (y = 2000); a classroom by
// day (y = 3000); a phone in a hand (y = 4000). Everything is our own illustration; the sound is shown, never played.

const BLUE = '#2F80FF', RED = '#FF3B30', GREEN = '#22B455', GOLD = '#E8B44A', PINK = '#FF3DA8', PINK2 = '#FF8AD0', SKY = '#3F8CFF';
const v3 = (a) => new X.Vector3(...a);
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const win = (t, a, b, fi = 0.25, fo = 0.25) => clamp((t - a) / Math.max(fi, 1e-4)) * (1 - clamp((t - b) / Math.max(fo, 1e-4)));
const tex = (c) => { const t = new X.CanvasTexture(c); t.colorSpace = X.SRGBColorSpace; t.anisotropy = 8; return t; };
const mixHex = (a, b, k) => { const A = new X.Color(a), B = new X.Color(b); return A.lerp(B, clamp(k)); };
const RN = (n) => { let h = Math.imul((n | 0) ^ 0x9E3779B9, 0x85EBCA6B); h ^= h >>> 13; h = Math.imul(h, 0xC2B2AE35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const noiseCanvas = (w, h, base, amp, n = 9000, seed = 1) => {
  const [c, x] = mkc(w, h); x.fillStyle = base; x.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) { const v = RN(seed * 100000 + i) < 0.5 ? 255 : 0; x.fillStyle = `rgba(${v},${v},${v},${amp * RN(seed * 100000 + i + 7)})`; x.fillRect(RN(seed * 100000 + i + 3) * w, RN(seed * 100000 + i + 5) * h, 2, 2); }
  return [c, x];
};

// ---------- renderer, an environment, lights ----------
const glc = document.getElementById('gl');
const R3 = new X.WebGLRenderer({ canvas: glc, antialias: true, alpha: true, preserveDrawingBuffer: true });
R3.setSize(W, H, false); R3.setClearColor(0x000000, 0);
R3.toneMapping = X.ACESFilmicToneMapping; R3.toneMappingExposure = 1.05; R3.outputColorSpace = X.SRGBColorSpace;
const scene = new X.Scene();
const cam = new X.PerspectiveCamera(40, W / H, 1, 6000);
{
  const env = new X.Scene();
  const [c, x] = mkc(256, 256), q = x.createLinearGradient(0, 0, 0, 256);
  q.addColorStop(0, '#8FA6C8'); q.addColorStop(0.5, '#2B3240'); q.addColorStop(1, '#0B0D10'); x.fillStyle = q; x.fillRect(0, 0, 256, 256);
  env.add(new X.Mesh(new X.SphereGeometry(50, 32, 16), new X.MeshBasicMaterial({ map: tex(c), side: X.BackSide })));
  const panel = (w, h, pos, col, v) => { const m = new X.Mesh(new X.PlaneGeometry(w, h), new X.MeshBasicMaterial({ color: new X.Color(col).multiplyScalar(v), side: X.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m); };
  panel(30, 10, [-6, 30, 14], '#FFF1DE', 4); panel(8, 26, [-34, 8, 10], '#FFD9A8', 2.0); panel(14, 8, [26, 12, -24], '#CFE2FF', 2.0);
  const pm = new X.PMREMGenerator(R3); scene.environment = pm.fromScene(env, 0.03).texture;
}
scene.environmentIntensity = 0.5;
const hemi = new X.HemisphereLight('#AFC8FF', '#141A26', 0.6); scene.add(hemi);
const key = new X.DirectionalLight('#FFF0D8', 2.0); key.position.set(-300, 600, 500); scene.add(key, key.target);
const rim = new X.DirectionalLight('#9FC8FF', 1.2); rim.position.set(400, 300, -400); scene.add(rim, rim.target);
const MAT = (c, o = {}) => new X.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.6, metalness: o.m ?? 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, map: o.map || null, envMapIntensity: o.env ?? 1, side: o.side ?? X.FrontSide, transparent: !!o.tr, opacity: o.op ?? 1, depthWrite: o.dw ?? true });
const glowTex = (() => { const [c, x] = mkc(128, 128); const q = x.createRadialGradient(64, 64, 0, 64, 64, 64); q.addColorStop(0, 'rgba(255,255,255,1)'); q.addColorStop(0.3, 'rgba(255,240,215,.7)'); q.addColorStop(1, 'rgba(255,200,140,0)'); x.fillStyle = q; x.fillRect(0, 0, 128, 128); return tex(c); })();
const glowMat = (c, op = 1) => { const m = new X.SpriteMaterial({ map: glowTex, color: c, transparent: true, opacity: op, blending: X.AdditiveBlending, depthWrite: false }); m.toneMapped = false; return m; };

// ---------- the sound: pink shells that grow out of the source and glow at their edges (a wavefront you can see) ----------
const shellGeo = new X.SphereGeometry(1, 64, 40);
const shellMat = (col) => new X.ShaderMaterial({
  uniforms: { uCol: { value: new X.Color(col) }, uOp: { value: 0 } },
  vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'uniform vec3 uCol; uniform float uOp; varying vec3 vN; varying vec3 vV; void main(){ float f = 1.0 - abs(dot(normalize(vN), normalize(vV))); float a = (pow(f, 3.0) * 0.95 + 0.05) * uOp; gl_FragColor = vec4(uCol * (0.7 + 1.6 * f), a); }',
  transparent: true, depthWrite: false, blending: X.AdditiveBlending, side: X.DoubleSide, toneMapped: false });
const ringMat = (col) => new X.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, blending: X.AdditiveBlending, depthWrite: false, side: X.DoubleSide, toneMapped: false });
function makeShells(parent, n, col = PINK) { return Array.from({ length: n }, () => { const m = new X.Mesh(shellGeo, shellMat(col)); m.renderOrder = 5; m.visible = false; parent.add(m); return m; }); }
function makeRipples(parent, n, col = PINK) { return Array.from({ length: n }, () => { const m = new X.Mesh(new X.RingGeometry(0.93, 1, 128), ringMat(col)); m.rotation.x = -Math.PI / 2; m.renderOrder = 4; m.visible = false; parent.add(m); return m; }); }
// the pulses that started before t, newest first: [age, u] with u in 0..1 over the shell's life
function liveP(t, life, every = 1, t0 = -1) { const out = []; for (let j = PULSES.length - 1; j >= 0; j--) { const a = t - PULSES[j]; if (a < 0 || PULSES[j] < t0) continue; if (a > life) break; if (j % every === 0) out.push([a, a / life]); } return out; }
function shells(list, t, org, on, R = 600, life = 1.25, op = 0.9, t0 = -1) {
  list.forEach((m) => { m.visible = false; }); if (!on) return;
  liveP(t, life, 1, t0).slice(0, list.length).forEach(([a, u], k) => { const m = list[k]; m.visible = true; m.position.set(...org); m.scale.setScalar(lerp(4, R, 1 - Math.pow(1 - u, 1.7))); m.material.uniforms.uOp.value = op * Math.pow(1 - u, 1.3) * clamp(a / 0.05); });
}
function ripples(list, t, org, on, R = 600, life = 1.25, op = 0.6) {
  list.forEach((m) => { m.visible = false; }); if (!on) return;
  liveP(t, life).slice(0, list.length).forEach(([a, u], k) => { const m = list[k]; m.visible = true; m.position.set(...org); m.scale.setScalar(lerp(4, R, 1 - Math.pow(1 - u, 1.7))); m.material.opacity = op * Math.pow(1 - u, 1.5) * clamp(a / 0.05); });
}
const lastPulse = (t) => { let p = -9; for (const q of PULSES) { if (q <= t) p = q; else break; } return t - p; };   // seconds since the last pulse

// ---------- people: a jointed figure in the toy style (capsules, a round head, dot eyes), posed by joint angles ----------
function makePerson(o) {
  const G = new X.Group(), J = { o };
  const skinM = MAT(o.skin, { r: 0.62, env: 0.6 }), topM = MAT(o.top, { r: 0.85 }), botM = MAT(o.bot, { r: 0.85 }), shoeM = MAT(o.shoe || '#2B2B30', { r: 0.5 }),
    hairM = MAT(o.hair || '#2A1D14', { r: 0.75 }), darkM = MAT('#121216', { r: 0.25, env: 1.2 });
  const root = new X.Group(); G.add(root); J.root = root;
  const hips = new X.Group(); hips.position.y = 92; root.add(hips); J.hips = hips;
  const pel = new X.Mesh(new X.CapsuleGeometry(12.5, 8, 6, 14), botM); pel.rotation.z = Math.PI / 2; pel.scale.set(1, 1, 0.78); hips.add(pel);
  const spine = new X.Group(); spine.position.y = 2; hips.add(spine); J.spine = spine;
  const tor = new X.Mesh(new X.CapsuleGeometry(15, 24, 8, 16), topM); tor.position.y = 24; tor.scale.set(1.1, 1, 0.68); spine.add(tor);
  if (o.apron) { const ap = new X.Mesh(new X.BoxGeometry(27, 50, 1.4), MAT(o.apron, { r: 0.8 })); ap.position.set(0, 14, 10.4); spine.add(ap); const pk = new X.Mesh(new X.BoxGeometry(14, 7, 0.6), MAT(o.apron, { r: 0.9 })); pk.position.set(0, 8, 11.2); spine.add(pk); }
  if (o.hood) { const hd = new X.Mesh(new X.TorusGeometry(8.6, 3.6, 10, 28), topM); hd.rotation.x = Math.PI / 2 + 0.25; hd.position.set(0, 47, -1.5); hd.scale.set(1.05, 1, 0.85); spine.add(hd);
    [1, -1].forEach((sd) => { const s0 = new X.Mesh(new X.CylinderGeometry(0.5, 0.5, 11, 6), MAT('#F2F2F2', { r: 0.7 })); s0.position.set(sd * 3, 37, 10.6); spine.add(s0); }); }
  if (o.collar) { const cl = new X.Mesh(new X.TorusGeometry(7.4, 2.2, 8, 24), MAT(o.collar, { r: 0.8 })); cl.rotation.x = Math.PI / 2; cl.position.set(0, 47, 0); spine.add(cl); }
  const neck = new X.Group(); neck.position.y = 47; spine.add(neck); J.neck = neck;
  const nk = new X.Mesh(new X.CylinderGeometry(5, 5.6, 11, 12), skinM); nk.position.y = 4; neck.add(nk);
  const head = new X.Group(); head.position.y = 9; neck.add(head); J.head = head;
  const sk = new X.Mesh(new X.SphereGeometry(11.5, 32, 24), skinM); sk.scale.set(0.93, 1.08, 1); sk.position.y = 11; head.add(sk);
  [1, -1].forEach((sd) => { const e = new X.Mesh(new X.SphereGeometry(3.2, 12, 10), skinM); e.scale.set(0.45, 1, 0.72); e.position.set(sd * 10.4, 11, -0.6); head.add(e); });
  J.eyes = [1, -1].map((sd) => { const e = new X.Mesh(new X.SphereGeometry(1.75, 14, 10), darkM); e.position.set(sd * 4.1, 12.6, 10.0); head.add(e); return e; });
  J.brows = [1, -1].map((sd) => { const b = new X.Mesh(new X.BoxGeometry(4.6, 1.1, 1.2), hairM); b.position.set(sd * 4.2, 16.4, 9.9); head.add(b); return b; });
  const ns = new X.Mesh(new X.SphereGeometry(1.7, 12, 10), skinM); ns.scale.set(1, 1, 1.25); ns.position.set(0, 10.2, 11.4); head.add(ns);
  J.mouth = new X.Mesh(new X.CapsuleGeometry(0.85, 3.6, 4, 8), MAT('#5A2A22', { r: 0.6 })); J.mouth.rotation.z = Math.PI / 2; J.mouth.position.set(0, 6.3, 10.3); head.add(J.mouth);
  const cap = (r, frac, col, sc = [0.97, 1.05, 1.03], rx = -0.3) => { const h0 = new X.Mesh(new X.SphereGeometry(r, 28, 18, 0, TAU, 0, Math.PI * frac), MAT(col, { r: 0.8 })); h0.scale.set(...sc); h0.position.y = 11.5; h0.rotation.x = rx; head.add(h0); return h0; };
  if (o.hairStyle === 'short' || o.hairStyle === 'bun' || o.hairStyle === 'curly') cap(12.2, 0.5, o.hair);
  if (o.hairStyle === 'bun') { const b = new X.Mesh(new X.SphereGeometry(5.2, 16, 12), hairM); b.position.set(0, 22, -8); head.add(b); }
  if (o.hairStyle === 'curly') for (let i = 0; i < 9; i++) { const b = new X.Mesh(new X.SphereGeometry(4.2, 12, 10), hairM); const a = Math.PI * 0.62 + (i / 8) * Math.PI * 1.76; b.position.set(9.5 * Math.cos(a) * 0.9, 20 + 2.5 * Math.sin(i * 2.1), 9.5 * Math.sin(a) * 0.9 - 2); head.add(b); }
  if (o.hairStyle === 'beanie') { cap(12.6, 0.42, o.hair, [0.98, 1.08, 1.04], -0.15); const cf = new X.Mesh(new X.TorusGeometry(11.8, 1.7, 8, 32), MAT(o.hair, { r: 0.9 })); cf.rotation.x = Math.PI / 2 - 0.15; cf.position.set(0, 17.5, -0.6); head.add(cf); }
  if (o.hairStyle === 'bald') { [1, -1].forEach((sd) => { const b = new X.Mesh(new X.SphereGeometry(5.5, 14, 10), hairM); b.scale.set(0.6, 0.9, 1.2); b.position.set(sd * 9.6, 14, -3); head.add(b); }); const bk = new X.Mesh(new X.SphereGeometry(7, 14, 10), hairM); bk.scale.set(1.3, 0.7, 0.6); bk.position.set(0, 13, -9.5); head.add(bk);
    const ms = new X.Mesh(new X.CapsuleGeometry(1.4, 5.5, 4, 8), hairM); ms.rotation.z = Math.PI / 2; ms.position.set(0, 8.3, 11.0); head.add(ms); }
  if (o.glasses) [1, -1].forEach((sd) => { const gl = new X.Mesh(new X.TorusGeometry(2.9, 0.38, 8, 24), MAT('#2A2A2E', { r: 0.3, m: 0.6 })); gl.position.set(sd * 4.1, 12.6, 10.9); head.add(gl); });
  ['l', 'r'].forEach((s, i) => { const sd = i ? -1 : 1;
    const sh = new X.Group(); sh.position.set(sd * 19.5, 42, 0); spine.add(sh);
    const up = new X.Mesh(new X.CapsuleGeometry(5.2, 22, 6, 12), topM); up.position.y = -12; sh.add(up);
    const el = new X.Group(); el.position.y = -25; sh.add(el);
    const fo = new X.Mesh(new X.CapsuleGeometry(4.6, 19, 6, 12), o.short ? skinM : topM); fo.position.y = -10.5; el.add(fo);
    const hand = new X.Group(); hand.position.y = -23; el.add(hand);
    const hm = new X.Mesh(new X.SphereGeometry(4.8, 14, 10), skinM); hm.scale.set(0.85, 1.15, 0.7); hm.position.y = -2; hand.add(hm);
    J[s + 'Sh'] = sh; J[s + 'El'] = el; J[s + 'Hand'] = hand; });
  ['l', 'r'].forEach((s, i) => { const sd = i ? -1 : 1;
    const hp = new X.Group(); hp.position.set(sd * 8.2, -3, 0); hips.add(hp);
    const th = new X.Mesh(new X.CapsuleGeometry(7.3, 32, 6, 12), botM); th.position.y = -20; hp.add(th);
    const kn = new X.Group(); kn.position.y = -42; hp.add(kn);
    const sn = new X.Mesh(new X.CapsuleGeometry(6, 32, 6, 12), botM); sn.position.y = -20; kn.add(sn);
    const ft = new X.Mesh(new X.BoxGeometry(10.5, 7, 25), shoeM); ft.position.set(0, -43.5, 5); kn.add(ft);
    J[s + 'Hip'] = hp; J[s + 'Knee'] = kn; });
  G.scale.setScalar(o.h || 1);
  G.userData = J; return G;
}
// poses: Euler angles per joint (radians); y lowers the whole figure; face: squint 0..1, brow -1 (calm)..1 (pain), grin 0..1, grimace 0..1
const JOINTS = ['hips', 'spine', 'neck', 'head', 'lSh', 'rSh', 'lEl', 'rEl', 'lHip', 'rHip', 'lKnee', 'rKnee'];
const STAND = { hips: [0, 0, 0], spine: [0, 0, 0], neck: [0, 0, 0], head: [0, 0, 0], lSh: [0, 0, 0.1], rSh: [0, 0, -0.1], lEl: [-0.18, 0, 0], rEl: [-0.18, 0, 0], lHip: [0, 0, 0.03], rHip: [0, 0, -0.03], lKnee: [0, 0, 0], rKnee: [0, 0, 0], y: 0, face: { squint: 0, brow: -0.2, grin: 0.15, grimace: 0 } };
const FLINCH = { ...STAND, spine: [0.3, 0, 0], neck: [0.16, 0, 0], head: [0.14, 0, 0], lSh: [0.18, 0, 2.38], rSh: [0.18, 0, -2.38], lEl: [0, 0, 1.98], rEl: [0, 0, -1.98], lHip: [-0.2, 0, 0.06], rHip: [-0.14, 0, -0.06], lKnee: [0.36, 0, 0], rKnee: [0.3, 0, 0], y: -5, face: { squint: 1, brow: 1, grin: 0, grimace: 1 } };
const SIT = { ...STAND, lHip: [-1.5, 0, 0.06], rHip: [-1.5, 0, -0.06], lKnee: [1.5, 0, 0], rKnee: [1.5, 0, 0], lSh: [-0.72, 0, 0.14], rSh: [-0.72, 0, -0.14], lEl: [-1.0, 0, 0], rEl: [-1.0, 0, 0], spine: [0.12, 0, 0], y: -46 };
const WRITE = { ...STAND, rSh: [-2.45, 0, -0.18], rEl: [-0.3, 0, 0], lSh: [-0.35, 0, 0.12], lEl: [-1.45, 0, 0], head: [-0.12, 0, 0], neck: [-0.05, 0, 0], face: { squint: 0, brow: -0.4, grin: 0.25, grimace: 0 } };
const SWEEP = { ...STAND, spine: [0.32, 0, 0], neck: [-0.15, 0, 0], lSh: [-0.95, 0, 0.2], rSh: [-0.55, 0, -0.12], lEl: [-0.55, 0, 0], rEl: [-0.9, 0, 0], lKnee: [0.12, 0, 0], rKnee: [0.12, 0, 0], y: -1.5, face: { squint: 0, brow: -0.5, grin: 0.45, grimace: 0 } };
const PHONE = { ...STAND, rSh: [-0.55, 0, -0.18], rEl: [-1.55, 0, 0.0], head: [0.3, 0, 0], neck: [0.12, 0, 0], face: { squint: 0, brow: 0.2, grin: 0.7, grimace: 0 } };
function mixPose(A, B, k) { const out = { y: lerp(A.y || 0, B.y || 0, k), face: {} }; JOINTS.forEach((j) => { out[j] = lerp3(A[j] || [0, 0, 0], B[j] || [0, 0, 0], k); });
  ['squint', 'brow', 'grin', 'grimace'].forEach((f) => { out.face[f] = lerp((A.face || {})[f] || 0, (B.face || {})[f] || 0, k); }); return out; }
function addPose(A, d) { const out = { ...A, face: { ...A.face } }; Object.keys(d).forEach((j) => { if (j === 'y') out.y = (out.y || 0) + d.y; else if (j === 'face') Object.assign(out.face, d.face); else out[j] = (A[j] || [0, 0, 0]).map((v, i) => v + d[j][i]); }); return out; }
function setPose(p, Q) {
  const J = p.userData; JOINTS.forEach((j) => J[j].rotation.set(...Q[j])); J.root.position.y = Q.y || 0;
  const f = Q.face || {}; J.eyes.forEach((e) => e.scale.set(1, lerp(1, 0.16, f.squint || 0), 1));
  J.brows.forEach((b, i) => { const sd = i ? -1 : 1; b.rotation.z = sd * 0.42 * (f.brow || 0); b.position.y = 16.4 - 0.9 * Math.max(0, f.brow || 0) + 0.6 * Math.max(0, -(f.brow || 0)); });
  const gm = f.grimace || 0, gr = f.grin || 0; J.mouth.scale.set(1 + 0.8 * gm, 1 + 0.5 * gm + 0.3 * gr, 1); J.mouth.rotation.set(0, 0, Math.PI / 2 + 0.0); J.mouth.position.y = 6.3 + 0.4 * gr;
}
function walkPose(base, t, sp = 9, amp = 1) {   // a walk cycle on top of a pose (the figure faces +z)
  const ph = t * sp, s0 = Math.sin(ph), c0 = Math.cos(ph);
  return addPose(base, { lHip: [-0.55 * amp * s0, 0, 0], rHip: [0.55 * amp * s0, 0, 0], lKnee: [0.8 * amp * Math.max(0, c0), 0, 0], rKnee: [0.8 * amp * Math.max(0, -c0), 0, 0],
    lSh: [0.45 * amp * s0, 0, 0], rSh: [-0.45 * amp * s0, 0, 0], y: -2.5 * amp * Math.abs(c0), spine: [0.08 * amp, 0, 0] });
}

// ---------- the box: grey plastic, a round speaker grille, a small LED, a wall bracket ----------
const grilleTex = (() => { const [c, x] = mkc(256, 256); x.fillStyle = '#3A3E44'; x.fillRect(0, 0, 256, 256); x.fillStyle = '#121418'; for (let r = 0; r < 9; r++) for (let q = 0; q < 9; q++) { const cx = 28 + q * 25 + (r % 2) * 12, cy = 28 + r * 25; if (Math.hypot(cx - 128, cy - 128) < 112) { x.beginPath(); x.arc(cx, cy, 7, 0, TAU); x.fill(); } } return tex(c); })();
function makeBox() {
  const G = new X.Group(), body = MAT('#C9CED4', { r: 0.42, env: 1.1 }), dark = MAT('#2E3136', { r: 0.5 });
  const sh = new X.Shape(); const w = 24, h = 14, r0 = 2.2; sh.moveTo(-w / 2 + r0, -h / 2); sh.lineTo(w / 2 - r0, -h / 2); sh.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r0); sh.lineTo(w / 2, h / 2 - r0); sh.quadraticCurveTo(w / 2, h / 2, w / 2 - r0, h / 2); sh.lineTo(-w / 2 + r0, h / 2); sh.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r0); sh.lineTo(-w / 2, -h / 2 + r0); sh.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r0, -h / 2);
  const bx = new X.Mesh(new X.ExtrudeGeometry(sh, { depth: 8, bevelEnabled: true, bevelThickness: 1, bevelSize: 0.8, bevelSegments: 3 }), body); bx.position.z = -4; G.add(bx);
  const gr = new X.Mesh(new X.CircleGeometry(5.2, 40), MAT('#FFFFFF', { map: grilleTex, r: 0.7 })); gr.position.set(-4.5, 0, 5.05); G.add(gr);
  const rimR = new X.Mesh(new X.TorusGeometry(5.3, 0.45, 10, 40), dark); rimR.position.set(-4.5, 0, 5.0); G.add(rimR);
  G.userData.led = new X.Mesh(new X.SphereGeometry(0.55, 12, 10), new X.MeshStandardMaterial({ color: '#FF2D6A', emissive: '#FF2D6A', emissiveIntensity: 2, toneMapped: false })); G.userData.led.position.set(7.5, 3.4, 5.1); G.add(G.userData.led);
  [-1, 1].forEach((sd) => { const sl = new X.Mesh(new X.BoxGeometry(5.5, 0.7, 0.4), dark); sl.position.set(6.5, sd * 1.2 - 1.6, 5.1); G.add(sl); });
  const br = new X.Mesh(new X.BoxGeometry(30, 3, 6), dark); br.position.set(0, 0, -6.5); G.add(br);
  G.userData.mouth = [-4.5, 0, 6];
  return G;
}

// ---------- the corner shop at night (y = 0; the shop front is the plane z = -100) ----------
const STREET = new X.Group(); scene.add(STREET);
const brickTex = (() => { const [c, x] = mkc(512, 512); x.fillStyle = '#3B2A24'; x.fillRect(0, 0, 512, 512);
  for (let r = 0; r < 16; r++) for (let q = 0; q < 9; q++) { const bw = 60, bh = 28, x0 = q * bw - (r % 2) * 30, y0 = r * 32; x.fillStyle = `rgb(${110 + 40 * RN(r * 31 + q)},${58 + 18 * RN(r * 31 + q + 7)},${46 + 12 * RN(r * 31 + q + 9)})`; x.fillRect(x0 + 2, y0 + 2, bw - 4, bh - 2); }
  const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; return t0; })();
const paveTex = (() => { const [c, x] = noiseCanvas(512, 512, '#5A5E66', 0.1, 14000, 21); x.strokeStyle = 'rgba(30,32,36,.8)'; x.lineWidth = 3; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 128, 0); x.lineTo(i * 128, 512); x.stroke(); x.beginPath(); x.moveTo(0, i * 128); x.lineTo(512, i * 128); x.stroke(); } const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; t0.repeat.set(16, 6); return t0; })();
const shopTex = (() => { const [c, x] = mkc(1024, 512); const q = x.createLinearGradient(0, 0, 0, 512); q.addColorStop(0, '#FFE7B8'); q.addColorStop(1, '#FFC98A'); x.fillStyle = q; x.fillRect(0, 0, 1024, 512);
  for (let s = 0; s < 4; s++) { const y0 = 90 + s * 110; x.fillStyle = '#8A6A4A'; x.fillRect(0, y0 + 70, 1024, 10); for (let i = 0; i < 40; i++) { const w0 = 14 + 16 * RN(s * 100 + i), h0 = 30 + 36 * RN(s * 100 + i + 1); x.fillStyle = ['#E0463A', '#2E7DD7', '#F2B633', '#3BAA5C', '#F2F2F2', '#8E44AD'][i % 6]; x.fillRect(12 + i * 25, y0 + 70 - h0, w0, h0); } }
  const t0 = tex(c); return t0; })();
const signTex = (() => { const [c, x] = mkc(1024, 128); x.fillStyle = '#14325C'; x.fillRect(0, 0, 1024, 128); setF(x, '800 82px Logo', 6); x.fillStyle = '#FFFFFF'; x.textAlign = 'center'; x.fillText('CORNER SHOP', 512, 96); return tex(c); })();
const openTex = (() => { const [c, x] = mkc(256, 96); x.clearRect(0, 0, 256, 96); setF(x, '800 64px Logo', 4); x.shadowColor = '#FF5AA8'; x.shadowBlur = 18; x.fillStyle = '#FFD2EA'; x.textAlign = 'center'; x.fillText('OPEN', 128, 72); return tex(c); })();
let BOX, SHELLS, RIPS, KEEPER, BROOM, TEENS = [], LAMP;
{
  const S0 = STREET;
  const pave = new X.Mesh(new X.PlaneGeometry(2400, 640), MAT('#FFFFFF', { map: paveTex, r: 0.9 })); pave.rotation.x = -Math.PI / 2; pave.position.set(0, 0, 220); S0.add(pave);
  const kerb = new X.Mesh(new X.BoxGeometry(2400, 14, 24), MAT('#7A7E86', { r: 0.8 })); kerb.position.set(0, 7 - 7, 540); S0.add(kerb);
  const road = new X.Mesh(new X.PlaneGeometry(2400, 1400), MAT('#1C1E22', { r: 0.95 })); road.rotation.x = -Math.PI / 2; road.position.set(0, -12, 1250); S0.add(road);
  for (let i = -6; i < 7; i++) { const d = new X.Mesh(new X.PlaneGeometry(120, 10), MAT('#D8D8D0', { r: 0.8 })); d.rotation.x = -Math.PI / 2; d.position.set(i * 260, -11.5, 1000); S0.add(d); }
  const wall = new X.Mesh(new X.PlaneGeometry(1400, 900), MAT('#FFFFFF', { map: brickTex, r: 0.9 })); brickTex.repeat.set(5, 3.2); wall.position.set(0, 450, -101); S0.add(wall);
  const frame = MAT('#1C2026', { r: 0.5, m: 0.3 });
  const front = new X.Mesh(new X.BoxGeometry(700, 330, 6), frame); front.position.set(-15, 165, -100); S0.add(front);
  const winM = new X.MeshStandardMaterial({ map: shopTex, emissive: '#FFFFFF', emissiveMap: shopTex, emissiveIntensity: 1.15, roughness: 0.2 });
  [[-200, 145, 260, 190], [195, 145, 210, 190]].forEach(([x0, y0, w0, h0]) => { const wm = new X.Mesh(new X.PlaneGeometry(w0, h0), winM); wm.position.set(x0, y0, -96.5); S0.add(wm);
    const gl = new X.Mesh(new X.PlaneGeometry(w0, h0), new X.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.12 })); gl.position.set(x0, y0, -96); S0.add(gl); });
  const door = new X.Mesh(new X.PlaneGeometry(100, 215), new X.MeshStandardMaterial({ color: '#2A3440', emissive: '#FFD9A0', emissiveIntensity: 0.25, roughness: 0.15, metalness: 0.6 })); door.position.set(10, 108, -96.6); S0.add(door);
  const handle = new X.Mesh(new X.CylinderGeometry(1.2, 1.2, 40, 10), MAT('#C8CCD2', { m: 1, r: 0.25 })); handle.position.set(48, 105, -93); S0.add(handle);
  const sign = new X.Mesh(new X.PlaneGeometry(690, 62), new X.MeshStandardMaterial({ map: signTex, emissive: '#FFFFFF', emissiveMap: signTex, emissiveIntensity: 0.55, roughness: 0.4 })); sign.position.set(-15, 292, -96.5); S0.add(sign);
  const open = new X.Mesh(new X.PlaneGeometry(64, 24), new X.MeshBasicMaterial({ map: openTex, transparent: true, toneMapped: false })); open.position.set(-200, 210, -95.5); S0.add(open);
  // upstairs: two windows, one lit
  [[-260, 470, true], [160, 470, false]].forEach(([x0, y0, lit]) => { const w0 = new X.Mesh(new X.PlaneGeometry(130, 150), new X.MeshStandardMaterial({ color: lit ? '#2A2012' : '#0E1218', emissive: lit ? '#FFB860' : '#000000', emissiveIntensity: lit ? 0.55 : 0, roughness: 0.2 })); w0.position.set(x0, y0, -100.5); S0.add(w0);
    const sill = new X.Mesh(new X.BoxGeometry(150, 8, 12), MAT('#CFC9BE', { r: 0.8 })); sill.position.set(x0, y0 - 80, -96); S0.add(sill); });
  // the neighbours: darker fronts either side
  [[-1000, '#20252E'], [980, '#252019']].forEach(([x0, col]) => { const b = new X.Mesh(new X.BoxGeometry(600, 900, 40), MAT(col, { r: 0.9 })); b.position.set(x0, 450, -120); S0.add(b); });
  // a street lamp
  LAMP = new X.Group(); LAMP.position.set(-470, 0, 470); S0.add(LAMP);
  const pole = new X.Mesh(new X.CylinderGeometry(4, 6, 560, 12), MAT('#2A2E34', { m: 0.6, r: 0.4 })); pole.position.y = 280; LAMP.add(pole);
  const arm = new X.Mesh(new X.CylinderGeometry(2.5, 2.5, 90, 8), MAT('#2A2E34', { m: 0.6, r: 0.4 })); arm.rotation.z = Math.PI / 2; arm.position.set(40, 555, 0); LAMP.add(arm);
  const bulb = new X.Mesh(new X.SphereGeometry(12, 16, 12), new X.MeshBasicMaterial({ color: '#FFE0A8', toneMapped: false })); bulb.position.set(84, 545, 0); LAMP.add(bulb);
  const lg = new X.Sprite(glowMat('#FFC878', 0.9)); lg.scale.setScalar(260); lg.position.set(84, 545, 0); LAMP.add(lg);
  // the box, above the door, right of centre
  BOX = makeBox(); BOX.position.set(92, 238, -93); STREET.add(BOX);
  SHELLS = makeShells(STREET, 4); RIPS = makeRipples(STREET, 4);
  // the shopkeeper, sweeping by the door; three teenagers by the window
  KEEPER = makePerson({ skin: '#E2B08E', top: '#F0EDE6', bot: '#3C4150', apron: '#2F6B4F', hair: '#BFC3C8', hairStyle: 'bald', shoe: '#3A2A20', h: 1.0 });
  KEEPER.position.set(125, 0, 70); KEEPER.rotation.y = -0.25; STREET.add(KEEPER);
  BROOM = new X.Group(); { const st = new X.Mesh(new X.CylinderGeometry(1.3, 1.3, 125, 10), MAT('#B48A5A', { r: 0.6 })); st.position.y = -62; BROOM.add(st); const hd = new X.Mesh(new X.BoxGeometry(34, 6, 9), MAT('#3A3A40', { r: 0.7 })); hd.position.y = -126; BROOM.add(hd); const br0 = new X.Mesh(new X.BoxGeometry(32, 10, 7), MAT('#C8A35A', { r: 0.95 })); br0.position.y = -133; BROOM.add(br0); }
  KEEPER.userData.rHand.add(BROOM); BROOM.rotation.set(0.15, 0, 0.1);
  [[{ skin: '#C68E6A', top: '#FF7A1A', bot: '#2C3A56', hair: '#1E1612', hairStyle: 'short', hood: true, shoe: '#F2F2F2', h: 0.94 }, [-55, 0, 235], 0.12],
   [{ skin: '#F1C7A8', top: '#2FB5A8', bot: '#26282E', hair: '#6A3E22', hairStyle: 'curly', hood: true, shoe: '#E04A3A', h: 0.92 }, [45, 0, 200], -0.35],
   [{ skin: '#8D5A3B', top: '#7A4FD8', bot: '#1F2430', hair: '#E8E6E0', hairStyle: 'beanie', hood: true, shoe: '#F2F2F2', h: 0.96 }, [-160, 0, 165], 0.45]].forEach(([o, pos, ry], i) => {
    const p = makePerson(o); p.position.set(...pos); p.rotation.y = ry; STREET.add(p); p.userData.home = { pos, ry }; TEENS.push(p); });
}
const BOXW = () => BOX.localToWorld(v3(BOX.userData.mouth)).toArray();
const PINKL = new X.PointLight(PINK, 0, 900, 1.1); scene.add(PINKL);
const LAMPL = new X.PointLight('#FFC27A', 0, 2200, 1.0); scene.add(LAMPL);
const SHOPL = new X.PointLight('#FFD39A', 0, 900, 1.0); scene.add(SHOPL);

// ---------- the box alone, in a dark studio (y = 1000), and its whine as a wave ----------
const STUDIO = new X.Group(); STUDIO.position.set(0, 1000, 0); STUDIO.visible = false; scene.add(STUDIO);
const HBOX = makeBox(); STUDIO.add(HBOX);
const BSHELLS = makeShells(STUDIO, 4);
let WAVE;
{
  const ped = new X.Mesh(new X.CylinderGeometry(22, 24, 6, 48), MAT('#1C1F24', { r: 0.35, m: 0.2 })); ped.position.y = -13; STUDIO.add(ped);
  const fl = new X.Mesh(new X.CircleGeometry(400, 64), MAT('#0C0E12', { r: 0.5 })); fl.rotation.x = -Math.PI / 2; fl.position.y = -16; STUDIO.add(fl);
  const pts = []; for (let i = 0; i <= 1200; i++) { const x0 = i * 0.3; pts.push(v3([x0, 1.7 * Math.sin(x0 * TAU / 2.4), 0])); }
  WAVE = new X.Mesh(new X.TubeGeometry(new X.CatmullRomCurve3(pts), 2400, 0.24, 6, false), new X.MeshBasicMaterial({ color: PINK, toneMapped: false, transparent: true, opacity: 1 }));
  WAVE.position.set(1.5, 0, 6.5); STUDIO.add(WAVE);
}
const SKEY = new X.DirectionalLight('#FFFFFF', 0); SKEY.position.set(-60, 1080, 90); SKEY.target.position.set(0, 1000, 0); scene.add(SKEY, SKEY.target);
const SRIM = new X.DirectionalLight(PINK, 0); SRIM.position.set(80, 1030, -60); SRIM.target.position.set(0, 1000, 0); scene.add(SRIM, SRIM.target);

// ---------- the cochlea, magnified (y = 2000): a snail shell of a tube, its hair cells coloured by pitch ----------
const COCH = new X.Group(); COCH.position.set(0, 2000, 0); COCH.visible = false; scene.add(COCH);
const TURNS = 2.6, spiral = (u) => { const a = u * TURNS * TAU, r = lerp(40, 11, Math.pow(u, 0.9)); return [r * Math.cos(a), lerp(-12, 26, u), r * Math.sin(a)]; };
let CELLS, NCELL = 150;
const cellU = (i) => i / (NCELL - 1);
const pitchCol = (u) => u < 0.5 ? mixHex(PINK, '#FFD84A', u / 0.5) : mixHex('#FFD84A', SKY, (u - 0.5) / 0.5);
{
  class Spiral extends X.Curve { getPoint(u, tg = new X.Vector3()) { return tg.set(...spiral(u)); } }
  const SEG = 360, RS = 16, cv = new Spiral(), g0 = new X.TubeGeometry(cv, SEG, 1, RS, false), pos = g0.attributes.position;
  for (let i = 0; i <= SEG; i++) { const u = i / SEG, ctr = cv.getPointAt(u), k = lerp(9.5, 4.2, u); for (let j = 0; j <= RS; j++) { const id = i * (RS + 1) + j; const p0 = v3([pos.getX(id), pos.getY(id), pos.getZ(id)]).sub(ctr).multiplyScalar(k).add(ctr); pos.setXYZ(id, p0.x, p0.y, p0.z); } }
  g0.computeVertexNormals();
  const shellM = new X.MeshPhysicalMaterial({ color: '#F4C6B8', roughness: 0.3, metalness: 0, transparent: true, opacity: 0.42, side: X.DoubleSide, depthWrite: false, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  const tube = new X.Mesh(g0, shellM); tube.renderOrder = 2; COCH.add(tube); COCH.userData.shell = shellM;
  const core = new X.Mesh(new X.CylinderGeometry(6, 10, 44, 24), MAT('#E9D3C4', { r: 0.5 })); core.position.y = 6; COCH.add(core);
  CELLS = new X.InstancedMesh(new X.CylinderGeometry(0.7, 0.7, 7, 8), new X.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false }), NCELL);
  CELLS.instanceColor = new X.InstancedBufferAttribute(new Float32Array(NCELL * 3), 3);
  for (let i = 0; i < NCELL; i++) CELLS.setColorAt(i, pitchCol(cellU(i)));
  CELLS.renderOrder = 3; COCH.add(CELLS);
}
const cellM = new X.Matrix4(), cellQ = new X.Quaternion(), cellS = new X.Vector3(), cellP = new X.Vector3(), UPV = new X.Vector3(0, 1, 0);
function setCells(t, aged) {   // aged 0..1: the high-pitch end (the base) wears out first, from the very end inwards
  for (let i = 0; i < NCELL; i++) {
    const u = cellU(i), p0 = spiral(u), r0 = Math.hypot(p0[0], p0[2]), inward = v3([-p0[0] / r0, 0, -p0[2] / r0]), k = lerp(9.5, 4.2, u) * 0.55;
    const dead = clamp((aged * 0.34 - u) / 0.06) * (u < 0.34 ? 1 : 0), sway = 0.18 * Math.sin(t * 4 + i * 0.7) * (1 - dead);
    cellP.set(p0[0] + inward.x * k, p0[1] + 2.2 * (1 - dead), p0[2] + inward.z * k);
    cellQ.setFromAxisAngle(v3([inward.z, 0, -inward.x]).normalize(), sway + dead * 1.35);
    cellS.set(1, Math.max(0.12, 1 - 0.85 * dead), 1); cellM.compose(cellP, cellQ, cellS); CELLS.setMatrixAt(i, cellM);
    CELLS.setColorAt(i, dead > 0 ? pitchCol(u).lerp(new X.Color('#55585E'), dead) : pitchCol(u));
  }
  CELLS.instanceMatrix.needsUpdate = true; CELLS.instanceColor.needsUpdate = true;
}
const CKEY = new X.DirectionalLight('#FFF4EC', 0); CKEY.position.set(-60, 2120, 100); CKEY.target.position.set(0, 2000, 0); scene.add(CKEY, CKEY.target);
const CRIM = new X.DirectionalLight('#FF9AD0', 0); CRIM.position.set(90, 2030, -80); CRIM.target.position.set(0, 2000, 0); scene.add(CRIM, CRIM.target);

// ---------- the classroom by day (y = 3000; the board on the wall z = -420) ----------
const CLASS = new X.Group(); CLASS.position.set(0, 3000, 0); CLASS.visible = false; scene.add(CLASS);
const woodTex = (() => { const [c, x] = noiseCanvas(512, 512, '#B98B5E', 0.06, 9000, 31); for (let i = 0; i < 16; i++) { x.fillStyle = `rgba(90,60,35,${0.18 + 0.1 * RN(i + 40)})`; x.fillRect(0, i * 32, 512, 2); } const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; t0.repeat.set(6, 6); return t0; })();
const boardTex = (() => { const [c, x] = noiseCanvas(1024, 400, '#1F4A36', 0.05, 8000, 33); x.strokeStyle = 'rgba(240,240,230,.85)'; x.fillStyle = 'rgba(240,240,230,.9)'; setF(x, '600 54px Body', 1); x.textAlign = 'left';
  x.fillText('Hearing: 20 Hz to 20,000 Hz', 60, 120); x.lineWidth = 4; x.beginPath(); for (let i = 0; i <= 400; i++) { const xx = 60 + i * 2, yy = 250 + 40 * Math.sin(i * 0.12) * Math.exp(-i / 500); i ? x.lineTo(xx, yy) : x.moveTo(xx, yy); } x.stroke(); return tex(c); })();
const phoneScr = mkc(360, 740), phoneTex = tex(phoneScr[0]);
let TEACH, STUD = [], DESKPHONE, DPSHELLS;
{
  const S0 = CLASS;
  const fl = new X.Mesh(new X.PlaneGeometry(1400, 1200), MAT('#FFFFFF', { map: woodTex, r: 0.7 })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0, 100); S0.add(fl);
  const wl = new X.Mesh(new X.PlaneGeometry(1400, 500), MAT('#EAE2D2', { r: 0.95 })); wl.position.set(0, 250, -420); S0.add(wl);
  const sw = new X.Mesh(new X.PlaneGeometry(1200, 500), MAT('#E2DACB', { r: 0.95 })); sw.rotation.y = Math.PI / 2; sw.position.set(-520, 250, 100); S0.add(sw);
  [[-150], [250]].forEach(([z0]) => { const w0 = new X.Mesh(new X.PlaneGeometry(220, 200), new X.MeshBasicMaterial({ color: '#CFE8FF', toneMapped: true })); w0.rotation.y = Math.PI / 2; w0.position.set(-518, 230, z0); S0.add(w0); });
  const bd = new X.Mesh(new X.PlaneGeometry(420, 165), MAT('#FFFFFF', { map: boardTex, r: 0.85 })); bd.position.set(40, 185, -418); S0.add(bd);
  const bf = new X.Mesh(new X.BoxGeometry(432, 176, 3), MAT('#7A5A3A', { r: 0.7 })); bf.position.set(40, 185, -420.5); S0.add(bf);
  const deskM = MAT('#D8C29A', { r: 0.6 }), legM = MAT('#4A4E56', { m: 0.6, r: 0.4 }), chairM = MAT('#2E6FB6', { r: 0.55 });
  const desk = (x0, z0) => { const G = new X.Group(); G.position.set(x0, 0, z0); const top = new X.Mesh(new X.BoxGeometry(100, 4, 55), deskM); top.position.y = 74; G.add(top); [[-46, -24], [46, -24], [-46, 24], [46, 24]].forEach(([a, b]) => { const l = new X.Mesh(new X.CylinderGeometry(1.6, 1.6, 72, 8), legM); l.position.set(a, 36, b); G.add(l); });
    const ch = new X.Group(); ch.position.set(0, 0, 52); G.add(ch); const seat = new X.Mesh(new X.BoxGeometry(40, 3, 38), chairM); seat.position.y = 44; ch.add(seat); const bk = new X.Mesh(new X.BoxGeometry(40, 32, 3), chairM); bk.position.set(0, 66, 20); ch.add(bk); [[-17, -16], [17, -16], [-17, 16], [17, 16]].forEach(([a, b]) => { const l = new X.Mesh(new X.CylinderGeometry(1.3, 1.3, 44, 8), legM); l.position.set(a, 22, b); ch.add(l); });
    S0.add(G); return G; };
  const PEOPLE = [{ skin: '#F1C7A8', top: '#E8503A', bot: '#2C3A56', hair: '#3A2A1C', hairStyle: 'short' }, { skin: '#8D5A3B', top: '#2FB5A8', bot: '#26282E', hair: '#141010', hairStyle: 'curly' },
    { skin: '#E2B08E', top: '#F2B633', bot: '#3A3F4A', hair: '#B5642C', hairStyle: 'bun' }, { skin: '#C68E6A', top: '#7A4FD8', bot: '#1F2430', hair: '#1A1410', hairStyle: 'short' },
    { skin: '#F1C7A8', top: '#3BAA5C', bot: '#2C3A56', hair: '#D8B070', hairStyle: 'bun' }, { skin: '#B97B57', top: '#2E7DD7', bot: '#26282E', hair: '#1A1410', hairStyle: 'beanie' }];
  [[-190, -150], [0, -150], [190, -150], [-190, 40], [0, 40], [190, 40]].forEach(([x0, z0], i) => { desk(x0, z0); const p = makePerson({ ...PEOPLE[i], h: 0.9, short: i % 2 === 0 }); p.position.set(x0, 0, z0 + 44); p.rotation.y = Math.PI; S0.add(p); STUD.push(p); });
  TEACH = makePerson({ skin: '#E8B796', top: '#8A6B4E', bot: '#3A3F4A', hair: '#6A4A30', hairStyle: 'bun', glasses: true, collar: '#F2EFE8', shoe: '#2A2220', h: 1.0 });
  TEACH.position.set(-30, 0, -362); TEACH.rotation.y = Math.PI; S0.add(TEACH);
  DESKPHONE = new X.Group(); DESKPHONE.position.set(14, 76.6, -158); DESKPHONE.rotation.set(-Math.PI / 2, 0, 0.35); S0.add(DESKPHONE);
  const pb = new X.Mesh(new X.BoxGeometry(7.4, 15.2, 0.9), MAT('#1A1B1F', { r: 0.3, m: 0.4 })); DESKPHONE.add(pb);
  DESKPHONE.userData.scr = new X.Mesh(new X.PlaneGeometry(6.8, 14.4), new X.MeshBasicMaterial({ map: phoneTex, toneMapped: false })); DESKPHONE.userData.scr.position.z = 0.46; DESKPHONE.add(DESKPHONE.userData.scr);
  DPSHELLS = makeShells(CLASS, 4);
}
const SUNC = new X.DirectionalLight('#FFF6E8', 0); SUNC.position.set(-900, 3600, 300); SUNC.target.position.set(0, 3000, -100); scene.add(SUNC, SUNC.target);

// ---------- a phone in a teenager's hand (y = 4000), the ringtone being set ----------
const HAND = new X.Group(); HAND.position.set(0, 4000, 0); HAND.visible = false; scene.add(HAND);
let HPHONE, HSHELLS, THUMB;
{
  const skinM = MAT('#C68E6A', { r: 0.6, env: 0.6 }), sleeve = MAT('#FF7A1A', { r: 0.85 });
  HPHONE = new X.Group(); HAND.add(HPHONE);
  const sh = new X.Shape(), w = 7.4, h = 15.2, r0 = 1.1; sh.moveTo(-w / 2 + r0, -h / 2); sh.lineTo(w / 2 - r0, -h / 2); sh.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r0); sh.lineTo(w / 2, h / 2 - r0); sh.quadraticCurveTo(w / 2, h / 2, w / 2 - r0, h / 2); sh.lineTo(-w / 2 + r0, h / 2); sh.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r0); sh.lineTo(-w / 2, -h / 2 + r0); sh.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r0, -h / 2);
  const body = new X.Mesh(new X.ExtrudeGeometry(sh, { depth: 0.6, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.2, bevelSegments: 3 }), MAT('#2A2C31', { r: 0.25, m: 0.7 })); body.position.z = -0.5; HPHONE.add(body);
  const scr = new X.Mesh(new X.PlaneGeometry(6.9, 14.6), new X.MeshBasicMaterial({ map: phoneTex, toneMapped: false })); scr.position.z = 0.32; HPHONE.add(scr);
  const palm = new X.Mesh(new X.CapsuleGeometry(3.2, 4.5, 6, 12), skinM); palm.rotation.z = Math.PI / 2; palm.scale.set(1, 1.15, 0.75); palm.position.set(-0.5, -4.5, -2.2); HPHONE.add(palm);
  for (let i = 0; i < 4; i++) { const f0 = new X.Mesh(new X.CapsuleGeometry(0.75, 3.2, 4, 8), skinM); f0.rotation.z = 0.15; f0.position.set(4.3, -1.5 - i * 1.9, -0.6); HPHONE.add(f0); }
  THUMB = new X.Group(); THUMB.position.set(-4.2, -7.4, 0.7); HPHONE.add(THUMB);
  const th = new X.Mesh(new X.CapsuleGeometry(0.78, 3.0, 4, 8), skinM); th.position.y = 2.2; THUMB.add(th);
  const arm = new X.Mesh(new X.CapsuleGeometry(3.4, 18, 6, 12), sleeve); arm.rotation.set(1.2, 0, 0.5); arm.position.set(-4, -13, -7); HPHONE.add(arm);
  HSHELLS = makeShells(HAND, 4);
}
// the phone screen (shared by the desk phone and the hand phone): the ringtone list, then ringing
function drawPhone(t, mode) {
  const [c, x] = phoneScr; x.fillStyle = '#0C0D10'; x.fillRect(0, 0, 360, 740);
  if (mode === 'ring') {
    const p = clamp(lastPulse(t) / 0.42), q = x.createRadialGradient(180, 330, 10, 180, 330, 260); q.addColorStop(0, `rgba(255,61,168,${0.55 + 0.3 * (1 - p)})`); q.addColorStop(1, 'rgba(255,61,168,0)'); x.fillStyle = q; x.fillRect(0, 0, 360, 740);
    setF(x, '700 30px Body', 0); x.fillStyle = '#FFFFFF'; x.textAlign = 'center'; x.fillText('Incoming', 180, 170);
    setF(x, '800 56px Logo', -1); x.fillText('Message', 180, 236);
    x.strokeStyle = '#FFFFFF'; x.lineWidth = 6; for (let i = 0; i < 3; i++) { x.globalAlpha = 1 - ((p + i / 3) % 1); x.beginPath(); x.arc(180, 380, 40 + 90 * ((p + i / 3) % 1), 0, TAU); x.stroke(); } x.globalAlpha = 1;
    x.fillStyle = PINK; x.beginPath(); x.arc(180, 380, 40, 0, TAU); x.fill(); x.fillStyle = '#FFFFFF'; setF(x, '800 40px Logo', 0); x.fillText('♪', 180, 395);
  } else {
    setF(x, '700 34px Body', 0); x.fillStyle = '#FFFFFF'; x.textAlign = 'left'; x.fillText('‹  Ringtone', 24, 86);
    const items = ['Opening', 'Radar', 'Chimes', 'Mosquito', 'Reflection'], sel = t > K.made + 0.05;
    items.forEach((s0, i) => { const y0 = 160 + i * 96; x.fillStyle = i === 3 && sel ? 'rgba(255,61,168,.22)' : 'rgba(255,255,255,.06)'; rrx(x, 16, y0 - 54, 328, 80, 18); x.fill();
      setF(x, (i === 3 ? '700 ' : '500 ') + '32px Body', 0); x.fillStyle = i === 3 ? '#FFFFFF' : 'rgba(255,255,255,.75)'; x.textAlign = 'left'; x.fillText(s0, 40, y0);
      if (i === 3 && sel) { x.strokeStyle = PINK; x.lineWidth = 6; x.lineCap = 'round'; x.beginPath(); x.moveTo(290, y0 - 12); x.lineTo(304, y0 + 2); x.lineTo(328, y0 - 26); x.stroke(); } });
    if (sel) { setF(x, '500 24px Body', 0); x.fillStyle = PINK2; x.textAlign = 'left'; x.fillText('about 17 kHz', 40, 160 + 3 * 96 + 34); }
  }
  phoneTex.needsUpdate = true;
}

// ---------- the camera: a new set-up about every second ----------
scene.updateMatrixWorld(true);
const VIEW = {
  hook0: [[14, 118, 660], [20, 168, -60], 50], hook1: [[16, 120, 620], [22, 170, -60], 49],
  box0: [[62, 226, -20], [92, 238, -93], 36], box1: [[70, 230, -36], [92, 238, -93], 34],
  keeper0: [[180, 150, 340], [125, 138, 70], 38], keeper1: [[172, 150, 318], [125, 139, 70], 37],
  teens0: [[-70, 138, 480], [-95, 128, 205], 42], teens1: [[-76, 138, 455], [-95, 129, 205], 41],
  flee0: [[10, 165, 720], [0, 110, 190], 48], flee1: [[14, 170, 760], [0, 112, 190], 48],
  empty0: [[40, 170, 560], [30, 175, -80], 46], empty1: [[40, 172, 520], [30, 178, -80], 45],
  hero0: [[-45, 1018, 100], [0, 1000, 0], 34], hero1: [[45, 1014, 95], [0, 1000, 0], 33],
  label0: [[40, 1008, 70], [2, 1000, 0], 32], label1: [[32, 1006, 64], [2, 1000, 0], 31],
  door0: [[10, 470, 600], [0, 60, 110], 50], door1: [[10, 455, 570], [0, 60, 115], 50],
  wave0: [[-12, 1008, 80], [9, 1000, 0], 40], wave1: [[-6, 1007, 76], [14, 1000, 0], 40],
  coch0: [[120, 2095, 170], [0, 2005, 0], 40], coch1: [[100, 2088, 150], [0, 2005, 0], 40],
  base0: [[95, 2060, 120], [25, 1995, 10], 40], base1: [[88, 2056, 110], [25, 1995, 10], 39],
  calm0: [[60, 158, 320], [125, 136, 70], 36], calm1: [[70, 157, 304], [125, 137, 70], 35],
  phone0: [[-4, 4013, 34], [0, 4000, 0], 40], phone1: [[-3, 4010, 30], [0, 4000, 0], 40],
  class0: [[260, 3180, -330], [0, 3085, -120], 46], class1: [[245, 3176, -320], [0, 3085, -120], 45],
  teacher0: [[-128, 3166, -412], [-30, 3156, -360], 42], teacher1: [[-120, 3165, -413], [-30, 3157, -358], 41],
  smirk0: [[60, 3130, -300], [0, 3112, -110], 38], smirk1: [[52, 3128, -296], [0, 3112, -110], 37],
  split0: [[0, 0, 0], [0, 0, 0], 40], split1: [[0, 0, 0], [0, 0, 0], 40],
};
const SPLIT = { L: [[-35, 142, 400], [-55, 136, 235], 38], R: [[-128, 3166, -412], [-30, 3156, -360], 40] };
function cutAt(t) { let i = 0; while (i < CUTS.length - 1 && t >= CUTS[i + 1][0]) i++; return i; }
const shotName = (t) => CUTS[cutAt(t)][1].replace(/\d+$/, '');
function camAt(t) {
  if (DEBUGCAM) return [...DEBUGCAM[0], ...DEBUGCAM[1], DEBUGCAM[2]];
  const i = cutAt(t), [t0, a, b] = CUTS[i], t1 = i < CUTS.length - 1 ? CUTS[i + 1][0] : T0.feed;
  const u = clamp((t - t0) / Math.max(0.05, t1 - t0)), k = 0.6 * ease(u) + 0.4 * u, A = VIEW[a], B = VIEW[b];
  return [...lerp3(A[0], B[0], k), ...lerp3(A[1], B[1], k), lerp(A[2], B[2], k)];
}
const tmpV = new X.Vector3();
function project(p, c = cam) { tmpV.set(...p).project(c); return [(tmpV.x + 1) / 2 * W, (1 - tmpV.y) / 2 * H, tmpV.z < 1]; }
const wpos = (o, p = [0, 0, 0]) => o.localToWorld(v3(p)).toArray();

// ---------- the timeline of the world ----------
const STREETSHOTS = ['hook', 'box', 'keeper', 'teens', 'flee', 'empty', 'door', 'calm'];
function streetPeople(t, n) {
  // the teenagers: flinching from the first frame (a shudder as each pulse reaches them), then off; back at the door for "clear teens"
  const flee = n === 'flee' || n === 'empty' || (n === 'door' && t > K.clear - 0.15);
  TEENS.forEach((p, i) => { const h = p.userData.home, sh = liveP(t, 0.5).reduce((a, [ag]) => a + bump(ag, 0.18 + 0.04 * i, 0.22), 0);
    if (!flee) { p.visible = true; p.position.set(...h.pos); p.rotation.y = h.ry; setPose(p, addPose(FLINCH, { spine: [0.07 * sh, 0.05 * Math.sin(t * 5 + i), 0], lSh: [0.06 * sh, 0, 0.05 * sh], rSh: [0.06 * sh, 0, -0.05 * sh], head: [0.06 * sh, 0.14 * Math.sin(t * 7 + i), 0], y: -1.5 * sh })); return; }
    const t0 = n === 'door' ? K.clear - 0.15 : K.they - 0.06, u = Math.max(0, t - t0), dir = [i === 1 ? 1 : -1, 0, 0.35], dist = 260 * u * (n === 'empty' ? 1.8 : n === 'door' ? 0.3 : 1);
    p.visible = !(n === 'empty' && u > 0.4); p.position.set(h.pos[0] + dir[0] * dist, 0, h.pos[2] + dir[2] * dist); p.rotation.y = Math.atan2(dir[0], dir[2]);
    setPose(p, walkPose(addPose(STAND, { lSh: [0, 0, 1.9], rSh: [0, 0, -1.9], lEl: [0, 0, 1.6], rEl: [0, 0, -1.6], face: { squint: 0.8, brow: 0.8, grimace: 0.7 } }), t + i, 13, 1));
  });
  // the shopkeeper: sweeps on, as if nothing is happening; a little nod on "That's the point"
  const sw = Math.sin(t * 4.2); KEEPER.visible = true; KEEPER.position.set(125, 0, 70); KEEPER.rotation.y = -0.25 + 0.22 * sw;
  setPose(KEEPER, addPose(SWEEP, { spine: [0, 0.18 * sw, 0], lSh: [0.12 * sw, 0, 0], rSh: [-0.1 * sw, 0, 0], head: [0.12 * bump(t, K.point - 0.1, 0.35), -0.4, 0] }));
  BROOM.rotation.set(0.15 + 0.1 * sw, 0, 0.1);
}
function setWorld(t, only) {
  const n = only || shotName(t), onStreet = STREETSHOTS.includes(n) || only === 'streetL', onStudio = ['hero', 'label', 'wave'].includes(n), onCoch = n === 'coch' || n === 'base', onClass = ['class', 'teacher', 'smirk'].includes(n) || only === 'classR', onHand = n === 'phone';
  STREET.visible = onStreet; STUDIO.visible = onStudio; COCH.visible = onCoch; CLASS.visible = onClass; HAND.visible = onHand;
  const sincePulse = lastPulse(t), pk = Math.exp(-sincePulse * 7);
  // lights
  hemi.intensity = onStreet ? 0.32 : onClass ? 1.0 : 0.18; hemi.color.set(onClass ? '#FFF4E4' : '#9FB6FF'); hemi.groundColor.set(onClass ? '#6A5A48' : '#141A26');
  key.intensity = onStreet ? 0.55 : onClass ? 0 : 0; key.position.set(-300, 600, 500); key.target.position.set(0, 100, 0); key.color.set('#B8CCFF');
  rim.intensity = onStreet ? 1.0 : 0; rim.position.set(500, 400, -300); rim.target.position.set(0, 100, 0);
  PINKL.position.set(...BOXW()); PINKL.position.z += 30; PINKL.intensity = onStreet ? 1200 * (0.25 + pk) : 0;
  LAMPL.position.set(-386, 545, 470); LAMPL.intensity = onStreet ? 2600 : 0; SHOPL.position.set(-60, 140, -40); SHOPL.intensity = onStreet ? 1500 : 0;
  SKEY.intensity = onStudio ? 2.4 : 0; SRIM.intensity = onStudio ? 3.0 * (0.5 + 0.5 * pk) : 0; CKEY.intensity = onCoch ? 2.6 : 0; CRIM.intensity = onCoch ? 2.2 : 0; SUNC.intensity = onClass ? 2.6 : 0;
  scene.environmentIntensity = onClass ? 0.8 : onStreet ? 0.25 : 0.4;
  // the street
  if (onStreet) { streetPeople(t, only === 'streetL' ? 'hook' : n); BOX.userData.led.material.emissiveIntensity = 1 + 3 * pk; STREET.updateMatrixWorld(true);
    shells(SHELLS, t, BOXW(), true, n === 'box' ? 140 : 620, n === 'box' ? 0.8 : 1.25, n === 'box' ? 0.75 : 0.85); ripples(RIPS, t, [BOXW()[0], 1.2, -60], n !== 'box', 620, 1.25, 0.5); }
  // the studio: the box turns; the wave streams out of the grille
  if (onStudio) { HBOX.rotation.set(0.05, n === 'wave' ? -0.35 : lerp(-0.55, 0.45, clamp((t - K.mosqL) / 2.4)), 0); HBOX.userData.led.material.emissiveIntensity = 1 + 3 * pk; STUDIO.updateMatrixWorld(true);
    WAVE.visible = n === 'wave'; WAVE.position.x = -4.5 - ((t * 8) % 2.4); WAVE.material.opacity = clamp((t - K.shriekL) / 0.25);
    shells(BSHELLS, t, wpos(HBOX, HBOX.userData.mouth).map((v, i) => v - [0, 1000, 0][i]), n !== 'wave', 70, 1.0, 0.65); }
  // the ear: the hair cells at the high-pitch end wear out first
  if (onCoch) { COCH.userData.shell.opacity = n === 'base' ? 0.24 : 0.42; COCH.rotation.y = n === 'base' ? 0.55 : 0.35 + 0.15 * (t - K.ageL); setCells(t, clamp((t - K.lose) / 1.6)); }
  // the classroom: the phone lights up and rings, the teacher writes on
  if (onClass) { const ringing = t > K.ring - 0.05 || only === 'classR'; drawPhone(t, ringing ? 'ring' : 'list');
    setPose(TEACH, addPose(WRITE, { rSh: [0.05 * Math.sin(t * 9), 0, 0.06 * Math.sin(t * 6)], rEl: [0.08 * Math.sin(t * 7.3), 0, 0] }));
    CLASS.updateMatrixWorld(true); STUD.forEach((p, i) => { const look = i === 1 || i === 0 || i === 2 ? clamp((t - K.ring - 0.1 * i) / 0.25) : 0, grin = (n === 'smirk' || (n === 'class' && t > K.ring)) && (i < 3) ? 1 : 0;
      setPose(p, addPose(SIT, { head: [0.3 * look, (i === 0 ? -0.6 : i === 2 ? 0.6 : 0) * look, 0], face: { grin: 0.2 + 0.8 * grin, squint: 0.25 * grin, brow: grin ? 0.3 : -0.2 } })); });
    shells(DPSHELLS, t, wpos(DESKPHONE).map((v, i) => v - [0, 3000, 0][i]), ringing, 420, 1.2, 0.8, K.ring - 0.1); }
  // the hand: the ringtone list, the thumb taps Mosquito, and the phone sings
  if (onHand) { drawPhone(t, t > K.ringtone - 0.02 ? 'ring' : 'list'); HPHONE.rotation.set(-0.35, 0.2 + 0.05 * Math.sin(t * 1.3), 0.05); HPHONE.position.set(0, 0, 0);
    HAND.updateMatrixWorld(true); const reach = sstep((t - (K.made - 0.35)) / 0.3) * (1 - sstep((t - (K.made + 0.25)) / 0.35)), tip = [lerp(-3.2, -1.4, reach), lerp(-4.6, -1.7, reach)], dv = [tip[0] + 4.2, tip[1] + 7.4]; THUMB.rotation.set(0, 0, Math.atan2(-dv[0], dv[1])); THUMB.scale.set(1, Math.hypot(...dv) / 4.4, 1); THUMB.position.z = 0.7 + 0.35 * (1 - bump(t, K.made - 0.05, 0.25));
    shells(HSHELLS, t, wpos(HPHONE, [0, 0, 1]).map((v, i) => v - [0, 4000, 0][i]), t > K.ringtone - 0.02, 60, 0.9, 0.7, K.ringtone - 0.05); }
  if (!only) { const c0 = camAt(t); cam.position.set(c0[0], c0[1], c0[2]); cam.lookAt(c0[3], c0[4], c0[5]); cam.fov = c0[6]; cam.aspect = W / H; cam.near = onHand ? 0.5 : onStudio ? 1 : 2; cam.updateProjectionMatrix(); }
}

// ---------- 2D: backdrops ----------
const BOKEH = {};
function bokeh(key0, top, bot, cols, n) {
  if (!BOKEH[key0]) { const [c, x] = mkc(1080, 1920), q = x.createLinearGradient(0, 0, 0, 1920); q.addColorStop(0, top); q.addColorStop(1, bot); x.fillStyle = q; x.fillRect(0, 0, 1080, 1920);
    for (let i = 0; i < n; i++) { const r0 = 40 + 160 * RN(i + 4200), cx = 1080 * RN(i + 4201), cy = 1920 * RN(i + 4202), g0 = x.createRadialGradient(cx, cy, 0, cx, cy, r0); const cc = cols[i % cols.length]; g0.addColorStop(0, cc + 'AA'); g0.addColorStop(0.7, cc + '44'); g0.addColorStop(1, cc + '00'); x.fillStyle = g0; x.beginPath(); x.arc(cx, cy, r0, 0, TAU); x.fill(); }
    BOKEH[key0] = c; }
  return BOKEH[key0];
}
function backdrop(x, t, n) {
  if (['hero', 'label', 'wave'].includes(n)) { const r0 = x.createRadialGradient(540, 900, 60, 540, 960, 1250); r0.addColorStop(0, '#2A2F3A'); r0.addColorStop(1, '#06070A'); x.fillStyle = r0; x.fillRect(0, 0, W, H); return; }
  if (n === 'coch' || n === 'base') { const r0 = x.createRadialGradient(540, 860, 60, 540, 900, 1250); r0.addColorStop(0, '#3A1E30'); r0.addColorStop(1, '#08060A'); x.fillStyle = r0; x.fillRect(0, 0, W, H); return; }
  if (n === 'phone') { x.drawImage(bokeh('night', '#0A0E1C', '#1A1428', ['#FFC878', '#FF5AA8', '#7AA8FF', '#FFE0B0'], 34), 0, 0); return; }
  if (['class', 'teacher', 'smirk'].includes(n)) { x.fillStyle = '#EAE2D2'; x.fillRect(0, 0, W, H); return; }
  const q = x.createLinearGradient(0, 0, 0, H); q.addColorStop(0, '#060A18'); q.addColorStop(0.6, '#121A33'); q.addColorStop(1, '#1C2440'); x.fillStyle = q; x.fillRect(0, 0, W, H);
}

const pillHalf = (str, size) => { setF(g, '600 ' + size + 'px Body', -size * 0.02); return (g.measureText(str).width + size * 1.05) / 2; };
function label(x, p3, dx, dy, str, k, o = {}) {
  if (k <= 0) return; const [ax, ay, vis] = project(p3, o.cam || cam); if (!vis || ax < 0 || ax > W || ay < 0 || ay > H) return;   // nothing for things out of shot
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
  x.globalAlpha = a * 0.8; setF(x, '500 25px Body', 0); x.fillStyle = '#B4B4B9'; x.textAlign = 'center';
  const words = str.split(' '), lines = ['']; words.forEach((w) => { const tl = lines[lines.length - 1] ? lines[lines.length - 1] + ' ' + w : w; if (x.measureText(tl).width > 960 && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = tl; });
  lines.forEach((l, i) => x.fillText(l, 540, 1832 - (lines.length - 1 - i) * 32)); x.restore();
}
function flash(x, t, t0, a = 0.85, d = 0.2, col = '255,248,235') { const u = t - t0; if (u < -0.04 || u > d) return; x.fillStyle = `rgba(${col},` + (u < 0 ? (u + 0.04) / 0.04 : 1 - u / d) * a + ')'; x.fillRect(0, 0, W, H); }
function hzPill(x, t) {                                // "17,000 hertz": a counter running up to it
  const k = ease((t - K.n17 + 0.05) / 0.25); if (k <= 0) return; const v = Math.round(17000 * ease(clamp((t - K.n17) / 0.7)) / 10) * 10;
  x.save(); x.globalAlpha = k; x.translate(540, 1400 + 40 * (1 - k)); rrx(x, -250, -76, 500, 152, 76); x.fillStyle = 'rgba(0,0,0,.55)'; x.fill(); x.lineWidth = 6; x.strokeStyle = PINK; x.stroke();
  setF(x, '800 76px Logo', -1); x.fillStyle = WHT; x.textAlign = 'center'; x.fillText(`≈${v.toLocaleString('en-GB')} Hz`, 0, 26); x.restore();
}

// ---------- the 3D shot ----------
const camL = new X.PerspectiveCamera(38, (W / 2) / H, 2, 6000), camR = new X.PerspectiveCamera(38, (W / 2) / H, 2, 6000);
function aimCam(c0, v, t, dr = 0) { c0.position.set(v[0][0] + dr, v[0][1], v[0][2]); c0.lookAt(...v[1]); c0.fov = v[2]; c0.updateProjectionMatrix(); }
function renderSplit(x, t) {
  // left: a teenager at the shop, flinching; right: the teacher, writing on. The same pulses in both.
  const u = clamp((t - K.sameL) / (T0.feed - K.sameL));
  R3.setScissorTest(true);
  setWorld(t, 'streetL'); aimCam(camL, SPLIT.L, t, -20 * u); R3.setViewport(0, 0, W / 2, H); R3.setScissor(0, 0, W / 2, H); R3.render(scene, camL);
  setWorld(t, 'classR'); aimCam(camR, SPLIT.R, t, 20 * u); R3.setViewport(W / 2, 0, W / 2, H); R3.setScissor(W / 2, 0, W / 2, H); R3.render(scene, camR);
  R3.setScissorTest(false); R3.setViewport(0, 0, W, H);
  x.drawImage(glc, 0, 0);
  x.fillStyle = '#FFFFFF'; x.fillRect(W / 2 - 3, 0, 6, H);
  // the same sound, drawn across both halves
  const wk = ease((t - K.sound + 0.1) / 0.3); if (wk > 0) { x.save(); x.globalAlpha = wk; x.strokeStyle = PINK; x.lineWidth = 7; x.shadowColor = PINK; x.shadowBlur = 24; x.beginPath();
    for (let i = 0; i <= 540; i++) { const xx = i * 2, yy = 1080 + 26 * Math.sin(i * 0.55 - t * 30); if (xx > W * wk) break; i ? x.lineTo(xx, yy) : x.moveTo(xx, yy); } x.stroke(); x.restore(); }
  const lk = (t - K.two + 0.05) / 0.3, rk = (t - K.audiences + 0.05) / 0.3;
  pill(x, 'hears it', W / 4, 1300, 44, false, lk, { f: 'Body', w: 700, bg: PINK, fg: WHT });
  pill(x, 'hears nothing', 3 * W / 4, 1300, 44, false, rk, { f: 'Body', w: 700, bg: '#8E8E93', fg: WHT });
}
function three(x, t, clean = false) {
  const n = shotName(t); backdrop(x, t, n);
  const shake = jolt(t, K.they, 8) + jolt(t, K.mosqL, 6) + jolt(t, K.ringtone, 5);
  x.save(); x.translate(shake, shake * 0.4);
  if (n === 'split') renderSplit(x, t); else { setWorld(t); R3.render(scene, cam); x.drawImage(glc, 0, 0); }
  const scr = x.createLinearGradient(0, 0, 0, 640), sa = ['class', 'teacher', 'smirk'].includes(n) ? 0.42 : 0.34;
  scr.addColorStop(0, `rgba(0,0,0,${sa})`); scr.addColorStop(0.55, `rgba(0,0,0,${sa * 0.5})`); scr.addColorStop(1, 'rgba(0,0,0,0)'); if (!clean) { x.fillStyle = scr; x.fillRect(-40, -40, W + 80, 680); }
  if (clean) { x.restore(); return; }
  if (n === 'box') label(x, wpos(BOX, [10, -7, 4]), 60, 300, 'this box', win(t, K.box - 0.08, K.teensL, 0.2, 0.08), { bg: PINK, fg: WHT });
  if (n === 'keeper') label(x, wpos(KEEPER.userData.head, [-10, 12, 0]), -150, 60, 'over 25', win(t, K.box + 0.1, K.teensL, 0.2, 0.08), { bg: WHT, fg: INK });
  if (n === 'teens') label(x, wpos(TEENS[0].userData.head, [-12, 14, 0]), -150, 90, 'under 25', win(t, K.can - 0.1, K.they, 0.2, 0.08), { bg: PINK, fg: WHT });
  if (n === 'hero') label(x, wpos(HBOX, [0, 8, 0]), 0, -250, 'the Mosquito', win(t, K.mosquito, K.built, 0.2, 0.08), { bg: PINK, fg: WHT });
  if (n === 'label') label(x, wpos(HBOX, [9, -6, 4]), 40, 300, 'made in Wales, 2005', win(t, K.built, K.to, 0.2, 0.08), { bg: WHT, fg: INK });
  if (n === 'coch') label(x, wpos(COCH, [0, 30, 0]), -40, -250, 'inside your ear', win(t, K.ears - 0.05, K.high, 0.2, 0.08), { bg: WHT, fg: INK });
  if (n === 'base') { label(x, wpos(COCH, spiral(0.06)), -60, 300, 'high notes go first', win(t, K.high - 0.05, K.adultsL, 0.2, 0.08), { bg: PINK, fg: WHT }); }
  if (n === 'calm') label(x, wpos(KEEPER.userData.head, [10, 12, 0]), 150, 60, 'hears nothing', win(t, K.nothing1 - 0.1, K.flipL, 0.2, 0.08), { bg: '#8E8E93', fg: WHT });
  if (n === 'teacher') label(x, wpos(TEACH.userData.head, [10, 10, 0]), 130, 170, 'hears nothing', win(t, K.teachers - 0.05, K.nothing2 + 0.2, 0.2, 0.08), { bg: '#8E8E93', fg: WHT });
  x.restore();
  if (n === 'wave') hzPill(x, t);
  flash(x, t, K.mosqL, 0.18, 0.12); flash(x, t, K.ringtone, 0.3, 0.14, '255,150,210');
  const FP = [[K.mosqL, K.ageL, 'The Mosquito went on sale in 2005, made by Compound Security of Merthyr Tydfil, Wales. Its tone is around 17 kHz, which most people over about 25 cannot hear (The New York Times, 2006).'],
    [K.ageL, K.flipL, 'High-pitched sounds are picked up by hair cells at the wide end of the cochlea, and those wear out first with age (NIDCD; StatPearls, “Presbycusis”).'],
    [K.flipL, T0.feed, 'Students put the tone on their phones as a ringtone most teachers couldn’t hear (NYT, 12 June 2006). Its inventor won the 2006 Ig Nobel Peace Prize for both. Scenes are illustrations.']];
  FP.forEach(([a, b, str]) => smallPrint(x, str, win(t, a + 0.15, b - 0.05, 0.3, 0.15)));
}
S.site = three;

// ---------- the switch: our reel in a phone; your ad is that box; Meta plays it to a crowd; your hook decides who hears it ----------
const PHN = { cy: 790, s: 0.62 };
let FRZ = null;
function frozen() { if (!FRZ) { const [c, x] = mkc(1080, 1920); three(x, T0.feed - 1 / FPS, true); FRZ = c; } return FRZ; }
function coffee(c, t, cx, cy, s0) {                     // the product: a bag of coffee and a steaming cup (yourbrand is a placeholder)
  c.save(); c.translate(cx, cy); c.scale(s0, s0);
  rrx(c, -120, -200, 240, 330, 26); const q = c.createLinearGradient(-120, 0, 120, 0); q.addColorStop(0, '#5B3A22'); q.addColorStop(1, '#7A4E2C'); c.fillStyle = q; c.fill();
  rrx(c, -90, -80, 180, 120, 14); c.fillStyle = '#F4E9D8'; c.fill(); setF(c, '800 34px Logo', -1); c.fillStyle = '#3A2414'; c.textAlign = 'center'; c.fillText('yourbrand', 0, -12); setF(c, '600 22px Body', 0); c.fillText('house roast', 0, 22);
  c.translate(170, 90); rrx(c, -60, -70, 120, 110, 18); c.fillStyle = '#FFFFFF'; c.fill(); c.lineWidth = 12; c.strokeStyle = '#FFFFFF'; c.beginPath(); c.arc(64, -20, 26, -1.2, 1.2); c.stroke();
  c.fillStyle = '#6B4226'; rrx(c, -50, -64, 100, 18, 8); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 6; c.lineCap = 'round'; for (let i = 0; i < 3; i++) { c.beginPath(); const x0 = -24 + 24 * i; for (let k = 0; k <= 20; k++) { const yy = -80 - k * 5, xx = x0 + 8 * Math.sin(k * 0.5 + t * 4 + i); k ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); }
  c.restore();
}
function heart(c, X0, Y, r) { c.beginPath(); c.moveTo(X0, Y + r * 0.9); c.bezierCurveTo(X0 - r * 1.6, Y - r * 0.1, X0 - r * 0.8, Y - r * 1.3, X0, Y - r * 0.45); c.bezierCurveTo(X0 + r * 0.8, Y - r * 1.3, X0 + r * 1.6, Y - r * 0.1, X0, Y + r * 0.9); c.fill(); }
function rail(c) {
  c.save(); c.fillStyle = WHT; c.strokeStyle = WHT; c.lineWidth = 6; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 10; heart(c, 544, 690, 32);
  c.beginPath(); c.arc(544, 806, 28, 0.35 * Math.PI, 2.25 * Math.PI); c.lineTo(522, 840); c.closePath(); c.stroke();
  c.beginPath(); c.moveTo(514, 902); c.lineTo(576, 880); c.lineTo(554, 942); c.lineTo(543, 914); c.closePath(); c.stroke(); c.restore();
}
function acct(c, name, sub, letter, col) {
  c.save(); c.textAlign = 'left'; c.beginPath(); c.arc(60, 1010, 31, 0, TAU); c.fillStyle = col; c.fill(); c.lineWidth = 3; c.strokeStyle = WHT; c.stroke();
  setF(c, '700 28px Logo', 0); c.fillStyle = WHT; c.textAlign = 'center'; c.fillText(letter, 60, 1020); c.textAlign = 'left';
  setF(c, '600 33px Body', 0); c.fillText(name, 106, sub ? 1004 : 1022); if (sub) { setF(c, '500 27px Body', 0); c.fillStyle = 'rgba(255,255,255,.85)'; c.fillText(sub, 106, 1040); } c.restore();
}
function theAd(c, t) {                                  // a coffee ad whose first line is its hook
  const q = c.createLinearGradient(0, 0, 0, 1280); q.addColorStop(0, '#F6E2C8'); q.addColorStop(1, '#E2B98E'); c.fillStyle = q; c.fillRect(0, 0, 600, 1280);
  setF(c, '800 60px Logo', -2); c.fillStyle = '#2A1A10'; c.textAlign = 'center'; c.fillText('Still drinking', 300, 210); c.fillText('stale coffee?', 300, 282);
  const hk = ease((t - K.hook + 0.05) / 0.25); if (hk > 0) { c.save(); c.globalAlpha = hk; c.strokeStyle = BLUE; c.lineWidth = 6; c.strokeRect(70, 140, 460, 166); [[70, 140], [530, 306]].forEach(([a, b]) => { c.beginPath(); c.arc(a, b, 12, 0, TAU); c.fillStyle = WHT; c.fill(); c.lineWidth = 5; c.stroke(); }); c.restore();
    pill(c, 'the hook', 300, 360, 34, false, hk, { f: 'Body', w: 700, bg: BLUE, fg: WHT }); }
  coffee(c, t, 260, 640, 1.05 + 0.03 * Math.sin(t * 2));
  const g0 = c.createLinearGradient(0, 760, 0, 1280); g0.addColorStop(0, 'rgba(0,0,0,0)'); g0.addColorStop(1, 'rgba(0,0,0,.55)'); c.fillStyle = g0; c.fillRect(0, 860, 600, 420);
  rail(c); acct(c, 'yourbrand', 'Sponsored', 'y', '#6B4226');
  setF(c, '500 26px Body', 0); c.fillStyle = 'rgba(255,255,255,.92)'; c.textAlign = 'left'; c.fillText('Roasted this week. ›', 30, 1090);
}
const swipe = (t) => eio((t - (K.ad + 0.15)) / 0.22);
function feedUI(c, t) {
  const fa = swipe(t);
  if (fa < 1) { c.save(); c.translate(0, -fa * 1280); c.drawImage(frozen(), -60, 0, 720, 1280); const q = c.createLinearGradient(0, 760, 0, 1280); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,.72)'); c.fillStyle = q; c.fillRect(0, 860, 600, 420); rail(c); acct(c, 'mezmedia_0', null, 'm.', '#111'); setF(c, '500 26px Body', 0); c.fillStyle = 'rgba(255,255,255,.9)'; c.textAlign = 'left'; c.fillText('Over 25? You can’t hear what…', 30, 1090); c.restore(); }
  if (fa > 0) { c.save(); c.translate(0, 1280 * (1 - fa)); theAd(c, t); c.restore(); }
}
function person2d(x, cx, cy, r, col) { x.fillStyle = col; x.beginPath(); x.arc(cx, cy - r * 0.25, r * 0.38, 0, TAU); x.fill(); x.beginPath(); x.ellipse(cx, cy + r * 0.62, r * 0.62, r * 0.42, 0, Math.PI, TAU); x.fill(); }
const CROWD = (() => { const out = []; for (let r = 0; r < 3; r++) for (let q = 0; q < 9 - (r % 2); q++) out.push({ x: 540 + (q - (8 - (r % 2)) / 2) * 112, y: 1090 + r * 108, i: out.length }); return out; })();
const HEARS = new Set([2, 6, 11, 14, 22]);
function crowd(x, t, p) {
  const k = ease((t - K.crowdL + 0.05) / 0.35); if (k <= 0) return;
  // the ad plays out over everyone: pink rings from the phone
  x.save(); x.globalAlpha = k;
  for (let i = 0; i < 3; i++) { const u = ((t - K.plays) * 0.75 + i / 3) % 1; if (t < K.plays) break; x.strokeStyle = `rgba(255,61,168,${0.6 * (1 - u)})`; x.lineWidth = 8 * (1 - u) + 2; x.beginPath(); x.arc(540, p.cy, 200 + 900 * u, 0, TAU); x.stroke(); }
  CROWD.forEach((m) => { const hk = HEARS.has(m.i) ? clamp((t - K.who - 0.1 * [...HEARS].indexOf(m.i)) / 0.18) : 0, dim = t > K.who ? (HEARS.has(m.i) ? 0 : 0.55 * clamp((t - K.who) / 0.4)) : 0;
    const y0 = m.y + 40 * (1 - k);
    x.save(); x.globalAlpha = k * (1 - dim); x.beginPath(); x.arc(m.x, y0, 46, 0, TAU); x.fillStyle = 'rgba(255,255,255,.1)'; x.fill(); x.clip(); person2d(x, m.x, y0 + 8, 60, hk > 0 ? mixHex('#8E8E93', PINK, hk).getStyle() : '#8E8E93'); x.restore();
    if (hk > 0) { x.beginPath(); x.arc(m.x, y0, 46 + 8 * bump(t, K.who + 0.1 * [...HEARS].indexOf(m.i), 0.3), 0, TAU); x.lineWidth = 6; x.strokeStyle = PINK; x.stroke(); } });
  const lk = ease((t - K.hears + 0.05) / 0.25); if (lk > 0) pill(x, 'your buyers stop', 540, 1420, 42, false, lk * 1.5, { f: 'Body', w: 700, bg: PINK, fg: WHT });
  x.restore();
}
S.feed = (x, t) => {
  stage(x, true);
  if (!IMG.feedscr) IMG.feedscr = mkc(1200, 2560)[0];
  const k = eio((t - T0.feed) / 0.6), zk = eio((t - K.crowdL) / 0.5), p = P(540, lerp(lerp(960, PHN.cy, k), 660, zk), PHN.s * Math.pow(1.8 / PHN.s, 1 - k) * lerp(1, 0.72, zk));
  phone(x, p, 'feedscr', { frame: 'frameDark', shadow: k, over: (c) => feedUI(c, t) });
  const ak = (t - K.thatBox + 0.05) / 0.3; if (t < K.crowdL + 0.2) pill(x, 'your ad = the box', 540, 1250, 46, false, ak * (1 - clamp((t - K.crowdL) / 0.2)), { f: 'Body', w: 700, bg: PINK, fg: WHT });
  crowd(x, t, p);
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

// ---------- captions at the top: the phrase builds word by word; the hook card is all there from frame 1 ----------
function selBox(x, X0, Y0, w, h, k) {
  if (k <= 0) return; x.save(); x.globalAlpha *= k; x.strokeStyle = BLUE; x.lineWidth = 4; x.strokeRect(X0, Y0, w, h);
  [[X0, Y0], [X0 + w, Y0 + h]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 10, 0, TAU); x.fillStyle = WHT; x.fill(); x.lineWidth = 4; x.stroke(); });
  x.restore();
}
const CAPY = 300, CAPS = 76;
window.captions = (t) => {
  const c = CH.find((q) => t >= q.s && t < q.e); if (!c) return;
  const top = CAPY, rowH = CAPS * 1.18;
  const fade = clamp((c.e - t) / 0.12) * (c.hook ? 1 : clamp((t - c.s + 1 / FPS) / 0.06)) * (t >= T0.feed && t < T0.pitch ? clamp((t - T0.feed - 0.32) / 0.15) : 1);
  g.save(); g.globalAlpha = fade * 0.55; const wq = g.createLinearGradient(0, top - 190, 0, top + rowH * c.rows.length + 160); wq.addColorStop(0, 'rgba(0,0,0,0)'); wq.addColorStop(0.45, 'rgba(0,0,0,1)'); wq.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = wq; g.fillRect(0, top - 190, W, rowH * c.rows.length + 350); g.restore();
  g.save(); g.textBaseline = 'alphabetic'; setF(g, '800 ' + CAPS + 'px Logo', -CAPS * 0.03);
  const sp = g.measureText(' ').width + 6;
  const said = c.rows.flat().filter((w) => w.s <= t + 1 / FPS), cur = said[said.length - 1];
  c.rows.forEach((row, ri) => {
    const ws = row.map((w) => g.measureText(w.w.replace(/'/g, '’')).width), tw = ws.reduce((a, b) => a + b, 0) + sp * (row.length - 1);
    let X0 = 540 - tw / 2; const Y = top + ri * rowH;
    row.forEach((w, i) => {
      const str = w.w.replace(/'/g, '’'), k = clamp((t + 1 / FPS - w.s) / 0.08), vis = c.hook ? Math.max(k, 0.42) : k;
      if (vis > 0) {
        g.globalAlpha = fade * vis;
        if (w.hl && k > 0) { const bx = X0 - 12, by = Y - CAPS * 0.86, bw = ws[i] + 24, bh = CAPS * 1.12;
          g.save(); g.fillStyle = 'rgba(255,61,168,.22)'; g.fillRect(bx, by, bw * expo(k), bh); g.restore(); selBox(g, bx, by, bw, bh, clamp(k * 2) * fade); }
        g.shadowColor = 'rgba(0,0,0,.65)'; g.shadowBlur = 18; g.fillStyle = (w === cur || (w.hl && k > 0)) ? WHT : 'rgba(255,255,255,' + (c.hook && k <= 0 ? 0.9 : 0.5) + ')';
        g.save(); const sc = c.hook && k <= 0 ? 1 : 1.12 - 0.12 * back(k); g.translate(X0 + ws[i] / 2, Y - CAPS * 0.3); g.scale(sc, sc); g.translate(-(X0 + ws[i] / 2), -(Y - CAPS * 0.3));
        g.textAlign = 'left'; g.fillText(str, X0, Y); g.restore(); g.shadowBlur = 0;
      }
      X0 += ws[i] + sp;
    });
  });
  g.restore();
};
window.overlay = null;
