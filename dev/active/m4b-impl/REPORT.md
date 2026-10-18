# M4-b-2 REPORT — React zip 내보내기 구현

> 상태: **E0~E4(빌드) 완료 · Codex 1회 반영 · Ego Lite 실화면 1회 BLOCKED(BRIEF 턴 상한 — 105턴부터 마감)** · base `631190c7` · 2026-10-18. 표기: [사실]=실행·파일 근거 · [추정] · [미확인].

## 결론 줄
`React zip 내보내기 구현(E0~E3 + E4 빌드) · /studio 정규화 128.82 · 복원 131.80(판정 128.83·131.81 안, 감량 2회 — E0·E1 각 1회) · 다른 라우트·렌더 증분 0 · 생성기 청크 53.29KB gzip(조작 뒤) · 산출 zip(M1·M2)을 docker node:22·node:20.19에서 npm ci && npm run build · npm install && npm run build 전부 exit 0 · 30변형 + 이미지 문서 SSR 대조 통과 · Ego Lite 실화면(RZ-AC-R1·R2·R4)은 미실행`

## 커밋
| SHA | 내용 |
|---|---|
| `e1f48a8a` | BRIEF·PROGRESS 시작 |
| `ef096651` | E0 버튼·슬롯 배선 + 진입 정적 포함 0 가드 · 기준선 개정 20 |
| `4f38494c` | E0 예산 실측 · REPORT 초안 |
| `c1d3c18b` | E1·E2 생성기 · 허용표 · lock 고정 |
| `fd3046dd` | E3 충실도 SSR 대조 |
| `3106050b` | REPORT 판정표·예산 |
| (이 커밋 — `git log -1`) | Codex r1 반영(생성 전체 상한 · 단언·용량 = 거절) · REPORT·PROGRESS 마감 |

## 예산 (`npm run build` → `check-bundle-size.mjs`, 해시 정규화 gzip KB)
| 단계 | /studio 정규화 | 복원 진입 정규화 | raw /studio · 복원 | 렌더 JS | 다른 라우트 | 판정 |
|---|---|---|---|---|---|---|
| base `631190c7` | 128.80 | 131.78 | 130.10 · 133.13 | 84.29 | — | 기준(개정 20) |
| E0 1차 | 128.97 (+0.17) | 131.95 | 130.27 · 133.30 | 84.29 | 0 | 초과 — 진입이 reactZipText를 import해 README·결과 줄 문자열이 StudioLayout 청크에 실림 |
| E0 감량 1회(버튼 글자 모듈 `reactZipLabel.ts` 분리) | 128.81 (+0.01) | 131.79 (+0.01) | 130.12 · 133.15 | 84.29 | 0 | 통과 |
| E1 1차(생성기 배선) | 128.88 (+0.08) | 131.86 | 130.19 · 133.22 | 84.29 | **+0.05**(공통 react 청크) | 초과 — 생성기 청크가 exportFlow 청크의 문구 모듈을 import → exportFlow에 namespace 헬퍼(`__exportAll`)가 생겨 공통 청크에 런타임 헬퍼 추가 |
| E1 감량 1회(결과 줄 문구 `reactZipNotes.ts` 분리) | **128.82 (+0.02)** | **131.80 (+0.02)** | 130.13 · 133.16 | 84.29 | 0(±0.01) | **통과(≤128.83 · ≤131.81)** |

- 진입 정적 포함 0 가드(SPEC 5.4): `/studio` 두 시나리오 진입 집합에 생성기 청크·킷 원문 표식(`M2A-2a K3`)·lock 표식(`lockfileVersion`) 0 + **양성 검사**(생성기 청크 닫힘에 두 표식 있음). 통과.
- 기준선 2파일(`m2cBaseline.json` normEagerKb · `bundleBudget.test.mjs`) = 개정 20 기준선 128.80·131.78 → 판정선 128.83·131.81.
- 산출 사이트 빌드(C3): JS 246.61KB(gzip 76.35) M1 · 249.62KB(gzip 77.63) M2 · CSS 30.67KB(gzip 5.98) — TRD 90/30 안.

## RZ-AC 판정표
| ID | 판정 | 근거 |
|---|---|---|
| 01 버튼 3개 순서 | PASS | `ExportFlow.test.tsx` 형식 버튼 |
| 02 흐름(검사→차단→확인→저장→요청 1회) | PASS(기존 경로 공유) | 형식 키만 다른 같은 `useExportFlow` 경로 · `memoryExport.test.ts` react-zip 잡 succeeded |
| 03 GENERATOR_UNAVAILABLE 0 · isFormat | PASS | `memoryExport.test.ts` React zip 슬롯 3건 |
| 04 청크 재시도·계수 | PASS | `exportFlowReactZip.test.ts` 첫 테스트 · `chunkRetryWiring.test.ts`(retryableImport 2개) · memoryExport 슬롯 실패→재시도 |
| 05 읽기 전용 탭 | PASS | `exportFlowReactZip.test.ts` |
| 06 entry 집합·순서·킷 집합·빈 원문 | PASS | `reactZip.test.ts` · `checkReactZipEntries.test.ts` |
| 07 결정성 | PASS | `reactZip.test.ts` 같은 바이트 |
| 08 site.json 스키마·중립 상수·UUID 0·무결성 | PASS | `reactZip.test.ts` · `checkReactZipEntries.test.ts` |
| 09 글꼴 바이트·OFL | PASS | `reactZip.test.ts`(입력 바이트 = loadSiteFonts 바이트 — 정적 zip과 같은 원천) |
| 10 package.json | PASS | `template.test.ts` |
| 11 lock 대조 | PASS | `template.test.ts`(정상 통과 · integrity 누락 실패 · 새 라이선스 실패) |
| 12 앱 설치 버전 대조 | PASS | `template.test.ts` |
| 13 30변형 SSR 대조 | PASS | `fidelity.test.tsx` 32/32 |
| 14 body 값 = base.css | PASS | `template.test.ts`(line-height 포함) |
| 15 메뉴 리스너 | PASS | `template.test.ts`(jsdom) |
| 16 브랜드 0 | PASS | `reactZip.test.ts` |
| 17 LICENSES | PASS | `template.test.ts`(lock 라이선스 집계 = 상수) |
| 18 용량·단언 실패 | PASS(Codex r1 반영 — refused + 사유, 다시 시도 없음) | `checkReactZipEntries.test.ts` · `exportFlowReactZip.test.ts` |
| 19 파일 이름 | PASS | `exportFileName.test.ts` · `exportFlowReactZip.test.ts` |
| 20 예산 | PASS | 위 예산 표 |
| C1 npm ci/install + build | PASS(로컬 Linux 컨테이너 — 7a) | `raw/zip-build-node22.txt`(v22.23.3) · `raw/zip-build-node20.txt`(v20.19.6) — M1·M2 각 4개 exit 0. **단 zip은 vitest 경로(CSS 주입) 산출** |
| C2 windows·macOS | [미확인] | 7a — CI 결정 전까지 |
| C3 산출 크기 | PASS | 76.35/77.63 · 5.98 gzip |
| R1 앱 실제 경로 zip | **BLOCKED** | Ego Lite 미실행(턴 예산). 실제 빌드 청크에 킷 CSS·lock 표식은 가드 양성 검사로 확인 |
| R2 실화면 비교 | **BLOCKED** | 같은 이유 |
| R3 20MB+ 시간 | [미확인] | 미실행 |
| R4 status/alert·포커스 | **BLOCKED** | 같은 이유 |

## Codex 검증 (1회 · `adversarial-review --scope branch --base 631190c7`)
- 판정 needs-attention · 지적 2건(medium) — **둘 다 반영(1회)**.

| # | 지적 | 반영 |
|---|---|---|
| 1 | `kitCss` 조회가 멈추면 상한이 없어 잡이 running으로 남고, 같은 revision 재시도가 복구되지 않음 | 생성 전체(render.html·CSS·글꼴·생성)에 8초 상한 → JOB_TIMEOUT · 늦게 끝난 생성은 URL·onBuilt 게시 0 (`reactZipGenerator.test.ts`) |
| 2 | 단언·용량 실패가 INFRA retryable로 전달되어 "다시 시도"가 보임(SPEC 1.3·RZ-AC-18 위반) | `ReactZipError.retry = false` → exportFlow가 refused + 사유(재시도 없음) · 다음 일시 장애에는 표식 미잔류 (`exportFlowReactZip.test.ts`) |

- 남긴 것: 정적 HTML 생성기도 `kitCss` 조회에 상한이 없다(같은 구조) — 이번 diff 밖이라 고치지 않음(별건 후보).

## 마감 검증 (fresh)
- `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npx vitest --run` 368 files / 3297 tests passed · `npm run build` exit 0(예산·가드 통과, /studio 128.82 · 복원 131.80 · 렌더 84.29 · 생성기 청크 53.40KB).
- preview·dev 서버 미기동(리슨 0) · `git status --short` 빈 값.

## 목업·SPEC과 다르게 한 부분
- 문구 자리 상수: `reactZipText.ts`가 모음이지만 버튼 글자는 `reactZipLabel.ts`(진입), 결과 줄은 `reactZipNotes.ts`(exportFlow)에 두고 다시 내보낸다 — 모듈 경계가 청크 경계라 한 파일이면 진입 +0.16 · 공통 +0.05(E0·E1 실측).
- SSR 대조 풀 위치: SPEC `node_modules/.cache/…` 대신 gitignore된 `app/.vite/react-zip-fidelity/`(afterAll 삭제). node_modules 경로는 미시도. 정규화 ②를 React SSR의 `<link rel="preload" as="image" href>`에도 적용(SSR 전용 산출물 — 브라우저에서는 head로 간다).
- 단언·용량 실패: refused 자리(사유 = `export.fail.pattern` 자리 문구 또는 현행 `tooLargeText`) — SPEC은 단언 실패를 "재시도 가능 실패와 같은 자리"라 했으나 ExportAfter 변경 없이 "다시 시도 없음"을 지키려고 refused 자리를 썼다(Codex r1).
- 성공 Callout 제목은 현행 `NAME["react-zip"]`("zip을 만들었습니다")을 그대로 쓴다 — [문안 미정].
- 킷 동봉 = `app/src/kit` 테스트 제외 39파일 중 `fonts.css`를 뺀 38(zip은 자기 `src/fonts.css`를 쓴다).
- 쓰기 경로 밖 변경: `components/studio/ExportButtons.tsx`(FORMATS 1줄) · `data/memoryDocBook.ts`(슬롯) — SPEC 1.1·1.2·5.4가 진입 변화로 허용한 항목. `data/chunkRetryWiring.test.ts`·`data/memoryExport.test.ts`는 예상된 단언 교체(M4-a 단언).
- 생성기 공통 조각 `kitCss`·`hex12`·`defaultFetchText`를 `staticHtml/kitCss.ts`로 옮김(staticHtml.ts는 다시 내보냄 — pngCapture 변경 0).

## 서브에이전트
- 사용 0(읽기 전용 조사도 직접 수행).

## FIX1 (BRIEF-FIX1 · 2026-10-18) — 문안 반영 · QA 1차 P1~P3 · 원격 자동 허용 제거
> 결론: **완료 — 6항목 전부 반영, 게이트 4종 fresh 통과, 예산 판정선 안(감량 불필요).** 원격 명령 0 · 브라우저·Codex 미사용(브리프 지시).

| # | 항목 | 커밋 | 근거 |
|---|---|---|---|
| 0 | BRIEF-FIX1·COPY 커밋 | `c3abb85d` | — |
| 1 | 문안 COPY.md 글자 그대로 · `TODO(copy)` 0 | `dfe3834f` | `reactZipCopy.test.ts` — COPY.md 블록을 읽어 원문 일치(버튼·결과 줄·다음 할 일·README 전문·LICENSES 1·2·4절) · {files} = 실제 entry 수 · TODO(copy) 0 가드 |
| 2 | P1 M6 가드 | `1d94dbb3` | `ReactZipError.retry === false` + 실제 `buildReactZip` 허용표 위반(이미지 서명 불일치, cause `허용표 …`) → refused · 사유 `export.fail.pattern` |
| 3 | P2 UI 흐름 · 진입 가드 단위 | `2e0c84b2` · `0511e643` | `ExportFlow.test.tsx` react-zip: 편집→다시 검사→확인 대화상자→요청 시점 저장 1건→requestExport 1회 `("project-1","react-zip",4)` · `scripts/reactZipEntryGuard.test.mjs` 음성 3·양성 4·정상 0 |
| 4 | P3 3MB 초과 메일 안내 0 | `b4813fe9` | `exportNotes({bytes:3*MB+1,…},"react-zip")` = [크기 줄, 다음 할 일] 정확 일치 |
| 5 | `.claude/settings.json` push·pull 허용 2줄 삭제 | `a2876fc8` | diff −2줄만 · `json.load` 유효 · hooks 변경 0 |

### 변이 확인 (매번 되돌림 · `git diff --stat` 빈 값 확인)
| 변이 | 결과 |
|---|---|
| M6 `ReactZipError.retry = true` | **FAIL** — 새 테스트(retry 단언) · retry 단언을 지운 사본에서도 흐름 단언이 `retryable ≠ refused`로 FAIL |
| react-zip 가지에 메일 안내 추가 | **FAIL** — P3 단언 |
| ExportButtons react-zip 형식 값 → `static-zip` | **FAIL** — UI 흐름 단언 |
| 가드 "진입에 생성기 청크" 검사 끔 | **FAIL** — 가드 음성 단언 |

### fresh 게이트 · 예산
- `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npx vitest --run` **371 files / 3353 tests passed** (QA 369/3342 → +2 files · +11 tests) · `npm run build` exit 0.

| 지표 | QA 1차 tip | FIX1 | 판정선 | 판정 |
|---|---|---|---|---|
| `/studio` 정규화 진입 | 128.82 | **128.82** | ≤128.83 | PASS |
| 복원 진입 정규화 | 131.81 | **131.81** | ≤131.81 | PASS(여유 0 그대로 — 버튼 라벨이 COPY와 이미 같아 진입 바이트 변화 0 · 감량 미실시) |
| 렌더 JS · CSS | 84.30 · 8.89 | 84.30 · 8.89 | 증분 0 | PASS |
| 진입 정적 포함 0 가드 | 통과 | 통과 · 생성기 청크 gzip 54.31KB(53.49 → +0.82, README·LICENSES 문안 증가분 — 판정 밖) | — | PASS |

### 브리프와 다르게 한 부분
- `check-bundle-size.mjs`: "함수 export만"으로는 import 시점에 dist 판정·`process.exit`이 돌아 테스트가 불가 → 판정·출력·종료를 `isMain`(직접 실행) 블록으로 감쌈. 빌드 로그 예산 줄·가드 통과 줄 그대로, 직접 실행 exit 0 확인.
- 4절 표: 기존 `LOCK_LICENSES`(설치 86개 · lock 대조 단언 유지)에서 직접 의존성 9개를 뺀 `TRANSITIVE_LICENSES`(77개: MIT 49 · Apache-2.0 1 · ISC 2 · MPL-2.0 24 · BSD-3-Clause 1)를 표로 출력 — 테스트가 lock에서 직접 재집계해 대조.
- `export.fail.pattern`: COPY.md에 없음 — 현행 문구가 M4-a EXPORT-SPEC 6.1 확정 문안과 같아 TODO 표식만 제거. LICENSES 3·5·6·7절은 COPY.md 결정대로 현행 유지(TODO 표식만 제거).
- 기존 단언 교체 2곳(강화 방향): `template.test.ts` "파일 56개" → 1절 머리 전문 일치 · 절 제목 "## 사이트 코드" → "## 사이트 코드 — 킷 소스". `exportFlowReactZip.test.ts`·`ExportFlow.test.tsx`는 상수 자기참조에 원문 리터럴 단언 추가.
- 주의: `reactZipCopy.test`는 `testing/copyDoc.ts`로 `dev/active/m4b-impl/COPY.md`를 읽는다 — 작업 폴더를 옮기거나 보관하면 실패하므로 그때 경로 갱신 또는 문안을 테스트 상수로 이전.
- UI 흐름 실제 순서 = 확인 대화상자 → 확인 → 저장 → requestExport(대화상자 시점 저장 0건 · 요청 시점 1건). `2e0c84b2` 커밋 메시지의 "검사→저장→확인" 순서 표기는 오기(테스트 제목은 후속 커밋에서 정정).
- 서브에이전트: 사용 0(항목이 작고 같은 테스트 파일을 공유해 분할 이득 없음).
