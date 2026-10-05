/**
 * 3안 실제 화면 비교 대화상자 (M2B-5 SPEC-COMPARE3 1.1 · 2 · 3.1) — 조작 뒤 청크("3안 실제 화면으로 비교" onClick).
 * 네이티브 `dialog` + `showModal()` · h2 = 접근 이름 · 열 때 포커스 = 첫 라디오 · Esc·"닫기" = 닫기(바깥 클릭으로 닫지 않는다) · 닫히면 부모가 연 버튼으로 포커스.
 * ≥1280(80rem) 3열이 한 스크롤 영역을 공유, 그 아래는 1안씩 + "보는 안" 라디오(기본 = 선택한 안, 전환 = 맨 위로). 프레임은 보이는 열에만(상한 3 · 1).
 * 카드 부품(Wireframe·요약 글자)은 이미 받은 CandidateResults 모듈을 부모가 넘긴다 — import하면 결과 청크가 공유 청크로 갈라진다.
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Button } from "../../components/ds/Button";
import { SegmentedControl } from "../../components/ds/SegmentedControl";
import type { CandidateId, GenerationJob } from "../../domain/generation";
import type { ProfileVersion } from "../../domain/profile";
import type { WirePalette } from "./CandidateCard";
import { CompareColumn } from "./CompareColumn";
import { COMPARE_WIDTH_OPTIONS, type CompareView } from "./compareFrame";
import { compareKitTokens, comparePreviews } from "./comparePreviews";

export type CandidateParts = Pick<typeof import("./CandidateResults"), "Wireframe" | "heroText" | "scaleText">;
export interface CompareDialogProps {
  readonly job: GenerationJob;
  readonly viewed: ProfileVersion;
  readonly parts: CandidateParts;
  readonly palette: WirePalette;
  readonly profileScale: number;
  readonly busy: boolean;
  readonly failure: string | null;
  readonly onSelect: (id: CandidateId) => void;
  readonly onClose: () => void;
  /** 열린 동안 바깥 announce(선택 성공 등)를 대화상자 status로도 받는다 — 닫히면 undefined */
  readonly listen: (receiver: ((text: string) => void) | undefined) => void;
}

const WIDE = "(min-width: 80rem)";
/** 3열 배치 여부 — matchMedia가 없으면(테스트 환경) 3열 */
function useWide() {
  const supported = typeof window.matchMedia === "function";
  const [wide, setWide] = useState(() => !supported || window.matchMedia(WIDE).matches);
  useEffect(() => {
    if (!supported) return undefined;
    const list = window.matchMedia(WIDE);
    const change = () => setWide(list.matches);
    list.addEventListener("change", change);
    return () => list.removeEventListener("change", change);
  }, [supported]);
  return wide;
}

export default function CompareDialog(props: CompareDialogProps) {
  const { job, viewed, onClose } = props;
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const { candidates, libraryVersion, generatorVersion } = job;
  // 선택이 바뀌어도 문서는 그대로(재전송 0) — 잡의 안·버전과 보는 버전만 본다
  const previews = useMemo(() => comparePreviews({ candidates, libraryVersion, generatorVersion }, viewed), [candidates, libraryVersion, generatorVersion, viewed]);
  const kitTokens = useMemo(() => compareKitTokens(viewed), [viewed]);
  const wide = useWide();
  const [view, setView] = useState<CompareView>("desktop");
  const [shown, setShown] = useState<CandidateId>(job.selected ?? "A");

  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
    el?.querySelector<HTMLElement>('[role="radio"][tabindex="0"]')?.focus();
  }, []);
  const close = () => {
    dialog.current?.close();
    onClose();
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby={`${id}-title`}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      className="fixed inset-4 m-0 h-auto max-h-none w-auto max-w-none flex-col gap-4 rounded-lg border border-line-normal bg-background-normal p-6 text-label-normal open:flex"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id={`${id}-title`} className="ds-heading2">
          3안 실제 화면 비교
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl label="미리보기 폭" size="sm" options={COMPARE_WIDTH_OPTIONS} value={view} onChange={setView} />
          {!wide && (
            <SegmentedControl
              label="보는 안"
              size="sm"
              options={previews.map((p) => ({ value: p.id, label: `${p.id}안` }))}
              value={shown}
              onChange={(next) => {
                setShown(next);
                body.current?.scrollTo?.({ top: 0 });
              }}
            />
          )}
          <Button size="sm" variant="outline" onClick={close}>
            닫기
          </Button>
        </div>
      </div>
      <div ref={body} role="region" aria-label="3안 미리보기 영역" tabIndex={0} className="min-h-0 flex-1 overflow-y-auto">
        <div className={wide ? "mx-auto grid w-full max-w-[calc(var(--layout-max-width)*1.5)] grid-cols-3 gap-4" : "flex flex-col gap-4"}>
          {previews
            .filter((p) => wide || p.id === shown)
            .map((p) => (
              <CompareColumn key={p.id} preview={p} kitTokens={kitTokens} view={view} />
            ))}
        </div>
      </div>
    </dialog>
  );
}
