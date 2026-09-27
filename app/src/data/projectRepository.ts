/**
 * 프로젝트 저장소 경계 (DS-2A-05 SPEC 8.1 · 8.3). 인터페이스 파일은 타입·오류 클래스만 — 메모리 구현은 a1-β(`createStudioStore` 공유).
 * 편집 문서·스냅샷의 문서 모양은 L4 엔진 계약(PageDoc)이라 여기서는 제네릭 `TDoc`으로 둔다 — engine을 import하지 않는다
 * (`import type` 포함, engineImportGuard). 문서 쓰기는 모두 `expectedRevision`이 필수 인자다(If-Match).
 */

/** 저장 상태 문구(E-S06)·떠나기 경고 조건(E-S10)이 보는 저장 방식 */
export type ProjectPersistence = "memory" | "server";

/** SPEC 8.3 오류 코드 모음. `DOC_EXISTS`는 오류가 아니라 `startDoc` create의 결정적 결과(8.3.1) */
export type ProjectErrorCode =
  | "NOT_FOUND"
  | "SCHEMA_INVALID"
  | "STALE_PROJECT"
  | "STALE_DOC"
  | "DOC_EXISTS"
  | "GENERATOR_UNAVAILABLE"
  | "GATE_FAILED"
  | "JOB_TIMEOUT"
  | "INFRA"
  | "NETWORK";

/** 프로젝트 = 이름 + 프로필 계열 1개(1:1) + 편집 문서 1개 (2.1 · 8.1) */
export interface Project {
  readonly projectId: string;
  readonly name: string;
  /** 이름 바꾸기 경쟁용(J-S07 `STALE_PROJECT`) */
  readonly revision: number;
  readonly profileId: string;
  /** 기본 이름의 기준 레퍼런스(2.1) */
  readonly baseReferenceId: string;
  /** ISO 8601 */
  readonly createdAt: string;
  /** 이름·문서 저장·프로필 새 버전 중 최신 (ISO 8601) — 목록 정렬 기준 */
  readonly updatedAt: string;
}

/** 목록용 요약(8.1 "Project 요약") — J-S04 편집 상태 글자 */
export interface ProjectSummary extends Project {
  readonly latestProfileVersion: number;
  readonly hasDoc: boolean;
  /** 문서가 쓰는 프로필 버전(테마, Q3) — 문서 없으면 undefined */
  readonly docProfileVersion?: number;
  /** 문서를 만든 안(`"A" | "B" | "C"`) — 문서 없으면 undefined */
  readonly candidateId?: string;
  /** 문서 마지막 저장 (ISO 8601) — 문서 없으면 undefined */
  readonly docSavedAt?: string;
}

export type StartDocMode = "create" | "restart";
export type SnapshotKind = "manual" | "auto" | "published";
export type SnapshotReason = "export" | "restore" | "conflict" | "restart";
export type ConflictChoice = "mine" | "theirs";
export type ExportFormat = "react-zip" | "static-html";
export type ExportJobState = "queued" | "running" | "succeeded" | "failed";

/** 스냅샷(8.1) — 문서 사본은 불변 */
export interface ProjectSnapshot<TDoc> {
  readonly snapshotId: string;
  readonly projectId: string;
  readonly kind: SnapshotKind;
  /** auto만 */
  readonly reason?: SnapshotReason;
  readonly name: string;
  readonly createdAt: string;
  readonly doc: TDoc;
  readonly profileVersion: number;
  readonly candidateId: string;
  readonly hash: string;
}

export interface ExportJob {
  readonly jobId: string;
  readonly format: ExportFormat;
  readonly docRevision: number;
  readonly state: ExportJobState;
  readonly errorCode?: ProjectErrorCode;
  readonly retryable: boolean;
  readonly downloadRef?: string;
  readonly resultHash?: string;
}

/** `requestExport` 호출 결과(8.3.2 "결과 모양") — `ExportJob` 필드는 바꾸지 않는다 */
export interface ExportRequestResult {
  readonly job: ExportJob;
  readonly snapshotId: string;
  readonly snapshotName: string;
  /** 이번 호출이 스냅샷·잡을 썼는지(멱등 재생·재실행이면 false) */
  readonly wrote: boolean;
}

export interface ProjectRepository<TDoc = unknown> {
  readonly persistence: ProjectPersistence;
  /** GET /projects — 마지막 변경(`updatedAt`) 내림차순 (J-S04) */
  listProjects(): Promise<readonly ProjectSummary[]>;
  /** GET /projects/{id} — 없으면 undefined(E-S02, 예외 아님) */
  getProject(projectId: string): Promise<Project | undefined>;
  /** PATCH /projects/{id} (If-Match) — 앞뒤 공백 제거 · 1~40자 아니면 SCHEMA_INVALID · 불일치 STALE_PROJECT(최신 동봉) */
  renameProject(projectId: string, expectedRevision: number, name: string): Promise<Project>;
  /** GET /projects/{id}/page — 없으면 undefined(E-S03) */
  getDoc(projectId: string): Promise<TDoc | undefined>;
  /** PUT /projects/{id}/page — 판정: 모양 → 멱등 키(revision, hash) → NOT_FOUND → STALE_DOC(최신 동봉) → 저장 */
  saveDoc(projectId: string, expectedRevision: number, doc: TDoc): Promise<TDoc>;
  /** POST /projects/{id}/page — create = 원자적 create-if-absent(있으면 DOC_EXISTS) · restart = expectedRevision 필수 (8.3.1) */
  startDoc(projectId: string, profileVersion: number, candidateId: string, mode: StartDocMode, expectedRevision?: number): Promise<TDoc>;
  listSnapshots(projectId: string): Promise<readonly ProjectSnapshot<TDoc>[]>;
  createSnapshot(projectId: string, name?: string): Promise<ProjectSnapshot<TDoc>>;
  /** "복원 전" 자동 스냅샷 + 새 revision을 한 트랜잭션. 불일치 STALE_DOC */
  restoreSnapshot(projectId: string, snapshotId: string, expectedRevision: number): Promise<TDoc>;
  /** E-S09 두 선택 — 보존 스냅샷과 저장이 한 트랜잭션 */
  resolveConflict(projectId: string, choice: ConflictChoice, myDoc: TDoc): Promise<TDoc>;
  /** POST /projects/{id}/export — "내보내기 전" 스냅샷은 여기서만 만든다 (8.3.2) */
  requestExport(projectId: string, format: ExportFormat, docRevision: number): Promise<ExportRequestResult>;
  getExportJob(jobId: string): Promise<ExportJob | undefined>;
}

export class ProjectRepositoryError<TDoc = unknown> extends Error {
  readonly code: ProjectErrorCode;
  /** STALE_PROJECT일 때 최신 프로젝트 */
  readonly project?: Project;
  /** STALE_DOC·DOC_EXISTS일 때 최신(기존) 문서 */
  readonly doc?: TDoc;

  constructor(code: ProjectErrorCode, message: string, latest: { readonly project?: Project; readonly doc?: TDoc } = {}) {
    super(`${code}: ${message}`);
    this.name = "ProjectRepositoryError";
    this.code = code;
    if (latest.project) this.project = latest.project;
    if (latest.doc !== undefined) this.doc = latest.doc;
  }
}

/** 저장소 오류 코드 판별 — 다른 예외(청크 로드 실패 등)는 undefined */
export function projectErrorCode(error: unknown): ProjectErrorCode | undefined {
  return error instanceof ProjectRepositoryError ? error.code : undefined;
}
