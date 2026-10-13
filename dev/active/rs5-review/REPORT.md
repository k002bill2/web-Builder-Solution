# RS5-review — CONTRACT-5 r0.1a 독립 검토 REPORT

- 성격: **구현 전 검증(독립 계약 검토)만**. 계약·코드·SPEC/ADR 수정 0 · 구현 0 · 측정 0 · 예산 상향 0 · merge/push 0 · 새 의존성 0. 쓰기는 `dev/active/rs5-review/`만.
- 대상: `docs/design/restart/CONTRACT-5.md` r0.1a(`418979e`) · base `467a691`(앱 `93f8111`, HEAD까지 `app/` 변경 0 — `git diff --stat 93f8111 HEAD -- app` 빈 출력).
- 책임 QA(Orca Claude Code) · 회수 Jarvis. **제품 PASS 주장 없음** — 이 문서는 계약 문서의 정합성 판단이며, 테스트·브라우저 실행은 0이다.
- 순서 증거: QA 독립 판단 `logs/qa-independent.md` 커밋 `109ea6e` → 그 뒤 Codex 1회(`logs/codex-r1.started` 시각) → 이 REPORT.
- 표기: [L1] 코드 행 직접 확인 · [L1-추적] 여러 행 이어 읽은 경로 추론(실행 0) · [L3] 추정. **미측정** = 실행으로 확인하지 않음.

## 1. 결론 (먼저)

(작성 중) Codex 진행 중 — 결과 미수집. QA 독립 판단만 있음: CONTRACT-5 r0.1a는 구현 승인 전 P1 4건(QA-1~4) 미해소.

## 2. QA 독립 지적 (귀속: QA · Codex 전 커밋 `109ea6e`)

상세·근거행 = `logs/qa-independent.md`. 전부 [L1-추적]·**미측정**.

| ID | 심각도 | 요지 | 핵심 근거행 |
|---|---|---|---|
| QA-1 | P1 | `wrote:false` 확인 증명이 싱크 열기 뒤 낡음 — readonly 탭에서 다른 탭 저장 뒤 거짓 `confirmed` | `localSync.ts:93-98,189-192` · `writerLock.ts:2-3` · 계약 I5b·4.2-5 |
| QA-2 | P1 | 4.1 oncomplete `confirmedSeq=max(…,s)` ↔ I2 `seqOf(제출 레코드)` 모순 · `flush`가 커밋 레코드를 돌려주지 않아 I2 구현 불가 · replace 직렬화 미명시 → conflicted "내 초안" 소실 경로 | `localSync.ts:48,151-155` · `memoryProjectRepository.ts:65-66` |
| QA-3 | P1 | replace 술어가 미publish 편집(dirtyMark)을 보지 않음 → `adopt`/디바운스 중 편집 덮어쓰기 "해결" 주장 미지지 | `useDocSave.ts:131-136` · 계약 4.4 · 6.2 |
| QA-4 | P1 | `discard`가 메모리 커밋된 초안을 되돌리지 않음 · inflight 중 discard 미정의 → 재진입 seed·다음 스냅샷 flush가 폐기 초안을 살림 | `memoryDocBook.ts:364-366` · `memoryProjectRepository.ts:86-89,132-133` |
| QA-5 | P2 | retry 성공 경로가 `stored` 미갱신 → binding 해제 조건 영구 미충족(누수)·거짓 `image-missing` 가능 | `localSync.ts:155,170` |
| QA-6 | P2 | `acquire(projectId)` 멱등 문장이 시그니처와 불일치 · 재seed 수단 미정 | `useAutosaveScheduler.ts:275-279` · `useDocSave.ts:58,61` |
| QA-7 | P2 | I7(not-applied·unknown만) ↔ 4.2-2(모든 start) 모순 — `held:"unconfirmed"` | 계약 내부 |
| QA-8 | P2 | I8 `dirtyMark>publishedMark`가 settle 경로(theirs·adopt)에서 안 꺼짐 → 거짓 `beforeunload` | `useDocSave.ts:103-107,136` · `useAutosaveScheduler.ts:125-131` |
| QA-9 | P2 | `local.base`·요청 revision 멱등 키 잔존 — 단일 소유자 문장과 존폐 미정 · in-tab STALE 소멸로 replace 미분류 경로가 생기면 조용히 덮임 | `memoryDocBook.ts:354,358,363,331` |

F표(1절) 대조: F1~F12 근거행 일치(F4는 `kept`의 `held` 완화를 계약이 언급하지 않음 — 결론은 유효). I5b의 하이드레이트 참조 동일성 전제 성립(`memoryDocBook.ts:146,166-167`), 단 "레코드 참조 동일"은 성분 동일로 읽어야 함(`localSync.ts:153,155`).

## 3. Codex adversarial-review (귀속: Codex · 1회)

(작성 중) Codex 진행 중 — 결과 미수집.

## 4. 미측정 · 범위 밖

- 미측정(전부): 위 모든 경로는 코드 읽기 추적이며 RED 테스트·하네스·브라우저 실행 0. 계약 7절 T1~T19도 실행 0.
- 번들: 이 레인 측정 0. CONTRACT-5 진입 몫 미측정(계약 8절 그대로). 제한된 번들 스파이크·UX 명세는 이 레인 범위 아님(BRIEF: QA 레인 = 계약 대조).
- 지적 반영·리뷰 반복 0(BRIEF "지적수정/리뷰반복금지"). 제안은 전부 **제안**이며 구현 승인 아님.

## 5. Jarvis 회수 요청

CONTRACT-5를 구현 승인으로 올리기 전에 P1(QA-1~4 + Codex P1) 반영 여부와 재검토 주체를 정해야 한다. 이 레인은 반영하지 않는다.
