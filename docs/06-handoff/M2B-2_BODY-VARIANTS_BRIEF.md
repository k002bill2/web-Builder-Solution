# M2B-2 — 본문 12변형 실렌더 구현 브리프

**Goal:** 기존 실렌더 18/30에서 본문 12변형을 추가해 30/30으로 만든다. 이번 브리프 작성은 기동·원격 반영 승인이 아니다.
**Architecture:** 엔진 슬롯 계약을 보존하고 렌더 문서의 기존 킷·공유 마크업을 확장한다. 부모 앱은 킷을 import하지 않는다. 공유 registry·CSS·렌더 목록 때문에 구현은 순차다.
**Tech Stack:** 저장소 고정 React·TypeScript·Vite·Vitest. 새 의존성 없음.
**책임 역할:** Developer / **실행 환경:** Orca managed worktree + Claude Code(`hermes-claude-orca --role developer`, Opus·medium). 최종 보고 Jarvis.

## 0. 실행 경계·입력
- 저장소 `/Users/younghwankang/Work/web-builder-solution`(AOS와 독립). 브리프 작성 기준 main `470cb2f`.
- 정본 `docs/design/m2b/SPEC-BODY.md` **전체**: 0절, B1-1~12, KD-AC-01~21, QB-1~15, 4절, 끝 MQ 결정 기록. m2a `docs/design/m2a/SPEC.md` 공통 규약·K1-3~6·K2 A안, `docs/design/2a-05/SPEC.md` r4.12, ADR-004 개정 4를 상속한다.
- `docs/design/m2b/body/mock-body.html`은 구조·위계 기준. px·팔레트 복사 금지. SPEC이 우선이고 차이는 REPORT 4절에.
- `docs/04-plan/M2B_PLAN.md`, `CLAUDE.md`, `docs/06-handoff/BACKLOG.md` 필독.
- 각 기동 전 Jarvis는 Orca·Claude 인증 상태와 worker 중복 여부를 확인한다. 별도 worktree를 현재 **로컬 main**에서 만들고 HEAD·브리프 존재·dirty 상태를 확인한다. 원격 기준 worktree면 깨끗한 상태에서 `git merge --ff-only main` 후 전달한다.
- 각 레인 시작 SHA를 PROGRESS·REPORT에 기록한다. 의존성 설치 필요 시 worktree의 `app/`에서 `npm ci`만(잠금파일 변경 금지). baseline build·표적 테스트부터 확인한다.
- 프로젝트 동시 worker 최대 2. **서브에이전트 분할: 불필요/금지(429 이력)**. ultracode·Orca orchestration 금지.
- 이번 문서는 계획이다. Developer·Designer·QA 실제 기동은 별도 요청 후 백그라운드 notify로 한다.

## 1. 레인 구성과 의존성
| 레인 | 담당·목적 | worktree / 기록 | 선행 | 실행·턴 |
|---|---|---|---|---|
| M2B-2R | Developer, 이관된 M2B-1b Codex 검토 종결 | `m2b-2r` / `dev/active/m2b-2r/` | 이 브리프 main 반영 | Orca Claude, 40턴·30턴부터 REPORT |
| M2B-2a | Developer, 소개·서비스 4변형 | `m2b-2a` / `dev/active/m2b-2a/` | 2R 회수·차단 이슈 종결 | Orca Claude, 100턴·80턴부터 REPORT |
| M2B-2b | Developer, 갤러리·통계 4변형 | `m2b-2b` / `dev/active/m2b-2b/` | 2a 검증·main 병합 | 동일 |
| M2B-2c | Developer, 후기·가격·예약·CTA 4변형 | `m2b-2c` / `dev/active/m2b-2c/` | 2b 검증·main 병합 | 동일 |

- 순차 이유: `app/src/kit/registry.ts`, `kit.css`, `features/studio/renderedVariants.ts`, `render/PageDocument.test.tsx` 쓰기 겹침. 갤러리 3개는 같은 컴포넌트로 묶는다.
- 실렌더 목표: 2a 후 22/30 → 2b 후 26/30 → 2c 후 30/30(각 단계 정확 키 목록으로 증명).
- Designer 신규 설계 생략 사유: M2B-0B Designer 확정 명세·MQ 승인 완료. 구현 뒤 독립 시각 대조·QA는 M2B-6에서 필수. 이 단계는 배포가 아니다.
- M2B-3 모션·폰트 명세와는 독립 병렬 가능하나 이번 요청에는 미포함. 폰트 취득 방식은 별도 승인 전 보류.

## 2. M2B-2R — 이전 검토 먼저, 새 본문 구현 0
### R0. 수신·검토 범위 고정
- 읽기: `dev/active/m2b-1b/REPORT.md` 4·6·7·9절, PROGRESS, `logs/codex.txt`(시작 로그만 — 완료 증거 아님).
- M2B-1b 구현 범위 `5970721..62fa708`, 회수 마감 `0fb0730`, 병합 main `470cb2f`. base는 **5970721** 고정.
- PROGRESS·REPORT 골격을 먼저 작성한다. 새 변형 구현 금지.
### R1. Codex 검토 1회
- Orca 관리 레인의 Codex 도구로 `review --scope branch --base 5970721` 실행. CODEX_HOME은 Orca 범위, 부모 HOME 대체 금지. 결과 `logs/codex.txt`에 보존.
- 검토에는 header/footer 6변형·공유 부분·정적 메뉴 스크립트 불변·RENDERED_VARIANTS 파생·기존 단언 이관을 포함한다. 현재 HEAD가 문서 마감까지 포함하므로 구현 범위를 REPORT에 따로 표시한다.
- 요청 쟁점: REPORT 4절의 `sticky-two-tier` nav 빈 값+utility 있음(390 보조 줄 위/아래) 명세 차이가 사용성·접근성에 미치는 영향. 판정 스크립트 2결함의 수정이 단언 약화 없이 실제 `:focus-visible`을 측정하는지.
- 승인 창 만료·인증·도구 실패면 상태와 실패 근거만 보고하고 중단. 우회 실행·부모 셸 fallback 금지. 이전 승인을 새 명령 승인으로 간주하지 않는다.
### R2. 회수
- P1은 자동 구현하지 말고 재현·파일·원인·최소 수정안으로 반환한다(단일 수정 레인 분리). P2도 누락 없이 기록한다. P1 또는 수용 기준 위반 미해결이면 2a 기동 차단.
- 완료 기준: 실제 검토 결과·검토 HEAD/base·P1/P2 목록·판정·로그·REPORT, 서버 기동 0. 단순 exit 0이나 “review started”는 완료 아님.

## 3. 공통 단계 — 2a·2b·2c 각각
### P0. baseline·기록
- `dev/active/<레인>/PROGRESS.md`, `REPORT.md`, `gate.sh` 작성·로컬 커밋. REPORT 절: 1 커밋표, 2 KD-AC, 3 번들, 4 공유·명세 차이, 5 QB, 6 Codex, 7 남은 위험, 8 서버.
- app cwd에서 `npm run typecheck`, `npm run lint`, `npm run build`, `npx vitest run` baseline. 실패는 기존/새 실패를 구별하고 기록; 실패 baseline을 새 코드 탓으로 고치지 않는다.
### P1. 예산 시제품
- 2a `services/cards-masonry`, 2b 공유 갤러리 `portfolio/masonry`, 2c `contact/booking`을 시제품으로 실측한다. 시제품 diff·baseline/final bundle을 남기고, RED 단계 전에 최종 구현으로 착각하지 않게 분리한다.
- 해당 레인 및 남은 본문 전체 예상치를 공유분/비공유분 근거와 함께 계산한다. 렌더 JS 예상 >89.70, CSS >30, `/studio` 증가 >0.03KB, 다른 화면 ±0.03KB 밖이면 **구현 전에 정지**. 예산 상향·단언 수정으로 통과시키지 않는다.
### P2~. 변형별 TDD·커밋
1. 해당 KD-AC [U]/[G] 실패 테스트 작성.
2. `npx vitest run src/kit/<해당파일>.test.tsx`로 의도한 RED와 실패 원인 확인, `logs/<항목>-red.txt` 보존.
3. 기존 킷을 최소 확장해 구현·KIT_REGISTRY 등록·부모의 실렌더 목록 동기화.
4. GREEN·기존 공유 컴포넌트 테스트·가드 실행. `gate.sh` = typecheck·lint·표적 및 가드 vitest·build, 실패 즉시 nonzero.
5. REPORT/PROGRESS를 같이 갱신하고 명시 경로 `git commit -- <경로>`로 커밋. skip·단언 약화·없는 실행 결과 기록 금지.
- `PageDocument.test.tsx` 정확 목록은 단계 목표로 확장. 미구현 예시는 엔진에 없는 `no-such-variant` 유지. `renderedVariants.test.ts` 집합 일치·중복 0·freeze 단언 유지. 이전 단언 이관은 전/후/근거 표 필수.
### P-B. 브라우저 판정·시각 대조
- 브라우저 시작 **전에** REPORT 구현·번들·명세 차이를 먼저 채운다.
- 127.0.0.1:4337(정적 HTML 보조 4339), 1280·768·390 실제 iframe 폭을 확인한다. 해당 변형마다 QB 캡처 3폭 및 KD-AC 판정(방법·표본·PASS/FAIL/미판정).
- 공통 KD-AC-02(상한 글자+200% 넘침 0), 05(톤 base/alt·카드 light/dark, 허용 색 쌍), 06(고정 script 1개·바이트 불변·on* 0), 07(문서 순서), 08(헤딩)을 레인 범위에서 확인한다. 2c는 최종 12변형 합본도 검사한다.
- 포커스 링은 변수값 추정 아닌 실제 focus + :focus-visible outline-color; 쉼표 선택자 접미어 각각 적용(1b 재발 방지). 대비 수치를 대조할 배경도 계산값 확인.
- sandbox iframe fullPage 금지. scrollIntoView 뒤 viewport 캡처; 정적 사이트 문서 fullPage는 가능하되 실행 방식 명시. 스크린샷 1장당 재시도 2회 이후 Chrome headless로 전환(390·768 래퍼 iframe 실제 폭). 도구 문제로 시간 소모만 반복하지 않는다.
### P-F. 마감·회수
- **레인 전체 `npx vitest run` 1회 exit 0, Errors 0**를 `logs/full-vitest.txt`에 보존한다. 표적 통과로 전체를 대신하지 않는다. 부하로 실패하면 재현·단독·재실행 결과를 분리, `--maxWorkers=4`는 환경 보완으로 명시(기본 실행 성공이라고 말하지 않음).
- Codex `review --scope branch --base <이 레인 시작 SHA>` 1회, 로그·결과 회수. P1 처리만 범위 내 TDD; 범위/승인 넘어가면 중단 보고. P2도 REPORT에 남긴다.
- REPORT 자리표시 0, PROGRESS 미완 항목 사실대로 유지. **80턴부터 마감 우선**, 커밋되지 않은 기록 없이 끝내지 않는다. 컷오프 직전 새 변형/캡처 시작 금지.
- 자기 서버의 cwd 확인 후 자기 PID만 종료. 4337·4339 LISTEN 0 증거. 다른 세션(main 5480 등)은 무접촉.
- Jarvis 회수는 실제 `subtype/num_turns/is_error`, diff·로그·산출물 검사 + 전체 vitest 3회 + 최종 번들. 병합·정리는 Jarvis만 수행. 2회 연속 max_turns면 자동 재기동 금지.

## 4. M2B-2a — 소개·서비스 4개
- 대상: B1-1 `about/text`, B1-2 `services/list`, B1-3 `services/cards-2`, B1-4 `services/cards-masonry`.
- 순서: 예산 실측 → about/text → list → 공유 카드 구조 + cards-2 → cards-masonry → 공통 검증·QB·마감.
- 기존: `app/src/kit/AboutStory.tsx`, `ServicesCards3.tsx`, `text.ts`(`splitItems`), `body.ts`, `Media.tsx`.
- 예상 쓰기: `ServicesList.tsx`·표적 테스트, 서비스 공유 컴포넌트(예: `ServicesCards.tsx`), 기존 wrapper·테스트, registry.ts·kit.css·renderedVariants.ts·PageDocument.test.tsx, 해당 기록. about/text는 계약상 이미지 슬롯 없음이 증명되면 AboutStory 매핑 재사용 가능; 별도 중복 컴포넌트 강제 안 함.
- 수용: KD-AC-09~12 + 공통 01~08. QB-1~4·13~15의 이 레인 범위.
- 핵심: 소개 이미지 자리 0, prose-max 왼쪽 정렬. list는 **가운뎃점 `·`만** 구분(줄바꿈 아님), SPEC KD-AC-10 두 기대값 그대로. 카드 2개 같은 높이 vs CSS 다단 3개 개별 높이 구별. 다단 DOM 1→2→3, 단 배정 고정 금지.
- 스타일은 data-layout에 의존하지 말고 살아남는 변형 class로 동등 구현(7절).

## 5. M2B-2b — 갤러리·통계 4개
- 대상: B1-5 `portfolio/grid-3`, B1-6 `portfolio/masonry`, B1-7 `portfolio/grid-2`, B1-8 `statistics/stats-3`.
- 순서: 공유 갤러리 시제품 → 3변형 묶음 TDD·등록 → 통계 → 공통 검증·QB·마감.
- 예상 쓰기: `app/src/kit/PortfolioGallery.tsx`·`PortfolioGallery.test.tsx`(3변형 공유), `StatisticsStats3.tsx`·테스트, Media.tsx는 필요 최소·기존 회귀 보존, registry.ts·kit.css·renderedVariants.ts·PageDocument.test.tsx, 해당 기록.
- 수용: KD-AC-13~16 + 공통 01~08. QB-5~8·13·15. grid-3 이미지 하나 끔 상태도 캡처.
- figure 수 = 켜진 슬롯 수, 그라디언트 figure aria-hidden=true, 실제 로컬 이미지 img alt·width·height, ul·figcaption 0. 모두 꺼짐 → gallery 없음. grid-3/grid-2 = media_ratio 기본4:5, 칸 하나 끔은 트랙 유지. masonry = 고정 1:1·16:9·4:5, CSS 다단, 이미지 업로드 원본 비율 메타는 M2c.
- statistics = li 수치→설명, dl·h3 0, 수치 문자열 무변환·count-up 0. SPEC 시험 문자열 **`1,234,567,89`**는 3폭 한 줄. 200% 상한 문서에서는 줄바꿈을 허용해 넘침 0과 양립시키되 정규 시험 프로필 단언은 약화하지 않는다.

## 6. M2B-2c — 후기·가격·예약·CTA 4개
- 대상: B1-9 `testimonials/quotes-2`, B1-10 `pricing/tiers-2`, B1-11 `contact/booking`, B1-12 `cta-band/banner`.
- 순서: 예약 공유 시제품 → quotes → pricing → booking → cta → 12변형 합본 KD-AC·QB·마감.
- 예상 쓰기: `TestimonialsQuotes2.tsx`, `PricingTiers2.tsx`, `ContactBooking.tsx`, `CtaBandBanner.tsx`와 각각 테스트, ContactForm.tsx는 공유 폼 추출/매개변수화 허용(기존 문의 폼 결과 회귀 유지), registry.ts·kit.css·renderedVariants.ts·PageDocument.test.tsx, 해당 기록. 파일명은 제안, 동등 공유 구조 변경 시 REPORT 근거.
- 수용: KD-AC-17~21 + 전체 12변형 공통 01~08. QB-9~15(13~15는 전체 12 포함).
- 후기: li > figure > blockquote + figcaption, **사람 이름 cite 금지**, 빈 quote li 제거, 빈 author caption 제거.
- 가격: 2카드 동등, `문의` vs `99,000` 같은 계산 스타일. 추천·통화·단위·별도 버튼 지어내기 0.
- 예약: **fieldset disabled**, action/method·placeholder 0, 모든 칸/버튼 안쪽, label/for/id·legend·안내 aria-describedby. text·tel·text·text·textarea, date/time 0. 고정 문구 SPEC 그대로, 준비중 예약 안내·입력 불투명도1. 정적 HTML Enter/버튼 요청·이동0 실측. 날짜·시간 1280/768 같은 행, 390 세로.
- CTA: primary/on-primary와 뒤집기만, 첫 contact(form/booking)→footer→span(포커스0), href="#" 금지. section h2, base/alt 같은 면, 390 CTA 전체 폭.
- 최종 RENDERED_VARIANTS = KIT_REGISTRY 정확 30쌍, 미구현/폴백 표식0. 원본 엔진 SECTION_DEFINITIONS와 정확 집합 대조도 테스트로 증명(엔진 계약 수정 금지).

## 7. 공통 허용·금지 및 번들
- 시작 baseline(470cb2f 실제 build): 렌더 JS **81.13KB**, CSS **7.12KB**, `/studio` 첫화면91.78 / 진입 **127.40KB**. 이후 레인은 직전 병합 실측으로 기준 갱신.
- 렌더 JS 멈춤선89.70, CSS≤30. `/studio` 첫화면≤100 및≤99.40 멈춤선, 진입≤127.70(예산128), **레인별 증가≤0.03KB**; 다른 화면 ±0.03KB. 앱 DS·문서연산·게이트·zod를 렌더 문서에 싣지 않는다.
- 부모 `features/studio/renderedVariants.ts`에 킷 import 금지. 현재 SECTION_LIBRARY는 바깥 3유형만 포함, 본문은 4쌍 명시 — 본문 12등록이 자동 파생된다고 오해하지 않는다. 추가 명시 목록이 예산 초과면 이미 앱에 로드된 데이터로만 최소 파생/표현 검토; engine registry 신규 import·전 유형 완료 가정 금지. 최종 30/30 이후의 안전한 표현은 가드·실측으로 증명. 부모에 엔진 registry를 추가로 싣는 변경·예산 상향은 별도 승인.
- 정적 markup `KEPT_DATA` 변경0. CSS 선택자 class·data-tone·data-kit·data-always·data-site-root만. SPEC의 data-layout/data-surface/data-section/data-slot은 판정 표시로 남기되 스타일은 변형 class로 이관하고 정적 HTML 계산 스타일 동등성 확인.
- 새 의존성·아이콘·외부 자산/요청0, 새 슬롯0, 엔진 계약/PageDoc/SectionDefinition 변경0. 킷 React state·effect·event prop0, 모션/스크롤 JS0. 이번 CSS transition·animation·scroll-behavior·vh류·hex/px 리터럴0(KD-AC-01).
- sandbox allow-scripts만 유지, allow-same-origin 금지. 고정 r4.12 메뉴 script 바이트 불변, 다른 script0.
- 쓰기 금지: `design/`, `docs/design/`, `docs/decisions/`, CLAUDE.md, package*.json/lock, fable 문서. 기록+범위 킷/테스트/실렌더 목록 외 수정은 승인 요청.
- 외부 사이트 관찰·크롤링·GDWEB/dbcut 요청0. 업로드 이미지·모션·폰트·3안 비교·React zip·조합 생성기·편집기 도움말(B-M2B-01~03) 제외.
- 코드는 worktree에서 로컬 명시 경로 커밋만. push·merge·worktree/branch 삭제·다른 서버 재시작 금지.

## 8. 최종 수신 계약
각 레인 결과에는:
1. 실제 종료 meta·기준/최종SHA·커밋표·변경경로.
2. KD-AC와 QB별 PASS/FAIL/미판정, RED/GREEN·브라우저 로그·3폭 캡처·mock 대조 차이.
3. baseline/시제품/최종 번들, 전체 vitest 실제 건수·exit·Errors, typecheck/lint/build.
4. Codex 실제 결과(미완료면 미완료), 명세 차이·남은 승인·위험, 자기 서버 종료 증거.
5. 책임 역할/실행 환경 별도 표시. worker 종료나 문서만으로 완료 처리하지 않는다.

- Jarvis는 구현 레인마다 회수 게이트 후 로컬 --no-ff 병합(기존 사전 승인 범위), 완료 worktree/terminal 정리와 목록 재확인. 원격 push는 매번 영환님 승인.
- 최종 30/30은 킷 구현 완료이지 M2b 전체 종료 아님. 모션·폰트 M2B-3/4, 3안 비교 M2B-5, 독립 QA/루브릭/시각 회귀 M2B-6은 남는다.
