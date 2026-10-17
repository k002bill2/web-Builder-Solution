// M4-a-1 S5 — 30MB 근처 이미지 문서 zip 생성 시간·메모리 (Node 근사). 실행: node --expose-gc dev/active/m4a-zip-spike/patches/s5-bench.mjs <app 경로>
// 브라우저 경로 근사: 렌더 문서가 data URL로 직렬화한 마크업(base64) → 부모 splitImages와 같은 atob 디코드 → crc32 → zipParts → Blob
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const app = process.argv[2];
const { zipParts, crc32 } = await import(pathToFileURL(join(app, "src/features/studio/zip/storeZip.ts")).href);
const MB = 1024 * 1024;
const mem = () => { const m = process.memoryUsage(); return `rss ${(m.rss / MB).toFixed(0)}MB · heap ${(m.heapUsed / MB).toFixed(0)}MB · arrayBuffers ${(m.arrayBuffers / MB).toFixed(0)}MB`; };
const fromBase64 = (text) => { const b = atob(text); const out = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i); return out; };

for (const [count, each] of [[8, 3.75 * MB], [64, 0.46875 * MB], [1, 30 * MB]]) {
  globalThis.gc?.();
  const base = mem();
  const images = Array.from({ length: count }, () => new Uint8Array(randomBytes(Math.round(each))));
  // 마크업 = data URL(렌더 문서 직렬화 결과 모양)
  const markup = images.map((b) => `<img src="data:image/webp;base64,${Buffer.from(b).toString("base64")}">`).join("");
  const t0 = performance.now();
  const decoded = [...markup.matchAll(/base64,([^"]+)/g)].map((m) => fromBase64(m[1]));
  const t1 = performance.now();
  const entries = decoded.map((data) => ({ name: `assets/images/${crc32(data).toString(16).padStart(8, "0")}-${data.length.toString(36)}.webp`, data }));
  const t2 = performance.now();
  const fonts = ["KitSansKR-400", "KitSansKR-700"].map((n) => ({ name: `assets/fonts/${n}.woff2`, data: new Uint8Array(readFileSync(join(app, `src/assets/site-fonts/kit-sans-kr/${n}.woff2`))) }));
  const parts = zipParts([{ name: "index.html", data: new TextEncoder().encode("<!doctype html>".padEnd(60_000, " ")) }, ...entries, ...fonts]);
  const blob = new Blob(parts, { type: "application/zip" });
  const t3 = performance.now();
  const peak = mem();
  const dir = mkdtempSync(join(tmpdir(), "m4a-s5-"));
  const file = join(dir, "site.zip");
  writeFileSync(file, Buffer.from(await blob.arrayBuffer()));
  const ok = execFileSync("unzip", ["-t", file]).toString().includes("No errors detected");
  rmSync(dir, { recursive: true, force: true });
  console.log(`[S5] 이미지 ${count}장 × ${(each / MB).toFixed(2)}MB = ${((count * each) / MB).toFixed(1)}MB · markup ${(markup.length / 1e6).toFixed(1)}M자 · zip ${(blob.size / MB).toFixed(2)}MB`);
  console.log(`     base64 디코드 ${(t1 - t0).toFixed(0)}ms · crc32+이름 ${(t2 - t1).toFixed(0)}ms · zipParts+Blob ${(t3 - t2).toFixed(0)}ms · 합 ${(t3 - t0).toFixed(0)}ms · unzip -t ${ok ? "OK" : "FAIL"}`);
  console.log(`     메모리 시작 ${base} → 직후 ${peak}`);
}
