// /studio 진입 직후 모듈별 기여 추정 (m2a-3a e0-attr 방식: 청크 gzip × 모듈 생성 바이트 비율).
// 사용: (app에서) npx vite build --sourcemap --outDir /tmp/ss-sm && node ../dev/active/studio-slim/attr.mjs /tmp/ss-sm <page> <auto...>
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { decode } from "../../../app/node_modules/@jridgewell/sourcemap-codec/dist/sourcemap-codec.mjs";

const [dist, page, ...auto] = process.argv.slice(2);
const manifest = JSON.parse(readFileSync(join(dist, ".vite/manifest.json"), "utf8"));
const closure = (key, seen) => {
  const c = manifest[key];
  if (!c || seen.has(c.file)) return seen;
  seen.add(c.file);
  for (const d of c.imports ?? []) closure(d, seen);
  return seen;
};
const common = closure("index.html", new Set());
const first = closure(page, new Set(common));
const eager = auto.reduce((s, k) => closure(k, s), new Set(first));
const extra = [...eager].filter((f) => !first.has(f));
const gz = (f) => gzipSync(readFileSync(join(dist, f))).length / 1000;
let total = 0;
for (const file of extra) {
  const code = readFileSync(join(dist, file), "utf8");
  const map = JSON.parse(readFileSync(join(dist, file + ".map"), "utf8"));
  const lines = code.split("\n");
  const bytes = new Map();
  decode(map.mappings).forEach((segs, li) => {
    const len = (lines[li] ?? "").length;
    segs.forEach((s, i) => {
      const end = i + 1 < segs.length ? segs[i + 1][0] : len;
      const src = s.length > 1 ? map.sources[s[1]].replace(/^(\.\.\/)+/, "") : "(none)";
      bytes.set(src, (bytes.get(src) ?? 0) + (end - s[0]));
    });
  });
  const chunkGz = gz(file);
  total += chunkGz;
  const sum = [...bytes.values()].reduce((a, b) => a + b, 0);
  console.log(`== ${file} raw ${code.length} gz ${chunkGz.toFixed(2)}`);
  for (const [src, b] of [...bytes].sort((a, b) => b[1] - a[1])) console.log(`  ${((chunkGz * b) / sum).toFixed(2)} ${src}`);
}
console.log(`== 진입 직후 - 첫 화면 = ${total.toFixed(2)} (첫 화면 ${[...first].reduce((a, f) => a + gz(f), 0).toFixed(2)} · 진입 ${[...eager].reduce((a, f) => a + gz(f), 0).toFixed(2)})`);
