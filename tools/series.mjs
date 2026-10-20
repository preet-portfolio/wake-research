// The series: each seed deterministically picks parameters from ranges chosen
// from the contact sheets (sparse, contracting, time-sheared), then renders.
// usage: node tools/series.mjs <firstSeed> <count>
//   writes out/svg/series/uji-<seed>.svg and out/svg/series/series.json
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { launch, render } from "./uji.mjs";

const MAX_ATTEMPTS = 8;

function mulberry32(a) {
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// attempt > 0 re-rolls deterministically when an earlier attempt failed the plot check
export function paramsFor(seed, attempt = 0) {
    const r = mulberry32(seed * 7919 + attempt * 104729);
    const between = (a, b, d = 3) => +(a + (b - a) * r()).toFixed(d);
    const sign = () => (r() < 0.5 ? -1 : 1);

    // ranges tightened after the first 20-seed plot check: corners of squares
    // and triangles fold lines onto each other, as do fast rotations
    const shape = [1, 1, 1, 2, 3][Math.floor(r() * 5)];
    const angular = shape != 1;
    const iterations = Math.round(angular ? between(36, 46) : between(40, 66));
    const contraction = between(0.972, 0.986);
    // one in five gets the twisted-band anisotropy seen in sheet 04
    const skew = r() < 0.2 ? between(-0.006, 0.006) : 0;
    return {
        seed,
        shape,
        segments: 600,
        radius: Math.round(angular ? between(320, 380) : between(380, 440)),
        iterations,
        expansionhori: +(contraction + skew).toFixed(4),
        expansionverti: contraction,
        rotationspeed: +(sign() * (angular ? between(0.4, 0.8) : between(0.6, 1.5))).toFixed(2),
        rotationoriginhori: between(0.3, 0.7, 2),
        rotationoriginverti: between(0.3, 0.7, 2),
        timeshear: sign() * Math.round(iterations * between(0.7, 1.4)),
        jitter: r() < 0.5 ? 0 : 0.2,
    };
}

const [first, count] = process.argv.slice(2).map(Number);
if (!count) {
    console.error("usage: node tools/series.mjs <firstSeed> <count>");
    process.exit(2);
}
const { browser, page } = await launch();
const index = [];
for (let seed = first; seed < first + count; seed++) {
    const file = `out/svg/series/uji-${String(seed).padStart(3, "0")}.svg`;
    let entry;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const p = paramsFor(seed, attempt);
        const res = await render(page, p, { svg: true });
        fs.writeFileSync(file, res.svg);
        const check = JSON.parse(execFileSync(".venv/bin/python", ["tools/plotcheck.py", file]).toString());
        entry = { file, attempt, hash: res.hash, params: p, check };
        if (check.pass) break;
    }
    index.push(entry);
}
await browser.close();
fs.writeFileSync("out/svg/series/series.json", JSON.stringify(index, null, 1));
const firstTry = index.filter(e => e.attempt == 0 && e.check.pass).length;
const passed = index.filter(e => e.check.pass).length;
console.log(JSON.stringify({ rendered: index.length, passedFirstTry: firstTry, passed, attempts: index.map(e => e.attempt) }));
