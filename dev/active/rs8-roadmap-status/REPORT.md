# RS8-1 REPORT — 제품 로드맵 현황 점검 · 다음 단계 범위 제안 (Developer, 읽기 전용)

- base origin/main `494a7c6f` · 브랜치 `k002bill2/rs8-roadmap-status` · 앱·docs 수정 0 · build·test 미실행 · **preview 미기동**(포트 리슨 확인 대상 없음)
- 근거 수준: L1 = 코드/git 직접 확인 · L2 = REPORT·QA 문서 인용 · L3 = 추정

## 0. 결론 · 권장

1. **M2a·M2b·M2c는 브라우저 단독 범위에서 사실상 끝났다.** 30/30 실렌더·모션·3뷰포트·폰트 자체 호스팅·3안 비교·결정적 SVG·WebP 업로드가 있다. 남은 것은 React zip(=M4로 이관)·srcset(의도적 제외)·B-M2B-05(제목 비율 축)·B-M2B-09(브라우저 매트릭스 QA)뿐이다.
2. **M3는 둘로 갈린다.** 편집(3.5 섹션 편집·테마·3뷰포트·자동저장·스냅샷·실행 취소)은 구현됨. "선택 3모드"는 비교 보드 picks→프로필(3.3)만 있고 **추천 점수·추천 모드(3.2·3.4)는 없다.**
3. **M4는 절반쯤 있다.** 정적 HTML·PNG·8줄 게이트(대비 AA·대체텍스트·헤딩·필수 섹션·모션·SEO·글자 수·성능[측정 전])·내보내기 차단 흐름·정적 HTML 금지 패턴 검사·업로드 3신호 검증·sandbox iframe은 있다. **zip(static/react)·LICENSES.md 동봉·axe·링크 검사·Lighthouse·3뷰포트 스크린샷 게이트·CSP·AppSec 검토 문서·릴리스 게이트 문서·운영 문서는 없다.** 4.3 사용량 원장은 백엔드 0이라 적용 불가.
4. **★권장: 후보 A "M4-a 내보내기 완성 + 릴리스 게이트"** — 정적 zip(이미지 파일 분리·LICENSES.md·금지 패턴 검사 확장)로 B-M2C-01(`HTML_MAX`)까지 같이 풀고, Security AppSec 검토 · QA 릴리스 게이트(B-M2B-09 브라우저 매트릭스 흡수)를 병렬로 붙인다. 이유: ① 내보내기 코드(`exportFlow.ts`·`pngCapture.ts`)가 이미 `/studio` "조작 뒤"(afterAction, 예산 밖) 청크라 진입 증분이 0에 가깝다(추정 L3, 분류는 L1) — 여유 0.47·개정 17 잠금 문제를 피한다. ② TRD 내보내기 `zip(react|static)`(TRD:204) 중 정적 zip을 충족하고, M4 종료 게이트 3개 중 Security 차단 0·QA PASS 2개를 직접 닫는다. **단 PRD FR-PUB-02(React+Tailwind+motion zip이 `npm install && npm run build` 성공, PRD:141)와 게이트 "zip 빌드 100%"는 A로 닫히지 않는다 — React zip은 Q3 결정 대상.** ③ 새 의존성 없이 갈 수 있다(무압축 store zip 자체 작성 — 이미지가 이미 WebP/JPEG/PNG 압축본, 추정 L3).
5. axe 자동 검사·React codegen zip·추천 모드는 각각 새 의존성/엔진 계약/새 화면 설계가 필요해 **A 뒤 또는 별도 결정**으로 둔다(5절 질문).

## 1. 단계별 현황표

출처: 서브에이전트 A(M2·M3, code-explorer 읽기 전용) 조사 + 메인 확인(registry 30키·deps·sandbox·react-zip 주석·afterAction은 메인 grep L1). 수치·QA 판정은 각 REPORT 주장(L2).

### M2a (VS-1 렌더 슬라이스)
| 항목 | 상태 | 근거 |
|---|---|---|
| 렌더 문서 iframe | 구현됨 | `app/src/render/`(RenderApp·protocol) · `app/src/components/studio/StructureCanvas.tsx:268` `sandbox="allow-scripts"` (L1) |
| 실렌더 7변형 → 30 | 구현됨(초과) | `app/src/kit/registry.ts` "30/30" · `dev/active/m2a-2a`·`m2a-2b` |
| 토큰 CSS | 구현됨 | `app/src/kit/tokens.ts` `kitVars`·`kitCssText` · `kit/kit.css` |
| 캔버스 분기·오버레이 | 구현됨 | `StructureCanvas.tsx` · `render/fallback/FallbackCanvas.tsx` · `dev/active/m2a-close2/REPORT.md` |
| PNG 1장 | 구현됨 | `app/src/features/studio/png/pngCapture.ts` · `dev/active/m2a-3c/REPORT.md` (K-AC-12) |
| 정적 HTML | 구현됨 | `app/src/features/studio/staticHtml/*` · `dev/active/m2a-3b` |
| E2E 게이트 | 구현됨(수동) | Ego Lite 수동 판정 + vitest. 자동 E2E 러너 없음(Playwright 금지 규칙 — 설계상 제약) |

### M2b (킷 확장)
| 항목 | 상태 | 근거 / 남은 것 |
|---|---|---|
| 30/30 실렌더 | 구현됨 | `kit/registry.ts` · `dev/active/m2b-6-qa/REPORT.md` "30/30·폴백 0" |
| 모션 L0~L2·reduced-motion | 구현됨 | `kit/motion.css` · `render/sectionMotion.ts` · `dev/active/m2b-4b` |
| 3뷰포트 | 구현됨 | `features/studio/previewFrame.ts:16`(1280·768·390) · m2b-6 기준선 90/90 |
| 폰트 자체 호스팅 | 구현됨 | `app/src/assets/site-fonts/` · `kit/siteFonts.ts` · `dev/active/m2b-4a` |
| 3안 실렌더 비교 | 구현됨 / 잔여 | `features/profile/CompareDialog.tsx` · `dev/active/m2b-5` — typeScale 전달 미구현 = **B-M2B-05** |
| (조건부) React zip | 없음 | deps = react·react-dom·react-router·zod뿐(L1) · `app/src/data/memoryDocBook.ts:174` "react-zip은 M4까지 없음(GENERATOR_UNAVAILABLE)"(L1) |
| 루브릭·시각 회귀 | 부분 | m2b-6 QA 조건부 Go · Safari·Firefox 미검증 = **B-M2B-09** |

### M2c (이미지)
| 항목 | 상태 | 근거 / 남은 것 |
|---|---|---|
| 결정적 SVG | 구현됨 | `kit/art.ts` · `dev/active/m2c-2` |
| 업로드 변환 WebP | 구현됨 | `features/studio/images/ingest/*` · `dev/active/m2c-1`·`m2c-4` |
| srcset | 없음(의도적) | `staticMarkup.ts:4` "srcset 0"(L1) — data URI라 후보가 크기만 키움 |
| 산출물 동봉 | 부분 | 이미지 = data URI 인라인(`staticMarkup.ts:47`, L1) · `HTML_MAX` 8,000,000자 < 보관 30MB = **B-M2C-01** |
| F2 게이트 | 구현됨 | `dev/active/m2c-5b-qa` Go · `m2c-reqa` 조건부 Go |

### WBS 2.x (원 M2 표 — v0.3에서 "M2b 상세화 때 갱신" 예정이던 행)
| # | 상태 | 비고 |
|---|---|---|
| 2.1 무드 8×밀도 2 | 부분 | 밀도 2(`domain/profile.ts`) · 무드 8 구조 없음 — 팔레트·폰트·대비 조합으로 대체(미확인: docs/design 무드 JSON) |
| 2.2 12유형×2 명세 | 구현됨(변형 수 상이) | 12유형 · 유형당 1~6변형 = 30쌍 |
| 2.3 섹션 구현 | 구현됨 | kit/*.tsx + 기준선 90장 |
| 2.4 composer + lint R-01~15 | 부분 | composer `domain/internalCompose*`·seed · lint `domain/lintPlan.ts`+`engine/ops/rules.ts` — R-06·R-14·R-15 미확인 |
| 2.5 codegen zip | 없음 | → M4 4.2 |
| 2.6 생성 잡(백엔드) | 적용 불가 → 변형 | 브라우저 내 `data/memoryGenerate.ts`·`features/profile/useGeneration.ts` |
| 2.7 루브릭 24/24 | 부분 | m2b-6 루브릭 · 정량 24/24 미확인 |
| 2.8 워커 격리 | 변형 | sandbox iframe + 메시지 검증 · Security 승인 기록 미확인 |

### M3 (선택 3모드·편집)
| # | 상태 | 근거 / 남은 것 |
|---|---|---|
| 3.1 3모드 UX 설계 | 부분 | 편집 `docs/design/2a-05/SPEC.md` · 3모드 통합 UX 문서 미확인 |
| 3.2 추천 점수 | **없음** | recommend/score 모듈 0 — API 대신 `domain/` 순수 함수로 변형 필요 |
| 3.3 템플릿·조합(picks→프로필) | 구현됨 | `pages/CompareBoardPage.tsx` · `domain/boardPicks.ts` · `pages/ProfilePage.tsx` · `composeCandidates.ts` |
| 3.4 추천 모드 UI | **없음** | 승인 후 적용 패턴만 `domain/confirmGate.ts`에 존재 |
| 3.5 섹션 편집·테마·3뷰포트·자동저장·스냅샷 | 구현됨 | `useSectionOps.ts`·`ThemeDialog.tsx`·`useAutosaveScheduler.ts`·`SnapshotDialog.tsx` 등 · RS1~RS7 저장 코어 · 잔여 B-ER-09 |
| 3.6 마이크로카피 | 부분 | `dev/active/copy-help` · 카피 시트 산출물 미확인 |
| 3.7 QA | 부분 | er-*-qa·rs6-qa 등 레인별 PASS · M3 단일 판정 문서 없음 |
| 게이트: 접근성 자동 0 위반 | 없음(대체 가드) | axe 없음(L1) · `keyboardA11y.test.tsx`·`contrastAaRegression.test.ts` 대체 |

주의: `dev/active/m3p-*`는 개발계획 M3가 아니라 **M3′(internal 조합 생성기 21개·실렌더 썸네일, `docs/04-plan/M3P_PLAN.md`)** 이다.

## 2. M4 세부 진단

출처: 서브에이전트 B(M4, code-explorer 읽기 전용) + 메인 확인(L1 표시). 브라우저 단독(ADR-001 AOS 비연결 · ADR-007 로컬 IDB) 전제의 적용성 열 포함.

| # | 하위 항목 | 상태 | 적용성 | 근거 / 남은 것 |
|---|---|---|---|---|
| 4.1 | 게이트 8줄 순수 함수 | 구현됨 | 그대로 | `app/src/engine/gate/runGate.ts` · 줄 이름 `features/studio/gateView.ts:11-19`(L1) · 판정 대상 = 문서 모델(렌더 DOM 아님) |
| 4.1 | 대비 AA | 구현됨 | 그대로 | `engine/gate/contrastRow.ts` — 팔레트 쌍 판정, 렌더 픽셀 아님 |
| 4.1 | axe-core | 없음 | 변형 필요 | deps 0(L1). 렌더 DOM 필요 → 렌더 iframe 또는 내보낸 HTML 대상. `render.html` JS 90 예산·`/studio` 자동 로드 125/130 판정과 충돌 → **조작 뒤 별도 청크 필수**(L3) |
| 4.1 | 링크 검사 | 없음 | 축소 | 외부 URL 금지 정책이라 내부 `#앵커`·`tel:`/`mailto:` 형식만 의미(L3) — 순수 함수로 저렴 |
| 4.1 | Lighthouse | 없음(성능 줄 "측정 전") | **적용 불가(앱 내) / CI 전용** | 브라우저 번들 불가. 산출물 HTML을 CI 스크립트로 측정하는 변형만 가능 |
| 4.1 | 3뷰포트 스크린샷 | 없음 | 변형 | PNG 캡처(`pngCapture.ts`) 재사용 가능 · B-M2C-09 ③(캔버스 픽셀 대조)과 같은 수단 |
| 4.1 | 차단 흐름 | 구현됨 | 그대로 | `features/studio/useExportFlow.ts` · `UNRENDERED_SECTIONS` · 서버 `GATE_FAILED`는 없음(클라이언트 차단만) |
| 4.2 | 정적 HTML·PNG | 구현됨 | 그대로 | `staticHtml/*` · `png/pngCapture.ts` · 3MB 초과 안내 "zip 내보내기는 다음 단계에서 지원합니다"(`exportFlow.ts:62`, L1) |
| 4.2 | zip(static) | 없음 | 가능 | 클라이언트 생성. 이미지를 파일로 분리하면 zip 경로의 B-M2C-01 해소 가능 · 단일 파일 정적 HTML 경로는 렌더 iframe이 자리표시자 마크업을 보내고 호스트가 이미지를 주입할 때만 해소(L3 — `render.html` 90 예산 확인 필요) |
| 4.2 | zip(react) codegen | 없음 | 가능하나 대형 | `ExportFormat` 타입만(`data/projectRepository.ts:94`, L1) · codegen 디렉터리 없음 · `npm install && build` 성공 검증(T-GEN-02~05)은 앱 밖 CI 필요 |
| 4.2 | LICENSES.md | 없음(산출물) | 가능 | 저장소 루트 `LICENSES.md`는 있음(`styles/tokens/fonts.css:3`, L1) · 산출물엔 HTML `<head>` 주석 OFL 고지만(`staticHtml/siteFontEmbed.ts`) |
| 4.2 | 금지 패턴 검사 | 부분 | 확장 | `staticMarkup.ts:4`(script 1개 고정·on* 0·blob 0·img data만·CSS 외부 요청 실패, L1) · 외부 href·브랜드 문자열 검사 미확인 · zip 의존성 허용 목록(TR-SEC-06) 없음 |
| 4.3 | 사용량 원장·감사 로그 | 없음 | **적용 불가** | AOS UsageLedger 전제(TRD:45) — ADR-001 비연결. 로컬 `features/studio/editorEvents.ts` 이벤트만(저장 여부 미확인) → 폐기 또는 "로컬 이벤트 로그"로 변형 결정 |
| 4.4 | 업로드 | 구현됨(대부분) | 그대로 | `images/ingest/fileType.ts`(확장자·MIME·매직 3신호, SVG 거부) · `limits.ts`(16384·40MP) · EXIF 제거 여부 미확인 |
| 4.4 | sandbox iframe·postMessage | 구현됨 | 그대로 | `allow-scripts`만(L1) · `event.source` 검증 · 송신 `"*"`(불투명 출처라 불가피 — L3) |
| 4.4 | CSP | 없음 | 추가 가능 | `index.html`·`render.html` meta 없음 · 산출물 CSP meta 없음 |
| 4.4 | 조직 분리·워커·미리보기 URL·SSRF | — | **적용 불가 / M5 이관** | 백엔드·조직·URL 입력 0 |
| 4.4 | AppSec 검토 문서 | 없음 | 필요 | `docs/security/`는 SEC-01(Orca 세션)뿐 |
| 4.5 | 릴리스 게이트 | 없음(M4용) | 필요 | `docs/qa/v2-final`·`post-merge`는 V2 전환 게이트 |
| 4.6 | 운영 문서 | 없음 | 축소 | 큐레이션·장애 대응·게이트 해석 문서 0(grep 일부 실패 — 확도 중) · 장애 대응은 서버 0이라 "브라우저 저장소·복구" 중심으로 변형 |

예산 판정 방식(L1): `app/scripts/check-bundle-size.mjs` — `STUDIO_AFTER_ACTION`(58행~)에 `exportFlow.ts`·`ExportAfter.tsx`·`pngCapture.ts` 포함 = **예산 밖, 크기만 출력**. 새 zip 생성기도 같은 목록에 넣으면 진입 판정 0. 단 내보내기 형식 선택 UI가 진입 청크(StudioLayout 등)에 들어가면 그만큼은 진입 증분(L3, 수십 B 규모 추정).
주의: 서브에이전트 B가 인용한 "/studio 129.62/130"은 ADR-007 시점 값 — 현행은 BRIEF 기준선 **128.66/129.13**(RS7-A 뒤).


## 3. 열린 백로그 분류 (`docs/06-handoff/BACKLOG.md` @ 494a7c6f)

분류: **(a)** 다음 단계에 흡수 · **(b)** 별건 유지 · **(c)** 닫아도 됨(근거). "열림" = 결정/ID 열에 ✅ 닫힘이 없거나 🔶 부분 · ⏳ · ⏸ · 미정인 행. 문서상 열림이지만 실제는 닫힌 행은 (c)로 표시하고 BACKLOG 갱신만 권한다(이 레인은 docs 수정 0).

| ID | 남은 것(요지) | 분류 | 근거 / 흡수 대상 |
|---|---|---|---|
| B-M2B-05 | 3안 `axes.typeScale`을 편집 문서·킷 토큰까지 전달(엔진 계약·저장 검증·내보내기 변경) | **(a)** 후보 B(M2b 잔여) | `typeScale`은 `app/src/domain/composeCandidates.ts`·`app/src/domain/generation.ts`·`app/src/features/profile/CandidateCard.tsx`에만 있음 — `app/src/kit/`·`app/src/engine/` 0건(grep, 사실). 엔진 계약 변경이라 사전 결정 필요 |
| B-M2B-09 | M2B-6 QA 미검증 QB·MF-AC·CMP 다수 + Safari·Firefox | **(a)** 후보 A의 QA 레인(4.5 릴리스 게이트) | 실측 환경 문제(Ego Lite 렌더 정지). 릴리스 게이트에서 브라우저 매트릭스로 한 번에 재검하는 것이 맞음 |
| B-M2C-01 | `HTML_MAX` 8,000,000자 < 이미지 보관 30MB → 큰 문서 정적 HTML 실패 가능 | **(a)** 후보 A(4.2 내보내기) — zip 경로 해소 · 단일 HTML 경로는 호스트 주입 시에만(추정) | `app/src/render/htmlMessage.ts:8` 그대로(사실). BACKLOG 결정 열 자체가 "렌더 쪽 레인 또는 M4 zip" |
| B-M2C-03 | ⏳ QB-10 잃은 이미지 — ADR-007 P1 레인으로 해소 예정 | **(c)** | ADR-007 P1·P2 완료 기록(`ed73cc80` "영속 트랙 마감" · `60092712` P1d) · `data/persistence/idbPersistence.ts` 존재. 새로고침 = 프로젝트 소실 전제가 사라짐. QB-10 재검은 B-M2C-09 ①로 이미 PASS |
| B-M2C-09 | ③ 캔버스 픽셀 대조(교차 출처 iframe 환경 한계)만 남음 | **(a)** 후보 A 4.1 시각 회귀 또는 **(c)** | ①·② 닫힘. ③은 도구 한계 — 3뷰포트 스크린샷 게이트(4.1)를 만들면 같은 수단으로 해소, 안 만들면 "수단 없음"으로 닫음 |
| B-ER-01 | RS-AC-08d IDB 쪽 미단언 | **(b)** 테스트 보강 별건(소) | `docs/design/restart/INTEGRATE-6.md:407` "범위 밖 — BACKLOG B-ER-01 행에서 처리". 단위 테스트 1건 규모 |
| B-ER-08 | 문서상 "FIELD-UNDO-2·FU-BLUR 미병합" · FU-QB-3 한글 IME 수동 1회 | **(c)** + 잔여 1건 (a) | `a4766b5`·`f4b95da`(FIELD-UNDO-2) · `8a9e409`(FU-BLUR) 모두 origin/main 조상(`git merge-base --is-ancestor`, 사실) · `8497c884` "기준선 FU-BLUR 포함". 남은 FU-QB-3 IME 수동 1회는 릴리스 게이트 QA 체크 항목으로 흡수 |
| B-ER-09 | <1280 "스냅샷" 버튼을 더보기로 이동 | **(b)** | `/studio` 진입 변경 → B-RS-06 규칙(착수 때 감량/ADR 개정 결정). 현재 여유 0.47(128.66/129.13). RS8-3(`rs8-ux-polish-spec`) 대상(B-RS-10~13)에는 없음(사실 — 그 BRIEF) |
| B-M3P-03 | GEN-MARK-IMPL "병합 대기" | **(c)** | `67e5e1c8 merge: GEN-MARK-IMPL` origin/main(사실) |
| B-M3P-04 | 썸네일 재요청 — 운영 캐시 정책에서 확인 | **(b)** M5/배포 시 | 호스팅 미정(M5). 배포 전엔 판정 불가 |
| B-GM-03b | `/profile` 출처 목록 라이선스 영문 원값 | **(b)** 또는 후보 B 흡수 | `/profile` 예산 99.53/100(여유 0.47). 한국어 맵 재사용 — 소규모. 후보 B가 `/profile`을 건드리면 같이 |
| B-RS-03 | `PendingStart` 실화면만 남음 → B-RS-16 | **(c)** (B-RS-16으로 이관) | 행 자체가 "남은 것 → B-RS-16"으로 넘김 |
| B-RS-08 | L1 U14-b 검출 테스트 미확보(Low) | **(b)** | RS7-C에서 Low 판정 · 제품 영향 0 |
| B-RS-09 | stale 탭 행 첫 문구 — 잠금 없는 `peek`/reason 필드 필요 | **(b) 병렬 레인 RS8-2 담당** | `rs8-row-reason/dev/active/rs8-row-reason/BRIEF.md` — `view().reason` 최소안 승인·진행 중(사실) |
| B-RS-10 | 폐기 시간 초과 시 alert 2개 | **(b) 병렬 레인 RS8-3 담당** | `rs8-ux-polish-spec` BRIEF 대상 B-RS-10~13(사실) |
| B-RS-11 | 편집기 `role=status` 2개 | **(b) 병렬 레인 RS8-3 담당** | 같은 BRIEF(사실) |
| B-RS-12 | 390 상태 줄·"버리고 새로고침" 화면 밖 | **(b) 병렬 레인 RS8-3 담당** | 같은 BRIEF(사실) |
| B-RS-13 | 폐기 대화상자 390 Tab 2회째 BODY | **(b) 병렬 레인 RS8-3 담당** | 같은 BRIEF — 표준 동작 판정 포함(사실). 이 레인은 판정하지 않음 |
| B-RS-14 | `/compare` 조작 뒤 `memoryProfileAdjust` +0.66 · 판정 밖 | **(c)** | 판정 밖 지표 · 의도된 상쇄 대가(M2d). 기록 유지로 충분 |
| B-RS-16 | `PendingStart` 실화면 미관측 — 주입 없이 경로 없음(추정) | **(c)** 또는 (b) | 단위 대체 `ProjectsRowPriority.test.tsx`(RS7-M1)로 가드됨. 실화면 생성 수단이 없으면 "단위 가드로 수용" 닫기 권장 |
| B-RS-19 | ① 미리보기 잠금 passive effect 창 ② 미재현 flaky 후보 2 | **(b)** | ① 이론상 창·미재현 ② 미재현. 재발 시 재개 |
| B-QA-01 | QA 턴 예산·Ego 캡처 요령 | **(c)** (운영 메모) | 브리프 작성 지침 — 작업 항목 아님. 4.6 운영 문서로 옮기면 (a) |

닫힌 행(✅ 표기 · 이 분류 대상 아님): D-QA01, B-DET-01·02, B-DOC-01, B-M2B-01~04·06~08, B-M2C-02·04~08, B-TEST-01, B-ER-02~07·10·11, B-M3P-01·02·05~08, B-GM-01~03, B-RS-01·02·04~07·15·17·18. 취소: B-DET-03, B-QA-01(구, 취소된 px 측정 — 같은 ID가 2번 쓰임: `docs/06-handoff/BACKLOG.md:11` 취소 · `:43` 운영 메모).

요약: (a) 흡수 4(B-M2B-05→B · B-M2B-09·B-M2C-01·B-M2C-09③→A) + 잔여 1(FU-QB-3→A QA) · (b) 별건 11 · (c) 닫아도 됨 7(B-M2C-03·B-ER-08 본체·B-M3P-03·B-RS-03·B-RS-14·B-RS-16·B-QA-01(운영)) · 이 중 B-RS-09~13 5건은 RS8-2·RS8-3 병렬 레인 담당이라 후보에서 제외.

## 4. 다음 단계 후보 비교

예산 기준선(ADR-004 개정 17): `/studio` 128.66/129.13 · 복원 131.64/132.11 · `/projects` 99.09 · `/profile` 99.53 · `/catalog` 100.06/101 · `/compare` 98.96/100. **개정 17 결정 5**: 그 몫은 RS6 전용 · 남은 몫은 기준선 실측값으로 잠금(Jarvis·영환님 결정) → M4-a는 RS6와 다른 기능이라 문면상 `/studio` 진입 증분은 0.47 여유가 있어도 **새 개정 필요**(해석 · B-RS-06 "착수 조건"). 선례: RS8-2 BRIEF는 `/studio` ≤ +0.05를 "개정 17 상한 안"으로 발주(저장 코어 = RS6 계열로 본 것). RS8-2가 병합되면 `/studio` 여유는 최대 0.42로 줄어든다(추정).

| | **★A. M4-a 내보내기 완성 + 릴리스 게이트** | B. M2b 잔여 마감 | C. M3 추천 모드 |
|---|---|---|---|
| 목적 | 출시 가능한 산출물(zip) · M4 종료 게이트(Security 0·QA PASS) | 3안 비교 축 정합 · 남은 QA | 선택 3모드 완성(PRD 3모드) |
| 범위 | ① 정적 zip(`index.html` + `images/*` + `fonts/*` + `LICENSES.md`) — 이미지 파일 분리로 B-M2C-01 해소 ② 금지 패턴 검사 확장(외부 href·브랜드 문자열·zip 파일 목록 허용표) ③ 게이트 +링크 검사(내부 앵커) ④ 산출물 CSP meta(검토) ⑤ Security AppSec 검토 문서(4.4 브라우저 범위) ⑥ QA 릴리스 게이트(4.5) — B-M2B-09 브라우저 매트릭스·FU-QB-3 IME·B-M2C-09 ③ 흡수 | B-M2B-05 typeScale 편집 문서·킷 토큰·내보내기까지 · B-GM-03b `/profile` 라이선스 한국어 · B-ER-01 RS-AC-08d 단언 | 3.2 규칙 기반 점수(`domain/` 순수 함수·근거 문장) · 3.4 추천 모드 UI(승인 후 적용) · 3.1 3모드 UX 설계 · 3.6 카피 |
| 제외 | React codegen zip · axe · Lighthouse · 4.3 원장 · M5 | 새 무드 체계(2.1) · lint R-06·14·15 | LLM 요약(P2) · 백엔드 추천 API |
| 레인 | Designer(내보내기 대화상자·zip 구성·LICENSES 문안) ∥ Developer CP0 스파이크(store zip·이미지 분리 실측) → Developer 구현 → Security ∥ QA(병렬) → Hemingway 4.6 축소판 | Designer(축 노출 규칙) → Developer 1 · Developer(소 2건) 병렬 | Designer SPEC(3모드·추천 근거) → Developer 2레인(점수 순수 함수 ∥ UI) → QA |
| 예산 영향 | `/studio` 진입 ≈ 0~+0.05(형식 선택 UI만 — L3) · zip 생성기는 afterAction(판정 밖) · 다른 라우트 0 | `/studio` 진입 가능(토큰 전달 — L3, 미측정) · `/profile` 99.53 여유 0.47 안 소폭 | `/profile`(99.53) 또는 `/catalog`(100.06/101) 첫 화면 — 여유 0.47·0.94 · 새 화면 → 지연 청크 필수 |
| 사전 결정 | Q1(개정)·Q2(의존성)·Q3(zip 범위)·Q6(원장) | Q4(엔진 계약) | Q5(추천 범위)·Q1 |
| 추정 규모 | 1~1.5주(스파이크 0.5일 · 구현 2~3일 · Security·QA 2~3일 병렬) — L3 | 3~5일 — L3 | 1.5~2주(SPEC 2~3일 포함) — L3 |
| 위험 | 렌더 메시지 구조 변경이 필요하면 `render.html` 90 예산 확인 필요 | 엔진 계약·저장 검증·내보내기 동시 변경 | 3모드 정보 구조가 미정 — 설계 선행 필수 |

★A 이유: 진입 예산 영향이 가장 작고(afterAction), M4 종료 게이트 3개 중 2개(Security·QA)를 직접 닫으며(남는 1개 = "zip 빌드 100%" = React zip, Q3), 열린 백로그 (a) 4건 중 3건(B-M2C-01·B-M2B-09·B-M2C-09③)을 흡수한다. React zip은 T-GEN의 `npm install && build` 검증이 앱 밖 CI를 요구해 범위가 커서 A에서 뺀다(Q3).

## 5. 사전 결정 질문 (Jarvis → 영환님)

1. **예산 개정**: 다음 단계가 `/studio` 진입을 조금이라도 늘리면 개정 17 결정 5(남은 몫 잠금)에 따라 새 ADR-004 개정이 필요하다. A의 형식 선택 UI 몫(예: ≤ +0.05)을 개정 18로 선승인할지, "진입 증분 0" 조건으로 착수할지? (문면 해석 — RS8-2는 개정 17 안으로 발주됨 · RS8-2 병합 뒤 여유 ≤ 0.42 추정)
2. **zip 의존성**: 무압축(store) zip 자체 작성(의존성 0, ★추천 — 이미지·폰트가 이미 압축본) vs `fflate` 추가(조작 뒤 청크) 중 무엇?
3. **zip 범위**: A는 정적 zip만 — React codegen zip(FR-PUB-02, `npm install && build` 성공 검증)을 M4-b로 미룰지, 아예 P1로 내릴지? (개발계획 M2b 행 조건 "Opus B-7-7 성립 시" — 성립 여부 기록 미확인)
4. **엔진 계약 변경(B-M2B-05)**: typeScale을 편집 문서·킷 토큰·내보내기까지 전달하는 계약 변경을 승인할지(B 착수 조건)?
5. **추천 모드(C) 범위**: 규칙 기반 점수 + 근거 + 승인 후 적용으로 브라우저 내 순수 함수 구현 — 이번 MVP 범위에 넣을지, M4 뒤로 둘지?
6. **4.3 사용량 원장**: 백엔드 0 전제에서 폐기(★추천) vs 로컬 이벤트 로그로 변형?
7. **axe 자동 검사**: M3 게이트 "접근성 자동 0 위반"을 axe(새 의존성 수백 KB, 조작 뒤 청크)로 채울지, 현 단위 가드(대비·키보드)로 수용할지? Lighthouse는 CI 전용으로 둘지?
8. **BACKLOG 정리**: 3절 (c) 7건을 닫는 BACKLOG 갱신을 Jarvis가 할지(이 레인은 docs 수정 금지)?

## 6. 사실 / 추정 / 미확인

**사실(L1, 메인 직접 확인)**
- deps = react·react-dom·react-router·zod (`app/package.json`) — axe·zip·lighthouse·playwright 0
- 렌더·내보내기 iframe `sandbox="allow-scripts"` (`StructureCanvas.tsx:268` · `staticHtml.ts:3`)
- react-zip 미구현 명시 (`memoryDocBook.ts:174`) · 형식 타입만 (`projectRepository.ts:94`)
- 게이트 8줄 이름 (`gateView.ts:11-19`) · `HTML_MAX = 8_000_000` (`render/htmlMessage.ts:8`) · 이미지 data URI만 (`staticMarkup.ts:47`)
- `exportFlow.ts`·`pngCapture.ts` = `STUDIO_AFTER_ACTION` (`check-bundle-size.mjs:58-66`)
- FIELD-UNDO-2(`a4766b5`·`f4b95da`)·FU-BLUR(`8a9e409`)·GEN-MARK-IMPL(`67e5e1c8`) origin/main 병합
- ADR-004 개정 17 결정 5 (`ADR-004-performance-budgets.md` 277행~) · 개정 18 없음
- 병렬 레인 범위: RS8-2 = B-RS-09 · RS8-3 = B-RS-10~13 (각 BRIEF)

**추정(L3)**
- A의 `/studio` 진입 증분 0~+0.05 · store zip 자체 작성 수십~백여 줄 · 이미지 파일 분리로 B-M2C-01 해소(렌더 메시지 구조 변경 범위 미측정)
- 규모(주·일) 전부
- postMessage `"*"` 송신이 불투명 출처라 불가피

**미확인**
- 무드 8종 토큰 JSON · lint R-06·R-14·R-15 · 3모드 UX 통합 문서 · Security 승인 기록 · 카피 시트
- EXIF 제거 · `editorEvents` 저장 여부 · 정적 HTML 외부 href 전면 차단 · 브랜드 문자열 산출물 검사
- "Opus B-7-7" 성립 여부 (`claude-opus-5.5-r2.md` grep 0건)
- REPORT 인용 수치 재측정(이 레인은 build·test 미실행)

## 7. 레인 운영 기록
- 서브에이전트 A(M2·M3 현황, code-explorer 읽기 전용): 완료 · 결과 1절 반영 · 주요 주장 메인 grep 재확인
- 서브에이전트 B(M4 진단, code-explorer 읽기 전용): 완료 · 결과 2절 반영 · 오래된 예산 수치(129.62) 정정
- 백로그 분류(3절)는 메인 직접 — BACKLOG를 이미 메인이 전부 읽어 재적재 비용만 생기므로(위임 상한). BRIEF 권장 3분할과 다름
- preview 미기동 · 앱·docs 수정 0
