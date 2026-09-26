import { useEffect, useState } from "react";
import { useProfileRepository } from "../../data/ProfileRepositoryContext";
import { useReferenceRepository } from "../../data/ReferenceRepositoryContext";
import { useThrowToBoundary } from "../../data/useThrowToBoundary";
import type { ProfileSummary } from "../../domain/profile";
import type { DesignReference } from "../../domain/reference";

export interface ProfileListItem {
  readonly summary: ProfileSummary;
  /** 기준 레퍼런스 — 회수·비노출이면 undefined */
  readonly reference: DesignReference | undefined;
}

/** `/profile` 목록 (P-S04·05). 로딩 중이면 null */
export function useProfileList(): readonly ProfileListItem[] | null {
  const profiles = useProfileRepository();
  const references = useReferenceRepository();
  const fail = useThrowToBoundary();
  const [items, setItems] = useState<readonly ProfileListItem[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const summaries = await profiles.listProfiles();
      const found = await Promise.all(summaries.map((s) => references.getById(s.baseReferenceId)));
      if (!cancelled) setItems(summaries.map((summary, i) => ({ summary, reference: found[i] })));
    };
    load().catch((error: unknown) => {
      if (!cancelled) fail(error);
    });
    return () => {
      cancelled = true;
    };
  }, [profiles, references, fail]);
  return items;
}
