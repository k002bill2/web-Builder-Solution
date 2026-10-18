# M4-b-1 BRIEF — React zip 내보내기 명세(REACTZIP-SPEC) (Designer)

책임 역할: Designer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18 (영환님 "1" — Q1 (a)안 · Q2 개정 20 +0.03 · Q3 버전 고정+lock 동봉 · Q7 motion/react 제외·PRD 개정)
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/m4b-spec` (base `515b284c` + 이 브랜치의 ADR 개정 20·PRD/TRD 커밋).
정본: `dev/active/m4b-spike/REPORT.md`(결론 줄·2절 zip 구성·5절 Q1~Q9) · PRD FR-PUB-02(개정) · TRD:70·314 · `docs/design/m4a/EXPORT-SPEC.md` r1(버튼·결과·실패·Q18) · ADR-004 개정 20.

## 산출: `docs/design/m4b/REACTZIP-SPEC.md`
1. 진입·버튼: EXPORT-SPEC의 내보내기 메뉴에 "React 프로젝트(zip)" 추가 위치·문구 자리(문구는 [문안 미정] 표시 — Hemingway가 씀)·진행·성공·실패·재시도(`retryableImport` 재사용)·읽기 전용 탭(B-M4A-12와 같은 READ_ONLY 분류).
2. 산출 zip 트리·허용표(M4-a 표와 분리, Q4): 경로 규칙·개수·크기 상한·`site.json` 스키마(doc·kitTokens·motion·mainStyle)·이미지 `src/assets/images/img-NN.ext`·글꼴 서브셋 재사용.
3. 의존성: 버전 고정 9개(스파이크 목록에서 motion 제외) · `package-lock.json` 생성·갱신 절차(Linux CI 산출, 갱신 시 대조 테스트) · `engines` 명시(Q9 ★) · build = `tsc --noEmit && vite build`(Q8 ★).
4. 충실도 계약: 렌더 iframe 대비 DOM 정규화 동일 + 스크린샷 비교 기준 · 앱 DS 값 누수는 Q6 A(템플릿에 값 복사) · 메뉴 닫기 스크립트 필수 · 이미지 있는 문서·390 폭 포함 검증 매트릭스.
5. 수용 기준 RZ-AC-xx · 테스트 계획(생성 단위·허용표·lock 대조·zip 풀어 `npm ci && npm run build` CI 잡 설계 — 네트워크 필요 단계는 CI 전용으로 분리) · 예산 가드(진입 정적 포함 0).
6. LICENSES.md 구성 항목 목록(문안은 Hemingway — 항목·출처 URL·라이선스 종류만: 킷 소스, npm 의존성 9개 라이선스(lightningcss MPL-2.0 devDep 포함), 글꼴 OFL).
7. 설계 질문 RZQ-xx(★ 포함). 예산 상향·엔진 계약·앱 새 의존성·백엔드가 필요한 것만 "사용자 질의"로 분리.

## 규칙
- 명세만 — 앱 코드 0, 외부 리서치 0(npm 라이선스 종류는 로컬 `node_modules/*/package.json`·스파이크 raw에서). Codex adversarial 1회(`--help` 금지) 반영.
- 첫 2턴 BRIEF·PROGRESS 커밋, SPEC 초안 15턴 안, 이후 보강 커밋. 명시 경로 커밋, push 0. 마감 전 `git status --short` 빈 값. 최대 55턴, 45턴부터 마감.
