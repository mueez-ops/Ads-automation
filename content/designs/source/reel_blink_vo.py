"""Voiceover + per-word timing for the reel "Every 3 seconds your eyes shut. You've never seen it. Not once." (your brain
hides every blink from you; people watching the same video blink together at its dull bits and hold their blinks
during the action; our angle: an ad gets watched the same way, so cut the seconds they'd blink through). Built the way
the Mosquito reel (2,400 views) and the tickle reel were: a claim aimed at the viewer with a number in it
(hookscore.py 93.8 STRONG, the best of the three), the script through the ig-human panel (76.6 PASS). Same voice and
method as the armor, bell, equals, pump, Stanley, McFlurry, bee, Mosquito and tickle reels: af_heart with 30% af_sarah,
fast, the melody written word by word in vo_expr.py. Writes reel_blink_cues.json and <out_dir>/vo.wav (44.1 kHz).
Numbers are spoken as words (the phonemizer's word mapping needs one token per word); reel_blink.js shows them as
digits on screen ("Mister Bean" as "Mr. Bean").
Facts:
- People blink about 17 times a minute at rest (150 healthy volunteers; Bentivoglio et al., "Analysis of blink rate
  patterns in normal subjects", Movement Disorders 12:1028-1034, 1997); the 14 people in the study below blinked 24.2
  times a minute at rest and 16.6 while watching. That is a blink every 2.5 to 3.5 seconds: "every 3 seconds".
- "Our visual world is interrupted by eyeblinks every few seconds... However, we rarely notice this profound
  interruption. In addition to physically blocking out visual information, blinking triggers the active suppression
  of information intake as much as 50 ms prior to blink initiation, an effect known as blink suppression"
  (introduction of Nakano et al. 2009, citing Volkmann, Riggs & Moore, "Eyeblinks and visual suppression", Science
  207:900-902, 1980, and later work).
- Nakano, Yamamoto, Kitajo, Takahashi & Kitazawa, "Synchronization of spontaneous eyeblinks while viewing video
  stories", Proceedings of the Royal Society B 276:3635-3644 (2009); University of Tokyo, Juntendo University and
  RIKEN. Blinks were recorded with electrodes above and below the left eye (EOG); 18 adults took part and 14 were
  analysed. They watched silent clips from "Rowan Atkinson in Mr. Bean 1" ("Mr. Bean at the Dentist", "Mr. Bean Gets
  Out of a Parking Garage"). Spontaneous blinks were highly synchronized between and within subjects, but not tied to
  the scene breaks: "Synchronized blinks occurred during scenes that required less attention such as at the
  conclusion of an action, during the absence of the main character, during a long shot and during repeated
  presentations of a similar scene." "In general, blinks were suppressed while an action of the main character was
  unfolding and were released at less animated scenes." Of the 17 biggest peaks, 11 showed no people, only a car
  without movement, a car moving predictably, or an empty street. No synchrony with a background video (tropical fish,
  the Aegean) or a story read aloud.
- "Your ad gets watched the same way" is our reading of the lesson, not a finding of the paper.
Usage: python3 reel_blink_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_expr import make_vo

# (key, marked text (see vo_expr.py), caption text (same number of words), gap before, speed, line fx)
LINES = [
    # the hook: the claim, then the twist
    ("every", "Every ^three seconds your eyes ^^shut.", "every three seconds your eyes shut", 0.05, 1.25, {"reg": 1.0, "expand": 1.55}),
    ("never", "You've ^^never seen it.| Not ^once. \\3", "you've never seen it not once", 0.04, 1.25, {"reg": 1.0, "expand": 1.6}),
    # why
    ("dims", "Your brain ^dims your vision up to ^^fifty milliseconds before every blink,", "your brain dims your vision up to fifty milliseconds before every blink",
     0.08, 1.3, {"reg": 0.5, "expand": 1.55}),
    ("dark", "so you never notice the ^^dark. \\3", "so you never notice the dark", 0.03, 1.25, {"reg": 0.0, "expand": 1.55}),
    # the study
    ("tokyo", "In Tokyo, scientists tracked the blinks of ^^fourteen people| watching Mister ^^Bean.", "in tokyo scientists tracked the blinks of fourteen people watching mister bean",
     0.08, 1.3, {"reg": 1.0, "expand": 1.55}),
    ("lined", "Their blinks ^^lined up| at the dull bits:| an empty ^street,| a parked ^car.", "their blinks lined up at the dull bits an empty street a parked car",
     0.05, 1.3, {"reg": 0.5, "expand": 1.55}),
    ("action", "During the ^^action,| they barely ^blinked.", "during the action they barely blinked", 0.06, 1.2, {"reg": 0.5, "expand": 1.6}),
    # the switch
    ("ad", "Your ^^ad gets watched the same way.", "your ad gets watched the same way", 0.09, 1.25, {"reg": 0.5, "expand": 1.55}),
    ("logo", "Logo spinning ^in?| ^^Blink.| Slow product ^pan?| ^^Blink.", "logo spinning in blink slow product pan blink", 0.04, 1.22, {"reg": 0.5, "expand": 1.6}),
    ("cut", "So ^^cut the seconds they'd blink through.", "so cut the seconds they'd blink through", 0.06, 1.22, {"reg": 0.5, "expand": 1.55}),
    ("scale", "We scale businesses with ads ^like this.", "we scale businesses with ads like this", 0.1, 1.27, {"reg": 0.0, "expand": 1.45}),
    ("dm", "DM us the word ^teardown for a free ad review.", "DM us the word teardown for a free ad review", 0.06, 1.27, {"reg": 0.0, "expand": 1.45}),
]

# close and punchy (the Rushmore chain): high-pass, de-mud, presence and air, compression, limiter
POLISH = ("highpass=f=90,equalizer=f=250:t=q:w=1:g=-2.5,equalizer=f=3500:t=q:w=1.2:g=3,equalizer=f=9000:t=q:w=1:g=1.5,"
          "acompressor=threshold=-22dB:ratio=4:attack=3:release=60:makeup=4,alimiter=limit=0.9")

if __name__ == "__main__":
    make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_blink_cues.json", tail=0.6,
            voice={"af_heart": 0.7, "af_sarah": 0.3}, polish=POLISH)
