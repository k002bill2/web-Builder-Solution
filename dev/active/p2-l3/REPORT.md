# P2-L3 REPORT — 프로젝트 파일 가져오기 화면·쓰기 (초안 — 번들 관문 정지)

- 브랜치 `k002bill2/p2-l3` · base `483c0db` · 커밋: 198501f(P0) → d67949d(writeImport·대화상자·Slot·저장소 영역 배선·IM-9) → ebf99b3(타입 오류 2건 수정)
- **상태: 배선 첫 커밋 직후 build 관문 실패 → 브리프 규칙대로 멈춤.** 원인 모듈 아래 1절.

## 1. 번들 관문 실패 (배선 직후 실측 — KB 추정 아님)
`npm run build` exit 1 — `[bundle] 예산 검사 실패 — /profile: 첫 화면 100.22KB > 100KB` (+ `/profile (3안 있음)` 같음).

같은 트리에서 **배선 1줄만 뺀 빌드**(`BrowserStorageSection`의 `lazy(() => import("./ImportProjectFileDialogSlot"))`를 null 컴포넌트로 임시 교체, 커밋 안 함, 원복 확인)와 비교:

| 시나리오 | 배선 없음 | 배선 있음 | 차이 |
|---|---|---|---|
| `/profile` 첫 화면 | 99.87 | **100.22** (예산 100) | +0.35 |
| `/profile` 자동 로드 포함 | 119.96 | 120.31 | +0.35 |
| `/studio` 자동 로드 포함 | 129.11 | 129.13 (멈춤 선: M2c 129.62+0.03 = 129.65 — 경계) | +0.02 |
| `/studio` 복원 | 132.14 | 132.16 | +0.02 |
| `/projects` 자동 로드 포함 | 104.94 | 105.25 / 125 | +0.31 |
| `/compare` 자동 로드 포함 | 122.72 | 122.91 / 125 | +0.19 |
| `/catalog` 첫 화면 | 100.07 | 100.09 / 101 | +0.02 |

- 배선으로 **새로 생긴 공유 청크**: `profileFields-*` · `palette-*` · `industryCopy-*` · `limits-*` · `format-*` (+ Slot 청크·`index-*`) · 사라진 청크: `ladder-*`(재분할).
- **원인 모듈 = L1 `features/projectFile/profileShape.ts`** (Codex r1·r2 수정에서 추가)의 값 import:
  `SECTION_TYPE_LABELS`(`features/profile/profileFields`) · `PURPOSE_LABELS`(`fixtures/catalogFilters`) · `PALETTE_ROLES`(`domain/palette`) · `CONTRAST_TARGET`(`domain/profileContrast`) · `DENSITY_LABELS`(`features/profile/adjustmentText`).
  이 모듈들은 `/profile` 첫 화면 청크 안에 있었는데, 가져오기 lazy 청크도 값으로 쓰게 되자 Rollup이 공유 청크로 떼어 내 `/profile` 첫 화면에 청크 머리·import 바인딩이 더해졌다(+0.35).
  보조 원인: `checkImages.ts`의 `ingest/limits`·`ladder` 값 import(복원 closure) → `limits` 청크 분리 → `/studio`·복원 +0.02.
- L1 REPORT 2절이 "진입 closure 검증 함수 import가 공유 청크를 재분할하는가는 L2/L3 배선 때 실측"으로 남긴 항목이 이것이다.
- SPEC 6절 처방: "수치가 바뀌면 그 함수만 리터럴 복제 + parity 테스트". 단 `profileShape.ts`·`checkImages.ts`는 **L1 파일(이 레인 쓰기 목록 밖)** 이라 이 레인은 고치지 않았다 → Jarvis 결정 필요.

## 2. 지금까지 한 것 (커밋됨)
| 파일 | 내용 |
|---|---|
| `features/projectFile/writeImport.ts` (새) | `runImport` — `open("design-studio", 2)` + `upgradeImportDb`(없는 저장소만) · blocked = 거부 · `studio·docs·images·meta` readwrite 1개 · state·generation get만 await · 봉투·Map 모양 아님 = unreadable(IM-8, abort) · `rekeyImport` 재검사 실패 = corrupt(IM-4, abort) · `mergeImport` + `gen = generation+1` · put state·meta·doc(있으면)·images(`{variants,width,height,format,bytes}`) · put 동기 예외 = abort 후 거부 · 커밋 확인 뒤 done. `createImporter`/`importerFor`(탭당 1개, `tabLockHold` 공유) — busy(IM-9)·쓰기 탭 `stop()`·Quota = IM-11·그 밖 IM-10·성공 = `saved` → `design-studio-imported` = JSON `{projectId,name}` → `/projects` 이동. 값 import 0: envelope·entryRead·idbPersistence·studioStore(리터럴 + parity) |
| `components/projects/ImportProjectFileDialog.tsx` (새) | I-S02 확인 중(취소만·포커스) · I-S03 요약 IM-12·IM-13·IM-14(포커스 = 가져오기) · I-S04 alert + 다른 파일 고르기(포커스)·닫기 · I-S05 가져오는 중…(Esc 무시·연타 1회) · I-S06 alert key 패턴 · 멈춘 뒤 실패 = 새로고침 안내 + 닫으면 reload · 닫은 뒤 늦은 확인 결과 버림 |
| `components/projects/ImportProjectFileDialogSlot.tsx` (새) | 기본 의존성(locks·indexedDB·tabLink·sessionStorage·location.assign) · `checkFile` · `importerFor` |
| `components/projects/BrowserStorageSection.tsx` | local && factory일 때 "프로젝트 파일 가져오기"(outline sm, 지우기 앞) + 숨긴 input(accept `.json,application/json`·tabIndex -1·aria-hidden) · 고른 뒤 input 값 비움 · lazy Slot(key = 고른 횟수) · 다른 파일 고르기 = 닫고 선택기 다시 · 닫기 = 포커스 가져오기 버튼 |
| `features/projects/dialogText.ts` | `IMPORT_BUSY_TEXT`(IM-9) |
| 테스트 | `writeImport.test`(14) · `ImportProjectFileDialog.test`(9 — Slot AC-P02 IDB open 0 포함) · `BrowserStorageSection.test` +4 |

## 3. TDD 기록
- R1 예측(PROGRESS): writeImport·대화상자 모듈 없음 → 파일 전체 FAIL = 실제(writeImport "no tests" FAIL). 구현 뒤 1건 FAIL = 테스트 쪽 `await` 누락(`readImageRecord`는 async) — 테스트 수정(기대값 같음).
- 대화상자 "확인 중 취소 뒤 늦은 결과 버림" 1건 FAIL → 구현 보강(`closed` ref).
- R2 저장소 영역: 새 테스트 4건 중 3건 RED 확인(memory 숨김 1건은 원래 숨김이라 통과) → 구현 → 24/24.
- 실수: d67949d 커밋 체인이 `| tail` 파이프라 tsc 실패(Button `ref` 미지원 · 테스트 타입 1건)를 못 막음 → ebf99b3로 수정(amend 금지 준수). 이후 `pipefail`.

## 4. 검증 (fresh, app/ — ebf99b3)
| 명령 | 결과 |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npx vitest --run src/features/projectFile src/components/projects src/features/projects` | 18 파일 · 193 테스트 통과 |
| `npm run build` | **exit 1 — `/profile` 100.22 > 100** (1절) |

## 5. 하지 않은 것 (관문 정지)
- FX-1 · ProjectsPage(IM-15·포커스) · Ego Lite ①~⑤ · 전체 vitest — 아래 진행 기록 참조.
- Codex 검증은 Jarvis 몫(미실행).
