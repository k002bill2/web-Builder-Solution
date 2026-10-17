/**
 * 함께 받는 작은 공유 모듈 청크 합침(RS6-L4 M2c·M2d 상쇄 — REPORT-MEASURE 3절 A표) — vite.config.ts(앱 빌드)와 가드 테스트만 import한다(앱 코드 import 금지).
 * 기본 분할은 아래 짝을 각각 따로 작은 공유 청크로 나눈다. 짝은 늘 같은 경로가 함께 받으므로 한 청크로 합쳐 청크 경계의 gzip 손실만 없앤다(동작 변화 0).
 * - projectRepository: /studio 진입 −0.05 · /projects 첫 화면 −0.09(L5 레인 라우트 — 머지 때 Jarvis 조율)
 * - profileContrast: /studio 진입 −0.14 · /profile 자동 −0.17 · 판정 밖 /compare 조작 뒤 memoryProfileAdjust +0.66
 * 목록 밖 의존은 끌어오지 않는다(includeDependenciesRecursively: false — 선례 studioEngineChunk.ts).
 */
export const SHARED_DATA_CHUNKS = [
  { name: "projectRepository", modules: ["src/data/projectRepository.ts", "src/features/projects/useProjectRepository.ts"] },
  { name: "profileContrast", modules: ["src/domain/profileContrast.ts", "src/domain/effectiveProfile.ts"] },
] as const;

/** codeSplitting 그룹 — 모듈 절대 경로가 목록 경로로 끝나면(경로 구분자 경계) 그 그룹에 넣는다 */
export function sharedDataChunkGroups() {
  return SHARED_DATA_CHUNKS.map(({ name, modules }) => ({
    name,
    test: (id: string) => modules.some((path) => id.endsWith(`/app/${path}`) || id === path),
    includeDependenciesRecursively: false,
  }));
}
