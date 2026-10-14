/** 미확인 기억 공용 문구(RESTART SPEC-4 r0.3a 5.2·5.5) — `/projects` 행 · 폐기 확인. 프로필 전용 문구는 profile/restartText */
interface Head {
  readonly candidateId: string;
  readonly profileVersion: number;
}
const at = (head?: Head) => (head ? `(${head.candidateId}안 · v${head.profileVersion})` : "");

export const PENDING_TEXT = Object.freeze({
  // P-U1 — 행 상태 글자(색이 아니라 글자로)
  restart: (version: number, selected: string) => `새로 시작한 문서(${selected}안 · v${version})가 브라우저에 저장됐는지 확인하지 못했습니다`,
  create: (version: number, selected: string) => `편집 시작한 문서(${selected}안 · v${version})가 브라우저에 저장됐는지 확인하지 못했습니다`,
  unknown: (version: number, selected: string) => `${selected}안 · v${version}로 바뀌었는지 확인하지 못했습니다`,
  record: (head?: Head) => `이 문서${at(head)}가 브라우저에 저장됐는지 확인하지 못했습니다`,
  retrySave: "저장 다시 시도",
  confirm: "저장 확인",
  working: "확인하는 중…",
  // P-U5 — 상시 캡션
  caption: "확인 전에 새로고침하거나 탭을 닫으면 확인되지 않은 변경이 사라집니다 — 이전에 저장된 상태로 돌아갑니다",
  // P-U2 — 성공
  confirmed: "저장을 확인했습니다 — 편집기를 열 수 있습니다",
  // 폐기 확인(5.5)
  discard: "버리고 새로고침",
  discardTitle: "확인되지 않은 변경 버리기",
  discardBody: "이 탭에서 저장을 확인하지 못한 변경(새로 시작 · 편집 문서 · 그 뒤 편집)을 모두 버리고, 브라우저에 마지막으로 저장된 상태로 다시 엽니다. 되돌릴 수 없습니다.",
  keepIt: "취소",
});
