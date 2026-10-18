import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
const dist = process.argv[2];
const m = JSON.parse(readFileSync(dist + "/.vite/manifest.json", "utf8"));
for (const [k, v] of Object.entries(m)) {
  if (!/reactZip|staticHtml\/staticHtml\.ts/.test(k)) continue;
  const buf = readFileSync(dist + "/" + v.file);
  console.log(k, v.file, "raw", (buf.length / 1000).toFixed(2), "KB gzip", (gzipSync(buf).length / 1000).toFixed(2), "KB", "imports", (v.imports ?? []).join(","), "hasKitCss", buf.includes("kit-services-inner"), "hasData-site-root", buf.includes("data-site-root"));
}
