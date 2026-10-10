# RESTART SPEC r2 — 프로필 화면 "새로 시작"(EQ-2 A `restart`) UI (B-ER-01)

- 작성: RESTART-SPEC Designer 레인 · base main `18e5e12` · 코드 0 · **r2: RESTART-SPEC-R2 레인 · base main `9d5076e`**(Codex SPEC r1 재검증 P1 1 · P2 8 + 구현 레인 RESTART-IMPL 실측 반영 — `restart-impl/dev/active/restart-impl/REPORT.md` 2·4·7절)
- 원 명세: `docs/design/2a-05/SPEC.md` EQ-2(863행) · 8.3.1(566-588행) · 12.3(817-824행) · 5.11(338행). 이 문서가 그 행들의 **화면 처리**를 구체화하고, 다르게 한 곳은 10절(RS-D#)에 적는다.
- 근거 수준: **L1** = 코드·문서 행 직접 인용 · **L3** = 추정(실측 전). 결정 질문은 `docs/design/restart/MQ.md`(MQ-S1~S7). **근거 행 표기**: 경로만 = base main `9d5076e` · `impl:` 접두 = 미승인 구현 브랜치 `k002bill2/restart-impl`(`5aeb045`·`7e8ace8`) — 참고만, 그 코드에 맞추려고 고친 규칙은 없다.

## 0. 요약

1. **저장소 계약은 이미 충분하다(L1).** `startDoc(…, "restart", expectedRevision)`은 옛 문서를 자동 스냅샷 "새로 시작 전"으로 남기고 새 문서로 교체하는 것을 한 커밋으로 한다(`app/src/data/memoryDocBook.ts:369-406`). 화면 호출만 없다(`app/src/features/profile/CandidatesSection.tsx:93` = `"create"`만).
2. **진입점 = "편집 시작" 버튼 하나 그대로.** 누르면 지금처럼 `create`를 부르고, `DOC_EXISTS`가 기존 문서를 돌려줄 때 **고른 안이 문서의 안과 다를 때만** 선택 대화상자("새로 시작" 대화상자)를 연다. 진입 바이트 0, 저장소 인터페이스 변경 0(MQ-S1 ★A).
3. **기존 문서는 지우지 않는다.** 저장소가 "새로 시작 전" 자동 스냅샷을 만든다 — 화면은 스냅샷을 따로 만들지 않는다(2a-05 8.3.2와 같은 "저장소 한쪽" 원칙). 자동 보존 20개 규칙에 그대로 든다(P1D-SPEC 45-47행).
4. **되돌리기 = 편집기 "스냅샷" → "새로 시작 전" → 복원.** 복원은 안·버전까지 되돌린다(`memoryDocBook.ts:312` `{...source.doc}`). 새 경로·새 API 없음.
5. **대비 미통과 문서를 통과 버전으로 옮기기(BACKLOG B-ER-01 원문)**: 같은 안이면 편집기 "테마 바꾸기"(내용 보존, 이미 구현), 다른 안이면 이 "새로 시작"(보는 버전으로 새 문서). 대화상자에 두 버전의 대비 결과를 한 줄로 보여 준다(MQ-S3 ★A).
6. **(r2) 실패 결과는 "커밋 확인 → 사유" 순서로 가린다(MQ-S6 ★A).** 오류 모양만으로는 쓰기 전 실패와 커밋 뒤 실패를 구분할 수 없다(L1 — 아래 3.3.1). 실패 뒤 `getDoc`으로 이 탭 저장소 문서를 읽어 이 요청의 새 문서인지 먼저 확인하고, 확인 자체가 실패하면 결과를 단정하지 않는 R-E5로 둔다. 저장소 인터페이스·오류 타입·스키마 변경 0.
7. **다른 탭이 쓰기 잠금을 가진 때**: 지금 코드는 메모리 교체 **뒤** IDB 쓰기가 INFRA로 실패해 탭 메모리와 저장소가 갈라진다(L1 — 4절). 새로 시작은 되돌리기 어려운 쓰기라 **잠금을 먼저 확인하고, 못 잡으면 쓰기 0**으로 한다(MQ-S2 ★A — 저장소 내부 순서 변경, 인터페이스 불변).

## 1. 목적 · 범위 / 제외

**목적**: 편집 문서가 이미 있는 프로젝트를 프로필 화면에서 **다른 3안으로 다시 시작**하는 길을 연다. 이것으로 (a) 고른 안이 마음에 들지 않을 때 바꾸는 길, (b) 대비 미통과 문서를 다른 안 + 통과 버전으로 옮기는 길(B-M2C-09 해소 경로의 두 번째 갈래, editor-rest SPEC 14·66행)이 생긴다.

**범위**
- 프로필 화면 `CandidatesSection`의 "편집 시작" 결과 분기(`DOC_EXISTS` 뒤) · "새로 시작" 대화상자 · 결과별 화면(성공·`STALE_DOC`·`UNKNOWN_VARIANT`·INFRA·실패).
- `/studio` 도착 뒤 편집 알림 1문장(이동 state로만 — `/studio` 코드 변경 0).
- 쓰기 잠금 사전 확인(MQ-S2) — 저장소 내부 순서.

**제외**
- 같은 안 · 다른 버전 "새로 시작"(EQ-2 A가 테마 바꾸기로 보냄 — 3.3). 저장소는 막지 않지만(L1 — 같은 `candidateId` 검사 없음, `memoryDocBook.ts:369-386`) **화면이 열지 않는다**.
- 기존 편집 내용(문구·이미지)을 새 안으로 옮기기 — 새 문서는 버전의 기준 레퍼런스 문구로 다시 채운다(`memoryDocBook.ts:389`). 옮기기는 별건.
- `/projects` 목록에서 새로 시작 · 문서 삭제 · 스냅샷 이름 바꾸기.
- "3안 만들기"가 끝나지 않은 버전으로 새로 시작(그 버전 잡에 성공한 안이 있어야 한다 — `NOT_FOUND`, `memoryDocBook.ts:125-131` L1). 화면에서는 안을 고를 수 없으니 자연히 막힌다.

## 2. 지금 사실 (L1)

| 항목 | 사실 | 근거 |
|---|---|---|
| restart 판정 | 모양(`expectedRevision` 필수) → 멱등(마지막 성공 1건) → `NOT_FOUND`(문서 없음 포함) → `STALE_DOC`(최신 동봉) → 어댑터 `UNKNOWN_VARIANT`(쓰기 0) → 스냅샷 + 교체(revision 현재+1) + 멱등 기록 한 커밋 | `memoryDocBook.ts:369-406` · 2a-05 8.3.1 |
| 스냅샷 | `{kind:"auto", reason:"restart", name:"새로 시작 전"}` — 시각 접미사 없음(복원 전은 "복원 전 · HH:MM") | `memoryDocBook.ts:396` · `:311` |
| 보존 | 자동 최근 20개(`AUTO_KEEP`) — 오래된 자동부터 뺀다, 수동·published 제외, restart 예외 없음 | `memoryDocBook.ts:115,182-191` · P1D-SPEC 45-48행 |
| 이미지 | 옛 문서가 스냅샷으로 남아 참조 집합에 든다 → 옛 이미지 레코드는 지워지지 않는다. 20개 정리로 밀려난 자동 스냅샷만 참조하던 이미지는 같은 트랜잭션에서 지워진다(의도된 정리) | `persistence/imageRecord.ts:23-24` · `imageOps.ts:29` |
| 복원 | "새로 시작 전" 복원 가능 · `candidateId`·`profileVersion`까지 되돌아감 · "복원 전" 자동 1개 추가 | `memoryDocBook.ts:300-321` · `memoryProjectRepository.test.ts:259-270` |
| 화면 | `onEdit` = `create`만 · `DOC_EXISTS` = `{editNotice: alert}` 들고 이동 · 오류는 `{code, alert}` 모양만 읽음 | `CandidatesSection.tsx:86-103` |
| 문서 존재 | 프로필 화면은 진입 때 모른다(`series.project` = `{projectId, name}`). `ProjectSummary.hasDoc`은 `memoryProjectRepository`가 필요 — /profile에서 **조작 뒤** 청크 | `projectRepository.ts:44-53` · `scripts/check-bundle-size.mjs:78` |
| `DOC_EXISTS` 동봉 | 기존 문서 머리(`revision`·`candidateId`·`profileVersion`·`updatedAt`) | `memoryDocBook.ts:384-385` · `projectRepository.ts:172` |
| 쓰기 잠금 | 전역 1개 `design-studio-writer`, 첫 쓰기 때 `ifAvailable`, steal 없음. 못 잡으면 `flush`가 INFRA "다른 탭에서 편집 중입니다 — 이 탭의 변경은 저장하지 않습니다" | `persistence/writerLock.ts:1-20` · `localSync.ts:187-190` · `infra.ts:26-27` |
| 갈라짐 | `startDoc`은 메모리 `commit()` **뒤** `kept()`가 flush → 잠금 없는 탭에서는 메모리만 교체되고 INFRA. 다시 시도 = 멱등 재생 → 같은 INFRA | `memoryProjectRepository.ts:65-66,120-121` |
| 테마 바꾸기 | 구현됨 — 문서 `profileVersion`만 바꾸고 내용 보존 · 대비 줄 행동 "테마 바꾸기"/"프로필에서 보정" | `features/studio/useThemeSwap.tsx:52-66` · `engine/ops/docOps.ts:11-12` · fix-ber11 REPORT:28 |
| 대비 게이트 | 문서의 `profileVersion`이 결과를 정한다 | `engine/gate/contrastRow.ts:29-40` · `memoryDocBook.ts:216-222` |

**계약 판정**: 1~5절의 흐름은 `startDoc`·`listSnapshots`·`restoreSnapshot` 기존 인터페이스 안에서 가능하다. **예외 1건** — 잠금 사전 확인(MQ-S2 ★A)은 `memoryProjectRepository.startDoc` restart 경로의 **내부 순서**를 바꾼다(인터페이스·저장 스키마 불변). 선택지 B를 고르면 계약 변경 0.

## 3. 사용자 흐름

### 3.1 분기 표 — "X안으로 편집 시작"을 누른 뒤

`selected` = 고른 안, `viewed.version` = 보는 버전, `doc` = `DOC_EXISTS`가 동봉한 기존 문서.

| # | 상황 | 화면 |
|---|---|---|
| F1 | 문서 없음 | 지금 그대로 — `create` 성공 → `/studio/:projectId` |
| F2 | 문서 있음 · `doc.candidateId === selected` · `doc.profileVersion === viewed.version` | 지금 그대로 — 이동 + "이미 편집 중인 문서를 엽니다 (B안 · 프로필 v3)" |
| F3 | 문서 있음 · 같은 안 · **버전만 다름** | 이동(새로 시작 없음, EQ-2 A) + 편집 알림 "이미 편집 중인 문서를 엽니다 (B안 · 프로필 v3) · v4를 쓰려면 '테마 바꾸기'를 누르세요 — 내용은 그대로입니다" |
| F4 | 문서 있음 · **다른 안** | 이동하지 않는다. "새로 시작" 대화상자를 연다(3.2) |

- F3에서 `doc.profileVersion > viewed.version`(옛 버전을 보는 중)이면 두 번째 문장은 "v2를 쓰려면…"으로 같은 문형(테마 바꾸기는 어느 버전이든 고를 수 있다 — ER-AC-T2).
- 분기는 **누른 시점의** `doc`으로 한다. 진입 때 읽지 않는다(예산 — 8절, 그리고 멱등 키에 `expectedRevision`이 들어가므로 최신 revision이어야 한다).
- **(r2 · Codex P2-4) `create` 성공도 "처음 성공"이라고 믿지 않는다.** 같은 인자 `create`는 마지막 start 결과를 **재생**한다(`memoryDocBook.ts:374-376` — `starts`는 프로젝트별 마지막 1건). 그 뒤 저장(테마 바꾸기 등)으로 문서가 바뀌었으면 돌려받은 `doc`은 옛 머리다(`:364-366` save는 `starts`를 지우지 않는다). 규칙: `create` 성공 뒤 `getDoc(projectId)`로 지금 문서를 읽고
  - `current.revision === started.doc.revision` → F1(처음 성공 또는 그 뒤 변화 없는 재생 — 둘 다 이동이 맞다). state = 지금 그대로 `{changes, editNotice: changeNotice}`.
  - 다르면(재생 · 그 뒤 바뀜) → `current`를 `doc`으로 3.1 표를 **다시 판정**한다(F2·F3 = 이동, F4 = 대화상자). 재생 경로에는 `DOC_EXISTS`의 `alert`가 없으므로 F2·F3 편집 알림은 화면이 R-C3(5.1)로 만든다.
  - `getDoc`이 실패하거나 `undefined`면 F1로 이동한다(편집기는 `getDoc` 최신을 연다 — 잃는 것은 F3 안내 1문장뿐. 쓰기는 이미 없었다).
- 같은 이유로 F2 테스트 셋업은 "같은 인자 `create`를 한 번 더"로 `DOC_EXISTS`를 만들 수 없다 — RS-AC-01.

### 3.2 "새로 시작" 대화상자 (F4)

열 때 내용은 `doc`(지금 문서)과 `selected`·`viewed`(새 문서)로 채운다. 버튼 2개 + 닫기:

- 주 버튼(DS 대화상자 관례대로 끝 정렬의 마지막 — r2 RS-D4: DOM 순서도 마지막, `SnapshotDialog.tsx:75-78` 선례): **"C안으로 새로 시작"** (destructive가 아니라 primary — 옛 문서는 스냅샷으로 남는다)
- 보조 버튼: **"편집기 열기 (B안 · v3 편집 중)"** — EQ-2 A 주 버튼 문구 그대로. 누르면 F2와 같이 이동.
- 닫기(Esc·"취소"): 이동 0 · 쓰기 0 · 포커스 "C안으로 편집 시작" 버튼으로.

**확인 단계는 이 대화상자 하나뿐**이다(이중 확인 없음). 결과 문장이 무엇이 바뀌고 무엇이 남는지와 되돌리는 길을 말한다(문구 5절).

### 3.3 "C안으로 새로 시작"을 누른 뒤 — 결과별

| 결과 | 화면 | 근거 |
|---|---|---|
| 진행 중 | 주 버튼 `aria-busy` + 글자 "새로 시작하는 중…", 두 버튼·닫기 `aria-disabled`(Esc 무시). 다시 눌러도 요청 0 | `CandidatesSection.tsx:87` `starting` 선례 |
| 성공(처음·멱등 재생) | 대화상자 닫고 `/studio/:projectId` 이동, state **`{editNotice}`만**(r2 — `changes` 제외, RS-D9) — 편집 알림 = 5.3 R-N1(+ `changeNotice`가 있으면 뒤에 " · "로 잇는다). 편집기는 `getDoc` 최신을 연다(2a-05 8.3.1 583행 위 행) | 8.3.1 |
| `STALE_DOC` | 이동 없음. **(r2 · Codex P2-3) 동봉된 최신 doc으로 3.1 표를 다시 판정한다.** ① 최신 doc도 **다른 안** → F4 유지: 대화상자를 최신 doc으로 다시 채우고(R-D2·R-B2·R-D5의 안·버전·r번호) `role=alert` R-E1 · 주 버튼은 다시 누를 수 있다(다음 요청의 `expectedRevision` = 최신 revision). ② 최신 doc이 **고른 안과 같음**(예: 지연된 복원이 이미 C안으로 바꿈) → 새로 시작할 이유가 없다: 주 버튼을 **숨기고** `role=alert` R-E1b + "편집기 열기 (C안 · v4 편집 중)"(누르면 F2 이동 · 버전이 다르면 F3 알림 R-C2) + 취소. 문서·스냅샷 변화 0 | 2a-05 SPEC:584 · `memoryDocBook.ts:386` |
| `UNKNOWN_VARIANT` | 대화상자 안 `role=alert` = 저장소 `alert` 문장, 다시 시도 없음 · 쓰기 0 | `CandidatesSection.tsx:99` 선례 |
| 쓰기 전 거부 · 다른 탭 잠금 `readonly`(MQ-S2 ★A) | 대화상자 안 `role=alert` R-E2 · 쓰기 0 · "다시 시도"(같은 인자 — 잠금 보유 탭이 **쓰지 않고** 닫혔을 때만 성공). **판정은 3.3.1 순서를 따른다**(커밋 확인 음성일 때만) | 4절 · 3.3.1 |
| 쓰기 전 거부 · `stale`(다른 탭이 저장함 — 새로고침 전까지 유지, `writerLock.ts:35-51` · `writerLock.test.ts:152-168`) | `role=alert` R-E2b · 쓰기 0 · 다시 시도 **없음** · 새로고침 안내(최신 문서로 다시 고르기) | `localSync.ts:91-96` |
| 쓰기 전 거부 · `NOT_FOUND` · `SCHEMA_INVALID` · 그 밖 실패 **중 커밋 확인 음성** | `role=alert` R-E3 "새로 시작하지 못했습니다" + "다시 시도"(같은 인자 → 멱등) | 2a-05 SPEC:585 문형 · 3.3.1 |
| **커밋 뒤 미확인** — 커밋 확인 **양성**(flush INFRA(quota 등) · 응답 실패, `memoryProjectRepository.ts:65-66,79-81`) | 이 탭 저장소 메모리는 **이미 새 문서**다. `role=alert` R-E4. **(r2 · Codex P2-2) 버튼 = [취소] [다시 시도(주)]** — 주 버튼 "C안으로 새로 시작"과 "편집기 열기"는 숨긴다(RS-D8 수용). "다시 시도" = 같은 인자 → 멱등 재생 → flush 재제출(거짓 "저장됨" 0 — `localSync.ts:7-8`) → 성공이면 "성공" 행과 같다. "취소"·Esc = 닫기 · **이동 0** · 포커스 "C안으로 편집 시작"(RS-AC-09와 같음). 편집기로 넘기지 않는 이유: `/studio` 저장 훅은 `idle`로 시작해 이 미확인 쓰기를 이어받을 길이 없다(`useDocSave.ts:53-73` · `useAutosaveScheduler.ts:65-68`) — `/studio` 변경 0 범위에서는 "다시 시도로 확인되기 전에는 편집기로 보내지 않는다"가 정직한 유일한 길. 닫은 뒤 남는 위험은 RS-R7 | Codex r1 P2 · Codex SPEC r1 재검증 P2-2 |
| **확인 불가** — 실패 뒤 커밋 확인용 `getDoc`도 실패 | 새로 시작됐는지 **단정하지 않는다**. `role=alert` R-E5 + 버튼 = [취소] [다시 시도(주)]. 다시 시도는 어느 쪽이든 안전하다(커밋됐으면 멱등 재생, 아니면 처음 요청 — 같은 키). 취소 = 이동 0 | 3.3.1 |

#### 3.3.1 실패 판정 순서 (r2 · Codex P1 · MQ-S6 ★A)

[사실 L1] 오류 모양만으로는 커밋 여부를 알 수 없다: `call()`은 요청 단계(`:72-74`, 커밋 전)와 응답 단계(`:79-81`, 커밋 뒤)에 **같은 오류**를 던질 수 있고, flush INFRA(`:65-66`, 커밋 뒤)와 잠금 거부 INFRA(커밋 전 — `impl:memoryProjectRepository.ts:121-122` · `impl:localSync.ts:197-201`)는 둘 다 `code: "INFRA"`이고 사유는 메시지에만 있다(`persistence/infra.ts:1-2,19-23`). `ProjectRepositoryError`에는 단계·커밋 필드가 없다(`projectRepository.ts:168-192`).

화면(대화상자 청크)은 restart 실패를 받으면 이 순서로 결과를 정한다:

1. `UNKNOWN_VARIANT`·`STALE_DOC` → 확인 없이 그 행(둘 다 판정 단계에서 던지며 쓰기 0 — `memoryDocBook.ts:386,391` · 동봉 doc이 곧 최신).
2. 그 밖 모든 실패 → `getDoc(projectId)`로 **이 탭 저장소 문서**를 읽는다(메모리 — 커밋되면 flush 실패와 무관하게 바뀌어 있다, `memoryProjectRepository.ts:114-117`).
   - 확인 **양성**: `now.revision === doc.revision + 1 && now.candidateId === selected && now.profileVersion === viewed.version`(`doc` = 이 요청의 `expectedRevision`을 준 문서) → **R-E4**. 오류 코드·메시지는 보지 않는다(커밋 뒤 flush가 잠금 사유 문장을 달고 와도 "변화 0" 문장을 내면 거짓).
   - 확인 **음성**(위 조건 거짓 — 보통 `now.revision === doc.revision`) → 오류 사유로 가린다: 메시지 끝이 `READ_ONLY_TAB` → R-E2 · `STALE_TAB` → R-E2b · 그 밖(`CLEARED_TAB`·`unsupported`·`NOT_FOUND`·`SCHEMA_INVALID`·요청 실패·청크 로드 실패) → R-E3(INFRA면 메시지의 " — " 뒤 사유를 R-E3 뒤에 " · "로 잇는다). 사유 문자열은 `infra.ts:26-29` 상수와 같은 값이어야 한다 — 화면은 오류 **모양**만 읽는다(`CandidatesSection.tsx:100-101` 원칙, 오류 클래스 import 0).
   - `getDoc` **실패**(던짐) → **R-E5**.
3. 이 판정은 restart에만 쓴다. `create`의 실패는 지금 그대로(`CandidatesSection.tsx:96-101` — 쓰기 전 `DOC_EXISTS`·`UNKNOWN_VARIANT`가 대부분이고 create 갈라짐은 MQ-S2 C로 별건).

판정 근거로 이 탭 메모리를 쓰는 것이 맞는 이유: 다른 탭은 이 탭 메모리를 바꾸지 못하고(`readonly` 탭은 쓰기 0), 프로필 화면에는 그 사이 이 프로젝트 문서를 쓰는 다른 경로가 없다. 서버 저장소로 바뀌어도 "응답을 잃으면 읽어서 확인"은 같은 모양으로 남는다(MQ-S6 B를 고르지 않는 이유).

### 3.4 빈 · 오류 · 경고 · 진행 중 상태 요약

- **빈**: 문서 없음 = F1(대화상자 없음). 프로젝트 없는 프로필(`projectId` 없음) = 지금처럼 `/projects`로(`CandidatesSection.tsx:88`).
- **경고**: 자동 스냅샷 20개 정리(5.2 R-D4 상시 캡션) · 지금 문서 대비 미달(R-D5).
- **진행 중**: "편집 시작" `aria-busy`(지금 그대로) → 대화상자 주 버튼 `aria-busy`.
- **오류**: 3.3 표.

### 3.5 대비 미통과 문서를 통과 버전으로 옮기기 (BACKLOG B-ER-01 원문)

1. 편집기 게이트 대비 줄 "프로필에서 보정" → `/profile/:id?v=3`(`useThemeSwap.tsx:52-66`).
2. 보정 저장 → v4. "3안 만들기 (v4)" → 안 고르기.
3. 같은 안 → F3(테마 바꾸기 안내 — 내용 보존. **권장 경로**) / 다른 안 → F4 대화상자. R-D5가 "지금 v3 대비 미달 2 · 새 v4 모두 통과"를 보여 준다.
4. 새로 시작 성공 → 편집기 게이트 대비 줄 통과(문서 `profileVersion` = 4).

### 3.6 다른 탭 · 열린 편집기

- **다른 탭이 잠금을 가짐**(그 탭에서 먼저 편집함): MQ-S2 ★A — 잠금 확인 실패(`readonly`) → 쓰기 0 + R-E2. 그 탭이 저장한 뒤 닫혔으면 이 탭은 잠금을 잡아도 최신성 확인에서 `stale`이 되고 새로고침 전까지 유지된다 → R-E2b(다시 시도 없음).
- **이 탭이 쓰기 탭이고 다른 탭에 같은 프로젝트 편집기가 열려 있음**: 그 탭은 읽기 전용이라 저장이 이미 INFRA다. 새로 시작 뒤 그 탭이 새로고침하면 새 문서를 연다(추가 처리 0).
- **잠금 지원 없음(`unsupported`)**: 저장 자체가 안 되는 환경(ADR-007 개정 2) — 같은 알림 자리에 R-E3 + INFRA 사유("브라우저 저장소에 접근하지 못했습니다" — `infra.ts:15`, `impl:localSync.ts:81` `blocked("unsupported")`는 사유 지정 없음). 3.3.1 확인 음성 경로.

## 4. 쓰기 잠금과 갈라짐 — 판정

- L1: 잠금 없는 탭에서 지금 `startDoc`(create도 같다)은 메모리 `commit()` → `flush` INFRA. 결과: 이 탭 메모리의 문서 = 새 C안, IDB = 옛 B안 · 스냅샷 없음. 새로고침하면 B안으로 돌아오고 "새로 시작 전" 스냅샷은 IDB에 없다. 화면은 "편집을 시작하지 못했다"고 말하는데 탭 안에서는 이미 바뀌어 있다 — **거짓 상태**.
- `create`는 덮을 문서가 없어 피해가 작지만, `restart`는 사용자의 편집 문서를 바꾸는 쓰기다. 그래서 P1D-SPEC 70행(지우기 흐름: 쓰기 탭이면 진행, 아니면 `tryLock`, 못 잡으면 busy 쓰기 0) 패턴을 restart에 적용한다 → MQ-S2.
- ★A 구현 위치(추정 L3): `memoryProjectRepository.startDoc`에서 `mode === "restart" && local`이면 `docs.start` **전에** `await (await local.sync()).guardWrite()` 한 줄(본문은 `localSync.ts` — `gate.enter()` 뒤 `writer`가 아니면 `blocked(mode)` INFRA, `readonly`·`stale` 사유 구분). `commit` 전에 던지므로 "던지면 변화 0" 규칙과 맞다. 메모리 저장소(`persistence: "memory"`)는 해당 없음.
- **잠금 확인은 원자성을 끝까지 보장하지 않는다**(Codex r1 P2): 잠금을 잡은 뒤에도 flush INFRA(quota 등)·응답 실패는 메모리 커밋 **뒤**에 난다. 그래서 결과를 "쓰기 전 거부"(변화 0)와 "커밋 뒤 미확인"(R-E4)으로 나누고, **둘을 가르는 방법은 오류 모양이 아니라 3.3.1의 커밋 확인**이다(r2).
- Codex SPEC r1 재검증 확인(L2 — `restart-impl/dev/active/restart-impl/logs/codex-spec-result.md:81`): `impl:5aeb045`의 잠금 경로는 판정·커밋 구간에 await 추가 없음 · 거부 시 쓰기 0 · 보유 탭이 쓰지 않고 풀면 재시도 성공. 구현 위치 ★A는 그대로 둔다.

## 5. 문구 원문 (한국어)

### 5.1 "편집 시작" 주변 (변경)

| ID | 자리 | 문구 |
|---|---|---|
| R-C1 | 상시 캡션 `editNotice`(`generationText.ts:13` 교체) | "편집 시작을 누르면 고른 안으로 편집기를 엽니다. 이미 편집 중인 문서가 있고 다른 안을 골랐으면 새로 시작할지 묻습니다." |
| R-C2 | F3 편집 알림(이동 state) | "이미 편집 중인 문서를 엽니다 (B안 · 프로필 v3) · v4를 쓰려면 '테마 바꾸기'를 누르세요 — 내용은 그대로입니다" |
| R-C3 | (r2) `create` 재생 뒤 재판정 F2의 편집 알림 — 저장소 `DOC_EXISTS` alert와 **같은 문장**을 화면이 만든다(`memoryDocBook.ts:385` 문형). F3면 이 문장 + R-C2 뒷부분 | "이미 편집 중인 문서를 엽니다 (B안 · 프로필 v3)" |

### 5.2 "새로 시작" 대화상자

| ID | 자리 | 문구 |
|---|---|---|
| R-D1 | 제목(h2, `aria-labelledby`) | "C안으로 새로 시작할까요?" |
| R-D2 | 본문 1 — 지금 문서 (r2 · Codex P2-5) | "지금 편집 중인 문서: B안 · 프로필 v3 · 마지막 변경 10월 10일 14:05 — 이 탭에 있는 이 상태 그대로 스냅샷에 남습니다" — "저장"이라 쓰지 않는다: 시각은 이 탭 **저장소 문서**(`doc.updatedAt`)의 값이고 브라우저 저장 완료를 뜻하지 않는다(`memoryDocBook.ts:364-366` — flush 실패여도 메모리 revision·updatedAt은 오른다). 스냅샷도 바로 이 문서다(`:396`). 브라우저 저장 여부는 프로필 화면이 알 길이 없고(인터페이스에 없음), restart 커밋의 flush가 프로젝트 레코드 전체(스냅샷 포함)를 쓰므로 restart가 저장 확인되면 그 스냅샷도 함께 저장된다(RS-AC-08c) |
| R-D3 | 본문 2 — 결과 | "지금 문서는 스냅샷 '새로 시작 전'으로 남고, C안 · 프로필 v4로 새 문서를 만듭니다. 지금 문서의 문구·이미지는 새 문서로 옮겨지지 않습니다." |
| R-D3b | 본문 3 — 되돌리기 | "되돌리려면 편집기의 '스냅샷'에서 '새로 시작 전'을 복원하세요." |
| R-D4 | 캡션(상시) | "자동 스냅샷은 최근 20개만 보관합니다 — 오래 남기려면 편집기에서 '지금 상태 저장'으로 만드세요" (`SnapshotDialog.tsx:223` SN-1과 같은 뜻, 장소만 "편집기에서" 추가) |
| R-D5 | 대비 한 줄(MQ-S3 ★A, 결과가 다를 때만) | "대비 검사: 지금 v3 미달 2 · 새 v4 모두 통과" / 둘 다 미달이면 "대비 검사: 새 v4도 미달 1 — 새로 시작해도 내보내기 전에 보정이 필요합니다" / (r2 RS-D7) 지금 통과 · 새 미달이면 "대비 검사: 지금 v3 모두 통과 · 새 v4 미달 1 — 새로 시작해도 내보내기 전에 보정이 필요합니다" · (r2 RS-D6) 어느 한쪽이라도 색을 읽지 못해 판정할 수 없으면 줄 **생략**(추측 문장 0) |
| R-B1 | 주 버튼 | "C안으로 새로 시작" · 진행 중 "새로 시작하는 중…" |
| R-B2 | 보조 버튼 | "편집기 열기 (B안 · v3 편집 중)" |
| R-B3 | 닫기 | "취소" |

- 같은 버전이면(R-D3) "C안 · 프로필 v3로"처럼 버전을 그대로 쓴다. 버전 표기는 `v` + 숫자(`CandidatesSection.tsx:138` 선례).
- 시각 표기 (r2 RS-D5): "10월 10일 14:05"(월·일 + 24시 시:분). SnapshotDialog 캡션 함수는 시:분만이라(`SnapshotDialog.tsx:10`) 며칠 전 문서를 구분하지 못한다 — 월·일을 붙인 **새 형식 1개**를 대화상자 청크에 둔다. 시:분 부분은 같은 `toLocaleTimeString("ko-KR", {hour:"2-digit", minute:"2-digit", hour12:false})` 규칙(로컬 시계 — `memoryDocBook.ts:107` 주석의 UTC 함정 회피).

### 5.3 결과 문장

| ID | 자리 | 문구 |
|---|---|---|
| R-N1 | 성공 — `/studio` 편집 알림(1문장, ER-AC-C1) | "C안 · 프로필 v4로 새로 시작했습니다 · 이전 문서(B안 · v3)는 스냅샷 '새로 시작 전'에 있습니다" (+ `changeNotice` 있으면 " · " + 그 문장). **(r2 · Codex P2-6) 이동 state = `{editNotice}`만 — `changes`를 넣지 않는다**: `changes`가 있으면 `StudioPage.tsx:20-21`이 N>0을 돌려 편집 알림이 "바뀐 점 N개" 요약 + 접힌 `<details>` 원문이 되고(`StudioLayout.tsx:101,338` · `StudioPanels.tsx:36-40`) R-N1이 자동 낭독에서 빠진다. `changes`를 빼면 N=0 → 알림 영역(`role=status`)에 전체 문장이 그대로 들어간다 — `/studio` 코드 변경 0(RS-D9) |
| R-E1 | `STALE_DOC` · 최신도 다른 안 | "다른 곳에서 편집 문서가 바뀌었습니다(r8). 새로 시작하지 않았습니다 — 편집기에서 확인한 뒤 다시 고르세요" (2a-05 SPEC:584 원문) |
| R-E1b | (r2) `STALE_DOC` · 최신이 고른 안과 같음 | "다른 곳에서 편집 문서가 이미 C안 · 프로필 v4(r8)로 바뀌었습니다. 새로 시작하지 않았습니다 — 편집기에서 여세요" |
| R-E2 | 다른 탭 잠금 | "다른 탭에서 편집 중이라 새로 시작하지 않았습니다 — 그 탭을 닫은 뒤 다시 시도하세요" |
| R-E2b | 다른 탭이 저장함(`stale`) | "다른 탭에서 바뀐 내용이 있어 새로 시작하지 않았습니다 — 새로고침한 뒤 다시 고르세요" |
| R-E3 | 쓰기 전 실패 | "새로 시작하지 못했습니다" + 버튼 "다시 시도" |
| R-E4 | 커밋 뒤 미확인 (r2 문장 보강) | "새로 시작했지만 브라우저에 저장됐는지 확인하지 못했습니다 — 다시 시도하면 같은 요청으로 저장을 이어 갑니다. 지금 닫으면 새로고침 때 이전 문서(B안 · v3)로 돌아갈 수 있습니다" + 버튼 "다시 시도" |
| R-E5 | (r2) 확인 불가 | "새로 시작됐는지 확인하지 못했습니다 — 다시 시도해도 같은 요청이라 두 번 바뀌지 않습니다" + 버튼 "다시 시도" |

## 6. 화면 구조 · 정보 위계 (1280 · 1024 · 390)

- 위계(모든 폭 같음): 제목 R-D1 → 지금 문서 R-D2 → 결과 R-D3 → 되돌리기 R-D3b → (대비 R-D5) → 캡션 R-D4 → 알림 자리(`role=alert`) → 버튼 행.
- **1280 · 1024**: 모달 대화상자, 폭 = DS 대화상자 토큰 폭(CompareDialog보다 좁은 확인용 — 새 토큰이 필요하면 `--layout-*` 기존 값 중 고른다, px 고정 금지). 버튼 행 끝 정렬: [취소] [편집기 열기 (B안 · v3 편집 중)] [C안으로 새로 시작] — DOM 순서도 같다(r2 RS-D4). R-E4·R-E5 상태 = [취소] [다시 시도] · R-E1b 상태 = [취소] [편집기 열기 (C안 · v4 편집 중)].
- **390**: 전체 폭 시트형(가장자리 여백 = 페이지 여백 토큰). 버튼은 세로로 쌓고(`flex-col-reverse` — DOM 마지막인 주 버튼이 시각상 맨 위, r2 RS-D4) **주 버튼이 맨 위**, 각 버튼 전체 폭 · 최소 터치 높이 = DS Button 기본 크기. 본문이 길어도 버튼 행은 스크롤 끝에 있다(고정 바 없음 — 키보드·확대 시 가림 방지).
- 목업에 이 대화상자는 없다(design/ 2a 시안에 프로필 "새로 시작" 화면 0) — ADR-003 우선순위상 기능 흐름·DS 일관성(CompareDialog·SnapshotDialog의 `<dialog>` 패턴)을 따른다.

## 7. 접근성

| 항목 | 규칙 |
|---|---|
| 열기 | 네이티브 `<dialog>` `showModal()` · 열 때 포커스 = 제목(h2, `tabIndex=-1`) — 결과 문장을 먼저 읽게(주 버튼에 바로 두지 않는다: 실수 Enter 방지) |
| 닫기 | Esc·"취소" = 닫기 → 포커스 "C안으로 편집 시작" 버튼 · 진행 중 Esc 무시(`cancel` 이벤트 preventDefault) |
| 라이브 영역 | 대화상자 밖 알림은 `showModal` 중 inert — 결과 알림은 **대화상자 안** `role=alert` 한 자리(`CandidatesSection.tsx:45` dialogAnnounce 선례). 새 `role=status` 0 |
| 성공 뒤 | 이동 → 편집기의 기존 편집 알림 영역이 R-N1 **전체**를 1회 읽음(새 영역 0, ER-AC-C1) — 접힘 0을 위해 state에 `changes`를 넣지 않는다(5.3 R-N1 · RS-D9) |
| 키보드 | (r2 RS-D4) DOM 순서 = [취소] → [편집기 열기 (B안 · v3 편집 중)] → [C안으로 새로 시작] — `SnapshotDialog.tsx:75-78`(취소 → 확인)·DeleteProjectDialog와 같은 관례. 1024↑ 시각 순서 = DOM 순서(끝 정렬) · 390 = `flex-col-reverse`로 주 버튼이 시각상 맨 위(시각 역순은 이 폭에서만, 기존 대화상자 관례 범위). Tab은 DOM 순서 · 열 때 포커스는 제목이라 첫 Tab = "취소"(실수 Enter로 쓰기 0) · Enter = 포커스 버튼 · 포커스 가둠 = `showModal` 기본 |
| 비활성 | 진행 중 버튼은 `aria-disabled`(포커스 유지) + `aria-busy` |
| 대비 줄 | 색만으로 통과/미달 구분 금지 — 글자 "통과"/"미달 N" |
| 상태 전환 | (r2) STALE_DOC·R-E4·R-E5로 주 버튼이 숨으면 포커스가 사라진 버튼에 남지 않게 **알림을 담은 대화상자 제목**으로 옮긴다(알림은 `role=alert`로 이미 읽힘) |

## 8. 수용 기준 (RS-AC)

태그: **[U]** Vitest 단위·컴포넌트 · **[G]** 가드·빌드(번들 스크립트) · **[E]** 브라우저 QA(Ego Lite, build + `vite preview`, 앱 안 클릭만 — 메모리 store 새로고침 함정)

| ID | 조건 | 검증 |
|---|---|---|
| RS-AC-01 | (r2 · Codex P2-7) F1: 기존 단언 그대로(문서 없음 → 이동). F2: **기존 테스트 `ProfileCandidates.test.tsx:297-303`(A안 문서 · B안 선택 → 이동)은 F4와 반대라 바꾼다** — ① 그 사례(다른 안)는 RS-AC-03의 F4 단언(이동 0 · 대화상자)으로 **교체**, ② F2 사례는 "같은 쌍" 셋업으로 **새로** 둔다. 같은 인자 `create`는 재생이라(3.1) `DOC_EXISTS`를 내지 않으므로 셋업은 마지막 start가 다른 키가 되게 만든다(예: A `create` → B `restart`로 B 문서를 만든 뒤 B 선택 · 기대 revision은 셋업에 맞춰 갱신). 이 두 변경은 SPEC이 허용한 기존 단언 변경이며 그 밖 기존 단언 변경 0 | [U] |
| RS-AC-02 | F3: 같은 안·다른 버전 → 이동 + R-C2(두 버전 숫자) · `startDoc` 호출 = `create` 1회뿐(restart 0) | [U] |
| RS-AC-03 | F4: 다른 안 → 이동 0 · 대화상자 열림 · 포커스 = 제목 · R-D2의 안·버전·변경 시각(`doc.updatedAt`) = 동봉 `doc` 값 | [U] |
| RS-AC-04 | "C안으로 새로 시작" → `startDoc(projectId, viewed.version, "C", "restart", doc.revision)` 1회 · 성공 → `/studio/:id` state = `{editNotice: R-N1(+changeNotice)}`(`changes` 키 없음) · (r2 · Codex P2-8) 스냅샷 단언 = **최초 성공 전후 id 집합 차이 = `reason: "restart"`·이름 "새로 시작 전" 신규 1개**, 그 스냅샷 doc = 요청 전 문서(revision·hash 일치). 총수 "+1"은 단언하지 않는다(20개 보존 — RS-AC-11) | [U] |
| RS-AC-05 | 진행 중 두 번 누름·Esc → 요청 1회 · 대화상자 유지 | [U] |
| RS-AC-06 | `STALE_DOC`(delay 주입으로 사이에 저장 — 최신도 **다른 안**) → 이동 0 · R-E1(r번호 = 최신) · 대화상자 내용이 최신 doc으로 바뀜 · 주 버튼 다시 누르면 `expectedRevision` = 최신 · 문서·스냅샷 변화 0 | [U] |
| RS-AC-06b | (r2 · Codex P2-3) `STALE_DOC` · 최신이 **고른 안과 같음**(delay 주입 사이에 "새로 시작 전" 복원 등으로 C안이 됨) → 주 버튼 없음 · R-E1b · "편집기 열기 (C안 · v4 편집 중)" → F2 이동(버전 다르면 R-C2) · restart 요청 추가 0 · 문서·스냅샷 변화 0 | [U] |
| RS-AC-07 | (r2 · Codex P1 정정) `UNKNOWN_VARIANT` → 저장소 alert 문장 · 다시 시도 없음 · 쓰기 0 · 커밋 확인 `getDoc` 0회. **"그 밖 실패"는 3.3.1 판정을 거친다 — 아래 주입 단계별 표** | [U] |
| RS-AC-07b | 주입 단계별 결과(`fail({method:"startDoc", phase})` · flush 주입 · `getDoc` 주입) — **같은 `Error`를 주입해도 단계에 따라 결과가 갈려야 통과**: `request` → 문서·스냅샷 변화 0 · R-E3 · 다시 시도 → 성공 / `commit`(커밋 함수 안에서 던짐) → 변화 0 · R-E3 / `response` → 메모리 = 새 문서 · R-E4(08b) / flush INFRA → R-E4(08b) / 잠금 거부(`readonly`·`stale`) → R-E2·R-E2b(08) / 요청 실패 + 커밋 확인 `getDoc`도 실패 → **R-E5** · 다시 시도 → 성공(멱등 — 스냅샷 신규 총 1개) | [U] |
| RS-AC-07c | 커밋 확인은 메시지보다 먼저: flush INFRA 메시지 끝을 `READ_ONLY_TAB`으로 주입해도(커밋 뒤) 결과는 R-E2가 아니라 **R-E4** | [U] |
| RS-AC-08 | (MQ-S2 ★A) 가짜 잠금(`fakeLocks`) 다른 탭 보유 → restart → INFRA R-E2 · **메모리 문서·스냅샷·멱등 기록 변화 0** · IDB 쓰기 0 · 보유 탭이 **쓰지 않고** 풀면 다시 시도 → 성공 / 보유 탭이 저장(meta generation +1) 뒤 풀면 → `stale` R-E2b · 다시 시도 없음 · 쓰기 0 | [U] |
| RS-AC-08b | 커밋 뒤 미확인: 잠금 획득 뒤 flush INFRA 주입 · 응답 실패 주입 → R-E4 · 메모리 = 새 문서 · IDB = 옛 문서 · (r2 · Codex P2-2) 버튼 = [취소][다시 시도] — "편집기 열기"·"C안으로 새로 시작" 없음 · 취소 → 이동 0 · 쓰기 추가 0 · 포커스 "C안으로 편집 시작" · 다시 시도 → 멱등 재생으로 flush 재제출 성공 → IDB = 새 문서 + "새로 시작 전" 스냅샷 · 이동 + R-N1 · 재생에서 신규 스냅샷 0(최초 커밋의 1개뿐) | [U] |
| RS-AC-08c | (r2 · Codex P2-5 — 3행) "새로 시작 전" 스냅샷 = **이 탭 저장소 문서**(R-D2가 보여 준 revision·updatedAt과 일치)이며 브라우저 저장 상태와 무관함을 셋으로 단언: ① 직전 저장 flush **성공** → 스냅샷 = 그 revision · restart 확인 뒤 IDB에도 그 스냅샷 ② flush **진행 중**(delay) → R-D2·스냅샷 = 메모리 최신 revision · restart flush가 뒤에 이어져 IDB 최종 = 새 문서 + 그 스냅샷 ③ flush **실패**(quota — r1은 IDB, r2는 메모리) → R-D2·스냅샷 = r2 · restart flush 성공 시 IDB에 r2 스냅샷이 처음 저장됨 / 실패 시 R-E4. 편집기 이탈 손실(RS-R6)은 기록만 | [U] |
| RS-AC-09 | 취소·Esc → 쓰기 0 · 포커스 "C안으로 편집 시작" · "편집기 열기" → F2와 같은 이동·알림 | [U] |
| RS-AC-10 | 되돌리기: restart 뒤 "새로 시작 전" 복원 → `candidateId`·`profileVersion` = 옛 값 · "복원 전" 자동 **신규 1개**(r2 — 총수 아님, RS-AC-04와 같은 id 집합 차이 방식) (저장소 기존 단언 재사용 + 화면 경로 1건) | [U] |
| RS-AC-11 | 자동 스냅샷 20개 상태에서 restart → (r2) 총 자동 수 **20 → 20**(신규 "새로 시작 전" 1개 들어오고 가장 오래된 자동 1개 빠짐) · 같은 인자 재생 → 20 그대로 · 신규 0 · 수동 불변 · R-D4 캡션 상시 표시 | [U] |
| RS-AC-12 | (MQ-S3 ★A) R-D5: 두 버전 결과가 다를 때만 · 글자로 통과/미달 · 둘 다 미달 문형 · (r2) 지금 통과·새 미달 문형(RS-D7) · 한쪽이라도 판정 불가(색 못 읽음)면 줄 없음(RS-D6) · 같은 프로필에 대해 R-D5 판정 = 편집기 게이트 대비 줄 판정(미달 수 일치 — 픽스처 2개 이상) | [U] |
| RS-AC-13 | (r2 · Codex P2-9 · MQ-S7) 대화상자·문구·대비 요약·**결과 판정(F1~F4 재판정·3.3.1)** 코드 = 조작 뒤 청크(`PROFILE_AFTER_ACTION`에 추가) · 조작 뒤 청크 크기 출력. **`/profile`**: 첫 화면 ≤ 100(base 99.90 — 변화 0 목표) · 진입 직후 `/profile` · `/profile (3안 있음)` 각각 = **MQ-S7 결정값**(★A: base 120.00 · 122.48 대비 각각 ≤ +0.03) — `m2cBaseline.json`에 `/profile` 키가 없어 스크립트는 125 한도만 판정하므로 이 행은 **빌드 출력 수동 판정**(base·브랜치 두 빌드 출력을 REPORT에). **`/studio`**(ADR-004 개정 15 결정 1·2 — `ADR-004:244-250`): 일반·복원 진입 **각각** restart 몫 ≤ +0.05(base main `9d5076e` 실측 129.56 · 132.59 → 상한 129.61 · 132.64) · 잠금 판정선 129.95 · 132.98 안. 실측이 지금 기준선+허용(129.62+0.03 · 132.65+0.03) 안이면 기준선 갱신 0, 넘으면 `m2cBaseline.json` `eagerKb`·`bundleBudget.test.mjs` 기대값을 **같은 커밋에서** 실측값으로(자기 몫 안 · 커밋 메시지 "ADR-004 개정 15"). 몫을 넘으면 감량 1회 → 그래도 넘으면 **멈추고 재상신**(MQ-S2 B로 내려가지 않는다 — S2는 A로 결정됨). 다른 배분 레인과 병합이 겹치면 합산 재조정은 Jarvis(개정 15 결정 4) | [G] |
| RS-AC-14 | 1280·1024·390: 버튼 순서·주 버튼 위치(6절) · 390 세로 쌓기 · 확대 200%에서 버튼 가림 0 | [E] |
| RS-AC-15 | 실흐름: 문서(B안 v3, 대비 미달) → 프로필 보정 v4 → 3안 만들기 → C안 → 새로 시작 → 편집기 게이트 대비 통과 → 스냅샷 "새로 시작 전" 복원 → B안 v3 | [E] |
| RS-AC-16 | 검증 4종(typecheck·lint·test·build) + 가드(`noHardcodedStyle`·브랜드 격리) | [G] |
| RS-AC-17 | (r2 · Codex P2-4) `create` 재생 우회 없음: B안 v1 `create` → 테마를 v2로 저장(revision 2) → 프로필 v1에서 B안 편집 시작 → `create` 재생(옛 doc r1) → `getDoc` r2로 재판정 → **F3**(이동 + R-C3 + R-C2 "v1를 쓰려면…") / 재생 뒤 `getDoc` 실패 주입 → F1 이동(알림 없음) / 처음 성공(재생 아님) → `getDoc` revision 같음 → F1 지금 그대로 | [U] |
| RS-AC-18 | (r2 · Codex P2-6) R-N1 낭독: `changeNotice`가 있는 안으로 새로 시작 성공 → `/studio`의 편집 알림 영역(`role=status` "편집 알림") **텍스트 = R-N1 + " · " + changeNotice 전체** · 그 영역 안 `<details>` 0 · "바뀐 점 N개" 0. `state.editNotice` 문자열 단언만으로는 통과 아님 | [U] |

## 9. 구현 영향 추정 (L3 — 실측 전, KB 추정 금지 원칙상 크기는 "있음/없음"만)

| 파일 | 변경 | 청크 |
|---|---|---|
| `features/profile/CandidatesSection.tsx` | (r2 · MQ-S7 ★A) 클릭 때 `loadProjects()`와 restart 청크 로더를 `Promise.all`로 함께 받고, `create` 결과(성공·오류)를 조작 뒤 청크의 판정 함수 하나에 넘긴다 — 진입 청크에는 **호출 1곳 + 대화상자 슬롯**만. 청크 로드 실패 = 지금의 `startFailed` + 다시 시도 · 이동 0 | 엔진 청크(**진입 직후** 시나리오에 듦) |
| `features/profile/RestartDialog.tsx` (신규) | 대화상자·문구·결과 처리(3.3·3.3.1)·R-D5 · (r2) F1~F4 판정·`create` 재생 재판정(3.1)·R-C2·R-C3 | 조작 뒤(신규 — `PROFILE_AFTER_ACTION` 추가) |
| `features/profile/restartLoader.ts` (신규) | `retryableImport` 로더(`compareLoader.ts` 선례) — 감량 후보: `compareLoader.ts`와 본문 공용화(같은 엔진 청크 안 파일 함수 — `chunkRetry` import 금지 이유는 그대로 지킨다) | 엔진 청크(로더) |
| `features/profile/generationText.ts` | R-C1 교체(R-C2·R-C3은 r2부터 조작 뒤 청크) | 엔진 청크(문자열 증분 소량) |
| `data/memoryProjectRepository.ts` · `data/persistence/localSync.ts` | (MQ-S2 ★A) restart 전 잠금 확인 — 판정 본문은 `localSync.ts`(조작 뒤)에 `guardWrite()`로 두고, 저장소 `startDoc` 래퍼에는 `mode === "restart"`일 때 그 호출 **한 줄**만(`docs.start`가 동기라 await는 래퍼에서만 가능 — `memoryProjectRepository.ts:120-121`) | `/studio` 일반·복원 진입 모두 memoryProjectRepository가 진입 직후 청크 — 한 줄 증가(아래) |
| `scripts/check-bundle-size.mjs` | `PROFILE_AFTER_ACTION`에 `RestartDialog.tsx` | — |
| 테스트 | `ProfileCandidates.test.tsx`(분기) · `RestartDialog.test.tsx`(신규) · `memoryProjectRepository.test.ts`(잠금) | — |

**예산 영향** (r2 — 실측 반영)
- 실측(L1 — `impl` 빌드, `restart-impl/dev/active/restart-impl/REPORT.md:49-58` · `logs/build-1.txt:225-236` · `logs/base-build.txt`): `/profile` 첫 화면 99.90 → 99.90(0) · 진입 직후 `/profile` 120.00 → **120.36(+0.36)** · `/profile (3안 있음)` 122.48 → **122.84(+0.36)**(한도 125, 남는 여유 2.16) · `/studio` 129.56 → 129.59 · 복원 진입 132.59 → 132.62(각 +0.03) · 조작 뒤 `RestartDialog` +3.54. 증분은 거의 전부 엔진 청크 `profileEngine`(gzip 9.35 → 9.70 — CandidatesSection 분기·R-C2·`restartLoader`·대화상자 마운트). r1의 "진입 직후 증분 = 분기·로더·문자열뿐(소량)" 추정은 틀렸다.
- r2가 진입 쪽에 더할 수 있는 코드: `create` 재생 재판정(3.1 · P2-4)·R-C3. **이 코드의 위치는 예산 결정과 묶는다** — MQ-S7 ★A(배치 변경)는 이것까지 조작 뒤로 보내고, B(상한)는 이 바이트를 진입 청크에 더 얹는다.
- ★A 배치(구현 지시 — 위 표): 진입 청크 = `onEdit`에서 로더 2개 `Promise.all` + 판정 함수 호출 1곳 + 대화상자 슬롯 · R-C1 문자열. F1~F4 판정·R-C2·R-C3·3.3.1은 조작 뒤. ±0.03 달성은 **추정 L3** — 실측이 넘으면 감량 1회(로더 공용화 등) → 그래도 넘으면 멈추고 MQ-S7 재상신(B로 자동 전환하지 않는다).
- `/studio` 일반·복원 진입: 화면 쪽 변경 0(편집 알림은 이동 state 문자열 — 기존 경로). MQ-S2 ★A 잠금 확인 = 저장소 래퍼 한 줄(판정 본문은 조작 뒤 `localSync.ts`) — ADR-004 개정 15 배분 +0.05(RS-AC-13). 진입 closure를 건드리는 것은 이 한 줄뿐.

## 10. 위험 · 2a-05와 다르게 한 곳

**위험**
| ID | 위험 | 완화 |
|---|---|---|
| RS-R1 | 대화상자 없이 쓰기 → 편집 내용 손실 체감 | 쓰기는 대화상자 주 버튼 뒤에만 · 스냅샷은 저장소가 같은 커밋에 만든다 |
| RS-R2 | 잠금 없는 탭 갈라짐(4절) | MQ-S2 ★A · B를 고르면 R-E2 대신 "탭 메모리는 바뀜" 사실을 문장에 넣어야 한다 |
| RS-R3 | 20개 정리로 오래된 "내보내기 전" 등 자동 사본이 밀림 · 반복 새로 시작이면 "새로 시작 전"도 밀림 | R-D4 상시 · 문구가 "모두 보존"을 약속하지 않는다 |
| RS-R4 | "새로 시작 전" 이름에 시각이 없어 반복 시 같은 이름 | 목록 캡션에 시각이 있다(`SnapshotDialog.tsx:231`) — 이름 변경은 저장소 문자열이라 MQ-S4 |
| RS-R5 | `/studio` 진입 직후 예산 증가(MQ-S2 ★A) | 9절 조작 뒤 배치 · ADR-004 개정 15 restart 몫 +0.05(RS-AC-13) · 넘으면 감량 1회 → 재상신 |
| RS-R7 | (r2 · Codex P2-2) R-E4에서 "취소"로 닫은 뒤: 이 탭 메모리 = 새 문서(C안), IDB = 옛 문서. 사용자가 다시 "C안으로 편집 시작"을 누르면 `DOC_EXISTS`(메모리 C) → F2 이동 → 편집기 저장 훅은 `idle`이라 미확인 쓰기를 모른 채 C안을 연다. 그 상태로 새로고침하면 B안으로 돌아온다(B 문서 자체는 IDB에 그대로 — 내용 손실은 아님, "새로 시작이 사라짐"). 편집기에서 한 번이라도 저장이 확인되면 그 flush가 프로젝트 레코드 전체(새 문서 + 스냅샷)를 써서 갈라짐이 닫힌다 | R-E4 문장이 "닫으면 새로고침 때 이전 문서로 돌아갈 수 있음"을 밝힌다 · 대화상자는 미확인 상태로 편집기에 보내지 않는다(3.3) · 남는 경로는 create 갈라짐(MQ-S2 C)과 같은 부류 — **BACKLOG 후보**(편집기 진입 때 미확인 쓰기 인계 · Jarvis 등록) |
| RS-R8 | (r2) 3.3.1 사유 판정이 메시지 끝 문자열(`infra.ts:26-29`)에 기대므로 문장이 바뀌면 R-E2·R-E2b가 R-E3로 떨어진다 | 화면이 같은 상수 값을 쓰는지 테스트(RS-AC-08이 실제 `blocked()` 경로로 단언) · 떨어져도 R-E3는 거짓이 아니다("못했습니다" — 커밋 확인 음성) |
| RS-R6 | **(Codex r1 P1)** 편집기 이탈 저장은 완료를 기다리지 않는다(`StudioLayout.tsx:127-134` `retry()`만) · 저장 중 추가 편집은 이탈(unmount) 때 버려질 수 있다(`useAutosaveScheduler.ts:100-102,274-278`). 이때 저장소 revision은 정상이라 restart가 성공하고, "새로 시작 전" 스냅샷에는 **마지막 화면 편집이 없다** — revision 검사로는 못 잡는다 | 이 레인 판정: 새로 시작은 **저장된 문서**만 보존한다고 문구로 밝힌다(R-D2 "이 저장 기준으로 스냅샷에 남습니다"). 이탈 손실 자체는 편집기 기존 결함(restart 없이도 같은 손실) → **BACKLOG 후보**(Jarvis 등록: 이탈 전 `flushed()` 확인·실패 시 이동 보류) · MQ-S5 |

**2a-05와 다르게 한 곳 (RS-D#)**
- **RS-D1**: EQ-2 A는 "문서가 있으면 주 버튼 = '편집기 열기 (B안 · v3 편집 중)', 다른 안이면 보조 버튼 'C안으로 새로 시작'"으로 **진입 때부터** 두 버튼을 그린다. 이 SPEC은 버튼은 그대로 두고 **누른 뒤 대화상자**에 같은 두 버튼을 둔다. 사유: 진입 때 문서 상태를 알려면 `memoryProjectRepository`를 /profile 진입에 받아야 하는데 첫 화면 여유 0.10(99.90/100 — base 실측)이다. (r2 정정) 진입 직후 시나리오는 한도 125에 여유 5.00(`/profile`) · 2.52(`/profile (3안 있음)` 122.48)로 r1의 "여유가 작다(L3)"는 틀린 문장이었다 — 결정 근거는 첫 화면과 "같은 정보가 `DOC_EXISTS`에 이미 온다"이며 MQ-S1 결정은 그대로다.
- **RS-D2**: 2a-05 SPEC:583 `DOC_EXISTS` = "이동" → F4(다른 안)에서는 이동하지 않고 대화상자. F2·F3는 원문대로 이동.
- **RS-D3**: EQ-2 A에 확인 대화상자는 없었다(B안의 요소). RS-D1 때문에 대화상자가 생기므로 그것이 곧 확인이며 이중 확인은 두지 않는다.

**구현 레인 RS-D4~D8 판정 (r2 — `restart-impl/dev/active/restart-impl/REPORT.md:77-83`)**
- **RS-D4 수용** — 버튼 DOM 순서 [취소][편집기 열기][새로 시작] · <768 `flex-col-reverse`(주 버튼 맨 위) · ≥768 끝 정렬. r1 7절이 "기존 대화상자와 다르면 그쪽에 맞추고 기록"이라 했고 `SnapshotDialog.tsx:75-78`이 취소 → 확인 순서다. 6·7절을 이 순서로 고쳤다.
- **RS-D5 수용(새 형식 1개로 기록)** — R-D2 시각 "10월 10일 14:05". 기존에 월·일+시:분 함수가 없다(`SnapshotDialog.tsx:10` 시:분 · `projectListView.ts:50-51`·`versionText.ts:18-19` 상대 시간). 며칠 전 문서를 구분하려면 월·일이 필요하다 — 5.2 끝 규칙.
- **RS-D6 조건부 수용** — R-D5 판정을 domain 함수(`effectiveProfile`·`checkProfileContrast`)로 하는 것은 엔진 import 가드 때문에 맞다. 단 **색을 못 읽는 경우(unreadable) 처리 없음은 불가** — 편집기 게이트와 다른 결론을 낼 수 있다. 규칙: 어느 한쪽이라도 판정 불가면 R-D5 생략 · RS-AC-12에 게이트 판정과의 일치 단언 추가.
- **RS-D7 수용** — "지금 통과 · 새 미달" 문형(5.2 R-D5). MQ-S3 A "결과가 다를 때만" 범위 안이며, 통과 문서를 미달 버전으로 옮기는 것은 결정 지점에 꼭 보여야 할 경고다.
- **RS-D8 수용(r2 결정으로 대체·확장)** — R-E4에서 주 버튼 숨김 + 재시도는 알림의 "다시 시도". r2는 "편집기 열기"도 숨기고 취소 = 이동 0으로 정했다(3.3 · Codex P2-2). R-E5도 같은 버튼 모양.

**r2에서 새로 다르게 한 곳**
- **RS-D9**: 성공 이동 state에 `changes`를 넣지 않는다(2a-05 8.3.1 성공 state `{changes, editNotice}`와 다름). 사유: `/studio` 변경 0으로 R-N1 전체 1회 낭독을 지키는 유일한 길(5.3 · Codex P2-6). 잃는 것: changeNotice가 있을 때 "바뀐 점 N개" 요약·접힘 없이 긴 한 문장이 된다.

## 변경 이력
- r0 (2026-10-10): 초안.
- r1 (2026-10-10): Codex adversarial r1 반영 — 이탈 저장 미보장(RS-R6·R-D2·RS-AC-08c·MQ-S5) · 커밋 뒤 미확인 결과 분리(R-E4·RS-AC-08b) · `readonly`/`stale` 분리(R-E2b) · 복원 진입 132.68 예산(9절·RS-AC-13).
- r2 (2026-10-11): Codex SPEC r1 재검증(`restart-impl/dev/active/restart-impl/logs/codex-spec-result.md`) P1 1 · P2 8 + RESTART-IMPL 실측 반영 — **P1** 실패 판정 순서 3.3.1(커밋 확인 `getDoc` → 사유 · 확인 불가 R-E5 · MQ-S6) · RS-AC-07 정정 + 07b·07c / P2-2 R-E4 버튼 [취소][다시 시도] · 편집기로 보내지 않음 · RS-R7 / P2-3 STALE_DOC 재판정 R-E1b · RS-AC-06b / P2-4 `create` 재생 재판정 R-C3 · RS-AC-17 / P2-5 R-D2 "마지막 변경"(저장소 문서 기준) · RS-AC-08c 3행 / P2-6 성공 state `changes` 제외 RS-D9 · RS-AC-18 / P2-7 RS-AC-01 기존 테스트 교체 허용 / P2-8 스냅샷 단언 = 신규 id 기준 · 20→20 / P2-9 RS-AC-13 = ADR-004 개정 15 · 9절 예산 실측 · MQ-S7 / RS-D4~D8 판정 · RS-D1 근거 정정.
