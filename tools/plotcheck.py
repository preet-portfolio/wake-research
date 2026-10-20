"""Plot-readiness check for uji SVGs.

usage: .venv/bin/python tools/plotcheck.py <in.svg> [--paper a4|a3] [--pen 0.3]

It lays the drawing out on paper with a 15 mm margin, optimises it with vpype
(linemerge, linesort, reloop, linesimplify) and writes
out/plot-ready/<name>.<paper>.svg. It then prints one JSON line of stats.
See tools/CLAUDE.md for the speed and density assumptions and the pass limits.
"""
import argparse, json, os, sys
import numpy as np
import vpype_cli

PEN_DOWN_MM_S = 50.0      # conservative AxiDraw pen-down speed for clean lines
PEN_UP_MM_S = 150.0
LIFT_S = 0.25             # pen up + pen down per lift
CELL_MM = 2.0             # density grid cell size
MAX_MINUTES = 45.0
MAX_COVERAGE = 1.5        # ink area / cell area; >1.5 means repeated passes over saturated paper

ap = argparse.ArgumentParser()
ap.add_argument("svg")
ap.add_argument("--paper", default="a4")
ap.add_argument("--pen", type=float, default=0.3)
args = ap.parse_args()

name = os.path.splitext(os.path.basename(args.svg))[0]
out = os.path.join("out", "plot-ready", f"{name}.{args.paper}.svg")
os.makedirs(os.path.dirname(out), exist_ok=True)

doc = vpype_cli.execute(
    f'read "{args.svg}" layout --fit-to-margins 15mm {args.paper} '
    f'linemerge --tolerance 0.05mm linesort reloop linesimplify --tolerance 0.02mm '
    f'write "{out}"'
)

px_per_mm = 96 / 25.4
down_mm = doc.length() / px_per_mm
up_mm = doc.pen_up_length() / px_per_mm
lifts = sum(len(layer) for layer in doc.layers.values())
minutes = (down_mm / PEN_DOWN_MM_S + up_mm / PEN_UP_MM_S + lifts * LIFT_S) / 60

# density: ink length per cell × pen width / cell area
xs, ys, ws = [], [], []
for layer in doc.layers.values():
    for line in layer:
        if len(line) < 2:
            continue
        seg = np.diff(line)
        mid = (line[:-1] + line[1:]) / 2
        xs.append(mid.real); ys.append(mid.imag); ws.append(np.abs(seg))
xs, ys, ws = (np.concatenate(a) / px_per_mm for a in (xs, ys, ws))
bx = np.arange(xs.min(), xs.max() + CELL_MM, CELL_MM)
by = np.arange(ys.min(), ys.max() + CELL_MM, CELL_MM)
hist, _, _ = np.histogram2d(xs, ys, bins=[bx, by], weights=ws)
coverage = hist * args.pen / CELL_MM ** 2
iy, ix = np.unravel_index(np.argmax(coverage.T), coverage.T.shape)

res = {
    "file": args.svg, "out": out, "paper": args.paper, "pen_mm": args.pen,
    "lines": lifts, "pen_down_mm": round(down_mm), "pen_up_mm": round(up_mm),
    "minutes": round(minutes, 1),
    "max_coverage": round(float(coverage.max()), 2),
    "cells_over": int((coverage > MAX_COVERAGE).sum()),
    "hotspot_mm": [round(float(bx[ix]), 1), round(float(by[iy]), 1)],
    "pass": bool(minutes <= MAX_MINUTES and coverage.max() <= MAX_COVERAGE),
}
print(json.dumps(res))
sys.exit(0)
