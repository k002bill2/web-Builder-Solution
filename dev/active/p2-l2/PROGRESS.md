# P2-L2 PROGRESS — 프로젝트 "파일로 내보내기"

- [x] P0 BRIEF·PROGRESS 커밋
- [x] 정본 읽기 (P2-SPEC 머리·1.2·1.3·3.6·4.1·EX·6·7·8절 L2, p2-l1 REPORT, DeleteProjectDialog·Slot)
- [x] readProject.ts (readonly 한 트랜잭션) — RED 예측 → RED → GREEN
- [x] ExportProjectFileDialog(+Slot) — RED 예측 → RED → GREEN
- [x] ProjectRow 버튼(data-export-for, 삭제 앞) · ProjectList onExport · ProjectsPage Slot·EX-9 — RED → GREEN
- [x] 배선 첫 커밋 직후 build 번들 실측 (/profile ≤100, /studio ≤129.65)
- [x] 구현 커밋
- [x] Ego Lite (build+preview 4337, 내려받기·파일명·JSON·EX-9·Esc 포커스, 정리)
- [x] 게이트: typecheck·lint·build·전체 vitest exit 0
- [x] REPORT.md

## TDD RED 예측
- R1 `readProject.test.ts`: 모듈 없음 → 파일 import 실패(전체 FAIL).
- R2 `ExportProjectFileDialog.test.tsx`: 모듈 없음 → 파일 import 실패.
- R3 `ProjectsExport.test.tsx`: Slot 모듈 없음 → import 실패(줄 버튼·EX-9 미구현).
- R4 `ProjectsDelete.test.tsx` 줄 버튼 순서 단언을 `slice(-3)` = 이름 바꾸기·파일로 내보내기·삭제로 강화 → 그 1건 FAIL(버튼 없음), 나머지 PASS.

## TDD 실제
- R1~R3 = 예측대로 모듈 없음 import 실패 · R4 = `slice(-3)` 1건 FAIL(`['이름 바꾸기','삭제']`) · 나머지 7 PASS.
- GREEN: 4파일 39 테스트 + ProjectsPage.test 통과 · typecheck·lint exit 0 → 597789d.

## 번들 (597789d 직후 build 실측, KB · 진입 직후 자동 로드 포함)
| 시나리오 | main(브리프) | 이 레인 | 관문 |
|---|---|---|---|
| /studio | 129.09 | 129.10 | ≤129.65 ✓ |
| 복원 | 132.13 | 132.14 | ≤132.68 ✓ |
| /profile 첫 화면 | 99.87 | 99.86 | ≤100 ✓ |
| /projects | 104.69 | 104.95 | ≤125 ✓ |
| /compare | 122.71 | 122.70 | ≤125 ✓ |

## Ego Lite (build + `vite preview --port 4337 --strictPort`, TaskSpace 31)
- 창 상태 normal(최소화 아님 — 변경 0). 시작 시 origin IDB 목록 [] .
- 준비(앱 안 클릭만): 카탈로그 "모던 카페 브랜드 비교 추가" → 비교 보드 "이 레퍼런스로 프로필 만들기" → "프로필 확정 (v1)" = project-1 → "3안 만들기" → A안 "이 안 선택" → "편집 시작" → `/studio/project-1` → "이미지 편집" → 단색 PNG 800×400(스크립트 생성, `$TMPDIR/p2-l2-ego/solid.png`, 저장소 밖) → "이 브라우저에 저장됨" · IDB images `project-1/bc22450e-…` 1건.
- `/projects` 줄 버튼 순서 = 편집기 열기·프로필 보기·이름 바꾸기·파일로 내보내기·삭제.
- 파일 만들기 → 내려받기: `page.waitForEvent("download")` + `saveAs`(ego-browser 스킬이 raw CDP setDownloadBehavior 대신 지정하는 방식 — 같은 효과로 $TMPDIR 저장). suggestedFilename = `모던-카페-브랜드-프로젝트_project_20261008.json` · 8826 B · 최상위 `format` design-studio-project · `formatVersion` 1 · `schemaVersion` 1 · exportedAt · project·series(1)·doc(스냅샷 0)·images **1**(webp 800×400, 변형본 640·800).
- 파일 경로(삭제 안 함 — L3 입력 후보): `/var/folders/jh/3l0ptrs90gl5vk9_z2t7r4900000gn/T/p2-l2-ego/dl/모던-카페-브랜드-프로젝트_project_20261008.json`
- EX-9: 닫힌 뒤 "프로젝트 알림" textContent = "'모던 카페 브랜드 프로젝트' 프로젝트 파일을 내려받았습니다" · alert 0 · 포커스 = 그 줄 "파일로 내보내기"(data-export-for=project-1) (`shots/2-ex9-focus.png`).
- **결함 발견·수정**: 첫 실측에서 두 번째 열기 포커스 = "취소"(showModal()이 useLayoutEffect 포커스 뒤에 실행돼 첫 버튼으로 옮김 — jsdom은 재현 안 함). RED 테스트(showModal이 첫 버튼에 포커스하도록 spy) FAIL 확인 → 같은 layout effect에서 showModal 뒤 포커스 → GREEN → 1ab4291 → 재빌드 후 재실측: 열기 2회 모두 activeElement "파일 만들기" (`shots/1-dialog-focus.png`).
- 바깥(8,8) 클릭 = 열린 채 · 실제 Esc 키 → 닫힘 · activeElement "파일로 내보내기" data-export-for=project-1 · 알림 변화 0 (`shots/3-esc-focus.png`).
- 정리: `deleteDatabase("design-studio")` = success · databases() [] · `task.finish({keep:[]})` 완료 · `listTaskSpaces()` = [{id 31, 'p2-l2 export QA', ownership 'user'}] (finish 뒤에도 목록에 남음 — 다른 공간 0, L3 공간 무접촉) · preview 종료, 4337 리슨 0. main 5480 무접촉.

# Codex r1 수정 (P2 1건 — readProject 이미지 레코드 전체 규칙 검사)
- [x] 픽스처 image(tag)를 저장 규칙 바이트(fakeImageBytes png · 사다리 640)로 교체 — 단언 변경 0, 기존 PASS 확인
- [x] 회귀 테스트 작성 + RED 확인(커밋 안 함) — $TMPDIR에서 HEAD 구현 대조, C1·C2(한 테스트)·C3 FAIL
- [x] 구현: IDB 읽기(연결 닫음) 뒤 readImageRecord 규칙 검사 · 실패 레코드 제외
- [x] build 번들 판정(/studio ≤129.65 · 복원 ≤132.68 · /profile ≤100 · 직전 129.12/132.15/99.86) — 늘면 리터럴 복제 + parity → 129.11 / 132.14 / 99.86
- [x] 게이트 typecheck·lint·build·전체 vitest 1회 exit 0
- [x] REPORT "Codex r1 수정" 절 커밋 (구현 커밋 10d11f7)

## RED 예측 (Codex r1 수정)
- C1 "width 1280 + variants 640만" 레코드 → 현재 imageOf 통과 → images에 포함 → 제외 단언 FAIL.
- C2 "variants {}" 레코드 → `[].every` = true로 통과 → 포함 → FAIL.
- C3 왕복(정상 1 + 손상 1 → readProject → encodeProjectFile → checkFile(fakeDeps)) → 손상 포함 → IM-6 → ok 단언 FAIL.
- 정상 이미지 포함 단언은 수정 전후 PASS. 기존 테스트(픽스처 교체 뒤) 전부 PASS.
