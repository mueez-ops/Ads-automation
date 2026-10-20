// Mez Media reel: "I'd fix THIS before spending another dollar on ads." Bad offer, not bad ads.
// Written hook heading on frame 0, captions just below centre, true motion blur (sub-frame accumulation),
// 3D-tilted panels, zoom-through transitions. Black, white and greys; red only marks bad numbers.
// Timing: reel_offer_cues.json (reel_offer_vo.py). Writes reel_offer_events.json for reel_offer_audio.py.
// Usage: node reel_offer.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, photos, FONT_CSS } = require('./reel_kit');

const [FRAMES, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_offer_cues.json'), 'utf8'));
const font = (f) => `url(data:font/woff2;base64,${fs.readFileSync(path.join(__dirname, 'fonts', f)).toString('base64')})`;
const Wd = (line) => C.words.filter((w) => w.line === line);
const at = (line, i) => Wd(line)[i].s;
const L = C.lines;

// ---------- captions: one word at a time from "your ads..." on (the hook is the heading itself) ----------
const JOIN = new Set(['cta:tell', 'cta:me']);                     // "tell me below" reads as one beat
const HL = new Set(['expensive', 'offer', 'fine', 'nobody', 'problem', 'solved', 'why', 'targeting', "can't", 'agree', 'disagree']);
const CH = [];
Object.keys(L).filter((k) => k !== 'hook').forEach((line) => {
  const ws = Wd(line);
  let i = 0;
  while (i < ws.length) {
    const ch = [ws[i]];
    let j = i;
    const shown = (k) => (k + 1 < ws.length ? ws[k + 1].s : ws[k].e) - ws[k].s;
    while (j + 1 < ws.length && (JOIN.has(`${line}:${ws[j].w}`) || (shown(j) < 0.14 && !HL.has(ws[j + 1].w) && !HL.has(ws[j].w)))) ch.push(ws[++j]);
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
const LOGO = +(L.cta.e + 0.2).toFixed(3);
const SHOTS = [
  ['dash', 0, L.offer.s, 'none'],               // hook heading + the ad dashboard: cheap clicks, no leads
  ['page', L.offer.s, L.wake.s, 'none'],         // zoomed through the ad preview into the landing page: the vague offer
  ['wake', L.wake.s, L.problem.s, 'pushU'],      // nobody wakes up wanting your service: the notification is swiped away
  ['problem', L.problem.s, L.stop.s, 'whipL'],   // they want a problem solved: before / after slider
  ['rewrite', L.stop.s, L.because.s, 'whipR'],   // the headline is deleted and rewritten as an outcome
  ['target', L.because.s, at('because', 5), 'whipU'],   // better targeting can't fix...
  ['formula', at('because', 5), L.cta.s, 'cut'],        // BAD OFFER != MORE AD SPEND
  ['concept', L.cta.s, LOGO, 'pushU'],           // the improved ad concept + agree / disagree
  ['logo', LOGO, C.end, 'circle'],
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// key moments the scene and the sound both use
const K = {
  thisSlam: at('hook', 2), arrow: 1.22, circle: 1.55,                 // THIS lands on the spoken "this"
  cpc: at('cost', 2) + 0.05, conv: at('cost', 5) + 0.02, dive: L.offer.s - 0.36,
  offerCircle: at('offer', 2), notif: at('wake', 1) + 0.02, swipe: at('wake', 5) + 0.02, lock: L.wake.e - 0.12,
  problemTag: at('problem', 3), solved: at('problem', 4),
  select: at('stop', 1), erase: at('stop', 2), type: at('start', 0) + 0.02, hero: at('start', 2), button: at('start', 4),
  locks: [at('because', 1), at('because', 2) + 0.2, at('because', 2) + 0.45], fail: at('because', 3),
  bad: T0.formula, neq: T0.formula + 0.26, spend: T0.formula + 0.48,
  card: T0.concept, agree: at('cta', 0), disagree: at('cta', 2), tap: at('cta', 2) + 0.4, below: at('cta', 3),
};

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[0, 0.62, 8], [K.dive - 0.05, L.offer.s + 0.08, 10], [K.swipe - 0.05, K.swipe + 0.4, 8], [K.bad - 0.02, K.spend + 0.3, 6],
  [T0.concept - 0.02, T0.concept + 0.55, 8], [LOGO - 0.15, LOGO + 0.45, 6], [T0.wake - 0.02, T0.wake + 0.45, 8]];
SHOTS.forEach((sh) => { if (['whipL', 'whipR', 'whipU', 'pushU'].includes(sh.tin)) BLUR.push([sh.s - 0.2, sh.s + 0.22, 8]); });

// ---------- sound design (reel_offer_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
const TRANS = { whipL: 'whoosh_b', whipR: 'whoosh_a', whipU: 'whoosh_d', pushU: 'whoosh_c', circle: 'whoosh_f' };
SHOTS.forEach((sh) => { if (TRANS[sh.tin]) ev(sh.s, TRANS[sh.tin], 0.7); });
ev(0.04, 'deep', 0.55); ev(0.42, 'zoom_out', 0.6);
[0.12, K.thisSlam + 0.12, K.thisSlam + 0.22].forEach((t) => ev(t, 'pop', 0.35));
ev(K.thisSlam, 'hit', 0.6); ev(K.thisSlam, 'thump', 0.45);
[0.35, 0.5, 0.66, 0.82, 0.98].forEach((t, i) => ev(t, 'tick', 0.3, { pan: -0.4 + i * 0.2 }));
ev(K.arrow, 'scribble', 0.5, { len: 0.32 }); ev(K.circle, 'scribble', 0.5, { len: 0.36 });
ev(at('cost', 0) + 0.1, 'whoosh_soft', 0.4);
ev(K.cpc + 0.05, 'check', 0.6); ev(K.cpc + 0.08, 'pop', 0.4);
ev(K.conv, 'scribble', 0.5, { len: 0.3 }); ev(K.conv + 0.02, 'whoosh_soft', 0.3);
ev(L.offer.s, 'zoom', 0.75);
ev(K.offerCircle, 'scribble', 0.55, { len: 0.42 }); ev(K.offerCircle + 0.35, 'scribble', 0.35, { len: 0.25 });
ev(T0.wake + 0.05, 'rise', 0.5); ev(K.notif, 'ping', 0.7);
ev(K.swipe + 0.12, 'swish', 0.55); ev(K.swipe + 0.12, 'arrow', 0.5); ev(K.lock, 'lock', 0.55);
ev(K.problemTag, 'thump', 0.45); ev(K.problemTag, 'pop', 0.45);
ev(K.solved + 0.1, 'slide', 0.55); ev(K.solved + 0.3, 'chime', 0.5); ev(K.solved + 0.32, 'check', 0.5);
ev(K.select, 'select', 0.6); ev(K.erase, 'keys', 0.5, { len: 0.26 }); ev(K.type, 'keys', 0.5, { len: 0.68 });
ev(K.hero + 0.1, 'whoosh_soft', 0.45); ev(K.button, 'pop', 0.5); ev(K.button + 0.02, 'click', 0.45);
K.locks.forEach((t, i) => { ev(t, 'lock_on', 0.55, { pan: [-0.3, 0.3, 0][i] }); });
ev(K.fail, 'error', 0.7); ev(K.fail + 0.02, 'glitch', 0.5); ev(K.fail + 0.05, 'negative', 0.45);
ev(K.bad, 'hit', 0.5); ev(K.bad, 'thump', 0.4); ev(K.neq, 'swish', 0.45); ev(K.neq + 0.12, 'hit', 0.38); ev(K.spend, 'hit', 0.5); ev(K.spend, 'thump', 0.35);   // soft: they sit on "an offer people"
ev(K.card + 0.18, 'whoosh_e', 0.5); ev(K.card + 0.5, 'sparkle', 0.3);
ev(K.agree + 0.02, 'pop', 0.5); ev(K.disagree + 0.02, 'pop', 0.5); ev(K.tap, 'tap', 0.6); ev(K.tap + 0.06, 'check', 0.5);
ev(K.below + 0.05, 'swish', 0.35);
ev(LOGO + 0.08, 'sting', 0.75);
const MUSIC = { soft: T0.wake, back: T0.problem, tension: T0.target, stop: T0.formula, resolve: T0.concept, end: LOGO };
fs.writeFileSync(path.join(__dirname, 'reel_offer_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC, blur: BLUR }, null, 1));

const PH = photos(['o_handshake', 'o_mess', 'o_kitchen', 'o_living', 'o_sleep']);
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}
@font-face{font-family:Display;src:${font('InstrumentSerif-Regular.woff2')}}
@font-face{font-family:Hand;font-style:italic;src:${font('InstrumentSerif-Italic.woff2')}}
@font-face{font-family:Plex;font-weight:500;src:${font('IBMPlexMono-500.woff2')}}
*{margin:0;padding:0}html,body{width:1080px;height:1920px;overflow:hidden;background:#000}</style></head>
<body><canvas id="c" width="1080" height="1920"></canvas>
<div style="position:absolute;opacity:0"><span style="font-family:Display">a</span><i style="font-family:Hand">a</i><span style="font-family:Plex;font-weight:500">a</span></div>
<script>
const SRC=${JSON.stringify(PH)};
${fs.readFileSync(path.join(__dirname, 'reel_kit_browser.js'), 'utf8')}
const C=${JSON.stringify(C)}, SHOTS=${JSON.stringify(SHOTS)}, T0=${JSON.stringify(T0)}, CH=${JSON.stringify(CH)}, K=${JSON.stringify(K)}, BLUR=${JSON.stringify(BLUR)};
const LN=${JSON.stringify(L)}, LOGO=${LOGO}, FPS=30;
${fs.readFileSync(path.join(__dirname, 'reel_offer_scene.js'), 'utf8')}
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','40px Display','italic 40px Hand','500 40px Plex','900 40px Hook','700 40px Body','600 40px Body','500 40px Body'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([window.ready,fontsReady]).then(()=>prepare());
</script></body></html>`;

render(html, { frames: FRAMES, out: OUT, end: C.end, flag, list });
