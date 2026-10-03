# M2A-2b PROGRESS — 데스크톱 1280 프레임 + 본문 4변형 + 캡션·변형 목록 표시 + 웹폰트 정리

## 수신 기록
- 2026-10-03 14:34 KST 수신. 브리프 `docs/06-handoff/M2A-2B_BODY-VARIANTS_BRIEF.md` 전체 읽음(58행).
- 시작 커밋: `fdb5a06` (브랜치 `k002bill2/m2a-2b`, worktree `orca/workspaces/web-builder-solution/m2a-2b`)
- 서브에이전트: 금지(브리프 "분할 불필요 — 금지 유지"). 포트 4337(127.0.0.1). 로컬 커밋만(`git commit -- <경로>`), push·병합·삭제 없음.
- 읽은 근거: m2a SPEC 0절·K1-3~6·K2·3.2 C·3.4·4.1 · 2a-05 SPEC r4.9·r4.10 · m2a-2a REPORT 2·3·7·8절.

## 단계
- [x] B0 기준선 — `B0-BASELINE.md` · shots/b0-* (iframe 1280 창 721 · error 0)
- [x] B1 데스크톱 프레임 1280 — FRAME_REM.desktop 80 · 오버레이를 축소 층 밖으로(사각형 × 비율) · RED b13159f · 브라우저 1280(56%)·1024(53%) 선택 상자 = iframe 원점 + 사각형×비율 일치, 렌더 header 폭 1253(스크롤바 축소분) · bar nav 보고 · 가로 스크롤 0 (logs/b1-shots.txt · shots/b1-*)
- [x] B2 about/story — kit/AboutStory · kit/body(면·제목 id) · KitSectionProps.mediaRatio · RED e1a0213 (레지스트리·kitCommon 개수는 레지스트리 증가 반영)
- [x] B3 services/cards-3 — kit/ServicesCards3 · 카드 톤 변수 --site-card-face-base/alt·--site-card-top · --kit-soft(base muted/alt ink) · RED 커밋 · 이관: kitCommon K-AC-09 h3(카드)·K-AC-11 색 집합(+--kit-soft, muted는 base만)
- [x] B4 faq/accordion — kit/FaqAccordion(details/summary · open·name 0 · 빈 질문 생략) · summary 포커스 링 공통 규칙 포함
- [x] B5 contact/form — kit/ContactForm(fieldset disabled · 안내 aria-describedby · action·placeholder 0 · label for/id · 동의 · 비활성 색 직접 지정) · 주인용 안내 = EditFields contact/form 선택 시 Callout info(eager, /studio +0.16)
- [x] B6 캡션 3상태(features/studio/canvasCaption) · "페이지 미리보기"(h2·region·iframe 이름) · RENDERED_VARIANTS + 가드(src/test/renderedVariants) · 주인용 안내 → 조작 뒤 청크 ContactOwnerNote(Callout은 prop — DS import 시 125.10 실측) · /studio 진입 124.81 → 124.69
- [ ] B7 변형 목록 표시 · 키 목록 = 킷 레지스트리 가드
- [ ] B8 렌더 문서 웹폰트 제거
- [ ] B9 공통 K-AC
- [ ] B10 브라우저 1280·390 캡처 · [B] 수치
- [ ] B11 전체 vitest ×3 · Codex 1회 · REPORT · 4337 서버 종료

## 서브에이전트
- 사용 0 (브리프 금지)

## 메모
- /studio 진입 누계: B0 124.23 → B1 124.24 → B2 124.24 → B3 124.24 → B4 124.24 → B5 124.40 → B6 124.81(초과) → lazy 안내 + 축소 124.69
- 렌더 JS/CSS 누계: B0 78.86/5.76 → B1 78.86/5.76 → B2 79.07/5.97 → B3 79.30/6.14 → B4 79.43/6.23 → B5 79.89/6.48 → B6 79.89/6.48
- B5 중 CanvasPalette.test '프로필 없음 → 중립 토큰' 1회 실패(동시 실행 부하) → 단독 재실행 2회 통과. 전체 3회(B11)에서 다시 본다
- B6 게이트 1차에서 src/pages 쪽 1건 부하 실패(StudioShell 'Tab 정지' 단독 2회 통과) — 재게이트 467/467
