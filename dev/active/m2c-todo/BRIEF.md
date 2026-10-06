# M2C-TODO Developer 브리프 — IMPL-TODO T-1(비활성 폼 시각 단서) · T-2(지우기·바꾸기 대체텍스트 초기화)

- 역할 Developer / Orca managed Claude Code / worktree m2c-todo / base `83c06e5`(M2C-SPECFIX·M2C-P3 병합). `app/node_modules` lock 그대로 `npm ci` 완료.
- 기준선(Jarvis M2C-P3 검증): vitest 227파일 2041, `/studio` 진입 127.07 · 첫 91.76, 렌더 JS 84.19 / CSS 8.80. 예산 기준선 파일 127.39.
- 입력: `dev/active/m2c-specfix/IMPL-TODO.md` T-1·T-2(목록), 정본 = `docs/design/m2a/SPEC.md` r3 K1-6 3·K-AC-37, `docs/design/m2b/SPEC-BODY.md` r5 B1-11 3·KD-AC-20, `docs/design/m2c/SPEC.md` r3 2.7·IMG-AC-30. 참고 `dev/active/m2c-p3/REPORT.md`(지운 뒤 status "이미지를 지웠습니다" — T-2 상태 문장은 이것과 통일, 두 문장 공존 0).

## 범위
1. **T-1**: `kit.css`에 `.kit-fieldset:disabled` 하위 규칙 1블록(입력칸·버튼 점선 경계, 안내 경계 상자 — 정본 그대로). 불투명도·회색·새 토큰·스크립트 0. 렌더 CSS 증가 기록(≤30 · 수십 B 예상). `ContactForm.test.tsx` 62행 "비활성 모양 = 연결됐을 때와 같은 모양" 테스트는 정본 개정에 따른 **이름·뜻 개정 + `:disabled` 블록 단언 추가**(기본 규칙 단언은 유지). 묶음 블록 border 금지 가드(`ContactBooking.test.tsx` 81~85행)는 그대로 통과.
2. **T-2**: 이미지 지우기·바꾸기 성공 시 같은 `setSlot` 1회로 `alt:""`·`decorative:false` + 상태 문장. 첫 넣기·잃은 이미지 다시 고르기·실패·스위치 끄기는 유지. 게이트 R-09 코드 변경 0. M2C-P3의 지운 뒤 포커스·status 동작 불변.
- 시각 회귀 기준선 재생성은 QA 몫(contact--form·contact--booking × 3폭 = 의도된 변경) — 이 레인은 변경 사실만 기록.

## 규칙
- TDD: 항목별 RED 전 새 테스트 수 예측 커밋 → RED → GREEN, RED 로그 `dev/active/m2c-todo/logs/`. 단언 약화·skip 0(T-1 테스트 개정은 정본 근거와 함께 REPORT에). BRIEF P0 명시 커밋.
- 예산: `/studio` 진입 >127.39·다른 라우트 ±0.03·렌더 JS 변화 시 멈춤. 엔진·PageDoc·렌더 계약 변경 0. SPEC 10절/IMPL-TODO 예상 밖 테스트 깨지면 멈춤.
- **Ego Lite(영환님 지시):** 4337 loopback 자기 서버, 앱 안 클릭으로 ① 문의/예약 섹션의 비활성 폼 점선·안내 상자(1280·390) ② 이미지 넣기 → 대체텍스트 입력 → 바꾸기/지우기 → 대체텍스트 빈칸·장식 해제를 실제 화면에서 확인·캡처 `dev/active/m2c-todo/shots/`. 끝나면 이 레인이 연 Ego Lite 창·탭 모두 `finish({keep:[]})` · `listTaskSpaces()`=[] 재확인 기록, 자기 서버 종료·리슨 0. 새로고침 금지, 영환님 창·main 5480 무접촉.
- 새 의존성 0, package*.json/lock·CLAUDE.md·docs/**·scripts 수정 0. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **턴 관리:** 45턴 도달 시 새 구현 중단 → Ego Lite → 전체 vitest → REPORT. 마감: typecheck·lint·build(번들 전 행)·전체 vitest 기본 1회 exit0(부하 타임아웃 시 단독 후 전체 1회), Codex review --scope branch --base 83c06e5 실제 완료(≤2), REPORT(항목별 전후·테스트·CSS 증가·Ego Lite/창 닫힘·meta).
