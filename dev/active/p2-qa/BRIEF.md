# P2-QA 브리프 — 영속 트랙(P1a~P2) 마감 QA · 실화면 (읽기 전용)

- 역할 QA / Orca managed Claude Code / worktree p2-qa / base `8360d35`(P2 L1·L2·L3 병합 main). `npm ci` 완료.
- 쓰기 경로: **`dev/active/p2-qa/`만**(QA-REPORT.md · PROGRESS.md · shots/). 앱 코드·테스트·docs·lock·CLAUDE.md 수정 0 — 결함은 고치지 말고 재현 절차·증거·심각도(P1/P2/P3)로 보고.
- 정본: `docs/design/persistence/P2-SPEC.md`(머리 "Jarvis 채택 결정" 우선 — 이미지는 재인코딩 저장, 왕복 기준 = 수·localId·형식·치수 동일) 7절 AC · `P1C-SPEC.md`(쓰기 잠금은 **첫 편집 때** 잡힘 — C2) · `P1D-SPEC.md` · `dev/active/p2-l2/REPORT.md`·`p2-l3/REPORT.md`(7.2·7.3 ④ 미확정·"확인 중" 정체·"파일 1MB" 표기).

## 실측 (build + `vite preview --port 4337` · dev 금지 · 창 minimized면 normal · `captureBeyondViewport:false`+clip ≤6장 · status/alert `textContent`·`document.activeElement`·IDB 덤프를 evaluate로 증거 기록 · 이미지는 스크립트로 만든 단색 PNG만, 저장소 밖 `$TMPDIR`)
1. **실 UI 왕복(AC-P01 E 전체)**: 프로젝트(단색 PNG 1장·수동 스냅샷 1개) → `/projects` "파일로 내보내기"로 **실제 내려받기**(ego-browser `waitForEvent("download")`+`saveAs`, `$TMPDIR`) → "이 브라우저 데이터 지우기" → "프로젝트 파일 가져오기"에 **그 파일** → 요약 → 가져오기 → IM-15 1회·포커스 → 편집기: 섹션 수·스냅샷 목록·이미지 표시 · IDB 이미지 레코드 형식·치수·localId가 내보내기 전과 같음.
2. **AC-P04 다른 탭 차단(L3 ④ 재실측)**: 탭 B에서 편집기를 열고 **실제로 편집해 "이 브라우저에 저장됨"이 뜬 상태(쓰기 탭)** → 탭 A `/projects`에서 가져오기 → IM-9 alert 1회 · IDB 레코드 수·generation 불변 → B 닫기 → A 재시도 성공. 같은 조건으로 A에서 프로젝트 삭제도 차단되는지 1회(회귀).
3. **"파일을 확인하는 중…" 정체 재현 시도**: 1번·2번에서 확인 단계 소요 시간(파일 선택 → 요약 표시)을 기록. 15초 넘게 멈추면 탭 전면/배경 여부·콘솔 오류를 기록(원인 추정은 [추정] 표기).
4. **요약 "파일 크기" 표기**: 13KB 안팎 파일에서 요약이 무엇을 표시하는지 + SPEC IM-13 정의와 대조(맞음/다름).
5. **회귀 스모크**: 새로고침 뒤 모든 프로젝트 편집기 열림(AC-P05) · 손상 파일(문자 1개 삭제) IM-2/IM-4 · 내보내기 Esc 포커스 복귀.
- 끝나면 `indexedDB.deleteDatabase("design-studio")` 결과 → 자기 공간만 `finish({keep:[]})` · `listTaskSpaces()` 기록 · 서버 종료·4337 리슨 0. 영환님 창·main 5480 무접촉.

## 산출물
- `dev/active/p2-qa/QA-REPORT.md`: 항목별 PASS/FAIL/미확정 · 증거(textContent·IDB 수치·shots) · 결함 목록(심각도·재현 절차) · 영속 트랙 출시 판정 의견(차단 결함 유무).
- 금지: 코드 수정 0, Codex 금지, 서브에이전트 0, push/merge/삭제 0(테스트 IDB 삭제·앱 지우기·앱 삭제 실측 허용), 승인 실패 우회 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** 1번 결과 커밋 18턴 전 · 2번 결과 커밋 28턴 전 · 34턴부터 정리·QA-REPORT만 · QA-REPORT 38턴 전 커밋. 한국어.
