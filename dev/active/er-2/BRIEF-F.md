# ER-2F Developer 브리프 — 테마 바꾸기 마감 (ADR-004 개정 5 적용)

- 역할 Developer / Orca managed Claude Code / worktree er-2(재사용) / 브랜치 `k002bill2/er-2`.
- Jarvis 준비: main `ddcc111`(ER-3a 병합 · ADR-004 개정 5 `5078690`)을 브랜치에 병합 → WIP `k002bill2/er-2-wip-bundle`을 병합(테스트 파일 2개 modify/delete 충돌은 WIP 판으로 해결). 즉 **연결 코드가 지금 브랜치에 있다**. 이전 REPORT·PROGRESS는 이 브랜치 `dev/active/er-2/`.
- 영환님 2026-10-06 "B, A": ADR-004 개정 5 — `/studio` 진입 한도 129KB(멈춤선 128.70) · 편집기 잔여 기준선 128.40(판정선 128.43) · 다른 화면 해시 잡음 폭(결정 3). 정본 `docs/decisions/ADR-004-performance-budgets.md` 개정 5절.

## 순서
1. **개정 5 적용 커밋(첫 커밋, 메시지에 "ADR-004 개정 5")**: `app/scripts/check-bundle-size.mjs`의 `/studio/:projectId` `eagerBudgetKb` 128 → 129와 그 주석, `app/scripts/m2cBaseline.json`의 `eagerKb` 127.36 → 128.40 · `base`·`note` 갱신. **검사기 로직(`bundleBudget.mjs`) 변경 0.** 관련 테스트(`bundleBudget.test.mjs` 등)가 숫자를 고정하고 있으면 숫자만 맞춤(단언 약화 0). 이 커밋 외 scripts 수정 0.
2. 병합 상태 검증: typecheck·lint·`src/test`·studio 표적·build. ER-3a 저장소 변경과의 충돌·회귀 확인.
3. 남은 AC 마감(`docs/design/editor-rest/SPEC.md` r1 5.1 T2~T7·5.4 G1): REPORT 2절 BLOCKED 항목을 PASS로. ER-AC-T4 Ctrl+Z는 ER-4 범위(유지). 기존 설계 차이(ER-D6 등) 유지.
4. **Ego Lite(영환님 지시):** `npm run build` + `npx vite preview --host 127.0.0.1 --port 4337 --strictPort`(dev 금지), 경로 A(ref-e·밝은 카드)로 문서 만들기 → 테마 대화상자 열기 → 버전 선택 → 적용(캔버스 색·알림) → 되돌리기 → 새 버전 캡션 · 대비 줄 행동을 1280·390에서 실제 화면 확인·캡처 `dev/active/er-2/shots/`. 첫 goto 1회 뒤 앱 안 클릭만·새로고침 금지. 시작 전 `listTaskSpaces()` 확인(space id 직접 기입). 끝나면 이 레인이 연 창·탭 모두 `finish({keep:[]})` · `listTaskSpaces()`=[] 재확인 기록, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.
5. 마감: 번들 표 전 행(`/studio` 진입 ≤128.43, 다른 화면 ±0.03 또는 개정 5 결정 3 근거, 렌더 변화 0) · 전체 vitest 기본 1회 exit0(부하 실패 시 단독 후 전체 1회) · Codex review --scope branch --base ddcc111 실제 완료(≤2, 연결 코드 첫 리뷰) · REPORT 갱신(마감 절 추가: AC 판정·번들·Ego Lite/창 닫힘·meta).

## 금지
- 엔진 소스·PageDoc 계약 변경 0, `app/src/data/**` 수정 0(ER-3a 병합분), docs/**·package*.json/lock·CLAUDE.md 수정 0. 새 의존성 0. 단언 약화·skip 0. **RED 테스트를 tip에 커밋 금지**(예측 커밋은 테스트 수 기록만).
- `/studio` 진입 >128.43이면 즉시 멈춤(추가 빌드 시도 금지).
- 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **턴 관리:** 45턴 도달 시 새 수정 중단 → Ego Lite → vitest → REPORT.
