import type { PageDoc } from "../engine/contracts/pageDoc";
import { kitVars } from "../kit/tokens";
import { FallbackCanvas } from "./fallback/FallbackCanvas";
import type { KitTokenInput } from "./protocol";

/**
 * 렌더 문서 본문 (M2A-2a K2) — 사이트 루트에 `--site-*` 변수(킷 토큰 생성기). 킷 토큰이 없으면 변수 0 · 킷 섹션 0.
 * 폴백 팔레트 = kitTokens.palette(없으면 중립 토큰).
 */
export function PageDocument({ doc, kitTokens }: { readonly doc: PageDoc; readonly kitTokens?: KitTokenInput }) {
  return (
    <div data-site-root style={kitTokens && kitVars(kitTokens)}>
      <FallbackCanvas doc={doc} palette={kitTokens?.palette} />
    </div>
  );
}
