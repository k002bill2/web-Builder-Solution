import { RENDERED_VARIANTS } from "../features/studio/renderedVariants";
import { KIT_REGISTRY } from "../kit/registry";

/**
 * 렌더러 있는 변형 키 목록 가드 (M2A-2b B7 · m2a 3.2 C · MQ-3) — 부모(편집기)는 킷을 import하지 않으므로 같은 목록을 데이터 상수로 둔다.
 * 그 목록 = 킷 레지스트리 키임을 여기서 대조한다(킷이 늘거나 줄면 이 테스트가 실패 → 목록을 같이 고친다).
 */
describe("RENDERED_VARIANTS = 킷 레지스트리 키", () => {
  it("같은 집합 · 중복 0 · 바꿀 수 없음", () => {
    expect([...RENDERED_VARIANTS].sort()).toEqual(Object.keys(KIT_REGISTRY).sort());
    expect(new Set(RENDERED_VARIANTS).size).toBe(RENDERED_VARIANTS.length);
    expect(Object.isFrozen(RENDERED_VARIANTS)).toBe(true);
  });
});
