# M4-b-2 BRIEF — React zip 내보내기 구현 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18 (자동 진행 — REACTZIP-SPEC r1 + 7a)
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/m4b-impl` (base origin/main `631190c7`). node_modules 설치 완료.
정본: `docs/design/m4b/REACTZIP-SPEC.md` r1 + **7a 결정**(RZQ ★ 전부, RZQ-10 = 로컬 Linux 컨테이너) · ADR-004 개정 20 · 스파이크 `dev/active/m4b-spike/{REPORT.md,patches/,raw/}` · EXPORT-SPEC r1.

## 단계 (TDD, 단계마다 커밋)
- **E0 예산 관문(먼저)**: 버튼 + `exportFlow` `retryableImport` 슬롯(RZQ-02 A)만 넣고 실측. `/studio` 정규화 ≤ **128.83** · 복원 ≤ **131.81**(개정 20) · 다른 라우트 증분 0. 넘으면 감량 1회 → 그래도 넘으면 구현하지 말고 멈추고 보고. 진입 정적 포함 0 검사기 가드(SPEC 5.4) 추가.
- **E1 생성기**: `features/studio/reactZip/` — 킷 원문 `?raw` 동봉(테스트 제외) · 템플릿(package.json 9개 버전 고정·engines·scripts) · `site.json` v1(`ExportDoc`, RZQ-13 A) · 이미지 `img-NN` 치환(RZQ-05 A) · 글꼴 서브셋 재사용 · 메뉴 닫기 리스너(4.3) · Q6 A body 값 · 허용표 `checkReactZipEntries`(2.4) · 파일 이름 `_react.zip`.
- **E2 lock**: docker `node:22` 컨테이너(로컬 docker 29.8 가용)에서 `npm install`로 `package-lock.json` 생성 → 생성기 상수로 고정 + 대조 테스트(RZ-AC-17). 생성 명령·Node/npm 버전 로그.
- **E3 충실도**: 오프라인 SSR 대조(RZQ-12 A, 30개 변형 전부 — SPEC 4.1 정규화 ①②③만) + 단위 테스트(SPEC 5.2).
- **E4 빌드·실화면**: 산출 zip을 저장소 밖 임시 디렉터리에서 **docker `node:22`로 `npm ci && npm run build` exit 0**(+ 가능하면 `node:20.19`) — RZ-AC-C1을 로컬 Linux 컨테이너 실측으로 판정(windows·macOS는 [미확인], 7a). Ego Lite 1회(preview `--port 4399 --strictPort`, 이미지 있는 문서 · 1280·390, override·차단은 같은 스크립트 안): 버튼 → 성공 → zip 내려받기. preview 종료·리슨 0.
- **문구**: [문안 미정] 키는 `reactZipText.ts`(가칭) 한 파일의 자리 상수로 두고 `// TODO(copy)` 표시 — Hemingway 문안은 Jarvis가 나중에 반영한다. 문구 단언은 키 존재·자리만.
- 마감: fresh typecheck·lint·test·build · Codex adversarial 1회(`--scope branch --base 631190c7`, `--help` 금지) · 반영 1회 · REPORT(RZ-AC 판정표·예산 표·SHA).

## 규칙
- 쓰기 경로: `features/studio/**`(export·reactZip)·관련 테스트·`scripts/check-bundle-size.mjs`(가드만)·기준선 2파일(판정선 안 실측일 때만)·`dev/active/m4b-impl/`. 킷·렌더·엔진·저장 코어 0(킷 DOM 변경이 필요하면 멈추고 보고). **앱 새 의존성 0**(산출 package.json·lock은 문자열). 단언 약화·skip 0.
- 명시 경로 커밋, push 0. 첫 2턴 BRIEF·PROGRESS 커밋, E0 뒤 REPORT 초안. 임시 빌드는 `$TMPDIR`. 서브에이전트는 읽기 전용 조사 2개까지. 마감 전 `git status --short` 빈 값. **최대 120턴, 105턴부터 마감.**
