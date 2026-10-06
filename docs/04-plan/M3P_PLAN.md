# M3P — internal 조합 생성기 + 카탈로그 실렌더 썸네일 실행 계획 (Designer M3P-0 · 2026-10-06)

- 상위: `docs/04-plan/DEVELOPMENT_PLAN.md` 35행(실행 순서 4 — M2b 이후) · `M2B_PLAN.md` 10·12행 · 명세 `docs/design/m3p/SPEC.md` r1 · 결정 `docs/design/m3p/MQ.md`
- 출발점(base `f21ce19`, L1 빌드 실측): `/catalog` 첫 화면 99.65/100 · 진입 102.04/125 · `/compare` 진입 121.70/125 · 렌더 JS 84.19/90 · 레퍼런스 6개.
- **기동 전제**: MQ-M3P-1(썸네일 방식)·MQ-M3P-2(업종·개수)·MQ-M3P-3(데이터 필드) 결정. 아래 계획은 ★추천안 기준이며 MQ-M3P-1이 A가 아니면 레인 B를 다시 쓴다.
- 운영: 동시 작업자 2개 상한(429 이력) · 서브에이전트 0 · 레인마다 전용 브랜치/worktree · 각 커밋 전 typecheck·lint·test·build 4개 · Codex review 실제 완료만 기록 · push/merge는 영환님 승인 후.

## 1. 레인 분할

| 레인 | 역할 | 내용 | 선행 | 병렬 | 턴 |
|---|---|---|---|---|---|
| **M3P-1** 생성기 | Developer | S0 실측(1개분 픽스처 증가·`reference.key` 사용처·깨질 테스트 확정) → 팔레트 표(AA 단위 테스트) → 뼈대 템플릿 3종 → `composeInternalReferences`(SPEC 2.1~2.6) → 생성 스크립트 → 생성 픽스처 커밋(카드·상세·비교 3벌) → 저장소 병합(기존 6 + 생성) · `sourceKind` 필드 · 점수 미측정 정렬 → 깨진 테스트 수정 · AC-U1~4·U7·G1·G2·G5 | MQ-2·3·4 | M3P-2와 병렬 | 55~70 |
| **M3P-2** 썸네일 파이프라인 | Developer | S0 스파이크(킷 3변형 정적 마크업 vs 렌더 문서 serialize 구조 비교 — SPEC 9-1, 불일치면 멈춤 보고) → 레퍼런스→렌더 입력 변환(`referenceDoc` — 기존 6개 대상) → SSR 빌드 모드 + SVG writer(`thumbs/{id}.{hash}.svg`) → `THUMBNAIL_KEYS` 맵 생성 → 빌드 가드(AC-U8·G2·G3) · package.json `build`에 단계 1개 | MQ-1 | M3P-1과 병렬 | 55~70 |
| **M3P-3** 카드 UI | Developer | 카드 img·와이어 배경·실패 복귀·"생성 조합" Tag·"미측정" · 첫 화면 실측(멈춤선 99.90) · AC-U5·U6·G4 · `/compare` 진입 124.70 확인(넘으면 MQ-7 분리 청크) | M3P-1 · M3P-2 병합 | — | 45~60 |
| **M3P-4** QA | QA | build + preview 4337 · Ego Lite로 AC-B1~B5 · QB-M3P-01~06 · 문서 1개 재사용 · 항목당 15턴 이상 확보(B-QA-01) | M3P-3 병합 | — | 50~70 |

- 2개 레인 이상이 같은 파일을 쓰지 않는다(2절). M3P-1·2 병렬 = 동시 작업자 상한 2.
- M3P-2는 기존 6개만으로 끝까지 검증 가능하다. 생성 레퍼런스 썸네일은 M3P-1 병합 뒤 빌드에서 자동 포함(M3P-3에서 확인).

## 2. 쓰기 경로 겹침표 (가칭 경로 — 레인 S0에서 확정해 REPORT에 기록)

| 경로 | M3P-1 | M3P-2 | M3P-3 | 비고 |
|---|---|---|---|---|
| `app/src/domain/internalCompose*.ts`(+test) · 팔레트 표 · 뼈대 템플릿 | **W** | | | 새 파일 |
| `app/scripts/generate-internal-refs.*` | **W** | | | 새 파일 |
| `app/src/fixtures/generated*.ts` | **W** | R | | 생성 산출 텍스트 |
| `app/src/fixtures/references.ts`·`referenceDetails.ts`·`referenceComparisons.ts` | 병합 import 1줄씩만 | | | 기존 6개 값 변경 0(AC-G5) |
| `app/src/domain/reference.ts`(`sourceKind`·점수 미측정 타입) | **W** | R | R | MQ-3 |
| `app/src/data/referenceRepository.ts`(정렬) · 관련 테스트 | **W** | | | |
| 깨질 테스트(SPEC 8.3 목록) | **W** | | | 개수 단언 → 픽스처 상수 |
| `app/src/thumbs/**`(SSR 엔트리·`referenceDoc`·SVG writer) | | **W** | | 새 디렉터리 |
| `app/vite.config.ts`(SSR 모드) · `app/package.json` `scripts.build` | | **W** | | 의존성 추가 0 |
| `app/scripts/check-bundle-size.mjs`(썸네일 산출 크기 출력·가드) | | **W** | | 판정 로직 변경 0 |
| `app/src/features/catalog/thumbnailKeys.ts`(지연 청크 맵) | | **W** | R | |
| `app/src/components/catalog/ReferenceCard.tsx`(+test) · `referenceDisplay.ts` | | | **W** | |
| `app/src/pages/CatalogPage.tsx`(필요 시) | | | **W** | |
| `docs/qa/m3p/**` | | | | M3P-4만 |

겹침: M3P-1과 M3P-2의 공통 쓰기 경로 **0** → 병렬 가능. `domain/reference.ts`는 M3P-1만 쓰고 M3P-2는 읽기만(타입 확장 전에도 동작하도록 `sourceKind` 미의존).

## 3. 시간 추정 (모두 [추정] — 근거: M2B 레인 실측 턴 수·이번 범위의 새 파일 수)

| 레인 | 추정 | 가장 큰 불확실성 |
|---|---|---|
| M3P-1 | 3~4시간 | 팔레트 표 AA 통과 수(부족하면 표 추가) · 깨질 테스트 수 |
| M3P-2 | 3~5시간 | S0 SSR 스파이크 결과(불일치 시 멈춤 → MQ 재결정 대기) |
| M3P-3 | 2~3시간 | 첫 화면 99.90 멈춤선 |
| M3P-4 | 2~3시간 | Ego Lite 캡처·21장 시각 검수 |
| 합계 | 병렬 기준 약 7~11시간(1·2 병렬) | |

## 4. QA 게이트 (M3P-4 · B-QA-01 규칙)

1. `cd app && npm ci`(lock 그대로) → `npm run build`(4개 게이트 + 번들 출력 저장) → `npx vite preview --host 127.0.0.1 --port 4337 --strictPort`. **dev 서버 금지**(썸네일 산출물이 없음 — SPEC 3).
2. Ego Lite: 창이 minimized면 `Browser.setWindowBounds {windowState:"normal"}` 먼저. 뷰포트 폭은 `page.cdp('Emulation.setDeviceMetricsOverride', {width, height:900, deviceScaleFactor:1, mobile:false})` — 1280·768·390. 끝나면 `clearDeviceMetricsOverride`.
3. 캡처: `page.cdp("Page.captureScreenshot", {format:"png", captureBeyondViewport:false, clip:{x:0,y:0,width:뷰포트폭,height:뷰포트높이,scale:1}})` — **fullPage 금지**. 아래쪽 카드는 앱 안 스크롤 후 같은 방식.
4. 이동은 **앱 안 클릭만**(주소창 이동·새로고침 금지 — 메모리 저장소 초기화, 메모리 `browser-memory-store-reset`).
5. 네트워크 확인(AC-B5): 성능 로그 또는 `performance.getEntriesByType("resource")` 이름 목록 — 같은 출처 `thumbs/*.svg`·앱 청크만.
6. 문서: `docs/qa/m3p/REPORT.md` **1개 재사용**(항목별 절 추가) · 캡처 `docs/qa/m3p/*.png`(뷰포트 크기, 장수 최소).
7. 정리: 이 레인 Ego Lite `finish({keep:[]})` → `listTaskSpaces()` = [] 재확인 · preview 서버 종료 · `lsof -iTCP:4337 -sTCP:LISTEN` 빈 결과 기록. 영환님 창·main 5480 무접촉.
8. 판정: AC-B1~B5 PASS + QB-M3P-01~06 기록(FAIL은 BACKLOG 후보로 REPORT에, BACKLOG 수정은 Jarvis).

## 5. 멈춤 조건 (레인 공통)

- 6절(SPEC) 멈춤선 초과 예상 → 구현 전 멈춤 보고(예산 상향 요청 금지, 상쇄안 먼저).
- M3P-2 S0 스파이크 불일치 → 멈춤, MQ-M3P-1 재결정.
- 엔진·PageDoc 계약 변경이 필요해지면 → 멈춤, MQ.
- 새 의존성이 필요해지면 → 멈춤, MQ.

## 6. 기록
- v1 2026-10-06 Designer(M3P-0) 작성. 레인 브리프는 MQ 결정 뒤 Jarvis가 작성.
