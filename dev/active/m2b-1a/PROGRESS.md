# M2B-1a PROGRESS — hero 5변형 실렌더 (split · center · grid · text · image)

## 수신 기록
- 2026-10-04 21:15 KST 수신. 브리프 `docs/06-handoff/M2B-1_BOUND-VARIANTS_BRIEF.md` 전체(49행) — 레인 **M2B-1a (hero 5)**.
- 정본 `docs/design/m2b/SPEC-BOUND.md` 0절 · B-4~B-8 · KB-AC-10~22 · 30~35(hero 몫) · QB-5~9·12·13 · Jarvis 결정 기록 읽음.
- 시작 커밋 `f113f2c` (브랜치 `k002bill2/m2b-1a`, worktree `orca/workspaces/web-builder-solution/m2b-1a`).
- 서브에이전트 금지 · 포트 4337(보조 4339) · 로컬 커밋만(`git commit -- <경로>`) · push·병합·삭제 없음.
- 범위 밖: header·footer · D-1 `heroTop`(1b).
- 기준선(HEAD f113f2c `npm run build`): 렌더 JS 80.12 / CSS 6.32 · `/studio` 진입 127.38 · 첫 화면 91.78 · 공통 89.35 · /catalog 99.65/102.04 · /references 97.00/99.38 · /compare 98.83/121.70 · /profile 99.61/118.66 · /projects 94.02/100.29.

## 단계
- [x] P0 수신 · REPORT 골격 · gate.sh 커밋 (56f0083)
- [x] P1 예산 선행 실측(grid 시제품) — 렌더 JS +0.17 · CSS +0.18 · /studio +0.01 → 끝 예상 렌더 JS 80.97 · /studio +0.03(문자열 5개 알파벳순 직접 실측 127.41 · 정밀 +35바이트, 경계 — 정정 기록 logs/p1-budget.txt 끝) → 멈춤 조건 아님 (logs/p1-budget.txt)
- [x] P2 hero/split (KB-AC-10~12 [U]) — kit/heroCopy(공유 카피 블록, HeroFullbleedLeft도 사용) · HeroSplit · kit.css 톤 공통 + split · RENDERED_VARIANTS 알파벳순 · RED logs/p2-split-red.txt(5 실패: 킷 미등록) → gate OK(렌더 JS 80.29 · CSS 6.45 · /studio 127.40)
- [x] P3 hero/center (KB-AC-13 [U] · 14 규칙) — HeroCenter(카피 클래스 = fullbleed 패널 묶음 PRIMARY_COPY 재사용) · RED logs/p3-center-red.txt(4 실패) → gate OK(렌더 JS 80.33 · CSS 6.49 · /studio 127.41)
- [ ] P4 hero/grid (KB-AC-15~17)
- [ ] P5 hero/text (KB-AC-18~19)
- [ ] P6 hero/image (KB-AC-20~22)
- [ ] P7 공통 [U]/[G] (KB-AC-30 · 33 · 35 정적 HTML 몫)
- [ ] P8 REPORT 갱신(브라우저 전) → 브라우저 [B]/[V] 4337: QB-5~9·12·13 1280·768·390 · KB-AC-31·34·35
- [ ] P9 Codex review --scope branch --base f113f2c 1회 · P1만 수정
- [ ] P10 REPORT 마감 · 서버 종료 · lsof 4337·4339 = 0

## 서브에이전트
- 사용 0 (브리프 금지)

## 메모
