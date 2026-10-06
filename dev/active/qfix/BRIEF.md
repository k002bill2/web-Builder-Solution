# QFIX Developer 브리프 — 품질 정리 (B-TEST-01 · B-ER-10 · B-ER-11 · B-ER-03)

- 역할 Developer / Orca managed Claude Code / worktree qfix / base `f73708f`(origin 반영). `app/node_modules` lock 그대로 `npm ci` 완료.
- 영환님 ★A(2026-10-06): 품질 정리. 병렬 레인 QFIX-QA(QA, 코드 0, 포트 **4339**) — 이 레인은 **4337**.
- 정본: `docs/06-handoff/BACKLOG.md` 해당 행, `dev/active/er-5b-qa/REPORT.md`(B-ER-10·11 재현), `dev/active/er-1-qa/REPORT.md` 1절(B-ER-03 문구), ADR-004 개정 6(`/studio` 판정선 128.70, 현재 128.59 — **여유 0.11**).

## 순서
1. **B-TEST-01**(먼저): `pages/ProfileCompare.test.tsx` CMP-AC-U1 "3안 실제 화면으로 비교" 버튼 탐색 실패 · `pages/ProjectsPage.test.tsx` J-S07 저장 뒤 포커스 — 부하 중 비결정. 원인을 코드로 특정(동기 `getBy` vs 비동기 상태·lazy 청크·포커스 effect 시점)하고 **대기 방식 안정화**(`findBy`/`waitFor` 등 — 단언 내용·문구·순서 기대는 그대로, timeout 숫자만 키우는 해법은 금지). 부하 재현: `npx vitest run` 을 다른 무거운 프로세스와 함께 돌리거나 `--pool=threads --poolOptions.threads.singleThread` 등으로 3회 이상 반복해 전후 비교 기록. 테스트 쪽으로 안 되면 제품 코드의 실제 경쟁 조건인지 판정해 REPORT(제품 결함이면 고치기 전에 멈춤·보고).
2. **B-ER-10**: 스냅샷 대화상자 Esc 닫힘 → 포커스를 "스냅샷" 버튼으로 복귀(테마 대화상자와 같은 방식). TDD(예측 PROGRESS, RED 로그, RED 테스트 tip 커밋 금지), 1280·390.
3. **B-ER-11**: 390(탭 배치)에서 테마 적용 직후 알림 줄 "되돌리기"가 뷰포트 밖 — 새 UI 0, 기존 알림 줄을 보이게(예: 알림 갱신 시 알림 줄 `scrollIntoView({block:"nearest"})` — 단 포커스는 옮기지 않음, 모션 감소 존중). 다른 알림(섹션 연산·복원·실행 취소)에도 같은 규칙이면 일괄. TDD.
4. **B-ER-03**: 프로필 화면 낡은 문구("편집기는 다음 단계(2a-05)에서 연결됩니다 … 자리표시 화면") → 실제 동작에 맞게. 문구는 기존 화면 문체·`docs/design` 용어 따름, 관련 테스트 문구 기대는 새 문구로(의도된 변경 명시).
- 번들: 2~4 합계 `/studio` 증가 ≤0.08, 판정선 128.70 초과 즉시 멈춤. 다른 화면 ±0.03(`/profile` 문구 변경 몫 기록), 렌더 변화 0.

## Ego Lite(영환님 지시)
- `npm run build` + `npx vite preview --host 127.0.0.1 --port 4337 --strictPort`(dev 금지). 새 taskSpace → 창 minimized면 `Browser.setWindowBounds {windowState:"normal"}`. 캡처 = `page.cdp("Page.captureScreenshot",{format:"png",captureBeyondViewport:false,clip:{뷰포트}})`, fullPage 금지.
- 경로 A(카탈로그 ref-e → 3안 → 편집 시작)로 B-ER-10(1280 Esc 포커스)·B-ER-11(390 테마 적용 뒤 알림 보임)·B-ER-03(프로필 문구) 실제 확인·캡처. 첫 goto 1회 뒤 앱 안 클릭·키 입력만, 새로고침 금지. 끝나면 override 해제 → 이 레인 창·탭 `finish({keep:[]})` · `listTaskSpaces()`에 이 레인 공간 없음 재확인(병렬 QA 레인 공간은 무접촉), 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.

## 마감·금지
- typecheck·lint·build · 전체 vitest **3회 연속** exit0(B-TEST-01 효과 확인용) · Codex review --scope branch --base f73708f 실제 완료(≤2) · REPORT.
- 엔진·계약·`app/src/data/**`·docs/**·scripts·package*.json/lock·CLAUDE.md 수정 0, 새 의존성 0, 단언 약화·skip 0. **첫 3턴 안에 BRIEF P0 커밋.** 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **턴 관리:** 45턴 도달 시 새 수정 중단 → Ego Lite → vitest → Codex → REPORT. REPORT는 마지막 5턴 전 커밋, PROGRESS 일치.
