// internal 조합 생성기 실행 (SPEC m3p 2.4) — 빌드 전에 한 번 돌려 결과를 src/fixtures/generatedReferences.ts로 커밋한다.
// 출력 = src/fixtures/generatedReferences.ts(카드) · generatedReferenceDetails.ts(상세·비교). 앱 소스(TS)는 기존 의존성 vite의 SSR 모듈 로더로 읽는다(새 의존성 0). 외부 접속 0 — 저장소 안 표만 읽는다.
// 사용: (app/) node scripts/generate-internal-refs.mjs        · --check = 파일과 다르면 exit 1 (쓰기 0)
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const fixtureDir = fileURLToPath(new URL("../src/fixtures/", import.meta.url));
const server = await createServer({ root, configFile: false, logLevel: "error", appType: "custom", server: { middlewareMode: true, hmr: false, ws: false } });
try {
  const load = (path) => server.ssrLoadModule(path);
  const [{ generateInternalFixture }, { createDocFromCandidate }, { RENDERED_VARIANTS }] = await Promise.all([
    load("/src/domain/internalComposeRun.ts"),
    load("/src/engine/doc/createDocFromCandidate.ts"),
    load("/src/features/studio/renderedVariants.ts"),
  ]);
  const { files, output } = generateInternalFixture({ createDoc: createDocFromCandidate, renderedVariants: RENDERED_VARIANTS });
  for (const line of output.report) console.log(`[generate] ${line}`);
  console.log(`[generate] 생성 ${output.references.length}개`);
  for (const [name, text] of Object.entries(files)) {
    const target = join(fixtureDir, name);
    if (!process.argv.includes("--check")) {
      writeFileSync(target, text);
      console.log(`[generate] 썼음 ${target}`);
    } else if (readFileSync(target, "utf8") !== text) {
      console.error(`[generate] 커밋된 ${name}가 생성기 재실행 결과와 다릅니다`);
      process.exitCode = 1;
    }
  }
} finally {
  await server.close();
}
