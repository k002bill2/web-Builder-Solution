import { useId } from "react";
import { Link } from "react-router";
import type { MoveDirection } from "../../engine/ops/rules";
import { isPurposeReason, type Permission } from "../../features/studio/opPermissions";
import { Button } from "../ds/Button";

const DISABLED = "aria-disabled:cursor-not-allowed aria-disabled:text-label-disable aria-disabled:hover:bg-background-normal";

/**
 * 순서·삭제 부품(5.2 · 5.4 · E-AC-17·19) — ≥1024 편집 패널 머리 · <1024 "섹션" 탭 선택 줄 옆과 "편집" 탭 머리에 **같은 부품**.
 * 막힌 버튼 = `aria-disabled` + 보이는 이유(`aria-describedby`) — `disabled`를 쓰지 않아 경계에 닿아도 포커스를 잃지 않는다.
 * 이유 id는 부품마다 `useId` — 두 탭에 동시에 그려도 겹치지 않는다. 목적 이유(R-03·R-04) 옆에는 "프로필에서 목적 바꾸기"(`profileHref`).
 */
export function SectionOpControls({
  up,
  down,
  remove,
  onMove,
  onRemove,
  profileHref,
}: {
  readonly up: Permission;
  readonly down: Permission;
  readonly remove: Permission;
  readonly onMove: (direction: MoveDirection, button: HTMLElement) => void;
  readonly onRemove: () => void;
  readonly profileHref: string;
}) {
  const prefix = useId();
  const reasons = [...new Set([up, down, remove].flatMap((p) => (p.ok ? [] : [p.reason])))];
  const reasonId = (p: Permission) => (p.ok ? undefined : `${prefix}-reason-${reasons.indexOf(p.reason)}`);
  const control = (label: string, permission: Permission, press: (button: HTMLElement) => void) => (
    <Button
      variant="outline"
      size="sm"
      aria-disabled={permission.ok ? undefined : true}
      aria-describedby={reasonId(permission)}
      onClick={(event) => {
        if (permission.ok) press(event.currentTarget);
      }}
      className={DISABLED}
    >
      {label}
    </Button>
  );
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-2">
        {control("위로", up, (button) => onMove("up", button))}
        {control("아래로", down, (button) => onMove("down", button))}
        {control("삭제", remove, onRemove)}
      </div>
      {reasons.map((reason, i) => (
        <p key={reason} id={`${prefix}-reason-${i}`} className="ds-caption1 text-label-alternative">
          {reason}
        </p>
      ))}
      {reasons.some(isPurposeReason) && (
        <Link to={profileHref} className="ds-label self-start text-primary hover:text-primary-hover">
          프로필에서 목적 바꾸기
        </Link>
      )}
    </div>
  );
}
