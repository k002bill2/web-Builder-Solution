# RS6-L1 QA BRIEF — 저장 코어 포트·코어 이식 독립 검증 (QA)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
대상: 이 워크트리 `k002bill2/rs6-l1-port` (tip `e62b02fb`, base `0c196b81`). Developer 보고 `dev/active/rs6-l1-port/REPORT.md`·`HARNESS-MAP.md`.
변경(앱): `app/src/features/studio/save/{saveCore,coreIo,testRig}.ts` + 테스트 5파일, `app/src/data/{memoryDocBook,memoryProjectRepository}.ts`, `app/src/data/persistence/localSync.ts`, `app/scripts/{m2cBaseline.json,bundleBudget.test.mjs}`.
정본: `docs/design/restart/INTEGRATE-6.md` r1(2.2-2·4·5절 G1·D6-3·D6-10·RS6-AC), `docs/04-plan/RS6_INTEGRATE_PLAN.md` 2절, ADR-004 개정 17, 하네스 `dev/active/save-core-{harness,fix,qa,final-qa}/`.

## 검증 항목
1. **동작 변화 0(편집기 미배선 확인)**: 이 레인은 편집기 배선이 없어야 한다. `useDocSave`·`StudioLayout`·`studioRepository` diff 0, 기존 저장 경로(`saveDoc`→DocBook→flush)가 그대로인지 코드로 판정. 레지스트리·`idle()` 대기가 기존 `kept`/`confirmDoc` flush 경로에 넣은 변화(G1 chain 대기)가 **코어가 없을 때** 지연·동작 변화를 만들지 않는지(코어 없음 = 즉시 통과인지) 확인.
2. **AC 검출력(변이, 임시)** — 매번 `git checkout -- app/`로 복원:
   - U14: G1 chain 대기(`idle()` 대기) 제거 → U14 테스트 FAIL
   - U15: 포트 이미지 키에서 projectId 제거(로컬 id만) → U15 FAIL
   - U10: cleared 판정 제거 → U10 FAIL
   - G2: `saveCore.ts`에 `../../data/persistence/...` 값 import 추가 → 가드 FAIL
   - 엄격 이미지: 바인딩/재읽기 확인을 건너뛰게 → images 테스트 FAIL
3. **하네스 대응표 검토**: `HARNESS-MAP.md` ② 잠금 기반 대체 6건·③ 폐기 1건의 사유가 D6-3 등 근거와 맞는지, PARTIAL 3건(#9·#28·#32)이 위험한지(손실 경로 여부) 판정. 원본 하네스 테스트를 읽기만.
4. **REPORT 7절 "하네스·설계와 다르게 한 것"** 각 행의 위험 판정 — 특히 memory 모드 savedMark 전진, CE-2 얕은 사본(엔진 문서 불변 전제가 코드상 성립하는지), discard 진입이 connect await 뒤(경쟁 save가 `rejected{inflight}`로 안전한지 — 가능하면 임시 테스트로 확인 후 삭제).
5. **실브라우저(Ego Lite, 짧게 — 회귀 확인)**: `npm run build` + `npx vite preview --host 127.0.0.1 --port 4373 --strictPort`(포트 비었는지 확인). 카탈로그→프로필→3안→편집 시작→편집·"이 브라우저에 저장됨"→새로고침 복원→스냅샷 만들기·삭제→`/projects`. 콘솔·네트워크 오류 0. 이 레인은 편집기 배선이 없으므로 기존 동작과 같아야 한다. 끝나면 IDB 삭제·`finish({keep:[]})`·`listTaskSpaces()`·서버 종료·리슨 0. 영환님 창·main 5480 무접촉. 막히면 BLOCKED.
6. **fresh 게이트**: `npm run typecheck`·`lint`·`npm test -- --run`(기대 322/2902)·`npm run build`(번들 표 REPORT 4절과 대조, 개정 17 상한 안). 기존 테스트 파일 수정·삭제 0(`git diff 0c196b81 --name-status -- app/` 중 기존 테스트 파일 M/D 확인).

## 제외
- 앱·테스트 수정 커밋 금지(변이·임시 테스트는 되돌림). push·원격 쓰기·다른 워크트리 접촉·Codex 금지.

## 산출물
- `dev/active/rs6-l1-port/QA-REPORT.md`: 0. 판정(PASS / PASS with notes / FAIL) 1. 변이 표 2. 동작 변화 판정 3. 대응표·차이 검토(심각도) 4. 실화면 5. 게이트 6. 사실/추정/미확인
- `dev/active/rs6-l1-port/QA-PROGRESS.md`. 로컬 커밋은 이 두 파일·`qa-shots/`만(명시 경로).
- 첫 3턴 QA-BRIEF·QA-PROGRESS 커밋. 45턴부터 새 확인 중단 → 정리·REPORT. 최대 55턴.
서브에이전트 분할: 권장(읽기 전용 1개 — 3·4절 대응표·차이 검토 ∥ 메인 변이·브라우저). 변이·통합은 메인.
