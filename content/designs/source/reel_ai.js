// Mez Media reel: "You type a question to AI. It never reads a single word of it." The Face ID reel's format (it
// held viewers best): a paradox hook with the voice moving up and down, then the mechanism one picture per line on
// one continuous 3D camera, the loop closed, a beat of tension and the switch: "You've just watched this reel for
// 34 seconds. Imagine your ad held people that long."
// The journey of one prompt, "Why is the sky blue?": typed on the phone, fired through fiber as light to a data
// center, chopped into tokens (GPT-4's real tokenizer: 10445 374 279 13180 6437 30), each token a number, each number
// a list of thousands of numbers, up through the layers where every token looks back at the ones before it, on GPUs
// in a hall of racks; at the top a score for every token, one picked, and round again, token by token, until the
// answer, "Air scatters blue light more than red.", types itself out on the phone. Captions at the top as in the
// Face ID reel: the phrase builds word by word, the word being said in white, the key word in a blue selection box.
// Facts and sources: reel_ai_vo.py. Timing: reel_ai_cues.json. Writes reel_ai_events.json for reel_ai_audio.py.
// Usage: node reel_ai.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, FONT_CSS } = require('./reel_kit');
const { FRAMES, renderScreens } = require('./phone_screens');

const [FRAMES_DIR, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_ai_cues.json'), 'utf8'));
const L = C.lines;
const words = [];
C.words.forEach((w) => { if (w.w === '+') words[words.length - 1].e = w.e; else words.push({ ...w }); });
const Wd = (line) => words.filter((w) => w.line === line);
const at = (line, i) => Wd(line)[i].s;
const NUM = +Wd('watched')[6].w;                      // the seconds said on the switch (the real time at that word)

// the prompt and the answer, as GPT-4's tokenizer (tiktoken cl100k_base) splits them
const PROMPT = [['Why', 10445], [' is', 374], [' the', 279], [' sky', 13180], [' blue', 6437], ['?', 30]];
const ANSWER = [['Air', 26777], [' sc', 1156], ['atters', 10385], [' blue', 6437], [' light', 3177], [' more', 810], [' than', 1109], [' red', 2579], ['.', 13]];

// ---------- captions: at the top, the phrase builds word by word ----------
const HL = new Set(['ai', 'never', 'one', 'seconds', 'fiber-optic', 'light', 'tokens', '4', 'number', 'thousands', 'layers', 'back',
  'billions', 'scores', 'again', 'time', 'themselves', 'math']);
const SKIP = new Set(['scale', 'dm']);               // the pitch is its own big type
const MAXC = 22;
const CH = [];
Object.keys(L).filter((line) => !SKIP.has(line)).forEach((line) => {
  let cur = null;
  const close = () => { if (cur) CH.push(cur); cur = null; };
  Wd(line).forEach((w) => {
    if (!cur) cur = { line, s: w.s, rows: [[]] };
    let row = cur.rows[cur.rows.length - 1];
    const len = row.reduce((n, q) => n + q.w.length + 1, 0) + w.w.length;
    if (row.length && len > MAXC) { if (cur.rows.length === 2) { close(); cur = { line, s: w.s, rows: [[]] }; } else cur.rows.push([]); row = cur.rows[cur.rows.length - 1]; }
    row.push({ w: w.w, s: w.s, e: w.e, hl: HL.has(w.w.toLowerCase()) && (w.w !== 'one' || line === 'notone') });
  });
  close();
});
CH[0].s = 0; CH[0].rows[0][0].s = -0.1;              // the first word is on the first frame
CH.forEach((c, i) => {
  const nx = CH[i + 1], last = c.rows.flat().slice(-1)[0].e;
  c.e = +Math.min(nx ? nx.s : C.end, nx && nx.line === c.line ? nx.s : last + 0.4).toFixed(3);
});

// ---------- the edit: one 3D world, then the switch ----------
const TENSE = +(L.math.e + 0.08).toFixed(3);
const SHOTS = [
  ['ai', 0, TENSE, 'none'],                   // phone, fiber, data center, tokens, layers, GPUs, scores, back to the phone
  ['tense', TENSE, L.watched.s, 'none'],      // the colour drains, a heartbeat, a clock
  ['phone', L.watched.s, L.scale.s, 'cut'],   // the reel shrinks into a phone; 0:34; then it is your ad
  ['pitch', L.scale.s, C.end, 'cut'],         // "We scale businesses with ads like this. DM us the word teardown..." (loops to the hook)
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// key moments the scene and the sound both use
const K = {
  type0: 0, ai: at('type', 5), never: at('never', 1), word: at('never', 5), notone: L.notone.s, one: at('notone', 1),
  how: L.how.s, send: at('how', 4), seconds: at('how', 7),
  fiber: L.fiber.s, fired: at('fiber', 3), cable: at('fiber', 5), pulses: at('fiber', 8), lightw: at('fiber', 10), dc: at('fiber', 13),
  tokens: L.tokens.s, chopped: at('tokens', 2), tok: at('tokens', 4), four: at('tokens', 8),
  number: L.number.s, becomes: at('number', 2), num: at('number', 4),
  thousands: L.thousands.s, list: at('thousands', 4), thou: at('thousands', 6),
  layers: L.layers.s, model: at('layers', 2), dozens: at('layers', 4), lay: at('layers', 6), every: at('layers', 8), back: at('layers', 11),
  calc: L.calc.s, billions: at('calc', 2), calcs: at('calc', 4), everyT: at('calc', 6),
  scores: L.scores.s, scoresW: at('scores', 2), knows: at('scores', 6), picks: at('scores', 8), pickOne: at('scores', 9),
  again: L.again.s, again1: at('again', 3), again2: at('again', 5), oneTok: at('again', 6),
  types: L.types.s, typeW: at('types', 3), them: at('types', 4),
  math: L.math.s, words: at('math', 4), mathW: at('math', 7),
  tense: TENSE, freeze: +(TENSE - 0.1).toFixed(3), watched: at('watched', 2), num34: at('watched', 6), ad: at('imagine', 2),
  s1: at('scale', 0), s2: at('scale', 3), d1: at('dm', 0), d2: at('dm', 4), d3: at('dm', 5), handle: +(L.dm.e + 0.05).toFixed(3),
};
const BEATS = [0, 1].map((i) => +(TENSE + 0.1 + i * 0.4).toFixed(3));   // the heartbeat under the tension

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[K.send - 0.05, K.fiber + 0.5, 4], [K.lightw - 0.2, K.dc + 0.15, 3], [K.tokens - 0.45, K.tokens - 0.1, 6], [K.tokens - 0.26, K.tokens - 0.1, 10], [K.tokens - 0.1, K.tokens + 0.4, 4], [K.calc - 0.05, K.billions - 0.17, 3],
  [K.types - 0.15, K.types + 0.35, 4], [T0.phone - 0.02, T0.phone + 0.65, 6], [K.d1 - 0.02, K.d1 + 0.4, 4]];

// ---------- sound design (reel_ai_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
for (let i = 0; i < 9; i++) ev(0.05 + i * 0.09, 'key', 0.16, { pan: -0.1 + 0.02 * i });   // typing the question
ev(K.ai, 'pop', 0.2);
ev(K.never - 0.03, 'deep', 0.4); ev(K.word, 'glitch', 0.3); ev(K.one - 0.02, 'thump', 0.45);
ev(K.send - 0.02, 'tap', 0.3); ev(K.send + 0.02, 'whoosh_f', 0.35, { pan: 0.2 }); ev(K.seconds, 'select', 0.2);
ev(K.fired, 'laser', 0.3); for (let i = 0; i < 6; i++) ev(K.pulses + 0.08 * i, 'tick', 0.08 + 0.01 * i, { pan: -0.3 + 0.12 * i }); ev(K.dc, 'pop', 0.26);
ev(K.tokens - 0.1, 'whoosh_c', 0.38); ev(K.tokens + 0.02, 'hit', 0.3);
PROMPT.forEach((_, i) => ev(K.chopped + 0.05 + 0.08 * i, 'chop', 0.24, { pan: -0.4 + 0.16 * i }));
ev(K.four, 'select', 0.22);
PROMPT.forEach((_, i) => ev(K.becomes + 0.06 * i, 'flip', 0.2, { pan: -0.4 + 0.16 * i }));
ev(K.list, 'riser', 0.16, { d: 0.6 }); ev(K.thou, 'sparkle', 0.24);
ev(K.model, 'deep', 0.3); for (let i = 0; i < 10; i++) ev(K.lay + 0.12 * i, 'tick', 0.07 + 0.006 * i, { pan: 0.3 - 0.06 * i }); ev(K.back, 'swish', 0.24);
ev(K.calc - 0.05, 'whoosh_soft', 0.32); for (let i = 0; i < 14; i++) ev(K.billions + 0.05 * i, 'tick', 0.06 + 0.004 * i, { pan: -0.3 + 0.045 * i }); ev(K.everyT, 'pop', 0.26);
ev(K.scoresW, 'scan', 0.26); ev(K.pickOne - 0.02, 'thump', 0.38); ev(K.pickOne, 'select', 0.3);
[K.again1, K.again2, K.oneTok, K.oneTok + 0.25, K.oneTok + 0.45, K.oneTok + 0.62].forEach((t, i) => ev(t, 'pop', 0.2 + 0.01 * i, { pan: -0.2 + 0.08 * i }));
ev(K.types - 0.12, 'whoosh_c', 0.32, { pan: -0.2 }); ANSWER.forEach((_, i) => ev(K.types + 0.2 + 0.12 * i, 'key', 0.14, { pan: -0.1 + 0.03 * i }));   // one per token as it types out
ev(K.words, 'glitch', 0.24); ev(K.mathW - 0.02, 'thump', 0.42);
ev(K.tense, 'riser', 0.2, { d: T0.phone - K.tense }); BEATS.forEach((t) => { ev(t, 'thump', 0.4); ev(t + 0.17, 'thump', 0.24); });
for (let t = K.tense + 0.05; t < T0.phone - 0.1; t += 0.25) ev(t, 'tick', 0.14, { pan: 0.35 });
ev(T0.phone - 0.03, 'deep', 0.45); ev(T0.phone, 'hit', 0.45); ev(T0.phone - 0.05, 'zoom_out', 0.18);
for (let i = 1; i <= NUM; i++) { const t = K.watched + (K.num34 - K.watched) * i / NUM; if (t > at('watched', 3)) ev(t, 'tick', 0.06 + 0.002 * i, { pan: 0.2 }); }
ev(K.num34, 'select', 0.3);
ev(K.ad, 'pop', 0.3); ev(K.ad + 0.08, 'swish', 0.24, { pan: 0.3 });
ev(T0.pitch - 0.3, 'deep', 0.32); ev(T0.pitch - 0.2, 'whoosh_f', 0.22);
ev(K.d1 - 0.05, 'whoosh_soft', 0.28); ev(K.d2, 'hit', 0.34);
ev(K.handle, 'pop', 0.3);
// the score: a low pulse under the hook that drops out on "Not one."; a rise under "So how"; the groove under the
// journey; a riser, a heartbeat and a clock under the tension; a low drone on the switch; the groove for the pitch
const MUSIC = { gap1: K.notone, gap1e: L.notone.e + 0.05, how: L.how.s, groove: L.fiber.s, tense: K.tense, phone: T0.phone, drop: L.imagine.s, last: T0.pitch, end: L.dm.s };
fs.writeFileSync(path.join(__dirname, 'reel_ai_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC, blur: BLUR }, null, 1));

(async () => {
  const { img } = await renderScreens(FRAMES);
  const THREE_SRC = fs.readFileSync(path.join(__dirname, 'vendor', 'three.module.min.js'), 'utf8');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}
*{margin:0;padding:0}html,body{width:1080px;height:1920px;overflow:hidden;background:#000}#gl{position:absolute;left:-5000px}</style></head>
<body><canvas id="c" width="1080" height="1920"></canvas><canvas id="gl" width="1080" height="1920"></canvas>
<script>
const SRC=${JSON.stringify(img)};
${fs.readFileSync(path.join(__dirname, 'reel_kit_browser.js'), 'utf8')}
const C=${JSON.stringify(C)}, SHOTS=${JSON.stringify(SHOTS)}, T0=${JSON.stringify(T0)}, CH=${JSON.stringify(CH)}, K=${JSON.stringify(K)}, BLUR=${JSON.stringify(BLUR)};
const LN=${JSON.stringify(L)}, BEATS=${JSON.stringify(BEATS)}, NUM=${NUM}, FPS=30, PROMPT=${JSON.stringify(PROMPT)}, ANSWER=${JSON.stringify(ANSWER)};
const DEBUGCAM=${process.env.AI_CAM || 'null'};   // AI_CAM='[[x,y,z],[tx,ty,tz],fov]' holds the camera for checks
${fs.readFileSync(path.join(__dirname, 'reel_phone_kit.js'), 'utf8')}
const S={}, LIGHT={};
const imgsReady=window.ready; let threeDone; const threeReady=new Promise(r=>threeDone=r);
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','500 40px Body','600 40px Body','700 40px Body','40px Mono'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([imgsReady,fontsReady,threeReady]).then(()=>prepare());
</script>
<script type="module">
const X = await import(URL.createObjectURL(new Blob([${JSON.stringify(THREE_SRC)}], {type:'text/javascript'})));
await document.fonts.ready;
${fs.readFileSync(path.join(__dirname, 'reel_ai_scene.js'), 'utf8')}
threeDone();
</script></body></html>`;
  await render(html, { frames: FRAMES_DIR, out: OUT, end: C.end, flag, list, gl: true });
})();
