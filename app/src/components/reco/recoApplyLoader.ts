/**
 * 추천 적용 청크 로더 (RECO-SPEC 5절 · AC-14a) — "이 추천 적용"·"되돌리기" 누름 뒤에만 받는다(RecoView onClick).
 * 미리보기 대화상자(RecoApply)와 흐름 본문(recoApplyFlow)을 함께 받는다. CatalogPageRecoLoad.test가 이 모듈을 감싸 호출 수를 센다.
 * 두 청크를 각각 retryableImport로 싼다(소스에서 청크 파일을 하나만 읽으므로) — 실패 뒤 다시 시도는 실패한 청크만 새 URL로(F1 · QA D1).
 */
import { retryableImport } from "../../data/chunkRetry";

const loadDialog = retryableImport(() => import("./RecoApply"));
const loadFlow = retryableImport(() => import("./recoApplyFlow"));

export const loadRecoApply = () => Promise.all([loadDialog(), loadFlow()]).then(([dialog, flow]) => ({ ...flow, default: dialog.default }));
