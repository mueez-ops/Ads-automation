// Mez Media reel: "Half of you won't notice a stranger swapped mid-chat. Not even the voice." The 1998 door study at
// Cornell: a man with a map asks a pedestrian for directions, two men carry a door between them, and behind it one of
// the carriers takes his place; 8 of 15 pedestrians kept giving directions, and most only noticed the door was rude.
// Built the way the Mosquito (2,400 views), tickle and blink reels were: a claim aimed at the viewer with a number in it
// (hookscore.py 88.0 STRONG), the whole hook card on screen from the first frame, and a first frame already in motion
// (the door sliding between them). The expressive female voice, a new camera set-up about every second, captions at
// the top, labels on leader lines, small print with sources. Then the switch (your viewers miss changes too: a new
// button colour, a new font; so stop testing tweaks and swap the first three seconds) and the pitch.
// Facts and sources: reel_door_vo.py. Timing: reel_door_cues.json. Writes reel_door_events.json for the audio.
// Usage: node reel_door.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, FONT_CSS } = require('./reel_kit');
const { FRAMES, renderScreens } = require('./phone_screens');

const [FRAMES_DIR, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_door_cues.json'), 'utf8'));
const L = C.lines;
const words = C.words.map((w) => ({ ...w }));
const Wd = (line) => words.filter((w) => w.line === line);
const at = (line, i) => Wd(line)[i].s;

// ---------- captions: at the top, the phrase builds word by word; numbers are spoken as words and shown as digits ----------
const SHOW = [['door', 'ten', '10'], ['eight', 'eight', '8'], ['eight', 'fifteen', '15'], ['swap', 'three', '3']];
const capWords = words.map((w) => ({ ...w }));
SHOW.forEach(([line, spoken, shown]) => {
  const ws = spoken.split(' '), i = capWords.findIndex((w, k) => w.line === line && ws.every((s, j) => (capWords[k + j] || {}).w === s));
  capWords.splice(i, ws.length, { w: shown, s: capWords[i].s, e: capWords[i + ws.length - 1].e, line });
});
const CW = (line) => capWords.filter((w) => w.line === line);
const HL = { half: ['swapped'], voice: ['voice'], map: ['map'], door: ['door'], place: ['place'], new: ['clothes', 'voice'], eight: ['8'], rude: ['rude'],
  viewers: ['viewers'], btn: ['colour'], font: ['font'], see: ['see'], swap: ['swap'] };
const SKIP = new Set(['scale', 'dm']);               // the pitch is its own big type
const MAXC = 22;
// new chunk / new row at these word indexes (after the SHOW merges)
const CBRK = { map: [7], door: [6], place: [7], swap: [4] }, RBRK = { map: [5, 9], door: [3, 8], place: [3], new: [2], eight: [3], rude: [3], viewers: [2], swap: [6] };
const CH = [];
// the hook is one card, all of it on screen from the first frame (dim until each word is said)
const hk = (ws) => ws.map((w) => ({ w: w.w, s: w.s, e: w.e, hl: (HL[w.line] || []).includes(w.w) }));
CH.push({ line: 'half', s: 0, hook: true, size: 66, rows: [hk(CW('half').slice(0, 3)), hk(CW('half').slice(3, 7)), hk(CW('half').slice(7)), hk(CW('voice'))] });
CH[0].rows[0][0].s = -0.1;
Object.keys(L).filter((line) => !SKIP.has(line) && line !== 'half' && line !== 'voice').forEach((line) => {
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
  ['site', 0, L.viewers.s, 'none'],           // the campus path, the door, the swap, the line-up, the directions, the rude door
  ['feed', L.viewers.s, L.scale.s, 'cut'],    // your viewers miss changes too: a new button colour, a new font; swap the first 3 seconds
  ['pitch', L.scale.s, C.end, 'cut'],         // "We scale businesses with ads like this. DM us the word teardown..."
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// key moments the scene and the sound both use
const K = {
  half: at('half', 0), notice: at('half', 4), stranger: at('half', 6), swapped: at('half', 7), midchat: at('half', 8),
  not: at('voice', 0), voice: at('voice', 3),
  mapL: L.map.s, man: at('map', 1), map: at('map', 4), asked: at('map', 5), strangers: at('map', 6), cornell: at('map', 8), directions: at('map', 10),
  doorL: L.door.s, ten: at('door', 0), two: at('door', 3), carried: at('door', 5), doorW: at('door', 7), between: at('door', 8),
  placeL: L.place.s, behind: at('place', 1), one: at('place', 3), carriers: at('place', 6), took: at('place', 7), placeW: at('place', 9),
  newL: L.new.s, clothes: at('new', 1), new2: at('new', 2), voice2: at('new', 3),
  eightL: L.eight.s, eightW: at('eight', 0), fifteen: at('eight', 2), kept: at('eight', 3), giving: at('eight', 4),
  rudeL: L.rude.s, noticed: at('rude', 2), door2: at('rude', 4), rudeW: at('rude', 6),
  viewersL: L.viewers.s, viewersW: at('viewers', 1), miss: at('viewers', 2), changes: at('viewers', 3),
  btnL: L.btn.s, button: at('btn', 1), colour: at('btn', 2), fontL: L.font.s, fontW: at('font', 1), seeL: L.see.s, seeW: at('see', 2),
  swapL: L.swap.s, stop: at('swap', 1), tweaks: at('swap', 3), swapW: at('swap', 5), first: at('swap', 7), three: at('swap', 8), seconds2: at('swap', 9),
  s1: at('scale', 0), s2: at('scale', 3), d1: at('dm', 0), d2: at('dm', 4), d3: at('dm', 5), handle: +(L.dm.e + 0.05).toFixed(3),
};
// the camera: a new set-up about every second, hard cuts, each one moving [start, from-view, to-view]
const CUTS = [
  [0, 'pass0', 'pass1'], [K.swapped - 0.08, 'rev0', 'rev1'], [K.not - 0.06, 'vox0', 'vox1'], [K.mapL, 'app0', 'app1'], [K.asked - 0.06, 'mapc0', 'mapc1'],
  [K.doorL, 'side0', 'side1'], [K.carried - 0.06, 'pov0', 'pov1'], [K.behind - 0.06, 'top0', 'top1'], [K.took - 0.06, 'back0', 'back1'],
  [K.newL, 'line0', 'line1'], [K.eightW - 0.06, 'dir0', 'dir1'], [K.rudeL, 'rude0', 'rude1'],
].map(([t, a, b]) => [+t.toFixed(3), a, b || a]);
// story time (seconds into the meeting) for each moment of the edit: the hook is the swap itself, then a rewind
// (a pair of points 1 ms apart is a cut: the next shot starts at a new story time, sometimes slightly earlier, to show the swap again)
const STORYT = [[0, 11.45], [L.voice.e, 13.6], [K.mapL, 0], [L.map.e, 2.7], [K.doorL, 9.6], [K.carried - 0.061, 11.2], [K.carried - 0.06, 11.75],
  [K.behind - 0.061, 12.05], [K.behind - 0.06, 11.7], [K.took - 0.061, 12.3], [K.took - 0.06, 12.2], [L.place.e, 12.7], [K.newL, 12.7],
  [K.eightW - 0.06, 13.2], [K.rudeL, 13.7], [L.rude.e + 0.2, 14.7]].map(([a, b]) => [+a.toFixed(3), b]);

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[0, 0.45, 3], [K.mapL - 0.02, K.mapL + 0.3, 3], [K.carried - 0.08, K.carried + 0.6, 3], [T0.feed - 0.02, T0.feed + 0.6, 4], [K.swapW - 0.05, K.swapW + 0.5, 4], [K.d1 - 0.02, K.d1 + 0.4, 4]];

// ---------- sound design (reel_door_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
ev(0, 'campus', 0.3, { d: L.rude.e + 0.3 }); ev(0, 'steps', 0.22, { d: 1.6, pan: -0.3 }); ev(0.05, 'woosh_door', 0.34); ev(K.swapped - 0.05, 'tick', 0.2); ev(K.swapped + 0.02, 'swap', 0.3);
ev(K.not - 0.08, 'whoosh_soft', 0.2); ev(K.voice - 0.05, 'blip2', 0.24);
ev(K.mapL - 0.12, 'rewind', 0.34); ev(K.mapL + 0.15, 'steps', 0.26, { d: 1.9 }); ev(K.cornell, 'select', 0.24); ev(K.asked - 0.08, 'whoosh_soft', 0.18); ev(K.map - 0.05, 'paper', 0.3);
ev(K.doorL - 0.06, 'whoosh_c', 0.2); for (let i = 0; i < 3; i++) ev(K.ten + 0.08 * i, 'tick', 0.16); ev(K.two, 'steps', 0.28, { d: 2.4, pan: -0.4 });
ev(K.carried - 0.08, 'woosh_door', 0.38); ev(K.behind - 0.08, 'whoosh_soft', 0.2); ev(K.one, 'paper', 0.24); ev(K.took - 0.08, 'whoosh_c', 0.2); ev(K.placeW - 0.05, 'swap', 0.32);
ev(K.newL - 0.06, 'whoosh_f', 0.22); ev(K.clothes, 'pop', 0.24); ev(K.voice2 - 0.02, 'blip2', 0.28);
ev(K.eightW - 0.08, 'whoosh_soft', 0.2); for (let i = 0; i < 8; i++) ev(K.eightW + 0.05 * i, 'pip', 0.15); ev(K.kept, 'chat', 0.2, { d: 1.6 });
ev(K.rudeL - 0.06, 'whoosh_c', 0.2); ev(K.door2 - 0.05, 'thunk', 0.3); ev(K.rudeW - 0.03, 'huff', 0.3);
ev(T0.feed - 0.03, 'deep', 0.34); ev(T0.feed, 'zoom_out', 0.2);
ev(K.button - 0.05, 'click', 0.3); ev(K.colour - 0.05, 'flip', 0.26); ev(K.fontW - 0.08, 'click', 0.28); ev(K.fontW - 0.02, 'flip', 0.24); ev(K.seeW - 0.05, 'flat', 0.26);
ev(K.stop - 0.04, 'scratch', 0.3); ev(K.tweaks, 'scratch', 0.24);
ev(K.swapW - 0.12, 'woosh_door', 0.4); ev(K.swapW + 0.25, 'swap', 0.32); ev(K.three, 'hit', 0.3); ev(K.seconds2 + 0.1, 'sparkle', 0.24);
ev(T0.pitch - 0.3, 'deep', 0.32); ev(T0.pitch - 0.2, 'whoosh_f', 0.22);
ev(K.d1 - 0.05, 'whoosh_soft', 0.28); ev(K.d2, 'hit', 0.34);
ev(K.handle, 'pop', 0.3);
// the score: a jaunty walk under the hook and the meeting, a stop on the swap, the groove from "Ten seconds in", lighter
// under the feed, a lift on "swap the first three seconds", back for the pitch
const MUSIC = { start: K.doorL, stop: [K.swapped - 0.04, K.swapped + 0.35], feed: T0.feed, lift: K.swapW, pitch: T0.pitch, end: L.dm.s };
fs.writeFileSync(path.join(__dirname, 'reel_door_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC, blur: BLUR }, null, 1));

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
const LN=${JSON.stringify(L)}, CUTS=${JSON.stringify(CUTS)}, STORYT=${JSON.stringify(STORYT)}, FPS=30;
const DEBUGCAM=${process.env.DOOR_CAM || 'null'};  // DOOR_CAM='[[x,y,z],[tx,ty,tz],fov]' holds the camera for checks
${fs.readFileSync(path.join(__dirname, 'reel_phone_kit.js'), 'utf8')}
const S={}, LIGHT={};
const imgsReady=window.ready; let threeDone; const threeReady=new Promise(r=>threeDone=r);
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','500 40px Body','600 40px Body','700 40px Body','40px Mono','italic 40px Serif'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([imgsReady,fontsReady,threeReady]).then(()=>prepare());
</script>
<script type="module">
const X = await import(URL.createObjectURL(new Blob([${JSON.stringify(THREE_SRC)}], {type:'text/javascript'})));
await document.fonts.ready;
${fs.readFileSync(path.join(__dirname, 'reel_door_scene.js'), 'utf8')}
threeDone();
</script></body></html>`;
  await render(html, { frames: FRAMES_DIR, out: OUT, end: C.end, flag, list, gl: true });
})();
