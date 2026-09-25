# TDD 계획서 — Hermes Design Benchmark Studio (AOS `design-studio`)

- 문서 상태: **초안 v0.2** · 작성 Jarvis · 2026-09-25 KST
- 의미: 이 문서의 TDD는 **Test-Driven Development(테스트 주도 개발) 계획**이다. 기술 설계(Technical Design)는 `docs/03-trd/TRD.md`가 담당한다.
- 상위: PRD v0.2 · TRD v0.2 · 개발계획서 v0.2
- 적용 대상: Developer(트랙 A·B·C) 모든 handoff. QA·Security는 이 문서의 테스트 ID로 판정한다.

## 1. 원칙 (모든 handoff 브리프에 포함)

1. **실패하는 테스트 없이 제품 코드를 쓰지 않는다.** RED 확인 → 최소 구현 GREEN → REFACTOR.
2. **수직 슬라이스(tracer bullet)** 로 진행한다. 테스트를 한꺼번에 몰아 쓰고 구현을 몰아 하지 않는다.
3. 테스트 이름은 동작을 설명한다. 한 테스트 = 한 동작.
4. 목(mock)은 외부 경계(호스팅 API·LLM·이메일·객체 저장소)에만 쓴다. composer·lint·tokens는 실제 코드로 테스트한다.
5. 버그 수정은 재현 테스트부터 쓴다.
6. handoff 보고에는 **RED 출력(실패 메시지)과 GREEN 출력**을 모두 붙인다. 없으면 Jarvis가 회수하지 않는다.
7. Developer 자체 통과는 QA 독립 검증을 대체하지 않는다.

## 2. 테스트 피라미드와 도구

| 층 | 대상 | 도구 | 실행 위치 | 비중(목표) |
|---|---|---|---|---|
| 단위 | contracts·tokens·composer·lint·codegen·recommendation·Pydantic 모델 | Vitest / pytest | 로컬·CI | 60% |
| 속성(property) | 결정성·대비 보정·조합 규칙 불변식 | fast-check / hypothesis | 로컬·CI | 5% |
| 계약 | TS(zod)↔JSON Schema↔Pydantic 왕복, API 응답 스키마 | Vitest + pytest | CI | 5% |
| 통합 | API+DB(권한·조직 분리·버전), 생성 잡(backend↔worker) | pytest(async) + 테스트 DB | CI | 15% |
| 컴포넌트 | 대시보드 페이지·섹션 컴포넌트 | Vitest + Testing Library | CI | 8% |
| E2E·시각·접근성·성능 | 핵심 시나리오, 3뷰포트 스냅샷, axe, Lighthouse | Playwright, axe-core, Lighthouse CI | CI(야간 전체) | 7% |

실행 명령(AOS 규칙 준수):

```bash
# backend (CWD: src/backend) — 새 async 테스트는 @pytest.mark.asyncio 필수
uv run pytest ../../tests/backend/design_studio -v --tb=short
# dashboard
cd src/dashboard && npm test -- design-studio
# packages
pnpm --filter "./packages/design-studio/**" test
# E2E / 시각 / 접근성 / 성능
pnpm --filter design-studio-e2e test
pnpm --filter design-studio-e2e lhci
```

테스트 DB: shared-infra PostgreSQL에 `design_studio_test` 스키마(또는 전용 테스트 DB)를 매 실행 생성·정리. **기존 DB·볼륨은 건드리지 않는다.**

## 3. 요구사항 ↔ 테스트 추적표

| 테스트 ID | 검증 대상 | 요구사항 |
|---|---|---|
| T-CON | 계약 스키마 | TR-POL-01, FR-PRF-01, 4.4 SectionDefinition |
| T-TOK | 토큰·팔레트·Tailwind 테마 | TR 3·4.3, FR-PRF-02·04 |
| T-CMP | 결정적 조립 | FR-GEN-03·04, TRD-E-15 |
| T-LNT | 조합 규칙 R-01~R-15 | FR-GEN-06, FR-PUB-01 |
| T-REC | 추천 점수·근거 | FR-SEL-03·04 |
| T-KIT | 섹션 컴포넌트 | FR-GEN-02, FR-EDT-02 |
| T-GEN | codegen 산출물 | FR-GEN-01, FR-PUB-02·03, TR 8 |
| T-GATE | 품질 게이트 | FR-PUB-01, PRD 8 |
| T-API-* | 백엔드 API·모델 | TR 5 |
| T-SEC-* | 보안 | TR-SEC-01~11 |
| T-POL | 권리 경계 | TR-POL-01~06 |
| T-JOB | 생성 잡 | TR 6.2 |
| E2E-S1~S8 | 사용자 시나리오 | PRD 6 |

### 3.1 PRD P0 요구사항 전수 매핑

| PRD P0 | 테스트 |
|---|---|
| FR-CAT-01 필터·URL 유지 | T-API-CAT-01, E2E-S1(새로고침 후 필터 복원) |
| FR-CAT-02 카드 필드 | 대시보드 컴포넌트 테스트 `ReferenceCard`(필드 누락 0, 점수 측정일 표시) |
| FR-CAT-03 상세·유사 추천 | T-API-CAT-04: 유사 추천 3종 각 ≤6개, 자기 자신 제외 |
| FR-CAT-04 노출 제한 | T-API-CAT-02, T-REC-05 |
| FR-CAT-05 큐레이션·회수 | T-API-CAT-05: curator 회수 시 참조 프로필 수 반환 + T-SEC-ROLE-01 |
| FR-CAT-06 초기 20개 | T-GATE-01(20개 게이트 통과), 픽스처 수 검사 |
| FR-CMP-01 저장 | T-API-CMP-03: 저장·해제 멱등, 조직 분리(T-SEC-ORG-01) |
| FR-CMP-02 2~6개 비교 | T-API-CMP-01·02 |
| FR-CMP-03 요소 선택→초안 | T-API-CMP-04: picks 저장 후 프로필 초안에 반영 + E2E-S3 |
| FR-SEL-01 템플릿 선택 | E2E-S2, T-CMP-09: 템플릿 가져오기 후 section_plan = 레퍼런스 구성 |
| FR-SEL-02 스타일 조합 | T-CMP-07, E2E-S3 |
| FR-SEL-03 추천·승인 | T-REC-01·03·06, E2E-S4 |
| FR-SEL-04 규칙 기반 순위 | T-REC-02·04 |
| FR-SEL-06 URL 모사 없음 | 대시보드 컴포넌트 테스트: 선택 화면에 URL 입력 요소 0 |
| FR-PRF-01 스키마 | T-CON-01·02 |
| FR-PRF-02 팔레트 보정 | T-TOK-05·06 |
| FR-PRF-03 버전 | T-API-PRF-01·02 |
| FR-PRF-04 조정 범위 | T-TOK-07 |
| FR-GEN-01 생성 파이프라인 | T-GEN-01·02, T-JOB-01 |
| FR-GEN-02 섹션 12×2 | T-KIT 공통 세트 × 24 |
| FR-GEN-03 결정성 | T-CMP-01, T-GEN-05 |
| FR-GEN-06 조합 lint | T-LNT-01~13 |
| FR-EDT-01 3뷰포트 | E2E-S7 |
| FR-EDT-02 섹션 편집 | E2E-S5, T-KIT |
| FR-EDT-03 스왑 시 콘텐츠 보존 | E2E-S6, T-CMP-10: 테마 교체 전후 슬롯 값 동일 |
| FR-EDT-04 자유 배치 없음 | 대시보드 컴포넌트 테스트: 편집 화면에 CSS 입력·좌표 드래그 요소 0 |
| FR-EDT-05 오버플로 경고 | E2E-S7, T-CON-07 |
| FR-EDT-06 자동저장·스냅샷 | E2E-S5, T-API-PRJ-01: PageDoc 저장마다 스냅샷·해시 |
| FR-PUB-01 품질 게이트 | T-GATE-01~05 |
| FR-PUB-02 zip 내보내기 | T-GEN-02·03·04, E2E-S8 |
| FR-PUB-03 정적 HTML | T-GEN-08 |
| FR-KOR-01 사업자정보 | T-LNT-12, T-KIT(Footer) |
| FR-KOR-02 개인정보·동의 | T-LNT-12, T-KIT(Contact): 동의 미체크 시 제출 불가 |
| FR-ORG-01 조직 접근 제어 | T-SEC-ORG-01, T-SEC-ROLE-01 |
| FR-ORG-02 사용량 원장 | T-API-USAGE-01 |

위 표에 새로 등장한 테스트(T-API-CAT-04·05, T-API-CMP-03·04, T-CMP-09·10, T-API-PRJ-01)는 해당 절 명세와 같은 Given/When/Then 형식으로 구현 handoff 브리프에 포함한다.

## 4. 테스트 명세

형식: `ID — Given / When / Then`. 굵게 표시한 항목은 M1 첫 슬라이스 필수.

### 4.1 T-CON 계약 (packages/contracts)

1. **T-CON-01** — Given 유효한 DesignProfile JSON(사용자 문서 4E 예시) / When 검증 / Then 통과하고 정규형(motion_level `medium`→`L2`)으로 변환된다.
2. **T-CON-02** — Given `primary_color`가 `#12` 같은 잘못된 hex / When 검증 / Then `SCHEMA_INVALID`와 필드 경로를 반환한다.
3. **T-CON-03** — Given SectionDefinition.provenance에 `url` 키 / When 검증 / Then 거부된다(TR-POL-01).
4. **T-CON-04** — Given DesignReference에 `source_url` 필드 / When 검증 / Then 거부된다.
5. **T-CON-05** — Given zod 스키마 / When JSON Schema로 내보내고 Pydantic으로 같은 샘플 10종 검증 / Then TS·Python 결과가 모두 일치한다(계약 드리프트 방지).
6. T-CON-06 — Given `license_status`가 enum 밖 값 / Then 거부.
7. T-CON-07 — Given 슬롯 텍스트가 `maxLength` 초과 / Then 거부하고 초과 길이를 알려준다.

### 4.2 T-TOK 토큰 (packages/tokens)

1. **T-TOK-01** — DTCG 참조 `{color.blue.600}`를 해석해 hex를 얻는다.
2. **T-TOK-02** — 참조 순환(a→b→a)이면 순환 경로를 담은 오류.
3. **T-TOK-03** — semantic 세트 → Tailwind 4 `@theme` CSS 변수 문자열 생성, 스냅샷 일치.
4. **T-TOK-04** — 같은 입력이면 같은 CSS(바이트 동일).
5. **T-TOK-05** — 대표색 `#FFD400`(밝은 노랑) → primary 위 텍스트 대비가 4.5 미만이면 on-primary를 어둡게 보정해 4.5 이상.
6. T-TOK-06 — 속성 테스트: 임의 hex 1,000개에 대해 보정 팔레트의 본문 대비가 항상 ≥4.5.
7. T-TOK-07 — 밀도 슬라이더 값이 테마 허용 범위 밖이면 거부(FR-PRF-04).

### 4.3 T-CMP 조립기 (packages/composer)

1. **T-CMP-01** — 같은 (profile, libraryVersion, seed) → PageDoc 해시 동일.
2. T-CMP-02 — seed만 다르면 결과가 다를 수 있으나 모든 결과가 lint 차단 0.
3. T-CMP-03 — 3안 생성 시 모든 쌍이 hero 변형·그리드·타입 스케일 중 2개 이상 축에서 다름.
4. T-CMP-04 — 업종 "병·의원" + 목적 "예약" → contact(예약 변형) 포함.
5. T-CMP-05 — support_matrix 미지원 조합 → `UNSUPPORTED_COMBINATION` + 대체 조합 1개 이상.
6. T-CMP-06 — 생성 로그에 적용 규칙 ID와 제외 후보·이유가 기록된다.
7. T-CMP-07 — 스타일 조합(A의 hero + B의 카드 + C의 footer) → 세 섹션이 프로필 테마 토큰으로 재바인딩(R-15), 원 레퍼런스 테마 값 잔존 0.
8. T-CMP-08 — 속성 테스트: 무작위 지원 조합 500개 → 모두 R-01·R-02 충족.

### 4.4 T-LNT 조합 규칙 (packages/lint) — 규칙마다 통과·위반 쌍

| ID | 위반 케이스 → 기대 |
|---|---|
| **T-LNT-01** | 본문 섹션 4개 → R-01 차단 |
| **T-LNT-02** | hero 2개 또는 두 번째 위치 → R-02 차단 |
| T-LNT-03 | 목적 문의 유도인데 CTA/Contact 없음, 또는 앞 1/3에만 있음 → R-03 차단 |
| T-LNT-04 | 목적 예약인데 예약 변형 없음 → R-04 차단 |
| T-LNT-05 | 인접 섹션 같은 배경 → R-05 자동 보정 후 재검사 통과 |
| T-LNT-06 | 섹션별 radius 덮어쓰기 → R-06 차단 |
| T-LNT-07 | L2 섹션 4개 또는 L3 1개 → R-07 차단 |
| **T-LNT-08** | 본문 대비 4.4 → R-08 차단 + 대체 토큰 제안이 4.5 이상 |
| T-LNT-09 | 이미지 alt 빈 값(장식 표시 없음) → R-09 차단 |
| T-LNT-10 | h1 2개 / h2 없이 h3 → R-10 차단 |
| T-LNT-11 | description 누락 → R-11 차단 |
| **T-LNT-12** | 푸터 사업자정보 누락 / 폼 동의 없음 → R-12 차단 |
| T-LNT-13 | 슬롯 maxLength 초과 → R-13 차단 |
| T-LNT-14 | 섹션 소스에 `#fff`·`text-[13px]` 하드코딩 → ESLint 규칙 실패 |

### 4.5 T-REC 추천

1. T-REC-01 — 입력(병·의원, 학부모, 예약) → 5개 반환, 점수 내림차순.
2. T-REC-02 — 동점이면 id 사전순(결정성).
3. T-REC-03 — 각 결과에 근거 3개(기여도 상위 항목과 값).
4. T-REC-04 — LLM 플래그 OFF에서 동작, ON에서 LLM 실패(목) 시 규칙 근거만 반환.
5. T-REC-05 — `license_status=external_observed` 레퍼런스는 결과에 없음(TR-POL-03).
6. T-REC-06 — 추천 조회만으로 프로필이 바뀌지 않음(승인 후 적용).

### 4.6 T-KIT 섹션 컴포넌트 (packages/kit)

변형마다 공통 테스트 세트(템플릿화):
1. 필수 슬롯만으로 렌더 성공.
2. 슬롯 최대 길이에서 레이아웃 오버플로 없음(시각 스냅샷 3뷰포트).
3. axe 위반 0.
4. `prefers-reduced-motion` 에뮬레이션 시 애니메이션 없음.
5. 하드코딩 스타일 없음(T-LNT-14).
6. 사용자 텍스트 `<script>` 입력이 이스케이프되어 텍스트로 표시(T-SEC-03).

### 4.7 T-GEN 코드 생성 (packages/codegen)

1. **T-GEN-01** — Hero+Footer PageDoc → 산출물에 `src/sections/Hero*.tsx`, `Footer*.tsx`, `src/theme/tokens.css`, `package.json` 존재.
2. **T-GEN-02** — 생성 zip을 임시 디렉터리에 풀고 `npm install --offline`(캐시)·`npm run build` 성공.
3. T-GEN-03 — package.json 의존성이 허용 목록 부분집합.
4. T-GEN-04 — 산출물에 `eval(`, 외부 `<script src=`, 허용 목록 밖 도메인 문자열 0건.
5. T-GEN-05 — 같은 입력 → zip 내용 해시 동일(타임스탬프 고정).
6. T-GEN-06 — 사용된 섹션 변형만 포함(미사용 섹션 파일 0).
7. T-GEN-07 — LICENSES.md에 사용 폰트·스톡 전부 기재.
8. T-GEN-08 — 정적 HTML 빌드 결과가 미리보기 스크린샷과 픽셀 차이 임계값(0.1%) 이내.

### 4.8 T-GATE 품질 게이트

1. T-GATE-01 — 기준 레퍼런스 20개 산출물 전부 axe 위반 0.
2. T-GATE-02 — Lighthouse Performance ≥80(목표 90), LCP ≤2.5s, CLS ≤0.1, TBT ≤200ms (모바일 프로파일).
3. T-GATE-03 — 깨진 내부 링크 0.
4. T-GATE-04 — 게이트 실패 시 `GATE_FAILED` + 항목별 위치·수정 방법, 내보내기·발행 차단.
5. T-GATE-05 — 초기 JS ≤90KB·CSS ≤30KB(gzip) 초과 시 실패.

### 4.9 T-API 백엔드 (tests/backend/design_studio)

1. **T-API-MODEL-01** — 마이그레이션 up/down 왕복 후 스키마 동일.
2. **T-API-CAT-01** — 필터(업종=병·의원, 모션=L1) → 해당 레퍼런스만, 쿼리 파라미터 그대로 반영.
3. T-API-CAT-02 — `visibility=hidden`·`external_observed` 미노출.
4. T-API-CAT-03 — 1,000개 적재 후 필터 p95 ≤300ms(성능 테스트, 야간).
5. **T-API-CMP-01** — 3개 비교 → 비교 항목 10종 모두 포함.
6. T-API-CMP-02 — 7개 요청 → 422 `COMPARE_LIMIT`.
7. **T-API-PRF-01** — 프로필 수정 → 새 버전 생성, 이전 버전 불변.
8. T-API-PRF-02 — 이전 버전으로 생성 요청 → 당시 PageDoc 해시와 동일.
9. T-API-GEN-01 — 같은 멱등 키로 generate 2회 → 잡 1개.
10. T-API-USAGE-01 — 생성·내보내기마다 AOS 사용량 원장 1건.
11. T-API-AUDIT-01 — 프로필 확정·내보내기·카탈로그 회수 시 감사 로그.

### 4.10 T-SEC 보안

1. **T-SEC-ORG-01** — 조직 A 사용자가 조직 B 프로필·프로젝트·보관함·비교 보드 조회/수정 → 404/403, 데이터 노출 0(모든 엔드포인트 매개변수화 테스트).
2. T-SEC-ROLE-01 — viewer가 generate/export → 403. editor가 publish → 403. curator 외 admin/references → 403.
3. T-SEC-03 — 슬롯에 `<img src=x onerror=alert(1)>` → 산출물에 실행 가능한 속성 0.
4. T-SEC-04 — 업로드: 확장자 png인데 매직바이트 불일치 → 거부, 11MB → 거부, EXIF GPS 포함 JPG → 변환본에 EXIF 0.
5. T-SEC-05 — 워커에서 외부 네트워크 요청 시도 → 차단, 120초 초과 → `JOB_TIMEOUT`, 셸 실행 API 부재(정적 검사).
6. T-SEC-07 — (URL 입력 도입 시) `http://127.0.0.1`, `http://169.254.169.254`, 사설 대역, DNS 재바인딩 → 차단.
7. T-SEC-08 — 미리보기 URL 서명 위조·만료 → 403, 응답에 `X-Robots-Tag: noindex`.
8. T-SEC-10 — 로그에 폼 내용·토큰·이메일 문자열 0(로그 캡처 검사).

### 4.11 T-POL 권리 경계

1. T-POL-01 — 생산 스키마 전체에서 금지 키(`url`, `source_url`, `screenshot`, `html`, `image_url`) 스캔 → 0.
2. T-POL-02 — 저장소에 크롤러 의존성(puppeteer 크롤 스크립트 등)·`gdweb` 문자열이 코드에 없음(CI grep 게이트, 문서 제외).
3. T-POL-04 — 섹션 승인 API: 근거 출처 2개·유사도 미기록 → 승인 거부.
4. T-POL-05 — 번들 폰트·스톡이 허용 목록 밖 → 빌드 실패.

### 4.12 T-JOB 생성 잡

1. T-JOB-01 — 정상: queued → running → ready, artifact_hash 기록.
2. T-JOB-02 — 워커 크래시 → 1회 재시도 후 failed, error_code 기록.
3. T-JOB-03 — 게이트 실패 → failed(`GATE_FAILED`), 산출물 미공개.

### 4.13 E2E 시나리오 (Playwright, PRD 6절)

| ID | 시나리오 | 통과 기준 |
|---|---|---|
| **E2E-S1** | 카탈로그 필터 → 3개 저장 → 비교 보드 → 프로필 저장 → Hero+Footer 미리보기 | M1 완료 조건 전체 |
| E2E-S2 | 템플릿 선택 → 생성 → 미리보기 | 레퍼런스와 같은 섹션 구성 |
| E2E-S3 | 스타일 조합(A hero + B 카드 + C footer + 사용자 색) → 생성 | lint 차단 0 또는 원인·대체안 표시 |
| E2E-S4 | 추천 5개 → 근거 확인 → 승인 → 프로필 반영 | 승인 전 프로필 불변 |
| E2E-S5 | 섹션 추가·순서 변경·변형 교체 | 자동저장 30초 이내, 새로고침 후 유지 |
| E2E-S6 | 테마 스왑 | 슬롯 콘텐츠 동일, 대비 AA 유지 |
| E2E-S7 | 3뷰포트 전환·오버플로 경고 | 경고가 해당 섹션을 가리킴 |
| E2E-S8 | 게이트 통과 → zip 내보내기 | 다운로드 zip 빌드 성공 |

## 5. 슬라이스별 RED→GREEN 순서

### M1 첫 수직 슬라이스 (사용자 문서 9절)

```
1. T-CON-01 → DesignProfile 스키마
2. T-CON-03/04 → 금지 필드(권리 경계부터 고정)
3. T-TOK-01·03 → 토큰 해석·Tailwind 테마
4. T-KIT(Hero 1변형) → T-KIT(Footer 1변형, T-LNT-12 사업자정보 포함)
5. T-GEN-01 → 최소 codegen
6. T-API-MODEL-01 → 모델·마이그레이션
7. T-API-CAT-01 → 필터 API
8. T-SEC-ORG-01 → 조직 분리 (API 추가 직후, 기능 확장 전)
9. T-API-CMP-01 → 비교 API
10. T-API-PRF-01 → 프로필 버전
11. 대시보드 컴포넌트 테스트(카탈로그 카드·필터·비교 표) → UI
12. E2E-S1
```

### M2 이후

- 섹션 변형 추가마다: T-KIT 공통 세트 RED → 구현 GREEN → 시각 기준 스냅샷 승인(Designer).
- 규칙 추가마다: T-LNT 통과·위반 쌍 RED → 구현.
- 버그: 재현 테스트 먼저.

## 6. 커버리지·CI 게이트

| 대상 | 기준 |
|---|---|
| contracts·tokens·composer·lint·codegen | 라인 90%·분기 85% |
| backend `design_studio` | 라인 85% |
| dashboard `design-studio` | 라인 75% |
| 보안 테스트 T-SEC-ORG | 모든 엔드포인트 100% 매개변수화 |
| PR 머지 | 위 단위·계약·통합 green + 변경 영역 E2E green |
| 야간 | 전체 E2E·시각 회귀·Lighthouse·성능 |

커버리지 숫자는 보조 지표다. 요구사항 추적표(3절)의 모든 P0 항목에 테스트가 있는지가 우선 기준이다.

## 7. 테스트 데이터·픽스처

- `fixtures/profiles/`: 사용자 문서 4E 예시 + 무드 8종 대표 프로필.
- `fixtures/references/`: 베타 5업종 × 4 = 20개 internal PageDoc.
- `fixtures/colors/`: 대비 경계값 색(밝은 노랑, 중간 회색, 순수 파랑 등).
- `fixtures/uploads/`: 정상 PNG/JPG, 매직바이트 위조, EXIF GPS, 과대 크기.
- `fixtures/xss/`: 이스케이프 검사 문자열 모음.
- 시각 기준 스냅샷은 Designer 또는 QA 승인 후에만 갱신한다.

## 8. 역할별 책임

| 역할 | 책임 |
|---|---|
| Developer | 모든 기능을 RED→GREEN→REFACTOR로 구현, handoff 보고에 RED·GREEN 출력 첨부 |
| QA | E2E·시각·접근성·성능을 독립 실행하고 판정(PASS/FAIL + 재현 절차). 코드 수정 안 함 |
| Security | T-SEC·T-POL 설계 검토·추가 케이스 제안, 릴리스 전 결과 확인 |
| Designer | 시각 기준 스냅샷 승인, 섹션 공통 테스트 세트의 레이아웃 기준 정의 |
| Jarvis | 추적표 누락 점검, handoff 회수 시 RED/GREEN 증거 확인, Codex 리뷰 실행 |

## 9. 변경 이력

| 버전 | 일자 | 내용 |
|---|---|---|
| v0.2 | 2026-09-25 | 최초 작성(PRD·TRD v0.2 기준) |
