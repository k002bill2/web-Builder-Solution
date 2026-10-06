// M2C-REQA 보조: 폼 자리 아래 행(B y ≥ zone bottom)을 A의 몇 px 위 행과 맞추면 차이 0인지 — 자리 높이 증가로 아래 내용(footer 등)이 그대로 밀린 것인지 확인. 사용: node pshift-below.mjs <A> <B>
import { readFileSync } from "node:fs";
const src = readFileSync(new URL("./pclassify-form.mjs", import.meta.url), "utf8");
const decode = new Function("readFileSync", "inflateSync", src.slice(src.indexOf("function decode"), src.indexOf("const [A, B]")) + "return decode;")(readFileSync, (await import("node:zlib")).inflateSync);
const [A, B] = process.argv.slice(2);
const R = JSON.parse(readFileSync("logs/form-rects.json", "utf8"));
for (const n of Object.keys(R)) for (const w of ["1280", "768", "390"]) {
  const f = `${n}-${w}.png`, a = decode(`${A}/${f}`), b = decode(`${B}/${f}`), r = R[n][w];
  const bot = Math.max(...[...r.notice, ...r.fieldset].map((x) => x[3]));
  const res = [];
  for (let s = 0; s <= 80; s++) { let diff = 0, rows = 0;
    for (let y = bot; y < b.h; y++) { const ya = y - s; if (ya < 0 || ya >= a.h) continue; rows++;
      for (let x = 0; x < b.w; x++) { const ia = (ya * a.w + x) * a.bpp, ib = (y * b.w + x) * b.bpp; if (a.px[ia] !== b.px[ib] || a.px[ia + 1] !== b.px[ib + 1] || a.px[ia + 2] !== b.px[ib + 2]) diff++; } }
    res.push([s, diff, rows]); }
  const best = res.reduce((m, x) => (x[1] < m[1] ? x : m));
  console.log(f, "rowsBelow", b.h - bot, "bestShift", best[0], "diffAtBest", best[1], "rowsCompared", best[2], "shift0diff", res[0][1]);
}
