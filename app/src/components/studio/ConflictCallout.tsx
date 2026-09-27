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
  busy = false,
  onChoose,
}: {
  /** STALE_DOC에 동봉된 최신 revision — 제목 "(r12)" */
  readonly latestRevision?: number;
  readonly busy?: boolean;
  readonly onChoose: (choice: ConflictChoice) => void;
}) {
  const title = latestRevision === undefined ? SAVE_STALE_TEXT : `${SAVE_STALE_TEXT}(r${latestRevision})`;
  return (
    <Callout
      tone="warning"
      title={title}
      action={
        <>
          <Button variant="primary" size="sm" disabled={busy} onClick={() => onChoose("mine")}>
            내 편집으로 저장
          </Button>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => onChoose("theirs")}>
            다른 편집 불러오기
          </Button>
        </>
      }
    >
      내 편집은 그대로 두었습니다
    </Callout>
  );
}
