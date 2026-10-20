// CSP-AC-11 빌드 가드(CSP-SPEC 1.2.1 · CSP-2 Codex P2, 부작용 없음 — 파일 읽기는 check-bundle-size.mjs).
// 정적 zip index.html <style> = 렌더 문서 빌드 CSS에서 @font-face를 뺀 것(staticHtml.ts stripFontFaces) — zip 정책(STATIC_CSP_ZIP)은 data:를 열지 않는다.
// 그 CSS에 url(data:…)가 생기면 마크업 검사는 통과하고 zip 화면만 CSP에 조용히 막힌다 → 빌드 실패로 1.2.1 개정을 강제한다.
const FACE_RULE = /@font-face\s*\{[^}]*\}/g;
const DATA_URL = /url\(\s*['"]?\s*data:/gi;

/** @font-face 밖 url(data: 출현 목록 — 비어 있어야 통과 */
export const zipCssDataUrls = (renderCss) => renderCss.replace(FACE_RULE, "").match(DATA_URL) ?? [];
