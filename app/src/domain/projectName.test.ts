import { describe, expect, it } from "vitest";
import { defaultProjectName, nameLength, normalizeProjectName, PROJECT_NAME_MAX, validateProjectName } from "./projectName";

describe("프로젝트 이름 규칙 (SPEC 2.1 · J-S06 · 8.3)", () => {
  it("정규화 = 앞뒤 공백 제거(가운데 공백 유지)", () => {
    expect(normalizeProjectName("  카페 온도  리브랜딩 \n")).toBe("카페 온도  리브랜딩");
  });

  it("상한은 40자이고 글자 수는 코드포인트로 센다(이모지 1자)", () => {
    expect(PROJECT_NAME_MAX).toBe(40);
    expect(nameLength("카페☕️")).toBe(4);
    expect(nameLength("😀😀")).toBe(2);
  });

  it("공백만 → 비어 있음 오류 '이름을 입력하세요'", () => {
    expect(validateProjectName("   ")).toEqual({ ok: false, reason: "empty", message: "이름을 입력하세요" });
  });

  it("41자·43자 → 초과 오류 문장에 현재/상한 글자 수", () => {
    expect(validateProjectName("가".repeat(43))).toEqual({
      ok: false,
      reason: "tooLong",
      message: "40자까지 쓸 수 있습니다 (43/40자)",
    });
    expect(validateProjectName("가".repeat(41)).ok).toBe(false);
  });

  it("1자·40자(공백 제거 뒤) → 통과, 정규화된 이름을 돌려준다", () => {
    expect(validateProjectName(" 가 ")).toEqual({ ok: true, name: "가" });
    expect(validateProjectName(`  ${"나".repeat(40)}  `)).toEqual({ ok: true, name: "나".repeat(40) });
  });

  describe("defaultProjectName(title, existingNames)", () => {
    it("기본 = '<기준 레퍼런스 제목> 프로젝트'", () => {
      expect(defaultProjectName("모던 카페 브랜드", [])).toBe("모던 카페 브랜드 프로젝트");
    });

    it("같은 이름이 있으면 ' 2', ' 3'…을 붙인다(빈 번호부터)", () => {
      expect(defaultProjectName("카페", ["카페 프로젝트"])).toBe("카페 프로젝트 2");
      expect(defaultProjectName("카페", ["카페 프로젝트", "카페 프로젝트 2"])).toBe("카페 프로젝트 3");
      expect(defaultProjectName("카페", ["카페 프로젝트", "카페 프로젝트 3"])).toBe("카페 프로젝트 2");
    });

    it("비교는 정규화한 이름으로 한다(앞뒤 공백 차이는 같은 이름)", () => {
      expect(defaultProjectName(" 카페 ", [" 카페 프로젝트 "])).toBe("카페 프로젝트 2");
    });

    it("긴 제목이어도 결과는 40자 이하 — 제목을 잘라 접미사 자리를 남긴다", () => {
      const title = "가".repeat(60);
      const first = defaultProjectName(title, []);
      expect(nameLength(first)).toBe(40);
      expect(first.endsWith(" 프로젝트")).toBe(true);
      const second = defaultProjectName(title, [first]);
      expect(nameLength(second)).toBe(40);
      expect(second.endsWith(" 프로젝트 2")).toBe(true);
      expect(validateProjectName(second).ok).toBe(true);
    });

    it("입력 배열을 바꾸지 않는다", () => {
      const names = Object.freeze(["카페 프로젝트"]);
      expect(() => defaultProjectName("카페", names)).not.toThrow();
    });
  });
});
