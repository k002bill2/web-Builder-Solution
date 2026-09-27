# PROFILE-HEADROOM-C6 — `/profile` 번들 여유 확보 + C6 첫 확정 알림 재시도 (Developer 브리프)

> 발행: Jarvis, 2026-09-27 · 영환님 ★A(대기열 레인). 작업 공간 `profile-headroom-c6`(브랜치 `k002bill2/profile-headroom-c6`, base main `f22bbc8`). 포트 **4345**. 병렬 레인 A2-F(`editor-a2-fields`, `components/studio/**`·`features/studio/**`)와 파일이 겹치지 않는다 — 이 레인은 **studio 파일을 쓰지 않는다**.

## 왜
- main `/profile` 진입 직후 **124.69KB(여유 0.31)**. a2 화면 레인(A2-S)이 S1(`270bf6c`)에서 studio만 바꿨는데 `/profile`이 **124.72(여유 0.28)** 로 흔들려 멈춤선(0.3)에 걸렸다(`editor-a2-shell` REPORT 4절: 청크 해시·프리로드 목록 변화로 ±0.02~0.03 요동). 여유가 요동 폭 안에 있어 a2·a3 어떤 변경도 막힌다.
- 증가 원인(L1, `dev/active/editor-a2-data/REPORT.md` 57행): C5가 `profileEngine` 청크에 `CandidatesSection.tsx`의 편집 시작 실패 처리(오류 코드 분기 DOC_EXISTS/UNKNOWN_VARIANT/그 밖 · `starting`/`startAlert` state · `role="alert"` Callout + "다시 시도" Button · `CANDIDATE_TEXT.startFailed`)를 넣어 **+0.23**.
- C6(첫 확정에도 `projectCreated` state, SPEC r4.3 J-S11 확장)는 `f50aaba`→revert `b9e9597`. 원인: `ProfilePage.tsx` 67~71행이 state를 비우려 **비동기 `navigate(현재 경로, {replace})`** 를 하고, 사용자가 곧바로 보드로 돌아가면 늦은 replace가 화면을 되돌리는 경쟁(`CompareBoardPage.test.tsx` "v1 확정 뒤 돌아와…" 계열 3회 중 2회 실패). 같은 REPORT 9절.

## 체크포인트 (순서대로, 끝날 때마다 커밋)
- **H0** base build 실측 → `dev/active/profile-headroom-c6/logs/base-build.txt` 커밋 + PROGRESS 수신 기록.
- **H1 여유 확보** — 목표 `/profile` 진입 직후 **≤ 124.45(여유 ≥ 0.55)**, 첫 화면 변화 ≤ 0, 다른 화면·공통 증가 0.
  - 1순위: 편집 시작 **실패 분기와 알림 문장 생성**을 조작 뒤 청크(편집 시작 onClick에서 이미 로드하는 `memoryDocBook`/`startDocWrite` 쪽, 또는 그와 함께 로드되는 작은 모듈)로 옮겨 `{ state } | { alert, retry }`를 돌려받게 한다. 알림 JSX는 기존 DS 컴포넌트 재사용(새 청크·새 로더 금지가 원칙, 불가피하면 REPORT에 근거).
  - 2순위(1순위로 부족할 때만): profile 청크의 다른 조작 뒤 코드 후보를 실측 목록으로 제시하고 가장 큰 1개만 옮긴다.
  - 동작·문구·접근성(aria-busy, 오류별 알림, UNKNOWN_VARIANT는 "다시 시도" 없음) **불변** — 기존 `ProfileCandidates.test.tsx` 단언 약화 금지. 옮긴 뒤 새 단위 테스트(RED→GREEN)로 반환값 계약을 고정.
  - 목표에 못 미치면 달성치로 커밋하고 계속 H2 진행(멈춤선 0.3 미만일 때만 중지).
- **H2 C6 재시도(경쟁 없는 state 비우기)**
  - `ProfilePage.tsx`: `droppedCount`·`projectCreated` state를 **마운트(`location.key`) 때 1회 읽어 ref에 담고**, 비우기는 `window.history.replaceState({...history.state, usr: null}, "")`로 한다. **`navigate(…, {replace})` 금지.** 선례: `editor-a2-shell` 브랜치 `app/src/features/studio/useStudioDoc.ts`의 `useEntryState`(읽기만, 이 레인에 복사하지 말고 같은 방식을 ProfilePage 안에서 구현 — studio 파일 쓰기 금지).
  - `useCompareBoard.ts`: `f50aaba`의 한 줄(`created = toNew || confirmed === undefined`)을 다시 적용. 테스트는 `f50aaba`의 `CompareBoardTarget.test.tsx` 케이스를 되살린다(`git show f50aaba -- app/src/pages/CompareBoardTarget.test.tsx`).
  - P-S25 "조정 M개를 지웠습니다"와 J-S11 "새 프로젝트 '…'을 만들었습니다" 알림이 기존대로 1회씩 나와야 한다.
  - **수용 기준: 전체 `npx vitest run`을 3회 연속 실행해 3회 모두 실패 0**(`logs/h2-full-x3.txt`에 3회 요약). 특히 `CompareBoardPage.test.tsx` "S-15·S-16 / AC-25" 계열.
- **H3** 최종 build 1회(`logs/final-build.txt`) · REPORT.

## 번들 판정
- 커밋마다 `npm run build` → `/profile` 첫·진입, `/catalog` 첫, `/compare`·`/projects` 진입, 공통을 표로. 어느 화면이든 여유 < 0.3이면 그 커밋 남기고 중지·REPORT. 예산(ADR-004 100/125) 변경 금지.

## 금지·운영
- 소유 파일: `features/profile/**`(CandidatesSection·generationText 등) · `pages/ProfilePage.tsx` · `pages/Profile*.test.tsx` · `features/compare/useCompareBoard.ts` · `pages/CompareBoardTarget.test.tsx` · `data/memoryDocBook.ts`·`data/startDocWrite.ts`(조작 뒤 청크로 옮길 때만) 및 새 테스트. 그 밖 앱 코드·`components/studio/**`·`features/studio/**`·`pages/StudioPage.tsx`·`engine/**`·`design/`·`docs/design/` 수정 금지. 필요하면 멈추고 보고.
- TDD RED→GREEN(로그 보존). 기존 단언 약화 금지. 새 의존성 금지.
- **서브에이전트 금지.** 로컬 커밋 `git commit -- <경로>`. push·병합·삭제 금지. 긴 브라우저 흐름 검증 금지(병합 뒤 QA).
- `--max-turns` 50 · **38턴부터 REPORT 우선**. REPORT `dev/active/profile-headroom-c6/REPORT.md`: SHA·파일·번들 전후 표(청크별 gzip 변화 포함)·RED/GREEN·3회 반복 결과·남은 위험. Codex는 턴 남을 때만 1회(`review --scope branch --base f22bbc8`), 없으면 "이관".
