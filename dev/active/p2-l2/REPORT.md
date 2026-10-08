# P2-L2 REPORT — /projects "파일로 내보내기" 화면

## 판정 — 완료: 구현 + 번들 관문 통과 + Ego Lite 실측 + typecheck·lint·build·전체 vitest exit 0 (Codex는 Jarvis 몫 — 미실행)

- 브랜치 `k002bill2/p2-l2` · base `483c0db` · 커밋: 986af24(P0) → 597789d(배선·구현) → 1ab4291(Ego Lite 실측 포커스 결함 수정) → 706d726(Ego 결과) → (이 REPORT)
- 정본: P2-SPEC 머리 "Jarvis 채택 결정" · 1.2·1.3·3.6·4.1·5절 EX·6절·7절 AC-P01(E 앞반)·P07·P08·P09(내보내기) · 8절 L2 행.

## 1. 바뀐 파일 (8절 L2 행만 — L3 파일·엔진·계약·docs·lock 수정 0)
| 파일 | 내용 |
|---|---|
| `components/projects/ProjectRow.tsx` | `onExport?` · "파일로 내보내기"(outline sm · aria-label "{이름} 파일로 내보내기" · `data-export-for`) — "삭제" 앞 |
| `components/projects/ProjectList.tsx` | `onExport` 전달 |
| `pages/ProjectsPage.tsx` | `ExportDialogSlot = lazy(...)` · local일 때만 `onExport` · 열 때 이름 초안 취소 · 닫힘 = 그 줄 버튼 포커스 · 성공만 EX-9("프로젝트 알림") · `exportDeps` 테스트 주입. 삭제 블록 옆에 모음(L3 rebase 대비) |
| 새 `components/projects/ExportProjectFileDialog.tsx` | X-S01~X-S06: 네이티브 dialog · 열 때 포커스 "파일 만들기" · Esc=취소(만드는 중 무시) · "만드는 중…" aria-disabled + ref 연타 막기 · ≥50MB면 EX-8 + "내려받기"(포커스) · 실패 alert key 패턴(EX-6·7·10·12) · 성공 = save → `close()` 먼저 → onClose(true) |
| 새 `components/projects/ExportProjectFileDialogSlot.tsx` | 조작 뒤 청크: readProject → `encodeProjectFile`(L1, 수정 0) · 예외 = EX-10 · 부모 문서 `a[download]` + 다음 틱 `revokeObjectURL` · 의존성 주입(factory·now·download·read) |
| 새 `features/projectFile/readProject.ts` | IDB readonly **한 트랜잭션** `studio·docs·images` · 버전 없이 열기 · 저장소 없음/상태 없음/프로젝트 없음 = gone(EX-7) · 상태·문서 봉투 mismatch·invalid = unreadable(EX-6) · 계열 version 오름차순 · 이미지 = `projectImageKeys`(P1d 슬래시 접두) · `projectFileName`(1.3, 로컬 날짜) · envelope 등 진입 closure 값 import 0(DB 이름 리터럴 + parity 테스트) |
| 테스트 | 새 `readProject.test`(11) · `ExportProjectFileDialog.test`(14) · `pages/ProjectsExport.test`(8) · `ProjectsDelete.test` 줄 순서 단언 `slice(-2)`→`slice(-3)` = 이름 바꾸기·파일로 내보내기·삭제(강화 — **L3 겹침 후보**) |

## 2. 검증 (fresh, app/, Ego Lite·수정 뒤 마지막 실행)
| 명령 | 결과 |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 (경고 0) |
| `npm run build` | exit 0 (번들 가드 통과) |
| `npx vitest --run` (전체 1회) | exit 0 · 292 파일 · 2566 테스트 통과 |

번들(KB, 진입 직후 자동 로드 포함) — 배선 첫 커밋 597789d 직후(브리프 16턴 전 관문) · 마지막 실행:
| 시나리오 | main(브리프) | 597789d 직후 | 마지막 | 관문 |
|---|---|---|---|---|
| /studio | 129.09 | 129.10 | 129.12 | ≤129.65 ✓ |
| 복원 | 132.13 | 132.14 | 132.15 | ≤132.68 ✓ |
| /profile 첫 화면 | 99.87 | 99.86 | 99.87 | ≤100 ✓ |
| /projects | 104.69 | 104.95 | 104.95 | ≤125 ✓ |
| /compare | 122.71 | 122.70 | 122.72 | ≤125 ✓ |
- 멈춤 조건 미해당 → 원인 모듈 조사 불필요. /studio·복원 +0.01~0.03은 진입 closure 변경 없이 공유 청크·해시 이름 변동으로 보임 [추정 — 모듈별 분해 안 함]. 6절 "진입 closure 검증 함수 import 재분할"은 이 레인 export 경로가 `validateProjectName`·`formatFromMagic` 등을 import하지 않아(encode·readProject) 해당 없음 — 가져오기(L3)에서 판정.

## 3. TDD 기록
- RED 예측(PROGRESS) = 실제: R1~R3 모듈 없음 import 실패 · R4 `slice(-3)` 1건 FAIL. RED 테스트 tip 커밋 0 · skip 0 · 단언 약화 0 · amend·rebase 0.
- Ego Lite 결함 회귀: showModal이 첫 버튼에 포커스하는 spy 테스트 → RED(포커스 = 취소) 확인 → 수정 → GREEN(1ab4291).

## 4. Ego Lite (build + preview 4337, TaskSpace 31) — 상세 PROGRESS
- 단색 PNG 800×400(스크립트 생성, 저장소 밖) 1장 넣은 project-1 → `/projects` "파일로 내보내기" → 포커스 "파일 만들기" → 만들기 → 내려받기 `모던-카페-브랜드-프로젝트_project_20261008.json`(8826 B) · JSON 최상위 `format` design-studio-project · `formatVersion` 1 · `schemaVersion` 1 · images 1(webp 800×400, 640·800).
- **내려받은 파일(삭제 안 함, L3 입력 후보)**: `/var/folders/jh/3l0ptrs90gl5vk9_z2t7r4900000gn/T/p2-l2-ego/dl/모던-카페-브랜드-프로젝트_project_20261008.json`
- EX-9 textContent 1회 · alert 0 · 포커스 그 줄 "파일로 내보내기" · 바깥 클릭 닫힘 0 · 실제 Esc → 닫힘 + 포커스 복귀.
- 스크린샷 3장(captureBeyondViewport:false + clip): `shots/1-dialog-focus.png` · `2-ex9-focus.png` · `3-esc-focus.png`.
- 정리: deleteDatabase success · databases() [] · finish({keep:[]}) · listTaskSpaces() = 공간 31만(ownership user — finish 뒤에도 목록에 남음, 다른 공간 0) · preview 종료 · 4337 리슨 0 · main 5480 무접촉.

## 5. 판단·SPEC과 다른 점
- 내려받기 디렉터리: 브리프의 CDP `Browser.setDownloadBehavior` 대신 ego-browser 스킬이 지정한 `waitForEvent("download")`+`saveAs`(스킬이 raw CDP 전역 다운로드 설정을 금지)로  저장 — 파일명·내용 확인 목적은 같음.
- 깨진 이미지 레코드(봉투 불일치·변형본이 Blob 아님)는 **건너뜀**(EX-6 아님) — 열기에서도 잃은 이미지이고, 실으면 가져오기 IM-6으로 파일 전체가 막힌다. 상태·문서 봉투만 EX-6(3.6).
- 슬롯 파일 이름 = `ExportProjectFileDialogSlot.tsx`(SPEC 6절 표기 `ExportProjectFileSlot` — 삭제 선례 `DeleteProjectDialogSlot`에 맞춤).
- `projectFileName`은 readProject.ts에 둠(Slot에 두면 react-refresh lint 경고).
- 브리프 표기 "EX-9 1회": 알림 영역 텍스트는 key가 바뀔 때만 다시 낭독 — 성공 1회만 announce.

## 6. 한계·남은 일
- Codex 검증 미실행(Jarvis 몫). AC-P01 E 뒷반(가져오기 왕복)·AC-P07 가져오기는 L3.
- X-S03(50MB 이상)·EX-6/7/10/12는 U만(실 브라우저 미실측 — 큰 파일·손상 상태 시드 안 함).
- 턴 기준: 대체로 충족 [대략 셈] — Ego Lite 시작 약 26번째, 결과 커밋 약 40번째.
- 금지 준수: 엔진·계약·docs/**·lock·CLAUDE.md·L3 파일 수정 0 · 새 의존성·아이콘 0 · 서브에이전트 0 · push/merge/삭제 0 · amend/rebase 0.
