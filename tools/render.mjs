// Render one uji image.
// usage: node tools/render.mjs "<opts>" <out-basename> [--png]
//   opts: "seed=7,rotationspeed=0.4" or a JSON object
//   writes <out-basename>.svg (and .png with --png)
import fs from "node:fs";
import { launch, render, parseOpts } from "./uji.mjs";

const [optsArg, outBase, ...flags] = process.argv.slice(2);
if (!outBase) {
    console.error('usage: node tools/render.mjs "<opts>" <out-basename> [--png]');
    process.exit(2);
}
const png = flags.includes("--png");

const { browser, page } = await launch();
const t0 = Date.now();
const res = await render(page, parseOpts(optsArg), { svg: true, png });
fs.writeFileSync(`${outBase}.svg`, res.svg);
if (png) fs.writeFileSync(`${outBase}.png`, Buffer.from(res.png.split(",")[1], "base64"));
await browser.close();
console.log(JSON.stringify({ out: outBase, hash: res.hash, ms: Date.now() - t0, svgBytes: res.svg.length }));
