/** 추천 적용 — 조작 뒤 청크("이 추천 적용"·"되돌리기" onClick). 미리보기 대화상자. 흐름 본문은 recoApplyFlow(같은 로더가 함께 받는다) */
import { useEffect, useId, useRef } from "react";
import { Button } from "../ds/Button";
import type { ApplyPlan } from "./recoApplyFlow";
import { rowShortLabel } from "./recoRows";

/** 미리보기 대화상자 — 네이티브 dialog · 열 때 포커스 = "취소" · Esc·"취소" = 쓰기 0 */
export default function ApplyDialog({
  title,
  plan,
  titleOf,
  onCancel,
  onConfirm,
  text: recoText,
}: {
  readonly title: string;
  readonly plan: ApplyPlan;
  readonly titleOf: (id: string) => string;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  /** 문구 키 표(recoText) — 화면 청크에서 받는다(이 청크가 화면 청크를 import하면 공용 런타임에 namespace 도우미가 붙어 모든 라우트 +0.05, M3-1 실측) */
  readonly text: (key: string, params?: Readonly<Record<string, string | number>>) => string;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
    // 첫 버튼 = "취소"(DOM 순서) — 실수로 Enter를 눌러도 쓰기 0
    el?.querySelector("button")?.focus();
  }, []);
  const close = (then: () => void) => {
    dialog.current?.close();
    then();
  };
  return (
    <dialog
      ref={dialog}
      aria-labelledby={`${id}-title`}
      onCancel={(event) => {
        event.preventDefault();
        close(onCancel);
      }}
      className="m-auto w-full max-w-lg rounded-lg border border-line-normal bg-background-normal p-6 text-label-normal"
    >
      <div className="flex flex-col gap-4">
        <h2 id={`${id}-title`} className="ds-heading2">
          {recoText("reco.apply.preview.title", { title })}
        </h2>
        <p className="ds-body3">{recoText("reco.apply.preview.body", { title, n: plan.diff.length })}</p>
        <ul className="ds-body3 flex flex-col gap-1">
          {plan.diff.map(({ row, from }) => (
            <li key={row} className="min-w-0 break-words">
              {rowShortLabel(row)} · {from === undefined ? recoText("reco.apply.preview.new") : titleOf(from)} → {title}
            </li>
          ))}
        </ul>
        <p className="ds-caption1 text-label-alternative">{recoText("reco.apply.preview.keep")}</p>
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <Button variant="outline" className="w-full md:w-auto" onClick={() => close(onCancel)}>
            {recoText("reco.apply.preview.cancel")}
          </Button>
          <Button className="w-full md:w-auto" onClick={() => close(onConfirm)}>
            {recoText("reco.apply.preview.confirm")}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
