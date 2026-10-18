# SEC-FIX-1 QA REPORT — 가져오기 M-1·L-1 수정 독립 검증

대상 tip `19d3337a`(QA 착수 커밋 `3b2dd420` 직전) · 브랜치 `k002bill2/import-hardening` · 2026-10-18 · QA(Claude Code, Opus 5.5). 정적·회귀만 — 브라우저 0 · Codex 0 · push 0. 앱·테스트 코드 커밋 0(퍼즈·변이는 임시 적용 후 되돌림).
표기: [사실]=실행 확인 · [추정] · [미확인].

## 판정
**PASS — 머지 차단 없음. M-1·L-1 수정 확인. 후속 Low 2건(QA-1 테스트 공백 · QA-2 EX-6 문구).**

| # | 항목 | 판정 | 핵심 근거 |
|---|---|---|---|
| 1 | fresh 게이트·예산 | PASS | typecheck 0 · lint 0 · 363 / 3269 · build 0 · 진입 증분 0 |
| 2 | 퍼즈 67 + 폭탄 | PASS | 폭탄 디코드 0 · S01·S07·S16 → IM-4 · S02~S04 siteFaces `[]` · 그 밖 60건 불변 · DROPPED 0 |
| 3 | 변이 4종 | 조건부 PASS | 3종 FAIL로 잡힘 · **M2(`===`→`<=`) 생존 → QA-1** |
| 4 | 단언 약화 | PASS | 삭제 2줄 = 강화 대체 · expect 23→32 |
| 5 | 부작용 EX-6 | PASS | 발생 = 조작 파일뿐 · 이미 렌더 불가 · 삭제로 회복 · **문구 과함 → QA-2 BACKLOG** |

- QA-1 (Low): `checkImages.test`에 헤더가 사다리보다 **작은** 경우(639×480·640×479 → IM-6·디코드 0) 추가 권고. 보안 영향 없음(작은 헤더 = 폭탄 아님, 디코드 뒤 치수 검사가 막음) — 회귀 고정 목적.
- QA-2 (Low): 한 프로젝트만의 렌더 범위 밖 값이 EX-6 "브라우저 데이터 지우기"(전체 삭제) 안내로 이어짐 → 문구/원인 분리 BACKLOG.

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

## 3. 변이 4종 [사실 — 각 변이 적용 → `npx vitest --run src/features/projectFile src/kit`(48 files / 357 tests) → `git checkout`으로 되돌림, 매번 `git status --short` 빈 값]
| # | 변이 | 결과 | 잡은 테스트 |
|---|---|---|---|
| M1 | `checkImages.ts:73` 헤더 검사 줄 삭제 | **FAIL 6** (잡힘) | `checkImages.test` SEC M-1 6건(png·jpeg·webp 16384² · 1px 다름 · 서명만 · 마지막 변형본만 폭탄) |
| M2 | `headerFits` `===` → `<=` (폭·높이) | **생존 — 357/357 PASS, 전체 스위트도 363/3269 PASS** | 없음 |
| M3 | `profileShape.ts:64` grid `inRange(grid, 1, 64)` → `1, 65` | **FAIL 1** (잡힘) | `profileShape.range.test` "grid 65" |
| M4 | `siteFonts.ts:19·26` `Object.hasOwn(ALIAS, x)` → `x in ALIAS` | **FAIL 4** (잡힘) | `siteFonts.test` 1건 · `profileShape.range.test` S02~S04 3건 |

### QA-1 (Low · 테스트 공백) M2 생존 — 헤더가 사다리보다 **작은** 경우를 보는 테스트 없음
- [사실] M-1 테스트의 "1px 다름"은 641×480·640×481(큰 쪽)만 넣는다. `<=` 완화는 이 둘과 16384² 폭탄을 모두 거절하므로 기존 단언이 전부 통과한다.
- 보안 영향 [사실 코드 + 추정]: 작은 헤더는 디코드 메모리가 선언 치수(이미 `exceedsPixelLimit` 검사) 이하라 **폭탄 경로는 아니다**. 디코드 뒤 `reencode`의 `bitmap.width !== width` 검사(`checkImages.ts:84`)가 정직한 디코더에서는 IM-6으로 막는다. 다만 "디코드 전 정확히 같음"이라는 REPORT §1 주장("사다리와 정확히 같음을 요구")을 회귀로 고정하지 못한다 → 누군가 `<=`로 바꿔도 CI가 모른다.
- 권고(Developer, 미적용 — QA는 테스트 코드 커밋 금지): `checkImages.test` "1px 다름" 케이스에 **639×480 · 640×479** 추가, 기대 IM-6 · `calls.decoded = 0`. M2를 다시 적용해 FAIL 확인(Red-Green).
→ 4종 중 3종 잡힘. **조건부 PASS (QA-1 Low)**.

## 4. 픽스처·테스트 이전/이후 — 단언 약화 0 [사실 — `git diff 5c98507c..19d3337a -- app/`]
- 변경 테스트·픽스처 파일 3개: `checkImages.test.ts`(+47/−2) · `profileShape.range.test.ts`(신규 111) · `test/projectFileFixtures.ts`(+36/−10). 그 밖 테스트 파일 변경 0.
- 테스트 파일에서 **삭제된 줄 = 2줄뿐**(`checkImages.test` "디코드 치수 ≠ 사다리"의 `rejected(... 499×300 / 500×301)` 호출). 대체 줄은 같은 IM-6 기대 + **`calls.decoded === 1` · 두 번째 `[decoded, closed] = [1, 1]` 추가** → 강화(헤더 = 500×300 고정이라 디코드 경로를 계속 탄다. 그대로 뒀다면 헤더 단계 거절로 `0 === 0` 공허 통과). REPORT §3 서술과 일치.
- `checkImages.test` 단언 수: `expect(` 23 → 32 · `it(` 16 → 21 (감소 0).
- 픽스처 커밋 `b3bd90c8`: `checkImages.test` 삭제 줄 0(헤더 일치 테스트 +7만), 나머지는 `fakeImageBytes` 바이트 모양(서명 16B → 실제 헤더 40B)·디코더 `.slice(HEADER_BYTES)` — 기존 단언을 바꾸지 않고 통과(REPORT: 206 passed).
- 픽스처 바이트 모양 변경이 다른 스위트의 바이트 수·형식 단언을 느슨하게 했는지: fresh 전체 3269 통과 · 바이트 수는 `fileImage`가 실제 길이로 계산 [사실, 항목 1·2].
→ **PASS**.

## 5. 부작용 — 범위 밖 값을 가진 기존 프로젝트의 파일 내보내기 = EX-6 [사실 코드 · 추정 표시]
- **발생 조건이 좁다** [사실 grep]: 앱이 프로필 값을 만드는 경로는 모두 범위 안 고정값이다 — 글꼴 3종(`domain/fonts.ts`), 굵기 700/400(`internalCompose.ts:194`·`profileDraft.ts:172`), sectionGap 96/64(`internalComposeData.ts:134-135`), grid `"8pt"`. 범위 밖 값은 **수정 전 가져오기로 받은 조작 파일** 또는 IDB 직접 변조로만 생긴다.
- **범위도 좁다** [사실 `profileShape.ts:102-110`·`checkFile.ts:88-98`]: 렌더 범위 검사는 렌더될 버전(최신 · 문서 · 스냅샷)에만 — 과거 버전만 범위 밖이면 내보내기 막지 않음(Codex r1 반영, `codex-r1-*` 로그).
- **이미 쓸 수 없던 프로젝트다** [사실, 항목 2 parity]: 그런 프로젝트는 수정 전에도 렌더 메시지 DROPPED → 캔버스·미리보기·PNG·정적 내보내기 불가. 이번 수정은 "파일 내보내기만 되던 것"을 막을 뿐이다. 그 파일은 수정 후 가져오기에서 어차피 IM-4로 거절되므로 내보내도 다시 쓸 수 없다 → **실질 손실 0** [추정 — 다른 도구로 파일을 읽는 사용 사례는 고려 밖].
- **사용자가 막히는가**: 그 프로젝트의 파일 내보내기만 막힌다. 다른 프로젝트·열기(checkState 불변)·삭제는 영향 0.
- **회복 경로 있음** [사실]: 프로젝트 삭제(`deleteProject.ts`)는 `recordsHold`를 쓰지 않고 상태 봉투(Map) 확인만 한다 → 그 프로젝트만 지울 수 있다.
- **QA-2 (Low · UX 문구)**: EX-6 문구(`ExportProjectFileDialog.tsx:12`)는 "'이 브라우저 데이터 지우기'로 비울 수 있습니다" — **모든 프로젝트를 지우는** 회복을 안내한다. 원래 EX-6은 상태 봉투 손상(전체 불가)용이라 맞았지만, 이번 수정으로 "한 프로젝트의 프로필 값만 범위 밖"도 EX-6이 되어 안내가 과하다. 사용자가 문구대로 하면 정상 프로젝트까지 잃는다 [추정 — 발생 조건이 조작 파일뿐이라 빈도 극소].
- **BACKLOG 권고: 예 (Low, 머지 비차단)** — `docs/06-handoff/BACKLOG.md`에 "파일 내보내기: 렌더 범위 밖 프로필 = 그 프로젝트만 문제 — EX-6과 분리한 문구(예: '이 프로젝트의 디자인 값이 올바르지 않아 파일을 만들지 못했습니다 — 이 프로젝트를 지우거나 새로 만드세요') 또는 readProject에서 원인 구분". QA는 BACKLOG 파일을 직접 고치지 않았다(문서 범위 밖 — Jarvis 판단).
→ 부작용 수용 가능. **PASS (QA-2 BACKLOG 권고)**.
