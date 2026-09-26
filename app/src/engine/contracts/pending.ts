/**
 * L4b 이후에 구현할 연산의 자리(타입만). 이번 L4a에서는 구현하지 않는다(브리프 3절).
 */
import type { PurposeId } from "../../domain/reference";
import type { ProfileVersion } from "../../domain/profile";
import type { SectionPlanEntry } from "../../domain/compareBoard";
import type { PageDoc } from "./pageDoc";
import type { GateReport } from "./records";

/** 게이트가 읽는 테마 = 문서가 가리키는 프로필 버전(적용 값은 effectiveProfile — L4b에서 확정) */
export interface GateTheme {
  readonly profile: ProfileVersion;
  readonly purpose: PurposeId | "none";
}

/** 2a-04c 편집 시작 경계 — 구조안 → 새 문서(기본 슬롯 콘텐츠) */
export type CreateDocFromCandidate = (
  plan: { readonly candidateId: string; readonly sections: readonly SectionPlanEntry[] },
  profileVersion: number,
) => PageDoc;

/** 품질 게이트 R-01~R-13 (SPEC 5.12) */
export type RunGate = (doc: PageDoc, theme: GateTheme) => GateReport;
