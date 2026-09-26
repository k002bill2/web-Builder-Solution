/**
 * R-05 자동 보정 (SPEC 8.2 `normalizeDoc`, TRD 7 "인접 섹션 배경 톤 동일 금지") — 연산 뒤 공통.
 * 앞 섹션과 톤이 같은 자리만 뒤집는다(결정적·멱등). 바꿀 것이 없으면 입력을 그대로 돌려준다.
 * "풀블리드 연속 ≤2"는 보정 방식이 정해지지 않아 하지 않는다(REPORT 설계 질문 Q-1).
 */
import type { PageDoc, SectionInstance, SectionTone } from "../contracts/pageDoc";

const flip = (tone: SectionTone): SectionTone => (tone === "base" ? "alt" : "base");

export function normalizeDoc(doc: PageDoc): PageDoc {
  const sections = doc.sections.reduce<readonly SectionInstance[]>((acc, section) => {
    const prev = acc.at(-1);
    return [...acc, prev && prev.tone === section.tone ? { ...section, tone: flip(section.tone) } : section];
  }, []);
  return sections.every((s, i) => s === doc.sections[i]) ? doc : { ...doc, sections };
}
