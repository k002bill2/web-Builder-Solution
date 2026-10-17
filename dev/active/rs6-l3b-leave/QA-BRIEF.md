# RS6-L3b QA BRIEF — 링크 이탈 규칙(MQ-6-7 A) · 상쇄 독립 검증 (QA)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
대상: 이 워크트리 `k002bill2/rs6-l3b-leave` (tip `0c842581`, base `860d530d`). Developer 보고 `dev/active/rs6-l3b-leave/REPORT.md`.
정본: `docs/design/restart/INTEGRATE-6.md` r1 3.1(1 save 주체 · 2 경고 소유 · 3 예외 순서 · 4 StudioLeave 14건 표) · D6-9·D6-11 · RS6-AC-U7·U11·U12·U13, MQ-6-7 A, ADR-004 개정 17.

## 이 레인은 사용자 보장(이탈 저장 대기)을 바꿨다 — 데이터 손실 관점 최우선
1. **손실 경로 표(main `860d530d` 대비)** — 코드 추적 + 임시 테스트(삭제) + 실화면:
   - 디바운스 중 링크 이탈 → 즉시 이동 → lease 해제 save가 실제로 IDB까지 가는지. 이동 직후 **탭 닫기·새로고침**에서 레지스트리 경고가 뜨는지(합성 beforeunload `defaultPrevented`), 커밋 뒤 꺼지는지.
   - 해제 save **실패**(quota·readonly 전환·오프라인) 뒤: 사용자가 실패를 알 수단이 있는지(편집기 밖) · 경고가 계속 켜지는지 · 재진입 시 dirty로 이어지는지. 알 수단이 없으면 L5 범위로 분류하되 심각도 기록.
   - POP·재마운트(U7) · 저장 진행 중 + 추가 편집 이탈(U11).
   - 예외 순서(I6 3.1-3): readonly·unsupported 이동 / failed·offline·stale·cleared 보류 — 각각 실제 코어 경로 테스트가 있는지.
   - 편집기 훅 beforeunload 제거(감량) 뒤 **편집기 안에 머무는 동안** 새로고침 경고가 여전히 뜨는지(레지스트리가 대신하는지) — 핵심.
2. **StudioLeave 14건 표 대조**: REPORT 2절 각 행이 I6 3.1-4 표(유지 7·의미 변경 6·이전 1)와 일치하는지, "유지" 행의 단언이 문자 그대로인지(`git diff 860d530d -- app/src/components/studio/StudioLeave.test.tsx`), 의미 변경 행이 약화가 아닌지.
3. **CP-A 상쇄 검증**: 폴백 제거가 제품 경로에 영향 0인지 · `testing/coreFixture.ts`(가짜 포트 commit = stub saveDoc)가 실제 코어 계약과 어긋나 테스트를 과하게 통과시키지 않는지(가짜 포트가 실패·STALE·지연을 표현하는지) · 4절 표의 바뀐 단언 각각 약화 여부 판정.
4. **변이(임시, 매번 `git checkout -- app/`)**: lease 해제 save 제거 · 레지스트리 경고 판정 제거 · 예외 순서 ②③ 분기 제거 · 재마운트 시 새 코어 생성 · `SaveResult.revision` 좁힘 제거 → 각 FAIL.
5. **Ego Lite(필수)**: build + `npx vite preview --host 127.0.0.1 --port 4378 --strictPort`(포트 확인). 경로 A 편집기 → (a) 편집 직후 링크 → 즉시 이동 → `/projects`에서 합성 beforeunload true → 몇 초 뒤 false · IDB 마지막 편집 (b) 편집기 안에서 편집 직후 합성 beforeunload true (c) 편집 → 뒤로 → `/projects` 경고 → 앞으로 재진입 제목 유지 (d) 이미지 1장 교체·즉시 이탈·재진입 이미지 복원 (e) 스냅샷 복원 · 내보내기 전 저장. 콘솔·네트워크 오류. 끝나면 IDB 삭제·`finish({keep:[]})`·`listTaskSpaces()`·서버 종료·리슨 0. 영환님 창·main 5480 무접촉.
6. **fresh 게이트**: `typecheck`·`lint`·`npm test -- --run`(기대 331/2953)·`build`(129.03/130.36 · 복원 132.01/133.39, 개정 17 상한 안).

## 판정 기준
- main 대비 **새 손실 경로**(경고 없이 편집이 사라지는 경로)가 생기면 FAIL. 경고는 있으나 실패 표시가 편집기 밖에 없어 L5에서 닫히는 것은 PASS with notes + 심각도.

## 제외
- 앱·테스트 수정 커밋 금지. push·원격 쓰기·다른 워크트리·Codex 금지.

## 산출물
- `dev/active/rs6-l3b-leave/QA-REPORT.md`: 0. 판정 1. 손실 경로 표 2. StudioLeave 대조 3. 상쇄·픽스처 판정 4. 변이 표 5. 실화면 6. 게이트 7. 사실/추정/미확인 · L4/L5 조건
- `QA-PROGRESS.md`. 로컬 커밋은 이 두 파일·`qa-shots/`·fixture만(명시 경로).
- 첫 3턴 QA-BRIEF·QA-PROGRESS 커밋. 50턴부터 마감. 최대 60턴.
서브에이전트 분할: 권장(읽기 전용 1개 — 2·3절 표 대조 ∥ 메인 손실 경로·변이·브라우저).
