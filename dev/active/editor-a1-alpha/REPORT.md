# EDITOR-A1-ALPHA — REPORT

편집기 선행 부품(프로젝트 저장소 인터페이스·이름 규칙·프로젝트 목록/이름 바꾸기·저장 상태 문구·자동 저장 스케줄러·편집기 빈 상태)을 **전부 새 파일**로 만들었다. 라우트 연결 0, engine import 0, 기존 파일 수정 0. 표적 테스트 105/105 · typecheck · lint · build 통과, **dist 바이트 동일**(번들 영향 0).

## 로컬 커밋 (브랜치 `k002bill2/editor-a1-alpha`, push·병합 없음)
| SHA | 내용 |
|---|---|
| `9dec285` | `data/projectRepository.ts` · `domain/projectName.ts`(+test) · PROGRESS |
| `88ab7a3` | 레인 B(서브에이전트 커밋 `a345d6e` cherry-pick) — 자동 저장·저장 상태·편집기 빈 상태 |
| `fd32484` | 레인 A(서브에이전트 커밋 `0761fa6` cherry-pick) — 프로젝트 목록·이름 바꾸기 |
| (이 커밋) | REPORT · PROGRESS · 로그 |

## 파일 (`app/src/`, 전부 신규)
- `data/projectRepository.ts` — SPEC 8.3 `ProjectRepository<TDoc = unknown>`(메서드 13 + `persistence`), 8.1 `Project`·`ProjectSummary`·`ProjectSnapshot<TDoc>`·`ExportJob`·`ExportRequestResult`, 오류 코드 10종, `ProjectRepositoryError`(STALE_PROJECT → `project`, STALE_DOC·DOC_EXISTS → `doc`), `projectErrorCode()`
- `domain/projectName.ts` — `normalizeProjectName`(trim) · `nameLength`(코드포인트) · `validateProjectName`(1~40자, J-S06 문장) · `defaultProjectName(title, existingNames)`(2.1, " 2"·" 3"…)
- `features/projects/{projectListView,renameDraft,useProjectList}.ts` · `components/projects/{ProjectList,ProjectRow,RenameField}.tsx` · `pages/ProjectsPage.tsx`
- `features/studio/{saveStatusText,useAutosaveScheduler}.ts` · `components/studio/StudioEmptyStates.tsx`
- 테스트: `domain/projectName.test.ts`(10) · `features/projects/projectListView.test.ts`(10) · `renameDraft.test.ts`(12) · `pages/ProjectsPage.test.tsx`(16) · `features/studio/saveStatusText.test.ts`(9) · `useAutosaveScheduler.test.ts`(20) · `useAutosaveScheduler.hook.test.tsx`(9) · `components/studio/StudioEmptyStates.test.tsx`(3) = **새 테스트 89개**

## 검증 (메인에서 fresh 실행, 로그 `logs/`)
| 명령 (app/) | 결과 | 로그 |
|---|---|---|
| `npx vitest run` 새 테스트 8파일 + 가드 4개(noHardcodedStyle·engineImportGuard·brandIsolation·tokenUsage) | 12 files · **105 passed** · exit 0 | `gate-test-targeted.log` |
| `npm run typecheck` | exit 0 | `gate-typecheck.log` |
| `npm run lint` | exit 0 | `gate-lint.log` |
| `npm run build` | exit 0 | `gate-build.log` |
- **전체 test suite는 이 레인에서 돌리지 않았다(profile 레인 전담) — 전체 게이트는 병합 시.**
- RED 로그: `main-red-projectName.log`(exit 1) · `laneA-red.log`(exit 1) · `laneB-red.log`(exit 1) — 모두 구현 모듈 없음으로 import 단계 실패(단언 실행 전). GREEN: `main-green-projectName.log` · `laneA-green.log`(50) · `laneB-green.log`(46).

## 번들 불변 근거
- 기준: `c39c265`에서 `npm run build` → `baseline-build.log`. 이후: 최종 HEAD에서 → `gate-build.log`.
- `[bundle]` 줄(라우트별 첫 화면·진입 직후·조작 뒤 수치 19줄) diff → **차이 0** (`bundle-diff.txt`, exit 0).
- `dist/` 전체 파일 55개 shasum diff → **차이 0** (`dist-sha-diff.txt`, exit 0) — 새 모듈이 어느 라우트 그래프에도 들어가지 않음.

## 수용 기준 판정
| AC | 판정 | 근거 |
|---|---|---|
| J-AC-02 빈 상태 | 충족(컴포넌트) | ProjectsPage.test: 안내·캡션·"비교 보드로"(/compare)·"카탈로그에서 고르기"(/catalog), `role=alert`·목록 없음 |
| J-AC-03 목록 | 충족(컴포넌트) | 이름 h2(링크 아님)·"프로필 vN"·편집 상태 3종·`<time dateTime>`·"편집기 열기"는 문서 있을 때만·updatedAt 내림차순(저장소 순서 불신)·"새 프로젝트 시작"→`/compare?new=1` |
| J-AC-08 이름 바꾸기 | 충족(컴포넌트) | 입력 포커스+전체 선택·Esc/취소·저장 뒤 포커스 "이름 바꾸기"(줄이 맨 위로 이동해도)·status 알림·0자/43자 `aria-invalid`+설명·연타 1회·실패 alert+입력 유지·STALE_PROJECT 문장+입력 유지+다음 저장은 최신 revision |
| J-AC-10 긴 이름 | 부분 — [V]만 | 60자 이름 전체 렌더·h2에 truncate/nowrap/line-clamp 없음. 5폭 가로 넘침 [Q]는 라우트 없음이라 a1-β에서 |
| E-AC-01 프로젝트 없음 | 충족(컴포넌트) | `StudioProjectNotFound`: h1·문장·"프로젝트 목록"(/projects)·"비교 보드로", alert·nav·header 없음 |
| E-AC-02 문서 없음 | 충족(컴포넌트) | `StudioNoDoc`: h1=프로젝트 이름·안내·"프로필에서 3안 고르기"→`/profile/:profileId` |
| E-AC-07 자동 저장 타이밍 | 충족 | 가짜 타이머: 1999ms 0회/2000ms 1회 · 1초 간격 30초 → maxWait로 ≤30초 저장 · 저장 중 변경 3개 → 끝난 뒤 최신 문서로 1회 |
| E-AC-09 실패·오프라인 | 충족(스케줄러+훅) | 연속 2회 실패에도 alert 1회 · 입력 유지 · "다시 저장" 성공 → "다시 저장했습니다" · offline → 저장 0 + "오프라인 — 연결되면 저장합니다" · online → 저장 1회 · `NETWORK` 거부 = offline |
| E-AC-12 beforeunload | 충족 | memory = 늘 등록 · server = 변경 없음 미등록, 변경·실패·STALE 등록 · unmount 해제 |
| (참고) E-AC-08 | 부분 | `saveStatusText` 문구 전이·평상시 저장 status 변화 0은 훅 테스트로 확인. 편집기 화면 배치는 a2 |

## 결정 · 목업/SPEC과 다르게 한 곳
- 저장소 주입 = `ProjectsPage({ repository, now? })` prop — Context 파일은 쓰기 범위 밖.
- `defaultProjectName`: 제목+접미사가 40자를 넘으면 제목을 잘라 접미사 보존(SPEC 미규정, 1~40 규칙과 모순 방지).
- 긴 이름 정책: 목록·편집기 빈 상태 h1은 자르지 않고 줄바꿈(전역 `base.css` `keep-all` + `overflow-wrap:anywhere` 상속, 클래스 추가 없음). 툴바 한 줄 말줄임 + `title`은 a2 몫(J-S08).
- 이름 저장 실패 `role=alert`는 그 줄 입력 아래(SPEC 위치 미규정). 행동 접근 이름 = `aria-label="{이름} 편집기 열기/프로필 보기/이름 바꾸기"`.
- 상대 시각: 목록 "방금 전·N분·N시간·N일 전"(렌더 시 계산), 저장 상태 "방금(<5초)·N초·N분·N시간 전".
- 스케줄러: 저장 중 타이머가 끝나면 저장 끝나는 즉시 1회 더 · 실패 중 변경은 "저장하지 못했습니다" 유지 · `STALE_DOC` → 자동 저장 정지, `resume()`으로 재개(해결 UI는 a2).
- 계측 `project_renamed` 미구현(범위 밖).

## a1-β로 넘길 연결 지점
1. `app/routes.tsx`: `/projects` lazy 라우트(`ProjectsPage`) · `/studio/:projectId` · `/studio`·`/profile` → `/projects` `Navigate replace` · 문서 제목 "프로젝트".
2. 저장소 공급: `ProjectRepository` 메모리 구현을 `createStudioStore`(`data/studioStore.ts`·`memoryStudio.ts`)에 추가 + Context/`AppProviders` 연결. `ProjectsPage`에는 **안정된 인스턴스**를 넘길 것(식별자가 바뀌면 다시 조회).
3. `RouteErrorBoundary` 아래에 둘 것(J-S03 — 조회 실패는 `useThrowToBoundary`).
4. GNB "프로젝트"·"새 프로젝트"(`components/layout/AppHeader`), `aria-current` 규칙(12.1).
5. `test/renderApp.tsx`에 프로젝트 저장소 인자·lazy 모듈 선로드 추가, 가드 개정(`noHardcodedStyle` 대상 자동 포함 확인, 12.4 깨질 테스트 목록).
6. 편집기(a2): `useAutosaveScheduler({ save, persistence })`·`saveStatusText`·`saveAnnouncement` 연결, `StudioProjectNotFound`/`StudioNoDoc`를 E-S02/E-S03에 사용.

## 차단 · 미실행
- **Codex 검증: BLOCKED** — 브리프 "외부 접근 금지"가 전역 지침(Codex 필수)보다 우선이라 실행하지 않음. 대신 메인이 diff 직접 검토(스케줄러 stale/offline/연속 실패 경로, 이름 바꾸기 포커스·연타·STALE 경로). 병합 전 `/codex:review --scope branch --base c39c265` 권장.
- 브라우저 [Q] 검증(J-AC-10 5폭) — 라우트 미연결이라 생략(브리프 허용).
