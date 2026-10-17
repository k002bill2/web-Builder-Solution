# RS8-2 REPORT — `view().reason` · `/projects` stale 행 첫 표시 (B-RS-09)

base `494a7c6f` · 브랜치 `k002bill2/rs8-row-reason` · 커밋 `dea3d226`(BRIEF·PROGRESS) → `2099fa86`(CP1) → `087f88bb`(CP2) → `586d97ec`(REPORT 초안) → 마감 문서 커밋

## 0. 결론
- **B-RS-09 해소(최소안)**: `/projects` 저장 실패 행이 **첫 표시부터** UX-5 2.3 사유 문구를 보인다(stale·cleared = "다시 저장" 숨김 · readonly = 버튼 유지). 사유 출처 = 코어 `view().reason`(마지막 save 결과, 읽기 전용).
- **잠금 0**: 행 판정·표시는 `port.mode()`·`gate.enter()`·`locks.request`를 부르지 않는다 — 단위 가드(readonly 탭 스파이 0) + 변이(bd3163a3 probe 재도입 → FAIL) + 실화면(`/projects` 경로 요청 0 · held = A 탭뿐).
- **예산**: `/studio` 128.66(+0.00) · 복원 131.65(+0.01) · `/projects` 첫 99.09(+0.00) · 진입 109.54(+0.01). 감량 0회 · 기준선 파일 변경 0.
- 공개 `ProjectRepository` 확장 0 · `peek()` 포트 메서드 0 · `ProjectsPage.tsx` 변경 0(bd3163a3의 목록 게이트 지연 불필요 — 판정이 동기).

## 1. CP1 코어 (`features/studio/save/`)
| 사건 | `view().reason` | 근거 |
|---|---|---|
| save `failed{reason}` (readonly·stale·cleared·infra·image-missing·memory 커밋 실패 등) | 그 reason | `coreIo.save` 래퍼 1곳 |
| save `saved` | 해제 | 같은 곳 |
| memory `failed{not-persistent}`(메모리 커밋 성공) | 해제 | 같은 곳 |
| discard `discarded` | 해제(blocked면 유지 — 초안 보존) | `coreIo.discard` |
| rebase(`rebased`) — clean 맞춤·mine 초안 유지 두 분기 | 해제(마지막 결과 = 그 쓰기 성공) | `coreIo.rebase` |
| edit(결과 아님) | 유지 | — |

- 진입 몫(`saveCore.ts`) = `CoreState.reason?` 타입 + `view()` 필드 1개. 기록·해제 본문은 조작 뒤 청크(`coreIo.ts` — save 본문을 `commitDraft`로 옮기고 감쌈, 들여쓰기만 바뀜: `git diff -w` 19줄).
- (사실) 래퍼 밖에서 바로 돌아오는 결과 2개는 reason을 바꾸지 않는다: connect 실패 `unavailable`·`discarding`. 둘 다 문구 없는 reason이라 행은 직전 사유 문구를 유지한다(직전이 stale이면 stale 문구). 진입 바이트를 쓰지 않으려는 선택.
- confirm 실패(clean 경로 mode·verify)는 save 결과가 아니라 기록하지 않는다.

`view()` 소비처 영향(grep `\.view()` 앱 코드):
| 소비처 | 읽는 필드 | 영향 |
|---|---|---|
| `features/studio/useDocSave.ts:59,65,71,108,117,165` | doc·dirty·mark·inflight | 0 |
| `features/projects/pendingRows.ts` describeRow·watchCores | inflight·dirty·confirmed + **reason(신규)** | 이번 변경 |
| `features/projects/pendingRetry.ts:58,60,77` | dirty·doc | 0 |
| `data/memoryProjectRepository.ts:148` beforeunload | dirty·inflight | 0 |
| 테스트 `toMatchObject(view())` 10곳 | 부분 일치 | 0(전체 일치 단언 없음) |

## 2. CP2 행 (`features/projects/` · 테스트 `components/projects/`)
- `describeRow`: dirty 행 status = `CORE_REASON_TEXT[view.reason]` 또는 "저장하지 못했습니다" · label = `stuckOf(reason)`면 없음. 우선순위 그대로(시작 대기 > 저장 중 > 저장 실패 > 미확인 기록).
- `stuckOf`(stale·cleared·unsupported) = 행 첫 판정과 다시 저장 결과(`pendingRetry.failed`)가 공유.
- image-missing: 행 첫 표시 문구에서 빼고 다시 저장 결과에만(`pendingRetry` REASON) — bd3163a3 의도 유지. 이제 commit 실패 reason도 `view().reason`에 들어오므로, 남겨 두면 첫 표시에 결과 전용 문장 + "다시 저장"이 나왔다. 첫 표시는 일반 실패 문구(단언 `coreRowText.test.ts`).
- 2벌 문구 가드(`coreRowText.test.ts`) 유지 + `stuckOf` 표 + image-missing 부재 단언.
- bd3163a3 대비 안 가져온 것: `probeCores`·ProjectsPage 게이트(포트 mode = Codex P2 원인) · `pendingText.ts` P-U2 이동·`saved` 이동(바이트 상쇄용 — 이번엔 증분 0이라 불필요, `features/pending/**`는 쓰기 경로 밖).

## 3. 잠금 회귀 가드
- `ProjectsReasonRows.test.tsx` "잠금 회귀 가드": readonly 탭 B(A가 writer) — 준비 save 뒤부터 B 탭 fake `locks.request`·`b.core.link`(포트 mode → gate.enter의 유일한 외부 경로)·`b.core.save` 스파이 → 첫 표시·`ticks()` 뒤 모두 0 · READONLY 문구 보임 · 잡힌 잠금 = A 탭 것뿐.
- readonly를 고른 이유: writer·stale은 `gate.enter`가 잠금을 요청하지 않고 바로 돌아온다(`writerLock.ts:51`) — stale만으로는 request 0이 아무것도 증명하지 않는다.
- 변이: bd3163a3 `probeCores`(port.mode) + ProjectsPage 게이트 재도입 → `[request, link, save] = [1, 1, 0]` FAIL(`logs/mutation-probe.txt`) → 원복(diff 0).

## 4. 실화면 (Ego Lite) — `logs/ego-two-tab.txt`
- preview `--port 4390 --strictPort`(fresh build, tip `087f88bb`) · space 29 · 앱 안 클릭으로만 이동.
- 탭 A writer(held 1개 `6CBF981D…`) · 탭 B 같은 프로젝트 편집 → 편집기 알림 readonly 문구 → B에서 `navigator.locks.request` 계수 시작 + MutationObserver → "프로젝트로 돌아가기".
- (사실) 행 **첫 그림** = readonly 문구 + "다시 저장" + "편집기 열기" · 일반 실패 문구 0 · 3초 뒤 같음.
- (사실) 요청 1회 = 경로 `/studio/project-1`(편집기 이탈 save) · `/projects` 경로 요청 0 · held = A 탭 clientId뿐(B writer 없음).
- (한계) held 확인만으로는 A가 잠금을 쥐고 있어 옛 probe도 잡지 못하므로 판별력이 없다 — 판별은 요청 계수(경로별)로 했다. stale 실화면은 미실행(단위 테스트 1건으로만). 스크린샷은 CDP timeout(백그라운드 탭)으로 미취득.
- 정리: `Storage.clearDataForOrigin(http://localhost:4390)` → `indexedDB.databases()` = [] · p2 close · `finish({keep:[]})` · preview 종료 → `lsof -nP -iTCP:4390 -sTCP:LISTEN` 출력 0(exit 1).

## 5. 게이트 (fresh · tip `087f88bb`)
| 게이트 | 결과 |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npx vitest run` | 349 files / 3049 tests 통과 (base 347/3035 + 2 파일 · +14: CP1 8 · 행 4 · 문구 가드 2) |
| `npm run build` | exit 0 · bundle 가드 통과(`logs/bundle-cp2.txt`) |

예산 실측(`logs/bundle-base.txt` · `bundle-cp1.txt` · `bundle-cp2.txt`):
| 시나리오 | base | CP1 | CP2 | 상한 |
|---|---|---|---|---|
| `/studio` 정규화 | 128.66 | 128.66 | 128.66 | +0.05 · 129.13 |
| 복원 정규화 | 131.64 | 131.65 | 131.65 | +0.05 · 132.11 |
| `/projects` 첫 | 99.09 | 99.08 | 99.09 | 99.5 |
| `/projects` 진입 직후 | 109.53 | 109.52 | 109.54 | 125 |

- 기준선 파일(`m2cBaseline.json`·`bundleBudget.test.mjs`) 변경 0 — 복원 +0.01은 허용 0.03 안이라 실측 상향 갱신 대상 아님(판단).

## 6. TDD 로그
- CP1 RED `logs/red-cp1.txt`(7 실패/8) → GREEN `green-cp1.txt`(8/8).
- CP2 RED `logs/red-cp2.txt`(6 실패/10) → GREEN `green-cp2.txt` · 변이 `mutation-probe.txt`.
- 기존 단언 약화·skip 0.

## 7. Codex review — `logs/codex-adversarial-review.txt`
- 1회 · `adversarial-review --scope branch --base 494a7c6f` + 관점(잠금 · 거짓 상태 · `/studio` 진입 바이트). 기본 `review`는 관점 텍스트를 받지 않아(`codex-companion.mjs:271-274`) 시작 직후 중단하고 이것으로 바꿨다(완료된 review 0회).
- **Verdict: approve · No material findings.**
- (사실) Codex 측 테스트 5파일은 샌드박스 임시 디렉터리 EPERM으로 실행 전 차단 · 새 빌드 미수행 → Codex의 "다음 단계"(테스트·빌드)는 5절 fresh 실행(같은 코드 tip `087f88bb`)이 해당.

## 8. 미결·후속
- `unavailable`·`discarding` 결과는 reason 미갱신(1절) — 문구 영향 없음, 필요하면 후속.
