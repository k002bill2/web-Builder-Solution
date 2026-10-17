# RS6-L3b QA REPORT — 링크 이탈 규칙(MQ-6-7 A) · 상쇄 독립 검증

대상 `k002bill2/rs6-l3b-leave` tip `0c842581`(제품 코드 = `32277b23`) · base `860d530d` · 2026-10-17 · QA(Claude Code, Orca)

## 0. 판정

**PASS with notes.** main `860d530d` 대비 **경고 없이 편집이 사라지는 새 경로는 찾지 못했다** [L1 — 코드 추적 + 임시 테스트 4건 + 실화면 5건].

- 링크·POP·재마운트 이탈은 즉시 이동한다. lease 해제 save가 IDB까지 간다. 커밋 전에 탭을 닫거나 새로고침하면 레지스트리 경고가 뜬다(합성 `beforeunload` `defaultPrevented` true). 커밋 뒤에는 꺼진다.
- **note 1(심각도 Medium · L5에서 닫힘)**: 해제 save가 **실패하면** 편집기 밖에는 실패 표시가 없다. 대신 다음은 지켜진다.
  - 코어 초안이 dirty로 남는다.
  - 탭 경고가 계속 켜져 있다.
  - 다시 들어가면 그 초안을 다시 저장한다.
  - 편집기 밖 restart는 `STALE_DOC`으로 거절되어 덮어쓰지 않는다.
  - 사용자가 실패를 알게 되는 시점은 탭을 닫을 때나 다시 들어갈 때다. 판정 기준상 "경고는 있으나 실패 표시가 편집기 밖에 없다"에 해당한다 → L5(`/projects` 행 실패 표시, RS6-AC-U11 나머지).
- 그 밖의 note(테스트 판별력·픽스처 충실도, 모두 Low~Med, 제품 결함 아님)는 3절·7절에 있다.
- 변이 5/5 FAIL · fresh 게이트 4/4 통과 · 331/2953 · 예산 129.03/130.36 · 132.01/133.39.

## 1. 손실 경로 표 (main `860d530d` 대비)

| # | 경로 | main | tip | 새 손실? | 근거 |
|---|---|---|---|---|---|
| 1 | 디바운스 중 링크 이탈 | 저장 끝날 때까지 편집기 유지 → 이동 | 즉시 이동. 언마운트 microtask에서 lease 해제 save가 나간다(`useDocSave.ts:116-121`). 커밋 전 탭 닫기·새로고침 = 레지스트리 경고 | 없음 | 실화면 (a): 클릭하자 `/projects` **0.3ms**(같은 동기 구간) · 경고 true → 5ms 안에 false · IDB rev 4 = 마지막 편집. 테스트 StudioLeave "U12" |
| 2 | 해제 save **실패**(quota·abort) | (해당 없음 — 편집기 안에서 실패 배너, 보류) | 코어 dirty 유지 → 탭 경고 on 유지 → 재진입 시 seed = 초안, `change(doc)`로 다시 저장 → 성공하면 경고 off. 편집기 밖 restart = `STALE_DOC` 거절(쓰기 0) | 없음(경고 있음) · **실패 표시가 편집기 밖에 없다 = Medium, L5** | 임시 테스트 Q2(Quota) PASS · Q3(Abort 뒤 restart → `rejected:STALE_DOC`, dirty true, IDB 제목 미변경) PASS |
| 2b | 해제 save 실패 + readonly 전환·오프라인 | — | 같은 코어 규칙이다. readonly 거절 = failed라 dirty가 유지되고 경고도 유지된다. 오프라인이면 커밋 전 실패 → 같은 경로 | 없음 | 코드 추적 [L1]: 레지스트리 판정 `!local ‖ dirty ‖ inflight>0`(`memoryProjectRepository.ts:148`). 실화면 미시험(다중 탭·오프라인) |
| 3 | POP(뒤로) 디바운스 중 | 편집기 훅 경고만 있음. POP은 막지 않았다(저장 주체가 없어 L3a 인계 2) | 해제 save 1회 · 이동 뒤 경고 on → 커밋 뒤 off · forward 재진입하면 상태가 이어진다 | 없음(오히려 개선) | 실화면 (c): back 2ms 뒤 `/projects` true → 5ms false · IDB rev 5 · forward 제목 = "QA-c POP 직전". useDocSaveLeave "U12" |
| 4 | 재마운트(U7) | — | 같은 projectId = 같은 코어, 초안이 이어진다. 해제 save는 최대 1 | 없음 | useDocSaveLeave "U7" · 변이 M4(새 코어) → 20 FAIL |
| 5 | 저장 진행 중 + 추가 편집 이탈(U11) | 저장 끝날 때까지 대기 | 즉시 이동. 해제 save가 chain 뒤에 이어져 IDB = 마지막 편집 | 없음 | StudioLeave :99 행 · 임시 테스트 Q4(save 2회 · 경고 on → off · IDB "추가 편집") PASS |
| 6 | 예외 순서 3.1-3 | — | ① offline · ② STALE · ③ failed(readonly 아님, cleared 포함) = 보류. ④ readonly·unsupported·그 밖 = 이동 | 없음 | 6a 아래 |
| 7 | **편집기 안에 머무는 동안 새로고침**(훅 beforeunload 제거 뒤) | 훅 경고(`needsUnloadGuard`) | 레지스트리 경고(코어 dirty) — 편집 직후 true · 커밋 뒤 false | 없음 | 실화면 (b): 편집 전 false → 편집 직후 **true** → 4초 뒤 false · IDB rev 2. 임시 테스트 Q1(로컬, 디바운스 60초 대기 중 true → `leave()` 저장 뒤 false) PASS. 상시 스위트에는 실패 상태 경고만 있다(dirty 대기 중 경고 단언 없음 → 7절 L4 권고) |
| 8 | memory 모드 | 편집기 안에서만 경고 늘 | 코어가 하나라도 있으면 탭 전체 경고 늘 | 없음(범위 확대) | useDocSaveLeave "memory 모드" |

### 6a. 예외 순서 — 코어 경로 테스트 유무

| 판정 | 테스트 | 경로 |
|---|---|---|
| ① offline 보류 | StudioLeave :211(유지) | 픽스처 코어(`withSaveCore`) + `navigator.onLine` |
| ② STALE 보류 | StudioLeave 새 `it.each` | 제품 `createSaveCore` + `coreIo` · 픽스처 포트 commit reject → `stale` |
| ③ failed·cleared 보류 | :127 뒤 절반 · :225 · :235 · `it.each` cleared | 같음 |
| ④ readonly 이동 | StudioLeave :158·:173 (픽스처 문자열 매칭) · `useDocSaveCore.save.test` readonly(**실제 포트, 다른 탭 writer**) | 실포트는 1건, 대기 약함(3절 B-3) |
| ④ unsupported 이동 | StudioLeave :199 (픽스처 `local && !locks`) | 실제 포트로 unsupported → `leave()`를 잇는 테스트 0 (Low — 제품 `mode()`가 `unsupported`를 돌려주는 것은 `saveCore.modes.test`가 본다) |

- 변이 M3(②③ 분기 제거 → `navigator.onLine`만 보고 이동) → 6 FAIL(STALE·cleared·failed 보류 행).
- 분류 차이: I6는 cleared를 ②에 두지만, 구현은 ③(failed, readonly 아님)에서 보류한다. 결과가 같아 결함은 아니다.

## 2. StudioLeave 14건 대조 (서브에이전트 읽기 전용 감사 + 메인 확인)

- **14행 모두 I6 3.1-4 분류(유지 7 · 의미 변경 6 · 이전 1)와 REPORT 2절이 일치한다** [L1, `git diff 860d530d 0c842581 -- app/src/components/studio/StudioLeave.test.tsx`].
- "유지" 7행(:158 :173 :199 :211 :244 :252 :266)은 expect가 문자 그대로 같다. :252는 실패 상태를 만드는 준비만 바뀌었다(이탈 저장 실패 → 자동 저장 실패). REPORT가 이를 밝혔다.
- "의미 변경" 6행(:99 :114 :127 :184 :225 :235)에 약화는 없다. "저장소 = 마지막 편집" 단언은 사라진 행이 없다. `repo.save` 횟수가 이제 `core.save` 동기 호출 수(해제 save 포함)라서 횟수 단언은 오히려 엄격해졌다.
- 판별력 note:
  - (Med) :127 앞 절반 새 행("저장 전 변경 클릭 = 즉시 이동 — 뒤 실패해도 이동 1회")은 `arrivals 1`만 단언한다. 이동 뒤 실패했을 때 초안 보존·경고 유지는 상시 스위트에 직접 단언이 없다. QA 임시 테스트 Q2로 동작은 확인했다 → L4·L5 테스트 추가 권고.
  - (Low) :99는 저장 총횟수 단언이 없다(U7 상한은 useDocSaveLeave가 본다).
  - (Low) 제목이 낡았다: :158 :173 :199 "거절 뒤 이동"(지금은 ④ 즉시 이동).
- 새 `it.each`(STALE·cleared)는 제품 코어 io를 탄다. Developer RED 로그(`logs/u13-red-*.txt`)와 QA 변이 M3 모두 RED다.

## 3. CP-A 상쇄 · 픽스처 판정

**B-1 폴백 제거의 제품 영향 = 0** [L1].
- 제품 ProjectRepository 구현은 `createMemoryProjectRepository` 하나다(`main.tsx` → `deferredStudio`/`memoryStudio`).
- 반환 객체에 `core:`가 무조건 있다(`memoryProjectRepository.ts:146-152`). `toDocSaveRepository` → `useDocSave`로 감싸지 않고 전달된다.
- 공개 `saveDoc`의 제품 호출처는 0이다. `base` 삭제 뒤에도 memory 저장은 지금 revision 기준(`coreLink.book`)이다. local은 실패하면 DocBook 변화 0, 성공하면 `align`이 반영한다. 그래서 보정할 대상이 없다.
- (Low) `studioRepository.ts:19` `core!`: `CoreKeeper.core`가 타입상 선택이다. 코어 없는 저장소가 앞으로 생기면 컴파일이 아니라 실행 중에 깨진다.

**B-2 `testing/coreFixture.ts` 표현력**:

| 상황 | 표현 | 비고 |
|---|---|---|
| 실패(일반·quota) | 예 | reason 문자열이 제품과 다르다(`not-committed` vs `infra`). 화면에서 그 문자열을 읽는 곳은 0이다 |
| STALE | 예 | `head` = 동봉 문서. 제품 STALE은 writerLock 고정(새로고침 전까지)이고, 픽스처는 commit 단위다 |
| 지연 | 예 | commit이 stub promise(hold/release)를 기다린다 |
| readonly·unsupported·cleared | 예(방식 다름) | 제품은 `port.mode()`에서 commit 전에 판정한다. 픽스처는 commit reject와 사유 문자열 매칭이다 → StudioLeave 유지 행은 제품 reason 매핑을 시험하지 않는다(Med, 테스트 충실도) |
| verify | 아니오(늘 true) | confirm 경로는 L4. 지금 영향 작음 |
| rebasing | 다름 | 제품 CP0은 `unsettled`이면 **거절**한다. 픽스처는 `idle()`을 **기다린 뒤** 쓴다 → `useDocSaveWrite.test`의 "진행 중 저장 뒤에만 쓰기"는 `adopt()`의 `flushed()` 관문이 깨져도 통과할 수 있다(Med, 추정 — 변이로 확인하지 않음) |

- 과통과 위험은 **화면 테스트의 reason 출처**에 한정된다. 손실 경로의 핵심 단언(lease 해제 save · 레지스트리 경고 · U7 · U12 · 인계 2)은 픽스처가 아니라 **실제 저장소(testRig = 제품 LocalSync + 메모리 영속 장치)** 위에서 돈다(`useDocSaveLeave.test.tsx`). 그래서 이 레인의 손실 판정을 뒤집지 않는다.

**B-3 REPORT 4절의 바뀐 단언**:

| 파일 | 약화? |
|---|---|
| `useDocSaveCore.test` F9 | 아니오(설계 변경 I6 3.1-1 · hold 중 초안·dirty 보존 단언 추가) |
| `useDocSaveCore.save.test` readonly | **약화 가능(Med, 추정)**: base는 `leave()` promise가 끝난 뒤 `db.since(start)=[]`를 봤다. tip은 `setTimeout(0)` 1회 뒤에 본다. 이탈 저장이 끝났다는 보장이 없다. 제목 "leave() = true"도 낡았다 |
| `useAutosaveScheduler.hook.test` 경고 3→1 | 아니오(useDocSaveLeave로 이전 · 실제 저장소) |
| `useDocSave.test` 경고 2건 | 아니오(이전) |
| `localSync.test` 2건(+2→+1) | 코어 경로는 아니오. 공개 `saveDoc` local 회귀가 사라졌지만 제품 호출처 0이라 Low |
| `StudioLayout.test` PNG offline | 아니오(제품 사실과 맞춤) |
| `StudioLayout.test` 링크 즉시 저장 | 판별력 저하(Low) — 해제 save로도 "저장 1회"가 채워진다 |
| `SnapshotDelete.test` · `saveCoreGuard.test` | 아니오 |
| `useDocSaveWrite.test` | 단언은 무변경. 준비 과정에서 과통과 가능(위 rebasing) |

## 4. 변이 표 (매번 `git checkout -- app/` · 전체 스위트)

| 변이 | 위치 | 결과 | 잡은 테스트(대표) |
|---|---|---|---|
| M1 lease 해제 save 제거 | `useDocSave.ts` 언마운트 microtask의 `core.save()` 줄 | **FAIL 8** (3 파일) | useDocSaveLeave U12·U7·인계 2 · StudioLeave :99 · useDocSaveCore F9 |
| M2 레지스트리 경고 판정 제거 | `memoryProjectRepository.ts:148` 판정 → `false` | **FAIL 5** | useDocSaveLeave 경고 실패·STALE·memory·U12 |
| M3 예외 순서 ②③ 제거 | `leave()` ④ 조건 → `navigator.onLine`만 | **FAIL 6** | StudioLeave STALE·cleared·실패 보류 |
| M4 재마운트 시 새 코어 | `core()`의 `if (!core)` 제거 | **FAIL 20** (7 파일) | U7 · C5 T2 · StrictMode · 레지스트리 동일성 |
| M5 `SaveResult.revision` 좁힘 제거 | `reason === "not-persistent" ? … : undefined` → `result.revision` | **FAIL 1** | useDocSaveCore.save "L3a QA 4절 2" |

- 매 변이 뒤 `git status --short app/` = 비어 있음(restored-clean). 로그: `qa-shots/logs/mut-*.txt` · `mutations-summary.txt`.

## 5. 실화면 (Ego Lite space 15 · `vite preview` 127.0.0.1:4378 · build = tip 코드)

경로: origin 저장소 비움 → 카탈로그 → 모던 카페·동네 치과 비교 → A 전부 선택 → 프로필 v1 → 보정값 v2 → 3안 → A안으로 편집 시작 → `/studio/project-1`.

| 단계 | 결과 | 판정 |
|---|---|---|
| (b) 편집기 안 편집 직후 합성 beforeunload | 편집 전 false → 편집 직후 **true** → 4초 뒤 false · IDB rev 2 = 편집 | PASS |
| (a) 편집 직후 링크 → 즉시 이동 | ego 클릭 1회차: 왕복 1.1초 사이 커밋 완료(이동 뒤 경고 false · IDB rev 3 반영). 페이지 안 계측 2회차: 클릭 → `/projects` **0.3ms** · 동기 경고 true · 0ms true → 5ms false · IDB rev 4 = 마지막 편집(`qa-shots/a-link-leave-projects.png`) | PASS (brief의 "몇 초 뒤 false"는 실측 5ms 안 — 로컬 IDB 커밋이 빠름) |
| (c) 편집 → 뒤로 → 앞으로 | back 0ms(아직 `/studio`) true → 2ms `/projects` true → 5ms false · IDB rev 5 · forward 재진입 제목 = "QA-c POP 직전"(`c-pop-projects.png`) | PASS |
| (d) 이미지 1장 교체 · 즉시 이탈 · 재진입 | 640×400 PNG → "640 × 400 · WebP 3KB" → 즉시 링크: 0·5ms true → 20ms false · IDB images 1 · docs rev 6 → 재진입 메타 "640 × 400 · WebP 3KB" 복원 · 게이트가 "Hero 대표 이미지: 대체텍스트 없음"을 표시(이미지가 문서에 반영됨)(`d-image-reentry.png`) | PASS |
| (e) 스냅샷 복원 | "QA-e 기준" 저장 → 편집(rev 7) → 미리보기 → 복원 안내 "스냅샷 'QA-e 기준'으로 복원했습니다 · 복원 전 상태는 '복원 전 · 16:49'에 있습니다" · rev 8 · 제목 = 스냅샷 시점 값 → 복원 뒤 편집 rev 9(`e-restore.png`) | PASS |
| (e) 내보내기 전 저장 | 대체텍스트·SEO 입력(차단 0) → rev 11 → 제목 편집 **직후** "정적 HTML 내보내기" → IDB rev 12 = 그 편집 · 자동 스냅샷 "내보내기 전 · 16:50" · "내려받기" 표시(`e-snapshots-list.png`) | PASS |
| 콘솔·네트워크 | Runtime·Log·Network 활성 뒤 새로고침 + 편집: 이벤트 22종. `Runtime.consoleAPICalled` 0 · `exceptionThrown` 0 · Log error/warning 0 · `loadingFailed` 0 · ≥400 0. 새로고침 뒤 편집도 정상 | PASS (범위: 새로고침 뒤 구간만. 그 전 단계는 수집하지 않음) |
| 정리 | `Storage.clearDataForOrigin`(그 origin만) → `indexedDB.databases()` = `[]` · localStorage 0 · `finish({keep:[]})` · `listTaskSpaces()` = `[]` · preview 종료 · 4378 리슨 0 · 5480·영환님 창 무접촉 | 완료 |

## 6. fresh 게이트 (app/, 이 세션에서 실행)

| 명령 | 결과 |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npx eslint .` | exit 0 |
| `npx vitest run` | exit 0 · **331 파일 / 2953 통과** (기대와 일치) |
| `npm run build` | exit 0 · `/studio` 정규화 **129.03**(기준선 129.03 + 0.03 멈춤 129.06) · raw **130.36 / 130.5** · 복원 정규화 **132.01** · raw **133.39 / 134** — 개정 17 상한(129.13 / 132.11) 안 |

로그: `qa-shots/logs/{tsc,lint,test,build}.txt`.

## 7. 사실 / 추정 / 미확인 · L4/L5 조건

- **사실 [L1]**:
  - 1절 표의 테스트·실화면 관찰값, 4절 변이 결과, 6절 게이트.
  - 레지스트리 리스너에 옛 훅의 `event.returnValue = ""`가 없다(diff).
  - 레지스트리 리스너는 저장소 인스턴스마다 window에 붙고 해제되지 않는다. QA 임시 테스트 4건을 한 파일에서 돌리면 앞 테스트의 dirty 코어가 뒤 테스트의 "경고 false" 단언을 깨뜨렸다(개별 실행은 모두 PASS) → 테스트 격리 취약, 제품에서는 탭당 저장소 1개라 무관.
- **추정 [L2]**:
  - `returnValue` 누락: 현행 Chrome·Firefox·Safari는 `preventDefault()`만으로 확인 대화상자를 띄운다. 구형 브라우저에서는 대화상자가 안 뜰 수 있다(Low · 실제 대화상자는 미관찰, 합성 이벤트만 봄).
  - readonly 탭에서 편집하면 dirty가 영구히 남아 탭 경고가 계속 켜진다(데이터를 저장할 수 없으니 경고 자체는 맞다, UX note).
- **미확인**: 다중 탭 readonly·stale 실화면 · 오프라인 중 해제 save 실화면 · 저장 정지(T_hang) · bfcache 영향(Firefox는 `beforeunload` 리스너가 bfcache를 막을 수 있다) · `rebasing` 픽스처 과통과 변이.
- **L4 조건(권고)**:
  1. 상시 스위트에 "편집기 안 dirty 대기 중 경고 true"(QA Q1)와 "이동 뒤 해제 save 실패 → 경고 유지 · 재진입 재저장"(QA Q2)을 넣는다.
  2. `useDocSaveCore.save.test` readonly 행이 이탈 저장 완료를 기다린 뒤 쓰기 0을 단언하게 한다.
  3. 픽스처 `rebasing`을 제품 CP0처럼 `unsettled`이면 거절하게 맞추거나, 실제 저장소 위 adopt 테스트를 하나 더한다.
  4. 낡은 테스트 제목을 정리한다.
- **L5 조건**: `/projects` 행에 해제 save "저장 중…"·**실패** 표시(note 1, Medium) — RS6-AC-U11 나머지.
- **Jarvis 판단 필요 없음**: 판정을 막는 결정 사항 0.

## 8. 서브에이전트

- 읽기 전용 1개(general-purpose): 2절 StudioLeave 14건 대조 ∥ 3절 상쇄·픽스처. 결과를 2·3절에 통합했다. "High 결함 0"이라는 결론과 Med 4건을 메인이 코드로 대조했다. Med 1(이동 뒤 실패 시 초안·경고)은 QA 임시 테스트 Q2로 **제품 동작 정상**을 확인해 "테스트 공백"으로 분류했다.
- 메인: 손실 경로 추적 · 임시 테스트(`app/src/features/studio/qaTempLeave.test.tsx`, 실행 뒤 삭제 · 커밋 0) · 변이 5 · 실화면 · 게이트.
- 앱·테스트 커밋 0 · push·원격 쓰기 0 · Codex 0.
