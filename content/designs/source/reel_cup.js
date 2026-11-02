// Mez Media reel: "Why would a company buy a stranger a brand new car?" One of Zack D. Films' most watched topics
// ("Stanley Cup Saves Life", 82M views) made the way the armor, whale, bell, equals and pump reels were: a question hook
// with a car on fire on the first frame, the expressive female voice, a new camera set-up about every 1.4 seconds (11
// in the first 15), captions at the top built word by word, labels on leader lines, small print with sources; then
// the switch (a customer's video becomes the ad: sponsored, with money behind it) and the pitch.
// Facts and sources: reel_cup_vo.py. Timing: reel_cup_cues.json. Writes reel_cup_events.json for the audio.
// Usage: node reel_cup.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, FONT_CSS } = require('./reel_kit');
const { FRAMES, renderScreens } = require('./phone_screens');

const [FRAMES_DIR, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_cup_cues.json'), 'utf8'));
const L = C.lines;
const words = C.words.map((w) => ({ ...w }));
const Wd = (line) => words.filter((w) => w.line === line);
const at = (line, i) => Wd(line)[i].s;

// ---------- captions: at the top, the phrase builds word by word ("+" rides with the word before it) ----------
const HL = { why: ['brand', 'new', 'car'], cup: ['fire'], shell: ['shell'], fine: ['fine'], ice: ['ice'], views: ['millions'],
  reply: ['replace'], did: ['did'], made: ['customer'], find: ['proof', 'money'] };
const SKIP = new Set(['scale', 'dm']);               // the pitch is its own big type
const MAXC = 22;
const CBRK = { why: [7], reply: [3], made: [5], find: [4] }, RBRK = { shell: [3] };   // new chunk / new row at these word indexes
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
  ['site', 0, L.made.s, 'none'],              // the car on fire, the burnt shell, the cup, the ice, the views, the new car
  ['feed', L.made.s, L.scale.s, 'cut'],       // a customer's video becomes the ad: sponsored, with money behind it
  ['pitch', L.scale.s, C.end, 'cut'],         // "We scale businesses with ads like this. DM us the word teardown..."
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// key moments the scene and the sound both use
const K = {
  company: at('why', 3), stranger: at('why', 6), brand: at('why', 8), car1: at('why', 10),
  cupL: L.cup.s, cupW: at('cup', 2), survived: at('cup', 3), fire: at('cup', 5),
  shellL: L.shell.s, burned: at('shell', 2), shellW: at('shell', 5),
  fineL: L.fine.s, cupholder: at('fine', 3), stanley: at('fine', 5), fineW: at('fine', 8),
  iceL: L.ice.s, ice: at('ice', 4),
  viewsL: L.views.s, millions: at('views', 5), viewsW: at('views', 7),
  replyL: L.reply.s, president: at('reply', 1), replied: at('reply', 2), replace: at('reply', 4), car2: at('reply', 6),
  didL: L.did.s, did: at('did', 2),
  madeL: L.made.s, ad: at('made', 4), customer: at('made', 6), findL: L.find.s, proof: at('find', 3), money: at('find', 6), behind: at('find', 7),
  s1: at('scale', 0), s2: at('scale', 3), d1: at('dm', 0), d2: at('dm', 4), d3: at('dm', 5), handle: +(L.dm.e + 0.05).toFixed(3),
};
// the camera: a new set-up on almost every line, hard cuts, each one moving [start, from-view, to-view]
const CUTS = [
  [0, 'fire0', 'fire1'], [K.stranger - 0.05, 'flame0', 'flame1'], [K.brand - 0.05, 'side0', 'side1'], [K.cupL, 'inside0', 'inside1'], [K.fire - 0.06, 'blast0', 'blast1'],
  [K.shellL, 'shell0', 'shell1'], [K.fineL, 'console0', 'console1'], [K.stanley - 0.05, 'hero0', 'hero1'], [K.iceL, 'ice0', 'ice1'], [K.viewsL, 'views0', 'views1'],
  [K.replyL, 'suv0', 'suv1'], [K.replied - 0.05, 'suvb0', 'suvb1'], [K.replace - 0.05, 'bow0', 'bow1'], [K.didL, 'keys0', 'keys1'],
].map(([t, a, b]) => [+t.toFixed(3), a, b || a]);

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[K.cupL - 0.03, K.cupL + 0.14, 3], [K.shellL - 0.03, K.shellL + 0.14, 3], [K.ice - 0.03, K.ice + 0.2, 3],
  [K.replyL - 0.02, K.replyL + 0.5, 3], [K.did - 0.03, K.did + 0.16, 3], [T0.feed - 0.02, T0.feed + 0.6, 4], [K.findL - 0.25, K.findL + 0.05, 4], [K.d1 - 0.02, K.d1 + 0.4, 4]];

// ---------- sound design (reel_cup_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
ev(0, 'blaze', 0.9, { d: K.shellL + 0.2 }); ev(0.3, 'pop', 0.16); ev(1.4, 'pop', 0.14); ev(K.stranger - 0.06, 'whoosh_soft', 0.22); ev(K.brand - 0.06, 'whoosh_soft', 0.18);
ev(K.cupL - 0.06, 'whoosh_c', 0.28); ev(K.fire - 0.07, 'whoosh_c', 0.2); ev(K.fire, 'whoomp', 0.5);
ev(K.shellL - 0.05, 'whoosh_soft', 0.22); ev(K.shellL, 'sizzle', 0.34, { d: K.fineL - K.shellL + 0.6 });
ev(K.fineL - 0.05, 'whoosh_soft', 0.2); ev(K.stanley - 0.06, 'whoosh_c', 0.24); ev(K.fineW, 'ding', 0.4);
ev(K.iceL - 0.05, 'whoosh_soft', 0.22); ev(K.ice - 0.02, 'rattle', 0.5); ev(K.ice + 0.35, 'rattle', 0.3);
ev(K.viewsL - 0.05, 'whoosh_f', 0.24); for (let i = 0; i < 10; i++) ev(K.viewsL + 0.2 + 1.5 * Math.pow(i / 10, 0.7), 'notif', 0.2 + 0.025 * i, { pan: (i % 2 ? 0.25 : -0.25) });
ev(K.replyL - 0.05, 'whoosh_soft', 0.22); ev(K.replyL, 'engine', 0.3, { d: K.replace - K.replyL + 0.4 }); ev(K.replied - 0.06, 'whoosh_soft', 0.18); ev(K.replace - 0.05, 'whoosh_c', 0.24); ev(K.replied + 0.42, 'chirp', 0.22); ev(K.replied + 0.66, 'chirp', 0.2);
ev(K.did - 0.04, 'ta', 0.4); ev(K.did, 'confetti', 0.36);
ev(T0.feed - 0.03, 'deep', 0.36); ev(T0.feed, 'zoom_out', 0.2); ev(K.ad + 0.1, 'swish', 0.3, { pan: 0.2 });
ev(K.proof, 'select', 0.3); for (let i = 0; i < 6; i++) ev(K.money + 0.08 * i, 'coin', 0.2 + 0.03 * i, { pan: (i % 2 ? 0.2 : -0.2) });
ev(T0.pitch - 0.3, 'deep', 0.32); ev(T0.pitch - 0.2, 'whoosh_f', 0.22);
ev(K.d1 - 0.05, 'whoosh_soft', 0.28); ev(K.d2, 'hit', 0.34);
ev(K.handle, 'pop', 0.3);
// the score: a low drone under the fire; the groove from "Her car burned to a shell", a breath on "And there was still
// ice inside", a warm lift on "And they did"; lighter under the feed, and back for the pitch
const MUSIC = { start: K.fineL, hush: [K.iceL - 0.05, K.viewsL - 0.02], dawn: K.didL, feed: T0.feed, pitch: T0.pitch, end: L.dm.s };
fs.writeFileSync(path.join(__dirname, 'reel_cup_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC, blur: BLUR }, null, 1));

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
const DEBUGCAM=${process.env.CUP_CAM || 'null'};  // CUP_CAM='[[x,y,z],[tx,ty,tz],fov]' holds the camera for checks
${fs.readFileSync(path.join(__dirname, 'reel_phone_kit.js'), 'utf8')}
const S={}, LIGHT={};
const imgsReady=window.ready; let threeDone; const threeReady=new Promise(r=>threeDone=r);
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','500 40px Body','600 40px Body','700 40px Body','40px Mono','italic 40px Serif'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([imgsReady,fontsReady,threeReady]).then(()=>prepare());
</script>
<script type="module">
const X = await import(URL.createObjectURL(new Blob([${JSON.stringify(THREE_SRC)}], {type:'text/javascript'})));
await document.fonts.ready;
${fs.readFileSync(path.join(__dirname, 'reel_cup_scene.js'), 'utf8')}
threeDone();
</script></body></html>`;
  await render(html, { frames: FRAMES_DIR, out: OUT, end: C.end, flag, list, gl: true });
})();
