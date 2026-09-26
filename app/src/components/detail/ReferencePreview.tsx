import type { DesignReference } from "../../domain/reference";
import { PREVIEW_VIEWS, type PreviewView } from "../../features/detail/previewView";
import { cx } from "../ds/cx";

/** 폭별 프레임 — 무대(16:9, lg 4:3) 높이에 맞춘다. 모바일을 16:9 무대 안에 두어 390에서도 h1이 첫 화면에 든다 (SPEC 4.3). */
const FRAME: Readonly<Record<PreviewView, string>> = {
  desktop: "h-full w-full",
  tablet: "h-full aspect-[3/4]",
  mobile: "h-full aspect-[9/16]",
};

const CARD_COLUMNS: Readonly<Record<PreviewView, string>> = {
  desktop: "grid-cols-3",
  tablet: "grid-cols-2",
  mobile: "grid-cols-1",
};

/** 자체 렌더 미리보기 (목업 2a-02 왼쪽 패널) — 외부 캡처 없이 레퍼런스 팔레트로 그린 와이어프레임. */
export function ReferencePreview({ reference: r, view }: { readonly reference: DesignReference; readonly view: PreviewView }) {
  const p = r.colorPalette;
  const mobile = view === "mobile";
  const label = PREVIEW_VIEWS.find((v) => v.value === view)?.label;
  return (
    <figure className="flex flex-col gap-2">
      <div className="flex aspect-video items-center justify-center lg:aspect-[4/3]">
        <div
          role="img"
          aria-label={`${r.title} 미리보기 · ${label} (자체 렌더 와이어프레임)`}
          className={cx("flex flex-col overflow-hidden rounded-lg bg-background-normal shadow-2", FRAME[view])}
        >
          <div className="flex h-[8%] flex-none items-center justify-between border-b border-line-neutral px-[5%]">
            <span className="h-1 w-[18%] max-w-10 rounded-[--spacing(0.5)]" style={{ backgroundColor: p.ink }} />
            {mobile ? (
              <span className="flex w-3 flex-col gap-0.5" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-0.5 rounded-[--spacing(0.5)] bg-line-strong" />
                ))}
              </span>
            ) : (
              <span className="h-1 w-[30%] max-w-30 rounded-[--spacing(0.5)] bg-line-strong" />
            )}
          </div>
          <div
            className={cx("flex flex-none flex-col justify-end gap-1.5 p-[5%]", mobile ? "h-[34%]" : "h-[36%]")}
            style={{ backgroundColor: p.primary }}
          >
            <span className="h-[14%] max-h-3.5 w-[38%] rounded-[--spacing(0.75)]" style={{ backgroundColor: p.surface }} />
            <span className="h-[8%] max-h-2 w-[24%] rounded-[--spacing(0.75)] opacity-70" style={{ backgroundColor: p.surface }} />
          </div>
          <div className={cx("grid min-h-0 flex-1 gap-[3%] p-[5%]", CARD_COLUMNS[view])}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cx("rounded-[--spacing(1.5)] border border-line-neutral", mobile && i === 2 && "hidden")}
              />
            ))}
          </div>
          <div className="h-[9%] flex-none" style={{ backgroundColor: mobile ? p.primary : p.ink }} />
        </div>
      </div>
      <figcaption className="ds-caption1 text-center text-label-alternative">
        자체 렌더 미리보기 — 외부 캡처를 사용하지 않습니다
      </figcaption>
    </figure>
  );
}
