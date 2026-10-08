/**
 * 가져오기 검증 (P2-SPEC 3.2 · 3.3 — Jarvis 채택 결정 2 우선). 앞 단계 실패 = 뒤 단계 0 · 전부 트랜잭션 전 · 쓰기 0.
 * ① 크기(읽기 전) → ② 파싱 → ③ 봉투(미래 버전은 다른 필드보다 먼저) → ④ 레코드 모양(원래 id로 checkSaveDoc · 열기 checkState 규칙).
 * → ⑤ 이미지(checkImages — 디코드·재인코딩). ⑥ 참조 판정은 생략(L1 택1 — 참조 밖 이미지는 다음 flush의 imageOps가 지운다 · recordRefs는 복원 closure).
 * 실패 = { code, message }(IM-1~IM-6)만 — 부분 결과를 내지 않는다.
 */
import type { DocRecord } from "../../data/persistence/entryRead";
import type { Project } from "../../data/projectRepository";
import { checkSaveDoc } from "../../data/startDocWrite";
import type { ProfileVersion } from "../../domain/profile";
import { validateProjectName } from "../../domain/projectName";
import type { IngestDeps } from "../studio/images/ingest/deps";
import { checkImages, type CheckedImage } from "./checkImages";
import { profileVersionShapeOk } from "./profileShape";
import { FILE_FORMAT, FORMAT_VERSION, MAX_FILE_BYTES, SCHEMA, failure, type CheckFailure, type ImportCode } from "./format";

export interface CheckedFile {
  readonly exportedAt: string;
  readonly project: Project;
  readonly series: readonly ProfileVersion[];
  readonly doc: DocRecord | null;
  readonly images: readonly CheckedImage[];
  /** 고른 파일 바이트(요약 IM-13) */
  readonly size: number;
}
export type CheckResult = { readonly ok: true; readonly file: CheckedFile } | CheckFailure;
/** ①~④ 결과 — 이미지는 아직 원문(⑤ 전) */
export type RecordsResult = { readonly ok: true; readonly file: Omit<CheckedFile, "images"> & { readonly images: readonly unknown[] } } | CheckFailure;


type Loose = Record<string, unknown>;
const isObject = (v: unknown): v is Loose => typeof v === "object" && v !== null && !Array.isArray(v);
const isInt = (v: unknown): v is number => Number.isSafeInteger(v);
const isString = (v: unknown): v is string => typeof v === "string";
const SNAPSHOT_KINDS: readonly unknown[] = ["manual", "auto", "published"];
/** SnapshotDialog REASON 키 */
const SNAPSHOT_REASONS: readonly unknown[] = ["export", "restore", "conflict", "restart"];
const PROJECT_TEXT = ["projectId", "name", "profileId", "baseReferenceId", "createdAt", "updatedAt"] as const;

/** ③ — undefined = 통과 */
function envelopeFailure(top: Loose): ImportCode | undefined {
  if (top.format !== FILE_FORMAT) return "IM-2";
  const { formatVersion, schemaVersion } = top;
  if ((isInt(formatVersion) && formatVersion > FORMAT_VERSION) || (isInt(schemaVersion) && schemaVersion > SCHEMA)) return "IM-3";
  if (formatVersion !== FORMAT_VERSION || schemaVersion !== SCHEMA) return "IM-2"; // 이행 함수 0개 — v1만
  const shaped = isString(top.exportedAt) && isObject(top.project) && Array.isArray(top.series) && (top.doc === null || isObject(top.doc)) && Array.isArray(top.images);
  return shaped ? undefined : "IM-2";
}

const projectOk = (p: Loose): boolean => {
  if (!PROJECT_TEXT.every((key) => isString(p[key])) || !isInt(p.revision)) return false;
  const named = validateProjectName(p.name as string);
  return named.ok && named.name === p.name;
};

/** 열기 checkState와 같은 규칙 — 버전 1..n 연속 · profileId = 계열 키(계열 1개) + 화면이 읽는 필드 모양(Codex r1) */
const seriesOk = (series: readonly unknown[], profileId: string): boolean =>
  series.length > 0 && series.every((v, i) => isObject(v) && v.version === i + 1 && v.profileId === profileId && profileVersionShapeOk(v));

/** 문서(현재·스냅샷)의 프로필 버전 = 계열 1..n — 복원 뒤 내보내기가 버전을 찾게(Codex r1) */
const docHolds = (projectId: string, doc: unknown, seriesLength: number): boolean => {
  const checked = checkSaveDoc(projectId, doc);
  return checked.ok && isInt(checked.doc.profileVersion) && checked.doc.profileVersion >= 1 && checked.doc.profileVersion <= seriesLength;
};

/** 머리 = SnapshotDialog가 바로 렌더링하는 필드(name·createdAt·profileVersion·candidateId · REASON[reason]) — rekey는 projectId·doc·hash만 덮는다(Codex r2) */
const snapshotHeadOk = (s: Loose, seriesLength: number): boolean =>
  [s.name, s.createdAt, s.candidateId, s.hash].every(isString) &&
  isInt(s.profileVersion) && s.profileVersion >= 1 && s.profileVersion <= seriesLength &&
  (s.reason === undefined || SNAPSHOT_REASONS.includes(s.reason));

const snapshotOk = (s: unknown, projectId: string, seriesLength: number): boolean =>
  isObject(s) && s.projectId === projectId && isString(s.snapshotId) && SNAPSHOT_KINDS.includes(s.kind) && snapshotHeadOk(s, seriesLength) && docHolds(projectId, s.doc, seriesLength);

/** 열기 readDoc과 같은 규칙 + 스냅샷 머리 · 문서·스냅샷 프로필 버전 1..계열 길이 */
function docOk(record: Loose, projectId: string, seriesLength: number): boolean {
  const { doc, snapshots, snapshotSeq } = record;
  if (!Array.isArray(snapshots) || (snapshotSeq !== undefined && !isInt(snapshotSeq))) return false;
  return docHolds(projectId, doc, seriesLength) && snapshots.every((s) => snapshotOk(s, projectId, seriesLength));
}

/** ④ — 원래 id로 판정 */
function recordsOk(top: Loose): boolean {
  const project = top.project as Loose;
  if (!projectOk(project)) return false;
  const series = top.series as unknown[];
  if (!seriesOk(series, project.profileId as string)) return false;
  return top.doc === null || docOk(top.doc as Loose, project.projectId as string, series.length);
}

async function parse(file: Pick<Blob, "text">): Promise<unknown> {
  try {
    return JSON.parse(await file.text());
  } catch {
    return undefined;
  }
}

/** ①~④ — 통과하면 레코드를 타입으로 좁혀 돌려준다(이미지는 ⑤가 본다) */
export async function checkRecords(file: Pick<Blob, "size" | "text">): Promise<RecordsResult> {
  if (file.size > MAX_FILE_BYTES) return failure("IM-1");
  if (file.size <= 0) return failure("IM-2");
  const top = await parse(file);
  if (!isObject(top)) return failure("IM-2");
  const envelope = envelopeFailure(top);
  if (envelope) return failure(envelope);
  if (!recordsOk(top)) return failure("IM-4");
  return {
    ok: true,
    file: {
      exportedAt: top.exportedAt as string,
      project: top.project as unknown as Project,
      series: top.series as ProfileVersion[],
      doc: top.doc as unknown as DocRecord | null,
      images: top.images as unknown[],
      size: file.size,
    },
  };
}

/** 직렬화된 레코드 규칙 ④를 재매김 뒤에도 다시 쓴다(3.4 이중 확인) */
export const recordsHold = (records: { readonly project: unknown; readonly series: unknown; readonly doc: unknown }): boolean =>
  isObject(records.project) && Array.isArray(records.series) && (records.doc === null || isObject(records.doc)) && recordsOk(records as Loose);

/** ①~⑤ — deps = 업로드 경로와 같은 디코더·인코더(주입 — jsdom 가짜) */
export async function checkFile(file: Pick<Blob, "size" | "text">, deps?: IngestDeps): Promise<CheckResult> {
  const records = await checkRecords(file);
  if (!records.ok) return records;
  const images = await checkImages(records.file.images, deps);
  return images.ok ? { ok: true, file: { ...records.file, images: images.images } } : images;
}
