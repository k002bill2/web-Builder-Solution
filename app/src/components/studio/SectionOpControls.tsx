import { useId } from "react";
import type { MoveDirection } from "../../engine/ops/rules";
import type { Permission } from "../../features/studio/opPermissions";
import { Button } from "../ds/Button";

const DISABLED = "aria-disabled:cursor-not-allowed aria-disabled:text-label-disable aria-disabled:hover:bg-background-normal";

/**
 * 순서 부품(5.2 · E-AC-17) — ≥1024 편집 패널 머리 · <1024 "섹션" 탭 선택 줄 옆과 "편집" 탭 머리에 **같은 부품**.
 * 막힌 버튼 = `aria-disabled` + 보이는 이유(`aria-describedby`) — `disabled`를 쓰지 않아 경계에 닿아도 포커스를 잃지 않는다.
 * 이유 id는 부품마다 `useId` — 두 탭에 동시에 그려도 겹치지 않는다.
 */
export function SectionOpControls({
  up,
  down,
  onMove,
}: {
  readonly up: Permission;
  readonly down: Permission;
  readonly onMove: (direction: MoveDirection, button: HTMLElement) => void;
}) {
  const prefix = useId();
  const reasons = [...new Set([up, down].flatMap((p) => (p.ok ? [] : [p.reason])))];
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
      </div>
      {reasons.map((reason, i) => (
        <p key={reason} id={`${prefix}-reason-${i}`} className="ds-caption1 text-label-alternative">
          {reason}
        </p>
      ))}
    </div>
  );
}
