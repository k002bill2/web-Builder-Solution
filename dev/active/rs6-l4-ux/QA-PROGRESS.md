# RS6-L4 QA PROGRESS

대상: `k002bill2/rs6-l4-ux` tip `fd49cb24` · 시작 2026-10-17 · 브리프 `QA-BRIEF.md`

- [ ] 0 QA-BRIEF·QA-PROGRESS 커밋
- [ ] 1 버튼↔코어 1:1 · 거짓 saved/confirmed/discarded 0 · 확인 없는 폐기 0 · 다른 탭 덮어쓰기 0 · DISCARD_GIVE_UP_MS
- [ ] 2 stale 전환(① failed+stale) · 자동 재시도 덮어쓰기 0 · 탭 닫기 경고 · /projects 행(L5) 정합 · ConflictCallout/resolve 도달 0
- [ ] 3 L5 병합 정합(coreIo.ts·saveCore.ts) — 읽기 전용 서브에이전트 1
- [ ] 4 변이 5종(매번 git checkout -- app/) → 각 FAIL
- [ ] 5 접근성(role·aria-busy·aria-disabled·alertdialog·포커스·alert 중복·status 1회)
- [ ] 6 Ego Lite 실화면 (a)(b)(c)(d)(e) + 정리(IDB 삭제·finish·listTaskSpaces·서버 종료·리슨 0)
- [ ] 7 fresh 게이트(build·예산 129.13/132.11/raw 130.5·typecheck·lint·test)
- [ ] 8 QA-REPORT 초안 커밋(40턴 전)
- [ ] 9 QA-REPORT 최종 커밋 · 판정 보고

## 로그
