# M3-1 BRIEF FIX1 — QA 2차 결함 D1 · notes N1·N2·N4 · 1차 note 3 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18 (자동 진행 — QA 종합 PASS with notes, D1 필수 수정)
대상: 이 워크트리 tip `b59c66e7`. 근거 `dev/active/m3-reco-impl/QA-REPORT.md` 8.0′ E4·E5(D1) · 8.1 #5·#6(N1·N2) · 8.2 E6(N4) · 0절 note 3.

## 할 일 (TDD, 항목마다 커밋)
1. **D1 (필수)**: 화면 청크(`components/reco/recoLoader.ts` `loadRecoView`)와 적용 청크(`recoApplyLoader.ts`의 `RecoApply`·`recoApplyFlow` 2개)를 기존 `data/chunkRetry.ts` `retryableImport`로 감싼다(새 URL `?retry=N` 재요청 — 내보내기와 같은 방식, 새 메커니즘 금지). `Promise.all` 2청크는 각각 감싼다. RED: 1회 실패 뒤 재시도 = 다른 URL 요청 → 성공. `CatalogPageRecoLoad.test` 로더 목과 별도로 `retryableImport` 배선 가드(소스 또는 `chunkRetryWiring` 류 테스트에 2로더 추가).
   - **예산**: chunkRetry는 이미 진입 직후 청크에 있음 — `/catalog` 첫 화면(현 100.46, 멈춤선 100.90) · `/catalog (추천)` · 다른 라우트 증분 실측. `/catalog` 첫 화면 +0.05 넘으면 감량 1회 → 그래도 넘으면 멈추고 보고. `/studio` 128.80 이하 유지.
   - D1 부수: "다시 시도" 직후 포커스가 BODY로 가지 않게(결과 영역 또는 재시도 버튼 유지 — SPEC 3.6 원칙).
2. **N1**: "2개 더 보기"가 사라질 때 포커스를 4번째 카드 제목(또는 새 카드 영역)으로.
3. **N2**: 390 적용 대화상자 시각 순서와 Tab 순서를 일치(시각 순서를 DOM 순서에 맞추는 쪽 — CSS order로 Tab만 어긋나게 하지 말 것). 1280 배치 무변화.
4. **N4**: 비활성 "이 추천 적용"에 이유 문구 `aria-describedby` 연결.
5. **1차 note 3**: 지연 `savePicks` 목으로 클릭 직후 "적용됨" 0 · status 빈 값 단언 1건.
- **N3**(근거 부족 상태 알림 SPEC 내부 상충)은 이번에 바꾸지 않는다 — REPORT에 "SPEC 3.6-5(결과가 바뀌면 1회)를 따름" 기록, BACKLOG는 Jarvis.

## 마감
- fresh typecheck·lint·test·build · Ego Lite 1회(preview `--port 4399 --strictPort`, **override·차단은 같은 스크립트 안에서** — QA 8.3 교훈): 화면 청크 차단 → 해제 → 다시 시도 → 카드 표시 · 390 대화상자 Tab 순서 · 6턴 한도. preview 종료·리슨 0.
- Codex adversarial 1회(`--scope branch --base b59c66e7`, `--help` 금지) · 반영 1회.
- 쓰기 경로: `components/reco/**`·`components/catalog/**`·`pages/CatalogPage*`·관련 테스트·`data/chunkRetry*`(배선 가드 테스트만)·기준선 2파일(판정선 안 실측일 때만)·`dev/active/m3-reco-impl/`. `features/studio/**` 0. 단언 약화·skip 0. 명시 경로 커밋, push 0. 첫 턴 BRIEF-FIX1 커밋, 항목마다 커밋. 마감 전 `git status --short` 빈 값. **최대 50턴, 40턴이면 마감.**
