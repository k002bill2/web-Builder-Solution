# P1C-SPEC Designer 브리프 — 다중 탭 · 저장 상태 · 데이터 지우기 · 사용량 (문구·상태 명세)

- 역할 Designer / Orca managed Claude Code / worktree p1c-spec / base `88db710`(P1a·P1b 병합: 문서·이미지 로컬 영속). 쓰기 경로 **`docs/design/persistence/P1C-SPEC.md`(+ 필요 시 `P1C-MQ.md`)와 `dev/active/p1c-spec/`만** — 앱 코드 수정 0.
- 정본: `docs/decisions/ADR-007-local-persistence.md`(P1 A 결정: 기본 켜짐 + "이 브라우저에 저장됨" 상시 + "이 브라우저 데이터 지우기"(확인) + 첫 저장 1회 안내 · 3절 다중 탭 Web Locks 단일 작성자 ★ · 용량·축출 `storage.estimate()`·`persist()` · 5절 **P1c 행** · 개정 1 schemaVersion 불일치 시 미완료 잡 "다시 시도" 강등 문구), `docs/design/persistence/MQ.md`·`THREATS.md`, `docs/decisions/ADR-004-performance-budgets.md` 개정 12(**`/studio` 진입 여유 0.03KB · 미배분 0.05** — 진입에 들어가는 UI는 사실상 불가), `dev/active/persist-p1a2/REPORT.md`·`persist-p1b/REPORT.md`·`JARVIS_FINAL.md`(남은 문구 항목), 기존 디자인 정본 `docs/design/m2c-spec/`·`docs/design/m3p/SPEC.md`의 문구·상태 규칙.
- 브랜드: 제품 브랜드 신규(목업 브랜드 APFS 로고·`--apfs-*` 금지), 기존 앱 토큰·컴포넌트 재사용, 새 아이콘·새 의존성 0.

## 산출물 — P1C-SPEC.md
1. **화면 상태표**(현재 문구 → 새 문구, 위치, 조건): ① SaveStatus "이 브라우저에 저장됨"·사용량 표기 ② `/projects` 빈 상태 "새로고침하면 프로젝트가 사라집니다(서버 연결 전)"·StudioPanels/ExportAfter "이 탭에 저장돼 있습니다" 등 **로컬 영속과 어긋난 문구 전수 목록**(grep 근거 파일:행) ③ 첫 저장 1회 안내 ④ 다중 탭 읽기 전용 안내(다른 탭에서 편집 중 · 이 탭으로 가져오기 가능 여부) · BroadcastChannel 갱신 알림 ⑤ "이 브라우저 데이터 지우기" 진입 위치·확인 대화상자(지워지는 범위: 문서·스냅샷·이미지·프로필·잡 · 되돌리기 없음 · 파일 백업 유도는 P2 전이라 문구만 예비) ⑥ 저장소 불가(IDB 없음·사설 모드·축출·할당량 초과) 강등 문구 ⑦ schemaVersion 불일치 강등("다시 시도") 문구 ⑧ 떠나기 경고 조건.
2. **번들 배치 제안**: 각 UI가 진입에 드는지/조작 뒤 청크인지 — 진입 여유 0.03KB 전제, 진입 몫 0을 기본안으로. 진입이 꼭 필요한 항목은 MQ로 분리(예산 재상신 필요 표시).
3. **QA 수용 기준**(AC 번호): 탭 2개 실측 시나리오 · 지우기 후 `databases()` · 사용량 표시 단위·반올림 · 접근성(대화상자 포커스·aria-live 저장 상태).
4. **MQ**(영환님 결정 필요 항목만, 각 ★안·근거) — Jarvis가 ★안 자동 채택하므로 ★는 승인 경계(예산·엔진 계약·새 의존성·백엔드) 안의 안으로.

## 검증·운영
- Ego Lite **선택**: 현재 문구 위치 확인용 build + `vite preview --port 4339` · 창 minimized면 normal · `captureBeyondViewport:false`+clip ≤3장(`dev/active/p1c-spec/shots/`) · 끝나면 `indexedDB.deleteDatabase("design-studio")` → `finish({keep:[]})` · `listTaskSpaces()`=[] · 서버 종료. 영환님 창·main 5480 무접촉.
- 앱 코드·테스트·lock·CLAUDE.md·`docs/decisions/` 수정 0. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지. Codex 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** 턴 관리: SPEC 초안 커밋 25턴 전, 35턴부터 마감, REPORT 40턴 전. 한국어.
