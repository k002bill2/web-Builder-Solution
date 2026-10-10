# FIX-BER11 PROGRESS — 390 테마 적용 직후 "되돌리기" 화면 밖 (B-ER-11)

base main `5db4275` · branch `k002bill2/fix-ber11`

- [x] P0 PROGRESS 체크리스트 커밋
- [x] npm ci (lock 변경 0)
- [x] 원인 확정 (두 effect 실행 순서·트리거)
- [x] RED 테스트 (scrollIntoView 스파이) — 예측·결과 기록
- [x] GREEN 최소 변경 + 회귀 0
- [x] 게이트: typecheck · lint · build · vitest 전체 1회
- [x] 번들 예산 확인 (/studio ≤129.65 · 복원 ≤132.68 · /profile ≤100)
- [x] Ego Lite 390 실화면 3회 + 캡처 + 정리
- [x] BACKLOG B-ER-11 결과 표기 커밋
- [x] REPORT.md
- [x] Codex 리뷰(branch --base main) — R1 P2 반영(`0777ceb`) · R2 지적 0

## 원인 (코드 추적 확정)
- `StructureCanvas.tsx` `Overlay`의 선택 상자 effect 의존성 `[selectedId, selectedRect]`. `selectedRect` = `rects.find(...)` 결과 **배열 원소(객체 정체성)**.
- 테마 적용 → `doc`(킷 토큰) 바뀜 → `useRenderFrame`이 render 전송 → `measured?.doc !== doc`이라 rects=undefined(상자 사라짐) → 렌더 문서가 rects 회신(비동기, postMessage) → 새 배열 → `selectedRect` 새 객체 → **선택은 그대로인데** effect 재실행 → `selectedBox.scrollIntoView`.
- 알림 줄 effect(`StudioPanels.tsx:29-31`, deps `[text, undoable]`)는 적용 커밋 직후 실행 → 그 **뒤에** 재측정이 와서 선택 상자 스크롤이 덮어씀. 390 탭 배치에서 두 요소가 같은 스크롤 컨테이너 → "되돌리기" y=-246.
- jsdom 기존 테스트는 알림 줄이 "호출됐는지"만 봐서 통과(마지막 호출 대상 미검사).

## RED (예측 → 결과)
- 테스트: `ThemeSwap.test.tsx` "폭 %ipx 테마 적용 → 문서 재측정이 선택 상자를 다시 스크롤하지 않음"(390·1024·1280). 진입 후 스파이 비우고 적용 → 마지막 호출 = 알림 줄 · 오버레이 호출 0.
- 예측: 3폭 모두 FAIL(마지막 = 선택 상자). 결과: 3 failed — 마지막 호출 대상이 오버레이 선택 상자(`Hero · 풀블리드…`). 예측 일치.

## GREEN
- `StructureCanvas.tsx`: `scrolledFor` ref — 선택이 바뀐 뒤 사각형이 처음 왔을 때 한 번만 스크롤. 재측정(테마·문서 변경)은 재스크롤 0. 타이밍 꼼수(setTimeout) 미사용.
- 회귀 테스트 추가: "1280 섹션 선택을 바꾸면 선택 상자는 여전히 scrollIntoView" PASS.
- Red-Green: 수정 되돌림 → 3 FAIL / 복원 → 17/17 PASS.
- 의도된 동작 변화: 같은 선택에서 섹션 순서 이동 등으로 상자 위치만 바뀌면 더는 따라 스크롤하지 않음(브리프 4 "선택이 실제로 바뀔 때만").

## 게이트 (fresh)
- typecheck 0 · lint 0 · vitest 297 files / 2660 tests passed · build 0
- 번들: /studio 129.28 (≤129.65) · 복원 132.31 (≤132.68) · /profile 99.87 (≤100)

## Ego (preview 4347 · 390×844)
- "되돌리기" top 176 · 52 · 52 (vh 844) → 화면 안 3/3 · 캡처 `shots/ber11-390-applied-fixed.png` 41,023B
- 정리: IDB deleted · finish({keep:[]}) · listTaskSpaces() = [] · 4347 LISTEN 0
