# M3-0 BRIEF — 추천 모드 명세(규칙 기반 점수·근거·승인 후 적용) (Designer, 명세만)

책임 역할: Designer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18 (영환님 "1 진행 · 자동 진행")
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/m3-reco-spec` (브랜치 `k002bill2/m3-reco-spec`, base `a0068764`). 쓰기 경로: `docs/design/m3/RECO-SPEC.md`(신설) · `dev/active/m3-reco-spec/`만. **앱 코드 0.**
병렬: `m4a-retry-fix`(Developer, 내보내기 import) — 입력 아님.

## 정본·입력
- `docs/04-plan/DEVELOPMENT_PLAN.md` M3 3.2(추천 점수, 규칙 기반·근거)·3.4(추천 모드 UI, 승인 후 적용) · PRD/TRD 추천 조항(`grep -n 추천 docs/02-prd/PRD.md docs/03-trd/TRD.md`) · TDD T-REC·E2E-S4 · `dev/active/rs8-roadmap-status/REPORT.md` M3 진단.
- 현 구현: 선택 3모드 중 템플릿·스타일 조합은 있음(3.3) — 진입 화면·`/compare`·`/profile` 흐름, 레퍼런스 태그·프로필 데이터(`app/src/fixtures/`·`domain/`). **LLM·백엔드 없음 전제**(브라우저 단독, 규칙 기반).
- 큐레이션 원칙 `docs/06-handoff/ops/CURATION.md`(추상 태그만).

## 산출 `RECO-SPEC.md`
1. 추천 입력(사용자 업종·목적·톤 등 이미 받는 값만 — 새 입력 필요 시 질문으로) · 후보 집합(레퍼런스/킷 변형/프로필).
2. **점수 규칙**: 가중치 표·동점 처리·결정성(같은 입력 → 같은 순위) · 근거 문장 구조(어떤 태그가 몇 점 — 문안은 Hemingway, 키·자리표시만).
3. 화면: 진입 위치·후보 3개 카드·근거 펼치기·"이 추천 적용"(승인 후 적용 — 적용 전 미리보기·되돌리기) · 빈/로딩/오류/근거 부족 상태 · 390/1280 · 포커스·live region(셸 status 1·alert 1 원칙).
4. 데이터·엔진 계약: 새 타입·필드가 필요하면 목록(엔진 계약 변경 = 사용자 질의 대상이라 별도 표) · 저장 레코드 영향.
5. **예산 추정**: 어느 라우트 진입에 무엇이 들어가는지, 조작 뒤 청크로 뺄 수 있는 것 — ADR-004 개정 17·18 현 수치(`/studio` 128.71/129.13, `/profile` 99.53/100, `/compare` 진입 확인) 대비 추정 증분과 개정 필요 여부.
6. 수용 기준 `RECO-AC-NN`(단위/실화면 구분) · T-REC·E2E-S4 대응표.
7. **설계 질문**(번호, ★권장) — 예산 상향·엔진 계약·새 의존성은 반드시 질문으로 분리.
- 실화면 관찰 필요 시 preview `--port 4398 --strictPort` 1회 관찰만, 반드시 종료. 외부 리서치 금지.
- 서브에이전트: 읽기 전용 1개 허용(현 데이터·태그 구조 조사). 최대 55턴, **RECO-SPEC 초안 15턴 안 커밋**, 45턴부터 마감.

## 공통
- 명시 경로 커밋, amend·rebase·push·merge·원격 쓰기 0. 첫 2턴 BRIEF·PROGRESS 커밋, **REPORT 초안(잠정 결론 줄 포함) 10턴 안**, 이후 항목마다 갱신 커밋. 사실/추정/미확인 구분.
- preview를 띄우면 마지막 커밋 직전 종료 → `lsof -nP -iTCP:<포트> -sTCP:LISTEN` 0 기록. 마감 전 `git status --short` node_modules 외 빈 값.
- Codex는 `--help` 없이 1회만.
