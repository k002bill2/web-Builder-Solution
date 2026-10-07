# P1C-SPEC — 다중 탭 · 저장 상태 · 데이터 지우기 · 사용량 (문구·상태 명세)

- 작성 Designer(P1C-SPEC 레인, base `88db710`) · 2026-10-08. 결정 필요 항목은 `P1C-MQ.md`(MQ-C1~C5).
- 정본: ADR-007(P1 A · 3절 다중 탭 · 5절 P1c 행 · 개정 1) · ADR-004 개정 12(`/studio` 영속 진입 몫 남은 여유 **0.03KB**, 미배분 0.05 — "P1c 이후 진입 증가는 예산 재상신 전제") · `persistence/MQ.md`·`THREATS.md`(T3·T5·T6·T7·T8) · 2a-05 SPEC E-S06~E-S10 · 5.9 · 5.10.
- 근거 표기: [L1] 코드·문서 직접 확인 · [L3] 외부 일반 지식(네트워크 확인 안 함) · [확인 필요] 구현 레인이 실측.
- 브랜드: 새 브랜드 문구만, 목업 브랜드 명칭·`--apfs-*` 0. 기존 DS 컴포넌트(`Button` primary·outline·assistive, `Callout`, 네이티브 `dialog`)·토큰 재사용. 새 아이콘·새 토큰·새 의존성 0. `Button`에 위험 variant 없음 [L1 `components/ds/Button.tsx:5`] → 새로 만들지 않는다.

## 0. 설계 원칙 (이 SPEC 전체에 적용)

1. **진입 몫 0이 기본.** `/studio/:projectId` 진입 청크(= `StudioPage` · `StudioEmptyStates` · `StudioLayout`(검사기 auto) · `SaveStatus` · `saveStatusText` · `StudioPanels` · 공유 `deferredStudio`·`memoryProjectRepository`·`entryRead`) [L1 `pages/StudioPage.tsx:4·12` · `StudioLayout.tsx:18·22·28` · `scripts/check-bundle-size.mjs:49·127·150`]에 **새 분기·새 컴포넌트·새 문구를 넣지 않는다.** 진입 파일의 문구 교체는 **모드와 무관하게 참인 문장, 길이는 같거나 짧게**만 한다.
2. **production의 `persistence: "memory"`는 이제 "강등" 상태만 뜻한다.** IDB 없음·열기 실패·버전 불일치·깨진 봉투면 `readEntry`가 undefined → 메모리 시작 [L1 `data/persistence/entryRead.ts:61-72` · `memoryProjectRepository.ts:106`]. 그래서 기존 memory 문구("이 탭에 저장됨", 떠나기 경고 늘 켬)는 **그대로 강등 안내 역할**을 한다 — 새 분기 0.
3. 설명이 필요한 안내(왜 강등됐는지·사용량·지우기·다중 탭 사유)는 **예산 여유가 큰 `/projects`(125 한도, 현재 101.17 [L1 persist-p1a2 REPORT 번들 표])의 "이 브라우저 저장소" 영역**과 **조작 뒤 청크**에만 둔다. 편집기 안에 새 안내 칸을 두려면 예산 재상신 → MQ-C1.
4. 알림 접근성 계약 유지: 편집기 `role=status` "편집 알림" 영역은 화면당 1개(셸 소유, E-AC-33) — 새 알림은 `onAnnounce`로 올린다 [L1 `SaveStatus.tsx` 머리 주석]. 대화상자 = 네이티브 `dialog` + `showModal()` · 바깥 클릭 닫기 0 · Esc = 취소 [L1 `SnapshotDialog.tsx:14` · `AddSectionDialog.tsx:10` · `ThemeDialog.tsx:12`].
5. 저장 범위 사실 [L1]: IDB `design-studio` 저장소 = `meta·studio·docs·snapshots·images·board·saved`(`envelope.ts:6·8`). 실제 쓰는 것 = 상태(프로젝트·프로필 계열·생성 잡 StoredJob 통째) · 문서+스냅샷 · 이미지. **비교 보드는 영속 범위 밖**(`deferredStudio.ts:51` "새로고침마다 빈 보드") · **저장한 레퍼런스(보관함)도 IDB 미사용**(`features/saved/SavedReferencesContext.tsx` indexedDB·persist·localStorage grep 0건).

## 1. 화면 상태표

### 1.1 전수 grep 근거 (재현 명령)

```bash
cd app/src
# ① 저장 위치·소실 문구
grep -rnE "탭에 저장|새로고침|서버 연결|사라집|사라져|이 탭|탭을 닫|저장되지 않|브라우저에 저장|브라우저|persistence ===|\"memory\"|\"local\"|needsUnloadGuard|beforeunload|공용 PC|남지 않|탭 메모리" . --include='*.ts' --include='*.tsx' | grep -v "\.test\." | grep -v "^\./test/"
# ② 넓힌 패턴(보관·잃음·다시 고르기·지움) — 사용자 문자열만
grep -rnE "보관|메모리|잃|다시 골라|남지|지워" components pages features --include='*.tsx' --include='*.ts' | grep -v "\.test\."
# ③ 옛 문구를 고정한 테스트(구현 레인이 함께 고칠 목록)
grep -rlE "이 탭에 저장|새로고침하면 프로젝트|새로고침하면 확정한|이 탭의 편집기 안에서만|이 탭에 보관한|서버 연결 전" . | grep test
```
주석·브라우저 API 설명 줄은 제외하고 **사용자에게 보이는 문자열만** 아래 표에 올렸다. ②의 나머지(`다시 골라 주세요`·`잃은 슬롯` 등)는 저장 위치와 무관한 편집 문구라 변경 0.

### 1.2 로컬 영속과 어긋난 기존 문구 → 새 문구

| # | 파일:행 [L1] | 청크 | 현재 | 새 문구 | 조건·근거 |
|---|---|---|---|---|---|
| W1 | `pages/ProjectsPage.tsx:27` (J-S02 빈 상태) | `/projects` 전용 | 새로고침하면 프로젝트가 사라집니다(서버 연결 전) | local: **프로젝트는 이 브라우저에 저장됩니다 — 다른 기기나 브라우저에서는 보이지 않습니다** · memory(강등): **이 브라우저에 저장할 수 없어 새로고침하면 프로젝트가 사라집니다** | 저장소 `persistence`로 분기(`/projects` 예산 여유 큼). 강등 사유는 2절 저장소 영역 |
| W2 | `components/studio/StudioEmptyStates.tsx:17` (E-S02) | `/studio` 진입 | 새로고침하면 프로젝트와 편집 내용이 사라집니다(서버 연결 전) | **이 브라우저에 저장된 프로젝트만 열 수 있습니다** | 분기 0 · 더 짧음(32→22자). 두 모드 모두 참(강등이면 브라우저에 저장된 것이 없음) |
| W3 | `pages/ProfilePage.tsx:22` (P-S02) | `/profile` | 새로고침하면 확정한 프로필이 사라집니다(서버 연결 전) | **이 브라우저에 저장된 프로필만 열 수 있습니다** | 분기 0 · 더 짧음. `/profile`(3안 있음) 여유 약 2.6KB지만 0 증가로 |
| W4 | `components/studio/StudioPanels.tsx:146` (내보내기 자리 대체 캡션) | `/studio` 진입 | 코드 생성기 연결 후(M2) 내보낼 수 있습니다. 지금 문서는 이 탭에 저장돼 있습니다. | **코드 생성기 연결 후(M2) 내보낼 수 있습니다.** | 둘째 문장 삭제(저장 위치는 툴바 SaveStatus가 상시 표시) — 진입 바이트 감소 |
| W5 | `components/studio/ExportAfter.tsx:64` (`KEEP`) | 조작 뒤(lazy `ExportAfter`) | 지금 문서는 이 탭에 저장돼 있습니다 — 따로 남기려면 '스냅샷'에서 저장하세요 | **지금 문서는 자동으로 저장됩니다 — 이 시점을 따로 남기려면 '스냅샷'에서 저장하세요** | 분기 0(모드 무관 참) — `persistence`를 이 청크로 넘기는 진입 배선 0 |
| W6 | `components/studio/ImageSlotPanel.tsx:44` (5.9 상시 캡션) | 조작 뒤(lazy `ImageSlotPanel`, `EditFields.tsx:16`) | 고른 이미지는 이 탭의 편집기 안에서만 보관됩니다 — 편집기를 나가거나 새로고침하면 다시 골라야 합니다 | **고른 이미지는 문서와 함께 저장됩니다 — 툴바에 '이 탭에 저장됨'이 보이면 새로고침 뒤 다시 골라야 합니다** | 분기 0. P1b로 local은 새로고침·재진입 생존 [L1 persist-p1b REPORT] · [확인 필요] memory(강등)에서 편집기 이탈 시 보관 여부 — 이탈도 잃으면 "편집기를 나가거나 새로고침하면"으로 |
| W7 | `features/studio/images/store/imageStore.ts:55` (탭 한도 거부) | 조작 뒤 + **저장 데이터 복원 진입**(imageStore 포함, 기준선 132.65 · 허용 0.03) | 이 탭에 보관한 이미지가 24개 · 60MB를 넘습니다 — 쓰지 않는 슬롯의 이미지를 지운 뒤 고르세요 | **이 프로젝트의 이미지가 24개 · 60MB를 넘습니다 — 쓰지 않는 슬롯의 이미지를 지운 뒤 고르세요** | 한도 단위 = 프로젝트(ADR-007 P2 A "60MB/프로젝트") · 앞부분 같은 글자 수(12자) — 복원 진입 시나리오 실측 필수 |
| W8 | `features/studio/saveStatusText.ts:34` | `/studio` 진입 | memory "이 탭에 저장됨" · local "이 브라우저에 저장됨" · server "저장됨" | **변경 0** | memory = 강등 상태라 문구가 그대로 참(0절 2) |
| W9 | `features/studio/useAutosaveScheduler.ts:65-67` (E-S10) | `/studio` 진입 | memory 늘 경고 · 그 밖 dirty·saving·failed·offline·stale | **변경 0** | 1.9 참고 |

- 바뀌는 문서(수정 금지 범위 — Jarvis/해당 레인 몫, 이 레인 수정 0): 2a-05 SPEC **153**(E-S06 "이 탭에 저장됨" 예시) · **157**(E-S10 "메모리 구현은 늘") · **322**(5.9 캡션) · **559**(`persistence` 값에 `"local"` 추가) · **866**(EQ-5 "영속은 백엔드 ADR에서") · 2a-04 J-S02·P-S02 빈 상태 문구.
- 옛 문구 고정 테스트(③ 결과, 구현 레인이 함께 갱신): `ProjectsPage.test.tsx` · `ProfilePage.test.tsx` · `StudioEmptyStates.test.tsx` · `StudioLayout.test.tsx` · `ExportFlow.test.tsx` · `ImageSlotPanel.test.tsx` · `imageStore.test.ts` · (W8·W9 변경 0이라 유지) `saveStatusText.test.ts` · `SaveStatus.test.tsx` · `useAutosaveScheduler.hook.test.tsx`.

### 1.3 ① SaveStatus · 사용량

| 상태 | 표시(툴바, 라이브 영역 밖) | 알림 | 변경 |
|---|---|---|---|
| local 저장됨 | 이 브라우저에 저장됨 · 12초 전 | 없음(평상시 낭독 금지, 5.10) | 0 (P1a 구현됨) |
| memory(강등) 저장됨 | 이 탭에 저장됨 · 12초 전 | 없음 | 0 |
| 저장 실패(INFRA — 할당량·잠금 없음·트랜잭션 중단) | 저장하지 못했습니다 + "다시 저장" | `role=alert` 1회 | 0 (사유 문장은 1.5·2절 — MQ-C1) |

- **사용량은 SaveStatus에 두지 않는다**(브리프 ①이 묶어 적었으나 위치 변경): SaveStatus는 `/studio` 진입 청크라 `estimate()` 호출·표기 코드가 진입 몫이 된다(0절 1). 사용량 = `/projects` "이 브라우저 저장소" 영역(2절).
- 표기 규칙: `navigator.storage.estimate().usage` — **출처 전체 근사값**(IDB 외 캐시 포함·브라우저가 부풀릴 수 있음 [L3]) → "약"을 붙인다. 단위 = `imageStore`와 같은 1MB = 1024² 바이트·`toFixed(1)` [L1 `imageStore.ts:14·45`].
  - `usage < 0.1MB` → **"사용량 0.1MB 미만"** · 그 밖 → **"사용량 약 12.3MB"** · `quota`가 있고 `usage/quota ≥ 0.8` → 뒤에 **" · 브라우저가 허용한 공간의 80% 이상"**(cautionary 문장 추가, 2.3).
  - `navigator.storage?.estimate` 없음·거부 → 사용량 줄 **숨김**(오류 문구 0).
  - 1024 이상 MB는 GB로 바꾸지 않는다(이미지 한도 60MB/프로젝트 — 실사용 범위).

### 1.4 ③ 첫 저장 1회 안내 (ADR-007 P1 A)

- 첫 저장 = 이 브라우저에 **처음 레코드가 쓰이는 때** = 보드 확정(J-S09~S11 — 프로젝트·프로필 계열 생성, 상태 레코드 첫 put).
- 위치: **보드 확정 성공 결과(J-S11 알림 영역) 아래 문장 1개** — `/compare` 조작 뒤 청크. [확인 필요] J-S11 결과 UI가 `/compare` 자동 closure 밖인지 구현 레인 실측(밖이 아니면 `/compare` 여유 2.4KB 안에서 실측 보고).
- 문구: **"이 브라우저에 저장했습니다 — 공용 PC라면 다 쓴 뒤 '프로젝트' 화면의 '이 브라우저 데이터 지우기'로 지우세요"**
- 1회 판정: IDB `meta` 저장소 키 `firstSaveNotice` = true(지우기와 함께 사라져 지운 뒤 첫 저장에 다시 안내 — 의도). 키 쓰기는 같은 확정 트랜잭션 뒤 별도 put(실패해도 확정 성공, 다음 확정에 한 번 더 보일 뿐).
- 접근성: 확정 결과 알림과 **같은 status 문장 안에 이어 붙인다**(새 라이브 영역 0).
- 강등(memory)이면 안내 대신 2.2의 강등 문장이 `/projects`에 뜬다(확정 결과에는 추가 0).

### 1.5 ④ 다중 탭 — 읽기 전용 · 갱신 알림 (ADR-007 3절 Web Locks ★ · THREATS T5)

**잠금 규칙**(조작 뒤 `localSync` 청크 — 진입 0):
- 잠금 이름 `design-studio-writer`. `localSync` 열 때 `navigator.locks.request(name, { ifAvailable: true })` — 잡으면 쓰기 탭, 못 잡으면 **읽기 전용 탭**. 잡는 시점 = 첫 편집(싱크 청크 로드) → ADR 문구 "먼저 연 탭"이 "먼저 편집한 탭"이 됨 → **MQ-C2**.
- `navigator.locks` 없음 [L3 확인 필요] → 쓰기 허용하지 않고 읽기 전용(THREATS T5 "읽기 전용 폴백").
- **최신성 확인(필수)**: 잠금을 잡은 직후 IDB 상태 레코드를 다시 읽어 **이 탭이 하이드레이트한 것과 같은지**(상태 revision·문서 revision 또는 meta 쓰기 세대 번호) 비교한다. 다르거나 상태 레코드가 사라졌으면(다른 탭이 썼거나 지웠음) **쓰기 0 · 읽기 전용**. 이것이 없으면 늦게 편집한 탭이 낡은 메모리로 다른 탭의 저장·지우기를 덮는다(지운 데이터 부활 포함). 세대 번호 위치·이름은 구현 레인 확정.

**화면**(★ = 진입 0, MQ-C1 A):

| 상태 | 편집기 표시 | 떠나기 경고 | `/projects` 저장소 영역(2절) |
|---|---|---|---|
| 읽기 전용(다른 탭이 잠금) | 편집은 메모리에서 계속 됨 · 저장은 INFRA 사유 "다른 탭에서 편집 중입니다 — 이 탭의 변경은 저장하지 않습니다"(`toInfra` reason 인자 [L1 `infra.ts:20`]) → SaveStatus **"저장하지 못했습니다" + "다시 저장"**(기존) · alert 1회 | 켜짐(failed) | "다른 탭에서 편집 중입니다 — 그 탭을 닫으면 새로고침한 뒤 이 탭에서 편집할 수 있습니다" |
| 낡은 탭(최신성 확인 실패) | 같음, 사유 "다른 탭에서 바뀐 내용이 있습니다 — 새로고침한 뒤 편집하세요" | 켜짐 | 같은 문장 + "새로고침" 버튼 |
| "다시 저장" 눌렀는데 잠금이 풀려 있음 | 잠금 획득 → **최신성 확인** 통과 시에만 저장 | — | — |

- **"이 탭으로 가져오기"(Web Locks `steal`) 제공 안 함** ★(MQ-C3): 상대 탭의 확인 안 된 쓰기·디바운스 구간(최대 30초)이 사라진다. 대신 "그 탭을 닫으면 새로고침한 뒤 이 탭에서 편집" 안내.
- **BroadcastChannel `design-studio`**(조작 뒤 · `/projects` 영역 청크에서만 구독): 메시지 2종 — `{ type: "saved" }`(쓰기 탭이 IDB 커밋 확인 뒤) · `{ type: "cleared" }`(지우기 직전, 1.6).
  - 구독 중인 탭(싱크가 열린 편집기 · `/projects` 영역): `saved` → `/projects` 영역에 **"다른 탭에서 저장한 변경이 있습니다 — 새로고침하면 보입니다"** + "새로고침" 버튼(`role=status` — `/projects`는 편집기 셸 밖이라 영역 자체의 status 1개). 편집기 안에서는 표시 0(MQ-C1 A) — 다음 저장 때 최신성 확인이 읽기 전용으로 막는다.
  - `cleared` → 싱크 큐 즉시 멈춤(쓰기 0) · 이후 저장 = INFRA 사유 "이 브라우저 데이터가 지워졌습니다 — 새로고침하세요".
  - 진입 때 구독하지 않는다(진입 몫) — 한 번도 편집하지 않은 탭은 알림을 못 받지만 **최신성 확인이 첫 쓰기를 막으므로 데이터 안전은 알림에 의존하지 않는다.**

### 1.6 ⑤ "이 브라우저 데이터 지우기"

- **진입 위치**: `/projects` 페이지 맨 아래 **"이 브라우저 저장소"** 영역(h2) 안 `Button variant="outline"` **"이 브라우저 데이터 지우기"**. 편집기 "더보기" 메뉴는 실행 취소·다시 실행 전용 [L1 `MoreMenuBody.tsx`]이라 넣지 않는다. 프로젝트 0개여도 영역·버튼은 보인다(빈 DB·강등 사유 확인 용도). 저장소 없음(indexedDB 미지원)이면 버튼 숨김.
- **대화상자**(네이티브 `dialog` · `showModal()` · h2 = 접근 이름 · **열 때 포커스 = "취소"** · Esc = 취소 · 바깥 클릭 닫기 0 · 닫히면 포커스 = 여는 버튼):
  - 제목: **이 브라우저 데이터를 지울까요?**
  - 본문 1: **이 브라우저에 저장된 아래 항목을 모두 지웁니다. 되돌릴 수 없습니다.**
  - 목록(ul): **프로젝트 N개와 각 편집 문서** · **스냅샷** · **문서에 넣은 이미지** · **확정한 프로필(모든 버전)과 만든 3안** — N = 현재 목록 수(0이면 "프로젝트"만).
  - 본문 2(범위 밖): **비교 보드와 보관함은 이 탭에만 있어 지우지 않습니다. 내려받은 파일도 그대로 남습니다.**
  - 예비(P2 파일 묶음 출시 전 **숨김**): **지우기 전에 '프로젝트 파일로 내보내기'로 백업할 수 있습니다.**
  - 버튼: **취소**(outline) · **모두 지우기**(primary — 위험 variant 없음, 라벨로 구분).
  - 진행 중: "모두 지우기" `aria-disabled` + 라벨 **"지우는 중…"** · Esc 무시.
- **흐름**(조작 뒤 청크):
  1. 잠금 `design-studio-writer`를 `ifAvailable`로 요청 — 못 잡으면 대화상자 안 `role=alert` **"다른 탭에서 편집 중이라 지우지 못했습니다 — 그 탭을 닫은 뒤 다시 시도하세요"** + 버튼 유지(재시도).
  2. BroadcastChannel `{ type: "cleared" }` 전송.
  3. 이 탭의 열린 연결 닫기 → `indexedDB.deleteDatabase("design-studio")`. `onblocked` → 위 1의 alert와 같은 문장. `onerror` → **"지우지 못했습니다 — 다시 시도하세요"**.
  4. 성공 → `sessionStorage`에 1회 표시 키 → **`/projects`로 새로고침 이동**(메모리 store 버림 — 남은 메모리가 다시 쓰는 것을 막음).
  5. 새로고침 뒤 `/projects` 영역 `role=status` **"이 브라우저 데이터를 지웠습니다"**(1회, 키 삭제).
- 새로고침 뒤 store 라우트 진입은 `openForEntry`가 버전 없이 열어 **빈 v1 DB(저장소 0)를 다시 만든다** [L1 persist-p1a2 REPORT 60행] — 정상(레코드 0). AC는 3절 AC-C05.
- 지우기 범위 = DB 통째(`meta` 포함 → 첫 저장 안내 키도 지워짐). object URL·이미지 보관소는 새로고침으로 사라짐. 캐시 스토리지는 앱이 쓰지 않음 [확인 필요: SW 없음].

### 1.7 ⑥ 저장소 불가 · 축출 · 할당량 (강등)

| 원인 | 감지 | 편집기(진입 0) | `/projects` 저장소 영역 문구(2절) |
|---|---|---|---|
| IndexedDB 없음 | `typeof indexedDB === "undefined"` | 이 탭에 저장됨 · 떠나기 경고 늘(기존) | **이 브라우저는 저장소를 쓸 수 없어 이 탭에만 저장합니다 — 새로고침하거나 탭을 닫으면 사라집니다** · 지우기 버튼 숨김 |
| 열기 실패(사설·시크릿 창, 저장소 차단 등) | 영역 청크가 `indexedDB.open` 재시도 → 오류 | 같음 | **브라우저 저장소에 접근하지 못해 이 탭에만 저장합니다 — 사설·시크릿 창이거나 사이트 데이터 저장이 꺼져 있을 수 있습니다** |
| 할당량 초과(쓰기 중) | `QuotaExceededError` → INFRA "브라우저 저장 공간이 부족합니다"(기존 `infra.ts:11`) | 저장하지 못했습니다 + 다시 저장(기존) | 사용량 80% 이상 문장(1.3) + **"저장 공간이 부족하면 저장이 실패합니다 — 쓰지 않는 프로젝트의 이미지나 스냅샷을 지우세요"** (P1d 프로젝트 삭제 전까지는 "이 브라우저 데이터 지우기"가 유일한 전체 정리) |
| 축출(브라우저가 지움) | **감지 불가** — 첫 실행과 구분 안 됨(같은 출처 저장소가 함께 사라짐) [L3] | — | 축출 대비 문장(상시, local일 때): **"브라우저는 저장 공간이 부족하면 이 데이터를 지울 수 있습니다"** + `persist()` 상태(MQ-C4) |
| 깨진 봉투(invalid) | 진입 = 메모리 시작 | 이 탭에 저장됨(기존) | **저장된 데이터를 읽지 못해 이 탭에만 저장합니다 — 계속 이렇다면 '이 브라우저 데이터 지우기'로 비울 수 있습니다** (기존 레코드는 덮지 않음 [L1 `entryRead.ts:58`]) |

- 영역 청크의 강등 판정은 진입 결과를 재사용하지 않고 **스스로 다시 확인**한다(진입 코드 0 — MQ-C1의 "사유 진입 구분 안 함").
- 강등 상태에서 `/projects` 프로젝트 목록 빈 상태 = W1 memory 문구.

### 1.8 ⑦ schemaVersion 불일치

| 경우 | 동작 [L1 ADR-007 개정 1 · `entryRead.ts:17`] | 문구 |
|---|---|---|
| 저장 버전 > 앱(`newer`) | 메모리 시작 · 쓰기 0 · 레코드 보존 | `/projects` 영역: **"이 브라우저의 저장 데이터는 더 새 버전의 앱에서 저장되어 읽지 못했습니다 — 새로고침해 최신 앱을 받으세요. 그 전까지 이 탭의 변경은 저장되지 않습니다"** + "새로고침" 버튼 |
| 저장 버전 < 앱(이행 단계 있음, 장래 v2) | 이행 후 하이드레이트. **미완료 생성 잡(pending, hidden이 이행되지 않음)은 실패로 강등** | 3안 표 셀(기존 "만들지 못함" [L1 `CandidateTable.tsx:48`]) + 실패 사유 문장 **"앱이 업데이트되어 만들던 안을 이어서 만들 수 없습니다 — 다시 시도하세요"** + 기존 실패 안 "다시 시도"(멱등 재요청 [L1 `CandidatesSection.tsx:3`]) · [확인 필요] 실패 사유 필드명 |
| 이행 실패 | 깨진 봉투와 같음(1.7) | 1.7 깨진 봉투 문구 |

- 버전 불일치 진입은 지금 **알림 없이** 메모리로 시작한다 [L1 `entryRead.ts:66-68`] — 편집기에서는 SaveStatus "이 탭에 저장됨"이 유일한 신호(★ MQ-C1 A). 사유 문장은 `/projects` 영역에서.

### 1.9 ⑧ 떠나기 경고 (E-S10 · THREATS T6)

| persistence·상태 | 경고 | 근거 |
|---|---|---|
| local · idle/saved | 끔 | IDB 커밋 확인 뒤에만 saved [L1 P1a-2 "저장됨 = IDB 커밋 뒤"] |
| local · dirty/saving/failed/offline/stale | 켬 | 기존 `needsUnloadGuard` [L1 `useAutosaveScheduler.ts:66-68`] · saving = "기록 대기 중"(T6) 포함 |
| local · 읽기 전용·낡은 탭 | 켬(편집했으면 failed) / 끔(편집 0이면 idle) | 1.5 — 새 조건 0 |
| memory(강등) | 늘 켬 | 새로고침하면 사라짐 — 기존 그대로 |
| `/projects` 이름 바꾸기(상태 레코드 put, 응답 대기 없음) | 없음 | 알려진 한계: 이름 저장 직후 즉시 닫으면 마지막 이름 변경 유실 가능 [추정 — 짧은 구간] · 이 레인 범위 밖 기록 |

## 2. `/projects` "이 브라우저 저장소" 영역 (사용량·지우기·사유를 모으는 곳)

- 위치: 프로젝트 목록 아래 `section` + h2 **"이 브라우저 저장소"**. 영역 본체는 `/projects` 페이지 청크 또는 그 자동 지연 청크(어느 쪽이든 `/projects` 125 한도 안 — 실측 보고). `/studio` 진입 closure와 **공유 모듈에 넣지 않는다**(`deferredStudio`·`memoryProjectRepository`는 두 라우트 공유 [L1 `check-bundle-size.mjs:49`]).
- 줄 구성(위→아래):
  1. 상태 문장(1개): local 정상 = **"프로젝트·편집 문서·스냅샷·이미지를 이 브라우저에만 저장합니다. 공용 PC라면 다 쓴 뒤 지우세요."** / 강등·버전·다중 탭 = 1.5·1.7·1.8의 해당 문장(cautionary `Callout`).
  2. 사용량 줄(1.3 규칙) — local일 때만.
  3. 보관 요청 상태(MQ-C4 ★A): `persisted()` true = **"브라우저에 자동 삭제하지 않도록 요청해 두었습니다"** / false = **"브라우저는 저장 공간이 부족하면 이 데이터를 지울 수 있습니다"** + `Button variant="assistive"` **"자동 삭제 막기 요청"** → `persist()` 결과 문장 갱신(거절이면 **"브라우저가 요청을 받지 않았습니다"**) · API 없음 = 줄 숨김.
  4. "이 브라우저 데이터 지우기"(1.6).
- 알림: 영역 안 `role=status` 1개(지운 뒤 결과·갱신 알림·보관 요청 결과), 실패는 대화상자 안 `role=alert`.
- 다른 탭 갱신(`saved`)·지우기(`cleared`)를 구독(1.5).

## 3. 번들 배치 제안 (진입 여유 0.03KB 전제 · 진입 몫 0 기본)

| 항목 | 놓는 곳 | `/studio` 진입 몫 | 다른 시나리오 |
|---|---|---|---|
| W2·W4 문구 교체 | `StudioEmptyStates`·`StudioPanels`(진입) | **감소**(짧아짐) | — |
| W8·W9 | 변경 0 | 0 | — |
| W5·W6 | `ExportAfter`·`ImageSlotPanel`(조작 뒤 lazy) | 0 | — |
| W7 | `imageStore`(조작 뒤 + 복원 진입) | 0 | **저장 데이터 복원 진입 132.65(허용 0.03) 실측** — 같은 글자 수라 ±0 예상 [추정] |
| W1·2절 영역·지우기 대화상자·사용량·persist·BroadcastChannel 구독(목록 화면) | `ProjectsPage` 또는 그 지연 청크 | 0 | `/projects` 101.17 → 실측(125 한도) |
| W3 | `ProfilePage` | 0 | `/profile` 감소 |
| 첫 저장 안내(1.4) | `/compare` 확정 결과 UI | 0 | `/compare` 122.60(125) 실측 |
| 잠금·최신성 확인·`saved`/`cleared` 송수신·INFRA 사유 3종 | `localSync`(memoryDocBook 청크 안 dynamic import — 조작 뒤 [L1 persist-p1a2 REPORT 28행]) | 0 | — |
| 읽기 전용 생성 잡 강등 문구(1.8) | 이행 청크(드문 경로, 예산 시나리오 밖) | 0 | 크기만 보고 |
| **진입이 꼭 필요한 항목**: 편집기 안 읽기 전용·갱신·강등 사유 안내 칸, 진입 시점 잠금 | — | **> 0 → MQ-C1·C2(예산 재상신 필요)** | — |

- 구현 레인 관문: 위 배치로 `/studio` **129.62 이하**(감소 허용) · 복원 진입 132.65 ±0.03 · `/projects`·`/compare` 125 이하. 하나라도 넘으면 멈춤 + 실측 보고.

## 4. QA 수용 기준 (Ego Lite build + preview, 실측)

- **AC-C01 탭 2개 — 쓰기 탭/읽기 전용**: 탭 A에서 프로젝트 문서 편집·저장("이 브라우저에 저장됨") → 같은 프로필의 탭 B로 같은 `/studio/:id` 열기 → B에서 편집 → B SaveStatus "저장하지 못했습니다" + alert 1회 · IDB 문서 revision이 A 저장 값 그대로(B 쓰기 0) · B 떠나기 경고 켜짐 · `/projects`(B)에 "다른 탭에서 편집 중입니다…".
- **AC-C02 잠금 해제 후 낡은 탭**: AC-C01 뒤 A 닫기 → B "다시 저장" → 최신성 확인 실패로 쓰기 0 · 사유 = 낡은 탭 문장(1.5) · B 새로고침 → A의 마지막 저장 내용 표시 · 그 뒤 B 편집 저장 성공.
- **AC-C03 갱신 알림**: `/projects` 탭 C를 열어 둔 채 탭 A 저장 → C 영역 status "다른 탭에서 저장한 변경이 있습니다…" 1회 · "새로고침" 후 목록 갱신.
- **AC-C04 지우기 — 다른 탭 편집 중**: 탭 A 편집기(잠금 보유) 열린 채 탭 B `/projects`에서 지우기 → 대화상자 alert "다른 탭에서 편집 중이라 지우지 못했습니다…" · DB 그대로.
- **AC-C05 지우기 — `databases()`**: 단일 탭에서 지우기 확정 → (a) **새로고침 이동 전**(`deleteDatabase` onsuccess 직후) `indexedDB.databases()`에 `design-studio` 없음 → (b) 새로고침 뒤 `/projects`: `design-studio` 없음 **또는** version 1 · `objectStoreNames.length === 0` · 목록 빈 상태(W1 local) · status "이 브라우저 데이터를 지웠습니다" 1회 → (c) `/catalog`로 새로 연 탭은 DB를 만들지 않음.
- **AC-C06 지운 데이터 부활 0**: 탭 A(한 번도 편집하지 않은 편집기 탭)·탭 B(`/projects`) → B 지우기 → A에서 편집 → A 쓰기 0(최신성 확인 실패 사유 "이 브라우저 데이터가 지워졌습니다…" 또는 낡은 탭 문장) · `databases()`/레코드 0 유지.
- **AC-C07 사용량 단위·반올림**(단위 테스트 + 실측 1회): 입력 바이트 → 표기 — `0`→"사용량 0.1MB 미만" · `104857`→"사용량 0.1MB 미만" · `104858`→"사용량 약 0.1MB" · `12.34×1024²`→"사용량 약 12.3MB" · `estimate` 없음 → 줄 없음 · `usage/quota = 0.8`→80% 문장 있음, `0.79`→없음. 실측: 이미지 1장 넣은 뒤 사용량 증가 확인(값은 근사 — 증가만 판정).
- **AC-C08 대화상자 접근성**: 열면 포커스 "취소" · Tab 순환이 대화상자 안 · Esc = 닫힘 + 포커스 여는 버튼 · 바깥 클릭 무반응 · h2가 접근 이름 · 진행 중 "지우는 중…" aria-disabled · 실패 alert 낭독 1회.
- **AC-C09 저장 상태 aria-live**: SaveStatus 글자는 라이브 영역 밖(평상시 저장 낭독 0) · 읽기 전용 실패 alert 1회(연속 실패 재낭독 0) · `/projects` 영역 status는 영역당 1개 — 기존 E-AC-08·09·33 회귀 없음.
- **AC-C10 강등 문구**: (i) 사설·시크릿 창 또는 사이트 데이터 차단에서 `/projects` → 1.7 접근 실패 문장 · 편집기 "이 탭에 저장됨" · 떠나기 경고 켜짐. (ii) DevTools로 `studio/state` 봉투 `schemaVersion: 99` 주입 → 새로고침 → 1.8 newer 문장 · 레코드 그대로(쓰기 0).
- **AC-C11 첫 저장 안내 1회**: 빈 DB에서 보드 확정 → 결과 status에 1.4 문장 1회 → 두 번째 확정엔 없음 → 지우기 뒤 확정엔 다시 1회.
- **AC-C12 문구 회귀**: 1.2 W1~W7 새 문구가 해당 화면에 보이고 grep ①의 옛 문구(서버 연결 전 · 이 탭에 저장돼 있습니다 · 이 탭의 편집기 안에서만 · 이 탭에 보관한)가 `app/src` 사용자 문자열에 0건.
- **AC-C13 번들**: 3절 관문 수치 — `/studio` ≤ 129.62 · 복원 진입 132.65±0.03 · `/projects`·`/compare`·`/profile` ≤ 125.
- 정리(모든 실측 뒤): `indexedDB.deleteDatabase("design-studio")` · 탭·창 정리 · preview 종료.

## 5. 이 SPEC이 정하지 않는 것

- 프로젝트 단위 삭제(P1d)·파일 묶음 백업(P2) 화면 — 1.6 예비 문구만.
- 편집기 안 안내 칸(MQ-C1 B를 고를 때 별도 SPEC 보강).
- 세대 번호(최신성 확인)의 저장 위치·형식 — 구현 레인(엔진 계약 밖, `meta` 저장소 안 권장).
