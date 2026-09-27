import { Link } from "react-router";
import type { DesignProfileInput } from "../../domain/compareBoard";
import { sectionLabel, type FieldRow } from "../../features/profile/profileFields";
import type { Sources } from "../../features/profile/useProfileDetail";
import { INDUSTRY_LABELS } from "../../fixtures/catalogFilters";
import { LICENSE_TONE } from "../catalog/referenceDisplay";
import { Tag } from "../ds/Tag";

const TAG_KEYS = new Set(["visual", "layout"]);
const LIST_KEYS = new Set(["hero", "header", "cta", "card", "media", "mobile", "footer", "typography", "spacing", "motion"]);
/** 요약에 늘 보이는 값(시안 밀도, PROFILE-V2-COMPACT 2) — 나머지는 "값 전체 보기"(기본 접힘) */
const SUMMARY_KEYS = new Set(["visual", "layout", "typography", "spacing"]);
const DL = "grid grid-cols-[minmax(0,--spacing(28))_minmax(0,1fr)] gap-x-4 gap-y-2.5";

const valueRow = (r: FieldRow) => (
  <div key={r.key} className="contents">
    <dt className="ds-body3 text-label-alternative">{r.label}</dt>
    <dd className="ds-body3 flex flex-col items-start">
      {TAG_KEYS.has(r.key) ? <Tag tone="blue">{r.value}</Tag> : <span>{r.value}</span>}
      {r.caption && <span className="ds-caption1 ds-mono text-label-alternative">{r.caption}</span>}
    </dd>
  </div>
);

/** 출처 목록 — 제목·업종·라이선스만. 썸네일·외부 URL 없음, 회수된 출처는 지우지 않고 글자로 알린다 (3.2 · P-S16) */
function SourceList({ ids, sources }: { readonly ids: readonly string[]; readonly sources: Sources }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="ds-label">출처</h3>
      <ul aria-label="출처 레퍼런스" className="flex flex-col gap-2">
        {ids.map((id) => {
          const r = sources.get(id);
          return (
            <li key={id} className="ds-body3 flex flex-wrap items-center gap-x-2 gap-y-1">
              {r ? (
                <>
                  <Link to={`/references/${id}`} className="font-semibold text-primary-text hover:text-primary-hover">
                    {r.title}
                  </Link>
                  <span className="text-label-alternative">{INDUSTRY_LABELS[r.industry]}</span>
                  <Tag tone={LICENSE_TONE[r.licenseStatus]} size="sm">
                    {r.licenseStatus}
                  </Tag>
                </>
              ) : (
                <>
                  <Tag size="sm">출처 회수됨</Tag>
                  <span className="text-label-alternative">프로필 값은 우리 섹션·토큰이라 계속 쓸 수 있습니다</span>
                </>
              )}
            </li>
          );
        })}
      </ul>
      <p className="ds-caption1 text-label-alternative">출처 레퍼런스의 이미지·문구는 쓰지 않습니다</p>
    </div>
  );
}

/**
 * 3.1 프로필 값 — 시각·레이아웃은 비대화형 Tag(M-05), 구성 요소는 이름표 + 변형 키 캡션(M-06).
 * 요약(시각·레이아웃·타이포·간격)만 늘 보이고 13줄 전체·출처·메타는 "값 전체 보기"(기본 접힘) — 정보는 지우지 않고 접는다.
 * 행은 엔진이 적용된 값으로 만든다(`valueRows` — 이름표 Q2 · "조정됨" 캡션 5.4). `profile`은 섹션 구성·출처용
 */
export function ProfileValues({ rows, profile, sources }: { readonly rows: readonly FieldRow[]; readonly profile: DesignProfileInput; readonly sources: Sources }) {
  const meta = rows.find((r) => r.key === "meta");
  return (
    <section aria-labelledby="profile-values" className="flex flex-col gap-4">
      <h2 id="profile-values" className="ds-heading1">프로필 값</h2>
      <dl className={DL}>
        {rows.filter((r) => SUMMARY_KEYS.has(r.key)).map(valueRow)}
      </dl>
      <details className="ds-body3">
        <summary className="cursor-pointer text-primary-text">값 전체 보기</summary>
        <div className="mt-3 flex flex-col gap-4">
          <dl className={DL}>
            {rows.filter((r) => LIST_KEYS.has(r.key) && !SUMMARY_KEYS.has(r.key)).map(valueRow)}
            <dt className="ds-body3 text-label-alternative">섹션 구성</dt>
            <dd className="ds-body3">
              <details>
                <summary className="cursor-pointer">섹션 {profile.section_plan.length} · 순서 보기</summary>
                <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5">
                  {profile.section_plan.map((s, i) => (
                    <li key={`${s.type}-${i}`}>{sectionLabel(s.type, s.variant)}</li>
                  ))}
                </ol>
              </details>
            </dd>
          </dl>
          <SourceList ids={profile.source_reference_ids} sources={sources} />
          {meta && <p className="ds-caption1 text-label-alternative">{meta.value}</p>}
        </div>
      </details>
    </section>
  );
}
