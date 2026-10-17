# RS6-L3b BRIEF — 편집기 배선 후반부: 상쇄 먼저 → 링크 이탈(MQ-6-7) · POP · 화면 호출처 (Developer, 구현)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs6-l3b-leave` (브랜치 `k002bill2/rs6-l3b-leave`, base origin/main `860d530d` = L3a PR #20 머지). `app/node_modules` 설치 완료.
승인: MQ-6-1~5·7 A(6-7 A = lease 해제 save 1회 + 링크 저장 대기 제거 + 탭 수준 경고 · 예외: 클릭 시점 readonly·unsupported = 이동 / failed·offline·stale·cleared = 보류 + 지금 `leave()` · SPEC-4 RS4-AC-06을 D6-11로 대체) · ADR-004 개정 17. Designer 생략 사유: 동작 규칙은 INTEGRATE-6 r1 3.1·D6-9·D6-11에 명세됨, 새 화면·문구 0(문구는 L4).

## 정본
- `docs/04-plan/RS6_INTEGRATE_PLAN.md` 4절 L3 표 **CP3·CP4** · 레인 표 L3 쓰기 경로.
- `docs/design/restart/INTEGRATE-6.md` r1 **3.1(1 save 주체 · 2 경고 소유 = 레지스트리 · 3 예외 순서 고정 · 4 StudioLeave 14건 표 = 유지 7·의미 변경 6·이전 1)** · 6.4 · 7절 · 12절 · D6-9·D6-11 · RS6-AC-U7·U11·U12·U13.
- L3a: `dev/active/rs6-l3a-editor/REPORT.md` 8절 인계 1~8 · `QA-REPORT.md` 3절(폴백·미검증) · 7절 L3b 조건 1~5.
- S6c 제거 목록: `dev/active/rs6-l0-measure/REPORT.md` 3절(파일:행 고정 — 상쇄 인정 조건).

## 예산 — 이 레인의 가장 큰 제약
- 현재 `/studio` 정규화 **129.04** / 상한 129.13(여유 **0.09**) · 복원 132.03/132.11 · raw 130.39/130.5. L4(문구·충돌 UI)·L5(`/projects`)도 남아 있다.
- **CP-A(상쇄)를 기능 추가 전에 먼저 한다**:
  1. `useDocSave` 코어 없는 폴백(saveDoc 경로 · `latest` · 사유 문장 readonly 판정) 제거 — 제품 도달 불가(L3a QA 3절 L1 판정). 폴백으로만 GREEN인 테스트(StudioLeave · SnapshotImages · SnapshotFlow · FieldUndo · UndoKeys 등 `openStudio.stubProjectRepository` 사용처)를 **코어 있는 저장소(테스트 장치)로 이전**하고 단언은 유지. 의미가 MQ-6-7로 바뀌는 StudioLeave 행은 INTEGRATE-6 3.1-4 표대로 이전/교체(표에 없는 단언 변경 금지).
  2. S6c 제거 목록(L0 REPORT 3절) 적용 · `LocalSync.base`·DocBook `base` 우회 삭제 — 목록과 다르게 지우면 그 차이와 실측을 REPORT에.
  3. 상쇄 실측을 CP-A 커밋에 기록(정규화·raw·복원). **기준선 파일은 실측으로 내려 기록**(개정 17 결정 2 — 실측 갱신).
- 이후 기능 CP마다 build 실측. **L3b 종료 시 누적이 129.04 이하**를 목표(=상쇄분 안에서 기능 추가). 상한 129.13 초과 시 감량 1회 → 그래도 넘으면 멈추고 수치 보고(새 상향 요청은 Jarvis가 영환님께).

## 범위 (CP-A 다음)
- **CP-B (PLAN CP3)**: 화면 호출처 전환 — `SnapshotPreview` adopt · `ConflictCallout` resolve · `useExportFlow` 저장 먼저 = `core.save()` · `restartFlow` confirmDoc/startDoc → 결과(`STALE_DOC` = 미저장/진행 중)를 기존 안내로 매핑(새 문장 0, 필요한 문장은 키만 남기고 L4로). `core.link` confirm·`core.discard()` reject 매핑(L2 QA 4절 1·2). dirty면 복원 거절 안내. 코어 경로 `conflict.latest` 출처(L3a 인계 4) — 기존 단언 2건(`useDocSave.test.tsx:212`·`StudioLayout.test.tsx:157`)을 같은 의미로 교체. `replace` 결선 시 rebase 뒤 epoch +1 단언 추가(L3a QA M2b 생존 해소). `SaveResult.revision` 사용을 `not-persistent`로 좁힘.
- **CP-C (PLAN CP4 · MQ-6-7 A)**: lease 해제 save 1회(링크·POP·재마운트 공통, 대기 없음) · 링크 저장 대기 제거(예외 규칙 = I6 3.1-3 순서) · 탭 수준 `beforeunload` = 레지스트리 소유(코어 dirty·inflight) · 레이아웃 재마운트 같은 코어(U7) · POP 재진입 상태 이어짐(C5 T1) · 디바운스 대기 중 이탈 = 이동 + IDB 마지막 편집 + `/projects`에서 탭 닫기 경고 on(U12) · StudioLeave 대응(U13). L3a 인계 2(restart `STALE_DOC` 문구 불일치)가 이걸로 사라지는지 확인.
- 범위 밖: 문구 본문·폐기/충돌 대화상자 UI(L4) · `/projects` 행 표시(L5) · 편집 틀 이미지 맵 cleanup 삭제는 바이트가 줄면 CP-A에 포함 가능, 아니면 REPORT 인계.

## 규칙
- TDD: CP마다 RED 예측 → PROGRESS → RED 로그 `dev/active/rs6-l3b-leave/logs/` → GREEN 커밋. RED만 있는 tip 금지. 기존 단언 약화·skip 0 — 바뀐/이전한 단언은 REPORT에 이전/이후 표(I6 3.1-4 근거 열 필수).
- 레코드 형식·`StudioPersistence`·엔진/PageDoc·스키마·의존성 변경 0.
- **Ego Lite(마지막 1회, 필수)**: build + `npx vite preview --host 127.0.0.1 --port 4377 --strictPort`(포트 확인). 편집 직후(2초 안) 링크 이탈 → 즉시 이동 + `/projects` 진입 후 IDB 마지막 편집 · POP(뒤로) 직후 `/projects`에서 탭 닫기 경고(합성 beforeunload `defaultPrevented`) · 재진입 상태 · 스냅샷 복원·내보내기 전 저장 · 이미지 1장 저장·복원. 콘솔·네트워크 오류. 끝나면 IDB 삭제·`finish({keep:[]})`·`listTaskSpaces()`·서버 종료·리슨 0. 영환님 창·main 5480 무접촉.
- 서브에이전트 분할: 권장(쓰기 1개 `isolation: worktree` — CP-A 테스트 픽스처 이전(테스트 파일만) ∥ 메인 폴백·S6c 제거). 같은 파일 동시 편집 금지. 통합·게이트는 메인.

## 마감
- fresh `typecheck`·`lint`·`npm test -- --run`(base 330/2945 ± 이전 증감 설명)·`build`(전 라우트 표).
- `dev/active/rs6-l3b-leave/{PROGRESS,REPORT}.md`: CP별 AC 판정(U7·U11·U12·U13 + 인계 항목) · StudioLeave 14건 이전/이후 표 · 상쇄 실측 · 예산 표 · L4·L5 인계 · 사실/추정/미확인.
- 명시 경로 커밋, amend·rebase 금지. push·merge·원격 쓰기·Codex·다른 워크트리 0.
- 첫 3턴 BRIEF·PROGRESS 커밋. CP-A 40턴 전 · CP-B 75턴 전 · 105턴부터 새 구현 중단 → Ego Lite·게이트·REPORT. 최대 120턴. 턴 부족 시 마지막 완료 CP까지 커밋·남은 것 BLOCKED.
