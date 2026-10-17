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
  cleared: "이 브라우저 데이터가 지워졌습니다 — 새로고침하세요",
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
  // ── RESTART SPEC-4 r0.3a 5절 — 미확인 이어받기 · 저장 확인 · 폐기 ──
  /** R-E4·R-E5 뒤에 붙는 경고(5.1) */
  leaveWarning: "확인 전에 새로고침하거나 탭을 닫으면 새로 시작과 그 뒤 편집이 사라집니다",
  /** R-E6 — 새로 시작 미반영 · 저장 확인 전 */
  notApplied: (doc?: Pick<DocLike, "candidateId" | "profileVersion">) =>
    `새로 시작은 반영되지 않았습니다${doc ? ` — 지금 문서는 ${doc.candidateId}안 · v${doc.profileVersion}입니다` : ""}. 이 문서가 브라우저에 저장됐는지는 아직 확인하지 않았습니다 — 저장 확인을 누르세요`,
  confirm: "저장 확인",
  confirming: "확인하는 중…",
  confirmed: "저장을 확인했습니다",
  confirmedOpen: (doc: Pick<DocLike, "candidateId" | "profileVersion">) => `저장을 확인했습니다 · ${opened(doc)}`,
  notYet: "아직 저장을 확인하지 못했습니다",
  confirmReadonly: "다른 탭에서 편집 중이라 저장을 확인하지 못했습니다 — 그 탭을 닫은 뒤 저장 확인을 다시 누르세요",
  confirmStaleTab: "다른 탭에서 바뀐 내용이 있어 이 탭은 더 저장할 수 없습니다 — 이 탭의 확인되지 않은 변경은 새로고침하면 사라집니다",
  confirmCleared: "이 브라우저 데이터가 지워져 이 탭은 더 저장할 수 없습니다 — 이 탭의 확인되지 않은 변경은 새로고침하면 사라집니다",
  imagesMissing: "이 문서의 일부 이미지는 이 탭에서 더 저장할 수 없습니다 — 새로고침하면 확인되지 않은 변경이 사라집니다",
  // create(C-E#) — 편집 시작 Callout
  createReadonly: "다른 탭에서 편집 중이라 편집을 시작하지 않았습니다 — 그 탭을 닫은 뒤 다시 시도하세요",
  createStaleTab: "다른 탭에서 바뀐 내용이 있어 편집을 시작하지 않았습니다 — 새로고침한 뒤 다시 고르세요",
  createCleared: "이 브라우저 데이터가 지워져 편집을 시작하지 않았습니다 — 새로고침하세요",
  createUnconfirmed: "편집 문서를 만들었지만 브라우저에 저장됐는지 확인하지 못했습니다 — 시작 다시 시도를 누르면 같은 요청으로 저장을 이어 갑니다. 확인 전에 새로고침하거나 탭을 닫으면 이 편집 문서는 사라집니다",
  createUnknown: "편집 문서를 만들었는지 확인하지 못했습니다 — 시작 다시 시도는 같은 요청이라 두 번 만들어지지 않습니다",
  createNotApplied: (doc?: Pick<DocLike, "candidateId" | "profileVersion">) =>
    `편집 시작은 반영되지 않았습니다${doc ? ` — 이 프로젝트에는 이미 문서(${doc.candidateId}안 · v${doc.profileVersion})가 있습니다` : ""}. 그 문서가 브라우저에 저장됐는지는 아직 확인하지 않았습니다 — 저장 확인을 누르면 확인한 뒤 엽니다`,
  createNotAppliedAbsent: "편집 시작이 반영되지 않았습니다 — 프로필에서 다시 고르세요",
  retrySave: "시작 다시 시도",
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
