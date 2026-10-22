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
