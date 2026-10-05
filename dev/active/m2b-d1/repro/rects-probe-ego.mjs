// M2B-D1 재현 — Ego Lite(QA가 D-1을 본 환경)에서 같은 프로브. `ego-browser nodejs < rects-probe-ego.mjs`
const task = await taskSpace("m2b-d1 probe");
console.log("SPACE", task.spaceId);
const page = task.page("p1");
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await page.goto("http://127.0.0.1:4337/render.html");
await page.waitForFunction(() => !!document.getElementById("root"), undefined, { timeout: 20000 });
for (let run = 1; run <= 5; run++) {
  const log = await page.evaluate(async () => {
    const { openCaptureFrame } = await import("/src/features/studio/staticHtml/staticHtml.ts");
    const { sampleDoc } = await import("/src/engine/testing/sampleDoc.ts");
    const { SAMPLE_KIT_TOKENS } = await import("/src/render/testing/sampleKitTokens.ts");
    let raf = 0; const rafLoop = () => { raf++; if (performance.now() - t0 < 8000) requestAnimationFrame(rafLoop); };
    const t0 = performance.now(); requestAnimationFrame(rafLoop);
    const ch = openCaptureFrame(80, 1024);
    const log = [];
    ch.listen((d) => {
      const t = Math.round(performance.now() - t0);
      if (d?.type === "ready") { log.push({ t, type: "ready" }); ch.send({ type: "render", doc: sampleDoc(), kitTokens: SAMPLE_KIT_TOKENS }); }
      else if (d?.type === "rects") {
        const sec = d.rects.filter((r) => r[1] === null);
        log.push({ t, type: "rects", sections: sec.length, widths: [...new Set(sec.map((r) => Math.round(r[4])))], bottom: Math.ceil(sec.reduce((m, r) => Math.max(m, r[3] + r[5]), 0)) });
      } else log.push({ t, type: d?.type, code: d?.code });
    });
    await new Promise((r) => setTimeout(r, 8000));
    ch.close();
    return { raf, log };
  });
  console.log(JSON.stringify({ run, ...log }));
}
