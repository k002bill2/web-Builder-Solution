// QFIX-QA fixture 생성기 (er-5b-qa gen-fixtures 사본 축약) — 자체 제작 캔버스 패턴만. 외부 이미지 0.
// 실행: SPACE=<id> ego-browser nodejs < gen-fixtures.mjs  (이미 4339에 열린 p1 페이지에서 OffscreenCanvas로 인코딩)
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/qfix-qa/dev/active/qfix-qa/fixtures";
const { writeFile } = await import("node:fs/promises");
const { createHash } = await import("node:crypto");
const task = await taskSpace(Number(process.env.SPACE || 4));
const page = task.page("p1");
const enc = (s) => page.evaluate(async (s) => {
  let seed = s.seed >>> 0;
  const rnd = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const c = new OffscreenCanvas(s.w, s.h), g = c.getContext("2d");
  if (s.kind === "noise") { const img = g.createImageData(s.w, s.h); for (let i = 0; i < img.data.length; i += 4) { img.data[i] = rnd() * 255; img.data[i + 1] = rnd() * 255; img.data[i + 2] = rnd() * 255; img.data[i + 3] = 255; } g.putImageData(img, 0, 0); }
  else { const hue = s.seed * 97 % 360; const grd = g.createLinearGradient(0, 0, s.w, s.h); grd.addColorStop(0, `hsl(${hue},60%,55%)`); grd.addColorStop(1, `hsl(${(hue + 120) % 360},60%,35%)`); g.fillStyle = grd; g.fillRect(0, 0, s.w, s.h); g.fillStyle = "#fff"; g.font = `bold ${s.h / 4}px sans-serif`; g.textAlign = "center"; g.fillText(s.label, s.w / 2, s.h / 2); }
  const buf = new Uint8Array(await (await c.convertToBlob({ type: "image/jpeg", quality: 0.92 })).arrayBuffer());
  let bin = ""; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  return btoa(bin);
}, s);
const manifest = [];
for (const s of [
  { name: "pic-a.jpg", w: 1200, h: 800, kind: "grad", seed: 1, label: "A" },
  { name: "pic-b.jpg", w: 1200, h: 800, kind: "grad", seed: 2, label: "B" },
  { name: "pic-c.jpg", w: 1200, h: 800, kind: "grad", seed: 3, label: "C" },
  { name: "noise-12mp.jpg", w: 4000, h: 3000, kind: "noise", seed: 55 },
  { name: "big-noise.jpg", w: 6000, h: 4000, kind: "noise", seed: 54 },
]) { const buf = Buffer.from(await enc(s), "base64"); await writeFile(`${DIR}/${s.name}`, buf); manifest.push({ name: s.name, w: s.w, h: s.h, bytes: buf.length, sha256: createHash("sha256").update(buf).digest("hex").slice(0, 16) }); }
await writeFile(`${DIR}/MANIFEST.json`, JSON.stringify(manifest, null, 1));
console.log(manifest);
