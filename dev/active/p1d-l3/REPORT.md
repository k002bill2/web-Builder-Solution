# P1D-L3 REPORT — `/projects` 프로젝트 삭제

## 판정 — 완료: 구현 + 번들 관문 통과 + Ego Lite 실측(①~④) · typecheck·lint·build·전체 vitest exit 0

- 커밋: P0 `b7e75d9`(BRIEF) · 구현 `04c959e` · 이 REPORT·실측 = 다음 docs 커밋. amend·rebase·push·merge 0 · 서브에이전트 0 · Codex 0(Jarvis 몫).

## 바뀐 파일 (7절 L3 행만)
| 파일 | 내용 |
|---|---|
| `features/projects/deleteProject.ts` (새) | 순수 판정 `planDelete`(봉투 확인 · 프로젝트·머리·계열·조정·확정·잡 제거 · `seq` = max(기존, 지운 번호) · `gen` = meta generation + 1) · `projectImageKeys`(`${id}/` 접두) · IDB 껍데기 `runDelete`(한 트랜잭션 `studio·docs·images·meta` readwrite, 커밋 확인 뒤 done, 읽기 불가·이미 지워짐은 abort = 쓰기 0) · 탭당 흐름 `deleterFor`(쓰기 탭이면 보유 잠금 안 + 싱크 멈춤 · 아니면 tryLock · 못 잡으면 busy · 성공 = `saved` → 1회 키 → `/projects` 새로고침 · 이미 지워짐 = 성공과 같게(saved 0)) |
| `features/projects/dialogText.ts` (새) | `BUSY_TEXT`·`FAIL_TEXT` 공용 이동 (`ClearDataDialog.tsx`는 상수 2줄 → import 1줄) |
| `components/projects/DeleteProjectDialog.tsx` (새) | J-S13~J-S15 · close() 먼저 · 진행 중 Esc 무시 · alert 시도마다 1개 · 멈춘 뒤 실패 = 문장 끝 " 이 화면을 새로 불러옵니다." + 닫으면 새로고침 |
| `components/projects/DeleteProjectDialogSlot.tsx` (새) | 조작 뒤 청크 — 브라우저 기본 의존성은 여기서만 푼다 |
| `ProjectRow.tsx` · `ProjectList.tsx` | "삭제"(outline sm · `aria-label "{이름} 삭제"` · `data-delete-for`) — `onDelete` 있을 때만 |
| `ProjectsPage.tsx` | local일 때만 `onDelete` · 대화상자 lazy · 취소 포커스 = 그 줄 "삭제" · 이름 바꾸는 줄에서 삭제 = 초안만 취소(`close()` 아님 — 포커스가 끌려가지 않게) · 알림 setter를 useRename 밖으로 · PJ-10 1회 + h1 `tabIndex=-1` 포커스(키 있을 때만) · 키 `DELETED_NOTICE_KEY` 리터럴 복제 |
| 테스트 | `deleteProject.test.ts`(18) · `DeleteProjectDialog.test.tsx`(6) · `ProjectsDelete.test.tsx`(8) · `dialogText.test.ts`(1) |

- 수정 0 확인: `memoryDocBook`·`Snapshot*`·`projectRepository.ts`·`memoryProjectRepository.ts`·`studioStore.ts`·엔진·docs·lock·`BrowserStorageSection.tsx`.
- import 규칙: `deleteProject.ts`는 `envelope`·`entryRead`·`idbPersistence`·`studioStore` 런타임 import 0(타입만). DB 이름·SCHEMA 1·봉투 확인은 복제 + parity 테스트(`DELETE_DB_NAME === DB_NAME` · `DELETED_NOTICE_KEY === DELETED_KEY` · put 레코드 `schemaVersion === SCHEMA_VERSION`).

## 번들 (구현 커밋 `04c959e` 직후 `npm run build`)
| 경로 | 결과 | 관문 |
|---|---|---|
| `/studio` 진입 직후 | 129.63 | ≤129.65 ✅ (main 129.64) |
| 복원 진입 직후 | 132.66 | ≤132.68 ✅ |
| `/profile` 첫 화면 | 99.87 | ≤100 ✅ (변화 0) |
| `/projects` 진입 직후 | 104.86 | ≤125 ✅ (main 104.49 → +0.37, 버튼·알림·lazy 참조) |

## TDD
- RED 예측(PROGRESS) → 실측: 4파일 FAIL. 차이 1건 — `ProjectsDelete.test.tsx`는 import가 타입뿐이라 import 단계가 아니라 단언 단계에서 7건 FAIL, "키 없음 → 알림 0" 1건은 처음부터 GREEN(회귀 고정 성격).
- 구현 뒤 GREEN. 고친 테스트 1건: 페이지 Esc를 `userEvent.keyboard("{Escape}")` → `cancel` 이벤트로(jsdom은 Esc로 cancel을 내지 않음 — 기존 ClearDataDialog 테스트 관례, 단언 그대로). 실제 Esc는 Ego Lite ④에서 실측.
- 트랜잭션 원자성: jsdom에 IDB가 없고 새 의존성 금지라 손 IDB 가짜(마이크로태스크 요청 · 매크로태스크 커밋 · 실패 주입 = 쓰기 0)로 U, 실제 IDB는 Ego Lite.

## 게이트 (fresh 실행 — 코드 = `04c959e`)
- `npx tsc --noEmit -p tsconfig.json` exit 0 · `npx eslint .` 출력 0 · `npm run build` exit 0(번들 가드 통과) · `npx vitest --run` **280 files / 2456 tests passed, EXIT=0**.

## Ego Lite (build + `vite preview --port 4339 --strictPort`, TaskSpace 29)
- 창 상태 확인 = `normal`(첫 클릭 CDP 타임아웃 1회 뒤 확인, 이후 정상). 캡처는 래퍼 `page.screenshot`이 `captureBeyondViewport`를 받지 않아 `page.cdp("Page.captureScreenshot", { captureBeyondViewport:false, clip })`로 3장(`shots/`).
- 준비: ref-a 비교 추가 → "프로필 확정 (v1)" = project-1 · `/compare?new=1` + 폰트 선택 변경 → "새 프로젝트로 확정" ×2 = project-2·3. 탭 B(p2) `/profile/profile-3` → 3안 → A안 → "A안으로 편집 시작"은 처음 실패(확정한 탭 A가 쓰기 잠금 보유 — 설계대로) → A를 `/projects`로 새로 불러 잠금 해제 → B "다시 시도" → `/studio/project-3` → 단색 PNG 800×400(`/tmp`, 저장소 밖) 업로드 → "이 브라우저에 저장됨". IDB: docs `[project-3]` · images `project-3/…` 1건 · gen 6.
- **① AC-D05 차단**: B 쓰기 탭 상태에서 A `/projects` "모던 카페 브랜드 프로젝트 3 삭제" → 열 때 포커스 "취소" → "프로젝트 지우기" → `role=alert` textContent "다른 탭에서 편집 중이라 지우지 못했습니다 — 그 탭을 닫은 뒤 다시 시도하세요" · alert 수 1 · **IDB 덤프 삭제 전후 동일(gen 6)** · 취소 → 포커스 `data-delete-for=project-3` (`shots/1-busy-alert.png`).
- **② AC-D04·D06 성공**: B 닫음 → A 같은 버튼 → "프로젝트 지우기" → `/projects` 새로고침 · "프로젝트 알림" textContent "'모던 카페 브랜드 프로젝트 3' 프로젝트를 지웠습니다" · 저장소 알림 "" · activeElement = `H1` "프로젝트" tabindex -1 · sessionStorage 키 null · 줄 [project-2, project-1]. IDB: docs `[]` · images `[]`(project-3/ 0) · snapshots 0 · projects/series/commits = 1·2만 · heads `[]` · jobs `[]`(job-1:profile-3 삭제) · **seq {project:3, profile:3, job:1}** · meta gen = state gen = **7**(6+1) (`shots/2-deleted-notice.png`). 다시 새로고침 → 알림 "" (1회).
- **③ AC-D01④ E**: 새로고침 뒤 ref-b 비교 추가 → "프로필 확정 (v1)" → `/profile/profile-4` · IDB projects `[project-1, project-2, project-4]` · series `profile-4` · seq 유지 · gen 8 → **재발급 0**(진입 상태가 `seq`를 통과함을 실측).
- **④ AC-D06**: project-4 "삭제" → 포커스 "취소" · 바깥(8,8) 클릭 = 열린 채 · 실제 Esc 키 → 닫힘 · activeElement = `data-delete-for=project-4`("프리미엄 헤어살롱 프로젝트 삭제") (`shots/3-esc-focus.png`).
- 정리: `indexedDB.deleteDatabase("design-studio")` = success · `indexedDB.databases()` = `[]` · `finish({keep:[]})` · `listTaskSpaces()` = `[]`(L2 공간 무접촉 — 목록에 없음) · preview 종료 · 4339 LISTEN 0. 영환님 창·main 5480 무접촉.

## 관찰·남은 위험
- ①에서 A의 목록은 B가 문서를 만들기 전에 읽은 것이라 대화상자에 "편집 문서와 스냅샷" 줄이 빠졌다(hasDoc = 목록 시점 값). 삭제 범위는 IDB 기준이라 결과는 정확 — 문구만 낡을 수 있음(목록 갱신 전 다른 탭 편집 시). [L1 실측]
- AC-D05 추가분(지운 프로젝트 편집기를 열어만 둔 탭 C의 저장 실패·부활 0)과 AC-D08 "쓰기 탭에서 실패 → 닫기 = 새로고침 → 이름 바꾸기 저장"은 U(흐름 `stopped`·대화상자 onClose(true))로만 확인, 실측 안 함 — 세대 +1은 ②에서 실측(6→7)되어 최신성 확인 경로는 기존 P1c 동작.
- 쓰기 탭이 아닌 다른 탭이 잠금 없이 열린 `/profile` 등에서 B의 미저장 메모리 편집은 낡은 탭 처리(P1c) — 이 레인 변경 0.
- ST-1 문구 교체(`BrowserStorageSection`)는 L3 쓰기 목록 밖이라 하지 않음.
- 턴 관리 [추정 — 직접 센 값 아님]: 구현 커밋 약 20턴째, Ego Lite 시작 약 22턴째·종료 약 50턴째(시나리오 준비 탐색 — 확정 비활성·잠금 보유로 재시도), REPORT 초안 약 52턴째.
