// Headless driver for the uji fork. It loads uji/index.html in Chromium and
// makes setInterval synchronous, so a render runs to completion immediately.
// It then reads out the SVG (via the app's own downloadSVG) and/or a PNG.
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// UJI_INDEX points at another checkout (e.g. pristine upstream for equivalence tests)
const indexUrl = pathToFileURL(process.env.UJI_INDEX || path.join(root, "uji", "index.html")).href;

// injected before script.js: synchronous interval + capture of downloads
const initScript = (mathRandomSeed) => {
    // optional: make Math.random itself deterministic (for upstream comparisons)
    if (mathRandomSeed) {
        let a = mathRandomSeed >>> 0;
        Math.random = () => {
            a = (a + 0x6D2B79F5) >>> 0;
            let t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    let running = false, stopped = false, nextId = 1;
    const realClear = window.clearInterval;
    window.setInterval = (cb, ms) => {
        const id = nextId++;
        running = true; stopped = false;
        while (!stopped) cb();
        running = false;
        return id;
    };
    window.clearInterval = id => { if (running) stopped = true; else realClear(id); };
    window.__captured = null;
};

export async function launch() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.addInitScript(initScript, parseInt(process.env.UJI_MATHRANDOM_SEED || "0"));
    page.on("pageerror", e => { throw e; });
    // "i10" = 10 iterations, so the boot render is cheap
    await page.goto(`${indexUrl}#i10`);
    await page.evaluate(() => {
        // function declarations are window properties, so this hooks downloads
        window.downloadFile = (dataUrl, filename) => { window.__captured = dataUrl; };
    });
    return { browser, page };
}

// opts: object of uji option names → values (missing ones use defaults)
export async function render(page, opts, { svg = true, png = false, thumb = 0 } = {}) {
    return page.evaluate(({ opts, svg, png, thumb }) => {
        applyOptions(opts);
        const out = { hash: generateShareHash(optionValues) };
        if (svg) {
            downloadSVG();
            out.svg = atob(window.__captured.split(",")[1]);
        }
        const canvas = document.querySelector("canvas");
        if (png) out.png = canvas.toDataURL("image/png");
        if (thumb) {
            const t = document.createElement("canvas");
            t.width = thumb;
            t.height = Math.round(thumb * canvas.height / canvas.width);
            t.getContext("2d").drawImage(canvas, 0, 0, t.width, t.height);
            out.thumb = t.toDataURL("image/jpeg", 0.9);
        }
        return out;
    }, { opts, svg, png, thumb });
}

// parse "a=1,b=2" or a JSON string into an options object
export function parseOpts(s) {
    if (!s) return {};
    if (s.trim().startsWith("{")) return JSON.parse(s);
    return Object.fromEntries(s.split(",").map(kv => {
        const [k, v] = kv.split("=");
        return [k.trim(), parseFloat(v)];
    }));
}
