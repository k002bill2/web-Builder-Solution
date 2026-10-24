# SAMPLE-COPY BRIEF — 경로 A 구축·발행 문구 정리 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-25 (영환님 "진행")
worktree `~/orca/workspaces/web-builder-solution/sample-copy` · 브랜치 `k002bill2/sample-copy` · base main `8b1b8c6e`(PR #71 샘플 묶음 포함).
쓰기 경로 = `app/` + `dev/active/sample-copy/`만. docs·ADR·BACKLOG·SAMPLE-SPEC 수정 금지.

## 0. 준비
- 정본: `docs/design/sample/SAMPLE-SPEC.md` **3.1절 표 C1~C10**(파일:줄·제안 문구·함께 바꿀 테스트) · `docs/design/sample/MQ.md` MQ-SMP-04 A · ADR-009 1절 6(금지 카피: 홈페이지 만들기·발행·호스팅·바로 운영).
- `cd app && npm ci`(lock 변경 커밋 금지). BRIEF·PROGRESS(`dev/active/sample-copy/PROGRESS.md`) 커밋.
- 줄 번호는 PR #71 이후 바뀌었을 수 있다 — 문자열로 다시 찾을 것.

## Jarvis 결정 (★) — 묻지 말고 이대로
- C1~C9는 SAMPLE-SPEC 3.1 "제안 문구" 그대로. C10("사이트 목적")은 **유지**.
- C3 스냅샷 종류 "게시" → "확정"(kind 값 `published`는 그대로 — 표시 글자만).
- C8: `## 사이트 코드` 섹션 이름은 `reactZip/checkReactZipEntries.ts` LICENSE_SECTIONS(런타임 검사기)와 **같은 커밋에서 동시** 변경. "배포용 파일" → "빌드용 파일".
- C9(MQ-SMP-04 A 승인됨): `zip/licenses.ts` "사이트 파일" → "샘플 파일", "사이트를 만든 사용자" → "샘플을 만든 사용자". 권리 의미(권한·책임 주체)는 바꾸지 않는다. 문안 해시·스냅샷 테스트가 있으면 같은 커밋에서 갱신.
- 정적 HTML 1개 결과 줄의 3MB 안내("…정적 사이트(zip)는 이미지를 파일로 나눠 담습니다")도 C4 새 이름("HTML 샘플 묶음(zip)")에 맞춤(C6).
- 사용자 노출 문구만 바꾼다. 식별자·파일명 규칙·포맷 키(`static-zip` 등)·주석은 그대로.

## 항목 (각 끝에 커밋)
1. **C1~C9 교체** + 각 행 "함께 바꿀 테스트" 갱신. 관련 테스트 파일만 먼저 돌려 GREEN.
2. **SMP-AC-A05 가드 테스트**(`app/src/test/` 또는 기존 문구 가드 위치): `app/src` 사용자 노출 문자열(*.ts·*.tsx, 테스트·주석 제외)에 "발행"·"정적 사이트"·"게시" 0건 · `RouteErrorBoundary`의 "배포되었을 수 있으니"(앱 자체 배포)는 허용 목록. 가드가 실제로 잡는지 변이 1회(문구 하나 되돌려 FAIL 확인 후 원복) — 결과 REPORT에.
3. **번들**: `npm run build` → `logs/bundle.txt`. `/studio` 정규화·복원 진입 판정 통과(기준선 128.84·131.84 + 0.03 안), 다른 라우트(`/compare`·`/catalog`·`/profile`) 실패 0. 초과면 원인 문구를 줄여 재측정, 그래도 초과면 수치 기록 후 마감(기준선 변경 금지).

## 마감
- 게이트(`app/`, 각 `; echo EXIT=$?`): typecheck · lint · `npx vitest run --maxWorkers=2`(실패 시 `grep -E "FAIL|×"`로 **이름까지** 기록) · build → `logs/gates.txt`.
- REPORT.md: 첫 줄 결론 · C1~C9 전/후 표(파일·문구) · 가드 변이 결과 · 번들 표 · 남은 일. `git status --short` 빈 값.

## 규칙
- git 원격 명령 금지 · amend·rebase 금지 · 서브에이전트 금지. 실행 상한 약 15분, 항목 1→2→3. 남으면 PROGRESS·REPORT에 남은 범위 명시 후 마감. 최대 90턴.
