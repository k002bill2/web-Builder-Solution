# EDITOR-A2-FIELDS REPORT (A2-F 필드·저장 레인)

- 브랜치 `k002bill2/editor-a2-fields` · base main `f22bbc8` · 메인 단독(서브에이전트 0) · 로컬 커밋만(push·병합·삭제 0)
- 화면 연결 0 — `pages/StudioPage.tsx`·S 소유 파일 쓰기 0. 부품·훅만(연결은 S 병합 뒤 별도 커밋)

## 1. 커밋
| 체크포인트 | SHA | 내용 |
|---|---|---|
| F0 | `6fc518c` | base build 실측 `logs/base-build.txt` · PROGRESS 수신 |
| F1 | `d0a3a9d` | `features/studio/fieldCounter.ts` + `components/studio/FieldEditor.tsx` (+ 테스트) |
| F2 | `e7b701d` | `features/studio/useDocSave.ts` (+ 테스트) |
| F3 | `f301aab` | `components/studio/SaveStatus.tsx` (+ 테스트) |
| F4 | `f2630e0` | `components/studio/ConflictCallout.tsx` · `useDocSave.resolve` · `useAutosaveScheduler.settle()` (+ 테스트) |
| F5·F6 | `f51c2e6` | `components/studio/PageInfoFields.tsx` (+ 테스트) · F5는 재사용(새 파일 없음) |

## 2. AC별 판정
| AC | 판정 | 근거(테스트) |
|---|---|---|
| E-AC-06 필드 | PASS | `FieldEditor.test.tsx` 7 · `fieldCounter.test.ts` 5 — 카운터 describedby·라이브 영역 밖 · 권장 경고 · 상한 `aria-invalid`+R-13 문장 · 상한+10 입력(55타 → 50) · 캔버스 문장 id 맨 앞 · 필수 blur |
| E-AC-07 자동 저장 | PASS | `useDocSave.test.tsx` 타이밍 4 + 실제 메모리 저장소 연속 2회(revision 3) |
| E-AC-08 저장 상태 | PASS | `SaveStatus.test.tsx` — 전이 3단계 · "이 탭에 저장됨 · 12초 전" · 라이브 영역 밖 · onAnnounce 0회 |
| E-AC-09 실패·오프라인 | PASS | `SaveStatus.test.tsx` — alert 1회(같은 텍스트 노드 유지) · 입력 유지 · "다시 저장" → "다시 저장했습니다" · offline 글자 → online 저장 1회 |
| E-AC-10 충돌 | PARTIAL | 화면·훅 PASS(목 저장소: 내 편집 유지 · Callout+두 버튼 · 고르기 전 저장 0 · mine = resolveConflict 1회·추가 저장 0 · theirs = 최신 표시·내 문서 저장 0 · 해결 거부 시 STALE 유지). **BLOCKED: 스냅샷(auto·conflict) 1개** — 메모리 `resolveConflict`·`createSnapshot` = `missing`(`data/memoryProjectRepository.ts:99-101`), 스냅샷은 a4(SPEC 13.1 a4 행 "스냅샷 목록·미리보기·복원", 초안 2절 제외 목록). 브리프대로 새로 만들지 않음 |
| E-AC-12 떠나기 | PASS(재사용) | 기존 `useAutosaveScheduler.hook.test.tsx:30`(memory 늘·server idle 미등록·변경 등록) + 추가 `useDocSave.test.tsx`(server 실패·STALE 등록) |
| 페이지 정보(F6) | PASS | `PageInfoFields.test.tsx` 4 — 제목/설명·(필수)·60/160 경계 = `seoIssues` · canonical 캡션 |

## 2.1 전체 검증
- 전체 vitest 1회 `logs/full-vitest.txt`: Test Files 117 passed · Tests 1308 passed · exit 0 (실패 0)
- 체크포인트마다 `npm run lint` 0건 · `npm run build`(tsc + vite + 번들 판정) exit 0 — `logs/f{1,2,3,4,6}-build.txt`

## 3. RED → GREEN 로그 (`dev/active/editor-a2-fields/logs/`)
| 단계 | RED | GREEN |
|---|---|---|
| F1 | `f1-red.txt`(모듈 없음) | `f1-green.txt` 18/18 |
| F2 | `f2-red.txt`(모듈 없음) | `f2-green.txt` 7/7 |
| F3 | `f3-red.txt`(모듈 없음) | `f3-green.txt` 5/5 |
| F4 | `f4-red.txt`(5 실패: settle 2 · resolve 3 · Callout 모듈 없음) | `f4-green.txt` 73/73 |
| F6 | `f6-red.txt`(모듈 없음) | `f6-green.txt` 83/83 |
- 기존 테스트 단언 수정 0. `useAutosaveScheduler.test.ts`는 describe 추가만. `SaveStatus.test.tsx` 목 저장소에 `resolveConflict` 필드 추가(F4 인터페이스 확장에 따른 타입 맞춤).

## 4. 번들 (gzip KB, 체크포인트마다 `npm run build` exit 0)
| 시점 | /catalog 첫/진입 | /references | /compare | /profile | /projects | /studio | 공통 |
|---|---|---|---|---|---|---|---|
| base f22bbc8 | 99.65 / 102.03 | 96.99 / 99.38 | 98.75 / 121.39 | 99.60 / 124.69 | 93.97 / 106.99 | 90.73 / 104.33 | 89.34 |
| F1~F6 | 99.64 / 102.03 | 96.99 / 99.38 | 98.74 / 121.38 | 99.60 / 124.70 | 93.97 / 106.99 | 90.73 / 104.33 | 89.34 |
- 새 파일은 어디서도 import하지 않아 청크 변화 0. ±0.01은 CSS 파일명 해시(새 Tailwind 유틸리티 → `index-*.css` 9.07 → 9.11KB gzip)가 JS 안 문자열로 바뀐 것. **/profile 진입 여유 0.30 = 멈춤선(0.3 미만) 바로 위** — 연결 커밋 때 재실측 필요.

## 5. 결정·차이 (SPEC·목업)
- 상한·권장 동시 초과 = block 문장 하나만(R-13).
- SaveStatus는 자체 `role=status`를 만들지 않는다(E-AC-33 편집 알림 1개 = S 소유) → 오프라인·회복 문장은 `onAnnounce` 콜백. `role=alert`(6.3 "저장 실패" 행, STALE 문장 포함)는 SaveStatus 1곳 — ConflictCallout은 정적(DS Callout A-9).
- ConflictCallout 제목 "다른 곳에서 이 문서가 바뀌었습니다(r12)" — revision은 prop(`latestRevision`), 모르면 표기 없음. tone cautionary → DS `warning`.
- 스케줄러 `settle()` 추가 사유: 기존 `resume()`은 미저장 변경을 즉시 저장해 "다른 편집 불러오기" 뒤 내 문서를 덮어쓰고 "내 편집으로 저장" 뒤 한 번 더 저장함.
- 유추 문장: 페이지 정보 권장 초과 "권장 N자 — 넘으면 검색 결과에서 잘릴 수 있습니다"(SPEC 문장 없음) · canonical 라벨 "대표 주소(canonical)".

## 6. 남은 위험
- HTML `maxLength`(UTF-16 단위) vs 카운터(코드 포인트): 이모지 등은 상한+10보다 일찍 입력이 멈춘다.
- `DocSaveRepository.resolveConflict`는 `PageDoc`을 돌려받는다고 가정 — 메모리 저장소 타입은 `ProjectRepository<DocHead>`라 연결 때 캐스트/제네릭 정리 필요(`useDocSave.test.tsx` 실제 저장소 테스트도 `as unknown as ProjectRepository<PageDoc>`).
- 연결 전이라 엔진(`hashDoc`·`gateText`) 런타임 import가 `/studio` 진입 청크에 들 크기는 미측정(S-B4 예상 범위).
- 브라우저 확인 없음(4339 서버 미기동 — 화면 연결 전이라 볼 화면 없음, 긴 클릭 흐름은 병합 뒤 QA 몫).
