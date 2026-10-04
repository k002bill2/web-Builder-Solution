# M2B-2R REPORT — M2B-1b Codex 검토 종결

- 책임 역할: **Developer** / 실행 환경: **Orca managed worktree `m2b-2r`(브랜치 `k002bill2/m2b-2r`) + Claude Code(Opus) + Orca 범위 Codex**(CODEX_HOME = `/Users/younghwankang/Library/Application Support/orca/codex-accounts/1aae10b5-ca52-427c-9407-a4f3a693f7fa/home`, 부모 HOME·독립 CLI 대체 없음)
- 시작 HEAD `2e24440` · 검토 base `5970721` · M2B-1b 구현 종점 `62fa708`
- **결론: Codex 검토 완료(1회, exit 0, 최종 본문 회수). Codex 지적은 P1 0건, P2 1건. Developer 명시 쟁점 검토에서는 P1 0건, P2 4건, SPEC 차이 1건. → 2a 기동 가능(차단 조건 없음). 단, 아래 P2와 SPEC 차이는 Jarvis 결정 대기.**

## 1. 검토 범위
| 구분 | 범위 | 비고 |
|---|---|---|
| Codex 검토 대상 | `5970721..dd8a284`(branch diff) | 검토 HEAD = `dd8a284` — 1b 구현 + 1b 회수 마감(`0fb0730`) + 병합(`470cb2f`) + 이 브리프(`900edb0`·`2e24440`) + 이 레인 골격 커밋(`dd8a284`) 포함 |
| M2B-1b **구현** 범위 | `5970721..62fa708` (커밋 12개 — `git log --oneline 5970721..62fa708 \| wc -l` = 12, 첫 `7ee6c26` · 끝 `62fa708`) | 판정 대상 코드 = `app/src/kit/*`·`features/studio/renderedVariants.ts`·`render/PageDocument.test.tsx`·`render/testing/drawKit.tsx` |
| 구현 범위 밖 | `dev/active/**`·`docs/**` | 문서 지적이 나오면 범위 밖으로 분류하기로 함 — 실제로는 0건 |

## 2. Codex 실행 기록
- 명령: `node ~/.claude/plugins/cache/openai-codex/codex/1.0.6/scripts/codex-companion.mjs review --scope branch --base 5970721` (worktree 루트, Orca 터미널 환경 그대로)
- 시작 `2026-10-05 01:47:15 KST` → 종료 `01:49:18 KST`, **exit=0**, thread `01a107d0-08bc-7cf3-95cb-cc702d957977`, 로그 끝에 `Reviewer finished` · `Turn completed` · 최종 "# Codex Review" 본문 있음 — 단순 "review started" 아님.
- 검토 HEAD `dd8a284a87dd58ae6fcef040b580223c14fee906` / base `5970721de1c8d382bf9e1c744641538c25ea27ea`.
- stdout+stderr 전체: `logs/codex.txt`(43행). Codex 자기 고지: "app/node_modules가 없어 테스트는 실행하지 못했다" → **정적 검토만**.
- 실행 횟수 1회. 재시도·adversarial-review·부모 셸 fallback 없음.
- 한계: 네이티브 `review`는 focus 텍스트를 받지 않는다(`codex-companion.mjs:271-274` `validateNativeReviewRequest`). 그래서 브리프 R1의 명시 쟁점은 Codex에 지시되지 않았다. 그 쟁점은 4절에서 Developer가 직접 검토했다(출처 분리).

## 3. Codex 지적 (P1/P2)
**P1: 0건.**

**C-P2-1. popover 미지원 환경에서 `sticky-hamburger` lg 메뉴 접근 불가 (Codex P2)**
- 파일: `app/src/kit/kit.css:186-190`(burger lg 재정의), 연관 `kit.css:159-167`(K1-1 lg 숨김)
- Codex 주장: 미지원 브라우저 ≥64rem에서 K1-1의 `.kit-sheet { display:none }`가 적용된다. burger 재정의는 `:popover-open`에만 걸리고 버튼도 숨겨진다. 결과적으로 메뉴 링크 접근이 0이 되며, SPEC-BOUND B-1 6(`SPEC-BOUND.md:78`, "미지원 = 버튼 숨김 + 시트 목록 일반 흐름")에 위배된다.
- Developer 확인(L2, 실제 미지원 브라우저 실측 아님 — 서버·브라우저 기동 0 경계):
  - `kit.css:163-165`의 숨김은 `.kit-menu-button, .kit-sheet, .kit-sheet:popover-open` **한 선택자 목록**이다.
  - `:popover-open`을 모르는 브라우저에서는 비관용(non-forgiving) 목록 전체가 무효가 된다. 따라서 `.kit-sheet` 숨김도 함께 빠진다. 시트는 일반 흐름으로 보이고 버튼은 기본 `display:none`(`kit.css:99-100`)이다. 즉 Codex가 말한 "링크 0"은 현재 브라우저에서는 **재현되지 않을 가능성이 높다**.
  - 그러나 폴백이 명시 규칙이 아니라 우연한 선택자 무효화에 기대고 있다. 그래서 다음 경우에 그대로 깨진다: 누군가 목록을 쪼개거나 `:is()`/`:where()`로 감쌀 때, 또는 `:popover-open`은 알고 `popover` 동작은 없는 환경(폴리필 등)일 때.
  - 이 폴백을 검사하는 테스트도 없다.
- 수용 기준 관계: KB-AC·상속 K-AC에 popover 미지원 폴백 항목은 없다(`grep -n '미지원'` 결과 SPEC 계약 문장만 — m2a `SPEC.md:197`, `SPEC-BOUND.md:78`). → **수용 기준 밖, SPEC 6절 계약**이며 1b에서 실측되지 않았다.
- 영향: 현재는 낮음(주요 브라우저 모두 popover 지원). 향후 CSS 정리 시 회귀하면 lg에서 sticky-hamburger 메뉴 전체 접근 불가(WCAG 2.1.1).
- 재현(이론): `:popover-open` 미지원·`popover` 미지원 UA에서 1280 폭, `header/sticky-hamburger` 문서 → 시트 보임 여부. 실증하려면 미지원 UA가 필요하다.
- 최소 수정안: `kit.css` K1-1 lg 규칙에서 `.kit-sheet`를 빼고 `@supports selector(:popover-open) { .kit-sheet { display:none } }`로 옮긴다. 미지원 폴백은 `@supports not selector(:popover-open) { .kit-sheet { display:block } }`처럼 **명시 규칙**으로 둔다. 그리고 [G] 가드 1건(kit.css에 미지원 폴백 블록 존재)을 추가한다. 렌더 CSS 증가는 수십 B 수준(추정).
- 관찰(구현 범위 밖, 기존 K1-1): 같은 무효화 때문에 미지원 UA의 lg에서 K1-1은 인라인 nav와 흐름 시트 nav가 동시에 보인다(navigation 2). m2a 시절 코드라 이 diff의 결함은 아니다. 위 수정안과 함께 다루면 된다.

## 4. Developer 명시 쟁점 검토 (Codex 아님)
| # | 쟁점 | 판정 | 근거(명령·파일) |
|---|---|---|---|
| 1 | 390폭 `sticky-two-tier` nav 빈 값 + utility 있음 — 보조 줄 위치 SPEC 차이 | **SPEC 차이 유지, 수용 기준 위반 아님 → Jarvis 결정** | 아래 4.1 |
| 2 | 실제 `:focus-visible` 링 실측 · 쉼표 선택자 결함 수정 | **수정 유효, 단언 약화 없음. P2 2건(커버리지·방법)** | 아래 4.2 |
| 3 | header/footer 6변형 공유 | **문제 없음** | 아래 4.3 |
| 4 | 정적 HTML script 바이트 불변 | **불변 확인** | 아래 4.4 |
| 5 | RENDERED_VARIANTS 파생 · 단언 이관 | **가드 유지, 이관 1건 정당. 2a 인계 1건** | 아래 4.5 |

### 4.1 390 nav 빈 값 + utility 있음
- SPEC-BOUND B-2 4(`SPEC-BOUND.md:145`): "`utility`가 있으면 390에서 보조 목록을 시트 대신 **바 아래 보조 줄로**".
- 구현: `HeaderStickyTwoTier.tsx` — `.kit-tier`(보조 줄)를 바 **위**에 두고 `data-always`를 붙인다. `kit.css:207-209`에 의해 모든 폭에서 보인다. 1b REPORT 4절에 사유가 기록되어 있다.
- 수용 기준 관계: KB-AC-04/05는 nav 빈 값 경우를 정하지 않는다. 그래서 KB-AC 위반이 아니다. 테스트는 `HeaderStickyTwoTier.test.tsx:52`([U], data-always 존재)뿐이다. 1b `qb.mjs`의 [B] 판정에는 이 경우가 없다(`grep always qb.mjs` 0건). 이 레인은 서버 기동 0이라 실측하지 않았다.
- 사용성·접근성 영향:
  - (a) DOM 순서와 시각 순서가 같다(보조 줄 → 바). 따라서 탭·읽기 순서 불일치는 없다(WCAG 1.3.2·2.4.3 문제 없음).
  - (b) 390에서 브랜드보다 보조 항목이 먼저 읽히고 보인다. 정보 위계상 브랜드가 첫 요소가 아니다. 기본 utility는 글자 항목(span)이라 포커스 대상이 아니므로 키보드 영향은 없다.
  - (c) nav는 필수 슬롯이다(B-2, 권장 60). 따라서 이 상태는 사용자가 nav를 비운 예외 상태에서만 생긴다.
  - 종합: **P2 수준의 SPEC 차이**. 기능(시트 없이 보조 목록 노출)은 SPEC과 같다.
- 선택지(Jarvis):
  - A. 현행 유지 + SPEC 개정 기록 — 추천. 순서 일치·단순.
  - B. SPEC대로 수정 — md 미만에서 CSS `order`로 바 아래 이동(시각·DOM 순서 불일치 발생)하거나, 마크업 두 벌(보조 목록 세 번째 벌). 둘 다 `kit.css`를 수정한다. 2a와 같은 파일이므로 **2a 전 별도 단일 레인**이 필요하다.

### 4.2 focus-visible 링 실측 · 쉼표 선택자
- 수정 내용(1b `qb.mjs`, `62fa708`에서 파일 전체 신규 → 수정 전 diff 없음, 1a `dev/active/m2b-1a/qb.mjs`와 비교):
  - `qb.mjs:87` `ringOf`는 실제 `el.focus()` 뒤 `el.matches(":focus-visible") && outlineStyle !== "none"`일 때만 계산 `outlineColor`를 읽는다. 아니면 `"?none"`으로 **실패 처리(fail-closed)**한다.
  - `qb.mjs:16` `Emulation.setFocusEmulationEnabled`로 배경 탭에서도 focus가 맞는다.
  - `qb.mjs:83` `under()`가 쉼표 선택자 각 부분에 접미어를 붙인다. 글자 `qb.mjs:84`·링 `qb.mjs:88` 모두 적용된다. 이전 결함은 `.kit-bar, .kit-tier *`처럼 마지막 부분에만 붙던 것이다.
  - 판정 `judge.mjs:37` — `badRings`가 하나라도 있으면 KB-AC-34 FAIL.
- 실측 집계(`logs/qb-b.json` 재집계, python): colors 측정 84개, 링 268건, `?none` **0**. 즉 모든 링이 실제 `:focus-visible` 상태에서 읽혔다.
- 단언 약화 여부:
  - 텍스트 대비 기준 4.5는 유지된다.
  - `ALLOWED`에 1a 대비 `bg/ink` 1쌍이 추가됐다. 이는 footer ink 면 글자(`kit.css:381-385`, footer 면 = ink, 글자 = bg)로, 기존 K1-7 면 규칙 그대로다. 수치 4.5 검사는 함께 적용된다.
  - `RING_OK`는 1b 신규다(1a에는 링 판정 없음 = 판정 추가). 다만 `ink/primary`(CTA 링)가 허용 쌍에 들어 있다.
- **D-P2-1 (커버리지)**: footer 3변형 측정 24개는 링이 **0건**이다. 원인은 표본 footer 링크가 본문 제목과 달라 `span`이 되어 `a`가 없기 때문으로 **추정**한다(`qb-b.json`에는 글자 행 원본이 저장되지 않아 태그 확인 불가). 링 판정은 KB-AC-34의 원 기준(K-AC-36 = 글자 대비, `m2a/SPEC.md:622`)에 들어 있지 않은 1b 추가 판정이다. 따라서 KB-AC-34 글자 대비 PASS는 유지되고, footer 링은 **미판정**이다. 코드상 footer ink 면 링 = `--kit-ring: var(--site-bg)`(`kit.css:385`), minimal = `--site-ink`(`kit.css:488`)로 지정은 되어 있다(정적 확인).
  - 파일: `dev/active/m2b-1b/qb.mjs:196`
  - 최소 수정안: footer `links` 슬롯에 본문 제목과 같은 항목을 넣은 표본을 추가해 링을 실측한다(2a P-B나 M2B-6 QA에서).
- **D-P2-2 (방법)**: `ringOf` 결과를 `roleOf(bgOf(el))`와 짝지을 때, `bgOf`는 요소 **자신**부터 불투명 배경을 찾는다. 자체 배경이 있는 버튼(CTA = primary)은 링 쌍이 `ink/primary`로 기록된다. 하지만 outline은 `outline-offset` 바깥, 즉 **부모 면(bar bg)** 위에 그려진다. 또 `RING_OK`는 역할 쌍만 보고 비텍스트 대비 3:1 수치는 계산하지 않는다.
  - 현재 프로필(light/dark)에서 ink/bg는 충분하다. 그래서 결과 오판은 없다. 판정 방법은 부정확하다.
  - 파일: `dev/active/m2b-1b/qb.mjs:82,88,92`
  - 최소 수정안: 링 배경은 `bgOf(el.parentElement)`로 잡고, `ratio(outlineColor, 부모 bg) ≥ 3`을 수치로 단언한다. 2a 이후 판정 스크립트에 반영할 것.

### 4.3 header/footer 6변형 공유
- `kit/headerParts.tsx`(MenuList·MenuButton·Sheet)는 K1-1·hamburger·two-tier·transparent가 공유한다.
  - K1-1 `HeaderStickyRightCta.tsx`는 공유 부품으로 리팩터됐다(diff 76줄). 그러나 `git diff 5970721 62fa708 -- app/src/kit/HeaderStickyRightCta.test.tsx` → 0줄(테스트 변경 0)이고 1b Jarvis 전체 vitest 3회 1738/1738 통과(`dev/active/m2b-1b/logs/jarvis-vitest-{1,2,3}.txt`)다. 이것이 출력 마크업 불변의 근거다(이 레인 재실행 아님).
- two-tier 보조 목록은 `aux` JSX 한 값을 보조 줄·시트 두 곳에 넣어 같은 마크업 두 벌이 된다. 폭별 한 벌 표시는 `kit.css:200-240`이 담당한다.
- 유일한 공유 결함 후보는 3절 C-P2-1(K1-1 lg 숨김 규칙을 burger가 상속)이다.

### 4.4 정적 HTML script 바이트 불변
- `git diff --stat 5970721 62fa708 -- app/src/features/studio/staticHtml` → **출력 없음**(변경 0). `STATIC_MENU_SCRIPT` 상수·`KEPT_DATA`가 모두 불변이다.
- KB-AC-32 테스트(`kit/boundVariants.test.tsx:64-68`)는 header 3변형 각각의 정적 HTML에서 `script` 1개와 `textContent === STATIC_MENU_SCRIPT`를 확인한다. 이 테스트는 상수와 비교하므로 상수 자체 변경은 잡지 못한다. 위 diff 0이 그 공백을 메운다.
- r4.12 스크립트의 `[popover] a[href^="#"]` 닫기가 two-tier 시트 안 보조 앵커에도 적용되는 구조다(스크립트 변경 0).

### 4.5 RENDERED_VARIANTS 파생 · 단언 이관
- `features/studio/renderedVariants.ts`: 바깥 3유형은 `SECTION_LIBRARY.sections`에서 파생하고(라이브러리 키 = `header`·`hero`·`footer` 3개, `domain/sectionLibrary.ts:30,36,44`), 본문 4쌍은 나열한다. 킷 import는 0이다.
- 가드 `src/test/renderedVariants.test.ts`는 1b에서 **변경 0**이다(집합 일치·중복 0·freeze 그대로). 라이브러리에 킷 없는 바깥 변형이 늘거나 킷만 늘면 실패하므로, 양방향 드리프트를 잡는다.
- 단언 삭제·skip 집계: `git diff 5970721 62fa708 -- '*.test.ts' '*.test.tsx' app/src/render/testing/drawKit.tsx | grep -cE '^-.*expect|\.skip|\.only|\.todo'` → **1**. 그 1건은 `PageDocument.test.tsx` 정확 목록 12쌍이 18쌍으로 바뀐 것이다(상위집합으로 교체, `no-such-variant` 예시 유지). 1b REPORT 7절 이관 표와 일치하며, 약화가 아니다.
- **2a 인계**: 본문 12변형은 라이브러리 파생 대상이 아니다. 2a/2b/2c는 `renderedVariants.ts` 명시 목록에 본문 키를 직접 추가해야 한다. 추가 나열의 `/studio` 진입 증가(1b 실측 6개 나열 +48 B)를 P1 예산 시제품에서 먼저 재야 한다(브리프 7절).

## 5. 판정 — 2a 기동
- **2a 기동 가능.**
  - Codex P1 0건, Developer 검토 P1 0건이다.
  - 1b KB-AC 위반 미해결 0건이다. 미판정: footer 포커스 링(1b 추가 판정, KB-AC-34 원 기준 밖 — D-P2-1), popover 미지원 폴백(SPEC 계약, KB-AC 밖 — C-P2-1). 미판정은 위반이 아니다.
  - 검토는 완료되었다.
- 2a 전에 Jarvis가 정할 것(2a를 막지 않음):
  1. C-P2-1(popover 폴백 명시화) 수정 여부·시점. `kit.css` 수정이라 2a와 같은 파일이므로, 하려면 2a 전 단일 레인 또는 2a P0에 포함할지 결정한다.
  2. 4.1 SPEC 차이 A(현행 + SPEC 개정 기록, 추천) / B(수정).
  3. D-P2-1·D-P2-2는 판정 스크립트 개선이다. 2a P-B 브라우저 판정 스크립트에 반영 권고(코드 수정 아님).

## 6. 서버·쓰기 경계
- 서버 기동 0, 브라우저 0, 서브에이전트 0, 코드 자동 수정 0.
- **테스트 실행 0건**: 이 레인은 Developer·Codex 모두 typecheck·lint·vitest·build를 실행하지 않았다(Codex: app/node_modules 없음, 정적 검토). 동작 근거는 1b Jarvis 회수 결과(전체 vitest 3회 1738/1738 exit 0, build exit 0)를 인용한 것이다.
- 이 REPORT 자체에 대한 추가 Codex 검토는 하지 않았다(브리프 1회 상한).
- 쓰기: `dev/active/m2b-2r/`(PROGRESS.md·REPORT.md·logs/codex.txt)만. app/·design/·docs/·CLAUDE.md·package-lock 변경 0.
- 커밋: 로컬 `git commit -- dev/active/m2b-2r`만. push·병합·삭제 0. 다른 서버(main 5480 등) 무접촉.
