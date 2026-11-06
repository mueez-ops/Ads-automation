// Browser-side scene for reel_tickle.js. Runs as a module after three.js (imported as X), the 2D kit and the phone engine
// (reel_phone_kit.js), whose globals it uses: W, H, g, IMG, clamp, lerp, sstep, ease, expo, eio, back, bump, jolt, mkc,
// rrx, setF, pill, phone, P, stage, rise, zoomAt, INK, WHT, GREY... It fills S and replaces the kit's captions with the
// Face ID reel's: at the top, building word by word (the hook card is all on screen from frame 1).
// 1 unit = 1 cm. A living room (y = 0): someone on the sofa tickling their own ribs, bored; the same person as an x-ray,
// the brain lit inside. A brain, magnified (y = 1000, built in mm). The 1999 lab (y = 2000): two robot arms on a table,
// a piece of foam over a palm, a monitor with the delay. Everything is our own illustration.

const BLUE = '#2F80FF', GOLD = '#E8B44A', PINK = '#FF3DA8', ORANGE = '#FF8A1F', CYAN = '#3FD0FF';
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
  q.addColorStop(0, '#B8C8DA'); q.addColorStop(0.5, '#3A3E46'); q.addColorStop(1, '#101114'); x.fillStyle = q; x.fillRect(0, 0, 256, 256);
  env.add(new X.Mesh(new X.SphereGeometry(50, 32, 16), new X.MeshBasicMaterial({ map: tex(c), side: X.BackSide })));
  const panel = (w, h, pos, col, v) => { const m = new X.Mesh(new X.PlaneGeometry(w, h), new X.MeshBasicMaterial({ color: new X.Color(col).multiplyScalar(v), side: X.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m); };
  panel(30, 10, [-6, 30, 14], '#FFF1DE', 4); panel(8, 26, [-34, 8, 10], '#FFD9A8', 2.0); panel(14, 8, [26, 12, -24], '#CFE2FF', 2.0);
  const pm = new X.PMREMGenerator(R3); scene.environment = pm.fromScene(env, 0.03).texture;
}
scene.environmentIntensity = 0.6;
const hemi = new X.HemisphereLight('#FFF2E0', '#5A4A3C', 0.9); scene.add(hemi);
const key = new X.DirectionalLight('#FFF0D8', 2.2); key.position.set(-300, 600, 500); scene.add(key, key.target);
const rim = new X.DirectionalLight('#BFD8FF', 1.0); rim.position.set(400, 300, -400); scene.add(rim, rim.target);
const MAT = (c, o = {}) => new X.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.6, metalness: o.m ?? 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, map: o.map || null, envMapIntensity: o.env ?? 1, side: o.side ?? X.FrontSide, transparent: !!o.tr, opacity: o.op ?? 1, depthWrite: o.dw ?? true });
const glowTex = (() => { const [c, x] = mkc(128, 128); const q = x.createRadialGradient(64, 64, 0, 64, 64, 64); q.addColorStop(0, 'rgba(255,255,255,1)'); q.addColorStop(0.3, 'rgba(255,255,255,.6)'); q.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = q; x.fillRect(0, 0, 128, 128); return tex(c); })();
const glowMat = (c, op = 1) => { const m = new X.SpriteMaterial({ map: glowTex, color: c, transparent: true, opacity: op, blending: X.AdditiveBlending, depthWrite: false }); m.toneMapped = false; return m; };

// ---------- people: the Mosquito reel's jointed toy figure, with fingers, eyelids and a laugh ----------
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
  if (o.hood) { const hd = new X.Mesh(new X.TorusGeometry(8.6, 3.6, 10, 28), topM); hd.rotation.x = Math.PI / 2 + 0.25; hd.position.set(0, 47, -1.5); hd.scale.set(1.05, 1, 0.85); spine.add(hd);
    [1, -1].forEach((sd) => { const s0 = new X.Mesh(new X.CylinderGeometry(0.5, 0.5, 11, 6), M2('#F2F2F2', { r: 0.7 })); s0.position.set(sd * 3, 37, 10.6); spine.add(s0); }); }
  if (o.collar) { const cl = new X.Mesh(new X.TorusGeometry(7.4, 2.2, 8, 24), M2(o.collar, { r: 0.8 })); cl.rotation.x = Math.PI / 2; cl.position.set(0, 47, 0); spine.add(cl); }
  const neck = new X.Group(); neck.position.y = 47; spine.add(neck); J.neck = neck;
  const nk = new X.Mesh(new X.CylinderGeometry(5, 5.6, 11, 12), skinM); nk.position.y = 4; neck.add(nk);
  const head = new X.Group(); head.position.y = 9; neck.add(head); J.head = head;
  const sk = new X.Mesh(new X.SphereGeometry(11.5, 32, 24), skinM); sk.scale.set(0.93, 1.08, 1); sk.position.y = 11; head.add(sk);
  [1, -1].forEach((sd) => { const e = new X.Mesh(new X.SphereGeometry(3.2, 12, 10), skinM); e.scale.set(0.45, 1, 0.72); e.position.set(sd * 10.4, 11, -0.6); head.add(e); });
  J.eyes = [1, -1].map((sd) => { const e = new X.Mesh(new X.SphereGeometry(1.75, 14, 10), darkM); e.position.set(sd * 4.1, 12.6, 10.0); head.add(e); return e; });
  J.lids = [1, -1].map((sd) => { const l0 = new X.Mesh(new X.SphereGeometry(2.1, 16, 10, 0, TAU, 0, Math.PI / 2), skinM); l0.position.set(sd * 4.1, 12.6, 10.0); head.add(l0); return l0; });
  J.brows = [1, -1].map((sd) => { const b = new X.Mesh(new X.BoxGeometry(4.6, 1.1, 1.2), hairM); b.position.set(sd * 4.2, 16.4, 9.9); head.add(b); return b; });
  const ns = new X.Mesh(new X.SphereGeometry(1.7, 12, 10), skinM); ns.scale.set(1, 1, 1.25); ns.position.set(0, 10.2, 11.4); head.add(ns);
  J.mouth = new X.Mesh(new X.CapsuleGeometry(0.85, 3.6, 4, 8), M2('#5A2A22', { r: 0.6 })); J.mouth.rotation.z = Math.PI / 2; J.mouth.position.set(0, 6.3, 10.3); head.add(J.mouth);
  J.laughM = new X.Group(); J.laughM.position.set(0, 7.2, 10.75); J.laughM.visible = false; head.add(J.laughM);
  { const d = new X.Mesh(new X.SphereGeometry(1, 24, 12, 0, TAU, Math.PI / 2, Math.PI / 2), M2('#3E1212', { r: 0.7, side: X.DoubleSide })); d.scale.set(3.4, 3.0, 0.7); J.laughM.add(d);
    const th = new X.Mesh(new X.BoxGeometry(5.2, 0.9, 0.4), M2('#F6F3EC', { r: 0.4 })); th.position.set(0, -0.45, 0.42); J.laughM.add(th);
    const tg = new X.Mesh(new X.SphereGeometry(1, 16, 10), M2('#D9606E', { r: 0.6 })); tg.scale.set(1.9, 0.9, 0.5); tg.position.set(0, -2.2, 0.25); J.laughM.add(tg); }
  const cap = (r, frac, col, sc = [0.97, 1.05, 1.03], rx = -0.3) => { const h0 = new X.Mesh(new X.SphereGeometry(r, 28, 18, 0, TAU, 0, Math.PI * frac), M2(col, { r: 0.8 })); h0.scale.set(...sc); h0.position.y = 11.5; h0.rotation.x = rx; head.add(h0); return h0; };
  if (['short', 'bun', 'curly', 'swoop'].includes(o.hairStyle)) cap(12.2, 0.5, o.hair);
  if (o.hairStyle === 'bun') { const b = new X.Mesh(new X.SphereGeometry(5.2, 16, 12), hairM); b.position.set(0, 22, -8); head.add(b); }
  if (o.hairStyle === 'swoop') { const b = new X.Mesh(new X.SphereGeometry(6.5, 16, 12), hairM); b.scale.set(1.5, 0.6, 1); b.position.set(3, 21.5, 6); b.rotation.z = -0.3; head.add(b); }
  if (o.hairStyle === 'curly') for (let i = 0; i < 9; i++) { const b = new X.Mesh(new X.SphereGeometry(4.2, 12, 10), hairM); const a = Math.PI * 0.62 + (i / 8) * Math.PI * 1.76; b.position.set(9.5 * Math.cos(a) * 0.9, 20 + 2.5 * Math.sin(i * 2.1), 9.5 * Math.sin(a) * 0.9 - 2); head.add(b); }
  if (o.glasses) [1, -1].forEach((sd) => { const gl = new X.Mesh(new X.TorusGeometry(2.9, 0.38, 8, 24), M2('#2A2A2E', { r: 0.3, m: 0.6 })); gl.position.set(sd * 4.1, 12.6, 11.2); head.add(gl); });
  ['l', 'r'].forEach((s, i) => { const sd = i ? -1 : 1;
    const sh = new X.Group(); sh.position.set(sd * 19.5, 42, 0); spine.add(sh);
    const up = new X.Mesh(new X.CapsuleGeometry(5.2, 22, 6, 12), topM); up.position.y = -12; sh.add(up);
    const el = new X.Group(); el.position.y = -25; sh.add(el);
    const fo = new X.Mesh(new X.CapsuleGeometry(4.6, 19, 6, 12), o.short ? skinM : topM); fo.position.y = -10.5; el.add(fo);
    const hand = new X.Group(); hand.position.y = -23; el.add(hand);
    const hm = new X.Mesh(new X.SphereGeometry(4.6, 14, 10), skinM); hm.scale.set(0.95, 1.05, 0.6); hm.position.y = -1.5; hand.add(hm);
    const fingers = [];
    for (let f = 0; f < 4; f++) { const fp = new X.Group(); fp.position.set((f - 1.5) * 2.05, -5.2, 0.4); hand.add(fp); const fm = new X.Mesh(new X.CapsuleGeometry(0.95, 3.6 - Math.abs(f - 1.5) * 0.5, 4, 8), skinM); fm.position.y = -2.3; fp.add(fm); fingers.push(fp); }
    const tp = new X.Group(); tp.position.set(sd * 3.6, -2.0, 1.4); tp.rotation.set(0.4, 0, sd * 0.9); hand.add(tp); const tm = new X.Mesh(new X.CapsuleGeometry(1.0, 2.8, 4, 8), skinM); tm.position.y = -2; tp.add(tm);
    J[s + 'Sh'] = sh; J[s + 'El'] = el; J[s + 'Hand'] = hand; J[s + 'Fingers'] = fingers; });
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
// poses: Euler angles per joint; y lowers the figure; face: lid 0 (open)..1 (shut), brow -1 (calm)..1 (pain), grin, laugh, flat (a straight mouth)
const STAND = { hips: Z3, spine: Z3, neck: Z3, head: Z3, lSh: [0, 0, 0.1], rSh: [0, 0, -0.1], lEl: [-0.18, 0, 0], rEl: [-0.18, 0, 0], lHip: [0, 0, 0.03], rHip: [0, 0, -0.03], lKnee: Z3, rKnee: Z3, lHand: Z3, rHand: Z3, y: 0, face: { lid: 0, brow: -0.2, grin: 0.15, laugh: 0, flat: 0 } };
const SIT = { ...STAND, lHip: [-1.5, 0, 0.06], rHip: [-1.5, 0, -0.06], lKnee: [1.5, 0, 0], rKnee: [1.5, 0, 0], y: -40 };
// tickling your own ribs: elbows out, fingertips on the sides of the chest, a bored face
const SELF = { ...SIT, spine: [-0.06, 0, 0], lSh: [0, 0, 1.386], rSh: [0, 0, -1.386], lEl: [0, 0, -2.765], rEl: [0, 0, 2.765], lHand: [0, 0, 0.45], rHand: [0, 0, -0.45], head: [0, 0.15, 0], face: { lid: 0.55, brow: 0.05, grin: 0, laugh: 0, flat: 1 } };
// the 1999 lab: leaning in, left hand on the first robot's handle, right forearm on the table, palm up
const LAB = { ...SIT, spine: [0.22, 0, 0], neck: [0.08, 0, 0], head: [0.12, 0, 0], lSh: [-1.335, 0, 0.1], lEl: [-0.718, 0, 0], rSh: [-1.335, 0, -0.1], rEl: [-0.456, 0, 0], face: { lid: 0.3, brow: -0.1, grin: 0.1, laugh: 0, flat: 0 } };
function addPose(A, d) { const out = { ...A, face: { ...A.face } }; Object.keys(d).forEach((j) => { if (j === 'y') out.y = (out.y || 0) + d.y; else if (j === 'face') Object.assign(out.face, d.face); else out[j] = (A[j] || Z3).map((v, i) => v + d[j][i]); }); return out; }
function setPose(p, Q, t = 0, wiggle = 0) {
  const J = p.userData; JOINTS.forEach((j) => J[j].rotation.set(...(Q[j] || Z3))); J.root.position.y = Q.y || 0;
  const f = Q.face || {}, lau = clamp(f.laugh || 0), lid = Math.max(clamp(f.lid || 0), 0.62 * lau), br = f.brow || 0;
  J.lids.forEach((l0) => { l0.visible = lid > 0.02; l0.rotation.x = lerp(-1.6, 1.5, lid); });
  J.brows.forEach((b, i) => { const sd = i ? -1 : 1; b.rotation.z = sd * (0.42 * br * (1 - lau) + 0.18 * lau); b.position.y = 16.4 + (1 - lau) * (-0.9 * Math.max(0, br) + 0.6 * Math.max(0, -br)) + 1.3 * lau; });
  const gr = f.grin || 0, fl = f.flat || 0;
  J.mouth.visible = lau < 0.15; J.mouth.scale.set((1 + 0.1 * gr) * (1 - 0.4 * fl), 1 + 0.3 * gr, 1); J.mouth.position.y = 6.3 + 0.4 * gr;
  J.laughM.visible = lau >= 0.15; J.laughM.scale.set(lerp(0.75, 1, lau), lerp(0.35, 1, lau), 1);
  ['lFingers', 'rFingers'].forEach((k0, s) => J[k0].forEach((fp, i) => { fp.rotation.x = 0.25 + wiggle * (0.5 + 0.45 * Math.sin(t * 26 + i * 1.3 + s * 2)); }));
}

// ---------- the living room (y = 0): a sofa against a warm wall; the back wall is z = -120 ----------
const ROOM = new X.Group(); scene.add(ROOM);
const FURN = new X.Group(); ROOM.add(FURN);
const floorTex = (() => { const [c, x] = noiseCanvas(512, 512, '#B78A5E', 0.06, 9000, 31); for (let i = 0; i < 8; i++) { x.fillStyle = `rgba(90,60,35,${0.18 + 0.1 * RN(i + 40)})`; x.fillRect(0, i * 64, 512, 3); } const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; t0.repeat.set(6, 6); return t0; })();
const rugTex = (() => { const [c, x] = noiseCanvas(512, 512, '#D9C9A8', 0.08, 12000, 37); x.strokeStyle = '#C0623A'; x.lineWidth = 18; x.strokeRect(30, 30, 452, 452); x.strokeStyle = '#2E6F78'; x.lineWidth = 8; x.strokeRect(70, 70, 372, 372); return tex(c); })();
const artTex = (() => { const [c, x] = mkc(256, 320); x.fillStyle = '#F4EBDD'; x.fillRect(0, 0, 256, 320); x.fillStyle = '#E8763A'; x.beginPath(); x.arc(128, 140, 70, 0, TAU); x.fill(); x.fillStyle = '#2E6F78'; x.fillRect(40, 210, 176, 60); return tex(c); })();
let YOU, BRAINMINI;
{
  const S0 = FURN;
  const fl = new X.Mesh(new X.PlaneGeometry(1400, 1200), MAT('#FFFFFF', { map: floorTex, r: 0.7 })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0, 300); S0.add(fl);
  const wl = new X.Mesh(new X.PlaneGeometry(1400, 600), MAT('#E9D7C2', { r: 0.95 })); wl.position.set(0, 300, -120); S0.add(wl);
  const sw = new X.Mesh(new X.PlaneGeometry(1200, 600), MAT('#E2CDB5', { r: 0.95 })); sw.rotation.y = Math.PI / 2; sw.position.set(-420, 300, 300); S0.add(sw);
  const rug = new X.Mesh(new X.PlaneGeometry(320, 220), MAT('#FFFFFF', { map: rugTex, r: 0.95 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.6, 60); S0.add(rug);
  const art = new X.Mesh(new X.PlaneGeometry(80, 100), MAT('#FFFFFF', { map: artTex, r: 0.8 })); art.position.set(-70, 150, -118); S0.add(art);
  const sofaM = MAT('#2E7D84', { r: 0.9 }), cushM = MAT('#3A949B', { r: 0.92 });
  const box = (w, h, d, x0, y0, z0, m) => { const b = new X.Mesh(new X.BoxGeometry(w, h, d, 2, 2, 2), m); b.position.set(x0, y0, z0); S0.add(b); return b; };
  box(230, 28, 59, 0, 14, -71.5, sofaM); box(230, 58, 22, 0, 57, -100, sofaM); box(24, 58, 72, -127, 29, -75, sofaM); box(24, 58, 72, 127, 29, -75, sofaM);
  [-52, 52].forEach((x0) => { const c0 = new X.Mesh(new X.CapsuleGeometry(9, 84, 6, 16), cushM); c0.rotation.z = Math.PI / 2; c0.scale.set(1, 1, 2.55); c0.position.set(x0, 36, -65); S0.add(c0); });
  const pillow = new X.Mesh(new X.SphereGeometry(18, 20, 14), MAT('#E8B44A', { r: 0.9 })); pillow.scale.set(1, 1, 0.45); pillow.position.set(92, 62, -84); pillow.rotation.z = 0.3; S0.add(pillow);
  const table = new X.Group(); table.position.set(0, 0, 70); S0.add(table); const tt0 = new X.Mesh(new X.CylinderGeometry(42, 42, 4, 40), MAT('#6B4A30', { r: 0.5 })); tt0.position.y = 40; table.add(tt0);
  [0, 1, 2].forEach((i) => { const a = i * TAU / 3, l0 = new X.Mesh(new X.CylinderGeometry(1.6, 1.6, 40, 8), MAT('#2A2A2E', { m: 0.6, r: 0.4 })); l0.position.set(30 * Math.cos(a), 20, 30 * Math.sin(a)); table.add(l0); });
  const mug = new X.Mesh(new X.CylinderGeometry(4, 3.6, 9, 20), MAT('#F2EFE8', { r: 0.4 })); mug.position.set(14, 46.5, 76); S0.add(mug);
  const lamp = new X.Group(); lamp.position.set(175, 0, -85); S0.add(lamp); const lp = new X.Mesh(new X.CylinderGeometry(1.5, 1.5, 150, 8), MAT('#2A2A2E', { m: 0.6 })); lp.position.y = 75; lamp.add(lp);
  const shade = new X.Mesh(new X.CylinderGeometry(16, 24, 28, 24, 1, true), new X.MeshStandardMaterial({ color: '#F6E6C8', emissive: '#FFD9A0', emissiveIntensity: 0.9, side: X.DoubleSide, roughness: 0.8 })); shade.position.y = 152; lamp.add(shade);
  const pot = new X.Mesh(new X.CylinderGeometry(16, 12, 30, 20), MAT('#C0623A', { r: 0.7 })); pot.position.set(-190, 15, -75); S0.add(pot);
  for (let i = 0; i < 9; i++) { const lf = new X.Mesh(new X.SphereGeometry(10, 12, 8), MAT('#3E7A3A', { r: 0.8 })); lf.scale.set(0.5, 1.6, 0.25); const a = i * TAU / 9; lf.position.set(-190 + 10 * Math.cos(a), 52 + 8 * RN(i + 70), -75 + 10 * Math.sin(a)); lf.rotation.set(0.5 * Math.sin(a), a, 0.5 * Math.cos(a)); S0.add(lf); }
  YOU = makePerson({ skin: '#E8B796', top: '#F2B633', bot: '#3A4458', hair: '#3A2A1C', hairStyle: 'swoop', hood: true, shoe: '#F2F2F2', h: 0.98 });
  YOU.position.set(0, 0, -75); ROOM.add(YOU);
  // the brain inside the head, for the x-ray (built in mm: 0.1 makes it 13 cm wide)
  BRAINMINI = new X.Group(); BRAINMINI.visible = false; YOU.userData.head.add(BRAINMINI); BRAINMINI.position.set(0, 15, -0.5); BRAINMINI.scale.setScalar(0.1);
}
const LAMPPT = new X.PointLight('#FFD39A', 0, 700, 1.0); LAMPPT.position.set(175, 150, -65); scene.add(LAMPPT);

// ---------- a brain, built in mm (about 134 wide, 164 long), used inside the head and magnified (y = 1000) ----------
function brainGeo(seed, sd) {   // one hemisphere: an ellipsoid with a flat inner face and a flatter base, folded by a few layers of waves
  const g0 = new X.SphereGeometry(1, 128, 96), n0 = new X.Vector3(), q = new X.Vector3(), nn = new X.Vector3();
  if (sd < 0) g0.rotateY(Math.PI);                       // the sphere's seam (at -x) goes to the hidden inner face
  const p = g0.attributes.position;
  for (let i = 0; i < p.count; i++) { n0.set(p.getX(i), p.getY(i), p.getZ(i)).normalize();
    const a = n0.x * sd > 0 ? 52 : 14, b = n0.y > 0 ? 45 : 28, c = 82;
    q.set(n0.x * a, n0.y * b, n0.z * c); nn.set(q.x / (a * a), q.y / (b * b), q.z / (c * c)).normalize();
    const f = Math.sin(n0.x * 13 + seed) * Math.sin(n0.y * 15 + 2 * seed) + 0.6 * Math.sin(n0.z * 20 + n0.y * 8 + seed) + 0.4 * Math.sin((n0.x + n0.z) * 27 + seed) + 0.35 * Math.sin(n0.y * 34 + n0.z * 21 + 3 * seed);
    q.addScaledVector(nn, 2.6 * Math.max(-0.8, f) * (n0.x * sd > 0 ? 1 : 0.25)); p.setXYZ(i, q.x, q.y, q.z); }
  g0.computeVertexNormals(); return g0;
}
const folia = (() => { const [c, x] = mkc(64, 512); for (let i = 0; i < 512; i++) { const v = 0.5 + 0.5 * Math.sin(i / 512 * TAU * 22); x.fillStyle = mixHex('#B8606F', '#EBA0AC', v).getStyle(); x.fillRect(0, i, 64, 1); } return tex(c); })();
const cortexM = new X.MeshPhysicalMaterial({ color: '#F2A9B4', roughness: 0.55, clearcoat: 0.4, clearcoatRoughness: 0.5, sheen: 0.4, sheenColor: new X.Color('#FFD6DC'), emissive: '#FF3DA8', emissiveIntensity: 0 });
const cerebM = new X.MeshPhysicalMaterial({ color: '#FFFFFF', map: folia, roughness: 0.5, clearcoat: 0.3, emissive: CYAN, emissiveIntensity: 0 });
function makeBrain() {
  const G = new X.Group();
  [1, -1].forEach((sd, i) => { const h0 = new X.Mesh(brainGeo(i * 1.7 + 0.4, sd), cortexM); h0.position.x = sd * 15; G.add(h0); });
  const cg = new X.SphereGeometry(1, 64, 48); cg.scale(46, 24, 30); const cb = new X.Mesh(cg, cerebM); cb.position.set(0, -28, -52); G.add(cb);
  const stem = new X.Mesh(new X.CylinderGeometry(9, 7, 46, 20), MAT('#E4A3AE', { r: 0.6 })); stem.position.set(0, -42, -18); stem.rotation.x = 0.35; G.add(stem);
  return G;
}
BRAINMINI.add(makeBrain());
const BRAINS = new X.Group(); BRAINS.position.set(0, 1000, 0); BRAINS.visible = false; scene.add(BRAINS);
const BIGB = makeBrain(); BRAINS.add(BIGB);
const SIGS = [];   // signals flying in, each a comet of six glows; they go grey (muted) as they arrive
for (let i = 0; i < 10; i++) for (let j = 0; j < 6; j++) { const s0 = new X.Sprite(glowMat(CYAN, 0.9)); s0.userData = { a: RN(i + 500) * TAU, e: RN(i + 501) * 1.0 - 0.3, ph: i / 10, j }; BRAINS.add(s0); SIGS.push(s0); }
const BKEY = new X.DirectionalLight('#FFF4EC', 0); BKEY.position.set(-160, 1240, 300); BKEY.target.position.set(0, 1000, 0); scene.add(BKEY, BKEY.target);
const BRIM = new X.DirectionalLight('#7AC8FF', 0); BRIM.position.set(240, 1080, -260); BRIM.target.position.set(0, 1000, 0); scene.add(BRIM, BRIM.target);

// ---------- the 1999 lab (y = 2000): a table (top at 76), two robot arms, a monitor; the subject sits at z = -50 facing +z ----------
const LABG = new X.Group(); LABG.position.set(0, 2000, 0); LABG.visible = false; scene.add(LABG);
const crt = mkc(512, 384), crtTex = tex(crt[0]);
function drawCRT(ms, t) {
  const [, x] = crt; x.fillStyle = '#05140A'; x.fillRect(0, 0, 512, 384);
  x.fillStyle = '#5CFF8A'; x.shadowColor = '#5CFF8A'; x.shadowBlur = 14; setF(x, '700 44px Mono', 2); x.textAlign = 'left';
  x.fillText('DELAY', 40, 100); setF(x, '800 124px Mono', 0); x.fillText(String(Math.round(ms)).padStart(3, ' ') + ' ms', 22, 250);
  setF(x, '500 30px Mono', 0); x.shadowBlur = 0; x.fillStyle = 'rgba(92,255,138,.7)'; x.fillText(Math.sin(t * 6) > 0 ? 'RUNNING _' : 'RUNNING', 40, 330);
  for (let y = 0; y < 384; y += 4) { x.fillStyle = 'rgba(0,0,0,.28)'; x.fillRect(0, y, 512, 2); }
  crtTex.needsUpdate = true;
}
let SUBJ, ROB1, ROB2, FOAM, HANDLE, SCREEN;
function makeRobot(col) {   // a desk robot arm: base, a column that turns, two links, a tip that stays pointing down
  const G = new X.Group(), m = MAT(col, { r: 0.35, m: 0.5 }), dk = MAT('#2A2C31', { r: 0.4, m: 0.6 });
  const base = new X.Mesh(new X.CylinderGeometry(9, 11, 6, 32), dk); base.position.y = 3; G.add(base);
  const yaw = new X.Group(); yaw.position.y = 6; G.add(yaw); const col0 = new X.Mesh(new X.CylinderGeometry(4.5, 5, 15, 24), m); col0.position.y = 7.5; yaw.add(col0);
  const sh = new X.Group(); sh.position.y = 15; yaw.add(sh); const j0 = new X.Mesh(new X.SphereGeometry(4.2, 20, 14), dk); sh.add(j0);
  const a1 = new X.Mesh(new X.BoxGeometry(3.2, 3.2, 24), m); a1.position.z = 12; sh.add(a1);
  const el = new X.Group(); el.position.z = 24; sh.add(el); const j1 = new X.Mesh(new X.SphereGeometry(3, 16, 12), dk); el.add(j1);
  const a2 = new X.Mesh(new X.BoxGeometry(2.4, 2.4, 20), m); a2.position.z = 10; el.add(a2);
  const tip = new X.Group(); tip.position.z = 20; el.add(tip); const j2 = new X.Mesh(new X.SphereGeometry(2, 14, 10), dk); tip.add(j2);
  G.userData = { yaw, sh, el, tip }; return G;
}
function aim(rob, T) {   // two-link IK, elbow up, to a target in LABG coordinates; the tip's +z points straight down
  const u = rob.userData, B = rob.position, dx = T[0] - B.x, dy = T[1] - (B.y + 21), dz = T[2] - B.z, l1 = 24, l2 = 20;
  u.yaw.rotation.y = Math.atan2(dx, dz);
  const h = Math.hypot(dx, dz), d = Math.min(Math.hypot(h, dy), l1 + l2 - 0.5), phi = Math.atan2(-dy, h);
  const al = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), ga = Math.acos(clamp((l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2), -1, 1));
  u.sh.rotation.x = phi - al; u.el.rotation.x = Math.PI - ga; u.tip.rotation.x = Math.PI / 2 - (phi - al + Math.PI - ga);
}
{
  const S0 = LABG;
  const fl = new X.Mesh(new X.PlaneGeometry(1200, 1000), MAT('#9A9A92', { r: 0.9 })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0, 100); S0.add(fl);
  const wl = new X.Mesh(new X.PlaneGeometry(1200, 500), MAT('#D9D2BE', { r: 0.95 })); wl.position.set(0, 250, -200); S0.add(wl);
  const shelf = new X.Mesh(new X.BoxGeometry(160, 6, 30), MAT('#7A6A54', { r: 0.7 })); shelf.position.set(-150, 170, -185); S0.add(shelf);
  for (let i = 0; i < 9; i++) { const bk = new X.Mesh(new X.BoxGeometry(6 + 4 * RN(i + 600), 26 + 10 * RN(i + 601), 20), MAT(['#7A3A2E', '#2E4A6A', '#3E5A3A', '#8A7A4A'][i % 4], { r: 0.8 })); bk.position.set(-215 + i * 15, 186, -185); S0.add(bk); }
  const top = new X.Mesh(new X.BoxGeometry(180, 4, 90), MAT('#E8E2D2', { r: 0.6 })); top.position.set(0, 74, 0); S0.add(top);
  [[-84, -40], [84, -40], [-84, 40], [84, 40]].forEach(([a, b]) => { const l0 = new X.Mesh(new X.BoxGeometry(4, 72, 4), MAT('#5A5E66', { m: 0.6, r: 0.4 })); l0.position.set(a, 36, b); S0.add(l0); });
  // the monitor: a beige CRT, turned toward the right of the table
  const mon = new X.Group(); mon.position.set(66, 76, -20); mon.rotation.y = 0.6; S0.add(mon);
  const bx = new X.Mesh(new X.BoxGeometry(40, 34, 36), MAT('#D8D0BA', { r: 0.6 })); bx.position.set(0, 19, -4); mon.add(bx);
  SCREEN = new X.Mesh(new X.PlaneGeometry(31, 23), new X.MeshBasicMaterial({ map: crtTex, toneMapped: false })); SCREEN.position.set(0, 20, 14.1); mon.add(SCREEN);
  const st = new X.Mesh(new X.BoxGeometry(18, 2, 16), MAT('#C9C2AE', { r: 0.6 })); st.position.y = 1; mon.add(st);
  // the subject on a chair (seat top 38)
  SUBJ = makePerson({ skin: '#F1C7A8', top: '#4E7A4A', bot: '#3A3F4A', hair: '#6A4A30', hairStyle: 'short', glasses: true, collar: '#E8E2D2', h: 0.96 });
  SUBJ.position.set(0, 0, -50); S0.add(SUBJ);
  const chair = new X.Group(); chair.position.set(0, 0, -54); S0.add(chair); const cM = MAT('#2E3A4A', { r: 0.6 });
  const seat = new X.Mesh(new X.BoxGeometry(44, 4, 42), cM); seat.position.y = 36; chair.add(seat); const bk = new X.Mesh(new X.BoxGeometry(44, 40, 4), cM); bk.position.set(0, 60, -22); bk.rotation.x = -0.08; chair.add(bk);
  [[-19, -18], [19, -18], [-19, 18], [19, 18]].forEach(([a, b]) => { const l0 = new X.Mesh(new X.CylinderGeometry(1.2, 1.2, 34, 8), MAT('#5A5E66', { m: 0.6, r: 0.4 })); l0.position.set(a, 17, b); chair.add(l0); });
  // robot 1 under the left hand (+x), robot 2 over the right palm (-x), both on the far side of the table
  ROB1 = makeRobot('#B8BEC6'); ROB1.position.set(40, 76, 30); S0.add(ROB1);
  HANDLE = new X.Mesh(new X.CylinderGeometry(1.3, 1.3, 11, 12), MAT('#1C1D20', { r: 0.5 })); HANDLE.rotation.x = Math.PI / 2; HANDLE.position.z = 5.5; ROB1.userData.tip.add(HANDLE);
  ROB2 = makeRobot('#B8BEC6'); ROB2.position.set(-40, 76, 30); S0.add(ROB2);
  const fg = new X.SphereGeometry(1, 20, 14); fg.scale(2.4, 2.4, 1.3); FOAM = new X.Mesh(fg, MAT('#F2D24A', { r: 0.98 })); FOAM.position.z = 2.6; ROB2.userData.tip.add(FOAM);
}
const LKEY = new X.DirectionalLight('#FFF6E8', 0); LKEY.position.set(-200, 2400, 300); LKEY.target.position.set(0, 2060, 0); scene.add(LKEY, LKEY.target);
const LFILL = new X.PointLight('#DDEBFF', 0, 600, 1.0); LFILL.position.set(80, 2160, 120); scene.add(LFILL);

// ---------- the camera: a new set-up about every second ----------
scene.updateMatrixWorld(true);
const VIEW = {
  sofa0: [[46, 112, 178], [0, 92, -75], 40], sofa1: [[40, 110, 158], [0, 93, -75], 40],
  tease0: [[-34, 2118, 50], [-19, 2085, 6], 40], tease1: [[-32, 2114, 44], [-19, 2085, 6], 40],
  giggle0: [[18, 2124, 50], [0, 2112, -38], 40], giggle1: [[14, 2122, 40], [0, 2113, -38], 40],
  xray0: [[30, 124, 70], [0, 108, -75], 40], xray1: [[24, 123, 56], [0, 109, -75], 40],
  signal0: [[52, 106, 128], [0, 96, -75], 40], signal1: [[47, 107, 116], [0, 97, -75], 40],
  dial0: [[18, 124, -6], [0, 118, -75], 40], dial1: [[14, 123, -16], [0, 118, -75], 40],
  lab0: [[130, 2190, 300], [5, 2088, 0], 40], lab1: [[112, 2182, 270], [5, 2088, 0], 40],
  rigs0: [[0, 2215, 190], [0, 2090, 12], 40], rigs1: [[0, 2206, 172], [0, 2090, 12], 40],
  lefthand0: [[72, 2106, 46], [23, 2088, 6], 40], lefthand1: [[66, 2104, 40], [23, 2088, 6], 40],
  palm0: [[-74, 2097, 34], [-19, 2086, 6], 40], palm1: [[-68, 2096, 30], [-19, 2086, 6], 40],
  crt0: [[121, 2097, 62], [74, 2096, -8], 40], crt1: [[116, 2097, 55], [74, 2096, -8], 40],
  flat0: [[-18, 2124, 52], [0, 2111, -38], 40], flat1: [[-14, 2123, 44], [0, 2112, -38], 40],
  crt20: [[124, 2101, 72], [74, 2096, -8], 40], crt21: [[117, 2099, 62], [74, 2096, -8], 40],
  laugh0: [[26, 2126, 56], [0, 2110, -38], 40], laugh1: [[20, 2124, 46], [0, 2111, -38], 40],
  brain0: [[300, 1090, 380], [0, 995, 0], 40], brain1: [[268, 1080, 338], [0, 995, 0], 40],
  brain20: [[-320, 1060, 330], [0, 995, 0], 40], brain21: [[-290, 1054, 296], [0, 995, 0], 40],
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
const ROOMSHOTS = ['sofa', 'xray', 'signal', 'dial'], LABSHOTS = ['tease', 'giggle', 'lab', 'rigs', 'lefthand', 'palm', 'crt', 'flat', 'crt2', 'laugh'];
const XRAY = (n) => n === 'xray' || n === 'signal' || n === 'dial';
function xray(p, on) {   // the figure turns to blue glass, the brain shows through
  p.userData.mats.forEach((m) => { if (!m.userData.orig) m.userData.orig = { c: m.color.clone(), o: m.opacity, t: m.transparent, e: m.emissive.clone(), ei: m.emissiveIntensity, dw: m.depthWrite };
    const o = m.userData.orig; if (on) { m.color.set('#8EC8FF'); m.transparent = true; m.opacity = 0.16; m.emissive.set('#2F80FF'); m.emissiveIntensity = 0.4; m.depthWrite = false; }
    else { m.color.copy(o.c); m.transparent = o.t; m.opacity = o.o; m.emissive.copy(o.e); m.emissiveIntensity = o.ei; m.depthWrite = o.dw; } m.needsUpdate = true; });
}
let XR = null;
const HZ = 7;                                                    // the hand's back-and-forth, rad/s
const delayAt = (t) => t < K.delayL ? 0 : 200 * ease(clamp((t - (K.two2 - 0.25)) / 0.4));
const toLab = (p) => LABG.worldToLocal(v3(p)).toArray();
function setWorld(t) {
  const n = shotName(t), onRoom = ROOMSHOTS.includes(n), onLab = LABSHOTS.includes(n), onBrain = n === 'brain' || n === 'brain2', xr = XRAY(n);
  ROOM.visible = onRoom; FURN.visible = onRoom && !xr; LABG.visible = onLab; BRAINS.visible = onBrain;
  hemi.intensity = onRoom ? (xr ? 0.25 : 0.95) : onLab ? 0.85 : 0.25; hemi.color.set(onLab ? '#F2F4F8' : '#FFF2E0');
  key.intensity = onRoom ? (xr ? 0.3 : 2.0) : 0; key.target.position.set(0, 80, -75);
  rim.intensity = onRoom ? (xr ? 1.6 : 0.8) : 0; rim.color.set(xr ? '#6FB0FF' : '#BFD8FF');
  LAMPPT.intensity = onRoom && !xr ? 900 : 0; LKEY.intensity = onLab ? 2.4 : 0; LFILL.intensity = onLab ? 700 : 0; BKEY.intensity = onBrain ? 2.6 : 0; BRIM.intensity = onBrain ? 2.4 : 0;
  scene.environmentIntensity = onLab ? 0.7 : xr ? 0.25 : 0.6;
  if (onRoom) {
    if (XR !== xr) { xray(YOU, xr); XR = xr; } BRAINMINI.visible = xr;
    const jig = Math.sin(t * 19), jig2 = Math.sin(t * 19 + 1.1);
    setPose(YOU, addPose(SELF, { head: [0.04 * Math.sin(t * 1.3), 0.08 * Math.sin(t * 0.9), 0], lEl: [0, 0, 0.07 * jig], rEl: [0, 0, -0.07 * jig2], lSh: [0, 0, 0.03 * jig2], rSh: [0, 0, -0.03 * jig] }), t, 1);
    cortexM.emissiveIntensity = xr ? 0.2 + 0.7 * bump(t, K.saw - 0.05, 0.5) : 0;
    cerebM.emissiveIntensity = xr ? 0.25 + 1.4 * bump(t, K.predicts - 0.05, 0.9) : 0;
    YOU.updateMatrixWorld(true);
  }
  if (onLab) {
    const d = delayAt(t) / 1000, a1 = Math.sin(t * HZ), a2 = Math.sin((t - d) * HZ); drawCRT(delayAt(t), t);
    const laughing = (n === 'giggle' && t > K.two - 0.05) || n === 'laugh', lk = n === 'laugh' ? clamp((t - K.feels + 0.05) / 0.2) : n === 'giggle' ? clamp((t - K.two) / 0.2) : 0;
    const shake = laughing ? 0.05 * Math.sin(t * 28) * lk : 0, bored = n === 'flat';
    setPose(SUBJ, addPose(LAB, { lSh: [0, 0, 0.13 * a1], spine: [-0.16 * lk + shake, 0, 0], head: [-0.32 * lk + shake, 0.1 * Math.sin(t * 9) * lk, 0], neck: [-0.1 * lk, 0, 0],
      face: { lid: bored ? 0.55 : laughing ? 0 : 0.3, flat: bored ? 1 : 0, laugh: lk, grin: laughing ? 0.4 : 0.1, brow: bored ? 0.05 : -0.1 } }), t, laughing ? 1 : 0);
    SUBJ.updateMatrixWorld(true);
    const J = SUBJ.userData, grip = toLab(wpos(J.lHand, [0, -3.5, 1.5])), palm = toLab(wpos(J.rHand, [0, -3.2, 3.0]));
    aim(ROB1, [grip[0], grip[1] + 5.5, grip[2]]);
    aim(ROB2, [palm[0] + 3.2 * a2, palm[1] + 3.9, palm[2] + 0.6 * a2]);
    LABG.updateMatrixWorld(true);
  }
  if (onBrain) {
    BIGB.rotation.y = (n === 'brain' ? -0.75 : 0.45) + 0.1 * (t - K.mutesL); BIGB.rotation.x = 0.08;
    cortexM.emissiveIntensity = 0.12; cerebM.emissiveIntensity = 0.2;
    SIGS.forEach((s0) => { const dd = s0.userData, u0 = ((t - K.mutesL) * 0.6 + dd.ph) % 1 - dd.j * 0.022, u = clamp(u0), r = lerp(320, 110, u);
      s0.position.set(r * Math.cos(dd.a) * Math.cos(dd.e), r * Math.sin(dd.e), r * Math.sin(dd.a) * Math.cos(dd.e)); s0.scale.setScalar(lerp(44, 22, u) * (1 - 0.12 * dd.j));
      const mt = clamp((u - 0.25) / 0.4); s0.material.opacity = (u0 < 0 ? 0 : 1) * 0.9 * Math.pow(1 - mt, 1.3) * (dd.j ? 0.8 * (1 - 0.15 * dd.j) : 1) * clamp(u / 0.08); s0.material.color.copy(mixHex(CYAN, '#4A525C', mt)); });
    BRAINS.updateMatrixWorld(true);
  }
  const c0 = camAt(t); cam.position.set(c0[0], c0[1], c0[2]); cam.lookAt(c0[3], c0[4], c0[5]); cam.fov = c0[6]; cam.aspect = W / H; cam.near = 1; cam.updateProjectionMatrix();
}

// ---------- 2D: backdrops, labels, small print ----------
function backdrop(x, t, n) {
  if (n === 'brain' || n === 'brain2') { const r0 = x.createRadialGradient(540, 860, 60, 540, 900, 1250); r0.addColorStop(0, '#1C2A44'); r0.addColorStop(1, '#05070C'); x.fillStyle = r0; x.fillRect(0, 0, W, H); return; }
  if (XRAY(n)) { const r0 = x.createRadialGradient(540, 900, 60, 540, 900, 1250); r0.addColorStop(0, '#0E2848'); r0.addColorStop(1, '#03060C'); x.fillStyle = r0; x.fillRect(0, 0, W, H);
    x.save(); x.globalAlpha = 0.12; x.strokeStyle = '#6FB0FF'; x.lineWidth = 2; for (let i = 0; i <= 12; i++) { x.beginPath(); x.moveTo(i * 90, 0); x.lineTo(i * 90, H); x.stroke(); } for (let j = 0; j <= 22; j++) { x.beginPath(); x.moveTo(0, j * 90); x.lineTo(W, j * 90); x.stroke(); } x.restore(); return; }
  x.fillStyle = LABSHOTS.includes(n) ? '#D9D2BE' : '#E9D7C2'; x.fillRect(0, 0, W, H);
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
function flash(x, t, t0, a = 0.85, d = 0.2, col = '255,248,235') { const u = t - t0; if (u < -0.04 || u > d) return; x.fillStyle = `rgba(${col},` + (u < 0 ? (u + 0.04) / 0.04 : 1 - u / d) * a + ')'; x.fillRect(0, 0, W, H); }
// how much tickle you feel: a bar, no numbers (the papers' ratings are not shown as data here)
function meter(x, t, v, k, str) {
  if (k <= 0) return; x.save(); x.globalAlpha = clamp(k); x.translate(540, 1440 + 30 * (1 - ease(k)));
  rrx(x, -300, -64, 600, 128, 64); x.fillStyle = 'rgba(0,0,0,.55)'; x.fill();
  setF(x, '700 32px Body', 0); x.fillStyle = WHT; x.textAlign = 'center'; x.fillText(str, 0, -14);
  rrx(x, -260, 8, 520, 26, 13); x.fillStyle = 'rgba(255,255,255,.18)'; x.fill();
  const col = v > 0.6 ? PINK : v > 0.3 ? GOLD : '#8E8E93'; rrx(x, -260, 8, Math.max(26, 520 * v), 26, 13); x.fillStyle = col; x.fill(); x.restore();
}
// cartoon tickle marks: three short arcs that flicker beside the wiggling fingers (side: +1 to the right on screen)
function marks(x, t, [px, py], side) {
  const ph = Math.floor(t * 12) % 2; x.save(); x.strokeStyle = 'rgba(255,255,255,.95)'; x.lineWidth = 8; x.lineCap = 'round'; x.shadowColor = 'rgba(0,0,0,.4)'; x.shadowBlur = 8;
  [62, 92].forEach((r0, i) => { const r = r0 + (ph ? 7 : 0) * (i ? -1 : 1), a0 = side > 0 ? -0.55 : Math.PI - 0.55; x.beginPath(); x.arc(px + side * 10, py, r, a0, a0 + 1.1); x.stroke(); });
  x.restore();
}
// the signal: touch going up the arm, the prediction coming down to meet it
function signals(x, t) {
  const J = YOU.userData, pts = [wpos(J.rHand, [0, -4, 0]), wpos(J.rEl), wpos(J.rSh), wpos(J.neck, [0, 4, 0]), wpos(J.head, [0, 13, -2])].map((p) => project(p));
  const len = [0]; for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const at = (s) => { s = clamp(s) * len[len.length - 1]; let i = 1; while (i < len.length - 1 && len[i] < s) i++; const u = (s - len[i - 1]) / Math.max(1, len[i] - len[i - 1]); return [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)]; };
  const k = ease((t - K.predL + 0.05) / 0.3); if (k <= 0) return;
  x.save(); x.globalAlpha = k; x.lineCap = 'round'; x.lineJoin = 'round';
  x.strokeStyle = 'rgba(160,210,255,.35)'; x.lineWidth = 10; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke();
  const tu = clamp((t - K.predicts) / 0.75), pu = clamp((t - (K.predicts + 0.1)) / 0.65), meet = 0.62, cancel = clamp((t - (K.touch + 0.35)) / 0.25);
  const dot = (p, col, r, a) => { if (a <= 0) return; x.save(); x.globalAlpha = k * a; x.shadowColor = col; x.shadowBlur = 30; x.fillStyle = col; x.beginPath(); x.arc(p[0], p[1], r, 0, TAU); x.fill(); x.restore(); };
  const tp = at(Math.min(meet, tu * meet / 0.9)), pp = at(1 - Math.min(1 - meet, pu * (1 - meet) / 0.9));
  dot(tp, ORANGE, 22 * (1 - 0.8 * cancel), 1 - cancel); dot(pp, CYAN, 22 * (1 - 0.8 * cancel), 1 - cancel);
  if (cancel > 0 && cancel < 1) { const c0 = at(meet); x.save(); x.globalAlpha = k * (1 - cancel); x.strokeStyle = WHT; x.lineWidth = 6; x.beginPath(); x.arc(c0[0], c0[1], 30 + 90 * cancel, 0, TAU); x.stroke(); x.restore(); }
  x.restore();
  const lt = at(0.08), lp = at(0.95);
  pill(x, 'touch', lt[0] + 30, lt[1] + 90, 38, false, (t - K.predicts - 0.05) / 0.25, { f: 'Body', w: 700, bg: ORANGE, fg: WHT });
  pill(x, 'prediction', lp[0] + 210, lp[1] - 30, 38, false, (t - K.predicts - 0.15) / 0.25, { f: 'Body', w: 700, bg: CYAN, fg: INK });
}
function dial(x, t) {   // "and turns it down": a volume knob on the touch
  const k = ease((t - K.turns + 0.12) / 0.25); if (k <= 0) return; const v = lerp(0.95, 0.12, ease(clamp((t - K.turns) / 0.55)));
  x.save(); x.globalAlpha = k; x.translate(540, 1330);
  x.beginPath(); x.arc(0, 0, 150, 0, TAU); x.fillStyle = 'rgba(0,0,0,.55)'; x.fill(); x.lineWidth = 14; x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineCap = 'round'; x.beginPath(); x.arc(0, 0, 120, 0.75 * Math.PI, 2.25 * Math.PI); x.stroke();
  x.strokeStyle = ORANGE; x.beginPath(); x.arc(0, 0, 120, 0.75 * Math.PI, 0.75 * Math.PI + 1.5 * Math.PI * v); x.stroke();
  const a = 0.75 * Math.PI + 1.5 * Math.PI * v; x.strokeStyle = WHT; x.lineWidth = 10; x.beginPath(); x.moveTo(0, 0); x.lineTo(84 * Math.cos(a), 84 * Math.sin(a)); x.stroke();
  setF(x, '700 30px Body', 0); x.fillStyle = WHT; x.textAlign = 'center'; x.fillText('touch felt', 0, 192); x.restore();
}

// ---------- the 3D shot ----------
function three(x, t, clean = false) {
  const n = shotName(t); backdrop(x, t, n);
  const shake = jolt(t, K.unlessL, 6) + jolt(t, K.feels, 7);
  x.save(); x.translate(shake, shake * 0.4);
  setWorld(t); R3.render(scene, cam); x.drawImage(glc, 0, 0);
  const scr = x.createLinearGradient(0, 0, 0, 640), sa = XRAY(n) || n.startsWith('brain') ? 0.2 : 0.36;
  scr.addColorStop(0, `rgba(0,0,0,${sa})`); scr.addColorStop(0.55, `rgba(0,0,0,${sa * 0.5})`); scr.addColorStop(1, 'rgba(0,0,0,0)'); if (!clean) { x.fillStyle = scr; x.fillRect(-40, -40, W + 80, 680); }
  if (clean) { x.restore(); return; }
  if (n === 'sofa') [YOU.userData.lHand, YOU.userData.rHand].forEach((hd, i) => marks(x, t, project(wpos(hd, [0, -6, 0])), i ? -1 : 1));
  if (n === 'sofa') label(x, wpos(YOU.userData.rHand, [0, -4, 0]), -150, 170, 'your own fingers', win(t, K.tickle - 0.05, K.unlessL, 0.2, 0.06), { bg: WHT, fg: INK });
  if (n === 'tease') label(x, wpos(FOAM), 120, -240, 'foam, moved by a robot', win(t, K.lands - 0.05, K.two, 0.2, 0.06), { bg: WHT, fg: INK });
  if (n === 'xray') label(x, wpos(YOU.userData.head, [0, 15, 0]), 150, -60, 'your brain', win(t, K.saw - 0.1, K.predL, 0.2, 0.06), { bg: CYAN, fg: INK });
  if (n === 'signal') signals(x, t);
  if (n === 'lab') label(x, [0, 2076, 45], 0, 130, 'UCL, London, 1999', win(t, K.london + 0.05, K.twoR, 0.2, 0.06), { bg: WHT, fg: INK });
  if (n === 'rigs') { label(x, wpos(ROB1.userData.el), 110, -200, 'robot 1', win(t, K.twoR, K.foamL, 0.2, 0.06), { bg: WHT, fg: INK }); label(x, wpos(ROB2.userData.el), -110, -200, 'robot 2', win(t, K.robots - 0.05, K.foamL, 0.2, 0.06), { bg: WHT, fg: INK }); }
  if (n === 'lefthand') label(x, wpos(HANDLE), 100, -260, 'you move this', win(t, K.move, K.other, 0.2, 0.06), { bg: WHT, fg: INK });
  if (n === 'palm') label(x, wpos(FOAM), -90, -280, 'foam on your palm', win(t, K.strokes, K.nodelayL, 0.2, 0.06), { bg: GOLD, fg: INK });
  if (n === 'laugh') label(x, wpos(SUBJ.userData.head, [-8, 6, 8]), -140, 260, 'feels like someone else', win(t, K.someone - 0.1, K.mutesL, 0.2, 0.06), { bg: PINK, fg: WHT });
  x.restore();
  if (n === 'tease' || n === 'giggle') pill(x, '+0.2 s', 540, 1330, 64, false, (t - K.lands) / 0.25, { f: 'Logo', w: 800, bg: PINK, fg: WHT });
  if (n === 'dial') dial(x, t);
  if (n === 'flat') meter(x, t, 0.12, (t - K.barely + 0.1) / 0.2, 'tickle felt');
  if (n === 'laugh') meter(x, t, lerp(0.12, 0.95, ease(clamp((t - K.feels) / 0.35))), (t - K.feels + 0.1) / 0.2, 'tickle felt');
  if (n === 'brain' || n === 'brain2') pill(x, 'muted', 540, 1400, 52, false, (t - K.mutes) / 0.25, { f: 'Body', w: 700, bg: '#55606A', fg: WHT });
  flash(x, t, K.feels, 0.22, 0.14, '255,170,220');
  const FP = [[K.sawL, K.robotsL, 'Your brain predicts the touch your own movements make and turns the response down (Blakemore, Wolpert & Frith, Nature Neuroscience, 1998).'],
    [K.robotsL, T0.feed, 'UCL, 1999: 16 people moved one robot arm while a second stroked foam across their palm. At a 200 ms delay the stroke felt as tickly as an external touch; 14 of 16 never noticed the delay (Blakemore, Frith & Wolpert, J Cogn Neurosci, 1999). Scenes are illustrations.']];
  FP.forEach(([a, b, str]) => smallPrint(x, str, win(t, a + 0.15, b - 0.05, 0.3, 0.15)));
}
S.site = three;

// ---------- the switch: our reel in a phone; ads the brain saw coming, muted; then a hook it didn't ----------
const PHN = { cy: 856, s: 0.64 };
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
function bottle(c, cx, cy, s0) {   // the placeholder product: a bottle with a label (yourbrand is a placeholder)
  c.save(); c.translate(cx, cy); c.scale(s0, s0);
  rrx(c, -70, -150, 140, 300, 40); const q = c.createLinearGradient(-70, 0, 70, 0); q.addColorStop(0, '#E0A458'); q.addColorStop(1, '#F2C37A'); c.fillStyle = q; c.fill();
  rrx(c, -30, -210, 60, 70, 12); c.fillStyle = '#2A2A2E'; c.fill(); rrx(c, -55, -40, 110, 90, 10); c.fillStyle = '#FFFFFF'; c.fill();
  setF(c, '800 26px Logo', -1); c.fillStyle = '#2A1A10'; c.textAlign = 'center'; c.fillText('yourbrand', 0, 12); c.restore();
}
// ad: 0 logo, 1 product, 2 shop now, 3 a hook nobody saw coming
function ad(c, t, kind) {
  const bg = [['#F2F2F7', '#D8D8E0'], ['#F6E2C8', '#E2B98E'], ['#E8EEF6', '#C8D4E6'], ['#1A1028', '#3A1A44']][kind], q = c.createLinearGradient(0, 0, 0, 1280);
  q.addColorStop(0, bg[0]); q.addColorStop(1, bg[1]); c.fillStyle = q; c.fillRect(0, 0, 600, 1280);
  c.textAlign = 'center';
  if (kind === 0) { c.beginPath(); c.arc(300, 500, 150, 0, TAU); c.fillStyle = '#2A1A10'; c.fill(); setF(c, '800 84px Logo', -2); c.fillStyle = WHT; c.fillText('yb', 300, 528); setF(c, '800 54px Logo', -1); c.fillStyle = '#2A1A10'; c.fillText('yourbrand', 300, 760); }
  if (kind === 1) { bottle(c, 300, 540, 1.3); setF(c, '700 40px Body', 0); c.fillStyle = '#2A1A10'; c.fillText('New formula', 300, 850); }
  if (kind === 2) { bottle(c, 300, 460, 1.0); rrx(c, 110, 740, 380, 110, 55); c.fillStyle = '#2F80FF'; c.fill(); setF(c, '800 50px Logo', 0); c.fillStyle = WHT; c.fillText('Shop now', 300, 812); }
  if (kind === 3) {   // the first line breaks the pattern: an ad that confesses
    setF(c, '800 66px Logo', -2); c.fillStyle = WHT; c.fillText('We made this', 300, 250); c.fillText('bottle too heavy.', 300, 326);
    bottle(c, 300, 640, 1.05);
    const k = ease((t - K.hook + 0.05) / 0.25);
    if (k > 0) { c.save(); c.globalAlpha = k; c.strokeStyle = BLUE; c.lineWidth = 6; c.strokeRect(36, 180, 528, 170); [[36, 180], [564, 350]].forEach(([a, b]) => { c.beginPath(); c.arc(a, b, 12, 0, TAU); c.fillStyle = WHT; c.fill(); c.lineWidth = 5; c.stroke(); }); c.restore();
      pill(c, 'the hook', 300, 400, 34, false, k, { f: 'Body', w: 700, bg: BLUE, fg: WHT }); }
  }
  const g0 = c.createLinearGradient(0, 760, 0, 1280); g0.addColorStop(0, 'rgba(0,0,0,0)'); g0.addColorStop(1, 'rgba(0,0,0,.5)'); c.fillStyle = g0; c.fillRect(0, 860, 600, 420);
  rail(c); acct(c, 'yourbrand', 'Sponsored', 'y', '#6B4226');
}
// the swipes: our reel, then ads 0..3, one per word
const SW = () => [K.logo - 0.12, K.product - 0.12, K.shop - 0.12, K.hookL - 0.08];
function feedUI(c, t) {
  const sw = SW(), cur = sw.filter((s) => t >= s).length, f = cur > 0 ? eio((t - sw[cur - 1]) / 0.22) : 1;   // 0: our reel; 1..4: ads 0..3
  const drawSlot = (j, dy) => { c.save(); c.translate(0, dy);
    if (j === 0) { c.drawImage(frozen(), -60, 0, 720, 1280); const q = c.createLinearGradient(0, 760, 0, 1280); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,.72)'); c.fillStyle = q; c.fillRect(0, 860, 600, 420); rail(c); acct(c, 'mezmedia_0', null, 'm.', '#111'); setF(c, '500 26px Body', 0); c.fillStyle = 'rgba(255,255,255,.9)'; c.textAlign = 'left'; c.fillText('You can’t tickle yourself. Unless…', 30, 1090); }
    else ad(c, t, j - 1);
    const mt = j >= 1 && j <= 3 ? clamp((t - (sw[j - 1] + 0.3)) / 0.2) : 0;   // muted: the brain saw it coming
    if (mt > 0) { c.fillStyle = `rgba(40,44,52,${0.6 * mt})`; c.fillRect(0, 0, 600, 1280); c.save(); c.globalAlpha = mt; c.translate(300, 620); c.fillStyle = 'rgba(0,0,0,.6)'; c.beginPath(); c.arc(0, 0, 90, 0, TAU); c.fill();
      c.fillStyle = WHT; c.beginPath(); c.moveTo(-44, -20); c.lineTo(-19, -20); c.lineTo(11, -45); c.lineTo(11, 45); c.lineTo(-19, 20); c.lineTo(-44, 20); c.closePath(); c.fill(); c.strokeStyle = WHT; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(28, -22); c.lineTo(60, 22); c.moveTo(60, -22); c.lineTo(28, 22); c.stroke(); c.restore(); }
    c.restore(); };
  if (f < 1 && cur > 0) drawSlot(cur - 1, -1280 * f);
  drawSlot(cur, cur > 0 ? 1280 * (1 - f) : 0);
}
function chips(x, t) {   // the ads it saw coming, in a row, muted; then the one it felt
  const names = ['logo', 'product', 'shop now'], sw = SW();
  names.forEach((nm, i) => { const k = ease((t - (sw[i] + 0.35)) / 0.25); if (k <= 0) return; x.save(); x.globalAlpha = k * (t > K.hookL ? 0.45 : 1); pill(x, nm, 540 + (i - 1) * 300, 1330, 40, false, 1, { f: 'Body', w: 700, bg: '#55606A', fg: WHT }); x.restore(); });
  if (t < K.delayW - 0.05) pill(x, 'muted', 540, 1460, 54, false, (t - K.muted + 0.05) / 0.25, { f: 'Body', w: 800, bg: '#2A2E36', fg: WHT });
  pill(x, 'felt', 540, 1460, 58, false, (t - K.delayW + 0.05) / 0.25, { f: 'Body', w: 800, bg: PINK, fg: WHT });
}
S.feed = (x, t) => {
  stage(x, true);
  if (!IMG.feedscr) IMG.feedscr = mkc(1200, 2560)[0];
  const k = eio((t - T0.feed) / 0.6), p = P(540, lerp(960, PHN.cy, k), PHN.s * Math.pow(1.8 / PHN.s, 1 - k));
  phone(x, p, 'feedscr', { frame: 'frameDark', shadow: k, over: (c) => feedUI(c, t) });
  chips(x, t);
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
const CAPY = 300, CAPS0 = 76;
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
