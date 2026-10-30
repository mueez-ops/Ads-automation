"""Voiceover + per-word timing for the explainer reel "Why would anyone shoot a brand new suit of armor?" (a Zack D.
Films topic, "Could Ancient Armor Stop Bullets?", 157M views on YouTube; our angle is the proof mark as the first
ad: the dent that sold the armor). The female voice of the earlier reels (af_heart with 30% af_sarah, the Eiffel and
Rushmore voice) read fast, with the melody written word by word in vo_expr.py: accents up and down, longer words,
pauses, questions that rise and lines that drop, so it never sits on one note.
Writes reel_armor_cues.json and <out_dir>/vo.wav (44.1 kHz).
Facts:
- Armorers proved breastplates by firing a pistol or musket at them; the dent, a "proof mark", was left in as a
  guarantee to the buyer that the armor was shot-proof (The Met, Cuirassier's Armor 22258 and Shot-Proof Cuirass
  31058; Royal Collection Trust RCIN 67303-a, a London breastplate "bearing at the right of its chest the proof-mark
  of a musket-shot"; Worcester Art Museum: breastplates and helmets were often musket-proof, limbs only pistol-proof).
  Collectors' note: the dent "was not to be removed. It did indicate unmistakably that the cuirass had shown itself
  to be impenetrable by musket balls at proof" (gotscha.nl, Cavalry armour of Prince Maurits).
- Muskets could defeat ordinary plate, so plates were made thicker and heavier; a cuirassier armor of about
  1610-30 in The Met weighs 39.24 kg (86 lb 8 oz; object 24985), another dated 1621 weighs 36.45 kg (22258).
Usage: python3 reel_armor_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_expr import make_vo

# (key, marked text (see vo_expr.py), caption text (same words), gap before, speed, line fx)
LINES = [
    # the hook: a question that climbs, a bright answer
    ("why", "Why would anyone ^^shoot a brand ^new suit of armor? /6", "why would anyone shoot a brand new suit of armor",
     0.05, 1.2, {"reg": 1.0, "expand": 1.4}),
    ("sell", "To ^^sell+ it!", "to sell it", 0.04, 1.1, {"reg": 2.0, "expand": 1.3}),
    # the problem, then the weight
    ("guns", "Back then, musket balls could ^^punch right through _steel.", "back then musket balls could punch right through steel",
     0.1, 1.3, {"reg": 0.0, "expand": 1.4}),
    ("thicker", "So armor got ^thicker,| and _heavier+.", "so armor got thicker and heavier", 0.06, 1.25, {"reg": -0.5, "expand": 1.4}),
    ("kilos", "Some suits hit ^^thirty-nine kilos!", "some suits hit 39 kilos", 0.05, 1.2, {"reg": 1.5, "expand": 1.4}),
    # the test
    ("really", "But would it ^^really stop a ball? /5", "but would it really stop a ball", 0.1, 1.2, {"reg": 0.5, "expand": 1.4}),
    ("shot", "So the armorer would take a ^^shot at it.", "so the armorer would take a shot at it", 0.06, 1.3, {"reg": 0.0, "expand": 1.3}),
    ("passed", "If the ball _only _dented it...| it ^^passed!", "if the ball only dented it it passed", 0.06, 1.25, {"reg": 0.5, "expand": 1.5}),
    ("stayed", "And that dent stayed in.| On ^^purpose!", "and that dent stayed in on purpose", 0.08, 1.2, {"reg": 1.0, "expand": 1.4}),
    ("mark", "A _proof+ mark.", "a proof mark", 0.06, 1.05, {"reg": -2.0, "expand": 1.2}),
    ("spotless", "A ^spotless suit? /5", "a spotless suit", 0.1, 1.15, {"reg": 1.0, "expand": 1.3}),
    ("nothing", "It proved _nothing. \\3", "it proved nothing", 0.04, 1.1, {"reg": -1.5, "expand": 1.2}),
    # the switch
    ("same", "Your customers are the ^same.", "your customers are the same", 0.25, 1.2, {"reg": 0.0, "expand": 1.3}),
    ("scroll", "They scroll ^past promises.", "they scroll past promises", 0.05, 1.35, {"reg": -0.5, "expand": 1.3}),
    ("stop", "They ^^stop+ for _proof+.", "they stop for proof", 0.05, 1.1, {"reg": 0.5, "expand": 1.4}),
    ("scale", "We scale businesses with ads ^like this.", "we scale businesses with ads like this", 0.15, 1.2, {"reg": 0.0, "expand": 1.3}),
    ("dm", "DM us the word ^teardown for a free ad review.", "DM us the word teardown for a free ad review", 0.08, 1.2, {"reg": 0.0, "expand": 1.3}),
]

# close and punchy (the Rushmore chain): high-pass, de-mud, presence and air, compression, limiter
POLISH = ("highpass=f=90,equalizer=f=250:t=q:w=1:g=-2.5,equalizer=f=3500:t=q:w=1.2:g=3,equalizer=f=9000:t=q:w=1:g=1.5,"
          "acompressor=threshold=-22dB:ratio=4:attack=3:release=60:makeup=4,alimiter=limit=0.9")

if __name__ == "__main__":
    make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_armor_cues.json", tail=0.6,
            voice={"af_heart": 0.7, "af_sarah": 0.3}, polish=POLISH)
