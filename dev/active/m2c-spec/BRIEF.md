# M2C-0 Designer 브리프 — 이미지(업로드 변환 · 자체 그래픽 · 산출물 동봉) 명세·계획

- 역할 Designer / Orca managed Claude Code / worktree m2c-spec / base `92f8e2f`(M2b 완료, origin 반영).
- 영환님 ★A(2026-10-05): 다음 마일스톤 = M2c 이미지. 기능·솔루션 우선, 목업 모양 복제 금지. 이 레인은 **명세·계획 문서만**(코드 0).

## 정본·현재 사실 (L1로 먼저 확인)
- `docs/04-plan/DEVELOPMENT_PLAN.md` 19행 M2c = "토큰 기반 자체 그래픽(결정적 SVG) · 업로드 변환(WebP·srcset) · 산출물 동봉 | F2 시안 등급", 1주 추정.
- `docs/03-trd/TRD.md`: TR-SEC-04(업로드 MIME·매직바이트·확장자·10MB·40MP·EXIF 제거·원본 비공개), TR-POL-01(생산 스키마에 외부 URL·이미지 필드 금지), R-09(대체텍스트), 8절 성능(AVIF/WebP+srcset), 272행 `public/assets/*`.
- `docs/00-research/buzz/claude-opus-5.5-r2.md` 174행: 브라우저 캔버스 폭 3~4단 재인코딩·EXIF 제거, **Safari `toBlob('image/webp')` 미지원** 주의, 최소 백엔드 0(VS-1~M2c).
- 이월 결정: SPEC-BODY MQ-B3(원본 가로세로 메타·벽돌형 원본 비율), SPEC-BOUND MQ-B3(hero/grid 여러 장은 M2c 뒤 검토 — 새 슬롯 = 엔진 계약 변경), m2a SPEC 114행(srcset·AVIF/WebP는 M2c), m2a 569행(F2 이후 "최종 시안" 문구는 M2c), BACKLOG B-M2B-01(지도 캡처 권리 안내), B-M2B-09(실제 로컬 이미지 갤러리 미검증).
- 현재 코드: `app/src/kit/Media.tsx`(images[image.source] 있으면 img, 없으면 그라디언트 aria-hidden), `kit/text.ts` slotImage, 문서 이미지 맵·업로드 경로(편집기 a3-3 미구현 여부 포함)를 grep으로 확인. 정적 HTML은 `data:`만 허용(`assertNoExternalCss` 등), PNG는 SVG foreignObject.
- 예산(ADR-004 개정4): 렌더 JS 83.03/89.70 · CSS 8.75/30 · `/studio` 진입 127.36/128(멈춤선 127.37 — 사실상 여유 0) · `/profile` 첫 99.62/100.

## 산출물 (쓰기: `docs/design/m2c/`, `docs/04-plan/M2C_PLAN.md`, `dev/active/m2c-spec/`만)
1. `docs/design/m2c/SPEC.md`
   - **업로드·변환**: 진입 위치(편집기 이미지 슬롯), 허용 형식·검증(TR-SEC-04), 재인코딩 폭 단계·포맷(WebP 불가 브라우저 대체), EXIF 제거, 원본 보관 여부(브라우저 메모리/IndexedDB 등 — 서버 0 전제), 실패·진행 상태 문구, 대체텍스트 입력(R-09·장식 표시).
   - **원본 비율 메타**: width·height 기록, 벽돌형·hero·갤러리에서의 사용 규칙(MQ-B3 이월).
   - **자체 그래픽(결정적 SVG)**: 이미지 없는 슬롯의 기본 그래픽을 그라디언트에서 토큰 기반 결정적 SVG로 바꿀지 범위·규칙(같은 입력 → 같은 출력, 외부 자산 0, 장식 aria-hidden).
   - **산출물 동봉**: 정적 HTML(단일 파일 `data:` 유지 vs 크기 — 폰트 1MB와 합산 예산), PNG 반영, srcset이 단일 파일 HTML에서 의미 있는지 판단, 렌더 iframe 전달 경로(sandbox `allow-scripts`만·`allow-same-origin` 금지 유지).
   - **보안·권리**: TR-POL-01(생산 스키마 외부 URL 금지)와 사용자 업로드의 경계, 원본 비공개, 지도 캡처 권리 안내(B-M2B-01).
   - **예산 계획**: `/studio` 여유 사실상 0 → 업로드·변환 코드를 조작 뒤 청크로 두는 배치 계획, 멈춤선. 상향이 필요해 보이면 대안과 함께 MQ로(구조 점검 레인 선행 규칙 — ADR-004 개정4).
   - **수용 기준(IMG-AC [U]/[G]/[B])·QB**, 깨질 기존 테스트 예상, 대상 브라우저(Safari·Firefox 실측 환경 없음 → 모의 한계 명시).
2. `docs/04-plan/M2C_PLAN.md`: Developer 레인 분할(각 레인 1산출물, 턴 예산 고려), 순서·의존성, 레인별 예상 시간(추정 표기), QA 게이트.
3. `docs/design/m2c/MQ-M2C.md`: 영환님 결정 필요 항목만 번호 선택지 ★추천·트레이드오프·사실/추정 구분.
4. `dev/active/m2c-spec/{PROGRESS.md,REPORT.md}`.

## 금지·운영
- 코드·package*.json/lock·CLAUDE.md·`docs/decisions/` 수정, 새 의존성 제안 시 MQ로만. 외부 크롤링·GDWEB/dbcut·외부 스톡 수집 0, APFS 브랜드 0.
- 서브에이전트 0, 서버 필요 시 4337/4339 loopback·자기 PID 종료, main 5480 무접촉, push/merge/삭제 0, 승인 실패 우회 금지.
- Codex review/adversarial 1~2라운드 실제 완료만 기록. 50턴부터 REPORT 마감 우선. 한국어 보고.
