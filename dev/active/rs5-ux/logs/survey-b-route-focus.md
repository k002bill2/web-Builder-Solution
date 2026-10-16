# 조사 B — 라우트·포커스·이탈 보호·반응형 (code-explorer, 읽기 전용, 27 tool)
경로 기준 app/src/. 메인이 사용한 핵심 사실 압축.

- 라우터: BrowserRouter + useRoutes(data router 아님, 번들 이유) (main.tsx:55-57, app/routes.tsx:15-18,43-45). useBlocker/usePrompt/popstate/pagehide 0건.
- 앱 안 링크: StudioLayout onClickCapture가 a[href] 클릭을 가로채 leave() 저장 대기, 실패면 이동 보류, 수정키 클릭 통과 (components/studio/StudioLayout.tsx:127-148). POP·주소 입력은 가로채지 않음.
- beforeunload: useAutosaveScheduler.ts:283-292 1곳, needsUnloadGuard(:66-70), preventDefault + returnValue="" — 문구 없음(브라우저 기본).
- 포커스: 전역 RouteFocus 없음[추정], SkipLinks + main#main-content tabIndex=-1 (AppLayout.tsx:17). 편집기 h1 tabIndex=-1(StudioToolbar.tsx:25-37), focusHeading 진입 state일 때만 h1 포커스(StudioLayout.tsx:108-112). 대화상자 닫힘 후 opener.focus (StudioLayout.tsx:188-197, ProjectsPage.tsx:86,225,239).
- 단축키: Ctrl/⌘+Z·Shift+Ctrl/⌘+Z·Ctrl+Y만 (features/studio/historyKeys.ts:9-20). Cmd+S 가로채기 0.
- 반응형: layoutMode.ts WIDE (min-width:80rem)=1280 3단 · SPLIT (min-width:64rem)=1024 2단 · 미만 tabs(390) (features/studio/layoutMode.ts:4,10-11,21-24). 배치마다 트리 별도, 모드 변경 시 하위 재마운트(StudioLayout.tsx:86-92).
- 저장 상태 위치: ≥1024 툴바 h1 옆, <1024 h1 아래 subline(ps-10) (StudioLayout.tsx:431, StudioToolbar.tsx:22,40,42). 툴바 flex-wrap, 상태 글자 자르지 않음(E-S33). tabs 알림 영역은 탭 목록 아래(StudioLayout.tsx:441).
- /projects 행: 폭 분기 없이 세로 3줄(이름 h2 / 프로필·상태 글자·시각 / 행동) (components/projects/ProjectRow.tsx:37-72). 행동 순서 "편집기 열기"·"프로필 보기"·"이름 바꾸기"·"파일로 내보내기"·"삭제", aria-label에 이름 포함.
- 마운트: StudioPage가 key={projectId}로 lazy StudioLayout (pages/StudioPage.tsx:12-13,28-42). RouteErrorBoundary resetKey=pathname. 프로필 편집 시작/restart는 navigate로 새 마운트. 스냅샷 복원은 편집기 안(재마운트 없음 [추정]).
- 이미지 ingest: busy 표시 "이미지를 준비하고 있습니다…" + announce, 2초 넘으면 "큰 이미지라 시간이 걸리고 있습니다", 패널 닫힘·스위치 끄면 진행 작업 버림 (components/studio/ImageSlotField.tsx:39-41,63-99,246,282).
- SPEC-4 UX(r0.1, 미재검토): 폐기 확인 role=alertdialog "확인되지 않은 변경 버리기", 첫 포커스 "취소", 위험 버튼 "버리고 새로고침" (SPEC-4.md:267-272) · /projects 행 PendingStart "저장 다시 시도", PendingRecord "저장 확인", 성공 status 후 포커스 "편집기 열기" (SPEC-4.md:241-249) · CP4 편집기 인계 "브라우저 저장을 확인하지 못했습니다"+"저장 확인" (:251-260) · beforeunload 한계 (:277-285) · 상태 바뀌어도 포커스 주 버튼 유지, aria-busy+aria-disabled (:234).
- E-S09 정본: docs/design/2a-05/SPEC.md:156 (Callout "내 편집으로 저장"/"다른 편집 불러오기", 자동 저장 멈춤, alert 1회). editor-rest/SPEC.md:32 메모리 저장소 resolveConflict missing → "일부, 도달 불가".
