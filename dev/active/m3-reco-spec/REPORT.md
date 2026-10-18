# M3-0 REPORT — 추천 모드 명세 (Designer, 명세만)

> 상태: **초안(잠정)** · 갱신 시마다 커밋 · 사실(L1 파일 확인)/추정/미확인 구분

## 0. 잠정 결론
- **잠정**: 추천은 브라우저 단독 `domain/` 순수 함수(TRD 6.1 가중치 v1을 출발점)로 명세하고, 화면은 `/compare` 진입 전 단계(카탈로그 쪽)가 아니라 **조작 뒤 청크**로만 들어가게 설계한다. 접근성·성능 점수가 "미측정"인 레퍼런스가 있으면 TRD 가중치(각 0.15)를 그대로 쓸 수 없어 **재정규화 규칙**이 필요하다(설계 질문 후보).
- **정본 충돌(사실)**: PRD FR-SEL-03·TDD T-REC-01/E2E-S4는 "추천 5개", BRIEF는 "후보 3개 카드" — 질문으로 분리 예정.

## 1. 입력 확인 (사실)
- PRD FR-SEL-03·04 (`docs/02-prd/PRD.md:98-99`) · TRD 6.1 (`docs/03-trd/TRD.md:212-219`) · TDD T-REC-01~06 (`docs/05-tdd/TDD.md:159-166`) · E2E-S4 (`:242`)
- rs8 REPORT: 3.2·3.4 없음, 승인 후 적용 패턴은 `domain/confirmGate.ts`만 (`dev/active/rs8-roadmap-status/REPORT.md:65-67`)
- ADR-004 개정 17·18: `/studio` 정규화 128.71 / 상한 129.13 (`app/scripts/m2cBaseline.json`)
- CURATION: 측정값 없으면 "미측정", 관찰 인상으로 점수 만들지 않음

## 2. 진행
- 서브에이전트 1(읽기 전용, 데이터·태그 구조): 진행 중
- 현 번들 실측(`npm run build`, dist는 gitignore): 진행 중

## 3. 산출
- `docs/design/m3/RECO-SPEC.md` — 미작성
