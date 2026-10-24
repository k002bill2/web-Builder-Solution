# SAMPLE-BUNDLE BRIEF — 경로 A 디자인 샘플 묶음 구현 1차 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-25 (영환님 "★" — MQ-SMP 01~08 전부 ★)
worktree `~/orca/workspaces/web-builder-solution/sample-bundle` · 브랜치 `k002bill2/sample-bundle` · base `ee4f12ea`(main `1fffe049` + SAMPLE-SPEC r0 + THREAT-MODEL r0 + MQ.md, PR #70 대기 중).
쓰기 경로 = `app/` + `dev/active/sample-bundle/`만. **docs/·ADR·BACKLOG·SAMPLE-SPEC 수정 금지**(ADR-004 개정 문안은 Jarvis가 쓴다 — 실측값만 REPORT에).

## 0. 준비 (2턴 안)
- 정본 읽기: `docs/design/sample/SAMPLE-SPEC.md` 1·2·3·5절 · `docs/design/sample/MQ.md` · `docs/security/extract/THREAT-MODEL.md` 4절·BL-4 행.
- `cd app && npm ci`(이 레인 안에서, `package-lock.json` 변경 커밋 금지). npm-cache EPERM이면 sandbox 끄고 재시도.
- BRIEF·PROGRESS(`dev/active/sample-bundle/PROGRESS.md`) 커밋.

## 1. 항목 1 — BL-4 + 순수 직렬화기 (TDD, RED→GREEN)
1. **BL-4**: `app/src/render/protocol.ts:70` `isCssValue`가 함수 표기를 거부하도록 강화 — 최소 `url(`·`image-set(`·`expression(`·`/*`·`\`(이미 거부)·`@`. 팔레트 값은 지금 앱이 실제로 쓰는 형식(hex·`rgb(...)` 등 — 현행 픽스처·`tokens.ts:11` `rgb(255 255 255)` 확인)을 깨지 않게: **허용 함수 목록(rgb/rgba/hsl/hsla/var?)만 통과, 그 외 `ident(` 전부 거부**. 악성 값 픽스처(`url(https://x)`·`red;}</style><script>`·`expression(`·`image-set(`·`/* */`) → 렌더 메시지 검증 거부 단위 테스트. 기존 테스트 전부 GREEN 유지.
2. **`design-tokens.json` 직렬화기**: SAMPLE-SPEC 2.1 스키마(`$schema: "design-sample/tokens@0"`)대로 `KitTokenInput`(+ `PageDoc`의 source·섹션 motion)에서 순수 함수로 생성. 새 값 계산 금지 — `kitVars()`(`kit/tokens.ts`) 재사용. 같은 입력 = 같은 문자열(키 순서 고정·2칸 들여쓰기·끝 개행). px 단위 0(SMP-AC-A03). `source.kind:"internal"`만(경로 B 키 없음).
3. **`sections.json` 직렬화기**: `PageDoc.sections` 순서·type·variant·tone·motion만. 슬롯 값(글·이미지)·instanceId 0(SMP-AC-A04).
- 위치 권고: `app/src/features/studio/sample/`(신규). **조작 뒤 청크 전용** — 진입 청크에서 정적 import 금지.
- 테스트: SMP-AC-A02·A03·A04 각 1개 이상 + BL-4 픽스처. 항목 끝에 커밋.

## 2. 항목 2 — 샘플 묶음 zip + 버튼 + 순서
1. **묶음 zip**: "디자인 샘플 내려받기" = zip 1개 = 시안 PNG(현재 미리보기 폭) + 시안 HTML 1개(기존 `staticHtml` 단일 HTML 생성기) + `design-tokens.json` + `sections.json` + `README.txt`(내용: 묶음 구성 설명 3~5줄, "Example" 아님 — 실제 파일 목록). 기존 `features/studio/zip/storeZip.ts` 재사용. 파일명 `{이름}_r{rev}_sample.zip`(`staticHtml/exportFileName.ts` 규칙에 함수 추가).
   - 게이트: HTML이 들어가므로 기존 내보내기 게이트·폴백 차단과 같은 규칙을 따른다(같은 `requestExport` 계열 경로 재사용 — 새 차단 규칙 만들지 말 것). 실패·재시도·포커스는 기존 내보내기 공용 경로를 따른다.
2. **순서(MQ-SMP-03 A)**: 내보내기 영역 = **PNG → 디자인 샘플 묶음 → HTML 1개 → 정적 zip → React zip**. `StudioLayout.tsx` 블록 이동 · `ExportButtons.tsx` FORMATS 순서. 기존 버튼 **숨김·삭제 0**(SMP-AC-A06). 라벨 문구 교체(C1~C9)는 **이번 범위 밖** — 다음 레인.
3. **번들 실측(SMP-AC-A07)**: `npm run build` → `check-bundle-size.mjs` 출력 원문을 `dev/active/sample-bundle/logs/bundle.txt`에 저장. `/studio` 정규화·복원 진입 실측과 기준선(128.79·131.79) 대비 증분을 REPORT 첫 표에. MQ-SMP-07 A: **증분 ≤ +0.05면 통과로 기록**(판정선 초과로 스크립트가 실패해도 증분이 +0.05 안이면 멈추지 말고 수치만 기록 — Jarvis가 ADR-004 개정 23으로 기준선 갱신). +0.05 초과면 감량 1회(정적 import 제거·문자열 축소) 뒤 재측정, 그래도 초과면 수치와 원인 청크를 기록하고 마감.
- 테스트: SMP-AC-A01(다운로드 호출 1회·zip 엔트리 목록 5개) · 순서 단언 · 기존 ExportFlow 계열 회귀 GREEN. 항목 끝에 커밋.

## 3. 마감
- 완료 게이트(`app/`): `npm run typecheck; echo EXIT=$?` · `npm run lint; echo EXIT=$?` · `npx vitest run --maxWorkers=2; echo EXIT=$?` · `npm run build; echo EXIT=$?` — 출력 끝을 `logs/gates.txt`에.
- REPORT.md: 첫 줄 결론 · 번들 표 · AC별 PASS/FAIL · 변경 파일 · 남은 일.
- `git status --short` 빈 값(package-lock 변경은 되돌림). 경로 명시 커밋.

## 4. 규칙
- **git push·pull·fetch 등 원격 명령 일절 금지.** amend·rebase 금지.
- **서브에이전트 금지**(시간 상한). Codex 리뷰 불필요(Jarvis가 별도).
- 설계 판단이 필요하면 SAMPLE-SPEC ★ 따르고 REPORT에 기록 — 멈추지 말 것.
- 실행 상한 약 15분. 항목 1 → 2 순서, 각 항목 끝에 커밋. 남으면 PROGRESS·REPORT에 남은 범위 명시 후 마감. 최대 100턴.
