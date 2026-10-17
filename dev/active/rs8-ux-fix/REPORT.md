# RS8-UX-FIX REPORT — B-RS-11 · B-RS-12 (UX-POLISH-1 ★안)

- 상태: **초안** (실화면·Codex 결과는 아래 표에 채움)
- 브랜치 `k002bill2/rs8-ux-fix` · base `ead47dcd`

## 1. 결론
- B-RS-11: `PngSave` 성공 문장 → `onAnnounce`(편집 알림 `setNotice`). `PngSave` 자체 `role=status` 제거. 실패 alert는 그대로(범위 밖).
- B-RS-12: 탭 배치에서만 `StudioToolbar sticky` → `header`에 `sticky top-0 z-10`(Tailwind 유틸 — 하드코딩 0). 분할·3단 무변화.
- 정본: `docs/design/restart/UX-5.md` UX5-AC-01에 C-3 1줄 반영.

## 2. 변경 파일
- `app/src/components/studio/PngSave.tsx` — `onAnnounce?` prop · `done` 상태 삭제 · status `<p>` 삭제
- `app/src/components/studio/StudioToolbar.tsx` — `sticky?` prop
- `app/src/components/studio/StudioLayout.tsx` — `onAnnounce={setNotice}` · 탭 배치 `sticky`
- `app/src/components/studio/PngSave.test.tsx` — 기존 단언 이전/이후 + UXP-AC-03·04
- `app/src/components/studio/StudioToolbarSticky.test.tsx` — UXP-AC-08 (신규)
- `docs/design/restart/UX-5.md` — C-3

## 3. TDD
- RED `logs/red.log`(gitignore 대상 — 로컬 보존, 요지는 아래): 6 failed | 8 passed (UXP-AC-03 1024·1280, UXP-AC-04 단위 2 + 편집기 1, UXP-AC-08 390). 390 status 계수는 RED 때도 통과 — 탭 배치에서 PngSave는 숨은 탭(접근성 트리 밖)이라 원래 1개.
- GREEN `logs/green.log`: 14 passed.

### 기존 단언 이전/이후 (약화 0 — 같은 사실을 새 경로로 단언)
| 테스트 | 이전 | 이후 |
|---|---|---|
| PngSave "진행 → … 성공" | `getByRole("status")` 글자 = 성공 문장 | `onAnnounce` 1회 · 인자 = 성공 문장 · `queryByRole("status")` null |
| PngSave "실패 → … 다시 시도" | 재시도 뒤 `getByRole("status")` 글자 ⊇ "PNG를 내려받았습니다" | 실패 동안 `onAnnounce` 0 · 재시도 뒤 `onAnnounce` 인자 = 전체 성공 문장(더 엄격) · status null |

## 4. 예산 (ADR-004 개정 17)
| 진입 | 기준선(정규화) | 실측 | 증분 | 판정(≤ +0.05) |
|---|---|---|---|---|
| `/studio` 정규화 | 128.66 | 128.67 | +0.01 | 통과 |
| 복원 정규화 | 131.64 | 131.66 | +0.02 | 통과 |
| `/studio` raw | 129.96 | 129.96 | 0.00 | 참고 |
기준선 파일 무변경(스크립트 허용 +0.03 안). 감량 불필요.

## 5. 검증
| 항목 | 명령 | 결과 |
|---|---|---|
| typecheck | `npm run typecheck` | exit 0 |
| lint | `npm run lint` | exit 0 |
| build | `npm run build` | exit 0 (bundle 가드 통과) |
| test | `npx vitest --run` | (채움) |
| Ego Lite UXP-AC-06·07·05 | preview 4394 | (채움) |
| Codex review | `review --scope branch --base ead47dcd` | (채움) |
| 리슨 | `lsof -nP -iTCP:4394 -sTCP:LISTEN` | (채움) |

## 6. 목업·명세와 다른 점
- 없음(★안 그대로).

## 7. 남은 것
- P-3 나머지 live region(PngSave 실패 alert · ImageSlotPanel · ExportAfter 등) — UX-POLISH-1 8절 후속, 범위 밖.
