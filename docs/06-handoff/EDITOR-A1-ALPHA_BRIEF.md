# EDITOR-A1-ALPHA — 편집기 선행 부품 (프로젝트 목록 · 저장 상태 · 자동 저장 스케줄러)

## 책임/목표
- 책임 Developer / 실행 Orca + Claude Code. 보고 대상 Jarvis. 기준 main `184f92f`. 작업 공간 `editor-a1-alpha`.
- 사용자 요청: 편집기 기능 페이지 개발 + 가능한 병렬 작업. 편집기 본체(a2~a4)는 선행 조건(a1-β 라우트·가드 개정, 와이어프레임 렌더러, Q-17/19/21 결정)이 남아 있어 **지금은 선행 부품만** 만든다. 동시에 `profile-v2-compact` 레인이 ProfilePage를 수정 중이다.
- 설계 기준: `docs/design/2a-05/SPEC.md`(r3-2) 2.1~2.5, 3.2, 5.10, 8.3, 11.1(J-AC), 11.2 중 E-AC-01·02·07·09·12. Designer 파일지도: `docs/06-handoff/visual-v2-input/REPORT.md` 3절, `IMPLEMENTATION-HANDOFF.md` 레인 B. SPEC 재설계 금지.

## 쓰기 범위 (전부 새 파일, `app/src/` 아래)
- `data/projectRepository.ts` — SPEC 8.3 인터페이스·오류 코드만(문서 타입은 제네릭/`unknown`, **engine import 0**, `import type` 포함 금지 — `engineImportGuard`가 막는다).
- `domain/projectName.ts` — 이름 규칙·정규화·검증.
- `features/projects/{projectListView,useProjectList,renameDraft}.ts`
- `components/projects/{ProjectList,ProjectRow,RenameField}.tsx`, `pages/ProjectsPage.tsx` — **라우트 연결하지 않는다**(a1-β 몫). 테스트에서 목 저장소 주입으로 렌더.
- `components/studio/StudioEmptyStates.tsx`, `features/studio/{saveStatusText,useAutosaveScheduler}.ts` — 자동 저장: 2초 디바운스·최대 30초·저장 중 변경 합치기·online/offline·beforeunload, 문서 `T` 제네릭.
- 각 `*.test.ts(x)` + `dev/active/editor-a1-alpha/`.

## 금지
- `engine/**`, `app/routes.tsx`, `components/layout/*`, `data/studioStore.ts`·`data/memoryStudio.ts`, `app/AppProviders.tsx`, `features/compare/*`, `data/memoryBoardConfirm.ts`, `pages/ProfilePage.tsx`·`features/profile/*`·`components/profile/*`, 3안 UI 컴포넌트, `domain/generation.ts`·`profileDraft.ts`, 번들 스크립트, 가드 테스트. `design/`·`docs/design/` 수정 금지. 새 의존성·아이콘 금지. 기존 파일 수정이 필요하면 멈추고 이유를 REPORT에.
- Q-17~24 결정·addSection 인자 변경 금지(미승인).

## 수용
- J-AC-02·03·08·10, E-AC-01·02·07·09·12를 TDD RED→GREEN으로(RED 로그 보존). 가짜 타이머로 스케줄러 경계(2s/30s/합치기/오프라인 복귀/언로드 경고) 검증. UI는 목 저장소로 빈·로딩·오류·목록·이름 변경(유효성·중복·취소·Esc)·접근성(라벨·`aria-live` 저장 상태·포커스 복귀) 테스트.
- v2 디자인 언어·DS 컴포넌트·토큰만(하드코딩 가드 통과). 긴 이름 줄바꿈/말줄임 정책 명시.
- 라우트 미연결이므로 번들 영향 0이어야 한다: `npm run build` 전후 모든 라우트 수치 불변 확인.
- `npm run typecheck`·`npm run lint`·표적 테스트·`npm run build` 실행, 원본 로그+exit 보존. **전체 test suite는 이 레인에서 돌리지 않는다**(profile 레인 전담) — REPORT에 "전체 게이트는 병합 시" 명시.
- 라우트가 없으니 브라우저 캡처는 생략 가능. 대신 컴포넌트 렌더 테스트로 상태 검증.
- 서브에이전트 권장 2(프로젝트 목록 묶음 ∥ 자동 저장 스케줄러 묶음, 쓰기 worktree 격리). 통합·검증은 메인.
- 최대 70턴, 55턴부터 REPORT 우선. `git commit -- <경로>`, `git add -A` 금지. push·병합·삭제 금지. fable 파일 무접촉. 외부 접근 금지.
- REPORT: 로컬 SHA, 파일, 테스트 수, AC별 판정, 번들 불변 근거, a1-β로 넘길 연결 지점(라우트·store·가드 개정 목록).
