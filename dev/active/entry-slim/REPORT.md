# ENTRY-SLIM REPORT (초안)

## 1. 실측표 — 전(base 6009271, `npm run build`, gzip KB 소수 넷째 자리는 $TMPDIR 사본 `es-closure.mjs`)

`/studio/:projectId` 진입 직후 자동 로드 포함 = **129.6470** (22개 파일) · 복원 진입 = **132.6800** (26개) · `/profile` 첫 화면 99.8730

| # | 청크 | 소스 | gzip |
|---|------|------|------|
| 1 | index | index.html(공통) | 86.1070 |
| 2 | StudioLayout | components/studio/StudioLayout.tsx | 18.6630 |
| 3 | issue | 엔진 공유 청크(gate·sections·ops) | 8.0270 |
| 4 | react | react | 3.2800 |
| 5 | deferredStudio | data/deferredStudio.ts | 2.7570 |
| 6 | memoryProjectRepository | data/memoryProjectRepository.ts | 1.8570 |
| 7 | StudioPage | pages/StudioPage.tsx | 1.8190 |
| 8 | referenceDetails | fixtures/referenceDetails.ts | 1.3600 |
| 9 | references | fixtures/references.ts | 0.9780 |
| 10 | contrast | 공유(대비 계산) | 0.8880 |
| — | projectName | domain/projectName.ts (memoryProjectRepository 정적 import) | 0.3860 |

복원 진입 추가분: imageStore 1.0060 · imageRestore 0.7480 · imageRecord 0.7180 · ladder 0.5610.
모듈 단위 기여(sourcemap 빌드 $TMPDIR 사본, 참고): StudioLayout 청크 상위 = StudioLayout.tsx 4.21 · StructureCanvas 2.13 · useAutosaveScheduler 1.30 · StudioPanels 1.16 · GateList 1.02.

## 2. 후보 · 실측 · 판정

| 후보 | 근거 | 실측(`/studio` · 복원 · /profile 첫 화면 · /projects 자동) | 판정 |
|------|------|------|------|
| A. `memoryProjectRepository`의 `validateProjectName` 정적 import → `renameProject` 안 `import("../domain/projectName")` | `src/data/memoryProjectRepository.ts:10·114` — 이름 규칙은 `renameProject`(호출자 `ProjectsPage.tsx:84` "이름 바꾸기" 저장)에서만 | 129.65 · 132.68 · **100.11(실패)** · 105.33 | **기각** — 공유 청크를 동적 import하자 rolldown이 네임스페이스 객체용 `rolldown-runtime` 청크(0.43)를 새로 떼어 공통 경로가 커짐 |
| B. 이름 바꾸기 본문을 조작 뒤 모듈 `src/data/projectRename.ts`로 이동 · `loadRename = retryableImport(() => import("./projectRename"))` | 같은 근거. 본문(이름 규칙·NOT_FOUND·STALE_PROJECT·쓰기) 그대로 이동 | **129.0930(−0.554)** · **132.1280(−0.552)** · 99.8680(−0.005) · 104.69(−0.17) | **채택** |

다른 라우트(B 후): /catalog 100.07/102.41 · /references 97.32/99.65 · /compare 98.89/122.71 · /profile(3안) 99.87/122.44 — 전부 같거나 감소.

조사했으나 손대지 않은 것(동작 변경 위험): `ConflictCallout`·`ExportRetryAlert`·PNG 실패 문구·`saveStatusText` 실패 문구 — 코드 주석에 "청크를 받지 못해도 떠야 한다"(M2A-3a Codex P2-1 r2) 결정이 있어 지연 이동 = 실패 경로 동작 변경.

## 3. 동작 동일성
- 성공 경로: `/projects`는 `ProjectsRoute → renameDraft`가 `projectName`을 정적으로 받으므로 이름 규칙 청크는 이미 받은 상태 · 새 청크는 `projectRename` 본문(작음)만.
- 차이(알려 둠): 이름 바꾸기 저장 첫 회에 작은 청크 1개를 받는다. 그 청크를 못 받으면 `renameProject`가 청크 오류로 거부 — `ProjectsPage`의 기존 실패 처리 경로를 탄다(다음 시도는 `retryableImport`가 `?retry=`로 다시 받음). 문구·접근성 변경 0.
- 고정 테스트: `boardConfirmProject.test.ts:172`(공백 제거·revision+1·SCHEMA_INVALID·STALE_PROJECT 최신 동봉·NOT_FOUND) · `writerLock.test`(잠금 아래 이름 바꾸기) · `localSync.test` · `ProjectsPage.test` — 58 passed.
