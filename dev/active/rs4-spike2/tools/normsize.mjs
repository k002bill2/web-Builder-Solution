// 해시 정규화 gzip — 청크 파일명의 8자 해시를 지운 뒤 gzip bytes. 인자: closure 파일 목록(키) 경로. 출력: 파일별 + 합계
import { readdirSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
const dir = fileURLToPath(new URL("../../../../app/dist/assets/", import.meta.url));
const keys = readFileSync(process.argv[2], "utf8").trim().split("\n").map((l) => l.split(/\s+/)[0].replace("assets/", ""));
const files = readdirSync(dir);
let sum = 0;
for (const k of keys) {
  const f = files.find((x) => x.replace(/-[A-Za-z0-9_-]{8}\.js$/, ".js") === k);
  if (!f) { console.log(`${k}\tMISSING`); continue; }
  const n = gzipSync(readFileSync(dir + f, "utf8").replace(/-[A-Za-z0-9_-]{8}\.js/g, ".js")).length;
  sum += n; console.log(`${k}\t${n}`);
}
console.log(`SUM\t${sum}`);
