# V2-2b PROGRESS — 카탈로그 카드 v2 · 플로팅 비교 필

- 브리프: `docs/06-handoff/V2-2b_DEVELOPER_BRIEF.md` · 설계: `docs/design/v2/SPEC.md` 4.2 카드·필 행, 4.5 C-03·C-04·C-05
- 브랜치 `k002bill2/v2-2b-card-pill` · 분기점 `7d83356` · 로컬 커밋만

## 기준선 (`7d83356`, fresh)
- test: 40 files · **459 passed**
- 번들(gzip KB, 첫 화면 / 진입 직후): 공통 89.51 · `/catalog` 98.53 / 100.91 · `/references/:id` 96.03 / 98.41 · `/compare` 99.23 / 121.65 · 자리표시 89.97 / 92.35 · CSS 8.18

## 착수 전 확인 — 6.3 밖 보호 테스트가 강제하는 계약
SPEC 6.3은 `ReferenceCard.test`·`keyboardA11y.test`만 예고했지만, 6.3 밖 테스트에도 카드·트레이 단언이 있다. 브리프대로 테스트는 고치지 않고 구현으로 맞춘다.

| 테스트 (6.3 밖) | 단언 | 구현 결정 |
|---|---|---|
| `trayBoard.test:21` | 트레이 글자 "비교 보드 2 / 6" | 필 펼침 버튼 글자 = "비교 보드 N / 6" (목업 "비교 N / 6"과 다름 → C-05 기록) |
| `trayBoard.test:15·40`, `CatalogPage.test:140` | 펼치지 않고 "…비교에서 제거" 버튼 조회 | 목록 접힘은 CSS 클래스(`hidden`)로만 — V2-2a 레일과 같은 방식(jsdom은 CSS 미적용) |
| `CatalogPage.test:138·142·155` | 카드 비교 버튼 글자 "비교 중"/"비교 추가" | 아이콘 버튼의 이름을 `aria-label` 대신 sr-only 본문으로(이름 문자열은 기존과 동일) |
| `CatalogPage.test:134·137·152` | 트레이 `getByText("0"/"1"/"6")` | 개수는 단독 span, "/ 6"은 별도 span |

## 묶음 1 — 카드 v2 (V2-AC-22·23)
- RED: `ReferenceCard.test` 새 단언 9건 중 **6 failed / 3 passed**(캡션 2줄·라벨 점수·`<time>`·보더 없음·`line-clamp-2`·`size-8`·primary 상태 글자). 아이콘 이름 단언은 jsdom에서 SVG가 data URL로 인라인돼 이름을 볼 수 없어 "상태가 바뀌면 아이콘 모양이 바뀐다"(style 비교)로 교체.
- GREEN: `ReferenceCard.tsx` — 보더·흰 면 삭제(`article` = `flex flex-col gap-2`), 썸네일만 muted(`rounded-lg`, 16:9 → `sm:` 4:3), 제목 `line-clamp-2`, 캡션 1 "업종 · 레이아웃 · 모션", 캡션 2 "태그 · 태그 · 반응형", 점수 줄 "접근성 96 · 성능 92 · 09.20 측정"(`<time dateTime>`에 연도), 대표색 점 3개, 32px ghost 아이콘 버튼 2개(이름은 sr-only 본문 — 문자열 기존과 동일, 저장만 `aria-pressed`). 태그 `Tag` → 캡션 글자(6.3). 카드가 `Button`을 더 이상 import하지 않음.
- 비교 추가 전 아이콘 = 기존 `plus`(목업 `cmpIcon`), 담김 = `check`. 새 아이콘 파일 0.
- fresh: test **463 passed**(+4, 40 files) · typecheck 0 · lint 0 · build 0
- 번들(바이트, zlib 기본 gzip, 기준 → 카드): `CatalogPage` 6451 → 6479(+28) · 공통 `index` 86185 → 86188(+3, 청크 해시 파일명 변동) · 합계 표시: `/catalog` 98.56 / 100.95 · `/compare` 99.23 / 121.66
- 목업 차이: **C-03** 제목 2줄(목업 1줄 말줄임) · **C-04** 캡션 2줄 + 라벨 있는 점수 줄·측정일(목업 "96 / 92" 라벨 없음) · 점수 줄을 제목 오른쪽이 아니라 캡션 아래 한 줄로(라벨이 붙어 길어짐) · 측정일은 SPEC 표기 "MM.DD 측정"(연도는 `datetime`)

## 묶음 2 — 플로팅 비교 필 (V2-AC-24·25)
- RED: 새 `CompareTrayBar.test.tsx` 9건 + `keyboardA11y` D07(6.3 행 — "트레이 영역" → 펼침 버튼, 먼저 펼치고 제거) 1건 = **10 failed**.
- GREEN: `CompareTrayBar.tsx` 내용 교체(파일명·props 유지 → `CatalogPage` 무수정).
  - `section aria-label="비교 트레이"`, sticky 하단 가운데 필(`bg-surface-inverse`, `rounded-full`, `shadow-4`), 0개여도 유지.
  - 펼침 버튼 "비교 보드 N / 6"(`aria-expanded`·`aria-controls`, "/ 6" = `text-inverse-label-alternative`, 개수 단독 span, `chevron-down` 회전). 담긴 대표색 점(`aria-hidden`, `sm:` 이상). "비교 보드" primary sm 버튼, 이름 "비교 보드 열기".
  - 목록: 필 위 떠 있는 역상 패널(접힘 = `hidden` 클래스만), 항목 = 색 점 + 제목 + 32px 빼기("<제목> 비교에서 제거"). 비었을 때 담는 방법 안내.
  - D07 변형: 다음 → 이전 → 펼침 버튼. 0개가 돼도 펼침 버튼은 활성(포커스가 body로 빠지지 않게).
  - Esc = 닫고 펼침 버튼으로. 포커스가 필 밖으로 나가면 닫는다(펼친 목록은 scroll-padding보다 높아 뒤 카드 포커스를 가릴 수 있으므로).
  - 한도 알림: `role=status` `<p>`는 항상 마운트(숨김 클래스 없음), 말풍선 스타일은 안쪽 span에만.
  - 2.4.11: 마운트 동안 `documentElement.style.scrollPaddingBottom = calc(var(--spacing) * 24)`(= 본문 `pb-24`), 언마운트 시 해제.
- fresh: test **472 passed**(41 files, +9) · typecheck 0 · lint 0 · build 0. `CatalogPage.test`·`trayBoard.test` **무수정 통과**.
- 번들(바이트, 기준 → 필): `CatalogPage` 6451 → 6830(**+379**) · 공통 `index` 86185 → 86189(+4, 청크 해시 파일명 변동 — 공통 모듈 코드 변경 0: `Button`·`Icon`·`cx` 무수정) · 합계: `/catalog` **98.92 / 101.30** · `/compare` 99.24 / 121.67
- [Q] ego-browser(127.0.0.1 preview, 끝나고 종료):
  - 5폭(1920·1280·1024·768·390, 높이 900): 가로 넘침 0 · 열 3·3·2·2·1 · 카드 폭 311·306·339·341·343 · 긴 제목 주입 시 2줄에서 잘림(`scrollHeight > clientHeight`) · 카드 버튼 32×32 · 필 243×44, 바닥에서 20 · `scroll-padding-bottom` 96px
  - V2-AC-25: 맨 위에서 마지막 카드 링크 → Tab. 390×700: 저장·비교 버튼 하단 604 = 700 − 96(scroll-padding 적용), 필 위쪽 636 → 겹침 0. 1280×560: 문서 끝까지 스크롤돼 버튼 216~248, 필 496 → 겹침 0. 목록 펼친 채 Shift+Tab: 목록 항목 → 카드로 나가는 순간 목록 닫힘, 카드 버튼 겹침 0
  - 6개 담고 펼침: 360·390·1280에서 목록(320 폭)이 필 위, 가로 넘침 0
  - 스크린샷은 `Page.captureScreenshot` CDP 타임아웃으로 2회 실패 → 시각 캡처 없음(수치만)
- 목업 차이: **C-05** 펼침 버튼 글자 "비교 보드 N / 6"(목업 "비교 N / 6" — 6.3 밖 `trayBoard.test` 계약), 빼기 목록·알림 말풍선·0개 유지·Esc/포커스 이탈 닫기 추가 · **C-12** "/ 6" opacity → `inverse-label-alternative` · 대표색 점은 <640에서 숨김(390 필 폭 확보)
