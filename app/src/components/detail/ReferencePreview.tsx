import type { DesignReference } from "../../domain/reference";

/** 자체 렌더 미리보기 (목업 133~138행) — 외부 캡처 없이 레퍼런스 팔레트로 그린 와이어프레임. */
export function ReferencePreview({ reference: r }: { readonly reference: DesignReference }) {
  const p = r.colorPalette;
  return (
    <figure className="mt-5">
      <div
        role="img"
        aria-label={`${r.title} 미리보기 (자체 렌더 와이어프레임)`}
        className="flex aspect-[16/8] flex-col gap-2.5 rounded-lg border border-line-neutral bg-background-alternative px-5 py-4"
      >
        <div className="flex justify-between">
          <span className="h-1.5 w-10 rounded-[--spacing(0.5)]" style={{ backgroundColor: p.ink }} />
          <span className="h-1.5 w-30 rounded-[--spacing(0.5)] bg-line-normal" />
        </div>
        <div
          className="flex flex-1 flex-col items-start justify-end gap-2.5 rounded-sm p-4.5"
          style={{ backgroundColor: p.primary }}
        >
          <span className="h-3 w-[36%] rounded-[--spacing(0.75)]" style={{ backgroundColor: p.surface }} />
          <span className="h-2 w-[22%] rounded-[--spacing(0.75)] opacity-70" style={{ backgroundColor: p.surface }} />
        </div>
        <div className="flex h-14 gap-2.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="flex-1 rounded-[--spacing(1.5)] border border-line-alternative bg-surface-elevated" />
          ))}
        </div>
      </div>
      <figcaption className="ds-caption1 mt-2 text-label-alternative">
        자체 렌더 미리보기 — 외부 캡처를 사용하지 않습니다
      </figcaption>
    </figure>
  );
}
