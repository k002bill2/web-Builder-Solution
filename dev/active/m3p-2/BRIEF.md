# M3P-2 Developer 브리프 — 카탈로그 실렌더 썸네일 파이프라인 (빌드 시 SVG)

- 역할 Developer / Orca managed Claude Code / worktree m3p-2 / base `db9f25e`(M3P-0 명세 병합, MQ-M3P-1 ★A). `app/node_modules` lock 그대로 `npm ci` 완료.
- 정본: `docs/design/m3p/SPEC.md` r2 3절(썸네일 방식 A·위험)·9절(S0 통과 조건)·AC U8·G2·G3·G6, `docs/04-plan/M3P_PLAN.md` 1절 M3P-2 행·2절 쓰기 경로(**W 표시 경로만**), `docs/design/m3p/MQ.md` 1-A·결정 기록(빌드 단계 추가 허용 · **새 의존성 0**).
- 병렬 레인 M3P-1(생성기: `domain/internalCompose*`·`scripts/generate-internal-refs.*`·`fixtures/generated*`·라우트 로더·`domain/reference.ts`·`referenceRepository.ts`) — 그 경로 수정 금지. 이 레인은 **기존 6개 레퍼런스만**으로 끝까지 검증.

## 순서
1. **S0 스파이크(먼저, 판정 기록)**: 킷 3변형으로 ① `react-dom/server` 정적 마크업 vs 렌더 문서 실제 DOM 구조 비교 ② 킷 `@media` 42개를 1280 기준으로 해소 ③ 중첩 `svg` 네임스페이스 보존 직렬화(XML 파싱 검사) ④ 실제 `<img src=…svg>`로 Ego Lite에서 시각 확인(캡처). **하나라도 실패면 구현 없이 멈춤 보고**(MQ-M3P-1 재결정 — B/C).
2. 통과 시: 레퍼런스→렌더 입력 변환(`referenceDoc`) → SSR 빌드 모드 + SVG writer(`thumbs/{id}.{hash}.svg`, viewBox 1280×960, 해시 고정) → `THUMBNAIL_KEYS` 지연 청크 맵 → 빌드 가드(AC-U8·G2·G3·G6) → `package.json` `scripts.build`에 단계 1개(의존성 추가 0) · `check-bundle-size.mjs`는 썸네일 산출 크기 출력·가드만(판정 로직 변경 0).
3. 카드 UI 연결은 하지 않음(M3P-3 몫). 썸네일 산출물·키 맵까지.
4. TDD — 단계별 예측은 PROGRESS(RED 테스트 tip 커밋 금지), 단언 약화·skip 0. 번들: 앱 manifest에 SSR·생성 모듈 0(G3), `/catalog` 첫 화면 99.90 멈춤선, 렌더 문서 변화 0.
5. **Ego Lite(영환님 지시):** `npm run build` + `npx vite preview --host 127.0.0.1 --port 4339 --strictPort`(dev 금지 · 병렬 M3P-1은 4337). 새 taskSpace → 창 minimized면 `Browser.setWindowBounds {windowState:"normal"}`, 캡처 `captureBeyondViewport:false`+뷰포트 clip(fullPage 금지). 산출 SVG 6장을 같은 출처 `<img>`로 열어(앱 안 링크가 없으면 preview 서버의 정적 경로로 goto 1회씩 허용 — 기록) 실렌더 모양 확인·캡처. 끝나면 이 레인 창·탭 `finish({keep:[]})` · `listTaskSpaces()`에 이 레인 공간 없음 재확인, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.
6. 마감: typecheck·lint·build · 전체 vitest 1회 exit0 · Codex review --scope branch --base db9f25e 실제 완료(≤2) · REPORT(S0 판정·SVG 크기 표·번들·Ego Lite).

## 금지·운영
- **새 의존성 0**(Playwright·Puppeteer·헤드리스 도구 설치 금지 — 필요하면 멈춤·MQ). 엔진·PageDoc 계약 변경 0, docs/**·lock·CLAUDE.md 수정 0, M3P-1 쓰기 경로 0, 외부 URL·폰트·이미지 0, APFS 0. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** **턴 관리:** 50턴 도달 시 새 구현 중단 → Ego Lite → vitest → Codex → REPORT. REPORT는 마지막 5턴 전 커밋·PROGRESS 일치.
