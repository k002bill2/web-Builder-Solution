/**
 * "새로 시작" 문구 (RESTART SPEC r2 5.1 R-C2·R-C3 · 5.2 R-D1~R-D5 · R-B1~R-B3 · 5.3 R-N1 · R-E1~R-E5). 조작 뒤 청크(RestartDialog·restartFlow) 전용.
 * 안·버전은 `X안 · 프로필 vN`(EQ-2 A 문형) — 규칙에서 만든 문장만.
 */
interface DocLike {
  readonly candidateId: string;
  readonly profileVersion: number;
  readonly revision: number;
  readonly updatedAt: string;
}

/** 저장소 INFRA 사유(`data/persistence/infra.ts` 26-29행과 같은 값 — 오류 클래스를 끌어오지 않으려고 값만 둔다. 일치는 테스트가 고정, RS-R8) */
export const TAB_REASON = Object.freeze({
  readonly: "다른 탭에서 편집 중입니다 — 이 탭의 변경은 저장하지 않습니다",
  stale: "다른 탭에서 바뀐 내용이 있습니다 — 새로고침한 뒤 편집하세요",
});

/** 변경 시각 "10월 10일 14:05" (R-D2 · RS-D5 — 월·일 + 24시 시:분, 로컬 시계) */
const changedText = (iso: string) => new Date(iso).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });

/** F2 편집 알림(R-C3 — 저장소 DOC_EXISTS alert와 같은 문장) */
const opened = (doc: Pick<DocLike, "candidateId" | "profileVersion">) => `이미 편집 중인 문서를 엽니다 (${doc.candidateId}안 · 프로필 v${doc.profileVersion})`;

export const RESTART_TEXT = Object.freeze({
  title: (selected: string) => `${selected}안으로 새로 시작할까요?`,
  current: (doc: DocLike) =>
    `지금 편집 중인 문서: ${doc.candidateId}안 · 프로필 v${doc.profileVersion} · 마지막 변경 ${changedText(doc.updatedAt)} — 이 탭에 있는 이 상태 그대로 스냅샷에 남습니다`,
  result: (selected: string, version: number) =>
    `지금 문서는 스냅샷 '새로 시작 전'으로 남고, ${selected}안 · 프로필 v${version}로 새 문서를 만듭니다. 지금 문서의 문구·이미지는 새 문서로 옮겨지지 않습니다.`,
  undo: "되돌리려면 편집기의 '스냅샷'에서 '새로 시작 전'을 복원하세요.",
  keep: "자동 스냅샷은 최근 20개만 보관합니다 — 오래 남기려면 편집기에서 '지금 상태 저장'으로 만드세요",
  start: (selected: string) => `${selected}안으로 새로 시작`,
  starting: "새로 시작하는 중…",
  open: (doc: Pick<DocLike, "candidateId" | "profileVersion">) => `편집기 열기 (${doc.candidateId}안 · v${doc.profileVersion} 편집 중)`,
  cancel: "취소",
  retry: "다시 시도",
  opened,
  /** F2·F3 편집 알림 — 같은 버전이면 `alert`(없으면 R-C3) 그대로, 다르면 R-C2 뒷부분(테마 바꾸기 안내)을 잇는다 */
  openedAt: (doc: Pick<DocLike, "candidateId" | "profileVersion">, version: number, alert = opened(doc)) =>
    doc.profileVersion === version ? alert : `${alert} · v${version}를 쓰려면 '테마 바꾸기'를 누르세요 — 내용은 그대로입니다`,
  done: (selected: string, version: number, before: DocLike, changeNotice?: string) =>
    `${selected}안 · 프로필 v${version}로 새로 시작했습니다 · 이전 문서(${before.candidateId}안 · v${before.profileVersion})는 스냅샷 '새로 시작 전'에 있습니다${changeNotice ? ` · ${changeNotice}` : ""}`,
  stale: (revision: number) => `다른 곳에서 편집 문서가 바뀌었습니다(r${revision}). 새로 시작하지 않았습니다 — 편집기에서 확인한 뒤 다시 고르세요`,
  staleSame: (doc: DocLike) =>
    `다른 곳에서 편집 문서가 이미 ${doc.candidateId}안 · 프로필 v${doc.profileVersion}(r${doc.revision})로 바뀌었습니다. 새로 시작하지 않았습니다 — 편집기에서 여세요`,
  readonly: "다른 탭에서 편집 중이라 새로 시작하지 않았습니다 — 그 탭을 닫은 뒤 다시 시도하세요",
  staleTab: "다른 탭에서 바뀐 내용이 있어 새로 시작하지 않았습니다 — 새로고침한 뒤 다시 고르세요",
  failed: "새로 시작하지 못했습니다",
  unconfirmed: (before: DocLike) =>
    `새로 시작했지만 브라우저에 저장됐는지 확인하지 못했습니다 — 다시 시도하면 같은 요청으로 저장을 이어 갑니다. 지금 닫으면 새로고침 때 이전 문서(${before.candidateId}안 · v${before.profileVersion})로 돌아갈 수 있습니다`,
  unknown: "새로 시작됐는지 확인하지 못했습니다 — 다시 시도해도 같은 요청이라 두 번 바뀌지 않습니다",
});

/** R-D5 — 두 버전 대비 결과가 다를 때만 한 줄(글자로 통과/미달). 한쪽이라도 판정 불가(undefined)면 줄 없음(RS-D6) */
export function contrastText(nowVersion: number, nowFails: number | undefined, nextVersion: number, nextFails: number | undefined): string | undefined {
  if (nowFails === undefined || nextFails === undefined || nowFails === nextFails) return undefined;
  if (nextFails === 0) return `대비 검사: 지금 v${nowVersion} 미달 ${nowFails} · 새 v${nextVersion} 모두 통과`;
  const warn = "새로 시작해도 내보내기 전에 보정이 필요합니다";
  return nowFails > 0
    ? `대비 검사: 새 v${nextVersion}도 미달 ${nextFails} — ${warn}`
    : `대비 검사: 지금 v${nowVersion} 모두 통과 · 새 v${nextVersion} 미달 ${nextFails} — ${warn}`;
}
