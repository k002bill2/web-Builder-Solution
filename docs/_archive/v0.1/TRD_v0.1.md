# TRD — (가칭) 패턴 빌더 기술 요구사항·설계

- 문서 상태: **초안 v0.1** · 작성 Jarvis · 2026-09-25 KST
- 상위 문서: `docs/02-prd/PRD.md` · 근거: `docs/01-synthesis/DISCUSSION_SYNTHESIS.md`
- 하위 문서: `docs/04-plan/DEVELOPMENT_PLAN.md` · `docs/05-tdd/TDD.md`
- ID 규칙: `TR-<영역>-<번호>`. 출처 열은 에이전트 원 ID(`TRD-D-nn` Opus, `TRD-E-nn` GPT-Sol, Fable D-n)

## 1. 설계 원칙

1. **결정성 우선** — 조립·검사·발행의 핵심 경로에 비결정 요소(LLM·네트워크 추천)를 넣지 않는다. 같은 입력·버전·seed는 같은 결과.
2. **단일 계약** — 섹션 계약 스키마 하나를 에디터·조립기·렌더러·lint가 함께 쓴다.
3. **토큰만 참조** — 섹션 코드는 semantic·component 토큰만 참조한다. 하드코딩 값 금지.
4. **게이트를 통과한 산출물만 공개** — 검사 통과 빌드만 production에 승격.
5. **불변·되돌림 가능** — 배포 산출물은 content hash로 불변, 롤백은 alias 전환.
6. **권리 경계를 데이터 모델로 강제** — 생산 데이터에 외부 URL·캡처 필드가 존재하지 않는다.

## 2. 시스템 구성

```
                         ┌──────────────────────────┐
  브라우저(빌더 앱) ───▶ │ Builder Web (Next.js)    │── Puck 에디터 + 3안 비교 UI
                         └──────────┬───────────────┘
                                    │ REST (JSON, zod 검증)
                         ┌──────────▼───────────────┐
                         │ API 서비스 (Node/TS)       │── 인증·권한·프로젝트·스냅샷·발행 요청
                         └───┬─────────┬────────────┘
             ┌───────────────┘         └──────────────┐
   ┌─────────▼─────────┐                    ┌─────────▼─────────┐
   │ PostgreSQL          │                    │ 발행 워커(큐 소비) │── render → lint → build → deploy
   │ (tenant 경계, RLS)  │                    └─────────┬─────────┘
   └─────────────────────┘                              │
   ┌─────────────────────┐                    ┌─────────▼─────────┐
   │ 객체 저장소(에셋)    │◀── 업로드 변환 ──── │ 호스팅/CDN 어댑터   │── Cloudflare Pages(추천) | Vercel | S3+CF
   └─────────────────────┘                    └───────────────────┘
   ┌─────────────────────┐
   │ 폼 수신 엔드포인트    │── 서버리스, rate limit, 이메일 전달
   └─────────────────────┘

  공용 패키지(모노레포): tokens · contracts · composer · lint · renderer · sections
```

## 3. 기술 스택 (제안, ⚖️ 표시는 결정 필요)

| 영역 | 선택 | 이유 |
|---|---|---|
| 언어 | TypeScript strict (`any` 금지) | 계약·토큰 타입 안전성 |
| 모노레포 | pnpm workspaces + Turborepo | 패키지 간 계약 공유 |
| 빌더 앱 | Next.js (App Router) + React | Puck이 React 기반 |
| 에디터 | Puck (MIT) — 계약→config 어댑터로 격리 | TRD-D-07 |
| 스키마 검증 | zod (+ JSON Schema 내보내기) | 런타임 검증과 타입 단일화 |
| 토큰 | W3C DTCG 2025.10 JSON → Style Dictionary로 CSS 변수 생성 | TRD-D-01 |
| 렌더러 | React 서버 렌더(`renderToStaticMarkup`) → 정적 HTML + 섹션별 최소 JS | 정적 발행, 성능 예산 |
| DB | PostgreSQL 16 + Row Level Security | 멀티테넌시 경계(TRD-E-01) |
| 큐 | PostgreSQL 기반 잡 큐(pg-boss) | 베타 규모에 별도 브로커 불필요 |
| 객체 저장소 | S3 호환(R2/S3) ⚖️ | 호스팅 결정과 연동 |
| 호스팅 | 어댑터 인터페이스 + Cloudflare Pages 1순위 ⚖️ | 롤백·커스텀 도메인 공식 지원 |
| 테스트 | Vitest(단위·속성) · Playwright(E2E·시각 회귀) · axe-core · Lighthouse CI | TDD 문서 참조 |
| 관측 | OpenTelemetry + 구조화 로그 | TRD-E-10 |

- 로컬 개발 DB는 `~/Work/shared-infra` PostgreSQL을 쓰되 **신규 DB(`pattern_builder`)를 분리 생성**한다. 기존 DB·볼륨은 건드리지 않는다.

## 4. 데이터 모델

### 4.1 디자인 시스템 (라이브러리, 버전 관리)

```
library_release(id, version semver, status[draft|approved|retired], created_at, approved_by)
token_set(id, release_id, layer[primitive|semantic|component], mood?, density?, dtcg_json jsonb, hash)
theme(id, release_id, mood, density, semantic_token_set_id, status)
section_contract(id, release_id, type, variant, schema_version, slots jsonb, constraints jsonb,
                 tokens text[], a11y jsonb, provenance jsonb, rubric jsonb, similarity jsonb, status)
industry_preset(id, release_id, industry, purpose, section_order text[], required_sections text[])
support_matrix(id, release_id, industry, purpose, mood, supported bool, reason)
```

- `section_contract.provenance` 허용 키: `author`, `created_at`, `abstract_pattern_ids[]`. **`url`, `image`, `screenshot`, `html` 키는 스키마에서 거부**한다(TR-POL-01).

### 4.2 조사 원장 (접근 통제, 별도 스키마)

```
research.ledger(id, abstract_pattern_id, source_url, observed_at, terms_checked_at,
                robots_checked_at, robots_allows bool, abstraction_note, reviewer, disposition)
```

- 별도 DB 스키마 + 별도 역할(`curator`, `reviewer`)만 접근. 생산 서비스 계정에는 권한 없음.
- 외부 이미지·HTML·캡처 저장 컬럼 없음.

### 4.3 테넌트·사이트

```
tenant(id, name, plan, billing_state)
member(tenant_id, user_id, role[owner|editor|publisher])
site(id, tenant_id, name, subdomain, library_version, theme_id, industry, purpose, mood,
     brand jsonb, seed, status)
page_doc(id, site_id, version, doc jsonb, created_by, created_at)      -- 섹션 인스턴스 배열
snapshot(id, site_id, page_doc_version, label, kind[auto|manual|published])
deployment(id, site_id, snapshot_id, artifact_hash, state, error_code, error_detail,
           lint_report jsonb, created_at, promoted_at)
domain(id, site_id, hostname, state, dns_token_ref, cert_state, last_checked_at)
form_submission(id, site_id, received_at, payload_encrypted, spam_score, delivery_state, purge_at)
audit_log(id, tenant_id, actor, action, target, diff jsonb, at)
asset(id, tenant_id, original_key, variants jsonb, mime, bytes, width, height, exif_stripped bool)
```

- 모든 테넌트 테이블에 `tenant_id` + RLS 정책. 교차 테넌트 접근 테스트 필수(TR-SEC-01).

### 4.4 페이지 문서 형식

```json
{
  "libraryVersion": "0.1.0",
  "themeId": "trust-comfortable",
  "globals": { "density": 0, "contrast": 0, "motion": 1 },
  "sections": [
    { "id": "s1", "type": "header", "variant": "logo-left", "slots": { } },
    { "id": "s2", "type": "hero", "variant": "split", "media": "photo", "slots": { "title": "…" } }
  ]
}
```

## 5. 핵심 모듈 요구사항

### 5.1 토큰 (TR-TOK)

| ID | 요구사항 | 출처 |
|---|---|---|
| TR-TOK-01 | DTCG 2025.10 JSON, primitive/semantic/component 3층. 참조 순환 금지 | TRD-D-01 |
| TR-TOK-02 | 테마 = semantic 세트 1개. 테마 스왑은 CSS 변수 세트 교체만으로 반영 | 합본 T3 |
| TR-TOK-03 | 대표색 → 역할 팔레트 변환기: primary/accent/neutral 0~900/surface/on-surface, 대비 AA 보정 | Opus C-1 ④ |
| TR-TOK-04 | 전역 슬라이더(밀도·대비·모션)는 테마별 허용 범위를 토큰으로 정의 | PRD FR-EDT-04 |

### 5.2 섹션 계약 (TR-CON)

| ID | 요구사항 | 출처 |
|---|---|---|
| TR-CON-01 | 계약 필드: type·variant·schemaVersion·slots(타입·maxLength·required)·constraints(허용 무드·모션·최소 대비·모바일 동작)·tokens·a11y·provenance | TRD-D-03 |
| TR-CON-02 | 계약에서 zod 스키마·Puck config·렌더러 props 타입을 생성한다(수기 중복 금지) | TRD-D-07 |
| TR-CON-03 | 계약 버전·migration·deprecation. 사용 중 사이트 영향 분석 API | TRD-E-12 |
| TR-CON-04 | hero·showcase·intro는 `layout × media_kind` 2차원 변형 | 합의 4 |

### 5.3 조립기 (TR-CMP)

| ID | 요구사항 | 출처 |
|---|---|---|
| TR-CMP-01 | 입력(업종·목적·무드·브랜드·seed·libraryVersion) → 3안 PageDoc. 순수 함수, 외부 I/O 없음 | TRD-D-05 |
| TR-CMP-02 | seed 기반 결정적 PRNG. 같은 입력 → 바이트 동일 결과 | TRD-E-15 |
| TR-CMP-03 | 3안은 hero 변형·그리드·타입 스케일 중 2개 이상 축에서 달라야 함 | PRD FR-GEN-01 |
| TR-CMP-04 | 생성 로그: 적용 규칙 ID·제외된 후보와 이유·라이브러리 버전 | TRD-E-15 |
| TR-CMP-05 | support_matrix 미지원 조합은 오류 코드 `UNSUPPORTED_COMBINATION` + 대체 조합 제안 | TRD-E-11 |

### 5.4 조합 규칙·lint (TR-LNT)

규칙(Opus C-4 기반, 모두 단위 테스트 대상):

| 규칙 ID | 내용 | 등급 |
|---|---|---|
| R-01 | header 1 + 본문 5~9 + footer 1 | 차단 |
| R-02 | hero는 첫 본문 섹션, 정확히 1개 | 차단 |
| R-03 | 목적 "문의 유도" → cta-band 또는 contact-location 1개 이상, 후반 1/3 | 차단 |
| R-04 | 목적 "예약" → contact-location(예약 변형) 필수 | 차단 |
| R-05 | 인접 섹션 배경 톤 동일 금지, 풀블리드 연속 2개까지 | 경고→자동 보정 |
| R-06 | 타입 스케일·헤드라인 계열·모서리 반경은 테마 값 1개 | 차단 |
| R-07 | 모션 예산: L2 ≤3, L3 = 0(MVP) | 차단 |
| R-08 | 텍스트/배경 대비 AA(본문 4.5, 큰 글자 3.0) | 차단 + 대체 토큰 제안 |
| R-09 | 이미지 슬롯 대체텍스트 필수(장식 이미지 표시 제외) | 차단 |
| R-10 | 헤딩 레벨 건너뛰기 금지, h1 1개 | 차단 |
| R-11 | 필수 SEO 메타(title, description), canonical | 차단 |
| R-12 | 국내 필수 요소(푸터 사업자정보, 개인정보처리방침 링크, 폼 동의) | 차단 |
| R-13 | 슬롯 maxLength 초과 | 차단 |
| R-14 | 섹션 코드의 primitive 직접 참조·하드코딩 색/크기 | 빌드 실패(개발 lint) |

- lint는 PageDoc 단계(구조 규칙)와 렌더 결과 단계(axe-core·대비·링크·성능)로 나눈다.

### 5.5 렌더러·빌드 (TR-RND)

| ID | 요구사항 | 출처 |
|---|---|---|
| TR-RND-01 | PageDoc + 테마 → 정적 HTML/CSS/최소 JS. 섹션별 JS는 모션 L1 이상일 때만 포함 | TRD-D-08 |
| TR-RND-02 | 성능 예산: 페이지 HTML+CSS ≤100KB(gzip), JS ≤50KB(gzip), 폰트 서브셋 ≤2 계열, 이미지 AVIF/WebP + srcset | PRD FR-QLT-05 |
| TR-RND-03 | `prefers-reduced-motion` 시 모든 애니메이션 비활성 | TRD-D-09 |
| TR-RND-04 | sitemap.xml·robots.txt·canonical·OG 자동 생성, 미리보기 빌드는 noindex | PRD FR-QLT-01, FR-PUB-06 |
| TR-RND-05 | 빌드 산출물은 content hash로 식별, 같은 입력 → 같은 해시 | TRD-E-06 |

### 5.6 발행 (TR-PUB)

상태기계:

```
draft ─▶ preview ─▶ publishing ─┬─▶ published
                               └─▶ failed ──(재시도)──▶ publishing
published ─(롤백)─▶ rolled_back(이전 성공 산출물로 alias 전환)
```

| ID | 요구사항 | 출처 |
|---|---|---|
| TR-PUB-01 | 파이프라인: 스냅샷 고정 → 구조 lint → 렌더 → 렌더 lint(axe·대비·링크·성능) → 3뷰포트 스크린샷 → 업로드 → alias 승격 | TRD-E-09 |
| TR-PUB-02 | 게이트 실패 시 alias 변경 없음, `deployment.error_code`에 원인 | TRD-E-06 |
| TR-PUB-03 | 호스팅 어댑터 인터페이스: `upload(artifact)`, `promote(site, hash)`, `rollback(site, hash)`, `attachDomain`, `domainStatus` | Opus D-5 |
| TR-PUB-04 | 롤백은 재빌드 없이 이전 성공 산출물 alias 전환 | TRD-E-07 |
| TR-PUB-05 | 발행 잡은 사이트당 동시 1개, 멱등 키 = (site_id, snapshot_id) | 신규 |
| TR-PUB-06 | 도메인 상태기계: pending_dns → verifying → issuing_cert → active / failed / detached, CAA·갱신·재시도 | TRD-E-08 (P1) |

### 5.7 LLM 카피 (TR-LLM, GA·선택형)

| ID | 요구사항 | 출처 |
|---|---|---|
| TR-LLM-01 | 기능 플래그 기본 OFF. OFF·실패·타임아웃(10초) 시 정적 플레이스홀더 | TRD-D-05 |
| TR-LLM-02 | 출력은 슬롯 JSON 스키마(zod) 검증 통과분만 반영 | TRD-D-05 |
| TR-LLM-03 | 업종별 금칙어·면책 문구 필터, 의료·금융은 사용자 확인 전 발행 차단 | Opus D-6 ④ |
| TR-LLM-04 | 모델 선정 ⚖️ (한국어 품질·비용 평가) | Opus D-3 |

## 6. 보안 요구사항 (TR-SEC)

| ID | 요구사항 | 출처 |
|---|---|---|
| TR-SEC-01 | 모든 테넌트 데이터 RLS. 교차 테넌트 읽기·쓰기 거부 테스트 | TRD-E-01 |
| TR-SEC-02 | 역할 owner/editor/publisher, 서버에서 권한 검사(클라이언트 신뢰 금지) | TRD-E-02 |
| TR-SEC-03 | 감사 로그: 발행·롤백·테마·도메인·결제·복원·권한 변경 | TRD-E-02 |
| TR-SEC-04 | 업로드: MIME·확장자·크기(10MB)·픽셀(40MP) 허용목록, 매직바이트 검사, EXIF 제거, 원본 비공개·변환본 공개 분리, 무작위 파일명 | TRD-E-03 |
| TR-SEC-05 | 폼: CSRF(빌더)·rate limit(IP·사이트)·honeypot·제출 시간 검사·이메일 수신처 검증·내용 암호화 저장·보존기간 후 자동 삭제 | TRD-E-04 |
| TR-SEC-06 | 호스팅·DNS 토큰은 비밀 저장소에 분리 암호화, 최소 권한, 회전 | TRD-E-05 |
| TR-SEC-07 | 발행 사이트 보안 헤더: CSP(인라인 스크립트 금지, nonce 없음), HSTS, X-Content-Type-Options, Referrer-Policy | TRD-E-09 |
| TR-SEC-08 | 사용자 입력 텍스트는 렌더 시 이스케이프, 리치텍스트는 허용 태그 목록 sanitize | 신규 |
| TR-SEC-09 | 미리보기 URL은 128비트 이상 무작위 토큰, 선택적 암호 | PRD FR-PUB-06 |

Security 역할의 위협 모델 검토를 M1 종료 전에 받는다(개발계획서 참조).

## 7. 권리·수집 정책의 기술적 강제 (TR-POL)

| ID | 요구사항 | 출처 |
|---|---|---|
| TR-POL-01 | 생산 스키마에 외부 URL·이미지·HTML·스크린샷 필드 금지. 스키마 테스트로 강제 | TRD-D-04, TRD-E-14 |
| TR-POL-02 | 제3자 갤러리 자동 수집 코드·크롤러를 저장소에 두지 않는다. 외부 요청 전 robots/약관 확인, UA 위장 금지 | TRD-D-02 |
| TR-POL-03 | 섹션 승인 전 유사도 검사(구조 시그니처 + 팔레트 + 카피 n-gram) 결과 기록, 근거 출처 3개 미만 승인 차단 | TRD-D-11 |
| TR-POL-04 | 번들 폰트·스톡은 허용 목록 + 에셋별 라이선스 메타 | TRD-D-10 |
| TR-POL-05 | 조사 원장 접근은 별도 역할, 접근 로그 보존 | TRD-E-14 |

## 8. 관측·운영 (TR-OBS)

- 지표: 발행 성공률·소요시간(p50/p95), 게이트별 실패 비율, 롤백 수, 폼 전달 실패, 인증서 만료 D-14, 4xx/5xx, RUM Core Web Vitals.
- 경보: 발행 실패율 5분 5% 초과, 폼 전달 실패 연속 10건, 인증서 만료 7일 전.
- 로그에 개인정보·폼 내용·비밀값 금지.

## 9. 비기능 목표

| 항목 | 목표 |
|---|---|
| 3안 생성 | p95 ≤ 800ms (서버, LLM 제외) |
| 테마 스왑 반영 | ≤ 1초 (클라이언트) |
| 발행 | p95 ≤ 2분 |
| 롤백 | ≤ 1분 |
| 빌더 가용성 | 베타 99.5% / GA 99.9% |
| 발행 사이트 가용성 | 호스팅 SLA 준수 |
| 데이터 백업 | 일 1회 + PITR 7일 |

## 10. 결정 필요 (⚖️)

1. 호스팅 사업자(Cloudflare Pages 추천) · 객체 저장소
2. 인증 방식(이메일 매직링크 + 소셜 로그인 추천)
3. LLM 모델(GA)
4. 결제 PG(GA)

## 11. 변경 이력

| 버전 | 일자 | 내용 |
|---|---|---|
| v0.1 | 2026-09-25 | 초안 |
