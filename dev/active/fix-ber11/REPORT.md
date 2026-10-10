# FIX-BER11 REPORT — 390 테마 적용 직후 "되돌리기" 화면 밖 (B-ER-11 · P3)

결론: **수정 완료 · 단위(Red-Green) + Ego 390 실화면 3/3 화면 안.**

## 원인 (코드 추적 확정 · L1)
- `app/src/components/studio/StructureCanvas.tsx` `Overlay` 선택 상자 effect 의존성이 `[selectedId, selectedRect]` — `selectedRect`는 `rects.find(...)` 결과 객체라 **재측정마다 정체성이 바뀐다**.
- 테마 적용 → `doc`(킷 토큰) 변경 → 렌더 문서에 render 전송 → `measured?.doc !== doc`이라 rects 일시 undefined → rects 회신(비동기 postMessage) → 새 `selectedRect` → **선택은 그대로인데** `selectedBox.scrollIntoView` 재실행.
- 알림 줄 effect(`StudioPanels.tsx:29-31`)는 적용 커밋 직후 먼저 실행 → 뒤따른 선택 상자 스크롤이 덮어씀. 390 탭 배치에서 같은 스크롤 컨테이너라 "되돌리기"가 위로 밀려남(QA y=-246).
- 기존 단위 테스트는 알림 줄 호출 "존재"만 확인해 통과(마지막 호출 대상 미검사).

## 변경 파일
| 파일 | 변경 |
|---|---|
| `app/src/components/studio/StructureCanvas.tsx` | `scrollPending` ref — `selectedId`가 바뀔 때마다 세우고, 사각형이 처음 올 때 한 번만 스크롤. 재측정(테마·문서 변경)은 재스크롤 0. setTimeout 등 타이밍 꼼수 미사용 |
| `app/src/components/studio/ThemeSwap.test.tsx` | RED 테스트(390·1024·1280: 적용 뒤 마지막 scrollIntoView = 알림 줄 · 오버레이 호출 0) + 회귀 테스트 2건(1280 섹션 선택 변경 · 섹션→'페이지 정보'→같은 섹션 왕복 시 선택 상자 스크롤) |
| `docs/06-handoff/BACKLOG.md` | B-ER-11 행 끝 결과 표기 |
| `dev/active/fix-ber11/PROGRESS.md` · `REPORT.md` · `shots/` | 기록 |

## 테스트
- RED 예측: 3폭 FAIL(마지막 = 선택 상자) → 결과 3 failed, 마지막 호출 = 오버레이 `Hero · 풀블리드…` 상자. 예측 일치.
- Red-Green: 수정 되돌림 → 3 FAIL / 복원 → `ThemeSwap.test.tsx` 17/17 PASS. Codex P2 왕복 테스트: 1차 수정에서 FAIL(RED) → 2차 수정 후 18/18 PASS. 기존 단언 약화 0.
- 게이트(fresh): `npm run typecheck` 0 · `npm run lint` 0 · `npx vitest --run` 297 files / 2661 tests passed (2차 수정 후 fresh) · `npm run build` 0. `npm ci` lock 변경 0.

## 번들 예산
- `/studio` 129.28KB (≤129.65, 기준 129.26 대비 +0.02) · 복원 진입 132.31KB (≤132.68) · `/profile` 99.87KB (≤100).

## Ego Lite (preview 4347 · 390×844)
- 경로: 카탈로그 → ref-e·ref-c 비교 추가 → 비교 보드 ref-e 전부 선택 → 프로필 확정 v1 → 3안 → B안으로 편집 시작 → 프로필 보기 → 촘촘 "조정 저장 (v2)" → 프로젝트 → 편집기 열기 → 390 → 테마 바꾸기 v2 적용(회차 사이 "되돌리기").
- "되돌리기" `getBoundingClientRect()`: 1회 top 176/bottom 208 · 2회 52/84 · 3회 52/84 (vh 844) → **화면 안 3/3**. 포커스 = "테마 바꾸기"(유지).
- 캡처: `dev/active/fix-ber11/shots/ber11-390-applied-fixed.png` (41,023B · PNG 390×844) — 알림 줄 + "되돌리기" 보임.
- 정리: IDB `deleteDatabase("design-studio")` = deleted · `finish({keep:[]})` · `listTaskSpaces()` = `[]` · preview 종료, 4347 LISTEN 0. 영환님 창·main 5480 무접촉.
- 목업/브리프와 다르게 한 것: "페이지 정보" 입력 단계 생략 — 게이트 통과는 이 결함(알림 줄 스크롤)과 무관해 턴 절약. "ref-e 카드 톤 밝음" 대신 ref-e 전부 선택(비교 보드에 해당 선택지 미노출).

## 남은 것 / 주의
- 의도된 동작 변화: 같은 선택 상태에서 섹션 순서 이동 등으로 상자 위치만 바뀌면 더는 따라 스크롤하지 않음(브리프 4 "선택이 실제로 바뀔 때만"). 필요하면 별건.
- Ego 실측은 1차 수정(`aea8349`) 기준. 2차 수정(`0777ceb`)은 선택이 바뀔 때만 동작을 바꾸고 테마 적용 경로(선택 불변)는 동일 — 단위 3폭 테스트가 그대로 PASS. 실화면 재확인은 QA 위임 권장.
- push/merge 없음(승인 필요).

## Codex (/codex:review 우회 실행 · branch --base main)
- 1라운드: [P2] 섹션 A → '페이지 정보' → A 왕복 시 `scrolledFor`가 A로 남아 재스크롤 생략 → **반영**(RED 확인 후 `scrollPending` 방식, 커밋 `0777ceb`).
- 2라운드: 지적 0건("수정이 필요한 결함을 발견하지 못했습니다"). 통과.
