/**
 * 가져오기 검증 (P2-SPEC 3.2 · 3.3 — Jarvis 채택 결정 2 우선). 앞 단계 실패 = 뒤 단계 0 · 전부 트랜잭션 전 · 쓰기 0.
 * ① 크기(읽기 전) → ② 파싱 → ③ 봉투(미래 버전은 다른 필드보다 먼저) → ④ 레코드 모양(원래 id로 checkSaveDoc · 열기 checkState 규칙).
 * 실패 = { code, message }(IM-1~IM-4)만 — 부분 결과를 내지 않는다.
 */
import type { DocRecord } from "../../data/persistence/entryRead";
import type { Project } from "../../data/projectRepository";
import { checkSaveDoc } from "../../data/startDocWrite";
import type { ProfileVersion } from "../../domain/profile";
import { validateProjectName } from "../../domain/projectName";
import { FILE_FORMAT, FORMAT_VERSION, IMPORT_MESSAGES, MAX_FILE_BYTES, SCHEMA, type FileImage, type ImportCode } from "./format";

export type CheckFailure = { readonly ok: false; readonly code: ImportCode; readonly message: string };
export interface CheckedFile {
  readonly exportedAt: string;
  readonly project: Project;
  readonly series: readonly ProfileVersion[];
  readonly doc: DocRecord | null;
  readonly images: readonly FileImage[];
  /** 고른 파일 바이트(요약 IM-13) */
  readonly size: number;
}
export type CheckResult = { readonly ok: true; readonly file: CheckedFile } | CheckFailure;

export const failure = (code: ImportCode): CheckFailure => ({ ok: false, code, message: IMPORT_MESSAGES[code] });

type Loose = Record<string, unknown>;
const isObject = (v: unknown): v is Loose => typeof v === "object" && v !== null && !Array.isArray(v);
const isInt = (v: unknown): v is number => Number.isSafeInteger(v);
const isString = (v: unknown): v is string => typeof v === "string";
const SNAPSHOT_KINDS: readonly unknown[] = ["manual", "auto", "published"];
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

/** 열기 checkState와 같은 규칙 — 버전 1..n 연속 · profileId = 계열 키(계열 1개) */
const seriesOk = (series: readonly unknown[], profileId: string): boolean =>
  series.length > 0 && series.every((v, i) => isObject(v) && v.version === i + 1 && v.profileId === profileId);

const snapshotOk = (s: unknown, projectId: string): boolean =>
  isObject(s) && s.projectId === projectId && isString(s.snapshotId) && SNAPSHOT_KINDS.includes(s.kind) && checkSaveDoc(projectId, s.doc).ok;

/** 열기 readDoc과 같은 규칙 + 스냅샷 머리 · 문서 프로필 버전 ≤ 계열 길이 */
function docOk(record: Loose, projectId: string, seriesLength: number): boolean {
  const { doc, snapshots, snapshotSeq } = record;
  if (!Array.isArray(snapshots) || (snapshotSeq !== undefined && !isInt(snapshotSeq))) return false;
  const checked = checkSaveDoc(projectId, doc);
  return checked.ok && checked.doc.profileVersion <= seriesLength && snapshots.every((s) => snapshotOk(s, projectId));
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
export async function checkRecords(file: Pick<Blob, "size" | "text">): Promise<CheckResult> {
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
      images: top.images as FileImage[],
      size: file.size,
    },
  };
}

/** L1a = ①~④ — ⑤ 이미지(L1b)가 붙으면 바뀐다 */
export const checkFile = checkRecords;
