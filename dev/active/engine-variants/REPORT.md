# ENGINE-VARIANTS — REPORT

- 브리프: `docs/06-handoff/ENGINE-VARIANTS_BRIEF.md` · 기준: SPEC r4.6 A3-Q3 A · 시작 커밋 `e9d9976` · 브랜치 `k002bill2/engine-variants`
- 서브에이전트 0 (브리프 "서브에이전트 분할: 불필요" · 금지). 로컬 커밋만, push·병합·삭제 0.

## 1. 커밋 표

| # | 커밋 | 내용 | RED | GREEN·게이트 |
|---|------|------|-----|-------------|
| C1 | `fbc133a` | `engine/sections/bodySections.ts` 변형 3개: `services/cards-2`("카드 2열", 카드 1..2) · `services/cards-masonry`("카드 벽돌형", cards-3 스키마) · `portfolio/masonry`("이미지 벽돌형", grid-3 스키마) · maxMotion L2(원본 준용). 레지스트리 테스트: 유형별 변형 목록 정확 단언 + 새 변형 3개 이름표·슬롯·maxMotion | `logs/c1-red.txt` 2 fail | `c1-green.txt` 394 pass · `c1-guards.txt` 58 · `c1-lint.txt` tl 0 · `c1-build.txt` 0 |
| C2 | `166db29` | `data/engineVariantMap.ts`: services/grid-2→cards-2 · services/masonry→cards-masonry · portfolio/masonry→masonry(같음, 알림 대상 밖). portfolio/grid-2 현행(grid-3) 유지. 43쌍 불변. 알림 기대값 갱신 + 3안 수용 테스트 | `c2-red.txt` 3 fail | `c2-green.txt` 837+364 pass · 가드 58 · tl 0 · build 0 |
| C3 | `88f85f5` | `components/studio/StructureCanvas.test.tsx` 신규 — 새 변형 3개를 슬롯 목록대로 그림. 그리기 로직 변경 0 | 특성화 테스트(첫 실행 GREEN). 변이 검사 `c3-mutation-red.txt`: cards-2 슬롯을 3칸으로 바꾸면 FAIL → 복원 | `c3-green.txt` 1 pass · 가드 58 · tl 0 · build 0 |
| C4 | (이 커밋) | REPORT · 전체 vitest 3회 · Codex review 로그 | — | `final-full-x3.txt` 3회 모두 123 files · 1355 pass |

## 2. AC 판정

| AC | 판정 | 근거 |
|----|------|------|
| 범위 1: 변형 3개 · 슬롯 재사용 · maxMotion 준용 · 레지스트리 테스트(키 고유·기본 글자 ≤ 상한) | PASS | `registry.test.ts` "그리드 축 변형 3개(A3-Q3)…" · "슬롯 스키마: 키 유일 … 기본 글자 ≤ 상한" |
| 범위 2: 매핑 31·32·19행 · 33행 현행 · 알림 문구 자동 파생 | PASS | `engineVariantMap.test.ts` 대표 쌍(grid-2→cards-2 · masonry→cards-masonry · portfolio masonry→masonry · portfolio grid-2→grid-3) · `startDocWrite.test.ts` 알림 "섹션 2개 … Services 2열 → 카드 2열" |
| 범위 3: 캔버스가 새 변형을 슬롯 목록대로 그림 | PASS | `StructureCanvas.test.tsx` (그리기 로직 변경 0) |
| 수용: 같은 픽스처 3안(그리드 축만 다름) → startDoc 문서 3개 services 변형 서로 다름 | PASS | `startDocWrite.test.ts` "3안 그리드 차이 보존" — ref-a 픽스처 `composeCandidates` 3안 → `[cards-3] · [cards-2] · [cards-masonry]` |
| 수용: engineImportGuard·가드 전체 | PASS | `npx vitest run src/test` 58/58 (매 커밋) · `engineImportGuard.test.ts` 포함 전체 실행 통과 |
| 수용: 번들 `/studio` 진입 ≤ +0.3KB · 그 밖 ±0.03 | PASS | 아래 3절 — /studio 진입 +0.05, 그 밖 최대 ±0.01 |
| 수용: startDoc 멱등·UNKNOWN_VARIANT 테스트 불변 | PASS | `startDocWrite.test.ts` UNKNOWN_VARIANT·BAD_VALUE 테스트 무수정 · `memoryProjectRepository.test.ts` E-AC-41 재시도 같은 문서(무수정) GREEN |

## 3. 번들 표 (gzip KB, 첫 화면 / 진입 직후)

| 화면 | 기준(base) | C1 | C2 | C3 | 차이(C3−base) |
|------|-----------|----|----|----|---------------|
| /catalog | 99.64 / 102.03 | 99.65 / 102.03 | 99.64 / 102.02 | 99.64 / 102.02 | 0 / −0.01 |
| /references/:id | 96.99 / 99.38 | 97.00 / 99.38 | 96.98 / 99.37 | 96.98 / 99.37 | −0.01 / −0.01 |
| /compare | 98.75 / 121.39 | 98.75 / 121.39 | 98.75 / 121.39 | 98.75 / 121.39 | 0 / 0 |
| /profile | 99.61 / 123.64 | 99.61 / 123.65 | 99.60 / 123.64 | 99.60 / 123.64 | −0.01 / 0 |
| /projects | 94.00 / 107.04 | 94.00 / 107.04 | 93.99 / 107.03 | 93.99 / 107.03 | −0.01 / −0.01 |
| /studio/:projectId | 91.64 / 118.88 | 91.65 / 118.95 | 91.64 / 118.93 | 91.64 / 118.93 | 0 / +0.05 |

- 예산: /studio 첫 91.64 ≤ 99.40 · 진입 118.93 ≤ 124.70. 여유 < 0.3인 화면 없음(최소 /profile 첫 0.40).
- ±0.01 변동은 공통 청크 해시 문자열 차이로 보임(코드 변경은 레지스트리·매핑뿐). 매핑 표는 "편집 시작" 조작 뒤 청크.

## 4. SPEC 차이 (ADR-003)

- 레지스트리 테스트 "본문 9 type은 변형 1~2개씩"(L4a 브리프 문장, SPEC 본문 아님)을 **유형별 변형 목록 정확 단언**으로 교체 — services 4개·portfolio 2개는 SPEC r4.6 A3-Q3가 정한 결과라 옛 범위 단언과 양립 불가. 범위보다 좁은 단언이라 약화 아님.
- 새 변형 순서: services는 `list` 뒤, portfolio는 `grid-3` 뒤 — 기존 첫 변형(`cards-3`·`grid-3`) 불변.
- `cards-masonry`·`portfolio/masonry`는 원본과 같은 슬롯 배열 상수(`cards3`·`gallery3`)를 공유(바이트 절약, deepFreeze 무해).
- `docs/design/2a-05/VARIANT-MAP.md`는 수정하지 않음(브리프 제외 — Jarvis 몫). 19·31·32행 갱신 필요.

## 5. 남은 위험

- VARIANT-MAP.md 19·31·32행이 코드와 다름(Jarvis 갱신 대기).
- 캔버스는 여전히 세로 목록으로 그린다(구조 미리보기) — 2열·벽돌형 배치 차이는 이름표·카드 수로만 보인다. 실제 배치는 M2 생성기 몫.
- **Codex P2 (미반영, 브리프 확정과 충돌):** portfolio가 services보다 앞선 구조안이면 그리드 축이 portfolio에 적용되어(`composeCandidates.test.ts:134-135` "masonryFirst" 사례 — 축 `[masonry, grid-3, grid-2]`) `portfolio/grid-2`에 **도달한다**. 브리프 33행 "현행 유지(도달 0)"의 "도달 0" 전제가 이 경우 틀리며, 이때 grid-3·grid-2 두 안이 모두 `portfolio/grid-3`이 되어 3안 차이 1쌍이 사라진다. 브리프·SPEC r4.6 A3-Q3가 변형 3개로 확정했으므로 4번째 변형(`portfolio/grid-2` 대응)은 추가하지 않음 — **결정 필요(Jarvis/영환님): SPEC 후속으로 `portfolio/grid-2` 엔진 변형 추가 여부.** 근거 수준 L2(기존 테스트 단언), 불확실성 Low.
- 변형 교체 UI(a3-1)에서 services 변형 4개 목록이 처음 노출됨 — a3-1 레인에서 확인 필요.

## 6. 전체 vitest 3회 · Codex

- `logs/final-full-x3.txt` — 3회 모두 123 files · 1355/1355 pass (load 35.1 → 54.5 → 65.8, Codex 동시 실행 영향 · 22.8~25.9s).
- Codex `review --scope branch --base e9d9976` 1회 — `logs/codex-review.txt`. 지적 1건 P2(위 5절 portfolio-first) — 브리프 확정 범위 밖이라 미반영, 라운드 추가 없음.
