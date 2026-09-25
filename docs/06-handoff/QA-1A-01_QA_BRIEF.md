# QA 핸드오프 — QA-1A-01: 1a-01 카탈로그 시각 충실도·기능 검증

- 작성: Jarvis · 2026-09-25 KST
- 책임 역할: QA / 실행 환경: Orca + Claude Code (`hermes-claude-orca --role qa`)
- 대상: 저장소 `web-builder-solution` `main` @ `1c90ae9` (Orca worktree `qa-1a-01`)
- 성격: **독립 검증. 제품 코드(`app/src`, `design/`)를 수정하지 않는다.** 결함은 재현 절차와 함께 보고만 한다.
- 턴 예산: 60 · 체크포인트: `docs/qa/1a-01/PROGRESS.md`

## 1. 입력
1. 원본 목업: `design/claude-design-handoff/project/Design Studio Mockups.dc.html` — 1a-01은 **55~125행**(`data-screen-label="1a-01 카탈로그"`), 목업 데이터는 612~691행 `renderVals()`
2. 구현: `app/` (1a-01 카탈로그, `/catalog`)
3. 의도된 차이 목록: `dev/active/m1-ui-01/PROGRESS.md`의 "목업과 다르게 구현한 부분"(18개)
4. 기준: `docs/decisions/ADR-002-brand-separation.md`(APFS 로고·명칭 제거는 의도된 차이), `docs/06-handoff/M1-UI-01_DEVELOPER_BRIEF.md` 2절 수용 기준

## 2. 실행 방법
- 구현 앱: `cd app && npm ci && npm run build && npx vite preview --host 127.0.0.1 --port 4317 --strictPort`
- 목업: `design/claude-design-handoff/project/`를 정적 서버로 띄워 연다(예: `python3 -m http.server 4318 --bind 127.0.0.1`). 목업은 캔버스 문서이므로 `#1a` 옵션의 첫 카드(1280 폭)만 비교한다.
- 서버는 **127.0.0.1에만** 바인딩하고, 검증이 끝나면 반드시 종료한다.
- 스크린샷 도구는 사용 가능한 브라우저 자동화(Playwright 캐시 chromium, ego-browser 등)를 쓴다. `app/package.json`에 의존성을 추가하지 않는다. 필요하면 저장소 밖 임시 폴더에 설치한다.

## 3. 검증 항목
### A. 시각 충실도 (1280 × 800 기준, 같은 상태로 맞춰 비교)
- 비교 상태: 가능한 한 목업과 같은 상태로 맞춘다(예: 업종 카페·F&B 등 목업에 체크된 필터, 트레이 A·B·C). URL 쿼리로 재현 가능한 범위까지 맞추고, 못 맞추면 이유를 적는다.
- 항목: GNB 높이·구성, 필터 레일 폭·그룹 간격, 카드 그리드 열 수·간격, 카드 내부(썸네일 비율, 제목·메타 타이포, 태그·팔레트 칩, 점수·배지), 하단 비교 트레이, 색·모서리·그림자·폰트(Pretendard 적용 여부)
- 각 차이를 분류: `의도됨`(PROGRESS.md·ADR-002에 근거 있음) / `결함`(근거 없음) / `판단 필요`
- 결함은 심각도 표기: P1(구조·정보 누락) / P2(간격·색·타이포 눈에 띄는 차이) / P3(미세)

### B. 반응형
- 390 × 844: 가로 스크롤 없음(`scrollWidth <= innerWidth`), 요소 겹침·잘림 없음
- 768 × 1024: 동일 기준

### C. 기능 (수용 기준 재현)
1. 필터 클릭 → 카드 수 변화 + URL 쿼리 반영 → 새로고침 후 필터 복원 (FR-CAT-01)
2. 카드 필드 전부 표시 (FR-CAT-02)
3. `internal`·`licensed`만 노출 (FR-CAT-04) — 픽스처 기준 확인
4. 비교 추가/해제가 트레이에 반영, 7번째 추가 거부와 안내 (FR-CMP-02) — 픽스처가 6개면 거부는 단위 테스트 결과로 확인하고 그렇게 적는다
5. 키보드만으로 필터·카드 버튼·트레이 조작 가능, 포커스 링 보임
6. 브라우저 콘솔 오류 0

### D. 자동 검증 재실행
`npm run typecheck`, `npm run lint`, `npm test -- --run`, `npm run build` 결과 기록

## 4. 산출물 (이 경로에만 쓰기)
- `docs/qa/1a-01/REPORT.md` — 판정(PASS / PASS with issues / FAIL), 항목별 결과, 결함 목록(ID·심각도·재현 절차·기대/실제·스크린샷 경로), 의도된 차이 대조표
- `docs/qa/1a-01/screens/` — `mockup-1280.png`, `app-1280.png`, `app-768.png`, `app-390.png` 및 결함별 확대 캡처
- 작업이 끝나면 `docs/qa/1a-01/`만 로컬 커밋한다(브랜치 `qa-1a-01`). push·원격 작업 금지.

## 5. 판정 기준
- PASS: 결함 P1 0건, P2 0건, 기능 C 전부 통과, 반응형 통과
- PASS with issues: P1 0건, P2 3건 이하
- FAIL: 그 외

## 6. 보고 형식
결론(판정) → 결함 목록(심각도순) → 의도된 차이 확인 결과 → 반응형·기능·자동 검증 결과 → 서버 종료 확인 → 커밋 해시
