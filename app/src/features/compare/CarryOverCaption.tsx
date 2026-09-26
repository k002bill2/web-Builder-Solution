import { useRef, useState } from "react";
import { Button } from "../../components/ds/Button";
import { loadCarryOverPanel } from "./carryOverLoader";
import type { CarryOverNoticeComponent, CarryOverNoticeProps } from "./carryOverPanel";

type PanelLoad = "loading" | "error" | { readonly Notice: CarryOverNoticeComponent } | null;

export interface CarryOverCaptionProps {
  /** 최신 버전의 조정 개수(6.1-3 개수 단위, boardScreen carryOverCount) — 1 이상일 때만 그린다 */
  readonly count: number;
  /** 판정 입력 — 저장소 확정과 같은 입력(6.1-3) */
  readonly props: CarryOverNoticeProps;
}

/**
 * 보드 초안 패널 P-S25 (DS-2A-04 r6). 진입 직후 보이는 것은 개수 캡션뿐이고, "이어받기 확인"을 펼칠 때(details onToggle)·
 * "다시 시도"에서만 판정·목록 청크를 받는다(조작 뒤, 번들 스크립트 분류 근거). 받은 청크는 두고 다시 받지 않는다.
 * 실패해도 확정은 막지 않는다 — 저장은 저장소가 같은 함수로 계산한다. 엔진 청크에 싣는다(보드 준비 뒤에만 그려짐, 첫 화면 밖).
 * 펼침 상태는 네이티브 details/summary가 알린다. 다시 시도 버튼이 사라져도 포커스는 summary에 둔다.
 */
export function CarryOverCaption({ count, props }: CarryOverCaptionProps) {
  const [panel, setPanel] = useState<PanelLoad>(null);
  const requested = useRef(false);
  const summary = useRef<HTMLElement>(null);
  const load = () => {
    if (requested.current) return;
    requested.current = true;
    setPanel("loading");
    loadCarryOverPanel().then(
      (m) => setPanel({ Notice: m.CarryOverNotice }),
      (error: unknown) => {
        console.error("[compare] 이어받기 목록 불러오기 실패", error);
        requested.current = false;
        setPanel("error");
      },
    );
  };
  return (
    <div className="flex flex-col gap-1">
      <p className="ds-caption1 text-label-neutral">이 프로필에 조정 {count}개가 있습니다</p>
      <details className="ds-caption1 text-label-alternative" onToggle={(e) => e.currentTarget.open && load()}>
        <summary ref={summary} className="cursor-pointer">
          이어받기 확인
        </summary>
        <div aria-live="polite" className="mt-1 flex flex-col items-start gap-1">
          {panel === "loading" && <p>이어받기를 확인하는 중입니다</p>}
          {panel === "error" && (
            <>
              <p>이어받기 목록을 불러오지 못했습니다</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  summary.current?.focus();
                  load();
                }}
              >
                다시 시도
              </Button>
            </>
          )}
          {typeof panel === "object" && panel && <panel.Notice {...props} />}
        </div>
      </details>
    </div>
  );
}
