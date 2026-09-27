# PROFILE-HEADROOM-2 — REPORT

> 브랜치 `k002bill2/profile-headroom-2` · base main `1d5ae03`(+브리프 `822139e`) · 2026-09-27 · 서브에이전트 0 · studio 파일 수정 0 · push·병합·삭제 없음 · Codex는 이관(Jarvis 병합 전 판단).

## 1. 요약
- **`/profile` 진입 직후 124.70 → 123.57KB (여유 0.30 → 1.43, 목표 ≤123.90 달성).** 첫 화면 99.60 → 99.61, 다른 화면·공통 ±0.01(해시 요동 범위).
- 방법 = 1안: 카드 목록 + 비교 표를 새 청크 `CandidateResults`로 묶었다. 잡이 있을 때 받고, "3안 만들기" 클릭 때 미리 받는다.
  - 로딩 = 기존 `LoadingState`("3안을 불러오는 중…") · 실패 = Callout(role=alert) + "다시 시도".
- **브리프 이탈 1건:** 로더가 `data/chunkRetry`의 `retryableImport`를 import하지 않는다. 같은 방식(새 URL `?retry=N`)을 프로필 전용 로더 `candidateResultsLoader.ts`에 다시 썼다. 근거는 3절(실측).
- 기존 테스트 수정 **0건**(기다림 조정도 불필요). 새 테스트 1파일 2건 RED→GREEN.

## 2. 커밋
| SHA | 내용 |
|---|---|
| `58a1d64` | P0 base build · PROGRESS 수신 |
| `a15a616` | P1 — `features/profile/CandidateResults.tsx`(새) · `features/profile/candidateResultsLoader.ts`(새) · `features/profile/CandidatesSection.tsx` · `features/profile/generationText.ts`(문구 2) · `logs/h1-measure.txt` · `logs/h1-build.txt` |
| `d59c77d` | P2 — `pages/ProfileCandidateResults.test.tsx`(새) · `logs/p2-red.txt` · `logs/p2-green.txt` |
| (이 커밋) | P3 로그 · REPORT · PROGRESS |

## 3. P1 실측 — 변형 4개 (`logs/h1-measure.txt`, vite build gzip KB)
| 변형 | /profile 진입 | 부작용 | 판정 |
|---|---|---|---|
| base | 124.70 | — | — |
| 1. CandidatesSection이 `retryableImport` import | 123.61 | `chunkRetry`가 profileDraft에서 떨어져 새 청크 0.28 → 공통 +0.02 · /profile 첫 +0.04 · /catalog +0.02 · CompareBoardPage·boardEngine·memoryStudio 등 +0.02 | 기각(수용 기준 1 위반) |
| 2(a). plain `import()` | 123.42 | 0 | 기각 — Chromium은 실패한 import URL을 기억해 "다시 시도"가 동작하지 않는다(chunkRetry 주석, F1) |
| 2(b). 2안 자리 `writeBodyLoader.ts`에 `loadCandidateResults` | 125.51 | 청크 대재배치 · /profile 첫 100.24(예산 초과) | 기각 · 파일 원복 |
| **3(c). 프로필 전용 로더(새 URL 재시도, chunkRetry import 없음)** | **123.55** | 0 | **채택** |

- 원인(L1): 엔진 청크(동적 진입)가 `chunkRetry`를 정적 import하면 도달 진입 집합이 달라져 Rollup이 chunkRetry를 따로 뗀다. 기존 importer 전부에 import 한 줄이 붙는다.
- 3(c)가 빌드 출력에서 동작하는지 확인했다: 로더 소스가 ``()=>a(()=>import(`./CandidateResults-<해시>.js`),…)``이고, 정규식이 `CandidateResults-<해시>.js`를 읽는다.
- 대가: `retryableImport`의 20줄 남짓을 한 청크 전용으로 다시 썼다(중복). chunkRetry 로직이 바뀌면 함께 바꿔야 한다 → 파일 주석에 이유를 적었다.

## 4. 번들 (gzip KB, `[bundle]` 판정 줄)
| 시점 | /profile 첫/진입 | /catalog 첫/진입 | /references 첫/진입 | /compare 첫/진입 | /projects 진입 | /studio 첫/진입 | 공통 |
|---|---|---|---|---|---|---|---|
| base `822139e` | 99.60 / 124.70 | 99.64 / 102.03 | 96.99 / 99.38 | 98.75 / 121.40 | 106.98 | 90.73 / 104.33 | 89.34 |
| P1 `a15a616` | 99.61 / **123.57** | 99.65 / 102.04 | 97.00 / 99.38 | 98.76 / 121.41 | 107.00 | 90.73 / 104.33 | 89.34 |
| P3 final | 99.61 / **123.57** | 99.65 / 102.04 | 97.00 / 99.38 | 98.76 / 121.41 | 107.00 | 90.73 / 104.33 | 89.34 |

- 청크별(base → P1): profileEngine 9.98 → 8.85 · **CandidateResults 새 청크 2.44**(조작 뒤·잡 있을 때만 — `/profile` 진입 합계 밖) · ProfilePage 7.18 → 7.19 · 그 밖 ±0.01.
- 참고: CandidateResults는 번들 스크립트의 "조작 뒤" 목록에 나오지 않는다(엔진 청크 안의 동적 import라 스크립트가 따라가지 않음). 이미 잡이 있는 채 들어오면 진입 뒤 받는다 — 판정 밖이지만 실제 전송량은 그만큼 늘어난다.

## 5. 동작·접근성
- `aria-label="3안"` 목록 · 카드 선택(aria-pressed)·busy·selected · 비교 표 · 편집 시작 흐름 · 실패 Callout — 마크업을 그대로 옮겼다(`CandidateList`). 편집 시작 버튼 위치(카드 → 편집 시작 → 표 순서) 그대로.
- 잡이 있는데 청크가 아직 없으면 카드 자리에 `LoadingState`(role=status, "3안을 불러오는 중…"). 실패 = role=alert Callout "3안 결과를 불러오지 못했습니다" + "다시 시도"(새 URL). 새 문구 2개는 `generationText.ts`.
- 레이아웃: 로딩 표현은 한 줄 높이(py-16)라 카드(4:5 비율 3열)가 뜰 때 아래로 밀린다. 미리 받기 덕에 "3안 만들기" 흐름에서는 잡 도착 전에 청크가 와 있어 거의 보이지 않는다. 재진입(잡 있음)에서만 잠깐 보인다.
- 목업과 다른 점: 없음(로딩·실패 표현은 목업에 없는 상태).

## 6. 테스트
- **바꾼 기존 테스트: 없음.** src/pages + features/profile 27파일 288/288이 수정 없이 통과(카드 등장을 이미 `findBy`로 기다림).
- 새 `app/src/pages/ProfileCandidateResults.test.tsx`(2건):
  1. 진입만으로는 로더 호출 0 → "3안 만들기" 클릭에 미리 받기 호출 → 잡이 오고 청크 전이면 role=status "3안을 불러오는 중…" · 목록·표 없음 → 도착 뒤 목록 + 카드 3(선택 버튼) + 비교 표 · 로딩 사라짐.
  2. 청크 실패 → role=alert "3안 결과를 불러오지 못했습니다" · 카드 0 → "다시 시도" → 로더 다시 호출 → 카드 3 + 표 · 알림 사라짐.
- RED(`logs/p2-red.txt`, CandidatesSection만 base로): 2/2 실패. GREEN(`logs/p2-green.txt`): 3회 연속 2/2.

## 7. 전체 vitest 3회 (`logs/full-x3.txt`)
`npx vitest run` 3회 연속(순차, 다른 부하 없음) — **3회 모두 exit 0 · Test Files 118/118 · Tests 1314/1314 · 실패 0**. 원시 로그 `logs/full-run{1,2,3}.txt`.

## 8. 최종 build
`npm run build` exit 0(`logs/final-build.txt`, tsc 포함) · `npx eslint .` exit 0(`logs/final-lint.txt`). 수치는 P1과 같다(4절 표). 새 청크 1개(CandidateResults), 멈춤선 해당 없음.

## 9. 남은 위험 · 이관
- **chunkRetry 로직 중복**(3절). 공통화하려면 chunkRetry를 엔진 청크와 같은 청크에 두는 설정(manualChunks 등, 소유 밖)이 필요하다 — Jarvis 판단.
- **재진입 로딩 깜빡임:** 잡이 이미 있는 채 들어오면 카드 자리에 로딩 한 줄 → 카드로 바뀐다(레이아웃 이동). 브라우저 확인은 병합 뒤 QA.
- 로더 실패 테스트는 로더 모듈을 mock한다. 실제 브라우저의 `?retry=N` 경로는 빌드 출력 파싱까지만 확인했다(브라우저 흐름 검증 없음, 브리프 지시).
- Codex 리뷰 미실행(이관).

## 10. 작업자 미커밋 변경 보존 (Jarvis, 2026-09-27 21:2x — 작업자 46턴 max_turns 종료)
- 작업자가 REPORT 9절 "재진입 로딩 깜빡임"을 고치던 중 끊겼다. 미커밋 `CandidatesSection.tsx` 변경을 Jarvis가 검토해 보존한다:
  - 로딩 표현을 `LoadingState` 한 줄 → **카드와 같은 자리(4:5·3열) 자리표시** — 첫 칸에만 `role=status` "3안을 불러오는 중…", 나머지 `aria-hidden`. 레이아웃 이동 완화.
  - 미리 받기 결과를 `setResults`로 바로 반영(`.then(setResults, () => undefined)`).
- Jarvis 검증: typecheck 0 · lint 0 · profile 관련 90/90(`p2-green-final.txt` 작업자 2/2 포함) · build 0 · **전체 vitest 3회 1314/1314**(`logs/jarvis-wip-full-x3.txt`).
- 번들(`logs/jarvis-wip-build.txt`): `/profile` 첫 99.60 · **진입 123.65**(여유 1.35, 목표 ≤123.90 충족) — 커밋 `a15a616`(123.57) 대비 +0.08은 자리표시 JSX. 다른 화면·공통 base와 같음.
- 작업자가 덮어쓴 `final-build.txt`·`full-run*.txt` 변경은 버리고(커밋된 P3 로그 유지) 위 Jarvis 로그로 대체.
