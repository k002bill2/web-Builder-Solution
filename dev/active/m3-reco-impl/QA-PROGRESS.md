# M3-1 QA PROGRESS — 1차(정적·회귀)

대상 tip `62d3aec2` · 브리프 `QA-BRIEF.md` · 보고 `QA-REPORT.md` · 2차 계획 `QA-LIVE-PLAN.md`

- [x] 0. QA-BRIEF·QA-PROGRESS 커밋
- [x] 1. fresh typecheck·lint·test(361/3212)·build · 예산 표 재현
- [x] 2. 결정성·근거 T-REC-01~05 + 변이 3종(동점 뒤집기 / 품질 순위 포함 / 파생 표 1행 변경) → FAIL 확인
- [x] 3. 승인 전 변경 0 · 저장 뒤 성공 · 되돌리기 세션 유지 · 뒤 적용 실패 시 앞 기록 보존 + 변이 2종 → FAIL 확인
- [x] 4. 로드 조건 변이 1종(정적 import) → FAIL 확인
- [x] 5. 바뀐 기존 단언 이전/이후 표(약화 0) · RECO-AC-01~17 판정표
- [x] 6. QA-LIVE-PLAN.md 작성
- [x] 7. QA-REPORT 초안(잠정 판정) → 최종 판정
- [x] 8. 마감: `git status --short` 빈 값 · 변이 전부 되돌림 확인

## 기록
- 서브에이전트 0(브리프 항목이 순차 의존 — 같은 작업 트리에서 변이를 하나씩 적용·되돌림해야 해 병렬 불가).
- 임시 worktree `/tmp/qa-m3-main`(main `36e825a6` 비교 빌드) — 빌드 뒤 `git worktree remove` 완료.
- 변이 9종(브리프 6 + 경계 3) 매번 `git checkout` 되돌림 · 변이 build 뒤 원본 재빌드 exit 0(100.46 일치).
- 판정: PASS with notes(QA-REPORT 0절). 2차 실화면 run = QA-LIVE-PLAN.md.

# 2차(실화면) — 브리프 `QA-BRIEF-LIVE.md` · 계획 `QA-LIVE-PLAN.md` · 대상 tip `d59455d8`

- [x] L0. QA-BRIEF-LIVE·QA-PROGRESS 커밋
- [x] L1. 0절 준비: build · preview 4399 · 리슨 확인 · QA-REPORT 8절 골격
- [x] L2. 0′절 실패 상태 먼저: E4(화면 청크 차단) · E5(적용 청크 차단)
- [ ] L3. 1절 주 흐름 1280 (#1~#11)
- [ ] L4. 1절 주 흐름 390 (#1~#11 · 가로 넘침 0)
- [ ] L5. 2절 E1·E2·E3·E6·E7·E8 (1280 + 390 스크린샷)
- [ ] L6. 판정: 2차 + 종합 1줄을 QA-REPORT 첫머리에
- [ ] L7. 마감: preview 종료·리슨 0 기록 · IDB 삭제·finish({keep:[]}) · `git status --short` 빈 값
