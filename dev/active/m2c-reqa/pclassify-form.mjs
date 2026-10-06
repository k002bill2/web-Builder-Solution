// M2C-REQA 분류: m2c-5b 기준선(A) 대 새 기준선(B) 차이 픽셀을 비활성 폼 자리(.kit-notice ∪ fieldset.kit-fieldset, B 좌표) 안/밖으로 나눈다.
// 높이가 다르면(390) 자리 아래 행은 B[y] 대 A[y - Δh]로 맞춰 비교(자리 안 높이 증가로 밀린 아래 내용). 사용: node pclassify-form.mjs <A> <B>
import { readFileSync } from "node:fs";
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
const [A, B] = process.argv.slice(2);
const R = JSON.parse(readFileSync("logs/form-rects.json", "utf8"));
for (const n of Object.keys(R)) for (const w of ["1280", "768", "390"]) {
  const f = `${n}-${w}.png`, a = decode(`${A}/${f}`), b = decode(`${B}/${f}`), r = R[n][w];
  const boxes = [...r.notice, ...r.fieldset];
  const top = Math.min(...boxes.map((x) => x[1])), bot = Math.max(...boxes.map((x) => x[3])), left = Math.min(...boxes.map((x) => x[0])), right = Math.max(...boxes.map((x) => x[2]));
  const dh = b.h - a.h;
  let inside = 0, outside = 0, ox0 = 1e9, oy0 = 1e9, ox1 = -1, oy1 = -1;
  const cmp = (yb, ya) => { for (let x = 0; x < b.w; x++) { const ia = (ya * a.w + x) * a.bpp, ib = (yb * b.w + x) * b.bpp; let d = 0; for (let k = 0; k < 3; k++) d = Math.max(d, Math.abs(a.px[ia + k] - b.px[ib + k])); if (!d) continue;
    if (yb >= top && yb < bot && x >= left && x < right) inside++; else { outside++; ox0 = Math.min(ox0, x); oy0 = Math.min(oy0, yb); ox1 = Math.max(ox1, x); oy1 = Math.max(oy1, yb); } } };
  for (let y = 0; y < b.h; y++) { if (y < bot) { if (y < a.h) cmp(y, y); } else if (y - dh >= 0 && y - dh < a.h) cmp(y, y - dh); }
  console.log(f, `A${a.w}x${a.h} B${b.w}x${b.h} Δh${dh}`, `zone x${left}-${right} y${top}-${bot}`, "inZone", inside, "outside", outside, outside ? `bbox ${ox0},${oy0}-${ox1},${oy1}` : "");
}
