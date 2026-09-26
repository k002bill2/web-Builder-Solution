const BASE = "http://127.0.0.1:4337";
const LOGDIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/qa-v2-final/docs/qa/v2-final";
const fs = await import("node:fs/promises");
const out = [];
const log = (...a) => { const s = a.map(x => typeof x === "string" ? x : JSON.stringify(x)).join(" "); out.push(s); console.log(s); };
const saveLog = async (name) => fs.writeFile(`${LOGDIR}/logs/${name}`, out.join("\n") + "\n");
async function setW(page, w, h = 900) {
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
}
async function shot(page, name) {
  for (let i = 0; i < 2; i++) {
    try { await page.screenshot({ path: `${LOGDIR}/screens/${name}` }); return `screens/${name}`; } catch (e) { if (i === 1) return `FAIL ${String(e.message).slice(0, 80)}`; }
  }
}
async function focusInfo(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return { el: "body" };
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const name = el.getAttribute("aria-label") || (el.innerText || el.value || "").trim().replace(/\s+/g, " ").slice(0, 40);
    const clip = [];
    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.overflowX !== "visible" || s.overflowY !== "visible") {
        const ar = a.getBoundingClientRect();
        const bt = parseFloat(s.borderTopWidth), bl = parseFloat(s.borderLeftWidth);
        const box = { t: ar.top + bt, l: ar.left + bl, b: ar.top + bt + a.clientHeight, r: ar.left + bl + a.clientWidth };
        const c = { t: box.t - (r.top - 4), b: (r.bottom + 4) - box.b, l: box.l - (r.left - 4), r: (r.right + 4) - box.r };
        const cl = Object.fromEntries(Object.entries(c).filter(([, v]) => v > 0.5).map(([k, v]) => [k, Math.round(v)]));
        if (Object.keys(cl).length) clip.push({ anc: a.tagName + "." + (a.className || "").toString().split(" ").slice(0, 3).join("."), ov: s.overflowX + "/" + s.overflowY, cut: cl });
      }
    }
    const pill = document.querySelector('section[aria-label="비교 트레이"]');
    let pillOv = null;
    if (pill && !pill.contains(el)) {
      const p = pill.getBoundingClientRect();
      const ix = Math.max(0, Math.min(r.right, p.right) - Math.max(r.left, p.left));
      const iy = Math.max(0, Math.min(r.bottom, p.bottom) - Math.max(r.top, p.top));
      pillOv = Math.round(ix * iy);
    }
    return {
      tag: el.tagName, role: el.getAttribute("role") || "", name,
      rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
      inVp: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth,
      ring: cs.boxShadow !== "none" ? "shadow:" + cs.boxShadow.slice(0, 70) : cs.outlineStyle !== "none" ? `outline:${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} off ${cs.outlineOffset}` : "NONE",
      clip: clip.length ? clip : undefined, pillOv,
    };
  });
}
async function docOv(page) {
  return page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, over: document.documentElement.scrollWidth > document.documentElement.clientWidth }));
}
async function tabLoop(page, n, key = "Tab") {
  const res = [];
  for (let i = 0; i < n; i++) { await page.keyboard.press(key); const f = await focusInfo(page); res.push(f); if (f.el === "body" && i > 0) break; }
  return res;
}
async function contrast(page, items) {
  return page.evaluate((items) => {
    const cv = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    const rgba = (c) => { cv.clearRect(0, 0, 1, 1); cv.fillStyle = "#000"; cv.fillStyle = c; cv.fillRect(0, 0, 1, 1); const d = cv.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
    const rgbaRaw = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) { const x = rgba(c); return x; } const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1]; };
    const over = (f, b) => { const a = f[3]; return [f[0] * a + b[0] * (1 - a), f[1] * a + b[1] * (1 - a), f[2] * a + b[2] * (1 - a), 1]; };
    const bgOf = (el) => { const stack = []; for (let a = el; a; a = a.parentElement) { const c = rgbaRaw(getComputedStyle(a).backgroundColor); if (c[3] > 0) stack.push(c); if (c[3] >= 1) break; } let b = [255, 255, 255, 1]; for (let i = stack.length - 1; i >= 0; i--) b = over(stack[i], b); return b; };
    const L = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
    const ratio = (a, b) => { const x = L(a), y = L(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2); };
    const hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
    return items.map(({ label, sel, text, prop = "color", nth = 0 }) => {
      let els = [...document.querySelectorAll(sel)];
      if (text) els = els.filter((e) => (e.textContent || "").includes(text));
      const el = nth === -1 ? els[els.length - 1] : els[nth];
      if (!el) return { label, err: "not found" };
      const cs = getComputedStyle(el);
      const bg = bgOf(prop === "color" ? el : el.parentElement || el);
      let op = 1; for (let a = el; a; a = a.parentElement) op *= parseFloat(getComputedStyle(a).opacity);
      let fg = rgbaRaw(prop === "border" ? cs.borderTopColor : cs.color); fg = [fg[0], fg[1], fg[2], fg[3] * op];
      const fgc = over(fg, bg);
      return { label, fg: hex(fgc), bg: hex(bg), ratio: ratio(fgc, bg), size: cs.fontSize + "/" + cs.fontWeight };
    });
  }, items);
}
async function focusSel(page, sel) { await page.evaluate((s) => { const e = document.querySelector(s); e && e.focus({ focusVisible: true }); }, sel); }
