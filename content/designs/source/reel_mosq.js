// Mez Media reel: "Over 25? You can't hear what this box is playing." The Mosquito, the anti-loitering box that shrieks
// at about 17,000 hertz so only young ears hear it, which teenagers then turned into a ringtone their teachers couldn't
// hear. Made the way the armor, bell, equals, pump, Stanley, McFlurry and bee reels were (the expressive female voice, a
// new camera set-up about every second, captions at the top built word by word, labels on leader lines, small print
// with sources), with one change after the bee reel was skipped at its "Why would...?" question: the hook is a claim
// aimed at the viewer (hookscore.py 84 STRONG, the bee hook 45), the whole hook is on screen from the first frame, and
// the first frame is already in motion: the box pulsing, teenagers flinching, the shopkeeper sweeping on as if nothing
// is happening. Then the switch (your ad is that box: Meta plays it to a crowd, your hook decides who hears it) and the
// pitch. Facts and sources: reel_mosq_vo.py. Timing: reel_mosq_cues.json. Writes reel_mosq_events.json for the audio.
// Usage: node reel_mosq.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, FONT_CSS } = require('./reel_kit');
const { FRAMES, renderScreens } = require('./phone_screens');

const [FRAMES_DIR, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_mosq_cues.json'), 'utf8'));
const L = C.lines;
const words = C.words.map((w) => ({ ...w }));
const Wd = (line) => words.filter((w) => w.line === line);
const at = (line, i) => Wd(line)[i].s;

// ---------- captions: at the top, the phrase builds word by word; numbers are spoken as words and shown as digits ----------
const SHOW = [['over', 'twenty five', '25?'], ['shriek', 'seventeen thousand', '17,000']];
const capWords = words.map((w) => ({ ...w }));
SHOW.forEach(([line, spoken, shown]) => {
  const ws = spoken.split(' '), i = capWords.findIndex((w, k) => w.line === line && ws.every((s, j) => (capWords[k + j] || {}).w === s));
  capWords.splice(i, ws.length, { w: shown, s: capWords[i].s, e: capWords[i + ws.length - 1].e, line });
});
const CW = (line) => capWords.filter((w) => w.line === line);
const HL = { over: ['25?'], hear: ["can't"], teens: ['hate'], point: ['point'], mosq: ['mosquito'], shriek: ['17,000'], age: ['high'], adults: ['nothing'],
  flip: ['ringtone'], class: ['nothing'], same: ['two'], box: ['box'], crowd: ['crowd'], decides: ['hook'] };
const SKIP = new Set(['scale', 'dm']);               // the pitch is its own big type
const MAXC = 22;
// new chunk / new row at these word indexes
const CBRK = { mosq: [6], class: [6] }, RBRK = { teens: [2], mosq: [3, 9], shriek: [4], age: [3], adults: [2], flip: [2], class: [3, 9], same: [2], crowd: [3], decides: [3] };
const CH = [];
// the hook is one card, all of it on screen from the first frame (dim until each word is said)
CH.push({ line: 'over', s: 0, hook: true, rows: [CW('over'), CW('hear').slice(0, 4), CW('hear').slice(4)].map((r) => r.map((w) => ({ w: w.w, s: w.s, e: w.e, hl: (HL[w.line] || []).includes(w.w) }))) });
CH[0].rows[0][0].s = -0.1;
Object.keys(L).filter((line) => !SKIP.has(line) && line !== 'over' && line !== 'hear').forEach((line) => {
  let cur = null;
  const close = () => { if (cur) CH.push(cur); cur = null; };
  CW(line).forEach((w, wi) => {
    if (cur && (CBRK[line] || []).includes(wi)) close();
    if (!cur) cur = { line, s: w.s, rows: [[]] };
    if ((RBRK[line] || []).includes(wi) && cur.rows[0].length) cur.rows.push([]);
    let row = cur.rows[cur.rows.length - 1];
    const len = row.reduce((n, q) => n + q.w.length + 1, 0) + w.w.length;
    if (row.length && len > MAXC) { if (cur.rows.length === 2) { close(); cur = { line, s: w.s, rows: [[]] }; } else cur.rows.push([]); row = cur.rows[cur.rows.length - 1]; }
    row.push({ w: w.w, s: w.s, e: w.e, hl: (HL[line] || []).includes(w.w.toLowerCase()) || (HL[line] || []).includes(w.w) });
  });
  close();
});
CH.forEach((c, i) => {
  const nx = CH[i + 1], last = c.rows.flat().slice(-1)[0].e;
  c.e = +Math.min(nx ? nx.s : C.end, nx && nx.line === c.line ? nx.s : last + 0.4, L.scale.s).toFixed(3);   // gone when the pitch starts
});

// ---------- the edit: the 3D world, then the feed, then the pitch ----------
const SHOTS = [
  ['site', 0, L.box.s, 'none'],               // the street, the box, the ear, the ringtone, the classroom, the split
  ['feed', L.box.s, L.scale.s, 'cut'],        // your ad is that box: Meta plays it to a crowd, your hook decides who hears it
  ['pitch', L.scale.s, C.end, 'cut'],         // "We scale businesses with ads like this. DM us the word teardown..."
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// key moments the scene and the sound both use
const K = {
  over: at('over', 0), n25: at('over', 1), you: at('hear', 0), cant: at('hear', 1), what: at('hear', 3), box: at('hear', 5), playing: at('hear', 7),
  teensL: L.teens.s, can: at('teens', 1), they: at('teens', 2), hate: at('teens', 3),
  pointL: L.point.s, point: at('point', 2),
  mosqL: L.mosq.s, mosquito: at('mosq', 2), built: at('mosq', 3), wales: at('mosq', 5), to: at('mosq', 6), clear: at('mosq', 7), doorways: at('mosq', 11),
  shriekL: L.shriek.s, shrieks: at('shriek', 1), about: at('shriek', 3), n17: at('shriek', 4), hertz: at('shriek', 6),
  ageL: L.age.s, ears: at('age', 1), lose: at('age', 2), high: at('age', 4), first: at('age', 6),
  adultsL: L.adults.s, adults: at('adults', 1), nothing1: at('adults', 3),
  flipL: L.flip.s, made: at('flip', 2), ringtone: at('flip', 5),
  classL: L.class.s, phones: at('class', 1), ring: at('class', 3), classW: at('class', 5), whileW: at('class', 6), teachers: at('class', 8), nothing2: at('class', 10),
  sameL: L.same.s, sound: at('same', 1), two: at('same', 2), audiences: at('same', 3),
  boxL: L.box.s, ad: at('box', 1), thatBox: at('box', 4),
  crowdL: L.crowd.s, meta: at('crowd', 0), plays: at('crowd', 1), crowd: at('crowd', 5),
  decidesL: L.decides.s, hook: at('decides', 1), decides: at('decides', 2), who: at('decides', 3), hears: at('decides', 4),
  s1: at('scale', 0), s2: at('scale', 3), d1: at('dm', 0), d2: at('dm', 4), d3: at('dm', 5), handle: +(L.dm.e + 0.05).toFixed(3),
};
// the camera: a new set-up about every second, hard cuts, each one moving [start, from-view, to-view]
const CUTS = [
  [0, 'hook0', 'hook1'], [K.cant - 0.05, 'box0', 'box1'], [K.box - 0.05, 'keeper0', 'keeper1'], [K.teensL, 'teens0', 'teens1'],
  [K.they - 0.06, 'flee0', 'flee1'], [K.pointL, 'empty0', 'empty1'], [K.mosqL, 'hero0', 'hero1'], [K.built - 0.06, 'label0', 'label1'],
  [K.to - 0.05, 'door0', 'door1'], [K.shriekL, 'wave0', 'wave1'], [K.ageL, 'coch0', 'coch1'], [K.high - 0.08, 'base0', 'base1'],
  [K.adultsL, 'calm0', 'calm1'], [K.flipL, 'phone0', 'phone1'], [K.classL, 'class0', 'class1'], [K.whileW - 0.05, 'teacher0', 'teacher1'],
  [K.nothing2 - 0.18, 'smirk0', 'smirk1'], [K.sameL, 'split0', 'split1'],
].map(([t, a, b]) => [+t.toFixed(3), a, b || a]);

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[K.they - 0.06, K.they + 0.3, 3], [K.mosqL - 0.02, K.mosqL + 0.3, 3], [T0.feed - 0.02, T0.feed + 0.6, 4], [K.d1 - 0.02, K.d1 + 0.4, 4]];

// ---------- sound design (reel_mosq_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
// the box pulses from the first frame to the end of the street; every pulse a soft electric throb (never the real tone)
const PULSE = 0.42, pulses = [];
for (let t = 0.02; t < L.box.s; t += PULSE) pulses.push(+t.toFixed(3));
ev(0, 'street', 0.32, { d: K.mosqL }); ev(K.classL, 'room', 0.3, { d: K.sameL - K.classL });
pulses.forEach((t) => { const on = t < K.mosqL || (t > K.shriekL && t < K.ageL) || (t > K.adultsL && t < K.flipL) || t > K.sameL; if (on) ev(t, 'throb', t < 1.2 ? 0.34 : 0.24); });
ev(0.08, 'gasp', 0.3, { pan: -0.3 }); ev(K.cant - 0.06, 'whoosh_soft', 0.18); ev(K.box - 0.06, 'whoosh_c', 0.2); ev(K.box + 0.1, 'sweep', 0.3, { d: K.teensL - K.box });
ev(K.teensL - 0.05, 'whoosh_soft', 0.2); ev(K.hate - 0.1, 'groan', 0.3, { pan: 0.2 }); ev(K.they - 0.07, 'whoosh_f', 0.24); ev(K.they + 0.05, 'steps', 0.32, { d: 0.7 });
ev(K.pointL - 0.05, 'whoosh_soft', 0.18); ev(K.point, 'ding', 0.3);
ev(K.mosqL - 0.06, 'deep', 0.3); ev(K.mosqL - 0.02, 'whoosh_f', 0.22); ev(K.mosquito, 'hit', 0.3); ev(K.built - 0.07, 'whoosh_soft', 0.18); ev(K.wales, 'select', 0.28);
ev(K.to - 0.06, 'whoosh_c', 0.2); ev(K.clear + 0.05, 'swish', 0.22, { pan: 0.4 });
ev(K.shriekL - 0.05, 'whoosh_soft', 0.2); ev(K.shrieks, 'zap', 0.3); for (let i = 0; i < 10; i++) ev(K.n17 + 0.06 * i, 'tick', 0.16 + 0.012 * i);
ev(K.ageL - 0.06, 'whoosh_c', 0.22); ev(K.ears, 'shimmer', 0.26); ev(K.high - 0.09, 'whoosh_soft', 0.18); ev(K.lose + 0.05, 'wilt', 0.32);
ev(K.adultsL - 0.05, 'whoosh_soft', 0.2); ev(K.nothing1 - 0.04, 'hush', 0.32);
ev(K.flipL - 0.06, 'whoosh_f', 0.24); ev(K.made, 'tap', 0.3); ev(K.ringtone, 'ringtone', 0.3);
ev(K.classL - 0.05, 'whoosh_c', 0.22); ev(K.ring - 0.02, 'buzzphone', 0.3, { d: 0.9 }); ev(K.whileW - 0.06, 'whoosh_soft', 0.18); ev(K.whileW + 0.05, 'chalk', 0.32, { d: 1.0 });
ev(K.nothing2 - 0.2, 'whoosh_soft', 0.16); ev(K.nothing2, 'pop', 0.24);
ev(K.sameL - 0.06, 'whoosh_f', 0.24); ev(K.sound, 'hit', 0.26); ev(K.two, 'select', 0.26); ev(K.audiences, 'select', 0.26, { pan: 0.4 });
ev(T0.feed - 0.03, 'deep', 0.36); ev(T0.feed, 'zoom_out', 0.2); ev(K.ad + 0.15, 'swish', 0.28, { pan: 0.2 });
ev(K.plays, 'throb', 0.3); ev(K.plays + PULSE, 'throb', 0.26); ev(K.crowd - 0.05, 'crowd', 0.3, { d: 1.6 });
ev(K.hook, 'select', 0.3); for (let i = 0; i < 5; i++) ev(K.who + 0.1 * i, 'tag', 0.22 + 0.03 * i, { pan: -0.4 + 0.2 * i });
ev(T0.pitch - 0.3, 'deep', 0.32); ev(T0.pitch - 0.2, 'whoosh_f', 0.22);
ev(K.d1 - 0.05, 'whoosh_soft', 0.28); ev(K.d2, 'hit', 0.34);
ev(K.handle, 'pop', 0.3);
// the score: a tense pulse under the hook; the groove from "It's the Mosquito"; a hush under "Most adults hear nothing";
// a sly lift on the ringtone; lighter under the feed, and back for the pitch
const MUSIC = { start: K.mosqL, hush: [K.adultsL - 0.05, K.flipL - 0.02], dawn: K.flipL, feed: T0.feed, pitch: T0.pitch, end: L.dm.s };
fs.writeFileSync(path.join(__dirname, 'reel_mosq_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC, blur: BLUR, pulses }, null, 1));

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
const LN=${JSON.stringify(L)}, CUTS=${JSON.stringify(CUTS)}, PULSES=${JSON.stringify(pulses)}, PULSE=${PULSE}, FPS=30;
const DEBUGCAM=${process.env.MOSQ_CAM || 'null'};  // MOSQ_CAM='[[x,y,z],[tx,ty,tz],fov]' holds the camera for checks
${fs.readFileSync(path.join(__dirname, 'reel_phone_kit.js'), 'utf8')}
const S={}, LIGHT={};
const imgsReady=window.ready; let threeDone; const threeReady=new Promise(r=>threeDone=r);
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','500 40px Body','600 40px Body','700 40px Body','40px Mono','italic 40px Serif'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([imgsReady,fontsReady,threeReady]).then(()=>prepare());
</script>
<script type="module">
const X = await import(URL.createObjectURL(new Blob([${JSON.stringify(THREE_SRC)}], {type:'text/javascript'})));
await document.fonts.ready;
${fs.readFileSync(path.join(__dirname, 'reel_mosq_scene.js'), 'utf8')}
threeDone();
</script></body></html>`;
  await render(html, { frames: FRAMES_DIR, out: OUT, end: C.end, flag, list, gl: true });
})();
