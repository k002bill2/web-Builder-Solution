# EDITOR-A2-DATA REPORT

- 브리프: `docs/06-handoff/EDITOR-A2-DATA_BRIEF.md` (RESUME-2 = 8절) · 기준 main `2c30862` · 브랜치 `k002bill2/editor-a2-data` (로컬 커밋만, push·병합 없음)
- 결론: **C0~C6 완료.** 전체 vitest 1273 중 1272 통과 · 1 실패(단독 재실행 통과 — 아래 "전체 vitest"). /profile 진입 직후 여유 **0.30**(멈춤선 "< 0.3" 경계). 4337 흐름·Codex는 **이관**(병합 뒤 QA·Jarvis 몫).

## 1. 커밋 · 파일
| 단계 | SHA | 파일 |
|---|---|---|
| C0 base-build | `3422cf5` | `logs/base-build.txt` · PROGRESS |
| C1 가드·CSS | `984aa04` | `engine/engineImportGuard.test.ts`(허용 목록) · `app/src/index.css`(`@source not "./engine"`) · `logs/c1-css.txt` |
| C2 엔진 `motion?` | `3be907f` | `engine/doc/createDocFromCandidate.ts` · `createDocFromCandidate.test.ts` (예외 2파일) |
| C3 표·어댑터 | `056e0dd` | 새 `data/engineVariantMap.ts`(+test) · 새 `data/startDocWrite.ts`(+test) |
| C4 저장소 (WIP) | `87a1e78` | `data/projectRepository.ts` · `data/memoryProjectRepository.ts` · 새 `memoryProjectRepository.test.ts` |
| C4 누수 수정 | `19511bd` | 판정·상태 본문 → 조작 뒤 청크 `data/memoryDocBook.ts` · 상수 → `data/generatorVersion.ts` |
| C5 편집 시작 | `857234a` | `features/profile/CandidatesSection.tsx` · `generationText.ts` · `projectRepository.ts`(`StudioEntryState`) · `memoryDocBook.ts`(DOC_EXISTS 알림) · `pages/ProfileCandidates.test.tsx` |
| C6 첫 확정 알림 | `f50aaba` | `features/compare/useCompareBoard.ts` · `pages/CompareBoardTarget.test.tsx` (이 2파일만) |

## 2. AC별 판정
| AC | 판정 | 근거 |
|---|---|---|
| E-AC-11 `saveDoc` 멱등·판정 순서 | PASS | `memoryProjectRepository.test.ts` "saveDoc (8.3 · E-AC-11)" |
| E-AC-40 `startDoc` create 경쟁 | PASS (데이터 계층) | 같은 파일 E-AC-40 케이스. 화면 이동 + "이미 편집 중인 문서를 엽니다" = C5 `ProfileCandidates.test.tsx`(DOC_EXISTS → 이동 state) |
| E-AC-41 재시도·판정 순서·commit 실패 | PASS | E-AC-41 케이스 2개 |
| E-AC-42 `restart` 경합 | PASS | E-AC-42 케이스 |
| 8.2.1 표·어댑터·가드 | PASS | `engineVariantMap.test.ts`(bound 행 = `SECTION_LIBRARY` 키 · 목적지 ⊂ 레지스트리 · 표 리터럴 파일 1개) · `startDocWrite.test.ts` · 픽스처 6×3 성공 · (b) UNKNOWN_VARIANT 알림·쓰기 0·재시도 0 |
| J-S11 확장(r4.3 첫 확정 알림) | PASS | `CompareBoardTarget.test.tsx` 새 케이스: 첫 확정 → `/profile/profile-1` state `projectCreated: true` → "새 프로젝트 '모던 카페 브랜드 프로젝트'를 만들었습니다" |
| 4337 실제 흐름 | 이관 | RESUME-2 범위 밖(병합 뒤 QA) |

## 3. RED / GREEN 로그 (`dev/active/editor-a2-data/logs/`)
| 단계 | RED | GREEN |
|---|---|---|
| C1 | `c1-red.txt` 1 failed | `c1-green.txt` 3/3 |
| C2 | `c2-red.txt` 1 failed | `c2-green.txt` 255/255 |
| C3 | `c3-red.txt` (모듈 없음 → no tests) | `c3-green.txt` 12/12 |
| C4 | `c4-red.txt` 14 failed | `c4-green.txt` 431/431 · 수정 뒤 `c4-fix-green.txt` 141/141 |
| C5 | `c5-red.txt` 4 failed | `c5-green.txt` 149/149 |
| C6 | `c6-red.txt` 1 failed ("expected null to match object { projectCreated: true }") | `c6-green.txt` 7/7 |

lint: `c1/c3/c4/c4-fix/c5/c6-lint.txt` 모두 빈 파일(exit 0). C6 typecheck exit 0.

## 4. 번들 (gzip KB, `[bundle]` 판정 줄)
| 시점 | /profile 첫/진입 | /catalog 첫/진입 | /compare 첫/진입 | /projects 진입 | /studio 첫/진입 | 공통 |
|---|---|---|---|---|---|---|
| base `2c30862` | 99.60 / 124.44 | 99.64 / 102.02 | 98.74 / 121.36 | 106.39 | 90.73 / 103.73 | 89.34 |
| C4 WIP `87a1e78` | 99.62 / 124.56 | 99.66 / 102.05 | 98.76 / 121.49 | 107.90 | 90.74 / 105.24 | 89.36 |
| C4 fix `19511bd` | 99.60 / 124.46 | 99.64 / 102.02 | 98.74 / 121.38 | 106.99 | 90.73 / 104.33 | 89.34 |
| C5 `857234a` | 99.60 / 124.69 | 99.65 / 102.03 | 98.75 / 121.39 | 106.99 | 90.73 / 104.33 | 89.34 |
| C6 `f50aaba` | 99.60 / **124.70** | 99.64 / 102.02 | 98.74 / 121.39 | 106.98 | 90.73 / 104.32 | 89.34 |

- C6(`logs/c6-build.txt`): `/compare` 첫 −0.01(반올림)·진입 0 · `CompareBoardPage` 청크 8.13→8.14. `/profile` 진입 +0.01(반올림 경계) → **여유 0.30** — 멈춤선("0.3 미만") 미해당이나 경계. 다음 `/profile` 증가는 곧 멈춤선이다.
- 공통 base 대비 0. `/projects` +0.59(C4 계약 표면 — C4 fix 기록 그대로).

## 5. CSS 전후
`index-5C_vcWjl.css` 45.80 kB(gzip 9.07) — base·C1(sha256 `4e999d61…` 동일, 바뀐 규칙 0)·C2~C6 모두 같은 파일명. `@source not "./engine"`로 인한 규칙 변화 0.

## 6. /profile +0.25 (허용 +0.03~0.08 초과) 원인
base 124.44 → C6 124.70 중 C4 fix가 +0.02, **C5가 +0.23**, C6가 +0.01(반올림)이다. C4 fix → C5 사이 청크 이름 목록은 **변화 없음**(새 청크 0 · `index` 86.97 · `ProfilePage` 7.19 불변)이고 증가는 전부 **`profileEngine` 청크 한 곳(9.75 → 9.98 gzip, 27.85 → 28.52 raw)**이다. 즉 다른 모듈이 끌려온 누수가 아니라, `profileEngine`에 번들된 `CandidatesSection.tsx` 자체 코드가 커진 것이다: `onEdit` 비동기 처리(로더 호출 → `startDoc` → 오류 코드 분기 DOC_EXISTS/UNKNOWN_VARIANT/그 밖) · `starting`/`startAlert` state · `aria-busy` · 실패 알림 JSX(`role="alert"` + `Callout` + "다시 시도" `Button`) · `CANDIDATE_TEXT.startFailed` 문구. 오류 클래스·문장 생성(`memoryDocBook`)·어댑터는 조작 뒤 청크에 남아 있어 브리프의 "L3 +0.03~0.08" 추정은 연결 코드만 계산하고 **실패 알림 UI(분기+JSX)** 분량을 빠뜨린 것으로 본다. 줄이려면 실패 분기·알림 JSX를 조작 뒤 청크(예: `startDoc` 호출과 함께 로드되는 작은 모듈이 `{ state } | { alert, retry }`를 돌려주게)로 옮기는 방안이 있다(추정 −0.1~0.15, 미측정).

## 7. 전체 vitest (`logs/full-vitest.txt`, `npx vitest run` 1회)
- Test Files 110 passed / 1 failed (111) · Tests **1272 passed / 1 failed (1273)** · exit 1.
- 실패: `src/pages/CompareBoardPage.test.tsx > 저장·확정 (S-12~S-17) > AC-25·S-15·S-16: v1 확정 뒤 돌아와 선택을 바꾸면 '새 버전으로 확정 (v2)' …` — `Unable to find an element with the text: v1 확정됨`.
- 고치지 않음(브리프). 참고 확인: 같은 파일 단독 실행 `npx vitest run src/pages/CompareBoardPage.test.tsx` → **36/36 통과**. 해당 줄(`findByText("v1 확정됨")`, 383·402행)은 기본 1초 타임아웃이라 전체 실행 부하에서의 타이밍 실패로 추정(Medium). C6은 첫 확정 이동 state에 `projectCreated`를 더해 프로필 화면이 알림을 하나 더 그리므로 첫 확정 뒤 렌더가 약간 늘었을 수 있다 — C6 영향 여부는 미확정.

## 8. 이관 · 남은 위험
- **이관**: 4337 agent-browser 흐름 1회(보드 첫 확정 → 알림 → 3안 → 편집 시작 → `/studio/:projectId` 문서 있음 분기 · 캡처 1280) · Codex `review --scope branch --base 2c30862` — 병합 뒤 QA·Jarvis.
- `/profile` 진입 직후 여유 0.30 — 다음 기능은 `/profile` 청크 증가 0이어야 한다(6절 방안 참고).
- 위 전체 vitest 타이밍 실패(CompareBoardPage AC-25) — 재현 시 해당 `findByText`에 SLOW 타임아웃 부여 검토.
- `/projects` 진입 +0.59(C4 계약 표면) — 멈춤선 아님, 기록만.

## 9. C6 되돌림 (Jarvis, 2026-09-27 17:1x · 영환님 ★A)
- `f50aaba`(C6)를 `b9e9597`로 revert. 근거: C6 포함 전체 vitest 3회 중 2회 실패(`CompareBoardPage.test.tsx` "v1 확정 후 돌아오기" 계열 1~2건 교대) · C6 제외(C5 `857234a`) 3/3 · main 3/3 · revert 뒤 3/3(1,272/1,272).
- 원인(코드 확인): `ProfilePage.tsx` 67~71행이 `projectCreated` state를 받으면 state를 비우려 **비동기 `navigate(현재 경로, {replace})`** 를 한다. C6로 모든 첫 확정이 이 경로를 타면서, 사용자가 곧바로 보드로 돌아가면 늦은 replace가 화면을 프로필로 되돌리는 경쟁이 생긴다(실사용 결함 가능, 추정).
- C6(SPEC r4.3 J-S11 확장)는 별건으로 재시도: state 비우기를 경쟁 없이(예: `history.replaceState`) 바꾸고, 반복 실행 테스트(`--repeat` 또는 3회 전체 실행)를 수용 기준에 넣는다. C6 로그(`logs/c6-*.txt`)는 `f50aaba`에 남아 있다.
