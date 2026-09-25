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
| 4 | `buildProfileDraft` | 완료 | (4 커밋) |
| 6 | R-12 Footer 경고 데이터 | 완료 | (6·7 커밋) |
| 7 | 사용자 대표색(zod)·폰트 허용 목록 | 완료 | (6·7 커밋) |
| 8 | `compareBoardRepository` 메모리 구현 + 저장 직렬화 | 완료 | 76ecad2 |
| 9 | 트레이 통합 | 완료 | (9 커밋) |

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

## 항목 4 — 기준 레퍼런스·기본값·초안 (`domain/profileDraft.ts`)
- `buildProfileDraft(board, results, libraryVersion)` → `needs-hero`(고른 항목만 출처, 나머지 "Hero를 먼저 고르세요") | `ready`(기준 레퍼런스 = Hero 열, 항목 10개, `profile`, 대비 검사용 `palette`, `cardTone`, `notices{motionCapped(R-07), rebinding(R-15)}`).
- 값 결정: 선택 → 기준 레퍼런스 기본값 → (Footer만) 라이브러리 기본 `biz-extended`. 회수·없음 열의 선택은 무시(기본값).
- `section_plan`: 기준 sectionPlan에서 header·hero·footer 변형만 교체, footer 없으면 끝에 추가(R-01). `seed`: 열(문자 순)·picks·custom 키 정렬 JSON의 FNV-1a. `selection_mode`: 고른 레퍼런스가 1개이고 사용자 값이 없으면 `template`.
- RED: 모듈 없음 → GREEN 15/15 (AC-07·09·10·11 포함).
- 해석: SPEC 8.3 "모든 선택이 한 레퍼런스면 sectionPlan 그대로"와 R-01(footer 추가)이 겹치면 R-01 우선(기준에 footer가 없을 때만 차이). 인자는 브리프 시그니처(`board, references, libraryVersion`)를 따름 — SPEC의 `rows` 인자는 `COMPARISON_ROWS` 상수로 대체.

## 항목 6·7 — 경고 데이터·입력 검증
- `domain/boardWarnings.ts#evaluateBoardWarnings(board, results, draft)`: R-07(정보) · R-08 C-1/C-2/C-3(원인·수치 `x.x:1`·대체안) · R-12(사업자정보 Footer 열 → "C의 Footer로 바꾸기", 없으면 "확정 시 같은 모양의 사업자정보 확장 변형으로 바꿉니다") · R-15(정보). 대비는 `draft.palette`(= 확정 color_tokens와 같은 derivePalette 결과)로 계산.
- `domain/boardInput.ts`: zod/mini — 대표색 `#RRGGBB`(대문자 정규화, AC-14), 폰트는 **활성 폰트만**(ADR-005 Q4: Pretendard), savePicks 입력(선택 행 id·문자열 id). `domain/fonts.ts`: 목록 3개, Noto 2종은 `enabled:false`·"라이선스 확인 중".
- 의존성: `zod@4.6.5` (`--save-exact`). 공통 청크 밖에서만 import.
- RED: 모듈 없음 → GREEN 19/19 (AC-11 문구·AC-12 계산·AC-13·AC-14).
- 해석: C-3 대체안에 밝은 카드 열이 없으면 SPEC은 "C-1 보정 제안"이지만, 흰 글자 기준으로 대표색을 어둡게 하면 어두운 잉크와의 C-3 대비가 더 나빠질 수 있어 **잉크 대비 4.5:1 보정**으로 계산(ADR-003 기능 우선).

## 항목 8 — 저장소·저장 직렬화·확정
- `data/compareBoardRepository.ts`: 인터페이스·`CompareBoardError(code, board?)`·`BoardLoad`·`StoredProfile` (공통 청크용, 구현 없음).
- `data/memoryCompareBoardRepository.ts`: `getBoard`(회수·삭제 열 선택 자동 해제 → 그 응답에만 `released`), `addReference`(비노출·없음 `unavailable`), `removeReference`, `savePicks`(zod → 열 소속 SCHEMA_INVALID·회수 LICENSE_BLOCKED·값 없음 UNSUPPORTED_COMBINATION → revision 불일치 STALE_BOARD + 최신 보드), `getComparison`(`libraryVersion` 하나로 해석), `confirmProfile`(v1 / 확정돼 있으면 새 버전), `createProfileVersion`(같은 계열 v2…, 기록 deep freeze), `getProfileVersions`. 지연 `delay({method, seq, phase: request|response})`·실패 `fail` 주입.
- `features/compare/picksSaver.ts`: 앞 요청이 끝난 뒤 최신 선택 한 번만 전송, STALE_BOARD면 최신 보드로 맞춤, 실패 시 `retry`. `domain/confirmGate.ts`: P-8 이유 문구.
- RED: 모듈 없음 → GREEN 19/19.
- **AC-23 RED ① 저장소 revision 검사 제거** → `× AC-23: 같은 revision으로 보낸 두 저장이 역순으로 도착해도 최종 보드는 늦게 요청한 B다` (`expected undefined to be 'STALE_BOARD'`) + STALE 테스트 실패, 2 failed → 복원 후 통과.
- **AC-23 RED ② 클라이언트 직렬화 제거**(`running ??=` → `running =`) → `× AC-23: 앞 저장 응답이 늦게 와도 …` (`expected [ 'save#1', 'save#2', 'save#3' ] to have a length of 2`) → 복원 후 통과.
- SPEC과 다르게: `getBoard()`가 `{ board, released }`를 돌려준다(자동 해제 안내를 한 번 보여주려면 해제 정보가 필요, S-08). `getProfileVersions` 추가(AC-25 검증·1a-04용). R-12 확정 시 사업자정보 없는 Footer는 `businessInfoVariant`로 바꿔 저장(SPEC 3.3 안내 문구의 실제 동작).

## 항목 9 — 트레이 통합 (트레이 = 보드의 열 목록)
- `CompareTrayContext`: 상태를 보드 하나로 바꿈. `add`는 지금 열로 한도·중복을 **동기** 판정해 `AddResult`를 바로 돌려주고(카탈로그·상세 알림 그대로), 저장소 `addReference`/`removeReference`는 순서대로 보내 마지막 응답만 반영. 진입 시 `getBoard`. 컨텍스트에 `board` 추가(03b용).
- `AppProviders`에 `boardRepository` prop, `main.tsx`는 `createDeferredCompareBoardRepository`로 메모리 구현·zod·비교 픽스처를 dynamic import(공통 청크 밖). `renderApp` 세 번째 인자.
- `COMPARE_LIMIT` = `BOARD_COLUMN_LIMIT`(열 문자 수) — 값 6 그대로, 문구 그대로.
- RED: `trayBoard.test.tsx` 4개 실패(보드 열이 트레이에 안 보임·저장소에 안 담김) → GREEN 4/4. **전체 228/228**(기존 115 포함, D07 포커스·6개 제한 테스트 통과).
- 번들: 공통 87.26 → 88.43KB(참고), `/catalog` 95.34 → **96.64KB**, `/references/:id` 94.79KB, 자리표시 88.87KB — 모두 ≤ 100KB. zod·검증 코드는 공통 청크에 없음(빌드 산출물 grep).
