# tools

Run everything from the project root. `node` uses Playwright plus Chromium. Python always comes from `.venv/` (3.12 with vpype).

## Options syntax
Use `"name=value,name=value"` with uji option names (see `uji/script.js`, the top `options` object) or a JSON object. Missing options take their defaults. Always pass `seed=<n>` (n > 0) when results must be reproducible.

## Commands
- One render: `node tools/render.mjs "<opts>" out/svg/<name> [--png]` writes `<name>.svg`, and `<name>.png` with `--png`. It prints JSON `{out, hash, ms, svgBytes}`. `hash` is the uji share hash.
- Contact sheet: `node tools/sweep.mjs <optA> <a0> <a1> <optB> <b0> <b1> "<base opts>" out/contact-sheets/<name>.png [n=10]`. Rows vary optA and columns vary optB. It also writes `<name>.json` with each cell's label and share hash.
- Plot check: `tools/plotcheck.sh <svg> [--paper a4|a3] [--pen 0.3]` writes `out/plot-ready/<name>.<paper>.svg` and prints one JSON line.
- Upstream comparison: set `UJI_INDEX=<path to pristine index.html>` and `UJI_MATHRANDOM_SEED=<n>` on render.mjs.

## Plot assumptions and pass limits (plotcheck.py)
- Layout fits the drawing to the paper with a 15 mm margin.
- Speeds: pen-down 50 mm/s, pen-up 150 mm/s, 0.25 s per lift. These are conservative AxiDraw settings.
- Density: ink area per 2 mm cell is length × pen width / 4 mm².
- **Pass** requires both an estimated time of 45 min or less and a max cell coverage of 1.5 or less. Above 1.5, the pen keeps re-passing over paper that is already saturated.
- Rough budget: 45 min ≈ 135 m of pen-down ink.

## Naming
`out/svg/<series>-<seed>[-variant]`, `out/contact-sheets/<nn>-<optA>-x-<optB>`.
