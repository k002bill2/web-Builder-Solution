/**
 * 내보내기 읽기 (P2-SPEC 3.6) — IDB **readonly 한 트랜잭션** `studio·docs·images`라 문서·이미지가 같은 시점. 잠금 불필요(읽기만).
 * 원본 = IDB에 커밋된 것(EX-4). 상태·문서 봉투 mismatch·invalid = unreadable(EX-6) · 그 프로젝트 없음 = gone(EX-7).
 * 이미지 레코드는 연결을 닫은 뒤 저장 규칙 전체(readImageRecord 리터럴 복제 — 사다리·메타·바이트 서명)로 검사해 통과한 것만 싣는다 —
 * 실패 레코드는 열기에서도 잃은 이미지이고, 실으면 가져오기 checkImages가 IM-6으로 파일 전체를 거절한다(Codex r1).
 * 프로젝트·계열·문서(스냅샷 포함)도 연결을 닫은 뒤 가져오기와 **같은 함수**(checkFile.recordsHold)로 검사한다 — 실패 = unreadable(EX-6).
 * 가져오기가 IM-4로 거절할 파일을 정상 백업으로 내려받게 하지 않는다(Codex r2 · 3.6 자기 거절 파일 금지).
 * 트랜잭션 안에서는 IDB 요청만 기다린다(Blob 읽기·base64 인코딩은 연결을 닫은 뒤).
 * `envelope`·`entryRead`·`imageRecord`·`studioStore`는 값으로 import하지 않는다(6절 진입·복원 closure) — 값은 리터럴 복제 + parity 테스트.
 */
import type { DocRecord, LocalState } from "../../data/persistence/entryRead";
import type { Project } from "../../data/projectRepository";
import type { ProfileVersion } from "../../domain/profile";
import { projectImageKeys } from "../projects/deleteProject";
import type { IngestedImage } from "../studio/images/ingest/types";
import { exportFileStem } from "../studio/staticHtml/exportFileName";
import { recordsHold } from "./checkFile";
import type { ExportSource } from "./encode";

/** envelope.DB_NAME과 같은 값(테스트가 단언) */
export const EXPORT_DB_NAME = "design-studio";
const SCHEMA = 1;
const STORES = ["studio", "docs", "images"];

const pad = (n: number) => String(n).padStart(2, "0");
/** P2-SPEC 1.3 내려받을 파일 이름 — `${exportFileStem(이름)}_project_YYYYMMDD.json`(내보낸 날, 사용자 로컬 시각) */
export const projectFileName = (name: string, at: Date) => `${exportFileStem(name)}_project_${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}.json`;

export type ReadResult = { readonly status: "ok"; readonly source: Omit<ExportSource, "exportedAt"> } | { readonly status: "unreadable" } | { readonly status: "gone" };

const done = <T>(request: IDBRequest<T>) =>
  new Promise<T>((ok, ko) => {
    request.onsuccess = () => ok(request.result);
    request.onerror = () => ko(request.error);
  });

/** undefined = 레코드 없음 · ok false = 봉투 mismatch·invalid */
const envelopeData = (record: unknown, kind: string, id: string): { ok: true; data: unknown } | { ok: false } | undefined => {
  if (record === undefined) return undefined;
  const env = record as { schemaVersion?: unknown; kind?: unknown; id?: unknown } | null;
  if (!env || typeof env !== "object" || env.kind !== kind || env.id !== id || !("data" in env) || env.schemaVersion !== SCHEMA) return { ok: false };
  return { ok: true, data: (env as { data: unknown }).data };
};

// ── 이미지 레코드 규칙 = imageRecord.readImageRecord 리터럴 복제. 그 모듈이나 ingest 규칙 모듈(fileType·ladder·limits)을 값으로 import하면
// 공유 청크가 다시 갈라져 /studio·복원·/profile 진입 크기가 는다(build 실측) — 값은 parity 테스트가 원본과 대조한다.
const FORMATS: readonly string[] = ["jpeg", "png", "webp"];
/** limits.MAX_SIDE · MAX_PIXELS */
export const EXPORT_MAX_SIDE = 16_384;
export const EXPORT_MAX_PIXELS = 40_000_000;
/** ladder.WIDTH_STEPS · 1920 */
export const EXPORT_WIDTH_STEPS: readonly number[] = [640, 1280, 1920];
const isSide = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= EXPORT_MAX_SIDE;
const exceedsPixelLimit = (w: number, h: number) => w > EXPORT_MAX_SIDE || h > EXPORT_MAX_SIDE || w * h > EXPORT_MAX_PIXELS;
const widthLadder = (width: number): number[] => {
  const steps = EXPORT_WIDTH_STEPS.filter((step) => step <= width);
  return width < 1920 && !steps.includes(width) ? [...steps, width] : steps;
};
const startsWith = (bytes: Uint8Array, offset: number, pattern: readonly number[]) => bytes.length >= offset + pattern.length && pattern.every((b, k) => bytes[offset + k] === b);
/** fileType.formatFromMagic */
const formatFromMagic = (head: Uint8Array): string | null => {
  if (startsWith(head, 0, [0xff, 0xd8, 0xff])) return "jpeg";
  if (startsWith(head, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  return head.length >= 16 && startsWith(head, 0, [0x52, 0x49, 0x46, 0x46]) && startsWith(head, 8, [0x57, 0x45, 0x42, 0x50]) ? "webp" : null;
};

/** 레코드 → 변환기 결과 모양 · 저장 규칙 밖 = undefined(열기에서도 잃은 이미지) */
export async function exportImageOf(record: unknown, id: string): Promise<IngestedImage | undefined> {
  const read = envelopeData(record, "image", id);
  if (!read?.ok) return undefined;
  const { variants, width, height, format, bytes } = (read.data as Partial<IngestedImage> | null) ?? {};
  if (!isSide(width) || !isSide(height) || exceedsPixelLimit(width, height) || !FORMATS.includes(format as string) || !variants || typeof variants !== "object") return undefined;
  const entries = Object.entries(variants);
  const ladder = widthLadder(width).map(String);
  if (entries.length !== ladder.length || entries.some(([w, blob], i) => w !== ladder[i] || !(blob instanceof Blob))) return undefined;
  const blobs = entries.map(([, blob]) => blob as Blob);
  if (bytes !== blobs.reduce((sum, blob) => sum + blob.size, 0)) return undefined;
  const heads = await Promise.all(blobs.map(async (blob) => formatFromMagic(new Uint8Array(await blob.slice(0, 16).arrayBuffer()))));
  return heads.every((f) => f === format) ? { variants: variants as IngestedImage["variants"], width, height, format: format as IngestedImage["format"], bytes } : undefined;
}

const stateOf = (record: unknown): LocalState | undefined | "unreadable" => {
  const read = envelopeData(record, "state", "state");
  if (read === undefined) return undefined;
  const data = read.ok ? (read.data as Partial<LocalState> | null) : null;
  if (!data || typeof data !== "object" || !(data.projects instanceof Map) || !(data.series instanceof Map)) return "unreadable";
  return data as LocalState;
};

type RawRead = { readonly status: "ok"; readonly source: Omit<ExportSource, "exportedAt" | "images">; readonly images: readonly (readonly [string, unknown])[] } | Exclude<ReadResult, { status: "ok" }>;

/** IDB 한 트랜잭션 — 레코드 원문만 모은다(IDB 요청 말고는 기다리지 않는다) */
async function readRaw(factory: IDBFactory, projectId: string): Promise<RawRead> {
  const db = await done(factory.open(EXPORT_DB_NAME));
  db.onversionchange = () => db.close();
  try {
    if (!STORES.every((name) => db.objectStoreNames.contains(name))) return { status: "gone" };
    const tx = db.transaction(STORES, "readonly");
    const [studio, docs, images] = STORES.map((name) => tx.objectStore(name));
    const [stateRecord, docRecord, keys] = await Promise.all([done(studio!.get("state")), done(docs!.get(projectId)), done(images!.getAllKeys())]);
    const imageKeys = projectImageKeys(keys, projectId);
    const imageRecords = await Promise.all(imageKeys.map((key) => done(images!.get(key))));
    const state = stateOf(stateRecord);
    if (state === "unreadable") return { status: "unreadable" };
    const project: Project | undefined = state?.projects.get(projectId);
    if (!project) return { status: "gone" };
    const doc = envelopeData(docRecord, "doc", projectId);
    if (doc?.ok === false) return { status: "unreadable" };
    const series: ProfileVersion[] = [...(state!.series.get(project.profileId) ?? [])].sort((a, b) => a.version - b.version);
    return { status: "ok", source: { project, series, doc: doc ? (doc.data as DocRecord) : null }, images: imageKeys.map((key, i) => [key, imageRecords[i]] as const) };
  } finally {
    db.close();
  }
}

export async function readProject(factory: IDBFactory, projectId: string): Promise<ReadResult> {
  const raw = await readRaw(factory, projectId);
  if (raw.status !== "ok") return raw;
  if (!recordsHold(raw.source)) return { status: "unreadable" };
  const checked = await Promise.all(raw.images.map(([key, record]) => exportImageOf(record, key)));
  const images = raw.images.flatMap(([key], i) => {
    const image = checked[i];
    return image ? [{ localId: key.slice(projectId.length + 1), image }] : [];
  });
  return { status: "ok", source: { ...raw.source, images } };
}
