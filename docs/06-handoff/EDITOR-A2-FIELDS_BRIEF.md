# EDITOR-A2-FIELDS — a2 필드·저장 레인 (A2-F) Developer 브리프 **발행본**

> 발행: Jarvis, 2026-09-27 · 영환님 ★A. 작업 공간 `editor-a2-fields`(브랜치 `k002bill2/editor-a2-fields`, base main `f22bbc8`). 포트 **4339**. 병렬 레인 A2-S(`editor-a2-shell`)와 **파일이 겹치지 않는다** — **`pages/StudioPage.tsx`는 건드리지 않는다**(S 소유). `StudioToolbar`·`StudioLayout`·`SectionList`·`StructureCanvas`·`PreviewWidth`·`StudioTabs`·`useStudioDoc`·`selection`·`layoutMode`도 S 소유라 쓰지 않는다. 화면 연결은 S 병합 뒤 별도 커밋(Jarvis 지시)으로 한다.

## 목표
편집 패널의 필드 입력과 자동 저장·저장 상태·충돌 처리를 **부품과 훅으로** 만든다. 저장소는 실제 `memoryProjectRepository`의 `saveDoc`을 쓰되, 테스트는 목 저장소/가짜 타이머로 검증한다.

## 소유 파일
새 `components/studio/{FieldEditor,PageInfoFields,SaveStatus,ConflictCallout}.tsx` · 새 `features/studio/{useDocSave,fieldCounter,leaveGuard}.ts` 및 각 테스트 · 기존 `features/studio/useAutosaveScheduler.ts`·`saveStatusText.ts`(a1-α — 수정이 필요할 때만, 기존 테스트 단언 유지).

## 체크포인트 (순서대로, 끝날 때마다 커밋)
- **F0** base build 실측 → `logs/base-build.txt` 커밋. 먼저 `useAutosaveScheduler.ts`·`saveStatusText.ts`·SPEC 5.10·6.3을 읽고 이미 있는 것을 다시 만들지 않는다.
- **F1 필드 카운터** E-AC-06(`fieldCounter` + `FieldEditor`: 카운터 `aria-describedby`, 권장 초과 경고, 상한 초과 `aria-invalid` + "…내보내기를 막습니다 (R-13)", **상한 + 10자까지 입력 가능**, 캔버스 문제 문장 id를 `aria-describedby`에 받을 수 있는 prop). 필드 정의(상한·권장)는 engine 섹션 정의에서 import(허용 경로).
- **F2 자동 저장 훅** E-AC-07(`useDocSave`: 2초 debounce · 30초 maxWait · 저장 중 변경은 끝난 뒤 1회) — `useAutosaveScheduler` 재사용.
- **F3 저장 상태** E-AC-08(`SaveStatus`: "저장 전 변경 있음 → 저장 중… → 이 탭에 저장됨 · N초 전", 상대 시각은 라이브 영역 밖, 평상시 저장으로 status 글자 변화 0) · E-AC-09(실패 `role=alert` 1회 · 입력 유지 · "다시 저장" → "다시 저장했습니다" · offline/online).
- **F4 충돌** E-AC-10(`STALE_DOC` → `ConflictCallout` + 두 버튼, 고르기 전 자동 저장 0회). 스냅샷 API가 저장소에 없으면 **새로 만들지 말고** 스냅샷 부분만 BLOCKED로 기록(a4 범위일 수 있음 — SPEC 근거 인용).
- **F5 떠남 가드** E-AC-12(`leaveGuard`: `persistence="memory"`면 늘 등록, `"server"` 목이면 변경 없음일 때 미등록·변경/실패/STALE 때 등록).
- **F6 페이지 정보 필드** `PageInfoFields`(SPEC에 정의된 범위만).
- 턴이 모자라면 F1~F3을 우선 끝내고, 끝낸 것만 PASS, 나머지는 "미착수"로 적는다.

## 공통 규칙 (두 레인 동일)
- 상위 문서: `docs/06-handoff/EDITOR-A2_BRIEF.draft.md` 4~10절(레인 표·파일 지도·번들·금지·검증). **이 발행본이 초안과 다르면 이 문서가 우선.** 기준 SPEC `docs/design/2a-05/SPEC.md` r4.3 · `docs/design/2a-05/VARIANT-MAP.md`.
- 데이터 계층은 main에 병합 완료(`dd62865`): `getDoc`·`saveDoc`(E-AC-11 멱등 포함)·`startDoc`·engine import 가드(허용: `pages/StudioPage.tsx` · `components/studio/**` · `features/studio/**` · `data/startDocWrite.ts`)·CSS 가드(`@source not "./engine"`). 기록 `dev/active/editor-a2-data/REPORT.md`.
- **TDD**: RED 로그(`logs/<단계>-red.txt`) → GREEN. 기존 테스트 단언 약화 금지. `design/`·`docs/design/`·`engine/**`(import만) 수정 금지. 새 의존성·새 아이콘 금지.
- **번들(ADR-004 100/125 gzip)**: 체크포인트 커밋마다 `npm run build`로 상시 판정. 편집기는 lazy 라우트라 **`/studio/:projectId` 외 모든 화면·공통 변화 0**이 원칙. 어느 화면이든 여유 0.3KB 미만이 되면 그 커밋을 남기고 즉시 중지·REPORT. 예산 변경 금지. 현재 `/studio` 첫 90.73 · 진입 104.33 · `/profile` 진입 124.69(여유 0.31) · `/catalog` 첫 99.65(0.35).
- 목업 우선순위: 기능 → 사용성(접근성·반응형·상태) → 디자인 시스템 일관성 → 목업(ADR-003). 토큰만, hex·px 하드코딩 금지. APFS 로고·`--apfs-*` 금지.
- 실행: 서버는 127.0.0.1 지정 포트만, 끝나면 자기 PID만 종료하고 `lsof -nP -iTCP:<포트> -sTCP:LISTEN` 빈 출력을 REPORT에. **긴 클릭 흐름 검증은 하지 않는다**(병합 뒤 QA 몫) — 필요하면 캡처 1~2장만.
- **서브에이전트 금지**(rate limit 이력). 로컬 커밋 `git commit -- <경로>`만. push·병합·삭제 금지.
- 진행 기록 `dev/active/editor-a2-fields/PROGRESS.md`(체크포인트마다 갱신) · `REPORT.md`(SHA·파일·AC별 판정·RED/GREEN 로그·번들 전후 표·남은 위험). **전체 vitest는 마지막에 1회**(`logs/full-vitest.txt`, 실패는 목록만). Codex 검증은 턴이 남을 때만 1회(`review --scope branch --base f22bbc8`), 없으면 "이관" 기록.
- 턴 운영: `--max-turns` 60 · **45턴부터 REPORT 우선**(부분 결과도 커밋). 한 턴에 여러 파일 쓰기·읽기를 묶어 턴을 아낀다. 체크포인트가 끝날 때마다 커밋해 끊겨도 이어받을 수 있게 한다.
