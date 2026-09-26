# REPORT — FIX-2A04B2-P1

- 브리프: `docs/06-handoff/FIX-2A04B2-P1_DEVELOPER_BRIEF.md` · base `f7e5e56` · 브랜치 `k002bill2/fix-2a04b2-p1` (로컬 커밋만, push·병합 없음)
- 결과: D-2A4B2-01(P1)·02·03(P3)·관찰 ②·HEADROOM P3 모두 반영. 검증 4종 통과, 전체 테스트 3회 연속 928/928, Codex 1회 "결함 없음".

## 1. 커밋
| 해시 | 내용 |
|---|---|
| `722f65b` | docs: PROGRESS·REPORT 뼈대 · 번들 전 출력(`bundle-before.txt`) |
| `56767bd` | fix(profile): 코드 + 테스트 (13 파일) |
| `788eab3` | docs: tdd-log RED/GREEN · 번들 후 출력(`bundle-after.txt`) |
| `3b58909` | docs: REPORT · PROGRESS · Codex 출력 · 390 캡처 |
| (이 커밋) | docs: REPORT 보강 — 엔진 호출 0 · 금지 경로 diff 0 |

## 2. RED / GREEN (`tdd-log.txt`)
- AA 회귀 스냅숏(`contrastAaRegression.test.ts`)은 **코드를 바꾸기 전** `f7e5e56` 코드로 떴다(인라인 스냅숏 2개, 통과 상태로 시작) — 변경 뒤에도 그대로 통과.
- RED(구현 전): 23 실패 / 69. D-01은 실제 `Error: 대비 7:1을 만들 수 없습니다: #2C2C2C / #8B5E3C`(경로 A는 오류 경계라 h1 "디자인 프로필" 없음), D-02는 `toHaveFocus` 실패(BODY), D-03은 알림 최종 문장이 없는 버전 재알림.
- GREEN: 대상 5 파일 전부 통과 → 전체 928/928.

## 3. 테스트 이름 (추가·변경)
- `src/domain/contrast.test.ts`
  - "4.5는 어떤 배경에서도 도달한다 — 흑·백 중 큰 대비의 최솟값 ≈ 4.58 (중간 명도 회색 스윕)"
  - "7:1 불가 조합 (D-2A4B2-01) — throw 대신 값" › `#8B5E3C`·`#1F5FBF`·`#5A5A5A`·`#777777`·`#949494` 위 7:1: throw 0, reached=false, best = 흑·백 중 큰 대비(7 미만) · "#8B5E3C: 흰 5.58 · 검 3.76 — best는 흰색" · "경계 #595959·#959595 위 7:1은 가능 — 기존처럼 제안" · "7:1 가능 조합은 기존 제안 그대로 (ref-a primary → #775033)"
  - 기존 4.5 테스트 3종은 새 모양(`reached`/`fix`)으로만 바꿈(기대값 동일)
- `src/domain/profileContrast.test.ts` "강화 7:1 불가 (D-2A4B2-01)" › ref-a+어두운 카드+강화 ink unreachable(C-3, 후보 #FFFFFF 5.5)·primary #775033 그대로 / 밝은 카드 + 중간 명도 면(#777777) C-4 불가 / AA에서는 unreachable 0
- `src/features/profile/profileMessages.test.ts` "contrastView — 강화 7:1 불가" › 충돌 문장·detail·링크 "비교 보드에서 팔레트 바꾸기"
- `src/features/profile/contrastAaRegression.test.ts` "AA(4.5) 제안·문장 불변" › 레퍼런스 6×카드 톤 2 · 중간 명도 대표색·면 스윕 6×2
- `src/pages/ProfileAdjust.test.tsx`
  - "D-2A4B2-01 … (QA-2A04B2 경로 A·B)" › **경로 A**(모던 카페 A Hero 확정 v1 → 강화 저장 v2 → 카드 B(헤어살롱 어두운 카드) 재확정 v3 → v3 화면) · **경로 B**(A 팔레트+어두운 카드에서 "강화" 클릭). 둘 다 오류 경계 0 · C-3 "미달" · 충돌 문장 · 링크 "비교 보드에서 팔레트 바꾸기"(href /compare) · ink "보정값 쓰기" 0 · primary 보정값 쓰기는 있음
  - P-AC-16 "요청 실패 …"·"응답 실패(커밋 뒤) …"에 `조정 저장 (v3)` 버튼 포커스 단언 추가 (D-02)
  - "D-2A4B2-03 없는 ?v= 보는 중 조정 저장" › `?v=abc` → 목적 "판매" → 저장 → 알림 최종 문장 = "v2로 저장했습니다", Callout은 "…최신 v2를…"

## 4. 계약 변경
- 전: `nearestCompliantColor(hex, against, target = 4.5): ContrastFix` — 명도 전 구간에서 못 찾으면 throw.
- 후: `nearestCompliantColor(hex, against, target = 4.5): ContrastSearch`
  ```ts
  type ContrastSearch =
    | { readonly reached: true; readonly fix: ContrastFix }
    | { readonly reached: false; readonly best: ContrastFix }; // best = 탐색 중 대비 최대 후보
  ```
- 근거: 판별 유니언이라 `tsc`가 모든 호출부에서 불가 분기 처리를 강제한다(변경 직후 tsc 오류 = 호출부 목록). `best`는 충돌 계산이 기존 `broken` 로직을 그대로 쓰게 한다(기준 검사가 여전히 미달 → `conflict` 자동 생성 → 보정값 쓰기 없음).
- 호출부(tsc·grep 전부). `grep -rn nearestCompliantColor app/src/engine` → 0건(exit 1):
  1. `app/src/domain/boardWarnings.ts` `correctedPrimary` — 반환을 `WarningFix[]`로, 불가면 `[]`(보정값 쓰기 없음). 보드 목표는 늘 4.5라 실제로는 도달함(흑·백 중 큰 대비 최소 ≈ 4.58, 회색 스윕 테스트).
  2. `app/src/domain/profileContrast.ts` `proposeCorrections` — 불가면 `to/after = best`, `CorrectionProposal.unreachable: true` 추가(`conflict`가 늘 함께 옴).
  3. `app/src/features/profile/profileMessages.ts` `conflictOf(p, level)` — `unreachable`을 C-3 분기보다 먼저 본다(C-3 분기로 가면 "어두운 카드(2.5:1)과 어두운 카드(…)" 중복 + 링크 "카드 바꾸기"가 됨).
- 4.5 결과 불변: AA 인라인 스냅숏(변경 전 코드 기준) + 기존 보드·프로필 테스트 전부 통과.
- 다른 throw 경로 점검(L1 코드):
  - `relativeLuminance`·`hexToHsl`의 잘못된 hex throw는 화면에 오지 않음 — 사용자 대표색은 `boardInput.ts` zod(`#RRGGBB`), 보정값은 `adjustmentSchema.ts` zod로 쓰기 경계에서 막히고, 픽스처 팔레트는 전부 `#RRGGBB`, 후보는 `hslToHex`가 늘 `#RRGGBB`를 만든다.
  - `hexOf` "역할이 없습니다" throw는 팔레트가 늘 5역할(`derivePalette`·`PALETTE_ROLES`)이라 도달하지 않음. 변경 없음.

## 5. 유추 문장 (SPEC에 문장 없음 — P-S15 ink 충돌 문형을 따름)
- 충돌 문장: "`{역할 주어}` `{기준 배경}`(`{현재 대비}`)에서 어떤 명도로도 기준 `{목표}`을 맞출 수 없습니다. 대체안: 비교 보드에서 다른 팔레트를 고르세요"
  - 경로 A 실제: "본문 글자(ink)가 어두운 카드(2.5:1)에서 어떤 명도로도 기준 7.0:1을 맞출 수 없습니다. 대체안: 비교 보드에서 다른 팔레트를 고르세요"
- detail(캡션): "대비가 가장 높은 후보 `{best}`도 `{대비}`" — 예 "대비가 가장 높은 후보 #FFFFFF도 5.5:1"
- 링크: "비교 보드에서 팔레트 바꾸기"(브리프 지정, 기존 일반 충돌 링크와 같은 문구) → `/compare`
- 조사 "을": 목표가 4.5:1·7.0:1(끝 "일")뿐이라 고정.

## 6. D-02 · D-03 판단
- D-02: "다시 시도" onClick에서 `focusAfter = "save"` 후 저장 — 저장 시작과 함께 알림·버튼이 사라지는 순간 포커스가 "조정 저장" 버튼(같은 요소, `aria-disabled`라 포커스 유지)으로 간다. 성공 뒤 "조정 저장 (v3)", 실패면 새 알림이 뜨고 포커스는 저장 버튼. SPEC 5.2 "조정 저장 성공 → 이동 없음"과 첫 저장 경로에 맞춤.
- D-03: **요청 값당 한 번** 방식. URL을 새 버전으로 맞추는 방식은 `?v=` 변경 → h1 포커스(5.2 버전 전환 규칙)라 "조정 저장 성공 → 이동 없음"을 어기고 D-02와도 충돌해 택하지 않음. 구현: effect deps `[requested, isMissing]`, 문장의 최신 번호는 ref에서 읽음. StrictMode 재실행·뒤로/앞으로 재알림(D-2A4-04 테스트)·같은 문장 재알림(F-7) 기존 테스트 전부 통과. 보이는 Callout은 최신 번호를 따름.

## 7. 번들 전후 (예산 상수 100KB·125KB 불변, `bundle-before.txt`·`bundle-after.txt`)
| 시나리오 | 첫 화면 전 → 후 | 진입 직후 전 → 후 | 조작 뒤 줄 |
|---|---|---|---|
| /catalog | 99.36 → 99.36 | 101.75 → 101.74 | — |
| /references/:id | 96.71 → 96.71 | 99.10 → 99.09 | — |
| /compare | 99.60 → 99.59 | 118.98 → 118.99 | carryOverPanel 2.86→2.89 · memoryBoardConfirm 1.50 · profileAdjustments 1.72→1.76 · memoryProfileAdjust 8.02 · boardInput 6.62→6.61 |
| /compare (조정 있음) | 99.60 → 99.59 | 118.98 → 118.99 | 위와 같음 |
| **/profile** | 99.36 → **99.39** (+0.03) | 118.84 → **118.97** (+0.13, 목표 0.3 이내) | memoryProfileAdjust 7.64 → 7.64 · **boardInput 6.62 줄 삭제**(HEADROOM P3) |
| /studio | 89.50 → 89.50 | 91.89 → 91.88 | — |
- 공통 JS 89.06 → 89.06. 판정 결과 전후 모두 통과(build exit 0).

## 8. 검증
- `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm test -- --run` exit 0 (80 파일 / 928 테스트) · `npm run build` exit 0 (번들 판정 포함)
- 금지 경로: `git diff --stat f7e5e56..HEAD -- design docs/design docs/qa app/src/engine app/package.json app/package-lock.json` → 출력 없음(새 의존성·엔진·디자인·QA 문서 변경 0)
- 전체 테스트 3회 연속: run1 928/928 (20.7s) · run2 928/928 (16.3s) · run3 928/928 (14.5s)

## 9. 스모크 · 캡처
- 서버: `npx vite preview --host 127.0.0.1 --port 4337 --strictPort`(빌드 `56767bd`), ego-browser(Chromium) TaskSpace 29.
- 경로 A(새 문서, 계측 없음): /catalog에서 모던 카페 브랜드·프리미엄 헤어살롱 비교 추가 → 비교 보드 → Hero A → "프로필 확정 (v1)" → 대비 "강화" → "조정 저장 (v2)" → "비교 보드에서 선택 바꾸기" → 카드 스타일 B → "새 버전으로 확정 (v3)".
  - 결과: **재현 불가**. `/profile/profile-1` h1 "디자인 프로필", Tag "v3 · 현재", 오류 경계 문구 없음, 목표 7.0:1, C-3 2.5:1 미달, ink 제안 = 충돌 문장 + "대비가 가장 높은 후보 #FFFFFF도 5.5:1" + 링크 "비교 보드에서 팔레트 바꾸기"(/compare), 버튼은 "보정값 쓰기 (대표색 primary)"·"(보조 글자 muted)"뿐.
- 390 캡처: `screens/390-unreachable-conflict.png` (CDP `Emulation.setDeviceMetricsOverride` 390×844, 가로 넘침 없음)
- 종료: `kill` 뒤 `lsof -nP -iTCP:4337 -sTCP:LISTEN` → 출력 없음(exit 1). TaskSpace `finish({keep: []})`.

## 10. Codex
- 1회: `codex-companion.mjs review --wait --scope branch --base f7e5e56` → "검토한 변경에서 수정이 필요한 결함은 발견하지 못했습니다." (Codex 샌드박스는 읽기 전용이라 자체 테스트 실행은 Vite 임시 파일 쓰기로 시작 못 함 — 테스트는 8절에서 로컬 실행). 원문 `codex-review.txt`. 반영할 지적 없음.

## 11. 남은 위험
- 불가 충돌의 swatch 화살표(장식, aria-hidden)가 기준 미달 후보(흰색)를 가리킨다 — 기존 충돌 표시와 같은 구조라 유지. 문장·캡션이 "그 후보도 미달"을 밝힌다.
- ref-d + 어두운 카드(AA)의 primary 충돌 문장이 "…밝은 카드를 고르면 ink를 어둡게 보정할 수 있습니다"로 나오는 기존 문구 부정합(스냅숏에 그대로 고정) — 이번 범위 밖, 설계 질문 2.
- D-03: 같은 없는 `?v=`에서 최신이 바뀌면 알림 영역의 문장은 첫 번호로 남을 수 있다(저장 알림이 덮으면 사라짐, STALE 경로에서만) — 보이는 Callout은 최신.

- 병행 `l4-engine-b`가 옛 계약(`ContrastFix` 직접 반환)으로 `nearestCompliantColor`를 새로 부르면 병합 때 tsc가 깨진다 — 병합 쪽에서 `reached`로 좁혀 `.fix`/`.best`를 쓴다.

## 12. 설계 질문
1. 7:1 불가 충돌의 대체안을 "다른 팔레트"만으로 둘지 — 어두운 카드 기준(C-3)이면 "밝은 카드 고르기"도 유효한 대체안이다(SPEC ref-b 문형). 지금은 브리프대로 팔레트만.
2. `conflictOf`의 C-3 분기가 primary 역할(ref-d 어두운 카드 AA)에도 "ink를 어둡게 보정" 문장을 내는 기존 문구를 역할별로 고칠지(2a-04b2부터 있던 동작, 이번엔 불변 유지).
