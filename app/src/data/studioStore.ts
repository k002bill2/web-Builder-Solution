/**
 * 보드·프로필·생성 메모리 저장소가 함께 쓰는 저장 모듈 (DS-2A-04 SPEC 6.3). 프로필 계열(버전 레코드)과
 * 보드 확정·조정 저장의 멱등 기록(각각 따로), 3안 생성 잡을 둔다. 모듈 싱글턴이 아니라 팩토리다 — 렌더·테스트마다 새로 만들어 id가 늘 `profile-1`부터.
 * 쓰기는 `transact` 한 동기 구간에서만: work가 던지면 그 안의 쓰기를 모두 버린다(커밋 전 실패 롤백, 6.3 r3).
 */
import type { CandidateId, ComposedResult, GenerationJob } from "../domain/generation";
import type { ProfileHead, ProfileVersion } from "../domain/profile";

/** 마지막 커밋 — 보드 확정 키 = (보드 id, 호출자가 본 revision, expectedLatest) · 조정 저장 키 = (profileId, expectedLatest, 정규화한 조정) */
export interface IdempotentCommit {
  readonly key: string;
  readonly profileId: string;
  readonly version: number;
}

/**
 * 생성 잡 저장 모양 (2a-04c). `job`이 화면에 돌려주는 값이고, `hidden`은 요청·재시도 때 계산해 두고 아직 드러내지 않은 결과다
 * (조회마다 한 안씩 드러낸다 — 6.3 "메모리 구현은 조회마다 한 안씩 진행"). `attempts`는 안별 계산 횟수(실패 주입·재시도).
 */
export interface StoredJob {
  /** 멱등 키 = (profileId, version, libraryVersion, generatorVersion) */
  readonly key: string;
  readonly job: GenerationJob;
  readonly hidden: readonly (ComposedResult | undefined)[];
  readonly attempts: Readonly<Record<CandidateId, number>>;
}

interface StudioState {
  readonly series: ReadonlyMap<string, readonly ProfileVersion[]>;
  readonly commits: ReadonlyMap<string, IdempotentCommit>;
  /** 조정 저장 멱등 기록 — 보드 `commits` 슬롯과 따로 둔다(같이 쓰면 보드 확정 재시도가 조정 저장에 덮여 A-Q4가 깨진다) */
  readonly adjustCommits: ReadonlyMap<string, IdempotentCommit>;
  /** jobId → 잡 */
  readonly jobs: ReadonlyMap<string, StoredJob>;
}

export interface StudioReader {
  profileIds(): readonly string[];
  /** 오름차순. 없으면 빈 배열 */
  versions(profileId: string): readonly ProfileVersion[];
  /** 계열의 마지막 보드 확정 커밋 */
  commitOf(profileId: string): IdempotentCommit | undefined;
  /** 계열의 마지막 조정 저장 커밋 */
  adjustCommitOf(profileId: string): IdempotentCommit | undefined;
  job(jobId: string): StoredJob | undefined;
  jobByKey(key: string): StoredJob | undefined;
  jobCount(): number;
}

export interface StudioTx extends StudioReader {
  nextProfileId(): string;
  /** 계열 최신 + 1 번호만 받는다 — 번호 중복·건너뜀 0 */
  insert(record: ProfileVersion): void;
  remember(commit: IdempotentCommit): void;
  rememberAdjust(commit: IdempotentCommit): void;
  /** 새 잡 또는 같은 jobId 갱신 — 레코드는 동결한다 */
  putJob(stored: StoredJob): void;
}

export interface StudioStore extends StudioReader {
  transact<T>(work: (tx: StudioTx) => T): T;
}

export function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export const headOf = ({ version, base, adjustments }: ProfileVersion): ProfileHead => ({ version, base, adjustments });

function readerOf(read: () => StudioState): StudioReader {
  return {
    profileIds: () => [...read().series.keys()],
    versions: (profileId) => read().series.get(profileId) ?? [],
    commitOf: (profileId) => read().commits.get(profileId),
    adjustCommitOf: (profileId) => read().adjustCommits.get(profileId),
    job: (jobId) => read().jobs.get(jobId),
    jobByKey: (key) => [...read().jobs.values()].find((stored) => stored.key === key),
    jobCount: () => read().jobs.size,
  };
}

export function createStudioStore(): StudioStore {
  let state: StudioState = { series: new Map(), commits: new Map(), adjustCommits: new Map(), jobs: new Map() };
  return {
    ...readerOf(() => state),
    transact(work) {
      let draft = state;
      const tx: StudioTx = {
        ...readerOf(() => draft),
        nextProfileId: () => `profile-${draft.series.size + 1}`,
        insert(record) {
          const current = draft.series.get(record.profileId) ?? [];
          const latest = current.at(-1)?.version ?? 0;
          if (record.version !== latest + 1) throw new Error(`버전 번호 ${record.version} ≠ 최신 ${latest} + 1`);
          draft = { ...draft, series: new Map(draft.series).set(record.profileId, [...current, deepFreeze(record)]) };
        },
        remember(commit) {
          draft = { ...draft, commits: new Map(draft.commits).set(commit.profileId, commit) };
        },
        rememberAdjust(commit) {
          draft = { ...draft, adjustCommits: new Map(draft.adjustCommits).set(commit.profileId, commit) };
        },
        putJob(stored) {
          draft = { ...draft, jobs: new Map(draft.jobs).set(stored.job.jobId, deepFreeze(stored)) };
        },
      };
      const result = work(tx);
      state = draft;
      return result;
    },
  };
}
