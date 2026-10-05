# M2C-3 REPORT — 예산 멈춤 (구현 전 중단)

- 레인: Developer · worktree m2c-3 · 브랜치 `k002bill2/m2c-3` · base `d25fe49` · 2026-10-06
- **결론: 브리프 "예산 멈춤" 조건으로 구현 전에 멈췄다.** SPEC 2.1 배치 그대로인 시제품과 SPEC 7절 대안 ②의 배치 변경 2회가 모두 `/studio` 진입 감지선(127.39KB)을 넘었다. 앱 코드(`app/`) 변경 0 — base와 같음(`git diff d25fe49 -- app/` = 0줄 · 되돌린 뒤 build exit 0 · 진입 127.36 — `logs/build-after-revert.txt`). 각 시도의 패치·빌드 로그만 `logs/`에 남겼다.

## 1. 실측 (모두 `cd app && npm run build`, 검사기 = `scripts/check-bundle-size.mjs` · gzip Node zlib 기본 · KB = 1000B)

| 단계 | 배치 | `/studio` 진입 | 증가 | 판정 | 로그 · 패치 |
|---|---|---|---|---|---|
| 시작 | base `d25fe49` | **127.36** | — | 기준선 | `logs/build-start.txt` |
| 시제품 1 | SPEC 2.1 그대로: `EditFields`에 "이미지 편집" 버튼 + `retryableImport` 로더(`aria-busy` "불러오는 중…" · 실패 시 새 URL) + `StudioLayout` 보관소 자리(state · ref · retain/dispose effect 2개 · `undoTarget.before`) + 캔버스 `images` prop ×3 · 패널은 빈 껍데기 | **127.58** | +0.22 | 실패 | `build-proto1.txt` · `proto1.patch` |
| 측정(배치 변경 아님) | 시제품 1에서 `StudioLayout` 변경만 되돌림 | 127.49 | +0.13 | — | `build-measure-editfields-only.txt` |
| 배치 변경 1 (SPEC 7절 ②) | 이미지 줄을 패널 청크 쪽으로: 진입에는 `VariantSwitch`와 같은 `details`+`lazy` 펼침 1개만, 보관소 호스팅은 state 1쌍 + `[images, setImages, undoDoc]` 튜플(retain·dispose·참조 집합 계산은 패널 청크로) | **127.47** | +0.11 | 실패 | `build-try1.txt` · `try1.patch` |
| 배치 변경 2 | 배치 변경 1 + 새 청크를 만들지 않고 기존 조작 뒤 청크(`ContactOwnerNote`)에 패널을 함께 실음(청크 참조 비용 제거 시험) | **127.44** | +0.08 | 실패 | `build-try2.txt` · `try2.patch` |

- 다른 라우트·첫 화면: 세 시도 모두 기준선 ±0.01 안(`/studio` 첫 91.78~91.79 · `/profile` 첫 99.61~99.62 · `/catalog` 99.65~99.66 · `/projects` 94.02~94.03). 렌더 문서 JS 84.19 · CSS 8.80으로 변화 없음.
- SPEC 7절 ① "캡션 문구 lazy"는 시도하지 않았다: `features/studio/canvasCaption.ts`는 이 레인 쓰기 경로 밖이고, 이 레인은 캡션을 바꾸지 않는다(F2 캡션 = M2C-4). ③ "구조 점검 레인 → MQ"는 이 레인이 할 수 없다.

## 2. 비용 분해 (배치 변경 1 빌드 산출물 `StudioLayout-*.js`에서 조각을 빼고 gzip 차이를 잰 값 — 줄마다 근거 표기)

| 조각 | gzip 바이트 |
|---|---|
| 새 lazy 청크 참조 1개(`import("./ImageSlotPanel-<해시>.js")` + `__vite__mapDeps` 파일 이름 — 해시 문자열은 압축되지 않음) | **34** [L1 — 조각 제거 차이] |
| `EditFields` 펼침(`details`·`summary`·`Suspense`) + 열림 state | ≈ 45 [추정 — 전체 +0.11에서 다른 줄을 뺀 나머지] |
| `StudioLayout`: undo 문서 튜플 16 · `undoTarget.before` 2곳 7 · state 4 · 캔버스 `images` prop ×3 4 | ≈ 31 [L1 — 조각별 제거 차이의 합] |
| 지운 옛 문구("…는 다음 단계에서 편집할 수 있습니다.") | 상쇄(−) [추정 — 따로 재지 않음] |

- **측정값은 하한이다.** 세 시도 모두 패널이 import 0개인 빈 껍데기였다. 실제 패널이 진입 청크에 있는 DS 부품(Button·Checkbox·TextField 등)을 import하면 청크 사이 export·공유 청크 분할로 진입이 더 늘 수 있다 [추정]. 코드베이스 관례(`<ContactOwnerNote Callout={Callout} />` — 부품을 prop으로 넘김)처럼 재개 설계에서는 DS 부품을 prop으로 주입해야 한다.
- **하한 판단:** 새 lazy 청크 참조 1개(34B)만으로 감지선 30B를 넘는다. 청크 참조를 없앤 배치 변경 2도 +0.08이다. 참조 집합에서 "되돌리기" 문서를 빼는 식(SPEC 5.9 위반)으로 23B를 더 줄여도 ≈127.42로 감지선을 넘는다 [추정 — 위 표 합산]. **이 레인의 쓰기 경로 안에서는 SPEC을 지키면서 +0.03 안에 들어가는 배치가 없다.**

## 3. 지킨 것 / 하지 않은 것

- 예산 검사기·기준선 파일(`app/scripts/**`)·한도 수정 0 · 새 의존성 0 · package*.json/lock·CLAUDE.md·docs/design·docs/decisions 수정 0.
- 엔진·PageDoc·`ImageSlotValue`·`ExportGenerator` 계약 변경 0(코드 변경 자체가 0).
- 섹션 선택만으로 패널을 자동 로드하는 배치는 시도하지 않았다 — 첫 선택(Hero)에 이미지 슬롯이 있어 실제로는 "진입 직후 자동 로드"가 되는데, 검사기 목록에 없어 잡히지 않을 뿐이다(SPEC 2.1 "사용자 조작으로만").
- TDD 단계(테스트 수 예측 커밋 → RED)·보관소·패널·캔버스 연결 구현·브라우저 4폭 확인: **하지 않음** — 브리프 "구현 전에 멈추고 보고".
- 전체 vitest·typecheck·lint: 앱 코드가 base와 같아(0줄) 이 레인에서 새로 증명할 것이 없어 돌리지 않았다. 결합 기준선(Jarvis: vitest 221파일 1978 ×3)이 그대로 유효하다.
- Codex review(`--scope branch --base d25fe49`): **해당 없음** — 브랜치 diff에 코드가 없다(문서·로그·패치 파일만). 돌린 것처럼 기록하지 않는다.
- 서버 기동 0(브라우저 확인 단계에 가지 않음) · main 5480 무접촉 · push/merge/삭제 0 · 서브에이전트 0.

## 4. 다음 결정 (영환님 · Jarvis) — 추천 순

1. **★ 구조 점검 레인 먼저 (SPEC 7절 ③ · ADR-004 개정 4 결정 3).** `/studio` 진입 청크에서 조작 뒤로 옮길 코드 ≥ 0.10KB를 찾는다. 그 결과로 M2C-3을 배치 변경 1 모양(`try1.patch`: 진입 +0.11 — 2절 "하한" 단서대로 최소치)으로 재개한다. 패치 3개는 base `d25fe49`에 `git apply --check` 통과(`try1.patch`의 빈 intent-to-add 삭제 항목은 제거함). 후보 [추정 — 실측 필요]: 페이지 정보 필드(`PageInfoFields` — "페이지 정보"를 고를 때만 보임), 충돌 Callout(`ConflictCallout` — 충돌 때만 보임). 이 레인은 쓰기 경로·범위 밖이라 손대지 않았다.
2. 구조 점검 결과와 함께 M2c 감지선 예외를 정한다(예: M2C-3 진입 +0.12 → 127.48, 절대 멈춤선 127.70 안). 상향은 ADR 결정이다. 이 레인은 기준선 파일을 고치지 않는다.
3. 배치 변경 1은 SPEC 2.1과 두 군데가 다르다. 재개 때 SPEC 개정 또는 수용 여부를 정한다.
   - 버튼 대신 `details` 펼침을 쓴다. `summary`는 펼침 상태가 있는 버튼으로 읽힌다.
   - 로드 중 문구가 없다(`fallback=null`). 청크 실패 처리는 기존 `VariantOptions`와 같은 lazy 경로이고, `retryableImport` 새 URL 재시도는 빠진다.
   - SPEC 2.1 그대로(시제품 1)면 +0.22다.

## 5. IMG-AC 매핑
- IMG-AC-08·09·11~16: **미착수**(예산 멈춤). 테스트 0 · 단언 약화 0 · skip 0.
