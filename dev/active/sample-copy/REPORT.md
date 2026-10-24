# SAMPLE-COPY REPORT

**결론: PASS — C1~C9 교체 · SMP-AC-A05 가드(변이 확인) · 번들 판정 통과 · 게이트 4/4 EXIT 0.**

## C1~C9 전/후

| # | 파일 (app/src/…) | 전 | 후 |
|---|---|---|---|
| C1 | `components/studio/PageInfoFields.tsx` | "발행 주소가 정해지면 채웁니다(2a-05b)" | "샘플에는 대표 주소가 필요하지 않습니다"(필드 제목 유지) |
| C2 | `domain/boardWarnings.ts` | "발행 전에 사업자정보가 있는 푸터가 필요합니다" | "실제 사이트로 쓰려면 사업자정보가 있는 푸터가 필요합니다" |
| C3 | `components/studio/SnapshotDialog.tsx` | 종류 "게시" | "확정"(kind `published` 유지) |
| C4 | `components/studio/ExportButtons.tsx` | "정적 사이트(zip) 내보내기" | "HTML 샘플 묶음(zip) 내보내기" |
| C5 | `components/studio/ExportAfter.tsx` | "정적 사이트(zip)를 만들었습니다" · "정적 사이트(zip)는 생성기 연결 후…" · "React 프로젝트(zip)는 코드 생성기…" | "HTML 샘플 묶음(zip)을 만들었습니다" · "HTML 샘플 묶음(zip)은 생성기 연결 후…" · "React 코드 샘플(zip)은 코드 생성기…" |
| C6 | `features/studio/exportFlow.ts` | "…정적 사이트(zip)는 이미지를 파일로 나눠 담습니다" | "…HTML 샘플 묶음(zip)은 이미지를 파일로 나눠 담습니다" |
| C7 | `features/studio/reactZip/reactZipLabel.ts` | "React 프로젝트(zip) 내보내기" | "React 코드 샘플(zip) 내보내기" |
| C8 | `features/studio/reactZip/reactZipText.ts` · `checkReactZipEntries.ts` | "# 사이트 프로젝트" · "배포용 파일을 만드세요" · "## 사이트 코드 — 킷 소스"(+ LICENSE_SECTIONS "## 사이트 코드") | "# 디자인 샘플 프로젝트" · "빌드용 파일을 만드세요" · "## 샘플 코드 — 킷 소스"(+ LICENSE_SECTIONS "## 샘플 코드", 같은 커밋 71ccc9cb) |
| C9 | `features/studio/zip/licenses.ts` | "사이트 파일(index.html)" · "사이트를 만든 사용자가" | "샘플 파일(index.html)" · "샘플을 만든 사용자가"(권리 문장 나머지 불변) |
| C10 | — | "사이트 목적" | 유지(Jarvis ★) |

함께 갱신한 테스트: PageInfoFields · boardWarnings · ExportFlow · ExportSample · ExportResultNotes · exportFlow · template · licenses · reactZipCopy.

판단 메모(목업·SPEC과 다르게 한 부분):
- C8 `## 사이트 코드` 새 이름은 SPEC에 문구가 없어 C9 치환 규칙("사이트"→"샘플")에 맞춰 "## 샘플 코드"로 정했다.
- C8 SPEC 표의 나머지 줄(README "사이트 소스와…", "사이트를 빌드합니다", LICENSES 1절 "사이트 소스")은 SPEC에 제안 문구가 없어 유지(가드 금지어 아님).
- `reactZipCopy.test.ts`는 `dev/active/m4b-impl/COPY.md`(쓰기 범위 밖)와 글자 비교한다 → COPY.md는 고치지 않고 테스트에 SAMPLE_COPY 치환 표(4쌍)를 두어 원문+이번 변경분으로 비교.

## SMP-AC-A05 가드 — `app/src/test/noPublishCopy.test.ts`

- 대상: `app/src` *.ts·*.tsx, `*.test.*`·`src/test/`·`**/testing/**` 제외, 블록·줄 주석 제거 후 "발행"·"정적 사이트"·"게시" 검색. 허용 목록 "배포되었을 수 있으니"(RouteErrorBoundary).
- 변이 1회(`logs/guard-mutation.txt`): `ExportButtons.tsx` C4 라벨을 "정적 사이트(zip) 내보내기"로 되돌림 → `'정적 사이트' 0건` **FAIL**(해당 줄 지목) → `git checkout`으로 원복 → 5/5 PASS.

## 번들 (`logs/bundle.txt`, build EXIT=0)

| 측정 | 값 | 판정선 | 결과 |
|---|---|---|---|
| `/studio/:projectId` 정규화 진입 | 128.83KB | 128.84 + 0.03 = 128.87 | 통과 |
| `/studio` 복원 진입 정규화 | 131.83KB | 131.84 + 0.03 = 131.87 | 통과 |
| `/catalog` 첫 화면 | 100.77KB | 101 | 통과 |
| `/compare` 첫 화면 | 98.96KB | 100 | 통과 |
| `/profile` 첫 화면 | 99.53KB | 100 | 통과 |

## 게이트 (`logs/gates.txt`, app/)

- `npm run typecheck` EXIT=0 · `npm run lint` EXIT=0 · `npx vitest run --maxWorkers=2` 390 files / 3492 tests passed EXIT=0 · `npm run build` EXIT=0.

## 남은 일

- 없음(브리프 범위). 원격 push·PR은 브리프상 금지 — 사용자 승인 후.
