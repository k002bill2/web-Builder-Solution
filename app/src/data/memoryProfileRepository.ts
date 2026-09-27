/**
 * 디자인 프로필 저장소 메모리 구현 (DS-2A-04 SPEC 6.3) — 보드 메모리 구현과 같은 store를 쓴다.
 * 되돌리기·조정 저장은 expectedLatest 비교와 삽입을 한 동기 구간에서 한다(사이에 await 없음, 6.1-4).
 * 판정 순서 — 되돌리기: NOT_FOUND → STALE_PROFILE → 이미 최신(SCHEMA_INVALID). 조정 저장은 memoryProfileAdjust.
 * 멱등 키: 조정 저장만 둔다(보드 확정과 같은 r3 계약, 별도 기록 — memoryProfileAdjust). 되돌리기는 키 없음.
 * `delay`·`fail` 주입은 보드 구현과 같은 모양(요청 도착 전·응답 반환 전, `fail`의 `phase: "commit"`은 조정 저장 삽입 뒤 커밋 앞).
 * `range`는 테마 허용 범위 주입(P-AC-13).
 * 쓰기 본문(조정 저장의 zod·정규화, 되돌리기 판정·삽입)은 그 메서드를 처음 부를 때 받는다(writeBodyLoader, 범위 조회는 받지 않음) — 보드 진입 직후
 * 합계(/compare)에 싣지 않는다(2a-04b1 번들 · FIX3 1안). 받기는 `call`의 동기 구간 밖(앞)이라 비교·삽입 원자성은 그대로다.
 */
import { DEFAULT_ADJUSTMENT_RANGE, type AdjustmentRange, type ProfileSeries, type ProfileSummary } from "../domain/profile";
import { ProfileError, type ProfileRepository } from "./profileRepository";
import type { StudioReader, StudioStore } from "./studioStore";
import { loadProfileWrites } from "./writeBodyLoader";

export type ProfileMethod = keyof ProfileRepository;
export interface ProfileCall {
  readonly method: ProfileMethod;
  /** 메서드별 1부터 */
  readonly seq: number;
  /** commit = 조정 저장의 삽입·멱등 기록 뒤 커밋 앞(`fail`만, 동기 구간이라 `delay` 없음) */
  readonly phase: "request" | "commit" | "response";
}

export interface MemoryProfileOptions {
  readonly store: StudioStore;
  readonly now?: () => string;
  readonly delay?: (call: ProfileCall) => Promise<void> | void | undefined;
  readonly fail?: (call: ProfileCall) => Error | undefined;
  /** 테마 허용 범위 (3.4). 없으면 기본 범위 1벌 */
  readonly range?: AdjustmentRange;
}

function seriesOf(reader: StudioReader, profileId: string): ProfileSeries | undefined {
  const versions = reader.versions(profileId);
  const latest = versions.at(-1);
  return latest && { profileId, versions, latestVersion: latest.version };
}

export function createMemoryProfileRepository(options: MemoryProfileOptions): ProfileRepository {
  const { store, now = () => new Date().toISOString() } = options;
  const counts = new Map<ProfileMethod, number>();

  /** `commitGate`는 조정 저장이 삽입 뒤에 부른다 — 던지면 store 트랜잭션이 삽입·멱등 기록을 버린다 */
  async function call<T>(method: ProfileMethod, work: (commitGate: () => void) => T): Promise<T> {
    const seq = (counts.get(method) ?? 0) + 1;
    counts.set(method, seq);
    await options.delay?.({ method, seq, phase: "request" });
    const failure = options.fail?.({ method, seq, phase: "request" });
    if (failure) throw failure;
    const result = work(() => {
      const commitFailure = options.fail?.({ method, seq, phase: "commit" });
      if (commitFailure) throw commitFailure;
    });
    await options.delay?.({ method, seq, phase: "response" });
    return result;
  }

  const summaryOf = (series: ProfileSeries): ProfileSummary => {
    const latest = series.versions.at(-1)!;
    return { profileId: series.profileId, latestVersion: series.latestVersion, baseReferenceId: latest.baseReferenceId, updatedAt: latest.createdAt };
  };

  return {
    listProfiles: () =>
      call("listProfiles", () => store.profileIds().flatMap((id) => {
        const series = seriesOf(store, id);
        return series ? [summaryOf(series)] : [];
      })),
    getProfile: (profileId) =>
      call("getProfile", () => {
        const series = seriesOf(store, profileId);
        const project = store.projectOf(profileId);
        return series && project ? { ...series, project: { projectId: project.projectId, name: project.name } } : series;
      }),
    // 범위 조회는 쓰기 본문을 받지 않는다 — /profile 진입 때 자동으로 부르므로(2a-04b2) 본문 청크는 저장·되돌리기 조작 뒤에만
    getAdjustmentRange: (profileId, version) => {
      const range = options.range ?? DEFAULT_ADJUSTMENT_RANGE;
      return call("getAdjustmentRange", () => {
        if (!store.versions(profileId).some((v) => v.version === version)) throw new ProfileError("NOT_FOUND", `${profileId} v${version} 없음`);
        return range;
      });
    },
    saveAdjustments: async (profileId, expectedLatest, adjustments) => {
      const { saveAdjustmentsIn } = await loadProfileWrites();
      const range = options.range ?? DEFAULT_ADJUSTMENT_RANGE;
      return call("saveAdjustments", (commitGate) =>
        store.transact((tx) => saveAdjustmentsIn(tx, { profileId, expectedLatest, adjustments, range, createdAt: now(), seriesOf: (reader) => seriesOf(reader, profileId), commitGate })),
      );
    },
    revertTo: async (profileId, version, expectedLatest) => {
      const { revertIn } = await loadProfileWrites();
      return call("revertTo", () => store.transact((tx) => revertIn(tx, { profileId, version, expectedLatest, createdAt: now(), seriesOf: (reader) => seriesOf(reader, profileId) })));
    },
  };
}
