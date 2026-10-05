(async () => {
  const { capturePng } = await import("/src/features/studio/png/pngCapture.ts");
  const { openCaptureFrame } = await import("/src/features/studio/staticHtml/staticHtml.ts");
  const { sampleDoc } = await import("/src/engine/testing/sampleDoc.ts");
  const { SAMPLE_KIT_TOKENS } = await import("/src/render/testing/sampleKitTokens.ts");
  const APP = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2b-d1/app";
  // dev 서버 render.html엔 스타일시트 링크가 없다 → 이번 build의 render CSS를 /@fs로(제품 kitCss 규칙 그대로)
  const fetchText = async (url) => url === "/render.html" ? '<link rel="stylesheet" href="/@fs' + APP + '/dist/assets/render-BZVnPKWZ.css">' : (await fetch(url)).text();
  const fetchBytes = async (url) => (await fetch(url.startsWith("/assets/") ? "/@fs" + APP + "/dist" + url : url)).arrayBuffer();
  const reports = [];
  const open = (rem) => { const ch = openCaptureFrame(rem, 16384 / 16); return { send: ch.send, close: ch.close, listen: (r) => ch.listen((d) => { if (d?.type === "rects") { const s = d.rects.filter((x) => x[1] === null); reports.push([Math.max(0, ...s.map((x) => Math.round(x[4]))), Math.ceil(Math.max(0, ...s.map((x) => x[3] + x[5])))]); } r(d); }) }; };
  const draw = async (url, w, h) => {
    const img = new Image(); img.src = url; await img.decode();
    const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); g.drawImage(img, 0, 0);
    const blob = await new Promise((r) => c.toBlob(r, "image/png"));
    const sha = [...new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()))].slice(0, 6).map((b) => b.toString(16).padStart(2, "0")).join("");
    globalThis.__last = { w, h, bytes: blob.size, sha };
    return blob;
  };
  const t0 = performance.now();
  try {
    await capturePng({ doc: sampleDoc(), kitTokens: SAMPLE_KIT_TOKENS, view: "desktop", name: "d1", revision: 1 }, { open, fetchText, fetchBytes, draw, download: () => {}, timeoutMs: 8000 });
    return { ms: Math.round(performance.now() - t0), ...globalThis.__last, reports };
  } catch (e) { return { ms: Math.round(performance.now() - t0), error: e.code ?? String(e), msg: String(e.message), reports }; }
})()
