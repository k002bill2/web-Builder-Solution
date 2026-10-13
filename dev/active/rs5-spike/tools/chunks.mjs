// dist/assets JS 청크별 gzip bytes(Node zlib 기본 레벨 — check-bundle-size sizeOf와 같은 방식). 사용: node chunks.mjs <app/dist>
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
const dir = join(process.argv[2], "assets");
for (const f of readdirSync(dir).filter((n) => n.endsWith(".js")).sort()) console.log(`${gzipSync(readFileSync(join(dir, f))).length}\t${f.replace(/-[A-Za-z0-9_-]{8}\.js$/, ".js")}\t${f}`);
