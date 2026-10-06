# M3P-4 QA 브리프 — M3′ 조합 생성기 + 카드 실렌더 썸네일 실화면 검수

- 역할 QA / Orca managed Claude Code / worktree m3p-4-qa / base `b756b50`(M3P-0·1·2·3·3b 병합, ADR-004 개정 7 적용). `app/node_modules` lock 그대로 `npm ci` 완료. **코드 수정 0 — 결함은 고치지 않고 기록.**
- 정본: `docs/04-plan/M3P_PLAN.md` **4절 QA 게이트 1~8 그대로**, `docs/design/m3p/SPEC.md` 8.1 AC-B1~B5 · 8.2 QB-M3P-01~06 · 11절(구현 반영 메모).
- 쓰기: `docs/qa/m3p/`(REPORT.md 1개 재사용 + 캡처)와 `dev/active/m3p-4-qa/`만.

## 순서 (B-QA-01 — 항목당 15턴 이상 확보, 문서 1개 재사용)
1. build + `vite preview --port 4337`(dev 금지). Ego Lite 새 taskSpace → 창 minimized면 normal. 첫 goto 1회(`/catalog`) 뒤 **앱 안 클릭·스크롤만**, 새로고침·주소창 이동 금지.
2. AC-B1(1280 첫 줄·레이아웃 이동 0) → AC-B3(업종 필터 5종 ≥ 4) → AC-B5(resource 목록: 같은 출처 `thumbs/*.svg`·앱 청크만) → AC-B2(768·390 위쪽 기준 잘림, `setDeviceMetricsOverride`) → AC-B4(생성 카드 → 상세 → 비교 추가 → 보드 → 프로필 확정).
3. QB-M3P-01~06 관찰 기록. **Jarvis 관찰 반영**: QB-01에 "21장 hero 문구가 모두 '일상에 꼭 맞는 서비스를 만듭니다'로 같아 보임" 확인 — 같은 문구 카드 수·업종별 차이 유무를 수치로(가능하면 SVG 텍스트를 같은 출처 fetch로 세기). QB-06은 시간이 남을 때(생성 레퍼런스 1개로 3안 → 편집기).
4. 캡처: `captureBeyondViewport:false`+뷰포트 clip(fullPage 금지), 장수 최소(≤10) `docs/qa/m3p/`.
5. 판정표: AC-B1~B5 PASS/FAIL/미검증(N/A를 PASS로 쓰지 않음) · QB 관찰 · FAIL·관찰은 BACKLOG 후보로 REPORT에(BACKLOG 수정은 Jarvis). 종합 Go/조건부 Go/No-Go.

## 정리·금지
- 끝나면 `clearDeviceMetricsOverride` → 이 레인 창·탭 `finish({keep:[]})` · `listTaskSpaces()`=[] 재확인 · preview 종료 · 4337 리슨 0 기록. 영환님 창·main 5480 무접촉.
- vitest 생략. 앱 코드·docs(qa/m3p 밖)·lock·CLAUDE.md 수정 0, 외부 사이트 접속 0. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** 항목마다 증거 커밋. **턴 관리:** 40턴 도달 시 새 측정 중단 → 창 닫기 → REPORT. REPORT는 마지막 5턴 전 커밋.
