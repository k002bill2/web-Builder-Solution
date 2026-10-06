# M3P-0 Designer 브리프 — M3′ internal 조합 생성기 + 카탈로그 실렌더 썸네일 명세·계획

- 역할 Designer / Orca managed Claude Code / worktree m3p-spec / base `f21ce19`(origin 반영). 코드 0. `app/node_modules` lock 그대로 `npm ci` 완료(화면 확인용).
- 영환님 ★A(2026-10-06): 다음 마일스톤 = M3′. 근거 `docs/04-plan/DEVELOPMENT_PLAN.md` 35행("internal 레퍼런스 대량 조립 + 실렌더 썸네일 — M2b 이후", R2 C-5 결정 2), `docs/04-plan/M2B_PLAN.md` 10·12·42·46행, PRD FR-CAT-02(카드 썸네일).

## 경계 (영환님 원문 — 위반 금지)
- **"GDWEB은 읽기 전용 관찰만(로그인·스크랩·심사등록·대량 크롤링 금지)"**, dbcut 동일. 외부 사이트 수집·크롤링 0, 외부 이미지 0.
- 생성 입력에는 **추상 태그만**(레퍼런스 원본 화면·문구·이미지 사용 0). internal 조합 = 이미 저장소에 있는 추상화된 레퍼런스 데이터(`fixtures/referenceComparisons.ts` 등)와 섹션 변형·프로필 축의 조합.
- **"목업 이미지에 모든걸 맞추지 말고 기능과 솔루션을 충분히 고려하고 디자인을 맞추는 방식으로"** · **"목업브랜드는 디자인만 채용하고 제품브랜드는 새로운 브랜드"**(APFS 로고·`--apfs-*` 0).

## 1단계 — 지금 사실 확인 (L1, grep·경로·화면)
- 카탈로그·레퍼런스 데이터 구조(레퍼런스 수, 태그 축, 카드 필드 — FR-CAT-02 대비 누락), 현재 썸네일 표시 방식(정적 그림?), 3안 생성 엔진(`profileEngine`·generate) 재사용 가능성, 렌더 문서(sandbox iframe `allow-scripts`) 재사용 가능성, PNG 캡처 경로(`pngCapture.ts`) 재사용 가능성.
- 번들 현황: `/catalog` 첫 화면 99.65/100 · 진입 102.04/125, `/references/:id` 97.00/99.38, 렌더 JS 84.19/90 (ADR-004). 썸네일을 어떻게 배치해야 첫 화면 100을 넘지 않는지.
- 필요 시 **Ego Lite**: `npm run build` + `npx vite preview --host 127.0.0.1 --port 4337 --strictPort`(dev 금지), 창 minimized면 `Browser.setWindowBounds {windowState:"normal"}`, 캡처 `page.cdp("Page.captureScreenshot",{format:"png",captureBeyondViewport:false,clip:뷰포트})`(fullPage 금지), 앱 안 클릭만. 끝나면 이 레인 창·탭 `finish({keep:[]})` · `listTaskSpaces()`=[] 재확인, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.

## 2단계 — 산출 (쓰기: `docs/design/m3p/`, `docs/04-plan/M3P_PLAN.md`, `dev/active/m3p-spec/`만)
1. `docs/design/m3p/SPEC.md`: 사용자 목표(벤치마크 → 비교 → 선택 → 생성 흐름에서 조합 생성기가 하는 일), 조합 규칙(입력 축·조합 수 상한·결정성·중복 제거·게이트 통과 조건), 썸네일 생성 방식 후보(빌드 시 정적 PNG 사전 생성 vs 런타임 실렌더 캡처 vs 경량 SVG 와이어 — 각 번들·성능·저장소 용량·결정성 트레이드오프, 추천), 카탈로그 UI 변화(카드·필터·"생성된 조합" 구분 표기), 상태 설계(로딩·실패·빈 상태), 접근성, 수용 기준(M3P-AC [U]/[G]/[B])·QB·깨질 테스트 예상·예산 배치.
2. `docs/04-plan/M3P_PLAN.md`: Developer/QA 레인 분할(각 50~70턴 안, 쓰기 경로 겹침표, 병렬 가능 여부), 레인별 시간 추정(추정 표기), QA 게이트(build+preview, Ego Lite 캡처 방식 명시, QA는 문서 1개 재사용·항목당 15턴+ — B-QA-01).
3. `docs/design/m3p/MQ.md`: 영환님 결정 필요 항목만(번호 선택지 ★추천·트레이드오프·사실/추정). **예산 상향·엔진/PageDoc 계약 변경·새 의존성·저장소 용량이 큰 바이너리 커밋(예: 사전 생성 PNG 수 MB)·외부 데이터는 반드시 MQ로.**
4. `dev/active/m3p-spec/{PROGRESS,REPORT}.md`.

## 금지·운영
- 코드·package*.json/lock·CLAUDE.md·`docs/decisions/`·BACKLOG 수정 0. 외부 크롤링·GDWEB/dbcut 접속 0.
- 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지. Codex review/adversarial 1~2라운드 실제 완료만 기록.
- **첫 3턴 안에 BRIEF P0 커밋.** **턴 관리:** 45턴부터 새 조사 중단·산출물 마감 우선, REPORT는 마지막 5턴 전 커밋·PROGRESS 일치. 한국어.
