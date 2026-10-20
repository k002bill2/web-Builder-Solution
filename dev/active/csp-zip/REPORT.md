# CSP-2 REPORT — 정적 zip·React zip CSP (E0 실측 → E1 구현)

- 브랜치 `k002bill2/csp-zip` · base `4e2cf602`(origin/main, PR #57 static-html CSP 포함) · 정본 CSP-SPEC r1 + 5a
- 상태: **E1 구현 완료 · 게이트·Codex 결과는 아래**

## E0 실측 결과

산출 경로: 임시 vitest 파일(커밋 0)이 `m2(referenceRenderInput("ref-a"))`(이미지 webp·jpg·png · Pretendard 실제 글꼴) + 앱 `npm run build`의 `render-*.css`(`stripFontFaces`)로 `$TMPDIR/csp-e0/`에 정적 zip·static-html·React zip을 썼다. 임시 CSP = `patches/`만(`insert-static-csp.py` · `vite.config.e0.ts`) — 소스 변경 0.
측정: ego-browser(Chromium) · `scripts/e0-measure.mjs` — `Page.addScriptToEvaluateOnNewDocument`로 `securitypolicyviolation` 리스너를 로드 전에 설치 · 1280 로드(이미지 complete·naturalWidth · `document.fonts`) · 390 메뉴(햄버거 → 시트 열림 → 시트 안 앵커 탭 → 닫힘·hash) · **양성 대조**(해시 밖 인라인 script 주입 → 위반 기록·미실행이어야 리스너가 살아 있다는 증거).

| 대상 | CSP meta | 이미지 | 글꼴 | 390 메뉴(열림 → 앵커 → 닫힘) | 위반(로드+메뉴) | 양성 대조 | 로그 |
|---|---|---|---|---|---|---|---|
| 정적 zip + 임시 `STATIC_CSP_ZIP`, `file://` | 1 | 4/4 | Pretendard 400·700 loaded | 열림 → `#s-contact-1` → **닫힘** | **0** | 위반 1(`script-src-elem` inline) · 미실행 | `logs/e0-r3-file.txt` |
| 정적 zip 무CSP 대조, `file://` | 0 | 4/4 | loaded | 닫힘 | 0 | 실행됨 · 위반 0(CSP 없음 = 정상) | 같은 파일 |
| static-html(현행 `STATIC_CSP_HTML`), `file://` — R1 위반·R5 재확인 | 1 | 4/4(data:) | loaded | **닫힘** | **0** | 위반 1 · 미실행 | 같은 파일 |
| React zip(CQ-04 A 임시 vite.config) docker `node:22` 빌드 → `vite preview` 4399 | 1(head 첫 자식) | 4/4(스크롤 뒤 — 1장은 화면 밖 lazy) | loaded | **닫힘** | **0** | 위반 1 · 미실행 | `logs/e0-c1-*.txt` |

- **CSP-AC-R3 → CQ-03 A 확정**: Chromium `file://`에서 `img-src 'self'`·`font-src 'self'`가 같은 폴더 `assets/*`를 허용(이미지·글꼴·메뉴 모두 무CSP 대조와 같음). → 정적 zip CSP 구현(`STATIC_CSP_ZIP`). Safari·Firefox `file://`는 미측정(관찰 항목, [미확인]).
- **CSP-AC-C1 → CQ-05 A 확정**: docker `node:22`(v22 · npm 10.9.9) `npm ci && npm run build` exit 0 · `dist/index.html` CSP meta 1개 · head 첫 자식(`head-prepend`) · 인라인 `<script>` 0(모듈 `src` 1 + stylesheet `link` 1) · preview 로드·메뉴 위반 0 → `style-src 'self'` 유지. React `style` prop(루트 `--site-*` 등 `[style]` 4개)은 CSSOM 적용이라 위반 0 — 루트 `--site-primary` 계산값 `#8B5E3C` 적용 확인.
- CQ-06 A 근거 관찰: 이 문서의 이미지(각 < 4KB)는 Vite 기본 inline으로 JS 안 `data:`가 됐다 → `img-src 'self' data:` 필요(빼면 이미지가 막힌다).
- preview 1280 첫 대기 타임아웃 1건 = 화면 밖 `loading="lazy"` 이미지 미완료(`logs/e0-c1-preview-lazy.txt`: 스크롤 뒤 4/4 complete) — CSP 무관.
- static-html R1 위반 0 · R5 시트 닫힘: CSP-1 QA가 "stdout 부재로 미확인"이라 한 2건을 이번엔 양성 대조와 함께 로그로 남겼다(B-SEC-08 교훈).
- preview 종료 뒤 `docker ps` 0 · `lsof -iTCP:4399 -sTCP:LISTEN` 0(`logs/e0-c1-preview.txt` 끝).
- 예산 base(이 worktree `npm run build`, `logs/e0-base-build.txt`): `/studio` 128.76KB · 복원 131.76KB(BRIEF 131.75 — 흔들림 ±0.01) · 렌더 JS 84.30/90 · CSS 8.89/30.

## E1 구현

### 변경 파일
- `app/src/features/studio/staticHtml/staticMarkup.ts` — `STATIC_CSP_ZIP`(CSP-SPEC 1.2 · 해시 템플릿 리터럴) · zip 대상 head에도 charset 다음 CSP meta · `assertStaticHead` = target별 정책 정확히 1개(교차 정책 = throw) · F-14 고정 목록에 `STATIC_CSP_ZIP` · 머리 주석
- `app/src/features/studio/reactZip/templates.ts` — `REACT_ZIP_CSP`(1.3.2) · `VITE_CONFIG` = 인라인 plugin `site-csp`(`apply: "build"` · `transformIndexHtml` → meta `head-prepend`) · `type Plugin` 주석(새 의존성 0, `package.json`·lock 불변)
- 테스트: `staticHtml/staticCspZip.test.ts`(신규 12) · `reactZip/reactZipCsp.test.ts`(신규 4) · `staticHtml/staticCsp.test.ts`(1단계 "zip meta 0" 단언 2곳을 2단계 계약으로 교체) · `__fixtures__/csp-base-zip-assets.html`(구현 **전** base 생성기 출력)
- 문서: EXPORT-SPEC F-07·F-15·7.1 · REACTZIP-SPEC 2.1 트리·2.4 허용표·RZ-AC-C1 재실행 조건 · BACKLOG B-SEC-04 ✅ · B-SEC-08 해소 표시

### 수용 기준
| AC | 결과 | 증거 |
|---|---|---|
| CSP-AC-02 | 통과 | zip-basic·zip-assets: meta 1 · `children[1]` · content = SPEC 1.2 문자 동일 |
| CSP-AC-04(zip) | 통과 | 재파싱 유일 script sha256 = zip 정책 안 해시 · 정책 해시 = 상수 |
| CSP-AC-06(zip) | 통과 | 정상 통과 · html 정책 교차·content 1글자·누락·refresh·CSP 중복·base·link·위치 → throw |
| CSP-AC-07(zip) | 통과 | meta 1개 제거 = base 픽스처 바이트 동일(zip-basic = CSP-1 픽스처 무변경 · zip-assets = 이번 RED 커밋에서 base 코드로 기록) |
| CSP-AC-08(zip) | 통과 | 지시어 집합 = 1.2 표 · `data:`·http(s)·`*`·`'unsafe-eval'`·브랜드 0 |
| CSP-AC-09 | 통과 | `REACT_ZIP_CSP` = SPEC 1.3.2 · `VITE_CONFIG`에 CSP 1회·`apply: "build"`·`head-prepend`·`plugins: [react(), tailwindcss(), csp]` · 템플릿 본문을 실행해 `transformIndexHtml()` 반환 = meta 태그 1개 · 소스 `index.html` `http-equiv` 0 · 허용표(바이트 동일)는 기존 `checkReactZipEntries`가 `VITE_CONFIG` 상수로 계속 대조 |
| CSP-AC-10 | 게이트 절 참조 | `npm run build` 예산 출력 |
| CSP-AC-11 | 통과(범위 주의) | 킷 CSS 원문(`kit.css`·`motion.css`) + zip 픽스처 → head `<style>`·`style` 속성·`img src`의 `data:` 0 · 판정 함수가 `url(data:…)`를 잡는 양성 대조. **한계**: vitest엔 Tailwind 빌드 CSS가 없어 원문만 검사 — 빌드된 render CSS는 E0 산출 `index.html`에서 `url()` 2개 모두 `assets/fonts/*`로 확인 |
| CSP-AC-C1 | 통과 | **실제 생성기** zip(`e0Out` 임시 테스트로 재생성)을 docker `node:22` `npm ci && npm run build` exit 0 · `dist/index.html` meta 1 · head 첫 자식 · 인라인 script 0(`logs/e1-c1-docker-build.txt`) · preview 위반 0(`logs/e1-r4-preview.txt`) |
| CSP-AC-C2 | 통과 | 같은 zip `vite` dev(4399): HTML `http-equiv` 0 · `/@vite/client` 1 · react-refresh 인라인 프리앰블 1(SPEC 1.3.1 추정 ① 실증 — 소스에 CSP를 넣었으면 막혔을 것) · 첫 화면 `[data-site-root]`·섹션 10 · `docker exec`로 `src/index.css`에 규칙 추가 → **새로고침 없이** outline `rgb(1, 2, 3)` 반영(HMR) (`logs/e1-c2-dev.txt`) |
| CSP-AC-R3 | 통과(Chromium) | E0 표 — `file://` 이미지·글꼴·메뉴 · 위반 0 · Safari·Firefox [미확인] |
| CSP-AC-R4 | 통과(범위 주의) | preview 390: 햄버거 → 시트 열림 → `#s-contact-1` → 닫힘 + hash 이동 · 위반 0 · 양성 대조 위반 1·미실행. **REACTZIP 4.1 대조는 SSR 단위(`fidelity.test.tsx`, 전체 테스트에 포함)만** — 라이브 픽셀 대조는 하지 않았다 |
| CSP-AC-R2 | 미실행 | BRIEF E1 범위 밖(정적 zip 웹서버 열람). `'self'` 범위는 R3 `file://`이 더 엄격한 조건 |

### 스펙과 다르게 한 부분 (사유 한 줄씩)
- `VITE_CONFIG`의 plugin 객체에 `const csp: Plugin` 타입 주석 — SPEC 1.3.1 모양은 주석 없음. 리터럴 `"build"`·`"head-prepend"` 좁힘을 타입으로 보장(산출 tsconfig `include: ["src"]`라 빌드 영향 0, 런타임 동일).
- E0 측정 빌드는 `patches/vite.config.e0.ts`(`as const` 판) — 증거 불인정 원칙(4.2.5)대로 E1에서 실제 생성기 산출로 C1·C2·R4를 다시 돌렸다.
- 산출 경로 = vitest 임시 파일(`e0Out.tmp.test.ts`, 커밋 0 · 게이트 전 삭제) — 앱 버튼 경로가 아니다. React zip 이미지 문서는 m2 픽스처(1×1 이미지) · 정적 zip CSS = 앱 빌드 `render-*.css`.
