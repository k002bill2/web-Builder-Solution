# RS4-IMPL — SPEC-4 r0.3a CP1~3 구현 REPORT (2026-10-15)

- 브랜치 `k002bill2/rs4-impl`(worktree `../rs4-impl`) · base main `e3e22520` + 설계 rs23-fix `59554f2` · push·merge 0.
- 범위: CP1~3. **CP4(편집기 인계)는 하지 않았다.** 예산 배분이 정해지기 전이다.
- 커밋:
  - CP1 `46c3a9e`
  - CP2 `f4a7c50`
  - CP3 `1e18e73`
  - Codex r1 반영 `a7fde53`
  - Codex r2 반영 `a3b6b91`

## 1. 구현
| CP | 내용 | 주요 파일 |
|---|---|---|
| CP1 | 미확인 기억 모듈: 토큰과 epoch 세대 전이, 모듈 수준 `beforeunload`, 진행 중 요청 보호, 폐기, 변경 구독 · create 가드(문서 없을 때만) · `confirmDoc` 계약(`IMAGES_MISSING` fail-closed, 진행 중·실패 기록을 끝낸 뒤 IDB 키로 판정) | `features/pending/pendingWrites.ts` · `data/projectRepository.ts` · `data/memoryProjectRepository.ts` · `data/memoryDocBook.ts` · `data/persistence/localSync.ts` |
| CP2 | 프로필 판정표: create는 origin을 1번만 읽고 재시도에서 다시 읽지 않음(F1) · 요청이 반영되지 않으면 PendingRecord와 "저장 확인"(F2) · R-E6 · 폐기 확인 | `features/profile/restartFlow.ts` · `RestartDialog.tsx` · `CandidatesSection.tsx` · `restartText.ts` · `features/pending/DiscardConfirm.tsx` |
| CP3 | `/projects` 미확인 행: P-U1~5, "저장 다시 시도"·"저장 확인", 폐기. 표시 모듈은 진입 직후 자동 import이고, 목록은 모듈이 로드된 뒤 그린다 | `features/projects/pendingRows.ts` · `pendingRetry.ts` · `components/projects/ProjectRow.tsx` · `pages/ProjectsPage.tsx` · `features/projects/useProjectList.ts` |

## 2. 검증 (마지막 실행 · 같은 머신)
- `npm run typecheck` 0 · `npm run lint` 0 · `npm test -- --run` **309 files / 2810 tests 통과**(착수 전 305 / 2777 → +4 files / +33 tests) · `npm run build` 0
- 예산(`build-r2fix.txt`):

  | 시나리오 | 첫 화면 | 진입 직후 |
  |---|---|---|
  | `/profile` | 99.83 | 120.62 |
  | `/projects` | 99.36 | 108.65 |

  `/studio` 정규화 기준: 진입 128.47(멈춤 128.53) · 복원 131.45(멈춤 131.51).
- Red 확인:
  - CP1: 새 테스트가 RED. 판정 줄을 빼면 P-3 a 테스트가 실패하고, 가드를 되돌리면 create 가드 테스트가 실패한다.
  - CP2: 구현을 먼저 했다(TDD 순서 위반). 그래서 변이 검사로 대신했다. F1을 옛 동작으로 바꾸면 1개, F2를 바꾸면 2개 실패한다.
  - CP3: 새 테스트 5개 RED.
  - r2 반영: RED → GREEN.

## 3. Codex review
- r1(`codex-r1.txt`): P2 4건, 모두 반영했다.
  - 표시 모듈 로드 실패 시 목록 게이트 유지
  - 재시도 뒤 목록 재조회
  - 기억 변경 구독
  - 확인 불가 시 주 버튼 숨김
  - 단, 모듈 로드 실패 경로는 **단위 테스트가 없다**.
- r2(`codex-r2.txt`): P2 1건, 반영했다. 최초 create 성공 때도 세대를 올려, 늦게 실패한 요청이 기억을 되살리지 못하게 했다.
- **r3(`codex-r3.txt`): 실행 실패 — Codex usage limit**("try again at 7:22 AM"). r2 반영분(`a3b6b91`)은 Codex 미재검토다. 전역 상한 3라운드 중 3번째 시도라, 한도가 복구된 뒤 같은 명령으로 1회 재실행하면 된다.

## 4. 설계(SPEC-4 r0.3a)와 다르게 한 곳
- PROGRESS.md "설계와 다르게 한 곳"에 전부 적었다. 요약:
  - `confirmDoc` 이미지 판정은 IDB `keys`를 직접 읽는다(`stored` 집합은 쓰지 않음).
  - memory 영속에서도 기억을 만든다. 폐기 버튼은 local에서만 보인다.
  - restart 실패 판정은 커밋 확인을 코드 분리보다 먼저 한다.
  - PendingRecord에는 mode가 없다.
  - `/profile` 진입 직후가 +0.54 늘었다. "증분 0 목표"는 지키지 못했지만 한도 125 안이다.
  - 측정 목록(`check-bundle-size.mjs`)에 `/projects`의 auto와 afterAction 키를 추가했다. 판정선 변경은 없다.

## 5. 미실행 · 남은 것
- 브라우저 QA(Ego Lite)를 하지 않았다:
  - RS4-AC-07~10·14 [E]
  - 멀티 탭 잠금 실제 취득
  - `beforeunload` 실제 표시(CDP `Page.javascriptDialogOpening`)
  - RS4-AC-09 새로고침 한계
- 모듈 로드 실패 UI는 단위 테스트가 없다.
- CP4(편집기 인계 · `PendingDraft` · history 재진입 거짓 idle)는 하지 않았다. 남은 위험 RS4-R1·R2·R8은 그대로다.
- push · main 병합은 사용자 승인이 필요하다.
