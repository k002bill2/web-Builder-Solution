# ER-OFF2 PROGRESS — 상쇄 A1+A2 + ADR-004 개정 6 기준선

- base `5bce9f9` · 브랜치 `k002bill2/er-off2` · 서브에이전트 0

## 체크리스트
- [x] 1. 개정 6 커밋 `d698707` — m2cBaseline.json eagerKb 128.40→128.67 · base 5bce9f9 · note, bundleBudget.test.mjs 고정 숫자만 맞춤(로직 변경 0). `vitest scripts/bundleBudget.test.mjs` 16/16
- [x] 2a. 옮기기 전 동작 고정 테스트 `4bc0d05` (6/6 GREEN — 예측대로)
- [x] 2b. A1 이동(StudioLayout move·remove·swap·add 꼬리 → docEngine `opAfter.ts`)
- [x] 2c. A2 이동(useSectionOps.run 꼬리 → docEngine `commitOp`) — 이동 후 studio·scripts 62 files 483 tests GREEN
- [x] 3. 감량 실측 표 (REPORT 3절)
- [x] 4. Ego Lite 1280 경로 A — 이동·삭제·되돌리기·추가 확인, finish·listTaskSpaces()=[]·4337 리슨 0. 캡처 0(CDP 타임아웃 2회 → DOM 대체), 테마 실제 적용은 v1 하나뿐이라 미확인(REPORT 5절)
- [x] 5. typecheck·lint·build·vitest(237/2111) exit 0 · Codex r1 지적 0 · REPORT 5~7절

## 기준 실측 (5bce9f9 + 개정6, `npm run build`)
- /studio/:projectId 진입 직후 128.42 · 첫 화면 91.76 · docEngine 조작 뒤 +2.53
- /catalog 99.65·102.04 · /compare 98.83·121.70 · /projects 94.02·100.32 · 렌더 JS 84.19 · CSS 8.85

## 2a 동작 고정 테스트 — 예측
- 새 `app/src/features/studio/useSectionOps.pin.test.tsx` 6건(기록 스택 push/pop·되돌리기 대상·edit 거절(미리보기 편집 경계) 시 현재 동작·테마 연산·엔진 거부).
  예측: 이동 전 GREEN(동작 고정) → 실제 6/6 GREEN. 이동 후에도 GREEN 이어야 함.
- A1(포커스·알림·선택·되돌리기 문장)은 기존 컴포넌트 테스트가 이미 고정: SectionMove(26·70) · SectionRemove(38·51·67·85·140·150) · SectionAdd(50·66·106) · SectionVariant(62) · ThemeSwap(48·68·95) · SnapshotFlow(114·323). 예측: 이동 전후 GREEN.
- 주의: edit 거절(false)이어도 run은 ok·스택 push — 현재 동작 그대로 고정(바꾸지 않음, ER-4 판단 몫).

## 3 실측 (vite build + check-bundle-size, /studio/:projectId 진입 직후)
| 상태 | 진입 | Δ |
|---|---|---|
| base(5bce9f9+개정6) | 128.42 | — |
| 1차 시도 A1+A2 (opAfter가 selection.ts import) | 128.55 | **+0.13** — selection 공유 청크(0.37) 새로 생김 → 이름 함수를 인자로 넘기게 수정 |
| A1만 | 128.28 | −0.14 |
| A2만 | 128.38 | −0.04 |
| **A1+A2(최종)** | **128.24** | **−0.18** |
- 다른 화면 ±0.01(해시 잡음), 첫 화면 91.76 그대로, docEngine 조작 뒤 +2.53 → +2.83.
