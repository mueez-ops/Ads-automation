// Mez Media reel: "Why would anyone drill a tiny hole in a gas nozzle?" One of Zack D. Films' most watched topics ("How
// Gas Pumps Know When To Stop", 87M views) made the way the armor, whale, bell and equals reels were: a question hook
// with a pump's dollars racing on the first frame, the expressive female voice, a new camera set-up about every 1.3
// seconds (13 in the first 15), captions at the top built word by word, labels on leader lines, small print with
// sources; then the switch (an ad whose spend keeps pumping after it stops working, until someone knows when to stop)
// and the pitch.
// Facts and sources: reel_pump_vo.py. Timing: reel_pump_cues.json. Writes reel_pump_events.json for the audio.
// Usage: node reel_pump.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, FONT_CSS } = require('./reel_kit');
const { FRAMES, renderScreens } = require('./phone_screens');

const [FRAMES_DIR, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_pump_cues.json'), 'utf8'));
const L = C.lines;
const words = C.words.map((w) => ({ ...w }));
const Wd = (line) => words.filter((w) => w.line === line);
const at = (line, i) => Wd(line)[i].s;

// ---------- captions: at the top, the phrase builds word by word ("+" rides with the word before it) ----------
const HL = { why: ['tiny', 'hole'], stop: ['stop'], rush: ['sucks', 'air'], full: ['full', 'covers'], noair: ['air'],
  snap: ['diaphragm', 'shut'], just: ['hole'], need: ['hole'], or: ['money', 'working'], know: ['stop'] };
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
  ['site', 0, L.need.s, 'none'],              // the forecourt, the pump, the car, the nozzle in X-ray
  ['feed', L.need.s, L.scale.s, 'cut'],       // the last frame becomes a post; then an ad whose spend keeps pumping
  ['pitch', L.scale.s, C.end, 'cut'],         // "We scale businesses with ads like this. DM us the word teardown..."
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// key moments the scene and the sound both use
const K = {
  drill: at('why', 3), tiny: at('why', 5), hole1: at('why', 6), gas: at('why', 9), nozzle: at('why', 10),
  stopL: L.stop.s, pump: at('stop', 2), stop1: at('stop', 6),
  rushL: L.rush.s, rushes: at('rush', 2), sucks: at('rush', 5), air1: at('rush', 6), hole2: at('rush', 10),
  fullL: L.full.s, full: at('full', 4), covers: at('full', 7), hole3: at('full', 9),
  noairL: L.noair.s, air2: at('noair', 2),
  snapL: L.snap.s, yanks: at('snap', 2), diaphragm: at('snap', 5), valve: at('snap', 8), snaps: at('snap', 9), shut: at('snap', 10),
  justL: L.just.s, sensors: at('just', 1), electronics: at('just', 3), hole4: at('just', 6),
  needL: L.need.s, hole5: at('need', 4), orL: L.or.s, pumping: at('or', 3), money: at('or', 4), working: at('or', 7),
  knowL: L.know.s, stop2: at('know', 3),
  s1: at('scale', 0), s2: at('scale', 3), d1: at('dm', 0), d2: at('dm', 4), d3: at('dm', 5), handle: +(L.dm.e + 0.05).toFixed(3),
};
// the camera: a new set-up on almost every line, hard cuts, each one moving [start, from-view, to-view]
const CUTS = [
  [0, 'disp0', 'disp1'], [K.tiny - 0.05, 'tip0', 'tip1'], [K.stopL, 'trig0', 'trig1'], [K.stop1 - 0.05, 'dstop0', 'dstop1'],
  [K.rushL, 'xr0', 'xr1'], [K.sucks - 0.05, 'port0', 'port1'], [K.fullL, 'tank0', 'tank1'], [K.covers - 0.05, 'neck0', 'neck1'],
  [K.noairL, 'tube0', 'tube1'], [K.snapL, 'dia0', 'dia1'], [K.valve - 0.05, 'valve0', 'valve1'], [K.justL, 'wide0', 'wide1'],
  [K.hole4 - 0.05, 'hero0', 'hero1'],
].map(([t, a, b]) => [+t.toFixed(3), a, b || a]);

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[K.tiny - 0.05, K.tiny + 0.14, 3], [K.stop1 - 0.03, K.stop1 + 0.14, 3], [K.snaps - 0.03, K.snaps + 0.16, 3],
  [K.justL - 0.02, K.justL + 0.14, 3], [T0.feed - 0.02, T0.feed + 0.6, 4], [K.stop2 - 0.03, K.stop2 + 0.16, 3], [K.d1 - 0.02, K.d1 + 0.4, 4]];

// ---------- sound design (reel_pump_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
ev(0, 'night', 0.3, { d: T0.feed - 0.1 }); ev(0, 'flow', 0.36, { d: K.stop1 - 0.02 }); ev(0, 'counter', 0.26, { d: K.stop1 - 0.02 });
ev(K.tiny - 0.06, 'whoosh_soft', 0.24); ev(K.hole1, 'ping', 0.3);
ev(K.stopL - 0.05, 'whoosh_soft', 0.22); ev(K.stop1 - 0.02, 'click', 0.6); ev(K.stop1 + 0.02, 'beep', 0.24);
ev(K.rushL - 0.06, 'whoosh_c', 0.26); ev(K.rushL, 'flow', 0.42, { d: K.shut - K.rushL }); ev(K.sucks - 0.05, 'hiss', 0.34, { d: K.air2 - K.sucks + 0.1 });
ev(K.fullL - 0.05, 'whoosh_soft', 0.22); ev(K.full, 'glug', 0.36); ev(K.covers - 0.05, 'whoosh_soft', 0.2); ev(K.covers, 'glug', 0.3);
ev(K.noairL - 0.05, 'whoosh_soft', 0.2); ev(K.air2 + 0.05, 'suck', 0.34);
ev(K.snapL - 0.05, 'whoosh_c', 0.24); ev(K.yanks, 'thunk', 0.4); ev(K.valve - 0.06, 'whoosh_soft', 0.22); ev(K.snaps, 'click', 0.7); ev(K.snaps + 0.03, 'spring', 0.36); ev(K.shut, 'thump', 0.3);
ev(K.justL - 0.05, 'whoosh_f', 0.26); ev(K.sensors, 'buzz', 0.22); ev(K.electronics, 'buzz', 0.24); ev(K.hole4 - 0.04, 'whoosh_soft', 0.22); ev(K.hole4, 'chime', 0.4);
ev(T0.feed - 0.03, 'deep', 0.36); ev(T0.feed, 'zoom_out', 0.2); ev(K.orL - 0.15, 'swish', 0.3, { pan: 0.2 });
ev(K.pumping - 0.1, 'counter', 0.3, { d: K.stop2 - K.pumping + 0.08 }); ev(K.stop2 - 0.02, 'click', 0.7); ev(K.stop2 + 0.02, 'beep', 0.26);
ev(T0.pitch - 0.3, 'deep', 0.32); ev(T0.pitch - 0.2, 'whoosh_f', 0.22);
ev(K.d1 - 0.05, 'whoosh_soft', 0.28); ev(K.d2, 'hit', 0.34);
ev(K.handle, 'pop', 0.3);
// the score: a low drone under the question; the groove from "As gas rushes through", a breath on "No more air", a warm
// lift on "Just a hole"; lighter under the feed, and back for the pitch
const MUSIC = { start: K.rushL, hush: [K.noairL - 0.05, K.snapL - 0.02], dawn: K.hole4, feed: T0.feed, pitch: T0.pitch, end: L.dm.s };
fs.writeFileSync(path.join(__dirname, 'reel_pump_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC, blur: BLUR }, null, 1));

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
const DEBUGCAM=${process.env.PUMP_CAM || 'null'};  // PUMP_CAM='[[x,y,z],[tx,ty,tz],fov]' holds the camera for checks
${fs.readFileSync(path.join(__dirname, 'reel_phone_kit.js'), 'utf8')}
const S={}, LIGHT={};
const imgsReady=window.ready; let threeDone; const threeReady=new Promise(r=>threeDone=r);
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','500 40px Body','600 40px Body','700 40px Body','40px Mono','italic 40px Serif'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([imgsReady,fontsReady,threeReady]).then(()=>prepare());
</script>
<script type="module">
const X = await import(URL.createObjectURL(new Blob([${JSON.stringify(THREE_SRC)}], {type:'text/javascript'})));
await document.fonts.ready;
${fs.readFileSync(path.join(__dirname, 'reel_pump_scene.js'), 'utf8')}
threeDone();
</script></body></html>`;
  await render(html, { frames: FRAMES_DIR, out: OUT, end: C.end, flag, list, gl: true });
})();
