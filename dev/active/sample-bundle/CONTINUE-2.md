# SAMPLE-BUNDLE CONTINUE-2 — 샘플 묶음 테스트 마감 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-25
같은 worktree·브랜치 `k002bill2/sample-bundle` · HEAD `d08e22f2`. `npm ci` 다시 하지 말 것. 기존 커밋 되돌리지 말 것.
쓰기 경로 = `app/src/**/*.test.ts(x)` + `dev/active/sample-bundle/`만. **제품 코드 변경 0**(테스트가 결함을 찾으면 고치지 말고 REPORT에 기록 — 변이 확인용 임시 수정은 반드시 원복).

## Jarvis가 이미 확인한 것 (다시 하지 말 것)
- 게이트(d08e22f2 직전, Jarvis 재실행): typecheck 0 · lint 0 · vitest 387 files / 3483 passed · build 0(개정 23 기준선 128.84·131.84 반영 후 `logs/bundle-3.txt` 통과).
- `chunkRetryWiring.test.ts` reco 기대값 3→2 되돌림 = Jarvis 수정(recoApplyLoader는 이번 변경 대상 아님).

## 항목 (우선순위 순, 각 끝에 커밋)
1. **SMP-AC-A01 컴포넌트 테스트**: `/studio` 내보내기 영역에서 "디자인 샘플 내려받기" 1회 클릭 → 다운로드(내려받기 링크 또는 기존 ExportFlow 테스트가 쓰는 다운로드 단언 방식) 1회 · 결과 zip 엔트리 이름 5개(`design.png`·`design.html`·`design-tokens.json`·`sections.json`·`README.txt`). PNG 캡처는 기존 테스트 하네스의 가짜 캡처/DEFAULT_DEPS 대체 방식을 따른다(기존 PngSave·exportFlow 테스트 참고).
2. **순서·차단 단언**: 내보내기 영역 순서 = PNG 영역 → 샘플 묶음 → HTML 1개 → 정적 zip → React zip(SMP-AC-A06 숨김 0 포함) · 게이트 차단 문서에서 샘플 묶음 버튼도 다른 형식과 같은 방식으로 차단 · 읽기 전용 탭 refused 경로 1건(기존 `exportFlowReadonly.test.ts` 패턴).
3. **변이 확인(사후 작성 직렬화기 테스트 보강)**: `sampleJson.ts`에 변이 3종을 임시로 넣어 각각 테스트가 FAIL하는지 확인 후 원복 — M1 키 순서 바꿈 · M2 `instanceId` 포함 · M3 `cssVars`에서 키 1개 누락. 생존 변이가 있으면 그 변이를 잡는 단언을 추가. 결과 표를 REPORT에.

## 마감
- `npx vitest run --maxWorkers=2; echo EXIT=$?` 결과 끝을 `logs/gates-3.txt`에(typecheck·lint도 각 `; echo EXIT=$?`). build는 Jarvis가 재실행하므로 생략 가능.
- REPORT.md에 "CONTINUE-2" 절(AC 표 갱신 · 변이 표). PROGRESS 갱신. `git status --short` 빈 값 + `git diff d08e22f2 -- app/src ':!*.test.ts' ':!*.test.tsx'` 빈 값 확인.

## 규칙
- git 원격 명령 금지 · amend·rebase 금지 · 서브에이전트 금지. 실행 상한 약 15분. 최대 70턴.
