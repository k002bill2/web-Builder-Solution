여전히 초과: 정규화 +0.08 · raw +0(129.95 ≤ 130 통과, 여유 0.05) — 복원 정규화 +0.09(131.60 > 131.51 · raw 132.98 ≤ 134 통과) (S6c-slim A안 = 동작 동치 감량만, UNMEASURED 하한)

# RS6-L0-SLIM REPORT — S6c 감량 1회 실측

- 브랜치 `k002bill2/rs6-l0-slim` · base `0143c032`(앱 = L0 base `2c1796a2`와 같음 — dist 149 파일 sha가 L0 `cp1-base-dist-sha.txt`와 같다) · 같은 머신에서 직렬로 빌드했다.
- 판정선·ADR·SPEC·INTEGRATE-6·MQ-6·기준선·`check-bundle-size`·`bundleBudget*`는 수정하지 않았다(0). 앱 커밋도 0이다. 최종 `git diff -- app/`는 빈 출력이다.
- 판정: 감량 1회분(후보 ①②③④ + ①의 연장 ①')을 다 썼다. 그래도 동작 동치 A안은 S6c 대비 −0.14 정규화 · −0.11 raw에 그쳤다. 목표는 −0.22 · −0.06이다.
  - raw 목표는 달성했다.
  - 정규화는 0.08이 모자란다.
  - 동작이 바뀌는 B1(B표)까지 넣으면 판정선 안이다. 다만 여유가 0.02 / 복원 0.01이라 사실상 여유가 없다.

## 1. 수치 (정식 = build 출력 · KB · tsc 단계만 뺀 빌드, `tools/build.sh`)

| 시나리오 | /studio 정규화 (≤128.53) | raw (≤130) | 복원 정규화 (≤131.51) | 복원 raw (≤134) | catalog 첫/진입 | profile 첫/진입 | projects 첫/진입 | 정규화 B(chunks) |
|---|---|---|---|---|---|---|---|---|
| base (CP1·CP3) | 128.09 | 129.40 | 131.07 | 132.43 | 100.05 / 102.39 | 99.56 / 120.10 | 99.15 / 108.38 | 128089 |
| S6c 재현 (CP1) | 128.75 | 130.06 | 131.74 | 133.09 | 100.09 / 102.43 | 99.60 / 120.14 | 99.20 / 108.92 | 128753 |
| ① link 1개 (단독) | 128.74 | 130.06 | 131.72 | 133.09 | 100.10 / 102.44 | 99.61 / 120.16 | 99.20 / 108.91 | −13B |
| ② view 축소 원안 (단독) | 128.73 | 130.06 | 131.71 | 133.09 | 100.12 / 102.46 | 99.63 / 120.17 | 99.22 / 108.92 | −28B |
| ③ `latest` 제거 (단독) | 128.73 | 130.04 | 131.71 | 133.08 | 100.11 / 102.45 | 99.61 / 120.16 | 99.21 / 108.94 | −23B |
| ④b io를 DocBook 경유만 (단독) | 128.68 | 129.99 | 131.66 | 133.02 | 100.05 / 102.39 | 99.56 / 120.10 | 99.16 / 108.86 | −71B |
| 조합 ①+②원안+③+④b | 128.61 | 129.94 | 131.60 | 132.97 | 100.05 / 102.39 | 99.56 / 120.11 | 99.16 / 108.82 | 128614 |
| 조합 + ①' (②원안 포함) | 128.59 | 129.93 | 131.58 | 132.96 | 100.06 / 102.40 | 99.57 / 120.12 | 99.16 / 108.81 | 128593 |
| **A안 최종 = ①+②'+③+④b+①'** | **128.61** ✗ | **129.95** ✓ | **131.60** ✗ | 132.98 ✓ | 100.06 / 102.40 | 99.56 / 120.11 | 99.15 / 108.81 | 128614 |
| B표: 조합+①'+B1 (②원안 포함) | 128.51 ✓ | 129.83 ✓ | 131.50 ✓ | 132.86 ✓ | 100.05 / 102.39 | 99.55 / 120.10 | 99.15 / 108.72 | 128514 |

- S6c 재현은 L0와 수치가 같았다(잡음 0). 테스트 tsc 16건(테스트 파일 4개)도 같았다(`raw/cp1-s6c-tsc.txt`). 모든 후보에서 tsc 오류 집합이 S6c와 같았고, 비테스트 오류는 0건이었다. 변경 파일 eslint 결과도 0이었다.
- 다른 라우트 첫 화면은 ④b로 base 값에 돌아왔다(catalog 100.05·profile 99.56). 모든 후보에서 첫 화면 한도(100·101)와 진입 한도(125) 안이었다.
- A안 청크 증분(S6c 대비, 정규화 B): react −53 · memoryProjectRepository −68(2037→1969) · StudioLayout −16(19090→19074) · StudioPage 0.
  - 합은 −137이다. 실측 −139와의 차 2B는 청크 경계 잡음이다.
- B1 단독(②원안 없이) 값 = 128.54로 본다(추정 — B1 실측에서 ②원안과 ②' 차 21B를 더함). 판정선을 약 +0.01 넘는다.

## 2. 후보별 내용 · 판정

| 후보 | 변경 | 효과 | 동작 · 불변식 | 채택 |
|---|---|---|---|---|
| ① | `saveCore` `confirm`·`discard`·`replace` 위임 3개 → `link(run)` 1개. `adopt`는 `core.link((io, s) => io.replace(s, …))` | −13B | io 함수·인자 그대로. I1·I2·G1·G7 변화 0. 단, 코어 상태 `s`가 호출자 콜백에 노출된다(타입 경계만 약해짐) | A |
| ① (①의 연장) | 레지스트리 `link()`의 `{io, port, book}` 조립 → DocBook 청크 `coreLink(projectId, docs, sync)` | −21B | `book` = 같은 `docs.save(projectId, revision, doc, noop)`. G1 변화 0 | A |
| ② 원안 | `view()` = `doc·epoch·confirmed`만 | −28B | **G7 위반**: INTEGRATE-6 163행 "view()로 doc·바인딩·dirty를 받아 재seed" 표면을 없앤다 | B표 |
| ②' | `view()`에서 `mark`·`inflight`만 제거(doc·dirty·epoch·confirmed·images 유지) | ≈−7B(②원안 대비 +21B) | G7 유지. L2 `SaveStatus`(`saving` = `view().inflight`, 9절 241-242행)가 다시 붙여야 한다(이연) | A |
| ③ | `useDocSave` `latest` 상태 제거 — S6c에서 `setLatest`는 `undefined`로만 불려 늘 undefined | −23B | S6c 대비 동작 변화 0. `resolve`를 코어 경유로 바꾸면 해결 뒤 코어 doc·confirmed가 달라지므로(동작 변화) 넣지 않았다 | A |
| ④ 상태부 별도 lazy 모듈 | — | 측정 안 함 | 불가. 첫 렌더의 `core.view().doc` seed와 매 변경의 `core.edit()`가 동기여야 한다(2.2-2 ① · G7). lazy면 로드 전 편집을 버퍼해야 하고, 첫 편집 지연이 생긴다 | — |
| ④b | react +53B 원인 제거: `localSync`의 `coreIo` 정적 import·`LocalSync.coreIo` 제거. io는 DocBook 청크 한 곳에서 받는다 | −71B(react −53 · memProj −18) | 같은 `coreIo` 모듈 객체라 동작 변화 0 | A |
| B1 | `save` 직렬 chain·`inflight`·`discarding` 판정을 io(`coreIo.save`)로 이동. 진입 = `connect().then(l => l.io.save(…))` | −79B | **동작 변화**: `inflight` 증가와 `discarding` 판정이 첫 `connect`(DocBook·싱크 청크 로드) 뒤로 밀린다. 그러면 L2 `saving` 표시가 늦어진다. INTEGRATE-6 9.2 진입 몫("직렬 chain")의 분할도 바뀐다(수정 금지 문서) | B표 |

- react +53B 원인(사실 [L1])은 다음과 같다.
  - `localSync`가 `coreIo`를 정적으로 import하면 `coreIo` 모듈이 memoryDocBook 청크에 실린다.
  - 그 결과 memoryDocBook 청크가 `localSync` 청크와 공유하는 청크가 된다.
  - 동적 import 결과를 memoryDocBook 모듈의 네임스페이스로 맞추려고 rolldown이 `__export` 헬퍼로 네임스페이스 객체를 합성한다. 그래서 memoryProjectRepository에 `.then(e=>e.t)`가 생긴다.
  - 이 헬퍼는 common `react` 청크(rolldown 런타임 위치)에 들어간다.
  - 근거 1: S6c dist에서 그 헬퍼(`r`)를 import하는 청크는 memoryDocBook 하나뿐이었다.
  - 근거 2: base와 S6c react 청크의 diff는 헬퍼 1개와 export 이름 이동뿐이다(`raw/cp3-react-chunk-diff.txt`).
  - 근거 3: ④b 빌드에서 react가 3227B로 base와 같아졌다.
- base 대비 S6c에서 이미 사라진 것(사실): STALE 응답에 실린 최신 문서(`conflict.latest`)가 없어졌다. 그래서 `ConflictCallout`의 최신 revision 표시가 S6c부터 늘 undefined다. ③은 이 죽은 상태를 지웠을 뿐이다. 복구는 L2·L4(충돌 UI) 범위다.

## 3. UNMEASURED 반영 추정 (L0 REPORT 5절 기준)

- 추정 [L3]: A안은 이미 +0.08을 넘는다. L0 5절의 UNMEASURED ① 이미지 바인딩 배선 · ③ 상태 표시(`SaveStatus` 출처 교체·`saving-slow`) · ④ 이탈·탭 경고와 ②'의 이연분(`mark`·`inflight` 복귀)은 모두 진입 증분이다. 이를 더하면 초과 폭은 더 커진다. B표 조합의 여유(정규화 0.02 · 복원 0.01)도 이 중 하나만 더해져도 없어진다고 본다. 감량 1회로는 여유가 충분하지 않다.

## 4. 원복 · 재현 (CP3)

| 단계 | 명령 | 결과 |
|---|---|---|
| 보존 | `git diff -- app` + 새 파일 2개 `git diff --no-index /dev/null` → `patches/s6c-slim.patch` | 8파일 +289/−37 · 소스 sha `raw/cp3-slim-src-sha.txt` |
| 원복 | 6파일 `git checkout --` · `save/coreIo.ts`·`save/saveCore.ts` `rm` · `rmdir save` | `git status --porcelain app` 0줄 |
| 재현 확인 | `git apply --check` → `git apply` → `shasum -c` → 다시 원복 | APPLY-CHECK-OK · 8/8 OK · 다시 0줄 |
| 재빌드 | `npm run build`(tsc 포함) | exit 0 · 128.09/129.40 · 131.07/132.43 · `diff cp1-base-dist-sha.txt cp3-restore-dist-sha.txt` 차이 0(149 파일) |

- 후보별 diff는 `patches/`에 있다.
  - `cand-1~4.patch`: S6c 기준이다.
  - `cand-5-on-combo.patch`: ①', 조합 기준이다.
  - `B1-save-chain-to-io.patch`: A 직전 기준이다.
  - ②'는 `s6c-slim.patch` 안의 `view()` hunk다.

## 5. 게이트 (fresh, 원복 뒤 base)

| 명령(app/) | 결과 | 로그 |
|---|---|---|
| `npm run build` | exit 0 · dist sha 동일 | `raw/cp3-restore-build.txt` |
| `npm run typecheck` | exit 0 | `raw/final-typecheck.txt` |
| `npm run lint` | exit 0 | `raw/final-lint.txt` |
| `npm test -- --run` | exit 0 · Test Files 317 passed (317) · Tests 2856 passed (2856) | `raw/final-test.txt` |
| `git diff -- app/` | 빈 출력 | — |

## 6. 사실 / 추정 / 미확인 · 미측정 아이디어

- **사실 [L1]**: 1절 표의 수치(B1 단독 제외) · react +53B 원인 · 원복 뒤 dist sha 동일 · 후보 tsc 오류 집합이 S6c와 같음.
- **추정 [L3]**: B1 단독 128.54 · 3절 UNMEASURED 영향 · ①'·④b·③의 동작 동치(코드 읽기 근거이며, 코어 io 테스트는 0 — 범위 밖).
- **미확인**: 코어 io 실제 동작 · S6d · B1의 마이크로태스크 순서가 discard·replace 판정에 주는 영향.
- **미측정 아이디어**(목록 밖이라 적용하지 않음): `retryStart`/`starter`는 진입 기준 죽은 코드다(레지스트리가 `starter`를 넘기지 않음). lease `acquire`/`release` 압축 · `useDocSave` `confirmed?.revision ?? initialDoc.revision` 중복 2곳.
