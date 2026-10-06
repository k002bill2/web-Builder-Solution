import { describe, expect, it } from "vitest";
import { sampleDoc } from "../testing/sampleDoc";
import { hashDoc } from "./hash";
import { diffSlotValues } from "./diff";
import { swapTheme } from "./slotOps";

/**
 * ER-AC-T1 (EDITOR-REST SPEC r1 3.1) — 테마 바꾸기 = 문서 `profileVersion`만 바꾼 새 문서.
 * 연산 본체는 이미 `slotOps.swapTheme`·`diff.diffSlotValues`에 있다(SPEC 1.1 "grep 0건"은 낡은 사실) — 엔진 소스 변경 0, 이 파일은 T1 단언만.
 */
describe("swapTheme — ER-AC-T1", () => {
  it("동결 입력 불변 · profileVersion만 다름 · instanceId·슬롯·meta 동일 · diffSlotValues 0건", () => {
    const input = sampleDoc();
    const snapshot = JSON.stringify(input);
    expect(Object.isFrozen(input.sections[1]!.slots)).toBe(true);
    const next = swapTheme(input, 4);
    expect(JSON.stringify(input)).toBe(snapshot);
    expect(next).not.toBe(input);
    expect(next.profileVersion).toBe(4);
    expect({ ...next, profileVersion: input.profileVersion }).toEqual(input);
    expect(next.sections.map((s) => s.instanceId)).toEqual(input.sections.map((s) => s.instanceId));
    expect(next.meta).toEqual(input.meta);
    expect(diffSlotValues(input, next).changed).toEqual([]);
    expect(diffSlotValues(input, next).compared).toBeGreaterThan(0);
  });

  it("되돌리기 = 원래 버전으로 다시 바꾸면 문서 해시 원복(ER-AC-T4 엔진 부분)", () => {
    const input = sampleDoc();
    const back = swapTheme(swapTheme(input, 4), input.profileVersion);
    expect(hashDoc(back)).toBe(hashDoc(input));
  });
});
