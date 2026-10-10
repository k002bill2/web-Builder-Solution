import type { DesignReference, LicenseStatus } from "../../domain/reference";
import { Tag } from "../ds/Tag";
import { LICENSE_TONE } from "./referenceDisplay";

/**
 * 라이선스 표시 문구(SPEC gen-mark-2 3.3 · MQ-GM2-3 A) — 표시만 한국어, 데이터·필터 id·URL은 영문 그대로.
 * 이 파일에 두는 이유: `/studio`·`/profile` closure 밖 기존 청크(F12·F14) — 새 공유 청크를 만들지 않는다.
 */
// eslint-disable-next-line react-refresh/only-export-components -- 청크 배치상 이 파일에 둔다(위 주석·F14)
export const LICENSE_LABEL: Readonly<Record<LicenseStatus, string>> = Object.freeze({
  internal: "자체 제작",
  licensed: "이용 허락",
  external_observed: "외부 관찰",
});

/**
 * 출처 Tag 묶음 — 라이선스 → "생성 조합" 순서, 카드·상세·비교 열 머리 공용(SPEC gen-mark 3.3 · gen-mark-2 3.1).
 * 라이선스 앞 sr-only 접두는 Tag 밖 형제로 둔다 — 낭독 "라이선스: 자체 제작"(gen-mark-2 5절).
 * `inline`이면 래퍼가 `contents`라 부모 flex 줄에 녹아든다 — Tag가 하나씩 줄바꿈된다(gen-mark-2 3.1 배치 계약).
 * `/profile` 첫 화면에 닿지 않게 `referenceDisplay.ts`·`Tag.tsx`가 아닌 이 파일에 둔다(F7).
 */
export function SourceTags({
  reference: r,
  inline = false,
}: {
  readonly reference: Pick<DesignReference, "licenseStatus" | "sourceKind">;
  readonly inline?: boolean;
}) {
  return (
    <div className={inline ? "contents" : "flex flex-wrap items-center gap-1.5"}>
      <span className="sr-only">라이선스: </span>
      <Tag tone={LICENSE_TONE[r.licenseStatus]} size="sm">
        {LICENSE_LABEL[r.licenseStatus]}
      </Tag>
      {r.sourceKind === "library_composition" && <Tag size="sm">생성 조합</Tag>}
    </div>
  );
}
