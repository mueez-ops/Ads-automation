"""Voiceover + per-word timing for the reel "Half of you won't notice a stranger swapped mid-chat. Not even the voice."
(the 1998 door study: a man asking for directions is swapped for another man while a door is carried between him and
the person helping him, and about half never notice; our angle: viewers miss small changes too, so stop testing
tweaks and swap the first three seconds). Built the way the Mosquito (2,400 views), tickle and blink reels were: a
claim aimed at the viewer with a number in it (hookscore.py 88.0 STRONG), the script through the ig-human panel (78.0
PASS). Same voice and method: af_heart with 30% af_sarah, fast, the melody written word by word in vo_expr.py.
Writes reel_door_cues.json and <out_dir>/vo.wav (44.1 kHz). Numbers are spoken as words (the phonemizer's word mapping
needs one token per word); reel_door.js shows them as digits on screen.
Facts (Simons & Levin, "Failure to detect changes to people during a real-world interaction", Psychonomic Bulletin &
Review 5(4):644-649, 1998; read from the full text):
- Experiment 1, on the campus of Cornell University: "An experimenter carrying a campus map asked unsuspecting
  pedestrians for directions to a nearby building." 15 pedestrians, aged about 20 to 65.
- "After the experimenter and pedestrian had been talking for 10-15 sec, two other experimenters carrying a door
  rudely passed between them. As the door passed, the first experimenter grabbed the back of the door, and the
  experimenter who had been carrying that part of the door stayed behind and continued to ask for directions." The
  second produced an identical copy of the map. The door blocked the view for about 1 s.
- "The two experimenters wore different clothing and differed in height by approximately 5 cm. Their voices were also
  clearly distinguishable."
- "When asked if they had noticed anything unusual, most pedestrians reported that the people carrying the door were
  rude. Yet ... only 7 of the 15 pedestrians reported noticing the change of experimenters. Those who did not notice
  the change continued the conversation as if nothing had happened." (So 8 of 15 kept giving directions.)
- Asked beforehand, a class of 50 students claimed "without exception" that they would notice. In Experiment 2, with
  the experimenters dressed as construction workers, only 4 of 12 students noticed.
- "Your viewers miss changes too ... swap the first three seconds" is our view of ad testing, not a finding of the
  paper.
Usage: python3 reel_door_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_expr import make_vo

# (key, marked text (see vo_expr.py), caption text (same number of words), gap before, speed, line fx)
LINES = [
    # the hook
    ("half", "^^Half of you won't ^notice a stranger swapped ^^mid-chat.", "half of you won't notice a stranger swapped mid-chat", 0.05, 1.25, {"reg": 1.0, "expand": 1.55}),
    ("voice", "Not even the ^^voice. \\3", "not even the voice", 0.03, 1.2, {"reg": 1.0, "expand": 1.6}),
    # the study
    ("map", "A man with a ^map asked strangers at ^^Cornell for directions.", "a man with a map asked strangers at cornell for directions", 0.08, 1.3, {"reg": 0.5, "expand": 1.55}),
    ("door", "Ten seconds in,| two men carried a ^^door between them,", "ten seconds in two men carried a door between them", 0.05, 1.3, {"reg": 0.5, "expand": 1.55}),
    ("place", "and behind it,| one of the carriers took his ^^place.", "and behind it one of the carriers took his place", 0.02, 1.3, {"reg": 0.0, "expand": 1.55}),
    ("new", "New ^clothes.| New ^^voice.", "new clothes new voice", 0.06, 1.15, {"reg": 0.5, "expand": 1.6}),
    ("eight", "^^Eight of fifteen kept giving directions.", "eight of fifteen kept giving directions", 0.06, 1.25, {"reg": 1.0, "expand": 1.55}),
    ("rude", "Most only noticed the door was ^^rude. \\3", "most only noticed the door was rude", 0.05, 1.22, {"reg": 0.5, "expand": 1.6}),
    # the switch
    ("viewers", "Your ^^viewers miss changes too.", "your viewers miss changes too", 0.09, 1.25, {"reg": 0.5, "expand": 1.55}),
    ("btn", "New button ^colour? /3", "new button colour", 0.03, 1.22, {"reg": 0.5, "expand": 1.55}),
    ("font", "New ^font? /3", "new font", 0.02, 1.2, {"reg": 0.5, "expand": 1.55}),
    ("see", "Most won't ^^see it.", "most won't see it", 0.03, 1.2, {"reg": 0.5, "expand": 1.6}),
    ("swap", "So stop testing ^tweaks,| and ^^swap the first three seconds.", "so stop testing tweaks and swap the first three seconds", 0.06, 1.25, {"reg": 0.5, "expand": 1.55}),
    ("scale", "We scale businesses with ads ^like this.", "we scale businesses with ads like this", 0.1, 1.27, {"reg": 0.0, "expand": 1.45}),
    ("dm", "DM us the word ^teardown for a free ad review.", "DM us the word teardown for a free ad review", 0.06, 1.27, {"reg": 0.0, "expand": 1.45}),
]

# close and punchy (the Rushmore chain): high-pass, de-mud, presence and air, compression, limiter
POLISH = ("highpass=f=90,equalizer=f=250:t=q:w=1:g=-2.5,equalizer=f=3500:t=q:w=1.2:g=3,equalizer=f=9000:t=q:w=1:g=1.5,"
          "acompressor=threshold=-22dB:ratio=4:attack=3:release=60:makeup=4,alimiter=limit=0.9")

if __name__ == "__main__":
    make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_door_cues.json", tail=0.6,
            voice={"af_heart": 0.7, "af_sarah": 0.3}, polish=POLISH)
