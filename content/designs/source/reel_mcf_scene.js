// Browser-side scene for reel_mcf.js. Runs as a module after three.js (imported as X), the 2D kit and the phone engine
// (reel_phone_kit.js), whose globals it uses: W, H, g, IMG, clamp, lerp, sstep, ease, expo, eio, back, bump, jolt, mkc,
// rrx, setF, pill, phone, P, stage, rise, zoomAt, vignette, INK, WHT, GREY... It fills S and replaces the kit's
// captions with the Face ID reel's: at the top, building word by word.
// A dessert counter (1 unit = 1 m): a soft-serve mixer whose square spindle slots into the hollow handle of the spoon
// standing in a cup and spins it; inside the handle (y = 100); the spoon on a turntable (y = -100); and a blender for
// the ad in the phone (y = 200). Everything here is our own illustration: no logos.

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

// ---------- a dessert counter (1 unit = 1 m; the counter top is y = 0): brushed steel, white tiles ----------
const SITE = new X.Group(); scene.add(SITE);
const brushTex = (() => {
  const [c, x] = mkc(512, 512); x.fillStyle = '#B9BEC4'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1800; i++) { const v = RN(i + 2000) < 0.5 ? 235 : 150; x.fillStyle = `rgba(${v},${v},${v},${0.02 + 0.035 * RN(i + 2001)})`; x.fillRect(0, 512 * RN(i + 2002), 512, 1); }
  const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; t0.repeat.set(2, 2); return t0;
})();
const steelM = new X.MeshStandardMaterial({ color: '#FFFFFF', map: brushTex, metalness: 0.7, roughness: 0.4, envMapIntensity: 1.2 });
const darkSteel = MAT('#3B3F45', { m: 0.8, r: 0.35 });
const tileTex = (() => {
  const [c, x] = mkc(512, 512); x.fillStyle = '#4E1916'; x.fillRect(0, 0, 512, 512);
  for (let r = 0; r < 8; r++) for (let k = -1; k < 4; k++) { const v = RN(r * 11 + k + 30); x.fillStyle = `rgb(${132 + 14 * v},${44 + 6 * v},${38 + 5 * v})`; x.fillRect(k * 128 + (r % 2) * 64 + 3, r * 64 + 3, 122, 58); }
  const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; t0.repeat.set(3, 2); return t0;
})();
{
  const top = new X.Mesh(new X.BoxGeometry(3, 0.04, 1.2), steelM); top.position.set(0, -0.02, 0); SITE.add(top);
  const front = new X.Mesh(new X.BoxGeometry(3, 0.9, 0.02), MAT('#9DA3AA', { m: 0.8, r: 0.4 })); front.position.set(0, -0.47, 0.59); SITE.add(front);
  const wall = new X.Mesh(new X.PlaneGeometry(3, 1.6), MAT('#FFFFFF', { map: tileTex, r: 0.3, env: 0.5 })); wall.position.set(0, 0.8, -0.6); SITE.add(wall); SITE.userData.wall = wall; SITE.userData.top = top; SITE.userData.front = front;
}
const KEYL = new X.PointLight('#FFF1DC', 2.2, 3, 1.6); KEYL.position.set(0.5, 0.9, 0.5); SITE.add(KEYL);
// ---------- the mixer: a steel column, a motor head with a square spindle pointing down, a cup holder that rises ----------
const AXZ = -0.2;                                          // the spindle's axis is at x = 0, z = AXZ
const MACH = new X.Group(); SITE.add(MACH);
const LEDM = MAT('#FF3B30', { e: '#FF3B30', ei: 1.2 });
{
  const base = new X.Mesh(new X.BoxGeometry(0.24, 0.03, 0.3), steelM); base.position.set(0, 0.015, -0.26); MACH.add(base);
  const col = new X.Mesh(new X.BoxGeometry(0.07, 0.62, 0.07), steelM); col.position.set(0, 0.31, -0.37); MACH.add(col);
  const headS = new X.Shape(); const rr = 0.03, hw = 0.11, hh = 0.07; headS.moveTo(-hw + rr, -hh); headS.lineTo(hw - rr, -hh); headS.quadraticCurveTo(hw, -hh, hw, -hh + rr); headS.lineTo(hw, hh - rr); headS.quadraticCurveTo(hw, hh, hw - rr, hh); headS.lineTo(-hw + rr, hh); headS.quadraticCurveTo(-hw, hh, -hw, hh - rr); headS.lineTo(-hw, -hh + rr); headS.quadraticCurveTo(-hw, -hh, -hw + rr, -hh);
  const head = new X.Mesh(new X.ExtrudeGeometry(headS, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 3 }), steelM); head.position.set(0, 0.63, -0.34); MACH.add(head);
  const motor = new X.Mesh(new X.CylinderGeometry(0.06, 0.065, 0.08, 32), MAT('#E9EBEE', { m: 0.3, r: 0.3 })); motor.position.set(0, 0.74, -0.25); MACH.add(motor);
  const panel = new X.Mesh(new X.PlaneGeometry(0.1, 0.045), MAT('#15181C', { r: 0.25, m: 0.2 })); panel.position.set(-0.03, 0.64, -0.128); MACH.add(panel);
  const led = new X.Mesh(new X.CircleGeometry(0.006, 16), LEDM); led.position.set(0.055, 0.64, -0.127); MACH.add(led);
  const collar = new X.Mesh(new X.CylinderGeometry(0.012, 0.014, 0.02, 20), darkSteel); collar.position.set(0, 0.55, AXZ); MACH.add(collar);
}
const SPINM = MAT('#5B6068', { m: 1, r: 0.25 });
const SPINDLE = new X.Group(); SPINDLE.position.set(0, 0.44, AXZ); MACH.add(SPINDLE);
{
  const sh = new X.Mesh(new X.BoxGeometry(0.0048, 0.11, 0.0048), SPINM); sh.position.y = 0.055; SPINDLE.add(sh);
  const tip = new X.Mesh(new X.ConeGeometry(0.0034, 0.006, 4), MAT('#5B6068', { m: 1, r: 0.25 })); tip.rotation.set(Math.PI, Math.PI / 4, 0); tip.position.y = -0.003; SPINDLE.add(tip);
}
const SPINX = new X.LineSegments(new X.EdgesGeometry(new X.BoxGeometry(0.0048, 0.11, 0.0048)), new X.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0 })); SPINX.position.y = 0.055; SPINDLE.add(SPINX);
const HOLDER = new X.Group(); MACH.add(HOLDER);               // rides up and down the column with the cup
{
  const arm = new X.Mesh(new X.BoxGeometry(0.03, 0.012, 0.16), steelM); arm.position.set(0, -0.006, -0.29); HOLDER.add(arm);
  const ring = new X.Mesh(new X.TorusGeometry(0.037, 0.0045, 10, 40), steelM); ring.rotation.x = Math.PI / 2; ring.position.set(0, 0.012, AXZ); HOLDER.add(ring);
  const sled = new X.Mesh(new X.BoxGeometry(0.09, 0.05, 0.03), steelM); sled.position.set(0, 0.0, -0.395); HOLDER.add(sled);
}
// ---------- the cup, the soft serve and the cookie bits ----------
const cupTex = (() => {
  const [c, x] = mkc(1024, 256); x.fillStyle = '#FBFAF7'; x.fillRect(0, 0, 1024, 256);
  x.strokeStyle = '#2F80FF'; x.lineWidth = 22; x.beginPath(); for (let i = 0; i <= 1024; i += 8) { const y0 = 70 + 16 * Math.sin(i / 1024 * TAU * 6); i ? x.lineTo(i, y0) : x.moveTo(i, y0); } x.stroke();
  x.strokeStyle = '#FF5C8A'; x.lineWidth = 10; x.beginPath(); for (let i = 0; i <= 1024; i += 8) { const y0 = 112 + 12 * Math.sin(i / 1024 * TAU * 6 + 1.6); i ? x.lineTo(i, y0) : x.moveTo(i, y0); } x.stroke();
  for (let i = 0; i < 40; i++) { x.fillStyle = ['#FFCC00', '#34C759', '#2F80FF', '#FF5C8A'][i % 4]; x.beginPath(); x.arc(1024 * RN(i + 2100), 150 + 80 * RN(i + 2101), 5 + 5 * RN(i + 2102), 0, TAU); x.fill(); }
  const t0 = tex(c); t0.wrapS = X.RepeatWrapping; return t0;
})();
const CUPH = 0.095, CR0 = 0.032, CR1 = 0.045;
const cupM = new X.MeshStandardMaterial({ color: '#FFFFFF', map: cupTex, roughness: 0.55, metalness: 0, side: X.DoubleSide, transparent: true, opacity: 1 });
const swirlTex = (() => {
  const [c, x] = mkc(512, 512); x.fillStyle = '#F7F3EA'; x.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 7; k++) { x.strokeStyle = `rgba(214,204,186,${0.5 + 0.3 * RN(k + 2200)})`; x.lineWidth = 6 + 6 * RN(k + 2201); x.beginPath(); for (let v = 0; v <= 512; v += 4) { const u0 = (k * 73 + v * 0.9) % 512; v ? x.lineTo(u0, v) : x.moveTo(u0, v); } x.stroke(); }
  for (let i = 0; i < 260; i++) { x.fillStyle = RN(i + 2210) < 0.8 ? '#2A1D17' : '#4A372C'; x.fillRect(512 * RN(i + 2211), 512 * RN(i + 2212), 2 + 5 * RN(i + 2213), 2 + 4 * RN(i + 2214)); }
  const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; return t0;
})();
const creamM = new X.MeshStandardMaterial({ color: '#FFFFFF', map: swirlTex, roughness: 0.62, metalness: 0, transparent: true, opacity: 1 });
function makeCup() {
  const G = new X.Group();
  const prof = []; for (let i = 0; i <= 12; i++) { const v = i / 12; prof.push(new X.Vector2(lerp(CR0, CR1, v), v * CUPH)); }
  const wallG = new X.LatheGeometry(prof, 48); G.add(new X.Mesh(wallG, cupM));
  const bottom = new X.Mesh(new X.CircleGeometry(CR0, 40), MAT('#EEECE6', { r: 0.6, side: X.DoubleSide })); bottom.rotation.x = -Math.PI / 2; bottom.position.y = 0.003; G.add(bottom);
  const rim = new X.Mesh(new X.TorusGeometry(CR1, 0.0022, 8, 60), MAT('#FBFAF7', { r: 0.5 })); rim.rotation.x = Math.PI / 2; rim.position.y = CUPH; G.add(rim);
  const cp = [[0, 0.004], [CR0 - 0.001, 0.004]]; for (let i = 1; i <= 8; i++) { const v = i / 8 * 0.088; cp.push([lerp(CR0, CR1, v / CUPH) - 0.0015, v]); }
  [[0.038, 0.094], [0.03, 0.101], [0.017, 0.106], [0.0, 0.108]].forEach((p) => cp.push(p));
  const cream = new X.Mesh(new X.LatheGeometry(cp.map(([a, b]) => new X.Vector2(a, b)), 48), creamM); G.add(cream); G.userData.cream = cream;
  return G;
}
// the spoon: an oval bowl at the bottom, a long square tube for a handle (really hollow), white plastic
const spoonM = new X.MeshStandardMaterial({ color: '#F5F6F7', roughness: 0.38, metalness: 0, transparent: true, opacity: 1, side: X.DoubleSide });
const SPH = 0.225, HW = 0.00425, HIN = 0.00275;                // handle top height, outer and inner half-widths
function makeSpoon(m = spoonM) {
  const G = new X.Group();
  const bowl = new X.Mesh(new X.SphereGeometry(1, 28, 14, 0, TAU, 0, Math.PI / 2), m); bowl.scale.set(0.0125, 0.0055, 0.02); bowl.rotation.x = -Math.PI / 2; bowl.position.y = 0.026; G.add(bowl);
  const lip = new X.Mesh(new X.TorusGeometry(1, 0.08, 6, 40), m); lip.scale.set(0.0125, 0.02, 0.012); lip.position.y = 0.026; G.add(lip);
  const neck = new X.Mesh(new X.BoxGeometry(0.0075, 0.02, 0.003), m); neck.position.y = 0.05; G.add(neck);
  const L = SPH - 0.058, wt = HW - HIN, mid = (HW + HIN) / 2;
  [[0, mid, 2 * HW, wt], [0, -mid, 2 * HW, wt]].forEach(([x0, z0, w, d]) => { const s0 = new X.Mesh(new X.BoxGeometry(w, L, d), m); s0.position.set(x0, 0.058 + L / 2, z0); G.add(s0); });
  [[mid, 0], [-mid, 0]].forEach(([x0, z0]) => { const s0 = new X.Mesh(new X.BoxGeometry(wt, L, 2 * HIN), m); s0.position.set(x0, 0.058 + L / 2, z0); G.add(s0); });
  return G;
}
const CUP = makeCup(); MACH.add(CUP); CUP.position.set(0, 0.06, AXZ);
const SPOON = makeSpoon(); CUP.add(SPOON); SPOON.position.y = 0.012;
// the handle seen through: outlines for the X-ray shot
const XRAYL = new X.LineSegments(new X.EdgesGeometry(new X.BoxGeometry(2 * HW, SPH - 0.058, 2 * HW)), new X.LineBasicMaterial({ color: '#BFE3FF', transparent: true, opacity: 0 }));
XRAYL.position.y = 0.058 + (SPH - 0.058) / 2; SPOON.add(XRAYL);
const CRUMBS = Array.from({ length: 120 }, (_, i) => {
  const m = new X.Mesh(new X.BoxGeometry(1, 1, 1), MAT(RN(i + 2300) < 0.85 ? '#241914' : '#4A372C', { r: 0.7 }));
  const s0 = 0.002 + 0.0028 * RN(i + 2301); m.scale.set(s0 * (0.7 + 0.6 * RN(i + 2302)), s0 * 0.6, s0); m.userData = { r: 0.004 + 0.036 * Math.sqrt(RN(i + 2303)), a: RN(i + 2304) * TAU, h: RN(i + 2305), rot: RN(i + 2306) * 3, sp: 0.6 + 0.8 * RN(i + 2307) };
  CUP.add(m); return m;
});
// the row of cups, each with its own spoon
const ROW = Array.from({ length: 5 }, (_, i) => { const c0 = makeCup(); c0.position.set(-0.36 + 0.18 * i, 0, 0.12); c0.rotation.y = RN(i + 2400) * TAU; const sp = makeSpoon(); sp.position.y = 0.012; sp.rotation.y = 0.4 * (RN(i + 2401) - 0.5); c0.add(sp); c0.userData.spoon = sp; SITE.add(c0); return c0; });
// the cup that is served: on the front of the counter, its spoon lifting a scoop
const SERVED = makeCup(); SERVED.position.set(0, 0, 0.16); SITE.add(SERVED);
const SSPOON = makeSpoon(); SERVED.add(SSPOON); SSPOON.position.y = 0.012;
const SCOOP = new X.Mesh(new X.SphereGeometry(0.014, 20, 14), creamM); SCOOP.scale.set(0.95, 1.25, 0.62); SCOOP.position.set(0, 0.028, 0.006); SSPOON.add(SCOOP);
// ---------- inside the handle (y = 100): a square tunnel of white plastic, light at the far end, the spindle coming in ----------
const TUNNEL = new X.Group(); TUNNEL.position.set(0, 100, 0); TUNNEL.visible = false; scene.add(TUNNEL);
const tubeTex = (() => {
  const [c, x] = mkc(256, 1024); const q = x.createLinearGradient(0, 0, 256, 0); q.addColorStop(0, '#DCE3EA'); q.addColorStop(0.5, '#F6F8FA'); q.addColorStop(1, '#DCE3EA'); x.fillStyle = q; x.fillRect(0, 0, 256, 1024);
  for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(150,165,180,${0.12 + 0.12 * RN(i + 2500)})`; x.fillRect(0, 1024 * RN(i + 2501), 256, 2 + 5 * RN(i + 2502)); }
  x.fillStyle = 'rgba(140,155,170,.25)'; x.fillRect(124, 0, 3, 1024);
  const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; t0.repeat.set(1, 6); return t0;
})();
const TSP = new X.Group();
{
  const wm = new X.MeshStandardMaterial({ color: '#FFFFFF', map: tubeTex, roughness: 0.4, emissive: '#CFE2FF', emissiveIntensity: 0.25, side: X.DoubleSide });
  [[0, -0.5, 0, -Math.PI / 2, 0], [0, 0.5, 0, Math.PI / 2, 0], [-0.5, 0, 0, 0, Math.PI / 2], [0.5, 0, 0, 0, -Math.PI / 2]].forEach(([x0, y0, z0, rx, ry]) => { const p0 = new X.Mesh(new X.PlaneGeometry(1, 30), wm); p0.position.set(x0, y0, z0 - 3); p0.rotation.set(rx, ry, 0); if (ry) p0.rotation.set(0, ry, Math.PI / 2); TUNNEL.add(p0); });
  const end = new X.Sprite(glowMat('#FFFFFF', 1)); end.material.toneMapped = false; end.position.set(0, 0, -18); end.scale.set(5, 5, 1); TUNNEL.add(end);
  const endP = new X.Mesh(new X.PlaneGeometry(1.2, 1.2), new X.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false })); endP.position.set(0, 0, -18.05); TUNNEL.add(endP);
  const sp0 = new X.Mesh(new X.BoxGeometry(0.82, 0.82, 12), MAT('#5B6068', { m: 1, r: 0.3 })); sp0.position.z = -6; TSP.add(sp0);
  TSP.position.set(0, 0, -30); TUNNEL.add(TSP);
}
const TLIGHT = new X.PointLight('#FFFFFF', 0, 8, 1.2); TUNNEL.add(TLIGHT);
// ---------- the studio (y = -100): the spoon on a turntable ----------
const STUDIO = new X.Group(); STUDIO.position.set(0, -100, 0); STUDIO.visible = false; scene.add(STUDIO);
const TURN = new X.Group(); STUDIO.add(TURN);
{
  const disc = new X.Mesh(new X.CylinderGeometry(0.09, 0.09, 0.012, 64), MAT('#202328', { m: 0.6, r: 0.3 })); disc.position.y = -0.006; STUDIO.add(disc);
  const stand = new X.Mesh(new X.CylinderGeometry(0.004, 0.004, 0.01, 12), MAT('#C9CDD2', { m: 1, r: 0.2 })); stand.position.y = 0.005; TURN.add(stand);
  const sp = makeSpoon(); sp.position.y = 0.01; TURN.add(sp); TURN.userData.spoon = sp;
}
const SKEY = new X.SpotLight('#FFFFFF', 0, 3, 0.5, 0.6, 1.2); SKEY.position.set(0.4, -99.4, 0.6); SKEY.target.position.set(0, -99.88, 0); scene.add(SKEY, SKEY.target);
const SRIM = new X.PointLight('#8FC4FF', 0, 2, 1.5); SRIM.position.set(-0.3, -99.75, -0.3); scene.add(SRIM);
// ---------- the ad in the phone (y = 200): a blender blending a smoothie, its product doing its job ----------
const BLEND = new X.Group(); BLEND.position.set(0, 200, 0); BLEND.visible = false; scene.add(BLEND);
const BLADES = new X.Group(), FRUIT = [];
let SMOOTH;
{
  const bs = new X.Mesh(new X.CylinderGeometry(0.075, 0.09, 0.1, 40), MAT('#2B2E34', { m: 0.4, r: 0.35 })); bs.position.y = 0.05; BLEND.add(bs);
  const dial = new X.Mesh(new X.CylinderGeometry(0.018, 0.018, 0.012, 24), MAT('#C9CDD2', { m: 1, r: 0.2 })); dial.rotation.x = Math.PI / 2; dial.position.set(0, 0.05, 0.088); BLEND.add(dial);
  const jarP = [[0.05, 0.1], [0.055, 0.12], [0.075, 0.3], [0.08, 0.32]].map(([a, b]) => new X.Vector2(a, b));
  const jar = new X.Mesh(new X.LatheGeometry(jarP, 48), new X.MeshStandardMaterial({ color: '#E8F4FF', transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.1, envMapIntensity: 2, side: X.DoubleSide, depthWrite: false })); BLEND.add(jar);
  const lid = new X.Mesh(new X.CylinderGeometry(0.082, 0.082, 0.02, 48), MAT('#1E2024', { r: 0.4 })); lid.position.y = 0.33; BLEND.add(lid);
  const smTex = (() => { const [c, x] = mkc(512, 256); x.fillStyle = '#F25C8C'; x.fillRect(0, 0, 512, 256); for (let k = 0; k < 9; k++) { x.strokeStyle = `rgba(255,${170 + 40 * RN(k + 2600)},200,.55)`; x.lineWidth = 8; x.beginPath(); for (let v = 0; v <= 256; v += 4) { const u0 = (k * 57 + v * 1.6) % 512; v ? x.lineTo(u0, v) : x.moveTo(u0, v); } x.stroke(); } const t0 = tex(c); t0.wrapS = X.RepeatWrapping; return t0; })();
  const smP = [[0, 0.112], [0.052, 0.112], [0.056, 0.13], [0.071, 0.27], [0.05, 0.285], [0.0, 0.25]].map(([a, b]) => new X.Vector2(a, b));
  SMOOTH = new X.Mesh(new X.LatheGeometry(smP, 48), new X.MeshStandardMaterial({ color: '#FFFFFF', map: smTex, roughness: 0.4, transparent: true, opacity: 0.92 })); BLEND.add(SMOOTH);
  [0, Math.PI / 2].forEach((r0) => { const b0 = new X.Mesh(new X.BoxGeometry(0.07, 0.003, 0.012), MAT('#C9CDD2', { m: 1, r: 0.2 })); b0.rotation.y = r0; BLADES.add(b0); }); BLADES.position.y = 0.125; BLEND.add(BLADES);
  for (let i = 0; i < 16; i++) { const berry = i % 3 !== 2; const m = new X.Mesh(berry ? new X.SphereGeometry(0.009, 14, 10) : new X.CylinderGeometry(0.012, 0.012, 0.006, 20), MAT(berry ? (i % 2 ? '#7A1E3A' : '#C2185B') : '#F7E08A', { r: 0.4 })); m.userData = { r: 0.02 + 0.035 * RN(i + 2700), a: RN(i + 2701) * TAU, h: 0.14 + 0.12 * RN(i + 2702) }; BLEND.add(m); FRUIT.push(m); }
}
const BKEY = new X.PointLight('#FFFFFF', 0, 2, 1.4); BKEY.position.set(0.25, 200.4, 0.45); scene.add(BKEY);
// ---------- the camera: a new set-up about every second ----------
scene.updateMatrixWorld(true);
const VIEW = {
  drop0: [[0.2, 0.2, 0.14], [0, 0.17, AXZ], 40], drop1: [[0.18, 0.2, 0.11], [0, 0.17, AXZ], 39],
  orbit0: [[0.07, 0.34, -0.12], [0, 0.297, AXZ], 34], orbit1: [[-0.04, 0.345, -0.115], [0, 0.297, AXZ], 32],
  tunnel0: [[0, 100, 12], [0, 100, -20], 75], tunnel1: [[0, 100, -1], [0, 100, -20], 75],
  machine0: [[0.5, 0.36, 0.62], [0, 0.36, -0.24], 40], machine1: [[0.44, 0.35, 0.55], [0, 0.36, -0.24], 39],
  lift0: [[0.1, 0.26, 0.16], [0, 0.36, AXZ], 40], lift1: [[0.09, 0.27, 0.13], [0, 0.37, AXZ], 39],
  hero0: [[-0.2, 0.33, 0.12], [0, 0.32, AXZ], 40], hero1: [[-0.18, 0.335, 0.1], [0, 0.325, AXZ], 38],
  xray0: [[0.075, 0.47, -0.12], [0, 0.46, AXZ], 30], xray1: [[0.065, 0.472, -0.13], [0, 0.462, AXZ], 28],
  spin0: [[0.12, 0.48, 0.04], [0, 0.35, AXZ], 40], spin1: [[0.11, 0.475, 0.02], [0, 0.35, AXZ], 39],
  cut0: [[0.1, 0.43, -0.07], [0, 0.345, AXZ], 36], cut1: [[0.09, 0.425, -0.09], [0, 0.345, AXZ], 34],
  top0: [[0.03, 0.47, -0.12], [0, 0.345, AXZ], 50], top1: [[0.025, 0.46, -0.13], [0, 0.345, AXZ], 48],
  release0: [[0.3, 0.4, 0.26], [0, 0.4, AXZ], 36], release1: [[0.3, 0.27, 0.32], [0, 0.21, AXZ], 38],
  eat0: [[0, 0.2, 0.44], [0, 0.11, 0.16], 40], eat1: [[0, 0.19, 0.4], [0, 0.13, 0.16], 38],
  row0: [[1.3, 0.42, 0.75], [0.06, 0.11, 0.12], 28], row1: [[1.15, 0.4, 0.7], [0.06, 0.11, 0.12], 28],
  studio0: [[0, -99.86, 0.66], [0, -99.88, 0], 30], studio1: [[0.07, -99.865, 0.6], [0, -99.88, 0], 30],
  studiob0: [[0.3, -99.97, 0.5], [0, -99.87, 0], 32], studiob1: [[0.27, -99.96, 0.45], [0, -99.87, 0], 31],
};
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
const wpos = (o, p = [0, 0, 0]) => o.localToWorld(v3(p)).toArray();

// ---------- the timeline of the world ----------
const W0 = 16;                                                 // the spin, in radians a second
const omega = (u) => (u < K.spins ? 0 : u < K.staysL ? W0 * sstep((u - K.spins) / 0.25) : W0 * (1 - sstep((u - K.staysL) / 0.3)));
function spinAngle(t) { let th = 0; for (let u = K.spins; u < t; u += 1 / 240) th += omega(u) / 240; return th; }
const holderY = (t) => (t < K.mixerL ? 0.06 : t < K.plugs ? lerp(0.06, 0.19, eio((t - K.spoon2 + 0.1) / 0.6)) : t < K.stays ? lerp(0.19, 0.248, eio((t - K.plugs - 0.05) / 0.5)) : lerp(0.248, 0.06, eio((t - K.stays - 0.05) / 0.5)));
const topY = (r) => 0.108 - 9 * r * r;
function setWorld(t) {
  const n = shotName(t), tun = n === 'tunnel', stu = n === 'studio' || n === 'studiob';
  SITE.visible = !tun && !stu; TUNNEL.visible = tun; STUDIO.visible = stu; BLEND.visible = false;
  hemi.intensity = stu ? 0.2 : 0.75; hemi.color.set('#FFF4E6'); sun.intensity = stu ? 0 : 1.5; sun.color.set('#FFF0DC'); rim.intensity = stu ? 0.5 : 0.9;
  KEYL.intensity = 2.2; SKEY.intensity = stu ? 9 : 0; SRIM.intensity = stu ? 2.5 : 0; TLIGHT.intensity = tun ? 6 : 0; BKEY.intensity = 0;
  // the holder carries the cup up under the spindle, onto it, and back down
  const yp = holderY(t); HOLDER.position.y = yp; CUP.position.y = yp;
  // the spoon drops into the cup on the first frame; the spindle spins it; then it is still
  const th = spinAngle(t), spinning = t > K.spins && t < K.staysL + 0.3;
  SPOON.position.y = 0.012 + (t < 0.2 ? 0.16 * (1 - Math.pow(t / 0.2, 2)) : 0.004 * bump(t, 0.2, 0.18));
  SPOON.rotation.y = th; CUP.userData.cream.rotation.y = th * 0.35;
  CUP.position.x = spinning ? 0.0006 * Math.sin(t * 90) : 0;
  LEDM.color.set(spinning ? '#34C759' : '#FF3B30'); LEDM.emissive.set(spinning ? '#34C759' : '#FF3B30');
  // the cookie bits: on top of the cream, then swirled round and down into it
  const mixK = clamp((t - K.spins) / 1.4);
  CRUMBS.forEach((m, i) => {
    const d = m.userData, a = d.a + th * (0.3 + 0.55 * (1 - d.r / 0.04)) * d.sp, r = d.r * (1 - 0.25 * mixK * Math.pow(Math.sin(i + th * 0.15), 2));
    const yMix = 0.014 + 0.085 * d.h, hop = 0.012 * bump(t, 0.2, 0.26) * (0.4 + RN(i + 2350));
    m.position.set(r * Math.cos(a), lerp(topY(r) + 0.002, yMix, mixK * (0.35 + 0.65 * d.h)) + hop + 0.004 * mixK * Math.sin(th * 0.4 + i), r * Math.sin(a));
    m.rotation.set(d.rot + th * 0.3, d.rot * 2, th * 0.2);
  });
  // see-through for the X-ray of the handle, and for the swirl inside the cup
  const xr = n === 'xray', cutv = n === 'cut';
  spoonM.opacity = xr ? 0.22 : 1; spoonM.depthWrite = !xr; spoonM.emissive.set(xr ? '#3A78C2' : '#000000'); XRAYL.material.opacity = xr ? 0.95 : 0; SPINX.material.opacity = xr ? 0.8 : 0; SPINM.emissive.set(xr ? '#FF9F1A' : '#000000'); SPINM.emissiveIntensity = xr ? 0.9 : 1;
  SITE.userData.wall.visible = !xr; SITE.userData.top.visible = !xr; SITE.userData.front.visible = !xr; KEYL.intensity = xr ? 0.6 : 2.2;
  cupM.opacity = 1; creamM.opacity = 1;
  // served: the cup on the front of the counter, its spoon lifting a scoop
  MACH.visible = n !== 'eat' && n !== 'row'; CUP.visible = MACH.visible; SERVED.visible = n === 'eat'; ROW.forEach((c0) => { c0.visible = n === 'row'; });
  const e = eio((t - K.eat + 0.2) / 0.55); SSPOON.position.set(0, 0.012 + 0.1 * e, 0.012 * e); SSPOON.rotation.x = 0.3 * e; SCOOP.visible = true;
  SERVED.userData.cream.rotation.y = 0.8;
  // the tunnel: the spindle comes in from the light at the far end
  if (tun) { const c0 = camAt(t); TLIGHT.position.set(0, 0, c0[2] - 100 * 0 - 3); TSP.position.z = lerp(-30, -8, sstep((t - (K.mixerL - 0.45)) / 0.45)); }
  // the studio: the spoon turning slowly
  TURN.rotation.y = 0.6 + 0.9 * (t - K.jobsL);
  const c0 = camAt(t); cam.position.set(c0[0], c0[1], c0[2]); cam.lookAt(c0[3], c0[4], c0[5]); cam.fov = c0[6]; cam.near = n === 'tunnel' ? 0.05 : 0.005; cam.updateProjectionMatrix();
}

// ---------- 2D: the backdrop ----------
function backdrop(x, t) {
  const n = shotName(t), q = x.createLinearGradient(0, 0, 0, H);
  if (n === 'tunnel') { q.addColorStop(0, '#EAF2FA'); q.addColorStop(1, '#C7D3DE'); }
  else if (n === 'xray') { const r0 = x.createRadialGradient(540, 900, 80, 540, 900, 1200); r0.addColorStop(0, '#12355E'); r0.addColorStop(1, '#050B16'); x.fillStyle = r0; x.fillRect(0, 0, W, H); return; }
  else if (n === 'studio' || n === 'studiob') { const r0 = x.createRadialGradient(540, 820, 60, 540, 900, 1100); r0.addColorStop(0, '#3A3F48'); r0.addColorStop(1, '#0B0C0F'); x.fillStyle = r0; x.fillRect(0, 0, W, H); return; }
  else { q.addColorStop(0, '#F1EDE6'); q.addColorStop(1, '#D9D3CA'); }
  x.fillStyle = q; x.fillRect(0, 0, W, H);
}

const pillHalf = (str, size) => { setF(g, '600 ' + size + 'px Body', -size * 0.02); return (g.measureText(str).width + size * 1.05) / 2; };
function label(x, p3, dx, dy, str, k, o = {}) {
  if (k <= 0) return; const [ax, ay, vis] = project(p3); if (!vis || ax < 0 || ax > W || ay < 0 || ay > H) return;   // nothing for things out of shot
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
function flash(x, t, t0, a = 0.85, d = 0.2) { const u = t - t0; if (u < -0.04 || u > d) return; x.fillStyle = 'rgba(255,248,235,' + (u < 0 ? (u + 0.04) / 0.04 : 1 - u / d) * a + ')'; x.fillRect(0, 0, W, H); }






// ---------- the 3D shot ----------
function spinArcs(x, t, c3) {                          // two curved arrows circling the handle: it spins
  const k = ease((t - K.spins + 0.02) / 0.2); if (k <= 0) return;
  const ph = (t - K.spins) * 9;
  x.save(); x.globalAlpha = k; x.strokeStyle = WHT; x.fillStyle = WHT; x.lineWidth = 9; x.lineCap = 'round'; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 12;
  [0, Math.PI].forEach((o) => {
    const pts = []; for (let i = 0; i <= 14; i++) { const a = ph + o + i / 14 * 2.2; pts.push(project([c3[0] + 0.03 * Math.cos(a), c3[1], c3[2] + 0.03 * Math.sin(a)])); }
    x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.stroke();
    const [ax, ay] = pts[14], [bx, by] = pts[12], an = Math.atan2(ay - by, ax - bx);
    x.beginPath(); x.moveTo(ax + 26 * Math.cos(an), ay + 26 * Math.sin(an)); x.lineTo(ax + 18 * Math.cos(an + 2.3), ay + 18 * Math.sin(an + 2.3)); x.lineTo(ax + 18 * Math.cos(an - 2.3), ay + 18 * Math.sin(an - 2.3)); x.closePath(); x.fill();
  });
  x.restore();
}
function three(x, t, clean = false) {
  setWorld(t); backdrop(x, t);
  const shake = jolt(t, 0.2, 9) + jolt(t, K.handle2 + 0.05, 6) + jolt(t, K.mixerW, 5);
  x.save(); x.translate(shake, shake * 0.4);
  R3.render(scene, cam); x.drawImage(glc, 0, 0);
  const n = shotName(t), scr = x.createLinearGradient(0, 0, 0, 600), sa = n === 'tunnel' ? 0.42 : 0.3;
  scr.addColorStop(0, `rgba(0,0,0,${sa})`); scr.addColorStop(0.55, `rgba(0,0,0,${sa * 0.5})`); scr.addColorStop(1, 'rgba(0,0,0,0)'); if (!clean) { x.fillStyle = scr; x.fillRect(-40, -40, W + 80, 640); }
  if (clean) { x.restore(); return; }
  const yp = holderY(t);
  if (n === 'orbit') label(x, [0, yp + 0.012 + SPH, AXZ], 0, 300, 'hollow?', win(t, K.spoon + 0.05, K.hollow + 0.2, 0.2, 0.1), { bg: GOLD, fg: '#1D1D1F' });
  if (n === 'machine' || n === 'lift') label(x, [0, 0.49, AXZ], 160, 300, 'spindle', win(t, K.mcf, K.mixerW, 0.2, 0.1), { bg: BLUE, fg: WHT });
  if (n === 'hero') label(x, wpos(SPOON, [0, 0.12, 0]), -40, 260, 'the mixer', win(t, K.mixerW - 0.06, K.plugL + 0.1, 0.18, 0.08), { bg: GOLD, fg: '#1D1D1F', size: 54 });
  if (n === 'xray') { label(x, [0, 0.478, AXZ], -120, 230, 'spindle', win(t, K.plugL + 0.1, K.spins, 0.2, 0.1), { bg: BLUE, fg: WHT }); label(x, wpos(SPOON, [HW, SPH - 0.012, 0]), 110, 60, 'hollow handle', win(t, K.plugs, K.spins, 0.2, 0.1), { bg: GOLD, fg: '#1D1D1F' }); }
  if (n === 'cut') label(x, CRUMBS[5].getWorldPosition(new X.Vector3()).toArray(), 90, 220, 'toppings', win(t, K.toppings - 0.05, K.ice, 0.2, 0.1), { bg: BLUE, fg: WHT });
  if (n === 'row') ROW.forEach((c0, i) => label(x, wpos(c0.userData.spoon, [0, SPH, 0]), 0, -70, 'mixer', win(t, K.every + 0.2 * i, K.jobsL, 0.18, 0.1), { size: 32, bg: BLUE, fg: WHT }));
  if (n === 'studio' || n === 'studiob') { const sp = TURN.userData.spoon; label(x, wpos(sp, [0, 0.026, 0]), -90, 120, 'spoon', win(t, K.spoon3 - 0.05, T0.feed, 0.2, 0.1), { bg: WHT, fg: INK }); label(x, wpos(sp, [0, 0.17, 0]), 100, 40, 'mixer', win(t, K.two - 0.05, T0.feed, 0.2, 0.1), { bg: GOLD, fg: '#1D1D1F' }); }
  if (n === 'spin' || n === 'cut') spinArcs(x, t, wpos(SPOON, [0, 0.112, 0]));
  x.restore();
  flash(x, t, K.mixerW, 0.25, 0.14); flash(x, t, K.handle2 + 0.05, 0.2, 0.1); flash(x, t, K.jobsW, 0.3, 0.14);
  const FP = [[K.mixerL, K.ownL, 'McDonald’s: “the spoon doubles as a spindle, which restaurant crew use to mix the perfect amount of sweet toppings into our creamy soft serve” (CNN; Fox Business; Scripps News, October 2023).'],
    [K.ownL, T0.feed, 'The McFlurry and its hollow-handled spoon date from 1995 (McDonald’s Canada). In 2023 U.S. restaurants began switching to a reusable spindle and a smaller spoon (CNN). Scenes are illustrations.']];
  FP.forEach(([a, b, str]) => smallPrint(x, str, win(t, a + 0.15, b - 0.05, 0.3, 0.15)));
}
S.site = three;

// ---------- the switch: our reel in a phone; then an ad whose first second does two jobs ----------
const PHN = { cy: 610, s: 0.62 };
let FRZ = null;
function frozen() { if (!FRZ) { const [c, x] = mkc(1080, 1920); three(x, T0.feed - 1 / FPS); FRZ = c; } return FRZ; }
const ADC = mkc(1080, 1920);
function adFrame(t, playing) {                         // the ad's video: a blender, its product doing its job
  const [c, x] = ADC, q = x.createLinearGradient(0, 0, 0, 1920); q.addColorStop(0, '#FFE3EC'); q.addColorStop(1, '#FFC9A8'); x.fillStyle = q; x.fillRect(0, 0, 1080, 1920);
  SITE.visible = false; TUNNEL.visible = false; STUDIO.visible = false; BLEND.visible = true;
  hemi.intensity = 0.8; sun.intensity = 1.4; rim.intensity = 1.0; BKEY.intensity = 3; KEYL.intensity = 0; SKEY.intensity = 0; SRIM.intensity = 0; TLIGHT.intensity = 0;
  const tt = playing ? t - K.scroll : 0, kk = clamp(tt / 0.3);
  BLADES.rotation.y = tt * 45; SMOOTH.rotation.y = tt * 7;
  FRUIT.forEach((m, i) => { const d = m.userData, a = d.a + tt * (7 + 3 * RN(i + 2710)), h = lerp(0.12 + 0.01 * (i % 3), d.h, kk);
    m.position.set(lerp(0.4, 1, kk) * d.r * Math.cos(a), h + 0.015 * kk * Math.sin(tt * 14 + i), lerp(0.4, 1, kk) * d.r * Math.sin(a)); m.rotation.set(tt * 5 + i, tt * 3, 0); });
  cam.position.set(0.2 + 0.004 * kk * Math.sin(tt * 70), 200.27, 0.78); cam.lookAt(0, 200.18, 0); cam.fov = 34; cam.near = 0.01; cam.updateProjectionMatrix();
  R3.render(scene, cam); x.drawImage(glc, 0, 0);
  return c;
}
function adPage(c, t) {
  const playing = t >= K.scroll;
  c.drawImage(adFrame(t, playing), -60, 0, 720, 1280);
  const q = c.createLinearGradient(0, 760, 0, 1280); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,.6)'); c.fillStyle = q; c.fillRect(0, 860, 600, 420);
  rail(c, -1); acct(c, 'yourbrand', 'Sponsored', 'y', '#FF5C8A');
  setF(c, '500 26px Body', 0); c.fillStyle = 'rgba(255,255,255,.92)'; c.textAlign = 'left'; c.fillText('Blend it. Drink it. ›', 30, 1090);
  // the progress bar, with the first second marked
  const fs0 = 600 / 6, mk = ease((t - K.first + 0.05) / 0.25);
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(0, 1254, 600, 8);
  if (mk > 0) { c.save(); c.globalAlpha = mk; c.fillStyle = '#FFCC00'; c.fillRect(0, 1250, fs0, 16); c.restore(); pill(c, '1st second', 92, 1205, 34, false, (t - K.first) / 0.25, { f: 'Body', w: 700, bg: '#FFCC00', fg: '#1D1D1F' }); }
  if (playing) { c.fillStyle = WHT; c.fillRect(0, 1254, 600 * clamp((t - K.scroll) / 6), 8); }
  if (t >= K.show - 0.1) { const k = ease((t - K.show + 0.1) / 0.25); c.save(); c.globalAlpha = k; c.translate(0, 110 * (1 - k)); rrx(c, 24, 1118, 552, 90, 18); c.fillStyle = 'rgba(255,255,255,.96)'; c.fill(); setF(c, '700 34px Body', 0); c.fillStyle = INK; c.textAlign = 'left'; c.fillText('Shop now', 54, 1176); c.textAlign = 'right'; c.fillText('›', 548, 1177); c.restore(); }
}
function postCard(c, p) {                              // someone else's post, flicked past
  const cols = [['#4B6CB7', '#182848'], ['#11998E', '#38EF7D'], ['#F7971E', '#FFD200'], ['#8E2DE2', '#4A00E0']][p % 4];
  const q = c.createLinearGradient(0, 0, 600, 1280); q.addColorStop(0, cols[0]); q.addColorStop(1, cols[1]); c.fillStyle = q; c.fillRect(0, 0, 600, 1280);
  c.save(); c.globalAlpha = 0.35; for (let i = 0; i < 4; i++) { c.fillStyle = WHT; c.beginPath(); c.arc(600 * RN(p * 10 + i + 2800), 300 + 600 * RN(p * 10 + i + 2801), 60 + 120 * RN(p * 10 + i + 2802), 0, TAU); c.fill(); } c.restore();
  rail(c, -1); c.beginPath(); c.arc(60, 1010, 31, 0, TAU); c.fillStyle = 'rgba(255,255,255,.7)'; c.fill(); c.fillStyle = 'rgba(255,255,255,.6)'; rrx(c, 106, 995, 180, 24, 12); c.fill(); rrx(c, 30, 1072, 380, 22, 11); c.fill();
}
const swipe1 = (t) => eio((t - (K.adL + 0.38)) / 0.2);
function feedUI(c, t) {
  if (t < K.stopL) {
    const f = swipe1(t), off = f * 1280;
    if (f < 1) { c.save(); c.translate(0, -off); c.drawImage(frozen(), -60, 0, 720, 1280); const q = c.createLinearGradient(0, 760, 0, 1280); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,.72)'); c.fillStyle = q; c.fillRect(0, 860, 600, 420); rail(c, -1); acct(c, 'mezmedia_0', null, 'm.', '#111'); setF(c, '500 26px Body', 0); c.fillStyle = 'rgba(255,255,255,.9)'; c.textAlign = 'left'; c.fillText('Why would anyone make a spoon with a…', 30, 1090); c.restore(); }
    if (f > 0) { c.save(); c.translate(0, 1280 - off); adPage(c, t); c.restore(); }
    return;
  }
  // "Stop the scroll": posts flick past, then the ad lands and stops it
  const u = clamp((t - K.stopL) / (K.scroll - K.stopL + 0.04)), pos = 4 * (1 - Math.pow(1 - u, 3));
  const bounce = t > K.scroll ? 0.035 * Math.sin((t - K.scroll) * 20) * Math.exp(-(t - K.scroll) * 9) : 0;
  for (let p = 0; p <= 4; p++) { const y = (p - pos + bounce) * 1280; if (y > -1280 && y < 1280) { c.save(); c.translate(0, y); p === 4 ? adPage(c, t) : postCard(c, p); c.restore(); } }
}
function checklist(x, t) {                             // the ad's two jobs, ticked off
  [['stop the scroll', K.scroll + 0.1], ['show what you sell', K.sell + 0.02]].forEach(([str, tc], i) => {
    const k = ease((t - K.two2 + 0.05 - 0.12 * i) / 0.25), ok = clamp((t - tc) / 0.15); if (k <= 0) return;
    const Y = 1470 + 104 * i, w = 640, X0 = 540 - w / 2;
    x.save(); x.globalAlpha = k; x.translate(0, 40 * (1 - k));
    rrx(x, X0, Y - 42, w, 84, 42); x.fillStyle = 'rgba(255,255,255,.12)'; x.fill();
    if (ok > 0) { x.save(); x.globalAlpha = k * ok; rrx(x, X0, Y - 42, w, 84, 42); x.fillStyle = '#34C759'; x.fill(); x.restore(); }
    rrx(x, X0 + 24, Y - 22, 44, 44, 10); x.lineWidth = 4; x.strokeStyle = WHT; x.stroke();
    if (ok > 0) { x.lineWidth = 7; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); const p0 = [X0 + 34, Y + 1], p1 = [X0 + 44, Y + 11], p2 = [X0 + 60, Y - 12], q1 = clamp(ok * 2), q2 = clamp(ok * 2 - 1);
      x.moveTo(...p0); x.lineTo(lerp(p0[0], p1[0], q1), lerp(p0[1], p1[1], q1)); if (q2 > 0) x.lineTo(lerp(p1[0], p2[0], q2), lerp(p1[1], p2[1], q2)); x.stroke(); }
    setF(x, '700 42px Body', 0); x.fillStyle = WHT; x.textAlign = 'left'; x.fillText(str, X0 + 92, Y + 15);
    x.restore();
  });
}
S.feed = (x, t) => {
  stage(x, true);
  if (!IMG.feedscr) IMG.feedscr = mkc(1200, 2560)[0];
  const k = eio((t - T0.feed) / 0.6);
  phone(x, P(540, lerp(960, PHN.cy, k), PHN.s * Math.pow(1.8 / PHN.s, 1 - k)), 'feedscr', { frame: 'frameDark', shadow: k, over: (c) => feedUI(c, t) });
  checklist(x, t);
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
