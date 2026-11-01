// Browser-side scene for reel_pump.js. Runs as a module after three.js (imported as X), the 2D kit and the phone engine
// (reel_phone_kit.js), whose globals it uses: W, H, g, IMG, clamp, lerp, sstep, ease, expo, eio, back, bump, jolt, mkc,
// rrx, setF, pill, phone, P, stage, rise, zoomAt, vignette, mixc, INK, WHT, GREY... It fills S and replaces the kit's
// captions with the Face ID reel's: at the top, building word by word.
// A forecourt at night (1 unit = 1 m): a lit canopy, a pump whose display counts, a hatchback with its fuel door open
// and a nozzle in the filler neck. In the set-ups marked X-ray the car and the nozzle go see-through: the venturi, the
// air tube from the tiny port near the tip, the diaphragm, the latch, the spring and the valve show.

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

// ---------- the forecourt at night: concrete, a lit canopy, a pump, a car with its fuel door open ----------
const SITE = new X.Group(); scene.add(SITE);
const concTex = (() => {
  const [c, x] = noiseCanvas(512, 512, '#6E6E6C', 0.12, 20000, 51);
  for (let i = 0; i < 14; i++) { x.fillStyle = `rgba(30,28,26,${0.08 + 0.12 * RN(i + 520)})`; x.beginPath(); x.ellipse(512 * RN(i + 521), 512 * RN(i + 522), 20 + 60 * RN(i + 523), 12 + 40 * RN(i + 524), RN(i + 525) * 3, 0, TAU); x.fill(); }
  x.strokeStyle = 'rgba(40,40,40,.6)'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 256); x.lineTo(512, 256); x.moveTo(256, 0); x.lineTo(256, 512); x.stroke();
  const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; t0.repeat.set(10, 10); return t0;
})();
const GROUND = new X.Mesh(new X.PlaneGeometry(60, 60), MAT('#FFFFFF', { map: concTex, r: 0.85, env: 0.4 })); GROUND.rotation.x = -Math.PI / 2; SITE.add(GROUND);
// the canopy and its lights
{
  const can = new X.Mesh(new X.BoxGeometry(14, 0.5, 9), MAT('#E9ECEF', { r: 0.6 })); can.position.set(0, 5.3, 0.5); SITE.add(can);
  const band = new X.Mesh(new X.BoxGeometry(14.05, 0.22, 9.05), MAT('#C8232C', { r: 0.4, e: '#C8232C', ei: 0.25 })); band.position.set(0, 5.3, 0.5); SITE.add(band);
  for (let i = -2; i <= 2; i++) for (let j = -1; j <= 1; j++) { const p = new X.Mesh(new X.PlaneGeometry(1.2, 1.2), new X.MeshBasicMaterial({ color: '#FFFFFF' })); p.rotation.x = Math.PI / 2; p.position.set(i * 2.6, 5.04, 0.5 + j * 2.6); SITE.add(p); }
  [[-5, -2.5], [5, -2.5], [-5, 3.5], [5, 3.5]].forEach(([a, b]) => { const col = new X.Mesh(new X.BoxGeometry(0.35, 5.1, 0.35), MAT('#D6D9DD', { r: 0.5 })); col.position.set(a, 2.55, b); SITE.add(col); });
}
const glowP = new X.PointLight('#F4F7FF', 26, 14, 1.3); glowP.position.set(0, 4.8, 1.0); SITE.add(glowP);
// the pump: a cabinet with a display that counts
const PUMP = new X.Group(); PUMP.position.set(-1.7, 0, 2.05); PUMP.rotation.y = Math.PI / 2 - 0.35; SITE.add(PUMP);
const dispC = mkc(400, 500), DISPT = tex(dispC[0]);
function drawDisplay(dollars, litres, stopped) {        // a tall display: the sale on top, the litres under it
  const x = dispC[1]; x.fillStyle = '#0B0E0C'; x.fillRect(0, 0, 400, 500);
  x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 2; x.beginPath(); x.moveTo(20, 255); x.lineTo(380, 255); x.stroke();
  x.fillStyle = '#8A948E'; setF(x, '600 32px Body', 0); x.textAlign = 'left'; x.fillText('SALE  $', 26, 58); x.fillText('LITRES', 26, 312);
  x.fillStyle = stopped ? '#7CFFB0' : '#FFB347'; x.shadowColor = x.fillStyle; x.shadowBlur = 18; setF(x, '400 116px Mono', 0); x.textAlign = 'right';
  x.fillText(dollars.toFixed(2), 384, 196); setF(x, '400 92px Mono', 0); x.fillText(litres.toFixed(2), 384, 440); x.shadowBlur = 0;
  DISPT.needsUpdate = true;
}
{
  const body = new X.Mesh(new X.BoxGeometry(0.9, 1.75, 0.5), MAT('#F2F3F5', { r: 0.45, env: 0.8 })); body.position.y = 0.875; PUMP.add(body);
  const top = new X.Mesh(new X.BoxGeometry(0.92, 0.32, 0.52), MAT('#C8232C', { r: 0.4 })); top.position.y = 1.9; PUMP.add(top);
  const base = new X.Mesh(new X.BoxGeometry(1.1, 0.12, 0.7), MAT('#9A9DA1', { r: 0.7 })); base.position.y = 0.06; PUMP.add(base);
  const scr = new X.Mesh(new X.PlaneGeometry(0.36, 0.45), new X.MeshBasicMaterial({ map: DISPT })); scr.position.set(0, 1.4, 0.259); PUMP.add(scr);
  const bezel = new X.Mesh(new X.BoxGeometry(0.44, 0.53, 0.02), MAT('#2B2E33', { r: 0.4 })); bezel.position.set(0, 1.4, 0.243); PUMP.add(bezel);
  const holster = new X.Mesh(new X.BoxGeometry(0.16, 0.22, 0.1), MAT('#2B2E33', { r: 0.5 })); holster.position.set(0.3, 0.95, 0.29); PUMP.add(holster);
  const keys = new X.Mesh(new X.PlaneGeometry(0.22, 0.18), MAT('#3A3D42', { r: 0.4 })); keys.position.set(-0.22, 1.05, 0.252); PUMP.add(keys);
}
drawDisplay(0, 0, false);
// the car: a hatchback seen from its right side, fuel door open at the back
const CAR = new X.Group(); CAR.position.set(0.3, 0, -0.05); SITE.add(CAR);
const paint = MAT('#1E4E8C', { r: 0.25, m: 0.4, env: 1.2 }), glassM = MAT('#14181E', { r: 0.08, m: 0.2, env: 1.5 }), tyre = MAT('#121214', { r: 0.8 });
const carMats = [];
{
  const sh = new X.Shape(); [[-2.1, 0.3], [2.05, 0.3], [2.15, 0.62], [2.0, 0.9], [0.9, 1.0], [0.25, 1.45], [-1.55, 1.48], [-2.1, 1.0]].forEach(([a, b], i) => (i ? sh.lineTo(a, b) : sh.moveTo(a, b)));
  const body = new X.Mesh(new X.ExtrudeGeometry(sh, { depth: 1.7, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 4 }), paint); body.position.z = -0.85; CAR.add(body); carMats.push(paint);
  const win = new X.Shape(); [[0.78, 1.04], [0.28, 1.4], [-1.45, 1.42], [-1.85, 1.06]].forEach(([a, b], i) => (i ? win.lineTo(a, b) : win.moveTo(a, b)));
  [0.94, -0.94].forEach((z0) => { const w0 = new X.Mesh(new X.ShapeGeometry(win), glassM); w0.position.z = z0; if (z0 < 0) w0.rotation.y = Math.PI; CAR.add(w0); });
  [[-1.35, 0.95], [1.35, 0.95], [-1.35, -0.95], [1.35, -0.95]].forEach(([a, b]) => { const w0 = new X.Mesh(new X.CylinderGeometry(0.34, 0.34, 0.24, 28), tyre); w0.rotation.x = Math.PI / 2; w0.position.set(a, 0.34, b); CAR.add(w0); const rim = new X.Mesh(new X.CylinderGeometry(0.2, 0.2, 0.25, 20), MAT('#B8BCC2', { m: 1, r: 0.3 })); rim.rotation.x = Math.PI / 2; rim.position.set(a, 0.34, b); CAR.add(rim); });
  const lamp = new X.Mesh(new X.BoxGeometry(0.06, 0.16, 0.5), MAT('#B0121B', { e: '#FF2A2A', ei: 0.6 })); lamp.position.set(-2.16, 1.0, 0.55); CAR.add(lamp);
}
const FUEL_DOOR = new X.Group(); FUEL_DOOR.position.set(-1.35, 0.98, 0.94); CAR.add(FUEL_DOOR);
{ const d0 = new X.Mesh(new X.CylinderGeometry(0.085, 0.085, 0.012, 24), paint); d0.rotation.x = Math.PI / 2; d0.position.set(-0.09, 0, 0.06); d0.rotation.z = 0.0; FUEL_DOOR.add(d0);
  const ring = new X.Mesh(new X.TorusGeometry(0.06, 0.012, 8, 24), MAT('#2B2E33', { r: 0.5 })); FUEL_DOOR.add(ring); }
// inside the car (X-ray): the filler neck and the tank, with fuel in them
const NECK_TOP = v3([-1.35, 0.98, 0.92]), NECK_BOT = v3([-1.15, 0.42, 0.25]);
const neckCurve = new X.CatmullRomCurve3([NECK_TOP, v3([-1.34, 0.88, 0.8]), v3([-1.28, 0.66, 0.5]), NECK_BOT]);
const NECK = new X.Mesh(new X.TubeGeometry(neckCurve, 40, 0.045, 14, false), MAT('#8F9399', { m: 0.6, r: 0.35, tr: true, op: 0.55, dw: false, side: X.DoubleSide })); CAR.add(NECK);
const TANK = new X.Mesh(new X.BoxGeometry(0.95, 0.28, 0.75), MAT('#5A5E64', { m: 0.5, r: 0.4, tr: true, op: 0.35, dw: false, side: X.DoubleSide })); TANK.position.set(-1.0, 0.36, 0.0); CAR.add(TANK);
const fuelM = new X.MeshStandardMaterial({ color: '#F2A23A', emissive: '#E07A10', emissiveIntensity: 0.55, roughness: 0.25, transparent: true, opacity: 0.85 });
const TANKFUEL = new X.Mesh(new X.BoxGeometry(0.93, 1, 0.73), fuelM); TANKFUEL.position.set(-1.0, 0.23, 0.0); CAR.add(TANKFUEL);
const NECKFUEL = new X.Mesh(new X.BufferGeometry(), fuelM); CAR.add(NECKFUEL);
let neckKey = -1;
function setNeckFuel(k) { if (Math.abs(k - neckKey) < 0.004) return; neckKey = k; NECKFUEL.geometry.dispose(); const pts = neckCurve.getPoints(40).reverse().slice(0, Math.max(2, Math.round(41 * k))); NECKFUEL.geometry = k < 0.02 ? new X.BufferGeometry() : new X.TubeGeometry(new X.CatmullRomCurve3(pts), 30, 0.04, 12, false); }

// ---------- the nozzle: +x runs along the handle toward the spout; the spout tip is the origin of nothing, it is placed in the neck ----------
const NOZ = new X.Group(); CAR.add(NOZ);
const nozM = MAT('#2A2D33', { r: 0.35, m: 0.3 }), spoutM = MAT('#C9CDD2', { m: 1, r: 0.25 }), triggerM = MAT('#D7DADF', { m: 1, r: 0.3 });
const xrayMats = [];
const SPOUT_PTS = [[0, 0, 0], [0.11, -0.005, 0], [0.19, -0.04, 0], [0.235, -0.105, 0], [0.25, -0.17, 0]].map(v3);
const spoutCurve = new X.CatmullRomCurve3(SPOUT_PTS);
const TIP = SPOUT_PTS[4].clone(), PORT = v3([0.243, -0.155, 0.014]);           // the sensing port: a small hole near the tip
let TRIGGER, VALVE, DIAPH, LATCH, SPRING;
{
  const body = new X.Mesh(new X.BoxGeometry(0.24, 0.075, 0.056), nozM); body.position.set(-0.12, 0.0, 0); NOZ.add(body); xrayMats.push(body.material);
  const cap = new X.Mesh(new X.CylinderGeometry(0.03, 0.03, 0.06, 16), nozM); cap.rotation.z = Math.PI / 2; cap.position.set(-0.245, 0.005, 0); NOZ.add(cap);
  const guard = new X.Mesh(new X.TorusGeometry(0.075, 0.009, 8, 24, Math.PI), nozM); guard.rotation.z = Math.PI; guard.position.set(-0.11, -0.04, 0); NOZ.add(guard);
  const spout = new X.Mesh(new X.TubeGeometry(spoutCurve, 40, 0.012, 14, false), spoutM); NOZ.add(spout); xrayMats.push(spout.material);
  const ring = new X.Mesh(new X.TorusGeometry(0.013, 0.002, 6, 16), MAT('#E8B44A', { m: 1, r: 0.3 })); ring.position.copy(PORT); ring.lookAt(PORT.clone().add(v3([0.4, 0.2, 1]))); NOZ.add(ring); NOZ.userData.portRing = ring;
  const hole = new X.Mesh(new X.CircleGeometry(0.0045, 16), new X.MeshBasicMaterial({ color: '#050505' })); hole.position.copy(PORT).add(v3([0, 0, 0.0005])); hole.lookAt(PORT.clone().add(v3([0.4, 0.2, 1]))); NOZ.add(hole);
  TRIGGER = new X.Group(); TRIGGER.position.set(-0.03, -0.035, 0); NOZ.add(TRIGGER);
  const lever = new X.Mesh(new X.BoxGeometry(0.16, 0.014, 0.03), triggerM); lever.position.set(-0.08, 0, 0); TRIGGER.add(lever);
}
// the hose from the pump to the back of the nozzle
const HOSE = new X.Mesh(new X.BufferGeometry(), MAT('#17181B', { r: 0.6 })); SITE.add(HOSE);

// ---------- the cutaway: a big see-through nozzle in the dark (y = 100), tilted so it fits the frame ----------
const CUT = new X.Group(); CUT.position.set(0, 100, 0); CUT.rotation.z = -0.62; CUT.visible = false; scene.add(CUT);
const shellM = new X.MeshStandardMaterial({ color: '#AFC3DA', roughness: 0.3, metalness: 0.1, transparent: true, opacity: 0.16, depthWrite: false, side: X.DoubleSide });
const lineM = new X.LineBasicMaterial({ color: '#CFE2FF', transparent: true, opacity: 0.55 });
const outline = (mesh) => { const e = new X.LineSegments(new X.EdgesGeometry(mesh.geometry, 30), lineM); e.position.copy(mesh.position); e.rotation.copy(mesh.rotation); CUT.add(e); };
const CH_PTS = [[-0.62, 0.0, 0], [-0.3, 0.0, 0], [-0.08, 0.0, 0], [0.12, -0.02, 0], [0.4, -0.06, 0], [0.62, -0.2, 0], [0.74, -0.42, 0]].map(v3);
const chCurve = new X.CatmullRomCurve3(CH_PTS);
const C_PORT = v3([0.7, -0.33, 0.0]), C_CHAMBER = v3([-0.3, 0.15, 0]), C_VALVE = v3([-0.1, 0.0, 0]), C_VENT = v3([0.12, -0.02, 0]);
let C_DIAPH, C_LATCH, C_VALVEM, C_SPRING, C_TRIG, C_LEVEL;
{
  const body = new X.Mesh(new X.BoxGeometry(0.66, 0.26, 0.18), shellM); body.position.set(-0.3, 0.02, 0); CUT.add(body); outline(body);
  const spout = new X.Mesh(new X.TubeGeometry(new X.CatmullRomCurve3([v3([0.0, -0.01, 0]), v3([0.4, -0.06, 0]), v3([0.62, -0.2, 0]), v3([0.75, -0.44, 0])]), 40, 0.062, 18, false), shellM); CUT.add(spout);
  const channel = new X.Mesh(new X.TubeGeometry(chCurve, 80, 0.032, 14, false), new X.MeshStandardMaterial({ color: '#3A2A18', roughness: 0.4, transparent: true, opacity: 0.5, depthWrite: false })); CUT.add(channel);
  const throat = new X.Mesh(new X.TorusGeometry(0.03, 0.012, 10, 24), MAT('#E8B44A', { m: 1, r: 0.3 })); throat.position.copy(C_VENT); throat.rotation.y = Math.PI / 2; CUT.add(throat);
  const portRing = new X.Mesh(new X.TorusGeometry(0.018, 0.006, 8, 20), MAT('#FFC861', { m: 1, r: 0.3, e: '#FFB347', ei: 0.8 })); portRing.position.copy(C_PORT).add(v3([0, 0, 0.06])); CUT.add(portRing); CUT.userData.port = portRing;   // on the face of the spout, toward the camera
  const ch = new X.Mesh(new X.CylinderGeometry(0.085, 0.085, 0.05, 28), new X.MeshStandardMaterial({ color: '#5E7BA8', transparent: true, opacity: 0.35, depthWrite: false })); ch.position.copy(C_CHAMBER); CUT.add(ch); outline(ch);
  C_DIAPH = new X.Mesh(new X.CylinderGeometry(0.078, 0.078, 0.008, 28), MAT('#FF5A5F', { r: 0.5, e: '#FF3B30', ei: 0.35 })); C_DIAPH.position.copy(C_CHAMBER); CUT.add(C_DIAPH);
  C_LATCH = new X.Group(); C_LATCH.position.set(-0.3, 0.12, 0); CUT.add(C_LATCH);
  const rod = new X.Mesh(new X.BoxGeometry(0.012, 0.11, 0.012), MAT('#E8B44A', { m: 1, r: 0.3 })); rod.position.set(0, -0.055, 0); C_LATCH.add(rod);
  const arm = new X.Mesh(new X.BoxGeometry(0.2, 0.012, 0.012), MAT('#E8B44A', { m: 1, r: 0.3 })); arm.position.set(0.1, -0.11, 0); C_LATCH.add(arm);
  C_VALVEM = new X.Mesh(new X.CylinderGeometry(0.04, 0.04, 0.03, 24), MAT('#7CFFB0', { r: 0.4, e: '#22B455', ei: 0.45 })); C_VALVEM.rotation.z = Math.PI / 2; C_VALVEM.position.copy(C_VALVE); CUT.add(C_VALVEM);
  const helix = new X.Curve(); helix.getPoint = (u) => v3([-0.32 + 0.19 * u, 0.03 * Math.cos(u * TAU * 7), 0.03 * Math.sin(u * TAU * 7)]);
  C_SPRING = new X.Mesh(new X.TubeGeometry(helix, 200, 0.004, 6, false), MAT('#D9DDE2', { m: 1, r: 0.3 })); CUT.add(C_SPRING);
  C_TRIG = new X.Group(); C_TRIG.position.set(-0.08, -0.12, 0); CUT.add(C_TRIG);
  const lever = new X.Mesh(new X.BoxGeometry(0.42, 0.028, 0.06), MAT('#C9CDD2', { m: 1, r: 0.3 })); lever.position.set(-0.21, 0, 0); C_TRIG.add(lever);
  const guard = new X.Mesh(new X.TorusGeometry(0.2, 0.014, 8, 28, Math.PI), MAT('#2A2D33', { r: 0.4 })); guard.rotation.z = Math.PI; guard.position.set(-0.32, -0.1, 0); CUT.add(guard);
  const hose = new X.Mesh(new X.CylinderGeometry(0.05, 0.05, 0.3, 18), MAT('#17181B', { r: 0.6 })); hose.rotation.z = Math.PI / 2; hose.position.set(-0.78, 0.0, 0); CUT.add(hose);
  C_LEVEL = new X.Mesh(new X.BoxGeometry(0.5, 1, 0.36), new X.MeshStandardMaterial({ color: '#F2A23A', emissive: '#E07A10', emissiveIntensity: 0.5, roughness: 0.2, transparent: true, opacity: 0.55, depthWrite: false })); CUT.add(C_LEVEL);
}
const airC = new X.CatmullRomCurve3([C_PORT.clone().add(v3([0, 0, 0.055])), C_PORT.clone().add(v3([-0.02, 0.03, 0.03])), v3([0.6, -0.17, 0.0]).add(v3([0, 0.035, 0])), v3([0.38, -0.02, 0]), v3([0.1, 0.05, 0]), v3([-0.12, 0.09, 0]), v3([-0.26, 0.13, 0])]);
const C_AIR = new X.Mesh(new X.TubeGeometry(airC, 80, 0.011, 10, false), MAT('#7FB8FF', { r: 0.3, e: '#2F80FF', ei: 0.7 })); CUT.add(C_AIR);
const C_FUEL = Array.from({ length: 34 }, () => { const m = new X.Mesh(new X.SphereGeometry(0.018, 10, 8), new X.MeshBasicMaterial({ color: '#FFB347' })); CUT.add(m); return m; });
const C_BUB = Array.from({ length: 16 }, () => { const m = new X.Mesh(new X.SphereGeometry(0.013, 10, 8), new X.MeshBasicMaterial({ color: '#EAF4FF' })); CUT.add(m); return m; });
const CUTKEY = new X.PointLight('#FFFFFF', 0, 6, 1.2); CUTKEY.position.set(0.4, 101.0, 1.2); scene.add(CUTKEY);
// the nozzle sits in the filler neck: local +x runs into the car; the spout tip lands inside the neck
NOZ.rotation.y = Math.PI / 2; NOZ.position.copy(v3([-1.34, 0.82, 0.76]).sub(TIP.clone().applyAxisAngle(v3([0, 1, 0]), Math.PI / 2)));
{ const hp = [v3([-1.325, 0.95, 1.868]), v3([-1.3, 0.62, 1.86]), v3([-1.16, 0.4, 1.66]), v3([-1.04, 0.86, 1.42]), v3([-1.04, 0.995, 1.215])];
  HOSE.geometry = new X.TubeGeometry(new X.CatmullRomCurve3(hp), 60, 0.018, 10, false); }
// the gas rising round the tip of the cutaway: level in the world, not tilted with the model
const LEVEL = new X.Mesh(new X.BoxGeometry(0.7, 1, 0.42), new X.MeshStandardMaterial({ color: '#F2A23A', emissive: '#E07A10', emissiveIntensity: 0.5, roughness: 0.2, transparent: true, opacity: 0.6, depthWrite: false })); scene.add(LEVEL);
CUT.remove(C_LEVEL);

// ---------- the camera: a new set-up on almost every line ----------
scene.updateMatrixWorld(true);
const CW_ = (p) => CUT.localToWorld(v3(p)).toArray();
const PW = CW_([0.7, -0.33, 0]), TW = CW_([0.75, -0.44, 0]), VEW = CW_([0.12, -0.02, 0]), CHW = CW_([-0.3, 0.15, 0]), VAW = CW_([-0.15, 0.02, 0]), MIDW = CW_([0.3, -0.1, 0]);
const DW = PUMP.localToWorld(v3([0, 1.4, 0.26])).toArray(), DN = PUMP.localToWorld(v3([0, 1.4, 1.26])).sub(v3(DW)).toArray();
const off = (p, d, s) => [p[0] + d[0] * s, p[1] + d[1] * s, p[2] + d[2] * s];
const VIEW = {
  disp0: [off(off(DW, DN, 0.78), [0.15, 0.04, 0], 1), DW, 38], disp1: [off(off(DW, DN, 0.66), [0.1, 0.02, 0], 1), DW, 36],
  tip0: [off(PW, [0.3, 0.12, 0.62], 1), PW, 34], tip1: [off(PW, [0.22, 0.08, 0.5], 1), PW, 32],
  trig0: [[-0.32, 0.9, 1.72], [-1.04, 0.96, 1.05], 36], trig1: [[-0.38, 0.9, 1.62], [-1.04, 0.96, 1.05], 34],
  dstop0: [off(off(DW, DN, 1.25), [-0.2, -0.2, 0], 1), DW, 38], dstop1: [off(off(DW, DN, 1.12), [-0.16, -0.16, 0], 1), DW, 37],
  xr0: [off(MIDW, [0.15, 0.2, 1.75], 1), MIDW, 38], xr1: [off(MIDW, [0.1, 0.14, 1.5], 1), MIDW, 36],
  port0: [off(PW, [0.28, 0.25, 0.85], 1), off(PW, [-0.08, 0.06, 0], 1), 34], port1: [off(PW, [0.2, 0.2, 0.72], 1), off(PW, [-0.08, 0.06, 0], 1), 32],
  tank0: [off(TW, [0.45, 0.05, 1.7], 1), off(TW, [0, -0.08, 0], 1), 38], tank1: [off(TW, [0.38, 0.06, 1.45], 1), off(TW, [0, -0.06, 0], 1), 36],
  neck0: [off(PW, [0.35, -0.05, 1.0], 1), off(PW, [0, -0.04, 0], 1), 34], neck1: [off(PW, [0.28, -0.02, 0.85], 1), off(PW, [0, -0.03, 0], 1), 32],
  tube0: [off(MIDW, [-0.1, 0.25, 1.2], 1), off(MIDW, [0, 0.05, 0], 1), 36], tube1: [off(MIDW, [-0.14, 0.2, 1.05], 1), off(MIDW, [0, 0.05, 0], 1), 34],
  dia0: [off(CHW, [0.25, 0.3, 0.75], 1), CHW, 34], dia1: [off(CHW, [0.2, 0.24, 0.62], 1), CHW, 32],
  valve0: [off(VAW, [0.3, 0.12, 0.8], 1), VAW, 34], valve1: [off(VAW, [0.24, 0.1, 0.66], 1), VAW, 32],
  wide0: [[3.6, 2.3, 6.8], [-0.6, 1.0, 0.6], 42], wide1: [[3.2, 2.1, 6.1], [-0.6, 1.0, 0.6], 41],
  hero0: [off(PW, [0.18, 0.06, 0.48], 1), PW, 30], hero1: [off(PW, [0.14, 0.05, 0.4], 1), PW, 28],
};
const CUTSET = new Set(['tip', 'xr', 'port', 'tank', 'neck', 'tube', 'dia', 'valve', 'hero']);
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
const RATE = 1.9;                                     // dollars a second at the pump
const sale = (t) => t < K.stop1 ? RATE * t : t < K.rushL ? RATE * K.stop1 : RATE * (K.stop1 + Math.min(t, K.shut) - K.rushL);
const flowing = (t) => t < K.stop1 || (t >= K.rushL && t < K.shut);
const airOn = (t) => flowing(t) && t < K.covers + 0.2;
let dispKey = '';
function setWorld(t) {
  const name = shotName(t), inCut = CUTSET.has(name), xr = false;
  SITE.visible = !inCut; CUT.visible = inCut; LEVEL.visible = inCut; CUTKEY.intensity = inCut ? 6 : 0; glowP.intensity = inCut ? 0 : 26;
  hemi.intensity = inCut ? 0.7 : 0.45; sun.intensity = inCut ? 1.4 : 1.0;
  // X-ray of the car for the tank
  [paint, glassM].forEach((m) => { if (m.transparent !== xr) { m.transparent = xr; m.needsUpdate = true; } m.depthWrite = !xr; });
  paint.opacity = xr ? 0.14 : 1; glassM.opacity = xr ? 0.1 : 1; NECK.visible = TANK.visible = TANKFUEL.visible = NECKFUEL.visible = xr;
  // the pump display
  const d = sale(t), stopped = !flowing(t), key = d.toFixed(2) + stopped;
  if (key !== dispKey) { drawDisplay(d, d / 1.89, stopped); dispKey = key; }
  TANKFUEL.scale.y = lerp(0.08, 0.24, clamp((t - K.rushL) / (K.covers - K.rushL))); TANKFUEL.position.y = 0.22 + TANKFUEL.scale.y / 2;
  setNeckFuel(clamp((t - K.full + 0.2) / (K.covers + 0.25 - K.full + 0.2)) * 0.9);
  // the real nozzle's trigger: squeezed while it pumps, let go when it stops
  const trigDown = t < K.stop1 ? 0 : t < K.rushL ? ease((t - K.stop1) / 0.08) : t < K.snaps ? 0 : ease((t - K.snaps) / 0.08);
  TRIGGER.rotation.z = 0.3 * (1 - trigDown);
  // the cutaway: fuel along the channel, air up the little tube, the level rising over the port
  const fl = flowing(t), ar = airOn(t);
  C_FUEL.forEach((m, i) => { m.visible = fl; if (fl) m.position.copy(chCurve.getPoint((i / C_FUEL.length + t * 0.9) % 1)); });
  C_BUB.forEach((m, i) => { m.visible = ar; if (ar) m.position.copy(airC.getPoint((i / C_BUB.length + t * 0.7) % 1)); });
  C_AIR.material.emissiveIntensity = ar ? 0.8 : 0.12;
  const lk = clamp((t - K.full + 0.2) / (K.covers + 0.25 - K.full + 0.2)), top = lerp(TW[1] - 0.3, PW[1] + 0.07, ease(lk)), bot = TW[1] - 0.7;
  LEVEL.scale.y = Math.max(0.001, top - bot); LEVEL.position.set(TW[0] - 0.02, (top + bot) / 2, TW[2]); LEVEL.visible = inCut && lk > 0 && name !== 'hero';
  const pullD = ease((t - K.yanks + 0.05) / 0.25), trip = ease((t - K.snaps + 0.12) / 0.1), shut = ease((t - K.snaps) / 0.07);
  C_DIAPH.position.set(C_CHAMBER.x, C_CHAMBER.y + 0.022 * pullD, 0); C_DIAPH.scale.set(1, 1 + 2 * pullD, 1);
  C_LATCH.rotation.z = 0.45 * trip; C_VALVEM.position.set(C_VALVE.x, C_VALVE.y + 0.07 * (1 - shut), 0);
  C_VALVEM.material.color.set(shut > 0.5 ? '#FF5A5F' : '#7CFFB0'); C_VALVEM.material.emissive.set(shut > 0.5 ? '#FF3B30' : '#22B455');
  C_SPRING.scale.set(1 + 0.2 * shut, 1, 1); C_TRIG.rotation.z = fl ? 0.16 : 0;
  CUT.userData.port.material.emissiveIntensity = 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(t * 8));
  const c0 = camAt(t); cam.position.set(c0[0], c0[1], c0[2]); cam.lookAt(c0[3], c0[4], c0[5]); cam.fov = c0[6]; cam.updateProjectionMatrix();
}

// ---------- 2D: backdrop, crossed-out icons ----------
function backdrop(x, t) {
  const inCut = CUTSET.has(shotName(t)), q = x.createLinearGradient(0, 0, 0, H);
  if (inCut) { q.addColorStop(0, '#0A1424'); q.addColorStop(1, '#03060C'); x.fillStyle = q; x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(120,170,255,.08)'; x.lineWidth = 2; for (let i = -10; i < 30; i++) { x.beginPath(); x.moveTo(i * 60, 0); x.lineTo(i * 60, H); x.stroke(); x.beginPath(); x.moveTo(0, i * 60 + 20); x.lineTo(W, i * 60 + 20); x.stroke(); } return; }
  q.addColorStop(0, '#05070C'); q.addColorStop(0.55, '#101626'); q.addColorStop(1, '#1A1E26'); x.fillStyle = q; x.fillRect(0, 0, W, H);
}
function nope(x, t, t0, t1, X0, Y0, draw) {           // an icon that gets crossed out
  const a = win(t, t0 - 0.05, t1, 0.12, 0.12); if (a <= 0) return; const k = ease((t - t0 - 0.12) / 0.18);
  x.save(); x.globalAlpha = a; x.translate(X0, Y0); x.scale(back(clamp((t - t0 + 0.05) / 0.2)), back(clamp((t - t0 + 0.05) / 0.2)));
  rrx(x, -120, -120, 240, 240, 48); x.fillStyle = 'rgba(16,18,24,.85)'; x.fill(); x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 3; x.stroke();
  x.strokeStyle = WHT; x.lineWidth = 9; x.lineCap = 'round'; x.lineJoin = 'round'; draw(x);
  x.strokeStyle = RED; x.lineWidth = 16; x.beginPath(); x.moveTo(-95, -95); x.lineTo(-95 + 190 * k, -95 + 190 * k); x.stroke(); x.restore();
}
const chipIcon = (x) => { x.strokeRect(-50, -50, 100, 100); x.strokeRect(-22, -22, 44, 44); for (let i = -1; i <= 1; i++) { [[-50, -70], [50, 70]].forEach(([a, b]) => { x.beginPath(); x.moveTo(i * 26, a); x.lineTo(i * 26, b); x.stroke(); x.beginPath(); x.moveTo(a, i * 26); x.lineTo(b, i * 26); x.stroke(); }); } };
const waveIcon = (x) => { x.beginPath(); x.arc(0, 30, 10, 0, TAU); x.stroke(); [40, 70].forEach((r) => { x.beginPath(); x.arc(0, 30, r, -2.4, -0.74); x.stroke(); }); };

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
function flash(x, t, t0, a = 0.85, d = 0.2) { const u = t - t0; if (u < -0.04 || u > d) return; x.fillStyle = 'rgba(255,248,235,' + (u < 0 ? (u + 0.04) / 0.04 : 1 - u / d) * a + ')'; x.fillRect(0, 0, W, H); }




// ---------- the 3D shot ----------
function three(x, t) {
  setWorld(t); backdrop(x, t);
  const shake = jolt(t, K.stop1, 8) + jolt(t, K.snaps, 12) + jolt(t, K.hole1, 5);
  x.save(); x.translate(shake, shake * 0.4);
  R3.render(scene, cam); x.drawImage(glc, 0, 0);
  const n = shotName(t);
  if (n === 'tip') label(x, PW, 40, -330, 'a tiny hole', win(t, K.hole1 - 0.1, K.stopL - 0.05, 0.25, 0.1), { bg: GOLD, fg: '#1D1D1F' });
  if (n === 'xr') label(x, VEW, 40, 330, 'a venturi: fast gas, low pressure', win(t, K.rushes - 0.05, K.sucks - 0.08, 0.25, 0.1));
  if (n === 'port') label(x, CW_([0.6, -0.14, 0]), -40, 360, 'air, sucked up a little tube', win(t, K.air1 - 0.12, K.fullL - 0.05, 0.25, 0.1), { bg: BLUE, fg: WHT });
  if (n === 'tank') label(x, off(TW, [0, -0.2, 0], 1), 40, 330, 'the tank filling up', win(t, K.full - 0.15, K.covers - 0.08, 0.25, 0.1));
  if (n === 'neck') label(x, PW, -40, 330, 'gas covers the hole', win(t, K.covers + 0.1, K.noairL - 0.05, 0.2, 0.08), { bg: GOLD, fg: '#1D1D1F' });
  if (n === 'tube') label(x, CW_([0.3, 0.0, 0]), 40, -330, 'no air', win(t, K.air2 - 0.05, K.snapL - 0.05, 0.2, 0.08), { bg: RED, fg: WHT });
  if (n === 'dia') label(x, CHW, -40, 330, 'a diaphragm', win(t, K.diaphragm - 0.12, K.valve - 0.08, 0.2, 0.1));
  if (n === 'valve') label(x, VAW, 40, 330, 'the valve', win(t, K.valve - 0.05, K.justL - 0.05, 0.2, 0.1), { bg: RED, fg: WHT });
  if (n === 'hero') label(x, PW, 40, -330, 'just a hole', win(t, K.hole4 - 0.02, T0.feed, 0.2, 0.1), { bg: GOLD, fg: '#1D1D1F' });
  x.restore();
  nope(x, t, K.sensors, K.hole4 - 0.08, 330, 1330, waveIcon); nope(x, t, K.electronics, K.hole4 - 0.08, 750, 1330, chipIcon);
  flash(x, t, K.hole1, 0.25, 0.14); flash(x, t, K.snaps, 0.35, 0.16); flash(x, t, K.hole4, 0.2, 0.3);
  const FP = [[K.rushL, K.justL, 'Fuel rushing through a venturi in the nozzle pulls air through a small port near the tip. When fuel covers the port, the vacuum pulls a diaphragm that trips the valve shut (Hagerty; ABC News; Motorcyclist).'],
    [K.justL, T0.feed, 'The shut-off is purely mechanical: no sensors, no electronics (Hagerty). Scenes are illustrations.']];
  FP.forEach(([a, b, str]) => smallPrint(x, str, win(t, a + 0.15, b - 0.05, 0.3, 0.15)));
}
S.site = three;

// ---------- the switch: our reel in a phone; then an ad whose spend keeps pumping after it stops working; paused ----------
const PHN = { cy: 610, s: 0.62 };
let FRZ = null;
function frozen() { if (!FRZ) { const [c, x] = mkc(1080, 1920); three(x, T0.feed - 1 / FPS); FRZ = c; } return FRZ; }
function shoe(c, X0, Y0, s, col) {
  c.save(); c.translate(X0, Y0); c.scale(s, s); c.fillStyle = col;
  c.beginPath(); c.moveTo(-170, 40); c.quadraticCurveTo(-175, -30, -120, -45); c.lineTo(-40, -60); c.quadraticCurveTo(0, -120, 60, -100); c.lineTo(80, -40); c.quadraticCurveTo(170, -20, 175, 30); c.quadraticCurveTo(178, 60, 150, 62); c.lineTo(-160, 62); c.quadraticCurveTo(-178, 60, -170, 40); c.fill();
  c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(-172, 48, 350, 16); c.restore();
}
function adPage(c, t) {                              // the ad: fine at first, then it stops working while the spend keeps pumping
  const q = c.createLinearGradient(0, 0, 0, 1280); q.addColorStop(0, '#FFF1E6'); q.addColorStop(1, '#F6D2B8'); c.fillStyle = q; c.fillRect(0, 0, 600, 1280);
  shoe(c, 300, 560, 1.15, '#E2572E');
  c.save(); c.textAlign = 'center'; c.fillStyle = '#2A1408'; setF(c, '800 54px Logo', -1); c.fillText('New season.', 300, 760); c.fillText('New you.', 300, 822); c.restore();
  const stale = ease((t - K.money) / 1.1);           // it stops working: the colour drains out of it
  if (stale > 0) { c.save(); c.globalAlpha = 0.62 * stale; c.fillStyle = '#9C9C9C'; c.globalCompositeOperation = 'saturation'; c.fillRect(0, 0, 600, 1280); c.restore(); c.save(); c.globalAlpha = 0.25 * stale; c.fillStyle = '#000'; c.fillRect(0, 0, 600, 1280); c.restore(); }
  // the meter, like the one on a pump
  const on = t < K.stop2, dollars = 186.4 + 95 * Math.max(0, Math.min(t, K.stop2) - (K.pumping - 0.1)) * (1 + 1.4 * clamp((t - K.money) / 1.4));
  c.save(); rrx(c, 40, 96, 520, 200, 26); c.fillStyle = 'rgba(8,10,12,.92)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 2; c.stroke();
  setF(c, '600 26px Body', 0); c.fillStyle = '#9AA39E'; c.textAlign = 'left'; c.fillText('AD SPEND  $', 70, 146);
  c.fillStyle = on ? '#FFB347' : '#7CFFB0'; c.shadowColor = c.fillStyle; c.shadowBlur = 16; setF(c, '400 92px Mono', 0); c.textAlign = 'right'; c.fillText(dollars.toFixed(2), 530, 252); c.restore();
  // its results: a line that climbs, then goes flat
  c.save(); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 5; c.lineJoin = 'round'; c.beginPath();
  for (let i = 0; i <= 40; i++) { const u = i / 40, ux = 70 + 460 * u, grow = clamp((t - K.needL) / 2.4), hy = u < 0.45 ? 0.9 * u / 0.45 : 0.9 + 0.02 * Math.sin(u * 30); if (u > grow) break; const y = 1010 - 70 * hy; i ? c.lineTo(ux, y) : c.moveTo(ux, y); }
  c.stroke(); setF(c, '600 22px Body', 0); c.fillStyle = 'rgba(255,255,255,.75)'; c.textAlign = 'left'; c.fillText('results', 70, 1040); c.restore();
  // the switch that stops it
  const off = ease((t - K.stop2 + 0.02) / 0.12);
  c.save(); rrx(c, 420, 1080, 120, 64, 32); c.fillStyle = off > 0.5 ? '#8E8E93' : '#34C759'; c.fill(); c.beginPath(); c.arc(lerp(508, 452, off), 1112, 26, 0, TAU); c.fillStyle = WHT; c.fill();
  setF(c, '700 30px Body', 0); c.fillStyle = WHT; c.textAlign = 'right'; c.fillText(off > 0.5 ? 'Paused' : 'Active', 400, 1122); c.restore();
  if (off > 0) pill(c, 'stopped in time', 300, 360, 34, false, (t - K.stop2 - 0.1) / 0.25, { f: 'Body', w: 700, bg: '#22B455', fg: WHT });
}
const swipeAt = (t) => eio((t - (K.orL - 0.22)) / 0.18);
function feedUI(c, t) {
  const f = swipeAt(t), off = f * 1280;
  if (f < 1) { c.save(); c.translate(0, -off); c.drawImage(frozen(), -60, 0, 720, 1280); const q = c.createLinearGradient(0, 760, 0, 1280); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,.72)'); c.fillStyle = q; c.fillRect(0, 860, 600, 420); rail(c, -1); acct(c, 'mezmedia_0', null, 'm.', '#111'); setF(c, '500 26px Body', 0); c.fillStyle = 'rgba(255,255,255,.9)'; c.textAlign = 'left'; c.fillText('Why would anyone drill a tiny hole in a gas…', 30, 1090); c.restore(); }
  if (f > 0) { c.save(); c.translate(0, 1280 - off); adPage(c, t); acct(c, 'yourbrand', 'Sponsored', 'Y', '#2F80FF'); c.restore(); }
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
