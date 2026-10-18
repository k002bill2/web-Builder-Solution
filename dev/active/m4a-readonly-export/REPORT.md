# M4-a-7 REPORT — B-M4A-12 읽기 전용 탭 내보내기: 거짓 "다시 시도" 제거

> 상태: **초안(E0)**. 사실/추정/미확인을 구분한다.

## 결론
- (E1 뒤 채움)

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
| `/studio` 정규화 | 128.79 | 0(진입 변경 0) | (E1 뒤) |
| `/studio` 복원 정규화 | 131.77 | 0 | (E1 뒤) |
- 판정선: 남은 M4-a 몫 0.01. infra.ts import가 공유 청크를 새로 만들어 진입·자동 그래프에 붙지 않는지 manifest로 확인한다.

## 노트 (범위 밖 — 기록만)
- [사실 — 코드] p2 메모리 DocBook은 flush 거절 전에 "내보내기 전" 스냅샷·잡·멱등 기록을 커밋한다(`memoryDocBook.ts` judgeAndWrite → kept flush 거절). 저장되지 않는 유령 스냅샷이 그 탭 메모리에 남는다 — `data/**` 쓰기 경로 밖, BACKLOG 후보.
- stale·cleared 사유도 같은 flush 경로(`exportFlow` 사유 없는 "다시 시도") — 범위 밖, 노트.

## 커밋
- 1fee194f BRIEF·PROGRESS
