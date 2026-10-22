// R3 방법 1 (2차: kit/fonts.css @font-face 포함) — dev 서버(4399) 페이지에서 실제 createStaticHtmlGenerator("static-zip") 직접 호출. 렌더 iframe = 실제 openRenderFrame.
// 한계: dev 서버 render.html엔 stylesheet link가 없어(DEV_SERVER_UNSUPPORTED) fetchText만 kit.css·motion.css ?raw 원문을 돌려주도록 주입.
const task = await taskSpace("release-check-live r3");
const page = task.page("p1");
await page.goto("http://localhost:4399/");
await page.waitForTimeout(2000);
const out = await page.evaluate(async () => {
  try {
    const g = await import("/src/features/studio/staticHtml/staticHtml.ts");
    const { sampleDoc } = await import("/src/engine/testing/sampleDoc.ts");
    const { sampleTheme } = await import("/src/engine/testing/sampleTheme.ts");
    const kit = (await import("/src/kit/fonts.css?raw")).default.replace(/url\(["']?\.\.\//g, "url(/src/") + (await import("/src/kit/kit.css?raw")).default, motion = (await import("/src/kit/motion.css?raw")).default;
    const PROFILE = sampleTheme().profile;
    const ID = "33333333-3333-4333-8333-333333333333";
    let n = 0;
    const base = sampleDoc();
    const doc = { ...base, profileVersion: PROFILE.version, meta: { title: "모던 카페", description: "스페셜티 커피와 디저트" },
      sections: base.sections.map((s) => ({ ...s, slots: Object.fromEntries(Object.entries(s.slots).map(([k, v]) => [k, typeof v === "object" && v && v.enabled ? (n++, { ...v, source: ID }) : v])) })) };
    const png = await (await fetch("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")).blob();
    const store = { projects: () => [{ projectId: "p1", profileId: "pf1" }], versions: (id) => (id === "pf1" ? [PROFILE] : []) };
    const files = { "/render.html": '<html><head><link rel="stylesheet" href="/r3-kit.css"></head></html>', "/r3-kit.css": kit + "\n" + motion };
    const fetchText = async (u) => (u in files ? files[u] : g.defaultFetchText(u));
    let summary;
    const gen = g.createStaticHtmlGenerator(store, { fetchText, readImage: (id) => (id === ID ? { blob: png, width: 1000, height: 1000 } : undefined), onBuilt: (_r, s) => (summary = s) });
    const r = await gen({ projectId: "p1", format: "static-zip", doc: { ...doc, updatedAt: "2026-10-22T00:00:00.000Z" } });
    const bytes = new Uint8Array(await (await fetch(r.downloadRef)).arrayBuffer());
    let bin = ""; for (const b of bytes) bin += String.fromCharCode(b);
    return { ok: true, slots: n, resultHash: r.resultHash, summary, b64: btoa(bin) };
  } catch (e) { return { ok: false, err: String(e && e.stack || e).slice(0, 800) }; }
});
if (out.ok) { const fs = await import("node:fs"); fs.writeFileSync(process.env.TMPDIR + "/r3-zip/site.zip", Buffer.from(out.b64, "base64")); delete out.b64; }
console.log(JSON.stringify(out));
