# FALLBACK-FONT PROGRESS (B-M2B-04)

- [x] P0 체크리스트 커밋
- [x] npm ci (exit 0 · lock 변경 0)
- [x] 원인 확정 (아래)
- [x] RED 테스트 (예측·결과 기록)
- [x] 수정 GREEN + 구현 커밋
- [x] Ego Lite 실측 (부분 — 폴백 섹션 문서 미도달, 단위 근거로 대체. REPORT 참조)
- [x] 게이트: typecheck · lint · build(예산) · vitest 전체
- [x] BACKLOG B-M2B-04 닫힘 표기 커밋
- [x] REPORT.md

## 원인 확정 (정적 근거)
- 폴백 섹션은 `[data-site-root]` 안에서 그려진다(`render/PageDocument.tsx:52`). `render.css` `@layer base`가 `[data-site-root]`의 `--font-sans`를 `var(--site-font)`(= `"Pretendard"|"Kit Sans KR"|"Kit Serif KR", 시스템…`)로 덮으므로 폴백의 앱 DS 클래스도 **사이트 글꼴 계열**로 풀린다.
- 폴백 글자 굵기: `ds-heading1`=`--weight-bold`(700) · `ds-body1-strong`=`--weight-semibold`(600) · `ds-body3`=400 · `ds-caption1`=`--weight-medium`(500) · 표식 `font-bold`=700 (`styles/tokens/typography.css:64-71`).
- `kit/fonts.css` @font-face는 계열당 400·700뿐. CSS 글꼴 매칭: 600·700 → 700 면, 500·400 → 400 면. 즉 폴백은 **문서 굵기와 무관하게 400·700 두 면을 모두** 받는다.
- 사이트가 쓰는 면은 `siteFaces` = {siteWeight(heading), siteWeight(body)}. 프로토콜은 굵기 100~900 허용(`render/protocol.ts:80`)·프로젝트 파일 가져오기는 숫자면 통과(`profileShape.ts:55`) → 예: heading 500/body 400이면 siteFaces=[400]인데 폴백이 700 면 요청, heading 700/body 700이면 [700]인데 폴백이 400 면 요청. → **요청 실제 발생(조건부)**. 시드(700/400)에서는 두 면 다 siteFaces 안이라 추가 요청 없음.
- 결론: 수정 ①(폴백 글자 굵기를 사이트 굵기 변수로) 채택. 강조 = `--site-weight-heading`, 보통 = `--site-weight-body`, 킷 토큰 없을 때(시스템 글꼴 — 파일 요청 0)는 DS 굵기 폴백.

## TDD
- RED 예측: 표식 `font-bold` 때문에 고정 굵기 단언 실패 · render.css에 `--fallback-*` 없음으로 실패.
- RED 결과: 2 failed / 8 passed — `expected [ 'font-bold' ] to deeply equal []`, render.css 정규식 불일치(예측 일치).
- GREEN: `npx vitest run src/render` 10 파일 73 통과 → 구현 커밋 368b826.
