# PERSIST-ADR 브리프 — 문서 영속 설계(ADR 초안 + MQ), 코드 0

- 역할 Designer(아키텍처 문서) / Orca managed Claude Code / worktree persist-adr / base `b0b26cf`(origin 반영). 코드·의존성 변경 0, 화면 확인 필요 시에만 build+preview.
- 영환님 ★A(2026-10-07): 다음 = 문서 영속 ADR(설계만). 문제: 지금 프로젝트·문서·스냅샷·이미지·프로필이 **탭 메모리 저장소**(`memoryProjectRepository`·`memoryDocBook`·`useSnapshots`·이미지 저장소 등)라 새로고침·탭 닫기 시 모두 사라짐(BACKLOG B-M2C-03, M2c MQ-C2, ER MQ-R1-A "탭 메모리 스냅샷").
- 기존 결정 존중: `docs/decisions/ADR-001~006`, `docs/03-trd/TRD.md`, `docs/02-prd/PRD.md`(영속·계정·보안 관련 요구), `docs/design/m2c/`(이미지 8MB 상한 B-M2C-01·보관 방식 MQ-C2), `docs/design/editor-rest/MQ.md` R1, ADR-004 예산(`/studio` 진입 128.51/판정선 128.58 — 여유 0.07).

## 1단계 — 현재 사실 (L1, 코드·문서 grep)
- 저장소 인터페이스 목록(프로젝트·문서·스냅샷·이미지·프로필·비교 보드·카탈로그 저장 상태)과 각 구현이 메모리인지, 저장소 경계(인터페이스 vs 구현)가 교체 가능한 형태인지, 데이터 크기(문서 JSON·이미지 data URL/Blob·스냅샷 수 상한), 직렬화 형식·버전 필드 유무, 동시성(STALE_DOC·resolveConflict) 규칙.

## 2단계 — 산출 (쓰기: `docs/design/persistence/`, `dev/active/persist-adr/`만)
1. `docs/design/persistence/ADR-007-DRAFT.md` — 후보 비교(최소 3안, 사실/추정 구분):
   - (a) 브라우저 로컬 영속(IndexedDB, 이미지 Blob 포함) — 서버 0·계정 0, 기기 1대 한정, 용량·축출(eviction)·`navigator.storage.persist()`·스키마 버전 이행.
   - (b) 로컬 우선 + 파일 내보내기/가져오기(프로젝트 묶음 파일) — 백업·이동 수단.
   - (c) 서버 영속(계정·API·DB·객체 저장소) — 다기기·공유, 인증·권한·개인정보·비용·운영. 영환님 기존 인프라(`~/Work/shared-infra` PostgreSQL 등)는 **이 저장소와 연결하지 않는다는 독립 저장소 원칙(ADR-001)**과의 관계 명시.
   - 각 안: 사용자 가치, 데이터 모델·마이그레이션, 보안(XSS 시 로컬 데이터 노출·이미지 개인정보·sandbox iframe `allow-scripts` 경계), 번들 영향(`/studio` 여유 0.07 — 저장소 코드는 조작 뒤/지연 배치 계획), 새 의존성 여부(예: idb 래퍼 — 없이 가능한지), 테스트 전략(fake-indexeddb는 새 의존성 → MQ), 단계적 도입 순서, 되돌리기.
   - **추천안 1개**(★)와 단계(Phase) 계획.
2. `docs/design/persistence/MQ.md` — 영환님 결정 항목만(번호 선택지 ★추천·트레이드오프). **새 의존성·백엔드·계정·외부 서비스·개인정보 처리·예산 변경은 반드시 MQ.**
3. `docs/design/persistence/THREATS.md` — 추천안 기준 위협 목록 짧게(자산·위협·완화·잔여 위험) — 이후 Security 레인 입력용.
4. `dev/active/persist-adr/{PROGRESS,REPORT}.md`.

## 금지·운영
- 코드·package*.json/lock·CLAUDE.md·`docs/decisions/`·BACKLOG 수정 0(ADR은 초안 위치에만 — 확정은 영환님 결정 뒤 Jarvis). 외부 서비스 가입·네트워크 호출 0. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- Codex adversarial/review 1라운드는 **Jarvis가 마감 때 실행** — 이 레인은 하지 않음.
- 화면 확인이 필요하면 Ego Lite(build+`vite preview --port 4337`, 창 minimized면 normal, `captureBeyondViewport:false`+clip, 앱 안 클릭만) 후 `finish({keep:[]})`·`listTaskSpaces()`=[]·서버 종료. 필요 없으면 생략하고 REPORT에 "Ego Lite 미사용(문서 레인)" 기록.
- **첫 3턴 안에 BRIEF P0 커밋.** **턴 관리:** 1단계 사실표는 20턴 전 커밋, 35턴부터 새 조사 중단·산출물 마감, REPORT 초안 40턴 전 커밋. 한국어.
