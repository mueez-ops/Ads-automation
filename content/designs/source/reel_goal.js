// Mez Media reel: "2,000 clicks. Zero enquiries." The ad wasn't broken: the campaign goal was Traffic, so Meta found
// people who click. Apple-style stages (light grey, then black once we look inside the campaign) with the iPhones from
// reel_goal_screens.js; written hook heading on frame 0 that folds into the results screen, captions one word at a
// time just below the centre, true motion blur on every fast move.
// Timing: reel_goal_cues.json (reel_goal_vo.py). Writes reel_goal_events.json for reel_goal_audio.py.
// Usage: node reel_goal.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, FONT_CSS } = require('./reel_kit');
const { screens } = require('./reel_goal_screens');

const [FRAMES, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_goal_cues.json'), 'utf8'));
const Wd = (line) => C.words.filter((w) => w.line === line);
const at = (line, i) => Wd(line)[i].s;
const L = C.lines;

// ---------- captions: one word at a time (short words ride with their neighbour) ----------
const HL = new Set(['zero', 'wrong', 'nothing', 'exactly', 'Traffic', 'Leads', 'enquiries']);
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
CH.splice(CH.findIndex((c) => c.line === 'ask'));    // the last line is on screen as big type already

// ---------- the edit ----------
const PICK_IN = +(L.not.e - 0.05).toFixed(3), END_CARD = +(L.ask.e + 0.17).toFixed(3);
const SHOTS = [
  ['hook', 0, L.photo.s, 'none'],             // the written hook folds into his results: 2,000 clicks, 0 enquiries, the goal hidden
  ['tweak', L.photo.s, L.because.s, 'none'],  // he changes the photo, the headline, the audience; clicks keep coming, still 0
  ['because', L.because.s, L.traffic.s, 'circle'],   // into the campaign (black): the hidden goal
  ['traffic', L.traffic.s, PICK_IN, 'none'],  // the goal was Traffic: Meta finds the people who click, not the ones who enquire
  ['leads', PICK_IN, L.ask.s, 'none'],        // switch the goal to Leads: Meta goes after the people who enquire
  ['ask', L.ask.s, END_CARD, 'cut'],          // "Ask for enquiries, not clicks."
  ['end', END_CARD, C.end, 'pushU'],          // logo + follow
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// key moments the scene and the sound both use
const K = {
  titleOut: 0.85, zero: at('zero', 0), enq: at('zero', 1), push: at('wrong', 0), wrong: at('wrong', 5),
  nav: L.photo.s, photo: at('photo', 4) - 0.06, headline: at('headline', 1) - 0.04, sheet: at('audience', 0), chips: at('audience', 2),
  back: L.audience.e + 0.03, count: L.nothing.s, nothing: at('nothing', 1),
  exactly: at('because', 5), reveal: at('traffic', 1), gridIn: at('traffic', 2), clickers: at('traffic', 6), notE: at('not', 0), enquire: at('not', 3),
  tap: at('leads', 1), gridBack: at('leads', 2), scan: at('leads', 4), ones: at('leads', 8), fill: at('leads', 10), form: at('leads', 13),
  ask: at('ask', 0), enqW: at('ask', 2), notC: at('ask', 3), follow: END_CARD + 0.12, followTap: END_CARD + 0.6,
};

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[K.titleOut - 0.02, K.titleOut + 0.62, 8], [K.push - 0.02, K.push + 1.0, 4], [K.nav - 0.02, K.nav + 0.45, 8], [K.photo - 0.02, K.photo + 0.4, 8],
  [K.headline - 0.02, K.headline + 0.35, 6], [K.sheet - 0.02, K.sheet + 0.4, 6], [K.back - 0.02, K.back + 0.55, 8], [T0.because + 0.28, T0.because + 1.4, 4],
  [K.reveal - 0.02, K.reveal + 0.4, 4], [K.gridIn - 0.02, K.gridIn + 0.6, 8], [K.clickers + 0.2, K.clickers + 1.1, 6], [PICK_IN - 0.02, PICK_IN + 0.45, 8],
  [K.gridBack - 0.02, K.gridBack + 0.45, 8], [K.fill - 0.02, K.fill + 0.95, 6]];
SHOTS.forEach((sh) => { if (['pushU', 'circle'].includes(sh.tin)) BLUR.push([sh.s - 0.2, sh.s + 0.24, 8]); });

// ---------- sound design (reel_goal_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
ev(0.03, 'deep', 0.5); ev(0.06, 'hit', 0.45);
ev(K.titleOut + 0.05, 'swish', 0.4); ev(K.titleOut + 0.1, 'whoosh_c', 0.5); ev(K.titleOut + 0.5, 'thump', 0.3); ev(K.titleOut + 0.52, 'pop', 0.3);
ev(K.zero - 0.03, 'tick', 0.25); ev(K.enq, 'select', 0.25);
ev(K.push, 'whoosh_soft', 0.3); ev(K.wrong, 'select', 0.3);
ev(K.nav, 'whoosh_b', 0.45); ev(K.photo, 'swish', 0.35, { pan: -0.3 }); ev(K.headline, 'tick', 0.3); ev(K.headline + 0.02, 'pop', 0.2);
ev(K.sheet, 'whoosh_soft', 0.3, { pan: 0.2 }); ev(K.chips, 'pop', 0.25); ev(K.chips + 0.08, 'tick', 0.2);
ev(K.back, 'swish', 0.35, { pan: 0.3 }); for (let i = 0; i < 6; i++) ev(K.count + 0.06 + i * 0.09, 'tick', 0.12, { pan: -0.2 });
ev(K.nothing - 0.02, 'arrow', 0.22);
ev(T0.because, 'whoosh_e', 0.5); ev(T0.because + 0.02, 'deep', 0.5); ev(K.exactly, 'select', 0.25);
ev(K.reveal - 0.03, 'hit', 0.42); ev(K.reveal, 'sparkle', 0.3); ev(K.reveal + 0.05, 'zoom', 0.3);
ev(K.gridIn, 'whoosh_d', 0.45); ev(K.gridIn + 0.15, 'pop', 0.2);
for (let i = 0; i < 9; i++) ev(K.clickers + 0.27 + i * 0.08, 'tick', 0.14, { pan: -0.45 });
ev(K.notE - 0.02, 'pop', 0.25, { pan: 0.4 }); ev(K.enquire, 'select', 0.2, { pan: 0.3 });
ev(PICK_IN, 'whoosh_c', 0.45); ev(K.tap, 'tap', 0.45, { pan: 0.2 }); ev(K.tap + 0.05, 'check', 0.35);
ev(K.gridBack, 'whoosh_d', 0.4); ev(K.scan, 'riser', 0.03, { d: K.ones - K.scan });
for (let i = 0; i < 5; i++) ev(K.fill + 0.4 + i * 0.09, 'pop', 0.22 + 0.02 * i, { pan: 0.35 });
ev(K.fill + 0.78, 'chime', 0.25);
ev(T0.ask - 0.08, 'deep', 0.45); ev(T0.ask - 0.03, 'whoosh_f', 0.28);
ev(END_CARD, 'whoosh_f', 0.5); ev(END_CARD + 0.08, 'sting', 0.45); ev(K.follow + 0.2, 'pop', 0.35); ev(K.followTap, 'tap', 0.45); ev(K.followTap + 0.06, 'check', 0.35);
const MUSIC = { drop: T0.because, back: K.reveal, end: END_CARD };
fs.writeFileSync(path.join(__dirname, 'reel_goal_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC, blur: BLUR }, null, 1));

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
${fs.readFileSync(path.join(__dirname, 'reel_goal_scene.js'), 'utf8')}
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','500 40px Body','600 40px Body','700 40px Body'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([window.ready,fontsReady]).then(()=>prepare());
</script></body></html>`;
  await render(html, { frames: FRAMES, out: OUT, end: C.end, flag, list });
})();
