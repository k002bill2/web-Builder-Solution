/**
 * 추천 화면 청크 로더 (RECO-SPEC 5절 · AC-14a) — `tab=rec`일 때만 받는다(CatalogPage effect).
 * 로드 조건 테스트(CatalogPageRecoLoad.test "번들 분류 근거")가 이 모듈을 감싸 호출 수를 센다.
 * 실패 뒤 "다시 시도"는 같은 청크를 새 URL로 받는다(retryableImport, F1 · QA D1).
 */
import { retryableImport } from "../../data/chunkRetry";

export const loadRecoView = retryableImport(() => import("./RecoView"));
