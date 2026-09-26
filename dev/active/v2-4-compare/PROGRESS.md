# V2-4 PROGRESS — 비교 보드 `/compare` v2 (2a-03)

- 브리프: `docs/06-handoff/V2-4_DEVELOPER_BRIEF.md` · 설계: `docs/design/v2/SPEC.md` 4.4, 4.5 C-08·C-09·C-10, 5 B-2·B-3·B-5, 6.2 V2-AC-32~39, 6.3 · 유지: `docs/design/1a-03/SPEC.md`(S-01~S-18·A-1~A-12·AC-01~26)
- 브랜치 `k002bill2/v2-4-compare` · 분기점(브리프 커밋) `c64532e` · 로컬 커밋만

## 기준선 (`c64532e`, fresh)
- test: 44 files · **503 passed**
- 번들(gzip KB, 첫 화면 / 진입 직후, `logs/baseline-build.txt`): 공통 **88.66**(index 85.33 + jsx-runtime 3.33) · `/catalog` 98.49 / 100.87 · `/references/:id` 95.82 / 98.20 · **`/compare` 98.38 / 120.80**(여유 1.62 / 4.20) · 자리표시 89.12 / 91.50
- 청크(gzip KB): `CompareBoardPage` 8.96 · `boardEngine` 5.55 · `compareBoardRepository` 10.31

## 착수 전 확인
- 요약 바 "초안 보기"는 V2-1에서 이미 `secondary`(`DraftSummaryBar.test` 단언 있음). 상태 태그 톤 green·orange는 V2-1에서 이미 `status-positive/cautionary-text` 별칭(colors.css 73~77) → 두 항목은 특성화 테스트로 둔다(억지 RED 없음, V2-3 선례).
- 열 문자 배지는 이미 역상 면(`bg-surface-inverse text-on-surface-inverse`), 견본 별도, 라이선스 Tag, 빼기(×) 있음.
- **D-QA04 이름 미구현**: `ColumnHeader` "전부 선택"에 `aria-label` 없음. V2-AC-35가 요구 → 이름이 바뀌면 기존 테스트의 정확 일치 이름 쿼리가 깨진다(6.3 목록 누락). 나머지 v2 작업 뒤 **단독 커밋**으로 분리하고 REPORT에 줄 목록 기록.
- StatusBadge 컴포넌트는 DS에 없다 → 새로 만들지 않고 `Tag` 재사용(공통 청크 무변경).

## RED (`logs/red.txt`)
- 새 파일 `components/compare/compareBoardV2.test.tsx` 13건 → **9 failed / 4 passed**
  - 실패(진짜 RED): 머리글 회색 면·고정 열 흰 면, 행 선 line-neutral, 고른 셀 primary-container + 채운 원, 안 고른 셀 빈 원(line-strong), 전부 선택 ghost, 패널 흰 면 + 왼쪽 선, 출처 색 점, 초안 비우기 ghost, `draftItemsView` dot
  - 통과(특성화 — V2-1이 이미 충족) 4건: 역상 배지 + 견본 + 라이선스 Tag + 빼기 1건, 상태 태그 톤 `it.each` 3건(neutral · green=positive 별칭 · orange=cautionary 별칭)
- 새 파일 `pages/CompareBoardV2.test.tsx` 1건(모드 토글·조직 공유 부재·12행) → 기준선에서 통과(특성화)

## GREEN 1 (표면·선택 셀·열 머리글·초안 패널)
- `ComparisonTable`: thead 면 삭제, 모서리 td·행 머리글 th `bg-background-normal`(sticky 불투명 유지), 행 선 `line-neutral`, 고른 셀 td `bg-primary-container`
- `PickButton`: 고른 = `circle-check`(주 색, 채운 체크 원) + "선택됨" + `border-primary bg-primary-container`; 안 고른 = CSS 빈 원(`size-4 rounded-full border-(length:--border-thick) border-line-strong`) + "이 요소 선택". 굵은 테두리 삭제(A-3 → 원 모양 + 글자 + 면). `check` 아이콘은 `/compare`에서 더 쓰지 않음
- `ColumnHeader`: "전부 선택" outline → `assistive`(ghost) sm
- `DraftPanel`: 회색 둥근 면 → `border-line-neutral max-xl:border-t max-xl:pt-6 xl:border-l xl:pl-6`, 항목 목록 gap 삭제(행 아래 선), 되돌리기·빈 안내 상자 `bg-surface-elevated`(흰 면 위에서 사라짐) → `bg-fill-normal`, "초안 비우기" outline → `assistive`
- `DraftItem`: 앞에 출처 색 점(`aria-hidden`, `size-2.5 rounded-full`, 출처 없으면 빈 자리) + 행 아래 선, 출처 글자 `text-primary` → `text-primary-text`(Q2 주 색 글자 토큰)
- `draftView`(엔진 청크): `dot` = pick·default 출처 레퍼런스 `colorPalette.primary`, custom·fallback·pending은 없음
- fresh: typecheck 0 · lint 0 · test **517 passed**(46 files, +14) · build 0 (`logs/green1.txt`)
- 가드 1회 걸림: `noHardcodedStyle`가 테스트 파일 hex 리터럴을 잡음 → 픽스처 값 참조로 교체

## 번들 (GREEN 1)
- 공통 88.66 → **88.66**(index 85.33 → 85.33) · `/compare` 98.38 → **98.48** / 120.80 → **120.95** (여유 1.52 / 4.05)
- 청크: `CompareBoardPage` 8.96 → 9.06(+0.10 — 빈 원 span·셀 면 조건·색 점 span·래퍼 div) · `boardEngine` 5.55 → 5.59(+0.04 — dot 계산)
- 다른 라우트: `/catalog` 98.49 / 100.87 → 98.49 / 100.88 · 상세 95.82 / 98.20 → 95.83 / 98.21 (코드 무변경, 해시 문자열 차이)
- 첫 빌드에서 index가 85.34로 한 번 보였다가 다음 빌드 85.33 — raw 268.82kB 동일, 지연 청크 파일명 해시 문자열의 gzip 차이(코드 무변경)

## D-QA04 단독 커밋 (V2-AC-35 · A11Y-AC-16)
- RED(`logs/red-dqa04.txt`): 새 테스트 "열마다 다른 이름" 1 failed(`aria-label` 없음 → null)
- GREEN: `ColumnHeader` "전부 선택"에 `aria-label={`${pickAllLabel}: ${column.label} ${column.title}`}` — 보이는 글자는 그대로(2.5.3). 1열 변형 테스트 추가
- **깨진 기존 테스트 7건(6.3 목록 누락 — 설계가 요구한 이름 변경이지 설계 위반이 아님)** `logs/dqa04-broken.txt`. 이름 쿼리만 고침:
  - `ComparisonTable.test.tsx` 84·101(roving 진입점 focus) · 123(→ 정확 이름 `…: B 프리미엄 헤어살롱`) · **132**(`queryByRole … not.toBeInTheDocument` — 정확 문자열 그대로면 이름이 바뀐 뒤 **조용히 통과**해 AC-15 단언이 무의미해진다 → `/^이 레퍼런스로 전부 선택/`)
  - `CompareBoardPage.test.tsx` 62(AC-02 `/^이 레퍼런스로 프로필 만들기/`) · 119(AC-07) · 131(P-5)
  - `CompareBoardResponsive.test.tsx` 77 (**6.3 표에 파일 자체가 없음**)
- fresh: typecheck 0 · lint 0 · test **519 passed** · build 0 (`logs/green-dqa04.txt`)
- 번들: `/compare` 98.51 / 120.98 · `CompareBoardPage` 9.07(+0.01 aria-label 템플릿) · 공통 88.67(index 85.34, 해시 흔들림 — 아래 정규화 비교)

## 공통 청크 정규화 비교 (`e9f9df6` vs 기준선 `c64532e`)
- 기준선을 임시 worktree(`/tmp`, node_modules 심볼릭 링크)에서 `vite build --outDir /tmp/v24-base-dist`로 다시 빌드 → measure 결과 기준선과 동일(88.66 · `/compare` 98.38 / 120.80). worktree는 제거
- `index-*.js` raw 268,822 = 268,822 바이트. 파일명 해시(`-xxxxxxxx.js|css|svg|woff2`)를 고정 문자열로 바꾸면 **완전히 같다**(normalized identical: True, gzip 84,910 = 84,910)
- → 공통 청크 코드 증가 0. 85.33 ↔ 85.34 흔들림은 index 안의 지연 청크 해시 문자열 gzip 차이(수 바이트)

## 브라우저 실측 (ego-browser, 127.0.0.1:4318 `vite preview`, 13:05 KST 종료 · `lsof` exit 1) — `logs/browser.txt`
- 5열 보드(카탈로그에서 5개 담기) · 1280·1024·768·390 모두 문서 가로 넘침 0, 5열은 표 영역 안 스크롤만(scrollW 1088 > clientW 823/951/695), 390은 아코디언
- 대비(실측 합성): 열 문자 배지 **15.65** · 열 업종 **6.46**(D-QA02) · "기본값 · A" **6.46**(D-QA02) · 대표색 오류 문구 **6.52**(D-QA03) · 요약 바 "초안 보기" **10.78**(D-QA01) · 출처 글자 primary-text 6.45 · "선택됨" 14.08 · 채운 원 4.46 · 빈 원 3.23
- 키보드: 행 roving(Tab 진입 = 선택된 버튼, ←/→·End, 다음 Tab = 다음 행) 정상, 포커스 링 2중 링
- 캡처: `screens/compare-1280.png`·`compare-1024.png`·`compare-768.png`·`compare-390.png`·`compare-1280-scrolled-focus.png`

## Codex 리뷰 1회 (`--base c64532e`)
- 지적 0건("확인 가능한 결함은 없습니다"). 샌드박스 읽기 전용이라 Codex 쪽 테스트 미실행 → 로컬 최종 fresh 실행으로 보강

## 최종 (`logs/final.txt`)
- typecheck 0 · lint 0 · test 519 passed(46 files) · build 0 · 공통 88.67(index 85.34, 정규화 비교상 코드 0) · `/compare` 98.51 / 120.98
