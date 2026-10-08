/** 단조 순번 id (P1D-SPEC 3절) — 다음 id = max(현존 최대, 지운 최대) + 1 */
import { describe, expect, it } from "vitest";
import { nextSeqId, seqOf } from "./seqId";

describe("nextSeqId", () => {
  it("빈 목록 · 묘비 없음 = 1", () => {
    expect(nextSeqId("project", [])).toBe("project-1");
    expect(nextSeqId("project", [], 0)).toBe("project-1");
  });
  it("이행 — 묘비 없음 = 현존 최대 + 1 (삭제 없던 데이터는 length + 1과 같다)", () => {
    expect(nextSeqId("profile", ["profile-1", "profile-2", "profile-3"])).toBe("profile-4");
  });
  it("가운데가 빠져도 살아 있는 id와 겹치지 않는다 (length + 1 = 3 겹침 0)", () => {
    expect(nextSeqId("job", ["job-1", "job-3"])).toBe("job-4");
  });
  it("최대를 지웠으면 묘비가 재발급을 막는다", () => {
    expect(nextSeqId("snapshot", ["snapshot-1", "snapshot-2"], 3)).toBe("snapshot-4");
    expect(nextSeqId("snapshot", ["snapshot-1", "snapshot-5"], 3)).toBe("snapshot-6");
  });
  it("접두가 다른 id · 숫자 아닌 꼬리는 무시", () => {
    expect(nextSeqId("project", ["profile-9", "projects-7", "project-x", "project-2a", "project-2"])).toBe("project-3");
  });
  it("숫자 아닌 묘비는 0으로 읽는다", () => {
    expect(nextSeqId("project", ["project-1"], Number.NaN)).toBe("project-2");
  });
  it("seqOf — 같은 접두의 번호 · 아니면 0", () => {
    expect(seqOf("snapshot", "snapshot-12")).toBe(12);
    expect(seqOf("snapshot", "project-12")).toBe(0);
    expect(seqOf("snapshot", "snapshot-")).toBe(0);
  });
});
