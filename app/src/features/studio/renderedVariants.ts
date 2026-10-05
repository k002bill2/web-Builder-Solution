import { SECTION_DEFINITIONS } from "../../engine/sections/registry";

/**
 * 렌더러(킷)가 있는 변형 키 `type/variant` (M2A-2b B7 · m2a 3.2 C · MQ-3) — 부모(편집기)는 킷을 import하지 않으므로 데이터 상수로 둔다.
 * M2B-2c부터 킷이 엔진 섹션 정의 30쌍 전부를 렌더한다(30/30) → 엔진 SECTION_DEFINITIONS에서 파생(★A 승인 — 이 import 1건. /studio 진입이 이미 엔진 registry 청크를 싣고 있어
 * 새 데이터 로드 아님 · 명시 나열 +62 B 대비 파생 측정은 dev/active/m2b-2c/logs/p1-budget.txt · final-bytes.txt).
 * 킷 레지스트리 키와 같은 집합인지는 `src/test/renderedVariants.test.ts`, 엔진 정의와 정확 집합인지는 `src/test/kitRegistryEngine.test.ts`가 대조한다. 모르는 변형은 목록 밖(폴백).
 */
export const RENDERED_VARIANTS: readonly string[] = Object.freeze(SECTION_DEFINITIONS.map((d) => `${d.type}/${d.variant}`));
