# R2 — B. 렌더러 · codegen/zip · 이미지 제작 · 시안 이미지 산출 · 최소 백엔드 / C. 데이터 확보 (법·기술·자동화)

- 작성: Claude-Opus 5.5 · 2026-09-29 (KST)
- 브리프: `docs/00-research/BUZZ_BRIEF_R2.md` · 짝 문서: `docs/00-research/buzz/claude-fable-r2.md`(A. 시안 정의·파이프라인·재배열·VS-1 / C. 제품 가치 관점)
- 기준 커밋: HEAD `e4b9487`(앱 코드는 브리프의 `669a328`과 같음). 저장소는 읽기 전용으로 봤고, 이 파일만 썼다(스테이징 안 함). 빌드는 돌리지 않았다 — 번들 수치는 모두 저장소에 남은 실측 로그를 인용한다.
- 표기: **[사실]** 저장소 파일·행 또는 1차 출처로 확인 · **[추정]** 근거 있는 판단 · **[확인 필요]** 결정 전 검증 · ★ 영환님 결정 권장안
- 외부 사실은 2026-09-29에 researcher 서브에이전트 2개가 출처를 직접 열어 확인했다. 직접 열지 못한 것은 [확인 필요]로 남겼다. Fable이 이미 1차 출처로 확인한 라이선스 표(Awwwards·Mobbin·Framer 등)는 반복하지 않고 `claude-fable-r2.md` C-4를 가리킨다.

---

## 0. 결론 (요약)

1. **렌더러는 "별도 렌더 문서(iframe)"여야 하고, 그 문서의 예산은 앱 예산이 아니라 생성 홈페이지 예산(TRD 8절: JS ≤ 90KB · CSS ≤ 30KB)으로 따로 판정해야 한다.** 편집기 `/studio/:projectId`의 진입 직후 합계가 이미 **124.31 / 125KB**(여유 0.69KB, 멈춤선 0.3을 지키면 실사용 약 0.39KB)라, 같은 React 트리에 섹션 킷을 자동으로 싣는 방식은 숫자로 불가능하다. iframe을 "예산 밖"이라고 부르면 ADR-004 개정 1(지연 로드 우회 차단)을 어기는 것이므로, **ADR-004를 개정해 렌더 문서(내보내기 런타임 + 편집기 다리)의 합계에 더 엄격한 자기 예산 줄을 준다.** 번들 검사 스크립트가 엔트리를 하나로 가정하므로 같은 브랜치에서 고쳐야 한다.
2. **정적 HTML과 PNG는 브라우저 단독으로 만들 수 있다.** 킷 CSS를 앱 빌드 때 미리 컴파일하고(토큰은 CSS 변수), 렌더 문서의 DOM을 그대로 직렬화하면 정적 HTML이 되며, 새 의존성 없이 "미리보기와 동일"(FR-PUB-03)을 구조로 보장한다. **조건 둘**: 킷 상호작용을 React 상태가 아닌 네이티브 HTML(`details`·`popover`·`dialog`)로 만들 것, 그리고 **렌더러가 없는(와이어프레임 폴백) 섹션이 있으면 내보내기를 막을 것** — 지금 계획으로는 VS-1에서 폴백 5섹션이 HTML·PNG에 그대로 실려 나간다(D-2 실측). PNG 라이브러리는 **조작 뒤** 로드한다(예산 밖이 정당한 분류).
3. **React 프로젝트 zip도 워커 없이 가능할 수 있다 — Fable 안(M4)과 갈리는 지점.** codegen을 "고정 템플릿 + 킷 소스 복사 + `content.json`·`tokens.css`만 가변"으로 설계하면, 빌드 성공(FR-PUB-02)은 요청마다가 아니라 **라이브러리 버전마다 CI에서 한 번** 검증하면 된다. 사용자 글자는 TSX 소스에 절대 들어가지 않으므로 입력이 빌드를 깨거나 코드를 주입할 경로가 없다. [추정 — CI 황금 프로젝트 검증 설계가 성립하는지 M2b 초에 확인]
4. **이미지: MVP = 토큰 기반 자체 그래픽(기본) + 사용자 업로드. 스톡·생성형은 P2이고 둘 다 백엔드 프록시가 선행 조건이다.** Unsplash는 API 약관이 **핫링크를 강제**해 "산출물에 외부 URL 0"(TRD 1절 원칙 5·TR-POL-01)·자체 완결 zip과 정면 충돌하므로 제외. 생성형은 저작권이 성립하지 않고(미국 저작권청·한국저작권위원회), AI 기본법(2026-01-22 시행)이 생성물 표시를 요구하므로 PRD 원칙 2의 문구 개정 없이는 넣을 수 없다. Fable A-1의 우선순위(자체 그래픽 > 업로드 > 스톡 > 생성형)에 **동의**한다.
5. **Safari는 캔버스 WebP 인코딩을 지원하지 않는다**(caniuse, Safari 27 포함). 브라우저 단독 업로드 최적화는 "Chrome·Firefox = WebP, Safari = JPEG 재인코딩"으로 나뉘고, AVIF는 워커(sharp)로 미룬다. EXIF 제거는 캔버스 재인코딩으로 공짜로 된다.
6. **최소 백엔드는 두 층이다.** (a) VS-1~M2c: **0** — 모든 것이 브라우저. (b) 베타(공유·저장·다중 사용자): 인증·조직 + Postgres + 객체 저장소 + **헤드리스 Chromium 워커 1종**(PDF·카탈로그 썸네일·axe/Lighthouse 게이트·AVIF 변환을 한 워커가 맡는다). 스톡·생성형을 켜면 그때 **API 프록시**(키 보관·사용량 원장·검열)가 추가된다 — egress가 막힌 생성 워커(TR-SEC-05)와 같은 프로세스에 두면 안 된다.
7. **C. 데이터 확보(법·기술): "공개 웹 대량 수집"은 한국에서 형사로는 무죄여도 민사 부정경쟁(파목)으로 배상 판결이 난 선례가 있다(야놀자–여기어때).** 따라서 규모 확보는 (4) 자체 생성을 **자동화**하는 쪽이 법적 위험 0으로 가장 크고, 외부 실사례는 **소유권 확인(DNS TXT·메타 태그)을 거친 opt-in 사이트만 자동 분석**하는 경로가 합법·자동화·규모의 균형점이다. Fable의 "레퍼런스 = 검증된 조합" 재정의(C-1)와 베타 조합(C-2)에 동의하고, 그 위에 **"소유 확인 opt-in 자동 분석기"와 "internal 조합 자동 생성기"** 두 도구를 얹는다.

---

## B-1. 렌더러 — PageDoc → 실제 섹션 컴포넌트, 편집기 캔버스에 붙이는 방식

### 먼저 숫자 (이 절의 결론을 정하는 사실)

| 항목 | 값 | 근거 |
|---|---|---|
| `/studio/:projectId` 첫 화면 / 진입 직후 (a3-2 FIX2 뒤 최종) | **91.72 / 124.31KB** — 진입 직후 여유 **0.69KB** | [사실] `dev/active/editor-a3-2/REPORT.md:41-44` |
| 그 여유를 이미 쓴 것 | a3-2 V2 캔버스 모양·팔레트 **+1.28KB**, V3 +0.12, FIX1 +0.06 | [사실] 같은 REPORT 43행 |
| 진입 직후에 자동으로 받는 것 | `StudioLayout`(편집 틀) + 프로젝트 저장소 로더 — 와이어프레임 캔버스(`StructureCanvas`·`canvasLayouts`)가 이 안에 든다 | [사실] `app/scripts/check-bundle-size.mjs` SCENARIOS `/studio/:projectId` |
| 모바일 미리보기 방식 | 같은 문서 안에서 프레임 **폭만** 바꾼다(`FRAME_REM` 모바일 24.375rem) | [사실] `app/src/features/studio/previewFrame.ts` · SPEC 10.3 "프레임 폭 CSS 변경만" |
| 생성 홈페이지 예산 | 초기 JS ≤ 90KB gzip · CSS ≤ 30KB gzip · 폰트 ≤ 2계열 서브셋 · 이미지 AVIF/WebP + srcset | [사실] `docs/03-trd/TRD.md:277` · ADR-004 결정 표 3행 |
| 번들 검사 스크립트의 엔트리 판정 | `Object.keys(manifest).find(k => manifest[k].isEntry)` — **엔트리가 하나라고 가정** | [사실] `app/scripts/check-bundle-size.mjs:113` |

- 실제로 쓸 수 있는 여유는 0.69가 아니라 **약 0.39KB**다 — a3-2가 적용한 멈춤선 0.3KB(같은 REPORT 43행 "멈춤선 0.3 위")를 지키면 그 아래로 내려갈 수 없다.

→ 섹션 킷(변형 4개만 잡아도 컴포넌트 + 토큰 CSS + 이미지 해석)은 0.39KB 안에 들어갈 수 없다 [추정 — 킷 크기는 미측정이나 a3-2 캔버스 모양표 하나가 1.28KB였다]. **"같은 트리에 자동 로드"는 선택지가 아니다.**

### 네 가지 방식 비교

| | ① 같은 React 트리에 직접 | ② 같은 트리 + 같은 출처 iframe에 portal | ③ **별도 렌더 문서(iframe, 자기 엔트리)** | ④ 서버 렌더 → 스크린샷 |
|---|---|---|---|---|
| ADR-004 예산 | `/studio` 진입 직후에 합산 → **불가**(여유 0.69 · 실사용 약 0.39) | 킷 코드가 부모 청크 → 같은 문제 | 렌더 문서 = 별도 엔트리. **자기 예산 줄 필요**(아래 개정안) | 앱 번들 0 |
| CSS 격리 | 없음. 앱 Tailwind(`bg-primary` = 앱 primary)와 킷 Tailwind(`bg-primary` = 사이트 primary)가 **같은 클래스 이름으로 충돌** | 있음(문서가 다름) | 있음 | 해당 없음 |
| 반응형 정합 | 미디어 쿼리가 **앱 창 폭**에 반응 → 모바일 프레임이 거짓. 킷을 컨테이너 쿼리로 짜면 가능하나 편집기 전용 CSS가 생김 | iframe 폭 = 뷰포트 → 미디어 쿼리가 **내보낸 사이트와 똑같이** 동작 | 같음 | 서버가 뷰포트 지정 |
| 내보내기와 같은 코드인가 | 편집기 전용 래퍼·격리 처리가 끼어듦 | 부모 앱 문맥에서 실행 | **렌더 문서 = 생성 사이트 런타임 그 자체** | 같음(서버에서 같은 킷) |
| 편집 연동(선택·문제 표시) | 가장 쉬움 | 쉬움(같은 트리) | postMessage 프로토콜 필요(아래) | 불가(이미지) |
| 입력→화면 지연 | 즉시 | 즉시 | 즉시(메시지 1회) [추정] | 초 단위, 편집마다 서버 왕복 → **캔버스 부적합** |
| 보안 | 사용자 글자 = React 이스케이프 | 같음 | + 샌드박스로 부모 격리 가능 | 서버 공격면 |
| 인프라 | 0 | 0 | 0 | 헤드리스 브라우저 서버 |

★ **추천: ③ 별도 렌더 문서.** ④는 캔버스가 아니라 캡처·썸네일에 쓴다(B-4). 대체안은 표 아래 "대체안".

### ③의 설계 요점

1. **엔트리 구성** — Vite 다중 페이지 입력으로 `render.html` + `src/render/main.tsx`를 둔다. 렌더 문서는 **킷 컴포넌트 + 킷 CSS + 토큰 CSS 주입기 + 메시지 수신기**만 싣는다. 앱 DS·엔진 연산·게이트는 싣지 않는다(엔진은 `validatePageDoc`만 — 받은 문서를 다시 검증).
2. **ADR-004 개정안(★ 영환님 결정)** — "렌더 문서(`render.html`)의 초기 JS·CSS **합계**는 **생성 홈페이지 예산(TRD 8절 JS ≤ 90KB · CSS ≤ 30KB)** 으로 판정한다. `/studio/:projectId`의 앱 예산에는 iframe을 띄우는 호스트 코드(프레임·메시지 브리지·오버레이)만 들어간다."
   - 정직하게 적으면 렌더 문서는 "내보낼 사이트 그 자체"가 아니라 **내보내기 런타임(킷·킷 CSS·토큰 주입) + 편집기 다리(메시지 수신기·사각형 보고기·`validatePageDoc`·아래 4의 와이어프레임 폴백)** 이다. 90/30KB는 이 **합계**에 건다 — 실제 내보낸 사이트보다 무거운 문서에 같은 상한을 거는 것이라 더 엄격하다.
   - 개정 1이 막으려던 것은 "지연 로드로 예산 계산에서 빠지는 것"이다. 이 개정은 빠지는 코드가 없고 **다른 상한(90 < 100)으로 옮겨 계산**하는 것이지만, 편집기 코드(다리·폴백)를 앱 예산에서 렌더 문서 예산으로 옮기는 부분은 바로 그 패턴과 닮았다. 그래서 **폴백 이전(아래 4)은 공짜 상쇄가 아니라 이 개정 요청의 명시 항목**으로 올린다.
   - [사실] `validatePageDoc`은 zod를 쓰지 않는다(손으로 쓴 reader, `app/src/engine/validate/validatePageDoc.ts:5-11`) → 렌더 문서에 넣어도 zod(앱 의존성)가 딸려 오지 않는다. 섹션 레지스트리(`getSectionDefinition`)는 딸려 온다 — 측정 항목.
3. **번들 검사 스크립트 개정(차단 항목)** — 엔트리가 둘이 되면 `find(isEntry)`가 렌더 엔트리를 공통으로 잡아 **조용히 틀린 값**을 낼 수 있다(113행). `index.html` 엔트리를 이름으로 고정하고, 렌더 엔트리를 SCENARIOS와 별도 판정(90/30KB)으로 추가해야 한다. **iframe 도입과 같은 브랜치에서** 고친다.
4. **호스트 쪽 비용과 상쇄** — 호스트 코드는 `/studio` 진입 직후 **실사용 여유 약 0.39KB**(멈춤선 0.3 적용) 안에 들어가야 한다. 상쇄 1순위: 와이어프레임 그리기(`SectionBlock`·`canvasLayouts` 모양표 15종·팔레트 5역할, a3-2 V2만 +1.28KB)를 **렌더 문서 안의 폴백**으로 옮긴다 — "렌더러가 없는 변형은 렌더 문서가 와이어프레임을 그린다". 그러면 `StudioLayout`에서 캔버스 그리기 코드가 빠진다 [추정: 순감 가능, 착수 첫 작업으로 실측]. 이 이전은 2의 개정 요청에 **명시 항목으로 포함**한다(공짜 상쇄로 쓰지 않는다). Fable A-3의 "폐기는 실렌더 30/30 뒤"와 순서만 다르고 결론은 같다(폴백은 남되 **렌더 문서 쪽**에 남는다). 단, 폴백이 렌더 문서에 있으면 **내보내기·PNG에 섞여 나갈 수 있다** → B-2 "폴백 섹션 차단" 규칙과 한 묶음이다.
5. **문제 표시(FR-EDT-05)는 부모 문서에 둔다.** 렌더 문서가 섹션·슬롯별 사각형(`instanceId`·slot key → rect)을 postMessage로 보고하면 부모가 iframe 위 오버레이 층에 2중 테두리·배지를 그린다. 이유 두 가지: (a) 편집기 UI가 킷/내보내기 번들에 섞이지 않는다, (b) **`aria-describedby`는 문서 경계를 넘지 못한다** — SPEC 5.7은 "필드의 `aria-describedby`가 캔버스 문장과 카운터를 함께 가리킨다"인데, 문장이 iframe 안에 있으면 이 연결이 끊긴다. 문제 문장은 부모 문서(필드 옆 또는 오버레이)에 있어야 한다. Fable A-3의 "유일한 편집기 재작업 = 오버레이"에 이 접근성 제약을 더한다.
6. **메시지 프로토콜(최소)** — 부모→렌더: `render{doc, tokens, images}` · `viewport{width}` · `select{instanceId}` · `captureMode{on}`(모션 끄기). 렌더→부모: `ready` · `rects{[instanceId, slotKey?, x,y,w,h]}` · `click{instanceId}` · `error{code}`. 양쪽 모두 `event.source`·`origin` 확인 + 모양 검증(렌더 쪽은 기존 `validatePageDoc` 재사용, 부모 쪽은 메시지 모양 검사). 문서는 매 편집마다 통째로 보내도 된다(섹션 ≤ 11, SPEC 10.3) [추정].
7. **샌드박스와 이미지** — 권장 `sandbox="allow-scripts"`(같은 출처 권한 없음 → 불투명 출처). 이 경우 두 가지가 따라온다 [확인 필요 — PoC로 검증]:
   - 부모 보관소의 `blob:` URL은 불투명 출처 문서에서 **열리지 않는다** → 이미지는 postMessage로 **Blob 자체**를 넘기고 렌더 문서가 자기 object URL을 만든다. SPEC 5.9 "object URL은 어디에도 저장하지 않는다"와 맞는다.
   - 불투명 출처에서 모듈 스크립트를 받으려면 앱 JS에 CORS 헤더(`Access-Control-Allow-Origin`)가 필요하다 — 정적 호스팅 설정 항목. 어려우면 `allow-scripts allow-same-origin`으로 내리되, 그 조합은 샌드박스를 스스로 풀 수 있으므로 **사용자 HTML·스크립트 입력이 0**(글자 = React 이스케이프, 이미지 = 래스터만, SVG 업로드 금지 SPEC 5.9)이라는 전제를 문서화하고 렌더 문서에 CSP(`script-src 'self'`, `connect-src 'none'`)를 건다.
8. **렌더 계약 위치** — 킷은 엔진 데이터 계약과 분리된 디렉터리(`src/kit/` 등)에 두고, **"킷은 react·(선택)motion·킷 CSS 클래스 외에 아무것도 import하지 않는다"** 를 `engineImportGuard.test.ts`와 같은 방식의 가드 테스트로 강제한다. 이 규칙이 B-2의 "킷 소스를 그대로 zip에 복사"를 가능하게 한다.
9. **킷 상호작용 규칙 — "React 상태로 상호작용을 만들지 않는다"** (B-2 정적 HTML의 전제). DOM 직렬화는 마크업만 남기고 React 상태·핸들러를 버린다. 킷이 `useState`로 모바일 메뉴 토글(`header/sticky-right-cta`에 있을 가능성 높음 [추정])·FAQ 아코디언·캐러셀·폼 검증을 만들면 정적 HTML에서 **죽은 UI**가 되어 FR-PUB-03 "미리보기와 동일"이 깨진다. 따라서 킷 상호작용은 **네이티브 HTML**(`details`/`summary`, `popover` 속성, `dialog`, 폼 기본 검증) + 모션과 **같은 소형 공용 바닐라 스크립트**로만 만든다. 가드 테스트: 킷 파일에서 `useState`·`useReducer`·이벤트 핸들러 prop 금지(렌더 문서의 편집기 다리는 킷 밖).
   - 문의 폼(contact)은 정적 내보내기에서 **보낼 곳이 없다.** "비활성 + 안내 문구" 또는 "사용자가 설정한 수신 엔드포인트"(TR-SEC-09 rate limit·honeypot·수신처 검증은 그 엔드포인트 쪽 책임) 중 하나로 정해야 한다 [확인 필요 — Designer·Security].

### 대체안 (ADR-004 개정이 거절될 때)

- **② 또는 ① + "실제 페이지 보기" 조작 뒤 로드.** 캔버스 기본은 와이어프레임 그대로, 버튼을 누르면 킷을 받는다 — 2a-04 Q-F4-1의 "조작 뒤" 분류에 정당하게 들어가 **예산 개정이 필요 없다.** 대가: 첫인상이 여전히 와이어프레임이고(Fable A-4 "캔버스 = 실렌더"와 충돌), ①이면 CSS 충돌·모바일 거짓 폭 문제가 남는다. 그래서 대체안이라도 iframe(②)을 쓴다.

---

## B-2. codegen · 내보내기 — 정적 HTML · React zip · 실행 위치

### 전제: 킷 CSS는 앱 빌드 때 미리 컴파일한다

- Tailwind 4는 소스 스캔 + 컴파일러가 빌드 도구에서 돈다(`@tailwindcss/vite`, `app/package.json`). 이것을 **브라우저에서 사용자마다 돌리는 것은 번들·시간 비용이 커서 선택지가 아니다** [추정].
- 대신 킷은 유한하다(엔진 변형 정의 30개 — Fable A-3 G1). **킷 전용 CSS 엔트리(`@source`를 `src/kit/`로 한정)** 를 앱 빌드 때 한 번 컴파일해 `kit.<hash>.css`로 고정한다. 프로필마다 달라지는 것은 **토큰 값뿐**이고, Tailwind 4 유틸리티는 `@theme` 변수를 참조하므로 런타임에는 `:root{--color-primary:…;--font-heading:…}` 문자열 하나(`tokens.css`)만 만들면 된다 — 결정적(FR-GEN-03)이고 수백 바이트 [추정].
- 부수 효과: 킷 CSS 크기가 라이브러리 버전마다 고정값이 되어 TRD 8절 **CSS ≤ 30KB를 빌드 때 검사**할 수 있다.

### 정적 HTML — 두 방법

| | (a) 렌더 문서 DOM 직렬화 ★ | (b) `renderToStaticMarkup` |
|---|---|---|
| 방법 | 렌더 문서가 그린 결과를 `outerHTML`로 떠서 스크립트 태그를 뺀 `index.html` + `kit.css` + `tokens.css` + `assets/` | React 서버 렌더러로 문자열 생성 |
| 추가 의존성 | **0** | `react-dom/server` 브라우저 빌드 — 크기 [확인 필요, 미측정] |
| 미리보기와 동일(FR-PUB-03) | **구조상 동일**(같은 DOM) | 같은 컴포넌트지만 다른 렌더 경로 |
| 결정성 | 같은 입력 → 같은 DOM → 같은 문자열 [추정 — 직렬화 속성 순서는 React가 만든 순서 그대로] | 결정적 |
| 이미지 | 렌더 문서의 `blob:` src를 `assets/<내용해시>.webp`로 바꿔 쓴다 | 같음 |

- **(a)의 전제 2개**: ① 킷 상호작용이 React 상태에 기대지 않는다(B-1 9) — 아니면 메뉴·아코디언이 죽은 채로 나간다. ② **폴백 섹션 차단** — VS-1에서 ref-a A안은 9섹션 중 5개가 와이어프레임 폴백이다(D-2 실측 — 초판의 "8섹션 중 4개"는 Fable A-4를 옮긴 오류). 폴백이 렌더 문서에 있으면 직렬화된 `index.html`과 PNG에 **와이어프레임 블록이 그대로 실려 나가고**, 지금 게이트(R-01~R-13)에는 이것을 막는 규칙이 없다. → 내보내기 판정 순서(SPEC 8.3.2)에서 `GENERATOR_UNAVAILABLE` 자리를 **"렌더러 없는 섹션 N개"(새 차단 사유, 섹션 이름 목록 + "첫 폴백 섹션으로 이동")** 로 바꾸고, PNG는 허용하되 해당 섹션에 "구조 미리보기" 표식을 남긴다(★ B-7-4). Fable VS-1 수용 기준 "로컬에서 열면 캔버스와 같다"만으로는 이 경우를 걸러내지 못한다.
- 모션: 정적 HTML에는 React 런타임이 없다. **모션 프리셋 L0~L2를 CSS 우선(transition + `data-motion` 속성) + 1KB 안팎의 IntersectionObserver 스크립트**로 설계하면 정적 HTML·React zip·캔버스가 같은 동작을 낸다. TRD 3절의 `motion/react` 의존을 이 방식으로 바꿀지는 ★ 결정 후보(B-7-5). `prefers-reduced-motion`은 CSS 미디어 쿼리로 공짜로 따라온다.
- 묶음: `index.html` + `assets/` + `LICENSES.md`를 zip으로 준다. zip 라이브러리는 **내보내기 버튼 onClick에서만** 로드(조작 뒤 → 예산 밖). 후보 `fflate` — 공식 npm "about 33kB (12.5kB gzipped) if every feature…" [사실, https://www.npmjs.com/package/fflate, 2026-09-29] · 라이선스는 MIT로 알려졌으나 이번에 원문 미확인 [확인 필요]. JSZip은 MIT/GPLv3 이중 라이선스 [사실, https://www.npmjs.com/package/jszip].
- 단일 파일(data URL 인라인) 방식은 이미지 12장·30MB(SPEC 5.9 한도)에서 HTML이 커져 쓰지 않는다.

### React 프로젝트 zip — "고정 템플릿 + 데이터"로 설계하면 요청마다 빌드할 필요가 없다

TRD 8절 산출물 트리(`docs/03-trd/TRD.md:262-275`)를 만드는 방법:

| 파일 | 만드는 방법 | 요청마다 변하나 |
|---|---|---|
| `package.json` · `package-lock.json` · `vite.config.ts` · `index.html` · `src/main.tsx` | 라이브러리 버전별 **고정 템플릿**(의존성 버전 고정, lockfile은 CI가 생성) | 아니오 |
| `src/sections/*.tsx` | 킷 소스를 **그대로 복사**(`import.meta.glob('…/kit/sections/*.tsx', { query: '?raw' })`를 조작 뒤 청크에서) — 쓰인 변형만 | 파일 선택만 |
| `src/App.tsx` | 섹션 순서대로 import·배열 — 식별자는 레지스트리의 고정 이름만 쓴다 | 순서만 |
| `src/content.json` | **사용자 글자는 여기에만.** JSON 직렬화 | 예 |
| `src/theme/tokens.css` | 토큰 → CSS 변수(정적 HTML과 같은 함수) | 예 |
| `public/assets/*` · `LICENSES.md` | 이미지 변환본 · 폰트/킷/에셋 라이선스 | 예 |

- **주입 안전**: 사용자 입력이 TSX·JS 소스에 문자열로 끼어들지 않는다(JSON 값으로만) → 따옴표·`</script>`·`${}` 등으로 코드를 깨거나 주입할 경로가 없다. TR-SEC-03·TRD 8절 금지 패턴(eval·`dangerouslySetInnerHTML`·외부 스크립트)은 **킷 소스에 대해 CI 정적 검사**로 막으면 되고, 요청 산출물은 "템플릿 해시 일치 + JSON 스키마 검증"으로 확인한다.
- **FR-PUB-02 "zip에서 `npm install && npm run build` 성공"의 검증 위치**: 요청마다 워커에서 빌드하는 대신, **라이브러리 버전마다 CI에서 "모든 변형 + 적대적 콘텐츠(따옴표·이모지·4바이트 한글 조합·긴 글자·빈 슬롯) 황금 프로젝트"를 빌드**해 통과한 버전만 배포한다. 요청마다 달라지는 것이 데이터뿐이면 이 CI 검증이 곧 요청 산출물의 빌드 보증이 된다 [추정 — 성립 조건: 템플릿·킷 소스가 요청마다 변하지 않을 것, content.json 스키마가 킷 prop 타입과 일치할 것(zod → TS 타입 생성)].
- 이 설계가 성립하면 **React zip은 브라우저 단독으로 M2b에 들어갈 수 있다** — Fable A-1·A-6-1("React zip은 빌드 검증 = 워커 필요 → M4")과 갈린다. 워커는 나중에 "표본 재빌드(스팟 체크)" 용도로만 남는다. 교차 코멘트 대상.

### 폰트 — 내보내기에 앱 폰트 파일을 그대로 넣으면 안 된다

- [사실] 앱은 Pretendard **서브셋** woff2 4개를 자체 호스팅한다(`app/src/assets/fonts/*.subset.woff2`, `app/src/styles/tokens/fonts.css:5`).
- [사실] FONT-01 판정: "글리프 서브셋은 Modified Version으로 취급하고, Reserved Font Name(RFN)이 걸린 이름은 변경해야 합니다" · Pretendard·Noto Sans KR은 RFN 확인(`docs/00-research/FONT_LICENSE_CHECK.md` 1절 2·3항).
- → 생성 사이트 zip·정적 HTML에는 (a) **원본 폰트 파일**(무변경 WOFF2) 또는 (b) **이름을 바꾼 서브셋**을 넣고, 어느 쪽이든 OFL 전문 + 저작권 고지를 `LICENSES.md`에 넣는다. 앱의 서브셋 파일을 "Pretendard" 이름 그대로 복사해 넣는 구현은 금지 — 킷 codegen 체크 항목. PNG 시안(래스터)은 폰트 재배포가 아니다.
- TRD 8절 "폰트 ≤ 2계열 서브셋"과 RFN 제약이 부딪힌다: 서브셋을 원하면 이름 변경이 필수다(★ 결정 후보 B-7-6).

### 실행 위치 정리

| 산출물 | MVP 권장 위치 | 근거 |
|---|---|---|
| 캔버스 실렌더 | 브라우저(렌더 문서) | B-1 |
| 정적 HTML zip | **브라우저** | DOM 직렬화 + 미리 컴파일한 CSS, 의존성 = zip 라이브러리(조작 뒤) |
| React 프로젝트 zip | **브라우저**(빌드 보증 = CI 황금 프로젝트) [추정] / 성립 안 하면 워커 | 위 표 |
| 빌드 스팟 체크 · 대량 재생성 | 워커(베타 이후) | B-5 |

---

## B-3. 이미지 제작 — 선택지별 권리·정책·비용·품질·보안

### 비교표

| | ① 토큰 기반 자체 그래픽 ★기본 | ② 사용자 업로드 ★MVP | ③ 스톡 API | ④ 생성형 이미지 API |
|---|---|---|---|---|
| 무엇 | 프로필 토큰(팔레트·무드·radius)과 `instanceId` 해시로 **결정적으로** 만드는 그라디언트·기하 패턴·타이포 카드·이니셜 — CSS(또는 인라인 SVG)로 킷 안에서 그린다 | 사용자가 고른 JPEG·PNG·WebP(SPEC 5.9, 5MB, SVG 불가) | Unsplash·Pexels·Pixabay 검색 → 사진 | 프롬프트 → 이미지 |
| 권리 | 우리 코드의 산출물 — 문제 0 | 사용자가 권리를 **보증**(이용약관 조항 필요). 발행(M5) 뒤에는 신고·삭제 절차 | 사진 라이선스는 상업 이용 허용이나 **API 약관이 별도 조건**(아래) | 생성물에 저작권이 **성립하지 않음**(아래) · 제3자 IP 유사성 위험 · 표시 의무 |
| PRD 원칙 2 "자체 제작 섹션과 사용 허가된 에셋만"과의 관계 | 부합(자체 제작) | 부합하려면 "사용자가 권리를 보증한 에셋" 문구 명시 필요 | 부합(허용 라이선스 에셋) + TR-POL-05 라이선스 메타 | **문구 개정 필요** — "사용자 요청으로 생성한 AI 이미지(생성 표시·권리 고지 포함)"를 별도 범주로 |
| 결정성(FR-GEN-03) | 결정적 | 자산 id 참조 → 결정적 | 선택 후 자산으로 저장하면 결정적 | 생성은 비결정 → **생성 = 자산 만들기(사용자 조작)** 로 두고, 문서는 자산 id만 가리키면 이후 결정적 |
| 비용 | 0 | 저장소 비용만(베타 이후) | 무료 티어 + 레이트 리밋 | 이미지당 약 $0.01~0.17(아래) + 검열·원장 |
| 품질 | 추상·장식용으로 충분, "제품 사진"은 못 대신함 | 사용자 자료 품질에 좌우 | 높음(범용) | 높음, 업종 적합도 편차 |
| 보안 | 사용자 입력 없음 | 매직바이트·픽셀 한도·EXIF(TR-SEC-04), SVG 금지 | **키는 서버에만** → 프록시 필요 · 검색어 로그 | **키는 서버에만** · 프롬프트 남용·검열 · 비용 폭주(조직별 한도) |
| 실행 위치 | 브라우저(킷 안) | 브라우저(VS-1) → 객체 저장소(베타) | **백엔드 프록시**(egress 막힌 생성 워커가 아님) | **백엔드 프록시** |
| MVP | ★ 기본 | ★ | P2 | P2 (플래그, 업종 제한) |

### ③ 스톡 API — 제공자별 조건 [사실, 2026-09-29]

- **Unsplash**: "All API uses must use the hotlinked image URLs returned by the API under the `photo.urls` properties." — https://help.unsplash.com/en/articles/2511271-guideline-hotlinking-images · 다운로드 시 `download_location` 호출 의무 — https://help.unsplash.com/en/articles/2511258-guideline-triggering-a-download · 라이선스 금지 항목 "Compiling images from Unsplash to replicate a similar or competing service" — https://unsplash.com/license
  → **핫링크 강제 = 산출물에 외부 URL이 박힌다.** TRD 1절 원칙 5(생성 입력·산출물 경로에 외부 URL 필드 없음)·TR-POL-01·`PageDoc`의 "외부 URL은 문서 어디에도 넣지 않는다"(`pageDoc.ts` LocalImageId 주석)·자체 완결 zip·발행 사이트 CSP와 모두 충돌 → **제외**.
- **Pexels**: "By default, the API is rate-limited to 200 requests per hour and 20,000 requests per month." · 출처 표시는 선택 · 핵심 기능 복제 금지 — https://www.pexels.com/api/documentation · https://www.pexels.com/terms-of-service
- **Pixabay**: "permanent hotlinking of images … is not allowed. If you intend to use the images, please download them to your server first." · 검색 결과 24시간 캐시 의무 — https://pixabay.com/api/docs
  → Pexels·Pixabay는 **내려받아 자체 저장하는 방식**이라 우리 원칙과 맞는다. 단 둘 다 "서버에 내려받기"가 전제라 **백엔드 프록시 + 객체 저장소**가 선행 조건이다. 인물 사진의 초상권·상표 노출은 제공자 라이선스가 보증하지 않는 영역 [추정 — 제공자 라이선스 원문의 해당 조항 확인 필요].

### ④ 생성형 — 비용·권리·표시 [사실/확인 필요, 2026-09-29]

- 비용: OpenAI `gpt-image-1` 1024×1024 Low $0.011 · Medium $0.042 · High $0.167 — https://developers.openai.com/api/docs/models/gpt-image-1 (후속 모델 전환 중이라는 비공식 집계가 있어 정식 도입 시 재확인 [확인 필요]) · Black Forest Labs FLUX1.1 [pro] $0.04/장 — https://docs.bfl.ml/quick_start/pricing · Google Imagen 4 $0.02~0.06/장은 3차 자료만 확인 [확인 필요] · Adobe Firefly Services는 **공개 요금표 없음(엔터프라이즈 계약)**, 면책(indemnity)도 계약별 [확인 필요].
- 게시 조건: OpenAI Sharing & publication policy "Indicate that the content is AI-generated in a way no user could reasonably miss or misunderstand." — https://openai.com/policies/sharing-publication-policy (웹빌더가 최종 사용자 사이트에 넣는 경우까지 문자 그대로 적용되는지는 불명확 [확인 필요]).
- 저작권: 미국 저작권청 Part 2(2025-01) "the outputs of generative AI can be protected by copyright only where a human author has determined sufficient expressive elements." · 한국저작권위원회 「생성형 AI 저작권 안내서」(2023-12) — 인간 창작성이 없는 AI 산출물은 저작물로 인정되지 않음 — https://www.copyright.or.kr/information-materials/publication/research-report/view.do?brdctsno=52591
  → 사용자는 생성 이미지에 **배타적 권리를 주장할 수 없다**(경쟁사가 같은 이미지를 써도 막지 못함). 제품 고지 문구가 필요하다.
- 표시 의무: 「인공지능 발전과 신뢰 기반 조성 등에 관한 기본법」 **2026-01-22 시행** — 생성형 AI 결과물 표시 규정(딥페이크 아닌 결과물은 비가시성 워터마크도 허용) — https://www.korea.kr/news/policyNewsView.do?newsId=148958380 · 조문 번호는 2차 자료가 제31조로 인용, 원문 대조 못함 [확인 필요]. 이 의무가 "AI 서비스 제공자"인 우리에게 걸리는지, 생성 이미지가 들어간 **최종 사용자 사이트**에도 표시가 필요한지는 법무 판단 [확인 필요].
- 결론: 생성형은 **정책 문구 개정 + 표시 방식 + 키 프록시 + 사용량 원장(FR-ORG-02) + 검열 + 조직별 한도**가 모두 갖춰진 뒤의 P2 플래그다. MVP에서 켤 이유가 없다 — 시안을 "시안처럼 보이게" 하는 문제는 ①이 비용 0으로 먼저 푼다(Fable A-1 판단과 동일).

### 저장·최적화 (TRD 8절 "AVIF/WebP + srcset")

| 단계 | 방법 | 한계 [사실/추정] |
|---|---|---|
| VS-1 · M2c (브라우저) | 업로드 시 캔버스로 폭 3~4단(예: 640·1024·1600·2048) 재인코딩 → `srcset`. **재인코딩이 EXIF를 버린다**(TR-SEC-04 충족) | **Safari는 `canvas.toBlob('image/webp')` 미지원**(Safari 3.1~27 "Not supported") — https://caniuse.com/mdn-api_htmlcanvaselement_toblob_type_parameter_webp → Safari는 JPEG로 저장. AVIF 브라우저 인코딩은 WASM(`@jsquash/avif`, Apache-2.0)이 필요하고 크기가 커서 MVP 제외 [사실: https://www.npmjs.com/package/@jsquash/avif / 크기는 확인 필요] |
| 새로고침 뒤에도 남기기 | 지금은 탭 메모리뿐(SPEC 5.9 "새로고침하면 다시 골라야") → **IndexedDB**에 Blob 보관이 백엔드 없이 가능한 다음 단계 | 기기 간 공유 불가 |
| 베타 (워커) | 원본 비공개 보관 → `sharp`로 AVIF+WebP+JPEG 파생 · 픽셀 한도 40MP(압축 폭탄 방어) | `sharp` Apache-2.0, AVIF·WebP 지원 — https://www.npmjs.com/package/sharp · 하위 libvips는 LGPL-2.1+ — https://www.libvips.org (동적 링크 배포 형태 확인) |

---

## B-4. 시안 이미지 산출 — PNG/PDF를 뽑는 방법과 위치

| | (a) 브라우저 DOM→이미지 ★VS-1 | (b) 헤드리스 Chromium 워커 ★베타 정본 | (c) 관리형 브라우저 렌더링 |
|---|---|---|---|
| 방법 | 렌더 문서 안에서 `modern-screenshot`/`html-to-image`(SVG foreignObject → 캔버스) | Playwright/Puppeteer `page.screenshot({fullPage})` · `page.pdf()` | Cloudflare Browser Rendering 등 |
| 충실도 | 대부분 맞지만 한계 있음: foreignObject 렌더링 편차, CSS 카운터 복제 불가(modern-screenshot README), 웹폰트는 **같은 출처 파일이어야** 임베드 가능 | 실제 브라우저 그대로 · PDF는 `print` 미디어로 생성, 기본적으로 폰트 로드를 기다림 — https://pptr.dev/guides/pdf-generation | (b)와 같음 |
| 결정성 | 사용자 브라우저·OS에 따라 픽셀 다름 | 고정 이미지·폰트면 반복 동일 [추정] | 같음 |
| 비용·인프라 | 0 · 라이브러리는 **"PNG 내려받기" onClick에서 로드**(조작 뒤) | 워커 1종(B-5) | "$0.09 per browser hour" · 유료 플랜 월 10시간 무료 — https://developers.cloudflare.com/changelog/post/2025-07-28-br-pricing |
| 보안 | 없음 | 워커 SSRF·Chromium 패치 주기(B-5) | 사용자 콘텐츠가 제3자에게 감 → 처리 위탁 고지 |
| 버전 [사실, 2026-09-29] | `modern-screenshot` 4.7.0 MIT · `html-to-image` 1.11.13 MIT(1.11.13에서 foreignObject 회귀 이슈 #520 보고) — npm 공식 페이지 · gzip 크기는 미확인 [확인 필요, 조작 뒤라 예산 판정 밖] | | |

- 네이티브 "DOM을 이미지로" 표준 API는 아직 없다. Chrome의 HTML-in-Canvas는 실험 단계(3차 기사만 확인) [확인 필요]. Element/Region Capture는 화면 공유(`getDisplayMedia`) 기반이라 사용자 권한 대화상자가 떠 시안 캡처에 부적합 — https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API/Element_Region_Capture
- **캡처 전 모드**: 렌더 문서에 `captureMode{on}` → 모션 최종 상태 고정 · sticky header를 페이지 머리에 고정 · 선택 테두리 없음. 전체 길이 캡처는 렌더 문서 높이를 콘텐츠 높이로 늘린 뒤 한 번에.
- **추적성**: PNG `tEXt` 청크(또는 파일 이름)에 `doc_hash`·revision·library·generator 버전을 넣는다 — Fable의 정의 "시안 = (문서, 버전) 참조 + 파생물"을 파일 수준에서 지키는 가장 싼 방법. PNG 자체의 픽셀 해시는 브라우저마다 달라 동일성 판정에 쓰지 않는다.
- ★ **VS-1 = (a) 데스크톱·모바일 PNG. PDF와 카탈로그 썸네일(G9)은 (b) 워커로** — (b)는 M4 4.1 "3뷰포트 스크린샷"(QA 게이트)과 같은 워커라 추가 인프라가 아니다.

---

## B-5. 최소 백엔드·인프라 · 보안 검토 항목

### 단계별 최소 구성

| 단계 | 필요한 것 | 필요 없는 것 |
|---|---|---|
| **VS-1 · M2a~M2c** | 없음(정적 호스팅 + 렌더 문서 CORS 헤더 1줄) | API·DB·워커 |
| **M3′ 새로고침 복구** | IndexedDB(문서·이미지 Blob) — 여전히 브라우저 | 서버 |
| **베타(다중 사용자·공유·보관)** | ① 인증·조직(TR-SEC-01·02, ADR-001: 자체 구현) ② Postgres(프로젝트·스냅샷·프로필·잡·자산 메타·사용량 원장·감사) ③ S3 호환 객체 저장소(원본 비공개 / 파생본 서명 URL) ④ API 서버 ⑤ **헤드리스 Chromium 워커 1종**: PDF·썸네일·axe·Lighthouse·AVIF 변환·빌드 스팟 체크 | 생성형·스톡 프록시 |
| **P2 스톡·생성형** | ⑥ **API 프록시**(키 보관·레이트 리밋·검열·원장 기록). egress가 필요하므로 egress가 막힌 워커(TR-SEC-05)와 **분리**한다 | |

- 백엔드 언어·호스팅은 ADR-001이 "미정, ADR-002로 결정"으로 남겨 두었다. TRD 2절은 AOS FastAPI + Node 워커 구조를 적었으나 ADR-001이 AOS 의존을 끊었으므로, 이 문서는 **역할만** 정의하고 제품 선택은 하지 않는다 [확인 필요 — ADR-002].

### 보안 검토 항목 (Security 브리프 초안)

| # | 항목 | 대상 |
|---|---|---|
| S-1 | 렌더 문서 샌드박스·CSP(`script-src 'self'`·`connect-src 'none'`)·postMessage `source`/`origin` 확인·`validatePageDoc` 재검증 | B-1 |
| S-2 | 사용자 글자는 React 이스케이프/JSON 값으로만 — TSX 소스·인라인 스크립트에 문자열 삽입 0. 정적 HTML의 인라인 JSON이 있다면 `</script>`·`<!--` 이스케이프 | B-2 |
| S-3 | 킷 소스 정적 검사(eval·`dangerouslySetInnerHTML`·외부 스크립트·원격 폰트 0) + 템플릿 해시 고정 + 의존성 허용 목록(TR-SEC-06) + lockfile 고정 | B-2 |
| S-4 | 업로드: 매직바이트·확장자·크기·**픽셀 한도(압축 폭탄)**·SVG 금지·재인코딩으로 메타데이터 제거(TR-SEC-04) | B-3 |
| S-5 | 워커 Chromium: `setContent`로만 로드(URL 입력 없음) · 요청 가로채기로 허용 출처 외 전부 차단 · egress 차단 · 컨테이너 자원·시간(120s) 제한 · Chromium 보안 패치 주기 | B-4·B-5 |
| S-6 | 키 관리: 생성형·스톡 키는 프록시 환경 변수에만, 브라우저·워커·로그에 0(TR-SEC-10) · 조직별 사용 한도(비용 DoS) | B-3 |
| S-7 | 산출물 URL 서명·만료·noindex(TR-SEC-08) · 객체 키에 조직 id 접두 · 교차 조직 거부 테스트 | B-5 |
| S-8 | 라이선스 원장: 에셋·폰트·킷 변형마다 라이선스 메타 → `LICENSES.md` 자동 생성 · RFN 폰트 이름 검사 | B-2·B-3 |
| S-9 | 생성형: 프롬프트·결과 검열, 업종 제한(의료·금융), 생성 표시, 사용량 원장 | B-3 |

---

## B-6. 사실 / 추정 / 확인 필요

**사실(저장소 L1)**
- `/studio/:projectId` 91.72 / 124.31KB, 여유 0.69(멈춤선 0.3 적용 시 실사용 약 0.39) — `dev/active/editor-a3-2/REPORT.md:41-44`.
- 번들 검사는 엔트리 하나를 가정 — `app/scripts/check-bundle-size.mjs:113`.
- 모바일 미리보기 = 같은 문서 프레임 폭 — `app/src/features/studio/previewFrame.ts` · SPEC 10.3.
- 생성 홈페이지 예산 JS 90 · CSS 30 — `docs/03-trd/TRD.md:277`.
- 섹션 정의에 `render` 없음(의도) — `app/src/engine/contracts/sectionDefinition.ts:3`.
- PageDoc에 외부 URL·object URL 금지 — `app/src/engine/contracts/pageDoc.ts` `LocalImageId` 주석 · SPEC 5.9.
- 앱 폰트 = Pretendard 서브셋 · 서브셋 = Modified Version · RFN — `app/src/styles/tokens/fonts.css:5` · `docs/00-research/FONT_LICENSE_CHECK.md` 1절.

**사실(외부, 2026-09-29 확인)** — URL은 각 절 본문에 있음: Unsplash 핫링크 강제·경쟁 서비스 금지 · Pexels 200/시간·20,000/월 · Pixabay 핫링크 금지·자체 저장 · Safari 캔버스 WebP 미지원 · fflate 12.5KB gzip(전체 기능) · sharp Apache-2.0 · Cloudflare Browser Rendering $0.09/시간 · gpt-image-1 $0.011~0.167 · FLUX1.1 pro $0.04 · 미국 저작권청 Part 2 · 한국저작권위원회 안내서 · AI 기본법 2026-01-22 시행.

**추정**
- 킷 변형 4개 + 토큰 CSS가 실사용 여유 0.39KB를 넘는다(킷 미구현, a3-2 캔버스 모양표 1.28KB로 유추).
- 와이어프레임 코드를 렌더 문서로 옮기면 `/studio` 진입 직후가 순감한다.
- React zip의 빌드 보증을 라이브러리 버전별 CI로 대신할 수 있다(템플릿·킷 불변 전제).
- DOM 직렬화 정적 HTML의 결정성.

**확인 필요**
- 불투명 출처 iframe의 모듈 스크립트 CORS·`blob:` 접근 동작 — VS-1 첫 PoC(반나절 [추정]).
- `react-dom/server` 브라우저 빌드 크기(정적 HTML (b)안을 버리는 근거 보강용).
- DOM→이미지 라이브러리 gzip 크기·Safari 결과 품질.
- AI 기본법 표시 의무 조문 번호·적용 대상(서비스 제공자 vs 최종 사용자 사이트).
- Pexels·Pixabay 라이선스의 인물·상표 관련 조항 원문.
- fflate 라이선스 원문.

---

## B-7. 결정 후보 (★ = 추천)

1. ★ **렌더러 = 별도 렌더 문서(iframe, `sandbox="allow-scripts"`)** + 부모는 선택·문제 오버레이만. (대안: 조작 뒤 로드 — 예산 개정 불필요하나 첫 화면이 와이어프레임으로 남음)
2. ★ **ADR-004 개정: 렌더 문서는 생성 홈페이지 예산(JS ≤ 90 · CSS ≤ 30KB)으로 별도 판정.** 앱 예산 상수는 그대로. `check-bundle-size.mjs`의 엔트리 판정·SCENARIOS를 같은 브랜치에서 고친다.
3. ★ **문제 표시 문장은 부모 문서에 둔다**(`aria-describedby` 문서 경계 제약) — SPEC 5.7 개정 항목.
4. ★ **정적 HTML = 렌더 문서 DOM 직렬화 + 미리 컴파일한 킷 CSS + 토큰 CSS, 브라우저 단독(VS-1).** 조건 둘: (a) 킷 상호작용은 네이티브 HTML + 공용 바닐라 스크립트만(React 상태 금지, 가드 테스트) (b) **렌더러 없는(폴백) 섹션이 하나라도 있으면 HTML·zip 내보내기 차단**(SPEC 8.3.2의 `GENERATOR_UNAVAILABLE` 자리를 "렌더러 없는 섹션 N개"로), PNG는 폴백 섹션에 "구조 미리보기" 표식을 남겨 허용. 문의 폼의 정적 내보내기 동작은 Designer·Security 결정.
5. ★ **모션 프리셋 L0~L2를 CSS 우선 + 소형 IntersectionObserver 스크립트로** — `motion/react` 의존 제거(TRD 3·8절 개정). 캔버스·정적 HTML·React zip이 같은 모션을 낸다.
6. ★ **내보내기 폰트 = 원본 파일 또는 이름 바꾼 서브셋 + OFL 동봉.** 앱 서브셋을 원래 이름으로 넣지 않는다(TRD 8절 "서브셋" 문구에 RFN 조건 추가).
7. ⚖️ **React zip = 고정 템플릿 + 킷 소스 복사 + `content.json`, 빌드 보증은 라이브러리 버전별 CI 황금 프로젝트.** 성립하면 브라우저 단독으로 M2b, 아니면 Fable 안대로 M4 워커. — 교차 코멘트로 Fable과 정리.
8. ★ **MVP 이미지 = 자체 그래픽(기본) + 업로드.** 스톡(Pexels·Pixabay만, Unsplash 제외)·생성형은 P2이며 **API 프록시**가 선행 조건.
9. ★ **생성형 도입 시 PRD 원칙 2 개정**: "사용자 요청으로 생성한 AI 이미지"를 별도 범주로 두고 생성 표시·권리 고지(배타권 없음)·업종 제한을 조건으로.
10. ★ **시안 PNG = 브라우저 캡처(VS-1), PDF·카탈로그 썸네일 = 헤드리스 워커(베타).** PNG 메타데이터에 `(doc_hash, revision, library, generator)` 기록.
11. ★ **백엔드는 "VS-1까지 0 → 베타에 API·DB·객체 저장소·Chromium 워커 1종 → P2에 API 프록시" 순서.** 언어·호스팅은 ADR-002.

---

## C. 데이터 확보 — 법·기술·자동화 관점

제품 가치·규모·운영 흐름은 `claude-fable-r2.md` C-0~C-5가 정본이다. 이 절은 (1) 한국 법적 틀 (2) 경로별 **자동화 가능 범위와 그 법적 경계** (3) 만들어야 할 도구를 더한다. 법률 자문이 아니라 공개 자료를 정리한 것이다.

### C-0. 결론

1. **"공개 웹을 기계로 대량 수집"은 한국에서 형사 무죄여도 민사 책임이 남는다.** 야놀자–여기어때 사건에서 대법원은 크롤링을 형사 3개 죄목 모두 무죄로 봤지만(2021도1533), 같은 분쟁의 민사는 부정경쟁방지법 **파목(성과 도용)** 으로 10억원 배상을 인정했다. 디자인 갤러리·어워드의 큐레이션 목록은 "상당한 투자·노력의 성과"로 주장되기 쉬운 대상이다. → 제3자 갤러리 자동 수집 금지(TR-POL-02)는 약관 문제만이 아니라 **파목 위험** 때문에도 유지해야 한다.
2. **공개 웹페이지는 부정경쟁방지법 카목(데이터 부정사용)의 보호 대상이 아니라는 해설이 일관되나**, 그것이 수집을 허용한다는 뜻은 아니다 — 파목·저작권법 제93조(DB 제작자, "반복적·체계적" 복제)가 남는다.
3. **합법이면서 자동화가 되는 경로는 두 가지다.** (A) **internal 조합 자동 생성기**(경로 4) — 우리 킷·토큰의 조합을 규칙으로 대량 생성하고 게이트·다양성·Designer 표본 승인으로 거른다. 법적 위험 0, 규모 최대. (B) **소유권 확인 opt-in 자동 분석기**(경로 2 확장) — 제출자가 DNS TXT·메타 태그로 사이트 소유를 증명하면, 그 도메인**만** 워커가 방문해 추상 특징(섹션 순서·팔레트·폰트 계열·중단점·성능)을 뽑고 큐레이터가 우리 킷으로 재조립한다. 권리자 동의가 수집의 근거이므로 robots·약관·파목 문제가 사라진다.
4. **경로 (3) 추상 태그 기록은 사람 손으로만** 한다. 같은 작업을 자동화하는 순간 `external_observed` 수집 파이프라인(TRD 6.3)이 되어 법무 승인 대상이다.
5. **경로 (5) 사용자 비공개 캡처는 "사적 이용" 면책에 기대기 어렵다.** 저작권법 제30조(사적 이용 복제)는 개인·가정 범위라 에이전시의 업무용 보관에는 맞지 않고, 남는 근거는 제35조의5(공정 이용)라 사안별이다 [추정 — 법무 확인]. Fable C-5-4의 4조건(파일 업로드·조직 비공개·추천/생성 격리·URL 입력 없음)에 **보존 기한·삭제 요청 처리**를 더한다.
6. **CC BY 유래 변형은 "근거"로만 쓰고 "시드"로 쓰지 않는 편이 안전하다.** CC BY 디자인을 변형(adaptation)해 킷 변형을 만들면, 그 변형으로 만든 **모든 사용자 사이트**가 출처 표시 의무를 물려받을 수 있다 [추정 — CC BY 4.0 제3조의 "Adapted Material 공유" 조건]. MIT 코드(shadcn/ui·Flowbite OSS)는 "상당 부분"을 복사한 소스에 고지를 남기면 되므로 React zip의 `LICENSES.md`로 처리된다. → Fable C-5-6(허용 라이선스 유래 = 별도 범주·출처 표시)에 동의하되, **CC BY는 변형 근거(추상 패턴)로만, MIT는 코드 시드 허용 + 고지 전파**로 나눈다.

### C-1. 법적 틀 (한국 중심, 2026-09-29 확인)

| 근거 | 내용 | 이 제품에 주는 의미 | 출처 |
|---|---|---|---|
| 부정경쟁방지법 제2조 제1호 **파목** | "타인의 상당한 투자나 노력으로 만들어진 성과 등을 공정한 상거래 관행이나 경쟁질서에 반하는 방법으로 자신의 영업을 위하여 무단으로 사용" | 갤러리 큐레이션 목록·태그 할당 데이터의 대량 수집·재사용은 여기에 걸릴 수 있다. 추상 패턴을 사람이 관찰해 우리 방식으로 기록하는 것은 위험이 낮아진다 [추정 — 사안별 판단] | https://casenote.kr/법령/부정경쟁방지_및_영업비밀보호에_관한_법률/제2조 (2차 자료, 국가법령정보센터 원문 대조 [확인 필요]) |
| 같은 조 **카목**(데이터 부정사용, 2022-04-20 시행) | 접근 제한이 있는 유상·회원제 데이터 전제. 불특정 다수가 볼 수 있는 웹페이지·오픈데이터는 보호 대상이 아니라는 해설 | 공개 갤러리는 카목보다 파목 쪽 위험 | https://www.kimchang.com/ko/insights/detail.kc?sch_section=4&idx=24264 · nepla.ai 카목 해설(2차) |
| 대법원 2022. 5. 12. 선고 **2021도1533** | 정보통신망 침입·DB 제작자 권리 침해·업무방해 **모두 무죄**. DB권은 "상당한 부분" 판단에 제작자의 상당한 투자 여부를 본다 | 형사 위험은 낮게 보일 수 있으나 → 아래 민사 | https://casenote.kr/대법원/2021도1533 · 대법원 판례속보 https://scourt.go.kr/portal/news/NewsViewAction.work?seqnum=8456&gubun=4&type=0 |
| 같은 분쟁 **민사** | 1심·항소심 모두 부정경쟁행위(파목) 인정, 10억원 배상 | **형사 무죄 ≠ 수집 허용.** 경쟁 관계에서 남의 투자 성과를 긁어 쓰면 민사 책임 | https://www.lawtimes.co.kr/news/articleView.html?idxno=172326 · https://mobile.newsis.com/view.html?ar_id=NISX20220826_0001992019 (항소심 사건번호·확정 여부 [확인 필요]) |
| 저작권법 **제93조** | 개별 소재는 "상당한 부분"이 아니지만, "반복적이거나 특정한 목적을 위하여 체계적으로" 복제해 DB의 통상 이용과 충돌하면 상당한 부분으로 간주 | 갤러리 항목을 하나씩이라도 **체계적으로** 모으면 DB권 침해가 된다 | https://casenote.kr/법령/저작권법/제93조 |
| 저작권법 **제35조의5** | 공정한 이용(목적·성격, 종류, 비중, 시장 영향) | 사용자 비공개 캡처(경로 5)의 거의 유일한 근거 — 사안별 | https://casenote.kr/법령/저작권법/제35조의5 |
| 한국 TDM 면책 | 2026-09 현재 **입법·시행 근거를 찾지 못함**(국회 논의 자료만) | 대량 수집을 TDM 면책으로 정당화할 수 없다 | KCI 논문(논의 현황) [확인 필요 — 국가법령정보센터 개정 이력] |
| EU DSM 지침 제4조 제3항 | 권리자가 "machine-readable means"로 유보하면 TDM 예외 불가 | 해외 사이트를 다룰 때 robots·TDMRep 신호를 **유보 표시로 존중**해야 한다 | https://eur-lex.europa.eu/eli/dir/2019/790/oj/eng (검색 발췌, 원문 대조 [확인 필요]) |
| TDMRep · IETF AIPREF | TDMRep = W3C 커뮤니티 그룹 최종 보고서(2024-05, 표준 아님) · IETF AIPREF WG가 robots 확장 방식으로 표준화 진행 | 우리 워커가 방문하는 모든 경로에서 robots + `tdm-reservation` + AIPREF 신호를 읽고 **유보면 방문하지 않는다** | https://www.w3.org/community/reports/tdmrep/CG-FINAL-tdmrep-20240510/ · https://datatracker.ietf.org/group/aipref/about/ |

### C-2. 경로별 자동화 가능 범위와 법적 경계 (Fable C-2 표에 기술 열을 더함)

| 경로 | 자동화할 수 있는 것 | 사람이 해야 하는 것 | 법적 경계선 | 필요한 기술 |
|---|---|---|---|---|
| **(2) opt-in 제출 + 소유 확인 자동 분석** ★ | 도메인 소유 확인 → 워커가 **그 도메인만** 방문 → 섹션 경계 추정(랜드마크·헤딩·배경 전환)·팔레트(계산된 색 빈도)·폰트 계열·중단점·CrUX 성능 → 태그 초안 → 우리 킷 조합 후보 3개 제시 | 권리 확인서 검토(제작사 + **클라이언트** 동의) · 재조립 선택 · 제출자 승인 | 확인된 도메인 밖 요청 0 · 썸네일은 제출자 제공 이미지만 · 원본 HTML·문구·이미지 저장 0(추상 특징만) | 소유 확인(Search Console과 같은 DNS TXT·HTML 메타 태그 방식 — https://support.google.com/webmasters/answer/9008080) · SSRF 방어 워커(TR-SEC-07) · 특징 추출기 · 조사 원장 |
| **(3) 추상 태그 수동 기록** | 태그 사전·입력 폼·중복 검사·"1:1 대응 아님" 체크리스트 | **관찰과 기록 전부** | 자동 방문·스크린샷·HTML 저장 0. 자동화하면 `external_observed`(법무 승인 대상) | 큐레이터 폼 + 조사 원장(TR-POL-06) |
| **(4) internal 조합 자동 생성** ★ | 무드 8 × 밀도 2 토큰(M2 2.1) × 목적별 SectionPlan 규칙 × 변형 조합 → 수천 후보 → 게이트(R-01~R-13) 통과분 → 다양성 필터(문서 특징 거리로 중복 제거) → 워커 렌더 썸네일·axe·Lighthouse 점수 | Designer **표본 승인**(예: 10건 중 1건 정밀 검토) · 이름·업종 카피 | 위험 0. 단 **"실제 고객 사이트"처럼 보이게 표시하면 기만 광고 소지** → 카드에 "예시 조합" 표기 [추정 — 표시광고법 검토] | B-4 워커 · composer 결정적 seed(TRD 6.2) · 특징 거리 함수 |
| **(5) 사용자 비공개 캡처** | 업로드·저장·조직 격리 | — | 추천·생성·학습 입력 0 · 공유 0 · 보존 기한 · 삭제 요청 처리 · URL 입력 없음 | TR-SEC-04 업로드 파이프라인 재사용 |
| **(6) 허용 라이선스 소스** | 라이선스 메타 원장·SPDX 식별자·`LICENSES.md` 생성·"경쟁 제품 금지 조항" 체크 | 파일 단위 선별(플랫폼 대량 수집 금지) | CC BY = 근거로만 · MIT = 코드 시드 + 고지 전파 · 경쟁 금지 조항 있으면 제외(Fable C-5-5) | 라이선스 원장 |
| **(7) 공식 API** | **Figma**: 사용자가 OAuth로 **자기 파일**을 가져오면 스타일·노드에서 토큰 초안 추출 — 단 Variables REST API는 "available to full members of Enterprise orgs"(https://developers.figma.com/docs/rest-api/variables-endpoints/)라 일반 요금제는 파일 JSON의 스타일로만 [사실] · **CrUX**: 출처(origin)별 LCP·CLS·INP 등, CC BY 4.0, 150건/분 무료(https://developer.chrome.com/docs/crux/api) — opt-in 사이트의 실사용 성능 점수에 쓴다 | 가져온 뒤 재조립 | Figma 개발자 약관에서 제3자 경쟁 제품 금지 문구는 찾지 못함, AUP 원문 미확인 [확인 필요] · CrUX는 숫자만(디자인 아님) | OAuth 앱 · CrUX 키(서버) |
| (8) 통계·연구 데이터셋 | HTTP Archive·WebSight로 "업종 X의 N%가 hero+카드 3열" 같은 **분포 통계**만 | 해석 | HTTP Archive 데이터 라이선스 문구 **못 찾음** [확인 필요] · **WebUI(CMU)는 CC BY가 아니라 CMU 자체 연구자 계약 조건**(HF 라이선스 "other", `COPYRIGHT.txt`) — 상업 이용 허용 근거 없음 → 제외 | 분석 쿼리만, 카탈로그 적재 0 |

- Fable C-4 "확인 필요"의 WebUI 항목은 이것으로 정리된다: https://huggingface.co/datasets/biglab/webui-7k · https://github.com/js0nwu/webui/blob/main/COPYRIGHT.txt [사실, 전문은 사람이 한 번 더 읽을 것].

### C-3. 만들 도구 두 개 (자동화 설계)

**T-1 internal 조합 생성기(경로 4)** — A절 M2b와 같은 투자 위에 얹힌다.
```
토큰 프리셋(무드×밀도) × 목적 → composer(seed) → PageDoc 후보
  → 게이트 R-01~R-13 (차단 0만) → 다양성 필터(섹션 순서·변형·팔레트 거리)
  → 워커: 렌더 → 썸네일(3뷰포트) + axe + Lighthouse → benchmark_score(측정일·환경)
  → Designer 표본 승인 → 공개(license_status=internal, "예시 조합" 표기)
```
- 규모 [추정]: 후보 생성은 무제한, 병목은 표본 승인 — Designer 하루 2시간이면 주 50~100건 공개 가능.
- FR-GEN-03 결정성 덕에 **라이브러리 버전이 오르면 전 카탈로그를 재생성·재측정**할 수 있다(썸네일·점수가 킷 개선을 따라감). 외부 경로에는 없는 장점.

**T-2 소유 확인 opt-in 분석기(경로 2)**
```
제출(도메인 + 권리 확인서) → 소유 확인(DNS TXT 또는 메타 태그, 만료·재확인)
  → 워커가 확인된 출처만 방문(robots·TDM 유보 존중, 요청 수·속도 제한, UA 정직 표기 — TR-POL-02)
  → 추상 특징만 추출(섹션 경계·팔레트·폰트 계열·중단점) + CrUX 성능 → 원문 폐기
  → 킷 조합 후보 3개 → 큐레이터 선택 → 제출자 승인 → 공개(licensed, 제출자 썸네일, 제작사 표시)
```
- 원장: 도메인·확인 기록·권리 확인서는 `design_studio_research.ledger`(TRD 4.1 105행)에만. 생산 테이블에 URL 0(TR-POL-01) 유지.
- 회수: 제출자가 철회하면 카드 비공개 + 원장 기록(FR-CAT-05).

### C-4. 사실 / 추정 / 확인 필요

**사실(외부, 2026-09-29)**: 2021도1533 무죄 3건(casenote·대법원 판례속보) · 같은 분쟁 민사 10억원(법률신문·뉴시스) · 저작권법 제93조·제35조의5 문언(casenote) · Figma Variables REST = Enterprise 전용 · CrUX CC BY 4.0·150건/분 · TDMRep 비표준 최종 보고서 · IETF AIPREF WG 진행 · Search Console 소유 확인 방식 · WebUI 라이선스 = CMU 자체 조건(HF "other").

**추정**: 파목이 갤러리 큐레이션 데이터 수집에 적용될 가능성 · 사용자 비공개 캡처에 제30조가 맞지 않는다는 판단 · CC BY 변형의 출처 표시 의무가 사용자 사이트로 전파된다는 판단 · internal 카드의 "예시 조합" 표기 필요성 · T-1 주 50~100건.

**확인 필요**: 부정경쟁방지법 카목·파목 조문 원문(국가법령정보센터) · 야놀자 민사 항소심 사건번호·확정 여부 · 한국 TDM 면책 입법 여부 · Figma AUP 원문 · HTTP Archive 데이터 라이선스 · EU DSM 제4조 원문 대조 · 표시광고법상 "예시 조합" 표기 요건.

### C-5. 결정 후보 (★ = 추천)

1. ★ **Fable C-5-1(레퍼런스 = 검증된 조합)·C-5-2(베타 internal 14 + licensed 6 + 근거 코퍼스)에 동의.**
2. ★ **T-1 internal 조합 생성기를 M2b 종료 조건에 넣는다** — 렌더러·워커가 생기는 시점과 같다. internal 카드에 "예시 조합" 표기.
3. ★ **경로 (2)를 "소유 확인 opt-in 자동 분석(T-2)"으로 확장** — 권리 확인서(제작사 + 클라이언트) + 도메인 소유 확인 + 추상 특징만 저장. 베타 이후(워커 필요).
4. ★ **경로 (3)은 사람 손으로만.** 자동화는 `external_observed`로 보고 법무 승인 전 금지(TRD 6.3 유지).
5. ★ **워커가 외부 출처를 방문하는 모든 경로에서 robots + TDMRep + AIPREF 유보 신호를 존중**하는 것을 TR-POL-02에 추가.
6. ★ **허용 라이선스 소스: CC BY = 근거(추상 패턴)로만, MIT = 코드 시드 허용 + `LICENSES.md` 고지 전파.** WebUI(CMU)는 제외.
7. ⚖️ 경로 (5) 사용자 비공개 캡처에 **보존 기한·삭제 요청 처리**를 Fable 4조건에 더해 P1 — 법무가 제35조의5 근거를 확인한 뒤.
8. ⚖️ 위 법적 판단(파목 위험·CC BY 전파·표시광고) 전체를 **법무 검토 1회**로 묶어 M0 큐레이션 절차(계획 0.5)와 함께 확정.

---

## D. Fable R2와 맞춘 것 / 갈리는 것

| 주제 | Fable | Opus | 정리 |
|---|---|---|---|
| 시안 정의(F0~F3, PNG·코드 = 같은 `(r, L, G)` 파생물) | 제안 | **동의** — B-4 PNG 메타데이터로 파일 수준에서 지킨다 | 합의 |
| 렌더러 위치 | 별도 문서(iframe)에 킷 청크, 측정 규칙 먼저 [확인 필요] | **동의 + 측정 규칙 답**: `/studio` 91.72 / 124.31(여유 0.69, 실사용 약 0.39) → 같은 트리 불가, 렌더 문서 합계 = 생성 홈페이지 예산(90/30)으로 ADR-004 개정, 검사 스크립트 엔트리 판정 수정 | 합의(규칙 제안은 Opus) |
| 폴백 섹션이 내보내기에 섞임 | (다루지 않음 — VS-1 수용 기준 "로컬에서 열면 캔버스와 같다") | 폴백 5섹션이 HTML·PNG에 그대로 나간다 → "렌더러 없는 섹션 N개" 내보내기 차단 사유 신설 | **두 문서 공통 갭 — 교차 코멘트** |
| 킷 상호작용 | (다루지 않음) | React 상태 금지, 네이티브 HTML + 공용 바닐라 스크립트(정적 HTML 전제) | 보강 |
| 와이어프레임 폴백 | 캔버스 안에 남기고 30/30 뒤 폐기 | 폴백은 남기되 **렌더 문서 안으로** 옮겨 `/studio` 예산을 비운다 | 순서 차이 — Developer 실측으로 결정 |
| 문제 표시 재작업 | 실렌더 위 오버레이(유일한 재작업) | 동의 + **문장은 부모 문서에**(`aria-describedby`가 문서 경계를 못 넘음) | 보강 |
| React zip 시점 | M4(빌드 검증 = 워커) | **M2b 가능** — 고정 템플릿 + 데이터, 빌드 보증 = 라이브러리 버전별 CI | **갈림 — 교차 코멘트** |
| 이미지 우선순위 | 자체 그래픽 > 업로드 > 스톡 > 생성형 | 동의 + 스톡은 Pexels·Pixabay만(Unsplash 핫링크 강제로 제외), 스톡·생성형 모두 API 프록시 선행 | 합의 |
| 경로 (2) opt-in | 폼 + 권리 확인서 + 재조립 | + 도메인 소유 확인으로 **자동 분석** | 보강 |
| 경로 (6) MIT/CC BY 시드 | 허용 라이선스 유래 = 별도 범주 | CC BY = 근거로만, MIT = 시드 + 고지 전파 | 세분 |

### D-2. 교차 코멘트 뒤 실측 — ref-a 3안의 섹션 수와 VS-1 "폴백 삭제" 경로 (2026-09-29, 기준 `e4b9487`)

**방법**: 저장소 밖 스크립트(`~/.buzz/.scratch/ref_a_count.ts`, bun)로 실제 앱 경로를 그대로 탔다 — `buildProfileDraft`(보드 6건, Hero = ref-a) → `composeCandidates` → `writeStartDoc`(변형 대응표 `data/engineVariantMap.ts` 적용 + `createDocFromCandidate`) → 폴백 섹션마다 `removeSection` → `structureIssues`·`requiredSectionIssues`. 저장소 파일은 쓰지 않았다(`git status` 전후 동일).

**1. 섹션 수 [사실]** — VS-1 실렌더 4변형(`header/sticky-right-cta`·`hero/fullbleed-left`·`services/cards-3`·`footer/biz-extended`) 기준

| 목적 | A안 | B·C안 |
|---|---|---|
| none·inquiry·sales | 9섹션 = 실렌더 4 + 폴백 5 (`about/story`·`portfolio/masonry`·`testimonials/quotes-2`·`faq/accordion`·`contact/form`) | 9섹션 = 실렌더 2 + 폴백 7 (hero `center`/`grid`, services `cards-2`/`cards-masonry`) |
| booking | 10섹션 = 실렌더 4 + 폴백 6 (+`contact/booking`) | 10섹션 = 실렌더 2 + 폴백 8 |

→ Fable 정정(9섹션·폴백 5)이 맞다. 초판 B-7-4·표의 "8섹션 중 4개"를 고쳤다.

**2. Fable 수정 E2E "차단 → 폴백 5개 삭제 → 다시 내려받기 → 성공"은 성립하지 않는다 [사실]**
- 폴백 5개를 지우면 본문이 hero·services **2개**만 남아 R-01(본문 5~9, `engine/gate/requiredSections.ts:48`, `block`)에 걸린다. 차단 사유만 "렌더러 없는 섹션"에서 "본문 섹션이 2개입니다 (R-01)"로 바뀔 뿐 내려받기는 여전히 막힌다.
- `removeSection` 자체는 본문 하한을 막지 않는다(삭제는 되고 게이트에서 걸린다). 목적이 inquiry면 `contact/form` 삭제가 R-03으로, booking이면 `contact/booking` 삭제가 R-04로 거부된다.

**3. 최소 수정안 [사실 — 같은 스크립트로 확인]**: VS-1 실렌더를 **7변형**으로 늘린다 — `about/story`·`faq/accordion`·`contact/form` 추가. 그 뒤 A안에서 폴백 2개(`portfolio/masonry`·`testimonials/quotes-2`)만 지우면 본문 5개(hero·about·services·faq·contact)로 none·inquiry·sales 모두 구조 이슈 0. booking은 `contact/booking`이 남아 여전히 폴백 1 → **VS-1 E2E 목적은 none 또는 inquiry로 고정**.
- 곁이득: `faq/accordion`은 `<details>`로 짜면 "킷 상호작용 = 네이티브 HTML" 규칙을 VS-1에서 바로 검증한다. `contact/form`은 inquiry 목적 필수 섹션(R-03)이라 VS-1이 목적 규칙까지 덮는다.
- 비용 [추정]: 개발계획서 8행 가정(변형 1개 제작·QA 0.5일)으로 +1.5일 → VS-1 1.5~2주 → 약 2주.
- 대안: 4변형 유지 + PNG만 수용 기준(정적 HTML 성공 경로는 M2b로) — 첫 "코드" 산출이 M2b로 밀려 비추천.

