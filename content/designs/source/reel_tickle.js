// Mez Media reel: "You can't tickle yourself. Unless it lands 0.2 seconds late." Why your own touch doesn't tickle (the
// brain predicts it and turns it down), and the 1999 UCL robot experiment that made it tickle with a 0.2 s delay. Built
// the way the Mosquito reel was after it reached 2,400 views: a claim aimed at the viewer with a number in it
// (hookscore.py 84 STRONG), the whole hook card on screen from the first frame, and a first frame already in motion
// (someone tickling their own ribs with a bored face). The expressive female voice, a new camera set-up about every
// second, captions at the top, labels on leader lines, small print with sources. Then the switch (your brain mutes what
// it sees coming: logo, product, shop now; so your hook has to be the delay) and the pitch.
// Facts and sources: reel_tickle_vo.py. Timing: reel_tickle_cues.json. Writes reel_tickle_events.json for the audio.
// Usage: node reel_tickle.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, FONT_CSS } = require('./reel_kit');
const { FRAMES, renderScreens } = require('./phone_screens');

const [FRAMES_DIR, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_tickle_cues.json'), 'utf8'));
const L = C.lines;
const words = C.words.map((w) => ({ ...w }));
const Wd = (line) => words.filter((w) => w.line === line);
const at = (line, i) => Wd(line)[i].s;

// ---------- captions: at the top, the phrase builds word by word; numbers are spoken as words and shown as digits ----------
const SHOW = [['unless', 'zero point two', '0.2'], ['delay', 'zero point two', '0.2']];
const capWords = words.map((w) => ({ ...w }));
SHOW.forEach(([line, spoken, shown]) => {
  const ws = spoken.split(' '), i = capWords.findIndex((w, k) => w.line === line && ws.every((s, j) => (capWords[k + j] || {}).w === s));
  capWords.splice(i, ws.length, { w: shown, s: capWords[i].s, e: capWords[i + ws.length - 1].e, line });
});
const CW = (line) => capWords.filter((w) => w.line === line);
const HL = { cant: ["can't"], unless: ['late'], saw: ['saw'], predicts: ['down'], robots: ['robots'], foam: ['foam'], nodelay: ['tickle'],
  delay: ['0.2'], mutes: ['mutes'], feed: ['ads'], logo: ['muted'], hookd: ['hook'] };
const SKIP = new Set(['scale', 'dm']);               // the pitch is its own big type
const MAXC = 22;
// new chunk / new row at these word indexes
const CBRK = { foam: [3], delay: [4] }, RBRK = { saw: [2], predicts: [5], robots: [3], foam: [6], nodelay: [2], delay: [2, 8], mutes: [2], feed: [3], logo: [2], hookd: [3] };
const CH = [];
// the hook is one card, all of it on screen from the first frame (dim until each word is said)
const hk = (ws) => ws.map((w) => ({ w: w.w, s: w.s, e: w.e, hl: (HL[w.line] || []).includes(w.w) }));
CH.push({ line: 'cant', s: 0, hook: true, size: 70, rows: [hk(CW('cant')), hk(CW('unless').slice(0, 3)), hk(CW('unless').slice(3))] });
CH[0].rows[0][0].s = -0.1;
Object.keys(L).filter((line) => !SKIP.has(line) && line !== 'cant' && line !== 'unless').forEach((line) => {
  let cur = null;
  const close = () => { if (cur) CH.push(cur); cur = null; };
  CW(line).forEach((w, wi) => {
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
CH.forEach((c, i) => {
  const nx = CH[i + 1], last = c.rows.flat().slice(-1)[0].e;
  c.e = +Math.min(nx ? nx.s : C.end, nx && nx.line === c.line ? nx.s : last + 0.4, L.scale.s).toFixed(3);   // gone when the pitch starts
});

// ---------- the edit: the 3D world, then the feed, then the pitch ----------
const SHOTS = [
  ['site', 0, L.feed.s, 'none'],              // the sofa, the x-ray, the brain, the 1999 lab and its robots
  ['feed', L.feed.s, L.scale.s, 'cut'],       // in your feed it sees ads coming: logo, product, shop now, muted; your hook has to be the delay
  ['pitch', L.scale.s, C.end, 'cut'],         // "We scale businesses with ads like this. DM us the word teardown..."
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// key moments the scene and the sound both use
const K = {
  you: at('cant', 0), cant: at('cant', 1), tickle: at('cant', 2), yourself: at('cant', 3),
  unlessL: L.unless.s, lands: at('unless', 2), two: at('unless', 5), late: at('unless', 7),
  sawL: L.saw.s, saw: at('saw', 2), coming: at('saw', 4),
  predL: L.predicts.s, predicts: at('predicts', 1), touch: at('predicts', 4), turns: at('predicts', 6), down: at('predicts', 8),
  robotsL: L.robots.s, london: at('robots', 0), tested: at('robots', 2), twoR: at('robots', 5), robots: at('robots', 6),
  foamL: L.foam.s, move: at('foam', 1), one: at('foam', 2), other: at('foam', 5), strokes: at('foam', 6), palm: at('foam', 8), foam: at('foam', 10),
  nodelayL: L.nodelay.s, delay0: at('nodelay', 1), barely: at('nodelay', 2), tickle2: at('nodelay', 4),
  delayL: L.delay.s, two2: at('delay', 4), seconds: at('delay', 5), feels: at('delay', 8), someone: at('delay', 10), did: at('delay', 12),
  mutesL: L.mutes.s, mutes: at('mutes', 2), whatever: at('mutes', 3), coming2: at('mutes', 6),
  feedL: L.feed.s, feed: at('feed', 2), ads: at('feed', 5),
  logoL: L.logo.s, logo: at('logo', 0), product: at('logo', 1), shop: at('logo', 2), muted: at('logo', 4),
  hookL: L.hookd.s, hook: at('hookd', 2), delayW: at('hookd', 7),
  s1: at('scale', 0), s2: at('scale', 3), d1: at('dm', 0), d2: at('dm', 4), d3: at('dm', 5), handle: +(L.dm.e + 0.05).toFixed(3),
};
// the camera: a new set-up about every second, hard cuts, each one moving [start, from-view, to-view]
const CUTS = [
  [0, 'sofa0', 'sofa1'], [K.unlessL - 0.03, 'tease0', 'tease1'], [K.two - 0.08, 'giggle0', 'giggle1'], [K.sawL, 'xray0', 'xray1'],
  [K.predL, 'signal0', 'signal1'], [K.turns - 0.08, 'dial0', 'dial1'], [K.robotsL, 'lab0', 'lab1'], [K.twoR - 0.06, 'rigs0', 'rigs1'],
  [K.foamL, 'lefthand0', 'lefthand1'], [K.other - 0.06, 'palm0', 'palm1'], [K.nodelayL, 'crt0', 'crt1'], [K.barely - 0.06, 'flat0', 'flat1'],
  [K.delayL, 'crt20', 'crt21'], [K.feels - 0.08, 'laugh0', 'laugh1'], [K.mutesL, 'brain0', 'brain1'], [K.whatever - 0.05, 'brain20', 'brain21'],
].map(([t, a, b]) => [+t.toFixed(3), a, b || a]);

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[K.unlessL - 0.03, K.unlessL + 0.25, 3], [K.feels - 0.08, K.feels + 0.3, 3], [T0.feed - 0.02, T0.feed + 0.6, 4], [K.d1 - 0.02, K.d1 + 0.4, 4]];

// ---------- sound design (reel_tickle_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
ev(0, 'room', 0.28, { d: K.robotsL }); ev(0.02, 'rustle', 0.34, { d: K.unlessL - 0.05 }); ev(K.tickle, 'tick2', 0.2);
ev(K.unlessL - 0.05, 'whoosh_f', 0.24); ev(K.unlessL, 'servo', 0.3, { d: 0.9 }); ev(K.two - 0.1, 'whoosh_soft', 0.18); ev(K.late - 0.02, 'giggle', 0.26);
ev(K.sawL - 0.06, 'whoosh_c', 0.22); ev(K.sawL, 'xray', 0.3);
ev(K.predL - 0.05, 'whoosh_soft', 0.2); ev(K.predicts, 'zing', 0.28, { pan: -0.3 }); ev(K.touch + 0.1, 'zing', 0.24, { pan: 0.3 }); ev(K.touch + 0.35, 'cancel', 0.34);
ev(K.turns - 0.1, 'whoosh_soft', 0.18); for (let i = 0; i < 6; i++) ev(K.turns + 0.07 * i, 'click', 0.2 - 0.02 * i);
ev(K.robotsL - 0.06, 'deep', 0.28); ev(K.robotsL - 0.02, 'whoosh_f', 0.22); ev(K.robotsL, 'lab', 0.26, { d: K.mutesL - K.robotsL }); ev(K.london + 0.1, 'select', 0.24);
ev(K.twoR - 0.08, 'whoosh_soft', 0.18); ev(K.robots, 'hit', 0.22);
ev(K.foamL - 0.05, 'whoosh_c', 0.2); ev(K.move, 'servo', 0.32, { d: 1.0, pan: -0.3 }); ev(K.other - 0.08, 'whoosh_soft', 0.18); ev(K.strokes, 'servo', 0.3, { d: 1.2, pan: 0.3 }); ev(K.strokes + 0.05, 'rustle', 0.22, { d: 1.0 });
ev(K.nodelayL - 0.05, 'whoosh_soft', 0.2); ev(K.delay0, 'beep', 0.3); ev(K.barely - 0.08, 'whoosh_c', 0.18); ev(K.tickle2, 'flat', 0.26);
ev(K.delayL - 0.05, 'whoosh_f', 0.22); for (let i = 0; i < 10; i++) ev(K.two2 - 0.25 + 0.05 * i, 'tick', 0.15 + 0.012 * i); ev(K.seconds, 'beep2', 0.3);
ev(K.feels - 0.1, 'whoosh_c', 0.22); ev(K.feels, 'laugh', 0.34); ev(K.someone, 'sparkle', 0.26);
ev(K.mutesL - 0.06, 'whoosh_soft', 0.2); ev(K.mutes, 'mute', 0.3); ev(K.whatever - 0.06, 'whoosh_soft', 0.16); ev(K.coming2 - 0.1, 'zing', 0.22);
ev(T0.feed - 0.03, 'deep', 0.34); ev(T0.feed, 'zoom_out', 0.2);
ev(K.logo - 0.1, 'swish', 0.24); ev(K.logo + 0.18, 'mute', 0.24); ev(K.product - 0.1, 'swish', 0.24, { pan: 0.2 }); ev(K.product + 0.18, 'mute', 0.24);
ev(K.shop - 0.1, 'swish', 0.24, { pan: -0.2 }); ev(K.shop + 0.18, 'mute', 0.24); ev(K.muted - 0.02, 'hit', 0.3);
ev(K.hookL - 0.08, 'swish', 0.26); ev(K.hook, 'pop', 0.3); ev(K.delayW, 'sparkle', 0.3); ev(K.delayW + 0.05, 'giggle', 0.2);
ev(T0.pitch - 0.3, 'deep', 0.32); ev(T0.pitch - 0.2, 'whoosh_f', 0.22);
ev(K.d1 - 0.05, 'whoosh_soft', 0.28); ev(K.d2, 'hit', 0.34);
ev(K.handle, 'pop', 0.3);
// the score: a playful bounce under the hook, the groove from "London scientists", a breath on "No delay", a lift on
// "feels like someone else did it", a drop under "Muted", back for the hook and the pitch
const MUSIC = { start: K.robotsL, hush: [K.nodelayL - 0.05, K.delayL - 0.02], dawn: K.feels, feed: T0.feed, mute: [K.muted - 0.05, K.hookL - 0.02], pitch: T0.pitch, end: L.dm.s };
fs.writeFileSync(path.join(__dirname, 'reel_tickle_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC, blur: BLUR }, null, 1));

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
const DEBUGCAM=${process.env.TICKLE_CAM || 'null'};  // TICKLE_CAM='[[x,y,z],[tx,ty,tz],fov]' holds the camera for checks
${fs.readFileSync(path.join(__dirname, 'reel_phone_kit.js'), 'utf8')}
const S={}, LIGHT={};
const imgsReady=window.ready; let threeDone; const threeReady=new Promise(r=>threeDone=r);
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','500 40px Body','600 40px Body','700 40px Body','40px Mono','italic 40px Serif'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([imgsReady,fontsReady,threeReady]).then(()=>prepare());
</script>
<script type="module">
const X = await import(URL.createObjectURL(new Blob([${JSON.stringify(THREE_SRC)}], {type:'text/javascript'})));
await document.fonts.ready;
${fs.readFileSync(path.join(__dirname, 'reel_tickle_scene.js'), 'utf8')}
threeDone();
</script></body></html>`;
  await render(html, { frames: FRAMES_DIR, out: OUT, end: C.end, flag, list, gl: true });
})();
