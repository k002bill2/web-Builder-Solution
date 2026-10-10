# FIELD-UNDO-1 PROGRESS

- base main `b3f8894` · 브랜치 `k002bill2/field-undo-1` · `npm ci` exit 0 · lock 변경 0
- 기준선 실측(base 빌드): `/studio` 129.28 · 복원 132.31 · `/profile` 99.87 · docEngine 조작 뒤 +3.44(2개 파일)
- 서브에이전트: 사용 안 함 — 조사 대상(useSectionOps·opAfter·undoStack·EditFields·테스트 2건)이 메인 컨텍스트에 이미 있어 재적재 비용이 더 큼(글로벌 위임 상한). 결과 0건.

## 체크포인트

- [x] ① 묶음·사슬 FU-AC-1~7 — ①②③ 한 커밋 `67026a5`(시간 예산: 단언 2건이 구현과 같이 바뀌어야 tip이 GREEN)
- [x] ② 참조·거절·IME·탭 FU-AC-8~12 — `67026a5`
- [x] ③ 단언 변경(SPEC 6절 2건)·예산 FU-AC-14~16 — `67026a5` · /studio 129.55 · 복원 132.58
- [ ] ④ Ego FU-QB-1·2 — BLOCKED: /profile "3안 만들기" 대기 타임아웃으로 /studio 진입 실패, 90분 예산 안 보정 불가(REPORT 1절)
- [x] ⑤ 게이트 4종 exit 0 · vitest 2678 통과 · REPORT 작성 · Codex r1 실행(REPORT 5절)
- [x] Codex r1 P2 4건 반영 — RESUME-1에서 처리(아래 RESUME-1 절)
- [ ] FU-QB-3(실제 한글 IME) — BLOCKED: 범위 밖, 영환님 수동 1회 필요

## 설계 메모

- 진입(useSectionOps): 열린 묶음 ref `{key,label,base,after}` · `field()`(편집 경계 → docRef 같은 틱 → 키 바뀌면 앞 묶음 닫기) · `held`에 base 포함 · 로드된 청크 ref.
- 조작 뒤 청크(opAfter → docEngine): `fieldTyped`(600ms 타이머 · 조합 중 타이머 없음 · 묶음 첫 입력에 focusout 1회 리스너 = blur 닫기) · `closeField`(push · 내용 같으면 기록 0 + 문서 참조 복귀).
- 닫힘 호출(최종): 600ms · focusout · 다른 key · run 본문(before 캡처 전) · step 본문 · 언마운트 = 버림. 미리보기·충돌 앞 명시 닫기는 예산 이동(MQ-F4 A)으로 제거 — REPORT 6절.

## TDD 기록 (RED 예측 → 결과)

- FU-AC-1·4·7·10·11(훅): RED 예측 "ops.field 없음 TypeError" → 결과 7/7 TypeError → GREEN 7/7
- FU-AC-2·3·5·6·10·12·16(컴포넌트): RED 예측 "Ctrl+Z가 필드를 되돌리지 않음" → 결과 7/7 실패(값 그대로·알림 없음) → GREEN 7/7
- 기존 단언 2건(SPEC 6절): 구현 뒤 예측대로만 실패(전체 2/2675 실패) → 6절 문장으로 변경 → 2678/2678
- FU-AC-9 단위·컴포넌트: 기존 동작 고정용 이동 단언 — 바로 GREEN(무효화 규칙 자체는 변경 없음)
- 예산: 1차 129.59(초과) → MQ-F4 A 1회 이동 → 129.52 → lint(react-hooks/refs) 수정 뒤 129.55(한도와 같음)

## RESUME-1 (2026-10-11)

- [x] ① P2-3 기록 밖 교체 뒤 묶음 재사용 금지 — 커밋 `b04c9df`
- [x] ② P2-4 focusout 리스너 누적 해제 — `b04c9df`
- [x] ③ P2-2 compositionend 타이머 재개 — `b04c9df`
- [x] ④ P2-1 청크 로딩 중 칸 이동 분리 — `b04c9df`(진입 증가 0으로 반영)
- [x] ⑤ 게이트 4종 · 예산 · Codex r2 — typecheck·lint·build exit 0 · vitest 2682/2682 · Codex r2 진행 중
- [ ] ⑥ Ego FU-QB-1·2 재시도
- [ ] ⑦ REPORT "RESUME-1" 절

- 4건 한 커밋 사유: 넷 다 청크 `fieldTyped` 시그니처·본문(묶음 분리 판정 · 리스너 · 타이머) 한곳을 바꿔 따로 GREEN이 될 수 없음. amend·rebase 금지라 기록으로 대신.
- 설계: 칸 바뀜·교체 판정을 진입에서 청크로 이동 — 진입은 입력마다 `fieldTyped(rec, composing, key, label, base, next)`만 부르고, 청크가 `key` 다름 또는 `base !== (o.seen ?? o.base)`면 앞 묶음을 앞 입력 문서(`seen`)까지로 닫고 새 묶음을 연다. 진입의 `engine` ref·`closeField` 호출 제거.
- TDD RED 예측 → 결과 (모두 예측대로 실패 → GREEN)
  - P2-1(훅): 같은 틱 제목→부제 = 라벨 "Hero 제목 편집"으로 합쳐짐 → 실패 동일 → GREEN
  - P2-2(훅): 조합 중 입력 뒤 compositionend + 600ms = 기록 undefined → 실패 동일 → GREEN
  - P2-4(훅): 타이머로 닫힌 묶음 5회 뒤 focusout 리스너 5 남음 → 실패(5 ≠ 0) → GREEN(0 · 열린 묶음 1 · 언마운트 0)
  - P2-3(컴포넌트 `FieldUndo.test.tsx`): 충돌 "다른 편집 불러오기" 뒤 같은 칸 입력 → Ctrl+Z = "첫 편집"(교체 전 문서) → 실패 동일 → GREEN(불러온 제목·부제 유지)
- 예산 실측: `/studio` 129.55 → **129.54** · 복원 132.58 → **132.57** · docEngine 조작 뒤 +3.67 → +3.77(판정 밖) · `/profile` 99.87(첫 화면)
