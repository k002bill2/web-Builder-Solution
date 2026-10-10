# GEN-MARK-IMPL REPORT — B-M3P-03 생성 조합 표식·카드 출처 줄

- 브랜치 `k002bill2/gen-mark-impl` · base `b3f8894` · 정본 `docs/design/gen-mark/SPEC.md` r1 · MQ-GM-1~4 A
- 결론: 수용 기준 15건 중 14건 통과. GM-AC-G2는 부분 통과입니다 — `/profile` 첫 화면이 99.87에서 99.89(+0.02)로 늘어 브리프의 "변화 0"을 지키지 못했습니다(아래 3절, 사용자 수용 필요).

## 1. 수용 기준별 결과

| ID | 결과 | 근거 |
|---|---|---|
| GM-AC-U1 | ✅ | `ReferenceCard.test.tsx` "GM-AC-U1·U2" — '생성 조합' aria-hidden·role=img 조상 0 (기존 M3P-AC-U5 테스트도 유지·통과) |
| GM-AC-U2 | ✅ | 같은 테스트 — 라이선스·생성 조합 Tag가 썸네일 컨테이너 자손 0 · 카드 안 `absolute` 조상 0 |
| GM-AC-U3 | ✅ | "GM-AC-U3" — sr-only "라이선스" 형제 + `internal`/`licensed`, aria-hidden 조상 0. 기존 181행 단언을 `not.toBeNull()` → `toBeNull()`로 뒤집음(SPEC 명시) |
| GM-AC-U4 | ✅ | "GM-AC-U4" — 큐레이션 카드 생성 조합 0 · 라이선스 1개 |
| GM-AC-U5 | ✅ | `ReferenceDetailPage.test.tsx` "GM-AC-U5·U7" — h1 → 접두 → 라이선스 → 생성 조합 → T3 1회 |
| GM-AC-U6 | ✅ | "GM-AC-U6" — 큐레이션 상세 생성 조합 0 · T3 0 |
| GM-AC-U7 | ✅ | 카드·상세 모두 `SourceTags` 한 부품, DOM 순서 단언 |
| GM-AC-U8 | ✅ | `keyboardA11y.test.tsx` 통과(표식 = span, 포커스 대상 0) |
| GM-AC-G1 | ✅ | `git diff --stat b3f8894 -- referenceDisplay.ts Tag.tsx package-lock.json engine/` 출력 0줄. SourceTags는 CatalogPage·ReferenceDetailPage만 import → `/profile`·`/studio` 정적 closure 0 |
| GM-AC-G2 | ⚠️ 부분 통과 | `/catalog` 100.32 ≤ 100.90 · `/references/:id` 97.76 ≤ 100 · `/studio` 진입 129.28 그대로 → 통과. `/profile` 첫 화면 99.87 → **99.89**(+0.02, 한도 100 안) — 브리프의 "변화 0" 미충족(3절) |
| GM-AC-G3 | ✅ | `noHardcodedStyle.test.ts` 포함 전체 vitest 통과 |
| GM-AC-E1 | ✅ | 390·1024·1280 생성 카드: Tag 2개 모두 `top ≥ thumb.bottom`, 썸네일과 교차 면적 0 (4절) |
| GM-AC-E2 | ✅ | 1280: Tag 2개 top 253.2 동일(1줄) · 같은 행 카드 높이 385.2 ×3 동일 (1024: 409.9 ×2) |
| GM-AC-E3 | ✅ | 생성 상세 1280·390: h1 옆 Tag 2개 + 설명 1회 · 큐레이션 상세: 생성 조합 0 · 설명 0 |
| GM-AC-E4 | ✅ | 카드 제목 클릭 → `/references/gen-beauty-1`: 같은 문구, 같은 순서(internal → 생성 조합) |

## 2. 변경 파일
- `app/src/components/catalog/SourceTags.tsx`(새): sr-only "라이선스 " + 라이선스 Tag(`LICENSE_TONE` import만) + 생성 조합 Tag(`library_composition`일 때만).
- `app/src/components/catalog/ReferenceCard.tsx`: 썸네일 안 aria-hidden 라이선스 Tag 제거 · article 기준 absolute 받침 제거(article `relative`도 제거) · 썸네일 아래 `<SourceTags>` · Thumbnail 주석 갱신.
- `app/src/pages/ReferenceDetailPage.tsx`: `DetailHeader` Tag → `<SourceTags>` · 생성 조합일 때 메타 아래 T3 한 줄(`ds-caption1 text-label-alternative`).
- `app/src/components/catalog/ReferenceCard.test.tsx`(181행 뒤집기 + 썸네일 밖 단언 1줄 + 4건) · `app/src/pages/ReferenceDetailPage.test.tsx`(2건).
- `docs/06-handoff/BACKLOG.md`: B-M3P-03 행만 수정. `dev/active/gen-mark-impl/{BRIEF,PROGRESS,REPORT}.md` · `shots/`.

## 3. 예산 실측 (gzip KB · `npm run build` · base는 같은 머신에서 `b3f8894` 재빌드)

| 라우트 | base 첫 화면 | head 첫 화면 | base 진입 | head 진입 |
|---|---|---|---|---|
| /catalog | 100.07 | 100.32 (멈춤선 100.90, 여유 0.58) | 102.41 | 102.65 |
| /references/:id | 97.32 | 97.76 | 99.66 | 100.09 |
| /compare | 98.89 | 98.91 | 122.70 | 122.72 |
| /profile | 99.87 | **99.89** | 119.98 | 120.00 |
| /projects | 98.41 | 98.43 | 105.65 | 105.67 |
| /studio/:projectId | 91.84 | 91.86 | 129.28 | 129.28 (멈춤 > 129.65) |

- 모든 라우트 +0.02의 원인: 새 공유 청크 `SourceTags-*.js`(gzip 0.33)의 파일 이름이 엔트리 `index-*.js`의 preload 맵(`"assets/SourceTags-….js"`)에 들어갑니다. `/profile`·`/studio` closure에는 SourceTags가 없습니다.
- 0으로 만드는 배치가 없습니다: manifest를 보면 Catalog와 Detail이 함께 쓰는 기존 청크(`compareTray`·`referenceDisplay`·`SegmentedControl`·`catalogFilters`)를 다른 라우트도 모두 import합니다. 그중 하나에 합치면 약 0.3KB가 `/compare`나 `/profile`로 옮겨 가 지금보다 나빠집니다. 그래서 `vite.config.ts`는 수정하지 않았습니다.
- SPEC 8절 추정(`/catalog` 100.10~100.17, Codex 시제품 100.25)보다 큽니다(100.32). `/references` 97.76(시제품 97.68)도 같습니다. 둘 다 한도 안입니다.
- base 측정용으로 임시 worktree를 `/tmp/gm-base`(detached `b3f8894`, node_modules는 심볼릭 링크)에 만들었습니다. 측정 뒤 `unlink` → `git worktree remove --force` → `prune`으로 제거했습니다.

## 4. Ego Lite 실측 (build + `vite preview` 127.0.0.1:4353, TaskSpace 6, CDP 뷰포트)

E1 측정 방법은 브리프와 다르게 바꿨습니다. header CTA와 내비는 `<img>` SVG 안에 있어 DOM으로 rect를 구할 수 없습니다. 그래서 Tag rect를 썸네일 컨테이너(`img.parentElement`) rect와 비교했습니다. 캡처를 눈으로 확인한 결과 CTA는 덮이지 않았습니다.

| 폭 | 카드 폭 | 썸네일 bottom | internal top | 생성 조합 top | 교차 면적 | 행 높이 |
|---|---|---|---|---|---|---|
| 1280 | 305.7 | 245.2 | 253.2 | 253.2 | 0 · 0 | 385.2 ×3 |
| 1024 | 338.5 | 270.0 | 278.0 | 278.0 | 0 · 0 | 409.9 ×2 |
| 390 | 343 | 209.1 | 217.1 | 217.1 | 0 · 0 | 348.9 |

- 상세 생성 조합(1280): h1 top 16 / bottom 46. Tag internal(x 1092.9)과 생성 조합(x 1153)의 top이 21로 같습니다. 설명 1회(top 90). 390도 같은 구조이고 설명 1회입니다.
- 큐레이션 상세(브레드크럼 → 카탈로그 → "모던 카페 브랜드" 클릭): internal만 있고 설명 0입니다.
- 캡처(뷰포트 clip, PNG 바이트): `E1-catalog-gen-card-1280.png` 22366 · `-1024` 24033 · `-390` 19084 · `E3-detail-gen-1280.png` 16157 · `E3-detail-gen-390.png` 16278 · `E3-detail-curated-1280.png` 9810.
  - 첫 E1 캡처는 clip을 뷰포트 좌표로 줘서 빈 이미지가 나왔습니다. 문서 좌표(+scrollY)로 다시 찍어 덮어썼고, 내용을 눈으로 확인했습니다.
- 정리:
  - `indexedDB.deleteDatabase("design-studio")` → deleted
  - `finish({keep:[]})` 실행 후 `listTaskSpaces()` → `[]`
  - preview 종료 뒤 `lsof -iTCP:4353 -sTCP:LISTEN` → 0
  - 다른 창이나 포트는 건드리지 않았습니다.

## 5. 게이트
- `npm ci` exit 0 · lock 변경 0.
- `npm run typecheck` · `npm run lint` · `npm run build` exit 0 (`set -o pipefail` 체인).
- 전체 `npx vitest --run` 1회: Test Files 297 passed · Tests 2667 passed · exit 0.
- RED: 구현 전 5 failed / 49 passed. U4와 카드 U7은 구조 가드라 RED 단계에서도 통과했습니다. 사전 예측은 따로 적지 않았고 결과만 사후에 기록했습니다(PROGRESS).
- Codex `review --scope branch --base b3f8894` 1라운드: **지적 0**.
  - Codex 쪽 vitest는 읽기 전용 샌드박스라 실행하지 못했습니다(Codex가 직접 밝힘). 테스트는 위 로컬 실행으로 확인했습니다.
  - 2라운드는 하지 않았습니다(반영할 지적이 없음).

## 6. SPEC과 다르게 한 것
- G2의 `/profile`·`/studio` 첫 화면 "변화 0" → +0.02(3절). SPEC 8절은 "진입 closure를 건드리지 않으므로 0"이라고 했지만, 엔트리 preload 맵 비용은 고려하지 않았습니다.
- E1의 "Tag·header CTA 교차 0"은 "Tag·썸네일 교차 0"으로 대신 측정했습니다(4절 사유).
- 카드 article의 `relative` 클래스를 제거했습니다. absolute 자식이 0이 되어 필요 없어졌습니다.

## 7. 남은 것
- 사용자 결정: `/profile` 첫 화면 +0.02(99.89/100)를 받아들일지 정해 주세요. 받아들이지 않으면 청크 구조 점검이 필요합니다(ADR-004).
- QB-GM-1·2(사람 판단, QA 레인)는 하지 않았습니다.
- B-GM-01~03은 BACKLOG에 이미 있어 추가하지 않았습니다.
- push·merge는 하지 않았습니다(승인 대기).
