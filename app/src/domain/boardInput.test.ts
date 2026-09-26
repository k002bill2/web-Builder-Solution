// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PICKABLE_ROW_IDS } from "./compareBoard";
import { FONT_OPTIONS } from "./fonts";
import { FONT_ERROR, PRIMARY_COLOR_ERROR, parseBoardInput, parseCustomStyle } from "./boardInput";

describe("사용자 대표색 검증 (AC-14 · SPEC 3.5)", () => {
  it("AC-14: 'abc'는 거부하고 대표색 필드 오류 문구를 돌려준다", () => {
    expect(parseCustomStyle({ primaryColor: "abc" })).toEqual({ ok: false, errors: { primaryColor: PRIMARY_COLOR_ERROR } });
  });

  it.each(["#12345", "#1234567", "123456", "#GGGGGG", "#fff"])("AC-14: %s도 거부한다 (#RRGGBB만)", (value) => {
    expect(parseCustomStyle({ primaryColor: value }).ok).toBe(false);
  });

  it("#RRGGBB는 대문자로 정규화해 받는다", () => {
    expect(parseCustomStyle({ primaryColor: "#c9a96e" })).toEqual({ ok: true, value: { primaryColor: "#C9A96E" } });
  });

  it("빈 사용자 스타일도 유효하다", () => {
    expect(parseCustomStyle({})).toEqual({ ok: true, value: {} });
  });
});

describe("폰트 허용 목록 (ADR-005 Q4 · D1-갱신)", () => {
  it("목록은 Pretendard · Noto Sans KR · Noto Serif KR이고 FONT-01 확인 후 3종 모두 활성이다", () => {
    expect(FONT_OPTIONS.map((f) => [f.family, f.enabled])).toEqual([
      ["Pretendard", true],
      ["Noto Sans KR", true],
      ["Noto Serif KR", true],
    ]);
  });

  it("허용 목록 폰트만 받는다 — 목록 밖은 거부", () => {
    expect(parseCustomStyle({ fontFamily: "pretendard" })).toEqual({ ok: true, value: { fontFamily: "pretendard" } });
    expect(parseCustomStyle({ fontFamily: "noto-serif-kr" })).toEqual({ ok: true, value: { fontFamily: "noto-serif-kr" } });
    expect(parseCustomStyle({ fontFamily: "Comic Sans" })).toEqual({ ok: false, errors: { fontFamily: FONT_ERROR } });
  });
});

describe("저장 입력 검증 (SPEC 8.2 savePicks)", () => {
  it("선택 가능한 행 id와 문자열 레퍼런스 id만 받는다", () => {
    expect(parseBoardInput({ hero: "ref-a" }, {}, PICKABLE_ROW_IDS).ok).toBe(true);
    expect(parseBoardInput({ sectionCount: "ref-a" }, {}, PICKABLE_ROW_IDS).ok).toBe(false);
    expect(parseBoardInput({ hero: 3 }, {}, PICKABLE_ROW_IDS).ok).toBe(false);
    expect(parseBoardInput({ hero: "ref-a" }, { primaryColor: "abc" }, PICKABLE_ROW_IDS).ok).toBe(false);
  });

  it("행 id 목록은 호출자가 넘긴다 — 목록 밖 행은 거부", () => {
    expect(parseBoardInput({ hero: "ref-a" }, {}, ["card"]).ok).toBe(false);
    expect(parseBoardInput({ card: "ref-a" }, {}, ["card"]).ok).toBe(true);
  });
});

describe("BUNDLE-HEADROOM 번들 근거 — boardInput(zod)은 조작 뒤 청크", () => {
  it("공통 청크 모듈(compareBoard)을 런타임 import하지 않는다 — 타입만(import type). 값 import가 생기면 rolldown이 compareBoard를 공통 청크에서 떼어 공통 JS가 는다", () => {
    const source = readFileSync(new URL("./boardInput.ts", import.meta.url), "utf8");
    const runtimeImports = source.split("\n").filter((line) => /^import (?!type )/.test(line));
    expect(runtimeImports.filter((line) => !/from "(zod\/mini|\.\/fonts)"/.test(line))).toEqual([]);
  });
});
