# M2C-4 Developer 브리프 — 산출물 동봉(정적 HTML · PNG 이미지) · 부모 디코드 실패 수신 · F2 캡션

- 역할 Developer / Orca managed Claude Code / worktree m2c-4 / base `2fc32ba`(M2C-1·2·3S·3 병합). `app/node_modules` lock 그대로 `npm ci` 완료.
- 기준선(Jarvis M2C-3 검증): vitest 224파일 2009, `/studio` 진입 126.89 · 첫 91.76, `/profile` 99.61, 렌더 JS 84.19 / CSS 8.80. 예산 검사기 기준선 파일 127.39(127.36+0.03) — 변경 금지.
- 정본: `docs/design/m2c/SPEC.md` 5절(5.1 팩토리 주입 기본안 · 5.2 srcset 미사용 · 5.3 eager+decode 대기 · 잃은 이미지 문구 · 크기 표시 · F2 캡션)·7·8절 IMG-AC-23~28·26b(부모 쪽)·10절, `docs/04-plan/M2C_PLAN.md` M2C-4 행, MQ-M2C.md(C3-A 차단 없음·크기 표시·3MB 초과 안내 / C8-A "시안 (F2) — …" 문구). 참고: `dev/active/m2c-2/REPORT.md`(IMAGE_DECODE_FAILED 이월), `dev/active/m2c-3/JARVIS_FINAL.md`.

## 범위 (쓰기: `features/studio/staticHtml/**` · `png/**` · `exportFlow*` · `canvasCaption*` · `render/protocol.ts`의 `readRenderMessage` · `features/profile/compareFrame*` 사본 · 관련 테스트 · `dev/active/m2c-4/`)
1. 생성기에 `readImage`(파생본 전부) 주입 + `pickVariant`, 내보내기 render 요청에 images + `loading:"eager"`. 정적 HTML은 `data:` 단일 파일 유지, PNG는 decode 대기 뒤 rects(D-1 결정성 회귀 금지 — 이미지 포함 문서 PNG 반복 높이 동일 테스트).
2. **부모 IMAGE_DECODE_FAILED 수신**: `readRenderMessage` 원본과 `compareFrame` 사본을 **같은 커밋에서 동시 개정** — 결정 A 대조 가드(`compareFrameGuard.test.ts`) 단언·정규화 수정 금지, 가드가 통과해야 함.
3. 잃은 이미지 문구, 내보내기 결과 크기 표시·3MB 초과 안내(C3-A), F2 캔버스 캡션(C8-A).
- `ExportGenerator` 계약 변경이 필요해 보이면 멈추고 보고(SPEC 5.1).

## 규칙
- 예산: 시작 시 시제품 build 실측. `/studio` 진입 >127.39 또는 다른 라우트 ±0.03, 렌더 JS >89.70 전망이면 멈춤(SPEC 7절 순서로 배치 변경 ≤2회 뒤 보고). 검사기·기준선·한도 수정 0.
- 엔진·PageDoc 계약 변경 0. SPEC 10절 밖 테스트 깨지면 멈춤(가드 약화 금지). 4a 폰트·4b 모션·M2B-5 비교·D-1 PNG 결정성 불변.
- TDD: 단계별 RED 전 새 테스트 수 예측 커밋, RED 로그 `dev/active/m2c-4/logs/`. 단언 약화·skip 0. BRIEF P0 명시 커밋.
- **Ego Lite(영환님 지시):** 4337 loopback 자기 서버, 앱 안 클릭으로 이미지 넣기 → 정적 HTML·PNG 내보내기 실제 화면 확인(결과 파일을 열어 이미지 반영 육안 확인)·캡처 `dev/active/m2c-4/shots/`. 끝나면 이 레인이 연 Ego Lite 창·탭 모두 `finish({keep:[]})`로 닫고 `listTaskSpaces()`=[] 재확인 기록, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.
- **턴 관리:** 이전 레인이 마감 전에 턴 한도에 걸렸다. 70턴에 도달하면 새 구현 중단 → Ego Lite 확인 → 전체 vitest → REPORT 순으로 마감. Codex는 ≤2라운드, 2라운드 반영분 재검토 없음.
- 새 의존성 0, package*.json/lock·CLAUDE.md·docs/design·docs/decisions·`app/scripts/**` 수정 0. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- 마감: typecheck·lint·build(번들 전 행)·전체 vitest 기본 1회 exit0·Errors0(부하 타임아웃 시 단독 후 전체 1회 재시도·원시 로그), Codex review --scope branch --base 2fc32ba 실제 완료, REPORT(IMG-AC↔테스트·번들 전후·Ego Lite 확인/창 닫힘·meta·한계).
