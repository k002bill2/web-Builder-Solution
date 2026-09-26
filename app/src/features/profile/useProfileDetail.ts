/**
 * 프로필 상세 상태 (DS-2A-04 2.2 P-S01~S03·S09·S12). 계열·엔진·출처 레퍼런스를 함께 읽고, 되돌리기를 한다.
 * 버전을 만드는 쓰기는 화면이 본 최신(`expectedLatest`)을 보낸다 — 다르면 STALE_PROFILE(최신 계열 동봉)로 거부된다.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useProfileRepository } from "../../data/ProfileRepositoryContext";
import { ProfileError } from "../../data/profileRepository";
import { useReferenceRepository } from "../../data/ReferenceRepositoryContext";
import { useThrowToBoundary } from "../../data/useThrowToBoundary";
import type { ProfileSeries } from "../../domain/profile";
import type { DesignReference } from "../../domain/reference";
import type { ProfileEngine } from "./profileEngine";
import { emitProfileEvent } from "./profileEvents";

export type Sources = ReadonlyMap<string, DesignReference | undefined>;

interface Loaded {
  readonly series: ProfileSeries | undefined;
  readonly engine: ProfileEngine;
  readonly sources: Sources;
}

export interface Notice {
  readonly text: string;
  readonly key: number;
}

export type ProfileDetailState =
  | { readonly status: "loading" }
  | { readonly status: "not-found" }
  | { readonly status: "ready"; readonly series: ProfileSeries; readonly engine: ProfileEngine; readonly sources: Sources };

export function useProfileDetail(profileId: string) {
  const profiles = useProfileRepository();
  const references = useReferenceRepository();
  const fail = useThrowToBoundary();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [status, setStatus] = useState<Notice>({ text: "", key: 0 });
  const [alert, setAlert] = useState<string | null>(null);
  const [reverting, setReverting] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [{ profileEngine }, series] = await Promise.all([import("./profileEngine"), profiles.getProfile(profileId)]);
      const ids = [...new Set(series?.versions.flatMap((v) => [v.baseReferenceId, ...v.base.source_reference_ids]) ?? [])];
      const found = await Promise.all(ids.map((id) => references.getById(id)));
      if (!cancelled) setLoaded({ series, engine: profileEngine, sources: new Map(ids.map((id, i) => [id, found[i]])) });
    };
    load().catch((error: unknown) => {
      if (!cancelled) fail(error);
    });
    return () => {
      cancelled = true;
    };
  }, [profiles, references, profileId, fail]);

  /** 되돌리기 (P-S09 · P-S12). 성공하면 새 버전 번호를 돌려준다. 되돌리는 중 연타는 무시 */
  const revert = useCallback(
    async (version: number): Promise<number | undefined> => {
      const current = loaded?.series;
      if (!loaded || !current || busy.current) return undefined;
      busy.current = true;
      setReverting(true);
      setAlert(null);
      const { revertMessages } = loaded.engine;
      try {
        const created = await profiles.revertTo(profileId, version, current.latestVersion);
        const series = (await profiles.getProfile(profileId)) ?? current;
        setLoaded((l) => l && { ...l, series });
        setStatus((s) => ({ text: revertMessages.done(version, created.version), key: s.key + 1 }));
        emitProfileEvent({ name: "profile_saved", version: created.version, origin: created.origin });
        return created.version;
      } catch (error) {
        const stale = error instanceof ProfileError && error.code === "STALE_PROFILE" ? error.series : undefined;
        if (stale) setLoaded((l) => l && { ...l, series: stale });
        setAlert(stale ? revertMessages.stale(stale.latestVersion) : revertMessages.failed);
        emitProfileEvent({ name: "profile_save_failed", reason: error instanceof ProfileError ? error.code : "UNKNOWN" });
        return undefined;
      } finally {
        busy.current = false;
        setReverting(false);
      }
    },
    [loaded, profiles, profileId],
  );

  /** "프로필 알림" 영역에 문장을 낸다(같은 문장이어도 key가 바뀌어 다시 읽힌다) */
  const announce = useCallback((text: string) => setStatus((s) => ({ text, key: s.key + 1 })), []);

  const state: ProfileDetailState = !loaded
    ? { status: "loading" }
    : !loaded.series
      ? { status: "not-found" }
      : { status: "ready", series: loaded.series, engine: loaded.engine, sources: loaded.sources };
  return { state, status, alert, reverting, revert, announce };
}
