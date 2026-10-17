# RS7-B REPORT — /projects·/profile 행 문구 정합 (B-RS-09 · B-RS-15 · B-RS-17)

브랜치 `k002bill2/rs7-rows-text` · base `73289c90` · 커밋: 401345ad(BRIEF·PROGRESS) · 374185bf(B-RS-17) · bec4e50c(B-RS-15) · bd3163a3(B-RS-09)

## 결론
- **B-RS-09 PASS(단위)**: 저장 실패 코어의 `/projects` 행이 첫 표시부터 UX-5 2.3 사유 문구를 보인다 — stale·cleared = 문구 + "다시 저장" 숨김 · readonly = 문구 + "다시 저장" 유지. [사실 — `ProjectsReasonRows.test.tsx` 3건 RED→GREEN]
- **B-RS-15 PASS**: `retryRow` 폴백 2곳(기억·코어 없음 / 코어 clean·기억 없음) = `{ok: true, text: ""}`(행 새로고침 + 무문구). 경합 재현 테스트 RED→GREEN. [사실]
- **B-RS-17 PASS**: `/profile` 시작 재생 버튼 "저장 다시 시도" → "시작 다시 시도"(UX-5 D1). 버튼 이름을 인용한 C-E4·C-E6 알림 문장 2개도 같은 라벨로(새 문장 0, 라벨 치환만). [사실]
- **예산**: `/studio` 정규화 129.12 · 복원 132.10 · `/profile` 첫 화면 99.52 = **증분 0**. `/projects` 첫 화면 raw 99.08 = 0(정규화 +5B). **`/projects` 진입 직후 109.53 → 109.60(+0.07KB, 상한 125) — 증분 남음**(감량 1회 뒤 멈춤, 아래 표). 사용자 판단 필요.

## 예산 (fresh `npm run build`, `logs/gate-build.txt`)
| 지표 | base | 이후 | 판정 |
|---|---|---|---|
| /studio 정규화 진입 | 129.12 | 129.12 | 0 |
| /studio 복원 정규화 | 132.10 | 132.10 | 0 |
| /studio raw 진입 | 130.43 | 130.43 | 0 (빌드마다 해시 흔들림 ±0.01 — 중간 빌드 130.42~130.44) |
| /profile 첫 화면 | 99.52 | 99.52 | 0 |
| /projects 첫 화면 | 99.08 | 99.08 | raw 0 · 정규화 ProjectsRoute +5B(게이트에 probe 1줄) |
| /projects 진입 직후 | 109.53 | 109.60 | **+0.07** (상한 125 안) |

청크별 정규화 gzip(base 임시 worktree 빌드 대비, `logs/bundle-norm-diff.txt`): pendingRows 944→1063(+119) · DiscardConfirm 1578→1550(−28) · ProjectsRoute 7547→7552(+5) · pendingRetry 731→894(+163, 조작 뒤 — 판정 밖) · restartFlow −1. 그 밖 청크 정규화 변화 0(raw 차이는 해시 이름).
- 감량 1회(같은 수법 2단계): 조작 뒤에만 나오는 문구 `saved`·`image-missing`(coreRowText) · `P-U2 confirmed`(pendingText)를 `pendingRetry.ts`로 옮김 → pendingRows +168 → +119, DiscardConfirm −28. 남은 +~96B(정규화 합)는 probe·판정 로직 자체. 더 줄이려면 로직을 빼야 해서 멈춤.

## 바뀐 단언 (약화 0)
| 파일 | 이전 | 이후 | 근거 |
|---|---|---|---|
| `features/profile/restartFlow.test.ts:36` | `label: "저장 다시 시도"` | `label: "시작 다시 시도"` | UX-5 14절 D1 — 같은 강도 · 값만 변경 |
| `pages/ProfileRestart.test.tsx:547·558·563` | 버튼 목록 `["저장 다시 시도"]` · 버튼 이름 "저장 다시 시도" | "시작 다시 시도" | 같음 |
두 파일은 BRIEF 쓰기 경로(`restartText*`+그 테스트) 밖이지만 restartText 출력을 단언하는 테스트라 라벨 변경에 필수. 다른 레인 경로 아님(rs7-dead-conflict는 `features/profile/**`를 RS7-B 경로로 금지 · rs7-mutation-gaps는 새 파일만).

## 새 테스트 (+5 파일 · +13 테스트 = 346/3040)
- `features/profile/restartText.test.ts`(2) · `features/projects/pendingRetry.test.ts`(2) · `components/projects/ProjectsRetryRace.test.tsx`(1) · `components/projects/ProjectsReasonRows.test.tsx`(3) · `features/projects/coreRowText.test.ts`(5 — 2벌 가드 4 + stuckOf 1)
- RED 로그: `logs/red-b-rs-17.txt`(4 fail) · `logs/red-b-rs-15.txt`(3 fail) · `logs/red-b-rs-09.txt`(3 fail — 첫 표시에 "저장하지 못했습니다")

## 설계·사실/추정
- [사실] 코어 `view()`에 reason이 없고 `saveCore.ts`는 쓰기 금지 → `/projects`가 쓸 수 있는 환경 출처는 `core.link(… link.port?.mode())`(기존 `confirmCore`와 같은 호출)뿐. `probeCores`가 dirty·저장 중 아님 코어만 읽고 WeakMap에 둔다. `ProjectsPage` 게이트가 probe 뒤에 열린다(probe reject 0 — 실패 = 모름 → 일반 실패 문구). 저장 중이던 코어는 `idle()` 뒤 다시 읽는다.
- [사실·부작용] `port.mode()`는 시도 전·readonly면 쓰기 잠금을 다시 요청한다(`writerLock.enter`). 따라서 readonly 실패 코어가 있는 탭은 `/projects`를 여는 것만으로 다른 탭이 닫혔다면 writer가 될 수 있다(그 뒤 "다시 저장"은 성공). writer·stale·cleared는 요청 없음.
- [사실·UX-5와 다름] 코어만 있는 stale·cleared 행에 "버리고 새로고침"(UX-5 2.3 stale 행동)은 추가하지 않음 — BRIEF가 "숨김" 허용 · 진입 직후 바이트 증가. "편집기 열기"는 유지(편집기가 stale 영역을 보인다).
- [사실·범위 밖 유지] 미확인 기록(PendingRecord)+clean 코어+stale 행은 여전히 "저장 확인" 표시(누르면 stuck 결과로 숨김). 시작 대기 > cleared 순서(UX-5 2.2는 cleared가 위)도 기존대로.
- [사실] 2벌(coreRowText·save/reasonText): reasonText는 RS7-A 경로 · 편집기 조작 뒤 청크라 import 1벌화 시 `/projects` 진입 직후·`/studio` 청크 구성이 바뀜 → 2벌 유지 + 가드(`coreRowText.test.ts`, stale·cleared·readonly·unsupported 동일). image-missing은 두 문장이 원래 달라 가드 밖.
- [사실] B-RS-15 무문구 결과는 빈 `<p role="status">`로 그려진다(글자 0 · 포커스 = 편집기 열기). 화면 표시 변경 0을 위해 ProjectRow는 건드리지 않음.
- [사실] `restartFlow.ts:22` 주석에 옛 라벨 "저장 다시 시도"가 남음(쓰기 경로 밖 · 동작 무관).

## 검증 (fresh)
- `npm run typecheck` exit 0 · `npm run lint` exit 0(경고 0) · `npm test -- --run` 346 files / 3040 tests passed (base 341/3027 + 5/13) · `npm run build` exit 0(번들 검사 통과). 로그 `logs/gate-*.txt`.
- Codex review: (아래 갱신)
- 실화면: (아래 갱신)
