// dist/assets 각 파일 gzip bytes(정수) — 이름 해시 제거 키로 출력
import { readdirSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
const dir = fileURLToPath(new URL("../../../../app/dist/assets/", import.meta.url));
for (const f of readdirSync(dir).filter((f) => f.endsWith(".js")).sort()) {
  const key = f.replace(/-[A-Za-z0-9_-]{8}\.js$/, ".js");
  console.log(`${key}\t${gzipSync(readFileSync(dir + f)).length}`);
}
