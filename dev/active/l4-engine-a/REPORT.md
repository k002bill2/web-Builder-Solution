# L4a 엔진 계약 — REPORT

작성: Developer · 2026-09-26 · 브리프 `docs/06-handoff/L4A-ENGINE_DEVELOPER_BRIEF.md` · 브랜치 `k002bill2/l4-engine-a` · 기준 `dfd924f`

## 1. 커밋

| 커밋 | 내용 |
|---|---|
| `82531dd` | 계약 타입 `engine/contracts/` · 섹션 레지스트리 `engine/sections/` (12 type) |
| `de3b685` | `hashDoc` (키 정렬 정규 JSON + FNV-1a 64) |
| `62c5d68` | 검증 `validatePageDoc` · `validateProjectName` |
| `21a4fe4` | 문서 연산 `engine/ops/` |
| `0211e71` | 엔진 import 가드 · statistics 변형 키 `stats-3` · 검증 기록 |
| (이 REPORT 커밋) | REPORT · Codex 결과 |

로컬 커밋만. push·원격·main 병합 없음. 모든 커밋 `git commit -- <경로>`.

## 2. RED / GREEN (원문: `tdd-log.txt`)

| 절 | RED | GREEN |
|---|---|---|
| 1 레지스트리 | 모듈 없음(`./registry` resolve 실패) | 17/17 |
| 2 hashDoc | 모듈 없음(`./hash`) | 누적 26/26 |
| 3 검증 | 모듈 없음(`./validatePageDoc`·`./validateProjectName`) | 누적 67/67 |
| 4 연산 | 모듈 없음(`./diff`·`./reasons`) — 4 파일 실패 | 누적 123/123 |
| 5 번들 가드 | 탐지 함수를 잠시 끔(`return false`) → 탐지기 자체 검사 1 실패 | 원복 → 2/2, 누적 125/125 |

- 타입 전용 파일(`contracts/`)은 테스트 대상 코드가 없어 RED 단계 대신 `tsc --noEmit` 통과로 확인했다.
- 입력 불변: 모든 연산 테스트의 입력은 `deepFreeze` 문서(`testing/sampleDoc.ts`) — ESM strict 모드라 바꾸면 throw.

## 3. 파일 (`app/src/engine/`, 31개 · 1990줄 · engine 밖 제품 코드 변경 0)

| 폴더 | 파일 | 역할 |
|---|---|---|
| `contracts/` | `pageDoc.ts` | PageDoc · SectionInstance · SlotValue(글자 / 이미지 `enabled`·`source`·`alt`·`decorative`) · ImageSource(`placeholder` \| `local` id — URL 문자열 없음) · SECTION_TYPES 12 |
| | `sectionDefinition.ts` | SlotSchemaEntry(`key`·`label`·`kind`·`maxLength`·`recommendedLength?`·`required`·`defaultText?`) · SectionDefinition · SectionTypeInfo |
| | `records.ts` | Snapshot(kind별 판별 유니온, `reason`은 auto만) · GateReport(8줄 고정 순서 `GATE_ROWS`) · ExportJob |
| | `pending.ts` | L4b 자리(타입만): `CreateDocFromCandidate` · `RunGate` · `GateTheme`(`import type` ProfileVersion) |
| `sections/` | `registry.ts` · `boundSections.ts` · `bodySections.ts` · `slots.ts` · `defaults.ts` | 레지스트리 · header/hero/footer(sectionLibrary 파생) · 본문 9 type · 슬롯 조립 · 기본 슬롯 콘텐츠 |
| `validate/` | `reader.ts` · `validatePageDoc.ts` · `validateProjectName.ts` | zod 없는 경계 검증 |
| `ops/` | `sectionOps.ts` · `slotOps.ts` · `rules.ts` · `reasons.ts` · `diff.ts` · `normalize.ts` · `hash.ts` · `errors.ts` | 순수 연산 |
| (루트) | `freeze.ts` · `engineImportGuard.test.ts` · `testing/sampleDoc.ts` | 동결 · 번들 가드 · 테스트 문서 |

- `freeze.ts`는 `data/studioStore.ts`의 `deepFreeze`와 같은 동작이다. 엔진이 data 계층을 import하지 않도록 따로 두었다(engine 밖 수정 금지라 공용 위치로 옮기지 않음).
- 엔진이 engine 밖에서 가져오는 것: `domain/sectionLibrary`(값 — 변형 키·이름표·사업자정보 파생), `domain/compareBoard`·`domain/reference`·`domain/profile`(`import type`만).

## 4. SPEC 8.1 · 8.2 대응

### 8.1 필드

| 대상 | 상태 | 위치 · 비고 |
|---|---|---|
| Project · Project 요약 | 제외 | 저장소(`ProjectRepository`) 레인 |
| PageDoc | 구현 | `contracts/pageDoc.ts` — 8.1 필드 그대로 |
| 섹션 인스턴스 | 구현 + 1 | `instanceId`·`type`·`variant`·`motion`·`slots` + **`tone`**(R-05, 개정 요청 ①) |
| 슬롯 값 | 구현 | 글자 = 문자열, 이미지 = `{kind:"image", enabled, source, alt, decorative}` |
| 슬롯 스키마 | 구현 | `recommendedLength`(8.1 요청대로 추가) · `defaultText`(TRD 6.2 기본 슬롯 콘텐츠) |
| 섹션 정의 | 구현 | 이름표·한 줄 설명(`SectionTypeInfo`) · `a11y.headingLevel` · `hasBusinessInfo` · `reservation` |
| 테마(프로필 버전) | 자리만 | `GateTheme`가 `ProfileVersion`을 `import type` — 적용 값 계산은 L4b |
| Snapshot · GateReport · ExportJob | 모양만 | `contracts/records.ts` |

### 8.2 연산

| 연산 | 상태 | 시그니처 · 비고 |
|---|---|---|
| `createDocFromCandidate` | 제외 | 타입 자리 `CreateDocFromCandidate` |
| `addSection` | 구현 | `(doc, type, variant, afterInstanceId \| null, { instanceId, motionPreset })` → `{ doc, instanceId, index }`. id는 주입(결정성), 모션 = min(프리셋, L1, 정의 상한), 자리 = 5.3 규칙 |
| `removeSection` | 구현 | → `{ doc, undo: { section, index } }` + **`restoreSection(doc, undo)`**(되돌리기) |
| `moveSection` | 구현 | → `{ doc, index }`(0부터, 문서 전체 기준) |
| `swapVariant` | 구현 | → `{ doc, lostSlotKeys }` — `diffSlots`와 같은 판정(교차 테스트) |
| `setSlot` · `setMeta` | 구현 | 상한 초과·빈 값 허용(5.6 "입력은 막지 않는다"), 스키마 밖 키·종류 불일치는 오류 |
| `swapTheme` | 구현 | 프로필 버전만 바뀜 — `diffSlotValues` 0건 테스트 |
| `canAdd` · `canRemove` · `canMove` | 구현 | `{ok:true} \| {ok:false, reason}`. `canAdd(doc, type?)` — 유형을 주면 header·hero·footer 중복도 본다 |
| `diffSlots` · `diffSlotValues` | 구현 | `{kept, lost, added}` 항목(키+이름표) · `{compared, changed[]}` |
| `runGate` | 제외 | 타입 자리 `RunGate` |
| `normalizeDoc` | 부분 | R-05 인접 톤만(멱등, 슬롯·순서 불변). 풀블리드 연속 ≤2는 설계 질문 Q-1 |
| `hashDoc` | 구현 | 동기 · `fnv1a64:<16진 16자>` · `hash`·`revision`·`updatedAt` 제외 |
| `defaultProjectName` | 해당 없음 | 화면 레인 |

- 연산 오류: `EngineOpError(code)` — `NOT_FOUND`·`NOT_ALLOWED`·`UNKNOWN_VARIANT`·`BAD_ID`·`UNKNOWN_SLOT`·`SLOT_KIND`·`BAD_VALUE`. 막힌 조작은 `rules.ts`의 같은 함수로 판정한다(규칙 한 곳). `removeSection`은 구조 규칙(Header·Hero·Footer)만 막고, 목적 규칙(R-03·R-04)은 화면이 `canRemove(doc, id, purpose)`로 먼저 막는다.
- 연산은 `revision`·`updatedAt`·`hash`를 바꾸지 않는다(저장소 몫 — `Date.now` 0).

### 이유 문장 (`ops/reasons.ts`, `reasons.test.ts`가 SPEC 원문과 따옴표 포함 대조)

| 키 | 문장 | 출처 |
|---|---|---|
| addBodyLimit | 본문 섹션은 9개까지입니다 (R-01) — 하나를 지우면 추가할 수 있습니다 | E-S12 |
| addFooterOnce | Footer는 하나만 둘 수 있습니다 | 5.3 |
| addHeaderOnce · addHeroOnce | Header는 / Hero는 하나만 둘 수 있습니다 | **유추**(5.3 "Hero도 같음") |
| moveAboveHero · moveHero · moveHeader · moveFooter · moveBelowFooter | 5.2 표 따옴표 안 글자 그대로 | 5.2 — Header·Footer 행의 "(R-01)"은 따옴표 밖이라 넣지 않음(Q-4) |
| moveAboveHeader | Header 위로는 옮길 수 없습니다 | **유추**(Hero 없는 문서의 첫 본문) |
| removeHeader · removeHero · removeBooking · removeInquiry | 5.4 표 그대로 | 5.4 |
| removeFooter | Footer는 페이지에 꼭 하나 있어야 합니다 (R-01) | **유추**(5.4 "Header · Footer" 행은 Header 문장만) |

## 5. TRD 4.4와 다른 점 (개정 요청)

### SectionDefinition에서 뺀 필드 (렌더·카탈로그 전용)

| TRD 4.4 필드 | 엔진 | 이유 |
|---|---|---|
| `render` | 제외 | 렌더러(L4b 이후) — 계약은 데이터만 |
| `provenance.author` · `createdAt` · `abstractPatternIds` | 제외 | 카탈로그 출처 기록 — 편집 연산이 읽지 않음 |
| `tokens` | 제외 | codegen·렌더 몫 |
| `supportedBreakpoints` | 제외 | 렌더 몫 |
| `constraints.mobile` | 제외 | 렌더 몫 |
| `constraints.moods` | 제외 | 무드 테마 M2 |
| `constraints.minContrast` | 제외 | 게이트 대비는 프로필 C-1~C-5(SPEC 5.12) — L4b |

### 바꾸거나 더한 것

| # | 내용 |
|---|---|
| ① | 섹션 인스턴스 `tone: "base" \| "alt"` — R-05 보정 대상. 엔진만 쓴다(사용자 편집 아님). SPEC 8.1에 없음 |
| ② | `SlotSchemaEntry.recommendedLength`(SPEC 8.3 TRD 개정 ④와 같음) · `defaultText`(TRD 6.2 기본 슬롯 콘텐츠) |
| ③ | `slots`: zod 스키마 → 순서 있는 `SlotSchemaEntry[]`(Q-P2=A, zod 미도입) |
| ④ | `a11y.headingLevel`에 `null`(헤딩 없는 header·footer) |
| ⑤ | `constraints.fullBleed`(R-05 풀블리드 연속 판정용) · `hasBusinessInfo`(R-12) · `reservation`(R-04) |

## 6. 번들 전후 (`bundle-before.txt` · `bundle-after.txt`)

- 1차 빌드에서 차이 발견: CSS 43.13→43.15 kB, 모든 청크 해시 변경, `/profile` 진입 직후 124.57→124.55(−0.02). 원인 실측: engine을 잠시 옮겨 두고 빌드한 CSS와 비교 → `.row-3{grid-row:3}` 한 줄. Tailwind 4 자동 소스 감지가 statistics 변형 키 `"row-3"`를 유틸리티 클래스로 읽었다.
- 조치: 변형 키를 `stats-3`로 바꿈. 재빌드 결과 **`[bundle]` 줄 전부 동일 · 자산 목록(파일 해시 포함) 동일** — 모든 시나리오 변화 0.

| 시나리오 | 첫 화면 전 → 후 | 진입 직후 전 → 후 |
|---|---|---|
| 공통 JS | 89.06 → 89.06 | — |
| /catalog | 99.37 → 99.37 | 101.75 → 101.75 |
| /references/:id | 96.71 → 96.71 | 99.10 → 99.10 |
| /compare | 99.60 → 99.60 | 124.60 → 124.60 |
| /compare (조정 있음) | 99.60 → 99.60 | 124.60 → 124.60 |
| /profile | 99.24 → 99.24 | 124.57 → 124.57 |
| /studio (자리표시) | 89.51 → 89.51 | 91.89 → 91.89 |

- 재발 위험: engine 문자열이 Tailwind 유틸리티 이름과 겹치면 import 0이어도 CSS가 바뀐다 → 설계 질문 Q-6.

## 7. 검증 (fresh 실행, `verify-*.txt`)

| 항목 | 결과 |
|---|---|
| typecheck | exit 0 |
| lint | exit 0 |
| 전체 테스트 **1회** | 73 파일 · 826 통과 · 실패 0 (14.1초) |
| build | exit 0 (번들 스크립트 포함) |
| engine 테스트 3회 | 9 파일 · 125 통과 × 3 |
| 엔진 import 가드 | engine 밖 비테스트 파일 중 engine import 0 |

## 8. Codex 리뷰

(아래 9절 뒤에 결과 기록)

## 9. 설계 질문 (추측하지 않은 결정)

| # | 질문 | 지금 구현 |
|---|---|---|
| Q-1 | R-05 "풀블리드 연속 ≤2"의 자동 보정 방식(변형 교체? 레이아웃 필드?)이 문서에 없다 | 톤 교대만. `constraints.fullBleed`로 판정 재료만 둠 |
| Q-2 | 인스턴스 `tone` 필드를 SPEC 8.1에 넣을지 · header·footer도 교대 대상인지 | 넣음 · 문서 전체 교대 |
| Q-3 | 유추 문장 4개(4절 표) 승인. 그리고 E-S14 예시 "사업자정보가 있는 Footer가 필요합니다 (R-12)"는 어느 조작에 붙는가(Footer는 늘 삭제 불가라 삭제 이유로 쓰일 자리가 없다 — 변형 교체 경고? 게이트?) | 유추 4개 사용 · R-12 문장은 미사용 |
| Q-4 | 5.2 Header·Footer 이동 이유에 "(R-01)"을 붙일지(따옴표 밖) | 붙이지 않음 |
| Q-5 | 유형 이름(`name`)을 SPEC 문장 표기("Hero"·"Services"·"FAQ") 그대로 둘지, 한국어 이름표로 바꿀지(변형·슬롯 이름표는 한국어) | SPEC 문장 표기 |
| Q-6 | Tailwind가 engine/ 소스를 스캔한다 — `index.css`에 `@source not "./engine"` 추가(engine 밖 수정이라 이번엔 안 함) 또는 레지스트리 문자열 가드 테스트 중 무엇으로 막을지 | 키 이름만 바꿈 |
| Q-7 | `hashDoc` 대상에서 `revision`·`updatedAt` 제외가 TRD `doc_hash` 정의와 맞는지 | 제외(내용 해시) |
| Q-8 | 기본 이미지 슬롯 `alt: ""` → 섹션 추가 직후 게이트 R-09 차단. 기본을 장식(`decorative: true`)으로 둘지 | 빈 대체텍스트 · 장식 아님 |
| Q-9 | `moveSection`·`addSection`의 `index`는 문서 전체 0부터 — 알림 "4번째"의 기준(header 포함?)은 화면 레인에서 정함 | 0부터 전체 |
| Q-10 | `validatePageDoc`은 `hash` 형식만 보고 `hash === hashDoc(value)` 일치는 저장소(`saveDoc`) 몫으로 둠 — 맞는지 | 형식만 |
