/** "새로 시작" 판정·대화상자 청크 로더(RESTART SPEC r2 9절) — 편집 시작 onClick에서만 부른다(조작 뒤). 테스트가 실패를 주입하는 이음새 */
import { retryLoader } from "./retryLoader";

export const loadRestart = retryLoader(() => import("./RestartDialog"));
