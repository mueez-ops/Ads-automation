// Mez Media reel: "Why would a bee sting you, if it kills her?" A Zack D. Films topic ("Why Bees Die After They Sting
// You", 115M views) made the way the armor, bell, equals, pump, Stanley and McFlurry reels were: a question hook with a
// bee diving at the camera on the first frame, the expressive female voice, a new camera set-up about every second (16 in
// the first 16), captions at the top built word by word, labels on leader lines, small print with sources; then the
// switch (the first ad tags who is interested, the next ads find them and sell: retargeting) and the pitch.
// Facts and sources: reel_bee_vo.py. Timing: reel_bee_cues.json. Writes reel_bee_events.json for the audio.
// Usage: node reel_bee.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, FONT_CSS } = require('./reel_kit');
const { FRAMES, renderScreens } = require('./phone_screens');

const [FRAMES_DIR, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_bee_cues.json'), 'utf8'));
const L = C.lines;
const words = C.words.map((w) => ({ ...w }));
const Wd = (line) => words.filter((w) => w.line === line);
const at = (line, i) => Wd(line)[i].s;

// ---------- captions: at the top, the phrase builds word by word ("+" rides with the word before it) ----------
const HL = { why: ['kills'], hive: ['hive'], barbs: ['barbs'], rip: ['rips'], pump: ['minute'], smell: ['bananas'], tags: ['tags'],
  ad: ['tags'], next: ['find', 'sell'] };
const SKIP = new Set(['scale', 'dm']);               // the pitch is its own big type
const MAXC = 22;
const CBRK = { why: [6], rip: [5], pump: [5], smell: [5, 7], tags: [4], ad: [7] }, RBRK = { why: [4], rip: [7], pump: [3], smell: [10] };   // new chunk / new row at these word indexes
const CH = [];
Object.keys(L).filter((line) => !SKIP.has(line)).forEach((line) => {
  let cur = null;
  const close = () => { if (cur) CH.push(cur); cur = null; };
  Wd(line).filter((w) => w.w !== '+').forEach((w, wi) => {
    if (cur && (CBRK[line] || []).includes(wi)) close();
    if (!cur) cur = { line, s: w.s, rows: [[]] };
    if ((RBRK[line] || []).includes(wi) && cur.rows[0].length) cur.rows.push([]);
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
  ['site', 0, L.ad.s, 'none'],                // the bee, the sting, the hive, the barbs, the tear, the pumping, the scent, the swarm
  ['feed', L.ad.s, L.scale.s, 'cut'],         // the first ad tags who is interested; the next ads find them and sell
  ['pitch', L.scale.s, C.end, 'cut'],         // "We scale businesses with ads like this. DM us the word teardown..."
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// key moments the scene and the sound both use
const K = {
  bee: at('why', 3), sting: at('why', 4), ifW: at('why', 6), kills: at('why', 8),
  hiveL: L.hive.s, defending: at('hive', 2), hiveW: at('hive', 4),
  barbsL: L.barbs.s, stinger: at('barbs', 1), barbs: at('barbs', 3), like: at('barbs', 4), harpoon: at('barbs', 6),
  ripL: L.rip.s, hooks: at('rip', 1), skin: at('rip', 4), andR: at('rip', 5), rips: at('rip', 6), body: at('rip', 10),
  pumpL: L.pump.s, pumping: at('pump', 3), venom: at('pump', 4), forW: at('pump', 5), minute: at('pump', 9),
  smellL: L.smell.s, smell: at('smell', 4), likeS: at('smell', 5), bananas: at('smell', 6), that: at('smell', 7), marks: at('smell', 8), hiveS: at('smell', 12),
  tagsL: L.tags.s, sting2: at('tags', 1), tags: at('tags', 2), the2: at('tags', 4), rest: at('tags', 8),
  adL: L.ad.s, first: at('ad', 1), sell1: at('ad', 6), itA: at('ad', 7), tags2: at('ad', 8), interested: at('ad', 10),
  nextL: L.next.s, next: at('next', 2), find: at('next', 4), andN: at('next', 6), sell2: at('next', 7),
  s1: at('scale', 0), s2: at('scale', 3), d1: at('dm', 0), d2: at('dm', 4), d3: at('dm', 5), handle: +(L.dm.e + 0.05).toFixed(3),
};
// the camera: a new set-up on almost every line, hard cuts, each one moving [start, from-view, to-view]
const CUTS = [
  [0, 'dive0', 'dive1'], [K.sting - 0.05, 'land0', 'land1'], [K.ifW - 0.05, 'stab0', 'stab1'], [K.hiveL, 'hive0', 'hive1'],
  [K.hiveW - 0.07, 'comb0', 'comb1'], [K.barbsL, 'stinger0', 'stinger1'], [K.like - 0.05, 'harpoon0', 'harpoon1'], [K.ripL, 'section0', 'section1'],
  [K.andR - 0.05, 'tear0', 'tear1'], [K.pumpL, 'pump0', 'pump1'], [K.forW - 0.05, 'timer0', 'timer1'], [K.smellL, 'scent0', 'scent1'],
  [K.likeS - 0.05, 'banana0', 'banana1'], [K.that - 0.05, 'mark0', 'mark1'], [K.tagsL, 'swarm0', 'swarm1'], [K.the2 - 0.05, 'attack0', 'attack1'],
].map(([t, a, b]) => [+t.toFixed(3), a, b || a]);

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[0, 0.5, 3], [K.kills - 0.1, K.kills + 0.12, 3], [K.rips - 0.05, K.rips + 0.25, 3], [K.tagsL - 0.02, K.tagsL + 0.5, 3],
  [T0.feed - 0.02, T0.feed + 0.6, 4], [K.d1 - 0.02, K.d1 + 0.4, 4]];

// ---------- sound design (reel_bee_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
ev(0, 'buzz', 0.5, { d: K.hiveL - 0.1 }); ev(K.sting - 0.06, 'whoosh_soft', 0.18); ev(K.ifW - 0.06, 'whoosh_c', 0.2); ev(K.kills - 0.05, 'stab', 0.5);
ev(K.hiveL - 0.05, 'whoosh_soft', 0.22); ev(K.hiveL, 'hivehum', 0.32, { d: K.barbsL - K.hiveL }); ev(K.hiveW - 0.08, 'whoosh_soft', 0.18);
ev(K.barbsL - 0.05, 'whoosh_c', 0.24); ev(K.barbs, 'glint', 0.5); ev(K.like - 0.06, 'whoosh_soft', 0.18); ev(K.harpoon, 'thunk', 0.4);
ev(K.ripL - 0.05, 'whoosh_soft', 0.2); ev(K.hooks + 0.05, 'hook', 0.35); ev(K.andR - 0.06, 'whoosh_c', 0.2); ev(K.rips, 'rip', 0.5);
ev(K.pumpL - 0.05, 'whoosh_soft', 0.2); ev(K.pumpL + 0.1, 'pulse', 0.4, { d: K.smellL - K.pumpL - 0.15 }); ev(K.forW - 0.06, 'whoosh_soft', 0.16); for (let i = 0; i < 8; i++) ev(K.forW + 0.1 * i, 'tick', 0.26);
ev(K.smellL - 0.05, 'whoosh_soft', 0.2); ev(K.smell, 'puff', 0.36); ev(K.likeS - 0.06, 'whoosh_c', 0.2); ev(K.bananas, 'pop', 0.3); ev(K.that - 0.06, 'whoosh_soft', 0.18); ev(K.marks, 'lock', 0.36);
ev(K.tagsL - 0.04, 'whoosh_f', 0.26); ev(K.tagsL, 'swarm', 0.5, { d: T0.feed - K.tagsL + 0.2 }); ev(K.tags, 'hit', 0.26); ev(K.the2 - 0.06, 'whoosh_c', 0.22);
ev(T0.feed - 0.03, 'deep', 0.36); ev(T0.feed, 'zoom_out', 0.2); ev(K.adL + 0.42, 'swish', 0.28, { pan: 0.2 }); for (let i = 0; i < 6; i++) ev(K.tags2 + 0.09 * i, 'tag', 0.22 + 0.03 * i, { pan: -0.4 + 0.16 * i });
ev(K.nextL - 0.04, 'swish', 0.26, { pan: -0.2 }); ev(K.find, 'lock', 0.3); ev(K.sell2, 'cash', 0.42); ev(K.sell2 + 0.12, 'check', 0.3);
ev(T0.pitch - 0.3, 'deep', 0.32); ev(T0.pitch - 0.2, 'whoosh_f', 0.22);
ev(K.d1 - 0.05, 'whoosh_soft', 0.28); ev(K.d2, 'hit', 0.34);
ev(K.handle, 'pop', 0.3);
// the score: a low drone under the question; the groove from "Because she's defending the hive!", a breath under the
// pumping, a warm lift on "One sting tags you"; lighter under the feed, and back for the pitch
const MUSIC = { start: K.hiveL, hush: [K.pumpL - 0.05, K.smellL - 0.02], dawn: K.tagsL, feed: T0.feed, pitch: T0.pitch, end: L.dm.s };
fs.writeFileSync(path.join(__dirname, 'reel_bee_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC, blur: BLUR }, null, 1));

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
const DEBUGCAM=${process.env.BEE_CAM || 'null'};  // BEE_CAM='[[x,y,z],[tx,ty,tz],fov]' holds the camera for checks
${fs.readFileSync(path.join(__dirname, 'reel_phone_kit.js'), 'utf8')}
const S={}, LIGHT={};
const imgsReady=window.ready; let threeDone; const threeReady=new Promise(r=>threeDone=r);
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','500 40px Body','600 40px Body','700 40px Body','40px Mono','italic 40px Serif'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([imgsReady,fontsReady,threeReady]).then(()=>prepare());
</script>
<script type="module">
const X = await import(URL.createObjectURL(new Blob([${JSON.stringify(THREE_SRC)}], {type:'text/javascript'})));
await document.fonts.ready;
${fs.readFileSync(path.join(__dirname, 'reel_bee_scene.js'), 'utf8')}
threeDone();
</script></body></html>`;
  await render(html, { frames: FRAMES_DIR, out: OUT, end: C.end, flag, list, gl: true });
})();
