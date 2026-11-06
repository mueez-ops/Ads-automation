"""Voiceover + per-word timing for the reel "You can't tickle yourself. Unless it lands 0.2 seconds late." (why your
own touch doesn't tickle, and the robot experiment that made it tickle; our angle: the brain mutes whatever it sees
coming, ads that look like ads included, so the hook has to be the delay). Built the way the Mosquito reel was, after
it reached 2,400 views: a claim aimed at the viewer with a number in it (hookscore.py 84 STRONG, level with the
Mosquito hook), the script through the ig-human panel (74.7 PASS). Same voice and method as the armor, bell, equals,
pump, Stanley, McFlurry, bee and Mosquito reels: af_heart with 30% af_sarah, fast, the melody written word by word in
vo_expr.py. Writes reel_tickle_cues.json and <out_dir>/vo.wav (44.1 kHz).
Numbers are spoken as words (the phonemizer's word mapping needs one token per word); reel_tickle.js shows them as
digits on screen.
Facts:
- A tickle you give yourself feels weaker than the same touch from someone else. The cerebellum predicts the sensory
  consequences of your own movements and the brain uses that prediction to turn the felt response down: in fMRI,
  somatosensory cortex was less active for self-produced touch (Blakemore, Wolpert & Frith, "Central cancellation of
  self-produced tickle sensation", Nature Neuroscience 1:635-640, 1998).
- At University College London (the study was published in 1999; the year is shown on screen), 16 people moved the arm of one robot with their left hand while a second robot moved a
  piece of foam across their right palm. Self-produced strokes were rated less tickly than external ones. When the
  stroke was delayed after the movement, the tickliness rose from 0 to 200 ms, and at 200 ms the sensation was
  indistinguishable from an externally produced one. 14 of the 16 did not notice the delay (Blakemore, Frith &
  Wolpert, "Spatio-temporal prediction modulates the perception of self-produced stimuli", Journal of Cognitive
  Neuroscience 11(5):551-559, 1999).
- "Muted" ads are our view of the lesson (people learn to ignore what looks like an ad), not a finding of these papers.
Usage: python3 reel_tickle_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_expr import make_vo

# (key, marked text (see vo_expr.py), caption text (same number of words), gap before, speed, line fx)
LINES = [
    # the hook: the claim, then the twist, fast
    ("cant", "You ^^can't tickle yourself.", "you can't tickle yourself", 0.05, 1.22, {"reg": 1.0, "expand": 1.55}),
    ("unless", "Unless it lands zero point two seconds ^^late.", "unless it lands zero point two seconds late", 0.04, 1.32, {"reg": 1.5, "expand": 1.6}),
    # why
    ("saw", "Your brain ^^saw it coming.", "your brain saw it coming", 0.08, 1.2, {"reg": 0.5, "expand": 1.55}),
    ("predicts", "It predicts your own touch,| and turns it ^^down. \\3", "it predicts your own touch and turns it down", 0.05, 1.3, {"reg": 0.0, "expand": 1.55}),
    # the robots
    ("robots", "London scientists tested it with ^^two robots.", "london scientists tested it with two robots", 0.08, 1.28, {"reg": 1.0, "expand": 1.55}),
    ("foam", "You move one,| and the other strokes your palm with ^foam.", "you move one and the other strokes your palm with foam", 0.03, 1.32, {"reg": 0.5, "expand": 1.5}),
    ("nodelay", "^No delay:| barely a ^^tickle.", "no delay barely a tickle", 0.07, 1.18, {"reg": 0.0, "expand": 1.55}),
    ("delay", "Delay it zero point ^^two seconds,| and it feels like ^^someone else did it!", "delay it zero point two seconds and it feels like someone else did it",
     0.06, 1.3, {"reg": 1.5, "expand": 1.6}),
    # the switch
    ("mutes", "Your brain ^^mutes whatever it sees coming.", "your brain mutes whatever it sees coming", 0.09, 1.25, {"reg": 0.5, "expand": 1.55}),
    ("feed", "In your feed,| it sees ^^ads coming.", "in your feed it sees ads coming", 0.07, 1.28, {"reg": 0.5, "expand": 1.55}),
    ("logo", "Logo. Product. Shop now.| ^^Muted. \\3", "logo product shop now muted", 0.03, 1.2, {"reg": 0.0, "expand": 1.5}),
    ("hookd", "So your ^^hook has to be the ^delay.", "so your hook has to be the delay", 0.06, 1.2, {"reg": 0.5, "expand": 1.55}),
    ("scale", "We scale businesses with ads ^like this.", "we scale businesses with ads like this", 0.1, 1.27, {"reg": 0.0, "expand": 1.45}),
    ("dm", "DM us the word ^teardown for a free ad review.", "DM us the word teardown for a free ad review", 0.06, 1.27, {"reg": 0.0, "expand": 1.45}),
]

# close and punchy (the Rushmore chain): high-pass, de-mud, presence and air, compression, limiter
POLISH = ("highpass=f=90,equalizer=f=250:t=q:w=1:g=-2.5,equalizer=f=3500:t=q:w=1.2:g=3,equalizer=f=9000:t=q:w=1:g=1.5,"
          "acompressor=threshold=-22dB:ratio=4:attack=3:release=60:makeup=4,alimiter=limit=0.9")

if __name__ == "__main__":
    make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_tickle_cues.json", tail=0.6,
            voice={"af_heart": 0.7, "af_sarah": 0.3}, polish=POLISH)
