/**
 * 3안 실렌더 비교 청크 로더 (M2B-5 SPEC 1.1 · 3.1) — "3안 실제 화면으로 비교" onClick·"다시 시도" onClick에서만 부른다(조작 뒤). 테스트가 실패를 주입하는 이음새.
 * 실패 뒤 다시 부르면 같은 청크를 새 URL(`?retry=N`)로 받는다 — 본문은 retryLoader(공용).
 */
import { retryLoader } from "./retryLoader";

export const loadCompare = retryLoader(() => import("./CompareDialog"));
