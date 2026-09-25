const SIZE = {
  sm: "size-8 text-caption2",
  md: "size-10 text-body1",
} as const;

/** 한글 이름은 앞 2글자, 라틴 이름은 이니셜 (목업 번들 Avatar 규칙). */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0];
  if (!first) return "";
  if (/[ㄱ-힝]/.test(name)) return name.slice(0, 2);
  return (first.charAt(0) + (parts[1]?.charAt(0) ?? "")).toUpperCase();
}

/** 목업 번들 Avatar — 이미지 없이 이니셜 폴백만 쓴다. */
export function Avatar({ name, size = "md" }: { readonly name: string; readonly size?: keyof typeof SIZE }) {
  return (
    <span
      role="img"
      aria-label={name}
      className={`inline-flex flex-none items-center justify-center overflow-hidden rounded-full bg-fill-strong font-semibold text-label-alternative ${SIZE[size]}`}
    >
      {initials(name)}
    </span>
  );
}
