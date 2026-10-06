// M2C-REQA 2 — 비활성 폼 3폭 육안(Ego Lite) + 체크박스 계산 스타일. 정적 사본 4339. → shots/form-<n>-<w>.png · logs/form-visual.json
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2c-reqa/dev/active/m2c-reqa";
const { writeFile } = await import("node:fs/promises");
const page = (await taskSpace(80)).page("p1");
const out = {};
for (const w of [1280, 768, 390]) for (const n of ["contact--form", "contact--booking"]) {
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: w, height: 900, deviceScaleFactor: 1, mobile: false });
  await page.goto(`http://127.0.0.1:4339/${n}.html`);
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => {
    const fs = document.querySelector("fieldset.kit-fieldset");
    fs.scrollIntoView({ block: "center" });
    const chk = document.querySelector(".kit-check");
    const s = getComputedStyle(chk);
    const anc = []; for (let e = chk; e; e = e.parentElement) { const o = getComputedStyle(e).opacity; if (o !== "1") anc.push(e.tagName + ":" + o); }
    const lowOp = [...document.querySelectorAll("[data-site-root] *")].filter((e) => getComputedStyle(e).opacity !== "1").length;
    const filt = [...document.querySelectorAll("[data-site-root] *")].filter((e) => getComputedStyle(e).filter !== "none").length;
    return { checkbox: { disabled: chk.disabled, matchesDisabled: chk.matches(":disabled"), opacity: s.opacity, accent: s.accentColor, appearance: s.appearance, w: chk.offsetWidth, h: chk.offsetHeight, ancestorsOpacityNot1: anc },
      lowOpacityEls: lowOp, filterEls: filt, consentLabelColor: getComputedStyle(chk.closest("label")).color, ink: getComputedStyle(document.querySelector("[data-site-root]")).getPropertyValue("--site-ink") };
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/shots/form-${n}-${w}.png` });
  (out[n] ??= {})[w] = info;
  console.log(n, w, JSON.stringify(info));
}
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await writeFile(`${DIR}/logs/form-visual.json`, JSON.stringify(out, null, 1));
