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

## AC-B3 — 업종 필터 5종 각각 결과 ≥ 4 → **PASS**
- 방법: 1280, 칩 그룹 `div[aria-label="업종"]`의 버튼을 하나씩 눌러 `main article` 수를 세고 다시 눌러 해제(앱 안 클릭만, URL `?industry=` 갱신 확인). 끝 상태 `/catalog` 21장 복귀.
- 대상 5업종(SPEC 2.1 ★MQ-M3P-2 A):

| 업종 | 결과 | 구성 |
|---|---|---|
| cafe-fnb | 4 | 모던 카페 브랜드 · 로컬 베이커리 · 따뜻한 분할형 · 활기찬 그리드형 |
| beauty | 4 | 프리미엄 헤어살롱 · 세련된 센터형 · 따뜻한 텍스트형 · 밝은 그리드형 |
| medical | 4 | 동네 치과 클리닉 · 신뢰 텍스트형 · 절제 이미지형 · 깔끔한 그리드형 |
| professional | 4 | 부티크 법률사무소 · 격식 이미지형 · 세련된 분할형 · 미니멀 센터형 |
| education | 4 | 친근한 텍스트형 · 활기찬 풀블리드형 · 친근한 분할형 · 활기찬 센터형(전부 생성) |

- 대상 밖(참고): fitness 1 · retail 0 — SPEC 2.3대로(기존 데이터 수정 0). 칩 개수 표시와 실제 결과 수 일치(7/7).
- 증거: 측정 출력은 이 절의 표(L1, Ego Lite evaluate). 캡처 없음(장수 최소).

## AC-B5 — 네트워크: 같은 출처 `thumbs/*.svg`·앱 청크만, 외부 0 → **PASS**
- 방법: `/catalog` 진입·필터 7회 토글 후 `performance.getEntriesByType("resource")` 전체(97건).
- 외부 출처 요청 **0건**. 분류: `/assets/*.js` 등 앱 산출물 22건(JS 청크 + Pretendard woff2 4 + 아이콘 svg 5) · `/assets/index-*.css` 1건 · `/thumbs/{id}.svg?v=76d49eca` 74건(고유 21, 경로 정규식 전부 일치) · 기타 0.
- `generatedReferences-*.js`는 `/catalog`에서 지연 청크로 로드됨(SPEC 6 의도대로).
- 관찰(BACKLOG 후보 아님, 기록만): 필터 토글로 카드가 다시 마운트될 때 썸네일이 다시 요청됨(74건 = 21 고유 × 재마운트, transferSize 모두 > 0, 합 260KB). vite preview의 캐시 헤더 영향일 수 있음 [추정] — 운영 서버 캐시 정책에서 재확인 필요.

## AC-B2 — 768·390 썸네일 잘림 = 위쪽 기준 → **PASS**
- 방법: `setDeviceMetricsOverride` 768·390(높이 900), 앱 안 스크롤로 첫 카드 근처로 이동, 화면 안 img 측정. 캡처는 `clip.y = scrollY`(문서 좌표)로 뷰포트 영역만.
- 증거: `02-catalog-768.png` · `02-catalog-390.png`.

| 폭 | 썸네일 박스 | 비율 | object-fit / position | 보이는 원본 영역(1280×960 중) |
|---|---|---|---|---|
| 768 | 341×255 | 4:3 | cover / 50% 0% | 1280×960 전체(잘림 0) |
| 390 | 343×193 | 16:9 | cover / 50% 0% | 위쪽 1280×720 — 아래 240px만 잘림 |

- 390·768 모두 사이트 header(로고·내비)와 hero 문구·CTA가 보임. 아래쪽(섹션 일부)만 잘림 → 위쪽 기준 확인.
- 관찰(QB-05 연계): 라이선스 Tag(우상단)가 썸네일 header 내비 영역을 덮음(390·768·1280 공통). 카드 크기에서 내비 글자는 원래 판독 불가 수준이라 정보 손실은 작음.
- 기록: 첫 시도 캡처는 `clip.y=0`이라 스크롤 위쪽이 흰 띠로 찍힘 → `clip.y=scrollY`로 재캡처해 덮어씀(앱 결함 아님, 측정 방법 보정).

## AC-B4 — 생성 카드 → 상세 → 비교 추가 → 보드 → 프로필 확정, 끊김 0 → **PASS**
- 경로(모두 앱 안 클릭, 1280): `/catalog` 생성 카드 "뷰티 · 세련된 센터형" 링크 → `/references/gen-beauty-1` → "비교 추가"(버튼이 "비교 중"으로 바뀜) → 트레이 "보드 열기" → `/compare`(1/6, A열 표시) → "이 레퍼런스로 프로필 만들기" → 초안 10항목 채워짐 · "저장됨" → "프로필 확정 (v1)" → `/profile/profile-1`.
- 결과: 프로필 v1 · 현재, 알림 "새 프로젝트 '뷰티 · 세련된 센터형 프로젝트'를 만들었습니다", 대비 통과 4 · 미달 0, "3안 만들기 (v1)" 버튼 보임. 오류·빈 화면·콘솔 노출 오류 0(화면 기준).
- 증거: `04-detail-gen-beauty-1.png`(상세) · `05-compare-board-gen.png`(보드·초안) · `06-profile-confirmed.png`(확정 뒤 프로필).
- 상세 화면 값: 접근성·성능 "미측정"(숫자·"—" 없음), 점수 이력 "측정 기록 없음", buildNote "internal 조합 생성기 internal-compose-1으로 조립", 섹션 구성 7개.
