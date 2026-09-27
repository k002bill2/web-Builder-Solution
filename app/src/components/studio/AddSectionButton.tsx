import { useId } from "react";
import type { Permission } from "../../features/studio/opPermissions";
import { Button } from "../ds/Button";

/**
 * "섹션 추가"(5.3 · E-S12) — 아이콘 `plus` + 보이는 글자(B-10). 본문 9개면 `aria-disabled` + 보이는 이유, 눌러도 대화상자를 열지 않는다.
 * `onOpen`은 누른 버튼을 받는다 — 대화상자를 닫으면 포커스를 이 버튼으로 돌린다(5.15).
 */
export function AddSectionButton({ permission, onOpen }: { readonly permission: Permission; readonly onOpen: (button: HTMLElement) => void }) {
  const reasonId = useId();
  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="outline"
        size="sm"
        leadingIcon="plus"
        aria-disabled={permission.ok ? undefined : true}
        aria-describedby={permission.ok ? undefined : reasonId}
        onClick={(event) => {
          if (permission.ok) onOpen(event.currentTarget);
        }}
        className="self-start aria-disabled:cursor-not-allowed aria-disabled:text-label-disable"
      >
        섹션 추가
      </Button>
      {!permission.ok && (
        <p id={reasonId} className="ds-caption1 text-label-alternative">
          {permission.reason}
        </p>
      )}
    </div>
  );
}
