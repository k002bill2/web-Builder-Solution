# ER-4 PROGRESS — 실행 취소 (ER-AC-U1~U5 · C1) + B-ER-04~06

base `dd6b0f7` · 판정선 `/studio` 진입 **128.70** · 기준 실측 128.24(첫 화면 91.76) — `logs/build-base.txt:154`

## 체크리스트
- [x] P0 BRIEF 명시 커밋 (c5f3559)
- [x] ① B-ER-05 edit 거절 = run 실패 (pin 테스트 의도 변경)
- [x] ② B-ER-06 스냅샷 생성 응답 시점 참조 집합 갱신
- [x] ③ B-ER-04 테마 되돌리기 → "테마 바꾸기" 포커스
- [ ] ④ U1·U2·U5 Ctrl/⌘+Z · 다시 실행 · 입력칸 가로채기 0 · 미리보기 무시 · 상한 50 · 언마운트 비움
- [ ] ⑤ U4 더보기(MoreMenu 조작 뒤 청크 · <1280 스냅샷 이동)
- [ ] ⑥ U3 필드 편집 묶음
- [ ] Ego Lite build+preview 4337 경로 A 1280·390 · finish · listTaskSpaces()=[] · 서버 종료
- [ ] 전체 vitest · typecheck · lint · build
- [ ] Codex review --scope branch --base dd6b0f7 (≤2)
- [ ] REPORT 커밋

## TDD 예측 (RED 전)
| 단계 | 새/바뀐 테스트 | RED 예측 |
|---|---|---|
| ① | pin 테스트 1건 기대 변경(새 0) — "edit 거절 → ok false · 스택 0 · docRef 불변" | 1 fail (현재 ok true) |
| ② | exportFlow.test +1 — 응답 직후 onSnapshot → 그다음 폴링 | 1 fail (onSnapshot 미호출) |
| ③ | ThemeSwap.test +1 — 되돌리기 키보드 실행 뒤 포커스 "테마 바꾸기" | 1 fail (body) |

## 번들 실측 (/studio 진입 직후 · 첫 화면, gzip KB)
| 단계 | 진입 | 첫 화면 | 로그 |
|---|---|---|---|
| 기준 dd6b0f7 | 128.24 | 91.76 | logs/build-base.txt |
| ①②③ (e2301c4) | 128.28 | 91.76 | logs/build-1-3.txt — 다른 화면 diff 0 · vitest 237/2113 PASS |

## 목업·SPEC과 다르게 한 곳
