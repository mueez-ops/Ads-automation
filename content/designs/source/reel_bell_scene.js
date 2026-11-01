// Browser-side scene for reel_bell.js. Runs as a module after three.js (imported as X), the 2D kit and the phone engine
// (reel_phone_kit.js), whose globals it uses: W, H, g, IMG, clamp, lerp, sstep, ease, expo, eio, back, bump, jolt, mkc,
// rrx, setF, pill, phone, P, stage, rise, zoomAt, vignette, mixc, INK, WHT, GREY... It fills S and replaces the kit's
// captions with the Face ID reel's: at the top, building word by word.
// One graveyard at night (1 unit = 1 m): the hero grave at the origin, running along x, its headstone at the -x end and
// a bell on a post beside it; 1.8 m down, a coffin with a white-gloved hand, a cord from the hand up a pipe to the bell;
// other graves and bells behind, bare trees, an iron fence, the moon. In the set-ups marked X-ray the ground and the
// mound go see-through and the soil shows, so the coffin can be seen. At "Peace of mind" the night turns to sunrise.

const BLUE = '#2F80FF', RED = '#FF3B30', GREEN = '#22B455', GOLD = '#E8B44A';
const v3 = (a) => new X.Vector3(...a);
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const win = (t, a, b, fi = 0.25, fo = 0.25) => clamp((t - a) / Math.max(fi, 1e-4)) * (1 - clamp((t - b) / Math.max(fo, 1e-4)));
const tex = (c) => { const t = new X.CanvasTexture(c); t.colorSpace = X.SRGBColorSpace; t.anisotropy = 8; return t; };
const mixHex = (a, b, k) => { const A = new X.Color(a), B = new X.Color(b); return A.lerp(B, clamp(k)); };

// ---------- renderer, an environment for glass and wet things, lights ----------
const glc = document.getElementById('gl');
const R3 = new X.WebGLRenderer({ canvas: glc, antialias: true, alpha: true, preserveDrawingBuffer: true });
R3.setSize(W, H, false); R3.setClearColor(0x000000, 0);
R3.toneMapping = X.ACESFilmicToneMapping; R3.toneMappingExposure = 1.05; R3.outputColorSpace = X.SRGBColorSpace;
const scene = new X.Scene();
const cam = new X.PerspectiveCamera(40, W / H, 0.02, 1200);
{
  const env = new X.Scene();
  const [c, x] = mkc(256, 256), q = x.createLinearGradient(0, 0, 0, 256);
  q.addColorStop(0, '#9FB6C8'); q.addColorStop(0.5, '#2B3540'); q.addColorStop(1, '#0B0D10'); x.fillStyle = q; x.fillRect(0, 0, 256, 256);
  env.add(new X.Mesh(new X.SphereGeometry(50, 32, 16), new X.MeshBasicMaterial({ map: tex(c), side: X.BackSide })));
  const panel = (w, h, pos, col, v) => { const m = new X.Mesh(new X.PlaneGeometry(w, h), new X.MeshBasicMaterial({ color: new X.Color(col).multiplyScalar(v), side: X.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m); };
  panel(30, 10, [-6, 30, 14], '#FFF1DE', 5); panel(8, 26, [-34, 8, 10], '#FFD9A8', 2.4); panel(14, 8, [26, 12, -24], '#CFE2FF', 2.4); panel(6, 18, [32, 6, 18], '#FFFFFF', 1.8);
  const pm = new X.PMREMGenerator(R3); scene.environment = pm.fromScene(env, 0.03).texture;
}
const hemi = new X.HemisphereLight('#CFE8FF', '#0A1622', 0.6); scene.add(hemi);
const sun = new X.DirectionalLight('#FFF0D8', 2.4); sun.position.set(-20, 40, 18); scene.add(sun);
const rim = new X.DirectionalLight('#8FC4FF', 1.4); rim.position.set(16, 10, -20); scene.add(rim);
const MAT = (c, o = {}) => new X.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.5, metalness: o.m ?? 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, map: o.map || null, envMapIntensity: o.env ?? 1, side: o.side ?? X.FrontSide, transparent: !!o.tr, opacity: o.op ?? 1, depthWrite: o.dw ?? true });
const glowTex = (() => { const [c, x] = mkc(128, 128); const q = x.createRadialGradient(64, 64, 0, 64, 64, 64); q.addColorStop(0, 'rgba(255,255,255,1)'); q.addColorStop(0.3, 'rgba(255,240,215,.7)'); q.addColorStop(1, 'rgba(255,200,140,0)'); x.fillStyle = q; x.fillRect(0, 0, 128, 128); return tex(c); })();
const bubbleTex = (() => { const [c, x] = mkc(64, 64); x.strokeStyle = 'rgba(220,245,255,.95)'; x.lineWidth = 3; x.beginPath(); x.arc(32, 32, 26, 0, TAU); x.stroke(); x.fillStyle = 'rgba(255,255,255,.9)'; x.beginPath(); x.arc(22, 22, 6, 0, TAU); x.fill(); x.fillStyle = 'rgba(180,230,255,.15)'; x.beginPath(); x.arc(32, 32, 25, 0, TAU); x.fill(); return tex(c); })();
const glowMat = (c, op = 1) => new X.SpriteMaterial({ map: glowTex, color: c, transparent: true, opacity: op, blending: X.AdditiveBlending, depthWrite: false, fog: false });
const RN = (n) => { let h = Math.imul((n | 0) ^ 0x9E3779B9, 0x85EBCA6B); h ^= h >>> 13; h = Math.imul(h, 0xC2B2AE35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };   // hashed: no lines in the noise
const noiseCanvas = (w, h, base, amp, n = 9000, seed = 1) => {
  const [c, x] = mkc(w, h); x.fillStyle = base; x.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) { const v = RN(seed * 100000 + i) < 0.5 ? 255 : 0; x.fillStyle = `rgba(${v},${v},${v},${amp * RN(seed * 100000 + i + 7)})`; x.fillRect(RN(seed * 100000 + i + 3) * w, RN(seed * 100000 + i + 5) * h, 2, 2); }
  return [c, x];
};

// ---------- the graveyard: ground, mist, a moon, bare trees, an iron fence ----------
const YARD = new X.Group(); scene.add(YARD);
const grassTex = (() => {
  const [c, x] = noiseCanvas(512, 512, '#2B3328', 0.12, 26000, 3);
  for (let i = 0; i < 2600; i++) { x.strokeStyle = `rgba(${RN(i + 5) < 0.5 ? '70,86,60' : '18,22,16'},${0.3 + 0.4 * RN(i + 6)})`; x.lineWidth = 1; const gx = 512 * RN(i + 7), gy = 512 * RN(i + 8); x.beginPath(); x.moveTo(gx, gy); x.lineTo(gx + 3 * (RN(i + 9) - 0.5), gy - 4 - 6 * RN(i + 10)); x.stroke(); }
  const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; t0.repeat.set(60, 60); return t0;
})();
const groundMat = MAT('#FFFFFF', { map: grassTex, r: 0.95, env: 0.25 });
const GROUND = new X.Mesh(new X.PlaneGeometry(240, 240), groundMat); GROUND.rotation.x = -Math.PI / 2; YARD.add(GROUND);
const dirtTex = (() => { const [c, x] = noiseCanvas(256, 256, '#3A2A1E', 0.18, 9000, 4); for (let i = 0; i < 120; i++) { x.fillStyle = `rgba(${RN(i) < 0.5 ? '90,70,50' : '20,14,10'},.6)`; x.beginPath(); x.arc(256 * RN(i + 1), 256 * RN(i + 2), 1 + 4 * RN(i + 3), 0, TAU); x.fill(); } return tex(c); })();
const stoneTex = (() => { const [c, x] = noiseCanvas(256, 256, '#8E8C86', 0.14, 9000, 5); for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(60,80,50,${0.15 * RN(i + 20)})`; x.beginPath(); x.arc(256 * RN(i + 21), 256 * RN(i + 22), 6 + 20 * RN(i + 23), 0, TAU); x.fill(); } return tex(c); })();
const stoneMat = MAT('#FFFFFF', { map: stoneTex, r: 0.85, env: 0.4 });
const MOON = new X.Sprite(glowMat('#E8F0FF', 1)); MOON.scale.setScalar(26); MOON.position.set(-55, 38, -95); YARD.add(MOON);
const MOONCORE = new X.Sprite(new X.SpriteMaterial({ color: '#F4F7FF', fog: false, transparent: true, opacity: 1, map: (() => { const [c, x] = mkc(128, 128); x.fillStyle = '#F4F7FF'; x.beginPath(); x.arc(64, 64, 60, 0, TAU); x.fill(); x.fillStyle = 'rgba(160,170,190,.35)'; [[48, 50, 12], [80, 72, 9], [60, 88, 7]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a, b, r, 0, TAU); x.fill(); }); return tex(c); })() }));
MOONCORE.scale.setScalar(9); MOONCORE.position.copy(MOON.position); YARD.add(MOONCORE);
const SUNR = new X.Sprite(glowMat('#FFD08A', 0)); SUNR.scale.setScalar(60); SUNR.position.set(70, 3, -110); YARD.add(SUNR);
const MIST = Array.from({ length: 28 }, (_, i) => { const s0 = new X.Sprite(new X.SpriteMaterial({ map: glowTex, color: '#C9D6EA', transparent: true, opacity: 0.14 + 0.1 * R(i + 30), depthWrite: false })); s0.scale.set(6 + 6 * R(i + 31), 1.2 + R(i + 32), 1); s0.position.set((R(i + 33) - 0.5) * 30, 0.3 + 0.4 * R(i + 34), -14 + 18 * R(i + 35)); YARD.add(s0); return s0; });
function tree(x0, z0, seed) {
  const G = new X.Group(), bark = MAT('#16130F', { r: 0.95 });
  const branch = (from, dir, len, rad, depth) => {
    const to = from.clone().addScaledVector(dir, len);
    const m = new X.Mesh(new X.CylinderGeometry(rad * 0.65, rad, len, 7), bark); m.position.copy(from).add(to).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(v3([0, 1, 0]), dir.clone().normalize()); G.add(m);
    if (depth <= 0) return;
    const n = depth > 2 ? 2 : 3;
    for (let k = 0; k < n; k++) {
      const a = R(seed * 97 + depth * 13 + k * 7) * TAU, tilt = 0.45 + 0.4 * R(seed * 31 + depth * 3 + k);
      const nd = dir.clone().multiplyScalar(Math.cos(tilt)).add(v3([Math.cos(a) * Math.sin(tilt), 0.15, Math.sin(a) * Math.sin(tilt)])).normalize();
      branch(to, nd, len * (0.62 + 0.15 * R(seed + k + depth)), rad * 0.62, depth - 1);
    }
  };
  branch(v3([0, 0, 0]), v3([0.05, 1, 0]), 2.6 + R(seed) * 1.4, 0.22, 4);
  G.position.set(x0, 0, z0); YARD.add(G); return G;
}
[[-9, -9, 1], [8.5, -11, 2], [-14, -15, 3], [13, -6, 4], [3.5, -16, 5]].forEach(([a, b, s0]) => tree(a, b, s0));
{
  const iron = MAT('#121315', { m: 0.6, r: 0.5 }), bars = new X.InstancedMesh(new X.CylinderGeometry(0.018, 0.018, 1.5, 6), iron, 120), m4 = new X.Matrix4();
  for (let i = 0; i < 120; i++) { m4.makeTranslation(-15 + i * 0.25, 0.75, -17); bars.setMatrixAt(i, m4); } YARD.add(bars);
  [0.25, 1.35].forEach((y) => { const r0 = new X.Mesh(new X.BoxGeometry(30, 0.04, 0.04), iron); r0.position.set(0, y, -17); YARD.add(r0); });
}
function headstone(x0, z0, kind, rotY = 0, s = 1) {
  const G = new X.Group(); let m;
  if (kind === 0) { const sh = new X.Shape(); sh.moveTo(-0.3, 0); sh.lineTo(0.3, 0); sh.lineTo(0.3, 0.62); sh.absarc(0, 0.62, 0.3, 0, Math.PI, false); sh.lineTo(-0.3, 0);
    m = new X.Mesh(new X.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2, curveSegments: 18 }), stoneMat); m.position.z = -0.06; }
  else if (kind === 1) { m = new X.Group(); const a = new X.Mesh(new X.BoxGeometry(0.14, 1.1, 0.12), stoneMat); a.position.y = 0.55; const b = new X.Mesh(new X.BoxGeometry(0.62, 0.14, 0.12), stoneMat); b.position.y = 0.78; m.add(a, b); }
  else { m = new X.Mesh(new X.CylinderGeometry(0.1, 0.2, 1.4, 4), stoneMat); m.position.y = 0.7; m.rotation.y = Math.PI / 4; }
  G.add(m); const base = new X.Mesh(new X.BoxGeometry(0.75, 0.1, 0.32), stoneMat); base.position.y = 0.05; G.add(base);
  G.position.set(x0, 0, z0); G.rotation.set(0.04 * (R(x0 * 7 + z0) - 0.5), rotY, 0.06 * (R(x0 + z0 * 3) - 0.5)); G.scale.setScalar(s); YARD.add(G); return G;
}
// the bell on its post: a brass bell under a little roof, its cord going down to a pipe into the grave
const brass = MAT('#C99A48', { m: 1, r: 0.28 }), wood = MAT('#3B2A1C', { r: 0.85 });
function bellPost(x0, z0, scale = 1) {
  const G = new X.Group(); G.position.set(x0, 0, z0); G.scale.setScalar(scale);
  const post = new X.Mesh(new X.BoxGeometry(0.08, 1.38, 0.08), wood); post.position.y = 0.69; G.add(post);
  const arm = new X.Mesh(new X.BoxGeometry(0.42, 0.05, 0.06), wood); arm.position.set(0.18, 1.33, 0); G.add(arm);
  [-1, 1].forEach((sd) => { const rf = new X.Mesh(new X.BoxGeometry(0.5, 0.02, 0.24), wood); rf.position.set(0.2, 1.43, sd * 0.07); rf.rotation.x = sd * 0.5; G.add(rf); });
  const SW = new X.Group(); SW.position.set(0.3, 1.3, 0); G.add(SW);
  const prof = [[0, 0], [0.03, 0], [0.05, -0.02], [0.06, -0.07], [0.075, -0.14], [0.1, -0.2], [0.11, -0.215], [0.105, -0.22]].map(([a, b]) => new X.Vector2(a, b));
  const bell = new X.Mesh(new X.LatheGeometry(prof, 40), new X.MeshStandardMaterial({ color: '#C99A48', metalness: 1, roughness: 0.28, side: X.DoubleSide })); SW.add(bell);
  const clap = new X.Mesh(new X.SphereGeometry(0.022, 12, 8), MAT('#3A3026', { m: 0.7, r: 0.4 })); clap.position.y = -0.19; SW.add(clap);
  const ring = new X.Mesh(new X.TorusGeometry(0.02, 0.006, 6, 12), brass); ring.position.y = 0.012; SW.add(ring);
  YARD.add(G); return { G, SW, bell, top: () => SW.localToWorld(v3([0, 0, 0])).toArray(), mouth: () => SW.localToWorld(v3([0, -0.2, 0])).toArray() };
}
// the hero grave at the origin: a mound, a headstone, the bell post, the pipe to the coffin
const MOUND = new X.Mesh(new X.SphereGeometry(1, 40, 20, 0, TAU, 0, Math.PI / 2), MAT('#FFFFFF', { map: dirtTex, r: 0.95 })); MOUND.scale.set(1.15, 0.3, 0.55); YARD.add(MOUND);
const HEAD = headstone(-1.55, -0.1, 0, Math.PI / 2, 1.05);
const BP = bellPost(-1.42, 0.5);
const PIPE_TOP = [-0.95, 0.32, 0.18], PIPE_BOT = [-0.7, -1.56, 0.12];
const PIPE = new X.Mesh(new X.CylinderGeometry(0.055, 0.055, 1, 16), MAT('#2C2B29', { m: 0.7, r: 0.45 }));
{ const a = v3(PIPE_TOP), b = v3(PIPE_BOT); PIPE.position.copy(a).add(b).multiplyScalar(0.5); PIPE.scale.y = a.distanceTo(b); PIPE.quaternion.setFromUnitVectors(v3([0, 1, 0]), a.clone().sub(b).normalize()); YARD.add(PIPE); }
const HATCH = new X.Mesh(new X.CylinderGeometry(0.075, 0.075, 0.03, 18), MAT('#3A3936', { m: 0.7, r: 0.4 })); HATCH.position.set(...PIPE_TOP); HATCH.position.y += 0.02; YARD.add(HATCH);
// other graves, some with bells
const GRAVES = [];
for (let i = 0; i < 26; i++) {
  const gx = -13 + 26 * R(i + 400), gz = -15 + 13 * R(i + 401);
  if (Math.abs(gx) < 3.2 && gz > -4) continue;
  GRAVES.push({ x: gx, z: gz, stone: headstone(gx, gz, i % 3, Math.PI / 2 + 0.3 * (R(i + 402) - 0.5), 0.85 + 0.35 * R(i + 403)) });
}
const BELLS = [BP, ...GRAVES.filter((_, i) => i % 3 === 0).slice(0, 8).map((q, i) => bellPost(q.x + 0.25, q.z + 0.45, 0.95 + 0.1 * R(i + 410)))];
// underground: a coffin, a pillow, a white-gloved hand on the cord, the soil seen through
const COF = new X.Group(); COF.position.set(0.1, -1.8, 0); YARD.add(COF);
const woodC = MAT('#5A3A22', { r: 0.7, env: 0.4 }), woodLid = MAT('#6A4628', { r: 0.7, env: 0.4 });
const edgeMat = new X.LineBasicMaterial({ color: '#86BCFF', transparent: true, opacity: 0, depthWrite: false });
const edged = (mesh, parent) => { const e = new X.LineSegments(new X.EdgesGeometry(mesh.geometry, 25), edgeMat); e.position.copy(mesh.position); e.rotation.copy(mesh.rotation); e.scale.copy(mesh.scale); parent.add(e); return mesh; };
{
  const sh = new X.Shape(); [[-0.95, -0.2], [-0.55, -0.31], [0.95, -0.18], [0.95, 0.18], [-0.55, 0.31], [-0.95, 0.2]].forEach(([a, b], i) => (i ? sh.lineTo(a, b) : sh.moveTo(a, b))); sh.lineTo(-0.95, -0.2);
  const hole = new X.Path(); [[-0.88, -0.15], [-0.53, -0.25], [0.88, -0.13], [0.88, 0.13], [-0.53, 0.25], [-0.88, 0.15]].forEach(([a, b], i) => (i ? hole.lineTo(a, b) : hole.moveTo(a, b))); hole.lineTo(-0.88, -0.15); sh.holes.push(hole);
  const walls = new X.Mesh(new X.ExtrudeGeometry(sh, { depth: 0.42, bevelEnabled: false }), woodC); walls.rotation.x = -Math.PI / 2; COF.add(walls); edged(walls, COF);
  const sh2 = new X.Shape(); [[-0.95, -0.2], [-0.55, -0.31], [0.95, -0.18], [0.95, 0.18], [-0.55, 0.31], [-0.95, 0.2]].forEach(([a, b], i) => (i ? sh2.lineTo(a, b) : sh2.moveTo(a, b)));
  const bottom = new X.Mesh(new X.ExtrudeGeometry(sh2, { depth: 0.03, bevelEnabled: false }), woodC); bottom.rotation.x = -Math.PI / 2; COF.add(bottom);
  const pillow = new X.Mesh(new X.SphereGeometry(1, 20, 12), MAT('#E9E4DA', { r: 0.9 })); pillow.scale.set(0.16, 0.06, 0.2); pillow.position.set(-0.75, 0.08, 0); COF.add(pillow);
  const satin = new X.Mesh(new X.BoxGeometry(1.75, 0.01, 0.42), MAT('#D8D2C8', { r: 0.8 })); satin.position.set(0, 0.035, 0); COF.add(satin);
}
const LIDP = new X.Group(); LIDP.position.set(0, 0.43, -0.31); COF.add(LIDP);          // the hinge, on the far side
const LID = new X.Group(); LID.position.set(0, 0, 0.31); LIDP.add(LID);
{
  const sh = new X.Shape(); [[-0.95, -0.2], [-0.55, -0.31], [0.95, -0.18], [0.95, 0.18], [-0.55, 0.31], [-0.95, 0.2]].forEach(([a, b], i) => (i ? sh.lineTo(a, b) : sh.moveTo(a, b)));
  const lid = new X.Mesh(new X.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: false }), woodLid); lid.rotation.x = -Math.PI / 2; LID.add(lid); edged(lid, LID);
}
const NAILS = [[-0.7, 0.2], [0.2, -0.15], [0.75, 0.12]].map(([a, b]) => { const n = new X.Mesh(new X.CylinderGeometry(0.012, 0.004, 0.08, 6), MAT('#8A8A8A', { m: 1, r: 0.4 })); n.position.set(a, 0.08, b); LID.add(n); return n; });
const glove = MAT('#E5BE98', { r: 0.6 });                // the hand (skin, like the face)
const HAND = new X.Group(); HAND.position.set(-0.1, 0.272, 0.07); COF.add(HAND);
const FINGERS = [];
{
  const palm = new X.Mesh(new X.SphereGeometry(1, 20, 14), glove); palm.scale.set(0.07, 0.026, 0.055); HAND.add(palm);
  for (let k = 0; k < 4; k++) { const f = new X.Group(); f.position.set(0.06, 0, -0.04 + k * 0.027); const seg = new X.Mesh(new X.CapsuleGeometry(0.012, 0.05, 4, 8), glove); seg.rotation.z = Math.PI / 2; seg.position.x = 0.03; f.add(seg); HAND.add(f); FINGERS.push(f); }
  const th = new X.Mesh(new X.CapsuleGeometry(0.013, 0.04, 4, 8), glove); th.position.set(0.02, 0, 0.055); th.rotation.set(0, -0.8, Math.PI / 2); HAND.add(th);
  const cuff = new X.Mesh(new X.CylinderGeometry(0.05, 0.055, 0.06, 16), MAT('#F1EFEA', { r: 0.6 })); cuff.rotation.z = Math.PI / 2; cuff.position.x = -0.09; HAND.add(cuff);
}
// the man inside, in his best suit: eyes shut until "wasn't dead!"
const skin = MAT('#E5BE98', { r: 0.6 }), suit = MAT('#2A2D35', { r: 0.7 }), shoeM = MAT('#121014', { r: 0.45 }), hairM = MAT('#2A1E16', { r: 0.8 });
const HEADG = new X.Group(); HEADG.position.set(-0.7, 0.19, 0); COF.add(HEADG);
const EYES = [], LASHES = [], BROWS = [];
let MOUTH;
{
  const head = new X.Mesh(new X.SphereGeometry(0.095, 32, 20), skin); head.scale.set(1.08, 1, 0.92); HEADG.add(head);
  const hair = new X.Mesh(new X.SphereGeometry(0.1, 32, 16, 0, TAU, 0, Math.PI * 0.42), hairM); hair.rotation.z = Math.PI / 2; hair.scale.set(1, 1.08, 0.93); HEADG.add(hair);
  [-1, 1].forEach((sd) => {
    const E = new X.Group(); E.position.set(-0.012, 0.079, sd * 0.034); HEADG.add(E); EYES.push(E);
    const white = new X.Mesh(new X.SphereGeometry(0.021, 16, 12), MAT('#F7F5F0', { r: 0.3 })); white.scale.set(0.85, 0.62, 1.05); E.add(white);
    const pupil = new X.Mesh(new X.SphereGeometry(0.0085, 12, 8), MAT('#0E0D10', { r: 0.2 })); pupil.position.set(0, 0.011, 0); E.add(pupil);
    const lash = new X.Mesh(new X.BoxGeometry(0.005, 0.004, 0.036), shoeM); lash.position.set(-0.012, 0.09, sd * 0.034); lash.rotation.x = sd * 0.35; HEADG.add(lash); LASHES.push(lash);
    const brow = new X.Mesh(new X.BoxGeometry(0.009, 0.007, 0.036), hairM); brow.position.set(-0.044, 0.083, sd * 0.036); brow.rotation.x = sd * 0.4; HEADG.add(brow); BROWS.push(brow);
    const ear = new X.Mesh(new X.SphereGeometry(1, 12, 8), skin); ear.scale.set(0.026, 0.034, 0.012); ear.position.set(0.0, 0.0, sd * 0.088); HEADG.add(ear);
  });
  const nose = new X.Mesh(new X.SphereGeometry(0.017, 12, 8), skin); nose.scale.set(1.3, 0.9, 0.9); nose.position.set(0.022, 0.093, 0); HEADG.add(nose);
  MOUTH = new X.Mesh(new X.SphereGeometry(1, 16, 8), MAT('#4A1A1A', { r: 0.6 })); MOUTH.position.set(0.06, 0.078, 0); MOUTH.rotation.z = -0.55; HEADG.add(MOUTH);
}
const BODY = new X.Group(); COF.add(BODY);
const ELBOW = v3([-0.3, 0.17, 0.205]), SHOULDER = v3([-0.53, 0.175, 0.185]);
const limb = (r, m) => { const g = new X.Mesh(new X.CylinderGeometry(r, r, 1, 14), m); BODY.add(g); return g; };
const placeLimb = (mesh, a, b) => { mesh.position.copy(a).add(b).multiplyScalar(0.5); mesh.scale.set(1, a.distanceTo(b), 1); mesh.quaternion.setFromUnitVectors(v3([0, 1, 0]), b.clone().sub(a).normalize()); };
const UPPER = limb(0.044, suit), FORE = limb(0.04, suit);
{
  const torso = new X.Mesh(new X.CapsuleGeometry(0.12, 0.42, 8, 20), suit); torso.rotation.z = Math.PI / 2; torso.scale.set(0.78, 1, 1.5); torso.position.set(-0.28, 0.155, 0); BODY.add(torso);
  [-1, 1].forEach((sd) => {
    const leg = new X.Mesh(new X.CapsuleGeometry(0.058, 0.58, 6, 14), suit); leg.rotation.z = Math.PI / 2; leg.scale.set(0.9, 1, 1); leg.position.set(0.38, 0.115, sd * 0.068); BODY.add(leg);
    const shoe = new X.Mesh(new X.CapsuleGeometry(0.04, 0.05, 6, 12), shoeM); shoe.position.set(0.8, 0.15, sd * 0.07); shoe.rotation.z = 0.25; BODY.add(shoe);
  });
  const shirt = new X.Mesh(new X.SphereGeometry(1, 16, 10), MAT('#F1EFEA', { r: 0.6 })); shirt.scale.set(0.085, 0.02, 0.05); shirt.position.set(-0.5, 0.24, 0); BODY.add(shirt);
  const tie = new X.Mesh(new X.BoxGeometry(0.16, 0.012, 0.026), MAT('#7A2228', { r: 0.6 })); tie.position.set(-0.44, 0.252, 0); BODY.add(tie);
  const armL = new X.Mesh(new X.CapsuleGeometry(0.04, 0.36, 6, 12), suit); armL.rotation.z = Math.PI / 2; armL.position.set(-0.3, 0.13, -0.19); BODY.add(armL);
  [SHOULDER, ELBOW].forEach((j) => { const b = new X.Mesh(new X.SphereGeometry(0.044, 14, 10), suit); b.position.copy(j); BODY.add(b); });
  placeLimb(UPPER, SHOULDER, ELBOW);
}
const CORD = new X.Mesh(new X.BufferGeometry(), MAT('#D9C39A', { r: 0.8, e: '#FFD58A', ei: 0 })); YARD.add(CORD);
function cordPath(pull) {                            // from the bell's lever down the post, into the pipe, to the finger
  const top = BP.top(), finger = HAND.localToWorld(v3([0.07, 0.01, 0])).toArray(), sh = COF.localToWorld(v3([-0.5, 0.32, 0.17])).toArray();
  return [[top[0] - 0.02, top[1] + 0.01, top[2]], [BP.G.position.x + 0.05, 1.2, BP.G.position.z], [BP.G.position.x + 0.05, 0.35, BP.G.position.z],
    [PIPE_TOP[0], PIPE_TOP[1] + 0.04, PIPE_TOP[2]], [PIPE_BOT[0], PIPE_BOT[1] + 0.02, PIPE_BOT[2]], sh, finger].map(v3);
}
let cordKey = -1;
function setCord(key) { if (Math.abs(key - cordKey) < 1e-3) return; cordKey = key; CORD.geometry.dispose(); CORD.geometry = new X.TubeGeometry(new X.CatmullRomCurve3(cordPath(Math.min(1, key)), false, 'catmullrom', 0.2), 160, 0.009, 8, false); }
const SOIL = new X.Mesh(new X.BoxGeometry(9, 3.4, 3.2), new X.MeshBasicMaterial({ color: '#160F0A', transparent: true, opacity: 0, depthWrite: false, side: X.BackSide })); SOIL.position.set(0, -1.7, -0.2); YARD.add(SOIL);
const GRID = new X.GridHelper(9, 36, '#86BCFF', '#3D5F8E'); GRID.position.y = 0.012; GRID.material.transparent = true; GRID.material.opacity = 0; GRID.material.depthWrite = false; YARD.add(GRID);
const SOILBACK = new X.Mesh(new X.PlaneGeometry(9, 3.4), new X.MeshBasicMaterial({ map: (() => { const [c, x] = noiseCanvas(512, 256, '#3C2618', 0.2, 12000, 6); for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(120,110,95,${0.5 * RN(i + 50)})`; x.beginPath(); x.ellipse(512 * RN(i + 51), 256 * RN(i + 52), 3 + 8 * RN(i + 53), 2 + 5 * RN(i + 54), RN(i + 55) * 3, 0, TAU); x.fill(); } for (let i = 0; i < 14; i++) { x.strokeStyle = 'rgba(30,20,12,.7)'; x.lineWidth = 2; x.beginPath(); let px = 512 * RN(i + 60), py = 0; x.moveTo(px, py); for (let k = 0; k < 8; k++) { px += 20 * (RN(i * 9 + k) - 0.5); py += 12 + 10 * RN(i * 7 + k); x.lineTo(px, py); } x.stroke(); } return tex(c); })(), transparent: true, opacity: 0, depthWrite: false }));
SOILBACK.position.set(0, -1.7, -1.75); YARD.add(SOILBACK);
const DIRT = Array.from({ length: 60 }, (_, i) => { const m = new X.Mesh(new X.IcosahedronGeometry(0.03 + 0.04 * RN(i + 70), 0), MAT('#3A2818', { r: 1 })); m.visible = false; YARD.add(m); return m; });
// a top hat for the man who came back up; a night watchman's lantern; papers for the patents
const HAT = new X.Group(); YARD.add(HAT);
{ const blk = MAT('#121114', { r: 0.6 }); const cr = new X.Mesh(new X.CylinderGeometry(0.11, 0.115, 0.22, 24), blk); cr.position.y = 0.11; const br = new X.Mesh(new X.CylinderGeometry(0.19, 0.19, 0.012, 28), blk); const band = new X.Mesh(new X.CylinderGeometry(0.116, 0.116, 0.035, 24), MAT('#3A2A2A', { r: 0.5 })); band.position.y = 0.04; HAT.add(cr, br, band); }
const LANT = new X.Group(); YARD.add(LANT);
{ const frame = new X.Mesh(new X.BoxGeometry(0.14, 0.2, 0.14), MAT('#1E1A16', { m: 0.6, r: 0.5 })); const glowL = new X.Sprite(glowMat('#FFB45A', 0.95)); glowL.scale.setScalar(1.4); LANT.add(frame, glowL); LANT.userData.glow = glowL; }
const LAMP = new X.PointLight('#FFB466', 0, 8, 1.6); LANT.add(LAMP);
const paperTex = (() => {
  const [c, x] = noiseCanvas(256, 340, '#E9DDC0', 0.08, 5000, 8);
  x.strokeStyle = 'rgba(60,40,20,.85)'; x.lineWidth = 2; x.fillStyle = 'rgba(60,40,20,.9)'; setF(x, '700 15px Body', 0); x.textAlign = 'center'; x.fillText('BURIAL-CASE.', 128, 30); setF(x, '500 11px Body', 0); x.fillText('Patented', 128, 46);
  x.strokeRect(40, 150, 176, 60); x.beginPath(); x.moveTo(80, 150); x.lineTo(80, 70); x.lineTo(70, 70); x.lineTo(90, 70); x.stroke(); x.beginPath(); x.arc(100, 78, 10, Math.PI, 0); x.stroke();
  for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(30, 240 + i * 10); x.lineTo(226 - 30 * RN(i + 90), 240 + i * 10); x.stroke(); }
  return tex(c);
})();
const PAPERS = Array.from({ length: 22 }, (_, i) => { const m = new X.Mesh(new X.PlaneGeometry(0.42, 0.56), new X.MeshStandardMaterial({ map: paperTex, roughness: 0.9, side: X.DoubleSide })); m.visible = false; YARD.add(m); return m; });


// ---------- "The bell was never the product": the bell alone in a studio, on a turntable ----------
const STUDIO = new X.Group(); STUDIO.position.set(0, 60, 0); STUDIO.visible = false; scene.add(STUDIO);
const SBELL = BP.SW.clone(); SBELL.rotation.set(0, 0, 0); SBELL.scale.setScalar(2.2); SBELL.position.set(0, 0.5 + 0.22 * 2.2, 0);
{
  const ped = new X.Mesh(new X.CylinderGeometry(0.34, 0.38, 0.5, 64), MAT('#1C1D22', { r: 0.3, m: 0.25 })); ped.position.y = 0.25;
  const top = new X.Mesh(new X.CylinderGeometry(0.345, 0.345, 0.012, 64), MAT('#34363D', { r: 0.12, m: 0.4 })); top.position.y = 0.506;
  const floor = new X.Mesh(new X.CircleGeometry(6, 64), MAT('#141416', { r: 0.35, m: 0.1 })); floor.rotation.x = -Math.PI / 2;
  STUDIO.add(ped, top, floor, SBELL);
}
const KEY = new X.PointLight('#FFE6BF', 0, 7, 1.4); KEY.position.set(1.1, 61.5, 1.3); scene.add(KEY);

// ---------- the camera: a new set-up on almost every line ----------
scene.updateMatrixWorld(true);
const BT = BP.top(), QB = BELLS[2].G.position, QT = BELLS[2].top();
const VIEW = {
  g0: [[0.95, 0.55, 3.5], [-1.1, 1.25, 0.45], 42], g1: [[0.35, 0.75, 2.4], [-1.1, 1.28, 0.45], 40],
  bc0: [[BT[0] + 0.75, BT[1] + 0.1, BT[2] + 0.95], [BT[0], BT[1] - 0.12, BT[2]], 34], bc1: [[BT[0] + 0.5, BT[1] + 0.02, BT[2] + 0.62], [BT[0], BT[1] - 0.14, BT[2]], 32],
  dive0: [[1.9, 2.7, 3.6], [-0.3, -0.5, 0], 40], dive1: [[0.9, 1.1, 2.1], [0.0, -1.6, 0.05], 40],
  eyes0: [[-0.08, -0.98, 0.14], [-0.62, -1.56, 0.0], 36], eyes1: [[-0.27, -1.18, 0.08], [-0.62, -1.56, 0.0], 34],
  hill0: [[1.6, 1.5, 4.2], [-2.8, 0.9, -4.2], 42], hill1: [[1.15, 1.32, 3.3], [-2.9, 0.95, -4.3], 42],
  lid0: [[0.15, -0.78, 0.12], [-0.5, -1.5, 0.0], 46], lid1: [[0.1, -0.82, 0.1], [-0.5, -1.5, 0.0], 44],
  dirt0: [[2.1, 0.7, 2.9], [0.15, -1.05, 0.0], 40], dirt1: [[1.85, 0.55, 2.55], [0.15, -1.1, 0.0], 40],
  asm0: [[3.4, 0.9, 4.2], [-0.6, -0.6, 0.1], 44], asm1: [[2.8, 0.7, 3.6], [-0.65, -0.6, 0.1], 44],
  tube0: [[0.3, 0.85, 1.7], [-0.95, 0.35, 0.15], 36], tube1: [[0.0, 0.72, 1.35], [-0.95, 0.3, 0.15], 34],
  wake0: [[-0.45, -0.98, 0.5], [-0.62, -1.56, 0.0], 38], wake1: [[-0.48, -1.05, 0.42], [-0.62, -1.56, 0.0], 36],
  hand0: [[0.6, -0.55, 0.14], [-0.22, -1.52, 0.06], 40], hand1: [[0.55, -0.62, 0.12], [-0.2, -1.52, 0.06], 38],   // from his feet: face, cord, hand
  ring0: [[BT[0] + 0.95, BT[1] - 0.05, BT[2] + 1.05], [BT[0], BT[1] - 0.1, BT[2]], 32], ring1: [[BT[0] + 0.7, BT[1] - 0.08, BT[2] + 0.75], [BT[0], BT[1] - 0.1, BT[2]], 30],
  lant0: [[-2.2, 0.7, 2.3], [1.0, 1.25, -2.4], 42], lant1: [[-2.0, 0.66, 2.05], [1.0, 1.25, -2.4], 42],
  demo0: [[1.3, 0.9, 0.14], [-0.08, -1.62, 0.0], 42], demo1: [[1.1, 0.45, 0.1], [-0.05, -1.62, 0.0], 42],
  hat0: [[0.1, 0.5, 2.0], [-0.95, 0.6, 0.18], 38], hat1: [[0.0, 0.48, 1.8], [-0.95, 0.6, 0.18], 37],
  pat0: [[2.6, 1.7, 3.6], [0, 0.35, 0], 40], pat1: [[2.05, 1.35, 2.9], [0, 0.3, 0], 40],
  all0: [[8.2, 3.6, 12.2], [-1, 0.7, -5], 46], all1: [[7.0, 3.0, 10.6], [-1, 0.7, -5], 46],
  quiet0: [[QT[0] + 0.93, QT[1] - 0.55, QT[2] + 1.59], [QT[0], QT[1] - 0.05, QT[2]], 34], quiet1: [[QT[0] + 0.73, QT[1] - 0.45, QT[2] + 1.24], [QT[0], QT[1] - 0.05, QT[2]], 32],   // a still bell against the moon
  prod0: [[0.95, 60.78, 1.55], [0, 60.66, 0], 34], prod1: [[0.5, 60.74, 1.72], [0, 60.66, 0], 33],
  prodb0: [[-0.9, 60.45, 1.5], [0, 60.72, 0], 34], prodb1: [[-0.8, 60.46, 1.38], [0, 60.72, 0], 34],
  dawn0: [[-2.6, 0.8, 2.6], [-0.9, 1.0, -0.2], 42], dawn1: [[-2.45, 0.78, 2.4], [-0.92, 1.02, -0.2], 41],   // the sun comes up behind the grave
};
const XRS = new Set(['dive', 'eyes', 'lid', 'dirt', 'asm', 'wake', 'hand', 'demo']);
function cutAt(t) { let i = 0; while (i < CUTS.length - 1 && t >= CUTS[i + 1][0]) i++; return i; }
const shotName = (t) => CUTS[cutAt(t)][1].replace(/\d+$/, '');
function camAt(t) {
  if (DEBUGCAM) return [...DEBUGCAM[0], ...DEBUGCAM[1], DEBUGCAM[2]];
  const i = cutAt(t), [t0, a, b] = CUTS[i], t1 = i < CUTS.length - 1 ? CUTS[i + 1][0] : T0.feed;
  const u = clamp((t - t0) / Math.max(0.05, t1 - t0)), k = 0.6 * ease(u) + 0.4 * u, A = VIEW[a], B = VIEW[b];
  return [...lerp3(A[0], B[0], k), ...lerp3(A[1], B[1], k), lerp(A[2], B[2], k)];
}
const tmpV = new X.Vector3();
function project(p) { tmpV.set(...p).project(cam); return [(tmpV.x + 1) / 2 * W, (1 - tmpV.y) / 2 * H, tmpV.z < 1]; }

// ---------- the timeline of the world ----------
const RINGS = () => [[-0.2, 0.3], [K.bell - 0.02, 0.45], [K.rings - 0.02, 0.55], [K.rings + 0.45, 0.4], [K.rings + 0.9, 0.3], [K.mind, 0.18]];
function swing(t) { return RINGS().reduce((a, [t0, amp]) => (t < t0 ? a : a + amp * Math.exp(-(t - t0) / 0.55) * Math.sin(TAU * 2.1 * (t - t0))), 0); }
const dawnK = (t) => ease((t - K.peace + 0.05) / 0.6);
const asmK = (t, d) => (t < K.builtL ? 1 : t > K.safety ? 1 : ease((t - K.builtW - d + 0.15) / 0.22));
function setWorld(t) {
  const c = camAt(t); cam.position.set(c[0], c[1], c[2]); cam.fov = c[6]; cam.updateProjectionMatrix(); cam.lookAt(c[3], c[4], c[5]);
  const name = shotName(t), dk = dawnK(t), inStudio = name === 'prod' || name === 'prodb';
  YARD.visible = !inStudio; STUDIO.visible = inStudio; KEY.intensity = inStudio ? 9 : 0; SBELL.rotation.y = 0.9 * t;
  // moonlight to sunrise
  sun.color.copy(mixHex('#9DB8FF', '#FFC27A', dk)); sun.intensity = lerp(1.25, 2.6, dk);
  sun.position.set(lerp(-40, 70, dk), lerp(46, 8, dk), -110 + 150);
  hemi.color.copy(mixHex('#3A4A6A', '#FFD9B0', dk)); hemi.groundColor.copy(mixHex('#0B0D12', '#2A2018', dk)); hemi.intensity = lerp(0.6, 0.95, dk); rim.intensity = lerp(0.6, 0.3, dk);
  scene.fog = new X.Fog(mixHex('#0E1626', '#E3B590', dk), lerp(5, 12, dk), lerp(48, 95, dk));
  MOON.material.opacity = 1 - dk; MOONCORE.material.opacity = 1 - dk; SUNR.material.opacity = dk; SUNR.position.y = lerp(-6, 6, dk);
  MIST.forEach((s0, i) => { s0.position.x = -15 + ((s0.userData.x0 ?? (s0.userData.x0 = s0.position.x + 15)) + t * 0.25 * (0.5 + R(i + 36))) % 30; });
  // X-ray: the ground goes see-through and the soil shows, so the coffin can be seen
  const xr = XRS.has(name) ? (name === 'dive' ? ease((t - K.aliveL - 0.15) / 0.45) : 1) : 0;
  [groundMat, MOUND.material, woodLid].forEach((m) => { const see = xr > 0.01; if (m.transparent !== see) { m.transparent = see; m.needsUpdate = true; } m.depthWrite = !see; });
  groundMat.opacity = lerp(1, 0.1, xr); MOUND.material.opacity = lerp(1, 0.18, xr); woodLid.opacity = name === 'lid' ? 0.95 : name === 'dirt' ? 0.72 : lerp(1, 0.18, xr);   // the lid slams shut solid
  SOIL.material.opacity = 0.55 * xr; SOILBACK.material.opacity = 0.3 * xr; SOIL.visible = SOILBACK.visible = xr > 0.01;
  GRID.material.opacity = 0.45 * xr; GRID.visible = xr > 0.01; edgeMat.opacity = 0.9 * xr; CORD.material.emissiveIntensity = 1.0 * xr;
  COF.visible = HAND.visible = xr > 0.01;
  // the bell
  BP.SW.rotation.z = swing(t); BELLS.slice(1).forEach((b, i) => { b.SW.rotation.z = 0.02 * Math.sin(t * 0.8 + i); });
  // the hand: a twitch on "wasn't dead", a pull on "pull the cord"
  const tw = bump(t, K.wasnt - 0.05, 0.45), pull = ease((t - K.pull + 0.05) / 0.35) * (1 - ease((t - K.buriedL) / 0.3));
  FINGERS.forEach((f, i) => { f.rotation.y = 0; f.rotation.z = -0.25 * tw * Math.sin(t * 40 + i) - 0.9 * pull; });
  HAND.position.set(-0.1 + 0.08 * pull, 0.272 + 0.012 * tw + 0.035 * pull, 0.07);
  placeLimb(FORE, ELBOW, HAND.position.clone().add(v3([-0.09, 0, 0])));
  const eo = ease((t - K.dead + 0.1) / 0.08), hj = t > K.dead - 0.05 ? Math.exp(-(t - K.dead + 0.05) / 0.15) : 0;
  const dart = name === 'wake' ? 0.007 * Math.sign(Math.sin((t - K.cordL) * 9)) : 0;
  EYES.forEach((E) => { E.visible = eo > 0.02; E.scale.set(Math.max(0.12, eo), 1, 1); E.children[1].position.z = dart; });
  LASHES.forEach((l) => { l.visible = eo < 0.5; });
  BROWS.forEach((b) => { b.position.x = -0.044 - 0.014 * eo; });
  MOUTH.scale.set(lerp(0.004, 0.016, eo), lerp(0.003, 0.006, eo), lerp(0.017, 0.013, eo));
  HEADG.rotation.x = 0.1 * Math.sin((t - K.dead) * 34) * hj;
  // the lid shuts on "terrified" and three nails go in
  const shut = ease((t - K.terrified) / 0.18), inLid = name === 'lid';
  LIDP.rotation.x = inLid ? -1.9 * (1 - shut) : 0;
  NAILS.forEach((n, i) => { const tn = K.terrified + 0.1 + 0.16 * i; n.position.y = 0.08 - 0.055 * ease((t - tn) / 0.06); });
  // dirt raining on the lid on "buried alive"
  DIRT.forEach((m, i) => {
    const t0 = K.buriedW - 0.05 + 0.6 * R(i + 75), u = t - t0, on = name === 'dirt' && u > 0; m.visible = on; if (!on) return;
    const x0 = (R(i + 76) - 0.5) * 1.6 + 0.1, z0 = (R(i + 77) - 0.5) * 0.5, y = Math.max(-1.33, -0.05 - 4.5 * u * u);
    m.position.set(x0, y, z0); m.rotation.set(u * 5, u * 3, i);
  });
  // "So inventors built safety coffins": pipe, post and bell fly in
  const kp = asmK(t, 0), kb = asmK(t, 0.14), kbl = asmK(t, 0.26);
  PIPE.position.y = (PIPE_TOP[1] + PIPE_BOT[1]) / 2 + 2.2 * (1 - kp); HATCH.position.y = PIPE_TOP[1] + 0.02 + 2.2 * (1 - kp);
  BP.G.position.set(-1.42 + 1.4 * (1 - kb), 1.6 * (1 - kb), 0.5); BP.SW.scale.setScalar(Math.max(0.01, kbl));
  scene.updateMatrixWorld(true); setCord(pull + 7 * (1 - kb) + 3 * (1 - kp)); CORD.visible = kp > 0.95 && kb > 0.95;
  // the man who had himself buried comes back up: his top hat out of the pipe
  const hk = t - (K.worked - 0.12); HAT.visible = hk > 0 && t < K.patentsL;
  if (HAT.visible) { HAT.position.set(PIPE_TOP[0], PIPE_TOP[1] + 0.02 + 0.32 * back(clamp(hk / 0.3)), PIPE_TOP[2]); HAT.rotation.set(0.25 * Math.sin(hk * 9) * Math.exp(-hk * 3), 0, 0.2 * Math.sin(hk * 7)); }
  // the night watchman's lantern on its way
  const lv = t >= K.above - 0.05 && t < K.buriedL, lu = clamp((t - K.above + 0.05) / 0.7);
  LANT.visible = lv; LAMP.intensity = lv ? 14 : 0;
  if (lv) { LANT.position.set(lerp(6.5, 3.2, lu), 1.0 + 0.04 * Math.sin(t * 9), lerp(-7.5, -3.6, lu)); LANT.rotation.z = 0.25 * Math.sin(t * 6); }
  // the patents, one after another
  PAPERS.forEach((m, i) => {
    const t0 = K.filed - 0.2 + (K.n22 - K.filed + 0.2) * i / 22, u = t - t0, on = t >= K.patentsL && t < K.nobodyL && u > 0; m.visible = on; if (!on) return;
    const land = Math.min(1, u / 0.7), x0 = (R(i + 80) - 0.5) * 1.6, z0 = (R(i + 81) - 0.5) * 1.0;
    m.position.set(x0 + 0.3 * Math.sin(u * 5 + i) * (1 - land), lerp(2.6, 0.32 + 0.004 * i, land), z0);
    m.rotation.set(-Math.PI / 2 + (1 - land) * 0.9 * Math.sin(u * 6 + i), 0, R(i + 82) * 3);
  });
}

// ---------- 2D: backdrop, rings, cards, small print ----------
function backdrop(x, t) {
  if (/^prod/.test(shotName(t))) { const q0 = x.createRadialGradient(540, 820, 40, 540, 900, 1250); q0.addColorStop(0, '#4A3F33'); q0.addColorStop(0.45, '#1B1916'); q0.addColorStop(1, '#09090A'); x.fillStyle = q0; x.fillRect(0, 0, W, H); return; }
  const dk = dawnK(t), q = x.createLinearGradient(0, 0, 0, H);
  q.addColorStop(0, mixc('#05070F', '#3D5B8F', dk)); q.addColorStop(0.5, mixc('#0E1830', '#F2A672', dk)); q.addColorStop(1, mixc('#1A2236', '#FFD9A6', dk));
  x.fillStyle = q; x.fillRect(0, 0, W, H);
  if (dk < 0.9) { x.fillStyle = 'rgba(255,255,255,' + (0.7 * (1 - dk)) + ')'; for (let i = 0; i < 90; i++) { const tw = 0.5 + 0.5 * Math.sin(t * 3 + i); x.globalAlpha = (1 - dk) * (0.3 + 0.7 * tw); x.fillRect(W * R(i + 600), H * 0.55 * R(i + 601), 2, 2); } x.globalAlpha = 1; }
}
function ringLines(x, t) {                           // sound made visible round the hero bell
  RINGS().forEach(([t0, amp]) => {
    const u = t - t0; if (u < 0 || u > 0.9) return;
    const [bx, by, vis] = project(BP.mouth()); if (!vis) return;
    x.save(); x.strokeStyle = '#FFE1A0'; x.lineCap = 'round'; x.shadowColor = 'rgba(255,200,120,.8)'; x.shadowBlur = 16;
    for (let k = 0; k < 3; k++) { const r = 60 + (u * 520 + k * 70) * (0.6 + amp); x.globalAlpha = Math.max(0, 0.9 - u / 0.9 - k * 0.2); x.lineWidth = 7 - k * 1.5;
      [-1, 1].forEach((sd) => { x.beginPath(); x.arc(bx, by, r, sd > 0 ? -0.6 : Math.PI - 0.6, sd > 0 ? 0.6 : Math.PI + 0.6); x.stroke(); }); }
    x.restore();
  });
}
function stamp1800(x, t) {
  const a = win(t, K.n1800 - 0.08, K.people - 0.08, 0.15, 0.1); if (a <= 0) return;
  const s0 = lerp(1.6, 1, ease(clamp((t - K.n1800 + 0.08) / 0.18)));
  x.save(); x.globalAlpha = a; x.fillStyle = 'rgba(70,45,20,.22)'; x.fillRect(0, 0, W, H);
  x.translate(540, 1420); x.scale(s0, s0); x.rotate(-0.06); x.textAlign = 'center'; x.shadowColor = 'rgba(0,0,0,.8)'; x.shadowBlur = 30;
  setF(x, 'italic 230px Serif', 0); x.fillStyle = '#F1E2C2'; x.fillText('1800s', 0, 70); x.restore();
}
function counters(x, t) {
  bigNumber(x, t, K.inventor, K.prove, K.worked - 0.12, 75, (n) => Math.floor(n / 60) + ':' + String(Math.floor(n % 60)).padStart(2, '0'), 'hrs', 1450);
  if (t >= K.inventor && t < K.worked - 0.12) pill(x, 'buried, on purpose', 540, 1600, 42, false, (t - K.inventor - 0.2) / 0.3, { f: 'Body', w: 700, bg: 'rgba(20,16,14,.9)', fg: WHT });
  bigNumber(x, t, K.filed, K.n22, K.nobodyL - 0.06, 22, (n) => String(Math.round(n)), 'patents', 1450);
  if (t >= K.nobodyL + 0.25 && t < K.productL) pill(x, 'known rescues: 0', 540, 1450, 62, false, (t - K.nobodyL - 0.25) / 0.3, { f: 'Body', w: 800, bg: RED, fg: WHT });
}

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
  x.globalAlpha = a * 0.8; setF(x, '500 25px Body', 0); x.fillStyle = '#B4B4B9'; x.textAlign = 'center';
  const words = str.split(' '), lines = ['']; words.forEach((w) => { const tl = lines[lines.length - 1] ? lines[lines.length - 1] + ' ' + w : w; if (x.measureText(tl).width > 960 && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = tl; });
  lines.forEach((l, i) => x.fillText(l, 540, 1832 - (lines.length - 1 - i) * 32)); x.restore();
}
function bigNumber(x, t, t0, t1, tEnd, to, fmt, unit, Y = 1420) {   // a counter that runs up and lands
  const a = win(t, t0 - 0.02, tEnd, 0.12, 0.15); if (a <= 0) return;
  const n = to * eio(clamp((t - t0) / (t1 - t0))), land = t >= t1, s0 = land ? 1 + 0.22 * Math.exp(-(t - t1) / 0.09) : 1;
  x.save(); x.globalAlpha = a; x.translate(540, Y); x.scale(s0, s0); x.textAlign = 'center'; x.shadowColor = 'rgba(0,0,0,.85)'; x.shadowBlur = 40;
  const str = fmt(n); setF(x, '800 210px Logo', -8); const fsz = Math.min(210, 210 * 900 / x.measureText(fmt(to)).width); setF(x, '800 ' + fsz + 'px Logo', -8); x.fillStyle = WHT; const tw = x.measureText(str).width;
  x.fillText(str, unit ? -50 : 0, 75);
  if (unit) { setF(x, '700 100px Logo', -2); x.fillStyle = land ? GOLD : 'rgba(255,255,255,.75)'; x.textAlign = 'left'; x.fillText(unit, -50 + tw / 2 + 16, 75); }
  x.restore();
}
function flash(x, t, t0, a = 0.85, d = 0.2) { const u = t - t0; if (u < -0.04 || u > d) return; x.fillStyle = 'rgba(255,248,235,' + (u < 0 ? (u + 0.04) / 0.04 : 1 - u / d) * a + ')'; x.fillRect(0, 0, W, H); }


// ---------- the 3D shot ----------
function three(x, t) {
  setWorld(t); backdrop(x, t);
  const shake = jolt(t, K.bell, 8) + jolt(t, K.dead, 10) + jolt(t, K.terrified + 0.05, 10) + jolt(t, K.buriedW, 12) + jolt(t, K.rings, 14) + jolt(t, K.n22, 10) + jolt(t, K.worked, 8);
  x.save(); x.translate(shake, shake * 0.4);
  R3.render(scene, cam); x.drawImage(glc, 0, 0);
  label(x, BP.mouth(), -40, 320, 'a bell', win(t, K.bell - 0.05, K.aliveL - 0.05, 0.25, 0.1));
  label(x, COF.localToWorld(v3([0.3, 0.45, 0])).toArray(), 40, -320, 'the coffin', win(t, K.inside - 0.12, K.wasnt - 0.1, 0.25, 0.08));
  label(x, [PIPE_TOP[0], PIPE_TOP[1] + 0.05, PIPE_TOP[2]], 40, 280, 'a pipe to the surface', win(t, K.safety - 0.1, K.cordL - 0.05, 0.25, 0.1));
  label(x, COF.localToWorld(HAND.position.clone().add(v3([0.08, 0.02, -0.03]))).toArray(), -30, -300, 'a cord to the bell', win(t, K.pull - 0.15, K.and - 0.06, 0.25, 0.1), { bg: BLUE, fg: WHT });
  if (LANT.visible) label(x, LANT.position.toArray(), -40, -260, 'the night watchman', win(t, K.above + 0.05, K.buriedL - 0.02, 0.2, 0.08));
  label(x, BP.mouth(), 40, 330, 'peace of mind', win(t, K.mind - 0.18, 99, 0.3, 0.1), { bg: GOLD, fg: '#1D1D1F', size: 48 });
  x.restore();
  ringLines(x, t); stamp1800(x, t); counters(x, t);
  flash(x, t, K.rings, 0.22, 0.14); flash(x, t, K.worked, 0.15, 0.12); flash(x, t, K.peace, 0.25, 0.4);
  const FP = [[K.aliveL + 0.3, K.cordL, 'The fear of being buried alive peaked in the 19th-century cholera epidemics, when the dead were buried fast (Wikipedia, “Safety coffin”).'],
    [K.buriedL, K.nobodyL, 'Franz Vester of Newark (US patent 81,437, 1868) stayed buried 1 hr 15 min in a public demonstration; at least 22 safety-coffin patents, 1868–1925 (Weird NJ; New York Times, 1868; J. Bondeson).'],
    [K.nobodyL + 0.1, T0.feed, 'No evidence anyone was ever saved by one; “saved by the bell” comes from boxing (Phrase Finder). Scenes are illustrations.']];
  FP.forEach(([a, b, str]) => smallPrint(x, str, win(t, a + 0.15, b - 0.05, 0.3, 0.15)));
}
S.yard = three;

// ---------- the switch: our reel in a phone; flicks past ads listing features; it stops on one that names a fear ----------
const PHN = { cy: 610, s: 0.62 };
let FRZ = null;
function frozen() { if (!FRZ) { const [c, x] = mkc(1080, 1920); three(x, T0.feed - 1 / FPS); FRZ = c; } return FRZ; }
function productShape(c, kind) {
  c.save(); c.translate(300, 470); c.fillStyle = '#9EA2A8';
  if (kind === 0) { rrx(c, -80, -150, 160, 260, 26); c.fill(); rrx(c, -28, -190, 56, 46, 8); c.fill(); }
  else if (kind === 1) { rrx(c, -130, -110, 260, 220, 14); c.fill(); c.fillStyle = '#B4B8BE'; c.fillRect(-130, -20, 260, 30); }
  else { c.beginPath(); c.moveTo(-150, -120); c.lineTo(-60, -170); c.lineTo(60, -170); c.lineTo(150, -120); c.lineTo(120, -40); c.lineTo(90, -60); c.lineTo(90, 150); c.lineTo(-90, 150); c.lineTo(-90, -60); c.lineTo(-120, -40); c.closePath(); c.fill(); }
  c.restore();
}
function bellIcon(c, X0, Y0, s) {                      // a little gold bell
  c.save(); c.translate(X0, Y0); c.scale(s, s); c.fillStyle = '#E2B14E'; c.strokeStyle = '#8A6420'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(-40, 30); c.quadraticCurveTo(-36, -36, 0, -40); c.quadraticCurveTo(36, -36, 40, 30); c.lineTo(50, 40); c.lineTo(-50, 40); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.arc(0, 46, 10, 0, TAU); c.fill(); c.stroke(); c.beginPath(); c.arc(0, -46, 7, 0, TAU); c.stroke(); c.restore();
}
const REELS = [
  { kind: 'ours' },
  { kind: 'feat', shape: 0, lines: ['PREMIUM QUALITY.', 'SINCE 1998.'], name: 'brand_a' },
  { kind: 'feat', shape: 1, lines: ['24/7 SUPPORT.', '5 COLOURS.'], name: 'brand_b' },
  { kind: 'feat', shape: 2, lines: ['NEW AND', 'IMPROVED.'], name: 'brand_c' },
  { kind: 'fear', name: 'yourbrand' },
];
function reelPage(c, r, t) {                         // one full-screen reel, 600 x 1280
  if (r.kind === 'ours') c.drawImage(frozen(), -60, 0, 720, 1280);
  else if (r.kind === 'fear') {
    const q = c.createLinearGradient(0, 0, 0, 1280); q.addColorStop(0, '#FFF4E4'); q.addColorStop(1, '#F2D2AE'); c.fillStyle = q; c.fillRect(0, 0, 600, 1280);
    c.save(); c.textAlign = 'center'; c.fillStyle = '#1D1D1F'; setF(c, '800 60px Logo', -1); c.fillText('Worried it', 300, 200); c.fillText('won’t fit?', 300, 266); c.restore();
    productShape(c, 2); bellIcon(c, 455, 640, 0.9);
    c.save(); c.textAlign = 'center'; c.fillStyle = '#7A4A12'; setF(c, '800 50px Logo', -1); c.fillText('Free returns.', 300, 760); c.fillText('Forever.', 300, 818); c.restore();
  } else {
    c.fillStyle = '#ECECEF'; c.fillRect(0, 0, 600, 1280); productShape(c, r.shape);
    c.save(); c.textAlign = 'center'; c.fillStyle = '#3A3A3C'; r.lines.forEach((l, i) => { setF(c, '900 58px Hook', -1); c.fillText(l, 300, 760 + i * 70); }); c.restore();
  }
  const q = c.createLinearGradient(0, 760, 0, 1280); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,.72)'); c.fillStyle = q; c.fillRect(0, 860, 600, 420);
  rail(c, r.kind === 'fear' ? t - K.bell4 : -1);
  if (r.kind === 'ours') acct(c, 'mezmedia_0', null, 'm.', '#111');
  else acct(c, r.name, 'Sponsored', r.name[0].toUpperCase(), r.kind === 'fear' ? '#2F80FF' : '#8E8E93');
  setF(c, '500 26px Body', 0); c.fillStyle = 'rgba(255,255,255,.9)'; c.textAlign = 'left';
  c.fillText(r.kind === 'ours' ? 'Why would anyone put a bell on a grave?…' : r.kind === 'fear' ? 'Love it, or send it back. On us. ›' : 'Our product. It has features. ›', 30, 1090);
  if (r.kind !== 'ours') { rrx(c, 24, 1118, 552, 90, 18); c.fillStyle = 'rgba(255,255,255,.96)'; c.fill(); setF(c, '700 34px Body', 0); c.fillStyle = INK; c.fillText('Shop now', 54, 1176); c.textAlign = 'right'; c.fillText('›', 548, 1177); c.textAlign = 'left'; }
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(0, 1254, 600, 7); c.fillStyle = WHT; c.fillRect(0, 1254, 600 * 0.6, 7);
}
const swipeAt = (t) => {                             // four quick flicks; each feature ad is on screen for a moment
  let f = 0;
  for (let i = 0; i < REELS.length - 1; i++) f += eio((t - (K.sell - 0.15 - (REELS.length - 2 - i) * 0.28)) / 0.14);
  return f - 0.03 * bump(t, K.sell + 0.05, 0.3);
};
function feedUI(c, t) {
  const f = swipeAt(t), i0 = Math.floor(f), off = (f - i0) * 1280;
  for (let j = 0; j < 2; j++) { const r = REELS[i0 + j]; if (!r) continue; c.save(); c.translate(0, j * 1280 - off); c.beginPath(); c.rect(0, 0, 600, 1280); c.clip(); reelPage(c, r, t); c.restore(); }
  const lk = t - K.bell4;
  if (lk > 0 && lk < 0.9) { c.save(); c.globalAlpha = lk < 0.6 ? 1 : 1 - (lk - 0.6) / 0.3; c.fillStyle = WHT; c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 30; c.translate(300, 560); const s0 = back(clamp(lk / 0.25)) * (1 + 0.15 * clamp((lk - 0.4) / 0.5)); c.scale(s0, s0); heart(c, 0, 0, 110); c.restore(); }
}
S.feed = (x, t) => {
  stage(x, true);
  if (!IMG.feedscr) IMG.feedscr = mkc(1200, 2560)[0];
  const k = eio((t - T0.feed) / 0.6);
  phone(x, P(540, lerp(960, PHN.cy, k), PHN.s * Math.pow(1.8 / PHN.s, 1 - k)), 'feedscr', { frame: 'frameDark', shadow: k, over: (c) => feedUI(c, t) });
};

function heart(c, X0, Y, r) { c.beginPath(); c.moveTo(X0, Y + r * 0.9); c.bezierCurveTo(X0 - r * 1.6, Y - r * 0.1, X0 - r * 0.8, Y - r * 1.3, X0, Y - r * 0.45); c.bezierCurveTo(X0 + r * 0.8, Y - r * 1.3, X0 + r * 1.6, Y - r * 0.1, X0, Y + r * 0.9); c.fill(); }
function rail(c, liked) {
  c.save(); c.fillStyle = WHT; c.strokeStyle = WHT; c.lineWidth = 6; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 10;
  if (liked > 0) { c.save(); c.fillStyle = RED; c.translate(544, 690); const s0 = 1 + 0.4 * bump(liked, 0, 0.6); c.scale(s0, s0); heart(c, 0, 0, 32); c.restore(); } else heart(c, 544, 690, 32);
  c.beginPath(); c.arc(544, 806, 28, 0.35 * Math.PI, 2.25 * Math.PI); c.lineTo(522, 840); c.closePath(); c.stroke();
  c.beginPath(); c.moveTo(514, 902); c.lineTo(576, 880); c.lineTo(554, 942); c.lineTo(543, 914); c.closePath(); c.stroke();
  c.restore();
}
function acct(c, name, sub, letter, col) {
  c.save(); c.textAlign = 'left';
  c.beginPath(); c.arc(60, 1010, 31, 0, TAU); c.fillStyle = col; c.fill(); c.lineWidth = 3; c.strokeStyle = WHT; c.stroke();
  setF(c, '700 28px Logo', 0); c.fillStyle = WHT; c.textAlign = 'center'; c.fillText(letter, 60, 1020); c.textAlign = 'left';
  setF(c, '600 33px Body', 0); c.fillText(name, 106, sub ? 1004 : 1022);
  if (sub) { setF(c, '500 27px Body', 0); c.fillStyle = 'rgba(255,255,255,.85)'; c.fillText(sub, 106, 1040); }
  c.restore();
}

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
  const top = t >= T0.feed ? 1215 : CAPY;
  const fade = clamp((c.e - t) / 0.12) * clamp((t - c.s + 1 / FPS) / 0.06) * (t >= T0.feed && t < T0.pitch ? clamp((t - T0.feed - 0.32) / 0.15) : 1);
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
window.overlay = null;
