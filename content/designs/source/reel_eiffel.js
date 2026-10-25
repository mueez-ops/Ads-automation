// Mez Media reel: "Nobody tells you the Eiffel Tower has a secret apartment at the top." A switch reel. The first
// 14.5 seconds are a facts reel: a whip up the tower from the first frame under the written hook, the top floor
// ringed, Gustave Eiffel's portrait out of it, the offers to rent it that he turned down ("Not for rent"), his most
// famous guest Thomas Edison, and the twist: they are both still up there, in wax. Then a beat of tension, and the
// switch: the reel you were watching shrinks into an iPhone, "You've just watched this reel for 15 seconds", the same
// reel turns into your ad, and the pitch: "We scale businesses with ads like this. DM us the word teardown for a free
// ad review." No end card, so it loops straight back to the hook. Mez Media's look throughout: Inter type, captions
// one word at a time just below the centre, white pills and outlines over the photo.
// Facts: Eiffel's private apartment at the top of the tower, kept for his experiments and his guests; rich Parisians
// offered large sums to rent it for a night and he always refused (Jill Jonnes, "Eiffel's Tower", via Mental Floss;
// Domus); Thomas Edison's visit on 10 September 1889, with a phonograph as a gift; today a reconstruction of the
// office with wax figures of Eiffel, his daughter Claire and Edison, seen through its windows (toureiffel.paris).
// The 15 is the real time when it is spoken.
// Timing: reel_eiffel_cues.json (reel_eiffel_vo.py). Writes reel_eiffel_events.json for reel_eiffel_audio.py.
// Usage: node reel_eiffel.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, FONT_CSS, photos } = require('./reel_kit');
const { FRAMES, renderScreens } = require('./phone_screens');

const [FRAMES_DIR, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_eiffel_cues.json'), 'utf8'));
const L = C.lines;
const words = [];
C.words.forEach((w) => { if (w.w === '+') words[words.length - 1].e = w.e; else words.push({ ...w }); });
const Wd = (line) => words.filter((w) => w.line === line);
const at = (line, i) => Wd(line)[i].s;
const NUM = +Wd('watched')[6].w;                      // the seconds said on the switch (the real time at that word)

// ---------- captions: one word at a time (short words ride with their neighbour) ----------
// the hook is on screen as written type and the pitch as big type, so they get no captions
const HL = new Set(['fortunes', 'no', 'Edison', 'wax', String(NUM)]);
const QUIET = new Set(['hook', 'scale', 'dm']);
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
const TENSE = +(L.reveal.e + 0.02).toFixed(3);
CH.forEach((c, i) => {
  const nx = CH[i + 1];
  c.e = +(nx && nx.line === c.line ? nx.s : Math.min(nx ? nx.s : C.end, c.last + 0.3, c.s < TENSE ? TENSE : L.scale.s)).toFixed(3);
  delete c.last;
});

// ---------- the edit ----------
const SHOTS = [
  ['hook', 0, L.built.s, 'none'],             // a whip up the tower; the top floor ringed
  ['built', L.built.s, L.offers.s, 'none'],   // Gustave Eiffel's portrait comes out of it
  ['offers', L.offers.s, L.guest.s, 'none'],  // "Rent it for a night?" "Not for rent"
  ['guest', L.guest.s, L.wax.s, 'none'],      // Thomas Edison joins him
  ['wax', L.wax.s, TENSE, 'none'],            // the office today: both of them, in wax
  ['tense', TENSE, L.watched.s, 'none'],      // the colour drains, a heartbeat, a clock
  ['phone', L.watched.s, L.scale.s, 'cut'],   // black: the reel shrinks into a phone; 0:15; then it is your ad
  ['pitch', L.scale.s, C.end, 'cut'],         // "We scale businesses with ads like this. DM us the word teardown..." (loops to the hook)
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// key moments the scene and the sound both use
const K = {
  zoom: 0.9, hookOut: +(L.hook.e + 0.05).toFixed(3), ring: at('hook', 9), top: at('hook', 12),
  card: at('built', 0), title: at('built', 1), fort: at('offers', 3), rent: at('offers', 5), no: at('no', 2),
  guest: at('guest', 3), edi: at('guest', 5), yr: +(at('guest', 5) + 0.3).toFixed(3),
  both: at('wax', 2), names: at('wax', 3), wax: at('reveal', 1), tense: TENSE, freeze: +(TENSE - 0.1).toFixed(3),
  watched: at('watched', 2), num: at('watched', 6), ad: at('imagine', 2),
  s1: at('scale', 0), s2: at('scale', 3), d1: at('dm', 0), d2: at('dm', 4), d3: at('dm', 5), handle: +(L.dm.e + 0.05).toFixed(3),
};
const BEATS = [0, 1, 2].map((i) => +(TENSE + 0.12 + i * 0.48).toFixed(3));   // the heartbeat under the tension

// motion blur: sub-frames per frame inside these windows [from, to, samples]
const BLUR = [[0, K.zoom + 0.05, 8], [K.card - 0.07, K.card + 0.65, 6], [K.guest - 0.12, K.guest + 0.5, 4],
  [K.both - 0.07, K.both + 0.6, 6], [K.tense + 0.7, T0.phone, 4], [T0.phone - 0.02, T0.phone + 0.65, 8],
  [K.ad - 0.02, K.ad + 0.35, 4], [K.d1 - 0.02, K.d1 + 0.4, 4]];

// ---------- sound design (reel_eiffel_audio.py maps each kind to a recorded or synthesized effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
ev(0.0, 'hit', 0.45); ev(0.02, 'whoosh_c', 0.5); ev(0.05, 'deep', 0.4); ev(K.zoom - 0.1, 'zoom', 0.2);
ev(K.ring, 'swish', 0.26, { pan: -0.2 }); ev(K.ring + 0.12, 'select', 0.22); ev(K.top, 'pop', 0.3, { pan: 0.25 });
ev(K.card - 0.08, 'whoosh_soft', 0.35); ev(K.card + 0.12, 'pop', 0.28); ev(K.title, 'select', 0.24);
ev(K.fort, 'sparkle', 0.24); ev(K.rent, 'pop', 0.28, { pan: 0.25 });
ev(K.no - 0.02, 'thump', 0.42); ev(K.no, 'hit', 0.3);
ev(K.guest - 0.1, 'whoosh_soft', 0.32, { pan: 0.3 }); ev(K.guest + 0.1, 'pop', 0.26, { pan: 0.25 }); ev(K.edi, 'select', 0.24); ev(K.yr, 'pop', 0.26, { pan: 0.25 });
ev(K.both - 0.08, 'whoosh_soft', 0.35); ev(K.both + 0.12, 'pop', 0.28);
ev(K.names, 'select', 0.2, { pan: -0.25 }); ev(K.names + 0.18, 'select', 0.2, { pan: 0.25 });
ev(K.wax, 'pop', 0.3); ev(K.wax + 0.04, 'sparkle', 0.22);
ev(K.tense, 'riser', 0.24, { d: T0.phone - K.tense }); BEATS.forEach((t) => { ev(t, 'thump', 0.4); ev(t + 0.17, 'thump', 0.24); });
for (let t = K.tense + 0.05; t < T0.phone - 0.1; t += 0.25) ev(t, 'tick', 0.14, { pan: 0.35 });
ev(T0.phone - 0.03, 'deep', 0.45); ev(T0.phone, 'hit', 0.45); ev(T0.phone - 0.05, 'zoom_out', 0.18);   // quiet by "watched", so its -ed is heard
for (let i = 1; i <= NUM; i++) { const t = K.watched + (K.num - K.watched) * i / NUM; if (t > at('watched', 3)) ev(t, 'tick', 0.07 + 0.003 * i, { pan: 0.2 }); }   // not on "watched"
ev(K.num, 'select', 0.3);
ev(K.ad, 'pop', 0.3); ev(K.ad + 0.08, 'swish', 0.24, { pan: 0.3 });
ev(T0.pitch - 0.04, 'deep', 0.35); ev(T0.pitch, 'whoosh_f', 0.26);
ev(K.d1 - 0.05, 'whoosh_soft', 0.28); ev(K.d2, 'hit', 0.34);
ev(K.handle, 'pop', 0.3);
// the score: the groove from the first frame under the facts; nothing but a riser, a heartbeat and a clock under the
// tension; a low drone on the switch; the groove back for the pitch, resolving under the last line
const MUSIC = { beat: 0.0, tense: K.tense, phone: T0.phone, drop: L.imagine.s, last: T0.pitch, end: L.dm.s };
fs.writeFileSync(path.join(__dirname, 'reel_eiffel_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC, blur: BLUR }, null, 1));

(async () => {
  const { img } = await renderScreens(FRAMES);
  const SRC = { ...img, ...photos(['eiffel_tower', 'eiffel_portrait', 'eiffel_edison', 'eiffel_office']) };
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}
*{margin:0;padding:0}html,body{width:1080px;height:1920px;overflow:hidden;background:#000}</style></head>
<body><canvas id="c" width="1080" height="1920"></canvas>
<script>
const SRC=${JSON.stringify(SRC)};
${fs.readFileSync(path.join(__dirname, 'reel_kit_browser.js'), 'utf8')}
const C=${JSON.stringify(C)}, SHOTS=${JSON.stringify(SHOTS)}, T0=${JSON.stringify(T0)}, CH=${JSON.stringify(CH)}, K=${JSON.stringify(K)}, BLUR=${JSON.stringify(BLUR)};
const LN=${JSON.stringify(L)}, BEATS=${JSON.stringify(BEATS)}, NUM=${NUM}, FPS=30;
${fs.readFileSync(path.join(__dirname, 'reel_phone_kit.js'), 'utf8')}
${fs.readFileSync(path.join(__dirname, 'reel_eiffel_scene.js'), 'utf8')}
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','500 40px Body','600 40px Body','700 40px Body'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([window.ready,fontsReady]).then(()=>prepare());
</script></body></html>`;
  await render(html, { frames: FRAMES_DIR, out: OUT, end: C.end, flag, list });
})();
