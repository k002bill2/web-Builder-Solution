# M4-a-0 BRIEF — 내보내기 완성 명세 (정적 zip · LICENSES · 금지 패턴 · 링크 검사) (Designer)

책임 역할: Designer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18 (영환님 "M4-a ★ 일괄")
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/m4a-export-spec` (브랜치 `k002bill2/m4a-export-spec`, base origin/main `a520e770`). 쓰기 경로: `docs/design/m4a/EXPORT-SPEC.md`(신설) · `dev/active/m4a-export-spec/`만. 앱 코드 0.
병렬: `m4a-zip-spike`(Developer 측정 스파이크, 앱 코드 측정 전용) — 서로 입력 아님. 스파이크 결과는 SPEC r1에서 Jarvis가 합친다.

## 영환님 결정 (2026-10-18 · `dev/active/rs8-roadmap-status/REPORT.md` 5절)
1. `/studio` **진입 증분 0** 조건(형식 선택 UI가 진입을 늘리면 개정 18 재상신) 2. zip = **무압축 store 자체 작성, 의존성 0** 3. React zip = M4-b(이번 제외) 4. 4.3 사용량 원장 폐기 5. axe 보류(현 단위 가드 수용) 6. BACKLOG 정리는 Jarvis.

## 정본·입력
- `docs/04-plan/DEVELOPMENT_PLAN.md` M4 4.2 · PRD/TRD 내보내기 조항(TRD:204 zip, PRD FR-PUB-*) · `dev/active/rs8-roadmap-status/REPORT.md` 2절 M4 진단 · 현 구현 `features/studio/{exportFlow.ts,staticHtml/**,png/**}`·`components/studio/ExportAfter.tsx`·게이트(`gateCheck.ts`·`gateView.ts`) · BACKLOG B-M2C-01(`HTML_MAX` 8M < 이미지 30MB) · B-M2C-09.

## 산출 `EXPORT-SPEC.md`
1. **형식 체계**: 정적 HTML 단일 파일(현행) · **정적 zip(신규)** · PNG — 사용자가 고르는 방식(대화상자 vs 버튼 분기), 기본값, 각 형식 언제 쓰나.
2. **zip 구성**: 파일 트리(`index.html` · `assets/images/*` · `assets/fonts/*` · `LICENSES.md` · 기타) · 이미지 분리 규칙(data URI → 파일 경로) · 파일 이름 규칙(`exportFileName.ts` 계승) · 크기 상한·초과 안내.
3. **LICENSES.md 문안 구조**: 폰트(자체 호스팅 폰트별 라이선스) · 이미지(사용자 업로드 = 사용자 소유 고지 · 자체 SVG) · 앱 고지 — 문안은 Hemingway 몫이므로 구조·필수 필드만.
4. **금지 패턴 검사 확장**: 현 정적 HTML 검사 목록 대조 + zip 파일 목록 허용표(확장자·경로) · 외부 href 정책 · 브랜드 문자열.
5. **링크 검사(게이트 +1줄)**: 내부 앵커 대상 존재 · 외부 링크 형식 · 게이트 표시 위치·문구 키.
6. **상태 설계**: 생성 중·성공·실패(용량·이미지 누락·브라우저 다운로드 차단)·취소 — 상태표 · 포커스·live region(편집기 셸 status 1·alert 1 원칙, `docs/design/restart/UX-POLISH-1.md` P-1~P-3 정합) · 390/1280.
7. **수용 기준 `EXP-AC-NN`**(단위/실화면 구분) · 예산 제약(진입 0 — 대화상자·zip 생성기 전부 조작 뒤 청크) · 깨질 기존 테스트 예상.
8. **설계 질문**(번호, ★권장) — 추측 금지.
- 실화면 관찰이 필요하면 preview `--port 4393 --strictPort` 1회(관찰만). 외부 사양 확인은 1~2회(zip 형식 APPNOTE 등) 출처 URL 기록.
- 서브에이전트: 불필요. 최대 45턴, 35턴부터 마감.

## 공통
- 명시 경로 커밋, amend·rebase·push·merge·원격 쓰기 0. 첫 3턴 BRIEF·PROGRESS 커밋. **REPORT(또는 산출 문서) 초안은 15턴 안에 먼저 커밋**, 이후 보강(중단 대비). 사실/추정/미확인 구분.
- preview를 띄우면 마지막 커밋 직전 종료 → `lsof -nP -iTCP:<포트> -sTCP:LISTEN` 출력 0을 REPORT에 기록.
- 마감 전 `git status --short`가 node_modules 외 빈 값.
