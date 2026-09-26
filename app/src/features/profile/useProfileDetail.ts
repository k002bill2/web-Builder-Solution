/**
 * 프로필 상세 상태 (DS-2A-04 2.2 P-S01~S03·S09·S11·S12). 계열·엔진·출처 레퍼런스·조정 범위를 함께 읽고, 되돌리기·조정 저장을 한다.
 * 조정 범위(getAdjustmentRange)는 진입 때 자동으로 읽는다 — 저장소 쓰기 본문 청크가 /profile 진입 직후 합계에 든다(번들 스크립트 auto).
 * 버전을 만드는 쓰기는 화면이 본 최신(`expectedLatest`)을 보낸다 — 다르면 STALE_PROFILE(최신 계열 동봉)로 거부된다.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useProfileRepository } from "../../data/ProfileRepositoryContext";
import { ProfileError } from "../../data/profileRepository";
import { useReferenceRepository } from "../../data/ReferenceRepositoryContext";
import { useThrowToBoundary } from "../../data/useThrowToBoundary";
import type { AdjustmentRange, ProfileAdjustments, ProfileSeries } from "../../domain/profile";
import type { DesignReference } from "../../domain/reference";
import type { SaveAlert } from "./AdjustmentPanel";
import type { ProfileEngine } from "./profileEngine";
import { emitProfileEvent } from "./profileEvents";

export type Sources = ReadonlyMap<string, DesignReference | undefined>;

interface Loaded {
  readonly series: ProfileSeries | undefined;
  /** 최신 버전의 조정 허용 범위 (3.4) */
  readonly range: AdjustmentRange | undefined;
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
  | { readonly status: "ready"; readonly series: ProfileSeries; readonly range: AdjustmentRange; readonly engine: ProfileEngine; readonly sources: Sources };

export function useProfileDetail(profileId: string) {
  const profiles = useProfileRepository();
  const references = useReferenceRepository();
  const fail = useThrowToBoundary();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [status, setStatus] = useState<Notice>({ text: "", key: 0 });
  const [alert, setAlert] = useState<string | null>(null);
  const [reverting, setReverting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveAlert, setSaveAlert] = useState<SaveAlert | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [{ profileEngine }, series] = await Promise.all([import("./profileEngine"), profiles.getProfile(profileId)]);
      const ids = [...new Set(series?.versions.flatMap((v) => [v.baseReferenceId, ...v.base.source_reference_ids]) ?? [])];
      const [range, ...found] = await Promise.all([series && profiles.getAdjustmentRange(profileId, series.latestVersion), ...ids.map((id) => references.getById(id))]);
      if (!cancelled) setLoaded({ series, range, engine: profileEngine, sources: new Map(ids.map((id, i) => [id, found[i]])) });
    };
    load().catch((error: unknown) => {
      if (!cancelled) fail(error);
    });
    return () => {
      cancelled = true;
    };
  }, [profiles, references, profileId, fail]);

  /** 새 최신 계열과 그 범위 — 범위를 못 읽으면 이전 범위를 쓴다(쓰기는 이미 끝났다) */
  const withRange = useCallback(
    async (series: ProfileSeries, previous: AdjustmentRange | undefined) => ({
      series,
      range: await profiles.getAdjustmentRange(profileId, series.latestVersion).catch(() => previous),
    }),
    [profiles, profileId],
  );

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
        const next = await withRange((await profiles.getProfile(profileId)) ?? current, loaded.range);
        setLoaded((l) => l && { ...l, ...next });
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
    [loaded, profiles, profileId, withRange],
  );

  /**
   * 조정 저장 (P-S11 · P-S12). 성공하면 true. 저장 중 연타는 무시. 실패하면 계열을 다시 읽지 않는다 —
   * 같은 인자로 다시 시도하면 커밋된 요청은 멱등 결과(같은 버전)를 받는다(6.3 r3 · 10.0.2 Q1). STALE_PROFILE이면 최신을 반영한다
   */
  const save = useCallback(
    async (adjustments: ProfileAdjustments): Promise<boolean> => {
      const current = loaded?.series;
      if (!loaded || !current || busy.current) return false;
      busy.current = true;
      setSaving(true);
      setSaveAlert(null);
      const { saveMessages } = loaded.engine;
      try {
        const created = await profiles.saveAdjustments(profileId, current.latestVersion, adjustments);
        const next = await withRange((await profiles.getProfile(profileId)) ?? current, loaded.range);
        setLoaded((l) => l && { ...l, ...next });
        setStatus((s) => ({ text: saveMessages.done(created.version), key: s.key + 1 }));
        emitProfileEvent({ name: "profile_saved", version: created.version, origin: created.origin });
        return true;
      } catch (error) {
        const stale = error instanceof ProfileError && error.code === "STALE_PROFILE" ? error.series : undefined;
        if (stale) {
          const next = await withRange(stale, loaded.range);
          setLoaded((l) => l && { ...l, ...next });
        }
        setSaveAlert(stale ? { text: saveMessages.stale(stale.latestVersion), retry: false } : { text: saveMessages.failed, retry: true });
        emitProfileEvent({ name: "profile_save_failed", reason: error instanceof ProfileError ? error.code : "UNKNOWN" });
        return false;
      } finally {
        busy.current = false;
        setSaving(false);
      }
    },
    [loaded, profiles, profileId, withRange],
  );

  /** "프로필 알림" 영역에 문장을 낸다(같은 문장이어도 key가 바뀌어 다시 읽힌다) */
  const announce = useCallback((text: string) => setStatus((s) => ({ text, key: s.key + 1 })), []);
  /** 그 문장이 아직 알림 영역에 있을 때만 지운다 — 뒤에 낸 다른 알림은 두고 */
  const withdraw = useCallback((text: string) => setStatus((s) => (s.text === text ? { text: "", key: s.key } : s)), []);

  const state: ProfileDetailState = !loaded
    ? { status: "loading" }
    : !loaded.series || !loaded.range
      ? { status: "not-found" }
      : { status: "ready", series: loaded.series, range: loaded.range, engine: loaded.engine, sources: loaded.sources };
  return { state, status, alert, reverting, revert, announce, withdraw, saving, saveAlert, save };
}
