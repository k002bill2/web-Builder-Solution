# B-M2B-05 TYPESCALE SPEC — 3안 제목 비율 축(`axes.typeScale`) 전달: 영향 범위 명세 (r0)

- 작성: Designer(B-M2B-05 명세 레인, 앱 코드 0 · 외부 리서치 0) · 2026-10-20 · base `cedbf587`
- 발주: Jarvis 2026-10-20 (영환님 "1" — ★A: 영향 범위 명세 먼저, **계약 변경 단계에서 재승인**)
- 상위 근거: BACKLOG B-M2B-05 · `docs/design/m2b/MQ-M2B5.md` MQ-M2B5-2(★A 결정, C = 이 티켓) · `docs/design/m2b/SPEC-COMPARE3.md` F9·F10·2.4·2.5 · `docs/design/2a-04/SPEC.md:468` · `docs/design/m4b/REACTZIP-SPEC.md` 2.3(`site.json` v1)
- 표기: [L1] 이 worktree 파일 직접 확인 · [L3 추정] 실측 전 · [확인 필요] 구현 레인 실측 대상. 경로는 `app/src/` 기준.
- 이 문서는 **결정하지 않는다**. 방안·계약 목록·질문을 정리하고, 엔진 계약·저장 스키마·새 의존성·예산 상향은 5.2 "사용자 질의"로 넘긴다.

---

## 0. 요약

1. **값은 편집 시작 한 곳에서 사라진다 [L1].** 3안 `plan.axes.typeScale`은 생성(`domain/composeCandidates.ts:81-85·273`)·카드·비교 표까지 살아 있다. 그런데 저장소 `start`가 `writeStartDoc`에 `plan.sections`만 넘기고(`data/memoryDocBook.ts:425`), 입력 타입 `StartDocInput`에도 축 필드가 없다(`data/startDocWrite.ts:30-41`). 그 뒤 렌더·PNG·정적 HTML·React zip은 모두 `docKitTokens(series, doc.profileVersion)` = 프로필 base `scale`로 그린다(`features/studio/docPurpose.ts:42-56`).
2. **하류 계약은 그대로 둘 수 있다 [L1].** 렌더 프로토콜 `KitTokenInput.type.scale`(`render/protocol.ts:22`, 범위 1~2 `:83`)과 `site.json` v1 `kitTokens`(`features/studio/reactZip/siteJson.ts`)는 **값만** 바뀌고 모양은 바뀌지 않는다. 바뀌는 곳은 "킷 토큰의 scale을 무엇으로 정하나" = `docKitTokens`의 입력 한 곳(+비교 복제본 `features/profile/comparePreviews.ts:56-70`)이다.
3. **방안 3개(2절)**: ★B `PageDoc`에 선택 필드 `typeScale?` 추가(값이 문서와 함께 이동) · A 저장 0 — `(프로필 버전 scale, candidateId)`에서 순수 파생 · C 편집 시작 때 프로필 새 버전 파생(비추천).
4. **가장 큰 제약 = `/studio` 진입 예산 [L1].** 정규화 기준선 128.76 · 허용 0.03KB(`app/scripts/m2cBaseline.json`). `docKitTokens`는 진입 청크 `StudioLayout`(`components/studio/StudioLayout.tsx:13·312·315`)에 있다. 어느 방안이든 몇십 바이트가 진입에 들 수 있다 → 감량 1회 뒤에도 넘으면 **예산 질의(UQ-4)**.
5. **재승인 지점**: 4.2 단계 T1(엔진 계약 `PageDoc` + `validatePageDoc` 허용 목록). 그 전 단계 T0(테스트·측정만)는 승인 없이 할 수 있다.

---

## 1. 현재 흐름 — 값이 어디서 사라지는가

### 1.1 흐름 표 (모두 [L1])

| # | 단계 | 파일:줄 | 비율 출처 | `typeScale` |
|---|---|---|---|---|
| 1 | 3안 생성 입력 | `data/memoryGenerate.ts:22-23` · `domain/effectiveProfile.ts:28-` | 프로필 base `typography_tokens.scale`(조정은 scale을 건드리지 않음) | — |
| 2 | 축 값 계산 | `domain/composeCandidates.ts:31`(`SCALE_LADDER=[1.2,1.25,1.333]`) · `:81-85`(`scaleAxis`) | A = 프로필 비율 그대로(사다리 밖이어도) · B·C = 사다리에서 A와 다른 값 중 가까운 2개(같으면 작은 값 먼저) | **생성** |
| 3 | 3안 조립·해시 | `composeCandidates.ts:273`(`planOf(id, {heroVariant, grid, typeScale})`) · `:207·236`(요약·로그 글자) | `sections` 계산에는 쓰지 않고 `axes`에만 싣는다 | 유지 |
| 4 | 잡 저장(영속) | `data/persistence/jobRecord.ts:16-18`(`axes: z.looseObject({})`) | — | 유지(모양 검사 안 함) |
| 5 | 카드·비교 표 | `features/profile/CandidateCard.tsx:25·33·61-62`(제목 막대 폭 `TITLE_WIDTH` + "비율 N") · `CandidateTable.tsx:14` | 안별 값 | **보임** |
| 6 | 비교 대화상자 실렌더 | `features/profile/comparePreviews.ts:25-41`(문서 = `writeStartDoc`) · `:56-70`(`compareKitTokens(viewed)`) · `CompareDialog.tsx:93·168` | 3열 공통 = 프로필 비율("제목 비율 덮어쓰기 0", `comparePreviews.ts:6`) | 소실(의도 — MQ-M2B5-2 ★A) |
| 7 | 비교 캡션 | `features/profile/compareText.ts:18`(`scaleNotice`) · `CompareDialog.tsx:131` · 단언 `CompareDialog.test.tsx:248` | "제목 비율 축은 아직 편집 문서에 반영되지 않아…" | 고지 |
| 8 | 편집 시작 클릭 | `features/profile/CandidatesSection.tsx:92-109` → `restartFlow.ts:85·107` → `repo.startDoc(…, "create")` | candidateId만 전달 | — |
| 9 | **저장소 start** | `data/memoryDocBook.ts:416`(`planOf` → `plan`) · **`:425`** `writeStartDoc({ candidateId, sections: plan.sections, … })` | — | **소실 ①** — `plan.axes`를 넘기지 않음 |
| 10 | 어댑터 | `data/startDocWrite.ts:30-41`(`StartDocInput` — 축 필드 0) · `:73-79`(`{type, variant, motion}` + 4개 메타만 엔진에) | — | 소실 |
| 11 | 엔진 변환 | `engine/doc/createDocFromCandidate.ts:26-32`(엔진 `CandidatePlan` = `candidateId·sections·libraryVersion·generatorVersion`) · `:57-81` | — | 소실 확정 |
| 12 | 문서 계약 | `engine/contracts/pageDoc.ts:82-98` — `projectId·revision·hash·profileVersion·candidateId·libraryVersion·generatorVersion·meta·sections·updatedAt` | 타이포 필드 0 | 자리 없음 |
| 13 | 문서 검증 | `engine/validate/validatePageDoc.ts:34`(`DOC_KEYS`) · `:125`(`r.record(input, "$", DOC_KEYS)` — 허용 목록 밖 키 거부) · **`:129-143` 결과 문서를 필드 하나씩 골라 새로 만든다** | — | 새 키 = 거부 · 허용해도 읽는 줄이 없으면 **소실 ②** |
| 14 | 편집기 캔버스·PNG | `components/studio/StudioLayout.tsx:312`(`docKitTokens(ops.series, doc.profileVersion)` → PNG `:393`) · `:315`(스냅샷 미리보기 = 그 문서의 버전) | 프로필 base `scale` | — |
| 15 | 토큰 → CSS 변수 | `kit/tokens.ts:41`(`--site-t{n}` = `rem(type.scale ** n)`, n = −1..5) · 적용 `render/PageDocument.tsx:52` | `kitTokens.type.scale` | — |
| 16 | 정적 HTML·zip | `features/studio/staticHtml/staticHtml.ts:155-164` — 내보내기 때 `docKitTokens(…, doc.profileVersion)` 재계산 → 숨은 iframe → `serializeSite.ts:18-28`(인라인 `--site-t*`) | 프로필 base `scale` | — |
| 17 | React zip | `features/studio/reactZip/reactZip.ts:135`(같은 `docKitTokens`) → `siteJson.ts`(`kitTokens` = `KitTokenInput` 그대로) → 산출물 `kitVars`가 다시 계산(`templates.ts:99·127`) | 프로필 base `scale` | — |

### 1.2 사라지는 곳 한 줄 요약
- **실질 소실은 9번 한 곳**이다(`memoryDocBook.ts:425`). 단 값을 넣은 뒤에는 **13번이 두 번째 소실 후보**다 — `validatePageDoc`은 통과한 입력을 그대로 돌려주지 않고 `:129-143`에서 필드를 골라 새 객체를 만든다. 이 결과를 저장(`checkSaveDoc`)·가져오기(`checkFile.ts:62`)·렌더 문서(`RenderApp.tsx:60`)가 쓰므로, 허용 목록에만 넣고 읽는 줄을 빼면 가져오기·렌더에서 값이 소리 없이 사라진다. 10~12번은 받을 자리가 없어서 이어지는 결과이고, 14~17번은 문서가 아니라 **프로필 버전**에서 비율을 읽어서 생기는 결과다.
- restart(`startDoc(…, "restart")`)도 같은 `writeStartDoc` 경로를 탄다 → 같은 지점에서 사라진다(`memoryDocBook.ts:425`, mode 공통).

### 1.3 계약별 엄격도 (새 값이 들어올 때 무엇이 막는가, [L1])

| 계약 | 위치 | 엄격도 |
|---|---|---|
| `PageDoc` 최상위 키 | `validatePageDoc.ts:34·125` · 저장(`startDocWrite.ts:93-99` `checkSaveDoc` → `saveDoc`·`startDoc`) · 가져오기(`features/projectFile/checkFile.ts:62`) · 렌더 문서 재검증(`render/RenderApp.tsx:60`) | **허용 목록 — 새 키 거부** |
| `ExportDoc`(`site.json.doc`) | `siteJson.ts:25-27`(`NEUTRAL`·`DOC_KEYS`) · `:84`(`sameKeys(doc, DOC_KEYS)`) | 허용 목록 — 새 필드는 기본 "빼기"(REACTZIP-SPEC 2.3.1-3) |
| `KitTokenInput` | `render/protocol.ts:19-25·73-89` | 모양·범위만 — scale 1~2, 추가 필드 통과 |
| `site.json` v1 `kitTokens` | `siteJson.ts:80-99`(`siteJsonProblems`) | 최상위 키·`schema === 1`만, `kitTokens` 내용 검사 0 |
| 프로필 버전(가져오기) | `features/projectFile/profileShape.ts:66`(`typographyOk` 숫자만) · `:98-100`(`profileVersionShapeOk` — base 키 허용 목록 없음) · `:105-111`(렌더 버전 scale 1~2) | 모양·범위 |
| 조정 `adjustments` | `domain/adjustmentSchema.ts:29·41-42`(`ADJUSTMENT_KEYS`) · `profileShape.ts:88-95` | 허용 목록 — `scale` 키 없음 |
| 문서 재구성 | `validatePageDoc.ts:129-143`(허용 필드만 다시 담음) · 가져오기 재키 `features/projectFile/rekey.ts:49·52` → `data/startDocWrite.ts:102-105` `rekeyDoc` = `{...doc, projectId}`(펼침 — 새 필드 유지) · `rekey.ts:45` `headOf`는 머리 필드만(문서 본문 아님) | 검증 재구성만 필드 나열식 — 새 필드는 읽는 줄 추가 필요 |
| IDB 복원 | `data/persistence/localSync.ts:79`(`checkSaveDoc(...).ok`만 보고 **원래 데이터를 그대로** 시드) · `:223` | 검증 통과 = 값 유지 · **검증 실패 = 그 프로젝트 문서 레코드 전체 읽기 불가(`unreadable`)** |
| 내보내기 게이트(대비 AA 등) | `engine/gate/*` — `scale`·`typography` 참조 0(L1 grep) | 비율 무관 → 게이트 판정 변화 0 |
| 문서 해시 | `engine/ops/hash.ts:35-41`(`hash`·`revision`·`updatedAt`만 제외) | 새 필드는 값이 있을 때만 해시를 바꾼다(없는 키는 직렬화에 없음) |
| 영속 봉투 | `data/persistence/envelope.ts:5`(`SCHEMA_VERSION = 1`) · `:28-34`(버전 다르면 mismatch) | 레코드 버전 — 선택 필드 추가는 버전 그대로 통과 [L3 추정 — `idbPersistence.ts`·`entryRead.ts` 미확인, 확인 필요] |

---

## 2. 전달 방안 비교

### 2.1 세 방안

> 이름표 주의: 브리프 예시의 "A 프로필 버전에 typeScale 기록"은 이 문서의 **C에 합쳤다**. 프로필 버전은 불변 레코드라(`domain/profile.ts:42-57`) 기록 = 새 버전 생성이고, `adjustments`에는 `scale` 키 자체가 없다(`domain/adjustmentSchema.ts:29` `ADJUSTMENT_KEYS` · `effectiveProfile` · `AdjustmentPanel`도 함께 바뀜). 이 문서의 A는 "저장 0, 순수 파생"이다.

**★B — `PageDoc`에 선택 필드 `typeScale?: number` (문서 = 안의 비율을 가진다)**
- 편집 시작·restart 때 `plan.axes.typeScale`을 문서에 적는다(`memoryDocBook.ts:425` → `StartDocInput.typeScale` → 엔진 `CandidatePlan.typeScale` → `createDocFromCandidate`가 문서에 기록).
- `docKitTokens(series, profileVersion, typeScale?)`: `scale = doc.typeScale ?? base.scale`. 필드가 없는 기존 문서 = 지금과 같은 결과.
- 테마 바꾸기(`engine/ops/slotOps.ts:24-28` `swapTheme` = `{...doc, profileVersion}`)는 필드를 그대로 둔다 → 다른 프로필 버전으로 바꿔도 **안의 비율 유지**(TSQ-3).
- 근거: 문서는 이미 `candidateId`로 "어느 안인지"를 갖는다(`pageDoc.ts:90`). 비율은 그 안의 속성이고, 섹션처럼 시작 시점에 확정되는 값이다.

**A — 저장 0, 순수 파생 (`scale = scaleAxis(base.scale)[candidateId]`)**
- 렌더 때마다 `(doc.profileVersion의 base scale, doc.candidateId)`로 `scaleAxis`(`composeCandidates.ts:81-85`)를 다시 계산한다. 저장 계약·엔진 계약 변경 0.
- 대가: (1) **기존 B·C안 문서의 제목 크기가 업데이트 순간 바뀐다**(새 경로가 과거 문서에도 적용 — 동의 없는 변경, 내보낸 결과와 앱이 달라짐). (2) 생성기 사다리(`SCALE_LADDER`)를 바꾸면 과거 문서가 소리 없이 바뀐다 → `doc.generatorVersion`별 사다리 고정 표가 필요. (3) `candidateId`가 A/B/C가 아닌 문서(가져오기 파일은 문자열만 검사)는 base로 폴백. (4) `domain/composeCandidates`의 함수를 `/studio` 진입에 끌어오거나 복제해야 한다.
- 장점: 승인 대상 계약(엔진·저장)이 없다. 되돌리기 = 함수 1개 되돌리기.

**C — 편집 시작 때 프로필 새 버전 파생(`base.typography_tokens.scale` = 안 비율) — 비추천**
- `ProfileOrigin`(`domain/profile.ts:13`)에 새 값(예: `"candidate"`) · 새 버전 생성 함수(`data/memoryProfileAdjust.ts` 계열) · 문서 `profileVersion` = 새 버전.
- 막는 사실 [L1]: 3안 잡 키가 `profileId|version|library|generator`(`memoryDocBook.ts:145`)라 새 버전에는 3안이 없다 → `/profile`의 최신 버전이 "3안 만들기 전" 상태로 보인다. `startDoc`의 `planOf(…, profileVersion, …)`(`:416`)도 문서 버전 ≠ 잡 버전을 다뤄야 한다. 편집 시작마다 버전 이력이 1개씩 는다(되돌리기·재확정 이어받기 `profileAdjustments.ts:34`·버전 요약 `versionText.ts` 영향). 프로필은 "확정한 디자인"인데 안별 시도가 프로필을 바꾸는 흐름이 된다.

### 2.2 변경 계약 목록

| 계약 | ★B PageDoc 필드 | A 순수 파생 | C 프로필 새 버전 |
|---|---|---|---|
| 엔진 `engine/contracts/pageDoc.ts:82-98` | **변경** — `readonly typeScale?: number` | 0 | 0 |
| 엔진 변환 `createDocFromCandidate.ts:26-32·57-81` | **변경** — 엔진 `CandidatePlan.typeScale?` → 문서에 기록(범위 검사 = `BAD_VALUE`) | 0 | 0 |
| 문서 검증 `validatePageDoc.ts:34·125·129-143` | **변경** — 선택 키 허용 + 값 검사(유한수 · 1~2, `protocol.ts:83`과 같은 범위) + **재구성 객체에 읽는 줄 추가**(없으면 넣지 않음 — 기존 문서 모양 그대로) | 0 | 0 |
| 가져오기 재키 `rekeyDoc`(`startDocWrite.ts:102-105`) | 0 — 펼침이라 유지(L1) | 0 | 0 |
| 내보내기 게이트 `engine/gate/*` | 0(scale 참조 0, L1 grep) | 0 | 0 |
| 어댑터 `startDocWrite.ts:30-41·73-79` · 저장소 `memoryDocBook.ts:425` | 변경 — `typeScale: plan.axes.typeScale` 전달 | 0 | 변경(새 버전 쓰기 + 잡 버전 분리) |
| 저장 스키마 `envelope.ts:5`(`SCHEMA_VERSION`) | 그대로 1 — IDB 복원은 봉투 + `checkSaveDoc`만 본다(`localSync.ts:74-80`, L1) | 0 | 그대로(새 origin 값) |
| 가져오기 `checkFile.ts:62` · `profileShape.ts` | 문서 = `validatePageDoc` 경유로 자동 · `profileShape` 0 | 0 | `isOrigin`·`profileShape.parity` 변경 |
| 마이그레이션·기존 데이터 | 0 — 필드 없는 문서 = 프로필 비율(현행 결과 유지) | **기존 B·C 문서 결과가 바뀐다**(마이그레이션 없음 = 소리 없는 변경) | 0(새 문서만) |
| 렌더 프로토콜 `render/protocol.ts` | 0(값만 — 필요 시 렌더 문서 `validatePageDoc` 재검증이 새 키를 받음) | 0 | 0 |
| `docKitTokens` `docPurpose.ts:42-56` | 변경 — 인자 1개 + `??` | 변경 — 사다리 파생 | 0 |
| 비교 복제 `comparePreviews.ts:56-70` · `CompareDialog.tsx:93·168` | 변경 — 열별 토큰(`compareKitTokens(viewed, plan.axes.typeScale)`) | 같음 | 같음(새 버전 값 사용) |
| 내보내기 `site.json` v1 | **0** — `kitTokens.type.scale`에 값이 들어감. `ExportDoc`(`siteJson.ts:25-27`)은 새 필드를 **넣지 않는다**(허용 목록 유지 — 비율은 `kitTokens`로 이미 전달) → `schema` 1 유지 | 0 | 0 |
| 정적 HTML·PNG | 0 — `docKitTokens` 결과만 달라짐 | 0 | 0 |
| 문서 해시 `hash.ts:35-41` | 새 문서만 해시 달라짐(값이 있을 때) · 기존 문서 해시 그대로 | 0 | 0 |
| 새 의존성 | 0 | 0 | 0 |

### 2.3 테스트 영향 (L1 grep 기준, 구현 레인 확정)
- 공통: `components/studio/ThemeSwap.test.tsx`(테마 바꾸기 뒤 비율 — TS-AC-07) · `features/profile/comparePreviews.test.ts:72`(3안 공통 scale 단언 → 열별) · `CompareDialog.test.tsx:248`(캡션) · `features/studio/kitTokenInput.test.ts` · `test/kitTokens.test.ts` · `pages/ProfileCompare.test.tsx` · `features/profile/compareGuard.test.ts`·`compareFrameGuard.test.ts`(복제 대조).
- ★B 추가: `engine/validate/validatePageDoc.test.ts`·`hostileInput.test.ts`(선택 키·범위) · `engine/doc/createDocFromCandidate.test.ts` · `data/startDocWrite.test.ts`·`startDocIndustryCopy.test.ts`·`curatedStartDoc.test.ts` · `data/memoryProjectRepository.test.ts`·`restartRealRepo.test.ts`(시작·restart 문서에 값) · `features/projectFile/checkFile.test.ts`(가져오기 왕복) · `features/studio/reactZip/reactZipGenerator.test.ts`·`checkReactZipEntries.test.ts`(`ExportDoc` 허용 목록에 새 키 0 · `kitTokens.type.scale` = 문서 값) · `staticHtml/staticHtml.test.ts`.
- A 추가: 사다리 고정 표 대조(생성기 `scaleAxis` ↔ 렌더 파생 같은 값) · 기존 문서 변경 회귀(의도된 변경인지 단언).
- C 추가: `profileShape.parity.test.ts` · 버전 요약·되돌리기·재확정 테스트 · `ProfileCandidates.test.tsx`(새 버전에서 3안 표시).
- 고정 입력 `features/studio/staticHtml/__fixtures__/csp-base-*.html` 6개에 `--site-t*`가 들었는지 [확인 필요] — 필드 없는 문서는 값이 같으므로 영향 0 [L3 추정].

### 2.4 예산 영향 (진입 KB 추정, [L3 추정] — 구현 레인 실측)

| 대상 | 현재 [L1 `m2cBaseline.json`·`bundleBudget.mjs`] | ★B | A | C |
|---|---|---|---|---|
| `/studio` 진입(정규화) | 128.76 · 판정 > 128.79 | +0.01~0.03(`docKitTokens` 인자·`??`, 호출부 2곳) | +0.05~0.15(사다리·정렬 함수 복제 또는 domain import — import는 공유 청크 분할 위험, `comparePreviews.ts:7` 실측 +0.22 전례) | ≈0 |
| 복원 진입(정규화) | 131.75 · 판정 > 131.78 | 위와 같음 | 위와 같음 | ≈0 |
| `/profile` 진입 | 비교 대화상자·`comparePreviews`는 조작 뒤 청크 → 판정 밖. 시작 경로(`memoryDocBook`)는 저장소 청크 [확인 필요] | +0~0.01 | 0 | +0.1 이상(버전 쓰기 경로) |
| 렌더 문서 JS | 멈춤선 89.70 | `validatePageDoc` 선택 키 +0.01~0.02 | 0 | 0 |
- 판정: ★B도 허용 0.03에 붙는다. 순서 = 구현 → 실측 → 넘으면 감량 1회(같은 진입 청크 안 상쇄) → 그래도 넘으면 **UQ-4 예산 질의**(이 레인은 상향을 결정하지 않는다).

### 2.5 되돌리기 쉬움

| | ★B | A | C |
|---|---|---|---|
| 코드 되돌리기 | 쉬움 — 커밋 되돌리기. 단 그동안 만든 문서에 `typeScale`이 남는다 → 되돌린 코드의 `validatePageDoc`이 그 문서를 **거부**한다(허용 목록). IDB 복원은 `checkSaveDoc` 실패 = 그 프로젝트 문서 레코드 전체 `unreadable`(`localSync.ts:79`, L1)이라 **문서를 열 수 없게 된다** — 되돌리기의 실제 비용. 되돌리기 전 "필드 무시(허용만)" 단계를 두면 안전(4.2 T1 수용 기준) | 가장 쉬움(저장 데이터 0) | 어려움 — 만든 프로필 버전은 불변 이력이라 남는다 |
| 데이터 | 선택 필드라 마이그레이션 0 | 0 | 이력 정리 불가 |

### 2.6 추천과 이유
- **★B**: 사용자가 고른 근거(비율)가 문서에 남아 편집기·스냅샷·가져오기·내보내기 어디서나 같은 값이다. 기존 문서는 바뀌지 않는다(A의 소리 없는 변경 없음). 하류 계약(`KitTokenInput`·`site.json` v1)은 그대로다. 대가는 엔진 계약 1곳(`PageDoc`)과 검증 허용 목록 → **재승인 대상(UQ-1)**.
- A는 "계약 변경 0"이 장점이지만 기존 문서를 동의 없이 바꾸고 생성기 변경에 묶인다. UQ-1을 거절하면 대안 1순위.
- C는 잡 키·버전 이력과 충돌해 추천하지 않는다.

---

## 3. 사용자에게 보이는 변화 (★B 기준)

| 장면 | 지금 [L1] | ★B 뒤 |
|---|---|---|
| 비교 대화상자 실렌더 | 3열 모두 프로필 비율 + 캡션 "제목 비율 축은 아직 편집 문서에 반영되지 않아…"(`compareText.ts:18`) · 요약 "비율 N (구조안)" | 열마다 그 안의 비율로 그린다. 캡션 2(`scaleNotice`) 삭제, 요약 접미 "(구조안)" 삭제(SPEC-COMPARE3 2.4-2·2.5 개정) |
| B·C안 "편집 시작"(새 문서) | 편집기 제목 = 프로필 비율 | 편집기 제목 = 비교에서 본 그 안의 비율 |
| 이미 편집 문서가 있음(`DOC_EXISTS`) | 기존 문서를 연다 | 그대로 — 기존 문서(필드 없음)는 프로필 비율. restart로 새로 시작하면 새 안의 비율 |
| PNG · 정적 HTML · 정적 zip · React zip | 프로필 비율 | 문서 비율(`kitTokens.type.scale`) — 앱 캔버스와 같은 값 |
| 테마 바꾸기(다른 프로필 버전) | 새 버전의 비율로 바뀐다 | 안의 비율 유지(TSQ-3 ★A) — 색·글꼴·간격만 새 버전 |
| A안 | 프로필 비율 | 시작 직후는 같음(A = 프로필 비율, `composeCandidates.ts:81-85`). 단 TSQ-2·3 ★A를 함께 쓰면 A안 문서도 시작 때 비율을 적으므로 **테마 바꾸기 뒤에는 새 버전 비율을 따르지 않는다**(지금과 다름) |
| 테마 바꾸기 문구 | `useThemeSwap.tsx`·`themeText`에 "비율" 글자 0(L1 grep) | 새 문구 없음 — 단 "색·글꼴·간격이 바뀌고 제목 비율은 안의 값을 유지"를 알릴지 = TSQ-3 하위 질문(문구 추가 시 T3 범위) |
- **편집기에서 비율을 바꾸는 UI는 이 범위 밖이다.** 현재 편집기에는 비율 조작 UI가 없고(프로필 조정 `ProfileAdjustments`에도 scale 없음 — `domain/profile.ts:24-30`), 새 컨트롤은 디자인·접근성·진입 예산 판단이 따로 필요하다 → 별건 B-M2B-05b 후보(TSQ-5).

---

## 4. 수용 기준 초안 · 구현 단계

### 4.1 TS-AC (★B 기준 · [U] 단위·컴포넌트 · [G] 가드 · [B] 실제 브라우저 ego-browser)

| # | 종류 | 기준 |
|---|---|---|
| TS-AC-01 | U | `startDoc(…, "create")`로 만든 B·C안 문서의 `typeScale` = 그 안 `plan.axes.typeScale`. A안도 값을 적는다(= 프로필 비율, TSQ-2 ★A) |
| TS-AC-02 | U | `startDoc(…, "restart")`도 같은 값을 적는다. 자동 스냅샷 "새로 시작 전"의 옛 문서는 옛 값 그대로 |
| TS-AC-03 | U | `validatePageDoc`: `typeScale` 없음 = 통과(기존 문서, 결과에 키 0) · 유한수 1~2 = 통과**하고 결과 문서에 같은 값이 남는다**(재구성 소실 방지) · 문자열·NaN·0.99·2.01·음수 = 거부. 그 밖의 새 키는 여전히 거부 |
| TS-AC-04 | U | `docKitTokens`: 문서에 값이 있으면 `type.scale` = 문서 값, 없으면 base `scale`(현행과 바이트 같은 결과) |
| TS-AC-05 | U | `compareKitTokens` ↔ `docKitTokens` 대조: 같은 (버전, typeScale) → 같은 토큰. 비교 3열 토큰의 `type.scale` = 각 안 `axes.typeScale` |
| TS-AC-06 | U | 비교 대화상자: `scaleNotice` 문장 0 · 요약 "(구조안)" 접미 0 |
| TS-AC-07 | U | `swapTheme` 뒤 `typeScale` 유지, `profileVersion`만 바뀜 |
| TS-AC-08 | U | 가져오기 왕복: 값 있는 문서 내보내기 파일 → 가져오기 → 같은 값 · 범위 밖 값 파일 = 거부(기존 `checkFile` 실패 경로) |
| TS-AC-09 | U | React zip: `site.json.kitTokens.type.scale` = 문서 값 · `site.json.doc` 키 집합 = 현행 `DOC_KEYS`(새 키 0) · `schema` = 1 |
| TS-AC-10 | U | 정적 HTML: 직렬화 결과의 `--site-t1` = `rem(문서 값)` |
| TS-AC-11 | U | 문서 해시: 필드 없는 기존 문서 = 해시 변화 0(고정 문서 대조) |
| TS-AC-12 | G | `npm run build` `check-bundle-size`: `/studio`·복원 진입 정규화 ≤ 판정선, 렌더 JS ≤ 89.70. 넘으면 실패로 보고(UQ-4) |
| TS-AC-13 | B | 1280: 프로필 비율 1.25인 프로젝트에서 C안(1.333) 비교 열의 제목 크기 = C안 편집 시작 뒤 편집기 제목 크기 = 내보낸 정적 HTML 제목 크기(계산된 `font-size` 대조) |
| TS-AC-15 | U | 내보내기 게이트 결과: 같은 문서의 `typeScale`만 바꿔도 `runGate` 결과 같음(비율 무관 확인) |
| TS-AC-14 | U | 되돌리기 안전: 값이 든 문서를 "필드 허용만 하는" 검증(T1 결과)으로 읽어도 통과(되돌린 코드가 저장 문서를 거부하지 않는 단계 확인) |

### 4.2 구현 단계 (각 단계 = 커밋 1개 이상 · 끝마다 typecheck·lint·test·build 4개 + 예산 기록)

| 단계 | 내용 | 승인 |
|---|---|---|
| T0 | 측정·테스트만: 현행 고정 문서 해시·`docKitTokens` 결과 고정 테스트(TS-AC-04 후반·11의 기준선) · 예산 기준선 확인 | 불필요(앱 동작 변경 0) |
| **T1** | **엔진 계약**: `PageDoc.typeScale?` · `validatePageDoc` 선택 키·범위 · 엔진 `CandidatePlan.typeScale?` → `createDocFromCandidate` 기록(TS-AC-03·11·14) | **★ 사용자 재승인(UQ-1·UQ-2)** |
| T2 | 저장 경로: `StartDocInput.typeScale` · `memoryDocBook.ts:425` 전달 · restart 같은 경로 · 가져오기 왕복(TS-AC-01·02·08) | T1 승인에 포함 |
| T3 | 렌더 입력: `docKitTokens` 인자 · 호출부(`StudioLayout.tsx:312·315`, `staticHtml.ts:155`, `reactZip.ts:135`) · `compareKitTokens` 열별 · 캡션·접미 삭제(TS-AC-04~07·09·10) · 예산 실측(TS-AC-12) | 예산 넘으면 UQ-4 |
| T4 | 문서 정정: SPEC-COMPARE3 2.4-2·2.5·F10 · MQ-M2B5-2 기록 · REACTZIP-SPEC 2.3.1-1("`ExportDoc` = `PageDoc`과 같은 필드 집합" → "선택 필드 `typeScale` 제외") · BACKLOG B-M2B-05 닫힘 · 브라우저 확인(TS-AC-13) | 불필요 |

---

## 5. 설계 질문 TSQ · 사용자 질의

### 5.1 TSQ (Designer 권고 — ★, 이 레인이 정할 수 있는 화면·규칙 수준)
- **TSQ-1 전달 방안** — ★B PageDoc 선택 필드 · A 순수 파생 · C 프로필 새 버전(2.6). *단 ★B·A 선택은 UQ-1(엔진 계약 승인)에 묶인다.*
- **TSQ-2 A안 문서에도 값을 적나** — ★A 적는다(모든 새 문서가 같은 모양 · 테마 바꾸기 뒤에도 "시작할 때 본 비율" 유지). B 적지 않는다(A안 = 늘 프로필 비율, 테마 바꾸기 시 새 버전 비율을 따른다).
- **TSQ-3 테마 바꾸기 때 비율** — ★A 문서 비율 유지(`swapTheme` 현행 동작 그대로, 코드 0). B 새 버전의 비율로 초기화(필드 삭제 — `swapTheme` 변경, 엔진 op 변경 = UQ-1 범위 확대).
- **TSQ-4 기존 문서** — ★A 그대로(필드 없음 = 프로필 비율, 마이그레이션 0). B 잡 기록에서 안 비율을 찾아 채운다(잡이 없거나 지워진 문서 처리 규칙 필요, 저장 쓰기 = UQ-2 확대).
- **TSQ-5 편집기 비율 조작 UI** — ★A 이번 범위 밖, 별건 B-M2B-05b 후보로 BACKLOG 등록. B 이번에 포함(디자인·예산 판단 추가 — 범위 확대).

### 5.2 사용자 질의 UQ (이 레인은 결정하지 않는다 — 영환님 결정 필요)
- **UQ-1 엔진 계약 변경 승인** — `engine/contracts/pageDoc.ts` `PageDoc`에 `readonly typeScale?: number` 추가 + 엔진 `createDocFromCandidate` 입력 확장. (거절 시 대안 = A 순수 파생, 기존 B·C 문서 결과 변화를 감수할지 함께 결정)
- **UQ-2 저장 스키마·검증 변경 승인** — `validatePageDoc` 허용 목록에 선택 키 추가(범위 1~2). 영속 봉투 `SCHEMA_VERSION`(`data/persistence/envelope.ts:5`)은 올리지 않는 안(선택 필드). 구버전 앱으로 되돌리면 새 문서가 거부되는 점(2.5) 수용 여부.
- **UQ-3 새 의존성** — 해당 없음(세 방안 모두 0). 확인만.
- **UQ-4 예산** — `/studio`·복원 진입 허용 0.03KB에 ★B가 붙는다[L3 추정 +0.01~0.03]. 감량 1회 뒤에도 넘으면 (a) 다른 진입 코드 감량 레인 선행 · (b) ADR-004 개정으로 몫 배분(예: +0.05). 이 레인은 상향을 제안만 한다.
- **UQ-5 내보내기 계약 확인** — `site.json` v1 모양 불변(값만 변경), `ExportDoc`에 새 키를 넣지 않는 규칙(REACTZIP-SPEC 2.3.1-3 기본 "빼기") 확인.

---

## 6. 위험
| 위험 | 대응 |
|---|---|
| 되돌린 코드가 새 문서를 거부 | T1에서 "허용 + 값 검사"를 먼저 배포, 쓰기(T2)는 그 뒤(TS-AC-14) |
| 비교 복제본(`comparePreviews.ts`)과 `docKitTokens` 어긋남 | TS-AC-05 대조 테스트(현행 `comparePreviews.test.ts` 확장) |
| 예산 초과 | TS-AC-12 → 감량 1회 → UQ-4 |
| 되돌린 앱이 IDB 문서를 읽지 못함 | `localSync.ts:79` — T1(허용 + 값 검사)을 먼저 내고 T2(쓰기)를 뒤에 둔다. 되돌리기는 T2만 되돌리는 것을 기본으로 한다(T1은 남김) |

## 7. 기록
- r0 2026-10-20 Designer 초안 — 코드 흐름 조사 2건(생성·편집 시작 경로 / 렌더·내보내기 경로, 읽기 전용 서브에이전트) + 핵심 줄 직접 대조.
