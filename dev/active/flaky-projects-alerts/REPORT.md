# REPORT — flaky-projects-alerts

## 결론
- 원인(사실): `ProjectsPage`는 `items !== null && !ready`(미확인 행 모듈 `features/projects/pendingRows`의 dynamic import 미도착) 구간에 `LoadingState`(aria-label 없는 `role=status` "불러오는 중…")와 `BrowserStorageSection`(h2 "이 브라우저 저장소" + "저장소 알림")·빈 상태를 **동시에** 그렸다. 테스트는 h2가 보이자마자 status를 세므로, 전체 실행에서 import가 늦으면 `['프로젝트 알림', null, '저장소 알림']`가 된다. 3번째 status = `LoadingState`.
- 판정: **앱 결함**. 사용자에게 "불러오는 중…"과 완료 화면(빈 상태 문장·저장소 영역)이 잠깐 함께 보이고, 라벨 없는 live region이 완료 화면과 공존했다. 테스트 대기 부족이 아니다(테스트의 단언 = 정착 상태 계약이 맞다).
- 수정(최소): `settled = items !== null && (ready || pendingRows.failed)`일 때만 빈 상태·저장소 영역을 그린다 (`app/src/pages/ProjectsPage.tsx`). 기존 테스트 단언은 바꾸지 않았다(완화 0).
- 회귀 테스트: `app/src/pages/ProjectsPendingGate.test.tsx` — `vi.mock` 비동기 팩토리로 pendingRows import를 게이트로 막아 느린 환경을 결정적으로 재현.

## 재현
- 전체 실행 반복(base `3454702f`): 1회 실행 → 통과(313 files / 2830 tests, 56s). 재현 0/1. 예산(900s) 때문에 base 반복은 1회에서 중단 — 자연 재현율은 **미확인**.
- 결정적 재현(사실): 위 회귀 테스트를 수정 전 코드에 실행 → FAIL (`expected document not to contain element, found <h2` — 로딩 중에 저장소 h2 존재). 수정 후 PASS. (RED→GREEN)
- 추정: 전체 실행에서는 worker 경합으로 dynamic import(모듈 변환·로드)가 `listProjects` 마이크로태스크보다 늦게 끝나는 경우가 생겨 간헐 실패한다. 단독 실행은 import가 빨라 통과.

## 목업·동작 차이 메모
- 저장소 영역·빈 상태가 미확인 행 모듈 도착(또는 실패) 뒤에 나타난다 — 로딩과 완료 화면 겹침 제거. 실패 시(`role=alert`)에는 기존처럼 빈 상태·저장소 영역을 그린다.
- `LoadingState`의 라벨 없는 status 자체는 앱 공통 컴포넌트라 건드리지 않았다(이제 완료 화면과 공존하지 않음).

## 검증 (fresh, `app/`, 수정 커밋 2135c73a 기준)
- `npx vitest run src/pages/ProjectsPage.test.tsx` ×20: 20 pass / 0 fail
- 전체 `npx vitest run` ×3: full1·full2·full3 모두 exit 0, 각 314 files / 2831 tests 통과 (base 313/2830 + 회귀 테스트 1 file·1 test)
- `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm run build` exit 0
- build `/projects`: 첫 화면 합계 99.43KB / 예산 100KB · 진입 직후 자동 로드 포함 108.72KB / 예산 125KB (`ProjectsRoute` 청크 22.44 kB, gzip 7.90 kB). base 수치는 측정하지 않음(미확인) — 변경은 조건식 1개라 영향은 수 바이트로 추정
- 참고: 첫 시도의 lint·build·전체 2~3회는 셸 백그라운드(&)가 도구 셸 종료와 함께 죽어 결과가 없었고, 위 수치는 재실행 결과다
- Codex 검증: 브리프 금지로 미실행
