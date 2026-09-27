import { lazy, Suspense, useState, type ComponentProps } from "react";
import { variantName } from "../../features/studio/selection";

/** 변형 교체 목록 — "변형 바꾸기"를 펼칠 때만 받는다(조작 뒤, S-B5) */
const VariantOptions = lazy(() => import("./VariantOptions"));

/**
 * 편집 패널 머리 "변형: <이름표>" + "변형 바꾸기"(`details`, 5.5). 목업의 변형 **키** 버튼("fullbleed-left ▾") 대신 이름표(EM-07).
 * 펼친 상태는 여기서만 들고 있다 — 교체 뒤에도 목록이 그대로 열려 있어 포커스가 라디오에 남는다.
 */
export function VariantSwitch(props: ComponentProps<typeof VariantOptions>) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <p className="ds-body3 text-label-neutral">변형: {variantName(props.section)}</p>
      <details onToggle={(event) => setOpen(event.currentTarget.open)} className="rounded-md border border-line-normal px-3 py-1">
        <summary className="ds-label min-h-8 cursor-pointer py-1.5">변형 바꾸기</summary>
        {open && (
          <Suspense fallback={null}>
            <VariantOptions {...props} />
          </Suspense>
        )}
      </details>
    </div>
  );
}
