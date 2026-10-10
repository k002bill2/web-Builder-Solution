/**
 * 3안 카드·표 청크 로더 (PROFILE-HEADROOM-2) — 잡이 있을 때·"3안 만들기" onClick 미리 받기. 테스트가 실패를 주입하는 이음새.
 * 실패 뒤 다시 부르면 같은 청크를 새 URL(`?retry=N`)로 받는다 — 본문은 retryLoader(공용, chunkRetry를 import하지 않는 이유도 거기).
 */
import { retryLoader } from "./retryLoader";

export const loadCandidateResults = retryLoader(() => import("./CandidateResults"));
