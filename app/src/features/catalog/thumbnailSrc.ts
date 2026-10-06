/**
 * 카드 썸네일 경로 (M3P-3b · ADR-004 개정 7 결정 1) — 같은 출처 고정 경로 `/thumbs/{id}.svg?v=버전`. 키 맵·`import()` 없이 첫 화면 예산을 지킨다.
 * 버전 = 앱 빌드만 21장 내용 해시(src/thumbs/vitePlugin.ts define), dev·테스트·render 모드 = 빈 값 → undefined(img 0·와이어 유지).
 * 카드 id 전체에 파일이 있는지는 빌드가 보장한다(build-thumbs 대상 = 카드 id 전체 · check-bundle-size id ↔ 파일). DesignReference에 URL 필드를 넣지 않는다(TR-POL-01).
 */
// 매개변수·중간 상수 없이 정의 상수를 직접 쓴다 — 빌드에서 문자열로 접혀 `/thumbs/${id}.svg?v=버전` 한 줄이 된다(check-bundle-size가 확인)
export const thumbnailSrc = (id: string) => (__THUMBS_VERSION__ ? `/thumbs/${id}.svg?v=${__THUMBS_VERSION__}` : undefined);
