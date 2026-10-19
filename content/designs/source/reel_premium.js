// Mez Media premium reel: "Perfect targeting is killing your ads". AI voice (af_heart), 22 shots cut on the words.
// Palette: cream #F6F1E7, ink #1E1A16, warm black #120E0B, one accent peach #FF7A59. Photos stay natural colour.
// Timing: reel_premium_cues.json (reel_premium_vo.py). Writes reel_premium_events.json for reel_premium_audio.py.
// Usage: node reel_premium.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, photos, FONT_CSS } = require('./reel_kit');

const [FRAMES, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_premium_cues.json'), 'utf8'));
const L = C.lines, A = C.at;
const font = (f) => `url(data:font/woff2;base64,${fs.readFileSync(path.join(__dirname, 'fonts', f)).toString('base64')})`;

// ---------- the edit: shot boundaries on the voiceover's words ----------
const flashAt = L.learns.s - 0.14;
const SHOTS = [
  ['hook', 0, A['hook:killing'], 'none'],
  ['slice', A['hook:killing'], A['list:age'], 'punch'],
  ['chips', A['list:age'], L.ticked.s, 'whipL'],
  ['everybox', L.ticked.s, L.still.s, 'none'],
  ['feed', L.still.s, A['still:nobody'], 'cut'],
  ['nobody', A['still:nobody'], L.why.s, 'cut'],
  ['prompt', L.why.s, L.learns.s, 'whipU'],
  ['scan', L.learns.s, A['learns:algorithm'] - 0.16, 'flash'],
  ['tags', A['learns:algorithm'] - 0.16, A['learns:then'], 'punch'],
  ['branch', A['learns:then'], A['learns:speaks'] - 0.12, 'swish'],
  ['vignettes', A['learns:speaks'] - 0.12, L.thesis.s, 'none'],
  ['wall', L.thesis.s, A['thesis:targeting'], 'sweep'],
  ['flip', A['thesis:targeting'], L.vague.s, 'punch'],
  ['vague', L.vague.s, A['vague:no'], 'whipR'],
  ['greyout', A['vague:no'], L.sharp.s, 'cut'],
  ['sharp', L.sharp.s, A['sharp:now'], 'rack'],
  ['feedstop', A['sharp:now'], L.mez.s, 'cut'],
  ['flyby', L.mez.s, A['mez:we'], 'whipU'],
  ['redline', A['mez:we'], L.cta.s, 'cut'],
  ['dm', L.cta.s, A['cta:and'], 'slideU'],
  ['cta', A['cta:and'], A['cta:free'] + 0.3, 'flash'],
  ['end', A['cta:free'] + 0.3, C.end, 'cut'],
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));
const sendClick = flashAt - 0.12, dmSend = A['cta:teardown'] + 0.42;

// ---------- sound-design events (the audio script reads these) ----------
const EV = [];
const ev = (t, k, o = {}) => EV.push({ t: +t.toFixed(3), k, ...o });
SHOTS.forEach((sh) => {
  const m = { whipL: 'whip', whipR: 'whip', whipU: 'whip', swish: 'swish', sweep: 'sweep', punch: 'punch', slideU: 'whip', rack: 'rack', cut: 'cut' }[sh.tin];
  if (m) ev(sh.s, m);
});
ev(0, 'sub'); ev(0.08, 'tick'); ev(A['hook:killing'], 'slice');
['list:age', 'list:interests', 'list:location'].forEach((k, i) => ev(A[k], 'check', { i }));
ev(L.ticked.s + 0.1, 'rustle'); ev(L.ticked.e - 0.25, 'tick');
ev(L.still.s, 'scroll', { dur: A['still:nobody'] - L.still.s }); ev(A['still:nobody'], 'stop'); ev(L.still.e - 0.25, 'thud');
for (let i = 0; i < 23; i++) ev(L.why.s + 0.2 + i * 0.035, 'key');
ev(sendClick, 'click'); ev(flashAt - 0.22, 'riser_short'); ev(flashAt, 'shimmer');
ev(L.learns.s + 0.05, 'scan'); ev(L.learns.s + 0.2, 'tick');
[0, 0.35, 0.7].forEach((d, i) => ev(T0.tags + 0.1 + d, 'blip', { i }));
for (let i = 0; i < 6; i++) ev(T0.branch + 0.05 + i * 0.13, 'pluck', { i });
[0, 0.3, 0.6].forEach((d, i) => ev(T0.vignettes + 0.1 + d, 'pop', { i }));
ev(L.thesis.s - 0.55, 'swell'); ev(A['thesis:targeting'], 'sub'); ev(A['thesis:targeting'] + 0.12, 'shimmer');
ev(L.vague.s + 0.2, 'thud');
for (let i = 0; i < 8; i++) ev(A['vague:no'] + 0.1 + i * 0.07, 'ripple', { i });
ev(L.sharp.s + 0.2, 'click'); [0, 0.1, 0.2].forEach((d) => ev(L.sharp.s + 0.4 + d, 'tick'));
ev(A['sharp:now'], 'scroll', { dur: 0.55 }); ev(A['sharp:now'] + 0.6, 'stop'); ev(A['sharp:now'] + 0.65, 'pluck', { i: 5 });
for (let i = 0; i < 5; i++) ev(L.mez.s + 0.05 + i * 0.11, 'flyby', { i });
ev(A['mez:we'] + 0.05, 'swish'); ev(A['mez:we'] + 0.27, 'scribble'); ev(A['mez:we'] + 0.57, 'scribble');
'TEARDOWN'.split('').forEach((_, i) => ev(L.cta.s + 0.35 + i * 0.07, 'key'));
ev(dmSend, 'click'); ev(dmSend + 0.05, 'send'); ev(T0.cta - 0.1, 'shimmer');
ev(T0.cta + 0.05, 'whoosh_soft'); ev(T0.cta + 0.6, 'whoosh_soft'); ev(T0.end - 0.9, 'riser');
ev(T0.end, 'sub'); ev(T0.end + 0.15, 'chime');
fs.writeFileSync(path.join(__dirname, 'reel_premium_events.json'), JSON.stringify({ cues: C, shots: SHOTS, events: EV, flashAt, sendClick, dmSend }, null, 1));

const PH = photos(['p_cup', 'p_shirt', 'p_lamp', 'p_gymbag', 'p_laptop', 'p_backpack', 'p_room']);
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}
@font-face{font-family:Display;src:${font('InstrumentSerif-Regular.woff2')}}
@font-face{font-family:Hand;font-style:italic;src:${font('InstrumentSerif-Italic.woff2')}}
@font-face{font-family:Plex;font-weight:400;src:${font('IBMPlexMono-400.woff2')}}
@font-face{font-family:Plex;font-weight:500;src:${font('IBMPlexMono-500.woff2')}}
*{margin:0;padding:0}html,body{width:1080px;height:1920px;overflow:hidden;background:#000}</style></head>
<body><canvas id="c" width="1080" height="1920"></canvas>
<div style="position:absolute;opacity:0"><span style="font-family:Display">a</span><span style="font-family:Plex">a</span><span style="font-family:Plex;font-weight:500">a</span><i style="font-family:Hand">a</i></div>
<script>
const SRC=${JSON.stringify(PH)};
${fs.readFileSync(path.join(__dirname, 'reel_kit_browser.js'), 'utf8')}
const C=${JSON.stringify(C)}, L=C.lines, A=C.at, SHOTS=${JSON.stringify(SHOTS)}, T0=${JSON.stringify(T0)};
const FLASH=${flashAt}, SEND=${sendClick}, DMSEND=${dmSend}, FPS=30;
${fs.readFileSync(path.join(__dirname, 'reel_premium_scene.js'), 'utf8')}
const fontsReady=Promise.all(['40px Display','40px Plex','500 40px Plex','italic 40px Hand'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([window.ready,fontsReady]);
</script></body></html>`;

render(html, { frames: FRAMES, out: OUT, end: C.end, flag, list });
