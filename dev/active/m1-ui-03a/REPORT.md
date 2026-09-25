# M1-UI-03a REPORT — 비교 보드 도메인·데이터 계층 + 번들 예산 기준 변경

브랜치 `k002bill2/m1-ui-03a` (main에서 분기, 로컬 커밋만 · push·원격 없음) · 2026-09-25

## 결론
- 브리프 항목 1~10을 모두 완료했습니다. UI 컴포넌트와 `/compare` 페이지는 만들지 않았습니다(03b 범위).
- 검증 4종이 통과했습니다: typecheck · lint · **test 234/234**(기존 115 + 신규 119) · build.
- 번들: 라우트별 첫 화면 합계가 모두 100KB 이하입니다. `/catalog`는 96.67KB입니다.
- Codex: R1 P2 3건과 R2 P2 2건을 모두 반영했습니다. R3 결과는 아래 "Codex 결과"에 적습니다.
- 기존 카탈로그·상세 동작과 테스트는 그대로 통과합니다. 여기에는 6개 제한, `COMPARE_LIMIT_NOTICE`, 칩 제거 후 포커스 이동(D07)이 포함됩니다. 브라우저에서도 확인했습니다.

## 항목 1~10 완료 여부
| # | 항목 | 상태 | 주요 파일 |
|---|---|---|---|
| 1 | 타입 (SPEC 8.1 + `selection_mode`) | 완료 | `domain/compareBoard.ts`, `domain/fonts.ts` |
| 2 | 행 정의·셀 값·AC-26 표시 데이터 | 완료 | `domain/comparisonCells.ts`, `domain/sectionLibrary.ts`, `fixtures/referenceComparisons.ts` |
| 3 | 선택 규칙 P-1~P-7 | 완료 | `domain/boardColumns.ts`, `domain/boardPicks.ts` |
| 4 | `buildProfileDraft` (기준 레퍼런스·기본값·section_plan·모션 상한·R-15·seed) | 완료 | `domain/profileDraft.ts` |
| 5 | `contrast.ts` + `derivePalette` | 완료 | `domain/contrast.ts`, `domain/palette.ts` |
| 6 | R-12 Footer 경고 데이터 (+R-07·R-08·R-15) | 완료 | `domain/boardWarnings.ts` |
| 7 | 대표색 zod·폰트 허용 목록 | 완료 | `domain/boardInput.ts` (zod/mini), `domain/fonts.ts` |
| 8 | 저장소 메모리 구현 + 저장 직렬화 + P-8 | 완료 | `data/compareBoardRepository.ts`, `data/memoryCompareBoardRepository.ts`, `data/deferredCompareBoardRepository.ts`, `features/compare/picksSaver.ts`, `domain/confirmGate.ts` |
| 9 | 트레이 통합 (트레이 = 보드 열) | 완료 | `features/compare/CompareTrayContext.tsx`, `app/AppProviders.tsx`, `main.tsx` |
| 10 | ADR-004 번들 검사 | 완료 | `scripts/check-bundle-size.mjs` |

## AC별 테스트 매핑 (테스트 이름에 AC ID 포함)
| AC | 테스트 |
|---|---|
| AC-07 | `boardPicks.test.ts` "AC-07(데이터)…" · `profileDraft.test.ts` "AC-07: … section_plan이 A의 sectionPlan과 같고 template" |
| AC-08(데이터) | `boardColumns.test.ts` "AC-08(데이터)…" · `trayBoard.test.tsx` "AC-08(데이터): 트레이에서 빼면…" |
| AC-09 | `profileDraft.test.ts` "AC-09: Hero=A만…" |
| AC-10 | `profileDraft.test.ts` "AC-10" 2건: 깊은 비교 동일, 키 순서 무관, 선택이 다르면 seed도 다름 |
| AC-11 | `profileDraft.test.ts` (L2 + `motionCapped`) · `boardWarnings.test.ts` (문구) |
| AC-12(계산) | `contrast.test.ts` 보정값 · `boardWarnings.test.ts` "AC-12(계산): #C9A96E → 2.2:1 + 보정값 쓰기" |
| AC-13(데이터) | `boardWarnings.test.ts` "AC-13: … C의 Footer로 바꾸기, 누르면 C로 바뀐다" |
| AC-14 | `boardInput.test.ts` "AC-14" 2건 · `memoryCompareBoardRepository.test.ts` "AC-14(데이터): … SCHEMA_INVALID로 저장하지 않는다" |
| AC-15(데이터) | `boardPicks.test.ts` "AC-15" 2건 · `memoryCompareBoardRepository.test.ts` "AC-15: 회수된 B…" |
| AC-23 | `memoryCompareBoardRepository.test.ts` "AC-23: … 역순으로 도착해도…" · `picksSaver.test.ts` "AC-23" 2건 |
| AC-24 | `memoryCompareBoardRepository.test.ts` "AC-24: 확정된 color_tokens는 역할 팔레트 전체이고…" |
| AC-25 | `memoryCompareBoardRepository.test.ts` "AC-25: … v2가 생기고 v1은 바뀌지 않는다" |
| AC-26 | `comparisonCells.test.ts` "AC-26" 2건(사용 불가·대응표) · `memoryCompareBoardRepository.test.ts` "AC-26: … library_version은 getComparison의 libraryVersion" |
| 대비 실측 | `contrast.test.ts` F `#D47800` 3.24 · D `#00A884` 3.03 · A `#8B5E3C` 5.58 (`toBeCloseTo(…, 2)`) |

## RED/GREEN 요약
- 모든 새 모듈은 테스트를 먼저 썼고, 모듈이 없어 실패하는 RED를 확인한 뒤 구현했습니다. 항목별 출력은 `PROGRESS.md`에 있습니다.
- 트레이 통합: `trayBoard.test.tsx` 4개가 RED(보드 열이 트레이에 안 보임·저장소에 안 담김) → GREEN입니다.
- **AC-23 RED ①**: 저장소의 revision 검사를 지웠습니다. → `× AC-23: 같은 revision으로 보낸 두 저장이 역순으로 도착해도…`, `expected undefined to be 'STALE_BOARD'`로 실패 → 복원 후 통과했습니다.
- **AC-23 RED ②**: 클라이언트 직렬화를 지웠습니다(`running ??=` → `running =`). → `expected [ 'save#1', 'save#2', 'save#3' ] to have a length of 2`로 실패 → 복원 후 통과했습니다.
- **번들 RED**:
  - 예산을 95로 낮추면 `/catalog: 95.34KB > 95KB`로 exit 1이 났고, 100으로 원복했습니다.
  - 페이지 경로를 없는 파일로 바꾸면 "manifest에 … 없습니다"로 exit 1이 났고, 원복했습니다.
- Codex 지적 5건은 모두 회귀 테스트 RED를 확인한 뒤 수정해 GREEN으로 만들었습니다.

## 검증 4종 · 번들
```
cd app && npm run typecheck && npm run lint && npm test -- --run && npm run build
Test Files 29 passed (29) · Tests 234 passed (234)
[bundle] 공통 JS (gzip, 참고): 88.46KB
[bundle] /catalog 첫 화면 합계: 96.67KB / 예산 100KB (진입 직후 자동 로드 포함 참고: 99.05KB)
[bundle] /references/:id 첫 화면 합계: 94.82KB / 예산 100KB (진입 직후 자동 로드 포함 참고: 97.20KB)
[bundle] /compare · /profile · /studio (자리표시) 첫 화면 합계: 88.89KB / 예산 100KB (진입 직후 자동 로드 포함 참고: 91.28KB)
```
- 기준선과 비교: 공통 87.26KB → 88.46KB (+1.2KB, 트레이의 보드 상태·열 함수). `/catalog`는 95.34KB → 96.67KB입니다.
- zod·초안 계산·비교 픽스처는 `memoryCompareBoardRepository` 청크에만 있습니다. 빌드 산출물을 grep해 확인했습니다. 첫 화면에서는 이 청크를 불러오지 않습니다(Codex R1).
- 브라우저 확인(ego-browser, `vite preview`):
  - 카탈로그에서 2개를 추가하고 1개를 제거하면 "1 / 6"이 됩니다.
  - 제거 뒤 포커스가 다음 칩으로 이동합니다.

## Codex 결과 (`review --scope branch --base main`)
- **R1**: P2 3건을 모두 반영했습니다(3b58b15).
  1. 저장 실패 시 저장 중에 바꾼 최신 선택이 버려졌습니다.
  2. 트레이의 진입 조회가 보드 저장소 청크(10.73KB)를 첫 화면에 불러왔습니다. 카탈로그에서 실제로 로드되는 JS는 110.78KB였습니다.
  3. 다른 곳에서 뺀 열을 저장하면 STALE_BOARD 대신 SCHEMA_INVALID가 나서 최신 보드와 다시 맞출 수 없었습니다.
- **R2**: P2 2건을 모두 반영했습니다(83b38de).
  1. 기본값으로 들어간 섹션 변형도 확정할 때 현재 라이브러리 버전으로 다시 검사합니다.
  2. 충돌 뒤 최신 보드 재조회까지 실패하면 저장 상태가 `saving`에 멈췄습니다. 이제 `error`로 바뀌고 다시 시도할 수 있습니다.
- **R3**: 아래 "R3 결과" 절에 적습니다.

## SPEC과 다르게 한 부분 (사유)
- `ComparisonRowDef.shortLabel` 추가: 알림 문장 "B를 빼서 Hero·카드 선택 해제"에 짧은 이름이 필요합니다.
- `ReferenceComparison.spacing` 추가: SPEC 8.3의 spacing_tokens 출처(기준 레퍼런스 상세 spacing)를 비교 데이터로 넘기려면 필요합니다.
- `buildProfileDraft(board, results, libraryVersion)`: 브리프의 시그니처를 따랐습니다. SPEC의 `rows` 인자는 `COMPARISON_ROWS` 상수로 대체했습니다.
- `getBoard()`는 `{ board, released }`를 돌려줍니다. 회수·삭제된 열의 선택을 자동 해제했다는 안내를 한 번만 보여주려면 해제 정보가 필요합니다(S-08).
- `getProfileVersions` 추가: AC-25 검증과 1a-04에서 씁니다.
- 열 빼기 알림은 AC-08 문구("…선택 해제")를 따랐습니다. SPEC P-7/1.3에는 "해제됐습니다"로 적혀 있습니다.
- C-3 색 쌍은 카드 표면 = 대표색, 카드 글자 = 잉크로 해석했습니다. 목업 B 다크 카드(검정 표면 + 골드 글자)와 같습니다.
- C-3 대체안: 밝은 카드 열이 없으면 SPEC은 "C-1 보정"을 제안합니다. 그러나 흰 글자 기준으로 대표색을 어둡게 하면 어두운 잉크와의 대비가 더 나빠질 수 있습니다. 그래서 **잉크 대비 4.5:1 보정**으로 계산했습니다(ADR-003 기능 우선).
- `section_plan`: SPEC 8.3의 "한 레퍼런스면 그대로" 규칙과 R-01(footer 추가)이 겹치면 R-01을 우선했습니다. 차이는 기준 레퍼런스에 footer가 없을 때만 생깁니다.
- R-12: 확정할 때 사업자정보가 없는 Footer를 같은 모양의 확장 변형(`businessInfoVariant`)으로 바꿔 저장합니다. SPEC 3.3 안내 문구가 약속한 동작을 구현했습니다.
- `x.x:1` 표시는 버림으로 했습니다. 4.47이 "4.5:1"로 보이면 기준을 통과한 것처럼 읽히기 때문입니다.
- A의 섹션 수는 **9개**입니다(목업은 8개). SPEC 8.5에 따라 `sectionPlan`에 footer를 넣었습니다. 상세 픽스처는 목업 1a-02와 같게 8개로 두었습니다.
- `DesignReference.key`는 유지했습니다. 기존 테스트가 쓰고 있고, 보드 표기에는 쓰지 않습니다.
- 번들 검사에는 "진입 직후 자동 로드 포함" 합계를 **참고 출력**으로 추가했습니다. 예산 판정은 ADR-004 정의인 정적 합계 그대로입니다.

## 03b에 넘길 것
- 화면은 `useCompareTray().board`와 `getComparison` → `togglePick`·`pickAllFrom` → `picksSaver.save`로 연결합니다. 초안·경고는 `buildProfileDraft` → `evaluateBoardWarnings`, 확정 가능 여부는 `confirmAvailability`로 구합니다.
- 알림 문구 데이터는 이미 있습니다: `pickAnnouncement`, `removeColumn().released.notice`, `pickAllFrom().notice`, `getBoard().released[].notice`.
- 카탈로그에서 열을 뺐을 때의 안내(SPEC 1.3 "돌아왔을 때 한 번")는 아직 컨텍스트에 보관하지 않습니다. 03b에서 `removeReference` 응답의 `released`를 보관할지 결정해야 합니다.
- 트레이 컨텍스트의 저장소 호출이 실패하면 서버 보드로 다시 맞춥니다. 사용자에게 오류를 알리는 방식(S-12)은 03b에서 정합니다.
- 보드 저장소 청크 10.73KB는 첫 변경(트레이 추가) 때 로드됩니다. `/compare` 라우트 청크에 들어갈 초안·대비 계산을 더하면 `/compare`의 100KB 예산을 확인해야 합니다.
- `compareTray.ts#addToTray`·`removeFromTray`는 이제 규칙 테스트에서만 씁니다(컨텍스트는 `addColumn`·`removeColumn`을 씀). 정리할지 03b에서 판단합니다.
- 섹션 라이브러리 v1.4와 D·E·F 비교 속성은 임시값입니다. 실제 정본은 섹션 패키지(TRD 4.4)입니다.

## 질문
1. 보드 폰트 행에서 Noto Serif KR(B·E)을 고를 수 있습니다. ADR-005 Q4는 사용자 입력 허용 목록만 제한합니다. 레퍼런스 폰트 행도 라이선스 확인 전에는 막아야 하나요? (현재는 선택 가능)
2. R-12: 보드에 사업자정보 Footer 열이 있는데 사용자가 대체안을 누르지 않고 확정하면, 지금은 확장 변형으로 자동 교체합니다. 이렇게 두어도 되나요?
3. ADR-004 예산에 진입 직후 자동 로드되는 데이터 청크(레퍼런스 픽스처 2.4KB)를 포함할까요? 포함하면 `/catalog`가 99.05KB로 여유가 적습니다.

## 커밋
```
83b38de fix: Codex R2 — 확정 시 기본 섹션 라이브러리 재검사, 충돌 후 재조회 실패 시 저장 상태 고착 방지
3b58b15 fix: Codex R1 — 저장 실패 시 최신 선택 보존, 열 삭제 경합은 STALE_BOARD, 보드 저장소를 첫 화면에서 불러오지 않음
b1a60f3 feat: 비교 트레이를 비교 보드 열 목록으로 통합, 보드 저장소 지연 로드 (M1-UI-03a 9)
6a954ad docs: M1-UI-03a PROGRESS — 항목 8 AC-23 RED 기록
76ecad2 feat: 비교 보드 저장소 메모리 구현·저장 직렬화·확정 버전 관리·P-8 확정 조건 (M1-UI-03a 8)
1c05283 feat: 보드 경고 R-07·R-08(C-1~C-3)·R-12·R-15, 대표색·폰트 zod 검증 (M1-UI-03a 6·7)
55226e5 feat: buildProfileDraft — 기준 레퍼런스·기본값·section_plan·모션 상한·결정적 seed (M1-UI-03a 4)
264a1da feat: WCAG 대비 계산·C-1~C-3·명도 보정·derivePalette (M1-UI-03a 5)
317d955 feat: 비교 보드 선택 규칙 P-1~P-7·회수 열 선택 해제 (M1-UI-03a 3)
7f27f51 feat: 비교 보드 타입·12행 정의·셀 값 계산·섹션 라이브러리 (M1-UI-03a 1·2)
bc85bbc build: 번들 검사를 라우트별 첫 화면 합계 100KB 예산으로 변경 (ADR-004)
66a0e6a docs: M1-UI-03a PROGRESS 시작
```
(이 REPORT 커밋은 위 목록 다음입니다.)

## R3 결과
(R3 결과를 기다리는 중)
