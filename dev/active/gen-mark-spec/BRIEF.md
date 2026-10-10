# GEN-MARK-SPEC Designer 브리프 — B-M3P-03 상세 화면 "생성 조합" 표식 · 썸네일 Tag 겹침

- 산출물: `docs/design/gen-mark/SPEC.md` · `docs/design/gen-mark/MQ.md` · `dev/active/gen-mark-spec/{PROGRESS,REPORT}.md`. 구현은 이 SPEC 확정 뒤 별도 Developer 레인.
- 배경: BACKLOG B-M3P-03 — 상세 화면에 "생성 조합" 표식 없음(`ReferenceDetailPage.tsx:43` buildNote 문장뿐), 카드에는 `ReferenceCard.tsx:121` Tag. 라이선스/생성 조합 Tag가 썸네일 header 내비·CTA를 덮음. 관련: `docs/design/m3p/SPEC.md`·`MQ.md`, `dev/active/m3p-4-qa/`(QA QB-05), PRD 원칙 4(권리 경계).
- 설계 범위: 상세 화면의 출처 구분 표식(큐레이션 internal/licensed vs 생성 조합) 위치·문구·위계, 카드 Tag와의 일관성, 썸네일 위 Tag 배치(겹침 해소 — 썸네일 안/밖, 크기), 390·1024·1280 반응형, 스크린리더 문구.
- 시각 확인: 필요하면 `npm ci`·`npm run build`·`npx vite preview --host 127.0.0.1 --port 4351 --strictPort`로 현재 화면을 Ego Lite 뷰포트 캡처(2~3장, `dev/active/gen-mark-spec/shots/`, PNG 바이트 수 확인) 후 정리(`finish({keep:[]})`·서버 종료). 영환님 창·main 5480 무접촉.

## 공통 (3개 Designer 레인 병렬 — RESTART-SPEC · FIELD-UNDO-SPEC · GEN-MARK-SPEC)
- 역할 Designer / Orca managed Claude Code / base main `18e5e12`(origin 반영 완료). **코드 0** — 산출물은 이 레인 디렉터리의 `SPEC.md`·`MQ.md`와 `dev/active/<레인>/PROGRESS.md`·`REPORT.md`뿐. `app/`·BACKLOG·다른 SPEC·CLAUDE.md·design/ 수정 0(다른 레인과 쓰기 경로 분리).
- 원칙: ADR-003(기능·사용자 흐름 → 사용성(실데이터·상태·접근성·반응형·성능) → DS 일관성 → 목업, px는 기준 아님) · ADR-002 브랜드 · 기존 SPEC 문체·번호 체계(수용 기준 ID·[U]/[E] 표기)를 따른다.
- SPEC 필수 절: 목적·범위/제외 · 사용자 흐름(정상·빈·오류·경고·진행 중 상태) · 화면 구조·정보 위계(1280·1024·390) · 문구 원문(한국어) · 접근성(포커스 이동·라이브 영역·키보드) · 수용 기준 표(ID·조건·검증 수단) · 구현 영향 추정(예상 파일·`/studio` 진입 예산 영향 — 현재 129.28/멈춤 129.65, `/profile` 99.87/100 — 진입 closure를 건드리면 조작 뒤 청크 설계 제시) · 위험.
- MQ.md: 영환님·Jarvis 결정이 필요한 질문만, 질문마다 선택지 2~4개 + ★권장안 + 근거 한 줄. 엔진 계약·저장 스키마·예산 증액이 필요한 선택지는 그 사실을 명시.
- 근거는 코드·기존 SPEC 행 인용(파일:행). 추정은 추정으로 표시. 서브에이전트 분할: 권장(읽기 전용 조사 — 관련 코드 경로 / 기존 SPEC·QA 기록 — 2개 이하), 파일 쓰기는 메인만.
- 첫 3턴 안 PROGRESS 커밋 · SPEC 초안 커밋 → MQ 커밋 → REPORT 커밋(로컬 커밋만, push/merge 0, amend·rebase 금지). 시간 상한 60분 · 30턴부터 다듬기 금지·REPORT만.
