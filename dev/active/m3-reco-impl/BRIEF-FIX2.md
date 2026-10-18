# M3-1 BRIEF FIX2 — D1b 되돌리고 화면 청크 실패 = 새로고침 안내 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18 (영환님 "1" — D1b revert · 새로고침 안내)
대상: 이 워크트리 tip `536176ec`. 근거 `REPORT.md` FIX1 절(D1b 예산 +0.30 BLOCKED).

## 할 일 (TDD, 항목마다 커밋)
0. **전제 확인(먼저, 5턴 안)**: 새로고침 뒤 무엇이 남는지 코드로 확정 — 카탈로그 필터(URL) · 비교 트레이/보드(저장소: IndexedDB 영속인지, 메모리 store라 새로고침 시 초기화인지 — QA LIVE-PLAN에 "메모리 store 새로고침 함정" 메모가 있다) · 적용 되돌리기 기록. 표로 REPORT에.
   - **트레이·보드가 새로고침에 사라지면 멈추고 보고**(영환님 결정 전제가 "입력이 사라지지 않음"이므로). 남으면 계속.
1. `git revert --no-edit b379e0ee`(D1b — `recoLoader.ts` retryableImport 감싸기·배선 가드 1줄) → 배선 가드 테스트는 적용 청크 2로더 기준으로 유지되는지 확인.
2. 화면 청크 실패 alert(`pages/CatalogPage.tsx:157` 근처): "다시 시도"(같은 import 재호출 = 브라우저 실패 캐시로 새 요청 0, 거짓 다시 시도) → **"새로고침"** 버튼(`location.reload()`) + 문장 "추천을 불러오지 못했습니다 — 새로고침하면 다시 불러옵니다"(0번 결과가 '필터 유지'면 "필터는 그대로 유지됩니다" 덧붙임 가능 — 사실일 때만). 문형은 기존 `EXPORT_RELOAD`("새로고침한 뒤 다시 시도하세요") 계열과 맞춘다. 문구는 CatalogPage(첫 화면) 청크라 **짧게**.
   - RED: 실패 상태에서 "다시 시도" 0 · "새로고침" 1 · 클릭 시 reload 호출(목) · alert 1 · status 0.
3. 예산: `/catalog` 첫 화면 목표 **≤ 100.50**(현 D1a 단독 100.48 + 문구). 넘으면 문구 축약 1회 → 그래도 넘으면 멈춤. `/studio` 128.80 이하.
4. 적용 청크(D1a, retryableImport)는 그대로 — 건드리지 않는다.
5. fresh typecheck·lint·test·build · Ego Lite 1회(preview `--port 4399 --strictPort`, 차단·폭 override를 **같은 스크립트 안**에서): 화면 청크 차단 → alert "새로고침" → 해제 → 클릭 → 카드 3 · 필터 URL 유지 · (트레이 상태 기록). preview 종료·리슨 0. Codex 금지(작은 변경 — QA가 본다).
6. REPORT FIX2 절: 전제 표 · revert SHA · 예산 표 · Ego 결과.

## 규칙
- 쓰기 경로 FIX1과 같음. 단언 약화·skip 0. 명시 경로 커밋, push 0. 첫 턴 BRIEF-FIX2 커밋. 마감 전 `git status --short` 빈 값. **최대 35턴, 28턴이면 마감.**
