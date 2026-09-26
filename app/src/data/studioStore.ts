/**
 * 보드·프로필 메모리 저장소가 함께 쓰는 저장 모듈 (DS-2A-04 SPEC 6.3). 프로필 계열(버전 레코드)과
 * 보드 확정의 멱등 기록을 둔다. 모듈 싱글턴이 아니라 팩토리다 — 렌더·테스트마다 새로 만들어 id가 늘 `profile-1`부터.
 * 쓰기는 `transact` 한 동기 구간에서만: work가 던지면 그 안의 쓰기를 모두 버린다(커밋 전 실패 롤백, 6.3 r3).
 */
import type { ProfileHead, ProfileVersion } from "../domain/profile";

/** 보드 확정의 마지막 커밋 — 키 = (보드 id, 호출자가 본 revision, expectedLatest) */
export interface IdempotentCommit {
  readonly key: string;
  readonly profileId: string;
  readonly version: number;
}

interface StudioState {
  readonly series: ReadonlyMap<string, readonly ProfileVersion[]>;
  readonly commits: ReadonlyMap<string, IdempotentCommit>;
}

export interface StudioReader {
  profileIds(): readonly string[];
  /** 오름차순. 없으면 빈 배열 */
  versions(profileId: string): readonly ProfileVersion[];
  /** 계열의 마지막 보드 확정 커밋 */
  commitOf(profileId: string): IdempotentCommit | undefined;
}

export interface StudioTx extends StudioReader {
  nextProfileId(): string;
  /** 계열 최신 + 1 번호만 받는다 — 번호 중복·건너뜀 0 */
  insert(record: ProfileVersion): void;
  remember(commit: IdempotentCommit): void;
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
  };
}

export function createStudioStore(): StudioStore {
  let state: StudioState = { series: new Map(), commits: new Map() };
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
      };
      const result = work(tx);
      state = draft;
      return result;
    },
  };
}
