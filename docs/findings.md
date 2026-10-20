# Findings

## 1. Source: how uji actually draws (`uji/script.js`, upstream line numbers)
- **Setup** (`restartRendering`, l.1146). The shape is sampled into `segments` points (circle, square, triangle or line). Then come optional random swaps (`lineswappiness`, l.1202) and an initial rotation about the canvas center. The background is a flat fill, or salt-and-pepper noise (l.1242).
- **Loop**. `setInterval(…, 1000/60)` (l.1293). It runs `iterations + 1` frames: the frame that trips `++n > iterations` still draws. No requestAnimationFrame is used.
- **Per point, per frame, in order:**
  1. **Skip test** (l.1323–1328). The point always skips at `i == 0`. Otherwise it skips when `r() < skipchance`, when outside the reveal window, on random fade-in, on random fade-out, or on sawtooth fade-out. A skipped point becomes a moveTo.
  2. **Draw** as a lineTo, or as a detached rotated or lengthened segment.
  3. **Modify**: jitter `(r()-0.5)*jitter` *inside* the expansion. Jitter therefore accumulates as a random walk and is amplified by expansion. Then come expansion (with an exponent growing in n), translation and waviness. Waviness is a function of the index `i`, not of time, so it adds up every frame.
  4. **Rotate** about the rotation origin by an angle that depends only on the global `n` (speedup, sinusoidal period, fade-until).
- **Randomness**: everything goes through one alias, `const r = Math.random` (l.1144), with 8 call sites. The only other random use is the random preset picked on load (l.322).
- **Quirk**: `i % r() * fadeoutspeed` parses as `(i % r()) * fadeoutspeed`. That is probably unintended, but it's part of the look, so it's left alone.
- **Share URLs are not deterministic.** The hash holds only non-default option values, with no seed. `jitter` defaults to 1, so *every* default render is random. The same link gives a different drawing each time. SVG metadata embeds the share URL, which includes `window.location`.

## 2. Seeding (fork)
- I changed `r` to a `let` and re-created it per render: `seed > 0` gives mulberry32(seed), and `seed == 0` gives `Math.random` (upstream behaviour). It is a new option at the end of the list, so existing prefixes don't move. Its share prefix is `see`.
- **Test, seeded:** rendering the same opts twice gives byte-identical SVGs (sha1 `1466d20d…`, 6.7 MB).
- **Test, unseeded:** two renders differ, as upstream does.
- **Test, equivalence:** I patched `Math.random` to a fixed stream and rendered with pristine upstream and with the fork (seed=0, timeshear=0). The SVG paths match byte for byte; only `<metadata>`, which holds the file URL, differs.

## 3. Paper reality check
A typical dense uji render (1000 segments × 500 iterations, jitter 3) laid out on A4 at a 0.3 mm pen:
- 2.1 km of pen-down ink.
- About **957 min** of plotting.
- Max cell coverage **807**, with 2,220 cells over the limit.

uji's on-screen look comes from thousands of overlapping hairlines that blend on a canvas. A pen can't do that, so the plottable series must be **sparse**: about 135 m of ink, with lines that separate instead of stacking.

## 4. Sweeps (out/contact-sheets/)
- **01–03, timeshear v1** (shift only the time-varying rotation terms per segment): **no visible effect**. Rotating a point keeps its radius, so on a circle the per-point phase only slides points along the same circle. I discarded that design.
- **04, upstream control**: the interesting upstream region is anisotropic expansion plus rotation (twisted bands). The middle columns, thin rings, are the only plottable part.
- **05–07, timeshear v2** (each segment has its own clock: frozen and undrawn until `n − |shear|·k/N ≥ 0`, then all transforms use local time `t`): this gives a strong, consistent signature. Rings become crescents and open spirals with a hard "not-yet" edge, and the effect holds across shapes and rotation origins. With the option at 0, output is unchanged: I re-ran the equivalence test after v2 and it passed.

## 5. Paper
- **First candidates** (100–120 iterations, contraction 0.99): 8–20 min on A4/A3, which is fine, but max coverage was 5.5–10.5 against a limit of 1.5. Contracting rings converge and stack ink.
- **Fix**: use fewer and wider-spaced rings, with 40–66 iterations and contraction 0.972–0.986. On paper the result reads as a net of short arcs, a different and better aesthetic than the dense screen look.
- **Series generator** (`tools/series.mjs`): a seed maps deterministically to parameters. If a draw fails the plot check, it re-rolls with a sub-seed, up to 8 attempts.
  - First run of 20, with loose ranges: 7 passed.
  - Second run, with ranges tightened from that data: 8 of 20 passed on the first try, and 20 of 20 after re-rolls.
  - **Every survivor is a circle.** Squares and triangles fold lines into their corners and never passed. The paper chose the ensō.
- **Finals** (`out/plot-ready/final/`, A4, 0.3 mm pen):

| piece | share hash | est. min | max coverage |
|---|---|---|---|
| uji-004 | `r413ro-1.27rot0.3rota0.37e0.976ex0.976se600i51j0.2see4ti60` | 4.2 | 0.88 |
| uji-011 | `r426ro0.84rot0.35rota0.57e0.976ex0.978se600i44j0see11ti45` | 3.7 | 0.69 |
| uji-016 | `r406ro0.73rot0.45rota0.32e0.987ex0.982se600i40j0.2see16ti-45` | 3.5 | 0.88 |

## 6. License (uji/LICENSE, "MIT except NFTs" v1.1)
- **Allowed:** using, modifying, publishing and **selling** the software and its output, including physical pen plots, prints, editions and commissions. The one condition is that the copyright and permission notice ships with copies *of the software*. Printed artwork isn't a copy of the software. Credit the tool anyway ("made with a fork of uji by Noah Doersing").
- **Forbidden:** using the software, original or modified, to make artwork intended for distribution as an NFT. The exception is if *all* NFT revenue is spent on bird food handed out locally, with photos sent to the author.
- **Fork:** keep `LICENSE` and the notice, which `uji/CLAUDE.md` enforces. Fonts are SIL OFL 1.1. The two Unsplash photos are only UI assets.
- Not legal advice. For a gallery sale, the practical reading is that prints are fine and tokens are not.

## 7. Family test
`out/contact-sheets/09-family-20.png` shows all 20 seeds as they would sit on A4. **Not yet done:** the stranger test, where someone who hasn't seen the project says whether the pieces are distinguishable but one family. That needs a person, not me.
