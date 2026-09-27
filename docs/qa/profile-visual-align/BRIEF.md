# QA-PROFILE-VISUAL-ALIGN — 프로필 정리본 키보드·접근성 독립 검증 (읽기 전용)

- 책임 QA / 실행 Orca + Claude Code. 보고 대상 Jarvis. 대상: 이 worktree `profile-visual-align` HEAD(구현 `8b9476c`, 기준 main `5562dc2`). 포트 4345.
- 코드 수정 금지. 쓰기는 `docs/qa/profile-visual-align/`만. 구현 워커가 55턴 한도로 키보드 검증을 못 남겼다(`dev/active/profile-visual-align/tab-1280-*.txt`·`keyboard-flow.txt` 0바이트).

## 수행 (이 순서, 앞 항목 먼저 커밋)
1. `cd app && npm run build && npx vite preview --host 127.0.0.1 --port 4345 --strictPort` (자기 PID 기록). 흐름: /catalog → 레퍼런스 담기 → /compare 확정 → /profile/:id → "3안 만들기" → B안 선택.
2. 1280×900: 페이지 시작부터 Tab을 눌러 **포커스 순서 전체**를 `docs/qa/profile-visual-align/tab-1280.txt`에 기록(순번 · role · 접근 이름). 기대: 헤더 → h1 영역 링크("비교 보드에서 선택 바꾸기") → 왼쪽 패널(값 전체 보기 → 팔레트 값 보기 → 대비 상세 → 보정값 쓰기 → 전역 조정 → 버전) → 생성된 3안(카드별 이 안 선택·상세) → 편집 시작 → 3안 비교 표 보기. 보이는 순서와 어긋나거나 포커스가 안 보이는 곳 = 결함.
3. 디스클로저 3종(값 전체 보기·팔레트 값 보기·대비 상세)과 카드 "상세"를 Enter·Space로 열고 닫기, `aria-expanded` 변화 기록.
4. "보정값 쓰기" 키보드 실행 → 확인 흐름·알림(role=status/alert)·포커스 위치 기록(값 적용은 확인 단계에서 취소해도 된다).
5. 팔레트 칩 5개: 접근 이름 또는 보이는 캡션으로 역할 이름이 전달되는지(색 단독 아님) 확인.
6. 390×844: Tab 순서가 한 열 흐름과 같은지 앞 15개만 기록.
- `docs/qa/profile-visual-align/REPORT.md`: 판정 PASS/PARTIAL/FAIL, 항목별 결과, 결함(재현 절차·기대/실제), 미검증. 증거 파일 경로.
- 끝: 자기 PID만 종료 + `lsof -nP -iTCP:4345 -sTCP:LISTEN` 결과 기록. 로컬 커밋(`git commit -- docs/qa/profile-visual-align`). push·병합·삭제 금지.
- 서브에이전트 분할: 불필요. 10턴 안에 REPORT 골격 먼저 커밋.
