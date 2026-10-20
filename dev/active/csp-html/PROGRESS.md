# CSP-1 PROGRESS — static-html 고정 CSP

base `ec32f407` · 브랜치 `k002bill2/csp-html` · 정본 `docs/design/csp/CSP-SPEC.md` r1 + 5a

## 체크리스트
- [x] 0. BRIEF·PROGRESS 커밋
- [x] 1. 정본 읽기(CSP-SPEC 1.1·2.1·3.1·4.1·4.3·4.4) + 대상 코드 위치 파악
- [x] 2. REPORT 초안
- [x] 3. RED — CSP-AC-01·03·04·05·06(html)·07(html)·08·10 단위 테스트
- [x] 4. GREEN — meta(charset 다음, CQ-01 A) · 메뉴 스크립트 해시 상수 + 대조 테스트(CQ-02 A)
- [x] 5. F-15 마크업 검사 개정 + 4.4 정본 문서
- [ ] 6. 게이트 typecheck·lint·test·build
- [ ] 7. /studio 진입·복원 증분 0 확인(렌더 JS·CSS 판정 불변)
- [ ] 8. 실화면 R1(1280·390 전·후 바이트 동일·위반 0)·R5(390 메뉴 시트 닫힘) — Ego Lite 1회, preview 4399 종료·리슨 0
- [ ] 9. Codex adversarial 1회 + 반영 1회
- [ ] 10. REPORT 마감 · `git status --short` 빈 값

## 로그
- R1 run(10:36 rate_limit 중단) 완료분: `0c379708` BRIEF·PROGRESS · `71e96df9` REPORT 초안 · `c1c8ba0a` AC-07 픽스처 · `6bedabe4` meta·해시·F-15(RED 22 실패 → GREEN) · `af6e875c` EXPORT-SPEC 4.4 개정
- R2 재개(BRIEF-R2): 남은 일 = RED 증거 기록·게이트·예산·Ego R1/R5·Codex·REPORT
- R2-1 RED 증거(fresh, 2026-10-20): 구현 전 `staticMarkup.ts`(`c1c8ba0a` = `6bedabe4^`)에 현 `staticCsp.test.ts`를 돌림 → **22 failed · 1 passed**(통과 1 = zip 출력 불변 = 1단계 의도). AC-01(4)·03(1)·04(4)·05(1)·06(6)·07(4)·08(2) 전부 RED. AC-10은 단위 테스트가 아니라 `check-bundle-size`(build 마지막 단계) + `reactZipEntryGuard.test.mjs`로 판정 — R2-3에 기록.
