import { build } from "/Users/younghwankang/orca/workspaces/web-builder-solution/er-off/app/node_modules/vite/dist/node/index.js";
import { writeFileSync } from "node:fs";
const [appDir, outDir] = process.argv.slice(2);
process.chdir(appDir);
const out = { chunks: {}, graph: {} };
await build({
  root: appDir, logLevel: "error",
  build: { outDir, emptyOutDir: true },
  plugins: [{ name: "dump", generateBundle(_o, bundle) {
    for (const [f, c] of Object.entries(bundle)) if (c.type === "chunk") out.chunks[f] = Object.fromEntries(Object.entries(c.modules).map(([id, mi]) => [id.replace(appDir + "/", ""), mi.renderedLength]));
    for (const id of this.getModuleIds()) { const i = this.getModuleInfo(id); out.graph[id.replace(appDir + "/", "")] = (i.importedIds ?? []).map((x) => x.replace(appDir + "/", "")); }
  } }],
});
writeFileSync(outDir + "/reach.json", JSON.stringify(out));
