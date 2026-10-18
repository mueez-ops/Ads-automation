# Swipe file: ads / creative-strategy short-form (18 Oct 2026)

**Sample:** 264 YouTube Shorts, the 40 most recent per account (24 for Barry Hott), from 7 accounts: Ben Heath, Dara Denney, Nick Theriot, Jordan Platten, Jon Loomer, Barry Hott, Sarah Levinger.
Ranked by **outlier multiple** (views ÷ that account's own median). Collected with yt-dlp (public view counts, no login).

**Limits, stated plainly:** these are YouTube Shorts, not Reels (Instagram needs a login and scraping it breaks its terms). Hooks are the video **titles**, not the spoken first line: YouTube blocked caption downloads with a bot check, and we did not work around it. All accounts are far bigger than ours. Treat this as a direction, not proof.

## What over-indexes (read by hand; the classifier named only 55 of 264)

1. **Tier lists / rankings** (Ben Heath: 3.7x, 3.7x, 2.6x). "Campaign structure: tier list", "Offers in Meta ads: tier list". A ranking format gives a reason to watch to the end.
2. **The odd-object trick, backed by research** (Sarah Levinger: 9.1x, 7.0x, 6.5x, 2.6x). "The fortune cookie trick that makes your brand 20% cooler". A strange concrete object plus a number plus "science says".
3. **Hooks about hooks** (Nick Theriot: 5.2x, 3.4x, 2.4x, 2.0x). "The hook has one job", "Steal these 5 ad hooks". Brand owners click on hooks.
4. **The single biggest mistake** (Nick 7.5x, Ben 2.4x and 2.0x). "The biggest Facebook ads mistake", "5 settings killing your results", "The no. 1 reason Meta ads fail".
5. **Blame reframe / contrarian** (Sarah 2.7x, Barry 2.4x, Ben 2.1x). "We love blaming targeting or the algorithm when CAC climbs." This matches our belief: the creative beats the targeting.

**What sits at the bottom:** abstract principles with nothing concrete in them ("make better content = make better ads", "The CPC trap", "focus on scalable incremental growth") and agency-business topics aimed at other agency owners. Our audience is brand owners, so skip those.

**Structure that separates top from bottom:** a concrete object, a number, or a ranking in the first line. Same hook length (about 8 words).

## Our versions (scored with hookscore.py)

| Score | Formula | Hook line |
|---|---|---|
| 76 STRONG | Research trick | "Your product has 5 stars and you're losing sales because of it." (Spiegel Research Center/PowerReviews 2015: purchase likelihood peaks at 4.2–4.5 stars and drops near 5.0. Cite it in the caption.) |
| 69 OK | Tier list | "I ranked 6 ways brands waste their ad money. Number 1 is the boost button." |
| 66 OK | Blame reframe | "Your targeting isn't the problem. Your first second is." |
| 62 OK | Biggest mistake | "If your ad opens on your logo, you lose the viewer before second 2." |
| 56 OK | Hooks about hooks | "Steal these 3 ad hooks for your brand. Number 2 works on anything." |

Raw ranked output: `swipe_raw.md`.
