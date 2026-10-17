# RS8-2 QA REPORT — view().reason · /projects 행 첫 표시 (초안)

대상 tip `d2bc8702` (base `494a7c6f`) · QA 브랜치 커밋은 문서·로그만.

## 판정: (진행 중 — 초안)

## 1. 잠금 회귀
- (사실·코드 추적) `/projects` 경로: `describeRow` → `coreOf().view()`(필드 복사만) · `watchCores` → `view()`·`idle()`(=`s.chain`, connect 0)·`settle`(메모리 기억만) · 버튼 전 `connect`/`link`/`port.mode`/`gate.enter` 호출 0. `BrowserStorageSection`의 `locks`는 대화상자(클릭 뒤) 청크로만 전달.
- (사실·스파이 임시 테스트, `logs/qa-spy.txt`) readonly 탭 B: 렌더 + 재렌더 5회(watchCores 재판정) + ticks → `[request, link, save, discard] = [0,0,0,0]` · stale 탭: `[0,0,0]`. 클릭("다시 저장") 뒤 request 1 · save 1 · 잠금 holder = B(정상 — 클릭 뒤 획득).
- 실화면 2탭: (미실행 — 진행 중)

## 2. view().reason 수명 — (진행 중)
## 3. 행 문구·버튼 — (진행 중)

## 4. 예산 fresh (`npm run build`)
- `/studio` 128.66 · 복원 131.65 · `/projects` 99.09 / 109.54 — 브리프 값과 일치.

## 5. fresh 게이트 (tip d2bc8702)
- typecheck exit 0 · lint exit 0 · vitest 349 files / 3049 tests passed · build exit 0(bundle 가드 통과).
