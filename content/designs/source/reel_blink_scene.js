// Browser-side scene for reel_blink.js. Runs as a module after three.js (imported as X), the 2D kit and the phone engine
// (reel_phone_kit.js), whose globals it uses: W, H, g, IMG, clamp, lerp, sstep, ease, expo, eio, back, bump, jolt, mkc,
// rrx, setF, pill, phone, P, stage, rise, zoomAt, INK, WHT, GREY... It fills S and replaces the kit's captions with the
// Face ID reel's: at the top, building word by word (the hook card is all on screen from frame 1).
// Worlds: a bedroom at night (y = 0, 1 unit = 1 cm): someone sitting up in bed on their phone, and the same person as
// an x-ray. A giant eye (y = 3000, built in mm): an eyeball with an iris, two lids that close, lashes, skin around it.
// The 2009 lab in Tokyo (y = 2000, cm): a desk, a 17-inch screen 1 m away, a viewer with electrodes above and below the
// left eye. Fourteen viewers in tiers (y = 4000, cm). The cartoon on the screen is our own; the paper used silent clips
// of a British TV comedy. Everything is our own illustration.

const BLUE = '#2F80FF', GOLD = '#E8B44A', PINK = '#FF3DA8', CYAN = '#3FD0FF';
const v3 = (a) => new X.Vector3(...a);
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const win = (t, a, b, fi = 0.25, fo = 0.25) => clamp((t - a) / Math.max(fi, 1e-4)) * (1 - clamp((t - b) / Math.max(fo, 1e-4)));
const tex = (c) => { const t = new X.CanvasTexture(c); t.colorSpace = X.SRGBColorSpace; t.anisotropy = 8; return t; };
const mixHex = (a, b, k) => new X.Color(a).lerp(new X.Color(b), clamp(k));
const RN = (n) => { let h = Math.imul((n | 0) ^ 0x9E3779B9, 0x85EBCA6B); h ^= h >>> 13; h = Math.imul(h, 0xC2B2AE35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const noiseCanvas = (w, h, base, amp, n = 9000, seed = 1) => {
  const [c, x] = mkc(w, h); x.fillStyle = base; x.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) { const v = RN(seed * 100000 + i) < 0.5 ? 255 : 0; x.fillStyle = `rgba(${v},${v},${v},${amp * RN(seed * 100000 + i + 7)})`; x.fillRect(RN(seed * 100000 + i + 3) * w, RN(seed * 100000 + i + 5) * h, 2, 2); }
  return [c, x];
};
// a blink: 70 ms closing, 40 ms shut, 150 ms opening (0 open .. 1 shut)
const blinkShape = (u) => (u < 0 || u > 0.26) ? 0 : u < 0.07 ? ease(u / 0.07) : u < 0.11 ? 1 : 1 - ease((u - 0.11) / 0.15);
const lidAt = (t, list) => list.reduce((m, t0) => Math.max(m, blinkShape(t - t0)), 0);

// ---------- renderer, an environment, lights ----------
const glc = document.getElementById('gl');
const R3 = new X.WebGLRenderer({ canvas: glc, antialias: true, alpha: true, preserveDrawingBuffer: true });
R3.setSize(W, H, false); R3.setClearColor(0x000000, 0);
R3.toneMapping = X.ACESFilmicToneMapping; R3.toneMappingExposure = 1.05; R3.outputColorSpace = X.SRGBColorSpace;
const scene = new X.Scene();
const cam = new X.PerspectiveCamera(40, W / H, 0.5, 6000);
{
  const env = new X.Scene();
  const [c, x] = mkc(256, 256), q = x.createLinearGradient(0, 0, 0, 256);
  q.addColorStop(0, '#B8C8DA'); q.addColorStop(0.5, '#3A3E46'); q.addColorStop(1, '#101114'); x.fillStyle = q; x.fillRect(0, 0, 256, 256);
  env.add(new X.Mesh(new X.SphereGeometry(50, 32, 16), new X.MeshBasicMaterial({ map: tex(c), side: X.BackSide })));
  const panel = (w, h, pos, col, v) => { const m = new X.Mesh(new X.PlaneGeometry(w, h), new X.MeshBasicMaterial({ color: new X.Color(col).multiplyScalar(v), side: X.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m); };
  panel(30, 10, [-6, 30, 14], '#FFF1DE', 4); panel(8, 26, [-34, 8, 10], '#FFD9A8', 2.0); panel(14, 8, [26, 12, -24], '#CFE2FF', 2.0); panel(10, 16, [8, 4, 40], '#DDE8FF', 3.0);
  const pm = new X.PMREMGenerator(R3); scene.environment = pm.fromScene(env, 0.03).texture;
}
scene.environmentIntensity = 0.6;
const hemi = new X.HemisphereLight('#FFF2E0', '#5A4A3C', 0.9); scene.add(hemi);
const key = new X.DirectionalLight('#FFF0D8', 2.2); key.position.set(-300, 600, 500); scene.add(key, key.target);
const rim = new X.DirectionalLight('#BFD8FF', 1.0); rim.position.set(400, 300, -400); scene.add(rim, rim.target);
const MAT = (c, o = {}) => new X.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.6, metalness: o.m ?? 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, map: o.map || null, envMapIntensity: o.env ?? 1, side: o.side ?? X.FrontSide, transparent: !!o.tr, opacity: o.op ?? 1, depthWrite: o.dw ?? true });

// ---------- people: the Mosquito reel's jointed toy figure, with fingers and eyelids ----------
// faces +z, +x is its left; hips at y 92, shoulders at (+-19.5, 42) on the spine, upper arm 25, forearm 23 + hand
function makePerson(o) {
  const G = new X.Group(), J = { o, mats: [] };
  const M2 = (c, opt) => { const m = MAT(c, opt); J.mats.push(m); return m; };
  const skinM = M2(o.skin, { r: 0.62, env: 0.6 }), topM = M2(o.top, { r: 0.85 }), botM = M2(o.bot, { r: 0.85 }), shoeM = M2(o.shoe || '#2B2B30', { r: 0.5 }),
    hairM = M2(o.hair || '#2A1D14', { r: 0.75 }), darkM = M2('#121216', { r: 0.25, env: 1.2 });
  J.skinM = skinM;
  const root = new X.Group(); G.add(root); J.root = root;
  const hips = new X.Group(); hips.position.y = 92; root.add(hips); J.hips = hips;
  const pel = new X.Mesh(new X.CapsuleGeometry(12.5, 8, 6, 14), botM); pel.rotation.z = Math.PI / 2; pel.scale.set(1, 1, 0.78); hips.add(pel);
  const spine = new X.Group(); spine.position.y = 2; hips.add(spine); J.spine = spine;
  const tor = new X.Mesh(new X.CapsuleGeometry(15, 24, 8, 16), topM); tor.position.y = 24; tor.scale.set(1.1, 1, 0.68); spine.add(tor);
  if (o.collar) { const cl = new X.Mesh(new X.TorusGeometry(7.4, 2.2, 8, 24), M2(o.collar, { r: 0.8 })); cl.rotation.x = Math.PI / 2; cl.position.set(0, 47, 0); spine.add(cl); }
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
  if (o.hairStyle === 'curly') for (let i = 0; i < 9; i++) { const b = new X.Mesh(new X.SphereGeometry(4.2, 12, 10), hairM); const a = Math.PI * 0.62 + (i / 8) * Math.PI * 1.76; b.position.set(9.5 * Math.cos(a) * 0.9, 20 + 2.5 * Math.sin(i * 2.1), 9.5 * Math.sin(a) * 0.9 - 2); head.add(b); }
  if (o.glasses) [1, -1].forEach((sd) => { const gl = new X.Mesh(new X.TorusGeometry(2.9, 0.38, 8, 24), M2('#2A2A2E', { r: 0.3, m: 0.6 })); gl.position.set(sd * 4.1, 12.6, 11.2); head.add(gl); });
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
    const ft = new X.Mesh(new X.BoxGeometry(10.5, 7, 25), shoeM); ft.position.set(0, -43.5, 5); ft.visible = !o.nofeet; kn.add(ft);
    J[s + 'Hip'] = hp; J[s + 'Knee'] = kn; });
  G.scale.setScalar(o.h || 1);
  G.userData = J; return G;
}
// sensors for the 2009 study: two discs on the skin, above the left brow and below the left eye, wires over the ear
function addElectrodes(p, wires = true) {
  const J = p.userData, m = MAT('#C9CED6', { r: 0.25, m: 0.8 }), wm = MAT('#22252B', { r: 0.6 });
  [[4.71, 17.75, 10.24], [4.1, 8.2, 10.4]].forEach((p0) => {
    const g0 = new X.CylinderGeometry(1.15, 1.15, 0.5, 18); g0.rotateX(Math.PI / 2);
    const d = new X.Mesh(g0, m); d.position.set(...p0);
    d.quaternion.setFromUnitVectors(new X.Vector3(0, 0, 1), new X.Vector3(p0[0], p0[1] - 11.5, p0[2]).normalize()); J.head.add(d);
    if (wires) { const cv = new X.CatmullRomCurve3([v3(p0), v3([p0[0] + 3.2, p0[1] + (p0[1] > 12 ? 0.8 : -0.8), p0[2] - 2.5]), v3([10.9, 12, 1]), v3([11, 9, -4]), v3([7, 0, -7.5]), v3([3, -9, -6])]);
      J.head.add(new X.Mesh(new X.TubeGeometry(cv, 40, 0.24, 6), wm)); }
  });
}
const JOINTS = ['hips', 'spine', 'neck', 'head', 'lSh', 'rSh', 'lEl', 'rEl', 'lHip', 'rHip', 'lKnee', 'rKnee', 'lHand', 'rHand'];
const Z3 = [0, 0, 0];
// poses: Euler angles per joint; y lowers the figure; face: lid 0 (open)..1 (shut), brow -1 (calm)..1 (pain), grin, wide (eyes wide open)
const STAND = { hips: Z3, spine: Z3, neck: Z3, head: Z3, lSh: [0, 0, 0.1], rSh: [0, 0, -0.1], lEl: [-0.18, 0, 0], rEl: [-0.18, 0, 0], lHip: [0, 0, 0.03], rHip: [0, 0, -0.03], lKnee: Z3, rKnee: Z3, lHand: Z3, rHand: Z3, y: 0, face: { lid: 0.12, brow: -0.2, grin: 0.15 } };
const SIT = { ...STAND, lHip: [-1.5, 0, 0.06], rHip: [-1.5, 0, -0.06], lKnee: [1.5, 0, 0], rKnee: [1.5, 0, 0], y: -40 };
// sitting up in bed against the pillows, legs out under the duvet, phone held at the chest, looking down at it
const INBED = { ...SIT, y: -17, spine: [-0.35, 0, 0], neck: [0.36, 0, 0], head: [0.4, 0, 0], lKnee: [0.04, 0, 0], rKnee: [0.04, 0, 0],
  lSh: [-0.75, 0, -0.38], rSh: [-0.75, 0, 0.38], lEl: [-0.7, 0, 0], rEl: [-0.7, 0, 0], lHand: [0, 0, 0.5], rHand: [0, 0, -0.5], face: { lid: 0.18, brow: -0.1, grin: 0.05 } };
// the viewers: sitting still, hands in the lap, watching
const VIEWER = { ...SIT, spine: [0.04, 0, 0], lSh: [-0.35, 0, 0.12], rSh: [-0.35, 0, -0.12], lEl: [-1.15, 0, 0], rEl: [-1.15, 0, 0], face: { lid: 0.1, brow: -0.15, grin: 0.05 } };
function addPose(A, d) { const out = { ...A, face: { ...A.face } }; Object.keys(d).forEach((j) => { if (j === 'y') out.y = (out.y || 0) + d.y; else if (j === 'face') Object.assign(out.face, d.face); else out[j] = (A[j] || Z3).map((v, i) => v + d[j][i]); }); return out; }
function setPose(p, Q) {
  const J = p.userData; JOINTS.forEach((j) => J[j].rotation.set(...(Q[j] || Z3))); J.root.position.y = Q.y || 0;
  const f = Q.face || {}, lid = clamp(f.lid || 0), br = f.brow || 0, wide = clamp(f.wide || 0);
  J.lids.forEach((l0) => { l0.visible = lid > 0.02; l0.rotation.x = lerp(-1.6, 1.5, lid); });
  J.eyes.forEach((e) => e.scale.setScalar(1 + 0.18 * wide));
  J.brows.forEach((b, i) => { const sd = i ? -1 : 1; b.rotation.z = sd * 0.42 * br; b.position.y = 16.4 - 0.9 * Math.max(0, br) + 0.6 * Math.max(0, -br) + 1.1 * wide; });
  const gr = f.grin || 0; J.mouth.scale.set(1 + 0.1 * gr + 0.5 * wide, 1 + 0.3 * gr - 0.3 * wide, 1); J.mouth.position.y = 6.3 + 0.4 * gr;
}

// ---------- a brain, built in mm (about 134 wide, 164 long), for the x-ray ----------
function brainGeo(seed, sd) {
  const g0 = new X.SphereGeometry(1, 96, 72), n0 = new X.Vector3(), q = new X.Vector3(), nn = new X.Vector3();
  if (sd < 0) g0.rotateY(Math.PI);                       // the sphere's seam (at -x) goes to the hidden inner face
  const p = g0.attributes.position;
  for (let i = 0; i < p.count; i++) { n0.set(p.getX(i), p.getY(i), p.getZ(i)).normalize();
    const a = n0.x * sd > 0 ? 52 : 14, b = n0.y > 0 ? 45 : 28, c = 82;
    q.set(n0.x * a, n0.y * b, n0.z * c); nn.set(q.x / (a * a), q.y / (b * b), q.z / (c * c)).normalize();
    const f = Math.sin(n0.x * 13 + seed) * Math.sin(n0.y * 15 + 2 * seed) + 0.6 * Math.sin(n0.z * 20 + n0.y * 8 + seed) + 0.4 * Math.sin((n0.x + n0.z) * 27 + seed) + 0.35 * Math.sin(n0.y * 34 + n0.z * 21 + 3 * seed);
    q.addScaledVector(nn, 2.6 * Math.max(-0.8, f) * (n0.x * sd > 0 ? 1 : 0.25)); p.setXYZ(i, q.x, q.y, q.z); }
  g0.computeVertexNormals(); return g0;
}
const cortexM = new X.MeshPhysicalMaterial({ color: '#F2A9B4', roughness: 0.55, clearcoat: 0.4, clearcoatRoughness: 0.5, emissive: CYAN, emissiveIntensity: 0 });
function makeBrain() {
  const G = new X.Group();
  [1, -1].forEach((sd, i) => { const h0 = new X.Mesh(brainGeo(i * 1.7 + 0.4, sd), cortexM); h0.position.x = sd * 15; G.add(h0); });
  const cg = new X.SphereGeometry(1, 48, 32); cg.scale(46, 24, 30); const cb = new X.Mesh(cg, MAT('#E7909E', { r: 0.5 })); cb.position.set(0, -28, -52); G.add(cb);
  const stem = new X.Mesh(new X.CylinderGeometry(9, 7, 46, 20), MAT('#E4A3AE', { r: 0.6 })); stem.position.set(0, -42, -18); stem.rotation.x = 0.35; G.add(stem);
  return G;
}

// ---------- the bedroom at night (y = 0): a bed against the back wall (z = -125), the person sitting up on their phone ----------
const BED = new X.Group(); scene.add(BED);
const BFURN = new X.Group(); BED.add(BFURN);
const feedCv = mkc(360, 760), feedTex = tex(feedCv[0]);
function drawFeed(t) {                                    // the phone in bed: a feed scrolling
  const [, x] = feedCv, H0 = 470, off = (t * 150) % H0; x.fillStyle = '#0B0B0E'; x.fillRect(0, 0, 360, 760);
  const pal = [['#FF9A62', '#E2557A'], ['#58C7F2', '#3A62D8'], ['#9BE07A', '#2E9F6A'], ['#F7D35C', '#F08A3A']];
  for (let i = -1; i < 3; i++) { const k = Math.floor(t * 150 / H0) + i, y0 = 40 + i * H0 - off + H0, pc = pal[((k % 4) + 4) % 4];
    x.fillStyle = '#2A2A30'; x.beginPath(); x.arc(30, y0 + 16, 12, 0, TAU); x.fill(); x.fillStyle = '#E8E8EC'; x.fillRect(52, y0 + 10, 110, 10);
    const q = x.createLinearGradient(0, y0 + 40, 360, y0 + 400); q.addColorStop(0, pc[0]); q.addColorStop(1, pc[1]); x.fillStyle = q; x.fillRect(0, y0 + 40, 360, 360);
    x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.arc(180 + 60 * Math.sin(k), y0 + 200, 70, 0, TAU); x.fill();
    x.fillStyle = '#E8E8EC'; x.fillRect(14, y0 + 414, 240, 9); x.fillStyle = '#8E8E96'; x.fillRect(14, y0 + 432, 180, 8); }
  x.fillStyle = '#0B0B0E'; x.fillRect(0, 0, 360, 30); x.fillStyle = '#E8E8EC'; setF(x, '700 18px Body', 0); x.fillText('9:41', 20, 21);
  feedTex.needsUpdate = true;
}
let YOU, PHONE3, PHONELIGHT, BRAINMINI;
{
  const S0 = BFURN;
  const flT = (() => { const [c, x] = noiseCanvas(512, 512, '#3A2E26', 0.07, 9000, 41); for (let i = 0; i < 8; i++) { x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, i * 64, 512, 3); } const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; t0.repeat.set(5, 5); return t0; })();
  const fl = new X.Mesh(new X.PlaneGeometry(900, 900), MAT('#FFFFFF', { map: flT, r: 0.7 })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0, 100); S0.add(fl);
  const wl = new X.Mesh(new X.PlaneGeometry(900, 500), MAT('#2A3246', { r: 0.95 })); wl.position.set(0, 250, -128); S0.add(wl);
  const sw = new X.Mesh(new X.PlaneGeometry(900, 500), MAT('#232A3C', { r: 0.95 })); sw.rotation.y = Math.PI / 2; sw.position.set(-170, 250, 100); S0.add(sw);
  const winM = new X.Mesh(new X.PlaneGeometry(80, 100), new X.MeshBasicMaterial({ color: '#5B7FB8', toneMapped: false })); winM.rotation.y = Math.PI / 2; winM.position.set(-169, 150, -40); S0.add(winM);
  [[0, 0, 82, 3], [0, 0, 3, 102]].forEach(([a, b, w, h]) => { const fr = new X.Mesh(new X.BoxGeometry(2, h, w), MAT('#1A1E2A')); fr.position.set(-168, 150 + a, -40 + b); S0.add(fr); });
  const box = (w, h, d, x0, y0, z0, m) => { const b = new X.Mesh(new X.BoxGeometry(w, h, d, 2, 2, 2), m); b.position.set(x0, y0, z0); S0.add(b); return b; };
  box(160, 36, 212, 0, 18, -16, MAT('#3A3F4E', { r: 0.8 })); box(150, 22, 200, 0, 47, -15, MAT('#E8E6E0', { r: 0.9 })); box(170, 100, 8, 0, 70, -124, MAT('#4A4F5E', { r: 0.8 }));
  const pil = box(120, 30, 18, 0, 76, -108, MAT('#F0EEE8', { r: 0.95 })); pil.rotation.x = -0.3;
  const duvM = MAT('#5A6FA8', { r: 0.95 }); box(156, 20, 150, 0, 68, 22, duvM);
  [-9, 9].forEach((x0) => { const bm = new X.Mesh(new X.SphereGeometry(10, 20, 14), duvM); bm.scale.set(1, 0.75, 1.5); bm.position.set(x0, 78, 6); S0.add(bm); });   // the feet under the duvet
  box(40, 50, 40, 112, 25, -100, MAT('#4A3A2E', { r: 0.6 }));
  const shade = new X.Mesh(new X.CylinderGeometry(9, 13, 16, 20, 1, true), new X.MeshStandardMaterial({ color: '#F6E6C8', emissive: '#FFB866', emissiveIntensity: 0.7, side: X.DoubleSide, roughness: 0.8 })); shade.position.set(112, 72, -100); S0.add(shade);
  box(3, 14, 3, 112, 57, -100, MAT('#2A2A2E', { m: 0.6 }));
  YOU = makePerson({ skin: '#E9B99A', top: '#8A6AB8', bot: '#3A4458', hair: '#2E211A', hairStyle: 'bun', nofeet: true, h: 0.98 });
  YOU.position.set(0, 0, -80); BED.add(YOU);
  PHONE3 = new X.Group(); BED.add(PHONE3);
  const pb = new X.Mesh(new X.BoxGeometry(7.4, 15.2, 0.9), MAT('#16161A', { r: 0.3, m: 0.4 })); PHONE3.add(pb);
  const ps = new X.Mesh(new X.PlaneGeometry(6.8, 14.4), new X.MeshBasicMaterial({ map: feedTex, toneMapped: false })); ps.position.z = 0.47; PHONE3.add(ps);
  PHONELIGHT = new X.PointLight('#CFE0FF', 0, 140, 1.5); PHONELIGHT.position.z = 6; PHONE3.add(PHONELIGHT);
  BRAINMINI = new X.Group(); BRAINMINI.visible = false; YOU.userData.head.add(BRAINMINI); BRAINMINI.position.set(0, 15, -0.5); BRAINMINI.scale.setScalar(0.1); BRAINMINI.add(makeBrain());
}
const LAMPPT = new X.PointLight('#FFB866', 0, 300, 1.2); LAMPPT.position.set(112, 75, -95); scene.add(LAMPPT);
const MOON = new X.DirectionalLight('#7FA2E0', 0); MOON.position.set(-400, 260, 60); MOON.target.position.set(0, 90, -80); scene.add(MOON, MOON.target);

// ---------- the giant eye (y = 3000, built in mm): an eyeball, two lids, lashes, the skin of the face around it ----------
const EYEW = new X.Group(); EYEW.position.set(0, 3000, 0); EYEW.visible = false; scene.add(EYEW);
const irisTex = (() => {
  const [c, x] = mkc(2048, 1024), cx = 512, cy = 512;
  x.fillStyle = '#F2ECE6'; x.fillRect(0, 0, 2048, 1024);
  const sc = x.createRadialGradient(cx, cy, 150, cx, cy, 900); sc.addColorStop(0, 'rgba(255,255,255,0)'); sc.addColorStop(1, 'rgba(225,170,165,.55)'); x.fillStyle = sc; x.fillRect(0, 0, 2048, 1024);
  x.lineCap = 'round';
  for (let i = 0; i < 70; i++) {                         // little red veins, from the corners toward the iris
    const a = RN(i + 900) * TAU, r0 = 520 + 260 * RN(i + 901); let px = cx + Math.cos(a) * r0, py = cy + Math.sin(a) * r0 * 0.9;
    x.strokeStyle = `rgba(190,60,60,${0.18 + 0.25 * RN(i + 902)})`; x.lineWidth = 1 + 2.4 * RN(i + 903); x.beginPath(); x.moveTo(px, py);
    for (let k = 0; k < 12; k++) { const d = Math.hypot(px - cx, py - cy); if (d < 250) break; px += (cx - px) / d * 26 + (RN(i * 31 + k) - 0.5) * 30; py += (cy - py) / d * 26 + (RN(i * 37 + k) - 0.5) * 30; x.lineTo(px, py); }
    x.stroke();
  }
  const ir = x.createRadialGradient(cx, cy, 60, cx, cy, 186); ir.addColorStop(0, '#9A6222'); ir.addColorStop(0.35, '#7E7A34'); ir.addColorStop(0.75, '#4E7D5C'); ir.addColorStop(1, '#2F5A4A');
  x.fillStyle = ir; x.beginPath(); x.arc(cx, cy, 186, 0, TAU); x.fill();
  for (let i = 0; i < 900; i++) { const a = i / 900 * TAU + RN(i + 70) * 0.01, r1 = 72 + 20 * RN(i + 71), r2 = 150 + 34 * RN(i + 72);
    x.strokeStyle = RN(i + 73) < 0.5 ? `rgba(30,45,25,${0.25 + 0.3 * RN(i + 74)})` : `rgba(210,190,120,${0.15 + 0.25 * RN(i + 75)})`; x.lineWidth = 1.5 + RN(i + 76) * 1.5;
    x.beginPath(); x.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); x.lineTo(cx + Math.cos(a + 0.02) * r2, cy + Math.sin(a + 0.02) * r2); x.stroke(); }
  x.strokeStyle = 'rgba(20,24,18,.9)'; x.lineWidth = 14; x.beginPath(); x.arc(cx, cy, 182, 0, TAU); x.stroke();
  x.fillStyle = '#040405'; x.beginPath(); x.arc(cx, cy, 70, 0, TAU); x.fill();
  return tex(c);
})();
const skinT = (() => { const [c] = noiseCanvas(512, 512, '#E3A889', 0.06, 26000, 53); const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; t0.repeat.set(4, 4); return t0; })();
const eyeSkin = new X.MeshStandardMaterial({ color: '#FFFFFF', map: skinT, roughness: 0.55, side: X.DoubleSide });
let EYEBALL, LIDU, LIDL;
{
  const face = new X.Mesh(new X.SphereGeometry(60, 128, 96), eyeSkin); face.position.set(0, -6, -52.6); EYEW.add(face);
  EYEBALL = new X.Mesh(new X.SphereGeometry(12, 128, 96), new X.MeshPhysicalMaterial({ map: irisTex, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.3 })); EYEW.add(EYEBALL);
  const rT = (() => { const [c, x] = mkc(128, 256); rrx(x, 8, 8, 112, 240, 24); const q = x.createLinearGradient(0, 0, 0, 256); q.addColorStop(0, 'rgba(230,240,255,.95)'); q.addColorStop(1, 'rgba(170,200,255,.75)'); x.fillStyle = q; x.fill();
    x.fillStyle = 'rgba(40,60,120,.4)'; for (let i = 0; i < 5; i++) x.fillRect(22, 36 + i * 42, 84, 26); return tex(c); })();
  const refl = new X.Mesh(new X.PlaneGeometry(2.4, 4.3), new X.MeshBasicMaterial({ map: rT, transparent: true, opacity: 0.55, blending: X.AdditiveBlending, depthWrite: false, toneMapped: false }));
  const rp = v3([2.6, 2.6, 11.4]).normalize().multiplyScalar(12.25); refl.position.copy(rp); refl.quaternion.setFromUnitVectors(new X.Vector3(0, 0, 1), rp.clone().normalize()); EYEBALL.add(refl);
  const marM = MAT('#C98472', { r: 0.5 }), lashM = MAT('#1A1410', { r: 0.6 });
  LIDU = new X.Group(); LIDL = new X.Group(); EYEW.add(LIDU, LIDL);
  LIDU.add(new X.Mesh(new X.SphereGeometry(12.9, 96, 48, 0, TAU, 0, Math.PI / 2), eyeSkin));
  LIDL.add(new X.Mesh(new X.SphereGeometry(12.9, 96, 48, 0, TAU, Math.PI / 2, Math.PI / 2), eyeSkin));
  [LIDU, LIDL].forEach((L0, li) => { const mar = new X.Mesh(new X.TorusGeometry(12.9, 0.6, 10, 128), marM); mar.rotation.x = Math.PI / 2; L0.add(mar);
    const n = li ? 26 : 44, up = li ? -1 : 1;
    for (let i = 0; i < n; i++) { const f = -1.15 + 2.3 * i / (n - 1), len = (li ? 1.8 : 3.8) * (1 - 0.35 * Math.abs(f) / 1.15), el = li ? 0.55 : 0.75;
      const dir = v3([Math.sin(f) * Math.cos(el), up * Math.sin(el), Math.cos(f) * Math.cos(el)]).normalize(), base = v3([12.9 * Math.sin(f), 0, 12.9 * Math.cos(f)]);
      const ls = new X.Mesh(new X.CylinderGeometry(0.06, 0.19, len, 5), lashM); ls.position.copy(base.clone().addScaledVector(dir, len / 2)); ls.quaternion.setFromUnitVectors(new X.Vector3(0, 1, 0), dir); L0.add(ls); } });
  const brow = new X.Mesh(new X.TorusGeometry(24, 1.7, 10, 48, 1.7), MAT('#5A4030', { r: 0.85 })); brow.rotation.z = Math.PI / 2 - 0.85; brow.position.set(1.5, -1, 5.2); EYEW.add(brow);
}
function setEye(k) { LIDU.rotation.x = lerp(-0.41, 0.25, k); LIDL.rotation.x = lerp(0.47, 0.21, k); }
const EKEY = new X.DirectionalLight('#FFF4EA', 0); EKEY.position.set(-60, 3090, 120); EKEY.target.position.set(0, 3000, 0); scene.add(EKEY, EKEY.target);
const EPH = new X.PointLight('#BFD4FF', 0, 400, 1.2); EPH.position.set(10, 2975, 70); scene.add(EPH);

// ---------- the lab in Tokyo, 2009 (y = 2000): a 17-inch screen on a desk, the viewer 1 m away facing it (-z) ----------
const LABW = new X.Group(); LABW.position.set(0, 2000, 0); LABW.visible = false; scene.add(LABW);
const tvCv = mkc(640, 512), tvTex = tex(tvCv[0]);
// the cartoon on the screen (ours): a street, a small red car, a man in a blue shirt
function car2d(x, cx, cy, s, door = 0) {
  x.save(); x.translate(cx, cy); x.scale(s, s);
  x.fillStyle = '#C8352E'; rrx(x, -80, -30, 160, 46, 16); x.fill(); rrx(x, -48, -66, 92, 44, 18); x.fill();
  x.fillStyle = '#BFE3F6'; rrx(x, -40, -60, 38, 32, 8); x.fill(); rrx(x, 4, -60, 34, 32, 8); x.fill();
  if (door) { x.fillStyle = '#A82A24'; x.save(); x.translate(-4, -30); x.rotate(-0.6 * door); x.fillRect(0, 0, 44, 44); x.restore(); }
  x.fillStyle = '#1A1A1E'; [[-46, 18], [46, 18]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 17, 0, TAU); x.fill(); }); x.fillStyle = '#9A9AA2'; [[-46, 18], [46, 18]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 7, 0, TAU); x.fill(); });
  x.fillStyle = '#FFE9A0'; x.fillRect(70, -20, 10, 10); x.restore();
}
function man2d(x, cx, cy, s, t, wild = 0) {
  x.save(); x.translate(cx, cy); x.scale(s, s); x.lineCap = 'round';
  const j = wild * Math.sin(t * 22), arm = wild ? -1.2 + 0.9 * Math.sin(t * 15) : 0.3;
  x.strokeStyle = '#2B3550'; x.lineWidth = 12; x.beginPath(); x.moveTo(0, 0); x.lineTo(-12 - 8 * j, 46); x.moveTo(0, 0); x.lineTo(12 + 8 * j, 46); x.stroke();
  x.fillStyle = '#3A6FD0'; rrx(x, -16, -52, 32, 56, 10); x.fill();
  x.strokeStyle = '#3A6FD0'; x.lineWidth = 10; x.beginPath(); x.moveTo(-12, -44); x.lineTo(-12 - 34 * Math.cos(arm), -44 + 34 * Math.sin(arm)); x.moveTo(12, -44); x.lineTo(12 + 34 * Math.cos(arm + 0.4 * j), -44 + 34 * Math.sin(arm + 0.4 * j)); x.stroke();
  x.fillStyle = '#E8B48E'; x.beginPath(); x.arc(0, -70, 17, 0, TAU); x.fill(); x.fillStyle = '#3A2A1C'; x.beginPath(); x.arc(0, -76, 17, Math.PI, TAU); x.fill();
  x.restore();
}
function tvScene(t) { return t < K.empty - 0.08 ? 'drive' : t < K.parked - 0.08 ? 'empty' : t < K.actionL ? 'parked' : 'action'; }
function drawTV(t) {
  const [, x] = tvCv, kind = tvScene(t); x.save();
  const sk = x.createLinearGradient(0, 0, 0, 300); sk.addColorStop(0, '#8EC5F0'); sk.addColorStop(1, '#D6ECFA'); x.fillStyle = sk; x.fillRect(0, 0, 640, 512);
  [[0, 120, 120, '#C9B79C'], [130, 90, 110, '#B7A6C9'], [250, 140, 130, '#E0C08A'], [390, 100, 120, '#A9C3B0'], [520, 130, 120, '#D8A99A']].forEach(([a, b, w, col]) => { x.fillStyle = col; x.fillRect(a, b, w, 300 - b);
    x.fillStyle = 'rgba(60,80,110,.35)'; for (let r = b + 18; r < 280; r += 40) for (let q = a + 14; q < a + w - 20; q += 34) x.fillRect(q, r, 18, 22); });
  x.fillStyle = '#B9B9B4'; x.fillRect(0, 300, 640, 34); x.fillStyle = '#55585E'; x.fillRect(0, 334, 640, 178); x.fillStyle = '#E8E3C8'; for (let q = 0; q < 640; q += 90) x.fillRect(q + 10, 418, 50, 8);
  if (kind === 'drive') { const cx = ((t - K.watching + 0.6) * 230) % 900 - 130; car2d(x, cx, 380, 1.0); x.fillStyle = '#E8B48E'; x.beginPath(); x.arc(cx - 20, 344, 11, 0, TAU); x.fill(); }
  if (kind === 'parked') car2d(x, 330, 360, 1.05);
  if (kind === 'action') { const u = t - K.actionL; car2d(x, 250, 368, 1.0, 1); man2d(x, 420 + 30 * Math.sin(u * 6), 330 - Math.abs(Math.sin(u * 9)) * 40, 1.2, t, 1);
    x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 5; x.lineCap = 'round'; for (let i = 0; i < 5; i++) { const a = i * 1.26 + u * 3; x.beginPath(); x.moveTo(420 + 70 * Math.cos(a), 300 + 60 * Math.sin(a)); x.lineTo(420 + 92 * Math.cos(a), 300 + 80 * Math.sin(a)); x.stroke(); }
    ['#FFD24A', '#FF6A8A', '#6AD0FF'].forEach((col, i) => { const a = u * 5 + i * 2.1; x.fillStyle = col; x.beginPath(); x.arc(420 + 110 * Math.cos(a), 250 + 50 * Math.sin(a * 1.3), 9, 0, TAU); x.fill(); }); }
  x.restore(); tvTex.needsUpdate = true;
}
const eogCv = mkc(512, 256), eogTex = tex(eogCv[0]);
let SUBJ, TVSCREEN, LAPSCREEN;
{
  const S0 = LABW;
  const fl = new X.Mesh(new X.PlaneGeometry(900, 900), MAT('#2B2D33', { r: 0.9 })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0, 100); S0.add(fl);
  const wl = new X.Mesh(new X.PlaneGeometry(900, 400), MAT('#3A3E46', { r: 0.95 })); wl.position.set(0, 200, -80); S0.add(wl);
  const sw = new X.Mesh(new X.PlaneGeometry(900, 400), MAT('#33363E', { r: 0.95 })); sw.rotation.y = -Math.PI / 2; sw.position.set(160, 200, 100); S0.add(sw);
  const top = new X.Mesh(new X.BoxGeometry(130, 4, 70), MAT('#8A7A64', { r: 0.6 })); top.position.set(0, 73, -15); S0.add(top);
  [[-60, -45], [60, -45], [-60, 15], [60, 15]].forEach(([a, b]) => { const l0 = new X.Mesh(new X.BoxGeometry(4, 71, 4), MAT('#4A4E56', { m: 0.5 })); l0.position.set(a, 35.5, b); S0.add(l0); });
  const mon = new X.Group(); mon.position.set(0, 75, -30); S0.add(mon);
  const bz = new X.Mesh(new X.BoxGeometry(38, 31, 3), MAT('#1C1D21', { r: 0.4 })); bz.position.y = 23.5; mon.add(bz);
  TVSCREEN = new X.Mesh(new X.PlaneGeometry(34, 27), new X.MeshBasicMaterial({ map: tvTex, toneMapped: false })); TVSCREEN.position.set(0, 23.5, 1.55); mon.add(TVSCREEN);
  const st = new X.Mesh(new X.BoxGeometry(5, 9, 4), MAT('#1C1D21')); st.position.set(0, 4.5, -1); mon.add(st); const bs = new X.Mesh(new X.BoxGeometry(20, 1.2, 14), MAT('#1C1D21')); bs.position.y = 0.6; mon.add(bs);
  // the viewer, 1 m from the screen, facing it
  SUBJ = makePerson({ skin: '#EBC3A0', top: '#3E5A7A', bot: '#30343C', hair: '#16120E', hairStyle: 'short', h: 0.96 });
  SUBJ.position.set(0, 0, 72); SUBJ.rotation.y = Math.PI; S0.add(SUBJ); addElectrodes(SUBJ, true);
  const ch = new X.Group(); ch.position.set(0, 0, 76); S0.add(ch); const cM = MAT('#22262E', { r: 0.6 });
  const seat = new X.Mesh(new X.BoxGeometry(44, 4, 42), cM); seat.position.y = 36; ch.add(seat); const bk = new X.Mesh(new X.BoxGeometry(44, 40, 4), cM); bk.position.set(0, 60, 22); ch.add(bk);
  // a side table: the amplifier and a laptop drawing the blink trace
  const tb = new X.Mesh(new X.BoxGeometry(50, 70, 40), MAT('#4A4038', { r: 0.7 })); tb.position.set(95, 35, 60); S0.add(tb);
  const amp = new X.Mesh(new X.BoxGeometry(30, 10, 22), MAT('#C9C6BC', { r: 0.5 })); amp.position.set(88, 75, 66); S0.add(amp);
  for (let i = 0; i < 4; i++) { const kb = new X.Mesh(new X.CylinderGeometry(1.2, 1.2, 1.2, 12), MAT('#2A2A2E')); kb.rotation.x = Math.PI / 2; kb.position.set(78 + i * 6, 76, 77.3); S0.add(kb); }
  const lb = new X.Mesh(new X.BoxGeometry(32, 1.6, 22), MAT('#8E9096', { m: 0.6, r: 0.3 })); lb.position.set(100, 71, 46); S0.add(lb);
  const lid = new X.Group(); lid.position.set(100, 71.8, 35.5); lid.rotation.x = -0.25; S0.add(lid);
  const lp = new X.Mesh(new X.BoxGeometry(32, 21, 1), MAT('#8E9096', { m: 0.6, r: 0.3 })); lp.position.y = 10.5; lid.add(lp);
  LAPSCREEN = new X.Mesh(new X.PlaneGeometry(29, 18), new X.MeshBasicMaterial({ map: eogTex, toneMapped: false })); LAPSCREEN.position.set(0, 10.5, 0.55); lid.add(LAPSCREEN);
}
const TVLIGHT = new X.PointLight('#D8E6FF', 0, 400, 1.3); TVLIGHT.position.set(0, 98, -22); LABW.add(TVLIGHT);
const LCEIL = new X.PointLight('#FFE2B8', 0, 600, 1.2); LCEIL.position.set(60, 240, 120); LABW.add(LCEIL);
function drawEOG(t, spikes) {                            // a scrolling trace, with a spike for every blink
  const [, x] = eogCv; x.fillStyle = '#0A1220'; x.fillRect(0, 0, 512, 256);
  x.strokeStyle = 'rgba(80,120,170,.35)'; x.lineWidth = 1; for (let i = 0; i < 512; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.stroke(); }
  x.strokeStyle = '#5CFF8A'; x.lineWidth = 3; x.beginPath();
  for (let i = 0; i <= 512; i += 2) { const tt = t - (512 - i) / 512 * 2.5; let v = 0.06 * Math.sin(tt * 37) + 0.04 * Math.sin(tt * 91 + 1); spikes.forEach((s0) => { const u = (tt - s0) / 0.09; v += Math.exp(-u * u) * 1.0; });
    const y = 170 - v * 120; i ? x.lineTo(i, y) : x.moveTo(i, y); }
  x.stroke(); setF(x, '600 20px Mono', 0); x.fillStyle = '#7FD8A0'; x.fillText('EOG  left eye', 14, 28); eogTex.needsUpdate = true;
}

// ---------- fourteen viewers in tiers (y = 4000), facing the screen (+z) ----------
const GRIDW = new X.Group(); GRIDW.position.set(0, 4000, 0); GRIDW.visible = false; scene.add(GRIDW);
const VIEWERS = [];
{
  const skins = ['#F1C7A8', '#E0AC86', '#C68A62', '#EBC3A0', '#D9A27A', '#F3D0B4', '#B87B56'], tops = ['#3E5A7A', '#7A3A3A', '#4E7A4A', '#5A4E8A', '#8A6A3A', '#2E6F78', '#9A5A7A'],
    hairs = ['#16120E', '#3A2A1C', '#6A4A30', '#2A2018', '#8A6A44'], styles = ['short', 'bun', 'long', 'short', 'curly', 'short', 'long'];
  const rows = [4, 3, 4, 3]; let n = 0;
  rows.forEach((cnt, r) => { for (let i = 0; i < cnt; i++) {
    const p = makePerson({ skin: skins[n % 7], top: tops[(n * 3) % 7], bot: '#2E3038', hair: hairs[(n * 2) % 5], hairStyle: styles[(n * 5) % 7], glasses: n % 5 === 2, h: 0.95 });
    p.position.set((i - (cnt - 1) / 2) * 47, r * 38, -r * 58); GRIDW.add(p); addElectrodes(p, false);
    p.userData.n = n; p.userData.ph = RN(n + 300); VIEWERS.push(p); n++; } });
}
const GLIGHT = new X.PointLight('#D8E6FF', 0, 900, 1.0); GLIGHT.position.set(0, 4150, 300); scene.add(GLIGHT);

// ---------- the camera: a new set-up about every second ----------
scene.updateMatrixWorld(true);
const VIEW = {
  eye0: [[12, 3007, 86], [0, 3007, 0], 35], eye1: [[9, 3006, 74], [0, 3006.5, 0], 35],
  bed0: [[14, 141, -16], [0, 128, -86], 40], bed1: [[12, 140, -24], [0, 128.5, -86], 40],
  pov0: [[-30, 158, -108], [0, 116, -50], 30], pov1: [[-27, 156, -104], [0, 116, -50], 28],
  xr0: [[78, 141, -86], [0, 137, -90], 34], xr1: [[70, 141, -87], [0, 137.5, -90], 34],
  graph0: [[112, 150, -40], [0, 128, -90], 40], graph1: [[106, 149, -44], [0, 128, -90], 40],
  eyeb0: [[-48, 3010, 62], [0, 3005, 0], 35], eyeb1: [[-42, 3008, 58], [0, 3004.5, 0], 35],
  rows0: [[110, 170, 150], [0, 110, -60], 40], rows1: [[100, 165, 135], [0, 110, -60], 40],
  lab0: [[150, 2165, 260], [0, 2098, 20], 40], lab1: [[135, 2160, 240], [0, 2098, 20], 40],
  face0: [[22, 2124, -32], [0, 2113, 62], 34], face1: [[18, 2123, -22], [0, 2113, 62], 34],
  grid0: [[0, 4170, 420], [0, 4160, -80], 40], grid1: [[0, 4168, 395], [0, 4160, -80], 40],
  ots0: [[-26, 2132, 132], [0, 2098, -30], 36], ots1: [[-22, 2128, 118], [0, 2098, -30], 36],
  raster0: [[60, 2130, -10], [0, 2112, 72], 40], raster1: [[54, 2128, -4], [0, 2112, 72], 40],
  gridb0: [[-150, 4120, 330], [0, 4165, -80], 40], gridb1: [[-138, 4122, 310], [0, 4165, -80], 40],
  mon0: [[6, 2099, 34], [0, 2098.5, -30], 32], mon1: [[4, 2099, 28], [0, 2098.5, -30], 32],
  monb0: [[-10, 2100, 38], [0, 2098.5, -30], 32], monb1: [[-7, 2099, 30], [0, 2098.5, -30], 32],
  act0: [[50, 4150, 250], [0, 4150, -60], 40], act1: [[40, 4148, 228], [0, 4150, -60], 40],
  monc0: [[8, 2099, 30], [0, 2098.5, -30], 32], monc1: [[5, 2099, 25], [0, 2098.5, -30], 32],
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

// ---------- the timeline of the world ----------
const BEDSHOTS = ['bed', 'pov', 'xr', 'graph', 'rows'], EYESHOTS = ['eye', 'eyeb'], LABSHOTS = ['lab', 'face', 'ots', 'raster', 'mon', 'monb', 'monc'], GRIDSHOTS = ['grid', 'gridb', 'act'];
const XRAY = (n) => n === 'xr' || n === 'graph';
function xray(p, on) {   // the figure turns to blue glass, the brain shows through
  p.userData.mats.forEach((m) => { if (!m.userData.orig) m.userData.orig = { c: m.color.clone(), o: m.opacity, t: m.transparent, e: m.emissive.clone(), ei: m.emissiveIntensity, dw: m.depthWrite };
    const o = m.userData.orig; if (on) { m.color.set('#8EC8FF'); m.transparent = true; m.opacity = 0.16; m.emissive.set('#2F80FF'); m.emissiveIntensity = 0.4; m.depthWrite = false; }
    else { m.color.copy(o.c); m.transparent = o.t; m.opacity = o.o; m.emissive.copy(o.e); m.emissiveIntensity = o.ei; m.depthWrite = o.dw; } m.needsUpdate = true; });
}
let XR = null;
// when everyone blinks: the eye in the hook, the person in bed, the viewer in the lab, the fourteen together
const EYEBLINKS = [-0.14, K.shut - 0.06, K.blink - 0.07];
const YOUBLINKS = [K.seen - 0.05, K.dims + 0.22, K.dark - 0.05];
const SUBJBLINKS = [K.tracked - 0.3, K.blinks - 0.05, K.lined + 0.1];
const ALLBLINKS = [K.bits - 0.05, K.street - 0.05, K.car - 0.05];
const visionAt = (t) => 1 - 0.75 * clamp((t - K.dims) / 0.18) * (1 - clamp((t - (K.dims + 0.5)) / 0.25));
function setWorld(t) {
  const n = shotName(t), onBed = BEDSHOTS.includes(n), onEye = EYESHOTS.includes(n), onLab = LABSHOTS.includes(n), onGrid = GRIDSHOTS.includes(n), xr = XRAY(n);
  BED.visible = onBed; BFURN.visible = onBed && !xr; EYEW.visible = onEye; LABW.visible = onLab; GRIDW.visible = onGrid;
  hemi.intensity = onBed ? (xr ? 0.25 : 0.35) : onEye ? 0.55 : onLab ? 0.35 : onGrid ? 0.3 : 0.5; hemi.color.set(onBed ? '#9AB0E0' : '#FFF2E0');
  key.intensity = 0; rim.intensity = onBed ? (xr ? 1.6 : 0.6) : onGrid ? 0.8 : 0; rim.color.set('#6FB0FF');
  MOON.intensity = onBed && !xr ? 0.9 : 0; LAMPPT.intensity = onBed && !xr ? 260 : 0; PHONELIGHT.intensity = onBed && !xr ? 220 : 0;
  EKEY.intensity = onEye ? 2.4 : 0; EPH.intensity = onEye ? 1800 : 0; LCEIL.intensity = onLab ? 1200 : 0; GLIGHT.intensity = 0;
  scene.environmentIntensity = onEye ? 0.9 : xr ? 0.25 : 0.45;
  if (onEye) { setEye(lidAt(t, EYEBLINKS)); EYEBALL.rotation.set(0.04 * Math.sin(t * 0.7), 0.06 * Math.sin(t * 0.9), 0); EYEW.updateMatrixWorld(true); }
  if (onBed) {
    if (XR !== xr) { xray(YOU, xr); XR = xr; } BRAINMINI.visible = xr; drawFeed(t);
    setPose(YOU, addPose(INBED, { head: [0.02 * Math.sin(t * 1.1), 0.03 * Math.sin(t * 0.8), 0], rEl: [0.03 * Math.sin(t * 2.2), 0, 0], face: { lid: Math.max(INBED.face.lid, lidAt(t, YOUBLINKS)) } }));
    cortexM.emissiveIntensity = xr ? 0.15 + 0.55 * visionAt(t) : 0;
    YOU.updateMatrixWorld(true);
    const J = YOU.userData, a = v3(wpos(J.lHand, [0, -4, 1])), b = v3(wpos(J.rHand, [0, -4, 1])), hd = v3(wpos(J.head, [0, 12, 4]));
    PHONE3.position.copy(a.add(b).multiplyScalar(0.5)).add(v3([0, 6.5, 2.5])); PHONE3.lookAt(hd); PHONE3.visible = true;
  }
  if (onLab) {
    drawTV(t); drawEOG(t, SUBJBLINKS.map((s0) => s0 + 0.06));
    const act = t >= K.actionL ? 0.4 + 0.3 * Math.abs(Math.sin(t * 13)) : 0; TVLIGHT.intensity = 650 + 500 * act; TVLIGHT.color.set(act ? '#FFE0C8' : '#D8E6FF');
    setPose(SUBJ, addPose(VIEWER, { head: [0.02 * Math.sin(t * 0.9), 0, 0], face: { lid: Math.max(0.1, lidAt(t, SUBJBLINKS)) } }));
    LABW.updateMatrixWorld(true);
  }
  if (onGrid) {
    const act = n === 'act' ? 0.5 + 0.5 * Math.abs(Math.sin(t * 11)) : 0;
    GLIGHT.intensity = 2600 + 2400 * act; GLIGHT.color.copy(act ? mixHex('#FFD8B0', '#B8D8FF', 0.5 + 0.5 * Math.sin(t * 7)) : new X.Color('#D8E6FF'));
    VIEWERS.forEach((p) => { const d = p.userData, own = [K.fourteen + 0.1 + 0.7 * d.ph, K.watching - 0.4 + 0.5 * RN(d.n + 400)];
      const lid = n === 'act' ? 0 : Math.max(lidAt(t, ALLBLINKS.map((s0) => s0 + 0.03 * (RN(d.n + 500) - 0.5))), n === 'grid' ? lidAt(t, own) : 0);
      setPose(p, addPose(VIEWER, { head: [0.03 * Math.sin(t * 0.8 + d.n), 0.04 * Math.sin(t * 0.6 + d.n * 2), 0], face: { lid: Math.max(0.08, lid), wide: n === 'act' ? 1 : 0 } })); });
    GRIDW.updateMatrixWorld(true);
  }
  const c0 = camAt(t); cam.position.set(c0[0], c0[1], c0[2]); cam.lookAt(c0[3], c0[4], c0[5]); cam.fov = c0[6]; cam.aspect = W / H; cam.near = onEye ? 0.5 : 1; cam.updateProjectionMatrix();
}

// ---------- 2D: backdrops, labels, small print ----------
function backdrop(x, t, n) {
  if (XRAY(n)) { const r0 = x.createRadialGradient(540, 900, 60, 540, 900, 1250); r0.addColorStop(0, '#0E2848'); r0.addColorStop(1, '#03060C'); x.fillStyle = r0; x.fillRect(0, 0, W, H);
    x.save(); x.globalAlpha = 0.12; x.strokeStyle = '#6FB0FF'; x.lineWidth = 2; for (let i = 0; i <= 12; i++) { x.beginPath(); x.moveTo(i * 90, 0); x.lineTo(i * 90, H); x.stroke(); } for (let j = 0; j <= 22; j++) { x.beginPath(); x.moveTo(0, j * 90); x.lineTo(W, j * 90); x.stroke(); } x.restore(); return; }
  x.fillStyle = GRIDSHOTS.includes(n) ? '#0C0E14' : LABSHOTS.includes(n) ? '#2A2C32' : EYESHOTS.includes(n) ? '#C99478' : '#141A28'; x.fillRect(0, 0, W, H);
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
  x.globalAlpha = a * 0.85; setF(x, '500 25px Body', 0); x.fillStyle = '#C4C4C9'; x.textAlign = 'center';
  const words = str.split(' '), lines = ['']; words.forEach((w) => { const tl = lines[lines.length - 1] ? lines[lines.length - 1] + ' ' + w : w; if (x.measureText(tl).width > 960 && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = tl; });
  lines.forEach((l, i) => x.fillText(l, 540, 1832 - (lines.length - 1 - i) * 32)); x.restore();
}
function panel(x, cx, cy, w, h, a = 0.62) { x.save(); rrx(x, cx - w / 2, cy - h / 2, w, h, 34); x.fillStyle = `rgba(6,10,20,${a})`; x.fill(); x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 2; x.stroke(); x.restore(); }
// the eye -> the back of the brain: what you see, dimming before the lid comes down
function optic(x, t) {
  const J = YOU.userData, pts = [[4.1, 12.6, 10.4], [4.4, 12.4, 4.5], [3, 13.2, -1.5], [1.6, 14.2, -6.5], [0.6, 15, -10]].map((p) => project(wpos(J.head, p)));
  const v = visionAt(t), k = ease((t - K.dimsL + 0.05) / 0.3); if (k <= 0) return;
  x.save(); x.globalAlpha = k; x.lineCap = 'round'; x.lineJoin = 'round';
  x.strokeStyle = `rgba(63,208,255,${0.25 + 0.5 * v})`; x.lineWidth = 12; x.shadowColor = CYAN; x.shadowBlur = 30 * v; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke();
  const len = [0]; for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const at = (s) => { s = clamp(s) * len[len.length - 1]; let i = 1; while (i < len.length - 1 && len[i] < s) i++; const u = (s - len[i - 1]) / Math.max(1, len[i] - len[i - 1]); return [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)]; };
  for (let i = 0; i < 7; i++) { const p = at(((t * 1.6) + i / 7) % 1); x.globalAlpha = k * v; x.fillStyle = WHT; x.shadowBlur = 20; x.beginPath(); x.arc(p[0], p[1], 9, 0, TAU); x.fill(); }
  const back0 = pts[pts.length - 1]; x.globalAlpha = k * v; const gl = x.createRadialGradient(back0[0], back0[1], 0, back0[0], back0[1], 120); gl.addColorStop(0, 'rgba(63,208,255,.8)'); gl.addColorStop(1, 'rgba(63,208,255,0)'); x.fillStyle = gl; x.fillRect(back0[0] - 120, back0[1] - 120, 240, 240);
  x.restore();
  const mid = at(0.45); pill(x, v > 0.5 ? 'vision' : 'vision: dimmed', mid[0], mid[1] + 130, 38, false, (t - K.vision + 0.2) / 0.25, { f: 'Body', w: 700, bg: v > 0.5 ? CYAN : '#55606A', fg: v > 0.5 ? INK : WHT });
}
// "up to 50 milliseconds": vision drops before the lid starts to close (an illustration of the timing, not data)
function graph(x, t) {
  const k = ease((t - K.up + 0.12) / 0.25); if (k <= 0) return;
  x.save(); x.globalAlpha = k; const cx = 540, cy = 1130, w = 920, h = 620; panel(x, cx, cy, w, h, 0.72);
  const X0 = cx - 380, X1 = cx + 400, msX = (ms) => lerp(X0, X1, (ms + 150) / 450), yv = (v, row) => (row ? cy + 150 : cy - 90) - v * 150;
  const rev = clamp((t - K.up) / 0.9), lim = lerp(-150, 300, rev);
  setF(x, '700 30px Body', 0); x.textAlign = 'left'; x.fillStyle = CYAN; x.fillText('what you see', X0, cy - 260); x.fillStyle = PINK; x.fillText('eyelid open', X0, cy + 0);
  const vision = (ms) => ms < -50 ? 1 : ms < 40 ? 1 - 0.85 * ease((ms + 50) / 90) : ms < 170 ? 0.15 : 0.15 + 0.85 * ease((ms - 170) / 110);
  const lidv = (ms) => ms < 0 ? 1 : ms < 70 ? 1 - ease(ms / 70) : ms < 150 ? 0 : clamp((ms - 150) / 120);
  [[vision, 0, CYAN], [lidv, 1, PINK]].forEach(([f, row, col]) => { x.strokeStyle = col; x.lineWidth = 8; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath();
    for (let ms = -150; ms <= lim; ms += 4) { const px = msX(ms), py = yv(f(ms), row); ms === -150 ? x.moveTo(px, py) : x.lineTo(px, py); } x.stroke(); });
  x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 2; x.setLineDash([10, 10]); [-50, 0].forEach((ms) => { x.beginPath(); x.moveTo(msX(ms), cy - 250); x.lineTo(msX(ms), cy + 200); x.stroke(); }); x.setLineDash([]);
  const bk = ease((t - K.fifty + 0.05) / 0.25);
  if (bk > 0) { x.globalAlpha = k * bk; const a = msX(-50), b = msX(0), yb = cy + 236; x.strokeStyle = GOLD; x.lineWidth = 5; x.beginPath(); x.moveTo(a, yb - 16); x.lineTo(a, yb); x.lineTo(b, yb); x.lineTo(b, yb - 16); x.stroke();
    x.globalAlpha = k; pill(x, 'up to 50 ms', (a + b) / 2, yb + 52, 38, false, bk, { f: 'Body', w: 800, bg: GOLD, fg: INK }); }
  x.restore();
}
// "so you never notice the dark": the light that reaches your eye has gaps; what you notice doesn't
function stripRows(x, t) {
  const k = ease((t - K.darkL + 0.05) / 0.3); if (k <= 0) return;
  x.save(); x.globalAlpha = k; const cy = 1120; panel(x, 540, cy, 980, 640, 0.66);
  const fw = 120, gap = 14, off = ((t - K.darkL) * 160) % (fw + gap), cols = ['#FF9A62', '#58C7F2', '#9BE07A', '#F7D35C', '#C08AF0', '#FF7A9A', '#62E0C8'];
  setF(x, '700 30px Body', 0); x.textAlign = 'left'; x.fillStyle = '#D0D4DC'; x.fillText('reaches your eye', 80, cy - 240); x.fillText('what you notice', 80, cy + 60);
  const darkI = 4 + Math.floor((K.dark - K.darkL) * 160 / (fw + gap)), base = Math.floor((t - K.darkL) * 160 / (fw + gap));
  [0, 1].forEach((row) => { const y0 = row ? cy + 90 : cy - 210;
    x.save(); x.beginPath(); x.rect(70, y0 - 10, 940, 240); x.clip();
    for (let i = -1; i < 9; i++) { const idx = base + i, X0 = 80 + i * (fw + gap) - off, dark = row === 0 && idx === darkI;
      rrx(x, X0, y0, fw, 210, 12); x.fillStyle = dark ? '#020203' : cols[((idx % 7) + 7) % 7]; x.fill();
      if (!dark) { x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.arc(X0 + fw / 2, y0 + 90, 30, 0, TAU); x.fill(); x.fillRect(X0 + 14, y0 + 160, fw - 40, 10); }
      if (dark && t > K.dark - 0.1) { x.strokeStyle = PINK; x.lineWidth = 6; rrx(x, X0 - 4, y0 - 4, fw + 8, 218, 14); x.stroke(); } }
    x.restore(); });
  x.restore();
  const dx = 80 + (darkI - base) * (fw + gap) - off + fw / 2;
  if (t > K.dark - 0.1 && dx > 60 && dx < 1020) pill(x, 'the dark', clamp(dx, 140, 940), cy - 300, 40, false, (t - K.dark + 0.1) / 0.25, { f: 'Body', w: 800, bg: PINK, fg: WHT });
}
// the trace of one viewer's eye, a spike on each blink
function eogStrip(x, t) {
  const k = ease((t - K.scientists + 0.05) / 0.25); if (k <= 0) return;
  x.save(); x.globalAlpha = k; const cy = 1500; panel(x, 540, cy, 920, 230, 0.7);
  x.strokeStyle = '#5CFF8A'; x.lineWidth = 5; x.lineJoin = 'round'; x.beginPath();
  for (let i = 0; i <= 840; i += 3) { const tt = t - (840 - i) / 840 * 2.2; let v = 0.05 * Math.sin(tt * 37) + 0.03 * Math.sin(tt * 91 + 1); SUBJBLINKS.forEach((s0) => { const u = (tt - s0 - 0.06) / 0.09; v += Math.exp(-u * u); });
    const y = cy + 60 - v * 120; i ? x.lineTo(100 + i, y) : x.moveTo(100 + i, y); }
  x.stroke(); setF(x, '600 26px Body', 0); x.fillStyle = '#9FE8B8'; x.textAlign = 'left'; x.fillText('electrodes: one eye, every blink', 120, cy - 70); x.restore();
}
// "their blinks lined up": fourteen rows of blinks, scattered, then in columns
function raster(x, t) {
  const k = ease((t - K.linedL + 0.05) / 0.3); if (k <= 0) return;
  x.save(); x.globalAlpha = k; const cx = 540, cy = 1080, w = 940, h = 700; panel(x, cx, cy, w, h, 0.74);
  const al = ease(clamp((t - (K.lined - 0.1)) / 0.45)), cols = [0.24, 0.52, 0.8];
  setF(x, '700 28px Body', 0); x.textAlign = 'left'; x.fillStyle = '#C8CCD6'; x.fillText('14 people', cx - w / 2 + 40, cy - h / 2 + 52); x.textAlign = 'right'; x.fillText('time →', cx + w / 2 - 40, cy + h / 2 - 30);
  if (al > 0.6) { x.fillStyle = `rgba(255,61,168,${0.22 * clamp((al - 0.6) / 0.4)})`; cols.forEach((c) => x.fillRect(cx - w / 2 + 60 + c * (w - 120) - 22, cy - h / 2 + 80, 44, h - 160)); }
  for (let r = 0; r < 14; r++) { const y = cy - h / 2 + 100 + r * 37;
    x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 2; x.beginPath(); x.moveTo(cx - w / 2 + 60, y); x.lineTo(cx + w / 2 - 60, y); x.stroke();
    for (let j = 0; j < 4; j++) { const rnd = RN(r * 17 + j * 5 + 600), tgt = j < 3 ? cols[j] + (RN(r * 7 + j + 650) - 0.5) * 0.02 : rnd, pos = lerp(rnd, tgt, j < 3 && RN(r * 3 + j + 700) < 0.85 ? al : 0);
      x.fillStyle = j < 3 && al > 0.5 ? PINK : '#E8E8EC'; rrx(x, cx - w / 2 + 60 + pos * (w - 120) - 5, y - 13, 10, 26, 4); x.fill(); } }
  x.restore();
}
// fourteen eyes in two rows, closing together
function eyeRow(x, t, cy, lidF) {
  x.save(); panel(x, 540, cy, 900, 230, 0.6);
  for (let i = 0; i < 14; i++) { const ex = 540 + ((i % 7) - 3) * 120, ey = cy - 50 + Math.floor(i / 7) * 100, lid = lidF(i);
    x.save(); x.translate(ex, ey); x.beginPath(); x.moveTo(-44, 0); x.quadraticCurveTo(0, -36, 44, 0); x.quadraticCurveTo(0, 36, -44, 0); x.closePath(); x.fillStyle = '#F4F0EA'; x.fill(); x.clip();
    x.fillStyle = '#4E7D5C'; x.beginPath(); x.arc(0, 0, 17, 0, TAU); x.fill(); x.fillStyle = '#050505'; x.beginPath(); x.arc(0, 0, 8, 0, TAU); x.fill();
    if (lid > 0) { x.fillStyle = '#D9A07E'; x.fillRect(-50, -40, 100, 80 * lid); x.fillRect(-50, 40 - 10 * lid, 100, 10 * lid); }
    x.restore(); x.save(); x.translate(ex, ey); x.strokeStyle = '#2A1E18'; x.lineWidth = 4; x.beginPath(); x.moveTo(-44, 0); x.quadraticCurveTo(0, lerp(-36, 30, lid), 44, 0); x.stroke();
    if (lid > 0.6) { x.lineWidth = 3; x.lineCap = 'round'; for (let l = -2; l <= 2; l++) { const lx = l * 15, ly = 15 * (1 - (lx / 44) ** 2) * lid; x.beginPath(); x.moveTo(lx, ly); x.lineTo(lx * 1.15, ly + 11); x.stroke(); } }
    x.restore(); }
  x.restore();
}

// ---------- the 3D shot ----------
function three(x, t, clean = false) {
  const n = shotName(t); backdrop(x, t, n);
  const shake = jolt(t, K.tokyoL, 6) + jolt(t, K.actionL, 6);
  x.save(); x.translate(shake, shake * 0.4);
  setWorld(t); R3.render(scene, cam); x.drawImage(glc, 0, 0);
  const scr = x.createLinearGradient(0, 0, 0, 700), sa = XRAY(n) ? 0.2 : 0.38;
  scr.addColorStop(0, `rgba(0,0,0,${sa})`); scr.addColorStop(0.55, `rgba(0,0,0,${sa * 0.5})`); scr.addColorStop(1, 'rgba(0,0,0,0)'); if (!clean) { x.fillStyle = scr; x.fillRect(-40, -40, W + 80, 740); }
  if (clean) { x.restore(); return; }
  if (n === 'bed') label(x, wpos(YOU.userData.head, [4.1, 12.6, 10]), 150, 60, 'blink', win(t, K.seen - 0.08, K.not - 0.06, 0.12, 0.06), { bg: PINK, fg: WHT });
  if (n === 'xr') optic(x, t);
  if (n === 'face') label(x, wpos(SUBJ.userData.head, [4.1, 8.2, 10.4]), 170, 120, 'electrodes', win(t, K.scientists + 0.1, K.fourteen - 0.1, 0.2, 0.06), { bg: WHT, fg: INK });
  if (n === 'lab') label(x, wpos(TVSCREEN, [0, 13.5, 0]), 0, -180, 'Tokyo, 2009', win(t, K.tokyo, K.scientists - 0.05, 0.2, 0.06), { bg: WHT, fg: INK });
  if (n === 'ots') label(x, wpos(TVSCREEN, [0, 13.5, 0]), 0, -170, '1 m from a 17" screen', win(t, K.watching + 0.05, K.linedL, 0.2, 0.06), { bg: WHT, fg: INK });
  x.restore();
  if (n === 'graph') graph(x, t);
  if (n === 'rows') stripRows(x, t);
  if (n === 'face') eogStrip(x, t);
  if (n === 'raster') raster(x, t);
  if (n === 'grid') pill(x, '14 people', 540, 1560, 52, false, (t - K.fourteen) / 0.25, { f: 'Body', w: 800, bg: WHT, fg: INK });
  if (n === 'gridb') pill(x, 'blink', 540, 1560, 52, false, (t - K.bits + 0.08) / 0.2, { f: 'Body', w: 800, bg: PINK, fg: WHT });
  if (n === 'mon' || n === 'monb') { const t0 = n === 'mon' ? K.street : K.car; eyeRow(x, t, 1500, (i) => lidAt(t, [t0 - 0.05 + 0.03 * (RN(i + 800) - 0.5)]));
    pill(x, n === 'mon' ? 'an empty street' : 'a parked car', 540, 1310, 44, false, (t - (n === 'mon' ? K.empty : K.parked) + 0.05) / 0.25, { f: 'Body', w: 700, bg: WHT, fg: INK }); }
  if (n === 'monc') { eyeRow(x, t, 1500, () => 0); pill(x, 'no blinks', 540, 1310, 44, false, (t - K.barely + 0.05) / 0.25, { f: 'Body', w: 800, bg: PINK, fg: WHT }); }
  if (n === 'act') pill(x, 'the action', 540, 1560, 52, false, (t - K.action + 0.05) / 0.25, { f: 'Body', w: 800, bg: GOLD, fg: INK });
  if (n === 'pov') pill(x, 'not once', 540, 1480, 46, false, (t - K.once + 0.05) / 0.25, { f: 'Body', w: 700, bg: WHT, fg: INK });
  const FP = [[K.dimsL, K.tokyoL, 'People blink about 17 to 24 times a minute at rest (Bentivoglio et al., Movement Disorders, 1997; Nakano et al., 2009). Vision is suppressed from up to 50 ms before a blink (Volkmann et al., Science, 1980; Volkmann, Vision Research, 1986).'],
    [K.tokyoL, T0.feed, 'Nakano et al., Proc. R. Soc. B, 2009: the blinks of 14 people watching silent Mr. Bean clips lined up at implicit breaks (an empty street, a parked car, the end of an action) and were suppressed during the action. Scenes are illustrations; the cartoon is ours.']];
  FP.forEach(([a, b, str]) => smallPrint(x, str, win(t, a + 0.15, b - 0.05, 0.3, 0.15)));
}
S.site = three;

// ---------- the switch: our reel in a phone; an ad that opens on a spinning logo (blink), then a slow pan (blink); cut them ----------
const PHN = { cy: 800, s: 0.62 };
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
  rrx(c, -70, -150, 140, 300, 40); const q = c.createLinearGradient(-70, 0, 70, 0); q.addColorStop(0, '#E0A458'); q.addColorStop(1, '#F2C37A'); c.fillStyle = q; c.fill();
  rrx(c, -30, -210, 60, 70, 12); c.fillStyle = '#2A2A2E'; c.fill(); rrx(c, -55, -40, 110, 90, 10); c.fillStyle = '#FFFFFF'; c.fill();
  setF(c, '800 26px Logo', -1); c.fillStyle = '#2A1A10'; c.textAlign = 'center'; c.fillText('yourbrand', 0, 12); c.restore();
}
const SWAD = () => K.logo - 0.12;                         // the swipe from our reel to the ad
const CUTAT = () => K.through - 0.05;                     // after the cut the ad opens on the action
function theAd(c, t) {
  const tc = CUTAT(), seg = t >= tc ? 'action' : t >= K.slow - 0.1 ? 'pan' : 'logo';
  if (seg === 'logo') { c.fillStyle = '#F2F2F7'; c.fillRect(0, 0, 600, 1280);
    const u = clamp((t - SWAD()) / 1.3), ang = (1 - ease(u)) * Math.PI * 3, sx = Math.cos(ang);
    c.save(); c.translate(300, 520); c.scale(Math.abs(sx) < 0.04 ? 0.04 : sx, 1); c.beginPath(); c.arc(0, 0, 140, 0, TAU); c.fillStyle = '#2A1A10'; c.fill(); setF(c, '800 84px Logo', -2); c.fillStyle = WHT; c.textAlign = 'center'; c.fillText('yb', 0, 28); c.restore();
    setF(c, '800 54px Logo', -1); c.fillStyle = `rgba(42,26,16,${clamp((u - 0.6) / 0.4)})`; c.textAlign = 'center'; c.fillText('yourbrand', 300, 760); }
  if (seg === 'pan') { const q = c.createLinearGradient(0, 0, 0, 1280); q.addColorStop(0, '#F6E2C8'); q.addColorStop(1, '#E2B98E'); c.fillStyle = q; c.fillRect(0, 0, 600, 1280);
    const u = t - (K.slow - 0.1); bottle(c, 380 - 40 * u, 560, 1.5); setF(c, '600 36px Body', 0); c.fillStyle = 'rgba(42,26,16,.8)'; c.textAlign = 'center'; c.fillText('Introducing…', 300, 900); }
  if (seg === 'action') { const q = c.createLinearGradient(0, 0, 0, 1280); q.addColorStop(0, '#1A1028'); q.addColorStop(1, '#3A1A44'); c.fillStyle = q; c.fillRect(0, 0, 600, 1280);
    const u = t - tc, y = 560 - 260 * Math.sin(Math.min(Math.PI, u * 3.2)); bottle(c, 300, y, 1.15, u * 5.5);
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 8; c.lineCap = 'round'; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(150 + i * 75, y + 250 + 30 * (i % 2)); c.lineTo(150 + i * 75, y + 320 + 30 * (i % 2)); c.stroke(); }
    setF(c, '800 64px Logo', -2); c.fillStyle = WHT; c.textAlign = 'center'; c.fillText('Catch this.', 300, 240); }
  const g0 = c.createLinearGradient(0, 760, 0, 1280); g0.addColorStop(0, 'rgba(0,0,0,0)'); g0.addColorStop(1, 'rgba(0,0,0,.5)'); c.fillStyle = g0; c.fillRect(0, 860, 600, 420);
  rail(c); acct(c, 'yourbrand', 'Sponsored', 'y', '#6B4226');
}
function feedUI(c, t) {
  const sw = SWAD(), f = eio((t - sw) / 0.22);
  if (f < 1) { c.save(); c.translate(0, -f * 1280); c.drawImage(frozen(), -60, 0, 720, 1280); const q = c.createLinearGradient(0, 760, 0, 1280); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,.72)'); c.fillStyle = q; c.fillRect(0, 860, 600, 420); rail(c); acct(c, 'mezmedia_0', null, 'm.', '#111'); setF(c, '500 26px Body', 0); c.fillStyle = 'rgba(255,255,255,.9)'; c.textAlign = 'left'; c.fillText('Every 3 seconds your eyes shut…', 30, 1090); c.restore(); }
  if (f > 0) { c.save(); c.translate(0, 1280 * (1 - f)); theAd(c, t); c.restore(); }
}
// a full-screen blink: two lids meet in the middle, lashes on their edges
function bigBlink(x, k) {
  if (k <= 0) return; const e = H / 2 * k + 10;
  x.save(); x.fillStyle = '#2A1A16';
  [[-1, 0], [1, H]].forEach(([d, y0]) => { const edge = d < 0 ? e : H - e; x.beginPath(); x.moveTo(0, y0); x.lineTo(0, edge); x.quadraticCurveTo(540, edge - d * 120 * (1 - k), W, edge); x.lineTo(W, y0); x.closePath();
    const q = x.createLinearGradient(0, y0, 0, edge); q.addColorStop(0, '#B07A62'); q.addColorStop(1, '#6E4636'); x.fillStyle = q; x.fill();
    x.strokeStyle = '#1A100C'; x.lineWidth = 10; x.beginPath(); x.moveTo(0, edge); x.quadraticCurveTo(540, edge - d * 120 * (1 - k), W, edge); x.stroke();
    x.lineWidth = 6; x.lineCap = 'round'; for (let i = 1; i < 30; i++) { const s0 = i / 30, px = s0 * W, py = (1 - s0) * (1 - s0) * edge + 2 * s0 * (1 - s0) * (edge - d * 120 * (1 - k)) + s0 * s0 * edge;
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + (s0 - 0.5) * 30, py - d * (d < 0 ? 46 : 30)); x.stroke(); } });
  x.restore();
}
// the ad's first seconds as a bar: two dull segments (blinks), cut out; the action slides to the start
function adBar(x, t) {
  const k = ease((t - K.cutL + 0.1) / 0.25); if (k <= 0) return;
  x.save(); x.globalAlpha = k; const y = 1380, X0 = 160, Wd = 760, segs = [['logo spin', 0.3, '#55606A', K.cut], ['slow pan', 0.3, '#55606A', K.seconds2], ['the action', 0.4, PINK, 0]];
  const slide = ease(clamp((t - (K.through - 0.25)) / 0.3)); let x0 = X0;
  segs.forEach(([name, w0, col, tcut], i) => { const cutk = tcut ? ease(clamp((t - tcut) / 0.22)) : 0, w = Wd * w0, gone = i < 2 ? slide : 0;
    const xx = i < 2 ? x0 : lerp(x0, 540 - w / 2, slide), ww = w * (1 - gone);
    if (ww > 2) { x.save(); x.globalAlpha = k * (1 - 0.7 * cutk); x.translate(0, 40 * cutk); rrx(x, xx + 4, y - 40, Math.max(0, ww - 8), 80, 16); x.fillStyle = col; x.fill();
      setF(x, '700 28px Body', 0); x.fillStyle = WHT; x.textAlign = 'center'; if (ww > 120) x.fillText(name, xx + ww / 2, y + 10);
      if (i < 2) { x.save(); x.translate(xx + ww / 2, y - 80); x.strokeStyle = WHT; x.lineWidth = 4; x.beginPath(); x.moveTo(-26, 0); x.quadraticCurveTo(0, 18, 26, 0); x.stroke(); for (let l = -1; l <= 1; l++) { x.beginPath(); x.moveTo(l * 14, 8); x.lineTo(l * 18, 20); x.stroke(); } x.restore(); }
      x.restore(); }
    if (tcut && t > tcut - 0.15 && t < tcut + 0.35) { const sx = xx + ww, sk = clamp((t - tcut + 0.15) / 0.3); x.save(); x.translate(sx, y); x.rotate(0.4 * Math.sin(sk * Math.PI * 2)); x.strokeStyle = WHT; x.lineWidth = 6;
      [[-1], [1]].forEach(([d]) => { x.beginPath(); x.moveTo(0, 0); x.lineTo(-48, d * 30 * (1 - sk)); x.stroke(); x.beginPath(); x.arc(-58, d * 34 * (1 - sk), 12, 0, TAU); x.stroke(); }); x.restore(); }
    x0 += w; });
  x.restore();
}
S.feed = (x, t) => {
  stage(x, true);
  if (!IMG.feedscr) IMG.feedscr = mkc(1200, 2560)[0];
  const k = eio((t - T0.feed) / 0.6), p = P(540, lerp(960, PHN.cy, k), PHN.s * Math.pow(1.8 / PHN.s, 1 - k));
  phone(x, p, 'feedscr', { frame: 'frameDark', shadow: k, over: (c) => feedUI(c, t) });
  [K.blinkA, K.blinkB].forEach((tb) => pill(x, 'blink', 540, 1300, 52, false, win(t, tb - 0.1, tb + 0.55, 0.15, 0.15) * 1.2, { f: 'Body', w: 800, bg: PINK, fg: WHT }));
  adBar(x, t);
  bigBlink(x, lidAt(t, [K.blinkA - 0.07, K.blinkB - 0.07]));
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
