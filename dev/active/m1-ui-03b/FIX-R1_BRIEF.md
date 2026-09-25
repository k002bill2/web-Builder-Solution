# M1-UI-03b 보완 — Codex R1 회귀 테스트 + 결정 Q1~Q3 + aria-disabled 표시

- 작성: Jarvis · 2026-09-26 KST · 책임 역할: Developer / 실행 환경: Orca + Claude Code
- 턴 예산 **40** · 항목마다 로컬 커밋 · `PROGRESS.md` 갱신 · 30턴을 넘기면 새 작업을 멈추고 `REPORT.md` 갱신 후 커밋
- 영환님 결정(2026-09-26 Slack 선택 1). 이 파일 범위 외 변경 금지.

## 1. Codex R1 수정 3건 회귀 테스트 (`5297948`)
각 건마다: 테스트 작성 → **수정 코드를 일시적으로 되돌려 RED 확인**(출력 한 줄 기록) → 원복 GREEN. 테스트 이름에 `Codex R1` 포함.
1. [P1] 확정 실패 안내의 "다시 시도"가 실패 당시가 아니라 **현재** saver 상태로 확정 가능 여부를 검사한다(저장 중이면 차단).
2. [P2] 카탈로그에서 추가·빼기 직후 `/compare` 진입 시, 진행 중인 트레이 요청이 끝난 뒤(`whenIdle`) 보드를 조회한다.
3. [P2] 저장 중 열을 빼고 앞 저장이 STALE로 서버 선택에 맞춰진 경우, 옛 로컬 선택이 아니라 서버 선택 기준으로 뺀다.

## 2. Q1 — 번들 검사 (ADR-004 개정)
- 기존: 라우트별 **첫 화면 정적 합계 ≤ 100KB**(유지).
- 추가: 라우트별 **진입 직후 자동 로드 포함 합계 ≤ 125KB**를 참고 출력이 아니라 **실패 조건**으로 바꾼다(`check-bundle-size.mjs`).
- RED: 한도를 일시적으로 120으로 낮춰 `/compare`(120.51KB)가 실패하는 것 확인 후 원복.

## 3. Q2 — 변경 없는 재확정 차단 (SPEC S-15·S-16 준수)
- v1 확정 후 선택·사용자 값이 **바뀌지 않았으면** "새 버전으로 확정" 버튼을 보이지 않거나 `aria-disabled` + 이유 "확정한 뒤 바뀐 내용이 없습니다".
- 바뀌면(S-16) 기존대로 v2 확정. 비교 기준은 확정 시점 스냅샷과 현재 picks·custom의 깊은 비교(03a `buildProfileDraft` seed 비교 활용 가능).
- 테스트: 변경 없음 → 호출 0회, 변경 후 → `createProfileVersion` 1회.

## 4. Q3 — 사용하지 않는 코드 제거
- `compareTray.ts#addToTray`·`removeFromTray`와 이것만 검사하던 테스트를 함께 삭제. 다른 곳에서 쓰지 않는지 grep으로 확인. 테스트 수 감소는 REPORT에 기록.

## 5. "레퍼런스 추가" 비활성 표시
- 6개 가득 참(`aria-disabled`)일 때 확정 버튼과 같은 비활성 시각 스타일(토큰만). 누르면 `COMPARE_LIMIT_NOTICE`는 그대로.

## 검증
```bash
cd app && npm run typecheck && npm run lint && npm test -- --run && npm run build
```
- 번들 출력 두 기준 모두 보고. Codex 재리뷰는 하지 않는다(Jarvis 수행).

## 금지
범위 밖 변경, `design/`, push·원격·`main` 커밋, `--dangerously-skip-permissions`, 0.0.0.0 바인딩(브라우저 확인 불필요)

## 보고
`REPORT.md`에 "보완(FIX-R1)" 절 추가: 항목 1~5 완료 여부, RED 출력 3+1+α줄, 번들, 테스트 수 변화, 커밋 해시. 이 브리프 파일도 커밋.
