"""Voiceover + per-word timing for the explainer reel "The saw that stops for a hot dog" (the Face ID / AI reels'
format: a hook that moves the voice up and down, the mechanism one picture per line on one continuous 3D camera,
then the switch). The topic is one of Zack D. Films' most watched shorts ("Saws That Stop For Fingers", 120M views
on YouTube); the difference is the angle: it opens on the hot dog test, shows what the stop costs the saw, and ends
on the inventor being told "safety doesn't sell". Same voice and pace as the AI reel (am_fenrir, 1.15-1.3x, short gaps).
Writes reel_saw_cues.json and <out_dir>/vo.wav (44.1 kHz); timing logic and the re-intonation in vo_kit.py. The
number in "You've just watched this reel for N seconds" has to be the real time when it is spoken: after a change to
the lines before it, run once, read the time printed for that word, set N.
Facts:
- A hot dog has about the same salt and moisture content as a human finger; the saw induces a very slight electrical
  current on the blade, monitored by a chip; wood does not conduct electricity but a finger does; the blade stops in
  less than 5/1,000th of a second and slams down into the table (NPR, "Sharp Edge: One Man's Quest To Improve Saw
  Safety", 2010). Steve Gass, the inventor, is "a woodworker, a physicist and a patent attorney"; he tried to get the
  big power tool companies to license it: "They came back and said, well, we've looked at it, but we're not
  interested 'cause safety doesn't sell" (same NPR story and transcript).
- The blade carries a small electrical signal; wood, plastic and most materials cut on a table saw do not
  significantly affect it; skin is conductive and changes it; a spring-loaded aluminum brake slams into the blade and
  the arbor assembly drops below the table, in about five milliseconds, "faster than the blink of an eye"
  (ToolsToday, "How Does a SawStop Work?"; Woodcraft, "SawStop Table Saw Safety System: How It Works": less than
  5 milliseconds; the aluminum deforms as it absorbs the blade's energy; after activation the brake cartridge must be
  replaced and the blade should be replaced too; in most cases a minor scratch). A blink lasts about 100-150 ms.
- The hot dog demo leaves "the nick out of the hot dog ... the kind of wound you could imagine fixing with a simple
  bandaid" (Woodworker's Journal, "SawStop: A Show Stopper"). Gass and two colleagues left their law practices to
  build the company after manufacturers didn't license it (Woodcraft).
Usage: python3 reel_saw_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_kit import make_vo

# (key, spoken text, caption text (same words), gap before, speed[, fx])
LINES = [
    # the hook: a weird question going up, a flat answer, a bright promise
    ("why", "Why would anyone push a hot dog into a saw blade?", "why would anyone push a hot dog into a saw blade", 0.05, 1.22, {"pitch": 1.0, "rise": 4.0}),
    ("salty", "Because it's about as salty and wet as a finger.", "because it's about as salty and wet as a finger", 0.1, 1.12, {"pitch": -3.5, "flat": 0.4, "gain": 1.5}),
    ("stops", "And this saw stops before it can take one.", "and this saw stops before it can take one", 0.12, 1.18, {"pitch": 1.0}),
    # the mechanism, one picture per line
    ("signal", "The blade carries a tiny electrical signal.", "the blade carries a tiny electrical signal", 0.1, 1.25),
    ("wood", "Cutting wood barely changes it. But skin conducts electricity, so the instant it touches a tooth, the signal changes.",
     "cutting wood barely changes it but skin conducts electricity so the instant it touches a tooth the signal changes", 0.08, 1.3),
    ("brake", "A spring fires an aluminum brake into the teeth.", "a spring fires an aluminum brake into the teeth", 0.06, 1.25),
    ("stop", "The blade stops dead in under five milliseconds, and drops under the table.",
     "the blade stops dead in under 5 milliseconds and drops under the table", 0.06, 1.25),
    ("blink", "Faster than a blink.", "faster than a blink", 0.06, 1.15),
    ("nick", "The hot dog gets a nick.", "the hot dog gets a nick", 0.1, 1.15),
    ("cost", "But it costs the saw. The brake is single-use, and the blade's usually ruined.",
     "but it costs the saw the brake is single-use and the blade's usually ruined", 0.12, 1.25),
    # the story
    ("offered", "Its inventor offered it to the big tool companies.", "its inventor offered it to the big tool companies", 0.12, 1.22),
    ("sell", "He says they told him: safety doesn't sell.", "he says they told him safety doesn't sell", 0.08, 1.12, {"pitch": -2.0, "flat": 0.6}),
    ("own", "So he started his own saw company.", "so he started his own saw company", 0.14, 1.15, {"pitch": 0.8}),
    # the switch, after a short beat of tension
    ("watched", "You've just watched this reel for thirty-four seconds.", "you've just watched this reel for 34 seconds", 0.7, 1.15),
    ("imagine", "Imagine your ad held people that long.", "imagine your ad held people that long", 0.1, 1.18),
    ("scale", "We scale businesses with ads like this.", "we scale businesses with ads like this", 0.1, 1.2),
    ("dm", "DM us the word teardown for a free ad review.", "DM us the word teardown for a free ad review", 0.1, 1.2),
]

POLISH = ("highpass=f=75,equalizer=f=220:t=q:w=1:g=-2,equalizer=f=3200:t=q:w=1.2:g=2.5,equalizer=f=9000:t=q:w=1:g=1.5,"
          "acompressor=threshold=-20dB:ratio=2.2:attack=6:release=90:makeup=2.5,alimiter=limit=0.9")
make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_saw_cues.json", tail=0.6,
        voice="am_fenrir", continuous=True, polish=POLISH)
