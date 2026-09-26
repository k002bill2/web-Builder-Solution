# FIX-V2F REPORT — 요약 바 확정 버튼 라벨을 패널과 맞춤 (D-V2F-01)

- 브리프: `docs/06-handoff/FIX-V2F_DEVELOPER_BRIEF.md` (브리프 커밋 `3485f6e`) · 결정: 영환님 "1"(패널 문구로 통일)
- 브랜치 `k002bill2/fix-v2f` · 워크트리 `fix-v2f` · 실행 2026-09-26 KST, macOS · 로컬 커밋만(push·원격 없음)
- **판정: 완료** — 검증 4종 통과(test 525/525), 768·390 라벨 일치·가로 넘침 0, 번들 예산 안(공통 청크 증가 없음), Codex 결함 0

## 1. 변경

| 파일 | 내용 |
|---|---|
| `app/src/components/compare/DraftSummaryBar.tsx` | 필수 prop `status: DraftStatus` 추가(`import type`). 확정 버튼 글자를 고정 문자열 `confirming ? "확정 중…" : "프로필 확정"` → `confirmLabel(status, confirming)`(패널과 같은 함수). `aria-label` 없음 — 접근 이름 = 보이는 글자 |
| `app/src/pages/CompareBoardPage.tsx` | 요약 바에 `status={board.draftStatus}` 전달(패널에 이미 넘기던 같은 값. 새 계산·새 상태 없음) |
| `app/src/components/compare/DraftSummaryBar.test.tsx` | 새 테스트 3 + 기존 이름 쿼리 1줄 수정 |
| `app/src/pages/CompareBoardResponsive.test.tsx` | 새 테스트 2 + 기존 이름 쿼리 1줄 수정, `openAt`에 보드 `extra` 인자 추가(테스트 헬퍼) |

그 밖의 제품 코드·`design/`·의존성·아이콘·예산 변경 없음.

## 2. 테스트 (TDD)

새 테스트 5건:
- `DraftSummaryBar — 확정 버튼 문구 (D-V2F-01)` › `확정 전 → '프로필 확정 (v1)' (패널 confirmLabel과 같은 문자열)`
- 같은 describe › `v1 확정 뒤 변경 → '새 버전으로 확정 (v2)' (…)`
- 같은 describe › `확정 중 → '확정 중…' (…)` — 각 상태에서 `confirmLabel(status, confirming)`과 같은 문자열, 보이는 글자와 같음, `aria-label` 없음을 단언
- `요약 바 확정 문구 = 패널 문구 (D-V2F-01)` › `768px: v1 확정 뒤 바뀌면 요약 바도 패널처럼 '새 버전으로 확정 (v2)'`
- 같은 describe › `390px: …` — 페이지 배선 검증. 같은 이름 버튼이 2개(패널·요약 바)이고 하나가 요약 바 안에 있으며 활성

RED(`logs/red.log`): 6 failed / 8 passed. 실패 사유는 모두 `Unable to find an accessible element with the role "button" and name …`(이름 불일치). "확정 중…"은 기존 코드도 같은 문자열이라 RED 단계에서도 통과(예상대로).
GREEN(`logs/green-focused.log`): 14/14.

### 고친 기존 테스트 줄 (결정에 따른 필연 — 이름 쿼리만 수정, 단언 변경 없음)

| 위치 | 전 | 후 |
|---|---|---|
| `DraftSummaryBar.test.tsx` (구 24행) `getByRole("button", { name: … })` + 테스트 제목 | `"프로필 확정"` | `"프로필 확정 (v1)"` |
| `CompareBoardResponsive.test.tsx` (구 100행) `within(bar).getByRole("button", { name: … })` | `"프로필 확정"` | `"프로필 확정 (v1)"` |

그 밖에 깨진 단언 없음. `CompareBoardPage.test.tsx`의 이름 쿼리(292·383·384·400행)는 수정하지 않았다 — 전체 525 통과로 `getByRole` 중복 매치가 없음을 확인(원인: 이 파일은 matchMedia를 설정하지 않고, `useViewport.ts:18`은 matchMedia가 없으면 "wide"로 보므로 요약 바가 렌더되지 않음).

## 3. 검증 4종

| 명령 | 결과 | 로그 |
|---|---|---|
| `npm run typecheck` | exit 0 | `logs/typecheck.log` |
| `npm run lint` | exit 0 | `logs/lint.log` |
| `npm test -- --run` | **525 passed / 46 files**, exit 0 (기존 520 + 새 5) | `logs/test.log` |
| `npm run build` | exit 0, 예산 검사 통과 | `logs/build.log` |

## 4. 번들 (gzip KB, 첫 화면 / 진입 직후, 예산 100 / 125)

| 라우트 | 전 (`logs/build-before.log`) | 후 (`logs/build.log`) |
|---|---|---|
| 공통 JS | 88.67 | 88.66 |
| `/catalog` | 98.50 / 100.88 | 98.50 / 100.88 |
| `/references/:id` | 95.83 / 98.21 | 95.83 / 98.21 |
| `/compare` | 98.51 / 120.97 | 98.50 / 120.97 |
| `/profile · /studio` | 89.12 / 91.51 | 89.12 / 91.51 |

`CompareBoardPage` 청크 9.07 → 9.07. 공통 청크 증가 없음(0.01 감소는 gzip 반올림 차).

## 5. 브라우저 (ego-browser TaskSpace 17, 뷰포트 CDP `Emulation.setDeviceMetricsOverride`)

- 서버: `vite preview --host 127.0.0.1 --port 4341 --strictPort` → 종료 뒤 `lsof -iTCP:4341 -sTCP:LISTEN` 결과 없음(exit 1), `pgrep "vite preview"` 없음(`logs/server-stop.log`). 브라우저 쪽 CLOSE_WAIT 소켓 1개만 남았고 리스너는 아님.
- QA 재현 절차(REPORT D-V2F-01): 768에서 카탈로그 "동네 치과 클리닉"·"부티크 법률사무소" 비교 추가 → "비교 보드 열기" → Hero A 선택 → 요약 바 "프로필 확정 (v1)" 클릭 → `/profile/profile-1` → 뒤로 → 메뉴 구조 B 선택.

| 상태 | 요약 바 확정 버튼 | 패널 확정 버튼 |
|---|---|---|
| 확정 전 (768) | "프로필 확정 (v1)", 활성, `aria-label` 없음 | — |
| v1 확정 뒤 변경 (768·390) | "새 버전으로 확정 (v2)", 활성, `aria-label` 없음 | "새 버전으로 확정 (v2)", 활성 — **일치** |
| v2 확정 직후 변경 없음 (390, 요약 바에서 확정) | "새 버전으로 확정 (v3)", `aria-disabled=true`, 설명 "확정한 뒤 바뀐 내용이 없습니다" | 같음 — **일치** |

넘침·줄바꿈 (변경 후 "새 버전으로 확정 (v2)"):

| 폭 | 문서 scrollWidth/clientWidth | 요약 바 scrollWidth/clientWidth | 확정 버튼 [x,y,w,h] | 버튼 scrollWidth/clientWidth | "초안 보기"와 같은 행 |
|---|---|---|---|---|---|
| 768 | 753 / 753 (넘침 0) | 753 / 753 | [588,856,137,32] | 135 / 135 (잘림 없음) | 예(줄바꿈 없음) |
| 390 | 375 / 375 (넘침 0) | 375 / 375 | [222,856,137,32] | 135 / 135 (잘림 없음) | 예(줄바꿈 없음) |

clientWidth가 폭보다 15 작은 것은 세로 스크롤바 폭. 버튼 높이 32 = sm 한 줄(글자 줄바꿈 없음).
캡처: `screens/compare-768-v1-changed-bar.png`, `screens/compare-390-v1-changed-bar.png`.
"확정 중…"은 전환이 짧아 브라우저로 잡지 않았고 단위 테스트로 확인했다.

## 6. Codex 리뷰 (1회)

- 명령: `node codex-companion.mjs review --wait --scope branch --base 3485f6e` (companion 1.0.6), 대상 = 코드 커밋 `18c05af`까지의 브랜치 diff. 로그 `logs/codex-review.log`.
- 결과: **결함 0**. "The summary bar now uses the same status-aware confirmation label as the draft panel, and its caller supplies the existing draft status. No defects were identified in the diff."
- Codex 쪽 대상 테스트 실행은 Codex 샌드박스의 파일 쓰기 권한 오류(Vite 임시 설정 파일)로 실패 — 코드 문제 아님. 같은 테스트는 로컬에서 통과(3절).

## 7. 남은 위험 · 확인 필요

- 요약 바 버튼이 "프로필 확정" → "새 버전으로 확정 (vN)"으로 길어졌다(137px). 390에서 한 줄 유지를 확인했으나, 390보다 좁은 폭(예: 320)은 측정하지 않았다. 바가 `flex-wrap`이라 넘침 대신 줄바꿈될 것으로 추정(확인 필요 · Low).
- 768~1279·<768에서 같은 이름의 확정 버튼이 패널과 요약 바에 2개 존재한다. 같은 동작을 한 이름으로 부르는 것이 결정의 의도이며 기존에도 둘 다 있었다. 향후 좁은 화면 페이지 테스트에서 `getByRole(name)` 단독 쿼리는 중복 매치가 나므로 `within(bar)`로 좁혀야 한다.
- 브라우저 첫 라운드에서 v1 확정 후 뒤로 돌아온 **직후, 대기 조건 없이** 읽은 요약 바는 "프로필 확정 (v1)" 활성이었다(QA는 같은 시점 두 버튼 모두 "새 버전으로 확정 (v2)" 비활성으로 기록). 보드 로드 완료 전 과도 상태로 추정한다(확인 필요 · Low). 그 순간 패널은 같이 읽지 않았다. 패널과 요약 바는 같은 `board.draftStatus`를 쓰므로 라벨이 서로 어긋날 수는 없고, 안정 상태는 v2 확정 직후 두 버튼 모두 "새 버전으로 확정 (v3)" 비활성으로 재확인했다. 과도 상태에서 버튼이 활성으로 보이는 것은 이번 범위 밖이며 기존 동작일 수 있다.
- 스크린리더 낭독은 확인하지 않았다(비대화형). 접근 이름은 DOM 글자·`aria-label` 부재로 확인(L1), 낭독은 L3.

## 8. 커밋

- `18c05af` fix(compare): 요약 바 확정 버튼 문구를 패널 confirmLabel로 통일 (D-V2F-01)
- REPORT 커밋: 이 파일을 담은 커밋(해시는 최종 응답에 기재)
