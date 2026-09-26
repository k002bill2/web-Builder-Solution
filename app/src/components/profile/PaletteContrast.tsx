import { useId } from "react";
import { Link } from "react-router";
import type { PaletteEntry } from "../../domain/referenceDetail";
import { PALETTE_ROLE_LABELS } from "../../features/profile/profileFields";
import type { ContrastView, ProposalView } from "../../features/profile/profileMessages";
import { Button } from "../ds/Button";
import { Icon } from "../ds/Icon";

/** 견본 한 칸 — 보정으로 바뀐 역할은 보드 값(`boardHex`)을 캡션으로 (5.4 "조정됨") */
export interface SwatchEntry extends PaletteEntry {
  readonly boardHex?: string;
}

/** 견본은 장식(aria-hidden) — 정보는 옆 글자. 흰 견본이 흰 면에서 사라지지 않게 테두리 (3.3) */
function Swatch({ hex }: { readonly hex: string }) {
  return <span aria-hidden="true" className="inline-block size-5 flex-none rounded-xs border border-line-normal" style={{ backgroundColor: hex }} />;
}

/**
 * 3.3 역할 팔레트 · 대비 검사 C-1~C-5 · 보정 제안 + "보정값 쓰기"(Q6 → 저장 안 된 조정) · 충돌(P-S15, 버튼 없음).
 * 쓴 보정은 버튼을 남기고(포커스 유지) aria-disabled "보정값을 썼습니다"로 바꾼다. 이전 버전 보기면 aria-disabled + 이유(P-S07).
 */
export function PaletteContrast({
  palette,
  contrast,
  onWrite,
  blockedReason,
}: {
  readonly palette: readonly SwatchEntry[];
  readonly contrast: ContrastView;
  readonly onWrite?: (proposal: ProposalView) => void;
  readonly blockedReason?: string;
}) {
  const reasonId = useId();
  const writtenId = useId();
  return (
    <section aria-labelledby="profile-palette" className="flex flex-col gap-4">
      <h2 id="profile-palette" className="ds-heading2">역할 팔레트와 대비</h2>
      <ul aria-label="역할 팔레트" className="grid grid-cols-[repeat(auto-fill,minmax(--spacing(36),1fr))] gap-2">
        {palette.map((p) => (
          <li key={p.role} className="ds-body3 flex items-center gap-2">
            <Swatch hex={p.hex} />
            <span className="flex flex-col">
              <span>
                {PALETTE_ROLE_LABELS[p.role]} ({p.role}) <span className="ds-mono text-label-alternative">{p.hex.toUpperCase()}</span>
              </span>
              {p.boardHex && <span className="ds-caption1 text-label-alternative">조정됨 · 보드 값 {p.boardHex}</span>}
            </span>
          </li>
        ))}
      </ul>
      <h3 className="ds-label">대비 검사 · 목표 {contrast.target}</h3>
      <ul aria-label="대비 검사" className="flex flex-col gap-1.5">
        {contrast.checks.map((c) => (
          <li key={c.id} className="ds-body3 flex flex-wrap items-center gap-x-2">
            <span className="ds-mono">{c.id}</span>
            <span className="text-label-alternative">{c.label}</span>
            <span className="ds-mono">{c.ratio}</span>
            <span className={c.pass ? "inline-flex items-center gap-1 text-status-positive-text" : "inline-flex items-center gap-1 font-semibold text-status-negative-text"}>
              <Icon name={c.pass ? "circle-check" : "warning"} size={16} />
              {c.pass ? "통과" : "미달"}
            </span>
          </li>
        ))}
      </ul>
      {contrast.proposals.length > 0 && (
        <ul aria-label="보정 제안" className="flex flex-col gap-3">
          {contrast.proposals.map((p) => (
            <li key={p.role} className="ds-body3 flex flex-col gap-1.5 rounded-md border border-line-neutral p-3">
              <span className="flex items-center gap-1.5" aria-hidden="true">
                <Swatch hex={p.from} />
                <Icon name="arrow-right" size={16} />
                <Swatch hex={p.to} />
              </span>
              {p.conflict ? (
                <>
                  <p>{p.conflict.text}</p>
                  <p className="ds-caption1 text-label-alternative">{p.conflict.detail}</p>
                  <Link to="/compare" className="ds-label text-primary hover:text-primary-hover">
                    {p.conflict.link}
                  </Link>
                </>
              ) : (
                <>
                  <p>{p.text}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="self-start aria-disabled:cursor-not-allowed aria-disabled:text-label-alternative"
                    aria-label={`${p.written ? "보정값을 썼습니다" : "보정값 쓰기"} (${PALETTE_ROLE_LABELS[p.role]} ${p.role})`}
                    aria-disabled={p.written || blockedReason !== undefined || undefined}
                    aria-describedby={blockedReason ? reasonId : p.written ? writtenId : undefined}
                    onClick={() => {
                      if (!p.written && !blockedReason) onWrite?.(p);
                    }}
                  >
                    {p.written ? "보정값을 썼습니다" : "보정값 쓰기"}
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {blockedReason && contrast.proposals.length > 0 && (
        <p id={reasonId} className="ds-caption1 text-label-alternative">
          {blockedReason}
        </p>
      )}
      {contrast.proposals.some((p) => p.written) && (
        <p id={writtenId} className="ds-caption1 text-label-alternative">
          쓴 보정값은 조정을 저장하면 새 버전에 적용됩니다
        </p>
      )}
    </section>
  );
}
