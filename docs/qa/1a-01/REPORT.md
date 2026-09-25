**판정: PASS with issues** — P1 0건 · P2 1건(D-FONT) · P3 5건. 기능 C1~C5 통과, C6(콘솔 오류 0) 불통과(폰트 404 8건). 반응형 통과.

# QA-1A-01 보고서 — 1a-01 카탈로그 시각 충실도·기능 검증

- 브리프: `docs/06-handoff/QA-1A-01_QA_BRIEF.md` + 이어하기 `docs/06-handoff/QA-1A-01_RESUME_BRIEF.md`
- 대상: `app/` 1a-01 `/catalog`. 브리프 기준 `main @ 1c90ae9`, 실제 HEAD `a6ec2bf`·`ca11794`(문서 커밋만) — `app`·`design` 차이 없음
- 실행: 2026-09-25 KST, macOS, ego-browser(Ego Lite), `vite preview` 127.0.0.1:4317, 목업 정적 서버 127.0.0.1:4318
- 체크포인트: `docs/qa/1a-01/PROGRESS.md`
- 결함 수 요약: P1 0 / P2 1 / P3 5 (합계 6). 사용자 보류 결정이 있는 접근성 항목은 결함 수에서 제외하고 5절에 따로 적었다.

## 1. 결함 목록 (심각도순)

ID 안내: D01~D03은 이전 실행이 기록 없이 종료돼 번호만 비어 있다. 캡처가 남은 D04~D06과 이번 세션 발견분(D07·D08), 폰트(D-FONT)만 보고한다.

| ID | 심각도 | 요약 | 재현 절차 | 기대 | 실제 | 캡처·증거 |
|---|---|---|---|---|---|---|
| D-FONT | P2 | Pretendard 웹폰트 8개 URL 전부 404 | 1) `/catalog` 연다 2) DevTools 콘솔·네트워크 확인 (또는 `curl -I`로 `fonts.css`의 URL 요청) | Pretendard가 CDN에서 로드되고 콘솔 오류 0 | `cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/...` 8개 전부 404 → 콘솔 오류 8건. 로컬에 Pretendard가 설치된 PC(이 PC)만 정상 렌더, 그 외 환경은 폴백 글꼴. 같은 CDN의 `npm/pretendard@1.3.9` 경로는 200 | `logs/font-urls.log`. 수정은 Developer 트랙 M1-UI-02에서 진행 중 — QA는 기록만 |
| D04 | P3 | 필터 레일 체크박스 행 간격·그룹 간격이 목업보다 약간 넓음 | 1280×800, 목업 `#1a` 첫 카드와 `/catalog` 필터 레일을 나란히 비교 | 목업 행 간격 약 30px | 앱 약 32px, 그룹 간격도 몇 px 넓어 레일 전체가 길어짐. 세그먼트 컨트롤은 '전체' 추가로 4칸(의도됨 8) | `screens/defect-D04-rail-checkbox-segment.png` (캡처 기준 추정, L2) |
| D05 | P3 | 결과 탭(전체·추천·저장함) 높이·밑줄 위치가 목업과 미세하게 다름 | 1280×800 탭 영역 비교 | 목업과 같은 라벨 기준선·밑줄 위치 | 라벨·밑줄이 1~2px 아래. 카운트 값 차이는 의도됨 9 | `screens/defect-D05-tabs-height.png` |
| D06 | P3 | 390 폭에서 히어로 제목이 단어 중간에서 줄바꿈 | 390×844로 `/catalog` 연다 | 한국어 어절 단위 줄바꿈(`word-break: keep-all`) | "근거 / 와"처럼 어절이 쪼개짐 | `screens/defect-D06-390-heading-wrap.png` |
| D07 | P3 | 트레이 칩의 X(제거)를 키보드로 누르면 포커스가 사라짐 | 1) 카드의 '비교 추가'를 Tab·Enter로 누른다 2) Tab으로 트레이 '… 비교에서 제거'까지 이동 3) Enter | 포커스가 인접 칩이나 트레이 영역에 남음 (WCAG 2.4.3) | 제거 뒤 `document.activeElement`가 body — 키보드 사용자가 위치를 잃음 | `screens/c5-keyboard-tray-remove-focus.png` (제거 직전 포커스) |
| D08 | P3 | 카드 이름 링크의 키보드 포커스 표시가 밑줄뿐 | Tab으로 카드 이름 링크(예: '동네 치과 클리닉')에 이동 | 다른 컨트롤과 같은 포커스 링 | 밑줄만 생기고 링 없음(`:focus-visible` 참, outline·box-shadow 없음). 2.4.7은 충족하나 다른 정지점과 불일치 | `screens/focus-card-link.png` |

## 2. 의도된 차이 대조 (`dev/active/m1-ui-01/PROGRESS.md` "목업과 다른 부분" 18항 + ADR-002)

| # | 차이 | 분류 | 근거·비고 |
|---|---|---|---|
| 1 | APFS 워드마크 → 중립 사각 마크 + "Design Studio" | 의도됨 | ADR-002 결정 2·4. 화면에서 확인(`app-1280.png` 좌상단) |
| 2 | `--brand-inverse*` → `--surface-inverse*` | 의도됨 | ADR-002 브랜드 격리. 시각 차이 없음 |
| 3 | SegmentedControl `tablist` → `radiogroup` | 의도됨 | 필터 용도. 단, 방향키 미지원은 5절 보류 항목 |
| 4 | Avatar sm 글자 12.8→12px | 의도됨 | 토큰 반올림, 육안 차이 없음 |
| 5 | 카드 저장 아이콘이 토글 버튼 | 의도됨 | 목업 캡처에는 아이콘이 보이지 않음(목업 아이콘 폰트 미로드 추정). 앱은 `aria-pressed` 버튼 |
| 6 | 썸네일·카드 흰색 → 토큰 | 의도됨 | 하드코딩 금지 규칙 |
| 7 | 초기 필터 없음(6개) | 의도됨 | 목업 상태를 URL로 재현하면 1개(`app-1280.png`) |
| 8 | 모션 강도 '전체' 추가 | 의도됨 | D04 캡처의 4칸 세그먼트 |
| 9 | 탭 카운트 실제값, 추천 탭 카운트 없음 | 의도됨 | D05 카운트 차이는 이 항목 |
| 10 | 검색 입력은 표시만 | 의도됨 | 브리프 동작 목록 밖 |
| 11 | 트레이 빈 상태 시작 + 안내 문구 | 의도됨 | `focus-card-link.png` 하단 트레이 안내 |
| 12 | 정렬 Select 40px, 업종 칩 36px | 의도됨 | 번들 규격 우선 |
| 13 | 390 대응(GNB 메뉴 숨김·레일 위로·1열·트레이 축약) | 의도됨 | `app-390*.png` |
| 14 | 카드 순서 C·E·A·F·B·D | 의도됨 | 점수순 기본 정렬, 브라우저에서 같은 순서 확인 |
| 15 | GNB·카드 링크 대상 해석 | 의도됨 | 카드 링크 `/references/ref-*` 확인 |
| 16 | 트레이 `sticky bottom-5` | 의도됨 | 시각 차이 미미 |
| 17 | DS 변형 일부만 구현 | 의도됨 | 1a-01 범위 |
| 18 | 브랜드 교체 범위가 ADR-002 "두 파일"보다 넓음(`BrandMark.tsx`, `index.html`) | 판단 필요 | ADR-002 수용 기준과 불일치. ADR 개정 또는 로고를 config 경유로 옮길지 결정 필요 |
| — | 트레이 칩마다 X(제거) 버튼 | 판단 필요 | 목업 트레이 칩에는 X 없음, 18항에도 없음. 기능상 유용(C4 해제 경로) — 목업 반영 여부 결정 필요 |
| — | Pretendard 원격 로드 | 결함(D-FONT) | 18항 질문 3은 "CDN 유지"였으나 그 URL 자체가 404 |

시각 충실도 측정 요약 (1280×800, 캡처 기준 추정 · L2): GNB 높이 목업 ≈59px / 앱 59px, 필터 레일 폭 ≈228 / 232px, 카드 3열·간격 ≈16px(목업 카드 ≈303px / 앱 305.7px), 모서리 16px, 트레이 어두운 표면 + primary 버튼 일치. 구조·정보 누락 없음. 목업 상태 재현은 URL 쿼리로 필터까지만 가능(트레이 A·B·C는 세션 상태라 클릭으로 담음).

## 3. 반응형·기능·자동 검증

### B. 반응형 — 통과
| 폭 | 가로 스크롤 | 겹침·잘림 | 캡처 |
|---|---|---|---|
| 390×844 | 없음(`scrollWidth ≤ innerWidth`) | 없음. 제목 줄바꿈 D06(P3) | `app-390.png`, `app-390-viewport.png`, `app-390-tray6.png` |
| 768×1024 | 없음 | 없음 | `app-768.png`, `app-768-viewport.png`, `app-768-tray6.png` |

### C. 기능
| 항목 | 결과 | 증거 |
|---|---|---|
| C1 필터 → 카드 수·URL → 새로고침 복원 (FR-CAT-01) | 통과 | 이전 세션 측정(PROGRESS 5단계). 이번 세션 키보드 재확인: 체크박스 → `?audience=age-20-30` 카드 6→4, 모션 높음 → `&motion=high` 카드 1 |
| C2 카드 필드 전부 (FR-CAT-02) | 통과 | 6장 모두 배지·썸네일·이름 링크·업종·레이아웃·태그 2·팔레트 3·접근성·성능·모션·비교 버튼·측정일·반응형 + 저장 버튼 |
| C3 internal·licensed만 노출 (FR-CAT-04) | 통과 | 픽스처 6개 = internal 4 + licensed 2, 화면 배지 동일. external_observed 제외는 단위 테스트 `referenceRepository.test.ts` |
| C4 비교 추가/해제·7번째 거부 (FR-CMP-02) | 통과 | 브라우저: 6개 추가 → `비교 보드 6 / 6`, 트레이 X → 5/6, 카드 '비교 중' → 4/6(`screens/c4-tray-after-remove.png`). **7번째 거부는 픽스처가 6개라 단위 테스트로 대체**: `compareTray.test.ts` "6개가 찬 상태에서 7번째 추가는 거부한다", `CatalogPage.test.tsx` "7번째 비교 추가는 막고 안내한다" 통과 |
| C5 키보드 조작·포커스 링 | 통과 (P3 결함 2건) | Tab만으로 필터·세그먼트·탭·정렬·카드 저장/비교·트레이 제거·비교 보드 열기(→ `/compare`) 조작. 모든 정지점 `:focus-visible` 참. D07·D08. 캡처 `focus-*.png`, `c5-keyboard-tray-remove-focus.png` |
| C6 콘솔 오류 0 | **불통과** | 콘솔 오류 8건 = 전부 Pretendard 404(D-FONT). 그 외 오류 없음 |

### D. 자동 검증 — 4종 exit 0 (`logs/`)
| 명령 | 결과 |
|---|---|
| `npm run typecheck` | exit 0 (`logs/typecheck.log`) |
| `npm run lint` | exit 0 (`logs/lint.log`) |
| `npm test -- --run` | 8 files · 58 tests passed (`logs/test.log`, `logs/test-verbose.log`) |
| `npm run build` | exit 0 (`logs/build.log`) |

## 4. 서버 종료 확인
`lsof -iTCP:4317 -iTCP:4318 -sTCP:LISTEN` → 출력 없음, exit 1 (2026-09-25 19:21:04 KST). ego-browser TaskSpace 68은 `finish({ keep: [] })`로 닫음.

## 5. 주의·가정
- 사용자 보류 결정(전체 화면 구현 후 처리)이 있는 키보드 접근성 항목은 결함 수에 넣지 않았다: 모션 세그먼트 라디오가 4개 전부 Tab 정지점이고 방향키 무반응(실측: ArrowLeft 무변화), 결과 탭도 3개 전부 Tab 정지점, skip link 없음(페이지 처음부터 첫 카드 링크까지 Tab 약 40회). 재평가가 필요하면 P3 수준이다.
- 시각 수치는 캡처 픽셀에서 읽은 추정(L2, 불확실성 Medium). D04·D05는 1~2px 단위라 P3로 두었다.
- 검색 입력 포커스는 래퍼 테두리가 primary로 바뀌고 링이 생기는 것을 스타일 값으로 확인했다. 기존 `focus-search.png`는 전환 중 캡처라 링이 보이지 않을 뿐 결함이 아니다.
- 이번 세션은 이전 실행의 `dist/`를 재사용했다(`app/`·`design/` 무변경).

## 6. 커밋
`docs/qa/1a-01/`만 로컬 커밋, push 없음.
- `bb43a22` — REPORT.md·PROGRESS.md·screens/ 27장
- `e259f1c` — logs/ 6개. 저장소 `.gitignore`의 `*.log` 규칙에 걸려 `git add -f`로 추가
- 이 해시 기록 커밋은 그 뒤의 HEAD(파일이 자기 커밋 해시를 담을 수 없음)
- `git diff --stat 1c90ae9 HEAD -- app design` → 비어 있음(검증 대상 코드 동일)
