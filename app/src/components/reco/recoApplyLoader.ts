/**
 * 추천 적용 청크 로더 (RECO-SPEC 5절 · AC-14a) — "이 추천 적용"·"되돌리기" 누름 뒤에만 받는다(RecoView onClick).
 * 미리보기 대화상자(RecoApply)와 흐름 본문(recoApplyFlow)을 함께 받는다. CatalogPageRecoLoad.test가 이 모듈을 감싸 호출 수를 센다.
 */
export const loadRecoApply = () =>
  Promise.all([import("./RecoApply"), import("./recoApplyFlow")]).then(([dialog, flow]) => ({ ...flow, default: dialog.default }));
