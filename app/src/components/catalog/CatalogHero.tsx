import { brand } from "../../brand/brand.config";
import type { IndustryId } from "../../domain/reference";
import { INDUSTRY_LABELS, INDUSTRY_ORDER } from "../../fixtures/catalogFilters";
import { Button } from "../ds/Button";
import { Chip } from "../ds/Chip";
import { TextField } from "../ds/TextField";

/** 카탈로그 상단: 제목·검색·추천 받기·업종 칩 (목업 65~74행). */
export function CatalogHero({
  industry,
  onIndustryChange,
  onRecommend,
}: {
  readonly industry: IndustryId | undefined;
  readonly onIndustryChange: (industry: IndustryId | undefined) => void;
  readonly onRecommend: () => void;
}) {
  return (
    <section className="border-b border-line-neutral bg-background-alternative px-4 pt-8 pb-6 md:px-7">
      <h1 className="ds-title1 mb-3.5">{brand.tagline}</h1>
      <div className="flex max-w-180 flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1 basis-64">
          <TextField
            type="search"
            label="레퍼런스 검색"
            leadingIcon="search"
            placeholder="업종, 타깃, 콘셉트로 검색 (예: 카페 · 20대 · 미니멀)"
          />
        </div>
        <Button variant="secondary" size="lg" leadingIcon="sparkle" onClick={onRecommend}>
          추천 받기
        </Button>
      </div>
      <div role="group" aria-label="업종" className="mt-4 flex flex-wrap gap-2">
        <Chip tone="primary" selected={industry === undefined} onClick={() => onIndustryChange(undefined)}>
          전체
        </Chip>
        {INDUSTRY_ORDER.map((id) => (
          <Chip
            key={id}
            tone="primary"
            selected={industry === id}
            onClick={() => onIndustryChange(industry === id ? undefined : id)}
          >
            {INDUSTRY_LABELS[id]}
          </Chip>
        ))}
      </div>
    </section>
  );
}
