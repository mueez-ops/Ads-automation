// Mez Media reel: "Why would anyone make a spoon with a hollow handle?" Zack D. Films' most watched topic ("McFlurry
// Spoon Looks Weird", 166M views) made the way the armor, bell, equals, pump and Stanley reels were: a question hook with
// the spoon plunging into a cup on the first frame, the expressive female voice, a new camera set-up about every second
// (15 in the first 14), captions at the top built word by word, labels on leader lines, small print with sources; then
// the switch (an ad whose first second does two jobs: it stops the scroll and shows what it sells) and the pitch.
// Facts and sources: reel_mcf_vo.py. Timing: reel_mcf_cues.json. Writes reel_mcf_events.json for the audio.
// Usage: node reel_mcf.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, FONT_CSS } = require('./reel_kit');
const { FRAMES, renderScreens } = require('./phone_screens');

const [FRAMES_DIR, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_mcf_cues.json'), 'utf8'));
const L = C.lines;
const words = C.words.map((w) => ({ ...w }));
const Wd = (line) => words.filter((w) => w.line === line);
const at = (line, i) => Wd(line)[i].s;

// ---------- captions: at the top, the phrase builds word by word ("+" rides with the word before it) ----------
const HL = { why: ['hollow', 'handle'], mixer: ['mixer'], plug: ['spins'], whip: ['toppings'], stays: ['eat'], own: ['own'],
  jobs: ['two', 'jobs'], ad: ['first', 'second'], stop: ['scroll', 'sell'] };
const SKIP = new Set(['scale', 'dm']);               // the pitch is its own big type
const MAXC = 22;
const CBRK = { why: [6], plug: [6], stays: [6] }, RBRK = { plug: [3], stays: [3], own: [3], jobs: [2], stop: [3] };   // new chunk / new row at these word indexes
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
  ['site', 0, L.ad.s, 'none'],                // the spoon, the tunnel, the machine, the spin, the swirl, the row of cups, the studio
  ['feed', L.ad.s, L.scale.s, 'cut'],         // an ad whose first second stops the scroll and shows the product
  ['pitch', L.scale.s, C.end, 'cut'],         // "We scale businesses with ads like this. DM us the word teardown..."
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// key moments the scene and the sound both use
const K = {
  anyone: at('why', 2), spoon: at('why', 5), hollow: at('why', 8), handleW: at('why', 9),
  mixerL: L.mixer.s, mcf: at('mixer', 2), spoon2: at('mixer', 3), mixerW: at('mixer', 6),
  plugL: L.plug.s, machine: at('plug', 1), plugs: at('plug', 2), handle2: at('plug', 5), spins: at('plug', 7),
  whipL: L.whip.s, whips: at('whip', 1), toppings: at('whip', 3), ice: at('whip', 6),
  staysL: L.stays.s, stays: at('stays', 2), cupW: at('stays', 5), andE: at('stays', 6), eat: at('stays', 8),
  ownL: L.own.s, every: at('own', 1), own: at('own', 5), mixer3: at('own', 6),
  jobsL: L.jobs.s, one: at('jobs', 0), spoon3: at('jobs', 1), two: at('jobs', 2), jobsW: at('jobs', 3),
  adL: L.ad.s, first: at('ad', 2), second: at('ad', 3), two2: at('ad', 5), jobs2: at('ad', 6),
  stopL: L.stop.s, scroll: at('stop', 2), andS: at('stop', 3), show: at('stop', 4), sell: at('stop', 7),
  s1: at('scale', 0), s2: at('scale', 3), d1: at('dm', 0), d2: at('dm', 4), d3: at('dm', 5), handle: +(L.dm.e + 0.05).toFixed(3),
};
// the camera: a new set-up on almost every line, hard cuts, each one moving [start, from-view, to-view]
const CUTS = [
  [0, 'drop0', 'drop1'], [K.spoon - 0.05, 'orbit0', 'orbit1'], [K.hollow - 0.05, 'tunnel0', 'tunnel1'], [K.mixerL, 'machine0', 'machine1'],
  [K.spoon2 - 0.05, 'lift0', 'lift1'], [K.mixerW - 0.05, 'hero0', 'hero1'], [K.plugL, 'xray0', 'xray1'], [K.spins - 0.05, 'spin0', 'spin1'],
  [K.whipL, 'cut0', 'cut1'], [K.ice - 0.05, 'top0', 'top1'], [K.staysL, 'release0', 'release1'], [K.andE - 0.05, 'eat0', 'eat1'],
  [K.ownL, 'row0', 'row1'], [K.jobsL, 'studio0', 'studio1'], [K.two - 0.05, 'studiob0', 'studiob1'],
].map(([t, a, b]) => [+t.toFixed(3), a, b || a]);

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[0.1, 0.34, 3], [K.hollow - 0.05, K.mixerL - 0.02, 3], [K.spins - 0.05, K.whipL + 0.4, 3], [T0.feed - 0.02, T0.feed + 0.6, 4],
  [K.stopL - 0.02, K.scroll + 0.12, 4], [K.d1 - 0.02, K.d1 + 0.4, 4]];

// ---------- sound design (reel_mcf_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
ev(0, 'whoosh_f', 0.22); ev(0.2, 'plop', 0.55); ev(0.22, 'crumbs', 0.3); ev(K.spoon - 0.06, 'whoosh_soft', 0.2);
ev(K.hollow - 0.06, 'tunnel', 0.4, { d: K.mixerL - K.hollow + 0.1 }); ev(K.mixerL - 0.05, 'whoosh_c', 0.26); ev(K.mixerL, 'hum', 0.18, { d: K.andE - K.mixerL });
ev(K.spoon2 - 0.05, 'whoosh_soft', 0.18); ev(K.spoon2, 'lift', 0.3); ev(K.mixerW, 'hit', 0.22);
ev(K.plugL - 0.05, 'whoosh_soft', 0.2); ev(K.plugs + 0.1, 'lift', 0.25); ev(K.handle2 + 0.05, 'clunk', 0.45);
ev(K.spins - 0.06, 'whoosh_c', 0.24); ev(K.spins, 'whirr', 0.3, { d: K.staysL - K.spins + 0.35 });
ev(K.whipL - 0.04, 'whoosh_soft', 0.18); ev(K.whips, 'crunch', 0.32, { d: K.staysL - K.whips }); ev(K.ice - 0.06, 'whoosh_soft', 0.18);
ev(K.stays, 'lift', 0.22); ev(K.stays + 0.3, 'clunk', 0.3);
ev(K.andE - 0.06, 'whoosh_soft', 0.2); ev(K.andE, 'slide', 0.3); ev(K.eat, 'scoop', 0.4);
ev(K.ownL - 0.05, 'whoosh_c', 0.22); for (let i = 0; i < 5; i++) ev(K.every + 0.2 * i, 'tick', 0.34 + 0.03 * i, { pan: -0.4 + 0.2 * i });
ev(K.jobsL - 0.05, 'whoosh_soft', 0.22); ev(K.spoon3, 'pop', 0.3); ev(K.two - 0.06, 'whoosh_c', 0.2); ev(K.jobsW, 'ding', 0.36);
ev(T0.feed - 0.03, 'deep', 0.36); ev(T0.feed, 'zoom_out', 0.2); ev(K.first, 'tick', 0.3); ev(K.two2, 'select', 0.28); ev(K.jobs2, 'select', 0.24);
ev(K.stopL - 0.02, 'flick', 0.32, { d: K.scroll - K.stopL + 0.05 }); ev(K.scroll + 0.02, 'thud', 0.42); ev(K.scroll + 0.12, 'check', 0.3);
ev(K.show - 0.05, 'blend', 0.22, { d: T0.pitch - K.show - 0.21 }); ev(K.sell + 0.05, 'check', 0.32);
ev(T0.pitch - 0.3, 'deep', 0.32); ev(T0.pitch - 0.2, 'whoosh_f', 0.22);
ev(K.d1 - 0.05, 'whoosh_soft', 0.28); ev(K.d2, 'hit', 0.34);
ev(K.handle, 'pop', 0.3);
// the score: a low drone under the question; the groove from "Because the McFlurry spoon is the mixer!", a breath on
// "One spoon. Two jobs.", a warm lift on it; lighter under the feed, and back for the pitch
const MUSIC = { start: K.mixerL, hush: [K.jobsL - 0.05, K.adL - 0.02], dawn: K.jobsL, feed: T0.feed, pitch: T0.pitch, end: L.dm.s };
fs.writeFileSync(path.join(__dirname, 'reel_mcf_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC, blur: BLUR }, null, 1));

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
const DEBUGCAM=${process.env.MCF_CAM || 'null'};  // MCF_CAM='[[x,y,z],[tx,ty,tz],fov]' holds the camera for checks
${fs.readFileSync(path.join(__dirname, 'reel_phone_kit.js'), 'utf8')}
const S={}, LIGHT={};
const imgsReady=window.ready; let threeDone; const threeReady=new Promise(r=>threeDone=r);
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','500 40px Body','600 40px Body','700 40px Body','40px Mono','italic 40px Serif'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([imgsReady,fontsReady,threeReady]).then(()=>prepare());
</script>
<script type="module">
const X = await import(URL.createObjectURL(new Blob([${JSON.stringify(THREE_SRC)}], {type:'text/javascript'})));
await document.fonts.ready;
${fs.readFileSync(path.join(__dirname, 'reel_mcf_scene.js'), 'utf8')}
threeDone();
</script></body></html>`;
  await render(html, { frames: FRAMES_DIR, out: OUT, end: C.end, flag, list, gl: true });
})();
