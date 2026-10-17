import { useRef, useState } from "react";
import type { ProjectPersistence } from "../../data/projectRepository";
import type { ConfirmResult, SaveCore } from "../../features/studio/save/saveCore";
import { Button } from "../ds/Button";
import DiscardDialog from "./DiscardDialog";

/**
 * 환경 reason 버튼(UX-5 2.3 · INTEGRATE-6 8.2) — 조작 뒤 청크(저장 결과에 reason이 있을 때만 받는다 · RS6-L4 M2 상쇄).
 * readonly = "저장 확인"(`confirm` 1회 · dirty·memory면 숨김, MQ-5-3 A · U9) · stale·cleared = "버리고 새로고침"(`discard` + reload, 폐기 확인 경유).
 * 연타 = 진행 중 promise 공유(CE-4) · 진행 중 aria-busy·aria-disabled(`disabled` 금지 — UX5-AC-07) · reject = failed/blocked 매핑(거짓 확인 0).
 */
export default function SaveActions({
  core,
  reason,
  dirty,
  persistence,
  report,
  reload = () => location.reload(),
}: {
  readonly core: SaveCore;
  readonly reason: string;
  readonly dirty?: boolean;
  readonly persistence: ProjectPersistence;
  /** 확인 결과 → 훅 출처(성공 = undefined → 스케줄러 settle) */
  readonly report: (next?: { readonly reason: string; readonly text?: string }) => void;
  /** 폐기 뒤 새로고침(테스트 주입용) */
  readonly reload?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const running = useRef<Promise<void>>(undefined);
  const root = useRef<HTMLSpanElement>(null);

  const confirm = () =>
    (running.current ??= (setBusy(true),
    core
      .link(async (io, s, link) => {
        const result: ConfirmResult = await io.confirm(s, link, core.save).catch(() => ({ status: "failed", reason: "unavailable" }) as const);
        if (result.status === "confirmed") return undefined;
        const next = result.status === "newer" ? "newer" : result.reason;
        return { reason: next, text: io.text(next) };
      })
      // link 타입 = run 반환값 그대로(Promise) — 한 겹 풀어 report에 넘긴다
      .then((run) => run)
      .catch(() => ({ reason: "unavailable" }))
      .then(report)
      .finally(() => ((running.current = undefined), setBusy(false)))));

  const discard = () =>
    core.discard().then(
      (result) => {
        // stale·cleared = 코어가 blocked — 초안 폐기는 reload가 한다(I6 8.2)
        if (result.status === "discarded" || result.reason === "stale" || result.reason === "cleared") return reload(), "done";
        return result.reason;
      },
      () => "failed",
    );

  if (reason === "readonly")
    return dirty || persistence === "memory" ? null : (
      <Button variant="outline" size="sm" aria-busy={busy || undefined} aria-disabled={busy || undefined} onClick={() => void confirm()}>
        저장 확인
      </Button>
    );
  return (
    <span ref={root}>
      <Button data-discard variant="outline" size="sm" onClick={() => setOpen(true)}>
        버리고 새로고침
      </Button>
      {open && (
        <DiscardDialog
          discard={discard}
          onClose={() => {
            setOpen(false);
            root.current?.querySelector<HTMLButtonElement>("[data-discard]")?.focus();
          }}
        />
      )}
    </span>
  );
}
