/**
 * 3안 계산 본문 (DS-2A-04 SPEC 4.1) — "3안 만들기"·"다시 시도" 조작 뒤에만 받는 청크(writeBodyLoader loadGenerate).
 * 저장된 버전의 적용된 값(base + 조정) + 목적·대비 조정으로 composeCandidates를 부른다. 라이브러리는 프로필에 고정된 `library_version`의 것 —
 * 없으면 세 안 모두 결정적 실패(UNSUPPORTED_COMBINATION, 재시도 없음).
 * 결과 모양(A·B·C 3개, 순서) 검증도 여기서 — 어긋나면 SCHEMA_INVALID로 거부해 잡을 만들지 않는다(조회마다 한 안씩 공개하는 잡이
 * "만드는 중"에 고착되지 않게). 조작 뒤 청크에 두어 진입 자동 경로 바이트 0.
 */
import { composeCandidates } from "../domain/composeCandidates";
import { effectiveProfile } from "../domain/effectiveProfile";
import { CANDIDATE_IDS, GENERATOR_VERSION, type ComposedResult } from "../domain/generation";
import type { ProfileVersion } from "../domain/profile";
import { SECTION_LIBRARY, type SectionLibrary } from "../domain/sectionLibrary";
import { GenerationError } from "./generationRepository";

const DEFAULT_LIBRARIES: Readonly<Record<string, SectionLibrary>> = Object.freeze({ [SECTION_LIBRARY.version]: SECTION_LIBRARY });

export function composeFor(record: ProfileVersion, libraries: Readonly<Record<string, SectionLibrary>> = DEFAULT_LIBRARIES): readonly ComposedResult[] {
  const profile = effectiveProfile(record.base, record.adjustments);
  const results = composeCandidates({
    profile,
    purpose: record.adjustments.purpose ?? "none",
    contrast: record.adjustments.contrast ?? "aa",
    library: libraries[profile.library_version],
    generatorVersion: GENERATOR_VERSION,
  });
  if (results.length !== CANDIDATE_IDS.length || results.some((r, i) => r.id !== CANDIDATE_IDS[i])) {
    throw new GenerationError("SCHEMA_INVALID", "생성기 결과 모양이 맞지 않습니다(A·B·C 3개)");
  }
  return results;
}
