// Sheet of plot-ready SVGs as they'd look on paper (one cell per file).
// usage: node tools/sheet.mjs <out.png> <cols> <svg>...
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const [out, colsArg, ...files] = process.argv.slice(2);
if (!files.length) {
    console.error("usage: node tools/sheet.mjs <out.png> <cols> <svg>...");
    process.exit(2);
}
const cols = parseInt(colsArg), cell = 420;
const html = path.resolve(out.replace(/\.png$/, ".html"));
fs.writeFileSync(html, `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:16px;background:#bbb;font:11px ui-monospace,monospace;color:#222}
.g{display:grid;grid-template-columns:repeat(${cols},${cell}px);gap:12px}
img{display:block;width:${cell}px;background:#fff;box-shadow:0 1px 3px #0004}
</style><div class="g">${files.map(f => `<figure style="margin:0"><img src="${path.relative(path.dirname(html), path.resolve(f))}"><figcaption>${path.basename(f)}</figcaption></figure>`).join("")}</div>`);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 32 + cols * (cell + 12), height: 400 } });
await page.goto("file://" + html);
await page.waitForLoadState("load");
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(JSON.stringify({ out, cells: files.length }));
