// Phone pictures for reel_cheap.js (frame and page template from phone_screens.js): business A's ad (a low price),
// business B's ad (who it is for, the problem it solves), and a feed with A's ad between two posts.
const { INK, GREY } = require('./apple_kit');
const { PH, PAGE, FRAMES, renderScreens, dump } = require('./phone_screens');

// a sponsored post in the feed; the copy block is what differs between the two businesses
const ad = (name, initial, photo, fy, copy, cta, ink) => `
  <div class="hd"><div class="av" style="${ink ? `background:${INK};color:#fff` : ''}">${initial}</div><div><div class="nm">${name}</div><div class="sp">Sponsored</div></div><div class="dots"><i></i><i></i><i></i></div></div>
  <div class="photo" style="background-image:url(${PH(photo)});background-position:center ${fy}"></div>
  <div class="copy">${copy}</div><div class="cta" id="cta">${cta}</div>
  <div class="acts"><i style="border-radius:50%"></i><i></i><i style="border-radius:4px 12px 12px 12px"></i></div><div class="likes">Liked by 214 others</div>`;
const A_COPY = `<div style="font-weight:700;font-size:44px;letter-spacing:-.01em">Dog grooming</div>
  <div style="display:flex;align-items:baseline;gap:14px;margin-top:4px"><div id="price" style="font-family:Disp;font-weight:600;font-size:150px;letter-spacing:-.04em;line-height:1">$25</div><div style="font-size:30px;color:${GREY}">per groom</div></div>`;
const B_COPY = `<div style="font-weight:700;font-size:48px;letter-spacing:-.015em"><span id="who">For nervous dogs.</span></div>
  <div style="font-weight:500;font-size:33px;line-height:1.32;margin-top:12px;color:#3A3A3C">Calm, one-to-one grooming at home. <span id="prob">No cages. No stress.</span></div>
  <div style="font-size:28px;color:${GREY};margin-top:14px">$60 · at your home</div>`;
const A_AD = ad('Groom &amp; Go', 'G', 'c_studio.jpg', '36%', A_COPY, 'Book now');
const B_AD = ad('Calm Paws', 'C', 'c_home.jpg', '50%', B_COPY, 'Book a calm groom', true);
// a friend's post above and below A's ad, for the scroll-past
const post = (name, initial, photo, fy, text) => `<div class="hd"><div class="av">${initial}</div><div><div class="nm">${name}</div><div class="sp">2h</div></div><div class="dots"><i></i><i></i><i></i></div></div>
  <div class="photo" style="height:600px;background-image:url(${PH(photo)});background-position:center ${fy}"></div>
  <div class="acts"><i style="border-radius:50%"></i><i></i><i style="border-radius:4px 12px 12px 12px"></i></div><div class="likes" style="color:${INK};padding-bottom:40px">${text}</div>`;

const SHOTS = {
  ...FRAMES,
  a: [PAGE(`<div class="scr" style="padding-top:104px">${A_AD}</div>`, 600, 1280), 600, 1280],
  b: [PAGE(`<div class="scr" style="padding-top:104px">${B_AD}</div>`, 600, 1280), 600, 1280],
  feed: [PAGE(`<div class="scr" style="padding-top:104px">${post('jess.travels', 'J', 'o_living.jpg', '55%', 'Sunday reset')}<div id="ad">${A_AD}</div>${post('sam_runs', 'S', 'o_kitchen.jpg', '50%', 'Finally fixed the kitchen')}</div>`, 600, 3400), 600, 3400],
};
const screens = () => renderScreens(SHOTS);

module.exports = { screens };
if (require.main === module) dump(screens, process.argv[2]);
