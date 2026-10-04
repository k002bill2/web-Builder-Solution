# M2B-1b hardening 독립 QA REPORT

- 책임 QA / 실행 Orca Claude Code(Opus) / 보고 Jarvis · 서브에이전트 0 · 추가 Codex 0
- 검증 대상 구현 HEAD `7ff176c` · 코드 base `c79bb65` · worktree `m2b-1b-hardening-qa` · 실행 2026-10-05
- 앱 코드·docs·design·CLAUDE.md·package-lock 수정 0. 쓰기는 이 폴더뿐이다.
- 표기: **새 실행** = 이 QA가 이번에 직접 돌린 결과 · **인용** = 구현 레인 로그를 옮긴 값

## 결론
| # | 항목 | 판정 | 근거 |
|---|---|---|---|
| 1 | typecheck · lint · build · 표적 popoverFallback | **PASS** (새 실행) | `logs/gate.txt` exit 전부 0 |
| 2 | 전체 suite | **PASS** (새 실행) | 191 files · **1744/1744**, exit 0, Errors 0 (`logs/full-vitest.txt`) |
| 3 | 폴백 — 지원(원본) 4변형 × 3폭 | **PASS 12/12** (새 실행) | 열기 · Esc · 포커스 복귀 · 앵커 닫힘 · 실제 visibility |
| 4 | 폴백 — 모의 미지원 4변형 × 3폭 | **PASS 12/12** (새 실행) — 모의일 뿐, 실제 구형 UA 검증 아님 | `logs/fb-qa-judge.txt` |
| 5 | header 링 바깥 면 대비 | **PASS** (새 실행) | 332건, 최소 4.61 ≥ 3, 위반 0 |
| 6 | 부정 표본(같은 색 · 저대비 · 링 누락 · focus 불가) | **PASS** (새 실행) — 판정기가 5종 모두 FAIL로 잡음 | `logs/ring-qa-judge.txt` |
| 7 | **footer 실제 링** | **N/A — 설계상 포커스 대상 0** (실제 링 PASS 아님) | 3절 |
| 8 | 390 예외 상태(two-tier nav 빈 값 + utility) | **PASS** (새 실행) | 3폭 + 캡처 1장 |
| 9 | 번들 예산 | **PASS** (HEAD 새 실행 · baseline 인용) | 5절 |
| 10 | script 상수 · KEPT_DATA 변경 0 · skip/단언 약화 0 | **PASS** (새 실행) | 5절 |

- 실제 미지원 UA: **미확보** — 한계를 유지한다(2절).
- footer 실제 링크 요구의 전제를 고치는 것은 **적절하다**(3절).

## 1. 수신 · diff 읽기
- `git diff c79bb65 7ff176c -- app/` = `app/src/kit/kit.css`(+17/−4)와 `app/src/kit/popoverFallback.test.ts`(신규 6 it), 두 파일뿐이다. docs·design·CLAUDE.md 변경 0.
- kit.css 변경 3곳
  1. `@supports not selector(:popover-open) { .kit-sheet { display: block } }`
  2. lg에서 시트 숨김 대상을 `.kit-header:not(.kit-header--burger) .kit-sheet`로 좁힘(게이트 밖)
  3. lg의 `.kit-sheet:popover-open { display: none }`을 지원 블록 안으로 옮김
- 이 변경으로 선택자 목록에 `:popover-open`이 섞여 통째로 무효화되는 일에 기대지 않게 됐다.
- 구조 가드(테스트)는 CSS를 파싱해 at-rule 조상을 본다. "지원 블록 안에서만 버튼 보임 · 미지원 블록 시트 block · 게이트 밖 섞인 목록 0"을 단언한다. 단언이 결과를 미리 정해 두지는 않는다(실제 kit.css 파싱 결과에 의존).

## 2. 폴백 (새 실행 — `qa-fb.mjs`, `qa-fbjudge.mjs`)
- 서버: 이 worktree에서 vite 127.0.0.1:4337(렌더 문서) + `python3 -m http.server` 127.0.0.1:4339(이 폴더 `static/`)를 띄웠다.
- 도구: 구현자 `fb.mjs`를 복사했다. 바꾼 것은 경로, 콜드 vite 대기, **실제 visibility 측정 추가**(열림 시 `checkVisibility()` · 크기, Esc 뒤 숨김)다.
- 판정기 `qa-fbjudge.mjs`는 QA가 새로 썼다. 구현자 fbjudge는 쓰지 않았다.
- 원본 = HEAD CSS로 그린 정적 내보내기 그대로 (`static/fb-qa-<v>.html`).
- 모의 = 같은 HTML에 아래 두 가지만 바꾼 사본 (`-mock.html`).
  1. CSS의 `:popover-open` → `:x-mock-no-popover`
  2. `popover` · `popovertarget*` 속성 제거
- **변환 검사(4/4 PASS)**
  - 원본에 같은 치환을 적용하면 모의와 바이트가 같다. 다른 차이는 0이다.
  - 원본에는 지원 · 미지원 `@supports` 블록이 둘 다 있다.
  - 엔진이 버린 규칙 수: 360 → 355.
  - 치환 내역: `:popover-open` 9개 · `selector()` 4개 · popover 속성 1개 · popovertarget 3개.
- **지원 경로 12/12 PASS**
  - lg(burger 제외): 바 메뉴 nav 1 · 버튼 0 · 닫힌 시트 숨김.
  - 메뉴 버튼이 있는 9건: 아래가 모두 정상이었다.
    - 열기 → 시트 실제 보임(390: 375×268 등)
    - Esc → 닫힘(`:popover-open` 아님 + checkVisibility false)
    - 포커스가 메뉴 버튼으로 돌아옴
    - 다시 열기 → 시트 안 `#s-s-about` 앵커 → 닫힘
  - 넘침 0.
- **모의 미지원 12/12 PASS**
  - 메뉴 버튼 0 · nav 1(중복 0) · 메뉴 항목 3/3 보임 · 링크가 모두 focus 가능 · 넘침 0.
  - 시트: md 미만 · burger에서는 `static` 일반 흐름으로 보이고, lg 바 메뉴 변형에서는 숨는다.
  - two-tier utility 1/2 보임 — 폭마다 한 벌.
- 한계
  - 모의는 "`selector()`는 알지만 popover는 모르는 엔진"을 흉내 낸 것이다. **실제 구형 UA 검증이 아니다.**
  - `@supports selector()` 자체를 모르는 더 오래된 엔진은 검증 범위 밖이다.
  - 실제 미지원 UA는 확보하지 못했다.

## 3. 링 · footer N/A (새 실행 — `qa-qb.mjs`, `qa-ringjudge.mjs`)
- 도구: 구현자 `qb.mjs`를 복사했다. 바꾼 것은 경로, 콜드 대기, QA 추가 3가지다.
  1. N4: outline:none 주입
  2. N5: href 제거로 focus 불가
  3. footer 포커스 감사
- 판정기 `qa-ringjudge.mjs`는 QA가 새로 썼다. 원시 `rings`의 쌍 · 대비를 다시 판정한다.
  - 한계: focus-visible · outline 원시값은 구현 judge의 badRings로 대조했다. 그 검출력은 N4/N5로 확인했다.
- **header 링 PASS**
  - 범위: 72문서(바 · 시트 + transparent 면 3, light·dark × base·alt × 3폭).
  - 링 332건, 바깥(부모) 면 대비 최소 **4.61** (dark-base-transparent-primary-1280 바 "소개").
  - 허용 밖 쌍 · 대비<3 · 링 0 문서: 모두 0.
  - CTA 자기 fill(primary)을 면으로 오인하지 않는다(면 = bg).
- **부정 표본 — 판정기가 FAIL을 잡는가: PASS**
  - N1 같은 색 header bg/bg: 3/4 FAIL. 남은 1개는 자기 링 ink를 가진 CTA라 정상이다.
  - N1f footer 탐침 ink/ink: 1/1 FAIL.
  - N2 저대비 ink/bg 1.45: 4/4 FAIL.
  - (QA) N4 outline:none: 4/4 "링 없음".
  - (QA) N5 focus 불가: focused false · fv false.
- **footer 실제 링 = N/A(설계상 포커스 대상 0)**
  - 명세: m2a SPEC 0.10 122행 "footer 하단 링크 조각 … VS-1은 전부 글자 항목". K1-7 마크업 463행 "VS-1은 글자 항목(0.10)", 468행 "하단 링크 조각은 … 링크가 아닌 글자다". 481행의 링 규약은 "링크가 생기면(MQ-2)"이라는 조건부 규약이다.
  - 코드: `FooterBizExtended.tsx:6-13` `FooterLinks` = `<li>{item}</li>`만 있다. Footer*.tsx 전체에 `<a`·`href`·`button`·`tabIndex`가 0이다.
  - 실제 DOM: footer 4변형 × 3폭 × light·dark × base·alt 48대상에서 실제 `a` 0, 링 측정 0.
  - QA 감사 12건: 포커스 가능 요소(a/area/button/input/select/textarea/summary/iframe/[tabindex]/[contenteditable]/[href]) 0. Tab 키 전체 순회에서 footer 진입 0.
  - 본문 제목과 정확히 같은 글자("소개 · 서비스 · 자주 묻는 질문")를 넣어도 li는 TEXT다. 제목 일치 링크화 규칙은 header nav에만 있다.
  - → **숨은 링크 · 결함 0.** "실제 링 PASS"가 아니라 **측정 대상이 설계상 없는 N/A**다.
  - 탐침 복제본(판정 페이지에서만 a 주입, 운영 마크업 아님): 48건 위반 0, 최소 16.82. 참고값일 뿐 실제 링 대체가 아니다.
  - **전제 수정 적절성: 적절하다.** 원 브리프의 "제목과 같은 글자를 넣어 실제 a를 만든다"는 header 0.10 규칙을 footer에 잘못 적용한 전제다. 링크를 만들려면 명세 변경(MQ-2 대상 슬롯)과 기능 추가가 필요해 보완 레인 범위 밖이다. 구현 REPORT의 "미판정(BLOCKED)" 표기는 **N/A(설계상 대상 0)**로 고쳐 읽는 것이 맞다.
- **390 예외 상태 PASS** (1280 · 768 · 390 모두)
  - utility 로그인 · 고객센터 · 시트 0 · 버튼 0 · nav 0.
  - tier y0~23.2 → bar y23.2~64.2: 보조 줄이 바 위다.
  - DOM 순서 tier→bar = 시각 순서. 넘침 0 · 화면 밖 요소 0.
  - 캡처 `shots/qa-p3-two-tier-nonav-390.png`(390×844): ego screenshot이 2회 시간 초과해 `qa-shot-p3.sh`(Chrome headless 뷰포트, 래퍼)로 대체했다. 바이트 크기가 구현 캡처와 같다(159926, 같은 문서 · 결정적 렌더).

## 4. 번들 · 전체 suite · 불변 (새 실행)
- HEAD build는 새 실행이다. baseline은 구현 레인 `p0-gate.txt`(c79bb65 상태)에서 인용했다.

| 대상 | baseline(인용) | HEAD(새 실행) | 상한 | 판정 |
|---|---|---|---|---|
| 렌더 JS | 81.13 | 81.13 | ≤ 89.70 | PASS |
| 렌더 CSS | 7.12 | 7.13 (+0.01) | ≤ 30 | PASS |
| studio 진입 | 127.40 | 127.40 (0) | ≤ 127.70 · 증가 ≤ 0.03 | PASS |
| 다른 화면 | — | 모든 줄이 baseline과 같다 | ±0.03 | PASS |

- 다른 화면은 `diff` 결과 렌더 CSS 한 줄만 달랐다. `kit.css`는 `render.css`만 import한다.
- 전체 suite 1744 = baseline 1738 + 새 6. 변경 테스트 diff에서 `.skip/.only/.todo` 추가 0, 삭제된 `expect` 0.
- `KEPT_DATA`(`staticMarkup.ts:15`)와 SCRIPT 관련 diff 0. 앱 변경은 2파일뿐이다.
- `npm ci` exit 0, package-lock 변경 0.

## 5. 한계 · 남은 것
- 실제 popover 미지원 UA 미확보 — 모의 결과만 있다.
- footer 실제 링: 실제 링크가 생기는 시점(MQ-2 대상 슬롯 도입)에 다시 재야 한다. 지금은 N/A다.

## 6. 서버 정리 (`logs/server-stop.txt`)
- 자기 서버만 cwd를 확인한 뒤 종료했다.
  - 22007: vite node, cwd = `…-qa/app`
  - 21987: npm exec 부모
  - 21988: python http.server, cwd = `…-qa/…/static`
- 종료 뒤 lsof 4337 · 4339 **LISTEN 0**, 남은 PID 0.
- main 5480(PID 82062)은 무접촉 — 종료 전후 같은 PID가 LISTEN 중이다.
- 2a 자동 기동 0 · push · merge · 삭제 0. 커밋은 `git commit -- dev/active/m2b-1b-hardening-qa/` 로컬 1건이다.

## 7. 파일
- 스크립트: `qa-fb.mjs` · `qa-fbjudge.mjs` · `qa-qb.mjs` · `qa-ringjudge.mjs` · `qa-shot-p3.sh`
- 로그: `logs/gate.txt` · `full-vitest.txt` · `fb-qa.json` · `fb-qa-judge.txt` · `qb-qa.json` · `ring-qa-judge.txt` · `npm-ci.txt` · `server-*.txt` · `fb-qa-run.txt` · `qb-qa-run.txt`
- 정적 표본: `static/fb-qa-*.html`(원본 · 모의 8) · `static/p3-two-tier-nonav.html`
- 캡처: `shots/qa-p3-two-tier-nonav-390.png`
