# Mez Media: first Instagram posts

All images are 1080×1350 (4:5) for posts and 1080×1920 for the Reel cover. Fonts: Archivo Black (headlines) + Inter (text), flat light background, green highlight on the key words. Rebuild with `node source/build_v3.js <out-dir>`.

## Posting order
| # | When | What | Files |
|---|---|---|---|
| 1 | Sun 18 Oct | **Launch Reel**: your video, with this cover | `launch_reel_cover.png` |
| 2 | Sun 18 or Mon 19 | **Carousel: Introducing Mez Media** (4 slides) | `post1_intro/` |
| 3 | Mon 19 | **Carousel: Break-even ROAS** (6 slides) | `post2_roas/` |
| 4 | Tue 20, morning | **Carousel: 3 things I check** (5 slides) | `post3_checks/` |

Upload carousel slides in number order (01, 02, 03…).

## Captions

**Introducing Mez Media**
> An ad has about half a second to stop the scroll. Mez Media helps UK skincare brands win it, with Meta & TikTok ads, scroll-stopping creative and proper tracking.
> Run a skincare brand? DM "TEARDOWN" for a free 2-minute review of your ads.
> #metaads #tiktokads #skincarebrand #ukskincare #paidsocial #indiebeauty

**Break-even ROAS**
> Most skincare brands set their ROAS target by gut feel. Work out your break-even first: 1 ÷ your margin. Comment ROAS and I'll calculate yours.
> #roas #metaads #skincarebrand #ecommercetips #dtcmarketing #shopify

**3 things I check**
> 3 things I check in every skincare ad. Under a minute. Most fixes cost less than more ad spend. Want yours checked? DM "TEARDOWN".
> #adteardown #metaads #skincaremarketing #creativestrategy #ukskincare

## Carousel: 5 signs your Meta Ads might be wasting money
Files: `post4_signs/` (7 slides). Apple-style: one centred headline per slide above an iPhone whose screen shows the point; light grey slides, black for the first and last; no numbers or labels. Inter Display + Inter. Rebuild with `node source/build_signs.js <out-dir>`.

**Caption**
> Most wasted ad spend doesn't show up as a high cost per click. It hides in these 5 places.
>
> Sign 4 is the one most people skip: what happens after a lead comes in. Slow replies and no sales tracking can make good Meta ads look like they don't work.
>
> The quick audit before you spend more: your offer, your creative, your lead quality, your follow-up process and your conversion tracking.
>
> Save this for your next campaign review.
>
> #metaads #facebookads #leadgeneration

**Alt text (cover)**
> Black slide with the white headline "5 signs your Meta Ads might be wasting money." above an iPhone lock screen showing two notifications: "Payment processed: $1,240 charged for ads" and "Weekly report: 2,138 clicks. 0 customers."

## Carousel: He got 47 leads. Not one became a customer.
Files: `post5_leads/` (7 slides), same Apple-style kit as above (`source/apple_kit.js`). A story in seven screens: the lead notifications, a great Day 1, follow-ups left on "Read", panic edits, the health check, the to-do list, the real question. Rebuild with `node source/build_leads.js <out-dir>`.

**Caption**
> 47 leads from Meta ads. 0 customers. And the ads were never the problem.
>
> Day 1 looked great: 12 enquiries at $4.80 a lead. People kept filling in the form. But the offer wasn't clear, nobody checked if they were a good fit, and follow-up happened whenever someone remembered.
>
> So he changed the audience, then the budget, then launched another campaign. None of that touches what happens after someone enquires.
>
> If you've had a month like this, I'd look at the follow-up first. Decide what a qualified lead looks like for you, how fast you'll reply, and track which leads became customers. That's the number that pays you.
>
> (The story's an example, not a client.)
>
> Save this before your next ad campaign.
>
> #metaads #leadgeneration #facebookads

**Alt text (cover)**
> Black slide with the headline "He got 47 leads. Not one became a customer." above an iPhone lock screen with a stacked "New lead: Lead #47 wants a quote" notification and "46 more notifications" under it.

## Carousel: Your best ad is already written.
Files: `post6_bestad/` (9 slides), same Apple-style kit (`source/apple_kit.js`), now with a short line under each headline, @mezmedia_0 top left and a page count top right. Five ads hiding on a brand's own website, each on a phone: the story page with the line that's already an ad, a Notes list of ad ideas crossed out, the brand timeline, a 10-second edit of the making, the promise on the product page, the $9 sample, the reviews, the checklist to screenshot, and the TEARDOWN DM. The brand on the screens is made up ("Your Brand"); the numbers are illustrations, not claims. Rebuild with `node source/build_bestad.js <out-dir>`.

**Caption**
> Before you pay for new ad ideas, read your own About page.
>
> Most brands treat ad creative as something to invent from scratch. But the hooks that sell are things you already say: where you started, how it's made, a 30-day return policy, a $9 sample, the reviews you've earned.
>
> That's 5 ads. Each one is a 10-second Meta ads clip you can film this week on your phone.
>
> Not sure which one is hiding on your site? DM us TEARDOWN and we'll review your ads and send 3 ideas, free.
>
> #metaads #adcreative #facebookads

**Alt text (cover)**
> Black slide with the headline "Your best ad is already written." and "It's on your own website. Here are 5 places to look." above an iPhone showing a brand's Our Story page, with the line "It started with one batch on our kitchen table" highlighted in yellow.

## Reel: "Breaking news" launch (black and white)
File: `reels/mezmedia_breaking_news_launch.mp4` (1080×1920, 30fps, about 24.5s, deep British voiceover (Kokoro bm_lewis, fast read) + music + SFX, -14 LUFS).
Rebuild: `python3 source/reel_news_vo.py <kokoro-dir> <tmp>` → `node source/reel_news.js <frames> <video.mp4>` → `python3 source/reel_news_audio.py <tmp>/vo.wav <mix.wav>`, then mux. Photos are free Pexels images converted to black and white (`source/photos/`).

**Script**
> Breaking news. A thumb has stopped scrolling. Witnesses say it stopped… for an ad.
> Every day, brands pay to be scrolled past. Scattered posts. Random boosts. No plan.
> So we connect the dots. Hook. Story. Offer. Scale.
> So we build ads… people can't scroll past.
> Mez Media. Now live.
> Run a brand? DM us "teardown". Your first ad review is on us.
> Now… back to your scrolling.

**Caption**
> BREAKING: a thumb stopped scrolling. 🗞️
>
> Most brands pay for ads people scroll straight past. We build the other kind: hook, story, offer, scale.
>
> Mez Media is now live. Paid ads for brands.
>
> Run a brand? DM us "TEARDOWN" and we'll review your ads for free.
>
> #paidads #metaads #instagramads #facebookads #ecommerce #shopify #dtcbrand #adcreative #brandgrowth #mezmedia

## Reel: "47 leads. Zero sales." (Apple-style)
File: `reels/mezmedia_reel_47leads.mp4` (1080×1920, 30fps, 22.4s, Kokoro af_heart voiceover (fast read) + music + SFX, -14 LUFS, voice 12.6 dB over the bed). Same story as the "47 leads" carousel, told as a reel: the leads pour onto his lock screen, $0 in sales, he texts "Meta ads just don't work" and starts switching campaigns off, then turns the phone round to the leads and half of them were never buyers. The right lead and a reply in 3 minutes, then the lesson on black (leads pouring into a cracked funnel, 0 sales) and the follow end card.
Rebuild: `python3 source/reel_leads_vo.py <kokoro-dir> <tmp>` → `node source/reel_leads.js <frames> <video.mp4>` → `python3 source/reel_leads_audio.py <tmp>/vo.wav <mix.wav> <sfx-cache>`, loudnorm to -14 LUFS, then mux. Screens are HTML (`source/reel_leads_screens.js`) drawn by the shared phone engine (`source/reel_phone_kit.js`).

**Caption**
> How fast do you reply to a new lead? Be honest, tell me below.
>
> He got 47 leads from his ads and made zero sales. So he blamed Meta ads and nearly switched off all 4 campaigns.
>
> Then he read the leads. Half weren't buyers at all: a wrong number, someone just browsing, a click by mistake.
>
> The ads did their job. Lead quality was the problem, and so was the follow-up. The good leads didn't hear back for days.
>
> The fix wasn't clever. One good lead got a reply in 3 minutes and had a call booked for 3pm the same day.
>
> Before you put more money into Meta ads, I'd check two things: who your ads attract, and how quickly you follow up with leads once they enquire.
>
> (The story's an example, not a client.)
>
> #metaads #leadgeneration #smallbusiness

## Reel: "2,000 clicks. Zero enquiries." (Apple-style)
File: `reels/mezmedia_reel_2000clicks.mp4` (1080×1920, 30fps, 22.4s, Kokoro af_heart voiceover at a natural pace + music + SFX, -14 LUFS, voice 14.3 dB over the bed). Hook on screen at frame 0 ("2,000 clicks. 0 enquiries."), which folds into the numbers on a results screen with the campaign goal blurred out. The ad gets a new photo, headline and audience; clicks keep coming, enquiries stay at 0. Inside the campaign (black) the goal is revealed as Traffic, a crowd shows Meta pulling out the people who click, then the goal is switched to Leads and the people who enquire come through. Last line on screen as big type; a silent follow tap on the end card. The business is made up.
Rebuild: `python3 source/reel_goal_vo.py <kokoro-dir> <tmp>` → `node source/reel_goal.js <frames> <video.mp4>` → `python3 source/reel_goal_audio.py <tmp>/vo.wav <mix.wav> <sfx-cache>`, loudnorm to -14 LUFS, then mux. Screens: `source/reel_goal_screens.js`; shared phone engine: `source/reel_phone_kit.js`.

**Script**
> 2,000 clicks. Zero enquiries.
> You asked Meta for the wrong thing.
> So you change the photo. The headline. Even the audience.
> Still nothing.
> That's because Meta gives you exactly what you ask for.
> Pick Traffic, and it'll find you people who click. Not people who enquire.
> Pick Leads, and it goes looking for the ones who fill in the form.
> Ask for enquiries, not clicks.

**Caption**
> Which goal is your campaign set to right now? Check it, then tell me below.
>
> If your Meta ads get clicks but no leads, look at this before you change the photo, the headline or the audience.
>
> It's the first thing Ads Manager asks you to pick: Awareness, Traffic, Engagement, Leads, App promotion or Sales. Meta optimises for the campaign goal you choose. Pick Traffic and it finds people who are likely to click. That's a different crowd from the people who fill in a form.
>
> Pick Leads and it goes looking for people likely to enquire. Ask for the result you actually want.
>
> Once the leads come in, the next step is telling Meta which ones turned into customers, so it can find more people like them.
>
> (The business in the reel, Home Refit Co., is made up.)
>
> #metaads #leadgeneration #facebookads

## Reel: "Alex spent $2,000 on Meta ads" (story, Apple-style)
File: `reels/mezmedia_reel_alex.mp4` (1080×1920, 30fps, 30.0s, Kokoro af_heart voiceover at a natural pace + music + SFX, -14 LUFS, voice 14.9 dB over the bed). A person-led story. Frame 0 is a photo of Alex staring at his phone with "$2,000 on ads. 0 customers." on screen and a name card ("Alex · runs a cleaning company", labelled EXAMPLE STORY). His daughter Sara and a ten-second stopwatch open the loop by 3.8 s. On his phone he tries everything (a new photo, $20 off, a new audience); still nothing; his thumb stops over the switch in Ads Manager. Sara takes the phone, the camera goes into the screen, she taps "Book now" twice and nothing happens; the button cracks: it didn't work on phones. Two months go by on a calendar and a crowd of clicks bounces off the button. He fixes it: "Booked", the Friday lock screen fills with bookings, a new customer calls and Alex laughs. The lesson rises line by line as big type, then a silent follow tap on the end card. Alex, Sara and the business are made up. The photos are free Pexels photos (7534380, 7534382, 7534793 for Alex; 4144288, 4144290 for Sara), graded, in `source/photos/`.
Rebuild: `python3 source/reel_alex_vo.py <kokoro-dir> <tmp>` → `node source/reel_alex.js <frames> <video.mp4>` → `python3 source/reel_alex_audio.py <tmp>/vo.wav <mix.wav> <sfx-cache>`, loudnorm to -14 LUFS, then mux. Screens: `source/reel_alex_screens.js`; scenes: `source/reel_alex_scene.js`; shared phone engine: `source/reel_phone_kit.js`.

**Script**
> Alex spent $2,000 on Meta ads.
> Not one customer.
> His daughter found out why in ten seconds.
> He tried everything. New photos. $20 off. A new audience.
> Still nothing.
> He opened Ads Manager to switch it all off.
> Then Sara grabbed his phone and tried to book a cleaning.
> She tapped Book now.
> Nothing.
> The button didn't work on phones.
> Two months. Every click, a dead end.
> He fixed it that night, and by Friday his phone was ringing.
> Before you blame your ads, try booking yourself, on your phone.

**Caption**
> Alex spent $2,000 on ads and lost it to one broken button. When did you last test yours on your phone? Tell me below.
>
> A story, but maybe you've lived it.
>
> If your Meta ads get clicks but no sales, the ad might not be the problem. People tap your ad on their phone. Plenty of booking pages and landing pages only ever get checked on a laptop, by the person who built them.
>
> So before you change the photo, the price or the audience again, do what Sara did. It takes two minutes. Open your ad on your phone. Tap it. Pick a time, fill in the form, press Book now or Buy, and go right to the confirmation screen.
>
> Button does nothing? Form won't send? Page takes 10 seconds to load? That's where your ad money goes.
>
> (Alex, Sara and the cleaning company are made up.)
>
> #metaads #facebookads #landingpage

## Reel: "If Meta can't see your sales" (Apple-style)
File: `reels/mezmedia_reel_pixel.mp4` (1080×1920, 30fps, 27.7s, Kokoro af_heart voiceover at a natural pace + music + SFX, -14 LUFS, voice 16.3 dB over the bed). Hook on screen at frame 0 ("12 sales. Meta saw 0."), which folds into two phones: the store's orders (12) and Ads Manager (Purchases 0). Twelve orders come in and get a tick; the 0 shakes. On black, Meta keeps guessing who buys: ads fly to people in a crowd and every one misses. "Why?" opens on the store's thank-you page, where the tracking code reads "Not firing". The 2-minute fix: Events Manager, Test events, a test purchase from the store; "Waiting for activity…", nothing; then "Tracking code: firing" and a Purchase comes through. Last line on screen as big type; a silent follow tap on the end card. The store (Glow Candle Co.) is made up and the phone screens are plain mock-ups, no real logos. Candle photo: Pexels 6755741, in `source/photos/candle.jpg`.
Rebuild: `python3 source/reel_pixel_vo.py <kokoro-dir> <tmp>` → `node source/reel_pixel.js <frames> <video.mp4>` → `python3 source/reel_pixel_audio.py <tmp>/vo.wav <mix.wav> <sfx-cache>`, loudnorm to -14 LUFS, then mux. Screens: `source/reel_pixel_screens.js`; scenes: `source/reel_pixel_scene.js`; shared phone engine: `source/reel_phone_kit.js`.

**Script**
> If Meta can't see your sales, it can't find you more buyers.
> This store sold 12 candles last week.
> Shopify showed all 12. Ads Manager showed 0.
> So Meta kept guessing who buys, and kept guessing wrong.
> Why?
> The tracking code wasn't firing on the thank-you page.
> Two-minute fix: open Events Manager, tap Test events, and buy from your own store.
> Nothing? Fix that first.
> Meta finds buyers by watching the ones you already have.

**Caption**
> Did your last sale show up in Ads Manager? Check it today, then tell me below.
>
> When your Meta ads bring in sales your store can see and Ads Manager shows none, check the tracking first. If the Meta pixel (or the Conversions API) never fires a Purchase event on your thank-you page, every sale happens where Meta can't see it. So it keeps guessing who buys, and you keep paying for the guesses.
>
> The 2-minute check: open Events Manager, go to Test events, and buy something from your own store. No Purchase showing up? Fix that before you touch the ads, the audience or the budget.
>
> Meta finds new buyers by learning from the ones you already have.
>
> (The candle store in the reel is made up.)
>
> #metaads #metapixel #facebookads

## Reel: "Stop editing your ads every day" (Apple-style)
File: `reels/mezmedia_reel_edits.mp4` (1080×1920, 30fps, 29.8s, Kokoro af_heart voiceover at a natural pace + music + SFX, -14 LUFS, voice 12.8 dB over the bed). Hook on screen at frame 0 ("7 edits. Still learning."), which folds into the ad set: status Learning, 4 of 50 results, 7 edits this week. The week rewinds to Monday, and each edit (a new headline, a bigger budget, a new audience) is published and knocks the ad set back to Learning at 0 of 50. "Feels like progress": the three "published" notices stack up. "It isn't." On black, the learning meter climbs and an edit knocks it back to 0; it needs 50 results in 7 days, and with an edit every day it never gets there. The budget: 7 days of $35 pour into "Learning" ($245) while "Selling" stays at $0. The fix: all three changes in one edit ("Publish all"), then the same meter on light fills to 50 of 50 as the week goes by with no edits, and the status turns Active. Last line on screen as big type; a silent follow tap on the end card. The ad set and the phone screens are plain mock-ups, no real logos.
Rebuild: `python3 source/reel_edits_vo.py <kokoro-dir> <tmp>` → `node source/reel_edits.js <frames> <video.mp4>` → `python3 source/reel_edits_audio.py <tmp>/vo.wav <mix.wav> <sfx-cache>`, loudnorm to -14 LUFS, then mux. Screens: `source/reel_edits_screens.js`; scenes: `source/reel_edits_scene.js`; shared phone engine: `source/reel_phone_kit.js`.

**Script**
> Stop editing your ads every day. Here's what it's costing you.
> Monday, a new headline. Tuesday, a bigger budget. Wednesday, a new audience.
> Feels like progress.
> It isn't.
> Every one of those edits sends your ad set back into learning, and Meta needs about 50 results in 7 days to finish.
> Edit daily, and it never finishes.
> Your budget pays for learning, not selling.
> Make your changes in one go, then leave the ad alone for 7 days.
> Boring ads that keep running beat clever ads that keep restarting.

**Caption**
> How many times did you edit your Meta ads this week? Count them, then comment the number.
>
> Every big change you make sends the ad set back into the learning phase: new creative, a new audience, a big budget jump. To get out, it needs about 50 results in the 7 days after your last big edit. If you're editing every day, it never gets there.
>
> While it's learning, delivery is less steady and you usually pay more for each result. You can check in Ads Manager. The Delivery column says Learning.
>
> The fix is boring. Make all your changes in one edit, then don't touch it for 7 days. Judge it after that.
>
> (The ad set in the reel is a mock-up.)
>
> #metaads #facebookads #adsmanager

## Reel: "Nobody tells you the Burj Khalifa has a lounge above its observation deck" (switch reel, v2)
File: `reels/mezmedia_reel_burj_v2.mp4` (1080×1920, 30fps, 24.5s, Kokoro af_heart voiceover at a natural pace + music + SFX, -14 LUFS, voice 14.3 dB over the bed). The retention rebuild of `reels/mezmedia_reel_burj.mp4` (v1, 29.1s), which 87% of viewers skipped in the first seconds: v1 opened on "Let me explain what's on the top floors of the Burj Khalifa" (hook score 34.8) over a slow zoom on a still tower. v2 opens on a curiosity gap (hook score 81.6) with the written hook "A lounge above the observation deck." on screen from frame 0, and the camera whips up the tower from the first frame. Mez Media's look from start to end: Inter type, captions one word at a time just below the centre, white outlines and pills over the photo. Floors 152–154 get a white outline and a "Floors 152–154" pill with the observation deck marked below them, and a dashed line measures 585 m up from the ground. The camera drops and The Lounge's photo card comes out of those floors, with "The Lounge", "World record" (Guinness World Records: highest lounge in a building, 585.36 m, level 154) and "Booking only" pills. Then the colour drains under a heartbeat and a clock, and it switches: the reel shrinks into an iPhone on black, its clock counts to 0:15 ("You've just watched this reel for 15 seconds", the real time when it is spoken), the post turns into an ad (yourbrand · Sponsored · Book now), and the pitch is on screen as big type: "We scale businesses with ads like this. DM us the word teardown for a free ad review." No end card: the last frame cuts back into the hook, so it loops. 13 s of facts instead of 16.
The floor outline is placed from the tower's known heights (a perspective fit through the antenna tip and the copper mechanical bands at levels 40-42, 73-75, 109-111 and 136-138), good to a couple of floors; the observation deck line (At the Top SKY, level 148, 555 m) comes from the same fit.
Photos: the tower is Pexels 3463043 (Pexels licence), in `source/photos/burj_tower.jpg`; the lounge photo came with the brief and carries a "Dubai Ticket Expert" watermark, used as supplied in `source/photos/burj_lounge.jpg` (swap in a licensed copy before posting).
Rebuild: `python3 source/reel_burj_vo.py <kokoro-dir> <tmp>` → `node source/reel_burj.js <frames> <video.mp4>` → `python3 source/reel_burj_audio.py <tmp>/vo.wav <mix.wav> <sfx-cache>`, loudnorm to -14 LUFS, then mux. Scenes: `source/reel_burj_scene.js`; shared phone engine: `source/reel_phone_kit.js`.

**Script**
> Nobody tells you the Burj Khalifa has a lounge above its observation deck.
> It sits 585 metres up.
> It's called The Lounge, the highest in the world,
> with afternoon tea and a terrace over Dubai.
> And you can only get in with a booking.
> (tension)
> You've just watched this reel for 15 seconds.
> Imagine your ad held people that long.
> We scale businesses with ads like this.
> DM us the word teardown for a free ad review.

**Caption**
> DM us the word TEARDOWN and we'll review your ads for free.
>
> You came for the lounge above the Burj Khalifa's observation deck and stayed 15 seconds. Nobody asked you to. Curiosity did the work.
>
> That's the first job of any ad: give people a reason to keep watching before you ask for anything. If your Meta ads open with the logo, the price or "limited offer", people scroll before they hear why they should care.
>
> We scale businesses with Instagram ads built the other way round: a hook people want to finish, then the offer.
>
> The facts are real, by the way. The Lounge on floors 152 to 154 sits 585 m up, above the At the Top SKY deck on level 148, and holds the Guinness World Record for the highest lounge in a building. You need a booking to get in.
>
> (Lounge photo: Dubai Ticket Expert.)
>
> #metaads #instagramads #burjkhalifa

## Reel: "Nobody tells you the Eiffel Tower has a secret apartment at the top" (switch reel)
File: `reels/mezmedia_reel_eiffel.mp4` (1080×1920, 30fps, 23.0s, Kokoro voiceover read like a fast facts short + music + SFX, -14 LUFS, voice 18.3 dB over the bed). The voice: 70% af_heart with 30% af_sarah for a livelier pitch, each line in one take at 1.3×, tight gaps, a beat before "In. Wax.", and a close, punchy vocal chain (presence lift, harder compression, limiter); the style of a fast facts short, not anyone's actual voice. The Burj Khalifa v2 format on a new story, with what v2 fixed built in from the start: the hook as a curiosity gap (hook score 88.0), the written hook "A secret apartment at the top." on screen from frame 0, and the camera whipping up the tower from the first frame. Mez Media's look from start to end: Inter type, captions one word at a time just below the centre, white outlines and pills over the photo. The top floor gets a white outline and a "Top floor" pill; Gustave Eiffel's portrait comes out of it ("Gustave Eiffel"); a "Rent it for a night?" pill gets stamped "Not for rent" on "no"; Thomas Edison's photo swings in beside him ("Thomas Edison", "1889"); and on "both" the two portraits fly off for the office as it is today, with the wax figures labelled "Edison" and "Eiffel" and "Today, in wax" on "wax". Then the colour drains under a heartbeat and a clock (0:13), and it switches: the reel shrinks into an iPhone on black, its clock counts to 0:15 ("You've just watched this reel for 15 seconds", the real time when it is spoken), the post turns into an ad (yourbrand · Sponsored · Book now), and the pitch is on screen as big type: "We scale businesses with ads like this. DM us the word teardown for a free ad review." No end card: the last frame cuts back into the hook, so it loops.
Facts and sources: Eiffel's private apartment at the top of the tower, kept for his experiments and his guests (toureiffel.paris); rich Parisians offered large sums to rent it for a night and he always refused (Jill Jonnes, *Eiffel's Tower*, quoted by Mental Floss; Domus; HowStuffWorks); Thomas Edison's visit on 10 September 1889, when he gave Eiffel a phonograph (toureiffel.paris); today a reconstruction of the office with wax figures of Eiffel, his daughter Claire and Edison, seen through its windows and too small to go into (toureiffel.paris).
Photos: the tower is Pexels 3922718 (Pexels licence; the sky graded from teal to azure), in `source/photos/eiffel_tower.jpg`; Gustave Eiffel by Eugène Pirou (Galerie Contemporaine) and Thomas Edison with his phonograph (Brady-Handy collection, about 1878) are Library of Congress prints, public domain by age, cropped in `source/photos/eiffel_portrait.jpg` and `source/photos/eiffel_edison.jpg`; the office today is "Gustave Eiffel and Thomas Edison" by greger.ravik on Flickr (CC BY 2.0: keep the credit in the caption), in `source/photos/eiffel_office.jpg`. The night lighting of the tower is copyrighted for commercial use, so this reel stays in daylight.
Rebuild: `python3 source/reel_eiffel_vo.py <kokoro-dir> <tmp>` → `node source/reel_eiffel.js <frames> <video.mp4>` → `python3 source/reel_eiffel_audio.py <tmp>/vo.wav <mix.wav> <sfx-cache>`, loudnorm to -14 LUFS, then mux. Scenes: `source/reel_eiffel_scene.js`; shared phone engine: `source/reel_phone_kit.js`.

**Script**
> Nobody tells you the Eiffel Tower has a secret apartment at the top.
> Gustave Eiffel built it for himself.
> Rich Parisians offered fortunes to rent it for one night.
> He said no to all of them.
> His most famous guest? Thomas Edison.
> And they're both still up there. In. Wax.
> (tension)
> You've just watched this reel for 15 seconds.
> Imagine your ad held people that long.
> We scale businesses with ads like this.
> DM us the word teardown for a free ad review.

**Caption**
> DM us the word TEARDOWN and we'll review your ads for free.
>
> You came for the secret apartment at the top of the Eiffel Tower and stayed 15 seconds. Nobody asked you to. Curiosity did the work.
>
> That's the first job of any ad: give people a reason to keep watching before you ask for anything. If your Meta ads open with the logo, the price or "limited offer", people scroll before they hear why they should care.
>
> We scale businesses with Instagram ads built the other way round: a hook people want to finish, then the offer.
>
> The facts are real, by the way. Eiffel kept a private apartment at the top of his tower for his experiments and his guests, and turned down the rich Parisians who offered fortunes to rent it for a night. Thomas Edison visited on 10 September 1889 and gave him a phonograph. From the top floor today you can look into the restored office: Eiffel, his daughter Claire and Edison, in wax.
>
> (Office photo: "Gustave Eiffel and Thomas Edison" by greger.ravik, CC BY 2.0, cropped. Archive photos: Library of Congress. Tower: Pexels.)
>
> #metaads #instagramads #eiffeltower

## Reel: "Nobody tells you Mount Rushmore has a secret room behind Lincoln's head" (switch reel)
File: `reels/mezmedia_reel_rushmore.mp4` (1080×1920, 30fps, 26.0s, Kokoro voiceover read like a fast facts short + music + SFX, -14 LUFS, voice 17.5 dB over the bed). The Eiffel reel's format and voice (it cut the skip rate from 87% to 50%), with a second open loop straight after the hook ("And something is sealed inside it."), because the Eiffel reel's viewers left at about 6 seconds on average, once the first question was answered. Hook score 93.8. The camera whips along the faces from Washington to Lincoln on the first frame under the written hook "A secret room behind Lincoln's head."; his head gets a white outline and the room is marked "Behind here". The hall's location comes out of the rock (National Park Service photo, the doorway outlined, "Hall of Records", "Sealed"); Gutzon Borglum and the workers in the tunnel ("1938", "For the Constitution") get stamped "Never finished"; the entrance today comes in ("1998", the capstone outlined as the "Titanium vault"), sixteen panels light up in the doorway one by one ("16 panels", "America's story"), and "Not open to visitors" lands as the panels glow on "thousands". Then the colour drains under a heartbeat and a clock, and it switches: the reel shrinks into an iPhone on black, its clock counts to 0:18 ("You've just watched this reel for 18 seconds", the real time when it is spoken), the post turns into an ad (yourbrand · Sponsored · Book now), and the pitch as big type: "We scale businesses with ads like this. DM us the word teardown for a free ad review." No end card: it loops back into the hook.
Facts (National Park Service, "Hall of Records", nps.gov/moru): the hall was to be cut into the canyon behind the faces, its stairway meeting "the canyon mouth behind Lincoln's head"; a 70-foot tunnel was blasted between July 1938 and July 1939 for documents "such as the Constitution and the Declaration of Independence"; work halted in 1939 when Congress directed that only the faces be carved; on 9 August 1998 sixteen porcelain enamel panels (in a teakwood box, inside a titanium vault, under a granite capstone) were placed in the floor of the hall's entry, telling how and why the memorial was carved and a short history of the United States; the repository is not open to visitors and is "left as a record for people thousands of years from now".
Photos: Mount Rushmore is Pexels 136154 (Pexels licence), `source/photos/rushmore.jpg`; the hall's location, the workers in the tunnel (1938-39, photographed for the project by Charles d'Emery) and the entrance with the capstone are National Park Service photos from the Hall of Records page, `source/photos/rushmore_location.jpg`, `rushmore_workers.jpg` and `rushmore_entrance.jpg`; Gutzon Borglum (1923) is a Library of Congress print with no known restrictions on publication, `source/photos/rushmore_borglum.jpg`.
Rebuild: `python3 source/reel_rushmore_vo.py <kokoro-dir> <tmp>` → `node source/reel_rushmore.js <frames> <video.mp4>` → `python3 source/reel_rushmore_audio.py <tmp>/vo.wav <mix.wav> <sfx-cache>`, loudnorm to -14 LUFS, then mux. Scenes: `source/reel_rushmore_scene.js`; shared phone engine: `source/reel_phone_kit.js`.

**Script**
> Nobody tells you Mount Rushmore has a secret room behind Lincoln's head.
> And something is sealed inside it.
> The sculptor blasted it out in 1938, but never finished.
> In 1998, they sealed a titanium vault in its floor.
> Sixteen panels inside tell America's story.
> Left for people. Thousands of years from now.
> (tension)
> You've just watched this reel for 18 seconds.
> Imagine your ad held people that long.
> We scale businesses with ads like this.
> DM us the word teardown for a free ad review.

**Caption**
> DM us the word TEARDOWN and we'll review your ads for free.
>
> You came for Mount Rushmore's secret room and stayed 18 seconds. Nobody asked you to. Curiosity did the work.
>
> That's the first job of any ad: give people a reason to keep watching before you ask for anything. If your Meta ads open with the logo, the price or "limited offer", people scroll before they hear why they should care.
>
> We scale businesses with Instagram ads built the other way round: a hook people want to finish, then the offer.
>
> The facts are real, by the way. Gutzon Borglum started blasting a Hall of Records into the canyon behind the faces in 1938, meant for documents like the Constitution and the Declaration of Independence. Congress stopped the work in 1939. In 1998, sixteen porcelain panels went into a titanium vault in its floor, under a granite capstone. It's not open to visitors: it was left for people thousands of years from now. (Source: National Park Service.)
>
> (Photos: Mount Rushmore, Pexels. Hall of Records, National Park Service. Gutzon Borglum, Library of Congress.)
>
> #metaads #instagramads #mountrushmore

## Reel: "Your iPhone can see your face in total darkness" (3D explainer, new style)
File: `reels/mezmedia_reel_faceid.mp4` (1080×1920, 30fps, 47.3s, Kokoro voiceover + music + SFX, -14 LUFS). The trial of the 17M-view explainer style (the touchscreen reel): a paradox hook, a second loop straight after it, then the mechanism one picture per line on one continuous 3D camera, captions at the top that build word by word (the word being said in white, the key word in a blue selection box with round handles), labels on leader lines, honest small print. If it does worse than the switch reels, we go back to the old style.
The hook moves the voice up and down on purpose (am_fenrir, each line re-intoned with Praat): "Your iPhone can see your face," (the dots sweep a clay head, the lock opens) "in total darkness." (lower and weighty: the lights cut, only red infrared dots) "But show it a perfect photo of you..." (hushed and higher: a printed photo rises in front of the face) "Nothing." (low and flat, the music stops dead, a red "Locked" shakes) "Hold it to your face while you're asleep?" (rising question: moonlight, the eyes close) "Still locked." (low and flat, silence again). Then the camera whips to the top of the phone: the dot projector (traced: 34,000 rays fired at the scan, every dot lands where it would), "30,000+ dots, every time you look", the infrared camera's view, the nose's dots "closer" and the cheeks' "farther", the face disappears and leaves the 3D map coloured by depth, the photo beside it is one flat colour ("photo: flat", "Locked"), lights out and the flood illuminator's infrared picture, the map pulled into the Secure Enclave and turned into numbers that match "your saved face" ("Unlocked", "Match"), a grid of faces zooming out to a million (1,000 × 1,000 pixels, you in the blue box), the eye close-up ("eyes open", then it closes: "Locked"). Then the tension (colour drains, heartbeat, clock) and the switch as in the Rushmore reel: "You've just watched this reel for 39 seconds" (the real time when it is spoken), the post turns into an ad (yourbrand · Sponsored · Shop now), and the pitch.
Facts (Apple: support.apple.com/en-us/102381 "About Face ID advanced technology", and Apple Platform Security): the TrueDepth camera projects and analyses more than 30,000 invisible dots to make a depth map of the face, and also captures an infrared image; the flood illuminator lets it work in total darkness; it needs depth, which isn't found in print or 2D digital photographs; a part of the neural engine protected inside the Secure Enclave turns the depth map and infrared image into a mathematical representation and compares it with the enrolled face; the chance a random person can unlock it is less than 1 in 1,000,000 (higher for twins, siblings and children under 13); it's attention-aware, checking that your eyes are open and looking at the device, which makes it harder to unlock without your knowledge, such as when you are sleeping. The numbers on screen are an illustration (small print says so).
3D head: Lee Perry-Smith head scan by Infinite Realities, CC BY 3.0 (`source/models/LeePerrySmith.glb`, from the three.js examples). The scan's eyes are shut; the scene opens them by cutting an eyelid-shaped almond out of each lid in the shader, over a copy of the lid surface carved with an iris.
Rebuild: `python3 source/reel_faceid_vo.py <kokoro-dir> <tmp>` → `node source/reel_faceid.js <frames> <video.mp4>` (software WebGL; `REEL_RANGE=a:b` renders part of the frames so several renderers can run at once) → `python3 source/reel_faceid_audio.py <tmp>/vo.wav <mix.wav> <sfx-cache>`, loudnorm to -14 LUFS, then mux. Scenes: `source/reel_faceid_scene.js` (three.js); the switch runs on `source/reel_phone_kit.js`.

**Script**
> Your iPhone can see your face, in total darkness.
> But show it a perfect photo of you... Nothing.
> Hold it to your face while you're asleep? Still locked.
> So how does it know it's really you?
> Above your screen, a projector fires over thirty thousand invisible dots at your face.
> A camera sees the dots on your nose land closer than the ones on your cheeks.
> That's a 3D map of your face. A photo is flat. No depth. No unlock.
> In the dark, it lights you up with infrared you can't see.
> A locked part of the chip turns that map into numbers, and compares them with your saved face.
> The odds a stranger gets in? Less than one in a million.
> And asleep? It checks that your eyes are open. Eyes closed? Locked.
> (tension)
> You've just watched this reel for 39 seconds.
> Imagine your ad held people that long.
> We scale businesses with ads like this.
> DM us the word teardown for a free ad review.

**Caption**
> DM us the word TEARDOWN and we'll review your ads for free.
>
> You just spent 39 seconds learning why a photo of you can't open your phone. Nobody asked you to. The question did the work.
>
> That's the first job of any ad: give people a reason to keep watching before you ask for anything. If your Meta ads open with the logo, the price or "limited offer", people scroll before they hear why they should care.
>
> We scale businesses with Instagram ads built the other way round: a question people want answered, then the offer.
>
> The facts are Apple's. Face ID fires more than 30,000 invisible infrared dots and reads them as a depth map of your face, so it works in the dark and a flat photo has nothing to give it. Inside the chip, the Secure Enclave turns that map into numbers and compares them with your saved face. The chance a random person gets in is less than 1 in 1,000,000 (higher for twins, siblings and kids under 13). And with its default attention setting, it checks that your eyes are open, so it stays locked while you sleep. (Source: Apple Support, Apple Platform Security.)
>
> (3D head: Lee Perry-Smith scan by Infinite Realities, CC BY 3.0.)
>
> #metaads #instagramads #faceid

## Reel: "This is the reality of Brez Scales" (switch reel, mixed style)
File: `reels/mezmedia_reel_brez.mp4` (1080×1920, 30fps, 49.2s, Kokoro voiceover + music + SFX, -14 LUFS). Two looks mixed, as asked: the addxstudio explainer Mueez sent (kinetic type that builds word by word with the key words in red, a paper invoice card whose number rolls before it lands, coral-to-purple gradients, a vertical ticker of figures, inline icons, a gradient figure beside a cutout, a calm deep male narrator at ~200 words a minute) and the Rushmore/Eiffel switch reels (a photo under the written hook on the first frame, photo cards with white pills and stamps, a beat of tension, the switch into a phone, the pitch). The hook "This is the reality of Brez Scales." is on screen from frame 0; the open loop is "But the money isn't coming from where you think."
He is a real person, so the reel only says what can be sourced and says where each part comes from in small print: what he says he makes ($400K a month before 21, "His own figure. Not independently verified."), his start (college in late 2022, digital marketing, dropped out; a cracked phone, Canva and TikTok; ads for clothing brands for a cut of their profits), the cars as the site that sells his mentorship wrote about them (a crashed Lambo, a towed G-Wagon, a BMW banged up three hours after he bought it, "notorious for wrecking rentals", "If a rented Lambo gets you a client... that's ROI, not a flex"), and where reviewers say the money comes from (mostly selling courses, a $47 bootcamp to an invitation-only mentorship of about $4,800). It does not call him a fraud or say anything about his finances that the sources don't. No photos of him; Canva and TikTok are named, not shown as logos.
Sources: Whop blog, "From dropping out to making $400K/month at 20 years old" (2025, Whop is where he sells his mentorship); drews-review.com/brez-scales (2026); potionads.com Brezscales course review ("independent verification of revenue figures is unavailable"). Details in `source/reel_brez_vo.py`.
Photos (Pexels licence): Lamborghini Aventador at night and on the road, Adrian Newell (Pexels 9814982, 9814983) `source/photos/brez_lambo.jpg`, `brez_lambo_road.jpg`; red G-Wagon, Ishan Kulshrestha (8622790) `brez_gwagon.jpg`, the dealer's plate under the stamp; BMW M4, Jae Park (3849556) `brez_bmw.jpg`; empty lecture hall (356065) `brez_lecture.jpg`.
Rebuild: `python3 source/reel_brez_vo.py <kokoro-dir> <tmp>` → `node source/reel_brez.js <frames> <video.mp4>` → `python3 source/reel_brez_audio.py <tmp>/vo.wav <mix.wav> <sfx-cache>`, loudnorm to -14 LUFS, then mux. Scenes: `source/reel_brez_scene.js`; the switch runs on `source/reel_phone_kit.js`.

**Script**
> This is the reality of Brez Scales.
> He says he hit four hundred thousand dollars a month, before he turned twenty-one.
> But the money isn't coming from where you think.
> Late 2022. He's a college student, studying digital marketing. He drops out.
> With a cracked phone, Canva and TikTok, he runs ads for clothing brands, for a cut of their profits.
> Then came the lifestyle. A crashed Lambo. A towed G-Wagon. A BMW banged up three hours after he bought it.
> Even the site that sells his mentorship calls the cars marketing. Some of them, rentals.
> So where does the money come from? Reviewers say: mostly, selling courses.
> A forty-seven dollar bootcamp. A mentorship around forty-eight hundred.
> And the lifestyle is what sells them.
> (tension)
> You've just watched this reel for 40 seconds.
> Imagine your ad held people that long.
> We scale businesses with ads like this.
> DM us the word teardown for a free ad review.

**Caption**
> DM us the word TEARDOWN and we'll review your ads for free.
>
> You just watched 40 seconds about someone else's money. Nobody asked you to. The story did the work.
>
> That's the first job of any ad: give people a reason to keep watching before you ask for anything. If your Meta ads open with the logo, the price or "limited offer", people scroll before they hear why they should care.
>
> We scale businesses with Instagram ads built the other way round: a story people want to finish, then the offer.
>
> On the facts: the $400K a month is his own figure and hasn't been independently verified. The college, the cracked phone and the cars come from Whop's own write-up of him (Whop is the platform that sells his mentorship), which also calls the cars marketing and some of them rentals. The course prices and "mostly selling courses" come from independent reviews of his programs, which are mixed: some students say it helped them.
>
> (Photos: Pexels.)
>
> #metaads #instagramads #brezscales

## Reel: "You type a question to AI. It never reads a single word of it." (3D explainer, Face ID style)
File: `reels/mezmedia_reel_ai.mp4` (1080×1920, 30fps, 42.1s, Kokoro voiceover + music + SFX, -14 LUFS). Back to the Face ID reel's format after the Brez reel (84 views; Face ID got 1,400): a paradox hook with the voice moving up and down, the mechanism one picture per line on one continuous 3D camera, top captions that build word by word with the key word in a blue selection box, labels on leader lines, small print with sources, then the tension and the switch. The read is faster than Face ID's, which felt slow: same voice (am_fenrir), lines at 1.2 to 1.3x speed with 0.05 to 0.15 s between them, so the reel runs 42 s instead of 47.
The hook: "You type a question to AI." (bright, lifting at the end; the question types itself on a phone) "It never reads a single word of it." (dropped and weighty: the words lift off the screen and break into digits) "Not one." (low and flat, the music stops dead, a red "words read: 0") "So how does it answer you in seconds?" (a question that climbs; the message is sent). Then one camera follows it: a pulse of light leaves the phone along a fiber-optic cable across a dark map ("fiber-optic cable", "pulses of light"), the camera pulls up and back to show the whole data center, then dives through its door. Inside, "Why is the sky blue?" is chopped into its 6 real tokens ("about 4 letters each"), which flip to their real IDs (10445 374 279 13180 6437 30, "token ID"); each grows its list of numbers ("GPT-3: 12,288 numbers each"); ten layer plates stack up and every token's attention arcs reach back to the ones before it ("attention: looking back"); a counter runs to 350,000,000,000 operations for one token over the GPUs; a panel scores the next token and picks "Air"; the loop runs token by token ("tokens written") and the real answer types itself out on the phone, then both bubbles turn into their token IDs: "It never read your words. It did math on them." Then the tension (colour drains, heartbeat, clock) and the switch: "You've just watched this reel for 34 seconds" (the real time when it is spoken), the post turns into an ad (yourbrand · Sponsored · Shop now), and the pitch.
Facts: tokens are about 4 characters of English each (OpenAI Help Center, "What are tokens and how to count them?"). The tokens and IDs on screen are real, from GPT-4's tokenizer (tiktoken `cl100k_base`, 100,277 entries): "Why is the sky blue?" is 10445 374 279 13180 6437 30, and "Air scatters blue light more than red." is Air| sc|atters| blue| light| more| than| red|. (26777 1156 10385 6437 3177 810 1109 2579 13). GPT-3 turns each token into 12,288 numbers and runs 96 layers with 175 billion parameters (Brown et al. 2020, "Language Models are Few-Shot Learners", Table 2.1); attention lets each token look at the tokens before it (Vaswani et al. 2017, "Attention Is All You Need"); one token costs about 2 operations per parameter (Kaplan et al. 2020, "Scaling Laws for Neural Language Models"), about 350 billion for GPT-3. The model scores every token in its vocabulary and picks one, adds it and runs again; chat apps stream the tokens as they come, which is why answers type themselves out. Air scatters blue light more than red (Rayleigh scattering). Most long-distance internet traffic travels through fiber-optic cable; the small print says the first hop is Wi-Fi or mobile data. The scores on the panel and the numbers in each list are an illustration (small print says so).
Rebuild: `python3 source/reel_ai_vo.py <kokoro-dir> <tmp>` → `node source/reel_ai.js <frames> <video.mp4>` (software WebGL; `REEL_RANGE=a:b` renders part of the frames so several renderers can run at once) → `python3 source/reel_ai_audio.py <tmp>/vo.wav <mix.wav> <sfx-cache>`, loudnorm to -14 LUFS, then mux. Scenes: `source/reel_ai_scene.js` (three.js); the switch runs on `source/reel_phone_kit.js`.

**Script**
> You type a question to AI.
> It never reads a single word of it. Not one.
> So how does it answer you in seconds?
> Your message is fired through fiber-optic cables, as pulses of light, to a data center.
> There, it's chopped into tokens: chunks of about four letters.
> Each token becomes a number. Which points to a list of thousands of numbers.
> Now the model runs. Dozens of layers, where every token looks back at the ones before it.
> Hundreds of billions of calculations, for every token.
> Next, it scores every token it knows, and picks one.
> Then it runs again. And again. One token at a time.
> That's why answers type themselves out.
> It never read your words. It did math on them.
> (tension)
> You've just watched this reel for 34 seconds.
> Imagine your ad held people that long.
> We scale businesses with ads like this.
> DM us the word teardown for a free ad review.

**Caption**
> DM us the word TEARDOWN and we'll review your ads for free.
>
> You just spent 34 seconds learning what happens after you hit send. Nobody asked you to. The question did the work.
>
> That's the first job of any ad: give people a reason to keep watching before you ask for anything. If your Meta ads open with the logo, the price or "limited offer", people scroll before they hear why they should care.
>
> We scale businesses with Instagram ads built the other way round: a question people want answered, then the offer.
>
> How it works, in short: your message is split into tokens (about 4 characters of English each, per OpenAI). Each token is a number: "Why is the sky blue?" is 6 of them in GPT-4's tokenizer. The model turns each one into a long list of numbers (12,288 in GPT-3), runs them through dozens of layers (96 in GPT-3), scores every token it knows and picks the next one, then does it all again for the token after that. For a GPT-3-sized model that's about 350 billion calculations per token. (Sources: OpenAI Help Center; Brown et al. 2020; Kaplan et al. 2020; Vaswani et al. 2017.)
>
> #metaads #instagramads #ai

## Reel: "Why would anyone push a hot dog into a saw blade?" (3D explainer, a Zack D. Films topic with our angle)
File: `reels/mezmedia_reel_saw.mp4` (1080×1920, 30fps, 42.6s, Kokoro voiceover + music + SFX, -14 LUFS). Asked for: analyse Zack D. Films' most watched videos, take one of their topics, make it different. Their channel (yt-dlp listing of all 4,101 shorts, October 2026): 23 shorts over 100M views, 259 over 50M, median 14M; the top 25 run 24 to 46 seconds (median 30) with a median like rate of 3.1%; titles are about 5 words, often a question, one emoji; body topics are 29% of their top 100 against 16% of all their shorts, and question titles 24% against 11%. Top five: How Stitches Work (255M), How Splinters Get Unstuck (216M), The Reason The McFlurry Spoon Looks Weird (166M), How Long Are Your Blood Vessels? (157M), Could Ancient Armor Stop Bullets? (156M). We took "Saws That Stop For Fingers" (120M): a mechanism with built-in tension, like our Face ID reel, which is our best. The difference: it opens on the hot dog test instead of a finger, shows the stop in slow motion with a millisecond clock, adds what the stop costs the saw (single-use brake, ruined blade) and ends on the inventor being told "safety doesn't sell" and starting his own company; then our switch.
Format as the Face ID and AI reels: a hook that moves the voice up and down ("Why would anyone push a hot dog into a saw blade?" rising, "Because it's about as salty and wet as a finger." low and flat with the music cut, "And this saw stops before it can take one." bright), one continuous 3D camera: the board mid-cut with sawdust and the hot dog riding at the teeth, a card comparing a hot dog and a finger, the whole saw, X-ray (the table and cabinet see-through, edges drawn in blue) with a ring of light for the blade's signal and a scope that stays steady through wood and drops red at the touch, time slowing to a crawl, the brake cartridge's spring firing the aluminum pawl into the teeth, the clock to "stopped in under 5 ms", the blade dropping under the table, bars for a blink, the hot dog's nick (and a bandage), the brake and blade lifted out jammed together ("single-use", "blade: usually ruined"), a flight down a road to three generic tool factories that get red X marks, the quote, and his own factory rising with saws rolling out. Then the tension and the switch: "You've just watched this reel for 34 seconds" (the real time when it is spoken), the post turns into an ad, and the pitch.
Facts and sources (details in `source/reel_saw_vo.py`): NPR, "Sharp Edge: One Man's Quest To Improve Saw Safety" (2010, story and transcript): a hot dog has about the same salt and moisture content as a finger; the saw induces a slight current on the blade, wood doesn't conduct but a finger does; the brake stops the blade in less than 5/1,000th of a second; Steve Gass is a woodworker, physicist and patent attorney; tool companies told him "safety doesn't sell". Woodcraft and ToolsToday on how SawStop's system works: skin changes the blade's signal, a spring-loaded aluminum brake stops the blade in under 5 ms and the blade assembly drops below the table; the brake cartridge must be replaced after activation and the blade usually too. Woodworker's Journal on the hot dog demo's nick. A blink lasts roughly 100 to 150 ms. The clock and its in-between numbers are an illustration (small print says so); the saw, the brake cartridge and the buildings are generic, no brand shown.
Rebuild: `python3 source/reel_saw_vo.py <kokoro-dir> <tmp>` → `node source/reel_saw.js <frames> <video.mp4>` (software WebGL; `REEL_RANGE=a:b` renders part of the frames) → `python3 source/reel_saw_audio.py <tmp>/vo.wav <mix.wav> <sfx-cache>`, loudnorm to -14 LUFS, then mux. Scenes: `source/reel_saw_scene.js` (three.js); the switch runs on `source/reel_phone_kit.js`.

**Script**
> Why would anyone push a hot dog into a saw blade?
> Because it's about as salty and wet as a finger.
> And this saw stops before it can take one.
> The blade carries a tiny electrical signal.
> Cutting wood barely changes it. But skin conducts electricity, so the instant it touches a tooth, the signal changes.
> A spring fires an aluminum brake into the teeth.
> The blade stops dead in under five milliseconds, and drops under the table.
> Faster than a blink.
> The hot dog gets a nick.
> But it costs the saw. The brake is single-use, and the blade's usually ruined.
> Its inventor offered it to the big tool companies.
> He says they told him: safety doesn't sell.
> So he started his own saw company.
> (tension)
> You've just watched this reel for 34 seconds.
> Imagine your ad held people that long.
> We scale businesses with ads like this.
> DM us the word teardown for a free ad review.

**Caption**
> DM us the word TEARDOWN and we'll review your ads for free.
>
> You just spent 34 seconds watching a hot dog and a table saw. Nobody asked you to. The question did the work.
>
> That's the first job of any ad: give people a reason to keep watching before you ask for anything. If your Meta ads open with the logo, the price or "limited offer", people scroll before they hear why they should care.
>
> We scale businesses with Instagram ads built the other way round: a question people want answered, then the offer.
>
> How the saw works. The blade carries a small electrical signal. Wood barely changes it. Skin does, because you conduct electricity, so the moment a finger (or a hot dog, which has about the same salt and moisture) touches a tooth, a spring fires an aluminum brake into the blade. It stops in under 5 milliseconds and drops below the table. The cost: the brake's single-use and the blade's usually ruined. Its inventor, Steve Gass, told NPR the big tool companies said "safety doesn't sell". So he started his own saw company. In the US, table saws cause about 4,000 amputations a year (CPSC figures, via the National Consumers League). Sources: NPR, Woodcraft, ToolsToday.
>
> #metaads #instagramads #woodworking

## Reel: "Why would anyone shoot a brand new suit of armor?" (3D explainer, a Zack D. Films topic with our angle)
File: `reels/mezmedia_reel_armor.mp4` (1080×1920, 30fps, 28.3s, Kokoro voiceover + music + SFX, -14 LUFS). Asked for: another topic from Zack D. Films' most watched shorts (the saw reel got 141 views), our old female voice with real highs and lows in the first seconds, a strong start, the camera angle changing every moment, faster than the saw reel. Topic: "Could Ancient Armor Stop Bullets?" (156M views, their fifth most watched). Our angle: the proof mark as the first ad. Armorers shot their own breastplates and left the dent in as a guarantee; a spotless one proved nothing; customers still scroll past promises and stop for proof.
Fast: 28 seconds against the saw reel's 42.6, about 220 words a minute, and 20 camera set-ups in the first 19.5 seconds (a hard cut on almost every line, each shot moving): the musket aimed at the suit from behind the stock, the muzzle flash, a chase camera behind the ball in slow motion, the hit and the dent, "SOLD" stamped, a bullet-time orbit round a ball that punches through a plain plate (seen from the exit side), the suit flying apart and slamming back together with a card on plate thickness, a low hero shot with the weight counting to 39 kg, a sight locking on the chest, over the shoulder for the proof shot, a second chase camera, the dent forming, "PASSED" stamped, a light crossing the dent, the label "proof mark", and a spotless second suit that goes dark on "It proved nothing". Then the switch: the reel shrinks into a phone, swipes past three ads that only promise, and stops on an ad that shows the dent (a double-tap heart); then the pitch.
The voice: af_heart with 30% af_sarah (the Eiffel and Rushmore voice), now read through `source/vo_expr.py`, which changes the melody inside the voice model instead of shifting pitch afterwards. Kokoro predicts a pitch curve and hands it to its decoder; a copy of the model (built by `vo_expr.build_model`) takes that curve as an input, along with a length for every phoneme, so each word gets its own accent: questions climb ("…suit of armor?"), punchlines drop ("It proved nothing."), key words go up and stretch ("To SELL it!", "On PURPOSE!"), and pauses sit where a person would breathe ("If the ball only dented it… it passed!"). Measured with Praat: the pitch moves over 15.8 semitones (5th to 95th percentile) against 11.2 for the Rushmore read, with the same speech quality (DNSMOS SIG 3.67 against 3.71); Whisper hears every line as written, and in the final mix every word over the gunshots.
Facts and sources (details in `source/reel_armor_vo.py`): The Met (Cuirassier's Armor, 22258; Shot-Proof Cuirass, 31058): armorers fired a pistol or musket at a finished piece and left the dent as a guarantee of the steel; Royal Collection Trust (RCIN 67303-a): a London breastplate "bearing at the right of its chest the proof-mark of a musket-shot"; Worcester Art Museum: breastplates and helmets were often musket-proof, limbs only pistol-proof; a collector's note on Prince Maurits' cavalry armor: the dent "was not to be removed"; The Met (24985): a cuirassier armor of about 1610–30 weighs 39.24 kg. The suit, the musket and the plate are generic illustrations (small print says so); the feed's ads are placeholders (brand_a, brand_b, brand_c, yourbrand).
Rebuild: `python3 source/reel_armor_vo.py <kokoro-dir> <tmp>` → `node source/reel_armor.js <frames> <video.mp4>` (software WebGL; `REEL_RANGE=a:b` renders part of the frames) → `python3 source/reel_armor_audio.py <tmp>/vo.wav <mix.wav> <sfx-cache>`, loudnorm to -14 LUFS, then mux. Scenes: `source/reel_armor_scene.js` (three.js); the switch runs on `source/reel_phone_kit.js`.

**Script**
> Why would anyone shoot a brand new suit of armor?
> To sell it!
> Back then, musket balls could punch right through steel.
> So armor got thicker, and heavier.
> Some suits hit 39 kilos!
> But would it really stop a ball?
> So the armorer would take a shot at it.
> If the ball only dented it… it passed!
> And that dent stayed in. On purpose!
> A proof mark.
> A spotless suit? It proved nothing.
> Your customers are the same.
> They scroll past promises.
> They stop for proof.
> We scale businesses with ads like this.
> DM us the word teardown for a free ad review.

**Caption**
> DM us the word TEARDOWN and we'll review your ads for free.
>
> Armorers used to shoot their own breastplates before they sold them. If the ball only dented the steel, the armor passed. The dent stayed in on purpose, as a guarantee. It's called a proof mark.
>
> A spotless breastplate looked nicer. It proved nothing.
>
> Your ads work the same way. Nobody stops for "best quality, guaranteed". We all stop for proof we can see: the product taking the hit, the test, the before and after.
>
> That's how we scale businesses with Meta ads and Instagram ads. Proof first.
>
> The history: armorers proved breastplates with a pistol or musket shot and left the dent as a guarantee (The Met). A London breastplate in the Royal Collection still bears "the proof-mark of a musket-shot". As guns got stronger, armor got thicker. One cuirassier armor in The Met, made around 1610 to 1630, weighs 39.24 kg.
>
> #metaads #instagramads #ugcads
