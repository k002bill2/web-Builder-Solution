# RS6-L3a REPORT — 편집기 배선 전반부 (CP0 · CP1 · CP2 · 감시 결선 · reject 매핑)

브랜치 `k002bill2/rs6-l3-editor` · base `0323c4a0` · 2026-10-17 · 커밋 `e0040576`(착수) → `4b68a740`(CP0) → `61dd1273`(CP1·CP2) → `45831121`(이미지 바인딩 회귀 수정) → REPORT 커밋

## 0. 결론

- **PASS (예산 note 1건)**. CP0·CP1·CP2 AC가 전부 GREEN이다. 기존 테스트는 깨진 것 0, 바뀐 단언 0이다.
- **예산**: 정규화 `/studio` **129.04**(base 128.63 대비 **+0.41**). L3a 목표 +0.25를 넘었다. 감량 1회 뒤에도 넘었지만 상한 129.13 안이라 멈추지 않았다.
  - 남은 여유는 정규화 **0.09**, 복원 진입 **0.09**(132.03 / 132.11), raw **0.11**(130.39 / 130.5)이다. L3b·L4·L5가 쓸 몫이 거의 없다. 6절 상쇄 후보 참고.
- **Jarvis 확인 필요 계약 변경 2건**: ① `DISCARD_GIVE_UP_MS`를 `liveness.ts`에서 `coreIo.ts`로 옮겼다. L2의 "시간 값 1곳" 문장이 깨진다. ② `SaveResult` failed 변형에 선택 필드 `revision`을 더했다(memory 모드 전용).

## 1. AC 판정

| AC | 판정 | 근거(테스트) |
|---|---|---|
| CP0 복원·충돌 해결·restart 뒤 다음 코어 save가 같은 revision을 덮어쓰지 않음 | PASS | `save/saveCore.rebase.test.ts` 9건: 복원 · mine · mine 뒤 새 편집 · theirs · restart 재진입 · dirty 거절 · 진행 중 save 뒤 STALE · memory · reject |
| CP1 `change`마다 `core.edit` 1회 | PASS | `useDocSaveCore.test.tsx` "change마다 core.edit 동기 1회" |
| CP1 F9 dispose 뒤 디바운스 편집 보존 | PASS | 같은 파일 "F9" |
| CP1 U6 StrictMode 같은 토큰 · 새 코어 0 · mark 변화 0 | PASS | 같은 파일 "StrictMode". 즉시 release로 바꾸면 FAIL하는 것을 확인했다(Red-Green) |
| CP1 감시 결선(`watchSaving` + dispose 때 `stop`) | PASS | `useAutosaveScheduler.watch.test.tsx` 2건(slow·hang 표지 · 언마운트 뒤 타이머 0) |
| CP2 저장 대상 = `core.save()` · saveDoc 0 | PASS | `useDocSaveCore.save.test.tsx` "로컬: … core.save 1회 · saveDoc 0" |
| CP2 U3 실패 시 DocBook revision 변화 0 | PASS | 같은 파일 "U3" |
| CP2 재진입 seed = `view()` · 거짓 STALE 0 (C5 T2) | PASS | 같은 파일 "C5 T2" |
| CP2 결과 매핑(memory not-persistent = 저장됨 · readonly = 이탈 허용) | PASS | 같은 파일 "memory 모드" · "readonly" |
| CP2 `useDocSave` `latest` 정리 | **부분** | 코어 경로는 `latest`를 설정하지 않는다. 상태 제거는 기존 단언 2건(`useDocSave.test.tsx:212` · `StudioLayout.test.tsx:157`)을 지워야 해서 약화 금지 규칙과 충돌한다. 그래서 코어 없는 폴백에만 남기고 제거는 L3b(충돌 UI)로 넘겼다 |
| reject 매핑(L2 QA 4절 1~3, 이 레인이 만지는 호출처) | PASS | 3절 |
| `StudioLeave.test.tsx` 14건 그대로 GREEN | PASS | 전체 실행(mock 저장소 → 기존 경로) |

## 2. 설계 요지

- **CP0**: BRIEF의 "revision 기준을 코어와 맞춤" 경로를 택했다.
  - 근거: MQ-6-5 A의 `replace`만으로는 `confirmed`·`savedMark`가 바뀌지 않아, 다음 save가 여전히 같은 revision을 쓴다.
  - 코어가 있는 프로젝트의 DocBook 쓰기(`restoreSnapshot`·`resolveConflict`·`start`)는 다음 순서로 처리한다.
    1. 코어 chain 뒤(`idle`)에서 실행한다.
    2. commit 직전에 같은 동기 구간에서 판정한다: save가 진행 중이거나, 미저장 편집이 있으면(충돌 해결 제외) `STALE_DOC`으로 거절하고 쓰지 않는다.
    3. 같은 동기 구간에서 `coreIo.rebase`로 코어를 쓴 문서에 맞춘다: doc · confirmed · savedMark · epoch+1 · 복귀 바인딩.
  - 본문은 조작 뒤 청크(`coreIo.ts`·`memoryDocBook.ts`)에 있다. 진입 코드는 코어 state만 넘긴다.
  - **flush 뒤가 아니라 쓰기 시점에 맞추는 이유**: flush 도중 코어 save가 시작되면 옛 기준으로 같은 revision을 쓰게 된다. 쓰기 시점에 맞추면 그 save는 R+2가 되고, writeQueue(탭 직렬)가 flush 뒤에 싣는다.
- **CP1·CP2**: `useDocSave`는 `repository.core`가 있을 때만 코어 경로를 탄다.
  - seed = `view().doc` · 편집마다 `core.edit` · lease effect · 저장 = `core.save` 결과 매핑 · 재진입 때 dirty면 저장 차례에 올린다.
  - 코어가 없는 저장소(테스트 mock)는 기존 saveDoc 경로를 그대로 쓴다. 이 폴백이 없으면 11절 밖 테스트가 깨진다: ImageUndo 8 · StudioLayoutImages 7 · SnapshotImages 3 · StudioPage 9 · StudioLeave 14.
- **이미지 바인딩** (advisor 지적 → RED 확인 → 수정):
  - 코어 경로는 `kept` flush를 거치지 않아서, 새 이미지 편집을 저장하면 `failed{image-missing}`이 났다.
  - 수정: `CoreLink.images`(저장소 `maps.get`)를 `coreIo.save` 시작 때 코어 바인딩에 합친다. 기존 flush와 같은 시점이다.
  - G2의 "edit(doc, blobs)" 문구와 다르다. 이유: ingest 직후의 편집은 맵 state가 갱신되기 전이라, edit 시점에는 Blob을 받을 수 없다.
- **목업·문구·화면 변경 0.**

## 3. reject 매핑 위치

| 위치 | reject 원인 | 매핑 | 테스트 |
|---|---|---|---|
| `useDocSave` save → `core.save()` | 연결 실패(코어가 `failed{unavailable}`로 흡수) · io throw | 스케줄러 catch → `failed`. 거짓 saved 0 · DocBook 변화 0 | "reject 매핑: core.save reject → failed" |
| `memoryProjectRepository` `coreState` → `core.link` (CP0, L2 QA 4절 3 "문서 교체 진입점") | 청크·싱크 연결 실패 | 쓰기 호출 reject. DocBook 판정 전이라 쓰기·스냅샷 변화 0 | rebase "reject 매핑 … core.link" |
| `core.link` confirm(4절 1) · `core.discard()`(4절 2) | — | **이 레인에는 호출처가 없다**(이탈 대기·confirmDoc·폐기 대화상자는 L3b·L4) → 인계 | — |

## 4. 깨진 / 바뀐 기존 테스트

- 깨진 기존 테스트: **0**. I6 11절 예상("변경 많음")과 차이가 큰 이유는 mock 저장소 폴백이다. 11절 대상 테스트의 단언 변경은 L3b(이탈·충돌·복원 화면)에서 일어난다.
- 바뀐 것은 2건이며, 둘 다 단언 의미는 그대로다.

| 파일 | 이전 | 이후 | 사유 |
|---|---|---|---|
| `save/liveness.discard.test.ts:6` | `import { DISCARD_GIVE_UP_MS } from "./liveness"` | `from "./coreIo"` | 감량 1회(상수 이동). 단언 변경 0 |
| `scripts/bundleBudget.test.mjs` 기준선 기대값 | raw 129.96·132.99 / 정규화 128.63·131.61 | CP0: 129.98·133.02 / 128.67·131.65 → CP1·CP2: 130.39·133.43 / 129.04·132.02 | 개정 17 배분 절차(실측 갱신) |

- 테스트 수: base 326 파일 / 2924 → **330 / 2945**(+4 파일 · +21). 내역: CP0 9 · CP1 5 · CP2 7(이미지 1 · reject 1 포함).

## 5. 감시 결선 실측 증분

- 1차 결선: `liveness.ts`가 진입 쪽(스케줄러)과 DocBook 청크(coreIo)의 공유 모듈이 되면서 **별도 청크 `liveness-*.js`(267B raw)가 생겼다** → 정규화 +0.26.
- 감량 1회: `DISCARD_GIVE_UP_MS`를 `coreIo.ts`로 옮겼다 → 공유 청크 0, 결선 증분 **+0.13**. L2가 추정한 +0.1보다 크다.

## 6. 예산 표 (정규화 gzip KB · 개정 17)

| 시점 | `/studio` 정규화 | 복원 진입 정규화 | raw `/studio` | raw 복원 |
|---|---|---|---|---|
| base(L2 머지) | 128.63 | 131.61 | 129.96 | 132.99 |
| CP0 | 128.67 (+0.04) | 131.65 | 129.98 | 133.02 |
| CP1 1차(감시 공유 청크) | 129.03 | 132.02 | 130.40 | 133.43 |
| CP1 감량 뒤 | 128.90 | 131.89 | 130.26 | 133.29 |
| CP1·CP2 | **129.04** | **132.02** | **130.39** | **133.43** |
| 최종(이미지 수정 포함) | 129.04 | 132.03 | 130.39 | 133.42 |
| 상한 | 129.13 | 132.11 | 130.5 | 134 |

- 증분 분해: CP0 +0.04 · 감시 결선 +0.13 · `useDocSave` CP1(코어 획득·edit·lease) 약 +0.10 · CP2(save 매핑·재진입 저장) 약 +0.14.
- raw가 130을 처음 넘은 커밋(`61dd1273`)에서 `check-bundle-size.mjs` `/studio` `eagerBudgetKb`를 130 → **130.5**로 올리고 주석 "ADR-004 개정 17 결정 1·2 — RS6 몫"을 달았다. 다른 한도는 바꾸지 않았다.
- **상쇄 후보(L3b)**: `useDocSave`의 코어 없는 폴백(saveDoc 경로 · `latest` · 사유 문장 readonly 판정)은 제품에서 죽은 코드다. 지우려면 11절 밖 mock 픽스처(ImageUndo · StudioLayoutImages · SnapshotImages · StudioPage · StudioLeave)를 코어 있는 저장소로 옮겨야 한다.
- 최종 build 전 라우트 표(`/tmp` 실측을 그대로 옮김):

| 라우트 | 첫 화면 / 예산 | 진입 직후 / 예산 |
|---|---|---|
| /catalog | 100.06 / 101 | 102.40 / 125 |
| /references/:id | 97.47 / 100 | 99.80 / 125 |
| /compare | 98.96 / 100 | 122.70 / 125 |
| /compare (조정 있음) | 98.96 / 100 | 122.70 / 125 |
| /profile | 99.56 / 100 | 120.11 / 125 |
| /profile (3안 있음) | 99.56 / 100 | 122.59 / 125 |
| /projects | 99.16 / 100 | 108.92 / 125 |
| /studio/:projectId | 91.54 / 100 | 130.39 / 130.5 |
| /studio/:projectId (저장 데이터 복원 진입) | 91.54 / 100 | 133.42 / 134 |

## 7. 검증 (fresh)

- `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npx vitest run` **330 파일 / 2945 통과** · `npm run build` exit 0(예산 검사 통과).
- **Ego Lite** (space 12 · `vite preview` 127.0.0.1:4375 · fresh build):

| 단계 | 결과 |
|---|---|
| 1. 진입 준비 | origin IDB·localStorage 비움 → 카탈로그 → 비교 추가(모던 카페·동네 치과) → 전부 선택 → 프로필 확정 v1 → 3안 → A안 편집 시작 → `/studio/project-1` |
| 2. 제목 편집 | "QA L3a 첫 편집" → "이 브라우저에 저장됨 · 방금"(코어 경로) |
| 3. 새로고침 | 복원됨 (`logs/ego-01-reload.png`) |
| 4. 스냅샷 | 스냅샷 "QA 기준" 저장 → 편집 "QA L3a 스냅샷 뒤" → 저장됨 → 미리보기 → 복원. 안내 "스냅샷 'QA 기준'으로 복원했습니다 · 복원 전 상태는 '복원 전 · 15:33'에 있습니다" · 제목 = "QA L3a 첫 편집" |
| 5. 복원 뒤 편집 (CP0 실경로) | "QA L3a 복원 뒤 편집" → 저장됨 → 새로고침 → **복원 뒤 편집 유지** (`logs/ego-02-restore-edit-reload.png`) |
| 6. `/projects` | 앱 안 링크로 이동 → "모던 카페 브랜드 프로젝트 · 편집 중 · A안 · 프로필 v1" (`logs/ego-03-projects.png`) |
| 7. 콘솔·네트워크 | 편집기 진입 뒤 ~ `/projects`: 이벤트 243개 중 exception·console error/warn·Log error·loadingFailed·≥400 **0** |
| 8. 정리 | `Storage.clearDataForOrigin` → `indexedDB.databases()` = `[]` · `finish({keep:[]})` · `listTaskSpaces()` = `[]` · preview 종료 · 4375 리슨 0 · 5480·영환님 창 무접촉 |

- 한계: 카탈로그 ~ 편집 시작 구간은 콘솔 수집 전이다. 이미지 업로드는 브라우저에서 확인하지 않았다(단위 테스트 "새 이미지 편집 저장"으로 갈음).

## 8. L3b 인계 목록

1. **링크 이탈·lease 해제 save(MQ-6-7 A)·POP·U7**: 지금은 F9로 코어 초안이 보존될 뿐, 디바운스 중에 이탈하면 저장 주체가 없다. 다음 마운트 때 dirty면 저장 차례에 올리는 것까지만 들어갔다. `StudioLeave` 3.1-4 표대로 처리.
2. **새로 도달 가능한 경로**: 편집 → 2초 안에 뒤로 → 코어 dirty로 남음 → `/profile` "새로 시작" → CP0 가드 → `STALE_DOC`. `restartFlow.ts:179` 첫 요청 = `{ reason }`(R-E1 안내)이다. 결과는 쓰기 0이라 안전 방향이지만 문구가 실제 원인과 맞지 않는다 → lease 해제 save(1번)가 들어오면 사라진다. 확인할 것.
3. **화면 호출처 전환**: `SnapshotPreview` adopt · `ConflictCallout` resolve · `useExportFlow` 저장 먼저 · `restartFlow` confirmDoc/startDoc. 저장소·코어 층 규칙(CP0)은 끝났으므로 화면은 결과(`STALE_DOC` = 미저장/진행 중)를 안내로 매핑하기만 하면 된다. `core.link` confirm(L2 QA 4절 1) · `core.discard()`(4절 2) reject 매핑도 이 호출처에서 한다.
4. **`latest` 상태 제거 + 코어 stale 시 최신 문서 출처**: 코어 경로에서 `conflict.latest`는 undefined다. 충돌 UI를 바꿀 때 기존 단언 2건을 함께 교체한다.
5. **상쇄 후보**: `useDocSave` 코어 없는 폴백 제거(mock 픽스처 이전 필요). 예산 여유가 0.09뿐이다.
6. **CP0 잔여(낮음·안전 방향)**:
   - (a) DocBook 쓰기의 flush가 IDB에서 실패하면, 코어는 이미 rebase되어 clean이고 편집기는 옛 문서를 유지한다. 재진입하면 복원 문서가 seed된다.
   - (b) flush 창 안의 confirm·discard는 IDB 재읽기가 맞지 않아 `stale`/`blocked`로 실패한다. 거짓 성공은 아니다.
7. S6c 제거 목록 · `LocalSync.base` 삭제 · `StudioLeave` 대응(원래 L3b 범위).
8. **편집 틀 이미지 맵 cleanup**: 코어 바인딩이 탭 수명이라 Blob을 쥔다. I6 1.2 I6 행의 "맵 cleanup 삭제는 L3에서 정리"는 아직 하지 않았다.

## 9. 서브에이전트

- 읽기 전용 1개(Explore · I6 11절 깨질 테스트 실제 목록·예상 delta 조사): 완료.
  - 핵심 발견 "mock 저장소 = core 없음 → 폴백 필수"가 CP1·CP2 설계를 정했다.
  - memory `savedRevision` 위험 → `SaveResult.revision`으로 해결.
  - `latest` 충돌 → 부분 정리로 처리.
  - 쓰기는 메인만 했다.

## 10. 사실 / 추정 / 미확인

- **사실 [L1]**:
  - 위 테스트·빌드·Ego Lite 수치 전부.
  - 이 테스트 환경(React 19.3 · NODE_ENV=test)은 StrictMode에서 렌더만 2회, effect는 1회다(실측 `2/1`). 그래서 U6는 `Activity` 숨김→보임을 같은 동기 구간에서 재현해 검증했다.
- **추정 [L2]**: 실제 브라우저 StrictMode(dev 서버)의 effect 2회 경로도 같은 결과일 것이다(같은 commit 안 재-acquire → 같은 토큰). preview는 production이라 StrictMode가 없다.
- **미확인**:
  - 이미지 업로드 실브라우저 경로.
  - 실경로에서 slow·hang 표지(저장 정지 주입 없음).
  - 멀티탭 readonly 실화면.
