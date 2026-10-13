# save-core-fix REPORT — QA 반례(78e3c52) 좁힌 수정

- 브랜치 `k002bill2/save-core-fix` · base `78e3c52`. 쓰기 = `save-core-harness/core/saveCore.ts` · `save-core-harness/test/h6.test.ts`(신규) · `save-core-harness/MINIMAL-CONTRACT.md`(I6·I7·I9·G3) · `save-core-fix/`.
- QA 원본(`save-core-qa/` 테스트·readme·보고·프로브)·제품 `app/`·`helpers.ts`·h1~h5 테스트 변경 0. 새 의존성 0. merge/push 0. Codex review 1회(반복 0) — 6절.
- **판정 범위 = 격리 하네스.** 아래 PASS는 제품 통합 PASS가 아니다.

## 0. 결론

| ID | 초기(78e3c52, fresh) | 최종 | 수정 |
|---|---|---|---|
| CE-1 (H5 FAIL 근거) | RED | **PASS(하네스)** | discard 진입~끝 배타(`discarding`) — save `failed{discarding}`·dirty confirm 거절·재진입 거절, finally 해제 |
| CE-2 | RED | **PASS(하네스)** | saveNow가 target doc과 Blob 바인딩을 같은 시점에 동결 · doc은 동결 사본 |
| CX-3 | RED | **PASS(하네스)** | discard 성공 시 바인딩 = 복귀 문서 커밋 때 실린 Blob만, 그 밖 제거 · 실패 시 보존 · delete op 0 |
| CE-3a | RED | **PASS(하네스) · 제품 통합 PARTIAL** | 같은 `StudioPersistence` 인스턴스의 세대 읽기~write 구간을 코어 간 직렬 → 뒤 저장 `stale`, 앞 커밋 보존 |
| CE-3b·CE-4·CE-5·CE-6·OBS-1·OBS-2 | PASS | PASS(관측값 동일) | — |
| M6·M8·M9 | 생존 | M6 삭제(근거) · M8'·M9 kill | 아래 3절 |

- H5: 이 하네스 안에서는 CE-1·CX-3 반례가 닫혔다. 그래도 **H5 PASS 회수 여부는 뒤 별도 QA 판정**에 맡긴다(자기 승인 0).

## 1. 실행 원문 (`rawlogs/EXIT-MANIFEST.txt`)

| 명령 (저장소 루트) | 결과 | 로그 |
|---|---|---|
| `(cd app && npm ci)` → `git status --porcelain app` | exit 0 · 0줄(lock diff 0) | `npm-ci.txt` · `lock-diff.txt` |
| baseline `vitest run --config dev/active/save-core-harness/vitest.config.mjs` | 23 passed · exit 0 | `baseline-harness.txt` |
| baseline `vitest run --config dev/active/save-core-qa/vitest.config.mjs --reporter=verbose --silent=false` | **4 failed(CE-1·CE-2·CE-3a·CX-3) \| 6 passed (10) · exit 1** — QA `qa-final-run.txt`와 같은 관측 | `baseline-qa.txt` |
| 신규 h6 RED (수정 전) | **8 failed \| 5 passed (13) · exit 1** | `h6-red.txt` |
| 수정 뒤 하네스(지연 읽기 테스트 추가 전) | 36 passed · exit 0 | `h6-green.txt` |
| 최종 하네스 2회 | 37 passed (37) · exit 0 ×2 | `final-harness-run{1,2}.txt` |
| 최종 QA 원본 10건 2회 | **10 passed (10) · exit 0 ×2** | `final-qa-run{1,2}.txt` |
| `tsc --noEmit -p` 하네스 / QA(browser/probe.ts 포함) | exit 0 / exit 0 | `final-harness-tsc.txt` · `final-qa-tsc.txt` |
| `eslint --config app/eslint.config.js` 하네스 core·test / QA test | exit 0 / exit 0 | `final-harness-eslint.txt` · `final-qa-eslint.txt` |
| `grep -l "Errors\|Unhandled" rawlogs/final-*` | 일치 0(grep exit 1) | 수기 |

## 2. test delta (RED 전에 PROGRESS에 기록)

- 신규 `h6.test.ts` 14건(RED 전 기록 13 + 마감 점검에서 회귀 가드 1 추가 — 아래). 기존 h1~h5 23건·QA 10건의 단언 변경 0.
  - RED 8: H6-1 discard 중 save · discard 중 dirty confirm/2번째 discard · H6-2 D1 Blob 동결 · doc 외부 변경 · 순차 discard 바인딩 X 복귀 · 재열기 코어 discard 폐기 Blob 제거 · 비코어 레코드 image-missing · H6-3 공유 gate 동시 save.
  - 추가 회귀 가드 1(수정 뒤 추가, 브리프 '지연 읽기' 명시분): discard 읽기 지연 중 save `failed{discarding}`·write 0·edit 수용 → `blocked{newer}`·바인딩 보존·다음 save saved. F3(finally 삭제) 원복 시 RED(`mutations.txt` 끝 블록). 수정 전 코어에서는 미실행.
  - 회귀 가드 5(수정 전에도 GREEN): discard 읽기 throw 뒤 가드 해제 · discard 중 edit/replace 수용(→`blocked{newer}`·바인딩 보존) · 한 코어 연속 save·같은 gate 재열기·쓰기 실패 뒤 진입 · M9 거짓 성공(drop) · M8 이미지 op 누락.
- 하네스 23 → 37.

## 3. mutation — 각 수정 원복 시 RED (`rawlogs/mutations.txt`, 원복 뒤 `git diff` 0)

| 원복 | 하네스 | QA |
|---|---|---|
| F1 save의 discarding 가드 | 2 failed | CE-1 RED |
| F2 discard 재진입 거절 | 1 failed | — |
| F3 finally 해제 | 4 failed(지연 읽기 추가 뒤 재실행 5 failed) | — |
| F4 바인딩 동결(commit 시점 attached 읽기) | 1 failed | CE-2 RED |
| F5 doc 동결 사본 | 1 failed | — |
| F6 discard 바인딩 복귀 | 2 failed | CX-3 RED |
| F7 코어 간 직렬(정정 블록) | 1 failed | CE-3a RED |
| F8 save 이미지 Blob 재읽기 → keys 존재 | 1 failed | — |
| M8' verify 이미지 Blob 검사 → `true` | 1 failed | — |
| M9 confirm wrote:true verify 삭제 | 2 failed | — |

- 첫 F7 블록은 perl 패턴이 함수를 반환하게 만들어 32건이 무관하게 실패했다. **무효**로 표기했고, 끝의 "F7(정정)" 블록이 유효하다.
- **M6 처리**: `settle`의 세대 가드를 근거를 적고 삭제했다. 근거는 세 가지다: 한 코어 안 저장은 chain으로 직렬이고, 커밋 직전 `prev.generation === confirmed.generation`(stale) 검사를 통과해야 하며, 코어 간 구간이 직렬이다. 그래서 커밋 세대는 늘 `confirmed+1`이고 가드는 항상 참이었다. 테스트 약화 0.
- `save-core-qa/scripts/mutate.sh`는 재실행하지 않았다. M8 대상 줄(`keys.has`)이 Blob 재읽기로 바뀌어 원 패턴이 적용되지 않는다. 대신 M8'/M9를 위 표처럼 수기로 실행했다.

## 4. 결정한 최소안과 근거

1. **CE-1 = `discarding` 가드**(save chain 직렬화 안 씀)
   - save 진행 중 discard는 그대로 `rejected{inflight}`다.
   - edit·replace는 막지 않는다. QA CE-6 계약(discard 중 replace → 교체본 유지)과 H5-3(discard 중 edit 보존)이 그 근거다. mark 검사로 discard는 `blocked{newer}`가 된다.
   - await 뒤 표면 검사로 이미 커밋된 쓰기를 되돌리는 경로는 없다. 가드가 쓰기 시작 자체를 막는다.
2. **CE-2 = 참조 캡처 동결**
   - edit·replace는 늘 새 Map과 동결 doc을 할당한다. 그래서 `target = doc; bound = attached`를 같은 동기 구간에서 잡으면 사본이 된다. Blob은 불변이다.
3. **CX-3 = 마지막 커밋 바인딩 복귀**
   - 다른 탭 커밋 문서나 열기(hydrated) 문서는 이 코어에 바인딩이 없으므로 제거한다. 다음 저장은 IDB 코어 이미지 레코드를 재읽어 쓴다.
   - 이미지 삭제 API·delete op 차용 0.
4. **CE-3a = 같은 영속 인스턴스 직렬**(모듈 `WeakMap<StudioPersistence, Promise>`)
   - 싱글 owner(열기 때 거절)는 쓰지 않았다. h4·h5·QA OBS-1이 같은 영속 위에 코어 여러 개를 열어 "다른 탭"을 흉내 내므로, 이 방식은 집단 RED가 된다. 또 owner 해제에는 `close` API가 필요한데, 이는 인터페이스 확장이다.
   - writer 객체 기준 owner도 쓰지 않았다. `writerAlways`가 모듈 상수라 테스트 사이에서 공유되기 때문이다.
   - 직렬 구간은 "실행 거절"(뒤 저장 `stale`)로 끝나므로, c1 커밋 소실도 함께 해소된다.

## 5. 남은 것 (정직 표기)

- **제품 통합 미검증**: DocBook·localSync·스케줄러·React 미연결(G1·G2·G7·G8 그대로).
  - 실제 IDB·Web Locks 브라우저 프로브는 **재실행하지 않았다**(프로브 스크립트 변경 0, 뒤 QA 책임).
  - 수정 뒤 코어가 실제 IDB에서 같은 결과를 내는지는 미검증이다.
- **CE-3a PARTIAL**: 같은 realm에서 `StudioPersistence` 인스턴스를 둘 만들어 gate를 공유하면 여전히 같은 세대 2회 saved가 가능하다. 진짜 원자 세대 read+write(IDB readwrite 트랜잭션 안 조건부 쓰기)는 제품 `StudioPersistence` API 변경이 필요해 하지 않았다(G3).
- **liveness**:
  - discard 중 거절된 save·confirm(`discarding`)은 자동 재시도하지 않는다. 호출자(스케줄러·UI)가 다시 불러야 한다.
  - OBS-1(stale 뒤 재열기 외 회복 경로 없음)은 그대로다.
  - CE-4(동시 confirm 2회 = 같은 내용 write 2회)도 그대로다.
  - **이번 수정이 새로 만든 성질 ①**: 코어 간 직렬 구간이 write resolve까지 포함한다. 같은 영속 인스턴스에서 한 코어의 write가 멈추면 다른 코어의 save도 무기한 대기한다(타임아웃 없음).
  - **이번 수정이 새로 만든 성질 ②**: discard의 읽기가 끝나지 않으면 `discarding`이 풀리지 않는다. 그동안 save·dirty confirm은 계속 `failed{discarding}`다(edit은 받음).
- **OBS-2**: 이미지 존재 확인이 프로젝트를 구분하지 않는 동작은 그대로다(코어 이미지 레코드면 다른 프로젝트 것도 통과). 범위 밖.
- **verify 한계**: 이미지 증명은 코어 이미지 레코드 존재 확인이다. 바이트 비교는 없고, 다른 프로젝트의 같은 id도 통과한다.
- **비용**: save와 verify가 참조 이미지마다 `get("images")`로 Blob 레코드를 읽는다(전에는 `keys` 1회). 성능은 미측정.
- **id 정책**: 제품 localId 재사용 여부는 여전히 미확인이다. 브리프에 따라, 공개 하네스 API가 허용하는 같은 id 재바인딩 반례로 보고 닫았다.
- **필요한 것**: 뒤 별도 QA 1회(브라우저 프로브 재실행 포함). 제품 적용 승인은 없다.

## 6. Codex review (1회, 반복 0)

- 명령: `node codex-companion.mjs review --scope branch --base 78e3c52`(nohup, 02:41 시작). 원문은 `rawlogs/codex-review.txt`.
- 결과 원문: "이번 변경으로 도입된 actionable 결함은 발견하지 못했습니다." 지적은 0건.
- 한계: Codex는 하네스와 QA의 tsc를 exit 0으로 확인했다. 테스트 실행은 Codex 샌드박스 EPERM으로 차단돼, Codex 쪽 런타임 검증은 없다. 런타임 근거는 1절의 fresh 실행 원문이다.
- 실행 시점: Codex는 지연 읽기 테스트를 커밋하기 전에 시작했다. diff를 읽은 시점에 따라 그 1건이 검토 범위에 들어갔는지는 확인하지 못했다.
- 이것은 독립 QA를 대체하지 않는다. 뒤 별도 QA 1회가 필요하다.
