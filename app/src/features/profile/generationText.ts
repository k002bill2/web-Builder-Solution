/**
 * 3안 영역 문구 (DS-2A-04 2.2 P-S17~S24 · 4.3~4.6). 규칙에서 만든 문장만 — 자유 문장 없음. 엔진 청크 전용.
 */
import { GENERATOR_VERSION, isTerminal, type CandidateFailure, type GenerationJob, type GridStyle } from "../../domain/generation";
import type { ProfileVersion } from "../../domain/profile";

export const CANDIDATE_TEXT = Object.freeze({
  preview: "구조 미리보기 — 섹션 구성·비율·모션 배정입니다. 실제 페이지는 생성기 연결 후(M2) 만들어집니다.",
  hint: "같은 버전으로 다시 만들면 같은 결과가 나옵니다",
  blocked: "저장하지 않은 조정이 있습니다 — 저장하면 새 버전으로 만듭니다",
  editReason: "안을 고르면 편집을 시작할 수 있습니다",
  editNotice: "편집기는 다음 단계(2a-05)에서 연결됩니다. 지금은 고른 안만 저장되고, 편집 시작을 누르면 편집기 자리표시 화면으로 이동합니다.",
  allFailed: "3안을 만들지 못했습니다",
  request: "3안 만들기를 요청하지 못했습니다 · 다시 시도하세요",
  retry: "다시 시도를 요청하지 못했습니다 · 다시 시도하세요",
  select: "안을 선택하지 못했습니다 · 다시 시도하세요",
  poll: "진행 상황을 불러오지 못했습니다 · 화면을 다시 열어 확인하세요",
  load: "저장된 3안을 불러오지 못했습니다 · 화면을 다시 열어 확인하세요",
});

export const GRID_LABELS: Readonly<Record<GridStyle, string>> = Object.freeze({ "grid-3": "카드 3열", "grid-2": "카드 2열", masonry: "카드 마소니" });

/** 결정성 캡션 (4.5) — 보는 버전의 입력 */
export const determinismText = (v: ProfileVersion) =>
  `프로필 v${v.version} · 라이브러리 ${v.base.library_version} · seed ${v.base.seed} · 생성기 ${GENERATOR_VERSION} → 같은 입력이면 같은 결과`;

export const doneCount = (job: GenerationJob) => job.candidates.filter((c) => c.status !== "pending").length;

/** 단계 알림 (5.3) — 시작 · 1/3 · 2/3 · 완료. 실패가 섞인 종료는 role=alert가 맡는다(빈 문장) */
export function stageText(job: GenerationJob): string {
  if (!isTerminal(job.state)) {
    const done = doneCount(job);
    return done === 0 ? "3안을 만드는 중입니다" : `3안을 만드는 중입니다 · ${done}/3 완료`;
  }
  return job.state === "succeeded" ? "3안을 만들었습니다" : "";
}

export const failureText = (c: CandidateFailure) => `${c.id}안을 만들지 못했습니다 · ${c.message}`;
