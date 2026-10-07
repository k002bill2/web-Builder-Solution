/**
 * 조작 뒤 영속 싱크 (ADR-007 3절 쓰기 방식·하이드레이션 2단 · 부록 Codex 제약 3 · 개정 1) — 탭당 연결 1개·쓰기 큐 1개(deferredStudio가 공유).
 * - 열기: 진입 상태(봉투 확인만 거침)를 실제 store 규칙으로 검증한다 — 계열 번호 1..n 연속(insert) · 프로젝트 이름(validateProjectName) ·
 *   잡(jobRecord + 공유 `stateOf`). 문서 레코드는 checkSaveDoc(저장 판정 1과 같은 함수)로 검증해 DocBook 시드로 낸다.
 *   위반 = INFRA로 열기 실패 → 쓰기 0(저장된 레코드를 덮지 않는다). 공유 로더라 다음 조작(재시도)에서 다시 연다.
 * - saveState: store 커밋 뒤 상태 레코드(StudioState + 문서 머리) put — 응답을 기다리지 않는다. 실패는 다음 쓰기(같은 레코드)가 최신 의도로 덮는다.
 * - flush: 문서 쓰기 뒤 문서 레코드 + 상태 레코드를 한 트랜잭션으로 — IDB 커밋 확인 뒤 resolve("저장됨"은 이 뒤). 같은 내용을 이미 제출했으면
 *   (멱등 재생) 미확인 기록 재제출(retry). 큐가 받은 제출만 기억한다 — 복제 실패는 재생 때 다시 제출해 같은 INFRA(재시도로 풀리지 않는 실패, 거짓 "저장됨" 0).
 * - base: IDB 실패 뒤 메모리 revision만 오른 상태에서 다음 편집 저장을 내 미확인 쓰기 위에 얹는다(STALE_DOC 아님).
 */
import { validateProjectName } from "../../domain/projectName";
import { ProjectRepositoryError, type DocHead, type ProjectSnapshot } from "../projectRepository";
import { checkSaveDoc } from "../startDocWrite";
import { deepFreeze, type StudioState } from "../studioStore";
import { SCHEMA_VERSION, checkEnvelope } from "./envelope";
import type { DocRecord, LocalEntry } from "./entryRead";
import { openIdbPersistence } from "./idbPersistence";
import { jobPut, readJobRecord } from "./jobRecord";
import type { StudioPersistence, WriteOp } from "./studioPersistence";
import { createWriteQueue } from "./writeQueue";

/** DocBook 중 싱크가 읽는 부분 */
export interface BookView {
  docOf(projectId: string): DocHead | undefined;
  snapshotsOf(projectId: string): readonly ProjectSnapshot<DocHead>[];
}

export interface LocalSync {
  /** 검증한 문서 레코드 — DocBook 시드 */
  readonly docs: ReadonlyMap<string, DocRecord>;
  saveState(state: StudioState): void;
  /** 문서 쓰기 뒤 — 그 프로젝트의 지금 문서·스냅샷(DocBook) */
  flush(projectId: string, book: BookView): Promise<void>;
  /** DocBook save가 판정 전에 부른다 — current = 지금 메모리 문서 */
  base(projectId: string, expectedRevision: number, current: DocHead | undefined, hash: string): number;
}

const unreadable = () => new ProjectRepositoryError("INFRA", "열기 — 저장된 데이터를 읽지 못했습니다");

function checkState({ series, projects, jobs }: StudioState) {
  for (const [profileId, versions] of series) if (versions.some((v, i) => v.version !== i + 1 || v.profileId !== profileId)) throw unreadable();
  for (const project of projects.values()) {
    const checked = validateProjectName(project.name);
    if (!checked.ok || checked.name !== project.name) throw unreadable();
  }
  for (const stored of jobs.values()) readJobRecord((jobPut(stored) as Extract<WriteOp, { type: "put" }>).record);
}

function readDoc(record: unknown): [string, DocRecord] {
  const id = (record as { id?: unknown } | undefined)?.id;
  const env = checkEnvelope(record, "doc", String(id));
  if (env.status !== "ok") throw unreadable();
  const data = env.data as DocRecord;
  if (!Array.isArray(data?.snapshots) || ![data.doc, ...data.snapshots.map((s) => s?.doc)].every((doc) => checkSaveDoc(String(id), doc).ok)) throw unreadable();
  return [String(id), deepFreeze(data)];
}

const headOf = ({ projectId, revision, hash, profileVersion, candidateId, updatedAt }: DocHead): DocHead => ({ projectId, revision, hash, profileVersion, candidateId, updatedAt });

export async function openLocalSync(entry: LocalEntry, open: () => Promise<StudioPersistence> = openIdbPersistence): Promise<LocalSync> {
  const persistence = await open();
  // 복원 레코드도 store처럼 항목마다 동결(insert·putJob·putProject와 같은 모양) — 진입은 바이트 0을 위해 여기서(첫 조작 전 쓰기 0)
  if (entry.state) Object.values(entry.state).forEach((records: ReadonlyMap<string, unknown>) => records.forEach(deepFreeze));
  deepFreeze(entry.doc);
  let docs: ReadonlyMap<string, DocRecord>;
  try {
    if (entry.state) checkState(entry.state);
    docs = new Map((await persistence.getAll("docs")).map(readDoc));
  } catch (error) {
    persistence.close();
    throw error instanceof ProjectRepositoryError && error.code === "INFRA" ? error : unreadable();
  }
  const queue = createWriteQueue(persistence);
  let latest: StudioState = entry.state ?? { series: new Map(), commits: new Map(), adjustCommits: new Map(), jobs: new Map(), projects: new Map() };
  let heads: ReadonlyMap<string, DocHead> = entry.state?.heads ?? new Map();
  /** 큐가 받은 마지막 문서 레코드(프로젝트별) — 같으면 멱등 재생 */
  const submitted = new Map<string, DocRecord>();
  const statePut = (withHeads: ReadonlyMap<string, DocHead>): WriteOp => ({
    type: "put",
    store: "studio",
    record: { schemaVersion: SCHEMA_VERSION, kind: "state", id: "state", data: { ...latest, heads: withHeads } },
  });

  return {
    docs,
    saveState: (state) => {
      latest = state;
      queue.submit("state", [statePut(heads)]).catch(() => undefined);
    },
    flush: (projectId, book) => {
      const record: DocRecord = { doc: book.docOf(projectId)!, snapshots: book.snapshotsOf(projectId) };
      const sent = submitted.get(projectId);
      if (sent?.doc === record.doc && sent.snapshots === record.snapshots) return queue.retry(projectId);
      const nextHeads = new Map(heads).set(projectId, headOf(record.doc));
      const writing = queue.submit(projectId, [{ type: "put", store: "docs", record: { schemaVersion: SCHEMA_VERSION, kind: "doc", id: projectId, data: record } }, statePut(nextHeads)]);
      if (queue.status(projectId) === "pending") {
        submitted.set(projectId, record);
        heads = nextHeads;
      }
      return writing;
    },
    base: (projectId, expectedRevision, current, hash) =>
      current && current.hash !== hash && current === submitted.get(projectId)?.doc && queue.status(projectId) === "unconfirmed" && current.revision > expectedRevision
        ? current.revision
        : expectedRevision,
  };
}
