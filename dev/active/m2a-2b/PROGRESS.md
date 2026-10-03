# M2A-2b PROGRESS — 데스크톱 1280 프레임 + 본문 4변형 + 캡션·변형 목록 표시 + 웹폰트 정리

## 수신 기록
- 2026-10-03 14:34 KST 수신. 브리프 `docs/06-handoff/M2A-2B_BODY-VARIANTS_BRIEF.md` 전체 읽음(58행).
- 시작 커밋: `fdb5a06` (브랜치 `k002bill2/m2a-2b`, worktree `orca/workspaces/web-builder-solution/m2a-2b`)
- 서브에이전트: 금지(브리프 "분할 불필요 — 금지 유지"). 포트 4337(127.0.0.1). 로컬 커밋만(`git commit -- <경로>`), push·병합·삭제 없음.
- 읽은 근거: m2a SPEC 0절·K1-3~6·K2·3.2 C·3.4·4.1 · 2a-05 SPEC r4.9·r4.10 · m2a-2a REPORT 2·3·7·8절.

## 단계
- [x] B0 기준선 — `B0-BASELINE.md` · shots/b0-* (iframe 1280 창 721 · error 0)
- [x] B1 데스크톱 프레임 1280 — FRAME_REM.desktop 80 · 오버레이를 축소 층 밖으로(사각형 × 비율) · RED b13159f · 브라우저 1280(56%)·1024(53%) 선택 상자 = iframe 원점 + 사각형×비율 일치, 렌더 header 폭 1253(스크롤바 축소분) · bar nav 보고 · 가로 스크롤 0 (logs/b1-shots.txt · shots/b1-*)
- [ ] B2 about/story (K-AC-22·23·24)
- [ ] B3 services/cards-3 · 카드 톤 변수 (K-AC-25·26)
- [ ] B4 faq/accordion (K-AC-27·28)
- [ ] B5 contact/form · K2 A안 · 주인용 안내 (K-AC-08 마크업·29·30 배치)
- [ ] B6 캔버스 캡션 3상태 · "페이지 미리보기"(이관 표)
- [ ] B7 변형 목록 표시 · 키 목록 = 킷 레지스트리 가드
- [ ] B8 렌더 문서 웹폰트 제거
- [ ] B9 공통 K-AC
- [ ] B10 브라우저 1280·390 캡처 · [B] 수치
- [ ] B11 전체 vitest ×3 · Codex 1회 · REPORT · 4337 서버 종료

## 서브에이전트
- 사용 0 (브리프 금지)

## 메모
- /studio 진입 누계: B0 124.23 → B1 124.24
- 렌더 JS 누계: B0 78.86 → B1 78.86
