# GEN-MARK-2-IMPL REPORT — 비교 열 머리 표식 · buildNote 숨김 · 라이선스 한국어 표기 (B-GM-01·02·03)

- 브랜치 `k002bill2/gen-mark-2-impl` · base main `3706c22` · 구현 커밋 `19def08` · 2026-10-11
- 정본: `docs/design/gen-mark/SPEC-2.md` r1 + `MQ-2.md`(MQ-GM2-1~4 전부 A). `/profile`(`ProfileValues`)은 범위 밖(MQ-GM2-4 A) — 영문 원값 유지.

## 1. 요약
1. 라이선스 표시 맵 `LICENSE_LABEL`(3값: 자체 제작 / 이용 허락 / 외부 관찰)을 `components/catalog/SourceTags.tsx`에 export. 접두 sr-only `라이선스: `.
2. 비교 열 머리(`ColumnHeader`, 표·아코디언 공용)가 `SourceTags inline`(래퍼 `contents`)을 재사용 → [라이선스][생성 조합] 순서, 사용 불가 Tag는 그 뒤. `BoardColumnView.sourceKind` 추가.
3. 생성 조합 상세 메타 줄에서 buildNote 제외(큐레이션은 그대로).
4. FilterRail 라이선스 그룹 체크박스 · CatalogPage 부제 한국어. 데이터·필터 id·URL·facet 집계는 영문 그대로.

변경 파일(코드): `SourceTags.tsx` · `ColumnHeader.tsx` · `boardView.ts` · `ReferenceDetailPage.tsx` · `FilterRail.tsx` · `CatalogPage.tsx`
테스트: 새 `components/compare/columnHeaderSource.test.tsx`(U1·U2·U3·U6, 표·아코디언 각각) · 갱신 `ReferenceCard.test.tsx` · `compareBoardV2.test.tsx` · `ReferenceDetailPage.test.tsx`(U4·U5 추가) · `CatalogPage.test.tsx`(U7·U8)

## 2. 수용 기준 결과

| AC | 결과 | 근거 |
|---|---|---|
| GM2-AC-U1 | ✅ | `columnHeaderSource.test.tsx` 표·아코디언: 접두 → 자체 제작 → 생성 조합 순서, aria-hidden 0, Tag가 업종 줄 직속(래퍼 `contents`) |
| GM2-AC-U2 | ✅ | 큐레이션 열 생성 조합 0 · missing 열 라이선스·생성 조합 0 · withdrawn 생성 열 = 외부 관찰 → 생성 조합 → 사용 불가 |
| GM2-AC-U3 | ✅ | boardView: 생성 = `library_composition`, 큐레이션·missing = undefined |
| GM2-AC-U4 | ✅ | 생성 상세 메타 `^뷰티 · .+ 타깃$`, "internal-compose"·"조합 생성기" 0, T3 1회 |
| GM2-AC-U5 | ✅ | 큐레이션 메타 "… · 우리 섹션 라이브러리 v1.4로 제작" 그대로(기존 동작 — RED 단계에서도 PASS, 예측대로) |
| GM2-AC-U6 | ✅ | 카드·상세·비교 Tag 한국어, 영문 0, 접두 textContent `라이선스: ` |
| GM2-AC-U7 | ✅ | 체크박스 이름 자체 제작·이용 허락, 클릭 시 URL `license=internal` → `internal,licensed` |
| GM2-AC-U8 | ✅ | 부제 "자체 제작 · 이용 허락 레퍼런스 6개" |
| GM2-AC-U9 | ✅ | `Readonly<Record<LicenseStatus, string>>` — typecheck 통과 |
| GM2-AC-U10 | ✅ | `keyboardA11y.test.tsx` 포함 전체 통과(표식 span 비대화형) |
| GM2-AC-G1 | ✅ | `git diff --stat 3706c22 -- referenceDisplay.ts fixtures/ components/profile/ ds/Tag.tsx domain/ engine/ scripts/ data/ package-lock.json design/ CLAUDE.md docs/decisions` = 0 |
| GM2-AC-G2 | ✅ | 3절 표 |
| GM2-AC-G3 | ✅ | internalCompose G1·G5 가드 통과 · 썸네일 버전 `86342b48` base=head |
| GM2-AC-G4 | ✅ | `noHardcodedStyle.test.ts` 통과 |
| GM2-AC-E1 | ✅(부분) | 1280·1024·390 4열(전문서비스 큐레이션 · 의료 큐레이션 · 생성 2). 생성 열 [자체 제작][생성 조합] 같은 top(1280 y=228 둘 다) · 빼기 버튼 y=180 그대로 · 전부 선택 이동은 제목 2줄 때문(+18px, Tag 줄바꿈 0). **withdrawn 열은 실브라우저에서 만들 수 없어(앱 안 조작으로 라이선스 회수 불가) U2 테스트로 대체.** 열 폭이 192~224px라 [생성 조합] 줄바꿈 자체가 일어나지 않음 |
| GM2-AC-E2 | ✅ | gen-beauty-1 1280·390 메타 "뷰티 · 센터 히어로 · 20~30대 타깃", internal-compose 0 |
| GM2-AC-E3 | ✅ | 카탈로그 1280: 부제 "자체 제작 · 이용 허락 레퍼런스 21개" · 레일 [자체 제작 19][이용 허락 2] · 본문 영문 internal/licensed 0 · 체크 후 URL `?license=internal` |

## 3. 예산 (같은 머신 base `3706c22` / head 빌드, gzip KB)

| 라우트 | base | head | 증감 | 판정선 | 판정 |
|---|---|---|---|---|---|
| `/catalog` 첫 화면 | 100.32 | 100.36 | +0.04 | ≤100.90 | ✅ |
| `/references/:id` 첫 화면 | 97.76 | 97.78 | +0.02 | ≤100 | ✅ |
| `/compare` 첫 화면 | 98.91 | 99.29 | +0.38 | ≤100 | ✅ |
| `/compare` 진입 직후 | 122.72 | 123.12 | +0.40 | ≤125 | ✅ |
| `/profile` 첫 화면 | 99.89 | 99.88 | −0.01 | ≤100 | ✅ |
| `/profile` (3안) 진입 직후 | 122.47 | 122.48 | +0.01 | ≤125 | ✅ |
| `/projects` 첫 화면 | 98.43 | 98.43 | 0 | ≤100 | ✅ |
| `/studio` 진입 직후 | 129.84 | 129.85 | +0.01 | ≤129.87 (m2cBaseline +0.03) | ✅ |
| `/studio` 복원 진입 직후 | 132.87 | 132.88 | +0.01 | ≤132.90 | ✅ |
| render.html JS | 84.22 | 84.22 | 0 | ≤90 | ✅ |

- 청크: **새 공유 청크 0**. manifest상 `SourceTags` 청크 소비 = base Catalog·Detail → head Catalog·Detail·**Compare**. 기존 `compareTray` 청크가 `SourceTags` 청크로 합쳐져 청크 수 118 → 117(SPEC F14·Codex r1 시제품 예측과 같은 재편). `/studio` ±0.01은 이 재편에 따른 엔트리 수 바이트 변화.
- `m2cBaseline.json`·`bundleBudget.test.mjs` 수정 0.

## 4. 게이트 (fresh 실행)
- `npm run typecheck` exit 0 · `npm run lint` exit 0(0 problems — 새 상수 export의 react-refresh 경고 1건은 사유 주석으로 disable: 청크 배치상 SPEC이 이 파일을 지정) · `npx vitest --run` 302 files / 2730 tests pass · `npm run build` exit 0(최종 재빌드 수치 동일 — PROGRESS 참조).
- TDD: RED 예측(영문 원값·접두·boardView·buildNote 단언 실패) → 실제 RED 20건 → GREEN. SPEC 8절 목록 밖 기존 단언 2곳(V2-AC-17r2 체크박스 이름, M3P-3b 라이선스 글자)도 표시 문구만 갱신 — 단언 약화 0.

## 5. Codex
- r1 `codex-companion review --scope branch --base 3706c22`: **지적 0건** ("보고할 결함을 발견하지 못했습니다", typecheck·`git diff --check` 통과). Codex 쪽 테스트 실행은 읽기 전용 샌드박스 EPERM으로 미실행 — 테스트는 이 레인에서 직접 실행해 통과. 지적 0이라 r2 생략(라운드 상한 규칙). 로그 `codex-r1.log`.

## 6. Ego Lite (포트 4365 · `vite preview` · 앱 안 클릭 이동)
- 캡처(`ego/`, 뷰포트 캡처 · PNG 바이트): `e1-compare-1280.png` 117865 · `e1-compare-1024.png` 123869 · `e1-compare-390.png` 55848 · `e2-detail-1280.png` 91445 · `e2-detail-390.png` 59251 · `e3-catalog-1280.png` 158981.
- 정리: IndexedDB `design-studio` 삭제 · `finish({keep:[]})` · `listTaskSpaces()` = 다른 레인 space 14만 남음(무접촉) · 4365 서버 종료 · 리슨 0. 영환님 창·main 5480 무접촉.

## 7. 남은 것
1. QB-GM2-1(“이용 허락” 이해도)·QB-GM2-2(열 머리 줄바꿈 산만함) — 사람 판단. 실측상 1280·1024·390 모두 열 폭 ≥192px라 [생성 조합] 줄바꿈 발생 0.
2. E1 withdrawn 열 실브라우저 확인 불가(앱 조작으로 회수 상태를 만들 수 없음) — U2 단위 테스트(표·아코디언)로 대체.
3. B-GM-03b(`/profile` 출처 목록 영문 원값) — 범위 밖, BACKLOG 등록 상태 유지.
4. push·merge 안 함(승인 필요).
