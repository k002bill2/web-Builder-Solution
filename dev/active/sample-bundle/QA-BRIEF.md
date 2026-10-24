# SAMPLE-BUNDLE QA BRIEF — 디자인 샘플 묶음 실화면 검증 (QA)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-25
같은 worktree `~/orca/workspaces/web-builder-solution/sample-bundle` · 브랜치 `k002bill2/sample-bundle` · HEAD `8aa8b7da`.
쓰기 경로 = `dev/active/sample-bundle/qa/`만. **앱 코드·테스트·docs 수정 금지**(결함은 재현 절차와 함께 보고만).

## 0. Jarvis가 이미 확인한 것 (다시 돌리지 말 것)
- 게이트 `logs/gates-5.txt`: typecheck 0 · lint 0 · vitest 389 files / 3487 passed · build 0 · `/studio` 정규화 128.84 · 복원 131.84(ADR-004 개정 23 기준선 그대로, 판정 통과).
- 단위·컴포넌트: SMP-AC-A01(zip 엔트리 5개 — 단, 가짜 PNG 캡처), 순서·숨김 0, 게이트 차단, 읽기 전용 refused, BL-4 악성 값 거부 — REPORT.md CONTINUE-2 절.
- 정본: `docs/design/sample/SAMPLE-SPEC.md` 2.1·2.3·5절 · `docs/design/sample/MQ.md`.

## 1. 실화면 1회 (최우선 — 브라우저 항목은 이것 하나)
- `cd app && npm run build && npx vite preview --port 4399 --strictPort`(시작 전 `lsof -nP -iTCP:4399 -sTCP:LISTEN` 기록, 점유면 4398). 브라우저는 **ego-browser만**(선례 `dev/active/release-check-live/scripts/r2a-A*.mjs`·`dev/active/qa02-edit-start/` — 새 TaskSpace, 앱 안 클릭으로만 이동, 네이티브 `<dialog>`는 `dialog[open]`으로 대기).
- 흐름: `/catalog` → 레퍼런스 1~3개 → 프로필 → 3안 → 한 안으로 편집 시작 → `/studio` "검사 · 내보내기" → 내보내기 영역 스크린샷(1280) → **"디자인 샘플 내려받기"** 클릭 → 다운로드 파일 확보.
- 확인(로그·스크린샷을 `qa/`에 tee):
  1. 내보내기 영역 실제 순서 = PNG → 디자인 샘플 내려받기 → HTML 1개 → 정적 zip → React zip, 숨김 0.
  2. 결과 줄 문구 "디자인 샘플 묶음(zip) · 파일 5개 · nMB", 콘솔 오류 0.
  3. zip sha256 · `unzip -l` 엔트리 5개(`design.png`·`design.html`·`design-tokens.json`·`sections.json`·`README.txt`).
  4. `design.png`가 실제 PNG(시그니처·가로 1280)이고 빈 이미지 아님(파일 크기·`sips -g pixelWidth -g pixelHeight`).
  5. `design-tokens.json` `$schema` = `design-sample/tokens@0`, px 0, `cssVars` 존재, `source.kind`="internal". `sections.json` 섹션 수 = 편집기 섹션 수, `instanceId`·슬롯 글자 0.
  6. `design.html`을 `file://`로 열어 렌더(빈 화면 아님) 스크린샷 1장.
- 25턴 안에 다운로드 확보 실패면 시도·오류를 로그로 남기고 BLOCKED.

## 2. 마감
- `qa/QA-REPORT.md`: 첫 줄 판정 PASS / PASS with notes / FAIL · 항목 1~6 결과표 · 결함(재현 절차) · 로그·스크린샷 경로.
- preview 종료 + 포트 LISTEN 0줄 기록 · ego-browser 탭 정리 · `qa/` 커밋 · `git status --short` 빈 값.

## 규칙
- git 원격 명령 금지 · 서브에이전트 금지 · 앱 코드 수정 금지. 실행 상한 약 15분. 최대 50턴.
