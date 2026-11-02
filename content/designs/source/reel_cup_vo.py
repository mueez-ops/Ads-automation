"""Voiceover + per-word timing for the explainer reel "Why would a company buy a stranger a brand new car?" (a Zack D.
Films topic, "Stanley Cup Saves Life", 82M views on YouTube; our angle: the best ad Stanley ever got was made by a
customer; find your customers' proof, then put money behind it). Same voice and method as the armor, whale, bell,
equals and pump reels: af_heart with 30% af_sarah, fast, the melody written word by word in vo_expr.py.
Writes reel_cup_cues.json and <out_dir>/vo.wav (44.1 kHz).
Facts (2023):
- A TikTok user named Danielle posted a video of her burnt-out car; her Stanley cup had survived in the cupholder and
  still had ice inside. The video drew tens of millions of views (reported as 60 million to over 90 million) (Scripps
  News, "Stanley gifts TikToker new SUV after her cup survives car fire"; CarAdvice, "Tumbler cup survives car fire,
  its manufacturer to buy owner a new car").
- Stanley's president, Terence Reilly, replied with a video: the company would send her cups and replace her vehicle,
  something it had never done before (Scripps; CarAdvice). Stanley bought her a new SUV (Scripps).
Usage: python3 reel_cup_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_expr import make_vo

# (key, marked text (see vo_expr.py), caption text (same number of words), gap before, speed, line fx)
LINES = [
    # the hook: a question that climbs, a surprising answer
    ("why", "Why would a company buy a stranger a brand new ^^car? /6", "why would a company buy a stranger a brand new car", 0.05, 1.2, {"reg": 1.0, "expand": 1.55}),
    ("cup", "Because her cup survived a ^^fire!", "because her cup survived a fire", 0.05, 1.15, {"reg": 1.5, "expand": 1.5}),
    # the story
    ("shell", "Her car burned to a ^^shell.", "her car burned to a shell", 0.1, 1.2, {"reg": 0.0, "expand": 1.5}),
    ("fine", "But in the cupholder,| her Stanley cup was ^^fine.", "but in the cupholder her Stanley cup was fine", 0.06, 1.22, {"reg": 0.5, "expand": 1.55}),
    ("ice", "And there was still ^^ice inside!", "and there was still ice inside", 0.06, 1.15, {"reg": 1.0, "expand": 1.6}),
    ("views", "Her video got tens of millions of ^^views.", "her video got tens of millions of views", 0.1, 1.22, {"reg": 0.0, "expand": 1.5}),
    ("reply", "Stanley's president replied:| we'll replace your ^^car.", "Stanley's president replied we'll replace your car", 0.08, 1.2, {"reg": 0.5, "expand": 1.5}),
    ("did", "And they ^^did.", "and they did", 0.06, 1.1, {"reg": 1.0, "expand": 1.55}),
    # the switch
    ("made", "Stanley didn't make that ad.| A ^^customer did.", "Stanley didn't make that ad a customer did", 0.16, 1.15, {"reg": 0.0, "expand": 1.5}),
    ("find", "Find your customers' ^^proof.| Then put money behind it.", "find your customers' proof then put money behind it", 0.1, 1.15, {"reg": -0.5, "expand": 1.45}),
    ("scale", "We scale businesses with ads ^like this.", "we scale businesses with ads like this", 0.15, 1.2, {"reg": 0.0, "expand": 1.45}),
    ("dm", "DM us the word ^teardown for a free ad review.", "DM us the word teardown for a free ad review", 0.08, 1.2, {"reg": 0.0, "expand": 1.45}),
]

# close and punchy (the Rushmore chain): high-pass, de-mud, presence and air, compression, limiter
POLISH = ("highpass=f=90,equalizer=f=250:t=q:w=1:g=-2.5,equalizer=f=3500:t=q:w=1.2:g=3,equalizer=f=9000:t=q:w=1:g=1.5,"
          "acompressor=threshold=-22dB:ratio=4:attack=3:release=60:makeup=4,alimiter=limit=0.9")

if __name__ == "__main__":
    make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_cup_cues.json", tail=0.6,
            voice={"af_heart": 0.7, "af_sarah": 0.3}, polish=POLISH)
