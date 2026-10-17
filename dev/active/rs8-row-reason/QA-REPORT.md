# RS8-2 QA REPORT — view().reason · /projects 행 첫 표시 (초안)

대상 tip `d2bc8702` (base `494a7c6f`) · QA 브랜치 커밋은 문서·로그만.

## 판정: (진행 중 — 초안)

## 1. 잠금 회귀
- (사실·코드 추적) `/projects` 경로: `describeRow` → `coreOf().view()`(필드 복사만) · `watchCores` → `view()`·`idle()`(=`s.chain`, connect 0)·`settle`(메모리 기억만) · 버튼 전 `connect`/`link`/`port.mode`/`gate.enter` 호출 0. `BrowserStorageSection`의 `locks`는 대화상자(클릭 뒤) 청크로만 전달.
- (사실·스파이 임시 테스트, `logs/qa-spy.txt`) readonly 탭 B: 렌더 + 재렌더 5회(watchCores 재판정) + ticks → `[request, link, save, discard] = [0,0,0,0]` · stale 탭: `[0,0,0]`. 클릭("다시 저장") 뒤 request 1 · save 1 · 잠금 holder = B(정상 — 클릭 뒤 획득).
- 실화면 2탭: (미실행 — 진행 중)

## 2. view().reason 수명
- (사실·코드 추적 `git diff 494a7c6f d2bc8702`) 기록 지점 = `coreIo.save` 래퍼 1곳(`s.reason = failed && ≠not-persistent ? reason : undefined`) · 해제 = saved·not-persistent(같은 래퍼) · `discard` discarded 분기(blocked는 유지) · `rebase` 두 분기 · 재시도 성공 = 같은 save 래퍼(saved)라 해제. `confirm`의 dirty 경로 save는 `saveCore.ts:97` `link.io.save` = 래퍼 경유.
- (사실) 행은 `view.dirty`일 때만 사유를 읽는다(`pendingRows.ts:41`) → reason이 남아도 dirty 아니면 실패 행 0. dirty·reason 없음 = 일반 "저장하지 못했습니다"(실제 미저장이라 거짓 아님).
- (사실) 편집(결과 아님)은 reason 유지 — 브리프의 "편집 재개" 규칙은 해제가 아니라 유지로 구현·테스트됨(M6: 편집 시 해제 변이 → FAIL). 근거: 사유는 "마지막 save 결과"이며 다음 save가 판정.
- (사실·한계, Developer REPORT 1절과 동일) connect 실패 `unavailable`·`discarding`은 래퍼 밖이라 직전 reason 유지 → 직전 stale이면 stale 문구가 남는다. 직전 사유 자체는 사실이므로 거짓 상태로 판정하지 않음(추정 — 잔여 위험 Low).
- 2b 변이(`logs/qa-mutation.txt`, 매번 원복 diff 0): M1 saved 해제 제거 → 2 FAIL · M2 not-persistent 기록 → 1 FAIL · M3 discard 해제 제거 → 1 FAIL · M4 rebase 해제 제거 → 2 FAIL · M5a 행이 reason 무시 → 4 FAIL · M5b 버튼 항상 → 2 FAIL · M5c stuck에 readonly 포함 → 2 FAIL · M6 편집 시 해제 → 1 FAIL. **해제 규칙 각각 제거 → 전부 FAIL.**

## 3. 행 문구·버튼
- (사실) `coreRowText.ts` `CORE_REASON_TEXT` 4문구 = `docs/design/restart/UX-5.md:72-76` 원문과 글자 단위 일치(readonly·stale·cleared·unsupported).
- 버튼: stale("저장 확인" 숨김)·cleared(저장 버튼 0)·unsupported(없음) = `stuckOf` → "다시 저장" 숨김 · readonly = 유지(그 탭을 닫은 뒤 재시도) — UX-5 2.3 행동 열과 일치. 변이 M5b·M5c로 판별력 확인.
- 2벌 가드 `coreRowText.test.ts` 유지(행 문구 = 편집기 사유 문구) · image-missing은 첫 표시 문구에서 제외(다시 저장 결과 전용, `pendingRetry`).

## 4. 예산 fresh (`npm run build`)
- `/studio` 128.66 · 복원 131.65 · `/projects` 99.09 / 109.54 — 브리프 값과 일치.

## 5. fresh 게이트 (tip d2bc8702)
- typecheck exit 0 · lint exit 0 · vitest 349 files / 3049 tests passed · build exit 0(bundle 가드 통과).
