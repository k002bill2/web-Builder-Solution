# M3P-2 REPORT — 카탈로그 실렌더 썸네일 파이프라인 (빌드 시 SVG)

- 브랜치 `k002bill2/m3p-2` · base `db9f25e` · 구현 커밋 `45cf45b` · 2026-10-06 · Developer(Orca Claude Code)
- 결론: **S0 통과 → 구현 완료.** 기존 6개 레퍼런스의 1280×960 실렌더 SVG가 빌드 단계 1개로 생성됩니다. 산출물은 `dist/thumbs/{id}.{hash8}.svg`이고, 앱 번들과 렌더 문서 크기 변화는 0입니다. 카드 UI 연결은 M3P-3 몫이라 하지 않았습니다.

## 1. S0 판정 (상세: PROGRESS "S0 판정")
| # | 항목 | 결과 |
|---|---|---|
| ① | SSR 정적 마크업 vs 렌더 문서 DOM | jsdom 6/6 구조 동일. **실제 브라우저** render.html iframe serialize vs SSR 6/6 `same:true` |
| ② | @media 1280 해소 | render CSS @media 46개(kit 42 + tailwind 4) → 0. 모르는 조건이면 throw(빌드 실패) |
| ③ | 중첩 svg 네임스페이스 | XML parsererror 0, 중첩 svg 전부 SVG 네임스페이스 |
| ④ | `<img>` 시각 | 1280에서 렌더 문서 캡처와 거의 같음(차이는 iframe 스크롤바). 300px 카드 크기에서도 데스크톱 레이아웃 유지, 6장의 hero 모양이 구분됨 (`s0/*.png`) |

## 2. 변경 파일 (쓰기 경로 = PLAN 2절 M3P-2 W만)
- `app/src/thumbs/`: `referenceDoc.ts`(비교 sectionPlan → `writeStartDoc` + 상세 팔레트·글꼴·간격 + 카드·비율, 목록 밖이면 throw) · `mediaQueries.ts` · `svgWriter.ts` · `guards.ts` · `entry.tsx`(SSR 엔트리, 키 = SVG sha256 앞 8자) · `vitePlugin.ts`(앱 build에서만 `dist/thumbs` 내보내기 + `virtual:thumbnail-keys`) · `virtual.d.ts` · 테스트 3개
- `app/src/features/catalog/thumbnailKeys.ts`(+test): `THUMBNAIL_KEYS`·`thumbnailPath`. dev·테스트에서는 빈 맵입니다.
- `app/scripts/build-thumbs.mjs`: render CSS 별도 빌드 → SSR 빌드 → jsdom 전역 → SVG → 가드 → `node_modules/.thumbs/out`
- `app/package.json` `scripts.build`: `tsc` 다음에 `node scripts/build-thumbs.mjs` 단계 1개를 추가했습니다(의존성·lock 변경 0)
- `app/vite.config.ts`: `--mode thumbs`(SSR) 분기와 플러그인 등록
- `app/scripts/check-bundle-size.mjs`: 썸네일 크기 출력과 가드(키↔파일, 썸네일 CSS sha256 = 배포 render CSS, manifest에 `src/thumbs`·`react-dom/server` 0). `bundleBudget.mjs` 판정 로직은 바꾸지 않았습니다.
- M3P-1 경로·엔진·PageDoc 계약·docs·lock·CLAUDE.md 수정 0, 기존 테스트 수정 0

## 3. AC
| AC | 증거 |
|---|---|
| U8 | 같은 레퍼런스 → 같은 문자열·키(`thumbnail.test.tsx`) · 빌드 2회 키 동일 · viewBox 1280×960 머리 가드 |
| G2 | `thumbnailIssues`: http·`//`(xmlns 제외)·`<script`·`on*=`·외부 href·이전 브랜드·@media. 반례 10건이 실제로 잡힘. 빌드에서 6장 모두 위반 0 |
| G3 | `thumbsImportGuard.test.ts`(src/thumbs 밖에서 thumbs·react-dom/server import 0) + check-bundle-size manifest 가드 |
| G6 | @media 0 · 중첩 svg 네임스페이스 XML 파싱 검사(빌드 가드 + 테스트) |

## 4. SVG 크기 (빌드 출력)
| id | 키 | 원본 KB | gzip KB |
|---|---|---|---|
| ref-a | f1a3a307 | 52.91 | 12.08 |
| ref-b | 0bcacfda | 49.81 | 11.25 |
| ref-c | ba75afc4 | 51.15 | 11.59 |
| ref-d | 2dca126d | 49.69 | 11.29 |
| ref-e | 5daac355 | 51.47 | 11.19 |
| ref-f | 22e5e28b | 52.29 | 11.49 |

## 5. 번들 (base와 같음)
`/catalog` 첫 화면 99.65 / 진입 102.04 · `/studio` 진입 128.62(M2c 기준선 +0.03, 멈춤선 128.70) · 렌더 문서 JS 84.19 · CSS 8.85 — **변화 0**. `THUMBNAIL_KEYS`는 아직 아무도 import하지 않아 앱 청크에 들어가지 않습니다. 지연 청크 크기·`/catalog` 99.90 멈춤선 실측은 M3P-3이 연결한 뒤에 합니다.

## 6. Ego Lite (build + preview 4339)
- 창 상태 normal 확인(S0 때는 `task.cdp` 오류로 미확인, 마감 때 `page.cdp`로 확인).
- 정적 경로 goto 6회(`/thumbs/{key}.svg` — 앱 안 링크가 없어 BRIEF 허용 범위 안에서 1회씩) → viewBox 0 0 1280 960, 캡처 `captureBeyondViewport:false` + clip.
- 앱 `/` 같은 출처 `<img>` 6장 decode 1280×960 · 외부 요청 0 · 300px 격자 캡처 `s0/final-grid-300.png`.
- `finish({keep:[]})` → `listTaskSpaces()` = [] · preview PID 36202 종료 → `lsof -iTCP:4339 -sTCP:LISTEN` 결과 없음. main 5480·영환님 창은 건드리지 않았습니다.

## 7. 검증 명령 (fresh)
`npm run build` exit 0 · `npm run lint` exit 0 · `npm run typecheck` exit 0 · `npx vitest run` 243 파일 / 2149건 exit 0.

## 7-1. Codex
`codex-companion review --scope branch --base db9f25e` r1 실제 완료: **수정이 필요한 결함 0**. Codex는 typecheck·check-bundle-size를 실행해 통과를 확인했습니다. vitest는 Codex 샌드박스(읽기 전용 임시 디렉터리) 때문에 실행하지 못했고, 대신 7절의 로컬 fresh 실행(2149건 통과)으로 검증했습니다. 라운드 1회로 종료(상한 2).

## 8. 목업·명세와 다르게 한 점 / 남은 것
- 렌더 CSS를 build-thumbs에서 한 번 더 빌드합니다(앱 build가 dist를 비우고, 키 맵은 앱 build 전에 있어야 하기 때문). 배포 CSS와 바이트가 같은지는 check-bundle-size가 sha256으로 확인합니다. 빌드 시간은 약간 늘어납니다.
- 썸네일 글꼴은 시스템 대체 글꼴입니다(SPEC 3절에서 예정한 대가).
- `vite build`만 따로 실행하면 직전 build-thumbs 산출물을 씁니다. 산출물이 없으면 빌드가 실패합니다.
- M3P-3: 카드 `<img loading="lazy">`, `import()`로 키 맵 연결, 첫 화면 99.90 실측.
