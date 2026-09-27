# PROFILE-HEADROOM — REPORT

**결론: 목표 달성 — `/profile` 진입 직후 124.80 → 124.24KB (−0.56, 목표 −0.40 · ≤ 124.40). 여유 0.20 → 0.76.** 다른 시나리오 첫 화면·진입 직후 순증가 0(±0.01 반올림 잡음 제외, 1절).

- 기준 `1a371a7`(= `f8bc3ef` + 브리프) · 커밋 `edf57bc`(0단계) → `48e474c`(구현) → `6eb5de5`(리뷰 반영) + 이 문서 커밋 · 브랜치 `k002bill2/profile-headroom` (push·병합 없음)
- 근거 수준: 번들 수치 L1(`npm run build` → `check-bundle-size.mjs`, gzip) · 후보 비교 L2(하나씩 적용 → build) · 브라우저 L1(127.0.0.1:4339 실제 클릭)

## 1. 번들 전후 (첫 화면 / 진입 직후, 예산 100 / 125)

| 시나리오 | 기준 `logs/base-rebuild.txt` | 결과 `logs/final-build.txt` | 차이 |
|---|---|---|---|
| 공통 JS | 89.34 | 89.34 | 0 |
| `/catalog` | 99.64 / 102.03 | 99.64 / 102.03 | 0 / 0 |
| `/references/:id` | 96.99 / 99.37 | 96.99 / 99.38 | 0 / +0.01* |
| `/compare` · (조정 있음) | 98.41 / 121.37 | 98.41 / 120.82 | 0 / **−0.55** |
| **`/profile`** | 99.40 / **124.80** | 99.41* / **124.24** | +0.01* / **−0.56** |
| `/projects` | 93.95 / 106.94 | 93.95 / 106.38 | 0 / −0.56 |
| `/studio/:projectId` | 90.73 / 104.28 | 90.73 / 103.72 | 0 / −0.56 |
| `/profile` 조작 뒤 memoryGenerate | +4.74 | +5.34 | +0.60(예산 판정 밖) |

- *±0.01: 바뀐 청크가 없는 합계에서 나온다(`ProfilePage` 6.96 그대로, `logs/final-profile-chunks.txt`). 다른 청크의 콘텐츠 해시 파일명이 바뀌어 import 문 문자열의 gzip 크기가 몇 바이트 달라진 반올림 잡음으로 본다(L2 추론, 바이트 분해는 안 함). 구현 직후 빌드(`logs/exp-A-generate-body.txt`)에서는 `/profile` 첫 화면 99.40 · `/references` 99.37로 기준과 같았다.
- 청크 변화: `memoryStudio` 4.35 → 3.78(−0.57). **청크 목록 이름 동일**(새 청크·공유 청크 분할 없음 — `diff` 확인, `logs/chunk-check.txt`). `memoryGenerate` import 목록은 기준과 같다(`memoryStudio` 참조는 기존 `GenerationError` 때문, 기준에도 있음).

## 2. 0단계 · 후보별 실측 (PROGRESS `edf57bc`에 먼저 커밋)

| 후보 | `/profile` 진입 직후 | 다른 시나리오 | 판정 |
|---|---|---|---|
| **A** 3안 잡 조립·실패 주입·재시도 판정 → `memoryGenerate`(기존 `loadGenerate`, 새 로더 0) | 124.23 (−0.57) | 증가 0 | **채택** |
| B 보드 저장소의 `buildProfileDraft`를 확정 때 받기(새 로더 / 재수출 래퍼) | 123.55 (−1.25) | 공통 +0.27(`compareBoard`가 공유 청크로 분리) · `/catalog` 첫 화면 99.90 · `/compare` 진입 직후 +1.03 | 기각 |
| C `memoryStudio`의 보드 저장소를 deferred + `import()` | 120.32 (−4.48) | `/compare` +0.08 / +1.14 · `COMPARE_AUTO` 등록 필요 | 기각(분류 변경·순증가) — **후속 후보** |

청크 구성표·로그·패치는 PROGRESS 0단계 절. 첫 화면 밖 부품 lazy(ProfilePage → 엔진)는 진입 직후 지표에 효과가 없어(C8 선례 +0.43) 실측하지 않았다.

## 3. 변경 파일
- `app/src/data/memoryGenerate.ts` — `newJob`(새 잡 조립 + 안별 실패 주입)·`retryJob`(재시도 판정·계산·실패 주입) 추가, `FAILURE_TEXT`·`RETRYABLE` 이동. 머리 주석 한 줄.
- `app/src/data/memoryGenerationRepository.ts` — 요청·재시도 트랜잭션이 위 두 함수를 부르고 `putJob`만 한다. 멱등 판정(이미 있는 잡·없는 버전 → 본문 안 받음)·조회·폴링·선택은 그대로. 생성기 버전은 `MEMORY_GENERATOR_VERSION`을 `newJob`에 넘긴다(멱등 키와 같은 값 하나 — 리뷰 Major 반영).
- `app/src/pages/ProfileGenerateLoad.test.tsx`(신규) — 소스 가드 2 + 로딩·실패 특성 3.
- 수정 금지 3파일(`memoryBoardConfirm`·`memoryProjectRepository`·`boardConfirmProject.test`)·`check-bundle-size.mjs`·예산·분류 무접촉. engine import·새 의존성 없음.

### 편차 (한 줄)
- `check-bundle-size.mjs`의 `/profile` afterAction 주석 "memoryGenerate = composeCandidates·lintPlan"은 이제 잡 조립·재시도 판정도 포함하지만, 스크립트 무접촉 원칙으로 고치지 않았다.

## 4. 로딩 상태 테스트 (TDD)
| 단계 | 결과 |
|---|---|
| RED (구현 전, `logs/red.txt`) | 소스 가드 2 실패(저장소에 `FAILURE_TEXT` 등 있음 · `newJob`/`retryJob` 없음) / 특성 3 통과 |
| GREEN | 5/5 |

- 특성 테스트(구현 전에도 통과 — 로더 호출 지점 불변 확인용): ① "3안 만들기" 본문 받는 동안 버튼 `aria-busy` "만드는 중…"·카드 없음·잡 0 → 받은 뒤 3안 + 비교 표 ② 받기 실패 → role=alert "3안 만들기를 요청하지 못했습니다 · 다시 시도하세요"·잡 0 → 다시 누르면 다시 받아 성공(로더 2회) ③ "C안 다시 시도" 받는 동안 `aria-busy` → 실패 문구 "다시 시도를 요청하지 못했습니다"·C 실패 그대로·attempts 1 → 다시 받으면 C만 다시(attempts 2) → 3안.

## 5. 검증 (fresh, app/, 리뷰 반영 후)
| 명령 | 결과 | 로그 |
|---|---|---|
| `npm run typecheck` | exit 0 | `logs/typecheck.txt` |
| `npm run lint` | exit 0 | `logs/lint.txt` |
| `npx vitest run` | 107 files / **1233 passed · 1 failed** (exit 1) | `logs/vitest.txt` |
| `npm run build` | exit 0 | `logs/final-build.txt` |

- 실패 1건 = `ProfileCandidates.test` P-AC-29 "B안으로 편집 시작 → /studio"(`expected '/projects' to be '/studio'`). **기준 코드에서도 같은 실패**(내 변경을 되돌리고 단독 실행해 확인, L1). editor-a1-beta REPORT 45행에 "미처리 — 0단계 `/studio` 리다이렉트가 깸, a1-β 1단계 몫"으로 기록된 기존 실패다. 수정하지 않았다(범위 밖 · ProfilePage 변경 필요).

### 브라우저 (vite preview 127.0.0.1:4339, ego-browser, 1280)
- `/catalog` → 모던 카페 브랜드·동네 치과 클리닉·부티크 법률사무소 비교 추가 → 트레이 "비교 보드 열기" → `/compare` 보드 → "이 레퍼런스로 전부 선택: A" → "프로필 확정 (v1)" → `/profile/profile-1`.
- 보정: "보정값 쓰기 (보조 글자 muted)" → "조정 저장 (v2)" → 머리 "v2 · 현재".
- "3안 만들기 (v2)" 1회: MutationObserver로 `만드는 중…` → `3안을 만드는 중입니다` → `1/3 완료` → `2/3 완료` 순서 관찰 → A안·B안·C안 카드 + 표 "3안 비교", role=alert 0.
- 서버: 내가 띄운 preview PID만 종료, `lsof -iTCP:4339 -sTCP:LISTEN` 비어 있음 확인. TaskSpace `finish`.
- 캡처는 `Page.captureScreenshot` CDP 타임아웃으로 남기지 못했다(동작 확인은 DOM 값으로).

## 6. 리뷰
- **Codex: 통과(지적 0)** — 1회차는 사용량 한도로 실패(`logs/codex-r1.txt`), 한도 복구 뒤 같은 명령 `review --scope branch --base 1a371a7` 재실행(`logs/codex-r2.txt`, 리뷰 반영 `6eb5de5` 포함): "job creation and retry behavior 보존" 판정, 지적 없음. Codex 쪽 대상 테스트 실행은 샌드박스 쓰기 제한으로 못 했고 typecheck만 통과 — 테스트는 5절 메인 실행이 근거.
- 대체: 독립 컨텍스트 code-reviewer 에이전트(읽기 전용). 판정 순서·`onCompose` 시점·attempts·원자성·동결·`import type` 방향 문제 없음 확인.
  - Major 1 → **반영**(`6eb5de5`): `newJob`이 도메인 `GENERATOR_VERSION`을 써서 멱등 키 상수와 출처가 갈렸다 → 저장소 `MEMORY_GENERATOR_VERSION`을 넘기게 했다.
  - Minor 1(미반영): 저장소 로컬 `isTerminal`과 도메인 `isTerminal`이 따로 있다 — 로컬 쪽은 기존 설계(도메인 런타임 import 회피)라 그대로 둔다.

## 7. 미검증 · 남은 후보
- 390 폭·스크린리더 실기기 낭독은 확인하지 않았다(동작·문구·role은 테스트와 DOM으로 확인).
- **후속 후보 C**(ADR-004·분류 판단 필요): 보드 저장소를 `memoryStudio`에서 지연 로드하면 `/profile` −4.48 · `/projects`·`/studio` 약 −5.1이지만 `/compare` +0.08 / +1.14이고 `COMPARE_AUTO`에 새 자동 import를 등록해야 한다(`logs/exp-C.patch`).
- 후보 B는 rolldown이 `compareBoard`를 공통 공유 청크로 떼어 공통 +0.27 — FIX3 noinject와 같은 재분할. `memoryBoardConfirm`이 직접 `buildProfileDraft`를 받는 안은 수정 금지 파일이라 시도하지 않았다.
