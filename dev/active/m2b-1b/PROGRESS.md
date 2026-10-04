# M2B-1b PROGRESS — header 3 + footer 3 실렌더 + D-1~D-3

## 수신 기록
- 2026-10-04 22:49 KST 수신. 브리프 `docs/06-handoff/M2B-1_BOUND-VARIANTS_BRIEF.md` 전체(49행) — 레인 **M2B-1b (header 3 + footer 3)**.
- 정본 `docs/design/m2b/SPEC-BOUND.md` 0절(D-1 heroTop · D-2 변형 클래스 · D-3 `:has()` 1줄) · B-1~B-3 · B-9~B-11 · KB-AC-01~09 · 23~29 · 30~35 · QB-1~4·10·11·13·14 · Jarvis 결정 기록(MQ-B1 겹침 없는 면 이음·비고정 · MQ-B5 `:has()` 1줄) 읽음.
- 참고: `dev/active/m2b-1a/REPORT.md` 4·7절(hero 맨 위 면 사실 — SPEC B-3 표와 같음 · /studio 여유 0 위험).
- 시작 커밋 `5970721` (브랜치 `k002bill2/m2b-1b`, worktree `orca/workspaces/web-builder-solution/m2b-1b`).
- 서브에이전트 금지 · 포트 4337(보조 4339) · 로컬 커밋만(`git commit -- <경로>`) · push·병합·삭제 없음.
- 기준선(HEAD 5970721 `npm run build`): 렌더 JS 80.50 / CSS 6.72 · `/studio` 진입 127.41 · 첫 화면 91.78 · 공통 89.35 · /catalog 99.65/102.04 · /references 97.00/99.39 · /compare 98.83/121.71 · /profile 99.61/118.67 · /projects 94.02/100.30.
- 한도: 렌더 JS ≤ 89.70 · `/studio` 진입 ±0.03(≤ 127.44) · 그 밖 ±0.03.

## 단계
- [x] P0 수신 · REPORT 골격 · gate.sh 커밋 (gate OK logs/p0-gate.txt)
- [x] P1 예산 선행 실측(sticky-two-tier 시제품) — 렌더 JS +0.15 · CSS +0.12 · /studio 0 → 끝 예상 렌더 JS 81.41 · /studio: 나열이면 +0.05(멈춤) / SECTION_LIBRARY 파생이면 −0.01 → 파생 채택(P8에서 전환), 멈춤 조건 아님 (logs/p1-budget.txt)
- [x] P2 D-1 heroTop (kitLinks) [U] — RED logs/p2-herotop-red.txt(4 실패) → gate OK(렌더 JS 80.59 · CSS 6.72 · /studio 127.41) · 전체 vitest 183 파일 1707 통과
- [x] P3 header/sticky-hamburger (KB-AC-03 [U] · 구조) + D-2 변형 클래스 — kit/headerParts(MenuList·MenuButton·Sheet, K1-1도 사용) · RED logs/p3-hamburger-red.txt(4 실패) → gate OK(렌더 JS 80.70 · CSS 6.80 · /studio 127.42 중간값) · 전체 vitest 184/1711 · 이관 1건(PageDocument 정확 목록 +1)
- [x] P4 header/sticky-two-tier (KB-AC-05 [U] · 구조 · D-3 [G]) + D-3 `:has()` 1줄 — RED logs/p4-two-tier-red.txt(6 실패) → gate OK(렌더 JS 80.79 · CSS 6.92 · /studio 127.44 중간값) · 전체 vitest 185/1717 · 이관 1건(정확 목록 +1). 테스트 자체 수정 2건(정규식·주석 제외 — 구현 전 RED와 같은 단언)
- [x] P5 header/transparent (KB-AC-07 [U] · 구조) — K1-1 마크업 재사용(면 클래스·data-surface만) · RED logs/p5-transparent-red.txt(3 실패) → gate OK · 전체 vitest 186/1720 · 이관 1건(정확 목록 +1)
- [x] P6 footer/biz-extended-map (KB-AC-23·25 [U] · 구조) — FooterBizExtended에 map 칸 인자(출력 불변) · RED logs/p6-map-red.txt(6 실패) → gate OK · 전체 vitest 187/1726(1회차 SectionRemove 1건 흔들림 → 단독 2회·전체 재실행 통과, 메모) · 이관 1건(정확 목록 +1)
- [x] P7 footer/minimal (KB-AC-26 [G] · 27 [U] · 구조) — FooterLinks 공유 · 면 = .kit-body(톤 없음 → bg · --kit-soft muted, 가드 K-AC-11·36 "muted 직접 글자 0" 유지) · RED logs/p7-minimal-red.txt(4 실패) → gate OK(렌더 JS 81.11 · CSS 7.10 · /studio 127.47 중간값) · 전체 vitest --maxWorkers=4 188/1730 (기본 병렬 1회차는 부하 84로 페이지 테스트 시간 초과 165건 + kitCommon 실제 실패 1건 → 위처럼 고침)
- [x] P8 footer/minimal-biz (KB-AC-28 [U]/[G] · 구조) + RENDERED_VARIANTS 라이브러리 파생 전환 — RED logs/p8-minimal-biz-red.txt(3 실패) → gate OK(렌더 JS 81.13 · CSS 7.12 · /studio 127.40 = 127,404 B, −10 B · 그 밖 ±0.01) · 전체 vitest 189/1733 · 이관 1건(정확 목록 +1)
- [x] P9 공통 [U]/[G] (KB-AC-30·32·33·35 · K-AC-04) — kit/boundVariants.test.tsx 5건. 구현 뒤 판정 테스트라 RED 대신 변이 검사 2건(클래스 바꿈 → KB-AC-35 실패, 되돌림 → 통과, logs/p9-mutation.txt) · gate OK
- [x] P10 브라우저 [B]/[V] — 판정 14 + QB-14 전부 PASS (logs/qb-judge.txt). KB-AC-34 1회차 FAIL = 판정 스크립트 결함 2(링 변수만 읽음 · 쉼표 선택자) → qb.mjs 고쳐 재판정 PASS, 코드 수정 0 · 캡처 45장 shots.sh(Chrome headless, ego 스크린샷 CDP 시간 초과) · QB-14 qb14.mjs
- [ ] P11 전체 `npx vitest run` 1회 exit 0 · Errors 0 (logs/full-vitest.txt) · 이관 표
- [ ] P12 Codex review --scope branch --base 5970721 1회 (P1만 수정)
- [ ] P13 REPORT 마감 · 서버 종료 · lsof 4337·4339 = 0

## 서브에이전트
- 사용 0 (브리프 금지)

## 메모
- P7: 시스템 load average 84(다른 세션) 때 기본 병렬 전체 vitest가 페이지 테스트 시간 초과로 대량 실패 — 이후 전체 실행은 `--maxWorkers=4`로.
- P6 전체 vitest 1회차: `components/studio/SectionRemove.test.tsx` E-AC-19 1건 실패 → 단독 2회 통과 · 전체 재실행 통과. 이 레인 변경과 무관(킷·렌더 문서 밖 편집기 테스트) — 부하 시 타이밍 흔들림으로 보고 REPORT 7절에 기록.
