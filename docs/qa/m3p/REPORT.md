# M3P-4 QA REPORT — 조합 생성기 + 카드 실렌더 썸네일

- 레인: m3p-4-qa · base `b756b50` · 날짜 2026-10-06 · 정본 `docs/04-plan/M3P_PLAN.md` 4절, `docs/design/m3p/SPEC.md` 8.1·8.2·11절
- 환경: `npm run build` exit 0(로그 `docs/qa/m3p/build-log.txt`, 썸네일 21장 · 버전 76d49eca · 가드 통과) → `npx vite preview --host 127.0.0.1 --port 4337 --strictPort`. dev 서버 미사용. Ego Lite.
- 코드 수정 0. 결함은 기록만.

## 0. 빌드 출력 요지 (L1)
- 썸네일 SVG 21장, 장당 원본 49.3~52.9KB · gzip 11.2~12.1KB(판정 밖).
- 렌더 문서 JS 84.19KB / 90KB, CSS 8.85KB / 30KB.

## QB-M3P-01 사전 수치 — hero 문구 (같은 출처 fetch, L1)
방법: preview(127.0.0.1:4337)에서 `thumbs/*.svg` 21장을 받아 `<h1>` 텍스트 추출(`/tmp` 스크립트, 저장소 밖).

| 항목 | 값 |
|---|---|
| 21장 중 h1 = "일상에 꼭 맞는 서비스를 만듭니다" | **21 / 21** (고유 h1 1종) |
| 업종별 차이 | 0 — 뷰티 3·카페 2·교육 4·의료 3·전문 3·큐레이션 6 모두 동일 |
| h2 첫 두 개 | "우리를 소개합니다"/"제공하는 서비스"/"최근 작업" 3종 조합뿐 |
| 마크업(스타일 제외) 해시 | 21종 모두 다름 — 구조·변형은 다르고 **문구만 같음** |

판단: Jarvis 관찰 사실로 확인. 썸네일은 `createDocFromCandidate` 기본 슬롯 문구를 그대로 쓰는 것으로 보임 [추정 — 코드 미확인]. 업종을 카드에서 문구로 구분할 수 없음 → BACKLOG 후보 BL-QB01(업종·레퍼런스별 hero 문구 주입).

## AC-B1 — `/catalog` 1280 첫 줄 실렌더 · 레이아웃 이동 0 → **PASS**
- 증거: `01-catalog-1280.png`(1280×900 뷰포트 clip). Ego Lite taskSpace 11, 창 상태 normal(확인), 첫 goto `/catalog` 1회.
- 첫 줄 3장(ref-c·ref-e·ref-a) img `complete`·natural 1280×960, 표시 306×229, `object-fit: cover` / `object-position: 50% 0%`. 화면 안 9장 모두 로드.
- 레이아웃 이동: `performance.getEntriesByType("layout-shift")` = **0건**. 21장 전부 img 숨김 전후 카드 높이 차 **0px**(357px 고정), 아직 lazy 미로드인 아래 3장(natural 0×0)도 357px — 로드 전후 같음.
- img alt 예: "동네 치과 클리닉 첫 화면 실제 렌더 미리보기"(SPEC 7 문구와 일치). 머리 문구 "internal · licensed 레퍼런스 21개".
- 한계: 측정은 첫 goto 직후 뷰포트 오버라이드(1280) 적용 뒤 시점. 첫 페인트 이전 이동은 오버라이드 이전이라 판정에서 제외(오버라이드 이후 엔트리 0, 전체 엔트리도 0).
