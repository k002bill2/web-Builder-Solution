# M3P-6 Developer 브리프 — 편집기 새 문서 업종 문구 (B-M3P-06, ADR-004 개정 8 배분 ①)

- 역할 Developer / Orca managed Claude Code / worktree m3p-6 / base `2b67601`(STUDIO-OFF3 병합 + ADR-004 개정 8: `/studio` 기준선 128.19 · 판정선 128.22). `app/node_modules` lock 그대로 `npm ci` 완료.
- 영환님 ★A(2026-10-07). 정본: `docs/decisions/ADR-004-performance-budgets.md` 개정 8, `docs/06-handoff/BACKLOG.md` B-M3P-06, `dev/active/m3p-5/REPORT.md`(썸네일 문구 `src/thumbs/thumbCopy.ts`·편집기 범위 밖 사유), `dev/active/studio-off3/AUDIT.md`(청크 구조).
- 문제: 편집기 새 문서(`src/data/startDocWrite.ts` → `withSampleCopy`/`SAMPLE_COPY` in `src/data/sampleCopy.ts`)는 업종 무관 공통 문구 → 썸네일(업종·레퍼런스별 문구)과 편집 문서 문구가 끊김.

## 범위
1. **S0 실측(코드 변경 전, PROGRESS)**: 문서 생성 경로가 어느 청크·라우트 닫힘에 있는지(`/studio` 진입 · `/profile` 조작 뒤 startDocWrite 등), 문구 표를 앱에 넣을 때 예상 증가 위치. 배치 후보 비교(지연 청크 vs 기존 청크 포함).
2. **공용 문구 표**: `src/thumbs/thumbCopy.ts`의 추상 문구 표를 앱과 빌드가 같이 쓰는 위치(예: `src/data/industryCopy.ts`)로 옮기고 thumbs는 그것을 import(가드 G3 "src/thumbs 밖에서 thumbs import 0" 유지 — 방향은 thumbs → data만). **썸네일 SVG 결과 변화 0**(버전 `8d7310f2` 그대로가 목표 — 바뀌면 원인 기록).
3. **편집기 적용**: 새 문서 생성 시 레퍼런스(업종·레이아웃·톤)를 알면 그 문구로, 모르면 지금 `SAMPLE_COPY` 그대로(폴백). 썸네일 hero와 편집기 hero가 같은 레퍼런스에서 **같은 문구**. 기존 문서·스냅샷·저장 데이터 형식 변경 0, 엔진·PageDoc 계약 변경 0(필요하면 멈춤).
4. 테스트: 같은 레퍼런스 → 썸네일 h1 = 편집기 hero 제목, 업종 모를 때 폴백, 기존 테스트 단언 변경 0(기존 기대가 공통 문구에 묶인 테스트는 목록화 — 입력이 업종 없는 경로면 그대로 통과해야 함).

## 예산 (개정 8 결정 2)
- `/studio` 진입 증가분만큼 `app/scripts/m2cBaseline.json` 기준선을 올리는 커밋 1개("ADR-004 개정 8 배분 ①", `bundleBudget.test.mjs` 고정 기대값 같은 커밋에서 갱신, 검사기 로직 변경 0). **상한 128.67(판정선 128.70) — 넘으면 구현 멈추고 보고.** 목표는 최소 증가(남은 몫은 ② B-ER-09).
- 다른 라우트: `/profile` 첫 99.72/100 · `/catalog` 100.05/101 · 진입 124.70 멈춤선. 증가 시 원인 기록, 첫 화면 한도 초과 0. 렌더 변화 0.

## Ego Lite (영환님 지시)
- build + `vite preview --port 4337`(dev 금지), 창 minimized면 `Browser.setWindowBounds normal`, 캡처 `captureBeyondViewport:false`+뷰포트 clip(fullPage 금지), 첫 goto 1회 뒤 앱 안 클릭만·새로고침 금지. 생성 레퍼런스 1개(예: gen-beauty-1)와 큐레이션 1개로 카탈로그 → 프로필 → 3안 → 편집 시작 → 편집기 hero 문구가 그 카드 썸네일 문구와 같은지 확인·캡처 ≤3장(`dev/active/m3p-6/shots/`). 끝나면 `finish({keep:[]})` · `listTaskSpaces()`=[] 재확인, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.

## 마감·금지
- typecheck·lint·build(번들 표 전 행) · 전체 vitest 1회 exit0 · Codex review --scope branch --base 2b67601(≤2) · REPORT(증가량 표 필수).
- TDD 예측 PROGRESS, RED 테스트 tip 커밋 금지, 단언 약화·skip 0. 엔진·PageDoc 계약·docs/**·lock·CLAUDE.md·check-bundle-size 판정 수정 0, 새 의존성 0, 외부 URL·실존 상호 0, APFS 0. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** **턴 관리:** 45턴 도달 시 새 구현 중단 → Ego Lite → vitest → Codex → REPORT. REPORT 초안 50턴 전 커밋.
