/**
 * 보드 초안 패널 P-S25 — 이어받을 조정 (DS-2A-04 2.2 · 6.1-3). 확정한 프로필이 있고 계열 최신에 조정이 있을 때만 불러오는
 * 조건부 청크다(진입 직후 자동 로드 목록 밖, 2a-04b1 번들). 저장소 확정과 같은 carryOverAdjustments를 같은 입력으로 부른다 —
 * 여기 "이어짐"으로 보인 조정 = 확정하면 저장되는 adjustments.
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

/** 캡션 "이어지는 조정 N개 · 지워지는 조정 M개" + 펼침 "조정 목록". 조정 0개면 없음. 상태는 글자로만 알린다(색 하나로 알리지 않음) */
export function CarryOverNotice({ confirmedBase, adjustments, nextBase }: CarryOverNoticeProps) {
  const plan = carryOverAdjustments(confirmedBase, adjustments, nextBase);
  if (plan.kept.length + plan.dropped.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <p className="ds-caption1 text-label-neutral">
        이어지는 조정 {plan.kept.length}개 · 지워지는 조정 {plan.dropped.length}개
      </p>
      <details className="ds-caption1 text-label-alternative">
        <summary className="cursor-pointer">조정 목록</summary>
        <ul className="mt-1 flex flex-col gap-0.5">
          {carryOverLines(plan, adjustments).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

export type CarryOverNoticeComponent = typeof CarryOverNotice;
