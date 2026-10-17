# RS6-L4 REPORT — UX 상태·버튼·충돌·문구

브랜치 `k002bill2/rs6-l4-ux` · base `aca09805` · 작성 2026-10-17 · Developer(Orca Claude Code).

## 0. 결론 — 예산 정지 (BRIEF 규칙 "상한 초과 → 감량 1회 → 그래도 넘으면 멈추고 보고")

- **CP1만으로 `/studio` 상한을 넘었다.** CP1 1차 실측은 정규화 **129.52**(+0.43)다. 상쇄 2개를 포함한 감량 1회 뒤에도 **129.25**다. 상한은 129.13, 멈춤선은 129.12다.
  - raw 130.58은 한도 130.5를, 복원 진입 132.24는 상한 132.11을 함께 넘었다.
- **새 구현을 멈췄다.** CP2(저장 확인·다시 저장·폐기 대화상자), CP3(충돌 두 선택·포커스), CP4(나머지 문구·금지 문구 가드)는 착수하지 않았다.
- **앱 코드 변경은 이 브랜치에 커밋하지 않았다.** build가 예산 검사로 exit 1이라 "빌드 깨진 채 커밋 금지"에 걸린다. 브랜치의 앱 코드는 base와 같다.
  - CP1 + 감량 작업은 `patches/cp1-reduce1.patch`(9파일, +183/−14)로 보존했다. 적용 방법: `git apply dev/active/rs6-l4-ux/patches/cp1-reduce1.patch`.
- 기준선 파일(`m2cBaseline.json`·`bundleBudget.test.mjs`)은 바꾸지 않았다. 상한 밖이라 실측 갱신 대상이 아니다.
- **결정 필요(Jarvis → 영환님 재상신)**: 6절 선택지 중 하나.

## 1. 예산 표 (같은 머신 · 직렬 빌드 · `npm run build` 출력 그대로)

| 상태 | `/studio` 정규화 | `/studio` raw | 복원 정규화 | 복원 raw | build | 로그 |
|---|---|---|---|---|---|---|
| base `aca09805`(기준선) | 129.09 | 130.42 | 132.07 | 133.45 | exit 0 | `logs/base-build.txt` |
| CP1 1차(문구·판정 전부 진입) | **129.52** (+0.43) | 130.86 | 132.50 | 133.89 | exit 1 | `logs/cp1-build.txt` |
| CP1 + 감량 1회(상쇄 ①② 포함) | **129.25** (+0.16) | 130.58 | 132.24 | 133.61 | exit 1 | `logs/cp1-reduce1-build.txt` |
| 상한 · 한도 | 129.13 (멈춤선 129.12) | 130.5 | 132.11 (멈춤선 132.10) | 134 | | BRIEF · `m2cBaseline.json` |

## 2. 청크 구성 (vite 출력 gzip KB · 해시 제거 대조)

| 청크 | base | CP1 1차 | 감량 뒤 | 배치 |
|---|---|---|---|---|
| `StudioLayout` | 19.73 | 20.17 (+0.44) | 19.91 (+0.18) | 진입 |
| `ConflictCallout` | (StudioLayout 안) | (StudioLayout 안) | 0.43 (새 청크) | 조작 뒤(충돌 때만) |
| `memoryDocBook` | 5.00 | 5.00 | 5.21 (+0.21) | 조작 뒤(reason 문구 `save/reasonText.ts` 포함) |
| 그 밖 | ±0.01 흔들림(`checkFile`·`exportFlow`·`sectionOps`·`StudioPage`·`profile*`) | | | |

- **문자열 비용(추정)**: CP1 1차 `StudioLayout` 청크에서 새 한국어 문장 6개를 빼고 gzip -9로 다시 재면 −180B다. 나머지 약 +0.26은 판정 코드다(출처 객체 · inflight 판정 · 재진입 다시 그리기 · hang 문구 분기).
  - 정규화 도구의 압축 수준과 같은지는 확인하지 않았다.
- **감량 뒤 진입에 남은 것(+0.18)**: 판정 코드, slow 꼬리·hang 문구(I6 3절 문구 — G3 때문에 `saveStatusText.ts`에 둠), lazy 래퍼, 실패 때 `core.link`로 문구를 받는 결선.

## 3. 감량 1회 내용 (상쇄 후보 조사 포함)

| # | 후보 | 결과 | 채택 |
|---|---|---|---|
| ① 상쇄 | `ConflictCallout` → `lazy()`. 충돌 때만 그려진다 | 새 청크 0.43KB · 진입 순감 약 0.1(추정 — 문구 이동과 한 빌드) | 패치에 포함 |
| ② 감량 | 환경 reason 문구 4개(readonly·cleared·unsupported·image-missing)를 조작 뒤 `save/reasonText.ts`로 옮김. `coreIo.text`로 노출하고, 훅이 실패 결과와 같은 갱신에서 `core.link`로 받는다(알림 2번 0) | 진입 약 −0.15 · `memoryDocBook` +0.21 | 패치에 포함 |
| 검토만 | `infra.ts` `READ_ONLY_TAB`·`CLEARED_TAB` 재사용 | 진입 ↔ localSync 공유 모듈 간선이 생긴다(L2 +0.15 사례) | 기각 |
| 검토만 | slow 꼬리·hang 문구도 조작 뒤로 | RS6-AC-G3("3절 새 문구 = `saveStatusText.ts` 1곳")와 충돌한다 | 기각(G3 우선) |

- ②는 문구 위치를 둘로 나눈다. 3절 문구는 `saveStatusText.ts`, UX-5 2.3 환경 문구는 `save/reasonText.ts`다. 채택하려면 G3 해석 확인이 필요하다(6절).

## 4. CP1 작업 내용 (패치 · 미커밋)

- **판정 출처(I6 8.1)**: `saveStatusText(state, persistence, now, source)`의 4번째 인자로 `SaveSource { reason, text, inflight, dirty }`를 받는다.
  - 판정 순서(UX-5 2.2 우선순위): STALE(충돌) > 환경 reason 문구 > offline > 저장 중(**코어 `view().inflight`**, slow면 꼬리) > 실패 > 저장 전 변경(**`view().dirty`**) > 저장됨.
- **훅 결선**: `useDocSave`는 `source`(코어 view + 마지막 실패 reason·문구, 성공이면 지움)와 `core`를 돌려준다. `StudioLayout`이 `SaveStatus`에 `source`를 넘긴다.
  - POP 재진입 때 앞 lease 해제 save가 진행 중이면 `core.idle()` 뒤 다시 그린다(L3b 인계 2, C5 T1 단위판).
- **alert**: hang이면 `SAVE_HANG_TEXT`를 `role=alert` `<p>`에만 넣는다. aria-busy 상태 글자에는 넣지 않는다(L2 QA 7절 3).
  - 실패 alert는 reason 문구가 있으면 그 문구, 없으면 ★"저장하지 못했습니다"다.
- **테스트(TDD)**: RED 11 → GREEN 17/17(`logs/cp1-red.txt`).
  - `features/studio/saveStatusText.source.test.ts`: I6 8.1 출처별 1행 11개 + slow 꼬리 + 환경 > saving + memory "브라우저에 저장됨" 0.
  - `components/studio/SaveStatus.source.test.tsx`: 포트 readonly → 글자·alert · POP 재진입 inflight → "저장 중…" → 끝나면 해제 · hang alert 위치.
- **전체 스위트(패치 상태)**: 2971 passed · 3 failed(`logs/cp1-reduce1-full-test.txt`). 3건 모두 문구·배치 변경에 따른 예상 깨짐이다. 단언은 고치지 않았다(정지).

| 깨진 단언 | 이전 | 이후(패치) | UX-5 근거 |
|---|---|---|---|
| `StudioLeave.test.tsx:198` 읽기 전용 탭 | "저장하지 못했습니다" | "다른 탭에서 편집 중이라 이 탭은 저장하지 않습니다" | 2.3 `readonly` 행 |
| `liveness.status.test.tsx` aria-busy | "저장 중…" 정확 일치 | "저장 중… · 브라우저 응답이 늦습니다"(slow) | I6 3절 LV-1 꼬리 |
| `StudioLayout.test.tsx:153` STALE → ConflictCallout | 동기 `getBy` | lazy 청크라 `findBy`(비동기)가 필요 | 감량 ① 배치 변경(문구 변화 0) |

## 5. AC 판정

| AC | 판정 | 근거 |
|---|---|---|
| CP1 판정 출처 표(I6 8.1 출처별 1행) | 패치에서 GREEN · **브랜치 미반영** | 4절 · 예산 정지 |
| RS6-AC-U8 버튼 1:1 · 연타 1회 | BLOCKED: 예산 정지로 CP2 미착수 | 0절 |
| RS6-AC-U9 memory "저장 확인" DOM 0 · "브라우저에 저장됨" 0 | 부분: 문구 쪽만 패치 테스트 GREEN · 버튼 DOM은 CP2 미착수 | 4절 |
| RS6-AC-G3 금지 문구 0 + 3절 문구 1곳 | BLOCKED: CP4 미착수. 3절 문구 2개(slow·hang)는 패치에서 `saveStatusText.ts`에 있음 · discard timeout 문구는 대화상자와 함께 미착수 | |
| UX5-AC-01 · 04 · 05 · 06 · 12 · 14 | BLOCKED: CP2·CP3·CP4 미착수 · 실화면 0 | |
| Ego Lite 실화면 | BLOCKED: 예산 정지(브랜치 앱 코드 = base라 볼 변경이 없음) | |

## 6. 결정 필요 (재상신 재료) — ★ 권장

| # | 선택지 | 근거·비용 |
|---|---|---|
| ★A | L4 몫 상향을 승인한 뒤 재개한다. 크기는 전체 L4를 잰 뒤 정한다 | CP1만 +0.16(감량 뒤)이다. CP2 버튼·핸들러 결선, CP3 포커스 결선, CP4 금지 문구 가드는 진입에 더 들어온다. 대화상자 본문은 lazy다. **전체 L4 증분은 미측정**이다 — 추정 +0.3~0.5, 근거는 CP1 코드만 +0.18이라는 점뿐(L3)이다 |
| B | 범위를 축소한다. 상태 글자 출처 교체(CP1)만 남기고, 버튼·대화상자·충돌 포커스는 QA 뒤 별도 레인으로 미룬다 | CP1만으로도 상한을 넘는다 → B도 아래 "CP1 바닥 초과분"만큼 상향이 필요하다 |
| C | 상쇄를 더 찾는다. 다른 진입 코드 감량 레인을 먼저 돌린다 | 이번 감량 1회에서 찾은 상쇄는 ConflictCallout lazy 1개뿐이다. 다른 후보는 조사하지 않았다 |

- **CP1 바닥 초과분**(감량 뒤 · 판정 줄별 · CP2~CP4 진입 결선은 이 위에 더해진다):

| 판정 줄 | 실측 | 상한·한도 | 초과 |
|---|---|---|---|
| `/studio` 정규화 | 129.25 | 129.13 | **+0.12** |
| `/studio` raw | 130.58 | 130.5 | **+0.08** |
| 복원 진입 정규화 | 132.24 | 132.11 | **+0.13** |
| 복원 진입 raw | 133.61 | 134 | 0(한도 안) |

- 함께 정할 것: 감량 ②(환경 문구를 조작 뒤 `save/reasonText.ts`에 두기)가 RS6-AC-G3 "문구 1곳"과 맞는지.

## 6a. QA 게이트 인계

- RS6-AC-U8 · U9 · G3 · UX5-AC-01/04/05/06/12/14는 L4 재개 전에는 판정할 수 없다. QA 게이트는 L4 몫으로 RS6를 닫을 수 없다.
- 기준선 파일은 그대로다(129.09 / 132.07). L5의 `/studio` 증분 0 목표와 남은 여유 0.04에 영향 0.
- QA 확인 질문: 다른 탭 stale(포트 `mode()`)을 지금처럼 `ConflictCallout`으로 보낼지, I6 8.1대로 `stale` 행으로 보낼지(7절 첫 항).
- L4 재개 때 함께 할 것: Codex P2(slow 전환 status 1회, 10절) · 4절 예상 깨짐 3건의 단언 교체(UX-5 근거 표 그대로).

## 7. 설계 판단·발견 (구현 재개 때 그대로 쓴다)

- **다른 탭 stale 매핑을 유지했다.** 지금은 포트 `mode()` = `stale`이면 `STALE_DOC` → 충돌 Callout이다. I6 8.1은 이 경우를 `stale` 환경 행("새로고침한 뒤 편집하세요" + 버리고 새로고침)으로 보낸다.
  - 지금 `ConflictCallout`에 닿는 제품 경로는 이 매핑 하나뿐이다. 바꾸면 Callout에 닿는 경로가 없어지고, `useDocSave.test:212`·`StudioLayout.test:157` `conflict.latest` 단언의 의미가 바뀐다.
  - 또 다른 탭 stale에서 `resolveConflict`는 같은 stale 게이트로 쓰므로 성공하지 못할 가능성이 높다(추정 — 실행 0).
  - → QA/Jarvis 확인 항목으로 둔다. 표 테스트의 "포트 mode stale" 행이 지금 매핑을 명시한다.
- **"replace 결선" = `rebase`다.** `memoryDocBook.resolveConflict`가 이미 같은 동기 구간에서 `rebase(core, doc, mine)`를 부른다. 이 호출이 epoch +1, savedMark·confirmed 맞춤을 한다.
  - `resolveConflict` 뒤에 `coreIo.replace`를 또 부르면 문제가 생긴다. replace는 `mark += 1`만 하고 savedMark는 그대로라 코어가 dirty가 되고, 추가 저장이 나가고, epoch가 +2가 된다.
  - 그래서 MQ-6-5 A 조합은 "resolveConflict(rebase 포함)"로 대응한다. CP3에서 할 일: 실제 저장소 위에서 선택마다 `core.view().epoch` +1을 단언하고, `rebase`의 `s.epoch += 1`을 지우는 변이로 RED를 확인한다(L3a QA M2b 생존 변이 해소).
- **편집기 안 "저장 확인"을 노출할 상태**: `readonly`만 있다. seed `unconfirmed`는 편집기 밖 미확인 기록(PendingRecord, L5 경로) 신호가 필요하다 → BLOCKED(L5).
  - `image-missing` 슬롯 포커스는 G7 미해결이라 문구만 둔다. 개수 `{n}`은 결과에 없어서 "이미지를 저장하지 못했습니다"로 했다(UX-5와 다름 — 사유: 결과에 개수 없음).
- **quota 꼬리("· 저장 공간 부족")를 넣지 않았다.** 포트가 quota를 reason 코드로 내지 않는다. `toInfra`가 메시지만 남겨 `reasonOf`가 `not-committed`가 된다.
  - 고치는 곳은 조작 뒤 포트(진입 0)라 재개 때 넣을 수 있다.
- **unsupported 알림**: UX-5는 status 1회지만, 패치는 alert 1곳(실패 alert와 같은 자리)에 둔다. 진입 바이트를 아끼려고 했다 — 재개 때 재검토.
- 인계 반영 위치: L2 QA 4절 1·2(`core.link` confirm · `core.discard()` reject 매핑)는 CP2 핸들러에서 catch해야 한다. 패치의 문구 받기 `core.link`는 이미 `.catch(() => undefined)`다.

## 8. 검증 (fresh)

- 브랜치 상태(앱 코드 = base) 게이트: 9절 마감 표.
- 패치 상태: CP1 테스트 17/17 GREEN · 전체 2971/2974(3건 = 4절 예상 깨짐) · `tsc --noEmit` exit 0 · build exit 1(예산).
- Codex: 10절.

## 9. 마감 게이트 (브랜치 = base 앱 코드 · `git diff aca09805 -- app` 0줄 · fresh)

| 명령(`app/`) | 결과 | 로그 |
|---|---|---|
| `npm run typecheck` | exit 0 | `logs/final-typecheck.txt` |
| `npm run lint` | exit 0 | `logs/final-lint.txt` |
| `npm test -- --run` | exit 0 · 331 files / 2957 tests passed (base 331/2957 + 증분 0) | `logs/final-test.txt` |
| `npm run build` | exit 0 · `/studio` 정규화 129.09 · raw 130.42 · 복원 132.07 · raw 133.45 (base와 같음) | `logs/final-build.txt` |

- 패치는 base 위에 `git apply --check`로 깨끗하게 적용된다(되돌린 직후 확인).

## 10. Codex 검증 (r1 · `review --scope working-tree` · 대상 = 패치 상태 작업 트리 · `logs/codex-r1.txt`)

- 범위 메모: BRIEF는 `--scope branch --base aca09805`를 지정했다. 하지만 정지로 브랜치 앱 diff가 0이 되므로, 검토 가치가 있는 패치 상태(미커밋 작업 트리)를 대상으로 바꿨다.

| 지적 | 판정 | 처리 |
|---|---|---|
| [P1] 진입 번들 증가로 예산 검사 실패(`useDocSave.ts:76-78`) — Codex 재측정 129.17 · 132.14 | 맞음 — 정지 사유와 같다 | 반영 0(정지). 메인 재측정은 같은 dist에서 129.25 · 132.24(공식 build 출력과 같음). Codex 수치와의 차이 원인은 미확인(Codex 실행 환경 차이 추정) |
| [P2] slow 전환이 status 영역에 알려지지 않음(`saveStatusText.ts:57`) — I6 8.4 "`saving-slow` 꼬리는 status 1회" | 맞음 | 반영 0(정지). 재개 때 `saveAnnouncement`에 첫 slow 전환 status 1회를 넣는다(진입 바이트 추가) |

- Codex 측 Vitest는 샌드박스 임시 디렉터리 EPERM으로 실행되지 못했다. 테스트 결과는 메인 실행(4절)만 유효하다.
- 반영 라운드 0 · 라운드 상한 안(1회).

## 11. 서브에이전트

- 사용하지 않았다. 사유: BRIEF가 권한 읽기 전용 1개(UX-5·I6 8절 대응표)의 내용을 메인이 이미 직접 읽었다. 다시 읽히면 같은 내용을 두 번 적재한다. 또 CP1에서 예산 정지가 나서 CP2~4 대응표를 쓸 곳이 없었다.

## 12. 사실 / 추정 / 미확인

- **사실 [L1]**:
  - 1·2절 수치(build 출력), 4절 테스트 결과(로그).
  - `resolveConflict`가 `rebase`를 부른다(`memoryDocBook.ts:366`).
  - `coreIo.replace`는 savedMark를 바꾸지 않는다(`coreIo.ts:121-130`).
  - `toInfra`는 reason 코드를 남기지 않는다(`infra.ts:20-23`).
- **추정 [L2·L3]**:
  - 문자열 비용 180B(gzip -9, 도구 압축 수준과 다를 수 있음).
  - 감량 ①·②의 개별 기여(한 빌드로 쟀다).
  - 전체 L4 증분 +0.3~0.5.
  - 다른 탭 stale에서 resolveConflict 실패.
- **미확인**: CP2~CP4 실측 · 실화면 · 다중 탭 · ConflictCallout lazy 첫 그림 지연(충돌 진입 때 청크 로드 1회)이 alert·포커스 규칙(UX5-AC-04)에 주는 영향.
