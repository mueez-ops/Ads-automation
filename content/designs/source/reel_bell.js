// Mez Media reel: "Why would anyone put a bell on a grave?" One of Zack D. Films' most watched topics ("Why Did People
// Put Bells On Graves?", 108M views) made the way the armor and whale reels were: a question hook with a bell ringing on
// a grave on the first frame, the expressive female voice, a new camera set-up about every second (18 in the first 22
// seconds), captions at the top built word by word, labels on leader lines, small print with sources; then the switch
// (a feed that flicks past ads listing features and stops on one that names a fear and takes it away) and the pitch.
// Facts and sources: reel_bell_vo.py. Timing: reel_bell_cues.json. Writes reel_bell_events.json for the audio.
// Usage: node reel_bell.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, FONT_CSS } = require('./reel_kit');
const { FRAMES, renderScreens } = require('./phone_screens');

const [FRAMES_DIR, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_bell_cues.json'), 'utf8'));
const L = C.lines;
const words = C.words.map((w) => ({ ...w }));
const Wd = (line) => words.filter((w) => w.line === line);
const at = (line, i) => Wd(line)[i].s;

// ---------- captions: at the top, the phrase builds word by word ("+" rides with the word before it) ----------
const HL = { why: ['bell', 'grave'], alive: ["wasn't", 'dead'], fear: ['terrified', 'alive'], built: ['safety', 'coffins'],
  cord: ['cord', 'rings'], buried: ['buried'], patents: ['22'], nobody: ['nobody', 'saved'], product: ['product', 'peace', 'mind'],
  fearW: ['fear'], sell: ['bell'] };
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
  ['yard', 0, L.fearW.s, 'none'],             // the graveyard, the coffin underground, the bell, the patents, the dawn
  ['feed', L.fearW.s, L.scale.s, 'cut'],      // the last frame becomes a post in a feed that flicks past ads listing features
  ['pitch', L.scale.s, C.end, 'cut'],         // "We scale businesses with ads like this. DM us the word teardown..."
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// key moments the scene and the sound both use
const K = {
  put: at('why', 3), bell: at('why', 5), grave: at('why', 8),
  aliveL: L.alive.s, inside: at('alive', 4), wasnt: at('alive', 5), dead: at('alive', 6),
  fearL: L.fear.s, n1800: at('fear', 2), people: at('fear', 4), terrified: at('fear', 6), buriedW: at('fear', 9), aliveW: at('fear', 10),
  builtL: L.built.s, builtW: at('built', 2), safety: at('built', 3), coffins: at('built', 4),
  cordL: L.cord.s, underground: at('cord', 2), pull: at('cord', 3), cordW: at('cord', 5), and: at('cord', 6), rings: at('cord', 9), above: at('cord', 10),
  buriedL: L.buried.s, inventor: at('buried', 1), buried2: at('buried', 4), prove: at('buried', 6), worked: at('buried', 8),
  patentsL: L.patents.s, filed: at('patents', 1), n22: at('patents', 4), patentsW: at('patents', 5),
  nobodyL: L.nobody.s, saved: at('nobody', 6), one: at('nobody', 8),
  productL: L.product.s, never: at('product', 3), productW: at('product', 5), peace: at('product', 6), mind: at('product', 8),
  fearL2: L.fearW.s, fear2: at('fearW', 2), sellL: L.sell.s, sell: at('sell', 0), bell4: at('sell', 3),
  s1: at('scale', 0), s2: at('scale', 3), d1: at('dm', 0), d2: at('dm', 4), d3: at('dm', 5), handle: +(L.dm.e + 0.05).toFixed(3),
};
// the camera: a new set-up on almost every line, hard cuts, each one moving [start, from-view, to-view]
const CUTS = [
  [0, 'g0', 'g1'], [K.bell - 0.04, 'bc0', 'bc1'], [K.aliveL, 'dive0', 'dive1'], [K.wasnt - 0.06, 'eyes0', 'eyes1'], [K.fearL, 'hill0', 'hill1'], [K.people - 0.05, 'lid0', 'lid1'],
  [K.buriedW - 0.05, 'dirt0', 'dirt1'], [K.builtL, 'asm0', 'asm1'], [K.safety - 0.05, 'tube0', 'tube1'], [K.cordL, 'wake0', 'wake1'], [K.pull - 0.1, 'hand0', 'hand1'],
  [K.and - 0.05, 'ring0', 'ring1'], [K.above - 0.04, 'lant0', 'lant1'], [K.buriedL, 'demo0', 'demo1'], [K.worked - 0.1, 'hat0', 'hat1'],
  [K.patentsL, 'pat0', 'pat1'], [K.nobodyL, 'all0', 'all1'], [K.saved - 0.05, 'quiet0', 'quiet1'], [K.productL, 'prod0', 'prod1'], [K.productW - 0.05, 'prodb0', 'prodb1'],
  [K.peace - 0.05, 'dawn0', 'dawn1'],
].map(([t, a, b]) => [+t.toFixed(3), a, b || a]);

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[K.bell - 0.04, K.bell + 0.14, 3], [K.dead - 0.03, K.dead + 0.14, 3], [K.buriedW - 0.05, K.buriedW + 0.2, 3],
  [K.rings - 0.03, K.rings + 0.14, 3], [K.worked - 0.1, K.worked + 0.25, 3], [K.peace - 0.05, K.peace + 0.15, 3],
  [T0.feed - 0.02, T0.feed + 0.6, 4], [K.fearL2, K.sell + 0.25, 5], [K.d1 - 0.02, K.d1 + 0.4, 4]];

// ---------- sound design (reel_whale_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
ev(0, 'night', 0.5, { d: K.fearL2 - 0.1 }); ev(0.25, 'bell', 0.42); ev(0.6, 'owl', 0.22);
ev(K.bell - 0.06, 'whoosh_soft', 0.26); ev(K.bell - 0.02, 'bell', 0.6);
ev(K.aliveL - 0.06, 'whoosh_c', 0.28); ev(K.aliveL, 'dig', 0.3); ev(K.dead - 0.03, 'heartbeat', 0.5); ev(K.dead + 0.4, 'heartbeat', 0.36);
ev(K.fearL - 0.05, 'whoosh_soft', 0.24); ev(K.n1800, 'stamp', 0.36); ev(K.people - 0.07, 'whoosh_soft', 0.2); ev(K.terrified - 0.06, 'whoosh_c', 0.26);
ev(K.terrified + 0.17, 'thump', 0.42);                                          // the lid lands
for (let i = 0; i < 3; i++) ev(K.terrified + 0.1 + 0.16 * i, 'nail', 0.32 + 0.04 * i, { pan: [-0.2, 0.2, 0][i] });
ev(K.buriedW - 0.06, 'whoosh_soft', 0.22); ev(K.buriedW, 'dirt', 0.5); ev(K.aliveW, 'dirt', 0.36);
ev(K.builtL - 0.05, 'whoosh_f', 0.26); [0, 0.14, 0.26].forEach((d, i) => ev(K.builtW + d, 'clank', 0.26 + 0.04 * i));
ev(K.safety - 0.06, 'whoosh_soft', 0.22); ev(K.coffins, 'select', 0.24);
ev(K.cordL - 0.05, 'whoosh_soft', 0.24); ev(K.underground, 'gasp', 0.34); ev(K.pull, 'rope', 0.4); ev(K.cordW, 'rope', 0.3);
ev(K.and - 0.06, 'whoosh_c', 0.3); ev(K.rings - 0.02, 'bell', 0.7); ev(K.rings + 0.45, 'bell', 0.5); ev(K.rings + 0.9, 'bell', 0.35);
ev(K.above - 0.04, 'whoosh_soft', 0.22); ev(K.above, 'footsteps', 0.3, { d: 0.6 });
ev(K.buriedL - 0.05, 'whoosh_soft', 0.24); for (let i = 0; i < 8; i++) ev(K.inventor + (K.prove - K.inventor) * i / 8, 'tick', 0.1 + 0.015 * i, { pan: 0.25 });
ev(K.prove, 'select', 0.24); ev(K.worked - 0.1, 'whoosh_f', 0.28); ev(K.worked, 'pop', 0.4); ev(K.worked + 0.05, 'ta', 0.34);
ev(K.patentsL - 0.05, 'whoosh_c', 0.26); for (let i = 0; i < 10; i++) ev(K.filed + (K.patentsW - K.filed) * i / 10, 'paper', 0.12 + 0.02 * i, { pan: (i % 3 - 1) * 0.3 });
ev(K.n22, 'stamp', 0.4);
ev(K.nobodyL - 0.05, 'whoosh_soft', 0.22); ev(K.nobodyL + 0.1, 'wind', 0.36, { d: 2.0 }); ev(K.saved - 0.05, 'whoosh_soft', 0.2); ev(K.one, 'thump', 0.28);
ev(K.productL - 0.05, 'whoosh_soft', 0.22); ev(K.productW, 'select', 0.22);
ev(K.peace - 0.08, 'riser', 0.18, { d: 0.2 }); ev(K.peace - 0.02, 'chime', 0.4); ev(K.peace + 0.05, 'birds', 0.3, { d: 1.2 }); ev(K.mind, 'bell_soft', 0.3);
ev(T0.feed - 0.03, 'deep', 0.36); ev(T0.feed, 'zoom_out', 0.2);
ev(K.fear2 - 0.4, 'swish', 0.3, { pan: 0.2 }); ev(K.fear2 - 0.04, 'swish', 0.26, { pan: -0.2 }); ev(K.fear2 + 0.32, 'swish', 0.24, { pan: 0.2 });
ev(K.sell, 'thump', 0.34); ev(K.bell4, 'bell_soft', 0.4); ev(K.bell4 + 0.1, 'like', 0.32);
ev(T0.pitch - 0.3, 'deep', 0.32); ev(T0.pitch - 0.2, 'whoosh_f', 0.22);
ev(K.d1 - 0.05, 'whoosh_soft', 0.28); ev(K.d2, 'hit', 0.34);
ev(K.handle, 'pop', 0.3);
// the score: a low, cold drone under the question; the groove from "In the 1800s", hushed for "Nobody is known to have
// been saved by one", warm for the dawn; lighter under the feed, and back for the pitch
const MUSIC = { start: K.fearL, hush: [K.nobodyL, K.productL - 0.05], dawn: K.peace, feed: T0.feed, pitch: T0.pitch, end: L.dm.s };
fs.writeFileSync(path.join(__dirname, 'reel_bell_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC, blur: BLUR }, null, 1));

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
const DEBUGCAM=${process.env.BELL_CAM || 'null'};  // BELL_CAM='[[x,y,z],[tx,ty,tz],fov]' holds the camera for checks
${fs.readFileSync(path.join(__dirname, 'reel_phone_kit.js'), 'utf8')}
const S={}, LIGHT={};
const imgsReady=window.ready; let threeDone; const threeReady=new Promise(r=>threeDone=r);
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','500 40px Body','600 40px Body','700 40px Body','40px Mono'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([imgsReady,fontsReady,threeReady]).then(()=>prepare());
</script>
<script type="module">
const X = await import(URL.createObjectURL(new Blob([${JSON.stringify(THREE_SRC)}], {type:'text/javascript'})));
await document.fonts.ready;
${fs.readFileSync(path.join(__dirname, 'reel_bell_scene.js'), 'utf8')}
threeDone();
</script></body></html>`;
  await render(html, { frames: FRAMES_DIR, out: OUT, end: C.end, flag, list, gl: true });
})();
