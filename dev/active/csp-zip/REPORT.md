# CSP-2 REPORT — 정적 zip·React zip CSP (E0 실측 → E1 구현)

- 브랜치 `k002bill2/csp-zip` · base `4e2cf602`(origin/main, PR #57 static-html CSP 포함) · 정본 CSP-SPEC r1 + 5a
- 상태: **초안(E0 완료)** — E1 구현 진행 중

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
(진행 중)
