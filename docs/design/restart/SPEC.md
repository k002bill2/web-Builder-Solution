# RESTART SPEC r0 — 프로필 화면 "새로 시작"(EQ-2 A `restart`) UI (B-ER-01)

- 작성: RESTART-SPEC Designer 레인 · base main `18e5e12` · 코드 0
- 원 명세: `docs/design/2a-05/SPEC.md` EQ-2(863행) · 8.3.1(566-588행) · 12.3(817-824행) · 5.11(338행). 이 문서가 그 행들의 **화면 처리**를 구체화하고, 다르게 한 곳은 10절(RS-D#)에 적는다.
- 근거 수준: **L1** = 코드·문서 행 직접 인용 · **L3** = 추정(실측 전). 결정 질문은 `docs/design/restart/MQ.md`(MQ-S1~S4).

## 0. 요약

1. **저장소 계약은 이미 충분하다(L1).** `startDoc(…, "restart", expectedRevision)`은 옛 문서를 자동 스냅샷 "새로 시작 전"으로 남기고 새 문서로 교체하는 것을 한 커밋으로 한다(`app/src/data/memoryDocBook.ts:369-406`). 화면 호출만 없다(`app/src/features/profile/CandidatesSection.tsx:93` = `"create"`만).
2. **진입점 = "편집 시작" 버튼 하나 그대로.** 누르면 지금처럼 `create`를 부르고, `DOC_EXISTS`가 기존 문서를 돌려줄 때 **고른 안이 문서의 안과 다를 때만** 선택 대화상자("새로 시작" 대화상자)를 연다. 진입 바이트 0, 저장소 인터페이스 변경 0(MQ-S1 ★A).
3. **기존 문서는 지우지 않는다.** 저장소가 "새로 시작 전" 자동 스냅샷을 만든다 — 화면은 스냅샷을 따로 만들지 않는다(2a-05 8.3.2와 같은 "저장소 한쪽" 원칙). 자동 보존 20개 규칙에 그대로 든다(P1D-SPEC 45-47행).
4. **되돌리기 = 편집기 "스냅샷" → "새로 시작 전" → 복원.** 복원은 안·버전까지 되돌린다(`memoryDocBook.ts:312` `{...source.doc}`). 새 경로·새 API 없음.
5. **대비 미통과 문서를 통과 버전으로 옮기기(BACKLOG B-ER-01 원문)**: 같은 안이면 편집기 "테마 바꾸기"(내용 보존, 이미 구현), 다른 안이면 이 "새로 시작"(보는 버전으로 새 문서). 대화상자에 두 버전의 대비 결과를 한 줄로 보여 준다(MQ-S3 ★A).
6. **다른 탭이 쓰기 잠금을 가진 때**: 지금 코드는 메모리 교체 **뒤** IDB 쓰기가 INFRA로 실패해 탭 메모리와 저장소가 갈라진다(L1 — 4절). 새로 시작은 되돌리기 어려운 쓰기라 **잠금을 먼저 확인하고, 못 잡으면 쓰기 0**으로 한다(MQ-S2 ★A — 저장소 내부 순서 변경, 인터페이스 불변).

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

### 3.2 "새로 시작" 대화상자 (F4)

열 때 내용은 `doc`(지금 문서)과 `selected`·`viewed`(새 문서)로 채운다. 버튼 2개 + 닫기:

- 주 버튼(왼쪽 아님 — DS 대화상자 관례대로 끝 정렬의 마지막): **"C안으로 새로 시작"** (destructive가 아니라 primary — 옛 문서는 스냅샷으로 남는다)
- 보조 버튼: **"편집기 열기 (B안 · v3 편집 중)"** — EQ-2 A 주 버튼 문구 그대로. 누르면 F2와 같이 이동.
- 닫기(Esc·"취소"): 이동 0 · 쓰기 0 · 포커스 "C안으로 편집 시작" 버튼으로.

**확인 단계는 이 대화상자 하나뿐**이다(이중 확인 없음). 결과 문장이 무엇이 바뀌고 무엇이 남는지와 되돌리는 길을 말한다(문구 5절).

### 3.3 "C안으로 새로 시작"을 누른 뒤 — 결과별

| 결과 | 화면 | 근거 |
|---|---|---|
| 진행 중 | 주 버튼 `aria-busy` + 글자 "새로 시작하는 중…", 두 버튼·닫기 `aria-disabled`(Esc 무시). 다시 눌러도 요청 0 | `CandidatesSection.tsx:87` `starting` 선례 |
| 성공(처음·멱등 재생) | 대화상자 닫고 `/studio/:projectId` 이동, state `{changes, editNotice}` — 편집 알림 = 5.3 R-N1(+ `changeNotice`가 있으면 뒤에 " · "로 잇는다). 편집기는 `getDoc` 최신을 연다(2a-05 8.3.1 583행 위 행) | 8.3.1 |
| `STALE_DOC` | 이동 없음. 대화상자 안 `role=alert` R-E1(2a-05 584행 원문) + "편집기 열기" 버튼. 주 버튼은 **동봉된 최신 doc으로 다시 채운 대화상자**에서만 다시 누를 수 있다(문장의 r번호·편집 중 표시가 최신으로 바뀜) | 2a-05 SPEC:584 |
| `UNKNOWN_VARIANT` | 대화상자 안 `role=alert` = 저장소 `alert` 문장, 다시 시도 없음 · 쓰기 0 | `CandidatesSection.tsx:99` 선례 |
| INFRA · 다른 탭 잠금(MQ-S2 ★A) | 대화상자 안 `role=alert` R-E2 · 쓰기 0 · "다시 시도"(같은 인자) | 4절 |
| INFRA · 그 밖 · `NOT_FOUND` · `SCHEMA_INVALID` · 응답 실패 | `role=alert` R-E3 "새로 시작하지 못했습니다" + "다시 시도"(같은 인자 → 멱등) | 2a-05 SPEC:585 문형 |

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

- **다른 탭이 잠금을 가짐**(그 탭에서 먼저 편집함): MQ-S2 ★A — 잠금 확인 실패 → 쓰기 0 + R-E2. 그 탭을 닫거나 거기서 하면 된다.
- **이 탭이 쓰기 탭이고 다른 탭에 같은 프로젝트 편집기가 열려 있음**: 그 탭은 읽기 전용이라 저장이 이미 INFRA다. 새로 시작 뒤 그 탭이 새로고침하면 새 문서를 연다(추가 처리 0).
- **잠금 지원 없음(`unsupported`)**: 저장 자체가 안 되는 환경(ADR-007 개정 2) — R-E2와 같은 자리에 INFRA 사유 문장.

## 4. 쓰기 잠금과 갈라짐 — 판정

- L1: 잠금 없는 탭에서 지금 `startDoc`(create도 같다)은 메모리 `commit()` → `flush` INFRA. 결과: 이 탭 메모리의 문서 = 새 C안, IDB = 옛 B안 · 스냅샷 없음. 새로고침하면 B안으로 돌아오고 "새로 시작 전" 스냅샷은 IDB에 없다. 화면은 "편집을 시작하지 못했다"고 말하는데 탭 안에서는 이미 바뀌어 있다 — **거짓 상태**.
- `create`는 덮을 문서가 없어 피해가 작지만, `restart`는 사용자의 편집 문서를 바꾸는 쓰기다. 그래서 P1D-SPEC 70행(지우기 흐름: 쓰기 탭이면 진행, 아니면 `tryLock`, 못 잡으면 busy 쓰기 0) 패턴을 restart에 적용한다 → MQ-S2.
- ★A 구현 위치(추정 L3): `memoryProjectRepository.startDoc`에서 `mode === "restart" && local`이면 `docs.start` **전에** `(await local.sync()).enter?.()`(writerGate.enter 노출) → `writer`가 아니면 `blocked(mode)` INFRA로 던진다. `commit` 전에 던지므로 "던지면 변화 0" 규칙과 맞다. 메모리 저장소(`persistence: "memory"`)는 해당 없음.

## 5. 문구 원문 (한국어)

### 5.1 "편집 시작" 주변 (변경)

| ID | 자리 | 문구 |
|---|---|---|
| R-C1 | 상시 캡션 `editNotice`(`generationText.ts:13` 교체) | "편집 시작을 누르면 고른 안으로 편집기를 엽니다. 이미 편집 중인 문서가 있고 다른 안을 골랐으면 새로 시작할지 묻습니다." |
| R-C2 | F3 편집 알림(이동 state) | "이미 편집 중인 문서를 엽니다 (B안 · 프로필 v3) · v4를 쓰려면 '테마 바꾸기'를 누르세요 — 내용은 그대로입니다" |

### 5.2 "새로 시작" 대화상자

| ID | 자리 | 문구 |
|---|---|---|
| R-D1 | 제목(h2, `aria-labelledby`) | "C안으로 새로 시작할까요?" |
| R-D2 | 본문 1 — 지금 문서 | "지금 편집 중인 문서: B안 · 프로필 v3 · 마지막 저장 10월 10일 14:05" |
| R-D3 | 본문 2 — 결과 | "지금 문서는 스냅샷 '새로 시작 전'으로 남고, C안 · 프로필 v4로 새 문서를 만듭니다. 지금 문서의 문구·이미지는 새 문서로 옮겨지지 않습니다." |
| R-D3b | 본문 3 — 되돌리기 | "되돌리려면 편집기의 '스냅샷'에서 '새로 시작 전'을 복원하세요." |
| R-D4 | 캡션(상시) | "자동 스냅샷은 최근 20개만 보관합니다 — 오래 남기려면 편집기에서 '지금 상태 저장'으로 만드세요" (`SnapshotDialog.tsx:223` SN-1과 같은 뜻, 장소만 "편집기에서" 추가) |
| R-D5 | 대비 한 줄(MQ-S3 ★A, 결과가 다를 때만) | "대비 검사: 지금 v3 미달 2 · 새 v4 모두 통과" / 둘 다 미달이면 "대비 검사: 새 v4도 미달 1 — 새로 시작해도 내보내기 전에 보정이 필요합니다" |
| R-B1 | 주 버튼 | "C안으로 새로 시작" · 진행 중 "새로 시작하는 중…" |
| R-B2 | 보조 버튼 | "편집기 열기 (B안 · v3 편집 중)" |
| R-B3 | 닫기 | "취소" |

- 같은 버전이면(R-D3) "C안 · 프로필 v3로"처럼 버전을 그대로 쓴다. 버전 표기는 `v` + 숫자(`CandidatesSection.tsx:138` 선례).
- 시각 표기는 SnapshotDialog 캡션과 같은 형식 함수를 쓴다(새 형식 0).

### 5.3 결과 문장

| ID | 자리 | 문구 |
|---|---|---|
| R-N1 | 성공 — `/studio` 편집 알림(1문장, ER-AC-C1) | "C안 · 프로필 v4로 새로 시작했습니다 · 이전 문서(B안 · v3)는 스냅샷 '새로 시작 전'에 있습니다" (+ `changeNotice` 있으면 " · " + 그 문장) |
| R-E1 | `STALE_DOC` | "다른 곳에서 편집 문서가 바뀌었습니다(r8). 새로 시작하지 않았습니다 — 편집기에서 확인한 뒤 다시 고르세요" (2a-05 SPEC:584 원문) |
| R-E2 | 다른 탭 잠금 | "다른 탭에서 편집 중이라 새로 시작하지 않았습니다 — 그 탭을 닫은 뒤 다시 시도하세요" |
| R-E3 | 그 밖 실패 | "새로 시작하지 못했습니다" + 버튼 "다시 시도" |

## 6. 화면 구조 · 정보 위계 (1280 · 1024 · 390)

- 위계(모든 폭 같음): 제목 R-D1 → 지금 문서 R-D2 → 결과 R-D3 → 되돌리기 R-D3b → (대비 R-D5) → 캡션 R-D4 → 알림 자리(`role=alert`) → 버튼 행.
- **1280 · 1024**: 모달 대화상자, 폭 = DS 대화상자 토큰 폭(CompareDialog보다 좁은 확인용 — 새 토큰이 필요하면 `--layout-*` 기존 값 중 고른다, px 고정 금지). 버튼 행 끝 정렬: [취소] [편집기 열기 (B안 · v3 편집 중)] [C안으로 새로 시작].
- **390**: 전체 폭 시트형(가장자리 여백 = 페이지 여백 토큰). 버튼은 세로로 쌓고 **주 버튼이 맨 위**, 각 버튼 전체 폭 · 최소 터치 높이 = DS Button 기본 크기. 본문이 길어도 버튼 행은 스크롤 끝에 있다(고정 바 없음 — 키보드·확대 시 가림 방지).
- 목업에 이 대화상자는 없다(design/ 2a 시안에 프로필 "새로 시작" 화면 0) — ADR-003 우선순위상 기능 흐름·DS 일관성(CompareDialog·SnapshotDialog의 `<dialog>` 패턴)을 따른다.

## 7. 접근성

| 항목 | 규칙 |
|---|---|
| 열기 | 네이티브 `<dialog>` `showModal()` · 열 때 포커스 = 제목(h2, `tabIndex=-1`) — 결과 문장을 먼저 읽게(주 버튼에 바로 두지 않는다: 실수 Enter 방지) |
| 닫기 | Esc·"취소" = 닫기 → 포커스 "C안으로 편집 시작" 버튼 · 진행 중 Esc 무시(`cancel` 이벤트 preventDefault) |
| 라이브 영역 | 대화상자 밖 알림은 `showModal` 중 inert — 결과 알림은 **대화상자 안** `role=alert` 한 자리(`CandidatesSection.tsx:45` dialogAnnounce 선례). 새 `role=status` 0 |
| 성공 뒤 | 이동 → 편집기의 기존 편집 알림 영역이 R-N1을 1회 읽음(새 영역 0, ER-AC-C1) |
| 키보드 | DOM 순서 = [C안으로 새로 시작] → [편집기 열기 (B안 · v3 편집 중)] → [취소] — 390은 이 순서로 세로 쌓기(주 버튼 맨 위), 1024↑는 `flex-row-reverse` + 끝 정렬로 시각상 [취소][편집기 열기][새로 시작]. Tab은 DOM 순서를 따른다(시각 역순은 DS 대화상자 관례 범위 — 구현에서 CompareDialog·SnapshotDialog 버튼 순서와 다르면 그쪽에 맞추고 RS-D#에 기록) · Enter = 포커스 버튼 · 포커스 가둠 = `showModal` 기본 |
| 비활성 | 진행 중 버튼은 `aria-disabled`(포커스 유지) + `aria-busy` |
| 대비 줄 | 색만으로 통과/미달 구분 금지 — 글자 "통과"/"미달 N" |

## 8. 수용 기준 (RS-AC)

태그: **[U]** Vitest 단위·컴포넌트 · **[G]** 가드·빌드(번들 스크립트) · **[E]** 브라우저 QA(Ego Lite, build + `vite preview`, 앱 안 클릭만 — 메모리 store 새로고침 함정)

| ID | 조건 | 검증 |
|---|---|---|
| RS-AC-01 | F1·F2: 기존 단언(`ProfileCandidates.test.tsx:294-301`) 그대로 통과 — 문서 없음 이동 · 같은 쌍 `DOC_EXISTS` 이동 + 알림 | [U] |
| RS-AC-02 | F3: 같은 안·다른 버전 → 이동 + R-C2(두 버전 숫자) · `startDoc` 호출 = `create` 1회뿐(restart 0) | [U] |
| RS-AC-03 | F4: 다른 안 → 이동 0 · 대화상자 열림 · 포커스 = 제목 · R-D2의 안·버전·저장 시각 = 동봉 `doc` 값 | [U] |
| RS-AC-04 | "C안으로 새로 시작" → `startDoc(projectId, viewed.version, "C", "restart", doc.revision)` 1회 · 성공 → `/studio/:id` state.editNotice = R-N1(+changeNotice) · 저장소 스냅샷 +1(`reason: restart`) | [U] |
| RS-AC-05 | 진행 중 두 번 누름·Esc → 요청 1회 · 대화상자 유지 | [U] |
| RS-AC-06 | `STALE_DOC`(delay 주입으로 사이에 저장) → 이동 0 · R-E1(r번호 = 최신) · 대화상자 내용이 최신 doc으로 바뀜 · 문서·스냅샷 변화 0 | [U] |
| RS-AC-07 | `UNKNOWN_VARIANT` → 저장소 alert 문장 · 다시 시도 없음 · 쓰기 0 / 그 밖 실패 → R-E3 + 다시 시도(같은 인자 → 멱등 재생) | [U] |
| RS-AC-08 | (MQ-S2 ★A) 가짜 잠금(`fakeLocks`) 다른 탭 보유 → restart → INFRA R-E2 · **메모리 문서·스냅샷·멱등 기록 변화 0** · IDB 쓰기 0 · 잠금 풀린 뒤 다시 시도 → 성공 | [U] |
| RS-AC-09 | 취소·Esc → 쓰기 0 · 포커스 "C안으로 편집 시작" · "편집기 열기" → F2와 같은 이동·알림 | [U] |
| RS-AC-10 | 되돌리기: restart 뒤 "새로 시작 전" 복원 → `candidateId`·`profileVersion` = 옛 값 · "복원 전" 자동 +1 (저장소 기존 단언 재사용 + 화면 경로 1건) | [U] |
| RS-AC-11 | 자동 스냅샷 20개 상태에서 restart → 가장 오래된 자동 1개 빠짐 · 수동 불변 · R-D4 캡션 상시 표시 | [U] |
| RS-AC-12 | (MQ-S3 ★A) R-D5: 두 버전 결과가 다를 때만 · 글자로 통과/미달 · 둘 다 미달 문형 | [U] |
| RS-AC-13 | 대화상자·문구·대비 요약 코드 = 조작 뒤 청크(`PROFILE_AFTER_ACTION`에 추가) · `/profile` 첫 화면 ≤ 100 · `/profile (3안 있음)` 진입 직후 기준 불변(±0.03) · `/studio` 진입 바이트 변화 0 · 조작 뒤 청크 크기 출력 | [G] |
| RS-AC-14 | 1280·1024·390: 버튼 순서·주 버튼 위치(6절) · 390 세로 쌓기 · 확대 200%에서 버튼 가림 0 | [E] |
| RS-AC-15 | 실흐름: 문서(B안 v3, 대비 미달) → 프로필 보정 v4 → 3안 만들기 → C안 → 새로 시작 → 편집기 게이트 대비 통과 → 스냅샷 "새로 시작 전" 복원 → B안 v3 | [E] |
| RS-AC-16 | 검증 4종(typecheck·lint·test·build) + 가드(`noHardcodedStyle`·브랜드 격리) | [G] |

## 9. 구현 영향 추정 (L3 — 실측 전, KB 추정 금지 원칙상 크기는 "있음/없음"만)

| 파일 | 변경 | 청크 |
|---|---|---|
| `features/profile/CandidatesSection.tsx` | `DOC_EXISTS` 분기(F2·F3·F4) — `doc` 모양만 읽기 · 대화상자 로더 호출 | 엔진 청크(**진입 직후** 시나리오에 듦) — 분기 몇 줄만 둔다 |
| `features/profile/RestartDialog.tsx` (신규) | 대화상자·문구·결과 처리·R-D5 | 조작 뒤(신규 — `PROFILE_AFTER_ACTION` 추가) |
| `features/profile/restartLoader.ts` (신규) | `retryableImport` 로더(`compareLoader.ts` 선례) | 엔진 청크(로더 몇 줄) |
| `features/profile/generationText.ts` | R-C1 교체 · R-C2 | 엔진 청크(문자열 증분 소량) |
| `data/memoryProjectRepository.ts` · `data/persistence/localSync.ts` | (MQ-S2 ★A) restart 전 잠금 확인 · `LocalSync`에 `enter` 노출 | 조작 뒤(/profile) · `/studio`에서는 memoryProjectRepository가 **진입 직후** 청크 — 몇 줄 증가(아래) |
| `scripts/check-bundle-size.mjs` | `PROFILE_AFTER_ACTION`에 `RestartDialog.tsx` | — |
| 테스트 | `ProfileCandidates.test.tsx`(분기) · `RestartDialog.test.tsx`(신규) · `memoryProjectRepository.test.ts`(잠금) | — |

**예산 영향**
- `/profile` 첫 화면 99.87/100: 변화 0 목표(대화상자 전부 조작 뒤). `CandidatesSection`은 엔진 청크라 첫 화면에 들지 않는다(`check-bundle-size.mjs:109-116` — `profileEngine.ts`는 `auto`). 진입 직후 시나리오 증분은 분기·로더·문자열뿐.
- `/studio` 129.28 / 멈춤 129.65: 화면 쪽 변경 0(편집 알림은 이동 state 문자열 — 기존 경로). **MQ-S2 ★A만** `memoryProjectRepository.ts`(진입 직후 청크)에 restart 잠금 확인 몇 줄을 더한다 → 여유 0.37 안(추정 +0.01~0.03, 실측 필수). 넘으면 잠금 확인 본문을 조작 뒤 청크 `memoryDocBook` 쪽 호출부로 옮긴다(조작 뒤 청크 설계: `startDoc` 래퍼는 `bookOf()` 뒤에 `sync.enter()`를 부르므로 판정 코드를 `localSync.ts` — 이미 조작 뒤 — 에 두고 저장소에는 호출 한 줄만).
- 진입 closure(`/studio` 진입 파일)를 건드리는 것은 위 한 줄뿐이다.

## 10. 위험 · 2a-05와 다르게 한 곳

**위험**
| ID | 위험 | 완화 |
|---|---|---|
| RS-R1 | 대화상자 없이 쓰기 → 편집 내용 손실 체감 | 쓰기는 대화상자 주 버튼 뒤에만 · 스냅샷은 저장소가 같은 커밋에 만든다 |
| RS-R2 | 잠금 없는 탭 갈라짐(4절) | MQ-S2 ★A · B를 고르면 R-E2 대신 "탭 메모리는 바뀜" 사실을 문장에 넣어야 한다 |
| RS-R3 | 20개 정리로 오래된 "내보내기 전" 등 자동 사본이 밀림 · 반복 새로 시작이면 "새로 시작 전"도 밀림 | R-D4 상시 · 문구가 "모두 보존"을 약속하지 않는다 |
| RS-R4 | "새로 시작 전" 이름에 시각이 없어 반복 시 같은 이름 | 목록 캡션에 시각이 있다(`SnapshotDialog.tsx:231`) — 이름 변경은 저장소 문자열이라 MQ-S4 |
| RS-R5 | `/studio` 진입 직후 예산 증가(MQ-S2 ★A) | 9절 조작 뒤 배치 · 실측 후 멈춤선 판정 |
| RS-R6 | 편집기에서 미저장 상태로 프로필로 와 바로 새로 시작 | 편집기 이탈 시 저장 경로(기존). `DOC_EXISTS` revision이 최신이 아니면 `STALE_DOC`(R-E1)로 막힌다 |

**2a-05와 다르게 한 곳 (RS-D#)**
- **RS-D1**: EQ-2 A는 "문서가 있으면 주 버튼 = '편집기 열기 (B안 · v3 편집 중)', 다른 안이면 보조 버튼 'C안으로 새로 시작'"으로 **진입 때부터** 두 버튼을 그린다. 이 SPEC은 버튼은 그대로 두고 **누른 뒤 대화상자**에 같은 두 버튼을 둔다. 사유: 진입 때 문서 상태를 알려면 `memoryProjectRepository`를 /profile 진입에 받아야 하는데 첫 화면 여유 0.13이고(fix-ber11 REPORT:25), 진입 직후 시나리오도 기록상 120.00 → 119.97로 여유가 작다(p1d-l1 REPORT:12 — 한도 해석은 추정 L3). MQ-S1.
- **RS-D2**: 2a-05 SPEC:583 `DOC_EXISTS` = "이동" → F4(다른 안)에서는 이동하지 않고 대화상자. F2·F3는 원문대로 이동.
- **RS-D3**: EQ-2 A에 확인 대화상자는 없었다(B안의 요소). RS-D1 때문에 대화상자가 생기므로 그것이 곧 확인이며 이중 확인은 두지 않는다.

## 변경 이력
- r0 (2026-10-10): 초안.
