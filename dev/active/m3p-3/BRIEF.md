# M3P-3 Developer 브리프 — 카탈로그 카드 실렌더 썸네일 연결 + M3P-1 Codex P2 편입

- 역할 Developer / Orca managed Claude Code / worktree m3p-3 / base `cdad1e8`(M3P-0·1·2 병합). `app/node_modules` lock 그대로 `npm ci` 완료.
- 정본: `docs/design/m3p/SPEC.md` r2 4절(카드·필터·상세)·5절(상태)·6절(예산)·7절(접근성)·8절(AC-U5·U6·G4), `docs/04-plan/M3P_PLAN.md` 1절 M3P-3 행·2절 쓰기 경로, `docs/design/m3p/MQ.md` ★A 기록, `dev/active/m3p-1/REPORT.md`(Codex P2)·`dev/active/m3p-2/REPORT.md`(8절 M3P-3 할 일).

## 범위 (순서)
1. **S0 실측(코드 변경 전, PROGRESS 기록)**: 현재 `/catalog` 첫 99.86 / 멈춤선 **99.90**(여유 0.04) · `/studio` 128.66 / **128.70** · `/compare` 진입 121.97 / **124.70** · `/profile` 첫 99.74 · 렌더 84.19/8.85(변화 0 유지). 생성 15개 썸네일이 빌드에 자동 포함되는지(21장) 확인.
2. **카드 썸네일**: `ReferenceCard`에 `<img loading="lazy" decoding="async">`(같은 출처 `thumbs/{id}.{hash}.svg`) + 기존 팔레트 와이어를 배경·폴백으로. `THUMBNAIL_KEYS`는 **`import()` 지연**(첫 화면 청크에 넣지 않음). 카드 높이 로드 전후 동일(레이아웃 이동 0). 이미지 실패 → img 제거·와이어 `role="img"` 이름 복귀·알림·콘솔 0(AC-U6). "생성 조합" Tag·"미측정"(AC-U5).
3. **Codex P2-1(사용자 결함, 필수)**: `useCatalogRepository.ts:19-21` — 비교 트레이(`useTrayReferences`)가 생성 카드를 못 찾아 개수·제목·제거 버튼 누락. 트레이 조회에도 생성 카드 로더 연결. RED(생성 카드만 담으면 트레이 1개) → GREEN.
4. **Codex P2-2(방어)**: `internalCompose.ts:278-279` 팔레트 0개면 예외 대신 부족 리포트 반환. RED → GREEN. 생성 픽스처 재생성 결과 변화 0(`--check`).
5. **예산**: 멈춤선 초과 시 ① 상쇄(지연 import·공유 코드 이동)를 먼저 시도·표로 기록 ② 그래도 넘으면 **구현 멈추고 보고**(예산 상향·ADR 변경 요청 금지 — Jarvis가 결정). `/compare` 124.70 넘으면 MQ-7 분리 청크.

## Ego Lite (영환님 지시)
- `npm run build` + `npx vite preview --host 127.0.0.1 --port 4337 --strictPort`(dev 금지). 새 taskSpace → 창 minimized면 `Browser.setWindowBounds {windowState:"normal"}`, 캡처 `captureBeyondViewport:false`+뷰포트 clip(fullPage 금지). 첫 goto 1회 뒤 앱 안 클릭만·새로고침 금지.
- 확인: `/catalog` 1280 첫 줄 실렌더 썸네일·레이아웃 이동 0, 생성 카드 "생성 조합"·"미측정", 생성 카드 비교 담기 → 트레이 개수·제목·제거 표시, 외부 요청 0. 캡처 ≤4장(`dev/active/m3p-3/shots/`).
- 끝나면 이 레인 창·탭 `finish({keep:[]})` · `listTaskSpaces()`=[] 재확인, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.

## 마감·금지
- typecheck·lint·build(번들 표 전 행) · 전체 vitest 1회 exit0(부하 실패 시 단독 후 전체 1회) · Codex review --scope branch --base cdad1e8 실제 완료(≤2) · REPORT.
- TDD: 단계별 예측 PROGRESS, RED 테스트 tip 커밋 금지, 단언 약화·skip 0. 예산 상쇄로 순서가 바뀌면 정직 기록.
- 엔진·PageDoc 계약·`src/thumbs/**` 생성 로직·`check-bundle-size` 판정·docs/**·lock·CLAUDE.md 수정 0, 새 의존성 0, 외부 URL·이미지 0, APFS 0. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** **턴 관리:** 45턴 도달 시 새 구현 중단 → Ego Lite → vitest → Codex → REPORT. REPORT 초안은 50턴 전 커밋·PROGRESS 일치.
