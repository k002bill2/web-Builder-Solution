# M2A-2b — 데스크톱 1280 프레임 + 본문 4변형 실렌더 + 캔버스 캡션·변형 목록 표시 (Developer)

- 책임 Developer / 실행 Orca + Claude Code · 보고 Jarvis · 포트 4337(127.0.0.1) · `--max-turns` 110 · `--effort` medium · **85턴부터 REPORT 우선**
- 서브에이전트 분할: 불필요 — 429 이력으로 이 프로젝트는 금지 유지
- 대상 저장소 `/Users/younghwankang/Work/web-builder-solution`(레인 worktree) · 시작 커밋 = 이 브리프가 들어 있는 main
- 선행: M2A-2a 병합 ✅(`7627f10`, 킷 기반 + header·hero·footer) · 2a-05 SPEC **r4.10**(데스크톱 프레임 = 1280)
- 다음 레인: M2A-3 = PNG · 정적 HTML · `UNRENDERED_SECTIONS` · 내보내기 버튼. 이 레인은 M2A-3 범위를 미리 만들지 않는다.

## 목적
VS-1 실렌더 7변형을 완성한다(본문 4변형 추가). 이 레인이 끝나면 **A안 · 목적 none/inquiry 문서는 portfolio·testimonials 2개만 폴백**으로 남고, "데스크톱" 미리보기가 실제 1280 배치(축소 보기)로 보인다.

## 근거 (먼저 읽기 — 절·행 번호로 인용)
- **`docs/design/m2a/SPEC.md`** 0절(공통 규약) · **K1-3 about/story · K1-4 services/cards-3 · K1-5 faq/accordion · K1-6 contact/form** · **2절 K2(문의 폼 A안)** · **3.2 C(변형 목록 표시)** · **3.4(캡션 3상태 · "페이지 미리보기")** · 4.1 K-AC
- `docs/design/2a-05/SPEC.md` **r4.9**(MQ-1~5) · **r4.10**(데스크톱 프레임 1280) · 5.7 · E-S31 · E-AC-15
- `dev/active/m2a-2a/REPORT.md` 2절(킷 토큰 변수) · 3절(메시지) · 7절(명세 차이 — 특히 8 [B] 판정 장소) · **8절(넘겨받은 항목)**
- `dev/active/m2a-1/logs/f1-diagnosis.txt` — **브라우저 캡처는 fullPage 금지, iframe `scrollIntoView` + 뷰포트 캡처**
- 코드: `app/src/kit/`(registry · tokens · Media · 3변형 · kit.css) · `app/src/render/` · `app/src/features/studio/previewFrame.ts` · `app/src/components/studio/{StructureCanvas,VariantOptions,VariantSwitch}.tsx` · `app/src/engine/sections/bodySections.ts`

## 범위 (단계 = 체크포인트, RED→GREEN 커밋 + PROGRESS 갱신)
- **B0 기준선**: 번들 표(앱 모든 화면 + 렌더 문서 JS·CSS) · A안 1280·390 뷰포트 캡처 `dev/active/m2a-2b/shots/b0-*.png`.
- **B1 데스크톱 프레임 1280 (r4.10)**: `FRAME_REM.desktop` = 1280 폭(80rem). 열보다 넓으면 기존 `previewScale`·축소 캡션으로 맞추고 가로 스크롤 0. **오버레이(선택 칩·테두리·문제 표시·배지)가 축소 뒤에도 섹션에 정확히 맞는지** 테스트(RED 먼저) + 브라우저 확인(1280 창 · 1024 창). 렌더 문서는 1280에서 `lg` 이상 배치(메뉴 펼침·CTA 바 오른쪽)로 그려져야 한다. E-AC-15 단언 유지(라벨·문서·선택 유지·축소 캡션).
- **B2 about/story (K1-3)** — 2단 ↔ 1단 · 이미지 비율 = `--site-media-ratio`(없으면 4:5) · 이미지 끔 배치(K-AC-22·23·24).
- **B3 services/cards-3 (K1-4)** — 카드 3개 같은 행·높이 / 390 3행 · **카드 톤 변수**(light/dark × 섹션 톤 base/alt, M2A-2a 8절 6) · 카드 모양 4종(K-AC-25·26).
- **B4 faq/accordion (K1-5)** — `details/summary`(닫힘 기본 · `name` 0 · 헤딩 0) · 빈 질문·답 규칙(K-AC-27·28).
- **B5 contact/form (K1-6 · K2 A안)** — `fieldset disabled` + 방문자 안내 문구(`aria-describedby`) · `action`·`placeholder` 0 · 보이는 `label` 연결 · 동의 체크박스 · 2단 ↔ 1단(K-AC-08의 마크업 부분 · 29 · 30의 배치 부분). **사이트 주인용 안내**(K2 "편집기 패널 Callout")는 contact 섹션 편집 패널에 두되 앱 DS·`components/studio/` 규칙을 따른다.
- **B6 캔버스 캡션 3상태 · 이름 (3.4 · K-AC-33)**: `CANVAS_CAPTION` → 문서 상태별 3문구(모두 폴백 / 일부 실렌더 / 모두 실렌더), "시안" 단어 0. 캔버스 스크롤 영역 접근 이름·390 캔버스 `h2` = **"페이지 미리보기"**. 기존 "구조 미리보기" 이름을 보던 테스트는 같은 단언을 새 이름으로 옮긴다(삭제·약화 0, REPORT에 이관 표).
- **B7 변형 목록 표시 (3.2 C · MQ-3)**: 변형 교체 목록에서 렌더러 없는 변형 이름 뒤 " · 구조 미리보기". 부모는 **킷을 import하지 않는다** — 렌더러 있는 변형 키 목록(데이터 상수)을 앱 쪽에 두고, 그 목록 = 킷 레지스트리 키임을 **가드 테스트**로 대조한다. 캡션(B6)의 실렌더 개수 판정도 같은 목록을 쓴다.
- **B8 웹폰트 정리 (m2a 0.4 · M2A-2a 8절 4)**: 렌더 문서가 앱 `fonts.css`(웹폰트 4종)를 싣지 않게 한다. 킷 글꼴 = 프로필 계열 이름 + 시스템 대체 스택(이미 `--site-font`). 폴백 와이어프레임 글자도 같은 스택이면 된다. 렌더 CSS 크기·폰트 요청 수 전후를 REPORT에.
- **B9 공통 K-AC (새 4변형 포함 문서)**: K-AC-02·03·04·05·09·11·16·36 + 15(축소 보기 상태에서 재확인). 대비 11·36은 픽스처 프로필 2개 이상, 섹션 톤 base/alt 둘 다.
- **B10 브라우저 확인**: vite dev 127.0.0.1:4337. (a) 앱 흐름 A안 문서(목적 none 또는 inquiry) 1280 창·390 창 뷰포트 캡처 `shots/b10-*.png` — portfolio·testimonials만 폴백인지 · 1280에서 데스크톱 배치·축소 캡션 · B0와 나란히. (b) [B] 수치는 M2A-2a와 같은 방법(render.html 최상위 + 샘플 문서, `k9b.mjs` 방식).
- **B11** 전체 vitest 3회 · Codex `review --scope branch --base <시작 커밋>` 1회 · REPORT.

## 제외
- PNG · 정적 HTML · `UNRENDERED_SECTIONS` · 내보내기 버튼·차단 문구 · K-AC-06·12(이동)·17·18·19·32·34 · K-AC-08·30의 정적 HTML 부분 → **M2A-3**
- 오버레이 문제 문장이 렌더 글자 위에 겹치는 문제 → Designer 시각 QA 결정 대기. **바꾸지 않는다**(B10 캡처에서 보이면 REPORT에 기록).
- 이미지 업로드·보관소(A3-3) · 나머지 23변형(M2b) · 엔진 계약 변경.

## 번들
- 렌더 문서: JS 멈춤선 **89.70**(지금 78.86) · CSS ≤ 30(지금 5.76). 4변형 예상 +2~3KB [추정]. 넘을 것으로 보이면 예산을 바꾸지 않고 멈춰 보고.
- 앱: `/studio/:projectId` 첫 ≤ 99.40 · **진입 ≤ 124.70(지금 124.23 — 여유 0.47)**. 부모 쪽 추가(변형 키 목록 · 캡션 3문구 · 주인용 Callout)는 이 안에 들어가야 한다. 넘칠 것 같으면 주인용 Callout·캡션 문구를 조작 뒤 청크로 옮기는 안을 먼저 실측하고, 그래도 넘으면 멈춰 보고. 그 밖 화면·공통 ±0.03.
- 렌더 빌드가 청크를 나누게 되면 Codex P2(manifest 병합 키 충돌, `check-bundle-size.mjs:103`)를 이 레인에서 고친다(두 manifest 분리 계산 + 테스트). 나누지 않으면 손대지 않는다.

## 공통 규칙
- 판단 순서 ADR-003. 명세(m2a SPEC)와 다르게 한 곳은 REPORT에 한 줄 사유.
- TDD RED→GREEN(RED 로그 커밋). 단언 약화·skip 금지(이관은 같은 단언 — 표로 증명). **새 의존성 0 · 새 아이콘 0.** 엔진 계약 변경 0. `import type`. 상태 지우기 `navigate(replace)` 금지. 킷 가드(K-AC-01·07) 유지.
- `design/`·`docs/design/`·`docs/decisions/` 수정 금지. fable 무접촉. 커밋은 `git commit -- <경로>`.
- **체크포인트 게이트(매 코드 커밋)**: 표적 test + `npx vitest run src/test` + typecheck + lint + build. `dev/active/m2a-2a/gate.sh`를 복사해 `dev/active/m2a-2b/gate.sh`로 써도 된다.
- 로컬 커밋만. push·병합·삭제 금지. 서버는 127.0.0.1:4337, **끝날 때 자기가 띄운 서버 PID 종료**.
- PROGRESS `dev/active/m2a-2b/PROGRESS.md` · REPORT `dev/active/m2a-2b/REPORT.md`: 커밋 표 · 데스크톱 프레임·오버레이 정렬 방법 · 카드 톤 변수 · K-AC 판정(번호별) · 테스트 이관 표 · 번들 표(체크포인트별) · 웹폰트 전후 · 명세 차이 · 남은 위험(M2A-3에 넘길 것).

## 수용 기준
1. A안 문서(목적 none/inquiry)에서 header·hero·about·services·faq·contact·footer = 킷, portfolio·testimonials = 폴백 + 표식(B10 캡처).
2. 1280 창 "데스크톱" = 렌더 문서 1280 배치 + 축소 캡션 · 오버레이 정렬 테스트 GREEN.
3. K-AC 22~30(정적 HTML 부분 제외)·33·15 및 공통 K-AC 판정 완료. 변형 키 목록 = 킷 레지스트리 가드 GREEN.
4. 렌더 문서 JS ≤ 89.70 · 앱 예산 안. 전체 vitest 3회 통과. 4337 서버 종료.

## 확정
- M2A-0 명세 · 2a-05 SPEC r4.9·r4.10 · 영환님 "★A, M2A-2b 브리프"(2026-10-03).
