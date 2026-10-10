# GEN-MARK-2-SPEC Designer 브리프 — 출처 표식 후속 3건 (B-GM-01·02·03)

- 역할 Designer / Orca managed Claude Code / worktree `gen-mark-2-spec` / base main `d68006e`. **코드 0** — 산출물: `docs/design/gen-mark/SPEC-2.md`·`MQ-2.md`(기존 SPEC.md·MQ.md 수정 금지 — 병렬 없음이지만 정본 이력 보존) · `dev/active/gen-mark-2-spec/{PROGRESS,REPORT}.md`.
- 배경 정본: `docs/design/gen-mark/SPEC.md` r1 · `MQ.md`(결정 기록) · 구현 `app/src/components/catalog/SourceTags.tsx`·`ReferenceCard.tsx`·`pages/ReferenceDetailPage.tsx` · `dev/active/gen-mark-impl/REPORT.md` · BACKLOG B-GM-01~03.
- 대상:
  1. **B-GM-01** 비교 보드 `ColumnHeader`(`components/compare/ColumnHeader.tsx:63-66`)에 "생성 조합" 표식 — 좁은 4열(1280·1024·390) 열 머리 폭 제약 안 배치·축약 여부·`SourceTags` 재사용 가능성 · `/compare` 진입 직후 122.72/125 예산 영향(조작 뒤 청크 여부).
  2. **B-GM-02** 상세 메타 줄 `buildNote`에 내부 버전 "internal-compose-1" 노출(`domain/internalCompose.ts:189`) — 사람 말 문구로 바꿀지·숨길지. 생성기 데이터 변경이면 G5 해시·썸네일 영향 명시(엔진 계약 아님 확인).
  3. **B-GM-03** 라이선스 Tag 영문 원값(`internal`/`licensed`) — 한국어 표기안(예: "자체 제작"/"라이선스 확보" 등 후보 비교) · 스크린리더 접두 "라이선스"(GM-AC-U3)와의 결합 문장 · 필터·데이터 값은 영문 유지(표시만 변환) 여부.
- 공통: SPEC 필수 절(목적·범위/제외 · 흐름/상태 · 1280·1024·390 구조 · 문구 원문 · 접근성 · 수용 기준 표 GM2-AC-* · 구현 영향(예상 파일·라우트별 예산 — `/catalog` 100.33/멈춤 100.90 · `/references` 97.76/100 · `/compare` 첫 화면 98.91/100 · `/profile` 99.90/100 · `/studio` 129.63/129.65 — `/studio`·`/profile` closure 무접촉 원칙) · 위험). MQ는 질문마다 2~4안 + ★ + 근거 한 줄, 엔진 계약·스키마·예산 증액이 필요한 선택지는 표시.
- 필요하면 현재 화면 Ego Lite 캡처(포트 4363 · `npm ci`·`npm run build`·`npx vite preview --host 127.0.0.1 --port 4363 --strictPort` · 뷰포트 clip · PNG 바이트 기록 · `finish({keep:[]})`·서버 종료). 영환님 창·main 5480 무접촉.
- Codex `codex-companion adversarial-review`로 SPEC-2·MQ-2 1회 검증(P1이면 고치고 1회 더).
- 근거 파일:행 · 추정 표시 · 첫 3턴 PROGRESS 커밋 · push/merge 0 · amend·rebase 금지 · 시간 상한 60분 · 35턴부터 REPORT만. 서브에이전트 분할: 불필요.
