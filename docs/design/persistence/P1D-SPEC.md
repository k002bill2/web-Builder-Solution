# P1D-SPEC — 스냅샷 보존·삭제 · 프로젝트 삭제 · 단조 카운터 (문구·상태 명세)

- 작성 Designer(P1D-SPEC 레인, base `b8660aa`) · 2026-10-08. 결정 정본(다시 묻지 않음): ADR-007 1절 **P3 A**(수동 스냅샷 삭제(확인) · 자동 스냅샷 프로젝트당 최근 20개 · 단조 카운터 id) · **P8 A**(프로젝트 삭제 — 확인 · 문서·스냅샷·이미지·프로필 계열 함께 · 되돌리기 없음 · 단조 카운터) · 3절 카운터 · 5절 P1d 행("삭제 뒤 id 재발급 0 테스트") · 개정 2·보충 · P1c 완료 기록. 재사용: `P1C-SPEC.md` 0절 원칙·1.6 지우기 흐름·대화상자 계약 · `THREATS.md` T3·T5.
- 예산(ADR-004 개정 12 · P1c 완료 기록): `/studio` 129.62 / 130(판정선 129.65 — **여유 0.03**) · 복원 진입 132.65 · **`/profile` 99.87 / 100** · `/projects` 104.47 / 125 · `/compare` 122.73 / 125.
- 근거 표기: [L1] 코드·문서 직접 확인(이 레인 grep·읽기) · [추정] 측정 없음 · [확인 필요] 구현 레인이 실측.
- 브랜드: 기존 `Button`(primary·outline·assistive)·네이티브 `dialog`·토큰만. 위험 variant·새 아이콘(`trash` 파일 없음 [L1 2a-05 SPEC 39행])·새 토큰·새 의존성 0. 목업 브랜드 명칭·`--apfs-*` 0.
- 결정 필요 항목은 `P1D-MQ.md`(MQ-D1·MQ-D2). 이 SPEC은 ★안으로 쓴다.

## 0. 코드로 확정한 사실 (설계 전제)

| # | 사실 [L1] | 설계 영향 |
|---|---|---|
| F1 | 스냅샷은 `snapshots` 저장소가 아니라 **문서 레코드 `docs/<projectId>` = `{ doc, snapshots }` 안**에 있다(`localSync.ts` write · `entryRead.ts` DocRecord). `snapshots` 저장소는 만들어만 두고 비어 있다(`envelope.ts:8`) | 스냅샷 삭제·정리 = 문서 레코드 다시 쓰기 1회. 프로젝트 삭제 = `docs/<id>` 1건 삭제로 스냅샷까지 끝 |
| F2 | 이미지 키 = `projectId/localId`(`imageRecord.ts:4`) · 문서 flush 때 `imageOps`가 **`recordRefs`(문서 ∪ 저장 스냅샷) 밖 id를 같은 트랜잭션에서 delete**(`imageOps.ts:29`) | 스냅샷이 빠진 문서 레코드를 flush하면 그 스냅샷에만 있던 이미지가 **새 코드 0으로** 함께 정리된다 |
| F3 | 순번 id 4종이 "개수 + 1": `profile-${series.size+1}`(`studioStore.ts:106`, 모든 라우트 진입) · `project-${projects.length+1}`(`memoryBoardConfirm.ts:142`, `/compare` 조작 뒤) · `job-${jobCount+1}`(`memoryGenerationRepository.ts:92`, **`/profile` 진입 자동**) · `snapshot-${list.length+1}`(`memoryDocBook.ts:112·205·354`, 조작 뒤) · `export-${size+1}`(탭 메모리, 영속 0) | 삭제가 생기면 **재발급**보다 나쁜 **살아 있는 id와 겹침**이 난다 — 수동 3개 중 2번 삭제 → 다음 `snapshot-3` 겹침 · 계열 삭제 → `profile-N`이 살아 있는 계열과 겹쳐 `insert` throw(확정 실패) · `project-N` 겹침 → `putProject`가 남의 프로젝트를 덮음 · `job-N` 겹침 → 다른 계열 잡을 덮음 |
| F4 | `putProject` 호출처 = `memoryBoardConfirm.ts:141`(새 계열일 때만, 같은 트랜잭션) · `memoryProjectRepository.ts:120`(이름 바꾸기). 재확정은 같은 계열에 버전만 추가 | **프로필 계열 ↔ 프로젝트 = 1:1, 공유 없음** → 프로젝트 삭제 = 그 계열(모든 버전)·잡·확정 기록 함께 삭제가 안전(다른 프로젝트 영향 0) |
| F5 | 상태 레코드 `studio/state` = StudioState(series·commits·adjustCommits·jobs·projects) + `heads` + `gen`. 진입은 이 레코드와 진입 문서 1건만 읽는다(`entryRead.ts` readEntry) — `meta`는 진입에서 읽지 않는다. 확정·생성은 동기 `transact` 안에서 id를 정한다 | 카운터를 `meta`에 두면 동기 판정 전에 비동기 읽기가 필요 → **상태 레코드 안에 둔다**(3절, `gen`과 같은 방식) |
| F6 | 쓰기 잠금 `design-studio-writer`는 **전역 1개**(프로젝트 단위 아님) · 지우기 흐름이 이미 "이 탭이 쓰기 탭이면 진행 / 아니면 tryLock / 못 잡으면 busy"(`clearBrowserData.ts` 머리 주석) · 다른 탭 안전은 세대 번호 최신성 확인(개정 2 보충) | 프로젝트 삭제 차단 조건 = "**다른 탭이 쓰기 탭**"(그 프로젝트인지 무관). 새 잠금·새 메시지 종류 0 |
| F7 | 진입 closure: `studioStore`·`deferredStudio` = 모든 store 라우트 진입 · `memoryProjectRepository` = `/studio`·`/projects` 진입(`check-bundle-size.mjs:50`) · `memoryGenerationRepository` = `/profile` 진입(`:111`) · `memoryDocBook`·`memoryBoardConfirm`·`memoryGenerate` = 조작 뒤 | 진입 파일 변경은 **위임 한 줄·삭제만**, 본체는 조작 뒤 모듈 — 실측 관문(4절) |

## 1. 화면 상태표

### 1.1 스냅샷 대화상자 (편집기 툴바 "스냅샷" — 조작 뒤 청크 `SnapshotDialog`)

| ID | 상태 | 표시·동작 | 알림·포커스 |
|---|---|---|---|
| D-S01 | 목록(기존) + 보관 안내 | 목록(`ul` "스냅샷 목록") **바로 위** 캡션 1줄(`ds-caption1 text-label-alternative`, 기존 `CAPTION`): **"자동 스냅샷은 최근 20개만 보관합니다 — 오래 남기려면 '지금 상태 저장'으로 만드세요"**. 목록이 비어도 표시(정책 고지) | 낭독 0(정적 글자) |
| D-S02 | 수동 줄 | 기존 "미리보기" 옆 `Button variant="outline" size="sm"` **"삭제"** · `aria-label` = **"{이름} 삭제"**(기존 "{이름} 미리보기" 문형) | — |
| D-S03 | 자동 줄 · 게시(2a-05b) 줄 | **삭제 버튼 없음**. 자동 = 안전망(내보내기·복원·충돌·새로 시작 직전 사본)이라 자동 정리(1.2)만 · 게시 = 발행 이력(2a-05b 범위) | — |
| D-S04 | 삭제 확인 대화상자 | **두 번째 네이티브 `dialog`를 `showModal()`로 스냅샷 대화상자 위에 쌓는다**. h2 = 접근 이름 **"스냅샷을 지울까요?"** · 본문 **"'{이름}'({kindText} · {시:분})을 지웁니다. 되돌릴 수 없습니다."** · 캡션 **"이 스냅샷에만 있던 이미지도 함께 지워집니다."** · 버튼 **취소**(outline) · **지우기**(primary — 위험 variant 없음, 라벨로 구분) | 열 때 포커스 = **취소** · Esc = 이 확인 대화상자만 닫음(아래 스냅샷 대화상자는 열린 채) · 바깥 클릭 닫기 0 |
| D-S05 | 지우는 중 | "지우기" `aria-disabled` + 라벨 **"지우는 중…"** · 연타 무시(ref) · Esc 무시 | — |
| D-S06 | 성공 | ① 확인 `dialog.close()` **먼저**(P1c D4 교훈 — 열린 modal 밖은 inert라 언마운트 전 focus 무시) → ② 목록 다시 읽기 + `refresh()`(참조 집합 `held` 갱신 — 탭 메모리 이미지 해제 규칙 5.9) → ③ 포커스 = **같은 자리의 다음 줄 첫 버튼("미리보기")**, 없으면 이전 줄, 목록이 비면 **이름 입력** | `onNotice` **"스냅샷 '{이름}'를 지웠습니다"**(기존 "…를 저장했습니다" 문형 · 편집 알림 1개 계약 E-AC-33) |
| D-S07 | 실패 | 확인 대화상자 유지 · 안 `role=alert` **"지우지 못했습니다 — 다시 시도하세요"**(시도마다 새로 낭독 — `ClearDataDialog` key 패턴) · 버튼 복귀 | alert 1회 |
| D-S08 | 취소 | `close()` 먼저 → 포커스 = 그 줄 **"삭제"** 버튼 | — |
| D-S09 | 읽기 전용·낡은 탭·지워진 탭(P1c 1.5) | 메모리에서는 지워지고 저장은 기존 INFRA 경로(SaveStatus "저장하지 못했습니다" + "다시 저장", alert 1회) — `createSnapshot`과 같은 의미론. 확인 대화상자에는 D-S07 문장 | 저장소 레코드는 그대로 → 새로고침하면 다시 보인다(쓰기 0이 안전 쪽) |
| D-S10 | 강등(memory) | 같은 UI · 메모리에서만 지움(원래 새로고침하면 전부 사라짐) | — |

- 삭제 판정(조작 뒤 `memoryDocBook`): `deleteSnapshot(projectId, snapshotId)` — 대상이 `manual`이 아니면 `SCHEMA_INVALID`(UI가 버튼을 안 주므로 방어) · **없는 id = 변화 0으로 성공 + flush 재제출**(재시도 멱등 — 앞 시도가 메모리만 지우고 IDB 실패한 경우 기록을 다시 낸다, localSync `queue.retry` 경로). 미리보기는 스냅샷 대화상자를 닫고 열리므로 "미리보기 중인 스냅샷 삭제" 경로 없음 [L1 `SnapshotLayer.tsx:40`].
- "이전 스냅샷 N개 더 보기"(최신 10개 밖) 줄에도 같은 버튼. 지운 뒤 `older` 수는 다시 계산.

### 1.2 자동 스냅샷 정리 (화면 없음 — 판정 규칙)

| 항목 | 규칙 |
|---|---|
| 대상 | 프로젝트별 `kind: "auto"` 스냅샷(reason export·restore·conflict·restart 전부). `manual`·`published`는 **대상 아님**(개수 무관) |
| 상한 | 자동 **20개**. 새 자동 스냅샷을 더한 뒤 21개가 되면 **목록 순서(= 생성 순서)상 가장 오래된 자동 1개**를 뺀다 |
| 시점 | 자동 스냅샷을 만드는 **같은 메모리 커밋**(`requestExport`·`restoreSnapshot`·`resolveConflict`·`startDoc restart` 4곳 — 공용 헬퍼 1개로 append+정리) → 그 프로젝트 flush 1회 = **문서 레코드 + 이미지 delete가 한 IDB 트랜잭션**(F2). 메모리에서 정리됐는데 IDB에만 남는 상태 0 |
| 복원 예외 | 복원(`restoreSnapshot`)으로 "복원 전" 자동이 21번째가 될 때 가장 오래된 자동이 **지금 복원한 그 스냅샷**이면 건너뛰고 그다음 오래된 자동을 뺀다(방금 쓴 원본이 사라지는 혼란 방지) |
| 이미지 | 뺀 스냅샷에만 있던 로컬 id = 참조 집합 밖 → IDB `images`에서 같은 트랜잭션 delete(F2) · 탭 메모리는 다음 `refresh()`(목록 읽기)로 5.9 해제 |
| 기존 데이터 이행 | 이미 20개를 넘은 프로젝트(P1c까지 상한 없음): **다음 자동 스냅샷 생성 때 한 번에 20개로 줄인다**(열 때 정리하지 않음 — 읽기만으로 쓰기 0 원칙, entryRead·localSync 열기 쓰기 0 유지) |
| 알림 | 없음(D-S01 안내가 정책 고지 — 매번 낭독하지 않는다) |

### 1.3 `/projects` 프로젝트 삭제 (J-S12~J-S17 신설 — 2a-05 J-S 번호 이어서)

| ID | 상태 | 표시·동작 | 알림·포커스 |
|---|---|---|---|
| J-S12 | 줄 행동 | 기존 줄 행동 맨 뒤(이름 바꾸기 다음) `Button variant="outline" size="sm"` **"삭제"** · `aria-label` **"{이름} 삭제"** · `data-delete-for={projectId}`(포커스 복귀용, `data-rename-for` 패턴). **local일 때만** 보인다(1.5) · 이름 바꾸는 중인 줄에도 보임(누르면 이름 초안 취소) | — |
| J-S13 | 확인 대화상자 | 네이티브 `dialog` + `showModal()` · h2 **"'{이름}' 프로젝트를 지울까요?"** · 본문 **"이 브라우저에서 아래 항목을 함께 지웁니다. 되돌릴 수 없습니다."** · 목록(ul): **"편집 문서와 스냅샷"**(문서 없으면 이 줄 생략) · **"문서에 넣은 이미지"** · **"확정한 프로필(모든 버전)과 만든 3안"** · 캡션 **"다른 프로젝트와 내려받은 파일은 그대로 남습니다. 지운 뒤 이 화면을 새로 불러오므로 비교 보드와 보관함도 비워집니다."**(MQ-D1 ★A) · 버튼 **취소**(outline) · **프로젝트 지우기**(primary) | 열 때 포커스 = **취소** · Esc = 취소 · 바깥 클릭 닫기 0 |
| J-S14 | 지우는 중 | "프로젝트 지우기" `aria-disabled` + **"지우는 중…"** · Esc 무시 | — |
| J-S15 | 차단·실패 | 대화상자 유지 · `role=alert`: 다른 탭이 쓰기 탭 = **"다른 탭에서 편집 중이라 지우지 못했습니다 — 그 탭을 닫은 뒤 다시 시도하세요"**(지우기와 같은 문장 — 상수 재사용) · 저장 데이터 읽기 불가(봉투 mismatch·invalid) = **"저장된 데이터를 읽지 못해 지우지 못했습니다 — '이 브라우저 데이터 지우기'로 비울 수 있습니다"** · 트랜잭션 실패 = **"지우지 못했습니다 — 다시 시도하세요"** | alert 시도마다 1회 |
| J-S16 | 성공 | `sessionStorage` 1회 키 `design-studio-deleted` = 이름 → **`/projects` 새로고침 이동**(MQ-D1 ★A — 메모리 store를 버려 남은 메모리가 지운 것을 다시 쓰지 않게, P1c 1.6 4단계와 같은 이유) | 새로고침 뒤 기존 "프로젝트 알림" `role=status` **"'{이름}' 프로젝트를 지웠습니다"** 1회(키 삭제) · 포커스 = h1 "프로젝트"(`tabIndex=-1`, 이 키가 있을 때만 — 지운 줄이 없어 복귀 대상이 없음) |
| J-S17 | 이미 지워짐 | IDB에 그 프로젝트가 없음(다른 탭이 먼저 지움·지우기) | 성공과 같게 새로고침 이동 · 알림 같은 문장(사용자 의도 달성) |
| — | 취소 | `close()` 먼저 → 포커스 = 그 줄 **"삭제"**(`data-delete-for`) | — |

**삭제 범위**(F1·F4 — 한 IDB 트랜잭션 `studio`·`docs`·`images`·`meta` readwrite):
1. `studio/state` 읽기 → 봉투 확인(mismatch·invalid → J-S15 읽기 불가, 쓰기 0).
2. 대상 프로젝트 `P`(없으면 J-S17)와 계열 `F = P.profileId` 기준으로 새 상태: `projects` − P · `heads` − P · `series` − F · `adjustCommits` − F · `commits` 중 `profileId === F` 제거 · `jobs` 중 `job.profileId === F` 제거 · **`seq` 갱신**(3절 — 지운 project·profile·job 번호의 최대값을 반영) · `gen` = meta generation + 1.
3. put `studio/state` · put `meta/generation`(같은 값) · delete `docs/P.projectId` · delete `images` 중 키가 **`${P.projectId}/`로 시작**하는 것 전부(슬래시 포함 접두 — `project-1` 삭제가 `project-10/…`를 건드리지 않음).
4. 커밋 확인 뒤 BroadcastChannel 기존 `{ type: "saved" }` 전송(다른 `/projects` 탭 "다른 탭에서 저장한 변경이 있습니다" — P1c 1.5) → J-S16.
- **잠금**(F6, `clearBrowserData` 그대로): 이 탭이 쓰기 탭이면 보유 잠금 안에서 · 아니면 `tryLock` · 못 잡으면 J-S15 busy. 진행 전 이 탭 싱크 멈춤(`own.stop()` — 새로고침까지 쓰기 0). `navigator.locks` 없음 = 잠금 없이 진행(어느 탭도 쓰지 않음 — 개정 2 보충).
- **다른 탭 안전**: 쓰기 탭이 아닌 다른 탭(그 프로젝트 편집기를 열어만 둔 탭 포함)은 세대가 바뀌어 첫 쓰기 때 최신성 확인 실패 → 낡은 탭(P1c 1.5) — 지운 프로젝트 부활 0. 새로고침하면 `/studio/<지운 id>` = E-S02 "이 브라우저에 저장된 프로젝트만 열 수 있습니다", `/profile/<지운 계열>` = P-S02(기존 문구, 변경 0).
- 메모리 비교 보드(영속 범위 밖)가 지운 계열을 `confirmed`로 쥔 다른 탭: 그 탭은 낡은 탭이라 재확정 쓰기 0 — 새로고침하면 빈 보드.

### 1.4 단조 카운터 — 3절

### 1.5 저장소 불가·강등(memory)에서 삭제

| 상태 | 스냅샷 삭제(1.1) | 자동 정리(1.2) | 프로젝트 삭제(1.3) |
|---|---|---|---|
| local 정상 | 됨(IDB 반영) | 됨 | 됨 |
| local 읽기 전용·낡음·지워짐 | 메모리만 · 저장 INFRA(D-S09) | 메모리만(쓰기 0) | J-S15 busy(다른 탭 쓰기) 또는 진행(이 탭 판정은 IDB를 직접 읽으므로 낡은 메모리와 무관) |
| memory(IndexedDB 없음·열기 실패·버전 불일치·깨진 봉투) | 메모리만(D-S10) | 메모리만 | **"삭제" 버튼 숨김** — 디스크에 남은 것이 없어(T3 사유 없음) 새로고침이 곧 전체 삭제. 강등 사유는 기존 저장소 영역 문장(P1c 1.7). 버전 불일치·깨진 봉투로 IDB에 레코드가 남은 경우의 정리 수단 = "이 브라우저 데이터 지우기"(기존) |

### 1.6 접근성 요약

- 대화상자 3종 모두: 네이티브 `dialog` + `showModal()` · `aria-labelledby` = h2 · 열 때 포커스 = 취소 · 바깥 클릭 닫기 0 · 진행 중 Esc 무시 · **닫을 때 `dialog.close()` 먼저, 그다음 상태 변경·포커스 이동**(P1c D4 · `SnapshotDialog.tsx` close 주석 B-ER-10).
- 중첩(D-S04): 확인 대화상자의 `onCancel`은 `preventDefault()` 후 자기만 닫는다 — Esc 한 번에 두 대화상자가 닫히지 않는다(top layer 맨 위만 cancel 이벤트를 받음 [L3] + AC로 확인).
- 포커스 복귀: 취소 = 여는 "삭제" 버튼 · 스냅샷 성공 = 다음 줄 → 이전 줄 → 이름 입력 · 프로젝트 성공 = 새로고침 뒤 h1.
- 알림: 스냅샷 = 편집기 `onNotice`(새 라이브 영역 0) · 프로젝트 = 기존 "프로젝트 알림" status · 실패 = 대화상자 안 `role=alert`. 저장소 영역 status(P1c 2절)와 겹치지 않게 프로젝트 삭제 결과는 "프로젝트 알림"에만.
- 조작 크기: `size="sm"` 버튼 기존과 같음(≥24, 2.5.8). 줄당 버튼 4개 — 390 폭에서 `flex-wrap`(기존 줄 행동 컨테이너) 그대로.

## 2. 문구 일람 (새 문자열 — 전부 조작 뒤 청크 또는 `/projects`)

| 키 | 문구 | 위치 |
|---|---|---|
| SN-1 | 자동 스냅샷은 최근 20개만 보관합니다 — 오래 남기려면 '지금 상태 저장'으로 만드세요 | SnapshotDialog 캡션 |
| SN-2 | 삭제 / {이름} 삭제 | 수동 줄 버튼 / aria-label |
| SN-3 | 스냅샷을 지울까요? | 확인 h2 |
| SN-4 | '{이름}'({종류} · {시:분})을 지웁니다. 되돌릴 수 없습니다. | 확인 본문 |
| SN-5 | 이 스냅샷에만 있던 이미지도 함께 지워집니다. | 확인 캡션 |
| SN-6 | 취소 / 지우기 / 지우는 중… | 확인 버튼 |
| SN-7 | 지우지 못했습니다 — 다시 시도하세요 | 확인 alert(ClearDataDialog `FAIL_TEXT`와 같은 문장) |
| SN-8 | 스냅샷 '{이름}'를 지웠습니다 | 편집 알림 |
| PJ-1 | 삭제 / {이름} 삭제 | 줄 버튼 / aria-label |
| PJ-2 | '{이름}' 프로젝트를 지울까요? | 확인 h2 |
| PJ-3 | 이 브라우저에서 아래 항목을 함께 지웁니다. 되돌릴 수 없습니다. | 확인 본문 |
| PJ-4 | 편집 문서와 스냅샷 · 문서에 넣은 이미지 · 확정한 프로필(모든 버전)과 만든 3안 | 확인 목록 |
| PJ-5 | 다른 프로젝트와 내려받은 파일은 그대로 남습니다. 지운 뒤 이 화면을 새로 불러오므로 비교 보드와 보관함도 비워집니다. | 확인 캡션 |
| PJ-6 | 취소 / 프로젝트 지우기 / 지우는 중… | 확인 버튼 |
| PJ-7 | 다른 탭에서 편집 중이라 지우지 못했습니다 — 그 탭을 닫은 뒤 다시 시도하세요 | alert(기존 `BUSY_TEXT` 재사용) |
| PJ-8 | 저장된 데이터를 읽지 못해 지우지 못했습니다 — '이 브라우저 데이터 지우기'로 비울 수 있습니다 | alert |
| PJ-9 | 지우지 못했습니다 — 다시 시도하세요 | alert(기존 `FAIL_TEXT`) |
| PJ-10 | '{이름}' 프로젝트를 지웠습니다 | 프로젝트 알림(새로고침 뒤 1회) |
| ST-1 | (P1c 1.7 할당량 문장 뒷부분 교체) 저장 공간이 부족하면 저장이 실패합니다 — 쓰지 않는 프로젝트나 스냅샷을 지우세요 | 저장소 영역 — P1c 문장 "…이미지나 스냅샷을 지우세요"가 P1d로 참이 됨. **글자 교체만**, 선택(구현 레인 판단 · `/projects` 여유 큼) |

- 조사: "{이름}를"은 기존 "스냅샷 '{이름}'를 저장했습니다"(`SnapshotLayer.tsx:36`)와 맞춘다(받침 분기 0 — 기존 관례).

## 3. 단조 카운터 (ADR-007 3절 · 사실 4 · P1d 행)

| 대상 | 지금 [L1] | 새 규칙 | 저장 위치 | 발급 위치(청크) |
|---|---|---|---|---|
| project | `project-${projects.length+1}` | `project-${max(현존 최대 번호, seq.project) + 1}` | 상태 레코드 `seq.project` | `memoryBoardConfirm`(조작 뒤) |
| profile | `profile-${series.size+1}`(`studioStore` tx.nextProfileId) | `profile-${max(현존 최대, seq.profile) + 1}` — **`nextProfileId`를 `studioStore`에서 빼고** `memoryBoardConfirm`에서 계산 | 상태 레코드 `seq.profile` | `memoryBoardConfirm`(조작 뒤) — `studioStore` 진입 바이트 감소분이 아래 reader 1줄을 상쇄(실측 관문) |
| job | `job-${jobCount+1}`(`memoryGenerationRepository` — `/profile` 진입) | `job-${max(현존 최대, seq.job) + 1}` — 계산을 `memoryGenerate.newJob`(조작 뒤) 안으로 옮기고 진입 파일은 인자만 넘김 | 상태 레코드 `seq.job` | `memoryGenerate`(조작 뒤) |
| snapshot | `snapshot-${list.length+1}`(프로젝트별) | `snapshot-${max(그 프로젝트 현존 최대, snapshotSeq) + 1}` | **문서 레코드 `docs/<id>`의 `snapshotSeq`**(프로젝트별 — 스냅샷과 같은 트랜잭션, 프로젝트 삭제 때 함께 사라짐) | `memoryDocBook`(조작 뒤) |
| image | 키 `projectId/localId` | **카운터 없음** — project id가 재발급되지 않으므로 지운 프로젝트 접두가 다시 쓰일 일 0. 프로젝트 안 localId 재사용은 그 레코드가 참조 집합 밖이라 이미 지워진 뒤라 덮을 대상 없음 · [확인 필요] localId 발급 방식(구현 레인 1회 grep — 무작위면 그대로, 순번이면 "현존 최대 + 1" 확인) | — | — |
| export | `export-${size+1}` | **대상 아님** — 탭 메모리(영속 0)·삭제 없음 | — | — |

- **의미 = "지운 것 중 최대 번호"(묘비 상한)**: 살아 있는 id는 "현존 최대"가 이미 막는다 → 카운터는 **삭제 때만** 올린다(프로젝트 삭제 트랜잭션 = seq.project·profile·job · 스냅샷 삭제·자동 정리 = snapshotSeq). 발급 때 쓰기 0 → `studioStore`에 새 tx 메서드 0(진입 바이트 0 목표).
- **현존 최대 번호** = 같은 접두 id의 `-(\d+)$` 정수 최대(접두가 다른 id·숫자 아닌 꼬리는 무시). 순수 함수 `nextSeqId(prefix, ids, deletedMax)` 1개를 조작 뒤 공용 모듈에 두고 4곳이 쓴다.
- **이행(기존 `length+1` 데이터)**: `seq`·`snapshotSeq` 없음 = 0으로 읽음 → 다음 id = **현존 최대 + 1**(삭제가 없던 데이터라 지금 `length+1`과 같은 값). 이행 쓰기 0 · `SCHEMA_VERSION` 1 유지(필드 추가는 선택 필드 — 옛 앱이 읽어도 무시, 봉투 버전 올리지 않음).
- **`meta` 키**: **새 키 0**. ADR-007 3절 "`meta` — 단조 순번 카운터"는 진입이 `meta`를 읽지 않고(F5) 동기 `transact` 안에서 id를 정해야 해서 **상태 레코드 `seq`**로 둔다(P1C-D2 `gen`과 같은 선례). `meta`는 기존 `generation`·`firstSaveNotice`만. → ADR 3절 문구는 "바뀌는 문서" 행(6절).
- **store 노출**: `StudioState`에 선택 필드 `seq?: { project; profile; job }` — `createStudioStore`는 초기 상태를 그대로 쓰고 `transact`는 `{ ...draft, … }`로 펼쳐 보존 [L1 `studioStore.ts:99·104`] · localSync 직렬화도 `{ ...latest, heads, gen }`로 보존. 읽기는 reader 1개(`seq()`) — `studioStore` 진입 바이트, `nextProfileId` 제거로 상쇄(4절 관문).
- 강등(memory): `seq` 없음 → 현존 최대 + 1. 메모리 모드에서 프로젝트 삭제는 없고(1.5) 스냅샷 삭제는 book 메모리 `snapshotSeq`로 같은 규칙.
- 다중 탭: 쓰기 탭 1개 + 최신성 확인이라 두 탭이 같은 번호를 저장하는 경로 0(낡은 탭은 메모리에서만 발급, 쓰기 0).

## 4. 번들 배치 (진입 몫 0 기본)

| 항목 | 놓는 곳 | 진입 몫 | 근거 |
|---|---|---|---|
| 스냅샷 삭제 버튼·확인 대화상자·SN 문구·포커스 | `SnapshotDialog`(+ 확인 대화상자 같은 파일 또는 그 지연 import) | **0** — 툴바 "스냅샷"을 눌러야 받는 `SnapshotLayerLoader` 청크 [L1 `useSnapshots.tsx:83`] | `/studio` 여유 0.03 |
| `deleteSnapshot` 판정·자동 정리 헬퍼·`snapshotSeq` | `memoryDocBook`(조작 뒤 — C4) | 0 | — |
| `deleteSnapshot` 저장소 배선 | `memoryProjectRepository`(**`/studio`·`/projects` 진입**) — 기존 `write("…")` 위임 1줄 + `SnapshotWrite` 유니온 1항목 | **0 아님 가능** [추정 — 숫자 쓰지 않음] | MQ-D2: 실측 관문. 상쇄 = `studioStore` `nextProfileId` 제거 |
| `ProjectRepository.deleteSnapshot` 인터페이스 | `projectRepository.ts`(타입 — 런타임 0) | 0 | — |
| 프로젝트 "삭제" 버튼(J-S12) | `ProjectRow`(`/projects` 페이지 청크) | `/projects` 소폭 | `/projects` 104.47 / 125 — 여유 큼 |
| 프로젝트 삭제 확인 대화상자·IDB 삭제 흐름·`seq` 갱신 | 새 조작 뒤 청크(`ClearDataDialogSlot` 패턴 — 버튼을 눌러야 받음) · `features/projects/deleteProject.ts`(IDB 직접 — `clearBrowserData`처럼 `envelope` import 금지 주석 따름) | 0 | `/studio`·`/profile` closure와 공유 모듈에 넣지 않는다 |
| 카운터 발급 `nextSeqId` | 조작 뒤 공용(`data/persistence/` 또는 `data/seqId.ts`) — `memoryBoardConfirm`·`memoryGenerate`·`memoryDocBook`만 import | 0 | — |
| `studioStore` reader `seq()` · `nextProfileId` 제거 | `studioStore`(**모든 store 라우트 진입**) | ±0 목표 | 실측 관문 |
| `memoryGenerationRepository` job id 인자 이동 | `/profile` 진입 | ±0 목표(식 삭제·인자 추가) | `/profile` 99.87 / 100 — 실측 관문 |
| 프로젝트 삭제 결과 알림·h1 포커스(J-S16) | `ProjectsPage` | `/projects` 소폭 | — |

- **관문(첫 레인 L1에서 배선만 넣고 실측)**: `/studio` **≤ 129.65** · 복원 진입 **≤ 132.68** · `/profile` **≤ 100** · `/projects`·`/compare` **≤ 125**. 하나라도 넘으면 **멈추고 실측 보고 → MQ-D2 B/C 재상신**. KB 추정 금지(ADR-007 사실 9 · 최근 레인 추정 대비 실측 2~10배).

## 5. QA 수용 기준

단위(메모리 가짜·vitest) = U, Ego Lite build+preview 실측 = E.

- **AC-D01 삭제 뒤 id 재발급 0 · 겹침 0 · 덮어쓰기 0 (ADR P1d 행)** — U: ① 수동 스냅샷 3개(1·2·3) → 2 삭제 → 새 수동 = `snapshot-4`(3과 겹침 0) ② 3 삭제(최대) → 새 = `snapshot-4`(재발급 0, `snapshotSeq`=3 반영) ③ 프로젝트 3개(계열 1·2·3, 잡 1·2·3) → 프로젝트 2 삭제 → 새 확정 = `project-4`·`profile-4` · 새 잡 = `job-4`, 프로젝트 1·3의 레코드·계열·잡 **값 그대로**(덮어쓰기 0) ④ 프로젝트 3(최대) 삭제 → 새 = `project-4`·`profile-4`·`job-4`. E: ③을 실제 IDB에서 새로고침 뒤 확인.
- **AC-D02 자동 21번째 정리** — U: 자동 20개 + 수동 5개 → 자동 1개 추가(4 reason 각각 1회 이상) → 자동 20개(가장 오래된 자동 빠짐)·수동 5개 그대로 · 같은 flush 1회에 문서 레코드 put + 뺀 스냅샷 전용 이미지 delete가 **한 트랜잭션**(메모리 가짜 write 호출 1회) · 다른 스냅샷·문서가 같이 참조하는 이미지는 남음. 복원 예외: 가장 오래된 자동을 복원 → 그 스냅샷은 남고 다음 오래된 자동이 빠짐.
- **AC-D03 수동은 정리 대상 아님** — U: 수동 30개 + 자동 20개에 자동 추가 → 수동 30개 전부 남음. 기존 데이터 이행: 자동 25개인 레코드로 열기 → 쓰기 0 → 다음 자동 생성 때 20개.
- **AC-D04 프로젝트 삭제 뒤 IDB 레코드 0** — E(+ U 메모리 가짜): 프로젝트 `project-1`·`project-10`(둘 다 이미지·스냅샷 있음) → `project-1` 삭제 → ① `docs/project-1` 없음 ② `images` 키 중 `project-1/` 접두 0 · **`project-10/…` 수 그대로** ③ `studio/state`의 projects·heads에 `project-1` 0 · series·adjustCommits에 그 계열 0 · commits·jobs에 그 계열 0 ④ `meta/generation` = 삭제 전 + 1 = state `gen` ⑤ `snapshots` 저장소 비어 있음(원래).
- **AC-D05 다른 탭 편집 중 차단** — E: 탭 A 편집기에서 편집·저장(쓰기 탭) → 탭 B `/projects`에서 아무 프로젝트(A가 편집 중이 아닌 것 포함) 삭제 → alert PJ-7 1회 · IDB 그대로(레코드 수·generation 불변) · A 닫은 뒤 B 재시도 성공. 추가: 탭 C가 지운 프로젝트 편집기를 열어만 둔 상태 → 삭제 성공 → C 편집 → C 저장 실패(낡은 탭 문장) · `docs/<id>` 부활 0.
- **AC-D06 포커스·대화상자** — E: (스냅샷) 확인 열면 포커스 "취소" · Tab이 확인 대화상자 안에서 순환 · **Esc 1회 = 확인만 닫힘, 스냅샷 대화상자 열림 유지, 포커스 = 그 줄 "삭제"** · 지우기 성공 → 포커스 다음 줄 "미리보기"(마지막 줄이면 이전 줄, 하나뿐이면 이름 입력) · 편집 알림 SN-8 1회 · 진행 중 "지우는 중…" aria-disabled. (프로젝트) 열면 포커스 "취소" · Esc = 닫힘 + 포커스 그 줄 "삭제" · 바깥 클릭 무반응 · 성공 → 새로고침 뒤 h1 포커스 + PJ-10 1회(다시 새로고침하면 0회).
- **AC-D07 버튼 노출 규칙** — U: 수동 줄에만 "삭제"(자동·게시 0) · SN-1 캡션 늘 표시 · `/projects` "삭제"는 local일 때만(memory 0).
- **AC-D08 실패 경로** — U: 스냅샷 삭제 flush INFRA → alert SN-7 · 재시도 = 없는 id → 변화 0 + flush 재제출 성공. 프로젝트: 봉투 `schemaVersion: 99` → PJ-8 · 쓰기 0 · 트랜잭션 실패 주입 → PJ-9 · 쓰기 0(전부 아니면 전무).
- **AC-D09 번들** — 4절 관문 수치.
- **AC-D10 회귀** — P1c AC-C01~C15 중 잠금·지우기·첫 저장(C01·C04·C05·C06·C11) 재실행 통과 · 기존 스냅샷 AC(ER-AC-S1·S7·S9) 통과.
- 정리(모든 E 뒤): `indexedDB.deleteDatabase("design-studio")` · 탭 정리 · preview 종료.

## 6. 바뀌는 문서 (행 목록만 — 본문 수정은 Jarvis/해당 레인, 이 레인 수정 0)

| 문서 | 행 | 바뀔 내용 |
|---|---|---|
| `docs/design/2a-05/SPEC.md` | **17** | 상태 수 "J-S01~J-S11" → J-S17(J-S12~J-S17 프로젝트 삭제) |
| 〃 | **19** | "스냅샷 수동·내보내기 전·…" 뒤 "· 수동 삭제(확인) · 자동 최근 20개" |
| 〃 | **22** | `ProjectRepository` 12개 메서드 → 13개(`deleteSnapshot`) · 프로젝트 삭제는 저장소 메서드 아님(IDB 직접, MQ-D1) 기록 |
| 〃 | **117** | J-S04 줄 행동에 "삭제"(버튼) 추가 |
| 〃 | **315** | 탭 전체 한도 근거 "스냅샷은 지울 수 없어(5.11)" → "수동 스냅샷은 지울 수 있고 자동은 최근 20개(5.11)" |
| 〃 | **341** | "이름 바꾸기·지우기는 2a-05 범위 밖" → "지우기 = 수동만(확인 대화상자) · 자동 최근 20개 보존(P1D-SPEC 1.1·1.2) · 이름 바꾸기는 범위 밖" |
| 〃 | **506** | Snapshot 필드 행에 id 규칙 "프로젝트별 단조(snapshotSeq)" |
| 〃 | **555~556** | 저장소 표에 `deleteSnapshot(projectId, snapshotId)` → `DELETE /projects/{id}/snapshots/{sid}`(신규) 행 추가 |
| `docs/decisions/ADR-007-local-persistence.md` | **52**(3절 `meta` 행) | "단조 순번 카운터(profile·project·snapshot·이미지)" → 상태 레코드 `seq`(project·profile·job) + 문서 레코드 `snapshotSeq` · 이미지 카운터 불필요(3절 근거) — Jarvis 개정 기록 |
| `docs/design/persistence/P1C-SPEC.md` | **118** | 할당량 문장 "(P1d 프로젝트 삭제 전까지는 …유일한 전체 정리)" 괄호 삭제(P1d로 해소) |
| `docs/design/persistence/THREATS.md` | **21**(T3) | 완화 "MQ-P8 프로젝트 단위 삭제" → 구현됨(P1d) |

## 7. Developer 레인 분할 (레인당 1~2건)

| 레인 | 범위(절) | 주 쓰기 파일 | AC | 선행 | 관문 |
|---|---|---|---|---|---|
| **L1 카운터 + 스냅샷 삭제 판정** | 3절 전부 · `nextSeqId` · `seq` reader · `nextProfileId` 제거 · job id 이동 · `snapshotSeq` · **`deleteSnapshot` 저장소 메서드(인터페이스·위임 1줄·DocBook 판정 본체 — 1.1 판정 줄)** — 진입 배선을 한 레인에 모아 관문을 1번에 잰다 | `studioStore.ts` · `memoryBoardConfirm.ts` · `memoryGenerationRepository.ts` · `memoryGenerate.ts` · `memoryDocBook.ts`(id 식) · `projectRepository.ts` · `memoryProjectRepository.ts` · 새 `seqId.ts` | D01①② · D08(스냅샷 판정 — 없는 id 멱등) · D09 | 없음 | **4절 관문 실측 — 넘으면 멈춤(MQ-D2)** |
| **L2 스냅샷 삭제 + 자동 정리** | 1.1 · 1.2 · SN 문구 | `memoryDocBook.ts`(자동 정리 헬퍼 4곳) · `SnapshotDialog.tsx`(+ 확인 대화상자) · `SnapshotLayer.tsx`(onNotice·refresh) | D02 · D03 · D06(스냅샷) · D07(스냅샷) · D08(스냅샷 UI alert) | L1 | `/studio` 몫 0(조작 뒤만) |
| **L3 프로젝트 삭제** | 1.3 · 1.5 · PJ 문구 · J-S16 알림 | 새 `features/projects/deleteProject.ts` · 새 `components/projects/DeleteProjectDialog.tsx`(+ Slot) · `ProjectRow.tsx` · `ProjectList.tsx` · `ProjectsPage.tsx` | D01③④ · D04 · D05 · D06(프로젝트) · D07(프로젝트) · D08(프로젝트) | L1(`seq` 형식) | `/projects` ≤125 |

- **병렬**: L1 먼저(카운터·인터페이스 선언). 그다음 **L2 ‖ L3 병렬 가능 — 쓰기 파일 겹침 0**(L2 = `memoryDocBook`·`Snapshot*` / L3 = `features/projects`·`components/projects`·`ProjectsPage`). 겹침 후보였던 `projectRepository.ts`·`memoryProjectRepository.ts`는 L1이 선언까지 맡아 L2·L3가 건드리지 않는다. L3는 `seq` 형식만 L1에서 받는다(`deleteProject.ts`가 state 레코드를 직접 고침).
- 공유 상수: `BUSY_TEXT`·`FAIL_TEXT`는 지금 `ClearDataDialog.tsx` 지역 상수 — L3가 같은 문장을 쓰려면 `features/projects/` 공용 모듈로 옮김(L3 파일 범위 안 · `ClearDataDialog.tsx` 1줄 수정 포함 — 겹침 표시: L3 단독).
- 각 레인 완료 기준: typecheck·lint·test·build + 해당 AC(E는 Ego Lite) + 관문. TDD — 실패 테스트 먼저(AC-D01이 RED 출발점).

## 8. 이 SPEC이 정하지 않는 것

- 스냅샷 이름 바꾸기(2a-05 범위 밖 유지) · 게시 스냅샷(2a-05b) 삭제 · 여러 프로젝트 한꺼번에 삭제 · 삭제 되돌리기(P8 A "되돌리기 없음").
- 파일 묶음 백업(P2) 권유 문장 — P2 출시 때 J-S13 캡션에 "지우기 전에 '프로젝트 파일로 내보내기'로 백업할 수 있습니다" 추가 예정(P1c 1.6 예비 문장과 같은 처리).
