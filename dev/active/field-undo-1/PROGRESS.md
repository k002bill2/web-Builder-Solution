# FIELD-UNDO-1 PROGRESS

- base main `b3f8894` · 브랜치 `k002bill2/field-undo-1` · `npm ci` exit 0 · lock 변경 0
- 기준선 실측(base 빌드): `/studio` 129.28 · 복원 132.31 · `/profile` 99.87 · docEngine 조작 뒤 +3.44(2개 파일)
- 서브에이전트: 사용 안 함 — 조사 대상(useSectionOps·opAfter·undoStack·EditFields·테스트 2건)이 메인 컨텍스트에 이미 있어 재적재 비용이 더 큼(글로벌 위임 상한). 결과 0건.

## 체크포인트

- [x] ① 묶음·사슬 FU-AC-1~7 — ①②③ 한 커밋 `67026a5`(시간 예산: 단언 2건이 구현과 같이 바뀌어야 tip이 GREEN)
- [x] ② 참조·거절·IME·탭 FU-AC-8~12 — `67026a5`
- [x] ③ 단언 변경(SPEC 6절 2건)·예산 FU-AC-14~16 — `67026a5` · /studio 129.55 · 복원 132.58
- [ ] ④ Ego FU-QB-1·2 — BLOCKED: /profile "3안 만들기" 대기 타임아웃으로 /studio 진입 실패, 90분 예산 안 보정 불가(REPORT 1절)
- [x] ⑤ 게이트 4종 exit 0 · vitest 2678 통과 · REPORT 작성 · Codex r1(REPORT 5절)
- [ ] FU-QB-3(실제 한글 IME) — BLOCKED: 범위 밖, 영환님 수동 1회 필요

## 설계 메모

- 진입(useSectionOps): 열린 묶음 ref `{key,label,base,after}` · `field()`(편집 경계 → docRef 같은 틱 → 키 바뀌면 앞 묶음 닫기) · `held`에 base 포함 · 로드된 청크 ref.
- 조작 뒤 청크(opAfter → docEngine): `fieldTyped`(600ms 타이머 · 조합 중 타이머 없음) · `closeField`(push · 내용 같으면 기록 0 + 문서 참조 복귀) · `listenHistory`에 focusout(= blur 닫기).
- 닫힘 호출: run 본문(before 캡처 전) · step 본문 · undoLast · edit 바뀜(미리보기 열기/닫기) · 충돌 해결 시작(StudioLayout choose) · 언마운트 = 버림.

## TDD 기록 (RED 예측 → 결과)

- FU-AC-1·4·7·10·11(훅): RED 예측 "ops.field 없음 TypeError" → 결과 7/7 TypeError → GREEN 7/7
- FU-AC-2·3·5·6·10·12·16(컴포넌트): RED 예측 "Ctrl+Z가 필드를 되돌리지 않음" → 결과 7/7 실패(값 그대로·알림 없음) → GREEN 7/7
- 기존 단언 2건(SPEC 6절): 구현 뒤 예측대로만 실패(전체 2/2675 실패) → 6절 문장으로 변경 → 2678/2678
- FU-AC-9 단위·컴포넌트: 기존 동작 고정용 이동 단언 — 바로 GREEN(무효화 규칙 자체는 변경 없음)
- 예산: 1차 129.59(초과) → MQ-F4 A 1회 이동 → 129.52 → lint(react-hooks/refs) 수정 뒤 129.55(한도와 같음)
