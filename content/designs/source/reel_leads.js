// Mez Media reel: "47 leads. Zero sales." His ads worked; the leads were the wrong people and nobody followed up.
// Apple-style stages (light grey and black) with the iPhones from reel_leads_screens.js; written hook heading on
// frame 0, captions one word at a time just below the centre, true motion blur on every fast move.
// Timing: reel_leads_cues.json (reel_leads_vo.py). Writes reel_leads_events.json for reel_leads_audio.py.
// Usage: node reel_leads.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, FONT_CSS } = require('./reel_kit');
const { screens } = require('./reel_leads_screens');

const [FRAMES, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_leads_cues.json'), 'utf8'));
const Wd = (line) => C.words.filter((w) => w.line === line);
const at = (line, i) => Wd(line)[i].s;
const L = C.lines;

// ---------- captions: one word at a time (short words ride with their neighbour) ----------
const HL = new Set(['47', 'zero', 'blamed', 'everything', 'half', 'serious', 'problem', 'right', 'following', 'broken', 'follow', 'expensive']);
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
const UNLOCK = +(L.zero.e + 0.04).toFixed(3), SWIPE = +(at('right', 6) - 0.25).toFixed(3);
const SHOTS = [
  ['lock', 0, UNLOCK, 'none'],               // the written hook folds into a "47 leads" tag; leads pour onto his lock screen; $0 sales
  ['chat', UNLOCK, L.off.s, 'none'],         // he unlocks and texts a friend: "Meta ads just don't work."
  ['camps', L.off.s, L.checked.s, 'none'],   // swipes to his campaigns and starts switching them off
  ['inbox', L.checked.s, L.wasnt.s, 'none'], // the phone turns round to his leads: half of them were never buyers
  ['wasnt', L.wasnt.s, L.right.s, 'none'],   // "47 leads" again, crossed out
  ['right', L.right.s, SWIPE, 'none'],       // one good lead: budget, area, ready
  ['follow', SWIPE, L.fix.s, 'none'],        // a reply in 3 minutes and a call booked
  ['fix', L.fix.s, L.cta.s, 'cut'],          // black: leads pour into a cracked funnel; 0 sales
  ['cta', L.cta.s, C.end, 'pushU'],          // logo + follow
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// key moments the scene and the sound both use
const K = {
  titleOut: 0.85, phonesIn: 0.95, notes: [1.02, 1.21, 1.37, 1.51, 1.63, 1.73, 1.82, 1.9], zero: at('zero', 2),
  unlock: UNLOCK, type0: at('blamed', 0) + 0.04, send: at('blamed', 3),
  sw: L.off.s, taps: [at('off', 3), at('off', 4), at('off', 5) - 0.08], hover: at('off', 5) + 0.3, flip: L.checked.s,
  half: at('half', 0), serious: at('half', 3),
  slam: at('wasnt', 1) - 0.06, strike: at('wasnt', 2), grey: at('wasnt', 3),
  ticks: [at('right', 2) + 0.36, at('right', 4), at('right', 5)],
  m1: at('right', 7), m2: at('right', 8), m3: at('right', 9) + 0.12, m4: at('right', 9) + 0.5,
  more: at('fix', 0), broken: at('fix', 5), sales: at('fix', 6), process: at('fix', 7),
  follow: at('cta', 0), followTap: at('cta', 3),
};

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[K.titleOut - 0.02, K.phonesIn + 0.75, 8], [K.notes[0] - 0.02, K.notes[7] + 0.3, 4], [K.zero - 0.02, K.zero + 0.7, 8],
  [K.unlock - 0.02, K.unlock + 0.5, 8], [K.sw - 0.02, K.sw + 0.42, 8], [K.flip - 0.02, K.flip + 0.48, 8], [K.serious - 0.02, K.serious + 0.8, 6],
  [T0.wasnt - 0.02, K.slam + 0.3, 8], [T0.right - 0.02, T0.right + 0.75, 8], [T0.follow - 0.02, T0.follow + 0.45, 8], [T0.fix + 0.02, T0.cta, 3]];
SHOTS.forEach((sh) => { if (['pushU', 'circle'].includes(sh.tin)) BLUR.push([sh.s - 0.2, sh.s + 0.24, 8]); });

// ---------- sound design (reel_leads_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
ev(0.03, 'deep', 0.5); ev(0.06, 'hit', 0.45);
ev(K.titleOut + 0.08, 'swish', 0.45); ev(K.phonesIn + 0.1, 'whoosh_c', 0.55); ev(K.phonesIn + 0.45, 'thump', 0.3);
K.notes.forEach((q, i) => ev(q, 'pop', 0.17 + 0.02 * i, { pan: i % 2 ? 0.3 : -0.3 }));
ev(K.zero - 0.04, 'deep', 0.45); ev(K.zero - 0.02, 'hit', 0.32); ev(K.zero + 0.12, 'zoom', 0.32);
ev(K.unlock + 0.1, 'swish', 0.45); ev(K.unlock + 0.14, 'whoosh_soft', 0.3);
for (let i = 0; i < 9; i++) ev(K.type0 + (i * (K.send - 0.1 - K.type0)) / 8, 'tick', 0.1, { pan: ((i % 3) - 1) * 0.25 });
ev(K.send, 'select', 0.4); ev(K.send + 0.02, 'swish', 0.18);
ev(K.sw, 'whoosh_b', 0.5);
K.taps.forEach((q) => { ev(q, 'tap', 0.38, { pan: 0.3 }); ev(q + 0.05, 'tick', 0.22, { pan: 0.3 }); });
ev(K.flip, 'whoosh_e', 0.55); ev(K.flip + 0.22, 'zoom_out', 0.3);
[0, 1, 2, 3].forEach((j) => ev(K.half + 0.08 * j, 'swish', 0.16, { pan: -0.3 + 0.2 * j }));
ev(K.serious, 'whoosh_soft', 0.35, { pan: -0.4 }); ev(K.serious + 0.34, 'pop', 0.22);
ev(T0.wasnt, 'whoosh_d', 0.45); ev(K.slam, 'hit', 0.45); ev(K.slam, 'thump', 0.35); ev(K.strike, 'swish', 0.35); ev(K.strike + 0.05, 'arrow', 0.2);
ev(T0.right, 'swish', 0.3); ev(T0.right + 0.12, 'whoosh_c', 0.4); ev(T0.right + 0.55, 'thump', 0.25);
K.ticks.forEach((q) => { ev(q, 'check', 0.32, { pan: 0.25 }); ev(q + 0.02, 'pop', 0.14, { pan: 0.25 }); });
ev(T0.follow, 'whoosh_b', 0.55);
ev(K.m1, 'pop', 0.22); ev(K.m1 + 0.14, 'select', 0.2); ev(K.m2 - 0.03, 'pop', 0.28, { pan: 0.3 }); ev(K.m3, 'pop', 0.28, { pan: -0.3 }); ev(K.m4, 'chime', 0.45); ev(K.m4 + 0.03, 'check', 0.35);
ev(T0.fix, 'deep', 0.55); ev(T0.fix + 0.01, 'hit', 0.45); ev(K.more, 'riser', 0.035, { d: K.broken - K.more });
ev(K.broken - 0.04, 'hit', 0.36); ev(K.broken - 0.04, 'thump', 0.32); ev(K.broken - 0.02, 'deep', 0.18); ev(K.sales, 'pop', 0.32);
ev(T0.cta, 'whoosh_f', 0.55); ev(T0.cta + 0.1, 'sting', 0.45); ev(K.follow + 0.2, 'pop', 0.35); ev(K.followTap, 'tap', 0.45); ev(K.followTap + 0.06, 'check', 0.35);
const MUSIC = { drop: T0.fix, back: T0.cta, end: at('cta', 9) };
fs.writeFileSync(path.join(__dirname, 'reel_leads_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC, blur: BLUR }, null, 1));

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
${fs.readFileSync(path.join(__dirname, 'reel_leads_scene.js'), 'utf8')}
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','500 40px Body','600 40px Body','700 40px Body'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([window.ready,fontsReady]).then(()=>prepare());
</script></body></html>`;
  await render(html, { frames: FRAMES, out: OUT, end: C.end, flag, list });
})();
