# FALLBACK-FONT REPORT (B-M2B-04)

## 결론
폴백 섹션 글자·표식 굵기를 사이트 굵기 변수로 바꿨습니다. 이제 폴백은 `siteFaces`(사이트가 쓰는 400/700 면) 밖 면을 요청하지 않습니다. B-M2B-04 닫힘.

## 원인 (정적 근거 · L1)
- 폴백은 `[data-site-root]` 안에 그려지고, `render.css`가 그 안의 `--font-sans`를 `--site-font`(사이트 별칭)로 덮음 → 폴백 DS 클래스도 사이트 글꼴 계열.
- DS 굵기 700(`ds-heading1`·표식 `font-bold`)·600(`ds-body1-strong`)·500(`ds-caption1`)·400(`ds-body3`) → @font-face 400·700 매칭으로 **두 면 모두** 요청.
- `siteFaces` = {siteWeight(heading), siteWeight(body)}. 프로토콜은 100~900 허용 → heading ≤550이면 700 면, body·heading 모두 >550이면 400 면이 사이트 밖 요청. 시드(700/400)에서는 추가 요청 없음(조건부 발생).

## 변경 파일
- `app/src/render/render.css` — `[data-fallback]`에 `--fallback-strong: var(--site-weight-heading, var(--weight-bold))` · `--fallback-regular: var(--site-weight-body, var(--weight-regular))`. 킷 토큰 없을 때는 시스템 글꼴(파일 0)이라 DS 굵기.
- `app/src/render/fallback/FallbackCanvas.tsx` — 슬롯 글자·자리표시·표식·유형 이름에 `font-(--fallback-strong|regular)` 적용, 표식 `font-bold` 제거. 크기 클래스(Hero `ds-heading1`)는 유지.
- `app/src/render/fallback/FallbackCanvas.test.tsx` — 단언 2건 추가(고정 굵기 유틸리티 0·사이트 굵기 클래스 정확히 1개 / render.css 변수 바인딩).
- `docs/06-handoff/BACKLOG.md` — B-M2B-04 행 끝 닫힘 표기.
- 빌드 CSS 확인: `.font-\(--fallback-strong\){font-weight:var(--fallback-strong)}` (font-family 아님, render·index CSS 둘 다).

## 목업·위계 차이 (한 줄)
- 사이트 제목 굵기가 ≤550(→400)인 문서에서는 폴백 첫 글자도 400 — 사이트 자체에 굵은 면이 없으므로 사이트를 따름(Hero 크기 위계는 유지). 시드(700)에선 기존과 동일하게 굵음.

## 검증 (fresh 실행)
| 항목 | 명령 | 결과 |
|---|---|---|
| npm ci | `npm ci` | exit 0 · package-lock 변경 0 |
| RED | `npx vitest run src/render/fallback/FallbackCanvas.test.tsx` | 2 failed / 8 passed (예측대로) |
| GREEN | `npx vitest run src/render` | 10 파일 · 73 통과 |
| typecheck | `npm run typecheck` | exit 0 |
| lint | `npm run lint` | exit 0 |
| build | `npm run build` | exit 0 |
| vitest 전체 | `npx vitest run` | exit 0 · 296 파일 · 2652 통과 |

## 번들 예산 (build 출력)
- `/studio` 진입 직후 자동 로드 포함 129.12KB ≤ 129.65 ✓
- 복원 진입 132.15KB ≤ 132.68 ✓
- `/profile` 첫 화면 99.87KB ≤ 100 ✓

## Ego Lite (부분)
- `vite preview --host 127.0.0.1 --port 4343 --strictPort` → `/studio` 열기 → 프로젝트 없음이라 `/projects`로 이동. 폴백 섹션 문서 미도달(30/30 변형에 렌더러가 있어 폴백은 unknown 변형만 — UI로 만들 수 없음).
- 앱 셸 woff2 목록(앱 UI 글꼴, 렌더 문서 아님): Pretendard Bold·SemiBold·Medium·Regular subset. iframe 0개 · `[data-fallback]` 0개 → 폴백 요청 비교는 단위 근거(클래스·render.css 단언 + 빌드 CSS)로 대체.
- 캡처: `dev/active/fallback-font/shots/studio-4343.png`
- 정리: IDB `deleteDatabase("design-studio")` 실행 · `finish({keep:[]})` · `listTaskSpaces()` = space 2(이 작업 공간, ownership user로 반환된 상태로 남음) 1건 · preview 종료 후 4343 LISTEN 0.

## 남은 것
- Codex 검증 미실행(시간 예산 15분) — 머지 전 `/codex:review --scope branch --base main` 권장.
- 폴백 섹션이 실제로 렌더되는 문서에서의 Network 실측은 미실시(unknown 변형 문서를 주입할 경로가 필요).
- push/merge 안 함.
