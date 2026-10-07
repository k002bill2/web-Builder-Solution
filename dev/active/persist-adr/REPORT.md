# PERSIST-ADR REPORT — 문서 영속 설계(코드 0)

- 역할 Designer · worktree `persist-adr` · 브랜치 `k002bill2/persist-adr` · base `b0b26cf` · 2026-10-07

## 1. 결론

★ **(a) 브라우저 IndexedDB 로컬 영속(문서·스냅샷·이미지 함께) → (b) 프로젝트 파일 묶음 내보내기·가져오기 → (c) 서버는 별도 ADR.** 서버·계정·새 의존성 0으로 새로고침 소실(B-M2C-03)을 푼다. 저장소 인터페이스는 바꾸지 않는다. 결정 항목 8개는 `docs/design/persistence/MQ.md`(P0~P7)에 정리했다.

## 2. 산출물 (커밋)

| 파일 | 커밋 |
|---|---|
| `dev/active/persist-adr/BRIEF.md`·`PROGRESS.md` (P0) | `0214ea2` |
| `dev/active/persist-adr/FACTS.md` — 1단계 사실표 | `322566f` |
| `docs/design/persistence/ADR-007-DRAFT.md` | `46ae76c` |
| `docs/design/persistence/MQ.md` | `c103a41` |
| `docs/design/persistence/THREATS.md` | `4af4248` |
| `dev/active/persist-adr/REPORT.md` | 이 커밋 |

## 3. 핵심 사실 (L1, 설계를 가른 것)

1. 저장소 경계 4개는 비동기 인터페이스 + 동적 import 구현 → 구현만 교체 가능. 단 공유 `StudioStore.transact`는 **동기** → 메모리 store 유지 + 하이드레이션 + 비동기 직렬 기록 방식으로 설계.
2. `memoryProjectRepository`의 "DocBook 청크 받기 전 = 문서 없음" 불변식 → 하이드레이션이 DocState까지 채운 뒤 첫 읽기.
3. 순번 id(`profile-N`·`snapshot-N`) → 다중 탭 영속 시 충돌 → Web Locks 단일 작성자 ★.
4. PageDoc에 저장 형식 버전 없음 → 레코드 봉투에 `schemaVersion`(엔진 계약 불변).
5. 이미지 메타는 `WeakMap<Blob>` → Blob 옆에 메타 함께 저장. 변형본은 재인코딩이라 EXIF 미보관.
6. 스냅샷 상한·삭제 없음 → 영속 시 무한 누적 → MQ-P3.
7. `/studio` 진입 128.51 / 판정선 128.58(여유 0.07) → KB 추정 대신 P1-E0 실측 관문(MQ-P5).
8. ADR-001 독립 저장소 → shared-infra 재사용은 ADR-001 개정 필요(MQ-P7 C).

## 4. 검증

- 금지 범위: `git diff --stat b0b26cf -- app CLAUDE.md docs/decisions docs/06-handoff/BACKLOG.md` → **출력 없음(exit 0)** — 코드·lock·CLAUDE.md·ADR·BACKLOG 변경 0.
- 전체 변경: `git diff --stat b0b26cf` → `dev/active/persist-adr/*` · `docs/design/persistence/*`만.
- 문서 레인이라 typecheck·lint·test·build는 실행하지 않음(코드 변경 0).
- **Ego Lite 미사용(문서 레인)** — 화면 확인 불필요. 서버 기동 0.
- **Codex 미실행** — BRIEF대로 Jarvis 마감 몫.
- 외부 네트워크·서비스 0 — 브라우저 할당량·축출·`storage.persist()`·Web Locks 동작은 [L3 확인 필요]로 표기.
- 서브에이전트 0 · push/merge/삭제 0 · main5480 무접촉.

## 5. 남은 일·차단

- **영환님 결정 필요**: MQ-P0~P7 (회신 예 "P0 A · P1 A · … · P7 A").
- Jarvis: Codex review/adversarial 1라운드 · 확정 시 `docs/decisions/` 이동 · ADR 번호 확정(`REF-LLM-PIPELINE_BRIEF.md:178`이 ADR-007을 다른 제목으로 제안만 함).
- 규모 추정(a 1.5~2.5주 · b 0.5~1주)은 L3 수준 — 레인 BRIEF에서 재측정.

## 6. 목업과 다른 점

- 해당 없음(문서 레인, 화면 변경 0).
