/**
 * 스냅샷 · 게이트 결과 · 내보내기 잡 모양 (SPEC 8.1 · TRD 4.5). 판정·저장 로직은 L4b 이후.
 */
import type { PageDoc } from "./pageDoc";

export type SnapshotAutoReason = "export" | "restore" | "conflict" | "restart";

interface SnapshotBase {
  readonly snapshotId: string;
  readonly projectId: string;
  readonly name: string;
  readonly createdAt: string;
  /** 그때 문서 전체의 불변 사본 */
  readonly doc: PageDoc;
  readonly profileVersion: number;
  readonly candidateId: string;
  readonly hash: string;
}

/** TRD 4.5 kind — reason은 auto만 */
export type Snapshot =
  | (SnapshotBase & { readonly kind: "manual" })
  | (SnapshotBase & { readonly kind: "auto"; readonly reason: SnapshotAutoReason })
  | (SnapshotBase & { readonly kind: "published" });

/** 게이트 줄 — 순서 고정(SPEC 5.12) */
export const GATE_ROWS = [
  "contrast",
  "alt-text",
  "heading-order",
  "required-sections",
  "motion-budget",
  "seo-meta",
  "text-length",
  "performance",
] as const;
export type GateRowId = (typeof GATE_ROWS)[number];

/** 통과 · 경고 · 차단 · 측정 전 */
export type GateState = "pass" | "warn" | "block" | "unmeasured";

export type GateRuleId = "R-01" | "R-02" | "R-03" | "R-04" | "R-07" | "R-08" | "R-09" | "R-10" | "R-11" | "R-12" | "R-13" | "FR-EDT-05";

export interface GateIssue {
  readonly ruleId: GateRuleId;
  readonly instanceId?: string;
  readonly slotKey?: string;
  /** 원인 문장 */
  readonly cause: string;
  /** 대체안 문장 */
  readonly alternative: string;
}

export interface GateRow {
  readonly id: GateRowId;
  readonly state: GateState;
  readonly issues: readonly GateIssue[];
}

/** 순수 함수 결과, 저장 안 함. rows는 GATE_ROWS 순서 8줄 */
export interface GateReport {
  readonly docHash: string;
  readonly docRevision: number;
  readonly rows: readonly GateRow[];
}

export type ExportFormat = "react-zip" | "static-html";
export type ExportJobState = "queued" | "running" | "done" | "failed";
export type ExportErrorCode = "GENERATOR_UNAVAILABLE" | "GATE_FAILED" | "JOB_TIMEOUT" | "INFRA";

export interface ExportJob {
  readonly jobId: string;
  readonly format: ExportFormat;
  readonly docRevision: number;
  readonly state: ExportJobState;
  readonly errorCode?: ExportErrorCode;
  readonly retryable: boolean;
  /** 완료 시 — 내려받기 참조(URL 문자열이 아니라 저장소 키) */
  readonly downloadRef?: string;
  readonly resultHash?: string;
}
