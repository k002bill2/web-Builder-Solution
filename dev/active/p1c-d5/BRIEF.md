# P1C-D5 Developer 브리프 — 첫 저장 1회 안내 + P1c 통합 실측(같은 탭 지우기)

- 역할 Developer / Orca managed Claude Code / worktree p1c-d5 / base `eae7ba4`(P1c D1~D4 전부 병합). `app/node_modules` lock 그대로 `npm ci` 완료.
- 정본: `docs/design/persistence/P1C-SPEC.md` **1.4(첫 저장 1회 안내 — 위치·문구·`meta.firstSaveNotice`·같은 status 문장에 이어 붙임·강등이면 추가 0) · 3절 번들 · 4절 AC-C11 · 6절 D5 행**, ADR-007 개정 2·보충, `dev/active/p1c-d4/JARVIS_FINAL.md`(미실측 이관 항목), `dev/active/p1c-d2/REPORT.md`(싱크·큐 도장 — `meta` 쓰기는 큐 경유 → 세대 +1 불변식 유지).
- SPEC 1.4 [확인 필요]: J-S11 확정 결과 UI가 `/compare` 자동 closure 밖인지 실측 — 밖이면 그 청크에, 안이면 `/compare` 여유(현재 122.62 / 125) 안에서 실측 보고.

## 범위 (1건 구현 + 통합 실측)
1. **첫 저장 1회 안내**: 보드 확정 성공 결과 status 문장 뒤에 SPEC 1.4 문구를 이어 붙임(새 라이브 영역 0). 1회 판정 = IDB `meta` `firstSaveNotice`(확정 트랜잭션 뒤 별도 put, 실패해도 확정 성공 — 다음 확정에 한 번 더). 지우기 뒤 첫 저장에 다시 안내(meta가 함께 지워짐). memory(강등)면 추가 0. `meta` 쓰기는 기존 쓰기 큐 경유(모든 IDB 쓰기 = 세대 +1 불변식 깨지 않기 — writerLock·최신성 확인과 충돌 없는지 테스트).
2. **P1c 통합 Ego Lite(핵심 증거)** — D4에서 이관된 미실측 포함: build + `vite preview --port 4337`(dev 금지), 창 minimized면 `Browser.setWindowBounds normal`, `captureBeyondViewport:false`+clip ≤4장(`dev/active/p1c-d5/shots/`). 시나리오 한 흐름으로: `/references/ref-a` 상세 "비교 추가" → 보드 → 프로필 확정 → **첫 저장 안내 문장 확인(AC-C11)** → 3안 → A안 편집 → 제목 편집 "이 브라우저에 저장됨" → 앱 안 이동 `/projects` → **같은 탭에서 "이 브라우저 데이터 지우기" → 성공(거짓 "다른 탭 편집 중" 0) · "이 브라우저 데이터를 지웠습니다" 1회 · `databases()` 결과** → 다시 보드 확정 → **첫 저장 안내 다시 1회**. 끝나면 `indexedDB.deleteDatabase("design-studio")` 결과 기록 → `finish({keep:[]})` · `listTaskSpaces()` 결과 · 서버 종료·4337 리슨 0. 영환님 창·main 5480 무접촉.

## 검증
- TDD(예측 PROGRESS, RED 테스트 tip 커밋 금지, 단언 약화·skip 0, **amend·rebase 금지**). 1회 판정 · 지우기 뒤 재안내 · put 실패해도 확정 성공 · 강등 추가 0 · status 문장 1개 · 세대 불변식.
- 번들 관문: `/compare` ≤125 · `/studio` ≤129.65 · 복원 ≤132.68 · `/projects` ≤125. 넘으면 멈추고 보고.
- 마감: typecheck·lint·build exit 0 · 전체 vitest 1회 exit 0 · REPORT. **Codex는 Jarvis 몫.**

## 금지·운영
- 엔진·PageDoc 계약·docs/**·lock·CLAUDE.md 수정 0, 새 의존성 0, P1d·P2 범위 0. 서브에이전트 0, push/merge/삭제 0(테스트 IDB 삭제·앱 지우기 실측 허용), 승인 실패 우회 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** 턴 관리: 구현 커밋 22턴 전, Ego Lite 25턴 전 시작(실측 결과를 38턴 전 커밋), 42턴부터 게이트·REPORT만, REPORT 초안 46턴 전 커밋. 한국어.
