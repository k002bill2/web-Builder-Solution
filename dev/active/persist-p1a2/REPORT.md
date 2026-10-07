# PERSIST-P1a-2 REPORT — 진입 하이드레이션 · 저장 배선 (예산 멈춤)

## 판정 — **멈춤: `/studio/:projectId` 진입 129.38KB > 개정 9 상한 129.15** (BRIEF·ADR-004 개정 9 결정 2)
- 기준(base `4c09dfa` fresh build, `/tmp` 사본) 128.51 → 현재 **129.38 (+0.87)**. 상한 129.15 대비 **+0.23**, P1b 이미지 자동 복원 몫(E0 +0.15)을 남기는 129.00 대비 +0.38.
- 그래서 **② ADR-004 개정 9 적용(eagerBudgetKb 130 · m2cBaseline · bundleBudget.test)은 하지 않았다**(BLOCKED). 검사기·기준선·테스트 고정값 변경 0.
- 구현 커밋은 check-bundle 실패 상태다(typecheck·lint·vitest는 통과). "빌드 깨진 채 커밋 금지"에서 벗어난 사유: 작업 보존 + E0 선례(예산 초과 스파이크를 레인 브랜치에 커밋, 병합 대상 아님). **이 브랜치는 예산 결정 전 병합 금지.**

## 번들 (gzip KB, 검사기 출력 그대로)
| 라우트 (한도) | 기준 4c09dfa | 현재 | 증가 |
|---|---|---|---|
| /studio/:projectId (129 · 개정 9 상한 129.15) | 128.51 | **129.38 ✗** | +0.87 |
| /projects (125) | 100.31 | 101.17 | +0.86 |
| /compare · (조정 있음) (125) | 121.88 | 122.60 | +0.72 |
| /profile (125) | 119.12 | 119.85 | +0.73 |
| /profile (3안 있음) (125) | 121.59 | 122.33 | +0.74 |
| /catalog (첫 화면 101 · 125) | 100.05 / 102.38 | 100.05 / 102.39 | +0.01 |
| /references/:id | 97.30 / 99.63 | 97.30 / 99.64 | +0.01 |
| 렌더 JS (90) | 84.19 | 84.19 | 0 |
- 125 한도 라우트 초과 0(최대 122.60).
- 모듈별(manifest 키 gzip, `/tmp/p1a2-sizes.mjs`): deferredStudio 2.07→2.76(**+0.69**: envelope·entryRead 진입 읽기·loadDeferredStudio·싱크 로더·onCommit) · memoryProjectRepository 1.44→1.61(**+0.17**: 문서 머리 폴백·getDoc 시드 대기·저장 뒤 IDB 확인 대기·memoryDocBook 미리받기 목록) · StudioLayout +0.02.
- 감량 시도(실측): 129.87 → 진입 toInfra 제거(P1a-1 REPORT 6항 안) 129.52(−0.35) → 싱크 import를 DocBook 경유·rebase를 DocBook으로 129.46(−0.06) → 싱크 import를 DocBook 청크 안 dynamic import로·동결을 싱크로 129.38(−0.08).
- 남은 후보(측정 안 함 [추정]): 진입 봉투 확인을 envelope 모듈 대신 인라인(checkEnvelope·STORE_NAMES가 진입 청크에서 빠짐) · memoryProjectRepository의 memoryDocBook 미리받기 목록(18개) 축소 · 청크 간 export 바인딩. 합쳐 0.23 이상인지는 불확실 — 예산 재상신 vs 감량 후속 레인은 Jarvis/영환님 결정.

## 구현 (문서·프로젝트 상태만)
- 진입(`entryRead.readEntry`, E0 안1-min 배치): `openForEntry` + `readEntryRecord`로 상태 1건(`studio/state`) + 진입 문서 1건(`docs/<projectId>`), 수제 schemaVersion 확인만. IDB 없음·열기 실패·버전 불일치·깨진 봉투 → **메모리로 시작(쓰기 0, 더 새 레코드 덮기 0)** · 저장소 없음(첫 실행) → local 빈 상태. 연결은 읽고 닫는다.
- 상태 레코드 = StudioState(잡 = **StoredJob 통째로**, 개정 1) + 프로젝트별 문서 머리(`/projects` hasDoc). 문서 레코드 = 문서 + 스냅샷 목록.
- `loadDeferredStudio`(main) → store 초기값 하이드레이션 · `persistence: "local"` · 문구 "이 브라우저에 저장됨"(`ProjectPersistence`에 `"local"` 추가, `needsUnloadGuard` local = server 조건).
- 조작 뒤 싱크(`persistence/localSync.ts`, memoryDocBook 청크에서 dynamic import): 탭당 연결·큐 1개. 열 때 진입 상태를 **실제 store 규칙으로 검증**(계열 1..n 연속 = insert · `validateProjectName` · 잡 = jobRecord zod + 공유 `stateOf`) · 문서 레코드는 `checkSaveDoc`(저장 판정 1과 같은 함수) → DocBook 시드. 위반 = INFRA, 쓰기 0.
- 쓰기: store 커밋 뒤 `onCommit` → 상태 레코드 put(응답 대기 없음, 실패는 다음 쓰기가 최신 의도로 덮음). 문서 쓰기(saveDoc·startDoc·스냅샷 3종·requestExport) 뒤 문서 + 상태를 한 트랜잭션으로 **IDB 커밋 확인 뒤 resolve** → SaveStatus "저장됨"은 그 뒤. 실패 = INFRA → 기존 재시도(멱등 재생 = `retry(key)` 미확인 재제출). IDB 실패 뒤 다음 편집 저장은 내 미확인 쓰기 위에 얹는다(STALE_DOC 아님).
- P1a-1 한계: ① 복제 실패 = 큐가 받은 제출만 기억 → 재생 때 다시 제출해 같은 INFRA(재시도로 풀리지 않음, 거짓 "저장됨" 0) ② 문구 = `toInfra(error, action, reason)` 사유 인자로 "저장 — 저장할 내용을 복제하지 못했습니다"(원인 일치) ③ `stateOf`를 `domain/generation`에서 export해 memoryGenerationRepository·jobRecord 공유 ④ 진입 읽기는 원 오류 그대로(분류는 조작 뒤, 6항 안).

## 알려진 한계 (수정 안 함)
- 비교 보드 미영속(보드 저장소 클로저 `board` — 확정 결과(프로필·프로젝트)는 상태 레코드로 남음). 저장한 레퍼런스(React context)도 범위 밖.
- 프로젝트·프로필·잡 변경(이름 변경·확정·생성 공개)은 IDB 커밋을 기다리지 않는다(쓰기만). 다음 문서 저장이 상태 레코드를 함께 쓴다.
- 검증 실패 시 싱크 열기 실패 → 문서 편집 저장 INFRA, 상태 쓰기는 조용히 버려짐(레코드 보존이 우선).
- IDB 실패 뒤 메모리의 문서 머리가 문서 레코드보다 앞설 수 있음(재시도·다음 저장이 맞춤).
- 생성 중 새로고침이면 getJob 공개 커밋이 싱크 청크(zod 포함)를 자동으로 받는다 — 검사기는 조작 뒤로 세지 않음.

## TDD
- 예측(PROGRESS) → RED 실측: localSync.test import 실패 · entryRead.test `readEntry is not a function` 4건 · saveStatusText local 1건 실패 — 예측 일치, 커밋 안 함. **어긋남 1건**: `needsUnloadGuard("local")`은 구현 전에도 런타임 통과(타입에서만 RED).
- GREEN: persistence 9파일 48 + deferredStudio·saveStatusText 등 — 단언 약화·skip 0. 테스트 셋업 수정 2건(이름 변경 revision을 getProject로 · 검증 테스트 열기마다 새 연결 흉내).

## 검증 (fresh)
| 명령 | 결과 |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run build` | **exit 1** — check-bundle `/studio/:projectId 129.38KB > 129KB` (그 밖 전 행 통과) |
| `npx vitest run` 전체 1회 | exit 0 · 260 파일 · 2269 테스트 |
| Ego Lite | **부분 실측 — 시나리오 미완(시간)**, 아래 |

## 남은 P1b~P1d 입력
- P1b: 진입 예산 여유가 없다(현재 상한 초과). 이미지 자동 복원 +0.15 전에 예산 결정 필요. 이미지 저장소 키(`[projectId, id]`)는 미정 그대로.
- P1c: 다중 탭(Web Locks)·"데이터 지우기"·사용량 · StudioPanels/ExportAfter "이 탭에 저장돼 있습니다" 문구 분기 · 강등 문구(Designer).
- P1d: 스냅샷 보존·삭제 · 단조 카운터(지금 id는 길이 기반 그대로).

## Ego Lite (build + `vite preview --port 4337`, TaskSpace 19)
- 창 상태 조회는 windowState 값 없음(최소화 아님 판단) · 캡처 0장(시간 부족으로 생략).
- 진행: /catalog → 저장 버튼 3회(비교 추가로 잘못 누름 — 보관함에 3개 저장됨) → 앱 안 이동 /compare(비어 있음) → /catalog → "비교 추가" 버튼 클릭이 3초 타임아웃(호버 노출 버튼 추정 [추정]) → 시나리오 중단. **새로고침 0회.**
- IDB 실측 1건: /catalog 진입 때 DB 없음(`indexedDB.databases()` = []) → store 라우트(/compare) 진입 뒤 `design-studio` **v1 빈 DB** 생성 확인(진입 읽기가 버전 없이 엶 — 첫 실행 경로). v1→v2 업그레이드·저장·새로고침 생존·생성 중 새로고침은 **미실측(BLOCKED: 시간)**.
- /projects 빈 상태 문구 "새로고침하면 프로젝트가 사라집니다(서버 연결 전)"가 local 모드에서도 그대로 — P1c 문구 몫으로 넘김.
- 정리: `indexedDB.deleteDatabase("design-studio")` = **onsuccess** → `databases()` = [] · `finish({keep:[]})` · `listTaskSpaces()` = [] · preview 종료, 4337 리슨 0 · `/tmp/p1a2-base`(기준 빌드 사본) 삭제. main 5480·영환님 창 무접촉.

---

# 마감(BRIEF-F)

## 판정 — 완료: 게이트 4종 exit 0 · /studio 진입 129.35(한도 130 · 상한 129.60 이내) · Codex r1 P2 2건 수정 · Ego Lite 새로고침 생존 실측(스냅샷 목록 결함 → 수정 뒤 재확인 통과)

## 1. Ego Lite 새로고침 생존 실측 (HEAD `f7a09e0` 코드, TaskSpace 20)
- **dist 생성 방법**: `npm run build` 그대로 — check-bundle(마지막 단계)만 exit 1(129.38 > 129), 앞 단계(tsc·build-thumbs·`vite build`·`vite build --mode render`)는 완료돼 `dist/`(index.html·render.html·assets·thumbs) 생성됨. 별도 단계 실행 불필요. → `npx vite preview --port 4337 --strictPort`.
- 창: `Browser.getWindowForTarget` = `windowState: "normal"`(최소화 아님, 조작 없음). 캡처 4장 `shots/`(뷰포트 clip, fullPage 아님 — ego-browser `screenshot()`은 `captureBeyondViewport` 옵션을 받지 않아 clip만 지정, 기본이 뷰포트 캡처).
- 진행: `/catalog`(IDB `databases()`=[]) → 카드 제목 → `/references/ref-a` **상세의 "비교 추가"**(→ "비교 중") → "보드 열기" `/compare`(이때 `design-studio` **v1** 생성) → "이 레퍼런스로 프로필 만들기" → "프로필 확정 (v1)" → `/profile/profile-1` → "3안 만들기 (v1)"(이 뒤 **v2** — v1→v2 업그레이드 관찰) → "이 안 선택"(A) → "A안으로 편집 시작" → `/studio/project-1` → Hero 제목 "새로고침 생존 실측" 입력 → **"이 브라우저에 저장됨 · 8초 전"** 확인(캡처는 스냅샷 저장 직후 `1-snapshot-saved.png`) → 스냅샷 "생존1" 저장(목록 1개 "생존1 · 수동 · 21:08 · 프로필 v1 · A안").
- **새로고침 1회**(`page.reload()`, `/studio/project-1` 직접 진입):
  - 편집 유지 ✓ — Hero 제목 입력값 "새로고침 생존 실측" (`2-after-reload.png`).
  - 스냅샷 대화상자 **"아직 스냅샷이 없습니다" ✗** — Codex r1 P2 ② 결함 재현(`3-snapshots-after-reload.png`). → 3에서 수정.
  - 저장 상태 문구는 새로고침 직후 표시 없음(저장 전이라 상태 없음 — 관찰만).
  - 앱 안 이동("프로젝트로 돌아가기") `/projects`: "모던 카페 브랜드 프로젝트 · 편집 중 · A안 · 프로필 v1" 유지 ✓ (`4-projects-after-reload.png`). DB `{design-studio, version 2}`.
- 정리: `indexedDB.deleteDatabase("design-studio")` = **onsuccess**(앱 연결이 열린 상태에서도 blocked 아님 → versionchange 닫기 동작) → `databases()`=[] · `finish({keep:[]})` · `listTaskSpaces()`=[] · preview 종료, 4337 리슨 0. main 5480·영환님 창 무접촉.
- 생성 중 새로고침: 미실측(이번 브리프 시나리오 밖).

## 2. 감량 1회 + 예산 적용
- 후보 ① **진입 봉투 확인 인라인**(entryRead가 envelope 모듈 값을 import하지 않음 — `ENTRY_DB_NAME`·`checkEntryEnvelope` 사본, envelope 규칙과의 동치는 entryRead.test가 10개 레코드로 고정): 실측 129.38 → 시험판 129.31 → 최종(export 추가) **129.33(−0.05)**. 커밋 `ab73c67`.
- 후보 ②(memoryDocBook 미리받기 목록 축소)는 이번 1회 시도에 넣지 않음 — 미리받기 목록은 Vite 생성 코드라 청크 구조 변경이 필요(범위·시간 대비 이득 불확실 [추정]).
- 적용 `b801ab3` "ADR-004 개정 9·10 배분 P1a": `check-bundle-size.mjs` `/studio/:projectId` `eagerBudgetKb` 129 → **130**(주석 개정 9·10) · `m2cBaseline.json` 128.55 → **129.33**(base ab73c67) · `bundleBudget.test.mjs` 고정값. 판정 로직 변경 0.
- 3의 수정으로 진입 +0.02(129.35, 허용 0.03 안) → 브리프대로 기준선 포함 `41f65f9`: 기준선 **129.35**(base cc6a5a9, 판정선 129.38). 상한 129.60 대비 여유 0.25(P1b 이미지 자동 복원 E0 +0.15 수용 가능 [추정]).

| 라우트 (한도) | 앞 레인 | 마감 |
|---|---|---|
| /studio/:projectId (130 · 상한 129.60) | 129.38 ✗(129) | **129.35 ✓** |
| /projects (125) | 101.17 | 101.14 |
| /compare · (조정 있음) (125) | 122.60 | 122.55 |
| /profile · (3안 있음) (125) | 119.85 · 122.33 | 119.80 · 122.28 |
| /catalog (첫 화면 101 · 125) | 100.05 / 102.39 | 100.05 / 102.39 |
| /references/:id | 97.30 / 99.64 | 97.30 / 99.64 |
| 렌더 JS (90) | 84.19 | 84.19 |

## 3. Codex r1 P2 2건 (TDD, `cc6a5a9`)
- ① **A 실패 → B 실패 → B 재시도 STALE_DOC**: 원인 = 멱등 키가 `local.base`로 보정된 revision(`2|B`)으로 기록되는데 재시도는 원래 revision(`1|B`)으로 옴. 수정 = `memoryDocBook.save` 멱등 키를 **요청의 원래 revision**(`${requested}|hash`)으로 — 메모리 모드(보정 없음)는 키 동일. 재시도는 멱등 재생 → `flush`가 미확인 기록 재제출(`queue.retry`).
- ② **직접 진입 뒤 쓰기 전 listSnapshots = []**: 수정 = `memoryProjectRepository`에 `entered()`(getDoc과 공유) — 진입 문서면 진입 레코드 스냅샷 반환, 비진입인데 문서 머리가 있으면(/projects → 앱 안 이동) DocBook 시드 대기.
- TDD: 예측 PROGRESS 기록 → RED 2건(① `STALE_DOC: revision 1 ≠ 3` reject, ② `expected [] to deeply equal [snapshot]`) 예측 일치, RED 커밋 안 함 → GREEN. Red-Green: 수정만 되돌리면 2 failed / 복원 10 passed. 단언 약화·skip 0.

## 4. 스냅샷 목록 Ego Lite 재확인 (TaskSpace 21, 같은 절차)
- 창 normal · `databases()`=[] 시작 → 같은 시나리오 → Hero 제목 "스냅샷 목록 재확인" · "이 브라우저에 저장됨" → 스냅샷 "재확인1" → **새로고침 1회** → 편집 유지 ✓ · 스냅샷 대화상자 **"재확인1 · 수동 · 21:15 · 프로필 v1 · A안" ✓** (`5-snapshots-after-reload-fixed.png`).
- 정리: `deleteDatabase("design-studio")` = onsuccess → `databases()`=[] · `finish({keep:[]})` · `listTaskSpaces()`=[] · preview 종료, 4337 리슨 0. 새로고침 합계 2회(F1 1 · F4 1).

## 검증 (fresh, 마감 HEAD 기준)
| 명령 | 결과 |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npx vitest run` 전체 1회 | exit 0 · 260 파일 · 2272 테스트 |
| `npm run build` | exit 0 · /studio 129.35 / 130 · 기준선 129.35 + 0.03 |

- Codex 실행 0(Jarvis 몫). 엔진·PageDoc 계약·docs·lock·CLAUDE.md 수정 0 · 새 의존성 0 · 서브에이전트 0 · push/merge 0.
- 남은 것: 생성 중 새로고침 실측(시나리오 밖) · /projects 빈 상태 문구 local 분기(P1c) · 이 마감 커밋들에 대한 Codex 재검증(Jarvis).

## Codex r2 수정 (마지막 라운드, `f2eaab3` · 기준선 `f73af1a`)
대상 = `codex-r2-jarvis.txt` 3건만. TDD: 예측 PROGRESS 기록 → RED 3건 예측 일치 → GREEN. RED 커밋 없음 · 단언 약화·skip 0. Red-Green: 수정 3파일만 되돌리면 3 failed / 복원 15 passed.

| # | 재현(회귀 테스트) | 원인 | 수정 |
|---|---|---|---|
| ①P1 | localSync.test "ref-a 확정 → 새로고침 → 새 보드에서 ref-b 확정" — RED `expected 'profile-1' to be 'profile-2'` | 확정 멱등 기록(store commits)은 복원되는데 보드는 영속 범위 밖이라 같은 id `board-current`·같은 revision으로 다시 만들어져 `replayOf`가 이전 확정을 재생 | 보드 영속은 범위 밖 → **새 멱등 네임스페이스**: `createMemoryCompareBoardRepository`에 `boardId` 옵션(기본 `board-current`), `deferredStudio`가 로컬 영속일 때만 세션별 id(`board-<시각36><난수>`)를 넘긴다. 메모리 모드·테스트 동작 그대로 |
| ②P2 | localSync.test "스냅샷 복원 IDB 실패 → 같은 요청 재시도" — RED `STALE_DOC: revision 2 ≠ 3` | 복원은 메모리 revision을 올린 뒤 IDB 실패 → 같은 요청 재시도가 STALE 판정에서 막혀 `flush`까지 못 감 | 저장 경로와 같은 방식 — DocBook `restores` 멱등 기록(키 `snapshotId\|expectedRevision`, 프로젝트당 마지막 1건). 재시도 = 재생 → `flush`가 같은 레코드를 보고 `queue.retry`(미확인 쓰기 재제출). 테스트가 IDB 문서·스냅샷 목록까지 확인 |
| ③P2 | chunkRetryWiring.test "localSync도 retryableImport" — RED `expected [] to have a length of 1` | `openLocalSync`가 맨 `import()` — 청크 실패가 URL 단위로 캐시되면 새로고침 전까지 복구 불가 | `memoryDocBook`의 `loadLocalSync = retryableImport(() => import("./persistence/localSync"))` |

- 한계(그대로 둠): ② 재생은 저장(saveDoc)과 같이 "마지막 성공 1건" 비교라, 복원 성공 뒤 다른 편집을 저장하고 같은 인자로 다시 복원하면 STALE 대신 이전 결과를 재생한다(저장 경로와 같은 성질 — 이번 범위 밖). 멱등 기록은 메모리 모드에도 적용 — `phase:"response"` 실패 뒤 같은 인자 재시도는 이제 STALE_DOC 대신 이전 결과 재생(저장·startDoc과 같은 동작, 기존 테스트 전부 통과).
- 번들: /studio 진입 129.35 → **129.41**(+0.06, 예측 +0.02~0.05 대비 +0.01 초과 — deferredStudio 세션 id 식) · 상한 129.60 이내 → 기준선 `f73af1a` "ADR-004 개정 9·10 배분 P1a" **129.41**(base f2eaab3, 판정선 129.44). 여유 0.19. 다른 라우트: /projects 101.20 · /compare 122.61 · /profile 119.86/122.33 · /catalog 100.05/102.39 · /references 97.30/99.64 (모두 한도 안).

### 검증 (fresh, f73af1a 기준)
| 명령 | 결과 |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run build` | exit 0 · /studio 129.41 / 130 · 기준선 129.41 + 0.03 |
| `npx vitest run` 전체 1회 | exit 0 · 260 파일 · 2275 테스트 |
| `npx vitest run scripts/bundleBudget.test.mjs` | exit 0 · 17 테스트(기준선 고정값 f2eaab3·129.41) |

- Codex 실행 0 · Ego Lite 0(브리프: 불필요) · 엔진·계약·docs·lock 수정 0 · 새 의존성 0 · 서브에이전트 0 · main 5480 무접촉 · push/merge/삭제 0.
- 남은 것: r3 없음 — 이 수정분 Codex 재검증 여부는 Jarvis 판단.
