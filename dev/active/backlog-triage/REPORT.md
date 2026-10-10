# BACKLOG-TRIAGE REPORT — 열린 백로그 실상태 판정 (2026-10-10, base main `46b85af`)

- 방법: 정적 근거만(코드 grep·`git log --grep`/`-S`·테스트 유무). 실브라우저 재현 0. `app/` 수정 0.
- 서브에이전트 분할: 미사용 — 15분 시간 예산 안에서 grep 수십 건으로 끝나 분할 이득보다 통합 비용이 컸다(브리프 "권장"에서 이탈, 사유 기록).
- 요약: 22건 중 **닫힘 7** · 열림-코드 수정만 3 · 열림-결정 필요 6 · 열림-실화면 QA 재검만 6.

## 판정 표

| 항목 | 판정 | 근거 |
|---|---|---|
| D-QA01 | 열림-실화면 QA 재검만 | 캡처 도구 아티팩트 추정 건 — 뷰포트 단위 캡처 재확인이 종결 조건. 코드 근거 없음(`DraftSummaryBar.test.tsx:7`의 D-QA01은 역상 클래스 건으로 별개 언급) |
| B-DET-02 | **닫힘** `5dcd61a` | `DetailSidebar.tsx:144` `line-clamp-2` + 전체 이름 툴팁, `ReferenceDetailPage.test.tsx:424` 단언 |
| B-DOC-01 | **닫힘** `9894207` | `CLAUDE.md:58` 규칙 3이 이미 ADR-003 문구("구조·정보 위계·톤의 기준, px 아님"). `git log -S"충실히 옮긴다"` = `9894207`에서 제거 |
| B-M2B-01 | **닫힘** `da802bb` (M2C-3) | `ImageSlotField.tsx:280-282` `map` 슬롯 권리 안내 문장, `ImageSlotPanel.test.tsx:74,78` 단언 |
| B-M2B-02 | 열림-코드 수정만 | 편집기 쪽에 "가운뎃점" 도움말 없음(`kit/text.ts:16`·`kit/ServicesList.tsx:8` 주석만). 커밋 없음 |
| B-M2B-03 | 열림-코드 수정만 | `ContactOwnerNote.tsx:4,12` 문구가 "문의" 고정 — 예약(contact/booking) 변형 문구 없음. 커밋 없음 |
| B-M2B-04 | 열림-코드 수정만 (정적 근거, 요청 실측은 QA) | `FallbackCanvas.tsx:43` `ds-heading1`/`ds-body1-strong`, `:64` `font-bold` 그대로 · `siteFonts.ts:9,16` 커밋 굵기 400·700만. 수정 커밋 없음(원 근거 `siteFonts.ts:27`은 현재 `siteFaces`로 이동) |
| B-M2B-05 | 열림-결정 필요(엔진 계약·저장 검증·내보내기 → 영환님 승인) | `typeScale`은 `composeCandidates.ts`·`CandidateCard.tsx` 표시용에만 존재, 편집 문서·킷 토큰 전달 없음 |
| B-M2B-09 | 열림-실화면 QA 재검만 | 포그라운드 Chrome·Safari·Firefox 실측 필요. 관련 커밋 없음 |
| B-M2C-01 | 열림-결정 필요(상한·전송 방식·사전 안내 — 렌더 계약/M4 zip) | `render/htmlMessage.ts:8` `HTML_MAX = 8_000_000` 그대로 |
| B-M2C-09 ②③ | 열림-실화면 QA 재검만 | ① 닫힘(`35bcb1e`). ② 나머지 변형·태블릿/모바일 폭 ③ 캔버스 픽셀 대조 — 코드 근거 대상 아님 |
| B-ER-01 | 열림-결정 필요(Designer — "새로 시작" UI) | 프로필 화면 "새로 시작" UI 없음. `SnapshotDialog.tsx:8` 사유 라벨 `restart`만 존재 |
| B-ER-02 | **닫힘** `7887bf1` (ER-3a) | `memoryProjectRepository.test.ts:273` `resolveConflict` describe |
| B-ER-04 | **닫힘** `e2301c4`·`70bae59` (ER-4) | `StudioLayout.tsx:239` 포커스 = `studio-theme-swap`, `ThemeSwap.test.tsx:118` 1280·390 |
| B-ER-05 | **닫힘** `05bded2` (ER-4) | `features/studio/opAfter.ts:29` 거절 = 실패, `useSectionOps.pin.test.tsx:100` 의도 변경 단언 |
| B-ER-06 | **닫힘** `f7bea33` (ER-4) | `exportFlow.ts:83`·`useExportFlow.ts:29`, `exportFlow.test.ts:126` |
| B-ER-07 | 열림-실화면 QA 재검만 | 10MB 미만 고화소 + CPU 스로틀 ≥6 재시도 조건(`47ef2d8`). 코드 결함 근거 없음 |
| B-ER-08 | 열림-결정 필요(Designer SPEC + 예산) | U3 필드 편집 묶음 미이행 — `StudioLayoutImages.test.tsx:111` "삭제 → 되돌리기 무효화" 단언과 충돌 소지 그대로 |
| B-ER-09 (<1280 스냅샷 이동) | 열림-결정 필요(예산 — /studio 여유 0.11) | 더보기 실행 취소·다시 실행만 `9b1e001`. 더보기 메뉴에 "스냅샷" 항목 근거 없음 |
| B-ER-11 (390 실화면) | 열림-실화면 QA 재검만 | 단위 수정 `0415e74` · `StudioPanels.tsx:26` · `ThemeSwap.test.tsx:130`. 390 실화면 미확인 |
| B-M3P-03 | 열림-결정 필요(Designer — 표식 위치·Tag 겹침) | "생성 조합" Tag는 `ReferenceCard.tsx:121`(카드)에만, 상세는 `ReferenceDetailPage.tsx:43` buildNote 문장뿐 |
| B-M3P-04 | 열림-실화면 QA 재검만(배포 시) | 운영 서버 캐시 정책 확인 사항 — 코드 결함 근거 없음 |

## 열림-코드 수정만 — 예상 범위

| 항목 | 예상 수정 파일 | 예상 테스트 | /studio 진입 예산 |
|---|---|---|---|
| B-M2B-02 | `components/studio/EditFields.tsx`(services/list items 필드 도움말) 또는 필드 정의 | `EditFields`/`StudioLayout` 필드 테스트에 도움말 문구·`aria-describedby` 단언 | EditFields가 진입 청크면 문자열 1줄 증가 — 소폭(확인 필요, 여유 0.11) |
| B-M2B-03 | `components/studio/ContactOwnerNote.tsx`(booking 문구 분기) · `EditFields.tsx:48` 호출부 | ContactOwnerNote 문구 테스트(form=문의, booking=예약) | ContactOwnerNote는 lazy 청크 → 진입 closure 변경 없음 추정 |
| B-M2B-04 | `render/fallback/FallbackCanvas.tsx`(표식 굵기 → 400/700 또는 시스템 글꼴) | `FallbackCanvas.test.tsx` 클래스 단언 | 렌더 문서 쪽 — /studio 진입 closure 영향 미미 추정 |

## 다음 수정 레인 제안 (쓰기 경로 비중첩)

1. **레인 A — 편집 패널 문구**: B-M2B-02 + B-M2B-03 → `components/studio/EditFields.tsx`, `ContactOwnerNote.tsx` + 각 테스트. 예산 실측 필수(EditFields 진입 여부).
2. **레인 B — 폴백 표식 글꼴**: B-M2B-04 → `render/fallback/FallbackCanvas.tsx`(+ 필요 시 `kit/kit.css`) + `FallbackCanvas.test.tsx`. 레인 A와 파일 겹침 없음.
3. **QA 레인(코드 0)**: D-QA01 · B-M2B-09 · B-M2C-09②③ · B-ER-07 · B-ER-11 · (배포 시)B-M3P-04 — 포그라운드 Chrome 실측 환경 한 번에.
4. **결정 대기**: Designer — B-ER-01·B-ER-08·B-M3P-03 / 영환님 승인 — B-M2B-05(엔진 계약)·B-M2C-01(렌더 상한) / 예산 — B-ER-09(<1280 스냅샷 이동, 여유 0.11).

## 검증
- 문서만 변경(`docs/06-handoff/BACKLOG.md` 7행 끝에 닫힘 표기 추가, `dev/active/backlog-triage/*`). `git diff --stat -- app CLAUDE.md design` = 0.
