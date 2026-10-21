# TYPESCALE-IMPL QA-REPORT

**판정: 조건부 PASS** — 최우선 판정 통과(필드 없는 문서 = main과 같은 결과 · 범위 밖/비숫자 거부). 조건: TS-AC-13 font-size 실측 BLOCKED(OOPIF), TS-AC-16 테스트 공백(변이 M4 생존).

QA 대상 tip `8bd6657d`(+ QA 커밋만) · 정적 QA · 앱 코드·테스트 수정 0 · 원격 명령 0 · 브라우저/preview 0.

## 1. 최우선 판정 — 통과
| 경로 | 필드 없는 문서 결과 | 근거 |
|---|---|---|
| 렌더 토큰 | `type.scale = typeScale ?? scale` → 기존 base 비율 그대로. `docPalette` 리팩터(`paletteOf(versionOf(...))`)는 같은 조회 결과 | `app/src/features/studio/docPurpose.ts` diff · `kitTokenInput.test.ts:60` · `test/typeScaleBaseline.test.ts:48`(T0 고정 토큰 JSON 대조) |
| 정적 HTML·React zip | 호출부가 `doc.typeScale`(undefined) 전달 → 위와 같음. site.json `doc` 키 = 현행 10개, schema 1 | `staticHtml.test.ts:374`(없음 = 프로필 비율) · `reactZip.test.ts:80` |
| 문서 해시 | 키 없으면 키 0 → 해시 변화 0 | `typeScaleBaseline.test.ts:41`(고정 해시 `fnv1a64:5acdb47336801ddd`) · `createDocFromCandidate.test.ts`(값 없음 = 키 0) |
| 저장 검증·가져오기 | `Object.hasOwn(rec,"typeScale")`일 때만 읽고 담음 → 기존 문서 키 0 | `validatePageDoc.test.ts:191` |
| 범위 밖·비숫자 | `"1.25"·NaN·Infinity·0.99·2.01·-1.2·null·undefined` 거부(`$.typeScale`) · 범위 밖 파일 가져오기 거부 · 쓰기 BAD_VALUE | `validatePageDoc.test.ts:199` · `typeScaleRollback.test.ts`(범위 밖 파일) · 변이 M1이 4개 테스트로 잡힘 |

## 2. 게이트·예산 (fresh, `logs/qa-gates.txt`)
명령: `cd app && npm run typecheck && npm run lint && npx vitest run --maxWorkers=4 && npm run build` → `EXIT=0`
| 항목 | QA 실측 | Jarvis 수치 | 판정선 |
|---|---|---|---|
| typecheck · lint | 0 · 0 | 0 · 0 | — |
| test | 384 files / 3459 passed | 384 / 3459 | — |
| build | exit 0 | exit 0 | — |
| `/studio` 정규화 | 128.79 | 128.79 | ≤ 128.82 |
| 복원 진입 정규화 | 131.79 | 131.79 | ≤ 131.82 |
| 렌더 JS | 84.38 | 84.38 | ≤ 89.70 |

## 3. TS-AC 표 (SPEC 4.1)
| TS-AC | QA 판정 | 근거 |
|---|---|---|
| 01 | 통과 | `data/startDocTypeScale.test.ts:34` (변이 M2·M3로 실패 확인) |
| 02 | 통과 | `data/startDocTypeScale.test.ts:48` |
| 03 | 통과 | `engine/validate/validatePageDoc.test.ts:189-206` (변이 M1·M2 실패 확인) |
| 04 | 통과 | `features/studio/kitTokenInput.test.ts:60` · `test/typeScaleBaseline.test.ts:48` (M5 실패) |
| 05 | 통과 | `features/profile/comparePreviews.test.ts:75` (M5 실패) |
| 06 | 통과 | `features/profile/CompareDialog.test.tsx:242` |
| 07 | 통과 | `engine/ops/typeScaleOps.test.ts:16` |
| 08 | 통과 | `data/persistence/typeScaleRollback.test.ts:95`(왕복) · 범위 밖 파일 거부 테스트(M1 실패) |
| 09 | 통과 | `reactZip/reactZip.test.ts:80` · `reactZipGenerator.test.ts:19` |
| 10 | **부분** | `staticHtml/staticHtml.test.ts:374`는 render 메시지 `kitTokens.type.scale`까지만 단언. SPEC 문구 "직렬화 결과 `--site-t1` = rem(문서 값)"은 직접 단언 없음(렌더 문서 내부 환산은 기존 kitTokens 테스트 몫) |
| 11 | 통과 | `test/typeScaleBaseline.test.ts:41` |
| 12 | 통과 | 위 2절 실측 |
| 13 | **부분/BLOCKED** | 로그 재판독(`logs/t4-ego-run1.txt`): 카드 비율 `1.2·1.25·1.333`, C 선택 → `/studio/project-2` 진입. `t4-ego-run1-measure`는 `INPUT` 14px(캔버스 h1 아님) — OOPIF로 제목 font-size 미측정. 또한 SPEC은 프로필 비율 1.25 프로젝트를 요구하나 실행은 1.2 프로필 |
| 14 | 통과 | `data/persistence/typeScaleRollback.test.ts:45` |
| 15 | 통과 | `engine/ops/typeScaleOps.test.ts:22` |
| 16 | **미검증(테스트 공백)** | `StudioLayout.tsx` useMemo 의존성 코드만 존재, 단위 테스트 없음 — 변이 M4 생존(151 files 통과) |

## 4. 단언 약화 점검 (`git diff 8d65fa9e HEAD -- 'app/**/*.test.*'`)
| 파일 | 이전 → 이후 | 판정 |
|---|---|---|
| `features/profile/CompareDialog.test.tsx` | 캡션 2 "제목 비율 축은 아직 편집 문서에 반영되지 않아 … 프로필 비율 ${scale}로 그렸습니다…" 존재 → `not.toHaveTextContent("제목 비율 축은 아직 편집 문서에 반영되지 않아")` | SPEC 의도 — TS-AC-06 "scaleNotice 문장 0". 부정 단언으로 대체(약화 아님) |
| 같은 파일 | `"${scaleText} (구조안)"` → `scaleText` 포함 + `not.toHaveTextContent("(구조안)")` | SPEC 의도 — TS-AC-06 "(구조안) 접미 0". 비율 텍스트 단언은 유지 |
| `scripts/bundleBudget.test.mjs` | eagerKb 130.10/133.13 → 130.12/133.16 · normEagerKb 128.76/131.75 → 128.79/131.79 | ADR-004 개정 22 기준선 재기록과 일치(값 갱신, 단언 형태 동일) |
| `features/profile/comparePreviews.test.ts` | it 제목 "3안 공통, 비율 덮어쓰기 0" → "비율 없음 = 프로필 비율"(expect 줄 변경 0) + TS-AC-05 열별 테스트 추가 | SPEC 4.2 T3 "3안 공통 scale 단언 → 열별" 의도대로 |
| `reactZip/reactZipGenerator.test.ts` | mock을 `vi.fn`으로 감쌈(반환값 동일) + 테스트 추가 | 약화 없음 |
그 외 test diff는 추가(+)만. 삭제된 `expect` 줄은 4줄(CompareDialog 2 · bundleBudget 2 값 갱신)뿐. skip/only 추가 0(diff 내 `it.skip`/`.only` 없음).

## 5. 변이 (`logs/qa-mutations.txt`, 각 적용 → 테스트 → `git checkout -- app/` → "reverted OK")
| ID | 변이 | 실행 범위 | 결과 |
|---|---|---|---|
| M1 | `readTypeScale` 상한 `<= 2` → `<= 3` | engine/validate·data·engine/doc | **잡힘** — 4 fail (2.01 거부 · 2.5 BAD_VALUE · 범위 밖 파일 · writeStartDoc) |
| M2 | 재구성 `...(typeScale !== undefined && { typeScale })` 제거 | 동일 | **잡힘** — 14 fail (TS-AC-01·02·03·14·08) |
| M3 | `memoryDocBook` typeScale 전달 제거 | data | **잡힘** — 4 fail (TS-AC-01·02) |
| M4 | `StudioLayout` 두 useMemo 의존성에서 `doc.typeScale`·`shown.typeScale` 제거 | components/studio·pages·features/studio (151 files) | **생존 — 테스트 공백** (TS-AC-16) |
| M5 | `docKitTokens` `scale: typeScale ?? scale` → `scale` | features·test | **잡힘** — 3 fail (TS-AC-04·05·10) |

## 6. 머지 전 필수
- 없음(코드 결함 미발견). 단 TS-AC-13·16 미충족을 수용할지 영환님 결정 필요 — 수용하지 않으면 아래 두 항목을 머지 전으로 올린다.

## 7. 백로그 노트
- TS-AC-16 컴포넌트 테스트: 같은 `profileVersion`·다른 `typeScale` 스냅샷 미리보기 진입/종료/복원 시 캔버스 `kitTokens.type.scale` 단언(M4를 잡도록).
- TS-AC-13 재실측: render.html OOPIF에 `Target.attachToTarget`으로 붙어 h1 font-size 측정 · SPEC대로 프로필 비율 1.25 프로젝트 사용.
- TS-AC-10 보강: 정적 HTML 직렬화 결과의 `--site-t1` 값 직접 단언.
- 참고: `validatePageDoc`는 `{ typeScale: undefined }`(메모리 객체)도 거부 — JSON 경로에선 발생 불가, 메모리 경로는 `memoryDocBook`/`writeStartDoc`/`createDocFromCandidate`가 undefined면 키를 넣지 않음(확인).

## 8. Jarvis 회수 확정 (2026-10-21)
- 판정 **조건부 PASS 수용**(★ — 코드 결함 0, 최우선 판정 통과). TS-AC-13·16·10 미충족분은 머지 전 필수가 아니라 BACKLOG **B-M2B-05c**(TS-AC-16 컴포넌트 테스트 · M4 생존) · **B-M2B-05d**(TS-AC-13 OOPIF 재실측, 프로필 1.25) · **B-M2B-05e**(TS-AC-10 `--site-t1` 단언)로 이관.
- 회수 확인: QA `claude_result_meta.subtype=success` · 15턴 · QA-PROGRESS 미완 0 · `git diff -- app/` 0 · 게이트 수치 Jarvis 측정과 일치.
