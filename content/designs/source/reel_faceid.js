// Mez Media reel: "Your iPhone can see your face in total darkness. But show it a perfect photo of you... Nothing."
// An explainer in the style of the touchscreen reel that held 17M viewers: a paradox hook, a second loop straight
// after it (asleep?), then the mechanism one picture per line on one continuous 3D camera, both loops closed, and
// the switch: "You've just watched this reel for 39 seconds. Imagine your ad held people that long."
// The world (three.js, software WebGL): a clay head (Lee Perry-Smith head scan by Infinite Realities, CC BY 3.0,
// models/LeePerrySmith.glb from the three.js examples) and an iPhone 30 cm in front of it. The dot projector's rays
// are traced here against the scan, so every dot lands where it would on that face; the eyes of the scan are shut,
// so the lids are cut out into their own mesh (they close over eyeballs on cue). Captions sit at the top as in the
// reference: the words of the phrase appear as they are said, the one being said in white, the key word in a blue
// selection box. Facts (Apple): see reel_faceid_vo.py.
// Timing: reel_faceid_cues.json (reel_faceid_vo.py). Writes reel_faceid_events.json for reel_faceid_audio.py.
// Usage: node reel_faceid.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, FONT_CSS } = require('./reel_kit');
const { FRAMES, renderScreens } = require('./phone_screens');

const [FRAMES_DIR, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_faceid_cues.json'), 'utf8'));
const L = C.lines;
const words = [];
C.words.forEach((w) => { if (w.w === '+') words[words.length - 1].e = w.e; else words.push({ ...w }); });
const Wd = (line) => words.filter((w) => w.line === line);
const at = (line, i) => Wd(line)[i].s;
const NUM = +Wd('watched')[6].w;                      // the seconds said on the switch (the real time at that word)

// ---------- the head scan ----------
const glb = fs.readFileSync(path.join(__dirname, 'models', 'LeePerrySmith.glb'));
const jl = glb.readUInt32LE(12), GJ = JSON.parse(glb.subarray(20, 20 + jl).toString()), BIN = glb.subarray(28 + jl);
function acc(i, T) {
  const a = GJ.accessors[i], bv = GJ.bufferViews[a.bufferView], n = { SCALAR: 1, VEC2: 2, VEC3: 3 }[a.type];
  const at0 = (bv.byteOffset || 0) + (a.byteOffset || 0), ab = new ArrayBuffer(a.count * n * T.BYTES_PER_ELEMENT);
  new Uint8Array(ab).set(BIN.subarray(at0, at0 + ab.byteLength)); return new T(ab);
}
const prim = GJ.meshes[0].primitives[0];
const POS = acc(prim.attributes.POSITION, Float32Array), NRM = acc(prim.attributes.NORMAL, Float32Array), IDX = acc(prim.indices, Uint16Array);
const vtx = (i) => [POS[3 * i], POS[3 * i + 1], POS[3 * i + 2]];

// the scan's eyes are shut. To open them, the head's shader cuts an almond out of each lid (eyelid-shaped, see the
// scene) and shows a copy of the lid surface a hair further in, with a carved iris mapped on, so nothing pokes out
const EYE = [[-0.73, 1.64, 0.3], [0.56, 1.645, 0.28]], EAY = 0.1;   // centre x, y, half-width: on the lid crease (the scan is a little turned)
const lids = [];
for (let f = 0; f < IDX.length; f += 3) {
  const c = [0, 1, 2].map((j) => (POS[3 * IDX[f] + j] + POS[3 * IDX[f + 1] + j] + POS[3 * IDX[f + 2] + j]) / 3);
  if (c[2] > 1.4 && EYE.some(([ex, ey, ax]) => ((c[0] - ex) / (ax * 1.2)) ** 2 + ((c[1] - ey) / (EAY * 1.8)) ** 2 < 1)) lids.push(IDX[f], IDX[f + 1], IDX[f + 2]);
}
const ePos = [], eNrm = [], eUv = [];
for (const i of lids) {
  const [x, y, z] = vtx(i), [ex, ey] = EYE[x < 0 ? 0 : 1];
  ePos.push(x, y, z - 0.006); eNrm.push(NRM[3 * i], NRM[3 * i + 1], NRM[3 * i + 2]);
  eUv.push(0.5 + (x - ex) / 0.64, 0.5 + (y - ey + 0.01) / 0.64);    // a 0.64-wide square of iris texture on each eye
}

// ---------- the world (head units: the face is about 3 wide, so 1 unit is about 4.7 cm) ----------
const add = (a, b, k = 1) => a.map((v, i) => v + b[i] * k), sub = (a, b) => a.map((v, i) => v - b[i]);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l); };
const PHONE = { pos: [2.3, -1.3, 9.6], look: [0.1, 1.2, 2.2], w: 1.55, h: 3.15, d: 0.17 };    // ~35 cm away, low and to the side, screen to the face
const PZ = norm(sub(PHONE.look, PHONE.pos)), PX = norm(cross([0, 1, 0], PZ)), PY = cross(PZ, PX);
const local = (v) => add(add(add(PHONE.pos, PX, v[0]), PY, v[1]), PZ, v[2]);   // phone space -> world
const NOTCH = { ir: [-0.136, 1.396, 0.106], flood: [-0.057, 1.396, 0.106], cam: [0.074, 1.396, 0.106], proj: [0.147, 1.396, 0.106] };   // in the pill on the screen
const PROJ = local(NOTCH.proj);
const CARD = { z: 4.9, cx: 0.2, cy: 1.1, w: 3.1, h: 3.9 };    // the printed photo (15 x 18 cm), held between the face and the phone

// ---------- the dot projector: ~34,000 rays traced against the scan ----------
const AIM = [0.0, 1.05, 1.8], F = norm(sub(AIM, PROJ)), RX = norm(cross(F, [0, 1, 0])), RY = cross(RX, F);
const NA = 170, NB = 200, SA = 0.25, SB = 0.37;      // rays across x up (tangent of the half-angles)
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const tri = [], CELL = 0.01, grid = new Map();
const ab = (p) => { const w = sub(p, PROJ), z = dot(w, F); return [dot(w, RX) / z, dot(w, RY) / z]; };
for (let f = 0; f < IDX.length; f += 3) {
  const v = [vtx(IDX[f]), vtx(IDX[f + 1]), vtx(IDX[f + 2])], q = v.map(ab);
  const a0 = Math.floor(Math.min(...q.map((p) => p[0])) / CELL), a1 = Math.floor(Math.max(...q.map((p) => p[0])) / CELL);
  const b0 = Math.floor(Math.min(...q.map((p) => p[1])) / CELL), b1 = Math.floor(Math.max(...q.map((p) => p[1])) / CELL);
  const id = tri.push(v) - 1;
  for (let i = a0; i <= a1; i++) for (let j = b0; j <= b1; j++) { const k = i * 10007 + j; if (!grid.has(k)) grid.set(k, []); grid.get(k).push(id); }
}
function hit(d) {                                    // nearest hit along PROJ + t d (Moller-Trumbore)
  const q = [dot(d, RX) / dot(d, F), dot(d, RY) / dot(d, F)], ids = grid.get(Math.floor(q[0] / CELL) * 10007 + Math.floor(q[1] / CELL)) || [];
  let best = Infinity;
  for (const id of ids) {
    const [p0, p1, p2] = tri[id], e1 = sub(p1, p0), e2 = sub(p2, p0), h = cross(d, e2), a = dot(e1, h);
    if (Math.abs(a) < 1e-9) continue;
    const s = sub(PROJ, p0), u = dot(s, h) / a; if (u < 0 || u > 1) continue;
    const qq = cross(s, e1), v = dot(d, qq) / a; if (v < 0 || u + v > 1) continue;
    const t = dot(e2, qq) / a; if (t > 1e-4 && t < best) best = t;
  }
  return best;
}
const DOTS = [];                                     // x, y, z (a hair in front of the skin), distance, sweep (0 top .. 1 bottom)
for (let i = 0; i < NA; i++) for (let j = 0; j < NB; j++) {
  const n = i * NB + j, a = ((i + 0.5 + (hash(n) - 0.5) * 0.7) / NA * 2 - 1) * SA, b = ((j + 0.5 + (hash(n + 77777) - 0.5) * 0.7) / NB * 2 - 1) * SB;
  const d = norm(add(add(F, RX, a), RY, b)), t = hit(d);
  if (t < Infinity) { const p = add(PROJ, d, t - 0.015); DOTS.push(+p[0].toFixed(4), +p[1].toFixed(4), +p[2].toFixed(4), +t.toFixed(4), +(0.5 - b / SB / 2).toFixed(4)); }
}
const b64 = (ta) => Buffer.from(ta.buffer, ta.byteOffset, ta.byteLength).toString('base64');
const MODEL = {
  pos: b64(POS), nrm: b64(NRM), idx: b64(IDX),
  dots: b64(Float32Array.from(DOTS)), ePos: b64(Float32Array.from(ePos)), eNrm: b64(Float32Array.from(eNrm)), eUv: b64(Float32Array.from(eUv)),
};
const WORLD = { PHONE, PX, PY, PZ, NOTCH: Object.fromEntries(Object.entries(NOTCH).map(([k, v]) => [k, local(v)])), PROJ, CARD, EYE, EAY };
console.log(`head: ${POS.length / 3} vertices, ${IDX.length / 3} triangles (${lids.length / 3} round the eyes); ${NA * NB} rays, ${DOTS.length / 5} dots on the face`);

// ---------- captions: at the top, the phrase builds word by word ----------
// a phrase is up to two rows; the word being said is white, the ones before it grey, a key word in a blue box
const HL = new Set(['darkness', 'photo', 'nothing', 'asleep', 'locked', 'projector', '30,000', 'invisible', 'closer', '3D', 'flat',
  'infrared', 'chip', 'numbers', 'stranger', 'million', 'open', 'closed']);
const SKIP = new Set(['scale', 'dm']);               // the pitch is its own big type
const MAXC = 22;                                     // characters a row holds
const CH = [];
Object.keys(L).filter((line) => !SKIP.has(line)).forEach((line) => {
  let cur = null;
  const close = () => { if (cur) CH.push(cur); cur = null; };
  Wd(line).forEach((w) => {
    if (!cur) cur = { line, s: w.s, rows: [[]] };
    let row = cur.rows[cur.rows.length - 1];
    const len = row.reduce((n, q) => n + q.w.length + 1, 0) + w.w.length;
    if (row.length && len > MAXC) { if (cur.rows.length === 2) { close(); cur = { line, s: w.s, rows: [[]] }; } else cur.rows.push([]); row = cur.rows[cur.rows.length - 1]; }
    row.push({ w: w.w, s: w.s, e: w.e, hl: HL.has(w.w.toLowerCase()) });
  });
  close();
});
CH[0].s = 0; CH[0].rows[0][0].s = -0.1;              // the first word is on the first frame
CH.forEach((c, i) => {
  const nx = CH[i + 1], last = c.rows.flat().slice(-1)[0].e;
  c.e = +Math.min(nx ? nx.s : C.end, nx && nx.line === c.line ? nx.s : last + 0.45).toFixed(3);
});

// ---------- the edit ----------
const TENSE = +(L.shut.e + 0.05).toFixed(3);
const SHOTS = [
  ['hook', 0, L.how.s, 'none'],               // the face, the phone, the dots: unlocked in the dark; the photo, nothing; asleep, locked
  ['how', L.how.s, L.proj.s, 'none'],         // the camera whips to the top of the phone
  ['proj', L.proj.s, L.cam.s, 'none'],        // TrueDepth: projector, camera, flood; 30,000 dots fly to the face
  ['cam', L.cam.s, L.map.s, 'none'],          // in profile: the nose closer than the cheeks
  ['map', L.map.s, L.flat.s, 'none'],         // the face goes, the 3D map stays
  ['flat', L.flat.s, L.darkx.s, 'none'],      // the photo beside it: one depth
  ['darkx', L.darkx.s, L.chip.s, 'none'],     // lights out: the flood illuminator, an infrared picture
  ['chip', L.chip.s, L.odds.s, 'none'],       // the map into the Secure Enclave, numbers, compared with the saved face
  ['odds', L.odds.s, L.eyes.s, 'none'],       // faces, then a million of them
  ['eyes', L.eyes.s, TENSE, 'none'],          // the eyes: open; closed, locked
  ['tense', TENSE, L.watched.s, 'none'],      // the colour drains, a heartbeat, a clock
  ['phone', L.watched.s, L.scale.s, 'cut'],   // the reel shrinks into a phone; 0:39; then it is your ad
  ['pitch', L.scale.s, C.end, 'cut'],         // "We scale businesses with ads like this. DM us the word teardown..." (loops to the hook)
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// key moments the scene and the sound both use
const K = {
  see: at('see', 3), dark: at('dark', 1), darkness: at('dark', 2), photo: at('photo', 5), nothing: L.nothing.s,
  asleep0: L.asleep.s, close: at('asleep', 4), asleep: at('asleep', 7), still: L.still.s, locked: at('still', 1),
  how: L.how.s, whip: at('how', 1), above: L.proj.s, projector: at('proj', 4), fires: at('proj', 5), n30: at('proj', 7),
  invisible: at('proj', 8), dots: at('proj', 9), face: at('proj', 12),
  camera: at('cam', 1), nose: at('cam', 7), closer: at('cam', 9), cheeks: at('cam', 15),
  map: at('map', 2), flat: at('flat', 3), nodepth: at('flat', 5), nounlock: at('flat', 7),
  darkx: at('darkx', 2), lights: at('darkx', 4), infra: at('darkx', 8), cantsee: at('darkx', 10),
  chip: at('chip', 5), numbers: at('chip', 10), compares: at('chip', 12), saved: at('chip', 15), match: +(L.chip.e - 0.2).toFixed(3),
  odds: at('odds', 1), stranger: at('odds', 3), million: at('million', 5), one: at('million', 2),
  eyes: at('eyes', 6), open: at('eyes', 8), shut: at('shut', 1), shutLocked: at('shut', 2),
  tense: TENSE, freeze: +(TENSE - 0.1).toFixed(3), watched: at('watched', 2), num: at('watched', 6), ad: at('imagine', 2),
  s1: at('scale', 0), s2: at('scale', 3), d1: at('dm', 0), d2: at('dm', 4), d3: at('dm', 5), handle: +(L.dm.e + 0.05).toFixed(3),
};
const BEATS = [0, 1].map((i) => +(TENSE + 0.1 + i * 0.45).toFixed(3));   // the heartbeat under the tension

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[K.whip - 0.1, T0.proj + 0.4, 4], [T0.cam - 0.05, T0.cam + 0.5, 3], [T0.odds - 0.05, T0.odds + 0.4, 3],
  [T0.eyes - 0.05, T0.eyes + 0.45, 3], [T0.phone - 0.02, T0.phone + 0.65, 6], [K.d1 - 0.02, K.d1 + 0.4, 4]];

// ---------- sound design (reel_faceid_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
ev(0.0, 'hit', 0.4); ev(0.02, 'whoosh_c', 0.4, { pan: 0.3 }); ev(K.see - 0.05, 'scan', 0.3); ev(K.see + 0.45, 'check', 0.3);
ev(K.dark - 0.03, 'switch', 0.5); ev(K.darkness, 'deep', 0.45); ev(K.darkness + 0.3, 'check', 0.22);
ev(K.photo - 0.25, 'whoosh_soft', 0.3, { pan: -0.2 }); ev(K.photo + 0.15, 'scan', 0.22);
ev(K.nothing - 0.02, 'thump', 0.45); ev(K.nothing, 'deny', 0.32);
ev(K.close, 'whoosh_soft', 0.18); ev(K.asleep, 'scan', 0.2); ev(K.still - 0.12, 'thump', 0.4); ev(L.still.e + 0.02, 'deny', 0.3);   // clear of "Still locked"
ev(K.whip + 0.15, 'whoosh_f', 0.35, { pan: 0.3 }); ev(K.whip + 0.3, 'deep', 0.28);   // after "So how"
ev(K.projector, 'pop', 0.28, { pan: 0.25 }); ev(K.projector + 0.3, 'pop', 0.22, { pan: -0.25 }); ev(K.projector + 0.5, 'pop', 0.2);
ev(K.fires - 0.05, 'laser', 0.35); for (let i = 0; i < 14; i++) ev(K.n30 - 0.25 + 0.035 * i, 'tick', 0.06 + 0.005 * i, { pan: -0.3 + 0.045 * i });
ev(K.n30 + 0.35, 'select', 0.26); ev(K.invisible, 'sparkle', 0.2); ev(K.dots, 'whoosh_soft', 0.3); ev(K.face, 'scan', 0.25);
ev(T0.cam - 0.3, 'whoosh_soft', 0.26, { pan: 0.3 }); ev(K.nose, 'pop', 0.26); ev(K.closer, 'select', 0.24); ev(K.cheeks, 'pop', 0.24, { pan: -0.3 });
ev(K.map - 0.05, 'sparkle', 0.26); ev(K.map, 'swish', 0.22);
ev(T0.flat - 0.2, 'pop', 0.22, { pan: 0.3 }); ev(K.flat, 'select', 0.22); ev(K.nodepth, 'tap', 0.26); ev(K.nounlock - 0.02, 'thump', 0.4); ev(K.nounlock, 'deny', 0.3);
ev(K.darkx - 0.05, 'switch', 0.45); ev(K.lights, 'scan', 0.3); ev(K.infra, 'sparkle', 0.18);
ev(K.chip - 0.3, 'whoosh_soft', 0.32); ev(K.chip, 'lock', 0.3); for (let i = 0; i < 18; i++) ev(K.numbers + 0.05 * i, 'tick', 0.06, { pan: 0.3 - 0.035 * i });
ev(K.compares, 'scan', 0.22); ev(K.match, 'check', 0.32); ev(K.match + 0.05, 'chime', 0.2);
ev(K.odds, 'pop', 0.26); ev(K.stranger, 'whoosh_soft', 0.26); ev(K.one, 'zoom_out', 0.25); ev(K.million, 'select', 0.3);
ev(T0.eyes - 0.45, 'whoosh_soft', 0.2); ev(K.open, 'check', 0.28); ev(K.shut - 0.1, 'swish', 0.2); ev(K.shutLocked - 0.02, 'thump', 0.45); ev(K.shutLocked, 'deny', 0.32);
ev(K.tense, 'riser', 0.2, { d: T0.phone - K.tense }); BEATS.forEach((t) => { ev(t, 'thump', 0.4); ev(t + 0.17, 'thump', 0.24); });
for (let t = K.tense + 0.05; t < T0.phone - 0.1; t += 0.25) ev(t, 'tick', 0.14, { pan: 0.35 });
ev(T0.phone - 0.03, 'deep', 0.45); ev(T0.phone, 'hit', 0.45); ev(T0.phone - 0.05, 'zoom_out', 0.18);
for (let i = 1; i <= NUM; i++) { const t = K.watched + (K.num - K.watched) * i / NUM; if (t > at('watched', 3)) ev(t, 'tick', 0.06 + 0.002 * i, { pan: 0.2 }); }
ev(K.num, 'select', 0.3);
ev(K.ad, 'pop', 0.3); ev(K.ad + 0.08, 'swish', 0.24, { pan: 0.3 });
ev(T0.pitch - 0.3, 'deep', 0.32); ev(T0.pitch - 0.2, 'whoosh_f', 0.22);   // before "We scale"
ev(K.d1 - 0.05, 'whoosh_soft', 0.28); ev(K.d2, 'hit', 0.34);
ev(K.handle, 'pop', 0.3);
// the score: a low pulse under the hook that drops out on "Nothing." and "Still locked."; the groove under the
// mechanism; a riser, a heartbeat and a clock under the tension; a low drone on the switch; the groove for the pitch
const MUSIC = { pulse: 0.0, gap1: K.nothing, gap2: K.still, how: T0.how, groove: T0.proj, tense: K.tense, phone: T0.phone, drop: L.imagine.s, last: T0.pitch, end: L.dm.s };
fs.writeFileSync(path.join(__dirname, 'reel_faceid_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC, blur: BLUR }, null, 1));

(async () => {
  const { img } = await renderScreens(FRAMES);
  const THREE_SRC = fs.readFileSync(path.join(__dirname, 'vendor', 'three.module.min.js'), 'utf8');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}
*{margin:0;padding:0}html,body{width:1080px;height:1920px;overflow:hidden;background:#000}#gl{position:absolute;left:-5000px}</style></head>
<body><canvas id="c" width="1080" height="1920"></canvas><canvas id="gl" width="1080" height="1920"></canvas>
<script>
const SRC=${JSON.stringify(img)};
${fs.readFileSync(path.join(__dirname, 'reel_kit_browser.js'), 'utf8')}
const C=${JSON.stringify(C)}, SHOTS=${JSON.stringify(SHOTS)}, T0=${JSON.stringify(T0)}, CH=${JSON.stringify(CH)}, K=${JSON.stringify(K)}, BLUR=${JSON.stringify(BLUR)};
const LN=${JSON.stringify(L)}, BEATS=${JSON.stringify(BEATS)}, NUM=${NUM}, FPS=30, WORLD=${JSON.stringify(WORLD)}, MODEL=${JSON.stringify(MODEL)};
const DEBUGCAM=${process.env.FID_CAM || 'null'};   // FID_CAM='[[x,y,z],[tx,ty,tz],fov]' holds the camera for checks
${fs.readFileSync(path.join(__dirname, 'reel_phone_kit.js'), 'utf8')}
const S={}, LIGHT={};
const imgsReady=window.ready; let threeDone; const threeReady=new Promise(r=>threeDone=r);
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','500 40px Body','600 40px Body','700 40px Body'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([imgsReady,fontsReady,threeReady]).then(()=>prepare());
</script>
<script type="module">
const X = await import(URL.createObjectURL(new Blob([${JSON.stringify(THREE_SRC)}], {type:'text/javascript'})));
${fs.readFileSync(path.join(__dirname, 'reel_faceid_scene.js'), 'utf8')}
threeDone();
</script></body></html>`;
  await render(html, { frames: FRAMES_DIR, out: OUT, end: C.end, flag, list, gl: true });
})();
