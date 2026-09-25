/** 목업 번들 Checkbox — 사각 박스 + 라벨. */
export function Checkbox({
  label,
  checked,
  onChange,
}: {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-body2 leading-(--line-height-body3) text-label-normal select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer absolute size-0 opacity-0"
      />
      <span
        aria-hidden="true"
        className={
          "inline-flex size-5 flex-none items-center justify-center rounded-[--spacing(1.5)] " +
          "border-(length:--border-thick) border-line-strong bg-background-normal " +
          "transition-[background-color,border-color] duration-(--duration-fast) ease-standard " +
          "peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:shadow-(--focus-ring) " +
          "[&>svg]:scale-60 [&>svg]:opacity-0 peer-checked:[&>svg]:scale-100 peer-checked:[&>svg]:opacity-100"
        }
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-3.25 text-on-primary transition-[opacity,transform] duration-(--duration-fast) ease-standard"
        >
          <path d="M5 12.5l4.5 4.5L19 7" />
        </svg>
      </span>
      <span>{label}</span>
    </label>
  );
}
