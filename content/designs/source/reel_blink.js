// Mez Media reel: "Every 3 seconds your eyes shut. You've never seen it. Not once." Your brain dims your vision just
// before each blink, so you never notice the dark; in Tokyo, 14 people watching the same comedy blinked together at
// its dull bits and barely blinked during the action. Built the way the Mosquito reel (2,400 views) and the tickle reel
// were: a claim aimed at the viewer with a number in it (hookscore.py 93.8 STRONG), the whole hook card on screen from
// the first frame, and a first frame already in motion (a giant eye mid-blink, a phone glowing in it). The expressive
// female voice, a new camera set-up about every second, captions at the top, labels on leader lines, small print with
// sources. Then the switch (your ad gets watched the same way: logo spinning in, blink; slow product pan, blink; so cut
// the seconds they'd blink through) and the pitch.
// Facts and sources: reel_blink_vo.py. Timing: reel_blink_cues.json. Writes reel_blink_events.json for the audio.
// Usage: node reel_blink.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, FONT_CSS } = require('./reel_kit');
const { FRAMES, renderScreens } = require('./phone_screens');

const [FRAMES_DIR, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_blink_cues.json'), 'utf8'));
const L = C.lines;
const words = C.words.map((w) => ({ ...w }));
const Wd = (line) => words.filter((w) => w.line === line);
const at = (line, i) => Wd(line)[i].s;

// ---------- captions: at the top, the phrase builds word by word; numbers are spoken as words and shown as digits ----------
const SHOW = [['every', 'three', '3'], ['dims', 'fifty', '50'], ['tokyo', 'fourteen', '14'], ['tokyo', 'mister bean', 'Mr. Bean']];
const capWords = words.map((w) => ({ ...w }));
SHOW.forEach(([line, spoken, shown]) => {
  const ws = spoken.split(' '), i = capWords.findIndex((w, k) => w.line === line && ws.every((s, j) => (capWords[k + j] || {}).w === s));
  capWords.splice(i, ws.length, { w: shown, s: capWords[i].s, e: capWords[i + ws.length - 1].e, line });
});
const CW = (line) => capWords.filter((w) => w.line === line);
const HL = { every: ['shut'], never: ['never'], dims: ['50'], dark: ['dark'], tokyo: ['14'], lined: ['lined'], action: ['action'], ad: ['ad'],
  logo: ['blink'], cut: ['cut'] };
const SKIP = new Set(['scale', 'dm']);               // the pitch is its own big type
const MAXC = 22;
// new chunk / new row at these word indexes (after the SHOW merges)
const CBRK = { dims: [5], tokyo: [6], lined: [8], logo: [4] }, RBRK = { dims: [3, 9], dark: [3], tokyo: [3, 9], lined: [4, 11], action: [3], ad: [4], logo: [3, 7], cut: [4] };
const CH = [];
// the hook is one card, all of it on screen from the first frame (dim until each word is said)
const hk = (ws) => ws.map((w) => ({ w: w.w, s: w.s, e: w.e, hl: (HL[w.line] || []).includes(w.w) }));
CH.push({ line: 'every', s: 0, hook: true, size: 66, rows: [hk(CW('every').slice(0, 3)), hk(CW('every').slice(3)), hk(CW('never').slice(0, 4)), hk(CW('never').slice(4))] });
CH[0].rows[0][0].s = -0.1;
Object.keys(L).filter((line) => !SKIP.has(line) && line !== 'every' && line !== 'never').forEach((line) => {
  let cur = null;
  const close = () => { if (cur) CH.push(cur); cur = null; };
  CW(line).forEach((w, wi) => {
    if (cur && (CBRK[line] || []).includes(wi)) close();
    if (!cur) cur = { line, s: w.s, rows: [[]] };
    if ((RBRK[line] || []).includes(wi) && cur.rows[cur.rows.length - 1].length) cur.rows.push([]);
    let row = cur.rows[cur.rows.length - 1];
    const len = row.reduce((n, q) => n + q.w.length + 1, 0) + w.w.length;
    if (row.length && len > MAXC) { if (cur.rows.length === 2) { close(); cur = { line, s: w.s, rows: [[]] }; } else cur.rows.push([]); row = cur.rows[cur.rows.length - 1]; }
    row.push({ w: w.w, s: w.s, e: w.e, hl: (HL[line] || []).includes(w.w.toLowerCase()) || (HL[line] || []).includes(w.w) });
  });
  close();
});
CH.forEach((c, i) => {
  const nx = CH[i + 1], last = c.rows.flat().slice(-1)[0].e;
  c.e = +Math.min(nx ? nx.s : C.end, nx && nx.line === c.line ? nx.s : last + 0.4, L.scale.s).toFixed(3);   // gone when the pitch starts
});

// ---------- the edit: the 3D world, then the feed, then the pitch ----------
const SHOTS = [
  ['site', 0, L.ad.s, 'none'],                // the eye, the bed, the x-ray, the 2009 lab in Tokyo and its 14 viewers
  ['feed', L.ad.s, L.scale.s, 'cut'],         // your ad gets watched the same way: logo spinning in, blink; slow pan, blink; cut them
  ['pitch', L.scale.s, C.end, 'cut'],         // "We scale businesses with ads like this. DM us the word teardown..."
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// key moments the scene and the sound both use
const K = {
  every: at('every', 0), three: at('every', 1), seconds: at('every', 2), eyes: at('every', 4), shut: at('every', 5),
  neverL: L.never.s, never: at('never', 1), seen: at('never', 2), not: at('never', 4), once: at('never', 5),
  dimsL: L.dims.s, brain: at('dims', 1), dims: at('dims', 2), vision: at('dims', 4), up: at('dims', 5), fifty: at('dims', 7), ms: at('dims', 8),
  before: at('dims', 9), every2: at('dims', 10), blink: at('dims', 11),
  darkL: L.dark.s, never2: at('dark', 2), notice: at('dark', 3), dark: at('dark', 5),
  tokyoL: L.tokyo.s, tokyo: at('tokyo', 1), scientists: at('tokyo', 2), tracked: at('tokyo', 3), blinks: at('tokyo', 5), fourteen: at('tokyo', 7),
  people: at('tokyo', 8), watching: at('tokyo', 9), bean: at('tokyo', 11),
  linedL: L.lined.s, lined: at('lined', 2), dull: at('lined', 6), bits: at('lined', 7), empty: at('lined', 9), street: at('lined', 10), parked: at('lined', 12), car: at('lined', 13),
  actionL: L.action.s, action: at('action', 2), barely: at('action', 4), blinked: at('action', 5),
  adL: L.ad.s, ad: at('ad', 1), watched: at('ad', 3), way: at('ad', 6),
  logoL: L.logo.s, logo: at('logo', 0), spinning: at('logo', 1), blinkA: at('logo', 3), slow: at('logo', 4), pan: at('logo', 6), blinkB: at('logo', 7),
  cutL: L.cut.s, cut: at('cut', 1), seconds2: at('cut', 3), blink3: at('cut', 5), through: at('cut', 6),
  s1: at('scale', 0), s2: at('scale', 3), d1: at('dm', 0), d2: at('dm', 4), d3: at('dm', 5), handle: +(L.dm.e + 0.05).toFixed(3),
};
// the camera: a new set-up about every second, hard cuts, each one moving [start, from-view, to-view]
const CUTS = [
  [0, 'eye0', 'eye1'], [K.neverL - 0.03, 'bed0', 'bed1'], [K.not - 0.06, 'pov0', 'pov1'], [K.dimsL, 'xr0', 'xr1'], [K.up - 0.05, 'graph0', 'graph1'],
  [K.before - 0.06, 'eyeb0', 'eyeb1'], [K.darkL, 'rows0', 'rows1'], [K.tokyoL, 'lab0', 'lab1'], [K.scientists - 0.05, 'face0', 'face1'],
  [K.fourteen - 0.1, 'grid0', 'grid1'], [K.watching - 0.06, 'ots0', 'ots1'], [K.linedL, 'raster0', 'raster1'], [K.dull - 0.06, 'gridb0', 'gridb1'],
  [K.empty - 0.08, 'mon0', 'mon1'], [K.parked - 0.08, 'monb0', 'monb1'], [K.actionL, 'act0', 'act1'], [K.barely - 0.06, 'monc0', 'monc1'],
].map(([t, a, b]) => [+t.toFixed(3), a, b || a]);

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[K.neverL - 0.03, K.neverL + 0.2, 3], [K.tokyoL - 0.02, K.tokyoL + 0.25, 3], [T0.feed - 0.02, T0.feed + 0.6, 4], [K.cut - 0.02, K.cut + 0.35, 3], [K.d1 - 0.02, K.d1 + 0.4, 4]];

// ---------- sound design (reel_blink_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
ev(0, 'night', 0.26, { d: K.tokyoL }); ev(0.0, 'lid', 0.3); ev(K.three - 0.05, 'tick', 0.16); ev(K.shut - 0.04, 'lid', 0.34); ev(K.shut + 0.02, 'thud', 0.26);
ev(K.neverL - 0.06, 'whoosh_soft', 0.2); ev(K.neverL, 'scroll', 0.22, { d: 1.5 }); ev(K.seen, 'lid', 0.2); ev(K.not - 0.08, 'whoosh_c', 0.18); ev(K.once, 'tap', 0.24);
ev(K.dimsL - 0.05, 'whoosh_c', 0.22); ev(K.dimsL, 'xray', 0.28); ev(K.dims, 'dim', 0.3); ev(K.up - 0.08, 'whoosh_soft', 0.18); ev(K.fifty, 'select', 0.24);
for (let i = 0; i < 5; i++) ev(K.ms + 0.06 * i, 'tick', 0.12 + 0.02 * i);
ev(K.before - 0.08, 'whoosh_f', 0.2); ev(K.blink - 0.03, 'lid', 0.36); ev(K.blink + 0.03, 'thud', 0.24);
ev(K.darkL - 0.05, 'whoosh_soft', 0.2); ev(K.dark - 0.02, 'snip', 0.3);
ev(K.tokyoL - 0.06, 'deep', 0.28); ev(K.tokyoL - 0.02, 'whoosh_f', 0.22); ev(K.tokyoL, 'lab', 0.24, { d: T0.feed - K.tokyoL }); ev(K.tokyo + 0.1, 'select', 0.24);
ev(K.scientists - 0.08, 'whoosh_soft', 0.18); ev(K.scientists + 0.08, 'beep', 0.22); ev(K.blinks, 'blip', 0.3);
ev(K.fourteen - 0.12, 'whoosh_c', 0.2); for (let i = 0; i < 14; i++) ev(K.fourteen + 0.025 * i, 'pip', 0.13);
ev(K.watching - 0.08, 'whoosh_soft', 0.18); ev(K.watching, 'tv', 0.18, { d: K.linedL - K.watching + 0.1 });
ev(K.linedL - 0.05, 'whoosh_soft', 0.2); for (let i = 0; i < 6; i++) ev(K.lined - 0.25 + 0.07 * i, 'tick', 0.12); ev(K.lined + 0.12, 'snap_in', 0.32);
ev(K.dull - 0.08, 'whoosh_c', 0.18); ev(K.bits, 'lids14', 0.32); ev(K.empty - 0.1, 'whoosh_soft', 0.18); ev(K.street, 'lids14', 0.3);
ev(K.parked - 0.1, 'whoosh_soft', 0.18); ev(K.car, 'lids14', 0.3);
ev(K.actionL - 0.06, 'whoosh_f', 0.22); ev(K.action, 'boing', 0.26); ev(K.action + 0.35, 'boing', 0.2, { pan: 0.3 }); ev(K.barely - 0.08, 'whoosh_c', 0.18); ev(K.barely + 0.2, 'boing', 0.18, { pan: -0.3 });
ev(T0.feed - 0.03, 'deep', 0.34); ev(T0.feed, 'zoom_out', 0.2);
ev(K.logo - 0.08, 'swish', 0.24); ev(K.spinning, 'spin', 0.26); ev(K.blinkA - 0.13, 'lid', 0.26); ev(K.blinkA - 0.06, 'thud', 0.24);
ev(K.slow - 0.06, 'swish', 0.22); ev(K.slow, 'pan', 0.2, { d: K.blinkB - K.slow }); ev(K.blinkB - 0.13, 'lid', 0.26); ev(K.blinkB - 0.06, 'thud', 0.24);
ev(K.cut - 0.06, 'snip', 0.34); ev(K.seconds2, 'snip', 0.3); ev(K.through - 0.05, 'snap_in', 0.3); ev(K.through + 0.15, 'pop', 0.24);
ev(T0.pitch - 0.3, 'deep', 0.32); ev(T0.pitch - 0.2, 'whoosh_f', 0.22);
ev(K.d1 - 0.05, 'whoosh_soft', 0.28); ev(K.d2, 'hit', 0.34);
ev(K.handle, 'pop', 0.3);
// the score: a soft pulse under the hook, the groove from "In Tokyo", a breath under "During the action" (everyone
// watching), lighter under the feed with a stop on each "Blink.", back for the pitch
const MUSIC = { start: K.tokyoL, hush: [K.actionL - 0.05, K.adL - 0.05], feed: T0.feed, stops: [[K.blinkA - 0.04, K.blinkA + 0.3], [K.blinkB - 0.04, K.blinkB + 0.3]], pitch: T0.pitch, end: L.dm.s };
fs.writeFileSync(path.join(__dirname, 'reel_blink_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC, blur: BLUR }, null, 1));

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
const DEBUGCAM=${process.env.BLINK_CAM || 'null'};  // BLINK_CAM='[[x,y,z],[tx,ty,tz],fov]' holds the camera for checks
${fs.readFileSync(path.join(__dirname, 'reel_phone_kit.js'), 'utf8')}
const S={}, LIGHT={};
const imgsReady=window.ready; let threeDone; const threeReady=new Promise(r=>threeDone=r);
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','500 40px Body','600 40px Body','700 40px Body','40px Mono','italic 40px Serif'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([imgsReady,fontsReady,threeReady]).then(()=>prepare());
</script>
<script type="module">
const X = await import(URL.createObjectURL(new Blob([${JSON.stringify(THREE_SRC)}], {type:'text/javascript'})));
await document.fonts.ready;
${fs.readFileSync(path.join(__dirname, 'reel_blink_scene.js'), 'utf8')}
threeDone();
</script></body></html>`;
  await render(html, { frames: FRAMES_DIR, out: OUT, end: C.end, flag, list, gl: true });
})();
