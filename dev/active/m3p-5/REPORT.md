# M3P-5 REPORT — 썸네일 문구 구분(B-M3P-01) + 상세 섹션 계획 정합(B-M3P-02)

base `45e4c1e` · 브랜치 `k002bill2/m3p-5` · 서브에이전트 0

## 결과 요약
- **B-M3P-01 해소**: 썸네일 21장 hero h1 고유 1종 → **21종**(업종 6 × 레이아웃). 같은 업종 안에서도 h1 다름, 부제는 톤(첫 시각 태그)별, 섹션 제목은 업종별.
- **B-M3P-02 해소(생성 15개)**: 상세 "섹션 구성" = 렌더 문서 섹션 1:1 — gen-beauty-1 About `team-grid-3` → `story`(렌더 "이야기 + 이미지"), 섹션 수 7 → **8(Footer 포함)**.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `app/src/thumbs/thumbCopy.ts` (신규) | 썸네일 전용 추상 문구 표 — hero 제목 = 업종×레이아웃(6×6), 부제 = 톤 12종 + 업종 약속, 섹션 제목 = 업종(about·services·portfolio·testimonials·pricing·faq·cta-band). 표 밖이면 throw. 실존 상호·URL 0 |
| `app/src/thumbs/referenceDoc.ts` | `writeStartDoc` 결과 위에 `withThumbCopy`로 이미 문자열인 텍스트 슬롯만 덮음(새 객체). hash는 재계산 안 함(썸네일 SSR은 그리기만) |
| `app/src/domain/internalCompose.ts` | 상세 `sections` = `plan.map` + `mapVariant`(엔진 변형) — Footer 필터 제거 |
| `app/src/fixtures/generatedReferenceDetails.ts` | 생성 스크립트로 재생성(손편집 0). 바뀐 곳 = 상세 `sections` 배열뿐(`generatedReferences.ts`·비교 블록 변경 0) |
| `app/src/thumbs/thumbCopy.test.tsx` · `detailRender.test.ts` (신규) | 고유 h1 21(SVG `<h1>` 추출) · 업종 안 차이 · 섹션 제목 업종별 · 권장 글자 수 이하 · 상세 ↔ 렌더 1:1 |

수정 0: 엔진·PageDoc 계약·`sampleCopy.ts`·`startDocWrite`/`createDocFromCandidate`·docs/**·lock·CLAUDE.md·큐레이션 픽스처 3벌(G5 해시 그대로). 새 의존성 0. `INTERNAL_GENERATOR_VERSION` 그대로(올리면 15개 전부 재추첨).

## 원인
- B-M3P-01: `withSampleCopy`가 모든 텍스트 슬롯을 업종 무관 `SAMPLE_COPY`로 채움.
- B-M3P-02(a): 생성기가 상세에 **구조안 변형**을 기록, 렌더는 `ENGINE_VARIANT_MAP` 뒤 **엔진 변형**을 그림(about/team-grid-3 → story). (b) 생성기가 상세에서 footer를 뺐음. 큐레이션 기존 규칙은 ref-b~f가 Footer 포함 → 같은 규칙으로 맞춤.

## TDD
- 예측(PROGRESS): T1 h1 고유 1 → RED, T2 길이 7≠8·team-grid-3≠story → RED.
- 실측 RED: 5 실패(T1 3건 `expected 1 to be 21` 등, T2 2건 `expected 'team-grid-3' to be 'story'`) — 예측 일치. RED 상태는 커밋하지 않음(구현과 함께 e62a48f).
- GREEN: `npx vitest run src/thumbs src/domain/internalCompose.test.ts` 41/41.

## 검증
| 항목 | 명령 | 결과 |
|---|---|---|
| typecheck | `npx tsc --noEmit -p tsconfig.json` | 0 오류 |
| lint | `npm run lint` | 0 |
| build | `npm run build` | exit 0 · `[thumbs] 21장 · 버전 8d7310f2 · 가드 통과(U8·G2·G6)` (base 76d49eca) |
| 생성 픽스처 | `node scripts/generate-internal-refs.mjs --check` | exit 0 |
| 금지 파일 변경 0 | `git diff --stat 45e4c1e..HEAD -- app/src/engine app/src/data/sampleCopy.ts app/src/data/startDocWrite.ts app/src/render docs CLAUDE.md app/package-lock.json app/package.json app/src/fixtures/references.ts app/src/fixtures/referenceDetails.ts app/src/fixtures/referenceComparisons.ts` | 출력 0줄 |
| 전체 vitest | `npx vitest run` | exit 0 · 249 files · 2190 tests passed |

## 번들 (base 45e4c1e 같은 머신 빌드 대비)
| 경로 | base | 지금 | 멈춤선 |
|---|---|---|---|
| `/catalog` 첫 화면 | 100.05 | 100.06 | 100.90 |
| `/studio/:projectId` 자동 로드 포함 | 128.64 | 128.67 | 128.70 |
| `/references/:id` 자동 로드 포함 | 99.69 | 99.69 | 124.70 |
| `/compare` 자동 로드 포함 | 121.96 | 121.97 | 124.70 |
- 내용이 바뀐 앱 청크는 `generatedCatalog-*.js` 1개(25,120 → 25,625B raw) — 원인 = 생성 상세에 Footer 15행 추가 + 엔진 변형 이름. 썸네일 문구(thumbs/)는 앱 번들 밖이라 0. 나머지 청크는 크기 동일(파일명 해시만 연쇄 변경). **"앱 청크 증가 0" 목표는 B-M3P-02 데이터 추가로 미달**, 멈춤선 안.
- 렌더 변화 0: base·현재 빌드 모두 `render-BDQsGS9W.js`·`render-BHkyxf8o.css` — 내용 해시 파일명 동일 = 바이트 동일(84.19KB·8.85KB). 킷·엔진 코드 변경 0.

## Ego Lite (build + `vite preview --port 4337`)
- 시작 `listTaskSpaces()` = [] → TaskSpace 12 하나. 창 상태 조회(`Browser.getWindowForTarget`)는 실패(오류가 `.catch`로 삼켜져 미출력)해 직접 확인 못 함 — 간접 근거: 캡처가 정상 렌더됨. 1280 뷰포트(CDP override), `goto` 1회(/catalog) 뒤 칩 클릭·카드 클릭·스크롤만, 새로고침 0.
- `shots/01-catalog-1280.png`: 첫 화면 6장 h1이 모두 다름("아픈 곳을 먼저 듣는 진료실", "기록과 근거로 말하는 상담", "아침을 여는 한 잔의 커피" …), 썸네일 21장 `?v=8d7310f2`.
- `shots/02-catalog-beauty-1280.png`: 뷰티 4장 h1·부제 각각 다름.
- `shots/03-detail-gen-beauty-1.png`: "섹션 구성 · 8개" — About story · Services list · Testimonials quotes-2 · 08 Footer biz-extended. (캡처 위쪽 흰 띠 = 스크롤 직후 sticky 헤더 영역 캡처 잔상, 내용 판정 영향 없음)
- 해상도: 01 = 1280×900(override 적용 실행 안). 02·03 = 2560×1800 — 새 ego-browser 실행(새 CDP 세션)에 override가 이어지지 않아 DPR 2 캡처, 마지막 `clearDeviceMetricsOverride`도 같은 이유로 사실상 무효. 요구 판정은 01 + DOM 추출(`섹션 구성 · 8개`, 항목 8개)로 충족.
- 정리: `clearDeviceMetricsOverride` → `finish({keep:[]})` → `listTaskSpaces()` = **[]**. 자기 preview 종료, 4337 리슨 0. main 5480·사용자 창 무접촉.

## 기록만(이번에 안 바꿈)
- **큐레이션 6개의 같은 불일치**(픽스처 바이트 변경 0 원칙): 상세 변형 이름이 렌더와 다름(예: ref-a About split→렌더 story, Testimonials carousel→quotes-2, Services grid-3→cards-3), ref-a는 목업 1a-02대로 Footer 없음(상세 8 vs 계획 9), ref-c~f는 섹션 이름이 자유 표기(Doctors·Classes 등). 맞추려면 큐레이션 픽스처 수정 승인 필요.
- **상세 와이어(`ReferencePreview`)는 전 레퍼런스 공통 와이어**(헤더·hero 띠·카드 3칸, SPEC 4.3 MQ-M3P-6 A로 유지) — QB-02의 "와이어도 카드 3개" 지적은 데이터가 아니라 공통 와이어 때문. 섹션 계획 기반 와이어는 별건.
- **편집기 문구 주입은 범위 밖**: 편집기 새 문서는 여전히 `sampleCopy` 공통 문구(`/studio` 여유 0.03). 후속 후보 — 업종 문구를 편집기에도 주려면 `/studio` 예산 재조정 필요.
- 썸네일 문서 hash는 문구 덮은 뒤 재계산 안 함(엔진 import 금지 · SSR은 검증·저장 안 함).

## Codex
- 1라운드 `node codex-companion.mjs review --scope branch --base 45e4c1e`(대상: 브랜치 diff vs 45e4c1e, 실행 시점 682916b까지 — 코드 커밋 e62a48f 포함): **조치 필요 결함 0건**. Codex 쪽 typecheck·`git diff --check` 통과, 테스트는 Codex 샌드박스 EPERM으로 미실행(동작 검증은 위 로컬 전체 vitest exit0로 갈음). 지적 0이라 2라운드 생략(≤2 상한 안).

## 남은 일 · 요청
- 미해결 차단 0. push/merge 안 함(승인 대상).
- 결정 요청(후속): ① 큐레이션 6개 상세 변형 이름·ref-a Footer를 렌더 기준으로 맞출지(픽스처 수정 승인) ② 편집기 새 문서에도 업종 문구를 줄지(`/studio` 예산 재조정 필요).
