// M2B-D1 — 제품 capturePng(수정본)를 Chrome headless에서 N회. node capture-headless.mjs [runs] [cpuThrottle]
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const RUNS = Number(process.argv[2] ?? 5), THROTTLE = Number(process.argv[3] ?? 1);
const BODY = readFileSync(new URL("./capture-body.js", import.meta.url), "utf8");
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--remote-debugging-port=9334", "--remote-debugging-address=127.0.0.1", `--user-data-dir=${mkdtempSync(join(tmpdir(), "m2b-d1-chrome-"))}`, "--no-first-run", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let t; for (let i = 0; i < 50 && !t; i++) { await sleep(200); t = await fetch("http://127.0.0.1:9334/json/list").then((r) => r.json()).then((l) => l.find((x) => x.type === "page")).catch(() => undefined); }
  const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0; const pend = new Map();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
  const cdp = (method, params = {}) => new Promise((res) => { const n = ++id; pend.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp("Page.navigate", { url: "http://127.0.0.1:4337/render.html" }); await sleep(4000);
  if (THROTTLE > 1) await cdp("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
  for (let run = 1; run <= RUNS; run++) {
    const r = await cdp("Runtime.evaluate", { expression: BODY, awaitPromise: true, returnByValue: true });
    console.log(JSON.stringify({ run, throttle: THROTTLE, ...(r.result.result.value ?? r.result) }));
  }
  ws.close();
} finally { chrome.kill(); }
