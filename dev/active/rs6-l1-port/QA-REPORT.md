# RS6-L1 QA REPORT — 저장 코어 포트·코어 이식 독립 검증

- 대상: `k002bill2/rs6-l1-port` tip `e62b02fb` (base `0c196b81`) · QA 2026-10-17 · 브리프 `QA-BRIEF.md`
- 앱·테스트 커밋 0 · 변이·임시 테스트는 매번 `git checkout -- app/` / 파일 삭제로 복원(최종 `git status --short app/` = 빈 출력) · push·원격 쓰기·Codex·다른 워크트리 접촉 0
- 로그: `logs/qa/*.log` (`*.log`는 `.gitignore` 대상이라 커밋되지 않음 — 로컬에만 있음)

## 0. 판정

**PASS with notes**

- 이 레인의 AC 가운데 **U10·U14·U15·G2와 엄격 이미지**는 변이로 검출력을 확인했다. U3는 변이를 돌리지 않았다. 편집기 배선은 0이고 기존 저장 경로 동작 변화도 0이다. 실브라우저 회귀는 깨끗했고 fresh 게이트 4개도 모두 통과했다(322/2902, 번들 = REPORT 4절과 같음).
- **브리프 기대와 다른 점 2건**
  1. 브리프에 적힌 그대로 U15 변이(키 = 로컬 id만)를 넣으면 **U15 테스트는 RED가 되지 않는다.** 판정이 실패 쪽으로 닫혀 h3-3·h6-7이 RED가 된다. U15 테스트가 잡는 것은 "다른 프로젝트 레코드를 받아들이는" 변이(접미사 일치)이며, 이 변이는 RED 1이었다.
  2. 기존 테스트 M/D는 0이 아니라 **M=1**이다(`scripts/bundleBudget.test.mjs`의 기대값 2줄). 개정 17 결정 2 절차에 따른 예외이고 REPORT 5절에 적혀 있다. D=0.
- notes — 이 레인을 막지는 않지만 **L3 착수 전에 처리해야 한다**
  1. **[Medium · 잠재 손실]** discard의 connect 창. `discard` 호출 뒤 connect가 풀리기 전에 들어온 **편집**(저장 없이)이 조용히 버려진다(`discarded`). 바인딩도 `committed`로 덮인다. 하네스 의미는 `blocked{newer}`이다. 임시 테스트로 재현했다(4절). REPORT 7절의 "손실 0"은 save가 끼어든 경우에만 맞다.
  2. **[Medium · 잠재 · L3 차단 조건 권고]** `restoreSnapshot`·`resolveConflict`·`startDoc(restart)`는 아직 DocBook에 바로 쓴다. 코어 revision(`confirmed.revision + 1`)이 모르는 사이에 revision이 바뀌므로, 배선 뒤에는 같은 revision 번호로 덮어쓸 수 있다. 지금은 호출처가 0이라 도달하지 않는다. REPORT 8절 "남는 일"에 이 항목이 빠져 있다(3.2).
  3. **[Low~Medium · 계약 공백]** `save()`·`confirm()`이 `failed`를 돌려주지 않고 reject될 수 있다. `port.mode()`·`port.verify()`가 try 밖에 있기 때문이다. REPORT 6절 5항 "reject 아님"은 connect 실패에만 맞는다. savedMark는 전진하지 않으므로 거짓 "저장됨"은 없다.
  4. **[Medium · 테스트 공백]** HARNESS-MAP 집계를 고쳐야 한다. ① 30건은 "완전 27 + 부분 3"이 아니라 **완전 25 + 부분 5**다(#12·#30 추가). ② #20의 "discard stale을 ①로 재현" 주장은 근거 테스트가 0건이다. 손실 경로는 0이다(3절).
  5. **[Low]** 생존 변이 3건이 있다. 셋 모두 다른 방어층이 결과를 지켜 지금 손실은 0이다(1절).

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

읽기 전용 서브에이전트(code-explorer) 1개가 수행했다. 메인은 4절 임시 테스트로 discard 판정을 교차 확인했다. 서브에이전트의 나머지 임시 테스트 초안(X1·X2·X3·W-e)은 턴 한도 때문에 실행하지 않았다(**미확인**).

### 3.1 HARNESS-MAP ②·③·PARTIAL

| # | 분류 | 판정 | 심각도 | 근거 |
|---|---|---|---|---|
| 13 h4:35 | ② | 사유 적합(D6-3 `INTEGRATE-6.md:404` · 4절 `:151`) | Low | `writerLock.test.ts:120-170` · 포트 `saveCore.modes.test.ts:176-187`. confirm(wrote:false)가 stale이 되는 직접 단언은 없다 — 같은 `port.mode()`를 쓰므로 합성으로 성립한다(추정) |
| 15 h4:53 | ② | 적합 | Low | `writerLock.test.ts:81` · `createLock.test.ts:79` · `modes.test.ts:168·172` |
| 16 h4:60 | ② | 적합 | Low | `writerLock.test.ts:120-141` · `createLock.test.ts:98-111` · `modes.test.ts:176-187` |
| 20 h5:58 | ② | ② 사유는 적합. **"discard stale은 ①로 재현(CP3)" 주장은 근거 0** — save 테스트에 discard `blocked{stale}` 단언이 없다 | Low(코드: `coreIo.ts` discard는 초안을 보존하며 막는다) · Medium(맵 신뢰도) | grep `stale` = save·confirm 단언뿐 |
| 34 h6:172 | ② | 사유 적합. 인용한 `writeQueue.test.ts:44`는 순서 보장일 뿐이다 → `saveCore.port.test.ts:10-16`(레지스트리) · `saveCoreGuard.test.ts`로 바꿔야 한다 | Low | `INTEGRATE-6.md:92` |
| 35 h6:189 | ② | 적합. `createLock.test.ts:150` 인용은 부적절하다 → `:123` · `saveCore.port.test.ts:49` | Low | `writerLock.test.ts:204` · `writeQueue.test.ts:57` |
| 33 h6:161 | ③ | 폐기는 타당하다. 사유 문구는 "제품에 없는 경로"보다 "설계가 존재 판정으로 좁힘"(`INTEGRATE-6.md:60-61`)이 맞다 | Low | 키 존재만 본다(`localSync.ts` commit·verify) · 교차 프로젝트 방어는 U15 |
| #9 h3:14 | PARTIAL | readonly로 거절되면 `s.attached`를 건드리기 전에 return하고, 재시도하면 `bound`로 put한다 → **손실 경로 0** | Low | `coreIo.ts` save 초반 return · 테스트 공백뿐 |
| #28 h6:92 | PARTIAL | replace는 `mark += 1`을 하므로, discard의 `s.mark !== entered` 검사가 edit와 같은 경로로 막는다 → **손실 0**(connect 창은 0절 note 1 별건) | Low | `coreIo.ts` replace·discard |
| #32 h6:150 | PARTIAL | discard 뒤 `attached = {}`가 되고, 다음 save는 IDB 키 존재로 통과한다. X가 없으면 `image-missing` → **손실 0** | Low | `imageOps.ts:29`(참조 id delete 0) |
| **#12 h3:65(추가)** | ①→부분 | 테스트 제목은 "새 레지스트리(재열기)"인데 본문은 같은 코어라 바인딩이 남아 있다. "IDB에만 있고 바인딩은 없음" 양성 분기를 검사하는 테스트가 0건이다(새로고침 뒤 첫 저장 = 가장 흔한 흐름). 코드는 정상으로 읽힌다 | **Medium(테스트 공백)** | `saveCore.images.test.ts:40-48` |
| **#30 h6:125(추가)** | ①→부분 | 중첩 변경 단언이 빠져 있다 — 7절의 의도된 차이(얕은 사본)이다 | Low | `images.test.ts:95-102` |

### 3.2 REPORT 7절 행별 판정

| 행 | 판정 | 심각도 |
|---|---|---|
| memory 모드 savedMark | `link.book()`이 throw하지 않고 반환한 뒤에만 전진한다(`coreIo.ts` save memory 분기). 실패하면 먼저 return하므로 dirty가 유지된다 → **거짓 "저장됨" 0**(메인 코드 대조 일치). 주의: (a) L2는 memory 모드에서 `dirty=false`를 "저장됨" 문구로 내보내지 않도록 분기해야 한다. (b) `coreLink.book`은 기대 revision = 현재 revision이라 STALE 판정이 구조적으로 꺼진다(단일 작성자 전제). (c) 실패 reason이 기본값 `not-committed`가 되어 confirm 재읽기 실패와 문자열이 겹친다 | Low · L2 주의 Medium |
| CE-2 얕은 사본 | 불변 전제가 코드상 성립한다. `PageDoc` readonly · 비테스트 코드에서 doc 대상 제자리 변경 grep 0 · DocBook·`adopt`가 `deepFreeze`하므로 변경이 있으면 TypeError로 드러난다(조용한 손상 아님). 한계: grep은 별칭 변수를 놓칠 수 있다 | Low |
| 커밋마다 세대 재읽기 제거 | D6-3 승인 사항. 잠금을 탭 수명 동안 쥐고 획득할 때 `fresh()` | Low |
| 레지스트리 CP1 | 절차 변경. 예산(/projects +0.47)은 L5로 넘어간다 | 없음 |
| 포트 `image()` 접음 | 구현은 정상. 양성 경로 테스트 공백(#12) | Medium(테스트) |
| 포트 reason 단순화 | quota·abort 구분 없음(L4). 부수 발견: `save()`·`confirm()` reject 가능(0절 note 3) | Low~Medium |
| discard 진입이 connect 뒤 | save 경쟁: 동기 `inflight += 1`이라 `rejected{inflight}` 또는 `failed{discarding}` → 안전(임시 테스트 A로 확인). **edit 경쟁: 후퇴**(임시 테스트 B · 0절 note 1) | Medium(잠재) |
| (6절 ②) DocBook 직행 쓰기와 revision 기준 | 0절 note 2 | Medium(잠재 · L3 차단 권고) |

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
- **미확인**: 서브에이전트 초안 X1(#12 양성 경로)·X2(#20 discard stale)·X3(memory 실패)·W-e(reject) 미실행 · IMG-meta 변이의 실손실 여부(메타 없는 바인딩이 생기는 실경로가 있는지) · 1회차 브라우저 흐름 전 구간의 콘솔 로그.
