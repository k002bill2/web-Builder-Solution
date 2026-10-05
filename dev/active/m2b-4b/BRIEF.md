# M2B-4b Developer 브리프 — 모션 프리셋 L0~L2 · reduced-motion

- 역할 Developer / Orca managed Claude Code / worktree m2b-4b / base `8236a2c`(30/30 + 폰트 4a 병합).
- 정본: `docs/design/m2b/SPEC-MOTION-FONT.md` 0절·**1절**·3.1절·4절 모션 MF-AC(U1~U5·G1·B1~B5)·QB·5절 위험 R-4, `MQ-M2B3.md` 1·5 ★A(첫 화면 3섹션만 1회·정적 HTML에서만 재생 / 캔버스 모션 미리보기 없음). 폰트(2절)는 4a 완료 — 동작 불변.
- baseline: suite 208파일 1827 · 렌더 JS 82.87KB · CSS 8.03KB · /studio 첫 91.78 · 진입 127.33KB · /compare 진입 121.70KB(±30B).

## 순서 (단계마다 PROGRESS · 명시 경로 커밋, 각 단계 RED 전 새 테스트 수 예측 커밋)
- **P0** 골격·gate, `npm ci`(lock 불변), baseline 전체 suite·바이트.
- **E0** R-4 `@starting-style`·allow-discrete 지원/미지원 동작을 현재 Chromium에서 실측(미지원 시 시트가 최종 상태로 열리는지). 모션 CSS 시제품으로 렌더 CSS/JS 증가 실측 — SPEC 1.7 추정 초과 또는 멈춤선(JS 89.70·CSS 30) 위험이면 멈춤 보고.
- **P1** `kit/motion.css` 토큰·선택자 계약(1.2·1.3), 모든 규칙 `@media screen and (prefers-reduced-motion: no-preference)` + `[data-motion-play]` 조상 조건, transform·opacity만, translateX 0, 반복 1(U2·U3·G1 — kitGuard 예외는 motion.css 하나만).
- **P2** 렌더 `data-motion` = `min(section.motion, maxMotion)`, L0·footer·faq·contact·hero 뒤 3번째 이후 본문 = 속성 없음, header = L1(U1). 렌더 문서·숨은 iframe·PNG에는 `data-motion-play` 0.
- **P3** 정적 HTML만 사이트 루트 `data-motion-play`, `data-motion` KEPT_DATA, 고정 메뉴 script 바이트 동일(U4). PNG 캡처 CSS 끝 모션 정지 방어 규칙(U5).
- **P4** 브라우저 B1(캔버스 L2 첫 그리기·편집 직후 최종 상태)·B2(PNG L2 = L0 픽셀 비교, 3폭)·B3(정적 HTML 1.0초 최종·reduced-motion 에뮬레이션 0초 최종·인쇄)·B4(3폭 재생 중·후 가로 넘침 0·hero 확대 칸 밖 0)·B5(200% 글자·시트 열림 Esc). 정적 HTML 계산 스타일 동등성(CSS 원문).
- **P5** 전체 vitest 기본 1회 exit0·Errors0(부하 타임아웃이면 실패 파일 단독 후 전체 1회 재시도, 원시로그 둘 다), Codex review --scope branch --base 8236a2c 실제 완료(라운드 ≤3, 새 P0~P2는 결과에 따라 판단·기록), REPORT.

## 제약
- 모션 JS 0·스크롤 연동 0·무한 반복 0·자동 재생 영상 0. 새 슬롯·필드 0(기존 `motion_preset`·`withMotion`·`maxMotion` 사용). 엔진 계약·KEPT_DATA는 SPEC 명시분만.
- 예산 상향·ADR·check-bundle-size·가드 완화 금지(G1 SPEC 개정만). `/studio` 진입 증가 원칙 0(≤30B), 다른 화면 ±30B.
- 4a 폰트 동작·B9 실패 정책 불변. 단언 약화·skip 0, 이관은 전후·근거표.
- package*.json/lock·CLAUDE.md·docs/design·docs/decisions 수정 0. 서브에이전트 0, 4337/4339 loopback·자기 PID cwd 확인 종료·lsof 0, main 5480 무접촉, push/merge/삭제 0, 승인 실패 우회 금지.
- 70턴부터 새 범위 확장 금지·검증/REPORT 마감 우선. REPORT(한국어): 실제 meta·E0·커밋표·MF-AC별 근거·번들 baseline/최종 바이트·test delta·Codex·한계·책임/환경.
