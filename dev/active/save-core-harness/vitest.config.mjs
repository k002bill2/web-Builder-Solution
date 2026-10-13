// 저장 코어 하네스 전용 vitest 설정 — 제품 app/vite.config.ts 변경 0. 실행 명령 = README.
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const app = resolve(here, "../../../app");

export default {
  root: here,
  resolve: { alias: { vitest: resolve(app, "node_modules/vitest/dist/index.js") } },
  server: { fs: { allow: [resolve(here, "../../..")] } },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    sequence: { shuffle: false, seed: 1 },
    dangerouslyIgnoreUnhandledErrors: false,
  },
};
