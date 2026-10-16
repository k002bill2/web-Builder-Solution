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

- r3(`codex-r3.txt`, 2026-10-16 재실행 · `--scope branch --base e3e22520`): P2 1건, 반영했다. 이것으로 3라운드 상한에 도달했고 r4는 실행하지 않는다(반영분은 Codex 미재검토).
  - 지적: 행 확인이 `IMAGES_MISSING`·`STALE_TAB`·`CLEARED_TAB`으로 끝나면(`stuck`) 포커스된 버튼이 사라지는데, 포커스 대상(링크·재시도 버튼)이 없어 본문으로 빠진다.
  - 반영: `stuck`일 때만 포커스를 그 행의 "버리고 새로고침"으로 옮긴다. 그 버튼이 없으면(memory 영속) 행 안 결과 알림(`tabIndex=-1`)으로 옮긴다. 성공 뒤 목록 재조회를 기다리는 경우는 기존대로 링크로 간다(폴백을 `stuck`으로 좁히지 않으면 회귀가 생겨 좁혔다).
  - 테스트: `ProjectsPending.test.tsx` +2개(local·memory). RED(포커스 단언 2건 실패) → GREEN 확인.
  - 게이트(`build-r3fix.txt`): typecheck 0 · lint 0 · test **309 files / 2812 tests** 통과 · build 0. `/projects` 첫 화면 99.42 · 진입 직후 108.70 · `/profile` 99.83 / 120.62 · `/studio` 정규화 128.47(멈춤 128.53) · 복원 131.45(멈춤 131.51).

## 4. 설계(SPEC-4 r0.3a)와 다르게 한 곳
- PROGRESS.md "설계와 다르게 한 곳"에 전부 적었다. 요약:
  - `confirmDoc` 이미지 판정은 IDB `keys`를 직접 읽는다(`stored` 집합은 쓰지 않음).
  - memory 영속에서도 기억을 만든다. 폐기 버튼은 local에서만 보인다.
  - restart 실패 판정은 커밋 확인을 코드 분리보다 먼저 한다.
  - PendingRecord에는 mode가 없다.
  - `/profile` 진입 직후가 +0.54 늘었다. "증분 0 목표"는 지키지 못했지만 한도 125 안이다.
  - 측정 목록(`check-bundle-size.mjs`)에 `/projects`의 auto와 afterAction 키를 추가했다. 판정선 변경은 없다.

## 5. 브라우저 QA (Ego Lite · 2026-10-16 · `d8ff4929` 빌드 + `vite preview` 127.0.0.1:4381)
- 스크립트 `qa/qa-1.mjs`~`qa-7.mjs` · 캡처 `qa/shots/01~08`. 앱 안 클릭으로만 이동했다(새로고침은 AC-08·09 확인 때만).
- 미확인 상태 만들기: 페이지 안에서 `IDBObjectStore.prototype.put`이 `QuotaExceededError`를 던지게 주입했다(QA 전용 · 앱 코드 변경 0). 메모리 커밋 뒤 flush INFRA라 실제 경로와 같은 분기다.

| AC | 결과 | 근거 |
|---|---|---|
| RS4-AC-07 `/projects` 행 (`PendingStart` create·restart) | **통과** | P-U1 글자 · "편집기 열기" 0 · "저장 다시 시도"·"버리고 새로고침" · P-U5 캡션(02). 실패 재시도 = `role=alert` + 포커스 유지(03). 주입 해제 뒤 재시도 = P-U2 `role=status` + 포커스 = 되살아난 "편집기 열기" · IDB docs 1건(04). 다른 행 변화 0 |
| RS4-AC-08 폐기 확인 | **통과** | `alertdialog` 이름 "확인되지 않은 변경 버리기" · 첫 포커스 = 취소 · Esc = 닫힘 + 포커스 = 보조 버튼 + 기억 유지(06). 확인 → reload 1회(navigation `reload`) · 경고창 없이 진행 · 미확인 0 · IDB = 이전 문서 `A v1`(07) |
| RS4-AC-09 새로고침 한계 | **통과(사람 확인 포함)** | ① 자동: R-E4(05) 뒤 CDP `Input.dispatchMouseEvent` 1회 → `location.reload()` = 경고창 이벤트 0(CDP 입력은 sticky activation으로 인정되지 않은 것으로 추정) · reload 뒤 IDB = 이전 문서 `A v1`만 · 미확인 표시 0. ② 사람(qa-9, 2026-10-16): R-E4 대화상자를 연 채 사용자가 직접 클릭 + `Cmd+R` → **"사이트를 새로고침하시겠습니까? 변경사항이 저장되지 않을 수 있습니다" 경고창 표시**(사용자 캡처). 합성 `beforeunload` `defaultPrevented: true`. ③ 첫 사람 시도(qa-8)는 대화상자를 닫은 뒤 넘겨 경고창 0이었다(원인 미확정). ④ 경고창에서 "새로고침"을 누른 뒤 앱 탭(p1)을 읽었더니 주입 변수·미확인 문구가 남아 있었다(그 탭 문서는 다시 로드되지 않음) — 떠나기 뒤 상태는 ①의 자동 결과로만 확인됐다 |
| RS4-AC-10 멀티 탭 잠금 | **핵심 통과 · 일부 미실행** | 탭 A가 `/studio/project-1`에서 실제 편집 → "저장됨"(writer 취득). 탭 B 새로 로드 → 문서 없는 프로젝트 2 "A안으로 편집 시작" = "다른 탭에서 편집 중이라 편집을 시작하지 않았습니다"(C-E2) · IDB docs 전후 `[project-1:Av1]` 동일 · B `/projects` 미확인 0(08). **미실행**: 탭 B `PendingRecord` "저장 확인" READ_ONLY 문형 · A 닫힘 뒤 B 확인 성공/STALE(실브라우저에서 B에 `PendingRecord`를 만드는 경로를 꾸리지 못함) |
| RS4-AC-14 접근성·가림 | **통과** | 1280·1024·390 모두 행 버튼 6개 뷰포트 밖 0 · 겹침 0 · 가로 스크롤 0(02). 상태는 글자로 표시 · 결과 알림 행 안 한 자리 |

- Codex r3 반영분(`stuck` 포커스 폴백)은 실브라우저에서 `stuck` 상태를 만들지 못해 단위 테스트로만 확인했다.

## 6. 미실행 · 남은 것
- 브라우저 QA 미확인: AC-09 사람 경로의 "떠나기 뒤" 상태(4절 ④) · AC-10 `PendingRecord` READ_ONLY/STALE 경로 · `stuck` 포커스 실브라우저(5절).
- 모듈 로드 실패 UI는 단위 테스트가 없다.
- CP4(편집기 인계 · `PendingDraft` · history 재진입 거짓 idle)는 하지 않았다. 남은 위험 RS4-R1·R2·R8은 그대로다.
- push · main 병합은 사용자 승인이 필요하다.
