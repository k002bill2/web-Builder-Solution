import { useId, useState, type RefObject } from "react";
import type { ConflictChoice } from "../../data/projectRepository";
import { SAVE_STALE_TEXT } from "../../features/studio/saveStatusText";
import { Button } from "../ds/Button";
import { Callout } from "../ds/Callout";

/**
 * 다른 곳에서 문서가 바뀜 (SPEC E-S09 · E-AC-10) — 캔버스 위 cautionary Callout(DS tone `warning`) + 두 선택.
 * 정적 영역이다(DS Callout A-9) — `role=alert` 1회는 SaveStatus가 낸다(6.3). 고르기 전 자동 저장 멈춤은 스케줄러 몫.
 */
export function ConflictCallout({
  latestRevision,
  resolve,
  heading,
  onNotice,
  refresh,
}: {
  /** STALE_DOC에 동봉된 최신 revision — 제목 "(r12)" */
  readonly latestRevision?: number;
  /** `useDocSave().resolve` — 저장소 resolveConflict(rebase 포함) 1회 */
  readonly resolve: (choice: ConflictChoice) => Promise<unknown>;
  /** 성공 = 편집기 h1로 포커스(Callout이 사라짐) · 실패 = 누른 버튼에 포커스 유지(UX5-AC-05) */
  readonly heading: RefObject<HTMLElement | null>;
  readonly onNotice: (text: string) => void;
  readonly refresh: () => unknown;
}) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  // 해결 거부 → STALE 유지(훅) + 알림 1문장 · 성공 = 문서 단위 status(UX-5 5.5) — 핸들러 본문 = 조작 뒤 청크(RS6-L4 M2)
  const onChoose = (choice: ConflictChoice, done: string) => {
    setBusy(true);
    resolve(choice)
      .then(() => (heading.current?.focus(), onNotice(done), refresh()))
      .catch(() => onNotice("충돌을 해결하지 못했습니다 — 다시 골라 주세요"))
      .finally(() => setBusy(false));
  };
  const title = latestRevision === undefined ? SAVE_STALE_TEXT : `${SAVE_STALE_TEXT}(r${latestRevision})`;
  return (
    <Callout
      tone="warning"
      title={title}
      action={
        <>
          <Button variant="primary" size="sm" aria-busy={busy || undefined} aria-disabled={busy || undefined} aria-describedby={`${id}-m`} onClick={() => !busy && onChoose("mine", "내 초안으로 저장했습니다 — 바뀐 문서는 스냅샷 '충돌 보존'에 남겼습니다")}>
            내 편집으로 저장
          </Button>
          <Button variant="outline" size="sm" aria-busy={busy || undefined} aria-disabled={busy || undefined} aria-describedby={`${id}-t`} onClick={() => !busy && onChoose("theirs", "바뀐 문서를 불러왔습니다 — 내 초안 문서는 스냅샷 '충돌 보존'에 남겼습니다")}>
            다른 편집 불러오기
          </Button>
          <p id={`${id}-m`} className="sr-only">
            바뀐 문서는 스냅샷 '충돌 보존'으로 남기고 내 초안으로 덮어씁니다
          </p>
          <p id={`${id}-t`} className="sr-only">
            내 초안은 스냅샷 '충돌 보존'으로 남기고 바뀐 문서를 불러옵니다
          </p>
        </>
      }
    >
      내 편집은 그대로 두었습니다. 고르기 전에는 저장하지 않습니다.
    </Callout>
  );
}
