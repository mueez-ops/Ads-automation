// Mez Media reel: "Let me explain what's on the top floors of the Burj Khalifa." A switch reel. The first 16 seconds are
// a travel-facts reel in the look the brief asked for (the tower slowly zooming in under the written hook, a glowing
// highlight on floors 152 to 154, a rounded photo card of The Lounge, bold outlined type in white and yellow). Then a
// beat of tension, and it switches into the Mez Media look: the reel you were watching shrinks into an iPhone,
// "You just watched this reel for 19 seconds", and the same reel turns into your ad.
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

// ---------- the edit ----------
const END_CARD = +(C.voice_end + 0.3).toFixed(3);
const TENSE = +(L.booking.e + 0.02).toFixed(3);
const SHOTS = [
  ['hook', 0, L.floors.s, 'none'],         // the tower, slowly closer, under the written hook
  ['floors', L.floors.s, L.lounge.s, 'none'],   // up to the top: floors 152-154 light up; 585 m measured from below
  ['lounge', L.lounge.s, TENSE, 'none'],   // the card comes out of those floors: The Lounge
  ['tense', TENSE, L.watched.s, 'none'],   // the colour drains, a heartbeat, a clock
  ['phone', L.watched.s, L.run.s, 'cut'],  // black: the reel shrinks into a phone; 0:19; then it is your ad
  ['last', L.run.s, END_CARD, 'cut'],      // "Run ads people actually watch. Then sell."
  ['end', END_CARD, C.end, 'pushU'],       // logo + follow
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// key moments the scene and the sound both use
const K = {
  hookOut: +(L.hook.e + 0.05).toFixed(3), push: +(L.hook.e + 0.1).toFixed(3), bar: at('floors', 0), l152: at('floors', 1), l154: at('floors', 3),
  alt: at('high', 0), altEnd: +(at('high', 1) - 0.05).toFixed(3), card: at('lounge', 0), title: at('lounge', 2), rec: at('record', 1),
  book: at('booking', 8), tense: TENSE, freeze: +(TENSE - 0.1).toFixed(3), watched: at('watched', 2), n19: at('watched', 6), ad: at('imagine', 3),
  l1: at('run', 0), l2: at('run', 3), l3: at('sell', 0), follow: END_CARD + 0.1, followTap: END_CARD + 0.5,
};
const BEATS = [0, 1, 2].map((i) => +(TENSE + 0.12 + i * 0.48).toFixed(3));   // the heartbeat under the tension

// ---------- captions ----------
// the facts half: short phrases in the reference look (white, key words yellow), each word appearing as it is spoken;
// the hook is on screen as written type and "The Lounge" as a title, so they get no phrase of their own
const SPLIT = { floors: [1, 3], high: [3], lounge: [2, 2], record: [3, 3], inside: [1, 2, 4, 2], booking: [6, 3] };
const YELLOW = new Set(['152', '154', '585', 'highest', 'afternoon', 'tea', 'outdoor', 'terrace', 'booking']);
const PHR = [];
Object.entries(SPLIT).forEach(([line, sizes]) => {
  const ws = Wd(line); let i = 0;
  sizes.forEach((n, j) => {
    const g = ws.slice(i, i + n); i += n;
    PHR.push({ line, s: g[0].s, title: line === 'lounge' && j === 1, words: g.map((w) => ({ w: w.w.toUpperCase(), s: w.s, y: YELLOW.has(w.w) })) });
  });
});
PHR.forEach((p, i) => {
  const nx = PHR[i + 1];
  p.e = +(nx && nx.line === p.line ? nx.s : Math.min(nx ? nx.s : TENSE, L[p.line].e + 0.35, TENSE)).toFixed(3);
});
// the switch: one word at a time, just below the centre; the last line is on screen as big type
const HL = new Set(['19']);
const CH = [];
['watched', 'imagine'].forEach((line) => {
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
CH.forEach((c, i) => {
  const nx = CH[i + 1];
  c.e = +(nx && nx.line === c.line ? nx.s : Math.min(nx ? nx.s : C.end, c.last + 0.3, L.run.s)).toFixed(3);
  delete c.last;
});

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[K.push - 0.02, K.push + 1.05, 6], [K.card - 0.02, K.card + 0.55, 6], [K.book - 0.02, K.book + 0.3, 4],
  [K.tense + 1.1, T0.phone, 4], [T0.phone - 0.02, T0.phone + 0.65, 8], [K.ad - 0.02, K.ad + 0.35, 4]];
SHOTS.forEach((sh) => { if (['pushU', 'pushL', 'circle'].includes(sh.tin)) BLUR.push([sh.s - 0.2, sh.s + 0.24, 8]); });

// ---------- sound design (reel_burj_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
ev(0.03, 'deep', 0.4); ev(0.05, 'swish', 0.3);
ev(K.push - 0.05, 'whoosh_c', 0.45); ev(K.push + 0.6, 'zoom', 0.22);
ev(K.bar, 'swish', 0.28, { pan: -0.2 }); ev(K.bar + 0.12, 'select', 0.24); ev(K.l152, 'pop', 0.3, { pan: 0.25 }); ev(K.l154, 'pop', 0.22, { pan: 0.25 });
for (let i = 0; i < 14; i++) ev(K.alt + (K.altEnd - K.alt) * Math.pow(i / 14, 0.75), 'tick', 0.09 + 0.006 * i, { pan: -0.3 });
ev(K.alt, 'riser', 0.16, { d: K.altEnd - K.alt }); ev(K.altEnd, 'sparkle', 0.26);
ev(K.card - 0.08, 'whoosh_soft', 0.35); ev(K.card + 0.1, 'pop', 0.3); ev(K.title, 'hit', 0.32); ev(K.title + 0.02, 'select', 0.2);
ev(K.rec, 'thump', 0.3); ev(K.rec + 0.04, 'sparkle', 0.22);
ev(K.book, 'thump', 0.42); ev(K.book + 0.01, 'hit', 0.3);
ev(K.tense, 'riser', 0.24, { d: T0.phone - K.tense }); BEATS.forEach((t) => { ev(t, 'thump', 0.4); ev(t + 0.17, 'thump', 0.24); });
for (let t = K.tense + 0.05; t < T0.phone - 0.1; t += 0.25) ev(t, 'tick', 0.14, { pan: 0.35 });
ev(T0.phone - 0.03, 'deep', 0.55); ev(T0.phone, 'hit', 0.45); ev(T0.phone + 0.05, 'zoom_out', 0.32);
for (let i = 1; i <= 19; i++) { const t = K.watched + (K.n19 - K.watched) * i / 19; if (t > at('watched', 3)) ev(t, 'tick', 0.07 + 0.003 * i, { pan: 0.2 }); }   // not on "watched"
ev(K.n19, 'select', 0.3);
ev(K.ad, 'pop', 0.3); ev(K.ad + 0.08, 'swish', 0.24, { pan: 0.3 });
ev(T0.last - 0.04, 'deep', 0.35); ev(T0.last, 'whoosh_f', 0.26);
ev(K.l3, 'hit', 0.36);
ev(END_CARD, 'whoosh_f', 0.5); ev(END_CARD + 0.08, 'sting', 0.45); ev(K.follow + 0.2, 'pop', 0.35); ev(K.followTap, 'tap', 0.45); ev(K.followTap + 0.06, 'check', 0.35);
// the score: a light groove under the facts, the beat dropping as the camera climbs; nothing but a riser, a heartbeat
// and a clock under the tension; silence on the switch; the groove back (minor, then major) for the payoff
const MUSIC = { beat: T0.floors, tense: K.tense, phone: T0.phone, drop: L.imagine.s, last: T0.last, end: END_CARD };
fs.writeFileSync(path.join(__dirname, 'reel_burj_events.json'), JSON.stringify({ cues: C, shots: SHOTS, phrases: PHR, captions: CH, events: EV, music: MUSIC, blur: BLUR }, null, 1));

const b64 = (f) => fs.readFileSync(path.join(__dirname, 'fonts', f)).toString('base64');
(async () => {
  const { img } = await renderScreens(FRAMES);
  const SRC = { ...img, ...photos(['burj_tower', 'burj_lounge']) };
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}
@font-face{font-family:Mont;font-weight:900;src:url(data:font/ttf;base64,${b64('Montserrat-Black.ttf')})}
@font-face{font-family:Mont;font-weight:800;src:url(data:font/ttf;base64,${b64('Montserrat-ExtraBold.ttf')})}
*{margin:0;padding:0}html,body{width:1080px;height:1920px;overflow:hidden;background:#000}</style></head>
<body><canvas id="c" width="1080" height="1920"></canvas>
<script>
const SRC=${JSON.stringify(SRC)};
${fs.readFileSync(path.join(__dirname, 'reel_kit_browser.js'), 'utf8')}
const C=${JSON.stringify(C)}, SHOTS=${JSON.stringify(SHOTS)}, T0=${JSON.stringify(T0)}, CH=${JSON.stringify(CH)}, K=${JSON.stringify(K)}, BLUR=${JSON.stringify(BLUR)};
const LN=${JSON.stringify(L)}, PHR=${JSON.stringify(PHR)}, BEATS=${JSON.stringify(BEATS)}, FPS=30;
${fs.readFileSync(path.join(__dirname, 'reel_phone_kit.js'), 'utf8')}
${fs.readFileSync(path.join(__dirname, 'reel_burj_scene.js'), 'utf8')}
const fontsReady=Promise.all(['900 40px Mont','800 40px Mont','800 40px Logo','600 40px Logo','500 40px Body','600 40px Body','700 40px Body'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([window.ready,fontsReady]).then(()=>prepare());
</script></body></html>`;
  await render(html, { frames: FRAMES_DIR, out: OUT, end: C.end, flag, list });
})();
