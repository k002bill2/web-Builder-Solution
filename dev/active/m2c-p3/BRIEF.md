# M2C-P3 Developer 브리프 — M2c P3 결함 묶음 수정

- 역할 Developer / Orca managed Claude Code / worktree m2c-p3 / base `7125138`(M2c 완료·origin 반영). `app/node_modules` lock 그대로 `npm ci` 완료.
- 영환님 ★A(2026-10-06): M2c 백로그 정리. 병렬 레인 M2C-SPECFIX(Designer, `docs/design/**`·`docs/03-trd/**` 문서만) — 그 경로 수정 금지. **`docs/06-handoff/BACKLOG.md`도 수정 금지**(Jarvis가 병합 때 갱신).
- 기준선: vitest 227파일 2034, `/studio` 진입 127.04 · 첫 91.77, 렌더 JS 84.19 / CSS 8.80. 예산 기준선 파일 127.39.
- 근거 문서: `docs/06-handoff/BACKLOG.md` B-M2C-02·04·05·06·07, `dev/active/m2c-5-qa/REPORT.md` 5절, `dev/active/m2c-5b-qa/REPORT.md` 5절, `docs/design/m2c/SPEC.md`(2·4·8절).

## 범위 (항목별 RED 전 새 테스트 수 예측 커밋 → RED → GREEN)
1. **B-M2C-06(접근성 우선)**: "이미지 지우기" 뒤 포커스가 BODY로 유실 → 지운 뒤 같은 슬롯의 "이미지 고르기"(또는 SPEC이 정한 다음 대상)로 포커스 이동. 키보드 Enter·마우스 모두.
2. **B-M2C-07**: 지운 뒤 `role=status`가 이전 "이미지를 넣었습니다…"로 남음 → 지움 결과 문구로 갱신(SPEC 2절 상태 문구 체계 안에서, 없으면 기존 문구 톤으로 최소 문구 + REPORT에 사유).
3. **B-M2C-04**: 폭 변경(1280↔1024/768/390) 시 열어 둔 "이미지 편집" 펼침이 닫힘 → 열림 상태 유지(탭 배치 전환 시 편집 위치 유지는 가능한 범위만, 큰 구조 변경이면 멈추고 보고).
4. **B-M2C-05**: 스위치 도움말 "끄면 … 색 면으로"를 SPEC r2 4절("꺼짐 = 미디어 요소 없음·섹션 배경")에 맞춰 정정.
5. **B-M2C-02**: `app/scripts/check-bundle-size.mjs` /studio 조작 뒤 보고 목록에 ImageSlotPanel·ingest·imageStore·exportImages 표시 — **보고용 afterAction 키 추가만**(한도·판정·기준선 파일 변경 0, 판정 결과 불변을 테스트로).
- 지운 뒤 대체텍스트 유지/초기화(B-M2C-08)는 Designer 결정 대기 — **이번 레인에서 동작 변경 금지**.

## 규칙
- 예산: `/studio` 진입 >127.39 또는 다른 라우트 ±0.03, 렌더 JS 변화 발생 시 멈춤 보고. 엔진·PageDoc·렌더 계약 변경 0. SPEC 10절 밖 테스트 깨지면 멈춤(가드 약화 금지). 단언 약화·skip 0. BRIEF P0 명시 커밋.
- **Ego Lite(영환님 지시):** 4337 loopback 자기 서버, 앱 안 클릭으로 1~4를 실제 화면에서 확인(지우기 → 포커스 위치·status 글, 폭 변경 → 펼침 유지, 도움말 문구)·캡처 `dev/active/m2c-p3/shots/`. 끝나면 이 레인이 연 Ego Lite 창·탭 모두 `finish({keep:[]})`로 닫고 `listTaskSpaces()`=[] 재확인 기록, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉. 새로고침 금지.
- 새 의존성 0, package*.json/lock·CLAUDE.md·docs/**·한도 수정 0. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **턴 관리:** 50턴 도달 시 새 항목 중단 → Ego Lite → 전체 vitest → REPORT. 마감: typecheck·lint·build(번들 전 행)·전체 vitest 기본 1회 exit0(부하 타임아웃 시 단독 후 전체 1회), Codex review --scope branch --base 7125138 실제 완료(≤2), REPORT(항목별 전후·테스트·Ego Lite/창 닫힘·meta).
