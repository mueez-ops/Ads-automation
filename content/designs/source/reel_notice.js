// Mez Media reel: "Your product isn't the problem. Nobody notices it." AI voice (af_heart), big one-word captions.
// Palette: black, white and neutral greys only (no brand accent colour); photos stay natural colour.
// Timing: reel_notice_cues.json (reel_notice_vo.py, exact per-word times). Writes reel_notice_events.json for
// reel_notice_audio.py.
// Usage: node reel_notice.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, photos, FONT_CSS } = require('./reel_kit');

const [FRAMES, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_notice_cues.json'), 'utf8'));
const font = (f) => `url(data:font/woff2;base64,${fs.readFileSync(path.join(__dirname, 'fonts', f)).toString('base64')})`;
const Wd = (line) => C.words.filter((w) => w.line === line);   // the words of one voiceover line, in order
const at = (line, i) => Wd(line)[i].s;

// ---------- captions: one word at a time, short words ride with the next one ----------
const JOIN = new Set(['cta:stand']);                            // always shown together with the next word
const CH = [];
Object.keys(C.lines).forEach((line) => {
  const ws = Wd(line);
  let i = 0;
  while (i < ws.length) {
    const ch = { words: [ws[i]] };
    let j = i;
    const shown = (k) => (k + 1 < ws.length ? ws[k + 1].s : ws[k].e) - ws[k].s;
    while (j + 1 < ws.length && (JOIN.has(`${line}:${ws[j].w}`) || (shown(j) < 0.14 && !JOIN.has(`${line}:${ws[j + 1].w}`)))) ch.words.push(ws[++j]);
    CH.push({ text: ch.words.map((w) => w.w).join(' '), s: ch.words[0].s, last: ch.words[ch.words.length - 1].e, line });
    i = j + 1;
  }
});
CH[0].s = 0;                                                     // the hook word is on screen from frame 0
CH.forEach((c, i) => {
  const nx = CH[i + 1];
  c.e = +(nx && nx.line === c.line ? nx.s : Math.min(nx ? nx.s : C.end, c.last + 0.32)).toFixed(3);
  c.s = +c.s.toFixed(3);
  delete c.last;
});

// ---------- the edit ----------
const TR = at('creatives', 1);                                  // "creatives": the dull ad becomes the cinematic one
const END_CARD = +(Wd('cta').slice(-1)[0].e + 0.23).toFixed(3);
const SHOTS = [
  ['crowd', 0, at('hook', 6), 'none'],                          // people are beginning to realise that
  ['owner', at('hook', 6), at('hook', 10), 'zoom'],             // your business isn't failing
  ['grid', at('hook', 10), at('best', 0), 'whipL'],             // because your product is bad. It might be because nobody notices it.
  ['city', at('best', 0), at('same', 0), 'iris'],               // you could have the best product in your city
  ['clones', at('same', 0), at('same', 8), 'whipU'],            // but if your content looks like everyone else's
  ['scroll', at('same', 8), at('hooks', 0), 'slideU'],          // customers will scroll past you
  ['card', at('hooks', 0), at('marketing', 0), 'flash'],        // better hooks. better creatives.
  ['places', at('marketing', 0), at('earn', 0), 'none'],        // better marketing
  ['attention', at('earn', 0), at('cta', 0), 'whipU'],          // that's how you earn attention
  ['profile', at('cta', 0), at('cta', 8), 'zoom'],              // follow us if you want your brand to
  ['standout', at('cta', 8), END_CARD, 'whipL'],                // stand out
  ['end', END_CARD, C.end, 'cut'],
].map(([key, s, e, tin]) => ({ key, s: +s.toFixed(3), e: +e.toFixed(3), tin }));
const T0 = Object.fromEntries(SHOTS.map((x) => [x.key, x.s]));

// ---------- sound design (reel_notice_audio.py maps each kind to a recorded effect) ----------
const EV = [];
const ev = (t, k, g = 1, o = {}) => EV.push({ t: +t.toFixed(3), k, g, ...o });
const TRANS = { zoom: 'zoom', whipL: 'whoosh_b', whipU: 'whoosh_c', slideU: 'whoosh_d', iris: 'shutter_b' };
SHOTS.forEach((sh) => { if (TRANS[sh.tin]) ev(sh.s, TRANS[sh.tin], sh.tin === 'iris' ? 0.85 : 0.7); });
ev(0.06, 'deep', 0.5);                                          // opening low hit under "people"
const SNAP = at('hook', 12) + 0.04;                              // "product": the dull product shot is taken
ev(SNAP, 'shutter_a', 0.8);
const STRIKE = at('hook', 14) + 0.2;                             // "bad" gets struck through
ev(STRIKE + 0.06, 'swish', 0.45);
const PULL = at('notice', 0);                                    // pull back to the wall of ads
ev(PULL + 0.75, 'air', 0.55);
for (let i = 0; i < 4; i++) ev(at('same', 6) + 0.06 + i * 0.09, 'swish', 0.32, { pan: i % 2 ? 0.5 : -0.5 });   // the clones fan out
ev(at('same', 7) + 0.05, 'click_a', 0.45);
ev(at('same', 10) + 0.15, 'whoosh_e', 0.55);                     // "scroll"
ev(at('same', 11) + 0.12, 'whoosh_a', 0.4);                      // "past"
ev(T0.card, 'riser', 0.5);                                       // riser that ends on the first "better"
const SELECT = at('hooks', 1) + 0.03, TYPE0 = SELECT + 0.12;      // the headline is selected and a real hook typed in
ev(SELECT, 'select', 0.6); ev(TYPE0, 'type', 0.5, { len: 0.55 });
ev(TR - 0.04, 'focus', 0.45);
ev(TR, 'shutter_c', 0.9); ev(TR + 0.02, 'deep', 0.7); ev(TR + 0.25, 'sparkle', 0.3);
ev(T0.places, 'whoosh_a', 0.6);
ev(T0.places + 0.2, 'slide', 0.45, { pan: -0.6 }); ev(T0.places + 0.32, 'slide', 0.45, { pan: 0.6 });
const STOP = at('earn', 3);                                      // the feed stops on the cinematic ad on "earn"
ev(STOP - 0.32, 'whoosh_e', 0.4); ev(STOP, 'click_b', 0.6);
ev(at('earn', 4), 'drum', 0.85); ev(at('earn', 4), 'whoosh_f', 0.4);
const TAP = at('cta', 0) + 0.18;                                 // "follow" is tapped
ev(TAP, 'tap', 0.7); ev(TAP + 0.08, 'check', 0.6);
ev(T0.standout + 0.12, 'shutter_d', 0.5);
ev(END_CARD + 0.03, 'sting', 0.75);
const MUSIC = { betters: [at('hooks', 0), at('creatives', 0), at('marketing', 0)], nobody: PULL, best: T0.city, scroll: T0.scroll, better: T0.card, drop: TR, attention: at('earn', 4), cta: T0.profile, end: END_CARD };
fs.writeFileSync(path.join(__dirname, 'reel_notice_events.json'), JSON.stringify({ cues: C, shots: SHOTS, captions: CH, events: EV, music: MUSIC }, null, 1));

const PH = photos(['n_crowd', 'n_owner', 'n_city', 'n_perfume', 'p_cup', 'p_shirt', 'p_lamp', 'p_gymbag', 'p_laptop', 'p_backpack']);
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}
@font-face{font-family:Display;src:${font('InstrumentSerif-Regular.woff2')}}
@font-face{font-family:Plex;font-weight:500;src:${font('IBMPlexMono-500.woff2')}}
*{margin:0;padding:0}html,body{width:1080px;height:1920px;overflow:hidden;background:#000}</style></head>
<body><canvas id="c" width="1080" height="1920"></canvas>
<div style="position:absolute;opacity:0"><span style="font-family:Display">a</span><span style="font-family:Plex;font-weight:500">a</span></div>
<script>
const SRC=${JSON.stringify(PH)};
${fs.readFileSync(path.join(__dirname, 'reel_kit_browser.js'), 'utf8')}
const C=${JSON.stringify(C)}, SHOTS=${JSON.stringify(SHOTS)}, T0=${JSON.stringify(T0)}, CH=${JSON.stringify(CH)};
const TR=${TR}, SNAP=${SNAP}, STRIKE=${STRIKE}, PULL=${PULL}, SELECT=${SELECT}, TYPE0=${TYPE0}, STOP=${STOP}, TAP=${TAP};
const ATTN=${at('earn', 4)}, SAME_EVERY=${at('same', 6)}, SAME_ELSE=${at('same', 7)}, SCROLL_W=${at('same', 10)}, END_CARD=${END_CARD}, FPS=30;
${fs.readFileSync(path.join(__dirname, 'reel_notice_scene.js'), 'utf8')}
const fontsReady=Promise.all(['800 40px Logo','600 40px Logo','40px Display','500 40px Plex','900 40px Hook','700 40px Body','500 40px Body'].map(f=>document.fonts.load(f)));
window.ready=Promise.all([window.ready,fontsReady]).then(()=>prepare());
</script></body></html>`;

render(html, { frames: FRAMES, out: OUT, end: C.end, flag, list });
