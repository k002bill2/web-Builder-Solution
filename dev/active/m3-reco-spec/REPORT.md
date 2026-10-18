# M3-0 REPORT — 추천 모드 명세 (Designer, 명세만)

> 상태: **초안(잠정)** · 갱신 시마다 커밋 · 사실(L1 파일 확인)/추정/미확인 구분

## 0. 잠정 결론
- **잠정**: 추천은 브라우저 단독 `domain/recommend.ts` 순수 함수(TRD 6.1 가중치를 정수 배점으로)로 명세하고, 화면은 기존 `/catalog?tab=rec` 자리 문구를 대체한다. 엔진·카드는 `tab=rec`일 때만 받는 청크라 첫 화면 ≈0 · 개정 불필요(추정). 접근성·성능 점수가 "미측정"인 레퍼런스가 있으면 TRD 가중치(각 0.15)를 그대로 쓸 수 없어 **재정규화 규칙**이 필요하다(설계 질문 후보).
- **정본 충돌(사실)**: PRD FR-SEL-03·TDD T-REC-01/E2E-S4는 "추천 5개", BRIEF는 "후보 3개 카드" — 질문으로 분리 예정.

## 1. 입력 확인 (사실)
- PRD FR-SEL-03·04 (`docs/02-prd/PRD.md:98-99`) · TRD 6.1 (`docs/03-trd/TRD.md:212-219`) · TDD T-REC-01~06 (`docs/05-tdd/TDD.md:159-166`) · E2E-S4 (`:242`)
- rs8 REPORT: 3.2·3.4 없음, 승인 후 적용 패턴은 `domain/confirmGate.ts`만 (`dev/active/rs8-roadmap-status/REPORT.md:65-67`)
- ADR-004 개정 17·18: `/studio` 정규화 128.71 / 상한 129.13 (`app/scripts/m2cBaseline.json`)
- CURATION: 측정값 없으면 "미측정", 관찰 인상으로 점수 만들지 않음

## 2. 진행
- 서브에이전트 1(Explore, 읽기 전용 — 데이터·태그·저장·라우트·live region·결정성 관례): **완료**. 결과 반영: 레퍼런스 21개(큐레이션 6 + 생성 15, 초안의 27 추정 정정) · 업종 분포(medical 4·retail 0) · 셸 공용 live region 없음 → 카탈로그 기존 트레이 status 공유(RQ-09) · 템플릿 가져오기 자리 문구 · tie-break 관례 부재. 주요 주장은 메인이 파일 재확인(CompareTrayBar:97·referenceDetail:12-15·DetailSidebar 자리 문구).
- 현 번들 실측(이 워크트리 `npm run build` exit 0, dist는 루트 `.gitignore` `dist/`): `/catalog` 100.05/101 · 진입 102.39/125 · `/compare` 98.95/100 · 122.66/125 · `/profile` 99.52/100 · 119.92/125 · `/studio` 정규화 128.71(상한 129.13) · raw 130.01/130.5 [사실].
- preview: **띄우지 않음** — 진입·자리 문구·카드 그리드를 소스 L1로 확인(관찰 불필요).

## 3. 산출
- `docs/design/m3/RECO-SPEC.md` r0 — 초안 커밋 `f532a1cd`, 조사 반영 보강 중
