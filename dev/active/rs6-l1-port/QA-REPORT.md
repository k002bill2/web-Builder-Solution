# RS6-L1 QA REPORT — 저장 코어 포트·코어 이식 독립 검증

- 대상: `k002bill2/rs6-l1-port` tip `e62b02fb` (base `0c196b81`) · QA 2026-10-17 · 브리프 `QA-BRIEF.md`
- 앱·테스트 커밋 0 · 변이·임시 테스트는 매번 `git checkout -- app/` / 파일 삭제로 복원(최종 `git status --short app/` = 빈 출력) · push·원격 쓰기·Codex·다른 워크트리 접촉 0
- 로그: `logs/qa/*.log` (`*.log`는 `.gitignore` 대상이라 커밋되지 않음 — 로컬에만 있음)

## 0. 판정

**PASS with notes**

- 이 레인의 AC(U3·U10·U14·U15·G2)는 변이로 검출력이 확인됐다. 편집기 배선은 0이고 기존 저장 경로 동작 변화도 0이다. 실브라우저 회귀는 깨끗했고 fresh 게이트 4개도 모두 통과했다(322/2902, 번들 = REPORT 4절과 같음).
- notes(이 레인 차단은 아님, L3 전에 처리 필요):
  1. **[Medium · 잠재 손실 · L3 전 수정 권고]** discard의 connect 창. `discard` 호출 뒤 connect가 풀리기 전에 들어온 **편집(저장 없이)**이 조용히 버려진다(`discarded`). 하네스 의미는 `blocked{newer}`이고, 임시 테스트로 재현했다(4절). REPORT 7절의 "손실 0"은 save가 끼어든 경우에만 맞다.
  2. **[Low · 검출력 갭]** 생존 변이 3건. 셋 다 다른 방어층이 결과를 지키고 있어 지금 손실은 없다(1절).
  3. HARNESS-MAP 검토 결과는 3절에 있다.

## 1. 변이 표 (각 변이 → `npx vitest run src/features/studio/save/` 46건)

| # | 변이 | 결과 | FAIL한 테스트 |
|---|---|---|---|
| U14 | `kept`·`confirmDoc` 둘 다 `idle()` 대기 제거 | **RED 2** | U14 deleteSnapshot · U14 createSnapshot |
| U14-a | `kept`만 제거 | **RED 2** | 위와 같음 |
| U14-b | `confirmDoc`만 제거 | **생존(46/46)** | — (아래 주 ①) |
| U15 | 포트 이미지 키 판정을 projectId 무시(`/${localId}` 접미사 일치)로 바꿈 — commit·verify 둘 다 | **RED 1** | U15 다른 프로젝트 같은 localId |
| U15-bare | 키 = 로컬 id만(`have.has(id)`) | RED 2 | h3-3 · h6-7 (U15 자체는 통과 — 전부 실패 쪽으로 깨지므로 다른 테스트가 잡음) |
| U10 | mode()의 cleared 판정 + commit catch의 cleared 분류 둘 다 제거 | **RED 1** | RS6-AC-U10 |
| U10-a | mode()의 cleared 판정만 제거 | **생존** | — (주 ②) |
| G2 | `saveCore.ts`에 `../../../data/persistence/idbPersistence` 값 import 추가 | **RED 3** | 코어 persistence 값 import 0 · coreIo 값 import 1곳 · openIdbPersistence 호출 1곳 |
| IMG-commit | commit 엄격 이미지 확인 건너뜀(`unbound = []`) | **RED 2** | h3-4 image-missing · U15 |
| IMG-verify | verify 이미지 재읽기 건너뜀(`return true`) | **RED 2** | h6 M9 · U15 |
| IMG-meta | 바인딩 판정에서 `imageMeta` 확인 제거(`bound[id]` 존재만) | **생존** | — (주 ③) |

- 주 ① U14-b: LocalSync `confirm`이 `await queue.retry(projectId)`(진행 중 쓰기 대기)를 먼저 거친 뒤 `docOf`를 읽는다. 그래서 이 테스트의 타이밍에서는 코어 커밋과 align이 먼저 끝나 손실이 0이다. `confirmDoc`의 `idle()`은 다른 타이밍(코어 commit 제출이 confirm의 retry 뒤에 일어나는 경우)을 막는 방어다. 그 타이밍을 만드는 테스트는 없다. **Low · 테스트 갭**(코드 결함 아님).
- 주 ② U10-a: mode가 writer를 돌려줘도 `write()`가 cleared 탭 쓰기를 거절한다. 이어서 catch가 `cleared`로 분류해 결과는 같다. 이중 방어 중 한 층만 남은 상태다. 손실 0 · **Low**.
- 주 ③ IMG-meta: 메타 없는 Blob 바인딩(ingest를 거치지 않은 이미지)을 "바인딩 있음"으로 인정해도, 지금 테스트는 메타 없는 바인딩을 만들지 않는다. 이 변이가 실제로 손실을 만드는지는 확인하지 않았다(**미확인**). 메타 없는 바인딩이 `imageOps`에서 쓰이지 않으면 문서는 저장되고 이미지는 빠질 수 있다. 다만 `verify`가 IDB 재읽기로 잡아 confirm은 `not-committed`가 된다(IMG-verify RED로 확인). **Low**.
- 변이 로그: `logs/qa/mut-{U14,U14kept,U14confirm,U15suffix,U15bare,U10mode,U10both,G2,IMGcommit,IMGbindmeta,IMGverify}.log`

## 2. 동작 변화 판정 (편집기 미배선)

| 확인 | 결과 | 근거 |
|---|---|---|
| `useDocSave`·`StudioLayout`·`studioRepository` diff | **0** | `git diff 0c196b81 --name-status -- app/` = 13개 파일. 해당 파일 없음 |
| 제품 코드의 `.core(` 호출처 | **0** | grep 결과 정의(`memoryProjectRepository.ts:143`)와 테스트(testRig)뿐 → 운영에서 `cores` 맵은 늘 비어 있다 |
| `kept`·`confirmDoc`의 `await cores.get(id)?.idle()` | 코어 없음 = `await undefined` = **마이크로태스크 1틱, I/O·타이머 0** | `memoryProjectRepository.ts:67·136`. 기존 flush·confirm 순서 의미는 같다. 11절 기존 테스트 전부 GREEN(322/2902) |
| `coreLink`·`adopt`·`corePort` | 코어 경로에서만 호출. 기존 `saveDoc`→DocBook→flush 경로에서는 호출 0 | `memoryDocBook.ts` diff · `localSync.ts` diff |
| DocBook 청크 정적 import 증가(coreIo·hashDoc·retainedIds) | 동작 0 · 번들만 늘었다(REPORT 4절 범위) | build 출력 |
| 실브라우저 | 기존과 같음(5절) | — |

판정: **동작 변화 0 [사실 L1 — 코드·테스트·브라우저]**. 남는 차이는 코어가 없을 때 flush 앞에 붙는 마이크로태스크 1틱뿐이다.

## 3. 대응표·차이 검토 (심각도)

(서브에이전트 결과 반영 — 아래 3.1·3.2)

## 4. REPORT 7절 차이 — 임시 테스트

임시 파일 `save/zzQaTemp.test.ts`는 실행 뒤 삭제했다(로그 `logs/qa/temp-discard.log`).

| 시나리오 | 결과 | 판정 |
|---|---|---|
| A: A 저장 → B 편집 → `discard` 호출 직후(connect 대기 중) `save()` | discard `rejected{inflight}` · save `saved` · IDB = B · 초안 = B | **안전 — REPORT 7절 주장 확인** |
| B: A 저장 → B 편집 → `discard` 호출 직후(connect 대기 중) **편집 C**(save 없음) | `discarded`(restored revision 2) · 초안 = A · dirty false → **C 유실** | **Medium(잠재)** — 하네스 의미(첫 await 전 동기 진입)라면 `entered`가 호출 시점이라 `blocked{newer}`가 된다. 포트는 `entered = s.mark`를 connect 뒤에 잡는다(`coreIo.ts` discard). 첫 discard는 DocBook 청크 로드를 기다리므로 창이 길 수 있다. L1에서는 호출처 0이라 사용자 영향 0. **L3 배선 전에** `link()` 호출 전에 mark를 동기로 캡처하거나 `discarding`을 동기로 세우도록 고칠 것을 권고 |

## 5. 실화면 (Ego Lite · `vite preview` 127.0.0.1:4373 · fresh build 산출물)

| 단계 | 결과 |
|---|---|
| 카탈로그 → 비교 추가 2개(모던 카페·동네 치과) → 비교 보드 → 전부 선택(A) → 프로필 확정 v1 | `/profile/profile-1` 도달 |
| 3안 만들기 → 1안 선택 → 편집 시작 | `/studio/project-1` (`qa-shots/01-studio-enter.png`) |
| Hero 제목 편집 → "이 브라우저에 저장됨 · 방금" | 표시됨 (`02-edited-saved.png`) |
| 새로고침 | 제목 "QA 회귀 확인 제목" 복원 |
| 스냅샷 "QA 스냅샷" 만들기 → 삭제(확인 대화 "지우기") → 새로고침 | 생성 표시(`03-snapshot-created.png`) · 삭제 뒤 "아직 스냅샷이 없습니다" · 새로고침 뒤에도 0개 |
| `/projects`(앱 안 링크) | 프로젝트 1개 "편집 중 · A안 · 프로필 v1" (`04-projects.png`) |
| 2회차(콘솔·네트워크 수집 켠 상태): /projects 새로고침 → 편집기 열기 → 편집 → 저장됨 → 새로고침 복원 | 복원 "QA 두 번째 편집" · 응답 77건 모두 <400 · `Runtime.exceptionThrown`·console error/warn·`Log` error·`loadingFailed` **0** |
| 정리 | origin IDB·storage 삭제(`indexedDB.databases()` = `[]`) · `finish({keep:[]})` · `listTaskSpaces()` = `[]` · preview 종료 · 4373 리슨 0 · 5480·영환님 창 무접촉 |

- 한계: 1회차 흐름(카탈로그~스냅샷)은 콘솔 수집 버퍼가 라운드마다 비워져 일부 구간만 확인했다. 오류 0은 2회차(편집·저장·복원·/projects)에서 확인한 것이다.

## 6. 게이트 (fresh · 변이 전 깨끗한 트리)

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm test -- --run` | **322 files / 2902 tests passed** · exit 0 (기대 322/2902와 같음) |
| `npm run build` | exit 0 · /studio raw 129.88/130 · 정규화 128.55(기준선 128.55 · 개정 17 상한 129.13 안) · 복원 132.92/134 · 정규화 131.53(상한 132.11 안) · /projects 진입 108.85/125 · catalog 100.06/101 · profile 99.56/100 · references 97.47 · compare 98.96/122.71 — **REPORT 4절 표와 전 행 같음** |
| 기존 테스트 파일 M/D | `git diff 0c196b81 --name-status -- app/`에서 기존 테스트 M = `app/scripts/bundleBudget.test.mjs` 1건(기대값 2줄 eagerKb·normEagerKb 실측 갱신 — 개정 17 결정 2 절차, REPORT 5절에 기재) · D = 0 · 그 밖의 기존 테스트 변경 0 |

## 7. 사실 / 추정 / 미확인

- **사실 [L1 · 실행]**: 6절 게이트 · 1절 변이 11종 결과 · 4절 임시 테스트 A/B · 5절 브라우저 흐름과 오류 0 · 2절 diff·grep.
- **추정 [L2]**: U14-b 생존 사유(queue.retry 대기 덕분) — 코드 읽기 근거만 있다. discard 창이 L3에서 실사용 손실로 이어질 가능성 — 배선 방식에 달려 있다.
- **미확인**: IMG-meta 변이의 실손실 여부(메타 없는 바인딩이 생기는 실경로가 있는지) · 1회차 브라우저 흐름 전 구간의 콘솔 로그.
