// M2B-D1 재현 — Chrome headless(CDP, 의존성 0)로 제품 openCaptureFrame(80rem·1024rem)에 렌더하고 모든 rects 보고를 시각·섹션 폭·바닥과 함께 기록.
// 사용: node rects-probe.mjs [runs] [cpuThrottle]   (4337 = 이 worktree vite dev, 127.0.0.1)
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const RUNS = Number(process.argv[2] ?? 5);
const THROTTLE = Number(process.argv[3] ?? 1);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9333;
const profile = mkdtempSync(join(tmpdir(), "m2b-d1-chrome-"));
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, "--remote-debugging-address=127.0.0.1", `--user-data-dir=${profile}`, "--no-first-run", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    await sleep(200);
    target = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json()).then((l) => l.find((t) => t.type === "page")).catch(() => undefined);
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) (pending.get(m.id))(m), pending.delete(m.id);
  });
  const cdp = (method, params = {}) => new Promise((resolve) => { const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({ id: n, method, params })); });
  const evaluate = async (expression) => {
    const r = await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails));
    return r.result.result.value;
  };
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  if (THROTTLE > 1) await cdp("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
  await cdp("Page.navigate", { url: "http://127.0.0.1:4337/render.html" });
  await sleep(4000);
  const out = [];
  for (let run = 1; run <= RUNS; run++) {
    const W = [16, 50, 100, 150, 200][(run - 1) % 5]; const log = await evaluate(`globalThis.__W = ${W}; (async () => {
      const { openCaptureFrame } = await import("/src/features/studio/staticHtml/staticHtml.ts");
      const { sampleDoc } = await import("/src/engine/testing/sampleDoc.ts");
      const { SAMPLE_KIT_TOKENS } = await import("/src/render/testing/sampleKitTokens.ts");
      const t0 = performance.now();
      const ch = openCaptureFrame(Number(globalThis.__W) / 16, 1024);
      const log = [];
      ch.listen((d) => {
        const t = Math.round(performance.now() - t0);
        if (d?.type === "ready") { log.push({ t, type: "ready" }); ch.send({ type: "render", doc: sampleDoc(), kitTokens: SAMPLE_KIT_TOKENS }); }
        else if (d?.type === "rects") {
          const sec = d.rects.filter((r) => r[1] === null);
          log.push({ t, type: "rects", sections: sec.length, widths: [...new Set(sec.map((r) => Math.round(r[4])))], bottom: Math.ceil(sec.reduce((m, r) => Math.max(m, r[3] + r[5]), 0)) });
        } else log.push({ t, type: d?.type, code: d?.code });
      });
      await new Promise((r) => setTimeout(r, 6000));
      ch.close();
      return log;
    })()`);
    out.push({ W, log });
    console.log(JSON.stringify({ W, log: log.filter((l) => l.type === "rects").slice(-1) }));
  }
  ws.close();
} finally {
  chrome.kill();
}
