# EDITOR-A3-1 PROGRESS — 섹션 구조 연산

- 수신: 2026-09-28 · 브리프 `docs/06-handoff/EDITOR-A3-1_BRIEF.md` 전체 읽음 · 기준 SPEC `docs/design/2a-05/SPEC.md` r4.6
- 시작 커밋(= Codex base): `e9d997616a93693ce96519165590af77c70c9c04` (main, 브리프 포함)
- 브랜치: `k002bill2/editor-a3-1` · 포트 4337 · 서브에이전트 금지 · engine/ 쓰기 금지 · push·병합·삭제 금지

## 체크리스트
- [x] K0 기준 build (`logs/k0-build.txt`) · 수신 기록
- [x] K1 목적 파생 `features/studio/docPurpose.ts` (RED d16b7bb · GREEN)
- [x] K2 연산 어댑터 `docOps.ts` + `undoStack.ts` (RED 88c6193 · GREEN)
- [x] K3 위로·아래로 (E-AC-17) (RED 1cd6dd3 · GREEN)
- [x] K4 삭제·되돌리기 (E-AC-19) (RED e0bb6bb · GREEN)
- [ ] K5 섹션 추가 대화상자 (E-AC-18)
- [ ] K6 변형 교체 (E-AC-20)
- [ ] K7 빈 슬롯 (E-AC-24) · 엔진 불변 (E-AC-23)
- [ ] K8 전체 vitest 3회 · Codex 1회 · REPORT

## 번들 기준 (K0, gzip KB 첫 / 진입)
| 화면 | K0 | K3 | K4 |
|---|---|---|---|
| 공통 | 89.34 | 89.34 | 89.34 |
| /catalog | 99.64 / 102.03 | 99.65 / 102.03 | 99.64 / 102.02 |
| /references/:id | 96.99 / 99.38 | 96.99 / 99.38 | 96.99 / 99.37 |
| /compare · (조정 있음) | 98.75 / 121.39 | 98.76 / 121.40 | 98.75 / 121.39 |
| /profile | 99.61 / 123.64 | 99.61 / 123.65 | 99.60 / 123.64 |
| /projects | 94.00 / 107.04 | 94.00 / 107.06 | 93.99 / 107.05 |
| /studio/:projectId | 91.64 / 118.88 | 91.65 / 121.34 | 91.64 / 121.75 |
| /studio 조작 뒤 docEngine | — | +1.44 | +1.44 |

## 메모
- 기존 편집 틀(StudioLayout 청크, 진입 직후)은 이미 engine 값(registry·slotOps·hash·gateText)을 정적 import — 새 화면 부품은 engine 값을 직접 부르지 않고 `features/studio/*` 어댑터를 거친다. 변이 연산(sectionOps)은 docOps가 동적 import(조작 뒤).
- K3 번들: /studio 진입 +2.46 = StudioLayout 청크 8.39→10.04(연산 훅·순서 부품·알림 문장·포커스) + 공유 issue 청크 4.80→5.59(rules·reasons 정적 — 렌더 때 이유 필요). 다른 화면 ±0.02 이내.
- StudioLayout.test `draw()`에 ProfileRepositoryProvider(프로필 없음 스텁)를 씌움 — 편집 틀이 목적을 프로필 저장소에서 읽게 되어(K1). 단언 변경 0.
- K4 RED 테스트 기대 1건 정정(GREEN 전): Services 삭제 뒤 FAQ 위로 = '3번째'(RED 초안 '4번째'는 계산 오류).
