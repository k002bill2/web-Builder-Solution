# RS6-L3a BRIEF — 편집기 배선 전반부: 착수 조건 + 저장 경로 코어 전환 (Developer, 구현)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs6-l3-editor` (브랜치 `k002bill2/rs6-l3-editor`, base origin/main `0323c4a0` = L2 PR #19 머지). `app/node_modules` 설치 완료.
승인: MQ-6-1~5·7 A · ADR-004 개정 17. Designer 생략 사유: 상태·흐름 명세는 Designer 산출물 INTEGRATE-6 r1·UX-5에 있음 — 이 레인은 그 명세의 구현, 새 문구·화면 0.

## L3 분할 (Jarvis)
PLAN 4절 L3(CP1~CP4)는 한 레인 턴 예산을 넘을 위험이 커서 **둘로 나눈다(같은 파일을 쓰므로 순차)**.
- **L3a(이 레인)**: CP0 착수 조건 + PLAN L3 CP1·CP2 + 감시 결선 + reject 매핑.
- L3b(다음 레인): PLAN L3 CP3·CP4(충돌·복원·내보내기 코어 경유 · 링크 이탈 MQ-6-7 · StudioLeave 대응 · POP·재마운트 · S6c 제거 목록 · `LocalSync.base` 정리).

## 정본
- `docs/04-plan/RS6_INTEGRATE_PLAN.md` 4절 L3 표 CP1·CP2 · 레인 표 L3 쓰기 경로.
- `docs/design/restart/INTEGRATE-6.md` r1: 2.2-2 · 5절 G1·G2·G7 · 6.4(revision 올리는 쓰기 목록) · 9.2 · 11절(깨질 테스트 — RED 전 PROGRESS에 예상 delta) · RS6-AC-U2·U3·U6.
- L1·L2 결과: `dev/active/rs6-l1-port/{REPORT,QA-REPORT}.md`, `dev/active/rs6-l2-liveness/{REPORT,QA-REPORT}.md`(**4절 L3 전 조건 · QA 7절 L3에 넘길 것**).
- 측정 참고: `dev/active/rs6-l0-measure/patches/s6c.patch`·`dev/active/rs6-l0-slim/patches/s6c-slim.patch`(③ `latest` 제거 포함) — 참고만.

## 범위
- **CP0 착수 조건(L1 QA note 2 — 반드시 먼저)**: `restoreSnapshot`·`resolveConflict`·`startDoc(restart)`의 DocBook 직접 쓰기가 코어 revision 기준(`confirmed.revision + 1`)과 충돌하지 않게 한다 — 코어가 있는 프로젝트에서는 코어 `replace` 경유 또는 revision 기준을 코어와 맞춤(INTEGRATE-6 6.4·MQ-6-5 A 조합 규칙). RED: 코어 열린 상태에서 세 경로 각각 실행 뒤 다음 코어 save가 같은 revision으로 덮어쓰지 않음(STALE 또는 정상 다음 revision). 화면 호출처 연결은 L3b가 하더라도 **저장소·코어 층 규칙과 테스트는 여기서 닫는다**.
- **CP1 (PLAN L3 CP1)**: `change`마다 `core.edit` 1회 · dispose 뒤 디바운스 편집 보존(F9) · StrictMode 같은 토큰(U6) · `acquire`/`release` effect. **감시 결선**: `watchSaving(setState)` + dispose 때 `stop()`을 스케줄러 dispose와 함께(L2 QA 7절 2).
- **CP2 (PLAN L3 CP2)**: 저장 대상 = `core.save()` · DocBook 반영은 saved 뒤 · 실패 시 DocBook revision 변화 0(U3) · 재진입 seed = `view()`(거짓 STALE 0, C5 T2). `useDocSave` `latest` 정리(s6c-slim ③ 참고).
- **reject 매핑**: L2 QA-REPORT 4절 catch 위치 1~3 — `core.link` 경유 confirm·`core.discard()` reject(connect 실패·`head()`/`verify()` throw)를 이 레인이 만지는 호출처에서 결과로 매핑하거나 코어에서 흡수. 거짓 saved 0.
- **범위 밖(L3b)**: 링크 이탈 규칙 변경·`flushBeforeLeave`·`StudioLeave` 대응·POP·레이아웃 재마운트 U7·탭 수준 경고·스냅샷 복원/충돌 해결/내보내기 화면 호출처 전환·S6c 제거 목록·`LocalSync.base` 삭제. 문구 본문(L4)·`/projects`(L5).
- 기존 이탈 동작(`StudioLeave.test.tsx` 14건)은 이 레인에서 **그대로 GREEN**이어야 한다(규칙 변경은 L3b).

## 예산 (ADR-004 개정 17)
- CP마다 build 정규화·raw. 진입 증분이 생기면 그 커밋에서 `m2cBaseline.json` `normEagerKb`·`eagerKb` + `bundleBudget.test.mjs` 기대값을 실측으로 갱신, note "개정 17 배분 RS6-L3a".
- **raw가 130을 처음 넘는 커밋에서** `app/scripts/check-bundle-size.mjs` `/studio/:projectId` `eagerBudgetKb` 130 → **130.5** + 주석 "ADR-004 개정 17 결정 1·2 — RS6 몫"(개정 17 결정 2). 다른 한도 변경 0.
- 상한: 정규화 `/studio` 129.13 · 복원 132.11 · raw 130.5. 현재 128.63/131.61/129.95. **L3a 목표 ≤ +0.25(정규화)** — L3b·L4·L5 몫을 남긴다. 넘으면 감량 1회 → 상한 초과면 멈춤·수치 보고.

## 규칙
- TDD: CP마다 RED 예측(새 테스트 수 · 깨질 기존 테스트 = I6 11절 대조) → PROGRESS → RED 로그 `dev/active/rs6-l3a-editor/logs/` → GREEN 커밋. RED만 있는 tip 금지. 기존 단언 약화·skip 0. 11절 밖 기존 테스트가 깨지면 멈추고 보고. 11절 안이라도 바뀐 단언은 REPORT에 이전/이후 표.
- 레코드 형식·`StudioPersistence`·엔진/PageDoc·스키마·의존성 변경 0.
- **Ego Lite(짧게, 마지막에 1회)**: `npm run build` + `npx vite preview --host 127.0.0.1 --port 4375 --strictPort`(포트 확인). 편집→"이 브라우저에 저장됨"→새로고침 복원→스냅샷 복원·충돌 없는 일반 흐름→`/projects`. 콘솔·네트워크 오류 0. 끝나면 IDB 삭제·`finish({keep:[]})`·`listTaskSpaces()`·서버 종료·리슨 0. 영환님 창·main 5480 무접촉. 막히면 BLOCKED 기록.
- 서브에이전트 분할: 권장(읽기 전용 1개 — I6 11절 깨질 테스트 실제 목록·예상 delta 조사 ∥ 메인 CP0). 쓰기는 메인만.

## 마감
- fresh `typecheck`·`lint`·`npm test -- --run`(base 326/2924 + 증분)·`build`(전 라우트 번들 표).
- `dev/active/rs6-l3a-editor/{PROGRESS,REPORT}.md`: CP0~CP2 AC 판정 · 깨진/바뀐 기존 테스트 표 · reject 매핑 위치 · 감시 결선 실측 증분 · 예산 표 · **L3b 인계 목록** · 사실/추정/미확인.
- 명시 경로 커밋, amend·rebase 금지. push·merge·원격 쓰기·Codex·다른 워크트리 0.
- 첫 3턴 BRIEF·PROGRESS 커밋. CP0 30턴 전 · CP1 60턴 전 · 90턴부터 새 구현 중단 → Ego Lite·게이트·REPORT. 최대 110턴. 턴이 모자라면 마지막 완료 CP까지 커밋, 남은 것을 PROGRESS BLOCKED로.
