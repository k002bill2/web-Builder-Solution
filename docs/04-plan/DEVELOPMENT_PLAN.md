# 개발계획서 — Hermes Design Benchmark Studio (AOS `design-studio`)

- 문서 상태: **초안 v0.3** · 작성 Jarvis · 2026-09-25 KST · v0.3 개정 2026-10-03(M2 3분할 · 실행 순서, REF-LLM 브리프 5절 요청 4)
- 상위: `docs/02-prd/PRD.md` · `docs/03-trd/TRD.md` · 테스트 전략: `docs/05-tdd/TDD.md`
- 이전 판: `docs/_archive/v0.1/DEVELOPMENT_PLAN_v0.1.md`
- 일정은 **추정**이다.
  - 사용자 문서 기준: 4~6명 팀, MVP 6~8주.
  - Hermes 팀 기준: Developer(Orca Claude) 병렬 worktree 3개 + Designer·QA·Security·Newton·Hemingway. **MVP 8~10주**로 추정. 근거는 단일 기능 handoff 1~2일, 섹션 변형 1개 제작·QA 0.5일, AOS 기존 인증·조직·프로젝트 재사용 가정. M0 종료 시 재산정한다.

## 1. 단계 요약

| 단계 | 기간(추정) | 목표 | 종료 게이트 |
|---|---|---|---|
| **M0** 요구사항·계약 확정 | 1주 | 결정 사항, 4대 계약, 태그 체계, 점수 기준, 권리·큐레이션 절차 | 계약 스키마 테스트 green, ADR 기록 |
| **M1** 첫 수직 슬라이스 (사용자 문서 9절) | 2주 | 레퍼런스 20개·필터·3개 비교·DesignProfile 저장·Hero+Footer React 미리보기 | 슬라이스 E2E 통과, QA PASS |
| ~~M2 섹션 킷·생성기~~ → **v0.3에서 M2a·M2b·M2c로 분할** | | | |
| **M2a** 렌더 슬라이스 = VS-1 (즉시) | 약 2주 | 렌더 문서(iframe) + 실렌더 7변형 + 토큰 CSS 최소 + 캔버스 분기·오버레이 + PNG 1장 + 정적 HTML 1개, **브라우저 단독(백엔드 0)** | "A안 → 실제 페이지 → 데스크톱/모바일 → PNG·정적 HTML" E2E PASS · ADR-004 개정 2 예산(앱 100/125 · 렌더 문서 JS 90·CSS 30) |
| **M2b** 킷 확장 | 2~3주 | 나머지 변형 실렌더 · 모션 프리셋(L0~L2, reduced-motion) · 3뷰포트 · 폰트 자체 호스팅 · 3안 실렌더 비교 · (Opus B-7-7 성립 시) React zip | 30/30 실렌더 · 루브릭·시각 회귀 |
| **M2c** 이미지 | 1주 | 토큰 기반 자체 그래픽(결정적 SVG) · 업로드 변환(WebP·srcset) · 산출물 동봉 | F2 시안 등급 |
| **M3** 선택 3모드·편집 | 2주 | 템플릿/조합/추천, 섹션 편집, 3뷰포트, 버전·스냅샷 | 핵심 시나리오 E2E 통과, 접근성 자동 0 위반 |
| **M4** 검증·내보내기 | 1~2주 | 품질 게이트, zip/정적 내보내기, 보안 검토, 운영 문서 | Security 차단 0, zip 빌드 100%, QA 릴리스 게이트 PASS |
| **M5**(P1) 발행 | 1~2주 | 서브도메인 발행·롤백·미리보기 공유 | 발행 p95 ≤2분, 롤백 ≤1분 |

### 1a. 실행 순서 (v0.3, 2026-10-03 — REF-LLM 브리프 D1·D6 · 5절 요청 4)

근거: `docs/06-handoff/REF-LLM-PIPELINE_BRIEF.md` D1~D6 · `docs/00-research/buzz/claude-fable-r2.md` A-3·A-4 · `docs/00-research/buzz/claude-opus-5.5-r2.md` B-1·B-7·D-2 · ADR-004 개정 2 · 2a-05 SPEC r4.8.

1. **M2a = VS-1 렌더 슬라이스 — 즉시.** 편집기 a3-3(테마·이미지)·a4(게이트 표시·내보내기·스냅샷)는 M2a와 겹치는 부분(캔버스·내보내기)이 있어 **M2a 뒤로 미룬다.** 레인 순서:
   - M2a-0 Designer 킷 명세(7변형 · 폴백 표식 · 차단 문구 · PNG 버튼 · 문의 폼 정적 동작) ∥ M2a-1 Developer 렌더 기반(렌더 문서 · 메시지 · 오버레이 · 폴백 이전 · 번들 스크립트) — 쓰기 경로가 달라 병렬
   - M2a-2 Developer 킷 7변형 + 토큰 CSS (선행: M2a-0 명세 · M2a-1 병합)
   - M2a-3 Developer 내보내기(정적 HTML 직렬화 · PNG 캡처 · `UNRENDERED_SECTIONS`) (선행: M2a-2)
   - M2a QA E2E + Designer 시각 QA → push 승인 요청
2. **근거 코퍼스 수집 절차 — M2a와 병행, 사람 작업.** Q11 법무 확인 뒤 시작한다(REF-LLM D2).
3. **LLM 구조 초안 — M2a 이후.** 렌더러 없이는 LLM 결과를 눈으로 검증할 수 없다(REF-LLM D3, 4절 Q5~Q11 확정 필요).
4. **internal 레퍼런스 대량 조립 + 실렌더 썸네일 — M2b 이후**(R2 C-5 결정 2).
5. 편집기 잔여(a3-3 · a4)는 M2a 병합 뒤 실렌더 기준으로 다시 브리프를 쓴다.

## 2. Hermes 팀 업무 분장

사용자 문서 8절의 역할을 실제 Hermes 로스터에 매핑했다.

| 사용자 문서 역할 | Hermes 담당 | 실행 환경 | 이 프로젝트에서의 책임 |
|---|---|---|---|
| Hermes Architect | **Jarvis** (PM) | Hermes | 범위·ADR·계약 초안, handoff 브리프, 산출물 회수·검증, 통합 보고 |
| Hermes Researcher | **Newton** | Hermes | 경쟁사 수치 재검증, 폰트·스톡 라이선스, 호스팅 비용, licensed 레퍼런스 확보 경로, 법무 검토용 사실 정리 |
| Hermes UX Designer | **Designer** | Orca + Claude (`--role designer`) | 태그 체계·무드 정의, 카탈로그·비교 보드·선택·편집 UX(상태 포함), 토큰 값, 섹션 24변형 명세, 레퍼런스 20개 조립, 디자인 QA |
| Hermes Backend | **Developer** 트랙 A | Orca worktree `ds-backend` | `design_studio` 모델·마이그레이션·서비스·API·권한·잡·사용량 원장 연동 |
| Hermes Frontend | **Developer** 트랙 C | Orca worktree `ds-dashboard` | 대시보드 라우트·카탈로그·비교 보드·프로필 편집·미리보기 프레임·게이트 보고 UI |
| Hermes AI Engineer | **Developer** 트랙 B | Orca worktree `ds-kit` | contracts·tokens·composer(결정적)·lint·codegen·renderer·추천 점수. LLM 요약은 P2 선택형 |
| Hermes Infra/Security | **Security** (+ Developer 트랙 B 구현) | Orca + Claude (`--role security`) | 위협 모델(M0), 워커 격리·SSRF·업로드·조직 분리 검토(M2·M4), 릴리스 AppSec |
| Codex | **Codex 독립 리뷰** | AOS `.claude/CLAUDE.md` 절차 | 트랙별 diff 리뷰(`codex-companion review`, 라운드 ≤3) |
| (추가) | **QA** | Orca + Claude (`--role qa`) | 구현과 분리된 E2E·시각 회귀·접근성·성능·릴리스 게이트 판정 |
| (추가) | **Hemingway** | Hermes | 온보딩·필터·비교·게이트 안내 마이크로카피, 추천 근거 문장 템플릿, 운영 문서 편집 |

### 병렬 실행 순서

```
M0  Jarvis(ADR·계약) ─┬─ Designer(태그·무드·UX 흐름) ─┐
                     ├─ Newton(라이선스·경쟁 재검증)   ├─▶ 계약·태그 체계 확정
                     └─ Security(위협 모델)          ─┘

M1~M3  Developer A(backend) ─┐
       Developer B(kit)     ─┼─▶ 계약(JSON Schema) 기준으로 병렬, 주 1회 통합
       Developer C(dashboard)┘
       Designer: 섹션 명세·레퍼런스 조립 → Developer B 구현 → Designer 시각 QA

M4     Security(AppSec) · QA(릴리스 게이트) · Codex(diff 리뷰) → Jarvis 통합 보고
```

운영 규칙:
- 한 handoff = 한 역할 · 한 산출물. `--max-turns`: 조회 10~20, 단일 수정 40~60, 단일 기능 80~120.
- 각 handoff는 `dev/active/design-studio-<task>/PROGRESS.md` 체크포인트 필수.
- 화면은 Designer 설계 → Developer 구현 → QA 검증 순서.
- AOS 저장소 변경은 전용 worktree에서만. 기본 작업트리 변경 금지. Git 원격 쓰기·PR 생성은 영환님 승인 후.
- shared-infra DB에는 신규 스키마만 추가. `docker compose down -v`·볼륨 삭제 금지.

## 3. 작업 분해 (WBS)

### M0 요구사항·계약 확정 (1주)

| # | 작업 | 담당 | 완료 조건 |
|---|---|---|---|
| 0.1 | ADR: AOS 도메인 배치, 노출 방식, 편집 UI(Puck vs 자체), 저장소·호스팅, 베타 업종 5종 | Jarvis + 영환님 | `docs/decisions/ADR-001~005.md` |
| 0.2 | AOS 확인: 마이그레이션 방식, 잡 큐/스케줄러·sandbox_manager 재사용 가능성, 테스트 경로 | Developer (조회 20턴) | TRD 0절 갱신 |
| 0.3 | 태그 체계(업종·타깃·표현·콘셉트/무드·레이아웃·컬러·모션·디바이스·목적) 확정 | Designer | 태그 사전 JSON + 정의 |
| 0.4 | 벤치마크 점수 기준 v1(성능·접근성·반응형·콘텐츠) | Designer + Jarvis | scoring_version=1 문서 |
| 0.5 | 권리·큐레이션 절차서(internal/licensed 등록, 원장 기록, 보관 금지, 중단 조건) | Jarvis | 절차서 + 영환님 승인 |
| 0.6 | 4대 계약 zod 스키마 + JSON Schema 생성 + Pydantic 검증 연결 | Developer B | T-CON 통과 |
| 0.7 | 위협 모델(조직 분리·생성 워커·업로드·미리보기 URL·향후 URL 입력) | Security | 위협 목록 + TRD 보완 |
| 0.8 | 라이선스·경쟁사 재검증 | Newton | 출처 원장 |

### M1 첫 수직 슬라이스 (2주) — 사용자 문서 9절 완료 조건

| # | 작업 | 담당 | 완료 조건 |
|---|---|---|---|
| 1.1 | 모델·마이그레이션: design_reference, benchmark_score, saved_reference, compare_board, design_profile, generated_project | Developer A | 마이그레이션 up/down, T-API-MODEL |
| 1.2 | 카탈로그 API(필터·상세·저장) + 조직 권한 | Developer A | T-API-CAT, T-SEC-ORG |
| 1.3 | 비교 API(2~6개) + 프로필 API(버전) | Developer A | T-API-CMP, T-API-PRF |
| 1.4 | 토큰 파서·Tailwind 테마 생성, Hero·Footer 각 1변형 섹션 | Developer B | T-TOK, T-SEC-RND 일부 |
| 1.5 | 레퍼런스 20개 조립(5업종 × 4, 기존 Hero/Footer + 임시 본문 섹션) | Designer | 20개 PageDoc + 태그 |
| 1.6 | 대시보드: 카탈로그(필터·카드)·비교 보드(3개)·프로필 저장·Hero+Footer 미리보기 | Developer C (Designer 화면 설계 선행) | E2E-S1 |
| 1.7 | 슬라이스 독립 검증 | QA | QA PASS |
| 1.8 | Codex 리뷰(트랙별) | Jarvis 실행 | 지적 반영·라운드 ≤3 |

### M2 섹션 킷·생성기 (2~3주)

| # | 작업 | 담당 | 완료 조건 |
|---|---|---|---|
| 2.1 | 무드 8종 × 밀도 2 토큰 값 | Designer | 토큰 JSON + 대비 표 |
| 2.2 | 섹션 12유형 × 2변형 명세 | Designer | 24 명세 |
| 2.3 | 섹션 구현(3~4변형 배치 handoff) | Developer B | 변형별 T-KIT + 시각 스냅샷 |
| 2.4 | composer(결정적 SectionPlan, seed) + 조합 lint R-01~R-15 | Developer B | T-CMP, T-LNT |
| 2.5 | codegen(React+Tailwind+motion 프로젝트 파일) + 정적 build | Developer B | T-GEN, zip 빌드 테스트 |
| 2.6 | 생성 잡 오케스트레이터(backend↔워커, timeout, 멱등) | Developer A | T-JOB |
| 2.7 | 루브릭·유사도·근거 3개 승인 | Designer | 24/24 |
| 2.8 | 워커 격리 검토 | Security | 차단 이슈 0 |

### M3 선택 3모드·편집 (2주)

| # | 작업 | 담당 | 완료 조건 |
|---|---|---|---|
| 3.1 | 선택 3모드 UX·편집 화면 설계(빈/로딩/오류/경고 상태) | Designer | 화면 설계 + 수용 기준 |
| 3.2 | 추천 점수 API(규칙 기반, 근거) | Developer A+B | T-REC |
| 3.3 | 템플릿 선택·스타일 조합(요소 picks → 프로필) UI | Developer C | E2E-S2, S3 |
| 3.4 | 추천 모드 UI(승인 후 적용) | Developer C | E2E-S4 |
| 3.5 | 섹션 편집·테마 스왑·3뷰포트·자동저장·스냅샷 | Developer C | E2E-S5~S7 |
| 3.6 | 마이크로카피 | Hemingway | 카피 시트 |
| 3.7 | 독립 검증 | QA | QA PASS |

### M4 검증·내보내기 (1~2주)

| # | 작업 | 담당 | 완료 조건 |
|---|---|---|---|
| 4.1 | 품질 게이트(axe·대비·링크·Lighthouse·3뷰포트 스크린샷) | Developer B | T-GATE |
| 4.2 | 내보내기 zip(react/static) + LICENSES.md + 금지 패턴 검사 | Developer B | T-EXP |
| 4.3 | 사용량 원장·감사 로그 연동 | Developer A | T-API-USAGE |
| 4.4 | AppSec 검토(조직 분리·업로드·워커·미리보기 URL·산출물) | Security | 차단 0 |
| 4.5 | 릴리스 게이트 | QA | PASS |
| 4.6 | 운영 문서(큐레이션·장애 대응·게이트 해석) | Hemingway (Jarvis 사실 확인) | 문서 |

### M5 발행 (P1, 1~2주)

서브도메인 발행·상태기계·롤백·미리보기 공유·발행 사이트 보안 헤더. 호스팅 결정(ADR-004) 후 착수.

## 4. 코드 배치 (AOS 저장소 안)

```
Agent-System/
  src/backend/
    api/design_studio/            # routers (references, compare, profiles, projects, jobs, admin)
    services/design_studio/       # catalog, compare, profile, project, generation, recommendation
    db/models/design_studio.py    # SQLAlchemy 모델 (design_studio 스키마)
  src/dashboard/src/
    pages/design-studio/          # CatalogPage, CompareBoardPage, ProfilePage, StudioEditorPage
    components/design-studio/
    stores/designStudio.ts
  packages/design-studio/         # Node/TS 워크스페이스 (경로는 M0에서 확정)
    contracts/ tokens/ composer/ lint/ kit/ codegen/ renderer/ worker/
  tests/backend/design_studio/
  docs/design-studio/             # 이 저장소(web-builder-solution/docs)의 확정본 이관
```

## 5. 품질 게이트 (단계 공통)

1. 머지 전: backend `uv run pytest ../../tests/backend -v`, dashboard `npm test`, 패키지 `pnpm -r test`, 타입체크·lint green.
2. 테스트 선행(TDD 문서 5절 순서).
3. Codex diff 리뷰 통과(라운드 ≤3, 미반영 지적은 PR 본문 기록).
4. 화면 변경: Designer 또는 QA 시각 확인.
5. 보안 경계 변경: Security 검토.
6. 섹션 추가: 루브릭·유사도·근거 3개·라이선스 메타.

## 6. 위험과 대응

| 위험 | 가능성 | 영향 | 대응 | 담당 |
|---|---|---|---|---|
| internal 레퍼런스만으로 벤치마크 가치 부족 | 중 | 높음 | 레퍼런스 품질·비교 근거 강화, licensed 확보 조사 | Designer·Newton |
| AOS 운영 기능과 결합도 상승 | 중 | 중 | 도메인 패키지·라우트·스키마 분리, 공용은 인증·조직·원장만 | Jarvis·Developer |
| Python↔Node 계약 드리프트 | 중 | 중 | JSON Schema 단일 소스 + 양쪽 계약 테스트 | Developer B |
| 생성 워커 보안(코드 생성·빌드) | 중 | 높음 | 격리·egress 차단·의존성 허용 목록·Security 검토 | Security |
| 섹션 품질 부족 | 중 | 높음 | M2에 가장 긴 기간, 루브릭·시각 QA | Designer |
| 1인 Developer 병렬 한계 | 높음 | 중 | worktree 3트랙, 체크포인트, 주 1회 통합 | Jarvis |
| 수집 경로 법적 분쟁 | 낮음~중 | 높음 | 원칙·원장·법무 검토 | Jarvis |

## 7. 착수 전 결정 (M0 차단 요인)

1. AOS 도메인 배치·노출 방식(운영 대시보드 메뉴 vs 별도 앱 셸)
2. 베타 업종 5종(제안: 병·의원 / 음식·카페 / 교육·학원 / 제조·B2B / IT·스타트업)
3. 대시보드 편집 UI(Puck PoC 후 결정)
4. 객체 저장소·호스팅
5. 법무 검토 착수 여부
6. AOS 저장소 전용 worktree 생성 승인

## 8. 변경 이력

| 버전 | 일자 | 내용 |
|---|---|---|
| v0.1 | 2026-09-25 | 독립 빌더 전제 — `_archive/v0.1/` |
| v0.2 | 2026-09-25 | AOS 도메인 전환, 사용자 문서 Phase·첫 티켓·팀 역할 매핑, 3트랙 병렬 |
| v0.3 | 2026-10-03 | M2를 M2a(VS-1)·M2b(킷 확장)·M2c(이미지)로 분할, 1a 실행 순서 신설(M2a 즉시 · 코퍼스 병행 · LLM은 M2a 뒤 · internal 조립은 M2b 뒤 · 편집기 a3-3·a4는 M2a 뒤). 3절 WBS 표 M2 행은 M2b 상세화 때 갱신 |
