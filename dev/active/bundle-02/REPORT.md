# BUNDLE-02 REPORT — 권고 R1 적용 (인라인 아이콘 5개 파일화)

- 작성: Developer · 2026-09-26 · 브리프 `docs/06-handoff/BUNDLE-02_DEVELOPER_BRIEF.md` (base `f5e9043`)
- 코드 커밋: `1f71df2` · 결론: **`/compare` 첫 화면 99.30 → 98.38 (여유 0.70 → 1.62KB)**, 기대값(L1)과 전 항목 일치

## 1. 변경
| 파일 | 내용 |
|------|------|
| `app/src/build/notInlinedIcons.ts` (신규) | 파일화 목록 `NOT_INLINED_ICON_NAMES` + `assetsInlineLimit` 판정 `notInlinedIconLimit`. 기존 5개 + R1 5개(bookmark·bookmark-fill·search·arrow-right·chevron-left). 배열 옆 주석: BUNDLE-01 R1(e15) 근거 + "V2-4에서 이 아이콘을 `/compare` 첫 화면에 쓰면 요청이 생긴다". 앱 코드는 import하지 않음 |
| `app/vite.config.ts` | 인라인 배열 제거 → `assetsInlineLimit: notInlinedIconLimit` |
| `app/src/build/notInlinedIcons.test.ts` (신규) | 회귀 가드 4건 |

- 목록 분리를 먼저 중립 리팩터로 적용하고 빌드: 공통 89.58·`/compare` 99.30, manifest 형태 동일, 인라인 SVG 7개 그대로 → **분리 자체의 번들 영향 0** 확인 후 5개 추가.
- 기존 주석 "비교 보드(03b)에서만 쓰는 아이콘"은 이번 추가로 사실과 달라져 기준을 "`/compare` 첫 화면과 공통 셸에 그려지지 않는 아이콘"으로 고침.

## 2. 테스트 (RED → GREEN)
`notInlinedIcons (BUNDLE-01 R1 회귀 가드)`
1. R1 아이콘 5개(카탈로그·상세 전용)를 파일로 내보낸다 — 절대경로 입력 시 `false`
2. 공통 셸·/compare 첫 화면 아이콘(plus: AppHeader, close: 트레이·ColumnHeader)은 인라인으로 둔다 — `undefined` (BUNDLE-01 C2 근거)
3. 목록의 이름은 모두 실제 아이콘 파일이다 — 오타 시 `endsWith`가 조용히 안 맞는 것 방지
4. 아이콘이 아닌 자산은 기본 규칙(undefined)을 따른다

- RED: `1 failed | 3 passed (4)` — `bookmark: expected undefined to be false` (첫 실행은 jsdom URL 스킴 오류라 `@vitest-environment node` 추가 후 재확인)
- GREEN: `4 passed (4)`
- 검증 4종: typecheck exit 0 · lint exit 0 · test **44 files / 503 passed** · build exit 0 (check-bundle-size 통과)

## 3. 번들 전/후 (gzip, KB=1000B, `node docs/perf/bundle-01/measure.mjs app/dist`)
| 항목 | 전 (f5e9043) | 후 | 차 | 브리프 기대 |
|------|------|------|------|------|
| 공통 (index + jsx-runtime) | 89.58 (86.25+3.33) | **88.66** (85.33+3.33) | −0.92 | — |
| `/catalog` 첫 화면 / 진입 직후 | 99.41 / 101.80 | **98.49** / 100.87 | −0.92 | 98.49 |
| 상세 | 96.74 / 99.13 | **95.82** / 98.20 | −0.92 | 95.82 |
| `/compare` | 99.30 / 121.73 | **98.38** / 120.80 | −0.92 | 98.38 / 120.80 |
| 자리표시 | 90.04 / 92.42 | **89.12** / 91.50 | −0.92 | 89.12 |

- manifest: 엔트리 `index` 청크 `assets`에 arrow-right·bookmark·bookmark-fill·chevron-left·search `.svg` 추가(총 11개 svg 파일). 공통 JS의 `data:image/svg` 출현 수 7 → **2**(plus·close).

## 4. 브라우저 (vite preview, 127.0.0.1:4173, 1280×900, ego-browser)
| 라우트 | SVG 요청 (resource timing) | 아이콘 박스 | CLS |
|------|------|------|------|
| `/catalog` | search·sparkle·chevron-down·arrow-right·bookmark (R1 중 3개) | 검색 20×20·북마크 20×20 ×6·arrow-right 16×16 모두 표시 | 0.0132 (캐시 끔 1회차, 원인 노드 미수집) / 0.0001 (2회차, 원인: 헤더 nav·우측 영역 — 아이콘 아님) |
| 상세 `/references/ref-c` | chevron-left·bookmark | 뒤로 18×18·북마크 20×20 표시 | 0.0001 |
| `/compare` | **없음** | 헤더 plus(인라인)만 | 0 |

- 아이콘은 `i.ds-icon` + size 클래스로 박스 크기가 고정 — mask 이미지 로드 전후로 크기 변화 없음. BUNDLE-01의 "`/compare`는 추가 요청 없음"(L2)을 실측(L1)으로 확인.
- 캡처: `dev/active/bundle-02/catalog-1280.png`, `detail-1280.png`
- 서버 종료 후 `lsof -nP -iTCP:4173 -sTCP:LISTEN` 결과 없음.
- 주의: `npm run dev`는 `assetsInlineLimit`이 적용되지 않아 빌드+preview로 확인.

## 5. Codex 리뷰 (1회, `review --wait --scope branch --base f5e9043`)
- 결과: **결함 없음** — "The change preserves the existing inline-limit behavior and adds the new icon exclusions consistently with the stated intent. I found no actionable defects." (Codex 측 테스트 실행은 읽기 전용 환경이라 불가 — 로컬에서 503 통과 확인)

## 6. 남은 위험
- **U-6 (BUNDLE-01)**: V2-4가 5개 중 하나를 `/compare` 첫 화면에 그리면 `/compare`에도 SVG 요청이 생긴다. 목록 주석에 명시. 가드 테스트는 plus·close만 막으므로 V2-4 착수 때 사용처 재확인 필요.
- 바이트 이동: `/catalog` SVG 요청 +3(실측: search·bookmark·arrow-right, 저장 시 bookmark-fill 추가), 상세 +2(chevron-left·bookmark). JS 예산 밖으로 옮긴 것이므로 ADR-004 비고에 요청 수 증가를 적을지 Jarvis 판단 필요.
- CSS mask라 느린 네트워크에서는 아이콘이 첫 페인트 뒤에 뜰 수 있음(박스는 고정이라 레이아웃 이동은 없음). 스로틀 조건 실측은 안 함.
- 캐시 끈 1회차 CLS 0.0132의 원인 노드는 수집하지 못함(2회차 원인은 헤더). 아이콘 박스 고정이라 아이콘 원인일 가능성은 낮다고 봄(추정).
