import type { PageMeta, PageMetaField } from "../../engine/contracts/pageDoc";
import { FieldEditor, type FieldSpec } from "./FieldEditor";

/**
 * SPEC 5.6 권장 길이 제목 60자 · 설명 160자(검색 결과 표시 폭 관행, L3). 게이트 R-11(`engine/gate/docRows.ts` SEO_FIELDS — export 없음)과
 * 같은 값이어야 한다 — `PageInfoFields.test.tsx`가 경계(60·61 / 160·161)를 `seoIssues`와 대조한다. 상한 없음 · 빈 값 = 차단(게이트).
 */
const FIELDS: readonly { readonly key: PageMetaField; readonly spec: FieldSpec }[] = [
  { key: "title", spec: { label: "제목", kind: "short-text", required: true, recommendedLength: 60 } },
  { key: "description", spec: { label: "설명", kind: "long-text", required: true, recommendedLength: 160 } },
];

/** SPEC에 문장이 없어 5.6 권장 문형으로 유추(REPORT 유추 문장) — "2줄" 대신 검색 결과 잘림 */
const seoNote = (recommended: number) => `권장 ${recommended}자 — 넘으면 검색 결과에서 잘릴 수 있습니다`;

/**
 * "페이지 정보"(SEO 메타, R-11) 필드 — 문서 단위 제목·설명. canonical은 캡션만(2a-05b, TRD 개정 대상 ⑤).
 * `describedBy` = 필드별 캔버스/게이트 문제 문장 id(5.7).
 */
export function PageInfoFields({
  meta,
  onChange,
  describedBy = {},
  idPrefix = "page-info",
}: {
  readonly meta: PageMeta;
  readonly onChange: (meta: PageMeta) => void;
  readonly describedBy?: Partial<Record<PageMetaField, string>>;
  readonly idPrefix?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      {FIELDS.map(({ key, spec }) => (
        <FieldEditor
          key={key}
          id={`${idPrefix}-${key}`}
          spec={spec}
          value={meta[key]}
          onChange={(value) => onChange({ ...meta, [key]: value })}
          describedBy={describedBy[key]}
          warnNote={seoNote}
        />
      ))}
      <div className="flex flex-col gap-1">
        <p className="ds-label text-label-normal">대표 주소(canonical)</p>
        <p className="text-caption1 text-label-alternative">발행 주소가 정해지면 채웁니다(2a-05b)</p>
      </div>
    </div>
  );
}
