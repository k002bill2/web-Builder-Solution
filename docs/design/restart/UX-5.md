# UX-5 — 저장 충돌 · 저장 미확인 · memory-only 상위 UX 명세 (초안)

- 상태: **r0 초안 — QA 리뷰와 병렬 작성, 계약 확정본 아님, 구현 승인 아님.** 코드 0, 실화면 검증 0이다. 이 문서의 수용 기준은 구현 레인이 검증할 기준이며 PASS를 주장하지 않는다.
- 입력: `docs/design/restart/CONTRACT-5.md` r0.1a(이하 "C5", **Codex 미재검토**) · `dev/active/rs5-contract/REPORT.md` · `dev/active/rs4-measure/REPORT.md` · 기존 화면 사실(읽기 전용 조사 2건, `dev/active/rs5-ux/logs/survey-*.md`).
- base `418979e` · 앱 `93f8111` · 작성 Designer(Orca Claude Code) · 회수 Jarvis.
- 이 문서는 C5·SPEC-3·SPEC-4·ADR을 **수정하지 않는다.** C5에 없는 method·필드가 필요하면 13절 gap(G#) 표에 제안으로만 올린다.
- 표기: **[L1]** 코드·문서 행 직접 확인 · **[C5]** C5 본문에 있으나 미재검토 · **[G#]** C5에 없음 = 계약 공백(13절) · **[L3]** 추정.

## 0. 요약

1. 상태는 **축 3개**(환경 · 장부 단계 · 결과)로 나누고, 화면에는 **우선순위 1줄**로 하나만 보인다(2절). 장부 단계는 `view()`로만 읽는다. 그런데 `LedgerView` 필드가 C5에 정의되어 있지 않다 [G1].
2. **"저장됨"(영구 확인)은 5조건을 모두 만족할 때만** 보인다. 조건은 `confirmed` · `!newer` · 그 뒤 편집 없음 · local 모드 · 싱크 정상이다. 하나라도 빠지면 "확인 전"이다(3절).
3. **"저장 확인"(`confirm`)과 "시작 다시 시도"(`retryStart`)는 다른 버튼, 다른 문구, 다른 자리다.** SPEC-3/4의 "저장 다시 시도"(= `startDoc` 재생)라는 라벨은 UX-5에서 "시작 다시 시도"로 바꾼다(4절 · 14절 D1).
4. **충돌(conflicted)** 은 두 선택지만 준다. "내 초안으로 저장"과 "바뀐 문서 쓰기"다. 각 선택지는 무엇이 현재 문서에서 빠지는지, 스냅샷으로 남는지, 이미지는 어떻게 되는지를 버튼 옆에 쓰고, 확인 대화상자를 거친다. 다만 "내 초안 유지"에 대응하는 method가 C5에 없다 [G2]. 기존 `resolveConflict` 경유를 제안한다(5절).
5. **이탈 보호**는 경로별로 다르다. 앱 안 링크와 POP은 장부가 탭 안에서 초안을 지킨다 [C5]. 새로고침·주소 입력·탭 닫기는 `beforeunload` 경고(브라우저 기본 문구)만 있고 보장하지 않는다. 모바일 백그라운드 종료와 크래시는 보호 0이다(7절).
6. 모든 버튼은 C5 method 하나에 1:1로 대응한다(8절). 대응 method가 없는 버튼 3개는 gap으로 올렸다(G2·G3·G4). 화면에 수동 "저장" 버튼은 없으므로 "저장 버튼을 누르세요"류 문구는 금지한다(8.2).

## 1. 범위 · 제외

**범위**: `/studio/:projectId` 저장 상태 표시와 충돌 영역 · `/projects` 행의 미확인/시작 대기 표시 · `/profile` 시작(create/restart) 결과 중 장부와 맞물리는 부분 · 이탈 보호 문구 · 1280/1024/390 배치 · 키보드/스크린리더 수용 기준.

**제외**
- 계약 변경(새 method·필드 확정)은 하지 않는다. 13절에 제안만 둔다.
- 번들 측정과 예산 상향은 하지 않는다. 장부 seed 인계 UI가 `/studio` 진입 바이트에 들지는 C5 8.2/8.3 S5 스파이크 몫이다.
- 서버 저장소 UX는 제외한다(C5 `ledger`는 local·memory만).
- 초안 영속(새로고침 뒤 복원)은 제외한다. C5 6.1에 따라 새 스키마가 필요한 별도 결정이다.

## 2. 상태 모델 — 축 3개 + 표시 우선순위

### 2.1 축

| 축 | 상태 | 정의(판정 출처) | 근거 |
|---|---|---|---|
| **환경** | `memory-only` | `repository.persistence === "memory"`, 즉 영구 확인 불가 | [C5] I6 · [L1] `saveStatusText.ts:33-36` |
| 환경 | `unsupported` | local인데 싱크 열기 실패(`navigator.locks` 없음 등) | [C5] 2.4 · **구별 필드 없음 [G5]** |
| 환경 | `readonly` | 다른 탭이 쓰기 잠금 보유(`READ_ONLY_TAB`) | [C5] Reason `read-only` · [L1] `infra.ts:10-29` |
| 환경 | `stale` | **탭 최신성 상실(`STALE_TAB`)** — 다른 탭이 더 새 쓰기를 함 | [C5] Reason `stale-tab` |
| 환경 | `cleared` | 브라우저 데이터 지움(`CLEARED_TAB`) | [C5] Reason `cleared` |
| 환경 | `offline` | 스케줄러가 저장 호출 전에 멈춤(`navigator.onLine=false`·NETWORK) | [L1] `useAutosaveScheduler.ts:171-176` |
| **장부 단계** | `dirty` | `dirtyMark > publishedMark` — 디바운스 중 편집 | [C5] I8 · 2.2 |
| 장부 단계 | `saving` | `inflight` 있음 | [C5] 2.2 |
| 장부 단계 | `unconfirmed` | `latest.seq > confirmedSeq`이고 inflight 없음, 또는 마지막 결과가 `failed`이고 memory가 `committed`임 | [C5] 2.3 seed phase · 2.4 |
| 장부 단계 | `start-pending` | `start` 있음(create/restart 미확인) | [C5] 2.2 `StartPending` · I7 |
| 장부 단계 | `conflicted` | `conflicted{theirs}` — 미확인 초안이 있는데 문서가 교체됨 | [C5] I3b · 4.4 |
| **결과** | `image-missing` | 마지막 결과가 `failed{image-missing, missing}` | [C5] 2.4 · I4 |
| 결과 | **영구 확인** | 3절 5조건 | [C5] 4.2-6 · I6 |

**`stale`이라는 이름의 혼동을 막는다.** 이 문서의 `stale`은 **탭 최신성 상실(stale-tab)만** 뜻한다. 편집기 phase `stale`(기존 E-S09 — `STALE_DOC` 또는 lease 보유 중 교체)은 **충돌**로 분류해 `conflicted`와 같은 충돌 영역(5절)을 쓴다. 이유는 둘 다 "내 편집 vs 다른 문서" 선택이기 때문이다. Reason `stale-doc`도 충돌 영역으로 보낸다.

### 2.2 표시 우선순위 (동시에 걸리면 위가 이긴다 — 1줄 규칙)

`cleared` > `conflicted` > `start-pending` > `stale` > `readonly` > `image-missing` > `unsupported` > `memory-only` > `offline` > `saving` > `unconfirmed` > `dirty` > 영구 확인 > (없음)

- 근거: 사용자가 다음에 할 일이 바뀌는 순서다. `cleared`는 어떤 행동도 저장되지 않는다. `conflicted`와 `start-pending`은 선택 전에 저장이 0이다(I3b·I7). 환경 제약은 재시도해도 실패한다.
- 이긴 상태만 상태 글자로 보인다. 진 상태 중 **보호 술어(I8)에 들어가는 것**(`dirty`·`unconfirmed`·`saving`·`start-pending`·`conflicted`)은 `beforeunload` 등록에 그대로 반영된다. 화면 표시와 보호는 독립이다.
- `memory-only`와 장부 단계가 겹칠 때(예: memory + dirty)는 장부 단계 문구 뒤에 " · 이 탭에만"을 붙인다. 영구 확인은 memory에서 나오지 않는다.

### 2.3 상태표 (화면 · 문구 · 알림 · 행동 · 보호)

문구는 기존 정본 `features/studio/saveStatusText.ts`에 이어 쓰는 것을 전제로 한다. **새 문구는 전부 초안**이며 ★는 기존 문구를 그대로 재사용한다는 표시다.

| 상태 | 상태 글자(편집기 툴바) | 알림(1회) | 행동 버튼 → method | `/projects` 행 | 보호(I8) |
|---|---|---|---|---|---|
| `dirty` | ★"저장 전 변경 있음" | 없음 | 없음(자동 저장) | (편집기 밖에서는 `latest`가 되므로 `unconfirmed`로 보임) | on |
| `saving` | ★"저장 중…" | 없음 | 없음 | "저장 중…" | on |
| `unconfirmed` | "브라우저 저장을 확인하지 못했습니다" | alert "브라우저 저장을 확인하지 못했습니다" | "저장 확인" → `confirm`. 편집기 안에서는 **dirty가 아닐 때만** 보인다(편집하면 숨고 자동 저장이 이어 받음 — G6 회피, MQ-5-3) | 상태 글자 같음 + "저장 확인" → `confirm` | on |
| `start-pending` | "새로 시작(또는 편집 시작)이 저장됐는지 확인하지 못했습니다" | alert 1회 | "시작 다시 시도" → `retryStart` · "지금 문서 유지" → **[G3 method 없음]** | 같음, "편집기 열기" 숨김(SPEC-3 5.2 승계 — 편집기 안 start-pending 중 자동 저장 허용 여부 C5 미정 [G10]) | on |
| `conflicted` | ★"다른 곳에서 이 문서가 바뀌었습니다" | alert ★"…내 편집은 그대로 두었습니다" | 5절 두 선택 | "바뀐 문서와 내 초안 중 고르기 전입니다" + "편집기에서 고르기"(링크, `/studio/:id`) | on |
| `image-missing` | "이미지 {n}개를 저장하지 못했습니다" | alert 1회 | "이미지 다시 고르기"(해당 슬롯으로 포커스 이동) — **슬롯 식별 [G7]** | "이미지 {n}개가 빠져 있어 저장을 확인하지 못했습니다" + "편집기 열기" | on(`latest` 유지) |
| `readonly` | "다른 탭에서 편집 중이라 이 탭은 저장하지 않습니다" | alert 1회 | "저장 확인" 유지(그 탭을 닫은 뒤 재시도 → `confirm`). steal 버튼 없음(I10) | 같음 | on |
| `stale` | ★(사유) "다른 탭에서 바뀐 내용이 있습니다 — 새로고침한 뒤 편집하세요" | alert 1회 | "확인되지 않은 변경 버리고 새로고침"(→ 6.3 폐기 확인 → `discard` + reload). "저장 확인" 숨김(재시도해도 `stale-tab`) | 같음 | on |
| `cleared` | ★(사유) "이 브라우저 데이터가 지워졌습니다 — 새로고침하세요" | alert 1회 | "새로고침"(폐기 확인 경유). 저장 버튼 0 | 같음 | 장부 폐기(C5 4.5) → off |
| `offline` | ★"오프라인 — 연결되면 저장합니다" | status 1회 | 없음(`online` 이벤트로 자동 1회 — [L1] `useAutosaveScheduler.ts:106-110`) | 편집기 밖: "오프라인이라 저장을 확인하지 못했습니다" + "저장 확인"(`confirm`은 offline을 막지 않음 — C5 T4) | on |
| `unsupported` | "이 브라우저는 저장소를 쓸 수 없어 이 탭에만 저장합니다" | status 1회 | 없음 | 기존 `BrowserStorageSection` 경고 재사용 | (memory와 같음) [G5] |
| `memory-only` | ★"이 탭에 저장됨 · {시각}" | 없음 | **"저장 확인" 버튼 숨김**(눌러도 `memory-only` — 영구 약속 금지) | ★기존 memory 캡션 | 항상 on([L1] `useAutosaveScheduler.ts:66-70`) |
| 영구 확인 | ★"이 브라우저에 저장됨 · {시각}" | 회복일 때만 status ★"다시 저장했습니다" / 편집기 밖 확인 성공 status "저장을 확인했습니다" | 없음 | "편집기 열기" 정상 | off(다른 항 없을 때) |
| `failed`(그 밖 사유: quota·clone-failed·infra-unknown) | ★"저장하지 못했습니다" + 사유 1구(quota면 "· 저장 공간 부족") | alert ★1회 | ★"다시 저장"(마운트 중 = 기존 `save.retry` → 장부 `save`) / 편집기 밖 "저장 확인" → `confirm` | 같음 | on |

### 2.4 문구 금지 목록

- "저장 버튼을 누르세요" · "⌘S/Ctrl+S로 저장" · "편집기에서 한 번 저장하세요" — 수동 저장 수단이 없다([L1] 단축키는 실행 취소/다시 실행뿐, `historyKeys.ts:9-20`).
- memory 모드에서 "저장됨"(영구 의미) · "브라우저에 저장됨" — I6.
- "자동 복구" · "안전하게 보관됩니다" · "모든 편집이 저장됐습니다" — 보장이 없다(C5 4.5 탭 수명, SPEC-4 한계 승계).
- `newer`인 확인 결과에 "저장됨"·"저장을 확인했습니다" — 3절.
- 확인 성공을 문서 단위가 아닌 편집 단위로 말하는 것("방금 편집이 저장됐습니다") — C5 I2 과소 확인 가능성.

## 3. "저장됨"(영구 확인) 표시 조건 — 5개 모두

| # | 조건 | 출처 | 하나라도 빠지면 |
|---|---|---|---|
| 1 | 마지막 결과 `kind === "confirmed"` | [C5] 2.4 | 실패면 해당 사유, 미실행이면 `unconfirmed` |
| 2 | `newer === false` | [C5] 4.2-6 | **"저장 중…" 또는 "저장 전 변경 있음"** — 확인된 세대보다 새 초안이 있다. "저장됨"과 "미확인"을 한 줄에 섞지 않는다 |
| 3 | 확인 resolve 뒤 `dirtyMark`가 그대로(편집 없음) | [C5] I8 · 2.2 | `dirty` |
| 4 | `persistence === "local"` | [C5] I6 | `memory-only` |
| 5 | 싱크가 `unsupported`·`closed`·`cleared`가 아님 | [C5] I6 · 2.5 `mode()` | 해당 환경 상태 |

- 결과에 새 세대(`newer`)가 있으면 상태 글자는 **새 세대 기준**으로 바꾼다(`saving`이면 "저장 중…", 아니면 "저장 전 변경 있음"). 확인된 옛 세대에 대해 "저장됨"을 따로 보이지 않는다. 알림도 내지 않는다(성공 status 0).
- 편집기 밖(`/projects`)에서 `newer`가 생길 수 없다는 가정은 하지 않는다. 다른 진입 경로의 publish(재진입 뒤 cleanup 등)가 있을 수 있으므로 같은 규칙을 적용한다.

## 4. 저장 확인 vs 시작 다시 시도 — 분리

### 4.1 원칙

| 구분 | 저장 확인 | 시작 다시 시도 |
|---|---|---|
| method | `confirm(projectId)` | `retryStart(projectId)` |
| 하는 일 | 지금 문서·초안을 IDB에 확인(필요하면 초안 커밋) | create/restart 요청을 같은 인자로 재생 |
| `startDoc` 호출 | 0(I7) | 있음 |
| 언제 보이나 | `unconfirmed`·`image-missing`·`readonly`·`offline`(편집기 밖)·`failed` | `start-pending`일 때만 |
| `start-pending` 중 | **숨김.** 눌러도 `failed{start-pending}`, 쓰기 0이기 때문 | 주 버튼 |
| 라벨 | "저장 확인" | "시작 다시 시도" |

- 두 버튼은 **같은 영역에 동시에 나오지 않는다.** `start-pending`이 우선순위로 이기므로 그동안 "저장 확인"은 숨는다.
- SPEC-3 5.2와 SPEC-4의 "저장 다시 시도"(= `startDoc` 재생)는 이름이 "저장"이라 확인과 섞인다. UX-5에서는 **"시작 다시 시도"** 로 바꾼다(14절 D1). SPEC-3/4 본문은 수정하지 않는다.
- SPEC-4의 "저장 확인"은 `deleteSnapshot(p,"")` 차용이었는데, C5가 이를 폐기했다(C5 9절 ⑥). UX-5는 **라벨만 승계**하고 `confirm()`으로 매핑한다(14절 D2).

### 4.2 `start-pending` 재판정 화면 (C5 4.3 — Designer 몫)

`start.held`가 `not-applied`(R-E5 무커밋)이거나 `unknown`일 때 보인다. 위치: `/profile` 결과 영역, `/projects` 행, 편집기 충돌 영역 자리(같은 Callout 슬롯).

- 제목(Callout warning): "새로 시작이 반영됐는지 확인하지 못했습니다" (create면 "편집 시작이…")
- 본문: "다시 시도해도 같은 요청이라 두 번 바뀌지 않습니다. 지금 문서를 그대로 쓰려면 '지금 문서 유지'를 고르세요. 확인 전에 새로고침하거나 탭을 닫으면 새로 시작과 그 뒤 편집이 사라질 수 있습니다." (SPEC-4 R-E5 꼬리 문장 승계)
- 버튼: 주 "시작 다시 시도" → `retryStart` · 보조 "지금 문서 유지" → **[G3]**(C5 4.3은 "`start` 비움"이라고만 쓰고 API가 없음)
- `retryStart` 성공 → C5 4.4 `replace`. 미확인 `latest`가 없으면 편집기 문서가 교체되고 status "새로 시작을 확인했습니다"가 나온다. `latest`가 있으면 **충돌(5절)로 이어진다.** 이때 "시작 다시 시도" 성공 문구를 내지 않고 충돌 alert 1회만 낸다(알림 중복 0).
- `held === "unconfirmed"`(커밋은 됐는데 IDB 미확인)는 SPEC-4 R-E4 문구를 승계하고, 주 버튼 "시작 다시 시도"만 둔다.

## 5. 충돌 (`conflicted` · 편집기 phase `stale`) — 두 선택

### 5.1 언제

- 편집기 마운트 중 `STALE_DOC`(기존 E-S09) 또는 lease 보유 중 replace(C5 4.4 3행, phase `stale`).
- 편집기 밖에서 replace된 뒤 재진입: seed phase `conflicted`. C5 4.4("초안 doc를 바로 편집 문서로 쓰지 않고 선택을 먼저 보인다")에 따라 캔버스는 내 초안을 **미리보기**로 보이고, 편집 패널 입력은 선택 전까지 `aria-disabled`(이유 1줄 "고른 뒤 편집할 수 있습니다")다. 자동 저장은 0이다. 읽기 전용 편집 모드는 기존 화면에 없다 [L3 — 구현 비용 미확인 · MQ-5-5].
- `/projects`에서 `confirm` 결과 `failed{replaced-conflict}`: 행에 "바뀐 문서와 내 초안 중 고르기 전입니다" + 링크 "편집기에서 고르기". **편집기 밖에서는 고르지 않는다.** 이유: 두 문서를 볼 화면이 편집기뿐이고, 파괴 선택을 미리보기 없이 받지 않는다.

### 5.2 배치 · 문구

기존 `ConflictCallout`(Callout `warning`, 캔버스 위) 재사용 [L1 `ConflictCallout.tsx:20-37`].

- 제목: ★"다른 곳에서 이 문서가 바뀌었습니다(r{N})" + 원인 꼬리(알 수 있을 때): " — 새로 시작" / " — 스냅샷 복원" / " — 다른 탭 저장". 원인 필드가 없다 [G8].
- 본문: ★"내 편집은 그대로 두었습니다." + "고르기 전에는 저장하지 않습니다."
- 버튼 2개(순서 = DOM 순서 = 탭 순서):
  1. 주(primary sm) **"내 초안으로 저장"** — 기존 ★"내 편집으로 저장"과 같은 의미. 문구는 기존 것을 유지한다(같은 화면에 두 라벨 0).
  2. 보조(outline sm) **"바뀐 문서 쓰기"** — 기존 ★"다른 편집 불러오기" 유지 여부는 MQ-5-2.
- 각 버튼 아래(또는 `aria-describedby`)에 결과 1줄:
  - 주: "바뀐 문서는 스냅샷 '충돌 보존'으로 남기고 내 초안으로 덮어씁니다"
  - 보조: "내 초안은 스냅샷 '충돌 보존'으로 남기고 바뀐 문서를 불러옵니다"

### 5.3 파괴 결과 · 이미지

| 선택 | 현재 문서가 되는 것 | 사라지는 것 | 되찾기 | 이미지 |
|---|---|---|---|---|
| 내 초안으로 저장 | 내 초안(`latest.doc`), revision = theirs+1 | theirs가 현재 문서에서 빠짐 | **기존 `resolveConflict("mine")`을 쓰면** theirs가 자동 스냅샷 "충돌 보존"으로 남는다 [L1 `memoryDocBook.ts:330-331`]. C5에 이 method 매핑 없음 [G2] | 내 binding 이미지가 같은 트랜잭션으로 커밋돼야 함(I4). theirs가 참조하던 이미지는 IDB에 남는다. 스냅샷 복원 때 이미지가 다시 붙는지는 [L3 확인 필요 — `imageStore.ts:26` 보존 집합은 문서+직전 1개] |
| 바뀐 문서 쓰기 | theirs(이미 IDB에 있는 교체 문서) | 내 초안이 현재 문서에서 빠지고 장부 `latest`·binding 해제 | **`resolveConflict("theirs")`를 쓰면** 내 초안이 스냅샷 "충돌 보존"으로 남는다 [L1 `:330`]. `discard`로 매핑하면 **스냅샷 0 = 복구 불가** [G4] | 내 초안에만 있던 새 이미지(binding)는 해제 → 스냅샷 문서가 참조해도 Blob이 없을 수 있다 [L3 확인 필요] |

- **권장(MQ-5-1)**: 두 선택 모두 기존 `resolveConflict` 의미(진 쪽을 스냅샷으로 보존)를 장부 경유로 쓴다. `discard`(보존 0)는 충돌 선택에 쓰지 않는다. 이렇게 하면 두 선택 모두 "되돌릴 수 있는 선택"이 된다.
- 단, 자동 스냅샷 개수 상한(`withAuto`)으로 오래된 "충돌 보존"이 밀려날 수 있다 [L3 — 상한 값 미확인]. 문구에 "언제든 되찾을 수 있습니다"를 쓰지 않는다.

### 5.4 확인 대화상자 (취소/폐기 확인)

- **G2/G4가 MQ-5-1 권장대로 닫히면**(양쪽 스냅샷 보존): 확인 대화상자 없이 바로 실행한다. 기존 E-S09와 같다. 결과 1줄이 버튼 옆에 미리 보이기 때문이다.
- **보존 0 경로가 남으면**(예: "바뀐 문서 쓰기" = `discard`): 반드시 확인 대화상자를 거친다.
  - 기존 패턴: 네이티브 `<dialog>` + `showModal()` [L1 `DeleteProjectDialog.tsx:37-47`]. `role="alertdialog"`를 붙이고 `aria-labelledby`(제목) · `aria-describedby`(본문)를 둔다.
  - 제목 "내 초안 버리기" · 본문 "내 초안과 새로 고른 이미지 {n}개가 사라지고 되찾을 수 없습니다." · 버튼 "취소"(초기 포커스) · "버리고 바뀐 문서 쓰기"(위험 스타일).
  - Esc = 취소. 바깥 클릭으로는 닫히지 않는다. 연타는 `aria-disabled` + ref로 1회만 처리한다.
- 진행 중: 두 버튼 `aria-disabled` + 영역 `aria-busy="true"`. 상태 글자 "저장 중…".

### 5.5 포커스 · 알림

| 시점 | 포커스 | 알림 |
|---|---|---|
| 충돌 진입(마운트 중) | 이동하지 않는다(입력 중 포커스 탈취 금지) | `SaveStatus`의 alert 1회 ★ |
| 충돌 진입(seed `conflicted`로 재마운트) | 충돌 영역 제목(`h3`에 `tabIndex=-1`)으로 이동. 진입 직후라 탈취가 아니고, 선택 전 저장 0을 먼저 읽히기 위함 | alert 1회 |
| 대화상자 열림 | "취소" | — |
| 대화상자 닫힘(취소) | 연 버튼으로 복귀 | — |
| 선택 성공 | 충돌 영역이 사라지므로 **편집기 h1**(`tabIndex=-1`, [L1] `StudioToolbar.tsx:25`)으로 이동 | status: 주 "내 초안으로 저장했습니다 — 바뀐 문서는 스냅샷 '충돌 보존'에 있습니다" / 보조 "바뀐 문서를 불러왔습니다 — 내 초안은 스냅샷 '충돌 보존'에 있습니다" |
| 선택 실패 | 누른 버튼에 그대로 둔다 | alert ★"충돌을 해결하지 못했습니다 — 다시 골라 주세요" [L1 `StudioLayout.tsx:116-120`] — 사유가 `read-only`·`stale-tab`·`cleared`면 해당 환경 문구로 바꾼다 |

### 5.6 수명 한계 (재마운트 · POP · 새로고침 · 모바일 종료)

| 사건 | 결과 | UX |
|---|---|---|
| 창 폭 변경으로 레이아웃 모드 전환(하위 재마운트 [L1] `StudioLayout.tsx:86-92`) | 장부 `conflicted` 유지. 충돌 영역은 새 트리에 다시 그려진다 | 알림 재발화 0(진입 1회 규칙) · 포커스가 사라진 버튼에 있었으면 충돌 영역 제목으로 |
| StrictMode·편집기 재마운트 | lease 재획득 멱등(C5 4.5). seed phase `conflicted` | 위 5.5 재마운트 행 |
| POP(뒤로) 이탈 → 재진입 | 장부는 탭 메모리라 유지(C5 4.5) → seed `conflicted` | 재진입 때 다시 선택. `/projects` 행에는 "고르기 전입니다" |
| 새로고침 · 주소 입력 · 탭 닫기 | `beforeunload` 경고(I8 `conflicted` 항). 무시하고 나가면 장부가 사라지고 **IDB의 theirs만 남는다. 내 초안은 사라진다** | 경고는 브라우저 기본 문구. 앱은 문구를 정할 수 없다. 충돌 본문에 "고르기 전에 새로고침하거나 탭을 닫으면 내 초안이 사라집니다"를 둔다 |
| 모바일 백그라운드 종료 · 크래시 | 경고 없이 장부 소멸 → theirs만 남음 | 보호 0. 위 본문 문장이 유일한 고지다 |

## 6. 저장 미확인 · memory-only · 폐기

### 6.1 편집기 진입 인계 (seed phase `unconfirmed`)

- C5 2.3 `LedgerSeed.phase`가 `unconfirmed`면 상태 글자 "브라우저 저장을 확인하지 못했습니다" + "저장 확인"으로 시작한다. SPEC-4 CP4 문구를 승계한다.
- 편집을 시작하면 → `dirty`. 자동 저장이 `latest`를 이어 저장한다(C5 4.1).
- **CP4와 같은 예산 관문이 남는다**: seed 인계는 `/studio` 진입 바이트 = C5 S5b/S5c 미측정이다. 측정 전에는 이 절이 조건부다.

### 6.2 memory-only

- 편집기에는 기존 표시 그대로 "이 탭에 저장됨" [L1]. "저장 확인" 버튼은 **보이지 않는다**(누르면 `memory-only`만 돌아오고 영구 약속처럼 읽히기 때문).
- `/projects` 행: 기존 memory 캡션 + 행마다 따로 표시하지 않는다(모든 행이 같다).
- `confirm`이 `memory-only`를 돌려줄 수 있는 유일한 경로(다른 화면이 부른 경우)에서는 status "이 탭에만 저장되어 있습니다 — 새로고침하거나 탭을 닫으면 사라집니다"로 알린다. "확인했습니다"는 쓰지 않는다.
- `unsupported`(local인데 싱크 실패)는 사용자에게 memory와 **같은 문구**를 보인다. 내부 구별 필드는 [G5].

### 6.3 폐기 확인 (`discard`)

- 쓰는 곳: `stale`·`cleared` 상태의 "버리고 새로고침", 그리고 `/projects` 행의 보조 행동 "확인되지 않은 변경 버리기"(`unconfirmed`·`image-missing`일 때만).
- SPEC-4 폐기 대화상자를 승계한다(`role=alertdialog`, 제목 "확인되지 않은 변경 버리기", 첫 포커스 "취소", 위험 버튼 "버리기"). **문구 차이**: SPEC-4는 "탭 안 모든 미확인 기억"이 함께 사라진다고 썼지만, C5 `discard(projectId)`는 **프로젝트 단위**다. 본문은 "'{이름}'의 확인되지 않은 변경과 새로 고른 이미지가 사라집니다. 마지막으로 확인된 저장 상태로 돌아갑니다."로 한다.
- "버리고 새로고침"은 `discard` 뒤 `location.reload()`다. 다른 프로젝트 장부도 새로고침으로 사라지므로, **다른 프로젝트에 보호 항이 있으면** 본문에 "다른 프로젝트 {n}개의 확인되지 않은 변경도 새로고침하면 사라집니다"를 덧붙인다. 개수를 세려면 전 장부 순회 view가 필요하다 [G1].
- 닫힘 뒤 포커스: 취소면 연 버튼으로. 버리기 성공(새로고침 없음)이면 그 행의 "편집기 열기"로. 행이 바뀌면 행 제목 `h2`로.

## 7. 이탈 보호 — 경로별 범위

| 경로 | 무엇이 막나 | 결과 | 사용자에게 하는 말 |
|---|---|---|---|
| 앱 안 링크(편집기 → `/projects` 등) | 기존 `leave()` 이동 보류 [L1 `StudioLayout.tsx:127-148`] + 장부 cleanup publish [C5 4.5] | 저장 실패여도 초안은 장부에 남는다. 탭 안 유지 | 이동 보류 시 상태 글자로 사유. 이동 후 `/projects` 행에 미확인 표시 |
| 수정키 클릭(새 탭에서 열기) | 막지 않음 [L1] | 원래 탭 유지, 새 탭은 다른 장부(탭당 1개) + 잠금 규칙 | 새 탭은 `readonly` 문구 |
| 브라우저 뒤로/앞으로(POP) | **장부**(cleanup에서 publish) [C5 4.5 · F9 해소] | 초안 보존, 재진입 seed로 이어짐 | 재진입 때 상태 글자로 이어서 보임. 경고 대화상자는 없다(가로챌 수 없음 — `useBlocker` 0 [L1]) |
| 주소 직접 입력 · 새로고침 · 탭/창 닫기 | `beforeunload` **경고만** [C5 I8] | 경고를 무시하면 장부 소멸 | 브라우저 기본 문구라 앱 문구 0. 그래서 **화면 상태 글자가 이유를 미리 말해야 한다**(2.3) |
| 모바일 백그라운드 종료 · OS 메모리 회수 | 없음(`beforeunload`가 발화하지 않을 수 있음) | 장부 소멸 | 상태 문구 꼬리 "확인 전에 앱을 닫으면 사라질 수 있습니다"(390 레이아웃에서 `unconfirmed`·`conflicted`·`start-pending`일 때만) |
| 크래시 | 없음 | 소멸 | 고지 없음(감지 불가) |
| 이미지 준비 중 이탈(ingest) | 없음 — 아직 편집이 아니라 장부도 모른다 [C5 4.6-5] | 고른 이미지 소실 | 준비 중에는 기존 표시 [L1] "이미지를 준비하고 있습니다…"에 " · 끝나기 전에 나가면 다시 골라야 합니다"를 덧붙인다. **ingest 중 `mark()`를 부를지는 계약 결정 [G9]** |

- 보장 문구 금지: "나가도 안전합니다" · "자동으로 지켜집니다". `beforeunload`는 사용자 활성화가 없거나 bfcache/모바일이면 뜨지 않을 수 있다(SPEC-4 한계 승계).
- 경고 1회: 편집기 리스너와 모듈 리스너가 함께 있어도 브라우저 경고는 1번이다(C5 I8 r0.1). 앱은 두 번째 경고를 만들지 않는다.

## 8. 버튼 ↔ 계약 method (1:1)

### 8.1 표

| 화면 | 버튼 | method | 쓰기 | 1:1 여부 |
|---|---|---|---|---|
| 편집기 · `/projects` | "저장 확인" | `confirm(projectId)` | 있음/0 | 편집기 밖 1:1. **마운트 중에는 dirty 편집이 `latest`에 없어 `publish` 선행이 필요 → 1:2 [G6]** |
| 편집기 | ★"다시 저장"(failed) | 기존 `save.retry` → 장부 `save(token, seq)`(C5 2.5 경유) | 있음 | 1:1(기존 동작 유지) |
| `/profile`·`/projects`·편집기 | "시작 다시 시도" | `retryStart(projectId)` | 있음 | 1:1 |
| 같음 | "지금 문서 유지" | **없음** — C5 4.3 "`start` 비움" | 0 | **[G3]** |
| 편집기(충돌) | "내 초안으로 저장" | **없음** — I3b "새 head 위에 명시 저장" | 있음 | **[G2]** 제안: 장부 경유 `resolveConflict("mine")` |
| 편집기(충돌) | "바뀐 문서 쓰기" | `discard`? — conflicted에서의 효과가 미정 | 0 또는 스냅샷 | **[G4]** 제안: 장부 경유 `resolveConflict("theirs")` |
| `/projects`·편집기 | "확인되지 않은 변경 버리기"·"버리고 새로고침" | `discard(projectId)`(+ reload) | 0 | 1:1(+ 브라우저 동작) |
| `/projects` | "편집기 열기"·"편집기에서 고르기" | 라우팅(→ `acquire`는 편집기 effect) | 0 | method 아님 |
| 편집기 | "이미지 다시 고르기" | 포커스 이동만(그 뒤 일반 편집) | 0 | method 아님 · 슬롯 식별 [G7] |

### 8.2 수동 저장 문구 점검

화면에 일반 "저장" 버튼은 없다 [L1]. 이 문서의 버튼 중 "저장"이 들어간 것은 "저장 확인"·"다시 저장"·"내 초안으로 저장" 세 개뿐이며, 모두 위 표의 method에 묶인다. "저장하려면 …하세요" 형태의 안내는 이 세 버튼 이름만 가리킨다.

## 9. 배치 — 1280 / 1024 / 390

기준점은 기존 `layoutMode.ts`다 [L1]: wide `min-width: 80rem`(1280, 3단) · split `min-width: 64rem`(1024, 2단) · 그 미만 tabs(390). 새 브레이크포인트·토큰은 0이다.

| 요소 | 1280 wide | 1024 split | 390 tabs |
|---|---|---|---|
| 상태 글자 + 버튼("저장 확인"/"다시 저장") | 툴바 h1 옆(기존 `SaveStatus`) | 같음 | h1 아래 `subline` 줄(기존) [L1 `StudioToolbar.tsx:22,40,42`]. 상태 글자는 자르지 않고 줄바꿈(E-S33) |
| 충돌 · start-pending Callout | 캔버스 열 위(기존 `ConflictCallout` 자리) | 같음 | **탭과 무관하게 탭 목록 위**에 고정 — 어느 탭에 있어도 선택이 보여야 함. 기존은 캔버스 위라 "편집"/"검사" 탭에서 안 보일 수 있다 [L3 — 실화면 확인 필요] |
| Callout 버튼 2개 | 가로 나란히 | 가로 나란히 | 세로 쌓기, 각 `fullWidth`, 결과 1줄은 각 버튼 바로 아래 |
| 편집 알림(status) | 기존 1곳 | 기존 1곳 | 탭 목록 아래(기존) |
| `/projects` 행 | 폭 분기 없음 [L1 `ProjectRow.tsx:37-72`]: 2줄째 상태 글자 자리에 미확인 문구, 3줄째 행동 맨 앞에 상태별 주 버튼("저장 확인"/"시작 다시 시도"/"편집기에서 고르기") | 같음 | 같음(`flex-wrap`) |
| 확인 대화상자 | 기존 `<dialog>` | 같음 | 같음 — 버튼 세로 쌓기, "취소"를 위쪽에 둔다 |

## 10. 키보드 · 스크린리더 수용 기준 (구현 레인 검증 기준 — UX5-AC)

| ID | 기준 |
|---|---|
| UX5-AC-01 | 상태 전환 알림은 진입 때 1회만이다. 연속 실패와 레이아웃 재마운트로는 다시 알리지 않는다. alert는 `SaveStatus` 1곳, status는 편집 알림 1곳이다(E-AC-33 유지). |
| UX5-AC-02 | 상대 시각("· N초 전")은 라이브 영역 밖에 둔다(기존 B-14). |
| UX5-AC-03 | 충돌 Callout의 두 버튼은 Tab 순서 = 시각 순서 = 주→보조다. 각 버튼은 결과 1줄을 `aria-describedby`로 읽는다. |
| UX5-AC-04 | 충돌 진입(마운트 중)에서 포커스는 이동하지 않는다. seed `conflicted` 재마운트에서는 충돌 영역 제목으로 이동한다. |
| UX5-AC-05 | 선택 성공 뒤 포커스는 편집기 h1, 실패 뒤에는 누른 버튼이다. 포커스가 `body`로 떨어지지 않는다. |
| UX5-AC-06 | 확인 대화상자: 열면 "취소"에 포커스, Esc = 취소, Tab은 대화상자 안에서 순환(`showModal`), 닫히면 연 버튼으로 복귀한다. 연 버튼이 사라졌으면 그 영역 제목이나 h1로 간다. |
| UX5-AC-07 | 진행 중에는 `aria-busy` + `aria-disabled`로 표시하고, Enter·Space 연타는 요청 1회만 만든다. `disabled`는 쓰지 않는다(포커스 유지). |
| UX5-AC-08 | `/projects` 행 "저장 확인" 성공 뒤 포커스는 그 행 "편집기 열기"(SPEC-4 승계)로 간다. 실패면 포커스를 유지하고 alert를 낸다. |
| UX5-AC-09 | memory 모드에서 "저장 확인" 버튼이 DOM에 없고, 어떤 경로에서도 "브라우저에 저장됨" 문구가 나오지 않는다. |
| UX5-AC-10 | `newer` 확인 결과 뒤 상태 글자는 "저장됨"이 아니고 status 알림도 0이다. |
| UX5-AC-11 | `start-pending` 동안 "저장 확인"이 DOM에 없고, "시작 다시 시도"만 있다. |
| UX5-AC-12 | 390 폭에서 충돌·start-pending Callout은 어느 탭에서도 보인다. 버튼 터치 영역은 기존 `Button sm` 최소 높이 토큰 이상이다. |
| UX5-AC-13 | 단축키를 새로 만들지 않는다(⌘S 가로채기 0). |
| UX5-AC-14 | 문구 금지 목록(2.4) 문자열이 앱 소스에 0건이다(가드 테스트 후보). |

**실화면 검증은 0이다.** 위 기준은 구현 뒤 ego-browser(build + preview) 실측 대상이다.

## 11. 상태별 흐름 요약 (텍스트 다이어그램)

```
편집 ─mark→ dirty ─(2s)publish/save→ saving ─oncomplete→ (newer? 그 세대 표시 : 영구 확인)
                                         └reject→ failed{reason} → 사유별 2.3 행
POP/링크 이탈 ─release(last)→ 장부 latest 유지 → /projects 행 unconfirmed → [저장 확인] → confirm
profile restart/create 실패 → start-pending → [시작 다시 시도] retryStart → replace → (latest? conflicted : 교체)
replace + latest → conflicted → 편집기 → [내 초안으로 저장 | 바뀐 문서 쓰기] (G2·G4)
```

## 12. 미검증 계약 의존 (C5 r0.1/r0.1a 미재검토)

| UX-5 절 | 의존하는 C5 항목 | 상태 |
|---|---|---|
| 2.1 dirty·unconfirmed 판정 | I8 `dirtyMark`/`publishedMark`(r0.1a) | 미재검토 |
| 3 조건 2·3 | 4.2-6 `newer` · I8 | `newer`는 r0, `dirtyMark`는 r0.1 미재검토 |
| 5 전체 | I3b·4.4 `conflicted`·`epoch`(r0.1) · seed phase `conflicted` | 미재검토 |
| 6.1 | 2.3 `LedgerSeed` · 4.5 StrictMode effect 한정(r0.1a) | 미재검토 · 예산 미측정 |
| 7 POP 행 | 4.5 cleanup publish | r0 — Codex a1 범위였으나 r0.1 반영 이후 재검토 0 |
| 2.3 image-missing | I4 · I5b(r0.1) · 4.6 | 미재검토 |
| 4 | I7 · 4.3 | r0 |

## 13. 계약 gap · 결정 질문 (계약 수정 0 — 제안만)

| ID | 공백 | UX 영향 | 제안(회수 대상) |
|---|---|---|---|
| G1 | `view()`의 `LedgerView` 필드 미정의. 전 장부 순회도 없음 | 상태표 전체의 판정 조건, 6.3 다른 프로젝트 개수 | `LedgerView = { phase(2.1 장부 단계), env, lastResult, dirty: boolean, start?, conflicted?: {theirsRevision, cause?} }` + `views(): readonly LedgerView[]` |
| G2 | "내 초안 유지" method 없음(I3b 문장만) · `confirm`은 conflicted면 거절 | 충돌 주 버튼 | `resolve(projectId, "mine")` = 장부 경유 `resolveConflict("mine", latest.doc)` + binding 이미지(I4) |
| G3 | 재판정 "지금 문서 유지"(`start` 비움) method 없음 | start-pending 보조 버튼 | `keepCurrent(projectId)` 또는 `retryStart`의 반대 `dropStart(projectId)` — 쓰기 0, `start` 비움, I8 재계산 |
| G4 | conflicted 상태 `discard`의 효과(conflicted 해제·binding·phase·보존 여부) 미정 | 충돌 보조 버튼의 파괴성 | `resolve(projectId, "theirs")` = `resolveConflict("theirs")`(초안 스냅샷 보존) 후 `latest` 비움. `discard`는 conflicted에서 쓰지 않음 |
| G5 | `unsupported` vs `memory-only` 구별 필드 없음(C5 9절 인정) | 문구 분기 | `mode()` 결과를 `LedgerView.env`로 노출 |
| G6 | 마운트 중 "저장 확인"은 dirty 편집이 `latest`에 없어 `target = memSeq` → **거짓 확인 가능** | "저장 확인" 1:1 위반 | `confirm(projectId, { flush: token })` — 활성 lease가 있으면 publish 후 confirm을 장부 안에서 1회. 또는 마운트 중엔 "저장 확인"을 숨기고 "다시 저장"만(★ UX-5 기본값) |
| G7 | `image-missing`의 `missing`은 `localId`만 있고 슬롯 라벨 매핑이 없음 | "어느 이미지" 안내 불가 | 결과에 `{ localId, sectionId, slotKey }` 또는 문서에서 역추적하는 순수 함수 |
| G8 | replace 원인(restart·스냅샷 복원·다른 탭) 필드 없음 | 충돌 제목 꼬리 | `conflicted.cause` |
| G9 | ingest 중 이탈은 장부가 모름(C5 4.6-5) | 7절 ingest 행 | ingest 시작 시 `mark()` 호출을 계약에 넣을지 결정(보호만, 데이터 보존은 아님) |
| G10 | `start` 있는 동안 편집기 자동 저장(`save`)이 허용되는지 C5에 없음(I7은 `confirm`만 막음) | start-pending 중 편집기 진입 허용 여부 | `save`도 `failed{start-pending}` 쓰기 0으로 막거나, 편집기 진입을 막는다(★ UX-5는 후자 — 행 링크 숨김. 단 POP 재진입은 못 막으므로 편집기 안 Callout 필요) |

**결정 질문(MQ-5)** — ★ = 권장

| ID | 질문 | ★권장 | 대안 |
|---|---|---|---|
| MQ-5-1 | 충돌 두 선택의 보존 | ★A 양쪽 모두 기존 `resolveConflict` 의미(진 쪽 스냅샷 "충돌 보존")를 장부 경유로(G2·G4) | B "바뀐 문서 쓰기" = `discard`(보존 0, 확인 대화상자 필수) |
| MQ-5-2 | 충돌 버튼 라벨 | ★A 기존 E-S09 라벨 유지("내 편집으로 저장"·"다른 편집 불러오기") — 한 앱 두 라벨 0 | B UX-5 라벨("내 초안으로 저장"·"바뀐 문서 쓰기") — seed 재진입에서 "초안"이 더 정확 |
| MQ-5-3 | 마운트 중 "저장 확인" | ★A dirty가 아닐 때만 노출(seed `unconfirmed`·환경 실패 뒤), dirty면 숨기고 자동 저장·"다시 저장"에 맡김(G6 회피, 계약 변경 0). 클릭과 편집이 겹치면 `newer` 규칙(3절)이 거짓 "저장됨"을 막는다 [C5 의존] | B `confirm` flush 옵션 추가(G6) |
| MQ-5-5 | seed `conflicted` 재진입 때 편집 잠금 | ★A 미리보기 + 입력 `aria-disabled`(C5 4.4 문면) | B 편집 허용 + 자동 저장만 0(편집이 쌓여 선택의 파괴 범위가 커짐) |
| MQ-5-4 | 390 충돌 Callout 위치 | ★A 탭 목록 위 고정 | B 캔버스 위 유지 + 탭 배지 |

## 14. 기존 문서와 다르게 한 곳 (UX5-D#)

| ID | 기존 | UX-5 | 사유 |
|---|---|---|---|
| D1 | SPEC-3 5.2·SPEC-4 "저장 다시 시도"(`startDoc` 재생) | "시작 다시 시도"(`retryStart`) | 확인과 시작 재시도 분리(C5 I7) — 라벨에서 "저장"을 뺀다 |
| D2 | SPEC-4 "저장 확인" = `deleteSnapshot(p,"")` | 같은 라벨 → `confirm()` | C5 9절 ⑥ 폐기 |
| D3 | SPEC-4 폐기 = 탭 안 모든 미확인 기억 | 프로젝트 단위 + 다른 프로젝트 고지 | C5 `discard(projectId)` |
| D4 | E-S09 충돌은 `STALE_DOC`만 | `conflicted`(편집기 밖 교체)도 같은 영역 | C5 I3b |
| D5 | SPEC-4 CP4 인계 = `PendingDraft` | seed phase(`unconfirmed`·`conflicted`) | C5 2.3 |

## 변경 이력
- r0 (2026-10-14) — 최초 초안 + 자체 review 1회 반영(seed `conflicted` 편집 잠금을 C5 4.4 문면에 맞춤 · 편집기 "저장 확인" 노출 조건 · start-pending 행 링크 숨김 근거와 G10 · MQ-5-5). Codex 0회(QA 소유).
