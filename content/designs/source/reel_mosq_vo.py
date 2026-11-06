"""Voiceover + per-word timing for the reel "Over 25? You can't hear what this box is playing." (the Mosquito
anti-loitering tone; our angle: the box plays to everyone and the sound itself picks who hears it, which is what a hook
does in a broad Meta audience). The hook was rebuilt after the bee reel's "Why would...?" question was skipped:
hookscore.py rates this one 84 STRONG against 45 for the bee hook; the script passed the ig-human panel at 74.
Same voice and method as the armor, bell, equals, pump, Stanley, McFlurry and bee reels: af_heart with 30% af_sarah,
fast, the melody written word by word in vo_expr.py. Writes reel_mosq_cues.json and <out_dir>/vo.wav (44.1 kHz).
Numbers are spoken as words (the phonemizer's word mapping needs one token per word); reel_mosq.js shows them as
digits on screen.
Facts:
- The Mosquito was made by Howard Stapleton's Compound Security in Merthyr Tydfil, Wales, and went on sale in 2005 to
  stop teenagers loitering outside shops (Compound Security, "About us": founded in 2005 "when we invented The Mosquito
  Teenage Anti-Loitering device"; the Ig Nobel citation names Stapleton "of Merthyr Tydfil, Wales").
- It sends out a high-pitched tone at around 17 kHz that young ears hear and most adults over about 25 cannot (New York
  Times, "A Ring Tone Meant to Fall on Deaf Ears", 12 June 2006; Reuters on the 2006 Ig Nobel Prizes).
- Hair cells near the wide end (base) of the cochlea detect high-pitched sounds (NIDCD, "How Do We Hear?"); in
  age-related hearing loss those basal hair cells wear out first, so the high frequencies go first (StatPearls,
  "Presbycusis"; Wu et al. 2020, J Neurosci, 120 human inner ears).
- Students then put the same tone on their phones as a ringtone so it could ring in class without most teachers
  hearing it (NYT, 2006). Stapleton won the 2006 Ig Nobel Peace Prize for the device "and for later using that same
  technology to make telephone ringtones that are audible to teenagers but probably not to their teachers" (improbable.com).
Usage: python3 reel_mosq_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_expr import make_vo

# (key, marked text (see vo_expr.py), caption text (same number of words), gap before, speed, line fx)
LINES = [
    # the hook: a question that climbs, then the claim, fast
    ("over", "Over ^twenty ^^five? /4", "over twenty five", 0.05, 1.25, {"reg": 1.0, "expand": 1.55}),
    ("hear", "You ^^can't hear what this box is playing.", "you can't hear what this box is playing", 0.03, 1.28, {"reg": 0.5, "expand": 1.55}),
    # the stake
    ("teens", "^^Teenagers can. They ^hate it.", "teenagers can they hate it", 0.05, 1.25, {"reg": 1.5, "expand": 1.55}),
    ("point", "That's the ^^point. \\3", "that's the point", 0.03, 1.15, {"reg": -0.5, "expand": 1.5}),
    # what it is
    ("mosq", "It's the ^^Mosquito,| built in Wales to clear teens from shop doorways.",
     "it's the mosquito built in wales to clear teens from shop doorways", 0.06, 1.32, {"reg": 0.5, "expand": 1.55}),
    ("shriek", "It shrieks at about ^^seventeen thousand hertz.", "it shrieks at about seventeen thousand hertz", 0.05, 1.3, {"reg": 1.0, "expand": 1.6}),
    # why adults can't hear it
    ("age", "Aging ears lose the ^high notes first.", "ageing ears lose the high notes first", 0.06, 1.32, {"reg": 0.0, "expand": 1.5}),
    ("adults", "Most adults hear ^^nothing. \\3", "most adults hear nothing", 0.03, 1.2, {"reg": -0.5, "expand": 1.55}),
    # the twist
    ("flip", "Then teenagers made it a ^^ringtone,", "then teenagers made it a ringtone", 0.1, 1.28, {"reg": 1.5, "expand": 1.6}),
    ("class", "so phones could ring in ^class while most teachers heard ^^nothing.", "so phones could ring in class while most teachers heard nothing",
     0.03, 1.32, {"reg": 0.5, "expand": 1.55}),
    ("same", "Same ^^sound. Two ^^audiences.", "same sound two audiences", 0.1, 1.15, {"reg": 0.5, "expand": 1.55}),
    # the switch
    ("box", "Your ad is ^^that box.", "your ad is that box", 0.12, 1.2, {"reg": 0.0, "expand": 1.55}),
    ("crowd", "Meta plays it to a ^crowd.", "meta plays it to a crowd", 0.04, 1.25, {"reg": 0.0, "expand": 1.5}),
    ("decides", "Your ^^hook decides who ^hears it.", "your hook decides who hears it", 0.04, 1.22, {"reg": 0.5, "expand": 1.55}),
    ("scale", "We scale businesses with ads ^like this.", "we scale businesses with ads like this", 0.12, 1.27, {"reg": 0.0, "expand": 1.45}),
    ("dm", "DM us the word ^teardown for a free ad review.", "DM us the word teardown for a free ad review", 0.06, 1.27, {"reg": 0.0, "expand": 1.45}),
]

# close and punchy (the Rushmore chain): high-pass, de-mud, presence and air, compression, limiter
POLISH = ("highpass=f=90,equalizer=f=250:t=q:w=1:g=-2.5,equalizer=f=3500:t=q:w=1.2:g=3,equalizer=f=9000:t=q:w=1:g=1.5,"
          "acompressor=threshold=-22dB:ratio=4:attack=3:release=60:makeup=4,alimiter=limit=0.9")

if __name__ == "__main__":
    make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_mosq_cues.json", tail=0.6,
            voice={"af_heart": 0.7, "af_sarah": 0.3}, polish=POLISH)
