import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { LICENSE_TONE } from "../components/catalog/referenceDisplay";
import { MobilePanel, ScoresPanel, SectionsPanel, TokensPanel } from "../components/detail/DetailPanels";
import { ScoreActionsCard, SimilarReferences } from "../components/detail/DetailSidebar";
import { ReferencePreview } from "../components/detail/ReferencePreview";
import { Icon } from "../components/ds/Icon";
import { LoadingState } from "../components/layout/LoadingState";
import { Tabs } from "../components/ds/Tabs";
import { Tag, type TagTone } from "../components/ds/Tag";
import type { DesignReference } from "../domain/reference";
import type { ReferenceDetail } from "../domain/referenceDetail";
import {
  INDUSTRY_LABELS,
  LAYOUT_LABELS,
  MOTION_LABELS,
  PURPOSE_LABELS,
  VISUAL_TAG_LABELS,
} from "../fixtures/catalogFilters";
import { COMPARE_LIMIT_NOTICE } from "../features/compare/compareTray";
import { useCompareTray } from "../features/compare/CompareTrayContext";
import { DETAIL_TABS, parseDetailTab, toDetailTabParams, type DetailTab } from "../features/detail/detailTabs";
import { useReferenceDetail } from "../features/detail/useReferenceDetail";
import { useSavedReferences } from "../features/saved/SavedReferencesContext";

const TEMPLATE_NOTICE = "템플릿으로 가져오기는 다음 단계(디자인 프로필)에서 제공됩니다.";
/** 목업은 첫 콘셉트 태그 blue, 둘째 orange. */
const VISUAL_TAG_TONES: readonly TagTone[] = ["blue", "orange"];
const TAB_ITEMS = DETAIL_TABS.map((t) => ({ value: t.id, label: t.label }));
const PANELS = { sections: SectionsPanel, tokens: TokensPanel, mobile: MobilePanel, scores: ScoresPanel } as const;

function Breadcrumb() {
  return (
    <nav aria-label="브레드크럼">
      <Link
        to="/catalog"
        className="ds-label inline-flex items-center gap-1 py-2 text-label-alternative hover:text-label-normal"
      >
        <Icon name="chevron-left" size={18} />
        카탈로그
      </Link>
    </nav>
  );
}

function DetailHeader({ reference: r, detail }: { readonly reference: DesignReference; readonly detail: ReferenceDetail }) {
  const meta = [INDUSTRY_LABELS[r.industry], LAYOUT_LABELS[r.layoutType], `${detail.audienceNote} 타깃`, detail.buildNote];
  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        <h1 className="ds-title1">{r.title}</h1>
        <Tag tone={LICENSE_TONE[r.licenseStatus]} size="sm">
          {r.licenseStatus}
        </Tag>
      </div>
      <p className="ds-body2 mt-1 text-label-alternative">{meta.join(" · ")}</p>
      <div className="mt-3.5 flex flex-wrap gap-1.5">
        {r.visualTags.map((t, i) => (
          <Tag key={t} tone={VISUAL_TAG_TONES[i] ?? "neutral"}>
            {VISUAL_TAG_LABELS[t]}
          </Tag>
        ))}
        {r.purpose.map((p) => (
          <Tag key={p} variant="outline">
            {PURPOSE_LABELS[p]} 유도
          </Tag>
        ))}
        <Tag variant="outline">모션 {MOTION_LABELS[r.motionLevel]}</Tag>
      </div>
    </>
  );
}

function NotFound() {
  return (
    <div className="mx-auto flex max-w-(--layout-max-width) flex-col items-start gap-3 px-4 py-16 md:px-7">
      <span className="ds-caption1 text-label-alternative">404</span>
      <h1 className="ds-title1">레퍼런스를 찾을 수 없습니다</h1>
      <p className="ds-body2 text-label-alternative">삭제되었거나 카탈로그에 공개되지 않은 레퍼런스입니다.</p>
      <Link to="/catalog" className="ds-label text-primary hover:text-primary-hover">
        카탈로그로 돌아가기
      </Link>
    </div>
  );
}

/** 1a-02 레퍼런스 상세 (목업 126~183행, FR-CAT-03). 탭 상태의 원본은 URL 쿼리 `tab`. */
export function ReferenceDetailPage() {
  const { id = "" } = useParams();
  const state = useReferenceDetail(id);
  if (state.status === "loading") return <LoadingState />;
  if (state.status === "not-found") return <NotFound />;
  // 레퍼런스가 바뀌면 안내 문구 등 화면 상태를 새로 시작한다
  return <ReferenceDetailView key={id} {...state} />;
}

function ReferenceDetailView({
  reference: r,
  detail,
  similar,
}: Extract<ReturnType<typeof useReferenceDetail>, { status: "ready" }>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseDetailTab(searchParams.get("tab"));
  const { saved, toggle: toggleSaved } = useSavedReferences();
  const { tray, add, remove } = useCompareTray();
  const [notice, setNotice] = useState<string | null>(null);
  const inTray = tray.includes(r.id);
  const Panel = PANELS[tab];

  const toggleCompare = () => {
    if (inTray) {
      remove(r.id);
      setNotice(null);
      return;
    }
    const result = add(r.id);
    setNotice(result.ok ? null : result.reason === "limit" ? COMPARE_LIMIT_NOTICE : null);
  };

  return (
    <div className="px-4 pt-4 pb-12 md:px-7">
      <Breadcrumb />
      <div className="mt-2 grid gap-8 lg:grid-cols-[minmax(0,1fr)_--spacing(85)]">
        <div className="min-w-0">
          <DetailHeader reference={r} detail={detail} />
          <ReferencePreview reference={r} />
          <div className="mt-6">
            <Tabs<DetailTab>
              label="상세 보기"
              items={TAB_ITEMS}
              value={tab}
              onChange={(next) => setSearchParams(toDetailTabParams(next), { replace: true })}
            />
          </div>
          <div role="tabpanel" aria-label={DETAIL_TABS.find((t) => t.id === tab)?.label} className="mt-5">
            <Panel reference={r} detail={detail} />
          </div>
        </div>
        <aside aria-label="점수·유사 레퍼런스" className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
          <ScoreActionsCard
            reference={r}
            detail={detail}
            saved={saved.has(r.id)}
            inTray={inTray}
            notice={notice}
            onImportTemplate={() => setNotice(TEMPLATE_NOTICE)}
            onToggleSave={() => toggleSaved(r.id)}
            onToggleCompare={toggleCompare}
          />
          <SimilarReferences groups={similar} />
        </aside>
      </div>
    </div>
  );
}
