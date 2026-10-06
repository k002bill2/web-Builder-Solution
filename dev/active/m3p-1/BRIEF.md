# M3P-1 Developer 브리프 — internal 조합 생성기 (생성 레퍼런스 데이터)

- 역할 Developer / Orca managed Claude Code / worktree m3p-1 / base `db9f25e`(M3P-0 명세 병합, MQ-M3P-1~7 ★A). `app/node_modules` lock 그대로 `npm ci` 완료.
- 정본: `docs/design/m3p/SPEC.md` r2(2절 조합 규칙·6절 예산·8절 깨질 테스트·AC), `docs/04-plan/M3P_PLAN.md` 1절 M3P-1 행·2절 쓰기 경로(**W 표시 경로만**), `docs/design/m3p/MQ.md`(2-A 5업종×4=총 21 · 3-A `sourceKind`·점수 합 타입 · 4-A 미측정 맨 뒤 · 7-A 별도 청크·라우트 쪽 로더).
- 병렬 레인 M3P-2(썸네일 파이프라인: `app/src/thumbs/**`·`vite.config.ts`·`package.json scripts.build`·`check-bundle-size.mjs`·`thumbnailKeys.ts`) — 그 경로 수정 금지.

## 경계 (영환님 원문)
- **"GDWEB은 읽기 전용 관찰만(로그인·스크랩·심사등록·대량 크롤링 금지)"** — 외부 접속·크롤링 0, 생성 입력은 저장소 안 추상 태그·킷 변형·팔레트 표만, 외부 이미지·URL 0, APFS 0.

## 순서
1. **S0 실측(코드 변경 전)**: 생성 1개분 픽스처 증가 실측(빌드), `reference.key` 사용처, 깨질 테스트 확정 → PROGRESS. **6절 멈춤선**(`/studio` 128.70 · `/catalog` 첫 화면 99.90 · `/compare` 진입 124.70) 초과가 예상되면 구현 전 멈춤 보고(예산 상향 요청 금지, 상쇄안 먼저).
2. 팔레트 표(AA 단위 테스트) → 뼈대 템플릿 3종 → `composeInternalReferences`(결정성·중복 제거·게이트 1~4) → 생성 스크립트 → 생성 픽스처 커밋(카드·상세·비교 3벌, 별도 파일 — 기존 6개 바이트 변경 0) → 별도 청크 + 라우트 쪽 조건부 로더(`/studio`·`/profile`·`/projects` 증가 0 목표) → 저장소 병합 · `sourceKind` · 미측정 정렬 → 깨진 테스트(SPEC 8.3 목록 안만) 수정.
3. AC: U1~U4·U7·G1·G2·G5(+G4 번들 기록). TDD — 단계별 예측은 PROGRESS(RED 테스트 tip 커밋 금지), 단언 약화·skip 0.
4. **Ego Lite(영환님 지시):** `npm run build` + `npx vite preview --host 127.0.0.1 --port 4337 --strictPort`(dev 금지 · 병렬 M3P-2는 4339). 새 taskSpace → 창 minimized면 `Browser.setWindowBounds {windowState:"normal"}`, 캡처 `captureBeyondViewport:false`+뷰포트 clip(fullPage 금지). `/catalog`에서 업종 필터별 카드 수·생성 카드 → 상세 → 비교 추가 흐름 확인·캡처 ≤4장. 첫 goto 1회 뒤 앱 안 클릭만·새로고침 금지. 끝나면 이 레인 창·탭 `finish({keep:[]})` · `listTaskSpaces()`에 이 레인 공간 없음 재확인, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.
5. 마감: typecheck·lint·build(번들 표 전 행) · 전체 vitest 1회 exit0(부하 실패 시 단독 후 전체 1회) · Codex review --scope branch --base db9f25e 실제 완료(≤2, M3P-0 r2 수정분 포함 확인) · REPORT.

## 금지·운영
- 엔진·PageDoc 계약 변경 0(필요하면 멈춤·MQ), 새 의존성 0, docs/**·lock·CLAUDE.md 수정 0, M3P-2 쓰기 경로 0. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** **턴 관리:** 50턴 도달 시 새 구현 중단 → Ego Lite → vitest → Codex → REPORT. REPORT는 마지막 5턴 전 커밋·PROGRESS 일치.
