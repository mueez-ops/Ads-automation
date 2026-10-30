// Mez Media reel: "Why would anyone pay a million dollars for whale vomit?" One of Zack D. Films' most watched topics
// ("Whale Vomit Is Worth Millions", 86M views) made the way the armor reel was (1,800 views, 19% skip rate): a question
// hook with action on the first frame, the expressive female voice, a new camera set-up about every second (18 in the
// first 21 seconds), captions at the top built word by word, labels on leader lines, small print with sources; then
// the switch (a feed that flicks past ads selling "the lump" and stops on one selling what it does) and the pitch.
// Facts and sources: reel_whale_vo.py. Timing: reel_whale_cues.json. Writes reel_whale_events.json for the audio.
// Usage: node reel_whale.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, FONT_CSS } = require('./reel_kit');
const { FRAMES, renderScreens } = require('./phone_screens');

const [FRAMES_DIR, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_whale_cues.json'), 'utf8'));
const L = C.lines;
const words = C.words.map((w) => ({ ...w }));
const Wd = (line) => words.filter((w) => w.line === line);
const at = (line, i) => Wd(line)[i].s;

// ---------- captions: at the top, the phrase builds word by word ("+" rides with the word before it) ----------
const HL = { why: ['million', 'vomit'], perfume: ['perfume'], isnt: ["isn't"], forms: ['gut', 'squid', 'beaks'], stinks: ['stinks'],
  sweet: ['sweet'], found: ['127', 'kilos'], sold: ['$1.5M'], last: ['last', 'longer'], lump: ['lump', 'does'],
  ads: ['lump'], sell: ['does'] };
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
  ['ocean', 0, L.ads.s, 'none'],              // the whale, the lump, the beaks, the sea, the find, the money, the perfume
  ['feed', L.ads.s, L.scale.s, 'cut'],        // the last frame becomes a post in a feed that flicks past ads selling the lump
  ['pitch', L.scale.s, C.end, 'cut'],         // "We scale businesses with ads like this. DM us the word teardown..."
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// key moments the scene and the sound both use
const K = {
  pay: at('why', 3), million: at('why', 5), dollars: at('why', 6), whale: at('why', 8), vomit: at('why', 9),
  perfumeL: L.perfume.s, perfume: at('perfume', 1),
  isntL: L.isnt.s, isnt: at('isnt', 2), vomit2: at('isnt', 4),
  forms: L.forms.s, sperm: at('forms', 4), gut: at('forms', 6), around: at('forms', 7), squid: at('forms', 8), beaks: at('forms', 9),
  stinksL: L.stinks.s, stinks: at('stinks', 2),
  sweetL: L.sweet.s, years: at('sweet', 0), sweet: at('sweet', 5),
  found: L.found.s, yemeni: at('found', 0), foundW: at('found', 2), n127: at('found', 3), kilos: at('found', 7), inside: at('found', 8), dead: at('found', 10),
  sold: L.sold.s, soldW: at('sold', 1), one: at('sold', 3), million2: at('sold', 7), dollars2: at('sold', 8),
  last: L.last.s, perfume2: at('last', 3), lastW: at('last', 4), longer: at('last', 5),
  lump: L.lump.s, nobody: at('lump', 0), lumpW: at('lump', 4), they: at('lump', 5), does: at('lump', 10),
  ads: L.ads.s, adsW: at('ads', 1), lump3: at('ads', 4), sellL: L.sell.s, sell: at('sell', 0), does2: at('sell', 3),
  s1: at('scale', 0), s2: at('scale', 3), d1: at('dm', 0), d2: at('dm', 4), d3: at('dm', 5), handle: +(L.dm.e + 0.05).toFixed(3),
};
// the camera: a new set-up on almost every line, hard cuts, each one moving [start, from-view, to-view]
const CUTS = [
  [0, 'up0', 'up1'], [K.pay - 0.03, 'ped0', 'ped1'], [K.whale - 0.05, 'eye0', 'eye1'], [K.perfumeL, 'bot0', 'bot1'],
  [K.isntL, 'side0', 'side1'], [K.forms, 'xr0', 'xr1'], [K.around - 0.05, 'beak0', 'beak1'], [K.stinksL, 'fresh0', 'fresh1'],
  [K.sweetL, 'sea0', 'sea1'], [K.found, 'air0', 'air1'], [K.n127 - 0.05, 'scale0', 'scale1'], [K.inside - 0.05, 'carc0', 'carc1'],
  [K.sold, 'cash0', 'cash1'], [K.million2 - 0.05, 'orb0', 'orb1'], [K.last, 'bot2', 'bot3'], [K.lastW - 0.05, 'scent0', 'scent1'],
  [K.lump, 'spot0', 'spot1'], [K.they - 0.05, 'duo0', 'duo1'],
].map(([t, a, b]) => [+t.toFixed(3), a, b || a]);

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[K.million - 0.03, K.million + 0.14, 3], [K.vomit - 0.03, K.vomit + 0.2, 3], [K.stinks - 0.03, K.stinks + 0.14, 3],
  [K.kilos - 0.03, K.kilos + 0.12, 3], [K.million2 - 0.05, K.million2 + 0.2, 3], [K.lumpW - 0.03, K.lumpW + 0.12, 3],
  [T0.feed - 0.02, T0.feed + 0.6, 4], [K.ads, K.sell + 0.25, 5], [K.d1 - 0.02, K.d1 + 0.4, 4]];

// ---------- sound design (reel_whale_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
ev(0, 'underwater', 0.5, { d: K.pay }); ev(0.05, 'clicks', 0.3, { d: 0.6 }); ev(0.35, 'whalecall', 0.32);
ev(K.pay - 0.05, 'whoosh_c', 0.3, { pan: 0.3 }); ev(K.million - 0.02, 'cash', 0.5); ev(K.million, 'hit', 0.3);
ev(K.whale - 0.06, 'whoosh_soft', 0.26); ev(K.vomit - 0.04, 'burp', 0.55); ev(K.vomit, 'bubbles', 0.4);
ev(K.perfumeL - 0.04, 'whoosh_f', 0.26); ev(K.perfume - 0.02, 'spray', 0.45); ev(K.perfume + 0.05, 'sparkle', 0.3);
ev(K.isntL - 0.05, 'scratch', 0.4); ev(K.vomit2 - 0.02, 'buzz', 0.32);
ev(K.forms - 0.05, 'whoosh_soft', 0.26); ev(K.forms + 0.05, 'scan', 0.24); ev(K.gut, 'select', 0.22);
ev(K.around - 0.08, 'whoosh_c', 0.24); ev(K.squid, 'squelch', 0.3); ev(K.beaks, 'clack', 0.32);
ev(K.stinksL - 0.04, 'whoosh_soft', 0.24); ev(K.stinks - 0.02, 'squelch', 0.45); ev(K.stinks + 0.05, 'flies', 0.3, { d: 0.6 });
ev(K.sweetL - 0.05, 'riser', 0.16, { d: K.sweet - K.sweetL + 0.05 }); ev(K.sweetL, 'waves', 0.4, { d: L.sweet.e - K.sweetL + 0.3 }); ev(K.sweet, 'chime', 0.32);
ev(K.found - 0.04, 'whoosh_f', 0.26); ev(K.found, 'gulls', 0.3, { d: 1.0 }); ev(K.found + 0.1, 'waves', 0.3, { d: 1.0 }); ev(K.foundW, 'motor', 0.2, { d: 0.5 });
for (let i = 0; i < 8; i++) ev(K.n127 + (K.kilos - K.n127 - 0.1) * i / 8, 'tick', 0.1 + 0.015 * i, { pan: 0.25 });
ev(K.kilos - 0.01, 'thud', 0.55);
ev(K.inside - 0.07, 'whoosh_soft', 0.24); ev(K.inside, 'waves', 0.32, { d: 0.9 }); ev(K.dead, 'deep', 0.32);
ev(K.sold - 0.05, 'whoosh_c', 0.28); for (let i = 0; i < 10; i++) ev(K.one + (K.million2 - K.one) * i / 10, 'tick', 0.1 + 0.012 * i, { pan: -0.25 });
ev(K.million2 - 0.02, 'cash', 0.6); ev(K.million2, 'hit', 0.36); ev(K.million2 + 0.05, 'coins', 0.4);
ev(K.last - 0.05, 'whoosh_soft', 0.24); ev(K.perfume2, 'spray', 0.36); ev(K.lastW - 0.06, 'whoosh_f', 0.24); ev(K.longer, 'shimmer', 0.3);
ev(K.lump - 0.04, 'whoosh_soft', 0.22); ev(K.lumpW - 0.01, 'switch', 0.5); ev(K.lumpW + 0.02, 'thump', 0.3);
ev(K.they - 0.06, 'switch', 0.44); ev(K.does - 0.05, 'sparkle', 0.34); ev(K.does, 'chime', 0.28);
ev(T0.feed - 0.03, 'deep', 0.36); ev(T0.feed, 'zoom_out', 0.2);
ev(K.adsW - 0.05, 'swish', 0.3, { pan: 0.2 }); ev(K.adsW + 0.33, 'swish', 0.26, { pan: -0.2 }); ev(K.adsW + 0.68, 'swish', 0.24, { pan: 0.2 });
ev(K.sell, 'thump', 0.34); ev(K.does2, 'like', 0.36);
ev(T0.pitch - 0.3, 'deep', 0.32); ev(T0.pitch - 0.2, 'whoosh_f', 0.22);
ev(K.d1 - 0.05, 'whoosh_soft', 0.28); ev(K.d2, 'hit', 0.34);
ev(K.handle, 'pop', 0.3);
// the score: a deep, held underwater drone under the question; the groove from "For perfume!", hushed under "Fresh,
// it stinks!", filtered down for the years at sea; lighter under the feed, and back for the pitch
const MUSIC = { start: K.perfumeL, hush: [K.stinksL, L.stinks.e], sea: [K.sweetL, L.sweet.e], spot: [K.lumpW, K.they - 0.05],
  feed: T0.feed, pitch: T0.pitch, end: L.dm.s };
fs.writeFileSync(path.join(__dirname, 'reel_whale_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC, blur: BLUR }, null, 1));

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
const DEBUGCAM=${process.env.WHALE_CAM || 'null'};  // WHALE_CAM='[[x,y,z],[tx,ty,tz],fov]' holds the camera for checks
${fs.readFileSync(path.join(__dirname, 'reel_phone_kit.js'), 'utf8')}
const S={}, LIGHT={};
const imgsReady=window.ready; let threeDone; const threeReady=new Promise(r=>threeDone=r);
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','500 40px Body','600 40px Body','700 40px Body','40px Mono'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([imgsReady,fontsReady,threeReady]).then(()=>prepare());
</script>
<script type="module">
const X = await import(URL.createObjectURL(new Blob([${JSON.stringify(THREE_SRC)}], {type:'text/javascript'})));
await document.fonts.ready;
${fs.readFileSync(path.join(__dirname, 'reel_whale_scene.js'), 'utf8')}
threeDone();
</script></body></html>`;
  await render(html, { frames: FRAMES_DIR, out: OUT, end: C.end, flag, list, gl: true });
})();
