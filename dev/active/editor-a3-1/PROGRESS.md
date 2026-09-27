# EDITOR-A3-1 PROGRESS — 섹션 구조 연산

- 수신: 2026-09-28 · 브리프 `docs/06-handoff/EDITOR-A3-1_BRIEF.md` 전체 읽음 · 기준 SPEC `docs/design/2a-05/SPEC.md` r4.6
- 시작 커밋(= Codex base): `e9d997616a93693ce96519165590af77c70c9c04` (main, 브리프 포함)
- 브랜치: `k002bill2/editor-a3-1` · 포트 4337 · 서브에이전트 금지 · engine/ 쓰기 금지 · push·병합·삭제 금지

## 체크리스트
- [x] K0 기준 build (`logs/k0-build.txt`) · 수신 기록
- [ ] K1 목적 파생 `features/studio/docPurpose.ts`
- [ ] K2 연산 어댑터 `docOps.ts` + `undoStack.ts`
- [ ] K3 위로·아래로 (E-AC-17)
- [ ] K4 삭제·되돌리기 (E-AC-19)
- [ ] K5 섹션 추가 대화상자 (E-AC-18)
- [ ] K6 변형 교체 (E-AC-20)
- [ ] K7 빈 슬롯 (E-AC-24) · 엔진 불변 (E-AC-23)
- [ ] K8 전체 vitest 3회 · Codex 1회 · REPORT

## 번들 기준 (K0, gzip KB 첫 / 진입)
| 화면 | K0 |
|---|---|
| 공통 | 89.34 |
| /catalog | 99.64 / 102.03 |
| /references/:id | 96.99 / 99.38 |
| /compare · (조정 있음) | 98.75 / 121.39 |
| /profile | 99.61 / 123.64 |
| /projects | 94.00 / 107.04 |
| /studio/:projectId | 91.64 / 118.88 |

## 메모
- 기존 편집 틀(StudioLayout 청크, 진입 직후)은 이미 engine 값(registry·slotOps·hash·gateText)을 정적 import — 새 화면 부품은 engine 값을 직접 부르지 않고 `features/studio/*` 어댑터를 거친다. 변이 연산(sectionOps)은 docOps가 동적 import(조작 뒤).
