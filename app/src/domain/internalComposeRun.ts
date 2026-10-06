/** 생성 스크립트·가드 테스트(M3P-AC-G1)가 같은 입력으로 생성기를 돌리는 진입점 — 엔진 게이트만 밖에서 주입한다(domain은 engine을 import하지 않는다) */
import { referenceComparisonAttributes } from "../fixtures/referenceComparisons";
import { referenceFixtures } from "../fixtures/references";
import { composeInternalReferences, defaultComposeSpec, engineGateOf, renderGeneratedFixture, type ComposeOutput, type EngineGateDeps } from "./internalCompose";
import { INTERNAL_GENERATOR_VERSION } from "./internalComposeData";

export function generateInternalFixture(deps: EngineGateDeps): { readonly output: ComposeOutput; readonly files: ReturnType<typeof renderGeneratedFixture> } {
  const output = composeInternalReferences(defaultComposeSpec(referenceFixtures, referenceComparisonAttributes), INTERNAL_GENERATOR_VERSION, engineGateOf(deps, INTERNAL_GENERATOR_VERSION));
  return { output, files: renderGeneratedFixture(output, INTERNAL_GENERATOR_VERSION) };
}
