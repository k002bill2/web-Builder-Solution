# SEC-FIX-1 QA REPORT — 가져오기 M-1·L-1 수정 독립 검증

대상 tip `19d3337a`(QA 착수 커밋 `3b2dd420` 직전) · 브랜치 `k002bill2/import-hardening` · 2026-10-18 · QA(Claude Code, Opus 5.5). 정적·회귀만 — 브라우저 0 · Codex 0 · push 0. 앱·테스트 코드 커밋 0(퍼즈·변이는 임시 적용 후 되돌림).
표기: [사실]=실행 확인 · [추정] · [미확인].

## 판정
(작성 중)

## 1. fresh 게이트 · 예산 [사실 — 로그 `/tmp/qa-sf1/*.txt`, 미커밋]
| 게이트 | 결과 |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npx vitest --run` | **363 files / 3269 tests passed** exit 0 (BRIEF 기대치 일치) |
| `npm run build` | exit 0 (번들 가드·preload 가드 통과) |

| 라우트 | base(`logs/build-base.txt`) | QA fresh | 증분 |
|---|---|---|---|
| /projects 첫 화면 | 99.09 | 99.09 | 0 |
| /projects 진입 직후 | 109.54 | 109.53 | −0.01 |
| /studio 해시 정규화 진입 | 128.80 | 128.80 | 0 (멈춤 > 128.82) |
| 복원 진입 해시 정규화 | 131.78 | 131.78 | 0 (멈춤 > 131.80) |
| /catalog 첫 화면 | 100.77 | 100.77 | 0 |
| 렌더 문서 JS | 84.29 | 84.30 | +0.01 (예산 90) |
→ 진입 증분 0 재현. **PASS**.

## 2. Security 퍼즈 67건 + 폭탄 재실행 [사실]
- 방법: `sec-readproject/patches/zzSecFuzz.test.tsx.txt`·`zzSecBomb.test.ts.txt`를 `app/src/features/projectFile/`에 임시 복사 → `npx vitest --run` 2 files / 2 tests passed → **즉시 삭제**(`git status --short` 빈 값 확인). 결과 `logs/qa-fuzz-after.txt`(67줄).
- **M-1 폭탄**: 선언 640×480 + IHDR 16384² → `result=IM-6 order=` (빈 값 = **디코드 0회**). 이전 Security 실증은 디코드 1회 뒤 IM-6.
- **L-1 대상**: S01(family CSS 깨기)·S07(굵기 1e9)·S16(scale 0·sectionGap −1) = 이전 `PASS import · renderMsg=DROPPED` → 이후 **REJECT IM-4**.
- S02~S04(family `constructor`·`__proto__`·`toString`): 가져오기 PASS·렌더 accepted 그대로, `siteFaces` = 함수/객체 이름 → **`[]`(정상 폴백)** — `Object.hasOwn` 효과. 판정 줄의 나머지 필드 동일.
- **그 밖 60건 판정 불변**: 시간(ms) 제거 후 `diff` = 위 7줄만 다름. 이후 분포 PASS 27 · IM-2 2 · IM-3 1 · IM-4 27 · IM-5 1 · IM-6 9. `renderMsg=DROPPED` **0건**, render/static/kitVar 누출 0건.
→ **PASS**.
