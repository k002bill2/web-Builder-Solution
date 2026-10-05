# M2C-SPECFIX REPORT — 사양 결정 백로그 5건 (Designer, 문서만)

- base `7125138` · 브랜치 `k002bill2/m2c-specfix` · 2026-10-06 · 코드 0 · 서브에이전트 0 · push/merge/삭제 0

## 결과
| 백로그 | 결과 | 위치 | 구현 |
|---|---|---|---|
| B-M2B-06 | **정정 완료** — Tab 순서 = 폭 라디오 → [보는 안] → 닫기 → 스크롤 영역 → 이 안 선택(WCAG 2.1.1 근거로 현 구현이 맞음). 2.1 "버튼 = 프레임 위" 나열 오기도 정정 | `docs/design/m2b/SPEC-COMPARE3.md` r3 2.1·4 | 0 |
| B-M2B-07 | **결정: 단서 추가** — 안내 경계 상자 + 입력칸·버튼 점선 경계(`fieldset:disabled` 선택자에만, 불투명도·회색 0) | `docs/design/m2a/SPEC.md` r3 K1-6 3·K2·K-AC-37·Q-6 · `docs/design/m2b/SPEC-BODY.md` r5 | IMPL-TODO T-1(기준선 6장 의도된 변경) |
| B-M2B-08 | **원기록 작성** — 7변형 × ①~⑩: ①~⑨ PASS 62 · 주의 1(contact/form ①) · ⑩ 7건 주의(변형별 미검증) | `docs/design/m2a/SPEC.md` r3 5절 | 0 (QA T-6) |
| B-M2C-03 | **QB-10 전제 정정 완료**(새로고침 → 앱 안 편집기 이탈·복귀) · 보관 방식 재론은 **MQ-S1 ★A(유지)** | `docs/design/m2c/SPEC.md` r3 5.2·9절 · `docs/design/m2c-specfix/MQ.md` | T-5(QA 실측) · B 선택 시 T-4 |
| B-M2C-08 | **결정: 지우기·바꾸기 = 대체텍스트·장식 초기화**, 첫 넣기·잃은 이미지 다시 고르기 = 유지 | `docs/design/m2c/SPEC.md` r3 2.7 · IMG-AC-30 | IMPL-TODO T-2(M2C-P3 병합 뒤) |

## 목업·기존 사양과 다르게 한 곳
- B-M2B-07: m2a r2 "비활성도 연결 때와 같은 모양" → 점선 단서. 사유: M2B-6 QA "활성처럼 보임" 관찰 · 모양 단서 = WCAG 1.4.1. 트레이드오프(시안에서 연결 뒤 모양을 못 봄)는 m2a K1-6 3에 기록.

## 근거 수준
- L1 코드 읽기: `CompareDialog.tsx:122~158`·`CompareColumn.tsx:90~132`(DOM 순서) · `StudioLayout.tsx:282~283`(이미지 = 편집 틀 state) · `main.tsx` 28행(메모리 저장소) · `ImageSlotField.tsx:95·228~230`(교체·지우기 alt 유지) · 2a-05 E-S20(잃은 이미지 정의) · `referenceDetails.ts`/`references.ts`(⑧ 태그).
- 확인 필요(브라우저 미실측): QB-10 새 경로 · 1안씩 모드 Tab 위치 · ⑩ 변형별 동일성 → IMPL-TODO T-5·T-6.
- 기준선 캡처 2장(contact--form-390 · hero--fullbleed-left-1280)만 육안 확인. 나머지 ①~③은 M2C-5b 넘침 0 실측·M2B-6 판정 인용.

## Codex (실제 완료분만)
| 라운드 | 명령 | 결과 | 반영 |
|---|---|---|---|
| r1 adversarial | `codex-companion.mjs adversarial-review --scope branch --base 7125138 "<focus>"` | needs-attention · P2 2건: ① IMG-AC-30 "지우기 뒤 R-09 차단"은 자체 그래픽이 R-09 대상 밖이라 틀림 ② QB-10 스냅샷 보조 경로 실행 불가(`restoreSnapshot` 미구현). 그 밖: B-M2B-07 색 조합·정적 HTML 보존·E-S20 충돌 없음, QB-10 주 경로 도달 가능 | 2건 모두 반영 `9309ee5` · 원문 `codex-adv-r1.txt` |
| r2 review | `codex-companion.mjs review --scope branch --base 7125138` | 결함 0 · `git diff --check` 통과 | — · 원문 `codex-review-r2.txt` |

## 운영 확인
- Ego Lite: **미사용**(화면 확인 불필요 — 문서 근거 + 기존 기준선 캡처 인용). 연 창·탭 0 → `finish`·`listTaskSpaces` 대상 없음.
- 자기 서버 기동 0: `lsof -nP -iTCP:4337 -sTCP:LISTEN` 출력 없음(exit 1). main 5480 무접촉.
- 금지 경로 diff 0: `git diff --stat 7125138 -- app package.json docs/06-handoff docs/decisions CLAUDE.md` 출력 없음. TRD 수정 0(필요 없었음).

## 영환님 결정 필요
- **MQ-S1**(`docs/design/m2c-specfix/MQ.md`): 잃은 이미지 보관 방식 — ★A 지금 유지 / B 이미지 맵 탭 수명 / C 문서+이미지 영속(ADR).
