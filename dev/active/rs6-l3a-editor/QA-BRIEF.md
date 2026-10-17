# RS6-L3a QA BRIEF — 편집기 배선 전반부 독립 검증 (QA)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
대상: 이 워크트리 `k002bill2/rs6-l3-editor` (tip `e0f19594`, base `0323c4a0`). Developer 보고 `dev/active/rs6-l3a-editor/REPORT.md`.
변경(앱): `useDocSave.ts`·`useAutosaveScheduler.ts`·`studioRepository.ts`·`memoryDocBook.ts`·`memoryProjectRepository.ts`·`save/{coreIo,saveCore,liveness}.ts` + 테스트 4파일, 예산 파일 3개(`check-bundle-size.mjs` raw 130→130.5 포함).
정본: `docs/design/restart/INTEGRATE-6.md` r1(2.2-2·5절 G1·G2·G7·6.4·RS6-AC-U2·U3·U6), ADR-004 개정 17, L2 QA-REPORT 4절·7절.

## 이번 레인이 처음으로 실제 사용자 저장 경로를 코어로 바꿨다 — 데이터 손실 관점이 최우선
1. **손실 경로 판정(코드 추적 + 임시 테스트, 삭제)**:
   - 디바운스 중 앱 안 링크 이탈 · POP · 새로고침 각각에서 마지막 편집이 IDB에 남는지 / 남지 않으면 경고가 있는지. REPORT 8절 1은 "이탈 저장 주체 없음 — L3b"라고 한다. **L3a 머지만으로 기존(main) 대비 손실 경로가 새로 생기는지**가 핵심 판정: 기존 `flushBeforeLeave`·`leave()`가 코어 경로에서도 실제로 `core.save()`를 내고 기다리는지(`StudioLeave` 14건이 mock 폴백으로만 GREEN인 점에 주의 — 실제 코어 경로에서 같은 계약이 성립하는지 임시 테스트로 확인).
   - 새 이미지 편집 저장(이미지 맵 바인딩 수정 `45831121`)이 실제 IDB에 Blob까지 남는지. 이미지 업로드는 Developer가 브라우저로 안 봤다 → **Ego Lite에서 이미지 1장 업로드·저장·새로고침 복원 필수**.
   - CP0 rebase: 스냅샷 복원·충돌 해결 뒤 편집·저장·새로고침에서 revision 덮어쓰기 0.
2. **변이(임시, 매번 `git checkout -- app/`)**: CP0 dirty 거절 제거 · rebase epoch/savedMark 갱신 제거 · `core.edit` 호출 제거 · lease 즉시 release · 이미지 맵 합치기 제거 · `watchSaving` stop 제거 → 각 테스트 FAIL 확인.
3. **폴백 이중 경로 위험**: 코어 없는 폴백(saveDoc)이 제품에서 실제로 도달 불가인지(`repository.core` 항상 존재 — local·memory 둘 다) 코드로 판정. 테스트가 폴백으로만 검증하는 기존 계약 목록(ImageUndo·StudioLayoutImages·SnapshotImages·StudioPage·StudioLeave) — 그 계약이 코어 경로에서 미검증인 범위를 표로.
4. **계약 변경 2건 판정**: `DISCARD_GIVE_UP_MS` 위치 이동(시간 상수 2곳 분산) · `SaveResult` failed에 `revision` 선택 필드 — 다른 소비자 영향.
5. **Ego Lite(필수)**: `npm run build` + `npx vite preview --host 127.0.0.1 --port 4376 --strictPort`(포트 확인). 경로 A로 편집기 → 제목 편집·저장 → **이미지 1장 교체(자체 fixture)·저장** → 새로고침 복원(제목·이미지) → 스냅샷 저장·복원·복원 뒤 편집·새로고침 → 편집 직후(2초 안) 앱 안 링크로 `/projects` → 다시 열어 마지막 편집 유지 여부 기록(결과 그대로, 결함이면 심각도). 콘솔·네트워크 오류. 끝나면 IDB 삭제·`finish({keep:[]})`·`listTaskSpaces()`·서버 종료·리슨 0. 영환님 창·main 5480 무접촉.
6. **fresh 게이트**: `typecheck`·`lint`·`npm test -- --run`(기대 330/2945)·`build`(129.04/130.39 · 복원 132.03/133.42, 개정 17 상한 안 · raw 판정선 130.5 변경이 개정 17 결정 2와 일치).

## 제외
- 앱·테스트 수정 커밋 금지. push·원격 쓰기·다른 워크트리·Codex 금지.

## 산출물
- `dev/active/rs6-l3a-editor/QA-REPORT.md`: 0. 판정(PASS / PASS with notes / FAIL — **main 대비 새 손실 경로가 있으면 FAIL**) 1. 손실 경로 표 2. 변이 표 3. 폴백·미검증 범위 4. 계약 변경 판정 5. 실화면 6. 게이트 7. 사실/추정/미확인 · L3b 조건
- `QA-PROGRESS.md`. 로컬 커밋은 이 두 파일·`qa-shots/`·fixture만(명시 경로).
- 첫 3턴 QA-BRIEF·QA-PROGRESS 커밋. 50턴부터 마감. 최대 60턴.
서브에이전트 분할: 권장(읽기 전용 1개 — 3절 폴백·미검증 범위 표 ∥ 메인 손실 경로·변이·브라우저).
