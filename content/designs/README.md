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
