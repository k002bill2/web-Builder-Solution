# M2A-CLOSE-DESIGN — M2a 마감 시각 QA + 오버레이 문제 문장 겹침 결정안 (Designer)

- 책임 Designer / 실행 Orca + Claude Code · 보고 Jarvis · 포트 **4339** · `--max-turns` 60 · `--effort` medium · **45턴부터 REPORT 마감 우선**
- 서브에이전트 금지(429 이력) · 시작 커밋 = main `b8a270b`
- **읽기 전용 레인: 앱 코드(`app/`) · `design/` · `docs/` 수정 0.** 쓰기는 `dev/active/m2a-close-design/`(REPORT · shots · logs · 선택적으로 시안 HTML)만.
- 병렬 레인: **M2A-CLOSE-DEV**(Developer, 4337, P2 6건)가 같은 시각 코드를 고친다. 그 레인 경로·포트에 손대지 않는다.
- 영환님 ★A(2026-10-04)

## 목적
M2a 수직 슬라이스(실렌더 캔버스 → 정적 HTML → PNG)를 **사용자 눈으로** 1280 · 390에서 점검하고, 미뤄 둔 **오버레이 문제 문장이 렌더된 글자 위에 겹치는 문제**에 대한 결정안(추천 1개 + 대안)을 낸다. 구현은 Jarvis가 영환님 결정 뒤 Developer에게 넘긴다.

## 근거
- `docs/design/2a-05/SPEC.md` 5.7(오버레이 r4.8 — 선택 테두리 · 라벨 칩 · 문제 2중 테두리 · 배지 · 문제 문장) · r4.9~r4.12 · `docs/design/m2a/SPEC.md` 3.3(PNG) · K-AC 표
- `app/src/components/studio/StructureCanvas.tsx` 113행 부근(부모 오버레이) · `dev/active/m2a-2b/REPORT.md` 2절 · 77행(겹침 대기)
- 결과물 표본: `dev/active/m2a-3b/logs/j-export-sample_r2.html` · `dev/active/m2a-3c/shots/c4-png-{1280,390}.png`
- 디자인 원칙: 실무형 · 절제 · 정보 계층 · 밀도 · 반응형. APFS 로고·`--apfs-*` 사용 금지(목업 브랜드는 디자인만 채용).

## 범위
- **V0** REPORT 골격 커밋(1 점검 환경 · 2 화면별 소견 표 · 3 오버레이 겹침 분석 · 4 결정안 · 5 결과물(HTML·PNG) 대조 · 6 접근성 · 7 남은 위험 · 8 서버).
- **V1 환경**: 이 worktree `app/`에서 `npm run build` → `npx vite preview --host 127.0.0.1 --port 4339 --strictPort`. 시드 프로젝트로 `/studio/:projectId` 진입.
- **V2 캔버스 시각 QA** 1280 · 390(필요하면 768): 데스크톱 축소 보기 · 선택 칩 · 문제 표시 · 게이트 패널 · 내보내기 묶음 · PNG 묶음 4상태 중 볼 수 있는 것. 소견마다 심각도(차단/높음/보통/낮음) · 근거 캡처 · SPEC 조항.
- **V3 오버레이 겹침**: 문제가 있는 섹션을 만들어(앱 안 조작만) 1280 · 390에서 겹침 재현 캡처 → 원인(위치 계산 · 축소 비율 · z 순서 · 문장 길이) → **결정안 2~3개 + 추천 1개**. 각 안: 시각 시안(캡처 위 주석 또는 `dev/active/m2a-close-design/mock-*.html`) · SPEC 5.7 변경 문장 초안(Jarvis가 기록) · 예상 구현 위치 · `/studio` 진입 번들 영향 추정(진입 여유 0.50KB — 진입 코드 증가가 큰 안은 표시) · 접근성(`aria-describedby` 연결 유지 · 대비 4.5:1).
- **V4 결과물 대조**: 앱에서 새로 정적 HTML · PNG를 내보내 1280 · 390에서 캔버스와 나란히(같은 순간). 차이 목록.
- **V5** REPORT 마감 · 서버 종료.

## 캡처 규칙
- 샌드박스 iframe은 fullPage 캡처 금지 — `scrollIntoView` 뒤 viewport 캡처. ego-browser `Page.captureScreenshot` 시간 초과가 반복되면 1장당 재시도 2회 → Chrome headless `--screenshot`(390은 390 폭 iframe 감싸기).

## 공통 규칙
- 커밋은 `git commit -- dev/active/m2a-close-design` 만. 로컬 커밋만. **push · 병합 · 삭제 금지.**
- 새 의존성 0. GDWEB · dbcut 접속 · 크롤링 금지.
- 서버는 4339만, 끝날 때 **자기가 띄운 서버 PID 전부 종료** + `lsof -nP -iTCP:4339 -sTCP:LISTEN` 결과 0을 REPORT 8절에.

## 수용 기준
1. 1280 · 390 캔버스 소견 표(심각도 · 캡처 · SPEC 조항).
2. 오버레이 겹침 재현 캡처 + 원인 + 결정안 2~3개(추천 1개 · SPEC 문장 초안 · 번들 영향 추정).
3. 정적 HTML · PNG ↔ 캔버스 나란히 대조.
4. 앱 코드 변경 0 · REPORT 자리표시 0 · 서버 0.
