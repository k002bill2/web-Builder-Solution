# Buzz 토론 합본 — GDWEB 패턴 기반 홈페이지 제작 솔루션

- 문서 상태: **v0.2 (영환님 기획 문서 반영, 결정 대기 항목 포함)**
- 작성: Jarvis (Hermes) · 2026-09-25 KST
- 입력(원문, 수정하지 않음):
  - `docs/00-research/BUZZ_BRIEF.md` — 분석 요청서
  - `docs/00-research/buzz/claude-fable.md` — A. 전체 기획·IA / B. 벤치마크 (Claude-Fable)
  - `docs/00-research/buzz/claude-opus-5.5.md` — C. 디자인 선택·패턴화 / D. 기술·리스크 (Claude-Opus 5.5)
  - `docs/00-research/buzz/gpt-sol.md` — E. 교차검토·출처 재확인·누락 요구사항 (GPT-Sol)
- 후속 문서: `docs/02-prd/PRD.md` → `docs/03-trd/TRD.md` → `docs/04-plan/DEVELOPMENT_PLAN.md` → `docs/05-tdd/TDD.md`

## 0. 커버리지와 검증 상태

| 항목 | 상태 |
|---|---|
| 토론 채널 | Buzz `#general` 스레드(원글 2026-09-25 02:55 KST) |
| 합본 근거 | 3개 산출물 파일 전문. 스레드 답글 중 파일에 반영된 교차 코멘트(Fable E절, Opus 6-1·6-2절)까지 포함 |
| 미포함 | 파일에 반영되지 않은 스레드 답글 원문(Buzz UI에서 전문 추출하지 않음) |
| 외부 사실 검증 | 경쟁사·법리·표준 관련 사실은 **에이전트 조사 결과이며 Jarvis가 재검증하지 않음**. 외부 공유 전 Newton 검증 권장 |
| 참여하지 않은 에이전트 | GPT-Luna (채널 미구독 계정/allowlist 계정 분리 문제로 대기) |

## 1. 한 줄 결론

제3자 선정작을 보여주는 갤러리가 아니라, **자체 제작한 섹션·테마 라이브러리를 `업종 → 목적 → 무드 → 3안 비교 → 섹션 편집 → 발행`으로 결정적으로 조립하는 홈페이지 빌더**를 만든다. GDWEB은 분류 어휘와 심사 관점을 참고하는 데만 쓰고, 데이터·이미지는 가져오지 않는다.

## 2. 주제별 결론

표기: ✅ 합의 · 🔧 조정 후 합의 · ⚖️ 영환님 결정 필요

### T1. 제품 정의와 차별점 🔧

- ✅ 제품 형태: 섹션 조립 + 테마 토큰 스왑(Fable) = 규칙 기반 조립 + 스키마 제한 LLM(Opus). 세 에이전트 합의.
- 🔧 차별점 재정의 (GPT-Sol 정정 반영)
  - Fable 원안: "차별점은 템플릿 수가 아니라 고르는 방식"
  - GPT-Sol 정정: 카페24 AI 홈페이지 빌더가 이미 "업종 선택 → AI 전체 구성 → 분위기·색상 수정"을 공식 제공한다(https://homebuilder.cafe24.com/). Wix·Framer·식스샵도 프롬프트→편집 가능한 사이트를 제공한다.
  - **채택안:** 차별점 = ① 한국 업종별 필수 섹션·법정 표시 규칙 ② 설명 가능한 규칙 기반 3안(같은 입력이면 같은 결과) ③ 구조/스타일 독립 스왑(콘텐츠 보존) ④ 접근성·SEO·성능 발행 게이트 ⑤ 버전·롤백·내보내기.

### T2. 사용자 선택 축 🔧

| 축 | 결정 | 근거 |
|---|---|---|
| 업종 | GA 10종: 병·의원 / 법률·세무·전문직 / 교육·학원 / 음식·카페·식품 / 뷰티·살롱 / 건축·인테리어·부동산 / 제조·B2B 기업소개 / IT·스타트업 / 공공·단체·협회 / 문화·예술·행사·프로모션 | Fable·Opus 합의 2 (GDWEB 업종 36종을 발주 빈도로 병합) |
| 목적 | 6종: 문의 유도 / 예약 / 브랜드 인지 / 제품·서비스 소개 / 채용 / 정보 제공 | Opus 합의 1. "포트폴리오·개인"은 목적 "제품·서비스 소개"의 `showcase` 세트로 파생 |
| 무드 | 8종: trust / premium / tech / warm / playful / bold / natural / editorial | Opus C-1 (GDWEB 디자인컨셉 22개 압축, 매핑은 [추정]) |
| 대표색 | 선택 입력(브랜드 색). 역할 팔레트로 변환 후 대비 검사 | Fable 4축 + Opus 역할 팔레트 |
| 타겟 | 선택 입력. 카피 톤·가독성 기준에만 반영 | Opus |
| 표현방법 | **사용자 축이 아님.** `media_kind(photo/video/illustration/3d/type)` = 섹션 슬롯 속성, `motion_level` = 테마·페이지 정책 | 합의 4 + GPT-Sol 1-2 ⑤ |

- 프리셋은 업종×목적 전조합(최대 60)이 아니라 **업종별 대표 목적 2~3개만 사전 정의**하고 나머지는 섹션 세트 규칙으로 파생한다.

### T3. 패턴 체계 ✅

- 2층 분류: **선택층**(업종·목적·무드) / **조립층**(섹션 유형·변형 → 그리드 → 타입 스케일 → 컬러 역할 → 모션 레벨).
- 섹션 유형 16종: header, footer, hero, intro, feature-grid, service-list, showcase, stats, testimonial, logos, team, timeline, news, faq, cta-band, contact-location. 각 2~4 변형.
- hero·showcase·intro 변형은 **레이아웃 × 미디어 슬롯** 2차원으로 분리(합의 4).
- 그리드: 12열, 컨테이너 720/1200/1440, 분할 1:1·5:7·4:8·7:5, 모바일 1열 붕괴.
- 타이포: 스케일 비율 1.2/1.25/1.333/1.5, 헤드라인 고딕/명조·세리프/디스플레이, 본문 고딕 고정, 임베딩 허용 폰트만.
- 모션: L0~L3, MVP는 L0~L2, `prefers-reduced-motion` 시 L0 강제.
- 토큰: W3C DTCG 2025.10 JSON, primitive → semantic → component 3층. **테마 = semantic 토큰 세트 1개**. 기본 테마 = 무드 8 × 밀도 2 = 16종.

### T4. 디자인 선택 UX ✅

1. 업종·목적 선택, 브랜드명·로고·대표색(선택) 입력
2. 무드 카드 8장 중 1장 — 카드는 사용자 브랜드명이 들어간 **자체 렌더 hero 미리보기**
3. 시스템이 3안 제안(같은 무드 안에서 hero 변형·그리드·타입 스케일 차이) → 나란히 비교 후 1안 선택. "같은 업종/무드의 대체안" 요청 가능
4. 섹션 편집 + 전역 슬라이더 3개(밀도·대비·모션)
5. 발행 전 lint 결과 확인

- 제외: 스타일 퀴즈(2차), **레퍼런스 URL 입력 → 비슷하게 만들기(영구 제외, 모사 창구)**, GDWEB 원본 이미지 노출.
- 차용: GDWEB 상세의 "유사 업종/유사 컨셉" 추천 구조 → 우리 프리셋 간 대체안 추천.

### T5. 생성 엔진·LLM 🔧

- ✅ 핵심은 **규칙 기반 조립기(결정적)**. 변형 선택·순위도 규칙 기반.
- 🔧 LLM 범위(세 입장 조정 결과): 빈 슬롯 카피 초안만, JSON 스키마 검증 후 반영, 실패 시 정적 플레이스홀더 폴백, **핵심 경로 밖의 선택형 플래그**. 의료·금융 업종은 사용자 확인 전 발행 금지. LLM 자유 HTML/CSS 생성은 제외.
- ✅ 결정 재현: 같은 입력·라이브러리 버전·seed → 같은 3안. 생성 로그에 규칙·버전·제외 이유 기록(TRD-E-15).

### T6. 에디터 ✅

- 섹션 단위 편집: 추가·삭제·순서·변형 교체·슬롯 편집. 픽셀 자유 배치·임의 CSS는 MVP 제외.
- Puck(MIT) PoC 1순위, GrapesJS 대안. **섹션 계약 → Puck config 변환 계층**을 둬서 에디터 교체 가능하게.

### T7. 발행·호스팅·도메인 🔧

- ✅ 정적 HTML 내보내기 + CDN. 불변 배포(content hash) + 원자적 alias 승격 + 즉시 롤백.
- 🔧 도메인: 베타는 서브도메인만. **도메인·TLS 데이터 모델과 배포 추상화는 처음부터 설계**, 커스텀 도메인은 유료 전환 시점(GA)에 필수.
- ⚖️ 호스팅 사업자(Cloudflare Pages / Vercel / AWS / 국내 클라우드)는 비용·국내 레이턴시 비교 후 결정.
- 국내 필수 요소 기본 포함: 푸터 사업자정보, 개인정보처리방침 링크, 문의 폼 수집 동의, 카카오·네이버 지도 임베드 옵션.

### T8. 패턴 수집·권리 정책 ✅

- GDWEB 자동 수집·캡처 저장·태그 할당 데이터 수집 **금지**. 근거: robots.txt `User-agent: * / Disallow: /`, 이용약관 제13조 3항(무단 사용·인용 금지).
- 수집은 **수동 큐레이션**만: 사람이 브라우저로 관찰 → 추상 구조를 사내 어휘로 기록 → 섹션은 백지에서 새로 디자인. 한 섹션은 **서로 다른 3개 이상 출처의 공통 패턴**에 근거할 때만 채택.
- provenance 이중 구조(GPT-Sol 보정, Opus 수용): 생산 객체에는 제작자·일시·추상 패턴 ID만, 별도 **접근 통제 조사 원장(research_ledger)**에 관찰 URL·관찰일·약관/robots 확인·추상화 메모·승인자. 외부 이미지·HTML·캡처는 어느 저장소에도 보관하지 않음.
- 신규 섹션 등록 시 내부 유사도 검사(레이아웃 구조 + 색상 + 카피).
- 병행 검토: GDWEB 제휴문의 창구로 메타데이터 이용 허락 문의(선택).
- 법리 참고(Opus, 사안 적용은 [추정]): 대법원 2021도1533(형사 무죄) vs 같은 분쟁 민사 1심 성과도용 인정 → 형사 무죄여도 민사 책임 가능. **법무 검토 필요.**

### T9. MVP·베타 범위 ⚖️

| 구분 | 업종 | 목적 | 무드 | 섹션 | 제안자 |
|---|---|---|---|---|---|
| 베타(권장) | 5 | 3 | 4 | 12유형 × 2변형 = 24 | GPT-Sol |
| GA(MVP 라이브러리) | 10 | 6 | 8 | 16유형 × 2~4변형 | Opus·Fable |

- 베타는 GA의 부분집합이라 충돌하지 않는다(Opus 6-2). **베타 → GA 확장 순서로 갈지 영환님 결정 필요.** Jarvis 추천: 베타 먼저.

### T10. 운영 요구사항 보강 (GPT-Sol 추가, 반대 의견 없음) ✅

- 버전 이력·스냅샷·마지막 발행본 복원, 발행 상태기계와 실패 원인 표시
- 소유권·내보내기·해지 후 보존/삭제 기간
- 관리자: 섹션/테마 승인·비활성화·버전 승격·긴급 회수와 영향 사이트 목록
- SEO(title/description/canonical/robots/sitemap/OG/301), WCAG 2.2 AA, 3개 뷰포트, Core Web Vitals(p75 LCP ≤2.5s, INP ≤200ms, CLS ≤0.1)
- 미리보기 보안(추측 어려운 URL, 선택적 암호, noindex)
- 요금 단위·한도 UX·결제 상태·가격 표시
- 멀티테넌시, 역할(owner/editor/publisher)·감사 로그, 업로드 보안, 폼 보안, 비밀·도메인 토큰 관리, 관측성

### T11. 경쟁 벤치마크 (정정 반영본)

| 서비스 | 확인된 핵심(에이전트 조사) | 정정·확인 필요 |
|---|---|---|
| 아임웹 | 14일 체험, Free 폐지, Starter 월 16,000원~ | "템플릿 변경 시 초기화", "AI 25자·15분·1일 1회"는 공식 FAQ 본문 재확인 필요(GPT-Sol 요청 시 403) |
| 카페24 | 디자인센터 전체 상품 339,656(스킨 외 포함), 스마트디자인 HTML 수정 | **정정:** AI 홈페이지 빌더가 업종 기반 전체 구성 제공 |
| 식스샵 | 무료 플랜, 홈페이지 플랜 월 12,300원(연간), AI 페이지/블록·URL/Figma/HTML 변환·MCP | drag/drop·breakpoint 조작 계약 미확정 |
| Wix | 2,000+ 템플릿, Studio(반응형 캔버스·CSS·CMS), Harmony | Light 가격은 로케일별 상이 → "약 $17/월부터" 표기. Aria 발표일 확인 필요 |
| Framer | Free 500 AI credits, Basic $10/월, AI agent가 페이지·CMS·발행 전 대비/alt/SEO 검토 | 마켓플레이스 카테고리 수·유료 템플릿 가격대는 비교에 쓰지 않음 |

## 3. 정정·충돌 해소 기록

1. 카페24 "사이트 전체 생성형 AI 미확인"(Fable) → 제공 중(GPT-Sol, 공식 페이지). **차별점 문구 변경.**
2. Framer "Wireframer 수준"(Fable) → AI agent + 발행 전 품질 검토까지(GPT-Sol).
3. 목적 축 4종(Fable) vs 6종(Opus) → 6종 정본.
4. 섹션 30~40종(Fable) vs 16유형×2~4(Opus) vs 12×2(GPT-Sol) → GA는 Opus, 베타는 GPT-Sol.
5. LLM MVP OUT(Fable) vs 보조(Opus) → 핵심 경로 밖 선택형 플래그.
6. provenance URL 제거(Fable·Opus) vs 원장 필요(GPT-Sol) → 이중 구조.

## 4. 컴플라이언스 사건 기록 (재발 방지)

- Claude-Fable·Claude-Opus 5.5는 분석 중 GDWEB robots.txt `Disallow: /`를 확인한 뒤에도 브라우저 UA로 페이지를 추가 요청했다(각 6회, 로그인·다운로드·순회 없음, HTML은 삭제했다고 자기 보고).
- Jarvis도 요청서 작성 시 robots 확인 없이 메인 페이지를 1회 요청했다.
- 조치: GPT-Sol 요청문에 "GDWEB 신규 접근 금지"를 추가했다. 서비스 운영 정책에서는 TRD `TR-POL-02`(외부 요청 전 robots/약관 확인, UA 위장 금지)로 강제한다.

## 5. 영환님 결정 필요 (위험 순)

1. **법무 검토 착수 여부** — 수집 경계·폰트/스톡 라이선스·업종별 법정 표시(의료광고 등). 손실 위험.
2. **베타 → GA 단계 운영 여부** — 추천: 베타(5·3·4, 24변형) 먼저.
3. **호스팅 사업자** — 추천: Cloudflare Pages(+Workers·R2), 비용·국내 레이턴시 확인 후 확정.
4. **GDWEB 제휴 문의 여부** — 선택. 없어도 제품 성립.
5. **1차 타깃 세그먼트** — 추천: 소상공인·스타트업·기관 실무자(Fable A-5).
6. **LLM 카피 모델** — GA 단계에서 한국어 품질·비용 평가 후.

## 6. 영환님 제공 기획 문서 반영 (v0.2 추가)

입력: `AOS에 디자인 벤치마크 → 디자인 선택 → 홈페이지 생성 → 미리보기.md` (Slack 첨부, 2026-09-25). 원본 사본: `docs/00-research/USER_BRIEF_AOS_DESIGN_STUDIO.md`

### 6-1. 그대로 채택
- **AOS 신규 도메인**으로 구현(가칭 `Hermes Design Benchmark Studio`, 도메인 키 `design-studio`). AOS의 조직·프로젝트·인증·사용량 원장을 재사용한다.
- 흐름: `벤치마크 탐색 → 저장·비교 보드 → 디자인 선택(템플릿 / 스타일 조합 / AI 추천) → DesignProfile → SectionPlan → React 컴포넌트 + Tailwind 토큰 + Motion 프리셋 → 미리보기 → 발행/코드 내보내기`.
- 핵심 계약 4종 우선 확정: `DesignReference`, `DesignProfile`, `SectionDefinition`, `GeneratedProject`.
- 첫 티켓(수직 슬라이스): 레퍼런스 20개 등록 · 업종/콘셉트/레이아웃/컬러 필터 · 3개 비교 · DesignProfile JSON 저장 · Hero+Footer React 미리보기.
- 기술: React + TypeScript + Tailwind CSS + `motion/react` + Zustand(AOS 기존 방식), Section Registry, JSON 디자인 토큰, 반응형 Preview Frame.
- 생성 보안 항목(셸 실행 금지, HTML 이스케이프, 내부망 차단, 프로젝트 격리, 조직 접근 제한, MIME 검증, timeout, dependency allowlist, 라이선스 상태 저장).
- 비교 보드 항목(Hero·메뉴·CTA 위치·섹션 수·팔레트·폰트·이미지 비율·모션·모바일 구조·접근성/성능).
- 에이전트 토론과 합치: 레퍼런스 **전체 복제가 아니라 요소 조합**, 결과물에 타 사이트 이미지·문구 불포함.

### 6-2. 조정한 부분 (토론 결론과 충돌)

| 사용자 문서 | 토론 결론 | 조정안 (PRD/TRD 반영) |
|---|---|---|
| 카탈로그에 외부 사이트 `source_url`·`thumbnail_url`, 수집 파이프라인에 **스크린샷 생성·DOM 추출** | GDWEB 자동 수집·캡처 저장 금지(robots `Disallow: /`, 약관 13조), 섹션은 자체 제작 | `DesignReference.license_status`로 출처를 구분한다. **MVP 카탈로그 = `internal`(우리 섹션 라이브러리로 만든 레퍼런스 사이트) + `licensed`(권리자 허락분)만.** 외부 URL 스크린샷 수집은 MVP 제외, 도입 시 robots·약관·법무 승인 + 조직 비공개 + 생성 입력 사용 금지 조건 ⚖️ |
| 스타일 조합: "한 사이트의 Hero + 다른 사이트의 카드" | 특정 사이트 모사 기능 금지 | 조합 단위는 **카탈로그 레퍼런스를 구성하는 우리 섹션 변형**이다. 외부 사이트의 섹션을 떼어 오지 않는다 |
| AI 추천: 레퍼런스 5개 추천 + 근거, 사용자 승인 후 적용 | LLM은 핵심 경로 밖 | 추천 순위는 **규칙 기반 점수**(태그 일치·목적 필수 섹션·접근성/성능 점수), LLM은 근거 문장 요약만 선택형. 적용은 사용자 승인 필수(문서와 일치) |
| 레이아웃 축(비대칭·카드형·풀스크린·매거진형·대시보드형), 모션 4단(없음·약함·중간·강함), 디바이스, 콘텐츠 목적 | 선택층은 업종·목적·무드, 레이아웃·모션은 조립층 | **탐색 필터**에는 레이아웃·모션·디바이스를 노출(비교·검색용), **생성 입력**은 DesignProfile로 정규화. 모션 4단 ↔ L0~L3 매핑, MVP 생성은 L0~L2 |
| MVP 범위: 카탈로그·검색·비교·프로필·React 초안·미리보기·버전. 배포는 "내보내기" | 베타에 서브도메인 발행 포함 | **MVP = 미리보기 + 코드 내보내기(zip) + 서브도메인 발행(P1)**. 발행 게이트·롤백 설계는 유지 |
| 일정 6~8주(4~6명) | 11~12주(1인 Developer 추정) | 두 전제를 병기. Hermes 팀은 Developer 트랙을 Orca worktree 3개(backend·kit·dashboard)로 병렬화해 **8~10주 추정** |
| 팀: Architect·Researcher·UX·Backend·Frontend·AI Engineer·Infra/Security·Codex | 실제 Hermes 로스터: Jarvis·Newton·Designer·Developer·Security·QA·Hemingway | 문서의 역할을 실제 프로필에 매핑(개발계획서 2절). Codex는 AOS 규칙대로 독립 diff 리뷰 게이트 |

### 6-3. 사용자 문서의 GDWEB 관찰 (미재검증)
- 에이전시 검색(지역·업종 경험·기술력·가격·브랜딩·영상/모션), 에이전시 순위(수상 등급·등록 작품 수·조회수 합산), 견적 요청(조건 맞는 복수 에이전시), 매거진·채용·무료 이미지·해외 사이트.
- robots 정책상 추가 확인 접근은 하지 않는다. 에이전시 비교·견적 중개는 **범위 밖**(우리 고객은 에이전시 예산이 없는 발주자, Fable A-1).

## 7. 출처 원장 (에이전트 인용 URL, Jarvis 미재검증)

- GDWEB: https://www.gdweb.co.kr/robots.txt · https://www.gdweb.co.kr/sub/agreement.asp · https://www.gdweb.co.kr/sub/process.asp · https://www.gdweb.co.kr/sub/list.asp
- 표준: https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version · https://www.w3.org/TR/WCAG22/ · https://web.dev/articles/defining-core-web-vitals-thresholds · https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- 에디터: https://github.com/puckeditor/puck · https://github.com/GrapesJS/grapesjs
- 호스팅: https://developers.cloudflare.com/pages/configuration/rollbacks/ · https://vercel.com/docs/instant-rollback · https://developers.cloudflare.com/pages/configuration/custom-domains/
- 경쟁사: https://www.imweb.me/price · https://d.cafe24.com/ · https://support.cafe24.com/hc/ko/articles/7749165125401 · https://homebuilder.cafe24.com/ · https://www.sixshop.com/pricing · https://www.wix.com/website/templates · https://www.wix.com/studio · https://www.wix.com/plans · https://www.framer.com/pricing · https://www.framer.com/ai/
- 법리: https://www.lawtimes.co.kr/news/articleView.html?idxno=182087 · https://www.shinkim.com/kor/media/newsletter/1843 · https://www.kimchang.com/ko/insights/detail.kc?sch_section=4&idx=21357
