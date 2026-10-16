// save-core-qa 브라우저 프로브 전용 — 플러그인 0 · 전용 loopback origin 127.0.0.1:4367 · 제품 설정 변경 0
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
export default {
  root: here,
  cacheDir: "/tmp/save-core-qa-vite",
  server: { host: "127.0.0.1", port: 4367, strictPort: true, fs: { allow: [resolve(here, "../../../..")] } },
  optimizeDeps: { noDiscovery: true, include: [] },
};
