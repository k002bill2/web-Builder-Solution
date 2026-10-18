# BUDGET-TRIM-1 QA REPORT — 감량 동작 변화 0 검증 (정적·회귀)

대상 tip `5c532a08` (T1 `22a4b552` · T2 `6fa96816`) · 브라우저 미사용 · 앱·테스트 코드 커밋 0

## 판정: (진행 중)

## 1. fresh 게이트·번들 재현 — 진행 중

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
## 4. 변이 — 진행 중
## 5. 단언 약화·skip — 진행 중
