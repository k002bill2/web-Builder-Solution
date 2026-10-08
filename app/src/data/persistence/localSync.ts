/**
 * 조작 뒤 영속 싱크 (ADR-007 3절 쓰기 방식·하이드레이션 2단 · 부록 Codex 제약 3 · 개정 1) — 탭당 연결 1개·쓰기 큐 1개(deferredStudio가 공유).
 * - 열기: 진입 상태(봉투 확인만 거침)를 실제 store 규칙으로 검증한다 — 계열 번호 1..n 연속(insert) · 프로젝트 이름(validateProjectName) ·
 *   잡(jobRecord + 공유 `stateOf`). 문서 레코드는 checkSaveDoc(저장 판정 1과 같은 함수)로 검증해 DocBook 시드로 낸다.
 *   위반 = INFRA로 열기 실패 → 쓰기 0(저장된 레코드를 덮지 않는다). 공유 로더라 다음 조작(재시도)에서 다시 연다.
 * - saveState: store 커밋 뒤 상태 레코드(StudioState + 문서 머리) put — 응답을 기다리지 않는다. 실패는 다음 쓰기(같은 레코드)가 최신 의도로 덮는다.
 * - flush: 문서 쓰기 뒤 문서 레코드 + 상태 레코드를 한 트랜잭션으로 — IDB 커밋 확인 뒤 resolve("저장됨"은 이 뒤). 같은 내용을 이미 제출했으면
 *   (멱등 재생) 미확인 기록 재제출(retry). 큐가 받은 제출만 기억한다 — 복제 실패는 재생 때 다시 제출해 같은 INFRA(재시도로 풀리지 않는 실패, 거짓 "저장됨" 0).
 * - base: IDB 실패 뒤 메모리 revision만 오른 상태에서 다음 편집 저장을 내 미확인 쓰기 위에 얹는다(STALE_DOC 아님).
 * - 다중 탭(P1C-D2 · SPEC 1.5): 쓰기마다 `meta` generation을 +1(상태 레코드 `gen`에도 같은 값 — 진입이 읽는 레코드라 진입 바이트 0).
 *   상태 레코드 + 세대는 큐 도장(stamp)으로만 낸다 — 재시도·미확인 재제출 커밋도 새 세대(Codex r1 P1).
 *   첫 쓰기 때 writerLock 획득 → 최신성 확인(진입 gen = 지금 meta gen · 진입 때 있던 상태 레코드가 그대로) 통과 시에만 쓴다.
 *   못 잡음 = 읽기 전용(saveState 쓰기 0 · flush INFRA) · 낡음 = 쓰기 0. 열 때 이미 낡았으면 문서 시드에 진입 문서를 둔다(다른 탭의 새 revision으로 판정하지 않게).
 * - 지우기(P1C-D4 · SPEC 1.6): 열면 탭 링크에 손잡이를 등록한다(쓰기 탭인가 · 멈춤). 멈춤 = 연결 닫기 + 이후 쓰기 0 — 큐에 이미 든 쓰기도
 *   쓰기 직전에 막고, 저장은 INFRA 사유 "이 브라우저 데이터가 지워졌습니다 — 새로고침하세요".
 * - 탭 간 알림(SPEC 1.5): 쓰기 커밋 확인 뒤 `saved` 전송(재시도 커밋 포함) · `cleared` 수신 = 멈춤(열기 전 수신도 — 링크가 기억, Codex r2 P2). `saved` 수신은 무시
 *   (편집기 안 표시 0 — MQ-C1 A, 다음 저장 때 최신성 확인이 막는다). 구독은 싱크가 열릴 때(조작 뒤) — 진입 몫 0.
 */
import { validateProjectName } from "../../domain/projectName";
import { ProjectRepositoryError, type DocHead, type ProjectSnapshot } from "../projectRepository";
import { checkSaveDoc } from "../startDocWrite";
import { deepFreeze, type StudioState } from "../studioStore";
import { SCHEMA_VERSION, checkEnvelope } from "./envelope";
import type { DocRecord, LocalEntry } from "./entryRead";
import { openIdbPersistence } from "./idbPersistence";
import { CLEARED_TAB, READ_ONLY_TAB, STALE_TAB, toInfra } from "./infra";
import { imageOps } from "./imageOps";
import { jobPut, readJobRecord } from "./jobRecord";
import type { StudioPersistence, WriteOp } from "./studioPersistence";
import type { RenderImages } from "../../features/studio/images/store/types";
import { tabLink, type TabLink } from "./tabLink";
import { createWriteQueue } from "./writeQueue";
import { createWriterGate, type WriterLocks, type WriterMode } from "./writerLock";

/** DocBook 중 싱크가 읽는 부분 */
export interface BookView {
  docOf(projectId: string): DocHead | undefined;
  snapshotsOf(projectId: string): readonly ProjectSnapshot<DocHead>[];
}

export interface LocalSync {
  /** 검증한 문서 레코드 — DocBook 시드 */
  readonly docs: ReadonlyMap<string, DocRecord>;
  saveState(state: StudioState): void;
  /** 문서 쓰기 뒤 — 그 프로젝트의 지금 문서·스냅샷(DocBook). images = 편집 틀 맵(P1b — 참조 이미지를 같은 트랜잭션에) */
  flush(projectId: string, book: BookView, images?: RenderImages): Promise<void>;
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

const GENERATION = "generation";
const blocked = (mode: WriterMode) => toInfra(undefined, "저장", ...(mode === "readonly" ? [READ_ONLY_TAB] : mode === "stale" ? [STALE_TAB] : []));
const ignore = () => undefined;

const headOf = ({ projectId, revision, hash, profileVersion, candidateId, updatedAt }: DocHead): DocHead => ({ projectId, revision, hash, profileVersion, candidateId, updatedAt });

export async function openLocalSync(
  entry: LocalEntry,
  open: () => Promise<StudioPersistence> = openIdbPersistence,
  locks: WriterLocks | undefined = globalThis.navigator?.locks,
  link: TabLink = tabLink(),
): Promise<LocalSync> {
  const persistence = await open();
  const hydrated = entry.state?.gen ?? 0;
  /** 최신성 — 이 탭이 하이드레이트한 뒤 다른 탭이 쓰거나 지우지 않았나 */
  const fresh = async () => {
    const meta = checkEnvelope(await persistence.get("meta", GENERATION), GENERATION, GENERATION);
    const now = meta.status === "ok" && typeof meta.data === "number" ? meta.data : 0;
    return now === hydrated && (!entry.state || (await persistence.keys("studio")).includes("state"));
  };
  // 복원 레코드도 store처럼 항목마다 동결(insert·putJob·putProject와 같은 모양) — 진입은 바이트 0을 위해 여기서(첫 조작 전 쓰기 0)
  if (entry.state) Object.values(entry.state).forEach((records: unknown) => records instanceof Map && records.forEach(deepFreeze));
  deepFreeze(entry.doc);
  let docs: ReadonlyMap<string, DocRecord>;
  /** 커밋 확인된 이미지 레코드 id(P1b) — 트랜잭션 성공 뒤에만 갱신. 실패한 id는 "모름"으로 빼 다음 flush가 다시 put한다(Codex r2 P1) */
  let stored: ReadonlySet<string>;
  /** 진행 중(미확인) 이미지 op — id → 그 op를 낸 제출. 다음 flush는 이 id의 put을 빼지 않는다 */
  let inflight: ReadonlyMap<string, object> = new Map();
  try {
    if (entry.state) checkState(entry.state);
    const seed = new Map((await persistence.getAll("docs")).map(readDoc));
    if (entry.doc && !(await fresh())) seed.set(...readDoc({ schemaVersion: SCHEMA_VERSION, kind: "doc", id: entry.doc.doc.projectId, data: entry.doc }));
    docs = seed;
    stored = new Set(await persistence.keys("images"));
  } catch (error) {
    persistence.close();
    throw error instanceof ProjectRepositoryError && error.code === "INFRA" ? error : unreadable();
  }
  const gate = createWriterGate(locks, fresh);
  let generation = hydrated;
  let latest: StudioState = entry.state ?? { series: new Map(), commits: new Map(), adjustCommits: new Map(), jobs: new Map(), projects: new Map() };
  let heads: ReadonlyMap<string, DocHead> = entry.state?.heads ?? new Map();
  /** 큐가 받은 마지막 문서 레코드(프로젝트별) — 같으면 멱등 재생 */
  const submitted = new Map<string, DocRecord>();
  /** 큐 도장 = 상태 레코드 + meta 세대 — 제출(재시도 포함)마다 세대 +1(쓰기 탭은 단독 작성자라 탭 안 계수로 충분) */
  const stateOps = (): WriteOp[] => {
    generation += 1;
    return [
      { type: "put", store: "studio", record: { schemaVersion: SCHEMA_VERSION, kind: "state", id: "state", data: { ...latest, heads, gen: generation } } },
      { type: "put", store: "meta", record: { schemaVersion: SCHEMA_VERSION, kind: GENERATION, id: GENERATION, data: generation } },
    ];
  };
  /** 지워짐(이 탭이 지웠거나 cleared 수신) — 새로고침 전까지 쓰기 0 */
  let cleared = false;
  const stop = () => {
    if (cleared) return;
    cleared = true;
    persistence.close();
  };
  link.attach({ isWriter: () => !cleared && gate.mode === "writer", stop });
  link.listen((message) => message.type === "cleared" && stop());
  // 싱크 열기 전에 받은 cleared(Codex r2 P2) — 첫 쓰기·잠금 요청 전에 멈춘다
  if (link.wasCleared()) stop();
  const committed = async (ops: readonly WriteOp[]) => {
    if (cleared) throw toInfra(undefined, "저장", CLEARED_TAB);
    await persistence.write(ops);
    link.post({ type: "saved" });
  };
  const queue = createWriteQueue({ ...persistence, write: committed }, stateOps);
  const write = (projectId: string, book: BookView, images?: RenderImages) => {
    const record: DocRecord = { doc: book.docOf(projectId)!, snapshots: book.snapshotsOf(projectId) };
    const sent = submitted.get(projectId);
    if (sent?.doc === record.doc && sent.snapshots === record.snapshots) return queue.retry(projectId);
    const prevHeads = heads;
    // 도장(상태 레코드)이 이 문서의 머리를 담도록 제출 전에 바꾸고, 큐가 받지 않으면(복제 실패) 되돌린다
    heads = new Map(heads).set(projectId, headOf(record.doc));
    const settled = new Set([...stored].filter((id) => !inflight.has(id)));
    const imaging = imageOps(projectId, record, images, settled, new Set([...stored, ...inflight.keys()]));
    const writing = queue.submit(projectId, [{ type: "put", store: "docs", record: { schemaVersion: SCHEMA_VERSION, kind: "doc", id: projectId, data: record } }, ...imaging]);
    if (queue.status(projectId) !== "pending") heads = prevHeads;
    else {
      submitted.set(projectId, record);
      const ids = imaging.map((op) => (op.type === "put" ? op.record.id : op.id));
      inflight = new Map([...inflight, ...ids.map((id) => [id, writing] as const)]);
      const settle = (ok: boolean) => {
        const next = new Set(stored);
        // 성공 = op대로 반영 · 실패 = 모름(빼 둔다 — put은 다시 내고, delete는 큐가 다음 제출에 합친다)
        imaging.forEach((op) => (ok && op.type === "put" ? next.add(op.record.id) : next.delete(op.type === "put" ? op.record.id : op.id)));
        stored = next;
        inflight = new Map([...inflight].filter(([, by]) => by !== writing));
      };
      writing.then(() => settle(true), () => settle(false));
    }
    return writing;
  };

  return {
    docs,
    saveState: (state) => {
      latest = state;
      if (cleared) return;
      const put = () => void queue.submit("state", []).catch(ignore);
      // 읽기 전용·낡음은 조용히 쓰기 0(다시 시도는 flush — "다시 저장") · 시도 전이면 첫 쓰기로 잠금을 요청한다
      if (gate.mode === "writer") put();
      else if (gate.mode === undefined) gate.enter().then((mode) => mode === "writer" && put(), ignore);
    },
    flush: (projectId, book, images) =>
      cleared
        ? Promise.reject(toInfra(undefined, "저장", CLEARED_TAB))
        : gate.mode === "writer" ? write(projectId, book, images) : gate.enter().then((mode) => (mode === "writer" ? write(projectId, book, images) : Promise.reject(blocked(mode)))),
    base: (projectId, expectedRevision, current, hash) =>
      current && current.hash !== hash && current === submitted.get(projectId)?.doc && queue.status(projectId) === "unconfirmed" && current.revision > expectedRevision
        ? current.revision
        : expectedRevision,
  };
}
