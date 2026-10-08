# P1D-SPEC Designer 브리프 — 스냅샷 보존·삭제 · 프로젝트 삭제 · 단조 카운터 (문구·상태 명세)

- 역할 Designer / Orca managed Claude Code / worktree p1d-spec / base `b8660aa`(P1a·P1b·P1c 병합·push). 쓰기 경로 **`docs/design/persistence/P1D-SPEC.md`(+ 필요 시 `P1D-MQ.md`)와 `dev/active/p1d-spec/`만** — 앱 코드 수정 0.
- 결정 정본(이미 확정, 다시 묻지 않음): `docs/decisions/ADR-007-local-persistence.md` 1절 **P3 A**(수동 스냅샷 삭제(확인) · 자동 스냅샷 프로젝트당 최근 20개 보존(오래된 자동부터 정리) · 단조 카운터 id) · **P8 A**(프로젝트 삭제 — 확인 대화상자 · 문서·스냅샷·이미지·프로필 계열 함께 · 되돌리기 없음 · 단조 카운터) · 3절 `meta` 단조 순번 카운터 · 5절 **P1d 행**("삭제 뒤 id 재발급 0 테스트") · 개정 2·보충 · P1c 완료 기록. `docs/design/persistence/MQ.md` P3·P8 · `P1C-SPEC.md`(대화상자·포커스·status 규칙 재사용 — 지우기 대화상자 `ClearDataDialog` 패턴) · `THREATS.md` T3.
- 예산(ADR-004 개정 12 · P1c 완료 기록): `/studio` 진입 129.62 / 130(판정선 129.65 — 여유 0.03) · 복원 진입 132.65 · **`/profile` 첫 화면 99.87 / 100** · `/projects` 104.47 / 125 · `/compare` 122.73. 진입에 드는 UI는 사실상 불가 — 진입 몫 0 기본, 필요하면 MQ.
- 브랜드: 기존 앱 토큰·컴포넌트 재사용, APFS 로고·`--apfs-*` 금지, 새 아이콘·새 의존성 0.
- 2a-05 SPEC 5.11(스냅샷 상한·삭제 없음) 개정 필요 문단은 **SPEC에 "바뀌는 문서" 목록으로만**(행 번호) — 2a-05 본문 수정은 Jarvis 몫.

## 산출물 — P1D-SPEC.md
1. **화면 상태표**: ① 스냅샷 대화상자(편집기 — 조작 뒤 청크) 수동 스냅샷 "삭제" 진입·확인 대화상자·결과 status · 자동 스냅샷 표시(삭제 버튼 없음?·"최근 20개만 보관" 안내 위치) · 자동 정리 시점(새 자동 스냅샷 저장 트랜잭션 안)·정리로 이미지 참조가 풀리면 이미지도 참조 집합 규칙대로 정리 ② `/projects` 프로젝트 삭제 진입(행 단위 — 기존 목록 UI 재사용)·확인 대화상자(지워지는 범위: 문서·스냅샷·이미지·프로필 계열/3안 — 다른 프로젝트와 공유되는 프로필 계열이 있으면? 현재 데이터 모델에서 공유 여부를 코드로 확인해 규칙 확정)·결과 status·삭제 중 다른 탭이 그 프로젝트를 편집 중일 때(D2 잠금·D4 cleared 패턴 재사용 — 다른 탭 편집 중이면 차단 alert) ③ 단조 카운터: 대상 id 종류(project·profile·snapshot·이미지)·`meta` 키·이행(기존 `length+1` 데이터에서 카운터 초기값 = 현존 최대+1) ④ 저장소 불가·강등(memory)에서 삭제 동작 ⑤ 접근성(대화상자 포커스·Esc·포커스 복귀 — P1c D4 교훈: modal `close()` 먼저).
2. **번들 배치**: 모든 항목 진입 몫 0(스냅샷 대화상자·`/projects` 행 액션은 조작 뒤 청크) — 근거. 진입 필요 항목은 MQ.
3. **QA AC 번호**: 삭제 뒤 id 재발급 0(ADR P1d 행) · 자동 21번째 저장 시 가장 오래된 자동 1개 정리 · 수동은 자동 정리 대상 아님 · 프로젝트 삭제 뒤 IDB 레코드(docs·images `projectId/` 접두·state) 0 · 다른 탭 편집 중 차단 · 포커스.
4. **Developer 레인 분할**(턴 한도 대응 — 레인당 1~2건, 병렬 가능 표시·쓰기 파일 겹침).
5. **MQ**(결정 필요한 것만, ★안·근거 — ★는 예산·엔진 계약·새 의존성·백엔드 경계 안).

## 검증·운영
- Ego Lite **선택**(현재 스냅샷 대화상자·`/projects` 목록 위치 확인용) — build + `vite preview --port 4339` · 창 minimized면 normal · `captureBeyondViewport:false`+clip ≤3장 · 끝나면 `indexedDB.deleteDatabase("design-studio")` → `finish({keep:[]})` · `listTaskSpaces()`=[] · 서버 종료. 영환님 창·main 5480 무접촉.
- 앱 코드·테스트·lock·CLAUDE.md·`docs/decisions/` 수정 0. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지. Codex 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** 턴 관리: SPEC 초안 커밋 22턴 전, 32턴부터 마감, REPORT 36턴 전 커밋. 한국어.
