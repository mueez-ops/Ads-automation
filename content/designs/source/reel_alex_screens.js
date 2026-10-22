// Phone pictures for reel_alex.js (frame and page template from phone_screens.js): the ad Alex keeps editing (photo,
// price, audience), his campaign with the switch he nearly flips, his booking page with the "Book now" button, the
// lock screen that fills with bookings, and an incoming call. Switches, taps, cracks and the booked sheet are drawn
// by the reel on top. Alex's business is made up.
const { INK, GREY, note, PERSON } = require('./apple_kit');
const { PH, PAGE, FRAMES, renderScreens, dump } = require('./phone_screens');

const CSS = `<style>
.chip{display:inline-block;margin:0 10px 12px 0;padding:14px 22px;border-radius:30px;background:#F2F2F7;font-size:27px;font-weight:500}
.sheet{position:absolute;left:0;right:0;bottom:0;height:520px;background:#fff;border-radius:44px 44px 0 0;box-shadow:0 -10px 40px rgba(0,0,0,.14);padding:20px 34px 0}
.grab{width:70px;height:9px;border-radius:5px;background:#D1D1D6;margin:0 auto 26px}
.slot{height:120px;margin-top:6px}
.day{display:inline-block;margin-right:12px;padding:16px 26px;border-radius:22px;border:2px solid #D2D2D7;font-size:27px;font-weight:600;text-align:center}
.lockbg{background:linear-gradient(180deg,#FBFBFD 0%,#ECECF0 55%,#DCDCE2 100%)}
.note{background:rgba(255,255,255,.9);box-shadow:0 4px 14px rgba(0,0,0,.07)}
</style>`;
const scr = (bg, body) => `${CSS}<div class="scr" style="background:${bg};padding-top:104px">${body}</div>`;

// the ad: photo, headline, price; three versions as he changes them
const ED = (photo, fy, price, off) => scr('#fff', `<div style="display:flex;align-items:center;justify-content:space-between;padding:22px 34px 18px"><span style="font-size:30px;color:${GREY}">Cancel</span><b style="font-size:31px;font-weight:600">Edit ad</b><span style="font-size:30px;font-weight:600">Publish</span></div>
  <div class="hd"><div class="av" style="background:${INK};color:#fff">A</div><div><div class="nm">Alex’s Home Cleaning</div><div class="sp">Sponsored</div></div><div class="dots"><i></i><i></i><i></i></div></div>
  <div class="photo" id="ph" style="height:440px;background-image:url(${PH(photo)});background-position:center ${fy}"></div>
  <div style="padding:22px 34px;background:#F2F2F7"><b style="font-size:33px;font-weight:600">Spotless homes, booked online</b>
    <div id="pr" style="display:flex;align-items:center;gap:14px;margin-top:6px;font-size:29px;color:#3A3A3C">Deep clean from <b style="font-weight:700;color:${INK}">${price}</b>${off ? `<span style="padding:4px 14px;border-radius:12px;background:${INK};color:#fff;font-size:24px;font-weight:600">$20 off</span>` : ''}</div></div>`);
const SHEET = (chips) => `${CSS}<div class="scr" style="background:transparent;height:560px"><div class="sheet"><div class="grab"></div>
  <div style="font-size:36px;font-weight:700;margin-bottom:20px">Audience</div><div id="chips">${chips.map((c) => `<span class="chip">${c}</span>`).join('')}</div>
  <div style="font-size:26px;color:${GREY};margin-top:10px">Estimated reach: large</div></div></div>`;

// his campaign: two months, $2,000, no customers, and the switch
const AM = scr('#F2F2F7', `<div class="lt">Campaigns</div><div class="st">Alex’s Home Cleaning · last 60 days</div>
  <div class="card"><div class="lab">Amount spent</div><div class="big">$2,000</div></div>
  <div class="card"><div class="lab">Customers</div><div class="big">0</div></div>
  <div class="list"><div class="row" style="padding:24px 32px"><div style="flex:1"><div style="font-size:31px;font-weight:600">Spring deep clean</div><div style="font-size:27px;color:${GREY};margin-top:2px">Active</div></div><div id="tg" style="flex:none;width:96px;height:58px"></div></div></div>`);

// his booking page, as it looks on a phone
const SITE = scr('#fff', `<div style="display:flex;align-items:center;justify-content:space-between;padding:18px 34px 20px;border-bottom:2px solid #EDEDF0"><b style="font-size:30px;font-weight:700">Alex’s Home Cleaning</b>
    <div style="display:flex;flex-direction:column;gap:7px"><i style="width:34px;height:4px;border-radius:2px;background:${INK}"></i><i style="width:34px;height:4px;border-radius:2px;background:${INK}"></i><i style="width:34px;height:4px;border-radius:2px;background:${INK}"></i></div></div>
  <div class="photo" style="height:380px;background-image:url(${PH('o_living.jpg')});background-position:center 62%"></div>
  <div style="padding:30px 34px 0"><div style="font-size:44px;font-weight:700;letter-spacing:-.01em">Book a deep clean</div>
    <div style="font-size:28px;color:${GREY};margin-top:6px">From $109 · about 3 hours</div>
    <div style="margin-top:26px">${['Fri', 'Sat', 'Mon', 'Tue'].map((d) => `<span class="day">${d}</span>`).join('')}</div>
    <div id="book" style="margin-top:34px;height:108px;border-radius:54px;background:${INK};color:#fff;font-size:36px;font-weight:600;display:flex;align-items:center;justify-content:center">Book now</div>
    <div style="font-size:25px;color:${GREY};text-align:center;margin-top:18px">Free cancellation</div></div>`);

// Friday: the lock screen fills with bookings; then a call
const LOCK = `${CSS}<div class="scr lockbg"><div class="clock" style="color:${INK}"><div class="d">Friday 23 October</div><div class="h">9:41</div></div></div>`;
const BOOKINGS = ['Deep clean · Fri 2:00 pm', 'Deep clean · Sat 10:00 am', 'Move-out · Mon 9:00 am', 'Deep clean · Tue 1:00 pm'];
const NB = BOOKINGS.map((b, i) => `${CSS}<div style="width:600px;padding:4px 0 24px;font-family:Text;color:${INK}">${note('New booking', i ? `${i * 3}m ago` : 'now', b, PERSON('#fff'))}</div>`);
const CALL = `${CSS}<div class="scr" style="background:radial-gradient(120% 70% at 50% 18%,#5a5a60 0%,#26262a 50%,#0b0b0c 100%);color:#fff;font-family:Text">
  <div style="text-align:center;padding-top:250px"><div style="font-size:30px;color:rgba(255,255,255,.65)">mobile</div><div style="font-family:Disp;font-weight:600;font-size:76px;letter-spacing:-.02em;margin-top:6px">New customer</div></div>
  <div style="position:absolute;left:0;right:0;top:1000px;display:flex;justify-content:space-around">
    <div style="text-align:center"><div style="width:150px;height:150px;border-radius:50%;background:#3A3A3C;display:flex;align-items:center;justify-content:center">${PHONE('#fff', 135)}</div><div style="font-size:26px;margin-top:12px">Decline</div></div>
    <div style="text-align:center"><div id="accept" style="width:150px;height:150px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center">${PHONE(INK, 0)}</div><div style="font-size:26px;margin-top:12px">Accept</div></div></div></div>`;
function PHONE(c, rot) { return `<svg width="64" height="64" viewBox="0 0 24 24" style="transform:rotate(${rot}deg)"><path fill="${c}" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z"/></svg>`; }

const S = (html, h = 1280) => [PAGE(html, 600, h), 600, h];
const SHOTS = {
  ...FRAMES,
  ed0: S(ED('o_kitchen.jpg', '58%', '$129')), ed1: S(ED('o_living.jpg', '62%', '$129')), ed2: S(ED('o_living.jpg', '62%', '$109', true)),
  aud0: S(SHEET(['Age 30–65', 'Homeowners', 'Within 15 miles']), 560), aud1: S(SHEET(['Age 25–54', 'Parents', 'Within 30 miles']), 560),
  am: S(AM), site: S(SITE), lock: S(LOCK), call: S(CALL), ...Object.fromEntries(NB.map((n, i) => ['nb' + i, S(n, 163)])),
};
const screens = () => renderScreens(SHOTS);

module.exports = { screens };
if (require.main === module) dump(screens, process.argv[2]);
