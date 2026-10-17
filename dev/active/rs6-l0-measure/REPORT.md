상향 필요: 정규화 +0.22 KB · raw 한도 +0.06 KB (S6c 기준, UNMEASURED 하한) — 복원 진입도 정규화 +0.23 KB 초과(raw 133.09 ≤ 134 통과)

# RS6-L0 REPORT — 저장 코어 연결 측정 관문

- 브랜치 `k002bill2/rs6-l0-measure` · base `2c1796a2`(+ MQ-6 기록 `c9babfb4`, 앱 동일) · Node v24.12.0 · 같은 머신 직렬 빌드.
- 정본: `docs/04-plan/RS6_INTEGRATE_PLAN.md` 1절 · `docs/design/restart/INTEGRATE-6.md` r1 2.2-2·7·9.2·9.3.
- **판정: L0 FAIL(S6c가 판정선 초과).** 계획 8절에 따라 L1 이후는 보류하고 MQ-6-6(예산)으로 올린다. 이 문서는 수치만 낸다. 기준선·ADR·한도는 바꾸지 않았다.
- 앱 커밋 0. 각 시나리오 패치는 `patches/`에 보존했다. 원복 뒤 base 재빌드 dist sha가 같다(4절).

## 1. CP별 수치 (정식 = `npm run build` 출력 · KB)

| 시나리오 | /studio 정규화 (≤128.53) | /studio raw (≤130) | 복원 정규화 (≤131.51) | 복원 raw (≤134) | catalog 첫/진입 (101/125) | profile 첫/진입 (100/125) | projects 첫/진입 (100/125) | build exit |
|---|---|---|---|---|---|---|---|---|
| S6-base (CP1) | 128.09 | 129.40 | 131.07 | 132.43 | 100.05 / 102.39 | 99.56 / 120.10 | 99.15 / 108.38 | 0 |
| S6a (CP2) | **128.64** ✗ | 129.96 | **131.63** ✗ | 132.99 | 100.11 / 102.45 | 99.61 / 120.15 | 99.21 / 108.94 | 1(예산) |
| S6b (CP3) | **128.85** ✗ | **130.18** ✗ | **131.83** ✗ | 133.21 | 100.11 / 102.45 | 99.62 / 120.17 | 99.22 / 108.95 | 1(예산) |
| **S6c (CP3, 최종 후보)** | **128.75** ✗ (+0.22) | **130.06** ✗ (+0.06) | **131.74** ✗ (+0.23) | 133.09 | 100.09 / 102.43 | 99.60 / 120.14 | 99.20 / 108.92 | 1(예산)¹ |
| S6d | UNMEASURED | — | — | — | — | — | — | — |
| 원복 base (CP4) | 128.09 | 129.40 | 131.07 | 132.43 | (base와 같음) | | | 0 · dist sha 동일 |

- ¹ S6c는 `useDocSave` 시그니처가 바뀌어(`core` 필수 · `saveDoc` 제거) **테스트 파일 5개 16건**이 tsc에서 실패한다(`raw/cp3-s6c-tsc.txt`). 비테스트 소스 tsc 오류는 0건이다. 그래서 S6c 빌드는 `build` 스크립트에서 tsc 단계만 빼고 나머지(`build-thumbs` → `vite build` ×2 → `check-bundle-size`)를 그대로 돌렸다(`raw/cp3-s6c-build.txt` 첫 줄). 테스트 정합성은 BRIEF상 범위 밖이다.
- base 대비 증분(정규화): S6a +0.55 · S6b +0.76 · S6c +0.66. S6c의 상쇄 = S6b 대비 −0.10 정규화 · −0.12 raw.
- 다른 라우트 첫 화면 +0.04~0.06은 공통 `react` 청크 +53B에서 온다(아래 2절). 첫 화면 100(catalog 101)·진입 125 한도는 모두 안이다. profile 첫 화면 여유는 0.40에서 0.39로 줄었다.
- 독립 bytes(rawbytes 사본): S6a `raw/cp2-s6a-rawbytes.txt` = /studio 129958B, 정식 출력과 같다. S6b·S6c는 rawbytes를 따로 돌리지 않았다(정식 출력과 chunks 합계로 갈음).

## 2. 청크 바이트 구성 — /studio 진입 closure (정규화 gzip B · `tools/chunks.mjs`)

| 청크 | base | S6a | S6b | S6c | S6c−base | 내용 |
|---|---|---|---|---|---|---|
| index (common) | 85575 | 85575 | 85575 | 85575 | 0 | 코어 코드 유입 없음(확인) |
| StudioLayout | 18966 | 18967 | 19176 | 19090 | **+124** | S6b 배선(+210) − S6c 제거(−86) |
| memoryProjectRepository | 1540 | 2037 | 2037 | 2037 | **+497** | 코어 상태부 `createSaveCore`(rollup이 이 청크로 인라인) + 레지스트리 `core()` + `link()` |
| react (common) | 3227 | 3280 | 3280 | 3280 | **+53** | 원인 미확인(코어 문자열 grep 0). rollup 청크 경계·공유 헬퍼 이동으로 추정 |
| StudioPage | 1666 | 1666 | 1666 | 1654 | −12 | S6c `toDocSaveRepository`의 `saveDoc` 제거 |
| 그 밖 16개 | 같음 | ±0 | ±0 | ±0 | 0 | |
| **합계** | 128.09K | 128.64K | 128.85K | 128.75K | **+0.66K** | 21 청크(수 변화 0) |

- 조작 뒤: `coreIo`(io 본문)는 빌드상 `memoryDocBook` 청크에 들어갔다(`localSync`가 정적 import, memory 모드는 `memoryDocBook`이 다시 내보냄). 포트 `corePort`는 `localSync` 청크에 있다. 둘 다 진입 closure 밖인 것을 chunks 출력으로 확인했다.
- 감량: **실시하지 않았다**(1회 허용분 미사용). 사유는 시간 예산(70분)이다. 후보는 다음 셋이다. 효과는 미측정이다.
  - ① `memoryProjectRepository`에 인라인된 상태부의 `confirm`·`discard`·`replace` 위임 3개를 `link` 1개로 합치기.
  - ② `view()` 객체 구성을 줄이기.
  - ③ `useDocSave` 남은 `resolve`·`latest` 경로를 코어 경유로 줄이기.
  - 필요한 감량은 정규화 −0.22 이상이다. 이는 S6a 상태부·레지스트리 증분(+0.50)의 44%에 해당한다.

## 3. S6c 제거 목록 (base `2c1796a2` 행 번호 · 상쇄는 L3가 이 목록 그대로 머지할 때만 유효)

진입 영향 있음(StudioLayout·StudioPage 청크):

| 파일:행(base) | 제거·대체 내용 |
|---|---|
| `app/src/features/studio/useDocSave.ts:23` | `DocSaveRepository.saveDoc` 시그니처 제거 |
| `app/src/features/studio/useDocSave.ts:61` | `revisionRef` 선언 제거 → `core.view().confirmed?.revision` |
| `app/src/features/studio/useDocSave.ts:67-78` | 구 저장 경로 전체(`repository.saveDoc` 호출 :69 · `revisionRef` 갱신 :70 · 문자열 매칭 readonly 판별 :74 · STALE `setLatest` :75) → `core.save()` 결과 reason 판별 |
| `app/src/features/studio/useDocSave.ts:101` | `resolve`의 `revisionRef` 갱신 제거 |
| `app/src/features/studio/useDocSave.ts:132-133` | `adopt`의 `revisionRef` 읽기·갱신 → `core.view()` revision + `core.replace(intent·expectedEpoch)` |
| `app/src/features/studio/useDocSave.ts:150` | `savedRevision` = `revisionRef` → 코어 confirmed revision |
| `app/src/features/studio/useDocSave.ts:15` | `projectErrorCode`·`DocHead` import 제거(위 제거에 따른 정리) |
| `app/src/features/studio/studioRepository.ts:17` | 어댑터 `saveDoc` 제거(StudioPage 청크 −12B) |

진입 영향 0(조작 뒤 청크 — 목록에만 고정):

| 파일:행(base) | 제거 내용 |
|---|---|
| `app/src/data/persistence/localSync.ts:53-54` | `LocalSync.base` 인터페이스 |
| `app/src/data/persistence/localSync.ts:209-212` | `base` 구현(IDB 실패 뒤 미확인 쓰기 위 rebase) |
| `app/src/data/memoryDocBook.ts:148` | `createDocBook` 인자 `Pick<…, "base">` |
| `app/src/data/memoryDocBook.ts:358` | `local?.base(...)` 보정 → `requested` |

- 제거하지 않은 후보: 스케줄러 dispose 경로(`useAutosaveScheduler.ts:134-137`)는 타이머 정리라 코어가 대신하지 않는다. `edit` 동기 등록으로 손실만 사라진다. `flushBeforeLeave`(`StudioLayout.tsx:133-148`)는 MQ-6-7·L3 범위다. `memoryProjectRepository.ts:138-149` 이미지 맵 cleanup은 S6b에서 코어 바인딩 배선을 하지 않아 남겼다(5절).
- 원문 diff: `raw/cp3-s6c-removed-lines.txt` · 누적 패치 `patches/s6c.patch`.

## 4. 원복·재현

| 단계 | 명령 | 결과 |
|---|---|---|
| CP1 | `npm ci` · `git status --porcelain app` · `npm run build` | exit 0 · 0줄 · 128.09/129.40 · 131.07/132.43 · dist 149 파일 sha `raw/cp1-base-dist-sha.txt` |
| 원복 | 수정 6파일 `git checkout -- <경로>` · 새 파일 2개 `rm` · `rmdir save/` | `git status --porcelain app` 0줄 · `git diff -- app/` 0줄 |
| 재빌드 | `npm run build` | exit 0 · 128.09/129.40 · 131.07/132.43 · `diff cp1-base-dist-sha.txt cp4-restore-dist-sha.txt` 차이 0("DIST SHA IDENTICAL") |
| 게이트 | `npm run typecheck` · `npm run lint` · `npm test -- --run` | 5절 끝 표 |

## 5. 붙인 것 · UNMEASURED

| 조각 | S6a | S6b | S6c | 비고 |
|---|---|---|---|---|
| 코어 상태부(초안·mark·savedMark·inflight·epoch·confirmed·바인딩·discarding·chain · `edit`·`view`·`acquire`/`release`·`save` 직렬 위임) | 실제 | 실제 | 실제 | `features/studio/save/saveCore.ts` → `memoryProjectRepository` 청크로 인라인 |
| 레지스트리 `core(projectId, seed)` — 저장소 closure `Map`, 동기 생성, 포트는 첫 save 때 `link()` | 실제 | 실제 | 실제 | I6 2.2-2 ①②③ |
| io(`save` 본문·`confirm`·`discard`·`replace`) · memory 모드 = DocBook 커밋 뒤 `not-persistent` | 실제 | 실제 | 실제 | 조작 뒤 |
| 포트 `corePort`(mode·head·stored·commit[엄격 이미지 + `write` 경유 `queue.submit`]·verify) · `coreIo` 노출 | 실제 | 실제 | 실제 | `localSync` |
| 편집기: seed = `view().doc` · `edit` 매 변경 · `useId` lease effect · 저장 = `core.save()`·reason 판별 · StudioLayout 코어 획득 | — | 실제 | 실제 | |
| `adopt` → `core.replace` · `savedRevision` = 코어 | — | — | 실제 | |
| **UNMEASURED** ① 이미지 바인딩 배선(`edit(next, blobs)` — StudioLayout 이미지 맵 → 코어) | | | | 진입 증분 + 예상 |
| ② saved 뒤 DocBook 맞춤의 G1 규칙 완전판(실패 시 DocBook 변화 0 · DocBook 경로 재쓰기 chain 뒤 · U14) | | | | 조작 뒤 · 단순판만 |
| ③ 상태 표시(`SaveStatus` 판정 출처 교체 · `saving-slow` 감시) · 충돌·폐기 UI | | | | L2·L4 · 진입 증분 + 예상 |
| ④ 링크 이탈·탭 수준 경고(레지스트리 `beforeunload`) | | | | L3 MQ-6-7 · 진입 증분 + 예상 |
| ⑤ S6d(충돌/폐기 본문 lazy 조건 참, `EXTRA_SCENARIOS`) | | | | 시간 예산 — 미실행 |

→ S6c 수치는 위 ①③④가 빠진 **하한**이다. 실제 L1~L4 머지 크기는 이보다 크다고 본다(추정).

## 6. 사실 / 추정 / 미확인

- **사실 [L1, 실행 원문 `raw/`]**
  - 1절 표의 모든 수치.
  - S6c 정규화 128.75 > 128.53, raw 130.06 > 130.
  - 원복 뒤 dist sha 동일.
  - 코어 코드가 common 청크에 들어가지 않음.
  - 테스트 tsc 16건(S6c).
- **추정 [L3]**
  - `react` 청크 +53B의 원인은 rollup 청크 경계 이동으로 본다.
  - UNMEASURED ①③④를 더하면 S6c보다 커진다.
  - 감량 1회로 −0.22를 맞출 수 있을지는 불명이다.
- **미확인**
  - 코어 io의 실제 동작(테스트 0 — 범위 밖).
  - S6d.
  - rawbytes 독립 수치(S6b·S6c).
  - 감량 효과.

## 7. 게이트 (마지막 fresh, 원복 뒤 base)

| 명령(app/) | 결과 | 로그 |
|---|---|---|
| `npm run build` | exit 0 · 128.09/129.40 · dist sha 동일 | `raw/cp4-restore-build.txt` |
| `npm run typecheck` | exit 0 | `raw/final-typecheck.txt` |
| `npm run lint` | exit 0 | `raw/final-lint.txt` |
| `npm test -- --run` | exit 0 · Test Files 317 passed (317)
 Tests 2856 passed (2856) | `raw/final-test.txt` |
| `git diff -- app/` | 빈 출력 | — |
