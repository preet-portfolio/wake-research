// Contact sheet: a grid sweeping two uji options over linear ranges.
// usage: node tools/sweep.mjs <optA> <a0> <a1> <optB> <b0> <b1> "<base opts>" <out.png> [n=10]
//   rows vary optA, columns vary optB; every cell uses the same base opts (incl. seed)
import fs from "node:fs";
import { launch, render, parseOpts } from "./uji.mjs";

const [a, a0, a1, b, b0, b1, baseArg, out, nArg] = process.argv.slice(2);
if (!out) {
    console.error('usage: node tools/sweep.mjs <optA> <a0> <a1> <optB> <b0> <b1> "<base opts>" <out.png> [n=10]');
    process.exit(2);
}
const n = parseInt(nArg || "10");
const base = parseOpts(baseArg);
const lerp = (x0, x1, k) => +(parseFloat(x0) + (parseFloat(x1) - parseFloat(x0)) * k / (n - 1)).toFixed(4);

const { browser, page } = await launch();
const t0 = Date.now();
const cells = [];
for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
        const opts = { ...base, [a]: lerp(a0, a1, i), [b]: lerp(b0, b1, j) };
        const res = await render(page, opts, { svg: false, thumb: 220 });
        cells.push({ label: `${a}=${opts[a]} ${b}=${opts[b]}`, hash: res.hash, src: res.thumb });
    }
}

const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:16px;background:#111;color:#ccc;font:11px ui-monospace,monospace}
h1{font-size:13px;margin:0 0 10px;color:#eee}
.g{display:grid;grid-template-columns:repeat(${n},220px);gap:6px}
figure{margin:0}img{display:block;width:220px}figcaption{padding:2px 0;white-space:nowrap;overflow:hidden}
</style><h1>rows: ${a} ${a0}→${a1} · cols: ${b} ${b0}→${b1} · base: ${baseArg || "defaults"}</h1>
<div class="g">${cells.map(c => `<figure><img src="${c.src}"><figcaption>${c.label}</figcaption></figure>`).join("")}</div>`;
await page.setContent(html);
await page.setViewportSize({ width: 32 + n * 226, height: 600 });
await page.screenshot({ path: out, fullPage: true });
fs.writeFileSync(out.replace(/\.png$/, ".json"), JSON.stringify(cells.map(({ src, ...c }) => c), null, 1));
await browser.close();
console.log(JSON.stringify({ out, cells: cells.length, ms: Date.now() - t0 }));
