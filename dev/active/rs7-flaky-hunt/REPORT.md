# RS7 FLAKY HUNT — REPORT

## 결론
- 간헐 실패 테스트 식별: `app/src/components/studio/FieldUndo.test.tsx` › "미리보기 · 읽기 전용 탭 — FU-AC-10 · 12 › 묶음 열린 채 미리보기 열기 = 묶음 닫힘 · 편집으로 돌아가 Ctrl+Z = 그 필드 기록" (128행 `expect(await key(CTRL_Z)).toBe(true)` → `false`).
- 원인: **테스트 조작 순서의 타이밍 가정**(DOM 등장 직후 같은 틱에 합성 키 입력). 수정은 테스트 1줄(+주석 1줄). 앱 쪽 이론상 창은 아래에 남김(Jarvis 판단).
- RS7-C 검증 때의 1/6 실패와 같은 테스트인지는 당시 이름이 기록되지 않아 확정 불가. 이번 15회에서 잡힌 간헐 실패는 이것 하나.
- 수정 커밋: `4227bb52` (test: FieldUndo 미리보기 Ctrl+Z 전 passive effect 대기)
- 수정 후 전체 스위트 15회 연속 GREEN (`[verify #1~15]` 모두 `3033 passed (3033)`)

## 1. 식별 (logs/runs.txt)
- 수정 전 전체 `npx vitest run` 직렬 15회(25회 계획, 시간 예산으로 15회에서 중단): **1 failed / 15** — `[base #10] 1 failed | 3032 passed (3033)`, 실패 1건 = 위 FieldUndo 테스트. 원문: `logs/base-10.out`·`logs/base-10.failed.json`.
- 실패가 나왔으므로 shuffle·pool 변형(브리프 "실패 0이면")은 실행하지 않음. 참고: Vitest 5.0.1 기본 pool = `forks`(`npx vitest --help`) — `--pool=forks` 변형은 baseline과 동일 조건.

## 2. 원인
- 메커니즘: `StudioLayout.tsx:247-252` — 단축키 맥락 `historyKeys.current = { locked: snaps.preview !== undefined, … }`는 **useEffect(passive effect)** 에서 갱신된다. 미리보기 heading(`SnapshotPreview.tsx:115`)은 `snaps.preview`가 바뀐 같은 커밋에서 DOM에 나온다.
- 테스트는 `findByRole(heading)` 직후 바로 Ctrl+Z를 누른다. 미리보기 전환은 비동기(act 밖 상태 갱신, 기본 lane)라 passive effect는 React Scheduler 매크로태스크(setImmediate)로 미뤄진다. RTL `findBy*` 는 끝에 `setTimeout(0)` 한 번을 기다린 뒤 돌아오는데, 부하로 1ms 이상 지연되면 타이머 단계가 Scheduler(check 단계)보다 먼저 돌아 **effect 전에** Ctrl+Z가 간다 → `locked=false` 로 가로채짐(preventDefault) → `false`.
- 앱 영향 판단(정정): 리스너는 React를 거치지 않는 네이티브 `document.addEventListener`(`opAfter.ts:186`)이고 미리보기 전환은 비동기 로드 뒤 non-discrete 갱신이라, 실제 브라우저에도 커밋과 passive effect 사이 수 ms 창이 **이론상 존재**한다(키 이벤트가 Scheduler 태스크 뒤에 온다는 보장 없음). 실사용 영향은 미미(미리보기가 막 열리는 순간 Ctrl+Z를 누르는 경우 정도)로 판단. 이번 실패는 테스트 조작 순서에서 생긴 것이라 테스트만 수정했다. 잠금을 render 단계 값·layout effect로 옮길지는 앱 코드 판단이라 **Jarvis에게 남김**(수정 안 함).
- 재현율:
  | 조건 | 결과 |
  |---|---|
  | 전체 스위트 직렬(수정 전) | 1/15 실패 |
  | 파일 단독 직렬 | 0/12 실패 |
  | 파일 10개 동시 × 3회(CPU 부하) | 0/30 실패 |
  | **부하 흉내 probe**(임시 파일: 0ms 타이머 등록 직후 3ms 바쁜 대기 → timers 단계가 Scheduler보다 먼저) · 수정 없음 | **6/6 실패**, 같은 assertion(`expected false to be true`) |
  | 같은 probe + 수정(`await settle()`) | 0/8 실패(파일 전체 8 tests) |
  - probe 파일(`FieldUndoProbe.tmp.test.tsx`)은 측정 뒤 삭제 — 커밋 안 함.

## 3. 수정 (테스트만)
- `FieldUndo.test.tsx`: heading 확인 뒤 같은 파일의 기존 헬퍼 `settle()`(act 안 `setTimeout(0)`)을 한 번 기다린 뒤 Ctrl+Z. 이미 대기 중인 Scheduler setImmediate(check 단계)가 다음 루프의 타이머보다 먼저 돌아 effect가 반영된다.
- 앱 코드·config·docs 수정 0.

## 4. 검증
- 파일 단독: `npx vitest run src/components/studio/FieldUndo.test.tsx` → 8 passed.
- `npm run typecheck` 통과 · `npm run lint`(eslint .) exit 0 · `npm run build` exit 0(번들 가드 통과, 생성물 untracked 0).
- 수정 후 전체 스위트 직렬 15회(`dev/active/rs7-flaky-hunt/loop.sh verify 15` = `npx vitest run --reporter=default --reporter=json`): **15/15 GREEN**, 매 회 `Tests 3033 passed (3033)` · rc=0 · 50~60s (logs/runs.txt `[verify #1]`~`[verify #15]`). 실행 중 Codex review·typecheck·lint가 같이 돌아 부하가 더 있었음.

## 정적 조사 후보(서브에이전트 읽기 전용 1개 · 미재현 · 수정 안 함)
이번 실행에서 실패하지 않은 후보 — 추측 수정 금지에 따라 기록만 한다.
1. `features/profile/CompareDialog.test.tsx:161-170` — `useFakeTimers({ shouldAdvanceTime: true })` + 7800ms 진행 후 8000ms 미발화 단언. 렌더 실시간 200ms 초과 시 실패 가능.
2. `data/persistence/imagePersist.test.ts:93` — `vi.waitFor` 기본 1000ms(전역 3000ms 미적용) 타임아웃을 `.catch`로 삼킨 뒤 단언.
3. `components/studio/StudioUnloadGuard.test.tsx` · `features/studio/useDocSaveLeave.test.tsx` — `vi.waitFor` 1s 예산 + `memoryProjectRepository.ts:148` beforeunload 리스너 미해제(순서 의존: shuffle 시 위험, 기본 순서에서는 고정).
4. `components/studio/GatePanel.test.tsx:88` — `waitFor` timeout 1500ms(전역 3000 미만) on 500ms debounce.
5. `pages/ProfileCandidates.test.tsx:206-220` — `shouldAdvanceTime` + 1000ms 폴링 경계 단언.
- 같은 계열(passive effect 로 채우는 ref 를 DOM 등장 직후 합성 이벤트로 검사) 패턴이 다른 파일에 있는지는 전수 조사하지 않음.

## 서브에이전트 기록
- Explore(읽기 전용) 1개: 후보 정적 조사 — 완료, 결과는 위 후보 목록. 파일 쓰기 0.

## 기타
- preview 서버 미기동(포트 확인 불필요).
- Codex 검증: `codex-companion review --scope branch --base bcaa9832` → 조치 필요 결함 없음(1라운드).
- 로그: `logs/runs.txt`(전 회차 요약 + 실패 원문) · `logs/base-10.out`(실패 회차 원본 출력) · `logs/base-10.failed.json`(JSON 리포트 1.4MB에서 요약 필드 + 실패 파일 항목만 남김). 통과 회차 원본은 스크립트가 지움. 반복 스크립트 `loop.sh` 커밋.
