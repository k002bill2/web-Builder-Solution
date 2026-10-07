# M3P-7 PROGRESS

- [x] P0 BRIEF 커밋
- [x] B-M3P-08 About 2개 원인 L1 특정 (TDD 예측 기록)
  - L1: `fixtures/referenceComparisons.ts` ref-c sectionPlan에 `about/split`(소개)+`about/team-grid-3`(의료진) — `ENGINE_VARIANT_MAP`이 둘 다 `story`로 접음(표는 VARIANT-MAP.md 정본 → 수정 대상 아님). 프로필 `section_plan` = 이 sectionPlan(`profileDraft.ts:187`) → 3안 → writeStartDoc. **데이터 문제.**
  - 21개 렌더 스캔(스크래치): 같은 (유형, 엔진 변형) 중복 = ref-c about/story · ref-e portfolio/grid-3(case-list+insights-grid-3) · ref-f contact/form(order-form+map-form). 생성 15 = 0.
  - 규칙: 렌더 문서에서 같은 (type, 엔진 변형) 쌍 0(같은 유형·다른 변형은 허용 — ref-c/d services). 수정 = 뒤쪽 중복 행 삭제.
  - 옛 썸네일 버전 `8d7310f2`.
  - TDD 예측(RED): 중복 테스트 c/e/f 3건 실패 · 상세 1:1(21) 큐레이션 6건 실패(ref-a Footer 누락 포함) · 동네 치과 편집 문서 About 2개 실패.
- [x] B-M3P-08 최소 수정 + 21개 전수 중복 검사 테스트 (cb7527c)
- [x] B-M3P-05 큐레이션 6 상세 = 렌더 1:1 (detailRender 확장) + G5 해시 갱신 (cb7527c) — 썸네일 버전은 build 단계에서 기록
- [x] B-M3P-07 comparePreviews industryCopy 적용 (173eacd)
- [x] typecheck·lint·build(번들 표) — build exit0(typecheck 포함), lint exit0, /studio 진입 128.51(판정선 128.58), 썸네일 8d7310f2→28c1813c
- [x] 전체 vitest exit0 — 253 files / 2219 tests
- [x] Ego Lite 확인 — ref-a Footer(shots/1)·3안 hero(shots/2)·편집기 About 1개·hero "아픈 곳을 먼저 듣는 진료실" 동일(shots/3). space 18 finish, listTaskSpaces=[], 4337 리슨 0
- [ ] Codex review --scope branch --base be5292b (≤2) — Developer 미실시, Jarvis 실행
- [x] REPORT (Jarvis 커밋)
