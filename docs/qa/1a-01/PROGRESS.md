# QA-1A-01 PROGRESS

브리프: `docs/06-handoff/QA-1A-01_QA_BRIEF.md` · 브랜치 `k002bill2/qa-1a-01` (브리프 표기 `qa-1a-01`) · HEAD `a6ec2bf`

| # | 단계 | 상태 |
|---|---|---|
| 0 | 입력 읽기 (브리프·목업 55~125행·612~691행·PROGRESS 18항·ADR-002·개발 브리프 2절) | 완료 |
| 1 | D. 자동 검증 4종 (`logs/`) | 완료 — 4종 exit 0, 58 tests |
| 2 | 서버 기동 (4317 preview, 4318 목업) 127.0.0.1 | 완료 |
| 3 | A. 시각 충실도 캡처·측정 | 완료 — mockup-1280·app-1280(목업 상태)·app-1280-default |
| 4 | B. 반응형 | 완료 — 390·768 가로 스크롤 없음 |
| 5 | C. 기능 | 완료 — C1~C5 측정(이어하기 세션), C6 콘솔 오류 8건(D-FONT) |
| 6 | 서버 종료·REPORT·커밋 | 완료 — 19:21 KST lsof 4317·4318 LISTEN 없음, REPORT.md 작성 |

- 대상 차이: 브리프는 `main @ 1c90ae9`, 실제 HEAD는 `a6ec2bf`(브리프 문서 커밋). `git diff --stat 1c90ae9 a6ec2bf -- app design` 비어 있음 → 검증 대상 코드 동일.
- 발견(중간): Pretendard @font-face 8개 URL 전부 jsDelivr 404 (curl 확인, 번들 원본과 동일 URL). 콘솔 오류 8건 = 전부 이 404. 이 PC는 로컬 설치 Pretendard로 렌더됨.
- ego-browser TaskSpace 67 사용.

## 이어하기 세션 (QA-1A-01-R, 2026-09-25)
- 서버 재기동: 4317 preview만(기존 `dist/` 재사용 — app·design 무변경). 목업 서버는 재기동 안 함(A 캡처 완료).
- ego-browser TaskSpace 67 소멸 → 68 사용, 종료 시 `finish({keep:[]})`.
- C2 카드 필드: 6장 모두 배지·썸네일·이름(링크 /references/:id)·업종·레이아웃·태그 2·팔레트 3·접근성·성능·모션·비교 버튼·측정일·반응형 + 저장 버튼 → 통과
- C3: 픽스처 6개 전부 internal(4)·licensed(2). external_observed 제외는 단위 테스트(`referenceRepository.test.ts`)로 확인 → 통과
- C4: 브라우저에서 6개 추가 → 트레이 6/6, 카드 버튼 전부 '비교 중'. 트레이 X로 해제 → 5/6, 카드 '비교 중' 해제 → 4/6. 7번째 거부는 픽스처 6개라 단위 테스트(`compareTray.test.ts`, `CatalogPage.test.tsx`)로 대체 → 통과
- C5: Tab만으로 필터 체크박스(Space → URL `audience=age-20-30`, 카드 4)·모션 라디오(Enter → `motion=high`, 카드 1)·비교 추가(Enter → 1/6)·트레이 제거(Enter → 0/6)·비교 보드 열기(Enter → /compare) 모두 조작 가능, 모든 정지점 `:focus-visible` → 통과. 결함 D07(트레이 제거 후 포커스 body로 소실)·D08(카드 이름 링크 포커스가 밑줄뿐) 추가
- 검색 입력 포커스: 래퍼 테두리 primary + 링 확인(기존 focus-search.png는 전환 중 캡처) → 결함 아님
