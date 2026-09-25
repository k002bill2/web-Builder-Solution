# Developer 핸드오프 — M1-UI-01: 앱 골격 + 디자인 토큰 + 1a-01 카탈로그

- 작성: Jarvis · 2026-09-25 KST
- 책임 역할: Developer / 실행 환경: Orca + Claude Code (`hermes-claude-orca --role developer`)
- 저장소: `~/Work/web-builder-solution` (Orca worktree `m1-ui-01`, 기본 `main`에서 분기)
- Designer 생략 사유: 확정된 Claude Design 목업(1a)을 그대로 옮기는 변환 작업. 구현 후 시각 충실도 검증은 QA에 1회 맡긴다.
- 턴 예산: 120 · 체크포인트: `dev/active/m1-ui-01/PROGRESS.md`를 각 단계 끝에 갱신하고 로컬 커밋

## 1. 먼저 읽을 것 (순서대로, 건너뛰지 말 것)
1. `design/claude-design-handoff/README.md` — 핸드오프 번들 안내
2. `design/claude-design-handoff/project/Design Studio Mockups.dc.html` — **1~381행 전부**(1a) + 612~691행(`renderVals()` 목업 데이터). 1b(383~611행)는 구현 대상이 아니다.
3. 1a가 가져오는 디자인 시스템:
   - `design/claude-design-handoff/project/_ds/apfs-design-system-3aea88df-7072-4855-be04-f000a5f2fbd4/readme.md`
   - 같은 폴더의 `styles.css`, `tokens/{base,colors,fonts,shape,spacing,typography}.css`
   - `_ds_bundle.js` — 1a가 쓰는 컴포넌트 12종의 동작·스타일 확인용: Avatar, Button, Callout, Checkbox, Chip, Logo, SegmentedControl, Select, Switch, Tabs, Tag, TextField
   - `_ds_manifest.json`
4. `design/claude-design-handoff/project/support.js` — `x-dc`·`x-import`·`{{ }}` 템플릿 런타임. **동작을 이해하기 위해서만** 읽고 앱에 포함하지 않는다.
5. `docs/decisions/ADR-001-standalone-repo-1a.md`, **`docs/decisions/ADR-002-brand-separation.md`(필수)**, `docs/02-prd/PRD.md`(FR-CAT·FR-CMP), `docs/05-tdd/TDD.md` 1~2절

## 1-1. 브랜드 규칙 (ADR-002)
- 목업의 **디자인 언어만** 옮긴다. APFS 로고·워드마크·`--apfs-*` 토큰·"APFS" 명칭·`apfs` 접두어는 가져오지 않는다.
- 브랜드는 `app/src/brand/brand.config.ts`와 `app/src/styles/tokens/brand.css` 두 파일에만 둔다. 의미 토큰(`--primary` 등)은 `--brand-*`를 참조한다.
- 임시 제품명 `Design Studio`, 로고는 중립 플레이스홀더 워드마크. 목업의 `Logo` 자리에 이 컴포넌트를 쓴다.

**`design/` 폴더 파일은 수정하지 않는다.** 모호한 점이 있으면 구현하지 말고 PROGRESS.md의 `질문` 절에 적고 보고한다.

## 2. 이번 handoff 범위 (산출물 1개: 카탈로그 화면이 동작하는 앱)

### 포함
1. `app/` — Vite + React 19 + TypeScript strict + Tailwind CSS 4 + Vitest + Testing Library. 패키지 매니저는 npm.
2. **디자인 토큰**: APFS `tokens/*.css`를 `app/src/styles/tokens/`로 복사(출처 주석 유지)하고, Tailwind 4 `@theme`에 연결한다. 컴포넌트 코드는 토큰(CSS 변수·Tailwind 유틸리티)만 참조하고 hex·px 하드코딩을 하지 않는다. 다크 테마(`[data-theme="dark"]`)도 유지한다.
3. **디자인 시스템 컴포넌트**: 1a-01에 필요한 것만 React로 재구현 — BrandMark(목업 `Logo` 자리, ADR-002 플레이스홀더), Button, Chip, Tag, Tabs, Select, SegmentedControl, Checkbox, TextField, Avatar, Icon(아이콘 SVG는 `project/assets/icons/`에서 복사, CSS mask 방식). `_ds_bundle.js`의 크기·상태·variant를 따른다.
4. **데이터 계층**: `renderVals()`의 `refs` 6개와 필터 정의를 `app/src/fixtures/`로 옮기고, `DesignReference` 타입(TRD 4.1 필드 중 1a가 쓰는 것)과 `ReferenceRepository` 인터페이스 + 메모리 구현을 만든다. 화면은 저장소 인터페이스만 사용한다.
5. **화면 1a-01 카탈로그** (56~125행, 데스크톱 1280): 상단 GNB, 필터 레일, 탭(전체/추천/저장함)·정렬, 카드 그리드, 하단 비교 트레이. 동작:
   - 필터 선택이 결과를 실제로 거르고, 필터 상태가 URL 쿼리에 남는다(FR-CAT-01).
   - 카드에 목업 필드(썸네일 플레이스홀더, 이름, 업종, 태그, 팔레트, 레이아웃, 모션, 접근성·성능 점수, 라이선스 배지, 저장, 비교 추가)를 모두 표시한다(FR-CAT-02).
   - `license_status`가 `internal`·`licensed`인 것만 노출한다(FR-CAT-04).
   - 비교 추가/해제가 트레이에 반영되고, 최대 6개를 넘으면 추가를 막고 안내한다(FR-CMP-02).
6. **라우팅**: `/catalog`(구현), `/references/:id`·`/compare`·`/profile`·`/studio`는 "다음 단계" 자리표시 페이지만.

### 제외 (다음 handoff)
- 1a-02 상세, 1a-03 비교 보드, 1a-04 프로필·생성, 1a-05 편집기, 1a-06·07 모바일
- 백엔드·인증·영구 저장·코드 생성기
- 반응형은 이번엔 1280 데스크톱 기준. 단 390 폭에서 가로 스크롤·레이아웃 붕괴는 없어야 한다.

## 3. 테스트 먼저 (TDD) — RED 출력과 GREEN 출력을 보고에 붙일 것
| 순서 | 테스트 | 내용 |
|---|---|---|
| 1 | `tokens.test.ts` | 토큰 CSS에 `--primary: #3366ff`, `--radius-lg: 16px`, `--font-size-body1: 16px`가 있고, 다크 테마에 `--primary: #5b84ff`가 있다 |
| 2 | `referenceRepository.test.ts` | 업종=카페·F&B 필터 → 2개(A·F). `external_observed` 레코드를 넣어도 목록에 안 나온다 |
| 3 | `compareTray.test.ts` | 추가·해제, 7번째 추가 거부 |
| 4 | `ReferenceCard.test.tsx` | 필드 누락 없음, 저장·비교 버튼 `aria-label` |
| 5 | `CatalogPage.test.tsx` | 필터 클릭 → 카드 수 변화 + URL 쿼리 반영, 새로고침(초기 URL) 시 필터 복원 |
| 6 | `noHardcodedStyle.test.ts` | `src/components`·`src/pages`에 `#[0-9a-f]{3,6}`·`text-[..px]` 하드코딩 0건 (fixtures 제외) |
| 7 | `brandIsolation.test.ts` | `src`에서 `apfs`/`APFS`/`농업정책` 0건(출처 주석 제외), `--brand-*` 정의는 `brand.css`에만 존재 |

## 4. 검증 명령 (모두 통과해야 완료)
```bash
cd app
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test -- --run   # vitest
npm run build
```

## 5. 금지
- `design/` 수정, `support.js`·`_ds_bundle.js`를 앱에 번들
- 외부 사이트 URL·실제 사이트 이미지 사용(썸네일은 목업처럼 자체 플레이스홀더)
- `--dangerously-skip-permissions`, git push·원격 추가, `main` 직접 커밋
- 범위 밖 화면 구현

## 6. 완료 보고 형식
결론 → 변경 파일 목록 → RED/GREEN 출력 → 검증 명령 4개 결과 → 목업과 다르게 구현한 부분과 이유 → 질문·확인 필요 → 로컬 커밋 해시
