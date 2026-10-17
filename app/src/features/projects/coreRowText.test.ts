/**
 * B-RS-09(부분) — 같은 UX-5 2.3 원문 2벌(`/projects` 행 coreRowText · 편집기 save/reasonText) 일치 가드.
 * 1벌화(import)는 reasonText가 편집기 조작 뒤 청크라 `/projects` 진입 직후 청크·`/studio` 청크 구성을 바꾼다 → 2벌 유지 + 이 단언.
 * image-missing은 두 곳 문장이 다르다(행 = "…저장을 확인하지 못했습니다", 편집기 = "이미지를 저장하지 못했습니다") — 비교 대상 밖.
 */
import { describe, expect, it } from "vitest";
import { reasonText } from "../studio/save/reasonText";
import { CORE_REASON_TEXT, stuckOf } from "./coreRowText";

describe("행 사유 문구 = 편집기 사유 문구(UX-5 2.3 원문 1개)", () => {
  it.each(["stale", "cleared", "readonly", "unsupported"])("%s", (reason) => {
    expect(CORE_REASON_TEXT[reason]).toBeTruthy();
    expect(CORE_REASON_TEXT[reason]).toBe(reasonText(reason));
  });

  it("버튼 숨김 reason = stale·cleared·unsupported(readonly는 그 탭을 닫은 뒤 다시 저장)", () => {
    expect(["stale", "cleared", "unsupported", "readonly", "writer", "image-missing", undefined].map(stuckOf)).toEqual([true, true, true, false, false, false, false]);
  });

  it("image-missing은 행 첫 표시 문구에 없다(다시 저장 결과에만 — pendingRetry) · 첫 표시 = 일반 실패 문구", () => {
    expect(CORE_REASON_TEXT["image-missing"]).toBeUndefined();
  });
});
