/**
 * B-RS-17 — `/profile` 시작(create) 재생 버튼 = UX-5 14절 D1 "시작 다시 시도"(4.1 — 저장 확인과 분리).
 * 버튼 이름을 인용한 알림 문장도 같은 이름이어야 한다(없는 버튼을 누르라고 하지 않게).
 */
import { describe, expect, it } from "vitest";
import { PENDING_TEXT } from "../pending/pendingText";
import { RESTART_TEXT as T } from "./restartText";

describe("시작 재생 라벨 — UX-5 D1", () => {
  it("주 버튼 = '시작 다시 시도'(`/projects` 행 retryStart와 같은 원문)", () => {
    expect(T.retrySave).toBe("시작 다시 시도");
    expect(T.retrySave).toBe(PENDING_TEXT.retryStart);
  });

  it("C-E4·C-E6 알림이 인용하는 버튼 이름 = '시작 다시 시도' · '저장 다시 시도' 0", () => {
    for (const text of [T.createUnconfirmed, T.createUnknown]) {
      expect(text).toContain("시작 다시 시도");
      expect(text).not.toContain("저장 다시 시도");
    }
  });
});
