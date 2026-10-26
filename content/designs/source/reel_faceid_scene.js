// Browser-side scene for reel_faceid.js. Runs as a module after three.js (imported as X), the 2D kit and the phone
// engine (reel_phone_kit.js), whose globals it uses: W, H, g, IMG, clamp, lerp, kf, ease, expo, eio, back, bump, jolt,
// mkc, rrx, setF, pill, phone, P, stage, rise, zoomAt, INK, WHT, GREY... It fills S (one draw function per shot) and
// replaces the kit's captions with the reference's: at the top, building word by word.
// One world for every 3D shot: the clay head (scan in head units, facing +z, nose tip at z 2.6), the iPhone 30 cm in
// front of it with its screen to the face, the dots the builder traced, a printed photo, eyeballs behind the cut-out
// lids. three() sets it all from the time, renders it and lays the labels over it.

const BLUE = '#2F80FF', RED = '#FF3B30', WARM = '#FF8A3D', CLAY = '#B8B2AB';
const v3 = (a) => new X.Vector3(...a);
const dec = (s, T) => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return new T(u.buffer); };
const win = (t, a, b, fi = 0.25, fo = 0.25) => clamp((t - a) / Math.max(fi, 1e-4)) * (1 - clamp((t - b) / Math.max(fo, 1e-4)));   // on from a, off by b

// ---------- renderer ----------
const glc = document.getElementById('gl');
const R3 = new X.WebGLRenderer({ canvas: glc, antialias: true, alpha: true, preserveDrawingBuffer: true });
R3.setSize(W, H, false); R3.setClearColor(0x000000, 0); R3.localClippingEnabled = true;
R3.toneMapping = X.ACESFilmicToneMapping; R3.toneMappingExposure = 1.05; R3.outputColorSpace = X.SRGBColorSpace;
R3.shadowMap.enabled = true; R3.shadowMap.type = X.PCFSoftShadowMap;
const scene = new X.Scene();
const cam = new X.PerspectiveCamera(30, W / H, 0.05, 200);

// ---------- the head ----------
const HG = new X.BufferGeometry();
HG.setAttribute('position', new X.BufferAttribute(dec(MODEL.pos, Float32Array), 3));
HG.setAttribute('normal', new X.BufferAttribute(dec(MODEL.nrm, Float32Array), 3));
HG.setIndex(new X.BufferAttribute(dec(MODEL.idx, Uint16Array), 1));
// the eyes open by cutting an almond out of the shut lids: the upper lid's edge follows the almond's top, scaled by
// uOpen (0 shut .. 1 open), and a dark margin runs along the cut like a lash line
const EYEU = { uOpen: { value: 1 } };
const clay = new X.MeshStandardMaterial({ color: CLAY, roughness: 0.62, metalness: 0, side: X.DoubleSide, transparent: true });
clay.onBeforeCompile = (sh) => {
  sh.uniforms.uOpen = EYEU.uOpen;
  sh.vertexShader = sh.vertexShader.replace('void main() {', 'varying vec3 vObj;\nvoid main() {\n vObj = position;');
  sh.fragmentShader = sh.fragmentShader.replace('void main() {', `varying vec3 vObj; uniform float uOpen;
    float lidCut(vec3 c) { float u = (vObj.x - c.x) / c.z; if (abs(u) >= 1.0 || vObj.z < 1.3) return 1.0;
      float h = ${WORLD.EAY.toFixed(3)} * pow(1.0 - u * u, 0.7), y = vObj.y - c.y;
      return max(-h - y, y - (-h + 2.0 * h * uOpen)); }
    void main() {
      float cut = min(lidCut(vec3(${WORLD.EYE[0].join(', ')})), lidCut(vec3(${WORLD.EYE[1].join(', ')})));
      if (uOpen > 0.02 && cut < 0.0) discard;`);
  sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n  if (uOpen > 0.02) gl_FragColor.rgb *= mix(0.25, 1.0, smoothstep(0.0, 0.018, cut));');
};
const head = new X.Mesh(HG, clay);
head.castShadow = head.receiveShadow = true;
const HEAD = new X.Group(); HEAD.add(head); scene.add(HEAD);

// the open eyes: the lids' surface a hair further in, carved like a statue's (a cut iris and pupil); the clay lids
// close over them from the top
function irisTex() {
  const [c, x] = mkc(256, 256); x.fillStyle = '#CDC6BE'; x.fillRect(0, 0, 256, 256);
  const q = x.createRadialGradient(128, 128, 18, 128, 128, 54); q.addColorStop(0, '#4F4843'); q.addColorStop(0.8, '#7A706A'); q.addColorStop(1, '#3B3532');
  x.beginPath(); x.arc(128, 128, 54, 0, TAU); x.fillStyle = q; x.fill();
  for (let i = 0; i < 60; i++) { const a = (i / 60) * TAU; x.strokeStyle = `rgba(${R(i) > 0.5 ? '235,229,222' : '70,62,58'},${0.3 * R(i + 9) + 0.15})`; x.lineWidth = 2.5; x.beginPath(); x.moveTo(128 + 20 * Math.cos(a), 128 + 20 * Math.sin(a)); x.lineTo(128 + 49 * Math.cos(a), 128 + 49 * Math.sin(a)); x.stroke(); }
  x.beginPath(); x.arc(128, 128, 21, 0, TAU); x.fillStyle = '#1E1A19'; x.fill();
  x.beginPath(); x.arc(112, 112, 7, 0, TAU); x.fillStyle = 'rgba(255,255,255,.75)'; x.fill();     // a catch-light
  const t = new X.CanvasTexture(c); t.colorSpace = X.SRGBColorSpace; t.anisotropy = 8; return t;
}
const EG = new X.BufferGeometry();
EG.setAttribute('position', new X.BufferAttribute(dec(MODEL.ePos, Float32Array), 3));
EG.setAttribute('normal', new X.BufferAttribute(dec(MODEL.eNrm, Float32Array), 3));
EG.setAttribute('uv', new X.BufferAttribute(dec(MODEL.eUv, Float32Array), 2));
const eyeMat = new X.MeshPhysicalMaterial({ map: irisTex(), roughness: 0.35, clearcoat: 0.7, clearcoatRoughness: 0.1, transparent: true });
const eyes = new X.Mesh(EG, eyeMat); eyes.receiveShadow = true; HEAD.add(eyes);

// ---------- the iPhone: screen to the face, its back to us in the wide shots ----------
const PH = WORLD.PHONE, phoneG = new X.Group(); scene.add(phoneG);
phoneG.position.set(...PH.pos); phoneG.lookAt(v3(PH.look));
function rrShape(w, h, r) { const s = new X.Shape(); s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); return s; }
{
  const body = new X.ExtrudeGeometry(rrShape(PH.w, PH.h, 0.24), { depth: PH.d, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3, curveSegments: 16 });
  body.translate(0, 0, -PH.d / 2);
  const m = new X.Mesh(body, new X.MeshStandardMaterial({ color: '#3A3A3F', metalness: 0.75, roughness: 0.32 })); m.castShadow = true; phoneG.add(m);
  const bump_ = new X.ExtrudeGeometry(rrShape(0.62, 0.62, 0.14), { depth: 0.04, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 });
  const bm = new X.Mesh(bump_, new X.MeshStandardMaterial({ color: '#2E2E33', metalness: 0.6, roughness: 0.3 }));
  bm.position.set(0.38, 1.12, -PH.d / 2 - 0.05); phoneG.add(bm);      // seen from behind it sits top-left
  [[0.24, 1.26], [0.24, 0.98], [0.52, 1.12]].forEach(([x, y]) => {
    const l = new X.Mesh(new X.CylinderGeometry(0.1, 0.11, 0.05, 32), new X.MeshStandardMaterial({ color: '#0B0B0E', metalness: 0.4, roughness: 0.08 }));
    l.rotation.x = Math.PI / 2; l.position.set(x, y, -PH.d / 2 - 0.08); phoneG.add(l);
  });
}
const SCR = (() => { const [c, x] = mkc(512, 1040); const t = new X.CanvasTexture(c); t.colorSpace = X.SRGBColorSpace; t.anisotropy = 8; return { c, x, t, key: '' }; })();
const scrMesh = new X.Mesh(new X.PlaneGeometry(PH.w - 0.1, PH.h - 0.1), new X.MeshBasicMaterial({ map: SCR.t, toneMapped: false }));
scrMesh.position.z = PH.d / 2 + 0.021; phoneG.add(scrMesh);
function padlock(x, cx, cy, s, open, col) {          // a padlock icon, body centred at cx, cy
  x.save(); x.translate(cx, cy); x.scale(s, s); x.strokeStyle = col; x.fillStyle = col; x.lineWidth = 9; x.lineCap = 'round';
  x.beginPath(); x.arc(open ? 22 : 0, -30, 22, Math.PI, open ? Math.PI * 1.85 : 0); x.lineTo(open ? 44 : 22, -30 + (open ? -10 : 0)); x.stroke();
  x.beginPath(); x.moveTo(-22, -30); x.lineTo(-22, -12); x.stroke(); if (!open) { x.beginPath(); x.moveTo(22, -30); x.lineTo(22, -12); x.stroke(); }
  rrx(x, -34, -14, 68, 54, 12); x.fill(); x.restore();
}
function screenDraw(open, glow) {                    // the lock screen, redrawn only when it changes
  const key = open + ':' + glow.toFixed(2); if (SCR.key === key) return; SCR.key = key;
  const x = SCR.x, w = 512, h = 1040;
  const q = x.createLinearGradient(0, 0, w, h); q.addColorStop(0, '#1B2A4A'); q.addColorStop(1, '#3A1F4F'); x.fillStyle = q; x.fillRect(0, 0, w, h);
  x.fillStyle = 'rgba(0,0,0,' + (0.55 - 0.35 * glow) + ')'; x.fillRect(0, 0, w, h);
  rrx(x, w / 2 - 78, 22, 156, 44, 22); x.fillStyle = '#000'; x.fill();      // the TrueDepth housing
  [[-48, 7], [-20, 6], [26, 9], [52, 6]].forEach(([dx, r]) => { x.beginPath(); x.arc(w / 2 + dx, 44, r, 0, TAU); x.fillStyle = '#15151c'; x.fill(); });
  if (glow <= 0) {                                   // screen off: black glass, a soft reflection
    x.fillStyle = '#050608'; x.fillRect(0, 0, w, h); const r = x.createLinearGradient(0, 0, w, h * 0.6); r.addColorStop(0, 'rgba(255,255,255,.10)'); r.addColorStop(0.5, 'rgba(255,255,255,0)'); x.fillStyle = r; x.fillRect(0, 0, w, h);
    rrx(x, w / 2 - 78, 22, 156, 44, 22); x.fillStyle = '#000'; x.fill(); x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 2; x.stroke();
    [[-48, 7], [-20, 6], [26, 9], [52, 6]].forEach(([dx, r0]) => { x.beginPath(); x.arc(w / 2 + dx, 44, r0, 0, TAU); x.fillStyle = '#1d1d26'; x.fill(); x.strokeStyle = 'rgba(120,130,170,.5)'; x.lineWidth = 1.5; x.stroke(); });
  } else {
    padlock(x, w / 2, 168, 0.9, open, '#fff');
    setF(x, '600 150px Logo', -4); x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText('9:41', w / 2, 400);
    setF(x, '500 34px Body', 0); x.fillStyle = 'rgba(255,255,255,.8)'; x.fillText('Monday 26 October', w / 2, 452);
  }
  SCR.t.needsUpdate = true;
}

// ---------- the dots ----------
const DOTV = dec(MODEL.dots, Float32Array), ND = DOTV.length / 5;
function dotCloud(n, fill) {
  const pos = new Float32Array(3 * n), dep = new Float32Array(n), swp = new Float32Array(n), rnd_ = new Float32Array(n);
  for (let i = 0; i < n; i++) fill(i, pos, dep, swp), rnd_[i] = R(i + 3);
  const geo = new X.BufferGeometry();
  geo.setAttribute('position', new X.BufferAttribute(pos, 3)); geo.setAttribute('aDepth', new X.BufferAttribute(dep, 1));
  geo.setAttribute('aSweep', new X.BufferAttribute(swp, 1)); geo.setAttribute('aRand', new X.BufferAttribute(rnd_, 1));
  const mat = new X.ShaderMaterial({
    transparent: true, depthWrite: false, blending: X.AdditiveBlending,
    uniforms: {
      uSize: { value: 0.016 }, uScale: { value: 1 }, uOp: { value: 1 }, uRev: { value: 2 }, uMode: { value: 0 }, uFlat: { value: 0 },
      uD: { value: new X.Vector2(7.1, 8.4) }, uNeck: { value: 0 }, uHi: { value: new X.Vector4(0, 0, 0, 0) }, uHi2: { value: new X.Vector4(0, 0, 0, 0) }, uHiK: { value: new X.Vector2(0, 0) },
    },
    vertexShader: `attribute float aDepth, aSweep, aRand; uniform float uSize, uScale, uRev, uFlat; uniform vec2 uD; uniform vec4 uHi, uHi2; uniform vec2 uHiK; uniform float uNeck;
      varying float vA, vD, vH, vH2;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); mv.xyz += normalize(-mv.xyz) * 0.035; gl_Position = projectionMatrix * mv;
        float r = uRev - (aSweep * 0.85 + aRand * 0.15); vA = clamp(r * 12.0, 0.0, 1.0) * mix(1.0, smoothstep(-1.5, -0.7, position.y), uNeck);
        vD = mix(clamp((aDepth - uD.x) / (uD.y - uD.x), 0.0, 1.0), 0.5, uFlat);
        vH = uHiK.x * (1.0 - smoothstep(uHi.w * 0.6, uHi.w, distance(position, uHi.xyz)));
        vH2 = uHiK.y * (1.0 - smoothstep(uHi2.w * 0.6, uHi2.w, distance(position, uHi2.xyz)));
        float flash = 1.0 + 1.5 * clamp(1.0 - r * 6.0, 0.0, 1.0) * vA;
        gl_PointSize = uSize * uScale / -mv.z * flash * (1.0 + 0.8 * max(vH, vH2)); }`,
    fragmentShader: `uniform float uOp, uMode; varying float vA, vD, vH, vH2;
      void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.18, d) * vA * uOp; if (a < 0.01) discard;
        vec3 ir = vec3(1.0, 0.16, 0.12), wb = vec3(0.75, 0.88, 1.0);
        vec3 near = vec3(1.0, 0.55, 0.16), mid = vec3(0.95, 0.25, 0.55), far = vec3(0.2, 0.45, 1.0);
        vec3 dc = vD < 0.5 ? mix(near, mid, vD * 2.0) : mix(mid, far, vD * 2.0 - 1.0);
        vec3 c = uMode < 1.0 ? mix(ir, wb, uMode) : mix(wb, dc, uMode - 1.0);
        c = mix(c, near, vH); c = mix(c, far, vH2);
        gl_FragColor = vec4(c * a, a); }`,
  });
  const pts = new X.Points(geo, mat); pts.frustumCulled = false; return pts;
}
const faceDots = dotCloud(ND, (i, pos, dep, swp) => { pos.set(DOTV.subarray(5 * i, 5 * i + 3), 3 * i); dep[i] = DOTV[5 * i + 3]; swp[i] = DOTV[5 * i + 4]; });
faceDots.renderOrder = 10; scene.add(faceDots);   // after the (fadable, so transparent) head
{ let a = 1e9, b = 0; for (let i = 0; i < ND; i++) { const z = DOTV[5 * i + 2]; if (DOTV[5 * i + 1] > 0 && DOTV[5 * i + 1] < 2.6) { a = Math.min(a, DOTV[5 * i + 3]); b = Math.max(b, DOTV[5 * i + 3]); } } faceDots.material.uniforms.uD.value.set(a, a + (b - a) * 0.55); }
// beams: a few hundred rays from the projector to their dots
const BEAMN = 420, beamPos = new Float32Array(BEAMN * 6);
for (let i = 0; i < BEAMN; i++) { const j = Math.floor(R(i + 900) * ND); beamPos.set(WORLD.PROJ, 6 * i); beamPos.set(DOTV.subarray(5 * j, 5 * j + 3), 6 * i + 3); }
const beamGeo = new X.BufferGeometry(); beamGeo.setAttribute('position', new X.BufferAttribute(beamPos, 3));
const beams = new X.LineSegments(beamGeo, new X.LineBasicMaterial({ color: '#FF4433', transparent: true, opacity: 0, blending: X.AdditiveBlending, depthWrite: false }));
beams.frustumCulled = false; beams.renderOrder = 11; scene.add(beams);

// ---------- the printed photo of the face ----------
const CD = WORLD.CARD, cardTex = (() => { const [c, x] = mkc(740, 940); const t = new X.CanvasTexture(c); t.colorSpace = X.SRGBColorSpace; return { c, x, t }; })();
const card = new X.Group(); scene.add(card);
const cardMesh = new X.Mesh(new X.PlaneGeometry(CD.w, CD.h), new X.MeshStandardMaterial({ map: cardTex.t, roughness: 0.35, side: X.DoubleSide }));
cardMesh.castShadow = true; card.add(cardMesh);
const cardDots = dotCloud(130 * 165, (i, pos, dep, swp) => {
  const a = i % 130, b = Math.floor(i / 130), x = ((a + 0.5 + (R(i + 50) - 0.5) * 0.7) / 130 - 0.5) * (CD.w - 0.3), y = (0.5 - (b + 0.5 + (R(i + 70) - 0.5) * 0.7) / 165) * (CD.h - 0.3);
  pos.set([x, y, 0.012], 3 * i); dep[i] = 7.5; swp[i] = b / 165;
});
cardDots.material.uniforms.uFlat.value = 1; cardDots.renderOrder = 10; card.add(cardDots);

// ---------- lights ----------
const hemi = new X.HemisphereLight('#DCE4FF', '#1A1A1F', 0.5); scene.add(hemi);
const key = new X.DirectionalLight('#FFF4EA', 2.4); key.position.set(6, 7, 9); key.castShadow = true;
key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 40 }); key.shadow.bias = -0.0008; scene.add(key);
const rim = new X.DirectionalLight('#9EC1FF', 2.6); rim.position.set(-7, 4, -6); scene.add(rim);
const fill = new X.DirectionalLight('#FFFFFF', 0.5); fill.position.set(-5, -1, 8); scene.add(fill);
const flood = new X.PointLight('#FFFFFF', 0, 30, 1.2); flood.position.set(...WORLD.NOTCH.flood); scene.add(flood);
const LV = { hemi: 0.5, key: 2.4, rim: 2.6, fill: 0.5 };
function lights(k, moon = 0, irk = 0) {               // k: 1 studio .. 0 dark; moon: blue night; irk: only the flood illuminator
  hemi.intensity = LV.hemi * k * (1 - irk); key.intensity = LV.key * k * (1 - 0.55 * moon) * (1 - irk); rim.intensity = LV.rim * k * (1 - irk); fill.intensity = LV.fill * k * (1 - irk);
  key.color.set(mixc('#FFF4EA', '#7D97FF', moon)); hemi.color.set(mixc('#DCE4FF', '#5A6CFF', moon));
  flood.intensity = 24 * irk;
}

// ---------- camera ----------
const NC = WORLD.NOTCH, NOTCHC = [0, 1, 2].map((i) => (NC.ir[i] + NC.proj[i]) / 2);
const pz = WORLD.PZ, py = WORLD.PY;
const at3 = (b, d, k) => b.map((v, i) => v + d[i] * k);
const VIEW = {
  hero0: [[1.7, 1.2, 17.2], [0.42, 0.9, 4.0], 26],
  hero: [[1.8, 1.0, 19.5], [0.45, 0.5, 4.5], 27],
  heroP: [[1.8, 1.0, 21.5], [0.35, 0.8, 4.8], 27],
  heroS: [[1.5, 1.3, 16.8], [0.35, 1.05, 3.4], 26],
  notch: [at3(at3(at3(NOTCHC, pz, 2.3), py, 0.75), WORLD.PX, -0.9), at3(NOTCHC, py, -0.1), 30],
  notch2: [at3(at3(at3(NOTCHC, pz, 1.85), py, 0.6), WORLD.PX, -0.7), at3(NOTCHC, py, -0.1), 30],
  beam: [[5.5, 6.5, 16.5], [1.1, 0.3, 5.2], 38],
  face34: [[5.9, 2.5, 10.6], [0.05, 1.2, 1.7], 29],
  profile: [[12.8, 1.5, 2.5], [0.0, 1.3, 2.0], 24],
  profile2: [[18.0, 1.8, 6.3], [0.0, 1.1, 2.8], 30],
  map: [[7.6, 2.6, 10.2], [0.0, 1.2, 1.6], 30],
  hero3: [[1.8, 1.0, 19.0], [0.45, 0.6, 4.5], 27],
  eye: [[-0.42, 1.78, 5.0], [-0.73, 1.63, 1.7], 36],
  mapfront: [[0.0, 1.3, 13.5], [0.0, 1.2, 1.6], 26],
};
const v = (name, t) => [t, ...VIEW[name][0], ...VIEW[name][1], VIEW[name][2]];
const CAMK = [
  v('hero0', 0), v('hero', K.dark), v('hero', LN.photo.s), v('heroP', K.nothing), v('heroP', LN.asleep.s), v('heroS', K.still), v('heroS', K.whip - 0.05), v('notch', K.whip + 0.75), v('notch2', K.fires),
  v('beam', K.n30 + 0.2), v('face34', K.dots + 0.4), v('face34', T0.cam + 0.05), v('profile', T0.cam + 0.85), v('profile', T0.map + 0.1),
  v('map', K.map + 0.9), v('map', T0.flat), v('profile2', T0.flat + 0.6), v('profile2', T0.darkx - 0.001),
  v('hero3', T0.darkx), v('hero3', T0.chip), v('mapfront', T0.chip + 0.001), v('mapfront', T0.eyes - 0.001),
  v('eye', T0.eyes), [K.shutLocked + 1.2, ...VIEW.eye[0].map((q, i) => q + [0.03, 0.01, -0.25][i]), ...VIEW.eye[1], 36],
];
const tmpV = new X.Vector3();
function project(p) { tmpV.set(...p).project(cam); return [(tmpV.x + 1) / 2 * W, (1 - tmpV.y) / 2 * H, tmpV.z < 1]; }

// ---------- the state of the world at time t ----------
function setWorld(t) {
  const c = DEBUGCAM ? [...DEBUGCAM[0], ...DEBUGCAM[1], DEBUGCAM[2]] : kf(t, CAMK); cam.position.set(c[0], c[1], c[2]); cam.fov = c[6]; cam.updateProjectionMatrix(); cam.lookAt(c[3], c[4], c[5]);
  const U = faceDots.material.uniforms, CU = cardDots.material.uniforms;
  U.uScale.value = CU.uScale.value = H / (2 * Math.tan((cam.fov * Math.PI) / 360));
  // lighting: dark on "total", the photo half-lit, moonlight while asleep, studio from the whip; the dark again later
  const dark = ease((t - K.dark) / 0.12) * (1 - ease((t - LN.photo.s + 0.15) / 0.4));
  const moon = ease((t - LN.asleep.s) / 0.5) * (1 - ease((t - K.whip) / 0.5));
  const dark2 = ease((t - K.darkx + 0.05) / 0.12) * (1 - ease((t - T0.chip) / 0.3)), ir = ease((t - K.lights) / 0.35) * (1 - ease((t - T0.chip) / 0.3));
  lights(Math.max(0.03, 1 - dark - 0.97 * dark2 - 0.25 * win(t, LN.photo.s, LN.asleep.s, 0.3, 0.3)), moon, ir);
  // the head: gone for the map, the chip and the odds
  const hide = Math.max(ease((t - K.map + 0.3) / 0.6) * (1 - ease((t - T0.darkx) / 0.01)), win(t, T0.chip, T0.eyes, 0.01, 0.01));
  clay.opacity = eyeMat.opacity = 1 - hide; HEAD.visible = hide < 0.999; clay.depthWrite = eyeMat.depthWrite = hide < 0.5;
  // the lids: shut while asleep, open again from the whip, shut on "Eyes closed"
  const shut = Math.max(ease((t - K.close) / 0.5) * (1 - ease((t - K.whip - 0.4) / 0.4)), ease((t - K.shut + 0.05) / 0.35));
  EYEU.uOpen.value = 1 - shut; eyes.visible = shut < 0.98;
  // the photo: rises in front of the face, drops away for "asleep"; turned towards us for "flat"
  const up = ease((t - LN.photo.s + 0.1) / 0.55) * (1 - ein((t - LN.asleep.s + 0.05) / 0.45));
  const flatK = ease((t - T0.flat) / 0.6) * (1 - ease((t - T0.darkx) / 0.01));
  card.visible = up > 0.001 || flatK > 0.001;
  if (flatK > 0) { card.position.set(0.2, lerp(-2.5, 1.0, flatK), 4.75); card.rotation.set(0, lerp(1.45, 1.1, flatK), 0); card.scale.setScalar(0.6); }
  else { card.position.set(CD.cx, lerp(-7, CD.cy, up), CD.z); card.rotation.set(lerp(0.5, 0, up), 0, 0); card.scale.setScalar(1); }
  // the dots on the face: a sweep on "see", infrared in the dark, again on "asleep" and from "fires"
  const sweeps = [[0, K.see + 0.1, 0], [K.dark, K.dark + 0.5, 0], [K.asleep - 0.2, K.asleep + 0.35, 0.6], [K.fires + 0.2, K.dots + 0.1, 0], [K.lights, K.lights + 0.6, 0]];
  let rev = 0, mode = 0.6;
  sweeps.forEach(([a, b, m]) => { if (t >= a) { rev = lerp(-0.1, 1.2, clamp((t - a) / (b - a))); mode = m; } });
  if (t < K.see + 0.1) rev = lerp(0.35, 1.2, clamp(t / (K.see + 0.1)));   // already sweeping on the first frame
  const onFace = up < 0.5;
  let op = (onFace ? 1 : 0) * (1 - win(t, LN.photo.s - 0.1, LN.asleep.s, 0.15, 0.3)) * (1 - win(t, K.whip - 0.1, K.fires + 0.15, 0.15, 0.01));
  op *= 1 - 0.55 * ease((t - K.see - 0.6) / 0.4) * (1 - ease((t - K.dark) / 0.1));   // settle after the unlock
  op *= 1 - ease((t - LN.asleep.e) / 0.4) * (1 - ease((t - K.fires - 0.15) / 0.05));
  if (t >= K.closer - 0.3) mode = 1 + ease((t - K.closer + 0.2) / 0.5);           // colour by depth
  if (t >= T0.darkx) { mode = 0; op = ease((t - K.lights) / 0.3) * 0.7; }
  if (t >= T0.chip) { mode = 2; op = 1; rev = 2; }
  if (t >= T0.odds) op = 0;
  U.uRev.value = rev; U.uMode.value = mode; U.uOp.value = op; U.uNeck.value = ease((t - K.map + 0.3) / 0.6);
  U.uSize.value = (t < T0.proj ? 0.015 : 0.019) * (1 + 0.6 * win(t, K.dark, LN.photo.s, 0.1, 0.3));
  // the nose and the cheeks
  U.uHi.value.set(-0.09, 1.0, 2.6, 0.55); U.uHi2.value.set(1.15, 0.9, 1.6, 0.6);
  U.uHiK.value.set(win(t, K.nose, T0.map + 0.2, 0.3, 0.4), win(t, K.cheeks - 0.1, T0.map + 0.2, 0.3, 0.4));
  // dots on the photo
  CU.uRev.value = t >= T0.flat ? lerp(-0.1, 1.2, clamp((t - T0.flat - 0.2) / 0.5)) : lerp(-0.1, 1.2, clamp((t - K.photo + 0.15) / 0.45));
  CU.uMode.value = t >= T0.flat ? 2 : 0.6; CU.uOp.value = t >= T0.flat ? 1 : 1 - win(t, K.nothing + 0.25, 99, 0.3, 0);
  // beams from the projector while it fires
  beams.material.opacity = 0.5 * win(t, K.fires, K.dots + 0.2, 0.08, 0.4) + 0.35 * win(t, K.asleep - 0.15, K.asleep + 0.35, 0.05, 0.2) + 0.45 * win(t, -1, K.see + 0.15, 0, 0.2);
  beams.material.color.set(t > LN.asleep.s && t < K.whip ? '#9FC4FF' : '#FF4433');
  // the screen: unlocked after the first sweep, locked again for the photo
  const open = (t > K.see + 0.35 && t < LN.photo.s - 0.1) || (t > K.match && t < T0.odds);
  screenDraw(open, open ? 1 : t > K.whip && t < T0.cam ? 0 : 0.4);
  phoneG.visible = t < T0.chip;
}

function render3(x) {
  R3.render(scene, cam);
  x.drawImage(glc, 0, 0);
}
function backdrop(x, t, k = 1) {                     // a dark studio sweep behind the head
  x.fillStyle = '#050507'; x.fillRect(0, 0, W, H);
  const q = x.createRadialGradient(540, 760, 60, 540, 860, 1250); q.addColorStop(0, 'rgba(70,78,98,' + 0.55 * k + ')'); q.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = q; x.fillRect(0, 0, W, H);
}

// ---------- labels: a dot on the thing, a thin line, a label (the reference's leader lines) ----------
function label(x, p3, dx, dy, str, k, o = {}) {
  if (k <= 0) return; const [ax, ay, vis] = project(p3); if (!vis) return;
  const hw = pillHalf(str, o.size || 40), ex = clamp(ax + dx, 30 + (dx < 0 ? 2 * hw : dx ? 0 : hw), W - 30 - (dx > 0 ? 2 * hw : dx ? 0 : hw)), ey = ay + dy, kk = clamp(k);
  x.save(); x.globalAlpha *= o.alpha ?? 1; x.strokeStyle = o.col || WHT; x.fillStyle = o.col || WHT; x.lineWidth = 3; x.lineCap = 'round';
  x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 10;
  x.beginPath(); x.arc(ax, ay, 9 * back(kk / 0.4), 0, TAU); x.lineWidth = 3.5; x.stroke();
  const lk = ease((kk - 0.15) / 0.45); x.beginPath(); x.moveTo(ax + Math.sign(dx) * 9 * (dx ? 1 : 0), ay + (dx ? 0 : Math.sign(dy) * 9)); x.lineTo(lerp(ax, ex, lk), lerp(ay, ey, lk)); x.stroke();
  x.shadowBlur = 0; x.restore();
  pill(x, str, ex + (dx > 0 ? 1 : dx < 0 ? -1 : 0) * hw, ey + (dx === 0 ? Math.sign(dy) * 36 : 0), o.size || 40, !!o.dark, (kk - 0.35) / 0.4, { f: 'Body', w: 600, ...(o.bg ? { bg: o.bg, fg: o.fg } : {}) });
}
const pillHalf = (str, size) => { setF(g, '600 ' + size + 'px Body', -size * 0.02); return (g.measureText(str).width + size * 1.05) / 2; };
// the lock state as a badge: white "Unlocked" with a tick; red "Locked" that shakes
function badge(x, X, Y, state, k, shakeT, o = {}) {
  if (k <= 0) return; const sh = shakeT ? jolt(o.t, shakeT, 16, 0.45) : 0, open = state === 'open', red = state === 'red';
  x.save(); x.translate(X + sh, Y); const s = back(k) * (o.sc || 1); x.scale(s, s);
  const str = open ? 'Unlocked' : 'Locked'; setF(x, '600 40px Body', -0.8); const tw = x.measureText(str).width, w = tw + 128, h = 84;
  x.shadowColor = red ? 'rgba(255,59,48,.55)' : 'rgba(0,0,0,.35)'; x.shadowBlur = red ? 40 : 24;
  rrx(x, -w / 2, -h / 2, w, h, h / 2); x.fillStyle = red ? RED : open ? WHT : 'rgba(28,28,32,.88)'; x.fill(); x.shadowBlur = 0;
  padlock(x, -w / 2 + 50, 8, 0.48, open, red ? WHT : open ? INK : WHT);
  x.fillStyle = red ? WHT : open ? INK : WHT; x.textAlign = 'left'; x.fillText(str, -w / 2 + 88, 14); x.restore();
}
function lockState(t) {                              // what the badge says, and when it last shook
  if (t < K.see + 0.35) return ['shut', 0];
  if (t < LN.photo.s - 0.1) return ['open', 0];
  if (t < K.nothing) return ['shut', 0];
  if (t < LN.asleep.s + 0.4) return ['red', K.nothing];
  if (t < K.still) return ['shut', 0];
  return ['red', K.still];
}
function zzz(x, t, X, Y) {                           // asleep
  const k = win(t, K.close + 0.3, K.whip, 0.3, 0.2); if (k <= 0) return;
  x.save(); x.textAlign = 'center';
  for (let i = 0; i < 3; i++) { const u = ((t - K.close) * 0.6 + i / 3) % 1; x.globalAlpha = k * Math.sin(u * Math.PI); setF(x, '800 ' + (40 + 26 * i) + 'px Logo', 0); x.fillStyle = '#BFD0FF'; x.fillText('z', X + 40 * i + 30 * u, Y - 60 * i - 120 * u); }
  x.restore();
}
function smallPrint(x, str, a) {
  if (a <= 0) return; x.save(); x.globalAlpha = a * 0.75; setF(x, '500 26px Body', 0); x.fillStyle = '#A1A1A6'; x.textAlign = 'center'; x.fillText(str, 540, 1832); x.restore();
}
function counter(x, t) {                             // 0 -> 30,000+ as the projector fires
  const k = win(t, K.n30 - 0.35, K.invisible + 0.25, 0.15, 0.3); if (k <= 0) return;
  const n = Math.round(30000 * ease((t - K.n30 + 0.35) / 0.5)), str = n.toLocaleString('en-US') + (n >= 30000 ? '+' : '');
  x.save(); x.globalAlpha = k; x.textAlign = 'right'; setF(x, '800 128px Logo', -5); x.shadowColor = 'rgba(0,0,0,.7)'; x.shadowBlur = 30; x.fillStyle = WHT; x.fillText(str, 1030, 1420);
  setF(x, '600 40px Body', 0); x.shadowBlur = 12; x.fillStyle = 'rgba(255,255,255,.85)'; x.fillText('dots, every time you look', 1030, 1480); x.restore();
}
function depthLegend(x, t) {
  const k = win(t, K.closer, T0.darkx, 0.3, 0.2); if (k <= 0) return;
  x.save(); x.globalAlpha = k; const X0 = 290, X1 = 790, Y = 1700;
  const q = x.createLinearGradient(X0, 0, X1, 0); q.addColorStop(0, 'rgb(255,140,41)'); q.addColorStop(0.5, 'rgb(242,64,140)'); q.addColorStop(1, 'rgb(51,115,255)');
  rrx(x, X0, Y, X1 - X0, 16, 8); x.fillStyle = q; x.fill();
  setF(x, '600 34px Body', 0); x.fillStyle = WHT; x.textAlign = 'left'; x.fillText('closer', X0, Y + 62); x.textAlign = 'right'; x.fillText('farther', X1, Y + 62); x.restore();
}
function viewfinder(x, k, str) {                  // corner brackets round the frame: what a camera sees
  if (k <= 0) return; x.save(); x.globalAlpha = k; x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 5; const m = 40 * (1 - ease(k));
  [[150, 470, 1, 1], [930, 470, -1, 1], [150, 1450, 1, -1], [930, 1450, -1, -1]].forEach(([X0, Y0, sx, sy]) => { const a = X0 - sx * m, b = Y0 - sy * m; x.beginPath(); x.moveTo(a, b + 70 * sy); x.lineTo(a, b); x.lineTo(a + 70 * sx, b); x.stroke(); });
  x.restore(); if (str) pill(x, str, 540, 1450, 38, true, k, { f: 'Body', w: 600, bg: 'rgba(28,28,32,.9)', fg: WHT });
}
function irLook(x, t, k) {                           // what the infrared camera sees: grey, grainy, a viewfinder
  if (k <= 0) return;
  x.save(); x.globalAlpha = k; x.filter = 'grayscale(1) contrast(1.35) brightness(1.15)'; x.drawImage(x.canvas, 0, 0); x.filter = 'none';
  x.globalAlpha = 0.18 * k; x.globalCompositeOperation = 'overlay'; x.drawImage(NOISE[Math.floor(t * 30) % 6], 0, 0, W, H); x.globalCompositeOperation = 'source-over';
  x.globalAlpha = k; x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 5;
  [[150, 470, 1, 1], [930, 470, -1, 1], [150, 1450, 1, -1], [930, 1450, -1, -1]].forEach(([X0, Y0, sx, sy]) => { x.beginPath(); x.moveTo(X0, Y0 + 70 * sy); x.lineTo(X0, Y0); x.lineTo(X0 + 70 * sx, Y0); x.stroke(); });
  x.fillStyle = RED; x.beginPath(); x.arc(196, 540, 12, 0, TAU); x.fill(); setF(x, '600 34px Body', 2); x.fillStyle = WHT; x.textAlign = 'left'; x.fillText('IR', 222, 552);
  x.restore();
}

// ---------- the 3D shots ----------
function three(x, t) {
  setWorld(t);
  backdrop(x, t, 1 - 0.9 * Math.max(ease((t - K.dark) / 0.12) * (1 - ease((t - LN.photo.s) / 0.4)), ease((t - K.darkx) / 0.12) * (1 - ease((t - T0.chip) / 0.2))));
  x.save();
  x.translate(jolt(t, K.nothing, 9) + jolt(t, K.still, 9) + jolt(t, K.nounlock, 8) + jolt(t, K.shutLocked, 9), 0);
  render3(x);
  if (t >= T0.darkx && t < T0.chip) irLook(x, t, ease((t - K.lights) / 0.3));
  // the hook: the lock over the phone; the dark; asleep
  if (t < T0.proj) {
    const [st, sh] = lockState(t), [bx, by] = project(at3(at3(PH.pos, py, 2.1), WORLD.PX, 0.55)), out_ = 1 - ease((t - K.whip) / 0.25);
    badge(x, Math.min(bx, W - 200), clamp(by, 560, 1500), st, clamp(t / 0.2) * out_, sh, { t, sc: 0.95 });
    const [hx, hy] = project([0.6, 2.9, 1.2]); zzz(x, t, hx, hy);
    label(x, [CD.cx + 0.9, CD.cy - 1.2, CD.z + 0.02], 0, 300, 'a perfect photo', win(t, K.photo - 0.1, K.nothing, 0.4, 0.2));
  }
  // the TrueDepth parts
  if (t >= T0.proj && t < T0.cam) {
    label(x, NC.proj, 0, 330, 'Dot projector', win(t, K.projector - 0.1, K.fires + 0.35, 0.5, 0.2));
    label(x, [-0.55, 0.3, 2.3], 0, 330, 'invisible infrared', win(t, K.invisible, T0.cam, 0.4, 0.3), { bg: RED, fg: WHT });
    counter(x, t);
  }
  if (t >= T0.cam && t < T0.flat) {
    viewfinder(x, win(t, K.camera - 0.05, K.nose - 0.1, 0.25, 0.3), 'Infrared camera');
    label(x, [-0.09, 1.05, 2.62], 0, -330, 'closer', win(t, K.nose, T0.map + 0.3, 0.45, 0.3), { bg: WARM, fg: WHT });
    label(x, [1.25, 0.8, 1.5], 0, 360, 'farther', win(t, K.cheeks - 0.1, T0.map + 0.3, 0.45, 0.3), { bg: BLUE, fg: WHT });
    label(x, [0.15, 2.3, 2.15], -260, 0, '3D map of your face', win(t, K.map + 0.1, T0.flat, 0.45, 0.25));
    depthLegend(x, t);
  }
  if (t >= T0.flat && t < T0.darkx) {
    label(x, [0.2, -0.85, 1.9], 0, 140, 'your face: depth', win(t, T0.flat + 0.5, T0.darkx, 0.45, 0.2), { bg: BLUE, fg: WHT });
    label(x, [0.2, -0.2, 4.75], 0, 240, 'photo: flat', win(t, K.flat, T0.darkx, 0.45, 0.2), { bg: '#5A5A60', fg: WHT });
    depthLegend(x, t);
    badge(x, 540, 1480, 'red', clamp((t - K.nounlock + 0.05) / 0.2), K.nounlock, { t });
  }
  if (t >= T0.darkx && t < T0.chip) {
    label(x, NC.flood, -60, -330, 'Flood illuminator', win(t, K.lights, T0.chip, 0.45, 0.2));
    eyeIcon(x, 540, 1560, win(t, K.cantsee - 0.15, T0.chip, 0.3, 0.2));
  }
  x.restore();
  const fineprint = t >= T0.proj && t < T0.chip ? 'Illustration. Dots and light are infrared, invisible to the eye.' : '';
  smallPrint(x, fineprint, win(t, T0.proj + 0.5, T0.chip, 0.4, 0.2));
}
function eyeIcon(x, X, Y, k) {                       // "you can't see": an eye, struck through
  if (k <= 0) return; x.save(); x.translate(X, Y); x.scale(back(k), back(k)); x.strokeStyle = WHT; x.lineWidth = 8; x.lineCap = 'round';
  x.beginPath(); x.arc(0, 0, 105, 0, TAU); x.fillStyle = 'rgba(20,20,24,.9)'; x.fill();
  x.beginPath(); x.moveTo(-70, 0); x.quadraticCurveTo(0, -62, 70, 0); x.quadraticCurveTo(0, 62, -70, 0); x.stroke();
  x.beginPath(); x.arc(0, 0, 20, 0, TAU); x.fillStyle = WHT; x.fill();
  x.strokeStyle = RED; x.lineWidth = 10; x.beginPath(); x.moveTo(-62, -52); x.lineTo(62, 52); x.stroke(); x.restore();
}
S.hook = three; S.how = three; S.proj = three; S.cam = three; S.map = three; S.flat = three; S.darkx = three;

// ---------- the chip: the map into the Secure Enclave, numbers, compared with the saved face ----------
const NUMS = Array.from({ length: 7 }, (_, r) => Array.from({ length: 4 }, (_, c) => (R(r * 4 + c + 300) * 2 - 1).toFixed(2)));
const SAVED = NUMS.map((row, r) => row.map((q, c) => (+q + (R(r * 4 + c + 700) - 0.5) * 0.04).toFixed(2)));
function chipIcon(x, X, Y, s, k, lockK) {
  if (k <= 0) return; x.save(); x.translate(X, Y); x.scale(s * back(k), s * back(k));
  x.fillStyle = '#C9A55C'; for (let i = 0; i < 6; i++) for (const sd of [-1, 1]) { x.fillRect(-105 + i * 42 - 7, sd * 150 - (sd > 0 ? 0 : 30), 14, 30); x.fillRect(sd * 150 - (sd > 0 ? 0 : 30), -105 + i * 42 - 7, 30, 14); }
  rrx(x, -150, -150, 300, 300, 30); x.fillStyle = '#1C1C21'; x.fill(); x.strokeStyle = '#3A3A42'; x.lineWidth = 4; x.stroke();
  rrx(x, -84, -84, 168, 168, 20); x.fillStyle = '#26262D'; x.fill(); x.strokeStyle = 'rgba(47,128,255,' + (0.4 + 0.6 * lockK) + ')'; x.lineWidth = 5; x.stroke();
  padlock(x, 0, 18, 1.1, false, mixc('#8A8A92', '#FFFFFF', lockK));
  x.restore();
}
S.chip = (x, t) => {
  setWorld(t); backdrop(x, t, 0.7);
  const fly = ease((t - K.chip + 0.25) / 0.55), CY = 1180;
  // the dot map, turning, then pulled into the chip
  faceDots.rotation.y = 0.5 * Math.sin((t - T0.chip) * 0.9);
  R3.render(scene, cam);
  x.save(); x.globalAlpha = 1 - ease((t - K.chip) / 0.3); const sc = lerp(1, 0.1, fly);
  x.translate(540, lerp(860, CY, fly)); x.scale(sc, sc); x.translate(-540, -860); x.drawImage(glc, 0, 0); x.restore();
  faceDots.rotation.y = 0;
  const ck = (t - K.chip + 0.35) / 0.35, lk = ease((t - K.chip) / 0.3);
  chipIcon(x, 540, CY, 1.25, ck, lk);
  label2(x, 540, CY + 270, 'Secure Enclave', win(t, LN.chip.s + 0.3, T0.odds, 0.4, 0.2));
  // numbers come out; the saved face's numbers wait on the left; rows tick off as they match
  const nk = (t - K.numbers) / 0.45, sk = (t - K.saved + 0.45) / 0.4, mk = (t - K.compares) / 1.4;
  numCol(x, 780, 500, NUMS, nk, 'your face now', WHT, mk);
  numCol(x, 300, 500, SAVED, sk, 'your saved face', '#9FC4FF', mk);
  if (t >= K.match) {
    badge(x, 540, 1600, 'open', (t - K.match) / 0.25, 0, { t });
    pill(x, 'Match', 540, 1715, 44, false, (t - K.match - 0.12) / 0.3, { f: 'Body', w: 700, bg: BLUE, fg: WHT });
  }
  smallPrint(x, 'Illustration. Apple doesn’t publish the numbers.', win(t, K.numbers, T0.odds, 0.4, 0.2));
};
function label2(x, X, Y, str, k) { if (k <= 0) return; pill(x, str, X, Y, 38, true, k, { f: 'Body', w: 600, bg: 'rgba(40,40,46,.92)', fg: WHT }); }
function numCol(x, X, Y, rows, k, title, col, mk) {
  if (k <= 0) return; x.save(); x.textAlign = 'center';
  setF(x, '600 34px Body', 0); x.fillStyle = 'rgba(255,255,255,' + 0.75 * clamp(k * 2) + ')'; x.fillText(title, X, Y - 40);
  setF(x, '28px Mono', 0);
  rows.forEach((row, r) => {
    const kr = clamp(k * 2 - r * 0.2); if (kr <= 0) return; const y = Y + r * 54;
    x.globalAlpha = kr; x.fillStyle = col; x.fillText(row.map((q) => (+q >= 0 ? ' ' : '') + q).join(' '), X, y + 24 * (1 - ease(kr)));
    if (mk * rows.length > r + 0.5 && X > 540) { x.fillStyle = '#34C759'; setF(x, '700 34px Body', 0); x.fillText('=', 540, y); setF(x, '28px Mono', 0); }
  });
  x.restore();
}

// ---------- the odds: you among strangers, then a million faces ----------
let FACES = null, CROWD = null;
function faceThumbs() {                              // the head, front on, as nine slightly different people
  const out = [], keep = { pos: cam.position.clone(), fov: cam.fov }, bgs = ['#2A2D35'];
  cam.position.set(0, 1.3, 13); cam.fov = 24; cam.updateProjectionMatrix(); cam.lookAt(0, 1.2, 0); lights(1);
  phoneG.visible = false; card.visible = false; faceDots.visible = false; beams.visible = false; clay.opacity = eyeMat.opacity = 1; HEAD.visible = true; EYEU.uOpen.value = 0.8; eyes.visible = true;
  key.castShadow = false; key.position.set(3, 5, 12);   // soft, frontal: no long nose shadows on the small faces
  for (let i = 0; i < 9; i++) {
    HEAD.scale.set(1 + (R(i + 40) - 0.5) * 0.24, 1 + (R(i + 50) - 0.5) * 0.16, 1); HEAD.rotation.y = i ? (R(i + 60) - 0.5) * 0.6 : 0;
    clay.color.set(i ? mixc('#8C6E5A', '#D8C2B0', R(i + 70)) : CLAY);
    R3.render(scene, cam); const [c, x] = mkc(300, 360);
    x.fillStyle = bgs[0]; x.fillRect(0, 0, 300, 360); x.drawImage(glc, 40, 240, 1000, 1200, 0, 0, 300, 360); out.push(c);
  }
  HEAD.scale.set(1, 1, 1); HEAD.rotation.y = 0; clay.color.set(CLAY); faceDots.visible = true; beams.visible = true; key.castShadow = true; key.position.set(6, 7, 9);
  cam.position.copy(keep.pos); cam.fov = keep.fov; cam.updateProjectionMatrix();
  return out;
}
S.odds = (x, t) => {
  if (!FACES) FACES = faceThumbs();
  x.fillStyle = '#0B0B0E'; x.fillRect(0, 0, W, H);
  // zoom out of a grid of faces: 1, 9, ... until each is a dot
  const z = Math.exp(lerp(Math.log(2.6), Math.log(1 / 188), eio((t - K.odds + 0.15) / (K.million + 0.3 - K.odds))));   // down to a pixel a face
  const cw = 300 * z * 0.6, chh = 360 * z * 0.6, gap = 14 * z * 0.6, sx = cw + gap, sy = chh + gap, cx = 540, cy = 980;
  const nx = Math.ceil(W / sx / 2) + 1, ny = Math.ceil(H / sy / 2) + 1;
  if (sx > 6) {
    for (let i = -nx; i <= nx; i++) for (let j = -ny; j <= ny; j++) {
      const X0 = cx + i * sx - cw / 2, Y0 = cy + j * sy - chh / 2, id = i || j ? 1 + Math.floor(R((i + 500) * 1009 + j + 7) * 8) : 0;
      if (sx > 40) { x.save(); rrx(x, X0, Y0, cw, chh, 14 * z); x.clip(); x.drawImage(FACES[id], X0, Y0, cw, chh); x.restore(); }
      else { x.fillStyle = id ? 'rgba(200,180,165,.55)' : WHT; x.fillRect(X0, Y0, cw, chh); }
    }
  } else if (sx > 2.2) {                           // a field of dots, one per face
    const [pc, px_] = mkc(Math.round(sx * 8), Math.round(sx * 8)); px_.fillStyle = 'rgba(205,185,170,.7)';
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { px_.beginPath(); px_.arc((i + 0.5) * sx, (j + 0.5) * sx, Math.max(0.6, sx * 0.32), 0, TAU); px_.fill(); }
    x.save(); x.translate(cx - sx / 2, cy - sx / 2); x.fillStyle = x.createPattern(pc, 'repeat'); x.fillRect(-cx - sx, -cy - sx, W + 2 * sx, H + 2 * sx); x.restore();
  } else {                                         // a million faces, a pixel each: 1,000 x 1,000
    if (!CROWD) { const [c, q] = mkc(1000, 1000), d = q.createImageData(1000, 1000); seed = 4242;
      for (let i = 0; i < 1e6; i++) { const b = 0.45 + 0.55 * rnd(), w = rnd(); d.data[4 * i] = (140 + 70 * w) * b; d.data[4 * i + 1] = (110 + 70 * w) * b; d.data[4 * i + 2] = (95 + 65 * w) * b; d.data[4 * i + 3] = 255; }
      q.putImageData(d, 0, 0); CROWD = c; }
    x.save(); x.imageSmoothingEnabled = sx > 1.05; x.drawImage(CROWD, cx - 500 * sx, cy - 500 * sx, 1000 * sx, 1000 * sx); x.restore();
  }
  // you, in the blue selection box; a stranger, in red
  const bw = Math.max(26, cw + 16), bh = Math.max(26, chh + 16);
  selBox(x, cx - bw / 2, cy - bh / 2, bw, bh, 1);
  pill(x, 'you', cx, cy - bh / 2 - 46, 36, false, (t - T0.odds - 0.1) / 0.3, { f: 'Body', w: 700, bg: BLUE, fg: WHT });
  const ks = win(t, K.stranger, K.one, 0.2, 0.25);
  if (ks > 0 && sx > 40) { x.save(); x.globalAlpha = ks; x.strokeStyle = RED; x.lineWidth = 6; x.setLineDash([16, 10]); x.strokeRect(cx + sx - cw / 2 - 8, cy - chh / 2 - 8, cw + 16, chh + 16); x.restore(); pill(x, 'stranger?', cx + sx, cy + chh / 2 + 50, 34, false, ks, { f: 'Body', w: 700, bg: RED, fg: WHT }); }
  const km = (t - K.one) / 0.35;
  if (km > 0) {
    x.save(); x.globalAlpha = clamp(km); x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, 1320, W, 330); x.restore();
    rise(x, '1 in 1,000,000', 540, 1500, '800 128px Logo', WHT, km, -5);
  }
  smallPrint(x, 'Apple: a random person, one enrolled face. Higher for twins, siblings, kids under 13.', win(t, K.one, T0.eyes, 0.3, 0.2));
};
function selBox(x, X, Y, w, h, k) {                  // the reference's selection: a thin blue box, round handles
  if (k <= 0) return; x.save(); x.globalAlpha *= k; x.strokeStyle = BLUE; x.lineWidth = 4; x.strokeRect(X, Y, w, h);
  [[X, Y], [X + w, Y + h]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 10, 0, TAU); x.fillStyle = WHT; x.fill(); x.lineWidth = 4; x.stroke(); });
  x.restore();
}

// ---------- the eyes ----------
S.eyes = (x, t) => {
  setWorld(t); backdrop(x, t);
  x.save(); x.translate(jolt(t, K.shutLocked, 10), 0);
  render3(x);
  const EP = [WORLD.EYE[0][0], WORLD.EYE[0][1] + 0.14, 1.95];
  label(x, EP, 0, -190, 'eyes open', win(t, K.open - 0.05, K.shut, 0.4, 0.2), { bg: '#34C759', fg: WHT });
  label(x, EP, 0, -190, 'eyes closed', win(t, K.shut + 0.15, 99, 0.4, 0.2));
  if (t >= K.shutLocked - 0.05) badge(x, 540, 1480, 'red', (t - K.shutLocked + 0.05) / 0.2, K.shutLocked, { t });
  x.restore();
};

// ---------- the tension: the colour drains, a heartbeat, a clock ----------
let FRZ = null;
function frozen() { if (!FRZ) { const [c, x] = mkc(1080, 1920); S.eyes(x, K.freeze); FRZ = c; } return FRZ; }
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
function heart(c, X, Y, r) { c.beginPath(); c.moveTo(X, Y + r * 0.9); c.bezierCurveTo(X - r * 1.6, Y - r * 0.1, X - r * 0.8, Y - r * 1.3, X, Y - r * 0.45); c.bezierCurveTo(X + r * 0.8, Y - r * 1.3, X + r * 1.6, Y - r * 0.1, X, Y + r * 0.9); c.fill(); }
function rail(c) {                                   // like, comment, share
  c.save(); c.fillStyle = WHT; c.strokeStyle = WHT; c.lineWidth = 6; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 10;
  heart(c, 544, 690, 32);
  c.beginPath(); c.arc(544, 806, 28, 0.35 * Math.PI, 2.25 * Math.PI); c.lineTo(522, 840); c.closePath(); c.stroke();
  c.beginPath(); c.moveTo(514, 902); c.lineTo(576, 880); c.lineTo(554, 942); c.lineTo(543, 914); c.closePath(); c.stroke();
  c.restore();
}
function acct(c, name, sub, a) {                     // who posted it
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
  setF(c, '500 26px Body', 0); c.fillStyle = 'rgba(255,255,255,.9)'; c.textAlign = 'left'; c.fillText('How Face ID knows it’s really you…', 30, 1090);
  if (ad > 0) {                                      // the call to action every ad gets
    c.save(); c.globalAlpha = ad; c.translate(0, 50 * (1 - ad)); rrx(c, 24, 1118, 552, 90, 18); c.fillStyle = 'rgba(255,255,255,.96)'; c.fill();
    setF(c, '700 34px Body', 0); c.fillStyle = INK; c.fillText('Shop now', 54, 1176); c.textAlign = 'right'; c.fillText('›', 548, 1177); c.restore();
  }
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(0, 1254, 600, 7); c.fillStyle = WHT; c.fillRect(0, 1254, 600 * 0.8, 7);
  const kt = (t - T0.phone - 0.3) / 0.3;               // the clock, counting the time you watched
  if (kt > 0) {
    const n = Math.round(NUM * clamp((t - K.watched) / (K.num - K.watched))), str = '0:' + String(n).padStart(2, '0');
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

// ---------- the pitch: each line rises on its word (no captions under it) ----------
const PITCH = [[['We scale businesses', WHT, 's1'], ['with ads like this.', GREY, 's2']],
  [['DM us the word', WHT, 'd1'], ['teardown', null, 'd2'], ['for a free ad review.', GREY, 'd3']]];
function pitchLines(x, t, lines, Y0) {
  setF(x, '600 130px Logo', -4); const fs = 130 * Math.min(1, 830 / Math.max(...lines.map(([str]) => x.measureText(str).width)));
  lines.forEach(([str, col, k], i) => {
    const Y = Y0 + i * fs * 1.2, kk = (t - K[k] + 0.04) / 0.38, f = '600 ' + fs + 'px Logo';
    if (!col && kk > 0) {                               // the keyword, in a box
      setF(x, f, -fs * 0.03); const w = x.measureText(str).width + fs * 0.5;
      x.fillStyle = WHT; x.fillRect(540 - w / 2, Y - fs * 0.84, w * expo(kk / 0.6), fs * 1.1);
    }
    rise(x, str, 540, Y, f, col || INK, kk, -fs * 0.03);
  });
}
S.pitch = (x, t) => {
  stage(x, true);
  x.save(); zoomAt(x, 540, 900, 1 + 0.03 * clamp((t - T0.pitch) / 4));
  const ka = ease((t - K.d1 + 0.18) / 0.2);            // the first two lines make way for the ask
  if (ka < 1) { x.save(); x.globalAlpha = 1 - ka; x.translate(0, -120 * ka); pitchLines(x, t, PITCH[0], 860); x.restore(); }
  pitchLines(x, t, PITCH[1], 780);
  x.restore();
  pill(x, '@mezmedia_0', 540, 1300, 40, false, (t - K.handle) / 0.3, { f: 'Body', w: 600 });   // who to DM; then it loops to the hook
};

// ---------- captions at the top: the phrase builds word by word ----------
const CAPY = 250, CAPS = 76;
window.captions = (t) => {
  const c = CH.find((q) => t >= q.s && t < q.e); if (!c) return;
  const top = t >= T0.phone ? 1215 : CAPY;            // under the phone on the switch
  const fade = clamp((c.e - t) / 0.12) * clamp((t - c.s + 1 / FPS) / 0.06);
  g.save(); g.globalAlpha = fade * 0.55; const wq = g.createLinearGradient(0, top - 190, 0, top + 230); wq.addColorStop(0, 'rgba(0,0,0,0)'); wq.addColorStop(0.45, 'rgba(0,0,0,1)'); wq.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = wq; g.fillRect(0, top - 190, W, 420); g.restore();
  g.save(); g.textBaseline = 'alphabetic'; setF(g, '800 ' + CAPS + 'px Logo', -CAPS * 0.03);
  const sp = g.measureText(' ').width + 6;
  const said = c.rows.flat().filter((w) => w.s <= t + 1 / FPS), cur = said[said.length - 1];
  c.rows.forEach((row, ri) => {
    const ws = row.map((w) => g.measureText(w.w.replace(/'/g, '’')).width), tw = ws.reduce((a, b) => a + b, 0) + sp * (row.length - 1);
    let X = 540 - tw / 2; const Y = top + ri * CAPS * 1.18;
    row.forEach((w, i) => {
      const str = w.w.replace(/'/g, '’'), k = clamp((t + 1 / FPS - w.s) / 0.08);
      if (k > 0) {
        g.globalAlpha = fade * k;
        if (w.hl) {                                      // the key word in the blue selection box
          const bx = X - 12, by = Y - CAPS * 0.86, bw = ws[i] + 24, bh = CAPS * 1.12;
          g.save(); g.fillStyle = 'rgba(47,128,255,.18)'; g.fillRect(bx, by, bw * expo(k), bh); g.restore();
          selBox(g, bx, by, bw, bh, clamp(k * 2) * fade);
        }
        g.shadowColor = 'rgba(0,0,0,.65)'; g.shadowBlur = 18;
        g.fillStyle = w === cur || w.hl ? WHT : 'rgba(255,255,255,.5)';
        g.save(); const sc = 1.12 - 0.12 * back(k); g.translate(X + ws[i] / 2, Y - CAPS * 0.3); g.scale(sc, sc); g.translate(-(X + ws[i] / 2), -(Y - CAPS * 0.3));
        g.textAlign = 'left'; g.fillText(str, X, Y); g.restore(); g.shadowBlur = 0;
      }
      X += ws[i] + sp;
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
    rrx(g, 540 - tw / 2 - 86, 1062, tw + 140, 108, 54); g.fillStyle = 'rgba(0,0,0,.62)'; g.fill();
    g.fillStyle = (t * 2) % 1 < 0.6 ? RED : 'rgba(255,59,48,.35)'; g.beginPath(); g.arc(540 - tw / 2 - 40, 1116, 15, 0, TAU); g.fill();
    g.fillStyle = WHT; g.textAlign = 'left'; g.fillText(str, 540 - tw / 2 - 8, 1138); g.restore();
  }
};

// the photo on the card: the head, front on, printed with a white border
{
  setWorld(0); phoneG.visible = false; faceDots.visible = false; beams.visible = false; card.visible = false; lights(1);
  const keep = cam.position.clone(); cam.position.set(0.0, 1.0, 14); cam.fov = 24; cam.updateProjectionMatrix(); cam.lookAt(0.0, 1.0, 0);
  R3.render(scene, cam);
  const x = cardTex.x; x.fillStyle = '#F4F1EC'; x.fillRect(0, 0, 740, 940);
  const q = x.createLinearGradient(0, 0, 0, 940); q.addColorStop(0, '#5C6B7E'); q.addColorStop(1, '#2C3440'); x.fillStyle = q; x.fillRect(34, 34, 672, 800);
  x.drawImage(glc, 540 - 420, 960 - 520, 840, 1000, 34, 34, 672, 800);
  x.fillStyle = 'rgba(255,255,255,.08)'; x.beginPath(); x.moveTo(34, 34); x.lineTo(706, 34); x.lineTo(34, 600); x.fill();
  cardTex.t.needsUpdate = true;
  phoneG.visible = true; faceDots.visible = true; beams.visible = true; cam.position.copy(keep);
}
