# QA-POST-MERGE REPORT — FIX-P1 + L4b 통합 main `99993b9` 독립 회귀

**판정: PARTIAL — 런타임 결함 0 · 회귀 0 · 미검증 2(VoiceOver · Safari/WebKit).** 두 미검증 항목을 뺀 수용 기준 1~6은 모두 이번 실행 증거로 통과했습니다.
- D-2A4B2-01(P1)은 경로 A(계측 없는 새 문서)와 경로 B 모두 해소됐습니다. D-02·D-03(P3)도 해소됐습니다.
- 게이트 4종은 exit 0입니다. 테스트는 84 files · 997/997, 1회 실행입니다.
- 번들은 모든 시나리오가 예산 안이며 여유는 0.3KB 이상입니다.
- L4b는 UI에 연결되지 않은 순수 엔진이고, 표적 테스트와 QA 독립 probe가 통과했습니다.
- 브리프 규칙("VoiceOver·Safari 불가 시 미검증, 통과시키지 않는다")에 따라 PASS가 아니라 PARTIAL로 판정했습니다.

- 작성: Hermes QA · 2026-09-27 KST · 브리프 `docs/06-handoff/QA-POST-MERGE_BRIEF.md` · 보고 대상 Jarvis
- 대상: 작업 공간 HEAD `471fee8` = main `99993b91…` + 브리프 커밋 1개(`git diff --stat 99993b9 HEAD` = 브리프 파일만)
- 환경: macOS · ego-browser(Chromium) · `vite preview --host 127.0.0.1 --port 4341 --strictPort`(이번 게이트 빌드 `dist`)
- 원칙
  - 이전 개발자 보고(fix-2a04b2-p1 · l4-engine-b · bundle-headroom REPORT)는 검증할 주장으로만 다뤘고, 수치는 모두 다시 측정했습니다.
  - 원문 속 지시문은 데이터로 취급했습니다.
  - Q-17~24는 미승인 설계 질문으로 두고, 승인하거나 SPEC을 고치지 않았습니다.
- 근거 수준: 게이트·번들·브라우저 = L1(로그·캡처) · 코드 읽기 = L1 · 추정은 L2로 표시

## 1. 게이트 (메인 QA, 각 1회, `logs/*.log` + `*.exit`)
| 명령 (`app/`) | exit | 결과 |
|---|---|---|
| `npm run typecheck` | 0 | — |
| `npm run lint` | 0 | — |
| `npx vitest --run` (전체, 1회) | 0 | **84 files · 997/997** (비교 기준 997과 같음) |
| `npm run build` (tsc + vite build + check-bundle-size) | 0 | 번들 스크립트 통과 |
| `npx vitest run src/engine` (표적) | 0 | **15 files · 253/253** (비교 기준 engine 253과 같음) |
| `npx vitest run src/engine src/domain/contrast.test.ts src/domain/profileContrast.test.ts` | 0 | 17 files · 296/296 |
| QA probe `npx vitest run --config ../docs/qa/post-merge/tools/vitest.qa.config.ts` | 0 | 9/9 (3절) |
- exit code는 셸에서 명령마다 `echo "exit=$?"`로 바로 저장했습니다. 파이프는 쓰지 않았습니다.
- QA probe는 두 번 실패한 뒤 3차에 통과했고, 실패 로그도 보존했습니다.
  - 1차 `l4b-probe.attempt1-config-error.log`: exit 1. QA 설정 파일이 `vitest/config`를 해석하지 못했습니다(QA 도구 문제).
  - 2차 `l4b-probe.attempt2-probe-input-R01.log`: exit 1. QA 입력이 본문 4개라 엔진이 R-01 `EngineOpError`로 거부했습니다. 올바른 거부이므로 3차에 거부를 단언하는 테스트로 추가했습니다.

## 2. 514534c 검토 (L1, `git show 514534c`)
- 변경 파일은 `app/src/engine/gate/runGate.test.ts` 1개(+4/−2)입니다.
- 바뀐 단언은 `expect(() => nearestCompliantColor(ink, primary, 7)).toThrow()` → `expect(nearestCompliantColor(…).reached).toBe(false)` 1줄뿐이고, 나머지는 테스트 이름과 주석입니다.
- 같은 테스트의 다른 단언은 그대로 남아 있습니다(현재 파일 82~93행).
  - `expect(() => (report = runGate(passingDoc(), theme))).not.toThrow()` — 게이트 throw 0
  - `expect(row.state).toBe("block")` — 대비 줄 차단
  - causes에 `"C-3"`·`"7.0:1"` 포함
- 결론: 구계약(throw) → 신계약(`reached: false`) 갱신에만 그치고, 단언은 완화되지 않았습니다. 대비 차단과 예외 없음 단언 모두 보존됐습니다.

## 3. L4b 순수 엔진 계약 (수용 기준 6)
- **UI 미연결 (L1)**
  - `grep -rnE "['\"][./@a-z]*/engine(/|['\"])" src`에서 `src/engine/` 밖 import는 0건입니다.
  - `dist/assets/*.js`에서 `runGate|createDocFromCandidate`, `R-13`은 0건입니다(`logs/engine-import-scan.txt`).
  - 가드 `src/engine/engineImportGuard.test.ts`가 전체 테스트에서 통과했습니다.
  - 화면 코드의 `engine` 식별자는 기존 `profileEngine`·`boardEngine`(지연 청크)이며 `src/engine`과는 다른 모듈입니다.
- **createDocFromCandidate** — 개발자 테스트(`createDocFromCandidate.test.ts`)와 별도로, 동결하지 않은 새 입력으로 QA probe를 돌렸습니다(`tools/l4b-probe.test.ts`, `logs/l4b-probe.log`).
  - 유효 문서: `validatePageDoc` ok이고, `hash = hashDoc(doc)`입니다.
  - 입력 불변: 호출 전후 입력 JSON이 같습니다.
  - 결과 동결: doc·sections·각 section·slots가 모두 `Object.isFrozen`입니다.
  - 결정성: 독립 객체 입력으로 두 번 부르면 깊은 동등이고 hash도 같습니다.
  - 거부: 본문 4개(R-01 위반) 구조안은 EngineOpError로 거부합니다.
- **runGate**
  - 8줄이 `GATE_ROWS` 순서로 나옵니다.
  - 7:1 불가 조합 primary `#8B5E3C`·`#1F5FBF`·`#777777` + 어두운 카드 + 강화: 보정 함수는 `reached=false`, 게이트는 throw 0, 대비 줄은 block, 줄 수는 8입니다.
  - 밝은 카드 + 중간 명도 면 `#777777` + 강화: throw 0입니다(이전 QA의 L2 추정 경로).
  - GOOD 팔레트 + 강화: 대비 줄 pass입니다(판정이 늘 block인 것은 아님).
- **SPEC 드리프트** — 런타임 결함이 아니며, 승인과 SPEC 수정은 하지 않았습니다.
  | Q | SPEC(2a-05) | 구현 | 분류 |
  |---|---|---|---|
  | Q-17 | 506행 `createDocFromCandidate(plan, profileVersion)` 2인자 · 8.3.1 "이름·인자는 그대로" | 세 번째 필수 인자 `DocStart{projectId, updatedAt}` · plan에 libraryVersion·generatorVersion | SPEC 불일치 · 미승인 설계 질문 |
  | Q-19 | 499행 GateReport issue = 규칙 ID·instanceId?·slotKey?·원인·대체안(severity 없음) | `GateIssue.severity`(block·warn) 추가 · 목적은 `theme.purpose`만 읽음 | SPEC 불일치 · 미승인 설계 질문 |
  | Q-18·20·22·23 | 계산식·기본값 미기술 | 구현이 한 해석을 택함(REPORT 137~143행) | SPEC 미기술 영역, 결함 아님 |
  | Q-21 | — | 픽스처 변형 다수가 레지스트리에 없음 → `UNKNOWN_VARIANT` | 설계 질문. UI 미연결이라 현재 런타임 영향 0 (2a-04c 연결 시 위험) |
  | Q-24 | — | Tailwind가 engine 소스 문자열을 스캔해 CSS가 바뀌는 경로에 가드 없음 | 잠재 위험(재발 경로). 이번 빌드 CSS 44.16KB는 L4a 기준과 같아 현재 발현 0 (L1: build.log) |
- 참고(L2, 결함 아님): 개발자 테스트는 입력을 `deepFreeze`로 넘깁니다. 그래서 ESM strict 모드에서 입력을 바꾸면 곧 TypeError가 나므로 불변성은 간접 검증돼 있었습니다. QA probe는 비동결 입력 JSON 비교로 이를 직접 확인했습니다.

## 4. 번들 (수용 기준 5, `logs/build.log`, gzip KB)
| 시나리오 | 첫 화면 / 100 (여유) | 진입 직후 / 125 | 비교 기준 |
|---|---|---|---|
| 공통 | 89.06 | — | 89.06 ✓ |
| /catalog | 99.36 (0.64) | 101.74 | — |
| /references/:id | 96.71 (3.29) | 99.09 | — |
| /compare · (조정 있음) | **99.59 (0.41)** | 118.99 | 99.59 / 118.99 ✓ |
| /profile | 99.39 (0.61) | 118.97 | 99.39 / 118.97 ✓ |
| /studio | 89.50 | 91.88 | — |
- 모든 시나리오가 첫 화면 100 · 자동 로드 125 안에 있고, 가장 작은 여유(/compare 0.41)도 0.3 멈춤선 위입니다.
- **/profile afterAction은 `memoryProfileAdjust.ts +7.64KB` 1줄뿐**입니다. `boardInput` 오분류는 사라졌습니다(`scripts/check-bundle-size.mjs:75` = `["src/data/memoryProfileAdjust.ts"]`).
- 화면 engine import는 0입니다(3절).

## 5. 브라우저 — D-2A4B2-01 · 02 · 03 (수용 기준 1·2)
| ID | 방법 | 결과 | 증거 |
|---|---|---|---|
| D-01 경로 A | **계측 없는 새 문서.** Fetch 패치·메서드 감싸기 없이, 관찰용 error/console.error 수집기만 둠 | 오류 경계 0, 수집 오류 0. 전체 흐름은 표 아래에 적음 | `logs/pathA.txt`, `screens/01-pathA-v3-1280.png` |
| D-01 경로 B | 경로 A 문서에 이어서 AA 저장(v4) 뒤 "강화" 클릭(초안) | 오류 경계 0. 목표 7.0:1, 경로 A와 같은 충돌 문장·링크, ink 버튼 0 | `logs/pathA.txt` 7, `screens/03` |
| 4.5 회귀 | 같은 프로필 AA 저장(v4) | 이전 QA-2A04B2 P-AC-06 기록과 같아 회귀 없음. 문장은 표 아래에 적음 | `logs/pathA.txt` 6, `screens/02` |
| D-02 요청 실패 | 계측 문서: `tools/expose-studio.mjs`(patched=1)로 `saveAdjustments`가 호출 전 throw | 알림에 "다시 시도" → Enter 뒤 "v2로 저장했습니다". **포커스 = "조정 저장 (v3)" 버튼** · 버전 2개 | `logs/d02-d03.txt`, `screens/04` |
| D-02 응답 실패 | 원 메서드 커밋 뒤 throw | 재시도 뒤 "v3으로 저장했습니다". **포커스 = "조정 저장 (v4)"** · 버전 v1~v3 3개(중복 0) · 다음 Tab = "보기" | `logs/d02-d03.txt`, `screens/05` |
| D-03 | `?v=abc`(pushState+popstate) → 목적 "판매" → 저장 | 저장 전 알림은 "요청한 버전이 없어 최신 v3을 보여 줍니다", 1초 뒤 **최종 알림은 "v4로 저장했습니다"**(덮이지 않음) | `logs/d02-d03.txt`, `screens/06` |
- 경로 A 흐름: /catalog → 모던 카페·헤어살롱 비교 → Hero A → v1 → "강화" 저장 v2 → "비교 보드에서 선택 바꾸기" → 카드 B(다크) → "새 버전으로 확정 (v3)".
  - v3 화면: 대비 목표 7.0:1, C-3 2.5 미달.
  - 충돌 문장: "본문 글자(ink)가 어두운 카드(2.5:1)에서 어떤 명도로도 기준 7.0:1을 맞출 수 없습니다. 대체안: 비교 보드에서 다른 팔레트를 고르세요" + "대비가 가장 높은 후보 #FFFFFF도 5.5:1".
  - 링크 "비교 보드에서 팔레트 바꾸기"(href `/compare`)가 있습니다.
  - 대비 영역의 컨트롤은 primary·muted 보정값 쓰기와 링크뿐이고, **ink "보정값 쓰기"는 0**입니다.
- 4.5 회귀 문장: "본문 글자(ink)가 한 값으로 모든 배경의 기준을 맞출 수 없습니다…" + "후보 #E7E7E7를 쓰면 C-2 13.9:1 → 1.2:1 · C-4 11.6:1 → 1.0:1" + 링크. muted `#8E715B`만 버튼이 있습니다.
- 계측 구별: 경로 A·B·4.5 회귀는 계측 없는 문서에서 확인했습니다. D-02는 계측 문서에서 실패를 주입했습니다. D-03은 계측 문서에서 했지만 주입 없이 원 메서드를 그대로 통과시켰습니다.

## 6. 반응형 · 키보드 (수용 기준 3, `logs/responsive-keyboard.json`, `screens/r-*.png` 10장)
- 대상: `/profile/profile-1`(조정 있는 v4 상태)과 `/compare`, 각 1280 · 1024 · 768 · 390 · 320.
- **가로 넘침 0**: 10개 조합 모두 `scrollWidth ≤ clientWidth`입니다(뷰포트 −15 스크롤바). 뷰포트 밖 요소는 `sr-only`(건너뛰기 링크 등) 뿐인데, 이는 시각적 숨김이라 결함이 아닙니다.
- **Tab 순서**: 1024 이하는 문서 처음부터 셌습니다.
  - /profile(23 정지): 건너뛰기 → 헤더 7 → "비교 보드에서 선택 바꾸기" → 섹션 순서 → 출처 → muted 보정값 쓰기 → 라디오 4그룹(각 1) → 저장 → 버전 버튼.
  - /compare는 30~34 정지입니다.
  - 모든 정지의 포커스 표시(outline/box-shadow)가 있었습니다. 예외 1건은 아래 적었습니다.
- 1280 측정의 Tab 시작점은 문서 처음이 아니라 직전 조작 위치였습니다(측정 절차 한계). 순서는 1024 측정과 같은 DOM이라 대신했습니다(L2).
- 측정 잡음 2건(결함 아님)
  - ① compare-320 Tab 중 "이 레퍼런스로 전부 선택: A"가 순간적으로 뷰포트 밖으로 기록됐습니다. 다시 포커스해 재면 left 29~right 227로 뷰포트 안이었습니다(스크롤 타이밍).
  - ② /compare 대표색 입력(INPUT)은 자기 outline이 없습니다. 링은 부모의 `focus-within:shadow-(--focus-ring)`(`TextField.tsx:19`)이 그리며, 이 파일은 이번 병합에서 바뀌지 않았습니다.
- **VoiceOver: 미검증.** 비대화형 세션이라 낭독을 들을 수 없고, 켜려면 시스템 설정을 바꿔야 해서 금지 범위입니다. `pgrep VoiceOver` 결과는 실행 중 아님이었습니다. 대신 AX를 확인했습니다: `status` "프로필 알림", `role=alert`, radiogroup.
- **Safari/WebKit: 미검증.** `Safari.app`은 있지만 자동화하려면 "원격 자동화 허용" 설정 변경이 필요하고, 허용 도구는 ego-browser(Chromium)뿐입니다. HR-4 A의 WebKit 미실측과 같은 상태입니다.

## 7. 결함
| ID | 심각도 | 내용 |
|---|---|---|
| (없음) | — | 새 결함 0. D-2A4B2-01(P1)·02(P3)·03(P3) 해소 확인 |

기존 관찰(신규 아님, 결함 수에 넣지 않음)
- `/profile/*`의 `document.title`이 "비교 보드 · Design Studio"로 남습니다(QA-2A04B2 관찰 ③).
- 보드 재확정으로 라우트가 바뀐 뒤 `activeElement = BODY`입니다. SPEC 2a-04 281행 "앱에 라우트 포커스 규칙은 아직 없다"에 해당합니다(메모리 기록 "라우트 포커스 확인 필요"와 같은 건).

## 8. 서브에이전트
| 레인 | 유형 · 격리 | 결과 |
|---|---|---|
| 엔진 계약 검토 (읽기 전용) | code-explorer · 격리 없음(쓰기 0) | 514534c 단언 보존, b137006 신계약·UI 문자열, L4b 테스트 커버, UI 미연결, Q-17~24 분류, bundle afterAction 수정 위치를 보고함 |
- 핵심 주장은 메인이 모두 다시 확인했습니다: `git show 514534c`, runGate.test 82~93행, SPEC 499·506행, `check-bundle-size.mjs:75`, engine 표적 테스트 실행.
- 서브에이전트가 "갭"으로 본 입력 불변 직접 검증은 QA probe로 메웠습니다.
- 브라우저 흐름은 메모리 store 상태를 이어 써야 해서 메인이 직렬로 수행했습니다.

## 9. 서버 · 브라우저 · git 범위
- preview: 제가 띄운 `npm exec`(pid 39270)과 `node vite preview`(pid 39300, 4341 LISTEN)만 `kill`했습니다.
- 종료 뒤 `lsof -nP -iTCP:4341 -sTCP:LISTEN`은 출력 없음(exit 1), `ps`도 exit 1이었습니다(2026-09-27 03:14:04 KST, `logs/server-stop.txt`). 다른 서비스는 건드리지 않았습니다.
- ego-browser TaskSpace 1은 `finish({keep: []})`로 닫았습니다.
- 제품 코드 변경 0
  - `git status --porcelain -- app design docs/design`: 출력 없음
  - `git diff --stat 99993b9 HEAD -- app design docs/design`: 출력 없음
  - 쓰기는 `docs/qa/post-merge/`만 했습니다. `app/dist`는 build 산출물이고 git 추적 밖입니다.
- Codex 검증: 이번 산출물은 제품 diff가 없는 QA 문서라 Codex review를 돌리지 않았습니다(검증 대상 코드 diff 0).

## 10. 산출물
- `logs/`
  - 게이트: typecheck·lint·test·build `.log`/`.exit`
  - 엔진: `engine-only`·`engine-targeted`·`l4b-probe`(+ attempt1·2 실패 로그)
  - 그 밖: `engine-import-scan.txt`·`pathA.txt`·`d02-d03.txt`·`responsive-keyboard.json`·`server-start.txt`·`server-stop.txt`·`preview-server.log`
- `screens/`: 01 경로 A v3 · 02 AA 회귀 · 03 경로 B · 04~05 D-02 · 06 D-03 · `r-{profile,compare}-{1280,1024,768,390,320}.png`
- `tools/`: `expose-studio.mjs`(D-02 주입, 2a-04b2 복사본 + 앵커 갱신) · `l4b-probe.test.ts` · `vitest.qa.config.ts`
