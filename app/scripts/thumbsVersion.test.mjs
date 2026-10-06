// @vitest-environment node
import { describe, expect, it } from "vitest";
import { thumbsVersion } from "./thumbsVersion.mjs";

/** 썸네일 빌드 버전 상수(ADR-004 개정 7 결정 1) — 고정 경로 `thumbs/{id}.svg?v=버전`의 캐시 무효화. 내용 해시 키 맵과 같은 강도: 어느 한 장·id가 바뀌어도 버전이 바뀐다 */
describe("thumbsVersion", () => {
  const A = { id: "ref-a", svg: "<svg>a</svg>" };
  const B = { id: "gen-b", svg: "<svg>b</svg>" };
  it("hex 8자 · 같은 입력 = 같은 값 · 입력 순서와 무관", () => {
    expect(thumbsVersion([A, B])).toMatch(/^[0-9a-f]{8}$/);
    expect(thumbsVersion([A, B])).toBe(thumbsVersion([B, A]));
  });
  it("한 장 내용·id가 바뀌거나 장 수가 바뀌면 다른 값", () => {
    const base = thumbsVersion([A, B]);
    expect(thumbsVersion([A, { ...B, svg: "<svg>c</svg>" }])).not.toBe(base);
    expect(thumbsVersion([A, { ...B, id: "gen-c" }])).not.toBe(base);
    expect(thumbsVersion([A])).not.toBe(base);
  });
  it("빈 목록은 throw(버전 빈 값 = 카드 img 0 — 조용한 통과 금지)", () => {
    expect(() => thumbsVersion([])).toThrow();
  });
});
