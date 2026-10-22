// Mez Media carousel: "He got 47 leads. Not one became a customer." (7 slides, 1080x1350), Apple-style like build_signs.js.
// A story in seven screens: the lead notifications, a great first day, follow-ups left on "Read", panic edits,
// the health check that shows what actually broke, the to-do list, and the question that matters.
// Usage: node build_leads.js <out-dir>   (writes <out-dir>/post5_leads/post5_leads_01.png ...)
const { INK, GREY, PERSON, CHECK, phone, slide, note, lock, render } = require('./apple_kit');

const EXTRA = `
.stack{position:relative}.stack .note{position:relative;z-index:2}
.sliver{position:absolute;z-index:1;height:70px;border-radius:0 0 40px 40px;background:rgba(64,64,68,.5)}
.more{text-align:center;font-size:27px;font-weight:500;color:rgba(255,255,255,.55);margin-top:50px}
.bars{display:flex;align-items:flex-end;gap:14px;height:100px;margin-top:12px}
.bars i{flex:1;background:${INK};border-radius:8px 8px 3px 3px}
.okline{display:flex;align-items:center;gap:14px;margin-top:14px;font-size:28px;font-weight:500;color:${GREY}}
.dot{flex:none;width:40px;height:40px;border-radius:50%;background:${INK};display:flex;align-items:center;justify-content:center}
.dot svg{width:20px;height:16px}
.mhead{position:relative;padding:110px 0 20px;text-align:center;background:#F7F7F9;border-bottom:2px solid #E5E5EA}
.mhead .av{margin:0 auto;width:84px;height:84px;font-size:36px}
.mhead .nm{font-size:27px;font-weight:500;margin-top:8px}
.back{position:absolute;left:36px;top:142px}
.msgs{display:flex;flex-direction:column;padding:4px 30px 0}
.ts{align-self:center;font-size:24px;font-weight:500;color:${GREY};margin:28px 0 12px}
.bub{align-self:flex-end;max-width:450px;background:${INK};color:#fff;font-size:30px;line-height:1.3;padding:20px 28px;border-radius:38px 38px 12px 38px}
.rc{align-self:flex-end;font-size:23px;font-weight:600;color:${GREY};margin-top:8px}
.aic{flex:none;width:66px;height:66px;border-radius:50%;background:#F2F2F7;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:30px}
.rt{font-weight:600;font-size:31px}
.rd{font-size:28px;color:${GREY};margin-top:2px}
.rw{flex:none;align-self:flex-start;margin-top:4px;font-size:26px;color:${GREY}}
.ring{flex:none;width:52px;height:52px;border-radius:50%;border:3px solid #C7C7CC}
.xr{flex:none;width:52px;height:52px;border-radius:50%;border:3px solid ${INK};display:flex;align-items:center;justify-content:center}
.foot{text-align:center;font-size:28px;font-weight:500;color:${GREY};margin-top:34px;padding:0 40px}
.nbar{display:flex;justify-content:space-between;align-items:center;padding:112px 36px 0;font-size:31px;font-weight:500}
.ndate{text-align:center;font-size:24px;color:${GREY};margin-top:34px}
.ntitle{font-weight:700;font-size:60px;letter-spacing:-.02em;padding:0 46px;margin-top:22px}
.nline{font-size:37px;line-height:1.32;padding:0 46px;margin-top:26px;text-wrap:balance}
`;
const CHEV = `<svg width="22" height="38" viewBox="0 0 22 38"><path d="M19 3L4 19l15 16" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const PENCIL = `<svg width="30" height="30" viewBox="0 0 30 30"><path d="M5 25l1.5-6L20 5.5a3 3 0 0 1 4.2 4.2L10.7 23.2z" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></svg>`;
const PLUS = `<svg width="28" height="28" viewBox="0 0 28 28"><path d="M14 4v20M4 14h20" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/></svg>`;
const XMARK = `<svg width="22" height="22" viewBox="0 0 22 22"><path d="M5 5l12 12M17 5L5 17" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/></svg>`;
const MORE = `<svg width="46" height="46" viewBox="0 0 46 46"><circle cx="23" cy="23" r="20" fill="none" stroke="${INK}" stroke-width="3"/><g fill="${INK}"><circle cx="14" cy="23" r="2.8"/><circle cx="23" cy="23" r="2.8"/><circle cx="32" cy="23" r="2.8"/></g></svg>`;
const DARK_BG = 'background:radial-gradient(130% 75% at 50% 0%,#4a4a4e 0%,#1c1c1e 45%,#000 100%);color:#fff';

const slides = [
  slide('<em>He got 47 leads.</em><br>Not one became a customer.', phone(`${lock('Friday 23 October')}
    <div class="stack"><div class="sliver" style="left:72px;right:72px;bottom:-34px;opacity:.6"></div><div class="sliver" style="left:46px;right:46px;bottom:-17px"></div>
    ${note('New lead', 'now', 'Lead #47 wants a quote.', PERSON(INK), true)}</div>
    <div class="more">46 more notifications</div>`, { dark: true, bg: DARK_BG }), { dark: true, size: 74, wide: 1000, extra: EXTRA }),

  slide('<em>Day 1.</em> He thought he’d finally cracked advertising.', phone(`<div class="lt">Campaign</div><div class="st">Day 1</div>
    <div class="card"><div class="lab">Enquiries</div><div class="big">12</div><div class="bars">${[18, 26, 22, 38, 47, 60, 72, 88].map((h) => `<i style="height:${h}%"></i>`).join('')}</div></div>
    <div class="card"><div class="lab">Cost per lead</div><div class="big">$4.80</div><div class="okline"><div class="dot">${CHECK}</div>Below your target</div></div>`), { extra: EXTRA }),

  slide('<em>But something felt off.</em> People were submitting forms… then disappearing.', phone(`<div class="mhead"><div class="back">${CHEV}</div><div class="av">S</div><div class="nm">Sarah</div></div>
    <div class="msgs"><div class="ts">Mon 09:14</div><div class="bub">Hi Sarah, thanks for your enquiry! When’s a good time for a quick call?</div><div class="rc">Delivered</div>
    <div class="ts">Wed 11:02</div><div class="bub">Just checking in. Are you still interested?</div><div class="rc">Read 11:05</div></div>`, { bg: 'background:#fff' }), { size: 76, extra: EXTRA }),

  slide('<em>He blamed Meta.</em> But he hadn’t investigated the real problem.', phone(`<div class="lt">Activity</div><div class="st">This week</div><div class="list">
    ${[[PENCIL, 'Audience changed', 'Interests → Broad', 'Tue'], ['$', 'Budget changed', '$20 → $50 a day', 'Tue'], [PLUS, 'Campaign launched', 'Leads_v2_NEW', 'Wed'],
      [PENCIL, 'Audience changed', 'Broad → Lookalike', 'Thu'], ['$', 'Budget changed', '$50 → $35 a day', 'Fri']].map(([ic, t, d, w]) => `
      <div class="row"><div class="aic">${ic}</div><div style="flex:1;min-width:0"><div class="rt">${t}</div><div class="rd">${d}</div></div><div class="rw">${w}</div></div>`).join('')}</div>`), { size: 76, extra: EXTRA }),

  slide('<em>His ads were working.</em> The problem was everything after.', phone(`<div class="lt">Health check</div><div class="st">Lead journey</div><div class="list">
    ${[['Ads', 'Attracting enquiries', 1], ['Offer', 'Not clear enough', 0], ['Lead qualification', 'Weak', 0], ['Follow-up', 'No consistent process', 0]].map(([t, d, ok]) => `
      <div class="row" style="padding:26px 32px"><div style="flex:1;min-width:0"><div class="rt" style="${ok ? `color:${GREY}` : ''}">${t}</div><div class="rd">${d}</div></div>
      ${ok ? `<div class="dot" style="width:52px;height:52px;background:#C7C7CC">${CHECK}</div>` : `<div class="xr">${XMARK}</div>`}</div>`).join('')}</div>
    <div class="foot">More leads won’t fix this.</div>`), { size: 76, extra: EXTRA }),

  slide('<em>Instead of chasing cheaper leads,</em> he needed to:', phone(`<div class="lt">Next steps</div><div class="st">4 reminders</div><div class="list">
    ${['Clarify the offer', 'Define a qualified lead', 'Improve follow-up', 'Track which leads became customers'].map((t) => `
      <div class="row" style="padding:28px 32px"><div class="ring"></div><div style="font-size:33px;font-weight:500;line-height:1.25">${t}</div></div>`).join('')}</div>`), { extra: EXTRA }),

  slide('<em>47 leads means nothing</em> without context.', phone(`<div style="height:100%;background:#fff">
    <div class="nbar"><span style="display:flex;align-items:center;gap:14px">${CHEV}Notes</span>${MORE}</div>
    <div class="ndate">23 October 2026 at 09:41</div><div class="ntitle">The real question</div>
    <div class="nline" style="color:${GREY};text-decoration:line-through;text-decoration-thickness:3px">How many leads did we get?</div>
    <div class="nline" style="font-weight:600">How many became valuable customers?</div></div>`), { dark: true, extra: EXTRA }),
];

render(slides, process.argv[2], 'post5_leads');
