# TRD — Hermes Design Benchmark Studio (AOS 도메인 `design-studio`)

- 문서 상태: **초안 v0.2** · 작성 Jarvis · 2026-09-25 KST
- 상위: `docs/02-prd/PRD.md` (v0.2) · 근거: `docs/01-synthesis/DISCUSSION_SYNTHESIS.md` · `docs/00-research/USER_BRIEF_AOS_DESIGN_STUDIO.md`
- 이전 판: `docs/_archive/v0.1/TRD_v0.1.md`
- 하위: `docs/04-plan/DEVELOPMENT_PLAN.md` · `docs/05-tdd/TDD.md`
- ID 규칙: `TR-<영역>-<번호>`. 출처 열은 에이전트 원 ID(`TRD-D-nn` Opus, `TRD-E-nn` GPT-Sol) 또는 사용자 문서 절 번호

## 0. AOS 현황 (2026-09-25 저장소 확인, 읽기 전용)

| 항목 | 확인 내용 | 이 도메인에 주는 영향 |
|---|---|---|
| 위치 | `~/Work/Agent-System` | 도메인 코드는 이 저장소의 전용 worktree에서 개발 |
| Backend | FastAPI + SQLAlchemy async + LangGraph (`src/backend`), 규칙 `.claude/rules/aos-backend.md` | 라우터 `APIRouter(prefix="/api/...")`, Service 레이어, Pydantic 검증, 타입 힌트 필수, `@pytest.mark.asyncio` |
| Dashboard | React 19 · TypeScript 6 · Vite 8 · Tailwind 4 · Zustand 5 · Vitest 5 (`src/dashboard`), 규칙 `.claude/rules/aos-frontend.md` | `memo()`+displayName, `cn()`, 다크모드, `aria-label`, `React.lazy` 코드 스플리팅 |
| 기존 모델 | `organizations`, `projects`(organization_id), `project_access`, 감사(audit), LLM 사용량 원장 | 조직·프로젝트·권한·감사·사용량 재사용 |
| 인프라 | `~/Work/shared-infra` PostgreSQL/Redis/Qdrant 공유. `docker compose down -v`·볼륨 삭제 금지 | 신규 테이블은 AOS DB에 추가(스키마 분리), 볼륨 불변 |
| 미설치 | `motion` 패키지 없음 | 생성 킷(generator kit) 쪽 의존성으로 추가 |
| 확인 필요 | 마이그레이션 방식(`db/migrations` vs alembic), 테스트 경로 규칙 세부 | M0에서 Developer가 확인 후 이 문서 갱신 |

## 1. 설계 원칙

1. **결정성 우선** — 추천 순위·조립·검사·발행 핵심 경로에 비결정 요소를 넣지 않는다. 같은 프로필·라이브러리 버전·seed → 같은 산출물.
2. **단일 계약** — `SectionDefinition` 하나를 대시보드 편집 UI·조립기·코드 생성기·lint가 함께 쓴다.
3. **토큰만 참조** — 섹션 코드는 semantic·component 토큰(=Tailwind 테마 변수)만 쓴다. 하드코딩 색/크기 금지.
4. **게이트 통과분만 공개** — 품질 게이트를 통과한 산출물만 내보내기·발행.
5. **권리 경계를 스키마로 강제** — 생성 입력·산출물 경로에 외부 URL·이미지·HTML이 들어갈 필드가 없다.
6. **AOS 경계 존중** — 기존 운영 대시보드 기능과 라우트·권한·데이터를 분리한다. 향후 분리 배포가 가능해야 한다.

## 2. 시스템 구조

```
AOS Dashboard (React)                       ← 신규 라우트 /design-studio/*
  ├─ Catalog · Compare Board · Selection · Profile Editor · Preview Frame · Gate Report
        │  /api/design-studio/*
AOS Backend (FastAPI)
  └─ design_studio 도메인
       ├─ CatalogService        (DesignReference, 필터, 추천 점수)
       ├─ CompareService        (비교 보드)
       ├─ ProfileService        (DesignProfile 버전)
       ├─ ProjectService        (GeneratedProject, 스냅샷)
       ├─ GenerationOrchestrator ─┐  잡 큐(AOS 기존 큐/스케줄러 재사용, 확인 필요)
       ├─ PreviewService          │
       ├─ PublishService          │
       └─ UsageLedger(재사용)      │
                                  ▼
                   Generator Worker (Node 22, TypeScript)   ← 격리 프로세스
                     packages: contracts · tokens · composer · lint · kit(sections) · codegen · renderer
                     ├─ compose: Profile → SectionPlan → PageDoc
                     ├─ codegen: PageDoc → React+Tailwind+motion 프로젝트 파일
                     ├─ build:   정적 HTML (미리보기·발행용)
                     └─ gate:    axe-core · 대비 · 링크 · Lighthouse CI · 3뷰포트 스크린샷
                                  ▼
                         Object Storage (산출물·썸네일·zip)
                                  ▼
                         Hosting Adapter (Cloudflare Pages 1순위 ⚖️) — P1
```

- Backend(Python)와 생성기(Node) 사이 계약은 **JSON Schema**(contracts 패키지에서 생성)로 고정하고, 양쪽이 같은 스키마로 검증한다.
- 생성기 워커는 네트워크 egress 차단(허용 목록: 객체 저장소만), CPU·메모리·시간 제한 컨테이너에서 실행한다(TR-SEC-05).

## 3. 기술 스택

| 영역 | 선택 | 비고 |
|---|---|---|
| Backend | AOS FastAPI · SQLAlchemy async · Pydantic v2 | 기존 규칙 준수 |
| Dashboard | AOS React 19 · TS · Tailwind 4 · Zustand · Vite | 신규 페이지는 `React.lazy` |
| 대시보드 편집 UI | Puck(MIT) PoC → 채택 여부 M1 결정 ⚖️ | 계약→config 어댑터로 격리. 대안: 자체 섹션 리스트 편집기 |
| 생성기 | Node 22 + TypeScript strict 모노레포 패키지 | `packages/design-studio/*` |
| 생성 산출물 스택 | React + TypeScript + Tailwind CSS 4 + `motion/react` + Vite | 사용자 문서 6.5 |
| 토큰 | W3C DTCG 2025.10 JSON → Tailwind 4 `@theme` CSS 변수 | TRD-D-01 |
| 스키마 | zod(TS) → JSON Schema → Pydantic 모델 생성/검증 | 단일 소스 |
| 품질 검사 | axe-core, Lighthouse CI, Playwright 스크린샷 | TDD 참조 |
| 저장소 | AOS PostgreSQL(`design_studio` 스키마) + S3 호환 객체 저장소 ⚖️ | |

## 4. 도메인 모델

사용자 문서 6.2의 4개 모델을 기준으로, 토론 결론(권리·결정성·버전)을 반영해 확장한다.

### 4.1 DesignReference (카탈로그)

```
design_studio.design_reference
- id (uuid)
- title
- slug
- license_status      enum[internal, licensed, external_observed]   -- MVP 노출: internal, licensed
- license_note        text                                          -- licensed 계약 요약·만료일
- source_kind         enum[library_composition, licensed_asset]     -- MVP
- composition         jsonb   -- internal: 이 레퍼런스를 구성하는 PageDoc(우리 섹션 변형 + 테마)
- thumbnail_key       -- 객체 저장소 키. internal은 우리 렌더러가 생성한 이미지
- industry, audience[], purpose[]
- visual_tags[]       -- 콘셉트/무드
- layout_tags[]       -- 비대칭·카드형·풀스크린·매거진형·대시보드형
- media_kinds[]       -- 사진·영상·3D·일러스트·타이포
- color_palette       jsonb (역할별 hex)
- motion_level        enum[L0,L1,L2,L3]  (UI 표기: 없음·약함·중간·강함)
- responsive_metadata jsonb (breakpoints, 모바일 구조 요약)
- visibility          enum[public, org, hidden]
- organization_id     nullable (org 전용 레퍼런스)
- library_version
- created_by, created_at, updated_at, retired_at
```

- **`source_url` 필드는 생산 테이블에 두지 않는다**(사용자 문서와의 차이). `licensed`의 출처·계약 정보와 향후 `external_observed`의 관찰 URL은 접근 통제 원장 `design_studio_research.ledger`에만 둔다(TRD-D-04, TRD-E-14).
- 썸네일은 `internal`이면 우리 렌더러 스크린샷, `licensed`면 권리자 제공 이미지(라이선스 메타 필수).

### 4.2 BenchmarkScore

```
design_studio.benchmark_score
- reference_id, scoring_version
- performance_score, accessibility_score, responsive_score, content_score (0~100)
- user_score (저장·선택 기반, 집계 배치)
- measured_at, lab_env(json: 뷰포트·네트워크 프로파일)
```
- internal 레퍼런스는 우리 게이트 파이프라인으로 측정한다. 점수 옆에 측정일·환경을 표시한다.

### 4.3 DesignProfile

```
design_studio.design_profile
- id, project_id, version (int, 불변 레코드; 수정 = 새 버전)
- visual_direction        -- 예: modern-premium (무드 ID와 매핑)
- layout_direction        -- 예: editorial-grid
- color_tokens            jsonb (DTCG semantic)
- typography_tokens       jsonb (heading/body family, scale ratio)
- spacing_tokens          jsonb (density, section_rhythm)
- motion_preset           enum[L0,L1,L2]  (MVP 생성 상한 L2)
- component_choices       jsonb  -- {hero: {section, variant, media_kind}, card_style, footer, ...}
- section_plan            jsonb  -- 섹션 유형 순서 + 변형
- source_reference_ids[]  -- 선택 근거 레퍼런스
- library_version, seed
- created_by, created_at
```

사용자 문서 4E 예시 JSON은 그대로 입력 가능하게 하고, 서버가 위 정규형으로 변환한다.

### 4.4 SectionDefinition (섹션 계약, 코드 패키지가 정본)

```ts
type SectionDefinition = {
  type: SectionType;            // header | hero | about | services | portfolio | statistics | testimonials | pricing | faq | contact | cta-band | footer
  variant: string;              // hero: 'split' | 'fullscreen-media' | ...
  label: string;
  schemaVersion: number;
  slots: SlotSchema;            // zod: 타입·maxLength·required
  constraints: {
    moods: MoodId[]; maxMotion: 'L0'|'L1'|'L2'; minContrast: number;
    mobile: 'stack' | 'carousel' | 'hide-secondary';
  };
  tokens: string[];             // 참조 semantic/component 토큰
  a11y: { headingLevel: 1|2|3; altRequired: boolean };
  supportedBreakpoints: ('sm'|'md'|'lg'|'xl')[];
  provenance: { author: string; createdAt: string; abstractPatternIds: string[] }; // URL·이미지 키 금지
  render: React.ComponentType<SectionProps>;   // 사용자 문서 6.5와 동일 개념
};
```

- 레지스트리(`SectionRegistry`)는 `type+variant`로 조회한다. 대시보드 미리보기와 코드 생성기가 **같은 컴포넌트**를 쓴다.

### 4.5 GeneratedProject

```
design_studio.generated_project
- id, organization_id, owner_user_id, aos_project_id (nullable, AOS projects 연결)
- name, status enum[draft, generating, ready, failed, archived]
- current_profile_id, current_snapshot_id
- preview_url (서명된 만료 URL), export_keys jsonb
- repository_url (P2: Git 내보내기)
- created_at, updated_at

design_studio.page_snapshot(id, project_id, profile_version, page_doc jsonb, doc_hash, kind[auto|manual|published], created_at)
design_studio.generation_job(id, project_id, snapshot_id, state, error_code, gate_report jsonb, artifact_key, artifact_hash, started_at, finished_at)
design_studio.deployment(id, project_id, artifact_hash, state, promoted_at, rolled_back_at)   -- P1
design_studio.saved_reference(project_id, reference_id, saved_by, saved_at)
design_studio.compare_board(id, project_id, reference_ids[<=6], picks jsonb, updated_at)
```

### 4.6 권한

- 모든 `design_studio.*` 행은 `organization_id`(직접 또는 project 경유)를 가진다.
- 서버의 모든 조회·변경은 AOS `project_access`/조직 멤버십 검사를 거친다. 역할: viewer(보기)·editor(편집·생성)·publisher(발행)·curator(카탈로그 관리, 조직 관리자 전용).

## 5. API

사용자 문서 6.3을 기준으로 prefix를 `/api/design-studio`로 둔다.

| 메서드·경로 | 설명 | 권한 |
|---|---|---|
| `GET /api/design-studio/references` | 필터·페이지네이션(업종·타깃·표현·콘셉트·레이아웃·컬러·모션·디바이스·목적) | viewer |
| `GET /api/design-studio/references/{id}` | 상세 + 점수 + 유사 추천 | viewer |
| `POST /api/design-studio/references/{id}/save` · `DELETE …/save` | 보관함 저장/해제 | editor |
| `POST /api/design-studio/recommendations` | 입력(업종·타깃·목적·설명) → 5개 + 근거(규칙 점수) | viewer |
| `POST /api/design-studio/compare` | 2~6개 비교 표 데이터 | viewer |
| `PUT /api/design-studio/compare-boards/{id}/picks` | 요소 선택 저장 | editor |
| `POST /api/design-studio/profiles` | 프로필 생성(템플릿·조합·추천 결과) → 버전 1 | editor |
| `GET /api/design-studio/profiles/{id}` · `GET …/versions` · `POST …/versions` | 조회·버전 목록·새 버전 | viewer/editor |
| `POST /api/design-studio/projects` | 프로젝트 생성 | editor |
| `POST /api/design-studio/projects/{id}/generate` | 생성 잡 등록(멱등 키) → job_id | editor |
| `GET /api/design-studio/jobs/{job_id}` | 상태·게이트 보고 | viewer |
| `GET /api/design-studio/projects/{id}/preview` | 서명된 미리보기 URL | viewer |
| `PUT /api/design-studio/projects/{id}/page` | 편집 결과(PageDoc) 저장 → 스냅샷 | editor |
| `POST /api/design-studio/projects/{id}/export` | zip(react|static) 생성 | editor |
| `POST /api/design-studio/projects/{id}/publish` · `…/rollback` | 발행·롤백(P1) | publisher |
| `POST/PATCH /api/design-studio/admin/references` | 큐레이션 | curator |

오류 코드: `UNSUPPORTED_COMBINATION`, `GATE_FAILED`, `SCHEMA_INVALID`, `LICENSE_BLOCKED`, `COMPARE_LIMIT`, `JOB_TIMEOUT`, `FORBIDDEN`.

## 6. 파이프라인

### 6.1 추천 (규칙 기반)

```
score = 0.35·태그일치(업종·목적·무드) + 0.20·필수섹션충족(목적) + 0.15·타깃적합
      + 0.15·accessibility + 0.15·performance      (가중치 v1, scoring_version으로 관리)
```
- 동점은 `reference.id` 사전순(결정성). 근거 = 기여도 상위 3개 항목.
- LLM 요약(선택형 플래그)은 근거 항목을 문장으로 바꾸기만 한다.

### 6.2 생성

```
DesignProfile(v) ─▶ composer: SectionPlan 확정(프리셋·조합 규칙·seed)
                 ─▶ PageDoc (섹션 인스턴스 + 기본 슬롯 콘텐츠)
                 ─▶ lint(구조 규칙 R-01~R-13)
                 ─▶ codegen: React 컴포넌트 파일 + tailwind 테마 CSS + motion 프리셋 + package.json(허용 의존성)
                 ─▶ build: 정적 HTML (미리보기)
                 ─▶ gate: axe·대비·링크·Lighthouse·3뷰포트 스크린샷
                 ─▶ artifact(hash) 저장 → 상태 ready | failed
```
- 잡 timeout 120초, 재시도 1회(동일 입력이면 결과 동일하므로 재시도는 인프라 오류만).

### 6.3 카탈로그 적재

- **internal**: 큐레이터가 섹션 변형·테마로 PageDoc을 조립 → 우리 파이프라인으로 썸네일·점수 생성 → 승인 후 공개.
- **licensed**: 권리자 제공 자료 + 계약 메타를 원장에 기록 → 법무 확인 후 공개.
- **external_observed (MVP 제외)**: 사용자 문서 6.4의 수집 파이프라인(robots 확인 → 스크린샷 → DOM 분석 → 태그)은 도입 결정 시 다음 조건으로만: robots·약관 허용, 법무 승인, 조직 비공개, 생성 입력 사용 금지, SSRF 방어·도메인 허용 목록·요청 timeout·쿠키/개인정보 제거. **GDWEB은 대상에서 영구 제외.**

## 7. 조합 규칙·lint

| 규칙 | 내용 | 등급 |
|---|---|---|
| R-01 | header 1 + 본문 5~9 + footer 1 | 차단 |
| R-02 | hero는 첫 본문, 정확히 1개 | 차단 |
| R-03 | 목적 "문의 유도" → cta-band 또는 contact 1개 이상, 후반 1/3 | 차단 |
| R-04 | 목적 "예약" → contact(예약 변형) 필수 | 차단 |
| R-05 | 인접 섹션 배경 톤 동일 금지, 풀블리드 연속 ≤2 | 자동 보정 |
| R-06 | 타입 스케일·헤드라인 계열·radius는 테마 단일 값 | 차단 |
| R-07 | 모션: L2 섹션 ≤3, L3 = 0 | 차단 |
| R-08 | 대비 AA(본문 4.5, 큰 글자 3.0) | 차단 + 대체 토큰 제안 |
| R-09 | 이미지 대체텍스트(장식 표시 제외) | 차단 |
| R-10 | h1 1개, 헤딩 레벨 건너뛰기 금지 | 차단 |
| R-11 | title·description·canonical | 차단 |
| R-12 | 푸터 사업자정보·개인정보처리방침 링크·폼 동의 | 차단 |
| R-13 | 슬롯 maxLength | 차단 |
| R-14 | 섹션 코드 하드코딩 색/크기, primitive 직접 참조 | 개발 lint(빌드 실패) |
| R-15 | 스타일 조합 시 서로 다른 레퍼런스의 섹션이 같은 테마 토큰으로 재바인딩됨 | 자동 |

## 8. 코드 생성 산출물 규격

```
export/
  package.json            # 허용 의존성만: react, react-dom, motion, tailwindcss, @tailwindcss/vite, vite, typescript
  index.html
  src/main.tsx
  src/App.tsx             # SectionPlan 순서대로 섹션 렌더
  src/sections/*.tsx      # 사용된 섹션 변형만 포함
  src/theme/tokens.css    # Tailwind 4 @theme 변수 (DTCG에서 생성)
  src/motion/presets.ts   # L0~L2 프리셋, prefers-reduced-motion 처리
  src/content.json        # 슬롯 콘텐츠(사용자 입력)
  public/assets/*         # 사용자 업로드 변환본 + 허용 스톡
  README.md               # 실행 방법, 라이선스 목록
  LICENSES.md             # 폰트·스톡 라이선스
```
- 생성 코드에는 `eval`, `dangerouslySetInnerHTML`(sanitize 통과 리치텍스트 제외), 외부 스크립트 태그, 원격 폰트 CDN(허용 목록 외)이 없어야 한다(정적 검사로 강제).
- 성능 예산: 초기 JS ≤ 90KB gzip, CSS ≤ 30KB gzip, 폰트 ≤ 2 계열 서브셋, 이미지 AVIF/WebP + srcset.

## 9. 보안 요구사항 (TR-SEC)

| ID | 요구사항 | 출처 |
|---|---|---|
| TR-SEC-01 | 조직 간 데이터 분리: 모든 쿼리에 조직 조건, 교차 조직 접근 거부 테스트 | 사용자 문서 6.6, TRD-E-01 |
| TR-SEC-02 | 역할 viewer/editor/publisher/curator 서버 측 검사 | TRD-E-02 |
| TR-SEC-03 | 사용자 입력 텍스트 기본 이스케이프, 리치텍스트 허용 태그 sanitize | 사용자 문서 6.6 |
| TR-SEC-04 | 업로드: MIME·매직바이트·확장자·크기(10MB)·픽셀(40MP) 제한, EXIF 제거, 영상 크기 제한(50MB), 원본 비공개 | 사용자 문서 6.6, TRD-E-03 |
| TR-SEC-05 | 생성 워커 격리: 셸 실행 금지, egress 차단, 프로젝트별 작업 디렉터리, CPU/메모리/시간(120s) 제한 | 사용자 문서 6.6 |
| TR-SEC-06 | 생성 산출물 의존성 허용 목록 검사, 금지 패턴 정적 검사 | 사용자 문서 6.6 |
| TR-SEC-07 | URL 입력이 생기는 모든 경로(향후 external_observed 포함)에 SSRF 방어: 내부망·localhost·메타데이터 IP 차단, DNS 재바인딩 방지, 허용 스킴 https | 사용자 문서 6.6 |
| TR-SEC-08 | 미리보기 URL 서명·만료(24h)·noindex, 발행 사이트 보안 헤더(CSP·HSTS·nosniff·Referrer-Policy) | TRD-E-09 |
| TR-SEC-09 | 문의 폼: rate limit·honeypot·수신처 검증·내용 암호화·보존기간 삭제 | TRD-E-04 |
| TR-SEC-10 | 비밀(호스팅·DNS 토큰)은 AOS 비밀 저장 방식 재사용, 로그 출력 금지 | TRD-E-05 |
| TR-SEC-11 | 감사 로그: 프로필 확정·생성·내보내기·발행·롤백·카탈로그 변경 | TRD-E-02 |

## 10. 권리 정책의 기술적 강제 (TR-POL)

| ID | 요구사항 | 출처 |
|---|---|---|
| TR-POL-01 | 생산 스키마(DesignReference·SectionDefinition.provenance·DesignProfile)에 외부 URL·이미지·HTML 필드 금지 — 스키마 테스트로 강제 | TRD-D-04 |
| TR-POL-02 | 제3자 갤러리 자동 수집 코드 금지. 외부 요청 전 robots/약관 확인, UA 위장 금지 | TRD-D-02 |
| TR-POL-03 | 카탈로그 API는 `license_status in (internal, licensed)`만 반환(MVP) | PRD 원칙 4 |
| TR-POL-04 | 신규 섹션 승인 전 유사도 검사·근거 출처 3개 이상·루브릭 기록 | TRD-D-11 |
| TR-POL-05 | 폰트·스톡 허용 목록 + 라이선스 메타, 내보내기에 LICENSES.md | TRD-D-10 |
| TR-POL-06 | 조사 원장은 별도 스키마·curator/reviewer 역할만 접근, 접근 로그 | TRD-E-14 |

## 11. 관측·비기능

| 항목 | 목표 |
|---|---|
| 카탈로그 필터 응답 | p95 ≤ 300ms (레퍼런스 1,000개 기준) |
| 추천 응답 | p95 ≤ 500ms (LLM 제외) |
| 생성 잡(미리보기까지) | p95 ≤ 60s |
| 미리보기 성공률 | ≥ 95% |
| 내보내기 zip 빌드 성공률 | 100% (게이트 통과분) |
| 지표·경보 | 잡 실패율, 게이트별 실패, timeout, 워커 자원 사용, 발행 실패(P1) |

로그에 개인정보·폼 내용·사업 설명 원문·비밀값 금지.

## 12. 결정 필요 (⚖️)

1. 대시보드 편집 UI: Puck 채택 vs 자체 섹션 리스트 편집기 (M1 PoC 후)
2. 객체 저장소·호스팅 사업자
3. 생성 워커 실행 환경(AOS 기존 sandbox_manager 재사용 가능 여부 — 확인 필요)
4. external_observed 도입 여부(법무)
5. AOS 내 노출 방식(운영 대시보드 메뉴 vs 별도 앱 셸)

## 13. 변경 이력

| 버전 | 일자 | 내용 |
|---|---|---|
| v0.1 | 2026-09-25 | 독립 빌더 전제 초안 — `_archive/v0.1/` |
| v0.2 | 2026-09-25 | AOS 도메인 전환, 사용자 문서 4대 모델·API·생성 보안 반영, 권리 경계로 source_url·스크린샷 수집 조정 |
