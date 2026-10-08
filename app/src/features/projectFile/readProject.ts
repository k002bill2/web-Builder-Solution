/**
 * 내보내기 읽기 (P2-SPEC 3.6) — IDB **readonly 한 트랜잭션** `studio·docs·images`라 문서·이미지가 같은 시점. 잠금 불필요(읽기만).
 * 원본 = IDB에 커밋된 것(EX-4). 상태·문서 봉투 mismatch·invalid = unreadable(EX-6) · 그 프로젝트 없음 = gone(EX-7).
 * 이미지 레코드가 저장 모양 밖이면 건너뛴다 — 열기에서도 잃은 이미지(readImageRecord undefined)라 파일에 실어도 가져오기가 IM-6으로 막힌다.
 * 트랜잭션 안에서는 IDB 요청만 기다린다. base64 인코딩은 연결을 닫은 뒤(encodeProjectFile).
 * `envelope`·`entryRead`·`imageRecord`·`studioStore`는 값으로 import하지 않는다(6절 진입·복원 closure) — 값은 리터럴 복제 + parity 테스트.
 */
import type { DocRecord, LocalState } from "../../data/persistence/entryRead";
import type { Project } from "../../data/projectRepository";
import type { ProfileVersion } from "../../domain/profile";
import { projectImageKeys } from "../projects/deleteProject";
import type { IngestedImage } from "../studio/images/ingest/types";
import { exportFileStem } from "../studio/staticHtml/exportFileName";
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

const imageOf = (record: unknown, id: string): IngestedImage | undefined => {
  const read = envelopeData(record, "image", id);
  const data = read?.ok ? (read.data as Partial<IngestedImage> | null) : null;
  if (!data || typeof data !== "object" || !data.variants || typeof data.variants !== "object") return undefined;
  return Object.values(data.variants).every((blob) => blob instanceof Blob) ? (data as IngestedImage) : undefined;
};

const stateOf = (record: unknown): LocalState | undefined | "unreadable" => {
  const read = envelopeData(record, "state", "state");
  if (read === undefined) return undefined;
  const data = read.ok ? (read.data as Partial<LocalState> | null) : null;
  if (!data || typeof data !== "object" || !(data.projects instanceof Map) || !(data.series instanceof Map)) return "unreadable";
  return data as LocalState;
};

export async function readProject(factory: IDBFactory, projectId: string): Promise<ReadResult> {
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
    const found = imageKeys.flatMap((key, i) => {
      const image = imageOf(imageRecords[i], key);
      return image ? [{ localId: key.slice(projectId.length + 1), image }] : [];
    });
    return { status: "ok", source: { project, series, doc: doc ? (doc.data as DocRecord) : null, images: found } };
  } finally {
    db.close();
  }
}
