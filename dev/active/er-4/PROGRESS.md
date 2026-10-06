# ER-4 PROGRESS — 실행 취소 (ER-AC-U1~U5 · C1) + B-ER-04~06

base `dd6b0f7` · 판정선 `/studio` 진입 **128.70** · 기준 실측 128.24(첫 화면 91.76) — `logs/build-base.txt:154`

## 체크리스트
- [x] P0 BRIEF 명시 커밋 (c5f3559)
- [x] ① B-ER-05 edit 거절 = run 실패 (pin 테스트 의도 변경)
- [x] ② B-ER-06 스냅샷 생성 응답 시점 참조 집합 갱신
- [x] ③ B-ER-04 테마 되돌리기 → "테마 바꾸기" 포커스
- [ ] ④ U1·U2·U5 Ctrl/⌘+Z · 다시 실행 · 입력칸 가로채기 0 · 미리보기 무시 · 상한 50 · 언마운트 비움 — BLOCKED: 진입 128.96 > 판정선 128.70(build-4.txt). 코드는 로컬 브랜치 k002bill2/er-4-step4-wip(fd3385a)에 보존, er-4 tip 미포함
- [ ] ⑤ U4 더보기(MoreMenu 조작 뒤 청크 · <1280 스냅샷 이동) — BLOCKED: ④ 판정선 멈춤 · 미착수
- [ ] ⑥ U3 필드 편집 묶음 — BLOCKED: ④ 판정선 멈춤 · 미착수(StudioLayoutImages "되돌리기 무효화" 단언과 충돌 가능 — REPORT)
- [ ] Ego Lite build+preview 4337 경로 A 1280·390 · finish · listTaskSpaces()=[] · 서버 종료 — BLOCKED: 판정선 멈춤 규칙 "추가 빌드 시도 금지" — dist/는 ④ WIP 산출물이라 tip 검증 불가 · 세션 열지 않음 · 4337 리슨 0 확인
- [x] 전체 vitest · typecheck · lint · build — tip 앱 코드 = e2301c4(`git diff --stat e2301c4 HEAD -- app/` 비어 있음): vitest 237/2113 · build exit 0(build-1-3.txt). tip 70bae59 fresh: tsc 0 · lint 0 · vitest 237/2114 (logs/vitest-tip.txt)
- [x] Codex review --scope branch --base dd6b0f7 (≤2) — r1 지적 0 (logs/codex-r1.txt)
- [x] REPORT 커밋 (dev/active/er-4/REPORT.md)

## TDD 예측 (RED 전)
| 단계 | 새/바뀐 테스트 | RED 예측 |
|---|---|---|
| ① | pin 테스트 1건 기대 변경(새 0) — "edit 거절 → ok false · 스택 0 · docRef 불변" | 1 fail (현재 ok true) |
| ② | exportFlow.test +1 — 응답 직후 onSnapshot → 그다음 폴링 | 1 fail (onSnapshot 미호출) |
| ③ | ThemeSwap.test +1 — 되돌리기 키보드 실행 뒤 포커스 "테마 바꾸기" | 1 fail (body) |
| ①~③ 실제 | logs/red-1-3.txt | 예측대로 3 fail → GREEN 26/26 |
| ④ | undoStack +1 · historyKeys +2(새 파일) · UndoKeys +4(새 파일) | 전부 fail |
| ④ 실제 | logs/red-4.txt | undoStack +2(참조 집합 1건 추가) · historyKeys 모듈 없음 fail · UndoKeys 2 fail + 입력칸 가드 2건은 구현 전에도 통과(리스너 없음) — WIP 브랜치에만 있음 |

## 번들 실측 (/studio 진입 직후 · 첫 화면, gzip KB)
| 단계 | 진입 | 첫 화면 | 로그 |
|---|---|---|---|
| 기준 dd6b0f7 | 128.24 | 91.76 | logs/build-base.txt |
| ①②③ (e2301c4) | 128.28 | 91.76 | logs/build-1-3.txt — 다른 화면 +0.01~0.02(±0.03 안) · vitest 237/2113 PASS |
| ④ (WIP fd3385a, 미병합) | **128.96 > 128.70 판정선 초과 → 멈춤** | 91.76 | logs/build-4.txt — StudioLayout 청크 gzip 18.04→18.75(+0.71) · docEngine +0.09 · 나머지 ±0.01 · tsc·lint·vitest 239/2121 PASS |

## 목업·SPEC과 다르게 한 곳
- ③ 테마 되돌리기 포커스: SPEC 7절 "실행 취소 = 이동 없음"과 달리 "테마 바꾸기"로 이동 — B-ER-04(사라지는 버튼 → 유지되는 컨트롤) 우선
