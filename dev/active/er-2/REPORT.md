# ER-2 REPORT — 테마 바꾸기 · **번들 멈춤(/studio 진입 127.64 > 127.39) → 연결 코드 미병합, WIP 브랜치 보존**

- 브랜치 `k002bill2/er-2`(tip = base 9d817bd + T1 테스트 · 문서/로그) · 보존 `k002bill2/er-2-wip-bundle`(8ed5073, 로컬 전용 · **병합 금지**) · 서브에이전트 0 · push/merge/삭제 0
- 재개: `git diff k002bill2/er-2..k002bill2/er-2-wip-bundle -- app/src`

## 1. 멈춤 경위 (L1 — `logs/build-*.txt`)

| 빌드 | 내용 | /studio 첫 화면 | /studio 진입 직후 | 판정 |
|---|---|---|---|---|
| base(`build-base.txt`) | 9d817bd | 91.75 | **127.05** | 멈춤선 127.39 |
| build-2 | 전체 연결 v1 (themeText가 particles·selection 정적 import → 공유 청크 2개 분할) | 91.77 | 128.32 | **초과** |
| build-3 | 첫 화면 모듈 import 제거 | 91.76 | 128.00 | 초과 |
| build-4 | 판정·적용·알림을 조작 뒤 청크로 이동(첫 화면 = 버튼·캡션·열림 상태·대비 줄 버튼/링크만) | 91.76 | **127.64** | 초과(+0.59) → **멈춤** |
| tip(`build-tip.txt`) | T1 테스트만 | 91.75 | **127.05** | base와 동일 |

- build-4 원인: StudioLayout 청크 16.93 → 17.43 gz(raw +1.69KB) = 이 레인 첫 화면 코드(ThemePanel 버튼·E-S18 캡션 · 대비 줄 "테마 바꾸기"·"프로필에서 보정" · 대화상자 열림 상태·lazy 슬롯 · 되돌리기 instanceId 선택화) + 나머지 ≈0.09는 `diffSlotValues` 첫 사용으로 자동 로드 공유 청크(`issue`)가 커진 몫(트리셰이킹으로 지금까지 빠져 있던 export).
- SPEC 8절 추정(ER-2 몫 +0.04~0.08, 마일스톤 첫 화면 합계 +0.12~0.30)과 실측(+0.59)이 크게 다르다. 억지로 0.25를 더 깎아도 ER-3b·ER-4가 쓸 여유가 0이 된다 → MQ-R3 ★A 경로("넘치면 그 레인 멈춤 → 상쇄 레인 먼저")대로 멈춤.
- tip에 연결 없는 docOps/docOpRun만 남겨도 +0.10(127.15)이라(`diffSlotValues` 사용 + slotOps 이동) tip에서 뺐다.

## 2. AC 판정

| AC | 판정 | 근거 |
|---|---|---|
| ER-AC-T1 | **PASS** (tip) | `app/src/engine/ops/theme.test.ts` 2건 — 동결 입력 불변 · profileVersion만 다름 · instanceId·meta 동일 · diffSlotValues 0 · 되돌리면 hashDoc 원복 |
| ER-AC-T2 | BLOCKED(번들) — WIP에서 PASS | `ThemeDialog.test.tsx` 3건 GREEN(WIP). 닫은 뒤 포커스 = 연 버튼은 연결 코드(ThemeSwap.test T6) |
| ER-AC-T3 | BLOCKED — WIP에서 PASS | ThemeSwap.test: 알림 "테마를 프로필 v2로 바꿨습니다 · 슬롯 값 N개 모두 그대로입니다" · 캔버스 kitTokens 새 팔레트 · 대비 줄 재계산 "통과" · 목적 변화 두 번째 문장 |
| ER-AC-T4 | BLOCKED — WIP에서 알림 줄 부분 PASS | 알림 줄 "되돌리기" → v1 · Tag · 캔버스 원복 · 선택 그대로. **Ctrl+Z는 ER-4 범위**(keydown 경로 없음) — 테마 연산은 `useSectionOps.run`으로 기록 스택에 쌓아 ER-4가 이어받게 함. 해시 원복은 T1 엔진 테스트 |
| ER-AC-T5 | BLOCKED — WIP에서 PASS | 캡션 "프로필 v3가 새로 있습니다" = 버튼 설명 · 같으면 0 · "프로필 보기" `?v=` |
| ER-AC-T6 | BLOCKED — WIP에서 PASS(설계 변경 1) | 아래 3절 ER-D6 |
| ER-AC-G1 | BLOCKED — WIP에서 PASS | `src/test/gateRowActions.test.tsx`(전 줄 차단 → 줄마다 행동 ≥1 · 대비 줄 2개) |
| ER-AC-T7 | 실측 기록 | 조작 뒤 청크: ThemeDialog 0.97 · themeText 1.08 gz(build-4). 첫 화면 증가 +0.59(진입 직후) — 1절 표. 검사기는 목록 밖 lazy 청크 크기를 출력하지 않음(scripts 수정 금지) |

- WIP 브랜치 새 테스트 GREEN 증거: `logs/gate-1.txt`(연결 v1 시점 src/test·studio·engine 82파일 769건 PASS) · 최종 구조 13건 PASS(세션 실행 출력, 로그 build-4 시점).

## 3. 설계·SPEC 차이 (ADR-003 한 줄씩)

- ER-D6(T6): 대비 줄 "통과 버전 있음/없음" 판정을 **대화상자(조작 뒤)로** 옮김 — SPEC 3.3 "판정은 조작 뒤 청크 — 첫 화면 0" 준수. 줄에는 늘 "테마 바꾸기"+"프로필에서 보정", 없으면 대화상자 안에 캡션+링크·현재 버전 선택. 테스트 문구도 이에 맞춤(단언 약화 0 — 캡션·링크·aria-disabled 단언).
- SPEC 1.1 "swapTheme·diffSlotValues grep 0건"은 낡은 사실: 이미 `engine/ops/slotOps.ts:24`·`engine/ops/diff.ts:49`에 있음(+기존 테스트 `docOps.test.ts:42`). → `engine/ops/theme.ts` 신규 0 · **엔진 소스 변경 0** · PageDoc·SectionDefinition 계약 변경 0.
- 조정 요약 단어("대비 강화"·"밀도 촘촘")를 themeText에 다시 씀 — `features/profile/adjustmentText`는 프로필 청크라 import 시 공유 청크 분할 위험(GateList 주석의 +0.09 사례).

## 4. 깨진 테스트 대조 (SPEC 6절)

- tip: 깨진 테스트 0(전체 vitest 228파일 2050건 PASS — `logs/vitest-full.txt`). WIP 연결 시점도 기존 테스트 깨짐 0(`logs/gate-1.txt`).

## 5. 검증 (tip, fresh)

- `npx tsc --noEmit -p tsconfig.json` exit 0 · `npm run lint` exit 0(경고 0) · `npx vitest run` exit 0(228 files / 2050 tests) · `npm run build` exit 0(번들 검사 통과, 수치 = base와 ±0.01 — 다른 화면 /catalog 102.04→102.03 · /references 99.39→99.38 · /compare 121.70→121.69 · 나머지 동일).

## 6. Ego Lite — BLOCKED

- BLOCKED: 번들 멈춤으로 연결 코드가 tip에 없어 확인할 화면이 없음. 이 레인은 task space·창·탭을 **만들지 않았고** 서버도 띄우지 않았다(`shots/` 비어 있음).
- 포트 4337: `lsof`에 LISTEN 1건 = pid 45236 `er-1-qa/app` 의 `vite preview`(11:28 시작, **ER-1 QA 레인 서버 — 이 레인 것이 아님, 무접촉**). main 5480 무접촉.

## 7. 과정 기록 (meta)

- TDD 예측 12 vs 실제 11(ThemeSwap 8 예측 → 7). RED 로그 `logs/red.txt`(8 실패 + ThemeDialog 파일 실패 = 예측과 일치). T1은 구현이 이미 있어 RED 불가(처음부터 GREEN, 예측 커밋에 명시).
- 예측 커밋(b6e68f1, "T2~T6·G1 테스트 12개 수 예측")이 RED 테스트를 tip에 올렸다 — 그 커밋은 typecheck·`src/test` 게이트를 통과하지 못한 상태였다(규칙 위반 1건). 이번 마지막 커밋에서 tip을 초록으로 되돌림.
- 번들 멈춤선을 build-2에서 처음 넘었으나 같은 단계 안에서 두 번 줄이기를 시도한 뒤(build-3·4) 멈췄다 — "즉시 멈춤"보다 2빌드 늦음.

## 8. 영환님 결정 요청 (MQ-R3)

- A안(상향 없음)을 유지하려면 **상쇄 레인**이 StudioLayout 첫 화면 코드 ≥0.6KB gz를 조작 뒤로 옮겨 ER-2(+0.59)와 ER-3b·ER-4 몫까지 확보해야 한다. 그 전에 SPEC 8절 추정을 ER-2 실측(+0.59) 기준으로 다시 잡기를 권한다(추천).
- B안(기준선 상향, ADR-004 개정5)이면 WIP 브랜치를 그대로 이어서 Ego Lite·Codex 마감 가능.

## 9. Codex

- r1 `review --scope branch --base 9d817bd` 실제 완료(`logs/codex-r1.txt`): **지적 0** — "테마 연산 테스트 2개와 작업 문서·로그, 수정이 필요한 결함 없음". 범위 = tip(T1 테스트·문서)뿐이라 WIP 연결 코드는 Codex 미검토(재개 레인에서 리뷰 필요). r2 생략(지적 0).

## 10. ER-2F 마감 (Jarvis 작성 — Developer 2회 연속 턴 한도: 66/65 → 축소 재개 41/40)

- 커밋: 개정 5 적용 `b3e427a` · BRIEF-F `eea7a1c` · 병합 누락 복원 `be10d79` · 포커스 useLayoutEffect `fa1268b` · Codex F r1 P2 2건 `cdba3fb`(RED 예측 +3 = 실제 3 실패, `logs/red-F.txt`) · 마감 로그 Jarvis 커밋.
- **PROGRESS 정정**: F 1차가 "REPORT 10절 완료"로 체크했으나 10절은 없었다(재개 레인 PROGRESS에 정정 기록, 이 절은 Jarvis가 작성).

### AC
| AC | 판정 | 근거 |
|---|---|---|
| T1 | PASS | `engine/ops/theme.test.ts` |
| T2 | PASS | ThemeDialog.test(포커스 = 선택 라디오, useLayoutEffect) |
| T3 | PASS | ThemeSwap.test · Ego Lite 04·10 |
| T4 | 부분 PASS — 알림 줄 되돌리기 PASS, Ctrl+Z는 ER-4 | ThemeSwap.test · Ego Lite 07·14 · **Codex F r2 P2(되돌리기 뒤 포커스 body) 미수정 → B-ER-04/ER-4** |
| T5 | PASS | 캡션 · `?v=` · Ego Lite 02·16 |
| T6 | PASS(ER-D6 설계 변경) | gateRowActions · 대화상자 통과 버전 선택 · 적용 뒤 포커스 = 테마 영역 버튼(`cdba3fb`) |
| G1 | PASS | `src/test/gateRowActions.test.tsx` · Ego Lite 05·12 |
| T7 | 실측 | 아래 번들 |

### 번들 (`logs/build-F3.txt`, cdba3fb)
- `/studio` 진입 **127.69** (한도 129 · 판정선 128.43 · ER-2 몫 +0.58 vs main 127.11) · 첫 화면 91.76.
- 다른 화면: /catalog 102.04 · /references 99.38 · /compare 121.71 · /profile 119.11 · /profile(3안) 121.58 · /projects 100.33 — main 대비 ±0.01 이내.
- 렌더 JS 84.19 · CSS 8.85 — **ER-2 변화 0**. 8.85는 main(ER-3a·ER-OFF 기준 빌드)에서 이미 8.85이며, 브리프의 "8.80"은 M2c 시점 기록값이었다(원인 레인 미특정, 이 레인 무관).

### 검증
- 전체 vitest: F1 1실패(ProfileCompare 부하) · F2 1실패(ThemeDialog 포커스 → `fa1268b` 수정) · F3 231/2074 PASS · **F4(cdba3fb) 231/2077 PASS** · Jarvis 검증은 JARVIS_FINAL.
- Codex F r1(`logs/codex-F-r1.txt`): P2 2건(좁은 폭 대화상자 중복 · 대비 줄 적용 뒤 포커스) → `cdba3fb` 반영. **F r2(`logs/codex-F-r2.txt`): P2 1건** — 알림 줄 "되돌리기" 실행 시 버튼이 사라져 포커스 body. 턴 한도로 미수정 → BACKLOG B-ER-04, ER-4(실행 취소) 레인에서 처리.

### Ego Lite
- 1차 14장(1280·390: 캡션·대화상자·적용·대비 줄·통과 버전 선택·되돌리기) · 재개 2장: `15-390-dialog-single.png`(390 대화상자 1개·배경막 1개 — Jarvis 육안 확인) · `16-390-applied-focus.png`(적용 뒤 v1·"프로필 v2가 새로 있습니다" — **포커스 링은 캡처에서 육안 식별 불가**, 포커스 위치는 테스트 근거).
- 두 회차 모두 `finish({keep:[]})` · Jarvis 재확인 `listTaskSpaces()` = `[]` · 4337/4339 리슨 0 · main 5480 무접촉.

### meta
- F 1차 66턴(error_max_turns) · 재개 41턴(error_max_turns) — 2회 연속 → Developer 재실행 없음, Jarvis 마감.

