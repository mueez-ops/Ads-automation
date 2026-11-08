// Browser-side scene for reel_door.js. Runs as a module after three.js (imported as X), the 2D kit and the phone engine
// (reel_phone_kit.js), whose globals it uses: W, H, g, IMG, clamp, lerp, sstep, ease, expo, eio, back, bump, jolt, mkc,
// rrx, setF, pill, phone, P, stage, rise, zoomAt, INK, WHT, GREY... It fills S and replaces the kit's captions with the
// Face ID reel's: at the top, building word by word (the hook card is all on screen from frame 1).
// 1 unit = 1 cm. A campus path on a sunny day (y = 0): the pedestrian (z = +45, facing -z) and the man with the map
// (z = -45, facing +z); a door carried along x between them, upright, by two men; behind it the man with the map takes
// the back of the door and the carrier stays in his place. A line-up wall for the two men (y = 1000). The story runs on
// its own clock (TAU, seconds into the meeting): the hook shows the swap, then the edit rewinds to the start.
// Everything is our own illustration.

const BLUE = '#2F80FF', GOLD = '#E8B44A', PINK = '#FF3DA8', CYAN = '#3FD0FF', GREEN = '#2FBF71';
const v3 = (a) => new X.Vector3(...a);
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const win = (t, a, b, fi = 0.25, fo = 0.25) => clamp((t - a) / Math.max(fi, 1e-4)) * (1 - clamp((t - b) / Math.max(fo, 1e-4)));
const tex = (c) => { const t = new X.CanvasTexture(c); t.colorSpace = X.SRGBColorSpace; t.anisotropy = 8; return t; };
const RN = (n) => { let h = Math.imul((n | 0) ^ 0x9E3779B9, 0x85EBCA6B); h ^= h >>> 13; h = Math.imul(h, 0xC2B2AE35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const noiseCanvas = (w, h, base, amp, n = 9000, seed = 1) => {
  const [c, x] = mkc(w, h); x.fillStyle = base; x.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) { const v = RN(seed * 100000 + i) < 0.5 ? 255 : 0; x.fillStyle = `rgba(${v},${v},${v},${amp * RN(seed * 100000 + i + 7)})`; x.fillRect(RN(seed * 100000 + i + 3) * w, RN(seed * 100000 + i + 5) * h, 2, 2); }
  return [c, x];
};
// story time: piecewise linear over the edit (STORYT from reel_door.js); a jump back in STORYT is the rewind
function tauAt(t) { let i = 0; while (i < STORYT.length - 1 && t >= STORYT[i + 1][0]) i++; const [a, va] = STORYT[i], nx = STORYT[i + 1];
  if (!nx || nx[1] < va) return va + (nx ? 0 : t - a); return lerp(va, nx[1], clamp((t - a) / Math.max(1e-3, nx[0] - a))); }

// ---------- renderer, an environment, lights ----------
const glc = document.getElementById('gl');
const R3 = new X.WebGLRenderer({ canvas: glc, antialias: true, alpha: true, preserveDrawingBuffer: true });
R3.setSize(W, H, false); R3.setClearColor(0x000000, 0);
R3.toneMapping = X.ACESFilmicToneMapping; R3.toneMappingExposure = 1.05; R3.outputColorSpace = X.SRGBColorSpace;
const scene = new X.Scene();
const cam = new X.PerspectiveCamera(40, W / H, 1, 8000);
{
  const env = new X.Scene();
  const [c, x] = mkc(256, 256), q = x.createLinearGradient(0, 0, 0, 256);
  q.addColorStop(0, '#BFD8F2'); q.addColorStop(0.5, '#8FA0A8'); q.addColorStop(1, '#3E4A30'); x.fillStyle = q; x.fillRect(0, 0, 256, 256);
  env.add(new X.Mesh(new X.SphereGeometry(50, 32, 16), new X.MeshBasicMaterial({ map: tex(c), side: X.BackSide })));
  const panel = (w, h, pos, col, v) => { const m = new X.Mesh(new X.PlaneGeometry(w, h), new X.MeshBasicMaterial({ color: new X.Color(col).multiplyScalar(v), side: X.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m); };
  panel(30, 10, [-6, 30, 14], '#FFF1DE', 4); panel(14, 8, [26, 12, -24], '#CFE2FF', 2.0);
  const pm = new X.PMREMGenerator(R3); scene.environment = pm.fromScene(env, 0.03).texture;
}
scene.environmentIntensity = 0.55;
const hemi = new X.HemisphereLight('#EAF2FF', '#6A7A4A', 1.0); scene.add(hemi);
const sun = new X.DirectionalLight('#FFF0D8', 2.6); sun.position.set(-500, 900, 600); scene.add(sun, sun.target);
const rim = new X.DirectionalLight('#BFD8FF', 0.8); rim.position.set(500, 300, -600); scene.add(rim, rim.target);
const MAT = (c, o = {}) => new X.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.6, metalness: o.m ?? 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, map: o.map || null, envMapIntensity: o.env ?? 1, side: o.side ?? X.FrontSide, transparent: !!o.tr, opacity: o.op ?? 1, depthWrite: o.dw ?? true });

// ---------- people: the Mosquito reel's jointed toy figure, with eyelids and a talking mouth ----------
// faces +z, +x is its left; hips at y 92, shoulders at (+-19.5, 42) on the spine, upper arm 25, forearm 23 + hand
function makePerson(o) {
  const G = new X.Group(), J = { o, mats: [] };
  const M2 = (c, opt) => { const m = MAT(c, opt); J.mats.push(m); return m; };
  const skinM = M2(o.skin, { r: 0.62, env: 0.6 }), topM = M2(o.top, { r: 0.85 }), botM = M2(o.bot, { r: 0.85 }), shoeM = M2(o.shoe || '#2B2B30', { r: 0.5 }),
    hairM = M2(o.hair || '#2A1D14', { r: 0.75 }), darkM = M2('#121216', { r: 0.25, env: 1.2 });
  const root = new X.Group(); G.add(root); J.root = root;
  const hips = new X.Group(); hips.position.y = 92; root.add(hips); J.hips = hips;
  const pel = new X.Mesh(new X.CapsuleGeometry(12.5, 8, 6, 14), botM); pel.rotation.z = Math.PI / 2; pel.scale.set(1, 1, 0.78); hips.add(pel);
  const spine = new X.Group(); spine.position.y = 2; hips.add(spine); J.spine = spine;
  const tor = new X.Mesh(new X.CapsuleGeometry(15, 24, 8, 16), topM); tor.position.y = 24; tor.scale.set(1.1, 1, 0.68); spine.add(tor);
  if (o.collar) { const cl = new X.Mesh(new X.TorusGeometry(7.4, 2.2, 8, 24), M2(o.collar, { r: 0.8 })); cl.rotation.x = Math.PI / 2; cl.position.set(0, 47, 0); spine.add(cl); }
  if (o.belt) { const bl = new X.Mesh(new X.TorusGeometry(15.5, 2, 8, 32), M2(o.belt, { r: 0.6 })); bl.rotation.x = Math.PI / 2; bl.scale.set(1.08, 0.7, 1); bl.position.set(0, 2, 0); spine.add(bl); }
  const neck = new X.Group(); neck.position.y = 47; spine.add(neck); J.neck = neck;
  const nk = new X.Mesh(new X.CylinderGeometry(5, 5.6, 11, 12), skinM); nk.position.y = 4; neck.add(nk);
  const head = new X.Group(); head.position.y = 9; neck.add(head); J.head = head;
  const sk = new X.Mesh(new X.SphereGeometry(11.5, 32, 24), skinM); sk.scale.set(0.93, 1.08, 1); sk.position.y = 11; head.add(sk);
  [1, -1].forEach((sd) => { const e = new X.Mesh(new X.SphereGeometry(3.2, 12, 10), skinM); e.scale.set(0.45, 1, 0.72); e.position.set(sd * 10.4, 11, -0.6); head.add(e); });
  J.eyes = [1, -1].map((sd) => { const e = new X.Mesh(new X.SphereGeometry(1.75, 14, 10), darkM); e.position.set(sd * 4.1, 12.6, 10.0); head.add(e); return e; });
  J.lids = [1, -1].map((sd) => { const l0 = new X.Mesh(new X.SphereGeometry(2.1, 16, 10, 0, TAU, 0, Math.PI / 2), skinM); l0.position.set(sd * 4.1, 12.6, 10.0); head.add(l0);
    const ln = new X.Mesh(new X.TorusGeometry(2.1, 0.28, 6, 20, Math.PI), darkM); ln.rotation.x = Math.PI / 2; l0.add(ln); return l0; });
  J.brows = [1, -1].map((sd) => { const b = new X.Mesh(new X.BoxGeometry(4.6, 1.1, 1.2), hairM); b.position.set(sd * 4.2, 16.4, 9.9); head.add(b); return b; });
  const ns = new X.Mesh(new X.SphereGeometry(1.7, 12, 10), skinM); ns.scale.set(1, 1, 1.25); ns.position.set(0, 10.2, 11.4); head.add(ns);
  J.mouth = new X.Mesh(new X.CapsuleGeometry(0.85, 3.6, 4, 8), M2('#5A2A22', { r: 0.6 })); J.mouth.rotation.z = Math.PI / 2; J.mouth.position.set(0, 6.3, 10.3); head.add(J.mouth);
  const cap = (r, frac, col, sc = [0.97, 1.05, 1.03], rx = -0.3) => { const h0 = new X.Mesh(new X.SphereGeometry(r, 28, 18, 0, TAU, 0, Math.PI * frac), M2(col, { r: 0.8 })); h0.scale.set(...sc); h0.position.y = 11.5; h0.rotation.x = rx; head.add(h0); return h0; };
  if (['short', 'bun', 'curly', 'swoop', 'long'].includes(o.hairStyle)) cap(12.2, 0.5, o.hair);
  if (o.hairStyle === 'bun') { const b = new X.Mesh(new X.SphereGeometry(5.2, 16, 12), hairM); b.position.set(0, 22, -8); head.add(b); }
  if (o.hairStyle === 'swoop') { const b = new X.Mesh(new X.SphereGeometry(6.5, 16, 12), hairM); b.scale.set(1.5, 0.6, 1); b.position.set(3, 21.5, 6); b.rotation.z = -0.3; head.add(b); }
  if (o.hairStyle === 'long') { const b = new X.Mesh(new X.CapsuleGeometry(10.5, 10, 6, 16), hairM); b.scale.set(1.05, 1, 0.55); b.position.set(0, 6, -6.5); head.add(b); }
  if (o.glasses) [1, -1].forEach((sd) => { const gl = new X.Mesh(new X.TorusGeometry(2.9, 0.38, 8, 24), M2('#2A2A2E', { r: 0.3, m: 0.6 })); gl.position.set(sd * 4.1, 12.6, 11.2); head.add(gl); });
  if (o.hardhat) { const hh = new X.Mesh(new X.SphereGeometry(12.8, 24, 14, 0, TAU, 0, Math.PI * 0.5), M2(o.hardhat, { r: 0.4 })); hh.position.y = 13; head.add(hh); const br = new X.Mesh(new X.CylinderGeometry(15, 15, 0.8, 24), M2(o.hardhat, { r: 0.4 })); br.position.y = 13; head.add(br); }
  ['l', 'r'].forEach((s, i) => { const sd = i ? -1 : 1;
    const sh = new X.Group(); sh.position.set(sd * 19.5, 42, 0); spine.add(sh);
    const up = new X.Mesh(new X.CapsuleGeometry(5.2, 22, 6, 12), topM); up.position.y = -12; sh.add(up);
    const el = new X.Group(); el.position.y = -25; sh.add(el);
    const fo = new X.Mesh(new X.CapsuleGeometry(4.6, 19, 6, 12), o.short ? skinM : topM); fo.position.y = -10.5; el.add(fo);
    const hand = new X.Group(); hand.position.y = -23; el.add(hand);
    const hm = new X.Mesh(new X.SphereGeometry(4.6, 14, 10), skinM); hm.scale.set(0.95, 1.05, 0.6); hm.position.y = -1.5; hand.add(hm);
    for (let f = 0; f < 4; f++) { const fp = new X.Group(); fp.position.set((f - 1.5) * 2.05, -5.2, 0.4); fp.rotation.x = 0.5; hand.add(fp); const fm = new X.Mesh(new X.CapsuleGeometry(0.95, 3.6 - Math.abs(f - 1.5) * 0.5, 4, 8), skinM); fm.position.y = -2.3; fp.add(fm); }
    const tp = new X.Group(); tp.position.set(sd * 3.6, -2.0, 1.4); tp.rotation.set(0.4, 0, sd * 0.9); hand.add(tp); const tm = new X.Mesh(new X.CapsuleGeometry(1.0, 2.8, 4, 8), skinM); tm.position.y = -2; tp.add(tm);
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
const JOINTS = ['hips', 'spine', 'neck', 'head', 'lSh', 'rSh', 'lEl', 'rEl', 'lHip', 'rHip', 'lKnee', 'rKnee', 'lHand', 'rHand'];
const Z3 = [0, 0, 0];
// poses: Euler angles per joint; y lowers the figure; face: lid 0..1, brow -1 (calm)..1 (cross), grin, talk 0..1
const STAND = { hips: Z3, spine: Z3, neck: Z3, head: Z3, lSh: [0, 0, 0.1], rSh: [0, 0, -0.1], lEl: [-0.18, 0, 0], rEl: [-0.18, 0, 0], lHip: [0, 0, 0.03], rHip: [0, 0, -0.03], lKnee: Z3, rKnee: Z3, lHand: Z3, rHand: Z3, y: 0, face: { lid: 0.1, brow: -0.2, grin: 0.15, talk: 0 } };
const MAPHOLD = { ...STAND, lSh: [-0.75, 0, -0.3], rSh: [-0.75, 0, 0.3], lEl: [-0.95, 0, 0], rEl: [-0.95, 0, 0], lHand: [0, 0, 0.4], rHand: [0, 0, -0.4] };
const POINT = { ...STAND, rSh: [-1.35, 0, -0.75], rEl: [-0.12, 0, 0], lSh: [0, 0, 0.12], head: [0, -0.25, 0] };
const CARRY_B = { ...STAND, lSh: [-1.15, 0, 0.16], rSh: [-1.15, 0, -0.16], lEl: [-0.35, 0, 0], rEl: [-0.35, 0, 0] };
const CARRY_F = { ...STAND, lSh: [0.55, 0, 0.22], rSh: [0.55, 0, -0.22], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0] };
function addPose(A, d) { const out = { ...A, face: { ...A.face } }; Object.keys(d).forEach((j) => { if (j === 'y') out.y = (out.y || 0) + d.y; else if (j === 'face') Object.assign(out.face, d.face); else out[j] = (A[j] || Z3).map((v, i) => v + d[j][i]); }); return out; }
function mixPose(A, B, k) { const out = { y: lerp(A.y || 0, B.y || 0, k), face: {} }; JOINTS.forEach((j) => { out[j] = lerp3(A[j] || Z3, B[j] || Z3, k); });
  ['lid', 'brow', 'grin', 'talk'].forEach((f) => { out.face[f] = lerp((A.face || {})[f] || 0, (B.face || {})[f] || 0, k); }); return out; }
function walkPose(base, t, sp = 9, amp = 1) {   // a walk cycle on top of a pose (the figure faces +z)
  const ph = t * sp, s0 = Math.sin(ph), c0 = Math.cos(ph);
  return addPose(base, { lHip: [-0.55 * amp * s0, 0, 0], rHip: [0.55 * amp * s0, 0, 0], lKnee: [0.8 * amp * Math.max(0, c0), 0, 0], rKnee: [0.8 * amp * Math.max(0, -c0), 0, 0], y: -2.5 * amp * Math.abs(c0), spine: [0.06 * amp, 0, 0] });
}
function armSwing(P0, t, sp = 9, amp = 1) { const s0 = Math.sin(t * sp); return addPose(P0, { lSh: [0.45 * amp * s0, 0, 0], rSh: [-0.45 * amp * s0, 0, 0] }); }
function setPose(p, Q, t = 0) {
  const J = p.userData; JOINTS.forEach((j) => J[j].rotation.set(...(Q[j] || Z3))); J.root.position.y = Q.y || 0;
  const f = Q.face || {}, lid = clamp(f.lid || 0), br = f.brow || 0, talk = clamp(f.talk || 0);
  J.lids.forEach((l0) => { l0.visible = lid > 0.02; l0.rotation.x = lerp(-1.6, 1.5, lid); });
  J.brows.forEach((b, i) => { const sd = i ? -1 : 1; b.rotation.z = sd * 0.42 * br; b.position.y = 16.4 - 0.9 * Math.max(0, br) + 0.6 * Math.max(0, -br); });
  const gr = f.grin || 0, op = talk * (0.5 + 0.5 * Math.abs(Math.sin(t * 13) * Math.sin(t * 7.3 + 1)));
  J.mouth.scale.set(1 + 0.1 * gr + 1.6 * op, 1 + 0.3 * gr - 0.2 * op, 1); J.mouth.position.y = 6.3 + 0.4 * gr - 0.5 * op;
}
const blinkShape = (u) => (u < 0 || u > 0.24) ? 0 : u < 0.07 ? ease(u / 0.07) : u < 0.1 ? 1 : 1 - ease((u - 0.1) / 0.14);
const natBlink = (t, seed) => blinkShape(((t + seed * 3.7) % 3.3) - 3.0);

// ---------- the campus (y = 0): a paved path along x, grass, a brick building, trees, a lamp, a bench ----------
const CAMPUS = new X.Group(); scene.add(CAMPUS);
let PED, ASK1, ASK2, CARF, DOOR, MAP1, MAP2;
const mapTex = (() => { const [c, x] = mkc(256, 184); x.fillStyle = '#F4EFDF'; x.fillRect(0, 0, 256, 184); x.strokeStyle = '#C9C0A4'; x.lineWidth = 2; for (let i = 0; i < 256; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 184); x.stroke(); } for (let j = 0; j < 184; j += 32) { x.beginPath(); x.moveTo(0, j); x.lineTo(256, j); x.stroke(); }
  x.fillStyle = '#9CC98A'; x.fillRect(20, 20, 70, 50); x.fillRect(150, 110, 80, 50); x.fillStyle = '#C98A6A'; [[110, 30, 40, 30], [30, 110, 50, 40], [180, 30, 50, 40]].forEach(([a, b, w, h]) => x.fillRect(a, b, w, h));
  x.strokeStyle = '#E8B44A'; x.lineWidth = 6; x.beginPath(); x.moveTo(0, 92); x.lineTo(256, 92); x.moveTo(128, 0); x.lineTo(128, 184); x.stroke(); x.fillStyle = '#FF3DA8'; x.beginPath(); x.arc(200, 60, 7, 0, TAU); x.fill(); return tex(c); })();
function makeMap() { const m = new X.Mesh(new X.PlaneGeometry(40, 29), new X.MeshStandardMaterial({ map: mapTex, roughness: 0.9, side: X.DoubleSide })); return m; }
{
  const S0 = CAMPUS;
  const grT = (() => { const [c] = noiseCanvas(512, 512, '#6E9A4A', 0.12, 30000, 61); const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; t0.repeat.set(14, 14); return t0; })();
  const gr = new X.Mesh(new X.PlaneGeometry(4000, 4000), MAT('#FFFFFF', { map: grT, r: 0.95 })); gr.rotation.x = -Math.PI / 2; S0.add(gr);
  const paT = (() => { const [c, x] = noiseCanvas(512, 256, '#C9C4BA', 0.08, 12000, 67); x.strokeStyle = 'rgba(90,85,78,.35)'; x.lineWidth = 3; for (let i = 0; i < 512; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.stroke(); } x.beginPath(); x.moveTo(0, 128); x.lineTo(512, 128); x.stroke(); const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; t0.repeat.set(10, 1); return t0; })();
  const pa = new X.Mesh(new X.PlaneGeometry(4000, 300), MAT('#FFFFFF', { map: paT, r: 0.85 })); pa.rotation.x = -Math.PI / 2; pa.position.set(0, 0.4, 0); S0.add(pa);
  const brT = (() => { const [c, x] = mkc(512, 512); x.fillStyle = '#9A4A36'; x.fillRect(0, 0, 512, 512); for (let r = 0; r < 512; r += 16) for (let q = 0; q < 512; q += 40) { x.fillStyle = `rgb(${130 + 30 * RN(r * 7 + q)},${60 + 15 * RN(r + q * 3)},${46 + 10 * RN(q + r)})`; x.fillRect(q + ((r / 16) % 2) * 20, r + 1, 37, 13); } const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; t0.repeat.set(8, 4); return t0; })();
  const bld = new X.Mesh(new X.BoxGeometry(1600, 700, 200), MAT('#FFFFFF', { map: brT, r: 0.9 })); bld.position.set(0, 350, -800); S0.add(bld);
  const winM = MAT('#2E3A4A', { r: 0.15, env: 1.4 }), frM = MAT('#EDE6D8', { r: 0.6 });
  for (let r = 0; r < 3; r++) for (let q = 0; q < 10; q++) { const w0 = new X.Mesh(new X.BoxGeometry(70, 110, 6), frM); w0.position.set(-700 + q * 155, 140 + r * 190, -698); S0.add(w0); const w1 = new X.Mesh(new X.BoxGeometry(58, 96, 4), winM); w1.position.set(-700 + q * 155, 140 + r * 190, -694); S0.add(w1); }
  const roof = new X.Mesh(new X.BoxGeometry(1660, 30, 240), frM); roof.position.set(0, 715, -800); S0.add(roof);
  const tree = (x0, z0, s0) => { const tr = new X.Mesh(new X.CylinderGeometry(9 * s0, 13 * s0, 240 * s0, 10), MAT('#5A4030', { r: 0.9 })); tr.position.set(x0, 120 * s0, z0); S0.add(tr);
    for (let i = 0; i < 6; i++) { const lf = new X.Mesh(new X.SphereGeometry(75 * s0, 16, 12), MAT(['#4E8A3A', '#5E9A44', '#3E7A34'][i % 3], { r: 0.9 })); lf.position.set(x0 + 60 * s0 * Math.cos(i * 1.1), (270 + 50 * RN(i + x0)) * s0, z0 + 60 * s0 * Math.sin(i * 1.1)); S0.add(lf); } };
  tree(-520, -330, 1.0); tree(560, -360, 1.1); tree(-900, 280, 1.2); tree(900, 300, 1.0); tree(-1300, -500, 1.3); tree(1300, -450, 1.2);
  const lamp = new X.Group(); lamp.position.set(260, 0, -190); S0.add(lamp); const lp = new X.Mesh(new X.CylinderGeometry(4, 5, 380, 10), MAT('#2A2D33', { m: 0.6 })); lp.position.y = 190; lamp.add(lp); const lh = new X.Mesh(new X.SphereGeometry(16, 16, 12), MAT('#F4F0E0', { e: '#FFF2C8', ei: 0.3 })); lh.position.y = 390; lamp.add(lh);
  const bench = new X.Group(); bench.position.set(-300, 0, -175); S0.add(bench); const bs = new X.Mesh(new X.BoxGeometry(160, 6, 45), MAT('#7A5A3A', { r: 0.8 })); bs.position.y = 45; bench.add(bs); const bb = new X.Mesh(new X.BoxGeometry(160, 40, 5), MAT('#7A5A3A', { r: 0.8 })); bb.position.set(0, 75, -22); bench.add(bb);
  [[-70, 0], [70, 0]].forEach(([a]) => { const l0 = new X.Mesh(new X.BoxGeometry(6, 45, 40), MAT('#2A2D33', { m: 0.5 })); l0.position.set(a, 22, 0); bench.add(l0); });
  // the people (ASK2 is about 5 cm taller than ASK1, in different clothes)
  PED = makePerson({ skin: '#E8B796', top: '#C0623A', bot: '#3A4458', hair: '#A8A8A8', hairStyle: 'bun', glasses: true, collar: '#E8E2D2', h: 0.95 }); S0.add(PED);
  ASK1 = makePerson({ skin: '#F1C7A8', top: '#2F6FB0', bot: '#C8B48A', hair: '#3A2A1C', hairStyle: 'short', shoe: '#5A3A2A', h: 0.98 }); S0.add(ASK1);
  ASK2 = makePerson({ skin: '#EBC3A0', top: '#3E7A4A', bot: '#2E3038', hair: '#8A6A44', hairStyle: 'swoop', shoe: '#E8E8EC', h: 1.01 }); S0.add(ASK2);
  CARF = makePerson({ skin: '#D9A27A', top: '#8E8E96', bot: '#2E3038', hair: '#16120E', hairStyle: 'short', h: 0.99 }); S0.add(CARF);
  // the door: wood, two panels, a knob, carried upright
  const dT = (() => { const [c, x] = mkc(256, 512); const q = x.createLinearGradient(0, 0, 256, 0); q.addColorStop(0, '#B07A48'); q.addColorStop(1, '#C48C56'); x.fillStyle = q; x.fillRect(0, 0, 256, 512);
    for (let i = 0; i < 70; i++) { x.strokeStyle = `rgba(90,55,30,${0.12 + 0.12 * RN(i + 90)})`; x.lineWidth = 1 + 2 * RN(i + 91); x.beginPath(); const x0 = RN(i + 92) * 256; x.moveTo(x0, 0); x.bezierCurveTo(x0 + 10, 170, x0 - 10, 340, x0 + 6, 512); x.stroke(); }
    x.strokeStyle = 'rgba(70,40,20,.55)'; x.lineWidth = 6; x.strokeRect(36, 40, 184, 190); x.strokeRect(36, 280, 184, 190); return tex(c); })();
  DOOR = new X.Group(); S0.add(DOOR);
  const slab = new X.Mesh(new X.BoxGeometry(90, 200, 5), [MAT('#9A6A40'), MAT('#9A6A40'), MAT('#9A6A40'), MAT('#9A6A40'), MAT('#FFFFFF', { map: dT, r: 0.6 }), MAT('#FFFFFF', { map: dT, r: 0.6 })]); slab.position.y = 112; DOOR.add(slab);
  [1, -1].forEach((sd) => { const kb = new X.Mesh(new X.SphereGeometry(2.8, 14, 10), MAT('#D8B45A', { m: 0.9, r: 0.25 })); kb.position.set(32, 108, sd * 4.5); DOOR.add(kb); });
  MAP1 = makeMap(); MAP2 = makeMap(); S0.add(MAP1, MAP2);
}
// ---------- the line-up (y = 1000): a height chart, the two men side by side ----------
const LINEUP = new X.Group(); LINEUP.position.set(0, 1000, 0); LINEUP.visible = false; scene.add(LINEUP);
let LU1, LU2;
{
  const [c, x] = mkc(512, 512); x.fillStyle = '#E8ECF0'; x.fillRect(0, 0, 512, 512); x.strokeStyle = '#3A4048'; x.fillStyle = '#3A4048'; setF(x, '700 18px Mono', 0); x.textAlign = 'left';
  for (let i = 0; i <= 25; i++) { const y = 512 - i * 20.48; x.lineWidth = i % 5 ? 1.5 : 3.5; x.beginPath(); x.moveTo(0, y); x.lineTo(i % 5 ? 60 : 512, y); x.stroke(); if (i % 5 === 0 && i) x.fillText((i * 10) + ' cm', 8, y - 6); }
  const wall = new X.Mesh(new X.PlaneGeometry(250, 250), MAT('#FFFFFF', { map: tex(c), r: 0.9 })); wall.position.set(0, 125, -30); LINEUP.add(wall);
  const fl = new X.Mesh(new X.PlaneGeometry(600, 400), MAT('#5A5E66', { r: 0.9 })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0, 100); LINEUP.add(fl);
  LU1 = makePerson(ASK1.userData.o); LU1.position.set(-38, 0, 0); LINEUP.add(LU1);
  LU2 = makePerson(ASK2.userData.o); LU2.position.set(38, 0, 0); LINEUP.add(LU2);
}

// ---------- the story: where everyone is at story time tau ----------
const doorX = (tau) => -340 + 130 * (tau - 9.6);
const SW0 = 11.97, SW1 = 12.45;                                  // the swap: only while the door hides him from the pedestrian
const placeAt = (p, pos, rotY) => { p.position.set(pos[0], 0, pos[1]); p.rotation.y = rotY; };
function story(t, tau) {
  const dx = doorX(tau), doorOn = tau > 9.0 && tau < 18.5;
  DOOR.visible = CARF.visible = doorOn; DOOR.position.set(dx, 0, 0);
  // the front carrier
  placeAt(CARF, [dx + 70, 0], Math.PI / 2); setPose(CARF, walkPose(CARRY_F, tau, 9, 0.8), t);
  // the man with the map (ASK1): walks up, asks, then takes the back of the door
  const sw = ease(clamp((tau - SW0) / (SW1 - SW0)));
  if (tau < 2) { placeAt(ASK1, [-120 + 60 * tau, -45], Math.PI / 2 * (1 - ease(clamp((tau - 1.6) / 0.4)))); setPose(ASK1, armSwing(walkPose(MAPHOLD, tau, 9, 0.9 * (1 - clamp((tau - 1.7) / 0.3))), tau, 9, 0), t); }
  else if (tau < SW0) { placeAt(ASK1, [0, -45], 0); setPose(ASK1, addPose(MAPHOLD, { head: [0.18 * Math.sin(tau * 1.3) + 0.1, 0.1 * Math.sin(tau * 0.7), 0], face: { talk: tau < 9.5 ? 0.8 : 0.3, lid: natBlink(t, 1) } }), t); }
  else { const tgt = [dx - 85, 0], pos = [lerp(0, tgt[0], sw), lerp(-45, tgt[1], sw)]; placeAt(ASK1, pos, lerp(0, Math.PI / 2, sw)); setPose(ASK1, walkPose(mixPose(MAPHOLD, CARRY_B, sw), tau, 9, 0.8), t); }
  // the carrier who takes his place (ASK2)
  if (tau < SW0) { placeAt(ASK2, [dx - 85, 0], Math.PI / 2); setPose(ASK2, walkPose(CARRY_B, tau, 9, 0.8), t); ASK2.visible = doorOn; }
  else { ASK2.visible = true; const src = [dx - 85, 0], pos = [lerp(src[0], 0, sw), lerp(src[1], -45, sw)]; placeAt(ASK2, pos, lerp(Math.PI / 2, 0, sw));
    setPose(ASK2, sw < 1 ? walkPose(mixPose(CARRY_B, MAPHOLD, sw), tau, 9, 0.8 * (1 - sw)) : addPose(MAPHOLD, { head: [0.12 + 0.1 * Math.sin(tau * 1.1), 0.08 * Math.sin(tau * 0.6), 0], face: { talk: 0.85, lid: natBlink(t, 2) } }), t); }
  // the pedestrian: walks up from the right, listens, points the way; glares at the rude door
  if (tau < 2) placeAt(PED, [120 - 60 * tau, 45], -Math.PI / 2); else placeAt(PED, [0, 45], Math.PI);
  if (tau < 2) { const k = ease(clamp((tau - 1.6) / 0.4)); PED.rotation.y = lerp(-Math.PI / 2, -Math.PI, k); setPose(PED, armSwing(walkPose(STAND, tau, 8.5, 0.9 * (1 - k)), tau, 8.5, 1 - k), t); }
  else {
    const pt = clamp((tau - 5.5) / 0.4) * (1 - clamp((tau - 11.1) / 0.3)) + clamp((tau - 12.75) / 0.25) * (1 - clamp((tau - 13.62) / 0.15));
    const flinch = bump(tau, 11.25, 1.4), rude = clamp((tau - 13.65) / 0.3);
    let Q = mixPose(STAND, POINT, pt); Q = addPose(Q, { spine: [-0.12 * flinch, 0, 0], head: [0.05, -0.85 * rude, 0], face: { talk: pt * 0.7, brow: lerp(-0.2, 0.95, rude), grin: -0.5 * rude, lid: Math.max(natBlink(t, 3), 0.2 * rude) } });
    setPose(PED, Q, t);
  }
  // the maps: between each man's hands while he holds one
  const hold = (p, m, on) => { m.visible = on; if (!on) return; p.updateMatrixWorld(true); const J = p.userData, a = v3(wpos(J.lHand, [0, -4, 2])), b = v3(wpos(J.rHand, [0, -4, 2])), hd = v3(wpos(J.head, [0, 12, 0]));
    m.position.copy(a.add(b).multiplyScalar(0.5)).add(v3([0, 6, 0])); m.lookAt(hd); m.rotateX(-0.5); };
  hold(ASK1, MAP1, tau < SW0 + 0.15); hold(ASK2, MAP2, tau > SW1 - 0.05);
}

// ---------- the camera: a new set-up about every second ----------
scene.updateMatrixWorld(true);
const VIEW = {
  pass0: [[62, 170, 150], [-12, 150, -45], 40], pass1: [[56, 168, 138], [-8, 152, -45], 40],
  rev0: [[24, 162, 92], [0, 156, -45], 38], rev1: [[20, 161, 82], [0, 157, -45], 38],
  vox0: [[10, 165, 34], [0, 162, -45], 36], vox1: [[8, 164, 26], [0, 162, -45], 36],
  app0: [[60, 210, 620], [0, 110, 0], 40], app1: [[52, 205, 580], [0, 112, 0], 40],
  mapc0: [[-34, 174, -160], [0, 142, 45], 38], mapc1: [[-28, 171, -148], [0, 143, 45], 38],
  side0: [[-260, 170, 330], [-300, 118, 0], 40], side1: [[-80, 165, 300], [-100, 118, 0], 40],
  pov0: [[0, 158, 36], [0, 152, -45], 46], pov1: [[0, 157, 33], [0, 152, -45], 46],
  top0: [[0, 560, 70], [0, 0, 0], 40], top1: [[0, 540, 60], [0, 0, 0], 40],
  back0: [[-70, 150, -230], [-10, 130, 0], 40], back1: [[-60, 148, -210], [-10, 130, 0], 40],
  line0: [[0, 1150, 360], [0, 1125, 0], 40], line1: [[0, 1146, 332], [0, 1126, 0], 40],
  dir0: [[-232, 166, 12], [0, 136, 0], 40], dir1: [[-214, 164, 10], [0, 137, 0], 40],
  rude0: [[25, 160, -45], [0, 150, 45], 40], rude1: [[22, 159, -36], [0, 151, 45], 40],
};
function cutAt(t) { let i = 0; while (i < CUTS.length - 1 && t >= CUTS[i + 1][0]) i++; return i; }
const shotName = (t) => CUTS[cutAt(t)][1].slice(0, -1);
function camAt(t) {
  if (DEBUGCAM) return [...DEBUGCAM[0], ...DEBUGCAM[1], DEBUGCAM[2]];
  const i = cutAt(t), [t0, a, b] = CUTS[i], t1 = i < CUTS.length - 1 ? CUTS[i + 1][0] : T0.feed;
  const u = clamp((t - t0) / Math.max(0.05, t1 - t0)), k = 0.6 * ease(u) + 0.4 * u, A = VIEW[a], B = VIEW[b];
  return [...lerp3(A[0], B[0], k), ...lerp3(A[1], B[1], k), lerp(A[2], B[2], k)];
}
const tmpV = new X.Vector3();
function project(p, c = cam) { tmpV.set(...p).project(c); return [(tmpV.x + 1) / 2 * W, (1 - tmpV.y) / 2 * H, tmpV.z < 1]; }
const wpos = (o, p = [0, 0, 0]) => o.localToWorld(v3(p)).toArray();

function setWorld(t) {
  const n = shotName(t), onLine = n === 'line', tau = tauAt(t);
  CAMPUS.visible = !onLine; LINEUP.visible = onLine;
  if (!onLine) { story(t, tau); CAMPUS.updateMatrixWorld(true); }
  else {
    setPose(LU1, addPose(STAND, { face: { lid: natBlink(t, 4) } }), t); setPose(LU2, addPose(STAND, { face: { lid: natBlink(t, 5), talk: clamp((t - K.new2 + 0.1) / 0.1) * (1 - clamp((t - K.eightW + 0.2) / 0.1)) } }), t);
    LINEUP.updateMatrixWorld(true);
  }
  const c0 = camAt(t); cam.position.set(c0[0], c0[1], c0[2]); cam.lookAt(c0[3], c0[4], c0[5]); cam.fov = c0[6]; cam.aspect = W / H; cam.near = 1; cam.updateProjectionMatrix();
}

// ---------- 2D: sky, labels, small print ----------
function backdrop(x, t, n) {
  if (n === 'line') { x.fillStyle = '#2A2E36'; x.fillRect(0, 0, W, H); return; }
  const q = x.createLinearGradient(0, 0, 0, H); q.addColorStop(0, '#7FB2E6'); q.addColorStop(0.6, '#CFE4F6'); q.addColorStop(1, '#E8F1F8'); x.fillStyle = q; x.fillRect(0, 0, W, H);
}
const pillHalf = (str, size) => { setF(g, '600 ' + size + 'px Body', -size * 0.02); return (g.measureText(str).width + size * 1.05) / 2; };
function label(x, p3, dx, dy, str, k, o = {}) {
  if (k <= 0) return; const [ax, ay, vis] = project(p3); if (!vis || ax < 0 || ax > W || ay < 0 || ay > H) return;
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
  x.globalAlpha = a * 0.85; setF(x, '500 25px Body', 0); x.fillStyle = '#E4E4E8'; x.textAlign = 'center';
  const words = str.split(' '), lines = ['']; words.forEach((w) => { const tl = lines[lines.length - 1] ? lines[lines.length - 1] + ' ' + w : w; if (x.measureText(tl).width > 960 && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = tl; });
  lines.forEach((l, i) => x.fillText(l, 540, 1832 - (lines.length - 1 - i) * 32)); x.restore();
}
function panel(x, cx, cy, w, h, a = 0.62) { x.save(); rrx(x, cx - w / 2, cy - h / 2, w, h, 34); x.fillStyle = `rgba(6,10,20,${a})`; x.fill(); x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 2; x.stroke(); x.restore(); }
// a voice: a little waveform beside a mouth, coloured per speaker
function voiceWave(x, t, px, py, col, k, seed = 0) {
  if (k <= 0) return; x.save(); x.globalAlpha = clamp(k); x.strokeStyle = col; x.lineWidth = 7; x.lineCap = 'round';
  for (let i = 0; i < 9; i++) { const h = 14 + 46 * Math.abs(Math.sin(t * (9 + seed) + i * (0.9 + 0.3 * seed))) * (1 - Math.abs(i - 4) / 6); x.beginPath(); x.moveTo(px + i * 16, py - h / 2); x.lineTo(px + i * 16, py + h / 2); x.stroke(); }
  x.restore();
}
// the cartoon anger mark: four red curved strokes
function angerMark(x, cx, cy, r) {
  x.save(); x.translate(cx, cy); x.strokeStyle = '#E8242C'; x.lineWidth = r * 0.22; x.lineCap = 'round';
  for (let i = 0; i < 4; i++) { x.save(); x.rotate(i * Math.PI / 2 + Math.PI / 4); x.beginPath(); x.moveTo(r * 0.25, -r * 0.55); x.quadraticCurveTo(r * 0.2, -r * 0.2, r * 0.55, -r * 0.25); x.stroke(); x.restore(); }
  x.restore();
}
// a clock in the corner of the shot: seconds into the meeting
function timer(x, t, tau, k) { if (k <= 0) return; x.save(); x.globalAlpha = clamp(k); rrx(x, 760, 560, 250, 88, 44); x.fillStyle = 'rgba(0,0,0,.6)'; x.fill(); setF(x, '800 52px Mono', 0); x.fillStyle = WHT; x.textAlign = 'center'; x.fillText('0:' + String(Math.min(59, Math.floor(tau))).padStart(2, '0'), 885, 622); x.restore(); }
// 15 people: 8 kept giving directions (grey), 7 noticed (pink)
function tally(x, t) {
  const k = ease((t - K.eightW + 0.05) / 0.25); if (k <= 0) return;
  x.save(); x.globalAlpha = k; panel(x, 540, 1470, 900, 300, 0.66);
  for (let i = 0; i < 15; i++) { const cx = 540 + ((i % 8) - 3.5) * 100 + (i >= 8 ? 50 : 0), cy = 1420 + Math.floor(i / 8) * 110, miss = i < 8, kk = clamp((t - (K.eightW + 0.05 * i)) / 0.2);
    x.save(); x.globalAlpha = k * kk; x.fillStyle = miss ? '#8E96A0' : PINK; x.beginPath(); x.arc(cx, cy - 18, 17, 0, TAU); x.fill(); x.beginPath(); x.ellipse(cx, cy + 26, 26, 22, 0, Math.PI, TAU); x.fill();
    if (!miss) { setF(x, '800 30px Body', 0); x.fillStyle = WHT; x.textAlign = 'center'; x.fillText('!', cx + 30, cy - 30); } x.restore(); }
  setF(x, '700 30px Body', 0); x.textAlign = 'center'; x.fillStyle = '#C8CCD6'; x.fillText('grey: kept giving directions   pink: noticed', 540, 1600); x.restore();
}

// ---------- the 3D shot ----------
function three(x, t, clean = false) {
  const n = shotName(t); backdrop(x, t, n);
  const shake = jolt(t, K.mapL, 5);
  x.save(); x.translate(shake, shake * 0.4);
  setWorld(t); R3.render(scene, cam); x.drawImage(glc, 0, 0);
  const scr = x.createLinearGradient(0, 0, 0, 700); scr.addColorStop(0, 'rgba(0,0,0,.38)'); scr.addColorStop(0.55, 'rgba(0,0,0,.19)'); scr.addColorStop(1, 'rgba(0,0,0,0)'); if (!clean) { x.fillStyle = scr; x.fillRect(-40, -40, W + 80, 740); }
  if (clean) { x.restore(); return; }
  const tau = tauAt(t);
  if (n === 'rev') label(x, wpos(ASK2.userData.head, [0, 6, 10]), 150, 260, 'a different man', win(t, K.swapped + 0.15, K.not - 0.06, 0.2, 0.06), { bg: PINK, fg: WHT });
  if (n === 'vox') { const [mx, my] = project(wpos(ASK2.userData.head, [0, 6, 11])); voiceWave(x, t, mx + 130, my, GREEN, (t - K.not + 0.05) / 0.2, 1); pill(x, 'new voice', mx + 190, my + 110, 40, false, (t - K.voice + 0.05) / 0.25, { f: 'Body', w: 700, bg: GREEN, fg: WHT }); }
  if (n === 'app') { label(x, wpos(ASK1.userData.head, [0, 26, 0]), -130, -120, 'man with a map', win(t, K.man, K.asked - 0.06, 0.2, 0.06), { bg: WHT, fg: INK }); pill(x, 'Cornell, 1998', 540, 1520, 44, false, (t - K.cornell + 0.1) / 0.25, { f: 'Body', w: 700, bg: WHT, fg: INK }); }
  if (n === 'mapc') label(x, wpos(MAP1), 0, 230, 'directions?', win(t, K.directions - 0.2, K.doorL, 0.2, 0.06), { bg: WHT, fg: INK });
  if (n === 'side') { timer(x, t, tau, (t - K.ten + 0.05) / 0.2); label(x, wpos(DOOR, [0, 212, 0]), 0, -120, 'a door', win(t, K.doorW - 0.1, K.carried, 0.2, 0.06), { bg: GOLD, fg: INK }); }
  if (n === 'top') { const a = project(wpos(ASK1, [0, 150, 0])), b = project(wpos(ASK2, [0, 150, 0]));
    x.save(); x.globalAlpha = win(t, K.behind, K.took, 0.2, 0.1); [[a, '#2F6FB0', 'man with the map'], [b, '#3E7A4A', 'carrier']].forEach(([p, col, s0], i) => { pill(x, s0, p[0] + (i ? -150 : 150), p[1] + (i ? 90 : -90), 34, false, 1, { f: 'Body', w: 700, bg: col, fg: WHT }); }); x.restore();
    pill(x, 'the swap', 540, 1560, 48, false, (t - K.carriers + 0.05) / 0.25, { f: 'Body', w: 800, bg: PINK, fg: WHT }); }
  if (n === 'back') label(x, wpos(ASK2.userData.head, [0, 6, 0]), 160, 280, 'takes his place', win(t, K.took, K.newL, 0.2, 0.06), { bg: PINK, fg: WHT });
  if (n === 'line') { label(x, wpos(LU1.userData.spine, [0, 30, 14]), -120, 260, 'blue shirt', win(t, K.clothes - 0.1, K.eightW, 0.15, 0.06), { bg: '#2F6FB0', fg: WHT }); label(x, wpos(LU2.userData.spine, [0, 30, 14]), 120, 260, 'green shirt', win(t, K.clothes, K.eightW, 0.15, 0.06), { bg: '#3E7A4A', fg: WHT });
    const [m1x, m1y] = project(wpos(LU1.userData.head, [0, 6, 11])), [m2x, m2y] = project(wpos(LU2.userData.head, [0, 6, 11]));
    voiceWave(x, t * 0.9, m1x - 210, m1y - 140, '#5AA0E8', win(t, K.new2 - 0.15, K.eightW, 0.15, 0.06), 0); voiceWave(x, t, m2x + 80, m2y - 140, GREEN, win(t, K.new2, K.eightW, 0.15, 0.06), 2.5);
    const t1 = project(wpos(LU1.userData.head, [0, 23, 0])), t2 = project(wpos(LU2.userData.head, [0, 23, 0])), hk = win(t, K.voice2 + 0.05, K.eightW, 0.2, 0.06);
    if (hk > 0) { x.save(); x.globalAlpha = hk; x.strokeStyle = GOLD; x.lineWidth = 5; x.setLineDash([12, 10]); x.beginPath(); x.moveTo(t1[0] - 40, t1[1]); x.lineTo(t2[0] + 60, t1[1]); x.moveTo(t2[0] - 40, t2[1]); x.lineTo(t2[0] + 60, t2[1]); x.stroke(); x.restore();
      pill(x, '≈5 cm', t2[0] + 130, (t1[1] + t2[1]) / 2, 36, false, hk, { f: 'Body', w: 800, bg: GOLD, fg: INK }); } }
  if (n === 'rude') { pill(x, '\u2190 the door: rude!', 330, 1330, 46, false, (t - K.rudeW + 0.12) / 0.2, { f: 'Body', w: 800, bg: PINK, fg: WHT });
    const [hx, hy] = project(wpos(PED.userData.head, [6, 20, 4])), ak = clamp((t - (K.rudeL + 0.25)) / 0.2); if (ak > 0) angerMark(x, hx + 40, hy - 30, 46 * back(ak) * (1 + 0.08 * Math.sin(t * 18))); }
  x.restore();
  if (n === 'dir') tally(x, t);
  if (n === 'pass' || n === 'rev') { const k = win(t, 0.1, K.not - 0.06, 0.2, 0.06); if (k > 0) { x.save(); x.globalAlpha = k * 0.9; rrx(x, 60, 1520, 290, 70, 35); x.fillStyle = 'rgba(0,0,0,.55)'; x.fill(); setF(x, '700 30px Body', 0); x.fillStyle = WHT; x.textAlign = 'center'; x.fillText('Cornell, 1998', 205, 1566); x.restore(); } }
  // the rewind: a quick tape-style wipe as the edit jumps back to the start of the meeting
  const rw = t - (K.mapL - 0.2); if (rw > 0 && rw < 0.35) { const k = bump(rw, 0, 0.35); x.save(); x.globalAlpha = 0.5 * k; for (let i = 0; i < 12; i++) { x.fillStyle = i % 2 ? '#FFFFFF' : '#000000'; x.fillRect(0, ((i * 160 + rw * 4000) % H), W, 12); } x.globalAlpha = k; pill(x, '◀◀ rewind', 540, 960, 56, false, 1, { f: 'Body', w: 800, bg: WHT, fg: INK }); x.restore(); }
  const FP = [[K.mapL, T0.feed, 'Simons & Levin, Psychonomic Bulletin & Review, 1998: on Cornell’s campus, 7 of 15 pedestrians noticed the man they were helping had been swapped behind a passing door. The two men wore different clothes, differed in height by about 5 cm and had different voices. Scenes are illustrations.']];
  FP.forEach(([a, b, str]) => smallPrint(x, str, win(t, a + 0.15, b - 0.05, 0.3, 0.15)));
}
S.site = three;

// ---------- the switch: our reel in a phone; an ad being tweaked (button colour, font) that nobody notices; then the first 3 seconds swapped ----------
const PHN = { cy: 820, s: 0.62 };
let FRZ = null;
function frozen() { if (!FRZ) { const [c, x] = mkc(1080, 1920); three(x, T0.feed - 1 / FPS, true); FRZ = c; } return FRZ; }
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
function bottle(c, cx, cy, s0, rot = 0) {   // the placeholder product: a bottle with a label (yourbrand is a placeholder)
  c.save(); c.translate(cx, cy); c.rotate(rot); c.scale(s0, s0);
  rrx(c, -70, -150, 140, 300, 40); const q = c.createLinearGradient(-70, 0, 70, 0); q.addColorStop(0, '#5AA0D8'); q.addColorStop(1, '#8CC4EE'); c.fillStyle = q; c.fill();
  rrx(c, -30, -210, 60, 70, 12); c.fillStyle = '#2A2A2E'; c.fill(); rrx(c, -55, -40, 110, 90, 10); c.fillStyle = '#FFFFFF'; c.fill();
  setF(c, '800 26px Logo', -1); c.fillStyle = '#1A2A3A'; c.textAlign = 'center'; c.fillText('yourbrand', 0, 12); c.restore();
}
const SWAD = () => K.viewersW + 0.05;                     // the swipe from our reel to the ad
// the ad: a plain opener (tweaked twice) until the door passes, then a new first 3 seconds
function theAd(c, t) {
  const swapped = t >= K.swapW + 0.22;
  if (!swapped) {
    const q = c.createLinearGradient(0, 0, 0, 1280); q.addColorStop(0, '#EEF4FA'); q.addColorStop(1, '#C8DAEA'); c.fillStyle = q; c.fillRect(0, 0, 600, 1280);
    const fk = clamp((t - K.fontW + 0.02) / 0.12), serif = fk > 0.5;
    c.save(); c.translate(300, 230); c.scale(1, Math.abs(Math.cos(fk * Math.PI)) || 0.02); setF(c, serif ? 'italic 700 58px Serif' : '800 58px Logo', -1); c.fillStyle = '#1A2A3A'; c.textAlign = 'center'; c.fillText('Meet the', 0, -10); c.fillText('new bottle.', 0, 56); c.restore();
    bottle(c, 300, 560, 1.15);
    const bk = clamp((t - K.colour + 0.05) / 0.14), green = bk > 0.5;
    c.save(); c.translate(300, 812); c.scale(1, Math.abs(Math.cos(bk * Math.PI)) || 0.02); rrx(c, -170, -46, 340, 92, 46); c.fillStyle = green ? GREEN : BLUE; c.fill(); setF(c, '800 42px Logo', 0); c.fillStyle = WHT; c.textAlign = 'center'; c.fillText('Shop now', 0, 14); c.restore();
  } else {
    const q = c.createLinearGradient(0, 0, 0, 1280); q.addColorStop(0, '#0E2A44'); q.addColorStop(1, '#1E5A88'); c.fillStyle = q; c.fillRect(0, 0, 600, 1280);
    const u = t - (K.swapW + 0.22); setF(c, '900 76px Logo', -2); c.fillStyle = WHT; c.textAlign = 'center'; c.fillText('Your water', 300, 220); c.fillText('is too warm.', 300, 302);
    bottle(c, 300, 600 + 10 * Math.sin(u * 3), 1.15, 0.08 * Math.sin(u * 2));
    c.strokeStyle = 'rgba(200,235,255,.9)'; c.lineWidth = 5; c.lineCap = 'round'; for (let i = 0; i < 6; i++) { const a = i * 1.05 + u; c.beginPath(); c.moveTo(300 + 150 * Math.cos(a), 600 + 170 * Math.sin(a)); c.lineTo(300 + 180 * Math.cos(a), 600 + 205 * Math.sin(a)); c.stroke(); }
  }
  const g0 = c.createLinearGradient(0, 760, 0, 1280); g0.addColorStop(0, 'rgba(0,0,0,0)'); g0.addColorStop(1, 'rgba(0,0,0,.45)'); c.fillStyle = g0; c.fillRect(0, 900, 600, 380);
  rail(c); acct(c, 'yourbrand', 'Sponsored', 'y', '#1E5A88');
}
// a door, sliding across the phone screen: the swap
function door2d(c, t) {
  const u = (t - (K.swapW - 0.1)) / 0.6; if (u <= 0 || u >= 1) return; const x0 = lerp(-360, 760, eio(u));
  c.save(); const q = c.createLinearGradient(x0, 0, x0 + 300, 0); q.addColorStop(0, '#B07A48'); q.addColorStop(1, '#C48C56'); c.fillStyle = q; c.fillRect(x0, -20, 300, 1320);
  c.strokeStyle = 'rgba(70,40,20,.55)'; c.lineWidth = 8; c.strokeRect(x0 + 40, 80, 220, 480); c.strokeRect(x0 + 40, 640, 220, 520); c.fillStyle = '#D8B45A'; c.beginPath(); c.arc(x0 + 250, 640, 14, 0, TAU); c.fill(); c.restore();
}
function feedUI(c, t) {
  const sw = SWAD(), f = eio((t - sw) / 0.22);
  if (f < 1) { c.save(); c.translate(0, -f * 1280); c.drawImage(frozen(), -60, 0, 720, 1280); const q = c.createLinearGradient(0, 760, 0, 1280); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,.72)'); c.fillStyle = q; c.fillRect(0, 860, 600, 420); rail(c); acct(c, 'mezmedia_0', null, 'm.', '#111'); setF(c, '500 26px Body', 0); c.fillStyle = 'rgba(255,255,255,.9)'; c.textAlign = 'left'; c.fillText('Half of you won’t notice a stranger…', 30, 1090); c.restore(); }
  if (f > 0) { c.save(); c.translate(0, 1280 * (1 - f)); theAd(c, t); door2d(c, t); c.restore(); }
}
// the viewers: five faces under the phone; they don't react to tweaks, they light up at the new opening
function viewers(x, t) {
  const k = ease((t - K.viewersW + 0.05) / 0.3); if (k <= 0) return; const lit = clamp((t - (K.swapW + 0.3)) / 0.25);
  x.save(); x.globalAlpha = k;
  for (let i = 0; i < 5; i++) { const cx = 540 + (i - 2) * 150, cy = 1380, col = lit > 0 ? `rgb(${Math.round(lerp(142, 255, lit))},${Math.round(lerp(150, 61, lit))},${Math.round(lerp(160, 168, lit))})` : '#8E96A0';
    x.fillStyle = col; x.beginPath(); x.arc(cx, cy, 52, 0, TAU); x.fill(); x.fillStyle = WHT; [-1, 1].forEach((sd) => { x.beginPath(); x.ellipse(cx + sd * 18, cy - 8, 9, lerp(4, 12, lit), 0, 0, TAU); x.fill(); });
    x.strokeStyle = WHT; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); if (lit > 0.5) x.arc(cx, cy + 14, 14, 0.15 * Math.PI, 0.85 * Math.PI); else { x.moveTo(cx - 14, cy + 22); x.lineTo(cx + 14, cy + 22); } x.stroke();
    if (lit > 0.5) { x.fillStyle = PINK; heart(x, cx + 44, cy - 50 - 30 * clamp((t - K.swapW - 0.5 - 0.08 * i) / 0.5), 14); } }
  x.restore();
}
function tests(x, t) {   // the two tweaks, crossed out
  [['A/B test: button colour', K.colour, 1520], ['A/B test: font', K.fontW, 1610]].forEach(([s0, t0, y]) => { const k = (t - t0 + 0.05) / 0.25; if (k <= 0 || t > K.swapW + 0.2) return;
    pill(x, s0, 540, y, 38, false, k, { f: 'Body', w: 700, bg: '#55606A', fg: WHT });
    const st = clamp((t - (s0.includes('font') ? K.tweaks : K.stop)) / 0.2); if (st > 0) { setF(x, '700 38px Body', 0); const hw = x.measureText(s0).width / 2 + 30; x.save(); x.strokeStyle = PINK; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(540 - hw, y); x.lineTo(540 - hw + 2 * hw * st, y); x.stroke(); x.restore(); } });
  pill(x, 'most won\u2019t notice', 540, 1250, 44, false, win(t, K.seeW - 0.05, K.stop, 0.2, 0.1) * 1.3, { f: 'Body', w: 800, bg: '#2A2E36', fg: WHT });
  const sk = (t - K.first + 0.05) / 0.25; if (sk > 0) { pill(x, 'first 3 seconds: swapped', 540, 1560, 44, false, sk, { f: 'Body', w: 800, bg: PINK, fg: WHT }); }
}
S.feed = (x, t) => {
  stage(x, true);
  if (!IMG.feedscr) IMG.feedscr = mkc(1200, 2560)[0];
  const k = eio((t - T0.feed) / 0.6), p = P(540, lerp(960, PHN.cy, k), PHN.s * Math.pow(1.8 / PHN.s, 1 - k));
  phone(x, p, 'feedscr', { frame: 'frameDark', shadow: k, over: (c) => feedUI(c, t) });
  viewers(x, t); tests(x, t);
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
const CAPY = 290, CAPS0 = 76;
window.captions = (t) => {
  const c = CH.find((q) => t >= q.s && t < q.e); if (!c) return;
  const CAPS = c.size || CAPS0, top = CAPY, rowH = CAPS * 1.18;
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
