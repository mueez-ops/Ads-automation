// Browser-side scene for reel_armor.js. Runs as a module after three.js (imported as X), the 2D kit and the phone engine
// (reel_phone_kit.js), whose globals it uses: W, H, g, IMG, clamp, lerp, sstep, ease, expo, eio, back, bump, jolt, mkc,
// rrx, setF, pill, phone, P, stage, rise, zoomAt, vignette, INK, WHT, GREY... It fills S and replaces the kit's
// captions with the Face ID reel's: at the top, building word by word.
// One world: a suit of cuirassier armor on a wooden stand at the origin, facing +z (the breastplate's front); a musket
// on a forked rest 4.5 m away aims at the wearer's right chest; a plain steel plate on a post stands apart at x = 30;
// a second, spotless suit at x = 11. Units: 1 = 10 cm; the floor is y = 0.

const BLUE = '#2F80FF', RED = '#FF3B30', GREEN = '#22B455', GOLD = '#E8B44A';
const v3 = (a) => new X.Vector3(...a);
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const win = (t, a, b, fi = 0.25, fo = 0.25) => clamp((t - a) / Math.max(fi, 1e-4)) * (1 - clamp((t - b) / Math.max(fo, 1e-4)));
const tex = (c) => { const t = new X.CanvasTexture(c); t.colorSpace = X.SRGBColorSpace; t.anisotropy = 8; return t; };

// ---------- renderer, a studio environment for the steel, lights ----------
const glc = document.getElementById('gl');
const R3 = new X.WebGLRenderer({ canvas: glc, antialias: true, alpha: true, preserveDrawingBuffer: true });
R3.setSize(W, H, false); R3.setClearColor(0x000000, 0);
R3.toneMapping = X.ACESFilmicToneMapping; R3.toneMappingExposure = 1.05; R3.outputColorSpace = X.SRGBColorSpace;
const scene = new X.Scene();
scene.fog = new X.Fog(0x0b0907, 60, 190);
const cam = new X.PerspectiveCamera(40, W / H, 0.03, 600);
{
  const env = new X.Scene();
  const [c, x] = mkc(256, 256), q = x.createLinearGradient(0, 0, 0, 256);
  q.addColorStop(0, '#6A625A'); q.addColorStop(0.45, '#221E1B'); q.addColorStop(1, '#090807'); x.fillStyle = q; x.fillRect(0, 0, 256, 256);
  env.add(new X.Mesh(new X.SphereGeometry(50, 32, 16), new X.MeshBasicMaterial({ map: tex(c), side: X.BackSide })));
  const panel = (w, h, pos, col, v) => { const m = new X.Mesh(new X.PlaneGeometry(w, h), new X.MeshBasicMaterial({ color: new X.Color(col).multiplyScalar(v), side: X.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m); };
  panel(34, 10, [-8, 30, 14], '#FFE9CF', 5); panel(9, 30, [-36, 8, 10], '#FFD7A8', 2.6); panel(14, 9, [26, 12, -26], '#BFD4FF', 2.2);
  panel(22, 5, [0, 4, 40], '#FFF4E6', 1.4); panel(6, 20, [34, 6, 16], '#FFFFFF', 1.6);
  const pm = new X.PMREMGenerator(R3); scene.environment = pm.fromScene(env, 0.03).texture;
}
const hemi = new X.HemisphereLight('#FFE7CC', '#1A1512', 0.45); scene.add(hemi);
const key = new X.DirectionalLight('#FFE2BD', 2.6); key.position.set(-14, 28, 20); scene.add(key);
const rim = new X.DirectionalLight('#8FB4FF', 2.2); rim.position.set(12, 16, -16); scene.add(rim);
const fillL = new X.DirectionalLight('#FFB070', 0.6); fillL.position.set(10, 6, 14); scene.add(fillL);
const SWEEP = new X.PointLight('#FFF1DC', 0, 6, 1.6); scene.add(SWEEP);            // the light that crosses the dent
const MAT = (c, o = {}) => new X.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.5, metalness: o.m ?? 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, map: o.map || null, envMapIntensity: o.env ?? 1, side: o.side ?? X.FrontSide });
const glowTex = (() => { const [c, x] = mkc(128, 128); const q = x.createRadialGradient(64, 64, 0, 64, 64, 64); q.addColorStop(0, 'rgba(255,255,255,1)'); q.addColorStop(0.25, 'rgba(255,225,190,.8)'); q.addColorStop(1, 'rgba(255,150,60,0)'); x.fillStyle = q; x.fillRect(0, 0, 128, 128); return tex(c); })();
const smokeTex = (() => { const [c, x] = mkc(128, 128); const q = x.createRadialGradient(64, 64, 0, 64, 64, 64); q.addColorStop(0, 'rgba(220,215,210,.55)'); q.addColorStop(0.6, 'rgba(180,175,170,.22)'); q.addColorStop(1, 'rgba(160,155,150,0)'); x.fillStyle = q; x.fillRect(0, 0, 128, 128); return tex(c); })();
const glowMat = (c, op = 1) => new X.SpriteMaterial({ map: glowTex, color: c, transparent: true, opacity: op, blending: X.AdditiveBlending, depthWrite: false, fog: false });
const noiseCanvas = (w, h, base, amp, n = 9000, seed = 1) => {
  const [c, x] = mkc(w, h); x.fillStyle = base; x.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) { const v = R(seed * 100000 + i) < 0.5 ? 255 : 0; x.fillStyle = `rgba(${v},${v},${v},${amp * R(seed * 100000 + i + 7)})`; x.fillRect(R(seed * 100000 + i + 3) * w, R(seed * 100000 + i + 5) * h, 2, 2); }
  return [c, x];
};

// ---------- the floor, warm lights far off, dust in the air ----------
{
  const [c, x] = noiseCanvas(512, 512, '#2A231D', 0.1, 16000, 2);
  x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 4; for (let i = 0; i <= 512; i += 128) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 512); x.stroke(); }
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { x.fillStyle = `rgba(255,255,255,${0.02 + 0.03 * R(i * 7 + j * 13)})`; x.fillRect(i * 128 + 3, j * 128 + 3, 122, 122); }
  x.beginPath(); for (let j = 0; j <= 512; j += 64) { x.moveTo(0, j); x.lineTo(512, j); } x.stroke();
  const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; t0.repeat.set(40, 40);
  const fl = new X.Mesh(new X.PlaneGeometry(500, 500), MAT('#FFFFFF', { map: t0, r: 0.82, env: 0.35 })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0, 0); scene.add(fl);
}
const shadowTex = (() => { const [sc, sx] = mkc(256, 256), q = sx.createRadialGradient(128, 128, 10, 128, 128, 128); q.addColorStop(0, 'rgba(0,0,0,.8)'); q.addColorStop(1, 'rgba(0,0,0,0)'); sx.fillStyle = q; sx.fillRect(0, 0, 256, 256); return tex(sc); })();
const blob = (w, d, pos) => { const m = new X.Mesh(new X.PlaneGeometry(w, d), new X.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(pos[0], 0.02, pos[2]); scene.add(m); return m; };
const BOKEH = Array.from({ length: 26 }, (_, i) => {
  const s0 = new X.Sprite(glowMat(i % 3 ? '#FFB46A' : '#FFD9A8', 0.35 + 0.35 * R(i + 40)));
  s0.scale.setScalar(2.5 + 4 * R(i + 50)); s0.position.set((R(i + 60) - 0.5) * 140, 6 + 30 * R(i + 70), -60 - 70 * R(i + 80)); scene.add(s0); return s0;
});
const MOTES = (() => {
  const n = 240, geo = new X.BufferGeometry(), p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) p.set([(R(i + 900) - 0.5) * 34, 2 + 20 * R(i + 1900), (R(i + 2900) - 0.5) * 30 + 4], i * 3);
  geo.setAttribute('position', new X.BufferAttribute(p, 3));
  const m = new X.Points(geo, new X.PointsMaterial({ color: '#FFE2BD', size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0.55, depthWrite: false, blending: X.AdditiveBlending }));
  scene.add(m); return { m, base: p.slice() };
})();

// ---------- the armor ----------
// the breastplate: a grid over (u across, v up) shaped as a peascod plate with a ridge down the middle, a neck opening,
// arm openings and a point at the waist; its sides wrap back to z = 0, where the backplate meets it
const NU = 96, NV = 104;
function bpPoint(u, v) {
  const s = 2 * u - 1;
  const yb = -0.28 * Math.exp(-((s / 0.32) ** 2)) + 0.18 * s * s;
  const yt = 4.35 - 0.95 * Math.exp(-((s / 0.36) ** 2)) - 1.25 * sstep((Math.abs(s) - 0.62) / 0.38);
  const y = yb + v * (yt - yb);
  const hw = 1.62 + 0.42 * sstep((y - 0.5) / 2.3) + 0.22 * (1 - sstep(y / 0.7));
  const x = s * hw, D = 0.8 + 0.5 * Math.exp(-(((y - 2.1) / 1.5) ** 2));
  let z = D * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(s), 2.4)), 0.55);
  z += 0.07 * Math.exp(-((x / 0.16) ** 2)) * sstep((y + 0.2) / 1.0) * (1 - 0.6 * sstep((y - 3.2) / 0.8));
  return [x, y, z];
}
function bpGeometry(flipZ = 1) {
  const n = (NU + 1) * (NV + 1), pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), idx = [];
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    const k = j * (NU + 1) + i, p = bpPoint(i / NU, j / NV); pos.set([p[0], p[1], p[2] * flipZ], k * 3); uv.set([i / NU, j / NV], k * 2);
  }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; if (flipZ > 0) idx.push(a, b, d, a, d, c); else idx.push(a, d, b, a, c, d); }
  const geo = new X.BufferGeometry(); geo.setAttribute('position', new X.BufferAttribute(pos, 3)); geo.setAttribute('uv', new X.BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  return geo;
}
// polished steel with two etched, gilt bands and a gilt band down the ridge
const steelTex = (() => {
  const [c, x] = noiseCanvas(1024, 1024, '#DCE0E6', 0.035, 26000, 5);
  for (let i = 0; i < 1024; i += 3) { x.fillStyle = `rgba(255,255,255,${0.025 * R(i + 300)})`; x.fillRect(0, i, 1024, 1); }
  const band = (cx, w) => {
    x.fillStyle = '#B98F3E'; x.fillRect(cx - w / 2, 0, w, 1024);
    x.strokeStyle = 'rgba(70,50,20,.55)'; x.lineWidth = 2; x.strokeRect(cx - w / 2 + 2, -4, w - 4, 1032);
    for (let y = 8; y < 1024; y += 26) { x.beginPath(); x.arc(cx, y, w * 0.22, 0, TAU); x.strokeStyle = 'rgba(255,225,150,.55)'; x.stroke(); x.beginPath(); x.moveTo(cx - w * 0.36, y + 13); x.quadraticCurveTo(cx, y + 3, cx + w * 0.36, y + 13); x.strokeStyle = 'rgba(80,55,20,.5)'; x.stroke(); }
  };
  band(512, 30); band(300, 22); band(724, 22);
  const t0 = tex(c); return t0;
})();
const RIVET = new X.SphereGeometry(0.06, 10, 8);
function makeSuit(o = {}) {
  const G = new X.Group(), mat = MAT('#FFFFFF', { map: steelTex, m: 1, r: 0.19, env: 1.35, side: X.DoubleSide });
  const dark = MAT('#3A2A1E', { r: 0.7 }), brass = MAT('#C9A050', { m: 1, r: 0.3 });
  const piece = (name) => { const p = new X.Group(); p.name = name; G.add(p); return p; };
  // breast and back
  const BPG = piece('bp'); BPG.position.set(0, 9.0, 0);
  const bpGeo = bpGeometry(1); const bp = new X.Mesh(bpGeo, mat); BPG.add(bp);
  const back = new X.Mesh(bpGeometry(-0.62), mat); BPG.add(back);
  const edge = (pts, r) => { const m = new X.Mesh(new X.TubeGeometry(new X.CatmullRomCurve3(pts.map(v3)), 140, r, 8, false), mat); BPG.add(m); };
  const row = (j, step = 2) => { const out = []; for (let i = 0; i <= NU; i += step) out.push(bpPoint(i / NU, j / NV)); return out; };
  edge(row(NV), 0.06); edge(row(0), 0.055);
  [[-1, 0.62], [1, 0.62], [-1, 0.2], [1, 0.2], [0, 0.04]].forEach(([sx, v], i) => { const p = bpPoint(0.5 + sx * 0.36, v); const r0 = new X.Mesh(RIVET, brass); r0.position.set(p[0], p[1], p[2] + 0.02); BPG.add(r0); });
  // the fauld and tassets: curved lames hanging from the waist over the thighs
  const lame = (r, h, th0, th1) => new X.CylinderGeometry(r, r * 1.03, h, 40, 1, true, th0, th1);
  const TAS = [piece('tasL'), piece('tasR')];
  for (let k = 0; k < 2; k++) { const f = new X.Mesh(lame(2.05 + 0.06 * k, 0.55, -1.25, 2.5), mat); f.position.set(0, -0.15 - 0.45 * k, -0.25); BPG.add(f); }
  TAS.forEach((T, side) => {
    const sx = side ? 1 : -1; T.position.set(sx * 1.0, 8.0, 0.35);
    for (let k = 0; k < 6; k++) { const m = new X.Mesh(lame(0.92 + 0.02 * k, 0.72, side ? -0.9 : -1.15, 2.05), mat); m.position.set(0, -0.6 * k, 0); m.rotation.x = -0.06; T.add(m); }
    const strap = new X.Mesh(new X.BoxGeometry(0.16, 3.6, 0.05), dark); strap.position.set(0, -1.4, 0.93); T.add(strap);
  });
  // the gorget
  const GOR = piece('gor'); GOR.position.set(0, 12.25, -0.35);
  GOR.add(new X.Mesh(new X.LatheGeometry([[1.25, 0], [1.3, 0.1], [1.12, 0.38], [0.92, 0.66], [0.84, 0.92], [0.9, 0.98]].map((p) => new X.Vector2(...p)), 48), mat));
  // pauldrons: stacked bands over each shoulder
  const PAU = [piece('pauL'), piece('pauR')];
  PAU.forEach((Pp, side) => {
    const sx = side ? 1 : -1; Pp.position.set(sx * 2.15, 12.55, -0.3); Pp.rotation.z = -sx * 0.55;
    for (let k = 0; k < 5; k++) { const m = new X.Mesh(new X.SphereGeometry(1.05 + 0.05 * k, 32, 10, 0, TAU, 0.12 + 0.22 * k, 0.3), mat); m.position.y = -0.05 * k; Pp.add(m); }
  });
  // arms: upper cannon, elbow cop, vambrace, gauntlet
  const ARMS = [piece('armL'), piece('armR')];
  ARMS.forEach((A, side) => {
    const sx = side ? 1 : -1; A.position.set(sx * 2.75, 11.6, -0.35);
    const up = new X.Mesh(new X.CylinderGeometry(0.5, 0.45, 2.5, 28), mat); up.position.y = -1.2; A.add(up);
    const cop = new X.Mesh(new X.SphereGeometry(0.56, 24, 16), mat); cop.position.y = -2.55; A.add(cop);
    const wing = new X.Mesh(new X.CylinderGeometry(0.62, 0.62, 0.05, 28), mat); wing.position.set(sx * 0.32, -2.55, 0); wing.rotation.z = Math.PI / 2; A.add(wing);
    const low = new X.Mesh(new X.CylinderGeometry(0.44, 0.38, 2.3, 28), mat); low.position.set(0, -3.75, 0.55); low.rotation.x = 0.45; A.add(low);
    const hand = new X.Mesh(new X.BoxGeometry(0.62, 0.95, 0.5), mat); hand.position.set(0, -4.9, 1.1); hand.rotation.x = 0.5; A.add(hand);
    const cuff = new X.Mesh(new X.CylinderGeometry(0.52, 0.44, 0.45, 28, 1, true), mat); cuff.position.set(0, -4.55, 0.95); cuff.rotation.x = 0.45; A.add(cuff);
  });
  // the helmet: a skull with a comb, a peak, a barred face and lames at the neck
  const HEL = piece('hel'); HEL.position.set(0, 14.25, -0.35);
  if (o.helmet !== false) {
    const sk = new X.Mesh(new X.SphereGeometry(1.08, 40, 24, 0, TAU, 0, Math.PI * 0.6), mat); sk.scale.set(1, 1.12, 1.15); HEL.add(sk);
    const combS = new X.Shape(); combS.moveTo(-1.15, 0); combS.quadraticCurveTo(0, 0.95, 1.15, 0); combS.lineTo(-1.15, 0);
    const comb = new X.Mesh(new X.ExtrudeGeometry(combS, { depth: 0.07, bevelEnabled: false, curveSegments: 20 }), mat); comb.rotation.y = Math.PI / 2; comb.position.set(-0.035, 0.98, 0); HEL.add(comb);
    const peak = new X.Mesh(new X.SphereGeometry(1.2, 40, 6, -0.9 + Math.PI / 2, 1.8, Math.PI * 0.47, 0.16), mat); peak.scale.set(1, 1, 1.25); peak.position.y = -0.05; HEL.add(peak);
    const face = new X.Mesh(new X.SphereGeometry(1.1, 40, 14, -1.1 + Math.PI / 2, 2.2, Math.PI * 0.55, Math.PI * 0.33), mat); face.scale.set(1, 1.1, 1.18); HEL.add(face);
    for (let k = 0; k < 4; k++) { const bar = new X.Mesh(new X.CylinderGeometry(0.035, 0.035, 0.95, 8), mat); const a = -0.5 + k * 0.33; bar.position.set(Math.sin(a) * 1.22, -0.62, Math.cos(a) * 1.26); HEL.add(bar); }
    for (let k = 0; k < 3; k++) { const m = new X.Mesh(new X.CylinderGeometry(1.0 + 0.05 * k, 1.05 + 0.05 * k, 0.32, 32, 1, true, Math.PI * 0.55, Math.PI * 0.9), mat); m.position.y = -0.55 - 0.26 * k; HEL.add(m); }
  }
  // the stand: a post, a shoulder bar, crossed feet
  const wood = MAT('#5A3A22', { r: 0.75 });
  const post = new X.Mesh(new X.BoxGeometry(0.55, 14.2, 0.55), wood); post.position.set(0, 7.1, -0.9); G.add(post);
  const bar = new X.Mesh(new X.BoxGeometry(4.6, 0.4, 0.4), wood); bar.position.set(0, 12.2, -0.9); G.add(bar);
  [0, Math.PI / 2].forEach((r) => { const f = new X.Mesh(new X.BoxGeometry(5.2, 0.4, 0.6), wood); f.position.set(0, 0.2, -0.9); f.rotation.y = r + Math.PI / 4; G.add(f); });
  // home poses, and where each piece flies when the suit comes apart
  const OFF = { hel: [0, 3.4, 1.2], gor: [0, 2.0, 1.8], pauL: [-3.0, 1.4, 1.2], pauR: [3.0, 1.4, 1.2], armL: [-3.6, -0.5, 1.5], armR: [3.6, -0.5, 1.5], tasL: [-2.4, -2.4, 1.8], tasR: [2.4, -2.4, 1.8] };
  const parts = Object.keys(OFF).map((nm) => { const p = G.getObjectByName(nm); return { p, nm, home: p.position.clone(), rot: p.rotation.clone(), off: OFF[nm] }; });
  return { G, mat, bp, bpGeo, BPG, parts };
}
const SUIT = makeSuit(); scene.add(SUIT.G); blob(11, 9, [0, 0, 0]);
const SUIT2 = makeSuit(); SUIT2.G.position.set(6.6, 0, -6.5); SUIT2.G.rotation.y = -0.35; scene.add(SUIT2.G); const blob2 = blob(11, 9, [6.6, 0, -6.5]);

// the proof mark: where the ball strikes (the wearer's right chest) and the dent it leaves
const IJ = [Math.round(0.33 * NU), Math.round(0.6 * NV)];
const BASE = SUIT.bpGeo.attributes.position.array.slice();
const IK = IJ[1] * (NU + 1) + IJ[0];
const I_LOC = v3([BASE[IK * 3], BASE[IK * 3 + 1], BASE[IK * 3 + 2]]);
const N_LOC = v3([SUIT.bpGeo.attributes.normal.array[IK * 3], SUIT.bpGeo.attributes.normal.array[IK * 3 + 1], SUIT.bpGeo.attributes.normal.array[IK * 3 + 2]]).normalize();
const I = I_LOC.clone().add(v3([0, 9.0, 0])), N0 = N_LOC.clone();          // world (the suit sits at the origin)
const IA = I.toArray(), NA = N0.toArray();
const DENT_R = 0.34, DENT_D = 0.11;
const DENT_V = [];
for (let k = 0; k < BASE.length / 3; k++) {
  const d = Math.hypot(BASE[k * 3] - I_LOC.x, BASE[k * 3 + 1] - I_LOC.y, BASE[k * 3 + 2] - I_LOC.z);
  if (d < DENT_R * 1.5) { const u = d / DENT_R; DENT_V.push([k, (u < 1 ? (1 - u * u) ** 2 : 0) - 0.16 * Math.exp(-(((u - 1.05) / 0.22) ** 2))]); }
}
let dentNow = -1;
function setDent(a) {
  if (Math.abs(a - dentNow) < 1e-4) return; dentNow = a;
  const p = SUIT.bpGeo.attributes.position.array;
  DENT_V.forEach(([k, w]) => { for (let c = 0; c < 3; c++) p[k * 3 + c] = BASE[k * 3 + c] - N_LOC.getComponent(c) * DENT_D * a * w; });
  SUIT.bpGeo.attributes.position.needsUpdate = true; SUIT.bpGeo.computeVertexNormals();
}
const SMUDGE = (() => {
  const [c, x] = mkc(128, 128), q = x.createRadialGradient(64, 64, 0, 64, 64, 64); q.addColorStop(0, 'rgba(55,58,62,.6)'); q.addColorStop(0.5, 'rgba(90,92,96,.25)'); q.addColorStop(1, 'rgba(90,92,96,0)');
  x.fillStyle = q; x.fillRect(0, 0, 128, 128);
  const m = new X.Mesh(new X.CircleGeometry(0.12, 48), new X.MeshBasicMaterial({ map: tex(c), transparent: true, depthWrite: false }));
  m.position.copy(I).addScaledVector(N0, -DENT_D + 0.012); m.lookAt(I.clone().add(N0)); scene.add(m); return m;
})();

// ---------- the musket on its rest ----------
const M = [1.2, 12.0, 46.0];                          // the muzzle
const DIR = v3([IA[0] - M[0], IA[1] - M[1], IA[2] - M[2]]).normalize(), DA = DIR.toArray();
const GUN = new X.Group(); scene.add(GUN);
const walnutTex = (() => { const [c, x] = mkc(512, 128); x.fillStyle = '#4A2A16'; x.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 60; i++) { x.strokeStyle = `rgba(${R(i) < 0.5 ? '20,10,4' : '120,72,38'},${0.25 + 0.3 * R(i + 9)})`; x.lineWidth = 1 + 3 * R(i + 3); x.beginPath(); const y0 = 128 * R(i + 5); x.moveTo(0, y0); for (let k = 1; k <= 8; k++) x.lineTo(k * 64, y0 + 6 * Math.sin(k * 0.9 + i)); x.stroke(); }
  return tex(c); })();
const iron = MAT('#3C3F44', { m: 0.85, r: 0.38 }), walnut = MAT('#FFFFFF', { map: walnutTex, r: 0.42, env: 0.7 });
{
  const barrel = new X.Mesh(new X.CylinderGeometry(0.13, 0.16, 11, 24), iron); barrel.rotation.x = Math.PI / 2; barrel.position.z = 5.5; GUN.add(barrel);
  const ring = new X.Mesh(new X.TorusGeometry(0.15, 0.04, 8, 24), iron); ring.position.z = 11; GUN.add(ring);
  const bore = new X.Mesh(new X.CircleGeometry(0.085, 20), MAT('#050505', { r: 1 })); bore.position.z = 11.005; GUN.add(bore);
  const s0 = new X.Shape(); [[9, -0.08], [0.3, -0.08], [0, 0.05], [-1.6, 0.02], [-5.0, -0.55], [-5.05, -1.9], [-4.6, -1.95], [-1.5, -0.7], [0, -0.52], [9, -0.38]].forEach(([a, b], i) => (i ? s0.lineTo(a, b) : s0.moveTo(a, b)));
  const stock = new X.Mesh(new X.ExtrudeGeometry(s0, { depth: 0.42, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 2 }), walnut);
  stock.geometry.translate(0, 0, -0.21); stock.geometry.rotateY(-Math.PI / 2); GUN.add(stock);
  const lock = new X.Mesh(new X.BoxGeometry(0.06, 0.32, 1.3), iron); lock.position.set(0.26, -0.12, 0.2); GUN.add(lock);
  const hammer = new X.Mesh(new X.BoxGeometry(0.07, 0.42, 0.12), iron); hammer.position.set(0.3, 0.12, -0.15); hammer.rotation.x = -0.5; GUN.add(hammer);
  GUN.userData.base = v3(M).addScaledVector(DIR, -11);
  GUN.position.copy(GUN.userData.base); GUN.lookAt(v3(M).addScaledVector(DIR, 10));
  // the forked rest under the barrel
  const R0 = v3(M).addScaledVector(DIR, -3.2);
  const pole = new X.Mesh(new X.CylinderGeometry(0.09, 0.11, R0.y - 0.2, 12), MAT('#4A3020', { r: 0.8 })); pole.position.set(R0.x, (R0.y - 0.2) / 2, R0.z); scene.add(pole);
  [-1, 1].forEach((sx) => { const f = new X.Mesh(new X.CylinderGeometry(0.05, 0.05, 0.6, 8), iron); f.position.set(R0.x + sx * 0.2, R0.y - 0.05, R0.z); f.rotation.z = sx * 0.35; scene.add(f); });
  blob(3, 3, [R0.x, 0, R0.z]);
}
const MUZ = v3(M).addScaledVector(DIR, 0.2);
const FLASH = new X.Sprite(glowMat('#FFE6B0', 0)); scene.add(FLASH);
const FLAME = Array.from({ length: 6 }, (_, i) => { const s0 = new X.Sprite(glowMat(i < 2 ? '#FFE9C0' : '#FF9A40', 0)); scene.add(s0); return s0; });
const SMOKE = Array.from({ length: 22 }, (_, i) => { const s0 = new X.Sprite(new X.SpriteMaterial({ map: smokeTex, transparent: true, opacity: 0, depthWrite: false })); scene.add(s0); return { s0, i }; });

// ---------- the ball, sparks ----------
const BALL_R = 0.1;
const lead = MAT('#64676C', { m: 0.45, r: 0.62, env: 0.8 });
const BALL = new X.Mesh(new X.SphereGeometry(BALL_R, 24, 16), lead); scene.add(BALL);
const TRAIL = (() => {
  const [c, x] = mkc(8, 256), q = x.createLinearGradient(0, 256, 0, 0); q.addColorStop(0, 'rgba(255,255,255,0)'); q.addColorStop(1, 'rgba(255,255,255,1)'); x.fillStyle = q; x.fillRect(0, 0, 8, 256);
  const m = new X.Mesh(new X.CylinderGeometry(BALL_R * 0.6, 0.0, 1, 20, 1, true), new X.MeshBasicMaterial({ map: tex(c), color: '#DDE6F2', transparent: true, opacity: 0.16, blending: X.AdditiveBlending, depthWrite: false, side: X.DoubleSide }));
  scene.add(m); return m;
})();
const SPARK = Array.from({ length: 22 }, (_, i) => { const s0 = new X.Sprite(glowMat(i % 3 ? '#FFC77A' : '#FFFFFF', 0)); scene.add(s0); return s0; });
const SPARK_DIR = SPARK.map((_, i) => {
  const a = R(i + 400) * TAU, up = R(i + 500), tan1 = v3([1, 0, 0]).cross(N0).normalize(), tan2 = N0.clone().cross(tan1).normalize();
  return N0.clone().multiplyScalar(0.35 + 0.6 * up).addScaledVector(tan1, Math.cos(a)).addScaledVector(tan2, Math.sin(a)).normalize().multiplyScalar(3 + 5 * R(i + 600));
});
const HITFLASH = new X.Sprite(glowMat('#FFF2D8', 0)); scene.add(HITFLASH);
const GLINT = new X.Sprite(glowMat('#FFFFFF', 0)); scene.add(GLINT);

// ---------- the plain plate the ball punches through ----------
const PL = [30, 11, 0];
const PLATE = new X.Group(); PLATE.position.set(...PL); PLATE.rotation.y = -0.5; scene.add(PLATE);
const plateTex = (() => { const [c, x] = noiseCanvas(512, 512, '#C3C8CF', 0.06, 12000, 9); for (let i = 0; i < 512; i += 2) { x.fillStyle = `rgba(255,255,255,${0.05 * R(i + 77)})`; x.fillRect(0, i, 512, 1); } return tex(c); })();
const plateMat = MAT('#A2A8B0', { map: plateTex, m: 1, r: 0.22, env: 1.4, side: X.DoubleSide });
const PLIGHT = new X.PointLight('#FFD9A8', 0, 14, 1.5); PLIGHT.position.set(31.5, 13.5, -4.5); scene.add(PLIGHT);
const PSOLID = new X.Mesh(new X.BoxGeometry(3.2, 3.2, 0.05), plateMat); PLATE.add(PSOLID);
const PHOLE = (() => {
  const s0 = new X.Shape(); s0.moveTo(-1.6, -1.6); s0.lineTo(1.6, -1.6); s0.lineTo(1.6, 1.6); s0.lineTo(-1.6, 1.6); s0.lineTo(-1.6, -1.6);
  const h = new X.Path(); h.absarc(0, 0, 0.13, 0, TAU, true); s0.holes.push(h);
  const m = new X.Mesh(new X.ExtrudeGeometry(s0, { depth: 0.05, bevelEnabled: false, curveSegments: 24 }), plateMat); m.geometry.translate(0, 0, -0.025); PLATE.add(m); return m;
})();
const PETALS = Array.from({ length: 7 }, (_, i) => {
  const a = i * TAU / 7, g0 = new X.BufferGeometry();
  g0.setAttribute('position', new X.BufferAttribute(new Float32Array([0, -0.05, 0, 0, 0.05, 0, 0.2, 0, 0]), 3)); g0.computeVertexNormals();
  const m = new X.Mesh(g0, plateMat); const holder = new X.Group(); holder.rotation.z = a; holder.position.set(Math.cos(a) * 0.12, Math.sin(a) * 0.12, -0.03); holder.add(m); PLATE.add(holder);
  return { holder, m };
});
const FRAG = Array.from({ length: 12 }, (_, i) => { const m = new X.Mesh(new X.BoxGeometry(0.05 + 0.05 * R(i + 700), 0.04, 0.02), plateMat); scene.add(m); return m; });
{ const post = new X.Mesh(new X.BoxGeometry(0.45, 9.4, 0.45), MAT('#5A3A22', { r: 0.75 })); post.position.set(PL[0], 4.7, -0.3); scene.add(post); blob(4, 4, [PL[0], 0, 0]); }
const PLGLOW = new X.Sprite(glowMat('#FFE3B0', 0)); PLGLOW.position.set(PL[0], PL[1], -0.3); scene.add(PLGLOW);

// ---------- the camera: a new set-up on almost every line ----------
const MP = (k, dx = 0, dy = 0) => [M[0] + DA[0] * k + dx, M[1] + DA[1] * k + dy, M[2] + DA[2] * k];
const NI = (k, dx = 0, dy = 0, dz = 0) => [IA[0] + NA[0] * k + dx, IA[1] + NA[1] * k + dy, IA[2] + NA[2] * k + dz];
const IP = (dx = 0, dy = 0, dz = 0) => [IA[0] + dx, IA[1] + dy, IA[2] + dz];
const VIEW = {
  gun0: [[2.5, 13.55, 66.5], [-0.2, 11.0, 0], 21], gun1: [[2.3, 13.35, 62.8], [-0.25, 11.1, 0], 19],
  muz0: [MP(3.0, -1.0, 0.42), MP(0.4), 44], muz1: [MP(3.5, -1.25, 0.5), MP(0.4), 46],
  hit0: [IP(-3.0, 0.8, 2.4), IP(0.1, -0.1, 0), 34], hit1: [IP(-2.7, 0.72, 2.1), IP(0.1, -0.1, 0), 33],
  sell0: [[0.9, 12.0, 10.6], [-0.35, 11.2, 0.8], 38], sell1: [[0.5, 11.85, 8.7], [-0.4, 11.3, 0.8], 36],
  ex0: [[26.4, 12.2, -7.6], [30, 11, 0], 38], ex1: [[27.2, 11.8, -5.8], [30, 11, 0], 36],
  boom0: [[8.0, 16.8, 19.5], [0, 10.5, 0], 46], boom1: [[5.0, 16.0, 21.0], [0, 10.4, 0], 46],
  low0: [[-7.0, 3.2, 15.5], [0, 10.8, 0], 48], low1: [[-6.0, 3.6, 14.5], [0, 11.0, 0], 48],
  hero0: [[3.0, 2.0, 13.8], [0, 11.4, 0], 46], hero1: [[1.4, 3.6, 11.8], [0, 11.7, 0], 46],
  aim0: [[-2.3, 12.4, 7.4], [-0.5, 11.4, 0.8], 36], aim1: [[1.6, 12.2, 7.1], [-0.4, 11.4, 0.8], 36],
  ots0: [[2.7, 13.75, 63.2], [-0.6, 11.6, 0], 22], ots1: [[2.4, 13.6, 61.4], [-0.6, 11.6, 0], 21],
  hit2: [IP(2.1, 1.5, 2.6), IP(0, -0.15, 0), 30], hit3: [IP(1.85, 1.35, 2.3), IP(0, -0.1, 0), 30],
  pov0: [NI(0.9, 0.55, 0.38), [M[0], M[1] - 0.6, M[2]], 16], pov1: [NI(0.85, 0.5, 0.36), [M[0], M[1] - 0.7, M[2]], 14],
  pass0: [[-3.4, 12.0, 8.6], [-0.5, 11.1, 0.7], 38], pass1: [[-2.6, 11.8, 7.6], [-0.5, 11.1, 0.7], 37],
  mac0: [NI(5.2, 1.6, 1.2), IA, 26], mac1: [NI(4.4, -0.6, 0.8), IA, 25],
  pull0: [NI(1.15, 0.1, 0.15), IA, 30], pull1: [[0.4, 12.4, 13.6], [0, 10.9, 0], 40],
  orb0: [[-6.6, 13.2, 8.0], [-0.6, 11.2, 0.5], 36], orb1: [[-5.0, 12.7, 9.9], [-0.6, 11.2, 0.6], 36],
  two0: [[1.5, 12.3, 12.5], [0, 11.0, 0], 40], two1: [[5.0, 12.4, 9.0], [6.4, 11.0, -6.5], 38],
  both0: [[-3.5, 13.0, 19.5], [3.0, 10.6, -3.0], 44], both1: [[-3.0, 12.8, 18.0], [3.0, 10.6, -3.0], 44],
};
const CUT_END = T0.feed;
function flightAt(t) {                               // the ball in the air: [index, progress 0..1] or null
  for (let i = 0; i < FLIGHT.length; i++) { const [f, h] = FLIGHT[i]; if (t >= f && t < h) return [i, (t - f) / (h - f)]; }
  return null;
}
const ballPos = (s) => lerp3(M, IA, s);
function camAt(t) {
  if (DEBUGCAM) return [...DEBUGCAM[0], ...DEBUGCAM[1], DEBUGCAM[2]];
  let i = 0; while (i < CUTS.length - 1 && t >= CUTS[i + 1][0]) i++;
  const [t0, a, b] = CUTS[i], t1 = i < CUTS.length - 1 ? CUTS[i + 1][0] : CUT_END;
  if (a === 'fly1') {
    const fl = flightAt(t), p = ballPos(fl ? fl[1] : 1);
    return [p[0] - 0.2, p[1] + 0.55, p[2] + 2.3, p[0] + DA[0] * 5, p[1] + DA[1] * 5 + 0.3, p[2] + DA[2] * 5, 42];
  }
  if (a === 'fly2') {
    const fl = flightAt(t), p = ballPos(fl ? fl[1] : 1);
    return [p[0] + 0.6, p[1] - 0.25, p[2] + 2.1, p[0] + DA[0] * 6, p[1] + DA[1] * 6 + 0.45, p[2] + DA[2] * 6, 40];
  }
  if (a === 'orbit') {                               // round the ball in the air, the plate coming up behind it
    const z = PUNCH_Z0 - PLATE_V * (t - K.guns), ph = lerp(-0.85, 0.55, (t - t0) / (t1 - t0)), r = lerp(1.9, 1.5, (t - t0) / (t1 - t0));
    return [PL[0] + Math.sin(ph) * r, PL[1] + 0.35, z + Math.cos(ph) * r, PL[0] - Math.sin(ph) * 0.4, PL[1] - 0.05, z - 1.2, 40];
  }
  const u = clamp((t - t0) / Math.max(0.05, t1 - t0)), k = 0.6 * ease(u) + 0.4 * u, A = VIEW[a], B = VIEW[b];
  return [...lerp3(A[0], B[0], k), ...lerp3(A[1], B[1], k), lerp(A[2], B[2], k)];
}
const tmpV = new X.Vector3();
function project(p) { tmpV.set(...p).project(cam); return [(tmpV.x + 1) / 2 * W, (1 - tmpV.y) / 2 * H, tmpV.z < 1]; }

// ---------- the timeline of the world ----------
const grow = (u) => (u <= 0 ? 0 : 1 - Math.exp(-u / 0.05));
const dentAt = (t) => Math.max(t >= K.hit1 && t < K.guns ? grow(t - K.hit1) : 0, t >= K.hit2 ? grow(t - K.hit2) : 0);
const SHOT_T = [K.shoot, K.fire];
const PUNCH_Z0 = 14, PLATE_V = PUNCH_Z0 / (K.punch - K.guns);       // the ball through the plain plate
function setWorld(t) {
  const c = camAt(t); cam.position.set(c[0], c[1], c[2]); cam.fov = c[6]; cam.updateProjectionMatrix(); cam.lookAt(c[3], c[4], c[5]);
  setDent(dentAt(t)); SMUDGE.visible = dentAt(t) > 0.05; SMUDGE.material.opacity = dentAt(t);
  // the suit comes apart on "thicker" and slams back together on "heavier"; it sinks a little at 39 kilos
  const outK = ease((t - K.thick) / 0.32), heavy = SUIT.G;
  SUIT.parts.forEach(({ p, nm, home, rot, off }, i) => {
    const wave = { tasL: 0, tasR: 0, armL: 1, armR: 1, pauL: 2, pauR: 2, gor: 3, hel: 4 }[nm], land = K.heavier + [0, 0.11, 0.2, 0.28, 0.35][wave];
    let k = 0;
    if (t >= K.thick && t < land) {
      const back_ = clamp((t - (land - 0.14)) / 0.14);
      k = outK * (1 - back_ * back_) * (1 + 0.04 * Math.sin((t - K.thick) * 2.2 + i));
    }
    const settle = t >= land ? 0.05 * Math.exp(-(t - land) / 0.06) * Math.sin((t - land) * 40) : 0;
    p.position.set(home.x + off[0] * k, home.y + off[1] * k + settle, home.z + off[2] * k);
    p.rotation.set(rot.x + 0.35 * k * Math.sin(i * 1.7), rot.y + 0.5 * k * Math.cos(i * 2.3), rot.z + 0.3 * k * Math.sin(i * 0.9));
  });
  heavy.position.y = -0.14 * bump(t, K.n39 - 0.02, 0.32);
  // the musket: recoil on each shot, flash, a cone of flame, then smoke that drifts
  const rec = SHOT_T.reduce((m, ts) => { const u = t - ts; return u < 0 ? m : Math.max(m, u < 0.05 ? u / 0.05 : Math.exp(-(u - 0.05) / 0.3)); }, 0);
  GUN.position.copy(GUN.userData.base).addScaledVector(DIR, -0.55 * rec);
  const fl = SHOT_T.reduce((m, ts) => { const u = t - ts; return u < -0.01 || u > 0.16 ? m : Math.max(m, u < 0.02 ? 1 : 1 - (u - 0.02) / 0.14); }, 0);
  FLASH.visible = fl > 0; FLASH.position.copy(MUZ).addScaledVector(DIR, 0.5); FLASH.scale.setScalar(0.7 + 1.5 * fl); FLASH.material.opacity = 0.85 * fl;
  FLAME.forEach((s0, i) => { s0.visible = fl > 0.03; const d = (0.3 + 0.5 * i) * (0.6 + 0.6 * fl); s0.position.copy(MUZ).addScaledVector(DIR, d); s0.scale.setScalar((0.9 - 0.1 * i) * (0.4 + fl)); s0.material.opacity = 0.8 * fl * (1 - i * 0.13); });
  SMOKE.forEach(({ s0, i }) => {
    const ts = SHOT_T[i % 2], u = t - ts - 0.01 * (i >> 1), on = u > 0 && u < 3.2; s0.visible = on; if (!on) return;
    const sp = 4.5 * (1 - Math.exp(-u / 0.35)) * (0.6 + 0.6 * R(i + 100)), side = (R(i + 200) - 0.5) * 1.2, upd = 0.5 * u + (R(i + 300) - 0.3) * 0.6;
    s0.position.set(MUZ.x + DA[0] * sp + side, MUZ.y + upd, MUZ.z + DA[2] * sp + side * 0.4);
    s0.scale.setScalar(0.4 + 2.0 * Math.sqrt(u)); s0.material.opacity = 0.32 * clamp(u / 0.06) * (1 - u / 3.2); s0.material.rotation = i + u * 0.3;
  });
  // the ball: in the air in slow motion, then flattened against the plate and falling
  const fln = flightAt(t); let bp = null, sq = 0, after = -1;
  if (fln) bp = ballPos(fln[1]);
  else for (const h of [K.hit1, K.hit2]) { const u = t - h; if (u >= 0 && u < 1.4) { after = u; sq = 1; bp = [IA[0] + NA[0] * (0.05 + 0.2 * Math.max(0, u - 0.1)), IA[1] - 0.5 * 7 * Math.max(0, u - 0.1) ** 2, IA[2] + NA[2] * (0.05 + 0.2 * Math.max(0, u - 0.1))]; } }
  const inPlate = t >= K.guns && t < K.thick;
  if (inPlate) { const z = PUNCH_Z0 - PLATE_V * (t - K.guns); bp = [PL[0] - 0.04 * (z < 0 ? -z : 0), PL[1] + 0.02 * (z < 0 ? -z : 0), z]; sq = 0; }
  BALL.visible = !!bp && (!fln || fln[1] > 0.004);
  if (bp) {
    BALL.position.set(...bp);
    if (sq) { BALL.quaternion.setFromUnitVectors(v3([0, 1, 0]), N0); BALL.scale.set(1.45, 0.5, 1.45); if (after > 0.12) BALL.rotation.x += (after - 0.12) * 6; }
    else { BALL.quaternion.identity(); BALL.scale.setScalar(1); }
  }
  const moving = (!!fln && fln[1] > 0.01) || inPlate;
  TRAIL.visible = moving && !!bp;
  if (TRAIL.visible) { const fw = inPlate ? v3([0, 0, -1]) : DIR, len = 3.2; TRAIL.quaternion.setFromUnitVectors(v3([0, 1, 0]), fw); TRAIL.scale.set(1, len, 1); TRAIL.position.set(bp[0] - fw.x * len / 2, bp[1] - fw.y * len / 2, bp[2] - fw.z * len / 2); }
  // sparks and a flash where it strikes
  let sk = -1; [K.hit1, K.hit2].forEach((h) => { const u = t - h; if (u >= 0 && u < 0.9) sk = u; });
  SPARK.forEach((s0, i) => {
    const life = 0.35 + 0.4 * R(i + 800), u = sk; s0.visible = u >= 0 && u < life; if (!s0.visible) return;
    const dv = SPARK_DIR[i]; s0.position.set(IA[0] + dv.x * u, IA[1] + dv.y * u - 5 * u * u, IA[2] + dv.z * u);
    s0.material.opacity = 1 - u / life; s0.scale.setScalar(0.14 * (1 - 0.5 * u / life));
  });
  HITFLASH.visible = sk >= 0 && sk < 0.18; HITFLASH.position.set(...NI(0.1)); HITFLASH.scale.setScalar(0.5 + 1.5 * clamp(sk / 0.05)); HITFLASH.material.opacity = 0.75 * (1 - clamp(sk / 0.18));
  // a glint for "brand new" and for "on purpose"
  const gl = Math.max(bump(t, K.brand - 0.05, 0.5), bump(t, K.purpose - 0.05, 0.55));
  GLINT.visible = gl > 0; GLINT.material.opacity = gl; GLINT.scale.setScalar(1.6 * gl);
  if (t < K.guns) GLINT.position.set(-1.3, 12.0, 1.15); else GLINT.position.set(...NI(0.12));
  // the plain plate: whole until the punch, then holed, its petals bent out, fragments flying with the ball
  PLATE.visible = inPlate; PLIGHT.intensity = inPlate ? 40 : 0; const pu = t - K.punch;
  PSOLID.visible = pu < 0; PHOLE.visible = pu >= 0;
  PETALS.forEach(({ holder, m }, i) => { m.visible = pu >= 0; holder.rotation.x = 0; m.rotation.y = 1.1 * ease(pu / 0.1) * (0.8 + 0.4 * R(i + 950)); });
  FRAG.forEach((m, i) => {
    m.visible = inPlate && pu >= 0 && pu < 1.0; if (!m.visible) return;
    const a = R(i + 720) * TAU, sp = 1.5 + 2.5 * R(i + 730), fwd = 6 + 6 * R(i + 740);
    m.position.set(PL[0] + Math.cos(a) * sp * pu, PL[1] + Math.sin(a) * sp * pu - 2 * pu * pu, -fwd * pu); m.rotation.set(pu * 9 * R(i + 750), pu * 7, pu * 5);
  });
  PLGLOW.visible = inPlate && pu >= 0; PLGLOW.material.opacity = 0.9 * Math.exp(-Math.max(0, pu) / 0.2) + 0.25; PLGLOW.scale.setScalar(0.9 + 2 * Math.exp(-Math.max(0, pu) / 0.15));
  // the second suit, only when it is shown; it goes grey on "It proved nothing"
  SUIT2.G.visible = blob2.visible = t >= K.mark - 0.05;
  const dim = ease((t - K.nothing + 0.05) / 0.35); SUIT2.mat.color.setScalar(lerp(1, 0.32, dim)); SUIT2.mat.envMapIntensity = lerp(1.35, 0.35, dim);
  // the light that crosses the dent in the macro shot
  const sw = win(t, K.stayedL - 0.05, K.purpose - 0.1, 0.1, 0.1), su = clamp((t - K.stayedL) / (K.purpose - K.stayedL));
  SWEEP.intensity = 7 * sw; const sp0 = NI(0.75, lerp(-1.1, 1.1, su), 0.55); SWEEP.position.set(...sp0);
  // dust drifts
  const mp = MOTES.m.geometry.attributes.position.array;
  for (let i = 0; i < mp.length; i += 3) { mp[i] = MOTES.base[i] + Math.sin(t * 0.3 + i) * 0.4; mp[i + 1] = MOTES.base[i + 1] + ((t * 0.25 + R(i)) % 1) * 0.8; }
  MOTES.m.geometry.attributes.position.needsUpdate = true;
}

// ---------- 2D: backdrop, labels, cards, stamps, small print ----------
function backdrop(x, t) {
  x.fillStyle = '#080605'; x.fillRect(0, 0, W, H);
  const q = x.createRadialGradient(540, 760, 60, 540, 900, 1300); q.addColorStop(0, 'rgba(120,88,58,.42)'); q.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = q; x.fillRect(0, 0, W, H);
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
  x.globalAlpha = a * 0.8; setF(x, '500 25px Body', 0); x.fillStyle = '#A1A1A6'; x.textAlign = 'center';
  const words = str.split(' '), lines = ['']; words.forEach((w) => { const tl = lines[lines.length - 1] ? lines[lines.length - 1] + ' ' + w : w; if (x.measureText(tl).width > 960 && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = tl; });
  lines.forEach((l, i) => x.fillText(l, 540, 1832 - (lines.length - 1 - i) * 32)); x.restore();
}
function glass(x, X0, Y0, w, h, a) {
  x.save(); x.globalAlpha = a; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 40; rrx(x, X0, Y0, w, h, 34); x.fillStyle = 'rgba(14,12,11,.86)'; x.fill(); x.shadowBlur = 0;
  x.lineWidth = 2; x.strokeStyle = 'rgba(255,255,255,.14)'; x.stroke(); x.restore();
}
// a rubber stamp slammed on: big, tilted, a little worn
function stampMark(x, str, cx, cy, col, k, rot, size = 150, icon = null) {
  if (k <= 0) return; const a = clamp(k * 4), s0 = k < 1 ? lerp(1.9, 1, ease(k)) : 1;
  x.save(); x.translate(cx, cy); x.rotate(rot); x.scale(s0, s0); x.globalAlpha = a;
  setF(x, '900 ' + size + 'px Hook', -size * 0.02); const tw = x.measureText(str).width + (icon ? size * 0.9 : 0), pw = tw + size * 0.7, ph = size * 1.3;
  x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 24;
  rrx(x, -pw / 2, -ph / 2, pw, ph, size * 0.22); x.lineWidth = size * 0.09; x.strokeStyle = col; x.stroke();
  rrx(x, -pw / 2 + size * 0.13, -ph / 2 + size * 0.13, pw - size * 0.26, ph - size * 0.26, size * 0.14); x.lineWidth = size * 0.03; x.stroke();
  x.shadowBlur = 0; x.fillStyle = col; x.textAlign = 'left';
  let X0 = -tw / 2; if (icon === 'check') { x.lineWidth = size * 0.14; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(X0 + size * 0.05, 0); x.lineTo(X0 + size * 0.3, size * 0.26); x.lineTo(X0 + size * 0.68, -size * 0.3); x.stroke(); X0 += size * 0.9; }
  x.fillText(str, X0, size * 0.36);
  x.globalCompositeOperation = 'destination-out'; x.globalAlpha = 0.35; x.drawImage(NOISE[2], -pw / 2, -ph / 2, pw, ph);
  x.restore();
}
// "So armor got thicker": two cross-sections of plate, the second growing
function thickCard(x, t) {
  const a = win(t, K.thick + 0.15, K.heavier - 0.08, 0.2, 0.12); if (a <= 0) return;
  const X0 = 120, Y0 = 1330, w = 840, h = 300; glass(x, X0, Y0, w, h, a);
  x.save(); x.globalAlpha = a; setF(x, '700 34px Body', 0); x.fillStyle = 'rgba(255,255,255,.75)'; x.textAlign = 'left'; x.fillText('the plate, cut through', X0 + 40, Y0 + 60);
  const grow_ = ease((t - K.thicker + 0.1) / 0.45), th1 = 22, th2 = lerp(22, 74, grow_);
  const bar = (Y, th, lab, col) => { const q = x.createLinearGradient(0, Y - th / 2, 0, Y + th / 2); q.addColorStop(0, '#E9EDF2'); q.addColorStop(0.5, '#9BA3AD'); q.addColorStop(1, '#5E656E'); rrx(x, X0 + 40, Y - th / 2, 560, th, 6); x.fillStyle = q; x.fill();
    setF(x, '700 34px Body', 0); x.fillStyle = col; x.fillText(lab, X0 + 630, Y + 12); };
  bar(Y0 + 135, th1, 'before', 'rgba(255,255,255,.7)'); bar(Y0 + 225, th2, 'thicker', grow_ > 0.05 ? WHT : 'rgba(255,255,255,.4)');
  x.restore();
}
// "Some suits hit 39 kilos": a scale that counts up and lands
function weightCard(x, t) {
  const a = win(t, K.kilos + 0.08, K.really - 0.06, 0.15, 0.15); if (a <= 0) return;
  const n = Math.round(39 * eio(clamp((t - K.kilos - 0.1) / (K.n39 - K.kilos - 0.1)))), land = t >= K.n39;
  const s0 = land ? 1 + 0.22 * Math.exp(-(t - K.n39) / 0.09) : 1;
  x.save(); x.globalAlpha = a; x.translate(540, 1420); x.scale(s0, s0); x.textAlign = 'center'; x.shadowColor = 'rgba(0,0,0,.85)'; x.shadowBlur = 40;
  setF(x, '800 250px Logo', -8); x.fillStyle = WHT; const str = String(n); const tw = x.measureText(str).width;
  x.fillText(str, -60, 80); setF(x, '700 110px Logo', -2); x.fillStyle = land ? GOLD : 'rgba(255,255,255,.75)'; x.textAlign = 'left'; x.fillText('kg', -60 + tw / 2 + 18, 80);
  x.restore();
}
// "But would it really stop a ball?": a sight closing on the chest, red when it locks
function reticle(x, t) {
  const a = win(t, K.really + 0.05, K.shotL - 0.05, 0.2, 0.15); if (a <= 0) return;
  const [cx, cy, vis] = project(IA); if (!vis) return;
  const k = eio((t - K.really) / (K.ballW - K.really + 0.1)), lock = clamp((t - K.ballW) / 0.12), r = lerp(260, 96, k), col = lock > 0 ? RED : WHT;
  x.save(); x.globalAlpha = a; x.translate(cx, cy); x.rotate((1 - k) * 1.4); x.strokeStyle = col; x.lineWidth = 6; x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 12;
  x.beginPath(); x.arc(0, 0, r, 0, TAU); x.stroke();
  for (let i = 0; i < 4; i++) { x.save(); x.rotate(i * Math.PI / 2); x.beginPath(); x.moveTo(0, -r - 34); x.lineTo(0, -r + 26); x.stroke(); x.restore(); }
  x.fillStyle = col; x.beginPath(); x.arc(0, 0, 9 + 6 * lock, 0, TAU); x.fill();
  if (lock > 0) { x.globalAlpha = a * (1 - lock) ; x.lineWidth = 4; x.beginPath(); x.arc(0, 0, r + 60 * lock, 0, TAU); x.stroke(); }
  x.restore();
}
function flash(x, t, t0, a = 0.85, d = 0.2) { const u = t - t0; if (u < -0.04 || u > d) return; x.fillStyle = 'rgba(255,248,235,' + (u < 0 ? (u + 0.04) / 0.04 : 1 - u / d) * a + ')'; x.fillRect(0, 0, W, H); }

// ---------- the 3D shot ----------
function three(x, t) {
  setWorld(t); backdrop(x, t);
  const shake = jolt(t, K.shoot, 18) + jolt(t, K.hit1, 22) + jolt(t, K.punch, 12) + jolt(t, K.heavier + 0.35, 10) + jolt(t, K.n39, 18) + jolt(t, K.fire, 18) + jolt(t, K.hit2, 22);
  x.save(); x.translate(shake, shake * 0.4);
  R3.render(scene, cam); x.drawImage(glc, 0, 0);
  // labels
  if (BALL.visible && t >= K.guns && t < K.punch - 0.1) label(x, BALL.position.toArray(), -60, 260, 'lead musket ball', win(t, K.musket - 0.08, K.punch - 0.12, 0.25, 0.1));
  if (t >= K.punch && t < K.thick) label(x, PL, 60, 210, 'punched through', win(t, K.through - 0.1, K.thick - 0.05, 0.25, 0.12), { bg: RED, fg: WHT });
  label(x, IA, -40, 250, 'proof mark', win(t, K.proof - 0.1, K.spot - 0.05, 0.3, 0.15), { bg: BLUE, fg: WHT });
  if (t >= K.spot) {
    const s2 = SUIT2.G.localToWorld(v3([0, 12.2, 1.2])).toArray();
    pill(x, '?', ...project(s2).slice(0, 2).map((v, i) => v - (i ? 330 : 0)), 120, true, (t - K.spotless + 0.05) / 0.3, { alpha: 1 - clamp((t - K.nothing + 0.1) / 0.2), bg: 'rgba(20,16,14,.92)', fg: WHT });
    label(x, s2, 0, -300, 'proved nothing', win(t, K.nothing - 0.05, 99, 0.3, 0.2), { bg: RED, fg: WHT, size: 48 });
    label(x, IA, 0, -330, 'proof mark', win(t, K.nothing + 0.1, 99, 0.3, 0.2), { bg: BLUE, fg: WHT, size: 48 });
  }
  x.restore();
  reticle(x, t); thickCard(x, t); weightCard(x, t);
  stampMark(x, 'SOLD', 600, 1430, '#E5322B', clamp((t - K.sell + 0.04) / 0.16) * (1 - clamp((t - K.guns + 0.06) / 0.08)), -0.16);
  stampMark(x, 'PASSED', 540, 1430, GREEN, clamp((t - K.passed + 0.02) / 0.16) * (1 - clamp((t - K.stayedL + 0.06) / 0.08)), -0.1, 130, 'check');
  flash(x, t, K.shoot, 0.22, 0.08); flash(x, t, K.hit1, 0.3, 0.12); flash(x, t, K.fire, 0.22, 0.08); flash(x, t, K.hit2, 0.3, 0.12); flash(x, t, K.punch, 0.25, 0.12);
  const FP = [[K.sell + 0.1, K.guns, 'Armorers proved breastplates by firing a pistol or musket at them, and left the dent in as a guarantee (The Met).'],
    [K.kilos, K.really, 'Cuirassier armor, Milan or Brescia, about 1610–30: 39.24 kg (The Met, 24985).'],
    [K.mark, K.same, 'A London breastplate “bearing at the right of its chest the proof-mark of a musket-shot” (Royal Collection Trust). Scenes are illustrations.']];
  FP.forEach(([a, b, str]) => smallPrint(x, str, win(t, a + 0.15, b - 0.05, 0.3, 0.15)));
}
S.armor = three;

// ---------- the switch: our reel in a phone; a swipe past promises; it stops on proof ----------
const PHN = { cy: 610, s: 0.62 };
let FRZ = null, PROOFIMG = null;
function frozen() { if (!FRZ) { const [c, x] = mkc(1080, 1920); three(x, T0.feed - 1 / FPS); FRZ = c; } return FRZ; }
function proofImg() {                                // the proof ad: the dent, close, warm light
  if (!PROOFIMG) {
    const [c, x] = mkc(1080, 1920); setWorld(K.stayed); backdrop(x, 0);
    cam.position.set(...NI(6.5, 1.5, 1.0)); cam.fov = 30; cam.updateProjectionMatrix(); cam.lookAt(IA[0] + 0.4, IA[1] - 0.6, IA[2]);
    SWEEP.intensity = 14; SWEEP.position.set(...NI(0.9, -0.6, 0.6));
    R3.render(scene, cam); x.drawImage(glc, 0, 0); PROOFIMG = c;
  }
  return PROOFIMG;
}
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
const REELS = [
  { kind: 'ours' },
  { kind: 'claim', bg: ['#FFD84D', '#FFB020'], fg: INK, lines: ['BEST', 'QUALITY.', 'GUARANTEED.'], name: 'brand_a' },
  { kind: 'claim', bg: ['#FF6A5F', '#E0303A'], fg: WHT, lines: ['#1 RATED', 'IN TOWN!'], name: 'brand_b' },
  { kind: 'claim', bg: ['#5B8CFF', '#2F5BEA'], fg: WHT, lines: ['100%', 'SATISFACTION.'], name: 'brand_c' },
  { kind: 'proof', name: 'yourbrand' },
];
function reelPage(c, r, t) {                         // one full-screen reel, 600 x 1280
  if (r.kind === 'ours') c.drawImage(frozen(), -60, 0, 720, 1280);
  else if (r.kind === 'proof') c.drawImage(proofImg(), -60, 0, 720, 1280);
  else {
    const q = c.createLinearGradient(0, 0, 0, 1280); q.addColorStop(0, r.bg[0]); q.addColorStop(1, r.bg[1]); c.fillStyle = q; c.fillRect(0, 0, 600, 1280);
    c.save(); c.textAlign = 'center'; c.fillStyle = r.fg; r.lines.forEach((l, i) => { setF(c, '900 96px Hook', -2); const w0 = c.measureText(l).width; const fs = 96 * Math.min(1, 520 / w0); setF(c, '900 ' + fs + 'px Hook', -2); c.fillText(l, 300, 470 + i * 104 - (r.lines.length - 2) * 52); });
    c.globalAlpha = 0.6; setF(c, '700 30px Body', 0); c.fillText('(trust us)', 300, 470 + r.lines.length * 104 - (r.lines.length - 2) * 52 + 10); c.restore();
  }
  const q = c.createLinearGradient(0, 760, 0, 1280); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,.72)'); c.fillStyle = q; c.fillRect(0, 760, 600, 520);
  rail(c, r.kind === 'proof' ? t - K.proofW : -1);
  if (r.kind === 'ours') acct(c, 'mezmedia_0', null, 'm.', '#111');
  else acct(c, r.name, 'Sponsored', r.name[0].toUpperCase(), r.kind === 'proof' ? '#2F80FF' : '#8E8E93');
  setF(c, '500 26px Body', 0); c.fillStyle = 'rgba(255,255,255,.9)'; c.textAlign = 'left';
  c.fillText(r.kind === 'ours' ? 'Why shoot a brand new suit of armor?…' : r.kind === 'proof' ? 'Shot at. Still standing. See the test ›' : 'The best. Guaranteed. Promise. ›', 30, 1090);
  if (r.kind !== 'ours') { rrx(c, 24, 1118, 552, 90, 18); c.fillStyle = 'rgba(255,255,255,.96)'; c.fill(); setF(c, '700 34px Body', 0); c.fillStyle = INK; c.fillText('Shop now', 54, 1176); c.textAlign = 'right'; c.fillText('›', 548, 1177); c.textAlign = 'left'; }
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(0, 1254, 600, 7); c.fillStyle = WHT; c.fillRect(0, 1254, 600 * 0.6, 7);
}
const swipeAt = (t) => {                             // how many reels down the feed has gone
  const a = K.scrollW - 0.06, b = K.stopW + 0.28, u = clamp((t - a) / (b - a));
  return (REELS.length - 1) * (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2) + 0.025 * bump(t, b - 0.02, 0.35);
};
function feedUI(c, t) {
  const f = swipeAt(t), i0 = Math.floor(f), off = (f - i0) * 1280;
  for (let j = 0; j < 2; j++) { const r = REELS[i0 + j]; if (!r) continue; c.save(); c.translate(0, j * 1280 - off); c.beginPath(); c.rect(0, 0, 600, 1280); c.clip(); reelPage(c, r, t); c.restore(); }
  const lk = t - K.proofW;                           // a double-tap heart on the proof
  if (lk > 0 && lk < 0.9) { c.save(); c.globalAlpha = lk < 0.6 ? 1 : 1 - (lk - 0.6) / 0.3; c.fillStyle = WHT; c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 30; c.translate(300, 560); const s0 = back(clamp(lk / 0.25)) * (1 + 0.15 * clamp((lk - 0.4) / 0.5)); c.scale(s0, s0); heart(c, 0, 0, 110); c.restore(); }
}
S.feed = (x, t) => {
  stage(x, true);
  if (!IMG.feedscr) IMG.feedscr = mkc(1200, 2560)[0];
  const k = eio((t - T0.feed) / 0.6);
  phone(x, P(540, lerp(960, PHN.cy, k), PHN.s * Math.pow(1.8 / PHN.s, 1 - k)), 'feedscr', { frame: 'frameDark', shadow: k, over: (c) => feedUI(c, t) });
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
