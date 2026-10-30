// Mez Media reel: "Why would anyone shoot a brand new suit of armor?" One of Zack D. Films' most watched topics
// ("Could Ancient Armor Stop Bullets?", 157M views) with our angle: the proof mark as the first ad. Fast: a new camera
// angle every second or so (20 set-ups in the first 19.5 seconds), slow motion only where a ball is in the air; the
// Face ID reel's captions (top, built word by word), labels on leader lines and small print with sources; then the
// switch (a feed that scrolls past promises and stops on proof) and the pitch.
// Facts and sources: reel_armor_vo.py. Timing: reel_armor_cues.json. Writes reel_armor_events.json for the audio.
// Usage: node reel_armor.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, FONT_CSS } = require('./reel_kit');
const { FRAMES, renderScreens } = require('./phone_screens');

const [FRAMES_DIR, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_armor_cues.json'), 'utf8'));
const L = C.lines;
const words = C.words.map((w) => ({ ...w }));
const Wd = (line) => words.filter((w) => w.line === line);
const at = (line, i) => Wd(line)[i].s;

// ---------- captions: at the top, the phrase builds word by word ----------
const HL = { why: ['shoot'], sell: ['sell'], guns: ['punch', 'steel'], thicker: ['thicker', 'heavier'], kilos: ['39', 'kilos'],
  really: ['really'], shot: ['shot'], passed: ['dented', 'passed'], stayed: ['purpose'], mark: ['proof', 'mark'],
  spotless: ['spotless'], nothing: ['nothing'], same: ['same'], scroll: ['promises'], stop: ['proof'] };
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

// ---------- the edit: the 3D world, then the feed, then the pitch ----------
const SHOTS = [
  ['armor', 0, L.same.s, 'none'],             // the shot, the plate, the weight, the proof, the mark, the spotless suit
  ['feed', L.same.s, L.scale.s, 'cut'],       // the last frame becomes an ad in a feed that scrolls past promises
  ['pitch', L.scale.s, C.end, 'cut'],         // "We scale businesses with ads like this. DM us the word teardown..."
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// key moments the scene and the sound both use
const K = {
  shoot: at('why', 3), brand: at('why', 5), suitW: at('why', 7), hit1: at('why', 9),
  sellL: L.sell.s, sell: at('sell', 1),
  guns: L.guns.s, musket: at('guns', 2), punch: at('guns', 5), through: at('guns', 7), steel: at('guns', 8),
  thick: L.thicker.s, thicker: at('thicker', 3), heavier: at('thicker', 5),
  kilos: L.kilos.s, n39: at('kilos', 3), kg: at('kilos', 4),
  really: L.really.s, reallyW: at('really', 3), ballW: at('really', 6),
  shotL: L.shot.s, armorer: at('shot', 2), fire: at('shot', 6),
  passedL: L.passed.s, only: at('passed', 3), hit2: at('passed', 4), passed: at('passed', 7),
  stayedL: L.stayed.s, dentW: at('stayed', 2), stayed: at('stayed', 3), purpose: at('stayed', 6),
  mark: L.mark.s, proof: at('mark', 1), markW: at('mark', 2),
  spot: L.spotless.s, spotless: at('spotless', 1), suit2: at('spotless', 2),
  noth: L.nothing.s, nothing: at('nothing', 2),
  same: L.same.s, customers: at('same', 1), sameW: at('same', 4),
  scroll: L.scroll.s, scrollW: at('scroll', 1), promises: at('scroll', 3),
  stopL: L.stop.s, stopW: at('stop', 1), proofW: at('stop', 3),
  s1: at('scale', 0), s2: at('scale', 3), d1: at('dm', 0), d2: at('dm', 4), d3: at('dm', 5), handle: +(L.dm.e + 0.05).toFixed(3),
};
// the camera: a new set-up on almost every line, hard cuts, each one moving [start, from-view, to-view]
const CUTS = [
  [0, 'gun0', 'gun1'], [K.shoot, 'muz0', 'muz1'], [K.brand - 0.02, 'fly1'], [K.hit1, 'hit0', 'hit1'], [K.sellL, 'sell0', 'sell1'],
  [K.guns, 'orbit'], [K.punch - 0.08, 'ex0', 'ex1'], [K.thick, 'boom0', 'boom1'], [K.heavier - 0.12, 'low0', 'low1'],
  [K.kilos, 'hero0', 'hero1'], [K.really, 'aim0', 'aim1'], [K.shotL, 'ots0', 'ots1'], [K.fire + 0.08, 'fly2'],
  [K.hit2, 'hit2', 'hit3'], [K.passed - 0.2, 'pass0', 'pass1'], [K.stayedL, 'mac0', 'mac1'], [K.purpose - 0.12, 'pull0', 'pull1'],
  [K.mark, 'orb0', 'orb1'], [K.spot, 'two0', 'two1'], [K.noth, 'both0', 'both1'],
].map(([t, a, b]) => [+t.toFixed(3), a, b || a]);
// the two shots in slow motion: [fired, hit]
const FLIGHT = [[K.shoot, K.hit1], [K.fire, K.hit2]];

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[K.shoot - 0.02, K.shoot + 0.16, 3], [K.hit1 - 0.03, K.hit1 + 0.14, 3], [K.punch - 0.04, K.punch + 0.22, 3],
  [K.heavier - 0.05, K.heavier + 0.5, 3], [K.n39 - 0.03, K.n39 + 0.12, 3], [K.fire - 0.02, K.fire + 0.16, 3],
  [K.hit2 - 0.03, K.hit2 + 0.14, 3], [K.purpose - 0.12, K.purpose + 0.3, 3],
  [T0.feed - 0.02, T0.feed + 0.6, 4], [K.scrollW - 0.05, K.stopW + 0.25, 5], [K.d1 - 0.02, K.d1 + 0.4, 4]];

// ---------- sound design (reel_armor_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
ev(0, 'riser', 0.16, { d: K.shoot });
ev(K.shoot - 0.01, 'musket', 0.62); ev(K.shoot + 0.02, 'deep', 0.4);
ev(K.brand - 0.04, 'slowmo', 0.34); ev(K.brand, 'whiz', 0.3, { d: K.hit1 - K.brand, pan: -0.3 });
ev(K.hit1 - 0.01, 'ping', 0.62); ev(K.hit1, 'hit', 0.36); ev(K.hit1 + 0.05, 'sparkle', 0.18);
ev(K.sell - 0.03, 'stamp', 0.4); ev(K.sell + 0.02, 'cash', 0.42);
ev(K.guns - 0.04, 'whoosh_c', 0.3, { pan: 0.3 }); ev(K.musket - 0.1, 'whiz', 0.24, { d: K.punch - K.musket + 0.1, pan: 0.3 });
ev(K.punch - 0.07, 'whoosh_f', 0.26); ev(K.punch - 0.01, 'tear', 0.55); ev(K.punch, 'hit', 0.3); ev(K.steel, 'select', 0.18);
ev(K.thick - 0.05, 'whoosh_soft', 0.28); ev(K.thicker - 0.03, 'pop', 0.22);
[0, 0.11, 0.2, 0.28, 0.35].forEach((d, i) => ev(K.heavier + d, 'clank', 0.36 + 0.03 * i, { pan: [-0.35, 0.35, -0.2, 0.2, 0][i] }));
ev(K.kilos - 0.05, 'whoosh_c', 0.26); for (let i = 0; i < 8; i++) ev(K.kilos + 0.1 + (K.n39 - K.kilos - 0.15) * i / 8, 'tick', 0.1 + 0.015 * i, { pan: 0.25 });
ev(K.n39 - 0.01, 'thud', 0.55); ev(K.n39, 'deep', 0.42);
ev(K.really - 0.05, 'whoosh_soft', 0.26); ev(K.reallyW, 'scan', 0.2); ev(K.ballW, 'lock', 0.3);
ev(K.shotL - 0.04, 'whoosh_c', 0.28, { pan: -0.3 }); ev(K.armorer, 'click', 0.3); ev(K.fire - 0.01, 'musket', 0.62); ev(K.fire + 0.02, 'deep', 0.4);
ev(K.fire + 0.1, 'slowmo', 0.34); ev(K.fire + 0.12, 'whiz', 0.3, { d: K.hit2 - K.fire - 0.12, pan: 0.3 });
ev(K.hit2 - 0.01, 'ping', 0.66); ev(K.hit2, 'hit', 0.38); ev(K.hit2 + 0.4, 'drop', 0.28);
ev(K.passed - 0.25, 'whoosh_soft', 0.24); ev(K.passed + 0.02, 'stamp', 0.44); ev(K.passed + 0.06, 'ding', 0.3);
ev(K.stayedL - 0.04, 'whoosh_soft', 0.24); ev(K.stayed, 'shimmer', 0.22); ev(K.purpose - 0.12, 'whoosh_f', 0.3); ev(K.purpose, 'sparkle', 0.3);
ev(K.mark - 0.04, 'whoosh_soft', 0.22); ev(K.proof, 'select', 0.26);
ev(K.spot - 0.05, 'whoosh_c', 0.26, { pan: 0.3 }); ev(K.spotless, 'pop', 0.26);
ev(K.nothing - 0.02, 'buzz', 0.3); ev(K.nothing, 'thump', 0.34);
ev(T0.feed - 0.03, 'deep', 0.38); ev(T0.feed, 'zoom_out', 0.2); ev(K.sameW, 'pop', 0.2);
ev(K.scrollW - 0.05, 'swish', 0.3, { pan: 0.2 }); ev(K.promises - 0.1, 'swish', 0.26, { pan: -0.2 }); ev(K.promises + 0.18, 'swish', 0.22, { pan: 0.2 });
ev(K.stopW, 'thump', 0.34); ev(K.proofW, 'like', 0.36);
ev(T0.pitch - 0.3, 'deep', 0.32); ev(T0.pitch - 0.2, 'whoosh_f', 0.22);
ev(K.d1 - 0.05, 'whoosh_soft', 0.28); ev(K.d2, 'hit', 0.34);
ev(K.handle, 'pop', 0.3);
// the score: a held drone under the hook that drops out for the first shot; the groove from "To sell it", filtered down
// while each ball is in the air; a hush for "A spotless suit? It proved nothing."; a lift for the switch and the pitch
const MUSIC = { start: K.sellL, slow1: [K.brand, K.hit1], slow2: [K.fire + 0.1, K.hit2], hush: [K.spot, K.same - 0.05],
  feed: T0.feed, pitch: T0.pitch, end: L.dm.s };
fs.writeFileSync(path.join(__dirname, 'reel_armor_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC, blur: BLUR }, null, 1));

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
const LN=${JSON.stringify(L)}, CUTS=${JSON.stringify(CUTS)}, FLIGHT=${JSON.stringify(FLIGHT)}, FPS=30;
const DEBUGCAM=${process.env.ARMOR_CAM || 'null'};  // ARMOR_CAM='[[x,y,z],[tx,ty,tz],fov]' holds the camera for checks
${fs.readFileSync(path.join(__dirname, 'reel_phone_kit.js'), 'utf8')}
const S={}, LIGHT={};
const imgsReady=window.ready; let threeDone; const threeReady=new Promise(r=>threeDone=r);
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','500 40px Body','600 40px Body','700 40px Body','40px Mono'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([imgsReady,fontsReady,threeReady]).then(()=>prepare());
</script>
<script type="module">
const X = await import(URL.createObjectURL(new Blob([${JSON.stringify(THREE_SRC)}], {type:'text/javascript'})));
await document.fonts.ready;
${fs.readFileSync(path.join(__dirname, 'reel_armor_scene.js'), 'utf8')}
threeDone();
</script></body></html>`;
  await render(html, { frames: FRAMES_DIR, out: OUT, end: C.end, flag, list, gl: true });
})();
