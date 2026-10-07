// usage: node chunkdiff.mjs <distA> <distB> — manifest 키별 청크 gzip 비교(바뀐 것만)
import { readFileSync } from "node:fs"; import { gzipSync } from "node:zlib";
const [A, B] = process.argv.slice(2);
const load = (d) => JSON.parse(readFileSync(d + "/.vite/manifest.json", "utf8"));
const ma = load(A), mb = load(B); const gz = (d, f) => gzipSync(readFileSync(d + "/" + f)).length / 1000;
const norm = (k) => k.replace(/-[\w-]{8}\.js$/, ".js");
const na = Object.fromEntries(Object.entries(ma).filter(([, v]) => v.file.endsWith(".js")).map(([k, v]) => [norm(k), gz(A, v.file)]));
const nb = Object.fromEntries(Object.entries(mb).filter(([, v]) => v.file.endsWith(".js")).map(([k, v]) => [norm(k), gz(B, v.file)]));
for (const k of new Set([...Object.keys(na), ...Object.keys(nb)])) { const a = na[k], b = nb[k]; if (a === undefined || b === undefined || Math.abs(a - b) >= 0.005) console.log(k.padEnd(60), a?.toFixed(2) ?? "-", "→", b?.toFixed(2) ?? "-", a !== undefined && b !== undefined ? (b - a).toFixed(2) : ""); }
