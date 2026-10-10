# RESTART-SPEC REPORT — B-ER-01 프로필 "새로 시작"(EQ-2 A) UI 설계

- 역할 Designer · base `18e5e12` · 코드 변경 0 · 로컬 커밋만(push·merge 0)
- 산출물: `docs/design/restart/SPEC.md`(r1) · `docs/design/restart/MQ.md`(MQ-S1~S5) · `dev/active/restart-spec/PROGRESS.md` · 이 파일

## 결론
1. **계약 판정**: 저장소 `restart`(`app/src/data/memoryDocBook.ts:369-406`)가 "새로 시작 전" 자동 스냅샷 + 문서 교체(revision +1) + 멱등 기록을 한 커밋으로 이미 한다. SPEC 흐름은 기존 인터페이스(`startDoc`·`restoreSnapshot`) 안에서 가능. **예외 1건**: 다른 탭 잠금 사전 확인(MQ-S2 ★A)은 `memoryProjectRepository` restart 경로의 내부 순서 변경(인터페이스·스키마 불변).
2. **진입점**: "X안으로 편집 시작" 그대로. `DOC_EXISTS`이고 안이 다를 때만 대화상자(EQ-2 A 두 버튼). 같은 안·다른 버전 = 이동 + "테마 바꾸기" 안내. 진입 바이트 0(MQ-S1 ★A).
3. **기존 문서 처리**: 화면은 스냅샷을 만들지 않는다 — 저장소가 같은 커밋에 만든다. 자동 20개 규칙에 들며 오래된 자동을 밀어낼 수 있음(문구가 "모두 보존"을 약속하지 않음).
4. **되돌리기**: 편집기 스냅샷 "새로 시작 전" 복원 → 안·버전까지 원복(`memoryDocBook.ts:312`).
5. **대비 미통과 → 통과 버전**: 같은 안 = 테마 바꾸기(내용 보존, 권장), 다른 안 = 새로 시작 + 대화상자 대비 한 줄(MQ-S3 ★A).

## 새로 찾은 사실 (L1)
- 잠금 없는 탭의 `startDoc`은 메모리 commit **뒤** flush가 INFRA → 탭 메모리와 IDB가 갈라진다(`memoryProjectRepository.ts:65-66` · `localSync.ts:187-190`). create에도 같은 구조(별건 — MQ-S2 C).
- 옛 문서 이미지는 스냅샷 참조로 남아 지워지지 않는다(`persistence/imageRecord.ts:23-24` · `imageOps.ts:29`).
- 새로 시작하려는 버전은 "3안 만들기"가 끝나 있어야 한다(`NOT_FOUND`, `memoryDocBook.ts:125-131`).

## 목업과 다르게 한 곳
- 목업에 프로필 "새로 시작" 화면 없음 → CompareDialog·SnapshotDialog `<dialog>` 패턴을 따름(ADR-003 DS 일관성).
- RS-D1~D3: EQ-2 A의 진입 때 두 버튼 → 누른 뒤 대화상자(예산 사유) · 2a-05:583 `DOC_EXISTS` 이동 → 다른 안이면 대화상자.

## 서브에이전트
- Explore #1(코드 경로, 읽기 전용): 완료 — startDoc 판정·보존·복원·프로필 화면·잠금·번들 시나리오·대비 게이트 보고. SPEC 2절·9절에 반영.
- Explore #2(SPEC·QA 기록, 읽기 전용): 완료 — EQ-2 원문·8.3.1 화면 처리·P1D 보존·잠금 개정·번들 수치 출처 보고. 태그 체계([U]/[G]/[E]) 결정에 반영.

## 검증
- 코드 변경 0이라 typecheck·lint·test·build 대상 없음(문서만).
- Codex adversarial-review r1(`codex-companion.mjs adversarial-review --scope branch --base 18e5e12`): verdict **needs-attention**, P1 1 · P2 3 — 전부 이번 diff 대상 → SPEC r1(`4a4a6ad`)에 반영:
  - P1 이탈 저장 미보장 → RS-R6 재작성 · R-D2 "이 저장 기준" · RS-AC-08c · MQ-S5(수정은 별건 BACKLOG 후보)
  - P2 커밋 뒤 실패를 미실행으로 단정 → "쓰기 전 거부"/"커밋 뒤 미확인" 분리 · R-E4 · RS-AC-08b
  - P2 잠금 해제 뒤 재시도 vs `stale` → R-E2b(다시 시도 없음) · RS-AC-08 갈래 추가
  - P2 복원 진입 132.68 누락 → 9절·RS-AC-13 두 시나리오 각각 판정
  - Codex가 확인한 일치 사항: 이미지 보존·자동 20개 정리 주장
- **Codex r2는 실행하지 않음** — 60분 시간 상한(r1 소요 약 6분 + 반영). r1 반영분은 미검증 상태다.

## 열린 것 · 필요한 결정
- MQ-S1~S5 회신(권장: 전부 A).
- BACKLOG 후보 등록(Jarvis — 이 레인은 BACKLOG 수정 0): ① 편집기 이탈 전 `flushed()` 확인(MQ-S5) ② create 경로의 잠금 없는 탭 갈라짐(MQ-S2 C).
- Codex r2로 SPEC r1 재검증. 회신 뒤 Developer 레인 착수 가능.
- 예산 수치(`/profile` 진입 직후 한도 해석, `/studio` +0.01~0.03)는 추정 L3 — Developer 레인에서 실측.
