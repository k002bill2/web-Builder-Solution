/**
 * 편집기 엔진 공유 청크(STUDIO-OFF3 A1) — vite.config.ts(앱 빌드)와 가드 테스트만 import한다(앱 코드 import 금지).
 * 기본 분할은 아래 모듈을 `issue`(섹션·연산 규칙·게이트 문구)와 `runGate`(게이트 판정) 두 공유 청크로 나눈다. 두 청크를 받는 경로는
 * /studio 진입(StudioLayout·gateCheck 자동)과 /profile 조작 뒤(startDocWrite)뿐이고 둘 다 이미 두 청크를 함께 받으므로, 한 청크로 합쳐
 * 청크 경계의 gzip 손실만 없앤다(/studio 진입 −0.48, 다른 라우트 증가 0 — dev/active/studio-off3/AUDIT.md).
 * 목록 밖 의존(대비 판정·프로필 등 다른 화면 공유 모듈)은 끌어오지 않는다(includeDependenciesRecursively: false — 끌어오면 공통 청크가 갈라져 모든 라우트 +9.6).
 * `features/studio/gateCheck.ts`는 넣지 않는다 — 번들 검사 manifest 키(facade 청크)로 남아야 한다.
 */
export const STUDIO_ENGINE_CHUNK_MODULES = [
  // issue
  "src/engine/contracts/pageDoc.ts",
  "src/engine/freeze.ts",
  "src/engine/sections/slots.ts",
  "src/engine/sections/bodySections.ts",
  "src/engine/sections/boundSections.ts",
  "src/engine/sections/registry.ts",
  "src/engine/ops/errors.ts",
  "src/engine/ops/reasons.ts",
  "src/engine/ops/rules.ts",
  "src/engine/ops/slotOps.ts",
  "src/engine/ops/hash.ts",
  "src/engine/gate/gateText.ts",
  "src/engine/gate/issue.ts",
  "src/features/studio/renderedVariants.ts",
  // runGate
  "src/engine/contracts/records.ts",
  "src/engine/gate/requiredSections.ts",
  "src/engine/gate/contrastRow.ts",
  "src/engine/gate/docRows.ts",
  "src/engine/gate/slotRows.ts",
  "src/engine/gate/runGate.ts",
] as const;

/** codeSplitting 그룹 test — 모듈 절대 경로가 목록 경로로 끝나면(경로 구분자 경계) 그룹에 넣는다 */
export function studioEngineChunk(id: string): boolean {
  return STUDIO_ENGINE_CHUNK_MODULES.some((path) => id.endsWith(`/app/${path}`) || id === path);
}
