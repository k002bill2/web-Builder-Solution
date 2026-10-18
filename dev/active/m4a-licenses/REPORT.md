# M4-a-5 REPORT — LICENSES.md 고정 문안 반영

base origin/main `df8694a6` · 브랜치 `k002bill2/m4a-licenses` · push 0

## 1. 바뀐 문장 10곳 대조표 (COPY.md 1절 '이후'와 글자 일치)

검사: COPY.md 표에서 '이후' 셀 10개를 추출해 `grep -cF -- "<셀>" app/src/features/studio/zip/licenses.ts` (로그 `logs/grepF.txt`). `${files}`·`${lost}`는 소스의 보간식 그대로 일치.

| # | 위치 | grep -F 횟수 |
|---|---|---|
| 1 | 머리 요약 · :35 | 1 |
| 2 | 글꼴 없음 · :21 | 1 |
| 3 | 글꼴 안내 · :25 | 1 |
| 4 | 이미지 없음 · :37 | 1 |
| 5 | 업로드 이미지 권리 · :37 첫 문장 | 1 |
| 6 | 업로드 이미지 권리 주장 · :37 둘째 문장 | 1 (5와 같은 문자열, 공백 하나로 이어 붙임) |
| 7 | 자체 그래픽 · :40 | 1 |
| 8 | 잃은 이미지 · :41 | 1 |
| 9 | 코드·스타일 · :43 첫 문장 | 1 |
| 10 | 코드·스타일 · :43 둘째 문장 | 1 (9와 같은 문자열, 공백 하나로 이어 붙임) |

구조 변경 0: `licenses.ts` diff = 문자열 8개(10문장) + 파일 머리 주석 1줄("문장은 자리표시(최종 문안 = Hemingway 후속)" → "고정 문안(M4-a-5 …)" — 옛 주석이 사실과 달라져 정정, 제품 산출물 영향 0). 절 제목·순서·목록·조건 분기·파일 수 계산·마지막 개행·`fontLicenseText(family).trim()` 전문 블록 변경 0.

## 2. 테스트 (TDD)

- RED: `logs/red.txt` — licenses.test.ts 4 실패 / 4 통과(새 문장 단언·정정 단언이 옛 문장에서 실패).
- GREEN: licenses.test.ts 8/8.
- 기존 단언 정정(이전 → 이후, 약화·skip 0):

| 테스트 | 이전 | 이후 |
|---|---|---|
| 머리·글꼴 절 | `toContain("파일 7개")` | `toContain(COPY.head(7))`(전체 문장) + `toContain(COPY.fontLicense)` 추가 |
| 이미지 0장 | `toContain("올린 이미지 없음")` | `toContain(COPY.noImage)` |
| 잃은 이미지 | `toContain("2장")` | `toContain(COPY.lost(2))`(전체 문장) |
| 잃은 0장 | `not.toMatch(/잃은\|다시 골라야/)` | `not.toMatch(/잃은\|다시 골라야\|불러오지 못해/)` (새 문장 조각 추가) |
| 글꼴 없음 | `toContain("동봉한 글꼴 없음")` | `toContain(COPY.noFont)` |

- 추가 3건: ① 문단 = 고정 문장만(제목·경로 목록·OFL 블록 제외 문단을 `toEqual`로 전체 고정, 글꼴 있음·없음 두 분기 — 사용자 글자 0) ② 결정적 바이트(같은 입력 2회 → `TextEncoder` 바이트 동일, 마지막 개행 1개) ③ F-14 대상 문자열 0(brand.name·이전 브랜드 4글자·이전 토큰 접두어, 두 분기).
- 중간 실패 1건: 새 테스트 제목에 이전 브랜드 4글자를 적어 `brandIsolation.test.ts` 실패 → 제목만 바꿔 해소(ff64eaa8).
- `staticZip.test.ts`·`staticHtml.test.ts`: LICENSES 내용·zip 해시를 고정한 단언 없음(해시는 `sha12(blob)`로 매번 계산 대조) → 수정 0. zip 바이트 해시 자체는 문안 교체로 바뀌는 것이 기대 결과.

## 3. 게이트 (fresh, ff64eaa8)

| 명령 (app/) | 결과 |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm test -- --run` | exit 0 · 353 files · 3137 tests 통과 |
| `npm run build` | exit 0 |

## 4. 예산

| 시나리오 | 정규화 진입 | 기준선 | 증분 |
|---|---|---|---|
| /studio/:projectId | 128.71KB | 128.71 | 0 |
| 복원 진입 | 131.69KB | 131.69 | 0 |

raw 130.01·133.04(참고). licenses.ts는 조작 뒤 청크.

## 5. 남은 것

- COPY.md 3절 법무성 문장 확인(영환님) · Pretendard 수정본 여부 미확인 — 이번 범위 밖.
- 명세 3절 '이미지 0장이면 1줄'과 현행(빈 상태 뒤 권리 안내 출력) 차이 — COPY.md 전제대로 구조 변경 0.
- 서브에이전트 0 · Codex 0(BRIEF "Codex 불필요").
- B-M4A-03(BACKLOG:76 "LICENSES.md F-14 미구현 · LICENSES 문안 레인 때 함께"): 이번 레인은 `licenses.test.ts` 단위 단언(F-14 대상 문자열 0, 글꼴 있음·없음 두 분기)까지만 반영. 내보내기 런타임 F-14 검사기를 LICENSES.md까지 넓히는 변경은 BRIEF 쓰기 경로 밖이라 하지 않음 — 닫을지 Jarvis 판단.
- BRIEF 규칙 이탈 1건: "REPORT 초안 10턴 안" 미준수(약 14턴째 작성). 최대 30턴 안 마감.
- 커밋: e26e9efc(BRIEF·PROGRESS·COPY) · ef47aeef(문안 교체+테스트) · ff64eaa8(테스트 제목 수정) · e18b4dc2(REPORT·PROGRESS) · 이 커밋(REPORT 5절 보강).
