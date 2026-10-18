# M4-a-7 REPORT — B-M4A-12 읽기 전용 탭 내보내기: 거짓 "다시 시도" 제거

> 상태: **마감**. 사실/추정/미확인을 구분한다.

## 결론
- [사실·Ego E2] **두 번째(읽기 전용) 탭 내보내기 = "내보내지 못했습니다 · 다른 탭에서 편집 중입니다 — 이 탭의 변경은 저장하지 않습니다", "다시 시도" 0개.** 쓰기 탭(p1) 같은 문서 zip = 성공(snapshot_created·export_succeeded). 근거 `logs/ego-E2.txt`.
- [사실·예산] `/studio` 정규화 128.79 → **128.79(+0.00)** · 복원 131.77 → **131.77(+0.00)** — 감량 1회 뒤(1차 +0.01). 남은 M4-a 몫 0.01 그대로.
- [사실·게이트] typecheck·lint·test(356 files · 3148 tests)·build 모두 exit 0 (fresh).

## E0 — 두 번째 탭 INFRA 경로 [사실 — 코드 + M4-a-6 Ego L4 로그]
- **BRIEF 가설(`data/memoryDocBook.ts:288` runJob 생성기 예외 → INFRA)은 아니다.** `m4a-retry-fix/logs/ego-L4.txt:13` p2 이벤트 = `export_requested` → `export_failed: INFRA`이고 **`snapshot_created`가 없다**. runJob 경로라면 `requestExport`가 먼저 resolve돼 `snapshot_created`가 찍힌다(`exportFlow.ts:100`). `staticHtml-*` 200 = 판정·메모리 커밋은 성공하고 finally의 runJob도 돌았다.
- 실제 경로: `memoryProjectRepository.ts:143-144` `requestExport` = `kept(...)` → `kept`(`:65-66`)가 작업 뒤 `local.sync().flush` → `localSync.ts:195-198` flush: 쓰기 탭이 아니면 `gate.enter()` → `"readonly"` → `blocked("readonly")`(`:85`) = `ProjectRepositoryError("INFRA", "저장 — " + READ_ONLY_TAB)` → `exportFlow.ts:115-120` catch: INFRA → `{ kind: "retryable" }`(사유 없음) → `StudioLayout.tsx:378` `ExportRetryAlert` "내보내지 못했습니다 + 다시 시도".
- `writerLock.ts:5·50-53`: readonly는 고정이 아니다 — 다음 `enter`에서 잠금을 다시 요청한다(쓰기 탭을 닫으면 다시 시도가 성공할 수 있음). `restartFlow.ts:51`은 같은 사유를 `retry: true` + "그 탭을 닫은 뒤 다시 시도하세요"로 다룬다. BRIEF RED는 "다시 시도 없음"이라 BRIEF를 따른다 — 불일치 기록.

### 연결점 표 — 읽기 전용 판정을 아는 곳 ↔ 내보내기
| 위치 | 아는 것 | 청크 | 내보내기와 연결 |
|---|---|---|---|
| `data/persistence/writerLock.ts` `gate.mode`/`enter()` | writer·readonly·stale·unsupported | 조작 뒤(DocBook) | flush 거절의 근원 |
| `data/persistence/localSync.ts:85·195` `blocked(mode)` | INFRA 메시지 끝 `READ_ONLY_TAB`(`infra.ts:26`) | 조작 뒤 | `kept` flush로 requestExport가 거절됨 |
| `features/studio/save/*` `view().reason` = `readonly` → `reasonText.ts` | 저장 시도 뒤에만 | 조작 뒤 | 내보내기와 연결 0(저장 상태줄만) |
| `features/profile/restartFlow.ts:51` `message.endsWith(TAB_REASON.readonly)` | 같은 메시지 판별 선례 | 조작 뒤 | 판별 방식 재사용 근거 |
| `features/studio/exportFlow.ts:115-120` catch | INFRA만 봄(메시지 안 봄) | 조작 뒤(exportFlow) | **연결점 — 여기서 읽기 전용을 가른다** |
| `components/studio/ExportRetryAlert.tsx` | reason만 | **진입(StudioLayout)** | 건드리지 않는다(남은 몫 0.01, 분기 1개 ≈ 8B) |
| `components/studio/ExportAfter.tsx` `ExportResultView` | refused code | 조작 뒤(lazy) | 읽기 전용 결과 표시 자리 |

## 최소안 — (b) 변형: 결과를 재시도 불가로 · 진입 청크 변경 0
- `exportFlow.ts` catch: `code === "INFRA" && message.endsWith(READ_ONLY_TAB)` → `{ kind: "refused", code: "READ_ONLY" }`(재시도 불가). `StudioLayout`의 기존 조건(`kind !== "retryable"`)으로 lazy `ExportAfter`에 간다 — 진입 청크 변경 0.
- `ExportAfter.tsx` refused 분기 추가(기본 제목이 "품질 게이트 차단…"이라 그대로 두면 거짓 사유): 제목 = 기존 "내보내지 못했습니다", 본문 = 기존 `READ_ONLY_TAB`. "다시 시도" 없음.
- (a) 요청 전 사유 표시는 읽기 전용 판정을 진입(StudioLayout·ExportButtons)에 끌어와야 해 진입 증분이 생긴다 → 기각.
- 문구: 새 문구 0 — 제목 `ExportRetryAlert` "내보내지 못했습니다", 본문 `data/persistence/infra.ts:26` `READ_ONLY_TAB`(= `restartText.ts` `TAB_REASON.readonly`).

## 예산
| 경로 | 기준(36e825a6, `logs/budget-base.txt`) | 추정 증분 | 실측 |
|---|---|---|---|
| `/studio` 정규화 | 128.79 | 0(진입 변경 0) | 1차 **128.80(+0.01)** → 감량 뒤 **128.79(+0.00)** |
| `/studio` 복원 정규화 | 131.77 | 0 | 1차 131.78(+0.01) → 감량 뒤 **131.77(+0.00)** |
- 1차 원인(manifest): `exportFlow.ts`가 `data/persistence/infra.ts`를 import하자 Rollup이 공유 청크 `infra-*.js`(0.51KB gzip)를 새로 만들고, 진입 `StudioLayout-*`의 동적 import preload 목록에 그 경로가 붙었다(+0.01). 판정선(+0.01 **초과** 시 감량)은 넘지 않았으나 남은 몫 0.01을 전부 쓰므로 **선제 감량 1회**: restartText `TAB_REASON` 선례(RS-R8)대로 값만 `exportFlow.ts`에 두고 일치는 `exportFlowReadonly.test.ts`(결과 reason = infra `READ_ONLY_TAB` toEqual)가 고정. 감량 뒤 `StudioLayout-*`의 `assets/infra-` 참조 0, 공유 청크 0.
- raw 130.10 / 133.13(기준 130.09 / 133.12) — 해시 이름 흔들림(M4-a-6 QA 노트 5와 같은 성질) [추정].

## 수정 (TDD) — 커밋 43433764
- `features/studio/exportFlow.ts`: catch에서 `INFRA` + 메시지 끝 `READ_ONLY_TAB` → `{ kind: "refused", code: "READ_ONLY", reason }`. `refused`에 선택 `reason` 필드. 그 밖 INFRA는 그대로 retryable.
- `components/studio/ExportAfter.tsx`: refused에 reason이 있으면 제목 "내보내지 못했습니다" + 본문 reason(없으면 기존 STALE_DOC·게이트 제목 그대로).
- 진입 청크(`StudioLayout`·`ExportRetryAlert`) 변경 0.
- RED `logs/red-1.txt`(신규 2건 실패: 실제 2탭 리그 = retryable · 화면 = "내보내지 못했습니다다시 시도") → GREEN `logs/green-1.txt`(22/22).
  - `features/studio/exportFlowReadonly.test.ts`: 가짜 Web Locks 2탭(`save/testRig` startedRig·otherTab) 실제 lock·flush 경로. 리그 시드 문서는 게이트 차단이라 `judgeExport`만 통과로 mock(잠금·flush는 실제). 쓰기 탭 = done · quota·일반 INFRA = retryable(회귀).
  - `components/studio/ExportFlow.test.tsx` 신규 3건: 읽기 전용 alert 문구 정확 일치 · "다시 시도" 0 · 성공 표시 0 / STALE_DOC·GATE_FAILED 제목 회귀 0.

## Codex (adversarial 1회 — `--scope branch --base 36e825a6`, 원문 `logs/codex-r1.txt`, 재실행 0)
- 판정 **approve · No material findings**. 검토 범위: INFRA 끝문구 판별 · 쓰기 탭 경로 · 거짓 성공 · 다른 INFRA 사유 오분류 · 복제 상수 동기화 테스트.
- 반영 1회 = 반영할 지적 0. Codex 쪽 테스트 재실행은 샌드박스 EPERM으로 차단됐다고 적었다 — 같은 내용(43433764)의 fresh 전체 스위트는 `logs/test.txt`(3148 passed)가 근거.

## Ego Lite (preview `--port 4400 --strictPort`, Ego 3회 실행 — 6턴 한도 안)
- 1·2회: 스크립트 클릭 실패(덮개 div 포인터 가로챔 · 버튼 렌더 전) → 이름으로 기다렸다 DOM click하도록 고침. 3회: 단언 전부 수집, 마지막 스크린샷만 "창 최소화"로 실패(그래서 `task.finish` 미도달 — 태스크 스페이스 정리 안 됨).
- preview 종료 확인: `lsof -iTCP:4400 -sTCP:LISTEN` 0줄.

## 노트 (범위 밖 — 기록만)
- [사실 — 코드] p2 메모리 DocBook은 flush 거절 전에 "내보내기 전" 스냅샷·잡·멱등 기록을 커밋한다(`memoryDocBook.ts` judgeAndWrite → kept flush 거절). 저장되지 않는 유령 스냅샷이 그 탭 메모리에 남는다 — `data/**` 쓰기 경로 밖, BACKLOG 후보.
- stale·cleared 사유도 같은 flush 경로(`exportFlow` 사유 없는 "다시 시도") — 범위 밖, 노트.

## 커밋
- 1fee194f BRIEF·PROGRESS
- aff3f3f9 REPORT 초안(E0)
- 43433764 수정(TDD)
- 5555fab5 게이트·Ego 로그
- 30aadf27 REPORT·PROGRESS 마감
- (이 커밋) 예산 문구 정정
