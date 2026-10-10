import type { DesignReference } from "../../domain/reference";
import { Tag } from "../ds/Tag";
import { LICENSE_TONE } from "./referenceDisplay";

/**
 * 출처 Tag 묶음 — 라이선스 → "생성 조합" 순서, 카드·상세 공용(SPEC gen-mark 3.3).
 * 라이선스 앞 sr-only 접두는 Tag 밖 형제로 둔다 — 낭독 "라이선스 internal", Tag 글자는 원값 그대로(5절).
 * `/profile` 첫 화면에 닿지 않게 `referenceDisplay.ts`·`Tag.tsx`가 아닌 이 파일에 둔다(F7).
 */
export function SourceTags({ reference: r }: { readonly reference: Pick<DesignReference, "licenseStatus" | "sourceKind"> }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="sr-only">라이선스 </span>
      <Tag tone={LICENSE_TONE[r.licenseStatus]} size="sm">
        {r.licenseStatus}
      </Tag>
      {r.sourceKind === "library_composition" && <Tag size="sm">생성 조합</Tag>}
    </div>
  );
}
