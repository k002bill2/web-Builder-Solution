/**
 * 디자인 프로필 저장소 메모리 구현 (DS-2A-04 SPEC 6.3) — 보드 메모리 구현과 같은 store를 쓴다.
 * 되돌리기는 expectedLatest 비교와 삽입을 한 동기 구간에서 한다(사이에 await 없음, 6.1-4). 판정 순서: NOT_FOUND → STALE_PROFILE → 이미 최신(SCHEMA_INVALID).
 * `delay`·`fail` 주입은 보드 구현과 같은 모양(요청 도착 전·응답 반환 전).
 */
import type { ProfileSeries, ProfileSummary, ProfileVersion } from "../domain/profile";
import { ProfileError, type ProfileReadRepository } from "./profileRepository";
import type { StudioReader, StudioStore } from "./studioStore";

export type ProfileMethod = keyof ProfileReadRepository;
export interface ProfileCall {
  readonly method: ProfileMethod;
  /** 메서드별 1부터 */
  readonly seq: number;
  readonly phase: "request" | "response";
}

export interface MemoryProfileOptions {
  readonly store: StudioStore;
  readonly now?: () => string;
  readonly delay?: (call: ProfileCall) => Promise<void> | void | undefined;
  readonly fail?: (call: ProfileCall) => Error | undefined;
}

function seriesOf(reader: StudioReader, profileId: string): ProfileSeries | undefined {
  const versions = reader.versions(profileId);
  const latest = versions.at(-1);
  return latest && { profileId, versions, latestVersion: latest.version };
}

export function createMemoryProfileRepository(options: MemoryProfileOptions): ProfileReadRepository {
  const { store, now = () => new Date().toISOString() } = options;
  const counts = new Map<ProfileMethod, number>();

  async function call<T>(method: ProfileMethod, work: () => T): Promise<T> {
    const seq = (counts.get(method) ?? 0) + 1;
    counts.set(method, seq);
    await options.delay?.({ method, seq, phase: "request" });
    const failure = options.fail?.({ method, seq, phase: "request" });
    if (failure) throw failure;
    const result = work();
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
    getProfile: (profileId) => call("getProfile", () => seriesOf(store, profileId)),
    revertTo: (profileId, version, expectedLatest) =>
      call("revertTo", () =>
        store.transact((tx) => {
          const series = seriesOf(tx, profileId);
          const target = series?.versions.find((v) => v.version === version);
          if (!series || !target) throw new ProfileError("NOT_FOUND", `${profileId} v${version} 없음`);
          if (series.latestVersion !== expectedLatest) throw new ProfileError("STALE_PROFILE", `expectedLatest ${expectedLatest} ≠ ${series.latestVersion}`, series);
          // 최신 버전으로는 되돌리지 않는다 — 같은 내용의 버전만 늘어난다 (SPEC 10.0 A-Q3)
          if (version === series.latestVersion) throw new ProfileError("SCHEMA_INVALID", "이미 최신 버전입니다");
          const record: ProfileVersion = {
            profileId,
            version: series.latestVersion + 1,
            origin: "revert",
            basedOn: version,
            baseReferenceId: target.baseReferenceId,
            base: target.base,
            adjustments: target.adjustments,
            createdAt: now(),
          };
          tx.insert(record);
          return tx.versions(profileId).at(-1)!;
        }),
      ),
  };
}
