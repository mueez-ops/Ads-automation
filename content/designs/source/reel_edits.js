// Mez Media reel: "Stop editing your ads every day." Every big edit sends the ad set back into learning, and Meta needs
// about 50 results in 7 days to finish, so daily edits mean it never does. Apple-style stages (light grey, black for
// the learning meter, which comes back on light for the fix) with the iPhones from reel_edits_screens.js; the written
// hook "7 edits. Still learning." on frame 0 folds into the ad set; captions one word at a time just below the centre;
// true motion blur on every fast move.
// Timing: reel_edits_cues.json (reel_edits_vo.py). Writes reel_edits_events.json for reel_edits_audio.py.
// Usage: node reel_edits.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, FONT_CSS } = require('./reel_kit');
const { screens } = require('./reel_edits_screens');

const [FRAMES, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_edits_cues.json'), 'utf8'));
const Wd = (line) => C.words.filter((w) => w.line === line);
const at = (line, i) => Wd(line)[i].s;
const L = C.lines;

// ---------- captions: one word at a time (short words ride with their neighbour) ----------
// the last line is on screen as big type, so it gets no captions
const HL = new Set(["isn't", 'never', 'selling']);
const QUIET = new Set(['boring']);
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
CH.forEach((c, i) => {
  const nx = CH[i + 1];
  c.e = +(nx && nx.line === c.line ? nx.s : Math.min(nx ? nx.s : C.end, c.last + 0.3, L.boring.s)).toFixed(3);   // gone on the cut to the last line
  delete c.last;
});

// ---------- the edit ----------
const END_CARD = +(C.voice_end + 0.1).toFixed(3);
const SHOTS = [
  ['hook', 0, L.monday.s, 'none'],           // "7 edits. Still learning." folds into the ad set
  ['week', L.monday.s, L.feels.s, 'none'],   // back to Monday: a new headline, a bigger budget, a new audience, each one resets it
  ['feels', L.feels.s, L.isnt.s, 'none'],    // three edits published
  ['isnt', L.isnt.s, L.every.s, 'none'],     // and still 0 of 50
  ['every', L.every.s, L.daily.s, 'circle'], // black: the learning meter, knocked back to 0 by an edit; 50 results in 7 days
  ['daily', L.daily.s, L.pays.s, 'none'],    // edit daily: it never gets there
  ['pays', L.pays.s, L.make.s, 'none'],      // the budget pours into learning, nothing into selling
  ['make', L.make.s, L.boring.s, 'circle'],  // all three changes in one go, then hands off: the meter fills, Active
  ['boring', L.boring.s, END_CARD, 'cut'],   // "Boring ads that keep running beat clever ads that keep restarting."
  ['end', END_CARD, C.end, 'pushU'],         // logo + follow
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// key moments the scene and the sound both use
const K = {
  titleOut: 0.85, rewind: L.monday.s, e1: at('monday', 3), e2: at('tuesday', 3), e3: at('wednesday', 3),
  feels: at('feels', 0), progress: at('feels', 2), isnt: at('isnt', 1),
  edits: at('every', 4), back: at('every', 9) + 0.05, fifty: at('needs', 4), seven: at('needs', 7), finish: at('needs', 10),
  never: at('daily', 4), learnP: at('pays', 4), notS: at('pays', 5),
  c0: L.make.s + 0.5, c1: L.make.s + 0.67, c2: L.make.s + 0.84, go: at('make', 5), toAd: at('leave', 1) - 0.05, done: at('leave', 7) + 0.1,
  l1: at('boring', 0), l2: at('boring', 2), l3: at('boring', 5), l4: at('boring', 8), follow: END_CARD + 0.1, followTap: END_CARD + 0.5,
};
const RESET = [K.e1 + 0.2, K.e2 + 0.2, K.e3 + 0.2];                 // the three edits knock the ad set back into learning
const DAILY = [L.daily.s + 0.35, L.daily.s + 0.95, L.daily.s + 1.55].map((t) => +t.toFixed(3));   // and again, every day
const COINS = Array.from({ length: 7 }, (_, i) => +(L.pays.s + 0.25 + i * 0.2).toFixed(3));         // 7 days of the $35 budget, into learning
const DAYS7 = Array.from({ length: 7 }, (_, i) => +(K.toAd + 0.3 + (i + 1) / 7 * (K.done - K.toAd - 0.4)).toFixed(3));   // the week going by, no edits

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[K.titleOut - 0.02, K.titleOut + 0.62, 8], [K.rewind - 0.02, K.rewind + 0.4, 6],
  ...RESET.map((t) => [t - 0.24, t + 0.3, 4]), [K.feels - 0.02, K.isnt + 0.4, 4],
  [K.back - 0.25, K.back + 0.3, 6], ...DAILY.map((t) => [t - 0.2, t + 0.25, 4]), [L.pays.s - 0.02, L.make.s, 4],
  [K.go - 0.02, K.go + 0.35, 6], [K.toAd - 0.02, K.toAd + 0.45, 8], [K.done - 0.02, K.done + 0.35, 6]];
SHOTS.forEach((sh) => { if (['pushU', 'pushL', 'circle'].includes(sh.tin)) BLUR.push([sh.s - 0.2, sh.s + 0.24, 8]); });

// ---------- sound design (reel_edits_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
ev(0.03, 'deep', 0.5); ev(0.06, 'hit', 0.45);
ev(K.titleOut + 0.05, 'swish', 0.4); ev(K.titleOut + 0.1, 'whoosh_c', 0.5); ev(K.titleOut + 0.5, 'thump', 0.3); ev(K.titleOut + 0.52, 'pop', 0.3);
ev(K.rewind, 'zoom_out', 0.3); for (let i = 0; i < 7; i++) ev(K.rewind + 0.03 + i * 0.045, 'tick', 0.12);
[K.e1, K.e2, K.e3].forEach((e, i) => { ev(e - 0.15, 'tap', 0.4, { pan: 0.2 }); ev(e, 'swish', 0.28, { pan: -0.2 }); ev(e + 0.12, 'pop', 0.26); ev(RESET[i], 'thump', 0.26); ev(RESET[i] + 0.02, 'arrow', 0.14); });
ev(K.feels, 'pop', 0.24); ev(K.feels + 0.12, 'pop', 0.26); ev(K.feels + 0.24, 'pop', 0.28); ev(K.progress, 'chime', 0.2);
ev(K.isnt - 0.03, 'hit', 0.4); ev(K.isnt, 'deep', 0.4);
ev(T0.every, 'whoosh_e', 0.45); ev(T0.every + 0.02, 'deep', 0.4);
for (let i = 0; i < 10; i++) ev(T0.every + 0.5 + i * 0.17, 'tick', 0.1 + 0.005 * i, { pan: 0.3 });
ev(K.back - 0.2, 'whoosh_soft', 0.3, { pan: -0.4 }); ev(K.back, 'hit', 0.4); ev(K.back + 0.02, 'thump', 0.32);
ev(K.fifty, 'select', 0.25); ev(K.seven, 'pop', 0.25); ev(K.finish, 'sparkle', 0.25);
DAILY.forEach((t) => { ev(t - 0.18, 'whoosh_soft', 0.13, { pan: -0.4 }); ev(t, 'thump', 0.2); });
ev(K.never, 'arrow', 0.13);
COINS.forEach((t, i) => ev(t + 0.4, 'pop', 0.16 + 0.015 * i, { pan: -0.35 }));
ev(K.learnP, 'select', 0.22); ev(K.notS, 'thump', 0.28);
ev(T0.make, 'whoosh_e', 0.45);
[K.c0, K.c1, K.c2].forEach((t, i) => ev(t + 0.05, 'pop', 0.22 + 0.03 * i));
ev(K.go, 'tap', 0.42); ev(K.go + 0.1, 'check', 0.32); ev(K.toAd + 0.1, 'swish', 0.3, { pan: 0.3 });
DAYS7.forEach((t, i) => ev(t, 'tick', 0.11 + 0.01 * i, { pan: 0.2 }));
ev(K.done, 'check', 0.38); ev(K.done + 0.05, 'chime', 0.32);
ev(T0.boring - 0.06, 'deep', 0.45); ev(T0.boring - 0.02, 'whoosh_f', 0.28);
ev(END_CARD, 'whoosh_f', 0.5); ev(END_CARD + 0.08, 'sting', 0.45); ev(K.follow + 0.2, 'pop', 0.35); ev(K.followTap, 'tap', 0.45); ev(K.followTap + 0.06, 'check', 0.35);
// the score: the groove under the busy week, a breath on "It isn't.", a heartbeat while the meter keeps resetting,
// the groove back (major) once the changes go in together
const MUSIC = { hush: K.isnt - 0.1, drop: T0.every, back: T0.make, end: END_CARD };
fs.writeFileSync(path.join(__dirname, 'reel_edits_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC, blur: BLUR }, null, 1));

(async () => {
  const { img, rects } = await screens();
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}
*{margin:0;padding:0}html,body{width:1080px;height:1920px;overflow:hidden;background:#000}</style></head>
<body><canvas id="c" width="1080" height="1920"></canvas>
<script>
const SRC=${JSON.stringify(img)};
${fs.readFileSync(path.join(__dirname, 'reel_kit_browser.js'), 'utf8')}
const C=${JSON.stringify(C)}, SHOTS=${JSON.stringify(SHOTS)}, T0=${JSON.stringify(T0)}, CH=${JSON.stringify(CH)}, K=${JSON.stringify(K)}, BLUR=${JSON.stringify(BLUR)};
const LN=${JSON.stringify(L)}, RECT=${JSON.stringify(rects)}, RESET=${JSON.stringify(RESET)}, DAILY=${JSON.stringify(DAILY)}, COINS=${JSON.stringify(COINS)}, DAYS7=${JSON.stringify(DAYS7)}, FPS=30;
${fs.readFileSync(path.join(__dirname, 'reel_phone_kit.js'), 'utf8')}
${fs.readFileSync(path.join(__dirname, 'reel_edits_scene.js'), 'utf8')}
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','500 40px Body','600 40px Body','700 40px Body'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([window.ready,fontsReady]).then(()=>prepare());
</script></body></html>`;
  await render(html, { frames: FRAMES, out: OUT, end: C.end, flag, list });
})();
