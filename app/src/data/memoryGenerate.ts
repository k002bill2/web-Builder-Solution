/**
 * 3안 계산 본문 (DS-2A-04 SPEC 4.1) — "3안 만들기"·"다시 시도" 조작 뒤에만 받는 청크(writeBodyLoader loadGenerate).
 * 저장된 버전의 적용된 값(base + 조정) + 목적·대비 조정으로 composeCandidates를 부른다. 라이브러리는 프로필에 고정된 `library_version`의 것 —
 * 없으면 세 안 모두 결정적 실패(UNSUPPORTED_COMBINATION, 재시도 없음).
 */
import { composeCandidates } from "../domain/composeCandidates";
import { effectiveProfile } from "../domain/effectiveProfile";
import { GENERATOR_VERSION, type ComposedResult } from "../domain/generation";
import type { ProfileVersion } from "../domain/profile";
import { SECTION_LIBRARY, type SectionLibrary } from "../domain/sectionLibrary";

const DEFAULT_LIBRARIES: Readonly<Record<string, SectionLibrary>> = Object.freeze({ [SECTION_LIBRARY.version]: SECTION_LIBRARY });

export function composeFor(record: ProfileVersion, libraries: Readonly<Record<string, SectionLibrary>> = DEFAULT_LIBRARIES): readonly ComposedResult[] {
  const profile = effectiveProfile(record.base, record.adjustments);
  return composeCandidates({
    profile,
    purpose: record.adjustments.purpose ?? "none",
    contrast: record.adjustments.contrast ?? "aa",
    library: libraries[profile.library_version],
    generatorVersion: GENERATOR_VERSION,
  });
}
