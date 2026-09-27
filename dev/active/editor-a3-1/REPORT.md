# EDITOR-A3-1 REPORT — 섹션 구조 연산 (위로·아래로 · 삭제·되돌리기 · 추가 · 변형 교체 · 빈 슬롯 · 엔진 불변)

- 브리프 `docs/06-handoff/EDITOR-A3-1_BRIEF.md` · 기준 SPEC `docs/design/2a-05/SPEC.md` r4.6
- 브랜치 `k002bill2/editor-a3-1` · 시작 커밋 `e9d9976` (main) · 로컬 커밋만(push·병합 없음) · engine/ 쓰기 0 · 서브에이전트 0
- 최종 검증: 전체 vitest 3회 1395 passed ×3 (`logs/final-full-x3.txt`, 기준 1352 → +43) · typecheck·lint·build(번들) 통과 (`logs/fix1-green.txt`) · Codex `review --scope branch --base e9d9976` 1회 — "확실히 조치가 필요한 버그 없음" (`logs/codex-r1.txt`)

## 1. 커밋 표

| 단계 | RED | GREEN | 내용 |
|---|---|---|---|
| K0 | — | `d16b7bb`에 수신 기록 | 기준 build `logs/k0-build.txt` |
| K1 | `d16b7bb` | `3628492` | `features/studio/docPurpose.ts` — `docPurpose`(문서 버전 `adjustments.purpose ?? "none"`) · `docMotionPreset` |
| K2 | `88c6193` | `128da4a` | `docOps.ts`(runDocOp = 연산 + `normalizeDoc`, `docEngine` 동적 import, instanceId 카운터) · `undoStack.ts`(50 · 언마운트 비움) |
| K3 | `1cd6dd3` | `87de543` | 위로·아래로 같은 부품(`SectionOpControls`) — ≥1024 편집 패널 머리 · <1024 "섹션" 탭 선택 줄 옆 + "편집" 탭 |
| K4 | `e0bb6bb` | `18bac3f` | 삭제 · 알림 줄 "되돌리기"(`NoticeRegion` 형제 버튼) · 5.4 이유 + "프로필에서 목적 바꾸기" |
| K5 | `6c9fcb4` | `d100b81` | "섹션 추가" + `AddSectionDialog`(네이티브 `dialog`, 조작 뒤 lazy) |
| K6 | `f93e38f` | `110c9db` · `fd71331`(perf) | `VariantSwitch`(details) + `VariantOptions`(조작 뒤 lazy, diffSlots 캡션) |
| K7 | `53f36df` | `b480fa9` | 캔버스 빈 글자 슬롯 자리표시 · E-AC-23 불변 테스트 |
| 자체 점검 | `c7ed3f1` | `3e9acd2` | 프로필 조회 실패가 연산 사슬을 끊던 결함 → 연산 거부 + 다음 연산 재조회 |

게이트 로그: `logs/k{1..7}-{red,green}.txt` · `k6-perf.txt` · `fix1-{red,green}.txt` (표적 test + `src/test` 가드 + `engineImportGuard` + typecheck + lint + build). 커밋은 모두 `git commit -- <경로>`.
- 로그 위치 정정: K1~K3 RED/GREEN 로그(`k2-green`은 K3 RED 커밋)는 해당 커밋에 들어갔지만, **K4~K7·k6-perf·자체 점검(fix1) RED/GREEN 로그는 각 커밋이 아니라 `f4ade49`에 함께 커밋됨**(`git commit -- <디렉터리>`가 추적 전 새 파일을 담지 않음 — 이력은 다시 쓰지 않았다). RED 실패는 로그 내용과 각 RED 커밋의 테스트로 재현 가능.

## 2. AC 판정

| AC | 판정 | 근거 테스트 |
|---|---|---|
| E-AC-17 순서 | **PASS** | `components/studio/SectionMove.test.tsx` 4건 — 아래로 결과·알림 "About을 4번째로 옮겼습니다"·포커스 그대로 · 5.2 표 4행(+Hero·Header·Footer) `aria-disabled` + `toHaveAccessibleDescription(이유)` + 눌러도 불변 · 1024 2단 · 390 "섹션" 탭·"편집" 탭 같은 부품, 섹션 탭에서 옮겨도 탭·포커스 유지 |
| E-AC-18 추가 | **PASS** | `SectionAdd.test.tsx` 6건 — 첫 입력 포커스 · 유형 → 변형(이름표) → 추가 · 삽입 3규칙(선택 뒤 · 페이지 정보/Header → Hero 뒤 · Footer → Footer 앞) · 새 줄 선택·포커스 · 알림 · Header·Hero·Footer `aria-disabled` + 그룹 설명 이유 · 취소·Esc → 연 버튼 포커스 · 본문 9개 → 버튼 `aria-disabled` + 이유, 대화상자 없음 · 390 |
| E-AC-19 삭제 | **PASS** | `SectionRemove.test.tsx` 9건 — 즉시 삭제 · 알림 줄(status 글자 + 영역 밖 형제 버튼) · 되돌리기 → 같은 instanceId·입력 값·위치 + 선택·포커스 · 다음 연산(이동)·필드 입력 뒤 버튼 없음 · 5.4 표 Header·Footer·Hero · 목적 예약(문서 v2 조정) R-04 + 링크 `/profile/profile-1?v=2` · 목적 문의 R-03(둘 중 남은 하나만) · 본문 5개 막지 않음 · 390 "편집" 탭 삭제 → "섹션" 탭 전환 뒤 포커스 · 1024 접힌 details 펼친 뒤 포커스 |
| E-AC-20 변형 교체 | **PASS** | `SectionVariant.test.tsx` 3건 — 캡션 = 테스트가 엔진 `diffSlots`로 계산한 값과 일치(`aria-describedby`) · "슬롯 모두 유지" · 바로 적용 + 알림 "목록형으로 바꿨습니다 · 잃은 슬롯 M개(…)" · 포커스 라디오 · 되돌리기 → 원래 변형·입력 값 · 키(`cards-3`·`list`) 화면 0 · 목적 예약 R-04 거부(그룹 설명) |
| E-AC-23 엔진 불변 | **PASS** | `features/studio/engineInvariance.test.ts` — 동결 문서로 docOps 구조 연산 4종(7회) + setSlot·setMeta·swapTheme·normalizeDoc·diffSlots·diffSlotValues·runGate·hashDoc·can* 4종: 예외 0 · 입력 깊은 비교 동일 · 동결 유지 · instanceId 유지. 연산 어댑터 동등성 `docOps.test.ts` 6건 |
| E-AC-24 빈 슬롯 | **PARTIAL** | `EmptySlot.test.tsx` 2건 + `slotPlaceholder.test.ts` — 캔버스 자리표시 "제목을 입력하세요"(`text-label-alternative`) · 필수 오류는 blur 때만(`aria-invalid` + "필수 입력입니다"). **게이트 "글자 수" 줄 차단("Hero 제목이 비어 있습니다")은 a4 게이트 표시로 이관**(브리프·SPEC r4.6 A3-Q5) |
| 5.14 실행 취소 스택 | 부분(이 레인 몫 PASS) | `undoStack.test.ts` 4건 — 역순 · 50 상한(오래된 것부터) · clear · 언마운트 비움. 구조 연산 전부 기록. 일반 실행 취소 UI(E-20 · E-AC-32)·필드 확정 기록은 a4 |
| K1 목적 파생 | PASS | `docPurpose.test.ts` 3건 — 문서 v2(예약) vs 최신 v3(문의) → 예약 · 없음 → "none" · 모션 프리셋 파생 |

## 3. 번들 (gzip KB, 첫 화면 / 진입 직후 — `scripts/check-bundle-size.mjs`)

| 화면 | K0 기준 | K3 | K4 | K5 | K6 | K7 | 최종(3e9acd2) | 최종 − K0 |
|---|---|---|---|---|---|---|---|---|
| 공통 | 89.34 | 89.34 | 89.34 | 89.34 | 89.34 | 89.35 | 89.35 | +0.01 |
| /catalog | 99.64 / 102.03 | 99.65 / 102.03 | 99.64 / 102.02 | 99.64 / 102.02 | 99.64 / 102.03 | 99.65 / 102.03 | 99.65 / 102.03 | +0.01 / 0 |
| /references/:id | 96.99 / 99.38 | 96.99 / 99.38 | 96.99 / 99.37 | 96.99 / 99.37 | 96.99 / 99.38 | 97.00 / 99.38 | 97.00 / 99.38 | +0.01 / 0 |
| /compare · (조정 있음) | 98.75 / 121.39 | 98.76 / 121.40 | 98.75 / 121.39 | 98.75 / 121.39 | 98.75 / 121.39 | 98.76 / 121.40 | 98.76 / 121.40 | +0.01 / +0.01 |
| /profile | 99.61 / 123.64 | 99.61 / 123.65 | 99.60 / 123.64 | 99.60 / 123.64 | 99.60 / 123.64 | 99.61 / 123.65 | 99.61 / 123.65 | 0 / +0.01 |
| /projects | 94.00 / 107.04 | 94.00 / 107.06 | 93.99 / 107.05 | 94.00 / 107.06 | 94.00 / 107.07 | 94.00 / 107.06 | 94.00 / 107.06 | 0 / +0.02 |
| **/studio/:projectId** | 91.64 / 118.88 | 91.65 / 121.34 | 91.64 / 121.75 | 91.65 / 122.14 | 91.64 / 122.63 | 91.65 / 122.68 | **91.64 / 122.77** | 0 / **+3.89** |
| /studio 조작 뒤 docEngine | — | +1.44 | +1.44 | +1.44 | +1.57 | +1.45 | +1.45 | 예산 밖 |
| /studio 조작 뒤 AddSectionDialog | — | — | — | +1.16 | +1.17 | +1.17 | +1.17 | 예산 밖 |
| /studio 조작 뒤 VariantOptions | — | — | — | — | +1.12 | +1.04 | +1.04 | 예산 밖 |

- 판정: `/studio` 첫 91.64 ≤ 99.40 · 진입 122.77 ≤ 124.70(여유 1.93) · 그 밖 화면·공통 ±0.03 이내(최대 /projects 진입 +0.02) · 멈춤선 0.3 아래 화면 0(최소 여유 /catalog 첫 0.35 — K0 0.36).
- /studio 진입 +3.89 내역: StudioLayout 청크(연산 훅 · 순서·삭제 부품 · 알림 줄 · 포커스 · 추가 버튼 · 변형 머리 · 문장) + 공유 청크의 `rules`·`reasons`(렌더 때 비활성 이유가 필요 — 정적). 변이 연산(sectionOps·normalize·diff) · 대화상자 · 변형 목록은 조작 뒤 청크.
- /projects 진입 +0.02~0.04 원인(L1, manifest 비교): `memoryProjectRepository` 청크의 `memoryDocBook` preload 목록(`__vite__mapDeps`)에 공유 청크 이름이 늘어남(sectionOps가 docEngine과 공유되며 분리). K6에서 +0.04(빌드마다 해시 이름 길이로 ±0.01 흔들림)까지 가서 `fd71331`로 diff 청크를 연산 청크에 묶어 +0.02로 낮춤.
- 조작 뒤 분류(스크립트 `STUDIO_AFTER_ACTION` 등록 + 호출 지점 주석): docEngine ← 연산 onClick · AddSectionDialog ← "섹션 추가" onClick(adding 상태) · VariantOptions ← "변형 바꾸기" details 펼침.

## 4. SPEC 차이 · 해석 (ADR-003 — 한 줄씩)

1. **브리프 "화면에서 engine 값 import 금지"와 차이**: 비활성 이유(`aria-disabled` + 문장)는 렌더 때 `canMove·canRemove·canAdd·canSwapVariant`가 필요해 `rules`·`reasons`·`registry`를 편집 틀 청크(진입 직후)에 정적 import했다 — 화면 부품은 `features/studio/opPermissions.ts`·`sectionCatalog.ts`·`variantChoices.ts`를 거치고, 변이 연산만 `docOps`가 동적 import. (a2의 EditFields·StructureCanvas도 registry·slotOps를 이미 정적 사용 — 가드 `engineImportGuard` 허용 범위 안.)
2. **"N번째" 해석**: 섹션 줄 번호 = Header 포함 문서 순서 index + 1(SPEC 예문 "Services를 4번째로" = header·hero·about·services와 일치).
3. **조사 선택(유추)**: 영어 이름 중 받침 발음 About·Pricing만 "을", 나머지 "를". 변형 이름표는 한글 받침으로 "으로/로", 빈 슬롯 자리표시는 "을/를"(예문은 "제목을" 하나).
4. **유추 문장**: 변형 교체 되돌리기 알림 "카드 3개로 되돌렸습니다"(5.4 "…를 되돌렸습니다" 문형) · 잃은 슬롯 0개 교체 알림은 앞 문장만("목록형으로 바꿨습니다") · 프로필 조회 실패 연산 거부 "프로필을 불러오지 못해 목적을 확인할 수 없습니다 — 다시 시도해 주세요".
5. **변형 교체 되돌리기 포커스** = 되살린 섹션 줄(6.4 "알림 줄 되돌리기 → 되살린 섹션 줄"을 교체에도 적용) — <1024에서는 "섹션" 탭으로 바뀐다.
6. **섹션 추가 대화상자 구조 썸네일 생략**(5.3 "구조 썸네일 `aria-hidden`") — 변형은 이름표만. 장식이라 기능·접근성 영향 0, 조작 뒤 청크 크기 절약. 필요하면 a4·후속.
7. **비활성 라디오 = `disabled` + `aria-disabled`**(대화상자 유형 · 변형 교체) — 6.5 "roving에서 건너뛰고 이유는 그룹 설명" 을 네이티브 `disabled`로, AC 표현(`aria-disabled`)도 같이 둔다. 버튼(위로·아래로·삭제·섹션 추가)은 `aria-disabled` + 클릭 가드(포커스 유지).
8. **목적 로딩 중 렌더**: 프로필을 받기 전 이유 표시는 "none" 기준으로 그리지만, 연산은 프로필 조회를 기다려 실제 목적으로 판정한다(엔진이 막으면 이유 문장을 알림으로). 편집기를 오류 경계로 보내지 않는다(저장·필드 편집 계속).
9. **E-AC-24 게이트 줄 차단**은 a4(게이트 8줄 표시와 함께) — 이 레인은 캔버스·필드 수준.
10. **테스트 셋업**: jsdom 30에 `HTMLDialogElement.showModal·close`가 없어(실측) `src/test/setup.ts`에 테스트 전용 대체(열림 속성·close 이벤트만, inert 흉내 없음). `StudioLayout.test`의 `draw()`에 `ProfileRepositoryProvider`(프로필 없음 스텁)를 씌움 — 단언 변경 0.

## 5. 남은 위험 · 후속

- **실제 브라우저 확인 안 함**(이 레인 범위 밖 — 브리프 K8에 없음): 포커스 이동(닫힌 details 펼침 · hidden 탭 전환 · 줄이 옮겨질 때 버튼 포커스 복원)과 네이티브 `dialog` 모달(바깥 inert · Esc)은 jsdom 단언이다. QA 레인에서 1280·1024·390 ego-browser 확인 권장.
- `/studio` 진입 여유 1.93KB — A3-2(테마 대화상자·이미지 고르기 = 조작 뒤) · a4(게이트 표시 = 첫 화면/진입)가 나눠 쓴다.
- `/projects` 진입 +0.02 — 공유 청크 수에 민감(preload 목록). 다음 레인이 sectionOps를 다른 곳에서 쓰면 다시 늘 수 있다.
- 엔진 레인(ENGINE-VARIANTS) 병합 전: 새 변형 3개는 레지스트리 순회라 코드 변경 없이 추가·교체 목록에 나타난다(하드코딩 0). 병합 뒤 VariantSwitch·대화상자 목록 테스트는 변형 개수를 단언하지 않아 영향 없음.
- 실행 취소 스택은 구조 연산만 쌓는다 — 필드 확정(blur) 기록·Ctrl/⌘+Z·"더보기"는 a4(E-20).

## 6. Codex

- `node codex-companion.mjs review --scope branch --base e9d997616a93693ce96519165590af77c70c9c04` 1회(대상 b480fa9까지): "검토한 변경 사항에서 확실히 조치가 필요한 버그를 찾지 못했습니다." — Codex 샌드박스는 읽기 전용이라 Vite 임시 파일을 못 만들어 테스트 실행은 못 함(자체 로그 3회로 대신). 이후 자체 점검 수정 1건(`c7ed3f1`→`3e9acd2`)은 Codex 라운드 밖.
