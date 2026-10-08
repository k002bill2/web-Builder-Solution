# P2-SPEC Designer 브리프 — 파일 묶음 내보내기·가져오기 (문구·상태·형식 명세)

- 역할 Designer / Orca managed Claude Code / worktree p2-spec / base `6009271`(P1a~P1d 병합·push). 쓰기 경로 **`docs/design/persistence/P2-SPEC.md`(+ 필요 시 `P2-MQ.md`)와 `dev/active/p2-spec/`만** — 앱 코드 수정 0.
- **병렬 레인:** ENTRY-SLIM(Developer, `/studio` 진입 감량 — 앱 코드만)이 동시에 진행. 이 레인은 docs만 쓰므로 겹침 0.
- 결정 정본(확정, 다시 묻지 않음): `docs/decisions/ADR-007-local-persistence.md` 결정 요약 **P0 A (b) 파일 묶음 내보내기·가져오기(P2)** · **P4 A(JSON 1개 + 이미지 base64, 새 의존성 0)** · 5절 P2 행 · 개정 1~3 · P1c·P1d 완료 기록. `docs/design/persistence/MQ.md` P4(최악 약 80MB [추정]·메모리 피크) · `THREATS.md`(가져오기 = 신뢰할 수 없는 입력 — 검증·크기 상한·이미지 MIME/디코드) · `P1C-SPEC.md`·`P1D-SPEC.md`(대화상자·status·포커스·탭 잠금 규칙 재사용).
- 기존 코드 확인 필수 [L1]: 지금 있는 "내보내기"(`export-*` 탭 메모리 — 렌더 HTML 내보내기)와 이름·위치가 겹치지 않게 구분 · `persistence/` 봉투 `SCHEMA_VERSION` 1·`entryRead` 검증기 재사용 가능성 · 2a-05 5.9 이미지 한도(24개·60MB/프로젝트) · `writerLock`·`tabLockHold`·`seq`(가져오기 시 id 충돌 → 새 id 발급 규칙).
- 예산: **`/studio` 진입 129.65 / 멈춤 >129.65 · 복원 132.68 — 여유 0** · `/profile` 첫 화면 99.87 / 100 · `/projects` 104.86 / 125. P2 UI는 `/projects` 조작 뒤 청크가 기본 — 진입 몫 0, `/studio`·`/profile` 진입 0.

## 산출물 — P2-SPEC.md
1. **범위 결정**: 단위(프로젝트 1개 / 전체 브라우저 데이터 — ★ 근거) · 진입 위치(`/projects` 행 액션 · 저장소 영역) · 파일명·확장자 규칙.
2. **파일 형식**: 최상위 봉투(형식 이름·형식 버전·앱 schemaVersion·내보낸 시각) · 레코드(state 일부·docs·images base64·메타) · 내보내지 않는 것(잠금·generation·firstSaveNotice·탭 메모리 보드/보관함) · 형식 버전 정책(미래 버전 = 거절 문장).
3. **가져오기 규칙**: 검증 순서(크기 상한 → JSON 파싱 → 봉투 → 레코드 형태 → 이미지 디코드/MIME/한도) · id 충돌(항상 새 id 발급 vs 덮어쓰기 — ★ 근거, `seq`와의 관계) · 한 트랜잭션 쓰기 · 다른 탭 쓰기 탭 차단 · 성공 뒤 새로고침 여부(P1c·P1d 패턴) · 강등(memory)·저장 불가에서의 동작.
4. **화면 상태표**: 내보내기(만드는 중·성공·실패 · 큰 파일 경고) · 가져오기(파일 선택·검증 실패 사유별 문장·차단·진행·성공 status·포커스) · 문구 일람 · 접근성(modal `close()` 먼저 · alert key 패턴).
5. **번들 배치**: 모든 항목 진입 몫 0 근거(파일 생성·파싱·base64는 버튼 뒤 지연 import).
6. **QA AC**: 왕복(내보내기 → 지우기 → 가져오기 = 문서·스냅샷·이미지 동일) · 손상/미래 버전/한도 초과 거절·쓰기 0 · id 충돌 · 다른 탭 차단 · Ego Lite 실측 항목(단색 PNG만).
7. **Developer 레인 분할**(레인당 1~2건 · 병렬·파일 겹침 표시 · 턴 한도 대응).
8. **MQ**(결정 필요한 것만, ★안·근거 — ★는 예산·엔진 계약·새 의존성·백엔드 경계 안).

## 검증·운영
- Ego Lite **선택**(현재 `/projects` 행·저장소 영역 위치 확인) — build + `vite preview --port 4339` · 창 minimized면 normal · `captureBeyondViewport:false`+clip ≤3장 · 끝나면 `indexedDB.deleteDatabase("design-studio")` → 자기 공간만 `finish({keep:[]})` · `listTaskSpaces()` 기록 · 서버 종료. 영환님 창·main 5480 무접촉.
- 앱 코드·테스트·lock·CLAUDE.md·`docs/decisions/` 수정 0. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지. Codex 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** 턴 관리: SPEC 초안 커밋 22턴 전, 32턴부터 마감, REPORT 36턴 전 커밋. 한국어.
