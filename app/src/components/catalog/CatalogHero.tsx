import { Button } from "../ds/Button";
import { TextField } from "../ds/TextField";

/** 카탈로그 제목 행: 보기 이름(h1)·부제 + 검색·추천 받기 (v2 SPEC 4.2 — 탭 대신 URL `tab`이 h1을 바꾼다). */
export function CatalogHero({
  title,
  subtitle,
  onRecommend,
}: {
  readonly title: string;
  readonly subtitle?: string;
  readonly onRecommend: () => void;
}) {
  return (
    <section className="flex flex-wrap items-end justify-between gap-4 pt-8 pb-5">
      <div>
        <h1 className="ds-title1">{title}</h1>
        {subtitle && <p className="ds-body3 mt-1 text-label-alternative">{subtitle}</p>}
      </div>
      <div className="flex w-full max-w-120 flex-wrap items-center gap-2.5">
        <div className="min-w-0 flex-1 basis-56">
          <TextField
            type="search"
            label="레퍼런스 검색"
            leadingIcon="search"
            placeholder="업종, 타깃, 콘셉트로 검색 (예: 카페 · 20대 · 미니멀)"
          />
        </div>
        <Button variant="outline" size="lg" leadingIcon="sparkle" onClick={onRecommend}>
          추천 받기
        </Button>
      </div>
    </section>
  );
}
