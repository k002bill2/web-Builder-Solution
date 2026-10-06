# ER-4b PROGRESS — ④ 상쇄 재시도 + 조건부 ⑤

base main `6658430` + ④ WIP 병합(97c826d). 판정선 /studio 진입 직후 ≤128.70KB(ADR-004 개정 6).

## 체크리스트
- [x] 1. ④ 상쇄 — /studio 128.56 ≤128.70, 동작 변화 0(④ 테스트·U1·U2·U5 GREEN), 커밋
- [x] 2. ⑤ U4 더보기 — 미시도(조건 미달: 128.56 > 128.55) → B-ER-09
- [x] 3. Ego Lite build+preview 4337 · 1280·390 · 정리(finish keep:[] · listTaskSpaces=[] · 리슨 0) — 390 테마 되돌리기 클릭 미도달(미확인), 캡처 2회 시간초과→DOM 대체
- [x] 4. typecheck · lint · build · 전체 vitest exit 0
- [x] 5. Codex review r1 완료 — P2 1건 미반영. BLOCKED: 40턴 규칙으로 수정 중단(REPORT 1절)
- [x] 6. REPORT.md 커밋

## 감량 시도 표
| 시도 | 변경 | /studio 진입 직후 | StudioLayout gz / raw | docEngine gz | build | 로그 |
|---|---|---|---|---|---|---|
| 0 (④ WIP 그대로) | — | 128.96 | 18.75 / 56.62 | 1.49 | exit 1 | logs/build-0.txt |
| 1 | 스택 생성을 opAfter(조작 뒤)로 지연(UndoBox) · 알림 문장·포커스 꼬리를 stepHistory로 · historyKeys 선택자 1개 · 미사용 undoLabel/redoLabel 제거 | 128.63 | 18.39 / 55.76 | 1.84 | exit 0 | logs/build-1.txt — **채택 안 함**: 전체 vitest 6건 실패(useSectionOps.pin.test가 useUndoStack mock으로 스택을 잡음 · logs/vitest-1.txt). 테스트 수정은 단언 약화라 하지 않음 |
| 2 | 1에서 스택 지연만 되돌림(useUndoStack 진입 유지) | 128.84 | 18.60 / 56.28 | 1.61 | exit 1 | logs/build-2.txt |
| (추정, 빌드 아님) | dist 산출물 gzip 절단: historyKeys 전체 0.202 · 스택 확장 전체 0.120 · 스택 압축 0.013 · 선택자 축약 0.027 | — | — | — | — | node zlib 기본 레벨 |
| 3 | keydown 리스너·판정(historyKeys)을 조작 뒤 청크 listenHistory로 — 첫 연산 뒤 붙임(그 전엔 기록 없음), StudioLayout은 맥락 ref만 · 스택 한 줄+커서 압축 · history 카운터 제거 | **128.56** | 18.35 / 55.71 | 1.94 | exit 0 | logs/build-3.txt · vitest 239/2122 logs/vitest-3.txt |

## 목업·브리프와 다른 점(사유)
- 브리프 1번 "진입에는 최소 동기 판정만" → 판정까지 조작 뒤 청크로 옮김(진입 판정 0). 사유: 판정 자체가 0.20KB라 진입에 남기면 3회 안에 판정선을 못 맞춤(추정 128.75). 첫 연산 전에는 기록이 없어 Ctrl+Z가 할 일이 없으므로 사용자 동작 차이 없음 — 단, 첫 연산 전 Ctrl+Z는 preventDefault 하지 않음(입력칸 밖 브라우저 기본 동작 = 없음).

## 수정(2차) — Codex r1 P2 미리보기 복귀 뒤 단축키 무시
- [x] 1. 회귀 테스트 `UndoKeys.test.tsx` "스냅샷 미리보기 복귀 뒤" 추가. 예측: Ctrl+Z preventDefault는 true지만 행 복원 실패(옛 `edit`이 false). RED 실측 일치 — 82행 rowIds에 s-services 없음(logs/fix2-red.txt). RED는 커밋하지 않음
- [ ] 2. 수정: `HistoryKeys`에 `step` · StudioLayout 맥락 effect가 `ops.step` 갱신 · `listenHistory`가 `ctx.step` 호출 → GREEN 커밋
- [ ] 3. /studio 진입 ≤128.70 (build)
- [ ] 4. typecheck · lint · build · 전체 vitest exit 0
- [ ] 5. Ego Lite 4337 1280: 삭제→미리보기→돌아가기→Ctrl+Z 복원 · 정리
- [ ] 6. Codex review --scope branch --base 6658430 1회
- [ ] 7. REPORT "## 7. 수정(2차)" 커밋
