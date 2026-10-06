import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { applyTheme, passVersion, themeLines, type RunGate, type ThemeApplyDeps } from "../../features/studio/themeText";
import { Button } from "../ds/Button";

const OPTION = "flex min-h-10 cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 hover:bg-fill-normal";
const CAPTION = "ds-caption1 text-label-alternative";

/**
 * "테마 바꾸기" 대화상자(EDITOR-REST SPEC r1 3.1 · 3.3 · 7절 · ER-AC-T2·T6) — 조작 뒤 청크("테마 바꾸기"를 눌러야 받는다).
 * 네이티브 `dialog` + `showModal()` · 라디오 = 이 계열 버전 전부(최신 먼저) · 열 때 포커스 = 선택 라디오 · Esc = 취소 · 바깥 클릭 닫기 0.
 * 대비 판정 = 진입 직후 받은 게이트 청크의 runGate(같은 dynamic import — 새 청크 0). `pickPass`(대비 줄에서 염) = 대비 통과 최신 버전을 미리 고름,
 * 없으면 캡션 + "프로필에서 보정" 링크. 실렌더 미리보기는 두지 않는다(MQ-R4 ★A) — 적용하면 캔버스가 바로 그리고 알림 줄 "되돌리기"가 같은 자리.
 */
export default function ThemeDialog({
  doc,
  profileId,
  pickPass,
  deps,
  onClose,
}: {
  readonly doc: PageDoc;
  readonly profileId: string;
  readonly pickPass: boolean;
  readonly deps: ThemeApplyDeps;
  /** applied = 적용으로 닫힘(취소·Esc는 false) */
  readonly onClose: (applied: boolean) => void;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const first = useRef<HTMLInputElement>(null);
  const [gate, setGate] = useState<{ readonly runGate: RunGate; readonly initial: number }>();
  const [chosen, setChosen] = useState(doc.profileVersion);
  const current = chosen === doc.profileVersion;

  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
    let live = true;
    void import("../../features/studio/gateCheck").then(({ runGate }) => {
      if (!live) return;
      const initial = (pickPass && passVersion(runGate, doc, deps.series)) || doc.profileVersion;
      setGate({ runGate, initial });
      setChosen(initial);
    });
    return () => void (live = false);
    // 열 때 1회 — 연 동안 문서·계열이 바뀌어도 고른 버전을 바꾸지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // 라디오가 그려지는 커밋 안에서 바로 포커스 — useEffect(페인트 뒤)면 라디오는 보이는데 포커스가 아직 없는 틈이 생긴다
  useLayoutEffect(() => first.current?.focus(), [gate]);

  const noPass = pickPass && gate && gate.initial === doc.profileVersion;
  return (
    <dialog
      ref={dialog}
      aria-labelledby={`${id}-title`}
      onCancel={(event) => {
        event.preventDefault();
        onClose(false);
      }}
      className="m-auto w-full max-w-lg rounded-lg border border-line-normal bg-background-normal p-6 text-label-normal"
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (current || !gate) return;
          onClose(true);
          void applyTheme(gate.runGate, deps, chosen);
        }}
      >
        <h2 id={`${id}-title`} className="ds-heading2">
          테마 바꾸기
        </h2>
        {noPass && (
          <p className={CAPTION}>
            대비를 통과하는 프로필 버전이 아직 없습니다 — 프로필에서 보정값을 쓰고 저장한 뒤 테마를 바꾸세요{" "}
            <Link to={`/profile/${profileId}?v=${doc.profileVersion}`} className="ds-label text-primary hover:text-primary-hover">
              프로필에서 보정
            </Link>
          </p>
        )}
        <fieldset className="flex flex-col gap-1">
          <legend className="ds-label mb-1">프로필 버전</legend>
          {gate &&
            themeLines(gate.runGate, doc, deps.series).map((line) => (
              <label key={line.version} className={OPTION}>
                <input
                  ref={line.version === gate.initial ? first : undefined}
                  type="radio"
                  name={`${id}-version`}
                  value={line.version}
                  checked={line.version === chosen}
                  onChange={() => setChosen(line.version)}
                  className="mt-1 accent-primary"
                />
                <span className="ds-label">{line.text}</span>
              </label>
            ))}
        </fieldset>
        {current && (
          <p id={`${id}-reason`} className={CAPTION}>
            지금 쓰는 테마입니다
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onClose(false)}>
            취소
          </Button>
          <Button type="submit" aria-disabled={current || !gate || undefined} aria-describedby={current ? `${id}-reason` : undefined}>
            바꾸기
          </Button>
        </div>
      </form>
    </dialog>
  );
}
