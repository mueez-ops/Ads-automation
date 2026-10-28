// Mez Media reel: "This is the reality of Brez Scales." A switch reel that mixes two looks: the addxstudio explainer
// (kinetic type that builds word by word with the key word in red, paper invoice cards, coral-to-purple gradients,
// number tickers, inline icons) and the Rushmore/Eiffel switch format (a photo under the written hook on the first
// frame, photo cards with white pills and stamps, a beat of tension, the switch into a phone, the pitch).
// He is a real person, so every claim is attributed on screen (small print) and in reel_brez_vo.py: what he says he
// makes, what the site that sells his mentorship (Whop) wrote about his cars, what course reviewers say about where
// the money comes from. No photos of him: the cars and the lecture hall are Pexels photos (Pexels licence):
// brez_lambo.jpg 9814982 (Adrian Newell), brez_gwagon.jpg 8622790 (Ishan Kulshrestha), brez_bmw.jpg 3849556
// (Jae Park), brez_lecture.jpg 356065 (Pixabay), brez_lambo_road.jpg 9814983 (Adrian Newell).
// Timing: reel_brez_cues.json (reel_brez_vo.py). Writes reel_brez_events.json for reel_brez_audio.py.
// Usage: node reel_brez.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, FONT_CSS, photos } = require('./reel_kit');
const { FRAMES, renderScreens } = require('./phone_screens');

const [FRAMES_DIR, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_brez_cues.json'), 'utf8'));
const L = C.lines;
const words = [];
C.words.forEach((w) => { if (w.w === '+') words[words.length - 1].e = w.e; else words.push({ ...w }); });
const Wd = (line) => words.filter((w) => w.line === line);
const at = (line, i) => Wd(line)[i].s;
const NUM = +Wd('watched')[6].w;                      // the seconds said on the switch (the real time at that word)
const LW = Object.fromEntries(Object.keys(L).map((k) => [k, Wd(k).map(({ w, s, e }) => ({ w, s, e }))]));

// the switch keeps the one-word captions under the phone; everything before it carries its own kinetic type
const CH = [];
['watched', 'imagine'].forEach((line) => Wd(line).forEach((w, i, ws) => {
  CH.push({ text: w.w, s: +w.s.toFixed(3), e: +(i + 1 < ws.length ? ws[i + 1].s : Math.min(w.e + 0.3, L.scale.s)).toFixed(3), line, hl: w.w === String(NUM) });
}));

// ---------- the edit ----------
const TENSE = +(L.sells.e + 0.12).toFixed(3);
const SHOTS = [
  ['hook', 0, L.claim.s, 'none'],             // the Lambo at night under the written hook
  ['claim', L.claim.s, L.loop.s, 'cut'],      // the paper card: $400,000 a month, "before he turned 21"
  ['loop', L.loop.s, L.school.s, 'cut'],      // white: "But the money isn't coming from where you think."
  ['school', L.school.s, L.start.s, 'cut'],   // the empty lecture hall: late 2022, digital marketing, "Dropped out"
  ['start', L.start.s, L.cars.s, 'pushL'],    // gradient: a cracked phone, a design app, a video app; clothing, a cut
  ['cars', L.cars.s, L.rented.s, 'cut'],      // three photo cards: crashed, towed, three hours
  ['rented', L.rented.s, L.money.s, 'cut'],   // gradient: "calls the cars marketing"; a rental key tag
  ['money', L.money.s, L.prices.s, 'cut'],    // the ticker of course prices
  ['prices', L.prices.s, L.sells.s, 'cut'],   // the receipt: $47 bootcamp, ~$4,800 mentorship
  ['sells', L.sells.s, TENSE, 'cut'],         // charcoal: "And the lifestyle is what sells them."
  ['tense', TENSE, L.watched.s, 'none'],      // the colour drains, a heartbeat, a clock
  ['phone', L.watched.s, L.scale.s, 'cut'],   // the reel shrinks into a phone; 0:40; then it is your ad
  ['pitch', L.scale.s, C.end, 'cut'],         // "We scale businesses with ads like this. DM us the word teardown..."
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

const K = {
  reality: at('hook', 3), brez: at('hook', 5), money400: at('claim', 4), turned21: at('claim', 10), think: at('loop', 8),
  y2022: at('school', 1), marketing: at('school', 8), drops: at('school', 10),
  phone: at('start', 3), canva: at('start', 4), tiktok: at('start', 6), clothing: at('start', 11), cut: at('start', 15),
  lifestyle: at('cars', 3), lambo: at('cars', 6), gwagon: at('cars', 9), bmw: at('cars', 11), hours: at('cars', 14),
  site: at('rented', 2), marketingC: at('rented', 10), rentals: at('rented', 14),
  wherefrom: at('money', 6), reviewers: at('money', 7), courses: at('money', 11),
  p47: at('prices', 1), p4800: at('prices', 6), sells: at('sells', 5),
  tense: TENSE, freeze: +(TENSE - 0.1).toFixed(3), watched: at('watched', 2), num: at('watched', 6), ad: at('imagine', 2),
  s1: at('scale', 0), s2: at('scale', 3), d1: at('dm', 0), d2: at('dm', 4), d3: at('dm', 5), handle: +(L.dm.e + 0.05).toFixed(3),
};
const BEATS = [0, 1].map((i) => +(TENSE + 0.12 + i * 0.42).toFixed(3));

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[0, 0.7, 6], [T0.start - 0.02, T0.start + 0.35, 4], [K.lambo - 0.1, K.lambo + 0.35, 4], [K.gwagon - 0.1, K.gwagon + 0.35, 4],
  [K.bmw - 0.1, K.bmw + 0.35, 4], [T0.money - 0.02, T0.prices, 3], [T0.phone - 0.02, T0.phone + 0.65, 6], [K.d1 - 0.02, K.d1 + 0.4, 4]];

// ---------- sound design (reel_brez_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
ev(0.0, 'hit', 0.45); ev(0.02, 'whoosh_c', 0.45, { pan: 0.3 }); ev(0.05, 'deep', 0.4); ev(K.reality, 'select', 0.22);
ev(T0.claim - 0.02, 'swish', 0.3); ev(K.money400, 'pop', 0.3); for (let i = 0; i < 10; i++) ev(K.money400 + 0.04 * i, 'tick', 0.07 + 0.006 * i, { pan: -0.2 + 0.04 * i });
ev(K.turned21, 'select', 0.24);
ev(T0.loop - 0.02, 'whoosh_soft', 0.3); ev(K.think, 'thump', 0.4);
ev(T0.school - 0.02, 'whoosh_soft', 0.3); ev(K.y2022, 'pop', 0.26); ev(K.marketing, 'pop', 0.24, { pan: 0.25 }); ev(K.drops - 0.02, 'thump', 0.42); ev(K.drops, 'hit', 0.3);
ev(T0.start - 0.05, 'whoosh_f', 0.3, { pan: -0.3 }); ev(K.phone, 'pop', 0.26, { pan: -0.25 }); ev(K.canva, 'pop', 0.24); ev(K.tiktok, 'pop', 0.24, { pan: 0.25 });
ev(K.clothing, 'swish', 0.24); ev(K.cut, 'select', 0.26);
ev(T0.cars - 0.02, 'whoosh_soft', 0.3); ev(K.lambo - 0.05, 'whoosh_c', 0.3, { pan: -0.3 }); ev(K.lambo + 0.12, 'hit', 0.3);
ev(K.gwagon - 0.05, 'whoosh_c', 0.28, { pan: 0.3 }); ev(K.gwagon + 0.12, 'thump', 0.35); ev(K.bmw - 0.05, 'whoosh_c', 0.28, { pan: -0.2 }); ev(K.hours, 'hit', 0.3);
ev(T0.rented - 0.02, 'swish', 0.28); ev(K.marketingC, 'select', 0.26); ev(K.rentals - 0.05, 'whoosh_soft', 0.24); ev(K.rentals + 0.1, 'chime', 0.2);
ev(T0.money - 0.02, 'whoosh_soft', 0.3); for (let i = 0; i < 14; i++) ev(K.reviewers + 0.06 * i, 'tick', 0.06 + 0.004 * i, { pan: 0.3 - 0.04 * i }); ev(K.courses, 'pop', 0.3);
ev(T0.prices - 0.02, 'swish', 0.26); ev(K.p47, 'tap', 0.3); ev(K.p4800, 'tap', 0.32); ev(K.p4800 + 0.25, 'select', 0.24);
ev(T0.sells - 0.02, 'deep', 0.32); ev(K.sells, 'thump', 0.4);
ev(K.tense, 'riser', 0.2, { d: T0.phone - K.tense }); BEATS.forEach((t) => { ev(t, 'thump', 0.4); ev(t + 0.17, 'thump', 0.24); });
for (let t = K.tense + 0.05; t < T0.phone - 0.1; t += 0.25) ev(t, 'tick', 0.14, { pan: 0.35 });
ev(T0.phone - 0.03, 'deep', 0.45); ev(T0.phone, 'hit', 0.45); ev(T0.phone - 0.05, 'zoom_out', 0.18);
for (let i = 1; i <= NUM; i++) { const t = K.watched + (K.num - K.watched) * i / NUM; if (t > at('watched', 3)) ev(t, 'tick', 0.06 + 0.002 * i, { pan: 0.2 }); }
ev(K.num, 'select', 0.3);
ev(K.ad, 'pop', 0.3); ev(K.ad + 0.08, 'swish', 0.24, { pan: 0.3 });
ev(T0.pitch - 0.3, 'deep', 0.32); ev(T0.pitch - 0.2, 'whoosh_f', 0.22);
ev(K.d1 - 0.05, 'whoosh_soft', 0.28); ev(K.d2, 'hit', 0.34);
ev(K.handle, 'pop', 0.3);
// the score: the groove from the first frame under the story; a riser, a heartbeat and a clock under the tension;
// a low drone on the switch; the groove back for the pitch
const MUSIC = { beat: 0.0, tense: K.tense, phone: T0.phone, drop: L.imagine.s, last: T0.pitch, end: L.dm.s };
fs.writeFileSync(path.join(__dirname, 'reel_brez_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC, blur: BLUR }, null, 1));

(async () => {
  const { img } = await renderScreens(FRAMES);
  const SRC = { ...img, ...photos(['brez_lambo', 'brez_lambo_road', 'brez_gwagon', 'brez_bmw', 'brez_lecture']) };
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}
*{margin:0;padding:0}html,body{width:1080px;height:1920px;overflow:hidden;background:#000}</style></head>
<body><canvas id="c" width="1080" height="1920"></canvas>
<script>
const SRC=${JSON.stringify(SRC)};
${fs.readFileSync(path.join(__dirname, 'reel_kit_browser.js'), 'utf8')}
const C=${JSON.stringify(C)}, SHOTS=${JSON.stringify(SHOTS)}, T0=${JSON.stringify(T0)}, CH=${JSON.stringify(CH)}, K=${JSON.stringify(K)}, BLUR=${JSON.stringify(BLUR)};
const LN=${JSON.stringify(L)}, LW=${JSON.stringify(LW)}, BEATS=${JSON.stringify(BEATS)}, NUM=${NUM}, FPS=30;
${fs.readFileSync(path.join(__dirname, 'reel_phone_kit.js'), 'utf8')}
${fs.readFileSync(path.join(__dirname, 'reel_brez_scene.js'), 'utf8')}
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','500 40px Body','600 40px Body','700 40px Body','40px Mono'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([window.ready,fontsReady]).then(()=>prepare());
</script></body></html>`;
  await render(html, { frames: FRAMES_DIR, out: OUT, end: C.end, flag, list });
})();
