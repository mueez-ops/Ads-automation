// Phone pictures for reel_leads.js (frame and page template from phone_screens.js): his lock screen and the
// lead notifications, the "Sales $0" widget, the text where he blames the ads, his campaigns, the leads inbox,
// a qualified lead and a proper follow-up. Toggles, typing, ticks and strike-throughs are drawn by the reel on top.
const { INK, GREY, PERSON, note } = require('./apple_kit');
const { PAGE, FRAMES, renderScreens, dump } = require('./phone_screens');

const CSS = `<style>
.mhead{position:relative;padding:4px 0 18px;text-align:center;background:#F7F7F9;border-bottom:2px solid #E5E5EA}
.mhead .av{margin:0 auto;width:84px;height:84px;font-size:36px}.mhead .nm{font-size:27px;font-weight:500;margin-top:8px}
.back{position:absolute;left:36px;top:36px}
.msgs{display:flex;flex-direction:column;padding:4px 30px 0}
.ts{align-self:center;font-size:24px;font-weight:500;color:${GREY};margin:26px 0 12px}
.bubR,.bubL{max-width:450px;font-size:31px;line-height:1.3;padding:20px 28px;margin-top:8px}
.bubR{align-self:flex-end;background:${INK};color:#fff;border-radius:38px 38px 12px 38px}
.bubL{align-self:flex-start;background:#E9E9EB;color:${INK};border-radius:38px 38px 38px 12px}
.rc{align-self:flex-end;font-size:23px;font-weight:600;color:${GREY};margin-top:8px}
.sys{align-self:center;margin-top:26px;padding:16px 30px;border-radius:40px;background:#F2F2F7;font-size:28px;font-weight:600}
.bar{position:absolute;left:0;right:0;display:flex;align-items:center;gap:16px;padding:0 26px}
.field{flex:1;height:74px;border-radius:37px;border:2px solid #D2D2D7;background:#fff;padding:0 28px;display:flex;align-items:center;font-size:29px;color:#C7C7CC}
.send{flex:none;width:62px;height:62px;border-radius:50%;background:${INK}}
.kb{position:absolute;left:0;right:0;bottom:0;height:500px;background:#D5D7DC;padding:16px 6px 0}
.kr{display:flex;justify-content:center;gap:9px;margin-bottom:20px}
.kr i{font-style:normal;width:50px;height:80px;border-radius:10px;background:#fff;box-shadow:0 2px 0 #9A9CA1;display:flex;align-items:center;justify-content:center;font-size:33px;color:${INK}}
.kr i.w{width:76px;background:#AEB2BA}.kr i.sp{width:290px;font-size:27px}.kr i.rt{width:140px;font-size:27px;background:#AEB2BA}
.tg{flex:none;width:96px;height:58px}
.chip{flex:none;font-size:25px;color:${GREY}}
.lockbg{background:linear-gradient(180deg,#FBFBFD 0%,#ECECF0 55%,#DCDCE2 100%)}
.note{background:rgba(255,255,255,.9);box-shadow:0 4px 14px rgba(0,0,0,.07)}
</style>`;
const CHEV = `<svg width="22" height="38" viewBox="0 0 22 38"><path d="M19 3L4 19l15 16" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const scr = (bg, body) => `${CSS}<div class="scr" style="background:${bg};padding-top:104px">${body}</div>`;
const chat = (name, initial, msgs) => `<div class="mhead"><div class="back">${CHEV}</div><div class="av">${initial}</div><div class="nm">${name}</div></div><div class="msgs">${msgs}</div>`;
const KEYS = `<div class="kb">${['qwertyuiop', 'asdfghjkl'].map((r) => `<div class="kr">${[...r].map((c) => `<i>${c}</i>`).join('')}</div>`).join('')}
  <div class="kr"><i class="w">⇧</i>${[...'zxcvbnm'].map((c) => `<i>${c}</i>`).join('')}<i class="w">⌫</i></div>
  <div class="kr"><i class="w" style="font-size:27px">123</i><i class="sp">space</i><i class="rt">return</i></div></div>`;

// the lock screen, its notifications (one picture each, so they can stack in one by one) and the sales widget
const LOCK = `${CSS}<div class="scr lockbg"><div class="clock" style="color:${INK}"><div class="d">Friday 23 October</div><div class="h">9:41</div></div></div>`;
const NOTES = [47, 46, 45, 44, 43, 42, 41, 40].map((n, i) => `${CSS}<div style="width:600px;padding:4px 0 24px;font-family:Text;color:${INK}">${note('New lead', i ? `${i}m ago` : 'now',
  `Lead #${n} ${['wants a quote.', 'wants a price.', 'wants a call back.', 'sent a message.'][i % 4]}`, PERSON('#fff'))}</div>`);
const SALES = `${CSS}<div style="width:600px;padding:4px 0 30px;font-family:Text"><div style="margin:16px 22px 0;padding:30px 36px 26px;border-radius:42px;background:${INK};color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.18)">
  <div style="font-weight:600;font-size:29px;color:rgba(255,255,255,.6)">Sales this month</div>
  <div style="display:flex;align-items:baseline;gap:20px"><div id="zero" style="font-family:Disp;font-weight:600;font-size:156px;letter-spacing:-.04em;line-height:1.08">$0</div><div style="font-size:31px;color:rgba(255,255,255,.6)">0 customers</div></div></div></div>`;

// his reply to a friend, typed with the keyboard up (the reel types the text into the field)
const CHAT = (sent) => scr('#fff', chat('Mike', 'M', `<div class="ts">Today 18:40</div><div class="bubL">How are the ads going?</div>
  <div class="bubR">47 leads. Zero sales.</div>${sent ? '<div class="bubR" id="new">Meta ads just don’t work.</div><div class="rc">Delivered</div>' : ''}`)
  + `<div class="bar" style="top:690px"><div class="field" id="field">${sent ? 'iMessage' : ''}</div><div class="send"></div></div>${KEYS}`);

const CAMPS = scr('#F2F2F7', `<div class="lt">Campaigns</div><div class="st">4 campaigns</div><div class="list">
  ${[['Leads · Spring offer', '$40 a day'], ['Leads · Retargeting', '$25 a day'], ['Leads · Broad', '$35 a day'], ['Leads · Lookalike', '$30 a day']].map(([n, b], i) => `
  <div class="row" style="padding:24px 32px"><div style="flex:1"><div style="font-size:31px;font-weight:600">${n}</div><div style="font-size:27px;color:${GREY};margin-top:2px">${b}</div></div><div class="tg" id="tg${i}"></div></div>`).join('')}</div>`);

// the inbox: every other lead was never a buyer
const INBOX = scr('#F2F2F7', `<div class="lt">Leads</div><div class="st" id="st">47 new</div><div class="list" id="list">
  ${[['S', 'Sarah', 'Is this free?'], ['J', 'James', 'Need a quote this week'], ['P', 'Priya', 'Wrong number, sorry'], ['T', 'Tom', 'Can you start Monday?'],
    ['A', 'Alex', 'Just browsing'], ['N', 'Nina', 'What’s your availability?'], ['D', 'Dan', 'Clicked by mistake'], ['L', 'Leo', 'Do you do weekends?']].map(([i, n, m], k) => `
  <div class="row" id="r${k}" style="padding:18px 30px"><div class="av" style="width:64px;height:64px;font-size:28px">${i}</div><div style="flex:1;min-width:0">
    <div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-weight:600;font-size:31px">${n}</b><span class="chip">${['9:41', '9:38', '9:30', '9:22', '9:15', '9:07', '8:58', '8:51'][k]}</span></div>
    <div style="font-size:28px;color:#6E6E73;margin-top:2px"><span id="m${k}">${m}</span></div></div></div>`).join('')}</div>`);

const LEAD = scr('#F2F2F7', `<div class="lt">James Carter</div><div class="st">New lead · 9:38</div>
  <div class="card"><div class="lab">Needs</div><div style="font-size:38px;font-weight:600;margin-top:4px">A quote this week</div></div><div class="list">
  ${['Budget confirmed', 'In your service area', 'Ready to start'].map((q, i) => `<div class="row" style="padding:28px 32px"><div style="flex:1;font-size:32px;font-weight:500">${q}</div><div class="tg" style="width:52px;height:52px" id="q${i}"></div></div>`).join('')}</div>`);

const REPLY = scr('#fff', chat('James', 'J', `<div class="ts">Today 09:38</div><div class="bubL" id="m0">Hi, I need a quote this week.</div>
  <div class="ts" id="m1">09:41 · replied in 3 min</div><div class="bubR" id="m2">Hi James, thanks! Free for a quick call at 3?</div>
  <div class="bubL" id="m3">Perfect, 3 works.</div><div class="sys" id="m4">✓  Call booked · Today 15:00</div>`));

const S = (html, h = 1280) => [PAGE(html, 600, h), 600, h];
const SHOTS = {
  ...FRAMES,
  lock: S(LOCK), sales: S(SALES, 330), ...Object.fromEntries(NOTES.map((n, i) => ['note' + i, S(n, 163)])),
  chat0: S(CHAT(false)), chat1: S(CHAT(true)), camps: S(CAMPS), inbox: S(INBOX), lead: S(LEAD), reply: S(REPLY),
};
const screens = () => renderScreens(SHOTS);

module.exports = { screens };
if (require.main === module) dump(screens, process.argv[2]);
