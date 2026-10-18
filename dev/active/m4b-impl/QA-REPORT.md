# M4-b-2 QA-REPORT 1차 — React zip 정적·회귀 (브라우저 미사용)

> 대상 tip `89d88dbf` · 2026-10-18 · 표기 [사실]=실행·파일 근거 · [추정] · [미확인]. 앱·테스트 코드 커밋 0, 변이는 매번 `git checkout --` 로 되돌림.

## 판정 (초안 — 항목 진행 중)
| # | 항목 | 판정 | 근거 |
|---|---|---|---|
| 1 | fresh 게이트·예산·진입 가드 | 진행 중 | |
| 2 | RZ-AC 재판독 | 진행 중 | |
| 3 | 변이 6종 | 진행 중 | |
| 4 | docker node:22 zip 빌드 | 진행 중 | |
| 5 | 메일 첨부 안내 × react-zip 3MB 초과 | **PASS(코드) · 테스트 공백 1건** | 아래 5절 |
| 6 | QA-LIVE-PLAN | 진행 중 | |

## 5. `exportFlow` 메일 첨부 안내 (Hemingway 지적)
- [사실] 브리프의 `exportFlow.ts:76`은 base `631190c7` 기준 줄 번호다. tip에서는 `app/src/features/studio/exportFlow.ts:91`.
- [사실] `exportNotes`(`exportFlow.ts:87-93`)는 `format === "react-zip"`이면 삼항 앞쪽 가지에서 `[reactZipNote, REACT_ZIP_NEXT, (잃은 이미지)]`만 반환하고 끝난다. 91줄 `format !== "static-zip" && bytes > 3MB` 조건은 뒤쪽 가지(static-zip·static-html) 안에만 있다 → **react-zip 결과에 "메일 첨부… 정적 사이트(zip)" 안내가 붙지 않는다.**
- [사실] 테스트 공백: react-zip 결과 줄 단언은 `exportFlowReactZip.test.ts:69`(1.5MB — 3MB 이하) 1건뿐. react-zip **3MB 초과**에서 안내 0을 고정하는 단언이 없다. 삼항 구조가 바뀌면(예: 91줄 조건을 공통으로 끌어올림) 회귀를 못 잡는다. → 권고: `exportNotes({bytes: 3*MB+1, …}, "react-zip")`에 안내 0 단언 1줄 추가(구현 레인 몫 — QA는 앱 테스트 커밋 금지).
- 판정: 브리프 질문("react-zip 3MB 초과에 붙는가") = **붙지 않음(PASS)**. 단 회귀 가드 없음(P3).
