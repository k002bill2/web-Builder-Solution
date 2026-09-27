# UI-2A04C REPORT — 승인된 3안 UI 실구현 (Jarvis 회수용)

- 작업 공간 `ui-2a04c` · 브랜치 `k002bill2/ui-2a04c` · 기준 `2804775`(main `9bcf0d2` + 브리프) · 2026-09-27 KST
- 근거 수준: 코드·테스트·빌드·브라우저 = L1(직접 실행) · 표기 없는 수치는 이 문서의 로그에서 인용

## 0. 판정 요약
| 영역 | 판정 | 근거 |
|---|---|---|
| 렌더(실제 작동) | **통과** | 브라우저 127.0.0.1:4337 catalog → compare → v1 확정 → 3안 만들기(생성 중 자리·알림) → 3안 + 비교 표 → B안 선택 → "B안으로 편집 시작" → `/studio`(시안 2a-05) — 1차 `logs/browser-flow-1.log` · 수정 확인 `logs/browser-flow-2-fixcheck.log`(둘 다 exit 0), `shots/`(수정 확인 회차 캡처로 덮어씀) |
| 번들 | **통과(여유 얇음)** | 최종 `logs/gate-build-final.log`: `/compare` 99.68 / 120.59 · `/profile` 99.47 / 124.59 (예산 100 / 125, 최소 여유 0.3 충족: `/compare` 0.32 · `/profile` 0.53 / 0.41 — 3절) |
| 비주얼 | **통과(자체 판정)** | 1280 2단 · 1024/768 한 열 + 3카드 + 비교 표 · 390/320 한 열·표 없음, 가로 넘침 0(5폭) — 5절 차이 표 |
| 4게이트 | **통과(1건 표적 재현 후)** | typecheck exit 0 · lint exit 0 · build exit 0 · vitest 전체 1회 89파일/1089개 중 1 실패(`chunkRetryWiring` 로더 6개 고정 단언 — 새 조작 뒤 로더 추가) → 단언 갱신 후 표적 재실행 1/1 통과 (4절) |
| Codex review | **BLOCKED** | 사용량 한도(“try again at 3:26 PM”) — `logs/codex-review-1.raw.log`. 대체로 읽기 전용 code-reviewer 서브에이전트 검토(Codex 아님) |

## 1. 완성한 실제 화면 (`/profile/:id` 3안 영역, 자리표시 교체)
- **P-S17** 3안 없음: h2 "3안" · 결정성 캡션 "프로필 v1 · 라이브러리 1.4 · seed … · 생성기 preview-1 → 같은 입력이면 같은 결과" · 구조 미리보기 캡션(상시) · "3안 만들기 (vN)" + "같은 버전으로 다시 만들면 같은 결과가 나옵니다"
- **저장 안 된 조정 차단**: 조정이 1개 이상이면 "3안 만들기" `aria-disabled` + 보이는 이유 "저장하지 않은 조정이 있습니다 — 저장하면 새 버전으로 만듭니다"(클릭해도 요청 0). 이전 버전 보기(`?v=1`)에서는 그 버전으로 생성 가능(생성 재현)
- **P-S18** 생성 중: 버튼 `aria-busy` "만드는 중…", 카드 3칸 고정 비율(4:5) 자리 "A안 만드는 중 · n/3 완료", `role=status` "프로필 알림" 단계가 바뀔 때만(시작 · 1/3 · 2/3 · 완료)
- **P-S19** 성공: 카드 3(`ul`/`li`, h3 "A안") — 자체 와이어프레임(프로필 역할 팔레트를 CSS 변수로, `aria-hidden`) · 축 3개 캡션 · 로그 3줄 · lint "경고 N" + 규칙 · 원인 · 대체안(R-08은 "대비 보정으로" 앵커) · 결과 해시(`ds-mono`) · "이 안 선택"(`aria-pressed`, 이름 "A안 선택") · "섹션 순서 보기" · "전체 로그". ≥768 비교 표(caption "3안 비교", 행 머리글 고정, "A와 다름" 캡션)
- **P-S20/S21** 부분 실패: `role=alert`(이 화면에서 진행을 본 실패만 1회) + "C안을 만들지 못했습니다 · 원인" + 재시도 가능 오류만 "C안 다시 시도"(그 안만 재계산). 전체 결정적 실패: Callout negative + 원인 문장, 재시도 없음
- **P-S22** 선택: "선택됨" 글자 + Tag "선택" + 주 색 테두리(ring) · `aria-pressed=true` · 버튼 "B안으로 편집 시작". 선택 전 `aria-disabled` + "안을 고르면 편집을 시작할 수 있습니다". **편집 미구현 안내 상시**: "편집기는 다음 단계(2a-05)에서 연결됩니다. 지금은 고른 안만 저장되고, 편집 시작을 누르면 편집기 자리표시 화면으로 이동합니다."
- 선택·잡은 저장소가 정본(URL 없음) → 다른 화면에 갔다 와도 유지, 버전마다 자기 잡·선택 복원. "다시 생성" 버튼 없음(M-02)
- `/studio` 자리표시 시안 번호 "1a-05" → "2a-05"(2a-05 SPEC 12.3 — a1 전 임시 경계)

## 2. 미완료 · 차단
| 항목 | 상태 | 이유 |
|---|---|---|
| Codex review | BLOCKED | Codex 사용량 한도(15:26 이후 재시도). 원본 `logs/codex-review-1.raw.log` |
| 편집기(`startDoc`·PageDoc·Q-17~24) | 범위 밖(의도) | 브리프: 2a-05. 편집 시작은 `/studio` 자리표시로만 이동 |
| 엔진 변형 불일치 | 2a-05로 넘김 | 6절 seam 표 — `services/grid-2`·`masonry`, 픽스처 `about/split`·`services/grid-3` 등이 엔진 레지스트리에 없음 |
| VoiceOver·Safari | 미검증 | 도구 범위 밖(Chromium AX만) |

## 3. 번들 (실측, gzip KB, 첫 화면 / 진입 직후)
| 시점 | 공통 | `/compare` | `/profile` | `/catalog` | `/references/:id` | `/studio` |
|---|---|---|---|---|---|---|
| 기준(`logs/baseline-build.log`) | 89.06 | 99.59 / 118.99 | 99.39 / 118.97 | 99.36 / 101.74 | 96.71 / 99.09 | 89.50 / 91.88 |
| 최종(`logs/gate-build-final.log`) | 89.14 | 99.68 / 120.59 | 99.47 / 124.59 | 99.43 / 101.81 | 96.78 / 99.16 | 89.57 / 91.96 |
| 증감 | +0.08 | +0.09 / +1.60 | +0.08 / +5.62 | +0.07 / +0.07 | +0.07 / +0.07 | +0.07 / +0.08 |
- 조작 뒤(예산 밖): `/profile` `memoryGenerate`(composeCandidates·lintPlan·결과 모양 검증) **+4.74KB** — "3안 만들기"·"다시 시도" onClick에서만 로드. 번들 분류 근거 테스트(`ProfileCandidates.test` "번들 분류 근거")가 진입 findJob·폴링·선택·재진입에서 요청 0을 확인
- 자동(진입 직후 합계 포함): 3안 UI(카드·표·와이어프레임·폴링 훅)는 `profileEngine` 청크, 잡 조회·선택은 `memoryStudio`의 `memoryGenerationRepository`(store 조회만)
- 공통 증가 +0.08: 생성 저장소 **로더 핸들 1개**(컨텍스트 필드 + `main.tsx` 화살표 함수) — 위임 래퍼를 공통에 두지 않음(2a-05 S-B3 방식)
- 실측으로 막은 숨은 증가 2건:
  1. 컴포저가 `profileDraft`의 `hash`를 import → rolldown이 profileDraft를 공유 청크로 묶고 `compareBoard`를 공통에서 분리 → `/compare` 첫 화면 **100.00KB**. → FNV `hash`를 `domain/hash.ts`로 분리(profileDraft·composeCandidates 공용) → 99.70
  2. 자동 경로(memoryStudio)가 `generation.ts` 런타임을 import → 공유 청크가 생겨 공통 엔트리 preload 목록 +1 → `/compare` 여유 0.300 → 저장소에 값 3개(생성기 버전·안 id·종료 판정)를 두고 동일성 가드 테스트 → 99.671(여유 0.329)
- 예산 상수·분류 규칙 무변경. `check-bundle-size.mjs`는 `/profile` afterAction에 `memoryGenerate` 1줄 + 호출 지점 주석만 추가

## 4. 검증
- 4게이트(전체 suite는 이 레인 1회, 원본 로그 + 마지막 줄 exit):
  - `npm run typecheck` → `logs/gate-typecheck.log` exit 0 (단언 갱신 뒤 `logs/gate-typecheck-final.log` exit 0)
  - `npm run lint` → `logs/gate-lint.log` exit 0
  - `npx vitest --run` → `logs/gate-vitest.log` exit 1 — **89파일 / 1089개 중 1 실패**: `src/data/chunkRetryWiring.test.ts` "싼 로더 6개…"(조작 뒤 로더 목록을 6개로 고정). 새 `loadGenerate`도 `retryableImport`로 싸여 있어 가드 의도(조작 뒤 로더는 모두 재시도 래퍼)는 지켜짐 → 기대 목록에 `composeFor` 추가(7개) → 표적 재실행 `logs/gate-vitest-rerun-chunkRetryWiring.log` 1/1 exit 0. 나머지 1088개 통과
  - `npm run build`(tsc + vite build + 번들 검사) → `logs/gate-build.log` exit 0
  - 이중 폴링 수정(아래) 뒤 재확인: `npm run lint` → `logs/gate-lint-final.log` exit 0 · `npm run build` → `logs/gate-build-final.log` exit 0 · 표적 `ProfileCandidates`·`ProfileAdjust`·`memoryGenerationRepository` 40/40(`logs/red-green-3-single-poller.log`). 전체 suite는 1회 원칙으로 다시 돌리지 않음 — 수정은 `useGeneration.ts`(엔진 청크) 한 파일 + 테스트 1개
  - 테스트 수: 기준 84파일/997개 → 89파일/1089개(+5파일 · +92개 = 컴포저 74 · 저장소 10 · 화면 7 · 결과 모양 1)
- **TDD 순서(있는 그대로)**: 컴포저(composeCandidates·lintPlan)는 RED 먼저(서브에이전트 A, 74 실패 → GREEN). **저장소·화면 테스트는 구현 뒤에 작성**했고, 대신 핵심 가드 3개를 일부러 지워 실패하는지 확인(Red-Green)했다 — 프로젝트 규칙 2(RED 먼저)와 다른 부분
- 이중 폴링 경쟁(advisor 지적, 검토 Minor-2 수정이 연 경로): 잡 조회(findJob) 응답 전에 "3안 만들기"를 누르면 늦은 findJob 결과가 폴러를 하나 더 만들 수 있었다(메모리 저장소에서는 findJob이 먼저 끝나 재현 안 됨, HTTP 지연 시 발생) → `follow`가 이전 타이머를 지우고, 요청·재시도로 시작한 뒤 온 진입 findJob 결과는 버림. 회귀 테스트 "잡 조회 중 클릭"(findJob 요청 지연) — `logs/red-green-3-single-poller.log`(가드 제거 → 1 실패, 복원 → 통과)
- Red-Green: `logs/red-green-2-idempotency.log`(멱등 제거 → 2 실패), `logs/red-green-1-late-response.log`(늦은 응답 가드 제거 → 1 실패, 1차는 테스트가 공회전해 통과 → 테스트 보강 후 실패 확인), 복원 후 통과. 컴포저 RED 74 실패 → GREEN 74(서브에이전트 A)
- 브라우저: `logs/flow.mjs`(ego-browser, TaskSpace 1개, 새로고침 없음) → `logs/browser-flow-*.log`, `shots/flow.json`, 캡처 `shots/{1280,1024,768,390,320}-04-selected.png`·`1280-01-before`·`1280-02-generating`·`1280-03-generated`·`1280-05-studio`
  - 클릭 방식: 카탈로그 "비교 추가"·"비교 보드 열기"·Hero 선택·"3안 만들기"·"B안 선택"·"B안으로 편집 시작"은 `page.click`(실제 포인터 입력). **보드 "프로필 확정"만** 이전 레인 스크립트를 이어받아 DOM `.click()`(`page.evaluate`)으로 눌렀다 — 브리프 "브라우저 클릭"과 다른 1곳
  - 기능: 생성 중 `aria-busy=true` · 자리 3칸 "n/3 완료" · 알림 "3안을 만드는 중입니다" → "3안을 만들었습니다" · B안 `aria-pressed=true` · `/studio` h1 "편집기" + "시안 2a-05"
  - 폭: 1280 레이아웃 2열·카드 3열·표 보임 · 1024/768 레이아웃 1열·카드 3열·표 보임(표 가로 넘침 0) · 390/320 카드 1열·표 숨김 · 5폭 문서 가로 넘침 0 · 잘린 글자 요소 0
  - 키보드: A안 선택 → 섹션 순서 보기 → 전체 로그 → (R-08 앵커) → B안 선택 … → B안으로 편집 시작, 모두 `:focus-visible` 링

## 5-0. Jarvis·Designer 판단이 필요한 질문 (막는 것 없음, 현재 구현값)
1. **본문 수에 Hero 포함**(U-3) — SPEC 4.2 문구("본문 9개 초과")와 엔진 `BODY_MIN/MAX`·TRD "본문 5~9"가 Hero를 포함. 지금 구현 = 엔진 기준(2a-05 `createDocFromCandidate` 거부 방지). SPEC 문구 정정 여부
2. **엔진 변형 이름 대응**(6절) — 축 적용 `services/grid-2`·`masonry`, 픽스처 `about/split`·`services/grid-3`이 엔진 레지스트리에 없음. 레지스트리 확장 vs 대응표 — 2a-05 a1 전에 결정
3. **재시도 버튼 통합**("B·C안 다시 시도") vs 안별 버튼 — 지금은 통합(결과 동일)

## 5. 원본(v2 목업·SPEC) 대비 의도된 차이
| # | 내용 | 근거 |
|---|---|---|
| M-02 | "다시 생성" 없음 — 재시도는 실패 안만 | SPEC 4.5 |
| M-08 | 선택 = 테두리 + "선택됨" + Tag + `aria-pressed` | SPEC 5.4 |
| M-09 | 썸네일 = 프로필 토큰 데이터로 칠한 와이어프레임(hex 0) | SPEC 4.1 |
| M-10 | 미리 선택 없음, 버튼 이름이 선택을 따름 | SPEC 4.6 |
| M-11 | 상단 "생성 로그" 버튼 없이 안마다 3줄 + 전체 로그 | SPEC 4.3 |
| U-1 | 선택 테두리는 `ring`(box-shadow) — 테두리 두께 변화로 인한 배치 이동 0 | 사용성 |
| U-2 | 편집 시작 옆 **편집 미구현 안내 상시** | 브리프 3 |
| U-3 | 본문 수에 Hero 포함(엔진 `BODY_MIN/MAX`·`structureIssues`·TRD "본문 5~9"와 같은 기준) — SPEC 4.2 문구보다 엔진 판정을 따름 | 2a-05 `createDocFromCandidate` 거부 방지(서브에이전트 A 판단) |
| U-4 | lint `message`에는 규칙 ID가 없고 화면이 "R-08 · 원인 · 대체안"으로 붙임 | 엔진 ruleId/cause 분리 |

## 6. 편집기(2a-05)로 넘길 seam
| seam | 위치 | 상태 |
|---|---|---|
| 구조안 → 문서 | `domain/generation.ts` `toEngineCandidate(job, plan)` = 엔진 `createDocFromCandidate` 첫 인자 모양(`candidateId`·`sections`·`libraryVersion`·`generatorVersion`), 타입 대입 테스트(`memoryGenerationRepository.test`) | 모양 일치. **런타임 미연결**(engine import 0 유지 — `engineImportGuard` 통과) |
| 변형 이름 | 축 적용 결과 `services/grid-2`·`services/masonry`, 픽스처 `about/split`·`services/grid-3`·`list` 등 | 엔진 레지스트리(`services: cards-3|list`, `portfolio: grid-3`, `about: story|text`)에 없어 `UNKNOWN_VARIANT` 예상 → 레지스트리 또는 픽스처 대응표 결정 필요(2a-05 a1) |
| 편집 시작 | `CandidatesSection` 버튼 `navigate("/studio")` | 2a-05 12.3: `startDoc(projectId, version, candidateId, "create")` 후 `/studio/:projectId`로 교체 |
| 선택 저장 | `GenerationRepository.selectCandidate`(성공 안만, 멱등) · `findJob`이 선택 복원 | 그대로 사용 |
| 라이브러리 버전 | 저장소가 `profile.library_version`의 라이브러리를 넘김(없으면 세 안 결정적 실패). 컴포저는 버전 일치를 다시 검사하지 않음 | M2 라이브러리 여러 벌 때 저장소 책임 |

## 7. 변경된 기존 단언 · 테스트 수
- `pages/ProfileAdjust.test.tsx` "1280 2단…": `within(3안).queryByRole("button")` 없음 → "3안 만들기 (v1)" 버튼 있음(자리표시가 실제 영역이 됨). 배치·순서 단언은 그대로
- `data/chunkRetryWiring.test.ts` "싼 로더 6개…" → "7개…": 기대 목록에 `composeFor`(3안 계산 본문) 추가 — 새 조작 뒤 로더도 재시도 래퍼로 싼다는 가드 의도 유지
- 추가: `domain/composeCandidates.test.ts`·`domain/lintPlan.test.ts`(74) · `data/memoryGenerationRepository.test.ts`(10) · `pages/ProfileCandidates.test.tsx`(7) · `data/memoryGenerate.test.ts`(1)

## 8. 서브에이전트 · ultracode
- ultracode: 세션 신호("Ultracode is on" system-reminder) 있음 — 프롬프트 키워드로도 주입될 수 있어 `--effort ultracode`에 귀속 불가. `claude --help`의 `--effort` 목록(low~max)에 없음 → CLI 공식 지원 미확인. 실행 인자에는 `--effort ultracode`가 있었고 거부되지 않음
- spawn 2개(동시 최대 2): 공유 store·ProfilePage 통합·저장소·UI는 메인
  - A = Workflow `wf_fcc7d984-d6a` 1 agent(worktree `wf_fcc7d984-d6a-1`, 삭제 금지라 남겨 둠) — composeCandidates·lintPlan TDD, `bb9d758` → cherry-pick `81bfe9b`. RED 74 실패 → GREEN 74, 해석 3건(5절 U-3·U-4, 없는 Footer 변형 = R-12)
  - B = code-reviewer(읽기 전용) — UI 수용 기준 검토, Major 1 · Minor 2:
    1. [Major] 생성기 결과 개수·순서 미검증 시 잡이 "만드는 중"에 고착 → **반영**: `memoryGenerate`에서 A·B·C 검증, 어긋나면 `SCHEMA_INVALID`·잡 0(`memoryGenerate.test`)
    2. [Minor] 잡 조회 중(null) 빈 구간 → **반영**: "3안 만들기" 자리 유지(요청은 멱등). 이 수정이 연 이중 폴링 경로는 advisor 검토로 찾아 막음(4절)
    3. [Minor] 재시도 버튼이 안별이 아니라 통합("B·C안 다시 시도") → **유지**: `retryFailed`가 재시도 가능한 실패 안만 다시 계산하므로 결과 동일, 버튼 이름이 대상 안을 모두 밝힌다
- 커밋 예외: `81bfe9b`는 서브에이전트 커밋 `bb9d758`의 **cherry-pick**(경로 지정 `git commit -- <paths>`가 아님). 대상 4파일(`domain/composeCandidates.ts`·`lintPlan.ts`와 두 테스트)만 담겼고 Co-Authored-By 푸터 있음. 이력은 고치지 않음
- 서브에이전트 worktree `wf_fcc7d984-d6a-1`은 삭제 금지라 남겨 둠(추적 안 되는 `app/node_modules` 심볼릭 링크 있음)
- 자체 발견: 늦은 응답 테스트가 지연 지점 도달 전에 화면을 옮겨 공회전 → 1차 Red-Green에서 발견·보강(4절)

## 9. 추가 리뷰 (`/code-review 2804775..HEAD`, Codex 한도 대체 — Codex 아님)
| # | 지적 | 조치 |
|---|---|---|
| 1 (Medium) | `select()`가 받은 잡으로 통째로 덮어써, 폴링이 먼저 끝난 뒤 늦은 선택 응답이 오면 "만드는 중"에 멈추고, 선택 전에 보낸 조회 응답이 늦으면 선택이 지워짐 | 선택 응답은 `selected`만 병합하고, 마지막 선택을 ref에 기억해 이후 조회 응답에도 덮어 씀 |
| 2 (Low) | 조회 중 누른 멱등 요청이 이미 끝난 잡을 돌려받아도 새로 만든 것처럼 요청·완료 계측과 완료 알림, 실패 alert를 다시 냄 | 응답이 종료 상태면 요청 이벤트·단계 알림·완료 계측을 건너뛰고 표시만 함 |
| 3 (Low) | 경고·정보 목록의 key가 `rule+message`라 같은 문구(중복 header 등)가 겹침 | key에 순번 포함 |
| 사소 | `writeBodyLoader`의 `loadGenerate` 주석 위치 | 순서 정리 |
- 회귀 테스트 2개를 `ProfileCandidates.test`에 추가함(선택 응답 지연, 다른 탭이 이미 끝낸 잡). 수정을 되돌리면 2개 실패, 복원하면 10/10 — `logs/red-green-4-review-fixes.log`
- lint·build 결과: `logs/gate-lint-review-fix.log`, `logs/gate-build-review-fix.log`(exit와 번들 수치 포함). 전체 suite는 1회 원칙이라 다시 돌리지 않았고, `src/pages` 전체와 관련 data 테스트만 표적으로 재실행함
- Codex 게이트는 계속 미실행 — 15:26 이후 `review --scope branch --base 2804775`

## 10. main 병합 · 리뷰 수정 이식 (`UI-2A04C-REVIEW-PORT_BRIEF`, 병합 커밋 `30b2943`)
**판정: 병합·이식·테스트·4게이트 통과. 번들 순증가 +0.04KB로 브리프 멈춤 조건에 걸림 — Jarvis 판단 필요.**

### 충돌 해결
- `CandidateCard.tsx`: main(`cdbad18`)의 접힘 카드(`<details>` 상세, Tag 경고, 문구·접근성)를 그대로 채택. 이 브랜치의 펼친 로그·경고 블록은 버림. 수정 3(key 순번)만 main의 `plan.lint.map`에 옮김.
- `ProfileCandidates.test.tsx`: 대기 코드(`findAllByText`)는 양쪽 동일 — main 주석을 채택(`:76`). 회귀 테스트 2개(`:210` describe)는 자동 병합으로 남음. 단언 변경·삭제 0.

### 옮긴 수정 3건 (main 대비 diff는 이 3파일뿐)
| # | 의미 | 위치 |
|---|---|---|
| 1 | 선택 응답은 `selected`만 병합 + 마지막 선택을 ref로 기억해 늦은 조회 응답에도 덮어 씀 | `app/src/features/profile/useGeneration.ts:33`, `:49`, `:133-134` |
| 2 | 멱등 요청이 끝난 잡을 돌려받으면 요청 이벤트·단계 알림·완료 계측 재발행 없음 | `app/src/features/profile/useGeneration.ts:118` |
| 3 | 경고·정보 key = `rule-순번` | `app/src/features/profile/CandidateCard.tsx:97-98` |
| 사소 | `loadGenerate` 주석 순서 | `app/src/data/writeBodyLoader.ts` (번들 영향 0 실측) |

### 검증 (모두 `30b2943` 기준, fresh 실행)
- RED/GREEN: `useGeneration.ts`를 main 버전으로 되돌리면 회귀 2개 실패(2 failed | 8 passed), 복원 10/10 — `logs/red-green-5-merge-port.log`
- `ProfileCandidates.test.tsx` 단독 5회 연속 10/10 — `logs/merge-port-solo5.log`
- 전체 vitest 1회: 105 파일 · 1212 테스트 통과, exit 0 — `logs/merge-port-full-vitest.log`
- typecheck·lint·build exit 0 — `logs/merge-port-{typecheck,lint,build}.log`

### 번들 (`/profile`, gzip KB, 첫 화면 / 진입 직후)
| 빌드 | 첫 화면 | 진입 직후 |
|---|---|---|
| main 스냅샷(`git archive main`, 같은 node_modules) | 99.56 | 124.74 |
| + `writeBodyLoader.ts` | 99.56 | 124.74 |
| + `CandidateCard.tsx` | 99.56 | 124.74 |
| + `useGeneration.ts` (= HEAD) | 99.56 | **124.78 (+0.04)** |
| 시도: `current?.jobId` 축약(동작 동일) | 99.56 | 124.80 — 더 커서 버림 |
- 증가분 전부 수정 1·2(`useGeneration.ts`)의 고유 비용. 이 브랜치 단독 이력에서도 같은 수정이 124.65 → 124.78로 늘렸음(`logs/gate-build-review-fix.log` 계열). 예산 125 이내지만 브리프 기준(순증가 ≤ 0) 위반 → 여기서 멈춤. 다른 파일에서 상쇄·수정 제외·예산 조정은 금지 범위라 하지 않음.
- 선택지: (a) +0.04 수용(여유 0.22) (b) 수정 1·2를 조작 뒤 청크로 옮기는 별도 작업 (c) 수정 제외. 권장 (a) — 둘 다 실제 결함(선택 고착·계측 중복) 수정이고 동작 증거가 있음.

### 미검증
- Codex 게이트 미실행(이전과 같은 한도 차단, 이번 런에서 재시도 안 함). 서버 실측 안 함(선택 항목).
