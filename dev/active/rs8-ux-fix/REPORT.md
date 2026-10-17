# RS8-UX-FIX REPORT — B-RS-11 · B-RS-12 (UX-POLISH-1 ★안)

- 상태: **완료** — 게이트 4개 통과 · 실화면 UXP-AC-05·06·07 통과 · Codex r1 P2 1건 반영
- 브랜치 `k002bill2/rs8-ux-fix` · base `ead47dcd`

## 1. 결론
- B-RS-11: `PngSave` 성공 문장 → `onAnnounce`(편집 알림 `setNotice`). `PngSave` 자체 `role=status` 제거. 같은 성공 문장을 다시 올릴 때는 `""` → 다음 틱 문장(재낭독 — Codex r1 P2). 실패 alert는 그대로(범위 밖).
- B-RS-12: 탭 배치에서만 `StudioToolbar sticky` → `header`에 `sticky top-0 z-10`(Tailwind 유틸 — 하드코딩 0). 분할·3단 무변화.
- 정본: `docs/design/restart/UX-5.md` UX5-AC-01에 C-3 1줄 반영.

## 2. 변경 파일
- `app/src/components/studio/PngSave.tsx` — `onAnnounce?` prop · `done` 상태 삭제 · status `<p>` 삭제
- `app/src/components/studio/StudioToolbar.tsx` — `sticky?` prop
- `app/src/components/studio/StudioLayout.tsx` — `onAnnounce={setNotice}` · 탭 배치 `sticky`
- `app/src/components/studio/PngSave.test.tsx` — 기존 단언 이전/이후 + UXP-AC-03·04
- `app/src/components/studio/StudioToolbarSticky.test.tsx` — UXP-AC-08 (신규)
- `docs/design/restart/UX-5.md` — C-3
- `app/scripts/m2cBaseline.json` · `app/scripts/bundleBudget.test.mjs` — 기준선 실측 상향(4절)

## 3. TDD
- RED `logs/red.log`(gitignore 대상 — 로컬 보존, 요지는 아래): 6 failed | 8 passed (UXP-AC-03 1024·1280, UXP-AC-04 단위 2 + 편집기 1, UXP-AC-08 390). 390 status 계수는 RED 때도 통과 — 탭 배치에서 PngSave는 숨은 탭(접근성 트리 밖)이라 원래 1개.
- GREEN `logs/green.log`: 14 passed.
- Codex r1 P2 RED `logs/red-r1.log`: 1 failed | 11 passed(같은 PNG 재저장 → onAnnounce 순서 [문장, "", 문장]) → GREEN `logs/green-r1.log` 15 passed.

### 기존 단언 이전/이후 (약화 0 — 같은 사실을 새 경로로 단언)
| 테스트 | 이전 | 이후 |
|---|---|---|
| PngSave "진행 → … 성공" | `getByRole("status")` 글자 = 성공 문장 | `onAnnounce` 1회 · 인자 = 성공 문장 · `queryByRole("status")` null |
| PngSave "실패 → … 다시 시도" | 재시도 뒤 `getByRole("status")` 글자 ⊇ "PNG를 내려받았습니다" | 실패 동안 `onAnnounce` 0 · 재시도 뒤 `onAnnounce` 인자 = 전체 성공 문장(더 엄격) · status null |

## 4. 예산 (ADR-004 개정 17)
| 진입 | base 기준선 | 1차(B-RS-11·12) | 최종(+Codex 수정) | 증분 | 판정(≤ +0.05) |
|---|---|---|---|---|---|
| `/studio` 정규화 | 128.66 | 128.67 | 128.70 | +0.04 | 통과 |
| 복원 정규화 | 131.64 | 131.66 | 131.68 | +0.04 | 통과 |
| `/studio` raw | 129.96 | 129.96 | 129.99 | +0.03 | 참고(한도 130.5) |
| 복원 raw | 132.99 | 132.99 | 133.03 | +0.04 | 참고(한도 134) |
- 최종은 스크립트 허용 +0.03을 넘어 build가 실패 → BRIEF "기준선은 실측 상향 시 같은 커밋에서"에 따라 `m2cBaseline.json`(normEagerKb·eagerKb·note) · `bundleBudget.test.mjs` 단언을 128.70 · 131.68 / 129.99 · 133.03으로 올림. 상한 129.13·132.11 안. 감량 불필요(+0.05 이하).

## 5. 검증 (마지막 코드 기준 fresh)
| 항목 | 명령 | 결과 |
|---|---|---|
| typecheck | `npm run typecheck` | exit 0 |
| lint | `npm run lint` | exit 0 |
| test | `npx vitest --run` | exit 0 · 348 files / 3043 tests passed (base `ead47dcd` 실측 347 / 3035 — BRIEF의 349/3049는 현 base와 불일치. +1 파일 · +8 테스트) |
| build | `npm run build` | exit 0 (bundle 가드 통과 · 4절) |
| Codex | `codex-companion review --scope branch --base ead47dcd` (1회) | P2 1건: 같은 PNG 재저장 시 편집 알림 글자 불변 → 재낭독 0 → 반영(RED→GREEN). 재리뷰는 BRIEF "1회"라 미실시 |

### Ego Lite (preview `--port 4394 --strictPort`, IDB 초기화 → 카탈로그 → 비교 → 모던 카페 전부 선택 → 프로필 확정 → 3안 → A안 → 편집 시작 — 로그 `logs/ego-1.json`·`ego-2.json`)
| AC | 관측 | 판정 |
|---|---|---|
| UXP-AC-07 1280·1024(그리고 1877) | header `position: static` · top auto · z auto · 높이 52 · status 1개(편집 알림) · 가로 넘침 0 | 통과(배치 무변화) |
| UXP-AC-05 PNG 저장 뒤(1280) | 내려받기 `모던-카페-브랜드-프로젝트_1280_r1.png` · DOM status 1개 = 편집 알림 "PNG를 내려받았습니다 · 모던-카페-브랜드-프로젝트_1280_r1.png" · AX 트리 status 노드 1개(name "편집 알림") | 통과 |
| UXP-AC-06 390×844 | header `sticky` top 0px z 10 · 맨 위 scrollY 0 상태 줄 top 48 · 끝까지(scrollY 394 = max) 상태 줄 top 48 ≥ 0 · header top 0 · 가로 넘침 0(스크롤바 15) | 통과 |
- 미관측: stale 때 "버리고 새로고침" 화면 안 — 다른 탭 stale 재현은 생략(같은 sticky header 안 subline이라 위 상태 줄 관측으로 갈음 [L3]). 실화면은 Codex 수정 전 빌드 — 수정은 같은 문장 재알림 경로만이라 단위 테스트로 판정.
- 스크린샷: `Page.captureScreenshot` CDP 시간 초과 1회 → 생략(수치 관측으로 판정).
- 정리: IDB `design-studio` 삭제 · localStorage clear · `finish({keep:[]})` · preview PID 87469 종료 → `lsof -nP -iTCP:4394 -sTCP:LISTEN` 출력 0줄.

## 6. 목업·명세와 다른 점
- ★안 그대로. 추가: 같은 성공 문장 재알림(Codex P2 — 명세에 없던 경우).

## 7. 남은 것
- `""` → setTimeout 0 → 문장: 짧게 편집 알림이 비는 순간이 생긴다(시각상 1틱). 스크린리더 재낭독은 브라우저·SR 조합에 따라 다를 수 있음 [L3] — 실기 SR 확인은 QA 후보.
- P-3 나머지 live region(PngSave 실패 alert · ImageSlotPanel · ExportAfter 등) — UX-POLISH-1 8절 후속, 범위 밖.
