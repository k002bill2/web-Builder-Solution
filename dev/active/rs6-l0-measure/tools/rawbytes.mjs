// RS6-L0 사본(rs5-spike/tools/rawbytes.mjs + preloadGuard 치환 1줄) · RS5 측정 전용(rs4-measure/tools/rawbytes.mjs 사본) — RS4 측정 전용 — app/scripts/check-bundle-size.mjs 를 그대로 읽어 sizeOf 만 "gzip bytes(정수)"로 바꾼 사본을 만들어 실행한다.
// 시나리오·분류·closure 계산은 원본(SCENARIOS · bundleBudget.mjs checkBundle)과 같다. 출력의 "KB" 표기는 이 사본에서는 bytes 다
// (예: "129900.00KB" = 129900 bytes). 예산·기준선 비교 문구는 단위가 섞여 의미 없음 — 수치 행만 본다.
// 선택: EXTRA_SCENARIOS(JSON 배열)로 측정 전용 시나리오를 덧붙인다(UNAPPROVED — 앱 SCENARIOS 수정 0).
// 사용: node dev/active/rs5-spike/tools/rawbytes.mjs  (cwd 무관 · app/dist 를 읽는다)
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";

const APP = fileURLToPath(new URL("../../../../app/", import.meta.url));
const src = readFileSync(join(APP, "scripts/check-bundle-size.mjs"), "utf8");
const abs = (p) => pathToFileURL(join(APP, p)).href;
const swaps = [
  ['from "./bundleBudget.mjs"', `from "${abs("scripts/bundleBudget.mjs")}"`],
  ['from "./preloadGuard.mjs"', `from "${abs("scripts/preloadGuard.mjs")}"`], // rs6-l0: base 2c1796a2 원본에 추가된 import
  ['from "./thumbsVersion.mjs"', `from "${abs("scripts/thumbsVersion.mjs")}"`],
  ['new URL("../dist/", import.meta.url)', `new URL("${abs("dist/")}")`],
  ["new URL(`../${BASELINE_FILE}`, import.meta.url)", `new URL(\`${abs("")}\${BASELINE_FILE}\`)`],
  ['new URL("../node_modules/.thumbs/out/", import.meta.url)', `new URL("${abs("node_modules/.thumbs/out/")}")`],
  [".length / 1000;", ".length;"],
  ["\n];\n\n// 앱 manifest", '\n  ...JSON.parse(process.env.EXTRA_SCENARIOS ?? "[]"),\n];\n\n// 앱 manifest'],
];
let out = src;
for (const [from, to] of swaps) {
  if (!out.includes(from)) throw new Error(`원본 구조가 바뀜 — 치환 대상 없음: ${from}`);
  out = out.replace(from, to);
}
const gen = fileURLToPath(new URL("./.rawbytes.gen.mjs", import.meta.url));
writeFileSync(gen, out);
try {
  await import(pathToFileURL(gen).href);
} finally {
  rmSync(gen, { force: true });
}
