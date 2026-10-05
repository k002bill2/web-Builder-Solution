# M2C-3 PROGRESS — 이미지 슬롯 UI · 탭 메모리 보관소 · 캔버스 연결

base `d25fe49` · 브랜치 `k002bill2/m2c-3`

- [x] P0: BRIEF 커밋 + 시작 build 실측(`logs/build-start.txt`: 진입 127.36 · 첫 91.79 · /profile 첫 99.62 · 렌더 JS 84.19 / CSS 8.80)
- [x] 시제품 1(SPEC 2.1 배치 그대로: 진입 버튼 + retryableImport 로더 + StudioLayout 보관소 자리 state·ref·effect 2 · undoTarget.before) → 진입 **127.58**(+0.22, 감지선 127.39 초과) — `logs/proto1.patch` · `logs/build-proto1.txt`
- [ ] 측정: StudioLayout 변경만 되돌린 build(비용 분해 — 배치 변경 횟수 아님)
- [ ] SPEC 7절 ① 캡션 lazy — 건너뜀: `canvasCaption.ts`는 쓰기 경로 밖 · 이 레인은 캡션을 바꾸지 않음(F2 캡션 = M2C-4)
- [ ] 배치 변경 1(SPEC 7절 ② 이미지 줄 → 패널 청크)
- [ ] 배치 변경 2(필요 시)
- [ ] 예산 통과 시: TDD 단계(테스트 수 예측 커밋 → RED → GREEN) · 보관소 · 패널 · 캔버스 연결
- [ ] 브라우저 4폭(1280·1024·768·390) 앱 안 클릭
- [ ] 마감: typecheck · lint · build · 전체 vitest · Codex review(branch base d25fe49) · REPORT
