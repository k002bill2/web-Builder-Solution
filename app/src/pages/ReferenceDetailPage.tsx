import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { SourceTags } from "../components/catalog/SourceTags";
import { MobileStructure, ScoreHistory, SectionsList, TokenSummary } from "../components/detail/DetailPanels";
import { DetailActions, ScoreTiles, SimilarReferences, type DetailNotice } from "../components/detail/DetailSidebar";
import { ReferencePreview } from "../components/detail/ReferencePreview";
import { Icon } from "../components/ds/Icon";
import { SegmentedControl } from "../components/ds/SegmentedControl";
import { LoadingState } from "../components/layout/LoadingState";
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
import { useCompareTray } from "../features/compare/CompareTrayContext";
import { parsePreviewView, PREVIEW_VIEWS, toPreviewViewParams } from "../features/detail/previewView";
import { useReferenceDetail } from "../features/detail/useReferenceDetail";
import { useSavedReferences } from "../features/saved/SavedReferencesContext";

/** v2 적용(REPORT 1.3): 앞 두 콘셉트 태그만 violet, 나머지 neutral. 의미는 태그 글자가 전한다(색 단독 아님). */
const VISUAL_TAG_TONES: readonly TagTone[] = ["violet", "violet"];

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
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="ds-title2">{r.title}</h1>
        <SourceTags reference={r} />
      </div>
      <p className="ds-caption1 mt-1 text-label-alternative">{meta.join(" · ")}</p>
      {r.sourceKind === "library_composition" && (
        <p className="ds-caption1 mt-1 text-label-alternative">섹션 라이브러리를 조합 규칙으로 자동 생성한 레퍼런스입니다.</p>
      )}
    </div>
  );
}

/** 콘셉트·목적·모션 태그 — 목업의 FilterChip 대신 비대화형 Tag (C-11: 눌리는 것처럼 보이지 않게). */
function DetailTags({ reference: r }: { readonly reference: DesignReference }) {
  return (
    <div className="flex flex-wrap gap-1.5">
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
  );
}

function NotFound() {
  return (
    <div className="mx-auto flex max-w-(--layout-max-width) flex-col items-start gap-3 px-4 py-16 md:px-7">
      <span className="ds-caption1 text-label-alternative">404</span>
      <h1 className="ds-title1">레퍼런스를 찾을 수 없습니다</h1>
      <p className="ds-body2 text-label-alternative">삭제되었거나 카탈로그에 공개되지 않은 레퍼런스입니다.</p>
      <Link to="/catalog" className="ds-label text-primary-text hover:text-primary-hover">
        카탈로그로 돌아가기
      </Link>
    </div>
  );
}

/** 2a-02 레퍼런스 상세 (v2 SPEC 4.3, FR-CAT-03). 미리보기 폭의 원본은 URL 쿼리 `view`(옛 `tab=mobile` 호환). */
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
  const view = parsePreviewView(searchParams);
  const { saved, toggle: toggleSaved } = useSavedReferences();
  const { tray, add, remove } = useCompareTray();
  const [notice, setNotice] = useState<DetailNotice | null>(null);
  const inTray = tray.includes(r.id);

  const toggleCompare = () => {
    if (inTray) {
      remove(r.id);
      setNotice("removed");
      return;
    }
    const result = add(r.id);
    setNotice(result.ok ? "added" : result.reason === "limit" ? "limit" : null);
  };

  return (
    <div className="mx-auto max-w-(--layout-max-width) pb-12">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_--spacing(95)]">
        <div className="flex min-w-0 flex-col gap-3.5 bg-background-alternative px-4 py-4 md:px-7 lg:py-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Breadcrumb />
            <SegmentedControl
              label="미리보기 폭"
              size="sm"
              options={PREVIEW_VIEWS}
              value={view}
              onChange={(next) => setSearchParams(toPreviewViewParams(next), { replace: true })}
            />
          </div>
          <ReferencePreview reference={r} view={view} />
          {view === "mobile" && <MobileStructure detail={detail} />}
        </div>
        <section
          aria-label="레퍼런스 정보"
          className="flex min-w-0 flex-col gap-5.5 px-4 py-6 md:px-7 lg:border-l lg:border-line-neutral lg:py-7"
        >
          <DetailHeader reference={r} detail={detail} />
          <ScoreTiles reference={r} detail={detail} />
          <DetailTags reference={r} />
          <SectionsList detail={detail} />
          <TokenSummary detail={detail} />
          <DetailActions
            saved={saved.has(r.id)}
            inTray={inTray}
            notice={notice}
            onImportTemplate={() => setNotice("template")}
            onToggleSave={() => toggleSaved(r.id)}
            onToggleCompare={toggleCompare}
          />
        </section>
      </div>
      <div className="grid gap-8 border-t border-line-neutral px-4 pt-7 md:px-7">
        <SimilarReferences groups={similar} />
        <ScoreHistory reference={r} detail={detail} />
      </div>
    </div>
  );
}
