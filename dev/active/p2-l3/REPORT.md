# P2-L3 REPORT — 프로젝트 파일 가져오기 화면·쓰기 (초안 — 번들 관문 정지)

- 브랜치 `k002bill2/p2-l3` · base `483c0db` · 커밋: 198501f(P0) → d67949d(writeImport·대화상자·Slot·저장소 영역 배선·IM-9) → ebf99b3(타입 오류 2건 수정)
- **상태: 배선 첫 커밋 직후 build 관문 실패 → 브리프 규칙대로 멈춤.** 원인 모듈 아래 1절.

## 1. 번들 관문 실패 (배선 직후 실측 — KB 추정 아님)
`npm run build` exit 1 — `[bundle] 예산 검사 실패 — /profile: 첫 화면 100.22KB > 100KB` (+ `/profile (3안 있음)` 같음).

같은 환경에서 4가지 트리를 빌드(`npx vite build` + `node scripts/check-bundle-size.mjs` 직접 — 임시 변경은 전부 원복, `git status` clean 확인, 커밋 0)해 비교. 단위 KB.

| 시나리오 | main(483c0db) | 배선 없음¹ | **배선 있음(ebf99b3)** | 배선 + profileShape 스텁² | + checkImages 스텁³ |
|---|---|---|---|---|---|
| `/profile` 첫 화면 (예산 100) | 99.87 | 99.87 | **100.22 ✗** | 99.87 | 99.87 |
| `/profile` 자동 로드 포함 | 119.96 | 119.96 | 120.31 | 119.98 | 119.99 |
| `/studio` 자동 로드 포함 (멈춤 >129.65) | 129.09 | 129.11 | 129.13 | 129.11 | 129.12 |
| `/studio` 복원 (멈춤 >132.68) | 132.13 | 132.14 | 132.16 | 132.14 | 132.15 |
| `/projects` 자동 로드 포함 (/125) | 104.69 | 104.94 | 105.25 | 105.15 | 105.14 |
| `/compare` 자동 로드 포함 (/125) | 122.71 | 122.72 | 122.91 | 122.71 | 122.70 |

¹ `BrowserStorageSection`의 `lazy(() => import("./ImportProjectFileDialogSlot"))`만 null 컴포넌트로 교체. ² `profileShape.ts`의 값 import 5개를 자리표시 리터럴로 교체(측정 전용 — 동작 아님). ³ ②에 더해 `checkImages.ts`의 `ingest/fileType`·`ladder`·`limits` 값 import를 자리표시로 교체.
- `vite build` 단독 실행이라 check 스크립트가 render.html·썸네일 CSS 가드로 exit 1 — main 열도 같음(측정 방식 탓, 경로 수치와 무관). main 열 수치는 L1 REPORT의 main 기준과 정확히 같다.

**원인 모듈(실측 확정) = L1 `features/projectFile/profileShape.ts`** (Codex r1·r2 수정에서 추가)의 값 import 5개:
`SECTION_TYPE_LABELS`(`features/profile/profileFields`) · `PURPOSE_LABELS`(`fixtures/catalogFilters`) · `PALETTE_ROLES`(`domain/palette`) · `CONTRAST_TARGET`(`domain/profileContrast`) · `DENSITY_LABELS`(`features/profile/adjustmentText`).
`/profile` 첫 화면 청크 안 모듈을 가져오기 lazy 청크도 값으로 쓰자 Rollup이 공유 청크(`profileFields-*`·`palette-*`·`industryCopy-*` 등)로 떼어 내 `/profile` 첫 화면에 청크 머리·바인딩이 더해졌다(+0.35). 스텁 ②만으로 99.87 복귀.
- **잔여 +0.02~0.03(`/studio`·복원)**: 배선을 뺀 빌드에서도 이미 129.11 — 원인 미확정. checkImages 스텁 ③으로도 줄지 않음. P1d 완료 기록의 "공유 청크 export 변동 ±0.02"와 같은 현상으로 보이나 [추정 — 실측 안 함]. 멈춤 선(129.65·132.68) 안이지만 브리프 "/studio·복원 몫 0"은 충족 못 함.
- SPEC 6절 처방: "수치가 바뀌면 그 함수만 리터럴 복제 + parity 테스트". 단 `profileShape.ts`·`checkImages.ts`는 **L1 파일(이 레인 쓰기 목록 밖)** 이라 이 레인은 고치지 않았다.

### Jarvis 결정 요청
1. `profileShape.ts`의 열거 5개를 리터럴 복제 + parity 테스트로 바꿀지(L1 후속 또는 L3 범위 확장) — 실측상 이것만으로 `/profile` 관문 통과.
2. `/studio`·복원 잔여 +0.02~0.03을 허용할지(멈춤 선 안) 또는 원인 추적을 따로 둘지.
3. 처리 뒤 L3 재개 순서: FX-1 → ProjectsPage(IM-15·포커스, 마지막 커밋) → Ego Lite ①~⑤ → 게이트·REPORT.

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
| `npx vitest --run` (전체 1회) | **exit 0 · 291 파일 · 2561 테스트** (가드 noHardcodedStyle·brandIsolation 등 포함) |

## 5. 하지 않은 것 (관문 정지 — 브리프 "넘으면 멈추고 원인 모듈 REPORT")
- FX-1(`ClearDataDialog`·`DeleteProjectDialog`) · `ProjectsPage`(IM-15·가져온 줄 포커스) · Ego Lite ①~⑤: 시작 안 함. preview 서버·Ego 공간도 만들지 않아 정리 대상 0.
- 재개 때 참고: `ProjectRow`(L2 파일)는 고칠 수 없으므로 가져온 줄은 SPEC의 새 `data-project-row` 대신 기존 `data-rename-for={projectId}` → 그 `li`의 첫 링크·버튼으로 찾을 계획(목록 비동기 로드 뒤 1회) — 목업/SPEC과 다른 점으로 기록 예정.
- `ClearDataDialog.test:28`은 "백업 문장 숨김"을 단언 중 — FX-1은 이 단언을 FX-1 문장 존재로 바꾸는 사양 변경(단언 약화 아님).
- Codex 검증은 Jarvis 몫(미실행).
- `app/dist/`에는 마지막 측정(스텁 ③) 빌드 산출물이 남아 있다(gitignore — 커밋 0). 다음 build가 덮어쓴다.

## 6. 턴 기한 기록 (사실)
- 브리프 기한 "배선 첫 커밋 직후 18턴 전 build": 실제 약 29~30턴(늦음). 구현 커밋(d67949d) 28턴 전후. Ego Lite 30턴 전 시작: 미시작(관문 정지).
- 정본 읽기에 턴을 많이 썼고, 계획했던 "구현·배선·build 한 턴"이 테스트 실행 위치(app/ 밖 실행 → jsdom 미적용)·타입 오류 수정으로 늘어났다.
- 지켜진 금지: 엔진·계약·docs/**·lock·CLAUDE.md 수정 0 · L2 파일(`ProjectRow`·`ProjectList`·`ExportProjectFileDialog`·`readProject`) 수정 0 · L1 파일 수정 0 · 새 의존성·아이콘 0 · 서브에이전트 0 · push/merge/삭제 0 · amend/rebase 0 · main 5480 무접촉 · RED 테스트 tip 커밋 0 · 단언 약화 0.
