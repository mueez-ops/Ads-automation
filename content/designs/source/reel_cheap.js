// Mez Media reel: "The cheaper business lost the customer." Two dog groomers, one cheap, one clear.
// Apple-style stages (light grey and black) with the iPhones from reel_cheap_screens.js; written hook heading on
// frame 0, captions one word at a time just below the centre, true motion blur on every fast move.
// Timing: reel_cheap_cues.json (reel_cheap_vo.py). Writes reel_cheap_events.json for reel_cheap_audio.py.
// Usage: node reel_cheap.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, FONT_CSS } = require('./reel_kit');
const { screens } = require('./reel_cheap_screens');

const [FRAMES, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_cheap_cues.json'), 'utf8'));
const Wd = (line) => C.words.filter((w) => w.line === line);
const at = (line, i) => Wd(line)[i].s;
const L = C.lines;

// ---------- captions: one word at a time (short words ride with their neighbour) ----------
const HL = new Set(['same', 'cheaper', 'expensive', 'price', 'who', 'problem', 'value', 'lesson', 'attractive', 'rescue', 'understand', 'follow']);
const CH = [];
Object.keys(L).forEach((line) => {
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
  c.e = +(nx && nx.line === c.line ? nx.s : Math.min(nx ? nx.s : C.end, c.last + 0.3)).toFixed(3);
  delete c.last;
});

// ---------- the edit ----------
const SHOTS = [
  ['open', 0, L.a_ad.s, 'none'],            // the written hook, then the two ads side by side: price tags, the customer books B
  ['a_ad', L.a_ad.s, L.b_ad.s, 'none'],     // into A's ad: a low price
  ['b_ad', L.b_ad.s, L.a_price.s, 'none'],  // swipe to B's ad: who it is for, the problem it solves
  ['compare', L.a_price.s, L.lesson.s, 'none'],   // both again: A in a price war, B clear
  ['lesson', L.lesson.s, L.rescue.s, 'cut'],      // the lesson: LOW PRICE != ATTRACTIVE OFFER
  ['rescue', L.rescue.s, L.cta.s, 'pushU'],       // A's ad scrolled straight past
  ['cta', L.cta.s, C.end, 'circle'],              // logo + follow
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// key moments the scene and the sound both use
const K = {
  titleOut: 0.85, phonesIn: 0.95, same: at('two', 5), price: at('cheaper', 2), price2: at('cheaper', 2) + 0.18,
  tap: at('chose', 2), expensive: at('chose', 4), low: at('a_ad', 4), who: at('b_ad', 4), what: at('b_ad', 10),
  competed: at('a_price', 1), war: [0, 1, 2, 3].map((i) => at('a_price', 1) + 0.12 + i * 0.22), value: at('b_value', 3), understand: at('b_value', 6),
  lessonQ: at('lesson', 0), lowPrice: at('low', 1), neq: at('low', 3), attractive: at('low', 8), flick: at('rescue', 3),
  follow: at('cta', 0), followTap: at('cta', 3),
};

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[K.titleOut - 0.02, K.phonesIn + 0.75, 8], [T0.a_ad - 0.02, T0.a_ad + 0.55, 8], [T0.b_ad - 0.02, T0.b_ad + 0.5, 8],
  [T0.compare - 0.02, T0.compare + 0.55, 8], [T0.lesson - 0.02, T0.lesson + 0.4, 8], [K.lessonQ + 0.62, K.lowPrice + 0.3, 6],
  [K.neq - 0.02, K.neq + 0.25, 6], [K.attractive - 0.02, K.attractive + 0.25, 6], [K.flick - 0.05, K.flick + 0.8, 8]];
SHOTS.forEach((sh) => { if (['pushU', 'circle'].includes(sh.tin)) BLUR.push([sh.s - 0.2, sh.s + 0.24, 8]); });

// ---------- sound design (reel_cheap_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
ev(0.03, 'deep', 0.5); ev(0.06, 'hit', 0.45);
ev(K.titleOut + 0.05, 'swish', 0.45); ev(K.phonesIn + 0.12, 'whoosh_c', 0.6); ev(K.phonesIn + 0.5, 'thump', 0.35);
ev(K.same + 0.02, 'pop', 0.3);
ev(K.price, 'pop', 0.5, { pan: -0.35 }); ev(K.price2, 'pop', 0.45, { pan: 0.35 });
ev(K.tap, 'tap', 0.6, { pan: 0.3 }); ev(K.tap + 0.1, 'chime', 0.5); ev(K.tap + 0.12, 'check', 0.45); ev(K.tap + 0.15, 'whoosh_soft', 0.25, { pan: -0.3 });
ev(T0.a_ad, 'zoom', 0.6); ev(K.low, 'select', 0.5);
ev(T0.b_ad, 'whoosh_b', 0.6); ev(K.who, 'select', 0.5); ev(K.who + 0.08, 'pop', 0.35); ev(K.what, 'select', 0.5); ev(K.what + 0.08, 'pop', 0.35);
ev(T0.compare, 'zoom_out', 0.6);
K.war.forEach((t, i) => { ev(t, 'tick', 0.42, { pan: -0.4 }); ev(t + 0.05, 'pop', 0.22, { pan: [-0.6, -0.1, -0.7, -0.2][i] }); });
ev(K.value, 'sparkle', 0.35); ev(K.value - 0.05, 'whoosh_soft', 0.3, { pan: 0.35 });
ev(T0.lesson, 'whoosh_e', 0.55); ev(T0.lesson + 0.02, 'deep', 0.5);
ev(K.lowPrice, 'hit', 0.5); ev(K.lowPrice, 'thump', 0.35); ev(K.neq, 'swish', 0.4); ev(K.neq + 0.08, 'hit', 0.42); ev(K.attractive, 'hit', 0.5); ev(K.attractive, 'thump', 0.35);
ev(T0.rescue, 'whoosh_d', 0.6); ev(K.flick + 0.05, 'swish', 0.6); ev(K.flick + 0.1, 'arrow', 0.45);
ev(T0.cta, 'whoosh_f', 0.6); ev(T0.cta + 0.1, 'sting', 0.6); ev(K.follow + 0.2, 'pop', 0.45); ev(K.followTap, 'tap', 0.6); ev(K.followTap + 0.06, 'check', 0.45);
const MUSIC = { drop: T0.lesson, back: T0.rescue, end: T0.cta };
fs.writeFileSync(path.join(__dirname, 'reel_cheap_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC, blur: BLUR }, null, 1));

(async () => {
  const { img, rects } = await screens();
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}
*{margin:0;padding:0}html,body{width:1080px;height:1920px;overflow:hidden;background:#000}</style></head>
<body><canvas id="c" width="1080" height="1920"></canvas>
<script>
const SRC=${JSON.stringify(img)};
${fs.readFileSync(path.join(__dirname, 'reel_kit_browser.js'), 'utf8')}
const C=${JSON.stringify(C)}, SHOTS=${JSON.stringify(SHOTS)}, T0=${JSON.stringify(T0)}, CH=${JSON.stringify(CH)}, K=${JSON.stringify(K)}, BLUR=${JSON.stringify(BLUR)};
const LN=${JSON.stringify(L)}, RECT=${JSON.stringify(rects)}, FPS=30;
${fs.readFileSync(path.join(__dirname, 'reel_phone_kit.js'), 'utf8')}
${fs.readFileSync(path.join(__dirname, 'reel_cheap_scene.js'), 'utf8')}
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','500 40px Body','600 40px Body','700 40px Body'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([window.ready,fontsReady]).then(()=>prepare());
</script></body></html>`;
  await render(html, { frames: FRAMES, out: OUT, end: C.end, flag, list });
})();
