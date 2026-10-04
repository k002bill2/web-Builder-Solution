# M2b 킷 확장 — 실행 계획 (Jarvis · 2026-10-04 · 영환님 "M2b 브리프")

- 상위: `docs/04-plan/DEVELOPMENT_PLAN.md` 18행(M2b) · `docs/00-research/buzz/claude-fable-r2.md` A-3 재배열안 · TRD TR-POL-04(루브릭) · 8절 277행(폰트 ≤ 2계열)
- 출발점(main `a854013`, 원격 반영): 실렌더 7/30 · 정적 HTML · PNG · 문제 목록(r4.13). 렌더 문서 JS **80.12 / 90**(멈춤선 89.70 · 여유 9.58) · CSS 6.32 / 30. `/studio` 진입 127.38 / 128(여유 0.32).

## 1. 범위
| 넣음 | 뺌 (기본안 — 결정 1) |
|---|---|
| 나머지 **23변형** 실렌더(header 3 · hero 5 · footer 3 · 본문 12) | React zip(M4 — Fable 안 유지) |
| 3폭(1280 · 768 · 390) 반응형 검수 | internal 조합 생성기 T-1(M2b 뒤 — 개발계획 v0.3 실행 순서 4) |
| 모션 프리셋 L0~L2 + `prefers-reduced-motion` | 자체 그래픽 본편 · 이미지 업로드 변환(M2c) |
| 폰트 자체 호스팅(허용 3종 중 ≤ 2계열 서브셋) | 카탈로그 썸네일 렌더 교체(M3′) |
| 3안 실렌더 나란히 비교 | 와이어프레임 모양표 폐기(30/30 뒤 별건) |
| 루브릭(TR-POL-04) 30/30 · 시각 회귀 기준선 | |

남은 23변형(엔진 `SECTION_DEFINITIONS`, L1):
- **바깥 11**: header `sticky-hamburger` · `sticky-two-tier` · `transparent` / hero `split` · `center` · `grid` · `text` · `image` / footer `biz-extended-map` · `minimal` · `minimal-biz`
- **본문 12**: about `text` / services `list` · `cards-2` · `cards-masonry` / portfolio `grid-3` · `masonry` · `grid-2` / statistics `stats-3` / testimonials `quotes-2` / pricing `tiers-2` / contact `booking` / cta-band `banner`

## 2. 단계 (실제 의존성만 순차 — 병렬 기본)
| 단계 | 역할 | 내용 | 선행 | 병렬 |
|---|---|---|---|---|
| **M2B-0A** | Designer | 바깥 11변형 명세 + 루브릭 기록 → `docs/design/m2b/SPEC-BOUND.md` | — | 0B와 병렬 |
| **M2B-0B** | Designer | 본문 12변형 명세 + 루브릭 기록 → `docs/design/m2b/SPEC-BODY.md` | — | 0A와 병렬 |
| M2B-1 | Developer | 바깥 11변형 구현(3폭 · K-AC) | 0A | — (`kit/registry.ts`·`kit.css` 공유라 2와 순차) |
| M2B-2 | Developer | 본문 12변형 구현 | 0B · M2B-1 | M2B-3과 병렬 가능 |
| M2B-3 | Designer | 모션 프리셋 L0~L2 · reduced-motion · 폰트 2계열 서브셋 결정 | 0A · 0B | M2B-2와 병렬 |
| M2B-4 | Developer | 모션 · 폰트 구현 | M2B-3 · M2B-2 | — |
| M2B-5 | Developer | 3안 실렌더 나란히 비교(`/compare` 또는 3안 화면 — 예산 실측 먼저) | M2B-2 | M2B-4와 병렬 검토 |
| M2B-6 | QA | 30/30 실렌더 · 3폭 시각 회귀 기준선 · 루브릭 대조 · E2E | 전부 | — |

- 동시 작업자 2개 상한(이 프로젝트 429 이력) · 서브에이전트 금지 유지.
- 기간은 Fable 추정 2~3주(변형 1개 제작·QA 0.5일 가정) — **추정**.

## 3. 예산 규칙 (ADR-004 개정 2·4, 상향 없음)
- 렌더 문서 JS 멈춤선 **89.70**. M2a 본문 4변형 추가 실측 +1.03KB(약 0.26/변형) → 23변형 단순 추정 **+6KB → 약 86KB**(추정). 모션은 CSS 우선(JS 0 목표).
- 각 Developer 단계는 시작 때 변형 1개 시제품으로 증가량을 실측하고, 단계 끝 예상치가 멈춤선을 넘으면 구현 전에 멈춘다.
- 킷 코드는 렌더 문서에만(앱 `/studio` 진입 증가 0이 원칙 — 섹션 정의 데이터는 이미 있음).
- 폰트 파일은 JS 예산 밖이지만 내보낸 사이트 예산(TRD 8절 · 폰트 ≤ 2계열 서브셋)으로 따로 판정.

## 4. 결정 (영환님)
1. **범위 기본안**(★A): React zip M4 유지 · internal 조합 생성기는 M2b 뒤. (대안: React zip을 M2b에 — Opus B-7-7 "고정 템플릿 + 킷 소스 복사" 설계 검증 필요)
2. **폰트 파일 취득**(M2B-3 전에 결정 — 지금은 아님): OFL 폰트 파일을 저장소에 넣는 방식(패키지 의존성 추가 vs 원본 파일 서브셋 커밋). 새 의존성 · 바이너리 자산이라 승인 대상.

### 결정 결과
- 결정 1 = **★A**(영환님 "★A, M2B-0 기동" 2026-10-04): React zip M4 · internal 조합 생성기 M2b 뒤.
- MQ 13건(SPEC-BOUND MQ-B1~6 · SPEC-BODY MQ-B1~7) = 잠정안 일괄 승인(영환님 "★A, M2B-1 브리프" 2026-10-04) — 각 SPEC 끝 "Jarvis 결정 기록".
- M2B-1은 킷 공유 파일(`kit/registry.ts`·`kit.css`·`types.ts`) 때문에 **1a(hero 5) → 1b(header 3 + footer 3)** 순차로 나눈다(`header/transparent`의 `heroTop`이 hero 변형을 읽음).

## 5. 기록
- v1 2026-10-04 작성(Jarvis). 단계 브리프: `docs/06-handoff/M2B-0A_KIT-SPEC-BOUND_DESIGNER_BRIEF.md` · `M2B-0B_KIT-SPEC-BODY_DESIGNER_BRIEF.md`.
