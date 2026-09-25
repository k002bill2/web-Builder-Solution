AOS에 `디자인 벤치마크 → 디자인 선택 → 홈페이지 생성 → 미리보기·배포` 흐름을 신규 도메인으로 추가하는 방향으로 기획하십시오.

의도는 `GDWEB`의 정보 구조와 탐색 패턴을 참고하되, 단순 복제가 아니라 사용자가 여러 웹사이트를 비교하고 디자인 시스템을 선택해 실제 홈페이지로 생성하는 솔루션을 설계하는 것입니다. 아래 내용은 확인된 사이트 사실과 제안 설계를 분리했습니다.

## 1. GDWEB에서 확인된 핵심 패턴

`GDWEB`은 단순 포트폴리오 목록이 아니라 다음 흐름을 갖습니다.

```text
웹사이트 탐색
→ 카테고리·스타일 필터링
→ 작품 상세 확인
→ 에이전시·제작 역량 비교
→ 견적 요청 또는 문의
```

확인된 기능은 다음과 같습니다.

- 수상작을 WEB/MOBILE, 연도, 업종별로 구분합니다.
- 업종, 타깃층, 표현방법, 디자인 콘셉트, 컬러로 작품을 필터링합니다. [GDWEB 작품 검색](https://www.gdweb.co.kr/sub/list.asp)
- 작품 카드에는 제목, 등록일, 썸네일, 조회수가 표시됩니다.
- 에이전시 검색은 지역, 업종 경험, 기술력, 가격, 브랜딩, 영상·모션 역량 등으로 검색합니다. [GDWEB 에이전시 검색](https://www.gdweb.co.kr/sub/recommend.asp)
- 에이전시 순위는 수상 등급, 등록 작품 수, 작품 조회수, 에이전시 페이지 조회수를 합산합니다. [GDWEB 순위 기준](https://www.gdweb.co.kr/sub/agency.asp)
- 프로젝트 정보와 예산을 입력하면 조건에 맞는 에이전시 여러 곳에 견적을 요청할 수 있습니다. [GDWEB 견적 요청](https://www.gdweb.co.kr/sub/inquery_project.asp)
- 매거진, 채용, 무료 이미지, 해외 사이트 등 콘텐츠 확장 영역도 제공합니다. [GDWEB 메인](https://www.gdweb.co.kr/main/index.asp)

정확한 애니메이션, 실제 픽셀 단위 레이아웃, 인터랙션 동작은 텍스트 페이지 분석만으로 확정할 수 없습니다. 해당 부분은 별도 브라우저 검증이 필요합니다.

## 2. 제품 정의

### 제품명

가칭: `Hermes Design Benchmark Studio`

### 제품 목표

사용자가 원하는 홈페이지의 업종, 타깃, 분위기, 기능을 입력하면 다음을 제공합니다.

1. 유사 디자인 벤치마크 검색
2. 디자인 레퍼런스 저장·비교
3. 디자인 방향 선택
4. 색상·타이포그래피·레이아웃 토큰 생성
5. React + Tailwind CSS + Motion 기반 홈페이지 생성
6. 반응형 미리보기 및 배포

### 핵심 차별점

GDWEB은 “좋은 사이트를 찾는 서비스”에 가깝습니다.

이 제품은 다음까지 연결해야 합니다.

```text
좋은 사이트 찾기
→ 왜 좋은지 분석
→ 원하는 요소 선택
→ 디자인 시스템으로 변환
→ 실제 코드와 홈페이지로 생성
```

단순히 특정 사이트를 복제하지 않고, 다음 요소를 조합하는 방식으로 설계합니다.

- Hero 구조
- 내비게이션 방식
- 콘텐츠 섹션 순서
- 카드 및 그리드 구조
- 색상 체계
- 타이포그래피
- 모션 강도
- CTA 배치
- 모바일 반응형 규칙

## 3. 주요 사용자

| 사용자 | 주요 목적 |
|---|---|
| 1인 사업자 | 전문 홈페이지를 빠르게 제작 |
| 마케팅 담당자 | 경쟁사·동종 업계 사이트 분석 |
| 디자이너 | 레퍼런스 수집과 디자인 방향 결정 |
| 에이전시 | 고객 제안서와 초기 시안 제작 |
| 기업·조직 | 브랜드별 홈페이지를 여러 개 관리 |

## 4. 핵심 기능

### A. 디자인 벤치마크 검색

검색 조건:

- 업종: 기업, 병원, 교육, 금융, 쇼핑몰, 공공기관 등
- 타깃: 기업, 학생, 학부모, 20~30대 등
- 표현 방식: 사진, 영상, 3D, 일러스트, 타이포그래피
- 콘셉트: 모던, 고급, 실험적, 안정적, 역동적 등
- 레이아웃: 비대칭, 카드형, 풀스크린, 매거진형, 대시보드형
- 컬러: 색상 팔레트와 명도
- 모션 강도: 없음, 약함, 중간, 강함
- 디바이스: Desktop, Mobile, Responsive
- 콘텐츠 목적: 브랜드 소개, 문의 전환, 판매, 정보 제공

### B. 디자인 카드

각 카드에 다음 정보를 표시합니다.

```text
썸네일
사이트명
업종
디자인 태그
대표 색상
레이아웃 유형
모션 수준
반응형 지원 여부
접근성·성능 점수
저장 버튼
비교 추가 버튼
```

### C. 비교 보드

사용자가 저장한 2~6개 사이트를 비교합니다.

비교 항목:

- Hero 구성
- 메뉴 구조
- CTA 위치
- 콘텐츠 섹션 수
- 컬러 팔레트
- 폰트 조합
- 이미지 비율
- 모션 방식
- 모바일 구조
- 접근성·성능 지표

### D. 디자인 선택 모드

세 가지 모드를 제공합니다.

1. `템플릿 선택`
   - 미리 정의된 완성형 홈페이지 선택

2. `스타일 조합`
   - 한 사이트의 Hero
   - 다른 사이트의 카드
   - 별도 사이트의 Footer
   - 사용자 지정 색상·폰트

3. `AI 추천`
   - 사업 설명과 타깃 입력
   - 적합한 레퍼런스 5개 추천
   - 추천 근거 표시
   - 사용자가 직접 승인해야 적용

### E. 디자인 프로필 생성

선택 결과를 다음 JSON 구조로 저장합니다.

```json
{
  "visual_direction": "modern-premium",
  "layout": "editorial-grid",
  "primary_color": "#111111",
  "accent_color": "#D9FF45",
  "background_color": "#F5F5F2",
  "typography": {
    "heading": "Pretendard",
    "body": "Pretendard"
  },
  "motion_level": "medium",
  "hero_type": "fullscreen-media",
  "card_style": "minimal-border",
  "section_rhythm": "large-spacing"
}
```

### F. 홈페이지 생성

생성 가능한 기본 섹션:

- Header
- Hero
- About
- Services
- Portfolio
- Statistics
- Testimonials
- Pricing
- FAQ
- Contact
- Footer

생성 결과는 React 컴포넌트와 디자인 토큰으로 분리합니다.

```text
DesignProfile
→ SectionPlan
→ React Components
→ Tailwind Tokens
→ Motion Presets
→ Preview
→ Publish
```

## 5. PRD 초안

### 5.1 문제 정의

현재 홈페이지 제작은 다음 문제가 있습니다.

- 레퍼런스 조사와 정리에 시간이 오래 걸립니다.
- 디자인 선택 근거가 주관적입니다.
- 레퍼런스가 실제 코드로 연결되지 않습니다.
- 초기 시안과 개발 결과의 차이가 큽니다.
- 브랜드별 디자인 시스템 재사용이 어렵습니다.

### 5.2 MVP 범위

MVP에는 다음만 포함합니다.

- 디자인 레퍼런스 카탈로그
- 태그·업종·스타일 검색
- 저장·비교 보드
- 디자인 프로필 생성
- React 홈페이지 초안 생성
- Desktop/Mobile 미리보기
- 프로젝트 저장 및 버전 관리

### 5.3 MVP 제외 범위

초기에는 다음을 제외합니다.

- 완전한 Figma 대체 편집기
- 자동 도메인 구매
- 결제·구독 시스템
- 임의 웹사이트의 무단 전체 복제
- 고급 CMS
- 실시간 다중 사용자 편집
- 자동 법률·저작권 판정

### 5.4 주요 사용자 시나리오

```text
1. 사용자가 업종과 타깃을 입력한다.
2. 시스템이 벤치마크 사이트를 추천한다.
3. 사용자가 3개 사이트를 저장한다.
4. 비교 보드에서 Hero·컬러·레이아웃을 선택한다.
5. 디자인 프로필을 확정한다.
6. 홈페이지 초안을 생성한다.
7. Desktop/Mobile 미리보기에서 수정한다.
8. 코드 또는 배포 결과를 내보낸다.
```

### 5.5 성공 지표

제안 기준:

- 첫 디자인 방향 선택까지 10분 이내
- 추천 레퍼런스 저장률 30% 이상
- 생성 홈페이지 미리보기 성공률 95% 이상
- 모바일 레이아웃 오류율 5% 이하
- 생성 결과의 Lighthouse Performance 80점 이상
- 사용자 프로젝트 재방문율 30% 이상

## 6. TRD 초안

### 6.1 시스템 구조

```text
React Dashboard
    ↓
AOS Backend API
    ↓
Project Service
    ├── Benchmark Catalog
    ├── Design Profile Service
    ├── Generation Orchestrator
    ├── Preview Service
    └── Usage Ledger
            ↓
     Screenshot / Asset Worker
            ↓
      Object Storage
```

### 6.2 주요 도메인 모델

```text
DesignReference
- id
- title
- source_url
- thumbnail_url
- industry
- audience
- layout_tags
- visual_tags
- color_palette
- motion_level
- responsive_metadata
- performance_metadata
- license_status
- created_at
```

```text
DesignProfile
- id
- project_id
- layout_direction
- color_tokens
- typography_tokens
- spacing_tokens
- component_choices
- motion_presets
- source_reference_ids
- version
```

```text
GeneratedProject
- id
- organization_id
- owner_user_id
- name
- status
- current_profile_id
- preview_url
- repository_url
- created_at
- updated_at
```

```text
BenchmarkScore
- reference_id
- performance_score
- accessibility_score
- responsive_score
- content_score
- user_score
- scoring_version
```

### 6.3 API 초안

```text
GET    /api/design-references
GET    /api/design-references/{id}
POST   /api/design-references/{id}/save
POST   /api/benchmark/compare
POST   /api/design-profiles
GET    /api/design-profiles/{id}
POST   /api/projects
POST   /api/projects/{id}/generate
GET    /api/projects/{id}/preview
POST   /api/projects/{id}/publish
```

### 6.4 벤치마크 수집 파이프라인

```text
URL 또는 큐레이션 데이터
→ 접근 권한·robots 확인
→ 스크린샷 생성
→ DOM·메타데이터 추출
→ 섹션 구조 분석
→ 색상·폰트·레이아웃 추출
→ 성능·접근성 검사
→ 태그 생성
→ 중복 사이트 제거
→ 카탈로그 등록
```

외부 사이트를 수집할 때는 SSRF 방어, 도메인 허용 목록, 요청 시간 제한, 개인정보·쿠키 제거가 필요합니다. 타 사이트의 이미지와 문구를 그대로 재사용하지 않고, 사용 허가된 자료나 자체 제작 에셋만 생성 결과에 포함해야 합니다.

### 6.5 프론트엔드 제안

사용자가 이전에 지정한 기술 방향을 기준으로 다음을 권장합니다.

- React
- TypeScript
- Tailwind CSS
- `motion/react`
- Zustand 또는 기존 AOS 상태 관리 방식
- 컴포넌트 기반 Section Registry
- JSON 기반 Design Token
- 반응형 Preview Frame

섹션 컴포넌트는 다음처럼 등록합니다.

```ts
type SectionDefinition = {
  type: string;
  label: string;
  schema: unknown;
  render: React.ComponentType;
  supportedBreakpoints: string[];
};
```

### 6.6 생성 보안

필수 방어 항목:

- 생성된 코드에서 임의 셸 명령 실행 금지
- 사용자 입력 HTML 기본 이스케이프
- URL import 시 내부망·localhost 차단
- 프로젝트별 파일 격리
- 조직별 데이터 접근 제한
- 업로드 파일 MIME 검증
- 이미지·영상 크기 제한
- 생성 작업 timeout
- 코드 생성 결과의 dependency allowlist
- 외부 사이트 콘텐츠 라이선스 상태 저장

## 7. 개발계획서

MVP는 4~6명 규모 기준 약 6~8주가 현실적인 추정입니다. 실제 기간은 기존 AOS의 인증·프로젝트·파일 저장 기능 재사용 여부에 따라 달라집니다.

### Phase 0 — 요구사항·벤치마크 정의

기간: 3~5일

산출물:

- 기능 목록
- 사용자 여정
- 디자인 태그 체계
- 벤치마크 점수 기준
- 저작권·수집 정책
- MVP 범위 확정

### Phase 1 — 카탈로그와 검색

기간: 1~2주

산출물:

- `DesignReference` 모델
- 필터 API
- 검색 UI
- 카드 컴포넌트
- 저장 기능
- 관리자 큐레이션 화면

### Phase 2 — 비교 보드와 디자인 프로필

기간: 1~2주

산출물:

- 비교 보드
- 레퍼런스별 요소 선택
- 색상·폰트·간격 토큰 추출
- `DesignProfile` 저장
- 버전 관리

### Phase 3 — 홈페이지 생성기

기간: 2주

산출물:

- Section Registry
- Header/Hero/About/Services/Contact/Footer
- Tailwind 토큰 변환
- `motion/react` 모션 프리셋
- React 코드 생성
- Desktop/Mobile 미리보기

### Phase 4 — 검증·배포

기간: 1주

산출물:

- 반응형 테스트
- 접근성 검사
- Lighthouse 검사
- 생성 코드 보안 검사
- 프로젝트 내보내기
- Codex 코드 리뷰
- 운영 문서

## 8. Hermes 팀 업무분장

현재 대화에는 실제 Hermes 에이전트를 호출하거나 작업을 위임하는 도구가 제공되지 않았습니다. 따라서 아래는 즉시 전달 가능한 작업 브리프이며, 실제 위임·파일 수정·실행은 아직 하지 않았습니다.

| 팀원 | 담당 | 완료 기준 |
|---|---|---|
| Hermes Architect | 제품 범위·도메인 설계 | PRD, 핵심 도메인, MVP 경계 확정 |
| Hermes Researcher | GDWEB 및 경쟁 서비스 분석 | 사이트 구조, 필터, 비교 기능, 법적 위험 보고 |
| Hermes UX Designer | 검색·비교·선택 UX | 화면 흐름, 와이어프레임, 디자인 선택 규칙 |
| Hermes Backend | 카탈로그·프로필·프로젝트 API | 모델, API, 권한, 테스트 |
| Hermes Frontend | 검색·비교·미리보기 UI | React 컴포넌트, 반응형, 상태 관리 |
| Hermes AI Engineer | 레퍼런스 분석·프로필 생성 | 구조화된 `DesignProfile` 출력과 검증 |
| Hermes Infra/Security | 수집·스토리지·보안 | SSRF, 파일 격리, timeout, 관측성 |
| Codex | 독립 검증 | diff 리뷰, 보안 리뷰, 테스트 결과 확인 |

### 병렬 실행 순서

```text
Architect ───────┐
Researcher ──────┼→ PRD·태그 체계 확정
UX Designer ─────┘

Backend ─────────┐
AI Engineer ─────┼→ DesignProfile 계약 확정
Frontend ────────┘

Infra/Security → 수집·생성 파이프라인 검증
Codex          → 구현 완료 후 독립 리뷰
```

## 9. 첫 번째 구현 티켓

첫 작업은 홈페이지 생성이 아니라 다음 계약을 확정하는 것입니다.

```text
DesignReference
DesignProfile
SectionDefinition
GeneratedProject
```

완료 조건:

- 레퍼런스 20개를 등록할 수 있음
- 업종·콘셉트·레이아웃·컬러로 필터링할 수 있음
- 3개 레퍼런스를 비교할 수 있음
- 선택 결과를 `DesignProfile` JSON으로 저장할 수 있음
- 저장된 프로필에서 Hero와 Footer가 포함된 React 미리보기를 생성할 수 있음

이 범위가 확정되면 Hermes 팀은 `Research/UX`, `Backend/AI`, `Frontend` 세 그룹으로 바로 나누어 착수할 수 있습니다.