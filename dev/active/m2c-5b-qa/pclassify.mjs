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
// M2C-5b 분류: m2b-6 기준선(A) 대 새 기준선(B) 차이 픽셀을 kit-art rect 안/밖으로 나눈다. 크기가 다르면 공통 높이만 비교(밖으로 표기).
const [A, B] = process.argv.slice(2);
const R = JSON.parse(readFileSync("logs/art-rects.json", "utf8"));
for (const f of readdirSync(A).filter((f) => f.endsWith(".png")).sort()) {
  const [, n, w] = f.match(/^(.*)-(\d+)\.png$/);
  const a = decode(`${A}/${f}`), b = decode(`${B}/${f}`);
  const rects = R[n]?.[w] ?? [];
  const W = Math.min(a.w, b.w), Hh = Math.min(a.h, b.h);
  let inside = 0, outside = 0, ox0 = 1e9, oy0 = 1e9, ox1 = -1, oy1 = -1;
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
    const ia = (y * a.w + x) * a.bpp, ib = (y * b.w + x) * b.bpp; let d = 0;
    for (let k = 0; k < 3; k++) d = Math.max(d, Math.abs(a.px[ia + k] - b.px[ib + k]));
    if (!d) continue;
    if (rects.some(([l, t, r, bt]) => x >= l && x < r && y >= t && y < bt)) inside++; else { outside++; ox0 = Math.min(ox0, x); oy0 = Math.min(oy0, y); ox1 = Math.max(ox1, x); oy1 = Math.max(oy1, y); }
  }
  if (inside + outside || a.h !== b.h) console.log(f, `A${a.w}x${a.h} B${b.w}x${b.h}`, "rects", rects.length, "inArt", inside, "outside", outside, outside ? `bbox ${ox0},${oy0}-${ox1},${oy1}` : "");
}
