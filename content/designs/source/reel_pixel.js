// Mez Media reel: "If Meta can't see your sales, it can't find you more buyers." A store sells 12 candles and Ads
// Manager shows 0: the tracking code isn't firing on the thank-you page, so Meta never learns who buys. Apple-style
// stages (light grey, black for Meta's guessing) with the iPhones from reel_pixel_screens.js; the written hook
// "12 sales. Meta saw 0." on frame 0 folds into the two phones; captions one word at a time just below the centre;
// true motion blur on every fast move. The store is made up.
// Timing: reel_pixel_cues.json (reel_pixel_vo.py). Writes reel_pixel_events.json for reel_pixel_audio.py.
// Usage: node reel_pixel.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, FONT_CSS } = require('./reel_kit');
const { screens } = require('./reel_pixel_screens');

const [FRAMES, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_pixel_cues.json'), 'utf8'));
const Wd = (line) => C.words.filter((w) => w.line === line);
const at = (line, i) => Wd(line)[i].s;
const L = C.lines;

// ---------- captions: one word at a time (short words ride with their neighbour) ----------
// "+" words were spoken but ride with the word before them ("2-minute" covers "two minute"); the last line is on
// screen as big type, so it gets no captions
const HL = new Set(['0', 'wrong', 'why', 'nothing']);
const QUIET = new Set(['finds']);
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
const END_CARD = +(C.voice_end + 0.1).toFixed(3);
const SHOTS = [
  ['hook', 0, L.store.s, 'none'],             // "12 sales. Meta saw 0." folds into the store's orders and the campaign's purchases
  ['store', L.store.s, L.shopify.s, 'none'],  // the store's phone comes forward; twelve orders come in
  ['shopify', L.shopify.s, L.zero.s, 'none'], // all 12, ticked
  ['zero', L.zero.s, L.guess.s, 'pushL'],     // Ads Manager: 0 purchases
  ['guess', L.guess.s, L.why.s, 'circle'],    // black: Meta guesses who buys, and every guess misses
  ['code', L.why.s, L.fix.s, 'circle'],       // why? the thank-you page, and the tracking code that isn't there
  ['fix', L.fix.s, L.open.s, 'pushU'],        // the 2-minute fix: Events Manager
  ['open', L.open.s, L.nothing.s, 'none'],    // tap Test events; buy from your own store
  ['nothing', L.nothing.s, L.first.s, 'none'],   // back to Test events: nothing
  ['first', L.first.s, L.finds.s, 'none'],    // fixed: the purchase comes through
  ['finds', L.finds.s, END_CARD, 'cut'],      // "Meta finds buyers by watching the ones you already have."
  ['end', END_CARD, C.end, 'pushU'],          // logo + follow
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// key moments the scene and the sound both use
const K = {
  titleOut: 0.85, buyers: at('meta', 11),
  rows: at('store', 2), ring12: at('shopify', 2), tick12: at('shopify', 3), zero: at('zero', 3),
  lift: at('guess', 1) + 0.1, guess0: at('guess', 3), again: at('guess', 6), wrong: at('guess', 9),
  why: at('why', 0), slot: at('code', 1), notF: at('code', 3), firing: at('code', 4), thank: at('code', 7),
  clock: at('fix', 0) + 0.1, tabTap: at('open', 3), toTest: at('open', 4), toShop: at('open', 6), buyTap: at('open', 10), toast: at('open', 11),
  back: L.nothing.s, nothing: at('nothing', 0), fixed: at('first', 0), received: at('first', 2),
  l1: at('finds', 0), l2: at('finds', 3), l3: at('finds', 7), follow: END_CARD + 0.1, followTap: END_CARD + 0.5,
};
// Meta's guesses: when, and which person in the crowd (none of them buys)
const GUESS = [[K.guess0, 9], [K.guess0 + 0.28, 31], [K.guess0 + 0.52, 15], [K.again - 0.04, 40], [K.again + 0.16, 3], [K.again + 0.34, 25],
  [K.again + 0.5, 35], [K.again + 0.64, 12], [K.wrong - 0.05, 20], [K.wrong + 0.08, 28]].map(([t, i]) => [+t.toFixed(3), i]);

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[K.titleOut - 0.02, K.titleOut + 0.62, 8], [T0.store - 0.02, T0.store + 0.6, 8], [K.rows - 0.02, K.rows + 1.5, 4],
  [K.lift - 0.02, K.lift + 0.5, 8], [K.guess0 - 0.02, K.wrong + 0.4, 4], [K.slot - 0.02, K.slot + 0.4, 4],
  [K.tabTap - 0.3, K.tabTap + 0.05, 4], [K.toTest - 0.02, K.toTest + 0.4, 8], [K.toShop - 0.02, K.toShop + 0.4, 8], [K.back - 0.02, K.back + 0.4, 8],
  [K.fixed - 0.02, K.fixed + 0.35, 6], [K.received - 0.02, K.received + 0.35, 6]];
SHOTS.forEach((sh) => { if (['pushU', 'pushL', 'circle'].includes(sh.tin)) BLUR.push([sh.s - 0.2, sh.s + 0.24, 8]); });

// ---------- sound design (reel_pixel_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
ev(0.03, 'deep', 0.5); ev(0.06, 'hit', 0.45);
ev(K.titleOut + 0.05, 'swish', 0.4); ev(K.titleOut + 0.1, 'whoosh_c', 0.5); ev(K.titleOut + 0.5, 'thump', 0.3); ev(K.titleOut + 0.52, 'pop', 0.3, { pan: -0.3 }); ev(K.titleOut + 0.56, 'pop', 0.26, { pan: 0.3 });
ev(K.buyers, 'select', 0.22);
ev(T0.store, 'whoosh_soft', 0.35, { pan: 0.3 });
for (let i = 0; i < 12; i++) ev(K.rows + i * 0.1, 'tick', 0.13 + 0.005 * i, { pan: i % 2 ? 0.2 : -0.2 });
ev(K.ring12, 'swish', 0.25); ev(K.tick12, 'check', 0.35);
ev(T0.zero, 'whoosh_b', 0.45); ev(K.zero - 0.02, 'thump', 0.32); ev(K.zero, 'hit', 0.3);
ev(T0.guess, 'whoosh_e', 0.45); ev(T0.guess + 0.02, 'deep', 0.45); ev(K.lift, 'whoosh_d', 0.35);
GUESS.forEach(([t, i], j) => { ev(t, 'arrow', 0.12, { pan: ((i % 7) - 3) / 4 }); ev(t + 0.22, 'tick', 0.16, { pan: ((i % 7) - 3) / 4 }); });
ev(K.wrong, 'thump', 0.3);
ev(T0.code, 'whoosh_e', 0.45); ev(K.why, 'select', 0.25); ev(K.slot, 'swish', 0.3); ev(K.notF, 'pop', 0.28); ev(K.firing, 'hit', 0.28); ev(K.thank + 0.05, 'swish', 0.22);
ev(T0.fix, 'whoosh_c', 0.45); ev(K.clock, 'pop', 0.28);
ev(K.tabTap, 'tap', 0.42); ev(K.toTest, 'swish', 0.3, { pan: 0.3 }); ev(K.toShop, 'swish', 0.3, { pan: 0.3 }); ev(K.buyTap, 'tap', 0.42); ev(K.toast, 'pop', 0.3);
ev(K.back, 'swish', 0.3, { pan: -0.3 }); ev(K.nothing - 0.02, 'thump', 0.32);
ev(K.fixed, 'pop', 0.3); ev(K.received, 'check', 0.38); ev(K.received + 0.05, 'chime', 0.32);
ev(T0.finds - 0.06, 'deep', 0.45); ev(T0.finds - 0.02, 'whoosh_f', 0.28);
ev(END_CARD, 'whoosh_f', 0.5); ev(END_CARD + 0.08, 'sting', 0.45); ev(K.follow + 0.2, 'pop', 0.35); ev(K.followTap, 'tap', 0.45); ev(K.followTap + 0.06, 'check', 0.35);
// the score: the groove under the setup, a dark pulse while Meta guesses and we look for why, lighter while we fix it,
// a breath on "Nothing?", then the full groove (major) when the purchase comes through
const MUSIC = { drop: T0.guess, fix: T0.fix, hush: K.nothing - 0.06, back: K.received - 0.05, end: END_CARD };
fs.writeFileSync(path.join(__dirname, 'reel_pixel_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC, blur: BLUR }, null, 1));

(async () => {
  const { img, rects } = await screens();
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}
*{margin:0;padding:0}html,body{width:1080px;height:1920px;overflow:hidden;background:#000}</style></head>
<body><canvas id="c" width="1080" height="1920"></canvas>
<script>
const SRC=${JSON.stringify(img)};
${fs.readFileSync(path.join(__dirname, 'reel_kit_browser.js'), 'utf8')}
const C=${JSON.stringify(C)}, SHOTS=${JSON.stringify(SHOTS)}, T0=${JSON.stringify(T0)}, CH=${JSON.stringify(CH)}, K=${JSON.stringify(K)}, BLUR=${JSON.stringify(BLUR)};
const LN=${JSON.stringify(L)}, RECT=${JSON.stringify(rects)}, GUESS=${JSON.stringify(GUESS)}, FPS=30;
${fs.readFileSync(path.join(__dirname, 'reel_phone_kit.js'), 'utf8')}
${fs.readFileSync(path.join(__dirname, 'reel_pixel_scene.js'), 'utf8')}
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','500 40px Body','600 40px Body','700 40px Body','40px Mono'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([window.ready,fontsReady]).then(()=>prepare());
</script></body></html>`;
  await render(html, { frames: FRAMES, out: OUT, end: C.end, flag, list });
})();
