"""Voiceover + per-word timing for the explainer reel "Why would anyone drill a tiny hole in a gas nozzle?" (a Zack D.
Films topic, "How Gas Pumps Know When To Stop", 87M views on YouTube; our angle: one tiny hole tells the pump to stop;
your ads need that hole, or they keep pumping money after they stop working). Same voice and method as the armor,
whale, bell and equals reels: af_heart with 30% af_sarah, fast, the melody written word by word in vo_expr.py.
Writes reel_pump_cues.json and <out_dir>/vo.wav (44.1 kHz).
Facts:
- The shut-off is purely mechanical. Fuel rushing through a venturi (a narrow throat) inside the nozzle creates low
  pressure, which draws air through a small port near the tip of the spout and up a tube to a chamber in the handle.
  When the tank is full, fuel covers the port, the air stops, the vacuum in the chamber builds and pulls a small
  diaphragm, which trips the latch holding the main valve open, and a spring snaps the valve shut (Hagerty, "How the
  Venturi effect enables gas pump shutoffs and carburetors"; ABC News, "Answer Geek: How Gas Pumps Sense Full Tank";
  Motorcyclist, "How Does A Gas Pump Nozzle Work?").
- OPW released the first automatic shut-off nozzles around 1949-1950 (OPW, "Evolution of the fuel nozzle"; Dover).
  Not said in the voiceover.
Usage: python3 reel_pump_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_expr import make_vo

# (key, marked text (see vo_expr.py), caption text (same number of words), gap before, speed, line fx)
LINES = [
    # the hook: a question that climbs, a bright answer
    ("why", "Why would anyone drill a tiny ^^hole in a gas nozzle? /6", "why would anyone drill a tiny hole in a gas nozzle", 0.05, 1.2, {"reg": 1.0, "expand": 1.55}),
    ("stop", "So the pump knows when to ^^stop!", "so the pump knows when to stop", 0.05, 1.15, {"reg": 1.5, "expand": 1.5}),
    # how it works
    ("rush", "As gas rushes through, it ^sucks air in through the ^^hole.", "as gas rushes through it sucks air in through the hole", 0.1, 1.25, {"reg": 0.0, "expand": 1.5}),
    ("full", "When your tank is ^full,| the gas covers the hole.", "when your tank is full the gas covers the hole", 0.08, 1.22, {"reg": 0.5, "expand": 1.5}),
    ("noair", "No more ^^air.", "no more air", 0.06, 1.1, {"reg": 0.5, "expand": 1.55}),
    ("snap", "The suction ^yanks a little diaphragm,| and the valve snaps ^^shut!", "the suction yanks a little diaphragm and the valve snaps shut", 0.06, 1.25, {"reg": 0.5, "expand": 1.6}),
    ("just", "No sensors. No ^electronics. Just a ^^hole.", "no sensors no electronics just a hole", 0.12, 1.2, {"reg": 0.0, "expand": 1.5}),
    # the switch
    ("need", "Your ads need that ^^hole.", "your ads need that hole", 0.18, 1.15, {"reg": 0.0, "expand": 1.5}),
    ("or", "Or they keep pumping ^money after they stop ^^working.", "or they keep pumping money after they stop working", 0.06, 1.2, {"reg": -0.5, "expand": 1.45}),
    ("know", "Know when to ^^stop+.", "know when to stop", 0.1, 1.1, {"reg": 0.5, "expand": 1.5}),
    ("scale", "We scale businesses with ads ^like this.", "we scale businesses with ads like this", 0.15, 1.2, {"reg": 0.0, "expand": 1.45}),
    ("dm", "DM us the word ^teardown for a free ad review.", "DM us the word teardown for a free ad review", 0.08, 1.2, {"reg": 0.0, "expand": 1.45}),
]

# close and punchy (the Rushmore chain): high-pass, de-mud, presence and air, compression, limiter
POLISH = ("highpass=f=90,equalizer=f=250:t=q:w=1:g=-2.5,equalizer=f=3500:t=q:w=1.2:g=3,equalizer=f=9000:t=q:w=1:g=1.5,"
          "acompressor=threshold=-22dB:ratio=4:attack=3:release=60:makeup=4,alimiter=limit=0.9")

if __name__ == "__main__":
    make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_pump_cues.json", tail=0.6,
            voice={"af_heart": 0.7, "af_sarah": 0.3}, polish=POLISH)
