/** 초안 상태 태그·확정 버튼 문구 (S-15·S-16 · ADR-005 Q3). 도메인 값 import 없음 — 첫 화면 청크에 둔다. */
import type { DraftStatus } from "../../domain/compareBoard";

export function statusLabel(status: DraftStatus): string {
  if (status.kind === "unconfirmed") return "확정 전";
  if (status.kind === "confirmed") return `v${status.version} 확정됨`;
  return `v${status.version} 이후 변경됨`;
}

/** 확정 이후에는 같은 프로필 계열의 새 버전 — 확정 대상이 "새 프로젝트"면 버튼 이름이 선택을 따른다(DS-2A-05 J-S10) */
export function confirmLabel(status: DraftStatus, confirming: boolean, toNewProject = false): string {
  if (confirming) return "확정 중…";
  if (status.kind === "unconfirmed") return "프로필 확정 (v1)";
  if (toNewProject) return "새 프로젝트로 확정";
  const next = status.nextVersion ?? status.version + 1;
  return `새 버전으로 확정 (v${next})`;
}
