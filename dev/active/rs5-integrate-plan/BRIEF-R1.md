# RS5-INTEGRATE-PLAN 보완 BRIEF r1 (Designer, 1회 한정)

책임 역할: Designer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
대상: 이 워크트리 tip `5503dff8`. 입력 = `dev/active/rs5-integrate-plan/QA-REVIEW.md`(판정 "보완 후 가능") **6절 권고 1~7만** 반영한다. 승인 범위·금지는 `BRIEF.md`와 같다(설계·계획만, 앱 코드·ADR·예산 파일·SPEC-4/CONTRACT-5/UX-5·BACKLOG 수정 0, 구현·측정 0, push 0).

## 반영 (QA-REVIEW 6절 번호 그대로)
1. [P1·R1] INTEGRATE-6 3절·7절·D6-9: 편집기 lease 해제(언마운트 cleanup) 때 코어 dirty면 save 1회(링크·POP 공통, 대기 없음) · 탭 수준 `beforeunload` 소유자 명시 · 예외 목록을 **현재 동작 기준**으로(readonly·unsupported = 이동, offline·failed = 보류 — `StudioLeave.test.tsx` 14건 근거) · AC "디바운스 대기 중 이탈 → 이동 · IDB = 마지막 편집 · `/projects`에서 탭 닫기 경고 on" 추가. StudioLeave 14건 각 행의 유지/의미 변경/폐기(사유)를 표로.
2. [P1·R7] 5절 G1 규칙 1줄 + RED AC "코어 commit 중 `deleteSnapshot` → IDB doc = 코어 최신 · 새 이미지 삭제 0" + 6.4 표에 `deleteSnapshot` 추가.
3. [P1·R2] 2.2·9.2: 코어 생성 시점 · 레지스트리 소유 객체(local·memory 공통) · 포트 없는 동안 `save()` 결과 — 결정 3줄. 예산 영향이 있으면 L0 S6b가 그 배치로 잰다고 명시.
4. [P2] MQ-6에 링크 이탈 규칙(D6-9) MQ 추가(SPEC-4 RS4-AC-06 대체 D행 포함) · MQ-6-1에 ADR-007 4절 이유 2 관계와 포트 실제 표면 1줄.
5. [P2·R5] 9.3/PLAN 1절: S6c 제거 목록을 L0 REPORT에 파일:행 고정, L3가 같은 목록을 머지할 때만 상쇄 유효.
6. [P2] 12건 중 누락 5건(RS4-R2 · RS4-B1 · STALE/CLEARED·오프라인·섹션 연산 이동 보류 · RS-AC-08d · B-RS-01 예산 +0.02/+0.03)에 해결/MQ/범위 밖 판정 1줄씩. RS4-B1은 "엄격 imageOps"가 flush 공유인지 포트 전용인지 결정. OBS-2/BD-2 포트 시그니처 projectId(또는 prefix) 고정 AC · CE-4 남는 경로 판정.
7. [P2·R6] PLAN 레인 표 쓰기 경로에 `projectRepository.ts`·`memoryProjectRepository.ts`·`memoryDocBook.ts`·`useStudioDoc.ts` 배정 · INTEGRATE-6 11절에 `StudioLeave.test.tsx`(14건) 추가. 1절 행 번호 오류(F2·F4·F9·F11~F16)도 같이 정정.

## 운영
- 문서 r0 → r1 변경 이력 1줄. 반영마다 명시 경로 커밋(`git diff --check`). 새 범위 추가 금지 — 7건 외 발견은 REPORT "남은 것"에만.
- 끝에 `dev/active/rs5-integrate-plan/REPORT.md`에 "r1 보완" 절: 7건 각각 반영 위치(문서:절) 표 · 새로 생긴 MQ · 사실/추정.
- 자체 검토 1회. Codex 0. 서브에이전트 불필요(같은 문서 순차 편집).
- 최대 45턴. 35턴부터 REPORT 마감.
