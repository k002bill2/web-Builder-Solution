// M2B-4a [B] 내보내기 — `ego-browser nodejs < qb-export.mjs`. 부모 = 4337(dev) 앱 페이지에서 실제 생성기 모듈(capturePng·createStaticHtmlGenerator)을 import해 부른다.
// 숨은 iframe = 4337 /render.html(sandbox allow-scripts 그대로). 킷 CSS·글꼴 바이트 = 4339(preview, 운영 빌드) — fetchText·fetchBytes 주입(dev render.html은 스타일시트 링크가 없다).
// B6 PNG: 웹폰트 캡처 2회 = 픽셀 동일 · @font-face 뺀 음성 = 불일치 / B9: 받기 실패(404)·5.1초 = 실패·파일 0 · 4.9초 = 성공·높이 = 즉시 높이 · 시간 초과 뒤 도착 = 파일 0
// 정적 HTML: 생성 → dist/qb-static-*.html(4339) → B6 문서 글꼴·네트워크 글꼴 요청 0 · 3폭 가로 넘침 0 · 200% · 렌더 문서와 계산 스타일 동등성
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2b-4a";
const { writeFile } = await import("node:fs/promises");
const task = await taskSpace(65);
const page = task.page("p1");
const out = {};
const log = (k, v) => { out[k] = v; console.log("QB", k, JSON.stringify(v).slice(0, 1400)); };
const H = { 1280: 900, 768: 1024, 390: 844 };
// 15초 evaluate 상한 회피 — 페이지 안에서 비동기 작업을 돌리고 결과를 폴링
const job = async (fn, arg) => {
  await page.evaluate(([src, arg]) => {
    window.__r = undefined;
    (0, eval)(`(${src})`)(arg).then((v) => (window.__r = { v }), (e) => (window.__r = { e: String(e) }));
  }, [fn.toString(), arg ?? null]);
  await page.waitForFunction(() => window.__r !== undefined, undefined, { timeout: 180000 });
  const r = await page.evaluate(() => window.__r);
  if (r.e) throw new Error(r.e);
  return r.v;
};
const setSize = (width) => page.cdp("Emulation.setDeviceMetricsOverride", { width, height: H[width], deviceScaleFactor: 1, mobile: false });

await page.goto("http://127.0.0.1:4337/render.html?parent");
await page.waitForFunction(() => !!document.getElementById("root"), undefined, { timeout: 15000 });
await page.evaluate(async () => {
  const png = await import("/src/features/studio/png/pngCapture.ts");
  const sh = await import("/src/features/studio/staticHtml/staticHtml.ts");
  const emb = await import("/src/features/studio/staticHtml/siteFontEmbed.ts");
  const { sampleDoc } = await import("/src/engine/testing/sampleDoc.ts");
  const { sampleTheme } = await import("/src/engine/testing/sampleTheme.ts");
  const { docKitTokens } = await import("/src/features/studio/docPurpose.ts");
  const B = "http://127.0.0.1:4339";
  const fetchText = async (u) => (await fetch(B + u)).text();
  const fetchBytesRaw = async (u) => { const r = await fetch(B + u, { cache: "no-store" }); if (!r.ok) throw new Error(`${u} ${r.status}`); return r.arrayBuffer(); };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const theme = (family) => { const p = sampleTheme().profile; return { ...p, base: { ...p.base, typography_tokens: { ...p.base.typography_tokens, family } } }; };
  const doc = { ...sampleDoc(), profileVersion: 2, meta: { title: "글꼴 검증", description: "M2B-4a" } };
  const tokens = (family) => docKitTokens({ profileId: "profile-1", versions: [theme(family)], latestVersion: 2 }, 2);
  const pixels = async (url, w, h) => { const img = new Image(); img.src = url; for (let i = 0; ; i++) { try { await img.decode(); break; } catch (e) { if (i >= 2) throw e; await new Promise((r) => setTimeout(r, 300)); } } const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"); x.drawImage(img, 0, 0); return x.getImageData(0, 0, w, h).data; };
  const diff = (a, b) => { if (a.length !== b.length) return -1; let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) n++; return n; };
  // PNG 한 번 — draw는 제품 drawPng와 같은 순서(decode → drawImage → toBlob), SVG URL·크기를 기록
  const capture = async (family, view = "desktop", fetchBytes = fetchBytesRaw) => {
    const rec = { downloads: 0 };
    const deps = {
      open: (widthRem) => sh.openCaptureFrame(widthRem, 16384 / 16),
      fetchText,
      fetchBytes,
      fontTimeoutMs: 5000,
      timeoutMs: 8000,
      draw: async (url, w, h) => { rec.url = url; rec.w = w; rec.h = h; return new Blob(["png"]); },
      download: () => void rec.downloads++,
    };
    const t0 = performance.now();
    try {
      await png.savePng({ doc, kitTokens: tokens(family), view, name: "qb", revision: 1 }, deps);
      rec.ok = true;
    } catch (e) {
      rec.ok = false; rec.code = e.code; rec.message = e.message;
    }
    rec.ms = Math.round(performance.now() - t0);
    return rec;
  };
  window.__x = { png, sh, emb, doc, tokens, theme, capture, pixels, diff, sleep, fetchText, fetchBytesRaw };
});

// B6 PNG (1280) — 계열 3종: 같은 캡처 2회 = 0 · 음성(@font-face 뺀 캡처 CSS) ≠ 0
for (const family of ["Noto Serif KR", "Noto Sans KR", "Pretendard"]) {
  const r = await job(async (family) => {
    const { capture, pixels, diff } = window.__x;
    const a = await capture(family);
    const b = await capture(family);
    const svgA = decodeURIComponent(a.url.replace("data:image/svg+xml;charset=utf-8,", ""));
    const neg = svgA.replace(/@font-face\{[^}]*\}/g, "");
    const pa = await pixels(a.url, a.w, a.h);
    const pb = await pixels(b.url, b.w, b.h);
    const pn = await pixels(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(neg)}`, a.w, a.h);
    const faces = [...svgA.matchAll(/@font-face\{font-family:"([^"]+)";font-weight:(\d+)/g)].map((m) => `${m[1]}:${m[2]}`);
    return { ok: a.ok && b.ok, size: [a.w, a.h], heightSame: a.h === b.h, faces, assetUrls: (svgA.match(/url\(\/assets/g) ?? []).length, diffRepeat: diff(pa, pb), diffNegative: diff(pa, pn), downloads: a.downloads + b.downloads };
  }, family);
  log(`B6-PNG ${family}`, r);
}

// B9 PNG — Noto Serif KR
const b9 = await job(async () => {
  const { capture, fetchBytesRaw, sleep } = window.__x;
  const base = await capture("Noto Serif KR");
  const fail404 = await capture("Noto Serif KR", "desktop", (u) => fetchBytesRaw(u.replace("KitSerifKR", "NOPE")));
  const ok49 = await capture("Noto Serif KR", "desktop", async (u) => { await sleep(4900); return fetchBytesRaw(u); });
  let lateArrived = 0;
  const late51 = await capture("Noto Serif KR", "desktop", async (u) => { await sleep(5100); lateArrived++; return fetchBytesRaw(u); });
  await sleep(1500);
  const pick = (r) => ({ ok: r.ok, code: r.code, message: r.message, ms: r.ms, h: r.h, downloads: r.downloads });
  return { base: pick(base), fail404: pick(fail404), ok49: { ...pick(ok49), heightEqualsBase: ok49.h === base.h }, late51: { ...pick(late51), lateArrived } };
});
log("B9-PNG", b9);

// PNG 3폭(Noto Serif KR) — 폭·높이
log("PNG 3폭", await job(async () => {
  const { capture } = window.__x;
  const r = {};
  for (const view of ["desktop", "tablet", "mobile"]) { const c = await capture("Noto Serif KR", view); r[view] = { ok: c.ok, w: c.w, h: c.h }; }
  return r;
}));

// 정적 HTML — 실제 생성기
const statics = await job(async () => {
  const { sh, doc, theme, fetchText, fetchBytesRaw, sleep } = window.__x;
  const made = [];
  const urls = { createObjectURL: (b) => (made.push(b), URL.createObjectURL(b)), revokeObjectURL: (u) => URL.revokeObjectURL(u) };
  const gen = (family, fetchBytes = fetchBytesRaw) => sh.createStaticHtmlGenerator({ projects: () => [{ projectId: "p", profileId: "profile-1" }], versions: () => [theme(family)] }, { fetchText, fetchBytes, urls, fontTimeoutMs: 5000 });
  const res = {};
  for (const family of ["Noto Serif KR", "Noto Sans KR", "Pretendard"]) {
    const r = await gen(family)({ projectId: "p", doc });
    res[family] = await (await fetch(r.downloadRef)).text();
  }
  const before = made.length;
  const fails = {};
  for (const [name, fb] of [["fail404", (u) => fetchBytesRaw(u.replace("Kit", "NOPE"))], ["late51", async (u) => { await sleep(5100); return fetchBytesRaw(u); }]]) {
    const t0 = performance.now();
    try { await gen("Noto Serif KR", fb)({ projectId: "p", doc }); fails[name] = "성공(틀림)"; } catch (e) { fails[name] = { code: e.code, message: e.message, ms: Math.round(performance.now() - t0) }; }
  }
  await sleep(1500);
  let ok49;
  { const t0 = performance.now(); const r = await gen("Noto Serif KR", async (u) => { await sleep(4900); return fetchBytesRaw(u); })({ projectId: "p", doc }); ok49 = { ok: !!r.downloadRef, ms: Math.round(performance.now() - t0) }; }
  return { html: res, fails, filesAfterFailures: made.length - before - 1, ok49 };
});
log("B9-HTML", { fails: statics.fails, filesMadeByFailures: statics.filesAfterFailures, ok49: statics.ok49 });
for (const [family, html] of Object.entries(statics.html)) {
  const name = `qb-static-${family.replace(/ /g, "-")}.html`;
  await writeFile(`${DIR}/app/dist/${name}`, html);
  await writeFile(`${DIR}/dev/active/m2b-4a/static/${name}`, html).catch(() => undefined);
  const faces = [...html.matchAll(/@font-face\{font-family:"([^"]+)";font-weight:(\d+)[^}]*font-display:swap[^}]*url\(data:font\/woff2/g)].map((m) => `${m[1]}:${m[2]}`);
  log(`정적 HTML ${family} 소스`, { bytes: html.length, dataFaces: faces, otherFaceRules: (html.match(/@font-face/g) ?? []).length - faces.length, local: /local\(/.test(html), assetsUrl: /url\(\/?assets/.test(html), notice: /<!--\s*Fonts: [\s\S]*SIL OPEN FONT LICENSE Version 1\.1[\s\S]*-->/.test(html), scripts: (html.match(/<script/g) ?? []).length });
}

// 정적 HTML 열기(4339) — B6 문서 글꼴 · 네트워크 글꼴 요청 0 · 3폭 넘침 · 200%
for (const family of ["Noto Serif KR", "Noto Sans KR", "Pretendard"]) {
  const name = `qb-static-${family.replace(/ /g, "-")}.html`;
  const r = {};
  for (const w of [1280, 768, 390]) {
    await setSize(w);
    await page.goto(`http://127.0.0.1:4339/${name}`);
    await page.waitForFunction(() => document.fonts.status === "loaded", undefined, { timeout: 10000 });
    r[w] = await page.evaluate(async () => {
      await document.fonts.ready;
      const faces = [...document.fonts].filter((f) => f.status === "loaded").map((f) => `${f.family}:${f.weight}`);
      const fontRequests = performance.getEntriesByType("resource").filter((e) => /woff2?|font/i.test(e.name) || e.initiatorType === "css").map((e) => e.name.slice(0, 80));
      const over = () => document.scrollingElement.scrollWidth - innerWidth;
      const at100 = over();
      document.documentElement.style.fontSize = "200%";
      await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
      const at200 = over();
      document.documentElement.style.fontSize = "";
      return { innerWidth, faces, fontRequests, overflow100: at100, overflow200: at200 };
    });
  }
  log(`B6-HTML·3폭·200% ${family}`, r);
}
await page.cdp("Emulation.clearDeviceMetricsOverride", {});

// 계산 스타일 동등성(1280) — 렌더 문서(4337 render.html, 같은 문서·토큰) vs 정적 HTML(4339)
const PROPS = ["fontFamily", "fontWeight", "fontSize", "lineHeight", "fontSynthesis", "color"];
const grab = (props) => page.evaluate((props) => [...document.querySelectorAll("[data-site-root] [data-kit] :is(h1,h2,h3,p,a,li,span,button)")].map((el) => props.map((p) => getComputedStyle(el)[p]).join("|")), props);
for (const family of ["Noto Serif KR", "Pretendard"]) {
  await setSize(1280);
  await page.goto("http://127.0.0.1:4337/render.html?cmp");
  await page.waitForFunction(() => !!document.getElementById("root"), undefined, { timeout: 15000 });
  await page.evaluate(async (family) => {
    const { sampleDoc } = await import("/src/engine/testing/sampleDoc.ts");
    const { sampleTheme } = await import("/src/engine/testing/sampleTheme.ts");
    const { docKitTokens } = await import("/src/features/studio/docPurpose.ts");
    const p = sampleTheme().profile;
    const v = { ...p, base: { ...p.base, typography_tokens: { ...p.base.typography_tokens, family } } };
    window.postMessage({ type: "render", doc: { ...sampleDoc(), profileVersion: 2 }, kitTokens: docKitTokens({ profileId: "profile-1", versions: [v], latestVersion: 2 }, 2) }, "*");
  }, family);
  await page.waitForFunction(() => document.querySelectorAll("[data-site-root] [data-kit]").length > 3, undefined, { timeout: 10000 });
  await page.waitForTimeout(800);
  const a = await grab(PROPS);
  await page.goto(`http://127.0.0.1:4339/qb-static-${family.replace(/ /g, "-")}.html`);
  await page.waitForTimeout(800);
  const b = await grab(PROPS);
  const mism = a.map((x, i) => (x === b[i] ? null : [i, x, b[i]])).filter(Boolean);
  log(`계산 스타일 동등성 ${family}`, { elements: [a.length, b.length], mismatches: mism.length, sample: a[0], first: mism.slice(0, 3) });
}
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await writeFile(`${DIR}/dev/active/m2b-4a/logs/qb-export.json`, JSON.stringify(out, null, 1));
