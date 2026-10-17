# M4-a-3 AppSec PROGRESS

대상 tip `a834eb88` (브랜치 `k002bill2/m4a-appsec`). 시작 2026-10-18.

- [x] 0. BRIEF·PROGRESS 커밋
- [x] 0b. REPORT 초안(잠정 판정) 커밋
- [x] 1. zip 작성기 (`features/studio/zip/**`) — 경로·zip-slip·CRC/크기·결정적 시각·상한
- [x] 2. 금지 패턴 검사 F-09~F-15 — 퍼즈 표(임시 테스트, 되돌림)
- [ ] 3. `09c4309d` 집중 검토 (+ Codex adversarial-review 1회)
- [x] 4. 참조 직렬화 신뢰 경계 (iframe ↔ 부모)
- [x] 5. LICENSES.md·OFL.txt 주입 경로
- [x] 6. CSP/sandbox 정합
- [ ] 7. 최종 판정·REPORT 확정
- [ ] 8. 마감: 임시 테스트 되돌림 확인 · `git status --short` 빈 값 · preview 미기동(포트 0)

## 서브에이전트
- code-explorer 1개(읽기 전용) — 항목 1·5·파일명 검토 완료. 결과 L-3·L-4·L-6·I-3 반영, 핵심 주장 메인 재확인.

## 로그
- e20e3c73 BRIEF·PROGRESS · 891c25f7 REPORT 초안 · 42f006d4 퍼즈·변이 로그
- 퍼즈 54+4건(임시 테스트 2개 실행 후 삭제) · 09c4309d 되돌림 변이(복원, git diff 빈 값) · clean() 패치 임시 검증(116 tests 통과, 복원)
- Codex 1회차 오발(--help가 focus로 처리 → working-tree 리뷰) · 2회차 09c4309d 대상 실행 중
