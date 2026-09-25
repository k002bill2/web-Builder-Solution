# M1-UI-03a PROGRESS

브리프: `docs/06-handoff/M1-UI-03a_DEVELOPER_BRIEF.md` · 브랜치 `k002bill2/m1-ui-03a` (main에서 분기, 로컬 커밋만)
설계: `docs/design/1a-03/SPEC.md` · 결정: ADR-003·004·005 · 기준선 테스트 115개 통과

## 단계 현황
| # | 항목 | 상태 | 커밋 |
|---|---|---|---|
| 0 | 읽기(브리프 0절 순서) + `npm ci` + 기준선(테스트 115·build 통과) | 완료 | — |
| 10 | ADR-004 번들 검사: 라우트별 첫 화면 합계 ≤ 100KB | 완료 | (이 커밋) |
| 1 | 타입 `domain/compareBoard.ts` | 완료 | (1·2 커밋) |
| 2 | 행 정의·셀 값 (섹션 라이브러리·비교 픽스처) | 완료 | (1·2 커밋) |
| 3 | 선택 규칙 P-1~P-7 | 완료 | (3 커밋) |
| 5 | `contrast.ts` + `derivePalette` | 완료 | (5 커밋) |
| 4 | `buildProfileDraft` | 대기 | |
| 6 | R-12 Footer 경고 데이터 | 대기 | |
| 7 | 사용자 대표색(zod)·폰트 허용 목록 | 대기 | |
| 8 | `compareBoardRepository` 메모리 구현 + 저장 직렬화 | 대기 | |
| 9 | 트레이 통합 | 대기 | |

작업 순서는 의존 관계 기준(10 → 1·2 → 3 → 5 → 4 → 6·7 → 8 → 9).

## 항목 10 — 번들 검사 기준 변경 (ADR-004)
- 판정 대상: 라우트별 첫 화면 합계(공통 + 라우트 청크 정적 closure) ≤ 100KB. 공통 청크 단독은 참고 출력.
- 자리표시 라우트(`/compare`·`/profile`·`/studio` → `PlaceholderPage`)도 대상에 넣음. 설정한 페이지가 manifest에 없으면 조용히 건너뛰지 않고 실패.
- GREEN: 공통 87.26KB(참고) · `/catalog` 95.34KB · `/references/:id` 93.49KB · 자리표시 87.70KB → exit 0
- RED ①: 예산을 95로 낮춤 → `예산 검사 실패 — /catalog: 95.34KB > 95KB`, exit 1 → 100으로 원복
- RED ②: 페이지 경로를 없는 파일로 바꿈 → `manifest에 src/pages/PlaceholderPageX.tsx가 없습니다`, exit 1 → 원복

## 항목 1·2 — 타입·행 정의·셀 값
- `domain/compareBoard.ts`: SPEC 8.1 타입 + `COMPARISON_ROWS`(12행·역할·required) + `PICKABLE_ROW_IDS`(10) + 열 문자 `nextColumnLabel`(비어 있는 가장 앞) + `draftStatusOf`(확정 전/vN 확정됨/변경됨) + `DesignProfileInput`(`selection_mode` 포함, ADR-005 Q5). 트레이가 쓰는 공통 청크용이라 zod·대비 계산 없음.
- `domain/sectionLibrary.ts`: 라이브러리 v1.4(header·hero·footer 변형, footer 사업자정보 여부·확장 변형) + `variantMigrations` + `resolveVariant`.
- `domain/comparisonCells.ts` + `fixtures/referenceComparisons.ts`: 레퍼런스·상세·비교 속성 → 12행 셀. 없음 → `binding:null`, 라이브러리에 없는 변형 → "현재 라이브러리에 없는 변형"(AC-26), 대응표 → 새 변형.
- RED: 두 테스트 파일 모두 모듈 없음으로 실패 → GREEN 20/20.
- SPEC과 다르게: `ComparisonRowDef.shortLabel`(알림 문장용 "Hero·카드"), `ReferenceComparison.spacing`(spacing_tokens 출처) 추가. A 섹션 수는 footer를 넣어 **9개**(목업 8) — SPEC 8.5 따름, 상세 픽스처는 8개 그대로. `DesignReference.key`는 기존 테스트가 쓰므로 유지(보드 표기에는 안 씀).

## 항목 3 — 선택 규칙 (P-1~P-7 · S-08/S-09)
- `domain/boardColumns.ts`: `addColumn`(중복·한도, 비어 있는 가장 앞 문자) · `removeColumn`(P-7 선택 해제 + 알림 "B를 빼서 Hero·카드 선택 해제") · `releaseNotice`. 트레이가 쓰므로 의존 없음.
- `domain/boardPicks.ts`: `togglePick`(P-1 교체·P-2 해제·P-3 info 불가·P-4 없음 불가·회수 열 불가·P-6 id 저장) · `pickAnnouncement`(A-4) · `pickAllFrom`(P-5, 다른 열 선택만 N으로 셈 + 되돌리기용 `previous`) · `releaseUnavailablePicks`(AC-15 데이터).
- `domain/comparisonCells.ts#resolveComparisons`: 회수(비노출 전환)=`withdrawn`, 없음=`missing`을 상태로 반환.
- RED: 모듈 없음으로 두 파일 실패 → GREEN 28/28 (domain 전체 48).
- 문구: SPEC P-7/1.3은 "해제됐습니다", A-4/AC-08은 "해제" → **AC-08 문구**("B를 빼서 카드 선택 해제")를 따름.

## 항목 5 — 대비·역할 팔레트
- `domain/contrast.ts`: WCAG 상대 휘도·대비, `formatRatio`(버림 — 4.47이 "4.5:1"로 보이지 않게), `nearestCompliantColor`(명도 0.1%p 간격으로 양방향 탐색, 같은 거리면 어두운 쪽), `checkPaletteContrast`(C-1~C-3).
- `domain/palette.ts#derivePalette`: 대표색만 교체, 역할 5개 고정 순서, 대문자 정규화.
- 고정값: F `#D47800` 3.24 · D `#00A884` 3.03 · A `#8B5E3C` 5.58 (`toBeCloseTo(…, 2)`). 보정값은 기준 이상 + 한 단계 더 가까우면 미만.
- RED: 모듈 없음 → GREEN 15/15.
- 해석: C-3 색 쌍 = 카드 표면 대표색 / 카드 글자 잉크 (목업 B 다크 카드 = 검정 + 골드). 테스트 이름에 명시.
