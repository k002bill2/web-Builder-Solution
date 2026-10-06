# M3P-1 PROGRESS — internal 조합 생성기

base `db9f25e` · branch `k002bill2/m3p-1` · 서브에이전트 0

## 체크리스트
- [x] P0 BRIEF 커밋 (69bca38)
- [x] S0 실측 — 기준 빌드(db9f25e): /catalog 첫 99.65 · /compare 진입 121.70 · /profile 첫 99.61 · /studio 진입 128.62(판정선 128.70) · 렌더 84.19. `reference.key` 화면 사용처 0(grep) → 생성 key = "". 깨질 테스트 = CatalogPage 26 · keyboardA11y 6(SPEC 8.3 목록 안)
- [x] 팔레트 표 + AA 단위 테스트 (12개 전부 통과, #BBBBBB 반례 C-1 실패 확인)
- [x] 뼈대 템플릿 3종 (booking·inquiry·sales)
- [x] composeInternalReferences (결정성·중복 제거·게이트 1~5)
- [x] 생성 스크립트 `app/scripts/generate-internal-refs.mjs` (vite SSR 로더, `--check`)
- [x] 생성 픽스처 2파일(카드 / 상세·비교), 기존 3파일 바이트 변경 0(해시 테스트)
- [x] 별도 청크 + 라우트 쪽 로더 (main·공통 지연 저장소 무변경)
- [x] 저장소 병합 · sourceKind · 미측정 정렬
- [x] 깨진 테스트 수정 (SPEC 8.3 해결 원칙 "큐레이션 6개만 주입" — 단언 변경 0)
- [x] AC U1~U4·U7·G1·G2·G5 테스트, G4 수동 합산 기록
- [x] Ego Lite 확인(4337) + 정리
- [ ] typecheck·lint·build·vitest 전체 (마감 1회) — BLOCKED: 재개 지시로 실행 금지(Jarvis 같은 worktree 병렬 검증 중)
- [x] Codex review (≤2) — R1 완료 P1 0·P2 2(REPORT 기록만, 코드 무변경이라 R2 생략)
- [x] REPORT (`REPORT.md`)

## 예산 반복 (S0 실측 → 상쇄)
| 빌드 | 배치 | /catalog 첫 | /profile 첫 | /studio 진입 | 판정 |
|---|---|---|---|---|---|
| 0 | 기준 | 99.65 | 99.61 | 128.62 | — |
| 1 | 공유 로더 모듈 + 훅 공유 + tiebreak 비교 함수 | 100.27 | 100.24 | 128.74 | 초과 → 멈춤선 |
| 2 | 로더 인라인·tiebreak 제거(생성 픽스처 id 순) | 99.91 | 99.76 | 128.67 | /catalog 99.90 초과 |
| 3 | isMeasured 함수 → `"status" in` | 99.88 | 99.73 | 128.64 | 통과 |
| 6 | 카드/상세 픽스처 분리 · 목록은 카드 청크만 · 접두어 판별 제거 | 99.82 | 99.71 | 128.63 | 통과 |
| 7 | + 테스트 교체 지점(GENERATED_CARDS) | 99.86 | 99.74 | 128.66 | 통과(최종) |

## TDD 기록 (정직 기록)
- 예산 상쇄 반복 때문에 로더·타입 구현을 테스트보다 먼저 썼다(S0 실측 = 실제 구현). 대신 핵심 동작은 Red-Green으로 확인:
  U7 비교 함수·보드 조건부 로드를 되돌리면 3건 실패 → 복원 후 22/22 통과.
- 예측: 카탈로그 1a-01 테스트는 개수 단언으로 실패(실측 26+6 실패 — 예측과 일치), 상세 테스트 1건은 타입(scores 합 타입)으로 typecheck 실패(실측 일치).

## 로그
- cc5ab69 구현 커밋. Ego Lite: 업종 5종 각 4개(카페 4: 큐레이션 2·생성 2), 생성 카드 → 상세(미측정·buildNote) → 비교 추가 → 보드 열기 = 열 A, 셀 전부 표시·"접근성·성능 미측정", 외부 요청 0. 캡처 3장 `dev/active/m3p-1/shots/`.
- 전체 vitest 1차: brandIsolation 1건 실패(새 테스트에 이전 브랜드 문자열) → 조각 이어 만들기로 수정.
- 재개 세션: Codex R1(branch --base db9f25e) 완료 — P2 트레이 생성 항목 누락·빈 팔레트 예외, REPORT 기록. 마감 게이트는 Jarvis 몫.
