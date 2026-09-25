import { useId, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { CatalogHero } from "../components/catalog/CatalogHero";
import { CatalogToolbar } from "../components/catalog/CatalogToolbar";
import { CompareTrayBar } from "../components/catalog/CompareTrayBar";
import { FilterRail } from "../components/catalog/FilterRail";
import { ReferenceCard } from "../components/catalog/ReferenceCard";
import { CATALOG_RESULTS_ID } from "../components/layout/SkipLinks";
import {
  clearRailFilters,
  parseCatalogParams,
  railSelectionCount,
  selectedIn,
  toCatalogParams,
  toggleGroupOption,
  type CatalogState,
} from "../features/catalog/catalogSearchParams";
import { useFacetCounts } from "../features/catalog/useFacetCounts";
import { useReferenceList } from "../features/catalog/useReferenceList";
import { COMPARE_LIMIT_NOTICE } from "../features/compare/compareTray";
import { useCompareTray } from "../features/compare/CompareTrayContext";
import { useTrayReferences } from "../features/compare/useTrayReferences";
import { useSavedReferences } from "../features/saved/SavedReferencesContext";

/** 2a-01 레퍼런스 카탈로그 (v2 SPEC 4.2 r2). 필터·정렬·보기(`tab`) 상태의 원본은 URL 쿼리다. */
export function CatalogPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => parseCatalogParams(searchParams), [searchParams]);
  const query = useMemo(() => ({ ...state.filters, sort: state.sort }), [state]);
  const { items, loaded } = useReferenceList(query);
  const { saved, toggle: toggleSaved } = useSavedReferences();
  const { tray, add, remove } = useCompareTray();
  const trayReferences = useTrayReferences(tray);
  const [notice, setNotice] = useState<string | null>(null);
  const counts = useFacetCounts(state.filters, items, state.tab === "saved" ? saved : undefined);
  const selectionCount = railSelectionCount(state.filters);
  const railId = useId();
  /** <1024 레일 펼침 — 화면 상태라 URL에 두지 않는다 (SPEC 4.2). */
  const [railOpen, setRailOpen] = useState(false);

  const update = (patch: Partial<CatalogState>) => setSearchParams(toCatalogParams({ ...state, ...patch }));
  const savedItems = items.filter((r) => saved.has(r.id));
  const visible = state.tab === "saved" ? savedItems : state.tab === "rec" ? [] : items;

  const toggleCompare = (id: string) => {
    if (tray.includes(id)) {
      remove(id);
      setNotice(null);
      return;
    }
    const result = add(id);
    setNotice(result.ok ? null : result.reason === "limit" ? COMPARE_LIMIT_NOTICE : null);
  };

  const hero =
    state.tab === "saved"
      ? { title: "보관함", subtitle: `저장한 레퍼런스 ${savedItems.length}개` }
      : state.tab === "rec"
        ? { title: "추천" }
        : { title: "레퍼런스 카탈로그", subtitle: `internal · licensed 레퍼런스 ${items.length}개` };

  return (
    <>
      <div className="mx-auto max-w-(--layout-max-width) px-4 pb-24 md:px-7">
        <CatalogHero
          title={hero.title}
          subtitle={loaded ? hero.subtitle : undefined}
          onRecommend={() => update({ tab: "rec" })}
        />
        <CatalogToolbar
          industry={state.filters.industry}
          onIndustryChange={(industry) => {
            const { industry: _previous, ...rest } = state.filters;
            void _previous;
            update({ filters: industry ? { ...rest, industry } : rest });
          }}
          counts={counts}
          sort={state.sort}
          onSortChange={(sort) => update({ sort })}
          railId={railId}
          railOpen={railOpen}
          selectionCount={selectionCount}
          onRailToggle={() => setRailOpen((open) => !open)}
        />
        <div className="grid gap-7 pt-5 lg:grid-cols-[--spacing(58)_minmax(0,1fr)]">
          <FilterRail
            id={railId}
            open={railOpen}
            counts={counts}
            selectionCount={selectionCount}
            isSelected={(key, id) => selectedIn(state.filters, key).includes(id)}
            motion={state.filters.motion}
            onToggle={(key, id) => update({ filters: toggleGroupOption(state.filters, key, id) })}
            onMotionChange={(motion) => {
              const { motion: _previous, ...rest } = state.filters;
              void _previous;
              update({ filters: motion ? { ...rest, motion } : rest });
            }}
            onReset={() => update({ filters: clearRailFilters(state.filters) })}
          />
          <section id={CATALOG_RESULTS_ID} tabIndex={-1} aria-label="레퍼런스 목록" className="min-w-0 focus:outline-none">
            {state.tab === "rec" ? (
              <div className="py-16 text-center">
                <p className="ds-body2 text-label-alternative">브리프 기반 추천은 다음 단계에서 제공됩니다.</p>
                <Link
                  to={{ search: toCatalogParams({ ...state, tab: "all" }).toString() }}
                  className="ds-label mt-2 inline-block text-primary-text hover:underline"
                >
                  전체 보기
                </Link>
              </div>
            ) : loaded && visible.length === 0 ? (
              <div className="py-16 text-center">
                <p className="ds-body1 text-label-normal">조건에 맞는 레퍼런스가 없습니다</p>
                <p className="ds-body3 mt-1 text-label-alternative">
                  {selectionCount === 0 && state.filters.industry
                    ? "업종을 '전체'로 바꿔 보세요."
                    : "필터를 줄이거나 초기화해 보세요."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((r) => (
                  <ReferenceCard
                    key={r.id}
                    reference={r}
                    saved={saved.has(r.id)}
                    inTray={tray.includes(r.id)}
                    onToggleSave={toggleSaved}
                    onToggleCompare={toggleCompare}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
      <CompareTrayBar
        references={trayReferences}
        notice={notice}
        onRemove={(id) => {
          remove(id);
          setNotice(null);
        }}
        onOpen={() => navigate("/compare")}
      />
    </>
  );
}
