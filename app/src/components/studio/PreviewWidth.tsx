import type { PreviewView } from "../../features/detail/previewView";
import { PREVIEW_WIDTH_OPTIONS } from "../../features/studio/previewFrame";

/**
 * 미리보기 폭 (DS-2A-05 E-S31 · 4.2 · E-AC-15) — 라벨은 상세 미리보기 `PREVIEW_VIEWS`와 같은 값(`PREVIEW_WIDTH_OPTIONS`, 값 import를 피한 이유는 그 주석).
 * 네이티브 라디오 그룹(`fieldset` + `legend`) — ←/→ 이동·선택은 브라우저 기본(6.5 roving과 같은 동작). DS `SegmentedControl`은 카탈로그·상세 청크와
 * 경계를 만들 수 있어 studio 청크 안에서 그린다(S-B6 · S-B9 같은 이유).
 */
export function PreviewWidth({ value, onChange }: { readonly value: PreviewView; readonly onChange: (view: PreviewView) => void }) {
  return (
    <fieldset className="flex flex-none items-center gap-2">
      <legend className="sr-only">미리보기 폭</legend>
      <div className="flex rounded-md bg-fill-normal p-0.5">
        {PREVIEW_WIDTH_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="ds-label cursor-pointer rounded-sm px-3 py-1 text-label-neutral has-checked:bg-background-normal has-checked:text-label-normal has-checked:shadow-sm has-focus-visible:shadow-(--focus-ring)"
          >
            <input
              type="radio"
              name="studio-preview-width"
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
