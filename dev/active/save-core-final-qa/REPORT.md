# save-core-final-qa REPORT — 수정본(3652a8f) 최종 독립 QA 1회

- 브랜치 `k002bill2/save-core-final-qa` · base `3652a8f`. 쓰기 = `dev/active/save-core-final-qa/`만.
- 코어·하네스 테스트·QA 반례·QA 프로브·제품 `app/` 변경 0. 새 의존성 0. merge/push 0. Codex 자동 실행 0(Developer 1회 기존분 `save-core-fix/rawlogs/codex-review.txt`).
- **판정 범위 = 격리 하네스 + 코어×제품 IDB 어댑터×실제 Web Locks 프로브.** 아래 core PASS는 제품 PASS가 아니다. 제품 미통합(DocBook·localSync·스케줄러·React) · 번들 크기/성능 미측정.
- 근거 출처 표기: **[trace]** = 코드 읽기 · **[메모리]** = vitest + 제품 `createMemoryPersistence` · **[실제IDB]** = ego-browser 실제 IndexedDB·`navigator.locks` 수동 1회.

## 0. 결론

| H | 판정 | 근거 |
|---|---|---|
| H1 Blob 바인딩·직렬 저장 | **PASS(하네스)** | [메모리] 37×2 · CE-2 GREEN · [실제IDB] 바인딩 동결(D1+X 커밋) |
| H2 confirm 증명 | **PASS(하네스)** | [메모리] 37×2(M9 kill 테스트 포함) · [실제IDB] reload 뒤 wrote:false `confirmed gen1 fresh` |
| H3 이미지 원자 쓰기 | **PASS(하네스) + 실제 IDB 롤백 재확인** | [실제IDB] DataCloneError → save failed · 문서 A gen1·bytes-A 그대로 |
| H4 다른 탭·낡은 증명 | **PARTIAL 유지(제품 미통합) · CE-3a 다른 어댑터 객체 PARTIAL · liveness 미보장 LV-1(3절)** | [실제IDB] 2탭 readonly → B 닫힘 → A `stale`·B2 보존. 단 같은 탭·같은 DB의 어댑터 2개는 같은 세대 2회 saved(BD-1, 4절) |
| H5 discard/replace | **PASS(하네스 · 안전성) — QA FAIL 회수 / liveness 미보장 LV-2(3절)** | [메모리] CE-1·CX-3 GREEN ×2 · [실제IDB] discard 경쟁 save `failed:discarding`·IDB A. 단 liveness 2건은 별도(3절) |

- CE별: CE-1 **PASS** · CE-2 **PASS** · CX-3 **PASS** · CE-3a **PASS(같은 객체) / PARTIAL(다른 객체)** · CE-3b·CE-4·CE-5·CE-6·OBS-1·OBS-2 관측값 불변.
- **새 증상**: 없음(새 결함 0). 새로 확인한 것은 이미 save-core-fix REPORT 5절이 적은 성질의 실측뿐이다(LV-1·LV-2·BD-1·BD-2).

## 1. 독립 재실행 (fresh, `rawlogs/EXIT-MANIFEST.txt`)

| 명령 (저장소 루트) | 결과 | 로그 |
|---|---|---|
| `(cd app && npm ci)` → `git status --porcelain app \| wc -l` | exit 0 · 0 | `npm-ci.txt` |
| `vitest run --config dev/active/save-core-harness/vitest.config.mjs --reporter=verbose` ×2 | **37 passed (37) · exit 0 ×2** (h1 3·h2 5·h3 4·h4 4·h5 7·h6 14) | `harness-run{1,2}.txt` |
| `vitest run --config dev/active/save-core-qa/vitest.config.mjs --reporter=verbose --silent=false` ×2 | **10 passed (10) · exit 0 ×2** | `qa-run{1,2}.txt` |
| `tsc --noEmit -p` 하네스 / QA / 이 폴더 | exit 0 / 0 / 0 | `harness-tsc` · `qa-tsc` · `finalqa-tsc` |
| `eslint --config app/eslint.config.js` 하네스 core·test / QA test / 이 폴더 test·probe | exit 0 / 0 / 0 | `*-eslint.txt` |
| `grep -l "Errors\|Unhandled" rawlogs/*-run*.txt` | 일치 0(grep exit 1) | 수기 |

- **예상 delta = 실제** (`scope-delta.txt`): save-core-fix 최종 로그와 테스트 이름 목록 diff 0(하네스·QA) · QA `[QA]` 관측 10줄 diff 0. 하네스 23→37은 `h6.test.ts` 14건 추가뿐(`git diff --stat 78e3c52 3652a8f -- save-core-harness/test` = h6 1파일).
- **QA 원본 단언 변경 0**: `git diff --stat 78e3c52 3652a8f -- dev/active/save-core-qa` 빈 출력.
- **제품 scope**: `git diff --stat 5b7d026 HEAD -- app` 빈 출력.

## 2. 좁힌 수정 코드 경계 확인 [trace] — `save-core-harness/core/saveCore.ts`

| CE | 위치 | 확인 |
|---|---|---|
| CE-1 | :204 재진입 거절 · :209 첫 await 전 동기 `discarding = true` · :223 `finally` 해제 · :133 save 진입 거절 | 읽기 throw·blocked·discarded 모든 경로에서 finally 해제. confirm dirty 경로는 save 경유라 같은 거절. edit·replace는 막지 않음 → :216 mark 검사로 `blocked{newer}` |
| CE-2 | :141-143 `target = doc; bound = attached; submitted = mark` 같은 동기 구간 · :93 snapshot 동결 | edit·replace는 늘 새 Map·동결 doc 할당(:233-234, :242-244) → 참조 캡처 = 사본 |
| CX-3 | :129 settle 시 커밋 imageIds ∩ bound만 `committedBlobs` · :219 discard 성공 시 `attached = committedBlobs` | 실패·blocked 경로는 바인딩 보존. delete op 0 |
| CE-3a | :99-104 `WeakMap<StudioPersistence, Promise>` · :148 `exclusive(persistence, commit)` | **키 = 어댑터 객체 정체성.** 같은 DB라도 다른 객체면 직렬 아님(4절 BD-1). 구간이 write resolve까지 포함 → LV-1 |

## 3. liveness — 하네스 PASS와 분리 (제품 gate 결정 필요)

자기 폴더 관찰 테스트 `test/finalqa.test.ts` 4건, 별도 명령 `vitest run --config dev/active/save-core-final-qa/vitest.config.mjs` **4 passed ×2 · exit 0**, 관측 줄 2회 동일(`finalqa-run{1,2}.txt`). 실패 단언 없음 = 관측 고정(OBS). [메모리]

| ID | 관측(원문 `[FQA]`) | 의미 |
|---|---|---|
| **LV-1** 코어 간 직렬 | 같은 영속 인스턴스, A write 보류 중 200 tick: `during {a:false, b:false, writesSeen:1}` → 해제 뒤 `a saved:gen1 · b failed:stale` | 한 코어의 write가 끝나지 않으면 같은 인스턴스의 다른 코어 save는 **타임아웃 없이 무기한 대기**. 해제되면 안전하게 stale |
| **LV-2** discard 읽기 정지 | 첫 읽기 보류 중 `saves [failed:discarding ×3] · confirm failed:discarding · edit 수용(mark 2) · writes 1(추가 0)` → 해제 뒤 `discard blocked:newer · save saved:gen2 · stored B` | discard 읽기가 끝나지 않으면 save·dirty confirm은 **계속 거절**(자동 재시도 없음). 편집은 보존되고 해제 뒤 회복 |

- 둘 다 실제 IDB에서는 트랜잭션 무응답이 전제다. 실제 IDB 재현은 하지 않았다(재현 수단 없음).
- 타임아웃·취소·자동 재시도는 제품 API/스케줄러 결정이다(범위 밖, 제품 수정 요구 아님).

## 4. 정책·API 경계 반례 — 제품 수정 요구 아님

| ID | 출처 | 관측 | 경계 |
|---|---|---|---|
| **BD-1** CE-3a PARTIAL | [메모리] 같은 저장소 위 `{...persistence}` 객체 2개 + 공유 gate | 같은 객체 대조 `saved:gen2 / failed:stale · stored c1` · **다른 객체 `saved:gen2 / saved:gen2 · stored c2`** | 진짜 원자 세대 read+write(IDB readwrite 트랜잭션 안 조건부 쓰기)는 제품 `StudioPersistence` API 변경 필요(G3). 하네스는 같은 인스턴스만 보장 |
| BD-1 실제 | [실제IDB] 같은 DB 이름에 `openIdbPersistence` 2회 + 같은 페이지 gate | `r ["saved:gen2","saved:gen2"] · idb c2 gen2` | 실제 IDB에서도 같은 세대 2회 saved — c1 커밋 소실. 도달 조건 = 한 탭이 같은 DB 어댑터를 2개 여는 제품 경로(미통합이라 존재 여부 미확인) |
| **BD-2** OBS-2 | [메모리] 프로젝트 q가 커밋한 `img-x`를 p가 바인딩 없이 참조 | `q saved:gen1 · p saved:gen1 · confirm confirmed · bytes bytes-q` | 이미지 존재 확인이 프로젝트를 구분하지 않음(id 정책 = `projectId/localId`면 비도달). 수정 뒤에도 그대로 |

## 5. 실제 브라우저 IndexedDB · Web Locks (재실행함, 수동 1회 — 자동 suite 아님)

- 도구: ego-browser TaskSpace 24(끝 `finish({keep:[]})`). origin **`http://127.0.0.1:4367`만**. 선행: `pwd` = 이 worktree · `lsof 4367` exit 1 · pgrep exit 1(`browser-precheck.txt`). 사용자 5480 접근 0.
- 결합: 하네스 코어(읽기 전용 import) + 제품 `openIdbPersistence` + 제품 `createWriterGate(navigator.locks, fresh = async () => true)`. DocBook·스케줄러·React 미결합.

### 5-1. 기존 QA 프로브 (`save-core-qa/browser/`, 변경 0) — `browser-probe-existing.txt`

DB `save-core-qa-finalqa-1791914266597`(기존 guard 접두어 `save-core-qa-`). 기동 전 `databases []`.

| # | 단계 | 관측 | 앞 QA(aa3784e)와 |
|---|---|---|---|
| 1 | save A + img | `saved gen1` · 재읽기 `A gen1 hashOk bytes-A` | 같음 |
| 2 | reload → 새 코어 confirm | hydrated gen1 → `confirmed gen1 fresh` | 같음 |
| 3 | 새 페이지 abort(DataCloneError) | `INFRA: 저장 — …` · **A gen1 · bytes-A 그대로**(롤백) | 같음 |
| 4 | abort 뒤 reload | gen1 · bytes-A | 같음 |
| 6–10 | A 열기 → B(p2) save | B `saved gen2` · held `[design-studio-writer]` · A confirm `failed readonly` | 같음 |
| 11–13 | B 페이지 close | held `[]` · A confirm **`failed stale`** · A dirty save **`failed stale`** | 같음 |
| 14 | reload 최종 | `B2 gen2` 보존 · confirm `confirmed gen2` | 앞 QA는 `readonly`(이전 페이지 잠금 해제 타이밍) — 판정 무관 |
| 15–17 | cleanup | `deleted` · `databases []` · locks `[]` | 같음 |

### 5-2. 자기 프로브 (`save-core-final-qa/browser/`, 접두어 `finalqa-`, 페이지당 gate 1개) — `browser-probe-finalqa.txt`

| # | 시나리오 | 관측 |
|---|---|---|
| 1 | **discard 경쟁**(CE-1 수정): A gen1 → edit B(+img) → `discard()` 직후 `save()` | `discard discarded · save failed:discarding · confirm confirmed:gen1 · view A clean blob none · IDB A gen1` — 폐기 초안 부활 0, 폐기 Blob 바인딩 제거(CX-3) |
| 2 | **binding 동결**(CE-2 수정): D1(img=X) save가 writer.mode 대기 중 D2(img=Y) | `saved:gen1 · dirty true · IDB D1 · bytes X` — 제출 doc과 Blob 같은 시점 |
| 3 | BD-1 실제(4절) | `saved:gen2 ×2 · c2 gen2` |
| 5–6 | cleanup | 3 DB `deleted` · `databases []` |

- 종료 readback(`browser-cleanup.txt`): vite 2개 kill 뒤 `lsof 4367` exit 1 · pgrep exit 1 · TaskSpace finished.
- 한계: 같은 브라우저 프로필의 페이지 2개(탭 크래시·브라우저 재시작·quota 미실행) · `unsupported`(locks 없음) 미실행 · 페이지 수명 동안 gate가 잠금 보유(`4-locks held`).

## 6. 남은 것 (정직 표기)

1. **제품 미통합**: DocBook·localSync·스케줄러·React 미연결(G1·G2·G7·G8). core PASS ≠ 제품 PASS. 번들·성능(이미지마다 Blob 재읽기) 미측정.
2. **CE-3a PARTIAL**: 다른 어댑터 객체 → 같은 세대 2회 saved([메모리]·[실제IDB] 둘 다 재현). 해결은 제품 API 변경(조건부 쓰기) 또는 "탭당 어댑터 1개" 통합 규칙 — Jarvis 결정.
3. **liveness LV-1·LV-2**: 타임아웃 없음. 제품 gate(스케줄러 재시도·타임아웃) 결정 필요.
4. **기존 관찰 유지**: OBS-1(stale 뒤 재열기 외 회복 없음) · CE-4(동시 confirm = write 2회) · OBS-2/BD-2.
5. **verify 한계**: 이미지 증명 = 코어 이미지 레코드 존재. 바이트 비교 없음.
