# GEN-MARK-IMPL PROGRESS (B-M3P-03)

- 정본: `docs/design/gen-mark/SPEC.md` r1 · MQ-GM-1~4 A · base `b3f8894` · 브랜치 `k002bill2/gen-mark-impl`

## 체크리스트
- [x] P0: `npm ci` exit 0 · `package-lock.json` 변경 0 (`git diff --quiet package-lock.json`)
- [x] RED 테스트 (U1~U7) — 결과 아래 기록
- [x] 구현: `SourceTags.tsx`(새) · `ReferenceCard.tsx` · `ReferenceDetailPage.tsx`
- [x] GREEN — 대상 4파일 141 passed
- [x] 게이트 1차: typecheck · lint · build exit 0 · 전체 vitest exit 0
- [x] G1: `referenceDisplay.ts`·`Tag.tsx` diff 0 · SourceTags는 Catalog·Detail 청크만 import
- [x] G2 실측(base 재빌드 비교) — /profile 첫 화면 +0.02 편차(엔트리 preload 맵, 아래)
- [ ] 구현 커밋
- [ ] Ego Lite E1~E4 + shots/ + 정리(IDB·finish·listTaskSpaces·포트)
- [ ] Codex review (최대 2라운드)
- [ ] REPORT.md

## RED 결과 (구현 전, `npx vitest --run ReferenceCard.test ReferenceDetailPage.test`)
- 5 failed / 49 passed.
  - 실패(의도): 181행 뒤집은 단언(라이선스 aria-hidden 조상 → null) · U1·U2(라이선스 Tag가 썸네일 안) · U3(sr-only "라이선스" 없음) · U5·U7 상세(접두 없음) · U6(접두 없음).
  - 통과(구조 가드): U4(큐레이션 카드 생성 조합 0·라이선스 1개 — 현 구조도 만족) · 카드 U7(DOM 순서 — 썸네일 포함 관계여도 FOLLOWING 성립). 사전 예측은 따로 적지 않았다(사후 기록).

## 예산 (gzip KB, base = 임시 worktree `/tmp/gm-base`에서 `b3f8894` 빌드, 제거 완료)
| 라우트 | base 첫 화면 | head 첫 화면 | base 진입 | head 진입 |
|---|---|---|---|---|
| /catalog | 100.07 | 100.32 (멈춤선 100.90) | 102.41 | 102.65 |
| /references/:id | 97.32 | 97.76 | 99.66 | 100.09 |
| /compare | 98.89 | 98.91 | 122.70 | 122.72 |
| /profile | 99.87 | **99.89** | 119.98 | 120.00 |
| /projects | 98.41 | 98.43 | 105.65 | 105.67 |
| /studio/:projectId | 91.84 | 91.86 | 129.28 | 129.28 |
- 전 라우트 +0.02 = 새 공유 청크 `SourceTags-*.js` 이름이 엔트리 `index-*.js` preload 맵에 들어간 몫. closure 변화 0. 기존 Catalog∩Detail 공유 청크는 모두 다른 라우트도 import → 옮기면 /compare·/profile에 ~0.3 이동이라 더 나쁨. vite.config 수정 0.
