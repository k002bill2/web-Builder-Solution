# SAVE-ON-LEAVE REPORT — B-RS-01 편집기 이탈 저장 미보장 (데이터 손실 경로)

- 레인 Developer · worktree `save-on-leave` · 브랜치 `k002bill2/save-on-leave` · base main `2ad7221`
- 결론: 편집기 안 앱 링크(프로젝트로 돌아가기 · 프로필 보기 등)로 떠날 때 **마지막 화면 편집까지 저장소에 반영된 뒤** 이동한다. 저장하지 못하면 이동을 보류하고 기존 저장 상태 안내("저장하지 못했습니다" · "다시 저장")를 그대로 쓴다. 저장 중에 한 추가 편집도 이동 전에 저장된다. 읽기 전용 탭은 막지 않는다. **새 문구 0**.

## 0. 예산 (ADR-004 개정 15 배분 B-RS-01 ≤ +0.15)

| 시나리오 | base 실측(2ad7221) | 기준선 eagerKb | 이 레인 최종 실측 = 새 기준선 | 기준선 증가 |
|---|---|---|---|---|
| `/studio/:projectId` | 129.57 | 129.62 | 기준선 **129.77**(판정선 129.80) · 최종 실측 **129.79** | 기준선 +0.15(몫 전부) · 실측은 몫 상한 **+0.02 초과** |
| 복원 진입 | 132.60 | 132.65 | 기준선 **132.80**(판정선 132.83) · 최종 실측 **132.83** | 기준선 +0.15(몫 전부) · 실측은 몫 상한 **+0.03 초과** |

- **⚠ 결정 필요(Jarvis/영환님)**: Codex r2 P1·P2(데이터 유실·이동 오허용 수정) 반영 뒤 감량 1회를 하고도 몫 상한을 +0.02·+0.03 넘었다. 브리프 규칙대로 추가 감량은 멈췄다. 기준선은 몫 상한(129.77·132.80)에 두었고 실측은 허용 0.03 안이라 `npm run build`·예산 검사는 exit 0이다 — 즉 초과분은 지금 **허용 잡음분을 먹고 있다**(복원 진입은 판정선과 같아 여유 0). 선택지: ① 개정 15 미배분 0.05에서 0.03 추가 배분 → 기준선 129.79·132.83로 갱신 — 이 경우 다운로드 제외 선택자 `:not([download])` 복원 권장(아래 1절, 저장 실패 시 내보내기 파일 다운로드까지 보류되는 것을 되돌림) ② 다음 레인에서 감량 ③ 그대로(병합 때 합산 실측으로 Jarvis 정리).

- 몫은 ADR 개정 15 결정 3("각 배분 레인이 eagerKb를 올린다")에 따라 **기준선 증가**로 셌다. base 실측 대비로는 +0.20이다(기존 잡음 흡수분 0.05를 함께 쓴 셈) — Jarvis 판단 필요 시 이 한 줄.
- `scripts/m2cBaseline.json` eagerKb 두 값 · `scripts/bundleBudget.test.mjs` 150-152행 기대값을 같은 커밋에서 갱신, note에 "개정 15 배분 B-RS-01" 한 줄.
- 실측 경과(정직 기록):
  1. 1차 +0.76 — `useDocSave`가 `data/persistence/infra.ts`의 `READ_ONLY_TAB`을 import해 영속 청크가 진입으로 올라옴(설계 실수). import를 빼고 사유 문장 일부 비교로 바꿈 → 129.78/132.82.
  2. **감량 1회**: 다운로드 제외를 `closest` 선택자로 합침 · 수정 키·target 검사 제거 · 비교 문자열 단축 → 129.74/132.77(최종 빌드 129.73/132.76).
  3. Codex r1 반영(수정 키 검사 복원 · Web Locks 판정 추가)으로 129.82/132.85 → **이번 초과분 대상 감량 1회**: 잠금 판정을 저장소 종류 없이 `!navigator.locks`로 · `[target]` 제외 제거(스튜디오에 target 링크 0 — grep) → **129.77/132.80**.
  4. Codex r2 반영(이탈 시작 때 읽기 전용 기록 지움 · 잠금 폴백 local 한정)으로 다시 늘어 → **이번 초과분 감량 1회**: 대기·통과 분기 합침 · 다운로드 제외 선택자 제거 → **129.79/132.83**(몫 상한 초과 — 위 결정 필요). 멈춤.
  - 브리프 규칙 "몫 초과 → 감량 1회"를 초과 사건마다 1회로 읽었다(1차의 import 제거는 실수 교정이라 감량으로 세지 않음). 다르게 읽어야 하면 영환님/Jarvis 판단.

## 1. 바꾼 것 (파일)

| 파일 | 내용 |
|---|---|
| `app/src/components/studio/StudioLayout.tsx` | 기존 `onClickCapture`(링크면 `retry()`만) → 링크 가로채기: 저장할 것이 있으면 `preventDefault` → `save.leave()` 대기 → 성공이면 **같은 링크를 다시 클릭**(Link의 `to`·`state`·`replace` 보존) · 실패면 보류. 기다리는 동안 다시 누름은 무시(연타 1회). 수정 키 클릭은 통과. 다운로드 링크(내보내기 결과)도 저장할 것이 있으면 저장 뒤 같은 링크 재클릭으로 내려받음(**Codex r2 검토 뒤** 바이트 감량으로 제외 선택자를 뺀 것 — Codex 미검토·전용 테스트 없음 · 저장 실패면 다운로드도 보류 · 0절 ①이면 복원 권장). 대기 중 링크가 DOM에서 빠졌으면 다시 누르지 않음 |
| `app/src/features/studio/useDocSave.ts` | `leave()` 추가 — idle·saved면 undefined(바로 이동). 그 밖이면 읽기 전용 기록을 지우고 `retry()`(실패·오프라인도 1회 다시 저장) 직후 단계로 `phase`를 맞춘 뒤 `flushed()` — 저장 중 추가 편집(dirty)은 `check()`가 다시 저장. 결과 false여도 **이번 이탈 중 저장이 읽기 전용 거절**이면 true. 저장 래퍼가 거절 사유(`"탭에서 편집 중"` 포함 = READ_ONLY_TAB) 또는 로컬 저장 + `navigator.locks` 없음(P1C-SPEC 1.5 읽기 전용 폴백)을 기록. `infra.ts`를 import하지 않는 이유 = 영속 청크가 진입으로 올라옴(+0.76 실측) — 문장이 바뀌면 `StudioLeave.test`(실제 상수 사용)가 잡는다. `retry` 타입을 정직하게(`AutosavePhase \| undefined`) |
| `app/src/features/studio/useAutosaveScheduler.ts` | `retry()`가 재시도 직후 단계를 돌려줌(effect 전 판정용). 동작 변경 0 · `dispose` 그대로 |
| `app/src/features/studio/useExportFlow.ts` | effect의 `return flushSave()` → `return void flushSave()` — `retry`가 값을 돌려주자 React가 정리 함수로 오인("destroy is not a function", ExportFlow 1건 실패로 발견). `retry` 타입을 정직하게 바꿔 같은 오용을 tsc가 잡게 함 |
| `app/src/components/studio/StudioLeave.test.tsx` (새) | 13건 — 아래 2절 |
| `app/src/features/studio/useAutosaveScheduler.test.ts` | `retry()` 반환 단계 1건 추가 |
| `app/scripts/m2cBaseline.json` · `bundleBudget.test.mjs` | 0절 |
| `docs/06-handoff/BACKLOG.md` | B-RS-01 행 끝 ✅ 결과 |

- 브리프 금지 파일(`useSectionOps.ts` · `opAfter.ts`) 수정 0 · 엔진 계약·저장 스키마·lock·CLAUDE.md·design/·ADR 수정 0 · 새 의존성 0.

## 2. TDD

- RED 예측: 저장 진행 중 추가 편집 → 링크 → 저장소 제목이 '첫 편집'(마지막 편집 없음). 대기·실패 보류·연타 3건도 즉시 이동으로 실패. 읽기 전용 2건·변경 없음 1건은 현재도 통과.
- RED 결과: **4 failed | 3 passed** — `expected '첫 편집' to be '마지막 편집'`(결함 재현) · 나머지 3건은 `프로젝트 목록`이 이미 보임. 예측과 일치.
- GREEN: 7/7. Codex r1 반영 RED 4건(읽기 전용 재시도 · P1 쓰기 가능해진 탭 · P2 Web Locks 없음 · P2 수정 키) → GREEN 11/11. Codex r2 반영 RED 2건(P1 거절 뒤 오프라인 · P2 잠금 없음 + 메모리 실패) → GREEN 13/13.

| 테스트 (`StudioLeave.test.tsx`) | 단언 |
|---|---|
| 저장 진행 중 추가 편집 → 이동 | 저장소 마지막 문서 = 마지막 편집 · 이동 1회 |
| 저장 전 변경 → 이동 | 저장 끝날 때까지 편집기 유지 → 반영 뒤 이동 1회 |
| 실패 주입 | 이동 보류 · 툴바 "저장하지 못했습니다" · "다시 저장" 버튼 · 다음 클릭 = 다시 저장 → 성공 시 이동 1회 |
| 연타 | 저장 1회 · 이동 1회 |
| 읽기 전용 탭(READ_ONLY_TAB) ×2 | 다시 저장해 보고 거절이면 이동 · 저장소 반영 0 |
| 읽기 전용 거절 뒤 쓰기 가능(Codex r1 P1) | 저장 뒤 이동 · 마지막 편집 반영 |
| Web Locks 없음 + 로컬 저장(Codex r1 P2) | 일반 INFRA 거절이어도 이동 |
| 읽기 전용 거절 뒤 오프라인(Codex r2 P1) | 이번 이탈에 저장 0 → 보류 |
| Web Locks 없음 + 메모리 저장 실패(Codex r2 P2) | 보류 |
| Web Locks 있음 + 일반 실패 | 보류 |
| 수정 키 4종(Codex r1 P2) | `preventDefault` 0 · 저장 0 |
| 변경 없음 | 바로 이동 · 저장 0 |

- 기존 단언 약화 0(`StudioLayout.test.tsx` "링크로 떠나면 바로 저장 1회" · "변경 없으면 저장 0" 그대로 통과).

## 3. 마감 게이트 (마지막 코드 기준)

- 마지막 코드(`7db2c0b`): `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm run build` exit 0(예산 검사 포함, 129.79/132.83) · 전체 `npx vitest --run` 1회 **301 파일 · 2717건 통과**.
- 1차 전체 vitest에서 `ExportFlow.test.tsx` 1건 실패 → 원인 = 1절 useExportFlow 행. 수정 뒤 전체 통과.

## 4. Ego Lite (preview 127.0.0.1:4361 · `qb.mjs` — 1차 `4d878be` 빌드 · 최종 `7db2c0b` 빌드 각 1회)

- 경로: field-undo-1 `qb-flow.mjs`와 같은 앱 안 클릭(카탈로그 → 비교 → 프로필 확정 → 3안 → B안 편집). 1280.
- Hero 제목 입력 → 디바운스(2초) 전 바로 "프로젝트로 돌아가기"(이동 직전 툴바 "저장 전 변경 있음") → `/projects` "편집기 열기" → 제목 확인 **3회 모두 유지**(`… 이탈1` · `이탈2` · `이탈3`).
- 최종 빌드 재실행도 3/3 유지(이동 직전 "저장 전 변경 있음").
- 캡처(PNG 시그니처 확인, 뷰포트 1280×900): `shots/sol-reopen-1280.png` **151,753B**(1차) · `shots/sol-reopen-final-1280.png` **155,632B**(최종).
- 정리(각 실행 뒤): IDB `deleteDatabase("design-studio")` = deleted(공간 11·12) · `finish({keep:[]})` · `listTaskSpaces()` = `[]` · preview 종료 · 4361 LISTEN 0.
- 한계: 실제 브라우저에서 "저장 중 추가 편집"을 사람 손 속도로 재현하기는 어렵다(로컬 저장은 수 ms) — 이 Ego 확인은 수정 전 코드에서도 통과했을 가능성이 높다. 결함 경로는 컴포넌트 테스트(지연 저장소)가 단언.

## 5. Codex

- r1(`logs/codex-r1.txt`): P1 1 · P2 2 — 전부 반영(1절·2절).
  - P1 지난 읽기 전용 거절로 다음 이탈 저장을 건너뜀 → 늘 저장해 보고 이번 결과로 판정.
  - P2 수정 키 클릭이 새 탭 열기 대신 이 탭 이동으로 바뀜 → 가로채지 않음.
  - P2 Web Locks 없는 읽기 전용 폴백은 일반 INFRA 문장이라 판정 못 함 → `navigator.locks` 없음도 읽기 전용.
- r2(`logs/codex-r2.txt`): P1 1 · P2 1 — 전부 반영(`7db2c0b`), 브리프 상한 2라운드라 r3 없음.
  - P1 읽기 전용 거절 뒤 오프라인이면 `retry()`가 저장을 안 해 지난 거절로 이동 허용 → `leave()` 시작 때 기록을 지움.
  - P2 Web Locks 없음 판정이 메모리 저장 실패(청크 로드 실패 등)까지 통과시킴 → `local`일 때만.
  - r2 반영분은 Codex 재검증 없음(상한) — 회귀 테스트 2건 RED→GREEN과 전체 게이트로만 확인.

## 6. 범위 밖 · 한계 (현황만)

1. **탭 닫기·새로고침(`beforeunload`)**: 지금 동작 유지 — `needsUnloadGuard`(메모리 늘 · 로컬은 저장 전 변경·저장 중·실패·오프라인·STALE)일 때 브라우저 떠나기 경고. 저장 대기는 하지 않는다.
2. **브라우저 뒤로가기(popstate)·편집기 밖 이동**: data router가 아니라(`main.tsx` BrowserRouter · `useBlocker` 불가) 막지 못한다. 편집기는 앱 GNB 대신 자체 툴바라 편집기 안 앱 링크는 모두 이 경로를 탄다. 스케줄러 `dispose`는 바꾸지 않았다 — unmount 때 저장을 붙이면 진행 중 저장과 같은 revision으로 겹쳐 STALE이 날 수 있고 기존 단언("dispose 뒤 저장 1회")과 충돌.
3. **프로그램 이동**: studio 경로의 `navigate(` 0건(grep — `useStudioDoc.ts`는 주석, `testing/openStudio.tsx`는 테스트 도구).
4. **낡은 탭(STALE_TAB)·지워진 탭(CLEARED_TAB)**: 브리프 요구는 읽기 전용만이라 이동 보류 그대로(새로고침이 출구). 필요하면 별건.
5. **섹션 연산(삭제 등)이 청크 로드를 기다리는 중 링크**: 그 편집은 아직 화면 문서에 없어 범위 밖(`useSectionOps.ts` 수정 금지).
6. **수정 키 클릭(새 탭)**: 원래 탭의 미저장 편집은 그대로 남고 자동 저장이 이어진다(이동 아님).
7. **오프라인**: 스케줄러는 저장소 종류와 상관없이 `navigator.onLine`이 false면 저장하지 않는다 → 로컬(IDB) 저장이어도 오프라인이면 편집기 안 링크 이동이 온라인이 될 때까지 보류(툴바 "오프라인 — 연결되면 저장합니다"). 데이터 보호 쪽이지만 사용자는 갇힌 듯 느낄 수 있다.
8. 보류 때 새 알림 문장은 넣지 않았다 — 저장 상태가 "저장하지 못했습니다" + "다시 저장"을 보이고, 실패 시작이면 기존 alert 1회. 이미 실패 중이던 상태에서 다시 실패하면 낭독 없음(기존 규칙 "연속 실패 알림 1회").

## 7. 커밋

- `09e9e05` PROGRESS 시작 · `4d878be` 구현 · `5d6ff9e` Codex r1 반영 · `7db2c0b` Codex r2 반영 · 문서 커밋(REPORT·PROGRESS·BACKLOG·로그·캡처). push·merge 0.
