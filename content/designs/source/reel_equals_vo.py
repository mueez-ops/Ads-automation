"""Voiceover + per-word timing for the explainer reel "Why would anyone invent the equals sign?" (a Zack D. Films topic,
"How The Equals Sign Was Invented", 92M views on YouTube; our angle: he turned three words into two lines; most ads say
too much, say it in two lines). Same voice and method as the armor, whale and bell reels: af_heart with 30% af_sarah,
fast, the melody written word by word in vo_expr.py.
Writes reel_equals_cues.json and <out_dir>/vo.wav (44.1 kHz). Numbers are spoken in words and shown as figures: a "+"
in the caption text rides with the word before it.
Facts:
- Robert Recorde (born in Tenby, Wales, about 1510; MD, Cambridge, 1545) was a physician and mathematician. His algebra
  book The Whetstone of Witte (London, 1557) is where the equals sign first appears (Wikipedia, "Equals sign" and
  "Robert Recorde"; MAA Convergence, "Mathematical Treasures: Robert Recorde's Whetstone of Witte").
- His reason, in the book: "And to auoide the tediouse repetition of these woordes: is equalle to: I will sette as I doe
  often in woorke vse, a paire of paralleles, or Gemowe lines of one lengthe, thus: =====, bicause noe .2. thynges, can
  be moare equalle." (Gemowe: twin.) Quoted by Caltech ("Question of the week: who invented the equal sign and why?")
  and the MacTutor archive (St Andrews).
- His sign was much longer than today's: he drew the +, - and = signs elongated (MAA Convergence).
- The sign was not popular at first (other symbols, such as Descartes's, competed with it) and became the standard
  around 1700, helped by Newton and Leibniz using it (Wikipedia, "Equals sign"). Not said in the voiceover.
Usage: python3 reel_equals_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_expr import make_vo

# (key, marked text (see vo_expr.py), caption text (same number of words), gap before, speed, line fx)
LINES = [
    # the hook: a question that climbs, a fed-up answer with "equal to" droned
    ("why", "Why would anyone invent the ^^equals sign? /6", "why would anyone invent the equals sign", 0.05, 1.18, {"reg": 1.0, "expand": 1.55}),
    ("sick", "Because he was ^^sick of writing| is _equal _to!", "because he was sick of writing 'is equal to'", 0.05, 1.15, {"reg": 1.5, "expand": 1.5}),
    # the story
    ("doc", "In fifteen fifty-seven, a Welsh ^doctor was writing a math ^^book.", "in 1557 + a welsh doctor was writing a math book", 0.1, 1.25, {"reg": 0.0, "expand": 1.5}),
    ("again", "He wrote| is _equal _to...| again, and ^again, and ^^^again!", "he wrote 'is equal to' again and again and again", 0.06, 1.22, {"reg": 0.5, "expand": 1.6}),
    ("lines", "So he drew two ^^lines instead.", "so he drew two lines instead", 0.06, 1.2, {"reg": 0.5, "expand": 1.45}),
    ("why2", "But why two ^lines? /5", "but why two lines", 0.08, 1.15, {"reg": 0.5, "expand": 1.5}),
    ("equal", "No two things can be more ^^equal.", "no two things can be more equal", 0.05, 1.15, {"reg": 0.5, "expand": 1.5}),
    ("longer", "His version was ^^way longer!", "his version was way longer", 0.1, 1.15, {"reg": 1.0, "expand": 1.5}),
    ("calc", "Now it's on every ^^calculator.", "now it's on every calculator", 0.1, 1.15, {"reg": 0.0, "expand": 1.45}),
    # the switch
    ("three", "He turned three ^words| into two ^^lines.", "he turned three words into two lines", 0.14, 1.15, {"reg": 0.0, "expand": 1.5}),
    ("most", "Most ads say ^^too much.", "most ads say too much", 0.2, 1.1, {"reg": -0.5, "expand": 1.45}),
    ("say", "Say it in two ^^lines+.", "say it in two lines", 0.06, 1.1, {"reg": 0.5, "expand": 1.5}),
    ("scale", "We scale businesses with ads ^like this.", "we scale businesses with ads like this", 0.15, 1.2, {"reg": 0.0, "expand": 1.45}),
    ("dm", "DM us the word ^teardown for a free ad review.", "DM us the word teardown for a free ad review", 0.08, 1.2, {"reg": 0.0, "expand": 1.45}),
]

# close and punchy (the Rushmore chain): high-pass, de-mud, presence and air, compression, limiter
POLISH = ("highpass=f=90,equalizer=f=250:t=q:w=1:g=-2.5,equalizer=f=3500:t=q:w=1.2:g=3,equalizer=f=9000:t=q:w=1:g=1.5,"
          "acompressor=threshold=-22dB:ratio=4:attack=3:release=60:makeup=4,alimiter=limit=0.9")

if __name__ == "__main__":
    make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_equals_cues.json", tail=0.6,
            voice={"af_heart": 0.7, "af_sarah": 0.3}, polish=POLISH)
