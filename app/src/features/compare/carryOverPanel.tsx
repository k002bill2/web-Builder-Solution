/**
 * 보드 초안 패널 P-S25 — 이어받을 조정 판정·목록 (DS-2A-04 2.2 · 6.1-3 · r6). 사용자가 "이어받기 확인"을 펼칠 때만 받는
 * 조작 뒤 청크다(carryOverLoader, 진입 직후 합계 밖). 저장소 확정과 같은 carryOverAdjustments를 같은 입력으로 부른다 —
 * 여기 "이어짐"으로 보인 조정 = 확정하면 저장되는 adjustments. 캡션·펼침 틀은 CarryOverCaption(엔진 청크)이 그린다.
 */
import type { DesignProfileInput } from "../../domain/compareBoard";
import type { ProfileAdjustments } from "../../domain/profile";
import { carryOverAdjustments } from "../../domain/profileAdjustments";
import { carryOverLines } from "../profile/adjustmentText";

export interface CarryOverNoticeProps {
  /** 보드가 확정한 버전의 base — "보드에서 바뀐 필드" 비교 기준 */
  readonly confirmedBase: DesignProfileInput;
  /** 계열 최신 버전의 조정 */
  readonly adjustments: ProfileAdjustments;
  /** 지금 보드 초안 */
  readonly nextBase: DesignProfileInput;
}

/** "이어지는 조정 N개 · 지워지는 조정 M개" + 줄 목록. 조정 0개면 없음. 상태는 글자로만 알린다(색 하나로 알리지 않음) */
export function CarryOverNotice({ confirmedBase, adjustments, nextBase }: CarryOverNoticeProps) {
  const plan = carryOverAdjustments(confirmedBase, adjustments, nextBase);
  if (plan.kept.length + plan.dropped.length === 0) return null;
  return (
    <>
      <p className="text-label-neutral">
        이어지는 조정 {plan.kept.length}개 · 지워지는 조정 {plan.dropped.length}개
      </p>
      <ul className="flex flex-col gap-0.5">
        {carryOverLines(plan, adjustments).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </>
  );
}

export type CarryOverNoticeComponent = typeof CarryOverNotice;
