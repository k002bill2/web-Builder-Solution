# RS5-INTEGRATE-PLAN REPORT — 저장 코어 제품 연결 설계·계획

- 브랜치 `k002bill2/rs5-integrate-plan` · base `c7a7a2a8`. 쓰기 = `docs/design/restart/INTEGRATE-6.md` · `docs/04-plan/RS6_INTEGRATE_PLAN.md` · `docs/design/restart/MQ-6.md` · `dev/active/rs5-integrate-plan/`만.
- 앱 코드·ADR·예산 파일·SPEC/CONTRACT-5/UX-5·BACKLOG 변경 0 · 구현·측정 0 · Codex 0 · push 0 · 새 의존성 0. 실화면 확인 0(PASS 주장 없음).

## 1. 결론

1. **연결 방식**: 코어 상태기 + `LocalSync` 포트(★ MQ-6-1 A). 코어를 그대로 import하면 레코드 형식(`core-doc`/`core-image`)·문서별 세대·별도 직렬 체인이 제품과 충돌하고, 다른 탭 `fresh()`가 코어 쓰기를 못 보는 H4 회귀가 생긴다(I6 6.1).
2. **BD-1**: 제품 경로에서는 같은 탭 어댑터가 1개다(`openIdbPersistence` 호출 1곳 · 공유 로더 · `main.tsx:30` 1회). 단 타입이 아니라 구조 관례라 import 가드 [G]로 고정한다. 조건부 IDB 쓰기(G3)는 불필요(탭 수명 배타 잠금).
3. **H4**: 세대 검사는 잠금 획득 때 `fresh()` 1회, 증명은 확인 때마다 `verify`. 코어 쓰기는 반드시 `write → queue.submit → committed` 경로(도장·cleared·saved 전송 유지).
4. **liveness**: 취소 0 · 시간 제한은 표시 전환만 · 자동 재시도 0. LV-2는 포기 토큰(MC I7 변경 → MQ-6-3). 저장 정지 시 지금은 링크 이동까지 고착되는데, 코어가 탭 수명이라 링크 이탈은 저장 대기를 없앤다.
5. **CP4는 RS6에 흡수**(★ MQ-6-4 A). 바이트 상쇄는 같은 스파이크에서 대체 코드 제거를 실측할 때만 인정.
6. **예산**: 여유 정규화 0.44KB · raw 0.60KB. 기존 실측 연결안은 전부 여유 밖, 코어 자체는 미측정 → **L0 측정 관문이 모든 구현 레인보다 먼저**.

## 2. MQ 목록 (`docs/design/restart/MQ-6.md`)

| ID | 질문 | ★ |
|---|---|---|
| MQ-6-1 | 연결 방식·인터페이스(LocalSync 포트 +5, ProjectRepository 접근자 +1) | A 포트 |
| MQ-6-2 | 화면 상태 출처(view + 포트 mode 병행 vs view 확장) | A 병행 |
| MQ-6-3 (+3b) | liveness 규칙 · MC I7 변경 · 시간 값 결정 시점 | A 감시+포기 토큰 · 값은 QA 실측 뒤 |
| MQ-6-4 | CP4 흡수 | A 흡수 |
| MQ-6-5 | 코어 메서드 없는 버튼 3개 | A 기존 메서드 + `replace` 조합 |
| MQ-6-6 | 예산(L0 뒤에만) | A 수치 나온 뒤 판정 |

- 새 의존성: 필요 없음(결정 항목 아님 — I6 0절).

## 3. 측정 선행 항목 (L0 — `RS6_INTEGRATE_PLAN.md` 1절)

- S6-base(128.09/129.40 재현) → S6a(하한) → S6b(편집기 배선 = CP4 흡수판) → S6c(대체 코드 제거 상쇄) → S6d(UNAPPROVED 조건 참 lazy) + `/profile`·`/projects`·`/catalog` 첫 화면 동시 기록.
- 판정선 정규화 128.53/131.51 · raw 한도 130/134, 둘 다. 감량 1회 뒤 초과면 중단 → MQ-6-6.

## 4. 사실 / 추정 / 미확인

- **사실(L1)**: 코어·포트 경계 충돌 6건(I6 6.1) · IDB 여는 곳 1곳 · 같은 탭 직접 IDB 쓰기 3곳(전부 멈춤 뒤 새로고침) · revision 올리는 다른 쓰기 5곳(I6 6.4) · 저장 경로 타임아웃·취소 0 · 저장 정지 시 링크 고착 · CP4는 main에 없음(패치만) · 현재 예산 수치·기존 실측 수치.
- **추정(L3)**: 레인 시간(합계 20~31시간) · 깨질 테스트 목록(I6 11절) · 같은 탭 직접 IDB 쓰기와 코어 save가 시간상 겹치지 않음(RS6-AC-U10으로 확인 예정).
- **미확인/미측정**: 코어 바이트 · 시간 값(`T_slow`·`T_hang`·`T_discard`) · 실제 IDB에서 제품 포트 결과 · 실화면 전부.

## 5. 서브에이전트별 결과 (읽기 전용 Explore 3개, 병렬)

| # | 범위 | 결과 | 반영 |
|---|---|---|---|
| ① | 코어 API·불변식 ↔ 제품 저장 경로 · BD-1 · H4 | 레코드·세대·직렬·cleared·잠금 충돌 표 · BD-1 "사실상 보장, 강제 장치 없음" · 같은 탭 직접 IDB 쓰기 3곳 · H4 = 잠금 + meta gen | I6 0·1·2·4·6.1·6.2 |
| ② | 편집기 생명주기·스케줄러·pendingWrites·CP4·liveness | 훅 층 유일 저장 호출 `useDocSave.ts:69` · revision 올리는 다른 쓰기 5곳 · CP4 패치만, 겹침 파일 4개 · 저장 정지 시 링크 고착 · `pagehide` 0 | I6 3·5·6.3~6.5·7·11 |
| ③ | 예산 실측·진입 closure | 여유 0.44/0.60 · CP4 +0.80 · S5a-r +417B/S5b +753B(다른 base) · 진입/조작 뒤 모듈 구분 · 재실행 도구 | I6 9 · 계획 1절 |

- 경로 정정(②): `docs/design/restart/rs4-cp4*`는 없음 — 실제 `dev/active/rs4-cp4/REPORT.md`.

## 6. 자체 검토 1회 (반영함)

- D6-3 표기 정정 · I6 이미지 GC delete와 코어 "delete op 0" 차이 명시 · BD-1 판정에 같은 탭 직접 IDB 쓰기 예외(6.2) 연결.
- 금지 경로 diff: `git diff --stat c7a7a2a8 -- app docs/decisions docs/06-handoff/BACKLOG.md docs/design/restart/{CONTRACT-5,UX-5,SPEC-4}.md dev/active/backlog-rs-status` 빈 출력.
- advisor: 1차(작성 전) 호출은 rate-limit으로 실행되지 않음. 2차(마감 전) 검토 실행 → 반영 4건: ① 문서 필드 작성자 = 코어·스냅샷 = DocBook 단일화 + 포트 `commit` 레코드 변형 + `conflicted` 판정 출처 정정(I6 5절 G1·8.1) ② RS6-AC-U1 3분류(이식/잠금 기반 대체/폐기) + D6-3을 MC 변경으로 MQ-6-1에 명시 ③ D6-9 링크 이탈 차이 추가 ④ MQ-6-7(결정 아님) 제거 → I6 0절 · L0 선행 조건을 "★A 가정으로 결정 전 착수"로.

## 7. 필요한 것

- 영환님/Jarvis: MQ-6-1·6-3 결정(L1 착수 전제) · L0 측정 레인 발주 여부.
- 독립 검토: 이 설계는 Codex·QA 미검토다(BRIEF 범위). 회수 뒤 별도 QA 권장.
