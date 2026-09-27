/**
 * 구조안 → 새 문서 `createDocFromCandidate` (SPEC 8.2 · 8.3.1 — 2a-04c 편집 시작 경계). 순수·결정적.
 * - 섹션 = 구조안 순서 그대로, instanceId = `유형-순번`(header-1, services-2 …), 슬롯 = 기본 슬롯 콘텐츠(sections/defaults),
 *   모션 = min(구조안 motion ?? L1, 정의 상한)(Q-18 A · r4.2 — 구조안 motion은 선택, 없으면 L1), 톤 = normalizeDoc(R-05), 메타 빈 값, revision 1, hash = hashDoc.
 * - 거부(EngineOpError): 모르는 type/variant → UNKNOWN_VARIANT(먼저) · R-01·R-02 위반 → BAD_VALUE(게이트와 같은 structureIssues,
 *   첫 원인 문장) · 프로필 버전·id·시각 모양 → BAD_VALUE(저장 경계와 같은 validatePageDoc).
 * - projectId·updatedAt은 저장소 값이라 세 번째 인자로 받는다 · libraryVersion·generatorVersion은 구조안의 것(Q-17).
 */
import type { SectionPlanEntry } from "../../domain/compareBoard";
import type { PageDoc, SectionInstance, SectionMotion } from "../contracts/pageDoc";
import type { SectionDefinition } from "../contracts/sectionDefinition";
import { structureIssues } from "../gate/requiredSections";
import { EngineOpError } from "../ops/errors";
import { hashDoc } from "../ops/hash";
import { normalizeDoc } from "../ops/normalize";
import { minMotion } from "../ops/sectionOps";
import { defaultSlots } from "../sections/defaults";
import { getSectionDefinition, isSectionType } from "../sections/registry";
import { validatePageDoc } from "../validate/validatePageDoc";

/** 구조안 섹션 — 컴포저 motion은 선택(Q-18 A · r4.2). 없으면 L1 */
export interface CandidatePlanSection extends SectionPlanEntry {
  readonly motion?: SectionMotion;
}

/** 2a-04c 구조안 — 섹션 목록 + 그것을 만든 라이브러리·생성기 버전(SPEC 8.1 "만든 구조안의 것") */
export interface CandidatePlan {
  readonly candidateId: string;
  readonly sections: readonly CandidatePlanSection[];
  readonly libraryVersion: string;
  readonly generatorVersion: string;
}

/** 저장소가 정하는 값(8.3.1 startDoc) — 엔진은 만들지 않는다(결정성) */
export interface DocStart {
  readonly projectId: string;
  readonly updatedAt: string;
}

function definitionOf(entry: SectionPlanEntry): SectionDefinition {
  const def = isSectionType(entry.type) ? getSectionDefinition(entry.type, entry.variant) : undefined;
  if (!def) throw new EngineOpError("UNKNOWN_VARIANT", `변형 없음: ${String(entry.type)}/${String(entry.variant)}`);
  return def;
}

function instanceOf(def: SectionDefinition, nth: number, motion: SectionMotion = "L1"): SectionInstance {
  return {
    instanceId: `${def.type}-${nth}`,
    type: def.type,
    variant: def.variant,
    motion: minMotion(motion, def.constraints.maxMotion),
    tone: "base",
    slots: defaultSlots(def),
  };
}

export function createDocFromCandidate(plan: CandidatePlan, profileVersion: number, start: DocStart): PageDoc {
  if (!Number.isSafeInteger(profileVersion) || profileVersion < 1) {
    throw new EngineOpError("BAD_VALUE", `프로필 버전은 1 이상의 정수: ${profileVersion}`);
  }
  const defs = plan.sections.map(definitionOf);
  const broken = structureIssues(defs)[0];
  if (broken) throw new EngineOpError("BAD_VALUE", broken.cause);
  const sections = defs.map((def, i) => instanceOf(def, defs.slice(0, i + 1).filter((d) => d.type === def.type).length, plan.sections[i]!.motion));
  const draft = normalizeDoc({
    projectId: start.projectId,
    revision: 1,
    hash: "",
    profileVersion,
    candidateId: plan.candidateId,
    libraryVersion: plan.libraryVersion,
    generatorVersion: plan.generatorVersion,
    meta: { title: "", description: "" },
    sections,
    updatedAt: start.updatedAt,
  });
  const checked = validatePageDoc({ ...draft, hash: hashDoc(draft) });
  if (!checked.ok) {
    throw new EngineOpError("BAD_VALUE", `문서 모양이 맞지 않습니다: ${checked.issues.map((i) => `${i.path} ${i.message}`).join(" · ")}`);
  }
  return checked.value;
}
