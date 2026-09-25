import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { CatalogHero } from "../components/catalog/CatalogHero";
import { CompareTrayBar } from "../components/catalog/CompareTrayBar";
import { FilterRail } from "../components/catalog/FilterRail";
import { ReferenceCard } from "../components/catalog/ReferenceCard";
import { Select } from "../components/ds/Select";
import { Tabs } from "../components/ds/Tabs";
import { SORT_OPTIONS, type CatalogTab } from "../fixtures/catalogFilters";
import {
  parseCatalogParams,
  selectedIn,
  toCatalogParams,
  toggleGroupOption,
  type CatalogState,
} from "../features/catalog/catalogSearchParams";
import { useReferenceList } from "../features/catalog/useReferenceList";
import { COMPARE_LIMIT_NOTICE } from "../features/compare/compareTray";
import { useCompareTray } from "../features/compare/CompareTrayContext";
import { useTrayReferences } from "../features/compare/useTrayReferences";
import { useSavedReferences } from "../features/saved/SavedReferencesContext";

const SORT_SELECT_OPTIONS = SORT_OPTIONS.map((o) => ({ value: o.id, label: o.label }));

/** 1a-01 레퍼런스 카탈로그 (목업 56~124행). 필터·정렬·탭 상태의 원본은 URL 쿼리다. */
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

  return (
    <main>
      <CatalogHero
        industry={state.filters.industry}
        onIndustryChange={(industry) => {
          const { industry: _previous, ...rest } = state.filters;
          void _previous;
          update({ filters: industry ? { ...rest, industry } : rest });
        }}
        onRecommend={() => update({ tab: "rec" })}
      />
      <div className="grid gap-7 px-4 pt-5 pb-24 md:px-7 lg:grid-cols-[--spacing(58)_minmax(0,1fr)]">
        <FilterRail
          isSelected={(key, id) => selectedIn(state.filters, key).includes(id)}
          motion={state.filters.motion}
          onToggle={(key, id) => update({ filters: toggleGroupOption(state.filters, key, id) })}
          onMotionChange={(motion) => {
            const { motion: _previous, ...rest } = state.filters;
            void _previous;
            update({ filters: motion ? { ...rest, motion } : rest });
          }}
          onReset={() => update({ filters: {} })}
        />
        <section aria-label="레퍼런스 목록" className="min-w-0">
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
            <Tabs<CatalogTab>
              label="카탈로그 보기"
              value={state.tab}
              onChange={(tab) => update({ tab })}
              items={[
                { value: "all", label: "전체", count: items.length },
                { value: "rec", label: "추천" },
                { value: "saved", label: "저장함", count: savedItems.length },
              ]}
            />
            <div className="flex items-center gap-2.5">
              <span className="ds-caption1 hidden text-label-alternative sm:inline">필터 상태는 URL로 유지됩니다</span>
              <Select
                label="정렬"
                size="sm"
                className="w-35"
                options={SORT_SELECT_OPTIONS}
                value={state.sort}
                onChange={(sort) => update({ sort })}
              />
            </div>
          </div>
          {state.tab === "rec" ? (
            <p className="ds-body2 py-16 text-center text-label-alternative">
              브리프 기반 추천은 다음 단계에서 제공됩니다.
            </p>
          ) : loaded && visible.length === 0 ? (
            <div className="py-16 text-center">
              <p className="ds-body1 text-label-normal">조건에 맞는 레퍼런스가 없습니다</p>
              <p className="ds-body3 mt-1 text-label-alternative">필터를 줄이거나 초기화해 보세요.</p>
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
      <CompareTrayBar
        references={trayReferences}
        notice={notice}
        onRemove={(id) => {
          remove(id);
          setNotice(null);
        }}
        onOpen={() => navigate("/compare")}
      />
    </main>
  );
}
