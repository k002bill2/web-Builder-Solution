# RS4-CP4-MEASURE REPORT (작성 중)

## M0 — base f477c161 (코드 변경 0, `npm run build` exit 0 — `raw/base-build.txt`, `raw/base-size.txt`)

| 시나리오 | 판정선/한도 | base |
|---|---|---|
| `/studio/:projectId` 정규화 | ≤ 128.53 | **128.47** (기준선 128.50 + 0.03) |
| `/studio/:projectId` raw 진입 직후 | ≤ 130 | 129.86 |
| 복원 진입 정규화 | ≤ 131.51 | **131.45** |
| 복원 진입 raw | ≤ 134 | 132.90 |
| `/studio` 첫 화면 | ≤ 100 | 91.79 |
| `/profile` 첫 화면 · 진입 | 100 · 125 | 99.83 · 120.62 |
| `/profile (3안 있음)` 첫 화면 · 진입 | 100 · 125 | 99.83 · 123.10 |
| `/projects` 첫 화면 · 진입 | 100 · 125 | 99.43 · 108.72 |

청크별(`tools/chunks.mjs`, `raw/base-studio-chunks.txt`): 21청크, 공통 외 상위 StudioLayout 19.40KB · _issue 8.03 · deferredStudio 2.74 · StudioPage 1.82 · memoryProjectRepository 1.79.
