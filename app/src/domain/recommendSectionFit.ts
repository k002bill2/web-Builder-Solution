/**
 * 추천 `sections` 항목 파생 표(RECO-SPEC 2.2 · RQ-06 A) — 레퍼런스 id → 충족 목적(booking·inquiry, 이 순서).
 * 엔진 `requiredSectionIssues`의 R-04·R-03 판정을 상세 섹션에 돌린 결과다. 런타임 엔진 import 0 · 픽스처 import 0(데이터만).
 * 상세 섹션이 바뀌면 `recommendSectionFit.test.ts` 가드가 실패한다 → 같은 커밋에서 이 표를 갱신한다.
 */
import type { RecoSectionFit, SectionFitPurpose } from "./recommend";

const BOTH: readonly SectionFitPurpose[] = Object.freeze(["booking", "inquiry"]);
const INQUIRY: readonly SectionFitPurpose[] = Object.freeze(["inquiry"]);

export const RECO_SECTION_FIT: RecoSectionFit = Object.freeze({
  "ref-a": INQUIRY,
  "ref-b": INQUIRY,
  "ref-c": INQUIRY,
  "ref-d": INQUIRY,
  "ref-e": INQUIRY,
  "ref-f": INQUIRY,
  "gen-beauty-1": BOTH,
  "gen-beauty-2": INQUIRY,
  "gen-beauty-3": BOTH,
  "gen-cafe-fnb-1": INQUIRY,
  "gen-cafe-fnb-2": BOTH,
  "gen-education-1": INQUIRY,
  "gen-education-2": BOTH,
  "gen-education-3": INQUIRY,
  "gen-education-4": BOTH,
  "gen-medical-1": BOTH,
  "gen-medical-2": INQUIRY,
  "gen-medical-3": BOTH,
  "gen-professional-1": INQUIRY,
  "gen-professional-2": INQUIRY,
  "gen-professional-3": INQUIRY,
});
