# 개발계획서 — (가칭) 패턴 빌더

- 문서 상태: **초안 v0.1** · 작성 Jarvis · 2026-09-25 KST
- 상위: `docs/02-prd/PRD.md` · `docs/03-trd/TRD.md` · 테스트 전략: `docs/05-tdd/TDD.md`
- 일정은 **추정**이다. 근거: 1인 Developer(Orca Claude) 기준 단일 기능 handoff 1~2일, 섹션 변형 1개 제작·QA 0.5일. 실제 속도는 M0 종료 시 재산정한다.

## 1. 단계 요약

| 단계 | 기간(추정) | 목표 | 종료 게이트 |
|---|---|---|---|
| M0 기반 | 1주 | 저장소·CI·계약·토큰 골격, 결정 사항 확정 | CI green, 계약→zod→Puck 변환 PoC 통과 |
| M1 조립 엔진 | 2주 | 토큰·계약·조립기·구조 lint (UI 없음) | 조합 규칙 R-01~R-13 테스트 100% 통과, 결정성 속성 테스트 통과, Security 위협 모델 검토 |
| M2 섹션 라이브러리 v0 | 3주 (M1과 1주 겹침) | 12유형 × 2변형 = 24, 테마 8종 | 루브릭·유사도·시각 회귀 통과 24/24 |
| M3 빌더 앱 | 2주 | 시작→무드→3안→편집→lint UI | E2E 핵심 흐름 통과, 접근성 자동 검사 0 위반 |
| M4 발행 | 2주 | 렌더→게이트→배포→롤백, 폼, 서브도메인 | 발행 p95 ≤2분, 롤백 ≤1분, 보안 헤더 검사 통과 |
| M5 베타 | 2주 | 관리자·계측·운영, 사용자 5~10명 베타 | QA 릴리스 게이트 PASS, 성공 지표 계측 동작 |
| GA 트랙 | 베타 후 | 업종 10·목적 6·무드 8·16유형, 커스텀 도메인, 요금, LLM 플래그 | 별도 계획 |

총 베타까지 **약 11~12주(추정)**.

## 2. Hermes 팀 업무 분장

| 역할 | 실행 환경 | 담당 | 주요 산출물 |
|---|---|---|---|
| **Jarvis** (PM) | Hermes | 범위·결정 관리, handoff 브리프 작성, 산출물 회수·검증, 통합 보고 | 브리프(`.hermes/plans/`), 상태 보고 |
| **Newton** (리서치) | Hermes | 경쟁사 수치 재검증(아임웹 FAQ 2건 등), 폰트·스톡 라이선스 조사, 호스팅 비용·국내 레이턴시 비교, 법무 검토용 사실 정리 | 출처 원장(grounded-citations) |
| **Designer** | Orca + Claude Code (`--role designer`) | 무드 8종 정의, 토큰 값, 섹션 24변형 디자인·a11y 명세, 빌더 앱 UX·상태 설계, 섹션 루브릭 평가, 디자인 QA | 토큰 JSON, 섹션 명세, 빌더 화면 설계, 시각 QA 보고 |
| **Developer** | Orca + Claude Code (`--role developer`) | 모노레포·CI, 계약·토큰·조립기·lint·렌더러, 빌더 앱, 발행 파이프라인, 폼 | 코드 + 테스트(TDD 순서 준수) |
| **Security** | Orca + Claude Code (`--role security`) | 위협 모델(M1), 멀티테넌시·업로드·폼·CSP 검토(M4), 릴리스 전 AppSec 검토 | 위협 모델, 취약점·조치 보고 |
| **QA** | Orca + Claude Code (`--role qa`) | 구현과 분리된 독립 검증: E2E·시각 회귀·접근성·성능·릴리스 게이트 | QA 판정 보고(재현 절차 포함) |
| **Hemingway** | Hermes | 온보딩·에러·lint 안내 문구, 무드 카드 설명, 베타 안내문, 약관·개인정보처리방침 초안 편집(법무 검토 전) | 마이크로카피 시트, 안내문 |

원칙:
- 한 handoff = 한 역할 · 한 산출물. Developer 턴 예산: 단일 기능 80~120, 단일 수정 40~60.
- 화면 작업은 Designer가 구조·상태·수용 기준을 먼저 만든 뒤 Developer가 구현한다.
- Developer 자체 테스트 통과는 독립 검증을 대체하지 않는다. 사용자 흐름 영향 변경은 QA 필수.
- 외부 발송·배포·Git 원격 쓰기·권한 변경은 영환님 승인 후.

## 3. 작업 분해 (WBS)

### M0 기반 (1주)

| # | 작업 | 담당 | 선행 | 완료 조건 |
|---|---|---|---|---|
| 0.1 | 결정 사항 확정: 베타 업종·목적·무드, 호스팅, 인증 방식 | 영환님 + Jarvis | — | 결정 기록 `docs/decisions/ADR-000x.md` |
| 0.2 | Git 저장소 초기화, pnpm·Turborepo, TS strict, ESLint(토큰 하드코딩 금지 규칙 포함), Vitest, Playwright, CI | Developer | 0.1 일부 | `pnpm ci` green |
| 0.3 | `packages/contracts`: 계약 zod 스키마 + provenance 금지 필드 테스트 | Developer | 0.2 | TDD T-CON 통과 |
| 0.4 | 계약 → Puck config 변환 PoC (hero 1변형) | Developer | 0.3 | Puck에서 hero 편집·저장 |
| 0.5 | 경쟁사 수치·라이선스·호스팅 비용 재검증 | Newton | — | 출처 원장 |
| 0.6 | 로컬 DB `pattern_builder` 생성(shared-infra, 기존 DB·볼륨 불변) | Developer | 0.2 | 마이그레이션 적용 |

### M1 조립 엔진 (2주)

| # | 작업 | 담당 | 선행 | 완료 조건 |
|---|---|---|---|---|
| 1.1 | 무드 4종·밀도 2단 토큰 값 정의(DTCG) | Designer | 0.1 | 토큰 JSON + 대비 표 |
| 1.2 | `packages/tokens`: DTCG 파서·참조 해석·순환 검출·CSS 변수 생성 | Developer | 1.1 | T-TOK 통과 |
| 1.3 | 대표색 → 역할 팔레트 변환·AA 보정 | Developer | 1.2 | T-TOK-05~07 통과 |
| 1.4 | `packages/composer`: seed PRNG, 프리셋 적용, 3안 생성, 생성 로그 | Developer | 0.3 | T-CMP 통과 |
| 1.5 | `packages/lint` 구조 규칙 R-01~R-13 | Developer | 0.3 | T-LNT 통과 |
| 1.6 | support_matrix·업종 프리셋 데이터(베타 5업종) | Designer → Developer | 1.1 | 프리셋 5개 |
| 1.7 | 위협 모델 검토(멀티테넌시·업로드·폼·발행·조사 원장) | Security | 0.3 | 위협 목록 + TRD 보완 제안 |

### M2 섹션 라이브러리 v0 (3주, M1 2주차부터)

| # | 작업 | 담당 | 선행 | 완료 조건 |
|---|---|---|---|---|
| 2.1 | 수동 큐레이션 운영 절차서(관찰 범위·보관 금지·중단 조건·원장 기록) | Jarvis + Designer | — | 절차서 승인 |
| 2.2 | 섹션 12유형 × 2변형 명세(슬롯·제약·a11y·모바일 동작) | Designer | 1.1 | 24개 명세 |
| 2.3 | 섹션 구현(renderer 컴포넌트) — 3~4변형씩 배치 handoff | Developer | 2.2 | 변형별 T-RND·시각 스냅샷 |
| 2.4 | 루브릭 5영역 평가·유사도 검사·근거 3개 확인 | Designer | 2.3 | 24/24 승인 |
| 2.5 | 시각 회귀 기준 스냅샷(3뷰포트 × 4무드) | QA | 2.3 | 기준 이미지 커밋 |

### M3 빌더 앱 (2주)

| # | 작업 | 담당 | 선행 | 완료 조건 |
|---|---|---|---|---|
| 3.1 | 빌더 UX 설계: 시작·무드·3안·편집·lint 화면, 상태(빈/로딩/오류/경고) | Designer | 1.4 | 화면 설계 + 수용 기준 |
| 3.2 | 마이크로카피(온보딩·오류·lint 안내) | Hemingway | 3.1 | 카피 시트 |
| 3.3 | 인증·테넌트·사이트·스냅샷 API + RLS | Developer | 0.6 | T-API·T-SEC-01 통과 |
| 3.4 | 시작→무드→3안 UI | Developer | 3.1, 3.3 | E2E-01~03 |
| 3.5 | Puck 편집 + 테마 스왑 + 슬라이더 + 3뷰포트 미리보기 + 자동저장 | Developer | 3.4 | E2E-04~07 |
| 3.6 | 독립 QA: 핵심 흐름·접근성·회귀 | QA | 3.5 | QA PASS |

### M4 발행 (2주)

| # | 작업 | 담당 | 선행 | 완료 조건 |
|---|---|---|---|---|
| 4.1 | 렌더러 정적 빌드·성능 예산·SEO 산출물 | Developer | 2.3 | T-RND 통과 |
| 4.2 | 렌더 lint: axe-core·대비·링크·Lighthouse CI | Developer | 4.1 | T-GATE 통과 |
| 4.3 | 발행 워커·상태기계·멱등·호스팅 어댑터(Cloudflare Pages) | Developer | 4.1, 0.1 | T-PUB 통과 |
| 4.4 | 롤백·미리보기 URL(noindex·토큰) | Developer | 4.3 | E2E-09~10 |
| 4.5 | 문의 폼 엔드포인트(동의·rate limit·honeypot·암호화·보존기간) | Developer | 3.3 | T-FORM 통과 |
| 4.6 | 업로드 파이프라인(허용목록·EXIF·변환본 분리) | Developer | 3.3 | T-SEC-04 통과 |
| 4.7 | AppSec 검토(RLS·업로드·폼·CSP·토큰 보관) | Security | 4.3~4.6 | 차단 이슈 0 |

### M5 베타 (2주)

| # | 작업 | 담당 | 선행 | 완료 조건 |
|---|---|---|---|---|
| 5.1 | 관리자: 섹션 승인·회수·영향 사이트, 조합 매트릭스 | Developer (Designer 설계) | M3 | E2E-ADM |
| 5.2 | 계측 이벤트·대시보드·경보 | Developer | M4 | 이벤트 수신 확인 |
| 5.3 | 약관·개인정보처리방침·베타 안내(법무 검토 전 초안) | Hemingway | — | 초안 |
| 5.4 | 릴리스 게이트 전체 검증 | QA | 5.1~5.2 | PASS |
| 5.5 | 베타 사용자 5~10명 온보딩(외부 발송은 승인 후) | 영환님 + Jarvis | 5.4 | 피드백 수집 |

## 4. 저장소 구조 (제안)

```
web-builder-solution/
  apps/
    builder/            # Next.js 빌더 앱 (Puck)
    api/                # API 서비스
    publisher/          # 발행 워커
    form-endpoint/      # 서버리스 폼 수신
  packages/
    contracts/          # 섹션 계약 zod + JSON Schema + Puck 어댑터
    tokens/             # DTCG 파서·팔레트 변환·CSS 변수
    composer/           # 결정적 조립기
    lint/               # 구조·렌더 규칙
    renderer/           # 정적 렌더러 + 섹션 컴포넌트
    sections/           # 섹션 계약 데이터·프리셋·support_matrix
  docs/                 # 00-research … 05-tdd, decisions/
  dev/active/<task>/PROGRESS.md   # handoff 체크포인트
```

## 5. 품질 게이트 (단계 공통)

1. 머지 전: `pnpm typecheck && pnpm lint && pnpm test` green, 새 코드에 테스트 선행(TDD 문서).
2. 화면 변경: 시각 회귀 스냅샷 승인(Designer 또는 QA).
3. 사용자 흐름 변경: QA 독립 검증 PASS.
4. 보안 경계 변경(RLS·업로드·폼·발행·비밀): Security 검토.
5. 섹션 추가: 루브릭·유사도·근거 3개·라이선스 메타.

## 6. 위험과 대응

| 위험 | 가능성 | 영향 | 대응 | 담당 |
|---|---|---|---|---|
| 섹션 품질 부족("템플릿 티") | 중 | 높음 | M2에 가장 긴 기간 배정, 루브릭·시각 QA | Designer |
| Puck API 변경 | 중 | 중 | 계약→config 어댑터로 격리 | Developer |
| 수집 경로 법적 분쟁 | 낮음~중 | 높음 | 수동 큐레이션 절차·원장·법무 검토 | Jarvis |
| 성능 예산 초과(모션·이미지) | 중 | 중 | 렌더 게이트, 섹션별 JS 예산 | Developer |
| 1인 Developer 병목 | 높음 | 중 | 섹션 구현을 3~4변형 배치로 분할, 체크포인트 | Jarvis |
| 경쟁사 AI 빌더와 차별 약화 | 중 | 중 | 결정성·국내 규칙·게이트 메시지, 베타 지표로 검증 | Jarvis |

## 7. 착수 전 결정 (M0 차단 요인)

1. 베타 업종 5·목적 3·무드 4 확정
2. 호스팅 사업자(추천 Cloudflare Pages)
3. 인증 방식(추천 이메일 매직링크 + 소셜)
4. 법무 검토 착수 여부
5. 저장소 Git 초기화·원격 생성 여부(원격 쓰기는 승인 필요)

## 8. 변경 이력

| 버전 | 일자 | 내용 |
|---|---|---|
| v0.1 | 2026-09-25 | 초안 |
