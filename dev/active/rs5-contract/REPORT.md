# RS5 CONTRACT-5 — REPORT

- 성격: **기술 계약 설계만**(사용자 최신 1 승인 범위). 앱·interface·예산·SPEC/ADR 변경 0, 구현 착수 0, 측정 0, merge/push 0.
- base `467a691`(앱 `93f8111`) · 브랜치 `k002bill2/rs5-contract` · 산출물 `docs/design/restart/CONTRACT-5.md`.
- 회수: 책임 Jarvis → 승인 요청. 상위 UX는 회수 뒤 Designer.

## 1. 추천 계약 (1줄)

**저장소 인스턴스가 소유하는 프로젝트별 "저장 장부(SaveLedger)"** — 편집 세대 `draftSeq` · 메모리 커밋 head · 불변 스냅샷(문서+hash+이미지 Blob 묶음) · 진행 중 요청 · 확인 세대를 한곳에 둔다. `confirm()` 성공 = 그 세대 문서와 참조 이미지 전부가 같은 IDB 트랜잭션 `oncomplete`(또는 이미 커밋된 이미지). memory 모드 = `memory-only`(영구 확인 0). 확인과 시작 재시도 분리. 새 스키마 0. (CONTRACT-5 0·2·3절)

## 2. 변경 범위 (제안 — 실행 승인 아님)

공개 `ProjectRepository.ledger` 1 · 내부 `LocalSync.confirm`/`mode` · `imageOps` 엄격 모드 · 저장소 `call`/`kept` 장부 갱신 · 화면 훅 `useAutosaveScheduler`(seed·dispose 노출·`unconfirmed`)·`useDocSave`(revision 출처·adopt)·`StudioLayout`(images seed). 표 = CONTRACT-5 2.5. SPEC-4의 "훅 인자 1건"보다 크다(숨기지 않음).

## 3. 기존 결함 매핑 (CONTRACT-5 6.2)

- 새 계약 해결: Q1 · Q2/C3 · Q3 · Q4 · Q6 · Q7a · Q7b · Q8 · C1 · C2 · `adopt` 덮어쓰기(설계).
- 부분/상위 UI 명세 필요: Q5(POP은 해결, 새로고침·주소·닫기는 안전층 + 문구) · 이미지 ingest 중 이탈.
- 미확인: Q7c(create seq 주입 영향) · 프로젝트 삭제 시 images prefix 정리.

## 4. 새 결정 (회수 대상)

① 소유자 = 저장소 장부 ② 편집기 밖 확인이 초안 커밋 가능(편집기가 hash·binding 동봉) ③ 확인/시작 재시도 분리, R-E5 무커밋은 재판정 ④ 참조 이미지 미기록 = 제출 전 실패(현 `imageOps.ts:23-25` 동작 변경) ⑤ 새 스키마 0 ⑥ `deleteSnapshot(p,"")` 확인 차용 폐기 ⑦ (r0.1) 미확인 초안이 있는 문서 교체 = 항상 충돌 선택 ⑧ (r0.1) 하이드레이트 확인 증명 조건.
대안 B(SPEC-4 보정형)와 비교 = CONTRACT-5 5절.

## 5. 번들

실측만 인용(rs4-measure): S1r 129911/132944(판정선 초과 · 절대 한도 안) · S2 130818/133850 · S3 130368/133401(`/studio` 둘 다 초과 · 복원은 판정선만 초과) · pending 131163/134196(둘 다 초과, UNAPPROVED). 판정선 129900/132940 ≠ 절대 130000/134000. **CONTRACT-5 증분 = 미측정**, 후속 스파이크 S5a~c 방법은 CONTRACT-5 8.3. 측정 0 · 상향 0.

## 6. 서브에이전트 결과

| 에이전트 | 범위 | 결과 | 산출 |
|---|---|---|---|
| code-explorer A (읽기 전용) | 저장큐·이미지 원자성 | 완료 — `imageOps` 조용한 skip · 하이드레이트 미제출(Q4) · 메모리 선커밋 확인, 미조사: 삭제 시 이미지 정리 | `logs/trace-a-persistence.md` |
| code-explorer B (읽기 전용) | UI 세대·수명 | 완료 — dispose 디바운스 소실 · `adopt` 덮어쓰기 · ingest 중 이탈 · StrictMode | `logs/trace-b-ui-lifecycle.md` |

메인이 핵심 행(`localSync`·`writeQueue`·`imageOps`·`memoryProjectRepository`·`useDocSave`)을 직접 대조했다.

## 7. Codex adversarial-review (1회)

- 명령: `node ~/.claude/plugins/cache/openai-codex/codex/1.0.6/scripts/codex-companion.mjs adversarial-review --scope branch --base 467a691 "<CONTRACT-5 집중 문장>"` — 1회 · `--help` 0 · 대상 커밋 `871c121`(r0). 원문 `logs/codex-a1.txt`(시작 시각 `logs/codex-a1.started`) · exit=0.
- 결과: **needs-attention · high(P1) 3**. Codex 실행 테스트 0(읽기 전용 대조).

| ID | 지적 | 판정 | r0.1 반영 |
|---|---|---|---|
| a1-1 | I8이 디바운스 중 일반 편집을 보호하지 않음 — publish는 저장 시작·cleanup뿐, `beforeunload`는 cleanup보다 먼저 판정 | 맞음(`useAutosaveScheduler.ts:90-98,283-291`) | `mark()` 편집마다 동기 · I8에 `dirtyMark` · 기존 편집기 경고 유지 명시 · T16 |
| a1-2 | lease 없는 replace가 보관 초안을 새 문서 위에 자동 저장(I3가 충돌 검사 무력화) | 맞음(`memoryDocBook.ts:361-366`) | `epoch`·`baseEpoch` · I3b · 4.4 lease 무관 충돌 · T17 |
| a1-3 | 하이드레이트 시드 동일성만으로 확인 반환 — 누락 이미지·stale entry 대체 시드(`localSync.ts:110-111`) | 맞음 | I5b 확인 증명 조건(fresh·실제 IDB 레코드·참조 이미지 존재) · T18·T19 · Blob 유효성 미확인을 잔여 위험으로 |

- 반영 1회 = r0.1 · **미재검토**(BRIEF: Codex 1회만). 반영이 새 결함을 만들었는지는 확인되지 않았다 — 특히 `mark()`의 진입 바이트(미측정)와 conflicted 상태의 상위 UX(Designer).

## 8. 검증 실행 vs 미실행

| 항목 | 상태 |
|---|---|
| `git diff --stat 467a691 -- app docs/decisions docs/design/restart/SPEC-4.md docs/design/restart/MQ-4.md CLAUDE.md` | 실행 — 빈 출력(`logs/scope-check.txt`) |
| `git diff --cached --check` | 커밋마다 실행 — 출력 0 |
| typecheck/lint/test/build | **미실행** — 앱 변경 0, 문서 레인 |
| 번들 측정 | **미실행**(BRIEF: 본 레인 측정 0) |
| 테스트 계획 T1~T19 | **미실행**(구현 레인용) |

## 9. 남은 것 · 필요한 것

- 미재검토: r0.1 반영분(Codex 2회차 금지) + r0.1a 자체 정합성 수정(I8 `publishedMark` · `mark` 진입 몫 표 · `acquire` effect 한정 — Codex 검토 아님). 회수 시 Jarvis 검토 또는 별도 승인된 재검토 필요.
- 미측정: 장부 진입 몫(S5a~c). 이미 `/studio` 판정선 여유 4B(base 129896 / 129900).
- 필요한 결정(사용자/Jarvis): ① 추천안 A 채택 여부 ② 공개 interface 추가(`ProjectRepository.ledger`) 승인 여부 ③ S5 스파이크 레인 승인 ④ Designer 상위 UX 레인(conflicted·start-pending·memory-only 문구) 착수.
