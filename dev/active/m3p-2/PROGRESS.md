# M3P-2 PROGRESS — 실렌더 썸네일 파이프라인

base db9f25e · 브랜치 k002bill2/m3p-2 · Ego Lite preview 4339

## 체크리스트
- [x] P0 BRIEF 커밋
- [x] S0 ① SSR 정적 마크업 vs 렌더 문서 DOM 비교
- [x] S0 ② @media 1280 해소
- [x] S0 ③ 중첩 svg 네임스페이스 직렬화(XML 파싱)
- [x] S0 ④ 실제 <img src=svg> Ego Lite 시각 확인
- [x] referenceDoc (레퍼런스→렌더 입력)
- [x] SSR 빌드 모드 + SVG writer (thumbs/{id}.{hash}.svg, 1280×960)
- [x] THUMBNAIL_KEYS 지연 청크 맵
- [x] 빌드 가드 U8·G2·G3·G6
- [x] package.json scripts.build 단계 1개 (의존성 0)
- [x] check-bundle-size 썸네일 크기 출력·가드
- [x] Ego Lite 6장 확인·finish·서버 종료
- [x] typecheck·lint·build·vitest exit0
- [ ] Codex review ≤2
- [ ] REPORT

## TDD 예측 로그

## S0 판정 — **통과** (2026-10-06, base db9f25e 빌드 dist)
스파이크: 임시 vitest `src/thumbs/s0Spike.test.tsx`(커밋 안 함) + Ego Lite(taskSpace 6, preview 4339, dist/thumbs-s0/compare.html 정적 경로 goto 1회).
렌더 입력 = 비교 sectionPlan → `writeStartDoc`(앱 "편집 시작"과 같은 변형 맵·예시 문구) + 상세 팔레트 5역할·글꼴·간격 + 비교 카드·이미지 비율.
| # | 항목 | 결과 |
|---|---|---|
| ① | SSR `renderToStaticMarkup(PageDocument)` vs DOM | jsdom 클라이언트 렌더 6/6 구조 동일(태그·속성·style 선언 집합·텍스트). **실제 브라우저**: render.html iframe에 같은 doc·kitTokens → serialize 마크업 vs SSR 6/6 `same:true` |
| ② | @media 1280 해소 | 빌드 render CSS @media 46개(kit 42 + tailwind 4) → 0. 조건 = width 범위(rem×16)·screen·prefers-reduced-motion:no-preference(=거짓, 모션 최종 상태). 미지 조건은 throw |
| ③ | 중첩 svg 네임스페이스 | HTML 파싱 → XMLSerializer. XML 파싱 parsererror 0, 중첩 svg 2~7개 전부 `http://www.w3.org/2000/svg` (6/6) |
| ④ | `<img src=svg>` 시각 | 1280×960 img vs 렌더 문서 1280 캡처 거의 동일(차이 = iframe 스크롤바 폭). 300px 카드 크기에서도 데스크톱 레이아웃 유지·6장 hero 모양 구분 (`s0/grid-300.png`·`s0/ref-a-{frame,img}.png`) |
크기: SVG 원본 48.8~52.9KB · gzip 11.2~12.0KB(추정 12~18보다 작음). 글꼴 = @font-face 제거 → 시스템 대체.

## TDD 예측 (RED 전)
- `mediaQueries.test.ts` 4건: 모듈 없음 → import 실패 RED 예측.
- `thumbnail.test.tsx`: referenceDoc·entry·guards 없음 → import 실패 RED 예측. 구현 뒤 GREEN 예측(반례 10건 포함 — 가드가 실제로 잡는지).
- `thumbsImportGuard.test.ts`: 지금도 GREEN 예측(앱이 thumbs를 import하지 않음) — 가드 성격, 반례는 수동 확인.

## 구현 결과 (45cf45b)
- RED 확인: mediaQueries·thumbnail 테스트 = 모듈 없음 import 실패(예측 일치). GREEN: src/thumbs 21건.
- 전체 vitest 1차 2건 실패(예측 못함): engineImportGuard(`referenceDoc`의 엔진 type import) · brandIsolation(가드 정규식 안 이전 브랜드 문자열) → 엔진 타입은 `StartDocWrite`에서 파생, 브랜드 문자열은 brandIsolation과 같은 조각 이어 붙이기 관례. 가드 허용 목록·단언 수정 0.
- 최종: `npm run build` exit0 · lint 0 · typecheck 0 · `npx vitest run` 243 파일/2149건 exit0. 빌드 2회 키 동일(해시 고정).
- Ego Lite(taskSpace 6): 창 normal(page.cdp Browser.getWindowForTarget — S0 때는 "No web contents"로 미확인) · `/thumbs/{key}.svg` 6장 goto(정적 경로 1회씩) viewBox 0 0 1280 960 · 앱 `/`에서 같은 출처 `<img>` 6장 decode 1280×960 · 외부 요청 0 · finish({keep:[]}) → listTaskSpaces()=[] · preview PID 36202 종료 → lsof 4339 LISTEN 0.
