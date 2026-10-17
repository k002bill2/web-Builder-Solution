L4 전체(CP1~4, 상쇄 반영) /studio 정규화 129.15 · raw 130.47 · 복원 132.13 → 필요 상향: 정규화 +0.02 · raw +0 · 복원 +0.02 (UNMEASURED 하한)

# RS6-L4 MEASURE REPORT — L4 전체 진입 증분 실측 + 상쇄 후보

브랜치 `k002bill2/rs6-l4-ux` · 앱 = base `aca09805` · 작성 2026-10-17 · Developer(Orca Claude Code) · 브리프 `BRIEF-MEASURE.md`.

- 상향 계산 기준(REPORT 6절과 같음): 필요 상향 = 실측 − 상한(정규화 129.13 · raw 130.5 · 복원 132.11). 음수면 0이다. 복원 raw는 한도 134를 넘을 때만 적는다.
- 판정 도구의 멈춤선은 정규화 > 129.12, 복원 > 132.10이다(`check-bundle-size` 출력). 위 +0.02는 멈춤선 기준으로는 +0.03이다.
- 측정용 앱 코드는 커밋하지 않았다. 모든 상태를 `patches/measure-*.patch`(누적 패치, base 기준)로 보존했다.
- 마감 상태: `git diff -- app/` 0줄 · `git status --porcelain app/` 0줄. base 재빌드 dist sha는 M0와 같다(5절).

## 0. 요약

1. **상쇄를 반영한 L4 전체(M2d)는 정규화·복원 모두 상한을 0.02 넘는다. raw는 한도 안이다.**
   - 상쇄 전 L4 전체(CP4)는 129.72였다. 상쇄 4건으로 −0.57을 줄였다.
2. **설계 질문 ①을 I6 8.1안(다른 탭 stale → `stale` 행)으로 정하면 상향 0으로 들어간다.**
   - 이때 129.12 · 130.43 · 132.10 · 133.46이고, build는 exit 0이다.
   - 대가: 기존 테스트 4건의 의미가 바뀐다(4절 ①).
3. **설계 질문 ②: 문구를 1곳(`saveStatusText.ts`)에 두면 분리안보다 +0.17 비싸다.**
   - 조작 뒤 `coreIo`까지 그 모듈을 import하면 새 공유 청크가 생겨 +0.46이 된다.

## 1. 예산 표 (같은 머신 · 직렬 빌드 · `npm run build` 출력 그대로)

| 상태 | 패치 | `/studio` 정규화 | raw | 복원 정규화 | 복원 raw | `/projects` 첫/자동 | `/profile` 첫/자동 | build | 로그 |
|---|---|---|---|---|---|---|---|---|---|
| M0 base | — | 129.09 | 130.42 | 132.07 | 133.45 | 99.16 / 109.04 | 99.56 / 120.10 | 0 | `raw/measure-m0-base-build.txt` |
| M0 CP1(감량 1회) | `cp1-reduce1` | 129.25 | 130.58 | 132.24 | 133.61 | 99.14 / 109.02 | 99.55 / 120.09 | 1 | `raw/measure-m0-cp1-build.txt` (REPORT 1절 재현 일치) |
| CP2 누적 | `measure-cp2` | 129.67 (+0.42) | 131.03 | 132.65 | **134.06** | 99.15 / 109.04 | 99.56 / 120.11 | 1 | `raw/measure-cp2-build.txt` |
| CP3 누적 | `measure-cp3` | 129.68 (+0.01) | 131.03 | 132.66 | **134.07** | 99.15 / 109.04 | 99.57 / 120.11 | 1 | `raw/measure-cp3-build.txt` |
| **CP4 누적 = L4 전체(상쇄 전)** | `measure-cp4` | **129.72** (+0.04) | 131.08 | 132.70 | **134.11** | 99.15 / 109.04 | 99.56 / 120.10 | 1 | `raw/measure-cp4-build.txt` |
| M2a(+L4 버튼 lazy) | `measure-m2a` | 129.43 (−0.29) | 130.81 | 132.41 | 133.84 | 99.16 / 109.06 | 99.57 / 120.12 | 1 | `raw/measure-m2a-saveactions-build.txt` |
| M2b(+충돌 핸들러 lazy) | `measure-m2b` | 129.34 (−0.09) | 130.70 | 132.32 | 133.73 | 99.16 / 109.05 | 99.56 / 120.11 | 1 | `raw/measure-m2b-choose-build.txt` |
| M2c(+저장소 청크 합침) | `measure-m2c` | 129.29 (−0.05) | 130.65 | 132.27 | 133.68 | 99.07 / 108.99 | 99.54 / 120.09 | 1 | `raw/measure-m2c-chunkmerge-build.txt` |
| **M2d(+프로필 청크 합침) = 조합** | `measure-m2d` | **129.15** (−0.14) | **130.47** | **132.13** | 133.50 | 99.04 / 108.92 | 99.51 / 119.93 | 1 | `raw/measure-m2d-profilemerge-build.txt` |
| M3① 변형(M2d + stale 행) | `measure-m3a-stale-row` | 129.12 | 130.43 | 132.10 | 133.46 | 99.05 / 108.93 | 99.52 / 119.94 | **0** | `raw/measure-m3a-stale-row-build.txt` |
| M3② 변형(문구 1곳 + coreIo 간선) | (파일 3개 교체 — 4절) | 129.61 | 130.95 | 132.59 | 133.98 | 99.06 / 108.95 | 99.53 / 119.94 | 1 | `raw/measure-m3b-onetext-build.txt` |
| M3②b 변형(문구 1곳 · 간선 없음) | `measure-m3b2-onetext` | 129.32 | 130.65 | 132.30 | 133.68 | 99.05 / 108.93 | 99.53 / 119.95 | 1 | `raw/measure-m3b2-onetext-noedge-build.txt` |
| 마감 base 재빌드 | — | 129.09 | 130.42 | 132.07 | 133.45 | 99.16 / 109.04 | 99.56 / 120.10 | 0 | `raw/measure-final-build.txt` |

- 모든 빌드에서 preload 가드는 17개 청크로 base와 같았다. 진입에 새 청크가 끌려온 경우는 M3②뿐이다. 그 경우는 공유 청크 `saveStatusText` 1.00KB로, preload 목록 수는 같았지만 진입 합계에 들어갔다.

## 2. M1 — CP별로 붙인 것 (실제 동작 · typecheck 통과 · 빈 stub 0)

| CP | 진입(StudioLayout 청크 gzip) | 조작 뒤 | 내용 |
|---|---|---|---|
| CP1 | 19.73 → 19.91 | ConflictCallout 0.43 · memoryDocBook +0.21 | `cp1-reduce1.patch` 그대로(REPORT 4절) |
| CP2 | → 20.35 (+0.44) | 새 `DiscardDialog` 1.04 | `useDocSave.confirm`: `core.link`로 `io.confirm` 1회 호출. 진행 중 promise 공유 · reject → failed 매핑 · 성공이면 reason을 지우고 `settle`. `useDocSave.discard`: `core.discard()` 1회 호출. discarded·stale·cleared면 reload, 그 밖이면 reason 반환, reject면 "failed". `SaveStatus` 버튼 1개 규칙: readonly → "저장 확인"(dirty·memory면 숨김), stale·cleared → "버리고 새로고침", 그 밖 실패 → "다시 저장". 버튼은 aria-busy·aria-disabled를 쓰고 `disabled`는 쓰지 않는다. 폐기 대화상자: `role=alertdialog` + `showModal`, 첫 포커스 "취소", Esc = 취소, 시간 초과 alert, 닫히면 연 버튼으로 포커스 복귀 |
| CP3 | → 20.35 (+0.00) | ConflictCallout 0.44 → 0.71 | 두 버튼에 결과 1줄을 `aria-describedby`로 연결 · 본문 "고르기 전에는 저장하지 않습니다." · `disabled` → aria-disabled(포커스 유지). 성공: h1 포커스 + 문서 단위 status(UX-5 5.5), 실패: 포커스 유지 + 기존 알림. **epoch +1 단언**은 `saveCore.epoch.test.ts`(mine·theirs 2건)이다. `rebase`의 `s.epoch += 1`을 지우는 변이를 넣으면 2건 모두 FAIL, 되돌리면 PASS다(`raw/measure-cp3-epoch-red.txt`) |
| CP4 | → 20.40 (+0.05) | DiscardDialog +0.04 · SnapshotLayer(조작 뒤) | `DISCARD_TIMEOUT_TEXT`를 `saveStatusText.ts`에 두고, 대화상자 `data-alert-key=DISCARD_TIMEOUT_ALERT`로 연결 · slow 진입 status 1회(Codex r1 P2 — `saveAnnouncement`) · "저장하지 못해 복원하지 않았습니다 · 저장한 뒤 다시 복원하세요"(L3b 인계 — `SnapshotPreview`, 조작 뒤 청크) · 금지 문구 가드 `src/test/saveForbiddenText.test.ts`(8건) · U9 테스트 `SaveStatus.buttons.test.tsx`(3건) |

- CP2가 진입 증분의 대부분(+0.42)을 차지한다. 버튼 분기 JSX, confirm·discard 본문, lazy 래퍼가 진입에 들어갔기 때문이다. M2a에서 이 대부분을 조작 뒤로 옮겼다.
- 금지 문구 가드에서 처음 1건이 걸렸다. `features/pending/DiscardConfirm.tsx:3`의 **주석** "자동 복구가 아니다"(부정 서술, L5 경로)였다. 가드는 주석을 빼고 화면 문구만 검사하도록 했다(L5 경로는 수정하지 않음).
- M2d 상태 전체 스위트: **2984 passed · 3 failed / 336 files**(`raw/measure-m2d-full-test.txt`). 실패 3건은 REPORT 4절의 예상 깨짐 3건과 같다(StudioLayout STALE→ConflictCallout 동기 getBy · StudioLeave 읽기 전용 문구 · liveness aria-busy slow 꼬리).
  - 기존 `ConflictCallout.test.tsx`는 패치 안에서 단언을 교체했다. 문구 "내 편집은 그대로 두었습니다" → UX-5 5.2 본문 2문장, `toBeDisabled` → `aria-disabled`(UX5-AC-07), props → `resolve`·`heading`(M2b). 브랜치에는 반영하지 않았다.

## 3. M2 — 상쇄 후보 (A표 = 동작 변화 0 · B표 = 동작 변화 있음)

조사: 읽기 전용 서브에이전트 1개(Explore, base manifest 기준) — `raw/measure-m2-subagent-survey.md`. 실측은 메인이 직렬로 했다.

### A표 (실측 · 모두 조합 M2d에 포함)

| # | 후보 | 실측 | 동작 | 비고 |
|---|---|---|---|---|
| M2a | L4 새 코드: 환경 reason 버튼·confirm/discard 본문·폐기 대화상자를 lazy `SaveActions` 청크로 옮김(reason이 있을 때만 받는다) | **−0.29** | 기존 동작 변화 0. L4 새 버튼은 실패 결과 뒤 청크 로드 1회 후에 나타난다. reason 문구도 이미 같은 시점에 `core.link`로 받는다 | 새 청크 SaveActions 1.45KB(조작 뒤) |
| M2b | L4: 충돌 선택 핸들러(`choose` · busy 상태)를 이미 lazy인 ConflictCallout 청크로 옮김 | **−0.09** | 변화 0. 핸들러는 Callout이 그려진 뒤에만 불린다 | ConflictCallout 0.71 → 0.85 |
| M2c | vite `codeSplitting` 그룹: `data/projectRepository` + `features/projects/useProjectRepository`를 한 청크로 합침 | **−0.05** | 변화 0(청크 경계만 바뀜) | `/projects` 첫 화면 −0.09 |
| M2d | vite 그룹: `domain/profileContrast` + `domain/effectiveProfile` 합침 | **−0.14** | 변화 0 | 판정 밖 `/compare` 조작 뒤 `memoryProfileAdjust` +0.66(18.73 → 19.39) · `/profile` 자동 −0.17 |

- M2c·M2d는 `vite.config.ts`를 바꾼다. 브리프 금지 목록(기준선·ADR·`check-bundle-size.mjs`·`bundleBudget*`)에는 들지 않는다. 다만 채택하면 `src/build/` 목록 모듈로 옮기는 정리가 필요하다(선례 `studioEngineChunk.ts`).

### B표 (조사만 · 실측 0 — 동작 변화가 있어서)

| 후보 | 추정 | 동작 변화 |
|---|---|---|
| `PageInfoFields` lazy(`EditFields.tsx:12,49`) | ~0.4 | 게이트 "SEO 메타" `goTo`가 요소를 못 찾으면 포커스가 낙하한다 · 섹션 0 문서는 첫 그림이 지연된다 |
| `ExportRetryAlert` lazy(`StudioLayout.tsx:41`) | ~0.3 | 청크 실패 때도 경고를 내야 하는 계약(`ExportAfter.tsx:82`)이 깨진다 |
| gate 요약·export 클릭 경로 lazy | 0.2~0.3 | 알림·확인 대화상자가 비동기가 된다 |

## 4. 설계 질문 2건 — 근거 (결정은 Jarvis)

### ① 다른 탭 stale: `ConflictCallout`(지금) vs I6 8.1 `stale` 행

| 안 | 실측(M2d 위) | 테스트 영향 | 동작 |
|---|---|---|---|
| 지금(Callout 유지) = M2d | 129.15 · 130.47 · 132.13 | 0 | 다른 탭 stale → 두 선택. 단 `resolveConflict`가 같은 stale 게이트에 막힐 가능성(REPORT 7절, 미확인) |
| I6 8.1 `stale` 행 | **129.12 · 130.43 · 132.10 · 133.46 (exit 0)** — M2d 대비 −0.03 | `useDocSave.test` 2건 + `StudioLayout.test` 2건 = **4 failed / 23**(`raw/measure-m3a-stale-row-tests.txt`) — 모두 "port stale → STALE_DOC·Callout·PNG 이유" 의미 단언 | stale → failed + 문구 "다른 탭에서 바뀐 내용이 있습니다 — 새로고침한 뒤 편집하세요" + "버리고 새로고침"(→ 폐기 확인 → discard·reload) |

- 변형 내용: `useDocSave.save`에서 stale일 때 `port.head` 읽기와 STALE_DOC throw를 지우고 INFRA로 보낸다. `reasonText`에 stale 문구 1줄을 더한다.
  - 진입 감량 −0.03의 출처는 head 읽기 결선 제거다. ConflictCallout은 제품 경로가 0이 되지만 lazy라 진입 비용은 0이다.
  - `resolve`·`conflict.latest`는 남겨 두었다. 지우면 진입이 더 줄 수 있지만 실측하지 않았다.
- 이 안이면 L4 전체가 상향 0으로 들어간다. 다만 멈춤선과 같은 값(129.12·132.10)이라 여유는 0이다.

### ② 문구 2파일 분리(`saveStatusText.ts` + 조작 뒤 `save/reasonText.ts`) vs 1곳 유지

| 안 | 실측 | 차이(M2d 대비) |
|---|---|---|
| 분리(지금 패치) = M2d | 129.15 · 130.47 · 132.13 | — |
| 1곳 + `coreIo`가 `saveStatusText`를 import | 129.61 · 130.95 · 132.59 | **+0.46** — 새 공유 청크 `saveStatusText` 1.00KB가 진입에 들어간다(L2 +0.15와 같은 패턴) |
| 1곳 + 간선 없음(`SaveStatus`가 직접 매핑 · `io.text` 미사용) | 129.32 · 130.65 · 132.30 | **+0.17** |

- RS6-AC-G3 문면은 "3절 새 문구 = `saveStatusText.ts` 1곳"이다. 분리안에서 `reasonText.ts`에 있는 문구는 UX-5 2.3 환경 문구(readonly·cleared·unsupported·image-missing)다. **3절(LV) 문구(slow 꼬리·hang·discard timeout)는 모두 `saveStatusText.ts`에 있다.** 문면으로는 G3와 충돌하지 않는다고 판단한다(해석 확인은 Jarvis/QA).

## 5. 복원 · 마감 게이트 (fresh · 브랜치 앱 = base)

| 확인 | 결과 | 로그 |
|---|---|---|
| `git diff -- app/` · `git status --porcelain app/` | 0줄 · 0줄 | — |
| 측정 패치 9개 `git apply --check` | 모두 ok | — |
| base 재빌드 dist sha | `5665286878e5…6ff2` = M0와 같음 | `raw/measure-{m0-base,final}-dist-sha.txt` |
| `npm run build` | exit 0 · 129.09 / 130.42 / 132.07 / 133.45 | `raw/measure-final-build.txt` |
| `npm run typecheck` | exit 0 | `raw/measure-final-typecheck.txt` |
| `npm run lint` | exit 0 | `raw/measure-final-lint.txt` |
| `npx vitest run` | exit 0 · 331 files / 2957 tests passed | `raw/measure-final-test.txt` |

- 복원 방법: `git checkout -- app/` + 내가 만든 새 파일만 삭제했다(목록 8개: DiscardDialog·SaveActions·reasonText·테스트 5). reset·clean은 쓰지 않았다.

## 6. UNMEASURED (하한의 근거 — 각 항목이 진입에 들어오는지)

| 항목 | 이유 | 진입 영향(추정) |
|---|---|---|
| seed `conflicted` 재마운트 → 충돌 제목 포커스(UX5-AC-04 후반) | 편집기에 seed phase 신호가 없다 | 신호 결선 몇 줄은 진입, 포커스 본문은 lazy ConflictCallout → 소량 + |
| seed `unconfirmed` "저장 확인"(편집기 진입 인계) | PendingRecord 신호 = L5 경로 | 진입 결선 소량 +(버튼 본문은 SaveActions lazy) |
| 이미지 `{n}`개 · 다른 프로젝트 `{n}`개 고지(UX-5 6.3) | 결과에 개수가 없다 · G1(전 장부 순회 view 없음) | 조작 뒤(대화상자·reasonText) → 진입 0 예상 |
| quota 꼬리 "· 저장 공간 부족" | 포트가 reason 코드를 내지 않는다(REPORT 7절) | 포트·reasonText = 조작 뒤 → 진입 0 예상 |
| 충돌 제목 원인 꼬리(UX-5 5.2, G8) | 원인 필드가 없다 | lazy ConflictCallout → 진입 0 예상 |
| unsupported 알림 status 1회(UX-5) vs 패치 alert | 재검토 미실행(REPORT 7절) | 진입 소량 ± |
| 폐기 대화상자 "다른 프로젝트" 문장 · 이미지 개수 | 위와 같음 | 진입 0 |

- 위 항목 중 진입에 들어오는 것은 seed 신호 결선 2건뿐으로 예상한다(추정 L3). 그래서 결론 줄의 +0.02는 **하한**이다.

## 7. 생략 · 범위 메모

- **Codex·브라우저(Ego Lite)는 브리프 금지로 실행하지 않았다.** 전역 규칙(Codex 게이트)보다 브리프 지시를 우선했다. 측정 코드는 커밋하지 않으므로 리뷰 대상 diff도 없다.
- 기준선(`m2cBaseline.json`·`bundleBudget.test.mjs`)·ADR·`check-bundle-size.mjs`·SPEC·INTEGRATE-6·UX-5는 수정하지 않았다.
- 다른 워크트리(`rs6-l5-projects`)는 접촉하지 않았다. 패치는 L5 경로를 바꾸지 않는다.
- 측정 패치의 테스트는 측정용이다(REPORT 규칙의 RED 선행 순서를 따르지 않았다 — epoch 변이 RED만 확인). L4 재개 때 TDD 순서로 다시 쓴다.

## 8. 서브에이전트

| 에이전트 | 역할 | 결과 |
|---|---|---|
| Explore(읽기 전용) 1개 | M2 진입 closure 상위 청크 표 · 상쇄 후보 A/B 분류 | 완료 — A표 3건 중 2건(M2c·M2d)을 실측해 둘 다 효과 있음. ①(핸들러 lazy)은 M2b로 일부 실측. B표 3건은 조사만 |

## 9. 사실 / 추정 / 미확인

- **사실 [L1]**: 1절 수치(build 출력) · 2절 테스트 결과 · dist sha 일치 · 4절 ① 변형 테스트 4 failed.
- **추정 [L2·L3]**: CP별 청크 증분의 원인 배분 · 6절 UNMEASURED의 진입 영향 · M2c·M2d 조작 뒤 영향 중 판정 밖 항목의 사용자 체감.
- **미확인**: 실화면(브리프 금지) · 다른 탭 stale에서 `resolveConflict` 실제 결과 · lazy SaveActions·ConflictCallout 첫 로드 지연이 alert·포커스 규칙에 주는 영향.
