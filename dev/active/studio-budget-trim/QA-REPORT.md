# BUDGET-TRIM-1 QA REPORT — 감량 동작 변화 0 검증 (정적·회귀)

대상 tip `5c532a08` (T1 `22a4b552` · T2 `6fa96816`) · 브라우저 미사용 · 앱·테스트 코드 커밋 0

## 판정: **PASS** (note 1건 — 비차단)
- 5항목 모두 PASS. 감량 2건(T1·T2) 동작 변화 0 확인, 수치 128.76 · 131.75 · 다른 라우트·렌더 증분 0 fresh 재현
- note: T2 자리에 **다른 문장**의 폴백을 다시 넣는 변이는 테스트가 못 잡음(4절 M2a) — `StudioPanels.test.tsx:18`이 옛 문장 정규식(`/코드 생성기 연결 후/`)만 본다. 앱에서는 여전히 도달 불가라 동작 영향 없고 번들 예산 가드가 바이트 증가를 보는 구조라 비차단. 강화하려면 `exports={null}`일 때 `내보내기` 제목 뒤 형제 노드 0을 단언(별건 — 이번 QA는 앱·테스트 코드 커밋 금지)

## 1. fresh 게이트·번들 재현 — PASS
- `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm test -- --run` exit 0 — **372 파일 / 3356 통과** · `npm run build` exit 0 (가드: 썸네일·React zip 진입 0 통과)
- build 출력: `/studio/:projectId 해시 정규화 진입 128.76KB`(멈춤 > 128.83) · `(저장 데이터 복원 진입) 해시 정규화 진입 131.75KB`(멈춤 > 131.81) · raw 130.07 · 133.10 — REPORT 수치 재현
- `node e0-scenarios.mjs app/dist` 출력 ↔ `e0-after.txt` **diff 0**. ↔ `e0-base.txt` 차이는 /studio·복원 진입 직후 2줄뿐(128.82→128.76 · 131.81→131.75) → 다른 라우트 첫 화면·진입 직후·render.html JS 증분 0
- dist 확인: T1 문구는 `assets/SaveActions-*.js`(조작 뒤 청크)에 1회 — DiscardDialog와 같은 청크(3절 청크 실패 경로 근거) · T2 폴백 문장 `생성기 연결 후(M2)`는 dist 전체 0건

## 2. T2 "도달 불가" 주장 — PASS
- `GatePanel` 참조 전수(`grep -rn GatePanel app/src`, 테스트 제외): 정의 `StudioPanels.tsx:138` · import·사용 `StudioLayout.tsx:27·374` 1곳뿐. `StudioPanels`를 import하는 다른 모듈은 `useThemeSwap.tsx:8`(`ThemeDialogSlot`만). render.html 진입·lazy import 경로에 GatePanel 없음
- 유일한 호출 `StudioLayout.tsx:374-400`: `exports={<>…</>}` — JSX Fragment 리터럴을 **무조건** 넘김. Fragment 요소는 객체라 `??` 좌변이 nullish가 될 수 없음 → 폴백은 어떤 상태·입력에서도 평가되지 않음. 저장소 복원·구버전 데이터·exportResult·save 상태는 Fragment 안의 자식만 바꾸고 Fragment 자체의 존재에는 관여하지 않음
- 타입: `exports: ReactNode` 필수 prop으로 바뀜 → 이후 생략 호출은 typecheck에서 막힘(단, `null` 명시 전달은 허용 — 그때 폴백 문장 없이 제목만 남음. 현재 그런 호출 0)
- 폴백 문장 잔존: `코드 생성기 연결 후` grep — 앱 코드는 `ExportAfter.tsx:64`(react-zip M4 문구, 별개 문장)와 테스트 주석·단언뿐. docs(P1C-SPEC W4·2a-05 SPEC E-S27)에는 이력 문구로 남음 — 코드 영향 없음
## 3. T1 폐기 시간 초과 문구 — PASS
- 문구 바이트 동일: 원본 `saveStatusText.ts`(22a4b552^) ↔ `save/discardText.ts` 리터럴 문자열 비교 일치(셸 `[ "$a" = "$b" ]`)
- 표시 순간 동일: 유일한 사용처 `DiscardDialog.tsx:37` — `result === "timeout"`일 때 `role=alert` 문단(`:61`)에 표시, 로직 diff는 import 경로 1줄뿐
- 테스트 단언: `SaveActions.test.tsx:80-87`(timeout → alert에 문구·`data-alert-key`·포커스 '취소'·reload 0) · `saveStatusText.source.test.ts:57`(문구 리터럴 `toBe`) · `:61-63`(진입 모듈에 키 없음)
- 청크 실패 경로: `discardText`는 `DiscardDialog`만 정적 import하고 `DiscardDialog`는 `SaveActions`(조작 뒤 lazy 청크)가 정적 import → 문구는 대화상자와 같은 청크(또는 같은 정적 그래프)에 실림. 대화상자가 그려졌다면 문구 모듈도 이미 로드됨 → "대화상자는 떴는데 문구만 없는" 새 경로 0 (빌드 manifest 확인은 1절에서)
## 4. 변이 (모두 되돌림 — 각 변이 뒤 `git status --short` 빈 값 확인)
| # | 변이 | 결과 |
|---|---|---|
| M1a | T1 문구 오타 (`discardText.ts` "그대로"→"그데로") | **잡힘** — `saveStatusText.source.test.ts` "문구 원문 — discard 시간 초과" FAIL (1 failed / 27) |
| M1b | T1 키(export 이름) 오타 `DISCARD_TIMEOUT_TXET` | **잡힘** — `tsc --noEmit` TS2724 3건(DiscardDialog·SaveActions.test·source.test) + vitest 2 failed / 27 |
| M2a | T2 자리에 다른 폴백 재삽입 `exports ?? <p>내보내기를 준비하고 있습니다.</p>` | **못 잡음 (note)** — StudioPanels.test·StudioLayout 테스트 23건 전부 통과. 단언이 옛 문장 정규식만 봄 |
| M2b | T2 자리에 옛 폴백 문장 그대로 재삽입 | **잡힘** — `StudioPanels.test.tsx` "빈 묶음이어도 생성기 안내 폴백 문장을 만들지 않는다" FAIL |
## 5. 단언 약화·skip — PASS (0건)
- `git diff 601471ff..5c532a08 --stat -- app`: 앱 7파일, 테스트 3파일. 테스트 diff의 `-` 줄은 import 2줄뿐 — 삭제된 `expect` 0 · `.skip/.only/.todo/xit/xdescribe` 추가 0. 저장소 전체 `app/src`의 skip·only·todo 0건
- base `601471ff`에 폴백 문장을 단언하던 테스트 없음(`git grep "생성기 연결 후(M2)" 601471ff -- app/src` = 소스 1줄) → T2로 지워진 단언 0
- 기존 T1 단언(`SaveActions.test.tsx:84` 문구 · `:85` 키 · `saveStatusText.source.test.ts:57` 리터럴)은 import 경로만 바뀌고 그대로
