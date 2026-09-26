# FIX-V22 REPORT — QA-V2-2 P3 결함 D-V22-01~05 수정

**결과: 5건 수정 · 검증 4종 통과(test 478/478) · 1280·390 브라우저 재확인 통과 · 번들 예산 안 · Codex 지적 0건.**

- 브리프 `docs/06-handoff/FIX-V22_DEVELOPER_BRIEF.md` · 근거 `docs/qa/v2-2/REPORT.md` 1절 · 브랜치 `k002bill2/fix-v22` · 분기점 `d7eeb08` · 로컬 커밋만
- "전" 수치 = QA 실측. 근거: `git diff --stat 14da219 d7eeb08 -- app` 출력 없음(QA 대상과 같은 코드)
- 브라우저: ego-browser TaskSpace 8, `vite preview --host 127.0.0.1 --port 4338 --strictPort`, 뷰포트는 CDP `Emulation.setDeviceMetricsOverride`. 링 여유 = 포커스 요소 rect ±4px(2중 링 바깥 폭)와 가장 가까운 `overflow` 조상·뷰포트 사이 거리(≥ 0이면 4면 보임). 헬퍼 `logs/browser-helpers.js`.

## 1. 결함별

| ID | 원인 | 수정 | 테스트 | 브라우저 전 → 후 |
|---|---|---|---|---|
| D-V22-01 | 로고·주 메뉴 링크에 focus-visible 스타일 없음(UA outline). nav가 모든 폭 `overflow-x-auto`라 링크 박스 밖이 잘림. 로고는 `h-13`으로 헤더 높이 전체라 바깥 링 위쪽이 뷰포트 밖 | `AppHeader.tsx`: 링 상수 `FOCUS_RING`(`rounded-xs focus-visible:outline-none focus-visible:shadow-(--focus-ring)`)을 로고·링크 4개에 적용. 로고 `h-13` → `my-2.5 h-8`(행 높이 52 유지). nav <768: `-mx-1 -mt-1 px-1 pt-1`(안쪽 여백을 음수 여백으로 상쇄 → 링크 위치 불변), ≥768: `md:overflow-visible md:m-0 md:p-0` | `AppHeader.test` "로고·주 메뉴 링크는 DS 2중 링(--focus-ring)을 쓰고, 링이 잘리지 않게 여백을 둔다 (D-V22-01)" | 전: 1280 위·아래 4px 잘림(좌우 세로선만), 390 위 4px 잘림. 후: 2중 링. **1280** 로고 여유 위 6·좌 24, 링크 4개 위 10(nav `overflow: visible`). **390** 로고 위 6·좌 12, 링크 4개 위 0·좌 ≥0·아래 8·우 ≥85(nav 안). 헤더 높이 1280·1024·768 = 52, 390 = 89(불변), 문서 넘침 0, nav 스크롤 0, 첫 링크 x 189.39/16(불변). 캡처 `screens/after-focus-{1280,390}-nav.png`·`after-focus-{1280,390}-logo.png` · `logs/browser-header-reset.log` |
| D-V22-02 | 누른 "필터 초기화"가 즉시 `disabled`가 되어 포커스가 body로 빠짐 | `FilterRail.tsx`: 레일 제목 `h2`에 `ref`·`tabIndex={-1}`·focus-visible 링. 초기화 핸들러가 `onReset()` 뒤 제목에 `focus()`(CatalogPage 무수정) | `CatalogPage.test` "키보드 Enter로 / 클릭로 초기화하면 포커스가 body가 아니라 레일 제목으로 간다 (D-V22-02)" 2건 | 전: `activeElement = BODY`. 후(1280 `?industry=cafe-fnb&concept=minimal`): 키보드 → `H2 "필터"`, `:focus-visible` true(링 캡처 `screens/after-reset-1280-keyboard.png`), 다음 Tab → 첫 체크박스. 클릭 → `H2`, focus-visible false(마우스엔 링 없음). URL `?industry=cafe-fnb`(업종 유지) |
| D-V22-03 | Chrome은 **일부만 보이는 요소**에 포커스할 때 스크롤하지 않음(사전 실측 `scrollLeft 0`). 칩 줄 `p-1`·`scroll-padding`만으로는 해결 안 됨(주입 실측 변화 없음) | `CatalogToolbar.tsx`: 칩 줄 `onFocus` → 대상이 `:focus-visible`(키보드 포커스)일 때만 `scrollIntoView({block:'nearest', inline:'nearest'})`, 칩 줄 `scroll-px-2`(링 4px + 여유) | `CatalogPage.test` "Tab으로 포커스한 업종 칩은 링까지 칩 줄 안으로 스크롤하고, 마우스 클릭은 스크롤하지 않는다 (D-V22-03)" — jsdom은 `:focus-visible`을 항상 false로 계산해 판별 결과만 모의, 판별 자체는 브라우저 실측. 핸들러 제거 시 FAIL 확인 | 전: "의료 1" 칩 14px + 링 잘림(여유 −33), "전문서비스 1" 링 6px 잘림. 후(390, 700ms 대기): 의료 **+3.85**, 피트니스 +103.9, 전문서비스 **+3.88**, 교육 +85.6, 리테일 **−0.21**(끝 칩 — 최대 스크롤 385.5에서 서브픽셀, 눈으로 구분 불가), Shift+Tab 5단계 모두 ≥ +3.9. **마우스**: 부분 노출 "의료" 클릭 전후 `scrollLeft 0 → 0`(동작 불변). 캡처 `screens/after-focus-390-chip.png` · `logs/browser-chip-pill.log` |
| D-V22-04 | 숨긴 설명 노드가 `{count}` + "개" 두 텍스트 노드 → Chrome 설명 계산이 공백을 넣음 | 템플릿 문자열 한 노드로: `Checkbox.tsx` `` `${count}개` ``, `CatalogToolbar.tsx` 칩 `` `${count}개` ``·"필터" `` `선택 ${n}개` ``, `FilterRail.tsx` 초기화 `` `선택 ${n}개` `` | `CatalogPage.test` "개수 설명은 텍스트 노드 하나로 'N개' / '선택 N개'다 (D-V22-04)" — 접근성 설명 정확 비교 + 설명 노드 `childNodes` = `["1개"]` | 전: AX `"1 개"`·`"선택 1 개"`. 후(Chrome AX 트리 `/catalog?concept=minimal`): 체크박스 "미니멀"·"대담한" `"1개"`, 칩 "전체"·"카페·F&B" `"1개"`, "필터 초기화" `"선택 1개"`. ("필터" 버튼은 1280에서 `lg:hidden`이라 트리에 없음 — 같은 수정, jsdom 테스트로 확인) VoiceOver 청취는 하지 않음(L3) |
| D-V22-05 | 펼친 목록(absolute, 필 위)이 DOM에서 필 행 **앞**이라 Tab(앞으로)으로 못 들어감 | `CompareTrayBar.tsx`: 알림(`role=status`)+목록 absolute 컨테이너를 필 행 안 **토글 바로 뒤**로 이동. containing block은 여전히 바깥 `relative`라 시각 위치 불변. 포커스 이동 방식 대신 DOM 이동을 고른 근거: 공개(disclosure) 패턴 표준 순서이고, 펼침만으로 포커스를 뺏지 않음 | `CompareTrayBar.test` "펼친 뒤 Tab(앞으로)으로 목록에 들어간다 — DOM에서 목록이 토글 다음 (D-V22-05)" + 기존 "포커스가 필 밖으로 나가면 목록을 닫는다"를 새 순서로 재작성(토글 → Tab 목록(열림 유지) → Shift+Tab 토글 → Shift+Tab 밖(닫힘)) | 전: Tab 토글 → 비교 보드 열기 → BODY. 후(1280·390, 3개): 목록 bottom 728 ≤ 필 top 736, 가운데 정렬(640/640, 195/195) — 위치 불변. Tab 1~3 = 목록 빼기 3개(열림 유지), Tab 4 = 비교 보드 열기. **D07** 가운데 제거 → 다음 항목 포커스, **Esc** → 닫힘 + 토글 복귀, Shift+Tab으로 필 밖 → 닫힘. 캡처 `screens/after-pill-{1280,390}-open.png` |

**2.4.3 판단(D-V22-05)**: 보이는 순서(목록이 필 위)와 DOM 순서(토글 → 목록 → 열기)가 달라졌지만, 토글이 목록을 여는 공개 패턴에서 "연 내용이 여는 버튼 다음"이 의미·조작 순서에 맞아 2.4.3을 충족한다고 판단(L2).

## 2. 검증 4종 (`logs/`, fresh, 코드 커밋 직전)

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | exit 0 (`typecheck.log`) |
| `npm run lint` | exit 0 (`lint.log`) |
| `npm test -- --run` | **478 passed / 41 files**(기준 472, +6 — 새 6건, 재작성 1건), exit 0 (`test.log`) |
| `npm run build` | exit 0, 예산 검사 통과 (`build.log`) |

RED: `logs/red.log` — 새/재작성 테스트 **7 failed / 49 passed**(3 files), 모두 기대한 이유(클래스 없음·`['1','개']`·포커스 BODY/열기 버튼).

## 3. 번들 (gzip KB, 첫 화면 / 진입 직후, 예산 100 / 125)

| 라우트 | 전 | 후 | 여유(첫 화면) |
|---|---|---|---|
| 공통 JS | 89.52 | 89.58 | — |
| `/catalog` | 98.91 / 101.30 | **99.06** / 101.44 | 1.09 → **0.94** |
| `/references/:id` | 96.04 / 98.42 | 96.10 / 98.48 | 3.90 |
| `/compare` | 99.24 / 121.66 | **99.30** / 121.73 | 0.76 → **0.70** |
| 자리표시 | 89.98 / 92.36 | 90.04 / 92.42 | 9.96 |

공통 +0.06(AppHeader 클래스 문자열), `CatalogPage` 청크 6.87 → 6.96. 예산 변경 없음.

## 4. Codex 리뷰 (1회, `review --wait --scope branch --base d7eeb08`, 코드 커밋 뒤)
- 결과: **"확실히 조치가 필요한 결함은 발견하지 못했습니다."** 지적 0건 → 반영 없음. `logs/codex-review.log`
- 참고: Codex 샌드박스에서 Vite 임시 설정 파일 쓰기 권한 오류로 Codex 쪽 테스트 실행은 실패 — 테스트 증거는 위 로컬 fresh 실행.

## 5. 목업과 다르게 한 곳 · 남은 위험
- 목업 차이: 로고 링크 포커스 박스를 행 높이(52) 대신 32 + 세로 여백으로(링 위쪽이 뷰포트 밖으로 나가지 않게 — 보이는 배치는 같음). 주 메뉴에 포커스 링 추가(목업에 포커스 상태 없음).
- **R-1** 마지막 칩 "리테일" 링 오른쪽 −0.21px: 최대 스크롤 위치의 서브픽셀. 칩 줄 끝 padding이 4px라 링과 정확히 같다. 눈으로 구분되지 않아 그대로 둠.
- **R-2** 목록을 연 채 "비교 보드 열기"에서 Tab → 문서 끝(BODY)이면 목록이 열린 채 남는다(`relatedTarget` 없음). 수정 전에도 같았던 기존 동작(QA "문서 끝(BODY)")이라 범위 밖으로 둠.
- **R-3** 칩 스크롤 판별은 `:focus-visible` 휴리스틱에 의존 — jsdom에서 볼 수 없어 테스트는 판별 결과를 모의하고 Chrome 실측으로만 확인. Safari는 미실측.
- **R-4** 초기화 결과 전용 live region은 만들지 않았다. 카탈로그에 필터용 live region이 없고, 필의 `role=status`는 비교 한도 알림용이라 재사용하면 의미가 섞인다. 제목 "필터"로 포커스 + 버튼 설명 "선택 0개"로 전달.
- K-1(모바일 헤더 Tab 순서)·카드·레일 레이아웃·상세·비교 보드 **미변경**. `design/` 미변경, 새 의존성·아이콘 0.

## 6. 서버·브라우저 정리
- `kill` PID(vite preview 4338) → `lsof -nP -iTCP:4338 -sTCP:LISTEN` **출력 없음(exit 1)** (`logs/server-stop.log`). TaskSpace 8 `finish({ keep: [] })`.

## 7. 커밋
- `73f37c7` fix(catalog,shell): QA-V2-2 P3 결함 D-V22-01~05 수정
- (이 REPORT 커밋 — 해시는 최종 응답에 기재)
