// BUNDLE-01 — 청크의 모듈별 기여를 소스맵으로 귀속한다 (Node 내장만 사용, 새 의존성 없음).
// 사용: node attribute.mjs <dist 디렉터리> <청크 파일(assets/…js)> [상위 N=20] [--json]
//   빌드는 `npx vite build --sourcemap hidden --outDir <dir>` — hidden은 JS 바이트를 바꾸지 않는다(cmp로 확인).
// 출력 열
//   raw    : 해당 모듈로 매핑된 생성 코드 바이트(UTF-8)
//   prop   : 청크 gzip × raw 비율 (비례 배분 — 합계가 청크 gzip과 같다)
//   marg   : gzip(청크) − gzip(청크에서 그 모듈 구간만 뺀 것) (한계 기여 — 그 모듈만 빠질 때 실제 줄어드는 양의 근사)
//   (unmapped): 소스가 없는 구간 = rolldown 런타임·청크 래퍼·import/export 문·모듈 사이 구분자
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const [dist, chunk, topArg, ...flags] = process.argv.slice(2);
const top = Number(topArg ?? 20);
const code = readFileSync(join(dist, chunk), "utf8");
const map = JSON.parse(readFileSync(join(dist, `${chunk}.map`), "utf8"));

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function decodeVlq(str) {
  const out = [];
  let value = 0, shift = 0;
  for (const ch of str) {
    const digit = B64.indexOf(ch);
    value += (digit & 31) << shift;
    if (digit & 32) shift += 5;
    else { out.push(value & 1 ? -(value >>> 1) : value >>> 1); value = 0; shift = 0; }
  }
  return out;
}

// 생성 코드의 각 줄을 [시작 열, 소스 인덱스|-1] 구간으로 나눈다
const lines = code.split("\n");
const owner = lines.map(() => []);
let src = 0;
map.mappings.split(";").forEach((line, li) => {
  let col = 0;
  for (const seg of line.split(",")) {
    if (!seg) continue;
    const f = decodeVlq(seg);
    col += f[0];
    // 원본 줄·열(f[2], f[3])은 귀속에 필요 없다. 소스 인덱스만 누적한다
    if (f.length >= 4) { src += f[1]; owner[li].push([col, src]); } else owner[li].push([col, -1]);
  }
});

const pieces = new Map(); // key → string[]
const add = (key, text) => { if (!text) return; (pieces.get(key) ?? pieces.set(key, []).get(key)).push(text); };
const name = (i) => (i < 0 ? "(unmapped)" : map.sources[i].replace(/^.*node_modules\//, "npm:").replace(/^.*?\/app\/src\//, "src/"));
lines.forEach((text, li) => {
  const segs = owner[li];
  if (segs.length === 0 || segs[0][0] > 0) add("(unmapped)", text.slice(0, segs[0]?.[0] ?? text.length));
  segs.forEach(([col, s], k) => add(name(s), text.slice(col, segs[k + 1]?.[0] ?? text.length)));
  if (li < lines.length - 1) add("(unmapped)", "\n");
});

const gz = (s) => gzipSync(Buffer.from(s)).length;
const totalGz = gz(code);
const totalRaw = Buffer.byteLength(code);
const rows = [...pieces].map(([key, parts]) => {
  const raw = parts.reduce((n, p) => n + Buffer.byteLength(p), 0);
  // 한계 기여: 그 모듈의 구간만 비운 청크를 다시 압축한다 (같은 문자열 조각이 다른 모듈에 있어도 위치 기준으로 뺀다)
  let rebuilt = "";
  lines.forEach((text, li) => {
    const segs = owner[li];
    if (segs.length === 0 || segs[0][0] > 0) { if (key !== "(unmapped)") rebuilt += text.slice(0, segs[0]?.[0] ?? text.length); }
    segs.forEach(([col, s], k) => { if (name(s) !== key) rebuilt += text.slice(col, segs[k + 1]?.[0] ?? text.length); });
    if (li < lines.length - 1 && key !== "(unmapped)") rebuilt += "\n";
  });
  return { module: key, raw, prop: (totalGz * raw) / totalRaw, marg: totalGz - gz(rebuilt) };
}).sort((a, b) => b.prop - a.prop);

if (flags.includes("--json")) { console.log(JSON.stringify({ chunk, totalRaw, totalGz, rows }, null, 1)); process.exit(0); }
const kb = (n) => (n / 1000).toFixed(2);
console.log(`# ${chunk}  raw ${kb(totalRaw)}KB · gzip ${kb(totalGz)}KB · 모듈 ${rows.length - 1}개 (+unmapped)`);
console.log(`| # | 모듈 | raw KB | gzip 비례 KB | gzip 한계 KB |\n|---|---|---|---|---|`);
rows.slice(0, top).forEach((r, i) => console.log(`| ${i + 1} | \`${r.module}\` | ${kb(r.raw)} | ${kb(r.prop)} | ${kb(r.marg)} |`));
const rest = rows.slice(top);
if (rest.length) console.log(`| — | 나머지 ${rest.length}개 | ${kb(rest.reduce((n, r) => n + r.raw, 0))} | ${kb(rest.reduce((n, r) => n + r.prop, 0))} | — |`);
