// PNG 픽셀 비교(저장소 밖 의존성 0 — node:zlib만). 사용: node pdiff.mjs <폴더A> <폴더B> [파일...]  → 파일별 크기·다른 픽셀 수·최대 채널 차·차이 영역(bbox)
import { readFileSync, readdirSync } from "node:fs";
import { inflateSync } from "node:zlib";
function decode(path) {
  const b = readFileSync(path); let p = 8, w, h, bd, ct; const idat = [];
  while (p < b.length) { const len = b.readUInt32BE(p), type = b.toString("ascii", p + 4, p + 8), data = b.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bd = data[8]; ct = data[9]; if (data[12]) throw new Error("interlace"); }
    if (type === "IDAT") idat.push(data); p += 12 + len; }
  if (bd !== 8) throw new Error("bitdepth " + bd);
  const bpp = { 2: 3, 6: 4, 0: 1, 4: 2 }[ct]; const raw = inflateSync(Buffer.concat(idat)); const stride = w * bpp; const out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) { const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), row = out.subarray(y * stride, (y + 1) * stride), prev = y ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) { const a = x >= bpp ? row[x - bpp] : 0, up = prev ? prev[x] : 0, c = prev && x >= bpp ? prev[x - bpp] : 0; let v = src[x];
      if (f === 1) v += a; else if (f === 2) v += up; else if (f === 3) v += (a + up) >> 1; else if (f === 4) { const pp = a + up - c, pa = Math.abs(pp - a), pb = Math.abs(pp - up), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c; }
      row[x] = v & 255; } }
  return { w, h, bpp, px: out };
}
const [A, B, ...only] = process.argv.slice(2);
const files = only.length ? only : readdirSync(A).filter((f) => f.endsWith(".png")).sort();
let bad = 0;
for (const f of files) {
  const a = decode(`${A}/${f}`), b = decode(`${B}/${f}`);
  if (a.w !== b.w || a.h !== b.h) { console.log(f, "SIZE", a.w, a.h, b.w, b.h); bad++; continue; }
  let n = 0, max = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let i = 0; i < a.w * a.h; i++) { let d = 0; for (let k = 0; k < a.bpp; k++) d = Math.max(d, Math.abs(a.px[i * a.bpp + k] - b.px[i * b.bpp + k])); if (d) { n++; max = Math.max(max, d); const x = i % a.w, y = (i / a.w) | 0; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } }
  if (n) bad++;
  console.log(f, `${a.w}x${a.h}`, "diffPx", n, "maxCh", max, n ? `bbox ${x0},${y0}-${x1},${y1}` : "");
}
console.log("TOTAL", files.length, "pixelDiffFiles", bad);
