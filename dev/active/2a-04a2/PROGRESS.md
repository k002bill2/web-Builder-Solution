# 2A-04a2 PROGRESS — 프로필 화면(`/profile`·`/profile/:id`) + 앱 배선

- 브리프 `docs/06-handoff/2A-04a2_DEVELOPER_BRIEF.md` · 설계 `docs/design/2a-04/SPEC.md` r4 · 브랜치 `k002bill2/2a-04a2` · 분기점 `5ef338f` · 로컬 커밋만

## 기준선 (`5ef338f`, fresh)
- test 49 files · **545 passed** (`logs/baseline-test.txt`)
- 번들(gzip KB, 첫 화면 / 진입 직후, `logs/baseline-build.txt`): 공통 88.69 · `/catalog` 98.53 / 100.92 · 상세 95.86 / 98.25 · `/compare` 98.53 / 121.74 · 자리표시 89.15 / 91.54

## 진행
1. [x] A-Q1·A-Q3 TDD — RED 2 failed (`logs/red-1-aq1-aq3.txt`) → 구현 후 a1 테스트 7건이 최신 버전 revertTo 셋업 때문에 깨짐(`logs/green-1-broken-by-aq3.txt`) → `insertOtherVersion` 헬퍼로 셋업 교체 → 547 passed (`logs/green-1-aq1-aq3.txt`) · 커밋 `ac5d4fa`
2. [x] 앱 배선 — RED(모듈 없음, `logs/red-2-wiring.txt`) → GREEN 553 passed (`logs/green-2-wiring.txt`). **첫 실측**(`logs/probe1-wiring-build.txt`): 공통 88.80(+0.11) · `/catalog`·`/compare` 첫 화면 98.63(여유 1.37 ≥ 0.3 → 대안 불필요) · `/compare` 진입 직후 122.25 · 커밋 `ed23f67`
3. [x] 화면 — RED ③ 순수 함수(모듈 없음) · RED ④ 화면 17 failed(`logs/red-4-page.txt`) → GREEN 587 · 번들 `/profile` 98.61/117.25, `/compare` 99.17/123.33(P-B7 `Callout` 분할) · 커밋 `a82d7d9`
4. [x] 검증 4종 fresh(`logs/verify-*.txt`) · 스모크(캡처 이미지 불가, DOM·폭 측정 `logs/smoke-browser.txt`, 서버 종료·lsof 없음) · Codex 1회 지적 0 · REPORT

## 목업 차이 (SPEC 11절, ADR-003)
- M-01 h1 "디자인 프로필" + h2(프로필 값 · 역할 팔레트와 대비 · 버전) — 전역 조정·3안 h2는 2a-04b·c
- M-04 현재 버전 = Tag 글자 "현재"(점 색 아님) · 이전 버전 보기 "보는 중"
- M-05 시각·레이아웃 방향 = 비대화형 Tag
- M-06 구성 요소 = 라벨 + 라이브러리 이름표, 변형 키는 캡션
- M-07 대비 안내 = 역할·수치·대체안·전후 견본·충돌 판정 ("보정값 쓰기"는 2a-04b)
- M-12 "프로필로 돌아가기" 없음, "비교 보드에서 선택 바꾸기" 링크
- M-14 상태 P-S01~S09·S12(되돌리기)·S16 정의대로
- M-16 5폭 — 지금은 1단(2단은 3안이 생기는 2a-04c), 1280·768·390 가로 넘침 0
