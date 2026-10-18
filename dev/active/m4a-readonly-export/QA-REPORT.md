# M4-a-7 QA-REPORT — B-M4A-12 읽기 전용 탭 내보내기 독립 검증

> 상태: **마감**. 대상 tip `ef73f7e3`(base `36e825a6`). 정적·회귀만 — 브라우저·Codex 0. 사실/추정 구분.

## 판정 — **PASS with notes**
- 1 게이트·예산 PASS(3148/3148 · 128.79/131.77 증분 0 · infra 참조 0) · 2 판별·변이 PASS(M1·M2·M3 FAIL로 잡힘) · 3 거짓 성공/사유 0 PASS · 4 막힘 없음 · 5 약화 0.
- 노트(차단 아님): **N1** STALE_TAB·CLEARED_TAB retryable 고정 단언 없음(M3b 생존) · **N2** 읽기 전용 결과 문구에 회복 안내("그 탭을 닫은 뒤…") 없음 — restartText와 불일치.

## 1. fresh 게이트·예산 — **PASS** [사실]
- `cd app && npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm test -- --run` **356 files / 3148 tests passed**, exit 0 · `npm run build` exit 0. 원문 `logs/qa/{typecheck,lint,test,build}.txt`.
- 예산(build 출력 `check-bundle-size`): `/studio` 해시 정규화 **128.79KB**(기준선 128.79) · 복원 **131.77KB**(기준선 131.77) — `main` = base `36e825a6`(`git rev-parse main` = merge-base) 기준선과 같음, 증분 0. raw 130.10/133.13은 해시 이름 흔들림(참고값).
- `app/dist/assets/StudioLayout-Ca8hy5Xw.js`의 `assets/infra-` 참조 **0** · `dist/assets`에 `infra-*` 공유 청크 자체가 없음.

## 2. 판별 정확성·변이 — **PASS (노트 1)** [사실]
- 코드: `app/src/features/studio/exportFlow.ts:125` `code === "INFRA" && message.endsWith(READ_ONLY_TAB)` → `refused READ_ONLY`, 바로 다음 줄에서 나머지 INFRA·JOB_TIMEOUT·NETWORK·UNKNOWN = `retryable`(기존 그대로). 순서상 판별이 retryable 분기보다 먼저라 정확.
- 값 복제: `exportFlow.ts:81` 상수 = `data/persistence/infra.ts:26` `READ_ONLY_TAB` = `restartText.ts:14` `TAB_REASON.readonly` — 세 문자열 동일(grep 확인).
- 변이(대상 2파일 `exportFlowReadonly.test.ts`·`ExportFlow.test.tsx` 22건, 매번 `git checkout -- src` 후 `git status` 빈 값):

| 변이 | 결과 | 잡은 테스트 |
|---|---|---|
| M1 상수 한 글자(`다른`→`타른`) | **FAIL 2** | 2탭 리그 toEqual · alert 문구 정확 일치 |
| M2 판별 줄 제거 | **FAIL 2** | 같음 |
| M3 `code === "INFRA"` 전부 refused로 확대 | **FAIL 1** | 그 밖 INFRA(quota·사유 없는 INFRA) = retryable |
| M3b `includes("다른 탭에서")`로 확대(STALE_TAB까지 READ_ONLY 오분류) | **생존** — 대상 2파일 22/22, 전체 3148/3148 | 없음 |

- **노트 N1 (P3, 테스트 공백 — 현 코드 결함 아님)**: `STALE_TAB`·`CLEARED_TAB`(같은 INFRA·같은 flush 경로)이 retryable로 남는다는 단언이 없다. 현 코드는 `endsWith` 정확 일치라 오분류 0이지만, 판별을 느슨하게 바꾸는 회귀를 못 잡는다. 권고: `exportFlowReadonly.test.ts` 회귀 케이스에 `toInfra(undefined, "저장", STALE_TAB)`·`CLEARED_TAB` → retryable 2줄. 원문 `logs/qa/mut-*.txt`.

## 3. 거짓 성공 0 · 거짓 사유 0 — **PASS** [사실]
- `ExportAfter.tsx:128-133` refused + `reason` → 제목 "내보내지 못했습니다"(= `ExportRetryAlert` 기존 문구) · 본문 `result.reason` = `READ_ONLY_TAB`(기존 문구). 새 문구 0.
- "품질 게이트 차단…" 기본 제목: `reason`이 있으면 삼항 첫 갈래에서 끝나 나오지 않음. 테스트 `ExportFlow.test.tsx` alert `textContent` **정확 일치**(`내보내지 못했습니다${READ_ONLY_TAB}`)가 고정 — 변이 M4(reason 제목 갈래 제거 → 게이트 제목) **FAIL 1**, M5(본문 `{result.reason}` 제거) **FAIL 1**.
- 거짓 성공: refused 경로는 `return` 전 `export_failed`만 내고 `snapshot_created`·`export_succeeded` 0(코드 `exportFlow.ts:118-126`). 테스트가 `/만들었습니다/` 0·"다시 시도" 0을 단언. Ego `logs/ego-E2.txt` 재판독: p2 ev = `export_requested`→`export_failed: INFRA`, status `[]`, alert = 위 문구, `p2 retry buttons 0`.
- 쓰기 탭 회귀 0: 2탭 리그에서 쓰기 탭 = `done`(테스트) · Ego p1 = `snapshot_created`·`export_succeeded`·zip 내려받기. STALE_DOC·GATE_FAILED 제목 회귀 테스트 2건 통과(reason 없음 → 기존 갈래). 전체 3148 통과.
- 참고(사실): 계측 `export_failed` 사건 reason은 여전히 `INFRA`(결과 code만 `READ_ONLY`) — 계측 의미 변화 0.

## 4. restartFlow 불일치 검토 — **사용자를 막지 않음 · 문구 보강 권고(P3)** [사실 + 추정 구분]
- [사실] 막힘 여부: 결과 refused 뒤에도 내보내기 버튼은 살아 있다 — `ExportButtons.tsx:27` `aria-disabled`는 게이트·구조 이유(`blocked`)나 `busy`일 때만. `useExportFlow.ts:43` 새 `start`가 결과를 비우고 다시 요청한다. `writerLock.ts:50-54` `enter()`는 `readonly`면 잠금을 다시 요청 → 쓰기 탭을 닫은 뒤 같은 버튼을 다시 누르면 flush가 통과할 수 있다. 즉 "다시 시도" 버튼이 없어져도 경로는 열려 있다.
- [사실] 다만 지금 문구(`READ_ONLY_TAB` "…이 탭의 변경은 저장하지 않습니다")는 **어떻게 풀리는지**를 말하지 않는다. 같은 사유를 `restartText.ts:47·69`는 "— 그 탭을 닫은 뒤 다시 시도하세요"로 안내한다(`restartFlow.ts:51` `retry: true`). 두 화면이 같은 원인에 다른 회복 안내를 준다.
- **권고 N2 (P3, 후속)**: 본문을 "다른 탭에서 편집 중이라 내보내지 않았습니다 — 그 탭을 닫은 뒤 다시 내보내세요"류로 보강(restartText 패턴). 이번 BRIEF가 "새 문구 0"이라 이번 diff에서는 기존 문구 재사용이 맞고, 거짓 사유는 아니므로 차단 사유 아님. 문구 추가 시 진입 청크가 아닌 `ExportAfter`(lazy)에만 두면 예산 영향 0일 것 [추정 — 미측정].
- [추정·미확인] 쓰기 탭을 닫은 뒤 읽기 전용 탭이 쓰기 탭이 될 때 그 탭 메모리 문서가 디스크보다 낡았으면 `stale`로 갈 수 있다(그때는 STALE_TAB → 현재 retryable "다시 시도"). 브라우저 금지라 실측 안 함 — Developer REPORT 노트(stale·cleared 사유 없는 "다시 시도")와 같은 범위 밖 항목.

## 5. 바뀐 기존 단언 이전/이후 — **약화 0** [사실]
`git diff --numstat 36e825a6 ef73f7e3 -- app/`:

| 파일 | +/− | 기존 단언 변경 |
|---|---|---|
| `components/studio/ExportFlow.test.tsx` | +25 / −0 | 0 — import 1줄 + 신규 describe 3건만 추가 |
| `features/studio/exportFlowReadonly.test.ts` | +38 / −0 (신규) | 해당 없음 |
| `features/studio/exportFlow.ts` | +7 / −1 | 테스트 아님 — `refused` 타입에 선택 `reason` 추가(−1줄 = 타입 줄 교체) |
| `components/studio/ExportAfter.tsx` | +6 / −1 | 테스트 아님 — Callout 한 줄을 reason 갈래 포함으로 교체 |

- 삭제된 테스트 줄 0, 바뀐 기존 `expect` 0, skip/only 추가 0 → 이전/이후 비교할 기존 단언 자체가 없음.

## QA 커밋
- 41a90d65 QA-BRIEF·QA-PROGRESS · 07e59789 QA-REPORT 초안 · 051bedd1 항목 1 · ae876519 항목 2·3 · (이 커밋) 항목 4·5·판정
- 앱·테스트 코드 커밋 0. 변이 7회(M1·M2·M3·M3b×2·M4·M5) 모두 `git checkout -- src`로 되돌림, 매회 `git status --short src` 빈 값.
