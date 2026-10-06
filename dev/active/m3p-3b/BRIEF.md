# M3P-3b Developer 브리프 — 카드 실렌더 썸네일 연결 (ADR-004 개정 7)

- 역할 Developer / Orca managed Claude Code / worktree m3p-3b / base `b5ca6df`(M3P-3 병합 + ADR-004 개정 7). `app/node_modules` lock 그대로 `npm ci` 완료.
- 영환님 결정 **"★A"**(2026-10-06): 고정 경로 상쇄 먼저 → 그래도 99.90 초과면 `/catalog` 첫 화면 한도 101(개정 7). 정본: `docs/decisions/ADR-004-performance-budgets.md` 개정 7절, `docs/design/m3p/SPEC.md` 4.1·5·7·8절(AC-U6·U8·G2·G3·G6·B1·B5), 출발점 `dev/active/m3p-3/thumbnail-over-budget.patch`(4단계 상태·테스트 4건)·`dev/active/m3p-3/PROGRESS.md` 상쇄 교훈(지연 청크가 JSX 런타임 import 시 `__vite__mapDeps` 헤더).

## 순서
1. **썸네일 21장**: `src/thumbs/entry.tsx` 대상 목록에 생성 레퍼런스 15개 포함(큐레이션 6 + 생성 15). 가드(U8·G2·G3·G6) 로직 변경 0, 21장 모두 위반 0 확인. 생성 레퍼런스 렌더 입력이 없으면 `referenceDoc` 최소 확장 — 엔진·PageDoc 계약 변경이 필요하면 멈춤.
2. **고정 경로 상쇄(개정 7 결정 1)**: 산출 파일명 `thumbs/{id}.svg` + 빌드 버전 상수 1개(`define` 등, 쿼리 `?v=`)로 `THUMBNAIL_KEYS` 키 맵·`import()`·`virtual:thumbnail-keys` 사용 제거. `check-bundle-size` 가드(키↔파일)는 "레퍼런스 id ↔ 파일" 대응으로 같은 강도 유지(약화 0). 카드: `<img loading="lazy" decoding="async">` + 와이어 배경·폴백, 레이아웃 이동 0, 실패 → img 제거·와이어 `role="img"` 이름 복귀·알림·콘솔 0(AC-U6). "생성 조합" Tag 공존. 썸네일 없는 id는 img 0.
3. **실측 → 판정(PROGRESS 표)**: `/catalog` 첫 화면 ≤ 99.90이면 **한도 변경 없이 마감**. 넘으면 개정 7 결정 3 적용: `bundleBudget.mjs` 시나리오별 `routeBudgetKb`(기본 100, `eagerBudgetKb`와 같은 형태) + `check-bundle-size.mjs` `/catalog`만 101, 커밋 메시지 "ADR-004 개정 7", 기본값 100 유지 테스트. **100.90 초과면 멈추고 보고.** `/studio` 128.70·`/compare` 124.70 멈춤선·렌더 변화 0 유지.
4. TDD: 단계별 예측 PROGRESS, RED 테스트 tip 커밋 금지, 단언 약화·skip 0(패치 테스트 4건은 고정 경로에 맞게 기대값만 갱신 — 검증 강도 유지).

## Ego Lite (영환님 지시)
- `npm run build` + `npx vite preview --host 127.0.0.1 --port 4337 --strictPort`(dev 금지). 새 taskSpace → 창 minimized면 `Browser.setWindowBounds {windowState:"normal"}`, 캡처 `captureBeyondViewport:false`+뷰포트 clip(fullPage 금지). 첫 goto 1회 뒤 앱 안 클릭·스크롤만, 새로고침 금지.
- 확인: `/catalog` 1280 첫 줄 실렌더 썸네일·레이아웃 이동 0, 스크롤로 생성 카드 썸네일(21장 로드·decode 수), "생성 조합" Tag 가독성, 외부 요청 0. 캡처 ≤4장(`dev/active/m3p-3b/shots/`).
- 끝나면 이 레인 창·탭 `finish({keep:[]})` · `listTaskSpaces()`=[] 재확인, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.

## 마감·금지
- typecheck·lint·build(번들 표 전 행) · 전체 vitest 1회 exit0(부하 실패 시 단독 후 전체 1회) · Codex review --scope branch --base b5ca6df 실제 완료(≤2) · REPORT.
- 엔진·PageDoc 계약·docs/**·lock·CLAUDE.md 수정 0, 새 의존성 0, 외부 URL·이미지 0, APFS 0. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** **턴 관리:** 45턴 도달 시 새 구현 중단 → Ego Lite → vitest → Codex → REPORT. REPORT 초안은 50턴 전 커밋·PROGRESS 일치.
