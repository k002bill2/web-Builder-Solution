# Developer 핸드오프 — M1-UI-02: 폰트 자체 호스팅 + 색상·디바이스 필터 + 1a-02 레퍼런스 상세

- 작성: Jarvis · 2026-09-25 KST
- 책임 역할: Developer / 실행 환경: Orca + Claude Code (`--role developer`) · 작업 공간 `m1-ui-02`(`main`에서 분기)
- Designer 생략 사유: 1a-02는 확정 목업 변환. 색상·디바이스 필터는 기존 필터 레일 그룹 패턴을 그대로 재사용(새 컴포넌트·새 레이아웃 없음). 구현 후 QA 시각 검증 1회.
- 턴 예산 120 · 체크포인트 `dev/active/m1-ui-02/PROGRESS.md` · **작업 3개를 아래 순서대로, 작업마다 로컬 커밋**(중간에 끊겨도 앞 작업은 쓸 수 있게)
- 병렬 상황: QA가 `qa-1a-01`에서 1a-01을 검증 중이다. QA 결함 수정은 별도 handoff로 하니 **이번 범위 밖의 1a-01 스타일을 임의로 고치지 않는다.**

## 0. 먼저 읽을 것
1. `CLAUDE.md`, `docs/decisions/ADR-001-standalone-repo-1a.md`, `docs/decisions/ADR-002-brand-separation.md`
2. `dev/active/m1-ui-01/PROGRESS.md` — 1a-01 구조·결정·의도된 차이 18항
3. 목업 `design/claude-design-handoff/project/Design Studio Mockups.dc.html`: **126~183행**(1a-02 상세) + 612~691행(`renderVals()`: `refSections`, `mobileFlow`, `similarGroups`, `detailTabs`, `palette`)
4. `docs/02-prd/PRD.md` FR-CAT-01·03, `docs/05-tdd/TDD.md` 3.1절

## 작업 1 — 폰트 404 수정 (자체 호스팅)
- 사실: `app/src/styles/tokens/fonts.css`의 jsDelivr `gh/orioncactus/pretendard(-jp)@v1.3.9/...` 8개 URL이 전부 404(Jarvis·QA 재현). 이 PC는 로컬 설치 폰트로 렌더돼 가려졌다.
- 할 일: Pretendard를 **자체 호스팅**한다. npm 패키지(OFL)에서 woff2를 가져와 앱 번들에 포함하고 `@font-face`를 로컬 경로로 바꾼다. Pretendard JP를 동일하게 확보할 수 없으면 `Pretendard`만 쓰고 폴백 체인은 유지, 결정을 PROGRESS.md에 기록.
- 웨이트 400·500·600·700만. 서브셋/가변 폰트 사용 여부는 번들 크기 근거로 선택.
- `LICENSES.md`(저장소 루트)에 폰트 라이선스(OFL-1.1) 기재.
- **테스트 먼저**: `fonts.test.ts` — `fonts.css`에 `http://`·`https://` 0건, 4개 웨이트 `@font-face` 존재, 참조한 파일이 실제로 존재.
- 수용: `npm run build` 산출물에 woff2 포함, 브라우저 네트워크에서 폰트 요청 404 0건(가능하면 ego-browser로 확인), 콘솔 오류 0.

## 작업 2 — 색상·디바이스 필터 (FR-CAT-01 보완)
- 목업 필터 레일에 없는 두 그룹을 **기존 그룹과 같은 컴포넌트·간격**으로 추가(레일 맨 아래, 모션 강도 다음).
- 색상: 대표색 계열 필터. 계열은 `대표색(c1)`의 HSL에서 결정적으로 계산(예: 무채색/따뜻한 계열/차가운 계열/그린 계열 — 경계값은 코드 상수와 테스트로 고정). 칩에 작은 색 견본 표시 가능(토큰만 사용).
- 디바이스: `DesignReference`에 `devices: ('desktop'|'mobile'|'responsive')[]` 추가, 픽스처 6개에 값 부여(임시값임을 주석으로).
- URL 쿼리 동기화·새로고침 복원은 기존 필터와 동일하게.
- **테스트 먼저**: 색 계열 분류 단위 테스트(경계값 포함), 저장소 필터 테스트, CatalogPage에서 URL 반영·복원.

## 작업 3 — 1a-02 레퍼런스 상세 (`/references/:id`, FR-CAT-03)
- 목업 126~183행을 1280 기준으로 옮긴다: 브레드크럼(카탈로그 ›), 제목·라이선스 Tag·메타 줄·태그, 자체 렌더 미리보기 영역(“외부 캡처를 사용하지 않습니다” 안내 포함), Tabs(섹션 구성·토큰·모바일·점수 이력), 섹션 구성 목록, 토큰 요약(팔레트·폰트·간격/모션), 모바일 구조, 점수 카드(접근성·성능·측정일), 액션(템플릿으로 가져오기·저장·비교 추가), 유사 레퍼런스 3그룹.
- 데이터: `renderVals()`의 `refSections`·`mobileFlow`·`similarGroups`·`palette`를 픽스처로 옮기고 `ReferenceRepository`에 `getById`, `getSimilar(id)`(업종/콘셉트/레이아웃 3그룹, **각 최대 6개, 자기 자신 제외**) 추가.
- 동작: 카탈로그 카드 → 상세 이동, 저장·비교 추가는 1a-01과 같은 Context 공유(트레이 6개 제한 유지), 없는 id는 404 안내 화면, 탭 전환은 URL 해시 또는 쿼리로 유지. “템플릿으로 가져오기”는 다음 단계 안내만.
- 브랜드: 목업 `Logo` 자리는 기존 `BrandMark`. APFS 요소 금지(가드 테스트가 검사).
- 390 폭: 가로 스크롤·겹침 없음(1열 스택).
- **테스트 먼저**: `getSimilar` 규칙(자기 제외·6개 상한·3그룹), 상세 페이지 렌더(필수 영역 전부), 없는 id 처리, 카드→상세 라우팅, 저장/비교 상태 공유.

## 검증 (작업마다 + 마지막에 전체)
```bash
cd app && npm run typecheck && npm run lint && npm test -- --run && npm run build
```
- Codex 리뷰: `--scope branch --base main`, 최대 3라운드(CLAUDE.md 규칙).

## 금지
- `design/` 수정, APFS 브랜드 자산, 외부 사이트 URL·이미지, 범위 밖 1a-01 스타일 수정
- push·원격 작업·`main` 직접 커밋, `--dangerously-skip-permissions`

## 최종 보고 — **파일로도 남길 것**
`dev/active/m1-ui-02/REPORT.md`에 아래를 쓰고 커밋한 뒤 같은 내용을 마지막 응답으로 출력:
결론 → 작업 1·2·3 각각 완료 여부 → 변경 파일 → RED/GREEN 요약 → 검증 4종 결과 → Codex 라운드 결과 → 목업과 다른 부분 → 질문 → 커밋 해시
