# M3-0 REPORT — 추천 모드 명세 (Designer, 명세만)

> 상태: **초안(잠정)** · 갱신 시마다 커밋 · 사실(L1 파일 확인)/추정/미확인 구분

## 0. 결론 (r1)
- **결론**: 추천 = 브라우저 단독 순수 함수 `domain/recommend.ts`(TRD 6.1 가중치를 **정수 배점 합 100**으로, 동점 `id` 코드 단위 오름차순). 입력 = 기존 카탈로그 필터 4축(업종·목적·타깃·콘셉트) — 새 입력 칸 0. 화면 = 기존 `/catalog?tab=rec` 자리 문구 대체. 적용(★RQ-01 B) = 보드에 담고 전 선택 행을 그 레퍼런스로 저장 → 초안 패널 반영, 저장 resolve 뒤에만 성공 표시, 되돌리기 제공.
- **예산**: 개정 불필요(추정) — `/catalog` 첫 화면 ≈0(멈춤선 100.90까지 0.85), `/catalog (추천)` 진입 106~108/125, 다른 라우트 0. 필수 섹션은 엔진 판정 파생 표 + 대조 가드라 상세 픽스처·엔진을 rec 청크에 넣지 않음.
- **정본 충돌(사실)**: 5개(PRD·TDD) vs 카드 3개(BRIEF) → RQ-07 ★A(엔진 5 · 화면 3 + 더 보기). "학부모" AudienceId 없음 → `family`. medical 4개뿐 → 5위는 다른 업종.
- 엔진 계약 변경 0 · 새 의존성 0 · **예산 질문 1(RQ-11)**: 적용 큐 통로가 앱 공용 Provider(`AppProviders.tsx:28`)에 붙어 모든 라우트 소액 증분 [추정, 미실측] — `/studio` 정규화 여유 0.03. 데이터 계층 내부 API 1개(C2)는 RQ-01·RQ-11로 질의.

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
- `docs/design/m3/RECO-SPEC.md` r1 — r0 `f532a1cd` → 조사 반영 `75bbca7c`·`cf007661` → Codex 반영(이 커밋)

## 4. Codex (adversarial-review 1회, `--scope branch --base a0068764`, `--help` 없이)
- 판정 needs-attention · P1 1 · P2 4 — **5건 모두 타당**(코드 재확인) → 전부 반영. 상세는 SPEC 8절.
- 재실행 없음(BRIEF 1회 제한). 반영분 검증 = 메인이 문서 정합 재확인(표 손상 2곳 발견·복구: 4.2 C1 행·2.2 sales 행 — 치환 위치 오류).

## 5. 목업·정본과 다르게 한 부분 (한 줄씩)
- PRD FR-SEL-03 "사업 설명" 자유 입력 → 필터 4축으로 대체(LLM 없음 전제, RQ-03).
- TRD 6.1 소수 가중치 → 정수 배점(결정성), 미측정 품질 처리 RQ-02.
- E2E-S4 "프로필 반영" → 초안 패널 반영으로 해석, 버전 확정은 기존 `/compare` 확정.
- **턴 규칙 이탈(사실)**: BRIEF "REPORT 초안 10턴 안 · RECO-SPEC 초안 15턴 안" — 실제 REPORT 초안 `e7d93976` 약 11턴째, SPEC 초안 `f532a1cd` 약 27턴째(정본·실측·조사 선행 탓). 55턴 상한 안에서 마감.

## 6. 서브에이전트
- Explore 1개(읽기 전용, 데이터·태그·저장·라우트·live region·결정성 관례): 완료 · 결과 SPEC 1.2·2.2·2.3·3.3·3.6에 반영 · 레퍼런스 수 27(내 추정) → 21로 정정.
