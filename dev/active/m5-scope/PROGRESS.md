# M5-SCOPE PROGRESS

브랜치 `k002bill2/m5-scope` · base `cedbf587` · 산출 `docs/design/m5/M5-SCOPE.md` · 명세만(앱 코드 0)

## 체크리스트
- [x] T1 BRIEF·PROGRESS·HOSTING-LEDGER 커밋 — `71e86e40`
- [x] T2 입력 정본 읽기 (PRD FR-PUB-04~06 · DEV_PLAN M5 · TRD TR-SEC-08·10·11/publish API/12절 · ADR-004 · BACKLOG 릴리스 체크)
- [x] T3 서브에이전트(읽기 전용 2): 현재 코드 출발점 조사 / 원장 후보별 위험 추출
- [x] T4 M5-SCOPE.md 초안 (1 출발점 · 2 범위 분할 · 3 아키텍처 스케치 · 4 흐름·PUB-AC · 5 MQ-M5) — 초안 `851183d4`, 보강 `acdcfb75`
- [x] T5 Codex adversarial-review 1회 + 반영 — needs-attention, P1 2·P2 3 전부 반영(SCOPE 부록 B)
- [ ] T6 REPORT/PROGRESS 확정 · 커밋 · untracked 0

## 서브에이전트 결과
- 코드 출발점 조사(Explore, 읽기 전용): 완료. IndexedDB `design-studio` store 7 · 서버 호출 0 · 인증 코드 0 · 내보내기 3형식 · 산출물 CSP meta(앱 자체 CSP 없음) · vercel.json/.github 없음 · `published` 스냅샷은 타입만 — 1.1 표에 파일:줄로 반영. "Vercel 프리뷰"는 저장소 안에서 확인 불가로 표기.
- 원장 후보별 위험 추출(Explore, 읽기 전용): 완료. 원장 452줄·인용 178·출처 69 일치 확인, 지시형 주입 문장 없음. 후보 A/B/C 매핑·전환·만료·헤더·TLS·약관·비용을 `[N](L줄)`로 3절에 반영. 2.3 시간 기준 원문(L59) 반영, 롤백 정의는 원장에 없음을 명시. 원장 내부 무결성 1건: L79 "self-serve max 50,000"은 2.10 verbatim 행 없음(본문 미사용).

## 목업·정본과 다르게 한 부분
- DEV_PLAN `:143` "호스팅 결정(ADR-004)" → ADR-004는 성능 ADR이라 새 호스팅 ADR(ADR-008 후보)로 읽음(MQ-M5-01).
- TRD publish/rollback API의 AOS `/api/design-studio`·AOS 비밀 저장 전제 → 경로·권한 모델만 따르고 위치는 MQ-M5-03으로 미룸.
- 발행 산출물을 정적 zip 생성기 출력으로 한정(React zip 제외) — 원장 L31·L148 근거, 3절.
