import type { InputHTMLAttributes } from "react";
import { Icon, type IconName } from "./Icon";

/** 목업 번들 TextField — 앞 아이콘을 가진 입력 상자. */
export function TextField({
  leadingIcon,
  label,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  readonly leadingIcon?: IconName;
  /** 접근성 이름 */
  readonly label: string;
}) {
  return (
    <label
      className={
        "flex h-12 w-full items-center gap-2 rounded-md border-(length:--border-thick) border-line-normal bg-background-normal px-4 " +
        "transition-[border-color,box-shadow] duration-(--duration-fast) ease-standard " +
        "hover:border-line-strong focus-within:border-primary focus-within:shadow-(--focus-ring)"
      }
    >
      <span className="sr-only">{label}</span>
      {leadingIcon && <Icon name={leadingIcon} size={20} className="text-label-alternative" />}
      <input
        className="min-w-0 flex-1 bg-transparent text-body1 text-label-normal outline-none placeholder:text-label-assistive"
        {...rest}
      />
    </label>
  );
}
