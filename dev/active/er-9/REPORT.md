# ER-9 REPORT — 편집기 툴바 "더보기" 메뉴 (B-ER-09 · ADR-004 개정 8 배분 ②)

- base `19a97d0` · 커밋: `46c53b4` BRIEF P0 → `261eaa4` 기준선(배분 ②) → `9b1e001` 구현 → `f653046` Codex r1 수정 → `abba563` Codex r2 수정
- **결과: ER-AC-U4 구현. `/studio` 진입 128.23 → 128.56(+0.33), 기준선 128.55(판정선 128.58) 안, 상한 128.67 안. <1280 "스냅샷" 이동은 하지 않음(아래 차이).**

## 무엇을 바꿨나
| 파일 | 내용 | 청크 |
|---|---|---|
| `app/src/components/studio/MoreMenu.tsx`(새) | 트리거 "더보기" `aria-haspopup=menu`·`aria-expanded` · Enter/ArrowDown = 첫 항목, ArrowUp = 마지막 · 미리보기 잠금(aria-disabled) 중 화살표 열기 차단 | 진입(StudioLayout) |
| `app/src/components/studio/MoreMenuBody.tsx`(새) | `role=menu` · 항목 "실행 취소: {대상}"·"다시 실행: {대상}" · 화살표 순환·Home/End · Esc/Tab = 닫고 트리거로 · 비활성 `aria-disabled` + 보이는 이유 "되돌릴 편집이 없습니다"(`aria-describedby`) · 청크 받는 동안 포커스가 떠났으면 빼앗지 않고 닫음 | 조작 뒤(MoreMenuBody 1.02KB gz) |
| `app/src/features/studio/useSectionOps.ts` | `peekStep(redo)` — step이 옮길 기록 이름(지금 문서와 이어질 때만) | 진입 |
| `app/src/components/studio/StudioLayout.tsx` | 3배치 툴바 모두 `{snaps.button}{more}{gateButton}` · 실행 = `ops.step(redo, { setNotice, goTo })` = **단축키와 같은 함수** · 알림은 기존 편집 알림 | 진입 |
| `app/scripts/m2cBaseline.json` · `bundleBudget.test.mjs` | 기준선 128.23 → 128.55 · base 19a97d0 · 고정 기대값 같은 커밋(`261eaa4`), 검사기 로직 변경 0 | — |
| `app/src/components/studio/MoreMenu.test.tsx`(새) | 10건(아래) | — |

## 번들 증가량 (gzip KB · `npm run build` check-bundle-size)
| 행 | base `19a97d0` (logs/build-base.txt) | 최종 `abba563` (logs/build.txt) | Δ |
|---|---|---|---|
| /studio/:projectId 첫 화면 | 91.84 | 91.84 | 0 |
| **/studio/:projectId 진입 직후** | **128.23** | **128.56** | **+0.33** (기준선 128.55 · 판정선 128.58 · 상한 128.67) |
| /catalog 첫 · 진입 | 100.06 · 102.44 | 100.05 · 102.43 | −0.01 |
| /references/:id 첫 · 진입 | 97.30 · 99.69 | 97.29 · 99.68 | −0.01 |
| /compare 첫 · 진입 | 98.86 · 121.97 | 98.85 · 121.95 | −0.01·−0.02 |
| /profile 첫 · 진입(3안) | 99.72 · 119.17(121.65) | 99.71 · 119.16(121.63) | −0.01~−0.02 |
| /projects 첫 · 진입 | 94.04 · 100.36 | 94.03 · 100.36 | ≤−0.01 |
| 렌더 JS | 84.19 | 84.19 | 0 |
| 조작 뒤 MoreMenuBody | — | 1.02 | 판정 밖 |
- 다른 라우트 한도 초과 0(공유 CSS 미세 변동으로 −0.01~−0.02). StudioLayout 청크 18.40 → 18.73.
- 기준선 커밋은 구현 실측(128.55, `9b1e001`) 기준 1개. 이후 Codex 수정 2건으로 128.56(+0.01, 허용 0.03 안) — 기준선 두 번째 커밋 없음.
- 예상(S0, L3) +0.06~0.12보다 큼: 트리거 코드(lazy·키 처리·닫기) + `peekStep` + 3배치 배선이 진입 청크 +0.33. 상한 안이라 상쇄 시도 안 함.

## 검증 (fresh, 최종 `abba563`)
- `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm run build` exit 0(번들 표 위) · `npx vitest run` exit 0 — **252 files / 2209 tests**(logs/vitest.txt).
- TDD: RED 7/7(logs/red.txt, "더보기" 없음) → GREEN. Codex r1 회귀 RED 2/2(logs/fix1-red.txt) → GREEN, r2 회귀 RED 1/1(logs/fix2-red.txt) → GREEN. RED 커밋 0, 기존 테스트 수정 0(단언 약화·skip 0).
- 테스트 10건: 툴바 순서(≥1280 스냅샷 → 더보기 → 검사 · 내보내기) · 1024/390 존재 · 빈 기록 비활성 이유 + 누름 무변화 · 삭제→실행 취소(행 복원·알림·포커스 트리거)→다시 실행 · 화살표/Home/End/Esc · 트리거 ArrowUp/Down · 미리보기 잠금 중 열기 0 · 청크 로딩 중 포커스 이동 → 빼앗기 0 · Tab 포커스 유실 0.
- 기존 툴바 순서 단언: 기존 테스트 파일에 툴바 목록 단언 없음(grep) → 새 테스트에 순서 단언 추가.

## 브라우저 (Ego Lite · build + `vite preview --port 4337` · 1280×900 · `9b1e001` 빌드)
- 경로(첫 goto `/projects` 1회 뒤 앱 안 클릭만, 새로고침 0): 카탈로그 → 동네 치과 비교 추가 → 비교 보드 → 프로필 만들기 → 확정 v1 → 3안 → A안 → "A안으로 편집 시작".
- 편집기: Services(services-1) 삭제(클릭) → **이후 키보드만**: Shift+Tab으로 "더보기" → Enter = 메뉴(포커스 "실행 취소: Services 삭제", "다시 실행" `aria-disabled` + 설명 "되돌릴 편집이 없습니다") → Enter = 행 복원 + 알림 "실행 취소: Services 삭제" + 포커스 `#studio-more` · `aria-expanded=false` → Enter → ArrowDown → Enter = 다시 삭제 + "다시 실행: Services 삭제" → Enter → End/Home/ArrowUp 이동 확인 → Esc = 닫힘 + 포커스 트리거.
- 캡처 3장: `shots/1-1280-menu-open-undo.png` · `2-1280-undo-notice.png` · `3-1280-redo-disabled-reason.png`(captureBeyondViewport:false + 뷰포트 clip).
- space 16 `finish({keep:[]})` → `listTaskSpaces()` = []. preview 종료, 4337 리슨 0. 5480 무접촉. 창 상태 조회(`Browser.getWindowForTarget`)는 "No web contents" 오류로 못 함 — 캡처는 정상 출력.
- 390 캡처 없음(브리프 "있으면"), Codex 수정 2건(Tab·로딩 중 포커스)은 브라우저 재확인 없이 단위 테스트로만 확인.

## Codex (`review --scope branch --base 19a97d0`, 2라운드 = 상한)
| 라운드 | 지적 | 처리 |
|---|---|---|
| r1 | P2 미리보기 잠금 중 화살표로 메뉴 열림 | `f653046` 트리거 aria-disabled면 화살표 무시 + 회귀 |
| r1 | P2 청크 로딩 중 이동한 포커스를 본문이 빼앗음 | `f653046` 마운트 시 포커스가 트리거·body가 아니면 닫기 + 회귀 |
| r2 | P2 메뉴에서 Tab 시 포커스 body로 유실 | `abba563` Tab = 트리거로 포커스 후 기본 이동 + 회귀. 상한이라 r3 없음 |

## SPEC과 다르게 한 곳
- **<1280 "스냅샷"을 "더보기" 안으로 옮기기: 안 함.** 남은 여유 0.11(128.67 − 128.56)이고 대화상자 복귀 포커스(7절 "<1280 더보기")·잠금 경로까지 바뀌어 위험 대비 이득이 작다 → "스냅샷"은 모든 폭 툴바(ER-4b와 같은 SPEC 차이 유지). B-ER-09의 이 부분은 열린 채로 남김.
- "다시 실행" 비활성 이유도 SPEC 문구 "되돌릴 편집이 없습니다"를 그대로 씀(SPEC에 다시 실행 전용 문구 없음).
- 메뉴 항목은 `div role=menuitem`(네이티브 버튼 아님) — Enter/Space 이중 실행 방지. 미리보기 중에는 트리거가 잠겨 메뉴가 열리지 않는다.

## 남은 것 · 필요한 것
- 병합·push 안 함(브리프 금지). BACKLOG B-ER-09 갱신은 docs 수정 금지라 Jarvis 몫: "더보기" 실행 취소·다시 실행 닫힘, <1280 스냅샷 이동은 열림.
