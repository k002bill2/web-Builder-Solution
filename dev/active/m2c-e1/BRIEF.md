# M2C-E1 Developer 브리프 — 잃은 이미지 상태 PNG 실패(E-1) 원인 판정·수정

- 역할 Developer / Orca managed Claude Code / worktree m2c-e1 / base `9ecc4cf`(M2C-REQA 병합, 조건부 Go). `app/node_modules` lock 그대로 `npm ci` 완료.
- 출처: `dev/active/m2c-reqa/REPORT.md` 3·6절 E-1 — 이미지 2장 넣기 → 툴바 "프로젝트로 돌아가기" → 같은 프로젝트 편집기 복귀(잃은 이미지 2장) → "PNG 내려받기" 4/4 즉시 실패, `role=alert` "PNG를 만들지 못했습니다", `png_failed reason=INFRA`(= `pngCapture.ts` 173행: PngError가 아닌 예외), 콘솔 오류 0. 대조(이미지 잃기 전 PNG) 미실측. 증거 `dev/active/m2c-reqa/logs/t5-*.txt`·`shots/t5-png-notice.png`.
- 관련 코드: `features/studio/png/pngCapture.ts`(capturePng 99~126, exportImages 116), `features/studio/staticHtml/exportImages.ts`, `images/store/imageStore.ts`(imageMeta·pickVariant), `StudioLayout.tsx` 이미지 맵, 렌더 쪽 `render/**`(images 없는 id·IMAGE_DECODE_FAILED).

## 순서 (PROGRESS·명시 경로 커밋)
1. **원인 판정(코드 변경 전)**: 대조 실측 — Ego Lite 앱 안 클릭으로 ① 이미지 없이 PNG ② 이미지 넣고 PNG ③ 이탈·복귀(잃은 이미지) 뒤 PNG. 예외를 실제로 잡아 스택·메시지 기록(필요 시 임시 진단 로그는 커밋하지 말 것). 분류: (a) 잃은 이미지 경로 코드 결함 (b) 이탈·복귀 일반(이미지 무관) 결함 (c) 환경 한계. 원시 로그 보존.
2. (a)/(b)면 재현 단위 테스트 RED(RED 전 새 테스트 수 예측 커밋) → 최소 수정 GREEN. SPEC m2c r3 5.3·9절 QB-10(잃은 이미지 = 자체 그래픽 + 개수 문구, PNG 성공)·D-1 PNG 결정성·IMAGE_DECODE_FAILED 정책 불변. 실패를 성공처럼 숨기는 수정 금지(정상 실패 사유는 PngError 코드로).
3. (c)면 코드 0, 증거로 환경 한계 증명·REPORT.
4. 가능하면 ③ 경로에서 정적 HTML 개수 문구도 확인(게이트 차단 시 앱 안 조작으로 통과 문서 만들기 시도, 못 하면 사유).

## 규칙
- 예산: `/studio` 진입 >127.39·다른 라우트 ±0.03·렌더 JS >89.70 시 멈춤. 엔진·PageDoc·ExportGenerator·렌더 계약 변경 필요 시 멈춤 보고. SPEC 10절 밖 테스트 깨지면 멈춤. 단언 약화·skip 0. BRIEF P0 명시 커밋.
- **Ego Lite(영환님 지시):** 4337 loopback 자기 서버, 앱 안 클릭만·새로고침 금지, 대조 3경로 실제 화면 확인·캡처 `dev/active/m2c-e1/shots/`(수정 후 ③ PNG 성공 화면·결과 파일 육안 포함). 시작 전 `listTaskSpaces()` 확인, ego-browser는 env 미전달이라 space id 직접 기입. 끝나면 이 레인이 연 Ego Lite 창·탭 모두 `finish({keep:[]})` · `listTaskSpaces()`=[] 재확인 기록, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.
- 새 의존성 0, package*.json/lock·CLAUDE.md·docs/**·scripts 수정 0. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **턴 관리:** 45턴 도달 시 새 작업 중단 → Ego Lite 창 닫기 → 전체 vitest → REPORT. 마감: typecheck·lint·build·전체 vitest 기본 1회 exit0(부하 실패 시 단독 후 전체 1회), Codex review --scope branch --base 9ecc4cf 실제 완료(≤2), REPORT(분류·근거·RED/GREEN·전후·Ego Lite/창 닫힘·meta).
