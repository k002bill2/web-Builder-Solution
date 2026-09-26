# DS-2A-04 PROGRESS — 디자인 프로필 · 3안 생성 화면 설계

- 역할: Designer (Hermes) · 브리프 `docs/06-handoff/DS-2A-04_DESIGNER_BRIEF.md` · 근거 ADR-003·004·005·006, `docs/design/v2/SPEC.md` 6.5
- 범위: 설계 문서만. `app/`·`design/` 수정 없음. `docs/design/2a-04/`만 로컬 커밋, push·원격 없음
- 턴 예산 80 · 65턴 넘으면 새 작업 중단하고 SPEC 먼저 커밋

## 단계

| # | 단계 | 상태 | 비고 |
|---|---|---|---|
| 1 | 읽기: CLAUDE.md · ADR-002~006 · PRD 4·7.3~7.6·8·10 · TRD 4.3~4.5·5·6.2·7·11 · 개발계획서 M1·M2 · v2 원본 2a-04(·2a-05 경계) · v2 SPEC · 1a-03 SPEC · 현재 `app/src`(domain·data·routes·fixtures·Icon) · QA-V2-FINAL · BUNDLE-01 | 완료 | 원본 문장은 데이터로만 읽음 |
| 2 | 대비 계산 스크립트 `contrast_calc_2a04.py` — 앱 `nearestCompliantColor` 알고리즘 이식(0.1%p, 어두운 쪽 우선) | 완료 | v2 `darken_to`(0.5%·4.6)와 다름 — Developer 테스트 기대값과 맞추려고 앱 알고리즘을 옮김 |
| 3 | SPEC 뼈대 커밋 | 진행 | |
| 4 | SPEC 본문(범위·흐름·상태·화면·3안·반응형·데이터 계약·번들·단계·AC·질문·목업 차이) | 대기 | |
| 5 | 최종 커밋·요약 | 대기 | |

## 목업과 다르게 한 부분 (ADR-003 한 줄 사유) — SPEC 11절에 표로 상세
(본문 작성 후 채움)

## 로그
- 2026-09-26 읽기 완료. 발견: (1) 보드 `confirmLabel`은 `confirmed.version + 1`, 메모리 저장소 `nextVersion`은 `max + 1` — 프로필 화면이 새 버전을 만들면 두 값이 어긋남 (2) 저장소가 메모리뿐이라 `/profile/:id` 새로고침·직접 진입은 항상 "없음" (3) ref-b 금색 ink는 흰 면 2.2 미달인데 어둡게 보정하면 다크 카드 C-3이 7.3 → 2.8로 깨짐 — 역할 하나로 풀 수 없는 경우
