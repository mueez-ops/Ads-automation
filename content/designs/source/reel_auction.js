// Mez Media reel: "Nobody tells you a cheaper ad can beat yours on Instagram." Meta's ad auction in 21 seconds: two ads
// for the same candle fly in on the first frame, yours with a £9 bid and theirs with £3, and the cheaper one gets the
// slot; every ad in the feed has won an auction; the winner is the highest total value, built on its words (your bid,
// times how likely that person is to act on it, plus your ad's quality) over a two-bar race with example numbers; so a
// better ad can win with a smaller bid. Then "We scale brands with ads that win this auction" as big type, and a DM to
// @mezmedia_0 with the word TEARDOWN. No end card: it loops back into the hook.
// Facts, in Meta's own words ("How does Facebook use machine learning to deliver ads?", Meta for Business): the ads
// with the highest total value score are shown; advertiser value is the bid multiplied by the estimated action rate,
// and total value combines it with ad quality; "Ads with the highest bid don't always win the auction. Ads with lower
// bids often win if our system predicts a person is more likely to respond to them, or finds that they're higher
// quality." The bids and percentages in the race are an example, and say so on screen.
// Timing: reel_auction_cues.json (reel_auction_vo.py). Writes reel_auction_events.json for reel_auction_audio.py.
// Usage: node reel_auction.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, FONT_CSS, photos } = require('./reel_kit');
const { FRAMES, renderScreens } = require('./phone_screens');

const [FRAMES_DIR, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_auction_cues.json'), 'utf8'));
const L = C.lines;
const words = [];
C.words.forEach((w) => { if (w.w === '+') words[words.length - 1].e = w.e; else words.push({ ...w }); });
const Wd = (line) => words.filter((w) => w.line === line);
const at = (line, i) => Wd(line)[i].s;

// ---------- captions: one word at a time (short words ride with their neighbour) ----------
// the hook is on screen as written type, the pitch and the ask as big type, so they get no captions
const HL = new Set(['auction', 'value', 'quality', 'smaller']);
const QUIET = new Set(['hook', 'pitch', 'dm']);
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
  c.e = +(nx && nx.line === c.line ? nx.s : Math.min(nx ? nx.s : C.end, c.last + 0.3)).toFixed(3);
  delete c.last;
});

// ---------- the edit ----------
const SHOTS = [
  ['hook', 0, L.auction.s, 'none'],          // two ads for the same candle: your £9 bid, their £3 bid; theirs wins the slot
  ['feed', L.auction.s, L.value.s, 'none'],  // a phone rises: every ad in the feed won an auction
  ['value', L.value.s, L.so.s, 'pushL'],     // total value = bid x chance they act + ad quality, over the race
  ['so', L.so.s, L.pitch.s, 'none'],         // the better ad wins with the smaller bid
  ['pitch', L.pitch.s, L.dm.s, 'cut'],       // "We scale brands with ads that win this auction."
  ['dm', L.dm.s, C.end, 'pushU'],            // a DM to @mezmedia_0: TEARDOWN (loops to the hook)
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// key moments the scene and the sound both use
const K = {
  in: 0.45, bid1: 0.3, bid2: 0.55, cheap: at('hook', 4), beat: at('hook', 7), yours: at('hook', 8), hookOut: +(L.hook.e + 0.05).toFixed(3),
  won: at('auction', 5), first: at('auction', 8),
  winner: at('value', 2), total: at('value', 9),
  fBid: at('formula', 1), fTimes: at('formula', 2), fLikely: at('formula', 4), fPlus: at('formula', 12), fQual: at('formula', 15),
  better: at('so', 2), win: at('so', 5), smaller: at('so', 8),
  s1: at('pitch', 0), s2: at('pitch', 3), s3: at('pitch', 6),
  d1: at('dm', 0), type: at('dm', 4), send: +(at('dm', 5) + 0.05).toFixed(3), d2: at('dm', 7),
};

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[0, K.in + 0.1, 8], [K.beat - 0.03, K.beat + 0.25, 4], [T0.feed - 0.02, T0.feed + 0.55, 6], [T0.pitch - 0.02, T0.pitch + 0.4, 4]];
SHOTS.forEach((sh) => { if (['pushU', 'pushL', 'circle'].includes(sh.tin)) BLUR.push([sh.s - 0.02, sh.s + 0.32, 8]); });

// ---------- sound design (reel_auction_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
ev(0.0, 'hit', 0.45); ev(0.02, 'whoosh_c', 0.5); ev(0.05, 'deep', 0.4);
ev(K.bid1, 'pop', 0.3, { pan: -0.3 }); ev(K.bid2, 'pop', 0.3, { pan: 0.3 }); ev(K.cheap, 'select', 0.24, { pan: 0.3 });
ev(K.beat - 0.02, 'thump', 0.42); ev(K.beat, 'hit', 0.3); ev(K.yours, 'swish', 0.22, { pan: -0.3 });
ev(T0.feed, 'whoosh_soft', 0.35); ev(K.won, 'pop', 0.28); ev(K.won + 0.05, 'check', 0.22); ev(K.first, 'pop', 0.28, { pan: 0.2 }); ev(K.first + 0.05, 'check', 0.22);
ev(T0.value, 'whoosh_f', 0.3); ev(K.winner, 'select', 0.2); ev(K.total, 'pop', 0.3);
ev(K.fBid, 'pop', 0.28); ev(K.fBid + 0.08, 'swish', 0.22); ev(K.fTimes, 'pop', 0.24); ev(K.fLikely, 'pop', 0.28); ev(K.fLikely + 0.08, 'whoosh_soft', 0.26);
ev(K.fPlus, 'pop', 0.24); ev(K.fQual, 'pop', 0.28); ev(K.fQual + 0.08, 'swish', 0.22);
ev(K.better, 'sparkle', 0.24); ev(K.win, 'hit', 0.32); ev(K.win + 0.05, 'chime', 0.24);
ev(T0.pitch - 0.04, 'deep', 0.35); ev(T0.pitch, 'whoosh_f', 0.26); ev(K.s3, 'hit', 0.3);
ev(T0.dm, 'whoosh_soft', 0.3);
for (let i = 0; i < 8; i++) ev(K.type + 0.06 * i, 'tick', 0.12 + 0.01 * i, { pan: 0.1 });   // T-E-A-R-D-O-W-N
ev(K.send, 'tap', 0.3); ev(K.send + 0.05, 'whoosh_b', 0.22); ev(K.d2, 'pop', 0.28);
// the score: the groove from the first frame under the auction; a breath before the pitch; the groove back for the
// pitch and the ask, resolving under the last line
const MUSIC = { beat: 0.0, last: T0.pitch, end: L.dm.s };
fs.writeFileSync(path.join(__dirname, 'reel_auction_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC, blur: BLUR }, null, 1));

(async () => {
  const { img } = await renderScreens(FRAMES);
  const SRC = { ...img, ...photos(['candle', 'perfume_arch', 'eiffel_tower']) };
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}
*{margin:0;padding:0}html,body{width:1080px;height:1920px;overflow:hidden;background:#000}</style></head>
<body><canvas id="c" width="1080" height="1920"></canvas>
<script>
const SRC=${JSON.stringify(SRC)};
${fs.readFileSync(path.join(__dirname, 'reel_kit_browser.js'), 'utf8')}
const C=${JSON.stringify(C)}, SHOTS=${JSON.stringify(SHOTS)}, T0=${JSON.stringify(T0)}, CH=${JSON.stringify(CH)}, K=${JSON.stringify(K)}, BLUR=${JSON.stringify(BLUR)};
const LN=${JSON.stringify(L)}, FPS=30;
${fs.readFileSync(path.join(__dirname, 'reel_phone_kit.js'), 'utf8')}
${fs.readFileSync(path.join(__dirname, 'reel_auction_scene.js'), 'utf8')}
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','500 40px Body','600 40px Body','700 40px Body'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([window.ready,fontsReady]).then(()=>prepare());
</script></body></html>`;
  await render(html, { frames: FRAMES_DIR, out: OUT, end: C.end, flag, list });
})();
