# M2C-3 PROGRESS — 이미지 슬롯 UI · 탭 메모리 보관소 · 캔버스 연결

base `d25fe49` · 브랜치 `k002bill2/m2c-3`

- [x] P0: BRIEF 커밋 + 시작 build 실측(`logs/build-start.txt`: 진입 127.36 · 첫 91.79 · /profile 첫 99.62 · 렌더 JS 84.19 / CSS 8.80)
- [x] 시제품 1(SPEC 2.1 배치 그대로: 진입 버튼 + retryableImport 로더 + StudioLayout 보관소 자리 state·ref·effect 2 · undoTarget.before) → 진입 **127.58**(+0.22, 감지선 127.39 초과) — `logs/proto1.patch` · `logs/build-proto1.txt`
- [x] 측정: StudioLayout 변경만 되돌린 build → 127.49(버튼·로더 +0.13 · 호스팅 +0.09) — `logs/build-measure-editfields-only.txt`
- [x] SPEC 7절 ① 캡션 lazy — 건너뜀: `canvasCaption.ts`는 쓰기 경로 밖 · 이 레인은 캡션을 바꾸지 않음(F2 캡션 = M2C-4)
- [x] 배치 변경 1(SPEC 7절 ② details+lazy · state 1쌍) → **127.47**(+0.11) 실패 — `logs/try1.patch` · `build-try1.txt`
- [x] 배치 변경 2(기존 조작 뒤 청크 공유 — 청크 참조 34B 제거 시험) → **127.44**(+0.08) 실패 — `logs/try2.patch` · `build-try2.txt` → **멈춤**, `app/` base로 되돌림(diff 0줄)
- [ ] TDD·보관소·패널·캔버스 연결 — BLOCKED: 예산 멈춤(브리프 "구현 전에 멈추고 보고") · 구조 점검 레인/ADR 결정 필요(REPORT 4절)
- [ ] 브라우저 4폭 — BLOCKED: 구현 없음(예산 멈춤)
- [x] REPORT 작성(`REPORT.md`) · 되돌린 뒤 build exit 0 · 진입 127.36(`logs/build-after-revert.txt`)
- [ ] typecheck·lint·vitest·Codex review — BLOCKED/해당 없음: 앱 코드 diff 0줄(base와 동일) — 새로 증명할 코드가 없음(REPORT 3절)

## 재개 (2026-10-06 · DECISION-RESUME · HEAD 7d05f94 = main ab5fa4a 병합)
- [x] R0: 시작 build 재실측 `logs/build-resume-start.txt` — `/studio` 진입 **127.14** · 첫 91.77 · `/profile` 첫 99.61 · `/catalog` 99.64 · 렌더 JS 84.19 / CSS 8.80
- [x] R0: 시제품 = `try1.patch` 그대로 적용 build `logs/build-resume-proto.txt` — 진입 **127.23**(+0.09) · `/catalog` 99.66(+0.02) · `/compare` 자동 로드 121.71(+0.03) · 렌더 변화 0 → 감지선 127.39까지 여유 0.16 — 진행
- [ ] R1 보관소 순수 함수(참조 집합·prune·한도·pickVariant) TDD
- [ ] R2 ImageSlotPanel TDD(파일 선택·실패 문구·진행·대체텍스트/장식·제거·잃은 이미지·안내)
- [ ] R3 EditFields·StudioLayout 연결(캔버스 images) TDD + 중간 build
- [ ] R4 typecheck·lint·전체 vitest·build
- [ ] R5 Ego Lite 4폭 확인·캡처 + 창·탭 닫힘 재확인 · 서버 종료·lsof 0
- [ ] R6 Codex review --scope branch --base d25fe49 (≤2) · REPORT 전체 갱신
- R1 예측: 새 테스트 9개 → 실제 8개(예측 때 셈 잘못 — 테스트 삭제 0) · RED `logs/red-r1.txt` · GREEN 8/8
- R2 예측: 새 테스트 10개 → RED 10/10 실패(`logs/red-r2.txt` — 껍데기 패널) → GREEN 10/10. 테스트 하네스만 고침(동적 import 대기 `settle` · 모의 대상 = ingest 안쪽 모듈) — 단언 변경 0
- R3 예측: 새 테스트 3개(StudioLayoutImages.test.tsx) — 연결은 try1에서 이미 들어와 GREEN 예상 → Red-Green은 연결 줄 되돌려 확인
