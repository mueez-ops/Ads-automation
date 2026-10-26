// Mez Media carousel: "Your best ad is already written." (9 slides, 1080x1350), Apple-style like build_leads.js.
// Five ads hiding on a brand's own website, each shown on a phone: the story page with the line that is already an
// ad, a Notes list of ad ideas crossed out, the brand timeline, a 10-second edit of the making, the promise on the
// product page, the $9 sample, the reviews, the checklist to screenshot, and the TEARDOWN DM. Every slide carries a
// short line under the headline, @mezmedia_0 and a page count. The brand on the screens is made up ("Your Brand").
// Usage: node build_bestad.js <out-dir>   (writes <out-dir>/post6_bestad/post6_bestad_01.png ...)
const path = require('path');
const { data, CSS, INK, GREY, CHECK, phone, render } = require('./apple_kit');

const N = 9;
const EXTRA = `
.s{padding-top:122px}
.sub{font-size:37px;line-height:1.36;color:#6E6E73;text-align:center;max-width:860px;margin-top:26px;text-wrap:balance}
.dark .sub{color:#A1A1A6}
.s .stage{margin-top:62px}
.foot{position:absolute;left:56px;right:56px;top:44px;display:flex;justify-content:space-between;font-size:32px;font-weight:500;color:#86868B}
.dark .foot{color:rgba(255,255,255,.5)}
/* web page */
.url{margin:112px 30px 0;height:72px;border-radius:24px;background:#E9E9EE;display:flex;align-items:center;justify-content:center;gap:12px;font-size:28px;color:#3C3C43}
.web{padding:0 44px}
.web h2{font-family:Disp;font-weight:600;font-size:66px;letter-spacing:-.025em;margin-top:40px}
.kick{font-size:25px;font-weight:600;letter-spacing:.14em;color:${GREY};margin-top:34px}
.para{font-size:34px;line-height:1.5;margin-top:18px}
.mark{background:linear-gradient(180deg,transparent 12%,#FFE36E 12%,#FFE36E 92%,transparent 92%);padding:0 4px;box-decoration-break:clone;-webkit-box-decoration-break:clone;font-weight:600}
.sk{height:22px;border-radius:11px;background:#E5E5EA;margin-top:24px}
/* notes */
.nbar{display:flex;justify-content:space-between;align-items:center;padding:112px 36px 0;font-size:31px;font-weight:500;color:#B8860B}
.ndate{text-align:center;font-size:24px;color:${GREY};margin-top:30px}
.ntitle{font-weight:700;font-size:58px;letter-spacing:-.02em;padding:0 46px;margin-top:20px}
.nl{display:flex;gap:18px;align-items:baseline;font-size:36px;line-height:1.3;padding:0 46px;margin-top:26px}
.nl.x span{color:${GREY};text-decoration:line-through;text-decoration-thickness:3px}
.nl b{font-weight:700}
/* timeline */
.tl{position:relative;margin:34px 44px 0 50px;padding-left:58px}
.tl:before{content:"";position:absolute;left:14px;top:16px;bottom:30px;width:4px;border-radius:2px;background:#D1D1D6}
.ev{position:relative;padding-bottom:38px}
.ev:before{content:"";position:absolute;left:-58px;top:9px;width:32px;height:32px;border-radius:50%;background:#fff;border:5px solid ${INK}}
.ev.now:before{background:${INK}}
.yr{font-size:27px;font-weight:600;color:${GREY}}
.what{font-size:35px;font-weight:600;line-height:1.25;margin-top:4px}
/* video edit */
.prev{position:relative;margin:112px 26px 0;height:400px;border-radius:30px;background:radial-gradient(120% 110% at 30% 20%,#5b4636 0%,#2b211b 55%,#141010 100%);overflow:hidden}
.prev .tc{position:absolute;left:30px;bottom:24px;font-family:Disp;font-weight:600;font-size:40px;color:#fff}
.prev .pl{position:absolute;left:50%;top:50%;width:110px;height:110px;margin:-55px 0 0 -55px;border-radius:50%;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center}
.prev .tag{position:absolute;right:24px;top:22px;font-size:26px;font-weight:600;color:#fff;background:rgba(0,0,0,.35);padding:8px 16px;border-radius:16px}
.track{display:flex;gap:8px;margin:30px 26px 0}
.clip{border-radius:16px;height:150px;padding:16px 14px;display:flex;flex-direction:column;justify-content:space-between;color:#fff;font-weight:600}
.clip b{font-size:26px;line-height:1.15}.clip i{font-style:normal;font-size:24px;opacity:.75}
.ruler{display:flex;justify-content:space-between;margin:14px 30px 0;font-size:23px;color:${GREY};font-weight:500}
.head{position:relative;margin:20px 26px 0;height:8px;border-radius:4px;background:#D1D1D6}
.head i{position:absolute;left:0;top:0;bottom:0;width:62%;border-radius:4px;background:${INK}}
/* product page */
.pimg{margin:112px 0 0;height:330px;background:linear-gradient(160deg,#ECE7E1,#D9D1C7);display:flex;align-items:center;justify-content:center}
.pname{font-family:Disp;font-weight:600;font-size:46px;letter-spacing:-.02em;padding:0 40px;margin-top:28px;display:flex;justify-content:space-between;align-items:baseline}
.pname i{font-style:normal;font-family:Text;font-weight:600;font-size:38px}
.perk{display:flex;align-items:center;gap:20px;margin:14px 30px 0;padding:20px 24px;border-radius:24px;background:#fff;font-size:33px;font-weight:600}
.perk .pi{flex:none;width:58px;height:58px;border-radius:50%;background:${INK};display:flex;align-items:center;justify-content:center}
.opt{display:flex;align-items:center;justify-content:space-between;margin:16px 30px 0;padding:24px 28px;border-radius:24px;background:#fff;border:3px solid transparent}
.opt.on{border-color:${INK}}
.opt b{font-size:34px}.opt span{display:block;font-size:26px;color:${GREY};margin-top:2px}.opt em{font-style:normal;font-size:34px;font-weight:700}
.cta{margin:26px 30px 0;height:96px;border-radius:48px;background:${INK};color:#fff;display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:600}
.prow{display:flex;align-items:center;gap:24px;margin:116px 30px 6px;padding:18px 26px;border-radius:24px;background:linear-gradient(160deg,#ECE7E1,#D9D1C7)}
.prow b{font-family:Disp;font-weight:600;font-size:42px;letter-spacing:-.02em}.prow span{display:block;font-size:27px;color:#6E6E73;margin-top:2px}
.lab2{font-size:28px;font-weight:600;color:${GREY};padding:0 34px;margin-top:30px}
/* reviews */
.score{display:flex;align-items:center;gap:30px;margin:118px 40px 0}
.score .n{font-family:Disp;font-weight:600;font-size:150px;letter-spacing:-.04em;line-height:1}
.stars{font-size:44px;letter-spacing:4px;color:${INK}}
.cnt{font-size:28px;color:${GREY};margin-top:6px}
.bar{display:flex;align-items:center;gap:16px;margin:12px 40px 0;font-size:25px;color:${GREY};font-weight:600}
.bar .t{flex:1;height:14px;border-radius:7px;background:#E5E5EA;overflow:hidden}.bar .t i{display:block;height:100%;background:${INK}}
.badges{display:flex;gap:14px;margin:30px 30px 0}
.badge{flex:1;height:110px;border-radius:24px;background:#fff;display:flex;align-items:center;justify-content:center;gap:12px;font-size:28px;font-weight:600;text-align:center;line-height:1.15}
.vogue{font-family:Georgia,'Times New Roman',serif;font-size:44px;font-weight:700;letter-spacing:.06em}
.rev{margin:16px 30px 0;padding:26px 30px;border-radius:24px;background:#fff}
.rev .who{display:flex;justify-content:space-between;align-items:center;font-size:26px;font-weight:600;color:${GREY};margin-top:6px}
/* checklist */
.ck{display:flex;align-items:center;gap:24px;padding:26px 32px;border-top:2px solid #EDEDF0;font-size:35px;font-weight:600}
.ck:first-child{border-top:0}
.ck .c{flex:none;width:52px;height:52px;border-radius:50%;background:${INK};display:flex;align-items:center;justify-content:center}
.ck .k{font-family:Disp;color:${GREY};width:30px}
/* DM */
.dmh{display:flex;align-items:center;gap:20px;padding:110px 30px 22px;border-bottom:2px solid #EFEFEF}
.dmh img{width:84px;height:84px;border-radius:50%}
.dmh b{font-size:33px}.dmh span{display:block;font-size:25px;color:${GREY};font-weight:500}
.dmw{display:flex;flex-direction:column;padding:0 30px}
.dmt{align-self:center;font-size:24px;color:${GREY};font-weight:500;margin:46px 0 18px}
.dmb{align-self:flex-end;font-size:40px;font-weight:700;letter-spacing:.04em;color:#fff;padding:24px 38px;border-radius:44px;background:linear-gradient(135deg,#8B3DFF,#3D6BFF)}
.seen{align-self:flex-end;font-size:24px;color:${GREY};margin-top:10px;font-weight:500}
.dmin{position:absolute;left:24px;right:24px;top:640px;height:86px;border-radius:43px;border:2px solid #E5E5EA;display:flex;align-items:center;padding:0 32px;font-size:30px;color:${GREY}}
`;

const PIN = `<svg width="22" height="26" viewBox="0 0 22 26"><path d="M5 11V8a6 6 0 0 1 12 0v3" fill="none" stroke="#3C3C43" stroke-width="3"/><rect x="2" y="11" width="18" height="13" rx="3" fill="#3C3C43"/></svg>`;
const PLAY = `<svg width="44" height="48" viewBox="0 0 44 48"><path d="M8 4l32 20L8 44z" fill="#fff"/></svg>`;
const RET = `<svg width="30" height="30" viewBox="0 0 30 30"><path d="M8 11h11a7 7 0 0 1 0 14h-6M8 11l5-5M8 11l5 5" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const SHIELD = `<svg width="28" height="30" viewBox="0 0 28 30"><path d="M14 3l10 4v8c0 6-4 10.5-10 12-6-1.5-10-6-10-12V7z" fill="none" stroke="#fff" stroke-width="3.2" stroke-linejoin="round"/></svg>`;
const WRENCH = `<svg width="30" height="30" viewBox="0 0 30 30"><path d="M19 4a7 7 0 0 0-6.6 9.3L4 21.7 8.3 26l8.4-8.4A7 7 0 0 0 26 11l-4.3 4.3-4-1-1-4L21 6a7 7 0 0 0-2-2z" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>`;
const TROPHY = `<svg width="40" height="40" viewBox="0 0 40 40"><path d="M12 5h16v9a8 8 0 0 1-16 0zM12 8H6v3a6 6 0 0 0 6 6M28 8h6v3a6 6 0 0 1-6 6M20 22v7M13 34h14" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const BAG = `<svg width="230" height="230" viewBox="0 0 230 230"><path d="M45 80h140l-12 120H57z" fill="#B59D84"/><path d="M85 82V62a30 30 0 0 1 60 0v20" fill="none" stroke="#8C7660" stroke-width="12" stroke-linecap="round"/></svg>`;
const BOTTLE = (w, h) => `<svg width="${w}" height="${h}" viewBox="0 0 60 120"><rect x="22" y="2" width="16" height="16" rx="3" fill="#8C7660"/><rect x="6" y="18" width="48" height="100" rx="14" fill="#B59D84"/><rect x="14" y="56" width="32" height="26" rx="4" fill="#EFE8DF"/></svg>`;
const PFP = data(path.join(__dirname, '..', '..', '..', 'assets', 'brand', 'mezmedia_pfp.png'), 'image/png');

const slide = (i, head, sub, img, { dark = false, size = 84, wide = 900 } = {}) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}${EXTRA}</style></head>
<body><div class="s${dark ? ' dark' : ''}" style="position:relative"><h1 style="font-size:${size}px;max-width:${wide}px">${head}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}${img}
<div class="foot"><span>@mezmedia_0</span><span>${i}/${N}</span></div></div></body></html>`;
const DARK_BG = 'background:radial-gradient(130% 75% at 50% 0%,#4a4a4e 0%,#1c1c1e 45%,#000 100%);color:#fff';

const slides = [
  slide(1, '<em>Your best ad</em><br>is already written.', 'It’s on your own website. Here are 5 places to look.', phone(`
    <div class="url">${PIN}yourbrand.com/our-story</div>
    <div class="web"><div class="kick">OUR STORY</div><h2 style="margin-top:10px">Made by hand, since 2019</h2>
      <div class="para"><span class="mark">It started with one batch on our kitchen table.</span> Every piece is still made by hand, in small runs, by the same two people.</div>
      <div class="sk" style="width:92%"></div><div class="sk" style="width:78%"></div></div>`, { bg: 'background:#fff' }), { dark: true, size: 90 }),

  slide(2, '<em>Most brands hunt for new ad ideas</em> while their best ones sit on the About page.', '', phone(`<div style="height:100%;background:#fff">
    <div class="nbar"><span>‹ Notes</span><span>Done</span></div><div class="ndate">Monday at 9:41</div><div class="ntitle">Ad ideas</div>
    <div class="nl x"><span>Copy a competitor’s ad</span></div><div class="nl x"><span>Try a trending sound</span></div>
    <div class="nl x"><span>Another 20% off?</span></div><div class="nl x"><span>Hire a model</span></div>
    <div class="nl" style="margin-top:34px"><b>Read our own About page</b></div></div>`), { size: 72, wide: 960 }),

  slide(3, '<em>1.</em> How it started.', 'The first batch on a kitchen table. A garage in 2019. One stall at a Sunday market. Show where it began, then today.', phone(`
    <div class="lt" style="margin-top:118px">Our story</div><div class="st">yourbrand.com/about</div><div class="tl">
      ${[['2019', 'First batch, on the kitchen table'], ['2020', 'Moved into the garage'], ['2022', 'One stall at a Sunday market'], ['Today', 'Our own studio, same two people']]
        .map(([y, w], k) => `<div class="ev${k === 3 ? ' now' : ''}"><div class="yr">${y}</div><div class="what">${w}</div></div>`).join('')}</div>`)),

  slide(4, '<em>2.</em> How it’s made.', 'Hands, tools, the first cut, the last stitch. Ten seconds of the making shows why it’s $120, not $20.', phone(`
    <div class="prev"><div class="tag">Made by hand</div><div class="pl">${PLAY}</div><div class="tc">0:10</div></div>
    <div class="track">${[['Hands', '0:03', 3, '#5B4636'], ['Tools', '0:02', 2, '#76604D'], ['First cut', '0:02', 2, '#8F7864'], ['Last stitch', '0:03', 3, '#A8917B']]
      .map(([t, d, f, c]) => `<div class="clip" style="flex:${f};background:${c}"><b>${t}</b><i>${d}</i></div>`).join('')}</div>
    <div class="head"><i></i></div><div class="ruler"><span>0:00</span><span>0:05</span><span>0:10</span></div>`, { bg: 'background:#F2F2F7' })),

  slide(5, '<em>3.</em> The promise you already make.', '30-day returns. A 2-year guarantee. Free repairs. Put it on screen. It answers “what if it’s not for me?” before anyone asks.', phone(`
    <div class="pimg" style="height:210px">${BAG.replace(/230/g, '170')}</div><div class="pname" style="margin-top:22px">The Everyday Bag<i>$120</i></div>
    ${[[RET, '30-day returns'], [SHIELD, '2-year guarantee'], [WRENCH, 'Free repairs']].map(([ic, t]) => `<div class="perk"><div class="pi">${ic}</div>${t}</div>`).join('')}`), { size: 80 }),

  slide(6, '<em>4.</em> Your cheapest first step.', 'A $9 sample. A travel-size mini. A $5 swatch. Sell the small yes first. The $60 order comes after.', phone(`
    <div class="prow">${BOTTLE(44, 88)}<div><b>Daily Serum</b><span>Choose a size</span></div></div>
    ${[['Full size', '100 ml', '$60', 0], ['Travel mini', '15 ml', '$18', 0], ['Sample', '5 ml', '$9', 1]]
      .map(([t, s, p, on]) => `<div class="opt${on ? ' on' : ''}"><div><b>${t}</b><span>${s}</span></div><em>${p}</em></div>`).join('')}
    <div class="cta">Add to bag · $9</div>`)),

  slide(7, '<em>5.</em> Proof you already have.', '4.9 stars from 800 reviews. An award. One line in Vogue. A real customer in their own words beats another model shot.', phone(`
    <div class="score"><div class="n">4.9</div><div><div class="stars">★★★★★</div><div class="cnt">800 reviews</div></div></div>
    ${[['5', 88], ['4', 8], ['3', 3]].map(([s, p]) => `<div class="bar">${s}★<div class="t"><i style="width:${p}%"></i></div></div>`).join('')}
    <div class="badges"><div class="badge">${TROPHY}Award<br>winner</div><div class="badge" style="flex-direction:column;gap:2px"><span style="font-size:24px;color:${GREY};font-weight:600">As seen in</span><span class="vogue">VOGUE</span></div></div>
    <div class="rev"><div class="stars" style="font-size:34px">★★★★★</div><div class="sk" style="width:94%;margin-top:18px"></div><div class="sk" style="width:70%"></div>
      <div class="who"><span>Verified buyer</span><span>2 days ago</span></div></div>`)),

  slide(8, 'Five ads already<br>on your site.', '', phone(`
    <div class="lt" style="margin-top:118px">Ads to film</div><div class="st">5 done, all from our own site</div><div class="list">
    ${['How it started', 'How it’s made', 'The promise we make', 'Our cheapest first step', 'Proof we already have']
      .map((t) => `<div class="ck"><div class="c">${CHECK}</div>${t}</div>`).join('')}</div>`)),

  slide(9, '<em>Not sure which one</em><br>is yours?', 'DM us TEARDOWN. We’ll review your ads and send 3 ideas, free.', phone(`<div style="height:100%;background:#fff">
    <div class="dmh"><img src="${PFP}"><div><b>mezmedia_0</b><span>Mez Media · We scale brands</span></div></div>
    <div class="dmw"><div class="dmt">Today 9:41</div><div class="dmb">TEARDOWN</div><div class="seen">Seen</div></div>
    <div class="dmin">Message…</div></div>`), { dark: true }),
];

render(slides, process.argv[2], 'post6_bestad');
