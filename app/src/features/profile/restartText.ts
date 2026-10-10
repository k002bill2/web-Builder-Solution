/**
 * "새로 시작" 대화상자 문구 (RESTART SPEC r1 5.2·5.3 R-D1~R-D5 · R-B1~R-B3 · R-N1 · R-E1~R-E4). 조작 뒤 청크(RestartDialog) 전용.
 * 안·버전은 `X안 · 프로필 vN`(EQ-2 A 문형) — 규칙에서 만든 문장만.
 */
interface DocLike {
  readonly candidateId: string;
  readonly profileVersion: number;
  readonly revision: number;
  readonly updatedAt: string;
}

/** 저장 시각 "10월 10일 14:05" (R-D2) */
const savedText = (iso: string) => new Date(iso).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });

export const RESTART_TEXT = Object.freeze({
  title: (selected: string) => `${selected}안으로 새로 시작할까요?`,
  current: (doc: DocLike) => `지금 편집 중인 문서: ${doc.candidateId}안 · 프로필 v${doc.profileVersion} · 마지막 저장 ${savedText(doc.updatedAt)} — 이 저장 기준으로 스냅샷에 남습니다`,
  result: (selected: string, version: number) =>
    `지금 문서는 스냅샷 '새로 시작 전'으로 남고, ${selected}안 · 프로필 v${version}로 새 문서를 만듭니다. 지금 문서의 문구·이미지는 새 문서로 옮겨지지 않습니다.`,
  undo: "되돌리려면 편집기의 '스냅샷'에서 '새로 시작 전'을 복원하세요.",
  keep: "자동 스냅샷은 최근 20개만 보관합니다 — 오래 남기려면 편집기에서 '지금 상태 저장'으로 만드세요",
  start: (selected: string) => `${selected}안으로 새로 시작`,
  starting: "새로 시작하는 중…",
  open: (doc: DocLike) => `편집기 열기 (${doc.candidateId}안 · v${doc.profileVersion} 편집 중)`,
  openUnconfirmed: (selected: string, version: number) => `편집기 열기 (${selected}안 · v${version} — 저장 확인 안 됨)`,
  cancel: "취소",
  retry: "다시 시도",
  /** 편집기 열기 = F2와 같은 편집 알림(DOC_EXISTS 문형) */
  opened: (candidateId: string, version: number) => `이미 편집 중인 문서를 엽니다 (${candidateId}안 · 프로필 v${version})`,
  done: (selected: string, version: number, before: DocLike, changeNotice?: string) =>
    `${selected}안 · 프로필 v${version}로 새로 시작했습니다 · 이전 문서(${before.candidateId}안 · v${before.profileVersion})는 스냅샷 '새로 시작 전'에 있습니다${changeNotice ? ` · ${changeNotice}` : ""}`,
  stale: (revision: number) => `다른 곳에서 편집 문서가 바뀌었습니다(r${revision}). 새로 시작하지 않았습니다 — 편집기에서 확인한 뒤 다시 고르세요`,
  readonly: "다른 탭에서 편집 중이라 새로 시작하지 않았습니다 — 그 탭을 닫은 뒤 다시 시도하세요",
  staleTab: "다른 탭에서 바뀐 내용이 있어 새로 시작하지 않았습니다 — 새로고침한 뒤 다시 고르세요",
  failed: "새로 시작하지 못했습니다",
  unconfirmed: "새로 시작했지만 브라우저에 저장됐는지 확인하지 못했습니다 — 다시 시도하면 같은 요청으로 저장을 이어 갑니다",
});

/** R-D5 — 두 버전 대비 결과가 다를 때만 한 줄(글자로 통과/미달). 새 버전도 미달이면 경고 문형 */
export function contrastText(nowVersion: number, nowFails: number, nextVersion: number, nextFails: number): string | undefined {
  if (nowFails === nextFails) return undefined;
  if (nextFails === 0) return `대비 검사: 지금 v${nowVersion} 미달 ${nowFails} · 새 v${nextVersion} 모두 통과`;
  const warn = "새로 시작해도 내보내기 전에 보정이 필요합니다";
  return nowFails > 0
    ? `대비 검사: 새 v${nextVersion}도 미달 ${nextFails} — ${warn}`
    : `대비 검사: 지금 v${nowVersion} 모두 통과 · 새 v${nextVersion} 미달 ${nextFails} — ${warn}`;
}
