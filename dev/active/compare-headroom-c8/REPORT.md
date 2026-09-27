# COMPARE-HEADROOM-C8 — REPORT

**결론: 목표 달성 — `/compare`·`/compare (조정 있음)` 첫 화면 99.66 → 98.20KB (−1.46, 목표 −0.45).** 1순위 C8만으로 충분해 2순위(routes 원인 분해 스파이크)는 하지 않았다(브리프 "앞 단계로 목표 달성하면 멈춘다").

- 기준: main `5562dc2` + 브리프 `c9ab667` · 결과 커밋 `bd75333`(+ 이 문서 커밋) · 브랜치 `k002bill2/compare-headroom-c8` (push·병합 없음)
- 근거 수준: 번들 수치 L1(`npm run build` → `scripts/check-bundle-size.mjs`, gzip) · 브라우저 동작 L1(127.0.0.1:4339 실제 클릭)

## 1. 번들 전후 (첫 화면 / 진입 직후, 예산 100 / 125)

| 시나리오 | 기준 `c9ab667` | 결과 `bd75333` | 차이 | 여유 (결과) |
|---|---|---|---|---|
| 공통 JS | 89.13 | 89.13 | 0 | — |
| `/catalog` | 99.43 / 101.82 | 99.43 / 101.81 | 0 / −0.01 | 0.57 / 23.19 |
| `/references/:id` | 96.78 / 99.17 | 96.78 / 99.17 | 0 / 0 | 3.22 / 25.83 |
| **`/compare`** | 99.66 / 120.57 | **98.20** / 121.00 | **−1.46** / +0.43 | **1.80** / 4.00 |
| **`/compare (조정 있음)`** | 99.66 / 120.57 | **98.20** / 121.00 | **−1.46** / +0.43 | **1.80** / 4.00 |
| `/profile` | 99.54 / 124.67 | 99.54 / 124.67 | 0 / 0 | 0.46 / 0.33 |
| `/studio (자리표시)` | 89.57 / 91.96 | 89.57 / 91.95 | 0 / −0.01 | 10.43 / 33.05 |

- 청크 변화(gzip): `CompareBoardPage` 9.25 → 7.79(−1.46) · `boardEngine` 6.15 → 8.04(+1.89). **새 청크·공유 청크 분할 없음**(청크 목록 동일, 이름 비교 — FIX3 교훈 확인).
- `/compare` 진입 직후 +0.43: 옮긴 코드가 엔진 청크에서 따로 압축되는 손실 + 페이지의 두 번째 `import()` 호출 코드. 여유 4.00 유지(BUNDLE-01 추정 "거의 불변"보다 큼 — 추정 L3였음).
- 로그: `logs/baseline-build.txt`(기준) · `logs/c8-move1-build.txt` = `logs/final-build.txt`(결과).

## 2. 변경 파일
- `app/src/features/compare/boardEngine.ts` — `DraftPanel`·`DraftSummaryBar` import + `boardEngine` export 2개 + 주석 1줄(export 추가만).
- `app/src/pages/CompareBoardPage.tsx` — 두 컴포넌트 정적 import 제거(`import type { BoardEngine }`만). 훅이 `ready`가 된 뒤 같은 엔진 모듈을 `import()`로 받아 state에 둔다(이미 받은 모듈 → 추가 요청 없음). 받기 전에는 `LoadingState`, 실패하면 기존 오류 화면(“다시 시도”는 실패 표시를 지우고 `board.reload`). h1 첫 포커스는 패널까지 준비된 뒤(`ready`)로 옮겼다 — 로딩 화면에서 포커스를 소비하지 않게.
- `app/src/pages/CompareBoardEngineUi.test.tsx`(신규) — 소스 가드 2 + 엔진 로드 실패 화면 1.

### 편차 (한 줄)
- 이음새는 `useCompareBoard`가 `CustomStyleFields`처럼 `engine?.DraftPanel`을 넘기는 쪽이 더 깔끔하지만, 훅은 쓰기 범위 밖이라 페이지에서 엔진 모듈을 한 번 더 `import()`하는 방식으로 했다. 훅을 고칠 수 있게 되면 페이지의 `ui`/`uiFailed` 상태를 걷어낼 수 있다.

## 3. 로딩 구간 확인 (브리프 1단계 선결)
- `useCompareBoard`는 `import("./boardEngine")`과 보드 조회가 모두 끝난 뒤에만 `phase = "ready"`, 실패면 `"error"`. 페이지는 `loading`이면 `LoadingState`, 패널·요약 바는 ready + 열 ≥ 1 + `view`(엔진 필요)일 때만 그린다 → 엔진 로드 전 화면은 두 컴포넌트를 그리지 않는다. 중지 조건 해당 없음.
- 브라우저에서도 `/compare` 진입 때 "비교 보드를 불러오는 중…" → 패널(→ 390에서 요약 바) 순서를 MutationObserver로 관찰(`seen: loading, panel, bar`).

## 4. 검증 (fresh 실행, app/)
| 명령 | 결과 | 로그 |
|---|---|---|
| RED: `npx vitest run src/pages/CompareBoardEngineUi.test.tsx` (구현 전) | 2 failed(단언 실패: 페이지가 값 import · 엔진이 미탑재) / 1 passed | `logs/red.txt` |
| 같은 테스트 (구현 후) | 3 passed | — |
| `npm run typecheck` | exit 0 | `logs/typecheck.txt` |
| `npm run lint` | exit 0 | `logs/lint.txt` |
| `npx vitest run` (전체 1회) | 103 files / 1203 tests passed, exit 0 | `logs/vitest.txt` |
| `npm run build` | exit 0 | `logs/final-build.txt` |

- "엔진 로드 실패 시 오류 화면·패널 없음" 테스트는 구현 전에도 통과하는 **특성 테스트**다(동작 불변 확인용). 기존 보드 테스트는 수정·약화·삭제 없음.

### 브라우저 (vite preview 127.0.0.1:4339, ego-browser, 캡처 `shots/`)
- 1280: 카탈로그에서 3개 담기 → `/compare` 로딩 → 보드(h1 포커스) → Hero A·팔레트 B 선택(저장됨) → C 빼기("C를 뺐습니다", 마지막 열이라 포커스는 앞 열(B) 빼기 버튼) → 프로필 확정(v1) → `/profile/profile-1`. `1280-board/picked/removed/confirmed.png`
- 390: `/compare` 로딩 → 보드 + 요약 바(h1 포커스) → 레퍼런스 추가 → 로컬 베이커리 담기 → 3열 → C 전부 선택 → 요약 바 "초안 보기"(포커스 h2 "프로필 초안") → 요약 바 "새 버전으로 확정 (v2)" → `/profile/profile-1`. `390-board/draft/confirmed.png`
- 서버: 내가 띄운 preview PID만 종료, `lsof -iTCP:4339` 비어 있음 확인.

## 5. 미검증 · 차단
- **Codex 리뷰: BLOCKED** — `codex-companion review --scope branch --base c9ab667` 실행 결과 "usage limit … try again at 3:26 PM"(`logs/codex-r1.txt`). 대체로 독립 컨텍스트 code-reviewer 에이전트 점검을 돌렸다(아래 6절). 한도 복구 뒤 같은 명령으로 재실행 필요.
- 2순위 routes 원인 분해: 목표 달성으로 **하지 않음**(브리프 규칙).
- 스크린리더 실기기 낭독은 확인하지 않았다(포커스 이동·role은 DOM으로 확인).

## 6. 리뷰
- (code-reviewer 결과를 여기에 기록)
