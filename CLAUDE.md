# uji series

Goal: one finished generative-art series made with a fork of doersino/uji, plotted on paper. Not a list of ideas.

## Layout
- `uji/` is the fork (submodule: github.com/preet-portfolio/uji, branch `wake-series`; upstream github.com/doersino/uji). Its own rules are in `uji/CLAUDE.md`.
- `tools/` holds the headless renderer, sweeps and plot checks. Commands are in `tools/CLAUDE.md`.
- `out/` holds generated files only (`svg/`, `contact-sheets/`, `plot-ready/`, `frames/`). Never hand-edit it.
- `docs/findings.md` is the working log: the loop walkthrough, sweep notes and vpype numbers.
- `docs/statement.md` is the artist statement.
- `.venv/` is Python 3.12 with vpype (`.venv/bin/vpype`). System Python 3.14 can't build Shapely, so don't use it for vpype.

## Phases
1. Read the source: the loop order, the random call sites and whether share URLs are deterministic.
2. Seed it: put all randomness through a seeded PRNG and add `seed` to the share URL. Prove byte-identical SVGs.
3. Sweep: make 10×10 contact sheets over parameter pairs.
4. Thesis and loop change: make one transform change tied to *uji* (being-time). Keep it behind an option so the defaults are unchanged.
5. Paper: produce 3 plot-ready SVGs that pass the vpype limits.
6. License: check what selling prints allows.
7. Statement, plus a 20-up family sheet.

## Done means these external tests pass
- Same seed and options give a byte-identical SVG (`cmp` exits 0).
- With the new option off, the fork renders the upstream defaults unchanged.
- Every plot-ready SVG estimates under 45 min and has no over-inked cell (limits are in `tools/CLAUDE.md`).
- A stranger can tell the 20 sheet outputs apart, yet sees them as one family.

## Delegation
Mechanical work goes to the Haiku agents in `.claude/agents/`:
- `uji-source-reader` locates code.
- `uji-sweep-renderer` runs batch renders.
- `uji-plot-checker` runs the vpype checks.

Judgement stays in the main session: the thesis, the loop design, curation and choosing parameters.

## License
uji is MIT, plus a clause banning NFTs unless the proceeds feed birds. Physical prints are fine. Keep the copyright notice in the fork.

## wake (my own instrument)
- `wake/` is my own generative drawing instrument, written from scratch, with no uji code. It's TypeScript + Vite + WebGL2. Its README lists the commands.
- Model: `docs/wake-model.md`. Interaction concepts: `docs/mockups/`.
- Originality check: `cd wake && npm run jscpd`. It compares against uji's *original* `HEAD:script.js` with raised size limits, because jscpd skips files over 1000 lines by default.
