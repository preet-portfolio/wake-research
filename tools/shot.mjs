import { chromium } from "playwright";
const [url,out]=process.argv.slice(2);
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1400,height:900}});
await p.goto(url);await p.waitForTimeout(1500);await p.screenshot({path:out,fullPage:true});await b.close();
