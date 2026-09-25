# QA 핸드오프 — QA-1A-02: 1a-02 레퍼런스 상세 + 색상·디바이스 필터 + 폰트 수정 검증

- 작성: Jarvis · 2026-09-25 KST
- 책임 역할: QA / 실행 환경: Orca + Claude Code (`--role qa`) · 작업 공간 `qa-1a-02`(`main` @ `0ef57de`)
- 성격: 독립 검증. **제품 코드(`app/src`, `design/`) 수정 금지.** 결함은 재현 절차와 함께 보고만.
- 턴 예산 **50** · 체크포인트 `docs/qa/1a-02/PROGRESS.md`
- **40턴을 넘기면 새 측정을 멈추고 반드시 `REPORT.md`를 쓰고 커밋한다.** (이전 QA가 보고서 없이 끝난 적이 있다)
- 병렬 상황: Developer가 `m1-ui-01-fix`에서 1a-01 결함·접근성·번들 분할·상세 스크롤을 수정 중이다. **이번 QA는 `0ef57de` 기준이며, 그 수정 대상(아래 0절)은 결함으로 중복 보고하지 말고 "수정 진행 중"으로 표시만 한다.**

## 0. 이미 알려진 항목 (중복 보고 금지, "수정 진행 중"으로 표시)
- 1a-01 결함 D04~D08, 접근성 A01(세그먼트 방향키)·A02(탭 Tab 정지점)·A03(바로가기 링크)
- 초기 JS gzip 113.9KB(예산 90KB 초과)
- 상세 이동 시 스크롤 위치 제어가 명시적이지 않음

## 1. 입력
1. 목업 `design/claude-design-handoff/project/Design Studio Mockups.dc.html` **126~183행**(`data-screen-label="1a-02 레퍼런스 상세"`), 데이터 612~691행(`refSections`·`mobileFlow`·`similarGroups`·`palette`·`detailTabs`)
2. 구현: `app/` `/references/:id`, 카탈로그 색상·디바이스 필터
3. 의도된 차이: `dev/active/m1-ui-02/REPORT.md` "목업과 다른 부분" 13항 + ADR-002
4. 기준: `docs/06-handoff/M1-UI-02_DEVELOPER_BRIEF.md` 작업 1~3 수용 기준, PRD FR-CAT-01·03
5. 형식 참고: `docs/qa/1a-01/REPORT.md`(같은 형식으로 작성)

## 2. 실행
- 앱: `cd app && npm ci && npm run build && npx vite preview --host 127.0.0.1 --port 4327 --strictPort`
- 목업: `design/claude-design-handoff/project/`를 `python3 -m http.server 4328 --bind 127.0.0.1`로 열고 `#1a` 두 번째 카드(1280) 비교
- 127.0.0.1에만 바인딩, 끝나면 반드시 종료하고 `lsof -iTCP:4327 -iTCP:4328 -sTCP:LISTEN` 결과 기록
- `app/package.json`에 의존성 추가 금지

## 3. 검증 항목
### A. 시각 충실도 — 상세 1280 × 800 (ref A '모던 카페 브랜드' 기준, 목업과 같은 상태)
브레드크럼, 제목·라이선스 Tag·메타 줄·태그, 자체 렌더 미리보기(안내 문구), Tabs, 섹션 구성 목록, 토큰 요약, 모바일 구조, 점수 카드(접근성·성능·측정일), 액션 버튼, 유사 레퍼런스 3그룹. 차이를 `의도됨 / 결함 / 판단 필요`로 분류, 결함은 P1~P3.

### B. 반응형 — 상세 768 × 1024, 390 × 844
가로 스크롤 없음, 겹침·잘림 없음, 1열 스택

### C. 기능
1. 카탈로그 카드 → 상세 이동, 브레드크럼 → 카탈로그 복귀
2. 탭 4개 전환과 `?tab=` 유지·새로고침 복원
3. 유사 레퍼런스: 3그룹, 그룹당 ≤ 6, 자기 자신 없음, 클릭 시 해당 상세로 이동하고 **이전 레퍼런스 내용이 남지 않음**
4. 상세에서 저장·비교 추가 → 카탈로그로 돌아갔을 때 상태 공유, 6개 제한 안내
5. 없는 id(`/references/does-not-exist`) → 404 안내 화면
6. **색상·디바이스 필터**: 선택 시 결과 변화, URL(`color`, `device`) 반영, 새로고침 복원, 다른 필터와 조합
7. **폰트**: 네트워크에서 폰트 요청 4xx 0건, 자체 호스팅 woff2 로드 확인(가능하면 `document.fonts` 상태), 외부 폰트 도메인 요청 0건
8. 콘솔 오류 0
9. 키보드: 상세 화면의 탭·액션·유사 링크 조작 가능 (0절 A01·A02는 제외)

### D. 자동 검증 재실행
`npm run typecheck`, `npm run lint`, `npm test -- --run`, `npm run build` 결과를 `docs/qa/1a-02/logs/`에 기록 (`*.log`는 무시 규칙이 있으니 `git add -f`)

## 4. 산출물 (이 경로에만)
- `docs/qa/1a-02/REPORT.md` — 첫 줄에 판정(PASS / PASS with issues / FAIL), 결함 표(ID·심각도·재현·기대/실제·캡처), 의도된 차이 대조표, 반응형·기능·자동 검증 결과, 서버 종료 확인, 커밋 해시
- `docs/qa/1a-02/screens/` — `mockup-detail-1280.png`, `app-detail-1280.png`, `app-detail-768.png`, `app-detail-390.png`, 결함 캡처
- `docs/qa/1a-02/`만 로컬 커밋, push 금지

## 5. 판정 기준
QA-1A-01과 동일: PASS(P1·P2 0, 기능 전부 통과) / PASS with issues(P1 0, P2 ≤ 3) / FAIL(그 외)

## 6. 마지막 응답
REPORT.md 요약(판정·결함 수·커밋 해시·서버 종료 확인)
