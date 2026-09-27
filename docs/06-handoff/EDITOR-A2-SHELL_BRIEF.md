# EDITOR-A2-SHELL — a2 화면 틀·캔버스 레인 (A2-S) Developer 브리프 **발행본**

> 발행: Jarvis, 2026-09-27 · 영환님 ★A. 작업 공간 `editor-a2-shell`(브랜치 `k002bill2/editor-a2-shell`, base main `f22bbc8`). 포트 **4337**. 병렬 레인 A2-F(`editor-a2-fields`)와 **파일이 겹치지 않는다** — `components/studio/{FieldEditor,PageInfoFields,SaveStatus,ConflictCallout}.tsx` · `features/studio/{useDocSave,fieldCounter,leaveGuard}.ts` · `useAutosaveScheduler.ts` · `saveStatusText.ts`는 **F 소유라 이 레인은 쓰지 않는다**(필드 자리는 빈 슬롯/자리표시로 둔다).

## 목표
`/studio/:projectId`가 문서가 있을 때 E-S05 기본 편집 틀(툴바·섹션 줄·구조 캔버스·편집 패널 자리·반응형 탭)을 그리고, QA가 찾은 결함 D1~D3(`docs/qa/a2-data-flow/REPORT.md`)을 닫는다.

## 소유 파일
`pages/StudioPage.tsx`(이 레인만) · 새 `components/studio/{StudioToolbar,StudioLayout,SectionList,StructureCanvas,PreviewWidth,StudioTabs}.tsx` · 새 `features/studio/{useStudioDoc,selection,layoutMode}.ts` 및 각 테스트. `components/layout/AppLayout.tsx` 수정 금지. `features/profile/CandidateCard.tsx`의 `Wireframe`은 import만(모양 변경이 필요하면 멈추고 보고).

## 체크포인트 (순서대로, 끝날 때마다 커밋)
- **S0** base build 실측 → `logs/base-build.txt` 커밋.
- **S1 문서 분기 + D1~D3** (가장 먼저, 이것만으로도 병합 가치가 있게):
  - D1: `StudioPage.tsx`가 `hasDoc`일 때 E-S03(`StudioNoDoc`)이 아니라 편집 틀(S2 전까지는 최소 틀: h1 + 툴바 + 섹션 목록)을 그린다. `useStudioDoc`로 `getDoc` 결과를 쓴다. 문서 없으면 기존 E-S03 그대로(E-AC-02 유지).
  - D2: 이동 state `editNotice`(`projectRepository.ts` `StudioEntryState`)를 `role=status` "편집 알림" 영역 1개(E-AC-33, `display:none` 아님)에 **1회** 보이고 state를 비운다. **경쟁 금지**: state 비우기에 `navigate(현재 경로, {replace})`를 쓰지 않는다(C6가 이 패턴 때문에 되돌려졌다 — `dev/active/editor-a2-data/REPORT.md` 9절). `window.history.replaceState`로 `usr`만 비우거나 마운트 시 1회 읽어 ref에 담는 방식. 새로고침·다시 열기에는 알리지 않는다(SPEC 8.2.1 (a)).
  - D3: 편집 시작으로 도착하면 포커스를 h1(`tabIndex=-1`)로 옮긴다. 포커스가 `body`에 남지 않게.
  - RED→GREEN 테스트: 문서 있음 → E-S03 문구 없음 · editNotice 1회 표시 후 재렌더에도 1회 · 포커스 = h1. **이 테스트 파일을 전체 vitest에서 3회 반복해도 통과**(`npx vitest run <파일> --repeat 2` 또는 3회 실행 로그).
- **S2 집중 모드 툴바** E-AC-03(주 메뉴 `nav` 없음 · `header` 1개 · "프로젝트로 돌아가기" → `/projects` · `document.title` "<이름> 편집").
- **S3 3단 배치·제목 구조** E-AC-04 · E-AC-13(1280·1920 3단, 1024 2단 `Select`+`details`, 768·390 탭 3개, Tab 순서 = SPEC 4.3).
- **S4 섹션 선택** E-AC-05(선택 → `aria-current`·편집 h2·캔버스 라벨 칩 동기, 포커스 이동 없음, 캔버스 섹션은 Tab 정지 아님).
- **S5 탭** E-AC-14(`tablist`/`tab`/`tabpanel`, ←/→ · Home/End, 자동 활성, 선택·입력 유지).
- **S6 미리보기 폭·캔버스** E-AC-15(`previewView.ts` 상수 import, "축소 보기 · N%") · E-AC-16(캡션 늘 보임, hex 0, 외부 URL 0, opacity 글자 0).
- 턴이 모자라면 S1을 반드시 끝내고, S2~S6 중 끝낸 것만 REPORT에 PASS, 나머지는 "미착수"로 적는다.

## 공통 규칙 (두 레인 동일)
- 상위 문서: `docs/06-handoff/EDITOR-A2_BRIEF.draft.md` 4~10절(레인 표·파일 지도·번들·금지·검증). **이 발행본이 초안과 다르면 이 문서가 우선.** 기준 SPEC `docs/design/2a-05/SPEC.md` r4.3 · `docs/design/2a-05/VARIANT-MAP.md`.
- 데이터 계층은 main에 병합 완료(`dd62865`): `getDoc`·`saveDoc`(E-AC-11 멱등 포함)·`startDoc`·engine import 가드(허용: `pages/StudioPage.tsx` · `components/studio/**` · `features/studio/**` · `data/startDocWrite.ts`)·CSS 가드(`@source not "./engine"`). 기록 `dev/active/editor-a2-data/REPORT.md`.
- **TDD**: RED 로그(`logs/<단계>-red.txt`) → GREEN. 기존 테스트 단언 약화 금지. `design/`·`docs/design/`·`engine/**`(import만) 수정 금지. 새 의존성·새 아이콘 금지.
- **번들(ADR-004 100/125 gzip)**: 체크포인트 커밋마다 `npm run build`로 상시 판정. 편집기는 lazy 라우트라 **`/studio/:projectId` 외 모든 화면·공통 변화 0**이 원칙. 어느 화면이든 여유 0.3KB 미만이 되면 그 커밋을 남기고 즉시 중지·REPORT. 예산 변경 금지. 현재 `/studio` 첫 90.73 · 진입 104.33 · `/profile` 진입 124.69(여유 0.31) · `/catalog` 첫 99.65(0.35).
- 목업 우선순위: 기능 → 사용성(접근성·반응형·상태) → 디자인 시스템 일관성 → 목업(ADR-003). 토큰만, hex·px 하드코딩 금지. APFS 로고·`--apfs-*` 금지.
- 실행: 서버는 127.0.0.1 지정 포트만, 끝나면 자기 PID만 종료하고 `lsof -nP -iTCP:<포트> -sTCP:LISTEN` 빈 출력을 REPORT에. **긴 클릭 흐름 검증은 하지 않는다**(병합 뒤 QA 몫) — 필요하면 캡처 1~2장만.
- **서브에이전트 금지**(rate limit 이력). 로컬 커밋 `git commit -- <경로>`만. push·병합·삭제 금지.
- 진행 기록 `dev/active/editor-a2-shell/PROGRESS.md`(체크포인트마다 갱신) · `REPORT.md`(SHA·파일·AC별 판정·RED/GREEN 로그·번들 전후 표·남은 위험). **전체 vitest는 마지막에 1회**(`logs/full-vitest.txt`, 실패는 목록만). Codex 검증은 턴이 남을 때만 1회(`review --scope branch --base f22bbc8`), 없으면 "이관" 기록.
- 턴 운영: `--max-turns` 60 · **45턴부터 REPORT 우선**(부분 결과도 커밋). 한 턴에 여러 파일 쓰기·읽기를 묶어 턴을 아낀다. 체크포인트가 끝날 때마다 커밋해 끊겨도 이어받을 수 있게 한다.
