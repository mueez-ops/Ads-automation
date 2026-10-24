// Mez Media reel: "Let me explain what's on the top floors of the Burj Khalifa." A switch reel. The first 16 seconds
// are a facts reel: the tower slowly zooming in under the written hook, floors 152 to 154 outlined, 585 m measured up
// from the ground, a photo card of The Lounge. Then a beat of tension, and the switch: the reel you were watching
// shrinks into an iPhone, "You just watched this reel for 19 seconds", the same reel turns into your ad, and the pitch:
// "We scale businesses with ads like this. DM us the word teardown for a free ad review." Mez Media's look throughout:
// Inter type, captions one word at a time just below the centre, white pills and outlines over the photo.
// Facts: The Lounge, levels 152-154, 585 m, Guinness World Records "highest lounge in a building" (585.36 m, level
// 154), outdoor terrace, high tea and evening sessions, entry by booking. The 19 is the real time when it is spoken.
// Timing: reel_burj_cues.json (reel_burj_vo.py). Writes reel_burj_events.json for reel_burj_audio.py.
// Usage: node reel_burj.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, FONT_CSS, photos } = require('./reel_kit');
const { FRAMES, renderScreens } = require('./phone_screens');

const [FRAMES_DIR, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_burj_cues.json'), 'utf8'));
const L = C.lines;
// "+" words were spoken but ride with the word before them ("585" covers "five hundred and eighty-five")
const words = [];
C.words.forEach((w) => { if (w.w === '+') words[words.length - 1].e = w.e; else words.push({ ...w }); });
const Wd = (line) => words.filter((w) => w.line === line);
const at = (line, i) => Wd(line)[i].s;

// ---------- captions: one word at a time (short words ride with their neighbour) ----------
// the hook is on screen as written type and the pitch as big type, so they get no captions
const HL = new Set(['585', 'highest', '19']);
const QUIET = new Set(['hook', 'scale', 'dm']);
const CH = [];
Object.keys(L).filter((line) => !QUIET.has(line)).forEach((line) => {
  const ws = Wd(line);
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
const TENSE = +(L.booking.e + 0.02).toFixed(3);
CH.forEach((c, i) => {
  const nx = CH[i + 1];
  c.e = +(nx && nx.line === c.line ? nx.s : Math.min(nx ? nx.s : C.end, c.last + 0.3, c.s < TENSE ? TENSE : L.scale.s)).toFixed(3);
  delete c.last;
});

// ---------- the edit ----------
const END_CARD = +(C.voice_end + 0.3).toFixed(3);
const SHOTS = [
  ['hook', 0, L.floors.s, 'none'],         // the tower, slowly closer, under the written hook
  ['floors', L.floors.s, L.lounge.s, 'none'],   // up to the top: floors 152-154 outlined; 585 m measured from below
  ['lounge', L.lounge.s, TENSE, 'none'],   // the camera drops, the card comes out of those floors: The Lounge
  ['tense', TENSE, L.watched.s, 'none'],   // the colour drains, a heartbeat, a clock
  ['phone', L.watched.s, L.scale.s, 'cut'],   // black: the reel shrinks into a phone; 0:19; then it is your ad
  ['pitch', L.scale.s, END_CARD, 'cut'],   // "We scale businesses with ads like this. DM us the word teardown..."
  ['end', END_CARD, C.end, 'pushU'],       // logo + DM
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// key moments the scene and the sound both use
const K = {
  hookOut: +(L.hook.e + 0.05).toFixed(3), push: +(L.hook.e + 0.1).toFixed(3), ring: at('floors', 0), l152: at('floors', 1),
  alt: at('high', 0), altEnd: +(at('high', 1) - 0.05).toFixed(3), card: at('lounge', 0), title: at('lounge', 3), rec: at('record', 1),
  book: at('booking', 8), tense: TENSE, freeze: +(TENSE - 0.1).toFixed(3), watched: at('watched', 2), n19: at('watched', 6), ad: at('imagine', 3),
  s1: at('scale', 0), s2: at('scale', 3), d1: at('dm', 0), d2: at('dm', 4), d3: at('dm', 5), dmTap: END_CARD + 0.5,
};
const BEATS = [0, 1, 2].map((i) => +(TENSE + 0.12 + i * 0.48).toFixed(3));   // the heartbeat under the tension

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[K.push - 0.02, K.push + 1.05, 6], [K.card - 0.07, K.card + 0.65, 6], [K.tense + 1.1, T0.phone, 4],
  [T0.phone - 0.02, T0.phone + 0.65, 8], [K.ad - 0.02, K.ad + 0.35, 4], [K.d1 - 0.02, K.d1 + 0.4, 4]];
SHOTS.forEach((sh) => { if (['pushU', 'pushL', 'circle'].includes(sh.tin)) BLUR.push([sh.s - 0.2, sh.s + 0.24, 8]); });

// ---------- sound design (reel_burj_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
ev(0.03, 'deep', 0.4); ev(0.05, 'swish', 0.3);
ev(K.push - 0.05, 'whoosh_c', 0.45); ev(K.push + 0.6, 'zoom', 0.22);
ev(K.ring, 'swish', 0.26, { pan: -0.2 }); ev(K.ring + 0.12, 'select', 0.22); ev(K.l152, 'pop', 0.3, { pan: 0.25 });
for (let i = 0; i < 14; i++) ev(K.alt + (K.altEnd - K.alt) * Math.pow(i / 14, 0.75), 'tick', 0.09 + 0.006 * i, { pan: -0.3 });
ev(K.alt, 'riser', 0.16, { d: K.altEnd - K.alt }); ev(K.altEnd, 'pop', 0.26, { pan: -0.25 });
ev(K.card - 0.08, 'whoosh_soft', 0.35); ev(K.card + 0.12, 'pop', 0.28); ev(K.title, 'select', 0.24);
ev(K.rec, 'pop', 0.28, { pan: 0.25 }); ev(K.rec + 0.04, 'sparkle', 0.22);
ev(K.book, 'pop', 0.3, { pan: 0.25 }); ev(K.book + 0.02, 'thump', 0.28);
ev(K.tense, 'riser', 0.24, { d: T0.phone - K.tense }); BEATS.forEach((t) => { ev(t, 'thump', 0.4); ev(t + 0.17, 'thump', 0.24); });
for (let t = K.tense + 0.05; t < T0.phone - 0.1; t += 0.25) ev(t, 'tick', 0.14, { pan: 0.35 });
ev(T0.phone - 0.03, 'deep', 0.55); ev(T0.phone, 'hit', 0.45); ev(T0.phone + 0.05, 'zoom_out', 0.32);
for (let i = 1; i <= 19; i++) { const t = K.watched + (K.n19 - K.watched) * i / 19; if (t > at('watched', 3)) ev(t, 'tick', 0.07 + 0.003 * i, { pan: 0.2 }); }   // not on "watched"
ev(K.n19, 'select', 0.3);
ev(K.ad, 'pop', 0.3); ev(K.ad + 0.08, 'swish', 0.24, { pan: 0.3 });
ev(T0.pitch - 0.04, 'deep', 0.35); ev(T0.pitch, 'whoosh_f', 0.26);
ev(K.d1 - 0.05, 'whoosh_soft', 0.28); ev(K.d2, 'hit', 0.34);
ev(END_CARD, 'whoosh_f', 0.5); ev(END_CARD + 0.08, 'sting', 0.45); ev(K.dmTap - 0.2, 'pop', 0.3); ev(K.dmTap, 'tap', 0.45); ev(K.dmTap + 0.06, 'check', 0.35);
// the score: a light groove under the facts, the beat dropping as the camera climbs; nothing but a riser, a heartbeat
// and a clock under the tension; a low drone on the switch; the groove back for the pitch
const MUSIC = { beat: T0.floors, tense: K.tense, phone: T0.phone, drop: L.imagine.s, last: T0.pitch, end: END_CARD };
fs.writeFileSync(path.join(__dirname, 'reel_burj_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC, blur: BLUR }, null, 1));

(async () => {
  const { img } = await renderScreens(FRAMES);
  const SRC = { ...img, ...photos(['burj_tower', 'burj_lounge']) };
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}
*{margin:0;padding:0}html,body{width:1080px;height:1920px;overflow:hidden;background:#000}</style></head>
<body><canvas id="c" width="1080" height="1920"></canvas>
<script>
const SRC=${JSON.stringify(SRC)};
${fs.readFileSync(path.join(__dirname, 'reel_kit_browser.js'), 'utf8')}
const C=${JSON.stringify(C)}, SHOTS=${JSON.stringify(SHOTS)}, T0=${JSON.stringify(T0)}, CH=${JSON.stringify(CH)}, K=${JSON.stringify(K)}, BLUR=${JSON.stringify(BLUR)};
const LN=${JSON.stringify(L)}, BEATS=${JSON.stringify(BEATS)}, FPS=30;
${fs.readFileSync(path.join(__dirname, 'reel_phone_kit.js'), 'utf8')}
${fs.readFileSync(path.join(__dirname, 'reel_burj_scene.js'), 'utf8')}
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','500 40px Body','600 40px Body','700 40px Body'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([window.ready,fontsReady]).then(()=>prepare());
</script></body></html>`;
  await render(html, { frames: FRAMES_DIR, out: OUT, end: C.end, flag, list });
})();
