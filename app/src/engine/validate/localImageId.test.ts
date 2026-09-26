/**
 * LocalImageId 브랜드 타입 (Codex j2 low) — 값은 parseLocalImageId·validatePageDoc 결과로만 생긴다. setSlot은 형식을 다시 보지 않는다(Q-12 A).
 */
import type { ImageSlotValue, LocalImageId } from "../contracts/pageDoc";
import { parseLocalImageId } from "./localImageId";

const UUID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

describe("parseLocalImageId", () => {
  it("UUID v4 소문자(crypto.randomUUID() 모양)는 같은 문자열의 LocalImageId", () => {
    const id: LocalImageId | null = parseLocalImageId(UUID);
    expect(id).toBe(UUID);
    expect(parseLocalImageId(crypto.randomUUID())).not.toBeNull();
  });

  it.each([
    ["하이픈 다섯 묶음", "a-b-c-d-e"],
    ["v1 UUID", "7c9e6679-7425-10de-944b-e07fc1f90ae7"],
    ["대문자", UUID.toUpperCase()],
    ["object URL", `blob:http://localhost:5173/${UUID}`],
    ["앞뒤 공백", ` ${UUID}`],
    ["빈 문자열", ""],
  ])("%s → null", (_, value) => {
    expect(parseLocalImageId(value)).toBeNull();
  });

  it("타입: 평범한 문자열·템플릿 문자열은 LocalImageId가 아니다(브랜드)", () => {
    // @ts-expect-error -- 형식 검사를 거치지 않은 문자열
    const bad: LocalImageId = "a-b-c-d-e";
    // @ts-expect-error -- 이미지 source에도 평범한 문자열을 넣을 수 없다
    const slot: ImageSlotValue = { kind: "image", enabled: true, source: UUID, alt: "", decorative: false };
    expect([bad, slot.source]).toEqual(["a-b-c-d-e", UUID]);
  });
});
