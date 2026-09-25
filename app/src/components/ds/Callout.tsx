import type { ReactNode } from "react";
import { cx } from "./cx";
import { Icon, type IconName } from "./Icon";

export type CalloutTone = "info" | "warning" | "negative";

const TONE: Record<CalloutTone, { readonly box: string; readonly icon: string; readonly name: IconName }> = {
  info: { box: "bg-status-informative-bg", icon: "text-status-informative", name: "circle-info" },
  warning: { box: "bg-status-cautionary-bg", icon: "text-status-cautionary", name: "warning" },
  negative: { box: "bg-status-negative-bg", icon: "text-status-negative", name: "warning" },
};

/**
 * 안내·경고 상자 (SPEC 7.2 · 핸드오프 DS Callout을 브랜드 없이 옮김).
 * role을 주지 않는 정적 영역이다(A-9) — 새 경고는 알림 영역 문장으로 따로 알린다.
 */
export function Callout({
  tone,
  title,
  children,
  action,
  className,
}: {
  readonly tone: CalloutTone;
  readonly title: string;
  readonly children?: ReactNode;
  readonly action?: ReactNode;
  readonly className?: string;
}) {
  const t = TONE[tone];
  return (
    <div data-tone={tone} className={cx("flex gap-2.5 rounded-md p-3.5", t.box, className)}>
      <Icon name={t.name} size={20} className={cx("mt-0.5 flex-none", t.icon)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-label-normal">
        <h3 className="ds-label">{title}</h3>
        {children && <div className="ds-body3">{children}</div>}
        {action && <div className="flex flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  );
}
