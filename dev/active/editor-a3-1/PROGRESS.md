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
- [x] K5 섹션 추가 대화상자 (E-AC-18) (RED 6c9fcb4 · GREEN)
- [x] K6 변형 교체 (E-AC-20) (RED f93e38f · GREEN)
- [x] K7 빈 슬롯 (E-AC-24) · 엔진 불변 (E-AC-23) (RED 53f36df · GREEN)
- [ ] K8 전체 vitest 3회 · Codex 1회 · REPORT

## 번들 기준 (K0, gzip KB 첫 / 진입)
| 화면 | K0 | K3 | K4 | K5 | K6 | K7 |
|---|---|---|---|---|---|---|
| 공통 | 89.34 | 89.34 | 89.34 | 89.34 | 89.34 | 89.35 |
| /catalog | 99.64 / 102.03 | 99.65 / 102.03 | 99.64 / 102.02 | 99.64 / 102.02 | 99.64 / 102.03 | 99.65 / 102.03 |
| /references/:id | 96.99 / 99.38 | 96.99 / 99.38 | 96.99 / 99.37 | 96.99 / 99.37 | 96.99 / 99.38 | 97.00 / 99.38 |
| /compare · (조정 있음) | 98.75 / 121.39 | 98.76 / 121.40 | 98.75 / 121.39 | 98.75 / 121.39 | 98.75 / 121.39 | 98.76 / 121.40 |
| /profile | 99.61 / 123.64 | 99.61 / 123.65 | 99.60 / 123.64 | 99.60 / 123.64 | 99.60 / 123.64 | 99.61 / 123.65 |
| /projects | 94.00 / 107.04 | 94.00 / 107.06 | 93.99 / 107.05 | 94.00 / 107.06 | 94.00 / 107.07 | 94.00 / 107.06 |
| /studio/:projectId | 91.64 / 118.88 | 91.65 / 121.34 | 91.64 / 121.75 | 91.65 / 122.14 | 91.64 / 122.63 | 91.65 / 122.68 |
| /studio 조작 뒤 docEngine | — | +1.44 | +1.44 | +1.44 | +1.57 | +1.45 |
| /studio 조작 뒤 AddSectionDialog | — | — | — | +1.16 | +1.17 | +1.17 |
| /studio 조작 뒤 VariantOptions | — | — | — | — | +1.12 | +1.04 |

## 메모
- 기존 편집 틀(StudioLayout 청크, 진입 직후)은 이미 engine 값(registry·slotOps·hash·gateText)을 정적 import — 새 화면 부품은 engine 값을 직접 부르지 않고 `features/studio/*` 어댑터를 거친다. 변이 연산(sectionOps)은 docOps가 동적 import(조작 뒤).
- K3 번들: /studio 진입 +2.46 = StudioLayout 청크 8.39→10.04(연산 훅·순서 부품·알림 문장·포커스) + 공유 issue 청크 4.80→5.59(rules·reasons 정적 — 렌더 때 이유 필요). 다른 화면 ±0.02 이내.
- StudioLayout.test `draw()`에 ProfileRepositoryProvider(프로필 없음 스텁)를 씌움 — 편집 틀이 목적을 프로필 저장소에서 읽게 되어(K1). 단언 변경 0.
- K4 RED 테스트 기대 1건 정정(GREEN 전): Services 삭제 뒤 FAQ 위로 = '3번째'(RED 초안 '4번째'는 계산 오류).
- K5: jsdom 30에 `showModal`·`close` 없음(실측) → `src/test/setup.ts`에 테스트 전용 대체(열림 속성만). RED 테스트 이름 매처 1건 정정(줄 버튼 접근 이름 = 'Services목록형', 공백 없음).
- K6: /projects 진입 +0.03(K0 대비, 한도 ±0.03 경계) — memoryProjectRepository 청크 +0.032 = memoryDocBook 동적 import preload 목록(__vite__mapDeps)에 새 공유 청크 이름이 늘어난 몫(앱 코드 변화 0). diff를 docEngine으로 묶는 시도는 /projects 첫 +0.26으로 악화 → 되돌림.
- 변형 라디오 접근 이름 = 이름표(`aria-labelledby`), 캡션 = 설명 — 이름에 캡션이 섞이지 않게.
- K6-perf: 변형 캡션 diffSlots를 docEngine(동적)에서 받도록 → diff가 연산 청크에 묶여 공유 청크 1개 감소 · /projects 진입 107.08→107.06. 빌드마다 청크 해시 이름 차이로 ±0.01 흔들림 관측.
- K7: blur 필수 오류는 a2 FieldEditor에 이미 있어 통합 테스트로 회귀 확인(RED는 자리표시 3건). E-AC-23 불변 테스트는 engine/ 쓰기 금지라 `features/studio/engineInvariance.test.ts`.
