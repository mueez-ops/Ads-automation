// Mez Media story reel: "Alex spent $2,000 on Meta ads. Not one customer." His daughter finds the problem in ten
// seconds: the "Book now" button on his site didn't work on phones. A person-led story: full-bleed photos of Alex and
// Sara (free Pexels photos, labelled as an example story on screen) cut with the iPhone screens from
// reel_alex_screens.js. Hook text and name card on frame 0, captions one word at a time below the centre.
// Timing: reel_alex_cues.json (reel_alex_vo.py). Writes reel_alex_events.json for reel_alex_audio.py.
// Usage: node reel_alex.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, FONT_CSS } = require('./reel_kit');
const { screens } = require('./reel_alex_screens');

const [FRAMES, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_alex_cues.json'), 'utf8'));
const Wd = (line) => C.words.filter((w) => w.line === line);
const at = (line, i) => Wd(line)[i].s;
const L = C.lines;
// photos (Pexels 7534380, 7534382, 7534793, 4144288, 4144290), graded, in source/photos
const PHOTOS = ['alex_hook', 'alex_grimace', 'alex_happy', 'sara_smile', 'sara_phone'];

// ---------- captions: one word at a time (short words ride with their neighbour) ----------
// "+" words were spoken but ride with the word before them ("$20" covers "twenty dollars"); the hook and the last
// line are on screen as big type, so they get no captions
const HL = new Set(['ten', 'everything', 'nothing', 'phones', 'dead', 'ringing']);
const QUIET = new Set(['spent', 'none', 'before']);
const words = [];
C.words.forEach((w) => { if (w.w === '+') words[words.length - 1].e = w.e; else words.push({ ...w }); });
const CH = [];
Object.keys(L).filter((line) => !QUIET.has(line)).forEach((line) => {
  const ws = words.filter((w) => w.line === line);
  let i = 0;
  while (i < ws.length) {
    const ch = [ws[i]];
    let j = i;
    const shown = (k) => (k + 1 < ws.length ? ws[k + 1].s : ws[k].e) - ws[k].s;
    while (j + 1 < ws.length && shown(j) < 0.14 && !HL.has(ws[j + 1].w) && !HL.has(ws[j].w)) ch.push(ws[++j]);
    CH.push({ text: ch.map((w) => w.w).join(' '), s: +ch[0].s.toFixed(3), last: ch[ch.length - 1].e, line, hl: ch.some((w) => HL.has(w.w)) });
    i = j + 1;
  }
});
CH.forEach((c, i) => {
  const nx = CH[i + 1];
  c.e = +(nx && nx.line === c.line ? nx.s : Math.min(nx ? nx.s : C.end, c.last + 0.3)).toFixed(3);
  delete c.last;
});

// ---------- the edit ----------
const GRAB_END = +(at('grabbed', 5) - 0.04).toFixed(3), RING = +(at('fixed', 8) - 0.06).toFixed(3), END_CARD = +(C.voice_end + 0.08).toFixed(3);
const SHOTS = [
  ['alex', 0, L.found.s, 'none'],             // Alex at his phone; "$2,000 on ads. 0 customers."; who he is
  ['sara', L.found.s, L.tried.s, 'pushL'],    // his daughter; ten seconds on a stopwatch
  ['edits', L.tried.s, L.still.s, 'pushU'],   // new photo, $20 off, new audience
  ['still', L.still.s, L.switch.s, 'cut'],    // Alex, fed up
  ['switch', L.switch.s, L.grabbed.s, 'pushU'],   // $2,000 spent, 0 customers; his thumb over the switch
  ['grab', L.grabbed.s, GRAB_END, 'pushL'],   // Sara takes the phone; into the screen
  ['site', GRAB_END, L.months.s, 'cut'],      // his booking page: "Book now", nothing, again nothing; the button is broken
  ['months', L.months.s, L.dead.s, 'cut'],    // two months go by
  ['dead', L.dead.s, L.fixed.s, 'none'],      // every click runs into the broken button
  ['fixed', L.fixed.s, RING, 'circle'],       // fixed: booked; Friday's bookings
  ['ring', RING, L.before.s, 'pushL'],        // Alex on the phone to a new customer
  ['lesson', L.before.s, END_CARD, 'cut'],    // "Before you blame your ads, try booking yourself, on your phone."
  ['end', END_CARD, C.end, 'pushU'],          // logo + follow
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// key moments the scene and the sound both use
const K = {
  card: 0.35, zero: at('none', 2), ten: at('found', 6),
  photo: at('photos', 1) - 0.06, price: at('off', 0), sheet: at('audience', 0), chips: at('audience', 2),
  sw: at('switch', 5), hover: at('switch', 8), zoom: GRAB_END - 0.45,
  tap1: at('tapped', 2), tap2: at('nothing', 0), crack: at('broken', 2), phones: at('broken', 5),
  m1: at('months', 0), m2: at('months', 1), click: at('dead', 1), deadE: at('dead', 3),
  fix: at('fixed', 1), booked: at('fixed', 4), friday: at('fixed', 6), ringing: at('fixed', 11),
  l1: at('before', 0), l1b: at('before', 3), l2: at('before', 5), l2b: at('before', 7), l3: at('before', 8), follow: END_CARD + 0.1, followTap: END_CARD + 0.5,
};

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[T0.edits, T0.edits + 0.7, 8], [K.photo - 0.02, K.photo + 0.36, 8], [K.price - 0.02, K.price + 0.3, 6], [K.sheet - 0.02, K.sheet + 0.36, 6],
  [T0.switch, T0.switch + 0.7, 8], [K.zoom - 0.02, GRAB_END + 0.4, 8], [L.broken.s - 0.02, L.broken.s + 0.6, 6], [K.m1 - 0.02, L.dead.s + 0.3, 4],
  [L.dead.s, L.fixed.s, 4], [K.booked - 0.1, K.booked + 0.45, 10], [K.friday - 0.02, K.friday + 0.6, 4], [RING + 0.2, RING + 0.6, 6]];
SHOTS.forEach((sh) => { if (['pushU', 'pushL', 'circle'].includes(sh.tin)) BLUR.push([sh.s - 0.2, sh.s + 0.24, 8]); });

// ---------- sound design (reel_alex_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
ev(0.03, 'deep', 0.5); ev(0.06, 'hit', 0.4); ev(K.card + 0.05, 'swish', 0.28); ev(K.zero, 'thump', 0.3);
ev(T0.sara, 'whoosh_b', 0.5); ev(T0.sara + 0.3, 'pop', 0.2);
for (let i = 0; i < 6; i++) ev(K.ten + 0.05 + i * 0.1, 'tick', 0.16, { pan: 0.35 });
ev(K.ten + 0.66, 'select', 0.3, { pan: 0.35 });
ev(T0.edits, 'whoosh_c', 0.45); ev(T0.edits + 0.5, 'thump', 0.25);
ev(K.photo, 'swish', 0.32, { pan: -0.3 }); ev(K.price, 'pop', 0.3); ev(K.price + 0.05, 'tick', 0.2); ev(K.sheet, 'whoosh_soft', 0.3, { pan: 0.2 }); ev(K.chips, 'pop', 0.22);
ev(T0.still - 0.02, 'hit', 0.4); ev(T0.still, 'deep', 0.35);
ev(T0.switch, 'whoosh_c', 0.4); ev(K.sw - 0.6, 'riser', 0.03, { d: T0.grab - K.sw + 0.6 });
ev(T0.grab, 'whoosh_e', 0.5); ev(T0.grab + 0.02, 'hit', 0.3); ev(K.zoom, 'zoom', 0.4);
ev(K.tap1, 'tap', 0.45); ev(K.tap2, 'tap', 0.45); ev(K.tap2 + 0.06, 'thump', 0.3);
ev(K.crack - 0.02, 'hit', 0.42); ev(K.crack, 'swish', 0.3);
ev(T0.months, 'deep', 0.4); ev(K.m1 + 0.12, 'swish', 0.22); ev(K.m2 + 0.08, 'swish', 0.22);
ev(T0.dead, 'whoosh_d', 0.35); for (let i = 0; i < 6; i++) ev(T0.dead + 0.4 + i * 0.17, 'pop', 0.14, { pan: i % 2 ? 0.4 : -0.4 });
ev(T0.fixed, 'whoosh_f', 0.4); ev(K.fix, 'sparkle', 0.32); ev(K.booked - 0.05, 'tap', 0.4); ev(K.booked + 0.1, 'check', 0.38); ev(K.booked + 0.14, 'chime', 0.32);
for (let i = 0; i < 4; i++) ev(K.friday + 0.05 + i * 0.13, 'pop', 0.2 + 0.03 * i);
ev(RING, 'whoosh_b', 0.4); ev(RING + 0.18, 'ring', 0.22); ev(RING + 0.78, 'ring', 0.2);
ev(T0.lesson - 0.04, 'deep', 0.4); ev(K.l2 - 0.3, 'whoosh_soft', 0.18);
ev(END_CARD, 'whoosh_f', 0.45); ev(END_CARD + 0.06, 'sting', 0.4); ev(K.follow + 0.15, 'pop', 0.3); ev(K.followTap, 'tap', 0.4); ev(K.followTap + 0.06, 'check', 0.3);
// the score follows the story: a heartbeat under the hook, the beat while he tries everything, nothing on "Still
// nothing.", the heartbeat again at the switch, a dark pad when Sara takes the phone, silence on "Nothing.", the beat
// back (in a major key) when he fixes it
const MUSIC = { full: T0.edits, still: T0.still, sw: T0.switch, drop: T0.grab, hush: K.tap2 - 0.05, after: L.broken.s, back: T0.fixed, end: END_CARD };
fs.writeFileSync(path.join(__dirname, 'reel_alex_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC, blur: BLUR }, null, 1));

(async () => {
  const { img, rects } = await screens();
  PHOTOS.forEach((n) => { img[n] = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'photos', n + '.jpg')).toString('base64'); });
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}
*{margin:0;padding:0}html,body{width:1080px;height:1920px;overflow:hidden;background:#000}</style></head>
<body><canvas id="c" width="1080" height="1920"></canvas>
<script>
const SRC=${JSON.stringify(img)};
${fs.readFileSync(path.join(__dirname, 'reel_kit_browser.js'), 'utf8')}
const C=${JSON.stringify(C)}, SHOTS=${JSON.stringify(SHOTS)}, T0=${JSON.stringify(T0)}, CH=${JSON.stringify(CH)}, K=${JSON.stringify(K)}, BLUR=${JSON.stringify(BLUR)};
const LN=${JSON.stringify(L)}, RECT=${JSON.stringify(rects)}, FPS=30;
${fs.readFileSync(path.join(__dirname, 'reel_phone_kit.js'), 'utf8')}
${fs.readFileSync(path.join(__dirname, 'reel_alex_scene.js'), 'utf8')}
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','500 40px Body','600 40px Body','700 40px Body'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([window.ready,fontsReady]).then(()=>prepare());
</script></body></html>`;
  await render(html, { frames: FRAMES, out: OUT, end: C.end, flag, list });
})();
