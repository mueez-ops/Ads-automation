// Mez Media reel: "Why would anyone push a hot dog into a saw blade?" One of Zack D. Films' most watched topics
// ("Saws That Stop For Fingers", 120M views) made in our Face ID reel's format (a hook that moves the voice up and
// down, the mechanism one picture per line on one continuous 3D camera, captions at the top that build word by word,
// labels on leader lines, small print with sources, then the tension and the switch), with a different angle: it
// opens on the hot dog test, shows the stop in slow motion with a clock, what the stop costs the saw, and ends on the
// inventor being told "safety doesn't sell" and starting his own saw company.
// Facts and sources: reel_saw_vo.py. Timing: reel_saw_cues.json. Writes reel_saw_events.json for reel_saw_audio.py.
// Usage: node reel_saw.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, FONT_CSS } = require('./reel_kit');
const { FRAMES, renderScreens } = require('./phone_screens');

const [FRAMES_DIR, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_saw_cues.json'), 'utf8'));
const L = C.lines;
const words = C.words.map((w) => ({ ...w }));
const Wd = (line) => words.filter((w) => w.line === line);
const at = (line, i) => Wd(line)[i].s;
const NUM = +Wd('watched')[6].w;                      // the seconds said on the switch (the real time at that word)

// ---------- captions: at the top, the phrase builds word by word ----------
const HL = { why: ['blade'], salty: ['salty', 'finger'], stops: ['stops'], signal: ['signal'], wood: ['wood', 'skin', 'tooth'],
  brake: ['brake'], stop: ['5', 'milliseconds'], blink: ['blink'], nick: ['nick'], cost: ['single-use', 'ruined'],
  offered: ['companies'], sell: ['safety', 'sell'], own: ['own'], watched: ['seconds'] };
const SKIP = new Set(['scale', 'dm']);               // the pitch is its own big type
const MAXC = 22;
const CH = [];
Object.keys(L).filter((line) => !SKIP.has(line)).forEach((line) => {
  let cur = null;
  const close = () => { if (cur) CH.push(cur); cur = null; };
  Wd(line).forEach((w) => {
    if (!cur) cur = { line, s: w.s, rows: [[]] };
    let row = cur.rows[cur.rows.length - 1];
    const len = row.reduce((n, q) => n + q.w.length + 1, 0) + w.w.length;
    if (row.length && len > MAXC) { if (cur.rows.length === 2) { close(); cur = { line, s: w.s, rows: [[]] }; } else cur.rows.push([]); row = cur.rows[cur.rows.length - 1]; }
    row.push({ w: w.w, s: w.s, e: w.e, hl: (HL[line] || []).includes(w.w.toLowerCase()) });
  });
  close();
});
CH[0].s = 0; CH[0].rows[0][0].s = -0.1;              // the first word is on the first frame
CH.forEach((c, i) => {
  const nx = CH[i + 1], last = c.rows.flat().slice(-1)[0].e;
  c.e = +Math.min(nx ? nx.s : C.end, nx && nx.line === c.line ? nx.s : last + 0.4).toFixed(3);
});

// ---------- the edit: one 3D world, then the switch ----------
const TENSE = +(L.own.e + 0.08).toFixed(3);
const SHOTS = [
  ['saw', 0, TENSE, 'none'],                  // the saw, the hot dog, X-ray, slow motion, the cost, the factories
  ['tense', TENSE, L.watched.s, 'none'],      // the colour drains, a heartbeat, a clock
  ['phone', L.watched.s, L.scale.s, 'cut'],   // the reel shrinks into a phone; 0:34; then it is your ad
  ['pitch', L.scale.s, C.end, 'cut'],         // "We scale businesses with ads like this. DM us the word teardown..."
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// key moments the scene and the sound both use
const K = {
  hot: at('why', 5), sawW: at('why', 9), bladeW: at('why', 10),
  salty: L.salty.s, saltyW: at('salty', 4), wet: at('salty', 6), finger: at('salty', 9),
  stops: L.stops.s, stopsW: at('stops', 3), take: at('stops', 7),
  signal: L.signal.s, tiny: at('signal', 4), signalW: at('signal', 6),
  wood: L.wood.s, woodW: at('wood', 1), barely: at('wood', 2), skin: at('wood', 6), conducts: at('wood', 7), instant: at('wood', 11),
  touch: at('wood', 13), tooth: at('wood', 15), changes: at('wood', 17),
  brake: L.brake.s, spring: at('brake', 1), fires: at('brake', 2), alum: at('brake', 4), into: at('brake', 6), teeth: at('brake', 8),
  stop: L.stop.s, dead: at('stop', 3), five: at('stop', 6), drops: at('stop', 9), table: at('stop', 12),
  blink: L.blink.s, blinkW: at('blink', 3),
  nick: L.nick.s, nickW: at('nick', 5),
  cost: L.cost.s, costs: at('cost', 2), brakeC: at('cost', 6), single: at('cost', 8), bladeC: at('cost', 11), ruined: at('cost', 13),
  offered: L.offered.s, offeredW: at('offered', 2), big: at('offered', 6), companies: at('offered', 8),
  sell: L.sell.s, told: at('sell', 3), safety: at('sell', 5), sellW: at('sell', 7),
  own: L.own.s, started: at('own', 2), ownW: at('own', 4), company: at('own', 6),
  tense: TENSE, freeze: +(TENSE - 0.1).toFixed(3), watched: at('watched', 2), num34: at('watched', 6), ad: at('imagine', 2),
  s1: at('scale', 0), s2: at('scale', 3), d1: at('dm', 0), d2: at('dm', 4), d3: at('dm', 5), handle: +(L.dm.e + 0.05).toFixed(3),
};
const BEATS = [0, 1].map((i) => +(TENSE + 0.1 + i * 0.4).toFixed(3));   // the heartbeat under the tension

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[K.stops - 0.08, K.stops + 0.55, 4], [K.signal - 0.1, K.signal + 0.45, 3], [K.instant - 0.1, K.instant + 0.35, 3],
  [K.brake - 0.12, K.brake + 0.3, 3], [K.blink - 0.08, K.blink + 0.3, 3], [K.nick - 0.08, K.nick + 0.3, 3], [K.cost - 0.14, K.cost + 0.14, 6], [K.costs - 0.05, K.costs + 0.5, 3],
  [K.offeredW - 0.05, K.companies + 0.1, 4], [K.started - 0.1, K.ownW + 0.2, 3],
  [T0.phone - 0.02, T0.phone + 0.65, 6], [K.d1 - 0.02, K.d1 + 0.4, 4]];

// ---------- sound design (reel_saw_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
ev(K.hot - 0.05, 'pop', 0.16);
ev(K.finger - 0.02, 'thump', 0.42);                   // the music stops dead under "finger"
ev(K.stops - 0.06, 'whoosh_c', 0.32, { pan: -0.2 }); ev(K.stopsW, 'select', 0.22);
ev(K.signal - 0.05, 'whoosh_soft', 0.26); ev(K.tiny, 'zap', 0.2); ev(K.signalW, 'scan', 0.24);
ev(K.barely, 'select', 0.16); ev(K.skin, 'pop', 0.2); ev(K.conducts, 'zap', 0.22);
ev(K.instant - 0.06, 'whoosh_c', 0.26, { pan: 0.2 });
ev(K.touch, 'slowmo', 0.42); ev(K.touch + 0.02, 'deep', 0.4); ev(K.changes, 'glitch', 0.24);
ev(K.spring, 'spring', 0.32); ev(K.fires, 'whoosh_f', 0.26, { pan: -0.2 });
ev(K.into - 0.02, 'clang', 0.55); ev(K.into, 'hit', 0.32);
ev(K.dead, 'thump', 0.4); ev(K.five, 'select', 0.22);
ev(K.drops, 'whoosh_soft', 0.3); ev(K.table, 'thud', 0.45);
ev(K.blink - 0.05, 'swish', 0.26); ev(K.blinkW, 'select', 0.2);
ev(K.nick - 0.05, 'whoosh_soft', 0.22); ev(K.nickW, 'pop', 0.3); ev(K.nickW + 0.08, 'sparkle', 0.2);
ev(K.cost - 0.1, 'whoosh_c', 0.3); ev(K.brakeC, 'pop', 0.2); ev(K.single, 'stamp', 0.42); ev(K.ruined, 'stamp', 0.36);
ev(K.offeredW - 0.05, 'whoosh_f', 0.36, { pan: 0.2 }); ev(K.companies, 'pop', 0.24);
[K.told, K.told + 0.16, K.told + 0.32].forEach((t, i) => ev(t, 'stamp', 0.34 + 0.03 * i, { pan: [-0.3, 0.3, -0.15][i] }));
ev(K.safety - 0.06, 'deep', 0.36); ev(K.sellW, 'thump', 0.4);
ev(K.started - 0.05, 'riser', 0.18, { d: K.ownW - K.started + 0.05 }); ev(K.ownW, 'hit', 0.36);
for (let i = 0; i < 5; i++) ev(K.ownW + 0.18 + 0.12 * i, 'tick', 0.08 + 0.01 * i, { pan: -0.3 + 0.15 * i });
ev(K.company, 'sparkle', 0.22);
ev(K.tense, 'riser', 0.2, { d: T0.phone - K.tense }); BEATS.forEach((t) => { ev(t, 'thump', 0.4); ev(t + 0.17, 'thump', 0.24); });
for (let t = K.tense + 0.05; t < T0.phone - 0.1; t += 0.25) ev(t, 'tick', 0.14, { pan: 0.35 });
ev(T0.phone - 0.03, 'deep', 0.45); ev(T0.phone, 'hit', 0.45); ev(T0.phone - 0.05, 'zoom_out', 0.18);
for (let i = 1; i <= NUM; i++) { const t = K.watched + (K.num34 - K.watched) * i / NUM; if (t > at('watched', 3)) ev(t, 'tick', 0.06 + 0.002 * i, { pan: 0.2 }); }
ev(K.num34, 'select', 0.3);
ev(K.ad, 'pop', 0.3); ev(K.ad + 0.08, 'swish', 0.24, { pan: 0.3 });
ev(T0.pitch - 0.3, 'deep', 0.32); ev(T0.pitch - 0.2, 'whoosh_f', 0.22);
ev(K.d1 - 0.05, 'whoosh_soft', 0.28); ev(K.d2, 'hit', 0.34);
ev(K.handle, 'pop', 0.3);
// the saw itself: running from the first frame, cutting wood, then slowed to a crawl at the touch and braked
const SAWSND = { run0: 0, cut0: 0, touch: K.touch, into: K.into, dead: K.dead };   // cutting from the first frame
// the score: a low pulse under the hook that stops dead on "finger"; a rise under "And this saw stops"; the groove
// under the mechanism, filtered right down while time is slowed; a hush under "safety doesn't sell"; a lift for his own
// company; a riser, a heartbeat and a clock under the tension; a low drone on the switch; the groove for the pitch
const MUSIC = { gap1: K.finger, how: L.stops.s, groove: L.signal.s, slow0: K.touch, slow1: K.table + 0.1, hush0: K.safety - 0.15, hush1: L.sell.e + 0.1,
  tense: K.tense, phone: T0.phone, drop: L.imagine.s, last: T0.pitch, end: L.dm.s };
fs.writeFileSync(path.join(__dirname, 'reel_saw_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC, saw: SAWSND, blur: BLUR }, null, 1));

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
const LN=${JSON.stringify(L)}, BEATS=${JSON.stringify(BEATS)}, NUM=${NUM}, FPS=30;
const DEBUGCAM=${process.env.SAW_CAM || 'null'};  // SAW_CAM='[[x,y,z],[tx,ty,tz],fov]' holds the camera for checks
${fs.readFileSync(path.join(__dirname, 'reel_phone_kit.js'), 'utf8')}
const S={}, LIGHT={};
const imgsReady=window.ready; let threeDone; const threeReady=new Promise(r=>threeDone=r);
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','500 40px Body','600 40px Body','700 40px Body','40px Mono'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([imgsReady,fontsReady,threeReady]).then(()=>prepare());
</script>
<script type="module">
const X = await import(URL.createObjectURL(new Blob([${JSON.stringify(THREE_SRC)}], {type:'text/javascript'})));
await document.fonts.ready;
${fs.readFileSync(path.join(__dirname, 'reel_saw_scene.js'), 'utf8')}
threeDone();
</script></body></html>`;
  await render(html, { frames: FRAMES_DIR, out: OUT, end: C.end, flag, list, gl: true });
})();
