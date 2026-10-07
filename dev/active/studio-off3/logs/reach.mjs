// usage: node reach.mjs <appDir> <outDir> — vite build API로 /tmp에 따로 빌드하면서 모듈 그래프·청크별 renderedLength를 덤프하고
// /studio 진입 closure 청크의 각 모듈이 진입 루트(main.tsx·StudioPage·auto 목록)에서 **정적 import만으로** 닿는지 판정한다.
import { writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
const [appDir, outDir] = process.argv.slice(2);
const { build } = await import(appDir + "/node_modules/vite/dist/node/index.js");
process.chdir(appDir);
const out = { chunks: {}, graph: {}, dyn: {} };
const rel = (x) => x.replace(appDir + "/", "");
await build({
  root: appDir, logLevel: "error",
  build: { outDir, emptyOutDir: true },
  plugins: [{ name: "dump", generateBundle(_o, bundle) {
    for (const [f, c] of Object.entries(bundle)) if (c.type === "chunk") out.chunks[f] = { gz: gzipSync(c.code).length / 1000, mods: Object.fromEntries(Object.entries(c.modules).map(([id, mi]) => [rel(id), mi.renderedLength])), exports: c.exports };
    for (const id of this.getModuleIds()) { const i = this.getModuleInfo(id); out.graph[rel(id)] = (i.importedIds ?? []).map(rel); out.dyn[rel(id)] = (i.dynamicallyImportedIds ?? []).map(rel); }
  } }],
});
writeFileSync(outDir + "/reach.json", JSON.stringify(out));
const roots = ["src/main.tsx", "src/pages/StudioPage.tsx", "src/fixtures/references.ts", "src/fixtures/referenceDetails.ts", "src/data/deferredStudio.ts", "src/data/memoryProjectRepository.ts", "src/components/studio/StudioLayout.tsx", "src/features/studio/gateCheck.ts"];
const reach = new Set(); const walk = (id) => { if (reach.has(id)) return; reach.add(id); for (const d of out.graph[id] ?? []) walk(d); }; roots.forEach(walk);
const m = JSON.parse((await import("node:fs")).readFileSync(outDir + "/.vite/manifest.json", "utf8"));
const closure = (keys, seen = new Set()) => { for (const k of keys) { if (seen.has(k) || !m[k]) continue; seen.add(k); closure(m[k].imports ?? [], seen); } return seen; };
const entryKeys = closure(roots.slice(2), closure(["index.html", "src/pages/StudioPage.tsx"]));
let total = 0; const bad = [];
for (const k of entryKeys) { const c = out.chunks[m[k].file]; total += c.gz; for (const [mod, len] of Object.entries(c.mods)) if (len > 0 && !reach.has(mod)) bad.push(`${m[k].file}\t${mod}\t${len}`); }
console.log("entry total", total.toFixed(2));
console.log("진입 청크 안 정적 미도달 모듈(renderedLength>0):", bad.length ? "\n" + bad.join("\n") : "0");
