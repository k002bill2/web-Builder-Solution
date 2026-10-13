# RS5 제한된 번들 스파이크 (CONTRACT-5 §8.3 S5a~c) — REPORT

- 성격: **미검증 초안(CONTRACT-5 r0.1a) 진입 배선·소유 구조의 최소 prototype 측정.** 완성된 장부(ledger) 구현이 아니고, 제품 구현·예산 변경·기준선/ADR/시나리오 한도 변경은 0이다. 아래 수치는 모두 "최소 스파이크 수치"다. 완성품 크기가 아니다.
- base `418979e`(앱 `93f8111`) · 브랜치 `k002bill2/rs5-spike` · Apple M1 Max / Node v24.12.0 / npm 11.6.2 (`rawlogs/01-machine.txt`)
- 도구: `tools/rawbytes.mjs`(rs4-measure 사본 · gzip bytes 정수 · 시나리오 추가는 `EXTRA_SCENARIOS` env로만) · `tools/chunks.mjs`(청크별 gzip bytes). **정식 판정 = 앱 `npm run build` exit 코드와 실패 원문(`*-build.txt`)**, **독립 bytes = rawbytes(`*-rawbytes.txt`)**. 두 열은 따로 본다. rawbytes 로그의 "KB" 표기는 bytes이고, 로그 끝의 `exit=1`과 "렌더 문서 CSS 8888.00KB > 30KB" 문구는 사본에서 단위가 섞여 생긴 것이라 판정이 아니다. base에서도 같은 문구가 나온다.
- 서브에이전트: 사용 0(BRIEF "서브에이전트 불필요(빌드 직렬)"). Codex 리뷰·새 API 안전성 테스트: 0(BRIEF 금지 · QA 병렬 책임).

## 1. 준비 (base)

| 항목 | 결과 | 증거 |
|---|---|---|
| `npm ci` | exit=0 · lock diff 0 · sha1 `fdd7c98e…` | `rawlogs/00-npm-ci.txt` · `00-lock-before.txt` |
| base `npm run build` | exit=0 · dist 143 파일 sha | `01-base-build.txt` · `01-base-dist-sha.txt` |
| base suite 1회 | 304 files / 2769 tests 통과 · exit=0 | `02-base-suite.txt` |
| base rawbytes | rs4-measure `03-base-rawbytes.txt`와 `[bundle]` 행 diff 0 | `03-base-rawbytes.txt` |

## 2. 후보 정의 · 배선표

- **S5a**: CONTRACT-5 8.2의 1행만 넣었다. `src/data/saveLedger.ts`에 실제 로직을 두고(상태 Map · `view` · `acquire` · `release` · `publish` · `mark` · I8 `beforeunload` 토글), `memoryProjectRepository`가 `ledger: createSaveLedger(!!local)`로 노출한다(PROJECT_AUTO closure). `ProjectRepository.ledger?` 타입 1줄도 추가했다. **편집기 호출부가 없으므로 하한(lower bound)이다.**
- **S5a-r**: S5a를 1회 감량한 판이다(감량 1회를 여기서 썼다). 토큰→장부 직접 WeakMap · `of` 1식 · listener 토글 1식 · `returnValue` 대입 생략(`preventDefault`만 — 오래된 브라우저 경고 동작이 달라질 수 있다).
- **S5b**: S5a에 편집기 배선을 더하고 seed를 **정적**으로 넣었다. `useDocSave`에서 `acquire`/`release`는 commit 단계 effect에서, `mark`는 편집마다, `publish`는 저장 직전에 부른다. seed 적용(`ledgerSeed.applySeed`)은 정적 import다. `StudioLayout`은 이미지 binding 읽기·쓰기를 넘긴다.
- **S5c**: S5b와 같지만 seed 적용을 **lazy**로 바꿨다. `seed.latest || seed.conflicted`일 때 effect에서 자동으로 `import("./ledgerSeed")`한다. 이것은 조건부 자동 dynamic import이므로 **조건이 참인 시나리오를 UNAPPROVED로 따로 쟀다**.

| 배선 | S5a · S5a-r | S5b | S5c |
|---|---|---|---|
| 장부 상태·`view`/`acquire`/`release`/`publish`/`mark` 본문 · I8 토글 | 실제 로직 있음 | 실제 로직 있음 | 실제 로직 있음 |
| `mark` 호출(편집마다) | **배선 없음** | 실제 | 실제 |
| `acquire`/`release` 호출(effect · cleanup 때 미저장이면 publish) | **배선 없음** | 실제 | 실제 |
| `publish` 호출(저장 시작) | **배선 없음** | 실제(기존 `saveDoc` 직전) | 실제 |
| `view` 호출(render 중 읽기) | 배선 없음 | **배선 없음**(seed = `acquire` 반환값만 사용) | 배선 없음 |
| seed 인계(문서·이미지·미확인 상속·충돌 보관) | 없음 | 정적 | lazy(조건부 자동 import) |
| `save`(장부 경유 단일 경로) · `memHead`/`memSeq` 갱신 | **배선 없음**(저장은 기존 `saveDoc` 직행) | 배선 없음 | 배선 없음 |
| import(조작 뒤 본문 로더 — `confirm`/`save`/`retryStart`) | **배선 없음** | 배선 없음 | 배선 없음 |
| 충돌 UI(stale phase 진입) | 없음 | 없음(`setLatest`만) | 없음 |
| 기존 편집기 `beforeunload` 경고 | 유지(변경 0) | 유지 | 유지 |

**의미 없는 빈 stub은 넣지 않았다.** 위 표에서 "배선 없음"인 항목의 바이트는 아래 수치에 **들어 있지 않다**.

## 3. Route raw bytes (gzip bytes) — 판정

판정선: /studio 129900 · 복원 132940 (기준선+0.03). 절대 한도: 130000 · 134000 (ADR-004). profile·projects는 첫 화면 100000, 진입 125000이다.

| 시나리오 | base (03) | S5a (11) | S5a-r (13) | S5b (21) | S5c (31) | 판정선 / 절대 |
|---|---|---|---|---|---|---|
| /profile 첫 화면 | 99877 | 99879 (+2) | 99872 (−5) | 99875 (−2) | 99869 (−8) | ≤100000 |
| /profile 진입 | 120085 | 120101 (+16) | 120083 (−2) | 120090 (+5) | 120087 (+2) | ≤125000 |
| /profile (3안) 진입 | 122562 | 122583 (+21) | 122561 (−1) | 122568 (+6) | 122564 (+2) | ≤125000 |
| /projects 첫 화면 | 98412 | 98414 (+2) | 98406 (−6) | 98410 (−2) | 98409 (−3) | ≤100000 |
| /projects 진입 | 105681 | 106131 (+450) | 106094 (+413) | 106126 (+445) | 106128 (+447) | ≤125000 |
| **/studio 진입** | 129896 | **130346 (+450)** | **130313 (+417)** | **130649 (+753)** | **130655 (+759)** | 129900 / 130000 |
| **/studio 복원 진입** | 132929 | **133378 (+449)** | **133346 (+417)** | **133682 (+753)** | **133688 (+759)** | 132940 / 134000 |
| UNAPPROVED /studio 장부 초안·충돌 있음 | — | 해당 없음 | 해당 없음 | 해당 없음(정적 = 위 진입과 같다) | **130788** | 한도 미승인 |
| UNAPPROVED 위 + 복원 진입 | — | 해당 없음 | 해당 없음 | 해당 없음 | **133821** | 한도 미승인 |

판정
- **/studio 진입: 4개 후보 모두 판정선 129900과 절대 130000을 둘 다 넘는다 → FAIL.** 하한인 S5a-r도 +417이다.
- **/studio 복원: 4개 모두 판정선 132940을 넘고, 절대 134000 안이다 → 판정선 기준 FAIL.**
- /projects·/profile: 4개 모두 판정선 안 → PASS. profile 쪽 ±21B 이하 변동은 해시 이름이 바뀌어 생긴 공유 청크 흔들림이다(4절).
- 정식 build: S5a/S5a-r/S5b/S5c 모두 `exit=1`이다. 원인은 번들 예산 실패뿐이며 TS 오류는 0이다(`10/12/20/30-*-build.txt` 말미). S5c의 새 dynamic import에 대해 미분류 실패 문구는 나오지 않았다. 원문 그대로 보존했다.
- UNAPPROVED 시나리오: S5c에서만 측정했다(`EXTRA_SCENARIOS` · 앱 SCENARIOS 변경 0). S5a/S5a-r/S5b는 조건부 자동 import가 없어 해당 시나리오가 없다. 한도 승인 전이므로 PASS/FAIL로 판정하지 않는다.

## 4. 증분 귀속 (청크별 · `rawlogs/44-chunk-delta.txt`)

| 후보 | 진입 청크 증분 | 비고 |
|---|---|---|
| S5a | `memoryProjectRepository` +448 | 그 밖은 ±8 이하 해시 흔들림 |
| S5a-r | `memoryProjectRepository` +424 | 감량 효과 −24B뿐 |
| S5b | `memoryProjectRepository` +448 · `StudioLayout` +294 · `StudioPage` +8 | 편집기 배선 + 정적 seed ≈ +294 |
| S5c | `memoryProjectRepository` +448 · `StudioLayout` +302 · `StudioPage` +10 · `ledgerSeed` +133(별도 청크) | **lazy로 해도 진입이 줄지 않는다** — import 래퍼 비용(+8)이 옮긴 본문보다 커서 S5c 진입(130655)이 S5b(130649)보다 6B 크다 |

- 진입 청크 해시 이름이 바뀌어 참조하는 청크가 ±1~8B 흔들린다(base 여유 4B와 같은 규모). 그래서 합계뿐 아니라 청크별로 귀속했다.

## 5. 미측정 범위 (구현하지 않은 로직 — 위 수치에 없음)

| 조각 | CONTRACT-5 위치 | 예정 배치 |
|---|---|---|
| `confirm` 본문 · `save(token, seq)` 본문 · 단일 비행/dedupe · `inflight` | 2.3 · 4.1 · 4.2 · 4.5 | 조작 뒤 |
| `LocalSync.confirm` · `mode()` · 엄격 `imageOps`(I4) · I5b 확인 증명 | 2.5 · 3 | 조작 뒤 |
| Reason 분류(문구 매칭 제거) · `ConfirmResult` 생성 | 2.4 | 조작 뒤 |
| 저장소 `call`/`kept`의 `memHead`·`memSeq` 갱신 · I3 expectedRevision 출처 교체 | 2.5 · 3 | 진입(저장소) — **진입 몫 미측정** |
| `replace` 전이(`epoch` 증가 · `conflicted` 설정) · `adopt` 경유 | 4.4 | 일부 진입 가능성 — 미측정 |
| `retryStart` · 시작 기억 `start` 이동(프로필 대화상자) · `discard` · `subscribe` · `lastResult` | 2.3 · 4.3 | 조작 뒤 / 프로필 — 미측정 |
| `useAutosaveScheduler` seed 옵션 · `unconfirmed` phase · `dispose` 전 노출 | 2.5 | 진입(편집 틀) — 미측정 |
| 충돌 UI(stale 진입) · `/projects` 행 확인 UI · binding 해제 규칙(4.6-2) | 4.4 · 8.2 · 4.6 | 진입/조작 뒤 — 미측정 |

→ 위 표의 진입 조각까지 들어가면 /studio 증분은 **S5b/S5c(+753~+759)보다 커질 수 있다**. 몇 B인지는 추정하지 않는다.

## 6. 중단 규칙 · 해석

- 감량은 전체에서 1회(S5a-r)만 했다. 감량 뒤에도 /studio 130313 > 129900·130000이므로 **추가 감량·추가 후보는 중단했다.**
- BRIEF의 두 지시("감량 1회 뒤 초과면 중단"과 "조건이 참인 pending/conflict 진입도 측정")를 함께 지키기 위해, 측정 순서는 **S5a → S5c → S5b → S5a-r(감량)** 으로 잡았다. 감량 뒤 추가 최적화는 0이다. 미실행 후보는 0이다.
- BLOCKED/UNMEASURED: 2절 표의 "배선 없음" 항목 전부와 5절 표 전부 = **UNMEASURED**.

## 7. 새 예산 승인 요청에 쓸 수치 (요청 아님 — 수치만)

| 기준 | /studio 진입 | /studio 복원 |
|---|---|---|
| 측정된 최소(S5a-r · 편집기 배선 없음 · 하한) | 130313 = 판정선 +413 · 절대 +313 | 133346 = 판정선 +406 · 절대 안(−654) |
| 편집기 배선 포함(S5b 정적) | 130649 = 판정선 +749 · 절대 +649 | 133682 = 판정선 +742 · 절대 안(−318) |
| 조건 참 UNAPPROVED(S5c) | 130788 | 133821 |

## 8. 원복 · base 바이트 검증

| 항목 | 명령 | 결과 |
|---|---|---|
| 원복 | `git checkout 418979e -- app/src/data/memoryProjectRepository.ts app/src/data/projectRepository.ts` + 새 파일 `saveLedger.ts` `rm`. S5b→S5a-r 전환 때 `useDocSave.ts`·`studioRepository.ts`·`StudioLayout.tsx` 같은 방식으로 되돌림 · `ledgerSeed.ts` `rm` | reset/clean 0 |
| app diff | `git diff --quiet 418979e -- app` | exit=0 · `git ls-files -o --exclude-standard app` 빈 출력 (`40-restore-appdiff.txt`) |
| lock | `git diff --quiet 418979e -- app/package-lock.json` · `shasum` | exit=0 · `fdd7c98e…` = `00-lock-before.txt` |
| base 재빌드 | `npm run build` | exit=0 (`41-restore-build.txt`) |
| dist 바이트 | `find . -type f \| sort \| xargs shasum` vs `01-base-dist-sha.txt` | 143/143 동일 (`42-restore-dist-sha.txt` · `.result`) |
| rawbytes | `diff 03-base-rawbytes.txt 43-restore-rawbytes.txt` | 출력 0, 바이트 동일 |

- 테스트 재실행 0(BRIEF: suite는 base 1회만).
- 부수 정리: rs4-measure `tools/.rawbytes.gen.mjs`(이번 base rawbytes 실행이 남긴 생성 파일 · untracked)를 삭제했다. rs5 사본이 만든 gen 파일도 측정마다 삭제했다.

## 9. 증거 파일

- `patches/S5a.patch` · `S5ar.patch` · `S5b.patch` · `S5c.patch`: 실험 diff 원문. 기존 파일과 새 파일 헌크 모두 **저장소 root 기준 경로(`app/src/...`)** 다.
- `git diff --cached --check`: patches 밖 파일은 exit=0이다. patches는 빈 context 줄(`" "`)만 trailing whitespace로 잡힌다. 이것은 patch 형식이 요구하는 공백이라 그대로 두었다(지우면 patch가 깨진다). rs4-measure `patches/S3.patch`(467a691)도 같은 줄 20개를 그대로 커밋했다.
- `rawlogs/`: `00`~`03` base · `10`~`13` S5a/S5a-r · `20`~`21` S5b · `30`~`31` S5c · `*-marker.txt`(dist에 실제로 들어간 것 확인: `publishedMark` 청크 · `.acquire(` 청크 · `ledgerSeed` manifest 키) · `*-chunks.txt` · `40`~`44` 복원·귀속.

## 10. 필요한 결정 (사용자/Jarvis)

1. 판정선 안에 들어가는 후보는 0건이다. 진입 여유는 4B이고, 최소 하한도 +417B다. 선택지는 셋이다: (a) /studio 예산 상향 승인(7절 수치) (b) 장부 진입 몫을 0으로 만드는 다른 구조 설계(예: 기존 저장소 코드 감량으로 상쇄 — 미측정) (c) CONTRACT-5 범위 축소.
2. seed lazy(S5c)는 진입 절감 효과가 없다(4절). 계약 8.2의 3행 "lazy 가능" 문구를 다시 볼 것.
