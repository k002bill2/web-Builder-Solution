# ER-OFF2 REPORT — 상쇄 A1+A2 + ADR-004 개정 6 기준선 (동작 변화 0)

- 브랜치 `k002bill2/er-off2` · base `5bce9f9` · 서브에이전트 0 · push/merge/삭제 0
- **첫 줄: `/studio/:projectId` 진입 직후 128.42 → 128.24 (−0.18, 목표 −0.16 근처) · 판정선 128.70 대비 여유 0.46 · 다른 화면 ±0.01 · 렌더 JS 84.19 그대로.**

## 1. 커밋
| 커밋 | 내용 |
|---|---|
| `d698707` | ADR-004 개정 6 — `m2cBaseline.json` eagerKb 128.40→128.67 · base 5bce9f9 · note. `bundleBudget.test.mjs` 고정 숫자만 맞춤. 검사기 로직 변경 0 |
| `4bc0d05` | 동작 고정 테스트 `useSectionOps.pin.test.tsx` 6건(이동 전 GREEN) |
| `6840dc1` | A1+A2 이동 — 새 `features/studio/opAfter.ts`(docEngine 청크에서 export), `StudioLayout.tsx`·`useSectionOps.ts` 꼬리 → 한 줄 호출 |

## 2. 무엇을 옮겼나
- **A1** `StudioLayout` move·remove·swap·add의 `await loadDocEngine()` 뒤 꼬리(알림 문장·선택·되돌리기 대상·포커스) → `opAfter.afterMove/afterRemove/afterSwap/afterAdd`. 문장·호출 순서 그대로.
- **A2** `useSectionOps.run`의 `await applyDocOp` 뒤(docRef·stack.push·setLast·edit·결과) → `opAfter.commitOp`, `(await loadDocEngine()).commitOp(...)`로 호출. try 안 그대로(꼬리 예외 → 같은 거부 경로).
- 타이밍: A2는 `run`에 `await loadDocEngine()` 1회를 더한다. 연산 뒤라 청크는 이미 받은 상태 → microtask 몇 개만 늘고, 사용자 이벤트·React 커밋(macrotask)이 끼어들 수 없다 → 보이는 타이밍 변화 0. A1은 원래도 같은 await가 있었다.
- 현재 동작 고정(바꾸지 않음): `edit`(useSnapshots 편집 경계)이 `false`로 거절해도 `run`은 ok를 돌려주고 스택에 쌓는다 — ER-4 판단 몫.

## 3. 감량 실측 (`npm run build` · check-bundle-size, /studio 진입 직후)
| 상태 | 진입 | Δ |
|---|---|---|
| base(5bce9f9+개정6) | 128.42 | — |
| 1차 시도 A1+A2(opAfter가 `selection.ts`를 import) | 128.55 | **+0.13** → 수정 |
| A1만(최종 방식) | 128.28 | −0.14 |
| A2만 | 128.38 | −0.04 |
| **A1+A2 최종** | **128.24** | **−0.18** |

- 1차 +0.13 원인: docEngine 청크가 `selection.ts`(sectionName·variantName)를 import하자 rollup이 `selection` 공유 청크(0.37KB)를 새로 떼어 냄(StudioLayout −0.27을 상쇄하고 남음). 이름 함수를 호출하는 쪽에서 인자로 넘기게 바꿔 해결. 교훈: 조작 뒤 청크에서 진입 청크 모듈을 새로 import하면 공유 청크 분리로 진입이 늘 수 있다 — 인자로 넘긴다.
- 둘 다 감량이라 되돌린 부분 없음.
- 다른 화면(base → 최종): /catalog 102.04→102.03 · /references/:id 99.39→99.38 · /compare 121.70→121.70 · /profile 119.10→119.10 · /profile(3안) 121.57→121.56 · /projects 100.32→100.31 (첫 화면 합계 전부 그대로)
- 첫 화면 91.76 그대로 · docEngine 조작 뒤 +2.53 → +2.83(예산 판정 밖) · 렌더 JS 84.19 · CSS 8.85 그대로.

## 4. 동작 고정 테스트
- 새 `app/src/features/studio/useSectionOps.pin.test.tsx` 6건 — 예측 GREEN · 이동 전 6/6 GREEN · 이동 후 6/6 GREEN. 단언 약화·skip 0.
  기록 스택 {label,before,after} · undoable 되돌리기 대상/undoLast · undoable 아님 · edit 거절(미리보기 편집 경계) 현재 동작 · 테마 연산(index −1·values) · 엔진 거부.
- A1 화면 동작은 기존 테스트가 고정(이동 전후 GREEN): SectionMove · SectionRemove · SectionAdd · SectionVariant · ThemeSwap · SnapshotFlow.

## 5. Ego Lite (1280 · preview 4337 · space 88)
- `npm run build`(exit 0, `logs/build-final.txt`, /studio 진입 128.24) → `npx vite preview --host 127.0.0.1 --port 4337 --strictPort`. 시작 전 `listTaskSpaces()`=[].
- 경로 A(앱 안 클릭만·새로고침 0): 카탈로그 → ref-e(부티크 법률사무소) 상세 → 비교 추가 → 비교 보드 → "이 레퍼런스로 프로필 만들기" → 프로필 확정 v1 → 3안 만들기 → A안 선택 → "A안으로 편집 시작" → `/studio/project-1`.
  - 주: "밝은 카드" 선택 단계는 ref-e 1개 비교라 따로 고를 항목이 없어 "이 레퍼런스로 프로필 만들기"(전부 A 요소)로 대신함.
- 결과(DOM·알림 문장 확인):
  | 조작 | 섹션 순서/상태 | 알림(status) | 포커스·선택 |
  |---|---|---|---|
  | 이동: Services 선택 → 아래로 | Header·Hero·About·**Services**·Portfolio… | "Services를 4번째로 옮겼습니다" | 포커스 "아래로" 유지 · 선택 Services 유지 |
  | 삭제: Services | Services 빠짐(7개) | "Services를 삭제했습니다" · "되돌리기" 버튼 노출 | 포커스 다음 섹션(Portfolio) |
  | 되돌리기 | Services 4번째로 복귀(8개) | "Services를 되돌렸습니다" | 포커스 Services |
  | 추가: 섹션 추가 → About → 추가 | 5번째에 About(9개) | "About을 5번째에 추가했습니다" | 포커스 새 About · 대화상자 닫힘 |
  | 테마 바꾸기 | 대화상자 열림, 버전 v1 하나("지금 쓰는 테마입니다") | — | "바꾸기" `aria-disabled=true` → 적용 불가 |
- 테마 적용 실제 변경은 **미확인**: 프로필 v1 하나뿐이라 고를 다른 테마가 없음(v2를 만들려면 프로필 조정 저장 왕복이 필요 — 턴 상한으로 생략). 테마 적용 꼬리(afterSwap)는 ThemeSwap 컴포넌트 테스트(48·68·95)가 고정.
- 캡처 0장: `page.screenshot` → `CdpRequestTimeoutError: Page.captureScreenshot` 2회(최초 + 1회 재시도). 원인 추정(확인 안 됨): `Emulation.setDeviceMetricsOverride` 1280 상태의 백그라운드 창에서 프레임 캡처가 안 돌아옴. **대체: 위 DOM·알림 문장·포커스 확인.**
- 정리: `Emulation.clearDeviceMetricsOverride` → `finish({keep:[]})` → `listTaskSpaces()`=[] · preview(PID 88995/89025) 종료 → 4337 리슨 0 · main 5480 무접촉.

## 6. 마감 게이트 (fresh, 최종 커밋 6840dc1 + 문서)
- `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npx vitest run` exit 0 — **237 files / 2111 tests 통과** (`logs/final-*.txt`)
- `npm run build` exit 0 — /studio 진입 128.24 / 판정선 128.70 (`logs/build-final.txt`)

## 7. Codex
- r1 `review --scope branch --base 5bce9f9` (`logs/codex-r1.txt`): **지적 0** — "새로 도입된 구체적인 결함은 발견하지 못했습니다. 타입 검사와 diff 검사는 통과". Codex 쪽 vitest는 샌드박스 EPERM으로 미실행 → 6절에서 직접 실행으로 보완. r2 불필요(지적 0).
