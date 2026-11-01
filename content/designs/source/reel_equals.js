// Mez Media reel: "Why would anyone invent the equals sign?" One of Zack D. Films' most watched topics ("How The Equals
// Sign Was Invented", 92M views) made the way the armor, whale and bell reels were: a question hook with a quill racing
// across a page on the first frame, the expressive female voice, a new camera set-up about every second (16 in the
// first 20 seconds), captions at the top built word by word, labels on leader lines, small print with sources; then the
// switch (a feed that flicks past ads that say too much and stops on one that says it in two lines) and the pitch.
// Facts and sources: reel_equals_vo.py. Timing: reel_equals_cues.json. Writes reel_equals_events.json for the audio.
// Usage: node reel_equals.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, FONT_CSS } = require('./reel_kit');
const { FRAMES, renderScreens } = require('./phone_screens');

const [FRAMES_DIR, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_equals_cues.json'), 'utf8'));
const L = C.lines;
const words = C.words.map((w) => ({ ...w }));
const Wd = (line) => words.filter((w) => w.line === line);
const at = (line, i) => Wd(line)[i].s;

// ---------- captions: at the top, the phrase builds word by word ("+" rides with the word before it) ----------
const HL = { why: ['equals', 'sign'], sick: ['sick'], doc: ['1557', 'doctor', 'book'], again: ['again'], lines: ['lines'],
  why2: ['lines'], equal: ['equal'], longer: ['longer'], calc: ['calculator'], three: ['words', 'lines'], most: ['too', 'much'], say: ['two', 'lines'] };
const SKIP = new Set(['scale', 'dm']);               // the pitch is its own big type
const MAXC = 22;
const CH = [];
Object.keys(L).filter((line) => !SKIP.has(line)).forEach((line) => {
  let cur = null;
  const close = () => { if (cur) CH.push(cur); cur = null; };
  Wd(line).filter((w) => w.w !== '+').forEach((w) => {
    if (!cur) cur = { line, s: w.s, rows: [[]] };
    let row = cur.rows[cur.rows.length - 1];
    const len = row.reduce((n, q) => n + q.w.length + 1, 0) + w.w.length;
    if (row.length && len > MAXC) { if (cur.rows.length === 2) { close(); cur = { line, s: w.s, rows: [[]] }; } else cur.rows.push([]); row = cur.rows[cur.rows.length - 1]; }
    row.push({ w: w.w, s: w.s, e: w.e, hl: (HL[line] || []).includes(w.w.toLowerCase()) || (HL[line] || []).includes(w.w) });
  });
  close();
});
CH[0].s = 0; CH[0].rows[0][0].s = -0.1;              // the first word is on the first frame
CH.forEach((c, i) => {
  const nx = CH[i + 1], last = c.rows.flat().slice(-1)[0].e;
  c.e = +Math.min(nx ? nx.s : C.end, nx && nx.line === c.line ? nx.s : last + 0.4, L.scale.s).toFixed(3);   // gone when the pitch starts
});

// ---------- the edit: the 3D world, then the feed, then the pitch ----------
const SHOTS = [
  ['study', 0, L.most.s, 'none'],             // Recorde's study in 1557, the two lines, the rails, the calculator
  ['feed', L.most.s, L.scale.s, 'cut'],       // the last frame becomes a post in a feed that flicks past ads that say too much
  ['pitch', L.scale.s, C.end, 'cut'],         // "We scale businesses with ads like this. DM us the word teardown..."
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// key moments the scene and the sound both use
const K = {
  invent: at('why', 3), equals: at('why', 5),
  sickL: L.sick.s, sick: at('sick', 3), writing: at('sick', 5), isq: at('sick', 6),
  docL: L.doc.s, n1557: at('doc', 1), welsh: at('doc', 4), doctor: at('doc', 5), math: at('doc', 9), book: at('doc', 10),
  againL: L.again.s, wrote: at('again', 1), a1: at('again', 5), a2: at('again', 7), a3: at('again', 9),
  linesL: L.lines.s, drew: at('lines', 2), lines: at('lines', 4),
  why2L: L.why2.s, why2: at('why2', 1),
  equalL: L.equal.s, equalW: at('equal', 6),
  longerL: L.longer.s, way: at('longer', 3), longer: at('longer', 4),
  calcL: L.calc.s, calc: at('calc', 4),
  threeL: L.three.s, three: at('three', 2), words: at('three', 3), two: at('three', 5), lines2: at('three', 6),
  mostL: L.most.s, too: at('most', 3), sayL: L.say.s, lines3: at('say', 4),
  s1: at('scale', 0), s2: at('scale', 3), d1: at('dm', 0), d2: at('dm', 4), d3: at('dm', 5), handle: +(L.dm.e + 0.05).toFixed(3),
};
// the camera: a new set-up on almost every line, hard cuts, each one moving [start, from-view, to-view]
const CUTS = [
  [0, 'nib0', 'nib1'], [K.equals - 0.04, 'eq0', 'eq1'], [K.sickL, 'face0', 'face1'], [K.writing - 0.05, 'page0', 'page1'],
  [K.docL, 'room0', 'room1'], [K.math - 0.05, 'cover0', 'cover1'], [K.againL, 'flip0', 'flip1'], [K.a2 - 0.05, 'pile0', 'pile1'],
  [K.linesL, 'draw0', 'draw1'], [K.why2L, 'lift0', 'lift1'], [K.equalL, 'rail0', 'rail1'], [K.longerL, 'long0', 'long1'],
  [K.calcL, 'calc0', 'calc1'], [K.calc - 0.05, 'key0', 'key1'], [K.threeL, 'words0', 'words1'],
].map(([t, a, b]) => [+t.toFixed(3), a, b || a]);

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[K.equals - 0.04, K.equals + 0.14, 3], [K.a3 - 0.03, K.a3 + 0.16, 3], [K.equalL - 0.02, K.equalL + 0.3, 3],
  [K.calc - 0.03, K.calc + 0.14, 3], [K.two - 0.03, K.two + 0.18, 3],
  [T0.feed - 0.02, T0.feed + 0.6, 4], [K.too, K.sayL + 0.25, 5], [K.d1 - 0.02, K.d1 + 0.4, 4]];

// ---------- sound design (reel_equals_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
ev(0, 'room', 0.42, { d: T0.feed - 0.1 }); ev(0, 'scratch', 0.5, { d: K.equals - 0.1 });
ev(K.equals - 0.06, 'whoosh_c', 0.28); ev(K.equals, 'clang', 0.5); ev(K.equals + 0.02, 'thump', 0.3);
ev(K.sickL - 0.05, 'whoosh_soft', 0.22); ev(K.sick - 0.05, 'sigh', 0.36); ev(K.writing - 0.06, 'whoosh_soft', 0.2); ev(K.writing, 'scratch', 0.3, { d: Math.max(0.2, K.isq - K.writing - 0.08) });   // quiet under 'is equal to'
ev(K.docL - 0.05, 'whoosh_soft', 0.24); ev(K.n1557, 'stamp', 0.36); ev(K.welsh, 'scratch', 0.3, { d: K.math - K.welsh - 0.1 });
ev(K.math - 0.06, 'whoosh_c', 0.24); ev(K.book, 'bookthud', 0.42);
ev(K.againL - 0.05, 'whoosh_soft', 0.22); for (let i = 0; i < 9; i++) { const tf = K.wrote + (K.a2 - K.wrote) * i / 9; ev(tf, 'flip', tf < K.a1 - 0.05 ? 0.07 : 0.2 + 0.02 * i, { pan: (i % 2 ? 0.2 : -0.2) }); }
ev(K.a2 - 0.06, 'whoosh_c', 0.26); ev(K.a3, 'bookthud', 0.5); ev(K.a3 + 0.02, 'thump', 0.3);
ev(K.linesL - 0.05, 'whoosh_soft', 0.22); ev(K.linesL + 0.05, 'ding', 0.34); ev(K.drew, 'stroke', 0.42); ev(K.drew + 0.42, 'stroke', 0.42, { pan: 0.1 });
ev(K.why2L - 0.05, 'whoosh_c', 0.26); ev(K.why2L, 'riser', 0.2, { d: 0.9 });
ev(K.equalL - 0.05, 'whoosh_f', 0.3); ev(K.equalL, 'hum', 0.3, { d: K.longerL - K.equalL }); ev(K.equalW, 'chime', 0.4);
ev(K.longerL - 0.05, 'whoosh_soft', 0.22); ev(K.way - 0.05, 'slide', 0.36);
ev(K.calcL - 0.06, 'whoosh_c', 0.26); ev(K.calc - 0.05, 'whoosh_soft', 0.2); ev(K.calc + 0.08, 'click', 0.5); ev(K.calc + 0.12, 'beep', 0.32);
ev(K.threeL - 0.05, 'whoosh_soft', 0.22); [0, 1, 2].forEach((i) => ev(K.threeL + 0.12 + 0.12 * i, 'pop', 0.22 + 0.03 * i, { pan: (i - 1) * 0.3 }));
ev(K.two - 0.02, 'swish', 0.3); ev(K.lines2, 'snap', 0.4); ev(K.lines2 + 0.03, 'chime', 0.3);
ev(T0.feed - 0.03, 'deep', 0.36); ev(T0.feed, 'zoom_out', 0.2);
ev(K.too - 0.3, 'swish', 0.3, { pan: 0.2 }); ev(K.too + 0.0, 'swish', 0.26, { pan: -0.2 }); ev(K.too + 0.3, 'swish', 0.24, { pan: 0.2 });
ev(K.sayL, 'thump', 0.34); ev(K.lines3, 'like', 0.34);
ev(T0.pitch - 0.3, 'deep', 0.32); ev(T0.pitch - 0.2, 'whoosh_f', 0.22);
ev(K.d1 - 0.05, 'whoosh_soft', 0.28); ev(K.d2, 'hit', 0.34);
ev(K.handle, 'pop', 0.3);
// the score: a low drone under the question; the groove from "In 1557", a breath before "No two things can be more
// equal", a warm lift as the rails run to infinity; lighter under the feed, and back for the pitch
const MUSIC = { start: K.docL, hush: [K.why2L - 0.05, K.equalL - 0.02], dawn: K.equalL, feed: T0.feed, pitch: T0.pitch, end: L.dm.s };
fs.writeFileSync(path.join(__dirname, 'reel_equals_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC, blur: BLUR }, null, 1));

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
const LN=${JSON.stringify(L)}, CUTS=${JSON.stringify(CUTS)}, FPS=30;
const DEBUGCAM=${process.env.EQ_CAM || 'null'};  // EQ_CAM='[[x,y,z],[tx,ty,tz],fov]' holds the camera for checks
${fs.readFileSync(path.join(__dirname, 'reel_phone_kit.js'), 'utf8')}
const S={}, LIGHT={};
const imgsReady=window.ready; let threeDone; const threeReady=new Promise(r=>threeDone=r);
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','500 40px Body','600 40px Body','700 40px Body','40px Mono','italic 40px Serif'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([imgsReady,fontsReady,threeReady]).then(()=>prepare());
</script>
<script type="module">
const X = await import(URL.createObjectURL(new Blob([${JSON.stringify(THREE_SRC)}], {type:'text/javascript'})));
await document.fonts.ready;
${fs.readFileSync(path.join(__dirname, 'reel_equals_scene.js'), 'utf8')}
threeDone();
</script></body></html>`;
  await render(html, { frames: FRAMES_DIR, out: OUT, end: C.end, flag, list, gl: true });
})();
