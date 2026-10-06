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
- 다른 화면(base → 최종): BUNDLE_TABLE
- 첫 화면 91.76 그대로 · docEngine 조작 뒤 +2.53 → +2.83(예산 판정 밖) · 렌더 JS 84.19 · CSS 8.85 그대로.

## 4. 동작 고정 테스트
- 새 `app/src/features/studio/useSectionOps.pin.test.tsx` 6건 — 예측 GREEN · 이동 전 6/6 GREEN · 이동 후 6/6 GREEN. 단언 약화·skip 0.
  기록 스택 {label,before,after} · undoable 되돌리기 대상/undoLast · undoable 아님 · edit 거절(미리보기 편집 경계) 현재 동작 · 테마 연산(index −1·values) · 엔진 거부.
- A1 화면 동작은 기존 테스트가 고정(이동 전후 GREEN): SectionMove · SectionRemove · SectionAdd · SectionVariant · ThemeSwap · SnapshotFlow.

## 5. Ego Lite — 진행 중
## 6. 마감 게이트 — 진행 중
## 7. Codex — 진행 중
